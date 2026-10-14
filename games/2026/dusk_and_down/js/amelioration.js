import { ECRAN, POLICE_TITRE, POLICE_TEXTE } from "./reglages/config.js";
import { CATEGORIES } from "./reglages/bienfaits.js";
import { creerControles, vientDEtrePressee } from "./reglages/controles.js";
import { tirerBienfaits, appliquerBienfait } from "./systemes/tirage.js";
import { jouerSon } from "./systemes/sons.js";

const NB_CHOIX = 3;

function couleurTexte(couleur) {
  return "#" + couleur.toString(16).padStart(6, "0");
}

export default class amelioration extends Phaser.Scene {
  constructor() {
    super({ key: "amelioration" });
  }

  create() {
    this.jeu = this.scene.get("jeu");
    const joueurs = this.jeu.joueurs;
    const centre = ECRAN.largeur / 2;

    this.add.rectangle(0, 0, ECRAN.largeur, ECRAN.hauteur, 0x05030c, 0.84).setOrigin(0);
    this.add.image(centre, 90, "img_lumiere").setTint(0xffc94a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(700, 180).setAlpha(0.35);
    this.add
      .text(centre, 80, "La flamme vous offre un bienfait", {
        fontFamily: POLICE_TITRE, fontSize: "40px", color: "#ffe2a8", stroke: "#000000", strokeThickness: 6
      })
      .setOrigin(0.5);
    this.add
      .text(centre, 124, "Niveau " + this.jeu.niveau, { fontFamily: POLICE_TITRE, fontSize: "20px", color: "#d8cfbd" })
      .setOrigin(0.5);
    this.add
      .text(centre, ECRAN.hauteur - 30, "Joystick haut / bas : choisir    ·    Bouton A : valider", {
        fontFamily: POLICE_TEXTE, fontSize: "18px", color: "#b9b1a0"
      })
      .setOrigin(0.5);

    this.input.keyboard.resetKeys();
    const largeurZone = ECRAN.largeur / joueurs.length;
    this.choixJoueurs = joueurs.map((joueur, i) => {
      const centreZone = largeurZone * i + largeurZone / 2;
      const choix = {
        joueur: joueur,
        propositions: tirerBienfaits(joueur, NB_CHOIX),
        controles: creerControles(this, joueur.numero),
        curseur: 0,
        valide: false
      };
      if (joueurs.length > 1) {
        this.add
          .text(centreZone, 172, "J" + joueur.numero + " · " + joueur.classe.nom, {
            fontFamily: POLICE_TITRE, fontSize: "24px", color: joueur.numero === 1 ? "#ff8f7a" : "#ffcf7a"
          })
          .setOrigin(0.5);
      }
      const largeurCarte = Math.min(660, largeurZone - 50);
      choix.cartes = choix.propositions.map((proposition, j) => this.creerCarte(centreZone, 262 + j * 122, largeurCarte, proposition));
      this.afficherCurseur(choix);
      return choix;
    });

    this.peutValider = false;
    this.time.delayedCall(450, () => (this.peutValider = true));
  }

  creerCarte(x, y, largeur, proposition) {
    const hauteur = 108;
    const gauche = -largeur / 2;
    const rarete = proposition.rarete;
    const categorie = CATEGORIES[proposition.bienfait.categorie];
    const carte = this.add.container(x, y);
    const cadre = this.add.rectangle(0, 0, largeur, hauteur, 0x14101c, 0.95).setStrokeStyle(2, rarete.couleur);
    const bande = this.add.rectangle(gauche + 6, 0, 8, hauteur - 10, categorie.couleur);
    const nom = this.add.text(gauche + 24, -hauteur / 2 + 8, proposition.bienfait.nom, {
      fontFamily: POLICE_TITRE, fontSize: "23px", color: "#ffffff"
    });
    const niveau = this.add
      .text(largeur / 2 - 14, -hauteur / 2 + 11, proposition.niveauActuel === 0 ? "NOUVEAU" : "Niv. " + proposition.niveauActuel + " → " + (proposition.niveauActuel + 1), {
        fontFamily: POLICE_TEXTE, fontSize: "15px", color: "#ffd27a"
      })
      .setOrigin(1, 0);
    const etiquette = this.add.text(gauche + 24, -hauteur / 2 + 37, rarete.nom.toUpperCase(), {
      fontFamily: POLICE_TEXTE, fontSize: "14px", color: couleurTexte(rarete.couleur)
    });
    const texteCategorie = this.add.text(gauche + 24 + etiquette.width + 12, -hauteur / 2 + 37, "·  " + categorie.nom, {
      fontFamily: POLICE_TEXTE, fontSize: "14px", color: couleurTexte(categorie.couleur)
    });
    const description = this.add.text(gauche + 24, -hauteur / 2 + 60, proposition.description, {
      fontFamily: POLICE_TEXTE, fontSize: "16px", color: "#e0d8c8", wordWrap: { width: largeur - 48 }
    });
    carte.add([cadre, bande, nom, niveau, etiquette, texteCategorie, description]);
    carte.cadre = cadre;
    carte.couleurRarete = rarete.couleur;
    return carte;
  }

  update() {
    for (const choix of this.choixJoueurs) {
      if (choix.valide) {
        continue;
      }
      const touches = choix.controles;
      if (vientDEtrePressee(touches.haut)) {
        choix.curseur = (choix.curseur + choix.cartes.length - 1) % choix.cartes.length;
        this.afficherCurseur(choix);
        jouerSon("curseur");
      }
      if (vientDEtrePressee(touches.bas)) {
        choix.curseur = (choix.curseur + 1) % choix.cartes.length;
        this.afficherCurseur(choix);
        jouerSon("curseur");
      }
      if (vientDEtrePressee(touches.A) && this.peutValider) {
        choix.valide = true;
        this.afficherCurseur(choix);
        jouerSon("choix");
      }
    }

    if (this.choixJoueurs.every((choix) => choix.valide)) {
      for (const choix of this.choixJoueurs) {
        appliquerBienfait(this.jeu, choix.joueur, choix.propositions[choix.curseur]);
      }
      this.jeu.choixEnCours = false;
      this.scene.resume("jeu");
      this.scene.stop();
    }
  }

  afficherCurseur(choix) {
    choix.cartes.forEach((carte, i) => {
      const survolee = i === choix.curseur;
      carte.setScale(survolee ? 1.03 : 1);
      carte.cadre.setStrokeStyle(survolee ? 4 : 2, survolee ? 0xffffff : carte.couleurRarete);
      if (choix.valide) {
        carte.setAlpha(survolee ? 1 : 0.25);
      }
    });
  }
}
