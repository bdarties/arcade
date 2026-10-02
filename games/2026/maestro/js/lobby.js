// ============================================================================
//  js/lobby.js — LE LOBBY (« les Cintres ») : le point d'apparition des joueurs
//
//  On y arrive en début de partie et après un Game Over (on y réapparaît au "spawn").
//  Pour lancer le niveau 1 : aller devant le PORTAIL et appuyer sur le bouton B.
//
//  - Flèches (J1) ou ZQSD (J2) pour marcher, bouton A pour sauter
//  - Solo : le bouton D (K) change de personnage. Duo : chacun son personnage.
//
//  La carte vient de Tiled (assets/lobby.json). Elle ne contient que des calques de
//  tuiles : les zones solides sont déduites des tuiles du calque "Plateforme".
// ============================================================================

import { REGLAGES } from "./reglages.js";
import { creerPanneau } from "./controles.js";

// ---- Dimensions de la carte (64 x 96 tuiles de 16 px) : elle est plus HAUTE que large ----
const LARGEUR_CARTE = 1024;
const HAUTEUR_CARTE = 1536;
const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';

// Les tuiles du jeu d'images "tilesett" (numéros 1 à 6144 dans Tiled) sont solides.
// Les tuiles "fond" et "PORTAIL" sont de simples décors qu'on traverse.
const PREMIERE_TUILE_SOLIDE = 1;
const DERNIERE_TUILE_SOLIDE = 6144;

// Où apparaissent les joueurs (x, et y du sol sur lequel ils se posent)
const SPAWN = { x: 450, solY: 1424 };
// Le portail du niveau 1 : le centre de la porte, et la zone où l'on peut l'utiliser
const PORTAIL = { x: 832, y: 1236, zoneLargeur: 150, zoneHauteur: 150 };
const SCENE_SUIVANTE = "niveau1";

export default class lobby extends Phaser.Scene {
  constructor() {
    super({ key: "lobby" });
  }

  // ==========================================================================
  //  PRELOAD : la carte, le fond et les images des tuiles
  // ==========================================================================
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.tilemapTiledJSON("carte_lobby", "./assets/lobby.json");
    this.load.image("img_lobby_fond", "./assets/lobby_fond.jpg");
    // Images des tuiles. Si l'une manque, le lobby reste jouable avec un décor de secours.
    this.load.image("ts_lobby_tilesett", "./assets/tilesett.png");
    this.load.image("ts_lobby_fond", "./assets/fond.png");
    this.load.image("ts_lobby_portail", "./assets/portail.png");
  }

  // ==========================================================================
  //  CREATE
  // ==========================================================================
  create() {
    // create() est rappelée à chaque retour au lobby : on remet tout à zéro
    this.mode = this.registry.get("mode") || "solo"; // "solo" ou "duo" (choisi dans choix_mode)
    this.enTransition = false;

    this.physics.world.gravity.y = REGLAGES.gravite;
    this.physics.world.setBounds(0, 0, LARGEUR_CARTE, HAUTEUR_CARTE);
    this.cameras.main.setBackgroundColor(0x05060d);

    this.creerDecor();
    this.creerSol();
    this.creerPortail();
    this.creerPersonnages();
    this.creerCamera();
    this.creerInterface();
  }

  // --------------------------------------------------------------------------
  //  Décor : l'image du lobby derrière, puis les calques de tuiles de Tiled
  // --------------------------------------------------------------------------
  creerDecor() {
    // Les 3 images de tuiles sont-elles là ?
    this.avecTuiles =
      this.textures.exists("ts_lobby_tilesett") && this.textures.exists("ts_lobby_fond") && this.textures.exists("ts_lobby_portail");

    if (this.textures.exists("img_lobby_fond")) {
      const fond = this.add.image(LARGEUR_CARTE / 2, HAUTEUR_CARTE / 2, "img_lobby_fond").setDepth(0);
      // L'image est agrandie pour remplir toute la zone visible (1280 px de large) sans se déformer
      fond.setScale(Math.max(1280 / fond.width, HAUTEUR_CARTE / fond.height));
      fond.setAlpha(this.avecTuiles ? 0.89 : 0.6);
    }

    if (this.avecTuiles == true) {
      const carte = this.add.tilemap("carte_lobby");
      // 1er nom = le nom du jeu de tuiles dans Tiled, 2e nom = la clé chargée dans preload
      const tuiles = [
        carte.addTilesetImage("tilesett", "ts_lobby_tilesett"),
        carte.addTilesetImage("fond", "ts_lobby_fond"),
        carte.addTilesetImage("PORTAIL", "ts_lobby_portail")
      ];
      carte.createLayer("Plateforme", tuiles).setDepth(2);
      carte.createLayer("decor", tuiles).setDepth(3);
    }
  }

  // --------------------------------------------------------------------------
  //  Le sol : des rectangles solides déduits des tuiles du calque "Plateforme"
  // --------------------------------------------------------------------------
  creerSol() {
    this.groupe_sol = this.physics.add.staticGroup();

    this.trouverRectanglesSolides().forEach((r) => {
      const zone = this.add.zone(r.x + r.largeur / 2, r.y + r.hauteur / 2, r.largeur, r.hauteur);
      this.groupe_sol.add(zone); // ajouter au groupe statique lui donne un corps solide
      if (this.avecTuiles == false) {
        // décor de secours : on dessine les zones solides en bois
        this.add.tileSprite(zone.x, zone.y, r.largeur, r.hauteur, "tex_bois").setDepth(2);
      }
    });
  }

  // Regroupe les tuiles solides en gros rectangles (beaucoup moins de corps physiques qu'une tuile par tuile)
  trouverRectanglesSolides() {
    const donnees = this.cache.tilemap.get("carte_lobby").data; // le fichier Tiled (JSON)
    const calque = donnees.layers.find((c) => c.name == "Plateforme");
    const solide = (colonne, ligne) => {
      const numero = calque.data[ligne * calque.width + colonne] & 0x1fffffff; // on ignore les bits de retournement
      return numero >= PREMIERE_TUILE_SOLIDE && numero <= DERNIERE_TUILE_SOLIDE;
    };

    const rectangles = [];
    let enCours = {}; // les rectangles qui continuent sur la ligne suivante : "debut-fin" -> rectangle
    for (let ligne = 0; ligne < calque.height; ligne++) {
      const suivants = {};
      let colonne = 0;
      while (colonne < calque.width) {
        if (solide(colonne, ligne) == false) {
          colonne++;
          continue;
        }
        const debut = colonne; // une suite de tuiles solides sur cette ligne
        while (colonne < calque.width && solide(colonne, ligne)) {
          colonne++;
        }
        const cle = debut + "-" + colonne;
        if (enCours[cle] === undefined) {
          const nouveau = { x: debut * 16, y: ligne * 16, largeur: (colonne - debut) * 16, hauteur: 0 };
          rectangles.push(nouveau);
          enCours[cle] = nouveau;
        }
        enCours[cle].hauteur += 16; // même suite que la ligne du dessus : on agrandit le rectangle
        suivants[cle] = enCours[cle];
      }
      enCours = suivants;
    }
    return rectangles;
  }

  // --------------------------------------------------------------------------
  //  Le portail qui mène au niveau 1
  // --------------------------------------------------------------------------
  creerPortail() {
    this.zonePortail = new Phaser.Geom.Rectangle(
      PORTAIL.x - PORTAIL.zoneLargeur / 2,
      PORTAIL.y - PORTAIL.zoneHauteur / 2,
      PORTAIL.zoneLargeur,
      PORTAIL.zoneHauteur
    );

    if (this.avecTuiles == false) {
      // portail de secours : une porte lumineuse
      const porte = this.add.graphics().setDepth(3);
      porte.fillStyle(0x2a1a5a, 0.8).fillRoundedRect(PORTAIL.x - 48, PORTAIL.y - 70, 96, 140, 14);
      porte.lineStyle(5, 0xf5d97a).strokeRoundedRect(PORTAIL.x - 48, PORTAIL.y - 70, 96, 140, 14);
      this.add.image(PORTAIL.x, PORTAIL.y, "tex_lumiere").setBlendMode(Phaser.BlendModes.ADD).setScale(1.3).setAlpha(0.6).setDepth(3);
    }

    // Le panneau au-dessus du portail : il s'illumine quand un joueur est devant
    this.panneauPortail = this.add
      .text(PORTAIL.x, PORTAIL.y - 110, "PORTAIL\nBouton B : entrer", {
        fontFamily: POLICE,
        fontSize: "14pt",
        color: "#ffe9a8",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
        backgroundColor: "#000000aa",
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0.6);
  }

  // --------------------------------------------------------------------------
  //  Personnages : Cantatrice (J1) et Détective (J2)
  // --------------------------------------------------------------------------
  creerPersonnages() {
    const j1 = creerPanneau(this, "j1"); // touches du joueur 1
    const j2 = creerPanneau(this, "j2"); // touches du joueur 2

    // En duo chacun a ses touches. En solo, les deux joysticks fonctionnent pour le perso actif.
    this.cantatrice = this.creerPersonnage("cantatrice", SPAWN.x, this.mode == "duo" ? [j1] : [j1, j2]);
    this.detective = this.creerPersonnage("detective", SPAWN.x + 60, this.mode == "duo" ? [j2] : [j1, j2]);
    this.persos = [this.cantatrice, this.detective];
    this.actif = this.cantatrice; // en solo : le personnage qu'on contrôle en ce moment

    this.physics.add.collider(this.persos, this.groupe_sol);

    // En solo : une petite flèche dorée au-dessus du personnage qu'on contrôle
    this.fleche = this.add.image(0, 0, "tex_fleche").setDepth(20).setVisible(this.mode == "solo");
  }

  creerPersonnage(nom, x, touches) {
    const perso = this.physics.add.sprite(x, SPAWN.solY - 40, nom + "_idle");
    perso.setDepth(10);
    perso.setCollideWorldBounds(true);
    // Hitbox plus petite que l'image de 64 x 64 : seulement le corps, pieds en bas de l'image
    perso.body.setSize(24, 54, false);
    perso.body.setOffset(20, 9);
    perso.body.setMaxVelocity(600, 800);
    perso.play(nom + "_idle");

    perso.nom = nom; // "cantatrice" ou "detective"
    perso.touches = touches; // liste des claviers qui le contrôlent
    return perso;
  }

  // --------------------------------------------------------------------------
  //  Caméra : la carte est en hauteur, la caméra suit les personnages vers le haut et le bas
  // --------------------------------------------------------------------------
  creerCamera() {
    const camera = this.cameras.main;
    // La carte (1024 px de large) est plus étroite que l'écran (1280 px) : on la centre, avec 128 px de marge de chaque côté
    camera.setBounds(-128, 0, 1280, HAUTEUR_CARTE);
    camera.setScroll(-128, HAUTEUR_CARTE - 720); // on commence tout en bas, là où apparaissent les joueurs
    this.cible_camera = this.add.zone(LARGEUR_CARTE / 2, SPAWN.solY - 100, 10, 10);
    camera.startFollow(this.cible_camera, true, 0.08, 0.08);
    camera.fadeIn(600, 0, 0, 0);
  }

  creerInterface() {
    const style = {
      fontFamily: POLICE,
      fontSize: "15pt",
      color: "#dfe6ff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 5
    };
    const consigne = this.mode == "solo" ? "LE LOBBY · Flèches : marcher · I : sauter · K : changer de personnage" : "LE LOBBY · J1 : flèches + I · J2 : ZQSD + R";
    this.texteConsigne = this.add.text(640, 30, consigne, style).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.tweens.add({ targets: this.texteConsigne, alpha: 0, delay: 6000, duration: 1500 });
  }

  // ==========================================================================
  //  UPDATE
  // ==========================================================================
  update(temps) {
    if (this.enTransition == true) {
      return;
    }

    // Solo : le bouton D change de personnage
    if (this.mode == "solo" && this.toucheAppuyee(this.actif, "D")) {
      this.actif = this.actif == this.cantatrice ? this.detective : this.cantatrice;
      const nouveau = this.actif;
      nouveau.setTintFill(0xffffff); // petit flash blanc pour montrer qui est actif
      this.time.delayedCall(120, () => nouveau.clearTint());
    }

    this.persos.forEach((perso) => this.gererPersonnage(perso));
    this.verifierPortail(temps);
    this.mettreAJourCamera();
    if (this.mode == "solo") {
      this.fleche.setPosition(this.actif.x, this.actif.y - 46 + Math.sin(temps / 150) * 4);
    }
  }

  toucheEnfoncee(perso, bouton) {
    return perso.touches.some((clavier) => clavier[bouton].isDown);
  }

  // Vrai UNE SEULE FOIS par appui (pas tant que la touche reste enfoncée)
  toucheAppuyee(perso, bouton) {
    return perso.touches.map((clavier) => Phaser.Input.Keyboard.JustDown(clavier[bouton])).includes(true);
  }

  // Marcher, sauter, animer. En solo, seul le personnage actif obéit aux touches.
  gererPersonnage(perso) {
    const controle = this.mode == "duo" || perso == this.actif;
    const aTerre = perso.body.blocked.down || perso.body.touching.down;

    let direction = 0; // -1 gauche, 0 immobile, 1 droite
    if (controle == true) {
      if (this.toucheEnfoncee(perso, "gauche")) {
        direction = -1;
      } else if (this.toucheEnfoncee(perso, "droite")) {
        direction = 1;
      }
    }
    perso.setVelocityX(direction * REGLAGES.vitesse);
    if (direction != 0) {
      perso.setFlipX(direction < 0); // les images regardent vers la droite : on les retourne
    }
    if (controle == true && aTerre && this.toucheAppuyee(perso, "A")) {
      perso.setVelocityY(REGLAGES.saut);
    }

    let anim = "idle";
    if (aTerre == false) {
      anim = "jump";
    } else if (direction != 0) {
      anim = "walk";
    }
    const cle = perso.nom + "_" + anim;
    if (perso.anims.currentAnim == null || perso.anims.currentAnim.key != cle) {
      perso.anims.play(cle);
    }
  }

  // Un joueur devant le portail appuie sur B : on part au niveau 1
  verifierPortail(temps) {
    let quelquUnDevant = false;
    this.persos.forEach((perso) => {
      const controle = this.mode == "duo" || perso == this.actif;
      const devant = Phaser.Geom.Rectangle.Contains(this.zonePortail, perso.x, perso.y);
      if (devant) {
        quelquUnDevant = true;
        if (controle == true && this.toucheAppuyee(perso, "B")) {
          this.entrerDansLePortail();
        }
      }
    });
    // le panneau s'illumine (et pulse) quand quelqu'un est devant
    this.panneauPortail.setAlpha(quelquUnDevant ? 0.8 + Math.sin(temps / 200) * 0.2 : 0.6);
  }

  // Zoom de la caméra + fondu au noir, puis le niveau 1
  entrerDansLePortail() {
    this.enTransition = true;
    this.persos.forEach((perso) => {
      perso.setVelocityX(0);
      perso.anims.play(perso.nom + "_idle");
    });
    this.cameras.main.zoomTo(1.5, 800);
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(SCENE_SUIVANTE);
    });
  }

  // Solo : on suit le personnage actif. Duo : on suit le milieu des deux (surtout en hauteur ici).
  mettreAJourCamera() {
    let y;
    if (this.mode == "solo") {
      y = this.actif.y;
    } else {
      y = (this.cantatrice.y + this.detective.y) / 2;
    }
    this.cible_camera.setPosition(LARGEUR_CARTE / 2, y);
  }
}
