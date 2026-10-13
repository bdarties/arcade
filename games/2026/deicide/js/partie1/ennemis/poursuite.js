// poursuite.js : la poursuite du niveau 2 : le Dieu de la Lumière enragé court après le robot
// Deux dangers : (1) un MUR DE LUMIÈRE qui avance de gauche à droite à vitesse constante : un peu moins vite que la course du robot (260
// px/s), mais il
// rattrape celui qui s'arrête ou rate un saut ; le dash sert à reprendre de l'avance. S'il touche le robot : -1 PV et le mur recule un peu.
// (2) le BOSS lui-même, qui vole derrière le robot et lance des orbes, des pluies d'orbes et des colonnes de lumière devant lui.
// Le boss est le même que celui de l'arène (boss.js : mêmes feuilles d'images, mêmes orbes), mais ses attaques sont posées par rapport au robot et à
// l'écran, pas à une arène fixe.
import { creerOrbe, creerAnimations } from "./boss.js";
import * as effets from "../systemes/effets.js";
import { jouerSonSurLeTemps, surLeTemps, quantifier } from "../systemes/sons.js";

const VITESSE_MUR_DEBUT = 232; // px/s au départ : la marche du robot est à 260...
const VITESSE_MUR_FIN = 264; // ...et à la fin de la fuite le mur va un peu plus vite que la marche : il faut dasher pour ne pas être rattrapé
const LARGEUR_MUR = 110; // px
const AVANCE_DEPART = 700; // px : de combien le mur est derrière le robot au départ (il est hors de l'écran, qui montre 640 px de chaque côté)
const RECUL_APRES_COUP = 520; // px : après avoir touché le robot, le mur se remet à cette distance derrière lui
const PAUSE_ATTAQUES_DEBUT = 2300; // ms entre deux attaques au départ...
const PAUSE_ATTAQUES_FIN = 1500; // ...et à la fin de la fuite // ms entre deux attaques du boss
const PREMIERE_ATTAQUE = 3500; // ms avant la première
const COULEUR_ENRAGE = 0xff6a5a; // la teinte rouge du boss (la même que dans boss.js)
const ATTAQUES = ["orbes", "pluie", "colonne"];

export function preparerPoursuite(scene) { // à appeler dans le create() du niveau
    creerAnimations(scene);
    const hauteur = scene.carte.heightInPixels;
    const x = scene.depart.x - AVANCE_DEPART;
    const mur = scene.add.rectangle(x, hauteur / 2, LARGEUR_MUR, hauteur + 200, 0xfff2c0, 0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    // une lueur plus large autour
    const lueur = scene.add.rectangle(x, hauteur / 2, LARGEUR_MUR * 3, hauteur + 200, 0xffb890, 0.18).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    // un peu plus petit que dans l'arène : il ne doit pas cacher la moitié de l'écran
    const boss = scene.add.sprite(scene.depart.x - 1300, scene.depart.y - 150, "boss_idle", 0).setScale(3.8).setDepth(51);
    boss.setTint(COULEUR_ENRAGE);
    boss.teinteBase = COULEUR_ENRAGE;
    boss.play("boss_idle");
    scene.poursuite = { mur, lueur, boss, prochaineAttaque: scene.time.now + PREMIERE_ATTAQUE, derniere: null, colonnes: [] };
}

export function majPoursuite(scene) { // à appeler dans update()
    const p = scene.poursuite;
    if (!p || scene.partieFinie) return;
    // secondes depuis l'image précédente (plafonnées : une image très longue, au chargement, ne doit pas faire sauter le mur)
    const delta = Math.min(scene.game.loop.delta, 50) / 1000;
    const joueur = scene.player;
    // 0 au départ, 1 à l'arrivée : la fuite devient plus dure en avançant
    const progres = Phaser.Math.Clamp((joueur.x - scene.depart.x) / Math.max(1, scene.xFin - scene.depart.x), 0, 1);
    p.mur.x += Phaser.Math.Linear(VITESSE_MUR_DEBUT, VITESSE_MUR_FIN, progres) * delta;
    p.lueur.x = p.mur.x;

    // le boss vole derrière le robot, toujours devant le mur, un peu au-dessus, et flotte doucement
    // jamais plus près que 340 px du robot : il ne doit pas le recouvrir
    const cibleX = Math.min(Math.max(p.mur.x + LARGEUR_MUR / 2 + 260, joueur.x - 520), joueur.x - 340);
    const cibleY = joueur.y - 170 + Math.sin(scene.time.now / 450) * 18;
    p.boss.x += (cibleX - p.boss.x) * 0.08;
    p.boss.y += (cibleY - p.boss.y) * 0.08;
    p.boss.setFlipX(false);

    // le mur touche le robot
    if (!scene.mort && joueur.body.left < p.mur.x + LARGEUR_MUR / 2) {
        scene.blesserJoueur(1, "Rattrapé par le mur de lumière", true); // (le mur de la fuite blesse même un robot en boule : sinon on le laisserait passer)
        scene.cameras.main.shake(200, 0.01);
        p.mur.x = joueur.x - RECUL_APRES_COUP; // le mur recule, sinon il toucherait le robot à chaque image
    }

    // les colonnes de lumière en cours (annoncées puis allumées)
    p.colonnes = p.colonnes.filter((c) => c.etat !== "finie");
    for (const c of p.colonnes) majColonne(scene, c);

    if (!scene.mort && scene.time.now >= p.prochaineAttaque) attaquer(scene, p);
}

function attaquer(scene, p) {
    const possibles = ATTAQUES.filter((nom) => nom !== p.derniere);
    const nom = Phaser.Utils.Array.GetRandom(possibles);
    p.derniere = nom;
    p.prochaineAttaque = scene.time.now + surLeTemps(scene, quantifier(Phaser.Math.Linear(PAUSE_ATTAQUES_DEBUT, PAUSE_ATTAQUES_FIN, Phaser.Math.Clamp((scene.player.x - scene.depart.x) / Math.max(1, scene.xFin - scene.depart.x), 0, 1))));
    p.boss.play("boss_charge");
    p.boss.once("animationcomplete-boss_charge", () => p.boss.play("boss_idle"));
    if (nom === "orbes") scene.time.delayedCall(450, () => tirerOrbes(scene, p));
    else if (nom === "pluie") annoncerPluie(scene, p);
    else annoncerColonne(scene, p);
}

function tirerOrbes(scene, p) { // une salve en éventail vers le robot
    const boss = p.boss;
    const base = Phaser.Math.Angle.Between(boss.x, boss.y + 20, scene.player.x, scene.player.body.center.y);
    jouerSonSurLeTemps(scene, "orbe");
    effets.eclats(scene, boss.x, boss.y + 20, 0xffd45c, 10, 300);
    for (let i = 0; i < 5; i++) {
        const angle = base + Phaser.Math.DegToRad((i - 2) * 14);
        creerOrbe(scene, boss.x, boss.y + 20, Math.cos(angle) * 330, Math.sin(angle) * 330);
    }
}

function annoncerPluie(scene, p) { // de petits traits en haut de l'écran, devant le robot, puis des orbes qui tombent à ces endroits
    const haut = scene.cameras.main.worldView.y + 14;
    const xs = [170, 340, 510, 680].map((d) => Math.round(scene.player.x + d + Phaser.Math.Between(-30, 30)));
    const reperes = xs.map((x) => {
        const r = scene.add.rectangle(x, haut + 20, 6, 40, 0xfff2c0, 0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
        effets.clignoter(scene, r, { alpha: 0.15, duration: 100 });
        return r;
    });
    scene.time.delayedCall(750, () => {
        jouerSonSurLeTemps(scene, "orbe");
        xs.forEach((x, i) => { reperes[i].destroy(); creerOrbe(scene, x, haut, 0, 400); });
    });
}

function annoncerColonne(scene, p) { // un trait clignotant sur toute la hauteur, devant le robot, puis un rayon
    const hauteur = scene.carte.heightInPixels;
    const x = Math.round(scene.player.x + 300);
    const trait = scene.add.rectangle(x, hauteur / 2, 8, hauteur, 0xfff2c0, 0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    effets.clignoter(scene, trait, { alpha: { from: 0.15, to: 0.6 }, duration: 110 });
    p.colonnes.push({ x, trait, etat: "annonce", fin: 0, rayon: null, touche: false, allumage: scene.time.now + 900 });
}

function majColonne(scene, c) {
    if (c.etat === "annonce" && scene.time.now >= c.allumage) { // le rayon tombe
        c.trait.destroy();
        c.etat = "rayon";
        c.fin = scene.time.now + 450;
        const hauteur = scene.carte.heightInPixels;
        c.rayon = scene.add.rectangle(c.x, hauteur / 2, 72, hauteur, 0xfff2c0, 0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
        scene.tweens.add({ targets: c.rayon, alpha: 0, scaleX: 0.5, duration: 450, ease: "Quad.In" });
        jouerSonSurLeTemps(scene, "dash");
        scene.cameras.main.shake(180, 0.006);
    } else if (c.etat === "rayon") {
        const b = scene.player.body;
        if (!c.touche && !scene.mort && b.center.x + b.halfWidth * 0.6 > c.x - 36 && b.center.x - b.halfWidth * 0.6 < c.x + 36) {
            c.touche = true; // un seul coup par rayon
            scene.blesserJoueur(1, "Foudroyé par le Dieu enragé", true); // (un rayon blesse même un robot en boule)
        }
        if (scene.time.now >= c.fin) { c.rayon.destroy(); c.etat = "finie"; }
    }
}

export function finirPoursuite(scene) { // le robot arrive au bout du niveau : le mur et le boss disparaissent
    const p = scene.poursuite;
    if (!p) return;
    scene.tweens.add({ targets: [p.mur, p.lueur, p.boss], alpha: 0, duration: 400 });
    p.colonnes.forEach((c) => { if (c.trait) c.trait.destroy(); if (c.rayon) c.rayon.destroy(); });
    p.colonnes = [];
}
