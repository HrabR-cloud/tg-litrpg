/* Меню v2, отношения (СС §4, P1): список отношений героя, карточка пары,
   редактор шкал, «💞 Отношения» и «👥 Персонажи» именного NPC.
   ВНИМАНИЕ (16.09.2026 v13): все подписи только на русском, без сокращений
   и без служебных ссылок на ТЗ: «теплота», «Близость/Страсть/Обязательства/
   Конфликт» полностью.
   ВНИМАНИЕ: запись шкал — ТОЛЬКО /api/relationship/update (engine). */
function relBar(label, v, color) {
  const wrap = Router.el("div", "field");
  const val = Math.max(0, Math.min(100, v || 0));
  wrap.innerHTML = "<label>" + label + ": <b>" + (v || 0) + "</b></label>" +
    "<div style='background:#1b1530;border-radius:6px;height:10px;" +
    "overflow:hidden;'><div style='height:10px;width:" + val + "%;" +
    "background:" + color + ";'></div></div>";
  return wrap;
}
const REL_COLORS = { intimacy: "#7c6cf0", passion: "#e0447c",
  commitment: "#3fa76e", conflict: "#d05050" };

function relBlocks(c, r) {
  c.appendChild(relBar("Близость", r.intimacy, REL_COLORS.intimacy));
  c.appendChild(relBar("Страсть", r.passion, REL_COLORS.passion));
  c.appendChild(relBar("Обязательства", r.commitment, REL_COLORS.commitment));
  c.appendChild(relBar("Конфликт", r.conflict, REL_COLORS.conflict));
}

/* === Список отношений героя (кнопка «💞 Отношения» в герое) === */
Router.register("rel", function (box) {
  box.appendChild(Router.card(null, Router.el("div", "mut", "⏳ Загрузка…")));
  (async function () {
    let res = null;
    try { res = await Api.post("/api/relationships", {}); } catch (e) {}
    box.innerHTML = "";
    const rels = (res && res.relationships) || [];
    const c = Router.card("💞 Отношения героя", null);
    if (!rels.length) {
      c.appendChild(Router.el("div", "mut",
        "Отношений пока нет — знакомьтесь с NPC в игре."));
    }
    rels.forEach(function (r) {
      const row = Router.el("div", "listrow");
      row.innerHTML = "<div style='flex:1;'><b>" + r.name + "</b>" +
        "<div class='mut'>" + (r.type || "") + " · теплота " +
        (r.warmth || 0) + "</div>" +
        "<div class='mut'>Близость " + r.intimacy + " · Страсть " +
        r.passion + " · Обязательства " + r.commitment + " · Конфликт " +
        r.conflict + "</div></div>";
      if (r.img) {
        Api.img(r.img).then(function (u) {
          if (!u) return;
          const im = document.createElement("img");
          im.src = u;
          row.insertBefore(im, row.firstChild);
        });
      }
      row.onclick = function () {
        Router.open("rel_view", { to: r.npc_id, from: null });
      };
      c.appendChild(row);
    });
    box.appendChild(c);
  })();
});

/* === Карточка пары: to + from (null = герой) === */
Router.register("rel_view", function (box, params) {
  box.appendChild(Router.card(null, Router.el("div", "mut", "⏳ Загрузка…")));
  (async function () {
    let r = null;
    try {
      if (params.from) {
        const res = await Api.post("/api/relationship/pair",
          { from_id: params.from, to_id: params.to });
        r = (res && res.ok) ? res.relationship : null;
      } else {
        const res = await Api.get("/api/relationship/" + params.to);
        r = (res && res.ok) ? res.relationship : null;
      }
    } catch (e) {}
    box.innerHTML = "";
    if (!r) {
      box.appendChild(Router.card("⚠️",
        Router.el("div", "mut", "Отношение не найдено.")));
      box.appendChild(Router.viewBar(null));
      return;
    }
    const chips = Router.el("div", "bar");
    chips.style.flexWrap = "wrap";
    [r.name, r.gender === "female" ? "Женщина" : "Мужчина",
     r.type, "теплота: " + r.warmth]
      .forEach(t => chips.appendChild(Router.chip(t)));
    box.appendChild(chips);
    const c = Router.card("📈 Шкалы", null);
    relBlocks(c, r);
    box.appendChild(c);
    const info = Router.el("div", "mut");
    info.innerHTML =
      "Последний контакт: " + (r.last_interaction || "—") + "<br>" +
      "Последняя ссора: " + (r.last_conflict || "—") + "<br>" +
      "Месяцев вместе: " + (r.months_together || 0) + "<br>" +
      "Измен: " + (r.cheat_count || 0) +
      (r.cheat_known ? " (известно)" : "") + "<br>" +
      "Настроение: " + (r.npc_mood || "—") +
      " · привязанность: " + (r.npc_affection || 0);
    box.appendChild(Router.card("📖 Контекст", info));
    box.appendChild(Router.viewBar(function () {
      Router.open("rel_edit", { to: r.npc_id, from: r.from_id, rel: r });
    }));
  })();
});

/* === Редактор шкал (слайдеры) === */
Router.register("rel_edit", function (box, params) {
  const r = params.rel || {};
  const store = {};
  const c = Router.card("✏️ Редактор шкал", null);
  const preview = Router.el("div", "mut");
  [["intimacy", "Близость"], ["passion", "Страсть"],
   ["commitment", "Обязательства"], ["conflict", "Конфликт"]]
    .forEach(function ([k, lb]) {
      const f = Router.el("div", "field");
      f.innerHTML = "<label>" + lb + ": <span></span></label>";
      const span = f.querySelector("span");
      const inp = document.createElement("input");
      inp.type = "range"; inp.min = 0; inp.max = 100; inp.step = 1;
      inp.value = r[k] || 0;
      span.textContent = inp.value;
      store[k] = inp;
      inp.oninput = function () {
        span.textContent = inp.value;
        const w = Math.round((+store.intimacy.value + +store.passion.value +
          +store.commitment.value - +store.conflict.value) / 3);
        preview.textContent = "Теплота (превью): " + w +
          ". Тип по Штернбергу пересчитает сервер при сохранении.";
      };
      f.appendChild(inp);
      c.appendChild(f);
    });
  c.appendChild(preview);
  box.appendChild(c);
  box.appendChild(Router.editBar(async function () {
    const body = { npc_id: params.to, npc_from: params.from || undefined };
    Object.entries(store).forEach(function ([k, inp]) {
      body[k] = parseInt(inp.value, 10) || 0;
    });
    const res = await Api.post("/api/relationship/update", body);
    Api.toast(res && res.ok ? "✅ Сохранено"
      : "❌ " + ((res && res.error) || "ошибка"));
    if (res && res.ok) Router.back();
  }));
});

/* === «💞 Отношения» именного NPC: NPC↔герой в обе стороны === */
Router.register("npc_rel_hero", function (box, params) {
  box.appendChild(Router.card(null, Router.el("div", "mut", "⏳ Загрузка…")));
  (async function () {
    let a = null, b = null;
    try {
      const r1 = await Api.post("/api/relationship/pair",
        { from_id: params.id, to_id: "hero" });
      a = (r1 && r1.ok) ? r1.relationship : null;
      const r2 = await Api.post("/api/relationship/pair",
        { from_id: "hero", to_id: params.id });
      b = (r2 && r2.ok) ? r2.relationship : null;
    } catch (e) {}
    box.innerHTML = "";
    if (!a && !b) {
      box.appendChild(Router.card("💞 Отношения с героем",
        Router.el("div", "mut", "Отношений нет — герой не знаком с NPC.")));
      box.appendChild(Router.viewBar(null));
      return;
    }
    [[a, "👉 NPC → герой"], [b, "❤️ Герой → NPC"]].forEach(function ([r, t]) {
      if (!r) return;
      const c = Router.card(t + " · " + (r.relationship_type || r.type || ""),
        null);
      relBlocks(c, r);
      c.appendChild(Router.el("div", "mut",
        "теплота: " + (r.warmth || 0)));
      box.appendChild(c);
      box.appendChild(Router.viewBar(function () {
        Router.open("rel_edit",
          { to: r.npc_to, from: r.npc_from, rel: r });
      }, []));
    });
  })();
});

/* === «👥 Персонажи» NPC: список его отношений с иконками === */
Router.register("npc_rel_list", function (box, params) {
  box.appendChild(Router.card(null, Router.el("div", "mut", "⏳ Загрузка…")));
  (async function () {
    let res = null;
    try {
      res = await Api.post("/api/relationship/list_for",
        { npc_id: params.id });
    } catch (e) {}
    box.innerHTML = "";
    const rows = (res && res.relationships) || [];
    const c = Router.card("👥 Персонажи (" + rows.length + ")", null);
    if (!rows.length) {
      c.appendChild(Router.el("div", "mut",
        "NPC ни с кем не знаком (встреч ещё не было)."));
    }
    rows.forEach(function (r) {
      const row = Router.el("div", "listrow");
      row.innerHTML = "<div style='flex:1;'><b>" + r.name + "</b>" +
        "<div class='mut'>" + (r.type || "") + " · теплота " +
        (r.warmth || 0) + "</div></div>";
      if (r.img) {
        Api.img(r.img).then(function (u) {
          if (!u) return;
          const im = document.createElement("img");
          im.src = u;
          row.insertBefore(im, row.firstChild);
        });
      }
      row.onclick = function () {
        Router.open("rel_view", { to: r.to_id, from: params.id });
      };
      c.appendChild(row);
    });
    box.appendChild(c);
    box.appendChild(Router.viewBar(null));
  })();
});