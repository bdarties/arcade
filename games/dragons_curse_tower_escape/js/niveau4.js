import PauseManager from "./pause.js";
import * as fct from "./fonctions.js";

export default class niveau4 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau4" });
  }

  preload() {
    // Charge les assets spécifiques au niveau
    this.load.image("tuiles_de_jeu", "../assets/maps/tiles/tuilesJeu.png");
    this.load.tilemapTiledJSON("map2", "../assets/maps/map2.json");
  }

  create() {
    // --- Carte & tileset
    this.map = this.add.tilemap({ key: "map2" });
    const tileset = this.map.addTilesetImage("tuiles_de_jeu", "tuiles_de_jeu");


    this.calque_background = this.map.createLayer(
          "calque_background",
          tileset
        );
    
        // chargement du calque calque_background_2
  this.calque_background_2 = this.map.createLayer(
          "calque_background_2",
          tileset
        );

// chargement du calque calque_plateformes
  this.calque_plateformes = this.map.createLayer(
          "calque_plateformes",
          tileset
        );  


        this.poteaux = this.map.createLayer(
          "poteaux",
          tileset
        );
    this.porte = this.map.createLayer(
          "porte",
          tileset
        );
        
    // --- Joueur (utilise le spritesheet mage1)
    this.player = this.physics.add.sprite(100, 175, "mage1");
    this.player.setCollideWorldBounds(true);

    // --- Animations mage
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

    // --- Objets (porte dans le calque "porte")
    const objectsLayer = this.map.getObjectLayer("porte");
    if (objectsLayer) {
      objectsLayer.objects.forEach((obj) => {
        if (obj.name === "door") {
          const door = this.add.rectangle(
            obj.x, obj.y, obj.width || 32, obj.height || 32
          ).setOrigin(0).setAlpha(0);
          this.physics.add.existing(door, true);
          this.physics.add.overlap(this.player, door, () => {
            this.scene.start("NextLevel");
          });
        }
      });
    }

    // --- Caméra & monde
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player);

    // --- Contrôles
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    const speed = 150;
    this.player.setVelocity(0);

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
      this.player.flipX = false;
      this.player.anims.play("mage_idle", true);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }
  }
}
