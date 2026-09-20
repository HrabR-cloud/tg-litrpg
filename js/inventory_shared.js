/* Меню v2, ЕДИНЫЙ рендерер инвентаря героя и именных NPC (требование
   владельца 16.09.2026: инвентари оформлены одинаково).
   renderInventoryScreen(box, owner): owner = {type:"hero"} или
   {type:"npc", id:N, group}. Список-строки: миниатюра, название, ×кол-во,
   чипы (двуручное/надето), мета (слот RU · качество · редкость RU),
   кнопки Использовать / Надеть / Снять; клик по строке → карточка предмета.
   ВНИМАНИЕ: действия идут разными маршрутами: герой → /api/menu/action,
   NPC → /api/npc/equip|unequip|use; правило двуручного оружия общее. */
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
    const show = slots ? rows.filter(function (i) {
      return slots.includes(i.slot);
    }) : rows;
    list.innerHTML = "";
    const c = Router.card((isNpc ? "🎒 Инвентарь NPC" : "🎒 Вещи героя") +
      " (" + show.length + ")", null);
    if (!show.length) {
      c.appendChild(Router.el("div", "mut", "Пусто."));
    }
    show.forEach(function (i) {
      const row = Router.el("div", "listrow");
      const im = document.createElement("img");
      im.style.cssText = "width:44px;height:44px;border-radius:8px;" +
        "object-fit:cover;background:#2d2547;flex:0 0 auto;";
      row.appendChild(im);
      if (i.img) Api.imgT(i.img).then(function (u) { if (u) im.src = u; });
      const info = Router.el("div", null,
        "<div style='flex:1;'><b>" + i.name + "</b> " +
        "<span class='chip'>×" + (i.qty != null ? i.qty : 1) + "</span>" +
        (i.two_handed ? " <span class='chip'>двуручное</span>" : "") +
        (i.equipped ? " <span class='chip'>надето</span>" : "") +
        "<div class='mut'>" + (SLOT_RU[i.slot] || i.slot) + " · кач. " +
        i.quality + " · " + (RARITY_RU[i.rarity] || i.rarity || "") +
        "</div></div>");
      info.style.cursor = "pointer";
      info.onclick = function () {
        Router.open("item",
          { row: i, owner: isNpc ? { npc: owner.id } : null });
      };
      row.appendChild(info);
      const bb = Router.el("div", "bar");
      bb.style.flex = "0 0 auto";
      bb.style.margin = "0";
      if (i.slot === "consumable") {
        bb.appendChild(Router.btn("Использовать", function () {
          act(i, "use");
        }, "ghost"));
      } else if (i.slot !== "quest") {
        bb.appendChild(Router.btn(i.equipped ? "Снять" : "Надеть",
          function () { act(i, i.equipped ? "unequip" : "equip"); },
          i.equipped ? "ghost" : "primary"));
      }
      row.appendChild(bb);
      c.appendChild(row);
    });
    list.appendChild(c);
    list.appendChild(Router.viewBar(null));
  }

  async function act(i, kind) {
    try {
      let r;
      if (isNpc) {
        if (kind === "equip") {
          if (i.two_handed) {
            const off = rows.find(function (x) {
              return x.equipped && x.slot === "hand2";
            });
            if (off) await Api.post("/api/npc/unequip",
              { npc_id: owner.id, inv: off.inv });
          }
          if (i.slot === "hand2") {
            const main = rows.find(function (x) {
              return x.equipped && x.slot === "hand" && x.two_handed;
            });
            if (main) {
              Api.toast("❌ Занято: двуручное оружие в основной руке");
              return;
            }
          }
          r = await Api.post("/api/npc/equip",
            { npc_id: owner.id, inv: i.inv });
        } else if (kind === "unequip") {
          r = await Api.post("/api/npc/unequip",
            { npc_id: owner.id, inv: i.inv });
        } else {
          r = await Api.post("/api/npc/use",
            { npc_id: owner.id, inv: i.inv });
        }
      } else if (kind === "use") {
        r = await Api.post("/api/menu/action",
          { action: "use_item", params: { inv: i.inv } });
      } else if (kind === "equip") {
        if (i.two_handed) {
          const off = rows.find(function (x) {
            return x.equipped && x.slot === "hand2";
          });
          if (off) await Api.post("/api/menu/action",
            { action: "unequip", params: { slot: "hand2" } });
        }
        if (i.slot === "hand2") {
          const main = rows.find(function (x) {
            return x.equipped && x.slot === "hand" && x.two_handed;
          });
          if (main) {
            Api.toast("❌ Занято: двуручное оружие в основной руке");
            return;
          }
        }
        r = await Api.post("/api/menu/action",
          { action: "equip", params: { inv: i.inv } });
      } else {
        r = await Api.post("/api/menu/action",
          { action: "unequip", params: { slot: i.slot } });
      }
      Api.toast(r && r.ok ? "✅ Готово"
        : "❌ " + ((r && r.error) || "ошибка"));
      await load();
    } catch (e) { Api.toast("Ошибка сети: " + e.message); }
  }

  async function load() {
    if (isNpc) {
      try {
        const res = await Api.post("/api/npc/inventory",
          { npc_id: owner.id });
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