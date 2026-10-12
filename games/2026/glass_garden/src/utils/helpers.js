// * Petites fonctions utilitaires, sans lien avec Phaser.

// Ajoute un zéro devant les nombres à un chiffre : 5 -> « 05 »
function pad(number) {
  return String(number).padStart(2, '0');
}

/**
 * Choisit une variante (0, 1, 2...) d'après la position d'une case : c'est « au hasard »
 * en apparence, mais le résultat est TOUJOURS le même pour une même case, à chaque lancement.
 * On n'utilise pas un hasard pur pour que la carte ne change pas d'un lancement à l'autre.
 * (Un simple calcul comme x + y donnait la même variante aux bords d'un carré : d'où le mélange de bits.)
 * @param {number} x      Colonne de la case
 * @param {number} y      Ligne de la case
 * @param {number} count  Nombre de variantes possibles
 * @returns {number} un entier entre 0 et count - 1
 */
export function pickVariant(x, y, count) {
  let hash = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0;
  hash = (hash ^ (hash >>> 16)) >>> 0;

  return hash % count;
}

/**
 * Transforme une durée en texte « mm:ss.d » (minutes, secondes, dixièmes de seconde).
 * Exemple : 83400 ms -> « 01:23.4 »
 * @param {number} milliseconds
 * @returns {string}
 */
export function formatTime(milliseconds) {
  const totalTenths = Math.floor(milliseconds / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  return `${pad(minutes)}:${pad(seconds)}.${tenths}`;
}
