// Synopsis : le texte s'écrit lettre par lettre.

import { creerClavierMenu } from "./controles.js";
import { jouerMusique } from "./musique.js";
import { POLICE } from "./reglages.js";

const DELAI_LETTRE_MS = 35;
const PARAGRAPHES = [
  "Le soir de sa dernière représentation, le grand Maestro disparaît en pleine scène.",
  "Des années plus tard, l'opéra est abandonné, plongé dans le noir et hanté par les personnages et les instruments des spectacles passés.",
  "Le Maestro, lui, est possédé par l'opéra, et les fragments de sa dernière partition sont dispersés dans le bâtiment.",
  "Les héros doivent les retrouver un à un, puis affronter le Maestro sur la scène principale pour le libérer de l'emprise de l'opéra.",
  "Alors les lumières se rallumeront et tout rentrera dans l'ordre."
];

export default class synopsis extends Phaser.Scene {
  constructor() {
    super({ key: "synopsis" });
  }

  create() {
    // La scène peut être rejouée : chaque visite recommence au premier paragraphe.
    this.paragraphe = 0;
    this.enTransition = false;
    jouerMusique(this, "musique_accueil", 0.4); // toujours la même piste
    this.minuteur = null;
    this.lignes = [];
    this.clavier = creerClavierMenu(this);

    this.add.image(640, 360, "img_synopsis").setDisplaySize(1280, 720);
    // Le voile garantit le contraste même devant les dorures les plus lumineuses.
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.68);

    this.indication = this.add.text(640, 654, "", {
      fontFamily: POLICE,
      fontSize: "20px",
      color: "#ffffff",
      align: "center",
      shadow: { offsetX: 0, offsetY: 2, color: "#000000", blur: 6, fill: true }
    }).setOrigin(0.5);

    this.compteur = this.add.text(640, 692, "", {
      fontFamily: POLICE,
      fontSize: "18px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.input.on("pointerup", this.avancer, this);
    this.events.once("shutdown", () => {
      this.arreterEcriture();
      this.input.off("pointerup", this.avancer, this);
    });

    this.afficherParagraphe();
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  // Affiche le paragraphe courant, lettre par lettre
  afficherParagraphe() {
    this.arreterEcriture();
    this.lignes.forEach((ligne) => ligne.texte.destroy());
    this.caractere = 0;
    this.ecritureTerminee = false;

    const style = {
      fontFamily: POLICE,
      fontSize: "34px",
      color: "#ffffff",
      shadow: { offsetX: 0, offsetY: 2, color: "#000000", blur: 8, fill: true }
    };

    // Calculer les lignes entières avant l'écriture évite de déplacer les mots
    // ou de recentrer le paragraphe à chaque nouvelle lettre.
    const mesure = this.add.text(0, 0, PARAGRAPHES[this.paragraphe], {
      ...style,
      wordWrap: { width: 1000, useAdvancedWrap: true }
    }).setVisible(false);
    const contenus = mesure.getWrappedText();
    mesure.destroy();

    const interligne = 52;
    this.lignes = contenus.map((contenu, index) => {
      const texte = this.add.text(640, 360 + (index - (contenus.length - 1) / 2) * interligne, contenu, style)
        .setOrigin(0, 0.5);
      // L'origine horizontale reste à la place du début de la ligne complète.
      texte.x -= texte.width / 2;
      texte.setText("");
      return { texte: texte, contenu: contenu };
    });
    this.nombreCaracteres = contenus.reduce((total, ligne) => total + ligne.length, 0);
    this.compteur.setText((this.paragraphe + 1) + " / " + PARAGRAPHES.length);
    this.indication.setText("Bouton A (borne) · Entrée / Espace / Clic : afficher tout le texte");

    this.minuteur = this.time.addEvent({
      delay: DELAI_LETTRE_MS,
      loop: true,
      callback: () => {
        this.caractere += 1;
        this.revelerTexte();
        if (this.caractere >= this.nombreCaracteres) {
          this.terminerEcriture();
        }
      }
    });
  }

  // Montre les lettres déjà écrites du paragraphe
  revelerTexte() {
    let restants = this.caractere;
    this.lignes.forEach((ligne) => {
      ligne.texte.setText(ligne.contenu.slice(0, Math.max(0, restants)));
      restants -= ligne.contenu.length;
    });
  }

  // Arrête l'écriture lettre par lettre
  arreterEcriture() {
    if (this.minuteur) {
      this.minuteur.remove(false);
      this.minuteur = null;
    }
  }

  // Affiche tout le paragraphe d'un coup
  terminerEcriture() {
    this.arreterEcriture();
    this.caractere = this.nombreCaracteres;
    this.revelerTexte();
    this.ecritureTerminee = true;
    const action = this.paragraphe === PARAGRAPHES.length - 1 ? "commencer l'aventure" : "continuer";
    this.indication.setText("Bouton A (borne) · Entrée / Espace / Clic : " + action);
  }

  update() {
    if (!this.enTransition && this.clavier.presse("valider")) {
      this.avancer();
    }
  }

  // Passe au paragraphe suivant (ou à la suite du jeu)
  avancer() {
    if (this.enTransition) return;
    if (!this.ecritureTerminee) {
      this.terminerEcriture();
      return;
    }
    if (this.paragraphe < PARAGRAPHES.length - 1) {
      this.paragraphe += 1;
      this.afficherParagraphe();
      return;
    }

    this.enTransition = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("lobby");
    });
  }
}
