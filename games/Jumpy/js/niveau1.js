import * as fct from "./fonctions.js";

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

 
  preload() {
    // Background et plateformes
    this.load.image("img_ciel1", "./assets/fond_grotte_1.jpg");
    this.load.image("plateform", "./assets/platformb.png");
    this.load.image("plateform2", "./assets/platform2.png");
    this.load.image("plateform3", "./assets/platform3.png");
    this.load.image("plateformp", "./assets/platformp.png");
    this.load.image("plateformm", "./assets/platformm.png");
    this.load.image("plateformg", "./assets/platformg.png");
    this.load.image("plateformb", "./assets/platformb.png");
    /*this.load.image("img_porte2", "./assets/door2.png");*/

    // Joueur
    this.load.spritesheet("img_perso", "./assets/viktors.png", {
      frameWidth: 42,
      frameHeight: 64
    });
  }

  create() {
    // Background fixe
    this.add.image(640, 360, "img_ciel1").setScrollFactor(0);


     //bouton retour
    this.toucheValidation = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);


    // Groupe plateformes
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.skinsPlateformes = [/*"plateform", "plateform2", "plateform3"*/, "plateformp", "plateformm", "plateformg", "plateformb"];

    // Plateforme de départ (bas)
    for (let x = 0; x < 1280; x += 104) {
      this.groupe_plateformes.create(x, 704, "plateform").setScale(0.5).refreshBody();
    }

    // Plateformes initiales
    this.genererInitiales(35);

    // Joueur
    this.player = this.physics.add.sprite(640, 600, "img_perso");
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(1000); // chute plus rapide

    this.score = 0;
this.baseY = this.player.y;    // position de départ (ex : 600)
this.highestY = this.player.y; // on prend la position initiale comme "plus haute" pour commencer

this.scoreText = this.add.text(20, 20, "Score: 0", {
  font: "24px Arial",
  fill: "#ffffff"
}).setScrollFactor(0).setDepth(1000);

    // COLLISIONS avec verifCollision
    this.physics.add.collider(
      this.player,
      this.groupe_plateformes,
      null,
      this.verifCollision,
      this
    );

    // Animations
    this.anims.create({
      key: "anim_tourne_gauche", // key est le nom de l'animation : doit etre unique poru la scene.
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 8,
        end: 13
      }), // on prend toutes les frames de img perso numerotées de 0 à 3
      frameRate: 10, // vitesse de défilement des frames
      repeat: -1 // nombre de répétitions de l'animation. -1 = infini
    });

    // creation de l'animation "anim_tourne_face" qui sera jouée sur le player lorsque ce dernier n'avance pas.
    this.anims.create({
      key: "anim_face",
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 6,
        end: 7
      }), // on prend toutes les frames de img perso numerotées de 0 à 3
      frameRate: 5, // vitesse de défilement des frames
      repeat: -1 // nombre de répétitions de l'animation. -1 = infini
    });

    // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: -1
    });


// Animation de saut gauche
this.anims.create({
  key: "saut_gauche",
  frames: [{ key: "img_perso", frame: 15 }], // choisis une frame adaptée
  frameRate: 1
});

// Animation de saut face
this.anims.create({
  key: "saut_face",
  frames: [{ key: "img_perso", frame: 16 }], // frame statique de face
  frameRate: 1
});

// Animation de saut droite
this.anims.create({
  key: "saut_droite",
  frames: [{ key: "img_perso", frame: 14 }], // choisis une frame adaptée
  frameRate: 1
});


    // Clavier
    this.clavier = this.input.keyboard.createCursorKeys();
    this.clavier.jump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);


    // Caméra
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setLerp(0, 1);
    this.cameras.main.setBounds(0, -Infinity, 1280, Infinity);
/*
    // Porte retour
    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte2");
    this.physics.add.collider(this.player, this.porte_retour);*/

    // Eau
    this.eau = this.add.rectangle(640, 920, 1280, 200, 0x00ff00).setOrigin(0.5, 1);
    this.physics.add.existing(this.eau, true);
    this.physics.add.collider(this.player, this.eau, () => this.gameOver(), null, this);
    this.eauActive = false;
    this.startTime = this.time.now;
  }

  // 🔹 fonction de vérification de collision
  verifCollision(objet1, objet2) {
    if (objet1 === this.player && objet1.y < objet2.y) return true;
    if (objet2 === this.player && objet1.y > objet2.y) return true;
    return false;
  }

  init() {
    this.plateformesTimers = new Map(); // stocke les timers des plateformes

    this.score = 0;
    this.baseY = null;      // y de départ (sera fixé dans create)
    this.highestY = null;
  }

  updatePlateformesTimers(delta) {
    this.groupe_plateformes.getChildren().forEach(plat => {
      if (plat.texture.key === "plateformp") {
        const playerTouchedPlat =
          this.player.body.touching.down &&
          Math.abs(this.player.x - plat.x) < plat.displayWidth / 2 &&
          Math.abs(this.player.y + this.player.displayHeight / 2 - plat.y) < plat.displayHeight / 2+5 ;

        if (playerTouchedPlat && !this.plateformesTimers.has(plat)) {
          this.plateformesTimers.set(plat, 0);
          this.tweens.add({
            targets: plat,
            x: plat.x + 5,
            duration: 100,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }

        if (this.plateformesTimers.has(plat)) {
          let t = this.plateformesTimers.get(plat) + delta;
          this.plateformesTimers.set(plat, t);
          if (t >= 500) {
            this.tweens.killTweensOf(plat);
            plat.destroy();
            this.plateformesTimers.delete(plat);
          }
        }
      }
    });
  }

  // Génération d'une seule plateforme
  genererPlateforme(x, y, skin = null) {
    console.log("Génération plateforme en", x, y, skin);
    if (!skin) skin = Phaser.Utils.Array.GetRandom(this.skinsPlateformes);
    let plat = this.groupe_plateformes.create(x, y, skin).setScale(0.5);
    plat.refreshBody();
    return plat;
  }

  // Génération initiale de plateformes
  genererInitiales(nbLignes) {
    this.derniereY = 600;
    for (let i = 0; i < nbLignes; i++) {
      this.genererLigne(this.derniereY);
      this.derniereY -= Phaser.Math.Between(50, 80);
    }
  }

  // Génération d'une ligne de plateformes
  genererLigne(y) {
    let nbPlateformes = Phaser.Math.Between(2, 3);
    let positions = [];

    for (let i = 0; i < nbPlateformes; i++) {
      let x;
      let tries = 0;
      do {
        x = Phaser.Math.Between(50, 1230);
        tries++;
      } while (positions.some(px => Math.abs(px - x) < 150) && tries < 10);

      positions.push(x);

      let skin = Phaser.Math.RND.weightedPick([
        /*{ key: "plateform", weight: 3 },*/
        /*{ key: "plateform2", weight: 3 },
        { key: "plateform3", weight: 4 },*/
        { key: "plateformp", weight: 1 },
        { key: "plateformm", weight: 3 },
        { key: "plateformg", weight: 3 },
        { key: "plateformb", weight: 3 },
      ]);

      this.genererPlateforme(x, y, skin.key);
    }
  }

  // Génération procédurale infinie
  genererProcedural() {  
    let limiteY = this.cameras.main.worldView.y - 150;
    while (this.derniereY > limiteY) {
      this.genererLigne(this.derniereY);
      this.derniereY -= Phaser.Math.Between(50, 80);
    }
  }

  // Nettoyage des plateformes trop basses
  nettoyerPlateformes() {
    this.groupe_plateformes.getChildren().forEach(p => {
      if (p.y > this.player.y + 800) p.destroy();
    });
  }

 update(time, delta) {
  if (this.toucheValidation.isDown) {
// Exécute l’action du bouton sélectionné
            this.scene.start("menu");
    }



  // Déplacement gauche/droite
  if (this.clavier.right.isDown) {
    this.player.setVelocityX(250);

    if (this.player.body.touching.down) {
      this.player.anims.play("anim_tourne_droite", true);
    } else {
      this.player.anims.play("saut_droite", true);
    }

  } else if (this.clavier.left.isDown) {
    this.player.setVelocityX(-250);

    if (this.player.body.touching.down) {
      this.player.anims.play("anim_tourne_gauche", true);
    } else {
      this.player.anims.play("saut_gauche", true);
    }

  } else {
    this.player.setVelocityX(0);

    if (this.player.body.touching.down) {
      this.player.anims.play("anim_face", true);
    } else {
      this.player.anims.play("saut_face", true);
    }
  }

  // Saut (impulsion uniquement quand touche le sol)
  if (Phaser.Input.Keyboard.JustDown(this.clavier.jump)) {
    if (this.player.body.touching.down) {
        this.player.setVelocityY(-660); // ajuster la vitesse de saut si besoin
    }
}
/*
  // Retour menu
  if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
    if (this.physics.overlap(this.player, this.porte_retour)) {
      this.scene.switch("selection");
    }
  }*/

  // Gestion plateformes / eau
  this.genererProcedural();
  this.nettoyerPlateformes();
  this.updatePlateformesTimers(delta);

  if (!this.eauActive && this.time.now - this.startTime > 10000) {
    this.eauActive = true;
  }
  if (this.eauActive) {
    let vitesse = 0.05;
    this.eau.y -= vitesse * delta;
    if (this.eau.body) this.eau.body.updateFromGameObject();
  }



  if (this.baseY !== null) {
    if (this.player.y < this.highestY) { // y diminue quand on monte => nouveau record
      this.highestY = this.player.y;
      const newScore = Math.floor((this.baseY - this.highestY) / 10); // 1 point = 10 px
      if (newScore > this.score) {
        this.score = newScore;
        this.scoreText.setText(`Score: ${this.score}`);
      }
    }
  }

  // Bornes monde et caméra
  this.physics.world.setBounds(0, -Infinity, 1280, Infinity);
  this.cameras.main.setBounds(0, -Infinity, 1280, Infinity);

  
}




gameOver() {
  this.physics.pause();
  this.player.setTint(0xff0000);
  this.player.anims.play("anim_face");

  this.add.text(
    this.cameras.main.worldView.x + 640,
    this.cameras.main.worldView.y + 200,
    "GAME OVER",
    { font: "48px Arial", fill: "#ffffff" }
  ).setOrigin(0.5);

  // afficher le score final
  this.add.text(
    this.cameras.main.worldView.x + 640,
    this.cameras.main.worldView.y + 260,
    `SCORE : ${this.score}`,
    { font: "32px Arial", fill: "#ffff00" }
  ).setOrigin(0.5);

  console.log("💀 GAME OVER : noyé ! score =", this.score);

  // redémarrer la scène après un petit délai pour laisser le joueur voir le message
  this.time.delayedCall(3500, () => {
    this.scene.restart();
  });
}

}
