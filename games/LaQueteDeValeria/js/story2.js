export default class story2 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "story2" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
preload(){
this.load.image("2", "./assets/story_2.jpg");
}

create(){
    this.add
      .image(0, 0, "2")
      .setOrigin(0)
      .setDepth(0);

//TOUCHES ET CURSORS (JOYSTICK)
  this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
}
update(){
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.scene.switch("niveau2");
    } if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.scene.switch("selection");  
    }
}
}