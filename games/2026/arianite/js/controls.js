export default class controls extends Phaser.Scene {
  constructor() {
    super({ key: "controls" });
  }

  create() {
    const w = this.game.config.width;
    const police = 'Georgia, "Times New Roman", serif';

    this.cameras.main.setBackgroundColor("#0b0b1a");

    this.add
      .text(w / 2, 100, "CONTRÔLES", { fontFamily: police, fontSize: "64px", color: "#ffffff" })
      .setOrigin(0.5);

    const lignes = [
      "← / →  :  se déplacer",
      "↑  :  sauter / monter à la corde",
      "↓  :  descendre de la corde",
      "ESPACE  :  ouvrir une porte"
    ];
    this.add
      .text(w / 2, 360, lignes, {
        fontFamily: police,
        fontSize: "32px",
        color: "#ffffff",
        align: "center",
        lineSpacing: 24
      })
      .setOrigin(0.5);

    const retour = this.add
      .text(w / 2, 620, "RETOUR", { fontFamily: police, fontSize: "36px", color: "#ffffff" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    retour.on("pointerover", () => retour.setColor("#ff0000"));
    retour.on("pointerout", () => retour.setColor("#ffffff"));
    retour.on("pointerup", () => this.scene.start("accueil"));

    this.input.keyboard.once("keydown-ESC", () => this.scene.start("accueil"));
  }
}
