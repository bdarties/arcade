"""
Prépare la barre de vie du boss pour la borne.

L'équipe a fourni 28 images de 1280 x 720 px (la barre vide, puis 1 à 26 "crans" de vie),
soit environ 30 Mo de textures : beaucoup trop pour le Raspberry Pi. Une barre qui se vide
n'a besoin que de deux images : la barre vide et la barre pleine. Le jeu affiche la barre
pleine rognée sur la gauche (comme la barre du joueur, voir hud_solo.py / rognerBarre) :
le rouge visible est proportionnel aux PV, exactement comme dans les 26 images d'origine.

Utilisation (depuis le dossier du jeu) :
    python outils/integrer_barre_boss.py "chemin/vers/barre hp boss"
Sorties : assets/images/barre_boss_vide.png et barre_boss_pleine.png (880 x 186 px).
"""
import os
import sys

from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, "assets", "images")
SOURCE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RACINE, "..", "barre hp boss")

ZONE = (200, 259, 1080, 445)  # la barre occupe ce rectangle dans l'image de 1280 x 720
FICHIERS = {
    "barre de vie boss vide.png": "barre_boss_vide.png",
    "barre de vie boss 26.png": "barre_boss_pleine.png",
}

for source, sortie in FICHIERS.items():
    image = Image.open(os.path.join(SOURCE, source)).convert("RGBA").crop(ZONE)
    chemin = os.path.join(SORTIE, sortie)
    image.save(chemin, optimize=True)
    print(sortie, image.size, os.path.getsize(chemin) // 1024, "Ko")

# Dans l'image, le rouge va de la colonne 14 (0 % de vie) à la colonne 863 (100 %) :
# ce sont les constantes BARRE_BOSS_DEBUT et BARRE_BOSS_FIN de js/hud_solo.js
