#!/usr/bin/env python3
"""
Plante la forêt dense d'une carte à partir d'une ZONE dessinée dans Tiled.

Dans Tiled, crée deux calques de TUILES dans ta carte :
    foret_zone   où tu dessines la zone de forêt : n'importe quelle tuile, n'importe quelle forme (le calque sert
                 seulement de masque ; tu peux le masquer ou le garder)
    foret        celui que le script remplit avec les bonnes tuiles de forêt (ne le dessine pas à la main)
Place le calque « foret » au-dessus des autres calques de sol, et mets-le dans le calque qui bloque le joueur si
la forêt sert de limite de carte.

Puis lance :
    python3 outils/foret.py assets/maps/ma_carte.json [--monde jardin] [--apercu apercu.png]
Le script remplit le calque « foret » (le fichier .tmx ou .json). Retouche la zone, relance : la forêt se recalcule.
Pense à fermer la carte dans Tiled avant de lancer le script (sinon Tiled écrasera son résultat), puis rouvre-la.

Comment la zone devient des arbres :
  * les arbres sont posés sur un quadrillage en quinconce (2 cases de période en largeur, 1 en hauteur, une rangée sur
    deux décalée d'une case, 3 x 3 cases chacun) ;
  * un arbre est planté quand la case CENTRALE de son empreinte est dans la zone : la forêt déborde donc d'environ
    une case autour de la zone dessinée ;
  * au bord de la carte, la zone est PROLONGÉE vers l'extérieur : une forêt dessinée contre le bord continue au-delà
    (c'est ce qu'il faut pour une limite de carte) ;
  * un arbre isolé : une seule case dessinée (ou deux) suffit à en planter un.
  * les COINS DU BAS sont complétés : le quinconce laisse un coin bas-gauche ou bas-droit ouvert au bout de la rangée
    du bas ; le script y plante l'arbre qui manque, pour que le bas de la forêt soit droit et fermé.
Les tuiles viennent de l'autotuile de forêt (34 tuiles rangées par rôle, assets/tilesets/foret.json), la même pour les 5 mondes :
--monde choisit seulement de quelle section de la feuille on prend les tuiles.
"""
import argparse, json, os, re, sys
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import foret_logique as FL

MANIFESTE = os.path.join(RACINE, 'assets', 'tilesets', 'deco.json')
TABLE = os.path.join(RACINE, 'assets', 'tilesets', 'foret.json')


def charger_table():
    with open(TABLE, encoding='utf-8') as f:
        d = json.load(f)
    index = {(px, py, mq): k for px, py, mq, k in d['index']}
    positions = {int(k): tuple(v) for k, v in d['positions'].items()}
    return index, positions


def bloc_du_monde(monde):
    with open(MANIFESTE, encoding='utf-8') as f:
        m = json.load(f)
    nom = f'arbre_{monde}_foret_auto'
    e = next((e for e in m['elements'] if e['nom'] == nom and 'rect' in e), None)
    if e is None:
        sys.exit(f"Pas de bloc de forêt pour le monde « {monde} » dans le manifeste. Lance d'abord : "
                 f"python3 outils/arbres.py generer puis python3 outils/tileset.py reconstruire --appliquer")
    return e['rect'][0], e['rect'][1], m['colonnes']


def lire_carte(chemin, nom_zone='foret_zone', nom_sortie='foret'):
    """Renvoie (largeur, hauteur, zone, firstgid, colonnes) ; zone = ensemble des cases dessinées dans foret_zone."""
    with open(chemin, encoding='utf-8') as f:
        texte = f.read()
    if chemin.endswith('.json'):
        m = json.loads(texte)
        l, h = m['width'], m['height']
        couches = {c['name']: c for c in m['layers'] if c['type'] == 'tilelayer'}
        deco = next((t for t in m['tilesets'] if 'tileset_deco' in t['image']), None)
        if deco is None: sys.exit('Cette carte n\'utilise pas tileset_deco.png.')
        if nom_sortie not in couches or nom_zone not in couches:
            manque(couches, nom_zone, nom_sortie)
        data = couches[nom_zone]['data']
        return l, h, {(i % l, i // l) for i, g in enumerate(data) if g & 0x1FFFFFFF}, deco['firstgid'], deco['columns']
    l = int(re.search(r'<map [^>]*\bwidth="(\d+)"', texte).group(1)); h = int(re.search(r'<map [^>]*\bheight="(\d+)"', texte).group(1))
    deco = re.search(r'<tileset firstgid="(\d+)" name="tileset_deco"[^>]*columns="(\d+)"', texte)
    if deco is None: sys.exit('Cette carte n\'utilise pas tileset_deco.png.')
    noms = re.findall(r'<layer id="\d+" name="([^"]+)"', texte)
    if nom_sortie not in noms or nom_zone not in noms:
        manque(noms, nom_zone, nom_sortie)
    bloc = re.search(r'<layer id="\d+" name="' + re.escape(nom_zone) + r'"[^>]*>\s*<data encoding="csv">(.*?)</data>', texte, re.S).group(1)
    nombres = [int(x) for x in re.findall(r'\d+', bloc)]
    return l, h, {(i % l, i // l) for i, g in enumerate(nombres) if g & 0x1FFFFFFF}, int(deco.group(1)), int(deco.group(2))


def manque(presentes, nom_zone='foret_zone', nom_sortie='foret'):
    sys.exit(f'Il faut deux calques de tuiles dans la carte : « {nom_zone} » (la zone que tu dessines) et « {nom_sortie} » '
             '(que le script remplit). Calques trouvés : ' + ', '.join(sorted(presentes)))


def lire_couche(chemin, nom):
    """Les numéros de tuile du calque `nom` (liste à plat), ou None si le calque n'existe pas."""
    with open(chemin, encoding='utf-8') as f:
        texte = f.read()
    if chemin.endswith('.json'):
        c = next((c for c in json.loads(texte)['layers'] if c['type'] == 'tilelayer' and c['name'] == nom), None)
        return None if c is None else c['data']
    mo = re.search(r'<layer id="\d+" name="' + re.escape(nom) + r'"[^>]*>\s*<data encoding="csv">(.*?)</data>', texte, re.S)
    return None if mo is None else [int(x) for x in re.findall(r'\d+', mo.group(1))]


def ecrire_couche(chemin, grille, largeur, nom='foret'):
    nombres = [g for ligne in grille for g in ligne]
    with open(chemin, encoding='utf-8') as f:
        texte = f.read()
    if chemin.endswith('.json'):
        nv, n = re.subn(r'("data":\s*\[)[^\]]*(\],\s*"height":\s*\d+,\s*"id":\s*\d+,\s*"name":\s*"' + re.escape(nom) + '")',
                        lambda mo: mo.group(1) + ', '.join(map(str, nombres)) + mo.group(2), texte)
    else:
        lignes = ',\n'.join(','.join(str(g) for g in nombres[i:i + largeur]) for i in range(0, len(nombres), largeur))
        nv, n = re.subn(r'(<layer id="\d+" name="' + re.escape(nom) + r'"[^>]*>\s*<data encoding="csv">)(.*?)(</data>)',
                        lambda mo: mo.group(1) + '\n' + lignes + '\n' + mo.group(3), texte, flags=re.S)
    if n != 1:
        sys.exit(f'Impossible de réécrire le calque « {nom} » (format inattendu). Rien n\'a été modifié.')
    with open(chemin, 'w', encoding='utf-8') as f:
        f.write(nv)


def gids_de_foret(premier, colonnes):
    """Tous les numéros de tuile qui appartiennent à l'autotuile de forêt (tous les mondes) : ce sont ceux que le script
    possède, et qu'il peut donc effacer puis réécrire sans toucher au reste d'un calque."""
    with open(MANIFESTE, encoding='utf-8') as f:
        m = json.load(f)
    _, positions = charger_table()
    gids = set()
    for e in m['elements']:
        if e['type'] == 'arbre_foret_auto' and 'rect' in e:
            for (c, l) in positions.values():
                gids.add(premier + (e['rect'][1] + l) * colonnes + (e['rect'][0] + c))
    return gids


def planter(chemin, monde, ecrire=True, nom_zone='foret_zone', nom_sortie='foret'):
    largeur, hauteur, zone, premier, colonnes = lire_carte(chemin, nom_zone, nom_sortie)
    index, positions = charger_table()
    c0, l0, colonnes_feuille = bloc_du_monde(monde)
    if colonnes != colonnes_feuille:
        sys.exit(f'La carte décrit tileset_deco avec {colonnes} colonnes, la feuille en a {colonnes_feuille} : '
                 f'rouvre la carte dans Tiled ou lance outils/tileset.py reconstruire --appliquer.')
    slots = FL.couche(zone, largeur, hauteur, index)
    grille = [[0 if k is None else premier + (l0 + positions[k][1]) * colonnes + (c0 + positions[k][0])
               for k in ligne] for ligne in slots]
    if nom_sortie != 'foret':
        # FUSION : on efface d'abord les tuiles de forêt déjà plantées dans ce calque, puis on n'écrit que dans les cases vides.
        existant = lire_couche(chemin, nom_sortie)
        propres = gids_de_foret(premier, colonnes)
        conflits = []
        for i, g in enumerate(existant):
            existant[i] = 0 if (g & 0x1FFFFFFF) in propres else g
        for y in range(hauteur):
            for x in range(largeur):
                if grille[y][x] and existant[y * largeur + x]:
                    conflits.append((x, y))
        if conflits:
            sys.exit(f'{len(conflits)} cases de forêt tombent sur des tuiles déjà présentes dans « {nom_sortie} » (par exemple '
                     f'{conflits[:5]}) : retire ces cases de la zone. Rien n\'a été modifié.')
        for y in range(hauteur):
            for x in range(largeur):
                if grille[y][x]: existant[y * largeur + x] = grille[y][x]
        sortie = [existant[y * largeur:(y + 1) * largeur] for y in range(hauteur)]
    else:
        sortie = grille
    if ecrire:
        ecrire_couche(chemin, sortie, largeur, nom_sortie)
    return largeur, hauteur, slots, (c0, l0), positions


def apercu(slots, origine, positions, sortie):
    with open(MANIFESTE, encoding='utf-8') as f:
        m = json.load(f)
    feuille = Image.open(os.path.join(RACINE, m['image'])).convert('RGBA')
    herbe = Image.open(os.path.join(RACINE, 'assets', 'images', 'tilesets', 'tileset_garden.png')).convert('RGBA').crop((128, 32, 160, 64))
    h, l = len(slots), len(slots[0])
    im = Image.new('RGBA', (l * 32, h * 32))
    for y in range(h):
        for x in range(l): im.alpha_composite(herbe, (x * 32, y * 32))
    for y, ligne in enumerate(slots):
        for x, k in enumerate(ligne):
            if k is not None:
                c, r = origine[0] + positions[k][0], origine[1] + positions[k][1]
                im.alpha_composite(feuille.crop((c * 32, r * 32, c * 32 + 32, r * 32 + 32)), (x * 32, y * 32))
    im.save(sortie)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('carte', help='la carte .json ou .tmx')
    p.add_argument('--monde', default='jardin', help='section de la feuille d\'où viennent les tuiles (défaut : jardin)')
    p.add_argument('--apercu', help='écrit aussi une image de la forêt obtenue')
    p.add_argument('--calque', default='foret', help='calque où écrire les tuiles (défaut : foret). Avec un autre calque, par exemple walls pour que la forêt bloque le joueur, le script FUSIONNE : il efface ses anciennes tuiles puis écrit dans les cases vides, et refuse si une case est déjà prise.')
    p.add_argument('--zone', default='foret_zone', help='calque qui contient la zone dessinée (défaut : foret_zone)')
    a = p.parse_args()
    largeur, hauteur, slots, origine, positions = planter(a.carte, a.monde, True, a.zone, a.calque)
    n = sum(1 for ligne in slots for k in ligne if k is not None)
    print(f'Forêt plantée : {n} cases remplies sur {largeur * hauteur} dans le calque « {a.calque} » de {os.path.basename(a.carte)}.')
    if a.apercu:
        apercu(slots, origine, positions, a.apercu); print('Aperçu :', a.apercu)


if __name__ == '__main__':
    main()
