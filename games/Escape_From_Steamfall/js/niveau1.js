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

     this.add.image(640, 365, "niv2_bg");
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_plateformes.create(200, 584, "img_plateforme");
    this.groupe_plateformes.create(600, 584, "img_plateforme");
    // ajout d'un texte distintcif  du niveau
    this.add.text(400, 100, "Vous êtes dans le niveau 1", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte1");

    this.player = this.physics.add.sprite(100, 450, "img_perso");
    this.player.refreshBody();
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.plates = this.physics.add.staticGroup();
  this.plate1 = this.plates.create(300, 550, "img_plate");
  this.plate2 = this.plates.create(400, 550, "img_plate");
  this.plate3 = this.plates.create(500, 550, "img_plate");

  // Séquence aléatoire (3 valeurs entre 0 et 2)
  this.sequence = Array.from({length: 3}, () => Phaser.Math.Between(0, 2));
  console.log("Séquence Simon :", this.sequence);

  // Tableau pour stocker les actions du joueur
  this.playerSequence = [];

  // Activer détection des overlaps
  this.physics.add.overlap(this.player, this.plates, this.activatePlate, null, this);
  }
  
  activatePlate(player, plate) {
  let plateIndex;
  if (plate === this.plate1) plateIndex = 0;
  if (plate === this.plate2) plateIndex = 1;
  if (plate === this.plate3) plateIndex = 2;

  // Ajout au tableau joueur
  this.playerSequence.push(plateIndex);
  console.log("Séquence joueur :", this.playerSequence);

  // Vérification
  if (this.playerSequence.length === this.sequence.length) {
    if (this.checkSequence()) {
      console.log("Bravo ! La porte s'ouvre");
      this.porte_retour.setTexture("img_porte_ouverte"); // par ex
      // tu pourrais aussi autoriser le passage
    } else {
      console.log("Mauvaise séquence, recommence !");
      this.playerSequence = [];
    }
  }
}

checkSequence() {
  return this.sequence.every((val, index) => val === this.playerSequence[index]);
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

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.switch("selection");
      }
    }
  }
}
