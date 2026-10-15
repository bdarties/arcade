// =====================================================================================
// * BOMB SYSTEM : LES BOMBES CACHÉES DANS LES CAISSES
// =====================================================================================
//
// Certaines caisses cachent une bombe (propriété Tiled « hasBomb » cochée sur la caisse). Quand la caisse casse, la bombe
// en jaillit, saute et rebondit comme l'étoile (voir StarBounce.js) mais va deux fois moins loin. Une fois posée, sa
// mèche clignote un instant (BOMB.FUSE_MS), puis elle explose.
//
// * L'EXPLOSION (rayon BOMB.RADIUS)
//   - un joueur dans le rayon fait recommencer le niveau (scene.onBombHit ; l'invincibilité et le dash protègent) ;
//   - un ennemi dans le rayon meurt ;
//   - une caisse dans le rayon casse (et si elle cachait une bombe, la chaîne continue).
//
// * COMMENT L'UTILISER (la scène du monde doit avoir crates, enemies, getEnemyTargets, onBombHit et isFreeGround)
//   import { dropBomb } from '../systems/BombSystem.js';
//   onBombCrateBroken(crate) { dropBomb(this, crate); }   // appelée par CrateSystem à la casse d'une caisse à bombe
// =====================================================================================

import { BOMB } from '../utils/constants.js';
import { bounceStar } from './StarBounce.js';
import { breakCrate } from './CrateSystem.js';

/** Crée (une seule fois) la petite texture des éclats : un carré blanc, coloré par les teintes. */
function ensurePuffTexture(scene) {
  const { PUFF_KEY, PUFF_SIZE } = BOMB.BLAST;
  if (scene.textures.exists(PUFF_KEY)) return;
  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  graphics.fillStyle(0xffffff).fillRect(0, 0, PUFF_SIZE, PUFF_SIZE);
  graphics.generateTexture(PUFF_KEY, PUFF_SIZE, PUFF_SIZE);
  graphics.destroy();
}

/**
 * Fait jaillir une bombe de cette caisse (qui vient de casser) : elle saute, se pose, puis explose.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} crate  La caisse cassée (elle a encore sa position)
 */
export function dropBomb(scene, crate) {
  // * Comme l'étoile : elle part du centre de la caisse (le sol est 16 sous son centre, la bombe 20 au-dessus)
  const from = { x: crate.x, y: crate.y + 16, headHeight: 20 + 16 };
  const bomb = scene.physics.add.sprite(from.x, from.y, BOMB.KEY);
  bounceStar(scene, bomb, from, (x, y) => scene.isFreeGround(x, y), {
    distanceScale: BOMB.DISTANCE_SCALE,
    spin: false,
    onLanded: (x, y) => lightFuse(scene, bomb, x, y),
  });
}

/** La bombe est posée : elle gonfle et dégonfle (la mèche), puis explose à FUSE_MS. */
function lightFuse(scene, bomb, x, y) {
  bomb.setDepth(BOMB.DEPTH);
  if (BOMB.FUSE_MS > 0) {
    scene.tweens.add({ targets: bomb, scale: BOMB.PULSE.SCALE, duration: BOMB.PULSE.MS, yoyo: true, repeat: -1 });
  }
  scene.time.delayedCall(BOMB.FUSE_MS, () => {
    bomb.destroy();
    explode(scene, x, y - 8); // au centre de la bombe, pas à ses pieds
  });
}

/** L'explosion en (x, y) : les effets, puis les dégâts. */
function explode(scene, x, y) {
  const { BLAST, RADIUS } = BOMB;
  ensurePuffTexture(scene);

  // * Un disque qui grandit et s'estompe, des éclats dans toutes les directions, un tremblement de l'écran
  const disc = scene.add.circle(x, y, 10, BLAST.COLOR, BLAST.START_ALPHA).setDepth(BLAST.DEPTH);
  scene.tweens.add({ targets: disc, scale: RADIUS / 10, alpha: 0, duration: BLAST.DURATION_MS, onComplete: () => disc.destroy() });
  const puff = scene.add.particles(x, y, BLAST.PUFF_KEY, {
    speed: { min: BLAST.PUFF_SPEED.MIN, max: BLAST.PUFF_SPEED.MAX },
    angle: { min: 0, max: 360 },
    lifespan: { min: BLAST.PUFF_LIFETIME_MS.MIN, max: BLAST.PUFF_LIFETIME_MS.MAX },
    scale: { start: 1, end: 0 },
    tint: BLAST.PUFF_COLORS,
    emitting: false,
  });
  puff.setDepth(BLAST.DEPTH);
  puff.explode(BLAST.PUFF_COUNT);
  scene.time.delayedCall(BLAST.PUFF_LIFETIME_MS.MAX + 100, () => puff.destroy());
  scene.cameras.main.shake(BLAST.SHAKE.DURATION_MS, BLAST.SHAKE.INTENSITY);

  const inRadius = (target) => Phaser.Math.Distance.Between(x, y, target.x, target.y) < RADIUS;

  // * Les ennemis dans le rayon meurent (même fin que le dernier tir : effet joué avant la destruction)
  scene.enemies
    .getChildren()
    .filter(inRadius)
    .forEach((enemy) => {
      enemy.hitPoints = 0;
      enemy.onHit?.(enemy);
      enemy.destroy();
    });

  // * Les caisses dans le rayon cassent (on copie la liste : casser une caisse la retire du groupe)
  scene.crates
    .getChildren()
    .filter((crate) => crate.active && inRadius(crate))
    .forEach(breakCrate);

  // * Un joueur dans le rayon : le niveau recommence (la scène vérifie l'invincibilité et le dash)
  scene.getEnemyTargets().filter((player) => Phaser.Math.Distance.Between(x, y, player.body.center.x, player.body.center.y) < RADIUS).forEach((player) => scene.onBombHit(player));
}
