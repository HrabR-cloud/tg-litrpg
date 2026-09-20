/* Меню v2, «📦 Группа предметов» (19.09.2026 v7): массовое создание с живым
наблюдением и специализацией раздела; live-карточки: «В ячейку» ПОД изображением;
источники: промты построчно, 📤 файл, Ctrl+V-скриншот; fullbody-режим: ячейки
заполняются сразу, набор ждёт «💾 Сохранить набор», дисплей = исходный файл;
ШКАЛЫ Prog: у первой карточки очереди — генерация, у остальных — позиция;
v7: Prog — ленивая делегация (window.Prog читается в момент вызова, порядок
скриптов в APP_SCRIPTS не важен); без ui_progress.js — работа без шкал.
IIFE, константы локальны, дублей нет. */
(function () {
const _PS = { create: function () { return document.createElement("div"); }, start: function () {}, queue: function () {}, finish: function () {}, stop: function () {} };
const Prog = { create: function () { return (window.Prog || _PS).create(); }, start: function (a, b) { return (window.Prog || _PS).start(a, b); }, queue: function (a, b) { return (window.Prog || _PS).queue(a, b); }, finish: function (a) { return (window.Prog || _PS).finish(a); }, stop: function (a) { return (window.Prog || _PS).stop(a); } };
const B_SUBS = [["fullbody","В полный рост"],["tops","Верх"],["bottoms","Низ"],["shoes","Обувь"],["hats","Головные уборы"],["lingerie","Нижнее бельё"],["gloves","Перчатки"],["glasses","Очки"],["earrings","Серьги"],["necklaces","Ожерелья"],["bracelets","Браслеты"],["rings","Кольца"],["socks","Носки/чулки"],["hair","Волосы/Причёска"],["tattoos","Татуировки"]];
function bSubRu(c){const f=B_SUBS.find(function(x){return x[0]===c;});return f?f[1]:c;}
let timer = 0;
let pending = [];
const loaded = {};
let PENDING_OUTFIT = null;
const bars = {};
Router.register("wardrobe_batch", function (box, params) {
const style = params.style || "everyday";
const cat = params.category || "fullbody";
const owner = params.owner || null;
const fullMode = (cat === "fullbody");
const WA = Router.wardrobeActive || (Router.wardrobeActive = {});
if (timer) { clearInterval(timer); timer = 0; }
pending = []; PENDING_OUTFIT = null;
Object.keys(bars).forEach(function (k) { delete bars[k]; });
box.appendChild(Router.el("div","bar",
"<span class='chip'>📦 Раздел: "+bSubRu(cat)+"</span>"+
(fullMode
?"<span class='chip'>🧵 полный комплект: ячейки заполнятся, набор — по «Сохранить»</span>"
:"<span class='chip'>🎯 специализация: только «"+bSubRu(cat)+"»</span>")));
const ta = document.createElement("textarea");
ta.style.cssText = "width:100%;min-height:140px;box-sizing:border-box;";
ta.placeholder = fullMode
? "Описание внешности/одежды персонажа… или вставьте скриншот (Ctrl+V) / загрузите изображение"
: "Промты внешнего вида («"+bSubRu(cat)+"») — по одному на строке…";
box.appendChild(ta);
const srcCard = Router.el("div","card pad");
srcCard.style.display = "none";
srcCard.appendChild(Router.el("div","mut","📤 Исходное изображение:"));
const srcIm = Router.el("img","imgfull");
srcIm.style.cssText = "max-height:220px;object-fit:contain;border-radius:10px;";
srcCard.appendChild(srcIm);
box.appendChild(srcCard);
const status = Router.el("div","mut"," ");
box.appendChild(status);
const bar = Router.el("div","bar"); bar.style.flexWrap = "wrap";
box.appendChild(bar);
const saveCap = Router.el("div","mut"," ");
box.appendChild(saveCap);
const resCard = Router.el("div","card pad");
resCard.style.display = "none";
resCard.appendChild(Router.el("h3",null,"🧵 Созданные предметы (live):"));
const grid = Router.el("div",null);
grid.style.cssText = "display:grid;grid-template-columns:repeat(2,1fr);gap:8px;";
resCard.appendChild(grid);
box.appendChild(resCard);
function fill(id, imgRel) {
if (loaded[id]) return;
loaded[id] = true;
const el = grid.querySelector('[data-id="'+id+'"]');
if (!el) return;
const im = el.querySelector("img");
Api.imgT(imgRel).then(function (u) { if (u) im.src = u; }).catch(function () {});
}
function markReady(id) {
Prog.finish(bars[id]);
const el = grid.querySelector('[data-id="'+id+'"]');
if (el && el.lastChild && el.lastChild.classList && el.lastChild.classList.contains("mut")) {
el.lastChild.textContent = "✅ изображение готово";
}
}
function cardFor(it) {
const el = Router.el("div","card tile");
el.style.cssText = "padding:6px;display:flex;flex-direction:column;gap:4px;";
const im = document.createElement("img");
im.style.cssText = "width:100%;height:110px;object-fit:cover;border-radius:8px;background:#2d2547;";
el.appendChild(im);
const pb = Prog.create();
el.appendChild(pb);
bars[it.id] = pb;
const bbar = Router.el("div","bar"); bbar.style.cssText = "gap:4px;";
const bSet = Router.btn("В ячейку", function (ev) {
ev.stopPropagation();
WA[style] = WA[style] || {};
WA[style][it.category] = { id: it.id, name: it.name };
Api.toast("✅ В ячейке: "+bSubRu(it.category));
},"ghost");
bSet.style.cssText = "flex:1;padding:4px 6px;font-size:11px;";
bbar.appendChild(bSet);
el.appendChild(bbar);
el.appendChild(Router.el("div","tile-t",it.name));
el.appendChild(Router.el("div","tile-d",
bSubRu(it.category)+" · эксгибиционизм: "+it.exhibitionism));
const pr = Router.el("div","mut",it.prompt||"");
pr.style.cssText = "font-size:10px;max-height:44px;overflow:hidden;";
el.appendChild(pr);
el.appendChild(Router.el("div","mut","⏳ изображение генерируется…"));
el.dataset.id = it.id;
return el;
}
const saveBtn = Router.btn("💾 Сохранить набор", async function () {
if (!PENDING_OUTFIT) return;
const name = prompt("Название набора:","Набор 1");
if (!name) return;
const r = await Api.post("/api/wardrobe/outfit_save",{
style: style, name: name, items: PENDING_OUTFIT.items,
image_media_id: PENDING_OUTFIT.image,
owner_type: owner ? owner.type : "", owner_id: owner ? owner.id : 0 });
Api.toast(r&&r.ok?"✅ Набор сохранён":"❌ "+((r&&r.error)||"ошибка"));
if (r&&r.ok) {
PENDING_OUTFIT = null;
saveBtn.style.display = "none";
saveCap.textContent = "✅ Набор записан в базу.";
}
},"primary");
saveBtn.style.display = "none";
function startResults(items, sourcePath) {
if (!items || !items.length) return;
resCard.style.display = "";
grid.innerHTML = "";
pending = items.map(function (i) { return i.id; });
items.forEach(function (it) {
grid.appendChild(cardFor(it));
if (fullMode) {
WA[style] = WA[style] || {};
WA[style][it.category] = { id: it.id, name: it.name };
}
});
if (fullMode) {
PENDING_OUTFIT = {
items: items.map(function (it) {
return { slot: it.category, item_id: it.id, name: it.name }; }),
image: sourcePath || "" };
saveBtn.style.display = "";
saveCap.textContent = "Набор собран (НЕ сохранён): активные ячейки "+
"заполнены; дисплей набора — исходный файл. Нажмите «💾 Сохранить "+
"набор» для записи в БД.";
}
startPoll();
}
async function tick() {
let s = null;
try { s = await Api.post("/api/wardrobe/batch_status",{}); } catch (e) {}
for (const id of pending.slice()) {
if (loaded[id]) {
pending = pending.filter(function (x) { return x !== id; });
continue;
}
try {
const r = await Api.post("/api/wardrobe/item_get",{id: id});
if (r&&r.ok&&r.item.img) {
fill(id, r.item.img);
markReady(id);
pending = pending.filter(function (x) { return x !== id; });
}
} catch (e) { /* молча */ }
}
status.textContent = "Очередь генерации: "+((s&&s.pending)||0)+
" · готово изображений: "+((s&&s.done)||0)+
" · генератор: "+((s&&s.running)?"работает":"ожидает")+
(pending.length?" · ждут миниатюр: "+pending.length:"");
pending.forEach(function (id, i) {
const pb = bars[id];
if (!pb) return;
if (i === 0 && s && s.running) { if (!pb._iv) Prog.start(pb, 60); }
else if (i > 0) Prog.queue(pb, i);
});
if (!pending.length && s && !s.pending && !s.running && timer) {
clearInterval(timer); timer = 0;
}
}
function startPoll() {
if (timer) clearInterval(timer);
tick();
timer = setInterval(tick, 5000);
}
function processImage(f) {
srcIm.src = URL.createObjectURL(f);
srcCard.style.display = "";
const fd = new FormData(); fd.append("file", f);
Api.toast("⏳ Загрузка и анализ изображения…");
fetch(Api.base+"/api/wardrobe/batch_upload?style="+style+
"&category="+cat,
{ method: "POST", headers: {"ngrok-skip-browser-warning":"1"},
body: fd })
.then(function (r) { return r.json(); })
.then(function (res) {
if (res&&res.ok) {
Api.toast("✅ Создано: "+(res.items||[]).length+
", в очереди: "+res.queued);
startResults(res.items||[], res.source_path||"");
} else Api.toast("❌ "+((res&&res.error)||"ошибка"));
}).catch(function () { Api.toast("❌ ошибка загрузки"); });
}
document.addEventListener("paste", function (ev) {
if (!box.isConnected) return;
const its = ev.clipboardData&&ev.clipboardData.items;
if (!its) return;
for (let i = 0; i < its.length; i++) {
if (its[i].type&&its[i].type.indexOf("image")===0) {
const f = its[i].getAsFile();
if (f) { ev.preventDefault(); processImage(f); }
return;
}
}
});
bar.appendChild(Router.btn("🚀 Создать из промтов", async function () {
const lines = ta.value.split("\n").map(function (s) { return s.trim(); })
.filter(Boolean);
if (!lines.length) return Api.toast("Введите промты построчно");
Api.toast("⏳ Модельер анализирует список…");
const r = await Api.post("/api/wardrobe/batch_parse",
{ text: lines.join("\n"), style: style, category: cat });
if (r&&r.ok) {
Api.toast("✅ Создано: "+(r.items||[]).length+
", в очереди: "+r.queued);
startResults(r.items||[],"");
} else Api.toast("❌ "+((r&&r.error)||"ошибка"));
},"primary"));
const up = document.createElement("label");
up.className = "btn ghost"; up.style.flex = "1";
up.textContent = "📤 Картинка / скриншот";
const fi = document.createElement("input");
fi.type = "file"; fi.accept = "image/*"; fi.style.display = "none";
fi.onchange = function () {
const f = fi.files[0];
if (f) processImage(f);
};
up.appendChild(fi); bar.appendChild(up);
bar.appendChild(saveBtn);
tick();
box.appendChild(Router.viewBar(null));
});
})();