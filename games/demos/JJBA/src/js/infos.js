import Phaser from "phaser";

var claviercinematique;
var cpt = 2;
var a = true;

export default class infos extends Phaser.Scene {
  constructor() {
    super({ key: "infos" }); // mettre le meme nom que le nom de la classe
  }

  preload() {
    this.load.image("fI1", "src/assets/ScreenControles1.jpg");
    this.load.image("fI2", "src/assets/ScreenVie1.jpg");
    this.load.image("fI3", "src/assets/ScreenPartie1.jpg");
    this.load.image("fI4", "src/assets/ScreenPartie2.jpg");
  }

  create() {
    this.add.image(960, 540, "fI1");

    claviercinematique = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (claviercinematique.space.isDown && a == true) {
      if (cpt == 2) {
        this.add.image(960, 540, "fI2");
      } else if (cpt == 3) {
        this.add.image(960, 540, "fI3");
      } else if (cpt == 4) {
        this.add.image(960, 540, "fI4");
      } else if (cpt == 5) {
        cpt = 2;
        this.game.config.StandProud.stop();
        this.scene.start("accueil");
      }
      cpt += 1;
      a = false;
    }
    if (claviercinematique.space.isUp) {
      a = true;
    }
  }
}
