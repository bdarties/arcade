import * as fct from "./fonctions.js";

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    this.load.image("ville_grotte", "assets/ville_grotte_final2.png");
    this.load.image("tiles", "assets/tileset.png");
    this.load.image("selection", "assets/selection.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
    this.load.tilemapTiledJSON("map_niveau2", "maps/map_niveau2.json");
    this.load.image("gearPiece", "assets/gearPiece.png");
    this.load.image("button", "assets/button.png");
    this.load.image("terminal_rempli", "assets/terminal_rempli.png");
    this.load.image("screen_victoire", "assets/screen_victoire.png");
    this.load.spritesheet("img_perso1", "assets/mouv_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J1_idle", "assets/idle_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_perso2", "assets/mouv_J2.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J2_idle", "assets/idle_J2.png", { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet("J1_jump", "assets/jump_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J2_jump", "assets/jump_J2.png", { frameWidth: 64, frameHeight: 64 });
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
    this.clavier1 = this.input.keyboard.createCursorKeys();
    this.clavier1.action = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I); // Touche I pour actions J1
    this.clavier1.menu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M); // Touche M pour menu J1

    this.player2 = this.physics.add.sprite(100, 1400, "img_perso2");
    this.player2.refreshBody();
    this.player2.setBounce(0.2);
    this.player2.setCollideWorldBounds(true);
    this.player2.setSize(26, 58);
    this.clavier2 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      action: Phaser.Input.Keyboard.KeyCodes.R, // Touche R pour actions J2
      menu: Phaser.Input.Keyboard.KeyCodes.H // Touche H pour menu J2
    });

    // Collisions avec plateformes
    if (platformsLayer) {
      this.physics.add.collider(this.player1, platformsLayer);
      this.physics.add.collider(this.player2, platformsLayer);
    }

    // Porte de sortie
    this.porte_retour = this.physics.add.staticSprite(100, 550, "terminal_rempli");

    // Split screen
    this.cameras.main.setViewport(0, 0, 640, 720);
    this.camera2 = this.cameras.add(640, 0, 640, 720);
    this.cameras.main.startFollow(this.player1);
    this.camera2.startFollow(this.player2);
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
      const engrenage = this.engrenages.create(obj.x, obj.y, 'gearPiece');
      engrenage.setOrigin(0, 1);
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
  }

  update() {
    // J1
    const isOnGround = this.player1.body.blocked.down || this.player1.body.touching.down;
    const isOffGround = !isOnGround;

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
    
    // Déplacement horizontal et animations
    if (this.clavier1.left.isDown) {
      this.player1.setVelocityX(-160);
      this.player1.lastDirection = 'left';
      if (isOnGround) {
        this.player1.anims.play("left", true);
      } else {
        // Lance l'animation une seule fois
        // si on est en l'air et que l'animation de saut n'a pas encore été jouée pour ce saut
        if (!this.player1.jumpPlayed) {
          this.player1.jumpPlayed = true; // empêcher une nouvelle lecture avant atterrissage
          this.player1.anims.play("jump_left", false); // play once
        }
      }
    } else if (this.clavier1.right.isDown) {
      this.player1.setVelocityX(160);
      this.player1.lastDirection = 'right';
      if (isOnGround) {
        this.player1.anims.play("right", true);
      } else {
        if (!this.player1.jumpPlayed) {
          this.player1.jumpPlayed = true;
          this.player1.anims.play("jump_right", false);
        }
      }
    } else {
      this.player1.setVelocityX(0);
      if (isOnGround) {
        this.player1.anims.play("turn");
      } else {
        // En l'air sans mouvement horizontal, on joue l'animation de saut neutre (10-14) une seule fois
        if (!this.player1.jumpPlayed) {
          this.player1.jumpPlayed = true;
          this.player1.anims.play("jump_idle", false);
        }
      }
    }

    // Si le joueur vient d'atterrir, réinitialiser l'état jumpPlayed pour permettre un prochain saut
    if (isOnGround) {
      this.player1.jumpPlayed = false;
    }

    // J2
    const isOnGround2 = this.player2.body.blocked.down || this.player2.body.touching.down;

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

    // Déplacement horizontal et animations pour player2
    if (this.clavier2.left.isDown) {
      this.player2.setVelocityX(-160);
      this.player2.lastDirection = 'left';
      if (isOnGround2) {
        this.player2.anims.play("left2", true);
      } else {
        if (!this.player2.jumpPlayed) {
          this.player2.jumpPlayed = true;
          this.player2.anims.play("jump_left2", false);
        }
      }
    } else if (this.clavier2.right.isDown) {
      this.player2.setVelocityX(160);
      this.player2.lastDirection = 'right';
      if (isOnGround2) {
        this.player2.anims.play("right2", true);
      } else {
        if (!this.player2.jumpPlayed) {
          this.player2.jumpPlayed = true;
          this.player2.anims.play("jump_right2", false);
        }
      }
    } else {
      this.player2.setVelocityX(0);
      if (isOnGround2) {
        this.player2.anims.play("turn2");
      } else {
        if (!this.player2.jumpPlayed) {
          this.player2.jumpPlayed = true;
          this.player2.anims.play("jump_idle2", false);
        }
      }
    }

    // Reset jumpPlayed quand player2 atterrit
    if (isOnGround2) {
      this.player2.jumpPlayed = false;
    }

    // Les 2 J peuvent activer la porte si tous les engrenages sont récoltés
    if (
      this.nbEngrenages >= 6 &&
      this.doorActive &&
      (
        (this.physics.overlap(this.player1, this.porte_retour) && (Phaser.Input.Keyboard.JustDown(this.clavier1.space) || Phaser.Input.Keyboard.JustDown(this.clavier1.action))) ||
        (this.physics.overlap(this.player2, this.porte_retour) && (Phaser.Input.Keyboard.JustDown(this.clavier2.space) || Phaser.Input.Keyboard.JustDown(this.clavier2.action)))
      )
    ) {
      // Écran de victoire
      this.add.image(640, 360, "screen_victoire").setScrollFactor(0).setDepth(100);
      this.doorActive = false;
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