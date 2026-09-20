/* Меню v2, «🌍 Миры» v6 (20.09.2026): при входе во вкладку — принудительный
Api.loadState() (карточка мира показывает свежую картинку и активность);
у каждого мира угловая «🗑 Удалить» (подтверждение; активный мир сервер
отклоняет); у неактивных — «⭐ Сделать активным»; клик по карточке →
world_view; создание мира — форма (жанр select, название, описание, имя
героя) + прогресс-бар конвейера forge_world (/api/world/forge_status);
world_view БЕЗ собственной кнопки «Назад» (её даёт глобальная #backbar). */
let FORGE_TIMER = 0;
const WORLD_GENRES = [
["fantasy", "🧙 Фэнтези"],
["sci-fi", "🚀 Научная фантастика"],
["dating", "💘 Свидания / романтика"],
["horror", "👻 Хоррор"],
["modern", "🏙️ Современность"],
["other", "🎭 Другое"]];
Router.register("worlds", function (box) {
box.appendChild(Router.el("div", "mut", "⏳…"));
Api.loadState().then(function () {
box.innerHTML = "";
const st = Api.stateCache || {};
const worlds = st.scenarios || [];
const grid = Router.el("div", "grid2");
if (!worlds.length) {
grid.appendChild(Router.el("div", "mut", "Миров нет — создайте первый."));
}
worlds.forEach(function (w) {
const c = Router.el("div", "card pad");
c.style.position = "relative";
const im = Router.el("img", "imgfull");
im.style.height = "90px"; im.style.objectFit = "cover";
if (w.image) Api.imgT(w.image).then(function (u) {
if (u) im.src = u; else im.remove();
});
else im.remove();
c.appendChild(im);
const chips = Router.el("div", "bar");
chips.style.flexWrap = "wrap";
[w.name, w.genre || "", w.active ? "активен" : ""]
.filter(Boolean).forEach(function (t) {
chips.appendChild(Router.chip(t));
});
c.appendChild(chips);
const del = Router.btn("🗑", async function (e) {
e.stopPropagation();
if (!confirm("Удалить мир «" + w.name +
"» БЕЗВОЗВРАТНО? Герои, NPC, локации, расы и фракции мира будут удалены."))
return;
const r = await Api.post("/api/world/delete", { scenario_id: w.id });
Api.toast(r && r.ok ? "🗑 Мир удалён"
: "❌ " + ((r && r.error) || "ошибка"));
if (r && r.ok) { await Api.loadState(); Router.tab("worlds"); }
}, "danger");
del.style.cssText = "position:absolute;top:2px;right:2px;" +
"padding:2px 7px;font-size:11px;z-index:2;";
c.appendChild(del);
if (!w.active) {
const b = Router.btn("⭐ Сделать активным", async function (e) {
e.stopPropagation();
const r = await Api.post("/api/menu/action",
{ action: "switch", params: { scenario: w.id } });
Api.toast(r && r.ok ? "✅ Мир активен"
: "❌ " + ((r && r.error) || "ошибка"));
if (r && r.ok) { await Api.loadState(); Router.tab("worlds"); }
}, "primary");
b.style.width = "100%";
c.appendChild(b);
}
c.style.cursor = "pointer";
c.onclick = function () { Router.open("world_view", { id: w.id }); };
grid.appendChild(c);
});
box.appendChild(grid);
const bar = Router.el("div", "bar");
bar.style.flexWrap = "wrap";
bar.appendChild(Router.btn("➕ Создать новый мир", function () {
Router.open("world_create", {});
}, "primary"));
box.appendChild(bar);
});
});
Router.register("world_create", function (box) {
box.appendChild(Router.el("div", "bar",
"<span class='chip'>🌍 Создание нового мира</span>"));
const form = Router.card("Параметры мира", null);
const grid = Router.el("div", "grid3");
form.appendChild(grid);
function field(key, label, kind, value, placeholder) {
const f = Router.el("div", "field");
const lb = document.createElement("label");
lb.textContent = label;
f.appendChild(lb);
let inp;
if (kind === "area") {
inp = document.createElement("textarea");
inp.value = value || "";
if (placeholder) inp.placeholder = placeholder;
f.style.gridColumn = "1 / -1";
} else if (kind === "select") {
inp = document.createElement("select");
WORLD_GENRES.forEach(function (g) {
const o = document.createElement("option");
o.value = g[0]; o.textContent = g[1];
if (g[0] === (value || "fantasy")) o.selected = true;
inp.appendChild(o);
});
} else {
inp = document.createElement("input");
inp.type = kind;
inp.value = value || "";
if (placeholder) inp.placeholder = placeholder;
}
f.appendChild(inp);
grid.appendChild(f);
return inp;
}
const iName = field("name", "Название мира", "text", "",
"Например: Эльдория");
const iGenre = field("genre", "Жанр", "select", "fantasy");
const iDesc = field("description", "Краткое описание (для ИИ)", "area",
"", "Опишите мир в 2-3 предложениях: эпоха, магия, фракции…");
const iHero = field("hero_name", "Имя героя", "text", "Герой",
"Как зовут протагониста?");
box.appendChild(form);
const progressCard = Router.el("div", "card pad");
progressCard.style.display = "none";
const track = document.createElement("div");
track.style.cssText = "height:8px;border-radius:4px;background:#2d2547;" +
"overflow:hidden;margin-bottom:6px;";
const fill = document.createElement("div");
fill.style.cssText = "height:100%;width:0%;border-radius:4px;" +
"background:linear-gradient(90deg,#7b5cff,#c86bff);transition:width .5s;";
track.appendChild(fill);
progressCard.appendChild(track);
const pLab = Router.el("div", "mut", "");
progressCard.appendChild(pLab);
box.appendChild(progressCard);
const saveBar = Router.el("div", "bar");
saveBar.style.flexWrap = "wrap";
const saveBtn = Router.btn("🚀 Начать создание мира", async function () {
const name = iName.value.trim();
if (!name) return Api.toast("⚠️ Укажите название мира");
saveBtn.disabled = true;
progressCard.style.display = "block";
pLab.textContent = "⏳ Запуск конвейера…";
try {
const r = await Api.post("/api/world/create", {
name: name, genre: iGenre.value,
description: iDesc.value,
hero_name: iHero.value.trim() || "Герой"
});
if (r && r.ok) {
Api.toast("⏳ Конвейер запущен");
poll();
} else {
Api.toast("❌ " + ((r && r.error) || "ошибка"));
progressCard.style.display = "none";
saveBtn.disabled = false;
}
} catch (e) {
Api.toast("❌ " + e.message);
progressCard.style.display = "none";
saveBtn.disabled = false;
}
}, "primary");
saveBar.appendChild(saveBtn);
box.appendChild(saveBar);
box.appendChild(Router.viewBar(null));
function poll() {
if (FORGE_TIMER) clearInterval(FORGE_TIMER);
const tick = async function () {
let s = null;
try { s = await Api.post("/api/world/forge_status", {}); }
catch (e) { return; }
if (!s || !s.ok) return;
const pct = s.total ? Math.round(s.done / s.total * 100) : 0;
fill.style.width = pct + "%";
pLab.textContent = "⏳ Создание мира: " + s.done + "/" + s.total +
" (" + pct + "%)" + (s.current ? " · сейчас: " + s.current : "") +
(s.errors ? " · ошибок: " + s.errors : "");
if (!s.running) {
clearInterval(FORGE_TIMER); FORGE_TIMER = 0;
if (s.errors) {
pLab.textContent = "❌ Ошибка: " + (s.message || "неизвестно");
saveBtn.disabled = false;
return;
}
pLab.textContent = "✅ " + (s.message || "Мир создан");
Api.toast("✅ Мир создан: " + (s.message || ""));
await Api.loadState();
Router.tab("worlds");
}
};
tick();
FORGE_TIMER = setInterval(tick, 3000);
}
Api.post("/api/world/forge_status", {}).then(function (s) {
if (s && s.ok && s.running) { saveBtn.disabled = true; poll(); }
});
});
Router.register("world_view", function (box, params) {
const st = Api.stateCache || {};
const w = (st.scenarios || []).find(function (x) {
return x.id === params.id;
}) || st.scenario;
box.innerHTML = "";
if (!w) {
box.appendChild(Router.card("⚠️",
Router.el("div", "mut", "Мир не найден.")));
box.appendChild(Router.viewBar(null));
return;
}
const pc = Router.el("div", "card pad");
const im = Router.el("img", "imgfull");
pc.appendChild(im); box.appendChild(pc);
if (w.image) Api.img(w.image).then(function (u) {
if (u) im.src = u; else pc.remove();
});
else pc.remove();
const chips = Router.el("div", "bar");
chips.style.flexWrap = "wrap";
[w.name, w.genre || "", w.active ? "активен" : ""]
.filter(Boolean).forEach(function (t) { chips.appendChild(Router.chip(t)); });
box.appendChild(chips);
box.appendChild(Router.card("📖 Описание мира",
Router.el("div", "mut", w.desc || "—")));
if (w.greeting) {
box.appendChild(Router.card("💬 Приветствие",
Router.el("div", "mut", w.greeting)));
}
const bar = Router.el("div", "bar");
bar.style.flexWrap = "wrap";
bar.appendChild(Router.btn("✏️ Изменить", async function () {
let rec = w;
try {
const g = await Api.post("/api/ency/get",
{ entity: "scenario", id: w.id });
if (g && g.ok) rec = g.rec;
} catch (e) {}
Router.open("ency_edit", { entity: "scenario", id: w.id, rec: rec });
}, "primary"));
box.appendChild(bar);
});