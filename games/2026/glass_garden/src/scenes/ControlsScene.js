import { SCENES, UI_IMAGES, FONT_FAMILY, CONTROL_MODES, CONTROLS_PAGE, MENU_INDEX, ASSETS, PLAYER, P2_SPRITE } from '../utils/constants.js';
import { BINDINGS } from '../systems/InputManager.js';
import { createParchmentPage, addBackKey } from '../systems/ParchmentPage.js';

/** Le nom d'une touche tel qu'on l'affiche : « ENTER » devient « Entrée » (les lettres restent telles quelles). */
const keyLabel = (key) => ({ ENTER: 'Entrée', SPACE: 'Espace', SHIFT: 'Maj' }[key] ?? key);

/**
 * * La page « Commandes » : les touches du mode arcade des deux joueurs, sur un cadre en parchemin posé sur l'image d'accueil
 * assombrie. Les touches sont lues dans BINDINGS (InputManager.js) : la page reste juste si on les change pour la borne.
 * O (ou Échap) revient à l'accueil.
 */
export default class ControlsScene extends Phaser.Scene {
  constructor() {
    super(SCENES.CONTROLS);
  }

  preload() {
    this.load.image(UI_IMAGES.HOME.KEY, UI_IMAGES.HOME.PATH);
    // * Les personnages des deux joueurs (les mêmes feuilles que dans le jeu : Phaser ne les recharge pas deux fois)
    this.load.spritesheet(ASSETS.PLAYER_1, 'assets/images/sprites/player_1_spritesheet.png', { frameWidth: PLAYER.FRAME_SIZE, frameHeight: PLAYER.FRAME_SIZE });
    this.load.spritesheet(P2_SPRITE.key, P2_SPRITE.path, { frameWidth: P2_SPRITE.frameWidth, frameHeight: P2_SPRITE.frameHeight });
    ['JOYSTICK_BASE', 'JOYSTICK_STICK_1', 'JOYSTICK_STICK_2'].forEach((name) => this.load.image(UI_IMAGES[name].KEY, UI_IMAGES[name].PATH));
    ['ARCADE_GREEN', 'ARCADE_RED', 'ARCADE_YELLOW'].forEach((name) => this.load.image(UI_IMAGES[name].KEY, UI_IMAGES[name].PATH));
  }

  create() {
    const { width } = this.scale;
    const { COLUMNS_X, PLAYER_Y, FIRST_ROW_Y, ROW_SPACING, ROWS } = CONTROLS_PAGE;

    // * Le fond, le cadre en parchemin et le titre (voir ParchmentPage.js)
    const text = createParchmentPage(this, 'Commandes');

    // * Une colonne par joueur : son nom, puis une ligne par action (le libellé, et dessous la touche)
    [1, 2].forEach((player, column) => {
      const keys = BINDINGS[CONTROL_MODES.ARCADE][player];
      const x = COLUMNS_X[column];
      text(x + CONTROLS_PAGE.HEADER_SHIFT, PLAYER_Y, `Joueur ${player}`, CONTROLS_PAGE.PLAYER_SIZE, true);

      // * Le personnage du joueur, de face, à gauche de son nom (pixel art net)
      const spriteKey = player === 1 ? ASSETS.PLAYER_1 : P2_SPRITE.key;
      this.textures.get(spriteKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.add.image(x + CONTROLS_PAGE.SPRITE.OFFSET_X, PLAYER_Y, spriteKey, PLAYER.FRAMES.DOWN).setScale(CONTROLS_PAGE.SPRITE.SCALE);
      // * Une ligne par action : le libellé à gauche (aligné à droite), l'icône à droite
      ROWS.forEach(([label, action], row) => {
        const y = FIRST_ROW_Y + row * ROW_SPACING;
        text(x - CONTROLS_PAGE.LABEL_GAP, y, label, CONTROLS_PAGE.ACTION_SIZE).setOrigin(1, 0.5);
        const iconX = x + CONTROLS_PAGE.ICON_OFFSET;
        if (action === 'move') {
          // * Le déplacement se fait au joystick (chacun a le sien sur la borne) : on le dessine, de la couleur du joueur.
          // Le socle est fixe, le manche s'incline en va-et-vient autour de son pied. Le joueur 2 est un peu en décalage.
          const { PIVOT, ANGLE_DEG, DURATION_MS, EASE, PLAYER_2_DELAY_MS } = CONTROLS_PAGE.JOYSTICK_TILT;
          const stickKey = player === 1 ? UI_IMAGES.JOYSTICK_STICK_1.KEY : UI_IMAGES.JOYSTICK_STICK_2.KEY;
          [UI_IMAGES.JOYSTICK_BASE.KEY, stickKey].forEach((key) => this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST));
          const size = this.textures.get(stickKey).getSourceImage().width; // 24 px
          const scale = CONTROLS_PAGE.JOYSTICK_SCALE;
          this.add.image(iconX, y, UI_IMAGES.JOYSTICK_BASE.KEY).setScale(scale);
          // * L'origine du manche est son pied : on le place là où est ce point sur le socle, et il tourne autour
          const stick = this.add
            .image(iconX + (PIVOT.X - size / 2) * scale, y + (PIVOT.Y - size / 2) * scale, stickKey)
            .setOrigin(PIVOT.X / size, PIVOT.Y / size)
            .setScale(scale)
            .setAngle(-ANGLE_DEG);
          this.tweens.add({
            targets: stick,
            angle: ANGLE_DEG,
            duration: DURATION_MS,
            ease: EASE,
            yoyo: true,
            repeat: -1,
            delay: player === 1 ? 0 : PLAYER_2_DELAY_MS,
          });
        } else {
          // * Un bouton d'arcade de la couleur de l'action, avec la lettre de la touche posée dessus
          const button = UI_IMAGES[CONTROLS_PAGE.ARCADE_BUTTONS[action]];
          this.textures.get(button.KEY).setFilter(Phaser.Textures.FilterMode.NEAREST);
          this.add.image(iconX, y, button.KEY).setScale(CONTROLS_PAGE.ARCADE_SCALE);
          this.add
            .text(iconX, y - 2, keyLabel(keys[action]), {
              fontFamily: FONT_FAMILY,
              fontSize: CONTROLS_PAGE.ARCADE_LETTER_SIZE,
              fontStyle: 'bold',
              color: '#ffffff',
              stroke: '#2a2236',
              strokeThickness: 5,
            })
            .setOrigin(0.5);
        }
      });
    });

    // * O (le bouton de retour de la borne) ou Échap : retour à l'accueil, sur le bouton « Commandes »
    addBackKey(this, text, MENU_INDEX.CONTROLS);
  }
}
