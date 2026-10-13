// attaques.js : les attaques du boss final (le Dieu enragé du dernier combat, voir bossFinal.js) : lasers, geysers, spirale, piqué, et le balayage qui suit
// les colonnes. Elles sont ajoutées à la table ATTAQUES du moteur de boss (partie1/ennemis/boss.js), qui sait les lancer sans rien en connaître.
// Une attaque = { charge, apres, annoncer, executer, ... } : voir le commentaire de ATTAQUES dans boss.js.
import { jouerSonSurLeTemps } from "../partie1/systemes/sons.js";
import * as effets from "../partie1/systemes/effets.js";
import { ATTAQUES, zone, declencher, detruireZone, creerOrbe, ECLATS_OR, ECLATS_BLANC } from "../partie1/ennemis/boss.js";

// dernier boss : juste après les colonnes, un trait annonce un balayage au sol (0,55 s), puis le rayon part : il faut éviter les colonnes
// puis sauter ou monter sur une plateforme tout de suite après
export function balayageApresColonnes(scene, boss, valide) {
    scene.time.delayedCall(550, () => {
        if (!valide()) return;
        const balayage = zone(scene, { x: 640, y: scene.areneSolY - 28, w: 1400, h: 56, trait: { w: 1400, h: 6 } });
        scene.time.delayedCall(550, () => { if (valide()) declencher(scene, balayage); else detruireZone(balayage); });
    });
}

// Les lasers (dernier boss, dès la phase 1) : des rayons qui partent du boss en éventail. Des traits fins annoncent chaque laser ; celui du milieu suit
// le robot pendant 0,5 s puis se fige, les autres sont décalés de part et d'autre. Puis les rayons partent : en phases 2 et 3 ils BALAIENT en tournant
// pendant qu'ils sont actifs, ce qui déplace les trous entre eux (il faut passer dans un trou qui bouge). Un seul coup par attaque.
const LONGUEUR_LASER = 1700; // assez long pour traverser toute l'arène
const EPAISSEUR_LASER = 34; // largeur du rayon, en px
const LASERS = [ // par phase : décalage entre deux rayons (rad), nombre de rayons, vitesse de balayage (rad/s)
    { ecart: 0.5, nombre: 3, balayage: 0 },
    { ecart: 0.36, nombre: 5, balayage: 0.45 },
    { ecart: 0.27, nombre: 7, balayage: 0.75 },
    { ecart: 0.22, nombre: 9, balayage: 1.0 } // la forme finale
];
function preparerLasers(scene, boss) { // crée les traits d'annonce
    const reglage = LASERS[boss.phase];
    const lasers = Array.from({ length: reglage.nombre }, (_, i) => {
        const decalage = (i - (reglage.nombre - 1) / 2) * reglage.ecart; // le rayon du milieu (décalage 0) vise le robot
        const trait = scene.add.rectangle(boss.x, boss.y, LONGUEUR_LASER, 4, 0xfff2c0, 0.5).setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
        effets.clignoter(scene, trait, { alpha: 0.15, duration: 110 }); // il clignote : le danger est proche
        const laser = { decalage, trait, rayon: null, etat: "annonce", angle: 0, verrouJusqua: scene.time.now + 550, fin: 0, balayage: 0 };
        laser.angle = Phaser.Math.Angle.Between(boss.x, boss.y, scene.player.x, scene.player.body.center.y) + decalage;
        return laser;
    });
    scene.lasersBoss.push(...lasers); // majLasers les met à jour à chaque image
    return lasers;
}
function declencherLaser(scene, boss, laser, sens) { // le rayon part (il tourne ensuite dans le sens donné : voir majLasers)
    laser.trait.destroy();
    laser.trait = null;
    laser.etat = "rayon";
    laser.fin = scene.time.now + 600;
    laser.balayage = LASERS[boss.phase].balayage * sens;
    laser.ox = boss.x; laser.oy = boss.y; // le rayon part de là où le boss était
    laser.rayon = scene.add.rectangle(laser.ox, laser.oy, LONGUEUR_LASER, EPAISSEUR_LASER, 0xfff2c0, 0.95).setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setRotation(laser.angle);
    scene.tweens.add({ targets: laser.rayon, alpha: 0, scaleY: 0.3, duration: 600, ease: "Quad.In" });
}
// Un rayon qui tourne autour d'un point fixe (la forme finale s'en sert pour l'horloge : voir attaquesUltimes.js). C'est un laser comme les autres :
// majLasers le fait tourner et le fait blesser le robot qui le touche (un seul coup par attaque).
export function poserRayonTournant(scene, { ox, oy, angle, balayage, duree }) {
    const laser = { decalage: 0, trait: null, rayon: null, etat: "rayon", angle, verrouJusqua: 0, fin: scene.time.now + duree, balayage, ox, oy };
    laser.rayon = scene.add.rectangle(ox, oy, LONGUEUR_LASER, EPAISSEUR_LASER, 0xfff2c0, 0.95).setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setRotation(angle);
    effets.clignoter(scene, laser.rayon, { alpha: 0.6, duration: 140 }); // il vibre : il reste actif tout le temps
    scene.lasersBoss.push(laser);
    return laser;
}
function detruireLaser(laser) {
    if (laser.trait) laser.trait.destroy();
    if (laser.rayon) laser.rayon.destroy();
    laser.etat = "fini";
}
function majLasers(scene, boss) { // à chaque image : les traits suivent le boss et le robot, les rayons tournent et blessent
    if (!scene.lasersBoss) return;
    scene.lasersBoss = scene.lasersBoss.filter((l) => l.etat !== "fini");
    scene.lasersBoss.forEach((laser) => {
        if (laser.etat === "annonce") {
            laser.trait.setPosition(boss.x, boss.y);
            if (scene.time.now < laser.verrouJusqua) laser.angle = Phaser.Math.Angle.Between(boss.x, boss.y, scene.player.x, scene.player.body.center.y) + laser.decalage;
            laser.trait.setRotation(laser.angle);
            return;
        }
        if (scene.time.now >= laser.fin) { detruireLaser(laser); return; }
        laser.angle += laser.balayage * scene.game.loop.delta / 1000; // le balayage
        laser.rayon.setRotation(laser.angle);
        // le robot est-il dans le rayon ? distance de son centre à la demi-droite du laser
        const b = scene.player.body;
        const px = b.center.x - laser.ox, py = b.center.y - laser.oy;
        const dx = Math.cos(laser.angle), dy = Math.sin(laser.angle);
        const avance = Math.max(0, Math.min(LONGUEUR_LASER, px * dx + py * dy)); // le point du rayon le plus proche du robot
        const distance = Math.hypot(px - dx * avance, py - dy * avance);
        if (!laser.touche && distance < EPAISSEUR_LASER / 2 + 16) {
            scene.lasersBoss.forEach((l) => { l.touche = true; }); // un seul coup par attaque
            scene.blesserJoueur(1, "Foudroyé par " + boss.profil.cause, true); // (un rayon blesse même un robot en boule)
        }
    });
}

// Les geysers (dernier boss, phases 2 et 3) : des jets de lumière qui sortent du sol. Chacun est annoncé par un petit trait posé sur le sol, puis ils jaillissent
// en vague d'un côté à l'autre. Un jet est court (HAUT_GEYSER) : on les évite en sautant par-dessus ou en montant sur une plateforme (à plus de 120 px du sol).
// En phase 3, une deuxième vague décalée jaillit juste après, pile entre les jets de la première : plus d'espace au sol, il faut sauter ou monter.
const HAUT_GEYSER = 120;
function geyser(scene, x) { return zone(scene, { x, y: scene.areneSolY - HAUT_GEYSER / 2, w: 56, h: HAUT_GEYSER, trait: { w: 8, h: HAUT_GEYSER } }); }
function xsGeysers(boss, milieux = false) { // les positions des jets sur toute la largeur de l'arène (milieux : entre les jets de la première vague)
    const nombre = boss.phase >= 2 ? 8 : 6; // (phase 3 et forme finale : 8 jets)
    const pas = 1060 / (nombre - 1);
    return Array.from({ length: milieux ? nombre - 1 : nombre }, (_, i) => Math.round(110 + pas * (i + (milieux ? 0.5 : 0))));
}
function lancerGeysers(scene, boss, annonce, valide) {
    const sens = Phaser.Math.RND.pick([1, -1]); // la vague part de la gauche ou de la droite
    const jaillir = (zones, ecart, direction) => [...zones].sort((a, b) => direction * (a.x - b.x)).forEach((z, i) => scene.time.delayedCall(i * ecart, () => { if (valide()) declencher(scene, z); }));
    jaillir(annonce.zones, 110, sens);
    if (boss.phase < 2) return; // (la 2e vague : phase 3 et forme finale)
    scene.time.delayedCall(800, () => { // deuxième vague, entre les jets de la première, annoncée 0,55 s avant
        if (!valide()) return;
        const zones = xsGeysers(boss, true).map((x) => geyser(scene, x));
        scene.time.delayedCall(550, () => { if (valide()) jaillir(zones, 90, -sens); else zones.forEach(detruireZone); }); // la deuxième vague va dans l'autre sens
    });
}

// La spirale (dernier boss, phases 2 et 3) : le boss tourne sur lui-même en crachant 3 bras d'orbes. Les bras tournent dans un sens, puis à la moitié
// ils repartent dans l'autre sens : les nouveaux bras croisent ceux qui sont encore en l'air. Il faut passer entre les bras et lire le changement de sens.
function lancerSpirale(scene, boss, valide) {
    const etapes = boss.phase >= 2 ? 18 : 14; // une série d'orbes toutes les 130 ms
    const vitesse = boss.phase >= 2 ? 330 : 300;
    const bras = 3;
    let angle = Phaser.Math.FloatBetween(0, Math.PI * 2); // le départ change à chaque fois
    for (let i = 0; i < etapes; i++) scene.time.delayedCall(i * 130, () => {
        if (!valide()) return;
        const sens = i < etapes / 2 ? 1 : -1; // la seconde moitié tourne à l'envers
        angle += sens * 0.34;
        if (i % 3 === 0) jouerSonSurLeTemps(scene, "orbe");
        for (let k = 0; k < bras; k++) {
            const a = angle + (k / bras) * Math.PI * 2;
            creerOrbe(scene, boss.x, boss.y + 10, Math.cos(a) * vitesse, Math.sin(a) * vitesse);
        }
    });
    effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 14, ECLATS_OR[1]);
}

function piquer(scene, boss, annonce) { // il plonge là où le trait s'est figé, reste un instant, puis remonte
    const z = annonce.zones[0];
    const cibleX = Phaser.Math.Clamp(z.x, 120, 1160);
    detruireZone(z);
    boss.enMouvement = true;
    boss.piqueTouche = false;
    const idPique = boss.jeton;
    boss.tweenPique = scene.tweens.add({
        targets: boss, x: cibleX, y: scene.areneSolY - 130, duration: boss.phase >= 2 ? 280 : 340, ease: "Quad.In",
        onComplete: () => {
            scene.cameras.main.shake(180, 0.008);
            effets.eclats(scene, boss.x, scene.areneSolY, ECLATS_BLANC[0], 20, ECLATS_BLANC[1]);
            jouerSonSurLeTemps(scene, "dash");
            scene.time.delayedCall(220, () => { // il reste en bas un instant : c'est le moment de lui tirer dessus
                if (!boss.active || boss.jeton !== idPique) return;
                boss.tweenPique = scene.tweens.add({ targets: boss, x: scene.areneCentreX, y: boss.departY, duration: 600, ease: "Sine.InOut", onComplete: () => { boss.enMouvement = false; } });
            });
        }
    });
}

export function installerAttaques() { // à appeler une fois, avant la création du jeu
    ATTAQUES.lasers = {
        charge: 950, apres: 1000,
        annoncer: (scene, boss) => ({ lasers: preparerLasers(scene, boss) }), // des traits fins qui partent du boss, le premier suit le robot
        nettoyerAnnonce: (annonce) => annonce.lasers.forEach(detruireLaser),
        executer(scene, boss, annonce) {
            const sens = Phaser.Math.RND.pick([1, -1]); // tous les rayons d'une attaque tournent dans le même sens
            jouerSonSurLeTemps(scene, "dash");
            scene.cameras.main.shake(200, 0.006);
            annonce.lasers.forEach((laser) => declencherLaser(scene, boss, laser, sens));
        },
        demarrer: (scene) => { scene.lasersBoss = []; }, // les lasers en cours (voir majLasers)
        maj: majLasers,
        nettoyer: (scene) => { (scene.lasersBoss || []).forEach(detruireLaser); scene.lasersBoss = []; }
    };
    ATTAQUES.geysers = {
        charge: 800, apres: 1500,
        annoncer: (scene, boss) => ({ zones: xsGeysers(boss).map((x) => geyser(scene, x)) }), // des petits traits de lumière posés sur le sol
        executer: lancerGeysers
    };
    ATTAQUES.spirale = { charge: 700, apres: 2500, executer: (scene, boss, annonce, valide) => lancerSpirale(scene, boss, valide) };
    ATTAQUES.pique = {
        charge: 720, apres: 1250,
        annoncer(scene, boss) { // le trait suit le robot puis se fige : le boss plongera là
            const sol = scene.areneSolY;
            return { zones: [zone(scene, { x: scene.player.x, y: (boss.y + 40 + sol) / 2, w: 64, h: sol - boss.y - 40, trait: { w: 8, h: sol - boss.y - 40 }, suit: true, degats: false })] };
        },
        executer: (scene, boss, annonce) => piquer(scene, boss, annonce),
        maj(scene, boss) { // le robot est sur la trajectoire du piqué : un seul coup par piqué
            if (boss.enMouvement && !boss.piqueTouche && scene.physics.overlap(scene.player, boss)) {
                boss.piqueTouche = true;
                scene.blesserJoueur(1, "Percuté par " + boss.profil.cause);
            }
        },
        nettoyer: (scene, boss) => { if (boss.tweenPique) boss.tweenPique.stop(); }
    };
}
