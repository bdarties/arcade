import { resetGame } from "./fonctions.js";

export default class gameover extends Phaser.Scene {
  constructor() {
    super({ key: "gameover" });
  }

  preload() {
    // Image de fond Game Over
    this.load.image("fondGameOver", "assets/page_gameover.jpg");

    // Boutons
    this.load.image("btn_rejouer", "./assets/btn_rejouer.png");
    this.load.image("btn_menu", "./assets/btn_menu.png");

    // Son bouton
    this.load.audio("boutonClick", "./assets/boutonclick.mp3");
    this.load.audio('gameOverMusic', './assets/game-over.mp3');
  }

  create() {
    // --- STOP TOUTES LES MUSIQUES ---
    this.sound.stopAll();

    // --- LANCER LA MUSIQUE GAME OVER ---
    this.gameOverMusic = this.sound.add("gameOverMusic", { loop: false });
    this.gameOverMusic.setVolume(0.5);
    this.gameOverMusic.play();

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // --- Fond ---
    const bg = this.add.image(centerX, centerY, "fondGameOver");
    let scaleX = this.cameras.main.width / bg.width;
    let scaleY = this.cameras.main.height / bg.height;
    let scale = Math.max(scaleX, scaleY);
    bg.setScale(scale).setScrollFactor(0);

    /**********************/
    /** Boutons clavier */
    /**********************/
    this.boutons = [];

    // Position en bas de l'écran
    const bottomY = this.cameras.main.height - 150;

    // Bouton Rejouer
    const boutonRejouer = this.add.image(centerX - 150, bottomY, "btn_rejouer")
      .setScale(0.35)
      .setAlpha(0.7);

    // Bouton Menu
    const boutonMenu = this.add.image(centerX + 150, bottomY, "btn_menu")
      .setScale(0.35)
      .setAlpha(0.7);

    this.boutons.push(boutonRejouer, boutonMenu);

    /**********************/
    /** Navigation clavier */
    /**********************/
    this.selectedIndex = 0; // 0 = Rejouer, 1 = Menu
    this.updateSelection();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    // Son
    this.sonBouton = this.sound.add("boutonClick");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.boutons.length) % this.boutons.length;
      this.updateSelection();
      this.sonBouton.play();
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.boutons.length;
      this.updateSelection();
      this.sonBouton.play();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.sonBouton.play();
      this.time.delayedCall(50, () => {
        this.executeAction(this.selectedIndex);
      });
    }
  }

  updateSelection() {
    // Reset tous
    this.boutons.forEach(btn => btn.setScale(0.4).setAlpha(0.7));

    // Bouton sélectionné = agrandi + opaque
    this.boutons[this.selectedIndex].setScale(0.5).setAlpha(1);
  }

  executeAction(index) {
    // --- ARRÊTER LA MUSIQUE GAME OVER ---
    if (this.gameOverMusic && this.gameOverMusic.isPlaying) {
      this.gameOverMusic.stop();
    }

    resetGame();
    
    // Réinitialiser le portalTarget pour respawn au start
    this.game.config.portalTarget = null;

    if (index === 0) {
      // Rejouer
      this.scene.stop("niveau1");
      this.scene.stop("niveau2");
      this.scene.stop("niveau3");
      this.scene.start("selection");
    } else {
      // Retour menu
      this.scene.stop("niveau1");
      this.scene.stop("niveau2");
      this.scene.stop("niveau3");
      this.scene.stop("selection");
      this.scene.stop("checkpoint1");
      this.scene.stop("checkpoint2");
      this.scene.start("accueil");
    }
  }
}