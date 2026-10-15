import { P2_SPRITE, P2_SPAWN_DISTANCE, P2_SPEED, PLAYER, CONTROL_MODES, GAME_MODES } from '../utils/constants.js';
import InputManager from './InputManager.js';
import { getControlMode } from './ControlMode.js';
import { getGameMode } from './GameMode.js';
import Dash from './DashSystem.js';
import { shoot } from './fonctionTir.js';
import { ABILITIES, isUnlocked, notifyLocked } from './ProgressSystem.js';

const FRAME_HAUT   = 0; // dos
const FRAME_DROITE = 1;
const FRAME_GAUCHE = 2;
const FRAME_BAS    = 3; // face

export function loadSecondPlayer(scene) {
  scene.load.spritesheet(P2_SPRITE.key, P2_SPRITE.path, {
    frameWidth: P2_SPRITE.frameWidth,
    frameHeight: P2_SPRITE.frameHeight
  });
}

// * Le premier endroit libre autour du joueur 1 : ni dans un mur, ni dans un miroir, ni dans un décor solide
// (la boîte de collision du joueur 2 est un petit rectangle aux pieds : on le compare aux obstacles ; un miroir en train de disparaître compte aussi)
function findStartNear(scene, player, walls) {
  const d = P2_SPAWN_DISTANCE;
  const { WIDTH, HEIGHT } = PLAYER.HITBOX;
  const overlaps = (x, y, body) => x + WIDTH / 2 > body.left && x - WIDTH / 2 < body.right && y + HEIGHT > body.top && y < body.bottom;
  const isFree = ({ x, y }) => {
    if ([-WIDTH / 2, WIDTH / 2].some((dx) => walls.hasTileAtWorldXY(x + dx, y + HEIGHT / 2))) return false;
    // * Le sprite est centré : sa boîte (hauteur HEIGHT) commence à y et finit à y + HEIGHT
    const blockers = [...(scene.mirrors ?? []), scene.vanishingMirror, ...(scene.decoBlockers?.getChildren() ?? [])].filter((b) => b?.active);
    return !blockers.some((blocker) => blocker.body && overlaps(x, y, blocker.body));
  };
  const candidates = [[d, 0], [-d, 0], [0, d], [0, -d]].map(([dx, dy]) => ({ x: player.x + dx, y: player.y + dy }));
  return candidates.find(isFree) || { x: player.x, y: player.y };
}

export function createSecondPlayer(scene, player, walls) {
  const start = findStartNear(scene, player, walls);
  const p2 = scene.physics.add.sprite(start.x, start.y, P2_SPRITE.key, FRAME_BAS);
  p2.setCollideWorldBounds(true);
  // * Petite boîte de collision aux pieds, comme le joueur 1 (sinon il se coince dans les décors)
  p2.body.setSize(PLAYER.HITBOX.WIDTH, PLAYER.HITBOX.HEIGHT);
  p2.body.setOffset(PLAYER.HITBOX.OFFSET_X, PLAYER.HITBOX.OFFSET_Y);
  p2.input2 = new InputManager(scene, 2); // les touches du joueur 2 (table BINDINGS)
  p2.facing = 'down'; // la direction regardée : sert au tir et au dash à l'arrêt
  p2.dash = new Dash(scene, p2);

  // * En solo, le joueur 2 n'existe pas : on le garde créé (le reste du code l'attend) mais caché et sans corps, il ne fait plus rien
  if (getGameMode() === GAME_MODES.SOLO) p2.disableBody(true, true);
  return p2;
}

/**
 * À appeler à chaque image : le déplacement, le tir et le dash du joueur 2. (L'interaction est dans WorldScene.interact.)
 * @param {Phaser.Scene} scene  La scène du monde (elle doit avoir `bullets`)
 * @param {Phaser.Physics.Arcade.Sprite} p2
 */
export function updateSecondPlayer(scene, p2) {
  if (!p2.active) return; // solo : il n'existe pas

  // * En mode PC, le joueur 2 ne bouge pas (un seul joueur au clavier)
  if (getControlMode() === CONTROL_MODES.PC) {
    p2.setVelocity(0, 0);
    return;
  }

  // * La direction est déjà normalisée en diagonale par l'InputManager
  const { x, y } = p2.input2.getMove();

  // * Comme le joueur 1 : en diagonale, l'horizontale passe en premier. À l'arrêt, on garde la dernière image.
  if (x > 0) {
    p2.setFrame(FRAME_DROITE);
    p2.facing = 'right';
  } else if (x < 0) {
    p2.setFrame(FRAME_GAUCHE);
    p2.facing = 'left';
  } else if (y < 0) {
    p2.setFrame(FRAME_HAUT);
    p2.facing = 'up';
  } else if (y > 0) {
    p2.setFrame(FRAME_BAS);
    p2.facing = 'down';
  }

  // * Tir : une balle par appui, dans la direction regardée
  if (p2.input2.justPressed('shoot')) {
    if (isUnlocked(ABILITIES.SHOOT)) shoot(scene, scene.bullets, p2, p2.facing);
    else notifyLocked(scene, ABILITIES.SHOOT);
  }

  // * Le dash impose sa propre vitesse tant qu'il dure ; sinon la vitesse normale
  if (!p2.dash.update(p2.input2, { x, y }, p2.facing)) p2.setVelocity(x * P2_SPEED, y * P2_SPEED);
}
