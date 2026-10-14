import json
import re

from flask import Blueprint, Response, request, jsonify

from ..db import get_top_scores, add_score, get_game_data, set_game_data

bp_api = Blueprint('api', __name__, url_prefix='/api')


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



GAME_ID_RE = re.compile(r'^[\w.\- ]{1,100}$')
MAX_GAME_DATA_BYTES = 10 * 1024 * 1024


@bp_api.route('/donnees/<game_id>', methods=['GET'])
def read_game_data(game_id):
    """Retourne le JSON libre stocké par un jeu (null si rien n'a été écrit)."""
    if not GAME_ID_RE.match(game_id):
        return jsonify({'error': 'Identifiant de jeu invalide'}), 400
    data = get_game_data(game_id)
    return Response(data if data is not None else 'null', mimetype='application/json')


@bp_api.route('/donnees/<game_id>', methods=['PUT', 'POST'])
def write_game_data(game_id):
    """Remplace le JSON libre stocké par un jeu."""
    if not GAME_ID_RE.match(game_id):
        return jsonify({'success': False, 'error': 'Identifiant de jeu invalide'}), 400
    raw = request.get_data()
    if len(raw) > MAX_GAME_DATA_BYTES:
        return jsonify({'success': False, 'error': 'Données trop volumineuses'}), 413
    try:
        json.loads(raw)
    except ValueError:
        return jsonify({'success': False, 'error': 'JSON invalide'}), 400
    set_game_data(game_id, raw.decode('utf-8'))
    return jsonify({'success': True})
