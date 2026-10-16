import { TOUCHES } from "./touches.js";

// Écran de victoire du mode 1 joueur : affiché quand le joueur passe la porte de la dernière carte.
const POLICE = '"Courier New", Courier, monospace';

export default class Win_screen extends Phaser.Scene {
  constructor() {
    super({ key: "Win_screen" });
  }

  init(data) {
    this.donnees = data || {}; // { scoreJ1, mode }
  }

  preload() {
    this.load.image("win_screen", "./assets/win_screen.png");
    this.load.audio("Musique_Victoire", "./assets/musique_et_sons/Musique_Victoire.mp3");
  }

  create() {
    const { scoreJ1 } = this.donnees;
    this.sound.stopAll();
    this.sound.add("Musique_Victoire").play();
    this.cameras.main.setBackgroundColor("#101018");
    this.cameras.main.fadeIn(500);

    // l'image est carrée (600x595) : on l'agrandit à la hauteur de l'écran et on la centre
    const image = this.add.image(640, 360, "win_screen");
    image.setScale(720 / image.height);

    const texte = (x, y, contenu, taille, couleur) => this.add.text(x, y, contenu, {
      fontFamily: POLICE,
      fontSize: taille + "px",
      fontStyle: "bold",
      color: couleur,
      align: "center",
      stroke: "#0a0614",
      strokeThickness: 4
    }).setOrigin(0.5);

    texte(1040, 330, "SCORE", 24, "#fff4dc");
    texte(1040, 380, String(scoreJ1 ?? 0), 48, "#f1c489");

    const rejouer = texte(1040, 560, "I | R : Rejouer", 22, "#f1c489")
      .setInteractive({ useHandCursor: true });
    const menu = texte(1040, 610, "K | F : Menu", 22, "#f1c489")
      .setInteractive({ useHandCursor: true });
    [rejouer, menu].forEach((t) => {
      t.on("pointerover", () => t.setColor("#ffffff"));
      t.on("pointerout", () => t.setColor("#f1c489"));
    });

    const relancer = () => this.scene.start("niveau1", { mode: 1 });
    const retour_menu = () => this.scene.start("Menu");
    rejouer.on("pointerdown", relancer);
    menu.on("pointerdown", retour_menu);

    // petit délai : évite de passer l'écran par erreur si le joueur appuie encore sur ses boutons
    this.time.delayedCall(700, () => {
      let choisi = false;
      const une_fois = (action) => () => { if (!choisi) { choisi = true; action(); } };
      TOUCHES.valider.forEach((t) => this.input.keyboard.on("keydown-" + t, une_fois(relancer)));
      TOUCHES.retour.forEach((t) => this.input.keyboard.on("keydown-" + t, une_fois(retour_menu)));
    });
  }
}