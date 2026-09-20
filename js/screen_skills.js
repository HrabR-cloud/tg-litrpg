/* Меню v2, экран «⚔️ Умения» (кнопка с вкладки «Герой», решение владельца
   18.09.2026): боевые + НЕбоевые умения героя с ПОЛНЫМИ параметрами рядом
   с названием (урон, кулдаун, бонус скорости, модификаторы, описание).
   ВНИМАНИЕ: данные — hero.skills из /api/menu/state (починка чтения
   character_skills 18.09.2026: дедупликация + проверка по каталогу).
   ВНИМАНИЕ (R-08): правка чисел — через карточку умения (✏️). */
Router.register("skills", function (box) {
  const st = Api.stateCache || {};
  const sk = (st.hero || {}).skills || { combat: [], noncombat: [] };

  function paramsLine(s) {
    const parts = [];
    if (s.dmg != null) parts.push("урон " + s.dmg);
    if (s.cd != null) parts.push("кулдаун " + s.cd);
    if (s.sb != null) parts.push("скорость " + (s.sb > 0 ? "+" : "") + s.sb);
    const mods = Object.entries(s.mods || {});
    mods.forEach(function ([k, v]) {
      parts.push((STAT_ICON[k] || "▪️") + " " + (STAT_RU[k] || k) + " " +
        (v > 0 ? "+" : "") + v);
    });
    return parts.join(" · ") || "без чисел";
  }
  function section(title, list, entity) {
    const c = Router.card(title + " (" + list.length + ")", null);
    if (!list.length) c.appendChild(Router.el("div", "mut", "Нет умений."));
    list.forEach(function (s) {
      const row = Router.el("div", "listrow");
      row.innerHTML = "<div style='flex:1;'><b>" + s.name + "</b>" +
        "<div class='mut'>" + paramsLine(s) + "</div>" +
        (s.desc ? "<div class='mut'>" + s.desc + "</div>" : "") + "</div>";
      row.onclick = function () {
        Router.open("skill", { entity: entity, id: s.id });
      };
      c.appendChild(row);
    });
    box.appendChild(c);
  }

  section("⚔️ Боевые", sk.combat || [], "cskill");
  section("🕊️ Небоевые", sk.noncombat || [], "nskill");
  box.appendChild(Router.el("div", "mut",
    "Tap по умению — карточка с редактором чисел (✏️)."));
  box.appendChild(Router.viewBar(null));
});