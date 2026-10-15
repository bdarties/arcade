import { creerTouches, unJoueurAppuie } from "./controles.js";
import { jouerSon, lancerMusique } from "./sons.js";
import { infosJeu } from "./jeux.js";
import { NIVEAUX } from "./repertoire.js";
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

    fondAssombri(this, this.jeu.fond, 0.3);
    this.add.text(640, 86, this.jeu.titre, style(64, OR)).setOrigin(0.5);
    this.add.text(640, 145, this.jeu.slogan, styleTexte(28, "#fff1dc")).setOrigin(0.5);

    this.billets = ["solo", "duo"].map((mode, i) => {
      var image = this.add.image(i == 0 ? 390 : 890, 278, "ui_billet_" + mode);
      image.scaleX = 340 / image.width;
      image.scaleY = 190 / image.height;
      return image;
    });
    this.textesChoix = [
      this.add.text(435, 278, "SOLO", style(48, "#fff1dc")).setOrigin(0.5),
      this.add.text(935, 278, "DUO", style(48, "#fff1dc")).setOrigin(0.5)
    ];
    this.surligne = this.add.image(390, 278, "ui_cadre_mode");
    this.surligne.scaleX = 360 / this.surligne.width;
    this.surligne.scaleY = 170 / this.surligne.height;
    this.texteInfo = this.add.text(640, 382, "", styleTexte(26, "#fff1dc")).setOrigin(0.5);
    // pour les jeux à niveaux (Piano Time) : deux flèches de chaque côté du niveau
    this.flechesNiveau = [];
    if (this.jeu.niveaux) {
      ["gauche", "droite"].forEach((sens, k) => {
        var fleche = this.add.image(640 + (k == 0 ? -190 : 190), 382, "img_fleche_" + sens);
        fleche.scaleX = 30 / fleche.width;
        fleche.scaleY = fleche.scaleX;
        this.flechesNiveau.push(fleche);
      });
    }

    var feuille = this.add.image(640, 514, "ui_regles");
    feuille.scaleX = 860 / feuille.width;
    feuille.scaleY = 230 / feuille.height;
    this.add.text(640, 445, "Comment jouer", style(32, "#7b2830", 0)).setOrigin(0.5);
    this.add.text(640, 524, this.jeu.regles, { ...styleTexte(28, "#46282c"), lineSpacing: 10 }).setOrigin(0.5);
    if (this.jeu.niveaux) {
      // joystick : gauche / droite = niveau, haut / bas = SOLO ou DUO
      aideBas(this, [["horizontal", "Niveau"], ["vertical", "Mode"], ["a", "Valider"], ["b", "Retour"]]);
    } else {
      aideBas(this, [["horizontal", "Choisir"], ["a", "Valider"], ["b", "Retour"]]);
    }

    this.majMenu();
    lancerMusique(this);
    this.cameras.main.fadeIn(300);
  }

  update() {
    if (this.lancement) return; // on est en train de changer d'écran
    var haut = unJoueurAppuie(this.touches, "haut");
    var bas = unJoueurAppuie(this.touches, "bas");
    var gauche = unJoueurAppuie(this.touches, "gauche");
    var droite = unJoueurAppuie(this.touches, "droite");

    // jeux à niveaux : gauche / droite changent le niveau, haut / bas changent le mode
    var changerMode = haut || bas || (!this.jeu.niveaux && (gauche || droite));
    if (changerMode) {
      this.choix = 1 - this.choix;
      jouerSon(this, "menu");
      this.majMenu();
    }
    if (this.jeu.niveaux) {
      var niveauAvant = this.niveau;
      if (gauche) this.niveau = Math.max(1, this.niveau - 1);
      if (droite) this.niveau = Math.min(NIVEAUX.length, this.niveau + 1);
      if (this.niveau != niveauAvant) {
        this.registry.set("niveau", this.niveau);
        jouerSon(this, "menu");
        this.majMenu();
      }
    }
    if (unJoueurAppuie(this.touches, "a")) {
      this.registry.set("mode", this.choix == 0 ? "solo" : "duo");
      // tous les jeux passent par le choix des persos, puis lancent le jeu
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
    this.surligne.x = this.billets[this.choix].x;
    this.billets.forEach((billet, i) => billet.setTint(i == this.choix ? 0xffffff : 0x999999));
    if (this.jeu.niveaux) {
      // le niveau choisi et son air ; une flèche s'éteint quand on ne peut plus aller de son côté
      this.texteInfo.setText("Niveau " + this.niveau + " : " + NIVEAUX[this.niveau - 1].titre);
      this.flechesNiveau[0].setTint(this.niveau > 1 ? 0xffffff : 0x666666);
      this.flechesNiveau[1].setTint(this.niveau < NIVEAUX.length ? 0xffffff : 0x666666);
    } else {
      this.texteInfo.setText(this.choix == 0 ? "Un joueur" : "J1 contre J2");
    }
  }
}
