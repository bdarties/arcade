// Écran des crédits, avec retour au menu sur la touche de validation.
export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
  }

  // Charge les illustrations utilisées sur cet écran.
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("fond_credits", "./assets/ecrans/credits.png");
    this.load.image("button_back", "./assets/boutton/button_back.png");
  }

  // Affiche les crédits et active le retour à l'accueil.
  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    const baseScale = 0.36;
    const zoomScale = baseScale * 1.12;

    this.add
      .image(w / 2, h / 2, "fond_credits")
      .setDisplaySize(w, h)
      .setDepth(-1);

    this.add
      .image(w / 2, 620, "button_back")
      .setOrigin(0.5)
      .setScale(zoomScale)
      .setTint(0xff9999);

    this.input.keyboard.once("keydown-I", () => this.scene.start("accueil"));
  }
}