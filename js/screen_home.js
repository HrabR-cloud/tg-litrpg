/* Меню v2, «Домой»: сетка карточек-входов (как в референсе).
   ВНИМАНИЕ (16.09.2026): плитка «👗 Гардероб» ведёт в гардероб без владельца
   (внутри есть выбор персонажа); «Отношения» убраны (вход из героя/NPC). */
Router.register("home", function (box) {
  const cards = [
    ["hero", "👤", "Персонаж", "Имя, пол, статы, внешность"],
    ["items", "🎒", "Инвентарь", "Карточки вещей с миниатюрами"],
    ["quests", "📜", "Квесты", "Активные квесты и события мира"],
    ["map", "🗺️", "Карта", "Локации и перемещение"],
    ["party", "🤝", "Группа", "NPC в группе героя"],
    ["time", "⏰", "Время", "Перемотка и календарь"],
    ["wardrobe", "👗", "Гардероб", "Одежда и образы персонажей"],
    ["ency", "📚", "Энциклопедия", "Мир, NPC, предметы, умения, расы"],
    ["arb", "⚖️", "Арбитр", "Чат с ИИ-Арбитром (правки БД)"],
    ["worlds", "🌍", "Миры", "Сценарии игры и создание новых"],
  ];

  const grid = Router.el("div", "grid2");
  cards.forEach(function ([id, ic, title, desc]) {
    const c = Router.el("div", "card tile");
    c.dataset.tab = id;
    c.innerHTML = `<div class="tile-ic">${ic}</div>` +
      `<div class="tile-t">${title}</div>` +
      `<div class="tile-d">${desc}</div>`;
    grid.appendChild(c);
  });
  box.appendChild(grid);

  grid.addEventListener("click", function (e) {
    const tile = e.target.closest(".tile");
    if (tile && tile.dataset.tab) Router.tab(tile.dataset.tab);
  });
});

/* === 👗 Гардероб-заглушка заменяется screen_wardrobe.js (регистрация
   ниже по списку скриптов перезаписывает эту) === */
Router.register("wardrobe", function (box) {
  box.appendChild(Router.card("👗 Гардероб",
    Router.el("div", "mut", "Загрузка модуля гардероба…")));
});