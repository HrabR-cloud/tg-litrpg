/* UI-помощники меню (19.09.2026 v2):
1) Prog — шкала прогресса генерации: заполнение по оценке времени (60 с)
   до 95%, Prog.finish → 100% и скрытие; Prog.queue → позиция в очереди;
2) Modal — всплывающее окно alert(title, rows, note): rows = список
   {name, exhibitionism} (проверка откровенности одежды);
3) SCALES_RU — русские названия шкал личности (СС §3–5) для всех экранов.
Глобалы Prog/Modal/SCALES_RU; без зависимостей; порядок скриптов не важен. */
(function () {
const EST = 60;
function create() {
const wrap = document.createElement("div");
wrap.style.cssText = "display:none;margin-top:6px;";
const track = document.createElement("div");
track.style.cssText = "height:8px;border-radius:4px;background:#2d2547;overflow:hidden;";
const fill = document.createElement("div");
fill.style.cssText = "height:100%;width:0%;border-radius:4px;background:linear-gradient(90deg,#7b5cff,#c86bff);transition:width .5s linear;";
track.appendChild(fill);
const lab = document.createElement("div");
lab.style.cssText = "font-size:11px;color:#9a8fb8;margin-top:2px;";
wrap.appendChild(track); wrap.appendChild(lab);
wrap._fill = fill; wrap._lab = lab; wrap._iv = 0; wrap._t = 0;
return wrap;
}
function start(el, est) {
if (!el) return;
stop(el);
el.style.display = "block";
el._t = Date.now();
const tickFn = function () {
const sec = (Date.now() - el._t) / 1000;
const pct = Math.min(95, Math.round(sec / (est || EST) * 100));
el._fill.style.width = pct + "%";
el._lab.textContent = "⏳ Генерация… " + Math.round(sec) + " с (" + pct + "%)";
};
tickFn();
el._iv = setInterval(tickFn, 500);
}
function queue(el, pos) {
if (!el) return;
stop(el);
el.style.display = "block";
el._fill.style.width = "0%";
el._lab.textContent = "🕒 В очереди (позиция " + pos + ")";
}
function finish(el) {
if (!el) return;
if (el._iv) { clearInterval(el._iv); el._iv = 0; }
el._fill.style.width = "100%";
el._lab.textContent = "✅ Готово";
setTimeout(function () { el.style.display = "none"; el._fill.style.width = "0%"; }, 1200);
}
function stop(el) {
if (!el) return;
if (el._iv) { clearInterval(el._iv); el._iv = 0; }
el.style.display = "none";
}
window.Prog = { create: create, start: start, queue: queue, finish: finish, stop: stop };
window.SCALES_RU = { openness: "Открытость", conscientiousness: "Добросовестность",
extraversion: "Экстраверсия", agreeableness: "Дружелюбие", neuroticism: "Невротизм",
libido: "Либидо", kinkiness: "Раскрепощённость", exhibitionism: "Эксгибиционизм",
fidelity: "Верность" };
function alertBox(title, rows, note) {
const ov = document.createElement("div");
ov.style.cssText = "position:fixed;inset:0;background:rgba(10,6,30,.78);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;";
const card = document.createElement("div");
card.style.cssText = "background:#201740;border:1px solid #3d2f7a;border-radius:14px;max-width:420px;width:100%;max-height:72vh;overflow:auto;padding:14px;box-shadow:0 8px 30px rgba(0,0,0,.5);";
const h = document.createElement("div");
h.style.cssText = "font-weight:600;font-size:14px;margin-bottom:8px;";
h.textContent = title;
card.appendChild(h);
(rows || []).forEach(function (r) {
const line = document.createElement("div");
line.style.cssText = "display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:5px 0;border-bottom:1px solid #3d2f7a;";
const n = document.createElement("span"); n.textContent = "«" + r.name + "»";
const v = document.createElement("span");
v.style.cssText = "color:#ff5252;font-weight:600;flex-shrink:0;";
v.textContent = r.exhibitionism;
line.appendChild(n); line.appendChild(v); card.appendChild(line);
});
if (note) {
const p = document.createElement("div");
p.style.cssText = "font-size:12px;color:#9a8fb8;margin-top:8px;";
p.textContent = note; card.appendChild(p);
}
const b = document.createElement("button");
b.className = "btn primary";
b.style.cssText = "width:100%;margin-top:12px;";
b.textContent = "Понятно";
b.onclick = function () { ov.remove(); };
card.appendChild(b); ov.appendChild(card);
document.body.appendChild(ov);
}
window.Modal = { alert: alertBox };
})();