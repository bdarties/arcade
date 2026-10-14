"""
Logique commune de la forêt en quinconce (utilisée par arbres.py et foret.py).

La forêt est faite d'arbres posés sur un quadrillage : l'origine d'un arbre (son coin haut-gauche, en cases) est (tx, ty)
avec tx et ty de même parité, ce qui donne une période de 2 cases en largeur, 1 en hauteur, une rangée sur deux
décalée d'une case. Chaque arbre fait 3 x 3 cases. Les arbres des rangées du bas passent devant ceux du haut.

Une case de la carte n'est touchée que par 5 arbres au plus : son contenu ne dépend que de LEUR PRÉSENCE (un petit
nombre binaire) et de la parité de ses coordonnées. On calcule donc une table (parité, présence) -> tuile, commune
aux 5 mondes (même table, donc même carte pour tous les mondes : on change seulement la feuille).
"""
import hashlib
from PIL import Image

T = 32


def decalages(px, py):
    """Les arbres qui touchent une case (X, Y) de parités (px, py), en décalages (dx, dy) de leur origine par rapport
    à la case, dans l'ordre de dessin (rangée du haut d'abord)."""
    res = []
    for dy in (-2, -1, 0):
        for dx in (-2, -1, 0):
            if (px + dx - ((py + dy) % 2)) % 2 == 0:
                res.append((dx, dy))
    return res


def tuile_pour(arbre, px, py, masque):
    """Le contenu de la tuile quand seuls les arbres du masque sont présents (arbre : image 96 x 96 d'un monde)."""
    im = Image.new('RGBA', (T, T), (0, 0, 0, 0))
    for i, (dx, dy) in enumerate(decalages(px, py)):
        if masque >> i & 1:
            im.alpha_composite(arbre.crop((-dx * T, -dy * T, -dx * T + T, -dy * T + T)))
    return im


def table(arbres):
    """Construit la table commune à tous les mondes. arbres : {monde: image 96 x 96}.
    Renvoie (cles, index) : cles = liste ordonnée des (px, py, masque) qui ont une tuile (une par signature distincte),
    index = {(px, py, masque): numéro de tuile ou None si la case est vide dans tous les mondes}."""
    signatures, cles, index = {}, [], {}
    candidats = []
    for py in (0, 1):
        for px in (0, 1):
            for masque in range(1 << len(decalages(px, py))):
                candidats.append((bin(masque).count('1'), px, py, masque))
    for _, px, py, masque in sorted(candidats):
        sig = tuple(hashlib.md5(tuile_pour(a, px, py, masque).tobytes()).hexdigest() for _, a in sorted(arbres.items()))
        vide = all(tuile_pour(a, px, py, masque).getchannel('A').getbbox() is None for a in arbres.values())
        if vide:
            index[(px, py, masque)] = None
        elif sig in signatures:
            index[(px, py, masque)] = signatures[sig]
        else:
            signatures[sig] = len(cles)
            index[(px, py, masque)] = len(cles)
            cles.append((px, py, masque))
    return cles, index


# ---------------------------------------------------------------------------------------------------------------
# L'ÉCHANTILLON DE FORÊT : au lieu de ranger des fragments, on range de VRAIS ARBRES. L'échantillon est une petite
# forêt (arbres isolés, groupes, bloc, masse dense) dessinée arbre par arbre : toutes les tuiles de l'autotuile y
# apparaissent à leur place naturelle, et on lit l'ensemble comme des arbres. Le script retrouve chaque tuile à sa
# PREMIÈRE apparition dans l'échantillon.
# ---------------------------------------------------------------------------------------------------------------
LARGEUR_BLOC, HAUTEUR_BLOC = 14, 7
EXEMPLE_ARBRES = [[0, 2], [0, 4], [2, 0], [2, 2], [2, 4], [4, 2], [6, 4], [7, 1], [8, 2], [9, 1], [10, 0], [10, 2], [10, 4], [11, 1], [11, 3]]


def exemple_image(arbre):
    """L'échantillon d'un monde : les arbres posés l'un après l'autre, rangée du haut d'abord."""
    im = Image.new('RGBA', (LARGEUR_BLOC * T, HAUTEUR_BLOC * T), (0, 0, 0, 0))
    for tx, ty in sorted(EXEMPLE_ARBRES, key=lambda a: (a[1], a[0])):
        im.alpha_composite(arbre, (tx * T, ty * T))
    return im


def exemple_positions(index):
    """positions[k] = (colonne, ligne) de la première case de l'échantillon qui montre la tuile k.
    Lève une erreur si une tuile de l'autotuile n'apparaît pas dans l'échantillon."""
    existe = set(map(tuple, EXEMPLE_ARBRES))
    positions = {}
    for Y in range(HAUTEUR_BLOC):
        for X in range(LARGEUR_BLOC):
            px, py = X % 2, Y % 2
            masque = 0
            for i, (dx, dy) in enumerate(decalages(px, py)):
                if (X + dx, Y + dy) in existe:
                    masque |= 1 << i
            k = index.get((px, py, masque))
            if k is not None and k not in positions:
                positions[k] = (X, Y)
    manquantes = sorted({k for k in index.values() if k is not None} - set(positions))
    if manquantes:
        raise ValueError(f"l'échantillon de forêt ne contient pas les tuiles {manquantes} : modifie EXEMPLE_ARBRES")
    return positions


def arbres_presents(zone, largeur, hauteur):
    """Quels arbres existent ? Un arbre d'origine (tx, ty) existe si la case centrale de son empreinte, (tx+1, ty+1),
    est dans la zone dessinée. Hors de la carte, on prolonge le bord (clamp) : la forêt continue au-delà de la carte."""
    def peinte(cx, cy):
        return (min(max(cx, 0), largeur - 1), min(max(cy, 0), hauteur - 1)) in zone
    return lambda tx, ty: (tx - (ty % 2)) % 2 == 0 and peinte(tx + 1, ty + 1)


def completer_coins(arbres):
    """Complète les COINS DU BAS de la forêt. Avec le quinconce, les rangées du dessus dépassent d'une demi-case
    au bout de la rangée du bas : le coin bas-gauche ou bas-droit reste ouvert. Règle : si un arbre A a UNE de ses deux
    diagonales du bas (bas-gauche, bas-droite) et pas l'autre, et que l'arbre manquant serait lui-même dans la rangée
    du bas (rien sous lui), on le plante. Pas de cascade : on ne complète que la dernière rangée."""
    ajouts = set()
    for (tx, ty) in arbres:
        gauche, droite = (tx - 1, ty + 1), (tx + 1, ty + 1)
        for manquant, autre in ((gauche, droite), (droite, gauche)):
            if autre in arbres and manquant not in arbres:
                dessous = ((manquant[0] - 1, manquant[1] + 1), (manquant[0] + 1, manquant[1] + 1))
                if not any(d in arbres for d in dessous):
                    ajouts.add(manquant)
    return arbres | ajouts


def arbres_zone(zone, largeur, hauteur, marge=3):
    """L'ensemble des arbres de la forêt dessinée (coins du bas complétés), marge comprise : la forêt continue
    au-delà du bord de la carte."""
    existe = arbres_presents(zone, largeur, hauteur)
    arbres = {(tx, ty) for ty in range(-marge - 2, hauteur + marge + 1) for tx in range(-marge - 2, largeur + marge + 1)
              if existe(tx, ty)}
    return completer_coins(arbres)


def couche(zone, largeur, hauteur, index):
    """Pour chaque case de la carte, le numéro de tuile du bloc (ou None si vide)."""
    arbres = arbres_zone(zone, largeur, hauteur)
    sortie = [[None] * largeur for _ in range(hauteur)]
    for Y in range(hauteur):
        for X in range(largeur):
            px, py = X % 2, Y % 2
            masque = 0
            for i, (dx, dy) in enumerate(decalages(px, py)):
                if (X + dx, Y + dy) in arbres:
                    masque |= 1 << i
            sortie[Y][X] = index.get((px, py, masque))
    return sortie
