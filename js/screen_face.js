/* Меню v2, «🖼 Кадрирование лица» (20.09.2026 v2): единый редактор иконки
для ГЕРОЯ и NPC. Читает параметры экрана: entity_type ("hero"|"npc"), id.
Круглое превью математически совпадает с серверным кропом /api/icon/edit
(сторона=min(w,h)/zoom, центр=(w/2+dx*w, h/2+dy*h)).
Кнопки: «🎯 Авто (лицо)» — дефолт лицевой зоны; «💾 Сохранить» —
POST /api/icon/edit; у героя после сохранения обновляется шапка
(Api.loadState), у NPC — списки/карточка (resetImgCache).
Регистрирует экраны "face_crop" и "face" (оба имени используются). */
(function () {
function build(box, params) {
const et = params.entity_type === "npc" ? "npc" : "hero";
const st = Api.stateCache || {};
const hid = (st.hero || {}).id || 0;
let id = params.id || (et === "hero" ? hid : 0);
let zoom = 2.2, dx = 0, dy = -0.18;
let W = 0, H = 0, SRC = "";
box.appendChild(Router.el("div", "bar",
"<span class='chip'>🖼 Кадрирование лица: " +
(et === "hero" ? "герой" : "NPC") + "</span>"));
const win = Router.el("div", "card pad");
win.style.cssText = "position:relative;width:260px;height:260px;" +
"overflow:hidden;border-radius:50%;background:#2d2547;margin:0 auto;";
const img = document.createElement("img");
img.style.cssText = "position:absolute;max-width:none;";
win.appendChild(img);
box.appendChild(win);
const S = 260;
function layout() {
if (!W || !H || !SRC) return;
const side = Math.min(W, H) / zoom;
const k = S / side;
img.style.width = (W * k) + "px";
img.style.height = (H * k) + "px";
const cx = W / 2 + dx * W;
const cy = H / 2 + dy * H;
img.style.left = (S / 2 - cx * k) + "px";
img.style.top = (S / 2 - cy * k) + "px";
}
function slider(label, min, max, step, get, set) {
const f = Router.el("div", "field");
f.innerHTML = "<label>" + label + ": <span class='mut'></span></label>";
const inp = document.createElement("input");
inp.type = "range"; inp.min = min; inp.max = max; inp.step = step;
inp.value = get();
inp.oninput = function () {
set(parseFloat(inp.value));
f.querySelector("span").textContent = inp.value;
layout();
};
f.querySelector("span").textContent = inp.value;
f.appendChild(inp);
box.appendChild(f);
return inp;
}
const iZoom = slider("Масштаб", 1, 5, 0.05,
function () { return zoom; }, function (v) { zoom = v; });
const iDx = slider("Смещение X", -0.5, 0.5, 0.01,
function () { return dx; }, function (v) { dx = v; });
const iDy = slider("Смещение Y", -0.5, 0.5, 0.01,
function () { return dy; }, function (v) { dy = v; });
box.appendChild(Router.el("div", "mut",
"Двигайте ползунки — круглое превью показывает лицо для шапки/списка."));
const bar = Router.el("div", "bar");
bar.style.flexWrap = "wrap";
bar.appendChild(Router.btn("🎯 Авто (лицо)", function () {
zoom = 2.2; dx = 0; dy = -0.18;
iZoom.value = zoom; iDx.value = dx; iDy.value = dy;
layout();
}, "ghost"));
bar.appendChild(Router.btn("💾 Сохранить", async function () {
if (!id) return Api.toast("⚠️ Не определён id персонажа");
if (!SRC) return Api.toast("⚠️ Нет исходного изображения (сначала 🎨)");
Api.toast("⏳ Сохранение иконки…");
const r = await Api.post("/api/icon/edit",
{ entity_type: et, id: id, zoom: zoom, dx: dx, dy: dy });
if (r && r.ok) {
Api.resetImgCache();
if (et === "hero") await Api.loadState();
Api.toast("✅ Иконка сохранена");
} else Api.toast("❌ " + ((r && r.error) || "ошибка"));
}, "primary"));
box.appendChild(bar);
box.appendChild(Router.viewBar(null));
(async function () {
if (et === "hero") {
const h = (Api.stateCache || {}).hero || {};
id = id || h.id || 0;
SRC = h.fullbody || h.image || "";
} else {
const g = await Api.post("/api/ency/get",
{ entity: "npc", id: id });
if (g && g.ok && g.rec)
SRC = g.rec.icon_source_media_id || g.rec.image_media_id || "";
}
if (!SRC) {
box.insertBefore(Router.el("div", "mut",
"⚠️ Нет исходного изображения: сначала создайте изображение (🎨)."),
box.children[1]);
return;
}
const u = await Api.img(SRC);
if (!u) return;
img.onload = function () {
W = img.naturalWidth; H = img.naturalHeight;
layout();
};
img.src = u;
})();
}
Router.register("face_crop", function (box, params) { build(box, params || {}); });
Router.register("face", function (box, params) { build(box, params || {}); });
})();