export default class intro extends Phaser.Scene {
  constructor() {
    super({ key: 'intro' }); // ⚡ clé = "intro"
  }

  create() {
    const { width, height } = this.scale;

    // --- Texte d'introduction ---
    this.add.text(
      width / 2,
      height / 2 - 50,
      "Il était une fois...\nTon aventure commence ici !",
      {
        fontSize: '24px',
        fill: '#fff',
        align: 'center'
      }
    ).setOrigin(0.5);

    // --- Bouton "Continuer" ---
    this.continueButton = this.add.text(
      width / 2,
      height / 2 + 50,
      "Continuer",
      {
        fontSize: '28px',
        fill: '#aaaaaa' // gris clair par défaut
      }
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // --- Effet survol souris ---
    this.continueButton.on('pointerover', () => {
      this.highlightButton(true);
    });
    this.continueButton.on('pointerout', () => {
      this.highlightButton(false);
    });

    // --- Clic souris ---
    this.continueButton.on('pointerdown', () => {
      this.startSelectionScene();
    });

    // --- Gestion clavier (Entrée) ---
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Le bouton est sélectionné par défaut
    this.isSelected = true;
    this.highlightButton(true);
  }

  /**
   * Met en surbrillance ou enlève la surbrillance du bouton
   * @param {boolean} active - si true, bouton surligné
   */
  highlightButton(active) {
    if (active) {
      this.continueButton.setStyle({ fill: '#ba280bff' }); // Jaune doré sélectionné
    } else {
      this.continueButton.setStyle({ fill: '#aaaaaa' }); // Gris clair par défaut
    }
  }

  /**
   * Lance la scène suivante
   */
  startSelectionScene() {
    this.scene.start('selection');
  }

  update() {
    // Validation avec la touche Entrée
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.startSelectionScene();
    }
  }
}