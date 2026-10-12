import { SCENES, COLORS, FONT_FAMILY, FONT_SIZE } from '../utils/constants.js';

/**
 * * Première scène du jeu : pour l'instant elle affiche seulement le titre.
 * Elle deviendra l'écran d'accueil (jouer, contrôles...).
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  // create() est appelée une fois, quand la scène démarre
  create() {
    const { width, height } = this.scale;

    // TODO(équipe): remplacer ce texte par les éléments d'interface (UI) de l'écran d'accueil
    this.add
      .text(width / 2, height / 2, 'GLASS GARDEN', {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE.TITLE,
        color: COLORS.TEXT,
      })
      .setOrigin(0.5); // * on centre le texte sur son point de placement
  }
}
