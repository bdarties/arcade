import { creerTouches, unJoueurAppuie } from "./controles.js";
import { jouerSon, lancerMusique } from "./sons.js";
import { JEUX } from "./jeux.js";
import { style, styleTexte, fondAssombri, aideBas, OR } from "./interface.js";

// Les trois jeux occupent les cases 0, 1 et 2 de la grille.
const X_COLONNES = [410, 870];
const Y_LIGNES = [262, 512];
// taille d'une vignette = taille du trou du cadre doré (on ne déforme pas le cadre)
const LARGEUR = 420;
const HAUTEUR = 202;

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

    aideBas(this, "Joystick : choisir      A : jouer      B : écran titre");
    this.majCadre();
    lancerMusique(this);
  }

  // une vignette = une capture du jeu, son nom et une banderole qui le décrit
  creerVignette(jeu, i) {
    var x = X_COLONNES[i % 2];
    var y = Y_LIGNES[Math.floor(i / 2)];
    var gauche = x - LARGEUR / 2;
    var haut = y - HAUTEUR / 2;
    var bas = haut + HAUTEUR;

    // Tuto menu : images préchargées et texte, sans masque ni Graphics.
    var image = this.add.image(x, y, jeu.apercu).setDisplaySize(LARGEUR, HAUTEUR);
    this.add.text(x, bas - 20, jeu.slogan, { ...styleTexte(14), backgroundColor: "#1b1030", fixedWidth: LARGEUR, padding: { y: 8 } }).setOrigin(0.5);
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
    var haut = unJoueurAppuie(this.touches, "haut");
    var bas = unJoueurAppuie(this.touches, "bas");
    if (gauche || droite || haut || bas) {
      // gauche / droite : on change de colonne, haut / bas : on change de ligne
      if (gauche || droite) {
        var voisin = this.index + (this.index % 2 == 0 ? 1 : -1);
        if (voisin < JEUX.length) this.index = voisin;
      }
      if (haut || bas) this.index = this.index < 2 ? Math.min(this.index + 2, JEUX.length - 1) : this.index - 2;
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
