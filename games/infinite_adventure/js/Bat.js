import XPOrb from "./XPOrb.js";

export default class Bat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "bat");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.speed = 0.8 * 120;
        this.facing = "right";
        this.target = scene.player || null;

        this.hp = this.maxHp = 60;

        this.healthBarBg = scene.add.rectangle(this.x, this.y - 20, 32, 5, 0x000000).setOrigin(0.5);
        this.healthBar   = scene.add.rectangle(this.x, this.y - 20, 32, 5, 0x00ff00).setOrigin(0.5);

        this.isKnockedBack = false;
        this.knockbackTimer = null;

        this.body.setCollideWorldBounds(true).setDrag(200).setMaxVelocity(600);

        this.points = 20;
        this.state = "patrolling";
        this.lastDash = 0;
        this.dashCooldown = 1500;
        this.changeDirTimer = 0;
        this.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
        this.dashSpeed = 400;
        this.dashDuration = 400;
        this.recoverDuration = 600;
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
        this.setTint(0xff9999);
        this.scene.time.delayedCall(80, () => this.clearTint());

        if (attacker) {
            const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, this.x, this.y);
            this.knockback(250, angle, 150);
        }
    }

    static preload(scene) {
        scene.load.spritesheet("bat", "assets/bat.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        [["right", 0, 2, 8], ["left", 4, 6, 8]].forEach(([dir, start, end, fps]) =>
            scene.anims.create({
                key: `bat_${dir}`,
                frames: scene.anims.generateFrameNumbers("bat", { start, end }),
                frameRate: fps,
                repeat: -1
            })
        );
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        this.healthBarBg?.setPosition(this.x, this.y - 20);
        this.healthBar?.setPosition(this.x, this.y - 20);
    }

    update(player) {
        if (player) this.target = player;
        if (!this.scene || !this.body) return;
        if (this.isKnockedBack) {
            this.anims.play(`bat_${this.facing}`, true);
            return;
        }

        if (!this.target?.active) {
            this.body.setVelocity(0, 0);
            this.anims.play("bat_right", true);
            return;
        }

        const now = this.scene.time.now;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        switch (this.state) {
            case "patrolling":
                if (dist < 120 && now > this.lastDash + this.dashCooldown) {
                    this.state = "charging";
                    this.body.setVelocity(0, 0);
                    this.scene.time.delayedCall(180, () => this.active && this.doDash());
                } else this.patrolTowardPlayer(now);
                break;
            case "charging":
                this.body.setVelocity(0, 0);
                break;
            case "dashing":
                this.anims.play(this.body.velocity.x >= 0 ? "bat_right" : "bat_left", true);
                break;
            case "recovering":
                this.body.setVelocity(0, 0);
                this.anims.play(`bat_${this.facing}`, true);
                break;
        }
    }

    patrolTowardPlayer(now) {
        if (now > this.changeDirTimer) {
            this.changeDirTimer = now + Phaser.Math.Between(1000, 2000);
            this.direction = -this.direction;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        const vx = Math.cos(angle) * this.speed * 0.6 + this.direction * this.speed;
        const vy = Math.sin(angle) * this.speed * 0.6;

        this.body.setVelocity(vx, vy);
        this.facing = vx >= 0 ? "right" : "left";
        this.anims.play(`bat_${this.facing}`, true);
    }

    doDash() {
        if (!this.target?.active) {
            this.state = "patrolling";
            return;
        }

        this.state = "dashing";
        this.lastDash = this.scene.time.now;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.scene.physics.velocityFromRotation(angle, this.dashSpeed, this.body.velocity);
        this.anims.play(this.body.velocity.x >= 0 ? "bat_right" : "bat_left", true);

        this.scene.time.delayedCall(this.dashDuration, () => this.active && this.finishDash());
    }

    finishDash() {
        this.state = "recovering";
        this.body.setVelocity(0, 0);
        this.scene.time.delayedCall(this.recoverDuration, () => this.active && (this.state = "patrolling"));
    }
}