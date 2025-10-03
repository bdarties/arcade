export default class intro extends Phaser.Scene {
  constructor() {
    super({ key: "intro" });
  }
  //on charge les images
  preload() {
    this.load.image("intro_fond", "assets/introduction.png");
    this.load.image("imageBoutonPlay", "assets/start.png");
  }

  create() {
   // on place les éléments de fond
    this.add
      .image(0, 0, "intro_fond")
      .setOrigin(0)
      .setDepth(0);

    // Boutons
    this.boutons = [
      this.add.image(1000, 555, "imageBoutonPlay").setDepth(1),
    ];

    this.boutons.forEach(b => b.setInteractive());

    // Index du bouton sélectionné
    this.selectedIndex = 0;
    this.updateSelection();

    // Clavier
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Action sur validation
    this.actions = [
      () => this.scene.start("selection"),
    ];
  }

  updateSelection() {
    this.boutons.forEach((b, i) => {
      // Scale progressif vers 1.1 si sélectionné, sinon vers 1
      const targetScale = i === this.selectedIndex ? 1.1 : 1;
      this.tweens.add({
        targets: b,
        scale: targetScale,
        duration: 150,
        ease: 'Power2'
      });
    });
  }

  update() {
    // Validation
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.actions[this.selectedIndex]();
    }
  }
}

export default intro;
