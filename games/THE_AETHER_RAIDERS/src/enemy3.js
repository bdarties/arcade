import Enemy from "./Enemy.js";

export default class EnemySpider extends Enemy {
  constructor(scene, x, y, target) {
    super(scene, x, y, "img_enemy3", 1, target, 5, 3, 5);

    this.jumpDelay = 4000; // délai entre chaque saut (ms)
    this.maxJumpHeight = 120; // hauteur maximale du saut
    this.spiderState = "idle";
    this.isJumping = false;
    this.setScale(1.4);

    // Ajout overlap dégâts
    if (this.target) {
      scene.physics.add.overlap(this, this.target, () => {
        if (!this.active || !this.target || !this.target.active) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        if (dist <= 700) {
          this.target.scene.perdreVie?.();
        }
      });
    }

    this.anims.play("spider_idle_right");
    this.idleTimer = null;
    this.startJumping();
  }

  getDirection() {
    if (!this.target) return "right"; // Par défaut
    return this.target.x < this.x ? "left" : "right";
  }

  startJumping() {
    this.scene.time.addEvent({
      delay: this.jumpDelay,
      loop: true,
      callback: () => this.prepareJump()
    });
  }

  prepareJump() {
    if (!this.active || !this.target || !this.target.active) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

    if (dist > 700) {
      this.spiderState = "idle";
      this.anims.play("spider_idle_" + this.getDirection());
      return;
    }

    // Accroupie avant de sauter (frame 2 ou 5 selon le sens)
    this.spiderState = "crouch";
    this.anims.play("spider_crouch_" + this.getDirection());

    // Un court délai avant de sauter
    this.scene.time.delayedCall(400, () => {
      if (!this.active || !this.target || !this.target.active) return;
      this.jumpToTarget();
    });
  }

  jumpToTarget() {
    // Prépare le saut (frame 3 ou 4 selon le sens)
    this.spiderState = "jump";
    this.anims.play("spider_jump_" + this.getDirection());
    this.isJumping = true;

    const startX = this.x;
    const startY = this.y;
    const endX = this.target.x;
    const endY = this.target.y;
    const duration = 2000;

    this.scene.tweens.add({
  targets: this,
  x: endX,
  y: endY,
  ease: "Linear",
  duration: duration,
  onUpdate: (tween, target) => {
    // Added safety check if target is active
    if (!target.active) return;
    const progress = tween.progress; // 0 → 1
    target.y =
      startY +
      (endY - startY) * progress +
      Math.sin(progress * Math.PI) * -this.maxJumpHeight;
  },
  onComplete: () => {
    if (!this.active) return;  // Check spider still alive
    this.isJumping = false;
    this.spiderState = "idle";
    // If target active when landing, play correct animation
    if (this.target && this.target.active) {
      this.anims.play("spider_idle_" + this.getDirection());
    }
    // Timer to prepare next crouch if still active
    this.idleTimer = this.scene.time.delayedCall(this.jumpDelay / 3, () => {
      if (
        this.active &&
        this.target &&
        this.target.active &&
        Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) <= 700
      ) {
        this.spiderState = "crouch";
        this.anims.play("spider_crouch_" + this.getDirection());
      }
    });
  }
});

  }

  attack() {
    // Vide, dégâts gérés par overlap
  }
}
