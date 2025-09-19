import XPOrb from "./XPOrb.js";

export default class Slime extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "slime");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.speed = 60; 
        this.facing = "right";
        this.target = scene.player || null;

        this.hp = this.maxHp = 120;

        this.healthBarBg = scene.add.rectangle(this.x, this.y - 20, 32, 5, 0x000000).setOrigin(0.5);
        this.healthBar   = scene.add.rectangle(this.x, this.y - 20, 32, 5, 0x00ff00).setOrigin(0.5);

        this.isKnockedBack = false;
        this.knockbackTimer = null;

        this.body.setCollideWorldBounds(true).setDrag(800).setMaxVelocity(500);
        this.points = 10; 
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
            if (this.scene.orbs) this.scene.orbs.add(new XPOrb(this.scene, this.x, this.y, 1));
            if (this.scene.addScore) this.scene.addScore(this.points);
            this.healthBar?.destroy();
            this.healthBarBg?.destroy();
            this.destroy();
            return;
        }

        this.healthBar.width = 32 * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

        if (attacker) {
            const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, this.x, this.y);
            this.knockback(250, angle, 150);
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

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.scene || !this.body) return;

        this.healthBarBg?.setPosition(this.x, this.y - 20);
        this.healthBar?.setPosition(this.x, this.y - 20);

        if (!this.target || this.isKnockedBack) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            const vx = (dx / dist) * this.speed;
            const vy = (dy / dist) * this.speed;
            this.body.setVelocity(vx, vy);
            this.facing = vx >= 0 ? "right" : "left";
            this.anims.play(`slime_walk_${this.facing}`, true);
        } else {
            this.body.setVelocity(0);
            this.anims.play(`slime_idle_${this.facing}`, true);
        }
    }
}