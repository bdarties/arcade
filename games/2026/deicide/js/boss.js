// boss.js : le Dieu de la Lumière, le boss final, dans l'arène en haut du niveau 1
// Son dessin vient de 4 feuilles d'images de 152 x 116 px (assets/images/boss/), faites en code (voir le dossier sprite-boss) :
//   boss_idle (8 images, il plane), boss_charge (6, il prépare une attaque), boss_attaque (4, il la lance), boss_mort (8, il se dissout).
// Il apparaît quand arene.js ferme l'arène (voir faireApparaitreBoss), flotte en haut de la salle et enchaîne trois attaques :
//   - orbes : une salve d'orbes de lumière vers le robot (3, puis 5 quand il lui reste moins de la moitié de ses PV)
//   - colonne : un trait au sol annonce l'endroit où le robot se trouve, puis un rayon tombe du ciel
//   - lanternes : il invoque des lanternes vivantes qui foncent sur le robot (elles font mal, mais un tir les abat et donne un boost)
// Les tirs du robot le blessent. À 0 PV il se dissout, puis bossTue (points.js) arrête le chrono et ouvre le classement.
import { jouerSon } from "./sons.js";
import * as effets from "./effets.js";
import { gagnerPoints, bossTue } from "./points.js";
import { faireApparaitre as invoquerLanterne } from "./lanterneVivante.js";

const LARGEUR_IMAGE = 152; // une image des feuilles
const HAUTEUR_IMAGE = 116;
const ECHELLE = 3; // le sprite est agrandi x3 : 456 x 348 px à l'écran, avec des pixels francs de 3 px comme le HUD (l'arène fait 1280 px de large)
const PV_MAX = 30; // PV du boss (une trentaine de tirs)
const PV_PHASE_2 = 15; // en dessous : il attaque plus vite et plus fort
const PAUSE_ENTRE_ATTAQUES = [2800, 1900]; // ms entre deux attaques : phase 1, phase 2
const POINTS_PAR_TIR = 20; // points gagnés à chaque tir qui touche le boss (le bonus de 3000 est donné à sa mort, voir points.js)
const ATTAQUES = ["orbes", "colonne", "lanternes"];
const LARGEUR_BARRE = 520; // barre de vie du boss, en haut de l'écran

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
    boss.etat = "apparition"; // apparition -> combat <-> attaque -> mort
    boss.departY = y; // hauteur autour de laquelle il flotte
    boss.prochaineAttaque = Infinity; // pas d'attaque avant la fin de l'apparition
    boss.derniereAttaque = null;
    boss.phase2 = false;

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
    scene.tweens.add({ targets: [boss.barre.fond, boss.barre.plein, boss.barre.nom], alpha: 1, duration: 800 });

    scene.physics.add.overlap(scene.tirsJoueur, boss, (a, b) => toucherBoss(scene, boss, a === boss ? b : a)); // un tir du robot touche le boss
    scene.boss = boss;
    const suivre = (temps) => majBoss(scene, boss, temps);
    scene.events.on(Phaser.Scenes.Events.UPDATE, suivre);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, suivre));
    return boss;
}

// ---------------------------------------------------------------------------------------------
// Barre de vie : un cadre, une barre pleine et le nom, fixes en haut au milieu de l'écran
// ---------------------------------------------------------------------------------------------

function creerBarre(scene) {
    const y = 26;
    const fond = scene.add.rectangle(640, y, LARGEUR_BARRE + 8, 22, 0x251d2a).setStrokeStyle(2, 0x5f4f6e).setScrollFactor(0).setDepth(101).setAlpha(0);
    const plein = scene.add.rectangle(640 - LARGEUR_BARRE / 2, y, LARGEUR_BARRE, 12, 0xe7e0e9).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102).setAlpha(0);
    const nom = scene.add.text(640, y + 20, "DIEU DE LA LUMIÈRE", { fontFamily: "monospace", fontSize: "16px", color: "#8a779b", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102).setAlpha(0);
    return { fond, plein, nom };
}

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
    if (boss.etat !== "mort") { // il flotte doucement de haut en bas et de gauche à droite (et ne bouge plus quand il meurt)
        boss.x = scene.areneCentreX + Math.sin(temps / 1700) * 160;
        boss.y = boss.departY + Math.sin(temps / 900) * 14;
    }
    if (boss.halo) boss.halo.setPosition(boss.x, boss.y);
    if (boss.etat === "combat" && scene.time.now >= boss.prochaineAttaque) lancerAttaque(scene, boss, choisirAttaque(scene, boss));
    if (scene.colonne) majColonne(scene, boss);
}

function choisirAttaque(scene, boss) { // jamais deux fois la même de suite ; pas de lanternes s'il y en a déjà deux en l'air
    const dejaLa = scene.lanternesVivantes ? scene.lanternesVivantes.countActive() : 0;
    const possibles = ATTAQUES.filter((nom) => nom !== boss.derniereAttaque && !(nom === "lanternes" && dejaLa >= 2));
    return Phaser.Utils.Array.GetRandom(possibles);
}

// ---------------------------------------------------------------------------------------------
// Les attaques : il se prépare (animation « charge »), puis l'attaque part (animation « attaque »)
// ---------------------------------------------------------------------------------------------

function lancerAttaque(scene, boss, nom) {
    boss.etat = "attaque";
    boss.derniereAttaque = nom;
    boss.play("boss_charge");
    jouerSon(scene, "mage_incante"); // le même bruit que le mage qui incante
    const delai = nom === "colonne" ? 1100 : 650; // la colonne laisse plus de temps pour s'écarter
    if (nom === "colonne") annoncerColonne(scene, boss);
    scene.time.delayedCall(delai, () => {
        if (boss.etat !== "attaque") return; // il est mort entre-temps
        boss.play("boss_attaque");
        if (nom === "orbes") tirerOrbes(scene, boss);
        else if (nom === "colonne") faireTomberColonne(scene, boss);
        else invoquerLanternes(scene, boss);
        boss.once("animationcomplete-boss_attaque", () => { // l'attaque est lancée : il retrouve son calme
            if (boss.etat !== "attaque") return;
            boss.etat = "combat";
            boss.play("boss_idle");
            boss.prochaineAttaque = scene.time.now + PAUSE_ENTRE_ATTAQUES[boss.phase2 ? 1 : 0];
        });
    });
}

function tirerOrbes(scene, boss) { // une salve en éventail, centrée sur le robot
    const nombre = boss.phase2 ? 5 : 3;
    const ouverture = boss.phase2 ? 60 : 36; // degrés entre la première et la dernière orbe
    const base = Phaser.Math.Angle.Between(boss.x, boss.y + 20, scene.player.x, scene.player.body.center.y);
    jouerSon(scene, "orbe");
    effets.eclats(scene, boss.x, boss.y + 20, ECLATS_OR[0], 10, ECLATS_OR[1]);
    for (let i = 0; i < nombre; i++) {
        const angle = base + Phaser.Math.DegToRad((i - (nombre - 1) / 2) * (ouverture / (nombre - 1)));
        const orbe = scene.tirsEnnemis.create(boss.x, boss.y + 20, "halo"); // comme l'orbe du mage (ennemis.js) : le même halo, doré
        orbe.setScale(0.25);
        orbe.body.setCircle(40, 88, 88); // hitbox ronde de 40 px de rayon, centrée dans l'image
        orbe.setTint(0xfff2c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setPipeline("SinglePipeline");
        scene.physics.velocityFromRotation(angle, 250, orbe.body.velocity);
        scene.time.delayedCall(5000, () => { if (orbe.active) orbe.destroy(); }); // elle disparaît au bout de 5 s si elle n'a rien touché
    }
}

function annoncerColonne(scene, boss) { // un trait clair au sol, qui suit le robot un instant puis se fige
    const haut = boss.y + 40;
    const bas = scene.areneSolY;
    const trait = scene.add.rectangle(scene.player.x, (haut + bas) / 2, 8, bas - haut, 0xfff2c0, 0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    scene.tweens.add({ targets: trait, alpha: { from: 0.15, to: 0.6 }, duration: 110, yoyo: true, repeat: -1 }); // il clignote : le danger est proche
    scene.colonne = { etat: "annonce", x: scene.player.x, trait, haut, bas, verrouJusqua: scene.time.now + 600, touche: false };
}

function faireTomberColonne(scene, boss) {
    const c = scene.colonne;
    if (!c) return;
    c.trait.destroy();
    c.etat = "rayon";
    c.fin = scene.time.now + 450; // le rayon reste 0,45 s
    c.rayon = scene.add.rectangle(c.x, (c.haut + c.bas) / 2, 64, c.bas - c.haut, 0xfff2c0, 0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    scene.tweens.add({ targets: c.rayon, alpha: 0, scaleX: 0.5, duration: 450, ease: "Quad.In" });
    jouerSon(scene, "dash");
    effets.eclats(scene, c.x, c.bas, ECLATS_BLANC[0], 16, ECLATS_BLANC[1]);
    scene.cameras.main.shake(200, 0.006);
}

function majColonne(scene, boss) { // appelée à chaque image tant qu'une colonne existe
    const c = scene.colonne;
    const joueur = scene.player;
    if (c.etat === "annonce") {
        if (scene.time.now < c.verrouJusqua) { c.x = joueur.x; c.trait.x = c.x; } // elle suit le robot pendant 0,6 s, puis se fige
        return;
    }
    if (scene.time.now >= c.fin) { c.rayon.destroy(); scene.colonne = null; return; }
    if (!c.touche && scene.pv > 0 && Math.abs(joueur.body.center.x - c.x) < 32 + joueur.body.halfWidth * 0.6 && joueur.body.center.y > c.haut) { // le robot est dans le rayon
        c.touche = true; // un seul coup par rayon
        scene.blesserJoueur(1, "Foudroyé par le Dieu de la Lumière");
    }
}

function invoquerLanternes(scene, boss) {
    const nombre = boss.phase2 ? 3 : 2;
    for (let i = 0; i < nombre; i++) scene.time.delayedCall(i * 250, () => { if (boss.etat === "attaque" || boss.etat === "combat") invoquerLanterne(scene); });
    effets.eclats(scene, boss.x, boss.y - 30, ECLATS_OR[0], 12, ECLATS_OR[1]);
}

// ---------------------------------------------------------------------------------------------
// Dégâts et mort
// ---------------------------------------------------------------------------------------------

function toucherBoss(scene, boss, tir) {
    tir.destroy();
    if (boss.etat === "apparition" || boss.etat === "mort") return; // il est intouchable en apparaissant, et on ne frappe pas un mort
    boss.pv -= 1;
    effets.flash(boss, 0xffffff, 60); // il devient blanc 60 ms
    effets.eclats(scene, tir.x, tir.y, ECLATS_BLANC[0], 6, ECLATS_BLANC[1]);
    jouerSon(scene, "ennemi_touche");
    gagnerPoints(scene, POINTS_PAR_TIR, boss.x, boss.y - 120);
    majBarre(scene, boss);
    if (!boss.phase2 && boss.pv <= PV_PHASE_2) { // moins de la moitié des PV : phase 2
        boss.phase2 = true;
        scene.cameras.main.flash(250, 255, 242, 192);
        scene.cameras.main.shake(300, 0.008);
        effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 24, ECLATS_OR[1]);
    }
    if (boss.pv <= 0) mourir(scene, boss);
}

function mourir(scene, boss) {
    boss.etat = "mort";
    boss.body.enable = false;
    scene.tirsEnnemis.clear(true, true); // plus aucune orbe
    if (scene.colonne) { scene.colonne.trait.destroy(); if (scene.colonne.rayon) scene.colonne.rayon.destroy(); scene.colonne = null; }
    if (scene.lanternesVivantes) scene.lanternesVivantes.clear(true, true); // ses lanternes s'éteignent avec lui
    jouerSon(scene, "ennemi_mort");
    jouerSon(scene, "joueur_mort");
    scene.cameras.main.shake(1500, 0.008);
    boss.play("boss_mort"); // il se dissout en 1 s
    scene.tweens.add({ targets: boss.halo, alpha: 0, duration: 1100 });
    scene.tweens.add({ targets: [boss.barre.fond, boss.barre.plein, boss.barre.nom], alpha: 0, duration: 800 });
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
        [boss.barre.fond, boss.barre.plein, boss.barre.nom].forEach((e) => e.destroy());
        bossTue(scene, { x, y }); // +3000 points, arrête le chrono et ouvre le classement
    });
}
