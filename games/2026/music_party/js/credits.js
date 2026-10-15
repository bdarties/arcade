import { creerTouches, unJoueurAppuie } from "./controles.js";
import { jouerSon, lancerMusique } from "./sons.js";
import { style, styleTexte, fondAssombri, aideBas, OR } from "./interface.js";

// Page des crédits : ouverte depuis l'écran titre avec B, fermée avec B (ou A).
const EQUIPE = ["Bouaziz Mohamed", "Redares Ambre", "Lamaud Laetitia", "Nasri Alix"];

export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
  }

  create() {
    this.touches = creerTouches(this);
    this.depart = false;

    fondAssombri(this, "img_fond_accueil", 0.8);
    this.add.text(640, 90, "CRÉDITS", style(60, OR, 10)).setOrigin(0.5);
    this.add.text(640, 150, "Music Party", styleTexte(26)).setOrigin(0.5);

    this.add
      .text(640, 300, "Réalisé par\n\n" + EQUIPE.join("\n"), { ...styleTexte(26), lineSpacing: 10 })
      .setOrigin(0.5, 0.5);

    this.add
      .text(640, 500, "Musique : airs du domaine public (Beethoven, Rossini, Offenbach)\nMoteur de jeu : Phaser 3", { ...styleTexte(18, "#ffe9a8"), lineSpacing: 8 })
      .setOrigin(0.5);

    aideBas(this, "B : retour à l'écran titre");
    lancerMusique(this);
    this.cameras.main.fadeIn(300);
  }

  update() {
    if (this.depart) return;
    if (unJoueurAppuie(this.touches, "b") || unJoueurAppuie(this.touches, "a")) {
      this.depart = true;
      jouerSon(this, "retour");
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => this.scene.start("accueil"));
    }
  }
}
