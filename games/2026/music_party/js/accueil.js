import { creerTouches, unJoueurAppuie } from "./controles.js";
import { jouerSon, lancerMusique } from "./sons.js";
import { aideBas } from "./interface.js";

// écran titre de Music Party : on attend qu'un joueur appuie sur A
export default class accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  create() {
    this.touches = creerTouches(this);
    this.depart = false;

    this.add.image(0, 0, "img_fond_accueil").setOrigin(0);

    aideBas(this, [["a", "Commencer"], ["b", "Crédits"]], 655);
    lancerMusique(this);
    this.cameras.main.fadeIn(400);
  }

  update() {
    if (this.depart) return;
    if (unJoueurAppuie(this.touches, "a")) {
      this.depart = true;
      jouerSon(this, "valider");
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => this.scene.start("selection"));
    } else if (unJoueurAppuie(this.touches, "b")) {
      this.depart = true;
      jouerSon(this, "valider");
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => this.scene.start("credits"));
    }
  }
}
