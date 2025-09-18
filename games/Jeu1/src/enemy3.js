import Enemy from "./Enemy.js";

export default class EnemySpider extends Enemy {
  constructor(scene, x, y, target) {
    super(scene, x, y, "img_enemy3", 0xff00ff, 1, target, 5, 5, 5);

    this.jumpDelay = 2000; // délai entre chaque saut (ms)
    this.maxJumpHeight = 120; // hauteur maximale du saut

    // Ajout overlap dégâts
    if (this.target) {
      scene.physics.add.overlap(this, this.target, () => {
        if (!this.active || !this.target || !this.target.active) return;

        // 🔹 Vérifie le rayon de détection avant de faire des dégâts
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        if (dist <= 700) {
          this.target.scene.perdreVie?.();
        }
      });
    }

    this.startJumping();
  }

  startJumping() {
    this.scene.time.addEvent({
      delay: this.jumpDelay,
      loop: true,
      callback: () => this.jumpToTarget()
    });
  }

  jumpToTarget() {
    if (!this.active || !this.target || !this.target.active) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist > 700) return; // 🔹 Ne saute pas si le joueur est trop loin

    const startX = this.x;
    const startY = this.y;
    const endX = this.target.x;
    const endY = this.target.y;

    const dx = endX - startX;
    const dy = endY - startY;
    const duration = 2000;

    this.scene.tweens.add({
      targets: this,
      x: endX,
      y: endY,
      ease: "Linear",
      duration: duration,
      onUpdate: (tween, target) => {
        const progress = tween.progress; // 0 → 1
        target.y =
          startY +
          dy * progress +
          Math.sin(progress * Math.PI) * -this.maxJumpHeight;
      }
    });
  }

  attack() {
    // vide : les dégâts sont gérés par overlap
  }
}
