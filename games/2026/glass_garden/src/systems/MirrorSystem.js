// =====================================================================================
// * MIRROR SYSTEM : LA MÉMOIRE DES MIROIRS UTILISÉS
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// Quand le joueur revient dans le jardin, le miroir qu'il avait pris pour partir disparaît.
// Une scène est recréée à chaque visite : elle ne peut pas se souvenir de ça. Cette liste
// vit dans ce fichier, qui n'est chargé qu'une seule fois pour tout le jeu (comme TimerSystem).
//
// * LES MIROIRS SONT RETENUS PAR LEUR NOM
// Le nom d'un miroir dans Tiled est le monde qu'il ouvre (« world_1 »). On retient donc
// « le miroir du monde world_1 est utilisé ».
//
// * COMMENT L'UTILISER
//   import { isMirrorUsed, markMirrorUsed, shouldMirrorDisappear } from '../systems/MirrorSystem.js';
// =====================================================================================

import { isWorldStarCollected } from './StarSystem.js';

const usedMirrors = [];

/** Ce miroir est-il déjà utilisé (donc disparu) ? */
export function isMirrorUsed(world) {
  return usedMirrors.includes(world);
}

/** Marque le miroir de ce monde comme utilisé. Sans effet s'il l'est déjà. */
export function markMirrorUsed(world) {
  if (!isMirrorUsed(world)) {
    usedMirrors.push(world);
  }
}

/** Remet tous les miroirs en place : à appeler au début d'une nouvelle partie. */
export function resetMirrors() {
  usedMirrors.length = 0;
}

/**
 * Le miroir de ce monde doit-il disparaître quand le joueur revient dans le jardin ?
 * * Oui seulement si l'étoile de ce monde est ramassée. Sans elle, le miroir reste : le joueur peut y retourner.
 */
export function shouldMirrorDisappear(world) {
  return isWorldStarCollected(world);
}
