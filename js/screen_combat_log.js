/* Экран «⚔️ Бой» (A1, Блок 4): журнал боёв — витрина DPS/TTK из hit_log
   (ADR 13.38). Данные — POST /api/menu/combat_log (по умолчанию последний
   бой активного мира, можно переключить бой из списка). */
Router.register("combat_log", function (box) {
  renderCombatLog(box, null);
});

async function renderCombatLog(box, combatId) {
  box.innerHTML = "";
  box.appendChild(Router.card(null,
    Router.el("div", "mut", "⏳ Загрузка журнала боя…")));
  let d = null;
  try {
    d = await Api.post("/api/menu/combat_log",
      combatId ? { combat_id: combatId } : {});
    if (!d || !d.ok) d = null;
  } catch (e) { d = null; }
  box.innerHTML = "";

  if (!d) {
    box.appendChild(Router.card("⚠️ Нет данных", Router.el("div", "mut",
      "Не удалось загрузить журнал боя. Бот запущен?")));
    return;
  }
  if (!d.combat_id) {
    box.appendChild(Router.card("⚔️ Журнал боёв", Router.el("div", "mut",
      "В этом мире ещё не было боёв.")));
    return;
  }

  const head = Router.card("⚔️ Бой #" + d.combat_id + " · раундов " +
    (d.rounds || 0));
  box.appendChild(head);

  if (d.combats && d.combats.length > 1) {
    const cc = Router.card("📜 Последние бои", null);
    d.combats.forEach(function (c) {
      const r = Router.el("div", "listrow");
      r.appendChild(Router.el("div", null,
        `#${c.id} · ${c.status} · раунд ${c.round}`));
      r.appendChild(Router.btn(c.id === d.combat_id ? "открыт" : "открыть",
        function () { renderCombatLog(box, c.id); }, "ghost"));
      cc.appendChild(r);
    });
    box.appendChild(cc);
  }

  const ac = Router.card("🗡 Урон (атакующие)", null);
  if (!d.attackers || !d.attackers.length) {
    ac.appendChild(Router.el("div", "mut", "Прямых ударов не было."));
  } else {
    d.attackers.forEach(function (a) {
      const tail = [];
      tail.push("DPS " + a.dps);
      tail.push(a.hits + " уд.");
      if (a.crits) tail.push(a.crits + " крит");
      if (a.kills) tail.push(a.kills + " убийств");
      if (a.ttk) tail.push("TTK раунд " + a.ttk);
      ac.appendChild(Router.el("div", "listrow",
        `<div><b>${a.name}</b><div class="mut">${a.damage} урона · ` +
        tail.join(" · ") + `</div></div>`));
    });
  }
  box.appendChild(ac);

  const vc = Router.card("🛡 Получено (цели)", null);
  if (!d.victims || !d.victims.length) {
    vc.appendChild(Router.el("div", "mut", "—"));
  } else {
    d.victims.forEach(function (v) {
      vc.appendChild(Router.el("div", "listrow",
        `<div><b>${v.name}</b><div class="mut">${v.taken} урона` +
        (v.ttk ? ` · погиб в раунде ${v.ttk}` : "") + `</div></div>`));
    });
  }
  box.appendChild(vc);
}
