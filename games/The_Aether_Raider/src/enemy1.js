import Enemy from "./Enemy.js";

export default class EnemyParabolic extends Enemy {
  constructor(scene, x, y, target) {
  super(scene, x, y, "img_enemy1", 0x00ffff, 1, target, 2, 1, 1); // 👈 passer target
  this.startShooting();
}


  startShooting() {
    this.scene.time.addEvent({
      delay: 2500,
      loop: true,
      callback: () => this.attack()
    });
  }

  attack() {
    // Vérifie si l'ennemi est actif et si le joueur est à portée
    if (!this.active || !this.target || !this.target.active) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist > 500) return; // 🔹 Ne tire que si le joueur est dans un rayon de 200

    // Tir parabolique
    let bullet = this.projectiles.create(this.x, this.y, "tir_enemy");
    bullet.setTint(0x00ffff);
    bullet.setScale(0.4);
    if (bullet.setData) bullet.setData('enemyProjectile', true);

    const direction = this.target.x < this.x ? -1 : 1;
    const vx = direction * (150 + Math.random() * 50);
    const vy = -200 - Math.random() * 100;

    bullet.setVelocity(vx, vy);
    bullet.body.allowGravity = true;
  }
}
