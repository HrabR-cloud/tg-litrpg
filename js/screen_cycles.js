/* Экран «♾️ Циклы» (A4, Блок 4): мировые циклы — детерминированные события
   по игровому дню (CYCLE_EVENTS, ADR 13.41). Данные — POST /api/menu/cycles. */
Router.register("cycles", function (box) { renderCycles(box); });

async function renderCycles(box) {
  box.innerHTML = "";
  box.appendChild(Router.card(null,
    Router.el("div", "mut", "⏳ Загрузка циклов…")));
  let d = null;
  try {
    d = await Api.post("/api/menu/cycles", {});
    if (!d || !d.ok) d = null;
  } catch (e) { d = null; }
  box.innerHTML = "";

  if (!d) {
    box.appendChild(Router.card("⚠️ Нет данных", Router.el("div", "mut",
      "Не удалось загрузить мировые циклы. Бот запущен?")));
    return;
  }

  const hc = Router.card("♾️ Игровой день " + d.game_day);
  if (d.today && d.today.length) {
    d.today.forEach(function (f) {
      hc.appendChild(Router.el("div", "listrow", "<div>" + f + "</div>"));
    });
  } else {
    hc.appendChild(Router.el("div", "mut", "Сегодня цикловых событий нет."));
  }
  box.appendChild(hc);

  if (d.cycles && d.cycles.length) {
    const cyc = Router.card("🌍 Текущие циклы", null);
    d.cycles.forEach(function (c) {
      cyc.appendChild(Router.el("div", "listrow",
        `<div>${c.icon} <b>${c.name}</b>: ${c.phase}` +
        `<div class="mut">${c.text}</div></div>`));
    });
    box.appendChild(cyc);
  }

  if (d.world_events && d.world_events.length) {
    const we = Router.card("🔥 Активные мировые события", null);
    d.world_events.forEach(function (e) {
      we.appendChild(Router.el("div", "listrow",
        `<div>${e.icon} <b>${e.name}</b> (дни ${e.start_day}–${e.end_day})` +
        `<div class="mut">${e.description}</div></div>`));
    });
    box.appendChild(we);
  }

  if (d.upcoming_events && d.upcoming_events.length) {
    const ue = Router.card("⏳ Грядущие мировые события", null);
    d.upcoming_events.forEach(function (e) {
      const when = e.in_days === 1 ? "завтра" : ("через " + e.in_days + " дн.");
      ue.appendChild(Router.el("div", "listrow",
        `<div>${e.icon} <b>${e.name}</b> · день ${e.day} · ${when}` +
        `<div class="mut">${e.description}</div></div>`));
    });
    box.appendChild(ue);
  }

  const uc = Router.card("🔮 Ближайшие события", null);
  if (d.upcoming && d.upcoming.length) {
    d.upcoming.forEach(function (u) {
      const when = u.in_days === 1 ? "завтра" : ("через " + u.in_days + " дн.");
      uc.appendChild(Router.el("div", "listrow",
        `<div><b>День ${u.day}</b> · ${when}` +
        u.events.map(function (e) { return `<div class="mut">${e}</div>`; })
          .join("") + `</div>`));
    });
  } else {
    uc.appendChild(Router.el("div", "mut", "В ближайший месяц событий нет."));
  }
  box.appendChild(uc);

  if (d.recent && d.recent.length) {
    const rc = Router.card("🕓 Недавно", null);
    d.recent.slice().reverse().forEach(function (r) {
      const when = r.ago_days === 0 ? "сегодня" : (
        r.ago_days === 1 ? "вчера" : (r.ago_days + " дн. назад"));
      rc.appendChild(Router.el("div", "listrow",
        `<div><b>День ${r.day}</b> · ${when}` +
        r.events.map(function (e) { return `<div class="mut">${e}</div>`; })
          .join("") + `</div>`));
    });
    box.appendChild(rc);
  }

  const cc = Router.card("📖 Каталог циклов", null);
  (d.catalog || []).forEach(function (c) {
    cc.appendChild(Router.el("div", "listrow",
      `<div>${c.icon} ${c.text}<div class="mut">каждые ` +
      `${c.period} дн. (смещение ${c.offset})</div></div>`));
  });
  box.appendChild(cc);
}
