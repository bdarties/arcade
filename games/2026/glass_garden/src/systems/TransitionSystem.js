// =====================================================================================
// * TRANSITION SYSTEM : LE PASSAGE ENTRE DEUX MONDES
// =====================================================================================
//
// Un « iris » : un rectangle noir plein écran, percé d'un trou rond. Le trou est un cercle dessiné dans un
// Graphics invisible, utilisé comme masque INVERSÉ (le noir n'est visible qu'en dehors du cercle).
// - irisClose : le trou rétrécit jusqu'à zéro (écran noir), centré sur le miroir pris.
// - irisOpen  : le trou grandit depuis zéro (le nouveau monde apparaît), centré sur le miroir d'arrivée.
//
// ! Les masques ne marchent qu'avec WebGL (Phaser.AUTO le choisit quand c'est possible).
//
// * COMMENT L'UTILISER
//   import { irisClose, irisOpen } from '../systems/TransitionSystem.js';
//   irisClose(this, mirror.x, mirror.y, () => this.scene.start(...));
//   irisOpen(this, mirror.x, mirror.y, () => { /* le monde est entièrement visible */ });
// =====================================================================================

import { GAME_WIDTH, GAME_HEIGHT, DEPTH, TRANSITION } from '../utils/constants.js';

// Le cercle qui couvre tout l'écran : son rayon va jusqu'au coin le plus éloigné du centre (x, y)
const fullRadius = (x, y) => Math.hypot(Math.max(x, GAME_WIDTH - x), Math.max(y, GAME_HEIGHT - y));

/** Anime le trou rond centré sur (x, y), de fromRadius à toRadius, puis appelle onComplete. */
function animateIris(scene, x, y, fromRadius, toRadius, duration, ease, onComplete) {
  const cover = scene.add
    .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, TRANSITION.COLOR)
    .setOrigin(0, 0)
    .setDepth(DEPTH.TRANSITION);

  const hole = scene.make.graphics({ add: false });
  const mask = hole.createGeometryMask();
  mask.setInvertAlpha(true);
  cover.setMask(mask);

  const circle = { radius: fromRadius };
  const drawHole = () => hole.clear().fillStyle(0xffffff).fillCircle(x, y, circle.radius);
  drawHole(); // dès la première image, sinon l'écran serait tout noir (ou tout visible) un instant

  scene.tweens.add({
    targets: circle,
    radius: toRadius,
    duration,
    ease,
    onUpdate: drawHole,
    onComplete,
  });
  return cover;
}

/** Referme un cercle noir sur le point (x, y), puis appelle onComplete quand l'écran est noir. */
export function irisClose(scene, x, y, onComplete) {
  animateIris(scene, x, y, fullRadius(x, y), 0, TRANSITION.IRIS_CLOSE_MS, TRANSITION.IRIS_CLOSE_EASE, onComplete);
}

/** Ouvre un cercle depuis le point (x, y) : l'écran noir laisse apparaître le monde, puis le calque est retiré. */
export function irisOpen(scene, x, y, onComplete) {
  const cover = animateIris(scene, x, y, 0, fullRadius(x, y), TRANSITION.IRIS_OPEN_MS, TRANSITION.IRIS_OPEN_EASE, () => {
    cover.destroy();
    onComplete?.();
  });
}
