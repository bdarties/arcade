import * as fct from "./fonctions.js";
import { musicManager } from './MusicManager.js';

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" }); 
  }

  // helper: convert a life value (1..5) to spritesheet frame index (0..4)
  frameForVie(vie) {
    const clamped = Math.max(1, Math.min(5, Math.round(vie)));
    return 5 - clamped; // 5->0, 4->1, ..., 1->4
  }

  preload() {
    // Précharger les musiques
    musicManager.preloadMusic(this);
    
    this.load.image("background_niveau3", "assets/background_niveau3.jpg");
    this.load.image("tiles", "assets/tileset.png");
    this.load.image("selection", "assets/selection.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
    this.load.image("button", "assets/button.png");
    this.load.image("tir", "assets/tir.png");
    this.load.image("terminal_rempli", "assets/terminal_rempli.png");
    this.load.image("screen_victoire", "assets/screen_victoire.png");
    this.load.audio("ramassage_engrenage", "assets/son/ramassage_engrenage.mp3");
    this.load.audio("button_on", "assets/son/button_on.mp3");
    this.load.audio("button_off", "assets/son/button_off.mp3");
    this.load.audio("tir_son", "assets/son/tir.mp3");
  // sons de gasp (copié depuis niveau3)
  this.load.audio('j1_gasp1', 'assets/son/j1_gasp1.mp3');
  this.load.audio('j1_gasp2', 'assets/son/j1_gasp2.mp3');
  this.load.audio('j1_gasp3', 'assets/son/j1_gasp3.mp3');
  this.load.audio('j1_gasp4', 'assets/son/j1_gasp4.mp3');
  this.load.audio('j1_gasp5', 'assets/son/j1_gasp5.mp3');
  this.load.audio('j1_gasp6', 'assets/son/j1_gasp6.mp3');
  this.load.audio('j2_gasp1', 'assets/son/j2_gasp1.mp3');
  this.load.audio('j2_gasp2', 'assets/son/j2_gasp2.mp3');
  this.load.audio('j2_gasp3', 'assets/son/j2_gasp3.mp3');
  this.load.audio('j2_gasp4', 'assets/son/j2_gasp4.mp3');
  this.load.audio('j2_gasp5', 'assets/son/j2_gasp5.mp3');
  this.load.audio('j2_gasp6', 'assets/son/j2_gasp6.mp3');
  // lifebar spritesheet (5 frames: 5/5 -> frame 0, ... 1/5 -> frame 4)
  this.load.spritesheet('lifebar', 'assets/lifebar.png', { frameWidth: 398, frameHeight: 89 });
    // compteur d'engrenages (spritesheet frames horizontales)
    this.load.spritesheet('engrenages_sprite', 'assets/engrenages_sprite.png', { frameWidth: 137, frameHeight: 43 });
    this.load.image("trappe_h", "assets/trappe_h.png");
    this.load.image("trappe_v", "assets/trappe_v.png");
    this.load.image("door1", "assets/door1.png");

    this.load.tilemapTiledJSON("map_niveau3", "maps/map_niveau3.json");

    // Spritesheets divers
    this.load.spritesheet("gearPiece", "assets/gearPiece.png", {
      frameWidth: 64,
      frameHeight: 64
    });

    // Spritesheets Joueur 1
    this.load.spritesheet("img_perso1", "assets/mouv_J1.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("J1_idle", "assets/idle_J1.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("J1_jump", "assets/jump_J1.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("magie_J1", "assets/magie_J1.png", {
      frameWidth: 64,
      frameHeight: 64
    });

    // Spritesheets Joueur 2
    this.load.spritesheet("img_perso2", "assets/mouv_J2.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("J2_idle", "assets/idle_J2.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("J2_jump", "assets/jump_J2.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("magie_J2", "assets/magie_J2.png", {
      frameWidth: 64,
      frameHeight: 64
    });

    // spritesheets ennemis
    this.load.spritesheet("enemy_walk", "assets/enemy_walk.png", {
      frameWidth: 128,
      frameHeight: 96
    });
    this.load.spritesheet("enemy_tir", "assets/enemy_tir.png", {
      frameWidth: 128,
      frameHeight: 96
    });
    this.load.spritesheet("enemy_dead", "assets/enemy_dead.png", {
      frameWidth: 128,
      frameHeight: 96
    });
  }

  create(data) {
    // Stocker le mode de jeu
    this.gameMode = data?.mode || 'histoire';

    // Initialiser la musique du niveau
    musicManager.scene = this;
    musicManager.play('niveau2');

    // Configuration des touches pour le menu pause (P ou Y)
    this.input.keyboard.on('keydown-P', () => {
      this.scene.pause();
      this.scene.launch('pause');
    });
    this.input.keyboard.on('keydown-Y', () => {
      this.scene.pause();
      this.scene.launch('pause');
    });

    // Initialisation des sons pour ce niveau
    this.sounds = {
      buttonOn: this.sound.add('button_on'),
      buttonOff: this.sound.add('button_off'),
      tirSon: this.sound.add('tir_son')
    };



    // Initialisation de la carte
    const map = this.make.tilemap({ key: "map_niveau3" });
    const tileset = map.addTilesetImage("tileset", "tiles");

    // Création des couches dans l'ordre de profondeur
    const background2Layer = map.createLayer('background2', tileset, 0, 0);
    this.add.image(450, 0, "background_niveau3").setOrigin(0, 0).setDepth(-1);
    const backgroundLayer = map.createLayer('background', tileset, 0, 0);

    this.platformsLayer = map.createLayer('platforms', tileset, 0, 0);
    if (this.platformsLayer) {
      this.platformsLayer.setCollisionBetween(1, 9999);
    }

    const decorLayer = map.createLayer('decor', tileset, 0, 0);
    if (decorLayer) {
      decorLayer.setDepth(50);
    }

    this.map = map;

    this.player1 = this.createPlayer(432, 30, "img_perso1");
    this.player2 = this.createPlayer(2112, 30, "img_perso2");

    // Configuration des claviers
    this.clavier1 = this.input.keyboard.createCursorKeys();
  // Remap J1 jump to K
  this.clavier1.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.clavier1.action = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.clavier1.respawn = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.clavier1.tir = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.clavier1.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.clavier2 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.F, // J2 jump -> F
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      action: Phaser.Input.Keyboard.KeyCodes.R,
      respawn: Phaser.Input.Keyboard.KeyCodes.Y,
      tir: Phaser.Input.Keyboard.KeyCodes.T
    });

    // Système de projectiles
    this.projectiles = this.physics.add.group({
      allowGravity: false
    });

    // Système boutons et obstacles
    const boutonsObjects = this.map.getObjectLayer('boutons')?.objects || [];
    this.boutons = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });
    
    boutonsObjects.forEach(obj => {
      const bouton = this.physics.add.sprite(obj.x, obj.y, 'button');
      bouton.setImmovable(true);
      bouton.body.setGravityY(0);
      bouton.setSize(32, 28);
      bouton.obstacleId = obj.properties?.find(p => p.name === 'obstacle_id')?.value || obj.name;
      bouton.isActivated = false;
      this.boutons.add(bouton);
    });

    const obstaclesObjects = this.map.getObjectLayer('obstacles')?.objects || [];
    this.obstacles = this.physics.add.group({
      allowGravity: false,
      immovable: true,
      moves: false
    });

    obstaclesObjects.forEach(obj => {
      let spriteKey = 'trappe_h';
      if (obj.properties) {
        const typeObstacle = obj.properties.find(p => p.name === 'type')?.value;
        if (typeObstacle === 'trappe_v') spriteKey = 'trappe_v';
        if (typeObstacle === 'door') spriteKey = 'door1';
      }
      
      const obstacle = this.physics.add.sprite(obj.x, obj.y, spriteKey);
      obstacle.setImmovable(true);
      obstacle.body.setGravityY(0);
      obstacle.refreshBody();
      obstacle.obstacleId = obj.properties?.find(p => p.name === 'id')?.value || obj.name;
      obstacle.isActive = true;
      this.obstacles.add(obstacle);
    });

    // Terminal
    const objetsObjects = this.map.getObjectLayer('terminal')?.objects || [];
    const terminalObj = objetsObjects.find(obj => obj.name === 'terminal');
    if (terminalObj) {
      // Créer l'image (toujours visible) et ajouter un corps physique statique pour les détections
      this.porte_retour = this.add.image(terminalObj.x, terminalObj.y+83, 'terminal_rempli')
        .setOrigin(0.5, 1) // origine en bas-centre pour coller souvent à la map
        .setDepth(50)
        .setScale(1);

      // Ajouter un body statique pour les overlaps/hitboxes
      this.physics.add.existing(this.porte_retour, true); // true -> static body
      // définir une hitbox raisonnable même si l'objet Tiled est un point
      if (this.porte_retour.body && this.porte_retour.body.setSize) {
        this.porte_retour.body.setSize(64, 64);
        // centrer la hitbox par rapport à l'image
        this.porte_retour.body.setOffset(-32, -64);
      }

      // état d'activation pour empêcher plusieurs activations
      this.doorActive = true;
    }

    // Engrenages et animations
    this.anims.create({
      key: "gearSpin",
      frames: this.anims.generateFrameNumbers("gearPiece", { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    const engrenagesObjects = this.map.getObjectLayer('engrenages')?.objects || [];
    this.engrenages = this.add.group();

    engrenagesObjects.forEach(obj => {
      const engrenage = this.add.sprite(obj.x, obj.y, "gearPiece");
      engrenage.play("gearSpin");
      engrenage.setSize(10, 10);
      this.engrenages.add(engrenage);
    });

    this.nbEngrenages = 0;
    this.totalEngrenages = engrenagesObjects.length;

    // Collecte d'engrenages (compteurs séparés par joueur)
    // initialiser compteurs
    this.engrenagesCountJ1 = 0;
    this.engrenagesCountJ2 = 0;
    // valeur de pop target
    this.engrenagesCounterPopTo = 2.0;

    this.collectEngrenage = (player, engrenage) => {
      try {
        if (!engrenage) return;
        // Désactiver proprement le body physique s'il existe pour éviter re-trigger
        try {
          if (engrenage.body && typeof engrenage.disableBody === 'function') {
            engrenage.disableBody(true, true);
          } else {
            engrenage.setActive(false);
            engrenage.setVisible(false);
          }
        } catch (e) {
          // si disableBody échoue, essayer de masquer autrement
          try { engrenage.setActive(false); engrenage.setVisible(false); } catch (e2) {}
        }

        // Jouer le son de ramassage d'engrenage
        try {
          this.sound.play('ramassage_engrenage');
        } catch (e) {
          console.error('Erreur lors de la lecture du son de ramassage:', e);
        }

        this.nbEngrenages++;
        try { this.compteurText.setText(`Engrenages: ${this.nbEngrenages}/${this.totalEngrenages}`); } catch (e) {}

        const maxFrames = Math.max(1, (this.engrenagesCounterMax || 1));
        if (player === this.player1) {
          this.engrenagesCountJ1 = (this.engrenagesCountJ1 || 0) + 1;
          const frame = Math.min(this.engrenagesCountJ1, maxFrames - 1);
          if (this.engrenagesCounter && typeof this.engrenagesCounter.setFrame === 'function') {
            this.engrenagesCounter.setFrame(frame);
            // pop animation (safety)
            try {
              if (this.engrenagesCounter.scene && this.engrenagesCounter.active) {
                this.tweens.add({ targets: this.engrenagesCounter, scale: this.engrenagesCounterPopTo, duration: 140, yoyo: true });
              }
            } catch (e) { console.error('tween error J1 counter', e); }
          }
        } else if (player === this.player2) {
          this.engrenagesCountJ2 = (this.engrenagesCountJ2 || 0) + 1;
          const frame = Math.min(this.engrenagesCountJ2, maxFrames - 1);
          if (this.engrenagesCounterJ2 && typeof this.engrenagesCounterJ2.setFrame === 'function') {
            this.engrenagesCounterJ2.setFrame(frame);
            try {
              if (this.engrenagesCounterJ2.scene && this.engrenagesCounterJ2.active) {
                this.tweens.add({ targets: this.engrenagesCounterJ2, scale: this.engrenagesCounterPopTo, duration: 140, yoyo: true });
              }
            } catch (e) { console.error('tween error J2 counter', e); }
          }
        }
      } catch (err) {
        console.error('collectEngrenage error:', err);
      }
    };

    // Caméras
  this.cameras.main.setViewport(0, 0, 640, 720);
  this.camera2 = this.cameras.add(640, 0, 640, 720);
  this.cameras.main.startFollow(this.player1);
  // activer un léger lissage (lerp) pour la caméra du joueur 2 afin d'adoucir ses mouvements
  this.camera2.startFollow(this.player2, true, 0.12, 0.12);

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.camera2.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    
    

    // Configuration du HUD
    const hudTop = 10;
    const lifebarFrameWidth = 398;
    const lifebarFrameHeight = 89;
    const hudScale = 1 / 1.2;

    // Calcul des dimensions scalées
    const scaledWidth = Math.round(lifebarFrameWidth * hudScale);
    const scaledHeight = Math.round(lifebarFrameHeight * hudScale);
    const gapPx = 2;
    const scaledCounterYOffset = Math.round(scaledHeight + Math.round(gapPx * hudScale));

    // Création du HUD pour J1 (écran gauche)
    this.hudLeftContainer = this.add.container(10, hudTop).setScrollFactor(0).setDepth(1000);
    this.hudLifeJ1 = this.add.sprite(0, 0, 'lifebar', this.frameForVie(this.player1.vie))
        .setOrigin(0, 0)
        .setScale(hudScale);
    this.engrenagesCounter = this.add.sprite(8, scaledCounterYOffset, 'engrenages_sprite', 0)
        .setOrigin(0, 0)
        .setScale(hudScale * 2);
    this.hudLeftContainer.add([this.hudLifeJ1, this.engrenagesCounter]);
    
    // Création du HUD pour J2 (écran droit)
    this.hudRightContainer = this.add.container(300, hudTop).setScrollFactor(0).setDepth(1000);
    this.hudLifeJ2 = this.add.sprite(0, 0, 'lifebar', this.frameForVie(this.player2.vie))
        .setOrigin(0, 0)
        .setScale(hudScale);
    this.engrenagesCounterJ2 = this.add.sprite(98, scaledCounterYOffset, 'engrenages_sprite', 0)
        .setOrigin(0, 0)
        .setScale(hudScale * 2);
    this.hudRightContainer.add([this.hudLifeJ2, this.engrenagesCounterJ2]);

    // Configuration pour que chaque HUD n'apparaisse que dans sa caméra respective
    this.camera2.ignore(this.hudLeftContainer);
    this.cameras.main.ignore(this.hudRightContainer);

    // calculer le nombre de frames disponibles dans le spritesheet
    try { this.engrenagesCounterMax = (this.textures.get('engrenages_sprite').frameTotal || 1); } catch (e) { this.engrenagesCounterMax = 1; }

    


    
    // Collisions entre les éléments
    this.physics.add.collider(this.player1, this.platformsLayer);
    this.physics.add.collider(this.player2, this.platformsLayer);
    this.physics.add.collider(this.player1, this.obstacles);
    this.physics.add.collider(this.player2, this.obstacles);
    
    // Ajout des collisions pour les projectiles
    this.physics.add.collider(this.projectiles, this.platformsLayer, (projectile) => {
        projectile.destroy();
    });
    this.physics.add.collider(this.projectiles, this.obstacles, (projectile) => {
        projectile.destroy();
    });

    // Animations des joueurs
    // Animations J1
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("img_perso1", { start: 9, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "turn",
      frames: this.anims.generateFrameNumbers("J1_idle", { start: 5, end: 6 }),
      frameRate: 20
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("img_perso1", { start: 25, end: 31 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({ key: "jump_right", frames: this.anims.generateFrameNumbers("J1_jump", { start: 15, end: 19 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_left", frames: this.anims.generateFrameNumbers("J1_jump", { start: 5, end: 9 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_idle", frames: this.anims.generateFrameNumbers("J1_jump", { start: 10, end: 14 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "magie_left", frames: this.anims.generateFrameNumbers("magie_J1", { start: 7, end: 13 }), frameRate: 15, repeat: 0 });
    this.anims.create({ key: "magie_right", frames: this.anims.generateFrameNumbers("magie_J1", { start: 21, end: 27 }), frameRate: 15, repeat: 0 });

    // Animations J2
    this.anims.create({
      key: "left2",
      frames: this.anims.generateFrameNumbers("img_perso2", { start: 9, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "idle2",
      frames: this.anims.generateFrameNumbers("J2_idle", { start: 5, end: 6 }),
      frameRate: 20
    });
    this.anims.create({
      key: "right2",
      frames: this.anims.generateFrameNumbers("img_perso2", { start: 25, end: 31 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({ key: "jump_right2", frames: this.anims.generateFrameNumbers("J2_jump", { start: 15, end: 19 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_left2", frames: this.anims.generateFrameNumbers("J2_jump", { start: 5, end: 9 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_idle2", frames: this.anims.generateFrameNumbers("J2_jump", { start: 10, end: 14 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "magie_left2", frames: this.anims.generateFrameNumbers("magie_J2", { start: 7, end: 13 }), frameRate: 15, repeat: 0 });
    this.anims.create({ key: "magie_right2", frames: this.anims.generateFrameNumbers("magie_J2", { start: 21, end: 27 }), frameRate: 15, repeat: 0 });

    // Animations ennemis
    this.anims.create({
      key: "enemy_walk_right",
      frames: this.anims.generateFrameNumbers("enemy_walk", { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "enemy_walk_left",
      frames: this.anims.generateFrameNumbers("enemy_walk", { start: 0, end: 7 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "enemy_tir_anim",
      frames: this.anims.generateFrameNumbers("enemy_tir", { start: 0, end: 7 }),
      frameRate: 50,
      repeat: 0
    });
    this.anims.create({
      key: "enemy_dead_anim",
      frames: this.anims.generateFrameNumbers("enemy_dead", { start: 0, end: 6 }),
      frameRate: 10,
      repeat: 0
    });
    //tir ennemi
    this.enemyProjectiles = this.physics.add.group({
      allowGravity: false
    });
    this.physics.add.collider(this.enemyProjectiles, this.platformsLayer, (projectile) => {
        projectile.destroy();
    });
    this.physics.add.collider(this.enemyProjectiles, this.obstacles, (projectile) => {
        projectile.destroy();
    });
    this.physics.add.collider(this.enemyProjectiles, this.player1, (player, projectile) => {
        projectile.destroy();
        this.toucherJoueur(player);
    });
    this.physics.add.collider(this.enemyProjectiles, this.player2, (player, projectile) => {
        projectile.destroy();
        this.toucherJoueur(player);
    });

    // Création des ennemis à partir des objets de la carte
    const enemiesObjects = this.map.getObjectLayer('ennemis_tireurs')?.objects || [];
    this.enemies = this.physics.add.group();

    enemiesObjects.forEach(obj => {
      const enemy = this.physics.add.sprite(obj.x, obj.y, "enemy_walk");
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      
      // Définir la hitbox à 90x80 (un peu plus petite que le sprite pour une meilleure jouabilité)
      enemy.body.setSize(30, 80);
      enemy.body.setOffset(49, 16); // Centrer la hitbox dans le sprite
      
      // Configuration initiale
      enemy.setVelocityX(75); // Vitesse réduite pour un mouvement plus fluide
      enemy.direction = 'right';
      enemy.isDead = false;
      enemy.vie = 3;
      enemy.initialX = obj.x;
      enemy.maxDistance = 200;
      enemy.lastShot = 0;
      enemy.shootCooldown = 3000;
      enemy.detectionRange = 250;
      
      this.enemies.add(enemy);
      enemy.anims.play('enemy_walk_right', true);
    });

    this.physics.add.collider(this.enemies, this.platformsLayer);
    this.physics.add.collider(this.enemies, this.obstacles);

    this.physics.add.collider(this.player1, this.enemies, (player, enemy) => {
      this.toucherJoueur(player);
    });
    this.physics.add.collider(this.player2, this.enemies, (player, enemy) => {
      this.toucherJoueur(player);
    });

    this.physics.add.collider(this.projectiles, this.enemies, (projectile, enemy) => {
      if (enemy.isDead) return;
      
      projectile.destroy();
      enemy.vie--;

      // Effet visuel de dégât
      enemy.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        if (enemy && enemy.active) enemy.clearTint();
      });

      if (enemy.vie <= 0) {
        enemy.isDead = true;
        enemy.setVelocity(0, 0);
        enemy.anims.play('enemy_dead_anim', true);
        
        // Désactiver le corps après la mort
        this.time.delayedCall(600, () => {
          if (enemy && enemy.body) {
            enemy.body.enable = false;
          }
        });
        
        // Retirer l'ennemi après l'animation de mort
        this.time.delayedCall(2000, () => {
          if (enemy && enemy.active) {
            enemy.destroy();
          }
        });
      }
    });
      

    // Ensure the UI camera only renders HUD elements: make it ignore all other
    // children in the scene. This prevents the UI camera from covering the
    // gameplay cameras' viewports. (mirrors niveau2 logic)
    try {
      const hudSet = new Set([
        this.hudLeftContainer,
        this.hudRightContainer,
        this.hudLifeJ1,
        this.hudLifeJ2,
        this.engrenagesCounter,
        this.engrenagesCounterJ2
      ].filter(Boolean));
      (this.children.list || []).forEach(child => {
        if (!hudSet.has(child)) {
          try { this.uiCamera.ignore(child); } catch (e) {}
        }
      });
    } catch (e) {}



    // Configuration des événements d'animation
    this.player1.jumpPlayed = false;
    this.player1.on('animationcomplete', (anim, frame) => {
      if (anim.key === 'jump_right' || anim.key === 'jump_left' || anim.key === 'jump_idle') {
        try {
          const frames = anim.frames;
          if (frames && frames.length) {
            const last = frames[frames.length - 1];
            const frameIndex = (last.frame && (last.frame.index ?? last.frame.name)) ?? last.index;
            if (typeof frameIndex === 'number') this.player1.setFrame(frameIndex);
          }
        } catch (e) {}
      }
      if (anim.key === 'magie_left' || anim.key === 'magie_right') {
        this.player1.isAttacking = false;
      }
    });

    this.player2.jumpPlayed = false;
    this.player2.on('animationcomplete', (anim, frame) => {
      if (anim.key === 'jump_right2' || anim.key === 'jump_left2' || anim.key === 'jump_idle2') {
        try {
          const frames = anim.frames;
          if (frames && frames.length) {
            const last = frames[frames.length - 1];
            const frameIndex = (last.frame && (last.frame.index ?? last.frame.name)) ?? last.index;
            if (typeof frameIndex === 'number') this.player2.setFrame(frameIndex);
          }
        } catch (e) {}
      }
      if (anim.key === 'magie_left2' || anim.key === 'magie_right2') {
        this.player2.isAttacking = false;
      }
    });
  }

  createPlayer(x, y, sprite) {
    const player = this.physics.add.sprite(x, y, sprite);
    player.setBounce(0.15);
    player.setCollideWorldBounds(true);
    
    // Ajuster la hitbox du joueur
    // La hitbox fait 24x48 pixels (plus petite que le sprite de 64x64)
    const hitboxWidth = 24;
    const hitboxHeight = 52;
    player.body.setSize(hitboxWidth, hitboxHeight);
    
    // Centrer la hitbox dans le sprite
    const offsetX = (64 - hitboxWidth) / 2;  // (taille_sprite - taille_hitbox) / 2
    const offsetY = (64 - hitboxHeight);     // Aligner au bas du sprite
    player.body.setOffset(offsetX, offsetY);
    
    // Vie et direction
    player.vie = 5;
    player.directionTir = 1;
    player.positionInitiale = { x, y };  // Sauvegarder la position de spawn
    // propriétés pour lissage des déplacements (utilisées pour une décélération "bezier-like" simple)
    player.smoothVel = 0;
    player.targetVel = 0;
    
    return player;
  }

  toucherJoueur(joueur) {
    if (!joueur || joueur.isInvulnerable) return;
    
    // Perdre une vie
    joueur.vie--;
    
    // Afficher vies restantes
    if (joueur === this.player1) {
      if (this.hudLifeJ1 && this.hudLifeJ1.setFrame) this.hudLifeJ1.setFrame(this.frameForVie(joueur.vie));
    } else {
      if (this.hudLifeJ2 && this.hudLifeJ2.setFrame) this.hudLifeJ2.setFrame(this.frameForVie(joueur.vie));
    }
    
    // Effet visuel et invulnérabilité temporaire
    joueur.setTint(0xff0000);
    joueur.isInvulnerable = true;
    this.time.delayedCall(1000, () => {
      if (joueur && joueur.active) {
        joueur.clearTint();
        joueur.isInvulnerable = false;
      }
    });
    
    // Game over si plus de vie
    if (joueur.vie <= 0) {
      this.scene.start('defaite', { fromLevel: 2, mode: this.gameMode });
      return;
    }
  }

  tirerProjectile(joueur) {
    const coefDir = joueur.directionTir === -1 ? -1 : 1;
    
    // Marquer le joueur comme en train d'attaquer
    joueur.isAttacking = true;
    
    // Jouer le son de tir
    this.sounds.tirSon.play();
    
    // Jouer l'animation d'attaque magique selon la direction
    if (joueur === this.player1) {
      if (coefDir === -1) {
        joueur.anims.play("magie_left", true);
      } else {
        joueur.anims.play("magie_right", true);
      }
    } else if (joueur === this.player2) {
      if (coefDir === -1) {
        joueur.anims.play("magie_left2", true);
      } else {
        joueur.anims.play("magie_right2", true);
      }
    }
    
    // Créer la balle à côté du joueur
    const bullet = this.projectiles.create(joueur.x + (25 * coefDir), joueur.y - 4, 'tir');
    bullet.setScale(0.5);
    
    // Paramètres physiques de la balle
    bullet.setCollideWorldBounds(false);
    bullet.body.allowGravity = false;
    bullet.setVelocity(400 * coefDir, 0);
    
    // Détruire après 3 secondes
    this.time.delayedCall(3000, () => {
      if (bullet && bullet.active) {
        bullet.destroy();
      }
    });
  }

  activerBouton(bouton) {
    if (!bouton || !bouton.active) return;
    
    bouton.isActivated = !bouton.isActivated;

    // Jouer le son approprié
    try {
      if (this.sounds) {
        if (bouton.isActivated) {
          this.sounds.buttonOn.play();
        } else {
          this.sounds.buttonOff.play();
        }
      }
    } catch (e) {
      console.error('Erreur lors de la lecture du son du bouton:', e);
    }
    
    if (bouton.isActivated) {
      bouton.setTint(0x99ff99);
    } else {
      bouton.clearTint();
    }
    
    this.obstacles.children.entries.forEach(obstacle => {
      if (obstacle.obstacleId === bouton.obstacleId) {
        obstacle.isActive = !bouton.isActivated;
        
        if (obstacle.isActive) {
          obstacle.setVisible(true);
          obstacle.body.enable = true;
          obstacle.refreshBody();
          obstacle.clearTint();
        } else {
          obstacle.setVisible(false);
          obstacle.body.enable = false;
          obstacle.refreshBody();
        }
      }
    });
  }

  respawnJoueur(joueur) {
    if (!joueur || !joueur.active) {
      console.debug('[N3] respawnJoueur: joueur invalide');
      return;
    }
    
    if (joueur.vie > 0) {
      joueur.vie--;
      // Mettre   jour les sprites de lifebar
      if (joueur === this.player1) {
        if (this.hudLifeJ1 && this.hudLifeJ1.setFrame) this.hudLifeJ1.setFrame(this.frameForVie(joueur.vie));
      } else {
        if (this.hudLifeJ2 && this.hudLifeJ2.setFrame) this.hudLifeJ2.setFrame(this.frameForVie(joueur.vie));
      }
    }
    
    // Vérifier si la vie atteint zéro après respawn manuel
    if (joueur.vie <= 0) {
      this.scene.start('defaite', { fromLevel: 2, mode: this.gameMode });
      return;
    }
    
    try {
      joueur.setPosition(joueur.positionInitiale.x, joueur.positionInitiale.y);
      joueur.setVelocity(0, 0);
    } catch (e) {
      console.debug('[N3] Erreur respawn:', e);
    }
  }

  update() {
    // J1 - Gestion des mouvements
    if (this.player1) {
      const isOnGround = this.player1 && this.player1.body && (this.player1.body.blocked.down || this.player1.body.touching.down);
    
      if (this.clavier1.up.isDown && isOnGround) {
        this.player1.setVelocityY(-300);
        if (this.clavier1.right.isDown) this.player1.lastDirection = 'right';
        else if (this.clavier1.left.isDown) this.player1.lastDirection = 'left';
        
        if (this.player1.lastDirection === 'right') this.player1.anims.play('jump_right', true);
        else if (this.player1.lastDirection === 'left') this.player1.anims.play('jump_left', true);
        else this.player1.anims.play('jump_idle', true);
        try {
          if (Phaser.Math.Between(1, 2) === 1) {
            const n = Phaser.Math.Between(1, 6);
            this.sound.play(`j1_gasp${n}`);
          }
        } catch (e) {}
        this.player1.jumpPlayed = true;
      }
      
      try {
        let desiredVel1 = 0;
        if (this.clavier1.left.isDown) {
          desiredVel1 = -200;
          this.player1.lastDirection = 'left';
          this.player1.directionTir = -1;
          if (!this.player1.isAttacking) {
            if (isOnGround) this.player1.anims.play('left', true);
            else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_left', false); }
          }
        } else if (this.clavier1.right.isDown) {
          desiredVel1 = 200;
          this.player1.lastDirection = 'right';
          this.player1.directionTir = 1;
          if (!this.player1.isAttacking) {
            if (isOnGround) this.player1.anims.play('right', true);
            else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_right', false); }
          }
        } else {
          desiredVel1 = 0;
          if (!this.player1.isAttacking) {
            if (isOnGround) this.player1.anims.play('turn');
            else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_idle', false); }
          }
        }

        // interpolation lissée
        this.player1.targetVel = desiredVel1;
  const pressLerp = 0.6;
  const releaseLerp = 0.45;
        const lerpFactor1 = Math.abs(this.player1.targetVel) > Math.abs(this.player1.smoothVel) ? pressLerp : releaseLerp;
        this.player1.smoothVel = Phaser.Math.Linear(this.player1.smoothVel, this.player1.targetVel, lerpFactor1);
  if (Math.abs(this.player1.smoothVel) < 2) this.player1.smoothVel = 0;
        this.player1.setVelocityX(Math.round(this.player1.smoothVel));

        if (isOnGround) this.player1.jumpPlayed = false;
      } catch (e) {
        console.debug('[N3] Erreur mouvement P1 (lissé):', e);
      }
    }

    // J2 - Gestion des mouvements
    if (this.player2) {
      const isOnGround2 = this.player2 && this.player2.body && (this.player2.body.blocked.down || this.player2.body.touching.down);
    
      if (this.clavier2.up.isDown && isOnGround2) {
        this.player2.setVelocityY(-300);
        if (this.clavier2.right.isDown) this.player2.lastDirection = 'right';
        else if (this.clavier2.left.isDown) this.player2.lastDirection = 'left';
        
        if (this.player2.lastDirection === 'right') this.player2.anims.play('jump_right2', true);
        else if (this.player2.lastDirection === 'left') this.player2.anims.play('jump_left2', true);
        else this.player2.anims.play('jump_idle2', true);
        try {
          if (Phaser.Math.Between(1, 2) === 1) {
            const n2 = Phaser.Math.Between(1, 6);
            this.sound.play(`j2_gasp${n2}`);
          }
        } catch (e) {}
        this.player2.jumpPlayed = true;
      }
      
      // Déplacement horizontal et animations pour player2 (mouvements lissés)
      try {
        let desiredVel2 = 0;
        if (this.clavier2.left.isDown) {
          desiredVel2 = -200;
          this.player2.lastDirection = 'left';
          this.player2.directionTir = -1;
          if (!this.player2.isAttacking) {
            if (isOnGround2) this.player2.anims.play('left2', true);
            else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_left2', false); }
          }
        } else if (this.clavier2.right.isDown) {
          desiredVel2 = 200;
          this.player2.lastDirection = 'right';
          this.player2.directionTir = 1;
          if (!this.player2.isAttacking) {
            if (isOnGround2) this.player2.anims.play('right2', true);
            else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_right2', false); }
          }
        } else {
          desiredVel2 = 0;
          if (!this.player2.isAttacking) {
            if (isOnGround2) this.player2.anims.play('idle2');
            else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_idle2', false); }
          }
        }

        // interpolation lissée
        this.player2.targetVel = desiredVel2;
  const pressLerp2 = 0.6;
  const releaseLerp2 = 0.45;
        const lerpFactor2 = Math.abs(this.player2.targetVel) > Math.abs(this.player2.smoothVel) ? pressLerp2 : releaseLerp2;
        this.player2.smoothVel = Phaser.Math.Linear(this.player2.smoothVel, this.player2.targetVel, lerpFactor2);
  if (Math.abs(this.player2.smoothVel) < 2) this.player2.smoothVel = 0;
        this.player2.setVelocityX(Math.round(this.player2.smoothVel));

        if (isOnGround2) this.player2.jumpPlayed = false;
      } catch (e) {
        console.debug('[N3] Erreur mouvement P2 (lissé):', e);
      }
    }

      // reposition HUD containers (les sprites à l'intérieur sont en coordonnées locales)
      try {
        const hudScale = 1 / 2.5;
        const lifebarFrameWidth = 398;
        const scaledWidth = Math.round(lifebarFrameWidth * hudScale);
        const leftX = 10;
        const rightX = Math.max(this.scale.width - scaledWidth - 10, this.cameras.main.width + 10);
        if (this.hudLeftContainer) { this.hudLeftContainer.x = leftX; this.hudLeftContainer.y = hudTop; }
        if (this.hudRightContainer) { this.hudRightContainer.x = rightX; this.hudRightContainer.y = hudTop; }
      } catch (e) {}
    // Gestion des tirs
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.tir)) {
      this.tirerProjectile(this.player1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.tir)) {
      this.tirerProjectile(this.player2);
    }

    // Vérification des projectiles hors limites
    this.projectiles.children.entries.forEach(projectile => {
      if (!projectile.active) return;
      
      if (projectile.x < 0 || projectile.x > this.physics.world.bounds.width) {
        projectile.destroy();
      }
    });

    // Gestion des ennemis au sol
    this.enemies.children.entries.forEach(enemy => {
      if (enemy.isDead) return;

      // Vérifier si un joueur est dans le champ de détection
      let nearestPlayer = null;
      let shortestDistance = enemy.detectionRange;
      
      [this.player1, this.player2].forEach(player => {
        if (!player || !player.active) return;
        const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestPlayer = player;
        }
      });

      // Si un joueur est détecté
      if (nearestPlayer) {
        // Arrêter la patrouille et se tourner vers le joueur
        enemy.setVelocityX(0);
        enemy.setFlipX(nearestPlayer.x < enemy.x);
        enemy.direction = nearestPlayer.x < enemy.x ? 'left' : 'right';
        
        // Vérifier si on peut tirer
        const currentTime = this.time.now;
        if (currentTime - enemy.lastShot >= enemy.shootCooldown) {
          enemy.targetPlayer = nearestPlayer;
          enemy.lastShot = currentTime;

          // Animation de tir
          enemy.anims.play('enemy_tir_anim', true);
          
          enemy.once('animationcomplete', (animation) => {
            if (animation.key === 'enemy_tir_anim' && enemy.active && !enemy.isDead) {
              // Créer le projectile légèrement décalé selon la direction
              const bulletX = enemy.direction === 'left' ? enemy.x - 50 : enemy.x + 50;
              const bullet = this.enemyProjectiles.create(bulletX, enemy.y - 12, 'tir');
              bullet.setScale(0.5);
              
              // Direction horizontale selon où est le joueur
              const direction = enemy.targetPlayer.x < enemy.x ? -1 : 1;
              
              // Vitesse horizontale fixe avec composante verticale vers le haut pour tir en diagonale
              bullet.setVelocity(300 * direction, 30);
              
              // Détruire après 3 secondes
              this.time.delayedCall(3000, () => {
                if (bullet && bullet.active) {
                  bullet.destroy();
                }
              });
            }
          });
        }
      } else {
        // Reprendre la patrouille si aucun joueur détecté
        const distanceFromStart = Math.abs(enemy.x - enemy.initialX);
        if (distanceFromStart >= enemy.maxDistance || enemy.body.blocked.right || enemy.body.blocked.left) {
          // Changer de direction
          enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
          enemy.initialX = enemy.x;
          
          // Mettre à jour la vitesse et l'animation
          const newVelocity = enemy.direction === 'right' ? 75 : -75;
          enemy.setVelocityX(newVelocity);
          enemy.setFlipX(enemy.direction === 'left');
          enemy.anims.play('enemy_walk_right', true);
        }
        
        // Vérifier si l'ennemi est bloqué
        if (enemy.body.velocity.x === 0 && !nearestPlayer) {
          enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
          enemy.setVelocityX(enemy.direction === 'right' ? 75 : -75);
          enemy.setFlipX(enemy.direction === 'left');
        }
      }
    });

    // Vérification de la récupération des engrenages (version sécurisée pour éviter double-collecte)
    this.engrenages.children.entries.forEach(engrenage => {
      try {
        if (!engrenage || !engrenage.active || !engrenage.visible) return;

        // Skip if another tick already started collecting this engrenage
        if (engrenage._collecting) return;

        // si player1 est en overlap, marquer et collecter
        try {
          if (Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), engrenage.getBounds())) {
            engrenage._collecting = true;
            this.collectEngrenage(this.player1, engrenage);
            return; // déjà pris
          }
        } catch (e) {
          console.error('Erreur lors de la vérification/collecte engrenage pour player1:', e);
        }

        // si toujours actif, regarder player2
        if (engrenage.active && engrenage.visible && !engrenage._collecting) {
          try {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), engrenage.getBounds())) {
              engrenage._collecting = true;
              this.collectEngrenage(this.player2, engrenage);
              return;
            }
          } catch (e) {
            console.error('Erreur lors de la vérification/collecte engrenage pour player2:', e);
          }
        }
      } catch (e) {
        console.error('engrenage iterate error', e);
      }
    });

    // Vérification de l'activation des boutons
    if (this.boutons) {
      this.boutons.children.entries.forEach(bouton => {
        // Utiliser une zone plus large pour la détection
        const buttonBounds = bouton.getBounds();
        const interactZone = new Phaser.Geom.Rectangle(
          buttonBounds.x - 20,
          buttonBounds.y - 20,
          buttonBounds.width + 40,
          buttonBounds.height + 40
        );

        const player1NearButton = Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), interactZone);
        const player2NearButton = Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), interactZone);
        
        if (player1NearButton && Phaser.Input.Keyboard.JustDown(this.clavier1.action)) {
          this.activerBouton(bouton);
        }
        if (player2NearButton && Phaser.Input.Keyboard.JustDown(this.clavier2.action)) {
          this.activerBouton(bouton);
        }
      });
    }

    // Activation du terminal si tous les engrenages sont récoltés
    // Interaction avec le terminal : si un joueur est dessus et appuie sur la touche d'action/space
    if (this.porte_retour && this.doorActive) {
      const p1Overlap = Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), this.porte_retour.getBounds());
      const p2Overlap = Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), this.porte_retour.getBounds());

      const p1Press = Phaser.Input.Keyboard.JustDown(this.clavier1.space) || Phaser.Input.Keyboard.JustDown(this.clavier1.action);
      const p2Press = Phaser.Input.Keyboard.JustDown(this.clavier2.space) || Phaser.Input.Keyboard.JustDown(this.clavier2.action);

      // Si player1 est sur le terminal et appuie
      if (p1Overlap && p1Press) {
        if (this.nbEngrenages >= this.totalEngrenages) {
          this.doorActive = false;
          this.porte_retour.setTint(0x00ff00);
          this.time.delayedCall(1000, () => this.scene.start('introvideo3'));
        } else {
          // Teinter le terminal en rouge brièvement
          if (this.porte_retour.setTint) {
            this.porte_retour.setTint(0xff0000);
            this.time.delayedCall(500, () => { if (this.porte_retour && this.porte_retour.clearTint) this.porte_retour.clearTint(); });
          }
        }
      }

      // Si player2 est sur le terminal et appuie
      if (p2Overlap && p2Press) {
        if (this.nbEngrenages >= this.totalEngrenages) {
          this.doorActive = false;
          this.porte_retour.setTint(0x00ff00);
          this.time.delayedCall(1000, () => this.scene.start('victoire', { 
            fromLevel: 3,
            mode: this.gameMode
          }));
        } else {
          if (this.porte_retour.setTint) {
            this.porte_retour.setTint(0xff0000);
            this.time.delayedCall(500, () => { if (this.porte_retour && this.porte_retour.clearTint) this.porte_retour.clearTint(); });
          }
        }
      }
    }

    // Touches pour respawn
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.respawn)) {
      this.respawnJoueur(this.player1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.respawn)) {
      this.respawnJoueur(this.player2);
    }
  }
}