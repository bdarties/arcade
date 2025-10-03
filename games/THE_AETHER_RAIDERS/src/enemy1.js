import Enemy from "./Enemy.js";

export default class EnemyParabolic extends Enemy {
  constructor(scene, x, y, target) {
    super(scene, x, y, "img_enemy1", 3, target, 2, 1, 1);

    // flags / stockage état
    this.isPreparing = false;
    this._prevVelocity = { x: 0, y: 0 };
    this._pausedTweens = [];

    // attendre un "tick" pour être sûr que this.scene est initialisé
    scene.time.delayedCall(0, () => {
      this.scheduleNextShot();
    });
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
    // si on est en préparation, on force la vitesse à 0 et on ne propage pas l'update
    if (this.isPreparing) {
      if (this.body) this.body.setVelocity(0, 0);
      return;
    }
    if (super.preUpdate) super.preUpdate(time, delta);
  }

  update(time, delta) {
    // idem pour update() si le parent l'utilise
    if (this.isPreparing) {
      if (this.body) this.body.setVelocity(0, 0);
      return;
    }
    if (super.update) super.update(time, delta);
  }

  attack() {
    if (!this.active || !this.target || !this.target.active) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist > 500) return;

    let bullet = this.projectiles.create(this.x, this.y, "tir_enemy");
    bullet.setTint(0x00ffff);
    bullet.setScale(0.4);
    if (bullet.setData) bullet.setData("enemyProjectile", true);

    const direction = this.target.x < this.x ? -1 : 1;
    const vx = direction * (150 + Math.random() * 50);
    const vy = -200 - Math.random() * 100;

    bullet.setVelocity(vx, vy);
    bullet.body.allowGravity = true;
  }
}
