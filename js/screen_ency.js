/* Меню v2, «📚 Энциклопедия» v5 (19.09.2026): плитки категорий+сегменты;
списки — плитки 2 колонки с «🗑» (подтверждение → /api/ency/delete; сервер
чистит связи; активные мир/герой защищены ошибкой); клик по «🗑» НЕ открывает
карточку; СВЕРХУ «🎨 Общая генерация картинок» с прогрессом (опрос
/api/ency/gen_status, заполнение по done/total); роутинг: scenario→
world_view, location→location_card, item→item_card, race→race_card,
faction→faction_card, npc_base/npc_named→npc_card, иначе→ency_view
(карточки в screen_ency_cards.js, редакторы в screen_ency_edit.js).
Глобально: lab() — русские подписи (ruLabel → SCALES_RU → EXTRA_RU → ключ). */
const ENCY_CATS = [["scenario","🌍","Мир"],["location","🗺️","Локации"],
["npc_base","👥","Базовые NPC"],["npc_named","🌟","NPC с именем"],
["item","🎒","Предметы"],["effect","✨","Эффекты"],
["race","🧬","Расы"],["faction","🚩","Фракции"]];
let ENCY_SEL = null;
let GEN_TIMER = 0;
const EXTRA_RU = {
friendship_scale:"Шкала дружбы", lust_scale:"Шкала страсти",
role_description:"Роль и характер", ability_craft:"Ремесло",
communication_style:"Стиль общения", last_dialog:"Последний диалог",
archetype_id:"Архетип (id)", hero_slayer:"Убийца героя",
slayer_day:"День убийства", is_template:"Шаблон",
hostile:"Враждебность", is_dead:"Мёртв",
linked_hero_id:"Связанный герой", is_active:"Активен",
mood_cause:"Причина настроения", mood_intensity:"Сила настроения",
mood_decay:"Затухание настроения", mood_text:"Текст настроения",
intoxication:"Опьянение", fatigue:"Усталость", arousal:"Возбуждение",
pain:"Боль", revealing_level:"Открытость одежды",
current_outfit:"Текущая одежда", outfit_mood:"Мотив одежды",
outfit_items:"Набор: ID предметов (JSON)",
outfit_prompt:"Набор: суммарный промт одежды",
pregnancy_start_day:"День беременности",
base_price:"Базовая цена", weight:"Вес", stackable:"Штабелируемый",
lore:"Лор", two_handed:"Двуручное", equipped:"Экипировано",
danger_level:"Уровень опасности", resource_level:"Ресурсы",
social_level:"Социальность", mystery_level:"Загадочность",
access_level:"Доступность", faction_control:"Контроль фракции",
faction:"Фракция", tactic:"Предпочтительная тактика",
location_type:"Тип локации", location_kind:"Вид локации",
is_safe:"Точка возрождения", drama_level:"Драматичность",
inflation:"Инфляция", ideology:"Идеология", territory:"Территория",
joined_day:"День вступления", cheat_count:"Число измен",
cheat_known:"Известна ли измена", met_where:"Место знакомства",
met_how:"Как познакомились", introduced_by:"Кто познакомил",
game_date:"Дата", minute_of_day:"Время суток", season:"Сезон",
weather:"Погода", temperature_c:"Температура",
visual_prompt:"Внешность (RU)", image_prompt:"Промт (EN)",
effects_json:"Эффекты", backstory:"Предыстория",
appearance:"Внешность", occupation:"Должность",
icon:"Иконка (эмодзи)", emoji:"Иконка (эмодзи)"};
function lab(k) {
const r = (typeof ruLabel === "function") ? ruLabel(k) : k;
if (r && r !== k) return r;
return (window.SCALES_RU || {})[k] || EXTRA_RU[k] || k;
}
Router.register("ency", function (box) {
const seg = Router.el("div", "seg");
const body = Router.el("div");
drawGen(box, function () { drawBody(); });
box.appendChild(seg); box.appendChild(body);
function drawSeg() {
seg.innerHTML = "";
ENCY_CATS.forEach(function (e) {
const b = Router.el("button", null, e[1] + " " + e[2]);
if (ENCY_SEL === e[0]) b.classList.add("on");
b.onclick = function () { ENCY_SEL = e[0]; drawBody(); };
seg.appendChild(b);
});
}
function openTarget(id, r) {
if (id === "scenario") Router.open("world_view", { id: r.id });
else if (id === "location") Router.open("location_card", { id: r.id });
else if (id === "item") Router.open("item_card", { id: r.id });
else if (id === "race") Router.open("race_card", { id: r.id });
else if (id === "faction") Router.open("faction_card", { id: r.id });
else if (id === "npc_base" || id === "npc_named")
Router.open("npc_card", { id: r.id });
else Router.open("ency_view", { entity: id, id: r.id });
}
function delRow(e, r) {
e.stopPropagation();
if (!confirm("Удалить запись «" + r.name + "»? Связи будут очищены.")) return;
Api.post("/api/ency/delete", { entity: ENCY_SEL, id: r.id })
.then(function (res) {
Api.toast(res && res.ok ? "✅ Удалено"
: "❌ " + ((res && res.error) || "ошибка"));
if (res && res.ok) drawBody();
})
.catch(function () { Api.toast("Ошибка сети"); });
}
function drawBody() {
drawSeg();
body.innerHTML = "";
if (!ENCY_SEL) {
const tiles = Router.el("div", "grid2");
ENCY_CATS.forEach(function (e) {
const t = Router.el("div", "card tile");
t.innerHTML = "<div class='tile-ic'>" + e[1] + "</div>" +
"<div class='tile-t'>" + e[2] + "</div>";
t.onclick = function () { ENCY_SEL = e[0]; drawBody(); };
tiles.appendChild(t);
});
body.appendChild(tiles);
body.appendChild(Router.viewBar(null));
return;
}
const list = Router.el("div");
list.innerHTML = "<div class='card pad'><div class='mut'>⏳…</div></div>";
body.appendChild(list);
Api.post("/api/ency/list", { entity: ENCY_SEL }).then(function (res) {
list.innerHTML = "";
const c = Router.card("📚 Список", null);
const grid = Router.el("div", "grid2");
c.appendChild(grid);
const rows = (res && res.rows) || [];
if (!rows.length) grid.appendChild(Router.el("div", "mut", "Пусто."));
rows.forEach(function (r) {
const tile = Router.el("div", "card tile");
tile.style.cssText = "padding:6px;display:flex;flex-direction:" +
"column;gap:4px;cursor:pointer;position:relative;";
const im = document.createElement("img");
im.style.cssText = "width:100%;height:80px;object-fit:cover;" +
"border-radius:8px;background:#2d2547;";
tile.appendChild(im);
if (r.img) Api.imgT(r.img).then(function (u) { if (u) im.src = u; });
tile.appendChild(Router.el("div", "tile-t", r.name));
const meta = [r.slot ? SLOT_RU[r.slot] : "",
r.quality ? "кач. " + r.quality : "",
r.rarity ? RARITY_RU[r.rarity] || r.rarity : "",
r.gender ? GENDER_RU[r.gender] : "",
r.level != null ? "ур. " + r.level : "",
r.two_handed ? "двуручное" : ""].filter(Boolean).join(" · ");
if (meta) tile.appendChild(Router.el("div", "tile-d", meta));
const dbtn = Router.btn("🗑", function (e) { delRow(e, r); }, "danger");
dbtn.style.cssText = "position:absolute;top:2px;right:2px;" +
"padding:2px 7px;font-size:11px;z-index:2;";
tile.appendChild(dbtn);
tile.onclick = function () { openTarget(ENCY_SEL, r); };
grid.appendChild(tile);
});
list.appendChild(c);
list.appendChild(Router.viewBar(null));
}).catch(function () { list.innerHTML = ""; });
}
function drawGen(parent, redraw) {
const bar = Router.el("div", "bar");
const btn = Router.btn("🎨 Общая генерация картинок", async function () {
btn.disabled = true;
const r = await Api.post("/api/ency/gen_missing", {});
if (r && r.ok) {
if (!r.total) {
Api.toast("✅ У всех записей уже есть картинки");
btn.disabled = false;
return;
}
Api.toast("⏳ Запущено генераций: " + r.total);
poll();
} else {
Api.toast("❌ " + ((r && r.error) || "ошибка"));
btn.disabled = false;
}
}, "primary");
bar.appendChild(btn);
const track = document.createElement("div");
track.style.cssText = "flex:1;height:8px;border-radius:4px;" +
"background:#2d2547;overflow:hidden;display:none;";
const fill = document.createElement("div");
fill.style.cssText = "height:100%;width:0%;border-radius:4px;" +
"background:linear-gradient(90deg,#7b5cff,#c86bff);transition:width .5s;";
track.appendChild(fill);
bar.appendChild(track);
const gLab = Router.el("div", "mut", "");
parent.appendChild(bar);
parent.appendChild(gLab);
function poll() {
if (GEN_TIMER) clearInterval(GEN_TIMER);
track.style.display = "block";
const tick = async function () {
let s = null;
try { s = await Api.post("/api/ency/gen_status", {}); } catch (e) { return; }
if (!s || !s.ok) return;
const pct = s.total ? Math.round(s.done / s.total * 100) : 0;
fill.style.width = pct + "%";
gLab.textContent = "⏳ Генерация картинок: " + s.done + "/" + s.total +
" (" + pct + "%)" + (s.current ? " · сейчас: " + s.current : "") +
(s.errors ? " · ошибок: " + s.errors : "");
if (!s.running) {
clearInterval(GEN_TIMER); GEN_TIMER = 0;
gLab.textContent = "✅ Готово изображений: " + s.done +
(s.errors ? " · ошибок: " + s.errors : "");
track.style.display = "none";
btn.disabled = false;
Api.resetImgCache();
redraw();
}
};
tick();
GEN_TIMER = setInterval(tick, 4000);
}
Api.post("/api/ency/gen_status", {}).then(function (s) {
if (s && s.ok && s.running) { btn.disabled = true; poll(); }
});
}
drawBody();
});