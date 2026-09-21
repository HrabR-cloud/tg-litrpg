/* Меню v2, карточка NPC: чипы, портрет, статы, умения, роль; у ИМЕННЫХ —
экипировка (слоты → npc_inventory), Личность/Отношения/Персонажи/Инвентарь/
Гардероб. У БАЗОВЫХ — без отношений/инвентаря/гардероба.
ВНИМАНИЕ (фикс 16.09.2026): экипировка кликабельна и открывает
«npc_inventory» (рендерер теперь в screen_inventory.js).
ВНИМАНИЕ (фикс 19.09.2026 v2): «📊 Шкалы личности» выводятся с РУССКИМИ
названиями через window.SCALES_RU (ui_progress.js, словарь по СС §3–5);
без словаря — fallback на исходные ключи.
v3 (20.09.2026, требование владельца «убрать значок часов»): ячейки
НАДЕТЫХ слотов экипировки NPC больше не печатают маркер 🕓; пустые слоты
сохраняют ➕ (единый стиль с экраном героя, screen_hero.js v6). */
Router.register("npc_card", function (box, params) {
  box.appendChild(Router.el("div", "mut", "⏳…"));
  (async function () {
    let res = null;
    try { res = await Api.post("/api/npc/card", { npc_id: params.id }); } catch (e) {}
    box.innerHTML = "";
    if (!res || !res.ok || !res.npc) {
      box.appendChild(Router.card("⚠️", Router.el("div", "mut", "NPC не найден.")));
      box.appendChild(Router.viewBar(null));
      return;
    }
    const npc = res.npc;
    const isBase = npc.npc_type === "base";
    const chips = Router.el("div", "bar");
    chips.style.flexWrap = "wrap";
    [npc.name, ruValue("gender", npc.gender), npc.level != null ? "ур. " + npc.level : "",
     npc.race || "", isBase ? "Базовый" : "Именной",
     ruValue("age_category", npc.age_category)].filter(Boolean)
      .forEach(function (t) { chips.appendChild(Router.chip(t)); });
    box.appendChild(chips);
    if (npc.image_media_id) {
      const pc = Router.el("div", "card pad");
      const im = Router.el("img", "imgfull");
      pc.appendChild(im); box.appendChild(pc);
      Api.img(npc.image_media_id).then(function (u) { if (u) im.src = u; else pc.remove(); });
    }
    if (!isBase) {
      const eq = Router.card("🛡️ Экипировка (нажмите слот)", null);
      const grid = Router.el("div", "eqgrid");
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      const worn = npc.equipped || [];
      const SLOTS = ["hand", "hand2", "head", "outer", "inner", "lingerie",
        "feet", "necklace", "ring1", "ring2", "earring1", "earring2"];
      SLOTS.forEach(function (s) {
        const row = worn.find(function (x) { return x.slot === s; });
        const cell = Router.el("div", "eqslot");
        /* v3: без 🕓 у надетых; ➕ только у пустых слотов */
        cell.innerHTML = (row ? "" : "<div style='font-size:20px;'>➕</div>") +
          "<div>" + (SLOT_RU[s] || s) + "</div>" +
          (row ? "<div class='mut'>" + row.name + "</div>" : "");
        if (row && row.img) Api.imgT(row.img).then(function (u) {
          if (!u) return;
          const im = document.createElement("img");
          im.src = u; cell.insertBefore(im, cell.firstChild);
        });
        cell.onclick = function () {
          Router.open("npc_inventory", { id: params.id, group: s });
        };
        grid.appendChild(cell);
      });
      eq.appendChild(grid);
      box.appendChild(eq);
    }
    const stats = npc.display_stats || safeParse(npc.effective_stats, {}) || {};
    if (Object.keys(stats).length) {
      box.appendChild(Router.card("📊 Характеристики (с бонусами)", Router.statGrid(stats)));
    }
    const sk = res.skills || { combat: [], noncombat: [] };
    const skC = Router.card("⚔️ Умения", null);
    [["combat", "cskill", "⚔️ Боевые"], ["noncombat", "nskill", "🕊️ Мирные"]]
      .forEach(function (pair) {
        const k = pair[0], ent = pair[1], t = pair[2];
        if (!sk[k].length) return;
        skC.appendChild(Router.el("div", "mut", t));
        sk[k].forEach(function (s) {
          const row = Router.el("div", "listrow");
          row.innerHTML = "<div style='flex:1;'><b>" + s.name + "</b>" +
            "<div class='mut'>" + skillParamsLine(s) + "</div></div>";
          const b = Router.btn("✏️", function () {
            Router.open("skill_edit", { entity: ent, id: s.id,
              rec: { name: s.name, base_damage: s.dmg, cooldown: s.cd, speed_bonus: s.sb } });
          }, "ghost");
          b.style.flex = "0 0 auto"; b.style.padding = "8px 12px";
          row.appendChild(b); skC.appendChild(row);
        });
      });
    skC.appendChild(Router.btn("➕ Добавить умение", function () {
      Router.open("npc_skill_new", { id: params.id });
    }, "ghost"));
    box.appendChild(skC);
    if (npc.role_description) {
      box.appendChild(Router.card("📖 Роль и характер",
        Router.el("div", "mut", String(npc.role_description).slice(0, 400))));
    }
    const bar = Router.el("div", "bar");
    bar.style.flexWrap = "wrap";
    bar.appendChild(Router.btn("📊 Личность", function () {
      Router.open("npc_personality", { rec: npc });
    }, "ghost"));
    if (!isBase) {
      bar.appendChild(Router.btn("💞 Отношения", function () {
        Router.open("npc_rel_hero", { id: params.id });
      }, "ghost"));
      bar.appendChild(Router.btn("👥 Персонажи", function () {
        Router.open("npc_rel_list", { id: params.id });
      }, "ghost"));
      bar.appendChild(Router.btn("🎒 Инвентарь", function () {
        Router.open("npc_inventory", { id: params.id });
      }, "ghost"));
      bar.appendChild(Router.btn("👗 Гардероб", function () {
        Router.open("wardrobe", { owner_type: "npc", owner_id: npc.npc_id, owner_name: npc.name });
      }, "ghost"));
    }
    box.appendChild(bar);
    box.appendChild(Router.el("div", "mut", isBase
      ? "Базовый NPC: без отношений, инвентаря и гардероба (фарм опыта)."
      : "Именной NPC: одежда, вещи и расходники почти как у героя."));
    box.appendChild(Router.viewBar(function () {
      Router.open("ency_edit", { entity: "npc", id: npc.npc_id, rec: npc, types: res.types || {} });
    }));
  })();
});
/* === Шкалы личности: русские названия (SCALES_RU) === */
Router.register("npc_personality", function (box, params) {
  const npc = params.rec || {};
  const KEYS = ["openness", "conscientiousness", "extraversion", "agreeableness",
    "neuroticism", "libido", "kinkiness", "exhibitionism", "fidelity"];
  const RU = window.SCALES_RU || {};
  const pers = {};
  KEYS.forEach(function (k) { if (npc[k] != null) pers[RU[k] || k] = npc[k]; });
  box.appendChild(Router.card("📊 Шкалы личности", Router.statGrid(pers)));
  box.appendChild(Router.viewBar(function () {
    Router.open("ency_edit", { entity: "npc", id: npc.npc_id, rec: npc, types: {} });
  }));
});
Router.register("npc_skill_new", function (box, params) {
  const store = {};
  const c = Router.card("➕ Новое умение NPC", null);
  function field(key, label, kind, value) {
    const f = Router.el("div", "field");
    f.innerHTML = "<label>" + label + "</label>";
    const inp = document.createElement(kind === "area" ? "textarea" : "input");
    if (kind === "num") inp.type = "number";
    inp.value = value || "";
    store[key] = inp; f.appendChild(inp); c.appendChild(f);
  }
  field("name", "Название умения", "text", "");
  const f = Router.el("div", "field");
  f.innerHTML = "<label>Тип умения</label>";
  const sel = document.createElement("select");
  [["combat", "Боевое"], ["noncombat", "Мирное"]].forEach(function (p) {
    const o = document.createElement("option"); o.value = p[0]; o.textContent = p[1];
    sel.appendChild(o);
  });
  store.kind = sel; f.appendChild(sel); c.appendChild(f);
  field("base_damage", "Базовый урон", "num", 0);
  field("cooldown", "Кулдаун", "num", 0);
  field("speed_bonus", "Бонус скорости", "num", 0);
  field("description", "Описание", "area", "");
  box.appendChild(c);
  box.appendChild(Router.editBar(async function () {
    const body = { npc_id: params.id, kind: store.kind.value,
      name: store.name.value.trim(),
      base_damage: parseInt(store.base_damage.value, 10) || 0,
      cooldown: parseInt(store.cooldown.value, 10) || 0,
      speed_bonus: parseInt(store.speed_bonus.value, 10) || 0,
      description: store.description.value };
    if (!body.name) return Api.toast("Укажите название умения");
    const r = await Api.post("/api/npc/skill_create", body);
    Api.toast(r && r.ok ? "✅ Умение создано" : "❌ " + ((r && r.error) || "ошибка"));
    if (r && r.ok) Router.back();
  }));
});