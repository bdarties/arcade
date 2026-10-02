// =====================================================================================
// * SAVE SYSTEM : LA SAUVEGARDE DU MEILLEUR TEMPS
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// Le temps total de la partie est le score : plus il est court, mieux c'est.
// Il faut garder le meilleur temps même quand on ferme le jeu.
//
// * OÙ EST-CE STOCKÉ
// Dans le « localStorage » du navigateur : de petites données qui restent après la fermeture
// de l'onglet. Seul ce fichier y touche, le reste du jeu passe par ses fonctions.
//
// * UN RECORD PAR MODE
// Chaque mode de jeu (solo, multi) a son propre meilleur temps (voir GAME_MODES).
// Sans précision, c'est le mode solo.
//
// * COMMENT L'UTILISER
//   import { getBestTime, saveBestTime } from '../systems/SaveSystem.js';
//
//   getBestTime();                  // meilleur temps en ms, ou null s'il n'y en a pas
//   saveBestTime(timer.elapsed());  // true si c'est un nouveau record, false sinon
//
// ! Le localStorage peut être indisponible (navigation privée, réglages du navigateur) :
// chaque fonction est protégée, et le jeu continue simplement sans sauvegarde.
//
// TODO(équipe): classement avec pseudos. Remplacer le record unique par une liste triée
// de résultats { pseudo, temps }, avec un top 10 par mode, rangée en JSON dans le localStorage.
// (Le localStorage suffit pour une seule borne : le classement reste sur cette machine.)
// TODO(équipe): session. Le joueur saisit son pseudo au début de la partie et le chrono est lié
// à ce pseudo. Sur la borne, pas de clavier : écran de saisie de lettres au joystick, façon arcade.
// =====================================================================================

import { GAME_MODES, STORAGE_KEYS } from '../utils/constants.js';

// Nom de la donnée pour un mode : « glass_garden_best_time_solo »
function storageKey(mode) {
  return STORAGE_KEYS.BEST_TIME_PREFIX + mode;
}

/**
 * Meilleur temps enregistré.
 * @param {string} mode  Mode de jeu (voir GAME_MODES)
 * @returns {number|null} millisecondes, ou null s'il n'y a pas de record (ou s'il est illisible)
 */
export function getBestTime(mode = GAME_MODES.SOLO) {
  try {
    const stored = localStorage.getItem(storageKey(mode));
    if (stored === null) return null;

    // * Une valeur modifiée à la main ou abîmée n'est pas un temps valide : on l'ignore
    const milliseconds = Number(stored);
    return Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : null;
  } catch {
    return null;
  }
}

/**
 * Enregistre un temps s'il bat le record (ou s'il n'y en a pas encore).
 * @param {number} milliseconds  Temps de la partie
 * @param {string} mode          Mode de jeu (voir GAME_MODES)
 * @returns {boolean} true si c'est un nouveau record enregistré, false sinon
 */
export function saveBestTime(milliseconds, mode = GAME_MODES.SOLO) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return false;

  const best = getBestTime(mode);
  if (best !== null && milliseconds >= best) return false;

  try {
    localStorage.setItem(storageKey(mode), String(Math.round(milliseconds)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Efface le record d'un mode (utile pour tester).
 * @param {string} mode  Mode de jeu (voir GAME_MODES)
 */
export function resetBestTime(mode = GAME_MODES.SOLO) {
  try {
    localStorage.removeItem(storageKey(mode));
  } catch {
    // Rien à faire : sans localStorage, il n'y a rien à effacer
  }
}



