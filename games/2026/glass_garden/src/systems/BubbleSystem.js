// =====================================================================================
// * BUBBLE SYSTEM : LES BULLES À ÉCLATER
// =====================================================================================
//
// Les bulles se posent dans Tiled : des objets « point » de classe « bubble » dans le calque « objects ». Le point est
// le centre de la bulle. Changer une bulle de place, ou en ajouter, se fait dans Tiled, sans toucher au code.
// Une carte sans objet « bubble » n'en a pas.
// Selon la version de Tiled, la classe s'appelle « class » ou « type » : on lit les deux.
//
// Une bulle flotte et dérive doucement autour de son point. Quand le joueur la touche, elle éclate (animation) puis disparaît.
//
// * COMMENT L'UTILISER
//   preloadBubbles(this);                                          // dans preload()
//   this.bubbles = createBubbles(this, map, this.player, () => ...); // dans create(), une fois le joueur créé
//   // le dernier argument est appelé quand TOUTES les bulles sont éclatées
// =====================================================================================

import { BUBBLES } from '../utils/constants.js';

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
  const state = { total: objects.length, burst: 0, done: false };
  currentState = objects.length > 0 ? state : null; // pas de compteur dans un monde sans bulles

  objects.forEach((object) => {
    const bubble = scene.physics.add.sprite(object.x, object.y, BUBBLES.KEY, 0).setDepth(BUBBLES.DEPTH);
    bubble.body.setCircle(BUBBLES.HITBOX_RADIUS, BUBBLES.FRAME_SIZE / 2 - BUBBLES.HITBOX_RADIUS, BUBBLES.FRAME_SIZE / 2 - BUBBLES.HITBOX_RADIUS);

    // * Elle flotte autour de son point (voir updateFloating) ; la phase au hasard évite qu'elles bougent toutes ensemble
    floaters.push({ bubble, originX: object.x, originY: object.y, phase: Math.random() * Math.PI * 2 });

    scene.physics.add.overlap(player, bubble, () => {
      if (bubble.burst) return;
      bubble.burst = true;
      bubble.body.enable = false; // elle ne peut plus être touchée
      bubble.play(BUBBLES.BURST.KEY);
      bubble.once('animationcomplete', () => bubble.destroy());

      state.burst += 1;
      if (state.burst === state.total) {
        completedMaps.add(scene.mapKey);
        onAllBurst?.();
      }
    });
  });

  return state;
}
