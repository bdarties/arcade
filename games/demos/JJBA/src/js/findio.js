import Phaser from "phaser";

var claviercinematique;

export default class findio extends Phaser.Scene {
  constructor() {
    super({ key: "findio" }); // mettre le meme nom que le nom de la classe
  }

  preload() {
    this.load.image("fD", "src/assets/ScreenD.jpg");
  }

  create() {
    this.add.image(960, 540, "fD");
    this.game.config.MusiqueFinHFH.play();
    claviercinematique = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (claviercinematique.space.isDown) {
      this.game.config.MusiqueFinHFH.stop();
      this.scene.start("accueil");
    }
  }
}
