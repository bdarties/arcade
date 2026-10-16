// =====================================================================================
// * INTRO SYSTEM : LA MÉMOIRE « UNE INTRO EST À JOUER »
// =====================================================================================
//
// Quand le joueur choisit son mode, une nouvelle partie commence : le jardin joue alors une petite intro (voir WorldScene.playIntro).
// Une scène est recréée à chaque visite, elle ne peut pas savoir si c'est le début de la partie : ce fichier le retient, comme TimerSystem.
//
// * COMMENT L'UTILISER
//   import { requestIntro, consumeIntro } from '../systems/IntroSystem.js';
//   requestIntro();                       // au lancement d'une nouvelle partie (ModeScene)
//   if (consumeIntro()) { /* jouer l'intro */ }   // à la création du jardin : vrai UNE seule fois par demande
// =====================================================================================

let pending = false;

/** Demande l'intro pour la prochaine création du jardin. */
export function requestIntro() {
  pending = true;
}

/** Vrai une seule fois après requestIntro() : l'intro est alors considérée comme prise en charge. */
export function consumeIntro() {
  const wasPending = pending;
  pending = false;
  return wasPending;
}
