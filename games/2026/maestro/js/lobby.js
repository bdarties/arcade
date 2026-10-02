// ============================================================================
//  js/lobby.js — LE LOBBY (« les Cintres ») : le point d'apparition des joueurs
//
//  On y arrive en début de partie et après un Game Over (on y réapparaît au "spawn").
//  Le lobby a 3 portes, une par niveau. Pour entrer dans une porte : se placer
//  devant et appuyer sur le bouton B.
//     1 — Les Coulisses (à gauche, au niveau du sol)  -> lance le niveau 1
//     2 — Les Ombres chinoises (en haut)             -> pas encore ouverte
//     3 — La Grande Scène (à droite, sur une marche) -> pas encore ouverte
//
//  - Flèches (J1) ou ZQSD (J2) pour marcher, bouton A pour sauter
//  - Solo : le bouton D (K) change de personnage. Duo : chacun son personnage.
//
//  La carte vient de Tiled (assets/lobby.json). Elle ne contient que des calques de tuiles :
//  les zones solides, les échelles et les portes sont décrites dans ce fichier (SOLIDES, ECHELLES, PORTES).
// ============================================================================

import { REGLAGES } from "./reglages.js";
import { creerPanneau } from "./controles.js";

// ---- Dimensions de la carte (64 x 96 tuiles de 16 px) : elle est plus HAUTE que large ----
const LARGEUR_CARTE = 1024;
const HAUTEUR_CARTE = 1536;
const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';

// Les zones SOLIDES du lobby : [x, y, largeur, hauteur] en pixels de la carte.
// La carte Tiled ne les décrit pas (et son calque "Plateforme" contient aussi des tuiles invisibles) :
// on les a donc relevées sur le dessin. Pour déplacer ou ajouter une plateforme, il suffit de changer cette liste.
const SOLIDES = [
  [0, 1434, 1024, 102], // le sol
  [0, 1328, 352, 32], // l'estrade de la porte 1 (« Les Coulisses »)
  [352, 1328, 96, 16], // le bord droit de cette estrade
  [720, 1321, 256, 39], // la marche devant la grille de la porte 3
  [528, 1298, 160, 62], // le panneau bleu à droite de la billetterie
  [350, 1282, 142, 20], // la plateforme du milieu (pied de la longue échelle)
  [450, 1250, 102, 22], // la petite plateforme au-dessus
  [608, 1201, 96, 47], // la petite plateforme suspendue (pied de l'échelle de droite)
  [528, 1026, 160, 62], // le panneau bleu du haut
  [336, 960, 208, 40], // la poutre en haut de la longue échelle
  [336, 752, 256, 32], // les plateformes qui mènent à la porte 2
  [608, 752, 240, 80],
  [240, 640, 160, 80],
  [624, 592, 240, 48]
];

// Les échelles dessinées dans la carte (calque "decor"). La carte Tiled ne les décrit pas : on les relève ici.
// x = le milieu de l'échelle ; haut / bas = hauteur approximative de ses extrémités (elle est ensuite
// ajustée sur le dessus de la plateforme la plus proche, voir trouverEchelles).
const ECHELLES = [
  { x: 221, haut: 1328, bas: 1440 }, // sous l'estrade de la porte 1 (« Les Coulisses »)
  { x: 382, haut: 976, bas: 1281 }, // la longue échelle du milieu
  { x: 642, haut: 1034, bas: 1210 }, // à droite de la billetterie
  { x: 815, haut: 596, bas: 756 } // sous la porte 2 (« Les Ombres chinoises »)
];

// Où apparaissent les joueurs (x, et y du sol sur lequel ils se posent)
const SPAWN = { x: 450, solY: 1434 };

// Les 3 portes. x, y, largeur, hauteur = la zone (en pixels de la carte) où l'on peut l'utiliser.
// scene = le niveau qu'elle lance (null = pas encore ouverte).
// Leur nom est déjà dessiné sur l'illustration du lobby : on affiche seulement une consigne quand on est devant.
const PORTES = [
  { nom: "1 — LES COULISSES", scene: "niveau1", x: 104, y: 1250, largeur: 168, hauteur: 184 },
  { nom: "2 — LES OMBRES CHINOISES", scene: null, x: 400, y: 430, largeur: 224, hauteur: 130 },
  { nom: "3 — LA GRANDE SCÈNE", scene: null, x: 760, y: 1160, largeur: 144, hauteur: 152 }
];

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
    this.trouverEchelles();
    this.creerPortes();
    this.creerPersonnages();
    this.creerCamera();
    this.creerInterface();
  }

  // --------------------------------------------------------------------------
  //  Décor : l'illustration du lobby derrière, puis les calques de tuiles de Tiled
  // --------------------------------------------------------------------------
  creerDecor() {
    // Les 3 images de tuiles sont-elles là ?
    this.avecTuiles =
      this.textures.exists("ts_lobby_tilesett") && this.textures.exists("ts_lobby_fond") && this.textures.exists("ts_lobby_portail");

    if (this.textures.exists("img_lobby_fond")) {
      // Même taille que la carte (1024 x 1536) et posée en (0, 0) : les tuiles tombent pile dessus
      this.add.image(0, 0, "img_lobby_fond").setOrigin(0, 0).setDisplaySize(LARGEUR_CARTE, HAUTEUR_CARTE).setDepth(0);
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
  //  Le sol et les plateformes : des rectangles invisibles avec un corps statique (qui ne bouge pas)
  // --------------------------------------------------------------------------
  creerSol() {
    this.groupe_sol = this.physics.add.staticGroup();

    SOLIDES.forEach(([x, y, largeur, hauteur]) => {
      const zone = this.add.zone(x + largeur / 2, y + hauteur / 2, largeur, hauteur);
      this.groupe_sol.add(zone); // ajouter au groupe statique lui donne un corps solide
      if (this.avecTuiles == false) {
        // décor de secours : on dessine les zones solides en bois
        this.add.tileSprite(zone.x, zone.y, largeur, hauteur, "tex_bois").setDepth(2);
      }
    });
  }

  // --------------------------------------------------------------------------
  //  Les échelles : on cale le haut et le bas de chacune sur le dessus d'une plateforme proche
  // --------------------------------------------------------------------------
  trouverEchelles() {
    const solides = this.groupe_sol.getChildren().map((z) => ({
      gauche: z.x - z.width / 2,
      droite: z.x + z.width / 2,
      haut: z.y - z.height / 2
    }));
    // le dessus de plateforme le plus proche de y (à 32 px près) sous l'échelle ; sinon on garde y
    const caler = (x, y) => {
      let meilleur = y;
      let ecart = 33;
      solides.forEach((s) => {
        if (x >= s.gauche - 4 && x <= s.droite + 4 && Math.abs(s.haut - y) < ecart) {
          ecart = Math.abs(s.haut - y);
          meilleur = s.haut;
        }
      });
      return meilleur;
    };
    this.echelles = ECHELLES.map((e) => ({ centreX: e.x, haut: caler(e.x, e.haut), bas: caler(e.x, e.bas) }));
  }

  // Haut / bas du joystick devant une échelle pour s'y accrocher (même principe qu'au niveau 1)
  gererEchelle(perso, controle) {
    const corps = perso.body;
    const pied = corps.bottom; // hauteur des pieds
    const echelle = this.echelles.find(function (e) {
      return Math.abs(corps.center.x - e.centreX) <= 16 && pied >= e.haut - 3 && pied <= e.bas + 3;
    });

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
  //  Les portes : une consigne apparaît quand un joueur est devant
  // --------------------------------------------------------------------------
  creerPortes() {
    this.portes = PORTES.map((porte) => {
      const ouverte = porte.scene !== null;
      const texte = this.add
        .text(porte.x + porte.largeur / 2, porte.y - 20, ouverte ? "Bouton B : entrer" : "Porte fermée · bientôt", {
          fontFamily: POLICE,
          fontSize: "13pt",
          color: ouverte ? "#ffe9a8" : "#aab4d8",
          align: "center",
          stroke: "#000000",
          strokeThickness: 4,
          backgroundColor: "#000000aa",
          padding: { x: 10, y: 6 }
        })
        .setOrigin(0.5)
        .setDepth(6)
        .setAlpha(0); // invisible tant que personne n'est devant la porte
      return { donnees: porte, zone: new Phaser.Geom.Rectangle(porte.x, porte.y, porte.largeur, porte.hauteur), texte: texte };
    });
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

    // On marche sur le sol, sauf quand on est accroché à une échelle
    // (la 3e fonction est une CONDITION : si elle renvoie false, il n'y a pas de collision)
    this.physics.add.collider(this.persos, this.groupe_sol, null, function (perso) {
      return perso.enEchelle != true;
    });

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
    perso.enEchelle = false; // vrai quand le personnage est accroché à une échelle
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

    // Message en bas de l'écran (ex : « cette porte n'est pas encore ouverte »)
    this.texteMessage = this.add
      .text(640, 676, "", { ...style, fontSize: "14pt" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
    this.messageJusqua = 0;
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
    this.verifierPortes(temps);
    this.mettreAJourCamera();
    if (this.mode == "solo") {
      this.fleche.setPosition(this.actif.x, this.actif.y - 46 + Math.sin(temps / 150) * 4);
    }
    if (temps > this.messageJusqua) {
      this.texteMessage.setText("");
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
    this.gererEchelle(perso, controle);
    const aTerre = perso.body.blocked.down || perso.body.touching.down;

    let direction = 0; // -1 gauche, 0 immobile, 1 droite
    if (controle == true && perso.enEchelle == false) {
      if (this.toucheEnfoncee(perso, "gauche")) {
        direction = -1;
      } else if (this.toucheEnfoncee(perso, "droite")) {
        direction = 1;
      }
    }
    // Sur une échelle, la vitesse est gérée par gererEchelle
    if (perso.enEchelle == false) {
      perso.setVelocityX(direction * REGLAGES.vitesse);
    }
    if (direction != 0) {
      perso.setFlipX(direction < 0); // les images regardent vers la droite : on les retourne
    }
    if (controle == true && perso.enEchelle == false && aTerre && this.toucheAppuyee(perso, "A")) {
      perso.setVelocityY(REGLAGES.saut);
    }

    let anim = "idle";
    if (perso.enEchelle == true) {
      anim = perso.body.velocity.y != 0 ? "walk" : "idle"; // il "marche" en grimpant
    } else if (aTerre == false) {
      anim = "jump";
    } else if (direction != 0) {
      anim = "walk";
    }
    const cle = perso.nom + "_" + anim;
    if (perso.anims.currentAnim == null || perso.anims.currentAnim.key != cle) {
      perso.anims.play(cle);
    }
  }

  // Un joueur devant une porte appuie sur B : porte ouverte = on part dans le niveau, sinon un message
  verifierPortes(temps) {
    this.portes.forEach((porte) => {
      let quelquUnDevant = false;
      this.persos.forEach((perso) => {
        const controle = this.mode == "duo" || perso == this.actif;
        if (Phaser.Geom.Rectangle.Contains(porte.zone, perso.x, perso.y)) {
          quelquUnDevant = true;
          if (controle == true && this.toucheAppuyee(perso, "B")) {
            this.utiliserPorte(porte.donnees);
          }
        }
      });
      // la consigne apparaît (et pulse) quand quelqu'un est devant la porte
      porte.texte.setAlpha(quelquUnDevant ? 0.85 + Math.sin(temps / 200) * 0.15 : 0);
    });
  }

  utiliserPorte(porte) {
    if (porte.scene === null) {
      this.messageJusqua = this.time.now + 2500;
      this.texteMessage.setText("Cette porte s'ouvrira plus tard : " + porte.nom);
      return;
    }
    this.entrerDansLaPorte(porte.scene);
  }

  // Zoom de la caméra + fondu au noir, puis le niveau
  entrerDansLaPorte(scene) {
    this.enTransition = true;
    this.persos.forEach((perso) => {
      perso.setVelocityX(0);
      perso.anims.play(perso.nom + "_idle");
    });
    this.cameras.main.zoomTo(1.5, 800);
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(scene);
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
