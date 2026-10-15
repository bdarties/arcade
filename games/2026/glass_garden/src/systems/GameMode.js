// =====================================================================================
// * GAME MODE : LE MODE DE JEU CHOISI (SOLO OU MULTI)
// =====================================================================================
//
// Le joueur le choisit sur l'écran de choix du mode (ModeScene). Il est retenu ici pour toute la partie : le reste du jeu
// le lit avec getGameMode(). Les valeurs possibles sont celles de GAME_MODES (constants.js).
//
// * COMMENT L'UTILISER
//   import { getGameMode, setGameMode } from '../systems/GameMode.js';
//   setGameMode(GAME_MODES.MULTI);   // sur l'écran de choix du mode
//   if (getGameMode() === GAME_MODES.SOLO) { ... }
// =====================================================================================

import { GAME_MODES } from '../utils/constants.js';

let gameMode = GAME_MODES.SOLO;

/** Le mode de jeu choisi (voir GAME_MODES). Solo tant que rien n'a été choisi. */
export function getGameMode() {
  return gameMode;
}

/** Retient le mode de jeu choisi. */
export function setGameMode(mode) {
  gameMode = mode;
}
