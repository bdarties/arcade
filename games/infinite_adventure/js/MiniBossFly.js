import XPOrb from "./XPOrb.js";

export default class MiniBossFly extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "fly");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.speed = 100; // plus rapide que le fly normal
        this.facing = "right";
        this.target = scene.player || null;

        this.hp = this.maxHp = 200; // beaucoup plus de vie
        this.points = 200;
        this.contactDamage = 15;

        this.setScale(3); // Fly plus grand

        this.body.setCollideWorldBounds(true).setDrag(600).setMaxVelocity(500);

        this.healthBarBg = scene.add.rectangle(this.x, this.y - 40, 60, 5, 0x000000).setOrigin(0.5);
        this.healthBar = scene.add.rectangle(this.x, this.y - 40, 60, 5, 0x00ff00).setOrigin(0.5);

        this.isKnockedBack = false;
        this.knockbackTimer = null;
    }

    knockback(force, angle, duration = 150) {
        this.isKnockedBack = true;
        this.body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
        if (this.knockbackTimer) this.knockbackTimer.remove(false);
        this.knockbackTimer = this.scene.time.delayedCall(duration, () => this.isKnockedBack = false);
    }

    takeDamage(amount, attacker = null) {
        this.hp -= amount;
        if (this.hp <= 0) {
            if (this.scene.orbs) this.scene.orbs.add(new XPOrb(this.scene, this.x, this.y, 5));
            if (this.scene.addScore) this.scene.addScore(this.points);
            this.healthBar?.destroy();
            this.healthBarBg?.destroy();
            this.destroy();
            return;
        }

        this.healthBar.width = 60 * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

        if (attacker) {
            const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, this.x, this.y);
            this.knockback(250, angle, 150);
        }
    }

    static preload(scene) {
        scene.load.spritesheet("fly", "assets/fly.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
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

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.scene || !this.body) return;

        this.healthBarBg?.setPosition(this.x, this.y - 40);
        this.healthBar?.setPosition(this.x, this.y - 40);

        if (!this.target || this.isKnockedBack) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            const vx = (dx / dist) * this.speed;
            const vy = (dy / dist) * this.speed;
            this.body.setVelocity(vx, vy);
            this.facing = vx >= 0 ? "right" : "left";
            this.anims.play(`fly_${this.facing}`, true);
        } else {
            this.body.setVelocity(0);
            this.anims.stop();
        }
    }
}