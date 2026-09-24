// Reprend l'apparence des boutons de l'accueil (.nav-button) : Phaser ne connait
// ni bordure ni coin arrondi sur un texte, chaque bouton est donc un conteneur
// associant un fond dessine et son libelle.
const FONT = "Arial, sans-serif";
const PADDING_X = 28;
const PADDING_Y = 14;
const RADIUS = 10;
const BORDER_WIDTH = 2;
const FILL_ALPHA = 0.2;
const FILL_ALPHA_FOCUSED = 0.4;
const SCALE_FOCUSED = 1.1;

export default class ConfirmationExit extends Phaser.Scene {
  constructor() {
    super("confirmationExit");
  }

  create() {
    this.previousScene = this.scene.get(this.registry.get("previousScene"));

    // Fond semi-transparent noir
    this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7).setOrigin(0);

    // Texte de confirmation
    this.add
      .text(640, 250, "Voulez-vous quitter le jeu ?", {
        fontFamily: FONT,
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Création des boutons
    this.buttons = {
      continue: this.createButton(440, 350, "CONTINUER"),
      quit: this.createButton(840, 350, "QUITTER"),
    };

    // État initial
    this.currentButton = "continue";
    this.updateButtons();

    // Gestion des touches
    this.input.keyboard.on("keydown", this.handleKey, this);
  }

  createButton(x, y, label) {
    const button = this.add.container(x, y);
    const text = this.add
      .text(0, 0, label, { fontFamily: FONT, fontSize: "28px", color: "#ffffff" })
      .setOrigin(0.5);
    const background = this.add.graphics();

    button.add([background, text]);
    button.setSize(text.width + PADDING_X * 2, text.height + PADDING_Y * 2);
    button.background = background;

    return button;
  }

  drawButton(button, focused) {
    const { width, height, background } = button;

    background.clear();
    background.fillStyle(0xffffff, focused ? FILL_ALPHA_FOCUSED : FILL_ALPHA);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS);
    background.lineStyle(BORDER_WIDTH, 0xffffff, 1);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS);
  }

  updateButtons() {
    Object.entries(this.buttons).forEach(([key, button]) => {
      const focused = key === this.currentButton;
      this.drawButton(button, focused);
      button.setScale(focused ? SCALE_FOCUSED : 1);
    });
  }

  handleKey(event) {
    switch (event.key.toLowerCase()) {
      // Les deux boutons sont cote a cote : le joystick designe celui qu'il vise
      // plutot que de faire defiler une liste.
      case "arrowleft":
        this.currentButton = "continue";
        this.updateButtons();
        break;
      case "arrowright":
        this.currentButton = "quit";
        this.updateButtons();
        break;
      case "x":
      case "k":
      case "f":
        if (this.currentButton === "continue") {
          this.scene.resume(this.registry.get("previousScene"));
          this.scene.stop();
        } else {
          this.scene.stop(this.registry.get("previousScene"));
          window.location.href = "/games";
        }
        break;
    }
  }
}
