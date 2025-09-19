// js/niveau1.js
import * as fct from "./fonctions.js";

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    // Charger la map (au cas où on arrive directement sur ce niveau)
    this.load.tilemapTiledJSON("map1", "assets/MAP1.json");
    this.load.image("tileset-image", "assets/tileset_map.png");

    // Assets nécessaires
    this.load.image("img_ciel", "assets/fond1.png");
    this.load.image("img_plateforme", "assets/platform.png");
    this.load.image("img_porte1", "assets/door1.png");
    this.load.spritesheet("img_perso", "assets/dude.png", { frameWidth: 64, frameHeight: 74 });
  }

  create() {
    fct.doNothing();
    fct.doAlsoNothing();

    // --- Tilemap ---
    const map = this.make.tilemap({ key: "map1" });
    const tileset = map.addTilesetImage("Tileset SAE301", "tileset-image");

    // Créer les layers (noms EXACTS du JSON)
    const backLayer = map.createLayer("decoration_back_layer", tileset, 0, 0);
    const platformLayer = map.createLayer("platform_layer", tileset, 0, 0);
    const frontLayer = map.createLayer("decoration_front_layer", tileset, 0, 0);

    // Collisions
    platformLayer.setCollisionByExclusion([-1], true);

    // Bounds & caméra
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Fond image (optionnel, en dessous de la tilemap si besoin)
    this.add.image(400, 300, "img_ciel").setScrollFactor(0);

    // --- Joueur ---
    this.player = this.physics.add.sprite(100, 450, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Faire suivre la caméra
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Porte
    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte1");

    // Collisions
    this.physics.add.collider(this.player, platformLayer);

    // Contrôles
    this.clavier = this.input.keyboard.createCursorKeys();

    // Texte
    this.add.text(400, 100, "Vous êtes dans le niveau 1", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt",
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
      this.player.anims.play("anim_face");
    }

    if (this.clavier.up.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-330);
    }

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.switch("selection");
      }
    }
  }
}
