export default class gameover extends Phaser.Scene {
  constructor() {
    super({ key: "gameover" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Charger l’image de fond Game Over
    this.load.image("gameover_bg", "assets/game_over.jpg");
  }

  create() {
    const { width, height } = this.scale;

    // Affiche l’image en fond plein écran
    const bg = this.add.image(width / 2, height / 2, "gameover_bg").setOrigin(0.5);
    bg.setDisplaySize(width, height);

    // Crée les boutons
    this.buttons = [];
    this.selectedIndex = 0;

    this.styleNormal = { fontSize: "24px", color: "#ffffff" };
    this.styleSelected = { fontSize: "24px", color: "#ba280bff" };

    // Boutons plus hauts
    const restartBtn = this.add.text(width / 2, height - 200, "Recommencer", this.styleNormal).setOrigin(0.5);
    const menuBtn = this.add.text(width / 2, height - 140, "Retour Menu", this.styleNormal).setOrigin(0.5);

    this.buttons.push(restartBtn, menuBtn);

    // Mettre en surbrillance le premier bouton
    this.updateSelection();

    // Entrées clavier
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Clique souris
    restartBtn.setInteractive().on("pointerdown", () => this.restartGame());
    menuBtn.setInteractive().on("pointerdown", () => this.goMenu());

    // Survol souris = sélection bouton
    this.buttons.forEach((btn, index) => {
      btn.setInteractive().on("pointerover", () => {
        this.selectedIndex = index;
        this.updateSelection();
      });
    });

    // Sélectionne automatiquement le premier bouton
    this.selectedIndex = 0;
    this.updateSelection();
  }

  update() {
    // Navigation clavier
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
      this.updateSelection();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
      this.updateSelection();
    }

    // Validation
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (this.selectedIndex === 0) this.restartGame();
      else this.goMenu();
    }
  }

  updateSelection() {
    this.buttons.forEach((btn, index) => {
      if (index === this.selectedIndex) btn.setStyle(this.styleSelected);
      else btn.setStyle(this.styleNormal);
    });
  }

  restartGame() {
    this.registry.set("playerLives", 3);
    this.registry.set("playerPotions", 4);
    this.scene.start("selection");
  }

  goMenu() {
    this.registry.set("playerLives", 3);
    this.registry.set("playerPotions", 4);
    this.scene.start("menu");
  }
}
