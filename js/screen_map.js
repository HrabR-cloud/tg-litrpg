/* Меню v2, «🗺 Карта»: список локаций; «🚶 Переместиться» сохранена;
   клик по НАЗВАНИЮ → карточка локации (описание+эффекты+редактор+🎨/📤).
   ВНИМАНИЕ (фикс 17.09.2026): иконки берём ЧЕРЕЗ Api.img (full) с fallback
   наApi.imgT, чтобы миниатюры гарантированно показывались (раньше пустели). */
Router.register("map", function (box) {
  const st = Api.stateCache || {};
  const locs = st.locations || [];
  const c = Router.card("🗺 Карта мира (" + locs.length + ")", null);
  if (!locs.length) c.appendChild(Router.el("div", "mut", "Локаций нет."));
  locs.forEach(function (l) {
    const row = Router.el("div", "listrow");
    const im = document.createElement("img");
    im.style.cssText = "width:44px;height:44px;border-radius:8px;" +
      "object-fit:cover;background:#2d2547;flex:0 0 auto;";
    row.appendChild(im);
    if (l.image) {
      Api.img(l.image).then(function (u) {
        if (u) { im.src = u; return; }
        return Api.imgT(l.image).then(function (u2) { if (u2) im.src = u2; });
      });
    }
    const info = Router.el("div", null,
      "<div style='flex:1;'><b style='cursor:pointer;text-decoration:underline;'>" +
      l.name + "</b> " +
      (l.current ? "<span class='chip'>📍 вы здесь</span>" : "") +
      "<div class='mut'>" + (l.safe ? "🛡 мирная" : "⚠ опасная") +
      (l.effects && Object.keys(l.effects).length
        ? " · эффектов: " + Object.keys(l.effects).length : "") + "</div></div>");
    info.querySelector("b").onclick = function () {
      Router.open("location_card", { id: l.id });
    };
    row.appendChild(info);
    if (!l.current) {
      const b = Router.btn("🚶 Переместиться", async function () {
        const r = await Api.post("/api/menu/action",
          { action: "travel", params: { loc: l.id } });
        Api.toast(r && r.ok ? "✅ Переход выполнен"
          : "❌ " + ((r && r.error) || "ошибка"));
        if (r && r.ok) { await Api.loadState(); Router.tab("map"); }
      }, "primary");
      b.style.flex = "0 0 auto"; b.style.padding = "8px 10px";
      row.appendChild(b);
    }
    c.appendChild(row);
  });
  box.appendChild(c);
});