// =====================================================================================
// * DASH SYSTEM : UNE COURTE ACCÉLÉRATION DU JOUEUR
// =====================================================================================
//
// Une pression sur la touche de dash lance le joueur dans la direction où il se déplace (sinon dans celle qu'il
// regarde). Il part très vite puis ralentit jusqu'à s'arrêter, et parcourt toujours DASH.DISTANCE pixels en
// DASH.DURATION_MS. Il laisse derrière lui des images fantômes qui s'estompent. Ensuite, une pause (DASH.COOLDOWN_MS)
// avant de pouvoir recommencer.
//
// Pendant le dash, le personnage est ÉTIRÉ dans le sens du mouvement (puis reprend sa forme). Pour ne pas toucher à sa
// boîte de collision (qui suit l'échelle du sprite), on cache le vrai sprite et on affiche à sa place une copie étirée.
//
// Un petit nuage de poussière se soulève derrière le joueur au départ, et à l'endroit où il s'arrête.
// Les murs, l'eau et les miroirs bloquent toujours le joueur : c'est la physique qui le déplace, on ne change que sa vitesse.
//
// * COMMENT L'UTILISER
//   this.dash = new Dash(this, this.player);                  // dans create(), une fois le joueur créé
//   if (this.dash.update(this.input1, move, this.facing)) ... // dans update() : vrai si le joueur est en plein dash
//                                                             // (le dash impose alors la vitesse du joueur)
// =====================================================================================

import { DASH } from '../utils/constants.js';
import { ABILITIES, isUnlocked, notifyLocked } from './ProgressSystem.js';

const { DUST } = DASH;

// Les directions regardées, en vecteurs (pour dasher à l'arrêt)
const FACING_VECTORS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export default class Dash {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.startedAt = 0; // l'instant où le dash en cours a commencé
    this.endsAt = 0; // l'instant où le dash en cours se termine
    this.readyAt = 0; // l'instant à partir duquel on peut dasher de nouveau
    this.nextGhostAt = 0;
    this.direction = [0, 0];
    this.visual = null; // la copie étirée affichée à la place du joueur pendant le dash

    // * La poussière : de petits carrés beiges (une texture générée une fois), éjectés dans le sens opposé au dash
    if (!scene.textures.exists(DUST.TEXTURE)) {
      const square = scene.make.graphics({ add: false });
      square.fillStyle(DUST.COLOR, 1).fillRect(0, 0, DUST.SIZE, DUST.SIZE);
      square.generateTexture(DUST.TEXTURE, DUST.SIZE, DUST.SIZE);
      square.destroy();
    }
    this.dust = scene.add.particles(0, 0, DUST.TEXTURE, {
      emitting: false,
      lifespan: DUST.LIFESPAN_MS,
      alpha: { start: DUST.ALPHA, end: 0 },
      scale: { start: DUST.SCALE.START, end: DUST.SCALE.END },
      // Chaque nuage part à l'opposé du dash, avec un peu de dispersion : vitesse = -direction x vitesse + hasard
      speedX: { onEmit: () => -this.direction[0] * Phaser.Math.Between(DUST.SPEED.MIN, DUST.SPEED.MAX) + Phaser.Math.Between(-20, 20) },
      speedY: { onEmit: () => -this.direction[1] * Phaser.Math.Between(DUST.SPEED.MIN, DUST.SPEED.MAX) + Phaser.Math.Between(-20, 20) },
    });
    scene.children.moveBelow(this.dust, player); // la poussière passe derrière le joueur

    // * L'étirement suit l'horloge, pas update() : si le dash est interrompu (dialogue, transition), le joueur réapparaît
    scene.events.on('update', () => this.updateVisual());
  }

  /**
   * À appeler à chaque image.
   * @param {InputManager} input
   * @param {{x: number, y: number}} move  La direction du déplacement (-1 à 1), nulle à l'arrêt
   * @param {string} facing  La direction regardée ('up', 'down', 'left', 'right')
   * @returns {boolean} vrai si le joueur est en plein dash
   */
  update(input, move, facing) {
    const now = this.scene.time.now;

    if (now >= this.endsAt && now >= this.readyAt && input.justPressed('dash')) {
      // * Le dash est verrouillé tant que le joueur ne l'a pas gagné : l'interface affiche un message, rien ne se passe
      if (!isUnlocked(ABILITIES.DASH)) {
        notifyLocked(this.scene, ABILITIES.DASH);
        return false;
      }
      // * Direction du dash : celle du déplacement, sinon celle qu'on regarde
      this.direction = move.x !== 0 || move.y !== 0 ? [move.x, move.y] : FACING_VECTORS[facing];
      this.startedAt = now;
      this.endsAt = now + DASH.DURATION_MS;
      this.readyAt = this.endsAt + DASH.COOLDOWN_MS;
      this.nextGhostAt = now;
      this.puff(DUST.COUNT_START);
    }

    if (now >= this.endsAt) return false;

    // * La vitesse décroît de la vitesse de départ jusqu'à zéro : speed = start x (1 - progression) ^ puissance.
    // La distance parcourue est l'intégrale de cette courbe, start x durée / (puissance + 1) : on en déduit la vitesse de
    // départ pour que le dash fasse toujours DASH.DISTANCE pixels.
    // On évalue la courbe au MILIEU de l'image qui vient (+ delta / 2) : sinon la vitesse, qui décroît, serait toujours
    // un peu trop forte et le dash dépasserait sa distance.
    const progress = (now - this.startedAt + this.scene.game.loop.delta / 2) / DASH.DURATION_MS;
    const startSpeed = (DASH.DISTANCE * (DASH.EASE_POWER + 1)) / (DASH.DURATION_MS / 1000);
    const speed = startSpeed * Math.max(1 - progress, 0) ** DASH.EASE_POWER;
    this.player.setVelocity(this.direction[0] * speed, this.direction[1] * speed);
    if (now >= this.nextGhostAt) {
      this.leaveGhost(progress);
      this.nextGhostAt = now + DASH.GHOST.INTERVAL_MS;
    }
    return true;
  }

  // Soulève quelques nuages de poussière aux pieds du joueur
  puff(count) {
    this.dust.explode(count, this.player.x, this.player.y + DUST.FEET_OFFSET);
  }

  // Affiche la copie étirée du joueur pendant le dash, la retire à la fin
  updateVisual() {
    const now = this.scene.time.now;
    const dashing = now < this.endsAt;

    if (!dashing) {
      if (this.visual) {
        this.visual.destroy();
        this.visual = null;
        this.player.setAlpha(1);
        this.puff(DUST.COUNT_END);
      }
      return;
    }

    if (!this.visual) {
      this.visual = this.scene.add.image(this.player.x, this.player.y, this.player.texture.key, this.player.frame.name);
      this.player.setAlpha(0);
    }

    // * L'étirement est maximal au départ et s'efface jusqu'à la fin. Il suit l'axe dominant du mouvement (comme les
    // images du joueur : en diagonale, l'horizontale passe en premier) : une échelle ne peut pas s'étirer en biais.
    const remaining = 1 - (now - this.startedAt) / DASH.DURATION_MS;
    const longer = 1 + (DASH.STRETCH.ALONG - 1) * remaining;
    const thinner = 1 - (1 - DASH.STRETCH.ACROSS) * remaining;
    const horizontal = Math.abs(this.direction[0]) >= Math.abs(this.direction[1]);
    this.visual
      .setPosition(this.player.x, this.player.y)
      .setFrame(this.player.frame.name)
      .setDepth(this.player.depth)
      .setScale(horizontal ? longer : thinner, horizontal ? thinner : longer);
  }

  // Une copie du joueur, laissée sur place : de la forme étirée du joueur, d'une couleur qui dépend du moment du dash
  // (progress, de 0 à 1), qui rétrécit un peu et s'estompe. Seul l'alpha et l'échelle sont animés : c'est léger.
  leaveGhost(progress) {
    const { player } = this;
    const { TINT_START, TINT_END, ALPHA, FADE_MS, SHRINK } = DASH.GHOST;
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(TINT_START),
      Phaser.Display.Color.ValueToColor(TINT_END),
      100,
      Math.min(Math.round(progress * 100), 100),
    );
    const scaleX = this.visual ? this.visual.scaleX : 1;
    const scaleY = this.visual ? this.visual.scaleY : 1;
    const ghost = this.scene.add
      .image(player.x, player.y, player.texture.key, player.frame.name)
      .setDepth(player.depth)
      .setAlpha(ALPHA)
      .setScale(scaleX, scaleY)
      .setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
    this.scene.children.moveBelow(ghost, player); // derrière le joueur, mais au-dessus du sol (même profondeur : c'est l'ordre qui compte)
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: scaleX * SHRINK,
      scaleY: scaleY * SHRINK,
      duration: FADE_MS,
      onComplete: () => ghost.destroy(),
    });
  }
}
