import { BORNE, creerTouches, uneTouchePressee } from "./outils.js";

export default class classement extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "classement" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }

  preload() {
    //TODO : Remplacer tous les chemin absolus en chemins relatifs
    // Background
    this.load.image("classement_bg", "src/bg/classement_bg.png");
    this.load.image("retour_button", "src/button/retour.png");
  }

  create() {
    this.add
      .image(0, 0, "classement_bg")
      .setOrigin(0)
      .setDepth(0);

    // Bouton Classement
    var bouton_play = this.add.image(640, 500, "retour_button").setDepth(1); // TODO : Replacer le bouton en fonction du visuel qu'on va créer

    bouton_play.setInteractive();

    bouton_play.on("pointerover", () => {
      bouton_play.setScale(1.1);
    });

    bouton_play.on("pointerout", () => {
      bouton_play.setScale(1);
    });

    bouton_play.on("pointerup", () => {
      this.scene.start("menu"); // on retourne au menu.js
    });


    // --- RETOUR AU MENU AVEC LES BOUTONS DE LA BORNE ---

    this.pret = false;   // faux pendant 0,5 s : on ignore l'appui qui nous a amenés ici

    this.time.delayedCall(500, () => {
      this.pret = true;
    });

    this.touchesRetour = creerTouches(this, BORNE.j1.boutons.concat(BORNE.j2.boutons));

  }

  // update() est appelée environ 60 fois par seconde
  update() {

    // On lit TOUJOURS les touches, pour "consommer" les appuis
    const retour = uneTouchePressee(this.touchesRetour);

    if (retour && this.pret) {
      this.scene.start("menu");
    }
  }
}