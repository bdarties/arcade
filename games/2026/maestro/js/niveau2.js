// ============================================================================
//  js/niveau2.js — NIVEAU 2 : LES OMBRES CHINOISES (carte Tiled « map2maestro »)
//
//  Ce niveau « hérite » du niveau 1 (class niveau2 extends niveau1) : il reprend TOUTES ses
//  mécaniques sans les recopier — les deux héros, la lampe, les ondes Do / Mi / Sol, les cristaux,
//  les cœurs, la caméra, les échelles, le mode solo et duo. Il ne redéfinit que ce qui change :
//  la carte, les objets à ramasser et les textes.
//
//  OBJECTIF : ramasser 3 LAMPES (il y en a 7 sur le chemin), puis rejoindre la PORTE en haut à droite.
//
//  - Les plateformes et les échelles sont lues dans la carte Tiled (propriétés estSolide / estEchelle).
//  - Des CRISTAUX colorés gardent le chemin : il faut tirer la note de la même couleur (Cantatrice).
//  - Dans la ZONE SOMBRE, des passerelles fantômes mènent à une lampe BONUS (+1 cœur) :
//    le Détective doit les éclairer avec sa lampe.
// ============================================================================

import niveau1 from "./niveau1.js";

const LARGEUR_MONDE = 2176; // 68 tuiles de 32 px
const HAUTEUR_MONDE = 736; // 23 tuiles de 32 px
const TAILLE_TUILE = 32;
const LAMPES_REQUISES = 3; // lampes à ramasser pour ouvrir la porte

// Positions [x, y] des 7 lampes : 4 sur la route du haut, 3 sur la route du bas
const POSITIONS_LAMPES = [
  [780, 258], [1070, 258], [1350, 226], [1620, 258], // route du haut
  [1085, 514], [1230, 418], [1620, 514] // route du bas
];

// La lampe bonus, tout en haut, et les deux passerelles fantômes qui y mènent (x, y = coin haut gauche)
const LAMPE_BONUS = { x: 1150, y: 40 };
const PASSERELLES = [
  { x: 1060, y: 220, width: 64, height: 16 },
  { x: 1120, y: 110, width: 64, height: 16 }
];
const ZONE_SOMBRE = { x: 1000, y: 0, largeur: 300, hauteur: 260 };

// Cristaux colorés : note 0 = Do (rouge), 1 = Mi (bleu), 2 = Sol (doré)
const CRISTAUX = [
  { x: 760, y: 190, note: 0 },
  { x: 1180, y: 400, note: 1 },
  { x: 1700, y: 220, note: 2 }
];

// Les échelles de la carte (2 tuiles de large chacune) : x = milieu, haut / bas = hauteur des pieds en haut et en bas
const ECHELLES = [
  { centreX: 64, haut: 384, bas: 640 }, // à gauche, du sol à la plateforme du départ
  { centreX: 2048, haut: 288, bas: 544 } // à droite, vers la porte
];
// Petits paliers invisibles au sommet des échelles : le haut de l'échelle n'est pas pile sous une plateforme
const PALIERS = [
  { x: 32, y: 384, width: 64, height: 16 },
  { x: 1984, y: 288, width: 112, height: 16 }
];

const DEPART_J1 = { x: 120, y: 640 }; // y = hauteur du sol
const DEPART_J2 = { x: 170, y: 640 };
const PORTE = { x: 1836, solY: 288 }; // la porte se pose sur la plateforme d'arrivée
const LIGNE_DE_CHUTE = 720; // sous cette hauteur : on est tombé dans une fosse

export default class niveau2 extends niveau1 {
  constructor() {
    super("niveau2"); // la clé de la scène
  }

  // --------------------------------------------------------------------------
  //  PRELOAD : le fond, l'image des tuiles et la carte
  // --------------------------------------------------------------------------
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("fond_theatre", "./assets/map2_sombre.jpg");
    this.load.image("tuiles_theatre", "./assets/tilesetmap2.png");
    this.load.tilemapTiledJSON("carte_theatre", "./assets/map2maestro.json");
  }

  // Ce qui change par rapport au niveau 1 (voir definirNiveau dans niveau1.js)
  definirNiveau() {
    this.largeurMonde = LARGEUR_MONDE;
    this.hauteurMonde = HAUTEUR_MONDE;
    this.couleurFond = 0x05070f;
    this.listeTubas = []; // pas de Tuba dans ce niveau
    this.listeCristaux = CRISTAUX;
    this.messageVictoire = "Niveau 2 terminé ! Retour au lobby...";
    this.niveauSuivant = "lobby";
    this.objectif = "OBJECTIF : ramasse " + LAMPES_REQUISES + " lampes (il y en a 7 sur le chemin),\npuis rejoins la porte en haut à droite";
    this.lampesRamassees = 0;
  }

  // --------------------------------------------------------------------------
  //  La carte : décor (calques de tuiles), puis les zones solides, les échelles, les passerelles
  // --------------------------------------------------------------------------
  creerCarte() {
    this.groupe_plateformes = this.physics.add.staticGroup(); // plateformes solides
    this.groupe_fantomes = this.physics.add.staticGroup(); // passerelles fantômes
    this.groupe_murs = this.physics.add.staticGroup(); // (pas de mur dans ce niveau, mais le niveau 1 en a besoin)
    this.avecTuilesPlateformes = false; // les passerelles fantômes utilisent le dessin de secours

    this.add.image(0, 0, "fond_theatre").setOrigin(0, 0).setDisplaySize(LARGEUR_MONDE, HAUTEUR_MONDE).setDepth(0);

    // Les calques, du plus loin au plus proche : les noms doivent être identiques à ceux de Tiled
    const carte = this.add.tilemap("carte_theatre");
    const tuiles = carte.addTilesetImage("tileset_maestro", "tuiles_theatre");
    const noms = [
      "calque_background",
      "calque_background2", // contient les échelles
      "calque_background2_bis",
      "Calque_deco",
      "Calque_deco_bis",
      "Calque_deco_ter",
      "calque_plateformes"
    ];
    noms.forEach((nom, i) => carte.createLayer(nom, tuiles).setDepth(1 + i * 0.5));

    this.creerSolidesDepuisLesTuiles(carte);
    PALIERS.forEach((palier) => this.ajouterPlateforme(palier));
    this.echelles = ECHELLES;

    // Zone sombre + passerelles fantômes qui mènent à la lampe bonus
    this.add
      .rectangle(ZONE_SOMBRE.x, ZONE_SOMBRE.y, ZONE_SOMBRE.largeur, ZONE_SOMBRE.hauteur, 0x000008, 0.55)
      .setOrigin(0, 0)
      .setDepth(4);
    PASSERELLES.forEach((passerelle) => this.ajouterFantome(passerelle));

    // Ce que le niveau 1 attend de la carte
    this.departs = { j1: DEPART_J1, j2: DEPART_J2 };
    this.yChute = LIGNE_DE_CHUTE;

    // Panneaux d'indication
    this.ajouterIndice(250, 540, "Monte à l'échelle (haut)");
    this.ajouterIndice(760, 120, "Cristaux colorés !\nChoisis la note de la même couleur (P) et tire (O)");
    this.ajouterIndice(1150, 330, "Zone sombre : le Détective éclaire les passerelles (T)\npour atteindre une lampe BONUS (+1 cœur)");
    this.ajouterIndice(1840, 110, "La porte s'ouvre quand tu as " + LAMPES_REQUISES + " lampes");
  }

  // Les tuiles marquées « estSolide » dans Tiled deviennent des rectangles invisibles solides.
  // On regroupe les tuiles voisines (d'abord en lignes, puis les lignes identiques empilées) pour en avoir peu.
  creerSolidesDepuisLesTuiles(carte) {
    const calque = carte.getLayer("calque_plateformes");
    const estSolide = (ligne, colonne) => {
      const tuile = colonne < carte.width ? calque.data[ligne][colonne] : null;
      return tuile != null && tuile.index != -1 && tuile.properties.estSolide == true;
    };

    // 1) les suites de tuiles solides sur chaque ligne
    const suites = [];
    for (let ligne = 0; ligne < carte.height; ligne++) {
      let debut = -1;
      for (let colonne = 0; colonne <= carte.width; colonne++) {
        if (estSolide(ligne, colonne) == true && debut == -1) {
          debut = colonne;
        } else if (estSolide(ligne, colonne) == false && debut != -1) {
          suites.push({ ligne: ligne, debut: debut, fin: colonne - 1 });
          debut = -1;
        }
      }
    }

    // 2) deux suites l'une sous l'autre, de mêmes colonnes, forment un seul bloc
    const blocs = [];
    suites.forEach((suite) => {
      const bloc = blocs.find((b) => b.debut == suite.debut && b.fin == suite.fin && b.ligneFin == suite.ligne - 1);
      if (bloc !== undefined) {
        bloc.ligneFin = suite.ligne;
      } else {
        blocs.push({ debut: suite.debut, fin: suite.fin, ligneDebut: suite.ligne, ligneFin: suite.ligne });
      }
    });

    blocs.forEach((b) => {
      this.ajouterPlateforme({
        x: b.debut * TAILLE_TUILE,
        y: b.ligneDebut * TAILLE_TUILE,
        width: (b.fin - b.debut + 1) * TAILLE_TUILE,
        height: (b.ligneFin - b.ligneDebut + 1) * TAILLE_TUILE
      });
    });
  }

  // Une plateforme = un rectangle invisible avec un corps statique (le décor est déjà dessiné par les tuiles)
  ajouterPlateforme(objet) {
    const zone = this.add.zone(objet.x + objet.width / 2, objet.y + objet.height / 2, objet.width, objet.height);
    this.groupe_plateformes.add(zone);
  }

  // --------------------------------------------------------------------------
  //  Objets : les lampes à ramasser et la porte de sortie
  // --------------------------------------------------------------------------
  creerObjets() {
    // Pas d'image de lampe : on en dessine une (graphics + generateTexture fabriquent une vraie texture)
    if (this.textures.exists("img_lampe_theatre") == false) {
      const dessin = this.make.graphics({ add: false });
      dessin.fillStyle(0xff9a1f).fillRect(6, 18, 8, 7); // le pied
      dessin.fillStyle(0xffd24a).fillCircle(10, 10, 9); // la flamme
      dessin.fillStyle(0xffffff).fillCircle(8, 8, 3); // un reflet
      dessin.generateTexture("img_lampe_theatre", 20, 26);
      dessin.destroy();
    }

    this.groupe_lampes = this.physics.add.group({ allowGravity: false });
    POSITIONS_LAMPES.forEach((position) => this.ajouterLampe(position[0], position[1], false));
    this.ajouterLampe(LAMPE_BONUS.x, LAMPE_BONUS.y, true);

    // La porte de sortie (même image que le niveau 1), fermée au début
    this.porte = this.physics.add.staticSprite(PORTE.x, PORTE.solY - 60, "porte_sortie", 0);
    this.porte.setDepth(3);
    this.porteOuverte = false;
  }

  ajouterLampe(x, y, bonus) {
    const lampe = this.groupe_lampes.create(x, y, "img_lampe_theatre");
    lampe.setDepth(6);
    lampe.bonus = bonus;
    if (bonus == true) {
      lampe.setTint(0x9fd8ff).setScale(1.3); // la lampe bonus est bleutée et plus grosse
    }
    // elle flotte doucement
    this.tweens.add({ targets: lampe, y: y - 8, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  // Ramasser les lampes, franchir la porte
  collisionsObjets() {
    this.physics.add.overlap(this.persos, this.groupe_lampes, this.ramasserLampe, null, this);
    this.physics.add.overlap(this.persos, this.porte, this.franchirPorte, null, this);
  }

  ramasserLampe(perso, lampe) {
    lampe.disableBody(true, true); // la lampe disparaît

    if (lampe.bonus == true) {
      // la lampe de l'ombre rend un cœur (sans dépasser le maximum)
      this.vies = Math.min(this.vies + 1, this.viesMax);
      this.majCoeurs();
      this.afficherMessage("Lampe de l'ombre ! +1 cœur", 3000);
      return;
    }

    this.lampesRamassees += 1;
    this.texteFragment.setText(Math.min(this.lampesRamassees, LAMPES_REQUISES) + " / " + LAMPES_REQUISES);
    if (this.lampesRamassees == LAMPES_REQUISES) {
      this.porteOuverte = true;
      this.porte.anims.play("porte_ouvre"); // la porte s'ouvre
      this.iconeFragment.clearTint();
      this.afficherMessage("Assez de lampes ! La porte est ouverte, rejoins-la en haut à droite.", 4000);
    } else if (this.lampesRamassees < LAMPES_REQUISES) {
      this.afficherMessage("Lampe " + this.lampesRamassees + " / " + LAMPES_REQUISES, 1500);
    }
  }

  // Devant la porte : si elle est fermée on explique pourquoi, sinon le niveau est gagné
  franchirPorte() {
    if (this.porteOuverte == false) {
      if (this.time.now > (this.prochaineAlertePorte || 0)) {
        this.afficherMessage("Il te faut " + LAMPES_REQUISES + " lampes pour ouvrir la porte !", 2000);
        this.prochaineAlertePorte = this.time.now + 2500; // on ne répète pas le message à chaque image
      }
      return;
    }
    super.franchirPorte();
  }

  // --------------------------------------------------------------------------
  //  Interface : on reprend celle du niveau 1, le compteur affiche les lampes à la place du parchemin
  // --------------------------------------------------------------------------
  creerInterface() {
    super.creerInterface();
    this.iconeFragment.setTexture("img_lampe_theatre").setDisplaySize(30, 40);
    this.texteFragment.setText("0 / " + LAMPES_REQUISES);
  }
}
