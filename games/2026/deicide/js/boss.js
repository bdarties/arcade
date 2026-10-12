// boss.js : le Dieu de la Lumière, le boss final, dans l'arène en haut du niveau 1
// Son dessin vient de 4 feuilles d'images de 152 x 116 px (assets/images/boss/), faites en code (voir le dossier sprite-boss) :
//   boss_idle (8 images, il plane), boss_charge (6, il prépare une attaque), boss_attaque (4, il la lance), boss_mort (8, il se dissout).
// Il apparaît quand arene.js ferme l'arène (voir faireApparaitreBoss), flotte en haut de la salle et attaque.
//
// 3 PHASES (selon ses PV) : à chaque changement il devient invulnérable un instant, il lâche un PV à ramasser, et il se débloque
// de nouvelles attaques et il va plus vite.
//   phase 1 : orbes, colonne, pluie, lanternes
//   phase 2 : + balayage, nova (et plus d'orbes, 2 colonnes)
//   phase 3 : + piqué (et encore plus d'orbes, 3 colonnes, des pauses plus courtes)
//
// LES ATTAQUES : il se prépare (animation « charge », avec une annonce visible), puis l'attaque part (animation « attaque »)
//   - orbes     : une salve d'orbes de lumière en éventail vers le robot
//   - colonne   : des traits clignotants au sol annoncent des rayons qui tombent du ciel (le premier suit le robot un instant)
//   - pluie     : des orbes tombent du haut de l'écran à des endroits annoncés par de petits traits ; une plateforme protège en dessous
//   - lanternes : il invoque des lanternes vivantes (elles font mal, mais un tir les abat et donne un boost)
//   - balayage  : un rayon horizontal frôle le sol de toute l'arène : il faut sauter ou monter sur une plateforme
//   - nova      : des anneaux d'orbes lentes s'écartent de lui, avec des trous entre les orbes
//   - piqué     : il plonge sur l'endroit où le robot se tenait, puis remonte
// Les tirs du robot le blessent. À 0 PV il se dissout, puis bossTue (points.js) arrête le chrono et ouvre le classement.
import { jouerSon } from "./sons.js";
import * as effets from "./effets.js";
import { gagnerPoints, bossTue } from "./points.js";
import { faireApparaitre as invoquerLanterne } from "./lanterneVivante.js";
import { lacherPV } from "./bonus.js";

const LARGEUR_IMAGE = 152; // une image des feuilles
const HAUTEUR_IMAGE = 116;
const ECHELLE = 3; // le sprite est agrandi x3 : 456 x 348 px à l'écran, avec des pixels francs de 3 px comme le HUD (l'arène fait 1280 px de large)
const PV_MAX = 150; // PV du boss : à 300 ms entre deux tirs, et la moitié qui touche, ça fait environ une minute et demie
const SEUILS_PHASE = [100, 50]; // sous 100 PV : phase 2 ; sous 50 PV : phase 3
const DUREE_TRANSITION = 2000; // ms d'invulnérabilité à chaque changement de phase (plus que la plus longue préparation d'attaque)
const POINTS_PAR_TIR = 10; // points gagnés à chaque tir qui touche le boss (le bonus de 3000 est donné à sa mort, voir points.js)
const LARGEUR_BARRE = 520; // barre de vie du boss, en haut de l'écran
const PAUSES = [2600, 2000, 1500]; // ms entre la fin d'une attaque et le début de la suivante, par phase

// les attaques disponibles à chaque phase
const ATTAQUES_PAR_PHASE = [
    ["orbes", "colonne", "pluie", "lanternes"],
    ["orbes", "colonne", "pluie", "lanternes", "balayage", "nova"],
    ["orbes", "colonne", "pluie", "lanternes", "balayage", "nova", "pique"]
];
// charge : ms de préparation avant le départ de l'attaque ; apres : ms que dure encore l'effet avant que la pause commence
const ATTAQUES = {
    orbes: { charge: 650, apres: 0 },
    colonne: { charge: 1100, apres: 600 },
    pluie: { charge: 900, apres: 1300 },
    lanternes: { charge: 650, apres: 0 },
    balayage: { charge: 1100, apres: 700 },
    nova: { charge: 700, apres: 1100 },
    pique: { charge: 900, apres: 1500 }
};

// les feuilles : clé, nombre d'images, images par seconde, répétition (-1 = en boucle, 0 = une fois)
const ANIMATIONS = [["boss_idle", 8, 8, -1], ["boss_charge", 6, 10, 0], ["boss_attaque", 4, 14, 0], ["boss_mort", 8, 7, 0]];
const ECLATS_OR = [0xffd45c, 300]; // mêmes réglages que les éclats de lanterne vivante (effets.js) : l'émetteur est déjà fabriqué
const ECLATS_BLANC = [0xffffff, 190];

export function chargerBoss(scene) { // à appeler dans chargerJeu (preload)
    ANIMATIONS.forEach(([cle]) => scene.load.spritesheet(cle, "./assets/images/boss/" + cle + ".png", { frameWidth: LARGEUR_IMAGE, frameHeight: HAUTEUR_IMAGE }));
}

function creerAnimations(scene) { // crée une seule fois les 4 animations
    ANIMATIONS.forEach(([cle, nb, vitesse, repeat]) => {
        scene.textures.get(cle).setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
        if (!scene.anims.exists(cle)) scene.anims.create({ key: cle, frames: scene.anims.generateFrameNumbers(cle, { start: 0, end: nb - 1 }), frameRate: vitesse, repeat });
    });
}

// ---------------------------------------------------------------------------------------------
// Apparition
// ---------------------------------------------------------------------------------------------

export function faireApparaitreBoss(scene, x, y) { // fait apparaître le boss en (x, y) : le centre de son sprite
    creerAnimations(scene);
    const boss = scene.physics.add.sprite(x, y, "boss_idle", 0); // un sprite avec un corps physique, pour les tirs du joueur
    boss.body.setAllowGravity(false); // il vole : la gravité ne l'affecte pas
    boss.body.setImmovable(true);
    boss.body.setSize(34, 90).setOffset(59, 22); // la hitbox est le corps de l'ange, sans les ailes
    boss.setScale(ECHELLE).setDepth(51).setAlpha(0); // au-dessus du voile d'ombre (50) : c'est lui la lumière
    boss.play("boss_idle");
    boss.pv = PV_MAX;
    boss.etat = "apparition"; // apparition -> combat <-> attaque -> transition (changement de phase) -> mort
    boss.phase = 0; // 0, 1 ou 2
    boss.departY = y; // hauteur autour de laquelle il flotte
    boss.prochaineAttaque = Infinity; // pas d'attaque avant la fin de l'apparition
    boss.derniereAttaque = null;
    boss.jeton = 0; // numéro de l'attaque en cours : une attaque interrompue (changement de phase, mort) ne fait plus rien
    boss.pique = false; // vrai pendant un piqué (il ne flotte plus)
    scene.zonesBoss = [];

    if (scene.textures.exists("halo_doux")) { // une lueur dorée derrière lui (la texture vient d'ennemis.js)
        const halo = scene.add.image(x, y, "halo_doux");
        halo.setScale(4.2).setTint(0xfff2c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0).setPipeline("SinglePipeline");
        boss.halo = halo;
        boss.once("destroy", () => halo.destroy());
    }
    boss.barre = creerBarre(scene);
    scene.tweens.add({ targets: [boss, boss.halo].filter(Boolean), alpha: { value: (cible) => (cible === boss ? 1 : 0.35) }, duration: 1500, onComplete: () => {
        boss.etat = "combat";
        boss.prochaineAttaque = scene.time.now + 1200; // la première attaque arrive peu après
    } });
    scene.tweens.add({ targets: elementsBarre(boss), alpha: 1, duration: 800 });

    scene.physics.add.overlap(scene.tirsJoueur, boss, (a, b) => toucherBoss(scene, boss, a === boss ? b : a)); // un tir du robot touche le boss
    scene.boss = boss;
    const suivre = (temps) => majBoss(scene, boss, temps);
    scene.events.on(Phaser.Scenes.Events.UPDATE, suivre);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, suivre));
    return boss;
}

// ---------------------------------------------------------------------------------------------
// Barre de vie : un cadre, une barre pleine, deux repères de phase et le nom, fixes en haut au milieu de l'écran
// ---------------------------------------------------------------------------------------------

function creerBarre(scene) {
    const y = 26;
    const gauche = 640 - LARGEUR_BARRE / 2;
    const fond = scene.add.rectangle(640, y, LARGEUR_BARRE + 8, 22, 0x251d2a).setStrokeStyle(2, 0x5f4f6e).setScrollFactor(0).setDepth(101).setAlpha(0);
    const plein = scene.add.rectangle(gauche, y, LARGEUR_BARRE, 12, 0xe7e0e9).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102).setAlpha(0);
    const reperes = SEUILS_PHASE.map((seuil) => scene.add.rectangle(gauche + LARGEUR_BARRE * seuil / PV_MAX, y, 3, 18, 0x251d2a).setScrollFactor(0).setDepth(103).setAlpha(0)); // un trait à chaque changement de phase
    const nom = scene.add.text(640, y + 20, "DIEU DE LA LUMIÈRE", { fontFamily: "monospace", fontSize: "16px", color: "#8a779b", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102).setAlpha(0);
    return { fond, plein, reperes, nom };
}

function elementsBarre(boss) { return [boss.barre.fond, boss.barre.plein, boss.barre.nom, ...boss.barre.reperes]; }

function majBarre(scene, boss) { // la barre rétrécit en douceur, avec un éclat blanc
    const largeur = LARGEUR_BARRE * Math.max(0, boss.pv) / PV_MAX;
    scene.tweens.add({ targets: boss.barre.plein, width: largeur, duration: 160 });
    boss.barre.plein.setFillStyle(0xffffff);
    scene.time.delayedCall(80, () => { if (boss.barre.plein.active) boss.barre.plein.setFillStyle(0xe7e0e9); });
}

// ---------------------------------------------------------------------------------------------
// À chaque image
// ---------------------------------------------------------------------------------------------

function majBoss(scene, boss, temps) {
    if (!boss.active) return;
    if (boss.etat !== "mort" && !boss.pique) { // il flotte doucement de haut en bas et de gauche à droite ; il rejoint sa place en douceur après un piqué
        const cibleX = scene.areneCentreX + Math.sin(temps / 1700) * (160 + 40 * boss.phase);
        const cibleY = boss.departY + Math.sin(temps / 900) * 14;
        boss.x += (cibleX - boss.x) * 0.15;
        boss.y += (cibleY - boss.y) * 0.15;
    }
    if (boss.halo) boss.halo.setPosition(boss.x, boss.y);
    if (boss.etat === "combat" && scene.time.now >= boss.prochaineAttaque) lancerAttaque(scene, boss, choisirAttaque(scene, boss));
    majZones(scene);
    if (boss.pique && !boss.piqueTouche && scene.physics.overlap(scene.player, boss)) { // le robot est sur la trajectoire du piqué
        boss.piqueTouche = true; // un seul coup par piqué
        scene.blesserJoueur(1, "Percuté par le Dieu de la Lumière");
    }
}

function choisirAttaque(scene, boss) {
    if (boss.forcer) return boss.forcer; // TEST : boss.forcer = "balayage" (dans la console) lance toujours cette attaque
    // jamais deux fois la même de suite ; pas de lanternes s'il y en a déjà deux en l'air
    const dejaLa = scene.lanternesVivantes ? scene.lanternesVivantes.countActive() : 0;
    const possibles = ATTAQUES_PAR_PHASE[boss.phase].filter((nom) => nom !== boss.derniereAttaque && !(nom === "lanternes" && dejaLa >= 2));
    return Phaser.Utils.Array.GetRandom(possibles);
}

// ---------------------------------------------------------------------------------------------
// Les attaques
// ---------------------------------------------------------------------------------------------

function lancerAttaque(scene, boss, nom) {
    const id = ++boss.jeton; // si le boss change de phase ou meurt, jeton change et les suites de cette attaque sont annulées
    const valide = () => boss.etat === "attaque" && boss.jeton === id;
    boss.etat = "attaque";
    boss.derniereAttaque = nom;
    boss.play("boss_charge");
    jouerSon(scene, "mage_incante"); // le même bruit que le mage qui incante
    const { charge, apres } = ATTAQUES[nom];
    const annonce = annoncer(scene, boss, nom); // ce qui prévient le joueur pendant la préparation
    scene.time.delayedCall(charge, () => {
        if (!valide()) { nettoyerAnnonce(annonce); return; } // il est mort ou a changé de phase entre-temps
        boss.play("boss_attaque");
        executer(scene, boss, nom, annonce, valide);
        boss.once("animationcomplete-boss_attaque", () => { if (valide()) boss.play("boss_idle"); }); // il retrouve son calme visuellement
        scene.time.delayedCall(apres, () => { // l'effet est fini : la pause avant la prochaine attaque commence
            if (!valide()) return;
            boss.etat = "combat";
            boss.prochaineAttaque = scene.time.now + PAUSES[boss.phase];
        });
    });
}

function annoncer(scene, boss, nom) { // les avertissements : des traits clairs que le joueur doit lire pour s'écarter
    const sol = scene.areneSolY;
    const joueur = scene.player;
    if (nom === "colonne") { // le 1er trait suit le robot ; les autres sont fixes, de part et d'autre
        const zones = [zone(scene, { x: joueur.x, y: (boss.y + 40 + sol) / 2, w: 64, h: sol - boss.y - 40, trait: { w: 8, h: sol - boss.y - 40 }, suit: true })];
        const decalages = boss.phase === 0 ? [] : boss.phase === 1 ? [260] : [-260, 260];
        decalages.forEach((d) => { const x = Phaser.Math.Clamp(joueur.x + d, 80, 1200); zones.push(zone(scene, { x, y: (boss.y + 40 + sol) / 2, w: 64, h: sol - boss.y - 40, trait: { w: 8, h: sol - boss.y - 40 } })); });
        return { zones };
    }
    if (nom === "balayage") return { zones: [zone(scene, { x: 640, y: sol - 28, w: 1400, h: 56, trait: { w: 1400, h: 6 } })] }; // une ligne sur toute la largeur, à hauteur des pieds
    if (nom === "pluie") { // de petits traits en haut de l'écran : là où les orbes vont tomber
        const haut = scene.cameras.main.worldView.y + 14;
        const nombre = [6, 8, 10][boss.phase];
        const largeurCase = 1120 / nombre;
        const xs = Array.from({ length: nombre }, (_, i) => Math.round(80 + largeurCase * i + Phaser.Math.Between(10, largeurCase - 10)));
        const reperes = xs.map((x) => { const r = scene.add.rectangle(x, haut + 20, 6, 40, 0xfff2c0, 0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(51); scene.tweens.add({ targets: r, alpha: 0.15, duration: 110, yoyo: true, repeat: -1 }); return r; });
        return { xs, reperes, haut };
    }
    if (nom === "pique") return { zones: [zone(scene, { x: joueur.x, y: (boss.y + 40 + sol) / 2, w: 64, h: sol - boss.y - 40, trait: { w: 8, h: sol - boss.y - 40 }, suit: true, degats: false })] }; // le trait suit le robot puis se fige : le boss plongera là
    return {};
}

function nettoyerAnnonce(annonce) { // l'attaque est annulée : on enlève ses traits d'avertissement
    (annonce.zones || []).forEach((z) => detruireZone(z));
    (annonce.reperes || []).forEach((r) => r.destroy());
}

function executer(scene, boss, nom, annonce, valide) {
    if (nom === "orbes") tirerOrbes(scene, boss);
    else if (nom === "colonne" || nom === "balayage") annonce.zones.forEach((z) => declencher(scene, z));
    else if (nom === "pluie") faireTomberPluie(scene, boss, annonce, valide);
    else if (nom === "lanternes") invoquerLanternes(scene, boss, valide);
    else if (nom === "nova") lancerNova(scene, boss, valide);
    else if (nom === "pique") piquer(scene, boss, annonce);
}

// une orbe de lumière : le même halo que l'orbe du mage (ennemis.js), doré
function creerOrbe(scene, x, y, vx, vy) {
    const orbe = scene.tirsEnnemis.create(x, y, "halo");
    orbe.setScale(0.25);
    orbe.body.setCircle(40, 88, 88); // hitbox ronde de 40 px de rayon, centrée dans l'image
    orbe.setTint(0xfff2c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setPipeline("SinglePipeline");
    orbe.body.setVelocity(vx, vy);
    scene.time.delayedCall(6000, () => { if (orbe.active) orbe.destroy(); }); // elle disparaît au bout de 6 s si elle n'a rien touché
    return orbe;
}

function tirerOrbes(scene, boss) { // une salve en éventail, centrée sur le robot
    const nombre = [3, 5, 7][boss.phase];
    const ouverture = [36, 60, 84][boss.phase]; // degrés entre la première et la dernière orbe
    const vitesse = [250, 280, 310][boss.phase];
    const base = Phaser.Math.Angle.Between(boss.x, boss.y + 20, scene.player.x, scene.player.body.center.y);
    jouerSon(scene, "orbe");
    effets.eclats(scene, boss.x, boss.y + 20, ECLATS_OR[0], 10, ECLATS_OR[1]);
    for (let i = 0; i < nombre; i++) {
        const angle = base + Phaser.Math.DegToRad((i - (nombre - 1) / 2) * (ouverture / (nombre - 1)));
        creerOrbe(scene, boss.x, boss.y + 20, Math.cos(angle) * vitesse, Math.sin(angle) * vitesse);
    }
}

function faireTomberPluie(scene, boss, annonce, valide) { // les orbes tombent aux endroits annoncés, l'une après l'autre
    jouerSon(scene, "orbe");
    annonce.xs.forEach((x, i) => scene.time.delayedCall(i * 90, () => {
        if (annonce.reperes[i]) annonce.reperes[i].destroy();
        if (!valide()) return;
        creerOrbe(scene, x, annonce.haut, 0, 330);
    }));
}

function invoquerLanternes(scene, boss, valide) {
    const nombre = [2, 2, 3][boss.phase];
    for (let i = 0; i < nombre; i++) scene.time.delayedCall(i * 250, () => { if (valide()) invoquerLanterne(scene); });
    effets.eclats(scene, boss.x, boss.y - 30, ECLATS_OR[0], 12, ECLATS_OR[1]);
}

function lancerNova(scene, boss, valide) { // des anneaux d'orbes qui s'écartent : chaque anneau est décalé du précédent, ce qui laisse des trous
    const nombre = [12, 14, 16][boss.phase];
    const anneaux = boss.phase === 2 ? 3 : 2;
    for (let a = 0; a < anneaux; a++) scene.time.delayedCall(a * 450, () => {
        if (!valide()) return;
        jouerSon(scene, "orbe");
        effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 10, ECLATS_OR[1]);
        const decalage = (a % 2) * (Math.PI / nombre) + a * 0.15; // l'anneau suivant est tourné d'un demi-intervalle
        for (let i = 0; i < nombre; i++) {
            const angle = decalage + (i / nombre) * Math.PI * 2;
            creerOrbe(scene, boss.x, boss.y + 10, Math.cos(angle) * 200, Math.sin(angle) * 200);
        }
    });
}

function piquer(scene, boss, annonce) { // il plonge là où le trait s'est figé, reste un instant, puis remonte
    const z = annonce.zones[0];
    const cibleX = Phaser.Math.Clamp(z.x, 120, 1160);
    detruireZone(z);
    boss.pique = true;
    boss.piqueTouche = false;
    const idPique = boss.jeton;
    boss.tweenPique = scene.tweens.add({
        targets: boss, x: cibleX, y: scene.areneSolY - 130, duration: 420, ease: "Quad.In",
        onComplete: () => {
            scene.cameras.main.shake(180, 0.008);
            effets.eclats(scene, boss.x, scene.areneSolY, ECLATS_BLANC[0], 20, ECLATS_BLANC[1]);
            jouerSon(scene, "dash");
            scene.time.delayedCall(250, () => { // il reste en bas un instant : c'est le moment de lui tirer dessus
                if (!boss.active || boss.jeton !== idPique) return;
                boss.tweenPique = scene.tweens.add({ targets: boss, x: scene.areneCentreX, y: boss.departY, duration: 750, ease: "Sine.InOut", onComplete: () => { boss.pique = false; } });
            });
        }
    });
}

// ---------------------------------------------------------------------------------------------
// Les zones de lumière dangereuses (colonnes, balayage) : d'abord un trait d'avertissement, puis un rayon qui blesse
// ---------------------------------------------------------------------------------------------

function zone(scene, { x, y, w, h, trait, suit = false, degats = true }) {
    const t = scene.add.rectangle(x, y, trait.w, trait.h, 0xfff2c0, 0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    scene.tweens.add({ targets: t, alpha: { from: 0.15, to: 0.6 }, duration: 110, yoyo: true, repeat: -1 }); // il clignote : le danger est proche
    const z = { x, y, w, h, trait: t, suit, degats, etat: "annonce", verrouJusqua: scene.time.now + 600, touche: false, fin: 0, rayon: null };
    scene.zonesBoss.push(z);
    return z;
}

function declencher(scene, z) { // le rayon tombe
    z.trait.destroy();
    z.etat = "rayon";
    z.fin = scene.time.now + 450; // le rayon reste 0,45 s
    z.rayon = scene.add.rectangle(z.x, z.y, z.w, z.h, 0xfff2c0, 0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    scene.tweens.add({ targets: z.rayon, alpha: 0, scaleY: z.w > 400 ? 0.4 : 1, scaleX: z.w > 400 ? 1 : 0.5, duration: 450, ease: "Quad.In" });
    jouerSon(scene, "dash");
    effets.eclats(scene, z.x > 0 && z.w < 400 ? z.x : 640, scene.areneSolY, ECLATS_BLANC[0], 16, ECLATS_BLANC[1]);
    scene.cameras.main.shake(200, 0.006);
}

function detruireZone(z) {
    if (z.trait) z.trait.destroy();
    if (z.rayon) z.rayon.destroy();
    z.etat = "finie";
}

function majZones(scene) { // à chaque image
    const joueur = scene.player;
    const b = joueur.body;
    scene.zonesBoss = scene.zonesBoss.filter((z) => z.etat !== "finie");
    scene.zonesBoss.forEach((z) => {
        if (z.etat === "annonce") {
            if (z.suit && scene.time.now < z.verrouJusqua) { z.x = joueur.x; z.trait.x = z.x; } // il suit le robot pendant 0,6 s, puis se fige
            return;
        }
        if (scene.time.now >= z.fin) { detruireZone(z); return; }
        const dedans = b.center.x + b.halfWidth * 0.6 > z.x - z.w / 2 && b.center.x - b.halfWidth * 0.6 < z.x + z.w / 2 && b.bottom > z.y - z.h / 2 && b.top < z.y + z.h / 2;
        if (!z.touche && z.degats && dedans) { // le robot est dans le rayon
            z.touche = true; // un seul coup par rayon
            scene.blesserJoueur(1, "Foudroyé par le Dieu de la Lumière");
        }
    });
}

// ---------------------------------------------------------------------------------------------
// Dégâts, changements de phase et mort
// ---------------------------------------------------------------------------------------------

function toucherBoss(scene, boss, tir) {
    tir.destroy();
    if (boss.etat === "apparition" || boss.etat === "transition" || boss.etat === "mort") return; // intouchable en apparaissant, pendant un changement de phase, et mort
    boss.pv -= 1;
    effets.flash(boss, 0xffffff, 60); // il devient blanc 60 ms
    effets.eclats(scene, tir.x, tir.y, ECLATS_BLANC[0], 6, ECLATS_BLANC[1]);
    jouerSon(scene, "ennemi_touche");
    gagnerPoints(scene, POINTS_PAR_TIR, boss.x, boss.y - 120);
    majBarre(scene, boss);
    if (boss.pv <= 0) { mourir(scene, boss); return; }
    const phase = boss.pv <= SEUILS_PHASE[1] ? 2 : boss.pv <= SEUILS_PHASE[0] ? 1 : 0;
    if (phase > boss.phase) changerDePhase(scene, boss, phase);
}

function nettoyerCombat(scene, boss) { // efface tout ce que le boss avait lancé
    boss.jeton++; // annule les suites de l'attaque en cours
    if (boss.tweenPique) boss.tweenPique.stop();
    boss.pique = false;
    scene.tirsEnnemis.clear(true, true); // plus aucune orbe
    scene.zonesBoss.forEach((z) => detruireZone(z));
    scene.zonesBoss = [];
}

function changerDePhase(scene, boss, phase) {
    nettoyerCombat(scene, boss);
    boss.phase = phase;
    boss.etat = "transition"; // intouchable un instant
    boss.play("boss_charge");
    jouerSon(scene, "mage_incante");
    scene.cameras.main.flash(300, 255, 242, 192);
    scene.cameras.main.shake(400, 0.009);
    effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 28, ECLATS_OR[1]);
    lacherPV(scene, 640, boss.y + 60); // une croix de soin tombe au milieu de l'arène
    const texte = scene.add.text(640, 120, "PHASE " + (phase + 1), { fontFamily: "monospace", fontSize: "28px", color: "#f5f0f8", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(104);
    scene.tweens.add({ targets: texte, alpha: 0, y: 100, duration: 1600, delay: 400, onComplete: () => texte.destroy() });
    scene.time.delayedCall(DUREE_TRANSITION, () => {
        if (boss.etat !== "transition") return;
        boss.play("boss_idle");
        boss.etat = "combat";
        boss.prochaineAttaque = scene.time.now + 700;
    });
}

function mourir(scene, boss) {
    nettoyerCombat(scene, boss);
    boss.etat = "mort";
    boss.body.enable = false;
    if (scene.lanternesVivantes) scene.lanternesVivantes.clear(true, true); // ses lanternes s'éteignent avec lui
    jouerSon(scene, "ennemi_mort");
    jouerSon(scene, "joueur_mort");
    scene.cameras.main.shake(1500, 0.008);
    boss.play("boss_mort"); // il se dissout en 1 s
    scene.tweens.add({ targets: boss.halo, alpha: 0, duration: 1100 });
    scene.tweens.add({ targets: elementsBarre(boss), alpha: 0, duration: 800 });
    scene.time.addEvent({ delay: 140, repeat: 8, callback: () => { // des éclairs et des éclats pendant qu'il disparaît
        if (!boss.active) return;
        effets.flash(boss, 0xffffff, 60);
        effets.eclats(scene, boss.x + Phaser.Math.Between(-140, 140), boss.y + Phaser.Math.Between(-100, 100), ECLATS_OR[0], 10, ECLATS_OR[1]);
    } });
    boss.once("animationcomplete-boss_mort", () => {
        const { x, y } = boss;
        scene.cameras.main.flash(500, 255, 255, 255); // un dernier éclair blanc
        effets.eclats(scene, x, y, ECLATS_OR[0], 30, ECLATS_OR[1]);
        effets.eclats(scene, x, y, ECLATS_BLANC[0], 20, ECLATS_BLANC[1]);
        boss.destroy();
        elementsBarre(boss).forEach((e) => e.destroy());
        bossTue(scene, { x, y }); // +3000 points, arrête le chrono et ouvre le classement
    });
}
