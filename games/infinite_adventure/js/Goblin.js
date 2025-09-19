import XPOrb from "./XPOrb.js";

export default class Goblin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "goblin");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.target = scene.player || null;

        this.speed = 130; // vitesse normale
        this.hp = this.maxHp = 300;
        this.facing = "right";

        // Barre de vie comme les autres ennemis
        this.healthBarBg = scene.add.rectangle(this.x, this.y - 20, 20, 3, 0x000000).setOrigin(0.5);
        this.healthBar   = scene.add.rectangle(this.x, this.y - 20, 20, 3, 0x00ff00).setOrigin(0.5);

        this.body.setCollideWorldBounds(true).setDrag(600).setMaxVelocity(500);
        this.contactDamage = 20;
        this.points = 15;

        // State machine
        this.state = "approach";
        this.hasDashed = false; // pour limiter un dash par orbite
        this.hasHitPlayer = false; // nouveau: pour savoir si on a touché le joueur
        this.orbitRadius = 100;
        this.orbitTime = 8000;
        this.orbitAngle = 0;
        this.orbitSpeed = 0.002;
        this.fleeTime = 6000; // 6 secondes de fuite
        this.dashSpeed = 300;
        this.originalSpeed = 130;

        this.orbitStartTime = 0;
        this.fleeStartTime = 0; // temps de début de fuite

        // Knockback
        this.isKnockedBack = false;
        this.knockbackTimer = null;
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

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.healthBarBg?.setPosition(this.x, this.y - 20);
        this.healthBar?.setPosition(this.x, this.y - 20);

        if (!this.active || !this.target || this.isKnockedBack) return;

        if (this.body.velocity.x > 0) { this.facing = "right"; this.setFlipX(false); }
        else if (this.body.velocity.x < 0) { this.facing = "left"; this.setFlipX(true); }

        switch(this.state) {
            case "approach":
                this.moveToPlayer(delta);
                const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
                if (dist <= this.orbitRadius) {
                    this.state = "orbit";
                    this.orbitStartTime = time;
                    this.orbitAngle = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.x, this.y);
                    this.hasDashed = false; // réinitialiser dash pour cette orbite
                    this.hasHitPlayer = false; // réinitialiser le contact
                }
                break;
            case "orbit":
                this.orbitPlayer(time, delta);
                break;
            case "dash":
                this.dashPlayer(delta);
                break;
            case "flee":
                this.flee(time);
                break;
        }

        if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
            this.anims.play("goblin_walk", true);
        }
    }

    moveToPlayer(delta) {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            const angle = Math.atan2(dy, dx);
            this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
        } else {
            this.body.setVelocity(0, 0);
        }
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

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const moveSpeed = this.speed * 0.8;
        this.body.setVelocity(dx * 0.1 * moveSpeed, dy * 0.1 * moveSpeed);
    }

    dashPlayer(delta) {
        if (this.hasDashed) return; // ne dash qu'une seule fois

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        // Vérifier la collision avec le joueur pendant le dash
        if (dist < 25 && !this.hasHitPlayer) { // distance de collision légèrement augmentée
            this.hasHitPlayer = true;
            // Infliger des dégâts au joueur (si vous avez cette méthode)
            if (this.target.takeDamage) {
                this.target.takeDamage(this.contactDamage);
            }
            
            // Passer en mode fuite
            this.state = "flee";
            this.fleeStartTime = this.scene.time.now;
            this.speed = this.originalSpeed * 0.4; // vitesse réduite pour la fuite
            this.hasDashed = true;
            return;
        }

        // Si on est très proche mais qu'on n'a pas encore touché, continuer le dash
        if (dist < 15 && !this.hasHitPlayer) {
            // Continuer le dash jusqu'au contact
        }

        const angle = Math.atan2(dy, dx);
        this.body.setVelocity(Math.cos(angle) * this.dashSpeed, Math.sin(angle) * this.dashSpeed);
    }

    flee(time) {
        const elapsed = time - this.fleeStartTime;

        if (elapsed >= this.fleeTime) {
            // Fin de la fuite, reprendre l'attaque
            this.state = "approach";
            this.speed = this.originalSpeed;
            return;
        }

        if (!this.target) return;

        // Fuir le joueur après le dash
        const dx = this.x - this.target.x;
        const dy = this.y - this.target.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            const angle = Math.atan2(dy, dx);
            this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
        } else {
            this.body.setVelocity(0, 0);
        }
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
            if (this.scene.orbs) this.scene.orbs.add(new XPOrb(this.scene, this.x, this.y, 2));
            if (this.scene.addScore) this.scene.addScore(this.points);
            this.healthBar?.destroy();
            this.healthBarBg?.destroy();
            this.destroy();
            return;
        }

        this.healthBar.width = 20 * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);

        if (attacker) {
            const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, this.x, this.y);
            this.knockback(150, angle, 150);
        }
    }
}