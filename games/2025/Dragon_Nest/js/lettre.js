export default class lettre extends Phaser.Scene {
  constructor() {
    super({ key: 'lettre' });
  }

  create() {
    const { width, height } = this.scale;

    // --- Texte de conclusion ---
    const outroText = `
Vous avez échappé de justesse au courroux du grand dragon, refermant le portail derrière vous avant que ses flammes ne vous consument.

Les œufs sont sains et saufs… et vous, miraculeusement en vie.

Après un moment de répit, vous reprenez la route vers le village. Chaque craquement de branche, chaque ombre dans la brume vous rappelle que le danger n'est jamais loin, et que la bête, peut-être, n'a pas dit son dernier mot.

Soudain, un battement d'ailes trouble le silence. Un hibou descend des cieux, se pose doucement devant vous et tend une lettre scellée d'un symbole familier : celui du Mage.

À peine avez-vous tendu la main pour la saisir que l'oiseau s'efface dans un éclat de lumière, ne laissant derrière lui que le message… et une étrange sensation que tout cela n'est pas encore terminé.
    `;

    this.add.text(width / 2, height / 2 - 100, outroText, {
      fontSize: '20px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: width * 0.8 },
      lineSpacing: 8
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
    this.continueButton.on('pointerdown', () => this.startNextScene());

    // --- Gestion clavier (touche I) ---
    this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Le bouton est sélectionné par défaut
    this.isSelected = true;
    this.highlightButton(true);
  }

  highlightButton(active) {
    this.continueButton.setStyle({ fill: active ? '#ba280bff' : '#aaaaaa' });
  }

  startNextScene() {
    this.scene.start('bd2'); // Adaptez selon la scène suivante souhaitée
  }

  update() {
    // Validation avec la touche I
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.startNextScene();
    }
  }
}