// =====================================================================================
// * STAR BOUNCE : L'ÉTOILE QUI SAUTE ET REBONDIT
// =====================================================================================
//
// L'étoile part de la tête d'un personnage, dans une direction au hasard, et rebondit en ligne droite sur le sol :
// chaque rebond est plus petit que le précédent (pesanteur + rebond amorti), jusqu'à l'arrêt.
// On suit deux choses : la position au SOL (qui avance en ligne droite) et la HAUTEUR au-dessus du sol (qui monte
// et retombe). L'étoile est dessinée à « position au sol moins hauteur », avec une petite ombre sur le sol.
//
// La direction est choisie au hasard parmi celles dont tout le chemin est libre (ni mur, ni eau, ni miroir,
// ni personnage, ni bord de la carte). Si aucune ne l'est, le trajet est raccourci, puis l'étoile retombe sur place.
// =====================================================================================

import { STAR_BOUNCE } from '../utils/constants.js';

const { GRAVITY, RESTITUTION, MIN_BOUNCE_SPEED } = STAR_BOUNCE;

/** Les vols successifs : [{ start, duration, startHeight, startSpeed }], le premier part de la hauteur de la tête. */
function planFlights(startHeight) {
  const flights = [];
  let height = startHeight;
  let speed = STAR_BOUNCE.LAUNCH_SPEED;
  let start = 0;
  while (true) {
    const impact = Math.sqrt(speed * speed + 2 * GRAVITY * height); // la vitesse en touchant le sol
    const duration = (speed + impact) / GRAVITY;
    flights.push({ start, duration, startHeight: height, startSpeed: speed });
    start += duration;
    speed = impact * RESTITUTION;
    height = 0;
    if (speed < MIN_BOUNCE_SPEED) return flights; // trop petit : il s'arrête
  }
}

/**
 * Fait sauter l'étoile depuis (x, y) (les pieds du personnage), à la hauteur headHeight.
 * @param {Phaser.Physics.Arcade.Sprite} star  L'étoile (ramassable quand elle s'est posée)
 * @param {{x: number, y: number, headHeight: number}} from  Les pieds du personnage et la hauteur de sa tête
 * @param {(x: number, y: number) => boolean} isFree  Vrai si l'étoile peut se poser en ce point du sol
 * @param {{distanceScale?: number, spin?: boolean, onLanded?: (x: number, y: number) => void}} [options]
 *   distanceScale : 1 par défaut ; 0,5 va deux fois moins loin (les bombes). spin : faux = ne tourne pas.
 *   onLanded : appelée à l'arrivée au sol, à la place de « étoile ramassable » (la bombe explose).
 */
export function bounceStar(scene, star, from, isFree, options = {}) {
  const { distanceScale = 1, spin = true, onLanded } = options;
  const flights = planFlights(from.headHeight);
  const total = flights[flights.length - 1].start + flights[flights.length - 1].duration;

  // * La direction : on essaie 24 directions réparties sur le cercle, dans un ordre au hasard, et on garde la première
  // dont tout le chemin est libre (on regarde un point tous les 10 pixels, sauf tout près du départ, où l'étoile est
  // encore au-dessus du personnage). Si rien n'est libre, on raccourcit le trajet (60 %, puis 30 %).
  const isPathFree = (angle, length) => {
    for (let d = 24; d <= length; d += 10) {
      if (!isFree(from.x + Math.cos(angle) * d, from.y + Math.sin(angle) * d)) return false;
    }
    return isFree(from.x + Math.cos(angle) * length, from.y + Math.sin(angle) * length);
  };
  const offset = Math.random() * ((Math.PI * 2) / STAR_BOUNCE.DIRECTIONS);
  const angles = Phaser.Utils.Array.Shuffle(
    Array.from({ length: STAR_BOUNCE.DIRECTIONS }, (_, i) => offset + (i * Math.PI * 2) / STAR_BOUNCE.DIRECTIONS),
  );
  let angle = Math.PI / 2; // dernier recours : l'étoile retombe sur place
  let speed = 0;
  search: for (const scale of [1, 0.6, 0.3]) {
    for (const tryAngle of angles) {
      const trySpeed = Phaser.Math.FloatBetween(STAR_BOUNCE.SPEED.MIN, STAR_BOUNCE.SPEED.MAX) * scale * distanceScale;
      if (isPathFree(tryAngle, trySpeed * total)) {
        angle = tryAngle;
        speed = trySpeed;
        break search;
      }
    }
  }

  // * L'étoile apparaît à la hauteur de la tête et n'est pas ramassable en vol
  star.enableBody(true, from.x, from.y - from.headHeight, true, true);
  star.body.enable = false;
  star.setDepth(STAR_BOUNCE.DEPTH);
  const shadow = scene.add.ellipse(from.x, from.y, 18, 7, 0x000000, 0.25).setDepth(STAR_BOUNCE.DEPTH - 1);

  let elapsed = 0;
  const onUpdate = (time, delta) => {
    elapsed = Math.min(elapsed + delta / 1000, total);
    const flight = flights.find((f) => elapsed <= f.start + f.duration) || flights[flights.length - 1];
    const t = elapsed - flight.start;
    const height = Math.max(flight.startHeight + flight.startSpeed * t - 0.5 * GRAVITY * t * t, 0);
    const groundX = from.x + Math.cos(angle) * speed * elapsed;
    const groundY = from.y + Math.sin(angle) * speed * elapsed;

    star.setPosition(groundX, groundY - height);
    if (spin) star.angle += (STAR_BOUNCE.SPIN_DEG_PER_S * delta) / 1000 * (height > 0 ? 1 : 0);
    shadow.setPosition(groundX, groundY).setScale(1 - Math.min(height, 100) / 160); // l'ombre rétrécit quand l'étoile monte

    if (elapsed >= total) {
      scene.events.off('update', onUpdate);
      shadow.destroy();
      star.setAngle(0).setDepth(0);
      if (onLanded) {
        star.setPosition(groundX, groundY);
        onLanded(groundX, groundY);
      } else {
        star.enableBody(true, groundX, groundY, true, true); // posée : elle peut être ramassée
      }
    }
  };
  scene.events.on('update', onUpdate);
  scene.events.once('shutdown', () => scene.events.off('update', onUpdate)); // si on quitte le monde en plein vol
}
