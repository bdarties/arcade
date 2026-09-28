#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Filet de sécurité pour les inscriptions de la SAÉ 301.

En temps normal ce script ne sert à rien : le robot
'.github/workflows/inscription.yml' traite chaque demande à la seconde où
elle est déposée. Il devient utile lorsque le robot n'a pas pu tourner —
jeton expiré, secret absent, Actions désactivées — et qu'il faut rattraper
d'un coup toutes les demandes accumulées.

Il fait alors deux choses :

  1. il reconstruit '.github/groupes.json' à partir des demandes déposées ;
  2. il envoie les invitations de collaboration correspondantes.

ATTENTION — le fichier est RECONSTRUIT, pas complété. Toute personne
inscrite à la main dans groupes.json sans demande correspondante disparaîtra.
Regardez toujours la simulation avant d'ajouter --appliquer.

Par sécurité, le script ne fait RIEN par défaut : il affiche ce qu'il ferait.

Prérequis : la commande 'gh' installée et authentifiée (gh auth status),
avec un compte ayant le droit d'ajouter des collaborateurs sur le dépôt.

Exemples
--------
    python outils/inscrire.py
    python outils/inscrire.py --appliquer
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

# Ici le formulaire et les dossiers des étudiant·es vivent dans le même dépôt :
# une seule adresse suffit, là où le dispositif de R3.14 en manipulait deux.
DEPOT = "bdarties/arcade"

# Chemin par défaut : le dépôt qui contient ce script. Le script est donc
# utilisable sans argument depuis n'importe quel clone.
RACINE = Path(__file__).resolve().parent.parent


def gh(*args: str) -> str:
    """Appelle 'gh' et renvoie sa sortie, en s'arrêtant net en cas d'échec."""
    res = subprocess.run(
        ["gh", *args], capture_output=True, text=True, encoding="utf-8"
    )
    if res.returncode != 0:
        print(f"\n[ERREUR] gh {' '.join(args)}\n{res.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    return res.stdout


def lire_inscriptions(jeux: list) -> dict:
    """
    Renvoie {pseudo: (jeu, numero_issue)}.

    Les demandes sont parcourues de la plus ancienne à la plus récente, si
    bien qu'une seconde inscription écrase la première : c'est ainsi qu'un·e
    étudiant·e corrige une erreur d'équipe sans intervention de notre part.
    """
    brut = gh(
        "issue", "list",
        "--repo", DEPOT,
        "--label", "inscription",
        "--state", "all",
        "--limit", "300",
        "--json", "number,author,body,createdAt",
    )
    issues = sorted(json.loads(brut), key=lambda i: i["createdAt"])

    retenues, ignorees = {}, []
    for issue in issues:
        pseudo = (issue.get("author") or {}).get("login")
        # Le formulaire rend chaque réponse sous la forme :
        #   ### Votre jeu
        #
        #   arianite
        bloc = re.search(
            r"###\s*Votre jeu\s*\n+(.+?)(?:\n###|\Z)", issue.get("body") or "", re.S
        )
        jeu = bloc.group(1).strip().splitlines()[0].strip() if bloc else ""
        if not pseudo or jeu not in jeux:
            ignorees.append((issue["number"], pseudo, jeu))
            continue
        retenues[pseudo] = (jeu, issue["number"])

    for numero, pseudo, jeu in ignorees:
        print(f"  ignoree : demande #{numero} de {pseudo} (jeu illisible : {jeu!r})")

    return retenues


def construire_mapping(inscriptions: dict, jeux: list) -> dict:
    """Produit le dictionnaire attendu par le robot 'verifier-acces'."""
    mapping = {f"games/2026/{j}/": [] for j in jeux}
    for pseudo, (jeu, _) in sorted(inscriptions.items()):
        mapping[f"games/2026/{jeu}/"].append(pseudo)
    return mapping


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--depot", default=str(RACINE),
        help="Chemin du clone local du dépôt (celui qui contient .github/). "
             "Par défaut : le dépôt dans lequel se trouve ce script.",
    )
    parser.add_argument(
        "--appliquer", action="store_true",
        help="Écrire groupes.json et envoyer les invitations. Sans cette option, "
             "le script se contente d'afficher ce qu'il ferait.",
    )
    args = parser.parse_args()

    racine = Path(args.depot).expanduser().resolve()
    cible = racine / ".github" / "groupes.json"
    if not cible.exists():
        sys.exit(f"[ERREUR] Introuvable : {cible}\nVérifiez l'option --depot.")

    ancien = json.loads(cible.read_text(encoding="utf-8"))
    # La liste des jeux valides vient de groupes.json, exactement comme dans le
    # robot : ajouter une équipe ne demande de toucher qu'à ce fichier et au
    # formulaire d'inscription.
    jeux = [c.removeprefix("games/2026/").rstrip("/") for c in ancien]

    print(f"Lecture des inscriptions sur {DEPOT} ...")
    inscriptions = lire_inscriptions(jeux)
    if not inscriptions:
        sys.exit("Aucune inscription exploitable. Rien à faire.")

    mapping = construire_mapping(inscriptions, jeux)

    # --- Compte rendu ---------------------------------------------------
    print(f"\n{len(inscriptions)} inscription(s) retenue(s), réparties ainsi :\n")
    vides = []
    for dossier, membres in mapping.items():
        jeu = dossier.removeprefix("games/2026/").rstrip("/")
        if membres:
            print(f"  {jeu:<18} {', '.join(membres)}")
        else:
            vides.append(jeu)
    if vides:
        print(f"\n  Équipes encore vides ({len(vides)}) : {', '.join(vides)}")
        print("  Leurs membres seront bloqués par le robot tant qu'ils ne se")
        print("  seront pas inscrits. Relancez ce script après leur inscription.")

    perdus = sorted(
        {m for membres in ancien.values() for m in membres}
        - {m for membres in mapping.values() for m in membres}
    )
    if perdus:
        print(f"\n  [ATTENTION] {len(perdus)} pseudo(s) présent(s) dans groupes.json")
        print("  mais sans demande d'inscription correspondante. Ce script")
        print("  RECONSTRUIT le fichier : ils en disparaîtraient.")
        for pseudo in perdus:
            print(f"    - {pseudo}")

    # '--paginate' sans '--jq' concatene plusieurs tableaux JSON, ce qui n'est
    # plus du JSON valide : on demande donc directement les pseudos, un par ligne.
    deja = {
        ligne.strip().lower()
        for ligne in gh("api", f"repos/{DEPOT}/collaborators",
                        "--paginate", "--jq", ".[].login").splitlines()
        if ligne.strip()
    }
    a_inviter = [p for p in sorted(inscriptions) if p.lower() not in deja]
    print(f"\nInvitations à envoyer : {len(a_inviter)}")
    for pseudo in a_inviter:
        print(f"  + {pseudo}")

    if mapping == ancien and not a_inviter:
        print("\nTout est déjà à jour.")
        return

    if not args.appliquer:
        print("\n--- SIMULATION ---")
        print("Rien n'a été modifié. Relancez avec --appliquer pour agir.")
        return

    # --- Application ----------------------------------------------------
    cible.write_text(
        json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nÉcrit : {cible}")

    for pseudo in a_inviter:
        gh("api", "--method", "PUT",
           f"repos/{DEPOT}/collaborators/{pseudo}",
           "-f", "permission=push")
        print(f"  invitation envoyée à {pseudo}")

    print("\nIl reste à publier le fichier :")
    print(f'  cd "{racine}"')
    print("  git add .github/groupes.json")
    print('  git commit -m "Met a jour les equipes depuis les inscriptions"')
    print("  git push origin main")


if __name__ == "__main__":
    main()
