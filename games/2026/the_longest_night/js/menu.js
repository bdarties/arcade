export default class Menu extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  preload() {
    const path = "./assets/menu/";

    // Fonds
    this.load.image("screen_welcome", path + "screen_welcome.png");
    this.load.image("screen_mode", path + "screen_mode.png");
    this.load.image("story_screen", path + "story_screen.png");
    this.load.image("screen_controles", path + "screen_controles.png");
    this.load.image("screen_credits", path + "screen_credits.png");

    // Boutons
    this.load.image("button_jouer", path + "button_jouer.png");
    this.load.image("button_controles", path + "button_controles.png");
    this.load.image("button_credits", path + "button_credits.png");
    this.load.image("button_1joueur", path + "1joueur.png");
    this.load.image("button_2joueurs", path + "2joueurs.png");
    this.load.image("button_retour", path + "button_retour.png");
  }

  create() {
    this.mode = 1;
    this.currentScreen = null;
    this.objects = [];
    this.buttons = [];
    this.index = 0;

    this.screens = {
      welcome: {
        bg: "screen_welcome",
        buttons: [
          { key: "button_jouer",     x: 250, y: 450, action: () => this.showScreen("mode") },
          { key: "button_controles", x: 250, y: 550, action: () => this.showScreen("controles") },
          { key: "button_credits",   x: 250, y: 650, action: () => this.showScreen("credits") }
        ]
      },
      mode: {
        bg: "screen_mode",
        buttons: [
          { key: "button_1joueur",  x: 640, y: 380, action: () => this.chooseMode(1) },
          { key: "button_2joueurs", x: 640, y: 470, action: () => this.chooseMode(2) },
          { key: "button_retour",   x: 640, y: 560, action: () => this.showScreen("welcome") }
        ]
      },
      story: {
        bg: "story_screen",
        buttons: [],
        onConfirm: () => this.startGame()
      },
      controles: {
        bg: "screen_controles",
        buttons: [
          { key: "button_retour", x: 640, y: 650, action: () => this.showScreen("welcome") }
        ]
      },
      credits: {
        bg: "screen_credits",
        buttons: [
          { key: "button_retour", x: 1000, y: 640, action: () => this.showScreen("welcome") }
        ]
      }
    };

    this.input.keyboard.on("keydown-UP", () => this.moveFocus(-1));
    this.input.keyboard.on("keydown-DOWN", () => this.moveFocus(1));
    this.input.keyboard.on("keydown-ENTER", () => this.confirm());

    this.showScreen("welcome");
  }

  showScreen(name) {
    this.objects.forEach(obj => obj.destroy());
    this.objects = [];
    this.buttons = [];
    this.currentScreen = name;
    this.index = 0;

    const screen = this.screens[name];

    const bg = this.add.image(0, 0, screen.bg).setOrigin(0);
    this.objects.push(bg);

    // Écran d'histoire : clic n'importe où pour continuer
    if (screen.onConfirm) {
      bg.setInteractive();
      bg.on("pointerdown", () => screen.onConfirm());
    }

    screen.buttons.forEach((cfg, i) => {
      const btn = this.add.image(cfg.x, cfg.y, cfg.key).setInteractive();
      btn.on("pointerover", () => { this.index = i; this.updateFocus(); });
      btn.on("pointerdown", () => cfg.action());
      this.buttons.push(btn);
      this.objects.push(btn);
    });

    this.updateFocus();
  }

  chooseMode(nbJoueurs) {
    this.mode = nbJoueurs;
    this.showScreen("story");
  }

  startGame() {
    if (this.mode === 2) { //compétitif : une des deux cartes au hasard
      const carte = Phaser.Utils.Array.GetRandom(["niveau1", "niveau2"]);
      this.scene.start(carte, { mode: 2 });
    } else { //histoire : niveau 1 puis niveau 2
      this.scene.start("niveau1", { mode: 1 });
    }
  }

  moveFocus(dir) {
    const n = this.buttons.length;
    if (n === 0) return;
    this.index = (this.index + dir + n) % n;
    this.updateFocus();
  }

  confirm() {
    const screen = this.screens[this.currentScreen];
    if (screen.onConfirm) {
      screen.onConfirm();
    } else if (this.buttons.length > 0) {
      screen.buttons[this.index].action();
    }
  }

  updateFocus() {
    this.buttons.forEach((btn, i) => {
      btn.setTint(i === this.index ? 0xffffff : 0x888888);
    });
  }
}