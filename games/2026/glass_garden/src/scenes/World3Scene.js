import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 3 : l'automne.
 * Pour l'instant, il affiche seulement sa carte de test grâce à WorldScene
 * (sa carte est décrite dans WORLD_MAPS, dans constants.js).
 * TODO(équipe): ajouter la mécanique propre au monde 3
 */
export default class World3Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_3, WORLD_MAPS.world_3.key, WORLD_MAPS.world_3.path);
  }
}
