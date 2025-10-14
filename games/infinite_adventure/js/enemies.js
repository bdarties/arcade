export const ENEMY_STATE = {
  IDLE: 0,
  CHASE: 1,
  PREPARE_CHARGE: 2,
  CHARGING: 3,
  COOLDOWN: 4,
  SHOOTING: 5,
  GHOSTING: 6
};

// ========== PROJECTILE POOL ==========
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
      
      if ((wallTile?.properties.Solide) || (propTile?.properties.Solide)) {
        this.release(proj);
        continue;
      }
      
      const dx = proj.x - player.x;
      const dy = proj.y - player.y;
      if (dx * dx + dy * dy < 144) {
        if (proj.enemyRef?.isAlive()) {
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

// ========== CLASSE DE BASE ENEMY ==========
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
      spriteSheet: 'enemies',
      ...config
    };

    this.sprite = scene.physics.add.sprite(x, y, this.config.spriteSheet);
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

    this.detectionRangeSq = this.config.detectionRange ** 2;
    this.chargeRangeSq = this.config.chargeRange ** 2;

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
    return this.alive && !this.markedForDeath && !this.isDestroying && this.sprite?.active;
  }

  updateAnimation(time, frames) {
    if (!this.isAlive() || time <= this.animTimer) return;
    
    this.animFrame = (this.animFrame + 1) % frames.length;
    this.sprite.setFrame(frames[this.animFrame]);
    this.animTimer = time + (1000 / this.config.frameRate);
  }

  onWallCollision() {
    if (!this.isAlive() || this.state !== ENEMY_STATE.CHARGING) return;
    
    this.state = ENEMY_STATE.COOLDOWN;
    this.stateTimer = this.scene.time.now + this.config.cooldownTime;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.setAlpha(1);
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

      if ((wallTile?.properties.Solide) || (propTile?.properties.Solide)) {
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
        const knockbackForce = 300;
        
        this.sprite.body.setVelocity(
          (dx / len) * knockbackForce,
          (dy / len) * knockbackForce
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
    
    this.scene.addXP(this.config.xpValue);
    
    if (this.sprite?.body) {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.body.setEnable(false);
      this.sprite.setActive(false);
    }
    
    this.scene.enemyGroup?.remove(this.sprite, false, false);
    
    for (let i = 0; i < 3; i++) {
      const particle = this.scene.getParticle?.();
      if (!particle) continue;
      
      particle.setPosition(this.sprite.x, this.sprite.y);
      const angle = (Math.PI * 2 * i) / 3;
      
      this.scene.tweens.add({
        targets: particle,
        x: this.sprite.x + Math.cos(angle) * 15,
        y: this.sprite.y + Math.sin(angle) * 15,
        alpha: 0,
        duration: 250,
        onComplete: () => this.scene.releaseParticle?.(particle)
      });
    }

    if (this.sprite) {
      this.sprite.setTint(0x444444);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        scale: 0.5,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          this.sprite?.destroy();
          this.sprite = null;
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
      this.sprite.body?.setEnable(false);
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

// ========================================
// ENNEMIS AÉRIENS
// ========================================

// BAT - Chauve-souris rapide avec charge
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
      frameRate: 8,
      spriteSheet: 'enemies'
    });
  }
}

// FLY - Mouche très rapide et fragile
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
      frameRate: 12,
      spriteSheet: 'enemies'
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

// SKULL - Crâne qui tire des projectiles
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
      frameRate: 6,
      spriteSheet: 'enemies'
    });
    
    this.lastShootTime = 0;
    this.shootRangeSq = this.config.shootRange ** 2;
    this.fleeRangeSq = this.config.fleeRange ** 2;
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

// GHOST - Fantôme avec invincibilité périodique
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
      frameRate: 6,
      spriteSheet: 'enemies'
    });
    
    this.isInvincible = false;
    this.ghostCycleDuration = 10000;
    this.ghostActiveDuration = 3000;
    this.nextGhostTime = scene.time.now + this.ghostCycleDuration;
  }

  takeDamage(damage, attackerX, attackerY) {
    if (!this.isAlive() || this.isInvincible) return;
    super.takeDamage(damage, attackerX, attackerY);
  }

  update(player, time) {
    if (!this.isAlive()) {
      if (this.sprite) this.sprite.setAlpha(1);
      this.isInvincible = false;
      return;
    }
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const distSq = dx * dx + dy * dy;

    if (time >= this.nextGhostTime) {
      if (!this.isInvincible) {
        this.isInvincible = true;
        this.sprite.setAlpha(0.3);
        this.nextGhostTime = time + this.ghostActiveDuration;
      } else {
        this.isInvincible = false;
        this.sprite.setAlpha(1);
        this.nextGhostTime = time + this.ghostCycleDuration;
      }
    }

    if (distSq > this.detectionRangeSq) {
      this.sprite.body.setVelocity(0, 0);
      this.updateAnimation(time, this.config.idleFrames);
    } else {
      this.moveToPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    }
  }
}

// ========================================
// ENNEMIS TERRESTRES
// ========================================

// GOBLIN - Gobelin agressif avec charge
export class Goblin extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 70,
      maxHealth: 70,
      normalSpeed: 70,
      chargeSpeed: 220,
      detectionRange: 200,
      chargeRange: 90,
      prepareTime: 700,
      chargeDuration: 900,
      cooldownTime: 600,
      chargeCooldown: 8000,
      attackDelay: 700,
      contactDamage: 12,
      chargeDamage: 22,
      bodySize: { width: 12, height: 12 },
      bodyOffset: { x: 2, y: 2 },
      xpValue: 20,
      idleFrames: [0, 1, 2, 3],
      moveFrames: [4, 5, 6],
      frameRate: 8,
      spriteSheet: 'enemies_1'
    });
  }
}

// RAT - Rat rapide et faible
export class Rat extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 30,
      maxHealth: 30,
      normalSpeed: 100,
      chargeSpeed: 0,
      detectionRange: 160,
      chargeRange: 0,
      attackDelay: 500,
      contactDamage: 6,
      bodySize: { width: 10, height: 10 },
      bodyOffset: { x: 3, y: 3 },
      xpValue: 12,
      idleFrames: [7, 8],
      moveFrames: [9, 10, 11],
      frameRate: 10,
      spriteSheet: 'enemies_1'
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

// SKELETON - Squelette résistant avec charge puissante
export class Skeleton extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 90,
      maxHealth: 90,
      normalSpeed: 50,
      chargeSpeed: 240,
      detectionRange: 220,
      chargeRange: 100,
      prepareTime: 800,
      chargeDuration: 1000,
      cooldownTime: 700,
      chargeCooldown: 10000,
      attackDelay: 900,
      contactDamage: 15,
      chargeDamage: 28,
      bodySize: { width: 12, height: 12 },
      bodyOffset: { x: 2, y: 2 },
      xpValue: 30,
      idleFrames: [12, 13, 14],
      moveFrames: [15, 16, 17, 18],
      frameRate: 7,
      spriteSheet: 'enemies_1'
    });
  }
}

// SLIME - Slime gélatineux lent mais résistant
export class Slime extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 45,
      maxHealth: 45,
      normalSpeed: 50,
      chargeSpeed: 0,
      detectionRange: 180,
      chargeRange: 0,
      attackDelay: 800,
      contactDamage: 10,
      bodySize: { width: 14, height: 14 },
      bodyOffset: { x: 1, y: 1 },
      xpValue: 15,
      idleFrames: [19, 20], // sprite idle slime
      moveFrames: [21, 22, 23], // sprite run slime
      frameRate: 6,
      spriteSheet: 'enemies_1'
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

// SPIDER - Araignée rapide avec saut
export class Spider extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 35,
      maxHealth: 35,
      normalSpeed: 90,
      chargeSpeed: 0,
      detectionRange: 190,
      chargeRange: 0,
      attackDelay: 600,
      contactDamage: 8,
      bodySize: { width: 12, height: 12 },
      bodyOffset: { x: 2, y: 2 },
      xpValue: 14,
      idleFrames: [24, 25], // sprite idle araignée
      moveFrames: [26, 27, 28, 29], // sprite run araignée
      frameRate: 8,
      spriteSheet: 'enemies_1'
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

// ========================================
// MINIBOSS
// ========================================

// SKULL KING - Miniboss crâne avec tir en rafale
export class SkullKing extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 250,
      maxHealth: 250,
      normalSpeed: 50,
      chargeSpeed: 0,
      detectionRange: 300,
      shootRange: 250,
      fleeRange: 80,
      shootCooldown: 1800,
      attackDelay: 1200,
      contactDamage: 20,
      projectileDamage: 20,
      bodySize: { width: 18, height: 18 },
      bodyOffset: { x: -1, y: -1 },
      xpValue: 100,
      idleFrames: [6, 7, 8, 9],
      moveFrames: [6, 7, 8, 9],
      frameRate: 5,
      spriteSheet: 'enemies'
    });
    
    this.sprite.setScale(2);
    this.lastShootTime = 0;
    this.shootRangeSq = this.config.shootRange ** 2;
    this.fleeRangeSq = this.config.fleeRange ** 2;
  }

  shootBurst(player) {
    if (!this.isAlive() || !this.scene.projectilePool) return;
    
    const now = this.scene.time.now;
    if (now - this.lastShootTime < this.config.shootCooldown) return;
    
    this.lastShootTime = now;
    
    // Tir en rafale de 3 projectiles
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        if (!this.isAlive()) return;
        
        const proj = this.scene.projectilePool.get();
        proj.setPosition(this.sprite.x, this.sprite.y);
        proj.setFrame(10);
        proj.setScale(1.3);
        proj.setTint(0xff6600);
        proj.enemyRef = this;
        proj.destroyTime = now + 4000;
        proj.setDepth(10);
        
        const dx = player.x - this.sprite.x;
        const dy = player.y - this.sprite.y;
        const angle = Math.atan2(dy, dx) + (i - 1) * 0.15;
        
        proj.body.setVelocity(
          Math.cos(angle) * 140,
          Math.sin(angle) * 140
        );
      });
    }
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
      this.shootBurst(player);
      this.sprite.setFlipX(dx < 0);
    } else {
      this.moveToPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    }
  }
}

// BAT LORD - Miniboss chauve-souris avec charge rapide multiple
export class BatLord extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 250,
      maxHealth: 250,
      normalSpeed: 90,
      chargeSpeed: 320,
      detectionRange: 250,
      chargeRange: 100,
      prepareTime: 400,
      chargeDuration: 600,
      cooldownTime: 300,
      chargeCooldown: 6000,
      attackDelay: 800,
      contactDamage: 25,
      chargeDamage: 40,
      bodySize: { width: 18, height: 18 },
      bodyOffset: { x: -1, y: -1 },
      xpValue: 100,
      idleFrames: [0, 1, 2],
      moveFrames: [0, 1, 2],
      frameRate: 10,
      spriteSheet: 'enemies'
    });
    
    this.sprite.setScale(2);
    this.chargesRemaining = 0;
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
              this.chargesRemaining = 2; // Charge double
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
          this.chargesRemaining--;
          
          if (this.chargesRemaining > 0) {
            // Prépare une nouvelle charge
            this.state = ENEMY_STATE.PREPARE_CHARGE;
            this.stateTimer = time + 200;
            this.chargeAngle = Math.atan2(player.y - this.sprite.y, player.x - this.sprite.x);
            this.sprite.body.setVelocity(0, 0);
            this.sprite.setAlpha(0.5);
          } else {
            this.state = ENEMY_STATE.COOLDOWN;
            this.stateTimer = time + this.config.cooldownTime;
            this.sprite.body.setVelocity(0, 0);
            this.sprite.setAlpha(1);
          }
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
}

// RAT KING - Miniboss rat avec vitesse extrême et esquive
export class RatKing extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 150,
      maxHealth: 150,
      normalSpeed: 125,
      chargeSpeed: 0,
      detectionRange: 200,
      chargeRange: 0,
      attackDelay: 500,
      contactDamage: 15,
      bodySize: { width: 16, height: 16 },
      bodyOffset: { x: 0, y: 0 },
      xpValue: 100,
      idleFrames: [7, 8],
      moveFrames: [9, 10, 11],
      frameRate: 12,
      spriteSheet: 'enemies_1'
    });
    
    this.sprite.setScale(2);
    this.dodgeCooldown = 0;
    this.dodgeDuration = 2000;
  }

  takeDamage(damage, attackerX, attackerY) {
    if (!this.isAlive()) return;
    
    const now = this.scene.time.now;
    
    // Chance d'esquiver (50%)
    if (now >= this.dodgeCooldown && Math.random() < 0.5) {
      this.dodgeCooldown = now + this.dodgeDuration;
      
      // Esquive rapide
      const dx = this.sprite.x - attackerX;
      const dy = this.sprite.y - attackerY;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI;
      
      this.sprite.body.setVelocity(
        Math.cos(angle) * 400,
        Math.sin(angle) * 400
      );
      
      this.sprite.setTint(0xffff00);
      this.scene.time.delayedCall(200, () => {
        if (this.isAlive()) {
          this.sprite.setTint(0x00ff00);
        }
      });
      
      return; // Esquive réussie, pas de dégâts
    }
    
    super.takeDamage(damage, attackerX, attackerY);
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

// SLIME KING - Miniboss slime gélatineux avec split
export class SlimeKing extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 200,
      maxHealth: 200,
      normalSpeed: 60,
      chargeSpeed: 0,
      detectionRange: 280,
      chargeRange: 0,
      attackDelay: 1000,
      contactDamage: 22,
      bodySize: { width: 20, height: 20 },
      bodyOffset: { x: -2, y: -2 },
      xpValue: 120,
      idleFrames: [19],
      moveFrames: [20],
      frameRate: 5,
      spriteSheet: 'enemies_1'
    });
    
    this.sprite.setScale(2.5);
    this.splitThreshold = this.config.maxHealth / 2;
    this.hasSplit = false;
  }

  takeDamage(damage, attackerX, attackerY) {
    if (!this.isAlive()) return;
    
    super.takeDamage(damage, attackerX, attackerY);
    
    // Split quand santé <= 50%
    if (!this.hasSplit && this.health <= this.splitThreshold) {
      this.hasSplit = true;
      this.split();
    }
  }

  split() {
    if (!this.isAlive()) return;
    
    // Crée 2 petits slimes
    for (let i = 0; i < 2; i++) {
      const angle = (Math.PI * i) / 1;
      const newSlime = new Slime(this.scene, 
        this.sprite.x + Math.cos(angle) * 30,
        this.sprite.y + Math.sin(angle) * 30
      );
      this.scene.enemies.push(newSlime);
    }
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

// ========================================
// FONCTION DE CRÉATION
// ========================================

function spawnEnemies(scene, spawns, types, totalCount) {
  const enemies = [];
  const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);

  for (let i = 0; i < totalCount; i++) {
    const spawn = Phaser.Utils.Array.GetRandom(spawns);
    const randomX = spawn.x + Phaser.Math.Between(0, spawn.width || 16);
    const randomY = spawn.y + Phaser.Math.Between(0, spawn.height || 16);
    
    let random = Math.random() * totalWeight;
    let selectedType = types[0].class;
    
    for (const type of types) {
      random -= type.weight;
      if (random <= 0) {
        selectedType = type.class;
        break;
      }
    }
    
    enemies.push(new selectedType(scene, randomX, randomY));
  }

  return enemies;
}

export function createEnemies(scene, roomCount = 0) {
  const enemies = [];
  
  // Calcul du nombre d'ennemis : 6 de base + 1 par 2 salles
  const baseEnemyCount = 5 + Math.floor(roomCount / 2);
  
  const airSpawns = scene.map.filterObjects('calque_ennemi', obj => obj.name === 'spawn_ennemi_1');
  const groundSpawns = scene.map.filterObjects('calque_ennemi', obj => obj.name === 'spawn_ennemi_2');
  const minibossSpawns = scene.map.filterObjects('calque_ennemi', obj => obj.name === 'spawn_miniboss');
  
  if (airSpawns.length === 0 && groundSpawns.length === 0 && minibossSpawns.length === 0) {
    console.warn('Aucun point de spawn trouvé');
    return enemies;
  }

  if (!scene.projectilePool) {
    scene.projectilePool = new ProjectilePool(scene, 20);
  }

  // Déterminer quelle zone de spawn est disponible et répartir tous les ennemis
  const hasAirSpawns = airSpawns.length > 0;
  const hasGroundSpawns = groundSpawns.length > 0;

  if (hasAirSpawns && hasGroundSpawns) {
    // Les deux zones existent : répartir 40% aérien, 60% terrestre
    const airCount = Math.ceil(baseEnemyCount * 0.4);
    const groundCount = baseEnemyCount - airCount;

    const airTypes = [
      { class: Bat, weight: 30 },
      { class: Fly, weight: 25 },
      { class: Skull, weight: 25 },
      { class: Ghost, weight: 20 }
    ];
    
    const groundTypes = [
      { class: Goblin, weight: 10 },
      { class: Rat, weight: 20 },
      { class: Skeleton, weight: 10 },
      { class: Slime, weight: 40 },
      { class: Spider, weight: 20 }
    ];
    
    enemies.push(...spawnEnemies(scene, airSpawns, airTypes, airCount));
    enemies.push(...spawnEnemies(scene, groundSpawns, groundTypes, groundCount));
  } else if (hasAirSpawns) {
    // Seulement des spawns aériens : tous les ennemis sont aériens
    const airTypes = [
      { class: Bat, weight: 30 },
      { class: Fly, weight: 25 },
      { class: Skull, weight: 25 },
      { class: Ghost, weight: 20 }
    ];
    
    enemies.push(...spawnEnemies(scene, airSpawns, airTypes, baseEnemyCount));
  } else if (hasGroundSpawns) {
    // Seulement des spawns terrestres : tous les ennemis sont terrestres
    const groundTypes = [
      { class: Goblin, weight: 10 },
      { class: Rat, weight: 20 },
      { class: Skeleton, weight: 10 },
      { class: Slime, weight: 40 },
      { class: Spider, weight: 20 }
    ];
    
    enemies.push(...spawnEnemies(scene, groundSpawns, groundTypes, baseEnemyCount));
  }

  // Miniboss (indépendant du nombre d'ennemis basiques)
  if (minibossSpawns.length > 0) {
    const minibossTypes = [
      { class: SkullKing, weight: 25 },
      { class: BatLord, weight: 35 },
      { class: RatKing, weight: 25 },
      { class: SlimeKing, weight: 15 }
    ];
    
    for (const spawn of minibossSpawns) {
      const randomX = spawn.x + Phaser.Math.Between(0, spawn.width || 16);
      const randomY = spawn.y + Phaser.Math.Between(0, spawn.height || 16);
      
      const totalWeight = minibossTypes.reduce((sum, t) => sum + t.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedType = minibossTypes[0].class;
      
      for (const type of minibossTypes) {
        random -= type.weight;
        if (random <= 0) {
          selectedType = type.class;
          break;
        }
      }
      
      enemies.push(new selectedType(scene, randomX, randomY));
    }
  }

  return enemies;
}

export { ProjectilePool };