import Enemy from "./Enemy.js";

export default class EnemyBowling extends Enemy {
  constructor(scene, x, y, target) {
    super(scene, x, y, "img_enemyBowler", 10, target, 20, 1000, 1000, 1200);

    this.isPreparing = false;
    this.randomMoveTimer = 0;

    scene.time.delayedCall(0, () => {
      this.scheduleNextShot();
    });
  }

  scheduleNextShot() {
    if (!this.scene) return;

    const delay = Phaser.Math.Between(2000, 5000);

    this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
      if (dist < 400) {
        // Préparation : stop et animation de charge
        this.body.setVelocity(0, 0);
        this.isPreparing = true;

        // ⚡ Ici tu peux déclencher ton anim "charge"
        this.play("enemyBowler_charge", true);

        this.scene.time.delayedCall(1000, () => {
          if (!this.active) return;

          this.isPreparing = false;
          this.attack();
          this.scheduleNextShot();
        });
      } else {
        // sinon, continuer à bouger random et replanifier
        this.scheduleNextShot();
      }
    });
  }

  preUpdate(time, delta) {
    if (this.isPreparing) {
      this.body.setVelocity(0, 0);
      return;
    }
    if (super.preUpdate) super.preUpdate(time, delta);
  }

  update(time, delta) {
    if (this.isPreparing) {
      this.body.setVelocity(0, 0);
      return;
    }

    if (super.update) super.update(time, delta);

    // === Random AI quand pas en range ===
    if (time > this.randomMoveTimer) {
      this.randomMoveTimer = time + Phaser.Math.Between(1000, 3000);
      const dir = Phaser.Math.Between(-1, 1); // -1 gauche, 0 stop, 1 droite
      this.body.setVelocityX(dir * 50);
    }
  }

  attack() {
    if (!this.active || !this.target || !this.target.active) return;

    let ball = this.projectiles.create(this.x, this.y, "bowling_ball");
    ball.setScale(0.6);
    ball.body.allowGravity = false;
    if (ball.setData) ball.setData("enemyProjectile", true);

    const direction = this.target.x < this.x ? -1 : 1;
    ball.setVelocityX(direction * 200);

    // ⚡ rotation continue pour simuler le roulement
    ball.rotationSpeed = direction * 0.1;
    ball.preUpdate = function (time, delta) {
      Phaser.Physics.Arcade.Sprite.prototype.preUpdate.call(this, time, delta);
      this.rotation += this.rotationSpeed;
    };
  }
}
