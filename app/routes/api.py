from flask import Blueprint, request, jsonify

from ..db import get_top_scores, add_score

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
