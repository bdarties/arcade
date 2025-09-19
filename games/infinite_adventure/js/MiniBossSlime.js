import XPOrb from "./XPOrb.js";
import Chest from "./Chest.js";

export default class MiniBossSlime extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "slime");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        Object.assign(this, {
            scene,
            speed: 60,
            dashSpeed: 700,
            facing: "right",
            target: scene.player || null,
            hp: 500,
            maxHp: 500,
            points: 400,
            isKnockedBack: false,
            knockbackTimer: null,
            lastDash: 0,
            dashCooldown: 6000,
            isCharging: false,
            isDashing: false
        });

        this.setScale(3);
        this.body.setCollideWorldBounds(true).setDrag(500).setMaxVelocity(700);

        this.healthBarBg = scene.add.rectangle(x, y - 50, 100, 8, 0x000000).setOrigin(0.5);
        this.healthBar = scene.add.rectangle(x, y - 50, 100, 8, 0x00ff00).setOrigin(0.5);
    }

    knockback(force, angle, duration = 200) {
        if (!this.scene || !this.active) return;
        this.isKnockedBack = true;
        this.body?.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
        this.knockbackTimer?.remove(false);
        this.knockbackTimer = this.scene.time.delayedCall(duration, () => { this.isKnockedBack = false; });
    }

    takeDamage(amount, attacker = null) {
        this.hp -= amount;
        if (this.hp <= 0) return this._die();

        const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        this.healthBar.width = 100 * ratio;

        if (attacker) {
            const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, this.x, this.y);
            this.knockback(400, angle, 200);
        }
    }

    _die() {
        if (!this.scene) return;
        const orb = new XPOrb(this.scene, this.x, this.y, 5);
        this.scene.orbs?.add(orb);
        this.scene.addScore?.(this.points);
        this.healthBar?.destroy();
        this.healthBarBg?.destroy();
        new Chest(this.scene, this.x, this.y);
        this.destroy();
    }

    startCharge() {
        if (this.isCharging || this.isDashing) return;
        this.isCharging = true;
        this.flashTween = this.scene.tweens.add({ targets: this, alpha: { from: 1, to: 0.3 }, duration: 200, yoyo: true, repeat: -1 });

        this.scene.time.delayedCall(2000, () => {
            if (!this.active) return;
            this.flashTween.stop();
            this.setAlpha(1);
            this.startDash();
        });
    }

    startDash() {
        if (!this.target || !this.active) return;
        this.isCharging = false;
        this.isDashing = true;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.body.setVelocity(Math.cos(angle) * this.dashSpeed, Math.sin(angle) * this.dashSpeed);

        this.scene.time.delayedCall(1200, () => { this.isDashing = false; this.setAlpha(1).setScale(3); });
    }

    static preload(scene) {
        scene.load.spritesheet("slime", "assets/slime.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("slime_walk_right")) {
            scene.anims.create({ key: "slime_walk_right", frames: scene.anims.generateFrameNumbers("slime", { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        }
        if (!scene.anims.exists("slime_walk_left")) {
            scene.anims.create({ key: "slime_walk_left", frames: scene.anims.generateFrameNumbers("slime", { start: 4, end: 7 }), frameRate: 6, repeat: -1 });
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.scene || !this.body) return;

        this.healthBar.setPosition(this.x, this.y - 50);
        this.healthBarBg.setPosition(this.x, this.y - 50);

        if (!this.target || this.isKnockedBack || this.isCharging || this.isDashing) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            this.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
            this.facing = this.body.velocity.x >= 0 ? "right" : "left";
            this.anims.play(this.facing === "right" ? "slime_walk_right" : "slime_walk_left", true);
        }

        if (time > this.lastDash + this.dashCooldown) {
            this.startCharge();
            this.lastDash = time;
        }
    }
}