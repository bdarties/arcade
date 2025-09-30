import * as fct from "./fonctions.js";

export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" }); 
  }

  preload() {
  this.load.image("background_niveau3", "assets/background_niveau3.jpg");
  this.load.image("tiles", "assets/tileset.png");
  this.load.image("selection", "assets/selection.png");
  this.load.image("retour_menu", "assets/retour_menu.png");
  this.load.tilemapTiledJSON("map_niveau3", "maps/map_niveau3.json");
  this.load.spritesheet("gearPiece", "assets/gearPiece.png", {
  frameWidth: 64,
  frameHeight: 64
  });
  this.load.image("button", "assets/button.png");
  this.load.image("tir", "assets/tir.png");
  this.load.image("terminal_rempli", "assets/terminal_rempli.png");
  this.load.image("screen_victoire", "assets/screen_victoire.png");
  this.load.image("trappe_h", "assets/trappe_h.png");
  this.load.image("trappe_v", "assets/trappe_v.png");
  this.load.image("door1", "assets/door1.png");
  this.load.spritesheet("mouv_ennemi_tireur", "assets/mouv_ennemi_tireur.png", {
    frameWidth: 128,
    frameHeight: 96
  });
  this.load.spritesheet("img_perso1", "assets/mouv_J1.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("J1_idle", "assets/idle_J1.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("img_perso2", "assets/mouv_J2.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("J2_idle", "assets/idle_J2.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    // jump spritesheets
    this.load.spritesheet("J1_jump", "assets/jump_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J2_jump", "assets/jump_J2.png", { frameWidth: 64, frameHeight: 64 });
    // magie spritesheets
    this.load.spritesheet("magie_J1", "assets/magie_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("magie_J2", "assets/magie_J2.png", { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    const map = this.make.tilemap({ key: "map_niveau3" });
    const tileset = map.addTilesetImage("tileset", "tiles");

    const background2Layer = map.createLayer('background2', tileset, 0, 0);

    this.add.image(450, 0, "background_niveau3").setOrigin(0, 0).setDepth(-1);
    const backgroundLayer = map.createLayer('background', tileset, 0, 0);

    const platformsLayer = map.createLayer('platforms', tileset, 0, 0);
    if (platformsLayer) {
      platformsLayer.setCollisionBetween(1, 9999);
    }

    const decorLayer = map.createLayer('decor', tileset, 0, 0);
    if (decorLayer) {
      decorLayer.setDepth(50);
    }

    const itemsObjects = map.getObjectLayer('items');

    // Création du J1
    this.player1 = this.physics.add.sprite(432, 30, "img_perso1");
    this.player1.refreshBody();
    this.player1.setBounce(0.15);
    this.player1.setCollideWorldBounds(true);
    this.player1.setSize(26, 58);
    this.clavier1 = this.input.keyboard.createCursorKeys();
    this.clavier1.action = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.clavier1.menu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.clavier1.respawn = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.clavier1.tir = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);

    // Création du J2
    this.player2 = this.physics.add.sprite(2112, 30, "img_perso2");
    this.player2.refreshBody();
    this.player2.setBounce(0.15);
    this.player2.setCollideWorldBounds(true);
    this.player2.setSize(26, 58);
    this.clavier2 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      action: Phaser.Input.Keyboard.KeyCodes.R,
      menu: Phaser.Input.Keyboard.KeyCodes.H,
      respawn: Phaser.Input.Keyboard.KeyCodes.Y,
      tir: Phaser.Input.Keyboard.KeyCodes.T
    });

    // --- SYSTÈME DE VIE ---
    this.player1.vie = 3;
    this.player2.vie = 3;
    this.player1.positionInitiale = { x: 432, y: 30 };
    this.player2.positionInitiale = { x: 2112, y: 30 };
    this.player1.directionTir = 1;
    this.player2.directionTir = 1;
    // États d'attaque
    this.player1.isAttacking = false;
    this.player2.isAttacking = false;

    // --- PROJECTILES - CORRECTION ICI ---
    this.projectiles = this.physics.add.group({
      allowGravity: false  // Désactive la gravité pour tous les projectiles du groupe
    });

    // Collision avec les plateformes
    if (platformsLayer) {
      this.physics.add.collider(this.player1, platformsLayer);
      this.physics.add.collider(this.player2, platformsLayer);
      this.physics.add.collider(this.projectiles, platformsLayer, (projectile, tile) => {
        projectile.destroy();
      });
    }

    // --- SYSTÈME BOUTONS ET OBSTACLES ---
    const boutonsObjects = map.getObjectLayer('boutons')?.objects || [];
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

    const obstaclesObjects = map.getObjectLayer('obstacles')?.objects || [];
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

    this.physics.add.collider(this.player1, this.obstacles);
    this.physics.add.collider(this.player2, this.obstacles);

    // --- TERMINAL DEPUIS TILED ---
    const objetsObjects = map.getObjectLayer('terminal')?.objects || [];
    const terminalObj = objetsObjects.find(obj => obj.name === 'terminal');
    if (terminalObj) {
      this.porte_retour = this.physics.add.sprite(terminalObj.x, terminalObj.y, 'terminal_rempli');
    }

    if (platformsLayer && this.porte_retour) {
      this.physics.add.collider(this.porte_retour, platformsLayer);
    }

    // Split screen
    this.cameras.main.setViewport(0, 0, 640, 720);
    this.camera2 = this.cameras.add(640, 0, 640, 720);
    this.cameras.main.startFollow(this.player1);
    this.camera2.startFollow(this.player2);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.camera2.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const ennemisObjects = map.getObjectLayer('ennemis_tireurs')?.objects || [];
    this.ennemis_tireurs = this.physics.add.group();
    
    ennemisObjects.forEach((obj, index) => {
      const ennemi = this.physics.add.sprite(obj.x, obj.y, 'mouv_ennemi_tireur');
      ennemi.setSize(96, 96);
      ennemi.refreshBody();
      ennemi.vitesse = 50;
      ennemi.direction = 1;
      ennemi.distanceParcourue = 0;
      ennemi.positionPrecedente = obj.x;
      ennemi.vie = 5;
      ennemi.estRouge = false;
      
      this.ennemis_tireurs.add(ennemi);
      
      if (platformsLayer) {
        this.physics.add.collider(ennemi, platformsLayer, (ennemiSprite, tile) => {
          if (ennemiSprite.body.blocked.left || ennemiSprite.body.blocked.right) {
            ennemiSprite.direction = -ennemiSprite.direction;
          }
        });
      }
    });

    // --- ANIMATION ENGRENAGE ---
    this.anims.create({
    key: "gearSpin",
    frames: this.anims.generateFrameNumbers("gearPiece", { start: 0, end: 3 }),
    frameRate: 6,
    repeat: -1
    });

    const engrenagesObjects = map.getObjectLayer('engrenages')?.objects || [];
    this.engrenages = this.add.group();

    engrenagesObjects.forEach(obj => {
    const engrenage = this.add.sprite(obj.x, obj.y, "gearPiece");
    engrenage.play("gearSpin");
    engrenage.setSize(10, 10);
    this.engrenages.add(engrenage);
    })

    this.nbEngrenages = 0;
    this.totalEngrenages = engrenagesObjects.length;

    this.compteurText = this.add.text(320, 40, `Engrenages: ${this.nbEngrenages}/${this.totalEngrenages}`, {
      fontSize: '24px',
      fill: '#ffffff',
      strokeThickness: 2
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    this.vieJ1Text = this.add.text(50, 40, `J1 Vie: ${this.player1.vie}`, {
      fontSize: '20px',
      fill: '#ff6666',
      strokeThickness: 2
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    this.vieJ2Text = this.add.text(590, 40, `J2 Vie: ${this.player2.vie}`, {
      fontSize: '20px',
      fill: '#6666ff',
      strokeThickness: 2
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    this.controlsJ1Text = this.add.text(50, 70, 'J1: ←→ Déplacer, ↑ Sauter, O Tirer, P Respawn', {
      fontSize: '14px',
      fill: '#ffffff',
      strokeThickness: 1
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    this.controlsJ2Text = this.add.text(50, 90, 'J2: QD Déplacer, Z Sauter, T Tirer, Y Respawn', {
      fontSize: '14px',
      fill: '#ffffff',
      strokeThickness: 1
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    this.collectEngrenage = (player, engrenage) => {
      engrenage.setVisible(false);
      engrenage.setActive(false);
      this.nbEngrenages++;
      this.compteurText.setText(`Engrenages: ${this.nbEngrenages}/${this.totalEngrenages}`);
    };

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
    // jump animations J1
    this.anims.create({ key: "jump_right", frames: this.anims.generateFrameNumbers("J1_jump", { start: 15, end: 19 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_left", frames: this.anims.generateFrameNumbers("J1_jump", { start: 5, end: 9 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_idle", frames: this.anims.generateFrameNumbers("J1_jump", { start: 10, end: 14 }), frameRate: 20, repeat: 0 });
    // magie animations J1
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
    // jump animations J2
    this.anims.create({ key: "jump_right2", frames: this.anims.generateFrameNumbers("J2_jump", { start: 15, end: 19 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_left2", frames: this.anims.generateFrameNumbers("J2_jump", { start: 5, end: 9 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_idle2", frames: this.anims.generateFrameNumbers("J2_jump", { start: 10, end: 14 }), frameRate: 20, repeat: 0 });
    // magie animations J2
    this.anims.create({ key: "magie_left2", frames: this.anims.generateFrameNumbers("magie_J2", { start: 7, end: 13 }), frameRate: 15, repeat: 0 });
    this.anims.create({ key: "magie_right2", frames: this.anims.generateFrameNumbers("magie_J2", { start: 21, end: 27 }), frameRate: 15, repeat: 0 });

    // Animations Ennemi Tireur
    if (!this.anims.exists("ennemi_tireur_move")) {
      this.anims.create({
        key: "ennemi_tireur_move",
        frames: this.anims.generateFrameNumbers("mouv_ennemi_tireur", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
      });
    }

    // jump state flags and handlers for players
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
      // Fin d'animation d'attaque pour J1
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
      // Fin d'animation d'attaque pour J2
      if (anim.key === 'magie_left2' || anim.key === 'magie_right2') {
        this.player2.isAttacking = false;
      }
    });
  }

  toucherJoueur(joueur) {
    // Perdre une vie
    joueur.vie--;
    
    // Mettre à jour l'affichage
    if (joueur === this.player1) {
      this.vieJ1Text.setText(`J1 Vie: ${joueur.vie}`);
    } else {
      this.vieJ2Text.setText(`J2 Vie: ${joueur.vie}`);
    }
    
    // Effet visuel de dégâts
    joueur.setTint(0xff0000); // Rouge
    
    // Retirer l'effet rouge après 0.5 seconde
    this.time.delayedCall(500, () => {
      joueur.clearTint();
    });
    
    // Si le joueur n'a plus de vie, aller à l'écran de défaite
    if (joueur.vie <= 0) {
      this.scene.start('defaite');
    }
  }

  // Méthode simplifiée pour tirer (inspirée du tutoriel Phaser)
  tirerProjectile(joueur) {
    var coefDir;
    if (joueur.directionTir == -1) { 
      coefDir = -1; 
    } else { 
      coefDir = 1; 
    }
    
    // Marquer le joueur comme en train d'attaquer
    joueur.isAttacking = true;
    
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
    var bullet = this.projectiles.create(joueur.x + (25 * coefDir), joueur.y - 4, 'tir');
    bullet.setScale(0.5);
    
    // Paramètres physiques de la balle
    bullet.setCollideWorldBounds(false);
    bullet.body.allowGravity = false;
    bullet.setVelocity(400 * coefDir, 0); // vitesse en x et en y
    
    // Détruire après 3 secondes
    this.time.delayedCall(3000, () => {
      if (bullet && bullet.active) {
        bullet.destroy();
      }
    });
  }

  activerBouton(bouton, joueur) {
    bouton.isActivated = !bouton.isActivated;
    
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
    if (joueur.vie > 0) {
      joueur.vie--;
      if (joueur === this.player1) {
        this.vieJ1Text.setText(`J1 Vie: ${joueur.vie}`);
      } else {
        this.vieJ2Text.setText(`J2 Vie: ${joueur.vie}`);
      }
    }
    
    // Vérifier si la vie atteint zéro après respawn manuel
    if (joueur.vie <= 0) {
      this.scene.start('defaite');
      return;
    }
    
    if (joueur === this.player1) {
      joueur.setPosition(joueur.positionInitiale.x, joueur.positionInitiale.y);
    } else if (joueur === this.player2) {
      joueur.setPosition(joueur.positionInitiale.x, joueur.positionInitiale.y);
    }
    
    joueur.setVelocity(0, 0);
  }

  update() {
    // J1 (uniformisé)
    const isOnGround = this.player1.body.blocked.down || this.player1.body.touching.down;
    if (this.clavier1.up.isDown && isOnGround) {
      this.player1.setVelocityY(-300);
      if (this.clavier1.right.isDown) this.player1.lastDirection = 'right';
      else if (this.clavier1.left.isDown) this.player1.lastDirection = 'left';
      else this.player1.lastDirection = this.player1.lastDirection || 'right';
      if (this.player1.lastDirection === 'right') this.player1.anims.play('jump_right', true);
      else if (this.player1.lastDirection === 'left') this.player1.anims.play('jump_left', true);
      else this.player1.anims.play('jump_idle', true);
      this.player1.jumpPlayed = true;
    }
    if (this.clavier1.left.isDown) {
      this.player1.setVelocityX(-160);
      this.player1.lastDirection = 'left';
      this.player1.directionTir = -1; // Tir vers la gauche
      if (!this.player1.isAttacking) {
        if (isOnGround) this.player1.anims.play('left', true);
        else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_left', false); }
      }
    } else if (this.clavier1.right.isDown) {
      this.player1.setVelocityX(160);
      this.player1.lastDirection = 'right';
      this.player1.directionTir = 1; // Tir vers la droite
      if (!this.player1.isAttacking) {
        if (isOnGround) this.player1.anims.play('right', true);
        else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_right', false); }
      }
    } else {
      this.player1.setVelocityX(0);
      if (!this.player1.isAttacking) {
        if (isOnGround) this.player1.anims.play('turn');
        else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_idle', false); }
      }
    }
    if (isOnGround) this.player1.jumpPlayed = false;

    // J2 (uniformisé)
    const isOnGround2 = this.player2.body.blocked.down || this.player2.body.touching.down;
    if (this.clavier2.up.isDown && isOnGround2) {
      this.player2.setVelocityY(-300);
      if (this.clavier2.right.isDown) this.player2.lastDirection = 'right';
      else if (this.clavier2.left.isDown) this.player2.lastDirection = 'left';
      else this.player2.lastDirection = this.player2.lastDirection || 'right';
      if (this.player2.lastDirection === 'right') this.player2.anims.play('jump_right2', true);
      else if (this.player2.lastDirection === 'left') this.player2.anims.play('jump_left2', true);
      else this.player2.anims.play('jump_idle2', true);
      this.player2.jumpPlayed = true;
    }
    if (this.clavier2.left.isDown) {
      this.player2.setVelocityX(-160);
      this.player2.lastDirection = 'left';
      this.player2.directionTir = -1; // Tir vers la gauche
      if (!this.player2.isAttacking) {
        if (isOnGround2) this.player2.anims.play('left2', true);
        else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_left2', false); }
      }
    } else if (this.clavier2.right.isDown) {
      this.player2.setVelocityX(160);
      this.player2.lastDirection = 'right';
      this.player2.directionTir = 1; // Tir vers la droite
      if (!this.player2.isAttacking) {
        if (isOnGround2) this.player2.anims.play('right2', true);
        else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_right2', false); }
      }
    } else {
      this.player2.setVelocityX(0);
      if (!this.player2.isAttacking) {
        if (isOnGround2) this.player2.anims.play('idle2');
        else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_idle2', false); }
      }
    }
    if (isOnGround2) this.player2.jumpPlayed = false;

    // Gestion des tirs
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.tir)) {
      this.tirerProjectile(this.player1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.tir)) {
      this.tirerProjectile(this.player2);
    }

    // --- COLLISIONS PROJECTILES-ENNEMIS ---
    this.projectiles.children.entries.forEach(projectile => {
      if (!projectile.active) return;
      
      this.ennemis_tireurs.children.entries.forEach(ennemi => {
        if (ennemi.active && Phaser.Geom.Intersects.RectangleToRectangle(projectile.getBounds(), ennemi.getBounds())) {
          ennemi.vie--;
          projectile.destroy();
          
          ennemi.setTint(0xff0000);
          ennemi.estRouge = true;
          this.time.delayedCall(300, () => {
            if (ennemi.active) {
              ennemi.clearTint();
              ennemi.estRouge = false;
            }
          });
          
          if (ennemi.vie <= 0) {
            ennemi.destroy();
          }
        }
      });
      
      if (projectile.x < 0 || projectile.x > this.physics.world.bounds.width) {
        projectile.destroy();
      }
    });

    // --- LOGIQUE DES ENNEMIS ---
    this.ennemis_tireurs.children.entries.forEach(ennemi => {
      if (ennemi.active) {
        ennemi.setVelocityX(ennemi.vitesse * ennemi.direction);
        
        if (ennemi.body.velocity.x !== 0) {
          ennemi.anims.play("ennemi_tireur_move", true);
          ennemi.setFlipX(ennemi.direction < 0);
        }
        
        if (ennemi.body.blocked.left || ennemi.body.blocked.right) {
          ennemi.direction = -ennemi.direction;
          ennemi.distanceParcourue = 0;
        }
        
        ennemi.distanceParcourue += Math.abs(ennemi.x - ennemi.positionPrecedente);
        ennemi.positionPrecedente = ennemi.x;
        
        if (ennemi.distanceParcourue >= 200) {
          ennemi.direction = -ennemi.direction;
          ennemi.distanceParcourue = 0;
        }
        
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), ennemi.getBounds())) {
          this.toucherJoueur(this.player1);
        }
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), ennemi.getBounds())) {
          this.toucherJoueur(this.player2);
        }
      }
    });

    // Vérification de la récupération des engrenages
    this.engrenages.children.entries.forEach(engrenage => {
      if (engrenage.active && engrenage.visible) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), engrenage.getBounds())) {
          this.collectEngrenage(this.player1, engrenage);
        }
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), engrenage.getBounds())) {
          this.collectEngrenage(this.player2, engrenage);
        }
      }
    });

    // Vérification de l'activation des boutons
    if (this.boutons) {
      this.boutons.children.entries.forEach(bouton => {
        const player1NearButton = Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), bouton.getBounds());
        const player2NearButton = Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), bouton.getBounds());
        
        if (player1NearButton && Phaser.Input.Keyboard.JustDown(this.clavier1.action)) {
          this.activerBouton(bouton, this.player1);
        }
        if (player2NearButton && Phaser.Input.Keyboard.JustDown(this.clavier2.action)) {
          this.activerBouton(bouton, this.player2);
        }
      });
    }

    // Les 2 J peuvent activer le terminal si tous les engrenages sont récoltés
    if (this.nbEngrenages >= this.totalEngrenages && this.porte_retour) {
      const player1NearTerminal = Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), this.porte_retour.getBounds());
      const player2NearTerminal = Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), this.porte_retour.getBounds());
      
      if (
        (player1NearTerminal && (Phaser.Input.Keyboard.JustDown(this.clavier1.space) || Phaser.Input.Keyboard.JustDown(this.clavier1.action))) ||
        (player2NearTerminal && (Phaser.Input.Keyboard.JustDown(this.clavier2.space) || Phaser.Input.Keyboard.JustDown(this.clavier2.action)))
      ) {
        this.scene.start('victoire');
      }
    }

    // Touches pour retourner au menu
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.menu)) {
      this.scene.start("accueil");
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.menu)) {
      this.scene.start("accueil");
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