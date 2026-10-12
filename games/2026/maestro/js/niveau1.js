// ============================================================================
//  js/niveau1.js — NIVEAU 1 : LES COULISSES (carte Tiled « coulisse »)
//
//  Objectif : monter jusqu'au PARCHEMIN (fragment de partition), puis franchir
//  la PORTE DE SORTIE. Pour atteindre le parchemin, le Détective doit révéler
//  les PASSERELLES FANTÔMES avec sa lampe, pendant que l'autre personnage saute dessus.
//
//  - Cantatrice (J1) : O = tire une onde · P = change de note (Do / Mi / Sol)
//  - Détective (J2)  : T = allume / éteint la lampe · haut / bas du joystick = oriente la lampe
//                      Y = recharge la batterie
//  - Les deux        : flèches ou ZQSD pour marcher, bouton A pour sauter,
//                      haut / bas devant une échelle pour monter / descendre
//  - Solo : le bouton D (K) change de personnage. Duo : chacun son personnage.
//
//  La carte vient de Tiled (assets/coulisse.json). On y lit des RECTANGLES posés
//  dans les calques d'objets "collisions" et "mecaniques" : c'est plus fiable
//  que de deviner les collisions à partir des images des tuiles.
//  Les touches sont dans controles.js, les chiffres d'équilibrage dans reglages.js.
// ============================================================================

import { REGLAGES } from "./reglages.js";
import { creerPanneau } from "./controles.js";

// ---- Dimensions du niveau (136 x 46 tuiles de 16 px) ----
const LARGEUR_MONDE = 2176;
const HAUTEUR_MONDE = 736;
const COULEUR_FOND = 0x090d17; // couleur de fond de la carte (réglée dans Tiled)
const OPACITE_FOND = 0.42; // opacité de l'image de fond (propriété fond_opacite de la carte)
const ECART_MAX_DUO = 1180; // en duo, les joueurs ne peuvent pas s'éloigner plus que ça (pour rester à l'écran)
const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';

// Les 3 notes de la Cantatrice (même ordre que les lignes de la planche d'onde)
const NOTES = [
  { nom: "do", texte: "DO", couleur: "#ff6b7d" },
  { nom: "mi", texte: "MI", couleur: "#62b0ff" },
  { nom: "sol", texte: "SOL", couleur: "#ffd24a" }
];

// La carte Tiled ne place pas d'ennemis : on les place ici (positions en pixels)
const TUBAS = [{ x: 1900, solY: 620, xMin: 1820, xMax: 1990 }]; // sur la grande plateforme du bas, entre les 2 échelles
const CRISTAUX = [
  { x: 700, y: 250 },
  { x: 1000, y: 340 },
  { x: 1620, y: 380 }
];

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  // ==========================================================================
  //  PRELOAD : la carte et ses images
  // ==========================================================================
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.tilemapTiledJSON("carte_coulisse", "./assets/coulisse.json");
    // Images de la carte. Si l'une manque, le niveau est quand même jouable :
    // il utilise alors un décor de secours (voir creerCarte).
    this.load.image("ts_plateformes", "./assets/plateformes-coulisses-grid-50.png");
    this.load.image("ts_complements", "./assets/coulisses_complements.png");
    this.load.image("img_lanterne", "./assets/lanterne_chinoise.png");
    this.load.image("img_fond_coulisse", "./assets/coulisse.jpg");
  }

  // ==========================================================================
  //  CREATE : on construit le niveau
  // ==========================================================================
  create() {
    // create() est rappelée à chaque (re)lancement : on remet tout à zéro
    this.mode = this.registry.get("mode") || "solo"; // "solo" ou "duo" (choisi dans choix_mode)
    this.fini = false; // vrai quand le niveau est gagné ou perdu
    this.fragmentRecupere = false;
    this.noteActuelle = 0; // 0 = Do, 1 = Mi, 2 = Sol
    this.lampe = { allumee: false, batterie: 100, angle: 0 }; // batterie en %, angle en degrés (0 = à l'horizontale)
    this.viesMax = this.mode == "duo" ? REGLAGES.vies.duo : REGLAGES.vies.solo;
    this.vies = this.viesMax; // les cœurs sont partagés entre les deux personnages
    this.messageJusqua = 0;

    // La gravité de CE niveau (les autres scènes du gabarit gardent la leur)
    this.physics.world.gravity.y = REGLAGES.gravite;
    this.physics.world.setBounds(0, 0, LARGEUR_MONDE, HAUTEUR_MONDE);
    // (gauche, droite, haut, bas) : le bas du monde ne bloque pas, on peut tomber dans le vide
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBackgroundColor(COULEUR_FOND);

    this.creerTexturesDeSecours();
    this.creerCarte();
    this.creerPersonnages();
    this.creerEnnemis();
    this.creerObjets();
    this.creerCollisions();
    this.creerCamera();
    this.creerInterface();

    this.afficherMessage(this.texteCommandes(), 7000);
  }

  // --------------------------------------------------------------------------
  //  Textures de secours dessinées en code (utilisées si les images de la carte manquent)
  // --------------------------------------------------------------------------
  creerTexturesDeSecours() {
    if (this.textures.exists("tex_echelle")) {
      return;
    }
    const pinceau = this.make.graphics({ add: false });

    // Échelle (16 x 16, se répète vers le haut avec un tileSprite)
    pinceau.fillStyle(0xb08a4a);
    pinceau.fillRect(1, 0, 2, 16).fillRect(13, 0, 2, 16); // les 2 montants
    pinceau.fillRect(1, 3, 14, 2).fillRect(1, 11, 14, 2); // les barreaux
    pinceau.generateTexture("tex_echelle", 16, 16);

    // Lanterne (40 x 64)
    pinceau.clear();
    pinceau.fillStyle(0xffd24a).fillRect(14, 0, 12, 6).fillRect(10, 10, 20, 4).fillRect(10, 50, 20, 4);
    pinceau.fillStyle(0x9a2a2a).fillRoundedRect(6, 14, 28, 36, 10);
    pinceau.fillStyle(0xffe9a0).fillRoundedRect(12, 20, 16, 24, 6);
    pinceau.fillStyle(0xffd24a).fillRect(19, 54, 2, 10);
    pinceau.generateTexture("tex_lanterne", 40, 64);
    pinceau.destroy();
  }

  // --------------------------------------------------------------------------
  //  La carte : fond, calques de tuiles, puis tous les objets posés dans Tiled
  // --------------------------------------------------------------------------
  creerCarte() {
    this.carte = this.add.tilemap("carte_coulisse");
    this.groupe_plateformes = this.physics.add.staticGroup(); // plateformes solides
    this.groupe_fantomes = this.physics.add.staticGroup(); // passerelles fantômes

    // Les images de tuiles sont-elles là ? (1er nom = nom du tileset dans Tiled, 2e nom = clé chargée dans preload)
    const tuilesPlateformes = this.textures.exists("ts_plateformes")
      ? this.carte.addTilesetImage("plateformes_coulisses_niveau1", "ts_plateformes")
      : null;
    const tuilesComplements = this.textures.exists("ts_complements")
      ? this.carte.addTilesetImage("coulisses_complements", "ts_complements")
      : null;
    // Chaque jeu d'images est indépendant : s'il manque, on dessine un décor de secours à la place
    this.avecTuilesPlateformes = tuilesPlateformes != null;
    this.avecTuilesComplements = tuilesComplements != null;

    this.creerFond();
    this.creerCalquesDeTuiles(tuilesPlateformes, tuilesComplements);

    // ---- Les objets de la carte ----
    const objetsDe = (calque) => this.carte.getObjectLayer(calque).objects;
    const mecaniques = objetsDe("mecaniques");
    const deType = (type) => mecaniques.filter((objet) => objet.type == type);

    // Plateformes solides (calque "collisions")
    objetsDe("collisions").forEach((objet) => this.ajouterPlateforme(objet));

    // Échelles : on garde le point où le personnage se tient en haut et en bas (= dessus des plateformes)
    this.echelles = deType("echelle").map((objet) => {
      if (this.avecTuilesComplements == false) {
        this.add.tileSprite(objet.x + 8, objet.y + objet.height / 2, 16, objet.height, "tex_echelle").setDepth(3);
      }
      return {
        centreX: objet.x + objet.width / 2,
        haut: objet.y + 12, // le haut de l'échelle dépasse de 12 px au-dessus de la plateforme
        bas: objet.y + objet.height - 12
      };
    });

    // Passerelles fantômes (les "marche_chrono")
    deType("pont_temporaire").forEach((objet) => this.ajouterFantome(objet));

    // Points de départ, ligne de chute, porte et parchemin : on mémorise leur position
    const depart = (nom) => deType("depart").find((objet) => objet.name == nom);
    this.departs = { j1: depart("depart_j1"), j2: depart("depart_j2") };
    this.yChute = deType("danger")[0].y; // sous cette ligne : on tombe dans le vide
    this.rectSortie = deType("sortie")[0];
    this.objetPartition = deType("partition")[0];

    // Lanternes décoratives
    deType("lampe").forEach((objet) => {
      const cle = this.textures.exists("img_lanterne") ? "img_lanterne" : "tex_lanterne";
      this.add.image(objet.x + 20, objet.y + 32, cle).setDisplaySize(40, 64).setDepth(4);
      // petite lueur autour de la lanterne
      this.add
        .image(objet.x + 20, objet.y + 32, "tex_lumiere")
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(0.6)
        .setAlpha(0.4)
        .setDepth(4);
    });

    // Deux panneaux d'indication posés dans le décor
    const style = {
      fontFamily: POLICE,
      fontSize: "13pt",
      color: "#ffe9a8",
      align: "center",
      stroke: "#000000",
      strokeThickness: 4,
      backgroundColor: "#000000aa", // fond sombre semi-transparent pour bien lire sur le décor
      padding: { x: 10, y: 6 }
    };
    this.add
      .text(960, 255, "Passerelles fantômes !\nDétective : allume la lampe (B) et oriente-la (haut / bas)", style)
      .setOrigin(0.5)
      .setDepth(6);
    this.add.text(1880, 560, "Un TUBA hanté patrouille...\nÉtourdis-le avec une onde (B) et passe !", style).setOrigin(0.5).setDepth(6);
  }

  // Le fond : l'image de la carte (coulisse.jpg) si elle est là, sinon fond_niveau1.jpg.
  // Dans les deux cas l'image est ÉTIRÉE pour couvrir toute la carte, quelle que soit sa taille d'origine.
  creerFond() {
    if (this.textures.exists("img_fond_coulisse")) {
      this.add
        .image(0, 0, "img_fond_coulisse")
        .setOrigin(0, 0)
        .setDisplaySize(LARGEUR_MONDE, HAUTEUR_MONDE)
        .setAlpha(OPACITE_FOND)
        .setDepth(0);
    } else {
      this.add.image(0, 0, "img_fond_niveau1").setOrigin(0, 0).setDisplaySize(LARGEUR_MONDE, HAUTEUR_MONDE).setDepth(0);
    }
  }

  // Les calques de tuiles de Tiled (leurs noms doivent être ceux de Tiled), du plus loin au plus proche.
  // Chaque calque n'utilise qu'UN des deux jeux d'images : on ne crée que ceux dont l'image est présente.
  creerCalquesDeTuiles(tuilesPlateformes, tuilesComplements) {
    // Calques dessinés avec coulisses_complements.png : la structure et les échelles
    if (tuilesComplements != null) {
      this.carte.createLayer("structure", tuilesComplements).setDepth(1).setAlpha(0.65);
      this.carte.createLayer("echelles", tuilesComplements).setDepth(3);
    }
    // Calques dessinés avec plateformes-coulisses-grid-50.png : plateformes, décors, passerelles
    if (tuilesPlateformes != null) {
      this.carte.createLayer("plateformes_tuiles", tuilesPlateformes).setDepth(2);
      this.carte.createLayer("decorations", tuilesPlateformes).setDepth(4);
      // Les passerelles fantômes : chaque tuile aura son propre alpha (voir afficherFantome)
      this.calque_passerelles = this.carte.createLayer("passerelles_temporaires", tuilesPlateformes).setDepth(5);
      this.calque_passerelles.forEachTile((tuile) => {
        tuile.alpha = 0; // invisibles tant qu'elles ne sont pas éclairées
      });
    }
  }

  // Une plateforme solide = un rectangle invisible avec un corps statique (qui ne bouge pas)
  ajouterPlateforme(objet) {
    const zone = this.add.zone(objet.x + objet.width / 2, objet.y + objet.height / 2, objet.width, objet.height);
    this.groupe_plateformes.add(zone); // ajouter au groupe statique lui donne un corps solide
    if (this.avecTuilesPlateformes == false) {
      // décor de secours : on dessine la plateforme en bois
      this.add.tileSprite(zone.x, zone.y, objet.width, objet.height, "tex_bois").setDepth(2);
    }
  }

  // Une passerelle fantôme : solide seulement quand la lampe l'éclaire
  ajouterFantome(objet) {
    const zone = this.add.zone(objet.x + objet.width / 2, objet.y + objet.height / 2, objet.width, objet.height);
    this.groupe_fantomes.add(zone);
    zone.setData("allumee", false); // éclairée ? (mis à jour à chaque image)
    zone.rect = new Phaser.Geom.Rectangle(objet.x, objet.y, objet.width, objet.height); // pour mesurer la distance à la lumière
    zone.eclaireJusqua = 0; // reste solide jusqu'à cet instant (ms)
    zone.alphaVisuel = 0; // 0 = invisible, 1 = bien visible (monte et descend en douceur)

    if (this.avecTuilesPlateformes == true) {
      // les tuiles de la passerelle dessinées dans Tiled : la surface + une rangée au-dessus et une en dessous
      zone.tuiles = [];
      for (let colonne = objet.x / 16; colonne < (objet.x + objet.width) / 16; colonne++) {
        for (let ligne = objet.y / 16 - 1; ligne <= objet.y / 16 + 1; ligne++) {
          const tuile = this.calque_passerelles.getTileAt(colonne, ligne);
          if (tuile != null) {
            zone.tuiles.push(tuile);
          }
        }
      }
    } else {
      zone.visuel = this.add.tileSprite(zone.x, zone.y, objet.width, objet.height, "tex_fantome").setDepth(5).setAlpha(0);
    }
  }

  // --------------------------------------------------------------------------
  //  Personnages : Cantatrice (J1) et Détective (J2)
  // --------------------------------------------------------------------------
  creerPersonnages() {
    const j1 = creerPanneau(this, "j1"); // touches du joueur 1
    const j2 = creerPanneau(this, "j2"); // touches du joueur 2

    // En duo chacun a ses touches. En solo, les deux joysticks fonctionnent pour le perso actif.
    const touchesCantatrice = this.mode == "duo" ? [j1] : [j1, j2];
    const touchesDetective = this.mode == "duo" ? [j2] : [j1, j2];

    this.cantatrice = this.creerPersonnage("cantatrice", this.departs.j1, touchesCantatrice);
    this.detective = this.creerPersonnage("detective", this.departs.j2, touchesDetective);
    this.persos = [this.cantatrice, this.detective];
    this.actif = this.cantatrice; // en solo : le personnage qu'on contrôle en ce moment

    this.groupe_ondes = this.physics.add.group({ allowGravity: false }); // ondes de la Cantatrice

    // Lumière de la lampe (additive = elle éclaircit ce qu'elle recouvre) : un cône + 2 taches de lumière
    this.faisceau = this.add.graphics().setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
    this.halo = this.add.image(0, 0, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setDepth(15).setVisible(false);
    this.halo.setScale((REGLAGES.lampe.rayon * 2) / 256);
    this.haloProche = this.add.image(0, 0, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setDepth(15).setVisible(false);
    this.haloProche.setScale((REGLAGES.lampe.rayonProche * 2) / 256);
  }

  // point = l'objet "depart" de Tiled (x, y = où les pieds se posent)
  creerPersonnage(nom, point, touches) {
    const perso = this.physics.add.sprite(point.x, point.y - 40, nom + "_idle");
    perso.setDepth(10);
    perso.setCollideWorldBounds(true);
    // Hitbox plus petite que l'image de 64 x 64 : seulement le corps, pieds en bas de l'image
    perso.body.setSize(24, 54, false);
    perso.body.setOffset(20, 9);
    // Vitesse de chute limitée : les plateformes ne font que 16 px d'épaisseur, il ne faut pas les traverser
    perso.body.setMaxVelocity(600, 800);
    perso.play(nom + "_idle");

    perso.nom = nom; // "cantatrice" ou "detective"
    perso.touches = touches; // liste des claviers qui le contrôlent
    perso.regardeADroite = true;
    perso.enEchelle = false; // vrai quand le personnage est accroché à une échelle
    perso.invincibleJusqua = 0; // pas de dégâts avant cet instant (ms)
    perso.sonneJusqua = 0; // choc : pas de contrôle avant cet instant (ms)
    perso.tireJusqua = 0; // animation de tir / d'allumage en cours jusqu'à cet instant (ms)
    perso.dernierTir = -9999;
    return perso;
  }

  // --------------------------------------------------------------------------
  //  Ennemis : Tubas qui patrouillent et Cristaux (positions en haut du fichier)
  // --------------------------------------------------------------------------
  creerEnnemis() {
    this.groupe_tubas = this.physics.add.group();
    this.groupe_cristaux = this.physics.add.group({ allowGravity: false }); // les cristaux flottent
    this.groupe_ondes_ennemies = this.physics.add.group({ allowGravity: false }); // ondes du Tuba

    TUBAS.forEach((t) => this.creerTuba(t.x, t.solY, t.xMin, t.xMax));
    CRISTAUX.forEach((c) => this.creerCristal(c.x, c.y));
  }

  creerTuba(x, solY, xMin, xMax) {
    const tuba = this.groupe_tubas.create(x, solY - 40, "tuba_walk");
    tuba.setDepth(9);
    tuba.body.setSize(40, 50, false);
    tuba.body.setOffset(12, 14);
    tuba.body.setMaxVelocity(300, 800);
    tuba.play("tuba_walk");
    tuba.xMin = xMin;
    tuba.xMax = xMax;
    tuba.sens = 1; // 1 = vers la droite, -1 = vers la gauche
    tuba.etourdiJusqua = 0;
    tuba.attaqueJusqua = 0;
    tuba.prochaineOnde = this.time.now + REGLAGES.tuba.ondeToutesMs;
  }

  creerCristal(x, y) {
    const cristal = this.groupe_cristaux.create(x, y, "cristal_idle");
    cristal.setDepth(9);
    cristal.setCollideWorldBounds(true);
    cristal.body.setCircle(20, 12, 16); // hitbox ronde
    cristal.play("cristal_idle");
    cristal.pv = REGLAGES.cristal.pv; // points de vie : 2 ondes pour le détruire
    cristal.etourdiJusqua = 0;
    cristal.mort = false;
  }

  // --------------------------------------------------------------------------
  //  Objets : le parchemin (fragment de partition) et la porte de sortie
  // --------------------------------------------------------------------------
  creerObjets() {
    // Le parchemin : dans Tiled c'est un objet-image, son point (x, y) est en BAS à gauche
    const p = this.objetPartition;
    this.partition = this.physics.add.image(p.x + p.width / 2, p.y - p.height / 2, "img_partition");
    this.partition.setDisplaySize(p.width, p.height).setDepth(6);
    this.partition.body.setAllowGravity(false);
    this.tweens.add({
      targets: this.partition,
      y: this.partition.y - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // La porte (image 96 x 120), fermée au début : frame 0. On la pose sur la plateforme de sortie.
    const s = this.rectSortie;
    this.porte = this.physics.add.staticSprite(s.x + s.width / 2, s.y + s.height - 16 - 60, "porte_sortie", 0);
    this.porte.setDepth(3);
    this.porteOuverte = false;
  }

  // --------------------------------------------------------------------------
  //  Collisions : qui touche qui
  // --------------------------------------------------------------------------
  creerCollisions() {
    // Les personnages marchent sur les plateformes, sauf quand ils sont accrochés à une échelle
    // (la 3e fonction est une CONDITION : si elle renvoie false, il n'y a pas de collision)
    this.physics.add.collider(this.persos, this.groupe_plateformes, null, function (perso) {
      return perso.enEchelle != true;
    });
    this.physics.add.collider(this.groupe_tubas, this.groupe_plateformes);

    // Les passerelles fantômes ne sont solides que si elles sont éclairées
    this.physics.add.collider(this.persos, this.groupe_fantomes, null, function (perso, plateforme) {
      return plateforme.getData("allumee") == true && perso.enEchelle != true;
    });

    // Les ondes s'arrêtent sur les plateformes
    this.physics.add.collider(this.groupe_ondes, this.groupe_plateformes, function (onde) {
      onde.destroy();
    });
    this.physics.add.collider(this.groupe_ondes_ennemies, this.groupe_plateformes, function (onde) {
      onde.destroy();
    });

    // Onde de la Cantatrice -> ennemi touché ; contact ennemi -> personnage blessé
    [this.groupe_tubas, this.groupe_cristaux].forEach((groupe) => {
      this.physics.add.overlap(this.groupe_ondes, groupe, this.ondeTouche, null, this);
      this.physics.add.overlap(this.persos, groupe, this.contactEnnemi, null, this);
    });
    this.physics.add.overlap(this.persos, this.groupe_ondes_ennemies, this.ondeEnnemieTouche, null, this);

    // Ramasser le parchemin, franchir la porte
    this.physics.add.overlap(this.persos, this.partition, this.ramasserFragment, null, this);
    this.physics.add.overlap(this.persos, this.porte, this.franchirPorte, null, this);
  }

  // --------------------------------------------------------------------------
  //  Caméra : solo = suit le perso actif · duo = suit le milieu des deux joueurs
  // --------------------------------------------------------------------------
  creerCamera() {
    this.cameras.main.setBounds(0, 0, LARGEUR_MONDE, HAUTEUR_MONDE);
    // Une "cible" invisible que la caméra suit ; on la déplace à chaque image
    this.cible_camera = this.add.zone(this.cantatrice.x, HAUTEUR_MONDE / 2, 10, 10);
    this.cameras.main.startFollow(this.cible_camera, true, 0.08, 0.08);
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  // --------------------------------------------------------------------------
  //  Interface (fixée à l'écran : setScrollFactor(0)) : cœurs, note, batterie, fragment
  // --------------------------------------------------------------------------
  creerInterface() {
    const fixe = (objet) => objet.setScrollFactor(0).setDepth(100);

    // Cœurs en haut à gauche
    this.coeurs = [];
    for (let i = 0; i < this.viesMax; i++) {
      this.coeurs.push(fixe(this.add.image(32 + i * 36, 30, "tex_coeur")));
    }

    // Note choisie par la Cantatrice
    this.texteNote = fixe(
      this.add.text(18, 56, "", { fontFamily: POLICE, fontSize: "15pt", fontStyle: "bold", stroke: "#000000", strokeThickness: 4 })
    );

    // Batterie de la lampe du Détective
    this.texteLampe = fixe(
      this.add.text(18, 86, "LAMPE", { fontFamily: POLICE, fontSize: "13pt", color: "#ffe9a8", stroke: "#000000", strokeThickness: 4 })
    );
    this.barreBatterie = fixe(this.add.graphics());

    // Fragment de partition en haut à droite
    this.iconeFragment = fixe(this.add.image(1236, 44, "img_partition")).setDisplaySize(54, 54).setTint(0x444444);
    this.texteFragment = fixe(
      this.add
        .text(1200, 44, "0 / 1", { fontFamily: POLICE, fontSize: "16pt", color: "#dfe6ff", stroke: "#000000", strokeThickness: 4 })
        .setOrigin(1, 0.5)
    );

    // Message temporaire au centre en bas
    this.texteMessage = fixe(
      this.add
        .text(640, 676, "", {
          fontFamily: POLICE,
          fontSize: "14pt",
          color: "#ffffff",
          align: "center",
          stroke: "#000000",
          strokeThickness: 5
        })
        .setOrigin(0.5)
    );

    // En solo : une petite flèche dorée au-dessus du personnage qu'on contrôle
    this.fleche = this.add.image(0, 0, "tex_fleche").setDepth(20).setVisible(this.mode == "solo");

    this.majCoeurs();
    this.majNote();
  }

  // ==========================================================================
  //  UPDATE : appelée environ 60 fois par seconde
  // ==========================================================================
  update(temps, delta) {
    if (this.fini == true) {
      return; // niveau gagné ou perdu : on fige le jeu (les animations de fin jouent toutes seules)
    }

    // Solo : le bouton D change de personnage
    if (this.mode == "solo" && this.toucheAppuyee(this.actif, "D")) {
      this.changerDePerso();
    }

    this.persos.forEach((perso) => this.gererPersonnage(perso, temps, delta));
    this.mettreAJourLampe(temps, delta);
    this.actualiserFantomes(temps);

    this.groupe_tubas.getChildren().forEach((tuba) => this.mettreAJourTuba(tuba, temps));
    this.groupe_cristaux.getChildren().forEach((cristal) => this.mettreAJourCristal(cristal, temps));
    this.nettoyerOndes();
    this.verifierChutes();

    if (this.mode == "duo") {
      this.limiterEcartDuo();
    }
    this.mettreAJourCamera();
    this.mettreAJourInterface(temps);
  }

  // --------------------------------------------------------------------------
  //  Lecture des touches (un perso peut avoir plusieurs claviers : voir creerPersonnages)
  // --------------------------------------------------------------------------
  toucheEnfoncee(perso, bouton) {
    return perso.touches.some((clavier) => clavier[bouton].isDown);
  }

  // Vrai UNE SEULE FOIS par appui (pas tant que la touche reste enfoncée)
  toucheAppuyee(perso, bouton) {
    return perso.touches.map((clavier) => Phaser.Input.Keyboard.JustDown(clavier[bouton])).includes(true);
  }

  // --------------------------------------------------------------------------
  //  Un personnage : échelle, déplacement, saut, pouvoir, animation
  // --------------------------------------------------------------------------
  gererPersonnage(perso, temps, delta) {
    // En duo les deux jouent. En solo, seul le personnage actif obéit aux touches.
    const controle = this.mode == "duo" || perso == this.actif;
    const sonne = temps < perso.sonneJusqua; // vient d'être touché : pas de contrôle un court instant

    this.gererEchelle(perso, controle, sonne);
    const aTerre = perso.body.blocked.down || perso.body.touching.down;

    let direction = 0; // -1 gauche, 0 immobile, 1 droite
    if (controle && sonne == false && perso.enEchelle == false) {
      if (this.toucheEnfoncee(perso, "gauche")) {
        direction = -1;
      } else if (this.toucheEnfoncee(perso, "droite")) {
        direction = 1;
      }
    }

    // Sur une échelle, la vitesse est gérée par gererEchelle
    if (sonne == false && perso.enEchelle == false) {
      perso.setVelocityX(direction * REGLAGES.vitesse);
    }
    if (direction != 0) {
      perso.regardeADroite = direction > 0;
      perso.setFlipX(direction < 0); // les images regardent vers la droite : on les retourne
    }

    if (controle && sonne == false) {
      // Bouton A : sauter (seulement depuis le sol)
      if (perso.enEchelle == false && this.toucheAppuyee(perso, "A") && aTerre) {
        perso.setVelocityY(REGLAGES.saut);
      }
      // Pouvoir propre à chaque personnage
      if (perso.nom == "cantatrice") {
        this.pouvoirCantatrice(perso, temps);
      } else {
        this.pouvoirDetective(perso, temps, delta);
      }
    }

    // ---- Quelle animation jouer ? (par ordre de priorité) ----
    let anim = "idle";
    if (sonne) {
      anim = "hurt";
    } else if (perso.enEchelle == true) {
      anim = perso.body.velocity.y != 0 ? "walk" : "idle"; // il "marche" en grimpant
    } else if (temps < perso.tireJusqua) {
      anim = "shoot";
    } else if (aTerre == false) {
      anim = "jump";
    } else if (direction != 0) {
      anim = "walk";
    }
    this.jouerAnimation(perso, perso.nom + "_" + anim);
  }

  // Lance l'animation seulement si ce n'est pas déjà celle qui joue (sinon elle recommencerait sans cesse)
  jouerAnimation(sprite, cle) {
    if (sprite.anims.currentAnim == null || sprite.anims.currentAnim.key != cle) {
      sprite.anims.play(cle);
    }
  }

  // --------------------------------------------------------------------------
  //  Échelles : haut / bas du joystick devant une échelle pour s'y accrocher
  // --------------------------------------------------------------------------
  gererEchelle(perso, controle, sonne) {
    const corps = perso.body;
    const pied = corps.bottom; // hauteur des pieds

    // L'échelle devant le personnage : alignée en x, et les pieds entre le haut et le bas de l'échelle
    const echelle = this.echelles.find(function (e) {
      return Math.abs(corps.center.x - e.centreX) <= 16 && pied >= e.haut - 3 && pied <= e.bas + 3;
    });

    if (sonne == true) {
      this.lacherEchelle(perso); // un coup fait lâcher prise
      return;
    }

    // S'accrocher : on monte (sauf si on est déjà tout en haut) ou on descend (sauf si on est tout en bas)
    if (perso.enEchelle == false && controle == true && echelle !== undefined) {
      const veutMonter = this.toucheEnfoncee(perso, "haut") && pied > echelle.haut + 2;
      const veutDescendre = this.toucheEnfoncee(perso, "bas") && pied < echelle.bas - 2;
      if (veutMonter || veutDescendre) {
        perso.enEchelle = true;
      }
    }
    if (perso.enEchelle == false) {
      return;
    }

    // Accroché : si on n'est plus devant une échelle, on lâche
    if (echelle === undefined) {
      this.lacherEchelle(perso);
      return;
    }
    let vitesseY = 0;
    if (controle == true) {
      if (this.toucheEnfoncee(perso, "haut")) {
        vitesseY = -REGLAGES.echelle.vitesse;
      } else if (this.toucheEnfoncee(perso, "bas")) {
        vitesseY = REGLAGES.echelle.vitesse;
      }
      // Bouton A : on saute de l'échelle
      if (this.toucheAppuyee(perso, "A")) {
        this.lacherEchelle(perso);
        perso.setVelocityY(REGLAGES.saut);
        return;
      }
    }
    perso.body.setAllowGravity(false); // pas de gravité sur l'échelle
    perso.setVelocity(0, vitesseY);
    perso.x = echelle.centreX;

    // Arrivé en haut ou en bas : on se pose sur la plateforme et on lâche l'échelle
    if (vitesseY < 0 && pied <= echelle.haut) {
      perso.y += echelle.haut - pied;
      this.lacherEchelle(perso);
    } else if (vitesseY > 0 && pied >= echelle.bas) {
      perso.y -= pied - echelle.bas;
      this.lacherEchelle(perso);
    }
  }

  lacherEchelle(perso) {
    perso.enEchelle = false;
    perso.body.setAllowGravity(true);
  }

  // --------------------------------------------------------------------------
  //  Pouvoirs
  // --------------------------------------------------------------------------
  pouvoirCantatrice(perso, temps) {
    // Bouton C : changer de note (Do -> Mi -> Sol -> Do...)
    if (this.toucheAppuyee(perso, "C")) {
      this.noteActuelle = (this.noteActuelle + 1) % NOTES.length;
      this.majNote();
    }
    // Bouton B : chanter une onde (tenir appuyé = une onde toutes les 500 ms)
    if (this.toucheEnfoncee(perso, "B") && temps - perso.dernierTir >= REGLAGES.onde.cadenceMs) {
      perso.dernierTir = temps;
      perso.tireJusqua = temps + 500;
      perso.anims.play("cantatrice_shoot"); // on force le redémarrage de l'animation
      this.lancerOnde(perso);
    }
  }

  lancerOnde(perso) {
    const sens = perso.regardeADroite ? 1 : -1;
    const onde = this.groupe_ondes.create(perso.x + sens * 30, perso.y - 14, "onde");
    onde.setDepth(8);
    onde.setScale(1.5);
    onde.setFlipX(sens < 0);
    onde.play("onde_" + NOTES[this.noteActuelle].nom); // la couleur dépend de la note choisie
    onde.body.setSize(22, 18);
    onde.setVelocityX(sens * REGLAGES.onde.vitesse);
    onde.xDepart = onde.x; // pour savoir quand elle a parcouru sa portée maximale
  }

  pouvoirDetective(perso, temps, delta) {
    // Bouton B : allumer / éteindre la lampe
    if (this.toucheAppuyee(perso, "B")) {
      if (this.lampe.allumee == true) {
        this.lampe.allumee = false;
      } else if (this.lampe.batterie > 0) {
        this.lampe.allumee = true;
        this.lampe.angle = 0; // on repart avec la lampe à l'horizontale
        perso.tireJusqua = temps + 500;
        perso.anims.play("detective_shoot"); // le faisceau de la lampe apparaît dans l'animation
      } else {
        this.afficherMessage("Batterie vide ! Appuie sur le bouton C pour recharger", 2500);
      }
    }
    // Bouton C : recharger la batterie (appuis répétés)
    if (this.toucheAppuyee(perso, "C")) {
      this.lampe.batterie = Math.min(100, this.lampe.batterie + REGLAGES.lampe.rechargeParAppui);
    }
    // Haut / bas du joystick : orienter la lampe (sauf sur une échelle, où ils servent à grimper)
    if (this.lampe.allumee == true && perso.enEchelle == false) {
      const pas = REGLAGES.lampe.vitesseVisee * (delta / 1000);
      if (this.toucheEnfoncee(perso, "haut")) {
        this.lampe.angle += pas;
      }
      if (this.toucheEnfoncee(perso, "bas")) {
        this.lampe.angle -= pas;
      }
      this.lampe.angle = Phaser.Math.Clamp(this.lampe.angle, -REGLAGES.lampe.angleMax, REGLAGES.lampe.angleMax);
    }
  }

  // Où pointe la lampe : origine (la main du Détective), direction, et centre de la tache de lumière
  calculerFaisceau() {
    const detective = this.detective;
    const sens = detective.regardeADroite ? 1 : -1; // la lampe suit le regard du Détective
    const angle = Phaser.Math.DegToRad(this.lampe.angle); // positif = vers le haut
    const dx = sens * Math.cos(angle);
    const dy = -Math.sin(angle);
    const ox = detective.body.center.x + sens * 16;
    const oy = detective.body.center.y - 6;
    return { ox: ox, oy: oy, dx: dx, dy: dy, cx: ox + dx * REGLAGES.lampe.portee, cy: oy + dy * REGLAGES.lampe.portee };
  }

  // La batterie se vide tant que la lampe est allumée (même si on joue l'autre personnage)
  mettreAJourLampe(temps, delta) {
    const lampe = this.lampe;
    if (lampe.allumee == true) {
      lampe.batterie -= (delta / 1000) * (100 / REGLAGES.lampe.batterieSec);
      if (lampe.batterie <= 0) {
        lampe.batterie = 0;
        lampe.allumee = false;
      }
    }

    this.faisceau.clear();
    this.halo.setVisible(lampe.allumee);
    this.haloProche.setVisible(lampe.allumee);
    if (lampe.allumee == false) {
      return;
    }
    // batterie faible : la lumière clignote
    const faible = lampe.batterie <= REGLAGES.lampe.seuilClignote;
    const intensite = faible && Math.floor(temps / 120) % 2 == 0 ? 0.3 : 1;

    const f = this.calculerFaisceau();
    // le cône de lumière : un triangle de la main du Détective jusqu'à la tache de lumière
    const nx = -f.dy; // perpendiculaire à la direction, pour donner sa largeur au cône
    const ny = f.dx;
    const largeur = REGLAGES.lampe.rayon * 0.6;
    this.faisceau.fillStyle(0xffe9a0, 0.2 * intensite);
    this.faisceau.fillTriangle(f.ox, f.oy, f.cx + nx * largeur, f.cy + ny * largeur, f.cx - nx * largeur, f.cy - ny * largeur);
    this.halo.setPosition(f.cx, f.cy).setAlpha(intensite);
    this.haloProche.setPosition(this.detective.body.center.x, this.detective.body.center.y).setAlpha(0.7 * intensite);
  }

  // Distance entre un point et un rectangle (0 si le point est dedans)
  distanceAuRectangle(x, y, rectangle) {
    const xProche = Phaser.Math.Clamp(x, rectangle.left, rectangle.right);
    const yProche = Phaser.Math.Clamp(y, rectangle.top, rectangle.bottom);
    return Phaser.Math.Distance.Between(x, y, xProche, yProche);
  }

  // Une passerelle fantôme est éclairée si la tache de lumière de la lampe la touche,
  // ou si elle est tout près du Détective. Elle reste ensuite solide un petit moment.
  actualiserFantomes(temps) {
    const lampe = this.lampe;
    const centre = this.detective.body.center;
    const faisceau = lampe.allumee == true ? this.calculerFaisceau() : null;

    this.groupe_fantomes.getChildren().forEach((passerelle) => {
      if (faisceau !== null) {
        const dansLaTache = this.distanceAuRectangle(faisceau.cx, faisceau.cy, passerelle.rect) <= REGLAGES.lampe.rayon;
        const toutPres = this.distanceAuRectangle(centre.x, centre.y, passerelle.rect) <= REGLAGES.lampe.rayonProche;
        if (dansLaTache || toutPres) {
          passerelle.eclaireJusqua = temps + REGLAGES.lampe.persistanceMs;
        }
      }
      // lampe éteinte (ou batterie vide) : la passerelle disparaît tout de suite
      const eclairee = lampe.allumee == true && temps < passerelle.eclaireJusqua;
      passerelle.setData("allumee", eclairee);

      // elle apparaît / disparaît en douceur
      passerelle.alphaVisuel = Phaser.Math.Linear(passerelle.alphaVisuel, eclairee ? 1 : 0, 0.25);
      this.afficherFantome(passerelle, passerelle.alphaVisuel);
    });
  }

  afficherFantome(passerelle, alpha) {
    if (passerelle.visuel !== undefined) {
      passerelle.visuel.setAlpha(alpha); // décor de secours
    } else {
      passerelle.tuiles.forEach((tuile) => {
        tuile.alpha = alpha; // tuiles de la carte
      });
    }
  }

  // --------------------------------------------------------------------------
  //  Solo : changer de personnage
  // --------------------------------------------------------------------------
  changerDePerso() {
    this.actif = this.actif == this.cantatrice ? this.detective : this.cantatrice;
    // petit flash blanc pour montrer qui est actif maintenant
    const nouveau = this.actif;
    nouveau.setTintFill(0xffffff);
    this.time.delayedCall(120, () => nouveau.clearTint());
  }

  // --------------------------------------------------------------------------
  //  Ennemis
  // --------------------------------------------------------------------------
  mettreAJourTuba(tuba, temps) {
    if (tuba.active == false) {
      return;
    }
    // Étourdi par une onde : il ne bouge plus et n'attaque plus
    if (temps < tuba.etourdiJusqua) {
      tuba.setVelocityX(0);
      tuba.setTint(0x8899ff);
      this.jouerAnimation(tuba, "tuba_idle");
      return;
    }
    tuba.clearTint();

    // Pendant son attaque il reste sur place
    if (temps < tuba.attaqueJusqua) {
      tuba.setVelocityX(0);
      return;
    }

    // Patrouille : il fait des allers-retours entre xMin et xMax
    if (tuba.x <= tuba.xMin) {
      tuba.sens = 1;
    } else if (tuba.x >= tuba.xMax) {
      tuba.sens = -1;
    }
    tuba.setVelocityX(tuba.sens * REGLAGES.tuba.vitesse);
    tuba.setFlipX(tuba.sens < 0);
    this.jouerAnimation(tuba, "tuba_walk");

    // Toutes les 3 secondes il lance une onde, mais seulement si un joueur est proche
    if (temps >= tuba.prochaineOnde && Math.abs(tuba.x - this.persoLePlusProche(tuba).x) < 650) {
      tuba.prochaineOnde = temps + REGLAGES.tuba.ondeToutesMs;
      tuba.attaqueJusqua = temps + 700;
      tuba.anims.play("tuba_attack");
      // l'onde part au milieu de l'animation
      this.time.delayedCall(400, () => {
        if (tuba.active && this.time.now >= tuba.etourdiJusqua) {
          this.lancerOndeTuba(tuba);
        }
      });
    }
  }

  lancerOndeTuba(tuba) {
    const sens = tuba.flipX ? -1 : 1;
    const onde = this.groupe_ondes_ennemies.create(tuba.x + sens * 36, tuba.y - 6, "onde");
    onde.setDepth(8);
    onde.setScale(1.6);
    onde.setFlipX(sens < 0);
    onde.setTint(0xb066ff); // violette, pour ne pas la confondre avec celles de la Cantatrice
    onde.play("onde_mi");
    onde.body.setSize(22, 18);
    onde.setVelocityX(sens * REGLAGES.tuba.vitesseOnde);
    onde.xDepart = onde.x;
  }

  // Le cristal flotte vers le joueur le plus proche, s'il est assez près
  mettreAJourCristal(cristal, temps) {
    if (cristal.mort == true) {
      return;
    }
    if (temps < cristal.etourdiJusqua) {
      cristal.setVelocity(0, 0);
      cristal.setTint(0x8899ff);
      return;
    }
    cristal.clearTint();

    const cible = this.persoLePlusProche(cristal);
    const distance = Phaser.Math.Distance.Between(cristal.x, cristal.y, cible.x, cible.y);
    if (distance < REGLAGES.cristal.detectionPx) {
      this.physics.moveToObject(cristal, cible, REGLAGES.cristal.vitesse);
    } else {
      cristal.setVelocity(0, 0);
    }
  }

  persoLePlusProche(ennemi) {
    const distCantatrice = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, this.cantatrice.x, this.cantatrice.y);
    const distDetective = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, this.detective.x, this.detective.y);
    return distCantatrice <= distDetective ? this.cantatrice : this.detective;
  }

  etourdir(ennemi, dureeMs) {
    ennemi.etourdiJusqua = this.time.now + dureeMs;
  }

  // Une onde de la Cantatrice touche un ennemi
  ondeTouche(onde, ennemi) {
    if (ennemi.mort == true) {
      return;
    }
    onde.destroy();
    if (ennemi.pv !== undefined) {
      this.blesserCristal(ennemi); // le cristal perd un point de vie
    } else {
      this.etourdir(ennemi, REGLAGES.onde.etourdissementMs); // le tuba est étourdi
    }
  }

  blesserCristal(cristal) {
    cristal.pv -= 1;
    if (cristal.pv <= 0) {
      cristal.mort = true;
      cristal.body.enable = false; // il ne touche plus personne
      cristal.clearTint();
      cristal.anims.play("cristal_death");
      cristal.once("animationcomplete", () => cristal.destroy());
    } else {
      this.etourdir(cristal, REGLAGES.onde.etourdissementMs);
    }
  }

  // Les ondes disparaissent après leur portée maximale
  nettoyerOndes() {
    this.groupe_ondes.getChildren().slice().forEach((onde) => {
      if (Math.abs(onde.x - onde.xDepart) > REGLAGES.onde.portee) {
        onde.destroy();
      }
    });
    this.groupe_ondes_ennemies.getChildren().slice().forEach((onde) => {
      if (Math.abs(onde.x - onde.xDepart) > REGLAGES.tuba.porteeOnde) {
        onde.destroy();
      }
    });
  }

  // --------------------------------------------------------------------------
  //  Dégâts, chute et cœurs
  // --------------------------------------------------------------------------
  // Un ennemi touche un personnage (sauf s'il est étourdi ou détruit)
  contactEnnemi(perso, ennemi) {
    if (ennemi.mort == true || this.time.now < ennemi.etourdiJusqua) {
      return;
    }
    this.blesser(perso, ennemi.x);
  }

  ondeEnnemieTouche(perso, onde) {
    onde.destroy();
    this.blesser(perso, onde.x);
  }

  // sourceX = d'où vient le coup (pour savoir de quel côté repousser le personnage)
  blesser(perso, sourceX) {
    const temps = this.time.now;
    if (this.fini == true || temps < perso.invincibleJusqua) {
      return; // invincible 1,5 s après un coup
    }
    if (this.perdreUnCoeur() == false) {
      return; // plus de cœur : c'est perdu
    }
    perso.invincibleJusqua = temps + REGLAGES.vies.invincibiliteMs;

    // Recul + animation "hurt"
    const sens = perso.x < sourceX ? -1 : 1;
    this.lacherEchelle(perso);
    perso.sonneJusqua = temps + REGLAGES.recul.dureeMs;
    perso.setVelocity(sens * REGLAGES.recul.x, REGLAGES.recul.y);
    perso.anims.play(perso.nom + "_hurt");
    this.faireClignoter(perso);
  }

  // Enlève un cœur. Renvoie false si c'était le dernier (la partie est alors perdue).
  perdreUnCoeur() {
    this.vies -= 1;
    this.majCoeurs();
    if (this.vies <= 0) {
      this.perdre();
      return false;
    }
    return true;
  }

  // Le personnage clignote pendant toute la durée d'invincibilité
  faireClignoter(perso) {
    this.tweens.add({
      targets: perso,
      alpha: 0.35,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(REGLAGES.vies.invincibiliteMs / 200) - 1,
      onComplete: () => perso.setAlpha(1)
    });
  }

  // Un personnage passe sous la ligne de chute de la carte
  verifierChutes() {
    this.persos.forEach((perso) => {
      if (this.fini == false && perso.body.bottom > this.yChute) {
        this.tomber(perso);
      }
    });
  }

  // Tombé dans le vide : -1 cœur, et on réapparaît près de son partenaire
  tomber(perso) {
    if (this.perdreUnCoeur() == false) {
      return;
    }
    const partenaire = perso == this.cantatrice ? this.detective : this.cantatrice;
    let x = partenaire.x;
    let y = partenaire.y - 20;
    if (partenaire.body.bottom > this.yChute - 40) {
      // le partenaire est lui aussi en train de tomber : retour au départ
      x = this.departs.j1.x;
      y = this.departs.j1.y - 40;
    }
    this.lacherEchelle(perso);
    perso.setPosition(x, y);
    perso.setVelocity(0, 0);
    perso.invincibleJusqua = this.time.now + REGLAGES.vies.invincibiliteMs;
    this.faireClignoter(perso);
    this.afficherMessage("Tombé dans le vide ! (-1 cœur)", 2500);
  }

  // Plus de cœur : on joue l'animation de mort, puis écran Game Over
  perdre() {
    this.fini = true;
    this.persos.forEach((perso) => {
      this.lacherEchelle(perso);
      perso.setVelocityX(0);
      perso.setAlpha(1);
      perso.anims.play(perso.nom + "_death");
    });
    this.faisceau.clear();
    this.halo.setVisible(false);
    this.haloProche.setVisible(false);
    this.time.delayedCall(1700, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("gameover");
      });
    });
  }

  // --------------------------------------------------------------------------
  //  Parchemin et porte
  // --------------------------------------------------------------------------
  ramasserFragment(perso, partition) {
    if (this.fragmentRecupere == true) {
      return;
    }
    this.fragmentRecupere = true;
    partition.disableBody(true, true); // le parchemin disparaît
    this.porteOuverte = true;
    this.porte.anims.play("porte_ouvre"); // la porte s'ouvre
    this.iconeFragment.clearTint();
    this.texteFragment.setText("1 / 1");
    this.afficherMessage("Parchemin récupéré ! La porte de sortie est ouverte.", 4000);
  }

  franchirPorte() {
    if (this.porteOuverte == false || this.fini == true) {
      return;
    }
    this.fini = true;
    this.persos.forEach((perso) => {
      this.lacherEchelle(perso);
      perso.setVelocity(0, 0);
      this.jouerAnimation(perso, perso.nom + "_idle");
    });
    this.physics.pause();
    this.afficherMessage("Niveau 1 terminé ! Direction le niveau 2...", 2000);
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("niveau2"); // la victoire mène directement au niveau 2
    });
  }

  // --------------------------------------------------------------------------
  //  Caméra
  // --------------------------------------------------------------------------
  // Duo : un joueur ne peut pas s'éloigner de l'autre de plus de ECART_MAX_DUO pixels,
  // pour que la caméra puisse toujours cadrer les deux.
  limiterEcartDuo() {
    const c = this.cantatrice;
    const d = this.detective;
    const ecart = c.x - d.x;
    if (Math.abs(ecart) <= ECART_MAX_DUO) {
      return;
    }
    const sens = Math.sign(ecart); // de quel côté se trouve la Cantatrice
    // celui qui s'éloigne encore est bloqué
    if (c.body.velocity.x * sens > 0) {
      c.x = d.x + sens * ECART_MAX_DUO;
      c.setVelocityX(0);
    }
    if (d.body.velocity.x * -sens > 0) {
      d.x = c.x - sens * ECART_MAX_DUO;
      d.setVelocityX(0);
    }
  }

  mettreAJourCamera() {
    let x;
    if (this.mode == "solo") {
      x = this.actif.x;
    } else {
      x = (this.cantatrice.x + this.detective.x) / 2;
    }
    this.cible_camera.setPosition(x, HAUTEUR_MONDE / 2);
  }

  // --------------------------------------------------------------------------
  //  Interface
  // --------------------------------------------------------------------------
  majCoeurs() {
    this.coeurs.forEach((coeur, i) => {
      coeur.setTexture(i < this.vies ? "tex_coeur" : "tex_coeur_vide");
    });
  }

  majNote() {
    const note = NOTES[this.noteActuelle];
    this.texteNote.setText("Onde : " + note.texte).setColor(note.couleur);
  }

  mettreAJourInterface(temps) {
    // Barre de batterie : jaune, puis rouge quand elle est faible
    const faible = this.lampe.batterie <= REGLAGES.lampe.seuilClignote;
    this.barreBatterie.clear();
    this.barreBatterie.fillStyle(0x000000, 0.6).fillRect(104, 88, 154, 18);
    this.barreBatterie.fillStyle(faible ? 0xff4a4a : 0xffd24a).fillRect(106, 90, 150 * (this.lampe.batterie / 100), 14);
    this.barreBatterie.lineStyle(2, 0xf5d97a).strokeRect(104, 88, 154, 18);

    // Solo : on met en avant les informations du personnage actif
    if (this.mode == "solo") {
      this.texteNote.setAlpha(this.actif == this.cantatrice ? 1 : 0.45);
      this.texteLampe.setAlpha(this.actif == this.detective ? 1 : 0.45);
      this.barreBatterie.setAlpha(this.actif == this.detective ? 1 : 0.45);
      this.fleche.setPosition(this.actif.x, this.actif.y - 46 + Math.sin(temps / 150) * 4);
    }

    // Le message temporaire s'efface quand son temps est écoulé
    if (temps > this.messageJusqua) {
      this.texteMessage.setText("");
    }
  }

  afficherMessage(texte, dureeMs) {
    this.texteMessage.setText(texte);
    this.messageJusqua = this.time.now + dureeMs;
  }

  texteCommandes() {
    if (this.mode == "duo") {
      return "J1 Cantatrice : flèches · I saut · O onde · P note\nJ2 Détective : ZQSD · R saut · T lampe (Z / S l'oriente) · Y recharge";
    }
    return "Flèches · I saut · O onde / lampe · haut-bas oriente la lampe · P note / recharge · K changer de personnage";
  }
}
