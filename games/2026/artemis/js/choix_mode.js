import * as fct from "./fonctions.js";
import { BOUTONS_VALIDER } from "./menu.js";

/***********************************************************************/
/** CHOIX DU MODE : après le synopsis du mode solo, "Jouer" (niveau 1) ou "Tutoriel" (cf. tutoriel.js)
/** navigation et validation comme dans le menu : joystick haut / bas, puis un bouton d'action
/***********************************************************************/

// les boutons, de haut en bas (images chargées dans selection.js)
const OPTIONS = [
  { image: "img_bouton_jouer", tuto: false },
  { image: "img_bouton_tuto", tuto: true }
];
const LARGEUR_BOUTON = 460; // px : largeur affichée des boutons (les images font 920 px)
const Y_PREMIER_BOUTON = 330; // px
const ECART_BOUTONS = 110; // px
const ECHELLE_SELECTION = 1.08; // le bouton choisi est un peu plus grand...
const OPACITE_AUTRES = 0.55; // ... et l'autre est assombri
const DUREE_FONDU = 300; // ms
const DELAI_OUVERTURE = 250; // ms : le bouton qui a fermé le synopsis est peut-être encore enfoncé, on ignore les touches un instant

// scene lancée par synopsis.js (mode solo) : la partie a déjà été remise à zéro par menu.js
export default class choix_mode extends Phaser.Scene {
  constructor() {
    super({ key: "choix_mode" });
  }

  create() {
    this.cameras.main.setBackgroundColor("#080D1C");
    this.cameras.main.fadeIn(DUREE_FONDU);
    this.verrou = true; // true : on ignore les touches (délai d'ouverture, puis le fondu de sortie)
    this.time.delayedCall(DELAI_OUVERTURE, () => { this.verrou = false; });

    this.add.image(0, 0, "img_fond_menu").setOrigin(0, 0);

    this.boutons = OPTIONS.map((option, i) => {
      this.textures.get(option.image).setFilter(Phaser.Textures.FilterMode.LINEAR);
      const bouton = this.add.image(this.scale.width / 2, Y_PREMIER_BOUTON + i * ECART_BOUTONS, option.image);
      bouton.echelle_normale = LARGEUR_BOUTON / bouton.width;
      return bouton;
    });
    this.choix = 0; // Jouer par défaut
    this.majSelection();

    this.add.text(this.scale.width / 2, this.scale.height - 34, "Joystick : choisir      Un bouton d'action : valider", { fontFamily: fct.POLICES.texte, fontSize: "22px", color: "#E8EBF0", stroke: "#080D1C", strokeThickness: 5 })
      .setOrigin(0.5);

    // les touches des deux joueurs (cf. fonctions.js)
    this.touches = fct.JOUEURS.map((joueur) => fct.creerTouches(this, joueur.touches));
  }

  // met en avant le bouton choisi
  majSelection() {
    this.boutons.forEach((bouton, i) => {
      const choisi = i === this.choix;
      bouton.setScale(bouton.echelle_normale * (choisi ? ECHELLE_SELECTION : 1));
      bouton.setAlpha(choisi ? 1 : OPACITE_AUTRES);
    });
  }

  // fondu, puis le niveau 1 (partie ou tutoriel) ; la musique d'accueil, qui a continué pendant le synopsis, s'arrête
  valider() {
    const tuto = OPTIONS[this.choix].tuto;
    this.verrou = true;
    this.cameras.main.fadeOut(DUREE_FONDU);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.sound.get("accueil")?.stop();
      this.scene.start("niveau1", tuto ? { niveau: 1, tuto: true } : { niveau: 1 });
    });
  }

  update() {
    if (this.verrou) return;

    const appuye = (touche) => Phaser.Input.Keyboard.JustDown(touche);
    if (this.touches.some((t) => appuye(t.haut))) this.choix = (this.choix + OPTIONS.length - 1) % OPTIONS.length;
    if (this.touches.some((t) => appuye(t.bas))) this.choix = (this.choix + 1) % OPTIONS.length;
    this.majSelection();

    if (this.touches.some((t) => BOUTONS_VALIDER.some((bouton) => appuye(t[bouton])))) this.valider();
  }
}
