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

    // Charger les tilesets pour salle_cles
    this.load.image("piege", "./assets/maps/tiles/piege.png");
    this.load.image("animations", "./assets/maps/tiles/animations.png");
    this.load.image("tileset1", "./assets/maps/tiles/tileset1.png");
    this.load.image("tileset2", "./assets/maps/tiles/tileset2.png");
    this.load.tilemapTiledJSON("salle_cles", "./assets/maps/salle_cles.json");
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
    // Initialiser le compteur de clés
    this.nombreClesRecuperees = 0;
    this.nombreClesTotales = 5;
    this.porteDeverrouillee = false;
    
    // Création du monde + plateformes
    this.map = this.add.tilemap("salle_cles");
    
    // Ajouter les tilesets (dans l'ordre défini dans le JSON)
    const tilesetPiege = this.map.addTilesetImage("piege", "piege");
    const tilesetAnimations = this.map.addTilesetImage("animations", "animations");
    const tileset1 = this.map.addTilesetImage("tileset1", "tileset1");
    const tileset2 = this.map.addTilesetImage("tileset2", "tileset2");
    
    // Créer les calques dans l'ordre (du fond vers le haut)
    this.calque_sol = this.map.createLayer("calque_sol", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calque_mur = this.map.createLayer("calque_mur", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calque_fenetres = this.map.createLayer("calque_fenetres", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calques_objets = this.map.createLayer("calques_objets", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calques_cles = this.map.createLayer("calques_cles", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calque_trap = this.map.createLayer("calque_trap", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);
    this.calque_mur_haut = this.map.createLayer("calque_mur_haut", [tilesetPiege, tilesetAnimations, tileset1, tileset2]);

    // Définir la profondeur des calques
    this.calque_mur_haut.setDepth(10);
    
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
        this.calque_sol,
        this.calque_mur,
        this.calque_fenetres,
        this.calques_objets,
        this.calques_cles,
        this.calque_trap,
        this.calque_mur_haut,
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

    // Collisions avec les murs - tous les tiles non-vides du calque_mur sont solides
  if (this.calque_mur) {
      this.calque_mur.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_mur);
    }
    this.calques_objets.setCollisionByProperty({ estSolide: true });
    this.physics.add.collider(this.player, this.calques_objets);


    this.physics.world.setBounds(0, 0, 1280, 736);
    this.cameras.main.setBounds(0, 0, 1280, 736);
    this.cameras.main.startFollow(this.player); // Caméra verrouillée
    this.lastDirection = "right";
    this.scene.bringToTop("hud");

    // ===========================
    // Création de la minimap
    const minimapWidth = 50;
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
      this.calque_mur,
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

    // Configurer l'overlap avec les clés
    if (this.calques_cles) {
      // Activer la collision uniquement pour les tuiles de clés (index 1161)
      this.calques_cles.setTileIndexCallback(1161, this.collecterCle, this);
      this.physics.add.overlap(this.player, this.calques_cles);
    }

    // Animer les pics
    this.animatePics();
  }

  collecterCle(sprite, tile) {
    // Incrémenter le compteur de clés
    this.nombreClesRecuperees++;
    
    // Afficher dans la console
    console.log(`Clé récupérée ! Nombre de clés : ${this.nombreClesRecuperees}/${this.nombreClesTotales}`);
    
    // Vérifier si toutes les clés sont récupérées
    if (this.nombreClesRecuperees >= this.nombreClesTotales) {
      this.porteDeverrouillee = true;
      console.log("🔓 Toutes les clés récupérées ! La porte est maintenant déverrouillée !");
    }
    
    // Supprimer la tuile (la clé disparaît)
    this.calques_cles.removeTileAt(tile.x, tile.y);
    
    return false;
  }

  verifierContactPorte() {
    // Calculer la position du joueur en tuiles
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
            this.messageCooldown = this.time.now + 2000; // Cooldown de 2 secondes
          }
          return;
        }
      }
    }
  }

  utiliserPorte() {
    // Vérifier si le joueur est sur une porte
    if (this.surPorte && this.porteDeverrouillee) {
      console.log("🚪 Téléportation vers le niveau 1...");
      this.scene.start("niveau1");
    } else if (this.surPorte && !this.porteDeverrouillee) {
      console.log(`🔒 Vous devez d'abord récupérer toutes les clés ! (${this.nombreClesRecuperees}/${this.nombreClesTotales})`);
    }
  }

  verifierPorte(sprite, tile) {
    // Vérifier si la tuile a la propriété estPorte
    if (tile.properties && tile.properties.estPorte === true) {
      // Vérifier si toutes les clés ont été récupérées
      if (this.porteDeverrouillee) {
        console.log("🚪 Porte déverrouillée ! Téléportation vers le menu...");
        
        // Téléporter vers le menu
        this.scene.start("menu");
      } else {
        console.log(`🔒 Porte verrouillée ! Il vous manque ${this.nombreClesTotales - this.nombreClesRecuperees} clé(s).`);
      }
    }
    
    return false;
  }

  animatePics() {
    const frameCount = 14;
    const frameDuration = 100;
    const firstGid = 1; // Premier GID du tileset "piege"
    
    let currentFrame = 0;
    this.picsToAnimate = [];
    
    // Parcourir le calque_trap pour trouver les tiles à animer
    this.calque_trap.forEachTile(tile => {
      if (tile.index >= firstGid && tile.index < firstGid + frameCount) {
        this.picsToAnimate.push({ x: tile.x, y: tile.y });
      }
    });

    // Créer l'animation en boucle
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
    // Gestion des coffres et de la porte (touche I)
    // ===========================
    if (Phaser.Input.Keyboard.JustDown(this.clavier.I)) {
      // Vérifier d'abord si on est sur une porte
      if (this.surPorte) {
        this.utiliserPorte();
      } else {
        // Sinon, gérer les coffres normalement
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
