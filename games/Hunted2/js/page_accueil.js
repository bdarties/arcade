export default class Accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  preload() {
    // Fond
    this.load.image("fondAccueil", "assets/page_acceuil.jpg");

    // Boutons
    this.load.image("btn_jouer", "assets/btn_jouer.png");
    this.load.image("btn_credit", "assets/btn_credit.png");
    this.load.image("btn_controles", "assets/btn_controles.png");

    // Son de clic
    this.load.audio("btnClick", "assets/boutonclick.mp3"); // remplacer par un vrai fichier audio
  }

  create() {
    // --- Fond ---
    const bg = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "fondAccueil"
    );
    const scaleX = this.cameras.main.width / bg.width;
    const scaleY = this.cameras.main.height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale).setScrollFactor(0);

    // --- Boutons ---
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2 + 100;

    this.boutons = [
      this.add.image(centerX - 200, centerY, "btn_credit").setScale(0.5),
      this.add.image(centerX, centerY, "btn_jouer").setScale(0.5),
      this.add.image(centerX + 200, centerY, "btn_controles").setScale(0.5)
    ];

    // Index du bouton sélectionné
    this.selectedIndex = 1; // par défaut "Jouer"

    // --- Clavier ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    // Son
    this.sndClick = this.sound.add("btnClick");

    // Highlight initial
    this.updateSelection();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.boutons.length) % this.boutons.length;
      this.updateSelection();
      this.sndClick.play(); // jouer le son au déplacement
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.boutons.length;
      this.updateSelection();
      this.sndClick.play(); // jouer le son au déplacement
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.sndClick.play(); // jouer le son à la validation
      this.validateSelection();
    }
  }

  updateSelection() {
    // Reset tous les boutons
    this.boutons.forEach(b => b.setScale(0.5).setAlpha(0.7));

    // Bouton sélectionné = plus gros et opaque
    this.boutons[this.selectedIndex].setScale(0.6).setAlpha(1);
  }

  validateSelection() {
    switch (this.selectedIndex) {
      case 0:
        this.scene.start("credits");
        break;
      case 1:
        this.scene.start("checkpoint1");
        break;
      case 2:
        this.scene.start("controles");
        break;
    }
  }
}