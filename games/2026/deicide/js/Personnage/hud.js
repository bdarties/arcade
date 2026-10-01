// HUD du joueur : barre de vie (barreDeVie.js), vies et jauge de dash.
//
// Tout est dessiné pixel par pixel avec la palette du Bot Wheel, comme la barre de vie. Les vies et la jauge
// sont fabriquées en code au moment de creerHud (aucune image en plus à charger).
//   - vies : une plaque "VIES" avec une mini-tête du robot par vie. Une vie perdue s'éteint et se brise en éclats.
//   - dash : une roue dont les crampons s'allument pendant la recharge ; elle clignote quand le dash est prêt.
// Le nombre de vies est gardé dans scene.registry ("vies") pour rester le même d'un niveau à l'autre.
//
// Utilisation :
//   preload() de "selection"  : chargerHud(this)
//   create()  d'un niveau     : this.hud = creerHud(this, this.player, this.pv)   (sans pv : pas de barre de vie)
//   quand les PV changent     : this.hud.majPV(this.pv)
//   quand les vies changent   : this.hud.perdreVie() / this.hud.gagnerVie() / this.hud.majVies(n)

import { chargerBarreDeVie, creerBarreDeVie, majBarreDeVie } from "./barreDeVie.js";
import { rechargeDash } from "./personnage.js";

const ECHELLE = 2; // même agrandissement que le robot et la barre de vie
const MARGE = 20; // écart avec le bord gauche de l'écran
const Y_BARRE = 20;
const Y_VIES = 68; // sous la barre de vie
const Y_DASH = 64;
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
const SECTEURS = 16;
const IMAGE_PRET = 16;
const IMAGE_IMPULSION = 17;
const DUREE_IMPULSION = 140; // ms de l'éclat blanc quand le dash redevient disponible

// --- animation d'une vie perdue ou gagnée
const DUREE_FLASH_VIE = 90;
const ECLATS_PAR_VIE = 8;
const COULEURS_ECLATS = [0xe7e0e9, 0xac98b6, 0x372b3e, 0x251d2a];

const LETTRES = {
    V: ["#...#", "#...#", ".#.#.", ".#.#.", "..#.."],
    I: ["###", ".#.", ".#.", ".#.", "###"],
    E: ["###", "#..", "###", "#..", "###"],
    S: [".##", "#..", ".#.", "..#", "##."]
};

// à appeler dans preload()
export function chargerHud(scene) {
    chargerBarreDeVie(scene);
}

// Crée le HUD. joueur sert à la jauge de dash. pv (facultatif) : si on le donne, la barre de vie est affichée.
export function creerHud(scene, joueur, pv) {
    creerTextures(scene);
    const poser = (image) => image.setOrigin(0, 0).setScale(ECHELLE).setScrollFactor(0).setDepth(100); // fixe à l'écran, au-dessus du décor
    const hud = { scene, joueur, viesMax: VIES_MAX, impulsion: false, dashPret: true };

    // barre de vie
    hud.barre = pv === undefined ? null : creerBarreDeVie(scene, MARGE, Y_BARRE, pv);

    // vies : la valeur vit dans le registre du jeu, donc elle passe d'un niveau à l'autre
    if (scene.registry.get("vies") === undefined) scene.registry.set("vies", VIES_DEPART);
    hud.viesAffichees = Phaser.Math.Clamp(scene.registry.get("vies"), 0, VIES_MAX);
    hud.plaque = poser(scene.add.image(MARGE, Y_VIES, "hud_plaque_vies"));
    hud.icones = [];
    for (let i = 0; i < VIES_MAX; i++) {
        hud.icones.push(poser(scene.add.image(MARGE + caseX(i) * ECHELLE, Y_VIES + CASE_Y * ECHELLE, "hud_vie", i < hud.viesAffichees ? 0 : 1)));
    }

    // jauge de dash, à droite de la plaque des vies
    hud.dash = poser(scene.add.image(MARGE + plaqueLargeur(VIES_MAX) * ECHELLE + 8, Y_DASH, "hud_dash", IMAGE_PRET));
    const majChaqueImage = () => majDash(hud);
    const auReveil = () => synchroniserVies(hud); // les vies ont pu changer dans un autre niveau pendant que celui-ci dormait
    scene.events.on(Phaser.Scenes.Events.UPDATE, majChaqueImage);
    scene.events.on(Phaser.Scenes.Events.WAKE, auReveil);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.events.off(Phaser.Scenes.Events.UPDATE, majChaqueImage);
        scene.events.off(Phaser.Scenes.Events.WAKE, auReveil);
    });

    hud.majPV = (nouveauxPV) => { if (hud.barre) majBarreDeVie(hud.barre, nouveauxPV); };
    hud.majVies = (n) => majVies(hud, n);
    hud.perdreVie = () => majVies(hud, hud.viesAffichees - 1);
    hud.gagnerVie = () => majVies(hud, hud.viesAffichees + 1);
    return hud;
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

// remet les cases d'après le registre, sans animation (au réveil d'un niveau)
function synchroniserVies(hud) {
    const n = Phaser.Math.Clamp(hud.scene.registry.get("vies"), 0, hud.viesMax);
    hud.viesAffichees = n;
    hud.icones.forEach((icone, i) => { icone.clearTint(); icone.setFrame(i < n ? 0 : 1); });
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
