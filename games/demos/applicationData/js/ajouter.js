import { FONT, ACTION_KEYS, titre, ajouterEntree } from "./common.js";

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHIFFRES = "0123456789";
const CHAMPS = [
  { cle: "prenom", label: "Prénom", alphabet: LETTRES, max: 12 },
  { cle: "nom", label: "Nom", alphabet: LETTRES, max: 12 },
  { cle: "score", label: "Score", alphabet: CHIFFRES, max: 7 },
];

export default class Ajouter extends Phaser.Scene {
  constructor() {
    super("ajouter");
  }

  create() {
    titre(this, "Ajouter une donnée");
    this.champ = 0; // champ en cours de saisie ; les précédents sont verrouillés
    this.saisies = CHAMPS.map((c) => [c.alphabet[0]]);
    this.pos = 0; // position du caractère en cours dans le champ
    this.enregistrement = false;

    this.labels = CHAMPS.map((c, i) =>
      this.add.text(250, 230 + i * 110, c.label + " :", { fontFamily: FONT, fontSize: "34px", color: "#ffffff" })
    );
    this.valeurs = CHAMPS.map((c, i) =>
      this.add.text(520, 230 + i * 110, "", { fontFamily: "monospace", fontSize: "44px", color: "#ffffff" })
    );
    this.add
      .text(640, 640, "Haut/Bas : changer  |  Droite : suivant  |  Gauche : précédent  |  Action : valider", {
        fontFamily: FONT, fontSize: "22px", color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.maj();
    this.input.keyboard.on("keydown", this.touche, this);
  }

  touche(e) {
    if (this.enregistrement) return;
    const k = e.key.toLowerCase();
    const def = CHAMPS[this.champ];
    const saisie = this.saisies[this.champ];
    const n = def.alphabet.length;
    const i = def.alphabet.indexOf(saisie[this.pos]);

    if (k === "arrowup") {
      saisie[this.pos] = def.alphabet[(i + 1) % n];
    } else if (k === "arrowdown") {
      saisie[this.pos] = def.alphabet[(i - 1 + n) % n];
    } else if (k === "arrowright") {
      if (this.pos + 1 < def.max) {
        this.pos++;
        if (this.pos >= saisie.length) saisie.push(def.alphabet[0]);
      }
    } else if (k === "arrowleft") {
      if (this.pos > 0) {
        // Le caractère abandonné par un retour en arrière est supprimé s'il est en bout de champ
        if (this.pos === saisie.length - 1) saisie.pop();
        this.pos--;
      }
    } else if (ACTION_KEYS.includes(k)) {
      this.valider();
      return;
    }
    this.maj();
  }

  async valider() {
    if (this.champ < CHAMPS.length - 1) {
      this.champ++;
      this.pos = this.saisies[this.champ].length - 1;
      this.maj();
      return;
    }
    this.enregistrement = true;
    const [prenom, nom, score] = this.saisies.map((s) => s.join(""));
    await ajouterEntree({ prenom, nom, score: parseInt(score, 10) });
    this.scene.start("menu");
  }

  maj() {
    CHAMPS.forEach((c, i) => {
      const t = this.valeurs[i];
      const actif = i === this.champ;
      const fait = i < this.champ;
      this.labels[i].setColor(actif ? "#ffd400" : fait ? "#66cc66" : "#666666");
      const saisie = this.saisies[i];
      if (i > this.champ) {
        t.setText("");
        return;
      }
      // Le caractère courant est entre crochets
      t.setText(saisie.map((ch, p) => (actif && p === this.pos ? `[${ch}]` : ` ${ch} `)).join(""));
      t.setColor(actif ? "#ffd400" : "#66cc66");
    });
  }
}
