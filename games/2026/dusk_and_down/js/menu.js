import { ECRAN, POLICE_TITRE, POLICE_TEXTE } from "./reglages/config.js";
import { creerControles, boutonPresse } from "./reglages/controles.js";
import { initialiserSons, jouerMusique, jouerSon } from "./systemes/sons.js";

export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  create() {
    const cx = ECRAN.largeur / 2;

    this.add.image(cx, ECRAN.hauteur / 2, "menu_fond");
    this.add.rectangle(cx, 514, 340, 276, 0x0b0910).setStrokeStyle(2, 0x6b5a3a);
    this.add
      .text(cx, 418, "DUSK AND DAWN", { fontFamily: POLICE_TITRE, fontSize: "30px", color: "#ffe2a8", stroke: "#000000", strokeThickness: 5 })
      .setOrigin(0.5);

    this.options = [
      { texte: "1 JOUEUR", nbJoueurs: 1 },
      { texte: "2 JOUEURS", nbJoueurs: 2 }
    ];
    this.textesOptions = this.options.map((option, i) =>
      this.add
        .text(cx, 492 + i * 56, option.texte, { fontFamily: POLICE_TITRE, fontSize: "32px", color: "#8c8577", stroke: "#000000", strokeThickness: 5 })
        .setOrigin(0.5)
    );
    this.selection = 0;
    this.afficherSelection();

    this.add
      .text(cx, 618, "Joystick : choisir  ·  Bouton A : commencer", { fontFamily: POLICE_TEXTE, fontSize: "15px", color: "#e8dcc0" })
      .setOrigin(0.5);
    this.add
      .text(cx, ECRAN.hauteur - 12, "Assets : Undead Tileset (CraftPix) · Chevalier (Szadi art) · Tiny RPG · Pixel Art Top Down (Cainos) · Catacombs · VFX packs", {
        fontFamily: POLICE_TEXTE, fontSize: "12px", color: "#8a8272"
      })
      .setOrigin(0.5);

    this.input.keyboard.resetKeys();
    this.controlesJ1 = creerControles(this, 1);
    this.controlesJ2 = creerControles(this, 2);
    initialiserSons(this);
    jouerMusique(this, "musique_menu");
    this.cameras.main.fadeIn(800);
  }

  update() {
    if (boutonPresse(this.controlesJ1, this.controlesJ2, "haut")) {
      this.selection = (this.selection + this.options.length - 1) % this.options.length;
      this.afficherSelection();
    }
    if (boutonPresse(this.controlesJ1, this.controlesJ2, "bas")) {
      this.selection = (this.selection + 1) % this.options.length;
      this.afficherSelection();
    }
    if (boutonPresse(this.controlesJ1, this.controlesJ2, "A")) {
      initialiserSons(this);
      jouerSon("choix");
      this.scene.start("jeu", { nbJoueurs: this.options[this.selection].nbJoueurs });
    }
  }

  afficherSelection() {
    jouerSon("curseur");
    this.textesOptions.forEach((texte, i) => {
      const choisi = i === this.selection;
      texte.setColor(choisi ? "#ffe2a8" : "#8c8577");
      texte.setText((choisi ? "✦  " : "") + this.options[i].texte + (choisi ? "  ✦" : ""));
      texte.setScale(choisi ? 1.08 : 1);
    });
  }
}
