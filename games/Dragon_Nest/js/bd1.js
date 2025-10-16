export default class bd1 extends Phaser.Scene {
  constructor() {
    super({ key: "bd1" });
  }

  preload() {
    this.load.image("bd_portail", "assets/bd_portail.jpg");
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, "bd_portail").setOrigin(0.5);

    // 🔹 On remplace la touche ESPACE par la touche I
    this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  }

  update() {
    // 🔹 Si la touche I est pressée, on passe à la scène "niveau2"
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.scene.start("niveau2");
    }
  }
}
