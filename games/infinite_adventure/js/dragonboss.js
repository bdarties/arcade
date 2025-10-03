import Enemy from "./enemy.js";

export default class DragonBoss extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'dragon_head', {
            hp: 2000,
            speed: 80,
            points: 1000,
            contactDamage: 0,
            scale: 2.0,
            barWidth: 120,
            barOffsetY: -80
        });

        this.setDepth(20);
        this.body.setSize(80, 80).setOffset(24, 24);
        
        this.attackPhase = 0;
        this.attackTimer = null;
        this.bullets = scene.physics.add.group();
        this.phases = [
            { hpThreshold: 1.0, attackDelay: 2000, attacks: ['circle', 'spiral'] },
            { hpThreshold: 0.66, attackDelay: 1600, attacks: ['targeted', 'wave', 'circle'] },
            { hpThreshold: 0.33, attackDelay: 1200, attacks: ['spiral', 'targeted', 'wave', 'chaos'] }
        ];
        this.currentPhaseIndex = 0;
        this.hoverOffset = 0;
        this.spiralRotation = 0;
        
        this.createBulletTextures();
        this.startBattle();
    }

    static preload(scene) {
        scene.load.spritesheet("dragon_head", "assets/dragon_head.png", { frameWidth: 128, frameHeight: 128 });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists('dragon_fly')) {
            scene.anims.create({
                key: 'dragon_fly',
                frames: scene.anims.generateFrameNumbers('dragon_head', { start: 0, end: 8 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!scene.anims.exists('dragon_attack')) {
            scene.anims.create({
                key: 'dragon_attack',
                frames: scene.anims.generateFrameNumbers('dragon_head', { start: 0, end: 8 }),
                frameRate: 15,
                repeat: 0
            });
        }
    }

    createBulletTextures() {
        [
            { name: 'fireball', color: 0xff6600, size: 8 },
            { name: 'dragon_bullet', color: 0xff0000, size: 8 },
            { name: 'bullet_blue', color: 0x0066ff, size: 8 },
            { name: 'chaos_bullet', color: 0xff00ff, size: 10 }
        ].forEach(({ name, color, size }) => {
            if (!this.scene.textures.exists(name)) {
                const g = this.scene.add.graphics();
                g.fillStyle(color, 1);
                g.fillCircle(size / 2, size / 2, size / 2);
                g.generateTexture(name, size, size);
                g.destroy();
            }
        });
    }

    startBattle() {
        this.play('dragon_fly');
        this.scene.tweens.add({
            targets: this,
            scale: 2.2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.scheduleNextAttack();
    }

    scheduleNextAttack() {
        if (this.attackTimer) this.attackTimer.remove();

        const phase = this.phases[this.currentPhaseIndex];
        this.attackTimer = this.scene.time.delayedCall(phase.attackDelay, () => {
            if (this.active && !this.scene.gameEnded) {
                this.executeAttack(Phaser.Utils.Array.GetRandom(phase.attacks));
                this.scheduleNextAttack();
            }
        });
    }

    executeAttack(type) {
        this.play('dragon_attack');
        this.once('animationcomplete', () => this.active && this.play('dragon_fly'));
        
        const attacks = {
            circle: () => this.circleAttack(),
            spiral: () => this.spiralAttack(),
            targeted: () => this.targetedAttack(),
            wave: () => this.waveAttack(),
            chaos: () => this.chaosAttack()
        };
        attacks[type]?.();
    }

    circleAttack() {
        const count = 16 + (this.currentPhaseIndex * 4);
        const speed = 150 + (this.currentPhaseIndex * 30);
        for (let i = 0; i < count; i++) {
            this.createBullet(this.x, this.y, (i / count) * Math.PI * 2, speed, 'fireball');
        }
        this.playSound('sword_swing', 0.3);
    }

    spiralAttack() {
        this.spiralRotation += Math.PI / 8;
        const speed = 120 + (this.currentPhaseIndex * 20);
        for (let i = 0; i < 8; i++) {
            this.createBullet(this.x, this.y, this.spiralRotation + (i / 8) * Math.PI * 2, speed, 'dragon_bullet');
        }
    }

    targetedAttack() {
        const player = this.scene.getClosestPlayer?.(this);
        if (!player) return;

        const count = 3 + this.currentPhaseIndex;
        const spread = Math.PI / (4 + this.currentPhaseIndex);
        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        
        for (let i = 0; i < count; i++) {
            this.createBullet(this.x, this.y, baseAngle + (i - (count - 1) / 2) * (spread / count), 220, 'fireball');
        }
    }

    waveAttack() {
        const waves = 3 + this.currentPhaseIndex;
        for (let w = 0; w < waves; w++) {
            this.scene.time.delayedCall(w * 300, () => {
                if (!this.active) return;
                for (let i = 0; i < 5; i++) {
                    this.createBullet(this.x, this.y, Math.PI + (i / 4 - 0.5) * Math.PI, 180, 'dragon_bullet');
                }
            });
        }
    }

    chaosAttack() {
        const player = this.scene.getClosestPlayer?.(this);
        if (!player) return;

        const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        for (let i = 0; i < 24; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                if (!this.active) return;
                const angle = baseAngle + (Math.random() - 0.5) * Math.PI;
                this.createBullet(this.x, this.y, angle, 200 + (Math.random() - 0.5) * 100, 'chaos_bullet');
            });
        }
    }

    createBullet(x, y, angle, speed, texture) {
        if (!this.scene.textures.exists(texture)) texture = 'fireball';
        
        const bullet = this.bullets.create(x, y, texture);
        if (!bullet) return null;

        bullet.setDepth(15).setScale(1.5);
        bullet.damage = 20 + (this.currentPhaseIndex * 5);
        bullet.body.setSize(8, 8).setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        
        this.scene.tweens.add({
            targets: bullet,
            scale: 2.0,
            alpha: 0.8,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.scene.time.delayedCall(5000, () => bullet?.active && bullet.destroy());
        return bullet;
    }

    takeDamage(amount, attacker = null) {
        super.takeDamage(amount, attacker);
        if (this.hp <= 0) return;
        
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());
        
        const hpPercent = this.hp / this.maxHp;
        for (let i = this.phases.length - 1; i > this.currentPhaseIndex; i--) {
            if (hpPercent <= this.phases[i].hpThreshold) {
                this.changePhase(i);
                break;
            }
        }
    }

    changePhase(idx) {
        if (idx === this.currentPhaseIndex) return;
        
        this.currentPhaseIndex = idx;
        this.scene.cameras.main.shake(500, 0.02);
        this.scene.cameras.main.flash(300, 255, 0, 0, 0.3);
        this.setTint(0xff6666);
        this.scene.time.delayedCall(300, () => this.clearTint());
        this.scene.events.emit('bossPhase', idx + 1);
        
        if (this.anims.currentAnim) this.anims.currentAnim.frameRate = 10 + (idx * 5);
        this.scheduleNextAttack();
    }

    die() {
        if (this.attackTimer) this.attackTimer.remove();
        this.bullets.clear(true, true);
        
        this.setTint(0xff0000);
        this.scene.tweens.add({
            targets: this,
            scale: 0.1,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.scene.cameras.main.flash(500, 255, 0, 0);
                this.scene.cameras.main.shake(500, 0.02);
                this.spawnRewardOrbs();
                super.die();
            }
        });
    }

    spawnRewardOrbs() {
        if (!this.scene.orbs || !this.scene.XPOrb) return;
        for (let i = 0; i < 10; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                const angle = Math.random() * Math.PI * 2;
                this.scene.orbs.add(new this.scene.XPOrb(this.scene, this.x + Math.cos(angle) * 50, this.y + Math.sin(angle) * 50, 50));
            });
        }
    }

    update(time, delta) {
        super.preUpdate(time, delta);
        if (!this.active) return;
        
        if (this.scene.currentRoom) {
            this.hoverOffset += delta * 0.002;
            const hoverY = Math.sin(this.hoverOffset) * 20;
            this.y += (this.scene.currentRoom.centerY - 100 + hoverY - this.y) * 0.02;
            this.x += (this.scene.currentRoom.centerX + Math.sin(this.hoverOffset * 0.5) * 100 - this.x) * 0.01;
        }
        this.updateBulletCollisions();
    }

    updateBulletCollisions() {
        const players = [this.scene.player, this.scene.player2].filter(p => p?.active);
        const bounds = this.scene.physics.world.bounds;
        
        this.bullets.getChildren().forEach(b => {
            if (!b.active) return;
            
            players.forEach(p => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(b.getBounds(), p.getBounds())) {
                    p.takeDamage?.(b.damage);
                    b.destroy();
                }
            });
            
            if (b.x < -100 || b.x > bounds.width + 100 || b.y < -100 || b.y > bounds.height + 100) {
                b.destroy();
            }
        });
    }

    playSound(key, volume = 0.3) {
        if (this.scene.sound.get(key)) this.scene.sound.play(key, { volume });
    }

    destroy() {
        if (this.attackTimer) this.attackTimer.remove();
        this.bullets.clear(true, true);
        super.destroy();
    }
}