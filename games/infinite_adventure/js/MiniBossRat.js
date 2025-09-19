import XPOrb from "./XPOrb.js";

export default class MiniBossRat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "rat");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.speed = 150; // plus rapide que le rat normal
        this.facing = "right";
        this.target = scene.player || null;

        this.hp = this.maxHp = 500; // beaucoup plus de vie
        this.points = 150;
        this.contactDamage = 25;

        this.setScale(3); // plus grand que le rat normal
        this.body.setCollideWorldBounds(true).setDrag(600).setMaxVelocity(600);

        this.healthBarBg = scene.add.rectangle(this.x, this.y - 50, 80, 8, 0x000000).setOrigin(0.5);
        this.healthBar   = scene.add.rectangle(this.x, this.y - 50, 80, 8, 0x00ff00).setOrigin(0.5);

        this.isKnockedBack = false;
        this.knockbackTimer = null;

        // Dash
        this.lastDash = 0;
        this.dashCooldown = 5000;
        this.isDashing = false;
        this.dashSpeed = 800;
    }

    knockback(force, angle, duration = 150) {
        this.isKnockedBack = true;
        this.body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
        if (this.knockbackTimer) this.knockbackTimer.remove(false);
        this.knockbackTimer = this.scene.time.delayedCall(duration, () => this.isKnockedBack = false);
    }

    takeDamage(amount, attacker = null) {
        this.hp -= amount;
        if (this.hp <= 0) return this._die();

        this.healthBar.width = 80 * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

        if (attacker) {
            const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, this.x, this.y);
            this.knockback(250, angle, 150);
        }
    }

    _die() {
        if (!this.scene) return;
        this.scene.orbs?.add(new XPOrb(this.scene, this.x, this.y, 5));
        this.scene.addScore?.(this.points);
        this.healthBar?.destroy();
        this.healthBarBg?.destroy();
        this.destroy();
    }

    startDash() {
        if (!this.target || this.isDashing) return;

        this.isDashing = true;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.body.setVelocity(Math.cos(angle) * this.dashSpeed, Math.sin(angle) * this.dashSpeed);

        this.scene.time.delayedCall(600, () => {
            this.isDashing = false;
        });
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

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.scene || !this.body) return;

        this.healthBarBg?.setPosition(this.x, this.y - 50);
        this.healthBar?.setPosition(this.x, this.y - 50);

        if (!this.target || this.isKnockedBack) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        // Dash toutes les 5 secondes
        if (!this.isDashing && time > this.lastDash + this.dashCooldown) {
            this.startDash();
            this.lastDash = time;
            return;
        }

        if (!this.isDashing && dist > 0) {
            const vx = (dx / dist) * this.speed;
            const vy = (dy / dist) * this.speed;
            this.body.setVelocity(vx, vy);

            this.facing = vx >= 0 ? "right" : "left";
            this.anims.play("rat_right", true);
            this.setFlipX(this.facing === "left");
        }
    }
}