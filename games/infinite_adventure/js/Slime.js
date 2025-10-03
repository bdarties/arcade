import Enemy from "./enemy.js";

export default class Slime extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "slime", {
            speed: 60,
            hp: 120,
            points: 10,
            barWidth: 32,
            drag: 800,
            maxVelocity: 500
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || this.isKnockedBack) return;

        if (this.moveToTarget()) {
            this.anims.play(`slime_walk_${this.facing}`, true);
        } else {
            this.body.setVelocity(0);
            this.anims.play(`slime_idle_${this.facing}`, true);
        }
    }

    static preload(scene) {
        scene.load.spritesheet("slime", "assets/slime.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        const anims = [
            ["idle_right", 0, 1, 6],
            ["idle_left", 4, 5, 6],
            ["walk_right", 8, 10, 8],
            ["walk_left", 12, 14, 8]
        ];
        
        anims.forEach(([key, start, end, fps]) =>
            scene.anims.create({
                key: `slime_${key}`,
                frames: scene.anims.generateFrameNumbers("slime", { start, end }),
                frameRate: fps,
                repeat: -1
            })
        );
    }
}