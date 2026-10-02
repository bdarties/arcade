import Phaser from "phaser";

var claviercinematique;

export default class transition12 extends Phaser.Scene {
  constructor() {
    super({ key: "transition12" }); // mettre le meme nom que le nom de la classe
  }

  preload() {
    this.load.image("fT1", "src/assets/ScreenT1.jpg");
  }

  create() {
    this.add.image(960, 540, "fT1");

    claviercinematique = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (claviercinematique.space.isDown) {
      this.game.config.OSTJotaro.stop();
      this.scene.start("round2");
    }
  }
}
