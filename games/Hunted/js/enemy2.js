export default class Enemy2 extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, platformLayer = null) {
    super(scene, x, y, "enemy2_run");

    this.scene = scene;
    this.platformLayer = platformLayer;

    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.setScale(1.3);
    this.setCollideWorldBounds(true);
    this.setDepth(10);

    this.speed = 80;
    this.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    this.changeDirectionTimer = 0;
    this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);

    this.attackRange = 50;
    this.attackCooldown = 1500;
    this.lastAttackTime = 0;
    this.isAttacking = false;
    this.attackDuration = 500;
    this.attackHitbox = null;

    this.maxHealth = 5;
    this.currentHealth = this.maxHealth;
    this.isDead = false;
  }

  createHealthBar() {
    const barWidth = 35;
    const barHeight = 5;
    
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(0xff0000, 0.8);
    this.healthBarBg.fillRect(0, 0, barWidth, barHeight);
    this.healthBarBg.setDepth(11);
    
    this.healthBar = this.scene.add.graphics();
    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRect(0, 0, barWidth, barHeight);
    this.healthBar.setDepth(12);
    
    this.updateHealthBarPosition();
  }

  updateHealthBarPosition() {
    if (this.healthBarBg && this.healthBar) {
      const offsetX = -17.5;
      const offsetY = -30;
      
      this.healthBarBg.x = this.x + offsetX;
      this.healthBarBg.y = this.y + offsetY;
      this.healthBar.x = this.x + offsetX;
      this.healthBar.y = this.y + offsetY;
    }
  }

  updateHealthBar() {
    if (this.healthBar) {
      this.healthBar.clear();
      this.healthBar.fillStyle(0x00ff00, 1);
      const barWidth = 35;
      const barHeight = 5;
      const healthPercent = this.currentHealth / this.maxHealth;
      this.healthBar.fillRect(0, 0, barWidth * healthPercent, barHeight);
    }
  }

  takeDamage(amount = 1) {
    if (this.isDead) return;

    this.currentHealth -= amount;
    this.updateHealthBar();

    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    if (this.currentHealth <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();
    
    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }
    
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 50,
      duration: 500,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  getPlayer() {
    return this.scene.player || this.scene.player2 || null;
  }

  createAnimations() {
    if (!this.scene.anims.exists("anim_enemy2_run")) {
      this.scene.anims.create({
        key: "anim_enemy2_run",
        frames: this.scene.anims.generateFrameNumbers("enemy2_run", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.scene.anims.exists("anim_enemy2_attack")) {
      this.scene.anims.create({
        key: "anim_enemy2_attack",
        frames: this.scene.anims.generateFrameNumbers("enemy2_attack", { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
  }

  update(time) {
    if (this.isDead) return;

    this.updateHealthBarPosition();

    if (this.isAttacking) {
      this.setVelocityX(0);
      return;
    }

    this.anims.play("anim_enemy2_run", true);

    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction === -1);

    if (this.body.blocked.right) {
      this.direction = -1;
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }
    if (this.body.blocked.left) {
      this.direction = 1;
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }

    if (this.body.blocked.down && this.platformLayer) {
      this.verifierLeVide();
    }

    if (time - this.changeDirectionTimer > this.changeDirectionDelay) {
      this.direction *= -1;
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }

    // ATTAQUE UNIQUEMENT DU CÔTÉ OÙ SE TROUVE LE JOUEUR
    this.tryAttackPlayer(time);
  }

  verifierLeVide() {
    const distanceRegard = 30;
    const positionX = this.x + (this.direction * distanceRegard);
    const positionY = this.y + 30;
    const tuile = this.platformLayer.getTileAtWorldXY(positionX, positionY);
    
    if (!tuile) {
      this.direction *= -1;
    }
  }

  tryAttackPlayer(time) {
    const player = this.getPlayer();
    if (!player) return;

    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      player.x, player.y
    );

    // VÉRIFIER QUE LE JOUEUR EST DU BON CÔTÉ (comme enemy1)
    const playerIsInFront = (this.direction === 1 && player.x > this.x) || 
                            (this.direction === -1 && player.x < this.x);

    if (distance < this.attackRange && playerIsInFront && time - this.lastAttackTime > this.attackCooldown) {
      this.attack(player);
      this.lastAttackTime = time;
    }
  }

  attack(target) {
    this.isAttacking = true;
    this.anims.play("anim_enemy2_attack", true);
    this.createAttackHitbox();

    this.scene.time.delayedCall(this.attackDuration, () => {
      this.isAttacking = false;
      if (this.attackHitbox) {
        this.attackHitbox.destroy();
        this.attackHitbox = null;
      }
    });
  }

  createAttackHitbox() {
    const offsetX = this.direction * 30;
    const hitboxX = this.x + offsetX;
    const hitboxY = this.y;

    this.attackHitbox = this.scene.physics.add.sprite(hitboxX, hitboxY, "bullet2");
    this.attackHitbox.setScale(0.8);
    this.attackHitbox.setAlpha(1);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.setDepth(15);

    this.scene.time.addEvent({
      delay: 50,
      repeat: Math.floor(this.attackDuration / 50),
      callback: () => {
        if (this.attackHitbox && this.attackHitbox.active) {
          const newOffsetX = this.direction * 30;
          this.attackHitbox.x = this.x + newOffsetX;
          this.attackHitbox.y = this.y;
        }
      }
    });
  }
}