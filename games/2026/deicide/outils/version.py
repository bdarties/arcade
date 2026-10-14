#!/usr/bin/env python3
# version.py : passe à la version suivante (v1, v2, v3...) dans js/version.js, affichée en bas à droite du menu du jeu.
# À lancer UNE FOIS par pull request, juste avant de la faire : python3 outils/version.py  (puis commiter js/version.js).
# Sur la borne, si le numéro affiché est plus petit que celui de js/version.js sur GitHub (branche main), le jeu n'est pas à jour.
import re, pathlib

fichier = pathlib.Path(__file__).resolve().parent.parent / "js" / "version.js"
actuel = int(re.search(r'"v(\d+)"', fichier.read_text(encoding="utf-8")).group(1)) if fichier.exists() else 0
fichier.write_text(f'// Numéro de version affiché dans le menu. Augmenté de 1 à chaque pull request par outils/version.py : ne pas modifier à la main.\nexport const VERSION = "v{actuel + 1}";\n', encoding="utf-8")
print(f"version : v{actuel + 1}")
