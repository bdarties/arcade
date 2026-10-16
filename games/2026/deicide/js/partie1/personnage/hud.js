// HUD du joueur : barre de vie (barre_de_vie.js), jauge de dash, score et chrono.
//
// Tout est dessiné pixel par pixel avec la palette du Bot Wheel, comme la barre de vie. Le reste est
// fabriqué en code au moment de creerHud (aucune image en plus à charger).
//   - barre de vie : en haut à gauche, toujours affichée (5 PV par défaut).
//   - dash : une roue dont les crampons s'allument pendant la recharge ; elle clignote quand le dash est prêt.
//   - score et chrono : deux plaques en haut à droite. Le score a 6 chiffres (les zéros de devant sont atténués,
//     un chiffre qui change s'éclaire). Le chrono compte les minutes et les secondes (MM:SS) depuis le début.
// Le score et le chrono sont gardés dans scene.registry ("score", "chrono") pour rester
// les mêmes d'un niveau à l'autre. Le chrono ne tourne que dans les scènes qui ont un HUD.
//
// Utilisation :
//   preload() de "niveau1"    : chargerHud(this)
//   create()  d'un niveau     : this.hud = creerHud(this, this.player, this.pv)   (pv : PV de départ, 5 si on ne le donne pas)
//   quand les PV changent     : this.hud.majPV(this.pv)
//   quand le score change     : this.hud.ajouterScore(100) / this.hud.majScore(n)
//   pour repartir de 00:00    : this.hud.reinitialiserChrono()

import { chargerBarreDeVie, creerBarreDeVie, majBarreDeVie, PV_MAX_BARRE, ECHELLE_HUD, HAUTEUR_BARRE } from "./barre_de_vie.js"; // la barre de vie, ses dimensions et son agrandissement
import { rechargeDash } from "./personnage.js"; // la jauge de recharge du dash du robot
import { TOUCHES as RACCOURCIS, BOUTONS_BORNE } from "../systemes/raccourcis.js"; // les touches du jeu : l'aide affichée les lit

const ECHELLE = ECHELLE_HUD; // le HUD est plus gros que le robot (x2) pour rester lisible : on le règle dans barre_de_vie.js
const ECHELLE_TOUCHES = 2; // l'aide des touches, à droite, est plus petite que le reste du HUD
const MARGE = 24; // écart avec les bords de l'écran
const ECART = 10; // espace entre deux éléments empilés
const Y_BARRE = MARGE; // hauteur de la barre de vie à l'écran

// même palette que le dessin de la barre de vie : les 7 couleurs du Bot Wheel + m, n, G
const PAL = { // les couleurs du HUD, nommées par une lettre
    K: "#211924", a: "#251d2a", b: "#2f2535", c: "#372b3e", d: "#3f3249", // les teintes sombres
    m: "#5f4f6e", n: "#8a779b", L: "#ac98b6", W: "#e7e0e9", G: "#f5f0f8" // les teintes claires
};
const px = (ctx, x, y, k) => { ctx.fillStyle = PAL[k]; ctx.fillRect(x, y, 1, 1); }; // dessine un pixel de la couleur k à la position x, y

// --- jauge de dash : 20 x 20, 16 secteurs (comme les crampons du pneu). Images 0..15 = recharge, 16 = prêt, 17 = éclat blanc
const DASH_TAILLE = 20; // taille de la jauge de dash, en pixels
const Y_DASH = Y_BARRE + HAUTEUR_BARRE * ECHELLE + ECART; // sous la barre de vie
const SECTEURS = 16; // nombre de secteurs de la roue
const IMAGE_PRET = 16; // numéro de l'image « dash prêt »
const IMAGE_IMPULSION = 17; // numéro de l'image « éclat blanc »
const DUREE_IMPULSION = 140; // ms de l'éclat blanc quand le dash redevient disponible

// --- plaques de droite : score (en haut) et chrono (dessous). Plaque d'armure retournée :
// le bord plat est contre le bord de l'écran, le bout coupé et ses rivets sont à gauche.
const PLAQUE_DROITE_L = 72; // en pixels du dessin (agrandis par ECHELLE à l'écran)
const PLAQUE_DROITE_H = 18; // hauteur d'une plaque de droite
const Y_SCORE = MARGE; // hauteur du score à l'écran
const Y_CHRONO = Y_SCORE + PLAQUE_DROITE_H * ECHELLE + ECART; // hauteur du chrono, sous le score
const CREUX = { x: 29, y: 3, w: 40, h: 12 }; // le creux où s'allument les chiffres
const CHIFFRE_Y = 5; // ligne des chiffres dans la plaque (7 lignes de chiffre + 1 d'ombre)
const PAS_CHIFFRE = 6; // 5 colonnes de chiffre + 1 d'ombre
const SCORE_X = 31; // colonne du premier chiffre du score
const CHRONO_X = [35, 41, 51, 57]; // colonnes des chiffres du chrono : minutes (2), puis secondes (2)
const DEUX_POINTS_X = 47; // colonne des deux-points, entre les minutes et les secondes
const SCORE_CHIFFRES = 6; // le score a 6 chiffres
const SCORE_MAX = 999999; // le score ne dépasse pas 999 999
const CHRONO_MAX = 99 * 60 + 59; // en secondes : l'affichage s'arrête à 99:59
const DUREE_FLASH_CHIFFRE = 90; // ms d'éclat blanc quand un chiffre du score change
const IMAGE_DEUX_POINTS = 10; // images de "hud_chiffres" : 0 à 9, 10 = deux-points, 11 à 20 = les mêmes chiffres atténués
const IMAGE_ATTENUEE = 11; // numéro de la première image de chiffre atténué
const HAUTEUR_CHIFFRE = 8; // hauteur d'un chiffre, en pixels

const LETTRES = { // les lettres de la petite police, en pixels (# = pixel allumé)
    V: ["#...#", "#...#", ".#.#.", ".#.#.", "..#.."], // la lettre V, dessinée en pixels (# = pixel allumé)
    I: ["###", ".#.", ".#.", ".#.", "###"], // la lettre I, dessinée en pixels (# = pixel allumé)
    E: ["###", "#..", "###", "#..", "###"], // la lettre E, dessinée en pixels (# = pixel allumé)
    S: [".##", "#..", ".#.", "..#", "##."], // la lettre S, dessinée en pixels (# = pixel allumé)
    C: [".##", "#..", "#..", "#..", ".##"], // la lettre C, dessinée en pixels (# = pixel allumé)
    O: [".#.", "#.#", "#.#", "#.#", ".#."], // la lettre O, dessinée en pixels (# = pixel allumé)
    R: ["##.", "#.#", "##.", "#.#", "#.#"], // la lettre R, dessinée en pixels (# = pixel allumé)
    T: ["###", ".#.", ".#.", ".#.", ".#."], // la lettre T, dessinée en pixels (# = pixel allumé)
    M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"], // la lettre M, dessinée en pixels (# = pixel allumé)
    P: ["##.", "#.#", "##.", "#..", "#.."], // la lettre P, dessinée en pixels (# = pixel allumé)
    A: [".#.", "#.#", "###", "#.#", "#.#"], // la lettre A, dessinée en pixels (# = pixel allumé)
    B: ["##.", "#.#", "##.", "#.#", "##."], // la lettre B, dessinée en pixels (# = pixel allumé)
    D: ["##.", "#.#", "#.#", "#.#", "##."], // la lettre D, dessinée en pixels (# = pixel allumé)
    G: [".##", "#..", "#.#", "#.#", ".##"], // la lettre G, dessinée en pixels (# = pixel allumé)
    H: ["#.#", "#.#", "###", "#.#", "#.#"], // la lettre H, dessinée en pixels (# = pixel allumé)
    K: ["#.#", "#.#", "##.", "#.#", "#.#"], // la lettre K, dessinée en pixels (# = pixel allumé)
    L: ["#..", "#..", "#..", "#..", "###"], // la lettre L, dessinée en pixels (# = pixel allumé)
    U: ["#.#", "#.#", "#.#", "#.#", "###"] // la lettre U, dessinée en pixels (# = pixel allumé)
};

// --- aide des touches : une plaque sous le chrono, une ligne par action (la ou les touches, puis le mot).
// Ce sont les noms des boutons de la borne (A à F, voir gpio2keys.py) : A = touche I (saut), D = touche K (tir), E = touche L (dash).
// Les lettres viennent de raccourcis.js (TOUCHES.joueur1 et BOUTONS_BORNE) : pour changer une touche, c'est là-bas. Les flèches sont dessinées en dur.
const bouton = (touche) => BOUTONS_BORNE[touche] ?? touche; // le bouton de la borne de cette touche (A à F) ; sinon la touche elle-même (il faut alors son dessin dans LETTRES)
// Les noms "gauche", "droite", "haut", "bas" dessinent une flèche ; les autres noms sont des lettres de LETTRES.
const TOUCHES = [ // les lignes de l'aide : touches à afficher et mot qui les décrit
    { touches: ["gauche", "droite"], mot: "BOUGER" }, // flèches gauche/droite : bouger
    { touches: ["haut", "bas"], mot: "VISER" }, // flèches haut/bas : viser
    { touches: [bouton(RACCOURCIS.joueur1.saut)], mot: "SAUT" }, // bouton A : sauter
    { touches: [bouton(RACCOURCIS.joueur1.tir)], mot: "TIR" }, // bouton D : tirer
    { touches: [bouton(RACCOURCIS.joueur1.dash)], mot: "DASH" } // bouton E : dasher
];
const FLECHES = { // les dessins des 4 flèches
    gauche: ["..#..", ".##..", "#####", ".##..", "..#.."], // la flèche gauche, dessinée en pixels
    droite: ["..#..", "..##.", "#####", "..##.", "..#.."], // la flèche droite, dessinée en pixels
    haut: ["..#..", ".###.", "#.#.#", "..#..", "..#.."], // la flèche haut, dessinée en pixels
    bas: ["..#..", "..#..", "#.#.#", ".###.", "..#.."] // la flèche bas, dessinée en pixels
};
const TOUCHE_L = 9; // une touche : 9 colonnes sur 9 lignes, plus 1 ligne d'ombre dessous
const LIGNE_TOUCHES = 12; // hauteur d'une ligne de l'aide
const AIDE_L = 56; // largeur de l'aide, en pixels
const AIDE_H = TOUCHES.length * LIGNE_TOUCHES + 4; // hauteur de l'aide : une ligne par action
const AIDE_MOT_X = 27; // colonne où commencent les mots
const AIDE_TOUCHES_FIN = 23; // les touches sont alignées à droite, jusqu'à cette colonne

// chiffres : 5 colonnes sur 7 lignes
const CHIFFRES = [ // les 10 chiffres, 5 colonnes sur 7 lignes
    [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."], // le chiffre 0, dessiné en pixels
    ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."], // le chiffre 1, dessiné en pixels
    [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"], // le chiffre 2, dessiné en pixels
    [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."], // le chiffre 3, dessiné en pixels
    ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."], // le chiffre 4, dessiné en pixels
    ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."], // le chiffre 5, dessiné en pixels
    ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."], // le chiffre 6, dessiné en pixels
    ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."], // le chiffre 7, dessiné en pixels
    [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."], // le chiffre 8, dessiné en pixels
    [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."] // le chiffre 9, dessiné en pixels
];
const DEUX_POINTS = ["...", ".#.", ".#.", "...", ".#.", ".#.", "..."]; // les deux-points du chrono

// à appeler dans preload()
export function chargerHud(scene) { // charge les images du HUD (appelée dans preload)
    chargerBarreDeVie(scene); // on charge la barre de vie
}

// Crée le HUD. joueur sert à la jauge de dash. pv (facultatif) : les PV de départ, PV_MAX_BARRE (5) si on ne le donne pas.
export function creerHud(scene, joueur, pv) { // crée tout le HUD du niveau
    creerTextures(scene); // on fabrique les images du HUD
    const poser = (image) => image.setOrigin(0, 0).setScale(ECHELLE).setScrollFactor(0).setDepth(100); // fixe à l'écran, au-dessus du décor
    const hud = { scene, joueur, impulsion: false, dashPret: true, secondesAffichees: -1 }; // l'objet qui garde tout le HUD

    // barre de vie : toujours affichée, même dans un niveau qui n'a pas encore de règles de dégâts
    hud.barre = creerBarreDeVie(scene, MARGE, Y_BARRE, pv ?? PV_MAX_BARRE); // la barre de vie en haut à gauche

    // jauge de dash, sous la barre de vie
    hud.dash = poser(scene.add.image(MARGE, Y_DASH, "hud_dash", IMAGE_PRET)); // la jauge de dash sous la barre de vie
    // score et chrono, à droite : la valeur vit dans le registre du jeu (elle passe d'un niveau à l'autre)
    if (scene.registry.get("score") === undefined) scene.registry.set("score", 0); // le score est gardé dans le registre du jeu : zéro au départ
    if (scene.registry.get("chrono") === undefined) scene.registry.set("chrono", 0); // le chrono aussi
    const droite = scene.cameras.main.width - MARGE - PLAQUE_DROITE_L * ECHELLE; // plaques collées à la marge de droite
    const chiffre = (yPlaque, colonne, image) => poser(scene.add.image(droite + colonne * ECHELLE, yPlaque + CHIFFRE_Y * ECHELLE, "hud_chiffres", image)); // fonction qui pose un chiffre dans une plaque
    hud.plaqueScore = poser(scene.add.image(droite, Y_SCORE, "hud_plaque_score")); // la plaque du score
    hud.plaqueChrono = poser(scene.add.image(droite, Y_CHRONO, "hud_plaque_chrono")); // la plaque du chrono
    hud.chiffresScore = Array.from({ length: SCORE_CHIFFRES }, (_, i) => chiffre(Y_SCORE, SCORE_X + i * PAS_CHIFFRE, 0)); // les 6 chiffres du score
    hud.chiffresChrono = CHRONO_X.map((colonne) => chiffre(Y_CHRONO, colonne, 0)); // les 4 chiffres du chrono
    chiffre(Y_CHRONO, DEUX_POINTS_X, IMAGE_DEUX_POINTS); // les deux-points du chrono
    afficherScore(hud, false); // on affiche le score sans animation
    afficherChrono(hud); // on affiche le chrono

    // aide des touches, sous le chrono et plus petite que le reste du HUD
    const aideX = scene.cameras.main.width - MARGE - AIDE_L * ECHELLE_TOUCHES; // x de l'aide des touches
    const aideY = Y_CHRONO + PLAQUE_DROITE_H * ECHELLE + ECART; // y de l'aide des touches : sous le chrono
    hud.aideTouches = scene.add.image(aideX, aideY, "hud_aide_touches").setOrigin(0, 0).setScale(ECHELLE_TOUCHES).setScrollFactor(0).setDepth(100); // l'image de l'aide des touches

    const majChaqueImage = (temps, delta) => { majDash(hud); majChrono(hud, delta); }; // à chaque image : on met à jour la jauge de dash et le chrono
    const auReveil = () => synchroniser(hud); // le score a pu changer dans un autre niveau pendant que celui-ci dormait
    scene.events.on(Phaser.Scenes.Events.UPDATE, majChaqueImage); // on branche la mise à jour sur chaque image
    scene.events.on(Phaser.Scenes.Events.WAKE, auReveil); // et la remise à jour sur le réveil du niveau
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { // quand la scène s'arrête...
        scene.events.off(Phaser.Scenes.Events.UPDATE, majChaqueImage); // ...on débranche la mise à jour...
        scene.events.off(Phaser.Scenes.Events.WAKE, auReveil); // ...et la remise à jour
    });

    hud.majPV = (nouveauxPV) => majBarreDeVie(hud.barre, nouveauxPV); // met à jour la barre de vie
    hud.majScore = (n) => majScore(hud, n); // met le score à une valeur donnée
    hud.ajouterScore = (n) => majScore(hud, scene.registry.get("score") + n); // ajoute des points au score
    hud.reinitialiserChrono = () => { // remet le chrono à zéro
        scene.registry.set("chrono", 0); // le chrono revient à 0
        hud.secondesAffichees = -1; // force l'affichage de 00:00
        afficherChrono(hud); // on affiche 00:00
    };
    return hud; // on renvoie le HUD
}

// ---------------------------------------------------------------------------------------------
// Score et chrono
// ---------------------------------------------------------------------------------------------

function majScore(hud, n) { // change le score et l'affiche
    hud.scene.registry.set("score", Phaser.Math.Clamp(Math.round(n), 0, SCORE_MAX)); // le score reste entre 0 et 999 999
    afficherScore(hud, true); // on l'affiche avec animation
}

// anime = true : les chiffres qui changent s'éclairent (pas à la création ni au réveil du niveau)
function afficherScore(hud, anime) { // affiche le score chiffre par chiffre
    const texte = String(Phaser.Math.Clamp(Math.floor(hud.scene.registry.get("score")), 0, SCORE_MAX)).padStart(SCORE_CHIFFRES, "0"); // le score en texte de 6 chiffres (avec des zéros devant)
    const premier = texte.search(/[1-9]/); // premier chiffre qui n'est pas un zéro (-1 : le score est 0)
    const attenues = premier === -1 ? SCORE_CHIFFRES - 1 : premier; // les zéros de devant sont atténués ; le dernier chiffre reste allumé
    hud.chiffresScore.forEach((image, i) => { // pour chaque chiffre
        const numero = (i < attenues ? IMAGE_ATTENUEE : 0) + Number(texte[i]); // image à afficher : le chiffre, atténué si c'est un zéro de devant
        if (image.numero === numero) return; // ce chiffre n'a pas changé
        image.numero = numero; // on retient le chiffre affiché
        image.setFrame(numero); // on affiche cette image
        if (anime) { // si on anime...
            image.setTintFill(0xffffff); // flash blanc, comme une vie qui se rallume
            hud.scene.time.delayedCall(DUREE_FLASH_CHIFFRE, () => { if (image.active) image.clearTint(); }); // au bout de 90 ms, le chiffre reprend sa couleur
        }
    });
}

// le chrono compte le temps passé dans les scènes qui ont un HUD (delta = ms depuis l'image précédente)
function majChrono(hud, delta) { // fait avancer le chrono
    const registre = hud.scene.registry; // le registre du jeu
    if (registre.get("chronoActif") === false) return; // partie finie : le chrono est arrêté (écrit dans points.js, finirPartie)
    registre.set("chrono", registre.get("chrono") + delta); // on ajoute le temps écoulé depuis la dernière image
    afficherChrono(hud); // on affiche le nouveau temps
}

function afficherChrono(hud) { // affiche le chrono en minutes et secondes
    const secondes = Math.min(CHRONO_MAX, Math.floor(hud.scene.registry.get("chrono") / 1000)); // le temps en secondes (limité à 99:59)
    if (secondes === hud.secondesAffichees) return; // rien à redessiner tant que la seconde ne change pas
    hud.secondesAffichees = secondes; // on retient la seconde affichée
    const minutes = Math.floor(secondes / 60); // les minutes
    const reste = secondes % 60; // les secondes restantes
    [Math.floor(minutes / 10), minutes % 10, Math.floor(reste / 10), reste % 10].forEach((n, i) => hud.chiffresChrono[i].setFrame(n)); // on met chaque chiffre à jour
}

// ---------------------------------------------------------------------------------------------
// Jauge de dash
// ---------------------------------------------------------------------------------------------

function majDash(hud) { // met à jour la jauge de dash
    if (!hud.joueur || !hud.dash.active) return; // pas de robot ou jauge détruite : rien
    const recharge = rechargeDash(hud.joueur); // 0..1
    const pret = recharge >= 1; // vrai si le dash est rechargé
    if (pret && !hud.dashPret) { // le dash vient de redevenir disponible : petit éclat blanc
        hud.impulsion = true; // on note l'éclat en cours
        hud.dash.setFrame(IMAGE_IMPULSION); // on affiche l'image d'éclat
        hud.scene.time.delayedCall(DUREE_IMPULSION, () => { // au bout d'un instant...
            hud.impulsion = false; // ...l'éclat s'arrête...
            if (hud.dash.active) hud.dash.setFrame(IMAGE_PRET); // ...et la jauge revient à « prêt »
        });
    }
    hud.dashPret = pret; // on retient si le dash était prêt
    if (!hud.impulsion) hud.dash.setFrame(pret ? IMAGE_PRET : Math.floor(recharge * SECTEURS)); // sinon on affiche l'image qui correspond à la recharge
}

// remet le score et le chrono d'après le registre, sans animation (au réveil d'un niveau)
function synchroniser(hud) { // remet score et chrono à jour sans animation
    afficherScore(hud, false); // on affiche le score sans animation
    hud.secondesAffichees = -1; // on force l'affichage du chrono
    afficherChrono(hud); // on affiche le chrono
}

// ---------------------------------------------------------------------------------------------
// Dessin des textures (pixel par pixel, sur des canvas)
// ---------------------------------------------------------------------------------------------

function creerTextures(scene) { // fabrique toutes les images du HUD en les dessinant en code
    const fabriquer = (cle, largeur, hauteur, dessiner, images) => { // fonction qui fabrique une image dessinée
        if (scene.textures.exists(cle)) return; // déjà créée (autre niveau, ou scène relancée)
        const texture = scene.textures.createCanvas(cle, largeur, hauteur); // on crée l'image vide
        dessiner(texture.getContext()); // on la dessine
        (images || []).forEach(([nom, x, y, w, h]) => texture.add(nom, 0, x, y, w, h)); // découpe en images numérotées
        texture.refresh(); // on envoie le dessin à la carte graphique
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
    };
    const imagesDash = Array.from({ length: 18 }, (_, i) => [i, 0, i * DASH_TAILLE, DASH_TAILLE, DASH_TAILLE]); // les 18 images de la jauge de dash
    fabriquer("hud_dash", DASH_TAILLE, DASH_TAILLE * 18, (ctx) => imagesDash.forEach(([i]) => dessinerRoueDash(ctx, i * DASH_TAILLE, i)), imagesDash); // on fabrique la jauge de dash
    fabriquer("hud_plaque_score", PLAQUE_DROITE_L, PLAQUE_DROITE_H, (ctx) => dessinerPlaqueDroite(ctx, "SCORE")); // la plaque du score
    fabriquer("hud_plaque_chrono", PLAQUE_DROITE_L, PLAQUE_DROITE_H, (ctx) => dessinerPlaqueDroite(ctx, "TEMPS")); // la plaque du chrono
    fabriquer("hud_aide_touches", AIDE_L, AIDE_H, (ctx) => dessinerAideTouches(ctx)); // l'aide des touches
    // les chiffres, empilés : 0 à 9 (lignes 0 à 79), deux-points (80), puis 0 à 9 atténués (88 et suivantes)
    const imagesChiffres = [ // les images des chiffres : normaux, deux-points, atténués
        ...CHIFFRES.map((_, i) => [i, 0, i * HAUTEUR_CHIFFRE, 6, HAUTEUR_CHIFFRE]), // les chiffres normaux
        [IMAGE_DEUX_POINTS, 0, 10 * HAUTEUR_CHIFFRE, 4, HAUTEUR_CHIFFRE], // les deux-points
        ...CHIFFRES.map((_, i) => [IMAGE_ATTENUEE + i, 0, (11 + i) * HAUTEUR_CHIFFRE, 6, HAUTEUR_CHIFFRE]) // les chiffres atténués
    ];
    fabriquer("hud_chiffres", 6, HAUTEUR_CHIFFRE * 21, (ctx) => { // on fabrique l'image des chiffres
        CHIFFRES.forEach((glyphe, i) => { // pour chaque chiffre
            dessinerChiffre(ctx, glyphe, i * HAUTEUR_CHIFFRE, false); // on le dessine en clair
            dessinerChiffre(ctx, glyphe, (11 + i) * HAUTEUR_CHIFFRE, true); // et en atténué
        });
        dessinerChiffre(ctx, DEUX_POINTS, 10 * HAUTEUR_CHIFFRE, false); // on dessine les deux-points
    }, imagesChiffres); // avec la liste des images à découper
}

// plaque d'armure retournée (bord plat à droite, bout coupé et rivets à gauche), sans rien dedans :
// sert au score, au chrono et à l'aide des touches
function plaqueRetournee(ctx, L, H) { // dessine une plaque d'armure retournée
    const dans = (x, y) => x >= 0 && x < L && y >= 0 && y < H && !(x === 0 && (y === 0 || y === H - 1)); // vrai si ce pixel est dans la plaque (les coins sont coupés)
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { // on parcourt tous les pixels
        if (!dans(x, y)) continue; // hors de la plaque : on passe
        const bord = !dans(x - 1, y) || !dans(x + 1, y) || !dans(x, y - 1) || !dans(x, y + 1); // vrai si ce pixel est au bord
        px(ctx, x, y, bord ? "K" : "c"); // bord sombre, intérieur de la plaque sinon
    }
    for (let x = 2; x <= L - 2; x++) px(ctx, x, 1, "n"); // filet lumineux en haut
    for (let x = 1; x <= L - 2; x++) px(ctx, x, H - 2, "b"); // ombre en bas
    px(ctx, 1, 4, "L"); px(ctx, 1, H - 5, "L"); // rivets du bout
}

// plaque du score ou du chrono : le mot à gauche et le creux où s'allument les chiffres à droite
function dessinerPlaqueDroite(ctx, mot) { // dessine la plaque du score ou du chrono
    plaqueRetournee(ctx, PLAQUE_DROITE_L, PLAQUE_DROITE_H); // la plaque vide
    texte(ctx, mot, 5, 6); // le mot (SCORE ou TEMPS)
    for (let y = CREUX.y; y < CREUX.y + CREUX.h; y++) for (let x = CREUX.x; x < CREUX.x + CREUX.w; x++) { // on parcourt les pixels du creux des chiffres
        const hautGauche = y === CREUX.y || x === CREUX.x; // vrai sur le bord haut ou gauche
        const basDroite = y === CREUX.y + CREUX.h - 1 || x === CREUX.x + CREUX.w - 1; // vrai sur le bord bas ou droit
        px(ctx, x, y, hautGauche ? "K" : basDroite ? "d" : "a"); // creux : ombre en haut à gauche, bord clair en bas à droite
    }
}

// aide des touches : la plaque retournée, avec une ligne par action de TOUCHES (les touches alignées à droite, puis le mot)
function dessinerAideTouches(ctx) { // dessine l'aide des touches
    plaqueRetournee(ctx, AIDE_L, AIDE_H); // la plaque vide
    TOUCHES.forEach(({ touches, mot }, i) => { // pour chaque ligne de l'aide
        const y = 3 + i * LIGNE_TOUCHES; // hauteur de la ligne
        const x0 = AIDE_TOUCHES_FIN - (touches.length * (TOUCHE_L + 1) - 1); // x de la première touche (alignées à droite)
        touches.forEach((nom, j) => dessinerTouche(ctx, x0 + j * (TOUCHE_L + 1), y, nom)); // on dessine chaque touche
        texte(ctx, mot, AIDE_MOT_X, y + 2); // le mot à côté des touches
    });
}

// une touche de clavier en relief en (x, y) : dessus lavande avec un reflet en haut, bord sombre aux coins coupés,
// ombre dessous, et le dessin de la touche (flèche ou lettre) en foncé au milieu
function dessinerTouche(ctx, x, y, nom) { // dessine une touche de clavier en relief
    const dans = (cx, cy) => cx >= 0 && cx < TOUCHE_L && cy >= 0 && cy < 9 && !((cx === 0 || cx === TOUCHE_L - 1) && (cy === 0 || cy === 8)); // vrai si ce pixel est dans la touche (coins coupés)
    for (let cy = 0; cy < 9; cy++) for (let cx = 0; cx < TOUCHE_L; cx++) { // on parcourt tous les pixels de la touche
        if (!dans(cx, cy)) continue; // hors de la touche : on passe
        const bord = !dans(cx - 1, cy) || !dans(cx + 1, cy) || !dans(cx, cy - 1) || !dans(cx, cy + 1); // vrai si ce pixel est au bord
        px(ctx, x + cx, y + cy, bord ? "K" : cy === 1 ? "W" : cy === 7 ? "n" : "L"); // couleur : bord, reflet en haut, ombre en bas, ou dessus de la touche
    }
    for (let cx = 1; cx < TOUCHE_L - 1; cx++) px(ctx, x + cx, y + 9, "b"); // ombre sous la touche
    const glyphe = FLECHES[nom] ?? LETTRES[nom]; // le dessin de la touche : une flèche ou une lettre
    const decalage = Math.floor((TOUCHE_L - 2 - glyphe[0].length) / 2); // centré dans les 7 colonnes du dessus
    glyphe.forEach((ligne, gy) => [...ligne].forEach((c, gx) => { if (c === "#") px(ctx, x + 1 + decalage + gx, y + 2 + gy, "a"); })); // on dessine chaque pixel du motif
}

// un chiffre (ou les deux-points) en (0, oy) : clair en haut, lavande en bas, sur une ombre portée ; atténué : les mêmes en sombre
function dessinerChiffre(ctx, glyphe, oy, attenue) { // dessine un chiffre avec son ombre
    const cases = []; // la liste des pixels allumés
    glyphe.forEach((ligne, y) => [...ligne].forEach((c, x) => { if (c === "#") cases.push([x, y]); })); // on repère les pixels allumés
    cases.forEach(([x, y]) => px(ctx, x + 1, oy + y + 1, "K")); // d'abord l'ombre, décalée d'un pixel
    cases.forEach(([x, y]) => px(ctx, x, oy + y, attenue ? (y <= 3 ? "m" : "d") : (y <= 3 ? "W" : "L"))); // puis le chiffre : clair en haut, lavande en bas (ou sombre si atténué)
}

// petite police, deux tons (haut clair, bas lavande) sur une ombre portée
function texte(ctx, s, x0, y0) { // dessine un mot avec la petite police
    const cases = []; let x = x0; // la liste des pixels et la position x de la lettre
    [...s].forEach((ch) => { // pour chaque lettre du mot
        const lettre = LETTRES[ch]; // son dessin
        lettre.forEach((ligne, dy) => [...ligne].forEach((c, dx) => { if (c === "#") cases.push([x + dx, y0 + dy, dy]); })); // on repère ses pixels allumés
        x += lettre[0].length + 1; // on avance d'une lettre
    });
    cases.forEach(([cx, cy]) => px(ctx, cx + 1, cy + 1, "K")); // on dessine d'abord l'ombre de chaque pixel, décalée d'un pixel
    cases.forEach(([cx, cy, dy]) => px(ctx, cx, cy, dy <= 2 ? "W" : "L")); // puis la lettre : clair en haut, lavande en bas
}

// La roue de dash. secteursAllumes 0..15 = recharge en cours ; 16 = prêt ; 17 = éclat blanc (dash de nouveau disponible).
// Les secteurs se remplissent dans le sens des aiguilles d'une montre depuis le haut, comme les crampons du pneu.
function dessinerRoueDash(ctx, oy, secteursAllumes) { // dessine une image de la roue de dash
    const impulsion = secteursAllumes === IMAGE_IMPULSION; // vrai pour l'image d'éclat blanc
    const pret = secteursAllumes >= IMAGE_PRET; // vrai pour l'image « prêt »
    const cx = 10, cy = 10; // le centre de la roue
    const put = (x, y, k) => px(ctx, x, oy + y, k); // dessine un pixel de la roue à sa place dans la bande
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) { // on parcourt les 20 x 20 pixels de l'image
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.hypot(dx, dy); // position du pixel par rapport au centre, et sa distance
        if (r > 10) continue; // hors du cercle : on passe
        let k; // la couleur de ce pixel, choisie ci-dessous
        if (r > 9.3) k = impulsion ? "W" : "K";                              // contour
        else if (r > 6.9) {                                                   // pneu : 16 secteurs
            const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI); // 0 en haut, sens horaire
            const s = Math.floor(angle / (2 * Math.PI) * SECTEURS); // le numéro du secteur où se trouve ce pixel
            const allume = impulsion || pret || s < secteursAllumes; // vrai si ce secteur est allumé (recharge faite jusque-là)
            k = impulsion ? (s % 2 ? "G" : "W") : allume ? (s % 2 ? "W" : "L") : (s % 2 ? "c" : "b"); // couleur du secteur : alternance claire/foncée, allumé ou éteint
        } else if (r > 6.1) k = impulsion ? "W" : "K";                       // joint pneu / moyeu
        else if (impulsion) k = "W";                                          // moyeu
        else if (pret) k = dx + dy < -3.2 ? "W" : dx + dy > 3.8 ? "n" : "L"; // le moyeu quand le dash est prêt : dégradé du clair au foncé
        else k = dx + dy < -3.2 ? "c" : dx + dy > 3.8 ? "b" : "d"; // le moyeu pendant la recharge : plus sombre
        put(x, y, k); // on dessine le pixel
    }
    // deux chevrons ">>" : le symbole du dash
    const chevrons = [[8, 9], [9, 10], [8, 11], [11, 9], [12, 10], [11, 11]]; // les pixels des deux chevrons >>
    chevrons.forEach(([x, y]) => put(x, y, impulsion ? "L" : pret ? "K" : "b")); // on les dessine au centre de la roue
}
