"""SHIM обратной совместимости (P0-1/P2-1): монолит перенесён в bot/adapters.
ВНИМАНИЕ: не добавлять сюда логику — только ре-экспорты для старых импортов
(bot.main, bot.main_dev и любые модули, импортировавшие bot.web.server).
ВНИМАНИЕ (фикс 16.09.2026): отношения (включая pair/list_for) живут в
web_routes_rel; обработчики NPC/торговли/квестов регистрирует web_api.
"""
from bot.adapters.web_api import (start_web_server, cors_middleware,
handle_health)
from bot.adapters.web_common import (
ENCY, CREATE_MAP, DELETE_ALLOWED,
validate_init_data as _validate_init_data,
auth_uid as _auth_uid,
get_session as _session,
apply_update as _apply_update)
from bot.adapters.web_routes_media import (
handle_menu_page, handle_media, handle_gen_entity_image,
handle_gen_hero_image, handle_upload_entity_image,
save_image_with_thumb as _save_image_with_thumb,
ensure_thumbs as _ensure_thumbs)
from bot.adapters.web_routes_menu import handle_state, handle_action
from bot.adapters.web_routes_world import handle_reset_world
from bot.adapters.web_routes_ency import (handle_ency_list, handle_ency_get,
handle_ency_update,
handle_translate)
from bot.adapters.web_routes_rel import (
handle_get_relationships, handle_get_relationship,
handle_relationship_update, handle_pair, handle_list_for)
from bot.adapters.web_routes_time import (handle_time_state,
handle_time_advance,
handle_time_rewind)
from bot.adapters.web_routes_arbiter import handle_arbiter

__all__ = ["start_web_server", "cors_middleware", "handle_health",
"ENCY", "CREATE_MAP", "DELETE_ALLOWED",
"_validate_init_data", "_auth_uid", "_session", "_apply_update",
"handle_menu_page", "handle_media", "handle_gen_entity_image",
"handle_gen_hero_image", "handle_upload_entity_image",
"_save_image_with_thumb", "_ensure_thumbs",
"handle_state", "handle_action", "handle_reset_world",
"handle_ency_list", "handle_ency_get", "handle_ency_update",
"handle_translate",
"handle_get_relationships", "handle_get_relationship",
"handle_relationship_update", "handle_pair", "handle_list_for",
"handle_time_state", "handle_time_advance", "handle_time_rewind",
"handle_arbiter"]