import XPOrb from "./XPOrb.js";

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, config = {}) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.target = scene.player || null;
        this.speed = config.speed || 100;
        this.hp = this.maxHp = config.hp || 100;
        this.points = config.points || 10;
        this.contactDamage = config.contactDamage || 10;
        this.facing = config.facing || "right";
        this.barWidth = config.barWidth || 32;
        this.barHeight = config.barHeight || 5;
        this.barOffsetY = config.barOffsetY ?? -20;
        
        this.healthBarBg = scene.add.rectangle(x, y + this.barOffsetY, this.barWidth, this.barHeight, 0x000000).setOrigin(0.5);
        this.healthBar = scene.add.rectangle(x, y + this.barOffsetY, this.barWidth, this.barHeight, 0x00ff00).setOrigin(0.5);

        this.isKnockedBack = false;
        this.knockbackTimer = null;

        this.body.setCollideWorldBounds(true);
        if (config.drag) this.body.setDrag(config.drag);
        if (config.maxVelocity) this.body.setMaxVelocity(config.maxVelocity);
        if (config.scale) this.setScale(config.scale);

        this.once("destroy", () => {
            this.healthBar?.destroy();
            this.healthBarBg?.destroy();
        });
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
            this.die();
            return;
        }

        this.healthBar.width = this.barWidth * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
        this.setTint(0xff9999);
        this.scene.time.delayedCall(80, () => this.clearTint());

        if (attacker) {
            const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, this.x, this.y);
            this.knockback(attacker.knockbackForce || 200, angle, 150);
        }
    }

    die() {
        if (this.scene.orbs) this.scene.orbs.add(new XPOrb(this.scene, this.x, this.y, Math.ceil(this.points / 10)));
        if (this.scene.addScore) this.scene.addScore(this.points);
        this.scene.events.emit("enemyDied");
        this.destroy();
    }

    moveToTarget() {
        if (!this.target || this.isKnockedBack) return false;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
            this.facing = dx >= 0 ? "right" : "left";
            return true;
        }
        return false;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.healthBarBg && this.healthBar) {
            this.healthBarBg.setPosition(this.x, this.y + this.barOffsetY);
            this.healthBar.setPosition(this.x, this.y + this.barOffsetY);
        }
    }

    static createDirectionalAnimations(scene, key, frameRanges, frameRate = 8) {
        if (!scene.textures.exists(key)) {
            console.warn(`Texture "${key}" not found for animations`);
            return;
        }
        
        frameRanges.forEach(([dir, start, end]) => {
            const animKey = `${key}_${dir}`;
            if (scene.anims.exists(animKey)) return;
            
            try {
                scene.anims.create({
                    key: animKey,
                    frames: scene.anims.generateFrameNumbers(key, { start, end }),
                    frameRate,
                    repeat: -1
                });
            } catch (error) {
                console.warn(`Failed to create animation ${animKey}:`, error);
            }
        });
    }
}