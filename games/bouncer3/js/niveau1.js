import * as fct from "./fonctions.js";

export default class niveau1 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau1" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  preload() {
  }

  create() {
    fct.doNothing();
    fct.doAlsoNothing();

    this.add.image(640, 360, "img_ciel");
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_plateformes.create(200, 704, "img_plateforme");
    this.groupe_plateformes.create(600, 704, "img_plateforme");
    this.groupe_plateformes.create(1000, 704, "img_plateforme");
    this.groupe_plateformes.create(1400, 704, "img_plateforme");
    // ajout d'un texte distintcif  du niveau
    this.add.text(400, 100, "Vous êtes dans le niveau 1", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    this.porte_retour = this.physics.add.staticSprite(100, 670, "img_porte1");

    this.player = this.physics.add.sprite(100, 450, "img_perso");
    this.player.refreshBody();
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    // Gestion du clavier
    this.clavier = this.input.keyboard.addKeys({
      // Joueur 1
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      I: Phaser.Input.Keyboard.KeyCodes.I,
      O: Phaser.Input.Keyboard.KeyCodes.O,
      P: Phaser.Input.Keyboard.KeyCodes.P,
      K: Phaser.Input.Keyboard.KeyCodes.K,
      L: Phaser.Input.Keyboard.KeyCodes.L,
      M: Phaser.Input.Keyboard.KeyCodes.M,
      // Joueur 2
      Z: Phaser.Input.Keyboard.KeyCodes.Z,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      Q: Phaser.Input.Keyboard.KeyCodes.Q,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      R: Phaser.Input.Keyboard.KeyCodes.R,
      T: Phaser.Input.Keyboard.KeyCodes.T,
      Y: Phaser.Input.Keyboard.KeyCodes.Y,
      F: Phaser.Input.Keyboard.KeyCodes.F,
      G: Phaser.Input.Keyboard.KeyCodes.G,
      H: Phaser.Input.Keyboard.KeyCodes.H,
   });
    this.physics.add.collider(this.player, this.groupe_plateformes);
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
    if (this.clavier.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }

    if (this.clavier.I.isDown) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.switch("selection");
      }
    }
  }
}
