import * as fct from "./fonctions.js";

export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
  this.load.image("background_niveau3", "assets/background_niveau3.png");
  this.load.image("tiles", "assets/tileset.png");
  this.load.image("selection", "assets/selection.png");
  this.load.image("retour_menu", "assets/retour_menu.png");
  this.load.tilemapTiledJSON("map_niveau3", "maps/map_niveau3.json");
  this.load.spritesheet("gearPiece", "assets/gearPiece.png", {
  frameWidth: 64,   // largeur d’une frame
  frameHeight: 64   // hauteur d’une frame
  });
  this.load.image("button", "assets/button.png");
  this.load.image("terminal_rempli", "assets/terminal_rempli.png");
  this.load.image("screen_victoire", "assets/screen_victoire.png");
  // Images des ennemis
  this.load.spritesheet("mouv_ennemi_tireur", "assets/mouv_ennemi_tireur.png", { frameWidth: 128, frameHeight: 96 }); // Spritesheet ennemi tireur
  this.load.audio("music_lvl3", "assets/music_lvl3.mp3");
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
  }

  create() {

    // Musique de fond (utilise la musique globale en priorité)
    if (!window.globalMusic || !window.globalMusic.isPlaying) {
      this.backgroundMusic = this.sound.add('music_lvl3', { loop: true, volume: 0.3 });
      this.backgroundMusic.play();
    }

    // Le décor est géré par le calque 'background' de la map Tiled
    const map = this.make.tilemap({ key: "map_niveau3" });
    const tileset = map.addTilesetImage("tileset", "tiles");

    // --- EXEMPLE DE STRUCTURE DE CALQUES ---
  // 0. Calque background2 (visuel, derrière le background principal)
    const background2Layer = map.createLayer('background2', tileset, 0, 0);

  // 1. Calque background (visuel)
  this.add.image(0, 0, "background_niveau3").setOrigin(0, 0).setDepth(-1);
  const backgroundLayer = map.createLayer('background', tileset, 0, 0);

    // 2. Calque plateformes (collision)
    const platformsLayer = map.createLayer('platforms', tileset, 0, 0);
    if (platformsLayer) {
      platformsLayer.setCollisionBetween(1, 9999);
    }

    // 3. Calque décor (premier plan)
    const decorLayer = map.createLayer('decor', tileset, 0, 0);
    if (decorLayer) {
      decorLayer.setDepth(50); // Premier plan, devant les joueurs et objets
    }

    // 4. Calque d'items
    const itemsObjects = map.getObjectLayer('items');

    // Création du J1
    this.player1 = this.physics.add.sprite(432, 30, "img_perso1");
    this.player1.refreshBody();
    this.player1.setBounce(0.15);
    this.player1.setCollideWorldBounds(true);
    this.player1.setSize(26, 58);
    this.clavier1 = this.input.keyboard.createCursorKeys();
    this.clavier1.action = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I); // Touche I pour actions J1
    this.clavier1.menu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M); // Touche M pour menu J1

    // Création du J2
    this.player2 = this.physics.add.sprite(2112, 30, "img_perso2");
    this.player2.refreshBody();
    this.player2.setBounce(0.15);
    this.player2.setCollideWorldBounds(true);
    this.player2.setSize(26, 58);
    this.clavier2 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      action: Phaser.Input.Keyboard.KeyCodes.R, // Touche R pour actions J2
      menu: Phaser.Input.Keyboard.KeyCodes.H // Touche H pour menu J2
    });

    // Collision avec les plateformes
    if (platformsLayer) {
      this.physics.add.collider(this.player1, platformsLayer);
      this.physics.add.collider(this.player2, platformsLayer);
    }

    // --- TERMINAL DEPUIS TILED ---
    // Récupération du terminal depuis Tiled
    const objetsObjects = map.getObjectLayer('terminal')?.objects || [];
    const terminalObj = objetsObjects.find(obj => obj.name === 'terminal');
    if (terminalObj) {
      this.porte_retour = this.physics.add.sprite(terminalObj.x, terminalObj.y, 'terminal_rempli');
    }

    // Collision terminal avec plateformes
    if (platformsLayer && this.porte_retour) {
      this.physics.add.collider(this.porte_retour, platformsLayer);
    }

    // Split screen
    this.cameras.main.setViewport(0, 0, 640, 720); // caméra principale à gauche
    this.camera2 = this.cameras.add(640, 0, 640, 720); // nouvelle caméra à droite
    this.cameras.main.startFollow(this.player1);
    this.camera2.startFollow(this.player2);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.camera2.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Bouton retour menu au-dessus de selection
    const retourMenuBtn = this.add.image(100, 60, "retour_menu").setScrollFactor(0).setDepth(100).setInteractive();
    retourMenuBtn.on("pointerup", () => {
      this.scene.start("accueil");
    });

    // Image selection en haut de l'écran
    this.add.image(100, 150, "selection").setScrollFactor(0).setDepth(100);

    // --- ENNEMIS DEPUIS TILED ---
    
    const ennemisObjects = map.getObjectLayer('ennemis')?.objects || [];
    console.log("Nombre d'ennemis trouvés:", ennemisObjects.length);
    
    if (ennemisObjects.length > 0) {
      // Créer les ennemis statiques depuis Tiled
      if (ennemisObjects.length >= 1) {
        this.ennemi1 = this.physics.add.sprite(ennemisObjects[0].x, ennemisObjects[0].y, 'door1');
      }
      if (ennemisObjects.length >= 2) {
        this.ennemi2 = this.physics.add.sprite(ennemisObjects[1].x, ennemisObjects[1].y, 'door2');
      }
      if (ennemisObjects.length >= 3) {
        this.ennemi3 = this.physics.add.sprite(ennemisObjects[2].x, ennemisObjects[2].y, 'door3');
      }
    }
      
    // Collisions avec plateformes
    if (platformsLayer) {
      if (this.ennemi1) this.physics.add.collider(this.ennemi1, platformsLayer);
      if (this.ennemi2) this.physics.add.collider(this.ennemi2, platformsLayer);
      if (this.ennemi3) this.physics.add.collider(this.ennemi3, platformsLayer);
    }
    
    // Création des boutons pour désactiver chaque ennemi
    if (this.ennemi1) {
      const x1 = ennemisObjects.length > 0 ? ennemisObjects[0].x : 860;
      const y1 = ennemisObjects.length > 0 ? ennemisObjects[0].y : 556;
      this.bouton1 = this.add.image(x1 - 50, y1 - 50, 'button').setInteractive();
    }
    if (this.ennemi2) {
      const x2 = ennemisObjects.length > 1 ? ennemisObjects[1].x : 1724;
      const y2 = ennemisObjects.length > 1 ? ennemisObjects[1].y : 682;
      this.bouton2 = this.add.image(x2 - 50, y2 - 50, 'button').setInteractive();
    }
    if (this.ennemi3) {
      const x3 = ennemisObjects.length > 2 ? ennemisObjects[2].x : 1500;
      const y3 = ennemisObjects.length > 2 ? ennemisObjects[2].y : 600;
      this.bouton3 = this.add.image(x3 - 50, y3 - 50, 'button').setInteractive();
    }

    // --- ENNEMI TIREUR DEPUIS TILED ---
    const ennemiTireurObjects = map.getObjectLayer('ennemis_tireurs')?.objects || [];
    console.log("Nombre d'ennemis tireurs trouvés:", ennemiTireurObjects.length);
    
    // Si aucun ennemi tireur spécifique, utiliser certains ennemis normaux comme tireurs
    let tireursToCreate = [];
    if (ennemiTireurObjects.length === 0) {
      console.log("Aucun calque ennemis_tireurs trouvé, utilisation de positions par défaut");
      // Créer des ennemis tireurs à des positions par défaut
      tireursToCreate = [
        { x: 900, y: 600 }, // Position 1
        { x: 1800, y: 700 } // Position 2
      ];
    } else {
      tireursToCreate = ennemiTireurObjects;
    }
    
    this.ennemis_tireurs = this.physics.add.group();
    this.arcs_electriques = this.physics.add.group();
    
    console.log("Création de", tireursToCreate.length, "ennemis tireurs");
    tireursToCreate.forEach(obj => {
      console.log("Création ennemi tireur à:", obj.x, obj.y);
      const tireur = this.physics.add.sprite(obj.x, obj.y, 'mouv_ennemi_tireur');
      tireur.setCollideWorldBounds(false);
      
      // Configuration de la hitbox 96x96
      tireur.setSize(96, 96);
      tireur.refreshBody();
      
      // Configuration du mouvement horizontal
      tireur.startX = obj.x;
      tireur.direction = 1; // 1 = droite, -1 = gauche
      tireur.speed = 50;
      tireur.patrolDistance = 300;
      
      // Système de dégâts corps à corps (plus de tir)
      tireur.damageTimer = 0;
      tireur.damageDelay = 1000; // 1 seconde entre les dégâts
      
      this.ennemis_tireurs.add(tireur);
      
      // Collision avec plateformes
      if (platformsLayer) {
        this.physics.add.collider(tireur, platformsLayer);
      }
    });

    // --- BOUTONS DEPUIS TILED ---
    const boutonsObjects = map.getObjectLayer('boutons')?.objects || [];
    this.boutons = [];
    boutonsObjects.forEach((obj, i) => {
      const bouton = this.add.image(obj.x, obj.y, 'button').setInteractive();
      this.boutons.push(bouton);
    });



    // --- ANIMATION ENGRENAGE ---
    this.anims.create({
    key: "gearSpin",
    frames: this.anims.generateFrameNumbers("gearPiece", { start: 0, end: 3 }), // 4 frames
    frameRate: 6, // vitesse (6 fps, ajuste selon rendu voulu)
    repeat: -1    // boucle infinie
    });


    // --- ENGRENAGES DEPUIS TILED ---
  const engrenagesObjects = map.getObjectLayer('engrenages')?.objects || [];
  this.engrenages = this.add.group();

  engrenagesObjects.forEach(obj => {
  const engrenage = this.add.sprite(obj.x, obj.y, "gearPiece");
  engrenage.play("gearSpin"); // lance l’anim
  // Réduction de la hitbox à 32x32 et centrage
  engrenage.setSize(10, 10);
  this.engrenages.add(engrenage);
  })

  // Compteur d'engrenages
  this.nbEngrenages = 0;
  this.totalEngrenages = engrenagesObjects.length;

    
    // Affichage du compteur en haut de l'écran
    this.compteurText = this.add.text(320, 40, `Engrenages: ${this.nbEngrenages}/${this.totalEngrenages}`, {
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // Fonction pour vérifier la récupération des engrenages
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

    // Animations Ennemi Tireur
    if (!this.anims.exists("ennemi_tireur_move")) {
      this.anims.create({
        key: "ennemi_tireur_move",
        frames: this.anims.generateFrameNumbers("mouv_ennemi_tireur", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
      });
    }
    
  }

  // Méthode pour faire tirer un ennemi tireur
  tirerArcElectrique(tireur) {
    const arc = this.physics.add.sprite(tireur.x, tireur.y, 'arc_electrique');
    arc.setScale(0.5);
    arc.setTint(0x00ffff); // Couleur bleu électrique
    
    // Configuration pour un tir horizontal sans gravité
    arc.body.setGravityY(-this.physics.world.gravity.y); // Annule la gravité
    
    // Direction du tir (dans la direction où regarde l'ennemi)
    const vitesseTir = 200;
    arc.setVelocityX(vitesseTir * tireur.direction);
    arc.setVelocityY(0); // Strictement horizontal
    
    // Effet visuel : rotation de l'arc
    this.tweens.add({
      targets: arc,
      angle: 360,
      duration: 1000,
      repeat: -1
    });
    
    this.arcs_electriques.add(arc);
    
    // Collision avec les plateformes - l'arc disparaît au contact
    if (this.platformsLayer) {
      this.physics.add.collider(arc, this.platformsLayer, () => {
        arc.destroy();
      });
    }
    
    // Détruire l'arc après 5 secondes (sécurité)
    this.time.delayedCall(5000, () => {
      if (arc && arc.active) {
        arc.destroy();
      }
    });
  }

  // Méthode appelée quand un joueur est touché par un arc
  toucherJoueur(joueur) {
    // Effet visuel de dégâts
    joueur.setTint(0xff0000); // Rouge
    this.time.delayedCall(150, () => {
      joueur.clearTint();
    });
    }

  update() {
    // J1
    if (this.clavier1.left.isDown) {
      this.player1.setVelocityX(-160);
      this.player1.anims.play("left", true);
    } else if (this.clavier1.right.isDown) {
      this.player1.setVelocityX(160);
      this.player1.anims.play("right", true);
    } else {
      this.player1.setVelocityX(0);
      this.player1.anims.play("turn");
    }
    if (this.clavier1.up.isDown && (this.player1.body.blocked.down || this.player1.body.touching.down)) {
      this.player1.setVelocityY(-300);
    }

    // J2
    if (this.clavier2.left.isDown) {
      this.player2.setVelocityX(-160);
      this.player2.anims.play("left2", true);
    } else if (this.clavier2.right.isDown) {
      this.player2.setVelocityX(160);
      this.player2.anims.play("right2", true);
    } else {
      this.player2.setVelocityX(0);
      this.player2.anims.play("idle2");
    }
    if (this.clavier2.up.isDown && (this.player2.body.blocked.down || this.player2.body.touching.down)) {
      this.player2.setVelocityY(-300);
    }

    // --- LOGIQUE DES ENNEMIS TIREURS ---
    this.ennemis_tireurs.children.entries.forEach(tireur => {
      if (tireur.active) {
        // Mouvement horizontal avec allers-retours
        const distanceFromStart = tireur.x - tireur.startX;
        
        // Changement de direction si on atteint les limites
        if (distanceFromStart >= tireur.patrolDistance) {
          tireur.direction = -1; // Va vers la gauche
        } else if (distanceFromStart <= -tireur.patrolDistance) {
          tireur.direction = 1; // Va vers la droite
        }
        
        // Application du mouvement
        tireur.setVelocityX(tireur.speed * tireur.direction);
        
        // Animation en fonction du mouvement
        if (tireur.body.velocity.x !== 0) {
          tireur.anims.play("ennemi_tireur_move", true);
          // Retourner le sprite selon la direction
          tireur.setFlipX(tireur.direction < 0);
        } else {
          tireur.anims.play("ennemi_tireur_idle", true);
        }
        
        // Système de dégâts corps à corps avec délai
        if (!tireur.damageTimer) tireur.damageTimer = 0;
        if (!tireur.damageDelay) tireur.damageDelay = 1000; // 1 seconde entre les dégâts
        
        tireur.damageTimer += this.game.loop.delta;
        
        // Vérification collision corps à corps avec les joueurs
        if (tireur.damageTimer >= tireur.damageDelay) {
          if (Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), tireur.getBounds())) {
            this.toucherJoueur(this.player1);
            tireur.damageTimer = 0; // Reset du timer
          }
          if (Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), tireur.getBounds())) {
            this.toucherJoueur(this.player2);
            tireur.damageTimer = 0; // Reset du timer
          }
        }
      }
    });
    
    // Gestion des arcs électriques (système désactivé - combat corps à corps uniquement)
    // this.arcs_electriques.children.entries.forEach(arc => {
    //   if (arc.active) {
    //     // Supprimer l'arc s'il sort de l'écran
    //     if (arc.x > this.physics.world.bounds.width + 50 || arc.x < -50) {
    //       arc.destroy();
    //     }
    //     
    //     // Collision avec les joueurs
    //     if (Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), arc.getBounds())) {
    //       this.toucherJoueur(this.player1);
    //       arc.destroy();
    //     }
    //     if (Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), arc.getBounds())) {
    //       this.toucherJoueur(this.player2);
    //       arc.destroy();
    //     }
    //   }
    // });

    // Vérification de la récupération des engrenages
    this.engrenages.children.entries.forEach(engrenage => {
      if (engrenage.active && engrenage.visible) {
        // Vérification collision avec J1
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), engrenage.getBounds())) {
          this.collectEngrenage(this.player1, engrenage);
        }
        // Vérification collision avec J2
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), engrenage.getBounds())) {
          this.collectEngrenage(this.player2, engrenage);
        }
      }
    });

    // Les 2 J peuvent activer le terminal si tous les engrenages sont récoltés
    if (this.nbEngrenages >= this.totalEngrenages && this.porte_retour) {
      // Vérification si un joueur est proche du terminal et appuie sur espace
      const player1NearTerminal = Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), this.porte_retour.getBounds());
      const player2NearTerminal = Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), this.porte_retour.getBounds());
      
      if (
        (player1NearTerminal && (Phaser.Input.Keyboard.JustDown(this.clavier1.space) || Phaser.Input.Keyboard.JustDown(this.clavier1.action))) ||
        (player2NearTerminal && (Phaser.Input.Keyboard.JustDown(this.clavier2.space) || Phaser.Input.Keyboard.JustDown(this.clavier2.action)))
      ) {
        // Redirection vers la scène de victoire
        this.scene.start('victoire');
      }
    }

    // Touches pour retourner au menu
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.menu)) {
      this.scene.start("accueil"); // J1 appuie sur M
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.menu)) {
      this.scene.start("accueil"); // J2 appuie sur H
    }
  }
}