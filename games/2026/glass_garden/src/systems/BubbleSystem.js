// =====================================================================================
// * BUBBLE SYSTEM : LES BULLES À ÉCLATER
// =====================================================================================
//
// Les bulles se posent dans Tiled : des objets « point » de classe « bubble » dans le calque « objects ». Le point est
// le centre de la bulle. Changer une bulle de place, ou en ajouter, se fait dans Tiled, sans toucher au code.
// Une carte sans objet « bubble » n'en a pas.
// Selon la version de Tiled, la classe s'appelle « class » ou « type » : on lit les deux.
//
// Une bulle a une taille (propriété Tiled « size » : large, medium ou small ; sans elle, small). Elle peut se diviser en un autre
// nombre de filles que d'habitude avec la propriété « splitCount » (entier).
// Une bulle flotte et dérive doucement autour de son point. Quand le joueur la touche, elle éclate (animation) puis disparaît.
//
// * COMMENT L'UTILISER
//   preloadBubbles(this);                                          // dans preload()
//   this.bubbles = createBubbles(this, map, this.player, () => ...); // dans create(), une fois le joueur créé
//   this.bubbles.addPlayer?.(this.player2);                           // un 2e joueur qui éclate aussi les bulles
//   // le dernier argument est appelé quand TOUTES les bulles sont éclatées
// =====================================================================================

import { BUBBLES } from '../utils/constants.js';
import { getTiledProperty } from './CrateSystem.js';

// Les cartes dont toutes les bulles ont été éclatées, retenues pour toute la partie (une scène est recréée à chaque visite)
const completedMaps = new Set();

// L'état des bulles du monde en cours ({ total, burst }), ou null s'il n'y en a pas : l'interface l'affiche (voir UIScene)
let currentState = null;

/** Les bulles du monde en cours : { total, burst }, ou null si ce monde n'a pas de bulles à éclater. */
export const getBubbleState = () => currentState;

/** Toutes les bulles de cette carte ont-elles déjà été éclatées ? */
export const isBubblesComplete = (mapKey) => completedMaps.has(mapKey);

/** Charge l'image des bulles (à appeler dans preload). */
export function preloadBubbles(scene) {
  scene.load.spritesheet(BUBBLES.KEY, BUBBLES.IMAGE, { frameWidth: BUBBLES.FRAME_SIZE, frameHeight: BUBBLES.FRAME_SIZE });
}

/**
 * Crée une bulle à la position de chaque objet « bubble » de la carte.
 * @param {Function} onAllBurst  Appelée quand la dernière bulle a éclaté (jamais appelée s'il n'y a aucune bulle)
 * Si toutes les bulles de la carte ont déjà été éclatées lors d'une visite précédente, il n'y en a plus.
 * @returns {{ total: number, burst: number, done: boolean }} le nombre de bulles, le nombre déjà éclatées, et si c'est fini
 */
export function createBubbles(scene, map, player, onAllBurst) {
  // * L'animation d'éclatement est globale à tout le jeu : on ne la crée qu'une fois
  if (!scene.anims.exists(BUBBLES.BURST.KEY)) {
    scene.anims.create({
      key: BUBBLES.BURST.KEY,
      frames: scene.anims.generateFrameNumbers(BUBBLES.KEY, { start: BUBBLES.BURST.FIRST_FRAME, end: BUBBLES.BURST.LAST_FRAME }),
      frameRate: BUBBLES.BURST.FRAME_RATE,
      repeat: 0,
    });
  }

  const floaters = []; // les bulles qui flottent : { bubble, originX, originY, phase }
  const updateFloating = (time) => {
    const { AMPLITUDE_X, AMPLITUDE_Y, SPEED_X, SPEED_Y } = BUBBLES.FLOAT;
    const seconds = time / 1000;
    floaters.forEach(({ bubble, originX, originY, phase }) => {
      if (!bubble.active || bubble.burst) return; // une bulle qui éclate reste où elle est
      bubble.setPosition(originX + Math.sin(seconds * SPEED_X + phase) * AMPLITUDE_X, originY + Math.sin(seconds * SPEED_Y + phase * 1.7) * AMPLITUDE_Y);
    });
  };
  scene.events.on('update', updateFloating);
  scene.events.once('shutdown', () => scene.events.off('update', updateFloating));

  const objects = map.getObjectLayer('objects').objects.filter((object) => (object.class || object.type) === 'bubble');
  if (objects.length > 0 && isBubblesComplete(scene.mapKey)) {
    currentState = null;
    return { total: 0, burst: 0, done: true };
  }
  const players = [player]; // les joueurs qui éclatent les bulles (voir state.addPlayer)

  // * Une bulle et toutes celles qui naîtront d'elle comptent chacune : le total est fixé dès le départ
  // (splitCount : une bulle posée dans Tiled peut se diviser en un autre nombre de filles que BUBBLES.SPLIT, via la propriété « splitCount »)
  const countTree = (size, splitCount) => 1 + (BUBBLES.SPLIT[size] ? (splitCount ?? BUBBLES.SPLIT[size].COUNT) * countTree(BUBBLES.SPLIT[size].INTO) : 0);
  const sizeOf = (object) => {
    const size = getTiledProperty(object, 'size', BUBBLES.DEFAULT_SIZE);
    return BUBBLES.SIZES[size] ? size : BUBBLES.DEFAULT_SIZE;
  };
  const state = { total: objects.reduce((sum, object) => sum + countTree(sizeOf(object), getTiledProperty(object, 'splitCount', undefined)), 0), burst: 0, done: false };
  currentState = objects.length > 0 ? state : null; // pas de compteur dans un monde sans bulles

  // * Où vont s'écarter les bulles filles : autour de la bulle mère, à SPREAD.DISTANCE, en évitant les murs, l'eau, les caisses.
  // Si une direction est bloquée on raccourcit (60 %, puis 30 %), sinon la fille reste sur place.
  const childTargets = (x, y, count, distance = BUBBLES.SPREAD.DISTANCE) => {
    const offset = Math.random() * Math.PI * 2;
    return Array.from({ length: count }, (_, i) => {
      const angle = offset + (i * Math.PI * 2) / count;
      for (const scale of [1, 0.6, 0.3]) {
        const target = { x: x + Math.cos(angle) * distance * scale, y: y + Math.sin(angle) * distance * scale };
        if (!scene.isFreeGround || scene.isFreeGround(target.x, target.y)) return target;
      }
      return { x, y };
    });
  };

  // * Crée une bulle de cette taille (large, medium ou small) centrée sur (x, y).
  // from : si on la donne, c'est une bulle fille : elle naît à ce point (la bulle mère) en grossissant, et s'écarte jusqu'en (x, y).
  const spawnBubble = (x, y, size, from, splitCount) => {
    const { SCALE } = BUBBLES.SIZES[size];
    const bubble = scene.physics.add.sprite(from ? from.x : x, from ? from.y : y, BUBBLES.KEY, 0).setDepth(BUBBLES.DEPTH).setScale(from ? 0 : SCALE);
    bubble.body.setCircle(BUBBLES.HITBOX_RADIUS, BUBBLES.FRAME_SIZE / 2 - BUBBLES.HITBOX_RADIUS, BUBBLES.FRAME_SIZE / 2 - BUBBLES.HITBOX_RADIUS);

    // * Elle flotte autour de son point (voir updateFloating) ; la phase au hasard évite qu'elles bougent toutes ensemble
    const floater = { bubble, originX: from ? from.x : x, originY: from ? from.y : y, phase: Math.random() * Math.PI * 2 };
    floaters.push(floater);

    // * Une bulle fille ne peut pas être touchée pendant qu'elle s'écarte (sinon le joueur, resté au même endroit, la ferait éclater aussitôt)
    if (from) {
      bubble.body.enable = false;
      scene.tweens.add({
        targets: floater,
        originX: x,
        originY: y,
        duration: BUBBLES.SPREAD.DURATION_MS,
        ease: BUBBLES.SPREAD.EASE,
        onComplete: () => {
          if (bubble.active && !bubble.burst) bubble.body.enable = true;
        },
      });
      scene.tweens.add({ targets: bubble, scale: SCALE, duration: BUBBLES.SPREAD.DURATION_MS, ease: BUBBLES.SPREAD.EASE });
    }

    // * Éclater : appelée au contact d'un joueur (le joueur 1 ici, le joueur 2 via state.addPlayer)
    bubble.pop = () => {
      if (bubble.burst) return;
      bubble.burst = true;
      bubble.body.enable = false; // elle ne peut plus être touchée
      bubble.play(BUBBLES.BURST.KEY);
      bubble.once('animationcomplete', () => bubble.destroy());

      // * Elle se divise : ses filles naissent à sa place (avant de la compter, pour que la partie ne finisse pas trop tôt)
      const split = BUBBLES.SPLIT[size];
      if (split) {
        childTargets(bubble.x, bubble.y, splitCount ?? split.COUNT, split.DISTANCE).forEach((target) => spawnBubble(target.x, target.y, split.INTO, { x: bubble.x, y: bubble.y }));
      }

      state.burst += 1;
      if (state.burst === state.total) {
        completedMaps.add(scene.mapKey);
        onAllBurst?.();
      }
    };
    players.forEach((p) => scene.physics.add.overlap(p, bubble, bubble.pop));
    return bubble;
  };

  // * Brancher un joueur de plus (le joueur 2, créé après les bulles) : il éclate aussi les bulles déjà là et les futures filles
  state.addPlayer = (extraPlayer) => {
    players.push(extraPlayer);
    floaters.forEach(({ bubble }) => bubble.active && !bubble.burst && scene.physics.add.overlap(extraPlayer, bubble, bubble.pop));
  };

  objects.forEach((object) => spawnBubble(object.x, object.y, sizeOf(object), undefined, getTiledProperty(object, 'splitCount', undefined)));

  return state;
}
