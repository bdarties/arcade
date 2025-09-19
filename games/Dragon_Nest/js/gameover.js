export default class gameover extends Phaser.Scene {
  constructor() {
    super({ key: "gameover" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Fond optionnel (mets ton image si tu veux un écran personnalisé)
    this.load.image("gameover_bg", "assets/gameover.png");
  }

  create() {
    const { width, height } = this.scale;

    // Fond (si tu as une image)
    if (this.textures.exists("gameover_bg")) {
      const bg = this.add.image(width / 2, height / 2, "gameover_bg").setOrigin(0.5);
      bg.setDisplaySize(width, height);
    } else {
      this.cameras.main.setBackgroundColor("#000000");
    }

    // Texte "GAME OVER"
    this.add.text(width / 2, height * 0.3, "GAME OVER", {
      fontFamily: "Arial",
      fontSize: "80px",
      color: "#ff0000",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Texte d’instructions
    this.add.text(width / 2, height * 0.5, "Appuie sur ESPACE pour recommencer", {
      fontFamily: "Arial",
      fontSize: "32px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.6, "Ou sur M pour revenir au menu", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#aaaaaa",
    }).setOrigin(0.5);

    // Input clavier
    this.input.keyboard.on("keydown-SPACE", () => {
      this.registry.set("playerLives", 3);
      this.registry.set("playerPotions", 4);
      this.scene.start("selection"); // relance la sélection / niveau
    });

    this.input.keyboard.on("keydown-M", () => {
      this.scene.start("menu");
    });
  }
}
