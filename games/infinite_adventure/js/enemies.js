// États de base pour les ennemis
export const ENEMY_STATE = {
  IDLE: 0,
  CHASE: 1,
  PREPARE_CHARGE: 2,
  CHARGING: 3,
  COOLDOWN: 4,
  SHOOTING: 5,
  GHOSTING: 6
};

// Pool de projectiles pour éviter les créations/destructions
class ProjectilePool {
  constructor(scene, maxSize = 20) {
    this.scene = scene;
    this.pool = [];
    this.active = [];
    
    for (let i = 0; i < maxSize; i++) {
      const proj = scene.physics.add.sprite(-100, -100, 'enemies');
      proj.setActive(false).setVisible(false);
      proj.body.enable = false;
      proj.setDepth(10);
      this.pool.push(proj);
    }
  }

  get() {
    let proj = this.pool.pop();
    if (!proj) {
      proj = this.scene.physics.add.sprite(-100, -100, 'enemies');
      proj.setDepth(10);
    }
    proj.setActive(true).setVisible(true);
    proj.body.enable = true;
    this.active.push(proj);
    return proj;
  }

  release(proj) {
    const idx = this.active.indexOf(proj);
    if (idx > -1) this.active.splice(idx, 1);
    
    proj.setActive(false).setVisible(false);
    proj.body.enable = false;
    proj.body.setVelocity(0, 0);
    proj.setRotation(0);
    this.pool.push(proj);
  }

  updateAll(player, collisionLayer, propsCollisionLayer) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const proj = this.active[i];
      if (!proj.active) continue;
      
      proj.rotation += 0.15;
      
      const tileX = Math.floor(proj.x / 16);
      const tileY = Math.floor(proj.y / 16);
      
      const wallTile = collisionLayer?.getTileAt(tileX, tileY);
      const propTile = propsCollisionLayer?.getTileAt(tileX, tileY);
      
      if ((wallTile && wallTile.properties.Solide) || (propTile && propTile.properties.Solide)) {
        this.release(proj);
        continue;
      }
      
      const dx = proj.x - player.x;
      const dy = proj.y - player.y;
      if (dx * dx + dy * dy < 144) {
        if (proj.enemyRef && proj.enemyRef.isAlive()) {
          proj.enemyRef.onProjectileHit(player);
        }
        this.release(proj);
        continue;
      }
      
      if (this.scene.time.now > proj.destroyTime) {
        this.release(proj);
      }
    }
  }

  clear() {
    while (this.active.length > 0) {
      this.release(this.active[0]);
    }
  }
}

// Classe de base pour tous les ennemis - CORRIGÉE
export class Enemy {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.alive = true;
    this.markedForDeath = false;
    this.isDestroying = false;
    
    this.config = {
      health: 50,
      maxHealth: 50,
      normalSpeed: 60,
      chargeSpeed: 200,
      detectionRange: 220,
      chargeRange: 80,
      prepareTime: 600,
      chargeDuration: 800,
      cooldownTime: 500,
      chargeCooldown: 12000,
      attackDelay: 800,
      contactDamage: 10,
      chargeDamage: 20,
      bodySize: { width: 12, height: 12 },
      bodyOffset: { x: 2, y: 2 },
      xpValue: 20,
      idleFrames: [0, 2],
      moveFrames: [0, 2],
      frameRate: 8,
      ...config
    };

    this.sprite = scene.physics.add.sprite(x, y, 'enemies');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(5);
    this.sprite.setActive(true);
    this.sprite.setVisible(true);
    this.sprite.setAlpha(1);
    this.sprite.body.setSize(this.config.bodySize.width, this.config.bodySize.height);
    this.sprite.body.setOffset(this.config.bodyOffset.x, this.config.bodyOffset.y);
    this.sprite.body.setEnable(true);
    this.sprite.enemyRef = this;
    this.sprite.setFrame(this.config.idleFrames[0]);

    this.detectionRangeSq = this.config.detectionRange * this.config.detectionRange;
    this.chargeRangeSq = this.config.chargeRange * this.config.chargeRange;

    this.state = ENEMY_STATE.IDLE;
    this.health = this.config.health;
    this.attackCooldown = 0;
    this.stateTimer = 0;
    this.chargeAngle = 0;
    this.lastChargeTime = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  isAlive() {
    return this.alive && !this.markedForDeath && !this.isDestroying && this.sprite && this.sprite.active;
  }

  updateAnimation(time, frames) {
    if (!this.isAlive()) return;
    
    if (time > this.animTimer) {
      this.animFrame = (this.animFrame + 1) % frames.length;
      this.sprite.setFrame(frames[this.animFrame]);
      this.animTimer = time + (1000 / this.config.frameRate);
    }
  }

  onWallCollision() {
    if (!this.isAlive()) return;
    
    if (this.state === ENEMY_STATE.CHARGING) {
      this.state = ENEMY_STATE.COOLDOWN;
      this.stateTimer = this.scene.time.now + this.config.cooldownTime;
      this.sprite.body.setVelocity(0, 0);
      this.sprite.setAlpha(1);
    }
  }

  onPlayerContact(player) {
    if (!this.isAlive()) return;
    
    const currentTime = this.scene.time.now;
    if (currentTime >= this.attackCooldown) {
      const damage = this.state === ENEMY_STATE.CHARGING ? this.config.chargeDamage : this.config.contactDamage;
      this.scene.damagePlayer(damage);
      this.attackCooldown = currentTime + this.config.attackDelay;
    }
  }

  checkChargePath(targetX, targetY) {
    if (!this.scene.collisionLayer || !this.scene.propsCollisionLayer) return false;
    
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance / 16);
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 1; i <= steps; i++) {
      const tileX = Math.floor((this.sprite.x + stepX * i) / 16);
      const tileY = Math.floor((this.sprite.y + stepY * i) / 16);

      const wallTile = this.scene.collisionLayer.getTileAt(tileX, tileY);
      const propTile = this.scene.propsCollisionLayer.getTileAt(tileX, tileY);

      if ((wallTile && wallTile.properties.Solide) || (propTile && propTile.properties.Solide)) {
        return false;
      }
    }
    return true;
  }

  moveToPlayer(player) {
    if (!this.isAlive()) return;
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    
    this.state = ENEMY_STATE.CHASE;
    const angle = Math.atan2(dy, dx);
    this.sprite.body.setVelocity(
      Math.cos(angle) * this.config.normalSpeed,
      Math.sin(angle) * this.config.normalSpeed
    );
    this.sprite.setFlipX(dx < 0);
  }

  update(player, time) {
    if (!this.isAlive()) return;
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const distSq = dx * dx + dy * dy;

    switch (this.state) {
      case ENEMY_STATE.IDLE:
      case ENEMY_STATE.CHASE:
        if (distSq > this.detectionRangeSq) {
          this.state = ENEMY_STATE.IDLE;
          this.sprite.body.setVelocity(0, 0);
          this.updateAnimation(time, this.config.idleFrames);
        } else {
          if (distSq <= this.chargeRangeSq && distSq > 400 && (time - this.lastChargeTime) >= this.config.chargeCooldown) {
            if (this.checkChargePath(player.x, player.y)) {
              this.state = ENEMY_STATE.PREPARE_CHARGE;
              this.stateTimer = time + this.config.prepareTime;
              this.chargeAngle = Math.atan2(dy, dx);
              this.sprite.body.setVelocity(0, 0);
              this.lastChargeTime = time;
              this.sprite.setAlpha(0.5);
            } else {
              this.moveToPlayer(player);
              this.updateAnimation(time, this.config.moveFrames);
            }
          } else {
            this.moveToPlayer(player);
            this.updateAnimation(time, this.config.moveFrames);
          }
        }
        this.sprite.setFlipX(dx < 0);
        break;

      case ENEMY_STATE.PREPARE_CHARGE:
        this.updateAnimation(time, this.config.idleFrames);
        if (time >= this.stateTimer) {
          this.state = ENEMY_STATE.CHARGING;
          this.stateTimer = time + this.config.chargeDuration;
          this.sprite.setAlpha(1);
          
          this.sprite.body.setVelocity(
            Math.cos(this.chargeAngle) * this.config.chargeSpeed,
            Math.sin(this.chargeAngle) * this.config.chargeSpeed
          );
        }
        break;

      case ENEMY_STATE.CHARGING:
        this.updateAnimation(time, this.config.moveFrames);
        if (time >= this.stateTimer) {
          this.state = ENEMY_STATE.COOLDOWN;
          this.stateTimer = time + this.config.cooldownTime;
          this.sprite.body.setVelocity(0, 0);
          this.sprite.setAlpha(1);
        }
        break;

      case ENEMY_STATE.COOLDOWN:
        this.updateAnimation(time, this.config.idleFrames);
        if (time >= this.stateTimer) {
          this.state = ENEMY_STATE.IDLE;
        }
        break;
    }
  }

  takeDamage(damage, attackerX, attackerY) {
    if (!this.isAlive()) return;
    
    this.health -= damage;
    this.sprite.setTint(0xff0000);

    this.scene.time.delayedCall(100, () => {
      if (this.isAlive()) {
        this.sprite.clearTint();
      }
    });

    if (this.state !== ENEMY_STATE.CHARGING && this.state !== ENEMY_STATE.PREPARE_CHARGE) {
      const dx = this.sprite.x - attackerX;
      const dy = this.sprite.y - attackerY;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const invLen = 1 / len;
        const knockbackForce = 300;
        
        this.sprite.body.setVelocity(
          dx * invLen * knockbackForce,
          dy * invLen * knockbackForce
        );

        this.scene.time.delayedCall(150, () => {
          if (this.isAlive() && this.state !== ENEMY_STATE.CHARGING) {
            this.sprite.body.setVelocity(0, 0);
          }
        });
      }
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    if (!this.alive || this.markedForDeath || this.isDestroying) return;
    
    this.markedForDeath = true;
    this.alive = false;
    this.isDestroying = true;
    
    // XP immédiat
    this.scene.addXP(this.config.xpValue);
    
    // Arrêter toute physique IMMEDIATEMENT
    if (this.sprite && this.sprite.body) {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.body.setEnable(false);
      this.sprite.setActive(false);
    }
    
    // Retirer du groupe d'ennemis
    if (this.scene.enemyGroup) {
      this.scene.enemyGroup.remove(this.sprite, false, false);
    }
    
    // Particules
    for (let i = 0; i < 3; i++) {
      const particle = this.scene.getParticle();
      if (!particle) continue;
      
      particle.setPosition(this.sprite.x, this.sprite.y);
      const angle = (Math.PI * 2 * i) / 3;
      
      this.scene.tweens.add({
        targets: particle,
        x: this.sprite.x + Math.cos(angle) * 15,
        y: this.sprite.y + Math.sin(angle) * 15,
        alpha: 0,
        duration: 250,
        onComplete: () => this.scene.releaseParticle(particle)
      });
    }

    // Fade out rapide
    if (this.sprite) {
      this.sprite.setTint(0x444444);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        scale: 0.5,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
          }
          this.isDestroying = false;
        }
      });
    }
  }

  destroy() {
    if (this.isDestroying) return;
    
    this.alive = false;
    this.markedForDeath = true;
    this.isDestroying = true;
    
    if (this.sprite) {
      if (this.sprite.body) {
        this.sprite.body.setEnable(false);
      }
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

// BAT - Chauve-souris
export class Bat extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 40,
      maxHealth: 40,
      normalSpeed: 80,
      chargeSpeed: 280,
      detectionRange: 200,
      chargeRange: 80,
      prepareTime: 500,
      chargeDuration: 700,
      cooldownTime: 400,
      chargeCooldown: 10000,
      attackDelay: 800,
      contactDamage: 8,
      chargeDamage: 18,
      bodySize: { width: 12, height: 12 },
      bodyOffset: { x: 2, y: 2 },
      xpValue: 15,
      idleFrames: [0, 1, 2],
      moveFrames: [0, 1, 2],
      frameRate: 8
    });
  }
}

// FLY - Mouche (très rapide, fragile)
export class Fly extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 20,
      maxHealth: 20,
      normalSpeed: 120,
      chargeSpeed: 0,
      detectionRange: 180,
      chargeRange: 0,
      attackDelay: 600,
      contactDamage: 5,
      bodySize: { width: 10, height: 10 },
      bodyOffset: { x: 3, y: 3 },
      xpValue: 10,
      idleFrames: [3, 4, 5],
      moveFrames: [3, 4, 5],
      frameRate: 12
    });
  }

  update(player, time) {
    if (!this.isAlive()) return;
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > this.detectionRangeSq) {
      this.sprite.body.setVelocity(0, 0);
      this.updateAnimation(time, this.config.idleFrames);
    } else {
      this.moveToPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    }
  }
}

// SKULL - Tête de squelette (tire des projectiles)
export class Skull extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 60,
      maxHealth: 60,
      normalSpeed: 40,
      chargeSpeed: 0,
      detectionRange: 250,
      shootRange: 200,
      fleeRange: 60,
      shootCooldown: 2500,
      attackDelay: 1000,
      contactDamage: 12,
      projectileDamage: 15,
      bodySize: { width: 12, height: 12 },
      bodyOffset: { x: 2, y: 2 },
      xpValue: 25,
      idleFrames: [6, 7, 8, 9],
      moveFrames: [6, 7, 8, 9],
      frameRate: 6
    });
    
    this.lastShootTime = 0;
    this.shootRangeSq = this.config.shootRange * this.config.shootRange;
    this.fleeRangeSq = this.config.fleeRange * this.config.fleeRange;
  }

  shoot(player) {
    if (!this.isAlive()) return;
    
    const now = this.scene.time.now;
    if (now - this.lastShootTime < this.config.shootCooldown) return;
    
    this.lastShootTime = now;
    
    if (!this.scene.projectilePool) return;
    
    const proj = this.scene.projectilePool.get();
    proj.setPosition(this.sprite.x, this.sprite.y);
    proj.setFrame(10);
    proj.enemyRef = this;
    proj.destroyTime = now + 3000;
    proj.setDepth(10);
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const angle = Math.atan2(dy, dx);
    
    proj.body.setVelocity(
      Math.cos(angle) * 120,
      Math.sin(angle) * 120
    );
  }

  onProjectileHit(player) {
    if (!this.isAlive()) return;
    this.scene.damagePlayer(this.config.projectileDamage);
  }

  fleeFromPlayer(player) {
    if (!this.isAlive()) return;
    
    const dx = this.sprite.x - player.x;
    const dy = this.sprite.y - player.y;
    
    const angle = Math.atan2(dy, dx);
    this.sprite.body.setVelocity(
      Math.cos(angle) * this.config.normalSpeed,
      Math.sin(angle) * this.config.normalSpeed
    );
    this.sprite.setFlipX(dx > 0);
  }

  update(player, time) {
    if (!this.isAlive()) return;
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > this.detectionRangeSq) {
      this.sprite.body.setVelocity(0, 0);
      this.updateAnimation(time, this.config.idleFrames);
    } else if (distSq <= this.fleeRangeSq) {
      this.fleeFromPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    } else if (distSq <= this.shootRangeSq) {
      this.sprite.body.setVelocity(0, 0);
      this.updateAnimation(time, this.config.idleFrames);
      this.shoot(player);
      this.sprite.setFlipX(dx < 0);
    } else {
      this.moveToPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    }
  }
}

// GHOST - Fantôme (devient invincible périodiquement)
export class Ghost extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 50,
      maxHealth: 50,
      normalSpeed: 70,
      chargeSpeed: 0,
      detectionRange: 220,
      attackDelay: 700,
      contactDamage: 12,
      bodySize: { width: 12, height: 12 },
      bodyOffset: { x: 2, y: 2 },
      xpValue: 30,
      idleFrames: [11, 12, 13],
      moveFrames: [11, 12, 13],
      frameRate: 6
    });
    
    this.isInvincible = false;
    this.ghostCycleDuration = 10000; // 10 secondes
    this.ghostActiveDuration = 3000; // 3 secondes d'invincibilité
    this.nextGhostTime = scene.time.now + this.ghostCycleDuration;
  }

  takeDamage(damage, attackerX, attackerY) {
    if (!this.isAlive()) return;
    
    // Ignorer les dégâts si invincible
    if (this.isInvincible) return;
    
    super.takeDamage(damage, attackerX, attackerY);
  }

  update(player, time) {
    if (!this.isAlive()) {
      // Forcer l'alpha à 1 et désactiver l'invincibilité si mort
      if (this.sprite) {
        this.sprite.setAlpha(1);
      }
      this.isInvincible = false;
      return;
    }
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const distSq = dx * dx + dy * dy;

    // Gérer le cycle d'invincibilité (tous les 10s pendant 3s)
    if (time >= this.nextGhostTime) {
      if (!this.isInvincible) {
        // Activer l'invincibilité
        this.isInvincible = true;
        this.sprite.setAlpha(0.3);
        this.nextGhostTime = time + this.ghostActiveDuration;
      } else {
        // Désactiver l'invincibilité
        this.isInvincible = false;
        this.sprite.setAlpha(1);
        this.nextGhostTime = time + this.ghostCycleDuration;
      }
    }

    // Comportement normal de déplacement
    if (distSq > this.detectionRangeSq) {
      this.sprite.body.setVelocity(0, 0);
      this.updateAnimation(time, this.config.idleFrames);
    } else {
      this.moveToPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    }
  }
}

// Fonction pour créer des ennemis variés dans une scène
export function createEnemies(scene, count = 4) {
  const enemies = [];
  const enemySpawns = scene.map.filterObjects('calque_ennemi', obj => obj.name === 'spawn_ennemi');
  
  if (enemySpawns.length === 0) {
    console.warn('Aucun point de spawn trouvé');
    return enemies;
  }

  const enemyTypes = [
    { class: Bat, weight: 30 },
    { class: Fly, weight: 25 },
    { class: Skull, weight: 25 },
    { class: Ghost, weight: 20 }
  ];

  const totalWeight = enemyTypes.reduce((sum, t) => sum + t.weight, 0);

  if (!scene.projectilePool) {
    scene.projectilePool = new ProjectilePool(scene, 15);
  }

  for (let i = 0; i < count; i++) {
    const spawn = Phaser.Utils.Array.GetRandom(enemySpawns);
    const randomX = spawn.x + Phaser.Math.Between(0, spawn.width || 16);
    const randomY = spawn.y + Phaser.Math.Between(0, spawn.height || 16);
    
    let random = Math.random() * totalWeight;
    let selectedType = Fly;
    
    for (const type of enemyTypes) {
      random -= type.weight;
      if (random <= 0) {
        selectedType = type.class;
        break;
      }
    }
    
    const enemy = new selectedType(scene, randomX, randomY);
    enemies.push(enemy);
  }

  return enemies;
}

export { ProjectilePool };