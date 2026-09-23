export default class defaite extends Phaser.Scene {
  constructor() {
    super({ key: "defaite" });
  }

  preload() {
    this.load.image("screen_defaite", "assets/screen_defaite.png");
    this.load.image("button_restart", "assets/button_restart.png");
    this.load.image("button_quitter", "assets/button_quitter.png");
  }

  create(data) {
    this.navSound = this.sound.add("navig_bouton", { volume: 0.5 });
    this.clicSound = this.sound.add("clic_bouton", { volume: 0.5 });

    // Stocker le niveau en cours et le mode de jeu
    this.currentLevel = data?.fromLevel || 1;
    this.gameMode = data?.mode || 'histoire';

    // Affichage de l'écran de défaite en plein écran
    this.add.image(640, 360, "screen_defaite")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(1280, 720);

    // Position des boutons
    const buttonY = 500;
    const buttonSpacing = 200;

    // Style du texte des boutons
    const buttonStyle = {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#ffffff'
    };

    // Bouton Recommencer
    this.boutonRecommencer = this.add.image(640 - buttonSpacing, buttonY, "button_restart")
      .setInteractive()
      .setScale(0.8);

    // Bouton Quitter
    this.boutonQuitter = this.add.image(640 + buttonSpacing, buttonY, "button_quitter")
      .setInteractive()
      .setScale(0.8);

    // Index du bouton sélectionné (0 = recommencer, 1 = quitter)
    this.selectedIndex = 0;

    // Configurer les interactions
    this.boutonRecommencer.on('pointerdown', () => this.recommencerNiveau());
    this.boutonQuitter.on('pointerdown', () => this.scene.start('accueil'));

    // Configuration des touches clavier
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Mettre à jour la sélection initiale
    this.updateSelection();
  }

  update() {
    // Navigation avec les flèches gauche/droite
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) && this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateSelection();
      this.navSound.play();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) && this.selectedIndex < 1) {
      this.selectedIndex++;
      this.updateSelection();
      this.navSound.play();
    }

    // Sélection avec la touche I
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      if (this.selectedIndex === 0) {
        this.recommencerNiveau();
        this.clicSound.play();
      } else {
        this.scene.start('accueil');
        this.clicSound.play();
      }
    }
  }

  updateSelection() {
    // Réinitialiser l'échelle des boutons
    this.boutonRecommencer.setScale(0.8);
    this.boutonQuitter.setScale(0.8);

    // Mettre en évidence le bouton sélectionné
    if (this.selectedIndex === 0) {
      this.boutonRecommencer.setScale(1);
    } else {
      this.boutonQuitter.setScale(1);
    }
  }

  recommencerNiveau() {
    // Relancer le niveau en cours avec le même mode de jeu
    const sceneKey = `niveau${this.currentLevel}`;
    this.scene.start(sceneKey, { mode: this.gameMode });
  }
}