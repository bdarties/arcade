#!/usr/bin/env python3
# version.py : écrit js/version.js, le numéro de version affiché en bas à droite du menu du jeu.
# À lancer juste avant de faire une pull request : python3 outils/version.py  (puis commiter js/version.js).
# Sur la borne, si le numéro affiché n'est pas celui du dernier js/version.js de GitHub, le jeu n'est pas à jour.
# Le numéro = nombre de commits du dépôt + empreinte courte du dernier commit + date.
import subprocess, datetime, pathlib

def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()

jeu = pathlib.Path(__file__).resolve().parent.parent
numero = git("rev-list", "--count", "HEAD")
empreinte = git("rev-parse", "--short", "HEAD")
date = datetime.date.today().strftime("%d/%m/%Y")
(jeu / "js" / "version.js").write_text(f'// Généré par outils/version.py : ne pas modifier à la main.\nexport const VERSION = "v{numero} · {empreinte} · {date}";\n', encoding="utf-8")
print(f"version : v{numero} · {empreinte} · {date}")
