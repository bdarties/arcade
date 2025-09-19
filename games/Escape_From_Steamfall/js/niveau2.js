export default class niveau2 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau2" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  preload() {}

  create() {
    this.add.image(640, 365, "niv3_bg");
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_plateformes.create(200, 584, "img_plateforme");
    this.groupe_plateformes.create(600, 584, "img_plateforme");
    // ajout d'un texte distintcif  du niveau
    this.add.text(400, 100, "Vous êtes dans le die and retry", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte2");

    this.player = this.physics.add.sprite(100, 450, "img_perso");
    this.player.refreshBody();
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.groupe_plateformes);

    // Points de vie du joueur
    this.player.pv = 3;
    // Affichage des PV à l'écran
    this.playerPvText = this.add.text(16, 16, `PV: ${this.player.pv}`, { fontSize: '18px', fill: '#fff' });
    //******************
    // Zone de mort instantanée
    //******************
    this.zoneMort = this.physics.add.staticGroup();
    this.zoneMort.create(200, 400, null);
    this.zoneMort.children.entries[0].setSize(800, 50).setVisible(false);
    this.zoneMort.children.entries[0].body.setSize(800, 20); // Largeur de l'écran, hauteur de 20px
    this.zoneMort.children.entries[0].visible = false; // Invisible
     this.physics.add.overlap(this.player, this.zoneMort, this.mourirJoueur, null, this);
  }



//******************
    // Mechaniques die and retry
//******************

  playerDie() {
    this.player.pv -= 1;
    this.playerPvText.setText(`PV: ${this.player.pv}`);

    if (this.player.pv <= 0) {
      this.player.setTint(0xff0000);
      this.player.anims.play('turn');
      this.player.setVelocity(0, 0);
      this.physics.pause();
      this.add.text(400, 300, "Game Over", { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
    }

    // Réinitialiser la position du joueur
    this.player.setPosition(100, 450);
    this.player.vz = 0; // Réinitialiser la vitesse verticale
  }

  mourirJoueur(player, zoneMort) {
    this.playerDie();
  }




  update() {
    // Mise à jour de la direction du joueur
    if (this.clavier.left.isDown) {
      this.player.direction = 'left';
      this.player.setVelocityX(-90);
      this.player.anims.play("anim_tourne_gauche", true);
    } else if (this.clavier.right.isDown) {
      this.player.direction = 'right';
      this.player.setVelocityX(90);
      this.player.anims.play("anim_tourne_droite", true);
    } else {
      this.player.setVelocityX(0);
    }
    if (this.clavier.up.isDown) {
      this.player.direction = 'up';
      this.player.setVelocityY(-90);
      this.player.anims.play("anim_face");
    } else if (this.clavier.down.isDown) {
      this.player.direction = 'down';
      this.player.setVelocityY(90);
      this.player.anims.play("anim_face");
    } else {
      this.player.setVelocityY(0);
      if (!this.clavier.left.isDown && !this.clavier.right.isDown) {
        this.player.anims.play("anim_face");
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        console.log("niveau 3 : retour vers selection");
        this.scene.switch("selection");
      }
    }
  }
}