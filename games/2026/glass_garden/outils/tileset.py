#!/usr/bin/env python3
"""
Outil du tileset de décors (assets/images/tilesets/tileset_deco.png), rangé par MONDE.

La feuille est unique. Elle est découpée en sections, une par monde, dans l'ordre du GDD :
jardin, nuit, rêve, automne, apocalypse, magie, puis « commun » (ce qui sert à tous les mondes).
Chaque section de monde a le même patron (20 colonnes) :

    colonnes 0-2, lignes 0-2   l'arbre du monde (3 x 3)
    colonnes 0-3, lignes 3+    les petits décors du monde (rangés les uns à la suite des autres)
    colonnes 4-17, 10 lignes   l'ensemble du monde : serre, tour et maison

Le fichier assets/tilesets/deco.json décrit chaque élément : son nom, son monde, son type et son rectangle (colonne,
ligne, largeur, hauteur) en tuiles. C'est la SEULE source de vérité : on ne déplace jamais une tuile à la main.

Pour SUPPRIMER un élément : ajoute "supprime": true dans deco.json puis lance reconstruire --appliquer.
Quand une section grandit ou qu'on réorganise, les tuiles changent de numéro : l'outil recalcule tout seul le numéro
des tuiles dans TOUTES les cartes (assets/maps/*.json et *.tmx), sans reformater les fichiers.

Commandes (sans --appliquer, l'outil ne modifie RIEN : il montre le plan et écrit un aperçu dans /tmp) :
    python3 outils/tileset.py liste
    python3 outils/tileset.py reconstruire [--appliquer]
    python3 outils/tileset.py ajouter image.png --monde nuit --nom lanterne [--appliquer]

⚠ Fais un commit avant d'utiliser --appliquer : c'est ta sauvegarde (git restore pour revenir en arrière).
⚠ Ferme tes cartes dans Tiled avant --appliquer : l'outil réécrit les numéros de tuile dans les fichiers de cartes
  (seulement ceux qui changent), et Tiled écraserait le résultat à sa prochaine sauvegarde.
"""
import argparse, glob, json, os, re, sys
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFESTE = os.path.join(RACINE, 'assets', 'tilesets', 'deco.json')
T = 32                      # taille d'une tuile, en pixels
COLONNES = 60               # largeur de la feuille, en tuiles (3 x 20 : le patron, les variantes d'arbre, les chemins de terre)
HAUT_MIN = 10               # hauteur minimale d'une section de monde, en lignes
ARBRE = (0, 0, 3, 3)        # patron d'une section de monde : (colonne, ligne, largeur, hauteur)
ENSEMBLE_COL = 4
# Variantes d'arbre, à droite de chaque section de monde : type -> (colonne, ligne dans la section)
VAR_ANCRES = {
    'arbre_cime': (20, 0), 'arbre_base': (24, 0), 'arbre_demi_bas': (24, 2),
    'arbre_colle_haut': (28, 0), 'arbre_colle_milieu': (32, 0), 'arbre_colle_bas': (36, 0),
    'arbre_demi_haut': (20, 4), 'arbre_demi_gauche': (20, 7), 'arbre_demi_droite': (23, 7),
    'arbre_foret_auto': (26, 3),
    # chemins de terre (planches 4 x 4, outils/chemins.py) : à droite des variantes d'arbre
    'chemin_discret': (40, 0), 'chemin_standard': (44, 0), 'chemin_pale': (48, 0),
    'chemin_caillouteux': (52, 0), 'chemin_herbeux': (56, 0),
}
BANDE = (0, 3, 4)           # les petits décors : colonne de départ, ligne de départ, largeur en tuiles


def charger_sources(m):
    """Les images « source » du manifeste (éléments pas encore placés dans la feuille)."""
    sources = {}
    for e in m['elements']:
        if 'source' in e:
            chemin = e['source'] if os.path.isabs(e['source']) else os.path.join(RACINE, e['source'])
            sources[e['nom']] = Image.open(chemin).convert('RGBA')
    return sources


def charger():
    with open(MANIFESTE, encoding='utf-8') as f:
        return json.load(f)


def chemin_image(m):
    return os.path.join(RACINE, m['image'])


def rangement(m, images_sources):
    """Calcule, pour chaque élément, sa nouvelle position (col, lig) et la hauteur de chaque section."""
    sections, placements = [], {}
    base = 0
    for monde in m['ordre']:
        els = [e for e in m['elements'] if e['monde'] == monde and not e.get('supprime')]
        if monde == 'commun':
            # section « commun » : rangement en étagères sur toute la largeur de la feuille
            x = y = h_etagere = 0
            for e in els:
                w, h = taille(e, images_sources)
                if x + w > COLONNES: x, y, h_etagere = 0, y + h_etagere, 0
                placements[e['nom']] = (x, base + y)
                x += w; h_etagere = max(h_etagere, h)
            hauteur = y + h_etagere
        else:
            hauteur = HAUT_MIN
            x = y = h_etagere = 0
            for e in els:
                w, h = taille(e, images_sources)
                if e['type'] == 'arbre':
                    placements[e['nom']] = (ARBRE[0], base + ARBRE[1])
                elif e['type'] == 'ensemble':
                    placements[e['nom']] = (ENSEMBLE_COL, base)
                    hauteur = max(hauteur, h)
                elif e['type'] in VAR_ANCRES:
                    vc, vl = VAR_ANCRES[e['type']]
                    placements[e['nom']] = (vc, base + vl)
                    hauteur = max(hauteur, vl + h)
                else:   # petit décor : étagères dans la bande de gauche
                    if x + w > BANDE[2]: x, y, h_etagere = 0, y + h_etagere, 0
                    placements[e['nom']] = (BANDE[0] + x, base + BANDE[1] + y)
                    x += w; h_etagere = max(h_etagere, h)
            hauteur = max(hauteur, BANDE[1] + y + h_etagere)
        sections.append((monde, base, hauteur))
        base += hauteur
    return sections, placements, base


def taille(e, images_sources):
    if 'source' in e:
        im = images_sources[e['nom']]
        return (im.width + T - 1) // T, (im.height + T - 1) // T
    return e['rect'][2], e['rect'][3]


def construire(m, images_sources):
    ancienne = Image.open(chemin_image(m)).convert('RGBA')
    anciennes_colonnes = m.get('colonnes', COLONNES)
    sections, placements, lignes = rangement(m, images_sources)
    nouvelle = Image.new('RGBA', (COLONNES * T, lignes * T), (0, 0, 0, 0))
    correspondance = {}     # ancien numéro de tuile -> nouveau numéro (numéros de la feuille, de 0 à N-1)
    for e in [e for e in m['elements'] if not e.get('supprime')]:
        nc, nl = placements[e['nom']]
        w, h = taille(e, images_sources)
        if 'source' in e:
            nouvelle.alpha_composite(images_sources[e['nom']], (nc * T, nl * T))
        else:
            c, l = e['rect'][0], e['rect'][1]
            nouvelle.alpha_composite(ancienne.crop((c * T, l * T, (c + w) * T, (l + h) * T)), (nc * T, nl * T))
        if 'rect' in e and e['rect'][2] == w and e['rect'][3] == h:      # un élément remplacé garde ses numéros dans les cartes
            c, l = e['rect'][0], e['rect'][1]
            for dy in range(h):
                for dx in range(w):
                    correspondance[(c + dx) + (l + dy) * anciennes_colonnes] = (nc + dx) + (nl + dy) * COLONNES
    return ancienne, nouvelle, sections, placements, correspondance


def pixels_opaques(im):
    return sum(im.getchannel('A').histogram()[1:])


def lire_gid_deco(texte, est_json):
    m = re.search(r'"firstgid":\s*(\d+),\s*"image":\s*"[^"]*tileset_deco\.png"' if est_json
                  else r'<tileset firstgid="(\d+)" name="tileset_deco"', texte)
    return int(m.group(1)) if m else None


def remapper_carte(chemin, correspondance, nouvelle_taille, appliquer):
    """Réécrit les numéros de tuile du tileset_deco dans une carte. Renvoie (nb_tuiles_changees, ids_inconnus)."""
    est_json = chemin.endswith('.json')
    with open(chemin, encoding='utf-8') as f:
        texte = f.read()
    original = texte
    premier = lire_gid_deco(texte, est_json)
    if premier is None:
        return 0, set()
    inconnus, changees = set(), 0

    def nouveau_gid(g):
        nonlocal changees
        drapeaux, vrai = g & 0xE0000000, g & 0x1FFFFFFF
        if vrai < premier: return g
        idx = vrai - premier
        if idx not in correspondance:
            inconnus.add(idx); return g
        nv = correspondance[idx]
        if nv != idx: changees += 1
        return drapeaux | (nv + premier)

    def sur_bloc(bloc):
        return re.sub(r'\d+', lambda mo: str(nouveau_gid(int(mo.group(0)))), bloc)

    if est_json:
        texte = re.sub(r'("data":\s*\[)(.*?)(\])', lambda mo: mo.group(1) + sur_bloc(mo.group(2)) + mo.group(3), texte, flags=re.S)
        texte = re.sub(r'("image":\s*"[^"]*tileset_deco\.png",\s*"imageheight":\s*)\d+(,\s*"imagewidth":\s*)\d+',
                       lambda mo: mo.group(1) + str(nouvelle_taille[1]) + mo.group(2) + str(nouvelle_taille[0]), texte)
        texte = re.sub(r'("columns":\s*)\d+(,\s*"firstgid":\s*\d+,\s*"image":\s*"[^"]*tileset_deco\.png")', lambda mo: mo.group(1) + str(nouvelle_taille[0] // T) + mo.group(2), texte)
        texte = re.sub(r'("name":\s*"tileset_deco",\s*"spacing":\s*0,\s*"tilecount":\s*)\d+',
                       lambda mo: mo.group(1) + str(nouvelle_taille[0] * nouvelle_taille[1] // (T * T)), texte)
    else:
        texte = re.sub(r'(<data encoding="csv">)(.*?)(</data>)', lambda mo: mo.group(1) + sur_bloc(mo.group(2)) + mo.group(3), texte, flags=re.S)
        n = nouvelle_taille[0] * nouvelle_taille[1] // (T * T)
        texte = re.sub(r'(<tileset firstgid="\d+" name="tileset_deco" tilewidth="32" tileheight="32" tilecount=")\d+(" columns=")\d+',
                       lambda mo: mo.group(1) + str(n) + mo.group(2) + str(nouvelle_taille[0] // T), texte)
        texte = re.sub(r'(<image source="[^"]*tileset_deco\.png" width=")\d+(" height=")\d+', lambda mo: mo.group(1) + str(nouvelle_taille[0]) + mo.group(2) + str(nouvelle_taille[1]), texte)
    if appliquer and texte != original:          # on ne touche pas aux fichiers qui n'ont rien à changer (Tiled ouvert, mtime...)
        with open(chemin, 'w', encoding='utf-8') as f:
            f.write(texte)
    return changees, inconnus


def cmd_liste(m):
    sections, placements, lignes = rangement(m, charger_sources(m))
    print(f'Feuille : {COLONNES} colonnes x {lignes} lignes = {COLONNES * T} x {lignes * T} pixels')
    for monde, base, h in sections:
        print(f'\n[{monde}]  lignes {base} à {base + h - 1}')
        for e in m['elements']:
            if e['monde'] == monde:
                c, l = placements[e['nom']]
                w, hh = taille(e, charger_sources(m))
                print(f"   {e['nom']:<28} {e['type']:<9} colonne {c:>2}, ligne {l:>3}   ({w} x {hh})")


def cmd_reconstruire(m, appliquer, images_sources=None):
    images_sources = charger_sources(m) if images_sources is None else images_sources
    ancienne, nouvelle, sections, placements, correspondance = construire(m, images_sources)
    if appliquer is False:
        apercu = '/tmp/apercu_tileset_deco.png'
        nouvelle.save(apercu)
    # contrôle : aucun pixel ne doit être perdu ni inventé
    attendu = 0
    for e in [e for e in m['elements'] if not e.get('supprime')]:
        if 'source' in e: attendu += pixels_opaques(images_sources[e['nom']])
        else:
            c, l, w, h = e['rect']
            attendu += pixels_opaques(ancienne.crop((c * T, l * T, (c + w) * T, (l + h) * T)))
    obtenu = pixels_opaques(nouvelle)
    if attendu != obtenu:
        sys.exit(f'ERREUR : {attendu} pixels attendus, {obtenu} obtenus (des éléments se chevauchent). Rien n\'a été modifié.')
    non_classes = pixels_opaques(ancienne) - sum(
        pixels_opaques(ancienne.crop((e['rect'][0] * T, e['rect'][1] * T, (e['rect'][0] + e['rect'][2]) * T, (e['rect'][1] + e['rect'][3]) * T)))
        for e in m['elements'] if 'rect' in e)
    if non_classes:
        sys.exit(f'ERREUR : {non_classes} pixels de la feuille actuelle ne sont dans AUCUN élément du manifeste '
                 f'(ils seraient perdus). Ajoute-les à assets/tilesets/deco.json. Rien n\'a été modifié.')
    taille_nv = nouvelle.size
    total_inconnus, total_changes = {}, 0
    for chemin in sorted(glob.glob(os.path.join(RACINE, 'assets', 'maps', '*.json')) + glob.glob(os.path.join(RACINE, 'assets', 'maps', '*.tmx'))):
        changees, inconnus = remapper_carte(chemin, correspondance, taille_nv, False)
        total_changes += changees
        if inconnus: total_inconnus[os.path.basename(chemin)] = sorted(inconnus)
    if total_inconnus:
        sys.exit(f'ERREUR : des cartes utilisent des tuiles qui ne sont dans aucun élément : {total_inconnus}. Rien n\'a été modifié.')
    print(f'Plan : feuille {taille_nv[0]} x {taille_nv[1]} px ({taille_nv[1] // T} lignes), '
          f'{total_changes} tuiles à renuméroter dans les cartes, {len(m["elements"])} éléments, aucun pixel perdu.')
    if not appliquer:
        print('Aperçu : /tmp/apercu_tileset_deco.png   (relance avec --appliquer pour modifier les fichiers)')
        return
    nouvelle.save(chemin_image(m))
    for chemin in sorted(glob.glob(os.path.join(RACINE, 'assets', 'maps', '*.json')) + glob.glob(os.path.join(RACINE, 'assets', 'maps', '*.tmx'))):
        remapper_carte(chemin, correspondance, taille_nv, True)
    m['colonnes'] = COLONNES
    m['elements'] = [e for e in m['elements'] if not e.get('supprime')]
    for e in m['elements']:
        c, l = placements[e['nom']]
        w, h = taille(e, images_sources)
        e['rect'] = [c, l, w, h]
        e.pop('source', None)
    with open(MANIFESTE, 'w', encoding='utf-8') as f:
        json.dump(m, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('Appliqué : feuille, cartes et manifeste mis à jour.')


def cmd_ajouter(m, image, monde, nom, appliquer):
    if monde not in m['ordre']:
        sys.exit(f"Monde inconnu : {monde}. Mondes possibles : {', '.join(m['ordre'])}")
    if any(e['nom'] == nom for e in m['elements']):
        sys.exit(f'Un élément s\'appelle déjà « {nom} ».')
    im = Image.open(image).convert('RGBA')
    m['elements'].append({'nom': nom, 'monde': monde, 'type': 'petit', 'source': os.path.relpath(os.path.abspath(image), RACINE)})
    cmd_reconstruire(m, appliquer, {**charger_sources(m), nom: im})


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest='cmd', required=True)
    sp.add_parser('liste')
    r = sp.add_parser('reconstruire'); r.add_argument('--appliquer', action='store_true')
    a = sp.add_parser('ajouter'); a.add_argument('image'); a.add_argument('--monde', required=True); a.add_argument('--nom', required=True); a.add_argument('--appliquer', action='store_true')
    args = p.parse_args()
    m = charger()
    if args.cmd == 'liste': cmd_liste(m)
    elif args.cmd == 'reconstruire': cmd_reconstruire(m, args.appliquer)
    else: cmd_ajouter(m, args.image, args.monde, args.nom, args.appliquer)


if __name__ == '__main__':
    main()
