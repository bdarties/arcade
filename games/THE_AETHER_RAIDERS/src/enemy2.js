import Enemy from "./Enemy.js";

export default class EnemyCone extends Enemy {
  constructor(scene, x, y, target) {
    super(scene, x, y, "img_enemy2", 5, target, 50, 5, 10); 
    this.isAttacking = false; // éviter de relancer pendant qu'il prépare
    this.startShooting();
  }

  startShooting() {
    this.scene.time.addEvent({
      delay: 3000,
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

    // L’ennemi "s’arrête" pendant 1 seconde
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
      bullet.setTint(0xff00ff);
      bullet.setScale(0.4);
      bullet.body.allowGravity = false;
      if (bullet.setData) bullet.setData("enemyProjectile", true);

      bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }
  }
}
