// =====================================================================================
// * ENEMY SYSTEM : LES ENNEMIS
// =====================================================================================
//
// Un ennemi se pose dans Tiled : un objet « point » de classe « enemy » dans le calque « objects ». Son NOM donne le type
// (une clé de ENEMIES dans constants.js : « faucheur » ou « capuche »). Le point marque l'endroit où il a les pieds.
// Changer un ennemi de place, ou en ajouter, se fait donc dans Tiled, sans toucher au code. Une carte sans objet « enemy »
// n'en a pas. Selon la version de Tiled, la classe s'appelle « class » ou « type » : on lit les deux.
//
// * COMMENT L'UTILISER
//   preloadEnemies(this);                                    // dans preload()
//   this.enemies = createEnemies(this, map, this.bullets);   // dans create(), une fois le groupe de balles créé (un GROUPE d'ennemis)
//   updateEnemies(this, this.enemies, this.player, frozen);  // à chaque image dans update() (frozen : tout s'arrête)
//
// * LE COMPORTEMENT (une petite machine à états, voir ENEMY_AI dans constants.js)
//   idle    au repos : il flâne près de son point de départ.
//   chase   il VOIT le joueur (assez près ET aucun mur entre eux) : il fonce dessus.
//   search  il l'a perdu (trop loin, ou caché derrière un mur) : il va où il l'a vu en dernier et y attend un instant.
//   return  il rentre à son point de départ, puis redevient « idle ».
//   S'il revoit le joueur à n'importe quel moment, il repart en chase.
//
// * LE CONTACT
//   Quand un ennemi touche le joueur, WorldScene le renvoie au point de départ (voir respawnPlayer) et appelle
//   resetEnemies : les ennemis vivants reprennent leur place et redeviennent calmes. Un ennemi tué ne revient pas.
//
// * LES TIRS
//   Les balles les touchent comme les caisses (voir hitTarget dans fonctionTir.js) : chaque tir retire un point de vie
//   (hitPoints : ENEMIES, ou la propriété « hitPoints » de l'objet Tiled). Un coup qui ne tue pas fait clignoter l'ennemi en
//   blanc, le repousse et l'étourdit un instant ; le coup fatal le fait disparaître dans un nuage de fumée sombre.
// =====================================================================================

import { ENEMIES, ENEMY_FRAME_SIZE, ENEMY_AI, FONT_FAMILY, DEPTH } from '../utils/constants.js';
import { getTiledProperty } from './CrateSystem.js';
import { addTargetCollision } from './fonctionTir.js';

// Les mondes dont tous les ennemis ont été tués, retenus pour toute la partie (une scène est recréée à chaque visite) :
// à la visite suivante, les ennemis ne reviennent pas et l'étoile est là.
const clearedMaps = new Set();

// Le compteur d'ennemis du monde en cours ({ total, killed }), ou null s'il n'y en a pas : l'interface l'affiche (voir UIScene)
let enemyState = null;

/** Les ennemis du monde en cours : { total, killed }, ou null si ce monde n'a pas d'ennemis à tuer. */
export const getEnemyState = () => enemyState;

/** Démarre le compteur d'un monde (appelé à sa création) : 0 ennemi tué sur `total`. Sans ennemi, il n'y a pas de compteur. */
export const startEnemyCounter = (total) => {
  enemyState = total > 0 ? { total, killed: 0 } : null;
};

/** Tous les ennemis de cette carte ont-ils déjà été tués lors d'une visite précédente ? */
export const isEnemiesCleared = (mapKey) => clearedMaps.has(mapKey);

/** Retient que tous les ennemis de cette carte sont morts. */
export const markEnemiesCleared = (mapKey) => clearedMaps.add(mapKey);

/** Charge les images de tous les ennemis (à appeler dans preload). */
export function preloadEnemies(scene) {
  Object.values(ENEMIES).forEach((enemy) =>
    scene.load.spritesheet(enemy.key, enemy.image, { frameWidth: ENEMY_FRAME_SIZE, frameHeight: ENEMY_FRAME_SIZE }),
  );
}

/**
 * Crée un ennemi à la position de chaque objet « enemy » de la carte.
 * @param {Phaser.Physics.Arcade.Group} bullets  Le groupe de balles : elles blessent les ennemis
 * @returns {Phaser.Physics.Arcade.Group} le groupe des ennemis (un ennemi tué en sort tout seul), avec enemy.enemyType = le nom de l'objet Tiled
 */
export function createEnemies(scene, map, bullets) {
  ensureDeathTexture(scene);
  const enemies = scene.physics.add.group();

  // * L'animation de la capuche est globale à tout le jeu : on ne la crée qu'une fois
  const { idle } = ENEMIES.capuche;
  if (!scene.anims.exists(idle.KEY)) {
    scene.anims.create({
      key: idle.KEY,
      frames: scene.anims.generateFrameNumbers(ENEMIES.capuche.key, { start: 0, end: ENEMIES.capuche.frameCount - 1 }),
      frameRate: idle.FRAME_RATE,
      repeat: -1,
    });
  }

  map
    .getObjectLayer('objects')
    .objects.filter((object) => (object.class || object.type) === 'enemy')
    .forEach((object) => {
      const config = ENEMIES[object.name];
      if (!config) {
        console.warn(`[EnemySystem] Ennemi inconnu : « ${object.name} » (voir ENEMIES dans constants.js).`);
        return;
      }

      // * Les pieds sont au point de l'objet : le bas de l'image, centré
      const enemy = enemies.create(object.x, object.y, config.key, 0).setOrigin(0.5, 1);
      enemy.enemyType = object.name;
      enemy.home = { x: object.x, y: object.y }; // l'endroit où il est posé, pour y revenir plus tard

      // * La zone de collision est un petit rectangle aux pieds (et non toute l'image)
      const { WIDTH, HEIGHT } = config.hitbox;
      enemy.body.setSize(WIDTH, HEIGHT);
      enemy.body.setOffset((ENEMY_FRAME_SIZE - WIDTH) / 2, ENEMY_FRAME_SIZE - HEIGHT);

      if (config.idle) enemy.play(config.idle.KEY);

      // * Les points de vie et l'effet d'un tir (voir hitTarget dans fonctionTir.js)
      enemy.hitPoints = getTiledProperty(object, 'hitPoints', config.hitPoints);
      enemy.onHit = () => playHitEffect(scene, enemy);
    });

  addTargetCollision(scene, bullets, enemies);
  return enemies;
}

// ---------------------------------------------------------------------------------------------------------------
// LES TIRS
// ---------------------------------------------------------------------------------------------------------------

/** Crée (une seule fois) la petite texture de la fumée de mort : un carré blanc, coloré par les teintes. */
function ensureDeathTexture(scene) {
  const { KEY, SIZE } = ENEMY_AI.DEATH;
  if (scene.textures.exists(KEY)) return;
  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  graphics.fillStyle(0xffffff).fillRect(0, 0, SIZE, SIZE);
  graphics.generateTexture(KEY, SIZE, SIZE);
  graphics.destroy();
}

/** Ce qui se passe quand un tir touche un ennemi (appelé AVANT sa destruction : il a encore sa position). */
function playHitEffect(scene, enemy) {
  const { HIT, DEATH } = ENEMY_AI;

  if (enemy.hitPoints > 0) {
    // * Il tient encore : un éclat blanc, il recule (loin du joueur) et reste étourdi un instant
    enemy.setTintFill(0xffffff);
    scene.time.delayedCall(HIT.FLASH_MS, () => enemy.active && enemy.clearTint());
    const hitter = scene
      .getEnemyTargets()
      .reduce((a, b) => (Phaser.Math.Distance.Between(enemy.x, enemy.y, a.x, a.y) <= Phaser.Math.Distance.Between(enemy.x, enemy.y, b.x, b.y) ? a : b));
    const away = new Phaser.Math.Vector2(enemy.x - hitter.x, enemy.y - (hitter.y + hitter.height / 2)).normalize();
    enemy.setVelocity(away.x * HIT.KNOCKBACK, away.y * HIT.KNOCKBACK);
    enemy.stunnedUntil = scene.time.now + HIT.STUN_MS;
    return;
  }

  // * Il meurt : on retient où (c'est de là que sautera l'étoile si c'était le dernier ennemi du monde), puis un nuage de fumée sombre
  scene.lastEnemyDeath = { x: enemy.x, y: enemy.y };
  if (enemyState) enemyState.killed += 1;
  // * Un nuage de fumée sombre à la place de son centre
  const smoke = scene.add.particles(enemy.x, enemy.y - ENEMY_FRAME_SIZE / 2, DEATH.KEY, {
    speed: { min: DEATH.SPEED.MIN, max: DEATH.SPEED.MAX },
    angle: { min: 0, max: 360 },
    lifespan: { min: DEATH.LIFETIME_MS.MIN, max: DEATH.LIFETIME_MS.MAX },
    scale: { start: 1, end: 0 },
    tint: DEATH.COLORS,
    emitting: false,
  });
  smoke.setDepth(DEATH.DEPTH);
  smoke.explode(DEATH.COUNT);
  scene.time.delayedCall(DEATH.LIFETIME_MS.MAX + 100, () => smoke.destroy());
}

// ---------------------------------------------------------------------------------------------------------------
// LE COMPORTEMENT
// ---------------------------------------------------------------------------------------------------------------

/** Vrai si aucun mur n'est sur le segment de (x1, y1) à (x2, y2) : c'est la « ligne de vue ». */
function hasLineOfSight(scene, x1, y1, x2, y2) {
  const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
  for (let d = ENEMY_AI.LINE_OF_SIGHT_STEP; d < distance; d += ENEMY_AI.LINE_OF_SIGHT_STEP) {
    const t = d / distance;
    if (scene.walls.hasTileAtWorldXY(Phaser.Math.Linear(x1, x2, t), Phaser.Math.Linear(y1, y2, t))) return false;
  }
  return true;
}

/** L'ennemi voit-il le joueur à moins de `range` pixels ? */
function sees(scene, enemy, player, range) {
  const from = enemy.body.center;
  const to = player.body.center;
  return Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y) < range && hasLineOfSight(scene, from.x, from.y, to.x, to.y);
}

/** Le joueur le plus proche que l'ennemi voit à moins de `range` pixels, ou null s'il n'en voit aucun. */
function nearestSeen(scene, enemy, players, range) {
  let best = null;
  let bestDistance = Infinity;
  players.forEach((player) => {
    if (!sees(scene, enemy, player, range)) return;
    const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
    if (distance < bestDistance) {
      best = player;
      bestDistance = distance;
    }
  });
  return best;
}

/** Le petit « ! » qui monte au-dessus de l'ennemi quand il repère le joueur. */
function showAlert(scene, enemy) {
  const { TEXT, COLOR, SIZE, RISE, DURATION_MS } = ENEMY_AI.ALERT;
  const mark = scene.add
    .text(enemy.x, enemy.y - ENEMY_FRAME_SIZE - 4, TEXT, { fontFamily: FONT_FAMILY, fontSize: SIZE, fontStyle: 'bold', color: COLOR })
    .setOrigin(0.5, 1)
    .setDepth(DEPTH.UI);
  scene.tweens.add({ targets: mark, y: mark.y - RISE, alpha: 0, duration: DURATION_MS, onComplete: () => mark.destroy() });
}

/** Avance l'ennemi vers (x, y) à la vitesse donnée. Renvoie vrai s'il est arrivé. */
function moveToward(enemy, x, y, speed) {
  const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y);
  if (distance <= ENEMY_AI.ARRIVE_DISTANCE) {
    enemy.setVelocity(0, 0);
    return true;
  }
  enemy.setVelocity(((x - enemy.x) / distance) * speed, ((y - enemy.y) / distance) * speed);
  return false;
}

// ---------------------------------------------------------------------------------------------------------------
// LE CONTOURNEMENT DES OBSTACLES
// ---------------------------------------------------------------------------------------------------------------
// Une grille des cases bloquées (murs + eau, caisses, personnages, miroirs), mise à jour 4 fois par seconde.
// Si le chemin droit est libre, l'ennemi y va tout droit. Sinon il cherche le plus court chemin dans la grille
// (parcours en largeur) et vise le point le plus loin de ce chemin qu'il voit en ligne droite.

const GRID_REFRESH_MS = 250;
const STRAIGHT_SPREAD = 10; // la ligne droite est testée sur 3 lignes (centre et ±10 px), car l'ennemi a une largeur

function getGrid(scene) {
  const now = scene.time.now;
  if (scene.enemyGrid && now - scene.enemyGrid.at < GRID_REFRESH_MS) return scene.enemyGrid;

  const map = scene.walls.tilemap;
  const { width, height } = scene.walls.layer;
  const size = map.tileWidth;
  const blocked = new Uint8Array(width * height);
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) if (scene.walls.hasTileAt(col, row)) blocked[row * width + col] = 1;
  }
  (scene.enemyObstacles || []).forEach((obstacle) => {
    const members = obstacle.getChildren ? obstacle.getChildren() : [obstacle];
    members.forEach((member) => {
      if (!member.active || !member.body) return;
      const { left, right, top, bottom } = member.body;
      for (let row = Math.floor(top / size); row <= Math.floor((bottom - 1) / size); row += 1) {
        for (let col = Math.floor(left / size); col <= Math.floor((right - 1) / size); col += 1) {
          if (col >= 0 && row >= 0 && col < width && row < height) blocked[row * width + col] = 1;
        }
      }
    });
  });
  scene.enemyGrid = { at: now, blocked, width, height, size };
  return scene.enemyGrid;
}

const isBlockedAt = (grid, x, y) => {
  const col = Math.floor(x / grid.size);
  const row = Math.floor(y / grid.size);
  return col < 0 || row < 0 || col >= grid.width || row >= grid.height || grid.blocked[row * grid.width + col] === 1;
};

/** Vrai si le trajet droit de (x1, y1) à (x2, y2) (en coordonnées de pieds) ne touche aucune case bloquée. */
function isStraightClear(grid, x1, y1, x2, y2) {
  const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
  const nx = distance ? -(y2 - y1) / distance : 0; // la perpendiculaire, pour tester les côtés
  const ny = distance ? (x2 - x1) / distance : 0;
  for (let d = 0; d <= distance; d += ENEMY_AI.LINE_OF_SIGHT_STEP / 2) {
    const t = distance ? d / distance : 0;
    const x = Phaser.Math.Linear(x1, x2, t);
    const y = Phaser.Math.Linear(y1, y2, t) - 7; // le centre du corps, un peu au-dessus des pieds
    for (const side of [-STRAIGHT_SPREAD, 0, STRAIGHT_SPREAD]) {
      if (isBlockedAt(grid, x + nx * side, y + ny * side)) return false;
    }
  }
  return true;
}

/** Le plus court chemin (liste de cases) de (x1, y1) à (x2, y2), ou null s'il n'y en a pas. */
function findPath(grid, x1, y1, x2, y2) {
  const { width, height, size, blocked } = grid;
  const start = Math.floor((y1 - 7) / size) * width + Math.floor(x1 / size);
  const goal = Math.floor((y2 - 7) / size) * width + Math.floor(x2 / size);
  if (blocked[goal] || start === goal || start < 0 || start >= blocked.length) return null;

  const from = new Int32Array(width * height).fill(-1);
  from[start] = start;
  const queue = [start];
  for (let i = 0; i < queue.length && from[goal] === -1; i += 1) {
    const cell = queue[i];
    const col = cell % width;
    const row = Math.floor(cell / width);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const c = col + dc;
      const r = row + dr;
      if (c < 0 || r < 0 || c >= width || r >= height) continue;
      const next = r * width + c;
      if (from[next] !== -1 || blocked[next]) continue;
      if (dc && dr && (blocked[row * width + c] || blocked[r * width + col])) continue; // pas de coupe dans un coin
      from[next] = cell;
      queue.push(next);
    }
  }
  if (from[goal] === -1) return null;

  const path = [];
  for (let cell = goal; cell !== start; cell = from[cell]) path.unshift(cell);
  return path.map((cell) => ({ x: (cell % width) * size + size / 2, y: Math.floor(cell / width) * size + size / 2 + 7 }));
}

/** Avance vers (x, y) en contournant les obstacles. Renvoie vrai s'il est arrivé. */
function walkToward(scene, enemy, x, y, speed) {
  if (Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y) <= ENEMY_AI.ARRIVE_DISTANCE) return moveToward(enemy, x, y, speed);

  const grid = getGrid(scene);
  let target = { x, y };
  if (!isStraightClear(grid, enemy.x, enemy.y, x, y)) {
    const path = findPath(grid, enemy.x, enemy.y, x, y);
    if (path) {
      // le point le plus loin du chemin qu'il voit tout droit (sinon la prochaine case)
      target = path.slice().reverse().find((point) => isStraightClear(grid, enemy.x, enemy.y, point.x, point.y)) || path[0];
    }
  }
  moveToward(enemy, target.x, target.y, speed);
  return false;
}

/** L'image du faucheur selon la direction où il va (la capuche, elle, joue son animation). */
function faceDirection(enemy) {
  const config = ENEMIES[enemy.enemyType];
  if (!config.frames || (enemy.body.velocity.x === 0 && enemy.body.velocity.y === 0)) return;
  const { x, y } = enemy.body.velocity;
  const direction = Math.abs(x) >= Math.abs(y) ? (x < 0 ? 'left' : 'right') : y < 0 ? 'up' : 'down';
  enemy.setFrame(config.frames[direction]);
}

function setState(enemy, state, now) {
  enemy.state = state;
  enemy.stateSince = now;
}

/**
 * À appeler à chaque image : fait vivre tous les ennemis.
 * @param {Phaser.Scene} scene  La scène du monde (elle doit avoir un calque `walls`)
 * @param {Phaser.Physics.Arcade.Group} enemies  Le groupe d'ennemis (voir createEnemies)
 * @param {Phaser.Physics.Arcade.Sprite[]} players  Les joueurs que les ennemis peuvent voir (le plus proche visible est poursuivi)
 * @param {boolean} frozen  Vrai pendant un dialogue ou une transition : les ennemis s'arrêtent
 */
export function updateEnemies(scene, enemies, players, frozen) {
  const now = scene.time.now;

  enemies.getChildren().forEach((enemy) => {
    if (frozen) {
      enemy.setVelocity(0, 0);
      return;
    }
    if (enemy.stunnedUntil > now) return; // étourdi par un tir : il garde l'élan du recul, sans rien décider
    if (enemy.stunnedUntil) {
      enemy.stunnedUntil = 0;
      enemy.setVelocity(0, 0);
    }
    if (!enemy.state) setState(enemy, 'idle', now);

    const config = ENEMIES[enemy.enemyType];
    const range = enemy.state === 'chase' ? config.sight * ENEMY_AI.LOSE_SIGHT_FACTOR : config.sight;
    const player = nearestSeen(scene, enemy, players, range); // le joueur visible le plus proche, sinon null
    const canSee = player !== null;

    // * Il voit le joueur : il fonce dessus (et il se retient où il l'a vu, au cas où il le perde)
    if (canSee) {
      if (enemy.state !== 'chase') showAlert(scene, enemy);
      setState(enemy, 'chase', now);
      enemy.lastSeen = { x: player.x, y: player.y + player.height / 2 }; // les pieds du joueur
      enemy.setVelocity(0, 0);
      walkToward(scene, enemy, enemy.lastSeen.x, enemy.lastSeen.y, config.speed);
    } else if (enemy.state === 'chase') {
      setState(enemy, 'search', now); // il vient de le perdre
    } else if (enemy.state === 'search') {
      const waited = now - enemy.stateSince;
      const arrived = walkToward(scene, enemy, enemy.lastSeen.x, enemy.lastSeen.y, config.speed);
      if (arrived && !enemy.arrivedAt) enemy.arrivedAt = now;
      if ((enemy.arrivedAt && now - enemy.arrivedAt >= ENEMY_AI.SEARCH.WAIT_MS) || waited >= ENEMY_AI.SEARCH.MAX_MS) {
        enemy.arrivedAt = null;
        setState(enemy, 'return', now);
      }
    } else if (enemy.state === 'return') {
      if (walkToward(scene, enemy, enemy.home.x, enemy.home.y, config.speed * ENEMY_AI.RETURN_SPEED_FACTOR)) setState(enemy, 'idle', now);
    } else {
      wander(scene, enemy, config, now); // au repos
    }

    faceDirection(enemy);
  });
}

/** Au repos : il flâne autour de son point, avec des pauses. */
function wander(scene, enemy, config, now) {
  const { RADIUS, SPEED_FACTOR, PAUSE_MS } = ENEMY_AI.WANDER;
  if (!enemy.wanderTarget) {
    enemy.setVelocity(0, 0);
    if (!enemy.nextWanderAt) enemy.nextWanderAt = now + Phaser.Math.Between(PAUSE_MS.MIN, PAUSE_MS.MAX);
    if (now >= enemy.nextWanderAt) {
      const angle = Math.random() * Math.PI * 2;
      const length = Math.random() * RADIUS;
      enemy.wanderTarget = { x: enemy.home.x + Math.cos(angle) * length, y: enemy.home.y + Math.sin(angle) * length };
      enemy.nextWanderAt = null;
    }
    return;
  }
  if (walkToward(scene, enemy, enemy.wanderTarget.x, enemy.wanderTarget.y, config.speed * SPEED_FACTOR)) enemy.wanderTarget = null;
}

/** Remet les ennemis vivants à leur point de départ, calmes : après un contact avec le joueur, tout recommence. */
export function resetEnemies(enemies) {
  enemies.getChildren().forEach((enemy) => {
    enemy.setPosition(enemy.home.x, enemy.home.y);
    enemy.setVelocity(0, 0);
    enemy.state = 'idle';
    enemy.wanderTarget = null;
    enemy.nextWanderAt = null;
    enemy.arrivedAt = null;
    enemy.stunnedUntil = 0;
    enemy.clearTint();
  });
}
