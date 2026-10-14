import * as fct from "./fonctions.js";

export default class niveau1 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau1"
    });
  }
  preload() {
  }

  create() {
    fct.doNothing();
    fct.doAlsoNothing();

    this.add.image(1280, 720, "sol");
    this.groupe_plateformes = this.physics.add.staticGroup();
    // ajout d'un texte distintcif  du niveau
    this.add.text(400, 100, "Vous êtes dans le niveau 1", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte1");
    //gestion des joueurs
    this.player = this.physics.add.sprite(100, 450, "img_perso");
    this.player.refreshBody();
    this.player.setCollideWorldBounds(true);
    //création des commandes
    this.clavier = this.input.keyboard.createCursorKeys();

    //création (et gestion) de la phsyique
    this.physics.add.collider(this.player, this.groupe_plateformes);
    
  }
  

  update() {
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play("anim_tourne_gauche", true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("anim_tourne_droite", true);
    } else if (this.clavier.up.isDown) {
      this.player.setVelocityY(-160);
      this.player.anims.play("anim_tourne_gauche", true);
    } else if (this.clavier.down.isDown) {
      this.player.setVelocityY(160);
      this.player.anims.play("anim_tourne_droite", true);
    } else {
      this.player.setVelocityX(0);
      this.player.setVelocityY(0);
      this.player.anims.play("anim_face");
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.switch("selection");
      }
    }
  }
}
