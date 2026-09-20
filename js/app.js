/* Меню v2, точка входа: футер → состояние → СИНХРОННАЯ шапка → вкладка →
   ФОНОВАЯ догрузка изображений шапки.
   ВНИМАНИЕ (фикс 16.09.2026 22:45): вызывает Router.headerSync() и
   Router.headerImages() (не блокируют рендер); при ошибке состояния —
   баннер с причиной, меню остаётся рабочим. */
(async function () {
  Router.buildNav();
  let err = "";
  try {
    const st = await Api.loadState();
    if (!st || !st.ok) {
      err = "Нет активной сессии. Запусти /new или /switch в боте.";
    } else {
      Router.headerSync();
    }
  } catch (e) {
    err = "Сервер недоступен (" + e.message +
      "). Бот и ngrok запущены? Адрес API: " + (Api.base || "same-origin");
  }
  Router.tab("home");
  if (err) {
    const box = document.getElementById("screen");
    box.insertBefore(
      Router.card("⚠️ Нет данных", Router.el("div", "mut", err)),
      box.firstChild);
  } else {
    Router.headerImages();
  }
})();