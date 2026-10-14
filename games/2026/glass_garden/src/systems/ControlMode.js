// =====================================================================================
// * CONTROL MODE : LE MODE DE CONTRÔLE ACTUEL (ARCADE OU PC)
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// La borne d'arcade n'a pas les mêmes touches qu'un clavier d'ordinateur. Pour tester sur PC, on veut pouvoir
// passer d'un mode à l'autre. Le mode actuel vit dans ce fichier, chargé une seule fois pour tout le jeu
// (comme TimerSystem) : une scène est recréée à chaque téléportation, elle ne pourrait pas s'en souvenir.
//
// * COMMENT L'UTILISER
//   import { getControlMode, toggleControlMode } from '../systems/ControlMode.js';
//
//   getControlMode();      // 'arcade' ou 'pc'
//   toggleControlMode();   // passe de l'un à l'autre et renvoie le nouveau mode
// =====================================================================================

import { CONTROL_MODES, DEFAULT_CONTROL_MODE } from '../utils/constants.js';

let controlMode = DEFAULT_CONTROL_MODE;

/** Le mode de contrôle actuel (voir CONTROL_MODES). */
export function getControlMode() {
  return controlMode;
}

/** Passe d'arcade à pc, ou de pc à arcade. @returns {string} le nouveau mode */
export function toggleControlMode() {
  controlMode = controlMode === CONTROL_MODES.ARCADE ? CONTROL_MODES.PC : CONTROL_MODES.ARCADE;
  return controlMode;
}
