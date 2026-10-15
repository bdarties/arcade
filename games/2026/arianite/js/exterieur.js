import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier
var calque_sol; // calque de tuiles solides (map Tiled)

// parallaxe : 0 = le fond ne bouge pas, 1 = il bouge comme le décor.
// plus le fond est loin, plus le chiffre est petit
const PARALLAXE_CIEL = 0.05;

// hauteur dont on remonte tous les fonds (px) : 0 = collés au bas de l'écran
const RELEVER = 40;

// pluie
const PLUIE_VENT = -100; // vitesse horizontale des gouttes (négatif = vers la gauche)
const PLUIE_INTENSITE = 6; // ms entre deux gouttes : plus petit = plus de pluie

// corde (fonctionne comme une échelle)
const CORDE_VITESSE = 120; // vitesse de montée / descente (px/s)

// crocodile
const CROCO_DELAI = 5000; // ms entre deux sauts (peut être surchargé dans Tiled par la propriété "delay")
const CROCO_ECHELLE = 0.45; // 720px * 0.45 = 324px de haut
const CROCO_HITBOX_L = 100; // largeur de la hitbox (en pixels du spritesheet)
const CROCO_HITBOX_H = 600; // hauteur de la hitbox
const CROCO_FRAME_DEBUT_DEGATS = 2; // la hitbox est active de la frame 2...
const CROCO_FRAME_FIN_DEGATS = 6; // ...à la frame 6
const CROCO_DEGATS = 1; // vies perdues par le joueur
const VIES_JOUEUR = 3; // vies au départ (à brancher sur ton config.txt si besoin)
const INVINCIBILITE = 1000; // ms d'invincibilité après un coup

// spritesheets de portes (optionnel). Clé -> fichier + taille d'UNE frame.
const SPRITESHEETS_PORTES = {
  // img_porte_bois: { fichier: "./assets/spritesheet/porte_bois.png", largeur: 60, hauteur: 80 }
};
const PORTE_VITESSE_ANIM = 10; // images par seconde de l'ouverture

const COUCHES_BATIMENTS = [
  { facteur: 0.15, echelle: 0.45, pieds: 700, teinte: 0x7a809e, decalage: 900 },
  { facteur: 0.45, echelle: 0.65, pieds: 720, teinte: 0xffffff, decalage: 0 }
];

// définition de la classe "exterieur" (Niveau 1)
export default class exterieur extends Phaser.Scene {
  constructor() {
    super({ key: "exterieur" });
  }

  // reçoit { depuis: "suivant" } quand on revient du toit
  init(data) {
    this.depuis = data.depuis;
  }

  /***********************************************************************/
  /** FONCTION PRELOAD 
/***********************************************************************/

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    
    this.load.setBaseURL(baseURL);
    
    this.load.image("img_ciel", "./assets/sky.png");
    this.load.image("img_batiments", "./assets/batiments.png");
    this.load.image("img_plateforme", "./assets/platform.png");
    this.load.image("img_tuiles", "./assets/tuilesJeu.png");
    this.load.tilemapTiledJSON("map_exterieur", "./assets/map_exterieure.json");
    fct.chargerPerso(this);
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    this.load.image("img_opera", "./assets/opera.png");
    this.load.audio("son_pluie", "./assets/musique/fond_paris_pluie.mp3");
    Object.entries(SPRITESHEETS_PORTES).forEach(([cle, d]) => {
      this.load.spritesheet(cle, d.fichier, { frameWidth: d.largeur, frameHeight: d.hauteur });
    });

    this.load.spritesheet("portier", "./assets/spritesheet/portier.png", {
      frameWidth: 36,
      frameHeight: 64
    });

    this.load.spritesheet("croco", "./assets/spritesheet/croco.png", {
      frameWidth: 270,
      frameHeight: 720
    });
  }

  /***********************************************************************/
  /** FONCTION CREATE 
/***********************************************************************/

  create() {
    this.vies = VIES_JOUEUR;
    this.invincible = false;

    /*************************************
     *  CREATION DU MONDE + PLATEFORMES  *
     *************************************/

    const echelle = (720 + RELEVER) / 1536;
    this.echelle_fond = echelle;

    const map = this.make.tilemap({ key: "map_exterieur" });
    const tileset = map.addTilesetImage("tuilesJeu", "img_tuiles");
    map.createLayer("deco_bg", tileset, 0, 0).setDepth(-6);
    map.createLayer("deco", tileset, 0, 0).setDepth(-5);
    this.calque_corde = map.createLayer("corde", tileset, 0, 0).setDepth(-3);
    this.enCorde = false;
    calque_sol = map.createLayer("Calque de Tuiles 1", tileset, 0, 0);
    calque_sol.setCollisionByExclusion([-1, 0]);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.opera = this.physics.add
      .staticImage(3600, 1000, "img_opera")
      .setOrigin(0.5, 1)
      .setScale(2.8)
      .setDepth(-4)
      .refreshBody();

    this.fond_ciel = this.add
      .tileSprite(0, -RELEVER, 1280, 720 + RELEVER, "img_ciel")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setTileScale(echelle, echelle)
      .setDepth(-30);

    this.couches = COUCHES_BATIMENTS.map((c) => {
      const sprite = this.add
        .tileSprite(0, c.pieds - RELEVER - 1404 * c.echelle, 1280, 1536 * c.echelle, "img_batiments")
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setTileScale(c.echelle, c.echelle)
        .setTint(c.teinte)
        .setDepth(-10);
      return { sprite, ...c };
    });

    /****************************
     *  PORTES (calque Tiled)   *
     ****************************/
    this.portes = [];
    this.porteEnCours = false;
    const calque_portes = map.getObjectLayer("portes");
    if (!calque_portes) {
      console.warn('Calque d\'objets "portes" introuvable dans la map Tiled');
    } else {
      calque_portes.objects.forEach((o) => {
        const prop = (nom, defaut) => {
          const p = o.properties && o.properties.find((p) => p.name === nom);
          return p ? p.value : defaut;
        };
        let cle = prop("sprite", "img_porte1");
        if (!this.textures.exists(cle)) {
          console.warn('Porte : le sprite "' + cle + '" n\'existe pas, img_porte1 utilisé à la place');
          cle = "img_porte1";
        }
        const sprite = this.physics.add
          .staticSprite(o.x, o.y, cle, 0)
          .setOrigin(0.5, 1)
          .setScale(prop("echelle", 3))
          .setAlpha(prop("opacite", 1))
          .setDepth(-1)
          .refreshBody();
        this.portes.push({
          sprite,
          cle,
          destination: prop("destination", null),
          depuis: prop("depuis", "precedent"),
          verrouillee: prop("verrouillee", false),
          message: prop("message", "Cette porte est verrouillée")
        });
      });
    }

    this.texte_verrou = this.add
      .text(640, 60, "", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000"
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    this.input.on("pointerdown", (p) => console.log(Math.round(p.worldX), Math.round(p.worldY)));

    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/

    const spawn_depart = map.findObject("spawn", (o) => o.name === "depart");

    let pos = spawn_depart;
    if (this.depuis === "suivant") {
      const porteRetour = this.portes.find((p) => p.destination === "toit");
      if (porteRetour) pos = { x: porteRetour.sprite.x, y: porteRetour.sprite.y - 40 };
    }
    if (!pos) pos = { x: 100, y: 450 };
    player = this.physics.add.sprite(pos.x, pos.y, "img_perso");

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    /***************************
     *  CREATION DES ANIMATIONS *
     ****************************/
    fct.creerAnimsPerso(this);
    fct.initVies(this, this.depuis === undefined);

    /*****************
     *  PNJ (calque Tiled)
     *****************/
    if (!this.anims.exists("portier_anim")) {
      this.anims.create({
        key: "portier_anim",
        frames: this.anims.generateFrameNumbers("portier", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }

    const calque_pnj = map.getObjectLayer("pnj");
    if (!calque_pnj) {
      console.warn('Calque d\'objets "pnj" introuvable dans la map Tiled');
    } else {
      calque_pnj.objects.forEach((o) => {
        const prop = (nom, defaut) => {
          const p = o.properties && o.properties.find((p) => p.name === nom);
          return p ? p.value : defaut;
        };
        const pnj = this.add
          .sprite(o.x, o.y, "portier", 0)
          .setOrigin(0.5, 1)
          .setScale(prop("echelle", 1.3))
          .setFlipX(prop("flip", false))
          .setDepth(-2);
        pnj.anims.msPerFrame = 1000 / prop("vitesse", 6);
        pnj.play("portier_anim");
      });
    }

    if (!this.anims.exists("croco_jump")) {
      this.anims.create({
        key: "croco_jump",
        frames: this.anims.generateFrameNumbers("croco", { start: 1, end: 7 }),
        frameRate: 4,
        repeat: 0
      });
    }

    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    clavier = fct.creerClavier(this);

    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
     ******************************************************/

    this.physics.add.collider(player, calque_sol);

    /*****************
     *  CROCODILES   *
     *****************/
    this.groupe_crocos = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    const calque_crocos = map.getObjectLayer("crocos");
    if (!calque_crocos) {
      console.warn('Calque d\'objets "crocos" introuvable dans la map Tiled');
    } else {
      calque_crocos.objects.forEach((o) => this.creerCroco(o));
    }

    this.physics.add.overlap(player, this.groupe_crocos, this.toucheCroco, null, this);

    /*****************
     *  ESCALIERS    *
     *****************/
    this.escaliers = [];
    this.surEscalier = false;
    const calque_escaliers = map.getObjectLayer("escaliers");
    if (!calque_escaliers) {
      console.warn('Calque d\'objets "escaliers" introuvable dans la map Tiled');
    } else {
      calque_escaliers.objects.forEach((o) => {
        const p = o.properties && o.properties.find((p) => p.name === "sens");
        this.escaliers.push({
          x: o.x,
          y: o.y,
          w: o.width,
          h: o.height,
          sens: p ? p.value : "droite"
        });
      });
    }

    /*****************
     *  PLUIE        *
     *****************/
    if (!this.textures.exists("img_goutte")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xaec6e8, 1);
      g.fillRect(0, 0, 2, 16);
      g.generateTexture("img_goutte", 2, 16);
      g.destroy();
    }

    this.pluie = this.add
      .particles(0, 0, "img_goutte", {
        emitZone: {
          type: "random",
          source: new Phaser.Geom.Rectangle(0, -30, 1280 - PLUIE_VENT * 1.2, 10)
        },
        speedY: { min: 700, max: 1000 },
        speedX: PLUIE_VENT,
        rotate: Math.atan(-PLUIE_VENT / 850) * (180 / Math.PI),
        lifespan: 1200,
        alpha: { min: 0.2, max: 0.5 },
        frequency: PLUIE_INTENSITE,
        advance: 1200
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.sound.stopByKey("musique_menu");

    if (this.cache.audio.exists("son_pluie")) {
      const musique = this.sound.add("son_pluie", { loop: true, volume: 0.5 });
      musique.play();
      this.events.once("shutdown", () => musique.stop());
    } else {
      console.warn("Musique introuvable : vérifie le chemin ./assets/musique/fond_paris_pluie.mp3");
    }
  }

  /***********************************************************************/
  /** FONCTIONS DU CROCODILE
/***********************************************************************/

  creerCroco(o) {
    const c = this.groupe_crocos.create(o.x, o.y, "croco", 0);
    c.setOrigin(0.5, 1);
    c.setScale(CROCO_ECHELLE);
    c.setDepth(1);

    c.body.setSize(CROCO_HITBOX_L, CROCO_HITBOX_H);
    c.body.setOffset((270 - CROCO_HITBOX_L) / 2, 720 - CROCO_HITBOX_H);
    c.body.enable = false;
    c.a_touche = false;

    c.on("animationupdate", (anim, frame) => {
      const f = frame.textureFrame;
      c.body.enable = f >= CROCO_FRAME_DEBUT_DEGATS && f <= CROCO_FRAME_FIN_DEGATS;
    });

    c.on("animationcomplete", () => {
      c.setFrame(0);
      c.body.enable = false;
      c.a_touche = false;
    });

    let delai = CROCO_DELAI;
    if (o.properties) {
      const p = o.properties.find((p) => p.name === "delay");
      if (p) delai = p.value;
    }

    let decalage = Phaser.Math.Between(500, delai);
    if (o.properties) {
      const d = o.properties.find((p) => p.name === "decalage");
      if (d) decalage = d.value;
    }

    this.time.addEvent({
      delay: delai,
      startAt: delai - decalage,
      loop: true,
      callback: () => {
        if (!c.anims.isPlaying) c.play("croco_jump");
      }
    });
  }

  toucheCroco(joueur, croco) {
    if (!croco.body.enable || croco.a_touche) return;
    croco.a_touche = true;
    this.perdreVie(CROCO_DEGATS, croco);
  }

  perdreVie(degats, source) {
    if (fct.perdreVieJoueur(this, player, degats, source)) {
      this.scene.restart({});
    }
  }

  /***********************************************************************/
  /** PORTES
/***********************************************************************/

  ouvrirPorte(porte) {
    if (this.porteEnCours) return;
    if (porte.verrouillee || !porte.destination) {
      this.texte_verrou.setText(porte.message).setVisible(true);
      if (this.timerVerrou) this.timerVerrou.remove();
      this.timerVerrou = this.time.delayedCall(1500, () => this.texte_verrou.setVisible(false));
      return;
    }

    const partir = () => this.scene.start(porte.destination, { depuis: porte.depuis });

    const nbFrames = this.textures.get(porte.cle).frameTotal - 1;
    if (nbFrames > 1) {
      this.porteEnCours = true;
      const anim = "ouvrir_" + porte.cle;
      if (!this.anims.exists(anim)) {
        this.anims.create({
          key: anim,
          frames: this.anims.generateFrameNumbers(porte.cle, { start: 0, end: nbFrames - 1 }),
          frameRate: PORTE_VITESSE_ANIM,
          repeat: 0
        });
      }
      porte.sprite.play(anim);
      porte.sprite.once("animationcomplete", partir);
    } else {
      partir();
    }
  }

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

  update() {
    const scrollX = this.cameras.main.scrollX;
    this.fond_ciel.tilePositionX = (scrollX * PARALLAXE_CIEL) / this.echelle_fond;
    this.couches.forEach((c) => {
      c.sprite.tilePositionX = (scrollX * c.facteur) / c.echelle + c.decalage;
    });

    // corde : dès qu'on est sur une tuile du calque "corde", on s'accroche
    const surCorde =
      this.calque_corde.getTileAtWorldXY(player.body.center.x, player.body.center.y) !== null;

    if (!surCorde || clavier.left.isDown || clavier.right.isDown) {
      if (this.enCorde) {
        this.enCorde = false;
        player.body.setAllowGravity(true);
        player.anims.resume();
      }
    } else {
      this.enCorde = true;
    }

    if (this.enCorde) {
      player.body.setAllowGravity(false);
      player.setVelocityX(0);
      const bouge = clavier.up.isDown || clavier.down.isDown;
      player.setVelocityY(clavier.up.isDown ? -CORDE_VITESSE : clavier.down.isDown ? CORDE_VITESSE : 0);

      const descend = clavier.down.isDown && !clavier.up.isDown;

      const mauvaisSens = player.anims.inReverse !== descend;
      if (player.anims.currentAnim?.key !== "aria_up" || (bouge && mauvaisSens)) {
        if (descend) player.anims.playReverse("aria_up");
        else player.anims.play("aria_up");
      }

      if (bouge) player.anims.resume();
      else player.anims.pause();
    } else {
      const auSol = player.body.touching.down || player.body.blocked.down || this.surEscalier;
      fct.deplacerPerso(player, clavier, auSol);
    }

    // escaliers
    this.surEscalier = false;
    this.escaliers.forEach((e) => {
      if (this.enCorde) return;
      const droite = e.sens !== "gauche";
      const xRef = droite ? player.body.right : player.body.left;
      if (xRef < e.x || xRef > e.x + e.w) return;

      const avance = droite ? xRef - e.x : e.x + e.w - xRef;
      const yLigne = e.y + e.h - avance * (e.h / e.w);
      const pieds = player.body.bottom;

      if (pieds >= yLigne - 8 && pieds <= e.y + e.h + 32 && player.body.velocity.y > -100) {
        player.y += yLigne - 1 - pieds;
        player.setVelocityY(0);
        this.surEscalier = true;
      }
    });

    // saut : Stick Haut (UP/Z) OU Bouton A (I/R) (désactivé sur la corde)
    if (
      (clavier.up.isDown || clavier.jump.isDown) &&
      !this.enCorde &&
      (player.body.touching.down || player.body.blocked.down || this.surEscalier)
    ) {
      player.setVelocityY(-330);
    }

    // Interagir (Bouton D : K / F) : ouvre la porte devant laquelle on se trouve
    if (fct.justDownInteragir(clavier)) {
      const porte = this.portes.find((p) => this.physics.overlap(player, p.sprite));
      if (porte) this.ouvrirPorte(porte);
    }
  }
}