/* Создание записей энциклопедии (22.09.2026 v1): вынесено из
screen_ency_edit.js v10 (правило ≤300 строк, одна ответственность).
ency_new: NPC (пресет расы/фракции) или предмет; после создания —
«🎨 Картинка» со шкалой Prog (инвариант 12.39), «📤 Загрузить рисунок»,
«✏️ Редактор». IIFE: локальный Prog не конфликтует с глобальным. */
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
Router.register("ency_new", function (box, params) {
  const entity = params.entity || "npc_named";
  const preset = params.preset || {};
  const isNpc = entity === "npc_base" || entity === "npc_named";
  const stores = {};
  box.appendChild(Router.el("div", "bar",
    "<span class='chip'>➕ Создание: " +
    (isNpc ? "NPC" : "предмет") + "</span>"));
  const grid = Router.el("div", "grid3");
  box.appendChild(grid);
  function add(key, kind, value) {
    const fd = FormField.make(key, lab(key), value, kind);
    stores[key] = fd.get;
    grid.appendChild(fd.el);
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
  } else {
    add("name", "text", "");
    add("slot", "enum", "");
    add("rarity", "enum", "common");
    add("quality", "num", 1);
    add("base_price", "num", 10);
  }
  const taCard = Router.card("📖 Внешность и описание", null);
  const taGrid = Router.el("div", "grid3");
  taCard.appendChild(taGrid);
  box.appendChild(taCard);
  function addArea(key, label, ph) {
    const fd = FormField.make(key, label, "", "area");
    fd.el.querySelector("textarea").placeholder = ph || "";
    stores[key] = fd.get;
    taGrid.appendChild(fd.el);
  }
  if (isNpc) {
    addArea("appearance", "Внешность (RU)",
      "Рост, телосложение, волосы, глаза…");
    addArea("image_prompt", "Промт (EN)", "full body portrait, …");
    addArea("personality_tags", "Черты личности (через запятую)",
      "ревнивая, скромная, авантюрист…");
  } else {
    addArea("description", "Описание", "Что это за предмет…");
    addArea("lore", "Лор", "История предмета…");
  }
  box.appendChild(Router.editBar(async function () {
    const fields = {};
    Object.entries(stores).forEach(function (e) {
      fields[e[0]] = e[1]();
    });
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
          { entity_type: isNpc ? "npc" : "item", id: r.id });
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
        (isNpc ? "npc" : "item") + "&id=" + r.id,
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