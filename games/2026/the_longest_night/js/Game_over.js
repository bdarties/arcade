import { TOUCHES } from "./touches.js";

// Palette tirée de l'image screen_game_over.png (rouge néon, rose pâle, fond bordeaux très sombre)
const POLICE = '"Courier New", Courier, monospace';
const ROUGE = 0xff2d4d;
const FOND_PANNEAU = 0x14081a;
const TEXTE_ROSE = "#f1b0a8";
const TEXTE_ROUGE = "#ff4d6d";
const COULEUR_J1 = "#3bd5f0"; // mêmes couleurs que le HUD / l'écran de score
const COULEUR_J2 = "#ff8c42";

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
    this.load.audio("Musique_Game_Over", "./assets/musique_et_sons/Musique_Game_Over.mp3");
  }

  create() {
    this.sound.stopAll();
    this.sound.add("Musique_Game_Over").play({ loop: true });
    const { raison, niveau, scoreJ1, scoreJ2, deux_joueurs } = this.donnees;

    // 1. Image de fond pleine écran (1280 x 720) + petit fondu à l'arrivée
    this.add.image(0, 0, "screen_game_over").setOrigin(0, 0);
    this.cameras.main.fadeIn(500);

    // petit utilitaire : texte dans le style de l'écran (police pixel/arcade, contour sombre)
    const texte = (x, y, contenu, taille, couleur) => this.add.text(x, y, contenu, {
      fontFamily: POLICE,
      fontSize: taille + "px",
      fontStyle: "bold",
      color: couleur,
      align: "center",
      stroke: "#1a0008",
      strokeThickness: 4
    }).setOrigin(0.5);

// Fonction pour créer l'encadré rouge
const cadre = (x, y, largeur, hauteur) => {
  this.add.rectangle(
    x, y, largeur, hauteur,
    FOND_PANNEAU, 0.85
  ).setStrokeStyle(3, ROUGE, 0.95);

  this.add.rectangle(
    x, y, largeur - 12, hauteur - 12
  ).setStrokeStyle(1, ROUGE, 0.45);
};

// Fonction pour animer le score
const compteur = (cible, score) => {
  const valeur = { v: 0 };

  this.tweens.add({
    targets: valeur,
    v: score,
    duration: 900,
    delay: 400,
    ease: "Cubic.easeOut",
    onUpdate: () => {
      cible.setText(String(Math.round(valeur.v)));
    }
  });
};

// SCORE FINAL (1 joueur)
cadre(640, 602, 460, 74);

texte(640, 582, "SCORE FINAL", 16, TEXTE_ROSE);

const valeur = texte(640, 616, "0", 34, TEXTE_ROUGE);

compteur(valeur, scoreJ1 ?? 0);
}
}