import * as fct from "./fonctions.js";
import { BOUTONS_VALIDER } from "./menu.js";
import { ajouterScore } from "./scores.js";

/***********************************************************************/
/** GAME OVER : quand tous les joueurs sont à 0 PV (cf. niveau1.js)
/** affiche le niveau atteint (c'est le score) ; on saisit 3 initiales au joystick,
/** puis le score est enregistré (cf. scores.js) et le classement s'ouvre
/***********************************************************************/

const NB_LETTRES = 3; // longueur des initiales
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const COULEUR_ACTIVE = "#EC8697"; // lettre en cours de saisie
const COULEUR_LETTRE = "#E8EBF0";

const DUREE_FONDU = 600; // ms
const LARGEUR_TITRE = 640; // px : largeur affichée de l'image "GAME OVER" (1300 px d'origine)
const DELAI_BOUTON = 1200; // ms : on ignore les boutons un instant pour ne pas quitter l'écran par erreur (on était en train de se battre)

export default class gameover extends Phaser.Scene {
  constructor() {
    super({ key: "gameover" });
  }

  create(data) {
    this.cameras.main.setBackgroundColor("#080D1C");
    this.cameras.main.fadeIn(DUREE_FONDU);
    this.quitte = false;
    this.pret = false;

    this.add.image(0, 0, "img_fond_game_over").setOrigin(0, 0);

    this.textures.get("img_titre_game_over").setFilter(Phaser.Textures.FilterMode.LINEAR);
    const titre = this.add.image(this.scale.width / 2, 210, "img_titre_game_over");
    titre.setScale(LARGEUR_TITRE / titre.width);
    // le titre apparait en grossissant un peu
    this.tweens.add({ targets: titre, scale: { from: titre.scale * 0.8, to: titre.scale }, alpha: { from: 0, to: 1 }, duration: 700, ease: "Back.easeOut" });

    this.niveau = data.niveau;
    // le score est uniquement le niveau atteint (ni ennemis tués, ni pierres)
    this.add.text(this.scale.width / 2, 430, "Niveau atteint : " + data.niveau, { fontFamily: fct.POLICES.texte, fontSize: "34px", color: "#EC8697", stroke: "#080D1C", strokeThickness: 6 }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, 492, "Entrez votre nom :", { fontFamily: fct.POLICES.texte, fontSize: "26px", color: "#E8EBF0", stroke: "#080D1C", strokeThickness: 6 }).setOrigin(0.5);
    // saisie des initiales : une lettre par case, la case active est en couleur
    this.lettres = new Array(NB_LETTRES).fill(0); // indices dans ALPHABET
    this.position = 0;
    this.cases = this.lettres.map((_, i) => this.add.text(this.scale.width / 2 + (i - (NB_LETTRES - 1) / 2) * 70, 548, "A", { fontFamily: fct.POLICES.texte, fontSize: "48px", color: COULEUR_LETTRE, stroke: "#080D1C", strokeThickness: 7 }).setOrigin(0.5));
    this.majInitiales();

    const invite = this.add.text(this.scale.width / 2, 630, "Joystick : lettres      Bouton " + fct.ETIQUETTES.frapper_tirer + " : valider", { fontFamily: fct.POLICES.texte, fontSize: "24px", color: "#BFC3CC", stroke: "#080D1C", strokeThickness: 5 })
      .setOrigin(0.5)
      .setAlpha(0);
    this.time.delayedCall(DELAI_BOUTON, () => {
      this.pret = true;
      this.tweens.add({ targets: invite, alpha: { from: 0.35, to: 1 }, duration: 800, yoyo: true, repeat: -1 });
    });

    this.touches = fct.JOUEURS.map((joueur) => fct.creerTouches(this, joueur.touches));
  }

  // affiche les lettres choisies et met en couleur la case active
  majInitiales() {
    this.cases.forEach((texte, i) => {
      texte.setText(ALPHABET[this.lettres[i]]);
      texte.setColor(i === this.position ? COULEUR_ACTIVE : COULEUR_LETTRE);
    });
  }

  update() {
    if (!this.pret || this.quitte) return;
    const appuye = (touche) => Phaser.Input.Keyboard.JustDown(touche);

    // haut / bas : lettre suivante ou précédente ; gauche / droite : case voisine
    const lettre = this.touches.some((t) => appuye(t.haut)) ? 1 : this.touches.some((t) => appuye(t.bas)) ? -1 : 0;
    const case_voisine = this.touches.some((t) => appuye(t.droite)) ? 1 : this.touches.some((t) => appuye(t.gauche)) ? -1 : 0;
    if (lettre || case_voisine) {
      this.lettres[this.position] = (this.lettres[this.position] + lettre + ALPHABET.length) % ALPHABET.length;
      this.position = Math.min(NB_LETTRES - 1, Math.max(0, this.position + case_voisine));
      this.majInitiales();
      /* >>>>> AJOUT SON <<<<< */ this.sound.play("son_touche_entrant"); // changement de lettre ou de case
    }

    if (!this.touches.some((t) => BOUTONS_VALIDER.some((bouton) => appuye(t[bouton])))) return;
    this.enregistrer();
  }

  // enregistre le score puis ouvre le classement (async : lireDonneesJSON / ecrireDonneesJSON renvoient des promesses)
  async enregistrer() {
    this.quitte = true;
    /* >>>>> AJOUT SON <<<<< */ const son_sortie = this.sound.add("son_touche_sortant"); // on quitte la page de game over
    /* >>>>> AJOUT SON <<<<< */ son_sortie.once("complete", () => son_sortie.destroy());
    /* >>>>> AJOUT SON <<<<< */ son_sortie.play();
    // on écrit avant de lancer le fondu : l'écoute de "camerafadeoutcomplete" ne doit pas arriver après la fin du fondu
    // si l'écriture échoue, on affiche quand même le classement
    let rang = -1;
    try {
      rang = await ajouterScore(this.lettres.map((i) => ALPHABET[i]).join(""), this.niveau);
    } catch (erreur) {
      console.error("Score non enregistré :", erreur);
    }
    this.cameras.main.fadeOut(DUREE_FONDU);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      // la musique de game over s'arrête ; celle du menu repart avec lui (le son de sortie, lui, va jusqu'au bout)
      /* >>>>> AJOUT SON <<<<< */ this.sound.getAllPlaying().filter((son) => son !== son_sortie).forEach((son) => son.stop());
      this.scene.start("scores", { rang: rang });
    });
  }
}
