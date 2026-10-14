import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 2 : le rêve.
 * Pour l'instant, il affiche seulement sa carte de test grâce à WorldScene
 * (sa carte est décrite dans WORLD_MAPS, dans constants.js).
 * TODO(équipe): ajouter la mécanique propre au monde 2 (ennemis, tir)
 */
export default class World2Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_2, WORLD_MAPS.world_2.key, WORLD_MAPS.world_2.path);
  }
}
