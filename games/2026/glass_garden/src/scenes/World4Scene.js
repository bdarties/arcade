import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 4 : l'apocalypse.
 * Pour l'instant, il affiche seulement sa carte de test grâce à WorldScene
 * (sa carte est décrite dans WORLD_MAPS, dans constants.js).
 * TODO(équipe): ajouter la mécanique propre au monde 4 (cibles, caisses, tir)
 */
export default class World4Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_4, WORLD_MAPS.world_4.key, WORLD_MAPS.world_4.path);
  }
}
