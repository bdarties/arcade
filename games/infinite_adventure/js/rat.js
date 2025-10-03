import Enemy from "./enemy.js";

export default class Rat extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "rat", {
            speed: scene.player?.speed * 0.8 || 100,
            hp: 150,
            points: 15,
            contactDamage: 12,
            barWidth: 24,
            barHeight: 4,
            drag: 600,
            maxVelocity: 500
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || this.isKnockedBack) return;

        if (this.moveToTarget()) {
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