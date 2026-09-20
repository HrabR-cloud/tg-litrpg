/* Меню v2, экраны умения: просмотр и редактор чисел через /api/ency/*
   (контракты прежние: ency/get, ency/update).
   ВНИМАНИЕ (R-08): редактор = отдельный экран, сохранение «💾». */
Router.register("skill", function (box, params) {
  box.appendChild(Router.card(null, Router.el("div", "mut", "⏳ Загрузка…")));
  (async function () {
    let rec = null;
    try {
      const res = await Api.post("/api/ency/get",
        { entity: params.entity, id: params.id });
      rec = (res && res.ok) ? res.rec : null;
    } catch (e) { rec = null; }
    box.innerHTML = "";
    if (!rec) {
      box.appendChild(Router.card("⚠️",
        Router.el("div", "mut", "Умение не найдено.")));
      box.appendChild(Router.viewBar(null));
      return;
    }
    box.appendChild(Router.card("🎯 " + (rec.name || ""),
      Router.el("div", "mut", rec.description || "—")));
    const g = Router.el("div", "statgrid");
    [["Урон", rec.base_damage], ["Кулдаун", rec.cooldown],
     ["Бонус скорости", rec.speed_bonus]].forEach(function ([k, v]) {
      if (v != null) {
        g.appendChild(Router.el("div", null,
          "<div class='k'>" + k + "</div><div class='v'>" + v + "</div>"));
      }
    });
    box.appendChild(Router.card("📊 Числа", g));
    let mods = {};
    try { mods = JSON.parse(rec.stat_modifiers || "{}"); } catch (e) {}
    box.appendChild(Router.card("✨ Модификаторы", Router.statGrid(mods)));
    box.appendChild(Router.viewBar(function () {
      Router.open("skill_edit",
        { entity: params.entity, id: params.id, rec: rec });
    }));
  })();
});

Router.register("skill_edit", function (box, params) {
  const rec = params.rec || {};
  const store = {};
  const c = Router.card("✏️ Редактор умения", null);
  [["base_damage", "Базовый урон"], ["cooldown", "Кулдаун"],
   ["speed_bonus", "Бонус скорости"]].forEach(function ([k, lb]) {
    const f = Router.el("div", "field");
    f.innerHTML = "<label>" + lb + "</label>";
    const inp = document.createElement("input");
    inp.type = "number";
    inp.value = (rec[k] != null ? rec[k] : 0);
    store[k] = inp;
    f.appendChild(inp);
    c.appendChild(f);
  });
  box.appendChild(c);
  box.appendChild(Router.editBar(async function () {
    const fields = {};
    Object.entries(store).forEach(function ([k, inp]) {
      fields[k] = parseInt(inp.value, 10) || 0;
    });
    const res = await Api.post("/api/ency/update",
      { entity: params.entity, id: params.id, fields: fields });
    Api.toast(res && res.ok ? "✅ Сохранено"
      : "❌ " + ((res && res.error) || "ошибка"));
    if (res && res.ok) Router.back();
  }));
});