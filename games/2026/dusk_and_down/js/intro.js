import { ECRAN, POLICE_TEXTE } from "./reglages/config.js";
import { creerControles, boutonPresse } from "./reglages/controles.js";
import { jouerMusique } from "./systemes/sons.js";

export default class intro extends Phaser.Scene {
  constructor() {
    super({ key: "intro" });
  }

  create() {
    this.numero = 1;
    this.image = this.add.image(ECRAN.largeur / 2, ECRAN.hauteur / 2, "intro_1");
    this.add
      .text(ECRAN.largeur - 16, 16, "A : passer", { fontFamily: POLICE_TEXTE, fontSize: "18px", color: "#8a8272" })
      .setOrigin(1, 0);

    this.input.keyboard.resetKeys();
    this.controlesJ1 = creerControles(this, 1);
    this.controlesJ2 = creerControles(this, 2);
    jouerMusique(this, "musique_menu");

    this.cameras.main.fadeIn(800);
    this.time.addEvent({ delay: 5000, loop: true, callback: () => this.imageSuivante() });
  }

  update() {
    if (boutonPresse(this.controlesJ1, this.controlesJ2, "A")) {
      this.scene.start("menu");
    }
  }

  imageSuivante() {
    this.numero += 1;
    if (this.numero > 6) {
      this.scene.start("menu");
      return;
    }
    this.image.setTexture("intro_" + this.numero);
    this.cameras.main.fadeIn(800);
  }
}
