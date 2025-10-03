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

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

 update() {
  if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
    this.scene.start("niveau2"); // ✅ passage vers niveau2
  }
}
}
