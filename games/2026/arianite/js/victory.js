// Écran de victoire affiché à la sortie du niveau des égouts.
export default class victory extends Phaser.Scene {
  constructor() {
    super({ key: "victory" });
  }

  // Charge le bouton de retour et l'illustration de victoire
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("ecran_victoire", "./assets/ecrans/victoire.png")
    this.load.image("button_back", "./assets/boutton/button_back.png");

  }

  // Affiche le placeholder de victoire et configure le retour à l'accueil via la touche I.
  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    const baseScale = 0.36;
    const zoomScale = baseScale * 1.12;

    this.add.image(w / 2, h / 2, "ecran_victoire").setDisplaySize(w, h).setDepth(-1);

    this.add
      .text(w / 2, h / 2 - 40, "VICTOIRE", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "64px",
        fontStyle: "bold",
        color: "#ffd700",
        stroke: "#000000",
        strokeThickness: 6
      })
      .setOrigin(0.5);

          this.add
      .text(w / 2, h / 1 - 300, "Votre femme est saine est sauve !", {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "32px",
        color: "#ff5500",
        stroke: "#000000",
        strokeThickness: 6
      })
      .setOrigin(0.5);

    // --- BOUTON RETOUR AU CENTRE BAS (comme dans controls.js) ---
    this.add
      .image(w / 2, 650, "button_back")
      .setOrigin(0.5)
      .setScale(zoomScale)
      .setTint(0xff9999)
      .setDepth(10);

    // Retour à l'accueil avec la touche I
    this.input.keyboard.once("keydown-I", () => this.scene.start("accueil"));
  }
}