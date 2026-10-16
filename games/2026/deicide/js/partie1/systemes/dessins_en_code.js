// dessins_en_code.js : TOUT ce que le jeu dessine en code (des textures fabriquées une seule fois, sans fichier image) : halos de lumière, lanternes, croix de soin, balle,
// mur de l'arène, police pixel, plaques du HUD, petit carré des particules...
// Tous suivent la même recette (voir fabriquer) : on regarde si la texture existe déjà, sinon on crée une zone de dessin (un « canvas »), on y peint, et on la donne
// à Phaser sous un nom (la clé), qu'on utilise ensuite comme n'importe quelle image : scene.add.image(x, y, "halo").
// Les dessins en pixel art sont écrits avec des MOTIFS : une ligne de lettres par ligne de pixels, « . » = transparent, les autres lettres = une couleur.
// (Le HUD et la barre de vie ont leurs propres dessins, dans personnage/hud.js et personnage/barre_de_vie.js.)

// ---------------------------------------------------------------------------------------------
// La recette commune
// ---------------------------------------------------------------------------------------------

// Fabrique la texture « cle » de largeur x hauteur pixels, une seule fois (renvoie false si elle existait déjà). dessiner(ctx, texture) reçoit le « pinceau » (ctx) et la texture
// (pour y découper des images numérotées avec texture.add). net = true pour le pixel art : pas de flou quand on agrandit.
function fabriquer(scene, cle, largeur, hauteur, dessiner, { net = false } = {}) { // fabrique une texture dessinée en code (une seule fois)
    if (scene.textures.exists(cle)) return false; // déjà dessinée (autre niveau, ou scène relancée) : on la réutilise
    const texture = scene.textures.createCanvas(cle, largeur, hauteur); // la zone de dessin
    dessiner(texture.getContext(), texture); // on dessine dedans
    texture.refresh(); // envoie le dessin à Phaser
    if (net) texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
    return true; // la texture vient d'être créée
}

// Peint un motif de lettres avec ses couleurs, à partir du pixel (dx, dy) : couleurs = { "#": "#3b3634", ... }, les « . » restent transparents.
function peindreMotif(ctx, motif, couleurs, dx = 0, dy = 0) { // peint un motif de lettres pixel par pixel
    motif.forEach((ligne, y) => [...ligne].forEach((lettre, x) => { // pour chaque ligne et chaque lettre du motif
        if (lettre === ".") return; // un point = pixel transparent, on ne peint rien
        ctx.fillStyle = couleurs[lettre]; // la couleur de cette lettre
        ctx.fillRect(x + dx, y + dy, 1, 1); // un seul pixel
    }));
}

// ---------------------------------------------------------------------------------------------
// Les lumières : des dégradés ronds
// ---------------------------------------------------------------------------------------------

function halo(scene, cle, arrets) { // un rond de 256 x 256 qui s'efface du centre vers le bord ; arrets = [[position de 0 à 1, couleur], ...]
    fabriquer(scene, cle, 256, 256, (ctx) => { // on fabrique la texture une seule fois
        const degrade = ctx.createRadialGradient(128, 128, 0, 128, 128, 128); // dégradé rond, du centre jusqu'au bord
        arrets.forEach(([position, couleur]) => degrade.addColorStop(position, couleur)); // chaque arrêt : une position et une couleur
        ctx.fillStyle = degrade; // le dégradé devient la couleur de remplissage
        ctx.fillRect(0, 0, 256, 256); // on remplit toute l'image
    });
}
export function creerTextureHalo(scene) { // le halo de lumière (voir lumiere.js) : 80 % d'opacité au centre
    halo(scene, "halo", [[0, "rgba(255,255,255,0.8)"], [1, "rgba(255,255,255,0)"]]); // blanc à 80 % au centre, transparent au bord
}
export function creerTextureHaloDoux(scene) { // le halo des ennemis : plus large et peu concentré (35 % au centre, 15 % à mi-chemin)
    halo(scene, "halo_doux", [[0, "rgba(255,255,255,0.35)"], [0.5, "rgba(255,255,255,0.15)"], [1, "rgba(255,255,255,0)"]]); // 35 % au centre, 15 % à mi-chemin, transparent au bord
}

// ---------------------------------------------------------------------------------------------
// Les lanternes
// ---------------------------------------------------------------------------------------------

// dessin de la lanterne en pixel art : chaque lettre est un pixel, "." = transparent
export const MOTIF_LANTERNE = [ // (exporté : lanterne_vivante.js s'en sert pour dessiner la lanterne vivante)
    "....##....", // anneau pour l'accrocher
    "...#..#...", // le haut de l'anneau
    "....##....", // le bas de l'anneau
    "..######..", // chapeau en métal
    ".########.", // le haut du chapeau
    ".#VVVVVV#.", // verre, entouré du cadre
    ".#VVJJVV#.", // le verre et le haut de la flamme
    ".#VJBBJV#.", // flamme : B = coeur blanc, J = jaune autour
    ".#VJBBJV#.", // la flamme
    ".#VVJJVV#.", // le bas de la flamme
    ".#VVVVVV#.", // le bas du verre
    ".########.", // socle
    "..######..", // le bas du socle
    "...####...", // le pied du socle
];

function dessinerLanterne(scene, cle, couleurs) { // dessine le motif dans une texture, avec les couleurs données
    fabriquer(scene, cle, 10, MOTIF_LANTERNE.length, (ctx) => peindreMotif(ctx, MOTIF_LANTERNE, couleurs), { net: true }); // on fabrique la texture de 10 pixels de large
}
export function creerTexturesLanterne(scene) { // la lanterne allumée et la lanterne éteinte
    // cadre en fer, verre doré lumineux, flamme
    dessinerLanterne(scene, "lanterne_allumee", { "#": "#3b3634", V: "#f3e6b8", J: "#ffd45c", B: "#ffffff" }); // la lanterne allumée
    // même cadre, verre sombre et flamme morte
    dessinerLanterne(scene, "lanterne_eteinte", { "#": "#3b3634", V: "#4a4a52", J: "#3a3a40", B: "#2e2e33" }); // la lanterne éteinte
}

// La lanterne vivante : la lanterne avec de petites ailes. Les deux images (ailes levées, ailes baissées) sont dessinées dans une seule texture, l'une sous l'autre.
// Les ailes sont dessinées à droite, puis la même retournée à gauche.
// ailes levées : attachées en bas à gauche
const AILE_HAUT = [".....LLL.", "...LLWWWL", "..LWWWWWL", ".LWWWWWL.", "LWWWWWL..", "LWWWWL...", ".LWWL....", "..LL....."]; // le dessin de l'aile quand elle est levée
// ailes baissées : attachées en haut à gauche
const AILE_BAS = ["..LL.....", ".LWWL....", "LWWWWL...", "LWWWWWL..", ".LWWWWWL.", "..LWWWWWL", "...LLWWWL", ".....LLL."]; // le dessin de l'aile quand elle est baissée
const COULEURS_LANTERNE = { "#": "#3b3634", V: "#f3e6b8", J: "#ffd45c", B: "#ffffff" }; // la lanterne allumée
const COULEURS_AILE = { W: "#ffffff", L: "#8a779b" }; // les couleurs des ailes
const LARGEUR_IMAGE = 28; // une image de la lanterne ailée : 28 x 16 (la lanterne fait 10 x 14, les ailes dépassent de 9 de chaque côté)
const HAUTEUR_IMAGE = 16; // hauteur d'une image de lanterne ailée
export function creerTextureLanterneVivante(scene) { // crée la lanterne ailée (deux images l'une sous l'autre)
    fabriquer(scene, "lanterne_vivante", LARGEUR_IMAGE, HAUTEUR_IMAGE * 2, (ctx, texture) => { // on fabrique la texture de deux images
        const pixel = (x, y, couleur) => { ctx.fillStyle = couleur; ctx.fillRect(x, y, 1, 1); }; // fonction qui peint un pixel
        [AILE_HAUT, AILE_BAS].forEach((aile, image) => { // pour chaque position d'aile (levée puis baissée)
            const haut = image * HAUTEUR_IMAGE; // première ligne de cette image dans la texture
            peindreMotif(ctx, MOTIF_LANTERNE, COULEURS_LANTERNE, 9, haut + 2); // la lanterne, au milieu
            const departAile = haut + (image === 0 ? 1 : 5); // où commence la première ligne de l'aile
            aile.forEach((ligne, y) => [...ligne].forEach((lettre, x) => { // pour chaque pixel de l'aile
                if (lettre === ".") return; // un point : transparent
                pixel(19 + x, departAile + y, COULEURS_AILE[lettre]); // aile droite
                pixel(8 - x, departAile + y, COULEURS_AILE[lettre]); // aile gauche : la même, retournée
            }));
            texture.add(image, 0, 0, haut, LARGEUR_IMAGE, HAUTEUR_IMAGE); // image numéro 0 puis 1
        });
    }, { net: true }); // pixel art : pas de flou
}

// ---------------------------------------------------------------------------------------------
// La croix de soin, la balle du robot, le dash
// ---------------------------------------------------------------------------------------------

// La croix de soin : un simple « + » blanc, dessiné pixel par pixel (# = pixel blanc, . = transparent)
const MOTIF_CROIX = [ // le motif de la croix de soin
    "...###...", // la branche du haut de la croix
    "...###...", // la branche du haut de la croix
    "...###...", // la branche du haut de la croix
    "#########", // la barre horizontale
    "#########", // la barre horizontale
    "#########", // la barre horizontale
    "...###...", // la branche du bas de la croix
    "...###...", // la branche du bas de la croix
    "...###..." // la branche du bas de la croix
];
export function creerTextureCroix(scene) { // (voir bonus.js)
    fabriquer(scene, "bonus_pv", 9, 9, (ctx) => peindreMotif(ctx, MOTIF_CROIX, { "#": "#ffffff" }), { net: true }); // on la dessine pixel par pixel
}

const BALLE = ["..cccc..", ".cwwwwc.", "cwwwwwwc", "cwwwwwwc", ".cwwwwc.", "..cccc.."]; // le motif de la balle du robot
const COULEURS_BALLE = { c: "#ac98b6", w: "#e7e0e9" }; // ses couleurs : contour lavande, centre clair
export function creerTextureBalle(scene, cle) { // la balle du robot, pixel par pixel (voir personnage.js)
    fabriquer(scene, cle, 8, 6, (ctx) => peindreMotif(ctx, BALLE, COULEURS_BALLE), { net: true }); // on la dessine pixel par pixel
}

// Assemble la bande du dash : pour chaque image, la fumée d'origine (à gauche du robot) puis le robot retourné sur place pour qu'il regarde à droite. Le robot est la dernière
// image de la bande « with FX », la seule sans fumée. Il n'apparaît qu'à partir de la 2e image : la 1re n'est que de la fumée.
// p = { cle, robot, fumee (les deux bandes d'origine), largeur, hauteur (d'une image), images, decalage, torse } : les chiffres viennent de personnage.js.
export function creerTextureDash(scene, p) { // crée la bande d'images du dash
    fabriquer(scene, p.cle, p.largeur, p.hauteur * p.images, (ctx, texture) => { // on fabrique la texture : une image par étape
        ctx.imageSmoothingEnabled = false; // on copie des pixels, sans les mélanger
        for (let i = 0; i < p.images; i++) { // pour chaque image du dash
            const y = i * p.hauteur; // la hauteur de cette image dans la bande
            ctx.drawImage(p.fumee, 0, y, p.largeur, p.hauteur, -p.decalage, y, p.largeur, p.hauteur); // on copie d'abord la fumée
            if (i > 0) { // à partir de la 2e image, on ajoute le robot
                ctx.save(); // on sauvegarde l'état du dessin
                ctx.setTransform(-1, 0, 0, 1, 2 * p.torse - p.decalage, y); // miroir autour du centre du torse
                ctx.drawImage(p.robot, 0, (p.images - 1) * p.hauteur, p.largeur, p.hauteur, 0, 0, p.largeur, p.hauteur); // on copie l'image du robot
                ctx.restore(); // on remet l'état normal
            }
            texture.add(i, 0, 0, y, p.largeur, p.hauteur); // image numéro i, comme pour les autres bandes
        }
    });
}

// ---------------------------------------------------------------------------------------------
// Le mur de l'arène du boss
// ---------------------------------------------------------------------------------------------

// De grosses briques de pierre claire, avec un liseré chaud sur le bord intérieur (côté arène) pour qu'il se voie dans le noir (voir arene.js)
export function creerTextureMur(scene) { // crée l'image du mur de l'arène
    const largeur = 64, hauteur = 800; // sa taille : 64 sur 800 pixels
    fabriquer(scene, "mur_arene", largeur, hauteur, (ctx) => { // on fabrique la texture
        ctx.fillStyle = "#3b3640"; ctx.fillRect(0, 0, largeur, hauteur); // le fond des joints
        for (let y = 0, rang = 0; y < hauteur; y += 32, rang++) { // des briques de 64 x 32 : une rangée sur deux décalée de la moitié
            for (let x = (rang % 2 ? -32 : 0); x < largeur; x += 64) { // pour chaque brique de la rangée
                ctx.fillStyle = (rang * 7 + x) % 3 === 0 ? "#6d6676" : "#5f5968"; // la couleur de la brique, qui varie un peu
                ctx.fillRect(x + 2, y + 2, 60, 28); // on peint la brique
                ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fillRect(x + 2, y + 2, 60, 4); // le haut de la brique est plus clair
            } // fin de la rangée
        } // fin des briques
        ctx.fillStyle = "rgba(255,190,120,0.55)"; ctx.fillRect(0, 0, 5, hauteur); // le liseré chaud, à gauche
    }); // fin du dessin
}

// ---------------------------------------------------------------------------------------------
// Les particules : un carré blanc de 4 x 4 px (on le teinte ensuite de n'importe quelle couleur)
// ---------------------------------------------------------------------------------------------

export function creerTexturePixel(scene, cle = "pixel") { // cle : « pixel » pour les éclats, « menu_poussiere » pour la poussière des écrans
    fabriquer(scene, cle, 4, 4, (ctx) => { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 4, 4); }); // on le remplit de blanc
}

// ---------------------------------------------------------------------------------------------
// La police pixel et les plaques d'armure (les mêmes que celles du HUD)
// ---------------------------------------------------------------------------------------------

// les couleurs du HUD (voir PAL dans personnage/hud.js)
export const PAL = { K: "#211924", a: "#251d2a", b: "#2f2535", c: "#372b3e", d: "#3f3249", m: "#5f4f6e", n: "#8a779b", L: "#ac98b6", W: "#e7e0e9", G: "#f5f0f8" }; // la palette de couleurs du HUD

// La police : des lettres de 5 x 7 pixels, haut clair et bas lavande sur une ombre, comme les chiffres du HUD (voir ecrire dans classement.js)
export const GLYPHES = { // les lettres de la police, en pixels
    A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"], B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."], // les caractères A B dessinés en pixels (5 colonnes sur 7 lignes)
    C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."], D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."], // les caractères C D dessinés en pixels (5 colonnes sur 7 lignes)
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"], F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."], // les caractères E F dessinés en pixels (5 colonnes sur 7 lignes)
    G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."], H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"], // les caractères G H dessinés en pixels (5 colonnes sur 7 lignes)
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"], J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."], // les caractères I J dessinés en pixels (5 colonnes sur 7 lignes)
    K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"], L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"], // les caractères K L dessinés en pixels (5 colonnes sur 7 lignes)
    M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"], N: ["#...#", "##..#", "#.#.#", "#.#.#", "#..##", "#...#", "#...#"], // les caractères M N dessinés en pixels (5 colonnes sur 7 lignes)
    O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."], P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."], // les caractères O P dessinés en pixels (5 colonnes sur 7 lignes)
    Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"], R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"], // les caractères Q R dessinés en pixels (5 colonnes sur 7 lignes)
    S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."], T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."], // les caractères S T dessinés en pixels (5 colonnes sur 7 lignes)
    U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."], V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."], // les caractères U V dessinés en pixels (5 colonnes sur 7 lignes)
    W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"], X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"], // les caractères W X dessinés en pixels (5 colonnes sur 7 lignes)
    Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."], Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"], // les caractères Y Z dessinés en pixels (5 colonnes sur 7 lignes)
    0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."], 1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."], // les caractères 0 1 dessinés en pixels (5 colonnes sur 7 lignes)
    2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"], 3: [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."], // les caractères 2 3 dessinés en pixels (5 colonnes sur 7 lignes)
    4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."], 5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."], // les caractères 4 5 dessinés en pixels (5 colonnes sur 7 lignes)
    6: ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."], 7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."], // les caractères 6 7 dessinés en pixels (5 colonnes sur 7 lignes)
    8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."], 9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."], // les caractères 8 9 dessinés en pixels (5 colonnes sur 7 lignes)
    ":": [".....", "..#..", "..#..", ".....", "..#..", "..#..", "....."], ".": [".....", ".....", ".....", ".....", ".....", "..#..", "..#.."], // les caractères : . dessinés en pixels (5 colonnes sur 7 lignes)
    "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."], "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."], // les caractères - + dessinés en pixels (5 colonnes sur 7 lignes)
    "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."], ",": [".....", ".....", ".....", ".....", "..#..", "..#..", ".#..."], // les caractères ' , dessinés en pixels (5 colonnes sur 7 lignes)
    "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."], "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."], // les caractères ! ? dessinés en pixels (5 colonnes sur 7 lignes)
    "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."], ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."], // les caractères ( ) dessinés en pixels (5 colonnes sur 7 lignes)
    "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."], "#": [".#.#.", ".#.#.", "#####", ".#.#.", "#####", ".#.#.", ".#.#."], // les caractères / # dessinés en pixels (5 colonnes sur 7 lignes)
    "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"], // les caractères & dessinés en pixels (5 colonnes sur 7 lignes)
    "^": ["..#..", ".###.", "#####", ".....", ".....", ".....", "....."], "~": [".....", ".....", ".....", "#####", ".###.", "..#..", "....."], // les caractères ^ ~ dessinés en pixels (5 colonnes sur 7 lignes)
    ">": ["#....", "##...", "###..", "####.", "###..", "##...", "#...."], "<": ["....#", "...##", "..###", ".####", "..###", "...##", "....#"] // les flèches > < (pour changer de classement)
};
export const LARGEUR_CASE = 6; // une lettre fait 5 colonnes + 1 d'espace ; l'ombre prend la colonne et la ligne de plus

export function creerPolice(scene, cle = "police_fin", bas = PAL.L) { // dessine une seule fois toutes les lettres dans une image, avec une « image » par caractère (bas : la couleur du bas des lettres ; la police « police_blanche » est toute blanche)
    const noms = Object.keys(GLYPHES); // la liste des caractères
    fabriquer(scene, cle, noms.length * LARGEUR_CASE, 8, (ctx, texture) => { // on fabrique la texture
    noms.forEach((nom, i) => { // pour chaque caractère
        const ox = i * LARGEUR_CASE; // son décalage dans l'image
        const cases = []; // la liste de ses pixels allumés
        GLYPHES[nom].forEach((ligne, y) => [...ligne].forEach((c, x) => { if (c === "#") cases.push([x, y]); })); // on repère les pixels allumés
        ctx.fillStyle = PAL.K; cases.forEach(([x, y]) => ctx.fillRect(ox + x + 1, y + 1, 1, 1)); // l'ombre portée
        cases.forEach(([x, y]) => { ctx.fillStyle = y <= 3 ? PAL.W : bas; ctx.fillRect(ox + x, y, 1, 1); }); // clair en haut, lavande en bas
        texture.add(nom, 0, ox, 0, LARGEUR_CASE, 8); // on découpe l'image de ce caractère
    }); // fin du caractère
    }, { net: true }); // net : pixel art, pas de flou quand on agrandit
}

// Les plaques : la même construction que celles du HUD (contour sombre, filet clair en haut, ombre en bas, rivets, coins coupés)
export function plaque(scene, w, h, creux = true) { // renvoie la clé de la texture ; w et h sont en pixels du dessin (agrandis à l'écran)
    const cle = "plaque_fin_" + w + "x" + h + (creux ? "c" : ""); // le nom de la texture selon sa taille
    fabriquer(scene, cle, w, h, (ctx) => { // on fabrique la texture
    const px = (x, y, k) => { ctx.fillStyle = PAL[k]; ctx.fillRect(x, y, 1, 1); }; // fonction qui peint un pixel
    const dedans = (x, y) => x >= 0 && x < w && y >= 0 && y < h && !((x < 2 || x >= w - 2) && (y < 2 || y >= h - 2)); // coins coupés
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { // on parcourt tous les pixels
        if (!dedans(x, y)) continue; // hors de la plaque : on passe
        const bord = !dedans(x - 1, y) || !dedans(x + 1, y) || !dedans(x, y - 1) || !dedans(x, y + 1); // vrai si ce pixel est au bord
        px(x, y, bord ? "K" : "c"); // bord sombre, intérieur de la plaque sinon
    } // fin de la boucle
    for (let x = 3; x <= w - 4; x++) px(x, 1, "n"); // filet lumineux en haut
    for (let x = 2; x <= w - 3; x++) px(x, h - 2, "b"); // ombre en bas
    [[3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4]].forEach(([x, y]) => px(x, y, "L")); // les 4 rivets
    if (creux) { // un creux sombre où s'inscrit le texte : ombre en haut à gauche, bord clair en bas à droite
        for (let y = 6; y < h - 6; y++) for (let x = 6; x < w - 6; x++) { // ...on parcourt les pixels du creux
            const hautGauche = y === 6 || x === 6; // vrai sur le bord haut ou gauche
            const basDroite = y === h - 7 || x === w - 7; // vrai sur le bord bas ou droit
            px(x, y, hautGauche ? "K" : basDroite ? "d" : "a"); // ombre en haut à gauche, bord clair en bas à droite
        }
    }
    }, { net: true }); // pixel art : pas de flou
    return cle; // on renvoie le nom de la texture
}
