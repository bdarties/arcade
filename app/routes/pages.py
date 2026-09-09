import json
from pathlib import Path
from typing import Dict, List, Any

from flask import Blueprint, current_app, render_template, abort, send_from_directory, url_for, request, jsonify

from ..config import Config
from ..db import init_db

bp = Blueprint("routes", __name__)


def get_games_root() -> Path:
	return Path(current_app.root_path).parent / "games"


def load_games_metadata(include_hidden: bool = False) -> List[Dict[str, Any]]:
	games_root = get_games_root()
	games: List[Dict[str, Any]] = []

	if not games_root.exists():
		return games

	for item in sorted(games_root.iterdir()):
		if not item.is_dir():
			continue
		meta_file = item / "game.json"
		if not meta_file.exists():
			continue
		try:
			with meta_file.open("r", encoding="utf-8") as f:
				meta = json.load(f)
		except Exception:
			continue
		if meta.get("hidden") and not include_hidden:
			continue
		game_id = item.name
		meta["id"] = game_id
		meta.setdefault("title", game_id)
		meta.setdefault("description", "")
		meta.setdefault("authors", [])
		games.append(meta)

	return games


@bp.route("/")
@bp.route("/accueil")
def home():
	return render_template("home.html")


@bp.route("/games/")
def games_list():
	games = load_games_metadata()
	return render_template("games_list.html", games=games)


@bp.route("/games/<game_id>/<path:filepath>")
def serve_game_file(game_id: str, filepath: str):
    """
    Sert les fichiers du jeu (images png et vidéos mp4)
    """
    game_dir = get_games_root() / game_id
    
    try:
        safe_path = (game_dir / filepath).resolve()
        if not str(safe_path).startswith(str(game_dir.resolve())):
            abort(404)
    except (ValueError, RuntimeError):
        abort(404)
        
    if not safe_path.exists():
        abort(404)
        
    return send_from_directory(game_dir, filepath)

@bp.route("/games/<game_id>/")
def game_page(game_id: str):
    games = load_games_metadata()
    game_meta = next((g for g in games if g["id"] == game_id), None)
    if game_meta is None:
        abort(404)

    game_dir = get_games_root() / game_id
    js_entry = game_dir / "index.js"
    if not js_entry.exists():
        abort(404)

    entry_js_url = url_for("routes.serve_game_file", 
                          game_id=game_id, 
                          filepath="index.js")
    score_module_url = url_for(
        "static", filename="js/score_fake.js" if Config.USE_FAKE_SCORES else "js/score.js"
    )
    return render_template("game_fullscreen.html", 
                         game=game_meta, 
                         entry_js_url=entry_js_url,
                         score_module_url=score_module_url)

@bp.route("/about")
def about():
    return render_template("about.html")

@bp.route('/init-db', methods=['POST'])
def initialize_database():
    """
    Route pour initialiser ou réinitialiser la base de données des scores.
    Protégée par un jeton (header X-Init-Token) défini via la variable
    d'environnement INIT_DB_TOKEN. Sans jeton configuré, la route est désactivée.
    """
    token = request.headers.get("X-Init-Token", "")
    if not Config.INIT_DB_TOKEN or token != Config.INIT_DB_TOKEN:
        abort(403)
    try:
        init_db()
        return jsonify({"success": True, "message": "Base de données initialisée avec succès."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
