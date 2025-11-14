export default class victoire extends Phaser.Scene {
  constructor() {
    super({ key: "victoire" });
  }

  preload() {
    this.load.image("screen_victoire", "assets/screen_victoire.png");
    this.load.image("button_restart", "assets/button_restart.png");
    this.load.image("button_quitter", "assets/button_quitter.png");
  }

  create(data) {
    // Stocker le niveau en cours et le mode de jeu
    this.currentLevel = data?.fromLevel || 1;
    this.gameMode = data?.mode || 'histoire';
    this._fromSpeedrun = data?.fromSpeedrun || false;

    // Affichage de l'écran de victoire en plein écran
    this.add.image(640, 360, "screen_victoire")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(1280, 720);

    // Position des boutons
    const buttonY = 500;
    const buttonSpacing = 200;

    // Si on vient d'un niveau speedrun, afficher le temps
    if (data && data.fromSpeedrun) {
      const elapsedMs = data.elapsedMs || 0;
      const formatTime = (ms) => {
        const total = Math.max(0, Math.floor(ms));
        const minutes = Math.floor(total / 60000);
        const seconds = Math.floor((total % 60000) / 1000);
        const millis = total % 1000;
        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(millis).padStart(3, '0');
      };
      // Afficher le temps au centre, en grand
      const timeText = this.add.text(640, 300, formatTime(elapsedMs), { 
        fontFamily: 'Cinzel Decorative, serif', 
        fontSize: '48px', 
        color: '#ffffff' 
      })
      .setOrigin(0.5)
      .setDepth(300);
    }

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
    this.boutonQuitter.on('pointerdown', () => {
      if (this._fromSpeedrun) {
        this.scene.start('selection', { mode: 'speedrun' });
      } else {
        this.scene.start('accueil');
      }
    });

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
        if (this._fromSpeedrun) {
          this.scene.start('selection', { mode: 'speedrun' });
        } else {
          this.scene.start('accueil');
        }
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
    const sceneKey = this._fromSpeedrun ? `niveau${this.currentLevel}_speedrun` : `niveau${this.currentLevel}`;
    this.scene.start(sceneKey, { mode: this.gameMode });
  }
}