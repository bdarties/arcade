import { musicManager } from './MusicManager.js';

export default class controls extends Phaser.Scene {
  constructor() {
    super({ key: "controls" });
  }

  preload() {
    // Précharger les musiques
    musicManager.preloadMusic(this);
    this.load.image("screen_controles", "assets/screen_controles.jpg");
    this.load.image("retour_menu", "assets/retour_menu.png");
  }

  create(data) {
    this.cameras.main.fadeIn(200, 0, 0, 0);

    // Stocke l'information si on vient de la scène pause
    this.fromPause = data && data.fromPause;
    
    // Initialiser la musique
    musicManager.scene = this;
    musicManager.play('controls', this.fromPause);
    
    // Ajoute le fond
    this.add.image(this.game.config.width / 2, this.game.config.height / 2, "screen_controles");

// Ornements décoratifs autour du titre
    const decorLeft = this.add.text(this.game.config.width / 2 - 220, 100, "⚙", { 
      fontSize: "40px", 
      fill: "#b87333"
    }).setOrigin(0.5);
    const decorRight = this.add.text(this.game.config.width / 2 + 220, 100, "⚙", { 
      fontSize: "40px", 
      fill: "#b87333"
    }).setOrigin(0.5);



    // Fonctionnalité clavier M pour retour
    this.input.keyboard.once("keydown-M", () => {
      if (this.fromPause) {
        this.scene.stop(); // Arrête la scène des contrôles
        this.scene.wake('pause'); // Réactive la scène pause
      } else {
        this.scene.start("accueil");
      }
    });
  }

  update() {}
}