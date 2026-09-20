/* Меню v2, слой API: API_BASE и fetch+blob для картинок (ADR-12.11/12.13).
   ВНИМАНИЕ: init_data подставляется в каждое POST-тело автоматически.
   ВНИМАНИЕ (16.09.2026): thumb()/imgT() — списки грузят МИНИАТЮры (быстрее);
   full — только карточки просмотра и шапка.
   ВНИМАНИЕ: toast() безопасен вне Telegram. */
const Api = {
  base: (location.hostname.endsWith("github.io")
    || location.protocol === "file:")
    ? "https://unexpired-pogo-splotchy.ngrok-free.dev" : "",
  H: { "ngrok-skip-browser-warning": "1", "Content-Type": "application/json" },
  init: (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || "",
  stateCache: null,
  _imgCache: {},

  async post(path, body) {
    const r = await fetch(this.base + path, {
      method: "POST",
      headers: this.H,
      body: JSON.stringify(Object.assign({ init_data: this.init }, body || {})),
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
    return await r.json();
  },

  async get(path) {
    const r = await fetch(this.base + path, {
      headers: { "ngrok-skip-browser-warning": "1" }, cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
    return await r.json();
  },

  async loadState() {
    this.stateCache = await this.post("/api/menu/state", {});
    return this.stateCache;
  },

  /* full → thumbs (fallback thumbs→full есть на сервере медиа) */
  thumb(url) {
    if (!url) return "";
    if (url.includes("/media/images/") && !url.includes("/thumbs/")) {
      return url.replace("/media/images/", "/media/images/thumbs/");
    }
    return url;
  },

  async img(url) {
    if (!url) return "";
    if (this._imgCache[url]) return this._imgCache[url];
    try {
      const sep = url.includes("?") ? "&" : "?";
      const r = await fetch(this.base + url + sep + "cb=" + Date.now(), {
        headers: { "ngrok-skip-browser-warning": "1" }, cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const u = URL.createObjectURL(await r.blob());
      this._imgCache[url] = u;
      return u;
    } catch (e) { return ""; }
  },

  /* миниатюра для списков */
  async imgT(url) { return this.img(this.thumb(url)); },

  resetImgCache() { this._imgCache = {}; },

  toast(msg) {
    try {
      const tg = window.Telegram && Telegram.WebApp;
      if (tg && typeof tg.showAlert === "function") {
        tg.showAlert(msg);
        return;
      }
    } catch (e) { /* метод не поддерживается вне Telegram — fallback */ }
    try { console.log("[toast] " + msg); } catch (e) { /* ignore */ }
  },
};

if (window.Telegram && Telegram.WebApp) {
  try { Telegram.WebApp.ready(); Telegram.WebApp.expand(); } catch (e) {}
}