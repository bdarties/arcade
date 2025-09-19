export default class accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  preload() {
    // fond
    this.load.image("fondAccueil", "assets/page_acceuil.jpg");

    // boutons
    this.load.image("btn_jouer", "assets/btn_jouer.png");
    this.load.image("btn_credit", "assets/btn_credit.png");
    this.load.image("btn_controles", "assets/btn_controles.png");
  }

  create() {
    // --- FOND ---
    const bg = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "fondAccueil"
    );
    let scaleX = this.cameras.main.width / bg.width;
    let scaleY = this.cameras.main.height / bg.height;
    let scale = Math.max(scaleX, scaleY);
    bg.setScale(scale).setScrollFactor(0);

    // Position de base
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2 + 100;

    // --- BOUTONS ---
    this.boutons = [
      this.add.image(centerX - 200, centerY, "btn_credit").setScale(0.5),
      this.add.image(centerX, centerY, "btn_jouer").setScale(0.5),
      this.add.image(centerX + 200, centerY, "btn_controles").setScale(0.5)
    ];

    // Index du bouton sélectionné
    this.selectedIndex = 1; // par défaut "Jouer"

    // Ajout du clavier
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    // Highlight initial
    this.updateSelection();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.boutons.length) % this.boutons.length;
      this.updateSelection();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.boutons.length;
      this.updateSelection();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.validateSelection();
    }
  }

  updateSelection() {
    // reset tous les boutons
    this.boutons.forEach(b => b.setScale(0.5).setAlpha(0.7));

    // bouton sélectionné = + gros et opaque
    this.boutons[this.selectedIndex].setScale(0.6).setAlpha(1);
  }

  validateSelection() {
    switch (this.selectedIndex) {
      case 0:
        this.scene.start("credits");
        break;
      case 1:
        this.scene.start("selection");
        break;
      case 2:
        this.scene.start("controles");
        break;
    }
  }
}