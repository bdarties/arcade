import { INTRO } from "./histoire_data.js";

export default class accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("fond_accueil", "./assets/ecrans/acceuil.png");
    this.load.audio("musique_menu", "./assets/musique/menu.mp3");

    // Chargement des boutons depuis ./assets/boutton/
    this.load.image("button_play", "./assets/boutton/button_play.png");
    this.load.image("button_fight", "./assets/boutton/button_fight.png");
    this.load.image("button_controls", "./assets/boutton/button_controls.png");
    this.load.image("button_credits", "./assets/boutton/button_credits.png");
  }

  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    // 500x250 * 0.36 = 180x90 px par bouton
    this.baseScale = 0.36;
    this.zoomScale = this.baseScale * 1.12; // Léger zoom quand sélectionné

    // fond : derrière tout le reste
    this.add
      .image(w / 2, h / 2, "fond_accueil")
      .setDisplaySize(w, h)
      .setDepth(-1);

    // Placement remonté sous le titre et espacé pour la nouvelle taille
    const colX = w * 0.75;
    const startY = 330; // Remonté pour combler le vide sous le titre
    const espacementY = 102; // 90px de bouton + 12px d'écart entre chaque

    // Création des boutons et de leurs actions respectives
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

    // Sélection par défaut sur le premier bouton (PLAY = index 0)
    this.indexSelection = 0;
    this.majSelection();

    // Fonctions de navigation
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

    // Contrôles borne d'arcade : Sticks J1 (UP/DOWN) et J2 (Z/S) pour naviguer
    this.input.keyboard.on("keydown-DOWN", descendre);
    this.input.keyboard.on("keydown-S", descendre);
    this.input.keyboard.on("keydown-UP", monter);
    this.input.keyboard.on("keydown-Z", monter);

    // Boutons A, B, D (J1 : I, O, K | J2 : R, T, F) + SPACE/ENTER pour valider
    ["I", "O", "K", "R", "T", "F", "SPACE", "ENTER"].forEach((touche) => {
      this.input.keyboard.on(`keydown-${touche}`, valider);
    });

    // musique du menu : si elle joue déjà (retour depuis contrôles/crédits), on ne la relance pas
    let musique =
      this.sound.get("musique_menu") || this.sound.add("musique_menu", { loop: true, volume: 0.5 });
    if (!musique.isPlaying) musique.play();
  }

  // Crée l'image du bouton à l'échelle de base
  creerBouton(x, y, cleImage) {
    return this.add
      .image(x, y, cleImage)
      .setOrigin(0.5)
      .setScale(this.baseScale);
  }

  // Met à jour l'apparence des boutons selon celui qui est sélectionné
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