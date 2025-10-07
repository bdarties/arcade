export default class controles extends Phaser.Scene {
  constructor() {
    super({ key: "controles" });
  }

  create() {
    const { width, height } = this.scale;

    // --- TITRE ---
    this.add.text(width / 2, height * 0.2, "Contrôles", {
      fontSize: "48px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // --- TEXTE DES CONTROLES ---
    this.add.text(
      width / 2,
      height * 0.4,
      "- Flèches pour se déplacer\n- Touche A pour intéragir et touche B pour attaquer",
      {
        fontSize: "28px",
        color: "#ffffff",
        align: "center"
      }
    ).setOrigin(0.5);

    // --- BOUTON RETOUR ---
    this.retour = this.add.text(width / 2, height * 0.8, "Retour au menu", {
      fontSize: "32px",
      color: "#ffffff",
      backgroundColor: "#00000066",
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Action quand on clique
    this.retour.on("pointerup", () => {
      this.scene.start("menu");
    });

    // Effet visuel au survol souris
    this.retour.on("pointerover", () => {
      this.setSelection(true);
    });
    this.retour.on("pointerout", () => {
      this.setSelection(false);
    });

    // --- CLAVIER ---
    // touche I comme touche de confirmation
    this.confirmKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Sélection du bouton dès le lancement
    this.setSelection(true);
  }

  /**
   * Gère l'état visuel du bouton
   */
  setSelection(isSelected) {
    if (isSelected) {
      this.retour.setStyle({ color: "#ba280bff" }); // Rouge = sélectionné
      this.isSelected = true;
    } else {
      this.retour.setStyle({ color: "#ffffff" });
      this.isSelected = false;
    }
  }

  update() {
    // Valider uniquement avec la touche I
    if (this.isSelected && Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
      this.scene.start("menu");
    }
  }
}