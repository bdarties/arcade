import { ECRAN, POLICE_TITRE, POLICE_TEXTE } from "./reglages/config.js";
import { creerControles, boutonPresse } from "./reglages/controles.js";

export default class pause extends Phaser.Scene {
  constructor() {
    super({ key: "pause" });
  }

  create() {
    const cx = ECRAN.largeur / 2;
    this.add.rectangle(0, 0, ECRAN.largeur, ECRAN.hauteur, 0x05030c, 0.9).setOrigin(0);
    this.add
      .text(cx, 340, "PAUSE", { fontFamily: POLICE_TITRE, fontSize: "64px", color: "#ffe2a8", stroke: "#000000", strokeThickness: 7 })
      .setOrigin(0.5);
    this.add
      .text(cx, 440, "Bouton A : reprendre    ·    Bouton B : menu", { fontFamily: POLICE_TEXTE, fontSize: "24px", color: "#ffffff" })
      .setOrigin(0.5);

    this.input.keyboard.resetKeys();
    this.controlesJ1 = creerControles(this, 1);
    this.controlesJ2 = creerControles(this, 2);
  }

  update() {
    if (boutonPresse(this.controlesJ1, this.controlesJ2, "A")) {
      this.scene.resume("jeu");
      this.scene.stop();
    } else if (boutonPresse(this.controlesJ1, this.controlesJ2, "B")) {
      this.scene.stop("jeu");
      this.scene.start("menu");
    }
  }
}
