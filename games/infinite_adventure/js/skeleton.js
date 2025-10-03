import Enemy from "./enemy.js";
import FlyingSkull from "./flyingskull.js";

export default class Skeleton extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, "skeleton", {
            speed: 40,
            hp: 200,
            points: 25,
            contactDamage: 15,
            barWidth: 20,
            barHeight: 4
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || !this.active) return;

        this.moveToTarget();
        
        const dx = this.target.x - this.x;
        this.setFlipX(dx < 0);
        
        this.anims.play("skeleton_walk", true);
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        
        if (this.hp <= 0 && this.scene && this.scene.skulls && this.target) {
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
    }

    static preload(scene) {
        scene.load.spritesheet("skeleton", "assets/skeleton.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("skeleton_walk")) {
            scene.anims.create({
                key: "skeleton_walk",
                frames: scene.anims.generateFrameNumbers("skeleton", { start: 8, end: 11 }),
                frameRate: 6,
                repeat: -1
            });
        }
    }
}