// Niveau 3 : la Grande Scène. Ascension, combat contre le Maestro, chant final.

import niveau1 from "./niveau1.js"; // le niveau 1 : on hérite de tout ce qu'il fait
import { REGLAGES, POLICE } from "./reglages.js"; // constantes et police partagées
import { creerPanneau, toucheEnfoncee } from "./controles.js"; // le panneau de commandes et la lecture des touches
import { jouerMusique, arreterMusique } from "./musique.js"; // les musiques du niveau

// ---- Le monde : une tour de 4 écrans de haut. La Grande Scène est tout en haut (le 1er écran). ----
const LARGEUR_MONDE = 1280; // largeur du monde en px
const HAUTEUR_MONDE = 2880; // hauteur du monde en px
const SOL_SCENE = 540; // la hauteur du plancher de la Grande Scène (dessiné dans le fond)
const SOL_DEPART = 2820; // le sol tout en bas de la tour
const TRAPPE = { x: 580, largeur: 120 }; // le trou dans le plancher de la scène, par où on arrive

// Les 3 notes (mêmes couleurs que les ondes et les cristaux)
const NOTES = [
  { nom: "do", texte: "DO", couleur: 0xff6b7d }, // Do : rouge
  { nom: "mi", texte: "MI", couleur: 0x62b0ff }, // Mi : bleu
  { nom: "sol", texte: "SOL", couleur: 0xffd24a } // Sol : doré
];

// ---- Les marches de l'ascension. x, y = coin haut gauche · l = largeur ----
//  type "or"     : une marche normale, toujours solide
//  type "note"   : solide seulement si la Cantatrice a choisi cette note (0 = Do, 1 = Mi, 2 = Sol)
//  type "rythme" : un projecteur, solide seulement pendant ses temps (groupe "A" ou "B", ils alternent)
//  type "fausse" : ressemble à une marche de note… mais s'effondre ! La lampe la démasque.
const MARCHES = [
  // 1er passage : apprendre les notes
  { type: "or", x: 360, y: 2720, l: 180 }, // marche dorée de départ
  { type: "note", note: 0, x: 600, y: 2620, l: 160 }, // marche de note Do
  { type: "note", note: 1, x: 820, y: 2520, l: 160 }, // marche de note Mi
  { type: "note", note: 2, x: 1040, y: 2420, l: 160 }, // marche de note Sol
  { type: "note", note: 0, x: 820, y: 2320, l: 160 }, // marche de note Do
  // 2e passage : les projecteurs en rythme
  { type: "rythme", groupe: "A", x: 160, y: 2150, l: 160 }, // projecteur du groupe A
  { type: "rythme", groupe: "B", x: 380, y: 2050, l: 160 }, // projecteur du groupe B
  { type: "rythme", groupe: "A", x: 600, y: 1950, l: 160 }, // projecteur du groupe A
  { type: "rythme", groupe: "B", x: 820, y: 1850, l: 160 }, // projecteur du groupe B
  { type: "note", note: 1, x: 1040, y: 1750, l: 160 }, // marche de note Mi
  { type: "or", x: 780, y: 1700, l: 160 }, // marche dorée
  // 3e passage : les fausses notes (et des cristaux)
  { type: "note", note: 2, x: 1000, y: 1550, l: 160 }, // marche de note Sol
  { type: "fausse", note: 2, x: 700, y: 1550, l: 160 }, // fausse note Sol
  { type: "note", note: 0, x: 760, y: 1450, l: 160 }, // marche de note Do
  { type: "fausse", note: 0, x: 1080, y: 1450, l: 160 }, // fausse note Do
  { type: "note", note: 1, x: 500, y: 1350, l: 160 }, // marche de note Mi
  { type: "fausse", note: 1, x: 820, y: 1350, l: 160 }, // fausse note Mi
  { type: "or", x: 240, y: 1250, l: 180 }, // marche dorée
  { type: "rythme", groupe: "A", x: 480, y: 1160, l: 160 }, // projecteur du groupe A
  { type: "fausse", note: 2, x: 100, y: 1160, l: 140 }, // fausse note Sol
  // 4e passage : tout à la fois, jusqu'à la trappe de la scène
  { type: "note", note: 0, x: 900, y: 970, l: 160 }, // marche de note Do
  { type: "rythme", groupe: "B", x: 640, y: 870, l: 160 }, // projecteur du groupe B
  { type: "note", note: 2, x: 380, y: 770, l: 160 }, // marche de note Sol
  { type: "fausse", note: 2, x: 900, y: 770, l: 160 }, // fausse note Sol
  { type: "note", note: 1, x: 560, y: 650, l: 160 } // dernière marche avant la trappe
];
// Les PALIERS : de grands balcons sur toute la largeur. On les traverse par en dessous,
// et si on perd, on recommence au dernier palier atteint.
const PALIERS = [2250, 1650, 1070];

// Les cristaux de l'ascension (note : 0 = Do, 1 = Mi, 2 = Sol)
const CRISTAUX = []; // pas d'ennemis dans la Grande Scène

// ---- Le rythme ----
const BPM_DEPART = 96; // tempo en bas de la tour (battements par minute)
const BPM_ARRIVEE = 150; // tempo en haut : plus on monte, plus ça accélère
const BPM_MAESTRO = 126; // tempo du combat

// ---- Le Maestro ----
const MAESTRO = {
  pv: 8, // coups à donner pour le libérer
  y: 115, // hauteur où il flotte
  xMin: 280, // limite gauche du vol du Maestro
  xMax: 1000, // limite droite du vol du Maestro
  echelle: 2.2, // le sprite fait 64 px : x 2,2 = environ 140 px
  dureeRevelationMs: 4000, // une fois éclairé, son point faible reste visible 4 s
  attaqueTousLesTemps: 6 // il attaque tous les 6 temps (5 quand la scène est éteinte)
};
// Les plateformes de la Grande Scène (on les traverse par en dessous)
const BALCONS = [
  { x: 80, y: 430, l: 240 }, // balcon bas à gauche
  { x: 960, y: 430, l: 240 }, // balcon bas à droite
  { x: 330, y: 320, l: 200 }, // balcon du milieu à gauche
  { x: 750, y: 320, l: 200 }, // balcon du milieu à droite
  { x: 540, y: 205, l: 200 } // balcon du haut
];

// ---- Le chant final ----
const CHANT = {
  dureeMs: 43000, // la durée de la musique (l'air de la Reine de la Nuit)
  vitesse: 300, // vitesse de défilement des notes (px/s) : un peu plus lent qu'avant
  xFrappe: 250, // la ligne où il faut appuyer
  lignes: [250, 320, 390], // hauteur des 3 lignes de la portée (Do, Mi, Sol)
  parfaitMs: 90, // à moins de 90 ms : PARFAIT
  bienMs: 200 // à moins de 200 ms : BIEN
};

// ---- Les points ----
const POINTS = {
  marche: 50, // chaque nouvelle hauteur atteinte (multipliée par le crescendo)
  coup: 150, // chaque coup au Maestro (multiplié par le combo)
  cristal: 250, // points pour un cristal détruit
  parfait: 100, // points pour une note parfaite
  bien: 50, // points pour une note bien jouée
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
    this.load.setBaseURL(this.sys.game.config.baseURL); // adresse de base du jeu (pour les chemins relatifs)
    this.load.image("img_fond_niveau3", "./assets/fond_niveau3.jpg"); // la Grande Scène
    this.load.image("img_lanterne", "./assets/lanterne_chinoise.png"); // la lanterne chinoise (décor)
    // Les plateformes : une par couleur de note (Do = rouge, Mi = bleue, Sol = dorée), et les plateformes marron
    this.load.image("n3_note_rouge", "./assets/plateforme_note_rouge.png"); // plateforme de note Do
    this.load.image("n3_note_bleue", "./assets/plateforme_note_bleue.png"); // plateforme de note Mi
    this.load.image("n3_note_doree", "./assets/plateforme_note_doree.png"); // plateforme de note Sol
    this.load.image("n3_plat_marron", "./assets/plateforme_marron.png"); // plateforme marron
    this.load.image("n3_sol_marron", "./assets/sol_marron.png"); // sol marron du plancher
    this.load.spritesheet("maestro_boss", "./assets/maestro_boss.png", { frameWidth: 64, frameHeight: 64 }); // 8 cases par ligne
    this.load.audio("musique_niveau3_montee", "./assets/musique_niveau3_montee.m4a"); // musique de la montée
    this.load.audio("musique_niveau3_maestro", "./assets/musique_niveau3_maestro.m4a"); // musique du combat
    this.load.audio("musique_niveau3_final", "./assets/musique_niveau3_final.m4a"); // musique du chant final
    this.load.audio("son_applaudissements", "./assets/son_applaudissements.m4a"); // son des applaudissements
  }

  // Ce qui change par rapport au niveau 1 (voir definirNiveau dans niveau1.js)
  definirNiveau() {
    this.largeurMonde = LARGEUR_MONDE; // largeur du monde pour la caméra et la physique
    this.hauteurMonde = HAUTEUR_MONDE; // hauteur du monde pour la caméra et la physique
    this.couleurFond = 0x05060f; // couleur de fond (noir bleuté)
    this.listeTubas = []; // pas de Tuba ici
    this.listeCristaux = CRISTAUX; // pas de cristal dans ce niveau
    this.numeroNiveau = 3; // numéro du niveau (pour la progression)
    this.formeUnique = true; // en solo : un seul corps qui se transforme (bouton D)
    this.musiqueNiveau = "musique_niveau3_montee"; // musique au départ de l'ascension
    this.messageVictoire = "Le Maestro est libéré !"; // message affiché à la victoire
    this.objectif = // texte de l'objectif affiché au départ
      "OBJECTIF : monte jusqu'à la Grande Scène et libère le Maestro !\n" + // deuxième ligne de l'objectif
      "Seules les marches de TA NOTE sont solides : change de note avec C"; // troisième ligne de l'objectif
  }

  // ==========================================================================
  //  CREATE : on construit le niveau 1, puis on ajoute ce qui est propre au niveau 3
  // ==========================================================================
  create() {
    this.phase = "montee"; // "montee", "maestro", "chant", puis "salut"
    this.score = 0; // score de la partie
    this.crescendo = 0; // le combo de l'ascension
    this.combo = 0; // le combo du combat
    this.plusHaut = SOL_DEPART; // la plus grande hauteur atteinte (plus petit y)
    this.dernierPalier = this.reprise && this.reprise.palier ? this.reprise.palier : SOL_DEPART;
    this.bpm = BPM_DEPART;
    this.tempsDepuisBattement = 0; // temps écoulé depuis le dernier battement
    this.battement = 0; // le numéro du temps en cours
    this.creerTexturesNiveau3(); // dessine les textures faites à la main
    this.creerAnimationsMaestro(); // crée les animations du Maestro

    super.create(); // tout le niveau 1 : héros, lampe, cristaux, cœurs, interface, caméra, musique…

    this.creerInterfaceNiveau3(); // interface du niveau 3 (score, mouvement, vie du Maestro)
    if (this.reprise && this.reprise.phase == "maestro") {
      this.commencerMaestro(); // on recommence directement le combat
    } else if (this.dernierPalier != SOL_DEPART) {
      this.afficherMessage("On reprend au dernier balcon atteint !", 2500); // message quand on reprend à un balcon
    }
  }

  // --------------------------------------------------------------------------
  //  Les images dessinées avec du code
  // --------------------------------------------------------------------------
  creerTexturesNiveau3() {
    if (this.textures.exists("n3_or")) { // si les textures existent déjà, on ne les refait pas
      return; // déjà faites (le niveau a été relancé)
    }
    const p = this.make.graphics({ add: false }); // un pinceau dessiné hors écran (rien n'est affiché)
    // marche dorée (64 x 16)
    p.fillStyle(0x5a3a26).fillRect(0, 0, 64, 16); // corps de la marche dorée
    p.fillStyle(0xe6bf5c).fillRect(0, 0, 64, 4); // dessus doré
    p.fillStyle(0xfff0b8).fillRect(0, 0, 64, 1); // reflet clair
    p.fillStyle(0x3d2718).fillRect(0, 14, 64, 2); // ombre du dessous
    p.generateTexture("n3_or", 64, 16); // crée la texture de la marche dorée
    // marche-portée (64 x 16) : blanche, on la colore ensuite avec la couleur de sa note
    p.clear(); // on efface pour réutiliser le pinceau
    p.fillStyle(0xffffff).fillRect(0, 0, 64, 16); // fond blanc de la marche-portée
    p.fillStyle(0x000000, 0.25).fillRect(0, 5, 64, 1).fillRect(0, 9, 64, 1).fillRect(0, 13, 64, 1); // les lignes de la portée
    p.fillStyle(0xffffff, 1).fillRect(0, 0, 64, 2); // bord clair du dessus
    p.generateTexture("n3_note", 64, 16); // crée la texture de la note
    // projecteur (64 x 16) : verre bleuté
    p.clear(); // on efface pour le projecteur
    p.fillStyle(0xbfe3ff).fillRect(0, 0, 64, 16); // verre du projecteur
    p.fillStyle(0xffffff).fillRect(0, 0, 64, 3); // haut clair
    p.fillStyle(0x6fa8d6).fillRect(0, 13, 64, 3); // bas bleuté
    p.generateTexture("n3_rythme", 64, 16); // crée la texture du projecteur
    // balcon (64 x 20) : dorure et velours rouge
    p.clear(); // on efface pour le balcon
    p.fillStyle(0x6e0f1c).fillRect(0, 0, 64, 20); // velours rouge
    p.fillStyle(0xe6bf5c).fillRect(0, 0, 64, 4); // dorure du haut
    p.fillStyle(0xe6bf5c).fillRect(30, 6, 4, 14); // ornement doré
    p.generateTexture("n3_balcon", 64, 20); // crée la texture du balcon
    // une fleur pour les bouquets du salut
    p.clear(); // on efface pour la fleur
    p.fillStyle(0x2f8f3a).fillRect(9, 12, 2, 12); // tige verte
    p.fillStyle(0xffffff); // pétales blancs
    for (let k = 0; k < 6; k++) { // boucle sur les 6 pétales
      const a = (k / 6) * Math.PI * 2; // angle de ce pétale
      p.fillCircle(10 + Math.cos(a) * 5, 8 + Math.sin(a) * 5, 3.5); // 6 pétales (colorés ensuite)
    }
    p.fillStyle(0xffe070).fillCircle(10, 8, 2.5); // cœur jaune
    p.generateTexture("n3_fleur", 20, 24); // crée la texture de la fleur
    p.destroy(); // libère le pinceau
  }

  // Les animations du Maestro : une planche de 8 cases par ligne, une ligne par animation
  creerAnimationsMaestro() {
    const lignes = { idle: [0, 7, 6, -1], walk: [1, 7, 8, -1], attack: [3, 7, 12, 0], hurt: [4, 7, 14, 0], death: [5, 7, 7, 0] }; // lignes de la planche : [ligne, nombre d'images, vitesse, répétition]
    for (const nom in lignes) {
      const [ligne, images, fps, repete] = lignes[nom]; // lit les valeurs de cette animation
      if (this.anims.exists("maestro_" + nom) == false) { // on ne la crée qu'une seule fois
        this.anims.create({ // crée l'animation
          key: "maestro_" + nom, // son nom
          frames: this.anims.generateFrameNumbers("maestro_boss", { start: ligne * 8, end: ligne * 8 + images - 1 }), // les images de la ligne
          frameRate: fps, // images par seconde
          repeat: repete // -1 = boucle, 0 = une seule fois
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
    this.avecTuilesPlateformes = false; // pas de carte Tiled : le niveau 1 n'en cherchera pas
    this.echelles = []; // pas d'échelle

    // Le fond : la Grande Scène en haut, les cintres (dessinés avec du code) en dessous
    this.dessinerCintres();
    this.add.image(640, 360, "img_fond_niveau3").setDepth(0); // la Grande Scène (1280 x 720)
    // un dégradé pour passer en douceur de la scène aux cintres
    const degrade = this.add.graphics().setDepth(0); // dégradé : on empile des bandes
    for (let i = 0; i < 40; i++) { // 40 bandes
      degrade.fillStyle(0x05060f, i / 40).fillRect(0, 680 + i, LARGEUR_MONDE, 1); // bande de plus en plus sombre
    }
    // le voile qui assombrit la scène quand le Maestro éteint les lumières (transparent au départ)
    this.voileNoir = this.add.rectangle(0, 0, LARGEUR_MONDE, 720, 0x000000, 0).setOrigin(0, 0).setDepth(1);

    // Des lanternes qui battent la mesure, et de la poussière dorée qui flotte
    this.lanternes = []; // liste des lanternes (pour les faire battre)
    PALIERS.concat([SOL_DEPART]).forEach((y) => { // pour chaque palier et le sol de départ
      [70, 1210].forEach((x) => { // une lanterne à gauche, une à droite
        const lanterne = this.add.image(x, y - 70, "img_lanterne").setDisplaySize(40, 60).setDepth(4); // l'image de la lanterne, 70 px au-dessus du palier
        this.lanternes.push(lanterne); // on la garde pour la faire battre
        this.lueur(x, y - 70, 0.5, 0.35, 0xffc070, 3); // lueur autour de la lanterne
      });
    });
    if (this.modeLeger == false) { // les particules sont coupées en mode léger
      this.add.particles(0, 720, "tex_lumiere", { // poussière dorée qui flotte
        x: { min: 0, max: LARGEUR_MONDE }, // répartie sur toute la largeur
        y: { min: 0, max: HAUTEUR_MONDE - 720 }, // répartie sur toute la hauteur de la tour
        lifespan: 6000, // chaque particule vit 6 s
        speedY: { min: -12, max: -4 }, // elle monte doucement
        scale: { start: 0.04, end: 0 }, // elle rétrécit
        alpha: { start: 0.6, end: 0 }, // elle s'efface
        tint: 0xffd98a, // couleur dorée
        blendMode: "ADD", // lumière additive (elle brille)
        frequency: 120 // une particule toutes les 120 ms
      }).setDepth(3); // au-dessus du fond
    }

    // Le sol de départ, et le plancher de la scène (avec la trappe au milieu)
    this.ajouterPlateforme({ x: 0, y: SOL_DEPART, width: LARGEUR_MONDE, height: 60 }); // le sol de départ, tout en bas de la tour
    this.add.tileSprite(0, SOL_DEPART, LARGEUR_MONDE, 60, "n3_sol_marron").setOrigin(0, 0).setDepth(2); // dessin du sol (répété)
    this.ajouterPlateforme({ x: 0, y: SOL_SCENE, width: TRAPPE.x, height: 20 }); // plancher gauche de la scène
    this.ajouterPlateforme({ x: TRAPPE.x + TRAPPE.largeur, y: SOL_SCENE, width: LARGEUR_MONDE - TRAPPE.x - TRAPPE.largeur, height: 20 }); // plancher droit de la scène
    this.trappe = this.ajouterPlateforme({ x: TRAPPE.x, y: SOL_SCENE, width: TRAPPE.largeur, height: 20 }); // la trappe au milieu (zone solide)
    this.trappe.unSens = true; // on la traverse en sautant par en dessous, et on se pose dessus
    this.trappeLueur = this.add.rectangle(TRAPPE.x + TRAPPE.largeur / 2, SOL_SCENE + 4, TRAPPE.largeur, 10, 0xffe9a0, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(2); // lueur de la trappe
    this.tweens.add({ targets: this.trappeLueur, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 }); // elle brille pour montrer le chemin

    // Les paliers (balcons sur toute la largeur, on les traverse par en dessous)
    PALIERS.forEach((y) => {
      this.add.tileSprite(0, y, LARGEUR_MONDE, 20, "n3_plat_marron").setOrigin(0, 0).setDepth(2); // dessin du balcon (répété)
      const zone = this.ajouterPlateforme({ x: 0, y: y, width: LARGEUR_MONDE, height: 20 }); // zone de collision du balcon
      zone.unSens = true; // à sens unique (voir peutMarcherSur dans niveau1.js)
      zone.palier = true; // repère : c'est un palier
    });

    // Les marches de l'ascension
    MARCHES.forEach((m) => this.ajouterMarche(m)); // on pose toutes les marches

    // Panneaux d'indication
    this.ajouterIndice(640, 2770, "Seules les marches de TA NOTE sont solides !\nChange de note avec C en plein saut (Do → Mi → Sol)"); // panneau au départ
    this.ajouterIndice(640, 2190, "Les projecteurs bleus s'allument EN RYTHME : saute au bon temps !"); // panneau du rythme
    this.ajouterIndice(640, 1600, "FAUSSES NOTES ! Certaines marches s'effondrent.\nLe Détective les démasque avec sa lampe (B)"); // panneau des fausses notes
    this.ajouterIndice(640, 1020, "Dernier effort : la Grande Scène est juste au-dessus !"); // panneau du dernier effort

    // Ce que le niveau 1 attend de la carte
    const departY = this.dernierPalier; // on retient où les héros recommencent
    this.departs = { j1: { x: 560, y: departY }, j2: { x: 720, y: departY } }; // positions de départ des deux héros
    this.yChute = HAUTEUR_MONDE + 500; // pas de vide : on retombe sur les marches du dessous
  }

  // Les cintres : le haut du théâtre, au-dessus des coulisses (cordes, perches à projecteurs, rideaux)
  dessinerCintres() {
    const g = this.add.graphics().setDepth(0); // calque de dessin des cintres
    // un dégradé du violet (en haut) au bleu nuit (en bas)
    const haut = Phaser.Display.Color.ValueToColor(0x24123a); // violet du haut
    const bas = Phaser.Display.Color.ValueToColor(0x060a1c); // bleu nuit du bas
    for (let y = 720; y < HAUTEUR_MONDE; y += 8) { // une bande toutes les 8 px
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(haut, bas, HAUTEUR_MONDE - 720, y - 720); // couleur de cette bande (dégradé)
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)).fillRect(0, y, LARGEUR_MONDE, 8); // dessine la bande
    }
    // les cordes qui pendent
    for (let i = 0; i < 26; i++) { // 26 cordes
      const x = 90 + ((i * 397) % 1100); // position horizontale de la corde
      g.lineStyle(2, 0x8a6a3a, 0.35).lineBetween(x, 720, x + ((i % 3) - 1) * 6, HAUTEUR_MONDE);
    }
    // les perches à projecteurs, avec leurs petites ampoules
    for (let y = 900; y < HAUTEUR_MONDE - 100; y += 380) { // une perche toutes les 380 px
      g.fillStyle(0x2a2030).fillRect(0, y, LARGEUR_MONDE, 10); // barre sombre de la perche
      g.fillStyle(0xc9a85a).fillRect(0, y, LARGEUR_MONDE, 2); // liseré doré
      for (let x = 160; x < LARGEUR_MONDE - 120; x += 120) { // une ampoule toutes les 120 px
        g.fillStyle(0x1a1420).fillRect(x - 8, y + 10, 16, 14); // boîtier de l'ampoule
        this.lueur(x, y + 30, 0.18, 0.5, 0xffd98a, 0); // lueur de l'ampoule
      }
    }
    // les rideaux de velours sur les côtés
    [0, LARGEUR_MONDE - 70].forEach((x0) => { // rideau gauche puis rideau droit
      g.fillStyle(0x4a0a16).fillRect(x0, 720, 70, HAUTEUR_MONDE - 720); // fond du rideau
      for (let x = x0 + 6; x < x0 + 70; x += 16) { // plis du velours
        g.fillStyle(0x6e0f1c).fillRect(x, 720, 7, HAUTEUR_MONDE - 720); // un pli
      }
    });
  }

  // Le niveau 1 ajoute les plateformes avec une « zone » ; ici on renvoie la zone pour la régler ensuite
  ajouterPlateforme(objet) {
    const zone = this.add.zone(objet.x + objet.width / 2, objet.y + objet.height / 2, objet.width, objet.height); // zone au centre (Phaser attend le centre)
    this.groupe_plateformes.add(zone); // ajoutée au groupe de plateformes
    return zone; // renvoyée pour régler ensuite
  }

  // Une marche spéciale : un corps (dans groupe_scene) + son dessin
  ajouterMarche(m) {
    // Une plateforme de note est une seule image, un peu plus haute (24 px) ; les autres marches restent à 16 px
    const estNote = m.note !== undefined; // vrai pour une marche de note (elle a une couleur)
    const H = estNote ? 24 : 16; // hauteur : 24 px pour une note, 16 px sinon
    const zone = this.add.zone(m.x + m.l / 2, m.y + H / 2, m.l, H); // zone de collision (au centre)
    this.groupe_scene.add(zone); // ajoutée au groupe de la scène
    zone.type = m.type; // type de la marche
    zone.note = m.note; // numéro de la note
    zone.groupe = m.groupe; // groupe pour les projecteurs
    const couleurNote = ["n3_note_rouge", "n3_note_bleue", "n3_note_doree"]; // Do, Mi, Sol
    const texture = m.type == "or" ? "n3_or" : m.type == "rythme" ? "n3_rythme" : couleurNote[m.note] || "n3_note"; // image choisie selon le type ou la note
    if (m.type == "rythme") {
      // le projecteur à activer se voit mieux : un contour doré et une lueur
      this.add.rectangle(m.x + m.l / 2, m.y + 8, m.l + 6, 22).setStrokeStyle(3, 0xffe070).setDepth(4); // contour doré autour du projecteur
      this.lueur(m.x + m.l / 2, m.y + 8, 1.4, 0.45, 0xffe9a0, 4); // lueur du projecteur
    }
    // Une note : l'image entière, étirée sur toute la largeur. Les autres : répétée (tileSprite)
    zone.dessin = estNote // dessin : image entière pour une note
      ? this.add.image(m.x, m.y, texture).setOrigin(0, 0).setDisplaySize(m.l, H).setDepth(5) // image étirée sur toute la largeur
      : this.add.tileSprite(m.x, m.y, m.l, 16, texture).setOrigin(0, 0).setDepth(5); // sinon image répétée sur la longueur
    if (m.note !== undefined) {
      zone.symbole = this.add // le symbole ♪ au-dessus de la note
        .text(m.x + m.l / 2, m.y - 14, "♪", { fontFamily: POLICE, fontSize: "18pt", color: "#ffffff", stroke: "#000000", strokeThickness: 3 }) // police et taille du symbole
        .setOrigin(0.5) // centré
        .setTint(NOTES[m.note].couleur) // teinté avec la couleur de la note
        .setDepth(5); // dessiné par-dessus
    }
    if (m.type == "fausse") {
      zone.rect = new Phaser.Geom.Rectangle(m.x, m.y, m.l, 16); // pour savoir si la lampe l'éclaire
      zone.croix = this.add.text(m.x + m.l / 2, m.y + 8, "✕  FAUSSE NOTE  ✕", { fontFamily: POLICE, fontSize: "11pt", fontStyle: "bold", color: "#ffffff", stroke: "#3a0040", strokeThickness: 4 }).setOrigin(0.5).setDepth(6).setVisible(false); // croix affichée une fois démasquée
    }
    return zone; // renvoie la zone
  }

  // Une marche de note est-elle solide en ce moment ?
  marcheSolide(marche) {
    if (marche.cassee == true) { // marche cassée : plus solide
      return false; // fausse note effondrée
    }
    if (marche.type == "note" || marche.type == "fausse") { // les notes et les fausses notes
      return marche.note == this.noteActuelle; // seulement si c'est la note choisie
    }
    if (marche.type == "rythme") { // les projecteurs
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

  // Collisions de la Grande Scène : fragments, marches et Maestro
  collisionsObjets() {
    // Les héros se posent sur les marches spéciales seulement quand elles sont solides, et par le dessus
    this.physics.add.collider(this.persos, this.groupe_scene, null, (perso, marche) => { // collision entre les héros et les marches
      return this.marcheSolide(marche) && perso.body.velocity.y >= 0 && perso.body.bottom <= marche.body.top + 14; // solide si on tombe dessus par le haut
    });
  }

  // Les balcons de la Grande Scène (créés au début du combat)
  creerBalcons() {
    BALCONS.forEach((b) => { // un balcon par élément de BALCONS
      const zone = this.ajouterMarche({ type: "or", x: b.x, y: b.y, l: b.l }); // balcon fait comme une marche dorée
      zone.dessin.setTexture("n3_balcon").setDisplaySize(b.l, 20); // texture du balcon et taille
      zone.dessin.setAlpha(0); // invisible au départ
      this.tweens.add({ targets: zone.dessin, alpha: 1, duration: 800 }); // ils apparaissent en douceur
    });
  }

  // ==========================================================================
  //  INTERFACE : score, mouvement, métronome, vie du Maestro
  // ==========================================================================
  creerInterfaceNiveau3() {
    const fixe = (objet) => objet.setScrollFactor(0).setDepth(100); // petit raccourci : un texte fixé à l'écran
    this.iconeFragment.setVisible(false); // pas de fragment à ramasser ici
    this.texteFragment.setVisible(false); // idem pour son texte
    const style = (taille, couleur) => ({ fontFamily: POLICE, fontSize: taille, fontStyle: "bold", color: couleur, stroke: "#000000", strokeThickness: 5 }); // style de texte : gras, contour noir
    this.texteScore = fixe(this.add.text(1262, 16, "0", style("22pt", "#ffffff")).setOrigin(1, 0)); // score en haut à droite
    this.texteCombo = fixe(this.add.text(1262, 56, "", style("14pt", "#f5d97a")).setOrigin(1, 0)); // combo juste en dessous
    fixe(this.add.rectangle(640, 34, 300, 50, 0x05081a, 0.75).setStrokeStyle(1, 0xf5d97a, 0.6)); // fond du titre de mouvement
    this.texteMouvement = fixe(this.add.text(640, 14, "I. L'ASCENSION", style("14pt", "#f5d97a")).setOrigin(0.5, 0)); // titre du mouvement (I, II ou III)
    // le métronome : 4 points qui s'allument à chaque temps
    this.points = [0, 1, 2, 3].map((i) => fixe(this.add.circle(610 + i * 20, 52, 6, 0xffffff, 0.25)));
    // la vie du Maestro (cachée pendant l'ascension)
    this.cadreVieMaestro = fixe(this.add.rectangle(640, 80, 304, 12, 0x000000, 0.7).setStrokeStyle(2, 0xf5d97a)).setVisible(false); // cadre fin autour de la barre
    this.barreVieMaestro = fixe(this.add.rectangle(490, 80, 300, 8, 0xb0306a).setOrigin(0, 0.5)).setVisible(false); // barre de vie : 300 px de large, 8 px de haut
  }

  // Affiche les points gagnés à un endroit donné
  ajouterPoints(points, x, y) {
    this.score += points; // ajoute les points
    this.texteScore.setText(String(this.score)); // affiche le nouveau total
    if (x !== undefined) { // si une position est donnée, on affiche le +points
      const t = this.add.text(x, y, "+" + points, { fontFamily: POLICE, fontSize: "16pt", fontStyle: "bold", color: "#f5d97a", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5).setDepth(60); // texte flottant
      this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() }); // il monte et disparaît
    }
  }

  // ==========================================================================
  //  UPDATE
  // ==========================================================================
  update(temps, delta) {
    if (this.phase == "chant") { // phase chant : seul le chant est géré
      this.mettreAJourChant(temps); // met à jour le chant
      return; // et on arrête là
    }
    if (this.phase == "salut") { // phase salut : seule la fin est gérée
      this.mettreAJourSalut(); // met à jour le salut
      return; // et on arrête là
    }
    super.update(temps, delta); // héros, lampe, cristaux, chutes, caméra… (niveau 1)
    if (this.fini == true) { // si le niveau est fini (perdu ou gagné)
      if (this.panneauReessayer) { // l'écran de réessai est-il affiché ?
        this.gererReessayer(); // attend Entrée ou D
      }
      return; // on ne fait plus rien d'autre
    }
    this.mettreAJourRythme(delta); // le tempo et les projecteurs
    this.mettreAJourMarches(); // les marches changent d'aspect
    this.verifierFaussesNotes(temps); // fausses notes : démasquer ou effondrer
    if (this.phase == "montee") { // en montée : on regarde la progression
      this.verifierProgression(); // détecte les paliers et la fin de l'ascension
    } else if (this.phase == "maestro") { // en combat
      this.mettreAJourMaestro(temps); // le Maestro bouge et attaque
    }
  }

  // ---- Le rythme : un « temps » tous les 60000 / bpm millisecondes ----
  mettreAJourRythme(delta) {
    this.tempsDepuisBattement += delta; // ajoute le temps écoulé
    const duree = 60000 / this.bpm; // durée d'un temps en ms, selon le bpm
    if (this.tempsDepuisBattement < duree) { // pas encore un temps : on sort
      return;
    }
    this.tempsDepuisBattement -= duree; // on garde le surplus pour le temps suivant
    this.battement += 1; // on compte un temps de plus
    // les projecteurs : le groupe A est allumé 2 temps, puis le groupe B 2 temps
    this.groupeActif = Math.floor(this.battement / 2) % 2 == 0 ? "A" : "B";
    // le métronome et les lanternes battent la mesure
    this.points.forEach((point, i) => point.setFillStyle(0xffffff, i == this.battement % 4 ? 1 : 0.25));
    this.lanternes.forEach((l) => this.tweens.add({ targets: l, scaleX: l.scaleX * 1.12, scaleY: l.scaleY * 1.12, duration: 80, yoyo: true }));
    if (this.phase == "maestro") { // en combat, le Maestro attaque sur le temps
      this.battementMaestro(); // fait l'attaque (si c'est son tour)
    }
  }

  // ---- Les marches changent d'aspect selon la note choisie et le rythme ----
  mettreAJourMarches() {
    this.groupe_scene.getChildren().forEach((marche) => { // pour chaque marche
      if (marche.cassee == true) { // les marches cassées ne changent plus
        return;
      }
      const solide = this.marcheSolide(marche); // solide ou non (note choisie, temps...)
      const alpha = solide ? 1 : 0.22; // les marches « éteintes » restent un peu visibles
      if (marche.dessin.alpha != alpha && marche.type != "or") { // si l'état a changé (sauf marche dorée)
        marche.dessin.setAlpha(alpha); // on change la transparence
        if (marche.symbole) { // le symbole suit l'état de la marche
          marche.symbole.setAlpha(solide ? 1 : 0.3); // plus pâle quand la marche est éteinte
        }
      }
    });
  }

  // ---- Les fausses notes : la lampe les démasque, et elles s'effondrent sous les pieds ----
  verifierFaussesNotes(temps) {
    const faisceau = this.lampe.allumee == true ? this.calculerFaisceau() : null; // faisceau de la lampe, s'il est allumé
    this.groupe_scene.getChildren().forEach((marche) => { // pour chaque marche de la scène
      if (marche.type != "fausse" || marche.cassee == true) { // on ignore les marches qui ne sont pas des fausses notes ou déjà cassées
        return;
      }
      // éclairée par la lampe : on la démasque (elle devient violette, avec une croix)
      if (faisceau !== null && this.distanceAuRectangle(faisceau.cx, faisceau.cy, marche.rect) <= REGLAGES.lampe.rayon) {
        if (marche.demasquee != true) { // une seule fois
          marche.demasquee = true; // marquée comme démasquée
          marche.dessin.setTint(0x9a4dff); // devient violette
          marche.croix.setVisible(true); // affiche la croix
          this.ajouterPoints(25, marche.x, marche.y - 20); // points pour la démasquer
        }
      }
      // quelqu'un est posé dessus : elle s'effondre 0,3 s plus tard
      const dessus = this.persos.some((p) => p.body.enable && p.body.touching.down && Math.abs(p.body.bottom - marche.body.top) < 4 && p.body.center.x > marche.body.left && p.body.center.x < marche.body.right); // un héros est-il posé dessus ?
      if (dessus && marche.chute == undefined) { // pas déjà en train de tomber
        marche.chute = this.time.delayedCall(300, () => this.effondrer(marche)); // tombe dans 0,3 s
      }
    });
  }

  // Une marche de note s'effondre quand on la rate
  effondrer(marche) {
    marche.cassee = true; // marquée cassée
    marche.chute = undefined; // plus de chute prévue
    this.cameras.main.shake(120, 0.004); // secousse de la caméra
    const objets = [marche.dessin, marche.symbole, marche.croix].filter((o) => o); // les éléments à faire tomber
    this.tweens.add({ targets: objets, y: "+=120", alpha: 0, angle: 8, duration: 500 }); // ils tombent, deviennent transparents et tournent
    // elle revient 3 s plus tard (pour pouvoir réessayer)
    this.time.delayedCall(3000, () => {
      objets.forEach((o) => { // on les remet à leur place
        o.y -= 120; // remonte de 120 px
        o.setAngle(0); // remet l'angle à zéro
      });
      marche.cassee = false; // redevient solide
      this.tweens.add({ targets: objets, alpha: 1, duration: 300 }); // réapparaît en fondu
    });
  }

  // ---- L'ascension : le crescendo, les paliers, l'arrivée sur la scène ----
  verifierProgression() {
    const corps = this.persos.filter((p) => p.body.enable); // héros encore dans le jeu
    const haut = Math.min(...corps.map((p) => p.body.bottom)); // le héros le plus haut
    // une nouvelle hauteur (au moins 80 px plus haut que le record) : des points et le crescendo monte
    if (haut < this.plusHaut - 80) {
      this.plusHaut = haut; // nouveau record de hauteur
      this.crescendo = Math.min(this.crescendo + 1, 8); // le crescendo augmente (max 8)
      const perso = corps.find((p) => p.body.bottom == haut); // le héros le plus haut
      this.ajouterPoints(POINTS.marche * this.crescendo, perso.x, perso.y - 50); // points gagnés
      this.texteCombo.setText(this.crescendo > 1 ? "CRESCENDO x" + this.crescendo : ""); // texte du crescendo
      // le tempo suit la hauteur : de 96 à 150 battements par minute
      const progression = Phaser.Math.Clamp((SOL_DEPART - haut) / (SOL_DEPART - SOL_SCENE), 0, 1);
      this.bpm = Math.round(BPM_DEPART + (BPM_ARRIVEE - BPM_DEPART) * progression); // le tempo suit la hauteur
    }
    // un palier atteint : c'est là qu'on recommencera si on perd
    PALIERS.forEach((y) => {
      if (y < this.dernierPalier && corps.some((p) => Math.abs(p.body.bottom - y) < 3)) { // le héros touche-t-il ce palier ?
        this.dernierPalier = y; // le palier devient le point de reprise
        this.afficherMessage("Balcon atteint : si tu perds, tu reprendras ici !", 2500); // message
      }
    });
    // arrivée sur la scène : tout le monde au-dessus du plancher
    if (corps.every((p) => p.body.bottom <= SOL_SCENE + 2 && p.body.touching.down)) { // tous les héros sont sur la scène et posés
      this.commencerMaestro(); // lance le combat
    }
  }

  // Un héros qui tombe perd son crescendo
  blesser(perso, sourceX) {
    this.crescendo = 0; // perte du crescendo
    this.combo = 0; // perte du combo
    this.texteCombo.setText(""); // texte du combo effacé
    super.blesser(perso, sourceX); // le niveau 1 gère les dégâts
  }

  // ---- L'onde vers le haut : en maintenant HAUT, la Cantatrice chante vers le plafond ----
  lancerOnde(perso) {
    if (toucheEnfoncee(perso, "haut") == false) { // si HAUT n'est pas maintenu : onde normale
      super.lancerOnde(perso); // l'onde normale, vers l'avant
      this.groupe_ondes.getChildren().slice(-1)[0].yDepart = perso.y; // mémorise la hauteur de départ de l'onde
      return; // onde normale : on sort
    }
    const onde = this.groupe_ondes.create(perso.x, perso.y - 40, "onde"); // onde qui monte, créée à la bouche
    onde.setDepth(8).setScale(1.5).setAngle(-90); // taille et angle vertical
    onde.note = NOTES[this.noteActuelle].nom; // couleur de la note choisie
    onde.play("onde_" + onde.note); // animation de la note
    onde.body.setSize(18, 22); // boîte de collision
    onde.setVelocityY(-REGLAGES.onde.vitesse); // vitesse vers le haut
    onde.xDepart = onde.x; // position de départ en x
    onde.yDepart = onde.y; // position de départ en y
  }

  // Les ondes disparaissent après leur portée (dans toutes les directions)
  nettoyerOndes() {
    this.groupe_ondes.getChildren().slice().forEach((onde) => { // pour chaque onde
      const distance = Phaser.Math.Distance.Between(onde.x, onde.y, onde.xDepart, onde.yDepart || onde.y); // distance parcourue depuis le départ
      if (distance > REGLAGES.onde.portee) { // trop loin : on la supprime
        onde.destroy(); // suppression de l'onde
      }
    });
    this.groupe_ondes_ennemies.getChildren().slice().forEach((note) => { // notes ennemies du Maestro
      if (this.time.now > note.finDeVie) { // si leur temps de vie est passé
        note.destroy(); // les notes du Maestro vivent 5 secondes
      }
    });
  }

  // Duo : si un joueur reste trop bas, il rejoint l'autre (sinon la caméra ne peut pas cadrer les deux)
  limiterEcartDuo() {
    const [c, d] = [this.cantatrice, this.detective]; // les deux personnages
    if (Math.abs(c.y - d.y) < 560) { // écart vertical assez petit : rien à faire
      return;
    }
    const bas = c.y > d.y ? c : d; // le plus bas des deux
    const haut = bas == c ? d : c; // l'autre, celui du haut
    if (haut.body.touching.down == false) { // on attend qu'il soit posé
      return; // on attend que celui du haut soit posé
    }
    bas.body.reset(haut.x, haut.y - 10); // téléporte le bas au-dessus du haut
    bas.invincibleJusqua = this.time.now + 1500; // invincible 1,5 s après
    this.faireClignoter(bas); // il clignote
    this.afficherMessage("Ton partenaire te rejoint !", 2000); // message
  }

  // La caméra : on monte avec les héros (et sur la scène, elle ne bouge plus)
  mettreAJourCamera() {
    let y; // hauteur visée par la caméra
    if (this.phase != "montee") { // pendant la montée
      y = 360; // sur la scène : hauteur fixe
    } else if (this.mode == "duo") { // en duo
      y = (this.cantatrice.y + this.detective.y) / 2 - 60; // milieu entre les deux
    } else {
      y = this.actif.y - 60; // en solo : on suit le héros actif
    }
    this.cible_camera.setPosition(640, y); // on déplace la cible
  }

  // Caméra de la Grande Scène : suit les personnages dans la tour
  creerCamera() {
    super.creerCamera(); // caméra du niveau 1 d'abord
    this.cible_camera.setPosition(640, this.dernierPalier - 100); // cible de la caméra au palier de reprise
    this.cameras.main.centerOn(640, this.dernierPalier - 100); // on commence directement au bon endroit
  }

  // ==========================================================================
  //  MOUVEMENT II : LA DANSE MACABRE (le combat)
  // ==========================================================================
  commencerMaestro() {
    this.phase = "maestro"; // passe en phase combat
    this.bpm = BPM_MAESTRO; // tempo du combat
    this.combo = 0; // combo remis à zéro
    this.texteCombo.setText(""); // texte du combo vidé
    this.trappe.unSens = false; // la trappe se referme : elle devient solide
    this.trappeLueur.destroy(); // on enlève la lueur de la trappe
    this.cameras.main.setBounds(0, 0, LARGEUR_MONDE, 720); // la caméra reste sur la scène
    // en reprise (ou si un héros est resté en bas), on pose tout le monde sur la scène
    this.persos.forEach((p, i) => { // les héros hors de la scène sont replacés
      if (p.body.enable && p.y > SOL_SCENE) { // seulement les vivants, qui sont tombés
        p.body.reset(560 + i * 160, SOL_SCENE - 40); // posés côte à côte sur la scène
      }
    });
    this.creerBalcons(); // les balcons du combat
    jouerMusique(this, "musique_niveau3_maestro", 0.5); // musique du combat
    this.texteMouvement.setText("II. LA DANSE MACABRE"); // titre du mouvement
    this.cadreVieMaestro.setVisible(true); // affiche le cadre de vie
    this.barreVieMaestro.setVisible(true); // et la barre de vie

    // Le Maestro descend des cintres
    this.maestro = this.physics.add.sprite(640, -120, "maestro_boss").setScale(MAESTRO.echelle).setDepth(8); // sprite du Maestro, hors écran en haut
    this.maestro.body.setAllowGravity(false); // il ne tombe pas (il vole)
    this.maestro.body.setSize(34, 50); // boîte de collision
    this.maestro.play("maestro_walk"); // animation de vol
    this.maestro.pv = MAESTRO.pv; // points de vie de départ
    this.maestro.faiblesse = Phaser.Math.Between(0, 2); // la note de son point faible
    this.maestro.reveleJusqua = 0; // réinitialisé
    this.maestro.pret = false; // il attaque seulement une fois arrivé
    this.tweens.add({ targets: this.maestro, y: MAESTRO.y, duration: 1800, ease: "Sine.easeOut", onComplete: () => (this.maestro.pret = true) }); // il descend en 1,8 s
    // son point faible : une lueur de couleur sur sa poitrine, visible seulement quand il est éclairé
    this.pointFaible = this.add.image(0, 0, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setScale(0.4).setDepth(9).setAlpha(0); // lueur du point faible
    this.anneauFaible = this.add.circle(0, 0, 16).setStrokeStyle(4, 0xffffff).setDepth(9).setAlpha(0); // anneau autour du point faible

    this.physics.add.overlap(this.maestro, this.groupe_ondes, (maestro, onde) => this.toucherMaestro(onde)); // toucher le Maestro : voir toucherMaestro
    this.majVieMaestro(); // affiche la barre au départ
    this.afficherBandeau("II. LA DANSE MACABRE", "Éclaire le Maestro avec la lampe pour trouver son POINT FAIBLE,\npuis touche-le avec l'onde de la MÊME couleur (HAUT + B pour chanter vers le haut)");
  }

  // Le cadre du bas : les commandes habituelles + un rappel court sur le tir maintenu
  texteCommandes() {
    return super.texteCommandes() + "\nMaintiens B pour tirer en continu"; // les commandes habituelles + rappel
  }

  // Un grand titre au centre de l'écran, qui s'efface tout seul
  afficherBandeau(titre, texte) {
    const fond = this.add.rectangle(0, 0, 900, 150, 0x0b1030, 0.9).setStrokeStyle(3, 0xf5d97a); // fond du bandeau
    const t1 = this.add.text(0, -36, titre, { fontFamily: POLICE, fontSize: "26pt", fontStyle: "bold", color: "#f5d97a", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5); // titre
    const t2 = this.add.text(0, 24, texte, { fontFamily: POLICE, fontSize: "13pt", color: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5); // texte
    const cadre = this.add.container(640, 330, [fond, t1, t2]).setScrollFactor(0).setDepth(150).setAlpha(0); // conteneur fixe, transparent au départ
    this.tweens.add({ targets: cadre, alpha: 1, duration: 400, hold: 3800, yoyo: true, onComplete: () => cadre.destroy() }); // apparaît, reste, puis disparaît
  }

  // Animation et comportement du Maestro à chaque image
  mettreAJourMaestro(temps) {
    const m = this.maestro;
    if (m.pret == false || m.pv <= 0) { // si pas prêt ou mort : rien
      return;
    }
    // il plane de gauche à droite en se balançant
    m.x = 640 + Math.sin(temps / 1700) * ((MAESTRO.xMax - MAESTRO.xMin) / 2); // vol de gauche à droite
    m.y = MAESTRO.y + Math.sin(temps / 450) * 14; // léger balancement vertical
    m.setFlipX(Math.cos(temps / 1700) < 0); // tourne vers le sens du vol

    // la lampe l'éclaire ? son point faible est révélé pour 4 s
    if (this.lampe.allumee == true) { // la lampe éclaire-t-elle le Maestro ?
      const f = this.calculerFaisceau(); // position du faisceau
      if (Phaser.Math.Distance.Between(f.cx, f.cy, m.x, m.y) < REGLAGES.lampe.rayon + 30) { // assez proche du faisceau
        this.reveler(); // point faible révélé
      }
    }
    const revele = temps < m.reveleJusqua; // encore révélé ?
    const couleur = NOTES[m.faiblesse].couleur; // couleur du point faible
    this.pointFaible.setPosition(m.x, m.y + 6).setTint(couleur).setAlpha(revele ? 0.9 : 0); // position et visibilité de la lueur
    this.anneauFaible.setPosition(m.x, m.y + 6).setStrokeStyle(4, couleur).setAlpha(revele ? 1 : 0); // anneau du point faible
    this.anneauFaible.setRadius(16 + Math.sin(temps / 90) * 3); // l'anneau pulse
    // scène éteinte : on ne voit le Maestro que dans la lumière
    if (this.sceneEteinte == true) {
      m.setAlpha(revele ? 1 : 0.12); // le Maestro se voit à peine
    }
  }

  // La lampe révèle le point faible du Maestro pendant quelques secondes
  reveler() {
    if (this.time.now > this.maestro.reveleJusqua) { // message seulement si pas déjà affiché
      this.afficherMessage("Point faible : " + NOTES[this.maestro.faiblesse].texte + " ! Chante cette note !", 2000); // message du point faible
    }
    this.maestro.reveleJusqua = this.time.now + MAESTRO.dureeRevelationMs; // la révélation dure 4 s
  }

  // Une onde (ou un éclat de lumière) touche le Maestro
  toucherMaestro(onde) {
    const m = this.maestro; // le Maestro
    const note = onde.note; // la note de l'onde
    onde.destroy(); // l'onde disparaît à l'impact
    if (m.pret == false || m.pv <= 0) { // trop tard ou déjà vaincu
      return;
    }
    if (this.time.now > m.reveleJusqua) { // la révélation est finie : il faut éclairer
      if (note == "lumiere") { // éclat du Détective
        this.reveler(); // un éclat dans le noir révèle seulement le Maestro
      } else {
        this.afficherMessage("Il faut d'abord trouver son point faible : éclaire-le !", 2000); // message
      }
      return;
    }
    // Un éclat du Détective blesse le Maestro comme une bonne note (il est révélé)
    if (note != "lumiere" && note != NOTES[m.faiblesse].nom) { // mauvaise note
      this.combo = 0; // combo remis à zéro
      this.texteCombo.setText(""); // texte du combo vidé
      this.afficherMessage("Fausse note ! Son point faible est " + NOTES[m.faiblesse].texte, 2000); // message d'erreur
      m.setTintFill(0x9a4dff); // teinte violette
      this.time.delayedCall(120, () => m.clearTint()); // remet la couleur
      return;
    }
    // touché !
    m.pv -= 1; // le Maestro perd 1 point de vie
    this.combo = Math.min(this.combo + 1, 8); // combo +1, max 8
    this.texteCombo.setText(this.combo > 1 ? "COMBO x" + this.combo : ""); // texte du combo
    this.ajouterPoints(POINTS.coup * this.combo, m.x, m.y - 60); // points
    this.cameras.main.shake(150, 0.006); // secousse
    m.play("maestro_hurt"); // animation de dégât
    m.once("animationcomplete", () => m.play("maestro_walk")); // retour à la marche
    m.faiblesse = (m.faiblesse + Phaser.Math.Between(1, 2)) % 3; // son point faible change de note
    this.majVieMaestro(); // met à jour la barre
    if (m.pv == Math.floor(MAESTRO.pv / 2)) { // à mi-vie : le noir
      this.eteindreLaScene(); // à mi-vie : le noir
    }
    if (m.pv <= 0) { // vaincu ?
      this.vaincreMaestro(); // fin du combat
    }
  }

  // Met à jour la barre de vie du Maestro
  majVieMaestro() {
    this.barreVieMaestro.setSize(300 * Math.max(0, this.maestro.pv) / MAESTRO.pv, 8); // la largeur suit les points de vie restants
  }

  // Le noir : les lumières s'éteignent à mi-vie du Maestro
  eteindreLaScene() {
    this.sceneEteinte = true; // marque la scène éteinte
    this.tweens.add({ targets: this.voileNoir, fillAlpha: 0.82, duration: 1200 }); // le voile devient noir
    this.afficherBandeau("LES LUMIÈRES S'ÉTEIGNENT…", "Le Maestro se cache dans l'ombre : seule la lampe peut le trouver !"); // bandeau d'explication
  }

  // ---- Les attaques du Maestro, toujours sur le temps ----
  battementMaestro() {
    const m = this.maestro; // le Maestro
    if (!m || m.pret == false || m.pv <= 0) { // rien à faire si pas prêt ou mort
      return;
    }
    const tousLes = this.sceneEteinte ? 5 : MAESTRO.attaqueTousLesTemps; // toutes les 5 attaques (noir) ou 6 (normal)
    if (this.battement % tousLes != 0) { // pas le bon temps : on sort
      return;
    }
    m.play("maestro_attack"); // il lève sa baguette
    m.once("animationcomplete", () => m.play("maestro_walk")); // retour à la marche après l'attaque
    // Deux attaques seulement : une petite volée, ou une pluie de notes avec un trou (les cristaux sont retirés)
    if (Phaser.Math.Between(1, 2) == 1) { // au hasard : une volée ou une pluie
      this.voleeDeNotes(); // 2 notes en éventail
    } else {
      this.pluieDeNotes(); // une rangée de notes
    }
  }

  // Une note de musique ennemie (violette), qui vit 5 secondes
  noteEnnemie(x, y, vx, vy) {
    const note = this.groupe_ondes_ennemies.create(x, y, "onde"); // crée une note violette
    note.setDepth(9).setScale(1.5).setTint(0xb066ff); // taille et couleur
    note.play("onde_mi"); // animation
    note.body.setSize(20, 20); // boîte de collision
    note.setVelocity(vx, vy); // vitesse donnée
    note.setRotation(Math.atan2(vy, vx)); // tourne dans le sens du mouvement
    note.finDeVie = this.time.now + 5000; // vit 5 s
  }

  // 3 notes en éventail vers le héros le plus proche
  voleeDeNotes() {
    const m = this.maestro; // le Maestro
    const cible = this.persoLePlusProche(m); // héros le plus proche
    const angle = Phaser.Math.Angle.Between(m.x, m.y, cible.x, cible.y); // direction vers lui
    [-0.2, 0.2].forEach((ecart) => { // deux notes seulement
      this.noteEnnemie(m.x, m.y + 30, Math.cos(angle + ecart) * 230, Math.sin(angle + ecart) * 230); // deux notes partent du Maestro, écartées de 0,2 rad
    });
  }

  // Une rangée de notes qui tombent, avec un trou pour passer
  pluieDeNotes() {
    const trou = Phaser.Math.Between(1, 3); // position du trou
    for (let i = 0; i < 5; i++) { // 5 places, dont 2 libres pour passer : il reste 3 notes
      if (i != trou && i != trou + 1) { // on saute les deux cases du trou
        this.noteEnnemie(120 + i * 200, 20, 0, 190); // une note qui tombe
      }
    }
  }

  // Un cristal détruit rapporte des points
  blesserCristal(cristal, note) {
    super.blesserCristal(cristal, note); // comportement normal du niveau 1
    if (cristal.mort == true && cristal.compte != true) { // si le cristal vient d'être détruit (une seule fois)
      cristal.compte = true; // on le marque comme compté
      this.ajouterPoints(POINTS.cristal, cristal.x, cristal.y - 30); // points
    }
  }

  // ---- Le Maestro est vaincu : la possession se brise, place au chant final ----
  vaincreMaestro() {
    const m = this.maestro; // le Maestro
    this.groupe_ondes_ennemies.clear(true, true); // efface les notes ennemies
    this.groupe_cristaux.getChildren().slice().forEach((c) => c.destroy()); // détruit les cristaux
    this.pointFaible.setAlpha(0); // cache la lueur du point faible
    this.anneauFaible.setAlpha(0); // cache l'anneau
    m.setAlpha(1); // le Maestro redevient net
    this.cameras.main.flash(500, 255, 255, 255); // flash blanc
    this.cameras.main.shake(600, 0.01); // forte secousse
    this.lampe.allumee = false; // la lampe s'éteint
    this.afficherBandeau("LA POSSESSION SE BRISE !", "Le Maestro lève sa baguette une dernière fois…"); // bandeau de victoire
    this.tweens.add({ targets: m, x: 640, y: SOL_SCENE - 70, duration: 1500, ease: "Sine.easeInOut" }); // le Maestro descend au centre
    this.time.delayedCall(3000, () => this.commencerChant()); // 3 s plus tard : le chant
  }

  // ==========================================================================
  //  MOUVEMENT III : LE CHANT FINAL
  // ==========================================================================
  commencerChant() {
    if (this.fini == true) { // si le niveau est déjà fini, on ne commence pas
      return;
    }
    this.phase = "chant"; // phase chant
    this.physics.pause(); // les héros ne bougent plus : ils chantent
    this.faisceau.clear(); // efface le faisceau
    this.halo.setVisible(false); // cache le halo de la lampe
    this.haloProche.setVisible(false); // cache le halo proche
    this.texteMouvement.setText("III. LE CHANT FINAL"); // titre
    this.fleche.setVisible(false); // cache la flèche
    this.cadreVieMaestro.setVisible(false); // cache le cadre de vie
    this.barreVieMaestro.setVisible(false); // cache la barre de vie
    this.panneauCommandes.setVisible(false); // cache les commandes (le chant a ses propres touches)
    this.points.forEach((p) => p.setVisible(false)); // cache le métronome
    this.tweens.add({ targets: this.voileNoir, fillAlpha: 0.85, duration: 600 }); // assombrit la scène

    // les héros se placent de chaque côté du Maestro, le Maestro dirige au centre
    const cantatrice = this.cantatrice; // la Cantatrice
    const detective = this.detective; // le Détective
    [cantatrice, detective].forEach((p) => { // pour chacun des deux
      p.setVisible(true).setAlpha(1).setDepth(12); // visible, au premier plan
      p.anims.play(p.nom + "_idle"); // animation d'attente
    });
    cantatrice.setPosition(470, SOL_SCENE - 32).setFlipX(false); // la Cantatrice à gauche
    detective.setPosition(810, SOL_SCENE - 32).setFlipX(true); // le Détective à droite, tourné vers le centre
    this.maestro.setDepth(11).setTint(0x9a7bff).setPosition(640, SOL_SCENE - 70); // le Maestro au centre, teinté
    this.maestro.play("maestro_idle"); // animation d'attente du Maestro

    // la portée : 3 lignes (Do, Mi, Sol), la ligne de frappe et les touches
    this.chant = { notes: [], justes: 0, total: 0, parfaits: 0, rates: 0, debut: this.time.now, prochaine: 0, fin: false }; // état du chant
    this.elementsChant = []; // tout ce qu'on dessine pour le chant (effacé avant le salut)
    const g = this.add.graphics().setDepth(40); // graphique de la portée
    this.elementsChant.push(g); // ajouté à la liste à effacer
    g.fillStyle(0x05081a, 0.85).fillRoundedRect(60, CHANT.lignes[0] - 50, 1160, CHANT.lignes[2] - CHANT.lignes[0] + 100, 16); // fond sombre de la portée
    CHANT.lignes.forEach((y, i) => { // pour chacune des 3 lignes
      g.lineStyle(3, NOTES[i].couleur, 0.7).lineBetween(90, y, 1190, y); // trait de la ligne
      this.elementsChant.push(this.add.circle(CHANT.xFrappe, y, 24).setStrokeStyle(4, NOTES[i].couleur).setDepth(41)); // cercle de frappe
      const bouton = ["A", "B", "C"][i]; // touche associée à la ligne
      this.elementsChant.push(this.add.text(130, y - 20, bouton + " · " + NOTES[i].texte, { fontFamily: POLICE, fontSize: "14pt", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5).setDepth(41)); // texte du bouton
    });
    this.texteJugement = this.add.text(CHANT.xFrappe, CHANT.lignes[0] - 75, "", { fontFamily: POLICE, fontSize: "18pt", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setDepth(42); // texte du jugement (PARFAIT, BIEN...)
    // les 12 feux de la rampe, au bord de la scène, éteints au départ : chaque note juste en rallume
    this.projecteurs = [];
    for (let i = 0; i < 12; i++) {
      this.projecteurs.push(this.add.image(150 + i * 89, SOL_SCENE + 14, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd98a).setScale(0.22).setAlpha(0.08).setDepth(13)); // feu de la rampe, éteint au départ
    }
    // la partition des 3 fragments, au-dessus de la scène
    this.elementsChant.push(this.add.image(640, 150, "img_partition").setDisplaySize(90, 90).setDepth(42).setAlpha(0.9)); // image de la partition

    this.partitionChant = this.creerPartitionChant(); // calcule les notes du chant
    this.touchesChant = this.cantatrice.touches.concat(this.detective.touches).filter((t, i, liste) => liste.indexOf(t) == i); // toutes les touches des deux joueurs
    jouerMusique(this, "musique_niveau3_final", 0.6); // musique du chant final
    this.afficherBandeau("III. LE CHANT FINAL", "Chante les notes quand elles passent dans les cercles :\nA = Do · B = Mi · C = Sol"); // bandeau de consigne
  }

  // La liste des notes à chanter : [instant en ms, ligne]. Une note toutes les 0,5 s, puis plus vite.
  creerPartitionChant() { // tableau vide
    const partition = []; // liste des notes du chant
    let t = 4500; // on laisse le temps de lire la consigne
    let ligne = 1; // ligne de la note précédente
    while (t < CHANT.dureeMs - 4000) { // tant qu'il reste assez de temps (4 s avant la fin)
      ligne = (ligne + Phaser.Math.Between(1, 2)) % 3; // on change de ligne (jamais 2 fois la même)
      partition.push([t, ligne]); // ajoute la note
      const vite = t > CHANT.dureeMs * 0.55; // deuxième moitié : plus rapide
      t += vite ? Phaser.Math.RND.pick([300, 400, 400]) : Phaser.Math.RND.pick([500, 500, 600]); // intervalle au hasard
    }
    return partition;
  }

  // Déroulé du chant final, à chaque image
  mettreAJourChant(temps) {
    const c = this.chant; // le chant en cours
    const ecoule = temps - c.debut; // temps écoulé depuis le début du chant
    const avance = (1300 - CHANT.xFrappe) / CHANT.vitesse * 1000; // une note met ce temps à arriver
    // faire apparaître les notes à l'avance, pour qu'elles arrivent pile à l'heure
    while (c.prochaine < this.partitionChant.length && this.partitionChant[c.prochaine][0] - avance <= ecoule) { // tant qu'il y a une note à faire apparaître
      const [instant, ligne] = this.partitionChant[c.prochaine]; // instant et ligne de la note
      const note = this.add.circle(1300, CHANT.lignes[ligne], 18, NOTES[ligne].couleur).setStrokeStyle(3, 0xffffff).setDepth(41); // crée un cercle coloré à droite
      note.instant = instant; // instant de la note
      note.ligne = ligne; // ligne de la note
      c.notes.push(note); // ajoute à la liste des notes à l'écran
      c.total += 1; // compte les notes
      c.prochaine += 1; // note suivante dans la partition
    }
    // les notes avancent vers la ligne de frappe ; trop tard = ratée
    c.notes.forEach((note) => { // pour chaque note à l'écran
      note.x = CHANT.xFrappe + ((note.instant - ecoule) / 1000) * CHANT.vitesse; // avance selon le temps écoulé
      if (note.jouee != true && ecoule - note.instant > CHANT.bienMs) { // en retard : ratée
        note.jouee = true; // marquée jouée
        c.rates += 1; // compte la note ratée
        this.juger("RATÉ", "#ff7b7b"); // affiche RATÉ
        this.tweens.add({ targets: note, alpha: 0, duration: 200 }); // la note disparaît en fondu
      }
    });
    c.notes = c.notes.filter((note) => note.x > 40 || note.jouee != true); // retire les notes sorties de l'écran

    // les boutons A, B, C chantent Do, Mi, Sol
    ["A", "B", "C"].forEach((bouton, ligne) => { // pour chaque bouton A, B, C
      if (this.touchesChant.some((t) => Phaser.Input.Keyboard.JustDown(t[bouton]))) { // si cette touche vient d'être pressée
        this.chanter(ligne, ecoule); // chante la note de cette ligne
      }
    });

    if (c.fin == false && ecoule > CHANT.dureeMs - 1500) { // fin du chant (1,5 s avant la fin)
      c.fin = true; // marque la fin
      this.finirChant(); // lance la fin
    }
  }

  // La Cantatrice chante une note du chant final
  chanter(ligne, ecoule) {
    const c = this.chant; // le chant en cours
    this.cantatrice.anims.play("cantatrice_shoot"); // animation de chant
    // la note la plus proche, sur cette ligne, pas encore chantée
    const note = c.notes.filter((n) => n.ligne == ligne && n.jouee != true).sort((a, b) => Math.abs(a.instant - ecoule) - Math.abs(b.instant - ecoule))[0]; // la note de cette ligne la plus proche du moment
    if (note === undefined || Math.abs(note.instant - ecoule) > CHANT.bienMs) { // hors fenêtre : rien
      return; // trop tôt : on ne compte rien
    }
    note.jouee = true; // marquée jouée
    const parfait = Math.abs(note.instant - ecoule) <= CHANT.parfaitMs; // parfait si très proche
    c.justes += 1; // compte les notes justes
    if (parfait) { // une note parfaite
      c.parfaits += 1; // compte les parfaites
    }
    this.ajouterPoints(parfait ? POINTS.parfait : POINTS.bien); // points
    this.juger(parfait ? "PARFAIT !" : "BIEN", parfait ? "#f5d97a" : "#9dffb0"); // affiche le jugement
    this.tweens.add({ targets: note, scale: 2, alpha: 0, duration: 250 }); // la note grossit et disparaît
    // l'opéra se rallume petit à petit, et la possession quitte le Maestro
    const progression = c.justes / Math.max(1, this.partitionChant.length); // avancement du chant (0 à 1)
    const allumes = Math.round(progression * this.projecteurs.length); // nombre de feux à allumer
    this.projecteurs.forEach((p, i) => p.setAlpha(i < allumes ? 0.9 : 0.08)); // allume les feux
    this.voileNoir.setFillStyle(0x000000, 0.85 * (1 - progression)); // le voile s'éclaircit
    const teinte = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x9a7bff), Phaser.Display.Color.ValueToColor(0xffffff), 100, Math.round(progression * 100)); // couleur : du violet vers le blanc
    this.maestro.setTint(Phaser.Display.Color.GetColor(teinte.r, teinte.g, teinte.b)); // teinte le Maestro
  }

  // Affiche le jugement d'une note (parfait, raté…)
  juger(texte, couleur) {
    this.texteJugement.setText(texte).setColor(couleur).setAlpha(1).setScale(1.2); // texte, couleur, puis grand et normal
    this.tweens.add({ targets: this.texteJugement, scale: 1, alpha: 0, duration: 600, delay: 150 }); // le texte disparaît en fondu
  }

  // ---- La fin : écran blanc, silence, rideau, applaudissements, salut ----
  finirChant() {
    this.cameras.main.flash(900, 255, 255, 255); // flash blanc
    arreterMusique(this); // coupe la musique
    this.chant.notes.forEach((n) => n.destroy()); // efface les notes
    this.elementsChant.forEach((e) => e.destroy()); // efface les éléments du chant
    this.texteJugement.destroy(); // efface le jugement
    this.texteCombo.setText(""); // vide le combo
    this.texteMouvement.setText("LE SALUT"); // titre LE SALUT
    this.voileNoir.setFillStyle(0x000000, 0); // le voile disparaît
    this.maestro.clearTint(); // le Maestro perd sa teinte
    // 1 seconde de silence… puis le rideau tombe
    this.time.delayedCall(1200, () => this.fermerRideau()); // ouvre le rideau
  }

  // Le rideau se ferme à la fin du chant
  fermerRideau() {
    const rideau = (x) => {
      const g = this.add.graphics().setDepth(90); // calque du rideau
      g.fillStyle(0x6e0f1c).fillRect(0, 0, 640, 720); // fond velours
      g.fillStyle(0x8f1726); // couleur des plis
      for (let i = 0; i < 640; i += 40) { // boucle sur les plis
        g.fillRect(i + 14, 0, 10, 720); // les plis
      }
      g.fillStyle(0xe6bf5c).fillRect(0, 690, 640, 8); // la frange dorée
      g.x = x; // position du rideau
      return g; // renvoyé
    };
    this.rideauGauche = rideau(-640); // rideau gauche hors écran
    this.rideauDroit = rideau(1280); // rideau droit hors écran
    this.tweens.add({ targets: this.rideauGauche, x: 0, duration: 900, ease: "Cubic.easeIn" }); // glisse vers le centre
    this.tweens.add({ // ce tween donne aussi le signal de fin
      targets: this.rideauDroit, // cible
      x: 640, // position finale
      duration: 900, // durée
      ease: "Cubic.easeIn", // accélère à la fin
      onComplete: () => {
        if (this.cache.audio.exists("son_applaudissements")) { // si le son existe
          this.sound.play("son_applaudissements", { volume: 0.7 }); // applaudissements
        }
        this.time.delayedCall(1600, () => this.saluer()); // salut après 1,6 s
      }
    });
  }

  saluer() {
    // le rideau se rouvre sur l'opéra tout illuminé
    this.projecteurs.forEach((p) => p.setAlpha(0.9)); // projecteurs allumés
    this.tweens.add({ targets: this.rideauGauche, x: -640, duration: 1100, ease: "Cubic.easeOut" }); // ouvre le rideau gauche
    this.tweens.add({ targets: this.rideauDroit, x: 1280, duration: 1100, ease: "Cubic.easeOut" }); // ouvre le rideau droit
    this.phase = "salut"; // phase salut
    this.fleche.setVisible(false); // cache la flèche
    this.groupe_scene.getChildren().forEach((marche) => { // pour chaque marche
      if (marche.y < SOL_SCENE) { // marches du combat (au-dessus du plancher)
        marche.dessin.setVisible(false); // les balcons du combat disparaissent
      }
    });
    // les trois saluent ensemble : la Cantatrice, le Maestro libéré, le Détective
    this.cantatrice.setPosition(520, SOL_SCENE - 32).setFlipX(false); // la Cantatrice
    this.detective.setPosition(760, SOL_SCENE - 32).setFlipX(false); // le Détective
    this.maestro.setPosition(640, SOL_SCENE - 70).play("maestro_idle"); // le Maestro
    [this.cantatrice, this.maestro, this.detective].forEach((p, i) => { // chacun saute à son tour
      this.tweens.add({ targets: p, y: p.y + 10, angle: 4, duration: 350, yoyo: true, repeat: 2, delay: 1300 + i * 150, hold: 300 }); // saut joyeux, retardé
    });

    // le bilan
    const c = this.chant; // chant en cours
    const justesse = c.total > 0 ? c.justes / c.total : 0; // pourcentage de notes justes
    const bonusCoeurs = this.vies * POINTS.coeur; // bonus des cœurs
    this.ajouterPoints(bonusCoeurs); // ajoute au score
    let rang = "SIFFLETS…"; // rang par défaut
    if (justesse >= 0.85 && this.vies >= this.viesMax / 2) { // ovation : très juste et au moins la moitié des cœurs
      rang = "OVATION !";
    } else if (justesse >= 0.65) { // bravo
      rang = "BRAVO !";
    } else if (justesse >= 0.4) { // applaudissements
      rang = "APPLAUDISSEMENTS";
    }
    let record = 0; // record (0 si pas de stockage)
    try {
      record = Number(window.localStorage.getItem("maestro_niveau3_record")) || 0; // lit le record sauvegardé
      if (this.score > record) { // nouveau record ?
        window.localStorage.setItem("maestro_niveau3_record", String(this.score)); // sauvegarde le record
      }
    } catch (e) {
      record = 0; // pas de stockage : tant pis pour le record
    }

    // les bouquets : un par tranche de 400 points
    const bouquets = Math.min(40, Math.floor(this.score / 400)); // un bouquet par 400 points, 40 au maximum
    for (let i = 0; i < bouquets; i++) {
      const fleur = this.add.image(Phaser.Math.Between(200, 1080), -30, "n3_fleur").setDepth(70).setScale(1.6).setAngle(Phaser.Math.Between(0, 360)); // une fleur au-dessus de la scène, hors écran
      fleur.setTint(Phaser.Math.RND.pick([0xff5a7a, 0xffd24a, 0xff8ad8, 0xffffff, 0xff4040])); // une couleur au hasard
      this.tweens.add({ targets: fleur, y: Phaser.Math.Between(SOL_SCENE - 10, SOL_SCENE + 10), angle: "+=" + Phaser.Math.Between(180, 540), duration: Phaser.Math.Between(900, 1600), delay: 1500 + i * 70, ease: "Quad.easeIn" }); // chute de la fleur (retardée)
    }

    const style = (taille, couleur) => ({ fontFamily: POLICE, fontSize: taille, fontStyle: "bold", color: couleur, align: "center", stroke: "#000000", strokeThickness: 6 }); // style des textes
    const textes = [
      this.add.text(640, 120, rang, style("44pt", "#f5d97a")).setOrigin(0.5), // titre du rang
      this.add.text(640, 190, "Le Maestro est libéré : les lumières se rallument sur l'opéra.", style("15pt", "#ffffff")).setOrigin(0.5), // phrase de victoire
      this.add
        .text(640, 250, "Chant : " + Math.round(justesse * 100) + " % de notes justes (" + c.parfaits + " parfaites)   ·   Cœurs : +" + bonusCoeurs + "\nSCORE : " + this.score + (this.score > record ? "   —   NOUVEAU RECORD !" : "   (record : " + record + ")"), style("16pt", "#dfe6ff")) // bilan : justesse, cœurs, score et record
        .setOrigin(0.5),
      this.add.text(640, 690, "A / Entrée : continuer", style("14pt", "#cfd6f5")).setOrigin(0.5) // consigne pour continuer
    ];
    textes.forEach((t, i) => { // fait apparaître les textes l'un après l'autre
      t.setDepth(80).setAlpha(0); // profondeur et transparence de départ
      this.tweens.add({ targets: t, alpha: 1, duration: 600, delay: 2500 + i * 300 }); // fondu avec retard
    });
    this.salutPret = this.time.now + 3500; // le salut est prêt dans 3,5 s
    this.texteScore.setText(String(this.score)); // met à jour le score affiché
  }

  mettreAJourSalut() {
    if (this.time.now < this.salutPret || this.fini == true) {
      return;
    }
    const touches = this.cantatrice.touches.concat(this.detective.touches); // toutes les touches
    const entree = this.input.keyboard.addKey("ENTER"); // touche Entrée
    if (Phaser.Input.Keyboard.JustDown(entree) || touches.some((t) => Phaser.Input.Keyboard.JustDown(t.A))) { // Entrée ou A : continuer
      this.fini = true; // fin du niveau
      this.cameras.main.fadeOut(900, 0, 0, 0); // fondu au noir
      this.cameras.main.once("camerafadeoutcomplete", () => this.terminerNiveau()); // l'écran « Niveau terminé » (niveau 1)
    }
  }

  // ==========================================================================
  //  PERDRE : on recommence tout de suite le mouvement en cours (pas de long écran Game Over)
  // ==========================================================================
  perdre() {
    this.fini = true; // état fini
    this.persos.forEach((perso) => { // pour chaque personnage
      perso.setVelocityX(0); // arrête la marche
      perso.setAlpha(1); // visible
      if (perso.body.enable) { // si encore vivant
        perso.anims.play(perso.nom + "_death"); // animation de mort
      }
    });
    this.faisceau.clear(); // efface le faisceau
    this.halo.setVisible(false); // cache le halo
    this.haloProche.setVisible(false); // cache le halo proche
    this.time.delayedCall(1200, () => {
      const fond = this.add.rectangle(0, 0, 760, 200, 0x0b1030, 0.94).setStrokeStyle(4, 0xf5d97a); // fond de l'écran de perte
      const titre = this.add.text(0, -50, this.phase == "maestro" ? "LE MAESTRO L'EMPORTE…" : "TU AS CHUTÉ…", { fontFamily: POLICE, fontSize: "26pt", fontStyle: "bold", color: "#f5d97a", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5); // titre selon la phase
      const choix = this.add.text(0, 30, "A / Entrée : recommencer " + (this.phase == "maestro" ? "le combat" : "au dernier balcon") + "\nD : retourner au lobby", { fontFamily: POLICE, fontSize: "15pt", color: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5); // choix offerts
      this.panneauReessayer = this.add.container(640, 330, [fond, titre, choix]).setScrollFactor(0).setDepth(160); // écran de réessai, au-dessus de tout
    });
  }

  gererReessayer() {
    const touches = this.cantatrice.touches.concat(this.detective.touches); // toutes les touches
    const entree = this.input.keyboard.addKey("ENTER"); // Entrée
    if (Phaser.Input.Keyboard.JustDown(entree) || touches.some((t) => Phaser.Input.Keyboard.JustDown(t.A))) {
      const reprise = this.phase == "maestro" ? { phase: "maestro", palier: PALIERS[PALIERS.length - 1] } : { phase: "montee", palier: this.dernierPalier }; // reprise : combat ou dernier balcon
      this.scene.restart({ reprise: reprise }); // relance le niveau avec la reprise
    } else if (touches.some((t) => Phaser.Input.Keyboard.JustDown(t.D))) {
      this.scene.start("lobby"); // D : retour au lobby
    }
  }
}
