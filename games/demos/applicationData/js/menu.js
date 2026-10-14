import { FONT, ACTION_KEYS, titre } from "./common.js";

const CHOIX = [
  { label: "Ajouter une donnée", scene: "ajouter" },
  { label: "Lire les données", scene: "lire" },
];

export default class Menu extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    titre(this, "Application Data");
    this.index = 0;
    this.textes = CHOIX.map((c, i) =>
      this.add.text(640, 300 + i * 90, c.label, { fontFamily: FONT, fontSize: "36px", color: "#ffffff" }).setOrigin(0.5)
    );
    this.maj();
    this.input.keyboard.on("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "arrowdown") {
        this.index = (this.index + 1) % CHOIX.length;
        this.maj();
      } else if (ACTION_KEYS.includes(k)) {
        this.scene.start(CHOIX[this.index].scene);
      }
    });
  }

  maj() {
    this.textes.forEach((t, i) => {
      const sel = i === this.index;
      t.setColor(sel ? "#ffd400" : "#888888");
      t.setText((sel ? "> " : "") + CHOIX[i].label + (sel ? " <" : ""));
    });
  }
}
