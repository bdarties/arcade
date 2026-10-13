// ============================================================================
//  js/niveau2.js — NIVEAU 2 : LES OMBRES CHINOISES (carte Tiled « map2maestro »)
//
//  Ce niveau « hérite » du niveau 1 (class niveau2 extends niveau1) : il reprend TOUTES ses
//  mécaniques sans les recopier — les deux héros, la lampe, les ondes Do / Mi / Sol, les cristaux,
//  les cœurs, la caméra, les échelles, le mode solo et duo. Il ne redéfinit que ce qui change :
//  la carte, les objets à ramasser et les textes.
//
//  OBJECTIF : ramasser 3 NOTES DE MUSIQUE (il y en a 7 sur le chemin) pour RÉVÉLER la PARTITION, la prendre,
//  puis franchir la PORTE en haut à droite.
//
//  - Les plateformes et les échelles sont lues dans la carte Tiled (propriétés estSolide / estEchelle).
//  - Des CRISTAUX colorés gardent le chemin : il faut tirer la note de la même couleur (Cantatrice).
//  - Dans la ZONE SOMBRE, des passerelles fantômes mènent à une note dorée BONUS (+1 cœur) :
//    le Détective doit les éclairer avec sa lampe.
// ============================================================================

import niveau1 from "./niveau1.js";

const LARGEUR_MONDE = 2176; // 68 tuiles de 32 px
const HAUTEUR_MONDE = 736; // 23 tuiles de 32 px
const TAILLE_TUILE = 32;
const NOTES_REQUISES = 3; // notes à ramasser pour révéler la partition
const COULEURS_NOTES = [0xff6b7d, 0x62b0ff, 0xffd24a]; // Do (rouge), Mi (bleu), Sol (doré) : comme les ondes et les cristaux
// La PARTITION à récupérer : posée sur la plateforme de la porte. Elle est visible dès le début mais « verrouillée ».
const PARTITION = { x: 1745, y: 236 };

// Positions [x, y] des 7 notes de musique : 4 sur la route du haut, 3 sur la route du bas
const POSITIONS_NOTES = [
  [730, 210], [1020, 258], [1300, 236], [1560, 258], // route du haut (au-dessus des plateformes mobiles)
  [1040, 514], [1260, 418], [1580, 500] // route du bas
];

// Pour AÉRER le niveau : des plateformes de la carte sont supprimées (elles étaient trop serrées), dont l'escalier ;
// une seule est remplacée, plus loin. (x, y, largeur, hauteur en pixels)
const PLATEFORMES_RETIREES = [
  { x: 256, y: 320, largeur: 160, hauteur: 64 }, // collée au palier de l'échelle
  { x: 448, y: 320, largeur: 160, hauteur: 160 } // l'escalier (5 petites marches)
];
const PLATEFORMES_AJOUTEES = [{ x: 380, y: 320, largeur: 160 }]; // x, y = coin haut gauche

// Plateformes MOBILES. Ce sont les VRAIES plateformes de la carte (même dessin) : on retire la plateforme fixe
// de la carte, on copie ses tuiles, et on les fait aller et venir grâce à un tween.
//  origine = coin haut gauche de la plateforme d'origine dans la carte (largeur × hauteur en pixels)
//  x = nouvelle position de départ · dx, dy = distance parcourue · dureeMs = temps d'un aller simple
const PLATEFORMES_MOBILES = [
  // route du haut
  { origine: { x: 640, y: 288 }, largeur: 160, hauteur: 64, x: 650, dx: 0, dy: -60, dureeMs: 2300 }, // monte et descend
  { origine: { x: 928, y: 288 }, largeur: 160, hauteur: 64, x: 880, dx: 120, dy: 0, dureeMs: 2400 }, // va et vient
  { origine: { x: 1216, y: 256 }, largeur: 160, hauteur: 64, x: 1216, dx: 0, dy: 70, dureeMs: 2500 }, // monte et descend
  { origine: { x: 1472, y: 288 }, largeur: 160, hauteur: 64, x: 1440, dx: 80, dy: 0, dureeMs: 2200 }, // va et vient
  // route du bas
  { origine: { x: 352, y: 544 }, largeur: 160, hauteur: 64, x: 352, dx: 0, dy: -50, dureeMs: 2400 }, // première marche : monte et descend
  { origine: { x: 640, y: 480 }, largeur: 160, hauteur: 64, x: 640, dx: 0, dy: -60, dureeMs: 2600 }, // monte et descend
  { origine: { x: 928, y: 544 }, largeur: 160, hauteur: 64, x: 928, dx: 70, dy: 0, dureeMs: 2600 }, // va et vient
  { origine: { x: 1216, y: 448 }, largeur: 160, hauteur: 64, x: 1216, dx: 80, dy: 0, dureeMs: 2300 }, // va et vient
  { origine: { x: 1472, y: 544 }, largeur: 160, hauteur: 64, x: 1500, dx: 0, dy: -70, dureeMs: 2000 } // monte et descend
];

// ---- La VOIE HAUTE : un parcours en hauteur, facultatif, qui mène à une note dorée bonus (+1 cœur) ----
//  1. un TAMBOUR posé sur une plateforme fait rebondir très haut (plus haut qu'un saut normal) ;
//  2. des plateformes fixes en hauteur ;
//  3. des PLANCHES FRAGILES entre elles : elles tombent peu après qu'on a marché dessus, puis reviennent.
const TAMBOURS = [{ x: 176, y: 384 }]; // x = centre, y = dessus de la plateforme sur laquelle il est posé
const FORCE_TAMBOUR = -760; // vitesse de rebond (un saut normal : -520)
const LARGEUR_PLATEFORME_HAUTE = 160;
const LARGEUR_PLANCHE = 96;
const PLATEFORMES_HAUTES = [
  { x: 300, y: 170 }, // x, y = coin haut gauche (160 px de large)
  { x: 832, y: 170 }
];
const PLANCHES_FRAGILES = [
  { x: 520, y: 170 },
  { x: 676, y: 170 }
]; // x, y = coin haut gauche (96 px de large)
const DELAI_CHUTE_MS = 500; // temps entre le premier contact et la chute de la planche
const DELAI_RETOUR_MS = 3500; // temps avant qu'elle revienne
const NOTE_VOIE_HAUTE = { x: 910, y: 130 };

// Ennemis en plus : ce niveau est plus dur que le niveau 1
const TUBAS = [
  { x: 600, solY: 640, xMin: 470, xMax: 780 }, // sur le sol de départ
  { x: 1900, solY: 640, xMin: 1760, xMax: 2000 } // sur le sol d'arrivée
];

// La note dorée bonus, tout en haut, et les deux passerelles fantômes qui y mènent (x, y = coin haut gauche)
const NOTE_BONUS = { x: 1150, y: 40 };
const PASSERELLES = [
  { x: 1060, y: 220, width: 64, height: 16 },
  { x: 1120, y: 110, width: 64, height: 16 }
];
const ZONE_SOMBRE = { x: 1000, y: 0, largeur: 300, hauteur: 260 };

// Cristaux colorés : note 0 = Do (rouge), 1 = Mi (bleu), 2 = Sol (doré)
const CRISTAUX = [
  { x: 600, y: 240, note: 0 },
  { x: 1180, y: 400, note: 1 },
  { x: 1700, y: 220, note: 2 },
  { x: 1420, y: 360, note: 0 } // un de plus au milieu du niveau
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

// Le DÉCOR : des éléments dessinés (planche d'images decor_niveau2.png) posés à la main dans le niveau.
//  nom = nom de l'image · x, y = position · ancre : "bas" (posé sur le sol, y = le bas de l'objet) ou "haut" (suspendu, y = le haut)
//  profondeur : plus c'est grand, plus c'est devant (les plateformes sont à 3, les héros à 10) · lueur : petite lumière orangée
const DECOR = [
  { nom: "paravent", x: 340, y: 640, ancre: "bas", profondeur: 0.7 },
  { nom: "pilier", x: 880, y: 640, ancre: "bas", profondeur: 0.9 },
  { nom: "pilier", x: 1700, y: 640, ancre: "bas", profondeur: 0.9 },
  { nom: "rideau", x: 100, y: 640, ancre: "bas", profondeur: 0.95 },
  { nom: "rideau", x: 2080, y: 640, ancre: "bas", profondeur: 0.95 },
  { nom: "banniere", x: 520, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "banniere", x: 1260, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "banniere", x: 1900, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "banniere2", x: 260, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "banniere2", x: 880, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "banniere2", x: 1600, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "lanterne", x: 700, y: 0, ancre: "haut", profondeur: 1, lueur: true },
  { nom: "lanterne", x: 1100, y: 0, ancre: "haut", profondeur: 1, lueur: true },
  { nom: "lanterne", x: 1500, y: 0, ancre: "haut", profondeur: 1, lueur: true },
  { nom: "lanterne2", x: 420, y: 0, ancre: "haut", profondeur: 1, lueur: true },
  { nom: "lanterne2", x: 1860, y: 0, ancre: "haut", profondeur: 1, lueur: true },
  { nom: "lampadaire", x: 760, y: 640, ancre: "bas", profondeur: 2, lueur: true },
  { nom: "lampadaire", x: 1780, y: 640, ancre: "bas", profondeur: 2, lueur: true },
  { nom: "caisse", x: 1960, y: 640, ancre: "bas", profondeur: 2 },
  { nom: "vase", x: 1760, y: 640, ancre: "bas", profondeur: 2 },
  { nom: "vase", x: 500, y: 320, ancre: "bas", profondeur: 2 },
  { nom: "pagode", x: 1836, y: 232, ancre: "bas", profondeur: 2 }
];

export default class niveau2 extends niveau1 {
  constructor() {
    super("niveau2"); // la clé de la scène
  }

  // --------------------------------------------------------------------------
  //  PRELOAD : le fond, l'image des tuiles et la carte
  // --------------------------------------------------------------------------
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("fond_theatre", "./assets/map2_sombre_voile.jpg"); // fond : le théâtre d'ombres chinoises (le dragon), déjà assombri
    this.load.spritesheet("porte_sortie_rouge", "./assets/porte_sortie_rouge.png", { frameWidth: 96, frameHeight: 120 }); // la porte, en rouge
    this.load.atlas("decor2", "./assets/decor_niveau2.png", "./assets/decor_niveau2.json"); // plateformes et décor rouges
    this.load.image("tuiles_theatre", "./assets/tilesetmap2.png");
    this.load.tilemapTiledJSON("carte_theatre", "./assets/map2maestro.json");
  }

  // Ce qui change par rapport au niveau 1 (voir definirNiveau dans niveau1.js)
  definirNiveau() {
    this.largeurMonde = LARGEUR_MONDE;
    this.hauteurMonde = HAUTEUR_MONDE;
    this.couleurFond = 0x05070f;
    this.listeTubas = TUBAS; // deux Tubas dans ce niveau
    this.listeCristaux = CRISTAUX;
    this.numeroNiveau = 2; // son numéro dans la progression (voir progression.js)
    this.formeUnique = false; // au niveau 2, les deux personnages restent séparés (comme avant)
    this.musiqueNiveau = "musique_niveau2"; // la piste propre au niveau 2
    this.messageVictoire = "Niveau 2 terminé !";
    this.objectif = "OBJECTIF : ramasse " + NOTES_REQUISES + " notes de musique pour révéler la PARTITION,\npuis prends-la et franchis la porte en haut à droite";
    this.notesRamassees = 0;
    this.partitionActive = false; // vrai quand les 3 notes ont été ramassées : la partition s'illumine
    this.partitionPrise = false;
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
    // (l'image de fond est déjà assombrie : un voile dessiné par-dessus à chaque image coûtait cher pour rien)

    // La carte Tiled ne sert plus qu'à deux choses : les ÉCHELLES (dessin) et les PLATEFORMES (leurs positions).
    // Tout le reste du décor est dessiné avec les images rouges (voir poserDecor).
    const carte = this.add.tilemap("carte_theatre");
    const tuiles = carte.addTilesetImage("tileset_maestro", "tuiles_theatre");
    const calqueEchelles = carte.createLayer("calque_background2", tuiles).setDepth(3);
    calqueEchelles.forEachTile((tuile) => {
      const estEchelle = tuile.properties != null && tuile.properties.estEchelle == true;
      tuile.visible = estEchelle; // on ne garde que les tuiles d'échelle
    });
    const calque = carte.createLayer("calque_plateformes", tuiles).setVisible(false); // invisible : on lit seulement ses tuiles
    this.calquePlateformes = calque;

    // On enlève de la carte les plateformes fixes à remplacer par des plateformes mobiles, et celles qui étaient trop serrées
    const aRetirer = PLATEFORMES_RETIREES.concat(
      PLATEFORMES_MOBILES.map((m) => ({ x: m.origine.x, y: m.origine.y, largeur: m.largeur, hauteur: m.hauteur }))
    );
    aRetirer.forEach((r) => {
      for (let colonne = r.x / TAILLE_TUILE; colonne < (r.x + r.largeur) / TAILLE_TUILE; colonne++) {
        for (let ligne = r.y / TAILLE_TUILE; ligne < (r.y + r.hauteur) / TAILLE_TUILE; ligne++) {
          calque.removeTileAt(colonne, ligne);
        }
      }
    });

    this.poserDecor();
    this.creerSolidesDepuisLesTuiles(carte);
    PALIERS.forEach((palier) => {
      this.ajouterPlateforme(palier);
      this.dessinerPlateforme(palier.x, palier.y, palier.width);
    });
    this.echelles = ECHELLES;

    // Zone sombre + passerelles fantômes qui mènent à la note dorée bonus
    this.creerOmbre();
    PASSERELLES.forEach((passerelle) => this.ajouterFantome(passerelle));

    // Ce que le niveau 1 attend de la carte
    this.departs = { j1: DEPART_J1, j2: DEPART_J2 };
    this.yChute = LIGNE_DE_CHUTE;

    // Panneaux d'indication
    this.ajouterIndice(250, 540, "Monte à l'échelle (haut)");
    this.ajouterIndice(760, 120, "Cristaux colorés !\nChoisis la note de la même couleur (bouton C) et tire (bouton B)");
    this.ajouterIndice(1150, 330, "Zone sombre : le Détective éclaire les passerelles (bouton B)\npour atteindre une note dorée BONUS (+1 cœur)");
    this.ajouterIndice(1290, 600, "Plateformes mobiles : attends le bon moment pour sauter !");
    this.ajouterIndice(190, 330, "Tambour : saute dessus pour rebondir très haut !");
    this.ajouterIndice(600, 108, "Voie haute : planches fragiles, ne traîne pas !");

    this.creerPlateformesMobiles();
    this.creerVoieHaute();
  }

  // --------------------------------------------------------------------------
  //  Le dessin : plateformes et décor rouges
  // --------------------------------------------------------------------------
  // Dessine une plateforme de la largeur voulue avec les images rouges. Une grande plateforme est découpée en
  // plusieurs morceaux ; pour chaque morceau on choisit l'image dont la largeur est la plus proche.
  // Renvoie un « conteneur » : un groupe d'images qu'on peut déplacer d'un coup (tween, tremblement…).
  dessinerPlateforme(x, y, largeur) {
    const images = [
      { nom: "plat_long", largeur: 268 },
      { nom: "plat_moy", largeur: 161 },
      { nom: "plat_mid", largeur: 130 },
      { nom: "plat_pet", largeur: 88 },
      { nom: "console", largeur: 42 }
    ];
    const conteneur = this.add.container(x, y).setDepth(3);
    const morceaux = Math.max(1, Math.ceil(largeur / 270)); // jamais plus de 270 px par morceau
    const largeurMorceau = largeur / morceaux;
    for (let i = 0; i < morceaux; i++) {
      // l'image la plus proche de la largeur à couvrir
      let choisie = images[0];
      images.forEach((image) => {
        if (Math.abs(image.largeur - largeurMorceau) < Math.abs(choisie.largeur - largeurMorceau)) {
          choisie = image;
        }
      });
      const dessin = this.add.image(i * largeurMorceau, 0, "decor2", choisie.nom).setOrigin(0, 0);
      dessin.setDisplaySize(largeurMorceau, dessin.height); // on étire un peu en largeur, jamais en hauteur
      conteneur.add(dessin);
    }
    return conteneur;
  }

  // La zone sombre : un voile noir aux bords FLOUS (dessiné sur un canvas avec un flou), pour qu'elle se fonde dans le décor
  creerOmbre() {
    const marge = 60;
    const l = ZONE_SOMBRE.largeur + marge * 2;
    const h = ZONE_SOMBRE.hauteur + marge * 2;
    if (this.textures.exists("tex_ombre") == false) {
      const toile = this.textures.createCanvas("tex_ombre", l, h);
      const ctx = toile.getContext();
      ctx.filter = "blur(26px)";
      ctx.fillStyle = "rgba(0, 0, 10, 0.78)";
      ctx.fillRect(marge, marge, ZONE_SOMBRE.largeur, ZONE_SOMBRE.hauteur);
      toile.refresh();
    }
    this.add.image(ZONE_SOMBRE.x - marge, ZONE_SOMBRE.y - marge, "tex_ombre").setOrigin(0, 0).setDepth(4);
  }

  // Pose tous les éléments de décor de la liste DECOR (bannières, lanternes, piliers, rideaux, vases…)
  poserDecor() {
    DECOR.forEach((d) => {
      const image = this.add.image(d.x, d.y, "decor2", d.nom);
      image.setOrigin(0.5, d.ancre == "bas" ? 1 : 0).setDepth(d.profondeur);
      if (d.lueur == true) {
        // petite lueur orangée autour de la lanterne (même texture que la lampe du Détective)
        const centreY = d.ancre == "bas" ? d.y - image.height * 0.8 : d.y + image.height * 0.45;
        this.lueur(d.x, centreY, 0.55, 0.35, undefined, d.profondeur + 0.1);
      }
    });
    // les plateformes ajoutées (fixes) : une zone solide + le dessin
    PLATEFORMES_AJOUTEES.forEach((p) => {
      this.ajouterPlateforme({ x: p.x, y: p.y, width: p.largeur, height: TAILLE_TUILE });
      this.dessinerPlateforme(p.x, p.y, p.largeur);
    });
  }

  // Une zone invisible avec un corps qui ne bouge pas quand un héros le pousse
  creerCorps(x, y, largeur, hauteur) {
    const zone = this.add.zone(x + largeur / 2, y + hauteur / 2, largeur, hauteur);
    this.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    return zone;
  }

  // --------------------------------------------------------------------------
  //  Plateformes mobiles
  // --------------------------------------------------------------------------
  creerPlateformesMobiles() {
    this.groupe_mobiles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.mobiles = [];
    PLATEFORMES_MOBILES.forEach((m, i) => {
      const plateforme = this.creerCorps(m.x, m.origine.y, m.largeur, m.hauteur);
      this.groupe_mobiles.add(plateforme);
      plateforme.unSens = true;
      plateforme.body.setImmovable(true);
      plateforme.body.setAllowGravity(false);
      const dessin = this.dessinerPlateforme(m.x, m.origine.y, m.largeur);
      // Le tween déplace EN MÊME TEMPS le corps (physique) et le dessin : de sa position de départ jusqu'à +dx / +dy,
      // puis retour, à l'infini
      this.tweens.add({
        targets: [plateforme, dessin],
        x: "+=" + m.dx,
        y: "+=" + m.dy,
        duration: m.dureeMs,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      plateforme.dernierX = plateforme.x;
      plateforme.dernierY = plateforme.y;
      this.mobiles.push(plateforme);
    });
  }

  // --------------------------------------------------------------------------
  //  La voie haute : tambours, plateformes en hauteur, planches fragiles
  // --------------------------------------------------------------------------
  creerVoieHaute() {
    // Plateformes fixes en hauteur : une zone solide (donc « plateforme sûre » pour le respawn) + le dessin de la carte
    PLATEFORMES_HAUTES.forEach((p) => {
      this.ajouterPlateforme({ x: p.x, y: p.y, width: LARGEUR_PLATEFORME_HAUTE, height: TAILLE_TUILE });
      this.dessinerPlateforme(p.x, p.y, LARGEUR_PLATEFORME_HAUTE);
    });

    // Tambours : un petit décor + une zone de détection (physique statique)
    this.groupe_tambours = this.physics.add.staticGroup();
    TAMBOURS.forEach((t) => {
      const tambour = this.groupe_tambours.create(t.x, t.y - 38, "decor2", "tambour");
      tambour.setDepth(4);
      tambour.refreshBody();
    });

    // Planches fragiles : des corps qui peuvent être désactivés puis réactivés
    this.groupe_fragiles = this.physics.add.group({ allowGravity: false, immovable: true });
    PLANCHES_FRAGILES.forEach((f) => {
      const planche = this.creerCorps(f.x, f.y, LARGEUR_PLANCHE, 32);
      this.groupe_fragiles.add(planche);
      planche.unSens = true;
      planche.body.setImmovable(true);
      planche.body.setAllowGravity(false);
      planche.dessin = this.dessinerPlateforme(f.x, f.y, LARGEUR_PLANCHE);
      planche.tombe = false; // vrai dès que quelqu'un a marché dessus (elle est « en train de tomber »)
    });
  }

  // Un héros qui marche sur une planche fragile : elle tremble, tombe, puis revient
  planchePietinee(perso, planche) {
    const dessus = perso.body.bottom <= planche.body.top + 8;
    if (planche.tombe == true || dessus == false) {
      return;
    }
    planche.tombe = true;
    const x0 = planche.dessin.x;
    this.tweens.add({ targets: planche.dessin, x: x0 + 2, duration: 50, yoyo: true, repeat: 4 }); // elle tremble
    this.time.delayedCall(DELAI_CHUTE_MS, () => {
      planche.body.enable = false; // plus solide : les héros tombent
      this.tweens.add({ targets: planche.dessin, alpha: 0.15, duration: 200 });
    });
    this.time.delayedCall(DELAI_CHUTE_MS + DELAI_RETOUR_MS, () => {
      planche.dessin.x = x0;
      planche.body.enable = true;
      planche.tombe = false;
      this.tweens.add({ targets: planche.dessin, alpha: 1, duration: 300 });
    });
  }

  // Un héros qui TOMBE sur un tambour rebondit très haut
  rebondirSurTambour(perso, tambour) {
    const surLeDessus = perso.body.velocity.y > 0 && perso.body.bottom < tambour.body.top + 16;
    if (surLeDessus == false || perso.enEchelle == true) {
      return;
    }
    perso.setVelocityY(FORCE_TAMBOUR);
    this.tweens.add({ targets: tambour, scaleY: 0.7, duration: 70, yoyo: true }); // le tambour s'écrase un instant
  }

  // Un héros posé sur une plateforme mobile doit être EMPORTÉ avec elle, sinon la plateforme glisse sous ses pieds
  emporterLesHeros() {
    this.mobiles.forEach((plateforme) => {
      const dx = plateforme.x - plateforme.dernierX;
      const dy = plateforme.y - plateforme.dernierY;
      this.persos.forEach((perso) => {
        const corps = perso.body;
        const surLaPlateforme =
          Math.abs(corps.bottom - plateforme.body.top) < 6 &&
          corps.right > plateforme.body.left &&
          corps.left < plateforme.body.right &&
          corps.velocity.y >= 0;
        if (surLaPlateforme == true && perso.enEchelle == false) {
          perso.x += dx;
          perso.y += dy;
        }
      });
      plateforme.dernierX = plateforme.x;
      plateforme.dernierY = plateforme.y;
    });
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
      const x = b.debut * TAILLE_TUILE;
      const y = b.ligneDebut * TAILLE_TUILE;
      const largeur = (b.fin - b.debut + 1) * TAILLE_TUILE;
      this.ajouterPlateforme({ x: x, y: y, width: largeur, height: (b.ligneFin - b.ligneDebut + 1) * TAILLE_TUILE });

      // Le dessin : seulement pour le DESSUS d'une plateforme (pas pour les rangées en dessous) et pas pour
      // les marches de l'escalier (dessiné en un seul morceau dans poserDecor)
      let tuileAuDessus = false;
      for (let colonne = b.debut; colonne <= b.fin; colonne++) {
        if (estSolide(b.ligneDebut - 1, colonne) == true) {
          tuileAuDessus = true;
        }
      }
      const estUneMarche = largeur <= 32 && x >= 448 && x < 608 && y >= 320 && y < 480;
      if (tuileAuDessus == false && estUneMarche == false) {
        this.dessinerPlateforme(x, y, largeur);
      }
    });
  }

  // Une plateforme = un rectangle invisible avec un corps statique (le décor est déjà dessiné par les tuiles)
  ajouterPlateforme(objet) {
    const zone = this.add.zone(objet.x + objet.width / 2, objet.y + objet.height / 2, objet.width, objet.height);
    this.groupe_plateformes.add(zone);
    zone.unSens = objet.y < 640; // sauf le sol et la scène : on traverse les plateformes par le dessous
  }

  // --------------------------------------------------------------------------
  //  Objets : les notes de musique, la partition et la porte de sortie
  // --------------------------------------------------------------------------
  creerObjets() {
    this.creerTexturesNotes();

    this.groupe_notes = this.physics.add.group({ allowGravity: false });
    POSITIONS_NOTES.forEach((position, i) => this.ajouterNote(position[0], position[1], i % 3, false));
    this.ajouterNote(NOTE_BONUS.x, NOTE_BONUS.y, 2, true);
    this.ajouterNote(NOTE_VOIE_HAUTE.x, NOTE_VOIE_HAUTE.y, 2, true); // 2e note dorée, au bout de la voie haute

    // La porte de sortie (même image que le niveau 1, en rouge), fermée au début
    this.porte = this.physics.add.staticSprite(PORTE.x, PORTE.solY - 60, "porte_sortie_rouge", 0);
    this.porte.setDepth(3);
    this.porteOuverte = false;
    if (this.anims.exists("porte_ouvre_rouge") == false) {
      this.anims.create({ key: "porte_ouvre_rouge", frames: this.anims.generateFrameNumbers("porte_sortie_rouge", { start: 0, end: 5 }), frameRate: 8, repeat: 0 });
    }

    this.creerPartition();
  }

  // Les images des notes sont dessinées en code (blanches : on les colore ensuite avec setTint)
  creerTexturesNotes() {
    const dessin = this.make.graphics({ add: false });
    if (this.textures.exists("tex_note") == false) {
      dessin.fillStyle(0xffffff);
      dessin.fillEllipse(10, 34, 17, 12); // la tête
      dessin.fillRect(15, 6, 3, 28); // la hampe
      dessin.fillTriangle(18, 6, 30, 20, 18, 16); // le crochet
      dessin.generateTexture("tex_note", 32, 44);
      dessin.clear();
    }
    if (this.textures.exists("tex_note_double") == false) {
      dessin.fillStyle(0xffffff);
      dessin.fillEllipse(9, 36, 15, 11).fillEllipse(29, 32, 15, 11); // deux têtes
      dessin.fillRect(13, 8, 3, 29).fillRect(33, 4, 3, 29); // deux hampes
      dessin.fillTriangle(13, 8, 36, 4, 36, 12).fillTriangle(13, 8, 36, 12, 13, 16); // la barre qui les relie
      dessin.generateTexture("tex_note_double", 44, 48);
      dessin.clear();
    }
    if (this.textures.exists("tex_etincelle") == false) {
      dessin.fillStyle(0xffffff).fillCircle(4, 4, 4);
      dessin.generateTexture("tex_etincelle", 8, 8);
    }
    dessin.destroy();
  }

  // Une note de musique à ramasser : colorée (Do rouge, Mi bleu, Sol doré), avec une petite lueur, qui flotte.
  // bonus = vrai pour une note dorée plus grosse qui rend un cœur.
  ajouterNote(x, y, indexCouleur, bonus) {
    const couleur = bonus == true ? 0xffd24a : COULEURS_NOTES[indexCouleur];
    const note = this.groupe_notes.create(x, y, bonus == true ? "tex_note_double" : "tex_note");
    note.setDepth(6).setTint(couleur);
    note.bonus = bonus;
    note.couleur = couleur;
    if (bonus == true) {
      note.setScale(1.25);
    }
    note.lueur = this.lueur(x, y, bonus == true ? 0.6 : 0.42, 0.5, couleur, 5.9); // null en mode économique
    // la note (et sa lueur, s'il y en a une) flottent ensemble
    const flottent = note.lueur === null ? [note] : [note, note.lueur];
    this.tweens.add({ targets: flottent, y: y - 8, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  // La PARTITION : le fragment à récupérer. Visible dès le début mais éteinte et « verrouillée » ; elle s'illumine
  // quand on a ramassé les notes (voir revelerPartition). Halo, rayons, étincelles et flèche d'indication la mettent en valeur.
  creerPartition() {
    const x = PARTITION.x;
    const y = PARTITION.y;

    // les rayons de lumière qui tournent lentement derrière la partition (invisibles tant qu'elle est éteinte)
    // et le halo : ce sont des effets décoratifs, absents en mode économique (rayons et halo valent alors null)
    this.rayons = null;
    this.halo_partition = null;
    this.etincelles = null;
    if (this.modeLeger == false) {
      this.rayons = this.add.graphics({ x: x, y: y }).setDepth(5.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      this.rayons.fillStyle(0xffe6a0, 0.35);
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI * 2) / 12;
        this.rayons.fillTriangle(0, 0, Math.cos(angle - 0.09) * 150, Math.sin(angle - 0.09) * 150, Math.cos(angle + 0.09) * 150, Math.sin(angle + 0.09) * 150);
      }
      this.halo_partition = this.lueur(x, y, 1.6, 0.35, 0x8fb4ff, 5.6); // lueur froide : verrouillée
      this.effets.push(this.rayons);
    }

    // la partition elle-même : éteinte (grise, transparente) et sans collision tant que les notes ne sont pas ramassées
    this.partition = this.physics.add.image(x, y, "img_partition");
    this.partition.setDisplaySize(84, 84).setDepth(7).setAlpha(0.6).setTint(0x8fa0c0);
    this.partition.body.setAllowGravity(false);
    this.partition.body.enable = false;
    this.echellePartition = this.partition.scaleX; // pour l'animation d'apparition
    const flottent = this.halo_partition === null ? [this.partition] : [this.partition, this.halo_partition];
    this.tweens.add({ targets: flottent, y: y - 10, duration: 1000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.etiquettePartition = this.add
      .text(x, y - 78, "PARTITION verrouillée\n(ramasse " + NOTES_REQUISES + " notes)", {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: "12pt",
        color: "#cdd3e8",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(8);

    // La flèche qui indique où est la partition quand elle est hors de l'écran
    this.indicateur = this.add.image(0, 0, "tex_fleche").setScrollFactor(0).setDepth(100).setVisible(false).setTint(0xffd24a).setScale(1.7);
  }

  // Les 3 notes sont ramassées : la partition s'illumine avec un grand effet
  revelerPartition() {
    this.partitionActive = true;
    this.partition.body.enable = true;
    this.partition.clearTint().setAlpha(1);
    this.partition.setScale(this.echellePartition * 0.2);
    this.tweens.add({ targets: this.partition, scale: this.echellePartition * 1.15, duration: 700, ease: "Back.easeOut" });
    this.etiquettePartition.setText("PARTITION !").setColor("#ffe9a8").setFontSize("17pt");

    // halo qui pulse + rayons qui tournent + étincelles (effets décoratifs : absents en mode économique)
    if (this.modeLeger == false && this.halo_partition !== null && this.halo_partition.active == true) {
      this.halo_partition.setTint(0xffd98a); // la lueur devient chaude
      this.tweens.add({ targets: this.halo_partition, alpha: 0.5, scale: 1.9, duration: 500 });
      this.tweens.add({ targets: this.halo_partition, scale: 2.3, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: 500 });
      this.tweens.add({ targets: this.rayons, alpha: 0.55, duration: 600 });
      this.tweens.add({ targets: this.rayons, angle: 360, duration: 16000, repeat: -1 });

      this.etincelles = this.add.particles(PARTITION.x, PARTITION.y, "tex_etincelle", {
        speed: { min: 30, max: 120 },
        lifespan: 1000,
        scale: { start: 1.1, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xffe08a, 0xffffff, 0xff9aa8],
        blendMode: "ADD",
        frequency: 60,
        quantity: 1
      });
      this.etincelles.setDepth(7.5);
      this.effets.push(this.etincelles);
    }

    this.cameras.main.flash(400, 255, 232, 160); // éclair doré
    this.afficherMessage("La PARTITION est apparue en haut à droite ! Va la chercher !", 6000);
    this.iconeFragment.setTint(0xffd98a);
    this.tweens.add({ targets: this.iconeFragment, scale: this.iconeFragment.scale * 1.25, duration: 500, yoyo: true, repeat: -1 });
  }

  // Quand la partition est hors de l'écran, une flèche dorée au bord de l'écran montre sa direction
  mettreAJourIndicateur(temps) {
    if (this.partitionActive == false || this.partitionPrise == true) {
      this.indicateur.setVisible(false);
      return;
    }
    const vue = this.cameras.main.worldView;
    const sx = this.partition.x - vue.x;
    const sy = this.partition.y - vue.y;
    const visible = sx > 60 && sx < 1220 && sy > 90 && sy < 660;
    if (visible == true) {
      this.indicateur.setVisible(false);
      return;
    }
    const cx = 640;
    const cy = 360;
    const angle = Math.atan2(sy - cy, sx - cx);
    // on place la flèche sur le bord de l'écran, dans la direction de la partition
    const x = Phaser.Math.Clamp(cx + Math.cos(angle) * 700, 50, 1230);
    const y = Phaser.Math.Clamp(cy + Math.sin(angle) * 700, 110, 650);
    this.indicateur.setVisible(true).setPosition(x, y).setRotation(angle - Math.PI / 2);
    this.indicateur.setScale(1.7 + Math.sin(temps / 150) * 0.2);
  }

  update(temps, delta) {
    super.update(temps, delta);
    if (this.fini == false) {
      this.emporterLesHeros();
      this.mettreAJourIndicateur(temps);
    }
  }

  // Ramasser les notes et la partition, franchir la porte
  collisionsObjets() {
    // Tambours (rebond) et planches fragiles
    this.physics.add.overlap(this.persos, this.groupe_tambours, this.rebondirSurTambour, null, this);
    this.physics.add.collider(this.persos, this.groupe_fragiles, this.planchePietinee, (perso, plateforme) => this.peutMarcherSur(perso, plateforme), this);
    // Les héros marchent sur les plateformes mobiles (sauf s'ils sont sur une échelle)
    this.physics.add.collider(this.persos, this.groupe_mobiles, null, (perso, plateforme) => this.peutMarcherSur(perso, plateforme));
    this.physics.add.overlap(this.persos, this.groupe_notes, this.ramasserNote, null, this);
    this.physics.add.overlap(this.persos, this.partition, this.ramasserFragment, null, this);
    this.physics.add.overlap(this.persos, this.porte, this.franchirPorte, null, this);
  }

  ramasserNote(perso, note) {
    note.disableBody(true, true); // la note disparaît
    if (note.lueur !== null && note.lueur.active) {
      note.lueur.destroy();
    }
    // petit effet : une copie de la note monte en grossissant et s'efface
    const copie = this.add.image(note.x, note.y, note.texture.key).setTint(note.couleur).setDepth(7).setScale(note.scale);
    this.tweens.add({ targets: copie, y: copie.y - 50, scale: note.scale * 1.8, alpha: 0, duration: 500, onComplete: () => copie.destroy() });

    if (note.bonus == true) {
      // la note dorée rend un cœur (sans dépasser le maximum)
      this.vies = Math.min(this.vies + 1, this.viesMax);
      this.majCoeurs();
      this.afficherMessage("Note dorée ! +1 cœur", 3000);
      return;
    }

    this.notesRamassees += 1;
    this.texteNotes.setText(Math.min(this.notesRamassees, NOTES_REQUISES) + " / " + NOTES_REQUISES);
    if (this.notesRamassees == NOTES_REQUISES) {
      this.revelerPartition();
    } else if (this.notesRamassees < NOTES_REQUISES) {
      this.afficherMessage("Note " + this.notesRamassees + " / " + NOTES_REQUISES, 1500);
    }
  }

  // Prendre la partition ouvre la porte (comme le parchemin du niveau 1)
  ramasserFragment(perso, partition) {
    if (this.partitionActive == false || this.partitionPrise == true) {
      return;
    }
    this.partitionPrise = true;
    this.fragmentRecupere = true;
    this.arreterSonPartition(); // le chœur s'arrête dès qu'on tient le fragment
    partition.disableBody(true, true);
    [this.etincelles, this.rayons, this.halo_partition, this.etiquettePartition, this.indicateur].forEach((objet) => {
      if (objet && objet.active) {
        if (objet.stop) {
          objet.stop(); // les étincelles arrêtent d'en produire
        }
        objet.setVisible(false);
      }
    });
    this.cameras.main.flash(300, 255, 240, 190);
    this.porteOuverte = true;
    this.porte.anims.play("porte_ouvre_rouge"); // la porte s'ouvre
    this.tweens.killTweensOf(this.iconeFragment);
    this.iconeFragment.clearTint().setScale(1);
    this.texteFragment.setText("1 / 1");
    this.afficherMessage("PARTITION récupérée ! La porte est ouverte : rejoins-la !", 5000);
  }

  // Devant la porte : si elle est fermée on explique pourquoi, sinon le niveau est gagné
  franchirPorte() {
    if (this.porteOuverte == false) {
      if (this.time.now > (this.prochaineAlertePorte || 0)) {
        const aide = this.partitionActive == true ? "Prends la PARTITION pour ouvrir la porte !" : "Ramasse " + NOTES_REQUISES + " notes pour révéler la PARTITION !";
        this.afficherMessage(aide, 2500);
        this.prochaineAlertePorte = this.time.now + 3000; // on ne répète pas le message à chaque image
      }
      return;
    }
    super.franchirPorte();
  }

  // --------------------------------------------------------------------------
  //  Interface : celle du niveau 1 (la partition à droite, éteinte puis allumée) + un compteur de notes
  // --------------------------------------------------------------------------
  creerInterface() {
    super.creerInterface();
    const fixe = (objet) => objet.setScrollFactor(0).setDepth(100);
    this.iconeNotes = fixe(this.add.image(1100, 44, "tex_note")).setTint(0xffd24a).setDisplaySize(24, 33);
    this.texteNotes = fixe(
      this.add
        .text(1074, 44, "0 / " + NOTES_REQUISES, {
          fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
          fontSize: "16pt",
          color: "#dfe6ff",
          stroke: "#000000",
          strokeThickness: 4
        })
        .setOrigin(1, 0.5)
    );
  }
}
