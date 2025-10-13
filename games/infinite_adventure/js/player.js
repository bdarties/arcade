export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.health = 100;
    this.maxHealth = 100;
    this.xp = 0;
    this.maxXP = 100;
    this.level = 0;
    this.speed = 100;
    this.healthRegen = 1;
    this.lastRegenTime = 0;
    
    // États
    this.isGameOver = false;
    this.isDying = false;
    this.isFalling = false;
    
    // Attaque
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackDelay = 800;
    this.attackRange = 60;
    this.attackRangeSq = 1600;
    this.attackDamage = 25;
    
    this.spawnPoint = { x, y };
    this.createSprite(x, y);
    this.createWeapon(x, y);
  }

  createSprite(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, 'dude')
      .setCollideWorldBounds(true);
    this.body = this.sprite.body;
    this.body.setSize(12, 14).setOffset(2, 2);
    this.sprite.anims.play('idle', true);
  }

  createWeapon(x, y) {
    this.weapon = this.scene.add.sprite(x, y, 'weapons_animated')
      .setVisible(false)
      .setDepth(10)
      .setOrigin(0.5, 0.5);
  }

  update(cursors, time) {
    if (this.isGameOver || this.isDying || this.isFalling) return;

    this.updateMovement(cursors);
    this.updateHealthRegen(time);
  }

  updateMovement(cursors) {
    const { left, right, up, down } = cursors;
    this.body.setDrag(600).setMaxVelocity(this.speed);

    const vx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
    const vy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);

    if (vx) this.sprite.setFlipX(vx < 0);

    if (vx || vy) {
      const invLen = 1 / Math.sqrt(vx * vx + vy * vy);
      this.body.setAcceleration(vx * invLen * 500, vy * invLen * 500);
      if (this.sprite.anims.currentAnim?.key !== 'walk') {
        this.sprite.anims.play('walk', true);
      }
    } else {
      this.body.setAcceleration(0);
      if (this.sprite.anims.currentAnim?.key !== 'idle') {
        this.sprite.anims.play('idle', true);
      }
    }
  }

  updateHealthRegen(time) {
    if (this.healthRegen > 0 && this.health < this.maxHealth && time - this.lastRegenTime >= 1000) {
      this.heal(this.healthRegen);
      this.lastRegenTime = time;
    }
  }

  takeDamage(amount = 10) {
    if (this.isGameOver || this.isDying || this.isFalling) return;
    
    this.health = Math.max(0, this.health - amount);
    
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite?.active) {
        this.sprite.clearTint();
      }
    });
    
    if (this.health <= 0) this.death();
  }

  death() {
    if (this.isDying) return;
    this.isDying = true;
    
    this.body?.setVelocity(0, 0).setAcceleration(0, 0);
    this.weapon?.setVisible(false);
    this.sprite.anims.stop();
    this.sprite.anims.play('death', true);
    
    this.sprite.once('animationcomplete', () => {
      this.scene.time.delayedCall(1000, () => {
        this.isGameOver = true;
        this.scene.scene.launch('GameOverScene');
      });
    });
  }

  fall() {
    if (this.isFalling || this.isDying || this.isGameOver) return;
    this.isFalling = true;
    
    this.body?.setVelocity(0, 0).setAcceleration(0, 0);
    this.weapon?.setVisible(false);
    this.sprite.anims.stop();
    this.sprite.anims.play('fall', true);
    
    this.sprite.once('animationcomplete', () => {
      const damage = Math.floor(this.maxHealth / 2);
      this.health = Math.max(0, this.health - damage);
      
      if (this.health <= 0) {
        this.isDying = true;
        this.isGameOver = true;
        this.scene.scene.launch('GameOverScene');
        return;
      }
      
      this.sprite.setPosition(this.spawnPoint.x, this.spawnPoint.y);
      this.sprite.setAlpha(0.5);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 1,
        duration: 300,
        ease: 'Power2'
      });
      
      this.isFalling = false;
      this.sprite.anims.play('idle', true);
    });
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.maxXP) {
      this.xp -= this.maxXP;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.scene.scene.pause();
    
    if (!this.scene.scene.get('LevelUpScene')) {
      this.scene.scene.add('LevelUpScene', this.scene.LevelUpScene, true);
    } else {
      this.scene.scene.launch('LevelUpScene');
    }
  }

  attack(target) {
    const now = this.scene.time.now;
    if (this.isAttacking || now < this.attackCooldown) return false;

    this.isAttacking = true;
    this.attackCooldown = now + this.attackDelay;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      target.sprite.x, target.sprite.y
    );

    this.weapon.setPosition(this.sprite.x, this.sprite.y)
      .setVisible(true)
      .setRotation(angle + Math.PI)
      .setFlipY(Math.abs(angle) <= Math.PI / 2)
      .play('sword_slash');

    return true;
  }

  finishAttack(enemies) {
    this.weapon.setVisible(false);
    this.isAttacking = false;

    const px = this.sprite.x;
    const py = this.sprite.y;
    const rangeSq = this.attackRangeSq;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      
      if (!e.isAlive()) continue;
      
      const dx = e.sprite.x - px;
      const dy = e.sprite.y - py;

      if (dx * dx + dy * dy <= rangeSq) {
        e.takeDamage(this.attackDamage, px, py);
      }
    }
  }

  destroy() {
    this.sprite?.destroy();
    this.weapon?.destroy();
  }
}