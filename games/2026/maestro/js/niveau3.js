
export default class niveau3 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau3" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  preload() {
    this.load.spritesheet("cantatrice", "assets/cantatrice.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.tilemapTiledJSON("carte", "assets/map3.json");
  };

  create() {
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_plateformes.create(200, 584, "img_plateforme");
    this.groupe_plateformes.create(600, 584, "img_plateforme");

    const carteDuNiveau = this.add.tilemap("carte");

    const tileset = carteDuNiveau.addTilesetImage(
    "tuiles_de_jeu",
    "Phaser_tuilesdejeu",
    );

    // chargement du calque calque_background
    const calque_background = carteDuNiveau.createLayer(
      "calque_background",
      tileset,
    );

    // chargement du calque calque_background_2
    const calque_background_2 = carteDuNiveau.createLayer(
      "calque_background_2",
      tileset,
    );

    // chargement du calque calque_plateformes
    const calque_plateformes = carteDuNiveau.createLayer(
      "calque_plateformes",
      tileset,
    );

    this.player = this.physics.add.sprite(100, 450, "cantatrice");
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.groupe_plateformes);
    
    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte3");

    this.anims.create({
      key: "cantatrice_repos",
      frames: this.anims.generateFrameNumbers("cantatrice", {
        start: 0,
        end: 3,
      }),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: "cantatrice_gauche",
      frames: this.anims.generateFrameNumbers("cantatrice", {
        start: 6,
        end: 11,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "cantatrice_droite",
      frames: this.anims.generateFrameNumbers("cantatrice", {
        start: 12,
        end: 17,
      }),
      frameRate: 10,
      repeat: -1,
    });
  }

  update() {
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play("anim_tourne_gauche", true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("anim_tourne_droite", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("cantatrice_repos");
    }
    if (this.clavier.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        console.log("niveau 3 : retour vers selection");
        this.scene.switch("selection");
      }
    }
  }
}
