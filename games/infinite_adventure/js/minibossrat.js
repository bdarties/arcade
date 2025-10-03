import MiniBoss from "./miniboss.js";

export default class MiniBossRat extends MiniBoss {
    constructor(scene, x, y) {
        super(scene, x, y, "rat", {
            speed: 150,
            hp: 500,
            points: 150,
            contactDamage: 25,
            barWidth: 80,
            barHeight: 8,
            barOffsetY: -50,
            drag: 600,
            maxVelocity: 600,
            dashSpeed: 800,
            dashCooldown: 5000
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.scene || !this.body) return;

        if (!this.target || this.isKnockedBack) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        // Dash régulier
        if (!this.isDashing && time > this.lastDash + this.dashCooldown) {
            this.startDash();
            this.lastDash = time;
            return;
        }

        if (!this.isDashing && dist > 0) {
            const vx = (dx / dist) * this.speed;
            const vy = (dy / dist) * this.speed;
            this.body.setVelocity(vx, vy);

            this.facing = vx >= 0 ? "right" : "left";
            this.anims.play("rat_right", true);
            this.setFlipX(this.facing === "left");
        }
    }

    static preload(scene) {
        scene.load.spritesheet("rat", "assets/rat.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("rat_right")) {
            scene.anims.create({
                key: "rat_right",
                frames: scene.anims.generateFrameNumbers("rat", { start: 0, end: 1 }),
                frameRate: 9,
                repeat: -1
            });
        }
    }
}