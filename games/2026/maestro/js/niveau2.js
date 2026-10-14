// ============================================================================
//  js/niveau2.js — NIVEAU 2 : LES OMBRES CHINOISES (carte Tiled « map2maestro »)
//
//  Ce niveau « hérite » du niveau 1 (class niveau2 extends niveau1) : il reprend TOUTES ses
//  mécaniques sans les recopier — les deux héros, la lampe, les ondes Do / Mi / Sol, les cristaux,
//  les cœurs, la caméra, les échelles, le mode solo et duo. Il ne redéfinit que ce qui change :
//  la carte, les objets à ramasser et les textes.
//
//  OBJECTIF : ramasser 3 NOTES DE MUSIQUE (il y en a 5 sur le chemin) pour RÉVÉLER la PARTITION, la prendre,
//  puis franchir la PORTE en haut à droite.
//
//  - Les plateformes et les échelles sont lues dans la carte Tiled (propriétés estSolide / estEchelle).
//  - Des CRISTAUX colorés gardent le chemin : il faut tirer la note de la même couleur (Cantatrice).
//  - Dans la ZONE SOMBRE, des passerelles fantômes mènent à une note dorée BONUS (+1 cœur) :
//    le Détective doit les éclairer avec sa lampe.
// ============================================================================

// On importe le niveau 1 : ce niveau-ci en est une version qui change quelques éléments
import niveau1 from "./niveau1.js";

// ---- Constantes du niveau (toutes les positions sont en pixels, sauf mention contraire) ----
const LARGEUR_MONDE = 2176; // 68 tuiles de 32 px
const HAUTEUR_MONDE = 736; // 23 tuiles de 32 px
const TAILLE_TUILE = 32; // une tuile fait 32 pixels de côté
const NOTES_REQUISES = 3; // notes à ramasser pour révéler la partition
const COULEURS_NOTES = [0xff6b7d, 0x62b0ff, 0xffd24a]; // Do (rouge), Mi (bleu), Sol (doré) : comme les ondes et les cristaux
// La PARTITION à récupérer : posée sur la plateforme de la porte. Elle est visible dès le début mais « verrouillée ».
const PARTITION = { x: 1745, y: 236 };

// Positions [x, y] des 5 notes de musique : 3 sur la route du haut, 2 sur la route du bas
const POSITIONS_NOTES = [
  [730, 210], [1300, 236], [1560, 258], // route du haut (au-dessus des plateformes mobiles)
  [1040, 514], [1260, 418] // route du bas
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
  { origine: { x: 640, y: 288 }, largeur: 160, hauteur: 64, x: 650, dx: 60, dy: 0, dureeMs: 1955 }, // va et vient (reste à y = 288 : ne monte pas vers la voie haute)
  { origine: { x: 928, y: 288 }, largeur: 160, hauteur: 64, x: 880, dx: 120, dy: 0, dureeMs: 2040 }, // va et vient
  { origine: { x: 1216, y: 256 }, largeur: 160, hauteur: 64, x: 1216, dx: 0, dy: 70, dureeMs: 2125 }, // monte et descend
  { origine: { x: 1472, y: 288 }, largeur: 160, hauteur: 64, x: 1440, dx: 80, dy: 0, dureeMs: 1870 }, // va et vient
  // route du bas
  { origine: { x: 352, y: 544 }, largeur: 160, hauteur: 64, x: 352, dx: 0, dy: -50, dureeMs: 2040 }, // première marche : monte et descend
  { origine: { x: 640, y: 480 }, largeur: 160, hauteur: 64, x: 640, dx: 0, dy: -60, dureeMs: 2210 }, // monte et descend
  { origine: { x: 928, y: 544 }, largeur: 160, hauteur: 64, x: 928, dx: 70, dy: 0, dureeMs: 2210 }, // va et vient
  { origine: { x: 1216, y: 448 }, largeur: 160, hauteur: 64, x: 1216, dx: 80, dy: 0, dureeMs: 1955 }, // va et vient
  { origine: { x: 1472, y: 544 }, largeur: 160, hauteur: 64, x: 1500, dx: 0, dy: -70, dureeMs: 1700 } // monte et descend
];

// ---- La VOIE HAUTE : un parcours en hauteur, facultatif, qui mène à une note dorée bonus (+1 cœur) ----
//  1. un TAMBOUR posé sur une plateforme fait rebondir très haut (plus haut qu'un saut normal) ;
//  2. des plateformes fixes en hauteur ;
//  3. des PLANCHES FRAGILES entre elles : elles tombent peu après qu'on a marché dessus, puis reviennent.
const TAMBOURS = [{ x: 220, y: 384 }]; // x = centre, y = dessus de la plateforme sur laquelle il est posé
const FORCE_TAMBOUR = -760; // vitesse de rebond (un saut normal : -520)
const LARGEUR_PLATEFORME_HAUTE = 160; // largeur d'une plateforme haute, en pixels
const LARGEUR_PLANCHE = 96; // largeur d'une planche fragile, en pixels
const PLATEFORMES_HAUTES = [
  { x: 300, y: 120 }, // x, y = coin haut gauche (160 px de large) ; y = 120 : hors de portée d'un saut normal (135 px)
  { x: 832, y: 120 }
];
const PLANCHES_FRAGILES = [
  { x: 520, y: 120 },
  { x: 676, y: 120 }
]; // x, y = coin haut gauche (96 px de large)
const DELAI_CHUTE_MS = 500; // temps entre le premier contact et la chute de la planche
const DELAI_RETOUR_MS = 3500; // temps avant qu'elle revienne
const NOTE_VOIE_HAUTE = { x: 910, y: 80 }; // la note dorée tout au bout de la voie haute

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
const ZONE_SOMBRE = { x: 1000, y: 0, largeur: 300, hauteur: 260 }; // la zone où il fait sombre (zone et voile)

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
  { nom: "pilier", x: 880, y: 640, ancre: "bas", profondeur: 0.9 },
  { nom: "rideau", x: 100, y: 640, ancre: "bas", profondeur: 0.95 },
  { nom: "banniere", x: 520, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "banniere", x: 1260, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "banniere", x: 1900, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "banniere2", x: 880, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "banniere2", x: 1600, y: 0, ancre: "haut", profondeur: 1 },
  { nom: "lanterne", x: 700, y: 0, ancre: "haut", profondeur: 1, lueur: true },
  { nom: "lanterne", x: 1100, y: 0, ancre: "haut", profondeur: 1, lueur: true },
  { nom: "lanterne", x: 1500, y: 0, ancre: "haut", profondeur: 1, lueur: true },
  { nom: "lanterne2", x: 1860, y: 0, ancre: "haut", profondeur: 1, lueur: true },
  { nom: "lampadaire", x: 760, y: 640, ancre: "bas", profondeur: 2, lueur: true },
  { nom: "pagode", x: 1836, y: 232, ancre: "bas", profondeur: 2 }
];

// Le niveau 2 : une classe qui hérite de niveau1 (tout ce qui n'est pas redéfini ici reste celui du niveau 1)
export default class niveau2 extends niveau1 {
  constructor() {
    super("niveau2"); // la clé de la scène
  }

  // --------------------------------------------------------------------------
  //  PRELOAD : le fond, l'image des tuiles et la carte
  // --------------------------------------------------------------------------
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL); // les fichiers sont cherchés depuis le dossier du jeu
    this.load.image("fond_theatre", "./assets/map2_sombre_voile.jpg"); // fond : le théâtre d'ombres chinoises (le dragon), déjà assombri
    this.load.spritesheet("porte_sortie_rouge", "./assets/porte_sortie_rouge.png", { frameWidth: 96, frameHeight: 120 }); // la porte, en rouge
    this.load.atlas("decor2", "./assets/decor_niveau2.png", "./assets/decor_niveau2.json"); // plateformes et décor rouges
    this.load.image("tuiles_theatre", "./assets/tilesetmap2.png"); // les tuiles de la carte
    this.load.tilemapTiledJSON("carte_theatre", "./assets/map2maestro.json"); // la carte Tiled elle-même
  }

  // Ce qui change par rapport au niveau 1 (voir definirNiveau dans niveau1.js)
  definirNiveau() {
    this.largeurMonde = LARGEUR_MONDE; // taille du monde utilisée par le niveau 1
    this.hauteurMonde = HAUTEUR_MONDE;
    this.couleurFond = 0x05070f; // couleur de fond, presque noire
    this.listeTubas = TUBAS; // deux Tubas dans ce niveau
    this.listeCristaux = CRISTAUX; // les cristaux de ce niveau
    this.numeroNiveau = 2; // son numéro dans la progression (voir progression.js)
    this.formeUnique = true; // en solo, un seul corps : la Cantatrice se transforme en Détective avec K (comme au niveau 1)
    this.musiqueNiveau = "musique_niveau2"; // la piste propre au niveau 2
    this.messageVictoire = "Niveau 2 terminé !"; // le texte affiché à la victoire
    this.objectif = "OBJECTIF : ramasse " + NOTES_REQUISES + " notes de musique pour révéler la PARTITION,\npuis prends-la et franchis la porte en haut à droite";
    this.notesRamassees = 0; // compteur des notes ramassées (au départ : aucune)
    this.partitionActive = false; // vrai quand les 3 notes ont été ramassées : la partition s'illumine
    this.partitionPrise = false; // vrai quand le joueur a pris la partition
  }

  // --------------------------------------------------------------------------
  //  La carte : décor (calques de tuiles), puis les zones solides, les échelles, les passerelles
  // --------------------------------------------------------------------------
  creerCarte() {
    this.groupe_plateformes = this.physics.add.staticGroup(); // plateformes solides
    this.groupe_fantomes = this.physics.add.staticGroup(); // passerelles fantômes
    this.groupe_murs = this.physics.add.staticGroup(); // (pas de mur dans ce niveau, mais le niveau 1 en a besoin)
    this.avecTuilesPlateformes = false; // les passerelles fantômes utilisent le dessin de secours

    this.add.image(0, 0, "fond_theatre").setOrigin(0, 0).setDisplaySize(LARGEUR_MONDE, HAUTEUR_MONDE).setDepth(0); // le fond, tout au fond
    // (l'image de fond est déjà assombrie : un voile dessiné par-dessus à chaque image coûtait cher pour rien)

    // La carte Tiled ne sert plus qu'à deux choses : les ÉCHELLES (dessin) et les PLATEFORMES (leurs positions).
    // Tout le reste du décor est dessiné avec les images rouges (voir poserDecor).
    const carte = this.add.tilemap("carte_theatre"); // on lit la carte Tiled
    const tuiles = carte.addTilesetImage("tileset_maestro", "tuiles_theatre"); // on relie le jeu de tuiles à son image
    const calqueEchelles = carte.createLayer("calque_background2", tuiles).setDepth(3); // le calque qui contient les échelles
    calqueEchelles.forEachTile((tuile) => { // on regarde chaque tuile du calque
      const estEchelle = tuile.properties != null && tuile.properties.estEchelle == true; // la tuile est-elle une échelle ?
      tuile.visible = estEchelle; // on ne garde que les tuiles d'échelle
    });
    const calque = carte.createLayer("calque_plateformes", tuiles).setVisible(false); // invisible : on lit seulement ses tuiles
    this.calquePlateformes = calque; // on le garde pour s'en servir plus tard

    // On enlève de la carte les plateformes fixes à remplacer par des plateformes mobiles, et celles qui étaient trop serrées
    const aRetirer = PLATEFORMES_RETIREES.concat( // la liste des zones à vider
      PLATEFORMES_MOBILES.map((m) => ({ x: m.origine.x, y: m.origine.y, largeur: m.largeur, hauteur: m.hauteur })) // + les origines des mobiles
    );
    aRetirer.forEach((r) => { // pour chaque zone à retirer
      for (let colonne = r.x / TAILLE_TUILE; colonne < (r.x + r.largeur) / TAILLE_TUILE; colonne++) { // chaque colonne de tuiles
        for (let ligne = r.y / TAILLE_TUILE; ligne < (r.y + r.hauteur) / TAILLE_TUILE; ligne++) { // chaque ligne de tuiles
          calque.removeTileAt(colonne, ligne); // on supprime la tuile de la carte
        }
      }
    });

    this.poserDecor(); // le décor rouge (piliers, bannières, lanternes…)
    this.creerSolidesDepuisLesTuiles(carte); // les tuiles solides deviennent des zones où l'on marche
    PALIERS.forEach((palier) => { // les petits paliers au sommet des échelles
      this.ajouterPlateforme(palier); // une zone solide
      this.dessinerPlateforme(palier.x, palier.y, palier.width); // et son dessin
    });
    this.echelles = ECHELLES; // la liste des échelles utilisée par le niveau 1

    // Zone sombre + passerelles fantômes qui mènent à la note dorée bonus
    this.creerOmbre(); // le voile sombre
    PASSERELLES.forEach((passerelle) => this.ajouterFantome(passerelle)); // chaque passerelle fantôme (révélée par la lampe)

    // Ce que le niveau 1 attend de la carte
    this.departs = { j1: DEPART_J1, j2: DEPART_J2 }; // où apparaissent les deux personnages
    this.yChute = LIGNE_DE_CHUTE; // sous cette hauteur, on tombe dans le vide

    // Panneaux d'indication
    this.ajouterIndice(250, 540, "Monte à l'échelle (haut)");
    this.ajouterIndice(760, 120, "Cristaux colorés !\nChoisis la note de la même couleur (bouton C) et tire (bouton B)");
    this.ajouterIndice(1150, 330, "Zone sombre : le Détective éclaire les passerelles (bouton B)\npour atteindre une note dorée BONUS (+1 cœur)");
    this.ajouterIndice(1290, 600, "Plateformes mobiles : attends le bon moment pour sauter !");
    this.ajouterIndice(190, 330, "Tambour : saute dessus pour rebondir très haut !");
    this.ajouterIndice(600, 70, "Voie haute : seul le TAMBOUR y mène ! Planches fragiles, ne traîne pas.");

    this.creerPlateformesMobiles(); // les plateformes qui vont et viennent
    this.creerVoieHaute(); // le tambour, les plateformes hautes et les planches fragiles
  }

  // --------------------------------------------------------------------------
  //  Le dessin : plateformes et décor rouges
  // --------------------------------------------------------------------------
  // Dessine une plateforme de la largeur voulue avec les images rouges. Une grande plateforme est découpée en
  // plusieurs morceaux ; pour chaque morceau on choisit l'image dont la largeur est la plus proche.
  // Renvoie un « conteneur » : un groupe d'images qu'on peut déplacer d'un coup (tween, tremblement…).
  dessinerPlateforme(x, y, largeur) {
    const images = [ // les images de plateformes disponibles, avec leur largeur
      { nom: "plat_long", largeur: 268 },
      { nom: "plat_moy", largeur: 161 },
      { nom: "plat_mid", largeur: 130 },
      { nom: "plat_pet", largeur: 88 },
      { nom: "console", largeur: 42 }
    ];
    const conteneur = this.add.container(x, y).setDepth(3); // le groupe d'images, placé au départ de la plateforme
    const morceaux = Math.max(1, Math.ceil(largeur / 270)); // jamais plus de 270 px par morceau
    const largeurMorceau = largeur / morceaux; // la largeur à couvrir par morceau
    for (let i = 0; i < morceaux; i++) { // pour chaque morceau
      // l'image la plus proche de la largeur à couvrir
      let choisie = images[0]; // on commence avec la première image
      images.forEach((image) => { // on compare toutes les autres
        if (Math.abs(image.largeur - largeurMorceau) < Math.abs(choisie.largeur - largeurMorceau)) {
          choisie = image; // celle-ci est plus proche : on la garde
        }
      });
      const dessin = this.add.image(i * largeurMorceau, 0, "decor2", choisie.nom).setOrigin(0, 0); // le morceau, dans le conteneur
      dessin.setDisplaySize(largeurMorceau, dessin.height); // on étire un peu en largeur, jamais en hauteur
      conteneur.add(dessin); // on l'ajoute au groupe
    }
    return conteneur; // le groupe complet, pour pouvoir le faire bouger plus tard
  }

  // La zone sombre : un voile noir aux bords FLOUS (dessiné sur un canvas avec un flou), pour qu'elle se fonde dans le décor
  creerOmbre() {
    const marge = 60; // une marge autour de la zone, pour que le flou ne soit pas coupé
    const l = ZONE_SOMBRE.largeur + marge * 2; // largeur totale du dessin
    const h = ZONE_SOMBRE.hauteur + marge * 2; // hauteur totale du dessin
    if (this.textures.exists("tex_ombre") == false) { // on ne dessine la texture qu'une seule fois
      const toile = this.textures.createCanvas("tex_ombre", l, h); // une toile de dessin
      const ctx = toile.getContext(); // le « pinceau » de cette toile
      ctx.filter = "blur(26px)"; // on flou tout ce qui est dessiné ensuite
      ctx.fillStyle = "rgba(0, 0, 10, 0.78)"; // une couleur noire presque opaque
      ctx.fillRect(marge, marge, ZONE_SOMBRE.largeur, ZONE_SOMBRE.hauteur); // le rectangle sombre, au centre
      toile.refresh(); // on valide le dessin
    }
    this.add.image(ZONE_SOMBRE.x - marge, ZONE_SOMBRE.y - marge, "tex_ombre").setOrigin(0, 0).setDepth(4); // on pose le voile
  }

  // Pose tous les éléments de décor de la liste DECOR (bannières, lanternes, piliers, rideaux, vases…)
  poserDecor() {
    DECOR.forEach((d) => { // pour chaque élément de la liste
      const image = this.add.image(d.x, d.y, "decor2", d.nom); // on pose son image
      image.setOrigin(0.5, d.ancre == "bas" ? 1 : 0).setDepth(d.profondeur); // le point d'ancrage et la profondeur
      if (d.nom == "pilier") {
        // le pilier est un vrai obstacle : solide de TOUS les côtés (pas à sens unique), on peut s'y poser dessus
        const zone = this.add.zone(d.x, d.y - image.height / 2, image.width, image.height); // une zone de la taille du pilier
        this.groupe_plateformes.add(zone); // elle devient solide
        zone.unSens = false; // false = solide de tous les côtés
      }
      if (d.lueur == true) {
        // petite lueur orangée autour de la lanterne (même texture que la lampe du Détective)
        const centreY = d.ancre == "bas" ? d.y - image.height * 0.8 : d.y + image.height * 0.45; // où placer la lueur
        this.lueur(d.x, centreY, 0.55, 0.35, undefined, d.profondeur + 0.1); // la lueur, un peu devant l'objet
      }
    });
    // les plateformes ajoutées (fixes) : une zone solide + le dessin
    PLATEFORMES_AJOUTEES.forEach((p) => {
      this.ajouterPlateforme({ x: p.x, y: p.y, width: p.largeur, height: TAILLE_TUILE }); // une zone solide, haute d'une tuile
      this.dessinerPlateforme(p.x, p.y, p.largeur); // son dessin
    });
  }

  // Une zone invisible avec un corps qui ne bouge pas quand un héros le pousse
  creerCorps(x, y, largeur, hauteur) {
    const zone = this.add.zone(x + largeur / 2, y + hauteur / 2, largeur, hauteur); // zone centrée sur le rectangle
    this.physics.add.existing(zone); // on lui ajoute un corps physique
    zone.body.setAllowGravity(false); // elle ne tombe pas
    zone.body.setImmovable(true); // elle ne se laisse pas pousser
    return zone;
  }

  // --------------------------------------------------------------------------
  //  Plateformes mobiles
  // --------------------------------------------------------------------------
  creerPlateformesMobiles() {
    this.groupe_mobiles = this.physics.add.group({ allowGravity: false, immovable: true }); // le groupe des plateformes mobiles
    this.mobiles = []; // la liste utilisée par emporterLesHeros()
    PLATEFORMES_MOBILES.forEach((m, i) => { // pour chaque plateforme mobile de la liste
      const plateforme = this.creerCorps(m.x, m.origine.y, m.largeur, m.hauteur); // son corps physique
      this.groupe_mobiles.add(plateforme); // on la range dans le groupe
      plateforme.unSens = true; // on la traverse par le dessous
      plateforme.body.setImmovable(true); // elle ne se laisse pas pousser
      plateforme.body.setAllowGravity(false); // elle ne tombe pas
      const dessin = this.dessinerPlateforme(m.x, m.origine.y, m.largeur); // son dessin
      // Le tween déplace EN MÊME TEMPS le corps (physique) et le dessin : de sa position de départ jusqu'à +dx / +dy,
      // puis retour, à l'infini
      this.tweens.add({
        targets: [plateforme, dessin], // ce qui bouge : le corps et le dessin
        x: "+=" + m.dx, // déplacement horizontal
        y: "+=" + m.dy, // déplacement vertical
        duration: m.dureeMs, // durée d'un aller simple
        yoyo: true, // on revient ensuite au départ
        repeat: -1, // et on recommence sans fin
        ease: "Sine.easeInOut" // mouvement doux au début et à la fin
      });
      plateforme.dernierX = plateforme.x; // on retient sa position, pour savoir de combien elle a bougé
      plateforme.dernierY = plateforme.y;
      this.mobiles.push(plateforme); // on la garde dans la liste
    });
  }

  // --------------------------------------------------------------------------
  //  La voie haute : tambours, plateformes en hauteur, planches fragiles
  // --------------------------------------------------------------------------
  creerVoieHaute() {
    // Plateformes fixes en hauteur : une zone solide (donc « plateforme sûre » pour le respawn) + le dessin de la carte
    PLATEFORMES_HAUTES.forEach((p) => {
      this.ajouterPlateforme({ x: p.x, y: p.y, width: LARGEUR_PLATEFORME_HAUTE, height: TAILLE_TUILE }); // la zone solide
      this.dessinerPlateforme(p.x, p.y, LARGEUR_PLATEFORME_HAUTE); // le dessin
    });

    // Tambours : un petit décor + une zone de détection (physique statique)
    this.groupe_tambours = this.physics.add.staticGroup(); // un groupe de solides qui ne bougent pas
    TAMBOURS.forEach((t) => { // pour chaque tambour
      const tambour = this.groupe_tambours.create(t.x, t.y - 38, "decor2", "tambour"); // son image, remontée de 38 px
      tambour.setDepth(4); // devant le décor, derrière les héros
      tambour.refreshBody(); // on recalcule sa boîte de collision après le décalage
    });

    // Planches fragiles : des corps qui peuvent être désactivés puis réactivés
    this.groupe_fragiles = this.physics.add.group({ allowGravity: false, immovable: true }); // le groupe des planches
    PLANCHES_FRAGILES.forEach((f) => { // pour chaque planche
      const planche = this.creerCorps(f.x, f.y, LARGEUR_PLANCHE, 32); // son corps physique, haut de 32 px
      this.groupe_fragiles.add(planche); // on la range dans le groupe
      planche.unSens = true; // on la traverse par le dessous
      planche.body.setImmovable(true); // elle ne se laisse pas pousser
      planche.body.setAllowGravity(false); // elle ne tombe pas toute seule
      planche.dessin = this.dessinerPlateforme(f.x, f.y, LARGEUR_PLANCHE); // son dessin, gardé pour le faire trembler et tomber
      planche.tombe = false; // vrai dès que quelqu'un a marché dessus (elle est « en train de tomber »)
    });
  }

  // Un héros qui marche sur une planche fragile : elle tremble, tombe, puis revient
  planchePietinee(perso, planche) {
    const dessus = perso.body.bottom <= planche.body.top + 8; // le héros est-il bien posé dessus ?
    if (planche.tombe == true || dessus == false) {
      return; // déjà en train de tomber, ou pas posé dessus : on ne fait rien
    }
    planche.tombe = true; // la chute commence
    const x0 = planche.dessin.x; // position de départ du dessin
    this.tweens.add({ targets: planche.dessin, x: x0 + 2, duration: 50, yoyo: true, repeat: 4 }); // elle tremble
    this.time.delayedCall(DELAI_CHUTE_MS, () => { // après 0,5 s
      planche.body.enable = false; // plus solide : les héros tombent
      this.tweens.add({ targets: planche.dessin, alpha: 0.15, duration: 200 }); // elle devient presque transparente
    });
    this.time.delayedCall(DELAI_CHUTE_MS + DELAI_RETOUR_MS, () => { // après 0,5 s + 3,5 s
      planche.dessin.x = x0; // elle revient à sa place
      planche.body.enable = true; // elle est de nouveau solide
      planche.tombe = false; // la prochaine marche pourra la faire tomber
      this.tweens.add({ targets: planche.dessin, alpha: 1, duration: 300 }); // elle redevient visible
    });
  }

  // Un héros qui TOMBE sur un tambour rebondit très haut
  rebondirSurTambour(perso, tambour) {
    const surLeDessus = perso.body.velocity.y > 0 && perso.body.bottom < tambour.body.top + 16; // il tombe, et il est bien au-dessus
    if (surLeDessus == false || perso.enEchelle == true) {
      return; // pas un vrai atterrissage sur le tambour (ou sur une échelle) : rien ne se passe
    }
    perso.setVelocityY(FORCE_TAMBOUR); // on le relance vers le haut, très fort
    this.tweens.add({ targets: tambour, scaleY: 0.7, duration: 70, yoyo: true }); // le tambour s'écrase un instant
  }

  // Un héros posé sur une plateforme mobile doit être EMPORTÉ avec elle, sinon la plateforme glisse sous ses pieds
  emporterLesHeros() {
    this.mobiles.forEach((plateforme) => { // pour chaque plateforme mobile
      const dx = plateforme.x - plateforme.dernierX; // de combien elle a bougé en x depuis la dernière image
      const dy = plateforme.y - plateforme.dernierY; // et en y
      this.persos.forEach((perso) => { // pour chaque personnage
        const corps = perso.body;
        const surLaPlateforme = // vrai si le personnage est posé dessus
          Math.abs(corps.bottom - plateforme.body.top) < 6 && // ses pieds sont à la hauteur du dessus
          corps.right > plateforme.body.left && // et il est au-dessus de la plateforme (à gauche…
          corps.left < plateforme.body.right && // …et à droite)
          corps.velocity.y >= 0; // il ne monte pas (il tombe ou il est immobile)
        if (surLaPlateforme == true && perso.enEchelle == false) {
          perso.x += dx; // on le déplace du même déplacement que la plateforme
          perso.y += dy;
        }
      });
      plateforme.dernierX = plateforme.x; // on retient la nouvelle position pour la prochaine image
      plateforme.dernierY = plateforme.y;
    });
  }

  // Les tuiles marquées « estSolide » dans Tiled deviennent des rectangles invisibles solides.
  // On regroupe les tuiles voisines (d'abord en lignes, puis les lignes identiques empilées) pour en avoir peu.
  creerSolidesDepuisLesTuiles(carte) {
    const calque = carte.getLayer("calque_plateformes"); // le calque dont on lit les tuiles
    const estSolide = (ligne, colonne) => { // vrai si la tuile à cet endroit est marquée « solide » dans Tiled
      const tuile = colonne < carte.width ? calque.data[ligne][colonne] : null; // la tuile (ou rien, en dehors de la carte)
      return tuile != null && tuile.index != -1 && tuile.properties.estSolide == true;
    };

    // 1) les suites de tuiles solides sur chaque ligne
    const suites = []; // la liste des suites trouvées
    for (let ligne = 0; ligne < carte.height; ligne++) { // pour chaque ligne de la carte
      let debut = -1; // le début de la suite en cours (-1 = aucune)
      for (let colonne = 0; colonne <= carte.width; colonne++) { // on parcourt les colonnes (une de plus, pour fermer la dernière suite)
        if (estSolide(ligne, colonne) == true && debut == -1) {
          debut = colonne; // une suite commence
        } else if (estSolide(ligne, colonne) == false && debut != -1) {
          suites.push({ ligne: ligne, debut: debut, fin: colonne - 1 }); // la suite se termine : on la garde
          debut = -1;
        }
      }
    }

    // 2) deux suites l'une sous l'autre, de mêmes colonnes, forment un seul bloc
    const blocs = []; // la liste des blocs (plateformes)
    suites.forEach((suite) => {
      // on cherche un bloc qui finit juste au-dessus de cette suite, avec les mêmes colonnes
      const bloc = blocs.find((b) => b.debut == suite.debut && b.fin == suite.fin && b.ligneFin == suite.ligne - 1);
      if (bloc !== undefined) {
        bloc.ligneFin = suite.ligne; // on prolonge le bloc d'une ligne
      } else {
        blocs.push({ debut: suite.debut, fin: suite.fin, ligneDebut: suite.ligne, ligneFin: suite.ligne }); // nouveau bloc
      }
    });

    blocs.forEach((b) => { // pour chaque bloc trouvé
      const x = b.debut * TAILLE_TUILE; // position en pixels
      const y = b.ligneDebut * TAILLE_TUILE;
      const largeur = (b.fin - b.debut + 1) * TAILLE_TUILE; // largeur en pixels
      this.ajouterPlateforme({ x: x, y: y, width: largeur, height: (b.ligneFin - b.ligneDebut + 1) * TAILLE_TUILE }); // la zone solide

      // Le dessin : seulement pour le DESSUS d'une plateforme (pas pour les rangées en dessous) et pas pour
      // les marches de l'escalier (dessiné en un seul morceau dans poserDecor)
      let tuileAuDessus = false; // y a-t-il une tuile solide juste au-dessus du bloc ?
      for (let colonne = b.debut; colonne <= b.fin; colonne++) {
        if (estSolide(b.ligneDebut - 1, colonne) == true) {
          tuileAuDessus = true;
        }
      }
      const estUneMarche = largeur <= 32 && x >= 448 && x < 608 && y >= 320 && y < 480; // une marche de l'escalier retiré
      if (tuileAuDessus == false && estUneMarche == false) {
        this.dessinerPlateforme(x, y, largeur); // on dessine seulement le dessus
      }
    });
  }

  // Une plateforme = un rectangle invisible avec un corps statique (le décor est déjà dessiné par les tuiles)
  ajouterPlateforme(objet) {
    const zone = this.add.zone(objet.x + objet.width / 2, objet.y + objet.height / 2, objet.width, objet.height); // zone centrée
    this.groupe_plateformes.add(zone); // elle devient solide
    zone.unSens = objet.y < 640; // tout ce qui est au-dessus du sol (y < 640) : on traverse par le dessous
  }

  // --------------------------------------------------------------------------
  //  Objets : les notes de musique, la partition et la porte de sortie
  // --------------------------------------------------------------------------
  creerObjets() {
    this.creerTexturesNotes(); // les images des notes (dessinées par le code)

    this.groupe_notes = this.physics.add.group({ allowGravity: false }); // le groupe des notes, qui ne tombent pas
    POSITIONS_NOTES.forEach((position, i) => this.ajouterNote(position[0], position[1], i % 3, false)); // les 5 notes normales (couleur Do, Mi, Sol en alternance)
    this.ajouterNote(NOTE_BONUS.x, NOTE_BONUS.y, 2, true); // la note dorée bonus, en haut
    this.ajouterNote(NOTE_VOIE_HAUTE.x, NOTE_VOIE_HAUTE.y, 2, true); // 2e note dorée, au bout de la voie haute

    // La porte de sortie (même image que le niveau 1, en rouge), fermée au début
    this.porte = this.physics.add.staticSprite(PORTE.x, PORTE.solY - 60, "porte_sortie_rouge", 0); // la porte, image 0 = fermée
    this.porte.setDepth(3); // derrière les héros
    this.porteOuverte = false; // la porte est fermée au départ
    if (this.anims.exists("porte_ouvre_rouge") == false) { // on crée l'animation une seule fois
      this.anims.create({ key: "porte_ouvre_rouge", frames: this.anims.generateFrameNumbers("porte_sortie_rouge", { start: 0, end: 5 }), frameRate: 8, repeat: 0 });
    }

    this.creerPartition(); // la partition (verrouillée au départ)
  }

  // Les images des notes sont dessinées en code (blanches : on les colore ensuite avec setTint)
  creerTexturesNotes() {
    const dessin = this.make.graphics({ add: false }); // un pinceau qui ne s'affiche pas (on fabrique juste des images)
    if (this.textures.exists("tex_note") == false) { // la note simple, créée une seule fois
      dessin.fillStyle(0xffffff); // couleur blanche (on la colorera après)
      dessin.fillEllipse(10, 34, 17, 12); // la tête
      dessin.fillRect(15, 6, 3, 28); // la hampe
      dessin.fillTriangle(18, 6, 30, 20, 18, 16); // le crochet
      dessin.generateTexture("tex_note", 32, 44); // on transforme le dessin en image réutilisable
      dessin.clear(); // on efface le pinceau pour la suite
    }
    if (this.textures.exists("tex_note_double") == false) { // la note double (dorée bonus), créée une seule fois
      dessin.fillStyle(0xffffff);
      dessin.fillEllipse(9, 36, 15, 11).fillEllipse(29, 32, 15, 11); // deux têtes
      dessin.fillRect(13, 8, 3, 29).fillRect(33, 4, 3, 29); // deux hampes
      dessin.fillTriangle(13, 8, 36, 4, 36, 12).fillTriangle(13, 8, 36, 12, 13, 16); // la barre qui les relie
      dessin.generateTexture("tex_note_double", 44, 48);
      dessin.clear();
    }
    if (this.textures.exists("tex_etincelle") == false) { // une petite étincelle pour les particules
      dessin.fillStyle(0xffffff).fillCircle(4, 4, 4); // un petit rond blanc
      dessin.generateTexture("tex_etincelle", 8, 8);
    }
    dessin.destroy(); // on supprime le pinceau, il n'est plus utile
  }

  // Une note de musique à ramasser : colorée (Do rouge, Mi bleu, Sol doré), avec une petite lueur, qui flotte.
  // bonus = vrai pour une note dorée plus grosse qui rend un cœur.
  ajouterNote(x, y, indexCouleur, bonus) {
    const couleur = bonus == true ? 0xffd24a : COULEURS_NOTES[indexCouleur]; // doré pour le bonus, sinon la couleur de la liste
    const note = this.groupe_notes.create(x, y, bonus == true ? "tex_note_double" : "tex_note"); // l'image de la note
    note.setDepth(6).setTint(couleur); // devant le décor, colorée
    note.bonus = bonus; // on retient si c'est une note bonus
    note.couleur = couleur; // et sa couleur (pour la copie animée au ramassage)
    if (bonus == true) {
      note.setScale(1.25); // la note bonus est un peu plus grosse
    }
    note.lueur = this.lueur(x, y, bonus == true ? 0.6 : 0.42, 0.5, couleur, 5.9); // null en mode économique
    // la note (et sa lueur, s'il y en a une) flottent ensemble
    const flottent = note.lueur === null ? [note] : [note, note.lueur]; // ce qui doit monter et descendre
    this.tweens.add({ targets: flottent, y: y - 8, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" }); // léger va-et-vient
  }

  // La PARTITION : le fragment à récupérer. Visible dès le début mais éteinte et « verrouillée » ; elle s'illumine
  // quand on a ramassé les notes (voir revelerPartition). Halo, rayons, étincelles et flèche d'indication la mettent en valeur.
  creerPartition() {
    const x = PARTITION.x; // position de la partition
    const y = PARTITION.y;

    // les rayons de lumière qui tournent lentement derrière la partition (invisibles tant qu'elle est éteinte)
    // et le halo : ce sont des effets décoratifs, absents en mode économique (rayons et halo valent alors null)
    this.rayons = null; // pas de rayons par défaut
    this.halo_partition = null; // pas de halo par défaut
    this.etincelles = null; // pas d'étincelles par défaut
    if (this.modeLeger == false) { // seulement si l'ordinateur est assez rapide
      this.rayons = this.add.graphics({ x: x, y: y }).setDepth(5.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0); // les rayons, invisibles au départ
      this.rayons.fillStyle(0xffe6a0, 0.35); // couleur dorée et transparente
      for (let i = 0; i < 12; i++) { // 12 rayons, répartis en cercle
        const angle = (i * Math.PI * 2) / 12; // l'angle de ce rayon
        this.rayons.fillTriangle(0, 0, Math.cos(angle - 0.09) * 150, Math.sin(angle - 0.09) * 150, Math.cos(angle + 0.09) * 150, Math.sin(angle + 0.09) * 150); // un triangle fin, vers l'extérieur
      }
      this.halo_partition = this.lueur(x, y, 1.6, 0.35, 0x8fb4ff, 5.6); // lueur froide : verrouillée
      this.effets.push(this.rayons); // on le garde dans la liste des effets (mode économique)
    }

    // la partition elle-même : éteinte (grise, transparente) et sans collision tant que les notes ne sont pas ramassées
    this.partition = this.physics.add.image(x, y, "img_partition"); // l'image de la partition
    this.partition.setDisplaySize(84, 84).setDepth(7).setAlpha(0.6).setTint(0x8fa0c0); // taille, profondeur, transparence, couleur froide
    this.partition.body.setAllowGravity(false); // elle ne tombe pas
    this.partition.body.enable = false; // pas encore de collision : on ne peut pas la prendre
    this.echellePartition = this.partition.scaleX; // on retient sa taille normale, pour l'animation d'apparition
    const flottent = this.halo_partition === null ? [this.partition] : [this.partition, this.halo_partition]; // ce qui flotte
    this.tweens.add({ targets: flottent, y: y - 10, duration: 1000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" }); // léger va-et-vient

    this.etiquettePartition = this.add // le texte au-dessus de la partition
      .text(x, y - 78, "PARTITION verrouillée\n(ramasse " + NOTES_REQUISES + " notes)", {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: "12pt",
        color: "#cdd3e8",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4
      })
      .setOrigin(0.5) // centré sur son point
      .setDepth(8);

    // La flèche qui indique où est la partition quand elle est hors de l'écran
    this.indicateur = this.add.image(0, 0, "tex_fleche").setScrollFactor(0).setDepth(100).setVisible(false).setTint(0xffd24a).setScale(1.7);
  }

  // Les 3 notes sont ramassées : la partition s'illumine avec un grand effet
  revelerPartition() {
    this.partitionActive = true; // la partition peut maintenant être prise
    this.partition.body.enable = true; // elle devient solide (on peut la toucher)
    this.partition.clearTint().setAlpha(1); // elle reprend ses vraies couleurs, opaque
    this.partition.setScale(this.echellePartition * 0.2); // elle commence petite…
    this.tweens.add({ targets: this.partition, scale: this.echellePartition * 1.15, duration: 700, ease: "Back.easeOut" }); // …et grandit avec un petit rebond
    this.etiquettePartition.setText("PARTITION !").setColor("#ffe9a8").setFontSize("17pt"); // le texte devient doré et plus grand

    // halo qui pulse + rayons qui tournent + étincelles (effets décoratifs : absents en mode économique)
    if (this.modeLeger == false && this.halo_partition !== null && this.halo_partition.active == true) {
      this.halo_partition.setTint(0xffd98a); // la lueur devient chaude
      this.tweens.add({ targets: this.halo_partition, alpha: 0.5, scale: 1.9, duration: 500 }); // elle s'élargit
      this.tweens.add({ targets: this.halo_partition, scale: 2.3, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: 500 }); // et pulse en boucle
      this.tweens.add({ targets: this.rayons, alpha: 0.55, duration: 600 }); // les rayons apparaissent
      this.tweens.add({ targets: this.rayons, angle: 360, duration: 16000, repeat: -1 }); // ils tournent très lentement

      this.etincelles = this.add.particles(PARTITION.x, PARTITION.y, "tex_etincelle", { // un système de particules : des étincelles
        speed: { min: 30, max: 120 }, // vitesse aléatoire de chaque étincelle
        lifespan: 1000, // chaque étincelle vit 1 s
        scale: { start: 1.1, end: 0 }, // elle rétrécit jusqu'à disparaître
        alpha: { start: 1, end: 0 }, // elle s'efface
        tint: [0xffe08a, 0xffffff, 0xff9aa8], // trois couleurs possibles
        blendMode: "ADD", // elles s'éclaircissent entre elles
        frequency: 60, // une nouvelle étincelle toutes les 60 ms
        quantity: 1 // une à la fois
      });
      this.etincelles.setDepth(7.5); // devant la partition
      this.effets.push(this.etincelles); // on les garde dans la liste des effets (mode économique)
    }

    this.cameras.main.flash(400, 255, 232, 160); // éclair doré
    this.afficherMessage("La PARTITION est apparue en haut à droite ! Va la chercher !", 6000); // le message pendant 6 s
    this.iconeFragment.setTint(0xffd98a); // l'icône du fragment (en haut à droite) devient dorée
    this.tweens.add({ targets: this.iconeFragment, scale: this.iconeFragment.scale * 1.25, duration: 500, yoyo: true, repeat: -1 }); // et pulse
  }

  // Quand la partition est hors de l'écran, une flèche dorée au bord de l'écran montre sa direction
  mettreAJourIndicateur(temps) {
    if (this.partitionActive == false || this.partitionPrise == true) {
      this.indicateur.setVisible(false); // pas de flèche si la partition n'est pas encore active, ou déjà prise
      return;
    }
    const vue = this.cameras.main.worldView; // la partie du monde qui est affichée à l'écran
    const sx = this.partition.x - vue.x; // position de la partition à l'écran, en x
    const sy = this.partition.y - vue.y; // et en y
    const visible = sx > 60 && sx < 1220 && sy > 90 && sy < 660; // la partition est-elle déjà à l'écran (avec une marge) ?
    if (visible == true) {
      this.indicateur.setVisible(false); // inutile de montrer la flèche si on voit la partition
      return;
    }
    const cx = 640; // le centre de l'écran
    const cy = 360;
    const angle = Math.atan2(sy - cy, sx - cx); // la direction de la partition, depuis le centre de l'écran
    // on place la flèche sur le bord de l'écran, dans la direction de la partition
    const x = Phaser.Math.Clamp(cx + Math.cos(angle) * 700, 50, 1230); // limité aux bords (en x)
    const y = Phaser.Math.Clamp(cy + Math.sin(angle) * 700, 110, 650); // limité aux bords (en y)
    this.indicateur.setVisible(true).setPosition(x, y).setRotation(angle - Math.PI / 2); // on tourne la flèche vers la partition
    this.indicateur.setScale(1.7 + Math.sin(temps / 150) * 0.2); // elle pulse doucement
  }

  // update : appelée à chaque image. On reprend d'abord celle du niveau 1 (super.update), puis on ajoute le niveau 2
  update(temps, delta) {
    super.update(temps, delta); // le comportement du niveau 1 (héros, lampe, ennemis…)
    if (this.fini == false) { // tant que le niveau n'est pas fini
      this.emporterLesHeros(); // les héros suivent les plateformes mobiles
      this.mettreAJourIndicateur(temps); // la flèche vers la partition
    }
  }

  // Ramasser les notes et la partition, franchir la porte
  collisionsObjets() {
    // Tambours (rebond) et planches fragiles
    this.physics.add.overlap(this.persos, this.groupe_tambours, this.rebondirSurTambour, null, this); // toucher un tambour le fait rebondir
    this.physics.add.collider(this.persos, this.groupe_fragiles, this.planchePietinee, (perso, plateforme) => this.peutMarcherSur(perso, plateforme), this); // marcher sur une planche la fait trembler
    // Les héros marchent sur les plateformes mobiles (sauf s'ils sont sur une échelle)
    this.physics.add.collider(this.persos, this.groupe_mobiles, null, (perso, plateforme) => this.peutMarcherSur(perso, plateforme));
    this.physics.add.overlap(this.persos, this.groupe_notes, this.ramasserNote, null, this); // toucher une note la ramasse
    this.physics.add.overlap(this.persos, this.partition, this.ramasserFragment, null, this); // toucher la partition la prend
    this.physics.add.overlap(this.persos, this.porte, this.franchirPorte, null, this); // toucher la porte tente de la franchir
  }

  // Ramasser une note : elle disparaît, et on compte (une note dorée rend un cœur)
  ramasserNote(perso, note) {
    note.disableBody(true, true); // la note disparaît
    if (note.lueur !== null && note.lueur.active) {
      note.lueur.destroy(); // sa lueur disparaît aussi
    }
    // petit effet : une copie de la note monte en grossissant et s'efface
    const copie = this.add.image(note.x, note.y, note.texture.key).setTint(note.couleur).setDepth(7).setScale(note.scale); // une copie de la note
    this.tweens.add({ targets: copie, y: copie.y - 50, scale: note.scale * 1.8, alpha: 0, duration: 500, onComplete: () => copie.destroy() }); // elle monte et s'efface, puis disparaît

    if (note.bonus == true) {
      // la note dorée rend un cœur (sans dépasser le maximum)
      this.vies = Math.min(this.vies + 1, this.viesMax); // +1 cœur, plafonné au maximum
      this.majCoeurs(); // on met à jour l'affichage des cœurs
      this.afficherMessage("Note dorée ! +1 cœur", 3000);
      return; // une note bonus ne compte pas dans les 3 notes requises
    }

    this.notesRamassees += 1; // une note de plus
    this.texteNotes.setText(Math.min(this.notesRamassees, NOTES_REQUISES) + " / " + NOTES_REQUISES); // le compteur en haut à droite
    if (this.notesRamassees == NOTES_REQUISES) {
      this.revelerPartition(); // les 3 notes sont là : la partition s'illumine
    } else if (this.notesRamassees < NOTES_REQUISES) {
      this.afficherMessage("Note " + this.notesRamassees + " / " + NOTES_REQUISES, 1500); // un petit message d'avancement
    }
  }

  // Prendre la partition ouvre la porte (comme le parchemin du niveau 1)
  ramasserFragment(perso, partition) {
    if (this.partitionActive == false || this.partitionPrise == true) {
      return; // pas encore active, ou déjà prise : on ne fait rien
    }
    this.partitionPrise = true; // elle est maintenant prise
    this.fragmentRecupere = true; // le niveau sait que le fragment est gagné
    this.arreterSonPartition(); // le chœur s'arrête dès qu'on tient le fragment
    partition.disableBody(true, true); // la partition disparaît
    [this.etincelles, this.rayons, this.halo_partition, this.etiquettePartition, this.indicateur].forEach((objet) => { // tous les effets liés à la partition
      if (objet && objet.active) {
        if (objet.stop) {
          objet.stop(); // les étincelles arrêtent d'en produire
        }
        objet.setVisible(false); // et on les cache
      }
    });
    this.cameras.main.flash(300, 255, 240, 190); // petit flash
    this.porteOuverte = true; // la porte peut maintenant être franchie
    this.porte.anims.play("porte_ouvre_rouge"); // la porte s'ouvre
    this.tweens.killTweensOf(this.iconeFragment); // on arrête le pulsement de l'icône
    this.iconeFragment.clearTint().setScale(1); // l'icône reprend sa couleur et sa taille normales
    this.texteFragment.setText("1 / 1"); // le compteur de fragments passe à 1 / 1
    this.afficherMessage("PARTITION récupérée ! La porte est ouverte : rejoins-la !", 5000);
  }

  // Devant la porte : si elle est fermée on explique pourquoi, sinon le niveau est gagné
  franchirPorte() {
    if (this.porteOuverte == false) { // la porte est encore fermée
      if (this.time.now > (this.prochaineAlertePorte || 0)) { // on ne répète pas le message trop souvent
        const aide = this.partitionActive == true ? "Prends la PARTITION pour ouvrir la porte !" : "Ramasse " + NOTES_REQUISES + " notes pour révéler la PARTITION !";
        this.afficherMessage(aide, 2500); // on explique ce qu'il faut faire
        this.prochaineAlertePorte = this.time.now + 3000; // le prochain message dans 3 s au moins
      }
      return; // la porte reste fermée
    }
    super.franchirPorte(); // la porte est ouverte : on reprend la fin de niveau du niveau 1
  }

  // --------------------------------------------------------------------------
  //  Interface : celle du niveau 1 (la partition à droite, éteinte puis allumée) + un compteur de notes
  // --------------------------------------------------------------------------
  creerInterface() {
    super.creerInterface(); // d'abord l'interface du niveau 1 (cœurs, fragment…)
    const fixe = (objet) => objet.setScrollFactor(0).setDepth(100); // petite aide : objet fixe à l'écran, au-dessus de tout
    this.iconeNotes = fixe(this.add.image(1100, 44, "tex_note")).setTint(0xffd24a).setDisplaySize(24, 33); // l'icône de la note, en doré
    this.texteNotes = fixe( // le compteur de notes, à gauche de l'icône
      this.add
        .text(1074, 44, "0 / " + NOTES_REQUISES, {
          fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
          fontSize: "16pt",
          color: "#dfe6ff",
          stroke: "#000000",
          strokeThickness: 4
        })
        .setOrigin(1, 0.5) // aligné à droite
    );
  }
}
