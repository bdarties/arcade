import PauseManager from "./pause.js";
import * as fct from "./fonctions.js";

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    this.load.image("tuiles_de_jeu", "./assets/maps/tiles/tuilesJeu2.png"); 
    this.load.image("pics", "./assets/maps/tiles/pics.png"); 
    this.load.tilemapTiledJSON("map3", "./assets/maps/map3.json");
    this.load.spritesheet("mage1", "./assets/mage1.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("magemarche", "./assets/magemarche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    // Charger l'image de la potion (on utilise le coeur comme placeholder)
    this.load.image('potion', './assets/hud/health/heart_3q.png');
  }

  create() {
    // --- PvManager
    this.pvManager = new fct.PvManager(this);
    
    // --- Initialiser le système de skills (accès global)
    this.skillManager = new fct.SkillManager(this);
    
    // --- Groupe de potions au sol
    this.groupePotions = this.physics.add.group();

    // --- Charger la map
    this.map = this.make.tilemap({ key: "map3" });

    // Associer les tilesets de Tiled avec les images chargées
    const tileset1 = this.map.addTilesetImage("tuiles_de_jeux", "tuiles_de_jeu");
    const tileset2 = this.map.addTilesetImage("pics", "pics");
    
    // Calques background et objets avec tileset de jeu
    this.calque_background = this.map.createLayer("calque_background", tileset1);
    
    // Calque pics - on va animer manuellement
    this.pics = this.map.createLayer("pics", tileset2);
    this.pics.setDepth(10);
    
    this.calque_plateformes = this.map.createLayer("calque_plateformes", tileset1);
    this.portes = this.map.createLayer("portes", tileset1);
    this.objets = this.map.createLayer("objets", tileset1);
    this.poteaux = this.objets; // Utilise le calque objets pour les coffres

    // --- Animation manuelle des pics
    this.animatePics();

    // --- Joueur
    this.player = this.physics.add.sprite(220, 250, "mage1");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(36, 48);
    this.player.body.setOffset(14, 8);
    this.scene.bringToTop('hud');

    // --- Collision plateformes
    if (this.calque_plateformes) {
      this.calque_plateformes.setCollisionByProperty({ estSolide: true });
      this.physics.add.collider(this.player, this.calque_plateformes);
    }

    // Collision avec les potions
    this.physics.add.overlap(this.player, this.groupePotions, this.ramasserPotion, null, this);

    // --- Collision danger (pics) avec timer de vérification
    this.isDamaged = false;
    this.damageTimer = null;
    
    this.physics.add.overlap(this.player, this.pics, (player, tile) => {
      if (tile && tile.index >= 183 && tile.index <= 196) {
        if (!this.isDamaged) {
          this.isDamaged = true;
          this.cameras.main.shake(100, 0.005);
          
          // Infliger des dégâts immédiatement
          console.log("Contact avec les pics !");
          this.pvManager.damage(1);
          
          this.damageTimer = this.time.delayedCall(500, () => {
            this.isDamaged = false;
          });
        }
      }
    });

    // --- Collision avec les tiles estLeve (nouveauté)
    this.isOnLeve = false;
    this.leveDamageTimer = null;
    
    // Vérifier chaque calque qui pourrait contenir des tiles estLeve
    const calquesAVerifier = [this.calque_plateformes, this.objets, this.calque_background];
    
    calquesAVerifier.forEach(calque => {
      if (calque) {
        this.physics.add.overlap(this.player, calque, (player, tile) => {
          if (tile && tile.properties.estLeve) {
            if (!this.isOnLeve) {
              this.isOnLeve = true;
              console.log("Contact avec une tile estLeve !");
              
              // Effet visuel (shake caméra)
              this.cameras.main.shake(100, 0.003);
              
              // Infliger des dégâts immédiatement
              this.pvManager.damage(1);
              
              // Timer pour éviter les dégâts multiples trop rapides
              this.leveDamageTimer = this.time.delayedCall(500, () => {
                this.isOnLeve = false;
              });
            }
          }
        });
      }
    });

    /***********************
     *  CREATION MINIMAP   *
     ***********************/ 
    this.minimap = fct.creerMinimap(this, this.player, this.map, {
      width: 180,
      height: 100,
      zoom: 0.10,
      x: 10,
      y: 10,
      calques: ["calque_background", "calque_plateformes", "poteaux"]
    });

    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    this.clavier = this.input.keyboard.createCursorKeys();
  this.clavier.O = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
  this.clavier.I = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  this.clavier.F = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
  this.clavier.P = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // --- Animations du joueur
    this.anims.create({
      key: "mage_idle",
      frames: this.anims.generateFrameNumbers("mage1", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });
    this.anims.create({
      key: "mage_walk",
      frames: this.anims.generateFrameNumbers("magemarche", { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });

    // --- Caméra
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player);

    // Enregistrer cette scène comme la scène de jeu active
    this.registry.set('currentGameScene', this.scene.key);

    // --- Contrôles
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  animatePics() {
    const frameCount = 14;
    const frameDuration = 100;
    const firstGid = 183;
    
    let currentFrame = 0;
    this.picsToAnimate = [];
    
    this.pics.forEachTile(tile => {
      if (tile.index >= firstGid && tile.index < firstGid + frameCount) {
        this.picsToAnimate.push({ x: tile.x, y: tile.y });
      }
    });

    this.time.addEvent({
      delay: frameDuration,
      callback: () => {
        currentFrame = (currentFrame + 1) % frameCount;
        this.picsToAnimate.forEach(pos => {
          const tile = this.pics.getTileAt(pos.x, pos.y);
          if (tile) {
            tile.index = firstGid + currentFrame;
          }
        });
      },
      loop: true
    });
  }

  update() {
    // Ne pas bouger si les inputs sont bloqués (pendant la sélection de skill)
    if (this.inputsBlocked) {
      this.player.setVelocity(0);
      return;
    }
    
    // Mouvements avec bonus de vitesse du skill
    const baseSpeed = 150;
    const speedMultiplier = this.skillManager ? this.skillManager.getSpeedMultiplier() : 1;
    const speed = baseSpeed * speedMultiplier;
    
    this.player.setVelocity(0);

    // Mouvements
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.flipX = true;
      this.player.anims.play("mage_walk", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.flipX = false;
      this.player.anims.play("mage_walk", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("mage_idle", true);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
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
  }

  ramasserPotion(player, potion) {
    fct.ramasserPotion(this, player, potion);
  }

}
