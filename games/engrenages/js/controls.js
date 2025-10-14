export default class controls extends Phaser.Scene {
  constructor() {
    super({ key: "controls" });
  }

  preload() {
    this.load.image("screen_controles", "assets/screen_controles.jpg");
    this.load.image("retour_menu", "assets/retour_menu.png");
  }

  create(data) {
    // Stocke l'information si on vient de la scène pause
    this.fromPause = data && data.fromPause;
    
    // Ajoute le fond
    this.add.image(this.game.config.width / 2, this.game.config.height / 2, "screen_controles");

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