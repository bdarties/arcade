import * as fct from "./fonctions.js";
import Ennemi1 from "./ennemi.js";

var clavier;
var groupe_plateformes;

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.image("tuiles_de_jeu", "./assets/maps/tiles/tuilesJeu.png");
    this.load.tilemapTiledJSON("map2", "./assets/maps/map2.json");
    this.load.spritesheet("mage1", "./assets/mage1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("magemarche", "./assets/magemarche.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("mage_attaque", "./assets/mage_attaque.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("ennemi1", "./assets/ennemi1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("fireball", "./assets/fireball_1.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet("arrow", "./assets/arrow.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.audio("damageSound", "./assets/sounds/givedamage.mp3");

    // Charger l'image de la potion (on utilise le coeur comme placeholder)
    this.load.image("potion", "./assets/hud/health/heart_3q.png");
  }

  create() {
    // Création du monde + plateformes
    this.map = this.add.tilemap("map2");
    const tileset = this.map.addTilesetImage("tuiles_de_jeu", "tuiles_de_jeu");

    this.calque_background = this.map.createLayer("calque_background", tileset);
    this.porte = this.map.createLayer("porte", tileset);
    this.calque_plateformes = this.map.createLayer(
      "calque_plateformes",
      tileset
    );
    this.poteaux = this.map.createLayer("poteaux", tileset);

    // Groupe pour les potions au sol
    this.groupePotions = this.physics.add.group();

    this.anims.create({
      key: "fireball_anim",
      frames: this.anims.generateFrameNumbers("fireball", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "arrow_anim",
      frames: this.anims.generateFrameNumbers("arrow", { start: 0, end: 4 }),
      frameRate: 10,
      repeat: -1,
    });

    // Création du personnage
    this.player = this.physics.add.sprite(120, 250, "mage1");
    this.player.body.setSize(36, 48);
    this.player.body.setOffset(14, 8);
    this.player.setCollideWorldBounds(true);
    this.pvManager = new fct.PvManager(this);


    // ==========================
    //
    // Configuration de la lumière
    //
    // ==========================
    // Configurer la lumière autour du joueur
    this.playerLight = fct.setupPlayerLight(this, this.player, {
      radius: 160,
      color: 0xf1faff,
      intensity: 0.9,
      ambientColor: 0x404040,
      tileLayers: [
        this.calque_background,
        this.calque_plateformes,
        this.poteaux,
        this.porte,
      ],
      groups: ["groupeEnnemis", "groupeBullets", "groupeFlechesEnnemis"],
      offsetY: -6,
    });

    // Créer un sprite de glow qui suit le joueur
    this.playerGlow = this.add.sprite(
      this.player.x,
      this.player.y,
      this.player.texture.key
    );
    this.playerGlow.setScale(this.player.scaleX, this.player.scaleY);
    this.playerGlow.setAlpha(0.6);
    
    if (this.playerGlow.setPipeline) {
      this.playerGlow.setPipeline("Light2D");
    }
    
    this.playerGlow.setDepth(this.player.depth - 1);

    // ==========================
    //
    // Configuration des levels
    //
    // ==========================
    // Initialiser le système de level (3 ennemis = 1 level)
    this.levelManager = new fct.LevelManager(this, { enemiesPerLevel: 3 });

    // Initialiser le système de skills
    this.skillManager = this.levelManager.skillManager;

    // ===========================
    //
    // Configuration des collisions
    //
    // ===========================

    if (this.calque_plateformes) {
      this.calque_plateformes.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_plateformes);
    }

    this.physics.world.setBounds(0, 0, 3200, 640);
    this.cameras.main.setBounds(0, 0, 3200, 640);
    this.cameras.main.startFollow(this.player);
    this.lastDirection = "right";
    this.scene.bringToTop("hud");

    // ===========================
    // Création de la minimap
    const minimapWidth = 200;
    const minimapHeight = 50;
    const minimapX = this.cameras.main.width - minimapWidth - 10;
    const minimapY = 10;

    this.minimap = this.cameras.add(
      minimapX,
      minimapY,
      minimapWidth,
      minimapHeight
    );
    this.minimap.setZoom(.0625); // Zoom pour voir toute la carte
    this.minimap.setBounds(0, 0, 3200, 640);
    this.minimap.startFollow(this.player);
    this.minimap.setBackgroundColor(0x002244);

    // Bordure de la minimap
    this.minimapBorder = this.add.graphics();
    this.minimapBorder.lineStyle(2, 0xffffff, 1);
    this.minimapBorder.strokeRect(
      minimapX,
      minimapY,
      minimapWidth,
      minimapHeight
    );
    this.minimapBorder.setScrollFactor(0);
    this.minimapBorder.setDepth(1001);

    // Animations    // Animations
    this.anims.create({
      key: "mage_idle",
      frames: this.anims.generateFrameNumbers("mage1", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: "mage_walk_left",
      frames: this.anims.generateFrameNumbers("magemarche", {
        start: 0,
        end: 5,
      }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "mage_attack",
      frames: this.anims.generateFrameNumbers("mage_attaque", {
        start: 0,
        end: 11,
      }),
      frameRate: 24,
      repeat: 0,
    });

    //============================
    //
    // Création du clavier
    //
    //============================
    this.clavier = this.input.keyboard.createCursorKeys();
    this.clavier.O = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.O
    );
    this.clavier.I = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.I
    );
    this.clavier.F = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.F
    );
    this.clavier.P = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.P
  );
    // ===========================
    //
    // Création des ennemis
    //
    // ==========================
    this.groupeBullets = this.physics.add.group();
    this.physics.add.collider(
      this.groupeBullets,
      this.calque_plateformes,
      (bullet) => {
        bullet.destroy();
      }
    );

    this.groupeEnnemis = fct.creerEnnemis(this, Ennemi1);

    if (this.groupeEnnemis.getChildren().length === 0) {
      console.log("Aucun ennemi trouvé dans Tiled, création manuelle...");
      this.groupeEnnemis = this.physics.add.group();
      const ennemi = new Ennemi1(this, 400, 250);
      this.groupeEnnemis.add(ennemi);
      console.log("Ennemi créé à la position (400, 250)");
    }

    this.physics.add.collider(this.groupeEnnemis, this.calque_plateformes);
    this.physics.add.overlap(
      this.groupeBullets,
      this.groupeEnnemis,
      this.balleToucheEnnemi,
      null,
      this
    );

    this.groupeFlechesEnnemis = this.physics.add.group();
    this.physics.add.collider(
      this.groupeFlechesEnnemis,
      this.calque_plateformes,
      (fleche) => {
        fleche.destroy();
      }
    );
    this.physics.add.overlap(
      this.groupeFlechesEnnemis,
      this.player,
      this.flecheToucheJoueur,
      null,
      this
    );

    // Appliquer Light2D aux ennemis existants et futurs
    if (this.groupeEnnemis && this.groupeEnnemis.getChildren) {
      this.groupeEnnemis.getChildren().forEach((child) => {
        if (child && child.setPipeline) {
          child.setPipeline("Light2D");
        }
      });
      
      if (this.groupeEnnemis.on) {
        this.groupeEnnemis.on("add", (group, child) => {
          if (child && child.setPipeline) {
            child.setPipeline("Light2D");
          }
        });
      }
    }

    this.damageSound = this.sound.add("damageSound");
    this.damageSound.setVolume(0.5);

    // Collision avec les potions
    this.physics.add.overlap(
      this.player,
      this.groupePotions,
      this.ramasserPotion,
      null,
      this
    );
  }

  update() {
    // Ne pas bouger si les inputs sont bloqués
    if (this.inputsBlocked) {
      this.player.setVelocity(0, 0);
      return;
    }

    // Mouvements avec bonus de vitesse
    let velociteX = 0;
    let velociteY = 0;
    const vitesseBase = 90;
    
    let multiplicateurVitesse = 1;
    if (this.skillManager) {
      multiplicateurVitesse = this.skillManager.getSpeedMultiplier();
    }
    
    const vitesse = vitesseBase * multiplicateurVitesse;

    // Gestion des déplacements
    if (!this.isAttacking) {
      if (this.clavier.left.isDown) {
        velociteX = -vitesse;
        this.player.flipX = true;
        this.lastDirection = "left";
        this.player.anims.play("mage_walk_left", true);
      }
      if (this.clavier.right.isDown) {
        velociteX = vitesse;
        this.player.flipX = false;
        this.lastDirection = "right";
        this.player.anims.play("mage_walk_left", true);
      }
      if (this.clavier.up.isDown) {
        velociteY = -vitesse;
        this.lastDirection = "up";
      }
      if (this.clavier.down.isDown) {
        velociteY = vitesse;
        this.lastDirection = "down";
      }

      // Appliquer la vélocité avec interpolation
      const nouvelleVelociteX = Phaser.Math.Linear(
        this.player.body.velocity.x, 
        velociteX, 
        0.2
      );
      const nouvelleVelociteY = Phaser.Math.Linear(
        this.player.body.velocity.y, 
        velociteY, 
        0.2
      );
      this.player.setVelocity(nouvelleVelociteX, nouvelleVelociteY);

      // Animation : marche ou idle
      if (velociteX !== 0 || velociteY !== 0) {
        this.player.anims.play("mage_walk_left", true);
      } else {
        this.player.anims.play("mage_idle", true);
      }
    }

    // ===========================
    // Gestion du shoot (touche O)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.O)) {
      fct.lancerAttaque(this);
    }

    // ===========================
    // Gestion du menu pause (touche F)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.F)) {
      this.scene.launch("PauseScene", { from: this.scene.key });
      this.scene.pause();
    }

    // ===========================
    // Gestion des coffres (touche I)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.I)) {
      fct.gererCoffre(this);
    }

    // ===========================
    // Utiliser une potion (touche P)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.P)) {
      fct.utiliserPotion(this, this.pvManager);
    }

    // Mise à jour des ennemis
    if (this.groupeEnnemis) {
      this.groupeEnnemis.getChildren().forEach((ennemi) => {
        ennemi.update();
      });
    }

    // Synchroniser le glow avec le joueur : position, flip et animation
    if (this.playerGlow) {
      this.playerGlow.x = this.player.x;
      this.playerGlow.y = this.player.y;
      this.playerGlow.flipX = this.player.flipX;
      if (this.player.anims && this.player.anims.currentAnim) {
        const key = this.player.anims.currentAnim.key;
        if (
          !this.playerGlow.anims.currentAnim ||
          this.playerGlow.anims.currentAnim.key !== key
        ) {
          this.playerGlow.anims.play(key, true);
        }
      } else {
        // si pas d'anim, forcer le frame courant
        if (this.player.frame)
          this.playerGlow.setFrame(
            this.player.frame.name || this.player.frame.index
          );
      }
    }

    if (this.playerLight) {
      this.playerLight.x = this.player.x;
      this.playerLight.y = this.player.y;
    }

    // Appliquer Light2D sur les flèches ennemies (existantes et futures)
    if (this.groupeFlechesEnnemis && this.groupeFlechesEnnemis.getChildren) {
      this.groupeFlechesEnnemis.getChildren().forEach((child) => {
        if (child && child.setPipeline) {
          child.setPipeline("Light2D");
        }
      });
      
      if (this.groupeFlechesEnnemis.on) {
        this.groupeFlechesEnnemis.on("add", (group, child) => {
          if (child && child.setPipeline) {
            child.setPipeline("Light2D");
          }
        });
      }
    }

    // Appliquer Light2D sur les projectiles déjà présents et futurs
    if (this.groupeBullets && this.groupeBullets.getChildren) {
      this.groupeBullets.getChildren().forEach((child) => {
        if (child && child.setPipeline) {
          child.setPipeline("Light2D");
        }
      });
      
      if (this.groupeBullets.on) {
        this.groupeBullets.on("add", (group, child) => {
          if (child && child.setPipeline) {
            child.setPipeline("Light2D");
          }
        });
      }
    }
  }

  ramasserPotion(player, potion) {
    fct.ramasserPotion(this, player, potion);
  }

  balleToucheEnnemi(bullet, ennemi) {
    // Calculer les dégâts avec le bonus de Force
    const degatsBase = 1;
    
    let bonusDegats = 0;
    if (this.skillManager) {
      bonusDegats = this.skillManager.getDamageBonus();
    }
    
    const degatsTotal = degatsBase + bonusDegats;

    ennemi.prendreDegats(degatsTotal);
    bullet.destroy();
    this.damageSound.play();
  }

  flecheToucheJoueur(player, fleche) {
    if (fleche.origine === "ennemi") {
      console.log("Joueur touché par une flèche !");
      
      const degats = fleche.degats || 1;
      this.pvManager.damage(degats);

      player.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        player.clearTint();
      });

      fleche.destroy();
    }
  }

  flecheToucheEnnemi(fleche, ennemi) {
    // Ne pas toucher son propre ennemi source
    if (fleche.origine === "ennemi" && fleche.ennemiSource === ennemi) {
      return;
    }

    // Seulement les flèches du joueur blessent les ennemis
    if (fleche.origine !== "ennemi") {
      ennemi.prendreDegats(fleche.degats);
      fleche.destroy();
    }
  }
}
