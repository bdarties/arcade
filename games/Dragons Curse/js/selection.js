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

    this.load.image("piege", "./assets/maps/tiles/piege.png");
    this.load.image("animations", "./assets/maps/tiles/animations.png");
    this.load.image("tileset1", "./assets/maps/tiles/tileset1.png");
    this.load.image("tileset2", "./assets/maps/tiles/tileset2.png");
    this.load.tilemapTiledJSON("salle_cles", "./assets/maps/salle_cles.json");
    this.load.spritesheet("pics", "./assets/maps/tiles/pics.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
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

    this.load.image("potion", "./assets/items/potion.png");
  }

  create() {
    // Initialiser le compteur de clés
    this.nombreClesRecuperees = 0;
    this.nombreClesTotales = 5;
    this.porteDeverrouillee = false;
    
    this.map = this.add.tilemap("salle_cles");
    
    const tilesetPiege = this.map.addTilesetImage("piege", "piege");
    const tilesetAnimations = this.map.addTilesetImage("animations", "animations");
    const tileset1 = this.map.addTilesetImage("tileset1", "tileset1");
    const tileset2 = this.map.addTilesetImage("tileset2", "tileset2");
    
    this.calque_sol = this.map.createLayer("calque_sol", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calque_mur = this.map.createLayer("calque_mur", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calque_fenetres = this.map.createLayer("calque_fenetres", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calques_objets = this.map.createLayer("calques_objets", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calques_cles = this.map.createLayer("calques_cles", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calque_trap = this.map.createLayer("calque_trap", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calque_mur_haut = this.map.createLayer("calque_mur_haut", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);

    // Ajuster la profondeur des calques pour le rendu correct
    this.calque_mur_haut.setDepth(10);
    
    // Référence pour les coffres
    this.poteaux = this.calques_objets;
    
    // Groupe pour les potions au sol
    this.groupePotions = this.physics.add.group();

    // ===========================
    // Création du groupe de piques
    // ===========================
    this.groupePiques = this.physics.add.staticGroup();
    
    // Ajouter des piques à des positions personnalisées
    const positionsPiques = [
      { x: 500, y: 400 },
      { x: 500, y: 370 },
      { x: 700, y: 450 },
      { x: 700, y: 420 },
      { x: 400, y: 500 },
      { x: 400, y: 550 },
      { x: 600, y: 250 },
      { x: 800, y: 270 },
      { x: 800, y: 300 },
    ];
    
    positionsPiques.forEach(pos => {
      const pique = this.groupePiques.create(pos.x, pos.y, 'pics', 0);
      pique.setScale(1); 
      pique.refreshBody();
    });

    // Créer les animations seulement si elles n'existent pas
    if (!this.anims.exists("pics_anim")) {
      this.anims.create({
        key: "pics_anim",
        frames: this.anims.generateFrameNumbers("pics", { start: 0, end: 13 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.anims.exists("fireball_anim")) {
      this.anims.create({
        key: "fireball_anim",
        frames: this.anims.generateFrameNumbers("fireball", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.anims.exists("arrow_anim")) {
      this.anims.create({
        key: "arrow_anim",
        frames: this.anims.generateFrameNumbers("arrow", { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Création du personnage
    this.player = this.physics.add.sprite(120, 250, "mage1");
    this.player.body.setSize(36, 48);
    this.player.body.setOffset(14, 8);
    this.player.setCollideWorldBounds(true);
    this.pvManager = new fct.PvManager(this);

    // ==========================
    // Configuration de la lumière
    // ==========================
    this.playerLight = fct.setupPlayerLight(this, this.player, {
      radius: 160,              // Rayon de la lumière
      color: 0xffffff,          // Couleur blanche
      intensity: 1,             // Intensité de la lumière
      ambientColor: 0x404040,   // Lumière ambiante (éclairage de base)
      offsetY: 0,               // Décalage vertical de la lumière
      tileLayers: [             // Calques de la map à éclairer
        this.calque_sol,
        this.calque_mur,
        this.calque_fenetres,
        this.calques_objets,
        this.calques_cles,
        this.calque_trap,
        this.calque_mur_haut
      ],
      groups: [                 // Groupes d'objets à éclairer
        'groupeEnnemis',
        'groupeBullets',
        'groupeFlechesEnnemis',
        'groupePiques'
      ]
    });

    // Jouer l'animation des piques
    this.groupePiques.getChildren().forEach(pique => {
      pique.anims.play("pics_anim", true);
    });

    // Ajouter collision avec les piques
    this.physics.add.overlap(this.player, this.groupePiques, this.toucherPiqueSprite, null, this);

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

    if (this.calque_mur) {
      this.calque_mur.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_mur);
    }
    this.calques_objets.setCollisionByProperty({ estSolide: true });
    this.physics.add.collider(this.player, this.calques_objets);


    this.physics.world.setBounds(0, 0, 1280, 736);
    this.cameras.main.setBounds(0, 0, 1280, 736);
    this.cameras.main.startFollow(this.player);
    this.lastDirection = "right";
    this.scene.bringToTop("hud");

    // Animations du joueur (seulement si elles n'existent pas)
    if (!this.anims.exists("mage_idle")) {
      this.anims.create({
        key: "mage_idle",
        frames: this.anims.generateFrameNumbers("mage1", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      });
    }
    if (!this.anims.exists("mage_walk_left")) {
      this.anims.create({
        key: "mage_walk_left",
        frames: this.anims.generateFrameNumbers("magemarche", {
          start: 0,
          end: 5,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists("mage_attack")) {
      this.anims.create({
        key: "mage_attack",
        frames: this.anims.generateFrameNumbers("mage_attaque", {
          start: 0,
          end: 11,
        }),
        frameRate: 24,
        repeat: 0,
      });
    }

    //============================
    //
    // Création du clavier
    //
    //============================
    this.clavier = this.input.keyboard.createCursorKeys();
    this.clavier.O = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.clavier.I = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.clavier.F = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.clavier.P = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    // ===========================
    //
    // Création des ennemis
    //
    // ==========================
    this.groupeBullets = this.physics.add.group();
    this.physics.add.collider(
      this.groupeBullets,
      this.calque_mur,
      (bullet) => {
        bullet.destroy();
      }
    );

    this.groupeEnnemis = fct.creerEnnemis(this, Ennemi1);

    if (this.groupeEnnemis.getChildren().length === 0) {
      console.log("Aucun ennemi trouvé dans Tiled, création manuelle...");
      this.groupeEnnemis = this.physics.add.group();

      // Créer 6 ennemis à des positions proches
      const ennemi1 = new Ennemi1(this, 650, 450);
      const ennemi2 = new Ennemi1(this, 620, 100);
      const ennemi3 = new Ennemi1(this, 1100, 180);
      const ennemi4 = new Ennemi1(this, 1100, 520);
      const ennemi6 = new Ennemi1(this, 260, 650);

      this.groupeEnnemis.add(ennemi1);
      this.groupeEnnemis.add(ennemi2);
      this.groupeEnnemis.add(ennemi3);
      this.groupeEnnemis.add(ennemi4);
      this.groupeEnnemis.add(ennemi6);
    }

    this.physics.add.collider(this.groupeEnnemis, this.calque_mur);
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
      this.calque_mur,
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

    this.damageSound = this.sound.add("damageSound");
    this.damageSound.setVolume(0.5);

    if (this.calques_cles) {
      this.calques_cles.setTileIndexCallback(1161, this.collecterCle, this);
      this.physics.add.overlap(this.player, this.calques_cles);
    }

    this.animatePics();
  }


  // ===========================
  //
  // Fonctions de gestion des clés et de la porte
  //
  // ===========================
  collecterCle(sprite, tile) {
    this.nombreClesRecuperees++;
    
    if (this.nombreClesRecuperees >= this.nombreClesTotales) {
      this.porteDeverrouillee = true;
      console.log("🔓 Toutes les clés récupérées ! La porte est maintenant déverrouillée !");
    }
    
    this.calques_cles.removeTileAt(tile.x, tile.y);
    
    return false;
  }

  verifierContactPorte() {
    const tileX = this.calque_mur.worldToTileX(this.player.x);
    const tileY = this.calque_mur.worldToTileY(this.player.y);
    
    // Réinitialiser l'état du contact avec la porte
    this.surPorte = false;
    
    // Vérifier les tuiles autour du joueur (car le joueur peut chevaucher plusieurs tuiles)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tile = this.calque_mur.getTileAt(tileX + dx, tileY + dy);
        
        if (tile && tile.properties && tile.properties.estPorte === true) {
          this.surPorte = true;
          
          // Afficher un message d'indication
          if (!this.messageCooldown || this.time.now > this.messageCooldown) {
            if (this.porteDeverrouillee) {
              console.log("🚪 Porte déverrouillée ! Appuyez sur I pour passer au niveau suivant.");
            } else {
              console.log(`🔒 Porte verrouillée ! Il vous manque ${this.nombreClesTotales - this.nombreClesRecuperees} clé(s).`);
            }
            this.messageCooldown = this.time.now + 2000;
          }
          return;
        }
      }
    }
  }

  utiliserPorte() {
    if (this.surPorte && this.porteDeverrouillee) {
      this.scene.start("niveau1");
    } else if (this.surPorte && !this.porteDeverrouillee) {
    }
  }

  verifierPorte(sprite, tile) {
    if (tile.properties && tile.properties.estPorte === true) {
      if (this.porteDeverrouillee) {        
        this.scene.start("menu");

      } else {
        console.log(`🔒 Porte verrouillée ! Il vous manque ${this.nombreClesTotales - this.nombreClesRecuperees} clé(s).`);
      }
    }
    return false;
  }

  animatePics() {
    // Vérifier que le calque existe
    if (!this.calque_trap) {
      console.warn("calque_trap non trouvé, animation des pièges ignorée");
      return;
    }
    
    const frameCount = 14;
    const frameDuration = 100;
    const firstGid = 1;
    
    let currentFrame = 0;
    this.picsToAnimate = [];
    
    this.calque_trap.forEachTile(tile => {
      if (tile.index >= firstGid && tile.index < firstGid + frameCount) {
        this.picsToAnimate.push({ x: tile.x, y: tile.y });
      }
    });

    this.time.addEvent({
      delay: frameDuration,
      callback: () => {
        currentFrame = (currentFrame + 1) % frameCount;
        this.picsToAnimate.forEach(pos => {
          const tile = this.calque_trap.getTileAt(pos.x, pos.y);
          if (tile) {
            tile.index = firstGid + currentFrame;
          }
        });
      },
      loop: true
    });
  }

  update() {
    if (this.inputsBlocked) {
      this.player.setVelocity(0, 0);
      return;
    }

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
    // Gestion des coffres et de la porte (touche I)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.I)) {
      if (this.surPorte) {
        this.utiliserPorte();
      } else {
        fct.gererCoffre(this);
      }
    }

    // ===========================
    // Utiliser une potion (touche P)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.P)) {
      fct.utiliserPotion(this, this.pvManager);
    }

    // ===========================
    // Vérifier le contact avec la porte
    // ===========================
    this.verifierContactPorte();

    // Mise à jour des ennemis
    if (this.groupeEnnemis) {
      this.groupeEnnemis.getChildren().forEach((ennemi) => {
        ennemi.update();
      });
    }

    if (this.playerLight) {
      this.playerLight.x = this.player.x;
      this.playerLight.y = this.player.y;
    }
  }

  balleToucheEnnemi(bullet, ennemi) {
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

  toucherPiqueSprite(player, pique) {
    // Vérifier si on peut infliger des dégâts (cooldown)
    if (!this.isDamagedBySpike || this.time.now > this.spikeDamageCooldown) {
      this.isDamagedBySpike = true;
      this.spikeDamageCooldown = this.time.now + 1000; // 1 seconde de cooldown
      
      // Infliger des dégâts
      this.pvManager.damage(1);
      
      // Effet visuel
      this.cameras.main.shake(100, 0.005);
      player.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        player.clearTint();
      });
      
      console.log("Aïe ! Touché par un pique !");
    }
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
    if (fleche.origine === "ennemi" && fleche.ennemiSource === ennemi) {
      return;
    }

    if (fleche.origine !== "ennemi") {
      ennemi.prendreDegats(fleche.degats);
      fleche.destroy();
    }
  }
}
