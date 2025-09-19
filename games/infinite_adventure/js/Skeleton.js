import FlyingSkull from "./FlyingSkull.js";

export default class Skeleton extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "skeleton");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.target = scene.player || null;

        this.speed = 40; // lente
        this.hp = this.maxHp = 200; // vie élevée
        this.facing = "right"; // unique direction

        this.healthBarBg = scene.add.rectangle(this.x, this.y - 20, 20, 4, 0x000000).setOrigin(0.5);
        this.healthBar   = scene.add.rectangle(this.x, this.y - 20, 20, 4, 0x00ff00).setOrigin(0.5);

        this.body.setCollideWorldBounds(true);
        this.contactDamage = 15;
    }

    static preload(scene) {
        scene.load.spritesheet("skeleton", "assets/skeleton.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        // Animation marche droite uniquement (frames 9-12)
        scene.anims.create({
            key: "skeleton_walk",
            frames: scene.anims.generateFrameNumbers("skeleton", { start: 8, end: 11 }),
            frameRate: 6,
            repeat: -1
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.healthBarBg?.setPosition(this.x, this.y - 20);
        this.healthBar?.setPosition(this.x, this.y - 20);

        if (!this.target || !this.active) return;

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
        this.anims.play("skeleton_walk", true);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            // Spawn deux têtes à 150px du joueur
            if (this.scene && this.scene.skulls && this.target) {
                for (let i = 0; i < 2; i++) {
                    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                    const distance = 150;
                    const skullX = this.target.x + Math.cos(angle) * distance;
                    const skullY = this.target.y + Math.sin(angle) * distance;
                    const skull = new FlyingSkull(this.scene, skullX, skullY);
                    this.scene.skulls.add(skull);
                    this.scene.enemies.add(skull);
                }
            }
            this.healthBar?.destroy();
            this.healthBarBg?.destroy();
            this.destroy();
            return;
        }
        this.healthBar.width = 20 * Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    }
}
