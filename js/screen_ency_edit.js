/* Редактор записей энциклопедии (22.09.2026 v11): ЕДИНЫЙ стиль, IIFE.
v8: локальный Prog не конфликтует с глобальным (screen_hero.js);
«🖼 Иконка» у NPC открывает face_crop (масштаб+сдвиг).
v9: модификаторы — statgrid (EncyF.makeStatGridField), нули не пишутся.
v10: seg без nowrap — кнопки секций переносятся в 2+ ряда.
v11 (22.09.2026, ручная проверка «сохраняет с пустыми значениями»):
подписи полей из серверных labels /api/ency/get (fallback lab());
enum/icon-селекторы гарантированно имеют «(не задано)» (значение ""),
очистка шлёт "" и сервер маппит в NULL (ADR 12.48); enum эффектов/умений
(element/duration_type/damage_type_gci) — EncyF.enumSelect (RU+эмодзи);
хелперы вынесены в ui_ency_forms.js, создание — в screen_ency_new.js
(правило ≤300 строк). Поведение v10 сохранено: каноническая запись через
/api/ency/get; подвкладки-секции (у NPC семантические группы); числовые/
переключатели/короткие тексты — 3 колонки, textarea — во всю ширину;
RACE/FACTION — select из существующих; personality_tags — через запятую;
outfit_items — textarea; «🎨 Картинка»/«📤 Загрузить» со шкалой Prog. */
(function () {
const SKIP_FIELDS = ["location_id", "item_id", "effect_id", "race_id",
  "faction_id", "scenario_id", "npc_id", "hero_id", "image_media_id",
  "parent_id", "leader_id", "base_stats", "effective_stats",
  "display_stats", "icon_source_media_id"];
const NPC_GROUPS = [
  ["Имя и роль", ["name", "gender", "age", "age_category",
    "npc_type", "npc_role", "occupation", "level", "rank", "status",
    "is_immortal", "is_template", "hostile", "is_dead", "is_active",
    "race", "faction"]],
  ["Характеристики (база)", ["strength", "magic_power",
    "intelligence", "health", "max_health", "speed", "armor",
    "crit_chance", "crit_power", "magic_crit_chance",
    "magic_crit_power", "luck", "perception", "charisma"]],
  ["Личность (Big Five)", ["openness", "conscientiousness",
    "extraversion", "agreeableness", "neuroticism",
    "attachment_style", "personality_tags"]],
  ["Интим и тело", ["libido", "kinkiness", "exhibitionism",
    "fidelity", "revealing_level", "current_outfit", "outfit_mood",
    "fertility_enabled", "is_pregnant", "pregnancy_start_day"]],
  ["Настроение и состояние", ["mood", "mood_text", "mood_intensity",
    "mood_cause", "mood_decay", "intoxication", "fatigue", "arousal",
    "pain"]],
  ["Социальное", ["friendship_scale", "lust_scale", "reputation",
    "warmth", "communication_style", "last_dialog", "schedule",
    "knowledge", "ability_craft"]],
  ["Внешность и тексты", ["appearance", "visual_prompt",
    "image_prompt", "backstory", "role_description"]]];
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
Router.register("ency_edit", function (box, params) {
  box.appendChild(Router.el("div", "mut", "⏳…"));
  (async function () {
    let rec = params.rec || {}, labels = {};
    try {
      const g = await Api.post("/api/ency/get",
        { entity: params.entity, id: params.id });
      if (g && g.ok) { rec = g.rec; labels = g.labels || {}; }
    } catch (e) {}
    box.innerHTML = "";
    const labL = function (k) { return labels[k] || lab(k); };
    const et = (params.entity === "npc_base" ||
      params.entity === "npc_named") ? "npc" : params.entity;
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
      } finally { Prog.finish(prog); }
      if (r && r.ok) {
        refreshPreview(); await Api.loadState();
        Api.toast("✅ Готово");
      } else Api.toast("❌ " + ((r && r.error) || "ошибка"));
    }, "ghost"));
    if (isNpc) ib.appendChild(Router.btn("🖼 Иконка", function () {
      Router.open("face_crop",
        { entity_type: "npc", id: params.id });
    }, "ghost"));
    const up = document.createElement("label");
    up.className = "btn ghost"; up.style.flex = "1";
    up.textContent = "📤 Загрузить";
    const fi = document.createElement("input");
    fi.type = "file"; fi.accept = "image/*";
    fi.style.display = "none";
    fi.onchange = async function () {
      const f = fi.files[0]; if (!f) return;
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch(Api.base +
        "/api/upload_entity_image?entity=" + et + "&id=" + params.id,
        { method: "POST",
          headers: { "ngrok-skip-browser-warning": "1" }, body: fd });
      const res = await r.json();
      if (res && res.ok) {
        refreshPreview(); await Api.loadState();
        Api.toast("✅ Загружено");
      } else Api.toast("❌ Ошибка загрузки");
    };
    up.appendChild(fi); ib.appendChild(up);
    box.appendChild(ib);
    const seg = Router.el("div", "seg");
    box.appendChild(seg);
    const wrap = Router.el("div");
    box.appendChild(wrap);
    const sections = [];
    let cur = null;
    function newSection(title) {
      const s = { el: Router.el("div"),
        grid: Router.el("div", "grid3") };
      s.el.style.display = "none";
      s.el.appendChild(Router.el("div", "mut", title + ":"));
      s.el.appendChild(s.grid);
      wrap.appendChild(s.el);
      sections.push(s); cur = s;
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
      if (stores[key] || !(key in rec) ||
        SKIP_FIELDS.indexOf(key) >= 0) return;
      if ((key === "fertility_enabled" || key === "is_pregnant" ||
        key === "pregnancy_start_day") &&
        (rec.gender || "") !== "female") return;
      const v = rec[key];
      if (key === "personality_tags") {
        const f = document.createElement("div");
        f.className = "field";
        f.style.gridColumn = "1 / -1";
        f.innerHTML =
          "<label>Черты личности (через запятую)</label>";
        const ta = document.createElement("textarea");
        let arr = [];
        try { arr = JSON.parse(v || "[]"); } catch (e) { arr = []; }
        if (!Array.isArray(arr)) arr = [String(arr)];
        ta.value = arr.join(", ");
        ta.placeholder = "ревнивая, скромная, авантюрист…";
        stores[key] = function () {
          return JSON.stringify(ta.value.split(",")
            .map(function (s) { return s.trim(); })
            .filter(Boolean));
        };
        f.appendChild(ta); cur.grid.appendChild(f);
        return;
      }
      if (key === "outfit_items") {
        const f = document.createElement("div");
        f.className = "field";
        f.style.gridColumn = "1 / -1";
        f.innerHTML = "<label>" + labL(key) + "</label>";
        const ta = document.createElement("textarea");
        ta.value = v == null ? "[]" : v;
        ta.placeholder = '[{"slot":"tops","item_id":12}, …]';
        stores[key] = function () { return ta.value; };
        f.appendChild(ta); cur.grid.appendChild(f);
        return;
      }
      if (key === "base_stat_modifiers" || key === "stat_modifiers") {
        cur.grid.appendChild(
          EncyF.makeStatGridField(key, v, labL, stores));
        return;
      }
      if (EncyF.EFFECT_ENUMS[key]) {
        const fd = EncyF.enumSelect(key, v, labL);
        stores[key] = fd.get;
        cur.grid.appendChild(fd.el);
        return;
      }
      let fd;
      if (isNpc && (key === "race" || key === "faction"))
        fd = EncyF.refSelect(key, v == null ? "" : String(v), "",
          labL);
      else {
        fd = FormField.make(key, labL(key), v,
          FormField.kindFor(key, v));
        const kd = FormField.kindFor(key, v);
        if (kd === "enum" || kd === "icon")
          EncyF.ensureEmptyOption(fd, v);
      }
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
      Object.keys(rec).forEach(function (k) {
        if (!used[k]) addField(k);
      });
    } else {
      newSection("Типы и переключатели");
      Object.keys(rec).forEach(function (k) {
        const kd = FormField.kindFor(k, rec[k]);
        if (kd === "enum" || kd === "bool" || kd === "icon" ||
          EncyF.EFFECT_ENUMS[k]) { used[k] = 1; addField(k); }
      });
      newSection("Числовые");
      Object.keys(rec).forEach(function (k) {
        if (!used[k] && FormField.kindFor(k, rec[k]) === "num") {
          used[k] = 1; addField(k);
        }
      });
      newSection("Тексты");
      Object.keys(rec).forEach(function (k) {
        if (!used[k]) addField(k);
      });
    }
    if (sections[0]) sections[0].el.style.display = "block";
    if (seg.children[0]) seg.children[0].classList.add("on");
    box.appendChild(Router.editBar(async function () {
      const fields = {};
      Object.entries(stores).forEach(function (e) {
        fields[e[0]] = e[1]();
      });
      const r = await Api.post("/api/ency/update",
        { entity: params.entity, id: params.id, fields: fields });
      Api.toast(r && r.ok ? "✅ Сохранено"
        : "❌ " + ((r && r.error) || "ошибка"));
      if (r && r.ok) Router.back();
    }));
  })();
});
})();
