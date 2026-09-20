/* Редактор и создание записей энциклопедии (20.09.2026 v10): ЕДИНЫЙ стиль.
v8: файл обёрнут в IIFE — локальный Prog больше не конфликтует с глобальным
(screen_hero.js), SyntaxError устранён, редактор NPC работает;
кнопка «🖼 Иконка» у NPC открывает экран face_crop (масштаб+сдвиг).
v9 (20.09.2026, инцидент «у оружия нет базовых характеристик»):
base_stat_modifiers / stat_modifiers редактируются statgrid'ом с русскими
названиями (ТЗ v4 §9.6), а не сырым JSON в «Текстах»: текущие ключи +
селектор «➕ добавить параметр»; нули при сохранении отбрасываются.
v10 (20.09.2026, инвариант «любая генерация сопровождается шкалой»):
в ency_new (экран создания записи) под превью добавлена шкала Prog —
раньше кнопка 🎨 после создания шла без шкалы (аудит 20.09: вызов
gen_entity_image без пары Prog.start/Prog.finish).
ency_edit: каноническая запись через /api/ency/get; подвкладки-секции
(у NPC семантические группы); числовые/переключатели/короткие тексты —
3 колонки, textarea — во всю ширину; перечисления/флаги — select;
RACE/FACTION — select из СУЩЕСТВУЮЩИХ; personality_tags — через запятую
(JSON-массив); outfit_items — textarea с подсказкой; «🎨 Картинка» и
«📤 Загрузить» со шкалой Prog. ency_new: создание NPC (пресет расы/фракции)
или предмета + 🎨/📤/✏️ после создания (🎨 теперь со шкалой). */
(function () {
const SKIP_FIELDS = ["location_id", "item_id", "effect_id", "race_id",
  "faction_id", "scenario_id", "npc_id", "hero_id", "image_media_id",
  "parent_id", "leader_id", "base_stats", "effective_stats",
  "display_stats", "icon_source_media_id"];
const NPC_GROUPS = [
  ["Имя и роль", ["name", "gender", "age", "age_category", "npc_type",
    "npc_role", "occupation", "level", "rank", "status", "is_immortal",
    "is_template", "hostile", "is_dead", "is_active", "race", "faction"]],
  ["Характеристики (база)", ["strength", "magic_power", "intelligence",
    "health", "max_health", "speed", "armor", "crit_chance", "crit_power",
    "magic_crit_chance", "magic_crit_power", "luck", "perception",
    "charisma"]],
  ["Личность (Big Five)", ["openness", "conscientiousness", "extraversion",
    "agreeableness", "neuroticism", "attachment_style", "personality_tags"]],
  ["Интим и тело", ["libido", "kinkiness", "exhibitionism", "fidelity",
    "revealing_level", "current_outfit", "outfit_mood", "fertility_enabled",
    "is_pregnant", "pregnancy_start_day"]],
  ["Настроение и состояние", ["mood", "mood_text", "mood_intensity",
    "mood_cause", "mood_decay", "intoxication", "fatigue", "arousal", "pain"]],
  ["Социальное", ["friendship_scale", "lust_scale", "reputation", "warmth",
    "communication_style", "last_dialog", "schedule", "knowledge",
    "ability_craft"]],
  ["Внешность и тексты", ["appearance", "visual_prompt", "image_prompt",
    "backstory", "role_description"]]];
let OPT_CACHE = {};
const Prog = {
  create: function () {
    return window.Prog ? window.Prog.create()
      : document.createElement("div");
  },
  start: function (el, t) { if (window.Prog) window.Prog.start(el, t || 60); },
  finish: function (el) { if (window.Prog) window.Prog.finish(el); }
};
function loadOpts(entity) {
  if (OPT_CACHE[entity]) return Promise.resolve(OPT_CACHE[entity]);
  return Api.post("/api/ency/list", { entity: entity }).then(function (r) {
    OPT_CACHE[entity] = ((r && r.rows) || []).map(function (x) {
      return x.name;
    });
    return OPT_CACHE[entity];
  });
}
function refSelect(key, current, preset) {
  const f = document.createElement("div");
  f.className = "field";
  const lb = document.createElement("label");
  lb.textContent = lab(key);
  f.appendChild(lb);
  const sel = document.createElement("select");
  const o0 = document.createElement("option");
  o0.value = ""; o0.textContent = "⏳ загрузка…";
  sel.appendChild(o0);
  f.appendChild(sel);
  loadOpts(key).then(function (names) {
    sel.innerHTML = "";
    const e0 = document.createElement("option");
    e0.value = ""; e0.textContent = "(не задано)";
    sel.appendChild(e0);
    const all = (names || []).slice();
    [current, preset].forEach(function (v) {
      if (v && all.indexOf(v) < 0) all.unshift(v);
    });
    all.forEach(function (v) {
      const o = document.createElement("option");
      o.value = v; o.textContent = v;
      if ((current || preset) === v) o.selected = true;
      sel.appendChild(o);
    });
  }).catch(function () {
    sel.innerHTML = "";
    const e0 = document.createElement("option");
    e0.value = ""; e0.textContent = "(не задано)";
    sel.appendChild(e0);
  });
  return { el: f, get: function () { return sel.value; } };
}
Router.register("ency_edit", function (box, params) {
  box.appendChild(Router.el("div", "mut", "⏳…"));
  (async function () {
    let rec = params.rec || {};
    try {
      const g = await Api.post("/api/ency/get",
        { entity: params.entity, id: params.id });
      if (g && g.ok) rec = g.rec;
    } catch (e) {}
    box.innerHTML = "";
    const et = params.entity === "npc_base" || params.entity === "npc_named"
      ? "npc" : params.entity;
    const isNpc = et === "npc";
    const stores = {};
    const prev = Router.el("div", "card pad");
    const pim = Router.el("img", "imgfull");
    pim.style.display = "none";
    prev.appendChild(pim);
    const prog = Prog.create();
    prev.appendChild(prog);
    box.appendChild(prev);
    function refreshPreview() {
      Api.resetImgCache();
      Api.post("/api/ency/get",
        { entity: params.entity, id: params.id }).then(function (g) {
        const p = (g && g.ok && g.rec) ? g.rec.image_media_id : "";
        if (p) Api.imgT(p).then(function (u) {
          if (u) { pim.src = u; pim.style.display = "block"; }
        });
      });
    }
    if (rec.image_media_id)
      Api.imgT(rec.image_media_id).then(function (u) {
        if (u) { pim.src = u; pim.style.display = "block"; }
      });
    const ib = Router.el("div", "bar");
    ib.style.flexWrap = "wrap";
    ib.appendChild(Router.btn("🎨 Картинка", async function () {
      Api.toast("⏳ Генерация (до минуты)…");
      Prog.start(prog, 60);
      let r = null;
      try {
        r = await Api.post("/api/gen_entity_image",
          { entity_type: et, id: params.id });
      } finally {
        Prog.finish(prog);
      }
      if (r && r.ok) {
        refreshPreview();
        await Api.loadState();
        Api.toast("✅ Готово");
      } else Api.toast("❌ " + ((r && r.error) || "ошибка"));
    }, "ghost"));
    if (isNpc) {
      ib.appendChild(Router.btn("🖼 Иконка", function () {
        Router.open("face_crop",
          { entity_type: "npc", id: params.id });
      }, "ghost"));
    }
    const up = document.createElement("label");
    up.className = "btn ghost"; up.style.flex = "1";
    up.textContent = "📤 Загрузить";
    const fi = document.createElement("input");
    fi.type = "file"; fi.accept = "image/*"; fi.style.display = "none";
    fi.onchange = async function () {
      const f = fi.files[0]; if (!f) return;
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch(Api.base + "/api/upload_entity_image?entity=" + et +
        "&id=" + params.id,
        { method: "POST", headers: { "ngrok-skip-browser-warning": "1" },
          body: fd });
      const res = await r.json();
      if (res && res.ok) {
        refreshPreview();
        await Api.loadState();
        Api.toast("✅ Загружено");
      } else Api.toast("❌ Ошибка загрузки");
    };
    up.appendChild(fi); ib.appendChild(up);
    box.appendChild(ib);
    const seg = Router.el("div", "seg");
    seg.style.cssText = "flex-wrap:nowrap;overflow-x:auto;";
    box.appendChild(seg);
    const wrap = Router.el("div");
    box.appendChild(wrap);
    const sections = [];
    let cur = null;
    function newSection(title) {
      const s = { el: Router.el("div"), grid: Router.el("div", "grid3") };
      s.el.style.display = "none";
      s.el.appendChild(Router.el("div", "mut", title + ":"));
      s.el.appendChild(s.grid);
      wrap.appendChild(s.el);
      sections.push(s);
      cur = s;
      const b = document.createElement("button");
      b.textContent = title;
      b.onclick = function () {
        sections.forEach(function (x) {
          x.el.style.display = (x === s) ? "block" : "none";
        });
        seg.querySelectorAll("button").forEach(function (x) {
          x.classList.remove("on");
        });
        b.classList.add("on");
      };
      seg.appendChild(b);
      return s;
    }
    function addField(key) {
      if (stores[key] || !(key in rec) || SKIP_FIELDS.indexOf(key) >= 0) return;
      if ((key === "fertility_enabled" || key === "is_pregnant" ||
        key === "pregnancy_start_day") && (rec.gender || "") !== "female")
        return;
      const v = rec[key];
      if (key === "personality_tags") {
        const f = document.createElement("div");
        f.className = "field";
        f.style.gridColumn = "1 / -1";
        f.innerHTML = "<label>Черты личности (через запятую)</label>";
        const ta = document.createElement("textarea");
        let arr = [];
        try { arr = JSON.parse(v || "[]"); } catch (e) { arr = []; }
        if (!Array.isArray(arr)) arr = [String(arr)];
        ta.value = arr.join(", ");
        ta.placeholder = "ревнивая, скромная, авантюрист…";
        stores[key] = function () {
          return JSON.stringify(ta.value.split(",").map(function (s) {
            return s.trim();
          }).filter(Boolean));
        };
        f.appendChild(ta);
        cur.grid.appendChild(f);
        return;
      }
      if (key === "outfit_items") {
        const f = document.createElement("div");
        f.className = "field";
        f.style.gridColumn = "1 / -1";
        f.innerHTML = "<label>" + lab(key) + "</label>";
        const ta = document.createElement("textarea");
        ta.value = v == null ? "[]" : v;
        ta.placeholder = '[{"slot": "tops", "item_id":12}, …]';
        stores[key] = function () { return ta.value; };
        f.appendChild(ta);
        cur.grid.appendChild(f);
        return;
      }
      /* v9: модификаторы статов предмета/умения — statgrid с русскими
         названиями (ТЗ v4 §9.6); нули в JSON не пишутся. */
      if (key === "base_stat_modifiers" || key === "stat_modifiers") {
        const f = document.createElement("div");
        f.className = "field";
        f.style.gridColumn = "1 / -1";
        f.innerHTML = "<label>" + lab(key) + " (влияют на статы)</label>";
        const grid = document.createElement("div");
        grid.className = "grid3";
        let curMods = {};
        try { curMods = JSON.parse(v || "{}") || {}; } catch (e) { curMods = {}; }
        if (typeof curMods !== "object" || curMods === null) curMods = {};
        const inputs = {};
        function addRow(k) {
          if (inputs[k]) return;
          const d = document.createElement("div");
          d.className = "field";
          d.innerHTML = "<label>" + (STAT_ICON[k] || "▪️") + " " +
            (k === "heal" ? "Лечение" : (STAT_RU[k] || k)) + "</label>";
          const inp = document.createElement("input");
          inp.type = "number";
          inp.value = curMods[k] == null ? 0 : curMods[k];
          d.appendChild(inp);
          grid.appendChild(d);
          inputs[k] = inp;
        }
        Object.keys(curMods).forEach(addRow);
        const addSel = document.createElement("select");
        addSel.appendChild(new Option("➕ добавить параметр…", ""));
        Object.keys(STAT_RU).concat(["heal"]).forEach(function (k) {
          addSel.appendChild(new Option(
            (k === "heal" ? "Лечение" : STAT_RU[k]), k));
        });
        addSel.onchange = function () {
          if (!addSel.value) return;
          addRow(addSel.value);
          addSel.value = "";
        };
        f.appendChild(grid);
        f.appendChild(addSel);
        stores[key] = function () {
          const out = {};
          Object.entries(inputs).forEach(function (e) {
            const num = parseFloat(e[1].value);
            if (!isNaN(num) && num !== 0) out[e[0]] = num;
          });
          return JSON.stringify(out);
        };
        cur.grid.appendChild(f);
        return;
      }
      let fd;
      if (isNpc && (key === "race" || key === "faction"))
        fd = refSelect(key, v == null ? "" : String(v), "");
      else fd = FormField.make(key, lab(key), v, FormField.kindFor(key, v));
      stores[key] = fd.get;
      cur.grid.appendChild(fd.el);
    }
    const used = {};
    if (isNpc) {
      NPC_GROUPS.forEach(function (gp) {
        newSection(gp[0]);
        gp[1].forEach(function (k) { used[k] = 1; addField(k); });
      });
      newSection("Служебное");
      Object.keys(rec).forEach(function (k) { if (!used[k]) addField(k); });
    } else {
      newSection("Типы и переключатели");
      Object.keys(rec).forEach(function (k) {
        const kd = FormField.kindFor(k, rec[k]);
        if (kd === "enum" || kd === "bool" || kd === "icon") {
          used[k] = 1; addField(k);
        }
      });
      newSection("Числовые");
      Object.keys(rec).forEach(function (k) {
        if (!used[k] && FormField.kindFor(k, rec[k]) === "num") {
          used[k] = 1; addField(k);
        }
      });
      newSection("Тексты");
      Object.keys(rec).forEach(function (k) { if (!used[k]) addField(k); });
    }
    if (sections[0]) sections[0].el.style.display = "block";
    if (seg.children[0]) seg.children[0].classList.add("on");
    box.appendChild(Router.editBar(async function () {
      const fields = {};
      Object.entries(stores).forEach(function (e) { fields[e[0]] = e[1](); });
      const r = await Api.post("/api/ency/update",
        { entity: params.entity, id: params.id, fields: fields });
      Api.toast(r && r.ok ? "✅ Сохранено"
        : "❌ " + ((r && r.error) || "ошибка"));
      if (r && r.ok) Router.back();
    }));
  })();
});
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
    const rs = refSelect("race", "", preset.race || "");
    stores.race = rs.get; grid.appendChild(rs.el);
    const fs2 = refSelect("faction", "", preset.faction || "");
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
    addArea("appearance", "Внешность (RU)", "Рост, телосложение, волосы, глаза…");
    addArea("image_prompt", "Промт (EN)", "full body portrait, …");
    addArea("personality_tags", "Черты личности (через запятую)",
      "ревнивая, скромная, авантюрист…");
  } else {
    addArea("description", "Описание", "Что это за предмет…");
    addArea("lore", "Лор", "История предмета…");
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
    OPT_CACHE = {};
    box.innerHTML = "";
    const pc = Router.el("div", "card pad");
    const im = Router.el("img", "imgfull");
    im.style.display = "none";
    pc.appendChild(im);
    /* v10: шкала генерации на экране создания записи */
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
      } finally {
        Prog.finish(prog);
      }
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
      const rr = await fetch(Api.base + "/api/upload_entity_image?entity=" +
        (isNpc ? "npc" : "item") + "&id=" + r.id,
        { method: "POST", headers: { "ngrok-skip-browser-warning": "1" },
          body: fd });
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