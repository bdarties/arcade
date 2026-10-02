// Barre de vie du joueur (HUD)
//
// L'image assets/Spritesheet/hud/barre_pv.png est une bande de 7 images de 112 x 20 pixels, dessinée
// pixel par pixel avec la palette du Bot Wheel : une roue avec la tête du robot, et 5 cellules.
//   images 0 à 5 : la barre avec 0, 1, 2, 3, 4 puis 5 cellules allumées (les yeux du robot s'éteignent à 0 PV)
//   image 6      : 1 PV, version atténuée. À 1 PV la barre alterne entre les images 1 et 6 : elle clignote.
// L'image est prévue pour 5 PV maximum (une cellule par PV).
//
// Quand les PV baissent, la barre encaisse le coup : elle est secouée et clignote en blanc, chaque cellule
// perdue s'éclaire puis se brise en éclats, et le robot plisse les yeux ("> <").
// Rien de tout ça quand les PV montent.
//
// Utilisation :
//   preload() de "niveau1"    : chargerBarreDeVie(this)
//   create()  d'un niveau     : this.barrePV = creerBarreDeVie(this, 20, 20, this.pv)
//   quand les PV changent     : majBarreDeVie(this.barrePV, this.pv)

const CLE = "barre_pv";
const CLE_YEUX = "barre_pv_yeux"; // calque des yeux plissés, fabriqué en code
const FICHIER = "./assets/Spritesheet/hud/barre_pv.png";
const LARGEUR = 112; // taille d'une image de la bande
const HAUTEUR = 20;
export const HAUTEUR_BARRE = HAUTEUR; // (hud.js s'en sert pour poser les plaques sous la barre)
export const ECHELLE_HUD = 3; // agrandissement de tout le HUD (barre, vies, jauge, score, chrono) : le robot, lui, reste à x2
const ECHELLE = ECHELLE_HUD;
export const PV_MAX_BARRE = 5; // nombre de cellules de la barre
const IMAGE_FAIBLE = 6; // "1 PV" atténué
const DELAI_CLIGNOTEMENT = 400; // ms entre deux images quand il ne reste qu'1 PV

// Forme des cellules dans l'image (en pixels de l'image). Elles sont inclinées : le haut est décalé de 3 pixels.
const CELLULE = { x0: 32, pas: 15, y0: 5, largeur: 11, lignes: 8 };
const decalage = (j) => Math.round((9 - j) * 3 / 9); // décalage vers la droite de la ligne j (0 = haut de la cellule)

// Réglages de l'animation de dégâts
const DUREE_SECOUSSE = 400; // ms
const DUREE_FLASH = 70; // ms de flash blanc sur toute la barre
const DUREE_YEUX = 500; // ms pendant lesquelles le robot garde les yeux plissés
const ECLATS_PAR_CELLULE = 8;
const COULEURS_ECLATS = [0xe7e0e9, 0xe7e0e9, 0xac98b6, 0x8a779b]; // blanc lavande, lavande, lavande foncé

// à appeler dans preload()
export function chargerBarreDeVie(scene) {
    scene.load.spritesheet(CLE, FICHIER, { frameWidth: LARGEUR, frameHeight: HAUTEUR });
}

// crée la barre en (x, y) (coin haut-gauche) avec "pv" cellules allumées
export function creerBarreDeVie(scene, x, y, pv) {
    scene.textures.get(CLE).setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
    creerTextureYeux(scene);
    const barre = scene.add.image(x, y, CLE);
    barre.setOrigin(0, 0);
    barre.setScale(ECHELLE);
    barre.setScrollFactor(0); // reste fixe à l'écran quand la caméra bouge
    barre.setDepth(100); // au-dessus du décor et du joueur
    barre.baseX = x; // position de repos (la secousse s'en écarte puis y revient)
    barre.baseY = y;
    barre.attenuee = false; // vrai quand le clignotement est sur l'image atténuée
    barre.pvAffiches = imagePour(pv);
    barre.setFrame(barre.pvAffiches);
    // les yeux plissés sont un calque posé sur la barre, caché la plupart du temps
    barre.yeuxTouches = scene.add.image(x, y, CLE_YEUX).setOrigin(0, 0).setScale(ECHELLE).setScrollFactor(0).setDepth(101).setVisible(false);
    barre.calques = [barre.yeuxTouches]; // tout ce qui doit suivre la barre quand elle est secouée
    // le clignotement ne fait rien tant qu'il reste plus d'1 PV
    const minuteur = scene.time.addEvent({
        delay: DELAI_CLIGNOTEMENT,
        loop: true,
        callback: () => {
            if (!barre.active || barre.pvAffiches !== 1) return;
            barre.attenuee = !barre.attenuee;
            barre.setFrame(barre.attenuee ? IMAGE_FAIBLE : 1);
        }
    });
    barre.once("destroy", () => {
        minuteur.remove();
        if (barre.secousse) barre.secousse.stop();
        barre.calques.forEach((c) => c.destroy());
    });
    return barre;
}

// à appeler quand les PV changent
export function majBarreDeVie(barre, pv) {
    const ancien = barre.pvAffiches;
    barre.pvAffiches = imagePour(pv);
    barre.attenuee = false; // on repart de l'image normale
    barre.setFrame(barre.pvAffiches);
    if (barre.pvAffiches < ancien) animerDegats(barre, ancien, barre.pvAffiches);
}

// les PV peuvent être négatifs ou décimaux : on les ramène à une image de la bande (0 à 5)
function imagePour(pv) {
    return Phaser.Math.Clamp(Math.round(pv), 0, PV_MAX_BARRE);
}

// ---------------------------------------------------------------------------------------------
// Animation de dégâts
// ---------------------------------------------------------------------------------------------

function animerDegats(barre, ancien, nouveau) {
    const scene = barre.scene;
    const perdues = ancien - nouveau;

    // 1. flash blanc sur toute la barre
    barre.setTintFill(0xffffff);
    scene.time.delayedCall(DUREE_FLASH, () => { if (barre.active) barre.clearTint(); });

    // 2. les cellules perdues, de la droite vers la gauche : éclat blanc qui s'éteint + éclats de pixels qui tombent
    for (let n = 0; n < perdues; n++) {
        const i = ancien - 1 - n;
        celluleQuiSeBrise(barre, i, n);
    }

    // 3. le robot plisse les yeux (à 0 PV ils sont déjà éteints)
    if (barre.minuteurYeux) barre.minuteurYeux.remove();
    barre.yeuxTouches.setVisible(nouveau > 0);
    barre.minuteurYeux = scene.time.delayedCall(DUREE_YEUX, () => { if (barre.active) barre.yeuxTouches.setVisible(false); });

    // 4. secousse
    secouer(barre, perdues);
}

// pixels de l'image occupés par la cellule i : liste de { x, y } (une case = un pixel de l'image)
function casesDeLaCellule(i) {
    const cases = [];
    for (let r = 0; r < CELLULE.lignes; r++) {
        const j = r + 1; // ligne dans la cellule, contour compris
        for (let dx = 1; dx <= CELLULE.largeur; dx++) {
            cases.push({ x: CELLULE.x0 + i * CELLULE.pas + decalage(j) + dx, y: CELLULE.y0 + j });
        }
    }
    return cases;
}

function celluleQuiSeBrise(barre, i, rang) {
    const scene = barre.scene;
    const cases = casesDeLaCellule(i);

    // éclat blanc : la cellule redessinée en blanc au même endroit, puis qui s'estompe
    const blanc = scene.add.graphics();
    blanc.setScrollFactor(0);
    blanc.setDepth(102);
    blanc.fillStyle(0xe7e0e9, 1);
    cases.forEach(({ x, y }) => blanc.fillRect(x * ECHELLE, y * ECHELLE, ECHELLE, ECHELLE));
    blanc.setPosition(barre.x, barre.y);
    barre.calques.push(blanc);
    scene.tweens.add({
        targets: blanc,
        alpha: 0,
        delay: 80 + rang * 70, // les cellules s'éteignent l'une après l'autre
        duration: 300,
        onComplete: () => {
            const place = barre.calques.indexOf(blanc);
            if (place >= 0) barre.calques.splice(place, 1); // (indexOf renvoie -1 si absent : on ne retire alors rien)
            blanc.destroy();
        }
    });

    // éclats : petits carrés de 2 pixels d'image qui partent vers le bas et disparaissent
    for (let k = 0; k < ECLATS_PAR_CELLULE; k++) {
        const c = Phaser.Utils.Array.GetRandom(cases);
        const taille = ECHELLE * 2;
        const eclat = scene.add.rectangle(barre.x + c.x * ECHELLE, barre.y + c.y * ECHELLE, taille, taille, Phaser.Utils.Array.GetRandom(COULEURS_ECLATS));
        eclat.setOrigin(0, 0).setScrollFactor(0).setDepth(103);
        const versX = eclat.x + Phaser.Math.Between(-12, 12) * ECHELLE;
        const versY = eclat.y + Phaser.Math.Between(10, 28) * ECHELLE;
        scene.tweens.add({
            targets: eclat,
            x: { value: versX, ease: "Linear" },
            y: { value: versY, ease: "Quad.easeIn" }, // ils accélèrent en tombant
            alpha: { value: 0, ease: "Quad.easeIn" },
            delay: rang * 70,
            duration: Phaser.Math.Between(350, 600),
            onUpdate: () => { eclat.x = Math.round(eclat.x / ECHELLE) * ECHELLE; eclat.y = Math.round(eclat.y / ECHELLE) * ECHELLE; }, // reste calé sur la grille de pixels
            onComplete: () => eclat.destroy()
        });
    }
}

// secousse qui s'apaise : plus on perd de PV d'un coup, plus elle est forte. Les décalages sont des multiples d'un pixel d'image.
function secouer(barre, perdues) {
    const scene = barre.scene;
    if (barre.secousse) barre.secousse.stop();
    const amplitude = (2 + perdues) * ECHELLE;
    const caler = (v) => Math.round(v / ECHELLE) * ECHELLE;
    const placer = (dx, dy) => {
        barre.setPosition(barre.baseX + dx, barre.baseY + dy);
        barre.calques.forEach((c) => c.setPosition(barre.x, barre.y));
    };
    barre.secousse = scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: DUREE_SECOUSSE,
        onUpdate: (tween) => {
            const t = tween.getValue();
            const a = amplitude * (1 - t); // l'amplitude diminue jusqu'à 0
            placer(caler(Math.sin(t * 60) * a), caler(Math.cos(t * 47) * a * 0.5));
        },
        onComplete: () => placer(0, 0) // retour exact à la position de repos
    });
}

// calque des yeux plissés : efface les yeux de l'image et dessine deux chevrons ("> <") à leur place
function creerTextureYeux(scene) {
    if (scene.textures.exists(CLE_YEUX)) return; // déjà créé
    const texture = scene.textures.createCanvas(CLE_YEUX, LARGEUR, HAUTEUR);
    const ctx = texture.getContext();
    ctx.fillStyle = "#251d2a"; // la couleur de la tête
    ctx.fillRect(7, 8, 6, 3);
    ctx.fillStyle = "#e7e0e9";
    for (const [x, y] of [[7, 8], [8, 9], [7, 10], [12, 8], [11, 9], [12, 10]]) ctx.fillRect(x, y, 1, 1);
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}
