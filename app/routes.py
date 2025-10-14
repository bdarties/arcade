import json
from pathlib import Path
from typing import Dict, List, Any

from flask import Blueprint, current_app, render_template, abort, send_from_directory, url_for, request, jsonify

from .db import get_top_scores, add_score, init_db
bp = Blueprint("routes", __name__)
bp_api = Blueprint('api', __name__, url_prefix='/api')


def get_games_root() -> Path:
	return Path(current_app.root_path).parent / "games"


def load_games_metadata() -> List[Dict[str, Any]]:
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
	print(games)
	print ("")
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
    print("test")
    games = load_games_metadata()
    game_meta = next((g for g in games if g["id"] == game_id), None)
    if game_meta is None:
        abort(404)

    game_dir = get_games_root() / game_id
    js_entry = game_dir / "index.js"
    if not js_entry.exists():
        abort(404)

    # Correction de l'appel url_for pour utiliser filepath
    entry_js_url = url_for("routes.serve_game_file", 
                          game_id=game_id, 
                          filepath="index.js")  # Utilisation de filepath au lieu de filename
    return render_template("game_fullscreen.html", 
                         game=game_meta, 
                         entry_js_url=entry_js_url)

@bp.route("/about")
def about():
    return render_template("about.html")

@bp_api.route('/scores/<game_id>', methods=['GET'])
def get_scores(game_id):
    """Récupère les 10 meilleurs scores pour un jeu."""
    scores = get_top_scores(game_id)
    return jsonify([
        {'player': name, 'score': score} 
        for name, score in scores
    ])

@bp_api.route('/scores', methods=['POST'])
def save_score():
    """Ajoute un nouveau score."""
    data = request.get_json()
    
    # Vérification des données requises
    if not all(k in data for k in ['gameId', 'playerName', 'score']):
        return jsonify({
            'success': False,
            'error': 'Données manquantes'
        }), 400
    
    # Validation des types
    if not isinstance(data['score'], int):
        return jsonify({
            'success': False,
            'error': 'Le score doit être un nombre entier'
        }), 400
        
    success = add_score(
        data['gameId'],
        data['playerName'],
        data['score']
    )
    
    return jsonify({
        'success': success,
        'error': None if success else 'Erreur lors de l\'ajout du score'
    }), 200 if success else 500

@bp.route('/init-db', methods=['POST'])
def initialize_database():
    """
    Route pour initialiser ou réinitialiser la base de données des scores.
    """
    try:
        init_db()
        return jsonify({"success": True, "message": "Base de données initialisée avec succès."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

