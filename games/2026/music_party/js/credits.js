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

    fondAssombri(this, "img_fond_accueil", 0.6);
    this.add.text(640, 62, "CRÉDITS", style(64, OR)).setOrigin(0.5);

    // la feuille de programme, comme pour les règles : titre rouge, texte sombre
    var feuille = this.add.image(640, 372, "ui_regles");
    feuille.scaleX = 860 / feuille.width;
    feuille.scaleY = 520 / feuille.height;
    this.add.text(640, 240, "Music Party", style(48, "#7b2830", 0)).setOrigin(0.5);
    this.add.text(640, 292, "Réalisé par", styleTexte(26, "#7b2830")).setOrigin(0.5);
    this.add.text(640, 388, EQUIPE.join("\n"), { ...styleTexte(28, "#46282c"), lineSpacing: 8 }).setOrigin(0.5);
    this.add
      .text(640, 516, "Musique : airs du domaine public (Beethoven, Rossini, Offenbach)\nMoteur de jeu : Phaser 3", { ...styleTexte(22, "#46282c"), lineSpacing: 8 })
      .setOrigin(0.5);

    aideBas(this, [["b", "Retour"]]);
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
