/* Меню v2, «🤝 Группа»: состав партии; клик → карточка NPC; «🤝 Торговать» →
экран торговли. Фикс 18.09.2026: в карточку и торговлю передаётся npc_id
явно (дублируем ключ id), аватар — best-effort без падения экрана. */
Router.register("party", function (box) {
  const st = Api.stateCache || {};
  const party = st.party || [];
  const c = Router.card("🤝 Группа (" + party.length + ")", null);
  if (!party.length) {
    c.appendChild(Router.el("div", "mut",
      "Группа пуста. Взять NPC можно через Арбитра или энциклопедию."));
  }
  party.forEach(function (p) {
    const row = Router.el("div", "listrow");
    const im = document.createElement("img");
    im.style.cssText = "width:44px;height:44px;border-radius:50%;" +
      "object-fit:cover;background:#2d2547;flex:0 0 auto;";
    row.appendChild(im);
    const info = Router.el("div", null,
      "<div style='flex:1;'><b>" + p.name + "</b> " +
      "<span class='mut'>ур. " + p.level + "</span>" +
      "<div class='mut'>❤️ " + p.hp + "/" + p.max_hp +
      (p.race ? " · " + p.race : "") + "</div></div>");
    info.style.cursor = "pointer";
    info.onclick = function () {
      Router.open("npc_card", { id: p.id, npc_id: p.id });
    };
    row.appendChild(info);
    const tb = Router.btn("🤝 Торговать", function () {
      Router.open("trade", { npc_id: p.id, id: p.id, name: p.name });
    }, "ghost");
    tb.style.flex = "0 0 auto"; tb.style.padding = "8px 10px";
    row.appendChild(tb);
    c.appendChild(row);
    Api.post("/api/ency/get", { entity: "npc", id: p.id })
      .then(function (g) {
        const rec = (g && g.ok) ? g.rec : null;
        const url = rec && rec.image_media_id;
        if (url) Api.img(url).then(function (u) { if (u) im.src = u; });
      }).catch(function () {});
  });
  box.appendChild(c);
  box.appendChild(Router.el("div", "mut",
    "Нажмите на участника — карточка; «🤝 Торговать» — купля/продажа/подарок."));
});