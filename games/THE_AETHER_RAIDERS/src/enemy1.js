import Enemy from "./Enemy.js";

export default class EnemyParabolic extends Enemy {
  
  
  constructor(scene, x, y, target) {
  super(scene, x, y, "img_enemy1", 3, target, 3, 1, 1);
  this.setScale(0.7); 

    // flags / stockage état
    this.isPreparing = false;
    this._prevVelocity = { x: 0, y: 0 };
    this._pausedTweens = [];

  // Flag pour bloquer toute animation pendant l'attaque
  this.isAttackingAnim = false;

    // attendre un "tick" pour être sûr que this.scene est initialisé
    scene.time.delayedCall(0, () => {
      this.scheduleNextShot();
    });
    // Track last direction for idle
    this._lastDirection = 1; // 1: right, -1: left
  }

  scheduleNextShot() {
    if (!this.scene) return;

    const delay = Phaser.Math.Between(2000, 5000);

    this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;

      // --- BLOQUER MOUVEMENT ---
      if (this.body) {
        // sauvegarde vélocité actuelle
        this._prevVelocity = { x: this.body.velocity.x, y: this.body.velocity.y };

        // stop immédiat
        this.body.setVelocity(0, 0);

        // empêche la physique d'appliquer des mouvements (utile pour bloquer la simulation)
        this.body.moves = false;
      }

      // mettre en pause les tweens qui ciblent cet objet (s'il y en a)
      this._pausedTweens = [];
      if (this.scene.tweens && this.scene.tweens.getTweensOf) {
        const tweens = this.scene.tweens.getTweensOf(this) || [];
        tweens.forEach(t => {
          t.pause();
          this._pausedTweens.push(t);
        });
      } else if (this.scene.tweens && this.scene.tweens.getAll) {
        // fallback : vérifier tous les tweens et sélectionner ceux qui nous ciblent
        this.scene.tweens.getAll().forEach(t => {
          if (t && t.targets && t.targets.indexOf(this) !== -1) {
            t.pause();
            this._pausedTweens.push(t);
          }
        });
      }

      // flag pour signaler l'état "préparation"
      this.isPreparing = true;

      // attente 1s d'immobilité
      this.scene.time.delayedCall(1000, () => {
        if (!this.active) return;

        // --- RESTAURER MOUVEMENT ---
        if (this.body) {
          // réautorise la physique
          this.body.moves = true;
          // restaure la vélocité précédente (ou 0 si tu préfères)
          this.body.setVelocity(this._prevVelocity.x || 0, this._prevVelocity.y || 0);
        }

        // reprendre les tweens en pause
        this._pausedTweens.forEach(t => {
          if (t && t.resume) t.resume();
        });
        this._pausedTweens = [];

        this.isPreparing = false;

        // enfin tirer et reprogrammer
        this.attack();
        this.scheduleNextShot();
      });
    });
  }

  // Empêche le code de mouvement du parent de s'exécuter si on est en "preparing".
  // Selon comment ton Enemy est implémenté, soit il utilise `preUpdate`, soit `update`.
  // On surcharge les deux pour être sûr.
  preUpdate(time, delta) {
  // If charging, freeze movement and show idle frame
  if (this.isPreparing) {
    if (this.body) this.body.setVelocity(0, 0);
    this.anims.stop();
    if (this._lastDirection === 1) {
      this.setFrame(0); // idle right
    } else {
      this.setFrame(13); // idle left
    }
    return;
  }
  // Si animation d'attaque en cours, ne rien changer !
  if (this.isAttackingAnim) return;
  // Only call parent preUpdate if not charging
  if (super.preUpdate && !this.isPreparing) super.preUpdate(time, delta);

  // Animation de marche selon la direction
  if (this.body && this.body.velocity.x > 0) {
    this.anims.play("enemy1_walk_right", true);
    this._lastDirection = 1;
  } else if (this.body && this.body.velocity.x < 0) {
    this.anims.play("enemy1_walk_left", true);
    this._lastDirection = -1;
  } else {
    // Si immobile et pas en préparation, affiche frame idle
    this.anims.stop();
    if (this._lastDirection === 1) {
      this.setFrame(0);
    } else {
      this.setFrame(13);
    }
  }
}

  update(time, delta) {
    // idem pour update() si le parent l'utilise
    if (this.isPreparing) {
      if (this.body) this.body.setVelocity(0, 0);
      return;
    }
    // Empêche le mouvement random si en préparation
    // Ne pas appeler le parent update si charging
    if (super.update && !this.isPreparing) super.update(time, delta);
  }

  attack() {
    if (!this.active || !this.target || !this.target.active) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist > 500) return;

    const direction = this.target.x < this.x ? -1 : 1;
    this._lastDirection = direction;
    const frames = direction === 1 ? [4, 5, 6] : [9, 8, 7];

    this.isAttackingAnim = true; // start attack anim lock

    this.setFrame(frames[0]);
    this.scene.time.delayedCall(333, () => {
      if (!this.active) return;
      this.setFrame(frames[1]);
      this.scene.time.delayedCall(333, () => {
        if (!this.active) return;
        this.setFrame(frames[2]);
        // Fire bullet after last frame
        this.scene.time.delayedCall(334, () => {
          if (!this.active) return;
          let bullet = this.projectiles.create(this.x, this.y, "tir_enemy");
          bullet.setScale(0.8); // bullet 2x plus grosse
          if (bullet.setData) bullet.setData("enemyProjectile", true);

          const vx = direction * (150 + Math.random() * 50);
          const vy = -200 - Math.random() * 100;

          bullet.setVelocity(vx, vy);
          bullet.body.allowGravity = true;

          // Destroy bullet on collision with platformLayer
          if (this.scene.platformLayer) {
            this.scene.physics.add.collider(bullet, this.scene.platformLayer, () => {
              bullet.destroy();
            });
          }

          this.isAttackingAnim = false; // unlock after anim
        });
      });
    });
}

// Custom patrol for EnemyParabolic: disables movement during charging
  startPatrol(minX, maxX, speed = 60) {
    this.patrol = {
      minX,
      maxX,
      speed,
      dir: Math.random() < 0.5 ? -1 : 1,
    };

    // Remove any previous patrol event
    if (this.patrolEvent) {
      this.patrolEvent.remove(false);
      this.patrolEvent = undefined;
    }

    this.patrolEvent = this.scene.time.addEvent({
      delay: Phaser.Math.Between(900, 1800),
      loop: true,
      callback: () => {
        if (!this.active || this.isPreparing) return; // Don't move if charging
        const choice = Phaser.Math.Between(0, 2);
        if (choice === 0) {
          this.setVelocityX(0);
        } else if (choice === 1) {
          this.setVelocityX(this.patrol.dir * this.patrol.speed);
        } else {
          this.patrol.dir *= -1;
          this.setVelocityX(this.patrol.dir * this.patrol.speed);
        }
        this.patrolEvent.delay = Phaser.Math.Between(900, 1800);
      }
    });
  }


  updateHealthBar() {
    if (!this.healthBar) return;
    this.healthBar.clear();

    // position au-dessus de l'ennemi (lowered)
    const barWidth = 40;
    const barHeight = 5;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height * 0.1; // lower bar (was 0.6)

    // contour noir
    this.healthBar.fillStyle(0x000000);
    this.healthBar.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

    // remplissage rouge selon la vie restante
    const healthPercent = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
  }

  
}
