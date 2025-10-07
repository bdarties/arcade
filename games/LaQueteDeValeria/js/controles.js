export default class controles extends Phaser.Scene {
  constructor() {
    super({ key: "controles" }); // mettre le meme nom que le nom de la classe
  }
preload() {
this.load.image("ex_controle", "./assets/controle.png");
}


create() {
this.add
.image(0, 0,"ex_controle")
.setOrigin(0)
.setDepth(0);

this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
}


update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
  this.scene.switch("menu");  
}
}
}