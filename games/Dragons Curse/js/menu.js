class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }
  //on charge les images
  preload() {
    this.load.image("menu_fond", "assets/home_page.jpg");
    this.load.image("imageBoutonPlay", "assets/start.png");
    this.load.image("imageBoutonCredits", "assets/credits.png");
    this.load.image("imageBoutonControls", "assets/control.png");
  }

  create() {
   // on place les éléments de fond
    this.add
      .image(0, 0, "menu_fond")
      .setOrigin(0)
      .setDepth(0);

    // Boutons
    this.boutons = [
      this.add.image(870, 305, "imageBoutonPlay").setDepth(1),
      this.add.image(870, 405, "imageBoutonCredits").setDepth(1),
      this.add.image(870, 505, "imageBoutonControls").setDepth(1)
    ];

    this.boutons.forEach(b => b.setInteractive());

    // Index du bouton sélectionné
    this.selectedIndex = 0;
    this.updateSelection();

    // Clavier
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Action sur validation
    this.actions = [
      () => this.scene.start("intro"),
      () => this.scene.start("credits"),
      () => this.scene.start("controls")
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
    // Navigation
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.boutons.length;
      this.updateSelection();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.boutons.length) % this.boutons.length;
      this.updateSelection();
    }
    // Validation
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.actions[this.selectedIndex]();
    }
  }
}
export default menu;