/* Создание записей энциклопедии (22.09.2026 v2): вынесено из редактора
(правило ≤300 строк). v1: NPC (пресет расы/фракции) + предмет.
v2 (22.09.2026, требование владельца «Создать в каждой вкладке»): схемы
SCHEMAS для effect/location/race/faction/scenario (минимум полей, ТЗ v5
§2.2); enum element/duration_type — EncyF.enumSelect; родовые enum
(location_type/location_kind/faction_type) — локальные ENUM_OPTS (зеркало
серверных ENUMS web_field_rules v3); stat_modifiers — EncyF.makeStatGridField;
после создания — «🎨» (media v2 знает все типы) / «📤» / «✏️» со шкалой Prog
(инвариант 12.39). IIFE: локальный Prog не конфликтует с глобальным. */
(function () {
const Prog = {
  create: function () {
    return window.Prog ? window.Prog.create()
      : document.createElement("div");
  },
  start: function (el, t) {
    if (window.Prog) window.Prog.start(el, t || 60);
  },
  finish: function (el) { if (window.Prog) window.Prog.finish(el); }
};
const ENUM_OPTS = {
  location_type: [["peaceful", "мирная"], ["dangerous", "опасная"]],
  location_kind: [["region", "регион"], ["location", "локация"],
    ["zone", "зона"], ["poi", "POI"]],
  faction_type: [["guild", "гильдия"], ["kingdom", "королевство"],
    ["order", "орден"], ["syndicate", "синдикат"], ["clan", "клан"],
    ["corporation", "корпорация"], ["rebellion", "повстанцы"]]};
const SCHEMAS = {
  effect: [["name", "text", ""], ["description", "area", ""],
    ["element", "ee", ""], ["duration_type", "ee", ""],
    ["power_grade", "num", 0], ["stat_modifiers", "statgrid", ""],
    ["image_prompt", "area", ""]],
  location: [["name", "text", ""], ["description", "area", ""],
    ["location_type", "ge", "peaceful"], ["location_kind", "ge", "location"],
    ["danger_level", "num", 10], ["resource_level", "num", 50],
    ["social_level", "num", 50], ["mystery_level", "num", 10],
    ["access_level", "num", 50], ["is_safe", "bool", 0],
    ["image_prompt", "area", ""]],
  race: [["name", "text", ""], ["description", "area", ""],
    ["max_level", "num", 100], ["image_prompt", "area", ""]],
  faction: [["name", "text", ""], ["ideology", "area", ""],
    ["faction_type", "ge", "guild"], ["image_prompt", "area", ""]],
  scenario: [["name", "text", ""], ["genre", "text", ""],
    ["description", "area", ""], ["image_prompt", "area", ""]]};
const TITLE = { effect: "эффект", location: "локация", race: "раса",
  faction: "фракция", scenario: "мир", item: "предмет" };
Router.register("ency_new", function (box, params) {
  const entity = params.entity || "npc_named";
  const preset = params.preset || {};
  const isNpc = entity === "npc_base" || entity === "npc_named";
  const stores = {};
  box.appendChild(Router.el("div", "bar",
    "<span class='chip'>➕ Создание: " +
    (isNpc ? "NPC" : (TITLE[entity] || "предмет")) + "</span>"));
  const grid = Router.el("div", "grid3");
  box.appendChild(grid);
  function add(key, kind, value) {
    const fd = FormField.make(key, lab(key), value, kind);
    stores[key] = fd.get;
    grid.appendChild(fd.el);
  }
  function addArea(key, ph) {
    const fd = FormField.make(key, lab(key), "", "area");
    fd.el.querySelector("textarea").placeholder = ph || "";
    stores[key] = fd.get;
    grid.appendChild(fd.el);
  }
  function addBool(key, value) {
    const f = Router.el("div", "field");
    f.innerHTML = "<label>" + lab(key) + "</label>";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = !!value;
    stores[key] = function () { return cb.checked ? 1 : 0; };
    f.appendChild(cb); grid.appendChild(f);
  }
  function addEnumGE(key, value) {
    const f = Router.el("div", "field");
    f.innerHTML = "<label>" + lab(key) + "</label>";
    const sel = document.createElement("select");
    sel.appendChild(new Option("(не задано)", ""));
    (ENUM_OPTS[key] || []).forEach(function (p) {
      sel.appendChild(new Option(p[1], p[0]));
    });
    sel.value = value || "";
    stores[key] = function () { return sel.value; };
    f.appendChild(sel); grid.appendChild(f);
  }
  if (isNpc) {
    add("name", "text", "");
    add("gender", "enum", "male");
    add("age", "num", 30);
    add("age_category", "enum", "adult");
    add("npc_role", "enum", "neutral");
    add("rank", "enum", "regular");
    add("level", "num", 1);
    const rs = EncyF.refSelect("race", "", preset.race || "");
    stores.race = rs.get; grid.appendChild(rs.el);
    const fs2 = EncyF.refSelect("faction", "", preset.faction || "");
    stores.faction = fs2.get; grid.appendChild(fs2.el);
    addArea("appearance", "Рост, телосложение, волосы, глаза…");
    addArea("image_prompt", "full body portrait, …");
    addArea("personality_tags", "ревнивая, скромная, авантюрист…");
  } else if (SCHEMAS[entity]) {
    SCHEMAS[entity].forEach(function (f) {
      const k = f[0], kind = f[1], v = f[2];
      if (kind === "text") add(k, "text", v);
      else if (kind === "area") addArea(k, "");
      else if (kind === "num") add(k, "num", v);
      else if (kind === "bool") addBool(k, v);
      else if (kind === "ee") {
        const fd = EncyF.enumSelect(k, v);
        stores[k] = fd.get; grid.appendChild(fd.el);
      } else if (kind === "ge") addEnumGE(k, v);
      else if (kind === "statgrid")
        grid.appendChild(EncyF.makeStatGridField(k, v, lab, stores));
    });
  } else {
    add("name", "text", "");
    add("slot", "enum", "");
    add("rarity", "enum", "common");
    add("quality", "num", 1);
    add("base_price", "num", 10);
    addArea("description", "Что это за предмет…");
    addArea("lore", "История предмета…");
  }
  box.appendChild(Router.editBar(async function () {
    const fields = {};
    Object.entries(stores).forEach(function (e) { fields[e[0]] = e[1](); });
    if (!(fields.name || "").trim())
      return Api.toast("⚠️ Укажите название");
    const r = await Api.post("/api/ency/create",
      { entity: entity, fields: fields });
    if (!r || !r.ok)
      return Api.toast("❌ " + ((r && r.error) || "ошибка"));
    Api.toast("✅ Создано #" + r.id);
    EncyF.resetOpts();
    box.innerHTML = "";
    const pc = Router.el("div", "card pad");
    const im = Router.el("img", "imgfull");
    im.style.display = "none";
    pc.appendChild(im);
    const prog = Prog.create();
    pc.appendChild(prog);
    box.appendChild(pc);
    const bar = Router.el("div", "bar");
    bar.style.flexWrap = "wrap";
    bar.appendChild(Router.btn("🎨 Картинка", async function () {
      Api.toast("⏳ Генерация (до минуты)…");
      Prog.start(prog, 60);
      let g = null;
      try {
        g = await Api.post("/api/gen_entity_image",
          { entity_type: isNpc ? "npc" : entity, id: r.id });
      } finally { Prog.finish(prog); }
      if (g && g.ok) {
        Api.resetImgCache();
        Api.post("/api/ency/get", { entity: entity, id: r.id })
          .then(function (gg) {
            const p = gg && gg.ok ? gg.rec.image_media_id : "";
            if (p) Api.imgT(p).then(function (u) {
              if (u) { im.src = u; im.style.display = "block"; }
            });
          });
        Api.toast("✅ Готово");
      } else Api.toast("❌ " + ((g && g.error) || "ошибка"));
    }, "primary"));
    const up = document.createElement("label");
    up.className = "btn ghost"; up.style.flex = "1";
    up.textContent = "📤 Загрузить рисунок";
    const fi = document.createElement("input");
    fi.type = "file"; fi.accept = "image/*"; fi.style.display = "none";
    fi.onchange = async function () {
      const f = fi.files[0]; if (!f) return;
      const fd = new FormData(); fd.append("file", f);
      const rr = await fetch(Api.base +
        "/api/upload_entity_image?entity=" +
        (isNpc ? "npc" : entity) + "&id=" + r.id,
        { method: "POST",
          headers: { "ngrok-skip-browser-warning": "1" }, body: fd });
      const res = await rr.json();
      if (res && res.ok) {
        Api.resetImgCache();
        Api.imgT(res.path || "").then(function (u) {
          if (u) { im.src = u; im.style.display = "block"; }
        });
        Api.toast("✅ Загружено");
      } else Api.toast("❌ Ошибка загрузки");
    };
    up.appendChild(fi); bar.appendChild(up);
    bar.appendChild(Router.btn("✏️ Редактор", async function () {
      const g = await Api.post("/api/ency/get",
        { entity: entity, id: r.id });
      if (g && g.ok)
        Router.open("ency_edit",
          { entity: entity, id: r.id, rec: g.rec });
    }, "ghost"));
    box.appendChild(bar);
    box.appendChild(Router.viewBar(null));
  }));
});
})();
