// =====================================================================================
// * PROGRESS SYSTEM : CE QUE LE JOUEUR A DÉBLOQUÉ
// =====================================================================================
//
// Le tir et le dash sont VERROUILLÉS au début de la partie : le joueur les gagne en avançant (voir PROGRESS dans constants.js).
// L'état vit dans ce fichier, chargé une seule fois pour toute la partie (une scène est recréée à chaque visite d'un monde).
// Il repart à zéro quand on recharge la page (nouvelle partie).
//
// * COMMENT L'UTILISER
//   import { ABILITIES, isUnlocked, unlock, notifyLocked } from '../systems/ProgressSystem.js';
//
//   if (isUnlocked(ABILITIES.SHOOT)) shoot(...);
//   else notifyLocked(this, ABILITIES.SHOOT);   // l'interface affiche « Tir pas encore débloqué »
//   unlock(ABILITIES.SHOOT);                    // le joueur vient de gagner le tir
//   unlockForStar('world_1');                   // l'étoile du monde 1 vient d'être ramassée : renvoie ce qu'elle débloque
// =====================================================================================

import { PROGRESS } from '../utils/constants.js';

export const ABILITIES = { SHOOT: 'shoot', DASH: 'dash' };

// * L'événement envoyé quand le joueur appuie sur une action encore verrouillée (l'interface l'écoute, voir UIScene)
export const ABILITY_LOCKED_EVENT = 'ability-locked';

// * L'événement envoyé quand le joueur vient de gagner une capacité (l'interface affiche une bannière, voir UIScene)
export const ABILITY_UNLOCKED_EVENT = 'ability-unlocked';

const unlocked = new Set();

/** Cette capacité est-elle débloquée ? */
export const isUnlocked = (ability) => unlocked.has(ability);

/** Débloque une capacité. */
export const unlock = (ability) => unlocked.add(ability);

/** Remet tout en place : à appeler au début d'une nouvelle partie. */
export const resetProgress = () => {
  unlocked.clear();
  openMirrors.clear();
  pendingOpenAnimations.clear();
  PROGRESS.MIRRORS_OPEN_AT_START.forEach((mirror) => openMirrors.add(mirror));
};

/** Prévient l'interface que le joueur a essayé une action verrouillée (elle affiche un message bref). */
export const notifyLocked = (scene, ability) => scene.game.events.emit(ABILITY_LOCKED_EVENT, ability);

/**
 * Appelée quand l'étoile d'un monde est ramassée : débloque ce que ce monde donne (voir PROGRESS.STAR_UNLOCKS).
 * @param {string} world  Le nom du monde (ex. « world_1 »)
 * @returns {string[]} les capacités qui viennent d'être débloquées (vide si l'étoile ne donne rien, ou si elles l'étaient déjà)
 */
export function unlockForStar(world) {
  const gained = (PROGRESS.STAR_UNLOCKS[world] ?? []).filter((ability) => !isUnlocked(ability));
  gained.forEach(unlock);
  return gained;
}

// --- LES MIROIRS ---------------------------------------------------------------------------------------------------------------
// Tous les miroirs du jardin sont verrouillés au départ, sauf ceux de PROGRESS.MIRRORS_OPEN_AT_START. Ramasser une étoile en ouvre d'autres.

const lockableMirrors = new Set([...PROGRESS.MIRRORS_OPEN_AT_START, ...Object.values(PROGRESS.MIRROR_UNLOCKS).flat()]);
const openMirrors = new Set(PROGRESS.MIRRORS_OPEN_AT_START);
// Les miroirs qui viennent de s'ouvrir et dont le cadenas n'a pas encore été vu s'ouvrir (le jardin joue l'animation à la prochaine visite)
const pendingOpenAnimations = new Set();

/** Ce miroir (de ce monde) est-il verrouillé ? Un miroir qui n'est pas dans la progression (celui de retour dans un monde) ne l'est jamais. */
export const isMirrorLocked = (world) => lockableMirrors.has(world) && !openMirrors.has(world);

/** Le monde dont il faut ramasser l'étoile pour ouvrir le miroir de ce monde (pour le message), ou undefined. */
export const getMirrorUnlocker = (world) => Object.keys(PROGRESS.MIRROR_UNLOCKS).find((key) => PROGRESS.MIRROR_UNLOCKS[key].includes(world));

/**
 * Appelée quand l'étoile d'un monde est ramassée : ouvre les miroirs que ce monde ouvre (voir PROGRESS.MIRROR_UNLOCKS).
 * @returns {string[]} les miroirs qui viennent de s'ouvrir
 */
export function unlockMirrorsForStar(world) {
  const opened = (PROGRESS.MIRROR_UNLOCKS[world] ?? []).filter((mirror) => !openMirrors.has(mirror));
  opened.forEach((mirror) => {
    openMirrors.add(mirror);
    pendingOpenAnimations.add(mirror);
  });
  return opened;
}

/** Les miroirs dont le cadenas doit s'ouvrir à cette visite du jardin (puis la liste est vidée : l'animation ne se rejoue pas). */
export function takePendingMirrorAnimations() {
  const pending = [...pendingOpenAnimations];
  pendingOpenAnimations.clear();
  return pending;
}
