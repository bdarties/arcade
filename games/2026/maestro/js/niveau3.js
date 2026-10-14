// ============================================================================
//  js/niveau3.js — NIVEAU 3 : LA GRANDE SCÈNE
//
//  Comme le niveau 2, ce niveau « hérite » du niveau 1 (class niveau3 extends niveau1) : il garde les
//  deux héros, la lampe, les ondes Do / Mi / Sol, les cristaux, les cœurs et la transformation en solo.
//  Il ajoute ses propres mécaniques, en 3 MOUVEMENTS (comme une symphonie) :
//
//   I.   L'ASCENSION (musique : Grieg, « Dans l'antre du roi de la montagne »)
//        On monte par les cintres jusqu'à la Grande Scène. Les marches sont des PORTÉES DE COULEUR :
//        seules les marches de la note choisie par la Cantatrice (bouton C) sont solides.
//        Les PROJECTEURS s'allument en rythme, et le rythme accélère quand on monte.
//        Les FAUSSES NOTES s'effondrent sous les pieds : la lampe du Détective les démasque.
//
//   II.  LA DANSE MACABRE (musique : Saint-Saëns, « Danse macabre », version de Kevin MacLeod)
//        Le combat contre le Maestro possédé. Son POINT FAIBLE (une note de couleur) n'apparaît que
//        dans la lumière de la lampe ; il faut ensuite le toucher avec l'onde de la MÊME couleur.
//        À mi-vie, la scène s'éteint : on ne voit plus le Maestro que dans la lumière.
//
//   III. LE CHANT FINAL (musique : Mozart, air de la Reine de la Nuit, chanté par Rita Streich, 1953)
//        Le Maestro dirige : des notes défilent sur la portée, la Cantatrice les chante en rythme
//        (A = Do, B = Mi, C = Sol). Chaque note juste rallume l'opéra. Puis rideau, et le salut !
//
//  Les réglages du niveau sont en haut du fichier (positions des marches, rythme, points du Maestro…).
//  Musiques libres de droits (Wikimedia Commons) : voir les crédits en bas de ce commentaire.
//   - Grieg, In the Hall of the Mountain King — Musopen Symphony — domaine public
//   - Saint-Saëns, Danse macabre — Kevin MacLeod (incompetech.com) — licence CC BY 3.0
//   - Mozart, Der Hölle Rache — Rita Streich, RIAS, dir. Ferenc Fricsay (1953) — domaine public
// ============================================================================

import niveau1 from "./niveau1.js";
import { REGLAGES } from "./reglages.js";
import { creerPanneau } from "./controles.js";
import { jouerMusique, arreterMusique } from "./musique.js";

// ---- Le monde : une tour de 4 écrans de haut. La Grande Scène est tout en haut (le 1er écran). ----
const LARGEUR_MONDE = 1280;
const HAUTEUR_MONDE = 2880;
const SOL_SCENE = 540; // la hauteur du plancher de la Grande Scène (dessiné dans le fond)
const SOL_DEPART = 2820; // le sol tout en bas de la tour
const TRAPPE = { x: 580, largeur: 120 }; // le trou dans le plancher de la scène, par où on arrive
const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';

// Les 3 notes (mêmes couleurs que les ondes et les cristaux)
const NOTES = [
  { nom: "do", texte: "DO", couleur: 0xff6b7d },
  { nom: "mi", texte: "MI", couleur: 0x62b0ff },
  { nom: "sol", texte: "SOL", couleur: 0xffd24a }
];

// ---- Les marches de l'ascension. x, y = coin haut gauche · l = largeur ----
//  type "or"     : une marche normale, toujours solide
//  type "note"   : solide seulement si la Cantatrice a choisi cette note (0 = Do, 1 = Mi, 2 = Sol)
//  type "rythme" : un projecteur, solide seulement pendant ses temps (groupe "A" ou "B", ils alternent)
//  type "fausse" : ressemble à une marche de note… mais s'effondre ! La lampe la démasque.
const MARCHES = [
  // 1er passage : apprendre les notes
  { type: "or", x: 360, y: 2720, l: 180 },
  { type: "note", note: 0, x: 600, y: 2620, l: 160 },
  { type: "note", note: 1, x: 820, y: 2520, l: 160 },
  { type: "note", note: 2, x: 1040, y: 2420, l: 160 },
  { type: "note", note: 0, x: 820, y: 2320, l: 160 },
  // 2e passage : les projecteurs en rythme
  { type: "rythme", groupe: "A", x: 160, y: 2150, l: 160 },
  { type: "rythme", groupe: "B", x: 380, y: 2050, l: 160 },
  { type: "rythme", groupe: "A", x: 600, y: 1950, l: 160 },
  { type: "rythme", groupe: "B", x: 820, y: 1850, l: 160 },
  { type: "note", note: 1, x: 1040, y: 1750, l: 160 },
  { type: "or", x: 780, y: 1700, l: 160 },
  // 3e passage : les fausses notes (et des cristaux)
  { type: "note", note: 2, x: 1000, y: 1550, l: 160 },
  { type: "fausse", note: 2, x: 700, y: 1550, l: 160 },
  { type: "note", note: 0, x: 760, y: 1450, l: 160 },
  { type: "fausse", note: 0, x: 1080, y: 1450, l: 160 },
  { type: "note", note: 1, x: 500, y: 1350, l: 160 },
  { type: "fausse", note: 1, x: 820, y: 1350, l: 160 },
  { type: "or", x: 240, y: 1250, l: 180 },
  { type: "rythme", groupe: "A", x: 480, y: 1160, l: 160 },
  { type: "fausse", note: 2, x: 100, y: 1160, l: 140 },
  // 4e passage : tout à la fois, jusqu'à la trappe de la scène
  { type: "note", note: 0, x: 900, y: 970, l: 160 },
  { type: "rythme", groupe: "B", x: 640, y: 870, l: 160 },
  { type: "note", note: 2, x: 380, y: 770, l: 160 },
  { type: "fausse", note: 2, x: 900, y: 770, l: 160 },
  { type: "note", note: 1, x: 560, y: 650, l: 160 }
];
// Les PALIERS : de grands balcons sur toute la largeur. On les traverse par en dessous,
// et si on perd, on recommence au dernier palier atteint.
const PALIERS = [2250, 1650, 1070];

// Les cristaux de l'ascension (note : 0 = Do, 1 = Mi, 2 = Sol)
const CRISTAUX = [
  { x: 330, y: 1160, note: 0 },
  { x: 1000, y: 1420, note: 1 },
  { x: 700, y: 820, note: 2 }
];

// ---- Le rythme ----
const BPM_DEPART = 96; // tempo en bas de la tour (battements par minute)
const BPM_ARRIVEE = 150; // tempo en haut : plus on monte, plus ça accélère
const BPM_MAESTRO = 126; // tempo du combat

// ---- Le Maestro ----
const MAESTRO = {
  pv: 12, // coups à donner pour le libérer
  y: 115, // hauteur où il flotte
  xMin: 280,
  xMax: 1000,
  echelle: 2.2, // le sprite fait 64 px : x 2,2 = environ 140 px
  dureeRevelationMs: 4000, // une fois éclairé, son point faible reste visible 4 s
  attaqueTousLesTemps: 4 // il attaque tous les 4 temps (3 quand la scène est éteinte)
};
// Les plateformes de la Grande Scène (on les traverse par en dessous)
const BALCONS = [
  { x: 80, y: 430, l: 240 },
  { x: 960, y: 430, l: 240 },
  { x: 330, y: 320, l: 200 },
  { x: 750, y: 320, l: 200 },
  { x: 540, y: 205, l: 200 }
];

// ---- Le chant final ----
const CHANT = {
  dureeMs: 43000, // la durée de la musique (l'air de la Reine de la Nuit)
  vitesse: 360, // vitesse de défilement des notes (px/s)
  xFrappe: 250, // la ligne où il faut appuyer
  lignes: [250, 320, 390], // hauteur des 3 lignes de la portée (Do, Mi, Sol)
  parfaitMs: 90, // à moins de 90 ms : PARFAIT
  bienMs: 200 // à moins de 200 ms : BIEN
};

// ---- Les points ----
const POINTS = {
  marche: 50, // chaque nouvelle hauteur atteinte (multipliée par le crescendo)
  coup: 150, // chaque coup au Maestro (multiplié par le combo)
  cristal: 250,
  parfait: 100,
  bien: 50,
  coeur: 500 // bonus de fin, par cœur restant
};

export default class niveau3 extends niveau1 {
  constructor() {
    super("niveau3"); // on envoie la clé de ce niveau au niveau 1
  }

  // init(data) est appelée AVANT create() : quand on recommence un mouvement, data dit lequel
  init(data) {
    this.reprise = data && data.reprise ? data.reprise : null; // null = on commence au début
  }

  // ==========================================================================
  //  PRELOAD : le fond de la scène, le Maestro, les musiques
  // ==========================================================================
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("img_fond_niveau3", "./assets/fond_niveau3.jpg"); // la Grande Scène
    this.load.image("img_lanterne", "./assets/lanterne_chinoise.png");
    this.load.spritesheet("maestro_boss", "./assets/maestro_boss.png", { frameWidth: 64, frameHeight: 64 }); // 8 cases par ligne
    this.load.audio("musique_niveau3_montee", "./assets/musique_niveau3_montee.m4a");
    this.load.audio("musique_niveau3_maestro", "./assets/musique_niveau3_maestro.m4a");
    this.load.audio("musique_niveau3_final", "./assets/musique_niveau3_final.m4a");
    this.load.audio("son_applaudissements", "./assets/son_applaudissements.m4a");
  }

  // Ce qui change par rapport au niveau 1 (voir definirNiveau dans niveau1.js)
  definirNiveau() {
    this.largeurMonde = LARGEUR_MONDE;
    this.hauteurMonde = HAUTEUR_MONDE;
    this.couleurFond = 0x05060f;
    this.listeTubas = []; // pas de Tuba ici
    this.listeCristaux = CRISTAUX;
    this.numeroNiveau = 3;
    this.formeUnique = true; // en solo : un seul corps qui se transforme (bouton D)
    this.musiqueNiveau = "musique_niveau3_montee";
    this.messageVictoire = "Le Maestro est libéré !";
    this.objectif =
      "OBJECTIF : monte jusqu'à la Grande Scène et libère le Maestro !\n" +
      "Seules les marches de TA NOTE sont solides : change de note avec C";
  }

  // ==========================================================================
  //  CREATE : on construit le niveau 1, puis on ajoute ce qui est propre au niveau 3
  // ==========================================================================
  create() {
    this.phase = "montee"; // "montee", "maestro", "chant", puis "salut"
    this.score = 0;
    this.crescendo = 0; // le combo de l'ascension
    this.combo = 0; // le combo du combat
    this.plusHaut = SOL_DEPART; // la plus grande hauteur atteinte (plus petit y)
    this.dernierPalier = this.reprise && this.reprise.palier ? this.reprise.palier : SOL_DEPART;
    this.bpm = BPM_DEPART;
    this.tempsDepuisBattement = 0;
    this.battement = 0; // le numéro du temps en cours
    this.creerTexturesNiveau3();
    this.creerAnimationsMaestro();

    super.create(); // tout le niveau 1 : héros, lampe, cristaux, cœurs, interface, caméra, musique…

    this.creerInterfaceNiveau3();
    if (this.reprise && this.reprise.phase == "maestro") {
      this.commencerMaestro(); // on recommence directement le combat
    } else if (this.dernierPalier != SOL_DEPART) {
      this.afficherMessage("On reprend au dernier balcon atteint !", 2500);
    }
  }

  // --------------------------------------------------------------------------
  //  Les images dessinées avec du code
  // --------------------------------------------------------------------------
  creerTexturesNiveau3() {
    if (this.textures.exists("n3_or")) {
      return; // déjà faites (le niveau a été relancé)
    }
    const p = this.make.graphics({ add: false });
    // marche dorée (64 x 16)
    p.fillStyle(0x5a3a26).fillRect(0, 0, 64, 16);
    p.fillStyle(0xe6bf5c).fillRect(0, 0, 64, 4);
    p.fillStyle(0xfff0b8).fillRect(0, 0, 64, 1);
    p.fillStyle(0x3d2718).fillRect(0, 14, 64, 2);
    p.generateTexture("n3_or", 64, 16);
    // marche-portée (64 x 16) : blanche, on la colore ensuite avec la couleur de sa note
    p.clear();
    p.fillStyle(0xffffff).fillRect(0, 0, 64, 16);
    p.fillStyle(0x000000, 0.25).fillRect(0, 5, 64, 1).fillRect(0, 9, 64, 1).fillRect(0, 13, 64, 1); // les lignes de la portée
    p.fillStyle(0xffffff, 1).fillRect(0, 0, 64, 2);
    p.generateTexture("n3_note", 64, 16);
    // projecteur (64 x 16) : verre bleuté
    p.clear();
    p.fillStyle(0xbfe3ff).fillRect(0, 0, 64, 16);
    p.fillStyle(0xffffff).fillRect(0, 0, 64, 3);
    p.fillStyle(0x6fa8d6).fillRect(0, 13, 64, 3);
    p.generateTexture("n3_rythme", 64, 16);
    // balcon (64 x 20) : dorure et velours rouge
    p.clear();
    p.fillStyle(0x6e0f1c).fillRect(0, 0, 64, 20);
    p.fillStyle(0xe6bf5c).fillRect(0, 0, 64, 4);
    p.fillStyle(0xe6bf5c).fillRect(30, 6, 4, 14);
    p.generateTexture("n3_balcon", 64, 20);
    // une fleur pour les bouquets du salut
    p.clear();
    p.fillStyle(0x2f8f3a).fillRect(9, 12, 2, 12);
    p.fillStyle(0xffffff);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      p.fillCircle(10 + Math.cos(a) * 5, 8 + Math.sin(a) * 5, 3.5); // 6 pétales (colorés ensuite)
    }
    p.fillStyle(0xffe070).fillCircle(10, 8, 2.5);
    p.generateTexture("n3_fleur", 20, 24);
    p.destroy();
  }

  // Les animations du Maestro : une planche de 8 cases par ligne, une ligne par animation
  creerAnimationsMaestro() {
    const lignes = { idle: [0, 7, 6, -1], walk: [1, 7, 8, -1], attack: [3, 7, 12, 0], hurt: [4, 7, 14, 0], death: [5, 7, 7, 0] };
    for (const nom in lignes) {
      const [ligne, images, fps, repete] = lignes[nom];
      if (this.anims.exists("maestro_" + nom) == false) {
        this.anims.create({
          key: "maestro_" + nom,
          frames: this.anims.generateFrameNumbers("maestro_boss", { start: ligne * 8, end: ligne * 8 + images - 1 }),
          frameRate: fps,
          repeat: repete
        });
      }
    }
  }

  // ==========================================================================
  //  LA CARTE : le fond, les marches, les balcons (pas de carte Tiled dans ce niveau)
  // ==========================================================================
  creerCarte() {
    this.groupe_plateformes = this.physics.add.staticGroup(); // le sol et les balcons (toujours solides)
    this.groupe_fantomes = this.physics.add.staticGroup(); // (vide, mais le niveau 1 en a besoin)
    this.groupe_murs = this.physics.add.staticGroup(); // (vide aussi)
    this.groupe_scene = this.physics.add.staticGroup(); // les marches spéciales : notes, projecteurs, fausses notes
    this.avecTuilesPlateformes = false;
    this.echelles = []; // pas d'échelle

    // Le fond : la Grande Scène en haut, les cintres (dessinés avec du code) en dessous
    this.dessinerCintres();
    this.add.image(640, 360, "img_fond_niveau3").setDepth(0); // la Grande Scène (1280 x 720)
    // un dégradé pour passer en douceur de la scène aux cintres
    const degrade = this.add.graphics().setDepth(0);
    for (let i = 0; i < 40; i++) {
      degrade.fillStyle(0x05060f, i / 40).fillRect(0, 680 + i, LARGEUR_MONDE, 1);
    }
    // le voile qui assombrit la scène quand le Maestro éteint les lumières (transparent au départ)
    this.voileNoir = this.add.rectangle(0, 0, LARGEUR_MONDE, 720, 0x000000, 0).setOrigin(0, 0).setDepth(1);

    // Des lanternes qui battent la mesure, et de la poussière dorée qui flotte
    this.lanternes = [];
    PALIERS.concat([SOL_DEPART]).forEach((y) => {
      [70, 1210].forEach((x) => {
        const lanterne = this.add.image(x, y - 70, "img_lanterne").setDisplaySize(40, 60).setDepth(4);
        this.lanternes.push(lanterne);
        this.lueur(x, y - 70, 0.5, 0.35, 0xffc070, 3);
      });
    });
    if (this.modeLeger == false) {
      this.add.particles(0, 720, "tex_lumiere", {
        x: { min: 0, max: LARGEUR_MONDE },
        y: { min: 0, max: HAUTEUR_MONDE - 720 },
        lifespan: 6000,
        speedY: { min: -12, max: -4 },
        scale: { start: 0.04, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: 0xffd98a,
        blendMode: "ADD",
        frequency: 120
      }).setDepth(3);
    }

    // Le sol de départ, et le plancher de la scène (avec la trappe au milieu)
    this.ajouterPlateforme({ x: 0, y: SOL_DEPART, width: LARGEUR_MONDE, height: 60 });
    this.add.tileSprite(0, SOL_DEPART, LARGEUR_MONDE, 60, "n3_balcon").setOrigin(0, 0).setDepth(2);
    this.ajouterPlateforme({ x: 0, y: SOL_SCENE, width: TRAPPE.x, height: 20 });
    this.ajouterPlateforme({ x: TRAPPE.x + TRAPPE.largeur, y: SOL_SCENE, width: LARGEUR_MONDE - TRAPPE.x - TRAPPE.largeur, height: 20 });
    this.trappe = this.ajouterPlateforme({ x: TRAPPE.x, y: SOL_SCENE, width: TRAPPE.largeur, height: 20 });
    this.trappe.unSens = true; // on la traverse en sautant par en dessous, et on se pose dessus
    this.trappeLueur = this.add.rectangle(TRAPPE.x + TRAPPE.largeur / 2, SOL_SCENE + 4, TRAPPE.largeur, 10, 0xffe9a0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(2);
    this.tweens.add({ targets: this.trappeLueur, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 }); // elle brille pour montrer le chemin

    // Les paliers (balcons sur toute la largeur, on les traverse par en dessous)
    PALIERS.forEach((y) => {
      this.add.tileSprite(0, y, LARGEUR_MONDE, 20, "n3_balcon").setOrigin(0, 0).setDepth(2);
      const zone = this.ajouterPlateforme({ x: 0, y: y, width: LARGEUR_MONDE, height: 20 });
      zone.unSens = true; // à sens unique (voir peutMarcherSur dans niveau1.js)
      zone.palier = true;
    });

    // Les marches de l'ascension
    MARCHES.forEach((m) => this.ajouterMarche(m));

    // Panneaux d'indication
    this.ajouterIndice(640, 2770, "Seules les marches de TA NOTE sont solides !\nChange de note avec C en plein saut (Do → Mi → Sol)");
    this.ajouterIndice(640, 2190, "Les projecteurs bleus s'allument EN RYTHME : saute au bon temps !");
    this.ajouterIndice(640, 1600, "FAUSSES NOTES ! Certaines marches s'effondrent.\nLe Détective les démasque avec sa lampe (B)");
    this.ajouterIndice(640, 1020, "Dernier effort : la Grande Scène est juste au-dessus !");

    // Ce que le niveau 1 attend de la carte
    const departY = this.dernierPalier;
    this.departs = { j1: { x: 560, y: departY }, j2: { x: 720, y: departY } };
    this.yChute = HAUTEUR_MONDE + 500; // pas de vide : on retombe sur les marches du dessous
  }

  // Les cintres : le haut du théâtre, au-dessus des coulisses (cordes, perches à projecteurs, rideaux)
  dessinerCintres() {
    const g = this.add.graphics().setDepth(0);
    // un dégradé du violet (en haut) au bleu nuit (en bas)
    const haut = Phaser.Display.Color.ValueToColor(0x24123a);
    const bas = Phaser.Display.Color.ValueToColor(0x060a1c);
    for (let y = 720; y < HAUTEUR_MONDE; y += 8) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(haut, bas, HAUTEUR_MONDE - 720, y - 720);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)).fillRect(0, y, LARGEUR_MONDE, 8);
    }
    // les cordes qui pendent
    for (let i = 0; i < 26; i++) {
      const x = 90 + ((i * 397) % 1100);
      g.lineStyle(2, 0x8a6a3a, 0.35).lineBetween(x, 720, x + ((i % 3) - 1) * 6, HAUTEUR_MONDE);
    }
    // les perches à projecteurs, avec leurs petites ampoules
    for (let y = 900; y < HAUTEUR_MONDE - 100; y += 380) {
      g.fillStyle(0x2a2030).fillRect(0, y, LARGEUR_MONDE, 10);
      g.fillStyle(0xc9a85a).fillRect(0, y, LARGEUR_MONDE, 2);
      for (let x = 160; x < LARGEUR_MONDE - 120; x += 120) {
        g.fillStyle(0x1a1420).fillRect(x - 8, y + 10, 16, 14);
        this.lueur(x, y + 30, 0.18, 0.5, 0xffd98a, 0);
      }
    }
    // les rideaux de velours sur les côtés
    [0, LARGEUR_MONDE - 70].forEach((x0) => {
      g.fillStyle(0x4a0a16).fillRect(x0, 720, 70, HAUTEUR_MONDE - 720);
      for (let x = x0 + 6; x < x0 + 70; x += 16) {
        g.fillStyle(0x6e0f1c).fillRect(x, 720, 7, HAUTEUR_MONDE - 720);
      }
    });
  }

  // Le niveau 1 ajoute les plateformes avec une « zone » ; ici on renvoie la zone pour la régler ensuite
  ajouterPlateforme(objet) {
    const zone = this.add.zone(objet.x + objet.width / 2, objet.y + objet.height / 2, objet.width, objet.height);
    this.groupe_plateformes.add(zone);
    return zone;
  }

  // Une marche spéciale : un corps (dans groupe_scene) + son dessin
  ajouterMarche(m) {
    const zone = this.add.zone(m.x + m.l / 2, m.y + 8, m.l, 16);
    this.groupe_scene.add(zone);
    zone.type = m.type;
    zone.note = m.note;
    zone.groupe = m.groupe;
    const texture = m.type == "or" ? "n3_or" : m.type == "rythme" ? "n3_rythme" : "n3_note";
    zone.dessin = this.add.tileSprite(m.x, m.y, m.l, 16, texture).setOrigin(0, 0).setDepth(5);
    if (m.note !== undefined) {
      zone.dessin.setTint(NOTES[m.note].couleur);
      zone.symbole = this.add
        .text(m.x + m.l / 2, m.y - 14, "♪", { fontFamily: POLICE, fontSize: "18pt", color: "#ffffff", stroke: "#000000", strokeThickness: 3 })
        .setOrigin(0.5)
        .setTint(NOTES[m.note].couleur)
        .setDepth(5);
    }
    if (m.type == "fausse") {
      zone.rect = new Phaser.Geom.Rectangle(m.x, m.y, m.l, 16); // pour savoir si la lampe l'éclaire
      zone.croix = this.add.text(m.x + m.l / 2, m.y + 8, "✕  FAUSSE NOTE  ✕", { fontFamily: POLICE, fontSize: "11pt", fontStyle: "bold", color: "#ffffff", stroke: "#3a0040", strokeThickness: 4 }).setOrigin(0.5).setDepth(6).setVisible(false);
    }
    return zone;
  }

  // Une marche de note est-elle solide en ce moment ?
  marcheSolide(marche) {
    if (marche.cassee == true) {
      return false; // fausse note effondrée
    }
    if (marche.type == "note" || marche.type == "fausse") {
      return marche.note == this.noteActuelle; // seulement si c'est la note choisie
    }
    if (marche.type == "rythme") {
      return this.groupeActif == marche.groupe; // seulement pendant ses temps
    }
    return true; // une marche dorée est toujours solide
  }

  // --------------------------------------------------------------------------
  //  Objets et collisions propres au niveau 3
  // --------------------------------------------------------------------------
  creerObjets() {
    this.porteOuverte = false; // (pas de porte : le niveau finit par le chant final)
  }

  collisionsObjets() {
    // Les héros se posent sur les marches spéciales seulement quand elles sont solides, et par le dessus
    this.physics.add.collider(this.persos, this.groupe_scene, null, (perso, marche) => {
      return this.marcheSolide(marche) && perso.body.velocity.y >= 0 && perso.body.bottom <= marche.body.top + 14;
    });
  }

  // Les balcons de la Grande Scène (créés au début du combat)
  creerBalcons() {
    BALCONS.forEach((b) => {
      const zone = this.ajouterMarche({ type: "or", x: b.x, y: b.y, l: b.l });
      zone.dessin.setTexture("n3_balcon").setDisplaySize(b.l, 20);
      zone.dessin.setAlpha(0);
      this.tweens.add({ targets: zone.dessin, alpha: 1, duration: 800 }); // ils apparaissent en douceur
    });
  }

  // ==========================================================================
  //  INTERFACE : score, mouvement, métronome, vie du Maestro
  // ==========================================================================
  creerInterfaceNiveau3() {
    const fixe = (objet) => objet.setScrollFactor(0).setDepth(100);
    this.iconeFragment.setVisible(false); // pas de fragment à ramasser ici
    this.texteFragment.setVisible(false);
    const style = (taille, couleur) => ({ fontFamily: POLICE, fontSize: taille, fontStyle: "bold", color: couleur, stroke: "#000000", strokeThickness: 5 });
    this.texteScore = fixe(this.add.text(1262, 16, "0", style("22pt", "#ffffff")).setOrigin(1, 0));
    this.texteCombo = fixe(this.add.text(1262, 56, "", style("14pt", "#f5d97a")).setOrigin(1, 0));
    fixe(this.add.rectangle(640, 34, 300, 50, 0x05081a, 0.75).setStrokeStyle(1, 0xf5d97a, 0.6));
    this.texteMouvement = fixe(this.add.text(640, 14, "I. L'ASCENSION", style("14pt", "#f5d97a")).setOrigin(0.5, 0));
    // le métronome : 4 points qui s'allument à chaque temps
    this.points = [0, 1, 2, 3].map((i) => fixe(this.add.circle(610 + i * 20, 52, 6, 0xffffff, 0.25)));
    // la vie du Maestro (cachée pendant l'ascension)
    this.cadreVieMaestro = fixe(this.add.rectangle(640, 80, 504, 18, 0x000000, 0.7).setStrokeStyle(2, 0xf5d97a)).setVisible(false);
    this.barreVieMaestro = fixe(this.add.rectangle(390, 80, 500, 12, 0xb0306a).setOrigin(0, 0.5)).setVisible(false);
  }

  ajouterPoints(points, x, y) {
    this.score += points;
    this.texteScore.setText(String(this.score));
    if (x !== undefined) {
      const t = this.add.text(x, y, "+" + points, { fontFamily: POLICE, fontSize: "16pt", fontStyle: "bold", color: "#f5d97a", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5).setDepth(60);
      this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    }
  }

  // ==========================================================================
  //  UPDATE
  // ==========================================================================
  update(temps, delta) {
    if (this.phase == "chant") {
      this.mettreAJourChant(temps);
      return;
    }
    if (this.phase == "salut") {
      this.mettreAJourSalut();
      return;
    }
    super.update(temps, delta); // héros, lampe, cristaux, chutes, caméra… (niveau 1)
    if (this.fini == true) {
      if (this.panneauReessayer) {
        this.gererReessayer();
      }
      return;
    }
    this.mettreAJourRythme(delta);
    this.mettreAJourMarches();
    this.verifierFaussesNotes(temps);
    if (this.phase == "montee") {
      this.verifierProgression();
    } else if (this.phase == "maestro") {
      this.mettreAJourMaestro(temps);
    }
  }

  // ---- Le rythme : un « temps » tous les 60000 / bpm millisecondes ----
  mettreAJourRythme(delta) {
    this.tempsDepuisBattement += delta;
    const duree = 60000 / this.bpm;
    if (this.tempsDepuisBattement < duree) {
      return;
    }
    this.tempsDepuisBattement -= duree;
    this.battement += 1;
    // les projecteurs : le groupe A est allumé 2 temps, puis le groupe B 2 temps
    this.groupeActif = Math.floor(this.battement / 2) % 2 == 0 ? "A" : "B";
    // le métronome et les lanternes battent la mesure
    this.points.forEach((point, i) => point.setFillStyle(0xffffff, i == this.battement % 4 ? 1 : 0.25));
    this.lanternes.forEach((l) => this.tweens.add({ targets: l, scaleX: l.scaleX * 1.12, scaleY: l.scaleY * 1.12, duration: 80, yoyo: true }));
    if (this.phase == "maestro") {
      this.battementMaestro();
    }
  }

  // ---- Les marches changent d'aspect selon la note choisie et le rythme ----
  mettreAJourMarches() {
    this.groupe_scene.getChildren().forEach((marche) => {
      if (marche.cassee == true) {
        return;
      }
      const solide = this.marcheSolide(marche);
      const alpha = solide ? 1 : 0.22; // les marches « éteintes » restent un peu visibles
      if (marche.dessin.alpha != alpha && marche.type != "or") {
        marche.dessin.setAlpha(alpha);
        if (marche.symbole) {
          marche.symbole.setAlpha(solide ? 1 : 0.3);
        }
      }
    });
  }

  // ---- Les fausses notes : la lampe les démasque, et elles s'effondrent sous les pieds ----
  verifierFaussesNotes(temps) {
    const faisceau = this.lampe.allumee == true ? this.calculerFaisceau() : null;
    this.groupe_scene.getChildren().forEach((marche) => {
      if (marche.type != "fausse" || marche.cassee == true) {
        return;
      }
      // éclairée par la lampe : on la démasque (elle devient violette, avec une croix)
      if (faisceau !== null && this.distanceAuRectangle(faisceau.cx, faisceau.cy, marche.rect) <= REGLAGES.lampe.rayon) {
        if (marche.demasquee != true) {
          marche.demasquee = true;
          marche.dessin.setTint(0x9a4dff);
          marche.croix.setVisible(true);
          this.ajouterPoints(25, marche.x, marche.y - 20);
        }
      }
      // quelqu'un est posé dessus : elle s'effondre 0,3 s plus tard
      const dessus = this.persos.some((p) => p.body.enable && p.body.touching.down && Math.abs(p.body.bottom - marche.body.top) < 4 && p.body.center.x > marche.body.left && p.body.center.x < marche.body.right);
      if (dessus && marche.chute == undefined) {
        marche.chute = this.time.delayedCall(300, () => this.effondrer(marche));
      }
    });
  }

  effondrer(marche) {
    marche.cassee = true;
    marche.chute = undefined;
    this.cameras.main.shake(120, 0.004);
    const objets = [marche.dessin, marche.symbole, marche.croix].filter((o) => o);
    this.tweens.add({ targets: objets, y: "+=120", alpha: 0, angle: 8, duration: 500 });
    // elle revient 3 s plus tard (pour pouvoir réessayer)
    this.time.delayedCall(3000, () => {
      objets.forEach((o) => {
        o.y -= 120;
        o.setAngle(0);
      });
      marche.cassee = false;
      this.tweens.add({ targets: objets, alpha: 1, duration: 300 });
    });
  }

  // ---- L'ascension : le crescendo, les paliers, l'arrivée sur la scène ----
  verifierProgression() {
    const corps = this.persos.filter((p) => p.body.enable);
    const haut = Math.min(...corps.map((p) => p.body.bottom)); // le héros le plus haut
    // une nouvelle hauteur (au moins 80 px plus haut que le record) : des points et le crescendo monte
    if (haut < this.plusHaut - 80) {
      this.plusHaut = haut;
      this.crescendo = Math.min(this.crescendo + 1, 8);
      const perso = corps.find((p) => p.body.bottom == haut);
      this.ajouterPoints(POINTS.marche * this.crescendo, perso.x, perso.y - 50);
      this.texteCombo.setText(this.crescendo > 1 ? "CRESCENDO x" + this.crescendo : "");
      // le tempo suit la hauteur : de 96 à 150 battements par minute
      const progression = Phaser.Math.Clamp((SOL_DEPART - haut) / (SOL_DEPART - SOL_SCENE), 0, 1);
      this.bpm = Math.round(BPM_DEPART + (BPM_ARRIVEE - BPM_DEPART) * progression);
    }
    // un palier atteint : c'est là qu'on recommencera si on perd
    PALIERS.forEach((y) => {
      if (y < this.dernierPalier && corps.some((p) => Math.abs(p.body.bottom - y) < 3)) {
        this.dernierPalier = y;
        this.afficherMessage("Balcon atteint : si tu perds, tu reprendras ici !", 2500);
      }
    });
    // arrivée sur la scène : tout le monde au-dessus du plancher
    if (corps.every((p) => p.body.bottom <= SOL_SCENE + 2 && p.body.touching.down)) {
      this.commencerMaestro();
    }
  }

  // Un héros qui tombe perd son crescendo
  blesser(perso, sourceX) {
    this.crescendo = 0;
    this.combo = 0;
    this.texteCombo.setText("");
    super.blesser(perso, sourceX);
  }

  // En solo la lampe ne se recharge pas avec C (C change la note) : ici elle se recharge toute seule, éteinte
  mettreAJourLampe(temps, delta) {
    if (this.lampe.allumee == false && this.lampe.batterie < 100) {
      this.lampe.batterie = Math.min(100, this.lampe.batterie + (delta / 1000) * 8); // + 8 % par seconde
    }
    super.mettreAJourLampe(temps, delta);
  }

  // ---- L'onde vers le haut : en maintenant HAUT, la Cantatrice chante vers le plafond ----
  lancerOnde(perso) {
    if (this.toucheEnfoncee(perso, "haut") == false) {
      super.lancerOnde(perso); // l'onde normale, vers l'avant
      this.groupe_ondes.getChildren().slice(-1)[0].yDepart = perso.y;
      return;
    }
    const onde = this.groupe_ondes.create(perso.x, perso.y - 40, "onde");
    onde.setDepth(8).setScale(1.5).setAngle(-90);
    onde.note = NOTES[this.noteActuelle].nom;
    onde.play("onde_" + onde.note);
    onde.body.setSize(18, 22);
    onde.setVelocityY(-REGLAGES.onde.vitesse);
    onde.xDepart = onde.x;
    onde.yDepart = onde.y;
  }

  // Les ondes disparaissent après leur portée (dans toutes les directions)
  nettoyerOndes() {
    this.groupe_ondes.getChildren().slice().forEach((onde) => {
      const distance = Phaser.Math.Distance.Between(onde.x, onde.y, onde.xDepart, onde.yDepart || onde.y);
      if (distance > REGLAGES.onde.portee) {
        onde.destroy();
      }
    });
    this.groupe_ondes_ennemies.getChildren().slice().forEach((note) => {
      if (this.time.now > note.finDeVie) {
        note.destroy(); // les notes du Maestro vivent 5 secondes
      }
    });
  }

  // Duo : si un joueur reste trop bas, il rejoint l'autre (sinon la caméra ne peut pas cadrer les deux)
  limiterEcartDuo() {
    const [c, d] = [this.cantatrice, this.detective];
    if (Math.abs(c.y - d.y) < 560) {
      return;
    }
    const bas = c.y > d.y ? c : d;
    const haut = bas == c ? d : c;
    if (haut.body.touching.down == false) {
      return; // on attend que celui du haut soit posé
    }
    bas.body.reset(haut.x, haut.y - 10);
    bas.invincibleJusqua = this.time.now + 1500;
    this.faireClignoter(bas);
    this.afficherMessage("Ton partenaire te rejoint !", 2000);
  }

  // La caméra : on monte avec les héros (et sur la scène, elle ne bouge plus)
  mettreAJourCamera() {
    let y;
    if (this.phase != "montee") {
      y = 360;
    } else if (this.mode == "duo") {
      y = (this.cantatrice.y + this.detective.y) / 2 - 60;
    } else {
      y = this.actif.y - 60;
    }
    this.cible_camera.setPosition(640, y);
  }

  creerCamera() {
    super.creerCamera();
    this.cible_camera.setPosition(640, this.dernierPalier - 100);
    this.cameras.main.centerOn(640, this.dernierPalier - 100); // on commence directement au bon endroit
  }

  // ==========================================================================
  //  MOUVEMENT II : LA DANSE MACABRE (le combat)
  // ==========================================================================
  commencerMaestro() {
    this.phase = "maestro";
    this.bpm = BPM_MAESTRO;
    this.combo = 0;
    this.texteCombo.setText("");
    this.trappe.unSens = false; // la trappe se referme : elle devient solide
    this.trappeLueur.destroy();
    this.cameras.main.setBounds(0, 0, LARGEUR_MONDE, 720); // la caméra reste sur la scène
    // en reprise (ou si un héros est resté en bas), on pose tout le monde sur la scène
    this.persos.forEach((p, i) => {
      if (p.body.enable && p.y > SOL_SCENE) {
        p.body.reset(560 + i * 160, SOL_SCENE - 40);
      }
    });
    this.creerBalcons();
    jouerMusique(this, "musique_niveau3_maestro", 0.5);
    this.texteMouvement.setText("II. LA DANSE MACABRE");
    this.cadreVieMaestro.setVisible(true);
    this.barreVieMaestro.setVisible(true);

    // Le Maestro descend des cintres
    this.maestro = this.physics.add.sprite(640, -120, "maestro_boss").setScale(MAESTRO.echelle).setDepth(8);
    this.maestro.body.setAllowGravity(false);
    this.maestro.body.setSize(34, 50);
    this.maestro.play("maestro_walk");
    this.maestro.pv = MAESTRO.pv;
    this.maestro.faiblesse = Phaser.Math.Between(0, 2); // la note de son point faible
    this.maestro.reveleJusqua = 0;
    this.maestro.pret = false; // il attaque seulement une fois arrivé
    this.tweens.add({ targets: this.maestro, y: MAESTRO.y, duration: 1800, ease: "Sine.easeOut", onComplete: () => (this.maestro.pret = true) });
    // son point faible : une lueur de couleur sur sa poitrine, visible seulement quand il est éclairé
    this.pointFaible = this.add.image(0, 0, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setScale(0.4).setDepth(9).setAlpha(0);
    this.anneauFaible = this.add.circle(0, 0, 16).setStrokeStyle(4, 0xffffff).setDepth(9).setAlpha(0);

    this.physics.add.overlap(this.maestro, this.groupe_ondes, (maestro, onde) => this.toucherMaestro(onde));
    this.majVieMaestro();
    this.afficherBandeau("II. LA DANSE MACABRE", "Éclaire le Maestro avec la lampe pour trouver son POINT FAIBLE,\npuis touche-le avec l'onde de la MÊME couleur (HAUT + B pour chanter vers le haut)");
  }

  // Un grand titre au centre de l'écran, qui s'efface tout seul
  afficherBandeau(titre, texte) {
    const fond = this.add.rectangle(0, 0, 900, 150, 0x0b1030, 0.9).setStrokeStyle(3, 0xf5d97a);
    const t1 = this.add.text(0, -36, titre, { fontFamily: POLICE, fontSize: "26pt", fontStyle: "bold", color: "#f5d97a", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5);
    const t2 = this.add.text(0, 24, texte, { fontFamily: POLICE, fontSize: "13pt", color: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);
    const cadre = this.add.container(640, 330, [fond, t1, t2]).setScrollFactor(0).setDepth(150).setAlpha(0);
    this.tweens.add({ targets: cadre, alpha: 1, duration: 400, hold: 3800, yoyo: true, onComplete: () => cadre.destroy() });
  }

  mettreAJourMaestro(temps) {
    const m = this.maestro;
    if (m.pret == false || m.pv <= 0) {
      return;
    }
    // il plane de gauche à droite en se balançant
    m.x = 640 + Math.sin(temps / 1700) * ((MAESTRO.xMax - MAESTRO.xMin) / 2);
    m.y = MAESTRO.y + Math.sin(temps / 450) * 14;
    m.setFlipX(Math.cos(temps / 1700) < 0);

    // la lampe l'éclaire ? son point faible est révélé pour 4 s
    if (this.lampe.allumee == true) {
      const f = this.calculerFaisceau();
      if (Phaser.Math.Distance.Between(f.cx, f.cy, m.x, m.y) < REGLAGES.lampe.rayon + 30) {
        this.reveler();
      }
    }
    const revele = temps < m.reveleJusqua;
    const couleur = NOTES[m.faiblesse].couleur;
    this.pointFaible.setPosition(m.x, m.y + 6).setTint(couleur).setAlpha(revele ? 0.9 : 0);
    this.anneauFaible.setPosition(m.x, m.y + 6).setStrokeStyle(4, couleur).setAlpha(revele ? 1 : 0);
    this.anneauFaible.setRadius(16 + Math.sin(temps / 90) * 3);
    // scène éteinte : on ne voit le Maestro que dans la lumière
    if (this.sceneEteinte == true) {
      m.setAlpha(revele ? 1 : 0.12);
    }
  }

  reveler() {
    if (this.time.now > this.maestro.reveleJusqua) {
      this.afficherMessage("Point faible : " + NOTES[this.maestro.faiblesse].texte + " ! Chante cette note !", 2000);
    }
    this.maestro.reveleJusqua = this.time.now + MAESTRO.dureeRevelationMs;
  }

  // Une onde (ou un éclat de lumière) touche le Maestro
  toucherMaestro(onde) {
    const m = this.maestro;
    const note = onde.note;
    onde.destroy();
    if (m.pret == false || m.pv <= 0) {
      return;
    }
    if (note == "lumiere") {
      this.reveler(); // l'éclat du Détective révèle aussi le point faible
      return;
    }
    if (this.time.now > m.reveleJusqua) {
      this.afficherMessage("Il faut d'abord trouver son point faible : éclaire-le !", 2000);
      return;
    }
    if (note != NOTES[m.faiblesse].nom) {
      this.combo = 0;
      this.texteCombo.setText("");
      this.afficherMessage("Fausse note ! Son point faible est " + NOTES[m.faiblesse].texte, 2000);
      m.setTintFill(0x9a4dff);
      this.time.delayedCall(120, () => m.clearTint());
      return;
    }
    // touché !
    m.pv -= 1;
    this.combo = Math.min(this.combo + 1, 8);
    this.texteCombo.setText(this.combo > 1 ? "COMBO x" + this.combo : "");
    this.ajouterPoints(POINTS.coup * this.combo, m.x, m.y - 60);
    this.cameras.main.shake(150, 0.006);
    m.play("maestro_hurt");
    m.once("animationcomplete", () => m.play("maestro_walk"));
    m.faiblesse = (m.faiblesse + Phaser.Math.Between(1, 2)) % 3; // son point faible change de note
    this.majVieMaestro();
    if (m.pv == Math.floor(MAESTRO.pv / 2)) {
      this.eteindreLaScene(); // à mi-vie : le noir
    }
    if (m.pv <= 0) {
      this.vaincreMaestro();
    }
  }

  majVieMaestro() {
    this.barreVieMaestro.setSize(500 * Math.max(0, this.maestro.pv) / MAESTRO.pv, 12);
  }

  eteindreLaScene() {
    this.sceneEteinte = true;
    this.tweens.add({ targets: this.voileNoir, fillAlpha: 0.82, duration: 1200 });
    this.afficherBandeau("LES LUMIÈRES S'ÉTEIGNENT…", "Le Maestro se cache dans l'ombre : seule la lampe peut le trouver !");
  }

  // ---- Les attaques du Maestro, toujours sur le temps ----
  battementMaestro() {
    const m = this.maestro;
    if (!m || m.pret == false || m.pv <= 0) {
      return;
    }
    const tousLes = this.sceneEteinte ? 3 : MAESTRO.attaqueTousLesTemps;
    if (this.battement % tousLes != 0) {
      return;
    }
    m.play("maestro_attack"); // il lève sa baguette
    m.once("animationcomplete", () => m.play("maestro_walk"));
    const choix = Phaser.Math.Between(1, 6);
    if (choix <= 3) {
      this.voleeDeNotes();
    } else if (choix <= 5) {
      this.pluieDeNotes();
    } else {
      this.invoquerCristal();
    }
  }

  // Une note de musique ennemie (violette), qui vit 5 secondes
  noteEnnemie(x, y, vx, vy) {
    const note = this.groupe_ondes_ennemies.create(x, y, "onde");
    note.setDepth(9).setScale(1.5).setTint(0xb066ff);
    note.play("onde_mi");
    note.body.setSize(20, 20);
    note.setVelocity(vx, vy);
    note.setRotation(Math.atan2(vy, vx));
    note.finDeVie = this.time.now + 5000;
  }

  // 3 notes en éventail vers le héros le plus proche
  voleeDeNotes() {
    const m = this.maestro;
    const cible = this.persoLePlusProche(m);
    const angle = Phaser.Math.Angle.Between(m.x, m.y, cible.x, cible.y);
    [-0.25, 0, 0.25].forEach((ecart) => {
      this.noteEnnemie(m.x, m.y + 30, Math.cos(angle + ecart) * 230, Math.sin(angle + ecart) * 230);
    });
  }

  // Une rangée de notes qui tombent, avec un trou pour passer
  pluieDeNotes() {
    const trou = Phaser.Math.Between(1, 8);
    for (let i = 0; i < 10; i++) {
      if (i != trou && i != trou + 1) {
        this.noteEnnemie(80 + i * 125, 20, 0, 190);
      }
    }
  }

  // Un cristal possédé sort des coulisses (2 au maximum)
  invoquerCristal() {
    if (this.groupe_cristaux.countActive() >= 2) {
      this.voleeDeNotes();
      return;
    }
    const cote = Phaser.Math.Between(0, 1) == 0 ? 60 : 1220;
    this.creerCristal(cote, 300, Phaser.Math.Between(0, 2));
  }

  // Un cristal détruit rapporte des points
  blesserCristal(cristal, note) {
    super.blesserCristal(cristal, note);
    if (cristal.mort == true && cristal.compte != true) {
      cristal.compte = true;
      this.ajouterPoints(POINTS.cristal, cristal.x, cristal.y - 30);
    }
  }

  // ---- Le Maestro est vaincu : la possession se brise, place au chant final ----
  vaincreMaestro() {
    const m = this.maestro;
    this.groupe_ondes_ennemies.clear(true, true);
    this.groupe_cristaux.getChildren().slice().forEach((c) => c.destroy());
    this.pointFaible.setAlpha(0);
    this.anneauFaible.setAlpha(0);
    m.setAlpha(1);
    this.cameras.main.flash(500, 255, 255, 255);
    this.cameras.main.shake(600, 0.01);
    this.lampe.allumee = false;
    this.afficherBandeau("LA POSSESSION SE BRISE !", "Le Maestro lève sa baguette une dernière fois…");
    this.tweens.add({ targets: m, x: 640, y: SOL_SCENE - 70, duration: 1500, ease: "Sine.easeInOut" });
    this.time.delayedCall(3000, () => this.commencerChant());
  }

  // ==========================================================================
  //  MOUVEMENT III : LE CHANT FINAL
  // ==========================================================================
  commencerChant() {
    if (this.fini == true) {
      return;
    }
    this.phase = "chant";
    this.physics.pause(); // les héros ne bougent plus : ils chantent
    this.faisceau.clear();
    this.halo.setVisible(false);
    this.haloProche.setVisible(false);
    this.texteMouvement.setText("III. LE CHANT FINAL");
    this.fleche.setVisible(false);
    this.cadreVieMaestro.setVisible(false);
    this.barreVieMaestro.setVisible(false);
    this.panneauCommandes.setVisible(false);
    this.points.forEach((p) => p.setVisible(false));
    this.tweens.add({ targets: this.voileNoir, fillAlpha: 0.85, duration: 600 });

    // les héros se placent de chaque côté du Maestro, le Maestro dirige au centre
    const cantatrice = this.cantatrice;
    const detective = this.detective;
    [cantatrice, detective].forEach((p) => {
      p.setVisible(true).setAlpha(1).setDepth(12);
      p.anims.play(p.nom + "_idle");
    });
    cantatrice.setPosition(470, SOL_SCENE - 32).setFlipX(false);
    detective.setPosition(810, SOL_SCENE - 32).setFlipX(true);
    this.maestro.setDepth(11).setTint(0x9a7bff).setPosition(640, SOL_SCENE - 70);
    this.maestro.play("maestro_idle");

    // la portée : 3 lignes (Do, Mi, Sol), la ligne de frappe et les touches
    this.chant = { notes: [], justes: 0, total: 0, parfaits: 0, rates: 0, debut: this.time.now, prochaine: 0, fin: false };
    this.elementsChant = []; // tout ce qu'on dessine pour le chant (effacé avant le salut)
    const g = this.add.graphics().setDepth(40);
    this.elementsChant.push(g);
    g.fillStyle(0x05081a, 0.85).fillRoundedRect(60, CHANT.lignes[0] - 50, 1160, CHANT.lignes[2] - CHANT.lignes[0] + 100, 16);
    CHANT.lignes.forEach((y, i) => {
      g.lineStyle(3, NOTES[i].couleur, 0.7).lineBetween(90, y, 1190, y);
      this.elementsChant.push(this.add.circle(CHANT.xFrappe, y, 24).setStrokeStyle(4, NOTES[i].couleur).setDepth(41));
      const bouton = ["A", "B", "C"][i];
      this.elementsChant.push(this.add.text(130, y - 20, bouton + " · " + NOTES[i].texte, { fontFamily: POLICE, fontSize: "14pt", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5).setDepth(41));
    });
    this.texteJugement = this.add.text(CHANT.xFrappe, CHANT.lignes[0] - 75, "", { fontFamily: POLICE, fontSize: "18pt", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setDepth(42);
    // les 12 feux de la rampe, au bord de la scène, éteints au départ : chaque note juste en rallume
    this.projecteurs = [];
    for (let i = 0; i < 12; i++) {
      this.projecteurs.push(this.add.image(150 + i * 89, SOL_SCENE + 14, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd98a).setScale(0.22).setAlpha(0.08).setDepth(13));
    }
    // la partition des 3 fragments, au-dessus de la scène
    this.elementsChant.push(this.add.image(640, 150, "img_partition").setDisplaySize(90, 90).setDepth(42).setAlpha(0.9));

    this.partitionChant = this.creerPartitionChant();
    this.touchesChant = this.cantatrice.touches.concat(this.detective.touches).filter((t, i, liste) => liste.indexOf(t) == i);
    jouerMusique(this, "musique_niveau3_final", 0.6);
    this.afficherBandeau("III. LE CHANT FINAL", "Chante les notes quand elles passent dans les cercles :\nA = Do · B = Mi · C = Sol");
  }

  // La liste des notes à chanter : [instant en ms, ligne]. Une note toutes les 0,5 s, puis plus vite.
  creerPartitionChant() {
    const partition = [];
    let t = 4500; // on laisse le temps de lire la consigne
    let ligne = 1;
    while (t < CHANT.dureeMs - 4000) {
      ligne = (ligne + Phaser.Math.Between(1, 2)) % 3; // on change de ligne (jamais 2 fois la même)
      partition.push([t, ligne]);
      const vite = t > CHANT.dureeMs * 0.55;
      t += vite ? Phaser.Math.RND.pick([300, 400, 400]) : Phaser.Math.RND.pick([500, 500, 600]);
    }
    return partition;
  }

  mettreAJourChant(temps) {
    const c = this.chant;
    const ecoule = temps - c.debut;
    const avance = (1300 - CHANT.xFrappe) / CHANT.vitesse * 1000; // une note met ce temps à arriver
    // faire apparaître les notes à l'avance, pour qu'elles arrivent pile à l'heure
    while (c.prochaine < this.partitionChant.length && this.partitionChant[c.prochaine][0] - avance <= ecoule) {
      const [instant, ligne] = this.partitionChant[c.prochaine];
      const note = this.add.circle(1300, CHANT.lignes[ligne], 18, NOTES[ligne].couleur).setStrokeStyle(3, 0xffffff).setDepth(41);
      note.instant = instant;
      note.ligne = ligne;
      c.notes.push(note);
      c.total += 1;
      c.prochaine += 1;
    }
    // les notes avancent vers la ligne de frappe ; trop tard = ratée
    c.notes.forEach((note) => {
      note.x = CHANT.xFrappe + ((note.instant - ecoule) / 1000) * CHANT.vitesse;
      if (note.jouee != true && ecoule - note.instant > CHANT.bienMs) {
        note.jouee = true;
        c.rates += 1;
        this.juger("RATÉ", "#ff7b7b");
        this.tweens.add({ targets: note, alpha: 0, duration: 200 });
      }
    });
    c.notes = c.notes.filter((note) => note.x > 40 || note.jouee != true);

    // les boutons A, B, C chantent Do, Mi, Sol
    ["A", "B", "C"].forEach((bouton, ligne) => {
      if (this.touchesChant.some((t) => Phaser.Input.Keyboard.JustDown(t[bouton]))) {
        this.chanter(ligne, ecoule);
      }
    });

    if (c.fin == false && ecoule > CHANT.dureeMs - 1500) {
      c.fin = true;
      this.finirChant();
    }
  }

  chanter(ligne, ecoule) {
    const c = this.chant;
    this.cantatrice.anims.play("cantatrice_shoot");
    // la note la plus proche, sur cette ligne, pas encore chantée
    const note = c.notes.filter((n) => n.ligne == ligne && n.jouee != true).sort((a, b) => Math.abs(a.instant - ecoule) - Math.abs(b.instant - ecoule))[0];
    if (note === undefined || Math.abs(note.instant - ecoule) > CHANT.bienMs) {
      return; // trop tôt : on ne compte rien
    }
    note.jouee = true;
    const parfait = Math.abs(note.instant - ecoule) <= CHANT.parfaitMs;
    c.justes += 1;
    if (parfait) {
      c.parfaits += 1;
    }
    this.ajouterPoints(parfait ? POINTS.parfait : POINTS.bien);
    this.juger(parfait ? "PARFAIT !" : "BIEN", parfait ? "#f5d97a" : "#9dffb0");
    this.tweens.add({ targets: note, scale: 2, alpha: 0, duration: 250 });
    // l'opéra se rallume petit à petit, et la possession quitte le Maestro
    const progression = c.justes / Math.max(1, this.partitionChant.length);
    const allumes = Math.round(progression * this.projecteurs.length);
    this.projecteurs.forEach((p, i) => p.setAlpha(i < allumes ? 0.9 : 0.08));
    this.voileNoir.setFillStyle(0x000000, 0.85 * (1 - progression));
    const teinte = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x9a7bff), Phaser.Display.Color.ValueToColor(0xffffff), 100, Math.round(progression * 100));
    this.maestro.setTint(Phaser.Display.Color.GetColor(teinte.r, teinte.g, teinte.b));
  }

  juger(texte, couleur) {
    this.texteJugement.setText(texte).setColor(couleur).setAlpha(1).setScale(1.2);
    this.tweens.add({ targets: this.texteJugement, scale: 1, alpha: 0, duration: 600, delay: 150 });
  }

  // ---- La fin : écran blanc, silence, rideau, applaudissements, salut ----
  finirChant() {
    this.cameras.main.flash(900, 255, 255, 255);
    arreterMusique(this);
    this.chant.notes.forEach((n) => n.destroy());
    this.elementsChant.forEach((e) => e.destroy());
    this.texteJugement.destroy();
    this.texteCombo.setText("");
    this.texteMouvement.setText("LE SALUT");
    this.voileNoir.setFillStyle(0x000000, 0);
    this.maestro.clearTint();
    // 1 seconde de silence… puis le rideau tombe
    this.time.delayedCall(1200, () => this.fermerRideau());
  }

  fermerRideau() {
    const rideau = (x) => {
      const g = this.add.graphics().setDepth(90);
      g.fillStyle(0x6e0f1c).fillRect(0, 0, 640, 720);
      g.fillStyle(0x8f1726);
      for (let i = 0; i < 640; i += 40) {
        g.fillRect(i + 14, 0, 10, 720); // les plis
      }
      g.fillStyle(0xe6bf5c).fillRect(0, 690, 640, 8); // la frange dorée
      g.x = x;
      return g;
    };
    this.rideauGauche = rideau(-640);
    this.rideauDroit = rideau(1280);
    this.tweens.add({ targets: this.rideauGauche, x: 0, duration: 900, ease: "Cubic.easeIn" });
    this.tweens.add({
      targets: this.rideauDroit,
      x: 640,
      duration: 900,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (this.cache.audio.exists("son_applaudissements")) {
          this.sound.play("son_applaudissements", { volume: 0.7 });
        }
        this.time.delayedCall(1600, () => this.saluer());
      }
    });
  }

  saluer() {
    // le rideau se rouvre sur l'opéra tout illuminé
    this.projecteurs.forEach((p) => p.setAlpha(0.9));
    this.tweens.add({ targets: this.rideauGauche, x: -640, duration: 1100, ease: "Cubic.easeOut" });
    this.tweens.add({ targets: this.rideauDroit, x: 1280, duration: 1100, ease: "Cubic.easeOut" });
    this.phase = "salut";
    this.fleche.setVisible(false);
    this.groupe_scene.getChildren().forEach((marche) => {
      if (marche.y < SOL_SCENE) {
        marche.dessin.setVisible(false); // les balcons du combat disparaissent
      }
    });
    // les trois saluent ensemble : la Cantatrice, le Maestro libéré, le Détective
    this.cantatrice.setPosition(520, SOL_SCENE - 32).setFlipX(false);
    this.detective.setPosition(760, SOL_SCENE - 32).setFlipX(false);
    this.maestro.setPosition(640, SOL_SCENE - 70).play("maestro_idle");
    [this.cantatrice, this.maestro, this.detective].forEach((p, i) => {
      this.tweens.add({ targets: p, y: p.y + 10, angle: 4, duration: 350, yoyo: true, repeat: 2, delay: 1300 + i * 150, hold: 300 });
    });

    // le bilan
    const c = this.chant;
    const justesse = c.total > 0 ? c.justes / c.total : 0;
    const bonusCoeurs = this.vies * POINTS.coeur;
    this.ajouterPoints(bonusCoeurs);
    let rang = "SIFFLETS…";
    if (justesse >= 0.85 && this.vies >= this.viesMax / 2) {
      rang = "OVATION !";
    } else if (justesse >= 0.65) {
      rang = "BRAVO !";
    } else if (justesse >= 0.4) {
      rang = "APPLAUDISSEMENTS";
    }
    let record = 0;
    try {
      record = Number(window.localStorage.getItem("maestro_niveau3_record")) || 0;
      if (this.score > record) {
        window.localStorage.setItem("maestro_niveau3_record", String(this.score));
      }
    } catch (e) {
      record = 0; // pas de stockage : tant pis pour le record
    }

    // les bouquets : un par tranche de 400 points
    const bouquets = Math.min(40, Math.floor(this.score / 400));
    for (let i = 0; i < bouquets; i++) {
      const fleur = this.add.image(Phaser.Math.Between(200, 1080), -30, "n3_fleur").setDepth(70).setScale(1.6).setAngle(Phaser.Math.Between(0, 360));
      fleur.setTint(Phaser.Math.RND.pick([0xff5a7a, 0xffd24a, 0xff8ad8, 0xffffff, 0xff4040])); // une couleur au hasard
      this.tweens.add({ targets: fleur, y: Phaser.Math.Between(SOL_SCENE - 10, SOL_SCENE + 10), angle: "+=" + Phaser.Math.Between(180, 540), duration: Phaser.Math.Between(900, 1600), delay: 1500 + i * 70, ease: "Quad.easeIn" });
    }

    const style = (taille, couleur) => ({ fontFamily: POLICE, fontSize: taille, fontStyle: "bold", color: couleur, align: "center", stroke: "#000000", strokeThickness: 6 });
    const textes = [
      this.add.text(640, 120, rang, style("44pt", "#f5d97a")).setOrigin(0.5),
      this.add.text(640, 190, "Le Maestro est libéré : les lumières se rallument sur l'opéra.", style("15pt", "#ffffff")).setOrigin(0.5),
      this.add
        .text(640, 250, "Chant : " + Math.round(justesse * 100) + " % de notes justes (" + c.parfaits + " parfaites)   ·   Cœurs : +" + bonusCoeurs + "\nSCORE : " + this.score + (this.score > record ? "   —   NOUVEAU RECORD !" : "   (record : " + record + ")"), style("16pt", "#dfe6ff"))
        .setOrigin(0.5),
      this.add.text(640, 690, "A / Entrée : continuer", style("14pt", "#cfd6f5")).setOrigin(0.5)
    ];
    textes.forEach((t, i) => {
      t.setDepth(80).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 600, delay: 2500 + i * 300 });
    });
    this.salutPret = this.time.now + 3500;
    this.texteScore.setText(String(this.score));
  }

  mettreAJourSalut() {
    if (this.time.now < this.salutPret || this.fini == true) {
      return;
    }
    const touches = this.cantatrice.touches.concat(this.detective.touches);
    const entree = this.input.keyboard.addKey("ENTER");
    if (Phaser.Input.Keyboard.JustDown(entree) || touches.some((t) => Phaser.Input.Keyboard.JustDown(t.A))) {
      this.fini = true;
      this.cameras.main.fadeOut(900, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.terminerNiveau()); // l'écran « Niveau terminé » (niveau 1)
    }
  }

  // ==========================================================================
  //  PERDRE : on recommence tout de suite le mouvement en cours (pas de long écran Game Over)
  // ==========================================================================
  perdre() {
    this.fini = true;
    this.persos.forEach((perso) => {
      perso.setVelocityX(0);
      perso.setAlpha(1);
      if (perso.body.enable) {
        perso.anims.play(perso.nom + "_death");
      }
    });
    this.faisceau.clear();
    this.halo.setVisible(false);
    this.haloProche.setVisible(false);
    this.time.delayedCall(1200, () => {
      const fond = this.add.rectangle(0, 0, 760, 200, 0x0b1030, 0.94).setStrokeStyle(4, 0xf5d97a);
      const titre = this.add.text(0, -50, this.phase == "maestro" ? "LE MAESTRO L'EMPORTE…" : "TU AS CHUTÉ…", { fontFamily: POLICE, fontSize: "26pt", fontStyle: "bold", color: "#f5d97a", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5);
      const choix = this.add.text(0, 30, "A / Entrée : recommencer " + (this.phase == "maestro" ? "le combat" : "au dernier balcon") + "\nD : retourner au lobby", { fontFamily: POLICE, fontSize: "15pt", color: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);
      this.panneauReessayer = this.add.container(640, 330, [fond, titre, choix]).setScrollFactor(0).setDepth(160);
    });
  }

  gererReessayer() {
    const touches = this.cantatrice.touches.concat(this.detective.touches);
    const entree = this.input.keyboard.addKey("ENTER");
    if (Phaser.Input.Keyboard.JustDown(entree) || touches.some((t) => Phaser.Input.Keyboard.JustDown(t.A))) {
      const reprise = this.phase == "maestro" ? { phase: "maestro", palier: PALIERS[PALIERS.length - 1] } : { phase: "montee", palier: this.dernierPalier };
      this.scene.restart({ reprise: reprise });
    } else if (touches.some((t) => Phaser.Input.Keyboard.JustDown(t.D))) {
      this.scene.start("lobby");
    }
  }
}
