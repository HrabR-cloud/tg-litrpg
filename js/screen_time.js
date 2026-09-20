/* Меню v2, вкладка «⏰ Время» (P0-2): часы, быстрые переходы, точный ввод,
   календарь, ретроспектива (ТЗ v5 §10.2, СС §23.4–23.6).
   ВНИМАНИЕ: экран САМ запрашивает /api/time при каждом входе — кэш state
   может быть пустым/устаревшим.
   ВНИМАНИЕ (фикс 16.09.2026 v6): перемотка выполняется ДО любых toast;
   toast безопасен (api.js v6); ретроспектива рисуется карточкой сверху. */
Router.register("time", function (box) {
  renderTime(box, null);
});

async function renderTime(box, retro) {
  box.innerHTML = "";
  box.appendChild(Router.card(null,
    Router.el("div", "mut", "⏳ Загрузка времени…")));
  let t = null;
  try {
    t = await Api.post("/api/time", {});
    if (!t || !t.ok) t = null;
  } catch (e) { t = null; }
  box.innerHTML = "";

  /* Ретроспективная сводка после перемотки (СС §23.5–23.6) */
  if (retro && retro.length) {
    const rc = Router.card("📜 За пропущенное время", null);
    retro.forEach(function (f) {
      rc.appendChild(Router.el("div", "listrow", `<div>${f}</div>`));
    });
    box.appendChild(rc);
  }
  if (!t) {
    box.appendChild(Router.card("⚠️ Нет времени", Router.el("div", "mut",
      "Не удалось загрузить /api/time. Бот запущен?")));
    return;
  }
  Api.stateCache = Api.stateCache || {};
  Api.stateCache.time = t;

  /* === Часы === */
  const clock = Router.el("div", "card pad");
  clock.innerHTML =
    `<h3 style="text-align:center;margin:0 0 6px;font-size:26px;">🕐 ${t.time}</h3>` +
    `<div style="text-align:center;font-weight:600;">${t.day_of_week}, ${t.date}</div>` +
    `<div style="text-align:center;color:#b9b0d8;font-size:13px;margin-top:4px;">` +
    `${t.season} · ${t.temperature}°C · ${t.weather}` +
    (t.holiday ? `<br>🎉 ${t.holiday}` : "") + `</div>`;
  box.appendChild(clock);

  /* === Быстрые переходы (динамически по текущему часу, СС §23.4) === */
  const h = Math.floor((t.minute || 0) / 60);
  const targets = [];
  if (h < 18) targets.push(["today_evening", "Сегодня, 18:00"]);
  if (h < 22) targets.push(["today_night", "Сегодня, 22:00"]);
  targets.push(["tomorrow_morning", "Завтра, 08:00"]);
  targets.push(["tomorrow_evening", "Завтра, 19:00"]);
  const qc = Router.card("⏩ Быстрый переход", null);
  const qg = Router.el("div", "grid2");
  targets.forEach(function ([id, lb]) {
    qg.appendChild(Router.btn(lb, function () {
      doRewind(box, { target: id });
    }, "primary"));
  });
  qc.appendChild(qg);
  box.appendChild(qc);

  /* === Точный ввод === */
  const pc = Router.card("⌨️ Точное время", null);
  const row = Router.el("div", "bar");
  const hIn = document.createElement("input");
  hIn.type = "number"; hIn.min = 0; hIn.max = 23; hIn.placeholder = "ЧЧ";
  const mIn = document.createElement("input");
  mIn.type = "number"; mIn.min = 0; mIn.max = 59; mIn.placeholder = "ММ";
  row.appendChild(hIn);
  row.appendChild(mIn);
  row.appendChild(Router.btn("Перемотать", function () {
    const hh = parseInt(hIn.value, 10), mm = parseInt(mIn.value, 10);
    if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      Api.toast("Неверное время");
      return;
    }
    doRewind(box, { hour: hh, minute: mm });
  }, "primary"));
  pc.appendChild(row);
  box.appendChild(pc);

  /* === Календарь месяца с праздниками (СС §23.7.5) === */
  if (t.calendar) {
    const cc = Router.card("📅 Календарь", null);
    const pre = Router.el("div", "mut");
    pre.style.whiteSpace = "pre-wrap";
    pre.style.fontFamily = "monospace";
    pre.style.fontSize = "12px";
    pre.textContent = t.calendar;
    cc.appendChild(pre);
    box.appendChild(cc);
  }
}

async function doRewind(box, body) {
  try {
    const res = await Api.post("/api/menu/time/rewind", body);
    if (!res || !res.ok) {
      Api.toast((res && res.error) || "Ошибка перемотки");
      return;
    }
    await renderTime(box, res.retrospect || []);
  } catch (e) {
    Api.toast("Ошибка сети: " + e.message);
  }
}