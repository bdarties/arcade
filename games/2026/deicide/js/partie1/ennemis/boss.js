// boss.js : le Dieu de la Lumière, le boss qui garde le sommet du niveau 1 (profil « soldat »).
// Le fichier est un MOTEUR : les réglages de chaque boss sont dans une table de profils (PROFILS) et ses attaques dans une table d'attaques (ATTAQUES).
// La partie 2 du jeu (js/partie2) ajoute dans ces deux tables le boss final et ses attaques, sans modifier ce fichier.
// Son dessin vient de 4 feuilles d'images de 152 x 116 px (assets/images/boss/), faites en code (voir le dossier sprite-boss) :
//   boss_idle (8 images, il plane), boss_charge (6, il prépare une attaque), boss_attaque (4, il la lance), boss_mort (8, il se dissout).
// Il apparaît quand arene.js ferme l'arène (voir faireApparaitreBoss), flotte en haut de la salle et attaque.
//
// 2 PHASES (selon ses PV) : au changement il devient invulnérable un instant, il lâche un PV à ramasser, et il se débloque
// de nouvelles attaques et il va plus vite.
//   phase 1 : orbes, colonne, pluie, lanternes
//   phase 2 : + balayage, nova (et plus d'orbes, 2 colonnes)
//
// LES ATTAQUES : il se prépare (animation « charge », avec une annonce visible), puis l'attaque part (animation « attaque »)
//   - orbes     : une salve d'orbes de lumière en éventail vers le robot
//   - colonne   : des traits clignotants au sol annoncent des rayons qui tombent du ciel (le premier suit le robot un instant)
//   - pluie     : des orbes tombent du haut de l'écran à des endroits annoncés par de petits traits ; une plateforme protège en dessous
//   - lanternes : il invoque des lanternes vivantes (elles font mal, mais un tir les abat et donne un boost)
//   - balayage  : un rayon horizontal frôle le sol de toute l'arène : il faut sauter ou monter sur une plateforme
//   - nova      : des anneaux d'orbes lentes s'écartent de lui, avec des trous entre les orbes
// Les tirs du robot le blessent. À 0 PV, le joueur choisit : arrêter la partie ici (le boss est vaincu), ou entrer dans le panthéon (OUI) : la
// suite du jeu est alors dans js/partie2 (profil.suite).
import { jouerSon, jouerSonSurLeTemps, surLeTemps, quantifier, musiqueBoss, musiqueNiveau } from "../systemes/sons.js";
import * as effets from "../systemes/effets.js";
import { gagnerPoints, finirPartie } from "../systemes/points.js";
import { faireApparaitre as invoquerLanterne } from "./lanterneVivante.js";
import { lacherPV } from "../mecanismes/bonus.js";

const LARGEUR_IMAGE = 152; // une image des feuilles
const HAUTEUR_IMAGE = 116;
const ECHELLE = 3; // le sprite est agrandi x3 : 456 x 348 px à l'écran, avec des pixels francs de 3 px comme le HUD (l'arène fait 1280 px de large)
const DUREE_TRANSITION = 2000; // ms d'invulnérabilité à chaque changement de phase (plus que la plus longue préparation d'attaque)
const POINTS_PAR_TIR = 10; // points gagnés à chaque tir qui touche le boss
const LARGEUR_BARRE = 520; // barre de vie du boss, en haut de l'écran

// Un profil par boss. pv, seuils (PV sous lesquels on passe en phase 2 puis 3 ; -1 = cette phase n'existe pas), attaques (par phase),
// pauses (ms entre deux attaques, par phase), echelle (taille du sprite), teinte (couleur du sprite, null = d'origine), nom (sur la barre de vie),
// cause (texte de mort), points (bonus quand il est vaincu).
// Un profil peut aussi avoir (tout est facultatif, la partie 2 s'en sert pour le boss final) : reglages (des valeurs qui remplacent celles de BASE,
// une entrée par phase), dureeEnPlus(nom, boss), apresColonnes(scene, boss, valide), finDeCombat(scene, boss), suite(scene, boss), musique,
// pvPleinsApresMort, pvDePhase(phase) (les PV d'une phase, s'ils ne sont pas profil.pv), pvMinimum(boss) (sous cette valeur le boss ne peut pas
// descendre), choisirAttaque(scene, boss) (sa propre façon de tirer les attaques), apresApparition(scene, boss), etiquettePhase(phase),
// pvDebutPhase(phase) (les PV du boss quand il ENTRE dans cette phase, ou rien : il garde ceux qu'il a).
export const PROFILS = {
    soldat: {
        pantheon: true, // à 0 PV, le joueur choisit : arrêter la partie ici ou continuer (OUI : profil.suite, définie par la partie 2) (voir proposerPantheon)
        pv: 80, seuils: [50, -1], echelle: ECHELLE, teinte: null, nom: "DIEU DE LA LUMIÈRE", cause: "le Dieu de la Lumière", points: 1000,
        pauses: [2000, 1500],
        attaques: [["orbes", "colonne", "pluie", "lanternes"], ["orbes", "colonne", "pluie", "lanternes", "balayage", "nova"]]
    }
};
let profil = PROFILS.soldat; // le profil du boss en cours (un seul boss à la fois : choisi par faireApparaitreBoss)

// Les réglages du boss, une entrée par phase : combien d'orbes, à quelle vitesse, etc. Un profil peut les remplacer (profil.reglages).
//   charge : multiplicateur du temps d'annonce      orbes / ouverture / vitesse : une salve d'orbes (nombre, angle total en degrés, px/s)
//   salves : salves d'orbes de suite                pluie / pluieVitesse : orbes de la pluie, leur vitesse
//   colonnes : décalages (px) des colonnes fixes de part et d'autre de celle qui suit le robot
//   nova : [orbes par anneau, anneaux, vitesse]     lanternes : lanternes invoquées      periodeMouvement : durée (ms) d'un va-et-vient du boss
const BASE = [
    { charge: 1, orbes: 3, ouverture: 36, vitesse: 290, salves: 1, pluie: 6, pluieVitesse: 390, colonnes: [], nova: [12, 2, 230], lanternes: 2, periodeMouvement: 1450 },
    { charge: 1, orbes: 5, ouverture: 60, vitesse: 325, salves: 1, pluie: 8, pluieVitesse: 390, colonnes: [260], nova: [14, 2, 230], lanternes: 2, periodeMouvement: 1450 }
];
export function reglages(boss) { // les réglages de la phase en cours : ceux de BASE, remplacés par ceux du profil
    const base = BASE[Math.min(boss.phase, BASE.length - 1)];
    const propres = profil.reglages && profil.reglages[boss.phase];
    return propres ? { ...base, ...propres } : base;
}

// les feuilles : clé, nombre d'images, images par seconde, répétition (-1 = en boucle, 0 = une fois)
const ANIMATIONS = [["boss_idle", 8, 8, -1], ["boss_charge", 6, 12, 0], ["boss_attaque", 4, 16, 0], ["boss_mort", 8, 7, 0]];
export const ECLATS_OR = [0xffd45c, 300]; // mêmes réglages que les éclats de lanterne vivante (effets.js) : l'émetteur est déjà fabriqué
export const ECLATS_BLANC = [0xffffff, 190];

export function chargerBoss(scene) { // à appeler dans chargerJeu (preload)
    ANIMATIONS.forEach(([cle]) => scene.load.spritesheet(cle, "./assets/images/boss/" + cle + ".png", { frameWidth: LARGEUR_IMAGE, frameHeight: HAUTEUR_IMAGE }));
}

export function creerAnimations(scene) { // crée une seule fois les 4 animations (exportée : poursuite.js dessine le même boss)
    ANIMATIONS.forEach(([cle, nb, vitesse, repeat]) => {
        scene.textures.get(cle).setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
        if (!scene.anims.exists(cle)) scene.anims.create({ key: cle, frames: scene.anims.generateFrameNumbers(cle, { start: 0, end: nb - 1 }), frameRate: vitesse, repeat });
    });
}

export function faireApparaitreBoss(scene, x, y, nomProfil = "soldat") { // fait apparaître le boss en (x, y) : le centre de son sprite
    profil = PROFILS[nomProfil]; // les réglages de ce boss
    profil.cle = nomProfil; // son nom, pour retenir la phase atteinte (voir changerDePhase)
    creerAnimations(scene);
    musiqueBoss(scene, profil.musique); // la musique metal du combat démarre avec l'apparition du boss
    const boss = scene.physics.add.sprite(x, y, "boss_idle", 0); // un sprite avec un corps physique, pour les tirs du joueur
    boss.profil = profil; // les attaques de la partie 2 retrouvent ainsi son profil
    boss.body.setAllowGravity(false); // il vole : la gravité ne l'affecte pas
    boss.body.setImmovable(true);
    boss.body.setSize(34, 90).setOffset(59, 22); // la hitbox est le corps de l'ange, sans les ailes
    boss.setScale(profil.echelle).setDepth(51).setAlpha(0);
    // la teinte revient après chaque flash (voir effets.flash) // au-dessus du voile d'ombre (50) : c'est lui la lumière
    if (profil.teinte) { boss.setTint(profil.teinte); boss.teinteBase = profil.teinte; }
    boss.play("boss_idle");
    // reprise après une mort : le combat repart au début de la phase où le robot est mort (voir changerDePhase), pas depuis la phase 1
    const reprise = scene.registry.get("phaseBoss");
    const phaseDepart = reprise && reprise.profil === nomProfil ? reprise.phase : 0;
    // au début d'une phase, le boss a exactement les PV de son seuil (sauf si la reprise donne ses PV : touche de test F10, voir partie2/testsBorne.js)
    boss.pvMax = profil.pvDePhase ? profil.pvDePhase(phaseDepart) : profil.pv; // les PV de la phase de départ (la barre de vie se règle dessus)
    boss.pv = reprise && reprise.pv !== undefined && reprise.profil === nomProfil ? reprise.pv : phaseDepart === 0 || profil.pvPleinsApresMort ? boss.pvMax : profil.seuils[phaseDepart - 1]; // pvPleinsApresMort : après une mort il garde la phase atteinte mais repart avec TOUS ses PV
    boss.etat = "apparition"; // apparition -> combat <-> attaque -> transition (changement de phase) ; puis choix, fin (ou ce que fait la partie 2)
    boss.phase = phaseDepart; // 0 ou 1 (2 pour un boss à 3 phases)
    if (reprise && reprise.pv !== undefined) scene.registry.set("phaseBoss", { profil: nomProfil, phase: phaseDepart }); // les PV donnés ne servent qu'une fois : après une mort, le boss reprend au seuil de sa phase
    boss.departY = y; // hauteur autour de laquelle il flotte
    boss.prochaineAttaque = Infinity; // pas d'attaque avant la fin de l'apparition
    boss.derniereAttaque = null;
    boss.faits = new Set(); // les attaques que le boss a lancées depuis le début de cette phase (voir pvMinimum)
    boss.jeton = 0; // numéro de l'attaque en cours : une attaque interrompue (changement de phase, mort) ne fait plus rien
    boss.enMouvement = false; // vrai quand une attaque déplace elle-même le boss (il ne flotte plus : voir majBoss)
    boss.fige = false; // vrai quand le boss ne doit plus bouger du tout
    boss.intouchable = false; // vrai quand les tirs du robot ne lui font plus rien
    scene.zonesBoss = [];
    Object.values(ATTAQUES).forEach((def) => { if (def.demarrer) def.demarrer(scene, boss); }); // chaque attaque prépare ce dont elle a besoin

    if (scene.textures.exists("halo_doux")) { // une lueur dorée derrière lui (la texture vient d'ennemis.js)
        const halo = scene.add.image(x, y, "halo_doux");
        halo.setScale(4.2).setTint(0xfff2c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0).setPipeline("SinglePipeline");
        boss.halo = halo;
        boss.once("destroy", () => halo.destroy());
    }
    boss.barre = creerBarre(scene);
    boss.barre.plein.width = LARGEUR_BARRE * boss.pv / boss.pvMax; // la barre est déjà au bon niveau si on reprend en phase 2 ou 3
    scene.tweens.add({ targets: [boss, boss.halo].filter(Boolean), alpha: { value: (cible) => (cible === boss ? 1 : 0.35) }, duration: 1500, onComplete: () => {
        boss.etat = "combat";
        boss.prochaineAttaque = scene.time.now + surLeTemps(scene, 1200); // la première attaque arrive peu après, sur une croche
    } });
    scene.tweens.add({ targets: elementsBarre(boss), alpha: 1, duration: 800 });

    scene.physics.add.overlap(scene.tirsJoueur, boss, (a, b) => toucherBoss(scene, boss, a === boss ? b : a)); // un tir du robot touche le boss
    scene.boss = boss;
    if (profil.apresApparition) profil.apresApparition(scene, boss); // (le boss final retrouve ici sa forme finale si le robot est mort contre elle)
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
    // un trait à chaque changement de phase
    const reperes = profil.seuils.filter((seuil) => seuil > 0).map((seuil) => scene.add.rectangle(gauche + LARGEUR_BARRE * seuil / profil.pv, y, 3, 18, 0x251d2a).setScrollFactor(0).setDepth(103).setAlpha(0));
    const nom = scene.add.text(640, y + 20, profil.nom, { fontFamily: "monospace", fontSize: "16px", color: "#8a779b", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102).setAlpha(0);
    return { fond, plein, reperes, nom };
}

export function elementsBarre(boss) { return [boss.barre.fond, boss.barre.plein, boss.barre.nom, ...boss.barre.reperes]; }

function majBarre(scene, boss) { // la barre rétrécit en douceur, avec un éclat blanc
    const largeur = LARGEUR_BARRE * Math.max(0, boss.pv) / boss.pvMax;
    scene.tweens.add({ targets: boss.barre.plein, width: largeur, duration: 160 });
    boss.barre.plein.setFillStyle(0xffffff);
    scene.time.delayedCall(80, () => { if (boss.barre.plein.active) boss.barre.plein.setFillStyle(0xe7e0e9); });
}

// ---------------------------------------------------------------------------------------------
// À chaque image
// ---------------------------------------------------------------------------------------------

function majBoss(scene, boss, temps) {
    if (!boss.active) return;
    // il flotte doucement de haut en bas et de gauche à droite ; il rejoint sa place en douceur quand une attaque l'a déplacé
    if (!boss.fige && !boss.enMouvement) {
        const cibleX = scene.areneCentreX + Math.sin(temps / reglages(boss).periodeMouvement) * (160 + 40 * boss.phase);
        const cibleY = boss.departY + Math.sin(temps / 900) * 14;
        boss.x += (cibleX - boss.x) * 0.15;
        boss.y += (cibleY - boss.y) * 0.15;
    }
    if (boss.halo) boss.halo.setPosition(boss.x, boss.y);
    if (boss.etat === "combat" && scene.time.now >= boss.prochaineAttaque) lancerAttaque(scene, boss, choisirAttaque(scene, boss));
    majZones(scene);
    Object.values(ATTAQUES).forEach((def) => { if (def.maj) def.maj(scene, boss); }); // ce que certaines attaques font à chaque image
}

function choisirAttaque(scene, boss) {
    if (boss.forcer) return boss.forcer; // TEST : boss.forcer = "balayage" (dans la console) lance toujours cette attaque
    if (profil.choisirAttaque) { const choix = profil.choisirAttaque(scene, boss); if (choix) return choix; } // un boss peut tirer ses attaques à sa façon (partie 2)
    // jamais deux fois la même de suite ; pas de lanternes s'il y en a déjà deux en l'air
    const dejaLa = scene.lanternesVivantes ? scene.lanternesVivantes.countActive() : 0;
    const possibles = profil.attaques[boss.phase].filter((nom) => nom !== boss.derniereAttaque && !(nom === "lanternes" && dejaLa >= 2));
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
    const def = ATTAQUES[nom];
    // (durées arrondies à des croches : tout reste en rythme avec la musique)
    const apres = quantifier(def.apres + (profil.dureeEnPlus ? profil.dureeEnPlus(nom, boss) : 0));
    // une annonce plus courte pour un boss plus dur (réglage « charge »). Pas moins de 0,6 s environ : le trait de la colonne suit le robot 0,5 s puis
    // se fige (voir zone) ; si l'annonce durait moins, la colonne tomberait avant de se figer, pile sur le robot, impossible à éviter
    const charge = quantifier(def.charge * reglages(boss).charge);
    const annonce = def.annoncer ? def.annoncer(scene, boss) : {}; // ce qui prévient le joueur pendant la préparation
    scene.time.delayedCall(charge, () => {
        if (!valide()) { nettoyerAnnonce(nom, annonce); return; } // il est mort ou a changé de phase entre-temps
        boss.play("boss_attaque");
        boss.faits.add(nom); // cette attaque est faite (le boss final ne peut pas mourir avant d'avoir tout lancé : voir pvMinimum)
        def.executer(scene, boss, annonce, valide);
        boss.once("animationcomplete-boss_attaque", () => { if (valide()) boss.play("boss_idle"); }); // il retrouve son calme visuellement
        scene.time.delayedCall(apres, () => { // l'effet est fini : la pause avant la prochaine attaque commence
            if (!valide()) return;
            boss.etat = "combat";
            // la prochaine attaque part sur une croche
            boss.prochaineAttaque = scene.time.now + surLeTemps(scene, quantifier(profil.pauses[boss.phase]));
        });
    });
}

function nettoyerAnnonce(nom, annonce) { // l'attaque est annulée : on enlève ses traits d'avertissement
    (annonce.zones || []).forEach((z) => detruireZone(z));
    (annonce.reperes || []).forEach((r) => r.destroy());
    if (ATTAQUES[nom].nettoyerAnnonce) ATTAQUES[nom].nettoyerAnnonce(annonce); // (les attaques de la partie 2 ont leurs propres traits)
}

// une attaque : charge (ms de préparation avant le départ) ; apres (ms que dure encore l'effet avant que la pause commence) ;
// annoncer(scene, boss) → ce qui prévient le joueur (facultatif) ; executer(scene, boss, annonce, valide) → l'attaque elle-même ;
// et, facultatifs, pour les attaques qui ont besoin de plus : nettoyerAnnonce(annonce), demarrer(scene, boss), maj(scene, boss), nettoyer(scene, boss).
// La partie 2 y ajoute les attaques du boss final.
export const ATTAQUES = {
    orbes: {
        charge: 520, apres: 0,
        executer(scene, boss, annonce, valide) {
            tirerOrbes(scene, boss);
            // des salves supplémentaires juste derrière la première (réglage « salves » : 1 pour ce boss)
            for (let k = 1; k < reglages(boss).salves; k++) scene.time.delayedCall(350 * k, () => { if (valide()) tirerOrbes(scene, boss); });
        }
    },
    colonne: {
        charge: 900, apres: 500,
        annoncer(scene, boss) { // le 1er trait suit le robot ; les autres sont fixes, de part et d'autre
            const sol = scene.areneSolY;
            const joueur = scene.player;
            const zones = [zone(scene, { x: joueur.x, y: (boss.y + 40 + sol) / 2, w: 64, h: sol - boss.y - 40, trait: { w: 8, h: sol - boss.y - 40 }, suit: true })];
            reglages(boss).colonnes.forEach((d) => { const x = Phaser.Math.Clamp(joueur.x + d, 80, 1200); zones.push(zone(scene, { x, y: (boss.y + 40 + sol) / 2, w: 64, h: sol - boss.y - 40, trait: { w: 8, h: sol - boss.y - 40 } })); });
            return { zones };
        },
        executer(scene, boss, annonce, valide) {
            annonce.zones.forEach((z) => declencher(scene, z));
            if (profil.apresColonnes) profil.apresColonnes(scene, boss, valide); // (le boss final enchaîne un balayage : partie 2)
        }
    },
    pluie: {
        charge: 720, apres: 1100,
        annoncer(scene, boss) { // de petits traits en haut de l'écran : là où les orbes vont tomber
            const haut = scene.cameras.main.worldView.y + 14;
            const nombre = reglages(boss).pluie;
            const largeurCase = 1120 / nombre;
            const xs = Array.from({ length: nombre }, (_, i) => Math.round(80 + largeurCase * i + Phaser.Math.Between(10, largeurCase - 10)));
            const reperes = xs.map((x) => { const r = scene.add.rectangle(x, haut + 20, 6, 40, 0xfff2c0, 0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(51); effets.clignoter(scene, r, { alpha: 0.15, duration: 110 }); return r; });
            return { xs, reperes, haut };
        },
        executer: faireTomberPluie
    },
    lanternes: { charge: 520, apres: 0, executer: (scene, boss, annonce, valide) => invoquerLanternes(scene, boss, valide) },
    balayage: {
        charge: 900, apres: 600,
        annoncer(scene) { return { zones: [zone(scene, { x: 640, y: scene.areneSolY - 28, w: 1400, h: 56, trait: { w: 1400, h: 6 } })] }; }, // une ligne sur toute la largeur, à hauteur des pieds
        executer(scene, boss, annonce) { annonce.zones.forEach((z) => declencher(scene, z)); }
    },
    nova: { charge: 560, apres: 900, executer: (scene, boss, annonce, valide) => lancerNova(scene, boss, valide) }
};

// une orbe de lumière : le même halo que l'orbe du mage (ennemis.js), doré
export function creerOrbe(scene, x, y, vx, vy) { // (exportée : poursuite.js lance les mêmes orbes)
    const orbe = scene.tirsEnnemis.create(x, y, "halo");
    orbe.setScale(0.25);
    orbe.body.setCircle(40, 88, 88); // hitbox ronde de 40 px de rayon, centrée dans l'image
    orbe.setTint(0xfff2c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setPipeline("SinglePipeline");
    orbe.body.setVelocity(vx, vy);
    scene.time.delayedCall(3000, () => { if (orbe.active) orbe.destroy(); }); // elle disparaît au bout de 3 s si elle n'a rien touché : elle a quitté l'écran bien avant, et moins d'orbes en même temps ménage la borne
    return orbe;
}

function tirerOrbes(scene, boss) { // une salve en éventail, centrée sur le robot
    const { orbes: nombre, ouverture, vitesse } = reglages(boss); // nombre d'orbes, degrés entre la première et la dernière, vitesse
    const base = Phaser.Math.Angle.Between(boss.x, boss.y + 20, scene.player.x, scene.player.body.center.y);
    jouerSonSurLeTemps(scene, "orbe");
    effets.eclats(scene, boss.x, boss.y + 20, ECLATS_OR[0], 10, ECLATS_OR[1]);
    for (let i = 0; i < nombre; i++) {
        const angle = base + Phaser.Math.DegToRad((i - (nombre - 1) / 2) * (ouverture / (nombre - 1)));
        creerOrbe(scene, boss.x, boss.y + 20, Math.cos(angle) * vitesse, Math.sin(angle) * vitesse);
    }
}

function faireTomberPluie(scene, boss, annonce, valide) { // les orbes tombent aux endroits annoncés, l'une après l'autre
    jouerSonSurLeTemps(scene, "orbe");
    annonce.xs.forEach((x, i) => scene.time.delayedCall(i * 70, () => {
        if (annonce.reperes[i]) annonce.reperes[i].destroy();
        if (!valide()) return;
        creerOrbe(scene, x, annonce.haut, 0, reglages(boss).pluieVitesse);
    }));
}

function invoquerLanternes(scene, boss, valide) {
    const nombre = reglages(boss).lanternes;
    for (let i = 0; i < nombre; i++) scene.time.delayedCall(i * 250, () => { if (valide()) invoquerLanterne(scene); });
    effets.eclats(scene, boss.x, boss.y - 30, ECLATS_OR[0], 12, ECLATS_OR[1]);
}

function lancerNova(scene, boss, valide) { // des anneaux d'orbes qui s'écartent : chaque anneau est décalé du précédent, ce qui laisse des trous
    const [nombre, anneaux, vitesseNova] = reglages(boss).nova;
    for (let a = 0; a < anneaux; a++) scene.time.delayedCall(a * 380, () => {
        if (!valide()) return;
        jouerSonSurLeTemps(scene, "orbe");
        effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 10, ECLATS_OR[1]);
        const decalage = (a % 2) * (Math.PI / nombre) + a * 0.15; // l'anneau suivant est tourné d'un demi-intervalle
        for (let i = 0; i < nombre; i++) {
            const angle = decalage + (i / nombre) * Math.PI * 2;
            creerOrbe(scene, boss.x, boss.y + 10, Math.cos(angle) * vitesseNova, Math.sin(angle) * vitesseNova);
        }
    });
}

// ---------------------------------------------------------------------------------------------
// Les zones de lumière dangereuses (colonnes, balayage) : d'abord un trait d'avertissement, puis un rayon qui blesse
// ---------------------------------------------------------------------------------------------

export function zone(scene, { x, y, w, h, trait, suit = false, degats = true }) {
    const t = scene.add.rectangle(x, y, trait.w, trait.h, 0xfff2c0, trait.w > 400 && trait.h > 200 ? 0.14 : 0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    const grand = trait.w > 400 && trait.h > 200; // un grand rectangle de lumière doit rester plus discret qu'un trait fin
    // il clignote : le danger est proche
    effets.clignoter(scene, t, { alpha: grand ? { from: 0.05, to: 0.22 } : { from: 0.15, to: 0.6 }, duration: 110 });
    const z = { x, y, w, h, trait: t, suit, degats, etat: "annonce", verrouJusqua: scene.time.now + 500, touche: false, fin: 0, rayon: null };
    scene.zonesBoss.push(z);
    return z;
}

export function declencher(scene, z) { // le rayon tombe
    z.trait.destroy();
    z.etat = "rayon";
    z.fin = scene.time.now + 450; // le rayon reste 0,45 s
    z.rayon = scene.add.rectangle(z.x, z.y, z.w, z.h, 0xfff2c0, 0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    scene.tweens.add({ targets: z.rayon, alpha: 0, scaleY: z.w > 400 && z.h < 200 ? 0.4 : 1, scaleX: z.w > 400 ? (z.h < 200 ? 1 : 0.7) : 0.5, duration: 450, ease: "Quad.In" });
    jouerSonSurLeTemps(scene, "dash");
    effets.eclats(scene, z.x > 0 && z.w < 400 ? z.x : 640, scene.areneSolY, ECLATS_BLANC[0], 16, ECLATS_BLANC[1]);
    scene.cameras.main.shake(200, 0.006);
}

export function detruireZone(z) {
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
            scene.blesserJoueur(1, "Foudroyé par " + profil.cause, true); // (un rayon blesse même un robot en boule)
        }
    });
}

// ---------------------------------------------------------------------------------------------
// Dégâts, changements de phase et fin du combat
// ---------------------------------------------------------------------------------------------

const ETATS_SANS_DEGATS = ["apparition", "transition", "choix", "fin"]; // pendant ces états, les tirs du robot ne lui font rien (boss.intouchable : la partie 2)

function toucherBoss(scene, boss, tir) {
    tir.destroy();
    if (boss.intouchable || ETATS_SANS_DEGATS.includes(boss.etat)) return;
    if (profil.pvMinimum && boss.pv - 1 < profil.pvMinimum(boss)) { effets.flash(boss, 0xffd45c, 60); return; } // il tient bon : le coup ne compte pas (ni PV, ni points)
    boss.pv -= 1;
    effets.flash(boss, 0xffffff, 60); // il devient blanc 60 ms
    effets.eclats(scene, tir.x, tir.y, ECLATS_BLANC[0], 6, ECLATS_BLANC[1]);
    jouerSon(scene, "ennemi_touche");
    gagnerPoints(scene, POINTS_PAR_TIR, boss.x, boss.y - 120);
    majBarre(scene, boss);
    // à 0 PV : le Dieu du niveau 1 propose le choix du panthéon ; un boss final (partie 2) a sa propre fin de combat
    if (boss.pv <= 0) { if (profil.pantheon) proposerPantheon(scene, boss); else profil.finDeCombat(scene, boss); return; }
    const phase = boss.pv <= profil.seuils[1] ? 2 : boss.pv <= profil.seuils[0] ? 1 : 0;
    if (phase > boss.phase) changerDePhase(scene, boss, phase);
}

export function nettoyerCombat(scene, boss) { // efface tout ce que le boss avait lancé
    boss.jeton++; // annule les suites de l'attaque en cours
    boss.enMouvement = false;
    scene.tirsEnnemis.clear(true, true); // plus aucune orbe
    scene.zonesBoss.forEach((z) => detruireZone(z));
    scene.zonesBoss = [];
    Object.values(ATTAQUES).forEach((def) => { if (def.nettoyer) def.nettoyer(scene, boss); }); // et ce que les attaques de la partie 2 avaient posé
}

export function changerDePhase(scene, boss, phase) {
    nettoyerCombat(scene, boss);
    boss.phase = phase;
    boss.faits = new Set(); // on recompte les attaques lancées dans cette phase
    const pvDebut = profil.pvDebutPhase ? profil.pvDebutPhase(phase) : undefined;
    if (pvDebut !== undefined) { // il se soigne en entrant dans la phase
        boss.pv = pvDebut;
        scene.tweens.killTweensOf(boss.barre.plein); // le rétrécissement du dernier coup (majBarre) ramènerait sinon la barre à sa valeur d'avant le soin
        boss.barre.plein.width = LARGEUR_BARRE * boss.pv / boss.pvMax;
    }
    scene.registry.set("phaseBoss", { profil: profil.cle, phase }); // si le robot meurt, il reprendra ici
    boss.etat = "transition"; // intouchable un instant
    boss.play("boss_charge");
    scene.cameras.main.flash(300, 255, 242, 192);
    scene.cameras.main.shake(400, 0.009);
    effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 28, ECLATS_OR[1]);
    lacherPV(scene, 640, boss.y + 60); // une croix de soin tombe au milieu de l'arène
    const texte = scene.add.text(640, 120, profil.etiquettePhase ? profil.etiquettePhase(phase) : "PHASE " + (phase + 1), { fontFamily: "monospace", fontSize: "28px", color: "#f5f0f8", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(104);
    scene.tweens.add({ targets: texte, alpha: 0, y: 100, duration: 1600, delay: 400, onComplete: () => texte.destroy() });
    scene.time.delayedCall(DUREE_TRANSITION, () => {
        if (boss.etat !== "transition") return;
        boss.play("boss_idle");
        boss.etat = "combat";
        boss.prochaineAttaque = scene.time.now + surLeTemps(scene, 750);
    });
}

// Le Soldat est battu : « Si tu veux entrer dans le panthéon, affronte la mort » (scène pantheon.js, posée par-dessus le niveau).
// OUI : la suite du jeu commence (profil.suite, dans js/partie2 : le Dieu s'enrage, la fuite). NON : la partie s'arrête ici.
function proposerPantheon(scene, boss) {
    nettoyerCombat(scene, boss);
    boss.etat = "choix"; // intouchable, plus d'attaque
    scene.cameras.main.flash(300, 255, 242, 192);
    scene.time.delayedCall(900, () => { // l'éclair passe, puis le choix
        if (scene.mort || scene.partieFinie) return; // le robot est mort ou la partie est finie entre-temps
        scene.scene.launch("pantheon", { origine: scene.scene.key, accepter: () => (profil.suite ? profil.suite(scene, boss) : refuserPantheon(scene, boss)), refuser: () => refuserPantheon(scene, boss) });
        scene.scene.pause(); // fige le niveau : le chrono attend la réponse
    });
}

function refuserPantheon(scene, boss) { // NON : la partie se termine ici (le boss est battu : il garde son bonus)
    boss.etat = "fin"; // le boss ne fait plus rien
    gagnerPoints(scene, profil.points, boss.x, boss.y - 120);
    boss.body.enable = false;
    if (scene.lanternesVivantes) scene.lanternesVivantes.clear(true, true);
    musiqueNiveau(scene); // le metal s'arrête
    scene.tweens.add({ targets: [boss, boss.halo, ...elementsBarre(boss)], alpha: 0, duration: 1200 }); // le boss s'efface
    finirPartie(scene); // arrête le chrono, puis ouvre le classement
}
