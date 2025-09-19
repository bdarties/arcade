export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  joueurMort() {
    this.clavier.left.enabled = false;
    this.clavier.right.enabled = false;
    this.clavier.up.enabled = false;
    this.clavier.space.enabled = false;

    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY,
      "GAME OVER\nAppuyez sur R pour recommencer", {
        fontSize: "32px",
        fill: "#ff0000",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center"
      }).setOrigin(0.5).setScrollFactor(0);

    this.input.keyboard.off("keydown-R");
    this.input.keyboard.on("keydown-R", () => {
      this.scene.restart();
    });
  }

  preload() {
    this.load.image("img_ciel1", "./assets/skyaa.jpg");
    this.load.image("img_ciel2", "./assets/skyab.jpg"); // nouveau fond
    this.load.image("plateform", "./assets/platform.png");
    this.load.image("plateform2", "./assets/platform2.png");
    this.load.image("plateform3", "./assets/platform3.png");
    this.load.image("plateformp", "./assets/platformp.png"); 
    this.load.image("plateform4", "./assets/platform4.png"); 
    this.load.image("img_porte2", "./assets/door.png");

    this.load.spritesheet("img_perso", "src/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });
  }

  create() {
    // fond initial
    this.fond = this.add.image(640, 360, "img_ciel1").setScrollFactor(0);

    this.groupe_plateformes = this.physics.add.staticGroup();
    this.skinsPlateformes = ["plateform", "plateform2", "plateform3", "plateformp", "plateform4"];

    for (let x = 0; x < 1280; x += 48) {
      let plat = this.groupe_plateformes.create(x, 704, "plateform");
      plat.setScale(0.35);
      plat.refreshBody();
    }

    this.genererInitiales(15);

    this.player = this.physics.add.sprite(640, 600, "img_perso");
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(2000);

    this.physics.add.collider(this.player, this.groupe_plateformes, null, this.verifCollision, this);

    this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 6, end: 9 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: "anim_face", frames: [{ key: "img_perso", frame: 4 }], frameRate: 20 });

    this.clavier = this.input.keyboard.createCursorKeys();

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setLerp(0, 1);
    this.cameras.main.setBounds(0, -Infinity, 1280, Infinity);

    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte2");
    this.physics.add.collider(this.player, this.porte_retour);

    // eau
    this.eau = this.add.rectangle(640, 920, 1280, 200, 0x3399ff).setOrigin(0.5, 1);
    this.physics.add.existing(this.eau, true);
    this.physics.add.collider(this.player, this.eau, () => this.gameOver(), null, this);
    this.eauActive = false;
    this.startTime = this.time.now;

    this.eauVitesse = 0.03;   
    this.eauVitesseMax = 0.25;
    this.eauAcceleration = 0.00001;

    this.plateformesTimers = new Map();

    this.score = 0;
    this.maxHeight = this.player.y; 
    this.scoreText = this.add.text(10, 10, "Score : 0", { font: "24px Arial", fill: "#ffffff" }).setScrollFactor(0);
  }

  verifCollision(objet1, objet2) {
    if (objet1 === this.player && objet1.y < objet2.y) return true;
    if (objet2 === this.player && objet1.y > objet2.y) return true;
    return false;
  }

  updatePlateformesTimers(delta) {
    this.groupe_plateformes.getChildren().forEach(plat => {
      if (plat.texture.key === "plateformp" || plat.texture.key === "plateform4") {
        const playerTouchedPlat =
          this.player.body.touching.down &&
          Math.abs(this.player.x - plat.x) < plat.displayWidth / 2 &&
          Math.abs(this.player.y + this.player.displayHeight / 2 - plat.y) < 10;

        if (playerTouchedPlat && !this.plateformesTimers.has(plat)) {
          this.plateformesTimers.set(plat, 0);
          this.tweens.add({ targets: plat, x: plat.x + 5, duration: 100, yoyo: true, repeat: -1 });
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

  genererPlateforme(x, y) {
    let skin = Phaser.Utils.Array.GetRandom(this.skinsPlateformes);
    let plat = this.groupe_plateformes.create(x, y, skin).setScale(0.35);
    plat.refreshBody();
    return plat;
  }

  genererInitiales(nb) {
    this.derniereY = 600;
    let cote = 1;
    for (let i = 0; i < nb; i++) {
      let x = cote === 1 ? 400 : 900;
      let y = this.derniereY - 120;
      this.genererPlateforme(x, y);
      this.derniereY = y;
      cote *= -1;
    }
  }

  genererProcedural() {
    let hauteurCamera = this.cameras.main.worldView.y;
    let limiteY = hauteurCamera - 200;
    while (this.derniereY > limiteY) {
      let x = Phaser.Math.Between(200, 1080);
      let y = this.derniereY - Phaser.Math.Between(110, 140);
      this.genererPlateforme(x, y);
      this.derniereY = y;
    }
  }

  nettoyerPlateformes() {
    this.groupe_plateformes.getChildren().forEach(p => {
      if (p.y > this.player.y + 800) p.destroy();
    });
  }

  update(time, delta) {
    const speed = 220;
    if (this.clavier.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play("anim_tourne_droite", true);
    } else if (this.clavier.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play("anim_tourne_gauche", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("anim_face");
    }

    if ((this.clavier.up.isDown || this.clavier.space.isDown) && this.player.body.touching.down) {
      this.player.setVelocityY(-1400);
    }

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.switch("selection");
      }
    }

    this.genererProcedural();
    this.nettoyerPlateformes();
    this.updatePlateformesTimers(delta);

    // changement de fond selon score
    if (this.score > 1000) { // seuil pour changer de fond
      this.fond.setTexture("img_ciel2");
    }

    // eau
    if (!this.eauActive && this.time.now - this.startTime > 10000) {
      this.eauActive = true;
    }
    if (this.eauActive) {
      this.eauVitesse = Math.min(this.eauVitesse + this.eauAcceleration * delta, this.eauVitesseMax);
      this.eau.y -= this.eauVitesse * delta;
      if (this.eau.body) this.eau.body.updateFromGameObject();
    }

    this.physics.world.setBounds(0, -Infinity, 1280, Infinity);
    this.cameras.main.setBounds(0, -Infinity, 1280, Infinity);

    // score
    if (this.player.y < this.maxHeight) {
      this.score += Math.floor(this.maxHeight - this.player.y);
      this.maxHeight = this.player.y;
      this.scoreText.setText("Score : " + this.score);
    }
  }

  gameOver() {
    this.joueurMort();
    this.player.setTint(0xff0000);
    this.player.anims.play("anim_face");
    this.physics.pause();

    this.add.text(
      this.cameras.main.worldView.x + 640,
      this.cameras.main.worldView.y + 200,
      "GAME OVER",
      { font: "48px Arial", fill: "#ffffff" }
    ).setOrigin(0.5);

    console.log("💀 GAME OVER : noyé !");
  }
}
