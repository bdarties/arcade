import MiniBoss from "./miniboss.js";

export default class MiniBossGhost extends MiniBoss {
    constructor(scene, x, y) {
        super(scene, x, y, "ghost", {
            speed: 90,
            hp: 400,
            points: 300,
            contactDamage: 18,
            barWidth: 75,
            barHeight: 7,
            barOffsetY: -48,
            drag: 550,
            maxVelocity: 500,
            dashSpeed: 0,
            dashCooldown: 8000
        });

        this.teleportCooldown = 5000;
        this.lastTeleport = 0;
        this.isTeleporting = false;
        this.floatPhase = 0;
    }

    teleportToTarget() {
        if (!this.target || this.isTeleporting) return;

        this.isTeleporting = true;
        this.setAlpha(0.3);

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                if (!this.active || !this.target) return;
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Phaser.Math.Between(80, 150);
                this.setPosition(
                    this.target.x + Math.cos(angle) * distance,
                    this.target.y + Math.sin(angle) * distance
                );

                this.scene.tweens.add({
                    targets: this,
                    alpha: 0.8,
                    duration: 400,
                    onComplete: () => {
                        this.isTeleporting = false;
                    }
                });
            }
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || this.isKnockedBack || this.isTeleporting) return;

        this.floatPhase += delta * 0.003;
        const floatOffset = Math.sin(this.floatPhase) * 2;

        if (time > this.lastTeleport + this.teleportCooldown) {
            this.teleportToTarget();
            this.lastTeleport = time;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.body.setVelocity(
                (dx / dist) * this.speed,
                (dy / dist) * this.speed + floatOffset
            );
            this.facing = dx >= 0 ? "right" : "left";
            this.anims.play(`ghost_${this.facing}`, true);
        }
    }

    static preload(scene) {
        scene.load.spritesheet("ghost", "assets/ghost.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("ghost_right")) {
            scene.anims.create({
                key: "ghost_right",
                frames: scene.anims.generateFrameNumbers("ghost", { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!scene.anims.exists("ghost_left")) {
            scene.anims.create({
                key: "ghost_left",
                frames: scene.anims.generateFrameNumbers("ghost", { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
        }
    }
}