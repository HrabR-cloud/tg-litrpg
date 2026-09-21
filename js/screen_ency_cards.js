/* Карточки энциклопедии v3 (21.09.2026):
- effect_card: стихия/длительность/сила/модификаторы статов/описание;
- ency_view: фильтр SKIP_NUMS — служебные *_id не попадают в «Числа».
Данные: /api/ency/get, /api/ency/members. Подписи — lab() из screen_ency.js. */

function encyTiles(box, rows, onclick) {
  const grid = Router.el("div", "grid2");
  box.appendChild(grid);
  if (!rows.length) {
    grid.appendChild(Router.el("div", "mut", "Пока пусто."));
    return;
  }
  rows.forEach(function (r) {
    const t = Router.el("div", "card tile");
    t.style.cssText = "padding:6px;display:flex;flex-direction:column;" +
      "gap:4px;cursor:pointer;";
    const im = document.createElement("img");
    im.style.cssText = "width:100%;height:80px;object-fit:cover;" +
      "border-radius:8px;background:#2d2547;";
    t.appendChild(im);
    if (r.img) Api.imgT(r.img).then(function (u) { if (u) im.src = u; });
    t.appendChild(Router.el("div", "tile-t", r.name));
    if (r.meta) t.appendChild(Router.el("div", "tile-d", r.meta));
    t.onclick = function () { onclick(r); };
    grid.appendChild(t);
  });
}

async function fetchRec(box, entity, id) {
  let rec = null;
  try {
    const g = await Api.post("/api/ency/get", { entity: entity, id: id });
    if (g && g.ok) rec = g.rec;
  } catch (e) {}
  box.innerHTML = "";
  if (!rec) {
    box.appendChild(Router.card("⚠️",
      Router.el("div", "mut", "Запись не найдена.")));
    box.appendChild(Router.viewBar(null));
  }
  return rec;
}

function recImage(box, rec) {
  if (!rec.image_media_id) return;
  const pc = Router.el("div", "card pad");
  const im = Router.el("img", "imgfull");
  pc.appendChild(im); box.appendChild(pc);
  Api.img(rec.image_media_id).then(function (u) {
    if (u) im.src = u; else pc.remove();
  });
}

async function memberCard(box, params, kind) {
  box.appendChild(Router.el("div", "mut", "⏳…"));
  const rec = await fetchRec(box, kind, params.id);
  if (!rec) return;
  recImage(box, rec);
  box.appendChild(Router.card((kind === "race" ? "🧬 " : "🚩 ") + rec.name,
    Router.el("div", "mut", rec.description || "—")));
  let m = null;
  try {
    m = await Api.post("/api/ency/members", { kind: kind, id: params.id });
  } catch (e) {}
  box.appendChild(Router.el("h3", "pad", "👥 Члены"));
  encyTiles(box, ((m && m.rows) || []).map(function (r) {
    return { id: r.id, name: r.name, img: r.img,
      meta: r.level != null ? "ур. " + r.level : "" };
  }), function (r) { Router.open("npc_card", { id: r.id }); });
  const bar = Router.el("div", "bar");
  const preset = {};
  preset[kind] = rec.name;
  bar.appendChild(Router.btn("➕ Новый член " +
    (kind === "race" ? "расы" : "фракции"), function () {
    Router.open("ency_new", { entity: "npc_named", preset: preset });
  }, "primary"));
  box.appendChild(bar);
  box.appendChild(Router.viewBar(function () {
    Router.open("ency_edit", { entity: kind, id: params.id, rec: rec });
  }));
}

Router.register("race_card", function (box, params) {
  memberCard(box, params, "race");
});
Router.register("faction_card", function (box, params) {
  memberCard(box, params, "faction");
});

Router.register("item_card", function (box, params) {
  (async function () {
    box.appendChild(Router.el("div", "mut", "⏳…"));
    const rec = await fetchRec(box, "item", params.id);
    if (!rec) return;
    recImage(box, rec);
    const chips = Router.el("div", "bar");
    chips.style.flexWrap = "wrap";
    [rec.name, rec.slot ? SLOT_RU[rec.slot] || rec.slot : "",
     rec.rarity ? RARITY_RU[rec.rarity] || rec.rarity : "",
     rec.quality != null ? "кач. " + rec.quality : ""]
      .filter(Boolean).forEach(function (t) {
        chips.appendChild(Router.chip(t));
      });
    box.appendChild(chips);
    box.appendChild(Router.card("📖 Описание",
      Router.el("div", "mut", rec.description || rec.lore || "—")));
    let m = null;
    try {
      m = await Api.post("/api/ency/members", { kind: "item", id: params.id });
    } catch (e) {}
    box.appendChild(Router.el("h3", "pad", "🎒 Владельцы"));
    encyTiles(box, ((m && m.rows) || []).map(function (r) {
      return { id: r.id, name: r.name, img: r.img,
        meta: r.owner === "hero" ? "герой" : "NPC" };
    }), function (r) {
      if (r.owner === "hero") Router.tab("hero");
      else Router.open("npc_card", { id: r.id });
    });
    const bar = Router.el("div", "bar");
    bar.appendChild(Router.btn("➕ Новый предмет", function () {
      Router.open("ency_new", { entity: "item", preset: {} });
    }, "primary"));
    box.appendChild(bar);
    box.appendChild(Router.viewBar(function () {
      Router.open("ency_edit", { entity: "item", id: params.id, rec: rec });
    }));
  })();
});

Router.register("location_card", function (box, params) {
  (async function () {
    box.appendChild(Router.el("div", "mut", "⏳…"));
    const rec = await fetchRec(box, "location", params.id);
    if (!rec) return;
    recImage(box, rec);
    box.appendChild(Router.card("🗺 " + rec.name,
      Router.el("div", "mut", rec.description || "—")));
    const eff = safeParse(rec.effects_json, {});
    if (Object.keys(eff).length) {
      const ru = {};
      Object.entries(eff).forEach(function (e) { ru[lab(e[0])] = e[1]; });
      box.appendChild(Router.card("✨ Эффекты локации", Router.statGrid(ru)));
    }
    box.appendChild(Router.viewBar(function () {
      Router.open("ency_edit",
        { entity: "location", id: params.id, rec: rec });
    }));
  })();
});

/* v3: карточка эффекта — стихия/длительность/сила/модификаторы */
Router.register("effect_card", function (box, params) {
  (async function () {
    box.appendChild(Router.el("div", "mut", "⏳…"));
    const rec = await fetchRec(box, "effect", params.id);
    if (!rec) return;
    recImage(box, rec);
    const chips = Router.el("div", "bar");
    chips.style.flexWrap = "wrap";
    const elems = { fire: "🔥 огонь", water: "💧 вода", earth: "🌍 земля",
      air: "💨 воздух", light: "✨ свет", dark: "🌑 тьма", poison: "☠ яд" };
    const durs = { battle: "до конца боя", days: "в игровых днях" };
    [rec.name,
     rec.element ? (elems[rec.element] || rec.element) : "",
     rec.duration_type ? (durs[rec.duration_type] || rec.duration_type) : "",
     rec.power_grade != null ? "сила: " + (rec.power_grade > 0 ? "+" : "")
       + rec.power_grade : ""]
      .filter(Boolean).forEach(function (t) {
        chips.appendChild(Router.chip(t));
      });
    box.appendChild(chips);
    if (rec.description) {
      box.appendChild(Router.card("📖 Описание",
        Router.el("div", "mut", rec.description)));
    }
    const mods = safeParse(rec.stat_modifiers, {});
    if (Object.keys(mods).length) {
      const ru = {};
      Object.entries(mods).forEach(function (e) {
        ru[STAT_RU[e[0]] || e[0]] = (e[1] > 0 ? "+" : "") + e[1] + "%";
      });
      box.appendChild(Router.card("📊 Модификаторы статов",
        Router.statGrid(ru)));
    }
    box.appendChild(Router.viewBar(function () {
      Router.open("ency_edit", { entity: "effect", id: params.id, rec: rec });
    }));
  })();
});

/* v3: фильтр SKIP_NUMS — служебные *_id не в «Числа» */
const SKIP_NUMS = ["effect_id", "scenario_id", "npc_id", "item_id",
  "location_id", "race_id", "faction_id", "hero_id", "event_id",
  "quest_id", "combat_id", "parent_id", "leader_id"];

Router.register("ency_view", function (box, params) {
  (async function () {
    box.appendChild(Router.el("div", "mut", "⏳…"));
    const rec = await fetchRec(box, params.entity, params.id);
    if (!rec) return;
    recImage(box, rec);
    box.appendChild(Router.card("📖 " + (rec.name || ""),
      Router.el("div", "mut", rec.description || "—")));
    const nums = {};
    Object.entries(rec).forEach(function (e) {
      if (typeof e[1] === "number" && SKIP_NUMS.indexOf(e[0]) < 0)
        nums[lab(e[0])] = e[1];
    });
    if (Object.keys(nums).length)
      box.appendChild(Router.card("📊 Числа", Router.statGrid(nums)));
    box.appendChild(Router.viewBar(function () {
      Router.open("ency_edit",
        { entity: params.entity, id: params.id, rec: rec });
    }));
  })();
});