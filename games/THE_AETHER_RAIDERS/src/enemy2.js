
import Enemy from "./Enemy.js";

export default class EnemyCone extends Enemy {
  constructor(scene, x, y, target) {
    super(scene, x, y, "img_enemy2", 5, target, 50, 20, 30); 
    this.isAttacking = false; // éviter de relancer pendant qu'il prépare
    // Bornes de déplacement
    this.body.allowGravity = false;
    this.directionX = 1;
    this.directionY = 1;
    this.speedX = 3;
    this.speedY = 2;
    this.waveTime = 0;
    this.startShooting();
    this.startPatrol();
  }


  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // Désactive la gravité à chaque frame (sécurité)
    if (this.body && this.body.allowGravity !== false) {
      this.body.allowGravity = false;
    }
    // Only move if patrol bounds are set
    if (this.minX !== undefined && this.maxX !== undefined) {
      this.waveTime += delta;
      this.movePatrol(this.waveTime);
    }
    if (this.directionX === -1) {
  this.anims.play("enemy2_left", true);
} else {
  this.anims.play("enemy2_right", true);
}
  }

  startShooting() {
    this.scene.time.addEvent({
      delay: 7000,
      loop: true,
      callback: () => this.prepareAttack()
    });
  }

  prepareAttack() {
    if (!this.active || !this.target || !this.target.active || this.isAttacking) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist > 400) return;

    this.isAttacking = true;

    // 🔹 Bloquer la direction actuelle (pas dynamique)
    this.lockedAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);

    // Tourner vers la cible
    if (Math.cos(this.lockedAngle) < 0) {
      this.directionX = -1;
    } else {
      this.directionX = 1;
    }

    // L'ennemi stop pendant 1sec
    this.body.setVelocity(0, 0);

    this.scene.time.delayedCall(1000, () => {
      this.attack();
      this.isAttacking = false;
    });
  }

  attack() {
    if (!this.active || !this.lockedAngle) return;

    // 🔹 Seulement 3 balles
    for (let i = -1; i <= 1; i++) {
      const spread = Phaser.Math.DegToRad(i * 24); // écart fixe
      const angle = this.lockedAngle + spread;

      let bullet = this.projectiles.create(this.x, this.y, "tir_enemy");
      bullet.setTint(0xffbc2b);
      bullet.setScale(0.4);
      bullet.body.allowGravity = false;
      if (bullet.setData) bullet.setData("enemyProjectile", true);

      bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }
  }


  
  // Mouvement diagonal (horizontal + vertical)
  startPatrolDiagonal(minX, maxX, speedX, minY, maxY, speedY) {
    this.minX = minX;
    this.maxX = maxX;
    // Randomize speed around base value (±30%)
    const baseSpeedX = speedX !== undefined ? speedX : 2;
    const baseSpeedY = speedY !== undefined ? speedY : 1;
    this.speedX = Phaser.Math.Between(Math.floor(baseSpeedX * 0.7), Math.ceil(baseSpeedX * 1.3));
    this.speedY = Phaser.Math.Between(Math.floor(baseSpeedY * 0.7), Math.ceil(baseSpeedY * 1.3));
    this.minY = minY;
    this.maxY = maxY;
    // Randomize initial direction
    this.directionX = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    this.directionY = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
  }

  movePatrol() {
    if (this.minX === undefined || this.maxX === undefined) return;
    if (this.isAttacking) {
      this.body.setVelocity(0, 0);
      return;
    }
    let velocityX = this.speedX * this.directionX;
    let velocityY = 0;
    // Fluid sinusoidal movement on Y axis
    if (this.minY !== undefined && this.maxY !== undefined) {
      // Center Y and amplitude
      const centerY = (this.minY + this.maxY) / 2;
      const amplitude = (this.maxY - this.minY) / 2;
      velocityY = Math.sin(this.waveTime * 0.002) * amplitude * 0.2;
    }
    // Horizontal patrol logic
    if (this.x <= this.minX) {
      this.x = this.minX;
      this.directionX = 1;
      velocityX = this.speedX * this.directionX;
    } else if (this.x >= this.maxX) {
      this.x = this.maxX;
      this.directionX = -1;
      velocityX = this.speedX * this.directionX;
    }
    this.body.setVelocity(velocityX, velocityY);
  }
  
}
