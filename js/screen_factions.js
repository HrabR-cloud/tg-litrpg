/* Экран «🏛️ Фракции» (A2, Блок 4): репутация героя по фракциям — 7 тиров
   (ГЦ §9.2, ADR 13.35). Данные — POST /api/menu/factions. */
Router.register("factions", function (box) { renderFactions(box); });

async function renderFactions(box) {
  box.innerHTML = "";
  box.appendChild(Router.card(null,
    Router.el("div", "mut", "⏳ Загрузка фракций…")));
  let d = null;
  try {
    d = await Api.post("/api/menu/factions", {});
    if (!d || !d.ok) d = null;
  } catch (e) { d = null; }
  box.innerHTML = "";

  if (!d) {
    box.appendChild(Router.card("⚠️ Нет данных", Router.el("div", "mut",
      "Не удалось загрузить фракции. Бот запущен?")));
    return;
  }
  if (!d.factions || !d.factions.length) {
    box.appendChild(Router.card("🏛️ Фракции", Router.el("div", "mut",
      "В этом мире нет фракций.")));
    return;
  }

  d.factions.forEach(function (f) {
    const c = Router.card("🏛️ " + f.name);
    const bar = Router.el("div", "bar");
    bar.appendChild(Router.chip("Репутация: " + f.rep));
    bar.appendChild(Router.chip(f.tier));
    if (f.discount) {
      bar.appendChild(Router.chip(f.discount > 0
        ? ("Скидка " + f.discount + "%")
        : ("Наценка " + (-f.discount) + "%")));
    }
    if (f.hostile) bar.appendChild(Router.chip("⚔️ Охота"));
    c.appendChild(bar);
    if (f.type) c.appendChild(Router.el("div", "mut", "Тип: " + f.type));
    if (f.ideology) c.appendChild(Router.el("div", "mut", f.ideology));
    box.appendChild(c);
  });

  const tc = Router.card("📊 Тиры репутации", null);
  (d.tiers || []).forEach(function (t) {
    tc.appendChild(Router.el("div", "listrow",
      `<div><b>${t.name}</b><div class="mut">${t.lo} … ${t.hi}</div></div>`));
  });
  box.appendChild(tc);
}
