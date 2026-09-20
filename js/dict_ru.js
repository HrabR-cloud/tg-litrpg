/* Меню v2, расширенные RU-словари. Фикс 18.09.2026: ранее файл падал с
ReferenceError (Object.assign(FIELD_RU,…), а FIELD_RU нигде не объявлен —
в router.js словарь называется FIELD_LABELS) → VALUE_RU/ruValue/gridRU не
создавались и карточки NPC/энциклопедии умирали. Теперь словари дописываются
в FIELD_LABELS безопасно, PERSONALITY_KEYS объявлен только здесь. */
const PERSONALITY_KEYS = ["openness", "conscientiousness", "extraversion",
  "agreeableness", "neuroticism", "libido", "kinkiness", "exhibitionism",
  "fidelity"];
if (typeof FIELD_LABELS === "undefined") { window.FIELD_LABELS = {}; }
Object.assign(FIELD_LABELS, {
  atmosphere: "Атмосфера", visibility: "Видимость",
  noise_level: "Уровень шума", temp_modifier: "Модификатор температуры",
  element: "Стихия", element_affinity: "Стихия", element_bonus: "Бонус стихии",
  effects_json: "Эффекты локации", stat_modifiers: "Модификаторы статов",
  base_stat_modifiers: "Модификаторы статов", weather: "Погода",
  season: "Сезон", temperature_c: "Температура", minute_of_day: "Время суток",
  game_date: "Дата", year: "Год", drama_level: "Уровень драмы",
  inflation: "Инфляция", tech_level: "Уровень технологий",
  magic_level: "Уровень магии", parent_id: "Родительская локация",
  location_kind: "Иерархия", location_type: "Тип локации",
  danger_level: "Уровень опасности", resource_level: "Ресурсы",
  social_level: "Социальность", mystery_level: "Загадочность",
  access_level: "Доступность", faction_control: "Контроль фракции",
  events_active: "События активны", is_safe: "Безопасная (возрождение)",
  revealing_level: "Открытость одежды", current_outfit: "Текущая одежда",
  outfit_mood: "Причина одежды", two_handed: "Двуручное",
  quality: "Качество", rarity: "Редкость", slot: "Слот", weight: "Вес",
  stackable: "Штабелируемый", base_price: "Базовая цена", price: "Цена",
  lore: "История", mood_intensity: "Сила настроения",
  mood_cause: "Причина настроения", attachment_style: "Тип привязанности",
  personality_tags: "Черты личности", age_category: "Возрастная категория",
  pregnancy_start_day: "День беременности", coma_expires_day: "Кома до дня",
  is_in_party: "В группе", is_immortal: "Бессмертный",
  is_pregnant: "Беременна", fertility_enabled: "Фертильность включена",
  npc_type: "Тип NPC", npc_role: "Роль NPC", rank: "Ранг", status: "Статус",
  reward_experience: "Награда (опыт)", reward_gold: "Награда (золото)",
  reward_items: "Награда (предметы)", completion_condition: "Условие выполнения",
  objectives: "Условия выполнения", rewards: "Награда",
  time_limit: "Срок", failure_consequence: "Последствие провала",
  prerequisites: "Требования", next_quest: "Следующий квест",
  quest_type: "Тип квеста", giver_npc_id: "Квестодатель",
  last_played: "Последняя игра", game_day: "День мира",
  order_num: "Порядок", warmth: "Теплота",
  relationship_type: "Тип отношений", race_max_level: "Предел уровня расы",
  schedule: "Расписание", knowledge: "Знания", resistances: "Сопротивления",
  icon_emoji: "Иконка (эмодзи)", damage_type: "Тип урона",
  skill_group: "Группа умений", skill_type: "Тип умения",
  base_damage: "Базовый урон", cooldown: "Кулдаун",
  speed_bonus: "Бонус скорости", max_level: "Предел уровня",
  leader_id: "Лидер", territory: "Территория", allies: "Союзники",
  enemies: "Враги", resources: "Ресурсы", culture: "Культура",
  ideology: "Идеология", greeting: "Приветствие", genre: "Жанр",
  position: "Должность", preferred_tactic: "Боевая тактика",
  visual_prompt: "Внешность (RU)", image_prompt: "Промт (EN)",
  image_media_id: "Изображение", avatar_media_id: "Изображение лица",
  fullbody_media_id: "Изображение в рост", base_stats: "Базовые статы",
  effective_stats: "Эффективные статы", effects: "Эффекты",
  equipped_items: "Экипировка", openness: "Открытость (личность)",
  conscientiousness: "Добросовестность", extraversion: "Экстраверсия",
  agreeableness: "Дружелюбие", neuroticism: "Невротизм",
  libido: "Либидо", kinkiness: "Раскрепощённость",
  exhibitionism: "Эксгибиционизм", fidelity: "Верность",
  affection: "Привязанность", intimacy: "Близость", mood: "Настроение",
  experience: "Опыт", reputation: "Репутация", is_merchant: "Торговец",
});
const VALUE_RU = {
  weather: { clear: "ясно", cloudy: "облачно", rain: "дождь", snow: "снег",
    storm: "гроза", heat: "жара", blizzard: "метель" },
  season: { winter: "зима", spring: "весна", summer: "лето", autumn: "осень" },
  location_type: { peaceful: "мирная", dangerous: "опасная" },
  location_kind: { region: "регион", location: "локация", zone: "зона",
    poi: "точка интереса" },
  status: { alive: "жив", comatose: "в коме", dead: "мёртв", active: "активно",
    completed: "завершено", declined: "отклонено", started: "в процессе",
    pending: "не начато" },
  gender: { male: "мужской", female: "женский" },
  npc_type: { base: "базовый", named: "именной" },
  rarity: { common: "обычный", uncommon: "необычный", rare: "редкий",
    epic: "эпический", legendary: "легендарный" },
  attachment_style: { secure: "надёжный", anxious: "тревожный",
    avoiding: "избегающий", fearful_avoiding: "тревожно-избегающий" },
  age_category: { child: "ребёнок", young: "молодой", mature: "зрелый",
    old: "старый" },
  rank: { regular: "обычный", elite: "элитный", child: "ребёнок" },
  npc_role: { ally: "союзник", neutral: "нейтральный", enemy: "враг",
    faction: "фракционный", unique: "уникальный", merchant: "торговец",
    mentor: "наставник" },
  duration_type: { battle: "бой", days: "дни" },
  element: { fire: "огонь", water: "вода", earth: "земля", air: "воздух",
    light: "свет", dark: "тьма" },
  preferred_tactic: { aggressive: "агрессивная", defensive: "оборонительная",
    balanced: "сбалансированная", magic: "магическая" },
  quest_type: { main: "основной", side: "побочный", faction: "фракционный",
    rep: "репутационный", chain: "цепочка", dynamic: "динамический",
    hidden: "тайный" },
  slot: SLOT_RU,
};
function ruValue(k, v) {
  if (typeof v !== "string") return v;
  const m = VALUE_RU[k];
  return (m && m[v]) || v;
}
gridRU = function (obj) {
  const g = Router.el("div", "statgrid");
  Object.entries(obj || {}).forEach(function ([k, v]) {
    if (k.endsWith("_id")) return;
    g.appendChild(Router.el("div", null,
      `<div class="k">${ruLabel(k)}</div><div class="v">${ruValue(k, v)}</div>`));
  });
  return g;
};