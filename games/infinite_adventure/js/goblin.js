import Enemy from "./enemy.js";

export default class Goblin extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "goblin", {
            speed: 130,
            hp: 300,
            points: 15,
            contactDamage: 20,
            barWidth: 20,
            barHeight: 3,
            drag: 600,
            maxVelocity: 500
        });

        this.state = "approach"; // États : approach, orbit, dash, flee, patrol
        this.hasDashed = false;
        this.hasHitPlayer = false;

        this.orbitRadius = 100;
        this.orbitTime = 4000;
        this.orbitAngle = 0;
        this.orbitSpeed = 0.002;

        this.fleeTime = 3000;
        this.dashSpeed = 300;
        this.originalSpeed = 130;

        this.orbitStartTime = 0;
        this.fleeStartTime = 0;

        this.patrolPoints = [];
        this.currentPatrolIndex = 0;

        this.lowHpThreshold = 120; // Fuite si hp < 120
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.active || !this.target || this.isKnockedBack) return;

        // Gestion du flip selon la direction
        this.setFlipX(this.body.velocity.x < 0);

        // IA principale
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        // Décision dynamique
        if (this.hp <= this.lowHpThreshold && this.state !== "flee") {
            this.state = "flee";
            this.fleeStartTime = time;
        }

        switch(this.state) {
            case "approach":
                if (distanceToPlayer <= this.orbitRadius) {
                    this.state = "orbit";
                    this.orbitStartTime = time;
                    this.orbitAngle = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.x, this.y);
                    this.hasDashed = false;
                    this.hasHitPlayer = false;
                } else {
                    this.moveToPlayer();
                }
                break;

            case "orbit":
                this.orbitPlayer(time, delta);
                break;

            case "dash":
                this.dashPlayer();
                break;

            case "flee":
                this.flee(time);
                break;

            case "patrol":
                this.patrol(delta);
                break;
        }

        if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
            this.anims.play("goblin_walk", true);
        }
    }

    moveToPlayer() {
        this.scene.physics.moveToObject(this, this.target, this.speed);
    }

    orbitPlayer(time, delta) {
        const elapsed = time - this.orbitStartTime;
        if (elapsed >= this.orbitTime) {
            this.state = "dash";
            return;
        }

        this.orbitAngle += this.orbitSpeed * delta;
        const targetX = this.target.x + this.orbitRadius * Math.cos(this.orbitAngle);
        const targetY = this.target.y + this.orbitRadius * Math.sin(this.orbitAngle);

        this.scene.physics.moveTo(this, targetX, targetY, this.speed);

        const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
        if (distance < 4) this.body.setVelocity(0, 0);
    }

    dashPlayer() {
        if (this.hasDashed) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 25 && !this.hasHitPlayer) {
            this.hasHitPlayer = true;
            if (this.target.takeDamage) this.target.takeDamage(this.contactDamage);
            this.state = "flee";
            this.fleeStartTime = this.scene.time.now;
            this.speed = this.originalSpeed * 0.5;
            this.hasDashed = true;
            return;
        }

        const angle = Math.atan2(dy, dx);
        this.body.setVelocity(Math.cos(angle) * this.dashSpeed, Math.sin(angle) * this.dashSpeed);
    }

    flee(time) {
        const elapsed = time - this.fleeStartTime;
        if (elapsed >= this.fleeTime) {
            this.state = "approach";
            this.speed = this.originalSpeed;
            return;
        }

        if (!this.target) return;

        const dx = this.x - this.target.x;
        const dy = this.y - this.target.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            let angle = Math.atan2(dy, dx);
            let fleeVelocityX = Math.cos(angle) * this.speed;
            let fleeVelocityY = Math.sin(angle) * this.speed;

            if (Math.abs(this.body.velocity.x) < 5 && Math.abs(this.body.velocity.y) < 5) {
                const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                fleeVelocityX = Math.cos(randomAngle) * this.speed;
                fleeVelocityY = Math.sin(randomAngle) * this.speed;
            }

            this.body.setVelocity(fleeVelocityX, fleeVelocityY);
        } else {
            this.body.setVelocity(0, 0);
        }
    }


    patrol(delta) {
        if (this.patrolPoints.length === 0) return;

        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        this.scene.physics.moveTo(this, targetPoint.x, targetPoint.y, this.speed);
        const dist = Phaser.Math.Distance.Between(this.x, this.y, targetPoint.x, targetPoint.y);

        if (dist < 4) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        }
    }

    static preload(scene) {
        scene.load.spritesheet("goblin", "assets/goblin.png", { frameWidth: 16, frameHeight: 16 });
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