import { TOUCHES } from "./touches.js";

export default class Game_over extends Phaser.Scene {
  constructor() {
    super({
      key: "Game_over"
    });
  }

  init(data) {
    this.donnees = data || {}; // { raison, niveau, scoreJ1, scoreJ2, deux_joueurs }
  }

  preload() {
    // Chargement de l'image de fond du Game Over
    this.load.image("screen_game_over", "./assets/screen_game_over.png");
  }

  create() {
    const { raison, niveau, scoreJ1, scoreJ2, deux_joueurs } = this.donnees;

    // 1. Image de fond pleine écran (1280 x 720)
    this.add.image(0, 0, "screen_game_over").setOrigin(0, 0);

    const style = (taille, couleur = "#ffffff") => ({
      fontFamily: "Arial, sans-serif",
      fontSize: taille + "px",
      color: couleur,
      align: "center",
      stroke: "#000000",
      strokeThickness: 4
    });

    // 2. Affichage des détails et du score sous l'encadré rouge
    let detail = "Le joueur est tombé au combat...";
    if (raison === "temps") {
      detail = "Le temps s'est écoulé...";
    } else if (raison === "vie_J1") {
      detail = deux_joueurs ? "Le Joueur 1 a perdu la partie..." : detail;
    } else if (raison === "vie_J2") {
      detail = "Le Joueur 2 a perdu la partie...";
    }

    this.add.text(640, 480, detail, style(22, "#aaaaaa")).setOrigin(0.5);

    const texte_score = deux_joueurs
      ? `Score Joueur 1 : ${scoreJ1 ?? 0}   -   Score Joueur 2 : ${scoreJ2 ?? 0}`
      : `Score Final : ${scoreJ1 ?? 0}`;
    this.add.text(640, 520, texte_score, style(28, "#ff3b3b")).setOrigin(0.5);

    // 3. Navigation / Boutons sous forme de texte interactif
    const rejouer = this.add.text(640, 580, "I / R : Rejouer le niveau", style(24, "#f1c489"))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const menu = this.add.text(640, 630, "K / F : Retour au menu principal", style(24, "#f1c489"))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    const relancer = () => this.scene.start(niveau || "niveau1", { mode: deux_joueurs ? 2 : 1 });
    const retour_menu = () => this.scene.start("Menu");

    rejouer.on("pointerdown", relancer);
    menu.on("pointerdown", retour_menu);

    // Évite la validation accidentelle si une touche était maintenue lors du Game Over
    this.time.delayedCall(700, () => {
      let choisi = false;
      const une_fois = (action) => () => { if (!choisi) { choisi = true; action(); } };
      TOUCHES.valider.forEach((t) => this.input.keyboard.on("keydown-" + t, une_fois(relancer)));
      TOUCHES.retour.forEach((t) => this.input.keyboard.on("keydown-" + t, une_fois(retour_menu)));
    });
  }
}