import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 1 : la nuit.
 * Pour l'instant, il affiche seulement sa carte de test grâce à WorldScene
 * (sa carte est décrite dans WORLD_MAPS, dans constants.js).
 * TODO(équipe): ajouter la mécanique propre au monde 1 (lampe, exploration dans le noir, étoile)
 */
export default class World1Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_1, WORLD_MAPS.world_1.key, WORLD_MAPS.world_1.path);
  }
}
