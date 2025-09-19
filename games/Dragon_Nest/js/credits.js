export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
  }

  create() {
    const { width, height } = this.scale;

    // --- TITRE ---
    this.add.text(width / 2, height * 0.2, "Crédits", {
      fontFamily: "Arial",
      fontSize: "48px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // --- TEXTE ---
    this.add.text(width / 2, height * 0.4, "Jeu créé par :\nTon Nom", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5);

    // --- BOUTON RETOUR ---
    this.retour = this.add.text(width / 2, height * 0.8, "Retour au menu", {
      fontFamily: "Arial",
      fontSize: "32px",
      color: "#ffffff",
      backgroundColor: "#00000066",
      padding: { left: 10, right: 10, top: 5, bottom: 5 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Action quand on clique à la souris
    this.retour.on("pointerup", () => {
      this.scene.start("menu");
    });

    // Effet visuel quand la souris survole
    this.retour.on("pointerover", () => {
      this.setSelection(true);
    });
    this.retour.on("pointerout", () => {
      this.setSelection(false);
    });

    // --- CLAVIER ---
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Au lancement, le bouton est automatiquement sélectionné
    this.setSelection(true);
  }

  /**
   * Active ou désactive la mise en évidence du bouton
   */
  setSelection(isSelected) {
    if (isSelected) {
      this.retour.setStyle({ color: "#ba280bff" }); // vert = sélectionné
      this.isSelected = true;
    } else {
      this.retour.setStyle({ color: "#ffffff" });
      this.isSelected = false;
    }
  }

  update() {
    // Si le bouton est sélectionné et que le joueur appuie sur Entrée ou Espace
    if (this.isSelected && (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey))) {
      this.scene.start("menu");
    }
  }
}
