export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
  }

   preload() {
  this.load.setBaseURL(this.sys.game.config.baseURL);
  this.load.image("fond_credits", "./assets/ecrans/credits.png");
  
   }

  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;
    const police = 'Georgia, "Times New Roman", serif';

    // fond : derrière tout le reste
    this.add
      .image(w / 2, h / 2, "fond_credits")
      .setDisplaySize(w, h)
      .setDepth(-1);

  

    // bouton retour
    const retour = this.add
      .text(w / 2, 620, "RETOUR", {
        fontFamily: police,
        fontSize: "40px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retour.on("pointerover", () => {
      retour.setScale(1.15);
      retour.setColor("#ff0000");
    });
    retour.on("pointerout", () => {
      retour.setScale(1);
      retour.setColor("#ffffff");
    });
    retour.on("pointerup", () => this.scene.start("accueil"));

    // Échap = retour aussi
    this.input.keyboard.once("keydown-ESC", () => this.scene.start("accueil"));
  }
}