import MiniBoss from "./miniboss.js";
import FlyingSkull from "./flyingskull.js";

export default class MiniBossSkeleton extends MiniBoss {
    constructor(scene, x, y) {
        super(scene, x, y, "skeleton", {
            speed: 80,
            hp: 600,
            points: 350,
            contactDamage: 28,
            barWidth: 90,
            barHeight: 8,
            barOffsetY: -52
        });

        this.setScale(2.5); 

        this.shieldActive = false;
        this.shieldCooldown = 10000;
        this.lastShield = 0;
        this.shieldDuration = 4000;
        this.originalTint = 0xffffff;
    }

    activateShield() {
        if (this.shieldActive) return;

        this.shieldActive = true;
        this.setTint(0x6666ff);
        this.originalSpeed = this.speed;
        this.speed *= 0.5;

        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.7, to: 1 },
            duration: 300,
            yoyo: true,
            repeat: Math.floor(this.shieldDuration / 600)
        });

        this.scene.time.delayedCall(this.shieldDuration, () => {
            if (this.active) {
                this.shieldActive = false;
                this.setTint(this.originalTint);
                this.setAlpha(1);
                this.speed = this.originalSpeed;
            }
        });
    }

    takeDamage(amount, attacker = null) {
        if (this.shieldActive) {
            amount *= 0.3;
            
            this.scene.tweens.add({
                targets: this,
                scaleX: this.scaleX * 1.1,
                scaleY: this.scaleY * 1.1,
                duration: 100,
                yoyo: true
            });
        }
        
        const wasAlive = this.hp > 0;
        super.takeDamage(amount, attacker);
        
        if (wasAlive && this.hp <= 0 && this.scene && this.scene.skulls) {
            this.spawnSkulls();
        }
    }

    spawnSkulls() {
        const skullCount = 5; 
        
        for (let i = 0; i < skullCount; i++) {
            const angle = (Math.PI * 2 / skullCount) * i;
            const distance = 100;
            const skullX = this.x + Math.cos(angle) * distance;
            const skullY = this.y + Math.sin(angle) * distance;
            
            const skull = new FlyingSkull(this.scene, skullX, skullY);
            this.scene.skulls.add(skull);
            this.scene.enemies.add(skull);
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || !this.active) return;

        if (time > this.lastShield + this.shieldCooldown && 
            !this.shieldActive && 
            this.hp < this.maxHp * 0.6) {
            this.activateShield();
            this.lastShield = time;
        }

        if (this.isKnockedBack) return;

        this.moveToTarget();

        const dx = this.target.x - this.x;
        this.setFlipX(dx < 0);
        
        this.anims.play("skeleton_walk", true);
    }

    static preload(scene) {
        scene.load.spritesheet("skeleton", "assets/skeleton.png", { 
            frameWidth: 16, 
            frameHeight: 16 
        });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("skeleton_walk")) {
            scene.anims.create({
                key: "skeleton_walk",
                frames: scene.anims.generateFrameNumbers("skeleton", { 
                    start: 8, 
                    end: 11 
                }),
                frameRate: 6,
                repeat: -1
            });
        }
    }
}