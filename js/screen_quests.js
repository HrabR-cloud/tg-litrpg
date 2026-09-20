/* Меню v2, «📜 Квесты» (фикс 19.09.2026, требование владельца):
активные квесты с раскрытием подробностей И кнопкой «🗑 Удалить»
(confirm → /api/menu/action action=quest_delete → обновление состояния);
ниже — «📌 События мира» со статусами на русском.
Данные: Api.stateCache.quests (id,name,desc,status,reward_exp,reward_gold,
objectives) и .events (name,desc,status). Кнопка «↩ Назад» — глобальная
полоса #backbar, собственной «Назад» экран не печатает. */
Router.register("quests", function (box) {
  const st = Api.stateCache || {};
  const quests = st.quests || [];
  const events = st.events || [];

  const c = Router.card("📜 Активные квесты", null);
  if (!quests.length) {
    c.appendChild(Router.el("div", "mut", "Активных квестов нет."));
  }
  quests.forEach(function (q) {
    const head = Router.el("div", "listrow");
    head.style.cursor = "pointer";
    head.innerHTML = "<div style='flex:1;'><b>🔵 " + q.name + "</b>" +
      "<div class='mut'>Нажмите, чтобы раскрыть/скрыть подробности</div></div>" +
      "<span class='chip'>▼</span>";
    const det = Router.el("div");
    det.style.padding = "6px 12px 10px 12px";
    let objText = "[]";
    if (q.objectives != null && q.objectives !== "") {
      objText = (typeof q.objectives === "string")
        ? q.objectives : JSON.stringify(q.objectives);
    }
    det.innerHTML = "<div class='mut'>" + (q.desc || "—") + "</div>" +
      "<div class='mut'>🎯 Условия выполнения: " + objText + "</div>" +
      "<div class='mut'>🎁 Награда: " + (q.reward_exp || 0) + " опыта, " +
      (q.reward_gold || 0) + " золота</div>" +
      "<div class='mut'>Статус: " + ruValue("status", q.status || "active") +
      "</div>";
    head.onclick = function () {
      det.style.display = (det.style.display === "none") ? "block" : "none";
    };
    c.appendChild(head);
    c.appendChild(det);
    const bar = Router.el("div", "bar");
    bar.style.margin = "0 0 10px 0";
    bar.appendChild(Router.btn("🗑 Удалить", async function () {
      if (!confirm("Удалить квест «" + q.name + "»? Действие необратимо.")) {
        return;
      }
      try {
        const r = await Api.post("/api/menu/action",
          { action: "quest_delete", params: { quest: q.id } });
        Api.toast(r && r.ok ? "✅ Квест удалён"
          : "❌ " + ((r && r.error) || "ошибка"));
        if (r && r.ok) {
          await Api.loadState();
          Router.tab("quests");
        }
      } catch (e) { Api.toast("Ошибка сети: " + e.message); }
    }, "ghost"));
    c.appendChild(bar);
  });
  box.appendChild(c);

  const ec = Router.card("📌 События мира", null);
  if (!events.length) {
    ec.appendChild(Router.el("div", "mut", "Событий нет."));
  }
  events.forEach(function (ev) {
    const row = Router.el("div", "listrow");
    row.innerHTML = "<div style='flex:1;'><b>" + ev.name + "</b>" +
      "<div class='mut'>" + ruValue("status", ev.status || "") + "</div></div>";
    ec.appendChild(row);
  });
  box.appendChild(ec);
});