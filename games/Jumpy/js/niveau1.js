export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    // Background et plateformes
    this.load.image("img_ciel1", "./assets/skyaa.jpg");
    this.load.image("plateform", "./assets/platform.png");
    this.load.image("plateform2", "./assets/platform2.png");
    this.load.image("plateform3", "./assets/platform3.png");
    this.load.image("plateformp", "./assets/platformp.png");
    this.load.image("plateformm", "./assets/platformm.png");
    this.load.image("plateformg", "./assets/platformg.png");
    this.load.image("plateformb", "./assets/platformb.png");
    this.load.image("img_porte2", "./assets/door.png");

    // Joueur
    this.load.spritesheet("img_perso", "src/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });
  }

  create() {
    // Background fixe
    this.add.image(640, 360, "img_ciel1").setScrollFactor(0);

    // Groupe plateformes
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.skinsPlateformes = [/*"plateform", "plateform2", "plateform3"*/, "plateformp", "plateformm", "plateformg", "plateformb"];

    // Plateforme de départ (bas)
    for (let x = 0; x < 1280; x += 64) {
      this.groupe_plateformes.create(x, 704, "plateform").setScale(0.5).refreshBody();
    }

    // Plateformes initiales
    this.genererInitiales(35);

    // Joueur
    this.player = this.physics.add.sprite(640, 600, "img_perso");
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(1000); // chute plus rapide

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
      key: "anim_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 6, end: 9 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_face",
      frames: [{ key: "img_perso", frame: 4 }],
      frameRate: 20
    });

    // Clavier
    this.clavier = this.input.keyboard.createCursorKeys();

    // Caméra
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setLerp(0, 1);
    this.cameras.main.setBounds(0, -Infinity, 1280, Infinity);

    // Porte retour
    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte2");
    this.physics.add.collider(this.player, this.porte_retour);

    // Eau
    this.eau = this.add.rectangle(640, 920, 1280, 200, 0x3399ff).setOrigin(0.5, 1);
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
  }

  updatePlateformesTimers(delta) {
    this.groupe_plateformes.getChildren().forEach(plat => {
      if (plat.texture.key === "plateformp") {
        const playerTouchedPlat =
          this.player.body.touching.down &&
          Math.abs(this.player.x - plat.x) < plat.displayWidth / 2 &&
          Math.abs(this.player.y + this.player.displayHeight / 2 - plat.y) < 10;

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
    // Déplacement horizontal
    if (this.clavier.right.isDown) {
      this.player.setVelocityX(250);
      this.player.anims.play("anim_tourne_droite", true);
    } else if (this.clavier.left.isDown) {
      this.player.setVelocityX(-250);
      this.player.anims.play("anim_tourne_gauche", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("anim_face");
    }

    // Saut
    if ((this.clavier.up.isDown || this.clavier.space.isDown) && this.player.body.touching.down) {
      this.player.setVelocityY(-650);
    }

    // Retour menu
    if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.switch("selection");
      }
    }

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

    console.log("💀 GAME OVER : noyé !");
    this.scene.restart();
  }
}
