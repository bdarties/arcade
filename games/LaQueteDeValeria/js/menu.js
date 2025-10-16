export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });

  }
  //on charge les images
  preload() {
    this.load.image("menu_fond", "./assets/background_menu.jpg");
    this.load.image("jouer", "./assets/bouton_start.png");
    this.load.image("controle", "./assets/bouton_controles.png");
  }

  create() {
   // on place les éléments de fond
    this.add
      .image(0, 0, "menu_fond")
      .setOrigin(0)
      .setDepth(0);

    this.bouton = [
    this.add.image(350,600,"jouer"),
    this.add.image(930, 600,"controle")
  ];
    // index de sélection
    this.indexSelection = 0;

    // Clavier : flèches via createCursorKeys + touche I séparée
    this.cursors = this.input.keyboard.createCursorKeys(); // left/right sont accessibles
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  }

  update() {
    // Utiliser JustDown pour n'agir qu'une fois par pression
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.indexSelection = (this.indexSelection - 1 + this.bouton.length) % this.bouton.length;
      this.updateSelection();
    } if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.indexSelection = (this.indexSelection + 1) % this.bouton.length;
      this.updateSelection();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
    // Vérifie quel bouton est sélectionné
    switch (this.indexSelection) {
      case 0: // Jouer
        this.scene.switch("selection");
        break;
      case 1: // Controle
        this.scene.switch("controles");
        break;
    }
  }
  }

   updateSelection(skipTween = false) {
    this.bouton.forEach((p, i) => {
      if (i === this.indexSelection) {
        p.setScale(1.40);
        p.setTint(0xffc000);
        p.setDepth(10);
      } else {
        p.clearTint();
        p.setScale(1);
        p.setDepth(0);
      }
     });
  }
}
