import MiniBoss from "./miniboss.js";

export default class MiniBossSlime extends MiniBoss {
    constructor(scene, x, y) {
        super(scene, x, y, "slime", {
            speed: 60,
            hp: 500,
            points: 400,
            contactDamage: 30,
            barWidth: 100,
            barHeight: 8,
            barOffsetY: -50,
            drag: 500,
            maxVelocity: 700,
            dashSpeed: 700,
            dashCooldown: 6000
        });
    }

    startCharge() {
        if (this.isCharging || this.isDashing) return;
        this.isCharging = true;
        
        this.flashTween = this.scene.tweens.add({ 
            targets: this, 
            alpha: { from: 1, to: 0.3 }, 
            duration: 200, 
            yoyo: true, 
            repeat: -1 
        });

        this.scene.time.delayedCall(2000, () => {
            if (!this.active) return;
            this.flashTween.stop();
            this.setAlpha(1);
            this.isCharging = false;
            this.startDash();
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.scene || !this.body) return;

        if (!this.target || this.isKnockedBack || this.isCharging || this.isDashing) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            this.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
            this.facing = this.body.velocity.x >= 0 ? "right" : "left";
            this.anims.play(this.facing === "right" ? "slime_walk_right" : "slime_walk_left", true);
        }

        // Déclenchement du dash avec phase de charge
        if (time > this.lastDash + this.dashCooldown) {
            this.startCharge();
            this.lastDash = time;
        }
    }

    static preload(scene) {
        scene.load.spritesheet("slime", "assets/slime.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("slime_walk_right")) {
            scene.anims.create({ 
                key: "slime_walk_right", 
                frames: scene.anims.generateFrameNumbers("slime", { start: 0, end: 3 }), 
                frameRate: 6, 
                repeat: -1 
            });
        }
        if (!scene.anims.exists("slime_walk_left")) {
            scene.anims.create({ 
                key: "slime_walk_left", 
                frames: scene.anims.generateFrameNumbers("slime", { start: 4, end: 7 }), 
                frameRate: 6, 
                repeat: -1 
            });
        }
    }
}