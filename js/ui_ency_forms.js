/* Общие форм-хелперы энциклопедии (22.09.2026 v1, ADR 12.48):
EFFECT_ENUMS (RU-опции эффектов/умений с «(не задано)»), refSelect
(раса/фракция из существующих), enumSelect (кастомный select),
ensureEmptyOption (гарантия «(не задано)» в select'ах FormField —
очистка поля шлёт "" и сервер маппит в NULL), makeStatGridField
(statgrid с русскими названиями, ТЗ v4 §9.6; нули не сохраняются),
loadOpts/OPT_CACHE/resetOpts. Глобал EncyF (без IIFE): используется
screen_ency_edit.js и screen_ency_new.js; lab/STAT_RU/STAT_ICON/Api —
из dict_ru.js/screen_ency.js/api.js на момент вызова. */
var EncyF = (function () {
  const OPT_CACHE = {};
  const EFFECT_ENUMS = {
    element: [["fire", "🔥 огонь"], ["water", "💧 вода"],
      ["earth", "🌍 земля"], ["air", "💨 воздух"],
      ["light", "✨ свет"], ["dark", "🌑 тьма"],
      ["poison", "☠ яд"]],
    duration_type: [["battle", "до конца боя"],
      ["days", "в игровых днях"]],
    damage_type_gci: [["physical", "физический"],
      ["piercing", "проникающий"], ["magical", "магический"],
      ["environmental", "окружающий"], ["psychic", "психический"]]};
  function loadOpts(entity) {
    if (OPT_CACHE[entity]) return Promise.resolve(OPT_CACHE[entity]);
    return Api.post("/api/ency/list", { entity: entity })
      .then(function (r) {
        OPT_CACHE[entity] = ((r && r.rows) || [])
          .map(function (x) { return x.name; });
        return OPT_CACHE[entity];
      });
  }
  function resetOpts() {
    for (const k in OPT_CACHE) delete OPT_CACHE[k];
  }
  function refSelect(key, current, preset, labFn) {
    const f = document.createElement("div");
    f.className = "field";
    f.appendChild(Object.assign(document.createElement("label"),
      { textContent: (labFn || lab)(key) }));
    const sel = document.createElement("select");
    sel.appendChild(new Option("⏳ загрузка…", ""));
    f.appendChild(sel);
    loadOpts(key).then(function (names) {
      sel.innerHTML = "";
      sel.appendChild(new Option("(не задано)", ""));
      const all = (names || []).slice();
      [current, preset].forEach(function (v) {
        if (v && all.indexOf(v) < 0) all.unshift(v);
      });
      all.forEach(function (v) {
        const o = new Option(v, v);
        if ((current || preset) === v) o.selected = true;
        sel.appendChild(o);
      });
    }).catch(function () {
      sel.innerHTML = "";
      sel.appendChild(new Option("(не задано)", ""));
    });
    return { el: f, get: function () { return sel.value; } };
  }
  function enumSelect(key, current, labFn) {
    const f = document.createElement("div");
    f.className = "field";
    f.appendChild(Object.assign(document.createElement("label"),
      { textContent: (labFn || lab)(key) }));
    const sel = document.createElement("select");
    sel.appendChild(new Option("(не задано)", ""));
    (EFFECT_ENUMS[key] || []).forEach(function (p) {
      sel.appendChild(new Option(p[1], p[0]));
    });
    sel.value = current || "";
    f.appendChild(sel);
    return { el: f, get: function () { return sel.value; } };
  }
  function ensureEmptyOption(fd, current) {
    const sel = fd && fd.el && fd.el.querySelector("select");
    if (!sel) return;
    let has = false;
    for (const o of sel.options) if (o.value === "") has = true;
    if (!has)
      sel.insertBefore(new Option("(не задано)", ""), sel.firstChild);
    if (current == null || current === "") sel.value = "";
  }
  function makeStatGridField(key, v, labFn, stores) {
    const f = document.createElement("div");
    f.className = "field";
    f.style.gridColumn = "1 / -1";
    f.innerHTML = "<label>" + (labFn || lab)(key) +
      " (влияют на статы)</label>";
    const grid = document.createElement("div");
    grid.className = "grid3";
    let curMods = {};
    try { curMods = JSON.parse(v || "{}") || {}; } catch (e) {}
    if (typeof curMods !== "object" || !curMods) curMods = {};
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
      d.appendChild(inp); grid.appendChild(d);
      inputs[k] = inp;
    }
    Object.keys(curMods).forEach(addRow);
    const addSel = document.createElement("select");
    addSel.appendChild(new Option("➕ добавить параметр…", ""));
    Object.keys(STAT_RU).concat(["heal"]).forEach(function (k) {
      addSel.appendChild(new Option(
        k === "heal" ? "Лечение" : STAT_RU[k], k));
    });
    addSel.onchange = function () {
      if (!addSel.value) return;
      addRow(addSel.value); addSel.value = "";
    };
    f.appendChild(grid); f.appendChild(addSel);
    stores[key] = function () {
      const out = {};
      Object.entries(inputs).forEach(function (e) {
        const num = parseFloat(e[1].value);
        if (!isNaN(num) && num !== 0) out[e[0]] = num;
      });
      return JSON.stringify(out);
    };
    return f;
  }
  return { EFFECT_ENUMS: EFFECT_ENUMS, loadOpts: loadOpts,
    resetOpts: resetOpts, refSelect: refSelect,
    enumSelect: enumSelect, ensureEmptyOption: ensureEmptyOption,
    makeStatGridField: makeStatGridField };
})();