// ⚠ PARTIE 2 : HORS ÉVALUATION. Cette partie n'est pas à prendre en compte dans la partie évaluée (qui est la partie 1, dans js/partie1/).
// Elle a été ajoutée à la fin, uniquement pour rendre le jeu plus intéressant sur la borne et répondre à la demande de Nicolas Maurin :
// rendre le jeu plus difficile et ajouter du contenu. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// fuite.js : ce qui se passe quand le joueur répond OUI au choix du panthéon, après la défaite du 1er boss.
//  1. Le Dieu s'enrage (enrager) : il gonfle, devient rouge et ne peut plus être touché.
//  2. Il brise le mur de pierre qui fermait la droite de l'arène (briserMurDroit, casserMurDroit) : « FUIS >>> » s'affiche.
//  3. Le robot qui passe par l'ouverture arrive au niveau 2 (sortirParLaDroite), la fuite, où la poursuite continue (poursuite.js).
// Le mur lui-même est posé par partie1/mecanismes/arene.js quand l'arène se ferme ; ici on le détruit. Ce fichier est branché sur le niveau 1 par
// installerFuite (voir partie2/index.js) : le niveau 1 ne connaît pas la partie 2.
import { creerOrbe, nettoyerCombat, elementsBarre } from "../partie1/ennemis/boss.js";
import * as effets from "../partie1/systemes/effets.js"; // éclats
import { jouerSon, jouerSonSurLeTemps } from "../partie1/systemes/sons.js"; // bruitages
import { gagnerPoints } from "../partie1/systemes/points.js";
import { COLONNES_MUR, casesDuMur } from "../partie1/mecanismes/arene.js"; // le mur de droite de l'arène

const ECHELLE_ENRAGE = 1.7; // de combien le Dieu gonfle en s'enrageant (3 x 1,7 = 5,1 : environ 775 px de large)
const COULEUR_ENRAGE = 0xff6a5a; // la teinte rouge du boss enragé (aussi dans poursuite.js)

// Branché sur le niveau 1 à chaque création du niveau (voir installerFuite) : l'état de la fuite est remis à zéro, et la sortie est surveillée à chaque image.
export function preparerFuite(scene) {
    scene.fuiteOuverte = false; // vrai quand le Dieu est enragé et le mur brisé : on peut fuir par la droite
    scene.elementsFuite = []; // les flèches et le texte « FUIS » (pas encore affichés)
    const surveiller = () => { if (scene.fuiteOuverte) sortirParLaDroite(scene); };
    scene.events.on(Phaser.Scenes.Events.UPDATE, surveiller);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, surveiller));
}

// Le Dieu arrive à 0 PV : il devient enragé. Il ne peut plus être touché ni attaquer au corps à corps ; il détruit le mur de droite de l'arène
// (arene.js : briserMurDroit) puis le robot doit fuir. Pendant la fuite il lance des orbes.
export function enrager(scene, boss) {
    nettoyerCombat(scene, boss);
    boss.etat = "enrage";
    boss.fige = true; // il ne flotte plus : c'est lui qui décide de ses déplacements
    boss.intouchable = true; // les tirs du robot ne lui font plus rien
    gagnerPoints(scene, boss.profil.points, boss.x, boss.y - 120); // le bonus de bataille est donné maintenant : la suite est une fuite
    boss.body.enable = false;
    boss.play("boss_charge");
    boss.setTint(COULEUR_ENRAGE);
    boss.teinteBase = COULEUR_ENRAGE;
    jouerSon(scene, "joueur_mort"); // un grondement (le même son grave que la mort du robot)
    scene.cameras.main.flash(500, 255, 90, 60);
    scene.cameras.main.shake(1100, 0.012);
    effets.eclats(scene, boss.x, boss.y, 0xff5a3c, 30, 320);
    // il gonfle : bien plus grand qu'avant
    scene.tweens.add({ targets: boss, scaleX: boss.profil.echelle * ECHELLE_ENRAGE, scaleY: boss.profil.echelle * ECHELLE_ENRAGE, duration: 900, ease: "Back.Out" });
    scene.tweens.add({ targets: elementsBarre(boss), alpha: 0, duration: 600 }); // la barre de vie disparaît
    scene.tweens.add({ targets: boss, x: 330, y: boss.departY + 40, duration: 900, ease: "Sine.InOut" }); // il se place à gauche, face au mur
    scene.time.delayedCall(1500, () => { if (boss.active) briserMurDroit(scene, boss); }); // le mur est détruit en trois temps visibles
    // pendant la fuite, il tire des orbes sur le robot
    scene.time.delayedCall(4200, () => {
        const tir = scene.time.addEvent({ delay: 1900, loop: true, callback: () => {
            if (!boss.active || scene.partieFinie || scene.mort) { tir.remove(); return; }
            const base = Phaser.Math.Angle.Between(boss.x, boss.y, scene.player.x, scene.player.body.center.y);
            jouerSonSurLeTemps(scene, "orbe");
            for (let i = -1; i <= 1; i++) creerOrbe(scene, boss.x + 120, boss.y, Math.cos(base + i * 0.25) * 300, Math.sin(base + i * 0.25) * 300);
        } });
    });
}

// Le Dieu enragé détruit le mur, en plusieurs temps bien visibles : il charge une boule d'énergie, tire un rayon sur le mur, le mur
// s'embrase puis éclate.
// `boss` : le sprite du Dieu. Le robot peut bouger pendant ce temps ; la sortie ne s'ouvre qu'à l'explosion.
function briserMurDroit(scene, boss) {
    if (!scene.murDroit) return;
    const mur = scene.murDroit;
    const xMur = COLONNES_MUR[0] * 32;
    const y = boss.y;
    // 1. la charge : une boule rouge-orangé qui grossit devant le boss (0,7 s)
    const boule = scene.add.image(boss.x + 140, y, "halo").setTint(0xff7a40).setBlendMode(Phaser.BlendModes.ADD).setDepth(52).setScale(0.1);
    scene.tweens.add({ targets: boule, scale: 1.7, duration: 700, ease: "Quad.In" });
    scene.cameras.main.shake(700, 0.006);
    scene.time.delayedCall(700, () => {
        // 2. le rayon : une bande de lumière du boss jusqu'au mur
        jouerSon(scene, "dash");
        boule.destroy();
        const rayon = scene.add.rectangle((boss.x + 140 + xMur) / 2, y, xMur - boss.x - 140, 70, 0xffd0a0, 0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(52);
        scene.tweens.add({ targets: rayon, alpha: 0, scaleY: 0.2, duration: 450, ease: "Quad.In", onComplete: () => rayon.destroy() });
        scene.cameras.main.flash(150, 255, 220, 180);
        mur.setTint(0xff9a60); // le mur rougeoie à l'endroit touché
        effets.eclats(scene, xMur, y, 0xffc080, 18, 360);
        scene.time.delayedCall(450, () => casserMurDroit(scene)); // 3. l'explosion
    });
}

function casserMurDroit(scene) { // le mur éclate : gros éclats de pierre, flash, tremblement ; puis la sortie est libre et bien indiquée
    if (!scene.murDroit) return;
    for (const [colonne, ligne] of casesDuMur()) scene.groupe_plateformes.removeTileAt(colonne, ligne); // plus solide
    const mur = scene.murDroit;
    scene.murDroit = null;
    scene.cameras.main.shake(900, 0.02);
    scene.cameras.main.flash(400, 255, 240, 210);
    jouerSon(scene, "lanterne");
    jouerSon(scene, "ennemi_mort");
    mur.destroy();
    const xMur = COLONNES_MUR[0] * 32;
    const hauteur = scene.areneSolY; // le mur va du haut de la map au sol de l'arène
    for (let i = 0; i < 34; i++) { // des morceaux de pierre projetés vers la gauche (dans l'arène) et vers le haut, qui retombent
        const taille = Phaser.Math.Between(12, 34);
        const morceau = scene.add.rectangle(xMur + Phaser.Math.Between(0, 64), Phaser.Math.Between(60, hauteur - 20), taille, taille * Phaser.Math.FloatBetween(0.6, 1), 0x6d6676).setDepth(52);
        morceau.setStrokeStyle(2, 0x2a262e);
        const vx = Phaser.Math.Between(-420, 160);
        const vy = Phaser.Math.Between(-260, 60);
        scene.tweens.add({ targets: morceau, x: morceau.x + vx, angle: Phaser.Math.Between(-360, 360), duration: 1400, ease: "Quad.Out" });
        scene.tweens.add({ targets: morceau, y: { value: morceau.y + vy, duration: 450, ease: "Quad.Out" }, alpha: { value: 0, duration: 500, delay: 1000 },
            onComplete: () => morceau.destroy() });
        scene.tweens.add({ targets: morceau, y: Math.min(hauteur - taille / 2, morceau.y + vy + 380), duration: 900, delay: 450, ease: "Quad.In" });
    }
    // de la poussière tout le long du mur
    for (let i = 0; i < 8; i++) effets.eclats(scene, xMur + 32, 80 + i * (hauteur - 100) / 7, 0xd8d0e0, 14, 380);
    // la lumière qui entre par l'ouverture, et les flèches vers la droite
    const lumiere = scene.add.rectangle(xMur + 40, hauteur / 2, 130, hauteur, 0xffe6b0, 0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(52);
    scene.tweens.add({ targets: lumiere, alpha: { from: 0.18, to: 0.5 }, duration: 380, yoyo: true, repeat: -1 });
    const fleches = [0, 1, 2].map((i) => scene.add.text(1050 + i * 62, hauteur - 130, ">", { fontFamily: "monospace", fontSize: "88px", color: "#ffd9a0", stroke: "#000000", strokeThickness: 8 }).setOrigin(0.5).setDepth(100));
    // elles clignotent l'une après l'autre : ça « court » vers la droite
    fleches.forEach((f, i) => scene.tweens.add({ targets: f, alpha: { from: 0.15, to: 1 }, duration: 260, delay: i * 130, yoyo: true, repeat: -1, repeatDelay: 260 }));
    const texte = scene.add.text(640, 90, "FUIS  >>>\nBOUTON E : DASH", { fontFamily: "monospace", fontSize: "48px", align: "center", color: "#ffb4a8", stroke: "#000000", strokeThickness: 8 }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    scene.tweens.add({ targets: texte, scale: { from: 1, to: 1.12 }, duration: 320, yoyo: true, repeat: -1 });
    scene.elementsFuite = [lumiere, texte, ...fleches]; // supprimés quand on quitte l'arène
    scene.fuiteOuverte = true; // verifierArene surveille maintenant la sortie
}

function sortirParLaDroite(scene) { // le robot passe là où était le mur : fondu, puis le niveau 2 (la poursuite continue là-bas)
    if (scene.partieFinie || scene.player.x < 1250) return;
    scene.partieFinie = true; // plus de pause ni de dégâts pendant le fondu
    // la lumière, les flèches et le texte s'effacent
    (scene.elementsFuite || []).forEach((e) => scene.tweens.add({ targets: e, alpha: 0, duration: 300 }));
    scene.cameras.main.fadeOut(500, 0, 0, 0);
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start("niveau2"));
}
