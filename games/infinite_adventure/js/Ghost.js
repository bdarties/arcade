export default class Ghost extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "ghost");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.target = scene.player || null;

        this.speed = 40; // lente
        this.hp = this.maxHp = 200; // vie élevée
        this.facing = "right";

        // Barre de vie
        this.healthBarBg = scene.add.rectangle(this.x, this.y - 20, 20, 4, 0x000000).setOrigin(0.5);
        this.healthBar = scene.add.rectangle(this.x, this.y - 20, 20, 4, 0x00ff00).setOrigin(0.5);

        this.body.setCollideWorldBounds(true);
        this.contactDamage = 15;

        // Invincibilité
        this.isInvincible = false;
        this.invincibilityDuration = 1800; // 2s
        this.invincibilityCooldown = 10000; // tous les 10s
        this.lastInvincibility = 0;
    }

    static preload(scene) {
        scene.load.spritesheet("ghost", "assets/ghost.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        scene.anims.create({
            key: "ghost_walk",
            frames: scene.anims.generateFrameNumbers("ghost", { start: 0, end: 2 }),
            frameRate: 6,
            repeat: -1
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.healthBarBg?.setPosition(this.x, this.y - 20);
        this.healthBar?.setPosition(this.x, this.y - 20);

        if (!this.target || !this.active) return;

        // Gestion invincibilité toutes les 10s
        if (time > this.lastInvincibility + this.invincibilityCooldown) {
            this.isInvincible = true;
            this.lastInvincibility = time;
            this.setAlpha(0.5); // effet visuel
            this.scene.time.addEvent({
                delay: this.invincibilityDuration,
                callback: () => { this.isInvincible = false; this.setAlpha(1); }
            });
        }

        // Déplacement vers le joueur
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        let vx = 0;
        let vy = 0;
        if (dist > 0) {
            const angle = Math.atan2(dy, dx);
            vx = Math.cos(angle) * this.speed;
            vy = Math.sin(angle) * this.speed;
        }

        this.body.setVelocity(vx, vy);
        this.anims.play("ghost_walk", true);
    }

    takeDamage(amount) {
        if (this.isInvincible) return;

        this.hp -= amount;
        if (this.hp <= 0) {
            this.healthBar?.destroy();
            this.healthBarBg?.destroy();
            this.destroy();
            return;
        }

        this.healthBar.width = 20 * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    }
}
