import MiniBoss from "./miniboss.js";

export default class MiniBossGoblin extends MiniBoss {
    constructor(scene, x, y) {
        super(scene, x, y, "goblin", {
            speed: 140,
            hp: 800,
            points: 400,
            contactDamage: 30,
            barWidth: 100,
            barHeight: 8,
            barOffsetY: -50
        });

        this.setScale(2);

        this.isEnraged = false; 
        this.enrageThreshold = 0.5; 
        this.dashCooldown = 5000;
        this.lastDash = 0;
    }

    enrageMode() {
        if (this.isEnraged) return;

        this.isEnraged = true;
        this.speed *= 1.5;
        this.contactDamage *= 1.5;

        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.7, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    dashAttack() {
        if (!this.target || !this.active) return;
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const angle = Math.atan2(dy, dx);

        this.body.setVelocity(Math.cos(angle) * (this.speed * 2), Math.sin(angle) * (this.speed * 2));

        this.scene.time.delayedCall(600, () => {
            if (this.active) this.body.setVelocity(0, 0);
        });
    }

    takeDamage(amount, attacker = null) {
        const wasAlive = this.hp > 0;
        super.takeDamage(amount, attacker);

        if (!this.isEnraged && this.hp <= this.maxHp * this.enrageThreshold) {
            this.enrageMode();
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || !this.active) return;

        if (this.isKnockedBack) return;

        const dx = this.target.x - this.x;
        this.setFlipX(dx < 0);

        if (this.isEnraged && time > this.lastDash + this.dashCooldown) {
            this.dashAttack();
            this.lastDash = time;
        } else {
            this.moveToTarget();
        }

        this.anims.play("goblin_walk", true);
    }

    static preload(scene) {
        scene.load.spritesheet("goblin", "assets/goblin.png", { 
            frameWidth: 16, 
            frameHeight: 16 
        });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("goblin_walk")) {
            scene.anims.create({
                key: "goblin_walk",
                frames: scene.anims.generateFrameNumbers("goblin", { start: 8, end: 11 }),
                frameRate: 6,
                repeat: -1
            });
        }
    }
}
