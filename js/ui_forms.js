/* UI-помощники форм (19.09.2026): единый стиль редакторов меню.
- ENUMS/ENUM_RU: строковые поля со СТРОГО ограниченным набором значений →
  select (выпадающее меню); текущее значение вне списка добавляется опцией,
  чтобы не потерять данные, но новый мусор ввести нельзя;
- флаги (is_/has_/two_handed/stackable/equipped/cheat_known/…) → select Да/Нет;
- иконки (ключи icon/emoji) → select из палитры ИГРОВЫХ иконок ICONS;
- шкалы R100 → input number с min/max 0-100 и клампом при чтении;
- FormField.make(key,label,value,kind) → {el, get}; kindFor(key,value).
Глобалы: ENUMS, ENUM_RU, ICONS, FormField. Без зависимостей. */
(function () {
const ENUMS = {
gender: ["male", "female"],
age_category: ["child", "teen", "adult", "elder"],
npc_type: ["base", "named"],
npc_role: ["ally", "neutral", "enemy", "faction", "unique", "merchant", "mentor"],
attachment_style: ["secure", "anxious", "avoidant", "fearful-avoidant"],
relationship_type: ["perfect_love", "romantic_love", "rational_love",
"companionate_love", "infatuation", "empty_love", "friendship",
"indifference", "enmity", "family"],
location_type: ["peaceful", "dangerous"],
location_kind: ["region", "location", "zone", "poi"],
rank: ["regular", "elite", "boss"],
status: ["alive", "dead", "comatose", "missing"],
element: ["fire", "water", "earth", "air", "light", "dark", "poison"],
duration_type: ["battle", "days"],
season: ["winter", "spring", "summer", "autumn"],
weather: ["clear", "cloudy", "rain", "snow", "storm", "heat", "blizzard"],
mood: ["happy", "angry", "excited", "sad", "shocked", "indifferent"],
rarity: ["common", "uncommon", "rare", "epic", "legendary"],
faction_type: ["guild", "kingdom", "order", "syndicate", "clan",
"corporation", "rebellion"],
damage_type: ["physical", "piercing", "magical", "environmental", "psychic"],
slot: ["hand", "hand2", "head", "outer", "inner", "lingerie", "feet",
"necklace", "ring1", "ring2", "earring1", "earring2",
"consumable", "quest", "resource"]};
const ENUM_RU = {
male: "Мужской", female: "Женский", child: "Ребёнок", teen: "Подросток",
adult: "Взрослый", elder: "Пожилой", base: "Базовый", named: "Именной",
ally: "Союзник", neutral: "Нейтрал", enemy: "Враг", faction: "Фракционный",
unique: "Уникальный", merchant: "Торговец", mentor: "Наставник",
secure: "Надёжный", anxious: "Тревожный", avoidant: "Избегающий",
"fearful-avoidant": "Тревожно-избегающий",
perfect_love: "Совершенная любовь", romantic_love: "Романтическая любовь",
rational_love: "Рациональная любовь", companionate_love: "Дружеская любовь",
infatuation: "Влюблённость/интрижка", empty_love: "Пустая любовь",
friendship: "Дружба", indifference: "Равнодушие", enmity: "Вражда",
family: "Семья", peaceful: "Мирная", dangerous: "Опасная",
region: "Регион", location: "Локация", zone: "Зона", poi: "POI",
regular: "Обычный", elite: "Элитный", boss: "Босс", alive: "Жив",
dead: "Мёртв", comatose: "В коме", missing: "Пропал",
fire: "Огонь", water: "Вода", earth: "Земля", air: "Воздух",
light: "Свет", dark: "Тьма", poison: "Яд", battle: "До конца боя",
days: "Дни", winter: "Зима", spring: "Весна", summer: "Лето",
autumn: "Осень", clear: "Ясно", cloudy: "Облачно", rain: "Дождь",
snow: "Снег", storm: "Гроза", heat: "Жара", blizzard: "Метель",
happy: "Счастлива", angry: "Зла", excited: "Возбуждена", sad: "Грустит",
shocked: "В шоке", indifferent: "Равнодушна", common: "Обычный",
uncommon: "Необычный", rare: "Редкий", epic: "Эпический",
legendary: "Легендарный", guild: "Гильдия", kingdom: "Королевство",
order: "Орден", syndicate: "Синдикат", clan: "Клан",
corporation: "Корпорация", rebellion: "Повстанцы", physical: "Физический",
piercing: "Проникающий", magical: "Магический",
environmental: "Окружающий", psychic: "Психический", consumable: "Расходник",
quest: "Квестовый", resource: "Ресурс"};
const ICONS = ["⚔️", "🗡️", "🏹", "️", "🪄", "", "🧪", "💊", "🍞", "",
"👗", "", "🧢", "🥾", "🧤", "💍", "📿", "️", "", "", "", "️",
"💰", "🪙", "💎", "🔥", "❄️", "⚡", "🌿", "️"];
const R100 = ["openness", "conscientiousness", "extraversion",
"agreeableness", "neuroticism", "libido", "kinkiness", "exhibitionism",
"fidelity", "revealing_level", "mood_intensity", "intoxication", "fatigue",
"arousal", "pain", "reputation", "affection", "intimacy", "passion",
"commitment", "conflict", "warmth", "friendship_scale", "lust_scale",
"danger_level", "resource_level", "social_level", "mystery_level",
"access_level", "faction_control"];
const BOOL_RE = /^(is_|has_|two_handed|stackable|equipped|cheat_known|player_present|fertility_)/;
function kindFor(key, value) {
if (ENUMS[key]) return "enum";
if (/icon|emoji/.test(key)) return "icon";
if (BOOL_RE.test(key) || typeof value === "boolean") return "bool";
if (typeof value === "number") return "num";
if (typeof value === "string" && value.length > 60) return "area";
return "text";
}
function make(key, label, value, kind) {
const f = document.createElement("div");
f.className = "field";
const lb = document.createElement("label");
lb.textContent = label;
f.appendChild(lb);
let get;
if (kind === "enum" || kind === "bool" || kind === "icon") {
const sel = document.createElement("select");
let opts;
if (kind === "bool") opts = ["1", "0"];
else if (kind === "icon") opts = ICONS.slice();
else opts = (ENUMS[key] || []).slice();
const cur = (value == null ? "" : String(value));
if (cur && opts.indexOf(cur) < 0) opts.unshift(cur);
if (kind !== "bool" && cur === "") {
const o0 = document.createElement("option");
o0.value = ""; o0.textContent = "(не задано)";
sel.appendChild(o0);
}
opts.forEach(function (v) {
const o = document.createElement("option");
o.value = v;
o.textContent = kind === "bool" ? (v === "1" ? "Да" : "Нет")
: (ENUM_RU[v] || v);
if (cur === v) o.selected = true;
sel.appendChild(o);
});
get = function () { return kind === "bool" ? parseInt(sel.value, 10) : sel.value; };
f.appendChild(sel);
} else if (kind === "num") {
const inp = document.createElement("input");
inp.type = "number";
inp.value = value == null ? 0 : value;
if (R100.indexOf(key) >= 0) { inp.min = 0; inp.max = 100; }
get = function () {
let v = parseFloat(inp.value);
if (isNaN(v)) v = 0;
if (R100.indexOf(key) >= 0) v = Math.max(0, Math.min(100, v));
return v;
};
f.appendChild(inp);
} else if (kind === "area") {
const ta = document.createElement("textarea");
ta.value = value == null ? "" : value;
f.style.gridColumn = "1 / -1";
get = function () { return ta.value; };
f.appendChild(ta);
} else {
const inp = document.createElement("input");
inp.value = value == null ? "" : value;
get = function () { return inp.value; };
f.appendChild(inp);
}
return { el: f, get: get };
}
window.ENUMS = ENUMS; window.ENUM_RU = ENUM_RU; window.ICONS = ICONS;
window.FormField = { make: make, kindFor: kindFor, R100: R100 };
})();