import * as fct from "./fonctions.js";

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    this.load.image("ville_grotte", "assets/ville_grotte_final3.jpg");
    this.load.image("tiles", "assets/tileset.png");
    this.load.image("selection", "assets/selection.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
    this.load.tilemapTiledJSON("map_niveau2", "maps/map_niveau2.json");
  this.load.spritesheet("gearPiece", "assets/gearPiece.png", { frameWidth: 64, frameHeight: 64 });
    this.load.image("button", "assets/button.png");
    this.load.image("terminal_rempli", "assets/terminal_rempli.png");
    this.load.image("screen_victoire", "assets/screen_victoire.png");
    this.load.spritesheet("img_perso1", "assets/mouv_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J1_idle", "assets/idle_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_perso2", "assets/mouv_J2.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J2_idle", "assets/idle_J2.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J1_jump", "assets/jump_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J2_jump", "assets/jump_J2.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("magie_J1", "assets/magie_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("magie_J2", "assets/magie_J2.png", { frameWidth: 64, frameHeight: 64 });
    this.load.image("trappe_h", "assets/trappe_h.png");
    this.load.image("trappe_v", "assets/trappe_v.png");
    this.load.image("button", "assets/button.png");

    // Spritesheets ennemis
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
    this.load.image("tir", "assets/tir.png");

//spritesheets ennemis 2
    this.load.spritesheet("enemy2_fly", "assets/enemy2_fly.png", {
      frameWidth: 128,
      frameHeight: 96
    });
    this.load.spritesheet("enemy2_tir", "assets/enemy2_tir.png", {
      frameWidth: 128,
      frameHeight: 96
    });
    this.load.spritesheet("enemy2_dead", "assets/enemy2_dead.png", {
      frameWidth: 128,
      frameHeight: 96
    });





  }


  create() {
    // Map Tiled
    const map = this.make.tilemap({ key: "map_niveau2" });
    const tileset = map.addTilesetImage("tileset", "tiles");

    // AFFICHAGE DU FOND DEPUIS TILED
    const objectLayer = map.getObjectLayer('image');
    if (objectLayer) {
      objectLayer.objects.forEach(object => {
        if (object.gid) {
          // On récupère les propriétés de l'objet pour identifier quelle image utiliser
          const properties = object.properties || [];
          // On vérifie si l'objet a une propriété qui indique quelle image utiliser
          const imageProperty = properties.find(p => p.name === 'image');
          const imageKey = imageProperty ? imageProperty.value : 'ville_grotte';
          
          // Récupérer la hauteur de l'image pour ajuster la position y
          const image = this.add.image(object.x, object.y, imageKey)
            .setOrigin(0, 1) // Origine en bas à gauche au lieu de haut à gauche
            .setDepth(-1);
          
          // Debug
          console.log("Dimensions de l'image:", {
            width: image.width,
            height: image.height,
            finalY: object.y - image.height
          });
          
          // Pour déboguer
          console.log("Image ajoutée:", {x: object.x, y: object.y, key: imageKey});
        }
      });
    } else {
      console.log("Le calque 'image' n'a pas été trouvé");
    }

    // Calques
    const backgroundLayer = map.createLayer('background', tileset, 0, 0);
    const backgroundLayer2 = map.createLayer("background_2", tileset, 0, 0);
    const platformsLayer = map.createLayer('platforms', tileset, 0, 0);
    if (platformsLayer) {
      platformsLayer.setCollisionBetween(1, 9999); // Collision sur tous les tiles non-vides
    }

    // Création des groupes pour les boutons et les trappes
    this.boutons = this.physics.add.staticGroup();
    this.trappes = this.physics.add.staticGroup();

    // Récupération des obstacles depuis la map Tiled
    const obstaclesLayer = map.getObjectLayer('obstacle');
    if (obstaclesLayer) {
      obstaclesLayer.objects.forEach(obstacle => {
        if (obstacle.properties && obstacle.properties.find(p => p.name === 'estSolide')) {
          // Centrer le sprite sur l'objet Tiled (coordonnées données en haut-gauche pour les rectangles)
          const ox = obstacle.x + (obstacle.width || 0) / 2;
          const oy = obstacle.y - (obstacle.height || 0) / 2;
          const trappe = this.trappes.create(ox, oy, 'trappe_v');
          trappe.setImmovable(true);
          trappe.estSolide = true;
          // Utiliser la propriété 'activated_by' pour lier au bouton
          trappe.bouton_id = obstacle.properties.find(p => p.name === 'activated_by')?.value;
          trappe.setOrigin(0.5, 0.5);
          
          // Ajuster la taille si nécessaire et rafraîchir le body pour que la hitbox corresponde
          if (obstacle.width && obstacle.height) {
            trappe.displayWidth = obstacle.width;
            trappe.displayHeight = obstacle.height;
            if (typeof trappe.refreshBody === 'function') trappe.refreshBody();
          }
        }
      });
    }

    // Récupération des boutons depuis la map
    const boutonsLayer = map.getObjectLayer('button');
    if (boutonsLayer) {
      boutonsLayer.objects.forEach(boutonObj => {
        // Centrer le bouton dans l'objet Tiled
        const bx = boutonObj.x + (boutonObj.width || 0) / 2;
        const by = boutonObj.y - (boutonObj.height || 0) / 2;
        const bouton = this.boutons.create(bx, by, 'button');
        // Utiliser la propriété 'bouton_id' du bouton
        bouton.id = boutonObj.properties?.find(p => p.name === 'bouton_id')?.value || boutonObj.id;
        bouton.setOrigin(0.5, 0.5);
        
        // Ajuster la taille si nécessaire et rafraîchir le body
        if (boutonObj.width && boutonObj.height) {
          bouton.displayWidth = boutonObj.width;
          bouton.displayHeight = boutonObj.height;
          if (typeof bouton.refreshBody === 'function') bouton.refreshBody();
        }

        // Ajouter l'interactivité
        bouton.setInteractive();
      });
    }

    // Ajout d'un texte distinctif du niveau
    this.add.text(400, 100, "Vous êtes dans le niveau 2", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    // Création des joueurs
    this.player1 = this.physics.add.sprite(100, 1200, "img_perso1");
    this.player1.refreshBody();
    this.player1.setBounce(0.2);
    this.player1.setCollideWorldBounds(true);
    this.player1.setSize(26, 58);
  // propriétés pour lissage des déplacements du joueur 1 (copié depuis niveau1)
  this.player1.smoothVel = 0;
  this.player1.targetVel = 0;
    this.clavier1 = this.input.keyboard.createCursorKeys();
  // Remap J1 jump to K
  this.clavier1.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.clavier1.action = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I); // Touche I pour actions J1
    this.clavier1.menu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M); // Touche M pour menu J1
    this.clavier1.tir = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O); // Touche O pour tirer J1

  // Points de vie et direction de tir pour J1
  this.player1.vie = 5;
  this.player1.directionTir = 1;
  this.player1.positionInitiale = { x: 100, y: 1200 };
  this.player1.fallStartY = this.player1.y;
  this.player1.wasOnGround = true;
  this.player1.isFalling = false;

    this.player2 = this.physics.add.sprite(100, 1400, "img_perso2");
    this.player2.refreshBody();
    this.player2.setBounce(0.2);
    this.player2.setCollideWorldBounds(true);
    this.player2.setSize(26, 58);
  // propriétés pour lissage des déplacements du joueur 2 (copié depuis niveau1)
  this.player2.smoothVel = 0;
  this.player2.targetVel = 0;
    this.clavier2 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.F, // J2 jump -> F
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      action: Phaser.Input.Keyboard.KeyCodes.R, // Touche R pour actions J2
      menu: Phaser.Input.Keyboard.KeyCodes.H, // Touche H pour menu J2
      tir: Phaser.Input.Keyboard.KeyCodes.T // Touche T pour tirer J2
    });

    // Points de vie et direction de tir pour J2
    this.player2.vie = 5;
    this.player2.directionTir = 1;
    this.player2.positionInitiale = { x: 100, y: 1400 };
    this.player2.fallStartY = this.player2.y;
    this.player2.wasOnGround = true;
    this.player2.isFalling = false;

    // Système de projectiles
    this.projectiles = this.physics.add.group({
      allowGravity: false
    });

    // Collisions avec plateformes
    if (platformsLayer) {
      this.physics.add.collider(this.player1, platformsLayer);
      this.physics.add.collider(this.player2, platformsLayer);
      this.physics.add.collider(this.projectiles, platformsLayer, (projectile) => {
        projectile.destroy();
      });
    }

    // Collisions avec les trappes
    this.physics.add.collider(this.player1, this.trappes);
    this.physics.add.collider(this.player2, this.trappes);

    // Gestion de l'activation des boutons
    this.physics.add.overlap([this.player1, this.player2], this.boutons, (player, bouton) => {
      const actionPressed = this.clavier1.action.isDown || (player === this.player2 && this.clavier2.action.isDown);
      if (actionPressed && !bouton.lastPressed) {
        // Trouver les trappes associées à ce bouton
        this.trappes.children.iterate(trappe => {
          if (trappe.bouton_id === bouton.id) {
            trappe.estSolide = !trappe.estSolide;
            // Activer/désactiver le corps physique
            if (trappe.body) {
              trappe.body.enable = trappe.estSolide;
            }
            trappe.setAlpha(trappe.estSolide ? 1 : 0.5);
          }
        });
        // Effet visuel sur le bouton
        bouton.setTint(0x00ff00);
        this.time.delayedCall(200, () => {
          bouton.clearTint();
        });
      }
      // Mémoriser l'état du bouton pour éviter les répétitions rapides
      bouton.lastPressed = actionPressed;
    });

    // Terminal (calque 'terminal' — logique identique à niveau1)
    const terminalObjects = map.getObjectLayer('terminal')?.objects || [];
    const terminalObj = terminalObjects.find(o => o.name === 'terminal') || terminalObjects[0];
    if (terminalObj) {
      // Centrer le sprite sur l'objet Tiled (pratique courante quand l'objet est défini en tant que rectangle)
      const tx = terminalObj.x + (terminalObj.width || 0) / 2;
      const ty = terminalObj.y + (terminalObj.height || 0) / 2;
      // utiliser la texture preloadée 'terminal_rempli' pour ce niveau
      this.porte_retour = this.physics.add.sprite(tx, ty, 'terminal_rempli');
      this.porte_retour.setOrigin(0.5, 0.5);
      this.porte_retour.body.setAllowGravity(false);
      this.porte_retour.setImmovable(true);
      if (terminalObj.width && terminalObj.height) this.porte_retour.setDisplaySize(terminalObj.width, terminalObj.height);
    } else {
      // fallback : aucun objet 'terminal' trouvé dans la map Tiled.
      // Placer la porte au centre de la map pour qu'elle soit visible et testable,
      // et loguer une instruction pour ajouter correctement l'objet dans Tiled.
      console.warn("Aucun objet 'terminal' trouvé dans la map 'map_niveau2'. Ajoutez un calque d'objet nommé 'terminal' dans Tiled et placez un objet nommé 'terminal' au milieu de la zone où vous voulez que la porte apparaisse.");
      const fallbackX = (map.widthInPixels || (map.width * (map.tilewidth || 32))) / 2;
      const fallbackY = (map.heightInPixels || (map.height * (map.tileheight || 32))) / 2;
      this.porte_retour = this.physics.add.sprite(fallbackX, fallbackY, 'terminal_rempli');
      this.porte_retour.setOrigin(0.5, 0.5);
      this.porte_retour.body.setAllowGravity(false);
      this.porte_retour.setImmovable(true);
      this.porte_retour.setDepth(-1); // Afficher derrière les joueurs
      // taille : si besoin ajuster manuellement dans Tiled ou via setDisplaySize
    }

    // Split screen
    this.cameras.main.setViewport(0, 0, 640, 720);
    this.camera2 = this.cameras.add(640, 0, 640, 720);
  this.cameras.main.startFollow(this.player1);
  // activer un léger lissage (lerp) pour la caméra du joueur 2 afin d'adoucir ses mouvements
  // (valeurs 0.12/0.12 pour une sensation similaire à niveau1)
  this.camera2.startFollow(this.player2, true, 0.12, 0.12);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.camera2.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    // Debug des limites de la caméra
    console.log("Dimensions de la map:", {
      width: map.widthInPixels,
      height: map.heightInPixels
    });
    console.log("Limites des caméras:", {
      x: 0,
      y: 0,
      width: map.widthInPixels,
      height: map.heightInPixels
    });

    // // Bouton retour menu au-dessus de selection
    // const retourMenuBtn = this.add.image(100, 60, "retour_menu").setScrollFactor(0).setDepth(100).setInteractive();
    // retourMenuBtn.on("pointerup", () => {
    //   this.scene.start("accueil");
    // });

    // // Image selection en haut de l'écran
    // this.add.image(100, 100, "selection").setScrollFactor(0).setDepth(100);

    // Engrenages depuis Tiled
    const engrenagesObjects = map.getObjectLayer('engrenages')?.objects || [];
    this.engrenages = this.physics.add.group();
    engrenagesObjects.forEach(obj => {
      // Centrer l'engrenage sur l'objet Tiled
      const ex = obj.x + (obj.width || 0) / 2;
      const ey = obj.y - (obj.height || 0) / 2;
      const engrenage = this.engrenages.create(ex, ey, 'gearPiece');
      engrenage.setOrigin(0.5, 0.5);
      if (obj.width && obj.height) {
        engrenage.displayWidth = obj.width;
        engrenage.displayHeight = obj.height;
        if (typeof engrenage.refreshBody === 'function') engrenage.refreshBody();
      }
    });
    this.nbEngrenages = 0;
    this.physics.add.overlap(this.player1, this.engrenages, (player, engrenage) => {
      engrenage.disableBody(true, true);
      this.nbEngrenages++;
    });
    this.physics.add.overlap(this.player2, this.engrenages, (player, engrenage) => {
      engrenage.disableBody(true, true);
      this.nbEngrenages++;
    });

    // Interface utilisateur pour l'affichage des points de vie
    this.vieJ1Text = this.add.text(50, 40, `J1 Vie: ${this.player1.vie}`, {
      fontSize: '20px',
      fill: '#ff6666',
      strokeThickness: 2
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    this.vieJ2Text = this.add.text(500, 40, `J2 Vie: ${this.player2.vie}`, {
      fontSize: '20px',
      fill: '#6666ff',
      strokeThickness: 2
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);

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

    this.anims.create({
      key: "jump_right",
      frames: this.anims.generateFrameNumbers("J1_jump", { start: 17, end: 19 }),
      frameRate: 20,
      repeat: 0
    });
    this.anims.create({
      key: "jump_left",
      frames: this.anims.generateFrameNumbers("J1_jump", { start: 7, end: 9 }),
      frameRate: 20,
      repeat: 0
    });
    // animation de saut neutre (immobile) frames 10-14
    this.anims.create({
      key: "jump_idle",
      frames: this.anims.generateFrameNumbers("J1_jump", { start: 12, end: 14 }),
      frameRate: 20,
      repeat: 0
    });

    // Animations de magie J1
    this.anims.create({
      key: "magie_left",
      frames: this.anims.generateFrameNumbers("magie_J1", { start: 7, end: 13 }),
      frameRate: 15,
      repeat: 0
    });
    this.anims.create({
      key: "magie_right",
      frames: this.anims.generateFrameNumbers("magie_J1", { start: 21, end: 27 }),
      frameRate: 15,
      repeat: 0
    });

    // Animations J2
    this.anims.create({
      key: "left2",
      frames: this.anims.generateFrameNumbers("img_perso2", { start: 9, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "turn2",
      frames: this.anims.generateFrameNumbers("J2_idle", { start: 5, end: 6 }),
      frameRate: 20
    });
    this.anims.create({
      key: "right2",
      frames: this.anims.generateFrameNumbers("img_perso2", { start: 25, end: 31 }),
      frameRate: 10,
      repeat: -1
    });
    // Animations de saut J2 (mêmes plages que J1 mais sur le spritesheet J2_jump)
    this.anims.create({
      key: "jump_right2",
      frames: this.anims.generateFrameNumbers("J2_jump", { start: 15, end: 19 }),
      frameRate: 20,
      repeat: 0
    });
    this.anims.create({
      key: "jump_left2",
      frames: this.anims.generateFrameNumbers("J2_jump", { start: 5, end: 9 }),
      frameRate: 20,
      repeat: 0
    });
    this.anims.create({
      key: "jump_idle2",
      frames: this.anims.generateFrameNumbers("J2_jump", { start: 10, end: 14 }),
      frameRate: 20,
      repeat: 0
    });

    // Animations de magie J2
    this.anims.create({
      key: "magie_left2",
      frames: this.anims.generateFrameNumbers("magie_J2", { start: 7, end: 13 }),
      frameRate: 15,
      repeat: 0
    });
    this.anims.create({
      key: "magie_right2",
      frames: this.anims.generateFrameNumbers("magie_J2", { start: 21, end: 27 }),
      frameRate: 15,
      repeat: 0
    });

    // Pour la victoire
    this.doorActive = true;
    // État du saut pour player1 : empêche la répétition de l'animation en l'air
    this.player1.jumpPlayed = false;
    // On écoute la fin de l'animation de saut pour figer sur la dernière frame
    this.player1.on('animationcomplete', (anim, frame) => {
      if (anim.key === 'jump_right' || anim.key === 'jump_left' || anim.key === 'jump_idle') {
        // Déterminer la dernière frame de l'animation (anim.frames) et l'appliquer.
        try {
          const frames = anim.frames;
          if (frames && frames.length) {
            const last = frames[frames.length - 1];
            // last.frame.name peut être undefined selon la version ; utiliser last.frame.index ou last.index
            const frameIndex = (last.frame && (last.frame.index ?? last.frame.name)) ?? last.index;
            if (typeof frameIndex === 'number') {
              this.player1.setFrame(frameIndex);
            }
          }
        } catch (e) {
          // fallback silencieux
        }
      }
    });
    // État du saut pour player2 et handler similaire
    this.player2.jumpPlayed = false;
    this.player2.on('animationcomplete', (anim, frame) => {
      if (anim.key === 'jump_right2' || anim.key === 'jump_left2' || anim.key === 'jump_idle2') {
        try {
          const frames = anim.frames;
          if (frames && frames.length) {
            const last = frames[frames.length - 1];
            const frameIndex = (last.frame && (last.frame.index ?? last.frame.name)) ?? last.index;
            if (typeof frameIndex === 'number') {
              this.player2.setFrame(frameIndex);
            }
          }
        } catch (e) {
          // fallback silencieux
        }
      }
    });

    // Animations ennemis au sol
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
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: "enemy_dead_anim",
      frames: this.anims.generateFrameNumbers("enemy_dead", { start: 0, end: 6 }),
      frameRate: 10,
      repeat: 0
    });

    // Animations ennemis volants
    this.anims.create({
      key: "enemy2_fly_right",
      frames: this.anims.generateFrameNumbers("enemy2_fly", { start: 0, end: 4 }), // Vous pourrez ajuster les frames
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "enemy2_fly_left",
      frames: this.anims.generateFrameNumbers("enemy2_fly", { start: 0, end: 4 }), // Vous pourrez ajuster les frames
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: "enemy2_tir_anim",
      frames: this.anims.generateFrameNumbers("enemy2_tir", { start: 0, end: 1 }), // Vous pourrez ajuster les frames
      frameRate: 30,
      repeat: 0
    });
    this.anims.create({
      key: "enemy2_dead_anim",
      frames: this.anims.generateFrameNumbers("enemy2_dead", { start: 0, end: 3 }), // Vous pourrez ajuster les frames
      frameRate: 10,
      repeat: 0
    });

    //tir ennemi
    this.enemyProjectiles = this.physics.add.group({
      allowGravity: false
    });

    // Collisions des projectiles ennemis
    this.physics.add.collider(this.enemyProjectiles, platformsLayer, (projectile) => {
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

    // Création des ennemis au sol
    const enemiesObjects = map.getObjectLayer('ennemis_tireurs')?.objects || [];
    this.enemies = this.physics.add.group();

    // Création des ennemis volants
    const flyingEnemiesLayer = map.getObjectLayer('ennemis_volants');
    console.log("Calque ennemis volants:", flyingEnemiesLayer);
    const flyingEnemiesObjects = flyingEnemiesLayer?.objects || [];
    console.log("Nombre d'ennemis volants trouvés:", flyingEnemiesObjects.length);
    this.flyingEnemies = this.physics.add.group();

    enemiesObjects.forEach(obj => {
      const enemy = this.physics.add.sprite(obj.x, obj.y, "enemy_walk");
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      
      // Définir la hitbox
      enemy.body.setSize(30, 80);
      enemy.body.setOffset(49, 16);
      
      // Configuration initiale
      enemy.setVelocityX(75);
      enemy.direction = 'right';
      enemy.isDead = false;
      enemy.vie = 3;
      enemy.initialX = obj.x;
      enemy.maxDistance = 200;
      enemy.lastShot = 0;
      enemy.shootCooldown = 2000;
      enemy.detectionRange = 300;
      
      this.enemies.add(enemy);
      enemy.anims.play('enemy_walk_right', true);
    });

    // Configuration des ennemis volants
    flyingEnemiesObjects.forEach(obj => {
      console.log("Création d'un ennemi volant à la position:", { x: obj.x, y: obj.y });
      const enemy = this.physics.add.sprite(obj.x, obj.y, "enemy2_fly");
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      enemy.setScale(0.75); // Légèrement plus petit que l'ennemi au sol
      
      // Définir la hitbox (plus petite pour l'ennemi volant)
       enemy.body.setSize(30, 80);
      enemy.body.setOffset(49, 16); // Centré dans le sprite
      
      // Les ennemis volants ne sont pas affectés par la gravité
      enemy.body.setAllowGravity(false);
      
      // Configuration initiale
      enemy.setVelocityX(100); // Un peu plus rapide que les ennemis au sol
      enemy.direction = 'right';
      enemy.isDead = false;
      enemy.vie = 3;
      enemy.initialX = obj.x;
      enemy.initialY = obj.y; // Sauvegarder la position Y initiale
      enemy.maxDistance = 100; // Petite distance de patrouille
      enemy.lastShot = 0;
      enemy.shootCooldown = 2000;
      enemy.detectionRange = 400; // Plus grande portée de détection
      
      this.flyingEnemies.add(enemy);
      enemy.anims.play('enemy2_fly_right', true);
    });

    // Collisions des ennemis au sol
    this.physics.add.collider(this.enemies, platformsLayer);

    // Pas de collision avec les plateformes pour les ennemis volants
    // Ils peuvent passer à travers

    // Ajouter la collision entre les joueurs et les ennemis
    // Collisions avec les ennemis au sol
    this.physics.add.collider(this.player1, this.enemies, (player, enemy) => {
      this.toucherJoueur(player);
    });
    this.physics.add.collider(this.player2, this.enemies, (player, enemy) => {
      this.toucherJoueur(player);
    });

    // Collisions avec les ennemis volants
    this.physics.add.overlap(this.player1, this.flyingEnemies, (player, enemy) => {
      this.toucherJoueur(player);
    });
    this.physics.add.overlap(this.player2, this.flyingEnemies, (player, enemy) => {
      this.toucherJoueur(player);
    });

    // Collisions entre projectiles des joueurs et ennemis au sol
    this.physics.add.collider(this.projectiles, this.enemies, (projectile, enemy) => {
      projectile.destroy();
      
      if (!enemy.isDead) {
        enemy.vie--;
        if (enemy.vie <= 0) {
          enemy.isDead = true;
          enemy.body.enable = false;
          enemy.anims.play("enemy_dead_anim", true);
          enemy.once('animationcomplete', () => {
            enemy.destroy();
          });
        }
      }
    });

    // Collisions entre projectiles des joueurs et ennemis volants
    this.physics.add.overlap(this.projectiles, this.flyingEnemies, (projectile, enemy) => {
      projectile.destroy();
      
      if (!enemy.isDead) {
        enemy.vie--;

        // Effet visuel de dégât
        enemy.setTint(0xff0000);
        this.time.delayedCall(200, () => {
          if (enemy && enemy.active) enemy.clearTint();
        });

        if (enemy.vie <= 0) {
          enemy.isDead = true;
          enemy.setVelocity(0, 0);
          enemy.anims.play("enemy2_dead_anim", true);
          enemy.body.enable = false;
          
          this.time.delayedCall(2000, () => {
            if (enemy && enemy.active) {
              enemy.destroy();
            }
          });
        }
      }
    });
  }

  toucherJoueur(joueur) {
    if (!joueur || joueur.isInvulnerable) return;
    
    // Perdre une vie
    joueur.vie--;
    
    // Afficher vies restantes
    if (joueur === this.player1) {
      this.vieJ1Text.setText(`J1 Vie: ${joueur.vie}`);
    } else {
      this.vieJ2Text.setText(`J2 Vie: ${joueur.vie}`);
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
      this.scene.start('defaite');
      return;
    }
  }

  update() {
    // J1
    const isOnGround = this.player1.body.blocked.down || this.player1.body.touching.down;
    // Mémoriser l'état au sol pour le tick suivant
    this.player1.wasOnGround = isOnGround;

    // Gestion du saut
    if (this.clavier1.up.isDown && isOnGround) {
      // déclencher le saut physique
      this.player1.setVelocityY(-300);
      // On garde en mémoire la dernière direction au moment du saut
      if (this.clavier1.right.isDown) {
        this.player1.lastDirection = 'right';
      } else if (this.clavier1.left.isDown) {
        this.player1.lastDirection = 'left';
      } else {
        this.player1.lastDirection = this.player1.lastDirection || 'right';
      }
      // Jouer immédiatement l'animation de saut correspondant à la direction,
      // et empêcher une nouvelle lecture tant que le joueur n'a pas atterri.
      if (this.player1.lastDirection === 'right') {
        this.player1.anims.play('jump_right', true);
      } else if (this.player1.lastDirection === 'left') {
        this.player1.anims.play('jump_left', true);
      } else {
        this.player1.anims.play('jump_idle', true);
      }
      this.player1.jumpPlayed = true;
    }
    
    // Déplacement horizontal et animations (mouvements lissés comme niveau1)
    let desiredVel1 = 0;
    if (this.clavier1.left.isDown) {
      desiredVel1 = -200;
      this.player1.lastDirection = 'left';
      if (isOnGround) this.player1.anims.play('left', true);
      else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_left', false); }
    } else if (this.clavier1.right.isDown) {
      desiredVel1 = 200;
      this.player1.lastDirection = 'right';
      if (isOnGround) this.player1.anims.play('right', true);
      else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_right', false); }
    } else {
      desiredVel1 = 0;
      if (isOnGround) this.player1.anims.play('turn');
      else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_idle', false); }
    }

    // Appliquer interpolation simple : lerp plus fort à l'appui (réactivité), plus doux au relâchement (décélération)
    this.player1.targetVel = desiredVel1;
  const pressLerp = 0.6; // quand on accélère
  const releaseLerp = 0.15; // harmonisé across levels
    const lerpFactor1 = Math.abs(this.player1.targetVel) > Math.abs(this.player1.smoothVel) ? pressLerp : releaseLerp;
    this.player1.smoothVel = Phaser.Math.Linear(this.player1.smoothVel, this.player1.targetVel, lerpFactor1);
  if (Math.abs(this.player1.smoothVel) < 2) this.player1.smoothVel = 0;
    this.player1.setVelocityX(Math.round(this.player1.smoothVel));

    if (isOnGround) this.player1.jumpPlayed = false;

    // J2
    const isOnGround2 = this.player2.body.blocked.down || this.player2.body.touching.down;
    this.player2.wasOnGround = isOnGround2;

    // Gestion du saut pour player2 : lancer l'anim de saut immédiatement
    if (this.clavier2.up.isDown && isOnGround2) {
      this.player2.setVelocityY(-300);
      // conserver direction au moment du saut
      if (this.clavier2.right.isDown) {
        this.player2.lastDirection = 'right';
      } else if (this.clavier2.left.isDown) {
        this.player2.lastDirection = 'left';
      } else {
        this.player2.lastDirection = this.player2.lastDirection || 'right';
      }
      // jouer l'animation de saut correspondante
      if (this.player2.lastDirection === 'right') {
        this.player2.anims.play('jump_right2', true);
      } else if (this.player2.lastDirection === 'left') {
        this.player2.anims.play('jump_left2', true);
      } else {
        this.player2.anims.play('jump_idle2', true);
      }
      this.player2.jumpPlayed = true;
    }

    // Déplacement horizontal et animations pour player2 (mouvements lissés)
    let desiredVel2 = 0;
    if (this.clavier2.left.isDown) {
      desiredVel2 = -200;
      this.player2.lastDirection = 'left';
      if (isOnGround2) this.player2.anims.play("left2", true);
      else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_left2', false); }
    } else if (this.clavier2.right.isDown) {
      desiredVel2 = 200;
      this.player2.lastDirection = 'right';
      if (isOnGround2) this.player2.anims.play("right2", true);
      else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_right2', false); }
    } else {
      desiredVel2 = 0;
      if (isOnGround2) this.player2.anims.play("turn2");
      else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_idle2', false); }
    }

    // interpolation lissée (hérité de niveau1)
    this.player2.targetVel = desiredVel2;
  const pressLerp2 = 0.6;
  const releaseLerp2 = 0.15;
    const lerpFactor2 = Math.abs(this.player2.targetVel) > Math.abs(this.player2.smoothVel) ? pressLerp2 : releaseLerp2;
    this.player2.smoothVel = Phaser.Math.Linear(this.player2.smoothVel, this.player2.targetVel, lerpFactor2);
  if (Math.abs(this.player2.smoothVel) < 2) this.player2.smoothVel = 0;
    this.player2.setVelocityX(Math.round(this.player2.smoothVel));

    if (isOnGround2) this.player2.jumpPlayed = false;

    // Interaction avec le terminal : si overlap + touche R -> redirection vers 'selection'
    if (!this.keyR) this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    if (this.porte_retour && !this.victoryTriggered) {
      const p1Overlap = this.physics.overlap(this.player1, this.porte_retour);
      const p2Overlap = this.physics.overlap(this.player2, this.porte_retour);
      if ((p1Overlap && p2Overlap) && Phaser.Input.Keyboard.JustDown(this.keyR)) {
        this.victoryTriggered = true;
        this.porte_retour.setTint(0x00ff00);
        this.time.delayedCall(1000, () => this.scene.start('victoire'));
        this.time.delayedCall(1000, () => this.scene.start('selection'), [], this);
      }
    }

    // Gestion des tirs des joueurs
    // J1 tire avec O
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.tir)) {
      const coefDir = this.player1.lastDirection === 'left' ? -1 : 1;
      
      // Marquer le joueur comme attaquant
      this.player1.isAttacking = true;
      
      // Jouer l'animation de magie selon la direction
      if (coefDir === -1) {
        this.player1.anims.play("magie_left", true);
      } else {
        this.player1.anims.play("magie_right", true);
      }

      // Créer le projectile à côté du joueur
      const bullet = this.projectiles.create(this.player1.x + (25 * coefDir), this.player1.y - 4, 'tir');
      bullet.setScale(0.5);
      
      // Paramètres physiques
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

    // J2 tire avec T
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.tir)) {
      const coefDir = this.player2.lastDirection === 'left' ? -1 : 1;
      
      // Marquer le joueur comme attaquant
      this.player2.isAttacking = true;
      
      // Jouer l'animation de magie selon la direction
      if (coefDir === -1) {
        this.player2.anims.play("magie_left2", true);
      } else {
        this.player2.anims.play("magie_right2", true);
      }

      // Créer le projectile à côté du joueur
      const bullet = this.projectiles.create(this.player2.x + (25 * coefDir), this.player2.y - 4, 'tir');
      bullet.setScale(0.5);
      
      // Paramètres physiques
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

    // Suppression des projectiles hors limites
    this.projectiles.children.entries.forEach(projectile => {
      if (!projectile.active) return;
      
      if (projectile.x < 0 || projectile.x > this.physics.world.bounds.width) {
        projectile.destroy();
      }
    });

    // Touches pour retourner au menu
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.menu)) {
      this.scene.start("accueil"); // J1 appuie sur M
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.menu)) {
      this.scene.start("accueil"); // J2 appuie sur H
    }



    // Gestion des ennemis au sol
    this.enemies.children.entries.forEach(enemy => {
      if (enemy.isDead) return;

      // Patrouille gauche-droite
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
      if (enemy.body.velocity.x === 0) {
        enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
        enemy.setVelocityX(enemy.direction === 'right' ? 75 : -75);
        enemy.setFlipX(enemy.direction === 'left');
      }

      this.handleEnemyAttack(enemy, 'enemy_tir_anim');
    });

    // Gestion des ennemis volants
    const activeEnemies = this.flyingEnemies.children.entries;
    activeEnemies.forEach(enemy => {
      if (enemy.isDead) return;
      
      // Mouvement horizontal simple de gauche à droite
      const distanceFromStart = Math.abs(enemy.x - enemy.initialX);
      
      // Si l'ennemi n'a pas de vitesse initiale, lui en donner une
      if (enemy.body.velocity.x === 0) {
        enemy.setVelocityX(75);
        enemy.direction = 'right';
      }
      
      if (distanceFromStart >= enemy.maxDistance) {
        // Changer de direction
        enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
        enemy.initialX = enemy.x;
        
        // Mettre à jour la vitesse et l'animation
        const newVelocity = enemy.direction === 'right' ? 75 : -75;
        enemy.setVelocityX(newVelocity);
        enemy.setFlipX(enemy.direction === 'left');
        enemy.anims.play('enemy2_fly_right', true);
      }
      
      // Maintenir la position Y initiale
      enemy.y = enemy.initialY;
      enemy.body.velocity.y = 0;

      // Utiliser la nouvelle fonction de tir spécifique aux ennemis volants
      this.handleFlyingEnemyAttack(enemy);
    });
  }

  handleFlyingEnemyAttack(enemy) {
    const currentTime = this.time.now;
    const players = [this.player1, this.player2];
    
    for (const player of players) {
      if (!player || !player.active) continue;
      
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
      
      if (distance <= enemy.detectionRange && currentTime - enemy.lastShot >= enemy.shootCooldown) {
        enemy.targetPlayer = player;
        enemy.lastShot = currentTime;

        // Jouer l'animation de tir
        enemy.anims.play('enemy2_tir_anim', true);
        
        // Créer le projectile immédiatement
        const bullet = this.enemyProjectiles.create(enemy.x, enemy.y, 'tir');
        bullet.setScale(0.5);
        
        // Direction du tir vers le joueur
        const angle = Phaser.Math.Angle.Between(
          enemy.x, 
          enemy.y, 
          enemy.targetPlayer.x, 
          enemy.targetPlayer.y
        );
        const velocity = new Phaser.Math.Vector2(200, 0);
        velocity.setAngle(angle);
        
        bullet.setVelocity(velocity.x, velocity.y);
        
        // Détruire le projectile après 3 secondes
        this.time.delayedCall(3000, () => {
          if (bullet && bullet.active) {
            bullet.destroy();
          }
        });
      }
    }
  }

  handleEnemyAttack(enemy, tirAnimKey) {
    const currentTime = this.time.now;
    const players = [this.player1, this.player2];
    
    for (const player of players) {
      if (!player || !player.active) continue;
      
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
      
      if (distance <= enemy.detectionRange && currentTime - enemy.lastShot >= enemy.shootCooldown) {
        enemy.targetPlayer = player;
        enemy.lastShot = currentTime;

        // Animation de tir
        enemy.anims.play(tirAnimKey, true);
        
        enemy.once('animationcomplete', (animation) => {
          if (animation.key === tirAnimKey && enemy.active && !enemy.isDead) {
            // Créer le projectile
            const bullet = this.enemyProjectiles.create(enemy.x, enemy.y, 'tir');
            bullet.setScale(0.5);
            
            // Direction du tir vers le joueur
            const angle = Phaser.Math.Angle.Between(
              enemy.x, 
              enemy.y, 
              enemy.targetPlayer.x, 
              enemy.targetPlayer.y
            );
            const velocity = new Phaser.Math.Vector2(200, 0);
            velocity.setAngle(angle);
            
            bullet.setVelocity(velocity.x, velocity.y);
            
            // Détruire le projectile après 3 secondes
            this.time.delayedCall(3000, () => {
              if (bullet && bullet.active) {
                bullet.destroy();
              }
            });
          }
        });
      }
    }
  }
  }
