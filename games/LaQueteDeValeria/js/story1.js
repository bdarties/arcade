export default class story1 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "story1" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }

preload(){
this.load.image("1", "./assets/story_1.jpg");
}

create(){
    this.add
      .image(0, 0, "1")
      .setOrigin(0)
      .setDepth(0);

//TOUCHES ET CURSORS (JOYSTICK)
  this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
}
update(){
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.scene.switch("niveau1");
    } if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.scene.switch("selection");  
    }
}

}