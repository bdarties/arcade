// Scène du niveau 1 : plateformes, joueur, gestion de la mort
export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    this.load.image("background_niveau1", "assets/background.jpg");
    this.load.image("tiles", "assets/tileset.png");
    this.load.image("selection", "assets/selection.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
    this.load.tilemapTiledJSON("map_niveau1", "maps/map_niveau1.json");
    this.load.spritesheet("img_perso1", "assets/mouv_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_perso2", "assets/mouv_J2.png", { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    // MAP & TILESET
    const map = this.make.tilemap({ key: "map_niveau1" });
    const tileset = map.addTilesetImage("tileset", "tiles");

    const backgroundLayer = map.createLayer("background", tileset, 0, 0);
    const backgroundLayer2 = map.createLayer("background_2", tileset, 0, 0);
    const backgroundLayer3 = map.createLayer("background_3", tileset, 0, 0);
    const platformsLayer = map.createLayer("platforms", tileset, 0, 0);
    if (platformsLayer) {
      platformsLayer.setCollisionBetween(1, 9999); // Collision sur tous les tiles non-vides
    }

    this.add.image(0, 0, "background_niveau1").setOrigin(0, 0).setDepth(-1);

    // Création du J1
    this.player1 = this.physics.add.sprite(544, 5472, "img_perso1");
    this.player1.setBounce(0.15);
    this.player1.setCollideWorldBounds(true);
    this.player1.setSize(26, 58);
    this.clavier1 = this.input.keyboard.createCursorKeys();
    this.clavier1.menu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M); // Touche M pour menu J1

    // Création du J2
    this.player2 = this.physics.add.sprite(1568, 5664, "img_perso2");
    this.player2.setBounce(0.15);
    this.player2.setCollideWorldBounds(true);
    this.player2.setSize(26, 58);
    this.clavier2 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      menu: Phaser.Input.Keyboard.KeyCodes.H // Touche H pour menu J2
    });

    // Split screen : 2 caméras qui suivent chaque joueur
    this.cameras.main.setViewport(0, 0, 640, 720);
    this.camera2 = this.cameras.add(640, 0, 640, 720);
    this.cameras.main.centerOn(544, 5472);
    this.camera2.startFollow(this.player2);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.camera2.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Collisions
      this.physics.add.collider(this.player1, platformsLayer);
      this.physics.add.collider(this.player2, platformsLayer);

    // Bouton retour menu au-dessus de selection
    const retourMenuBtn = this.add.image(100, 60, "retour_menu").setScrollFactor(0).setDepth(100).setInteractive();
    retourMenuBtn.on("pointerup", () => {
      this.scene.start("accueil");
    });

    // Image selection en haut de l'écran
    this.add.image(100, 100, "selection").setScrollFactor(0).setDepth(100);

    this.add.text(400, 100, "Vous êtes dans le niveau 1", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    // ANIMATIONS J1
    if (!this.anims.exists("left")) {
      this.anims.create({
        key: "left",
        frames: this.anims.generateFrameNumbers("img_perso1", { start: 9, end: 15 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!this.anims.exists("turn")) {
      this.anims.create({
        key: "turn",
        frames: this.anims.generateFrameNumbers("img_perso1", { start: 0, end: 0 }),
        frameRate: 20
      });
    }
    if (!this.anims.exists("right")) {
      this.anims.create({
        key: "right",
        frames: this.anims.generateFrameNumbers("img_perso1", { start: 25, end: 31 }),
        frameRate: 10,
        repeat: -1
      });
    }
    // ANIMATIONS J2
    if (!this.anims.exists("left2")) {
      this.anims.create({
        key: "left2",
        frames: this.anims.generateFrameNumbers("img_perso2", { start: 9, end: 15 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!this.anims.exists("idle2")) {
      this.anims.create({
        key: "idle2",
        frames: this.anims.generateFrameNumbers("img_perso2", { start: 0, end: 0 }),
        frameRate: 20
      });
    }
    if (!this.anims.exists("right2")) {
      this.anims.create({
        key: "right2",
        frames: this.anims.generateFrameNumbers("img_perso2", { start: 25, end: 31 }),
        frameRate: 10,
        repeat: -1
      });
    }
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
      this.player1.setVelocityY(-235);
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
      this.player2.setVelocityY(-235);
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