import Phaser from "phaser";

var claviercinematique;

export default class finjotaro extends Phaser.Scene {
  constructor() {
    super({ key: "finjotaro" }); // mettre le meme nom que le nom de la classe
  }

  preload() {
    this.load.image("fJ", "src/assets/ScreenJ.jpg");
  }

  create() {
    this.game.config.MusiqueFinHFH.play();
    this.add.image(960, 540, "fJ");

    claviercinematique = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (claviercinematique.space.isDown) {
      this.game.config.MusiqueFinHFH.stop();
      this.scene.start("accueil");
    }
  }
}
