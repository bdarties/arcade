export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
  }

  create() {
    const { width, height } = this.scale;

    // --- TITRE ---
    this.add.text(width / 2, height * 0.2, "Crédits", {
      fontSize: "48px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // --- TEXTE ---
    this.add.text(width / 2, height * 0.4, "Jeu créé par :\nJoan Colomb, Gianni Oliver, Marthe Carion", {
      fontSize: "28px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5);

    // --- BOUTON RETOUR ---
    this.retour = this.add.text(width / 2, height * 0.8, "Retour au menu", {
      fontSize: "32px",
      color: "#ffffff",
      backgroundColor: "#00000066",
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Clic souris
    this.retour.on("pointerup", () => {
      this.scene.start("menu");
    });

    // Effet survol souris
    this.retour.on("pointerover", () => {
      this.setSelection(true);
    });
    this.retour.on("pointerout", () => {
      this.setSelection(false);
    });

    // --- CLAVIER ---
    this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Bouton sélectionné par défaut
    this.setSelection(true);
  }

  setSelection(isSelected) {
    if (isSelected) {
      this.retour.setStyle({ color: "#ba280bff" });
      this.isSelected = true;
    } else {
      this.retour.setStyle({ color: "#ffffff" });
      this.isSelected = false;
    }
  }

  update() {
    if (this.isSelected && Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.scene.start("menu");
    }
  }
}