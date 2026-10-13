// attaquesUltimes.js : les six attaques de la FORME FINALE du boss (phase 4, voir formeFinale.js). Aucune ne ressemble à celles des phases 1 à 3 :
//   - météores    : des orbes qui tombent en DIAGONALE, annoncées par des traînées, deux volées dans des sens opposés
//   - rideaux     : trois MURS d'orbes qui tombent, avec un trou qui change de place à chaque mur (le trou est annoncé en haut de l'écran)
//   - horloge     : quatre lames de lumière en croix qui TOURNENT autour du centre de l'arène : il faut sauter ou dasher au bon moment
//   - étau        : deux murs d'orbes arrivent des DEUX CÔTÉS avec une fenêtre à une hauteur annoncée (sol, plateforme ou air)
//   - traque      : des orbes qui SUIVENT le robot en tournant
//   - damier      : le sol s'allume par blocs, en alternance : il faut changer de bloc (ou monter sur une plateforme) à chaque fois
// Elles sont ajoutées à la table ATTAQUES du moteur de boss, comme celles de attaques.js.
import { jouerSonSurLeTemps } from "../partie1/systemes/sons.js";
import * as effets from "../partie1/systemes/effets.js";
import { ATTAQUES, zone, declencher, creerOrbe, ECLATS_OR } from "../partie1/ennemis/boss.js";
import { poserRayonTournant } from "./attaques.js";

const tracer = (scene, x, y, longueur, angle, epaisseur = 5) => { // un trait de lumière qui clignote, de (x, y) vers l'angle donné : l'annonce d'une trajectoire
    const trait = scene.add.rectangle(x, y, longueur, epaisseur, 0xfff2c0, 0.5).setOrigin(0, 0.5).setRotation(angle).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    effets.clignoter(scene, trait, { alpha: 0.12, duration: 110 });
    return trait;
};
const haut = (scene) => scene.cameras.main.worldView.y + 12; // le haut de l'écran, dans le monde

// ---------------------------------------------------------------------------------------------
// Météores
// ---------------------------------------------------------------------------------------------
const ANGLE_METEORE = 0.5; // rad, par rapport à la verticale : la pente des météores
const VITESSE_METEORE = 560;

function lignesMeteores(scene, sens) { // 10 trajectoires parallèles, avec leur trait d'annonce
    const y = haut(scene);
    const vx = sens * Math.sin(ANGLE_METEORE) * VITESSE_METEORE, vy = Math.cos(ANGLE_METEORE) * VITESSE_METEORE;
    const decalage = -sens * (scene.areneSolY - y) * Math.tan(ANGLE_METEORE) / 2; // la volée est centrée : elle arrive de part et d'autre de l'écran
    return Array.from({ length: 10 }, (_, i) => {
        const x = 70 + i * 128 + decalage;
        return { x, y, vx, vy, trait: tracer(scene, x, y, (scene.areneSolY - y) / Math.cos(ANGLE_METEORE), Math.atan2(vy, vx)) };
    });
}
function tirerMeteores(scene, lignes, valide) {
    jouerSonSurLeTemps(scene, "orbe");
    lignes.forEach((ligne, i) => scene.time.delayedCall(i * 90, () => { // en cascade, d'un bord à l'autre
        ligne.trait.destroy();
        if (valide()) creerOrbe(scene, ligne.x, ligne.y, ligne.vx, ligne.vy).setScale(0.42); // un météore : une orbe plus grosse
    }));
}

// ---------------------------------------------------------------------------------------------
// Rideaux
// ---------------------------------------------------------------------------------------------
const TROU_RIDEAU = 105; // demi-largeur du trou, en px

function marqueTrou(scene, x) { // en haut de l'écran : une barre claire à l'endroit où le mur laissera passer
    const marque = scene.add.rectangle(x, haut(scene) + 6, TROU_RIDEAU * 2, 12, 0xfff2c0, 0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    effets.clignoter(scene, marque, { alpha: 0.25, duration: 110 });
    return marque;
}
function lancerMur(scene, trou) { // une ligne d'orbes sur toute la largeur, sauf au niveau du trou, qui tombe
    jouerSonSurLeTemps(scene, "orbe");
    for (let x = 40; x <= 1240; x += 60) if (Math.abs(x - trou) > TROU_RIDEAU) creerOrbe(scene, x, haut(scene) + 10, 0, 340);
}
function trous() { // trois trous : chacun à 280 px au moins du précédent (atteignable) et pas plus loin que 520 px
    const liste = [Phaser.Math.Between(200, 1080)];
    while (liste.length < 3) {
        const d = Phaser.Math.Between(280, 520) * Phaser.Math.RND.pick([-1, 1]);
        const x = liste[liste.length - 1] + d;
        if (x > 160 && x < 1120) liste.push(x);
    }
    return liste;
}

// ---------------------------------------------------------------------------------------------
// Horloge
// ---------------------------------------------------------------------------------------------
const VITESSE_HORLOGE = 1.15; // rad/s
const DUREE_HORLOGE = 2200; // ms (plus courte : 3,4 s avant)

// ---------------------------------------------------------------------------------------------
// Étau
// ---------------------------------------------------------------------------------------------
function hauteursFenetres(scene) { // trois hauteurs possibles pour la fenêtre : au sol, sur une plateforme, en l'air (en sautant)
    const sol = scene.areneSolY;
    return [sol - 42, sol - 168, sol - 300];
}
const DEMI_FENETRE = 78; // demi-hauteur de la fenêtre
function marqueFenetre(scene, cote, y) { // sur le bord de l'écran : un repère clair à la hauteur de la fenêtre
    const x = cote === "gauche" ? 14 : 1266;
    const marque = scene.add.rectangle(x, y, 22, DEMI_FENETRE * 2, 0xfff2c0, 0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    effets.clignoter(scene, marque, { alpha: 0.25, duration: 110 });
    return marque;
}
function lancerMurLateral(scene, cote, yFenetre) { // une colonne d'orbes qui traverse l'arène depuis un côté, avec une fenêtre à la hauteur voulue
    const sol = scene.areneSolY;
    const x = cote === "gauche" ? -20 : 1300, vx = cote === "gauche" ? 300 : -300;
    for (let y = haut(scene) + 20; y < sol + 6; y += 52) if (Math.abs(y - yFenetre) > DEMI_FENETRE) creerOrbe(scene, x, y, vx, 0);
}

// ---------------------------------------------------------------------------------------------
// Damier
// ---------------------------------------------------------------------------------------------
const HAUTEUR_BLOC = 118; // moins que la hauteur d'une plateforme au-dessus du sol (125 px) : une plateforme protège
function blocs(scene, parite) { // les blocs de 160 px qui vont s'allumer : un sur deux
    const sol = scene.areneSolY;
    const zones = [];
    for (let i = parite; i < 8; i += 2) zones.push(zone(scene, { x: 80 + 160 * i, y: sol - HAUTEUR_BLOC / 2, w: 160, h: HAUTEUR_BLOC, trait: { w: 156, h: HAUTEUR_BLOC } }));
    return zones;
}

export function installerAttaquesUltimes() { // à appeler une fois, avant la création du jeu
    ATTAQUES.meteores = {
        charge: 800, apres: 3000,
        annoncer(scene) { const sens = Phaser.Math.RND.pick([1, -1]); const lignes = lignesMeteores(scene, sens); return { sens, lignes, reperes: lignes.map((l) => l.trait) }; },
        executer(scene, boss, annonce, valide) {
            tirerMeteores(scene, annonce.lignes, valide);
            scene.time.delayedCall(650, () => { // une deuxième volée, dans l'autre sens, annoncée 0,5 s avant
                if (!valide()) return;
                const lignes = lignesMeteores(scene, -annonce.sens);
                scene.time.delayedCall(500, () => { if (valide()) tirerMeteores(scene, lignes, valide); else lignes.forEach((l) => l.trait.destroy()); });
            });
        }
    };
    ATTAQUES.rideaux = {
        charge: 800, apres: 3600,
        annoncer(scene) { const liste = trous(); return { liste, reperes: [marqueTrou(scene, liste[0])] }; },
        executer(scene, boss, annonce, valide) {
            annonce.reperes.forEach((r) => r.destroy()); // le repère du 1er trou
            lancerMur(scene, annonce.liste[0]);
            [1, 2].forEach((k) => {
                scene.time.delayedCall(k * 1000 - 650, () => { // le trou du mur suivant est annoncé 0,65 s avant
                    if (!valide()) return;
                    const marque = marqueTrou(scene, annonce.liste[k]);
                    scene.time.delayedCall(650, () => { marque.destroy(); if (valide()) lancerMur(scene, annonce.liste[k]); });
                });
            });
        }
    };
    ATTAQUES.horloge = {
        charge: 900, apres: 2500,
        annoncer(scene) { // quatre traits en croix autour du centre de l'arène : l'angle de départ des lames
            const ox = 640, oy = scene.areneSolY - 330, depart = Phaser.Math.FloatBetween(0, Math.PI / 2);
            const traits = [0, 1, 2, 3].map((k) => tracer(scene, ox, oy, 1700, depart + k * Math.PI / 2, 6));
            const centre = scene.add.circle(ox, oy, 26, 0xfff2c0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
            effets.clignoter(scene, centre, { alpha: 0.12, duration: 110 });
            return { ox, oy, depart, reperes: [...traits, centre] };
        },
        executer(scene, boss, annonce) {
            annonce.reperes.forEach((r) => r.destroy());
            const sens = Phaser.Math.RND.pick([1, -1]);
            jouerSonSurLeTemps(scene, "dash");
            scene.cameras.main.shake(200, 0.006);
            [0, 1, 2, 3].forEach((k) => poserRayonTournant(scene, { ox: annonce.ox, oy: annonce.oy, angle: annonce.depart + k * Math.PI / 2, balayage: sens * VITESSE_HORLOGE, duree: DUREE_HORLOGE }));
        }
    };
    ATTAQUES.etau = {
        charge: 800, apres: 3600,
        annoncer(scene) {
            const [a, b] = Phaser.Utils.Array.Shuffle(hauteursFenetres(scene)); // deux hauteurs différentes, une par côté
            return { a, b, reperes: [marqueFenetre(scene, "gauche", a), marqueFenetre(scene, "droite", b)] };
        },
        executer(scene, boss, annonce, valide) {
            annonce.reperes.forEach((r) => r.destroy());
            jouerSonSurLeTemps(scene, "orbe");
            lancerMurLateral(scene, "gauche", annonce.a);
            lancerMurLateral(scene, "droite", annonce.b);
            scene.time.delayedCall(1500, () => { // les murs reviennent, les hauteurs des fenêtres échangées, annoncées 0,6 s avant
                if (!valide()) return;
                const marques = [marqueFenetre(scene, "gauche", annonce.b), marqueFenetre(scene, "droite", annonce.a)];
                scene.time.delayedCall(600, () => {
                    marques.forEach((m) => m.destroy());
                    if (!valide()) return;
                    jouerSonSurLeTemps(scene, "orbe");
                    lancerMurLateral(scene, "gauche", annonce.b);
                    lancerMurLateral(scene, "droite", annonce.a);
                });
            });
        }
    };
    ATTAQUES.traque = {
        charge: 600, apres: 2400,
        executer(scene, boss, annonce, valide) { // six orbes qui partent en éventail, une toutes les 260 ms, puis tournent vers le robot (voir maj)
            effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 14, ECLATS_OR[1]);
            for (let i = 0; i < 6; i++) scene.time.delayedCall(i * 260, () => {
                if (!valide()) return;
                jouerSonSurLeTemps(scene, "orbe");
                const angle = Math.PI / 2 + (i - 2.5) * 0.5;
                const orbe = creerOrbe(scene, boss.x, boss.y + 30, Math.cos(angle) * 300, Math.sin(angle) * 300);
                orbe.setScale(0.36);
                orbe.traque = true; // maj la fait tourner vers le robot
            });
        },
        maj(scene) { // chaque image : les orbes « traque » tournent vers le robot (1,9 rad/s au plus : on peut les semer en sautant ou en dashant)
            const delta = Math.min(scene.game.loop.delta, 50) / 1000;
            const cible = scene.player.body.center;
            scene.tirsEnnemis.getChildren().forEach((orbe) => {
                if (!orbe.active || !orbe.traque) return;
                const angle = Math.atan2(orbe.body.velocity.y, orbe.body.velocity.x);
                const voulu = Phaser.Math.Angle.Between(orbe.x, orbe.y, cible.x, cible.y);
                const nouveau = angle + Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(voulu - angle), -1.9 * delta, 1.9 * delta);
                orbe.body.setVelocity(Math.cos(nouveau) * 300, Math.sin(nouveau) * 300);
            });
        }
    };
    ATTAQUES.damier = {
        charge: 800, apres: 2900,
        annoncer(scene) { return { zones: blocs(scene, 0) }; }, // les blocs pairs sont annoncés
        executer(scene, boss, annonce, valide) {
            annonce.zones.forEach((z) => declencher(scene, z)); // pairs
            [[1, 450], [0, 1450]].forEach(([parite, delai]) => { // puis impairs, puis pairs encore : chaque série annoncée 0,55 s avant
                scene.time.delayedCall(delai, () => {
                    if (!valide()) return;
                    const zones = blocs(scene, parite);
                    scene.time.delayedCall(550, () => { if (valide()) zones.forEach((z) => declencher(scene, z)); });
                });
            });
        }
    };
}
