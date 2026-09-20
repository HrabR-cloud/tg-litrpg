/* Меню v2, «Герой» v5 (20.09.2026): просмотр (чипы, портрет,
экипировка-слоты, статы с бонусами, умения, описание) + редактор
(имя/пол/роль, статы, внешность). v5: «🖼 Иконка» открывает экран
face_crop (масштаб + сдвиг по координатам, предпросмотр = серверный кроп);
шкала Prog под «🖼 Текущие образы»; после генерации/загрузки
fullbody_media_id+image_media_id синхронизируются («последняя запись
побеждает»); viewBar ВСЕГДА в конце. */
const Prog = {
create: function () {
return window.Prog ? window.Prog.create()
: document.createElement("div");
},
start: function (el, t) { if (window.Prog) window.Prog.start(el, t || 60); },
finish: function (el) { if (window.Prog) window.Prog.finish(el); }
};
Router.register("hero", function (box) {
const st = Api.stateCache || {};
const h = st.hero || {};
const chips = Router.el("div", "bar");
chips.style.flexWrap = "wrap";
["⭐ Ур. " + h.level, "💰 " + h.gold,
"❤️ " + h.hp + "/" + h.max_hp, "🏅 Реп. " + (h.rep || 0)]
.forEach(function (t) { chips.appendChild(Router.chip(t)); });
box.appendChild(chips);
const portrait = Router.el("div", "card pad");
const img = Router.el("img", "imgfull");
img.alt = "";
portrait.appendChild(img);
box.appendChild(portrait);
Api.img(h.fullbody || h.image).then(function (u) {
if (u) img.src = u;
else portrait.innerHTML =
'<div class="mut">Нет изображения. Создайте в редакторе (🎨/📤).</div>';
});
const eq = Router.card("🛡️ Экипировка (нажмите слот)", null);
const grid = Router.el("div", "eqgrid");
grid.style.gridTemplateColumns = "repeat(4, 1fr)";
const inv = st.inventory || [];
const SLOTS = ["hand", "hand2", "head", "outer", "inner", "lingerie",
"feet", "necklace", "ring1", "ring2", "earring1", "earring2"];
SLOTS.forEach(function (s) {
const row = inv.find(function (i) { return i.equipped && i.slot === s; });
const cell = Router.el("div", "eqslot");
cell.innerHTML = "<div style='font-size:20px;'>" +
(row ? "🕓" : "➕") + "</div><div>" + (SLOT_RU[s] || s) + "</div>" +
(row ? "<div class='mut'>" + row.name + "</div>" : "");
if (row && row.img) {
Api.imgT(row.img).then(function (u) {
if (!u) return;
const im = document.createElement("img");
im.src = u;
cell.insertBefore(im, cell.firstChild);
});
}
cell.onclick = function () {
const g = (s === "hand" || s === "hand2") ? "hand"
: (s === "ring1" || s === "ring2") ? "rings"
: (s === "earring1" || s === "earring2") ? "earrings" : s;
Router.open("items", { group: g });
};
grid.appendChild(cell);
});
eq.appendChild(grid);
box.appendChild(eq);
const sc = Router.card("📊 Характеристики (с бонусами)",
Router.statGrid(h.display_stats || h.stats || {}));
if ((h.effects || []).length) {
sc.appendChild(Router.el("div", "mut",
"Активных эффектов: " + h.effects.length));
}
box.appendChild(sc);
const sk = h.skills || { combat: [], noncombat: [] };
const skC = Router.card("⚔️ Умения", null);
[["combat", "cskill", "⚔️ Боевые"],
["noncombat", "nskill", "🕊️ Мирные"]].forEach(function (e) {
const k = e[0], ent = e[1], t = e[2];
if (!sk[k].length) return;
skC.appendChild(Router.el("div", "mut", t));
sk[k].forEach(function (s) {
const row = Router.el("div", "listrow");
row.innerHTML = "<div style='flex:1;'><b>" + s.name + "</b>" +
"<div class='mut'>" + skillParamsLine(s) + "</div></div>";
row.onclick = function () {
Router.open("skill", { entity: ent, id: s.id });
};
skC.appendChild(row);
});
});
box.appendChild(skC);
box.appendChild(Router.card("📖 Описание",
Router.el("div", "mut", h.visual || h.image_prompt || "—")));
box.appendChild(Router.viewBar(
function () { Router.open("hero_edit", {}); },
[["👗 Гардероб", function () {
Router.open("wardrobe", { owner_type: "hero", owner_id: h.id,
owner_name: h.name });
}],
["💞 Отношения", function () { Router.tab("rel"); }]]));
});
/* === Редактор героя: подвкладки (имя/пол/роль, статы, внешность) === */
Router.register("hero_edit", function (box) {
const st = Api.stateCache || {};
const h = st.hero || {};
const base = h.base || {};
const inputs = {};
const seg = Router.el("div", "seg");
box.appendChild(seg);
const secs = {};
let genderVal = h.gender || "male";
function addSec(key, title, builder) {
const s = Router.el("div");
s.style.display = "none";
builder(s);
secs[key] = s;
box.appendChild(s);
const b = Router.el("button", null, title);
b.onclick = function () {
Object.entries(secs).forEach(function (e) {
e[1].style.display = (e[0] === key) ? "block" : "none";
});
seg.querySelectorAll("button").forEach(function (x) {
x.classList.remove("on");
});
b.classList.add("on");
};
seg.appendChild(b);
}
addSec("id", "Имя/пол/роль", function (s) {
const f = Router.el("div", "field");
f.innerHTML = "<label>Имя</label>";
const inp = document.createElement("input");
inp.value = h.name || "";
inputs.name = inp;
f.appendChild(inp);
s.appendChild(f);
const g = Router.el("div", "field");
g.innerHTML = "<label>Пол</label>";
const tgl = Router.el("div", "tgl");
[["male", "Мужской"], ["female", "Женский"]].forEach(function (e) {
const v = e[0], lb = e[1];
const b = Router.el("button", null, lb);
if (genderVal === v) b.classList.add("on");
b.onclick = function () {
genderVal = v;
tgl.querySelectorAll("button").forEach(function (x) {
x.classList.remove("on");
});
b.classList.add("on");
};
tgl.appendChild(b);
});
g.appendChild(tgl);
s.appendChild(g);
const p = Router.el("div", "field");
p.innerHTML = "<label>Должность/роль</label>";
const pin = document.createElement("input");
pin.value = h.position || "";
pin.placeholder = "Например: Авантюрист, стражник, маг…";
inputs.position = pin;
p.appendChild(pin);
s.appendChild(p);
});
addSec("stats", "Статы", function (s) {
const g = Router.el("div", "grid3");
Object.keys(base).forEach(function (k) {
const f = Router.el("div", "field");
f.innerHTML = "<label>" + (STAT_ICON[k] || "▪️") + " " +
(STAT_RU[k] || k) + "</label>";
const inp = document.createElement("input");
inp.type = "number";
inp.value = base[k] == null ? 0 : base[k];
inputs["base_" + k] = inp;
f.appendChild(inp);
g.appendChild(f);
});
s.appendChild(g);
s.appendChild(Router.el("div", "mut",
"Правятся БАЗОВЫЕ статы; бонусы пересчитывает сервер."));
});
addSec("look", "Внешность", function (s) {
const prev = Router.el("div", "card pad");
prev.innerHTML = "<h3>🖼 Текущие образы</h3>";
const imgFull = Router.el("img", "imgfull");
imgFull.style.marginBottom = "8px";
const imgFace = Router.el("img", "imgfull");
imgFace.style.maxWidth = "140px";
imgFace.style.borderRadius = "50%";
prev.appendChild(imgFull);
prev.appendChild(imgFace);
const prog = Prog.create();
prev.appendChild(prog);
s.appendChild(prev);
async function loadPreview() {
Api.resetImgCache();
const hh = (Api.stateCache || {}).hero || {};
const u1 = await Api.img(hh.fullbody || hh.image);
const u2 = await Api.imgT(hh.avatar || "");
imgFull.src = u1 || "";
imgFull.style.display = u1 ? "block" : "none";
imgFace.src = u2 || "";
imgFace.style.display = u2 ? "block" : "none";
}
loadPreview();
async function syncHeroImage(path) {
if (!path) return;
await Api.post("/api/ency/update", {
entity: "hero", id: h.id,
fields: { fullbody_media_id: path, image_media_id: path }
});
}
const v = Router.el("div", "field");
v.innerHTML = "<label>Внешность (RU)</label>";
const va = document.createElement("textarea");
va.value = h.visual || "";
va.placeholder = "Рост, телосложение, волосы, глаза, одежда…";
inputs.visual = va;
v.appendChild(va);
s.appendChild(v);
const ip = Router.el("div", "field");
ip.innerHTML = "<label>Промт (EN) — правьте и жмите 🎨 снова</label>";
const ia = document.createElement("textarea");
ia.value = h.image_prompt || "";
inputs.image_prompt = ia;
ip.appendChild(ia);
s.appendChild(ip);
const bar = Router.el("div", "bar");
bar.style.flexWrap = "wrap";
bar.appendChild(Router.btn("🇬🇧 В EN", async function () {
const txt = va.value;
if (!txt) return Api.toast("Пустое описание");
const res = await Api.post("/api/translate", { text: txt });
if (res && res.ok) ia.value = res.en;
}, "ghost"));
bar.appendChild(Router.btn("🎨 Генерировать", async function () {
Api.toast("⏳ Генерация до минуты…");
Prog.start(prog, 60);
let res = null;
try {
res = await Api.post("/api/gen_hero_image", {});
} finally {
Prog.finish(prog);
}
if (res && res.ok) {
await syncHeroImage(res.path);
await Api.loadState();
await loadPreview();
Api.toast("✅ Готово (новая вариация)");
} else Api.toast("❌ " + ((res && res.error) || "ошибка"));
}, "primary"));
bar.appendChild(Router.btn("🖼 Иконка", function () {
Router.open("face_crop", { entity_type: "hero", id: h.id });
}, "ghost"));
const up = document.createElement("label");
up.className = "btn ghost"; up.style.flex = "1";
up.textContent = "📤 Загрузить";
const fi = document.createElement("input");
fi.type = "file"; fi.accept = "image/*"; fi.style.display = "none";
fi.onchange = async function () {
const f = fi.files[0];
if (!f) return;
const fd = new FormData();
fd.append("file", f);
try {
const r = await fetch(
Api.base + "/api/upload_entity_image?entity=hero&id=" + h.id, {
method: "POST", headers: { "ngrok-skip-browser-warning": "1" },
body: fd });
const res = await r.json();
Api.toast(res && res.ok ? "✅ Загружено"
: "❌ " + ((res && res.error) || "ошибка"));
if (res && res.ok) {
await syncHeroImage(res.path);
await Api.loadState();
await loadPreview();
}
} catch (e) { Api.toast("Ошибка сети: " + e.message); }
};
up.appendChild(fi);
bar.appendChild(up);
s.appendChild(bar);
});
if (seg.children[0]) seg.children[0].onclick();
box.appendChild(Router.editBar(async function () {
const b = {};
Object.keys(base).forEach(function (k) {
const inp = inputs["base_" + k];
const v = inp ? parseFloat(inp.value) : NaN;
b[k] = isNaN(v) ? (base[k] || 0) : v;
});
const fields = {
name: inputs.name.value.trim() || h.name,
gender: genderVal,
position: inputs.position.value.trim(),
visual_prompt: inputs.visual.value,
image_prompt: inputs.image_prompt.value,
base_stats: JSON.stringify(b),
};
const res = await Api.post("/api/ency/update",
{ entity: "hero", id: h.id, fields: fields });
Api.toast(res && res.ok ? "✅ Сохранено"
: "❌ " + ((res && res.error) || "ошибка"));
if (res && res.ok) { await Api.loadState(); Router.back(); }
}));
});