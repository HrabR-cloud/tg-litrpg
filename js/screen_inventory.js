/* Меню v2, ЕДИНЫЙ инвентарь (герой + NPC).
ВНИМАНИЕ (фикс 19.09.2026, требование владельца): у каждой строки кнопка
«🗑» с подтверждением — удаление экземпляра из инвентаря (герой →
/api/menu/action action=drop; NPC → /api/npc/drop); надетое снимается
автоматически (сервер пересобирает equipped_items).
Правило двуручного: серверное (web_equip), клиент шлёт slot для рук. */
function renderInventoryScreen(box, owner) {
  const isNpc = !!(owner && owner.type === "npc");
  let group = (owner && owner.group) || "all";
  let rows = [];
  const seg = Router.el("div", "seg");
  const list = Router.el("div");
  box.appendChild(seg);
  box.appendChild(list);

  function draw() {
    seg.innerHTML = "";
    ITEM_GROUPS.forEach(function ([g, lb]) {
      const b = Router.el("button", null, lb);
      if (g === group) b.classList.add("on");
      b.onclick = function () { group = g; draw(); };
      seg.appendChild(b);
    });
    const slots = groupSlots(group);
    const show = slots ? rows.filter(i => slots.includes(i.slot)) : rows;
    list.innerHTML = "";
    const c = Router.card((isNpc ? "🎒 Инвентарь NPC " : "🎒 Вещи героя ") +
      "(" + show.length + ")", null);
    if (!show.length) c.appendChild(Router.el("div", "mut", "Пусто."));
    show.forEach(function (i) {
      const row = Router.el("div", "listrow");
      const im = document.createElement("img");
      im.style.cssText = "width:44px;height:44px;border-radius:8px;" +
        "object-fit:cover;background:#2d2547;flex:0 0 auto;";
      row.appendChild(im);
      if (i.img) Api.imgT(i.img).then(u => { if (u) im.src = u; });
      const info = Router.el("div", null,
        "<div style='flex:1;'><b>" + i.name + "</b> " +
        "<span class='chip'>×" + (i.qty != null ? i.qty : 1) + "</span> " +
        (i.two_handed ? "<span class='chip'>двуручное</span> " : "") +
        (i.equipped ? "<span class='chip'>надето</span> " : "") +
        "<div class='mut'>" + (SLOT_RU[i.slot] || i.slot) + " · кач. " +
        i.quality + " · " + (RARITY_RU[i.rarity] || i.rarity || "") +
        "</div></div>");
      info.style.cursor = "pointer";
      info.onclick = function () {
        Router.open("item", { row: i, owner: isNpc ? { npc: owner.id } : null });
      };
      row.appendChild(info);
      const bb = Router.el("div", "bar");
      bb.style.flex = "0 0 auto"; bb.style.margin = "0";
      if (i.slot === "consumable") {
        bb.appendChild(Router.btn("Использовать",
          function () { act(i, "use"); }, "ghost"));
      } else if (i.slot !== "quest") {
        bb.appendChild(Router.btn(i.equipped ? "Снять" : "Надеть",
          function () { act(i, i.equipped ? "unequip" : "equip"); },
          i.equipped ? "ghost" : "primary"));
      }
      const dbtn = Router.btn("🗑", function () { drop(i); }, "ghost");
      dbtn.style.flex = "0 0 auto"; dbtn.style.padding = "8px 10px";
      bb.appendChild(dbtn);
      row.appendChild(bb);
      c.appendChild(row);
    });
    list.appendChild(c);
    list.appendChild(Router.viewBar(null));
  }

  async function drop(i) {
    if (!confirm("Удалить «" + i.name + "» из инвентаря?")) return;
    try {
      const r = isNpc
        ? await Api.post("/api/npc/drop", { npc_id: owner.id, inv: i.inv })
        : await Api.post("/api/menu/action",
            { action: "drop", params: { inv: i.inv } });
      Api.toast(r && r.ok ? "✅ Удалено"
        : "❌ " + ((r && r.error) || "ошибка"));
      if (r && r.ok) await load();
    } catch (e) { Api.toast("Ошибка сети: " + e.message); }
  }

  function pickHandSlot(i) {
    if (i.two_handed) return "hand";
    const main = rows.find(x => x.equipped && x.slot === "hand");
    const off = rows.find(x => x.equipped && x.slot === "hand2");
    if (!main) return "hand";
    if (!off) return "hand2";
    return confirm("Обе руки заняты. Надеть в ОСНОВНУЮ руку? (Отмена — во вторую)")
      ? "hand" : "hand2";
  }

  async function act(i, kind) {
    try {
      let r;
      if (isNpc) {
        const route = kind === "use" ? "/api/npc/use"
          : kind === "equip" ? "/api/npc/equip" : "/api/npc/unequip";
        r = await Api.post(route, { npc_id: owner.id, inv: i.inv });
      } else if (kind === "use") {
        r = await Api.post("/api/menu/action",
          { action: "use_item", params: { inv: i.inv } });
      } else if (kind === "equip") {
        const slot = (i.slot === "hand" || i.slot === "hand2")
          ? pickHandSlot(i) : i.slot;
        r = await Api.post("/api/menu/action",
          { action: "equip", params: { inv: i.inv, slot: slot } });
      } else {
        r = await Api.post("/api/menu/action",
          { action: "unequip", params: { slot: i.slot } });
      }
      Api.toast(r && r.ok ? "✅ Готово" : "❌ " + ((r && r.error) || "ошибка"));
      await load();
    } catch (e) { Api.toast("Ошибка сети: " + e.message); }
  }

  async function load() {
    if (isNpc) {
      try {
        const res = await Api.post("/api/npc/inventory", { npc_id: owner.id });
        rows = (res && res.rows) || [];
      } catch (e) { rows = []; }
    } else {
      await Api.loadState();
      rows = (Api.stateCache && Api.stateCache.inventory) || [];
    }
    draw();
  }
  load();
}
Router.register("items", function (box) {
  renderInventoryScreen(box, { type: "hero" });
});
Router.register("npc_inventory", function (box, params) {
  renderInventoryScreen(box, { type: "npc", id: params.id, group: params.group });
});