// ============================================================================
//  js/niveau_termine.js — ÉCRAN « NIVEAU TERMINÉ »
//
//  Affiché quand les joueurs franchissent la porte de sortie du niveau 1.
//  (Pour la démo : on utilise l'image de victoire. Plus tard, cette scène
//   enchaînera vers le lobby puis le niveau 2.)
// ============================================================================

import { creerClavierMenu } from "./controles.js";

const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';
const SCENE_SUIVANTE = "accueil";

export default class niveau_termine extends Phaser.Scene {
  constructor() {
    super({ key: "niveau_termine" });
  }

  create() {
    this.enTransition = false;
    this.clavier = creerClavierMenu(this);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add.image(640, 360, "img_victoire");

    // Bandeau sombre en bas pour que le texte reste lisible sur l'image
    this.add.rectangle(640, 640, 1280, 160, 0x000010, 0.78);

    this.add
      .text(640, 612, "NIVEAU 1 TERMINÉ !", {
        fontFamily: POLICE,
        fontSize: "34pt",
        fontStyle: "bold",
        color: "#f5d97a",
        stroke: "#000000",
        strokeThickness: 6
      })
      .setOrigin(0.5);

    // Le fragment de partition gagné
    this.add.image(300, 612, "img_partition").setDisplaySize(56, 56);
    this.add
      .text(640, 662, "Fragment de partition : 1 / 3", {
        fontFamily: POLICE,
        fontSize: "16pt",
        color: "#dfe6ff",
        stroke: "#000000",
        strokeThickness: 4
      })
      .setOrigin(0.5);

    this.add
      .text(640, 696, "Bouton A / Entrée : retour à l'accueil", {
        fontFamily: POLICE,
        fontSize: "13pt",
        color: "#aab4e0",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(0.5);
  }

  update() {
    if (this.enTransition == false && this.clavier.presse("valider")) {
      this.enTransition = true;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start(SCENE_SUIVANTE);
      });
    }
  }
}
