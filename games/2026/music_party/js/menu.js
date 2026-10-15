import { creerTouches, unJoueurAppuie } from "./controles.js";
import { jouerSon, lancerMusique } from "./sons.js";
import { infosJeu } from "./jeux.js";
import { style, styleTexte, fondAssombri, aideBas, OR } from "./interface.js";

// Menu du mini-jeu choisi : SOLO (pour battre les meilleurs scores) ou DUO
// (J1 contre J2). Tout se fait au joystick + bouton A : pas de souris sur la borne.
export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  create() {
    this.touches = creerTouches(this);
    this.jeu = infosJeu(this.registry.get("jeu"));
    this.choix = this.registry.get("mode") == "duo" ? 1 : 0;
    this.niveau = this.registry.get("niveau") || 1; // niveau de Piano Time (1 à 3)
    this.lancement = false;

    fondAssombri(this, this.jeu.fond, 0.55);
    var titre = this.add.text(640, 105, this.jeu.titre, style(80, OR, 12)).setOrigin(0.5);
    this.add
      .text(640, 178, this.jeu.slogan, { fontFamily: "Georgia, serif", fontSize: "28px", fontStyle: "italic", color: "#ffffff" })
      .setOrigin(0.5);

    // ----- les choix -----
    this.add.rectangle(640, 345, 720, 200, 0x1b1030, 0.85).setStrokeStyle(3, 0xe0a818);
    this.surligne = this.add.rectangle(640, 295, 700, 56, 0xffd23f, 0.3);
    this.textesChoix = [
      this.add.text(640, 295, "SOLO", style(34)).setOrigin(0.5),
      this.add.text(640, 395, "DUO", style(34)).setOrigin(0.5)
    ];
    this.texteInfo = this.add.text(640, 473, "", styleTexte(22, OR)).setOrigin(0.5);

    // ----- règles -----
    this.add.text(640, 562, this.jeu.regles, { ...styleTexte(20), lineSpacing: 8 }).setOrigin(0.5);
    aideBas(this, this.jeu.niveaux ? "Joystick : choisir   ◄ ► : niveau   A : valider   B : autres jeux" : "Joystick : choisir     A : valider     B : autres jeux");



    this.majMenu();
    lancerMusique(this);
    this.cameras.main.fadeIn(300);
  }

  update() {
    if (this.lancement) return; // on est en train de changer d'écran
    // haut / bas : on passe de SOLO à DUO
    if (unJoueurAppuie(this.touches, "haut") || unJoueurAppuie(this.touches, "bas")) {
      this.choix = 1 - this.choix;
      jouerSon(this, "menu");
      this.majMenu();
    }
    // gauche / droite : le niveau (seulement pour les jeux qui en ont)
    if (this.jeu.niveaux) {
      var niveauAvant = this.niveau;
      if (unJoueurAppuie(this.touches, "gauche")) this.niveau = Math.max(1, this.niveau - 1);
      if (unJoueurAppuie(this.touches, "droite")) this.niveau = Math.min(3, this.niveau + 1);
      if (this.niveau != niveauAvant) {
        this.registry.set("niveau", this.niveau);
        jouerSon(this, "menu");
        this.majMenu();
      }
    }
    if (unJoueurAppuie(this.touches, "a")) {
      this.registry.set("mode", this.choix == 0 ? "solo" : "duo");
      // tous les jeux passent par le choix des persos (choix.js), puis lancent le jeu
      this.partir("choix", "valider");
    } else if (unJoueurAppuie(this.touches, "b")) {
      this.partir("selection", "retour");
    }
  }

  partir(scene, son) {
    this.lancement = true;
    jouerSon(this, son);
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(300, () => this.scene.start(scene));
  }

  majMenu() {
    this.surligne.y = this.textesChoix[this.choix].y;
    this.textesChoix.forEach((t, i) => t.setScale(i == this.choix ? 1.08 : 1));
    var duo = this.choix == 1 ? "À deux sur la borne : le meilleur score gagne !" : "";
    if (this.jeu.niveaux) this.texteInfo.setText("◄  Niveau " + this.niveau + "  ►" + (duo ? "      " + duo : ""));
    else this.texteInfo.setText(duo);
  }
}
