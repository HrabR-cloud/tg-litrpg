/* Меню v2, «📊 Личность» героя (19.09.2026): просмотр и редактор 9 шкал
(СС §3) активного героя — так же, как у именных NPC; подписи из
window.SCALES_RU; данные через /api/hero/personality_get|save.
Правило навигации ТЗ v5 §10.2: просмотр → «✏️ Изменить» → «💾 Сохранить».
IIFE, константы локальны, дублей нет. */
(function () {
const KEYS = ["openness", "conscientiousness", "extraversion",
"agreeableness", "neuroticism", "libido", "kinkiness",
"exhibitionism", "fidelity"];
function ru(k) { return (window.SCALES_RU || {})[k] || k; }
Router.register("hero_personality", function (box) {
box.appendChild(Router.el("div", "mut", "⏳…"));
(async function () {
let r = null;
try { r = await Api.post("/api/hero/personality_get", {}); } catch (e) {}
box.innerHTML = "";
if (!r || !r.ok) {
box.appendChild(Router.card("⚠️",
Router.el("div", "mut", "Нет данных личности героя.")));
box.appendChild(Router.viewBar(null));
return;
}
box.appendChild(Router.el("div", "bar",
"<span class='chip'>📊 " + (r.name || "Герой") + "</span>"));
const pers = {};
KEYS.forEach(function (k) {
if (r.pers[k] != null) pers[ru(k)] = r.pers[k];
});
box.appendChild(Router.card("📊 Шкалы личности", Router.statGrid(pers)));
box.appendChild(Router.el("div", "mut",
"Личность меняется медленно; значения 0–100. Эксгибиционизм — порог откровенности одежды для проверки «Надеть»."));
box.appendChild(Router.viewBar(function () {
Router.open("hero_personality_edit", { pers: r.pers });
}));
})();
});
Router.register("hero_personality_edit", function (box, params) {
const pers = params.pers || {};
const store = {};
const c = Router.card("✏️ Личность героя", null);
KEYS.forEach(function (k) {
const f = Router.el("div", "field");
f.innerHTML = "<label>" + ru(k) + "</label>";
const inp = document.createElement("input");
inp.type = "number"; inp.min = 0; inp.max = 100;
inp.value = pers[k] != null ? pers[k] : 50;
store[k] = inp; f.appendChild(inp); c.appendChild(f);
});
box.appendChild(c);
box.appendChild(Router.editBar(async function () {
const fields = {};
KEYS.forEach(function (k) {
fields[k] = Math.max(0, Math.min(100, parseInt(store[k].value, 10) || 0));
});
const r = await Api.post("/api/hero/personality_save", { fields: fields });
Api.toast(r && r.ok ? "✅ Сохранено" : "❌ " + ((r && r.error) || "ошибка"));
if (r && r.ok) Router.back();
}));
});
})();