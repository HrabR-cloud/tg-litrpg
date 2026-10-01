/* Экран «Настройки»: тогглы механик (бой/отношения/торговля/квесты).
   Читает Api.stateCache.mechanics; переключение → POST /api/menu/action
   action=mechanic_toggle, params={key, value}. Отключение НЕ удаляет данные. */
(function () {
  const KEYS = [
    ["mechanic_combat", "⚔️", "Бой"],
    ["mechanic_relations", "💞", "Отношения"],
    ["mechanic_trade", "🤝", "Торговля"],
    ["mechanic_quests", "📜", "Квесты"],
  ];

  function renderSettings(box) {
    const st = Api.stateCache || {};
    const mech = st.mechanics || {};

    KEYS.forEach(function (item) {
      const key = item[0], ic = item[1], label = item[2];
      const on = mech[key] !== false;

      const row = Router.card(ic + " " + label);
      row.appendChild(Router.el("div", "mut",
        on ? "Механика активна." : "Механика отключена."));

      const sw = Router.btn(on ? "Включено ✅" : "Выключено ⛔",
        async function () {
          try {
            const r = await Api.post("/api/menu/action", {
              action: "mechanic_toggle",
              params: { key: key, value: !on },
            });
            if (r && r.ok) {
              Api.stateCache.mechanics = r.mechanics || {};
              renderSettings(box);
            } else {
              Api.toast((r && r.error) || "Не удалось сохранить");
            }
          } catch (e) {
            Api.toast("Ошибка: " + e.message);
          }
        }, on ? "primary" : "ghost");
      row.appendChild(sw);
      box.appendChild(row);
    });

    box.appendChild(Router.el("div", "mut pad",
      "Отключение механик блокирует их в боте без потери данных мира."));
  }

  Router.register("settings", renderSettings);
})();
