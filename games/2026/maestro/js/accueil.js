// ============================================================================
//  js/accueil.js — ÉCRAN D'ACCUEIL : le titre MAESTRO + le bouton PLAY
//
//  Commandes : bouton A (I ou R), Entrée ou Espace pour valider.
// ============================================================================

import { creerClavierMenu } from "./controles.js";

// La scène qui s'ouvre quand on appuie sur PLAY
const SCENE_SUIVANTE = "choix_mode";

export default class accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  create() {
    // create() est rappelée à chaque retour sur l'accueil : on remet tout à zéro
    this.enTransition = false;
    this.clavier = creerClavierMenu(this);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Le fond : l'image du titre (1280 x 720, on la centre)
    this.add.image(640, 360, "img_accueil");

    // ---- Le bouton PLAY : un rectangle arrondi + un texte, dans un conteneur ----
    const cadre = this.add.graphics();
    cadre.fillStyle(0x0b1030, 0.88).fillRoundedRect(-150, -42, 300, 84, 18);
    cadre.lineStyle(5, 0xf5d97a).strokeRoundedRect(-150, -42, 300, 84, 18);
    const texte = this.add
      .text(0, 0, "PLAY", {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: "40pt",
        fontStyle: "bold",
        color: "#f5d97a",
        stroke: "#000000",
        strokeThickness: 5
      })
      .setOrigin(0.5);
    this.bouton = this.add.container(640, 622, [cadre, texte]);

    // Petite animation : le bouton "respire" pour montrer qu'on peut appuyer dessus
    this.tweens.add({
      targets: this.bouton,
      scale: 1.07,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Rappel des commandes en bas de l'écran
    this.add
      .text(640, 692, "Bouton A / Entrée pour jouer", {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: "14pt",
        color: "#dfe6ff",
        stroke: "#000000",
        strokeThickness: 4
      })
      .setOrigin(0.5);
  }

  update() {
    if (this.enTransition == true) {
      return;
    }
    if (this.clavier.presse("valider")) {
      this.lancerLeJeu();
    }
  }

  // Fondu au noir, puis on ouvre la scène suivante
  lancerLeJeu() {
    this.enTransition = true; // empêche de valider deux fois
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(SCENE_SUIVANTE);
    });
  }
}
