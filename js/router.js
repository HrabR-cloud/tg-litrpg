/* Меню v2, роутер + ОБЩИЕ ХЕЛПЕРЫ (единственный источник): словари RU,
ruLabel, ruValue, safeParse, groupSlots, skillParamsLine, ITEM_GROUPS.
ВНИМАНИЕ (фикс 19.09.2026 v12, «Назад появляется и затирается вкладкой»):
кнопка «↩ Назад» больше НЕ отдельный fixed-элемент — она вставляется
ПЕРВОЙ СТРОКОЙ ВНУТРЬ #nav (ensureBackBar): её невозможно перекрыть
z-index'ом навигации или стереть перерисовкой экрана (навигацию чистит
только buildNav при старте, и сразу после неё кнопка возвращается).
viewBar/editBar свою «Назад» НЕ печатают (единственный источник — nav).
ВНИМАНИЕ (R-08): вход = просмотр; правка только через «✏️ Изменить». */
const GENDER_RU = { male: "Мужчина", female: "Женщина" };
const AGE_RU = { child: "Ребёнок", young: "Молодой", mature: "Зрелый", old: "Старый" };
const RARITY_RU = { common: "обычный", uncommon: "необычный", rare: "редкий",
  epic: "эпический", legendary: "легендарный" };
const STATUS_RU = { active: "активен", completed: "завершён", declined: "отклонён",
  comatose: "в коме", dead: "мёртв", pending: "не начато" };
const STAT_RU = {
  strength: "Сила", magic_power: "Маг. сила", health: "Здоровье",
  max_health: "Макс. здоровье", speed: "Скорость", armor: "Броня",
  intelligence: "Интеллект", charisma: "Харизма", luck: "Удача",
  crit_chance: "Крит физ (шанс)", crit_power: "Крит физ (множ.)",
  magic_crit_chance: "Крит маг (шанс)", magic_crit_power: "Крит маг (множ.)",
  perception: "Восприятие", dexterity: "Ловкость", defense: "Защита",
  agility: "Ловкость (agility)",
};
const STAT_ICON = {
  strength: "💪", magic_power: "🔮", health: "❤️", max_health: "💖",
  speed: "⚡", armor: "🛡️", intelligence: "🧠", charisma: "✨",
  luck: "🍀", crit_chance: "🎯", crit_power: "💥",
  magic_crit_chance: "🌟", magic_crit_power: "☄️", perception: "👁️",
  dexterity: "🏃", defense: "🛡️", agility: "🏃",
};
const SLOT_RU = {
  hand: "Оружие (осн.)", hand2: "Оружие (вторая)", head: "Головной убор",
  outer: "Верхняя одежда", inner: "Нижняя одежда", lingerie: "Бельё",
  feet: "Обувь", necklace: "Ожерелье", ring1: "Кольцо 1", ring2: "Кольцо 2",
  earring1: "Серьга 1", earring2: "Серьга 2",
  consumable: "Расходные", quest: "Квестовые",
};
const QUALITY_RU = ["", "Ржавый", "Обычный", "Добротный", "Редкий",
  "Эпический", "Легендарный"];
const ITEM_GROUPS = [["all", "Все"], ["hand", "Оружие"], ["head", "Головной убор"],
  ["outer", "Верхняя одежда"], ["inner", "Нижняя одежда"], ["lingerie", "Бельё"],
  ["feet", "Обувь"], ["necklace", "Ожерелье"], ["rings", "Кольца"],
  ["earrings", "Серьги"], ["consumable", "Расходные"], ["quest", "Квестовые"]];
const FIELD_LABELS = {
  description: "Описание", effects_json: "Эффекты локации",
  base_stat_modifiers: "Модификаторы статов", stat_modifiers: "Модификаторы",
  danger_level: "Уровень опасности", resource_level: "Ресурсы",
  social_level: "Социальность", mystery_level: "Загадочность",
  access_level: "Доступность", faction_control: "Контроль фракции",
  weather: "Погода", events_active: "События активны",
  location_type: "Тип локации", location_kind: "Иерархия",
  parent_id: "Родительская локация", npc_type: "Тип NPC", npc_role: "Роль NPC",
  level: "Уровень", race: "Раса", gender: "Пол", age: "Возраст",
  age_category: "Возрастная категория", occupation: "Род занятий",
  rarity: "Редкость", quality: "Качество", slot: "Слот", weight: "Вес",
  stackable: "Штабелируемый", lore: "История", base_price: "Базовая цена",
  value: "Цена", max_level: "Предел уровня", ideology: "Идеология",
  territory: "Территория", leader_id: "Лидер", resources: "Ресурсы",
  type: "Тип", name: "Название", prompt: "Промт", image_prompt: "Промт (EN)",
  visual_prompt: "Внешность (RU)", current_outfit: "Текущая одежда",
  revealing_level: "Открытость одежды", outfit_mood: "Настроение одежды",
  mood: "Настроение", mood_intensity: "Сила настроения",
  mood_cause: "Причина настроения", intimacy: "Близость", libido: "Либидо",
  kinkiness: "Раскрепощённость", exhibitionism: "Эксгибиционизм",
  fidelity: "Верность", openness: "Открытость",
  conscientiousness: "Добросовестность", extraversion: "Экстраверсия",
  agreeableness: "Дружелюбие", neuroticism: "Невротизм",
  attachment_style: "Тип привязанности", personality_tags: "Черты личности",
  fertility_enabled: "Фертильность включена", is_pregnant: "Беременна",
  pregnancy_start_day: "День беременности", is_immortal: "Бессмертный",
  is_in_party: "В группе", reputation: "Репутация", gold: "Золото",
  experience: "Опыт", position: "Должность",
  preferred_tactic: "Боевая тактика", base_stats: "Базовые статы",
  effective_stats: "Эффективные статы", effects: "Эффекты",
  equipped_items: "Экипировка (JSON)", two_handed: "Двуручное",
};
function ruLabel(k) { return STAT_RU[k] || SLOT_RU[k] || FIELD_LABELS[k] || k; }
function ruValue(k, v) {
  if (v == null || v === "") return "";
  if (k === "age_category") return AGE_RU[v] || v;
  if (k === "rarity") return RARITY_RU[v] || v;
  if (k === "gender") return GENDER_RU[v] || v;
  if (k === "status") return STATUS_RU[v] || v;
  return v;
}
function safeParse(v, d) {
  if (v == null) return d;
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch (e) { return d; }
}
function groupSlots(g) {
  if (g === "all") return null;
  if (g === "hand") return ["hand", "hand2"];
  if (g === "rings") return ["ring1", "ring2"];
  if (g === "earrings") return ["earring1", "earring2"];
  return [g];
}
function skillParamsLine(s) {
  const p = [];
  if (s.dmg != null) p.push("урон " + s.dmg);
  if (s.cd != null) p.push("кулдаун " + s.cd);
  if (s.sb != null) p.push("скорость " + (s.sb > 0 ? "+" : "") + s.sb);
  Object.entries(s.mods || {}).forEach(function ([k, v]) {
    p.push((STAT_RU[k] || k) + " " + (v > 0 ? "+" : "") + v);
  });
  return p.join(" · ") || "без чисел";
}
const Router = {
  screens: {}, stack: [], active: "home",
  NAV: [
    [["home", "🏠", "Домой"], ["hero", "👤", "Герой"], ["items", "🎒", "Вещи"],
     ["map", "🗺️", "Карта"], ["time", "⏰", "Время"]],
    [["quests", "📜", "Квесты"], ["party", "🤝", "Группа"],
     ["ency", "📚", "Энцикл."], ["arb", "⚖️", "Арбитр"],
     ["worlds", "🌍", "Миры"]],
  ],
  register(id, fn) { this.screens[id] = fn; },
  tab(id) { this.active = id; this.stack = [{ id: id, params: {} }]; this.render(); },
  open(id, params) { this.stack.push({ id: id, params: params || {} }); this.render(); },
  back() {
    if (this.stack.length > 1) { this.stack.pop(); this.render(); }
    else if (this.active !== "home") { this.tab("home"); }
  },
  top() { return this.stack[this.stack.length - 1]; },
  render() {
    const box = document.getElementById("screen");
    box.innerHTML = "";
    const t = this.top();
    const fn = this.screens[t.id] || Router.stub;
    fn(box, t.params || {});
    this.ensureBackBar();
    setTimeout(function () { Router.ensureBackBar(); }, 400);
    box.scrollTop = 0;
    this.markNav();
  },
  /* ЕДИНСТВЕННАЯ «↩ Назад»: первая строка ВНУТРИ #nav (v12) — не перекрывается
     навигацией (та же stacking-область), не стирается экранами. */
  ensureBackBar() {
    try {
      const nav = document.getElementById("nav");
      if (!nav) return;
      let bar = nav.querySelector(".backrow");
      if (!bar) {
        bar = this.el("div", "bar backrow");
        bar.style.margin = "0";
        const b = this.btn("↩ Назад", function () { Router.back(); }, "ghost");
        b.dataset.back = "1";
        bar.appendChild(b);
        nav.insertBefore(bar, nav.firstChild);
      }
    } catch (e) { /* меню остаётся рабочим */ }
  },
  stub(box) { box.appendChild(Router.el("div", "card pad", "🚧 Раздел в разработке.")); },
  buildNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = "";
    Router.NAV.forEach(function (row) {
      const r = Router.el("div", "navrow");
      row.forEach(function ([id, ic, lb]) {
        const b = Router.el("div", "navbtn");
        b.dataset.tab = id;
        b.innerHTML = `<span class="ic">${ic}</span><span>${lb}</span>`;
        b.onclick = function () { Router.tab(id); };
        r.appendChild(b);
      });
      nav.appendChild(r);
    });
    this.ensureBackBar();
    const self = this;
    if (!window._backrowResize) {
      window._backrowResize = true;
      window.addEventListener("resize", function () { self.ensureBackBar(); });
    }
  },
  markNav() {
    document.querySelectorAll(".navbtn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tab === Router.active);
    });
  },
  headerSync() {
    const st = Api.stateCache;
    if (!st || !st.ok) return;
    document.getElementById("hdr-avatar").innerHTML = "👤";
    document.getElementById("hdr-name").textContent =
      `${st.hero.name} · ${GENDER_RU[st.hero.gender] || ""}` +
      (st.hero.position ? ` · ${st.hero.position}` : "");
    const chips = document.getElementById("hdr-chips");
    chips.innerHTML = "";
    [ `⭐ Ур. ${st.hero.level}`, `💰 ${st.hero.gold}`,
      `❤️ ${st.hero.hp}/${st.hero.max_hp}`, `🌍 ${st.scenario.name}` ]
      .forEach(t => chips.appendChild(Router.el("span", "chip", t)));
  },
  async headerImages() {
    const st = Api.stateCache;
    if (!st || !st.ok) return;
    try {
      const bg = await Api.img(st.scenario.image);
      if (bg) document.getElementById("hdr-bg").style.backgroundImage = "url(" + bg + ")";
      const av = await Api.img(st.hero.avatar || st.hero.image);
      if (av) document.getElementById("hdr-avatar").innerHTML = `<img src="${av}" alt="">`;
    } catch (e) {}
  },
  async header() { this.headerSync(); await this.headerImages(); },
  el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  },
  btn(label, fn, cls) { const b = this.el("button", "btn " + (cls || ""), label); b.onclick = fn; return b; },
  chip(text) { return this.el("span", "chip", text); },
  card(title, node) {
    const c = this.el("div", "card pad");
    if (title) c.appendChild(this.el("h3", null, title));
    if (node) c.appendChild(node);
    return c;
  },
  viewBar(onEdit, extra) {
    const bar = this.el("div", "bar");
    if (onEdit) bar.appendChild(this.btn("✏️ Изменить", onEdit, "primary"));
    (extra || []).forEach(function ([lb, fn, cls]) { bar.appendChild(Router.btn(lb, fn, cls)); });
    if (!bar.children.length) bar.style.display = "none";
    return bar;
  },
  editBar(onSave) {
    const bar = this.el("div", "bar");
    bar.appendChild(this.btn("💾 Сохранить", onSave, "primary"));
    return bar;
  },
  statGrid(obj) {
    const g = this.el("div", "statgrid");
    Object.entries(obj || {}).forEach(function ([k, v]) {
      g.appendChild(Router.el("div", null,
        `<div class="k">${STAT_ICON[k] || "▪️"} ${STAT_RU[k] || k}</div><div class="v">${v}</div>`));
    });
    return g;
  },
};