/* Меню v2, «👗 Гардероб» (ADR-13.10, 19.09.2026 v16): стили независимы;
активные ячейки = плитки подтипов («✕» на заполненных, «🧹 Полная очистка»
ПОД сеткой); «В ячейки» ЗАМЕНЯЕТ ячейки набором; превью защищено от гонок;
КАТАЛОГ = ВКЛАДКИ по подтипам (сегмент со счётчиками); кнопки «➕ Создать»
и «📦 Группа» — СВЕРХУ; шкалы Prog под обрабатываемой картинкой; Prog и
Modal — ленивые делегации; v16: проверка откровенности (exh_check) выводится
ВО ВСПЛЫВАЮЩЕМ ОКНЕ со списком ВСЕХ не прошедших предметов. IIFE, дублей нет. */
(function () {
const _PS = { create: function () { return document.createElement("div"); }, start: function () {}, queue: function () {}, finish: function () {}, stop: function () {} };
const Prog = { create: function () { return (window.Prog || _PS).create(); }, start: function (a, b) { return (window.Prog || _PS).start(a, b); }, queue: function (a, b) { return (window.Prog || _PS).queue(a, b); }, finish: function (a) { return (window.Prog || _PS).finish(a); }, stop: function (a) { return (window.Prog || _PS).stop(a); } };
const W_STYLES = [["everyday","Повседневная"],["formal","Официальная"],["activewear","Спортивная"],["sleepwear","Для сна"],["party","Вечеринка"],["swimwear","Купальные"],["hot","Жара"],["cold","Холод"]];
const W_SUBS = [["fullbody","В полный рост"],["tops","Верх"],["bottoms","Низ"],["shoes","Обувь"],["hats","Головные уборы"],["lingerie","Нижнее бельё"],["gloves","Перчатки"],["glasses","Очки"],["earrings","Серьги"],["necklaces","Ожерелья"],["bracelets","Браслеты"],["rings","Кольца"],["socks","Носки/чулки"],["hair","Волосы/Причёска"],["tattoos","Татуировки"]];
const W_ACTIVE = Router.wardrobeActive || (Router.wardrobeActive = {});
const W_RENDER = Router.wardrobeRender || (Router.wardrobeRender = {});
function wSubRu(c){const f=W_SUBS.find(x=>x[0]===c);return f?f[1]:c;}
function wStyleRu(s){const f=W_STYLES.find(x=>x[0]===s);return f?f[1]:s;}
function getActive(){return W_ACTIVE[style]||{};}
function setActive(slot,item){W_ACTIVE[style]=W_ACTIVE[style]||{};W_ACTIVE[style][slot]=item;}
function activeItems(){return Object.entries(getActive()).map(e=>({slot:e[0],item_id:e[1].id}));}
function toastErr(r){Api.toast(r&&r.message?"⚠️ "+r.message:"❌ "+((r&&r.error)||"ошибка"));}
function exhModal(r){if(window.Modal){window.Modal.alert("⚠️ "+(r.char_name||"Персонаж")+": эксгибиционизм "+r.char_exh,r.items||[],"Слишком откровенная одежда. Внешний вид не изменён.");}else toastErr(r);}
let style="everyday";
function itemTile(it,owner,imCss,sub,afterDel){
const c=Router.el("div","card tile");
c.style.cssText="cursor:pointer;position:relative;padding:6px;display:flex;flex-direction:column;gap:4px;";
const im=document.createElement("img"); im.style.cssText=imCss; c.appendChild(im);
if(it.img) Api.imgT(it.img).then(function(u){if(u) im.src=u;}).catch(function(){});
const bar=Router.el("div","bar"); bar.style.cssText="gap:4px;";
const bSet=Router.btn("В ячейку",function(ev){ev.stopPropagation();
setActive(it.category,{id:it.id,name:it.name});
Api.toast("✅ В ячейке: "+wSubRu(it.category));},"ghost");
bSet.style.cssText="flex:1;padding:4px 6px;font-size:11px;"; bar.appendChild(bSet);
const bDel=Router.btn("🗑",async function(ev){ev.stopPropagation();
if(!confirm("Удалить «"+it.name+"»? Он будет убран из всех наборов и персонажей.")) return;
const r=await Api.post("/api/wardrobe/item_delete",{id:it.id});
Api.toast(r&&r.ok?"🗑 Удалено":"❌ "+((r&&r.error)||"ошибка"));
if(afterDel) afterDel();},"danger");
bDel.style.cssText="flex:0 0 auto;padding:4px 8px;"; bar.appendChild(bDel);
c.appendChild(bar); c.appendChild(Router.el("div","tile-t",it.name));
if(sub) c.appendChild(Router.el("div","tile-d",sub));
c.onclick=function(){Router.open("wardrobe_item",{id:it.id,owner:owner});};
return c;}
Router.register("wardrobe",function(box,params){
const owner=params.owner_type?{type:params.owner_type,id:params.owner_id,name:params.owner_name||""}:null;
box.appendChild(Router.el("div","bar",owner?"<span class='chip'>👗 "+owner.name+"</span>":"<span class='chip'>🧵 Без персонажа — только наборы</span>"));
const styleSeg=Router.el("div","seg");
const renderCard=Router.el("div","card pad"); renderCard.style.textAlign="center";
const renderIm=Router.el("img","imgfull");
renderIm.style.cssText="max-height:260px;object-fit:contain;border-radius:10px;display:none;";
const renderCap=Router.el("div","mut","Комплект стиля ещё не сгенерирован — выберите ячейки и нажмите «🎨 Изобразить».");
renderCard.appendChild(renderIm); renderCard.appendChild(renderCap);
const renderProg=Prog.create(); renderCard.appendChild(renderProg);
const subGrid=Router.el("div","grid3"); subGrid.style.cssText="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;";
const cellsBar=Router.el("div","bar"); cellsBar.style.cssText="justify-content:space-between;";
const setsCard=Router.el("div","card pad");
box.appendChild(styleSeg); box.appendChild(renderCard); box.appendChild(subGrid);
box.appendChild(cellsBar); box.appendChild(setsCard);
function drawSegs(){styleSeg.innerHTML="";
W_STYLES.forEach(function(e){const b=Router.el("button",null,e[1]);
if(e[0]===style) b.classList.add("on");
b.onclick=function(){style=e[0]; redraw();};
styleSeg.appendChild(b);});}
function drawRender(){const p=W_RENDER[style];
renderIm.removeAttribute("src"); renderIm.style.display="none";
if(p){const want=p;
Api.img(p).then(function(u){if(u&&W_RENDER[style]===want){renderIm.src=u; renderIm.style.display="block";}}).catch(function(){});
renderCap.textContent="Комплект стиля «"+wStyleRu(style)+"».";
} else renderCap.textContent="Комплект стиля ещё не сгенерирован — выберите ячейки и нажмите «🎨 Изобразить».";}
async function ensureRender(sk){if(W_RENDER[sk]!==undefined) return;
try{const r=await Api.post("/api/wardrobe/render_get",{style:sk});
W_RENDER[sk]=(r&&r.ok&&r.path)?r.path:"";}catch(e){W_RENDER[sk]="";}}
function drawCellsBar(){cellsBar.innerHTML="";
cellsBar.appendChild(Router.el("div","mut","Активные ячейки: "+Object.keys(getActive()).length));
const b=Router.btn("🧹 Полная очистка",function(){W_ACTIVE[style]={};
Api.toast("🧹 Ячейки стиля «"+wStyleRu(style)+"» очищены"); redraw();},"ghost");
b.style.cssText="padding:4px 10px;font-size:12px;"; cellsBar.appendChild(b);}
function drawSubs(){subGrid.innerHTML=""; const active=getActive();
W_SUBS.forEach(function(e){const cat=e[0], label=e[1];
const c=Router.el("div","card tile");
c.style.cssText="padding:4px;text-align:center;cursor:pointer;min-height:80px;position:relative;";
const im=document.createElement("img");
im.style.cssText="width:100%;height:50px;object-fit:cover;border-radius:6px;background:#2d2547;display:none;";
c.appendChild(im);
const lbl=Router.el("div","tile-t",label); lbl.style.cssText="font-size:11px;"; c.appendChild(lbl);
const item=active[cat];
if(item){lbl.textContent=label+": "+item.name;
Api.post("/api/wardrobe/item_get",{id:item.id}).then(function(r){
if(r&&r.ok&&r.item.img) Api.imgT(r.item.img).then(function(u){if(u){im.src=u; im.style.display="block";}});}).catch(function(){});
const x=Router.btn("✕",function(ev){ev.stopPropagation();
delete W_ACTIVE[style][cat];
Api.toast("🧹 Ячейка «"+label+"» очищена"); redraw();},"danger");
x.style.cssText="position:absolute;top:2px;right:2px;padding:2px 7px;font-size:11px;z-index:2;";
c.appendChild(x);}
c.onclick=function(){Router.open("wardrobe_item",{category:cat,style:style,owner:owner});};
subGrid.appendChild(c);});}
async function drawSets(){setsCard.innerHTML="<h3>🧳 Наборы стиля «"+wStyleRu(style)+"»</h3>";
const grid=Router.el("div",null);
grid.style.cssText="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;";
setsCard.appendChild(grid);
let rows=[];
try{const res=await Api.post("/api/wardrobe/outfit_list",{style:style});
rows=(res&&res.rows)||[];}catch(e){rows=[];}
if(!rows.length){grid.appendChild(Router.el("div","mut","Наборов в этом стиле пока нет."));}
rows.forEach(function(o){const c=Router.el("div","card tile");
c.style.cssText="padding:6px;display:flex;flex-direction:column;gap:6px;";
if(o.img){const im=document.createElement("img");
im.style.cssText="width:100%;height:80px;object-fit:cover;border-radius:8px;background:#2d2547;";
c.appendChild(im);
Api.imgT(o.img).then(function(u){if(u) im.src=u;}).catch(function(){});
} else c.appendChild(Router.el("div","mut","🎨 нет миниатюры"));
c.appendChild(Router.el("div","tile-t",o.name));
c.appendChild(Router.el("div","tile-d",(o.items||[]).length+" вещей"));
const bar=Router.el("div","bar"); bar.style.cssText="gap:6px;";
const b1=Router.btn("В ячейки",function(){W_ACTIVE[style]={};
(o.items||[]).forEach(function(it){setActive(it.slot,{id:it.item_id,name:o.name});});
Api.toast("🧵 Ячейки заменены набором «"+o.name+"»"); redraw();},"ghost");
b1.style.cssText="flex:1;padding:6px 8px;font-size:12px;"; bar.appendChild(b1);
const bDel=Router.btn("🗑",async function(){
if(!confirm("Удалить набор «"+o.name+"»?")) return;
try{const r=await Api.post("/api/wardrobe/outfit_delete",{outfit_id:o.id});
Api.toast(r&&r.ok?"🗑 Набор удалён":"❌ "+((r&&r.error)||"ошибка"));
}catch(e){Api.toast("❌ ошибка удаления");}
drawSets();},"danger");
bDel.style.cssText="flex:0 0 auto;padding:6px 8px;"; bar.appendChild(bDel);
c.appendChild(bar); grid.appendChild(c);});}
async function redraw(){drawSegs(); await ensureRender(style); drawRender();
drawSubs(); drawCellsBar();
drawSets().catch(function(){setsCard.innerHTML="<h3>🧳 Наборы стиля</h3>";
setsCard.appendChild(Router.el("div","mut","⚠️ Не удалось загрузить наборы."));});}
const bar=Router.el("div","bar"); bar.style.flexWrap="wrap";
bar.appendChild(Router.btn("➕ Предмет",function(){Router.open("wardrobe_item_edit",{id:0,style:style,category:"tops",owner:owner});},"ghost"));
bar.appendChild(Router.btn("✂️ Из описания",function(){Router.open("wardrobe_batch",{style:style,category:"fullbody",owner:owner});},"ghost"));
bar.appendChild(Router.btn("🎨 Изобразить",async function(){
const items=activeItems();
if(!items.length) return Api.toast("⚠️ Нет выбранных элементов");
Api.toast("⏳ Генерация до минуты…"); Prog.start(renderProg,60);
try{const r=await Api.post("/api/wardrobe/render",{style:style,items:items,
owner_type:owner?owner.type:"",owner_id:owner?owner.id:0});
Prog.finish(renderProg);
if(r&&r.ok){Api.resetImgCache(); W_RENDER[style]=r.path; drawRender(); Api.toast("✅ Образ готов");}
else if(r&&r.error==="exh_check") exhModal(r); else toastErr(r);
}catch(e){Prog.finish(renderProg); Api.toast("❌ ошибка генерации");}
},"primary"));
if(owner){bar.appendChild(Router.btn("👗 Надеть",async function(){
const items=activeItems();
if(!items.length) return Api.toast("⚠️ Нет выбранных элементов");
Api.toast("⏳ Генерация образа…"); Prog.start(renderProg,60);
try{const r=await Api.post("/api/wardrobe/render",{style:style,items:items,
owner_type:owner.type,owner_id:owner.id});
Prog.finish(renderProg);
if(r&&r.ok){Api.resetImgCache(); W_RENDER[style]=r.path; drawRender();
Api.toast("✅ Образ надет на "+owner.name);
if(owner.type==="hero") await Api.loadState();}
else if(r&&r.error==="exh_check") exhModal(r); else toastErr(r);
}catch(e){Prog.finish(renderProg); Api.toast("❌ ошибка генерации");}
},"primary"));}
bar.appendChild(Router.btn("💾 Сохранить как набор",async function(){
const items=activeItems();
if(!items.length) return Api.toast("⚠️ Нет выбранных элементов");
const name=prompt("Название набора ("+items.length+" ячеек):","Набор 1");
if(!name) return;
try{const r=await Api.post("/api/wardrobe/outfit_save",{style:style,name:name,
items:items,image_media_id:W_RENDER[style]||""});
Api.toast(r&&r.ok?"✅ Набор сохранён":"❌ "+((r&&r.error)||"ошибка"));
}catch(e){Api.toast("❌ ошибка сохранения");}
drawSets();},"ghost"));
box.appendChild(bar); redraw(); box.appendChild(Router.viewBar(null));
});
/* === Карточка предмета / КАТАЛОГ-ВКЛАДКИ по подтипам === */
Router.register("wardrobe_item",function(box,params){
const owner=params.owner||null;
if(params.id){
box.appendChild(Router.el("div","mut","⏳…"));
(async function(){
const res=await Api.post("/api/wardrobe/item_get",{id:params.id});
box.innerHTML="";
if(!res||!res.ok){box.appendChild(Router.card("⚠️",Router.el("div","mut","Предмет не найден.")));box.appendChild(Router.viewBar(null));return;}
const it=res.item;
const pc=Router.el("div","card pad"); const im=Router.el("img","imgfull");
pc.appendChild(im); box.appendChild(pc);
if(it.img) Api.img(it.img).then(function(u){if(u) im.src=u; else pc.innerHTML="<div class='mut'>Нет изображения.</div>";});
else pc.innerHTML="<div class='mut'>Нет изображения.</div>";
const chips=Router.el("div","bar"); chips.style.flexWrap="wrap";
[it.name,wSubRu(it.category),wStyleRu(it.style),"эксгибиционизм: "+it.exhibitionism].forEach(function(t){chips.appendChild(Router.chip(t));});
box.appendChild(chips);
box.appendChild(Router.card("📖 Промт",Router.el("div","mut",it.prompt||"—")));
const bar=Router.el("div","bar"); bar.style.flexWrap="wrap";
bar.appendChild(Router.btn("В ячейку",function(){setActive(it.category,{id:it.id,name:it.name}); Router.back();},"ghost"));
bar.appendChild(Router.btn("✏️ Изменить",function(){Router.open("wardrobe_item_edit",{id:it.id,style:it.style,category:it.category,owner:owner});},"primary"));
box.appendChild(bar); box.appendChild(Router.viewBar(null));
})();
} else {
(async function(){
const st=params.style||"everyday";
let cur=params.category||"";
let rowsAll=[];
box.appendChild(Router.el("div","bar","<span class='chip'>🧵 Каталог: "+wStyleRu(st)+"</span>"));
const topBar=Router.el("div","bar"); topBar.style.flexWrap="wrap";
topBar.appendChild(Router.btn("➕ Создать",function(){Router.open("wardrobe_item_edit",{id:0,style:st,category:cur||"tops",owner:owner});},"primary"));
topBar.appendChild(Router.btn("📦 Группа",function(){Router.open("wardrobe_batch",{style:st,category:cur||"fullbody",owner:owner});},"ghost"));
box.appendChild(topBar);
const seg=Router.el("div","seg");
seg.style.cssText="flex-wrap:nowrap;overflow-x:auto;";
box.appendChild(seg);
const wrap=Router.el("div",null); box.appendChild(wrap);
function drawSeg(){seg.innerHTML="";
W_SUBS.forEach(function(e){
const cnt=rowsAll.filter(function(x){return x.category===e[0];}).length;
const b=Router.el("button",null,e[1]+(cnt?" ("+cnt+")":""));
if(e[0]===cur) b.classList.add("on");
b.onclick=function(){cur=e[0]; drawSeg(); drawGrid();};
seg.appendChild(b);});}
function drawGrid(){wrap.innerHTML="";
const group=rowsAll.filter(function(x){return x.category===cur;});
if(!group.length){wrap.appendChild(Router.el("div","mut","Пусто. Создайте «➕ Создать» или «📦 Группа»."));return;}
const grid=Router.el("div","grid2"); wrap.appendChild(grid);
group.forEach(function(it){grid.appendChild(itemTile(it,owner,
"width:100%;height:80px;object-fit:cover;border-radius:10px;background:#2d2547;",
"эксгибиционизм: "+it.exhibitionism,load));});}
async function load(){wrap.innerHTML="<div class='mut'>⏳…</div>";
const res=await Api.post("/api/wardrobe/list",{style:st});
rowsAll=(res&&res.rows)||[];
const has=function(c){return rowsAll.some(function(x){return x.category===c;});};
if(!(cur&&has(cur))){const f=W_SUBS.find(function(e){return has(e[0]);});
cur=f?f[0]:"tops";}
drawSeg(); drawGrid();}
await load();
box.appendChild(Router.viewBar(null));
})();}});
/* === Редактор предмета === */
Router.register("wardrobe_item_edit",function(box,params){
let curId=params.id||0;
const store={};
const pc=Router.el("div","card pad"); const im=Router.el("img","imgfull");
im.style.display="none"; pc.appendChild(im); box.appendChild(pc);
const edProg=Prog.create(); pc.appendChild(edProg);
function showUrl(u){if(u){im.src=u; im.style.display="block";}}
if(curId){Api.post("/api/wardrobe/item_get",{id:curId}).then(function(r){if(r&&r.ok&&r.item.img) Api.img(r.item.img).then(showUrl);});}
const c=Router.card("🧵 Предмет одежды",null);
function field(key,label,kind,value){const f=Router.el("div","field");
f.innerHTML="<label>"+label+"</label>";
const inp=document.createElement(kind==="area"?"textarea":"input");
if(kind==="num"){inp.type="number"; inp.min=0; inp.max=100;}
inp.value=value||""; store[key]=inp; f.appendChild(inp); c.appendChild(f);}
field("name","Название","text","");
const fc=Router.el("div","field"); fc.innerHTML="<label>Подтип</label>";
const selC=document.createElement("select");
W_SUBS.forEach(function(e){const o=document.createElement("option");o.value=e[0];o.textContent=e[1];if(e[0]===params.category) o.selected=true;selC.appendChild(o);});
store.category=selC; fc.appendChild(selC); c.appendChild(fc);
const fs=Router.el("div","field"); fs.innerHTML="<label>Стиль</label>";
const selS=document.createElement("select");
W_STYLES.forEach(function(e){const o=document.createElement("option");o.value=e[0];o.textContent=e[1];if(e[0]===params.style) o.selected=true;selS.appendChild(o);});
store.style=selS; fs.appendChild(selS); c.appendChild(fs);
field("exhibitionism","Эксгибиционизм 0-100","num",50);
field("prompt","Промт внешнего вида","area","");
box.appendChild(c);
const bar=Router.el("div","bar"); bar.style.flexWrap="wrap";
async function ensureId(){if(curId) return curId;
const r=await Api.post("/api/wardrobe/item_save",{id:0,name:store.name.value||"Предмет",category:store.category.value,style:store.style.value,exhibitionism:store.exhibitionism.value,prompt:store.prompt.value});
if(r&&r.ok) curId=r.id;
return curId;}
bar.appendChild(Router.btn("🎨 Сгенерировать",async function(){
const id=await ensureId();
if(!id) return Api.toast("❌ Сначала сохраните название");
Api.toast("⏳ Генерация до минуты…"); Prog.start(edProg,60);
const r=await Api.post("/api/wardrobe/item_image",{id:id});
Prog.finish(edProg);
if(r&&r.ok){Api.resetImgCache(); Api.img(r.path).then(showUrl); Api.toast("✅ Рисунок готов");}
else toastErr(r);
},"primary"));
const up=document.createElement("label");
up.className="btn ghost"; up.style.flex="1"; up.textContent="📤 Загрузить";
const fi=document.createElement("input");
fi.type="file"; fi.accept="image/*"; fi.style.display="none";
fi.onchange=async function(){const f=fi.files[0]; if(!f) return;
showUrl(URL.createObjectURL(f));
const id=await ensureId();
if(!id) return Api.toast("❌ Не удалось создать предмет");
const fd=new FormData(); fd.append("file",f);
const r=await fetch(Api.base+"/api/wardrobe/item_upload?id="+id,{method:"POST",headers:{"ngrok-skip-browser-warning":"1"},body:fd});
const res=await r.json();
if(!res||!res.ok) return Api.toast("❌ Ошибка загрузки");
Api.toast("⏳ Модельер описывает изображение…");
const d=await Api.post("/api/wardrobe/item_describe",{id:id});
if(d&&d.ok){store.prompt.value=d.prompt; store.exhibitionism.value=d.exhibitionism; Api.toast("✅ Модельер создал описание");}
else Api.toast("⚠️ Описание не создано");};
up.appendChild(fi); bar.appendChild(up); box.appendChild(bar);
box.appendChild(Router.editBar(async function(){
const id=await ensureId();
if(!id) return Api.toast("❌ Нет id предмета");
const r=await Api.post("/api/wardrobe/item_save",{id:id,name:store.name.value,category:store.category.value,style:store.style.value,exhibitionism:store.exhibitionism.value,prompt:store.prompt.value});
Api.toast(r&&r.ok?"✅ Сохранено":"❌ "+((r&&r.error)||"ошибка"));
if(r&&r.ok) Router.back();}));
if(curId){const delBar=Router.el("div","bar");
delBar.appendChild(Router.btn("🗑 Удалить",async function(){
if(!confirm("Удалить предмет? Он будет убран из всех наборов и персонажей.")) return;
const r=await Api.post("/api/wardrobe/item_delete",{id:curId});
if(r&&r.ok){Api.resetImgCache(); Api.toast("🗑 Предмет удалён, связи очищены"); Router.back();}
else toastErr(r);
},"danger"));
box.appendChild(delBar);}});
})();