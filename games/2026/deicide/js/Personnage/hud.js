// HUD du joueur : barre de vie (barreDeVie.js), vies, jauge de dash, score et chrono.
//
// Tout est dessiné pixel par pixel avec la palette du Bot Wheel, comme la barre de vie. Le reste est
// fabriqué en code au moment de creerHud (aucune image en plus à charger).
//   - barre de vie : en haut à gauche, toujours affichée (5 PV par défaut).
//   - vies : une plaque "VIES" avec une mini-tête du robot par vie. Une vie perdue s'éteint et se brise en éclats.
//   - dash : une roue dont les crampons s'allument pendant la recharge ; elle clignote quand le dash est prêt.
//   - score et chrono : deux plaques en haut à droite. Le score a 6 chiffres (les zéros de devant sont atténués,
//     un chiffre qui change s'éclaire). Le chrono compte les minutes et les secondes (MM:SS) depuis le début.
// Les vies, le score et le chrono sont gardés dans scene.registry ("vies", "score", "chrono") pour rester
// les mêmes d'un niveau à l'autre. Le chrono ne tourne que dans les scènes qui ont un HUD.
//
// Utilisation :
//   preload() de "niveau1"    : chargerHud(this)
//   create()  d'un niveau     : this.hud = creerHud(this, this.player, this.pv)   (pv : PV de départ, 5 si on ne le donne pas)
//   quand les PV changent     : this.hud.majPV(this.pv)
//   quand les vies changent   : this.hud.perdreVie() / this.hud.gagnerVie() / this.hud.majVies(n)
//   quand le score change     : this.hud.ajouterScore(100) / this.hud.majScore(n)
//   pour repartir de 00:00    : this.hud.reinitialiserChrono()

import { chargerBarreDeVie, creerBarreDeVie, majBarreDeVie, PV_MAX_BARRE, ECHELLE_HUD, HAUTEUR_BARRE } from "./barreDeVie.js";
import { rechargeDash } from "./personnage.js";

const ECHELLE = ECHELLE_HUD; // le HUD est plus gros que le robot (x2) pour rester lisible : on le règle dans barreDeVie.js
const ECHELLE_TOUCHES = 2; // l'aide des touches, à droite, est plus petite que le reste du HUD
const MARGE = 24; // écart avec les bords de l'écran
const ECART = 10; // espace entre deux éléments empilés
const Y_BARRE = MARGE;
const VIES_DEPART = 3;
const VIES_MAX = 3; // nombre de cases sur la plaque

// même palette que le dessin de la barre de vie : les 7 couleurs du Bot Wheel + m, n, G
const PAL = {
    K: "#211924", a: "#251d2a", b: "#2f2535", c: "#372b3e", d: "#3f3249",
    m: "#5f4f6e", n: "#8a779b", L: "#ac98b6", W: "#e7e0e9", G: "#f5f0f8"
};
const px = (ctx, x, y, k) => { ctx.fillStyle = PAL[k]; ctx.fillRect(x, y, 1, 1); };

// --- plaque des vies (16 pixels de haut, 12 x 12 par case)
const PLAQUE_H = 16;
const plaqueLargeur = (n) => 23 + 13 * n;
const caseX = (i) => 22 + 13 * i; // colonne de la case i dans la plaque
const CASE_Y = 2;

// --- jauge de dash : 20 x 20, 16 secteurs (comme les crampons du pneu). Images 0..15 = recharge, 16 = prêt, 17 = éclat blanc
const DASH_TAILLE = 20;
const Y_VIES = Y_BARRE + HAUTEUR_BARRE * ECHELLE + ECART; // sous la barre de vie
const Y_DASH = Y_VIES + (PLAQUE_H - DASH_TAILLE) * ECHELLE / 2; // centrée sur la plaque des vies
const SECTEURS = 16;
const IMAGE_PRET = 16;
const IMAGE_IMPULSION = 17;
const DUREE_IMPULSION = 140; // ms de l'éclat blanc quand le dash redevient disponible

// --- animation d'une vie perdue ou gagnée
const DUREE_FLASH_VIE = 90;
const ECLATS_PAR_VIE = 8;
const COULEURS_ECLATS = [0xe7e0e9, 0xac98b6, 0x372b3e, 0x251d2a];

// --- plaques de droite : score (en haut) et chrono (dessous). Même plaque d'armure que celle des vies, retournée :
// le bord plat est contre le bord de l'écran, le bout coupé et ses rivets sont à gauche.
const PLAQUE_DROITE_L = 72; // en pixels du dessin (agrandis par ECHELLE à l'écran)
const PLAQUE_DROITE_H = 18;
const Y_SCORE = MARGE;
const Y_CHRONO = Y_SCORE + PLAQUE_DROITE_H * ECHELLE + ECART; // les deux plaques finissent à la même hauteur que la plaque des vies
const CREUX = { x: 29, y: 3, w: 40, h: 12 }; // le creux où s'allument les chiffres
const CHIFFRE_Y = 5; // ligne des chiffres dans la plaque (7 lignes de chiffre + 1 d'ombre)
const PAS_CHIFFRE = 6; // 5 colonnes de chiffre + 1 d'ombre
const SCORE_X = 31; // colonne du premier chiffre du score
const CHRONO_X = [35, 41, 51, 57]; // colonnes des chiffres du chrono : minutes (2), puis secondes (2)
const DEUX_POINTS_X = 47; // colonne des deux-points, entre les minutes et les secondes
const SCORE_CHIFFRES = 6;
const SCORE_MAX = 999999;
const CHRONO_MAX = 99 * 60 + 59; // en secondes : l'affichage s'arrête à 99:59
const DUREE_FLASH_CHIFFRE = 90; // ms d'éclat blanc quand un chiffre du score change
const IMAGE_DEUX_POINTS = 10; // images de "hud_chiffres" : 0 à 9, 10 = deux-points, 11 à 20 = les mêmes chiffres atténués
const IMAGE_ATTENUEE = 11;
const HAUTEUR_CHIFFRE = 8;

const LETTRES = {
    V: ["#...#", "#...#", ".#.#.", ".#.#.", "..#.."],
    I: ["###", ".#.", ".#.", ".#.", "###"],
    E: ["###", "#..", "###", "#..", "###"],
    S: [".##", "#..", ".#.", "..#", "##."],
    C: [".##", "#..", "#..", "#..", ".##"],
    O: [".#.", "#.#", "#.#", "#.#", ".#."],
    R: ["##.", "#.#", "##.", "#.#", "#.#"],
    T: ["###", ".#.", ".#.", ".#.", ".#."],
    M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
    P: ["##.", "#.#", "##.", "#..", "#.."],
    A: [".#.", "#.#", "###", "#.#", "#.#"],
    B: ["##.", "#.#", "##.", "#.#", "##."],
    D: ["##.", "#.#", "#.#", "#.#", "##."],
    G: [".##", "#..", "#.#", "#.#", ".##"],
    H: ["#.#", "#.#", "###", "#.#", "#.#"],
    K: ["#.#", "#.#", "##.", "#.#", "#.#"],
    U: ["#.#", "#.#", "#.#", "#.#", "###"]
};

// --- aide des touches : une plaque sous le chrono, une ligne par action (la ou les touches, puis le mot).
// Pour changer une touche : modifier sa ligne ici ET la touche dans personnage.js (addKeys) ou dans les niveaux.
// Les noms "gauche", "droite", "haut", "bas" dessinent une flèche ; les autres noms sont des lettres de LETTRES.
const TOUCHES = [
    { touches: ["gauche", "droite"], mot: "BOUGER" },
    { touches: ["haut"], mot: "SAUT" },
    { touches: ["I"], mot: "TIR" },
    { touches: ["K"], mot: "DASH" },
    { touches: ["O"], mot: "PORTE" }
];
const FLECHES = {
    gauche: ["..#..", ".##..", "#####", ".##..", "..#.."],
    droite: ["..#..", "..##.", "#####", "..##.", "..#.."],
    haut: ["..#..", ".###.", "#.#.#", "..#..", "..#.."],
    bas: ["..#..", "..#..", "#.#.#", ".###.", "..#.."]
};
const TOUCHE_L = 9; // une touche : 9 colonnes sur 9 lignes, plus 1 ligne d'ombre dessous
const LIGNE_TOUCHES = 12; // hauteur d'une ligne de l'aide
const AIDE_L = 56;
const AIDE_H = TOUCHES.length * LIGNE_TOUCHES + 4;
const AIDE_MOT_X = 27; // colonne où commencent les mots
const AIDE_TOUCHES_FIN = 23; // les touches sont alignées à droite, jusqu'à cette colonne

// chiffres : 5 colonnes sur 7 lignes
const CHIFFRES = [
    [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
    ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
    ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
    ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
    ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
    ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
    [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."]
];
const DEUX_POINTS = ["...", ".#.", ".#.", "...", ".#.", ".#.", "..."];

// à appeler dans preload()
export function chargerHud(scene) {
    chargerBarreDeVie(scene);
}

// Crée le HUD. joueur sert à la jauge de dash. pv (facultatif) : les PV de départ, PV_MAX_BARRE (5) si on ne le donne pas.
export function creerHud(scene, joueur, pv) {
    creerTextures(scene);
    const poser = (image) => image.setOrigin(0, 0).setScale(ECHELLE).setScrollFactor(0).setDepth(100); // fixe à l'écran, au-dessus du décor
    const hud = { scene, joueur, viesMax: VIES_MAX, impulsion: false, dashPret: true, secondesAffichees: -1 };

    // barre de vie : toujours affichée, même dans un niveau qui n'a pas encore de règles de dégâts
    hud.barre = creerBarreDeVie(scene, MARGE, Y_BARRE, pv ?? PV_MAX_BARRE);

    // vies : la valeur vit dans le registre du jeu, donc elle passe d'un niveau à l'autre
    if (scene.registry.get("vies") === undefined) scene.registry.set("vies", VIES_DEPART);
    hud.viesAffichees = Phaser.Math.Clamp(scene.registry.get("vies"), 0, VIES_MAX);
    hud.plaque = poser(scene.add.image(MARGE, Y_VIES, "hud_plaque_vies"));
    hud.icones = [];
    for (let i = 0; i < VIES_MAX; i++) {
        hud.icones.push(poser(scene.add.image(MARGE + caseX(i) * ECHELLE, Y_VIES + CASE_Y * ECHELLE, "hud_vie", i < hud.viesAffichees ? 0 : 1)));
    }

    // jauge de dash, à droite de la plaque des vies
    hud.dash = poser(scene.add.image(MARGE + plaqueLargeur(VIES_MAX) * ECHELLE + ECART, Y_DASH, "hud_dash", IMAGE_PRET));
    // score et chrono, à droite : la valeur vit dans le registre du jeu, comme les vies
    if (scene.registry.get("score") === undefined) scene.registry.set("score", 0);
    if (scene.registry.get("chrono") === undefined) scene.registry.set("chrono", 0);
    const droite = scene.cameras.main.width - MARGE - PLAQUE_DROITE_L * ECHELLE; // plaques collées à la marge de droite
    const chiffre = (yPlaque, colonne, image) => poser(scene.add.image(droite + colonne * ECHELLE, yPlaque + CHIFFRE_Y * ECHELLE, "hud_chiffres", image));
    hud.plaqueScore = poser(scene.add.image(droite, Y_SCORE, "hud_plaque_score"));
    hud.plaqueChrono = poser(scene.add.image(droite, Y_CHRONO, "hud_plaque_chrono"));
    hud.chiffresScore = Array.from({ length: SCORE_CHIFFRES }, (_, i) => chiffre(Y_SCORE, SCORE_X + i * PAS_CHIFFRE, 0));
    hud.chiffresChrono = CHRONO_X.map((colonne) => chiffre(Y_CHRONO, colonne, 0));
    chiffre(Y_CHRONO, DEUX_POINTS_X, IMAGE_DEUX_POINTS);
    afficherScore(hud, false);
    afficherChrono(hud);

    // aide des touches, sous le chrono et plus petite que le reste du HUD
    const aideX = scene.cameras.main.width - MARGE - AIDE_L * ECHELLE_TOUCHES;
    const aideY = Y_CHRONO + PLAQUE_DROITE_H * ECHELLE + ECART;
    hud.aideTouches = scene.add.image(aideX, aideY, "hud_aide_touches").setOrigin(0, 0).setScale(ECHELLE_TOUCHES).setScrollFactor(0).setDepth(100);

    const majChaqueImage = (temps, delta) => { majDash(hud); majChrono(hud, delta); };
    const auReveil = () => synchroniser(hud); // les vies et le score ont pu changer dans un autre niveau pendant que celui-ci dormait
    scene.events.on(Phaser.Scenes.Events.UPDATE, majChaqueImage);
    scene.events.on(Phaser.Scenes.Events.WAKE, auReveil);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.events.off(Phaser.Scenes.Events.UPDATE, majChaqueImage);
        scene.events.off(Phaser.Scenes.Events.WAKE, auReveil);
    });

    hud.majPV = (nouveauxPV) => majBarreDeVie(hud.barre, nouveauxPV);
    hud.majVies = (n) => majVies(hud, n);
    hud.perdreVie = () => majVies(hud, hud.viesAffichees - 1);
    hud.gagnerVie = () => majVies(hud, hud.viesAffichees + 1);
    hud.majScore = (n) => majScore(hud, n);
    hud.ajouterScore = (n) => majScore(hud, scene.registry.get("score") + n);
    hud.reinitialiserChrono = () => {
        scene.registry.set("chrono", 0);
        hud.secondesAffichees = -1; // force l'affichage de 00:00
        afficherChrono(hud);
    };
    return hud;
}

// ---------------------------------------------------------------------------------------------
// Score et chrono
// ---------------------------------------------------------------------------------------------

function majScore(hud, n) {
    hud.scene.registry.set("score", Phaser.Math.Clamp(Math.round(n), 0, SCORE_MAX));
    afficherScore(hud, true);
}

// anime = true : les chiffres qui changent s'éclairent (pas à la création ni au réveil du niveau)
function afficherScore(hud, anime) {
    const texte = String(Phaser.Math.Clamp(Math.floor(hud.scene.registry.get("score")), 0, SCORE_MAX)).padStart(SCORE_CHIFFRES, "0");
    const premier = texte.search(/[1-9]/); // premier chiffre qui n'est pas un zéro (-1 : le score est 0)
    const attenues = premier === -1 ? SCORE_CHIFFRES - 1 : premier; // les zéros de devant sont atténués ; le dernier chiffre reste allumé
    hud.chiffresScore.forEach((image, i) => {
        const numero = (i < attenues ? IMAGE_ATTENUEE : 0) + Number(texte[i]);
        if (image.numero === numero) return; // ce chiffre n'a pas changé
        image.numero = numero;
        image.setFrame(numero);
        if (anime) {
            image.setTintFill(0xffffff); // flash blanc, comme une vie qui se rallume
            hud.scene.time.delayedCall(DUREE_FLASH_CHIFFRE, () => { if (image.active) image.clearTint(); });
        }
    });
}

// le chrono compte le temps passé dans les scènes qui ont un HUD (delta = ms depuis l'image précédente)
function majChrono(hud, delta) {
    const registre = hud.scene.registry;
    registre.set("chrono", registre.get("chrono") + delta);
    afficherChrono(hud);
}

function afficherChrono(hud) {
    const secondes = Math.min(CHRONO_MAX, Math.floor(hud.scene.registry.get("chrono") / 1000));
    if (secondes === hud.secondesAffichees) return; // rien à redessiner tant que la seconde ne change pas
    hud.secondesAffichees = secondes;
    const minutes = Math.floor(secondes / 60);
    const reste = secondes % 60;
    [Math.floor(minutes / 10), minutes % 10, Math.floor(reste / 10), reste % 10].forEach((n, i) => hud.chiffresChrono[i].setFrame(n));
}

// ---------------------------------------------------------------------------------------------
// Jauge de dash
// ---------------------------------------------------------------------------------------------

function majDash(hud) {
    if (!hud.joueur || !hud.dash.active) return;
    const recharge = rechargeDash(hud.joueur); // 0..1
    const pret = recharge >= 1;
    if (pret && !hud.dashPret) { // le dash vient de redevenir disponible : petit éclat blanc
        hud.impulsion = true;
        hud.dash.setFrame(IMAGE_IMPULSION);
        hud.scene.time.delayedCall(DUREE_IMPULSION, () => {
            hud.impulsion = false;
            if (hud.dash.active) hud.dash.setFrame(IMAGE_PRET);
        });
    }
    hud.dashPret = pret;
    if (!hud.impulsion) hud.dash.setFrame(pret ? IMAGE_PRET : Math.floor(recharge * SECTEURS));
}

// ---------------------------------------------------------------------------------------------
// Vies
// ---------------------------------------------------------------------------------------------

function majVies(hud, n) {
    const scene = hud.scene;
    n = Phaser.Math.Clamp(Math.round(n), 0, hud.viesMax);
    const ancien = hud.viesAffichees;
    hud.viesAffichees = n;
    scene.registry.set("vies", n);
    for (let i = ancien - 1; i >= n; i--) perdreIcone(hud, i, ancien - 1 - i); // on perd les vies de droite à gauche
    for (let i = ancien; i < n; i++) gagnerIcone(hud, i);
}

// remet les cases, le score et le chrono d'après le registre, sans animation (au réveil d'un niveau)
function synchroniser(hud) {
    const n = Phaser.Math.Clamp(hud.scene.registry.get("vies"), 0, hud.viesMax);
    hud.viesAffichees = n;
    hud.icones.forEach((icone, i) => { icone.clearTint(); icone.setFrame(i < n ? 0 : 1); });
    afficherScore(hud, false);
    hud.secondesAffichees = -1;
    afficherChrono(hud);
}

function perdreIcone(hud, i, rang) {
    const scene = hud.scene;
    const icone = hud.icones[i];
    icone.setTintFill(0xffffff); // flash blanc, puis la case s'éteint et se brise
    scene.time.delayedCall(DUREE_FLASH_VIE + rang * 90, () => {
        if (!icone.active) return;
        icone.clearTint();
        icone.setFrame(1);
        eclats(scene, icone.x, icone.y, 12 * ECHELLE, 12 * ECHELLE, ECLATS_PAR_VIE);
    });
}

function gagnerIcone(hud, i) {
    const icone = hud.icones[i];
    icone.setFrame(0);
    icone.setTintFill(0xffffff); // la case se rallume avec un flash
    hud.scene.time.delayedCall(DUREE_FLASH_VIE + 30, () => { if (icone.active) icone.clearTint(); });
}

// petits carrés de 2 pixels d'image qui partent vers le bas et disparaissent (même effet que la barre de vie)
function eclats(scene, x, y, largeur, hauteur, nombre) {
    for (let k = 0; k < nombre; k++) {
        const taille = ECHELLE * 2;
        const ex = x + Phaser.Math.Between(0, largeur / ECHELLE - 2) * ECHELLE;
        const ey = y + Phaser.Math.Between(0, hauteur / ECHELLE - 2) * ECHELLE;
        const eclat = scene.add.rectangle(ex, ey, taille, taille, Phaser.Utils.Array.GetRandom(COULEURS_ECLATS));
        eclat.setOrigin(0, 0).setScrollFactor(0).setDepth(103);
        scene.tweens.add({
            targets: eclat,
            x: { value: ex + Phaser.Math.Between(-8, 8) * ECHELLE, ease: "Linear" },
            y: { value: ey + Phaser.Math.Between(8, 22) * ECHELLE, ease: "Quad.easeIn" }, // ils accélèrent en tombant
            alpha: { value: 0, ease: "Quad.easeIn" },
            duration: Phaser.Math.Between(350, 600),
            onUpdate: () => { eclat.x = Math.round(eclat.x / ECHELLE) * ECHELLE; eclat.y = Math.round(eclat.y / ECHELLE) * ECHELLE; }, // reste calé sur la grille de pixels
            onComplete: () => eclat.destroy()
        });
    }
}

// ---------------------------------------------------------------------------------------------
// Dessin des textures (pixel par pixel, sur des canvas)
// ---------------------------------------------------------------------------------------------

function creerTextures(scene) {
    const fabriquer = (cle, largeur, hauteur, dessiner, images) => {
        if (scene.textures.exists(cle)) return; // déjà créée (autre niveau, ou scène relancée)
        const texture = scene.textures.createCanvas(cle, largeur, hauteur);
        dessiner(texture.getContext());
        (images || []).forEach(([nom, x, y, w, h]) => texture.add(nom, 0, x, y, w, h)); // découpe en images numérotées
        texture.refresh();
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
    };
    fabriquer("hud_plaque_vies", plaqueLargeur(VIES_MAX), PLAQUE_H, (ctx) => dessinerPlaque(ctx, VIES_MAX));
    fabriquer("hud_vie", 12, 24, (ctx) => { dessinerVie(ctx, 0, true); dessinerVie(ctx, 12, false); }, [[0, 0, 0, 12, 12], [1, 0, 12, 12, 12]]);
    const imagesDash = Array.from({ length: 18 }, (_, i) => [i, 0, i * DASH_TAILLE, DASH_TAILLE, DASH_TAILLE]);
    fabriquer("hud_dash", DASH_TAILLE, DASH_TAILLE * 18, (ctx) => imagesDash.forEach(([i]) => dessinerRoueDash(ctx, i * DASH_TAILLE, i)), imagesDash);
    fabriquer("hud_plaque_score", PLAQUE_DROITE_L, PLAQUE_DROITE_H, (ctx) => dessinerPlaqueDroite(ctx, "SCORE"));
    fabriquer("hud_plaque_chrono", PLAQUE_DROITE_L, PLAQUE_DROITE_H, (ctx) => dessinerPlaqueDroite(ctx, "TEMPS"));
    fabriquer("hud_aide_touches", AIDE_L, AIDE_H, (ctx) => dessinerAideTouches(ctx));
    // les chiffres, empilés : 0 à 9 (lignes 0 à 79), deux-points (80), puis 0 à 9 atténués (88 et suivantes)
    const imagesChiffres = [
        ...CHIFFRES.map((_, i) => [i, 0, i * HAUTEUR_CHIFFRE, 6, HAUTEUR_CHIFFRE]),
        [IMAGE_DEUX_POINTS, 0, 10 * HAUTEUR_CHIFFRE, 4, HAUTEUR_CHIFFRE],
        ...CHIFFRES.map((_, i) => [IMAGE_ATTENUEE + i, 0, (11 + i) * HAUTEUR_CHIFFRE, 6, HAUTEUR_CHIFFRE])
    ];
    fabriquer("hud_chiffres", 6, HAUTEUR_CHIFFRE * 21, (ctx) => {
        CHIFFRES.forEach((glyphe, i) => {
            dessinerChiffre(ctx, glyphe, i * HAUTEUR_CHIFFRE, false);
            dessinerChiffre(ctx, glyphe, (11 + i) * HAUTEUR_CHIFFRE, true);
        });
        dessinerChiffre(ctx, DEUX_POINTS, 10 * HAUTEUR_CHIFFRE, false);
    }, imagesChiffres);
}

// plaque d'armure : même construction que la barre de vie (contour sombre, filet lavande en haut, ombre en bas)
function dessinerPlaque(ctx, n) {
    const L = plaqueLargeur(n), H = PLAQUE_H;
    const dans = (x, y) => x >= 0 && x < L && y >= 0 && y < H && !(x === L - 1 && (y === 0 || y === H - 1));
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
        if (!dans(x, y)) continue;
        const bord = !dans(x - 1, y) || !dans(x + 1, y) || !dans(x, y - 1) || !dans(x, y + 1);
        px(ctx, x, y, bord ? "K" : "c");
    }
    for (let x = 1; x <= L - 3; x++) px(ctx, x, 1, "n");
    for (let x = 1; x <= L - 2; x++) px(ctx, x, H - 2, "b");
    px(ctx, L - 2, 1, "c");
    px(ctx, L - 2, 4, "L"); px(ctx, L - 2, H - 5, "L"); // rivets du bout
    texte(ctx, "VIES", 3, 5);
    // creux derrière chaque case
    for (let i = 0; i < n; i++) for (let y = CASE_Y; y < CASE_Y + 12; y++) for (let x = caseX(i); x < caseX(i) + 12; x++) px(ctx, x, y, "a");
}

// la plaque des vies retournée (bord plat à droite, bout coupé et rivets à gauche), sans rien dedans :
// sert au score, au chrono et à l'aide des touches
function plaqueRetournee(ctx, L, H) {
    const dans = (x, y) => x >= 0 && x < L && y >= 0 && y < H && !(x === 0 && (y === 0 || y === H - 1));
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
        if (!dans(x, y)) continue;
        const bord = !dans(x - 1, y) || !dans(x + 1, y) || !dans(x, y - 1) || !dans(x, y + 1);
        px(ctx, x, y, bord ? "K" : "c");
    }
    for (let x = 2; x <= L - 2; x++) px(ctx, x, 1, "n"); // filet lumineux en haut
    for (let x = 1; x <= L - 2; x++) px(ctx, x, H - 2, "b"); // ombre en bas
    px(ctx, 1, 4, "L"); px(ctx, 1, H - 5, "L"); // rivets du bout
}

// plaque du score ou du chrono : le mot à gauche et le creux où s'allument les chiffres à droite
function dessinerPlaqueDroite(ctx, mot) {
    plaqueRetournee(ctx, PLAQUE_DROITE_L, PLAQUE_DROITE_H);
    texte(ctx, mot, 5, 6);
    for (let y = CREUX.y; y < CREUX.y + CREUX.h; y++) for (let x = CREUX.x; x < CREUX.x + CREUX.w; x++) {
        const hautGauche = y === CREUX.y || x === CREUX.x;
        const basDroite = y === CREUX.y + CREUX.h - 1 || x === CREUX.x + CREUX.w - 1;
        px(ctx, x, y, hautGauche ? "K" : basDroite ? "d" : "a"); // creux : ombre en haut à gauche, bord clair en bas à droite
    }
}

// aide des touches : la plaque retournée, avec une ligne par action de TOUCHES (les touches alignées à droite, puis le mot)
function dessinerAideTouches(ctx) {
    plaqueRetournee(ctx, AIDE_L, AIDE_H);
    TOUCHES.forEach(({ touches, mot }, i) => {
        const y = 3 + i * LIGNE_TOUCHES;
        const x0 = AIDE_TOUCHES_FIN - (touches.length * (TOUCHE_L + 1) - 1);
        touches.forEach((nom, j) => dessinerTouche(ctx, x0 + j * (TOUCHE_L + 1), y, nom));
        texte(ctx, mot, AIDE_MOT_X, y + 2);
    });
}

// une touche de clavier en relief en (x, y) : dessus lavande avec un reflet en haut, bord sombre aux coins coupés,
// ombre dessous, et le dessin de la touche (flèche ou lettre) en foncé au milieu
function dessinerTouche(ctx, x, y, nom) {
    const dans = (cx, cy) => cx >= 0 && cx < TOUCHE_L && cy >= 0 && cy < 9 && !((cx === 0 || cx === TOUCHE_L - 1) && (cy === 0 || cy === 8));
    for (let cy = 0; cy < 9; cy++) for (let cx = 0; cx < TOUCHE_L; cx++) {
        if (!dans(cx, cy)) continue;
        const bord = !dans(cx - 1, cy) || !dans(cx + 1, cy) || !dans(cx, cy - 1) || !dans(cx, cy + 1);
        px(ctx, x + cx, y + cy, bord ? "K" : cy === 1 ? "W" : cy === 7 ? "n" : "L");
    }
    for (let cx = 1; cx < TOUCHE_L - 1; cx++) px(ctx, x + cx, y + 9, "b"); // ombre sous la touche
    const glyphe = FLECHES[nom] ?? LETTRES[nom];
    const decalage = Math.floor((TOUCHE_L - 2 - glyphe[0].length) / 2); // centré dans les 7 colonnes du dessus
    glyphe.forEach((ligne, gy) => [...ligne].forEach((c, gx) => { if (c === "#") px(ctx, x + 1 + decalage + gx, y + 2 + gy, "a"); }));
}

// un chiffre (ou les deux-points) en (0, oy) : clair en haut, lavande en bas, sur une ombre portée ; atténué : les mêmes en sombre
function dessinerChiffre(ctx, glyphe, oy, attenue) {
    const cases = [];
    glyphe.forEach((ligne, y) => [...ligne].forEach((c, x) => { if (c === "#") cases.push([x, y]); }));
    cases.forEach(([x, y]) => px(ctx, x + 1, oy + y + 1, "K"));
    cases.forEach(([x, y]) => px(ctx, x, oy + y, attenue ? (y <= 3 ? "m" : "d") : (y <= 3 ? "W" : "L")));
}

// petite police, deux tons (haut clair, bas lavande) sur une ombre portée
function texte(ctx, s, x0, y0) {
    const cases = []; let x = x0;
    [...s].forEach((ch) => {
        const lettre = LETTRES[ch];
        lettre.forEach((ligne, dy) => [...ligne].forEach((c, dx) => { if (c === "#") cases.push([x + dx, y0 + dy, dy]); }));
        x += lettre[0].length + 1;
    });
    cases.forEach(([cx, cy]) => px(ctx, cx + 1, cy + 1, "K"));
    cases.forEach(([cx, cy, dy]) => px(ctx, cx, cy, dy <= 2 ? "W" : "L"));
}

// une case de vie 12 x 12 : la tête du robot (dôme sombre, yeux blancs) sur fond lavande ; éteinte : tête sombre, yeux fermés
function dessinerVie(ctx, oy, vivante) {
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
        if ((x === 0 || x === 11) && (y === 0 || y === 11)) continue; // coins coupés
        const bord = x === 0 || x === 11 || y === 0 || y === 11;
        let k;
        if (bord) k = "K";
        else if (vivante) k = y === 1 || x === 1 ? "W" : y === 10 || x === 10 ? "n" : "L";
        else k = y === 1 || x === 1 ? "K" : y === 10 || x === 10 ? "b" : "a";
        px(ctx, x, oy + y, k);
    }
    const tete = [[3, 8], [2, 9], [2, 9], [2, 9], [2, 9], [2, 9], [2, 9], [3, 8]];
    tete.forEach(([a, b], i) => { for (let x = a; x <= b; x++) px(ctx, x, oy + 2 + i, vivante ? "a" : "b"); });
    if (vivante) {
        px(ctx, 3, oy + 2, "c"); px(ctx, 2, oy + 3, "c"); // reflet sur le dôme
        for (const ex of [3, 7]) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) px(ctx, ex + dx, oy + 4 + dy, "W");
    } else {
        for (const ex of [3, 7]) for (let dx = 0; dx < 2; dx++) px(ctx, ex + dx, oy + 5, "d"); // yeux fermés
    }
}

// La roue de dash. secteursAllumes 0..15 = recharge en cours ; 16 = prêt ; 17 = éclat blanc (dash de nouveau disponible).
// Les secteurs se remplissent dans le sens des aiguilles d'une montre depuis le haut, comme les crampons du pneu.
function dessinerRoueDash(ctx, oy, secteursAllumes) {
    const impulsion = secteursAllumes === IMAGE_IMPULSION;
    const pret = secteursAllumes >= IMAGE_PRET;
    const cx = 10, cy = 10;
    const put = (x, y, k) => px(ctx, x, oy + y, k);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.hypot(dx, dy);
        if (r > 10) continue;
        let k;
        if (r > 9.3) k = impulsion ? "W" : "K";                              // contour
        else if (r > 6.9) {                                                   // pneu : 16 secteurs
            const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI); // 0 en haut, sens horaire
            const s = Math.floor(angle / (2 * Math.PI) * SECTEURS);
            const allume = impulsion || pret || s < secteursAllumes;
            k = impulsion ? (s % 2 ? "G" : "W") : allume ? (s % 2 ? "W" : "L") : (s % 2 ? "c" : "b");
        } else if (r > 6.1) k = impulsion ? "W" : "K";                       // joint pneu / moyeu
        else if (impulsion) k = "W";                                          // moyeu
        else if (pret) k = dx + dy < -3.2 ? "W" : dx + dy > 3.8 ? "n" : "L";
        else k = dx + dy < -3.2 ? "c" : dx + dy > 3.8 ? "b" : "d";
        put(x, y, k);
    }
    // deux chevrons ">>" : le symbole du dash
    const chevrons = [[8, 9], [9, 10], [8, 11], [11, 9], [12, 10], [11, 11]];
    chevrons.forEach(([x, y]) => put(x, y, impulsion ? "L" : pret ? "K" : "b"));
}
