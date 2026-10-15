export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("fond_credits", "./assets/ecrans/credits.png");
    this.load.image("button_back", "./assets/boutton/button_back.png");
  }

  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    const baseScale = 0.36;
    const zoomScale = baseScale * 1.12;

    // fond : derrière tout le reste
    this.add
      .image(w / 2, h / 2, "fond_credits")
      .setDisplaySize(w, h)
      .setDepth(-1);

    // bouton retour (directement sélectionné avec zoom + tint)
    this.add
      .image(w / 2, 620, "button_back")
      .setOrigin(0.5)
      .setScale(zoomScale)
      .setTint(0xff9999);

    // Espace ou Échap = retour à l'accueil
    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("accueil"));
    this.input.keyboard.once("keydown-ESC", () => this.scene.start("accueil"));
  }
}