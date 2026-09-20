"""=== ТЗ §15 R-04: маршруты времени для Web App ===
Хендлеры времени для Web App: состояние, перемотка, быстрый переход.
ВНИМАНИЕ: НЕ импортирует aiogram. Использует bot.engine.time_system.
ВНИМАНИЕ: НЕ использует bot.core.time_engine (устарел).
ВНИМАНИЕ (фикс 16.09.2026): handle_time_rewind возвращает ретроспективную
сводку (SS §23.5–23.6) полем "retrospect" — аддитивно, старые ключи целы.
"""
from datetime import date, timedelta
from aiohttp import web
from loguru import logger

from bot.config import settings
from bot.db.connection import get_db
from bot.engine import time_system as TS
from bot.engine import holiday_system as HS

_SEASON_RU = {"winter": "Зима", "spring": "Весна",
              "summer": "Лето", "autumn": "Осень"}
_WEATHER_RU = {"clear": "ясно", "cloudy": "облачно", "rain": "дождь",
               "snow": "снег", "storm": "гроза", "heat": "жара",
               "blizzard": "метель"}
_WEEK_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
_MONTH_RU = ["января", "февраля", "марта", "апреля", "мая", "июня",
             "июля", "августа", "сентября", "октября", "ноября", "декабря"]

# === ТЗ СС §23.9: быстрые переходы ===
REWIND_TARGETS = {
    "today_evening": (0, 18 * 60),       # сегодня 18:00
    "today_night": (0, 22 * 60),         # сегодня 22:00
    "tomorrow_morning": (1, 8 * 60),     # завтра 08:00
    "tomorrow_evening": (1, 19 * 60),    # завтра 19:00
}


def _ctx_to_json(ctx: dict, holiday: str = "", calendar: str = "") -> dict:
    """Собирает JSON-ответ из ctx."""
    d = ctx["date"]
    hh, mm = divmod(ctx["minute"], 60)
    return {
        "ok": True,
        "display": TS.format_full(ctx),
        "date": f"{d.day} {_MONTH_RU[d.month - 1]}",
        "day_of_week": _WEEK_RU[d.weekday()],
        "time": f"{hh:02d}:{mm:02d}",
        "season": _SEASON_RU.get(ctx["season"], ctx["season"]),
        "weather": _WEATHER_RU.get(ctx["weather"], ctx["weather"]),
        "temperature": ctx["temp"],
        "minute": ctx["minute"],
        "holiday": holiday,
        "calendar": calendar,
    }


async def _ensure_holidays(db, sid: int):
    """Ленивая генерация праздников при первом обращении."""
    if not await HS.has_generated_holidays(db, sid):
        cur = await db.execute(
            "SELECT description FROM scenarios WHERE scenario_id=?", (sid,))
        row = await cur.fetchone()
        if row and row[0]:
            from bot.ai.holiday_generator import generate_holidays
            from bot.services.llm_client import generate

            async def _llm(sys, usr, mt, tmp):
                return await generate(
                    [{"role": "system", "content": sys},
                     {"role": "user", "content": usr}],
                    temperature=tmp, max_tokens=mt)
            holidays = await generate_holidays(_llm, row[0])
            await HS.save_generated_holidays(db, sid, holidays)


# === ТЗ §15 R-04: POST /api/time ===
async def handle_time_state(request):
    """Текущее состояние времени + календарь + праздник."""
    try:
        data = await request.json()
    except Exception:
        data = {}
    uid = settings.allowed_user_id
    db = await get_db()
    try:
        cur = await db.execute(
            "SELECT scenario_id FROM active_session WHERE user_id=?", (uid,))
        sess = await cur.fetchone()
        if not sess:
            return web.json_response({"ok": False, "error": "no_session"})
        sid = sess[0]
        await _ensure_holidays(db, sid)
        ctx = await TS.ensure_world_state(db, sid)
        holidays = await HS.get_all_holidays(db, sid)
        hol = HS.holiday_for_date(holidays, ctx["date"].month, ctx["date"].day)
        calendar = HS.format_calendar(ctx, holidays)
        return web.json_response(_ctx_to_json(ctx, hol, calendar))
    finally:
        await db.close()


# === ТЗ §15 R-04: POST /api/advance_time ===
async def handle_time_advance(request):
    """Перемотка на N минут."""
    try:
        data = await request.json()
    except Exception:
        data = {}
    minutes = int(data.get("minutes", 60))
    uid = settings.allowed_user_id
    db = await get_db()
    try:
        cur = await db.execute(
            "SELECT scenario_id FROM active_session WHERE user_id=?", (uid,))
        sess = await cur.fetchone()
        if not sess:
            return web.json_response({"ok": False, "error": "no_session"})
        sid = sess[0]
        ctx, delta = await TS.advance(db, sid, minutes)
        holidays = await HS.get_all_holidays(db, sid)
        hol = HS.holiday_for_date(holidays, ctx["date"].month, ctx["date"].day)
        result = _ctx_to_json(ctx, hol)
        result["delta_human"] = TS.delta_human(delta)
        return web.json_response(result)
    finally:
        await db.close()


# === ТЗ §15 R-04: POST /api/menu/time/rewind ===
async def handle_time_rewind(request):
    """Быстрый переход: today_evening / today_night / tomorrow_morning /
    tomorrow_evening / точное время {hour, minute}.
    ВНИМАНИЕ: ретроспектива (SS §23.5–23.6) — поле "retrospect".
    """
    try:
        data = await request.json()
    except Exception:
        data = {}
    target = data.get("target", "")
    uid = settings.allowed_user_id
    db = await get_db()
    try:
        cur = await db.execute(
            "SELECT scenario_id FROM active_session WHERE user_id=?", (uid,))
        sess = await cur.fetchone()
        if not sess:
            return web.json_response({"ok": False, "error": "no_session"})
        sid = sess[0]
        ctx = await TS.ensure_world_state(db, sid)
        if target in REWIND_TARGETS:
            day_off, minute = REWIND_TARGETS[target]
            target_date = ctx["date"] + timedelta(days=day_off)
            ctx, delta = await TS.rewind_to(db, sid, target_date, minute)
        elif "hour" in data and "minute" in data:
            try:
                h, m = int(data["hour"]), int(data["minute"])
                if not (0 <= h <= 23 and 0 <= m <= 59):
                    raise ValueError
            except (TypeError, ValueError):
                return web.json_response(
                    {"ok": False, "error": "Неверное время"})
            target_date = ctx["date"]
            target_minute = h * 60 + m
            if target_minute < ctx["minute"]:
                target_date += timedelta(days=1)
            ctx, delta = await TS.rewind_to(db, sid, target_date,
                                            target_minute)
        else:
            return web.json_response(
                {"ok": False, "error": "Неизвестный target"})
        holidays = await HS.get_all_holidays(db, sid)
        hol = HS.holiday_for_date(holidays, ctx["date"].month, ctx["date"].day)
        result = _ctx_to_json(ctx, hol)
        result["delta_human"] = TS.delta_human(delta)
        # === SS §23.5–23.6: ретроспективные факты за Δt ===
        try:
            result["retrospect"] = await TS.retrospect_facts(db, sid, delta,
                                                             ctx)
        except Exception as e:
            logger.warning(f"retrospect: {e}")
            result["retrospect"] = []
        return web.json_response(result)
    finally:
        await db.close()