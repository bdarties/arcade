export default class parametres extends Phaser.Scene {
  constructor() {
    super({ key: "parametres" });
  }

  preload() {
    this.load.image("screen_background", "assets/screen_background.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
  }

  create() {
    // Ajoute le fond
    this.add.image(this.game.config.width / 2, this.game.config.height / 2, "screen_background");

    this.add.text(this.game.config.width / 2, 200, "Paramètres", { fontSize: "48px", fill: "#fff" }).setOrigin(0.5);

    // Image retour au menu (visuel seulement)
    this.add.image(100, 60, "retour_menu").setOrigin(0.5);

    // Fonctionnalité clavier M pour retour menu
    this.input.keyboard.once("keydown-M", () => {
      this.scene.start("accueil");
    });
  }

  update() {}
}