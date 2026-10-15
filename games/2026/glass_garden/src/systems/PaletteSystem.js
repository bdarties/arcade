// =====================================================================================
// * PALETTE SYSTEM : FABRIQUER UNE COPIE RECOLORÉE D'UNE TEXTURE
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// Le calcul des couleurs est dans src/utils/palette.js (sans Phaser). Ici, on fait la partie qui
// touche à Phaser : on prend une image déjà chargée, on en fabrique une COPIE recolorée, et on la
// range dans Phaser sous sa propre clé (par exemple « tileset_garden@magic »).
//
// * POURQUOI UNE COPIE ET PAS L'ORIGINAL
// L'image d'origine n'est jamais touchée : le jardin, qui garde ses couleurs, continue de l'utiliser.
// On n'efface rien non plus (supprimer une texture fait planter les objets qui l'utilisent encore).
// La copie est gardée en mémoire : si on revient dans le monde, elle est réutilisée sans être refaite.
//
// * COMMENT L'UTILISER
//   import { getPaletteTexture } from '../systems/PaletteSystem.js';
//
//   const key = getPaletteTexture(this, ASSETS.TILESET_GARDEN, 'magic');
//   // key vaut « tileset_garden@magic » : on s'en sert à la place de ASSETS.TILESET_GARDEN
// =====================================================================================

import { PALETTES } from '../utils/constants.js';
import { recolorPixels } from '../utils/palette.js';

/**
 * Renvoie la clé de la texture à utiliser pour une palette : une copie recolorée si la palette existe,
 * sinon la texture d'origine. La copie est fabriquée au premier appel, puis réutilisée.
 *
 * @param {Phaser.Scene} scene          La scène qui en a besoin
 * @param {string} baseKey              Clé de la texture d'origine (déjà chargée)
 * @param {string} [paletteName]        Nom de la palette (clé de PALETTES). Vide : pas de recoloration.
 * @param {{width: number, height: number}} [frameSize]  Pour un spritesheet : taille d'une image. La copie reçoit
 *                                      alors ses images numérotées, comme un spritesheet chargé par Phaser.
 * @returns {string} la clé de texture à utiliser
 */
export function getPaletteTexture(scene, baseKey, paletteName, frameSize) {
  const palette = PALETTES[paletteName];
  const textures = scene.textures;

  // * Sans palette (le jardin) ou sans texture d'origine : on garde l'original, sans rien fabriquer
  if (!palette || !textures.exists(baseKey)) return baseKey;

  const key = `${baseKey}@${paletteName}`;
  if (textures.exists(key)) return key; // déjà fabriquée lors d'une visite précédente

  const { width, height } = textures.get(baseKey).source[0];
  const copy = textures.createCanvas(key, width, height);

  // On dessine l'image d'origine sur le canvas, on lit ses pixels, on les recolore, on les remet
  copy.context.drawImage(textures.get(baseKey).getSourceImage(), 0, 0);
  const imageData = copy.context.getImageData(0, 0, width, height);
  recolorPixels(imageData.data, palette);
  copy.context.putImageData(imageData, 0, 0);

  // * Un spritesheet est découpé en images numérotées (0, 1, 2... ligne par ligne) : on refait ce découpage
  if (frameSize) {
    const columns = Math.floor(width / frameSize.width);
    const rows = Math.floor(height / frameSize.height);
    for (let index = 0; index < columns * rows; index++) {
      copy.add(index, 0, (index % columns) * frameSize.width, Math.floor(index / columns) * frameSize.height, frameSize.width, frameSize.height);
    }
  }

  copy.refresh(); // envoie les nouveaux pixels à la carte graphique : sans ça, l'ancienne image resterait affichée
  return key;
}
