export default class controles extends Phaser.Scene {
  constructor() {
    super({ key: "controles" });
  }

  preload() {
    // charger l'image du fond et du bouton retour
    this.load.image("fondControles", "assets/page_acceuil.jpg");
    this.load.image("btn_retour", "assets/btn_retour.png");
  }

  create() {
   // --- FOND ---
const bg = this.add.image(
  this.cameras.main.width / 2,
  this.cameras.main.height / 2,
  "fondControles"
);
// adapter la taille à l'écran
let scaleX = this.cameras.main.width / bg.width;
let scaleY = this.cameras.main.height / bg.height;
let scale = Math.max(scaleX, scaleY);
bg.setScale(scale).setScrollFactor(0);

// --- FILTRE NOIR (60% opacity) ---
const filtreNoir = this.add.rectangle(
  this.cameras.main.width / 2,
  this.cameras.main.height / 2,
  this.cameras.main.width,
  this.cameras.main.height,
  0x000000,
  0.6 // opacité = 60%
);
filtreNoir.setScrollFactor(0);
    // --- TITRE ---
    this.add.text(
      this.cameras.main.width / 2,
      100,
      "Contrôles du jeu",
      { font: "48px Arial", fill: "#fff" }
    ).setOrigin(0.5);

    // --- EXPLICATIONS TOUCHES ---
    this.add.text(
      this.cameras.main.width / 2,
      250,
      "Valider: K\nSauter: I",
      { font: "32px Arial", fill: "#fff", align: "center" }
    ).setOrigin(0.5);

    // --- BOUTON RETOUR ---
    this.boutonRetour = this.add.image(
      this.cameras.main.width / 2,
      500,
      "btn_retour"
    ).setScale(0.5).setInteractive({ useHandCursor: true });

    this.boutonRetour.on("pointerover", () => this.boutonRetour.setScale(0.55));
    this.boutonRetour.on("pointerout", () => this.boutonRetour.setScale(0.5));
    this.boutonRetour.on("pointerdown", () => {
      this.scene.start("accueil");
    });

    // --- CLAVIER ---
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.selectedIndex = 0; // bouton retour sélectionné par défaut
    this.updateSelection();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.validateSelection();
    }
  }

  updateSelection() {
    this.boutonRetour.setScale(0.55);
  }

  validateSelection() {
    if (this.selectedIndex === 0) {
      this.scene.start("accueil");
    }
  }
}