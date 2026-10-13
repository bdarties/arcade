import logging
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import List, Optional, Tuple

from .config import Config

logger = logging.getLogger(__name__)


def get_db_path() -> Path:
    return Config.DB_PATH


@contextmanager
def _get_connection():
    conn = sqlite3.connect(get_db_path())
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    with _get_connection() as conn:
        cursor = conn.cursor()

        # Création de la table des scores
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS high_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id VARCHAR(16) NOT NULL,
            player_name VARCHAR(50) NOT NULL,
            score INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(game_id, player_name, score)

        )
        ''')

        # Index pour optimiser les recherches par game_id
        cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_game_scores 
        ON high_scores(game_id, score DESC)
        ''')

        # Espace de stockage JSON libre, un par jeu (nom du répertoire du jeu)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_data (
            game_id VARCHAR(100) PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        conn.commit()

def get_game_data(game_id: str) -> Optional[str]:
    """Retourne le JSON (texte) stocké pour un jeu, ou None s'il n'y en a pas."""
    with _get_connection() as conn:
        row = conn.execute(
            'SELECT data FROM game_data WHERE game_id = ?', (game_id,)
        ).fetchone()
        return row[0] if row else None


def set_game_data(game_id: str, data: str) -> None:
    """Crée ou remplace le JSON (texte) d'un jeu."""
    with _get_connection() as conn:
        conn.execute('''
        INSERT INTO game_data (game_id, data, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(game_id) DO UPDATE SET
            data = excluded.data, updated_at = CURRENT_TIMESTAMP
        ''', (game_id, data))
        conn.commit()


def add_score(game_id: str, player_name: str, score: int) -> bool:
    """
    Ajoute un nouveau score pour un jeu.
    Retourne True si l'ajout est réussi.
    """
    with _get_connection() as conn:
        cursor = conn.cursor()

        try:
            # Vérifier le nombre de scores existants
            cursor.execute('''
            SELECT COUNT(*), MIN(score)
            FROM high_scores 
            WHERE game_id = ?
            ''', (game_id,))
            count, min_score = cursor.fetchone()

            # Si moins de 10 scores ou meilleur que le plus bas
            if count < 10 or score > min_score or (count == 0):
                cursor.execute('''
                INSERT INTO high_scores (game_id, player_name, score)
                VALUES (?, ?, ?)
                ''', (game_id, player_name, score))

                # Si plus de 10 scores, supprimer le plus bas.
                #
                # On cible une ligne par son id plutot que par "WHERE score =
                # MIN(...) LIMIT 1" : SQLite n'accepte LIMIT sur un DELETE que
                # s'il a ete compile avec SQLITE_ENABLE_UPDATE_DELETE_LIMIT, ce
                # que le module sqlite3 de Python ne fait pas. L'ancienne requete
                # levait donc une OperationalError, avalee par le except
                # ci-dessous : des qu'un jeu atteignait 10 scores, l'INSERT
                # repartait en rollback et PLUS AUCUN score ne pouvait etre
                # enregistre, pas meme un record. Le sous-SELECT, lui, a le droit
                # d'utiliser LIMIT.
                #
                # Le tri secondaire sur id departage deux scores egaux : sans lui
                # la ligne supprimee serait choisie arbitrairement. A egalite, on
                # retire la plus ancienne.
                if count >= 10:
                    cursor.execute('''
                    DELETE FROM high_scores
                    WHERE id = (
                        SELECT id
                        FROM high_scores
                        WHERE game_id = ?
                        ORDER BY score ASC, id ASC
                        LIMIT 1
                    )
                    ''', (game_id,))

                conn.commit()
                return True
        except sqlite3.Error:
            # Sans cette trace, une erreur SQL etait indiscernable d'un score
            # simplement trop faible pour entrer au classement : les deux cas
            # renvoyaient False en silence. C'est ce qui a rendu le bug ci-dessus
            # invisible pendant des semaines.
            logger.exception(
                "Echec de l'enregistrement du score (game_id=%s, player_name=%s, score=%s)",
                game_id, player_name, score,
            )
            return False

    return False

def get_top_scores(game_id: str) -> List[Tuple[str, int]]:
    """
    Récupère les 10 meilleurs scores pour un jeu.
    Retourne une liste de tuples (nom_joueur, score).
    """
    with _get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute('''
        SELECT player_name, score 
        FROM high_scores 
        WHERE game_id = ? 
        ORDER BY score DESC 
        LIMIT 10
        ''', (game_id,))
        return cursor.fetchall()

