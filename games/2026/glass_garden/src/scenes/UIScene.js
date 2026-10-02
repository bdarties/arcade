import timer from '../systems/TimerSystem.js';
import { getCollectedStars, getTotalStars } from '../systems/StarSystem.js';
import { getControlMode, toggleControlMode } from '../systems/ControlMode.js';
import { formatTime } from '../utils/helpers.js';
import { SCENES, COLORS, FONT_FAMILY, FONT_SIZE, UI_MARGIN, VICTORY_MESSAGE, CONTROL_MODE_SHORTCUT } from '../utils/constants.js';

/**
 * * Scène d'interface : affiche le chronomètre et le compteur d'étoiles par-dessus le monde en cours.
 *
 * Elle est lancée UNE SEULE FOIS, en parallèle des mondes, et n'est jamais arrêtée :
 * quand on change de monde, seule la scène du monde est remplacée. C'est ce qui garde
 * l'affichage stable pendant les téléportations.
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super(SCENES.UI);
  }

  create() {
    // * Coin haut droit : le texte est aligné sur son bord droit (origine à 1)
    this.timerText = this.add
      .text(this.scale.width - UI_MARGIN, UI_MARGIN, formatTime(0), {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE.TIMER,
        color: COLORS.TEXT,
      })
      .setOrigin(1, 0);

    // * Le compteur d'étoiles, juste sous le chronomètre, aligné sur le même bord droit
    this.starsText = this.add
      .text(this.scale.width - UI_MARGIN, UI_MARGIN + this.timerText.height, this.getStarsLabel(), {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE.STARS,
        color: COLORS.TEXT,
      })
      .setOrigin(1, 0);

    // * Le mode de contrôle actuel, en bas à gauche, discret : un repère pour les tests (arcade ou pc)
    // TODO(équipe): le retirer (ou le cacher) pour la version finale sur la borne
    this.controlModeText = this.add
      .text(UI_MARGIN, this.scale.height - UI_MARGIN, this.getControlModeLabel(), {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE.CONTROL_MODE,
        color: COLORS.TEXT,
      })
      .setOrigin(0, 1)
      .setAlpha(0.7);

    this.setupControlModeShortcut();
  }

  // Le texte du mode : « Mode : arcade »
  getControlModeLabel() {
    return `Mode : ${getControlMode()}`;
  }

  // * Le raccourci de test arcade <-> pc. Il est branché ICI parce que cette scène n'est jamais détruite :
  // dans une scène de monde, il serait rebranché à chaque téléportation et se déclencherait plusieurs fois.
  setupControlModeShortcut() {
    this.input.keyboard.on('keydown', (event) => {
      const withModifier = event.ctrlKey || event.metaKey; // Ctrl, ou Cmd sur Mac
      // event.repeat : la touche maintenue renvoie des événements, on ne veut qu'un changement par appui
      if (withModifier && event.code === CONTROL_MODE_SHORTCUT.CODE && !event.repeat) {
        toggleControlMode();
      }
    });
  }

  // * Fin de partie : un message au milieu de l'écran (appelé par WorldScene.winGame)
  // TODO(équipe): remplacer par un vrai écran de fin
  showVictory() {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, VICTORY_MESSAGE, {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE.VICTORY,
        color: COLORS.TEXT,
        backgroundColor: COLORS.VICTORY_BACKGROUND,
        padding: { x: 32, y: 20 },
      })
      .setOrigin(0.5);
  }

  // Le texte du compteur : « Étoiles : 2 / 5 »
  getStarsLabel() {
    return `Étoiles : ${getCollectedStars()} / ${getTotalStars()}`;
  }

  // update() est appelée à chaque image : on relit le chronomètre et on met le texte à jour
  update() {
    this.timerText.setText(formatTime(timer.elapsed()));
    this.starsText.setText(this.getStarsLabel());
    this.controlModeText.setText(this.getControlModeLabel());
  }
}
