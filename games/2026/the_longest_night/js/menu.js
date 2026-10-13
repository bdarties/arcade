export default class Menu extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("fond_menu", "./presentation.png");
    this.load.image("jouer", "./assets/menu/button_jouer.png");
    this.load.image("controles", "./assets/menu/button_controles.png");
    this.load.image("credits", "./assets/menu/button_credits.png");
  }

  create() {
    this.add.image(0, 0, "fond_menu").setOrigin(0);
    const info = this.add.text(640, 360, "", {
      fontSize: "24px", color: "#ffffff", align: "center",
      backgroundColor: "#111746", padding: { x: 20, y: 16 }, lineSpacing: 8
    }).setOrigin(0.5).setVisible(false).setInteractive();
    info.on("pointerdown", () => info.setVisible(false));
    this.input.keyboard.on("keydown-ESC", () => info.setVisible(false));

    [
      ["jouer", 450, () => this.scene.start("Niveau_demo")],
      ["controles", 550, () => info.setText("Joueur 1 : flèches, O pour tirer, I pour interagir\nJoueur 2 : Z, K, L, M, T pour tirer, R pour interagir\n\nÉchap ou clic pour revenir").setVisible(true)],
      ["credits", 650, () => info.setText("Créé par\nLuna EGIDO-NEFFLIEZ\nMathéo AGUERRE--LE GALLOU\nLou-Anne DOUCHET--LEFÈVRE\n\nÉchap ou clic pour revenir").setVisible(true)]
    ].forEach(([image, y, action]) =>
      this.add.image(250, y, image).setInteractive({ useHandCursor: true }).on("pointerdown", action)
    );
  }
}