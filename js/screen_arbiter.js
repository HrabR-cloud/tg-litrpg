/* Меню v2, «⚖️ Арбитр»: изолированный чат + аудит решений ИИ (Jev).
ВНИМАНИЕ: канал ИЗОЛИРОВАН — разговоры не пишутся в messages.
ВНИМАНИЕ: история чата — в localStorage; решения из /api/decisions.
ВНИМАНИЕ: публичный API роутера — Router.register("arb", ...);
   ошибка v85 «Screen.register is not a function» устранена.
ВНИМАНИЕ: график Fallback рисует маркеры ВСЕГДА (даже при 1 окне).
# === ТЗ v5 §10.2 / Jev-аудитор ===
*/
const ARB_KEY = "arbiter_chat_v1";

Router.register("arb", function (box) {
  const btnChat = Router.btn("💬 Чат", null, "");
  const btnDec = Router.btn("📊 Решения", null, "primary");
  const tabs = Router.el("div", "bar");
  tabs.appendChild(btnChat); tabs.appendChild(btnDec);
  box.appendChild(tabs);
  const chatBox = Router.el("div", "");
  const decBox = Router.el("div", "");
  box.appendChild(chatBox); box.appendChild(decBox);

  function switchMode(m) {
    chatBox.style.display = (m === "chat") ? "" : "none";
    decBox.style.display = (m === "dec") ? "" : "none";
    btnChat.className = "btn" + (m === "chat" ? " primary" : "");
    btnDec.className = "btn" + (m === "dec") ? " primary" : "");
    if (m === "dec") loadDecisions();
  }
  btnChat.onclick = function () { switchMode("chat"); };
  btnDec.onclick = function () { switchMode("dec"); };

  /* ===== ЧАТ (старая логика сохранена полностью) ===== */
  let log = [];
  try { log = JSON.parse(localStorage.getItem(ARB_KEY) || "[]"); } catch (e) {}
  const feed = Router.el("div", "card pad");
  feed.style.maxHeight = "55vh"; feed.style.overflowY = "auto";
  chatBox.appendChild(feed);
  const bar = Router.el("div", "bar");
  const inp = document.createElement("input");
  inp.placeholder = "Запрос Арбитру: создать/изменить/удалить…";
  inp.style.flex = "3"; bar.appendChild(inp);
  const send = Router.btn("➤ Отправить", null, "primary");
  send.style.flex = "1"; bar.appendChild(send);
  chatBox.appendChild(bar);
  chatBox.appendChild(Router.el("div", "mut",
    "Арбитр правит базу игры. Ведущий не знает об этом чате."));

  function renderChat() {
    feed.innerHTML = "";
    if (!log.length) feed.appendChild(Router.el("div", "mut",
      "Арбитр: здравствуй! Скажи, что изменить в мире: создать NPC, " +
      "поменять локацию, удалить предмет…"));
    log.forEach(function (m) {
      const d = Router.el("div", "mut");
      d.style.margin = "6px 0"; d.style.whiteSpace = "pre-wrap";
      const b = document.createElement("b");
      b.textContent = (m.role === "user" ? "Вы: " : "Арбитр: ");
      d.appendChild(b);
      d.appendChild(document.createTextNode(m.text || ""));
      feed.appendChild(d);
    });
    feed.scrollTop = feed.scrollHeight;
  }
  async function sendMsg() {
    const text = inp.value.trim();
    if (!text) return;
    inp.value = "";
    log.push({ role: "user", text: text }); renderChat();
    try {
      const res = await Api.post("/api/arbiter", { text: text });
      log.push({ role: "ai", text: (res && res.ok) ? res.reply
        : ("Ошибка: " + ((res && res.error) || "неизвестно")) });
    } catch (e) {
      log.push({ role: "ai", text: "Ошибка сети: " + e.message });
    }
    try { localStorage.setItem(ARB_KEY, JSON.stringify(log.slice(-100))); }
    catch (e) {}
    renderChat();
  }
  send.onclick = sendMsg;
  inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMsg();
  });
  renderChat();

  /* ===== РЕШЕНИЯ ИИ ===== */
  function pct(v) {
    let x = Number(v) || 0;
    if (x > 1) x = x / 100;
    return Math.max(0, Math.min(100, Math.round(x * 100)));
  }
  function confBar(v) {
    const p = pct(v);
    const wrap = Router.el("div", "");
    wrap.style.background = "#2d2547"; wrap.style.borderRadius = "4px";
    wrap.style.overflow = "hidden"; wrap.style.minWidth = "60px";
    const fill = Router.el("div", "");
    fill.style.width = p + "%";
    fill.style.background = p > 70 ? "#4caf50" : (p > 50 ? "#ff9800" : "#f44336");
    fill.style.height = "16px"; fill.style.textAlign = "center";
    fill.style.fontSize = "10px"; fill.style.color = "#fff";
    fill.textContent = p + "%";
    wrap.appendChild(fill);
    return wrap;
  }
  function fmtTime(iso) {
    if (!iso) return "";
    try {
      return new Date(String(iso).replace(" ", "T"))
        .toLocaleTimeString("ru-RU", { hour12: false });
    } catch (e) { return String(iso); }
  }

  async function loadDecisions() {
    decBox.innerHTML = "";
    decBox.appendChild(Router.el("div", "mut", "Загрузка…"));
    try {
      const res = await Api.get("/api/decisions?limit=50");
      decBox.innerHTML = "";
      if (!res || res.ok === false) {
        decBox.appendChild(Router.card("❌ Ошибка",
          Router.el("div", "mut", (res && res.error) || "нет данных")));
        return;
      }
      renderDecisions(res);
    } catch (e) {
      decBox.innerHTML = "";
      decBox.appendChild(Router.card("❌ Ошибка сети",
        Router.el("div", "mut", String((e && e.message) || e))));
    }
  }

  function renderDecisions(res) {
    const decisions = res.decisions || [];
    const metrics = res.metrics || {};
    const top = Router.el("div", "bar");
    top.appendChild(Router.btn("🔄 Обновить", loadDecisions, "primary"));
    decBox.appendChild(top);

    const tbl = document.createElement("table");
    tbl.style.width = "100%"; tbl.style.borderCollapse = "collapse";
    tbl.style.fontSize = "12px";
    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    ["Время", "Тип", "Действие", "Уверенность", "FB"].forEach(function (h) {
      const th = document.createElement("th");
      th.textContent = h; hr.appendChild(th);
    });
    thead.appendChild(hr); tbl.appendChild(thead);
    const tbody = document.createElement("tbody");
    decisions.slice(0, 20).forEach(function (d) {
      const tr = document.createElement("tr");
      [fmtTime(d.created_at), d.type || "", d.action || ""].forEach(function (t) {
        const td = document.createElement("td");
        td.textContent = t; td.style.padding = "4px";
        td.style.borderBottom = "1px solid #2d2547";
        tr.appendChild(td);
      });
      const tdC = document.createElement("td");
      tdC.style.padding = "4px"; tdC.style.borderBottom = "1px solid #2d2547";
      tdC.appendChild(confBar(d.confidence));
      tr.appendChild(tdC);
      const tdF = document.createElement("td");
      tdF.textContent = d.fallback ? "⚠️" : "";
      tdF.style.padding = "4px"; tdF.style.borderBottom = "1px solid #2d2547";
      tr.appendChild(tdF);
      tbody.appendChild(tr);
      if (d.reasoning) {
        const tr2 = document.createElement("tr");
        const td2 = document.createElement("td");
        td2.colSpan = 5; td2.style.padding = "0 4px 6px";
        td2.style.borderBottom = "1px solid #2d2547";
        const det = document.createElement("details");
        const sum = document.createElement("summary");
        sum.textContent = "💬 Reasoning"; sum.style.cursor = "pointer";
        det.appendChild(sum);
        const rd = Router.el("div", "mut");
        rd.textContent = d.reasoning;
        det.appendChild(rd);
        td2.appendChild(det); tr2.appendChild(td2);
        tbody.appendChild(tr2);
      }
    });
    tbl.appendChild(tbody);
    decBox.appendChild(Router.card("Последние 20 решений", tbl));
    decBox.appendChild(Router.card("% Fallback (окна по 10)",
      fallbackChart(decisions)));
    decBox.appendChild(Router.card("Средняя уверенность по типам",
      confByType(decisions, metrics)));
  }

  function fallbackChart(decisions) {
    const win = 10, pts = [];
    for (let i = 0; i < decisions.length; i += win) {
      const w = decisions.slice(i, i + win);
      if (!w.length) continue;
      const fb = w.filter(function (d) { return d.fallback; }).length;
      pts.push(Math.round((fb * 100) / w.length));
    }
    if (!pts.length) return Router.el("div", "mut", "Нет данных");
    const W = 300, H = 100;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    const maxV = Math.max.apply(null, pts.concat([100]));
    const stepX = pts.length > 1 ? W / (pts.length - 1) : 0;
    if (pts.length > 1) {
      let dPath = "";
      pts.forEach(function (v, i) {
        const x = i * stepX, y = H - (v / maxV) * H;
        dPath += (i === 0 ? "M" : "L") + " " + x + " " + y + " ";
      });
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", dPath.trim());
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "#f44336");
      p.setAttribute("stroke-width", "2");
      svg.appendChild(p);
    }
    pts.forEach(function (v, i) {
      const x = pts.length > 1 ? i * stepX : W / 2;
      const y = H - (v / maxV) * H;
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y);
      c.setAttribute("r", 4); c.setAttribute("fill", "#f44336");
      svg.appendChild(c);
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", Math.max(2, Math.min(W - 30, x - 12)));
      t.setAttribute("y", Math.max(10, y - 8));
      t.setAttribute("fill", "#ffffff"); t.setAttribute("font-size", "10");
      t.textContent = v + "%";
      svg.appendChild(t);
    });
    return svg;
  }

  function confByType(decisions, metrics) {
    const by = {};
    Object.keys(metrics || {}).forEach(function (t) {
      const m = metrics[t] || {};
      by[t] = { sum: Number(m.avg_confidence || 0), count: 1 };
    });
    if (!Object.keys(by).length) {
      decisions.forEach(function (d) {
        const t = d.type || "unknown";
        if (!by[t]) by[t] = { sum: 0, count: 0 };
        by[t].sum += Number(d.confidence) || 0;
        by[t].count += 1;
      });
    }
    const keys = Object.keys(by);
    if (!keys.length) return Router.el("div", "mut", "Нет данных");
    const cont = Router.el("div", "");
    keys.forEach(function (t) {
      const avg = by[t].count ? by[t].sum / by[t].count : 0;
      const row = Router.el("div", "bar");
      const lbl = Router.el("div", "");
      lbl.textContent = t; lbl.style.flex = "1";
      const bw = Router.el("div", "");
      bw.style.flex = "2"; bw.appendChild(confBar(avg));
      row.appendChild(lbl); row.appendChild(bw);
      cont.appendChild(row);
    });
    return cont;
  }

  /* ПО УМОЛЧАНИЮ — «📊 Решения» */
  switchMode("dec");
});