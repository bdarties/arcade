import { SCENES, UI_IMAGES, CREDITS_PAGE, MENU_INDEX } from '../utils/constants.js';
import { createParchmentPage, addBackKey } from '../systems/ParchmentPage.js';

/**
 * * La page « Crédits » : le cadre du développement (projet de SAE, BUT MMI, IUT de Béziers) et l'équipe, sur un cadre en
 * parchemin posé sur l'image d'accueil assombrie. Le texte est dans CREDITS_PAGE (constants.js). O (ou Échap) revient à l'accueil.
 */
export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.CREDITS);
  }

  preload() {
    this.load.image(UI_IMAGES.HOME.KEY, UI_IMAGES.HOME.PATH);
  }

  create() {
    const text = createParchmentPage(this, 'Crédits');
    CREDITS_PAGE.LINES.forEach(({ TEXT, Y, SIZE, BOLD }) => text(this.scale.width / 2, Y, TEXT, SIZE, BOLD));

    // * O (le bouton de retour de la borne) ou Échap : retour à l'accueil, sur le bouton « Crédits »
    addBackKey(this, text, MENU_INDEX.CREDITS);
  }
}
