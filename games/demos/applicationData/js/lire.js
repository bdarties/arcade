import { FONT, ACTION_KEYS, titre, lireListe } from "./common.js";

const PAR_PAGE = 10;

export default class Lire extends Phaser.Scene {
  constructor() {
    super("lire");
  }

  async create() {
    titre(this, "Données enregistrées");
    this.liste = [];
    this.page = 0;
    this.texte = this.add.text(240, 140, "Chargement...", { fontFamily: "monospace", fontSize: "30px", color: "#ffffff" });
    this.add
      .text(640, 670, "Haut/Bas : défiler  |  Action ou Gauche : retour", {
        fontFamily: FONT, fontSize: "22px", color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.input.keyboard.on("keydown", (e) => {
      const k = e.key.toLowerCase();
      const pages = Math.max(1, Math.ceil(this.liste.length / PAR_PAGE));
      if (k === "arrowdown") this.page = Math.min(pages - 1, this.page + 1);
      else if (k === "arrowup") this.page = Math.max(0, this.page - 1);
      else if (k === "arrowleft" || ACTION_KEYS.includes(k)) return this.scene.start("menu");
      this.afficher();
    });

    this.liste = await lireListe();
    this.afficher();
  }

  afficher() {
    if (!this.liste.length) {
      this.texte.setText("Aucune donnée.");
      return;
    }
    const debut = this.page * PAR_PAGE;
    const lignes = this.liste
      .slice(debut, debut + PAR_PAGE)
      .map((d) => `${String(d.prenom).padEnd(13)}${String(d.nom).padEnd(13)}${d.score}`);
    const pages = Math.ceil(this.liste.length / PAR_PAGE);
    this.texte.setText(lignes.join("\n") + `\n\nPage ${this.page + 1}/${pages}`);
  }
}
