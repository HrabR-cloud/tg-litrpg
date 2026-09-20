"""Маршруты NPC: карточка NPC (запись + умения + отношение к герою + типы
колонок) и создание умения NPC с привязкой (ТЗ v5 §6, P1, решение
владельца 16.09.2026: меню именного NPC = меню героя).
ВНИМАНИЕ: умения читаются из character_skills защитно (схема через PRAGMA);
создание умения = INSERT в каталог + привязка; числа — из тела запроса.
ВНИМАНИЕ: правка полей/картинки NPC — существующими контрактами
/api/ency/update и /api/gen_entity_image (не меняются).
"""
import json

from aiohttp import web
from loguru import logger

from bot.db.connection import get_db
from bot.adapters.web_common import auth_uid, get_session
from bot.adapters.web_routes_menu import _hero_skills


async def _shadow_of(db, hid, sid):
    cur = await db.execute(
        "SELECT npc_id FROM npc WHERE linked_hero_id=? AND scenario_id=?",
        (hid, sid))
    row = await cur.fetchone()
    return row[0] if row else None


# === P1: карточка NPC: все данные для меню «как у героя» ===
async def handle_npc_card(request):
    uid, data = await auth_uid(request)
    try:
        npc_id = int(data.get("npc_id", 0))
    except (TypeError, ValueError):
        npc_id = 0
    if not npc_id:
        return web.json_response({"ok": False, "error": "npc_id required"})
    db = await get_db()
    try:
        sess = await get_session(db, uid)
        if not sess:
            return web.json_response({"ok": False, "error": "no_session"})
        sid, hid = sess
        cur = await db.execute("SELECT * FROM npc WHERE npc_id=?", (npc_id,))
        row = await cur.fetchone()
        if not row:
            return web.json_response({"ok": False, "error": "not_found"})
        cols = [d[0] for d in cur.description]
        rec = dict(zip(cols, row))
        cur2 = await db.execute("PRAGMA table_info(npc)")
        types = {r[1]: (r[2] or "") for r in await cur2.fetchall()}
        skills = await _hero_skills(db, npc_id)
        rel = None
        try:
            from bot.core.relations.engine import RelationsEngine as RE
            shadow = await _shadow_of(db, hid, sid)
            for frm in ([shadow, hid] if shadow else [hid]):
                rel = await RE.get_relationship(db, frm, npc_id, sid)
                if rel:
                    break
        except Exception as e:
            logger.debug(f"npc_card rel: {e}")
        return web.json_response({"ok": True, "npc": rec, "types": types,
                                  "skills": skills, "rel": rel})
    except Exception as e:
        logger.error(f"❌ npc_card: {e}")
        return web.json_response({"ok": False, "error": str(e)})
    finally:
        await db.close()


# === P1: новое умение NPC (каталог + привязка через character_skills) ===
async def handle_npc_skill_create(request):
    uid, data = await auth_uid(request)
    try:
        npc_id = int(data.get("npc_id", 0))
    except (TypeError, ValueError):
        npc_id = 0
    kind = "combat" if data.get("kind") == "combat" else "noncombat"
    name = (data.get("name") or "").strip()
    if not npc_id or not name:
        return web.json_response({"ok": False,
                                  "error": "нужны npc_id и название"})
    db = await get_db()
    try:
        sess = await get_session(db, uid)
        if not sess:
            return web.json_response({"ok": False, "error": "no_session"})
        sid = sess[0]
        t = "combat_skills" if kind == "combat" else "noncombat_skills"
        idf = ("combat_skill_id" if kind == "combat"
               else "noncombat_skill_id")
        cur = await db.execute(f"PRAGMA table_info({t})")
        cols = {r[1] for r in await cur.fetchall()}
        payload = {"name": name,
                   "description": data.get("description", "") or ""}
        for k in ("base_damage", "cooldown", "speed_bonus"):
            if k in cols:
                try:
                    payload[k] = int(data.get(k, 0) or 0)
                except (TypeError, ValueError):
                    payload[k] = 0
        if "stat_modifiers" in cols:
            payload["stat_modifiers"] = json.dumps(data.get("mods") or {},
                                                   ensure_ascii=False)
        if "scenario_id" in cols:
            payload["scenario_id"] = sid
        keys = ", ".join(payload)
        marks = ", ".join("?" for _ in payload)
        cur = await db.execute(f"INSERT INTO {t} ({keys}) VALUES ({marks})",
                               tuple(payload.values()))
        await db.commit()
        skill_id = cur.lastrowid
        cur = await db.execute("PRAGMA table_info(character_skills)")
        ccols = {r[1] for r in await cur.fetchall()}
        owner = next((c for c in ("character_id", "hero_id", "owner_id")
                      if c in ccols), None)
        if owner:
            link = {owner: npc_id}
            if "combat_skill_id" in ccols and "noncombat_skill_id" in ccols:
                link["combat_skill_id" if kind == "combat"
                     else "noncombat_skill_id"] = skill_id
            elif "skill_id" in ccols:
                link["skill_id"] = skill_id
                tcol = next((c for c in ("skill_type", "type", "kind")
                             if c in ccols), None)
                if tcol:
                    link[tcol] = kind
            lk = ", ".join(link)
            lm = ", ".join("?" for _ in link)
            await db.execute(
                f"INSERT INTO character_skills ({lk}) VALUES ({lm})",
                tuple(link.values()))
            await db.commit()
        logger.info(f"🎯 NPC#{npc_id}: новое умение {kind} #{skill_id} "
                    f"«{name}»")
        return web.json_response({"ok": True, "skill_id": skill_id})
    except Exception as e:
        logger.error(f"❌ npc_skill_create: {e}")
        return web.json_response({"ok": False, "error": str(e)})
    finally:
        await db.close()


def setup(app):
    app.add_routes([
        web.post("/api/npc/card", handle_npc_card),
        web.post("/api/npc/skill_create", handle_npc_skill_create),
    ])