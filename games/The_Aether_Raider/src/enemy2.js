import Enemy from "./Enemy.js";

export default class EnemyCone extends Enemy {
  constructor(scene, x, y, target) {
    super(scene, x, y, "img_enemy2", 0x00ffff, 1, target, 50, 5, 10); // 👈 passer target
    this.startShooting();
  }

  startShooting() {
    this.scene.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.attack()
    });
  }

  attack() {
    if (!this.active || !this.target || !this.target.active) return;

    // 🔹 Vérifie le rayon de détection
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist > 400) return;

    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);

    for (let i = -2; i <= 2; i++) {
      const spread = Phaser.Math.DegToRad(i * (10 + Math.random() * 5));
      const angle = baseAngle + spread;

      let bullet = this.projectiles.create(this.x, this.y, "tir_enemy");
      bullet.setTint(0xff00ff);
      bullet.setScale(0.4);
      bullet.body.allowGravity = false;
      if (bullet.setData) bullet.setData("enemyProjectile", true);

      bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }
  }
}
