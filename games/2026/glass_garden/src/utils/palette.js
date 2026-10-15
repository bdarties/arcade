// =====================================================================================
// * PALETTE : RECOLORER DES PIXELS SELON LA PALETTE D'UN MONDE
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// Au lieu de redessiner les mêmes tuiles dans une autre couleur pour chaque monde, on garde
// une seule image et on change ses couleurs quand on entre dans le monde.
// Ce fichier ne contient que du calcul : il ne connaît ni Phaser ni les images. Il reçoit des
// pixels, il les recolore, c'est tout. Il se teste donc entièrement en dehors du jeu.
//
// * LES FAMILLES
// Chaque couleur d'origine appartient à une famille (herbe, pierre, eau...). Une palette dit,
// pour chaque famille, comment la recolorer. Les nuances d'une famille sont conservées : la plus
// claire reste la plus claire, la plus foncée reste la plus foncée.
// La famille se décide d'après la couleur D'ORIGINE du pixel, avant tout changement.
//
// * LES DEUX FAÇONS DE DÉCRIRE UNE FAMILLE
//   1) Par réglages : { hue, saturation, lightness }
//        hue         teinte voulue, en degrés (0 à 360 : 28 = orange, 120 = vert, 285 = violet)
//        saturation  multiplicateur : 1 = inchangé, 0,5 = deux fois plus terne
//        lightness   décalage de luminosité : 0 = inchangé, -0,1 = un peu plus foncé
//   2) Par couleur de référence : { color: '#a8703f', reference: '#6bc2bd' }
//        « la couleur d'origine #6bc2bd devient #a8703f », et toutes les autres couleurs de la
//        famille suivent avec les mêmes écarts que ceux qu'elles avaient avec #6bc2bd.
//
// * COMMENT L'UTILISER
//   import { recolorPixels } from '../utils/palette.js';
//
//   // pixels : un tableau d'octets R, G, B, A, R, G, B, A... (par exemple ImageData.data)
//   recolorPixels(pixels, { grass: { hue: 28, saturation: 1.05, lightness: -0.02 } });
//
// ! Les pixels sont modifiés SUR PLACE. Seuls les pixels totalement opaques sont touchés.
// =====================================================================================

// Écart minimal entre le plus grand et le plus petit canal pour qu'une couleur ait une teinte.
// En dessous, c'est un gris (noir, blanc, gris) : famille « neutral ».
const GRAY_LIMIT = 12;

/**
 * Convertit une couleur en teinte / saturation / luminosité.
 * @returns {{h: number, s: number, l: number}} h entre 0 et 1, s et l entre 0 et 1
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sum = max + min;
  const range = max - min;
  const l = sum / 2;

  if (min === max) return { h: 0, s: 0, l };

  const s = l <= 0.5 ? range / sum : range / (2 - max - min);
  const rc = (max - r) / range;
  const gc = (max - g) / range;
  const bc = (max - b) / range;

  let h;
  if (r === max) h = bc - gc;
  else if (g === max) h = 2 + rc - bc;
  else h = 4 + gc - rc;

  return { h: (((h / 6) % 1) + 1) % 1, s, l };
}

// Une des trois composantes de hslToRgb
function channel(m1, m2, hue) {
  hue = ((hue % 1) + 1) % 1;
  if (hue < 1 / 6) return m1 + (m2 - m1) * hue * 6;
  if (hue < 0.5) return m2;
  if (hue < 2 / 3) return m1 + (m2 - m1) * (2 / 3 - hue) * 6;
  return m1;
}

/**
 * Convertit une teinte / saturation / luminosité en couleur.
 * @param {number} h teinte, entre 0 et 1 (tout autre nombre est ramené dans cet intervalle)
 * @returns {number[]} [r, g, b], chacun entre 0 et 255
 */
export function hslToRgb(h, s, l) {
  l = Math.min(1, Math.max(0, l));
  s = Math.min(1, Math.max(0, s));

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const m2 = l <= 0.5 ? l * (1 + s) : l + s - l * s;
    const m1 = 2 * l - m2;
    r = channel(m1, m2, h + 1 / 3);
    g = channel(m1, m2, h);
    b = channel(m1, m2, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/** « #a8703f » devient [168, 112, 63]. */
export function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

/**
 * À quelle famille appartient une couleur d'origine ?
 * @returns {'neutral'|'grass'|'water'|'stone'|'other'}
 */
export function getFamily(r, g, b) {
  if (Math.max(r, g, b) - Math.min(r, g, b) <= GRAY_LIMIT) return 'neutral'; // noir, blanc, gris

  const { h, l } = rgbToHsl(r, g, b);
  const hue = h * 360;
  if (hue >= 70 && hue < 165) return 'grass'; // verts
  if (hue >= 165 && hue < 200) return 'water'; // cyans
  if (hue >= 200 && hue < 260) return 'stone'; // gris-bleus
  if (hue >= 20 && hue < 70 && l > 0.75) return 'stone'; // le sable clair des veines de pierre
  return 'other';
}

/**
 * Recolore des pixels selon une palette, SUR PLACE.
 * @param {Uint8ClampedArray|Uint8Array} pixels  Octets R, G, B, A, R, G, B, A...
 * @param {Object} palette  Une règle par famille (voir l'en-tête du fichier). Une famille sans règle n'est pas touchée.
 * @returns {number} le nombre de pixels modifiés
 */
export function recolorPixels(pixels, palette) {
  const rules = {};
  const references = {};
  let changed = 0;

  for (const family of Object.keys(palette)) {
    const rule = palette[family];
    rules[family] = rule;
    // On calcule une seule fois la référence et la cible des règles « par couleur de référence »
    if (rule.color !== undefined) {
      references[family] = { ref: rgbToHsl(...hexToRgb(rule.reference)), target: rgbToHsl(...hexToRgb(rule.color)) };
    }
  }

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] !== 255) continue; // transparent ou semi-transparent : on n'y touche pas

    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const family = getFamily(r, g, b);
    const rule = rules[family];
    if (!rule) continue;

    const { h, s, l } = rgbToHsl(r, g, b);
    let color;
    if (rule.color !== undefined) {
      // * Par couleur de référence : on garde l'écart entre ce pixel et la couleur de référence d'origine
      const { ref, target } = references[family];
      color = hslToRgb(target.h + (h - ref.h), target.s * (ref.s ? s / ref.s : 1), target.l + (l - ref.l));
    } else {
      // * Par réglages : teinte imposée, saturation multipliée, luminosité décalée
      color = hslToRgb(rule.hue / 360, s * rule.saturation, l + rule.lightness);
    }

    pixels[i] = color[0];
    pixels[i + 1] = color[1];
    pixels[i + 2] = color[2];
    changed++;
  }

  return changed;
}
