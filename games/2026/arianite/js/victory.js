// Écran de victoire affiché à la sortie du niveau des égouts.
export default class victory extends Phaser.Scene {
  constructor() {
    super({ key: "victory" });
  }

  // Charge le bouton de retour (et éventuellement la future illustration de victoire).
  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("button_back", "./assets/boutton/button_back.png");

    // Décommenter la ligne ci-dessous quand tu auras ton image d'écran de victoire :
    // this.load.image("ecran_victoire", "./assets/ecrans/victory_screen.png");
  }

  // Affiche le placeholder de victoire et configure le retour à l'accueil via la touche I.
  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    const baseScale = 0.36;
    const zoomScale = baseScale * 1.12;

    // --- PLACEHOLDER PLEIN ÉCRAN "VICTOIRE" ---
    // Remplaçable plus tard par :
    // this.add.image(w / 2, h / 2, "ecran_victoire").setDisplaySize(w, h).setDepth(-1);
    this.add
      .rectangle(w / 2, h / 2, w, h, 0x1e1b26)
      .setDepth(-1);

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