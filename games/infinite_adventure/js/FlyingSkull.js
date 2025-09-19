import XPOrb from "./XPOrb.js";

export default class FlyingSkull extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "flying_skull");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.target = scene.player || null;
        this.speed = 40;
        this.hp = this.maxHp = 20;
        this.facing = "right";

        this.healthBarBg = scene.add.rectangle(this.x, this.y - 20, 16, 3, 0x000000).setOrigin(0.5);
        this.healthBar   = scene.add.rectangle(this.x, this.y - 20, 16, 3, 0x00ff00).setOrigin(0.5);

        this.body.setCollideWorldBounds(true);
        this.contactDamage = 10;

        this.fireCooldown = 2000;
        this.lastFire = 0;

        // S'assurer que les barres de vie sont détruites avec le sprite
        this.once("destroy", () => {
            this.healthBar?.destroy();
            this.healthBarBg?.destroy();
        });
    }

    static preload(scene) {
        scene.load.spritesheet("flying_skull", "assets/flying_skull.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        [["right", 0, 3, 8], ["left", 4, 7, 8]].forEach(([dir, start, end, fps]) => {
            scene.anims.create({
                key: `skull_${dir}`,
                frames: scene.anims.generateFrameNumbers("flying_skull", { start, end }),
                frameRate: fps,
                repeat: -1
            });
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (!this.active || !this.target || !this.scene) return;

        this.healthBarBg?.setPosition(this.x, this.y - 20);
        this.healthBar?.setPosition(this.x, this.y - 20);

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        let vx = 0;
        let vy = 0;

        if (dist < 220 && dist > 25) { // fuir si trop proche
            const angle = Math.atan2(dy, dx) + Math.PI;
            vx = Math.cos(angle) * this.speed;
            vy = Math.sin(angle) * this.speed;
        } else if (dist > 300) { // avancer si trop loin
            const angle = Math.atan2(dy, dx);
            vx = Math.cos(angle) * this.speed;
            vy = Math.sin(angle) * this.speed;
        }

        this.body.setVelocity(vx, vy);

        // Tirer seulement si le joueur n'est pas trop proche
        if (dist > 25 && this.scene?.time && time > this.lastFire + this.fireCooldown) {
            this.shootFireBall();
            this.lastFire = time;
        }

        this.anims.play(`skull_${this.facing}`, true);
    }

    shootFireBall() {
        if (!this.scene || !this.scene.time || !this.target || !this.active) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 25) return;

        const fire = this.scene.add.circle(this.x, this.y, 4, 0xff6600);
        this.scene.physics.add.existing(fire);
        fire.body.setCollideWorldBounds(true);
        fire.body.onWorldBounds = true;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        const speed = 120;
        fire.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        fire.damage = 20;
        fire.setDepth(1);

        // Collision avec le joueur
        this.scene.physics.add.overlap(fire, this.target, (f, player) => {
            if (!player?.active || !this.scene?.time) return;

            const now = this.scene.time.now;
            if (!player.lastHitTime) player.lastHitTime = 0;
            if (!player.hitCooldown) player.hitCooldown = 500;

            if (now >= player.lastHitTime + player.hitCooldown) {
                player.lastHitTime = now;
                player.health -= f.damage || 5;

                if (player.setTint) {
                    player.setTint(0xff9999);
                    this.scene.time.addEvent({ delay: 80, callback: () => player.clearTint() });
                }

                if (player.health <= 0) this.scene?.gameOver?.();
            }

            if (f.destroy) f.destroy();
        });

        // Détruire après 3 secondes
        this.scene.time.addEvent({
            delay: 3000,
            callback: () => { if (fire?.destroy) fire.destroy(); }
        });
    }

    takeDamage(amount, attacker = null) {
        this.hp -= amount;
        if (this.hp <= 0) {
            if (this.scene?.orbs) this.scene.orbs.add(new XPOrb(this.scene, this.x, this.y, 1));

            // Désactiver le corps avant destruction
            if (this.body) this.body.enable = false;
            this.setActive(false);
            this.setVisible(false);

            this.destroy();
            return;
        }

        this.healthBar.width = 16 * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    }
}