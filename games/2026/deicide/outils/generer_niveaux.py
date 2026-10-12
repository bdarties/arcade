#!/usr/bin/env python3
"""Génère une map d'EXEMPLE pour le niveau 2 (horizontal, centré sur le dash) et la map de l'arène du dernier combat.
Le niveau 2 « pour de vrai » est dessiné dans Tiled (assets/maps/niveau2.json, voir assets/maps/LISEZ-MOI.md) : ce script écrit niveau2_genere.json
et ne touche jamais niveau2.json.

Pourquoi un script : on dessine le niveau avec du texte (colonnes, lignes, longueurs de trous) au lieu de poser des tuiles à la main.
Le script VÉRIFIE que chaque trou se franchit (voir verifier_trou) : si un trou est trop grand, il s'arrête avec une erreur.
Les fichiers produits sont des maps Tiled normales (même format et mêmes tuiles que niveau1.json) : on peut les rouvrir dans Tiled pour les retoucher.

Utilisation (depuis le dossier du jeu) :  python3 outils/generer_niveaux.py
"""
import json
import os

DOSSIER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "maps")
TUILE = 32

# --- les tuiles du tileset (mêmes numéros que dans niveau1.json) ---
FOND = 1332  # mur de briques sombre, derrière tout
SOL_GAUCHE, SOL, SOL_ALT, SOL_DROITE = 624, 625, 626, 627  # un sol d'une tuile d'épaisseur : bout gauche, milieu (deux variantes), bout droit
# --- ce que le robot sait faire (voir personnage.js) : sert à vérifier que les trous se franchissent ---
VITESSE = 260  # px/s, marche
PORTEE_SAUT = 288  # px : distance d'un saut à plat sans dash (≈ 9 tuiles)
PORTEE_SAUT_DASH = 440  # px : distance d'un saut avec un dash lancé au sommet (≈ 13,7 tuiles) ; on garde de la marge
HAUTEUR_SAUT = 180  # px (≈ 5,6 tuiles)
TROU_SANS_DASH_MAX = 8  # tuiles : un trou plus petit se saute sans dash
TROU_AVEC_DASH_MAX = 12  # tuiles : un trou plus grand n'est pas franchissable (marge de sécurité sur les 13,7 théoriques)
MONTEE_MAX = 3  # tuiles : de combien une plateforme peut être plus haute que celle d'où l'on saute, trou compris


def verifier_trou(nom, largeur, montee=0):
    """Arrête le script si un trou ne peut pas être franchi."""
    assert largeur <= TROU_AVEC_DASH_MAX, f"{nom} : trou de {largeur} tuiles, maximum {TROU_AVEC_DASH_MAX} (saut + dash)"
    assert montee <= MONTEE_MAX, f"{nom} : montée de {montee} tuiles, maximum {MONTEE_MAX}"
    assert montee * TUILE <= HAUTEUR_SAUT, f"{nom} : montée trop haute pour un saut"


class Niveau:
    def __init__(self, largeur, hauteur):
        self.l, self.h = largeur, hauteur
        self.fond = [[0] * largeur for _ in range(hauteur)]
        self.fond2 = [[0] * largeur for _ in range(hauteur)]
        self.jeu = [[0] * largeur for _ in range(hauteur)]
        self.objets = {"orc": [], "lumière": [], "archer": [], "mage": [], "lanterne": [], "depart": [], "fin": [], "faisceau": []}
        self.prochain_id = 1

    def remplir_fond(self, ligne_min=0, ligne_max=None):
        ligne_max = self.h - 1 if ligne_max is None else ligne_max
        for r in range(ligne_min, ligne_max + 1):
            for c in range(self.l):
                self.fond[r][c] = FOND
                self.fond2[r][c] = FOND

    def plateforme(self, c0, c1, ligne):
        """Un sol d'une tuile d'épaisseur de la colonne c0 à c1 (comprises), sur la ligne donnée."""
        for c in range(c0, c1 + 1):
            if c == c0:
                t = SOL_GAUCHE
            elif c == c1:
                t = SOL_DROITE
            else:
                t = SOL if c % 3 else SOL_ALT
            self.jeu[ligne][c] = t

    def objet(self, calque, colonne, ligne_pieds, decalage_x=0):
        """Pose un ennemi, une lanterne... : (colonne, ligne) = la case où il a les pieds (son sol est la ligne en dessous)."""
        self.objets[calque].append((colonne * TUILE + TUILE // 2 + decalage_x, ligne_pieds * TUILE + TUILE))

    def en_json(self, modele):
        calques = []
        ids = {"Background and background": 5, "Background": 2, "Gameplay": 1}
        for nom, grille in (("Background and background", self.fond2), ("Background", self.fond), ("Gameplay", self.jeu)):
            calques.append({"id": ids[nom], "name": nom, "type": "tilelayer", "width": self.l, "height": self.h, "x": 0, "y": 0, "opacity": 1, "visible": True,
                            "data": [t for ligne in grille for t in ligne]})
        ids_objets = {"orc": 7, "lumière": 10, "archer": 8, "mage": 9, "lanterne": 6, "depart": 11, "fin": 12, "faisceau": 13}
        for nom in ("orc", "lumière", "archer", "mage", "lanterne", "depart", "fin", "faisceau"):
            objets = []
            for (x, y) in self.objets[nom]:
                objets.append({"id": self.prochain_id, "name": "", "type": "", "x": float(x), "y": float(y), "width": 0.0, "height": 0.0, "rotation": 0, "visible": True, "point": True, "properties": []})
                self.prochain_id += 1
            calques.append({"id": ids_objets[nom], "name": nom, "type": "objectgroup", "draworder": "topdown", "x": 0, "y": 0, "opacity": 1, "visible": True, "objects": objets})
        carte = {k: modele[k] for k in ("compressionlevel", "infinite", "orientation", "renderorder", "tiledversion", "version", "tileheight", "tilewidth", "type", "tilesets")}
        carte.update({"width": self.l, "height": self.h, "layers": calques, "nextlayerid": 14, "nextobjectid": self.prochain_id})
        return carte


# =====================================================================================================================
# NIVEAU 2 : horizontal, 280 colonnes (8 960 px), 24 lignes. Le sol principal est sur la ligne SOL_LIGNE.
# =====================================================================================================================
LARGEUR_N2, HAUTEUR_N2 = 280, 24
SOL_LIGNE = 20  # le sol principal (le haut du sol est à y = 640 px)
FAISCEAUX_NIVEAU2 = [196, 202, 208, 214, 220, 226]  # les colonnes des faisceaux de lumière (lues par faisceaux.js)


def niveau2(modele):
    n = Niveau(LARGEUR_N2, HAUTEUR_N2)
    n.remplir_fond(0, 22)  # les 2 dernières lignes restent vides : c'est le vide, où l'on tombe

    # 1. DÉPART (colonnes 0-45) : on apprend à marcher, tirer et sauter un petit trou ---------------------------------
    n.plateforme(0, 31, SOL_LIGNE)
    verifier_trou("départ", 5)
    n.plateforme(37, 52, SOL_LIGNE)
    n.plateforme(41, 45, SOL_LIGNE - 3)  # une petite plateforme à sauter
    n.objet("archer", 22, SOL_LIGNE - 1)
    n.objet("archer", 47, SOL_LIGNE - 1)
    n.objet("lanterne", 12, SOL_LIGNE - 1)

    # 2. LES TROUS DE DASH (colonnes 53-100) : trois trous de 12 tuiles, trop larges pour un simple saut ----------------
    # chaque plateforme est un peu plus haute ou plus basse que la précédente ; la lanterne éclaire la suivante pour qu'on la voie
    plateformes = [  # (première colonne, dernière colonne, ligne)
        (65, 70, SOL_LIGNE),
        (83, 88, SOL_LIGNE - 2),
        (101, 108, SOL_LIGNE),
    ]
    precedente_fin, precedente_ligne = 52, SOL_LIGNE
    for (a, b, ligne) in plateformes:
        trou = a - precedente_fin - 1
        verifier_trou(f"trou de dash {a}", trou, max(0, precedente_ligne - ligne))
        assert trou >= TROU_SANS_DASH_MAX + 1, f"trou de dash {a} : {trou} tuiles, un saut sans dash suffirait"
        n.plateforme(a, b, ligne)
        precedente_fin, precedente_ligne = b, ligne
    n.objet("lanterne", 67, SOL_LIGNE - 1)
    n.objet("lanterne", 85, SOL_LIGNE - 3)
    n.objet("archer", 105, SOL_LIGNE - 1)

    # 3. L'ESCALIER DE DASH (colonnes 109-150) : on monte puis on redescend, des trous de 11 tuiles -------------------
    escalier = [  # (première colonne, dernière colonne, ligne)
        (120, 124, SOL_LIGNE - 2),
        (136, 140, SOL_LIGNE - 4),
        (152, 156, SOL_LIGNE - 6),
        (168, 172, SOL_LIGNE - 4),
        (184, 188, SOL_LIGNE - 2),
    ]
    precedente_fin, precedente_ligne = 108, SOL_LIGNE
    for (a, b, ligne) in escalier:
        trou = a - precedente_fin - 1
        verifier_trou(f"escalier {a}", trou, max(0, precedente_ligne - ligne))
        n.plateforme(a, b, ligne)
        precedente_fin, precedente_ligne = b, ligne
    n.objet("mage", 154, SOL_LIGNE - 7)  # le mage garde le sommet
    n.objet("lanterne", 138, SOL_LIGNE - 5)
    n.objet("lanterne", 170, SOL_LIGNE - 5)

    # 4. LES FAISCEAUX (colonnes 189-229) : un sol continu, traversé par des rayons de lumière qui s'allument à tour de rôle -----
    n.plateforme(189, 279, SOL_LIGNE)  # ce sol continue sous la salle de combat et jusqu'à la sortie
    n.objet("orc", 193, SOL_LIGNE - 1)
    n.objet("archer", 229, SOL_LIGNE - 1)
    assert all(189 < c < 230 for c in FAISCEAUX_NIVEAU2)
    # (les faisceaux eux-mêmes sont dessinés par faisceaux.js)

    # 5. LE DÉPART, LA FIN ET LES FAISCEAUX (points lus par le jeu : calques "depart", "fin" et "faisceau")
    n.objet("depart", 3, SOL_LIGNE - 1)  # (la case où le robot a les pieds)
    n.objet("fin", 277, SOL_LIGNE - 1)
    for colonne in FAISCEAUX_NIVEAU2:
        n.objet("faisceau", colonne, SOL_LIGNE - 1)
    return n


# =====================================================================================================================
# ARÈNE DU DERNIER COMBAT (le Soldat de la Lumière enragé, v2) : 40 colonnes (un écran), 24 lignes. Le sol est sur la ligne 22.
# =====================================================================================================================
def arene_dieu(modele):
    n = Niveau(40, 24)
    n.remplir_fond(0, 23)
    n.plateforme(0, 39, 22)
    for (a, b) in ((6, 10), (18, 22), (30, 34)):  # trois plateformes à 4 lignes au-dessus du sol, comme l'arène du Soldat
        n.plateforme(a, b, 18)
    return n


if __name__ == "__main__":
    with open(os.path.join(DOSSIER, "niveau1.json"), encoding="utf-8") as f:
        modele = json.load(f)
    for nom, fabrique in (("niveau2_genere.json", niveau2), ("arene_dieu.json", arene_dieu)):
        carte = fabrique(modele).en_json(modele)
        with open(os.path.join(DOSSIER, nom), "w", encoding="utf-8") as f:
            json.dump(carte, f, ensure_ascii=False, separators=(",", ":"))
        print("écrit :", nom, f"({carte['width']} x {carte['height']} tuiles)")
