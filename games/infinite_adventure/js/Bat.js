import Enemy from "./enemy.js";

export default class Bat extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "bat", {
            speed: 96,
            hp: 60,
            points: 20,
            contactDamage: 15,
            barWidth: 32,
            drag: 200,
            maxVelocity: 600
        });

        this.state = "patrolling";
        this.lastDash = 0;
        this.dashCooldown = 1500;
        this.changeDirTimer = 0;
        this.direction = Phaser.Math.Between(0, 1) ? 1 : -1;
        this.dashSpeed = 400;
        this.dashDuration = 400;
        this.recoverDuration = 600;
    }

    update(time, player) {
        if (player) this.target = player;
        if (!this.scene || !this.body || this.isKnockedBack) return;

        if (!this.target?.active) {
            this.body.setVelocity(0, 0);
            this.anims.play("bat_right", true);
            return;
        }

        const now = this.scene.time.now;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        if (this.state === "patrolling") {
            if (dist < 120 && now > this.lastDash + this.dashCooldown) {
                this.state = "charging";
                this.body.setVelocity(0, 0);
                this.scene.time.delayedCall(180, () => this.active && this.scene && this.doDash());
            } else {
                this.patrol(now);
            }
        } else if (this.state === "charging" || this.state === "recovering") {
            this.body.setVelocity(0, 0);
            if (this.state === "recovering") this.anims.play(`bat_${this.facing}`, true);
        } else if (this.state === "dashing") {
            this.anims.play(this.body.velocity.x >= 0 ? "bat_right" : "bat_left", true);
        }
    }

    patrol(now) {
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
        if (!this.target?.active || !this.scene) {
            this.state = "patrolling";
            return;
        }

        this.state = "dashing";
        this.lastDash = this.scene.time.now;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.scene.physics.velocityFromRotation(angle, this.dashSpeed, this.body.velocity);
        this.scene.time.delayedCall(this.dashDuration, () => this.active && this.scene && this.finishDash());
    }

    finishDash() {
        this.state = "recovering";
        this.body.setVelocity(0, 0);
        this.scene.time.delayedCall(this.recoverDuration, () => this.active && this.scene && (this.state = "patrolling"));
    }

    static preload(scene) {
        scene.load.spritesheet("bat", "assets/bat.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        Enemy.createDirectionalAnimations(scene, "bat", [["right", 0, 2], ["left", 4, 6]], 8);
    }
}