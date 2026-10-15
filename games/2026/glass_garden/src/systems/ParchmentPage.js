// =====================================================================================
// * PARCHMENT PAGE : UNE PAGE SUR UN CADRE EN PARCHEMIN
// =====================================================================================
//
// Le fond des pages Commandes et Crédits : l'image d'accueil assombrie, un cadre en parchemin (les couleurs de la boîte de
// dialogue) et un titre. Ce qui se pose dans le cadre est à la charge de la scène. Les valeurs sont dans PARCHMENT_PAGE.
//
// * COMMENT L'UTILISER
//   preload() { this.load.image(UI_IMAGES.HOME.KEY, UI_IMAGES.HOME.PATH); }   // l'image de fond
//   create()  { const text = createParchmentPage(this, 'Crédits'); text(640, 300, 'Bonjour', '30px'); addBackKey(this, text, MENU_INDEX.CREDITS); }
// =====================================================================================

import { SCENES, UI_IMAGES, FONT_FAMILY, DIALOGUE, PARCHMENT_PAGE } from '../utils/constants.js';

/**
 * Dessine le fond, le cadre et le titre, et renvoie une petite fonction pour poser du texte centré dans la couleur du parchemin.
 * @param {Phaser.Scene} scene
 * @param {string} title  Le titre, en haut du cadre
 * @returns {(x: number, y: number, content: string, size: string, bold?: boolean) => Phaser.GameObjects.Text}
 */
export function createParchmentPage(scene, title) {
  const { width, height } = scene.scale;
  const { FRAME, TITLE, DIM_ALPHA } = PARCHMENT_PAGE;

  // * Le fond : l'image d'accueil, assombrie
  scene.add.image(width / 2, height / 2, UI_IMAGES.HOME.KEY);
  scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, DIM_ALPHA);

  // * Le cadre en parchemin (les couleurs de la boîte de dialogue)
  const frame = scene.add.graphics();
  frame.fillStyle(DIALOGUE.COLORS.PAPER, 1).fillRoundedRect(FRAME.X, FRAME.Y, FRAME.WIDTH, FRAME.HEIGHT, FRAME.RADIUS);
  frame.lineStyle(FRAME.BORDER, DIALOGUE.COLORS.BORDER, 1).strokeRoundedRect(FRAME.X, FRAME.Y, FRAME.WIDTH, FRAME.HEIGHT, FRAME.RADIUS);

  const text = (x, y, content, size, bold = false) =>
    scene.add.text(x, y, content, { fontFamily: FONT_FAMILY, fontSize: size, fontStyle: bold ? 'bold' : 'normal', color: DIALOGUE.COLORS.TEXT }).setOrigin(0.5);

  text(width / 2, TITLE.Y, title, TITLE.SIZE, true);
  return text;
}

/**
 * Affiche « O : retour » en bas du cadre, et fait revenir à l'accueil quand on appuie sur O (le bouton de retour de la borne) ou sur Échap.
 * @param {Phaser.Scene} scene
 * @param {Function} text  La fonction renvoyée par createParchmentPage
 * @param {number} menuIndex  Le bouton de l'accueil à choisir au retour (celui de cette page, voir MENU_INDEX)
 */
export function addBackKey(scene, text, menuIndex) {
  const { BACK } = PARCHMENT_PAGE;
  text(scene.scale.width / 2, BACK.Y, BACK.TEXT, BACK.SIZE);

  let leaving = false;
  const back = () => {
    if (leaving) return;
    leaving = true; // une touche maintenue répète l'événement : on ne lance la scène qu'une fois
    scene.scene.start(SCENES.MENU, { selected: menuIndex });
  };
  scene.input.keyboard.on('keydown-O', back);
  scene.input.keyboard.on('keydown-ESC', back);
}
