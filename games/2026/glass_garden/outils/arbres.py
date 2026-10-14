#!/usr/bin/env python3
"""
Génère les variantes d'arbre à partir des arbres ENTIERS de la feuille (éléments de type « arbre » dans
assets/tilesets/deco.json). Rien n'est redessiné : on ne fait que découper et recomposer ton dessin.

Pour chaque arbre (3 x 3 tuiles, 96 x 96 pixels), on produit :
    cime         l'arbre sans son tronc (3 x 3) : à poser dans le calque qui passe DEVANT le joueur
    base         le tronc et les racines (3 x 1) : à poser sous la cime, dans le calque qui BLOQUE le joueur
                 (cime + base superposées = exactement l'arbre d'origine)
    colle_haut   }  trois pièces pour des arbres COLLÉS en hauteur (murs de forêt), cimes qui se recouvrent :
    colle_milieu }  haut (2 lignes), puis le milieu (1 ligne) autant de fois qu'on veut, puis le bas (2 lignes)
    colle_bas    }
    foret_auto   l'AUTOTUILE COMPLÈTE de forêt dense en quinconce : 34 tuiles (échantillon de 14 x 7), communes aux 5 mondes,
                 qui couvrent TOUTES les formes de forêt (bords, coins, creux, arbres isolés sur le quadrillage).
                 Elles sont rangées sous la forme d'un ÉCHANTILLON DE FORÊT (14 x 7 cases, 15 vrais arbres : isolés,
                 en groupe, en bloc, en masse dense) : on y lit des arbres, pas des fragments. L'échantillon est défini
                 dans outils/foret_logique.py (EXEMPLE_ARBRES) ; chaque tuile y est retrouvée à sa première apparition.
                 Le choix des tuiles est fait par outils/foret.py à partir d'une zone dessinée dans Tiled. La table
                 « situation -> tuile » est dans assets/tilesets/foret.json.
    demi_haut    arbre coupé par le haut de la carte (on voit sa moitié basse)
    demi_bas     arbre coupé par le bas de la carte (on voit sa moitié haute)
    demi_gauche  arbre coupé par le bord droit de la carte (on voit sa moitié gauche)
    demi_droite  arbre coupé par le bord gauche de la carte (on voit sa moitié droite)

Usage :
    python3 outils/arbres.py generer      écrit les images dans assets/tilesets/sources/arbres/ et les ajoute au manifeste
    python3 outils/tileset.py reconstruire --appliquer      les place dans la feuille (et renumérote les cartes)

Relancer « generer » régénère les variantes (si tu retouches un arbre entier) : elles remplacent les anciennes.
"""
import json, os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import foret_logique as FL

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFESTE = os.path.join(RACINE, 'assets', 'tilesets', 'deco.json')
DOSSIER = os.path.join('assets', 'tilesets', 'sources', 'arbres')
T = 32
Y_CIME = 77            # la cime s'arrête à y = 77 : en dessous, c'est le tronc visible (même découpe pour les 5 mondes)
PERIODE = 32           # décalage entre deux arbres collés en hauteur (1 tuile) : les cimes se recouvrent
Y_MILIEU, X_MILIEU = 48, 48    # lignes de coupe des demi-arbres (le centre de la cime)
FOND_ANGLE = -40               # de combien l'arbre du fond est remonté, pour que son tronc apparaisse dans le creux


def transparent(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))


def cime(t):
    im = t.copy()
    im.paste(transparent(96, 96 - Y_CIME), (0, Y_CIME))
    return im


def base(t):
    im = transparent(96, 32)
    bas = t.crop((0, Y_CIME, 96, 96))
    im.alpha_composite(bas, (0, Y_CIME - 64))
    return im


def angle(t):
    """Deux arbres côte à côte (cimes tangentes) et un troisième plus haut, derrière, centré sur le creux."""
    toile = transparent(160, 160)
    toile.alpha_composite(t, (32, 32 + FOND_ANGLE))      # l'arbre du fond d'abord : les deux de devant le recouvrent
    toile.alpha_composite(t, (0, 32)); toile.alpha_composite(t, (64, 32))
    return toile.crop((32, 64, 128, 96))                  # la ligne de tuiles qui contient le creux, centrée sur lui


def jonction(t):
    """Deux arbres côte à côte (période de 2 tuiles) : seule la colonne du milieu change, c'est le mélange des deux."""
    toile = transparent(160, 96)
    toile.alpha_composite(t, (0, 0)); toile.alpha_composite(t, (64, 0))
    return toile.crop((64, 0, 96, 96))


def foret_ideale(t, rangees, arbres):
    """La forêt dense en quinconce, telle que le moteur la dessinerait avec l'arbre posé sur plusieurs couches :
    période de 2 tuiles en largeur et de 1 tuile en hauteur, une rangée sur deux décalée d'une tuile ; les rangées du
    bas passent devant celles du haut."""
    toile = transparent(64 * (arbres - 1) + 32 + 96, 32 * (rangees - 1) + 96)
    for r in range(rangees):
        for k in range(arbres):
            toile.alpha_composite(t, (k * 64 + (32 if r % 2 else 0), r * 32))
    return toile


def pile(t, n=6):
    hauteur = PERIODE * (n - 1) + 96
    toile = transparent(96, hauteur)
    for i in range(n):                       # les arbres du bas passent devant ceux du haut
        toile.alpha_composite(t, (0, i * PERIODE))
    return toile


def variantes(t):
    n = 6
    p = pile(t, n)
    demi_haut = transparent(96, 64);  demi_haut.alpha_composite(t.crop((0, Y_MILIEU, 96, 96)), (0, 0))
    demi_bas = transparent(96, 32);   demi_bas.alpha_composite(t.crop((0, Y_MILIEU - 32, 96, Y_MILIEU)), (0, 0))
    demi_gauche = transparent(64, 96); demi_gauche.alpha_composite(t.crop((0, 0, X_MILIEU, 96)), (64 - X_MILIEU, 0))
    demi_droite = transparent(64, 96); demi_droite.alpha_composite(t.crop((X_MILIEU, 0, 96, 96)), (0, 0))
    return {
        'cime': cime(t), 'base': base(t),
        'colle_haut': p.crop((0, 0, 96, 2 * PERIODE)),                          # 2 lignes
        'colle_milieu': p.crop((0, 2 * PERIODE, 96, 3 * PERIODE)),              # 1 ligne, à répéter
        'colle_bas': p.crop((0, n * PERIODE, 96, n * PERIODE + 2 * PERIODE)),   # 2 lignes, avec le tronc
        'demi_haut': demi_haut, 'demi_bas': demi_bas, 'demi_gauche': demi_gauche, 'demi_droite': demi_droite,
    }


def generer():
    with open(MANIFESTE, encoding='utf-8') as f:
        m = json.load(f)
    feuille = Image.open(os.path.join(RACINE, m['image'])).convert('RGBA')
    os.makedirs(os.path.join(RACINE, DOSSIER), exist_ok=True)
    for e in m['elements']:                      # anciennes pièces remplacées par le bloc de forêt
        if e['type'] in ('arbre_angle', 'arbre_jonction'):
            e['supprime'] = True
    m['elements'] = [e for e in m['elements'] if not (e.get('supprime') and 'rect' not in e)]
    for arbre in [e for e in m['elements'] if e['type'] == 'arbre']:
        c, l, w, h = arbre['rect']
        t = feuille.crop((c * T, l * T, (c + w) * T, (l + h) * T))
        for nom_v, im in variantes(t).items():
            nom = f"{arbre['nom']}_{nom_v}"
            chemin = os.path.join(DOSSIER, nom + '.png')
            im.save(os.path.join(RACINE, chemin))
            existant = next((e for e in m['elements'] if e['nom'] == nom), None)
            if existant: existant['source'] = chemin
            else: m['elements'].append({'nom': nom, 'monde': arbre['monde'], 'type': 'arbre_' + nom_v, 'source': chemin})
    # l'autotuile de forêt : une table commune aux mondes, un bloc de tuiles par monde
    arbres = {}
    for arbre in [e for e in m['elements'] if e['type'] == 'arbre']:
        c, l, w, h = arbre['rect']
        arbres[arbre['monde']] = feuille.crop((c * T, l * T, (c + w) * T, (l + h) * T))
    cles, index = FL.table(arbres)
    positions = FL.exemple_positions(index)
    for e in m['elements']:                      # l'ancien bloc rectangulaire est remplacé par l'autotuile
        if e['type'] == 'arbre_foret': e['supprime'] = True
    m['elements'] = [e for e in m['elements'] if not (e.get('supprime') and 'rect' not in e)]
    for monde, im in arbres.items():
        nom = f'arbre_{monde}_foret_auto'
        chemin = os.path.join(DOSSIER, nom + '.png')
        FL.exemple_image(im).save(os.path.join(RACINE, chemin))
        existant = next((e for e in m['elements'] if e['nom'] == nom), None)
        if existant: existant['source'] = chemin
        else: m['elements'].append({'nom': nom, 'monde': monde, 'type': 'arbre_foret_auto', 'source': chemin})
    with open(os.path.join(RACINE, 'assets', 'tilesets', 'foret.json'), 'w', encoding='utf-8') as f:
        json.dump({'bloc': [FL.LARGEUR_BLOC, FL.HAUTEUR_BLOC], 'nb_tuiles': len(cles),
                   'exemple_arbres': [list(a) for a in FL.EXEMPLE_ARBRES],
                   'positions': {str(k): list(positions[k]) for k in range(len(cles))},
                   'cles': [list(c) for c in cles],
                   'index': [[px, py, mq, k] for (px, py, mq), k in sorted(index.items())]}, f, indent=1)
        f.write('\n')
    with open(MANIFESTE, 'w', encoding='utf-8') as f:
        json.dump(m, f, ensure_ascii=False, indent=1); f.write('\n')
    print(f"Variantes générées dans {DOSSIER}. Lance ensuite : python3 outils/tileset.py reconstruire --appliquer")


if __name__ == '__main__':
    if sys.argv[1:] == ['generer']: generer()
    else: sys.exit(__doc__)
