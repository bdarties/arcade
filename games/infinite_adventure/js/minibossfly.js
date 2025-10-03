import MiniBoss from "./miniboss.js";

export default class MiniBossFly extends MiniBoss {
    constructor(scene, x, y) {
        super(scene, x, y, "fly", {
            speed: 100,
            hp: 200,
            points: 200,
            contactDamage: 15,
            barWidth: 60,
            barHeight: 5,
            barOffsetY: -40,
            drag: 600,
            maxVelocity: 500
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || this.isKnockedBack || this.isDashing) return;

        if (this.moveToTarget()) {
            this.anims.play(`fly_${this.facing}`, true);
        } else {
            this.body.setVelocity(0);
            this.anims.stop();
        }

        // Dash occasionnel
        if (!this.isDashing && time > this.lastDash + this.dashCooldown) {
            this.startDash();
            this.lastDash = time;
        }
    }

    static preload(scene) {
        scene.load.spritesheet("fly", "assets/fly.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        // Réutilise les mêmes animations que Fly normal
        const anims = [
            ["right", 0, 2, 8],
            ["left", 4, 6, 8]
        ];
        anims.forEach(([dir, start, end, fps]) =>
            scene.anims.create({
                key: `fly_${dir}`,
                frames: scene.anims.generateFrameNumbers("fly", { start, end }),
                frameRate: fps,
                repeat: -1
            })
        );
    }
}