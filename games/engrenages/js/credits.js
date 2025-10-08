export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
  }

  preload() {
    this.load.image("screen_background", "assets/screen_background.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
  }

  create() {
    // Ajoute le fond
    this.add.image(this.game.config.width / 2, this.game.config.height / 2, "screen_background");

    // Titre
    this.add.text(this.game.config.width / 2, 200, "Crédits", { fontSize: "48px", fill: "#fff" }).setOrigin(0.5);

    // Liste des crédits
    this.add.text(
      this.game.config.width / 2,
      320,
      "Développement : R. Marty, L. Olsztynski, L.M. Dutherage\nGraphismes : opengameart.org, R. Marty, L. Olsztynski, L.M. Dutherage\nMusique : citer les gens",
      { fontSize: "32px", fill: "#fff", align: "center" }
    ).setOrigin(0.5);

    // Image retour au menu (visuel seulement)
    this.add.image(100, 60, "retour_menu").setOrigin(0.5);

    // Fonctionnalité clavier M pour retour menu
    this.input.keyboard.once("keydown-M", () => {
      this.scene.start("accueil");
    });
  }

  update() {}
}