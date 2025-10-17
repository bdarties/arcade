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
        fontSize: "32px",
        fill: "#fff",
      })
      .setOrigin(0.5);

    // Création des boutons
    this.buttons = {
      continue: this.createButton(440, 350, "CONTINUER"),
      quit: this.createButton(840, 350, "QUITTER"),
    };

    // État initial
    this.currentButton = "continue";
    this.updateButtonsScale();

    // Gestion des touches
    this.input.keyboard.on("keydown", this.handleKey, this);
  }

  createButton(x, y, text) {
    const button = this.add
      .text(x, y, text, {
        fontSize: "28px",
        fill: "#fff",
        backgroundColor: "#444",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive();

    return button;
  }

  updateButtonsScale() {
    Object.entries(this.buttons).forEach(([key, button]) => {
      const scale = key === this.currentButton ? 1.2 : 1;
      button.setScale(scale);
    });
  }

  handleKey(event) {
    switch (event.key.toLowerCase()) {
      case "arrowleft":
        this.currentButton = "continue";
        this.updateButtonsScale();
        break;
      case "arrowright":
        this.currentButton = "quit";
        this.updateButtonsScale();
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
