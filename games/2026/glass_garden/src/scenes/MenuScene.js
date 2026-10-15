import { SCENES, UI_IMAGES, MENU_BUTTONS, MENU_INDEX, FONT_FAMILY } from '../utils/constants.js';

/**
 * * L'écran d'accueil : une image plein écran (le titre est dessiné dedans).
 * Elle a 4 boutons (Jouer, Réglages, Commandes, Crédits). Haut et bas changent le bouton choisi (plus grand et plus clair).
 * Entrée ou I sur « Jouer » mène au choix du mode (ModeScene), sur « Commandes » à la page des touches (ControlsScene).
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  preload() {
    this.load.image(UI_IMAGES.HOME.KEY, UI_IMAGES.HOME.PATH);
    this.load.image(UI_IMAGES.BUTTON.KEY, UI_IMAGES.BUTTON.PATH);
  }

  // create() est appelée une fois, quand la scène démarre
  // data.selected : le bouton à choisir au départ (au retour d'une page, celui qu'on vient de quitter)
  create(data) {
    const { width, height } = this.scale;

    // * L'image fait déjà 1280 x 720 : elle est simplement centrée
    this.add.image(width / 2, height / 2, UI_IMAGES.HOME.KEY);

    // * Les 4 boutons, empilés au centre. Le pixel art reste net : filtre « au plus proche » et agrandissement entier.
    this.textures.get(UI_IMAGES.BUTTON.KEY).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.buttons = MENU_BUTTONS.LABELS.map((label, i) => {
      const y = MENU_BUTTONS.FIRST_Y + i * MENU_BUTTONS.SPACING;
      const image = this.add.image(width / 2, y, UI_IMAGES.BUTTON.KEY).setScale(MENU_BUTTONS.SCALE);
      const text = this.add
        .text(width / 2, y, label, {
          fontFamily: FONT_FAMILY,
          fontSize: MENU_BUTTONS.TEXT.SIZE,
          fontStyle: 'bold',
          color: MENU_BUTTONS.TEXT.COLOR,
          stroke: MENU_BUTTONS.TEXT.STROKE,
          strokeThickness: MENU_BUTTONS.TEXT.STROKE_THICKNESS,
        })
        .setOrigin(0.5);
      return { label, image, text };
    });

    // * Haut et bas changent le bouton choisi (on boucle : après le dernier, on revient au premier). Au départ : « Jouer ».
    this.leaving = false;
    this.selected = 0;
    this.select(data?.selected ?? 0);
    this.input.keyboard.on('keydown-UP', () => this.select(this.selected - 1));
    this.input.keyboard.on('keydown-DOWN', () => this.select(this.selected + 1));

    // * Entrée (clavier) ou I (bouton d'interaction de la borne) valide le bouton choisi : « Jouer » mène au choix du mode,
    // « Commandes » à la page des touches, « Crédits » à la page de l'équipe. (Réglages : pas encore de page.)
    const validate = () => {
      const scenes = { [MENU_INDEX.PLAY]: SCENES.MODE, [MENU_INDEX.CONTROLS]: SCENES.CONTROLS, [MENU_INDEX.CREDITS]: SCENES.CREDITS };
      const target = scenes[this.selected];
      if (target && !this.leaving) {
        this.leaving = true; // une touche maintenue répète l'événement : on ne lance la scène qu'une fois
        this.scene.start(target);
      }
    };
    this.input.keyboard.on('keydown-ENTER', validate);
    this.input.keyboard.on('keydown-I', validate);
  }

  /** Choisit le bouton n° index (en bouclant) : il devient plus grand (le texte aussi) et plus clair, les autres reprennent leur taille. */
  select(index) {
    this.selected = (index + this.buttons.length) % this.buttons.length;
    this.buttons.forEach(({ image, text }, i) => {
      const chosen = i === this.selected;
      image.setScale(chosen ? MENU_BUTTONS.SELECTED_SCALE : MENU_BUTTONS.SCALE);
      image.setTint(chosen ? 0xffffff : MENU_BUTTONS.TINT);
      // * Le texte grandit dans la même proportion que le bouton
      text.setScale(chosen ? MENU_BUTTONS.SELECTED_SCALE / MENU_BUTTONS.SCALE : 1);
    });
  }
}
