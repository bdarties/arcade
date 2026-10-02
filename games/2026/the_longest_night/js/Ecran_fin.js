import * as fct from "./fonctions.js";

export default class Ecran_fin extends Phaser.Scene {
  constructor() {
    super({
      key: "Ecran_fin"
    });
  }

  init(data) {
    this.resultats = data || {};
  }

  create() {
    const { gagnant, temps_restant, cles_recuperees } = this.resultats;
    let scoreJ1 = Number(this.resultats.scoreJ1) || 0;
    let scoreJ2 = Number(this.resultats.scoreJ2) || 0;
    const bonusTemps = Math.max(0, Number(temps_restant) || 0) * 2;
    const multiplicateurCles = Math.max(0, Number(cles_recuperees) || 0) + 1;

    if (gagnant === "Joueur 1") {
      scoreJ1 += bonusTemps;
    } else if (gagnant === "Joueur 2") {
      scoreJ2 += bonusTemps;
    }

    scoreJ1 *= multiplicateurCles;
    scoreJ2 *= multiplicateurCles;

    this.add.text(
      640,
      240,
      `Niveau terminé\n\nJoueur 1 : ${scoreJ1}\nJoueur 2 : ${scoreJ2}`,
      {
        fontSize: "40px",
        color: "#ffffff",
        align: "center"
      }
    ).setOrigin(0.5);
  }
}



