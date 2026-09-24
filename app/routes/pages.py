import json
import re
import subprocess
from pathlib import Path
from typing import Dict, List, Any

from flask import Blueprint, current_app, render_template, abort, redirect, send_from_directory, url_for, request, jsonify

from ..config import Config
from ..db import init_db

bp = Blueprint("routes", __name__)

# Les jeux sont ranges par promotion : games/<annee>/<nom_du_jeu>/.
# Seuls les dossiers dont le nom est une annee sur 4 chiffres sont consideres
# comme des promos, pour ignorer d'eventuels fichiers parasites dans games/.
PROMO_PATTERN = re.compile(r"^\d{4}$")


def get_games_root() -> Path:
	return Path(current_app.root_path).parent / "games"


def list_promos() -> List[str]:
	"""Retourne les promotions disponibles, par ordre chronologique."""
	games_root = get_games_root()
	if not games_root.exists():
		return []
	promos = [
		item.name
		for item in games_root.iterdir()
		if item.is_dir() and PROMO_PATTERN.match(item.name)
	]
	return sorted(promos)


def get_promo_dir(promo: str) -> Path:
	"""Valide la promo demandee et renvoie son dossier, ou 404."""
	if not PROMO_PATTERN.match(promo):
		abort(404)
	promo_dir = get_games_root() / promo
	if not promo_dir.is_dir():
		abort(404)
	return promo_dir


def load_games_metadata(promo: str, include_hidden: bool = False) -> List[Dict[str, Any]]:
	games_root = get_games_root() / promo
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
	return render_template("home.html", promos=list_promos())


@bp.route("/games/")
def games_index():
	"""Ancienne liste globale : on renvoie vers l'accueil, qui choisit la promo."""
	return redirect(url_for("routes.home"))


@bp.route("/games/<promo>/")
def games_list(promo: str):
	get_promo_dir(promo)
	games = load_games_metadata(promo)
	return render_template("games_list.html", games=games, promo=promo)


@bp.route("/games/<promo>/<game_id>/<path:filepath>")
def serve_game_file(promo: str, game_id: str, filepath: str):
    """
    Sert les fichiers du jeu (images png et vidéos mp4)
    """
    game_dir = get_promo_dir(promo) / game_id

    try:
        safe_path = (game_dir / filepath).resolve()
        if not str(safe_path).startswith(str(game_dir.resolve())):
            abort(404)
    except (ValueError, RuntimeError):
        abort(404)

    if not safe_path.exists():
        abort(404)

    return send_from_directory(game_dir, filepath)

@bp.route("/games/<promo>/<game_id>/")
def game_page(promo: str, game_id: str):
    games = load_games_metadata(promo)
    game_meta = next((g for g in games if g["id"] == game_id), None)
    if game_meta is None:
        abort(404)

    game_dir = get_promo_dir(promo) / game_id
    js_entry = game_dir / "index.js"
    if not js_entry.exists():
        abort(404)

    entry_js_url = url_for("routes.serve_game_file",
                          promo=promo,
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

@bp.route('/shutdown', methods=['POST'])
def shutdown():
    """
    Éteint le Raspberry Pi. L'utilisateur exécutant Flask doit pouvoir lancer
    `sudo shutdown` sans mot de passe (règle sudoers dédiée sur la borne).
    """
    try:
        subprocess.Popen(["sudo", "shutdown", "-h", "now"])
        return jsonify({"success": True}), 200
    except OSError as e:
        return jsonify({"success": False, "error": str(e)}), 500

@bp.route('/reboot', methods=['POST'])
def reboot():
    """
    Redémarre le Raspberry Pi. Mêmes prérequis sudo que la route /shutdown.
    """
    try:
        subprocess.Popen(["sudo", "shutdown", "-r", "now"])
        return jsonify({"success": True}), 200
    except OSError as e:
        return jsonify({"success": False, "error": str(e)}), 500

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
