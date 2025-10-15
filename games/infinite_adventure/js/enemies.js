export const ENEMY_STATE = {
  IDLE: 0,
  CHASE: 1,
  PREPARE_CHARGE: 2,
  CHARGING: 3,
  COOLDOWN: 4,
  SHOOTING: 5,
  GHOSTING: 6
};

class ProjectilePool {
  constructor(scene, maxSize = 20) {
    this.scene = scene;
    this.pool = [];
    this.active = new Set();
    this.tileSize = 16;
    
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
    this.active.add(proj);
    return proj;
  }

  release(proj) {
    this.active.delete(proj);
    proj.setActive(false).setVisible(false);
    proj.body.enable = false;
    proj.body.setVelocity(0, 0);
    proj.setRotation(0);
    this.pool.push(proj);
  }

  updateAll(player, collisionLayer, propsCollisionLayer) {
    const now = this.scene.time.now;
    const px = player.x;
    const py = player.y;
    const cam = this.scene.cameras.main;
    const viewLeft = cam.scrollX - 50;
    const viewRight = cam.scrollX + cam.width + 50;
    const viewTop = cam.scrollY - 50;
    const viewBottom = cam.scrollY + cam.height + 50;
    
    const toRelease = [];
    
    for (const proj of this.active) {
      if (!proj.active) {
        toRelease.push(proj);
        continue;
      }
      
      const projX = proj.x;
      const projY = proj.y;
      
      if (projX < viewLeft || projX > viewRight || projY < viewTop || projY > viewBottom) {
        toRelease.push(proj);
        continue;
      }
      
      proj.rotation += 0.15;
      
      const tileX = Math.floor(projX / this.tileSize);
      const tileY = Math.floor(projY / this.tileSize);
      
      const wallTile = collisionLayer?.getTileAt(tileX, tileY);
      if (wallTile?.properties?.Solide) {
        toRelease.push(proj);
        continue;
      }
      
      const propTile = propsCollisionLayer?.getTileAt(tileX, tileY);
      if (propTile?.properties?.Solide) {
        toRelease.push(proj);
        continue;
      }
      
      const dx = projX - px;
      const dy = projY - py;
      if (dx * dx + dy * dy < 144) {
        if (proj.enemyRef?.isAlive()) {
          proj.enemyRef.onProjectileHit(player);
        }
        toRelease.push(proj);
        continue;
      }
      
      if (now > proj.destroyTime) {
        toRelease.push(proj);
      }
    }
    
    for (let i = 0; i < toRelease.length; i++) {
      this.release(toRelease[i]);
    }
  }

  clear() {
    const toRelease = Array.from(this.active);
    for (let i = 0; i < toRelease.length; i++) {
      this.release(toRelease[i]);
    }
  }
}

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
    this.tintTimer = null;
    this.knockbackTimer = null;
    this.tileSize = 16;
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
      
      const playerIndex = player === this.scene.player1 ? 1 : 2;
      this.scene.damagePlayer(damage, playerIndex);
      
      this.attackCooldown = currentTime + this.config.attackDelay;
    }
  }

  checkChargePath(targetX, targetY) {
    if (!this.scene.collisionLayer || !this.scene.propsCollisionLayer) return false;
    
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distSq = dx * dx + dy * dy;
    const distance = Math.sqrt(distSq);
    const steps = Math.ceil(distance / this.tileSize);
    
    if (steps === 0) return false;
    
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 1; i <= steps; i++) {
      const checkX = this.sprite.x + stepX * i;
      const checkY = this.sprite.y + stepY * i;
      const tileX = Math.floor(checkX / this.tileSize);
      const tileY = Math.floor(checkY / this.tileSize);

      const wallTile = this.scene.collisionLayer.getTileAt(tileX, tileY);
      if (wallTile?.properties?.Solide) return false;

      const propTile = this.scene.propsCollisionLayer.getTileAt(tileX, tileY);
      if (propTile?.properties?.Solide) return false;
    }
    return true;
  }

  moveToPlayer(player) {
    if (!this.isAlive()) return;
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.state = ENEMY_STATE.CHASE;
      const speed = this.config.normalSpeed;
      this.sprite.body.setVelocity(
        (dx / dist) * speed,
        (dy / dist) * speed
      );
      this.sprite.setFlipX(dx < 0);
    }
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
              const dist = Math.sqrt(distSq);
              this.chargeVelX = (dx / dist) * this.config.chargeSpeed;
              this.chargeVelY = (dy / dist) * this.config.chargeSpeed;
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
          this.sprite.body.setVelocity(this.chargeVelX, this.chargeVelY);
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

    if (this.tintTimer) {
      this.tintTimer.remove();
    }
    
    this.tintTimer = this.scene.time.delayedCall(100, () => {
      if (this.isAlive()) {
        this.sprite.clearTint();
      }
      this.tintTimer = null;
    });

    if (this.state !== ENEMY_STATE.CHARGING && this.state !== ENEMY_STATE.PREPARE_CHARGE) {
      const dx = this.sprite.x - attackerX;
      const dy = this.sprite.y - attackerY;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      
      if (dist > 0) {
        const knockbackForce = 300;
        this.sprite.body.setVelocity(
          (dx / dist) * knockbackForce,
          (dy / dist) * knockbackForce
        );

        if (this.knockbackTimer) {
          this.knockbackTimer.remove();
        }
        
        this.knockbackTimer = this.scene.time.delayedCall(150, () => {
          if (this.isAlive() && this.state !== ENEMY_STATE.CHARGING) {
            this.sprite.body.setVelocity(0, 0);
          }
          this.knockbackTimer = null;
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
    
    if (this.tintTimer) {
      this.tintTimer.remove();
      this.tintTimer = null;
    }
    if (this.knockbackTimer) {
      this.knockbackTimer.remove();
      this.knockbackTimer = null;
    }
    
    this.scene.addXP(this.config.xpValue);
    
    if (this.sprite?.body) {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.body.setEnable(false);
      this.sprite.setActive(false);
    }
    
    this.scene.enemyGroup?.remove(this.sprite, false, false);
    
    const particleCount = 3;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.getParticle?.();
      if (!particle) continue;
      
      particle.setPosition(this.sprite.x, this.sprite.y);
      const angle = (Math.PI * 2 * i) / particleCount;
      
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
    
    if (this.tintTimer) {
      this.tintTimer.remove();
      this.tintTimer = null;
    }
    if (this.knockbackTimer) {
      this.knockbackTimer.remove();
      this.knockbackTimer = null;
    }
    
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

export class Skull extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 60,
      maxHealth: 60,
      normalSpeed: 30,
      chargeSpeed: 0,
      detectionRange: 300,
      shootRange: 150,
      fleeRange: 40,
      shootCooldown: 3000,
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
    if (!this.isAlive() || !this.scene.projectilePool) return;
    
    const now = this.scene.time.now;
    if (now - this.lastShootTime < this.config.shootCooldown) return;
    
    this.lastShootTime = now;
    
    const proj = this.scene.projectilePool.get();
    if (!proj) return;
    
    proj.setPosition(this.sprite.x, this.sprite.y);
    proj.setFrame(10);
    proj.enemyRef = this;
    proj.destroyTime = now + 3000;
    proj.setDepth(10);
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const speed = 120;
      proj.body.setVelocity(
        (dx / dist) * speed,
        (dy / dist) * speed
      );
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
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const speed = this.config.normalSpeed;
      this.sprite.body.setVelocity(
        (dx / dist) * speed,
        (dy / dist) * speed
      );
      this.sprite.setFlipX(dx > 0);
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
    } else if (distSq <= this.fleeRangeSq) {
      this.fleeFromPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    } else if (distSq <= this.shootRangeSq) {
      this.sprite.body.setVelocity(0, 0);
      this.updateAnimation(time, this.config.idleFrames);
      
      const now = this.scene.time.now;
      if (now - this.lastShootTime >= this.config.shootCooldown) {
        this.shoot(player);
      }
      
      this.sprite.setFlipX(dx < 0);
    } else {
      this.moveToPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    }
  }
}

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
    this.lastGhostCheck = 0;
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
    
    if (time - this.lastGhostCheck >= 100) {
      this.lastGhostCheck = time;
      
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
    }
    
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
// ENNEMIS TERRESTRES
// ========================================

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

export class Rat extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, {
      health: 30,
      maxHealth: 30,
      normalSpeed: 90,
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
      idleFrames: [19, 20],
      moveFrames: [21, 22, 23],
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
      idleFrames: [24, 25],
      moveFrames: [26, 27, 28, 29],
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
    this.burstTimers = [];
  }

  shootBurst(player) {
    if (!this.isAlive() || !this.scene.projectilePool) return;
    
    const now = this.scene.time.now;
    if (now - this.lastShootTime < this.config.shootCooldown) return;
    
    this.lastShootTime = now;
    
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    
    const baseAngle = Math.atan2(dy, dx);
    const speed = 140;
    
    for (let i = 0; i < 3; i++) {
      const timer = this.scene.time.delayedCall(i * 150, () => {
        if (!this.isAlive()) return;
        
        const proj = this.scene.projectilePool.get();
        if (!proj) return;
        
        proj.setPosition(this.sprite.x, this.sprite.y);
        proj.setFrame(10);
        proj.setScale(1.3);
        proj.setTint(0xff6600);
        proj.enemyRef = this;
        proj.destroyTime = now + 4000;
        proj.setDepth(10);
        
        const angle = baseAngle + (i - 1) * 0.15;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        proj.body.setVelocity(cos * speed, sin * speed);
      });
      
      this.burstTimers.push(timer);
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
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const speed = this.config.normalSpeed;
      this.sprite.body.setVelocity(
        (dx / dist) * speed,
        (dy / dist) * speed
      );
      this.sprite.setFlipX(dx > 0);
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
    } else if (distSq <= this.fleeRangeSq) {
      this.fleeFromPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    } else if (distSq <= this.shootRangeSq) {
      this.sprite.body.setVelocity(0, 0);
      this.updateAnimation(time, this.config.idleFrames);
      
      const now = this.scene.time.now;
      if (now - this.lastShootTime >= this.config.shootCooldown) {
        this.shootBurst(player);
      }
      
      this.sprite.setFlipX(dx < 0);
    } else {
      this.moveToPlayer(player);
      this.updateAnimation(time, this.config.moveFrames);
    }
  }

  destroy() {
    for (let i = 0; i < this.burstTimers.length; i++) {
      if (this.burstTimers[i]) {
        this.burstTimers[i].remove();
      }
    }
    this.burstTimers = [];
    super.destroy();
  }
}

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
              
              const dist = Math.sqrt(distSq);
              this.chargeVelX = (dx / dist) * this.config.chargeSpeed;
              this.chargeVelY = (dy / dist) * this.config.chargeSpeed;
              
              this.sprite.body.setVelocity(0, 0);
              this.lastChargeTime = time;
              this.chargesRemaining = 2;
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
          this.sprite.body.setVelocity(this.chargeVelX, this.chargeVelY);
        }
        break;

      case ENEMY_STATE.CHARGING:
        this.updateAnimation(time, this.config.moveFrames);
        if (time >= this.stateTimer) {
          this.chargesRemaining--;
          
          if (this.chargesRemaining > 0) {
            this.state = ENEMY_STATE.PREPARE_CHARGE;
            this.stateTimer = time + 200;
            
            const dx2 = player.x - this.sprite.x;
            const dy2 = player.y - this.sprite.y;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            
            if (dist2 > 0) {
              this.chargeVelX = (dx2 / dist2) * this.config.chargeSpeed;
              this.chargeVelY = (dy2 / dist2) * this.config.chargeSpeed;
            }
            
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
    this.dodgeTintTimer = null;
  }

  takeDamage(damage, attackerX, attackerY) {
    if (!this.isAlive()) return;
    
    const now = this.scene.time.now;
    
    if (now >= this.dodgeCooldown && Math.random() < 0.5) {
      this.dodgeCooldown = now + this.dodgeDuration;
      
      const dx = this.sprite.x - attackerX;
      const dy = this.sprite.y - attackerY;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      
      if (dist > 0) {
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        this.sprite.body.setVelocity(cos * 400, sin * 400);
        
        this.sprite.setTint(0xffff00);
        
        if (this.dodgeTintTimer) {
          this.dodgeTintTimer.remove();
        }
        
        this.dodgeTintTimer = this.scene.time.delayedCall(200, () => {
          if (this.isAlive()) {
            this.sprite.setTint(0x00ff00);
          }
          this.dodgeTintTimer = null;
        });
        
        return;
      }
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

  destroy() {
    if (this.dodgeTintTimer) {
      this.dodgeTintTimer.remove();
      this.dodgeTintTimer = null;
    }
    super.destroy();
  }
}

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
      idleFrames: [19, 20],
      moveFrames: [21, 22, 23],
      frameRate: 5,
      spriteSheet: 'enemies_1'
    });
    
    this.sprite.setScale(2.5);
    this.splitThreshold = this.config.maxHealth * 0.5;
    this.hasSplit = false;
  }

  takeDamage(damage, attackerX, attackerY) {
    if (!this.isAlive()) return;
    
    super.takeDamage(damage, attackerX, attackerY);
    
    if (!this.hasSplit && this.health <= this.splitThreshold && this.health > 0) {
      this.hasSplit = true;
      this.split();
    }
  }

  split() {
    if (!this.isAlive()) return;
    
    const angles = [0, Math.PI];
    const spawnRadius = 30;
    
    for (let i = 0; i < 2; i++) {
      const angle = angles[i];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const newSlime = new Slime(
        this.scene,
        this.sprite.x + cos * spawnRadius,
        this.sprite.y + sin * spawnRadius
      );
      
      this.scene.enemies.push(newSlime);
      this.scene.enemyGroup?.add(newSlime.sprite);
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

function selectWeightedType(types, totalWeight, random) {
  let remaining = random * totalWeight;
  for (let i = 0; i < types.length; i++) {
    remaining -= types[i].weight;
    if (remaining <= 0) {
      return types[i].class;
    }
  }
  return types[0].class;
}

function spawnEnemies(scene, spawns, types, totalCount, totalWeight) {
  const enemies = [];
  const spawnCount = spawns.length;

  for (let i = 0; i < totalCount; i++) {
    const spawn = spawns[i % spawnCount];
    const randomX = spawn.x + Math.floor(Math.random() * (spawn.width || 16));
    const randomY = spawn.y + Math.floor(Math.random() * (spawn.height || 16));
    
    const selectedType = selectWeightedType(types, totalWeight, Math.random());
    enemies.push(new selectedType(scene, randomX, randomY));
  }

  return enemies;
}

export function createEnemies(scene, roomCount = 0) {
  const enemies = [];
  
  const baseEnemyCount = 5 + Math.floor(roomCount * 0.5);
  
  const spawnLayer = scene.map.getObjectLayer('calque_ennemi');
  if (!spawnLayer || !spawnLayer.objects) {
    console.warn('Aucun calque ennemi trouvé');
    return enemies;
  }

  const airSpawns = [];
  const groundSpawns = [];
  const minibossSpawns = [];
  
  for (let i = 0; i < spawnLayer.objects.length; i++) {
    const obj = spawnLayer.objects[i];
    if (obj.name === 'spawn_ennemi_1') {
      airSpawns.push(obj);
    } else if (obj.name === 'spawn_ennemi_2') {
      groundSpawns.push(obj);
    } else if (obj.name === 'spawn_miniboss') {
      minibossSpawns.push(obj);
    }
  }
  
  if (airSpawns.length === 0 && groundSpawns.length === 0 && minibossSpawns.length === 0) {
    console.warn('Aucun point de spawn trouvé');
    return enemies;
  }

  if (!scene.projectilePool) {
    scene.projectilePool = new ProjectilePool(scene, 20);
  }

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

  const airTotalWeight = 100;
  const groundTotalWeight = 100;

  const hasAirSpawns = airSpawns.length > 0;
  const hasGroundSpawns = groundSpawns.length > 0;

  if (hasAirSpawns && hasGroundSpawns) {
    const airCount = Math.ceil(baseEnemyCount * 0.4);
    const groundCount = baseEnemyCount - airCount;
    
    enemies.push(...spawnEnemies(scene, airSpawns, airTypes, airCount, airTotalWeight));
    enemies.push(...spawnEnemies(scene, groundSpawns, groundTypes, groundCount, groundTotalWeight));
  } else if (hasAirSpawns) {
    enemies.push(...spawnEnemies(scene, airSpawns, airTypes, baseEnemyCount, airTotalWeight));
  } else if (hasGroundSpawns) {
    enemies.push(...spawnEnemies(scene, groundSpawns, groundTypes, baseEnemyCount, groundTotalWeight));
  }

  if (minibossSpawns.length > 0) {
    const minibossTypes = [
      { class: SkullKing, weight: 25 },
      { class: BatLord, weight: 35 },
      { class: RatKing, weight: 25 },
      { class: SlimeKing, weight: 15 }
    ];
    
    const minibossTotalWeight = 100;
    
    for (let i = 0; i < minibossSpawns.length; i++) {
      const spawn = minibossSpawns[i];
      const randomX = spawn.x + Math.floor(Math.random() * (spawn.width || 16));
      const randomY = spawn.y + Math.floor(Math.random() * (spawn.height || 16));
      
      const selectedType = selectWeightedType(minibossTypes, minibossTotalWeight, Math.random());
      enemies.push(new selectedType(scene, randomX, randomY));
    }
  }

  return enemies;
}

export { ProjectilePool };