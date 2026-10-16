import { creerTouches, unJoueurAppuie } from "./controles.js";
import { jouerSon, lancerMusique } from "./sons.js";
import { JEUX } from "./jeux.js";
import { creerBandeau, fondAssombri, aideBas } from "./interface.js";

// Les trois miniatures sont sur une seule ligne.
const X_CARTES = [240, 640, 1040];
const Y_CARTES = 350;
const LARGEUR = 360;
const HAUTEUR = 180;

// Sélection du mini-jeu (comme la scène "selection" du template, qui mène aux
// niveaux) : joystick pour choisir, A pour jouer, B pour revenir au titre.
export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  create() {
    this.touches = creerTouches(this);
    this.depart = false;
    // on se replace sur le dernier jeu choisi
    this.index = Math.max(0, JEUX.findIndex((jeu) => jeu.cle == this.registry.get("jeu")));

    fondAssombri(this, "img_fond_scene", 0.6);
    var titre = this.add.image(640, 50, "img_choisis_jeu");
    titre.scaleX = 0.9;
    titre.scaleY = 0.9;
    this.vignettes = JEUX.map((jeu, i) => this.creerVignette(jeu, i));

    // le cadre doré autour du jeu choisi (le trou du cadre est au milieu de l'image)
    this.cadre = this.add.image(0, 0, "img_cadre_jeu");
    this.cadre.scaleX = LARGEUR / 420;
    this.cadre.scaleY = HAUTEUR / 202;

    aideBas(this, [["horizontal", "Choisir"], ["a", "Jouer"], ["b", "Retour"]]);
    this.majCadre();
    lancerMusique(this);
  }

  // Le titre du jeu est déjà dans le PNG de sa miniature.
  creerVignette(jeu, i) {
    var x = X_CARTES[i];
    var y = Y_CARTES;

    // Tuto menu : images préchargées et texte, sans masque ni Graphics.
    var image = this.add.image(x, y, jeu.apercu);
    image.scaleX = LARGEUR / image.width;
    image.scaleY = HAUTEUR / image.height;
    creerBandeau(this, x, y + HAUTEUR / 2 + 48, jeu.slogan, LARGEUR);
    return { image: image, x: x, y: y };
  }

  majCadre() {
    var v = this.vignettes[this.index];
    this.cadre.x = v.x;
    this.cadre.y = v.y;
    this.vignettes.forEach((autre, i) => autre.image.setTint(i == this.index ? 0xffffff : 0x777777));
  }

  update() {
    if (this.depart) return;
    var gauche = unJoueurAppuie(this.touches, "gauche");
    var droite = unJoueurAppuie(this.touches, "droite");
    // Consommer aussi ces appuis pour ne pas les reporter dans le menu suivant.
    unJoueurAppuie(this.touches, "haut");
    unJoueurAppuie(this.touches, "bas");
    if (gauche || droite) {
      this.index = (this.index + (droite ? 1 : JEUX.length - 1)) % JEUX.length;
      jouerSon(this, "menu");
      this.majCadre();
    }
    if (unJoueurAppuie(this.touches, "a")) {
      this.registry.set("jeu", JEUX[this.index].cle);
      this.partir("menu", "valider");
    } else if (unJoueurAppuie(this.touches, "b")) {
      this.partir("accueil", "retour");
    }
  }

  partir(scene, son) {
    this.depart = true;
    jouerSon(this, son);
    this.scene.start(scene);
  }
}
