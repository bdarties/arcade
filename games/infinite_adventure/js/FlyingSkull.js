import Enemy from "./enemy.js";

export default class FlyingSkull extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "flying_skull", { 
            speed: 40,
            hp: 20,
            points: 15,
            contactDamage: 10,
            barWidth: 16,
            barHeight: 3
        });

        this.fireCooldown = 2000;
        this.lastFire = 0;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.active || !this.target || !this.scene) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        let vx = 0, vy = 0;

        if (dist < 220 && dist > 25) {
            const angle = Math.atan2(dy, dx) + Math.PI;
            vx = Math.cos(angle) * this.speed;
            vy = Math.sin(angle) * this.speed;
        } else if (dist > 300) {
            const angle = Math.atan2(dy, dx);
            vx = Math.cos(angle) * this.speed;
            vy = Math.sin(angle) * this.speed;
        }

        this.body.setVelocity(vx, vy);

        if (dist > 25 && time > this.lastFire + this.fireCooldown) {
            this.shootFireBall();
            this.lastFire = time;
        }

        this.anims.play(`flying_skull_${this.facing}`, true);
    }

    shootFireBall() {
        if (!this.scene || !this.target || !this.active) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 25) return;

        const fire = this.scene.add.circle(this.x, this.y, 4, 0xff6600);
        this.scene.physics.add.existing(fire);
        fire.body.setCollideWorldBounds(true);
        fire.body.onWorldBounds = true;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        fire.body.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
        fire.damage = 20;
        fire.setDepth(1);

        this.scene.physics.add.overlap(fire, this.target, (f, player) => {
            if (!player?.active || !this.scene?.time) return;

            const now = this.scene.time.now;
            if (!player.lastHitTime) player.lastHitTime = 0;
            if (!player.hitCooldown) player.hitCooldown = 500;

            if (now >= player.lastHitTime + player.hitCooldown) {
                player.lastHitTime = now;
                player.health -= f.damage || 5;

                if (player.setTint) {
                    player.setTint(0xff9999);
                    this.scene.time.addEvent({ delay: 80, callback: () => player.clearTint() });
                }

                if (player.health <= 0) this.scene?.gameOver?.();
            }

            if (f.destroy) f.destroy();
        });

        this.scene.time.addEvent({ delay: 3000, callback: () => fire?.destroy && fire.destroy() });
    }

    static preload(scene) {
        scene.load.spritesheet("flying_skull", "assets/flying_skull.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        Enemy.createDirectionalAnimations(scene, "flying_skull", [["right", 0, 3], ["left", 4, 7]], 8);
    }
}