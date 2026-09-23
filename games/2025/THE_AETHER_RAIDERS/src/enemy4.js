import Enemy from "./Enemy.js";

export default class EnemyBowling extends Enemy {
  updateHealthBar() {
    if (!this.healthBar) return;
    this.healthBar.clear();

    // position au-dessus de l'ennemi, aligné à l'origine (0.5, 0.8)
    const barWidth = 40;
    const barHeight = 5;
    // x = centre, y = origin (0.8) - offset
    const x = this.x - barWidth / 2;
    const y = this.y - this.displayHeight * 0.8 - 10; // 10px au-dessus de l'origine

    // contour noir
    this.healthBar.fillStyle(0x000000);
    this.healthBar.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

    // remplissage rouge selon la vie restante
    const healthPercent = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
  }
  constructor(scene, x, y, target) {
  super(scene, x, y, "img_enemyBowler", 10, target, 20, 10, 30, 1200);
  // Corrige l'origine et la taille du sprite
    this.setOrigin(0.5, 0.8); 
    this.setScale(0.5);
    this.body.setSize(135, 204);
    this.body.setOffset(0, 0); // top-left alignment
  this.setScale(0.5); // Taille réduite pour correspondre à la hitbox
  
    this.isPreparing = false;
    this.randomMoveTimer = 0;
    this.lastDirection = 1; // 1 = droite, -1 = gauche

  // Track last direction for idle
  this._lastDirection = 1;


    // Animation de marche au spawn
    if (this._lastDirection === -1) {
      this.anims.play("enemy4_walk_gauche", true);
    } else {
      this.anims.play("enemy4_walk_droite", true);
    }

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

        // Animation de charge : utilise frames droite et flip pour gauche
        const direction = this.target.x < this.x ? -1 : 1;
        this._lastDirection = direction;
        const chargeFrames = [4, 5, 6];
        if (direction === -1) {
          this.setFlipX(true);
        } else {
          this.setFlipX(false);
        }
        this.setFrame(chargeFrames[0]);
        this.scene.time.delayedCall(333, () => {
          if (!this.active) return;
          this.setFrame(chargeFrames[1]);
          this.scene.time.delayedCall(333, () => {
            if (!this.active) return;
            this.setFrame(chargeFrames[2]);
            this.scene.time.delayedCall(333, () => {
              if (!this.active) return;
              this.isPreparing = false;
              this.attack();
              // Reprend la marche dans la bonne direction
              if (this._lastDirection === -1) {
                this.setFlipX(true);
                this.anims.play("enemy4_walk_droite", true);
              } else {
                this.setFlipX(false);
                this.anims.play("enemy4_walk_droite", true);
              }
              this.scheduleNextShot();
            });
          });
        });
      } else {
        // sinon, continuer à bouger random et replanifier
        this.scheduleNextShot();
      }
    });
  }

  preUpdate(time, delta) {
    // Si en préparation, freeze et ne change pas la frame
    if (this.isPreparing) {
      if (this.body) this.body.setVelocity(0, 0);
      return;
    }
    if (super.preUpdate) super.preUpdate(time, delta);
  }

  update(time, delta) {
    if (this.isPreparing) {
      if (this.body) this.body.setVelocity(0, 0);
      // Stop any walk animation during charge
      if (this.anims.isPlaying && (this.anims.currentAnim?.key === "enemy4_walk_droite")) {
        this.anims.stop();
      }
      return;
    }
    if (super.update) super.update(time, delta);

    // Détection direction réelle par vélocité
    if (this.body) {
      if (this.body.velocity.x > 1) {
        this._lastDirection = 1;
      } else if (this.body.velocity.x < -1) {
        this._lastDirection = -1;
      }
    }

    // === Random AI quand pas en range ===
    if (time > this.randomMoveTimer) {
      this.randomMoveTimer = time + Phaser.Math.Between(1000, 3000);
      const dir = Phaser.Math.Between(-1, 1); // -1 gauche, 0 stop, 1 droite
      this.body.setVelocityX(dir * 50);
    }

    // Animation selon la vélocité
    if (this.body) {
      if (Math.abs(this.body.velocity.x) > 1) {
        // Marche
        if (this._lastDirection === -1) {
          this.setFlipX(true);
        } else {
          this.setFlipX(false);
        }
        if (!this.isPreparing) {
          if (this.anims.currentAnim?.key !== "enemy4_walk_droite") {
            this.anims.play("enemy4_walk_droite", true);
          }
        }
      } else {
        // Idle
        if (this.anims.isPlaying) this.anims.stop();
        if (this._lastDirection === -1) {
          this.setFlipX(true);
          this.setFrame(0);
        } else {
          this.setFlipX(false);
          this.setFrame(0);
        }
      }
    }
  }

  attack() {
    if (!this.active || !this.target || !this.target.active) return;

    // La balle spawn au niveau de la hitbox visuelle (juste au-dessus du bas du sprite)
    let ball = this.projectiles.create(this.x, this.y, "baballe");
    ball.setScale(0.3);
    ball.body.allowGravity = false;
    if (ball.setData) ball.setData("enemyProjectile", true);

  // Détermine la direction d'attaque
  const direction = this.target.x < this.x ? -1 : 1;
  ball.setVelocityX(direction * 200);
  // Met à jour la direction pour l'animation
  this._lastDirection = direction;

    // ⚡ rotation continue pour simuler le roulement
    ball.rotationSpeed = direction * 0.1;
    ball.preUpdate = function (time, delta) {
      Phaser.Physics.Arcade.Sprite.prototype.preUpdate.call(this, time, delta);
      this.rotation += this.rotationSpeed;
    };
  }
}
