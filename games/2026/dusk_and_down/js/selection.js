import { ECRAN, POLICE_TITRE, POLICE_TEXTE } from "./reglages/config.js";
import { CLASSES } from "./reglages/classes.js";
import { creerControles, vientDEtrePressee } from "./reglages/controles.js";
import { jouerSon } from "./systemes/sons.js";

const LISTE_CLASSES = Object.keys(CLASSES);

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  init(donnees) {
    this.nbJoueurs = donnees.nbJoueurs;
  }

  create() {
    const cx = ECRAN.largeur / 2;
    this.add.tileSprite(0, 0, ECRAN.largeur, ECRAN.hauteur, "sol_iso").setOrigin(0);
    this.add.image(cx, ECRAN.hauteur / 2, "img_vignette").setDisplaySize(1800, 1150);
    this.add
      .text(cx, 60, "Choisissez votre gardien", { fontFamily: POLICE_TITRE, fontSize: "46px", color: "#ffe2a8", stroke: "#000000", strokeThickness: 7 })
      .setOrigin(0.5);
    this.add
      .text(cx, ECRAN.hauteur - 30, "Joystick gauche / droite : changer    ·    Bouton A : valider    ·    Bouton B : retour", {
        fontFamily: POLICE_TEXTE, fontSize: "18px", color: "#d8cfbd"
      })
      .setOrigin(0.5);

    this.input.keyboard.resetKeys();
    const largeurZone = ECRAN.largeur / this.nbJoueurs;
    this.choix = [];
    for (let numero = 1; numero <= this.nbJoueurs; numero++) {
      const centre = largeurZone * (numero - 1) + largeurZone / 2;
      const choix = { numero: numero, controles: creerControles(this, numero), curseur: numero - 1, valide: false };
      choix.cartes = LISTE_CLASSES.map((idClasse, i) => this.creerCarte(centre + (i - 0.5) * 290, 360, idClasse, numero));
      this.add
        .text(centre, 128, "J" + numero, { fontFamily: POLICE_TITRE, fontSize: "30px", color: numero === 1 ? "#ff8f7a" : "#ffcf7a", stroke: "#000000", strokeThickness: 5 })
        .setOrigin(0.5);
      choix.pret = this.add
        .text(centre, 610, "", { fontFamily: POLICE_TITRE, fontSize: "30px", color: "#9dff9d", stroke: "#000000", strokeThickness: 5 })
        .setOrigin(0.5);
      this.choix.push(choix);
      this.afficherCurseur(choix);
    }
    this.cameras.main.fadeIn(400);
  }

  creerCarte(x, y, idClasse, numero) {
    const classe = CLASSES[idClasse];
    const carte = this.add.container(x, y);
    const cadre = this.add.rectangle(0, 0, 270, 380, 0x14101c, 0.92).setStrokeStyle(2, 0x6b5a3a);
    const cle = classe.texture + "_j" + numero;
    const perso = this.add.sprite(0, -60, cle, 0).setOrigin(0.5, classe.origineY).setScale(2.5).play(cle + "_repos");
    perso.setFlipX(classe.regardeAGauche);
    const nom = this.add.text(0, -30, classe.nom, { fontFamily: POLICE_TITRE, fontSize: "28px", color: "#ffffff" }).setOrigin(0.5, 0);
    const description = this.add
      .text(0, 8, classe.description, { fontFamily: POLICE_TEXTE, fontSize: "16px", color: "#d8cfbd", align: "center", wordWrap: { width: 240 } })
      .setOrigin(0.5, 0);
    carte.add([cadre, perso, nom, description]);
    const libelles = { vie: "Vie", portee: "Portée", vitesse: "Vitesse" };
    Object.keys(libelles).forEach((cleNote, i) => {
      const ligneY = 92 + i * 26;
      carte.add(this.add.text(-110, ligneY, libelles[cleNote], { fontFamily: POLICE_TEXTE, fontSize: "15px", color: "#b9ae98" }).setOrigin(0, 0.5));
      for (let k = 0; k < 5; k++) {
        const plein = k < classe.notes[cleNote];
        carte.add(this.add.rectangle(10 + k * 20, ligneY, 14, 12, plein ? 0xffc94a : 0x3a3346));
      }
    });
    carte.cadre = cadre;
    return carte;
  }

  update() {
    for (const choix of this.choix) {
      const touches = choix.controles;
      if (!choix.valide) {
        if (vientDEtrePressee(touches.gauche) || vientDEtrePressee(touches.droite)) {
          choix.curseur = (choix.curseur + 1) % LISTE_CLASSES.length;
          this.afficherCurseur(choix);
          jouerSon("curseur");
        }
        if (vientDEtrePressee(touches.A)) {
          choix.valide = true;
          choix.pret.setText("PRÊT !");
          this.afficherCurseur(choix);
          jouerSon("choix");
        }
      }
      if (vientDEtrePressee(touches.B)) {
        this.scene.start("menu");
        return;
      }
    }
    if (this.choix.every((choix) => choix.valide)) {
      this.scene.start("jeu", {
        nbJoueurs: this.nbJoueurs,
        classes: this.choix.map((choix) => LISTE_CLASSES[choix.curseur])
      });
    }
  }

  afficherCurseur(choix) {
    choix.cartes.forEach((carte, i) => {
      const choisie = i === choix.curseur;
      carte.setScale(choisie ? 1.05 : 0.95);
      carte.setAlpha(choisie ? 1 : choix.valide ? 0.25 : 0.6);
      carte.cadre.setStrokeStyle(choisie ? 4 : 2, choisie ? 0xffe2a8 : 0x6b5a3a);
    });
  }
}
