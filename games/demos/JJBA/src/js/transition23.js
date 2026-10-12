import Phaser from "phaser";

var claviercinematique;

export default class transition23 extends Phaser.Scene {
  constructor() {
    super({ key: "transition23" }); // mettre le meme nom que le nom de la classe
  }

  preload() {
    this.load.image("fT2", "src/assets/ScreenT2.jpg");
  }

  create() {
    this.add.image(960, 540, "fT2");

    claviercinematique = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (claviercinematique.space.isDown) {
      this.game.config.OSTJosuke.stop();
      this.scene.start("round3");
    }
  }
}
