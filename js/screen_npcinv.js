/* Меню v2, инвентарь именного NPC: делегирует ЕДИНОМУ рендереру
   renderInventoryScreen (оформление идентично инвентарю героя).
   ВНИМАНИЕ: owner.type="npc" переключает маршруты на /api/npc/*. */
Router.register("npc_inventory", function (box, params) {
  renderInventoryScreen(box,
    { type: "npc", id: params.id, group: params.group });
});