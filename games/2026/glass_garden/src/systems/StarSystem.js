// =====================================================================================
// * STAR SYSTEM : COMPTER LES ÉTOILES DU JEU
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// Le nombre total d'étoiles n'est écrit nulle part à la main : il est CALCULÉ en comptant les objets
// « star » posés dans les cartes Tiled. Ajouter ou retirer une étoile dans Tiled suffit, le total suit.
// Les valeurs vivent dans ce fichier, chargé une seule fois pour tout le jeu (comme MirrorSystem).
//
// * COMMENT L'UTILISER
//   import { countStarsInMap, computeStarTotals, getTotalStars } from '../systems/StarSystem.js';
//
//   computeStarTotals(this.cache.tilemap);   // une fois, quand les cartes sont chargées (PreloadScene)
//   getTotalStars();                          // le total, partout ailleurs
//
//   markStarCollected(monde, id);             // quand une étoile est ramassée (appelé par RecolteEtoiles)
//   getCollectedStars();                      // combien d'étoiles sont déjà ramassées
// =====================================================================================

import { WORLD_MAPS } from '../utils/constants.js';

// Nom du calque d'objets et classe Tiled d'une étoile (les mêmes que dans WorldScene.createStars)
const OBJECT_LAYER = 'objects';
const STAR_CLASS = 'star';

let totalStars = 0;
const starsPerWorld = {};

// * Les étoiles ramassées, retenues par monde. Un Set ne garde chaque identifiant qu'une fois :
// ramasser deux fois la même étoile ne compte donc qu'une fois.
const collectedStars = {};

/**
 * Compte les étoiles d'une carte, à partir du JSON exporté de Tiled.
 * Fonction pure : elle ne connaît ni Phaser ni l'état du jeu, elle se teste seule.
 * @param {Object} mapData  Le JSON de la carte (celui de cache.tilemap.get(clé).data)
 * @returns {number}
 */
export function countStarsInMap(mapData) {
  const layer = mapData?.layers?.find((l) => l.type === 'objectgroup' && l.name === OBJECT_LAYER);
  if (!layer) return 0;
  // * Tiled écrit la classe dans « class » (versions récentes) ou « type » (anciennes) : on lit les deux
  return layer.objects.filter((object) => (object.class || object.type) === STAR_CLASS).length;
}

/**
 * Compte les étoiles de TOUTES les cartes de WORLD_MAPS et mémorise le total.
 * @param {Phaser.Cache.BaseCache} tilemapCache  this.cache.tilemap
 * @returns {number} le total
 */
export function computeStarTotals(tilemapCache) {
  totalStars = 0;
  Object.keys(starsPerWorld).forEach((world) => delete starsPerWorld[world]);

  Object.entries(WORLD_MAPS).forEach(([world, { key }]) => {
    // Une carte absente du cache compte 0 : PreloadScene prévient déjà qu'elle est introuvable
    const count = tilemapCache.exists(key) ? countStarsInMap(tilemapCache.get(key).data) : 0;
    starsPerWorld[world] = count;
    totalStars += count;
  });

  // ! Un total de 0 ferait gagner la partie dès le départ (« toutes les étoiles sont prises »)
  if (totalStars === 0) console.warn('[StarSystem] Aucune étoile trouvée dans les cartes : vérifier les objets « star » dans Tiled.');
  return totalStars;
}

/** Le nombre total d'étoiles du jeu (0 tant que computeStarTotals n'a pas été appelée). */
export function getTotalStars() {
  return totalStars;
}

/** Le nombre d'étoiles d'un monde (nom de WORLDS). 0 si le monde est inconnu. */
export function getStarsInWorld(world) {
  return starsPerWorld[world] ?? 0;
}

/**
 * Note qu'une étoile est ramassée. Sans effet si cette étoile l'est déjà.
 * @param {string} world  Le nom du monde (celui de WORLDS)
 * @param {string} id     L'identifiant de l'étoile (unique dans le monde)
 */
export function markStarCollected(world, id) {
  if (!collectedStars[world]) collectedStars[world] = new Set();
  collectedStars[world].add(id);
}

/** Le nombre d'étoiles ramassées dans tout le jeu. */
export function getCollectedStars() {
  return Object.values(collectedStars).reduce((sum, ids) => sum + ids.size, 0);
}

/** Le nombre d'étoiles ramassées dans un monde. */
export function getCollectedStarsInWorld(world) {
  return collectedStars[world]?.size ?? 0;
}

/**
 * Toutes les étoiles de ce monde sont-elles ramassées ?
 * ! Un monde sans étoile dans sa carte renvoie faux (et avertit) : c'est un oubli dans Tiled, et mieux vaut
 * un miroir qui reste qu'un monde verrouillé par erreur.
 * @param {string} world  Le nom du monde (celui de WORLDS)
 */
export function isWorldStarCollected(world) {
  const total = getStarsInWorld(world);
  if (total === 0) {
    console.warn(`[StarSystem] Le monde « ${world} » n'a aucune étoile dans sa carte.`);
    return false;
  }
  return getCollectedStarsInWorld(world) >= total;
}

/** Toutes les étoiles du jeu sont-elles ramassées ? Faux tant que le total n'est pas calculé. */
export function areAllStarsCollected() {
  return totalStars > 0 && getCollectedStars() >= totalStars;
}

/** Remet le compteur à zéro : à appeler au début d'une nouvelle partie. */
export function resetStars() {
  Object.keys(collectedStars).forEach((world) => delete collectedStars[world]);
}
