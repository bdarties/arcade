export default class controles extends Phaser.Scene {
  constructor() {
    super({ key: "controles" });
  }

  preload() {
    // On charge l'image de fond
    this.load.image("controlesImage", "assets/controles.jpg"); 
    // ⚠️ Mets bien ton image dans le bon dossier (ex: public/assets/controles.jpg)
  }

  create() {
    const { width, height } = this.scale;

    // --- IMAGE DE FOND ---
    const background = this.add.image(width / 2, height / 2, "controlesImage");
    background.setOrigin(0.5);
    background.setDisplaySize(width, height); // pour qu'elle remplisse tout l'écran

    // --- BOUTON RETOUR ---
    this.retour = this.add.text(width / 2, height * 0.9, "Retour au menu", {
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
    if (this.isSelected && Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
      this.scene.start("menu");
    }
  }
}
