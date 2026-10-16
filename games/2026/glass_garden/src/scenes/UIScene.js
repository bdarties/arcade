import timer from '../systems/TimerSystem.js';
import { getBestTime, saveBestTime } from '../systems/SaveSystem.js';
import { getGameMode } from '../systems/GameMode.js';
import { getCollectedStars, getTotalStars } from '../systems/StarSystem.js';
import { getBubbleState } from '../systems/BubbleSystem.js';
import { getEnemyState } from '../systems/EnemySystem.js';
import { ABILITY_LOCKED_EVENT, ABILITY_UNLOCKED_EVENT } from '../systems/ProgressSystem.js';
import { BINDINGS } from '../systems/InputManager.js';
import { getControlMode, toggleControlMode } from '../systems/ControlMode.js';
import { formatTime } from '../utils/helpers.js';
import { SCENES, COLORS, FONT_FAMILY, FONT_SIZE, UI_MARGIN, UI_IMAGES, DEPTH, PROGRESS, DIALOGUE, CONTROLS_PAGE, GAME_MODES, VICTORY_TIME, VICTORY_BEST, VICTORY_REPLAY, CONTROL_MODE_SHORTCUT, CONTROL_MODES } from '../utils/constants.js';

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

  preload() {
    this.load.image(UI_IMAGES.WIN.KEY, UI_IMAGES.WIN.PATH);
    ['ARCADE_RED', 'ARCADE_YELLOW'].forEach((name) => this.load.image(UI_IMAGES[name].KEY, UI_IMAGES[name].PATH)); // les boutons de la bannière
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

    // * Le compteur de bulles, sous celui des étoiles : visible seulement dans un monde qui a des bulles à éclater
    this.bubblesText = this.add
      .text(this.scale.width - UI_MARGIN, UI_MARGIN + this.timerText.height + this.starsText.height, '', {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE.STARS,
        color: COLORS.TEXT,
      })
      .setOrigin(1, 0);

    // * Le mode de contrôle, en bas à gauche, discret : un repère pour les tests sur ordinateur. Il n'apparaît qu'en mode pc
    // (voir getControlModeLabel) : sur la borne, qui est toujours en arcade, on ne voit rien.
    this.controlModeText = this.add
      .text(UI_MARGIN, this.scale.height - UI_MARGIN, this.getControlModeLabel(), {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE.CONTROL_MODE,
        color: COLORS.TEXT,
      })
      .setOrigin(0, 1)
      .setAlpha(0.7);

    this.setupControlModeShortcut();

    // * Le message bref quand le joueur essaie une action verrouillée (tir, dash), voir ProgressSystem.js
    this.lockedToast = this.add
      .text(this.scale.width / 2, this.scale.height * PROGRESS.LOCKED_TOAST.Y_RATIO, '', {
        fontFamily: FONT_FAMILY,
        fontSize: PROGRESS.LOCKED_TOAST.SIZE,
        fontStyle: 'bold',
        color: COLORS.TEXT,
        stroke: '#2a2236',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(DEPTH.UI);
    this.lockedToastUntil = 0;
    this.game.events.on(ABILITY_LOCKED_EVENT, (ability) => this.showLockedToast(ability));

    // * La bannière « Tir débloqué ! » : elle se met en file si deux capacités arrivent en même temps
    this.bannerQueue = [];
    this.bannerOn = false;
    this.game.events.on(ABILITY_UNLOCKED_EVENT, (ability) => {
      this.bannerQueue.push(ability);
      this.showNextBanner();
    });
  }

  // Le texte du mode : « Mode : arcade »
  getControlModeLabel() {
    const mode = getControlMode();
    return mode === CONTROL_MODES.PC ? `Mode : ${mode}` : '';
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

  // * Fin de partie : l'écran de victoire (appelé par WorldScene.winGame)
  showVictory() {
    // * L'écran de victoire : une image plein écran, devant tout le reste de l'interface
    this.add
      .image(this.scale.width / 2, this.scale.height / 2, UI_IMAGES.WIN.KEY)
      .setDepth(DEPTH.VICTORY);

    // * Le chrono final, sous le titre (le chronomètre est déjà arrêté : winGame l'a fait avant)
    const elapsed = timer.elapsed();
    const style = { fontFamily: FONT_FAMILY, fontStyle: 'bold', stroke: VICTORY_TIME.STROKE, strokeThickness: VICTORY_TIME.STROKE_THICKNESS };
    this.add
      .text(this.scale.width / 2, VICTORY_TIME.Y, formatTime(elapsed), { ...style, fontSize: FONT_SIZE.VICTORY_TIME, color: VICTORY_TIME.COLOR })
      .setOrigin(0.5)
      .setDepth(DEPTH.VICTORY + 1);

    // * Le record de ce mode (solo ou multi) : on l'enregistre s'il est battu, et on le dit. Sinon on rappelle le meilleur temps.
    const mode = getGameMode();
    const isRecord = saveBestTime(elapsed, mode);
    const best = getBestTime(mode);
    const line = isRecord ? VICTORY_BEST.RECORD_TEXT : best !== null ? VICTORY_BEST.BEST_LABEL + formatTime(best) : '';
    this.add
      .text(this.scale.width / 2, VICTORY_BEST.Y, line, {
        ...style,
        fontSize: FONT_SIZE.VICTORY_BEST,
        color: isRecord ? VICTORY_BEST.RECORD_COLOR : VICTORY_TIME.COLOR,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.VICTORY + 1);

    // * Entrée : on rejoue. Recharger la page remet TOUT à zéro d'un coup (étoiles, miroirs, énigmes, bulles, caisses, chrono)
    // et ramène à l'écran d'accueil : aucun état ne peut rester d'une partie à l'autre.
    this.add
      .text(this.scale.width / 2, VICTORY_REPLAY.Y, VICTORY_REPLAY.TEXT, { ...style, fontSize: VICTORY_REPLAY.SIZE, color: VICTORY_TIME.COLOR })
      .setOrigin(0.5)
      .setDepth(DEPTH.VICTORY + 1);
    this.input.keyboard.once('keydown-ENTER', () => window.location.reload());
  }

  // Affiche la bannière de la prochaine capacité gagnée, s'il y en a une et qu'aucune n'est déjà à l'écran
  showNextBanner() {
    if (this.bannerOn || this.bannerQueue.length === 0) return;
    this.bannerOn = true;
    const ability = this.bannerQueue.shift();
    const { Y, WIDTH, HEIGHT, SHOW_MS, SLIDE_MS, SLIDE_PX, NAMES, TITLE, BUTTON_SCALE } = PROGRESS.UNLOCK_BANNER;
    const cx = this.scale.width / 2;

    // * Le cadre en parchemin (les couleurs de la boîte de dialogue), en haut de l'écran
    const frame = this.add.graphics();
    frame.fillStyle(DIALOGUE.COLORS.PAPER, 1).fillRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, 18);
    frame.lineStyle(4, DIALOGUE.COLORS.BORDER, 1).strokeRoundedRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, 18);
    const title = this.add
      .text(0, -16, `${NAMES[ability] ?? ability} ${TITLE}`, { fontFamily: FONT_FAMILY, fontSize: '34px', fontStyle: 'bold', color: DIALOGUE.COLORS.TEXT })
      .setOrigin(0.5);

    // * Les touches : un bouton d'arcade de la couleur de l'action pour chaque joueur (le joueur 2 seulement en multi)
    const button = UI_IMAGES[CONTROLS_PAGE.ARCADE_BUTTONS[ability]];
    this.textures.get(button.KEY).setFilter(Phaser.Textures.FilterMode.NEAREST);
    const keys = [BINDINGS.arcade[1][ability], ...(getGameMode() === GAME_MODES.MULTI ? [BINDINGS.arcade[2][ability]] : [])];
    const spacing = 56;
    const items = keys.flatMap((key, i) => {
      const x = (i - (keys.length - 1) / 2) * spacing;
      const image = this.add.image(x, 22, button.KEY).setScale(BUTTON_SCALE);
      const letter = this.add
        .text(x, 20, key, { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: 'bold', color: '#ffffff', stroke: '#2a2236', strokeThickness: 4 })
        .setOrigin(0.5);
      return [image, letter];
    });

    // * Elle descend en s'estompant à l'arrivée, reste un moment, puis s'efface : le jeu ne s'arrête jamais
    const banner = this.add.container(cx, Y - SLIDE_PX, [frame, title, ...items]).setDepth(DEPTH.UI).setAlpha(0);
    this.tweens.add({ targets: banner, y: Y, alpha: 1, duration: SLIDE_MS, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: banner,
      alpha: 0,
      delay: SLIDE_MS + SHOW_MS,
      duration: SLIDE_MS,
      onComplete: () => {
        banner.destroy();
        this.bannerOn = false;
        this.showNextBanner();
      },
    });
  }

  // Affiche « Tir pas encore débloqué » un instant (sans empiler les messages si le joueur appuie en boucle)
  showLockedToast(ability) {
    const { LABELS, TEXT, DURATION_MS, COOLDOWN_MS } = PROGRESS.LOCKED_TOAST;
    if (this.time.now < this.lockedToastUntil) return;
    this.lockedToastUntil = this.time.now + COOLDOWN_MS;
    this.lockedToast.setText(`${LABELS[ability] ?? ability} ${TEXT}`).setAlpha(1);
    this.tweens.killTweensOf(this.lockedToast);
    this.tweens.add({ targets: this.lockedToast, alpha: 0, delay: DURATION_MS - 400, duration: 400 });
  }

  // Le texte du compteur : « Étoiles : 2 / 5 »
  getStarsLabel() {
    return `Étoiles : ${getCollectedStars()} / ${getTotalStars()}`;
  }

  // Le texte du compteur de bulles : « Bulles : 2 / 6 », ou rien dans un monde sans bulles
  // Le texte du compteur d'ennemis : « Ennemis : 2 / 4 », ou rien dans un monde sans ennemis
  getEnemiesLabel() {
    const state = getEnemyState();
    return state ? `Ennemis : ${state.killed} / ${state.total}` : '';
  }

  getBubblesLabel() {
    const state = getBubbleState();
    return state ? `Bulles : ${state.burst} / ${state.total}` : '';
  }

  // update() est appelée à chaque image : on relit le chronomètre et on met le texte à jour
  update() {
    this.timerText.setText(formatTime(timer.elapsed()));
    this.starsText.setText(this.getStarsLabel());
    this.bubblesText.setText(this.getBubblesLabel() || this.getEnemiesLabel()); // un monde a des bulles OU des ennemis : même place
    this.controlModeText.setText(this.getControlModeLabel());
  }
}
