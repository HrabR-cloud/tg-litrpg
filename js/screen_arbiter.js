/* === Экран «Арбитр»: аудит решений ИИ (Jev) ===
 * ВНИМАНИЕ: вкладка «Решения» открывается ПО УМОЛЧАНИЮ.
 * ВНИМАНИЕ: чат изолирован и живёт в localStorage (поведение сохранено).
 * ВНИМАНИЕ: бары уверенности: >70 зелёный, >50 оранжевый, иначе красный.
 * ВНИМАНИЕ: график Fallback рисует маркеры всегда (даже при 1 окне).
 * # === ТЗ §10.2 / Jev-аудитор ===
 */
(function () {
  "use strict";

  var LS_CHAT = "arbiter_chat_log_v1";

  function el(tag, cls, txt) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (txt !== undefined && txt !== null) d.textContent = txt;
    return d;
  }
  function card(title, body) {
    var c = el("div", "card");
    c.appendChild(el("div", "card-title", title));
    if (body) c.appendChild(body);
    return c;
  }
  function btn(txt, onClick, cls) {
    var b = el("button", cls || "btn", txt);
    b.addEventListener("click", onClick);
    return b;
  }

  function loadChat() {
    try { return JSON.parse(localStorage.getItem(LS_CHAT) || "[]"); }
    catch (e) { return []; }
  }
  function saveChat(log) {
    try { localStorage.setItem(LS_CHAT, JSON.stringify(log.slice(-100))); }
    catch (e) {}
  }

  function pct(v) {
    var x = Number(v) || 0;
    return Math.max(0, Math.min(100, Math.round(x * 100)));
  }
  function confColor(p) {
    if (p > 70) return "#4caf50";
    if (p > 50) return "#ff9800";
    return "#f44336";
  }
  function confBar(v) {
    var p = pct(v);
    var wrap = el("div", "conf-wrap");
    wrap.style.background = "#2d2547";
    wrap.style.borderRadius = "4px";
    wrap.style.overflow = "hidden";
    wrap.style.minWidth = "60px";
    var fill = el("div", "conf-fill");
    fill.style.width = p + "%";
    fill.style.background = confColor(p);
    fill.style.height = "16px";
    fill.style.textAlign = "center";
    fill.style.fontSize = "10px";
    fill.style.color = "#fff";
    fill.textContent = p + "%";
    wrap.appendChild(fill);
    return wrap;
  }
  function fmtTime(iso) {
    if (!iso) return "";
    try {
      var d = new Date(String(iso).replace(" ", "T"));
      return d.toLocaleTimeString("ru-RU", { hour12: false });
    } catch (e) { return String(iso); }
  }

  /* ---------- вкладка «Решения» ---------- */
  function renderDecisionsTab(host) {
    host.innerHTML = "";
    var bar = el("div", "bar");
    bar.appendChild(btn("🔄 Обновить", function () { load(); }, "btn primary"));
    host.appendChild(bar);

    var listHost = el("div", "");
    host.appendChild(listHost);

    function load() {
      listHost.innerHTML = "";
      listHost.appendChild(el("div", "mut", "Загрузка…"));
      Api.get("/api/decisions?limit=50").then(function (res) {
        listHost.innerHTML = "";
        if (!res || res.ok === false) {
          listHost.appendChild(card("❌ Ошибка",
            el("div", "mut", (res && res.error) || "нет данных")));
          return;
        }
        var decisions = res.decisions || [];
        var metrics = res.metrics || {};

        /* таблица последних 20 */
        var tbl = el("table", "tbl");
        tbl.style.width = "100%";
        tbl.style.borderCollapse = "collapse";
        tbl.style.fontSize = "12px";
        var thead = el("thead", "");
        var hr = el("tr", "");
        ["Время", "Тип", "Действие", "Уверенность", "FB"].forEach(function (h) {
          hr.appendChild(el("th", "", h));
        });
        thead.appendChild(hr);
        tbl.appendChild(thead);
        var tbody = el("tbody", "");
        decisions.slice(0, 20).forEach(function (d) {
          var tr = el("tr", "");
          tr.appendChild(el("td", "", fmtTime(d.created_at)));
          tr.appendChild(el("td", "", d.type || ""));
          tr.appendChild(el("td", "", d.action || ""));
          var tdC = el("td", ""); tdC.appendChild(confBar(d.confidence));
          tr.appendChild(tdC);
          tr.appendChild(el("td", "", d.fallback ? "⚠️" : ""));
          tbody.appendChild(tr);
          if (d.reasoning) {
            var tr2 = el("tr", "");
            var td2 = el("td", ""); td2.colSpan = 5;
            var det = document.createElement("details");
            var sum = el("summary", "", "💬 Reasoning");
            det.appendChild(sum);
            det.appendChild(el("div", "mut", d.reasoning));
            td2.appendChild(det);
            tr2.appendChild(td2);
            tbody.appendChild(tr2);
          }
        });
        tbl.appendChild(tbody);
        listHost.appendChild(card("Последние 20 решений", tbl));

        /* график % Fallback (окна по 10) */
        listHost.appendChild(card("% Fallback (окна по 10)",
          renderFallbackChart(decisions)));

        /* средняя уверенность по типам */
        listHost.appendChild(card("Средняя уверенность по типам",
          renderConfidenceByType(decisions, metrics)));
      }).catch(function (e) {
        listHost.innerHTML = "";
        listHost.appendChild(card("❌ Ошибка сети", el("div", "mut", String(e))));
      });
    }

    function renderFallbackChart(decisions) {
      var winSize = 10, points = [];
      for (var i = 0; i < decisions.length; i += winSize) {
        var win = decisions.slice(i, i + winSize);
        if (!win.length) continue;
        var fb = win.filter(function (d) { return d.fallback; }).length;
        points.push(Math.round((fb / win.length) * 100));
      }
      if (!points.length) return el("div", "mut", "Нет данных");

      var W = 300, H = 100;
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var maxV = Math.max.apply(null, points.concat([100]));
      var stepX = points.length > 1 ? W / (points.length - 1) : 0;

      /* линия — только при ≥2 точках */
      if (points.length > 1) {
        var dPath = "";
        points.forEach(function (v, idx) {
          var x = idx * stepX;
          var y = H - (v / maxV) * H;
          dPath += (idx === 0 ? "M" : "L") + " " + x + " " + y + " ";
        });
        var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", dPath.trim());
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", "#f44336");
        p.setAttribute("stroke-width", "2");
        svg.appendChild(p);
      }

      /* маркеры — ВСЕГДА (видны даже при 1 окне) */
      points.forEach(function (v, idx) {
        var x = points.length > 1 ? idx * stepX : W / 2;
        var y = H - (v / maxV) * H;
        var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", x);
        c.setAttribute("cy", y);
        c.setAttribute("r", 4);
        c.setAttribute("fill", "#f44336");
        svg.appendChild(c);
        var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", Math.min(W - 24, Math.max(2, x - 10)));
        t.setAttribute("y", Math.max(10, y - 8));
        t.setAttribute("fill", "#fff");
        t.setAttribute("font-size", "10");
        t.textContent = v + "%";
        svg.appendChild(t);
      });
      return svg;
    }

    function renderConfidenceByType(decisions, metrics) {
      var byType = {};
      decisions.forEach(function (d) {
        var t = d.type || "unknown";
        if (!byType[t]) byType[t] = { sum: 0, count: 0 };
        byType[t].sum += Number(d.confidence) || 0;
        byType[t].count += 1;
      });
      var keys = Object.keys(byType);
      if (!keys.length) return el("div", "mut", "Нет данных");
      var cont = el("div", "");
      keys.forEach(function (t) {
        var avg = byType[t].count ? byType[t].sum / byType[t].count : 0;
        var row = el("div", "bar");
        var lbl = el("div", "", t);
        lbl.style.flex = "1";
        var bw = el("div", "");
        bw.style.flex = "2";
        bw.appendChild(confBar(avg));
        row.appendChild(lbl);
        row.appendChild(bw);
        cont.appendChild(row);
      });
      return cont;
    }

    load();
  }

  /* ---------- вкладка «Чат» (изолирована, localStorage) ---------- */
  function renderChatTab(host) {
    host.innerHTML = "";
    var log = loadChat();
    var feed = el("div", "feed");
    feed.style.maxHeight = "50vh";
    feed.style.overflowY = "auto";
    host.appendChild(feed);

    function draw() {
      feed.innerHTML = "";
      if (!log.length) {
        feed.appendChild(el("div", "mut",
          "Арбитр: здравствуй! Скажи, что изменить в мире."));
        return;
      }
      log.forEach(function (m) {
        var d = el("div", "mut");
        d.style.margin = "6px 0";
        d.style.whiteSpace = "pre-wrap";
        var b = el("b", "", m.role === "user" ? "Вы: " : "Арбитр: ");
        d.appendChild(b);
        d.appendChild(document.createTextNode(m.text || ""));
        feed.appendChild(d);
      });
      feed.scrollTop = feed.scrollHeight;
    }

    var inp = el("input", "inp");
    inp.placeholder = "Запрос арбитру…";
    var send = btn("➤ Отправить", function () {
      var text = (inp.value || "").trim();
      if (!text) return;
      inp.value = "";
      log.push({ role: "user", text: text });
      draw(); saveChat(log);
      Api.post("/api/arbiter_chat", { text: text }).then(function (res) {
        log.push({ role: "ai", text: (res && res.reply) || "…" });
      }).catch(function (e) {
        log.push({ role: "ai", text: "Ошибка сети: " + e });
      }).then(function () { draw(); saveChat(log); });
    }, "btn primary");
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") send.click();
    });
    var bar = el("div", "bar");
    bar.appendChild(inp);
    bar.appendChild(send);
    host.appendChild(bar);
    draw();
  }

  /* ---------- каркас экрана: вкладки ---------- */
  Screen.register("arbiter", function (host) {
    host.innerHTML = "";
    var tabs = el("div", "tabs");
    var body = el("div", "");
    var tChat = btn("💬 Чат", function () { pick("chat"); }, "btn tab");
    var tDec = btn("📊 Решения", function () { pick("dec"); }, "btn tab primary");
    tabs.appendChild(tChat);
    tabs.appendChild(tDec);
    host.appendChild(tabs);
    host.appendChild(body);

    function pick(which) {
      tChat.className = "btn tab" + (which === "chat" ? " primary" : "");
      tDec.className = "btn tab" + (which === "dec" ? " primary" : "");
      if (which === "chat") renderChatTab(body);
      else renderDecisionsTab(body);
    }
    /* ПО УМОЛЧАНИЮ — «Решения» */
    pick("dec");
  });
})();