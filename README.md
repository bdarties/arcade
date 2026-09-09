# Arcade (Flask + Phaser)

Projet Flask servant de hub pour une borne d'arcade affichant des jeux Phaser avec une interface moderne et intuitive.

## Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # puis ajustez les valeurs si besoin
python run.py
```

Ouvrez `http://localhost:5000`.

### Configuration (.env)

Le serveur lit sa configuration depuis un fichier `.env` (non versionné, voir `.env.example`) :

- `FLASK_DEBUG`, `FLASK_RUN_HOST`, `FLASK_RUN_PORT` : mode debug et interface/port d'écoute
- `DB_PATH` : emplacement du fichier SQLite des scores (par défaut `scores.db` à la racine)
- `INIT_DB_TOKEN` : jeton requis (header `X-Init-Token`) pour appeler `POST /init-db`
- `USE_FAKE_SCORES` : utilise `static/js/score_fake.js` (scores simulés) au lieu de `static/js/score.js`

## Interface

### Routes disponibles

- **`/` ou `/accueil`** : Écran d'accueil avec un bouton "Commencer"
- **`/games/`** : Liste des jeux avec navigation par grille
- **`/games/<nomrepertoire>`** : Jeu en plein écran

### Navigation

- **Page d'accueil** : Bouton "Commencer" pour accéder à la liste des jeux
- **Liste des jeux** : 
  - Grille de 3 colonnes sur 66% de l'écran
  - Description du jeu sur 33% de droite
  - Navigation avec les flèches directionnelles
  - Mise à jour automatique de la description lors du changement de focus
  - Bouton "Jouer" pour lancer le jeu sélectionné
- **Jeu** : Affichage en plein écran avec bouton "Retour"

## Structure

```
arcade/
  app/
    __init__.py
    config.py
    db.py
    routes/
      pages.py           # Pages HTML (accueil, liste des jeux, jeu plein écran)
      api.py             # API JSON (/api/scores)
    templates/
      base.html
      home.html          # Page d'accueil
      games_list.html    # Liste des jeux
      game_fullscreen.html # Jeu en plein écran
    static/
      css/style.css      # Styles modernes avec effets visuels
      js/app.js          # Navigation avec flèches directionnelles
  games/
    sample/
      game.json
      js/index.js
      presentation.png   # Image de présentation (800x450)
  requirements.txt
  requirements-gpio.txt  # Dépendances de gpio2keys.py (Raspberry Pi uniquement)
  .env.example
  run.py
```

## Ajouter un jeu

1. Créez un répertoire sous `games/` avec un nom court (ex: `pacman`)
2. Ajoutez un `game.json` contenant:
   ```json
   {
     "title": "Nom du jeu",
     "description": "Description du jeu",
     "authors": ["Auteur 1", "Auteur 2"]
   }
   ```
3. Placez votre code Phaser (ex: `js/index.js`, `assets/`, etc.)
4. Ajoutez une image `presentation.png` (format paysage 16:9 recommandé)
5. Le point d'entrée doit être `js/index.js`. Il sera chargé en `type=module`
6. Pour masquer un jeu de la liste (démo interne, jeu en cours de test, etc.) sans le supprimer,
   ajoutez `"hidden": true` dans son `game.json`

## Fonctionnalités

- **Interface moderne** : Design avec dégradés et effets de transparence
- **Navigation intuitive** : Flèches directionnelles pour naviguer dans la grille
- **Responsive** : Adaptation automatique aux différentes tailles d'écran
- **Plein écran** : Jeux affichés sans interface pour une expérience immersive
- **Images de présentation** : Support des images de couverture pour chaque jeu