import Enemy from "./enemy.js";

export default class Fly extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "fly", {
            speed: scene.player?.speed || 120,
            hp: 30,
            points: 5,
            contactDamage: 5,
            barWidth: 20,
            barHeight: 3,
            drag: 600,
            maxVelocity: 500
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || this.isKnockedBack) return;

        if (this.moveToTarget()) {
            this.anims.play(`fly_${this.facing}`, true);
        } else {
            this.body.setVelocity(0);
            this.anims.stop();
        }
    }

    static preload(scene) {
        scene.load.spritesheet("fly", "assets/fly.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        Enemy.createDirectionalAnimations(scene, "fly", [["right", 0, 2], ["left", 4, 6]], 8);
    }
}