import { markStarCollected } from './StarSystem.js';
import { unlockForStar, unlockMirrorsForStar, ABILITY_UNLOCKED_EVENT } from './ProgressSystem.js';

var nombreEtoiles = 0;
var etoilesPrises = [];

/** Crée l'étoile à (x, y) et la rend ramassable par le joueur. Renvoie le sprite, ou null si elle est déjà prise. */
export function RecolteEtoiles(player, scene, x, y) {
  var id = scene.mapKey + '_' + x + '_' + y;

  if (etoilesPrises.includes(id)) {
    return null;
  }

  var etoile = scene.physics.add.sprite(x, y, 'etoile');
  etoile.starId = id;

  scene.physics.add.overlap(player, etoile, function () {
    recolterEtoile(scene, etoile);
  });

  return etoile;
}

/** Ramasse cette étoile : elle disparaît et compte dans le total du jeu. Sert au ramassage et aux récompenses (énigme). */
export function recolterEtoile(scene, etoile) {
  if (!etoile.active) {
    return;
  }

  etoilesPrises.push(etoile.starId);
  nombreEtoiles += 1;
  markStarCollected(scene.getWorldName(), etoile.starId); // compteur global du jeu (StarSystem)
  // * Ce que cette étoile fait gagner (le tir au monde 1, le dash au monde 4) : l'interface l'annonce par une bannière
  unlockForStar(scene.getWorldName()).forEach((ability) => scene.game.events.emit(ABILITY_UNLOCKED_EVENT, ability));
  unlockMirrorsForStar(scene.getWorldName()); // et les miroirs que cette étoile ouvre (la nuit ouvre le monde post-apo, qui ouvre tous les autres)
  etoile.disableBody(true, true);
}
