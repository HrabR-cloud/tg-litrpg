/* Меню v2, «⚖️ Арбитр»: изолированный чат + аудит решений ИИ.
ВНИМАНИЕ: канал ИЗОЛИРОВАН — разговоры не пишутся в messages, Ведущий и
NPC о них не знают; Арбитр вносит правки БД по текстовым запросам.
ВНИМАНИЕ: история чата — в localStorage; решения грузятся из /api/decisions.
ВНИМАНИЕ: экран НЕ ЛОМАЕТ публичный API Router.register("arb", ...).
# === ТЗ v5 §10.2 / Jev-аудитор ===
*/
const ARB_KEY = "arbiter_chat_v1";
Router.register("arb", function (box) {
  // --- Переключатель: Чат / Решения ---
  const tabs = Router.el("div", "bar");
  const btnChat = Router.btn("💬 Чат", null, "");
  const btnDec = Router.btn("📊 Решения", null, "primary");
  tabs.appendChild(btnChat); tabs.appendChild(btnDec);
  box.appendChild(tabs);
  const chatBox = Router.el("div", "");
  const decBox = Router.el("div", "");
  box.appendChild(chatBox); box.appendChild(decBox);
  decBox.style.display = "none";

  function switchMode(m) {
    chatBox.style.display = (m === "chat") ? "" : "none";
    decBox.style.display = (m === "decisions") ? "" : "none";
    btnChat.className = "btn" + (m === "chat" ? " primary" : "");
    btnDec.className = "btn" + (m === "decisions" ? " primary" : "");
    if (m === "decisions") loadDecisions();
  }
  btnChat.onclick = function () { switchMode("chat"); };
  btnDec.onclick = function () { switchMode("decisions"); };

  // === ЧАТ (текущая логика сохранена полностью) ===
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
      d.appendChild(b); d.appendChild(document.createTextNode(m.text || ""));
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
      log.push({ role: "ai", text: (res && res.ok)
        ? res.reply : ("Ошибка: " + ((res && res.error) || "неизвестно")) });
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

  // === РЕШЕНИЯ ИИ (Jev-аудитор) ===
  async function loadDecisions() {
    decBox.innerHTML = "";
    decBox.appendChild(Router.el("div", "mut", "Загрузка…"));
    try {
      const res = await Api.get("/api/decisions?limit=50");
      if (!res || !res.ok) {
        decBox.innerHTML = "";
        decBox.appendChild(Router.card("❌ Ошибка",
          Router.el("div", "mut", (res && res.error) || "нет данных")));
        return;
      }
      renderDecisions(res);
    } catch (e) {
      decBox.innerHTML = "";
      decBox.appendChild(Router.card("❌ Ошибка сети",
        Router.el("div", "mut", e.message)));
    }
  }

  function fmtTime(iso) {
    if (!iso) return "";
    try { return new Date(iso.replace(" ", "T")).toLocaleTimeString(); }
    catch (e) { return iso; }
  }
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

  function renderDecisions(res) {
    decBox.innerHTML = "";
    const decisions = res.decisions || [];
    const metrics = res.metrics || {};
    const rbar = Router.el("div", "bar");
    rbar.appendChild(Router.btn("🔄 Обновить", loadDecisions, "primary"));
    decBox.appendChild(rbar);

    // Таблица последних 20 решений
    const tbl = Router.el("table", "");
    tbl.style.width = "100%"; tbl.style.borderCollapse = "collapse";
    tbl.style.fontSize = "12px";
    const thead = Router.el("thead", "");
    thead.innerHTML = "<tr><th>Время</th><th>Тип</th><th>Действие</th>" +
      "<th>Уверенность</th><th>FB</th></tr>";
    tbl.appendChild(thead);
    const tbody = Router.el("tbody", "");
    decisions.slice(0, 20).forEach(function (d) {
      const tr = Router.el("tr", "");
      tr.appendChild(Router.el("td", "", fmtTime(d.created_at)));
      tr.appendChild(Router.el("td", "", d.type || ""));
      tr.appendChild(Router.el("td", "", d.action || ""));
      const tdC = Router.el("td", ""); tdC.appendChild(confBar(d.confidence));
      tr.appendChild(tdC);
      tr.appendChild(Router.el("td", "", d.fallback ? "⚠️" : ""));
      tbody.appendChild(tr);
      if (d.reasoning) {
        const tr2 = Router.el("tr", "");
        const td2 = Router.el("td", ""); td2.colSpan = 5;
        const det = document.createElement("details");
        const sum = Router.el("summary", "", "💬 Reasoning");
        det.appendChild(sum);
        det.appendChild(Router.el("div", "mut", d.reasoning));
        td2.appendChild(det); tr2.appendChild(td2);
        tbody.appendChild(tr2);
      }
    });
    tbl.appendChild(tbody);
    decBox.appendChild(Router.card("Последние 20 решений", tbl));

    // График % fallback (окна по 10 решений)
    decBox.appendChild(Router.card("% Fallback (окна по 10)",
      renderFallbackChart(decisions)));
    // Среднее confidence по типам
    decBox.appendChild(Router.card("Средняя уверенность по типам",
      renderConfidenceByType(decisions, metrics)));
  }

  function renderFallbackChart(decisions) {
    const winSize = 10, points = [];
    for (let i = 0; i < decisions.length; i += winSize) {
      const win = decisions.slice(i, i + winSize);
      if (!win.length) continue;
      const fb = win.filter(function (d) { return d.fallback; }).length;
      points.push(Math.round((fb / win.length) * 100));
    }
    if (!points.length) return Router.el("div", "mut", "Нет данных");
    const W = 300, H = 100;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    const maxV = Math.max.apply(null, points.concat([100]));
    const stepX = W / Math.max(points.length - 1, 1);
    let path = "";
    points.forEach(function (v, i) {
      const x = i * stepX;
      const y = H - (v / maxV) * H;
      path += (i === 0 ? "M" : "L") + " " + x + " " + y;
    });
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", path);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#f44336");
    p.setAttribute("stroke-width", "2");
    svg.appendChild(p);
    return svg;
  }

  function renderConfidenceByType(decisions, metrics) {
    const byType = {};
    Object.keys(metrics || {}).forEach(function (t) {
      byType[t] = { sum: Number(metrics[t].avg_confidence || 0), count: 1 };
    });
    if (!Object.keys(byType).length) {
      decisions.forEach(function (d) {
        const t = d.type || "unknown";
        if (!byType[t]) byType[t] = { sum: 0, count: 0 };
        byType[t].sum += (d.confidence || 0);
        byType[t].count += 1;
      });
    }
    const keys = Object.keys(byType);
    if (!keys.length) return Router.el("div", "mut", "Нет данных");
    const cont = Router.el("div", "");
    keys.forEach(function (t) {
      const avg = byType[t].count ? byType[t].sum / byType[t].count : 0;
      const row = Router.el("div", "bar");
      const lbl = Router.el("div", "", t);
      lbl.style.flex = "1";
      const barWrap = Router.el("div", "");
      barWrap.style.flex = "2";
      barWrap.appendChild(confBar(avg));
      row.appendChild(lbl); row.appendChild(barWrap);
      cont.appendChild(row);
    });
    return cont;
  }

  // По умолчанию показываем решения (новая функциональность)
  switchMode("decisions");
});