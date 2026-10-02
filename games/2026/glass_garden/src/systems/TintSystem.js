// =====================================================================================
// * TINT SYSTEM : DONNER SA TEINTE À UN MONDE
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// Chaque monde a son ambiance de couleurs. Ici on utilise la solution simple de Phaser : une teinte (« tint »)
// posée sur les tuiles, qui multiplie leurs couleurs. Aucune image n'est modifiée ni copiée.
// (La recoloration complète, plus fidèle, est dans PaletteSystem.js : elle n'est plus appelée pour l'instant.)
//
// * COMMENT ÇA MARCHE
// Les tuiles de tileset_garden sont rangées en familles (herbe, pierre, eau) par numéro, dans TILE_GROUPS.
// Chaque tuile reçoit la teinte de sa famille ; les autres (décors, noir, cases vides) restent telles quelles.
// Les tuiles d'eau animée ne sont pas des tuiles mais des sprites : ils reçoivent la teinte de l'eau.
//
// ! La teinte des tuiles ne marche qu'avec WebGL (Phaser.AUTO le choisit quand c'est possible).
//
// * COMMENT L'UTILISER
//   import { applyTint } from '../systems/TintSystem.js';
//   applyTint(map, waterSprites, 'night');
// =====================================================================================

import { TILE_GROUPS, TINTS } from '../utils/constants.js';

// La famille d'une tuile d'après son numéro, ou undefined si elle n'en a pas
function getFamily(tileIndex) {
  return Object.keys(TILE_GROUPS).find((family) =>
    TILE_GROUPS[family].some(([first, last]) => tileIndex >= first && tileIndex <= last),
  );
}

/**
 * Teinte les calques d'une carte et les sprites d'eau selon une teinte de TINTS.
 * Sans nom de teinte (le jardin), ne fait rien. Un nom inconnu avertit et ne fait rien non plus.
 * @param {Phaser.Tilemaps.Tilemap} map  La carte, dont les calques sont déjà créés
 * @param {Phaser.GameObjects.Sprite[]} waterSprites  Les sprites de l'eau animée
 * @param {string} [tintName]  Une clé de TINTS (voir WORLD_TINTS)
 */
export function applyTint(map, waterSprites, tintName) {
  if (!tintName) return;

  const tint = TINTS[tintName];
  if (!tint) {
    console.warn(`[TintSystem] Teinte inconnue : « ${tintName} » (voir TINTS dans constants.js).`);
    return;
  }

  map.layers.forEach((layerData) => {
    layerData.tilemapLayer?.forEachTile((tile) => {
      const family = getFamily(tile.index);
      if (family) tile.tint = tint[family];
    });
  });

  waterSprites.forEach((sprite) => sprite.setTint(tint.water));
}
