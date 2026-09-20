/* Меню v2, карточка предмета + редактор.
ВНИМАНИЕ (фикс 16.09.2026): кнопки картинки (🎨/📤) ВНУТРИ редактора
(активируются кнопкой «✏️ Изменить»); просмотр — только чтение + Назад.
v2 (20.09.2026): statgrid «Модификаторы статов» + «Двуручное» + loadState.
v3 (20.09.2026, инцидент «пропала шкала генерации на предметах»): в редактор
возвращена шкала Prog под превью (старт перед 🎨, финиш в finally).
ИНВАРИАНТ: любая генерация изображения сопровождается шкалой загрузки
(ui_progress.js, window.Prog); fallback — пустой div, если модуль не поднят.
Файл обёрнут в IIFE: локальный Prog не конфликтует с глобальным const Prog
из screen_hero.js (правило инцидента screen_ency_edit v8). */
(function () {
const Prog = {
  create: function () {
    return window.Prog ? window.Prog.create()
      : document.createElement("div");
  },
  start: function (el, t) { if (window.Prog) window.Prog.start(el, t || 60); },
  finish: function (el) { if (window.Prog) window.Prog.finish(el); }
};
Router.register("item", function (box, params) {
  const owner = params.owner || null;
  let row = params.row || null;
  function renderRow() {
    box.innerHTML = "";
    const chips = Router.el("div", "bar");
    chips.style.flexWrap = "wrap";
    [row.name, SLOT_RU[row.slot] || row.slot,
      QUALITY_RU[row.quality] || ("кач. " + row.quality),
      RARITY_RU[row.rarity] || row.rarity || "",
      "×" + (row.qty != null ? row.qty : 1),
      row.two_handed ? "двуручное" : "", row.equipped ? "надето" : ""]
      .filter(Boolean).forEach(t => chips.appendChild(Router.chip(t)));
    box.appendChild(chips);
    const pc = Router.el("div", "card pad");
    const im = Router.el("img", "imgfull");
    im.style.display = "none";
    pc.appendChild(im);
    box.appendChild(pc);
    if (row.img) Api.imgT(row.img).then(u => { if (u) { im.src = u; im.style.display = "block"; } });
    if (row.desc) box.appendChild(Router.card("📖 Описание", Router.el("div", "mut", row.desc)));
    if (row.mods && Object.keys(row.mods).length) {
      box.appendChild(Router.card("📊 Параметры", Router.statGrid(row.mods)));
    }
    if (owner) {
      const ab = Router.el("div", "bar");
      if (row.slot === "consumable") {
        ab.appendChild(Router.btn("Использовать", async function () {
          const r = owner.npc
            ? await Api.post("/api/npc/use", { npc_id: owner.npc, inv: row.inv })
            : await Api.post("/api/menu/action", { action: "use_item", params: { inv: row.inv } });
          Api.toast(r && r.ok ? "✅ Использовано" : "❌ " + ((r && r.error) || "ошибка"));
          if (r && r.ok) Router.back();
        }, "primary"));
      } else if (row.slot !== "quest") {
        ab.appendChild(Router.btn(row.equipped ? "Снять" : "Надеть", async function () {
          let r;
          if (owner.npc) {
            r = await Api.post(row.equipped ? "/api/npc/unequip" : "/api/npc/equip",
              { npc_id: owner.npc, inv: row.inv });
          } else {
            r = await Api.post("/api/menu/action", row.equipped
              ? { action: "unequip", params: { slot: row.slot } }
              : { action: "equip", params: { inv: row.inv } });
          }
          Api.toast(r && r.ok ? "✅ Готово" : "❌ " + ((r && r.error) || "ошибка"));
          if (r && r.ok) { await Api.loadState(); Router.back(); }
        }, row.equipped ? "ghost" : "primary"));
      }
      box.appendChild(ab);
    }
    box.appendChild(Router.viewBar(function () {
      Router.open("item_edit", { row: row, owner: owner });
    }));
  }
  if (row) { renderRow(); }
  else {
    (async function () {
      try {
        const g = await Api.post("/api/ency/get", { entity: "item", id: params.id });
        if (g && g.ok) {
          const r = g.rec;
          row = { item_id: r.item_id, name: r.name, slot: r.slot, quality: r.quality,
            rarity: r.rarity, desc: r.description, img: r.image_media_id,
            mods: safeParse(r.base_stat_modifiers, {}), two_handed: r.two_handed,
            qty: 1, inv: null, equipped: false };
        }
      } catch (e) {}
      renderRow();
    })();
  }
});
/* === Редактор предмета: свойства + модификаторы статов + картинка со шкалой === */
Router.register("item_edit", function (box, params) {
  const row = params.row || {};
  const store = {};
  const prev = Router.el("div", "card pad");
  const pim = Router.el("img", "imgfull");
  pim.style.display = "none";
  prev.appendChild(pim);
  const prog = Prog.create();
  prev.appendChild(prog);
  box.appendChild(prev);
  function refreshPreview() {
    Api.resetImgCache();
    Api.post("/api/ency/get", { entity: "item", id: row.item_id }).then(function (g) {
      const p = (g && g.ok && g.rec) ? g.rec.image_media_id : "";
      if (p) Api.imgT(p).then(u => { if (u) { pim.src = u; pim.style.display = "block"; } });
    });
  }
  if (row.img) Api.imgT(row.img).then(u => { if (u) { pim.src = u; pim.style.display = "block"; } });
  const ib = Router.el("div", "bar");
  ib.style.flexWrap = "wrap";
  ib.appendChild(Router.btn("🎨 Картинка", async function () {
    Api.toast("⏳ Генерация (до минуты)…");
    Prog.start(prog, 60);
    let r = null;
    try {
      r = await Api.post("/api/gen_entity_image",
        { entity_type: "item", id: row.item_id });
    } finally {
      Prog.finish(prog);
    }
    if (r && r.ok) { refreshPreview(); Api.toast("✅ Готово"); }
    else Api.toast("❌ " + ((r && r.error) || "ошибка"));
  }, "ghost"));
  const up = document.createElement("label");
  up.className = "btn ghost"; up.style.flex = "1"; up.textContent = "📤 Загрузить";
  const fi = document.createElement("input");
  fi.type = "file"; fi.accept = "image/*"; fi.style.display = "none";
  fi.onchange = async function () {
    const f = fi.files[0]; if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch(Api.base + "/api/upload_entity_image?entity=item&id=" + row.item_id,
      { method: "POST", headers: { "ngrok-skip-browser-warning": "1" }, body: fd });
    const res = await r.json();
    if (res && res.ok) { refreshPreview(); Api.toast("✅ Загружено"); }
    else Api.toast("❌ Ошибка загрузки");
  };
  up.appendChild(fi); ib.appendChild(up);
  box.appendChild(ib);
  const c = Router.card("✏️ Свойства предмета", null);
  function field(key, label, kind, value) {
    const f = Router.el("div", "field");
    f.innerHTML = "<label>" + label + "</label>";
    const inp = document.createElement(kind === "area" ? "textarea" : "input");
    inp.value = value == null ? "" : value;
    store[key] = inp; f.appendChild(inp); c.appendChild(f);
  }
  field("name", "Название", "text", row.name);
  const fs = Router.el("div", "field");
  fs.innerHTML = "<label>Слот</label>";
  const selS = document.createElement("select");
  Object.entries(SLOT_RU).forEach(function ([v, l]) {
    const o = document.createElement("option");
    o.value = v; o.textContent = l;
    if (row.slot === v) o.selected = true;
    selS.appendChild(o);
  });
  store.slot = selS; fs.appendChild(selS); c.appendChild(fs);
  const fq = Router.el("div", "field");
  fq.innerHTML = "<label>Качество (1-6)</label>";
  const selQ = document.createElement("select");
  for (let q = 1; q <= 6; q++) {
    const o = document.createElement("option");
    o.value = q; o.textContent = q + " — " + (QUALITY_RU[q] || "");
    if (row.quality === q) o.selected = true;
    selQ.appendChild(o);
  }
  store.quality = selQ; fq.appendChild(selQ); c.appendChild(fq);
  const fr = Router.el("div", "field");
  fr.innerHTML = "<label>Редкость</label>";
  const selR = document.createElement("select");
  Object.entries(RARITY_RU).forEach(function ([v, l]) {
    const o = document.createElement("option");
    o.value = v; o.textContent = l;
    if (row.rarity === v) o.selected = true;
    selR.appendChild(o);
  });
  store.rarity = selR; fr.appendChild(selR); c.appendChild(fr);
  /* v2: двуручное (инвариант слотов — web_equip) */
  const ft = Router.el("div", "field");
  ft.innerHTML = "<label>Двуручное</label>";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!row.two_handed;
  store.two_handed = cb;
  ft.appendChild(cb); c.appendChild(ft);
  /* v2: statgrid модификаторов статов (ТЗ v4 §9.6); нули не пишутся */
  const fm = Router.el("div", "field");
  fm.style.gridColumn = "1 / -1";
  fm.innerHTML = "<label>📊 Модификаторы статов (влияют на владельца)</label>";
  const mgrid = Router.el("div", "grid3");
  const curMods = (row.mods && typeof row.mods === "object") ? row.mods : {};
  const minp = {};
  function addModRow(k) {
    if (minp[k]) return;
    const d = Router.el("div", "field");
    d.innerHTML = "<label>" + (STAT_ICON[k] || "▪️") + " " +
      (k === "heal" ? "Лечение" : (STAT_RU[k] || k)) + "</label>";
    const inp = document.createElement("input");
    inp.type = "number";
    inp.value = curMods[k] == null ? 0 : curMods[k];
    d.appendChild(inp);
    mgrid.appendChild(d);
    minp[k] = inp;
  }
  Object.keys(curMods).forEach(addModRow);
  const addSel = document.createElement("select");
  addSel.appendChild(new Option("➕ добавить параметр…", ""));
  Object.keys(STAT_RU).concat(["heal"]).forEach(function (k) {
    addSel.appendChild(new Option(k === "heal" ? "Лечение" : STAT_RU[k], k));
  });
  addSel.onchange = function () {
    if (!addSel.value) return;
    addModRow(addSel.value);
    addSel.value = "";
  };
  fm.appendChild(mgrid);
  fm.appendChild(addSel);
  c.appendChild(fm);
  store.__mods = function () {
    const out = {};
    Object.entries(minp).forEach(function (e) {
      const num = parseFloat(e[1].value);
      if (!isNaN(num) && num !== 0) out[e[0]] = num;
    });
    return JSON.stringify(out);
  };
  field("desc", "Описание", "area", row.desc);
  field("prompt", "Промт внешнего вида (для 🎨)", "area", row.prompt || "");
  box.appendChild(c);
  box.appendChild(Router.editBar(async function () {
    const fields = { name: store.name.value.trim(), slot: store.slot.value,
      quality: parseInt(store.quality.value, 10) || 1, rarity: store.rarity.value,
      two_handed: store.two_handed.checked ? 1 : 0,
      base_stat_modifiers: store.__mods(),
      description: store.desc.value, image_prompt: store.prompt.value };
    const r = await Api.post("/api/ency/update",
      { entity: "item", id: row.item_id, fields: fields });
    Api.toast(r && r.ok ? "✅ Сохранено" : "❌ " + ((r && r.error) || "ошибка"));
    if (r && r.ok) { await Api.loadState(); Router.back(); }
  }));
});
})();