import { markStarCollected } from './StarSystem.js';

var nombreEtoiles = 0;
var etoilesPrises = [];

export function RecolteEtoiles(player, scene, x, y) {
  var id = scene.mapKey + '_' + x + '_' + y;

  if (etoilesPrises.includes(id)) {
    return;
  }

  var etoile = scene.physics.add.sprite(x, y, 'etoile');

  scene.physics.add.overlap(player, etoile, function () {
    if (!etoile.active) {
      return;
    }

    etoilesPrises.push(id);
    nombreEtoiles += 1;
    markStarCollected(scene.getWorldName(), id); // compteur global du jeu (StarSystem)
    etoile.disableBody(true, true);
  });
}
