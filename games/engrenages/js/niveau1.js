import * as fct from "./fonctions.js";

import { musicManager } from './MusicManager.js';

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  // helper: convert a life value (1..5) to spritesheet frame index (0..4)
  frameForVie(vie) {
    const clamped = Math.max(1, Math.min(5, Math.round(vie)));
    return 5 - clamped; // 5->0, 4->1, ..., 1->4
  }

  preload() {
    // Précharger les musiques
    musicManager.preloadMusic(this);
    this.load.image("ville_grotte", "assets/ville_grotte_final3.jpg");
    this.load.image("tiles", "assets/tileset.png");
    this.load.image("selection", "assets/selection.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
    this.load.tilemapTiledJSON("map_niveau2", "maps/map_niveau2.json");
    this.load.spritesheet("gearPiece", "assets/gearPiece.png", { frameWidth: 64, frameHeight: 64 });
    this.load.audio("ramassage_engrenage", "assets/son/ramassage_engrenage.mp3");
    this.load.audio("button_on", "assets/son/button_on.mp3");
    this.load.audio("button_off", "assets/son/button_off.mp3");
  // sons de gasp (idem que niveau3)
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
  // lifebar spritesheet for HUD (5 frames: 5/5 -> frame 0, ... 1/5 -> frame 4)
  this.load.spritesheet('lifebar', 'assets/lifebar.png', { frameWidth: 398, frameHeight: 89 });
    this.load.image("trappe_h", "assets/trappe_h.png");
    this.load.image("trappe_v", "assets/trappe_v.png");

    this.load.audio("tir_son", "assets/son/tir.mp3");


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


  create(data) {
    // Stocker le mode de jeu
    this.gameMode = data?.mode || 'histoire';

    // Initialiser la musique du niveau
    musicManager.scene = this;
    musicManager.play('niveau1');

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
    
    this.clavier1.tir = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O); // Touche O pour tirer J1

    this.player2 = this.physics.add.sprite(100, 1750, "img_perso2");

    // Points de vie et direction de tir pour J1
    this.player1.vie = 5;
    this.player1.directionTir = 1;
    this.player1.positionInitiale = { x: 100, y: 1200 };
    this.player1.fallStartY = this.player1.y;
    this.player1.wasOnGround = true;
    this.player1.isFalling = false;
    this.player1.peutTirer = true; // Possibilité de tirer initiale    
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
      tir: Phaser.Input.Keyboard.KeyCodes.T // Touche T pour tirer J2
    });

    // Points de vie et direction de tir pour J2
    this.player2.vie = 5;
    this.player2.directionTir = 1;
    this.player2.positionInitiale = { x: 100, y: 1400 };
    this.player2.fallStartY = this.player2.y;
    this.player2.wasOnGround = true;
    this.player2.isFalling = false;
    this.player2.peutTirer = true; // Possibilité de tirer initiale

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
      const actionPressed = (player === this.player1 && this.clavier1.action.isDown) || 
                          (player === this.player2 && this.clavier2.action.isDown);
      if (actionPressed && !bouton.lastPressed) {
        // Jouer le son d'activation du bouton
        try {
          if (this.sounds && this.sounds.buttonOn) this.sounds.buttonOn.play();
        } catch (e) {
          console.error('Erreur lors de la lecture du son du bouton:', e);
        }

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

    // Split screen: compute camera sizes from current game scale so camera2 is
    // always visible in the top-right of the screen even on smaller windows.
    const desiredCamW = 640;
    const desiredCamH = 720;
    const camW = Math.min(desiredCamW, Math.floor(this.scale.width / 2));
    const camH = Math.min(desiredCamH, this.scale.height);

    // main camera on the left
    this.cameras.main.setViewport(0, 0, camW, camH);

    // camera2 on the right/top of the screen
    const cam2X = Math.max(camW, this.scale.width - camW);
    this.camera2 = this.cameras.add(cam2X, 0, camW, camH);

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
      // Jouer le son de ramassage d'engrenage
      try {
        this.sound.play('ramassage_engrenage');
      } catch (e) {
        console.error('Erreur lors de la lecture du son de ramassage:', e);
      }
    });
    this.physics.add.overlap(this.player2, this.engrenages, (player, engrenage) => {
      engrenage.disableBody(true, true);
      this.nbEngrenages++;
      // Jouer le son de ramassage d'engrenage
      try {
        this.sound.play('ramassage_engrenage');
      } catch (e) {
        console.error('Erreur lors de la lecture du son de ramassage:', e);
      }
    });

    // textual HUD removed: we now use lifebar sprites only

    // Create a dedicated UI camera that covers the whole game canvas. This
    // camera will render HUD elements on top of both gameplay cameras.
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    // ensure the UI camera doesn't move
    this.uiCamera.setScroll(0, 0);

  // Lifebar HUD sprites: add them in screen coordinates and have only the UI
  // camera render them (main & camera2 will ignore these sprites).
  const hudTop = 10;
  const hudLeftJ1 = 10;
  const lifebarFrameWidth = 398; // must match preload frameWidth
  const lifebarFrameHeight = 89;
  // use same scale as niveau3 so both levels show bars at identical sizes
  const hudScale = 1 / 1.2;
  this.hudScale = hudScale;

  const scaledWidth = Math.round(lifebarFrameWidth * hudScale);
  const scaledHeight = Math.round(lifebarFrameHeight * hudScale);
  const hudLeftJ2 = Math.max(this.scale.width - scaledWidth - 10, this.cameras.main.width + 10);

  // initial frame based on vies (use class helper to be able to update later)
  this.hudLifeJ1 = this.add.sprite(hudLeftJ1, hudTop, 'lifebar', this.frameForVie(this.player1.vie)).setOrigin(0, 0).setScale(hudScale).setScrollFactor(0).setDepth(1000);
  this.hudLifeJ2 = this.add.sprite(hudLeftJ2, hudTop, 'lifebar', this.frameForVie(this.player2.vie)).setOrigin(0, 0).setScale(hudScale).setScrollFactor(0).setDepth(1000);

  // debug: log the hud scale and actual sprite dimensions so we can compare with niveau3
  try {
    console.log('niveau2 HUD debug', { hudScale, scaledWidth, scaledHeight, hudLeftJ1, hudLeftJ2 });
    console.log('hudLifeJ1 scale/size', { scaleX: this.hudLifeJ1.scaleX, scaleY: this.hudLifeJ1.scaleY, displayWidth: this.hudLifeJ1.displayWidth, width: this.hudLifeJ1.width, frame: this.hudLifeJ1.frame && this.hudLifeJ1.frame.index });
    console.log('hudLifeJ2 scale/size', { scaleX: this.hudLifeJ2.scaleX, scaleY: this.hudLifeJ2.scaleY, displayWidth: this.hudLifeJ2.displayWidth, width: this.hudLifeJ2.width, frame: this.hudLifeJ2.frame && this.hudLifeJ2.frame.index });
  } catch (e) {}

    // Make gameplay cameras ignore HUD sprites so only the UI camera draws them.
    try {
      this.cameras.main.ignore(this.hudLifeJ1);
      this.camera2.ignore(this.hudLifeJ1);
      this.cameras.main.ignore(this.hudLifeJ2);
      this.camera2.ignore(this.hudLifeJ2);
    } catch (e) {}

    // Ensure the UI camera only renders HUD elements: make it ignore all other
    // children in the scene. This prevents the UI camera from covering the
    // gameplay cameras' viewports.
    try {
  const hudSet = new Set([this.hudLifeJ1, this.hudLifeJ2]);
      (this.children.list || []).forEach(child => {
        if (!hudSet.has(child)) {
          try { this.uiCamera.ignore(child); } catch (e) {}
        }
      });
    } catch (e) {}

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
    this.player1Activated = false;
    this.player2Activated = false;
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
    // Les projectiles des ennemis au sol sont affectés par la gravité
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
      enemy.maxDistance = 150;
      enemy.lastShot = 0;
      enemy.shootCooldown = 3000;
      enemy.detectionRange = 200;
      
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
      enemy.maxDistance = 200; // Petite distance de patrouille
      enemy.lastShot = 0;
      enemy.shootCooldown = 3000;
      enemy.detectionRange = 200; // Plus grande portée de détection
      
      this.flyingEnemies.add(enemy);
      enemy.anims.play('enemy2_fly_right', true);
    });

    // Collisions des ennemis au sol
    this.physics.add.collider(this.enemies, platformsLayer);

    // Ajouter les collisions avec les plateformes pour les ennemis volants
    this.physics.add.collider(this.flyingEnemies, platformsLayer, (enemy) => {
      // Si l'ennemi heurte un mur, on change sa direction
      if (enemy.body.blocked.right || enemy.body.blocked.left) {
        enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
        const newVelocity = enemy.direction === 'right' ? 75 : -75;
        enemy.setVelocityX(newVelocity);
        enemy.setFlipX(enemy.direction === 'left');
      }
    });

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

      // Effet visuel de dégât
      enemy.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        if (enemy && enemy.active) enemy.clearTint();
      });
      
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
    
    // textual HUD removed; update lifebar frames below
    // Mettre 
    try {
      if (this.hudLifeJ1 && joueur === this.player1) this.hudLifeJ1.setFrame(this.frameForVie(joueur.vie));
      if (this.hudLifeJ2 && joueur === this.player2) this.hudLifeJ2.setFrame(this.frameForVie(joueur.vie));
    } catch (e) {}
    
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
      this.scene.start('defaite', { fromLevel: 1, mode: this.gameMode });
      return;
    }
  }

  update() {
    // Reposition HUDs in case camera sizes or viewports changed (keeps J1 at left and J2 at top-right)
    try {
      const hudTop = 10;
      const lifebarFrameWidth = 398;
      // ensure UI camera covers full scaled screen
      if (this.uiCamera) {
        this.uiCamera.setViewport(0, 0, this.scale.width, this.scale.height);
      }
      if (this.hudLifeJ1) {
        this.hudLifeJ1.x = 10;
        this.hudLifeJ1.y = hudTop;
      }
      if (this.hudLifeJ2) {
        // position relative to full game width (top-right)
        const frameW = lifebarFrameWidth;
        const hudScale = (typeof this.hudScale === 'number') ? this.hudScale : 1;
        const scaledW = Math.round(frameW * hudScale);
        this.hudLifeJ2.x = this.scale.width - scaledW - 10;
        this.hudLifeJ2.y = hudTop;
      }
    } catch (e) {}
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
      // jouer un son de gasp aléatoire (50% de chances) comme dans niveau3
      try {
        if (Phaser.Math.Between(1, 2) === 1) {
          const n = Phaser.Math.Between(1, 6);
          this.sound.play(`j1_gasp${n}`);
        }
      } catch (e) {}
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
  const releaseLerp = 0.45; // harmonisé across levels
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
      // jouer un son de gasp aléatoire (50% de chances) pour J2
      try {
        if (Phaser.Math.Between(1, 2) === 1) {
          const n2 = Phaser.Math.Between(1, 6);
          this.sound.play(`j2_gasp${n2}`);
        }
      } catch (e) {}
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
  const releaseLerp2 = 0.45;
    const lerpFactor2 = Math.abs(this.player2.targetVel) > Math.abs(this.player2.smoothVel) ? pressLerp2 : releaseLerp2;
    this.player2.smoothVel = Phaser.Math.Linear(this.player2.smoothVel, this.player2.targetVel, lerpFactor2);
  if (Math.abs(this.player2.smoothVel) < 2) this.player2.smoothVel = 0;
    this.player2.setVelocityX(Math.round(this.player2.smoothVel));

    if (isOnGround2) this.player2.jumpPlayed = false;

    // Interaction avec le terminal : joueur 1 avec I, joueur 2 avec R
    if (!this.keyR) this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    if (!this.keyI) this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    if (this.porte_retour && !this.victoryTriggered) {
      const p1Overlap = this.physics.overlap(this.player1, this.porte_retour);
      const p2Overlap = this.physics.overlap(this.player2, this.porte_retour);

      // Vérifier l'activation du joueur 1 (touche I)
      if (p1Overlap && Phaser.Input.Keyboard.JustDown(this.keyI)) {
        this.player1Activated = true;
      }

      // Vérifier l'activation du joueur 2 (touche R)
      if (p2Overlap && Phaser.Input.Keyboard.JustDown(this.keyR)) {
        this.player2Activated = true;
      }

      // Mettre à jour l'apparence du terminal selon l'état d'activation
      if (this.player1Activated && this.player2Activated) {
        // Les deux joueurs ont activé le terminal
        this.porte_retour.setTint(0x00ff00);
        if (!this.victoryTriggered) {
          this.victoryTriggered = true;
          this.time.delayedCall(1000, () => this.scene.start('introvideo2'));
        }
      } else if (this.player1Activated || this.player2Activated) {
        // Un seul joueur a activé le terminal
        this.porte_retour.setTint(0x80ff80); // Vert clair pour activation partielle
      }
    } 
    

    // Gestion des tirs des joueurs
    // J1 tire avec O
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.tir) && this.player1.peutTirer) {
      const coefDir = this.player1.lastDirection === 'left' ? -1 : 1;
      
      // Marquer le joueur comme attaquant
      this.player1.isAttacking = true;

      this.sound.play('tir_son');
      
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

      // Activer le cooldown
      this.player1.peutTirer = false;
      this.time.delayedCall(1000, () => {
        this.player1.peutTirer = true;
      });
    }

    // J2 tire avec T
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.tir) && this.player2.peutTirer) {
      const coefDir = this.player2.lastDirection === 'left' ? -1 : 1;
      
      // Marquer le joueur comme attaquant
      this.player2.isAttacking = true;

      this.sound.play('tir_son');
      
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

      // Activer le cooldown
      this.player2.peutTirer = false;
      this.time.delayedCall(1000, () => {
        this.player2.peutTirer = true;
      });
    }

    // Suppression des projectiles hors limites
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
        
        // Attaquer le joueur
        this.handleEnemyAttack(enemy, 'enemy_tir_anim');
      } else {
        // Reprendre la patrouille si aucun joueur n'est détecté
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

    // Gestion des ennemis volants
    const activeEnemies = this.flyingEnemies.children.entries;
    activeEnemies.forEach(enemy => {
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
        
        // Attaquer le joueur
        this.handleFlyingEnemyAttack(enemy);
      } else {
        // Reprendre la patrouille si aucun joueur n'est détecté
        const distanceFromStart = Math.abs(enemy.x - enemy.initialX);
        
        // Si l'ennemi n'a pas de vitesse initiale, lui en donner une
        if (enemy.body.velocity.x === 0 && !nearestPlayer) {
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
      }
      
      // Maintenir la position Y initiale
      enemy.y = enemy.initialY;
      enemy.body.velocity.y = 0;
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
            const bullet = this.enemyProjectiles.create(enemy.x - 50, enemy.y - 12, 'tir');
            bullet.setScale(0.5);
            
            // Déterminer la direction horizontale en fonction de la position du joueur
            const direction = enemy.targetPlayer.x < enemy.x ? -1 : 1;
            
            // Vitesse horizontale fixe, avec une légère composante verticale vers le haut
            bullet.setVelocity(200 * direction, 30); // -100 pour un petit effet de courbe
            
            // Détruire le projectile après 3 secondes ou s'il sort de l'écran
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
