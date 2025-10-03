import Enemy from "./enemy.js";

export default class Ghost extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "ghost", {
            speed: 40,
            hp: 200,
            points: 30,
            contactDamage: 15,
            barWidth: 20,
            barHeight: 4
        });

        this.isInvincible = false;
        this.invincibilityDuration = 1800;
        this.invincibilityCooldown = 10000;
        this.lastInvincibility = 0;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || !this.active) return;

        if (time > this.lastInvincibility + this.invincibilityCooldown) {
            this.isInvincible = true;
            this.lastInvincibility = time;
            this.setAlpha(0.5);
            this.scene.time.addEvent({
                delay: this.invincibilityDuration,
                callback: () => { this.isInvincible = false; this.setAlpha(1); }
            });
        }

        this.moveToTarget();
        this.anims.play("ghost_walk", true);
    }

    takeDamage(amount) {
        if (this.isInvincible) return;
        super.takeDamage(amount);
    }

    static preload(scene) {
        scene.load.spritesheet("ghost", "assets/ghost.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        scene.anims.create({
            key: "ghost_walk",
            frames: scene.anims.generateFrameNumbers("ghost", { start: 0, end: 2 }),
            frameRate: 6,
            repeat: -1
        });
    }
}