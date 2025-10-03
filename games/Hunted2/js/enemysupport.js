export default class enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, properties) {
    super(scene, x, y, "enemy_" + properties.type + "_move_right_SS");

    this.scene = scene;
    this.properties = properties;
    this.type = properties.type;

    this.anim_move_right_string = "anim_enemy_" + this.type + "_move_right";
    this.anim_shoot_right_string = "anim_enemy_" + this.type + "_shoot_right";
    this.anim_jump_right_string = "anim_enemy_" + this.type + "_jump_right";

    // Ajout à la scène et physique
    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0.2);
    this.body.setGravityY(300);

    this.projectileDuration = 1200;
    this.speed = 100;
    this.direction = "right";
    this.isShooting = false;
    this.isMoving = true;
    this.isJumping = false;
    this.invincible = false;

    // Points de vie selon type
    switch (this.type) {
      case 1: this.lifePoints = 2; break;
      case 2: this.lifePoints = 3; break;
      case 3: this.lifePoints = 5; break;
      case 4: this.lifePoints = 5; break;
      case 5: this.lifePoints = 5; this.speed = 0; this.setTint(0x0000FF); break;
      default: this.lifePoints = 1;
    }

    // Ennemi type 2 : tir automatique
    if (this.type == 2) {
      this.projectileSpeed = 300;
      this.timerShoot = this.scene.time.addEvent({
        delay: Phaser.Math.Between(1000, 3000),
        callback: this.fireBullet,
        callbackScope: this,
        loop: true
      });
    }

    // Ennemi type 1 : déplacement en tween
    if (this.type == 1) {
      this.body.allowGravity = false;
      this.destinationID = parseInt(this.properties.destination);

      this.scene.tweens.add({
        targets: this,
        x: this.scene.destinations[this.destinationID].x,
        y: this.scene.destinations[this.destinationID].y,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        onYoyo: function () { this.flipX = true; },
        onYoyoScope: this,
        onRepeat: function () { this.flipX = false; },
        onRepeatScope: this
      });
    }

    // Ennemi type 5 : regard alternatif
    if (this.type == 5) {
      this.look = this.scene.time.addEvent({
        delay: Phaser.Math.Between(1000, 3000),
        callback: function () { this.flipX = !this.flipX; },
        callbackScope: this,
        loop: true
      });
    }
  }

  initiateMobility() {
    if (this.type != 4) {
      this.setVelocityX(this.speed);
    }
  }

  update() {
    if (this.type != 4 && this.type != 5) {
      if (this.direction == "left") {
        const coords = this.getBottomLeft();
        const tuileSuivante = this.scene.platform_layer.getTileAtWorldXY(coords.x, coords.y + 10);
        if (!tuileSuivante || this.body.blocked.left) {
          this.direction = "right";
          this.setVelocityX(40);
        }
      } else if (this.direction == "right") {
        const coords = this.getBottomRight();
        const tuileSuivante = this.scene.platform_layer.getTileAtWorldXY(coords.x, coords.y + 10);
        if (!tuileSuivante || this.body.blocked.right) {
          this.direction = "left";
          this.setVelocityX(-40);
        }
      }
      this.flipX = this.direction == "left";
    }

    // Animations
    if (this.isShooting) {
      this.anims.play(this.anim_shoot_right_string, true);
    } else if (this.isJumping) {
      this.anims.play(this.anim_jump_right_string, true);
    } else {
      this.anims.play(this.anim_move_right_string, true);
    }
  }

  decreaseHealthPoints() {
    this.lifePoints--;
    if (this.lifePoints <= 0) {
      if (this.type == 2 && this.timerShoot) this.timerShoot.remove();
      this.destroy();
    }
  }

  getHealthPoints() {
    return this.lifePoints;
  }

  isDead() {
    return this.lifePoints <= 0;
  }

  fireBullet() {
    if ((this.scene.player.x < this.x && this.direction == "left") ||
        (this.scene.player.x > this.x && this.direction == "right")) {

      const projectile = this.scene.physics.add.sprite(this.x, this.y, 'bullet');
      this.scene.grp_bullet_enemy.add(projectile);
      projectile.body.allowGravity = false;
      projectile.setVelocityX(this.projectileSpeed);
      if (this.flipX) {
        projectile.setVelocityX(-this.projectileSpeed);
        projectile.flipX = true;
      }
      this.scene.time.delayedCall(this.projectileDuration, () => { projectile.destroy(); });
      this.timerShoot.delay = Phaser.Math.Between(1000, 3000);
    }
  }

  setInvincible() {
    this.invincible = true;
    this.setTint(0x00FF00);

    this.blinkAnimation = this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 150,
      ease: 'Linear',
      repeat: -1,
      yoyo: true
    });

    this.scene.time.delayedCall(1500, () => {
      this.invincible = false;
      this.clearTint();
      this.alpha = 1;
      this.blinkAnimation.stop();
    });
  }

  isInvincible() {
    return this.invincible;
  }
}
