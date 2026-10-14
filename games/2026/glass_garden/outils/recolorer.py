#!/usr/bin/env python3
"""
Fabrique les images RECOLORÉES d'un monde : l'herbe, la pierre et l'eau du tileset de construction (tileset_garden.png)
et l'eau animée (water_spritesheet.png). Les originaux ne sont jamais touchés ; les copies sont écrites à côté, avec le
suffixe du monde (par exemple tileset_garden_reve.png).

Contrairement à une teinte (qui multiplie les couleurs : le vert ne devient jamais rose), ici chaque famille reçoit une
TEINTE et une SATURATION imposées, et sa luminosité d'origine est remise à l'échelle dans [lmin, lmax] : le relief
(les ombres et les reflets des tuiles) est conservé, les couleurs changent vraiment. L'échelle est calculée une seule fois
par famille, sur toutes ses tuiles (sinon deux tuiles voisines n'auraient pas la même couleur de fond : une couture).

Les familles (herbe, pierre, eau) sont celles de TILE_GROUPS dans src/utils/constants.js (numéros de tuile à partir de 1).
Les tuiles de décor (tileset_deco), le joueur et le miroir ne sont pas recolorés.

Usage :
    python3 outils/recolorer.py            écrit les images de tous les mondes de MONDES ci-dessous
"""
import colorsys, os
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TUILES = os.path.join(RACINE, 'assets', 'images', 'tilesets', 'tileset_garden.png')
EAU = os.path.join(RACINE, 'assets', 'images', 'sprites', 'water_spritesheet.png')
T = 32
COLONNES = 8                                    # tileset_garden : 8 colonnes de tuiles
GROUPES = {                                     # comme TILE_GROUPS (constants.js) : intervalles de numéros de tuile
    'stone': [(1, 3), (9, 9), (17, 18)],
    'grass': [(4, 8), (10, 10), (12, 14), (20, 22)],
    'water': [(25, 27)],
}

# Un monde = un suffixe de fichier et, par famille, (teinte 0-1, saturation 0-1, luminosité min, luminosité max)
MONDES = {
    'reve': {                                   # rose pâle, pierre lilas clair, eau bleue : trois valeurs bien distinctes
        'grass': (0.93, 0.50, 0.74, 0.88),
        'stone': (0.72, 0.20, 0.72, 0.96),
        'water': (0.56, 0.60, 0.62, 0.84),
    },
    'automne': {                                # olive chaud, pierre beige, eau bleu ardoise sombre
        'grass': (0.14, 0.42, 0.30, 0.56),
        'stone': (0.09, 0.20, 0.48, 0.84),
        'water': (0.58, 0.35, 0.20, 0.40),
    },
    'apocalypse': {                             # poussière jaunâtre, pierre grise, eau verte toxique
        'grass': (0.15, 0.22, 0.30, 0.52),
        'stone': (0.10, 0.10, 0.38, 0.66),
        'water': (0.24, 0.55, 0.20, 0.42),
    },
    'magie': {                                  # bleu nuit, pierre gris-bleu, eau turquoise lumineuse
        'grass': (0.62, 0.32, 0.18, 0.36),
        'stone': (0.60, 0.20, 0.50, 0.82),
        'water': (0.48, 0.65, 0.36, 0.64),
    },
    'nuit': {                                   # vert sapin nocturne, pierre gris-bleu, eau bleu nuit
        'grass': (0.42, 0.30, 0.12, 0.28),
        'stone': (0.58, 0.18, 0.34, 0.60),
        'water': (0.62, 0.50, 0.14, 0.34),
    },
}


def luminosites(im):
    return [colorsys.rgb_to_hls(r / 255, g / 255, b / 255)[1] for r, g, b, a in im.get_flattened_data() if a]


def recolorer(im, reglage, echelle):
    """Copie de im recolorée : teinte et saturation imposées, luminosité d'origine remise à l'échelle."""
    hue, sat, lmin, lmax = reglage
    lo, hi = echelle
    sortie = im.copy()
    px = sortie.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            l = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)[1]
            t = (l - lo) / (hi - lo) if hi > lo else 0.5
            R, G, B = colorsys.hls_to_rgb(hue, lmin + t * (lmax - lmin), sat)
            px[x, y] = (round(R * 255), round(G * 255), round(B * 255), a)
    return sortie


def tuiles_de(im, famille):
    """Les numéros (à partir de 1) et les images des tuiles d'une famille."""
    for a, b in GROUPES[famille]:
        for n in range(a, b + 1):
            c, l = (n - 1) % COLONNES, (n - 1) // COLONNES
            yield n, im.crop((c * T, l * T, c * T + T, l * T + T))


def fabriquer(suffixe, reglages):
    base = Image.open(TUILES).convert('RGBA')
    eau = Image.open(EAU).convert('RGBA')
    sortie = base.copy()
    for famille, reglage in reglages.items():
        tuiles = list(tuiles_de(base, famille))
        lums = [l for _, t in tuiles for l in luminosites(t)]
        if famille == 'water':                                  # l'eau fixe et l'eau animée doivent avoir la même échelle
            lums += luminosites(eau)
        echelle = (min(lums), max(lums))
        for n, t in tuiles:
            c, l = (n - 1) % COLONNES, (n - 1) // COLONNES
            sortie.paste(recolorer(t, reglage, echelle), (c * T, l * T))
        if famille == 'water':
            eau = recolorer(eau, reglage, echelle)
    chemins = (TUILES.replace('.png', f'_{suffixe}.png'), EAU.replace('.png', f'_{suffixe}.png'))
    sortie.save(chemins[0])
    eau.save(chemins[1])
    return chemins


if __name__ == '__main__':
    for suffixe, reglages in MONDES.items():
        for chemin in fabriquer(suffixe, reglages):
            print('écrit', os.path.relpath(chemin, RACINE))
