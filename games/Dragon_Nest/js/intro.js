export default class Intro extends Phaser.Scene {
  constructor() {
    super({ key: 'intro' });
  }

  create() {
    const { width, height } = this.scale;

    // --- Texte d'introduction ---
    const introText = `
Dans l'ombre d'un monde oublié, un mystérieux mage vous a tendu une offre que vous ne pouvez pas refuser. Une fortune colossale vous attend… à condition de réussir l'impossible.

Votre mission : retrouver dix œufs de dragon, cachés dans les recoins les plus dangereux de terres oubliées. Chaque pas que vous ferez est surveillé par des monstres affamés, prêts à tout pour vous empêcher d'atteindre votre but.

Et puis… il y a elle. La mère dragon. Terrible et impitoyable. Attirer son attention pourrait vous coûter la vie… ou vous forcer à fuir… voire à la combattre.

Prenez garde, aventurier. Chaque œuf compte. Chaque mouvement peut être le dernier. Le trésor vous attend… mais seul le plus prudent survivra pour le réclamer.
    `;

    this.add.text(width / 2, height / 2 - 100, introText, {
      fontSize: '20px',       // légèrement plus petit pour tenir à l'écran
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: width * 0.8 }, // largeur maximale 80% de l'écran
      lineSpacing: 8          // espacement entre les lignes
    }).setOrigin(0.5);

    // --- Bouton "Continuer" ---
    this.continueButton = this.add.text(width / 2, height - 100, "Continuer", {
      fontSize: '28px',
      fill: '#aaaaaa'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // --- Effet survol souris ---
    this.continueButton.on('pointerover', () => this.highlightButton(true));
    this.continueButton.on('pointerout', () => this.highlightButton(false));

    // --- Clic souris ---
    this.continueButton.on('pointerdown', () => this.startSelectionScene());

    // --- Gestion clavier (touche I) ---
    this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Le bouton est sélectionné par défaut
    this.isSelected = true;
    this.highlightButton(true);
  }

  highlightButton(active) {
    this.continueButton.setStyle({ fill: active ? '#ba280bff' : '#aaaaaa' });
  }

  startSelectionScene() {
    this.scene.start('selection');
  }

  update() {
    // Validation avec la touche I
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.startSelectionScene();
    }
  }
}