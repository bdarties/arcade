import { PvManager } from "./fonctions.js";

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    // charge l’image du piège si tu en as besoin
    this.load.image("death_zone", "./assets/trap.png");
  }

  create() {
    this.isDying = false; // reset flag à chaque création/scène restart

    this.add.image(640, 365, "niv2_bg");

    const plateformes = this.physics.add.staticGroup();
    plateformes.create(400, 568, "img_plateforme").setScale(2).refreshBody();

    this.player = this.physics.add.sprite(100, 450, "img_perso");
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, plateformes);

    this.pvManager = new PvManager(this);

    // Enregistrer cette scène comme la scène de jeu active
    this.registry.set('currentGameScene', this.scene.key);

    this.clavier = this.input.keyboard.createCursorKeys();

    this.deathZone = this.physics.add.staticSprite(400, 200, "death_zone");
    this.deathZone.displayWidth = 200;
    this.deathZone.displayHeight = 32;
    this.deathZone.refreshBody();

    this.physics.add.overlap(this.player, this.deathZone, this.handleDeath, null, this);

    this.porte_retour = this.physics.add.staticSprite(700, 500, "img_porte2");

        // Ajout touche P pour pause
    this.input.keyboard.on("keydown-P", () => {
      this.scene.launch("PauseScene", { from: this.scene.key });
      this.scene.pause();
    });
  }

handleDeath() {
  if (this.isDying) return;
  this.isDying = true;

  // Désactiver temporairement la zone de collision pour éviter récidive rapide
  this.deathZone.disableBody(true, false);
  this.pvManager.damage(1);

  this.time.delayedCall(25, () => {
    if (this.pvManager.getHealth() > 0) {
      this.scene.restart();
    } else {
      this.scene.start("gameover");
    }
  });
}


  update() {
    // Déplacements du joueur (conservés)
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-90);
      this.player.anims.play("anim_tourne_gauche", true);
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(90);
      this.player.anims.play("anim_tourne_droite", true);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.clavier.up.isDown) {
      this.player.setVelocityY(-90);
      this.player.anims.play("anim_face");
    } else if (this.clavier.down.isDown) {
      this.player.setVelocityY(90);
      this.player.anims.play("anim_face");
    } else {
      this.player.setVelocityY(0);
      if (!this.clavier.left.isDown && !this.clavier.right.isDown) {
        this.player.anims.play("anim_face");
      }
    }

    // Retour menu via porte
    if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.switch("selection");
      }
    }
  }
}
