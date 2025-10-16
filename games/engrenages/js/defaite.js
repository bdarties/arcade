export default class defaite extends Phaser.Scene {
  constructor() {
    super({ key: "defaite" });
  }

  preload() {
    this.load.image("screen_defaite", "assets/screen_defaite.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
    this.load.image("button", "assets/button.png");
  }

  create(data) {
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
    this.boutonRecommencer = this.add.image(640 - buttonSpacing, buttonY, "button")
      .setInteractive()
      .setScale(1.2);
    
    this.add.text(640 - buttonSpacing, buttonY, 'Recommencer', buttonStyle)
      .setOrigin(0.5);

    // Bouton Quitter
    this.boutonQuitter = this.add.image(640 + buttonSpacing, buttonY, "button")
      .setInteractive()
      .setScale(1.2);
    
    this.add.text(640 + buttonSpacing, buttonY, 'Quitter', buttonStyle)
      .setOrigin(0.5);

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
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) && this.selectedIndex < 1) {
      this.selectedIndex++;
      this.updateSelection();
    }

    // Sélection avec la touche I
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      if (this.selectedIndex === 0) {
        this.recommencerNiveau();
      } else {
        this.scene.start('accueil');
      }
    }
  }

  updateSelection() {
    // Réinitialiser l'échelle des boutons
    this.boutonRecommencer.setScale(1.2);
    this.boutonQuitter.setScale(1.2);

    // Mettre en évidence le bouton sélectionné
    if (this.selectedIndex === 0) {
      this.boutonRecommencer.setScale(1.4);
    } else {
      this.boutonQuitter.setScale(1.4);
    }
  }

  recommencerNiveau() {
    // Relancer le niveau en cours avec le même mode de jeu
    const sceneKey = `niveau${this.currentLevel}`;
    this.scene.start(sceneKey, { mode: this.gameMode });
  }
}