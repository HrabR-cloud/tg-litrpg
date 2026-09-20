/* Меню v2, «🤝 Торговля» с NPC из группы: Купить / Продать / Подарить.
Цены по формуле ТЗ v4; продажа = 1/3; подарок → отношения +10, продажа +5.
ВНИМАНИЕ (фикс 18.09.2026 v2): в строках списков выводится чип
«двуручное» (требование владельца: свойство видно в перечне оружия);
ошибка /api/trade/list показывается тостом, а не молчаливой пустотой. */
Router.register("trade", function (box, params) {
  let mode = "buy";
  let data = { buy: [], sell: [], gold: 0 };
  const seg = Router.el("div", "seg");
  const gold = Router.el("div", "mut");
  const list = Router.el("div");
  box.appendChild(Router.el("div", "bar",
    "<span class='chip'>🤝 " + (params.name || "NPC") + "</span>"));
  box.appendChild(seg); box.appendChild(gold); box.appendChild(list);

  function draw() {
    seg.innerHTML = "";
    [["buy", "🛒 Купить"], ["sell", "💰 Продать"], ["gift", "🎁 Подарить"]]
      .forEach(function ([m, lb]) {
        const b = Router.el("button", null, lb);
        if (m === mode) b.classList.add("on");
        b.onclick = function () { mode = m; draw(); };
        seg.appendChild(b);
      });
    gold.textContent = "💰 Ваше золото: " + data.gold;
    list.innerHTML = "";
    const rows = (mode === "buy") ? data.buy : data.sell;
    const c = Router.card(mode === "buy" ? "🛒 Товары NPC"
      : mode === "sell" ? "💰 Ваши предметы"
      : "🎁 Ваши предметы (подарок)", null);
    if (!rows.length) {
      c.appendChild(Router.el("div", "mut", mode === "buy"
        ? "У NPC нет вещей для продажи."
        : "Нет предметов для этого действия."));
    }
    rows.forEach(function (r) {
      const row = Router.el("div", "listrow");
      const im = document.createElement("img");
      im.style.cssText = "width:44px;height:44px;border-radius:8px;" +
        "object-fit:cover;background:#2d2547;flex:0 0 auto;";
      row.appendChild(im);
      if (r.img) Api.img(r.img).then(function (u) { if (u) im.src = u; });
      const label = (mode === "gift") ? "🎁 бесплатно" : ("💰 " + r.price);
      const info = Router.el("div", null,
        "<div style='flex:1;'><b>" + r.name + "</b> " +
        "<span class='chip'>×" + (r.qty != null ? r.qty : 1) + "</span> " +
        (r.two_handed ? "<span class='chip'>двуручное</span> " : "") +
        (r.equipped ? "<span class='chip'>надето</span> " : "") +
        "<div class='mut'>" + (SLOT_RU[r.slot] || r.slot) + " · кач. " +
        r.quality + " · " + label + "</div></div>");
      row.appendChild(info);
      const bl = mode === "buy" ? "Купить"
        : mode === "sell" ? "Продать" : "Подарить";
      const b = Router.btn(bl, function () { act(r); }, "primary");
      b.style.flex = "0 0 auto"; b.style.padding = "8px 10px";
      row.appendChild(b);
      c.appendChild(row);
    });
    list.appendChild(c);
  }

  async function act(r) {
    const route = mode === "buy" ? "/api/trade/buy"
      : mode === "sell" ? "/api/trade/sell" : "/api/trade/gift";
    try {
      const res = await Api.post(route,
        { npc_id: params.npc_id, inv: r.inv });
      Api.toast(res && res.ok
        ? (mode === "buy" ? "✅ Куплено за " + res.price
          : mode === "sell" ? "✅ Продано за " + res.price
          : "🎁 Подарено! Отношения улучшились")
        : "❌ " + ((res && res.error) || "ошибка"));
      await load();
    } catch (e) { Api.toast("Ошибка сети: " + e.message); }
  }

  async function load() {
    let res = null;
    try {
      res = await Api.post("/api/trade/list", { npc_id: params.npc_id });
    } catch (e) { Api.toast("Ошибка сети trade/list"); }
    if (res && res.ok) data = res;
    else if (res && res.error) Api.toast("❌ Торговля: " + res.error);
    try { await Api.loadState(); } catch (e) {}
    data.gold = (Api.stateCache && Api.stateCache.hero || {}).gold
      || data.gold;
    draw();
  }
  load();
  box.appendChild(Router.viewBar(null));
});