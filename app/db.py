import sqlite3
import os
from pathlib import Path
from typing import List, Tuple

def get_db_path():
    return Path(__file__).parent.parent / 'scores.db'

def init_db():
    conn = sqlite3.connect(get_db_path())
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
    
    conn.commit()
    conn.close()

def add_score(game_id: str, player_name: str, score: int) -> bool:
    """
    Ajoute un nouveau score pour un jeu.
    Retourne True si l'ajout est réussi.
    """
    conn = sqlite3.connect(get_db_path())
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
            
            # Si plus de 10 scores, supprimer le plus bas
            if count >= 10:
                cursor.execute('''
                DELETE FROM high_scores 
                WHERE game_id = ? 
                AND score = (
                    SELECT MIN(score) 
                    FROM high_scores 
                    WHERE game_id = ?
                )
                LIMIT 1
                ''', (game_id, game_id))
            
            conn.commit()
            return True
    except sqlite3.Error:
        return False
    finally:
        conn.close()
    
    return False

def get_top_scores(game_id: str) -> List[Tuple[str, int]]:
    """
    Récupère les 10 meilleurs scores pour un jeu.
    Retourne une liste de tuples (nom_joueur, score).
    """
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
        SELECT player_name, score 
        FROM high_scores 
        WHERE game_id = ? 
        ORDER BY score DESC 
        LIMIT 10
        ''', (game_id,))
        return cursor.fetchall()
    finally:
        conn.close()


