import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 5 : la magie.
 * Pour l'instant, il affiche seulement sa carte de test grâce à WorldScene
 * (sa carte est décrite dans WORLD_MAPS, dans constants.js).
 * TODO(équipe): ajouter la mécanique propre au monde 5
 */
export default class World5Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_5, WORLD_MAPS.world_5.key, WORLD_MAPS.world_5.path);
  }
}
