import { INTRO } from "./histoire_data.js";

// Écran principal : navigation au clavier et accès aux différents modes.
export default class accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("fond_accueil", "./assets/ecrans/acceuil.png");
    this.load.audio("musique_menu", "./assets/musique/menu.mp3");

    this.load.image("button_play", "./assets/boutton/button_play.png");
    this.load.image("button_fight", "./assets/boutton/button_fight.png");
    this.load.image("button_controls", "./assets/boutton/button_controls.png");
    this.load.image("button_credits", "./assets/boutton/button_credits.png");
  }

  // Crée le fond, les entrées du menu et leur navigation.
  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    this.baseScale = 0.36;
    this.zoomScale = this.baseScale * 1.12;

    this.add
      .image(w / 2, h / 2, "fond_accueil")
      .setDisplaySize(w, h)
      .setDepth(-1);

    const colX = w * 0.75;
    const startY = 330;
    const espacementY = 102;

    this.boutons = [
      {
        sprite: this.creerBouton(colX, startY, "button_play"),
        action: () => this.scene.start("histoire", { slides: INTRO, suite: "exterieur", suiteData: {} })
      },
      {
        sprite: this.creerBouton(colX, startY + espacementY, "button_fight"),
        action: () => this.scene.start("versus")
      },
      {
        sprite: this.creerBouton(colX, startY + espacementY * 2, "button_controls"),
        action: () => this.scene.start("controls")
      },
      {
        sprite: this.creerBouton(colX, startY + espacementY * 3, "button_credits"),
        action: () => this.scene.start("credits")
      }
    ];

    this.indexSelection = 0;
    this.majSelection();

    const descendre = () => {
      this.indexSelection = (this.indexSelection + 1) % this.boutons.length;
      this.majSelection();
    };
    const monter = () => {
      this.indexSelection = (this.indexSelection - 1 + this.boutons.length) % this.boutons.length;
      this.majSelection();
    };
    const valider = () => {
      this.boutons[this.indexSelection].action();
    };

    this.input.keyboard.on("keydown-DOWN", descendre);
    this.input.keyboard.on("keydown-UP", monter);

    ["I", "O", "K"].forEach((touche) => {
      this.input.keyboard.on(`keydown-${touche}`, valider);
    });

    let musique =
      this.sound.get("musique_menu") || this.sound.add("musique_menu", { loop: true, volume: 0.5 });
    if (!musique.isPlaying) musique.play();
  }

  // Crée un bouton à l'échelle normale du menu.
  creerBouton(x, y, cleImage) {
    return this.add
      .image(x, y, cleImage)
      .setOrigin(0.5)
      .setScale(this.baseScale);
  }

  // Applique le zoom et la teinte au bouton actuellement sélectionné.
  majSelection() {
    this.boutons.forEach((item, index) => {
      if (index === this.indexSelection) {
        item.sprite.setScale(this.zoomScale);
        item.sprite.setTint(0xffcccc);
        item.sprite.setDepth(1);
      } else {
        item.sprite.setScale(this.baseScale);
        item.sprite.clearTint();
        item.sprite.setDepth(0);
      }
    });
  }
}