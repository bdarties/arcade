import { TOUCHES } from "./touches.js";

// Palette tirée de l'image screen_game_over.png
const POLICE = '"Courier New", Courier, monospace';
const ROUGE = 0xff2d4d;
const FOND_PANNEAU = 0x14081a;
const TEXTE_ROSE = "#f1b0a8";
const TEXTE_ROUGE = "#ff4d6d";
const COULEUR_J1 = "#3bd5f0";
const COULEUR_J2 = "#ff8c42";

export default class Game_over extends Phaser.Scene {
  constructor() {
    super({ key: "Game_over" });
  }

  init(data) {
    this.donnees = data || {}; // { raison, niveau, scoreJ1, scoreJ2, deux_joueurs }
  }

  preload() {
    this.load.image("screen_game_over", "./assets/screen_game_over.png");
  }

  create() {
    this.sound.stopAll();
    this.sound.add("Musique_Game_Over").play({ loop: true });
    const { raison, niveau, scoreJ1, scoreJ2, deux_joueurs } = this.donnees;

    this.add.image(0, 0, "screen_game_over").setOrigin(0, 0);
    this.cameras.main.fadeIn(500);

    const texte = (x, y, contenu, taille, couleur) => this.add.text(x, y, contenu, {
      fontFamily: POLICE,
      fontSize: taille + "px",
      fontStyle: "bold",
      color: couleur,
      align: "center",
      stroke: "#1a0008",
      strokeThickness: 4
    }).setOrigin(0.5);

    const cadre = (x, y, largeur, hauteur) => {
      this.add.rectangle(x, y, largeur, hauteur, FOND_PANNEAU, 0.85)
        .setStrokeStyle(3, ROUGE, 0.95);
      this.add.rectangle(x, y, largeur - 12, hauteur - 12)
        .setStrokeStyle(1, ROUGE, 0.45);
    };

    const compteur = (cible, score) => {
      const valeur = { v: 0 };
      this.tweens.add({
        targets: valeur,
        v: score,
        duration: 900,
        delay: 400,
        ease: "Cubic.easeOut",
        onUpdate: () => cible.setText(String(Math.round(valeur.v)))
      });
    };

    // Scores
    if (deux_joueurs) {
      const panneau = (x, titre, couleurTitre, score) => {
        cadre(x, 570, 400, 90);
        texte(x, 548, titre, 16, couleurTitre);
        const valeur = texte(x, 586, "0", 34, TEXTE_ROUGE);
        compteur(valeur, score ?? 0);
      };
      panneau(400, "JOUEUR 1", COULEUR_J1, scoreJ1);
      panneau(880, "JOUEUR 2", COULEUR_J2, scoreJ2);
    } else {
      cadre(640, 570, 460, 80);
      texte(640, 550, "SCORE FINAL", 16, TEXTE_ROSE);
      const valeur = texte(640, 584, "0", 34, TEXTE_ROUGE);
      compteur(valeur, scoreJ1 ?? 0);
    }

    // "Rejouer" en bas à gauche, "Retour" en rouge en bas à droite
    const rejouer = texte(200, 685, "I | R : Rejouer", 22, "#f1c489")
      .setInteractive({ useHandCursor: true });
    rejouer.on("pointerover", () => rejouer.setColor("#ffffff"));
    rejouer.on("pointerout", () => rejouer.setColor("#f1c489"));

    const menu = texte(1080, 685, "K | F : Retour", 22, TEXTE_ROUGE)
      .setInteractive({ useHandCursor: true });
    menu.on("pointerover", () => menu.setColor("#ffffff"));
    menu.on("pointerout", () => menu.setColor(TEXTE_ROUGE));

    const relancer = () => this.scene.start(niveau || "niveau1", { mode: deux_joueurs ? 2 : 1 });
    const retour_menu = () => this.scene.start("Menu");

    rejouer.on("pointerdown", relancer);
    menu.on("pointerdown", retour_menu);

    this.time.delayedCall(700, () => {
      let choisi = false;
      const une_fois = (action) => () => { if (!choisi) { choisi = true; action(); } };
      TOUCHES.valider.forEach((t) => this.input.keyboard.on("keydown-" + t, une_fois(relancer)));
      TOUCHES.retour.forEach((t) => this.input.keyboard.on("keydown-" + t, une_fois(retour_menu)));
    });
  }
}