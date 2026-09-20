/* Меню v2, «⚖️ Арбитр»: текстовый чат с ИИ-Арбитром (ТЗ v4 §2.1, v5 §10.2).
   ВНИМАНИЕ: канал ИЗОЛИРОВАН — разговоры не пишутся в messages, Ведущий и
   NPC о них не знают; Арбитр вносит правки БД по текстовым запросам.
   ВНИМАНИЕ: история хранится локально в браузере (localStorage), не в игре. */
const ARB_KEY = "arbiter_chat_v1";
Router.register("arb", function (box) {
  let log = [];
  try { log = JSON.parse(localStorage.getItem(ARB_KEY) || "[]"); } catch (e) {}
  const feed = Router.el("div", "card pad");
  feed.style.maxHeight = "55vh";
  feed.style.overflowY = "auto";
  box.appendChild(feed);
  const bar = Router.el("div", "bar");
  const inp = document.createElement("input");
  inp.placeholder = "Запрос Арбитру: создать/изменить/удалить…";
  inp.style.flex = "3";
  bar.appendChild(inp);
  const send = Router.btn("➤ Отправить", null, "primary");
  send.style.flex = "1";
  bar.appendChild(send);
  box.appendChild(bar);
  box.appendChild(Router.el("div", "mut",
    "Арбитр правит базу игры. Ведущий не знает об этом чате."));

  function render() {
    feed.innerHTML = "";
    if (!log.length) {
      feed.appendChild(Router.el("div", "mut",
        "Арбитр: здравствуй! Скажи, что изменить в мире: создать NPC, " +
        "поменять локацию, удалить предмет…"));
    }
    log.forEach(function (m) {
      const d = Router.el("div", "mut");
      d.style.margin = "6px 0";
      d.style.whiteSpace = "pre-wrap";
      d.innerHTML = "<b>" + (m.role === "user" ? "Вы: " : "Арбитр: ") +
        "</b>" + m.text;
      feed.appendChild(d);
    });
    feed.scrollTop = feed.scrollHeight;
  }

  async function sendMsg() {
    const text = inp.value.trim();
    if (!text) return;
    inp.value = "";
    log.push({ role: "user", text: text });
    render();
    try {
      const res = await Api.post("/api/arbiter", { text: text });
      log.push({ role: "ai", text: (res && res.ok)
        ? res.reply : ("Ошибка: " + ((res && res.error) || "неизвестно")) });
    } catch (e) {
      log.push({ role: "ai", text: "Ошибка сети: " + e.message });
    }
    try { localStorage.setItem(ARB_KEY, JSON.stringify(log.slice(-100))); }
    catch (e) {}
    render();
  }
  send.onclick = sendMsg;
  inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMsg();
  });
  render();
});