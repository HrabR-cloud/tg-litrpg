/* Меню v2, «⚖️ Арбитр»: изолированный чат + аудит решений ИИ (Jev).
ВНИМАНИЕ: канал ИЗОЛИРОВАН — разговоры не пишутся в messages.
ВНИМАНИЕ: история чата — в localStorage; решения из /api/decisions.
ВНИМАНИЕ: публичный API роутера — Router.register("arb", ...).
ВНИМАНИЕ: v88: исправлена синтаксическая ошибка v87 (лишняя скобка
в switchMode) — файл не загружался вовсе («Unexpected token ')'»).
ВНИМАНИЕ: график Fallback рисует маркеры ВСЕГДА (даже при 1 окне).
# === ТЗ v5 §10.2 / Jev-аудитор === */
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
    const chat = (m === "chat");
    chatBox.style.display = chat ? "" : "none";
    decBox.style.display = chat ? "none" : "";
    btnChat.className = chat ? "btn primary" : "btn";
    btnDec.className = chat ? "btn" : "btn primary";
    if (!chat) { loadDecisions(); }
  }
  btnChat.onclick = function () { switchMode("chat"); };
  btnDec.onclick = function () { switchMode("dec"); };

  /* ===== ЧАТ (старая логика сохранена) ===== */
  let log = [];
  try { log = JSON.parse(localStorage.getItem(ARB_KEY) || "[]"); } catch (e) { log = []; }
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
  chatBox.appendChild(Router.el("div", "mut", "Арбитр правит базу игры. Ведущий не знает об этом чате."));

  function renderChat() {
    feed.innerHTML = "";
    if (!log.length) { feed.appendChild(Router.el("div", "mut", "Арбитр: здравствуй! Скажи, что изменить в мире.")); }
    log.forEach(function (m) {
      const d = Router.el("div", "mut");
      d.style.margin = "6px 0"; d.style.whiteSpace = "pre-wrap";
      const b = document.createElement("b");
      b.textContent = (m.role === "user") ? "Вы: " : "Арбитр: ";
      d.appendChild(b); d.appendChild(document.createTextNode(m.text || ""));
      feed.appendChild(d);
    });
    feed.scrollTop = feed.scrollHeight;
  }
  async function sendMsg() {
    const text = inp.value.trim();
    if (!text) { return; }
    inp.value = "";
    log.push({ role: "user", text: text });
    renderChat();
    let reply;
    try {
      const res = await Api.post("/api/arbiter", { text: text });
      reply = (res && res.ok) ? res.reply : ("Ошибка: " + ((res && res.error) || "неизвестно"));
    } catch (e) { reply = "Ошибка сети: " + e.message; }
    log.push({ role: "ai", text: reply });
    try { localStorage.setItem(ARB_KEY, JSON.stringify(log.slice(-100))); } catch (e) {}
    renderChat();
  }
  send.onclick = sendMsg;
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { sendMsg(); } });
  renderChat();

  /* ===== РЕШЕНИЯ ИИ ===== */
  function pct(v) {
    let x = Number(v) || 0;
    if (x > 1) { x = x / 100; }
    return Math.max(0, Math.min(100, Math.round(x * 100)));
  }
  function confBar(v) {
    const p = pct(v);
    const wrap = Router.el("div", "");
    wrap.style.background = "#2d2547"; wrap.style.borderRadius = "4px";
    wrap.style.overflow = "hidden"; wrap.style.minWidth = "60px";
    const fill = Router.el("div", "");
    fill.style.width = p + "%";
    fill.style.background = (p > 70) ? "#4caf50" : ((p > 50) ? "#ff9800" : "#f44336");
    fill.style.height = "16px"; fill.style.textAlign = "center";
    fill.style.fontSize = "10px"; fill.style.color = "#fff";
    fill.textContent = p + "%";
    wrap.appendChild(fill);
    return wrap;
  }
  function fmtTime(iso) {
    if (!iso) { return ""; }
    try { return new Date(String(iso).replace(" ", "T")).toLocaleTimeString("ru-RU", { hour12: false }); }
    catch (e) { return String(iso); }
  }
  function svgEl(tag, attrs) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, String(attrs[k])); });
    return n;
  }

  async function loadDecisions() {
    decBox.innerHTML = "";
    decBox.appendChild(Router.el("div", "mut", "Загрузка…"));
    let res;
    try { res = await Api.get("/api/decisions?limit=50"); }
    catch (e) {
      decBox.innerHTML = "";
      decBox.appendChild(Router.card("❌ Ошибка сети", Router.el("div", "mut", String((e && e.message) || e))));
      return;
    }
    decBox.innerHTML = "";
    if (!res || res.ok === false) {
      decBox.appendChild(Router.card("❌ Ошибка", Router.el("div", "mut", (res && res.error) || "нет данных")));
      return;
    }
    renderDecisions(res);
  }

  function renderDecisions(res) {
    const decisions = res.decisions || [];
    const top = Router.el("div", "bar");
    top.appendChild(Router.btn("🔄 Обновить", loadDecisions, "primary"));
    decBox.appendChild(top);
    const tbl = document.createElement("table");
    tbl.style.width = "100%"; tbl.style.borderCollapse = "collapse"; tbl.style.fontSize = "12px";
    const thead = document.createElement("thead");
    const hrow = document.createElement("tr");
    ["Время", "Тип", "Действие", "Уверенность", "FB"].forEach(function (h) {
      const th = document.createElement("th"); th.textContent = h; hrow.appendChild(th);
    });
    thead.appendChild(hrow); tbl.appendChild(thead);
    const tbody = document.createElement("tbody");
    decisions.slice(0, 20).forEach(function (d) {
      const tr = document.createElement("tr");
      [fmtTime(d.created_at), d.type || "", d.action || ""].forEach(function (t) {
        const td = document.createElement("td");
        td.textContent = t; td.style.padding = "4px"; td.style.borderBottom = "1px solid #2d2547";
        tr.appendChild(td);
      });
      const tdC = document.createElement("td");
      tdC.style.padding = "4px"; tdC.style.borderBottom = "1px solid #2d2547";
      tdC.appendChild(confBar(d.confidence)); tr.appendChild(tdC);
      const tdF = document.createElement("td");
      tdF.textContent = d.fallback ? "⚠️" : "";
      tdF.style.padding = "4px"; tdF.style.borderBottom = "1px solid #2d2547";
      tr.appendChild(tdF); tbody.appendChild(tr);
      if (d.reasoning) {
        const tr2 = document.createElement("tr");
        const td2 = document.createElement("td");
        td2.colSpan = 5; td2.style.padding = "0 4px 6px"; td2.style.borderBottom = "1px solid #2d2547";
        const det = document.createElement("details");
        const sum = document.createElement("summary");
        sum.textContent = "💬 Reasoning"; sum.style.cursor = "pointer";
        det.appendChild(sum);
        const rd = Router.el("div", "mut"); rd.textContent = d.reasoning;
        det.appendChild(rd); td2.appendChild(det); tr2.appendChild(td2);
        tbody.appendChild(tr2);
      }
    });
    tbl.appendChild(tbody);
    decBox.appendChild(Router.card("Последние 20 решений", tbl));
    decBox.appendChild(Router.card("% Fallback (окна по 10)", fallbackChart(decisions)));
    decBox.appendChild(Router.card("Средняя уверенность по типам", confByType(decisions, res.metrics || {})));
  }

  function fallbackChart(decisions) {
    const pts = [];
    for (let i = 0; i < decisions.length; i += 10) {
      const w = decisions.slice(i, i + 10);
      if (!w.length) { continue; }
      let fb = 0;
      w.forEach(function (d) { if (d.fallback) { fb += 1; } });
      pts.push(Math.round((fb * 100) / w.length));
    }
    if (!pts.length) { return Router.el("div", "mut", "Нет данных"); }
    const W = 300, H = 100;
    const svg = svgEl("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H });
    let maxV = 100;
    pts.forEach(function (v) { if (v > maxV) { maxV = v; } });
    const stepX = (pts.length > 1) ? (W / (pts.length - 1)) : 0;
    if (pts.length > 1) {
      let dPath = "";
      pts.forEach(function (v, i) {
        dPath += ((i === 0) ? "M " : "L ") + (i * stepX) + " " + (H - (v / maxV) * H) + " ";
      });
      svg.appendChild(svgEl("path", { d: dPath.trim(), fill: "none", stroke: "#f44336", "stroke-width": 2 }));
    }
    pts.forEach(function (v, i) {
      const x = (pts.length > 1) ? (i * stepX) : (W / 2);
      const y = H - (v / maxV) * H;
      svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 4, fill: "#f44336" }));
      const tx = Math.max(2, Math.min(W - 30, x - 12));
      const ty = Math.max(10, y - 8);
      const t = svgEl("text", { x: tx, y: ty, fill: "#ffffff", "font-size": 10 });
      t.textContent = v + "%";
      svg.appendChild(t);
    });
    return svg;
  }

  function confByType(decisions, metrics) {
    const by = {};
    Object.keys(metrics || {}).forEach(function (t) {
      by[t] = { sum: Number((metrics[t] || {}).avg_confidence || 0), count: 1 };
    });
    if (!Object.keys(by).length) {
      decisions.forEach(function (d) {
        const t = d.type || "unknown";
        if (!by[t]) { by[t] = { sum: 0, count: 0 }; }
        by[t].sum += Number(d.confidence) || 0;
        by[t].count += 1;
      });
    }
    const keys = Object.keys(by);
    if (!keys.length) { return Router.el("div", "mut", "Нет данных"); }
    const cont = Router.el("div", "");
    keys.forEach(function (t) {
      const avg = by[t].count ? (by[t].sum / by[t].count) : 0;
      const row = Router.el("div", "bar");
      const lbl = Router.el("div", ""); lbl.textContent = t; lbl.style.flex = "1";
      const bw = Router.el("div", ""); bw.style.flex = "2";
      bw.appendChild(confBar(avg));
      row.appendChild(lbl); row.appendChild(bw);
      cont.appendChild(row);
    });
    return cont;
  }

  /* ПО УМОЛЧАНИЮ — «📊 Решения» */
  switchMode("dec");
});