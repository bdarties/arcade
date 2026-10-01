import { ECRAN, POLICE_TITRE, POLICE_TEXTE } from "./reglages/config.js";
import { creerControles, boutonPresse } from "./reglages/controles.js";
import { formaterTemps } from "./fonctions.js";
import { jouerMusique } from "./systemes/sons.js";

export default class fin extends Phaser.Scene {
  constructor() {
    super({ key: "fin" });
  }

  init(bilan) {
    this.bilan = bilan;
  }

  create() {
    const cx = ECRAN.largeur / 2;
    const bilan = this.bilan;
    jouerMusique(this, "musique_fin");

    this.add.image(cx, ECRAN.hauteur / 2, "img_vignette").setDisplaySize(1700, 1100);
    this.add
      .text(cx, 120, "Les ténèbres ont tout englouti…", {
        fontFamily: POLICE_TITRE, fontSize: "50px", color: "#ffe2a8", stroke: "#000000", strokeThickness: 7
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 176, "Mais chaque nuit appelle une nouvelle aube.", { fontFamily: POLICE_TEXTE, fontSize: "22px", fontStyle: "italic", color: "#b9ae98" })
      .setOrigin(0.5);

    const lignes = [
      "Temps survécu : " + formaterTemps(bilan.temps),
      "Vague atteinte : " + bilan.vague,
      "Ombres vaincues : " + bilan.ennemisVaincus,
      "Score : " + bilan.score
    ];
    this.add
      .text(cx, 380, lignes.join("\n"), {
        fontFamily: POLICE_TEXTE, fontSize: "28px", color: "#f3e9d2", align: "center", lineSpacing: 10
      })
      .setOrigin(0.5);

    this.add
      .text(cx, ECRAN.hauteur - 80, "Bouton A : rejouer    ·    Bouton B : menu", {
        fontFamily: POLICE_TEXTE, fontSize: "24px", color: "#ffffff"
      })
      .setOrigin(0.5);

    this.input.keyboard.resetKeys();
    this.controlesJ1 = creerControles(this, 1);
    this.controlesJ2 = creerControles(this, 2);

    this.time.delayedCall(30000, () => this.scene.start("menu"));
    this.cameras.main.fadeIn(800);
  }

  update() {
    if (boutonPresse(this.controlesJ1, this.controlesJ2, "A")) {
      this.scene.start("jeu", { nbJoueurs: this.bilan.nbJoueurs });
    } else if (boutonPresse(this.controlesJ1, this.controlesJ2, "B")) {
      this.scene.start("menu");
    }
  }
}
