#!/usr/bin/env python3
"""
Génère les tuiles de CHEMIN DE TERRE (à superposer au sol : seul le chemin est dessiné, le reste est transparent).

Chaque jeu fait 16 tuiles de 32 x 32 : toutes les combinaisons de côtés ouverts. Le numéro d'une tuile est un masque de bits
N = 1, E = 2, S = 4, O = 8 (donc : 0 = plaque isolée, 1 = bout de chemin venant du nord, 5 = ligne droite verticale,
3 = virage nord-est, 7 = T ouvert au nord, à l'est et au sud, 15 = croisement...). Dans la planche de 4 x 4, la tuile k est
à la colonne k % 4 et à la ligne k // 4 : retrouver la bonne tuile d'un chemin, c'est lire ce numéro.

Chaque tuile est une « pièce de tuyau » : le chemin s'ouvre exactement au MILIEU des côtés connectés, coupé net contre le bord,
avec la même largeur partout (14 pixels). Le bord irrégulier est calculé avec une fonction PÉRIODIQUE (période 32), donc deux
tuiles voisines se raccordent sans couture. Les tuiles sont testées : pour chaque paire de tuiles qui se touchent, le bord
du chemin ne bouge pas de plus d'un pixel d'une tuile à l'autre.

Variations (comme sur la planche de référence) : discret, standard, pale, caillouteux, herbeux.

Usage :
    python3 outils/chemins.py            écrit assets/tilesets/sources/chemins/chemin_<variation>.png (une planche 128 x 128 chacune)
"""
import math, os, random, sys
import numpy as np
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'assets', 'tilesets', 'sources', 'chemins')
T = 32
PAD = 16                  # marge autour de la tuile pendant le calcul (pour que les bords soient corrects)
N = T + 2 * PAD
CENTRE = PAD + T // 2     # le milieu de la tuile, dans la zone de calcul
DEMI = 7                  # demi-largeur du chemin : 14 pixels de large
NORD, EST, SUD, OUEST = 1, 2, 4, 8


def hx(s):
    s = s.lstrip('#')
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), 255)


# Couleurs relevées sur la planche de référence (corps, liseré, grains) ; aucune n'est noire.
VARIATIONS = {
    'discret':     dict(corps='#756566', rim='#4a3e4e', grains=['#5f5260', '#8a7b7e'], trous=0.30),
    'standard':    dict(corps='#756566', rim='#4a3e4e', grains=['#5f5260', '#8a7b7e', '#9a8d94']),
    'pale':        dict(corps='#ab9aa0', rim='#6a5b68', grains=['#968790', '#bfb1b6', '#c9bcc0']),
    'caillouteux': dict(corps='#756566', rim='#4a3e4e', grains=['#5f5260', '#8a7b7e'], cailloux=['#a9a6b8', '#8b9bb4']),
    'herbeux':     dict(corps='#756566', rim='#4a3e4e', grains=['#5f5260', '#8a7b7e'], herbe=['#3e8948', '#265c42']),
}

# Chemins du RÊVE (pierre de nuage) : un liseré blanc bosselé de 2 à 3 pixels autour d'un corps lilas clair, des petits galets
# lilas, quelques éclats. Couleurs relevées sur la planche de référence. Les fichiers s'appellent chemin_reve_<variation>.png.
# Le liseré « bosselé » suit une fonction périodique (période 32) dans les deux sens : il se raccorde entre les tuiles.
_NUAGE = dict(style='nuage', corps='#e9cff0', corps2='#efd8f4', liseré='#a289b2', blanc='#fdf0fb', blanc2='#fcebfa',
              galet='#d6bae4', galet_clair='#f6e9fb', galet_fonce='#a289b2', eclat='#ffffff', eclat2='#fff3b0')
VARIATIONS.update({
    'reve_discret':     dict(_NUAGE, corps='#ecd6f1', corps2='#efdcf3', galets=2, eclats=1),
    'reve_standard':    dict(_NUAGE, galets=4, eclats=2),
    'reve_pale':        dict(_NUAGE, corps='#fbeef9', corps2='#fdf3fb', blanc='#ffffff', blanc2='#fdf6fc', liseré='#8b72b5',
                             galet='#e9d3f3', galets=3, eclats=3),
    'reve_caillouteux': dict(_NUAGE, galets=7, eclats=1, galet='#a9c4f0', galet_clair='#dbe8fc', galet_fonce='#7f9bd0'),
    'reve_fleuri':      dict(_NUAGE, galets=2, eclats=1, fleurs=['#f48fb8', '#fdf3b0', '#ffffff']),
})


def bruit(x, phase):
    """Décalage entier (-1, 0 ou 1) du bord à la position x. PÉRIODIQUE de période 32 : x = 31 et x = 32 sont voisins."""
    v = (0.9 * np.sin(2 * np.pi * (x / T + phase)) + 0.55 * np.sin(2 * np.pi * (3 * x / T + 2 * phase + 0.3))
         + 0.4 * np.sin(2 * np.pi * (5 * x / T + phase * 1.7)))
    return np.rint(v * 0.8).astype(int)


def dilater(m, rayon):
    out = np.zeros_like(m)
    for dy in range(-rayon, rayon + 1):
        for dx in range(-rayon, rayon + 1):
            if dx * dx + dy * dy <= rayon * rayon + 1:
                out |= np.roll(np.roll(m, dy, 0), dx, 1)
    return out


def eroder(m, rayon):
    return ~dilater(~m, rayon)


def masque(k):
    """La forme du chemin (booléens N x N) pour le masque de côtés k."""
    yy, xx = np.mgrid[0:N, 0:N]
    xt, yt = (xx - PAD) % T, (yy - PAD) % T
    m = np.zeros((N, N), bool)
    if k == 0:
        m |= (xx - (CENTRE - 0.5)) ** 2 + (yy - (CENTRE - 0.5)) ** 2 <= 9.2 ** 2
    else:
        g, d = CENTRE - DEMI, CENTRE + DEMI
        if k & NORD: m |= (yy <= CENTRE) & (xx >= g + bruit(yt, 0.13)) & (xx < d + bruit(yt, 0.57))
        if k & SUD:  m |= (yy >= CENTRE) & (xx >= g + bruit(yt, 0.13)) & (xx < d + bruit(yt, 0.57))
        if k & OUEST: m |= (xx <= CENTRE) & (yy >= g + bruit(xt, 0.29)) & (yy < d + bruit(xt, 0.71))
        if k & EST:  m |= (xx >= CENTRE) & (yy >= g + bruit(xt, 0.29)) & (yy < d + bruit(xt, 0.71))
        m |= (xx - (CENTRE - 0.5)) ** 2 + (yy - (CENTRE - 0.5)) ** 2 <= (DEMI + 0.8) ** 2     # le moyeu arrondit les virages et les bouts
    fermee = eroder(dilater(m, 3), 3)                                                      # arrondit les angles rentrants
    return fermee | m


def profondeur(m, maxi=4):
    """Distance (en pixels, 4 voisins) jusqu'au bord du chemin, plafonnée à `maxi`."""
    p = np.zeros(m.shape, int); cur = m.copy()
    for i in range(1, maxi + 1):
        p[cur] = i; cur = eroder(cur, 1) & cur
    return p


def bosse(xt, yt):
    """Valeur -1..1, PÉRIODIQUE (32) dans les deux sens : décide où le liseré blanc gagne ou perd un pixel."""
    return np.sin(2 * np.pi * (3 * xt / T + 0.2)) * np.sin(2 * np.pi * (2 * yt / T + 0.45)) + 0.6 * np.sin(2 * np.pi * (5 * (xt + yt) / T))


def tuile_nuage(k, nom, graine):
    v = VARIATIONS[nom]
    rng = random.Random(graine * 131 + k)
    m = masque(k)
    prof = profondeur(m, 8)
    yy, xx = np.mgrid[0:N, 0:N]
    b = bosse((xx - PAD) % T, (yy - PAD) % T)
    img = np.zeros((N, N, 4), np.uint8)
    corps, corps2, blanc, blanc2 = hx(v['corps']), hx(v['corps2']), hx(v['blanc']), hx(v['blanc2'])
    img[m] = corps
    for (y, x) in np.argwhere(m & (prof >= 4)):                     # le corps a deux tons, en petites plaques
        if (x // 2 + y // 3) % 3 == 0: img[y, x] = corps2
    epais = 2 + (b > 0.25)                                           # le liseré blanc : 2 pixels, 3 là où la bosse est positive
    blanc_zone = m & (prof >= 2) & (prof <= epais + 1)
    img[blanc_zone] = blanc
    for (y, x) in np.argwhere(blanc_zone):
        if (x + 2 * y) % 5 == 0: img[y, x] = blanc2
    img[m & (prof == 1)] = hx(v['liseré'])                           # le trait extérieur, 1 pixel
    loin_bord = lambda y, x: PAD + 3 <= y < PAD + T - 3 and PAD + 3 <= x < PAD + T - 3
    profonds = [(y, x) for (y, x) in np.argwhere(prof >= 5) if loin_bord(y, x)]
    rng.shuffle(profonds)
    galet, clair, fonce = hx(v['galet']), hx(v['galet_clair']), hx(v['galet_fonce'])
    forme = [(0, 1), (0, 2), (0, 3), (1, 0), (1, 1), (1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3)]     # un galet de 5 x 3
    pris = []
    for (y, x) in profonds:
        if len(pris) >= v['galets'] + (k % 2): break
        if any(abs(y - a) < 6 and abs(x - c) < 7 for a, c in pris): continue
        if all(y + dy < N and x + dx < N and m[y + dy, x + dx] and prof[y + dy, x + dx] >= 4 for dy, dx in forme):
            for dy, dx in forme: img[y + dy, x + dx] = galet
            for dy, dx in ((0, 1), (0, 2), (1, 1)): img[y + dy, x + dx] = clair                              # reflet en haut à gauche
            for dy, dx in ((2, 2), (2, 3), (1, 4)): img[y + dy, x + dx] = fonce                              # ombre en bas à droite
            pris.append((y, x))
    if 'fleurs' in v:                                                  # chemin fleuri : de minuscules fleurs en croix de 3 pixels
        rng.shuffle(profonds); fl = [hx(c) for c in v['fleurs']]; nb = 0
        for (y, x) in profonds:
            if nb >= 4 + k % 3: break
            if any(abs(y - a) < 6 and abs(x - c) < 6 for a, c in pris): continue
            if y + 2 < N and x + 2 < N and all(prof[y + dy, x + dx] >= 4 for dy, dx in ((0, 1), (1, 0), (1, 1), (1, 2), (2, 1))):
                couleur = rng.choice(fl[:2]); img[y, x + 1] = couleur; img[y + 1, x] = couleur; img[y + 1, x + 2] = couleur; img[y + 2, x + 1] = couleur
                img[y + 1, x + 1] = fl[1] if couleur is not fl[1] else fl[0]
                pris.append((y, x)); nb += 1
    eclats = [(y, x) for (y, x) in np.argwhere(prof >= 4) if loin_bord(y, x) and tuple(img[y, x][:3]) in (tuple(corps[:3]), tuple(corps2[:3]))]
    rng.shuffle(eclats)
    for (y, x), c in zip(eclats[:v['eclats'] + 1], (hx(v['eclat']), hx(v['eclat2']), hx(v['eclat']))):
        img[y, x] = c
    return Image.fromarray(img[PAD:PAD + T, PAD:PAD + T], 'RGBA')


def tuile(k, nom, graine):
    v = VARIATIONS[nom]
    if v.get('style') == 'nuage':
        return tuile_nuage(k, nom, graine)
    rng = random.Random(graine * 131 + k)
    m = masque(k)
    prof = profondeur(m)
    corps, rim, grains = hx(v['corps']), hx(v['rim']), [hx(c) for c in v['grains']]
    img = np.zeros((N, N, 4), np.uint8)
    img[m] = corps
    img[m & (prof == 1)] = rim                                    # le liseré sombre d'un pixel
    interieur = np.argwhere(prof >= 2)
    for (y, x) in interieur:                                       # petits grains de terre
        if rng.random() < 0.05:
            img[y, x] = rng.choice(grains)
    loin_bord = lambda y, x: PAD + 3 <= y < PAD + T - 3 and PAD + 3 <= x < PAD + T - 3        # on garde les bords des tuiles propres
    profonds = [(y, x) for (y, x) in np.argwhere(prof >= 3) if loin_bord(y, x)]
    if 'trous' in v:                                               # chemin discret : des trous de terre nue qui laissent voir le sol
        for (y, x) in profonds:
            if rng.random() < v['trous'] * 0.35:
                for dy, dx in rng.choice([[(0, 0)], [(0, 0), (0, 1)], [(0, 0), (1, 0)], [(0, 0), (0, 1), (1, 0)]]):
                    if m[y + dy, x + dx] and prof[y + dy, x + dx] >= 3: img[y + dy, x + dx] = (0, 0, 0, 0)
    if 'cailloux' in v:
        cl, fonce = hx(v['cailloux'][0]), hx(v['cailloux'][1])
        rng.shuffle(profonds)
        pris = []
        for (y, x) in profonds:
            if len(pris) >= 4 + k % 3: break
            if any(abs(y - a) < 5 and abs(x - b) < 5 for a, b in pris): continue
            if all(m[y + dy, x + dx] and prof[y + dy, x + dx] >= 3 for dy in (0, 1) for dx in (0, 1, 2) if y + dy < N and x + dx < N):
                for dy in (0, 1):
                    for dx in (0, 1, 2):
                        if dy == 0 and dx == 2: continue
                        img[y + dy, x + dx] = cl
                img[y + 1, x + 1] = fonce; img[y + 1, x + 2] = fonce
                pris.append((y, x))
    if 'herbe' in v:
        c1, c2 = hx(v['herbe'][0]), hx(v['herbe'][1])
        rng.shuffle(profonds); pris = []
        for (y, x) in profonds:
            if len(pris) >= 3 + k % 3: break
            if any(abs(y - a) < 6 and abs(x - b) < 6 for a, b in pris): continue
            if y + 2 < N and all(m[y + dy, x] and prof[y + dy, x] >= 3 for dy in (0, 1, 2)):
                img[y + 2, x] = c2; img[y + 1, x] = c1; img[y, x] = c1
                if prof[y + 1, x - 1] >= 3: img[y + 1, x - 1] = c2
                if prof[y + 1, x + 1] >= 3: img[y + 1, x + 1] = c2
                pris.append((y, x))
    return Image.fromarray(img[PAD:PAD + T, PAD:PAD + T], 'RGBA')


def planche(nom, graine=7):
    im = Image.new('RGBA', (4 * T, 4 * T), (0, 0, 0, 0))
    for k in range(16):
        im.alpha_composite(tuile(k, nom, graine), ((k % 4) * T, (k // 4) * T))
    return im


def extremites(im, bord):
    """Pour un bord de la tuile (n, e, s, o), la première et la dernière case opaque de la colonne ou de la ligne du bord."""
    a = np.array(im)[:, :, 3] > 0
    ligne = {'n': a[0, :], 's': a[T - 1, :], 'o': a[:, 0], 'e': a[:, T - 1]}[bord]
    idx = np.nonzero(ligne)[0]
    return None if len(idx) == 0 else (int(idx[0]), int(idx[-1]))


def tester_raccords(nom, graine=7):
    """Pour toutes les paires de tuiles voisines : le bord du chemin bouge d'au plus 1 pixel, et un côté fermé reste vide."""
    tuiles = [tuile(k, nom, graine) for k in range(16)]
    pb = []
    for k, im in enumerate(tuiles):
        for bit, bord in ((NORD, 'n'), (EST, 'e'), (SUD, 's'), (OUEST, 'o')):
            e = extremites(im, bord)
            if (k & bit) and e is None: pb.append(f'tuile {k} : côté {bord} ouvert mais vide')
            if not (k & bit) and e is not None: pb.append(f'tuile {k} : côté {bord} fermé mais le chemin y touche')
    for a in range(16):
        for b in range(16):
            if (a & EST) and (b & OUEST):          # a à gauche de b
                ea, eb = extremites(tuiles[a], 'e'), extremites(tuiles[b], 'o')
                if abs(ea[0] - eb[0]) > 1 or abs(ea[1] - eb[1]) > 1: pb.append(f'{a} -> {b} (horizontal) : {ea} contre {eb}')
            if (a & SUD) and (b & NORD):           # a au-dessus de b
                ea, eb = extremites(tuiles[a], 's'), extremites(tuiles[b], 'n')
                if abs(ea[0] - eb[0]) > 1 or abs(ea[1] - eb[1]) > 1: pb.append(f'{a} -> {b} (vertical) : {ea} contre {eb}')
    return pb


if __name__ == '__main__':
    os.makedirs(SORTIE, exist_ok=True)
    for nom in VARIATIONS:
        pb = tester_raccords(nom)
        if pb:
            sys.exit(f'Raccords défectueux pour {nom} : {pb[:5]}')
        planche(nom).save(os.path.join(SORTIE, f'chemin_{nom}.png'))
        print(f'chemin_{nom}.png écrit (raccords testés : toutes les paires de tuiles voisines)')
