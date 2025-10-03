import MiniBoss from "./miniboss.js";

export default class MiniBossBat extends MiniBoss {
    constructor(scene, x, y) {
        super(scene, x, y, "bat", {
            speed: 180,
            hp: 350,
            points: 250,
            contactDamage: 20,
            barWidth: 70,
            barHeight: 7,
            barOffsetY: -45,
            drag: 700,
            maxVelocity: 600,
            dashSpeed: 900,
            dashCooldown: 4000
        });

        this.zigzagTimer = 0;
        this.zigzagPhase = 0;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || this.isKnockedBack) return;

        if (this.isDashing) {
            this.anims.play(`bat_${this.facing}`, true);
            return;
        }

        if (time > this.lastDash + this.dashCooldown) {
            this.startDash();
            this.lastDash = time;
            return;
        }

        this.zigzagTimer += delta;
        if (this.zigzagTimer > 300) {
            this.zigzagPhase += Math.PI / 4;
            this.zigzagTimer = 0;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            const perpX = -dy / dist;
            const perpY = dx / dist;
            const zigzag = Math.sin(this.zigzagPhase) * 80;
            
            const vx = (dx / dist) * this.speed + perpX * zigzag;
            const vy = (dy / dist) * this.speed + perpY * zigzag;
            
            this.body.setVelocity(vx, vy);
            this.facing = vx >= 0 ? "right" : "left";
            this.anims.play(`bat_${this.facing}`, true);
        }
    }

    static preload(scene) {
        scene.load.spritesheet("bat", "assets/bat.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("bat_right")) {
            scene.anims.create({
                key: "bat_right",
                frames: scene.anims.generateFrameNumbers("bat", { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!scene.anims.exists("bat_left")) {
            scene.anims.create({
                key: "bat_left",
                frames: scene.anims.generateFrameNumbers("bat", { start: 4, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }
}