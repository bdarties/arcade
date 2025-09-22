import * as fct from "./fonctions.js";

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    this.load.image("background_niveau3", "assets/background_niveau3.png");
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
  }

  create() {
    // Map Tiled
    const map = this.make.tilemap({ key: "map_niveau2" });
    const tileset = map.addTilesetImage("tileset", "tiles");

    // Calques
    const backgroundLayer = map.createLayer('background', tileset, 0, 0);
    const platformsLayer = map.createLayer('platforms', tileset, 0, 0);
    if (platformsLayer) platformsLayer.setCollisionBetween(1, 9999);

    // Ajout d'un texte distinctif du niveau
    this.add.text(400, 100, "Vous êtes dans le niveau 2", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    // Création des joueurs
    this.player1 = this.physics.add.sprite(100, 450, "img_perso1");
    this.player1.refreshBody();
    this.player1.setBounce(0.2);
    this.player1.setCollideWorldBounds(true);
    this.player1.setSize(26, 58);
    this.clavier1 = this.input.keyboard.createCursorKeys();
    this.clavier1.action = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I); // Touche I pour actions J1
    this.clavier1.menu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M); // Touche M pour menu J1

    this.player2 = this.physics.add.sprite(300, 450, "img_perso2");
    this.player2.refreshBody();
    this.player2.setBounce(0.2);
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

    // Bouton retour menu au-dessus de selection
    const retourMenuBtn = this.add.image(100, 60, "retour_menu").setScrollFactor(0).setDepth(100).setInteractive();
    retourMenuBtn.on("pointerup", () => {
      this.scene.start("accueil");
    });

    // Image selection en haut de l'écran
    this.add.image(100, 100, "selection").setScrollFactor(0).setDepth(100);

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

    // Pour la victoire
    this.doorActive = true;
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
      this.player2.anims.play("turn2");
    }
    if (this.clavier2.up.isDown && (this.player2.body.blocked.down || this.player2.body.touching.down)) {
      this.player2.setVelocityY(-300);
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
