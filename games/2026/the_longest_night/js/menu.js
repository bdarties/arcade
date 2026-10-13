export default class Menu extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  preload() {
    this.load.image("fond_menu", "./presentation.png");
    this.load.image("jouer", "./assets/menu/button_jouer.png");
    this.load.image("controles", "./assets/menu/button_controles.png");
    this.load.image("credits", "./assets/menu/button_credits.png");
  }

  create() {
    this.add.image(0, 0, "fond_menu").setOrigin(0);

    const actions = [
      () => this.scene.start("Niveau_demo"),
      () => this.scene.start("Controles"),
      () => this.scene.start("Credits")
    ];

    this.buttons = [
      this.add.image(250, 450, "jouer").setInteractive(),
      this.add.image(250, 550, "controles").setInteractive(),
      this.add.image(250, 650, "credits").setInteractive()
    ];

    this.index = 0; // commence à 0 : "jouer"
    this.updateFocus(); // focus sur le 1er bouton 

    // Choisir avec les flèches
    this.input.keyboard.on("keydown-UP", () => {
      this.index = (this.index - 1 + 3) % 3;
      this.updateFocus();
    });

    this.input.keyboard.on("keydown-DOWN", () => {
      this.index = (this.index + 1) % 3;
      this.updateFocus();
    });

    this.input.keyboard.on("keydown-ENTER", () => actions[this.index]());

    // Choisir avec la souris
    this.buttons.forEach((btn, i) => {
      btn.on("pointerover", () => { this.index = i; this.updateFocus(); });
      btn.on("pointerdown", () => actions[i]());
    });
  }

  updateFocus() {
    this.buttons.forEach((btn, i) => {
      btn.setTint(i === this.index ? 0xffffff : 0x888888); // Blanc si sélectionné, grisé sinon
    });
  }
}