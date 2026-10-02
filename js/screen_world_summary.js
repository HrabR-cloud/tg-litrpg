/* Экран «🧭 Сводка» (A3, Блок 4): обзор активного мира одним экраном —
   игровой день/жанр, герой, группа/квесты, фракции, тогглы механик.
   Данные — POST /api/menu/world_summary. */
Router.register("world_summary", function (box) { renderWorldSummary(box); });

async function renderWorldSummary(box) {
  box.innerHTML = "";
  box.appendChild(Router.card(null,
    Router.el("div", "mut", "⏳ Загрузка сводки…")));
  let d = null;
  try {
    d = await Api.post("/api/menu/world_summary", {});
    if (!d || !d.ok) d = null;
  } catch (e) { d = null; }
  box.innerHTML = "";

  if (!d) {
    box.appendChild(Router.card("⚠️ Нет данных", Router.el("div", "mut",
      "Не удалось загрузить сводку. Бот запущен?")));
    return;
  }

  const wc = Router.card("🌍 " + (d.scenario.name || "Мир"));
  const wbar = Router.el("div", "bar");
  wbar.appendChild(Router.chip("Жанр: " + (d.scenario.genre || "—")));
  wbar.appendChild(Router.chip("Игровой день: " + d.scenario.game_day));
  wc.appendChild(wbar);
  box.appendChild(wc);

  const h = d.hero || {};
  const hc = Router.card("👤 " + (h.name || "Герой"));
  const hbar = Router.el("div", "bar");
  hbar.appendChild(Router.chip("Ур. " + h.level));
  hbar.appendChild(Router.chip("❤️ " + h.hp + "/" + h.max_hp));
  hbar.appendChild(Router.chip("💰 " + h.gold));
  hbar.appendChild(Router.chip("Репутация: " + h.reputation));
  hc.appendChild(hbar);
  if (h.location) hc.appendChild(Router.el("div", "mut", "📍 " + h.location));
  box.appendChild(hc);

  const stats = Router.card("📊 Обзор", null);
  const sg = Router.el("div", "grid2");
  sg.appendChild(Router.el("div", "chip", "🤝 Группа: " + d.party));
  sg.appendChild(Router.el("div", "chip", "📜 Квесты: " + d.quests));
  sg.appendChild(Router.el("div", "chip", "🏛️ Фракции: " + (d.factions.total || 0)));
  sg.appendChild(Router.el("div", "chip",
    "⚔️ Враждебных: " + ((d.factions.hostile || []).length)));
  stats.appendChild(sg);
  box.appendChild(stats);

  const mc = Router.card("⚙️ Механики", null);
  const LABELS = {
    mechanic_combat: "⚔️ Бой", mechanic_relations: "💞 Отношения",
    mechanic_trade: "🤝 Торговля", mechanic_quests: "📜 Квесты",
  };
  Object.keys(d.mechanics || {}).forEach(function (k) {
    const on = d.mechanics[k] !== false;
    mc.appendChild(Router.el("div", "listrow",
      `<div>${LABELS[k] || k}<div class="mut">` +
      (on ? "включено ✅" : "отключено ⛔") + `</div></div>`));
  });
  box.appendChild(mc);

  const hostile = (d.factions && d.factions.hostile) || [];
  if (hostile.length) {
    const fc = Router.card("⚠️ Враждебные фракции", null);
    hostile.forEach(function (f) {
      fc.appendChild(Router.el("div", "listrow",
        `<div><b>${f.name}</b><div class="mut">репутация ${f.rep} · ${f.tier}` +
        `</div></div>`));
    });
    box.appendChild(fc);
  }
}
