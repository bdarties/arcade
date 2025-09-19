export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "elf");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 120;
        this.facing = "right";
        this.attackDelay = 1200;
        this.attackRange = 28;
        this.lastAttack = 0;

        this.weapon = scene.add.sprite(this.x, this.y, "weapons").setOrigin(0.5).setVisible(false);
        scene.physics.add.existing(this.weapon);
        if (this.weapon.body) this.weapon.body.enable = false;

        this.attackZone = scene.add.zone(this.x, this.y, this.attackRange * 2, this.attackRange * 2);
        scene.physics.world.enable(this.attackZone);
        if (this.attackZone.body) {
            this.attackZone.body.setAllowGravity(false).setImmovable(true);
        }
        this._zoneCollider = null;

        this.level = 1;
        this.xp = 0;
        this.xpToNext = 5;
        this.damage = 50;
        this.maxHealth = 200;
        this.health = this.maxHealth;
        this.regen = 0.5;
        this._regenTimer = 0;

        this.isDashing = false;
        this.dashSpeed = 400;
        this.dashDuration = 200; 
        this.dashCooldown = 3000; 
        this.lastDash = 0;
    }

    static preload(scene) {
        scene.load.spritesheet("elf", "assets/elf.png", { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        const anims = [
            { key: "idle_right", start: 0, end: 2, rate: 6 },
            { key: "idle_left", start: 7, end: 9, rate: 6 },
            { key: "walk_right", start: 14, end: 17, rate: 10 },
            { key: "walk_left", start: 21, end: 24, rate: 10 }
        ];
        anims.forEach(a => scene.anims.create({
            key: a.key,
            frames: scene.anims.generateFrameNumbers("elf", { start: a.start, end: a.end }),
            frameRate: a.rate,
            repeat: -1
        }));
    }

    _onEnemyInZone = (zone, enemy) => {
        if (!enemy?.active) return;
        const time = this.scene.time.now;
        if (time > this.lastAttack + this.attackDelay) {
            this.attack(enemy);
            this.lastAttack = time;
        }
    }

    attack(target = null) {
        this.weapon.setVisible(true);
        if (this.weapon.body) this.weapon.body.enable = true;

        const angle = target ? Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y) : 0;
        const reach = target ? Math.min(Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y), this.attackRange) : this.attackRange;
        this.weapon.setPosition(this.x + Math.cos(angle) * reach, this.y + Math.sin(angle) * reach);
        this.weapon.setRotation(angle + Math.PI / 2);
        this.weapon.play("sword_attack", true);

        const hit = new Set();
        const overlap = this.scene.physics.add.overlap(this.weapon, this.scene.enemies, (w, e) => {
            if (!hit.has(e) && e.takeDamage) { e.takeDamage(this.damage, this); hit.add(e); }
        });

        this.weapon.once("animationcomplete", () => {
            this.weapon.setVisible(false);
            if (this.weapon.body) this.weapon.body.enable = false;
            try { if (overlap) this.scene.physics.world.removeCollider(overlap); } catch {}
        });
    }

    gainXP(amount) {
        this.xp += amount;
        this.scene.events.emit("xpChanged", this.xp, this.xpToNext);

        while (this.xp >= this.xpToNext) {
            this.level++;
            this.xp -= this.xpToNext;
            this.xpToNext = Math.floor(this.xpToNext * 1.2);
            const ui = this.scene.scene.get("UiScene");
            ui?.showLevelUp?.();
        }
    }

    dash() {
        const now = this.scene.time.now;
        if (now < this.lastDash + this.dashCooldown || this.isDashing) return;

        this.isDashing = true;
        this.lastDash = now;

        let dx = 0, dy = 0;
        switch (this.facing) {
            case "right": dx = 1; break;
            case "left": dx = -1; break;
            case "up": dy = -1; break;
            case "down": dy = 1; break;
        }

        this.body.checkCollision.none = true;
        this.body.setVelocity(dx * this.dashSpeed, dy * this.dashSpeed);

        const ghostInterval = 40; 
        const ghostCount = Math.floor(this.dashDuration / ghostInterval);

        const ghostTimer = this.scene.time.addEvent({
            delay: ghostInterval,
            repeat: ghostCount - 1,
            callback: () => {
                const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name)
                    .setAlpha(0.6)
                    .setTint(0xffffff)
                    .setDepth(this.depth - 1);

                this.scene.tweens.add({
                    targets: ghost,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => ghost.destroy()
                });
            }
        });

        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.setVisible(true);
            this.body.setVelocity(0, 0);
            this.body.checkCollision.none = false;
            ghostTimer.remove(); 
        });
    }    

    update(controls) {
        const delta = this.scene.game.loop.delta;
        let vx = 0, vy = 0;

        if (!this.isDashing) {
            if (controls.left.isDown) vx = -this.speed;
            else if (controls.right.isDown) vx = this.speed;
            if (controls.up.isDown) vy = -this.speed;
            else if (controls.down.isDown) vy = this.speed;
            this.body.setVelocity(vx, vy);

            if (vx || vy) {
                this.facing = Math.abs(vx) >= Math.abs(vy) ? (vx >= 0 ? "right" : "left") : (vy >= 0 ? "down" : "up");
                const animKey = vx ? (this.facing === "right" ? "walk_right" : "walk_left") : (vy ? "walk_right" : "");
                this.anims.play(animKey, true);
            } else {
                this.anims.play(this.facing === "right" || this.facing === "down" ? "idle_right" : "idle_left", true);
            }

            // 🔑 Utilise le contrôle dash (par défaut K)
            if (controls.dash?.isDown) this.dash();
        }

        this._regenTimer += delta;
        if (this._regenTimer >= 1000) { 
            this.health = Math.min(this.maxHealth, this.health + this.regen); 
            this._regenTimer = 0; 
        }

        if (!this._zoneCollider && this.scene?.enemies) {
            this._zoneCollider = this.scene.physics.add.overlap(this.attackZone, this.scene.enemies, this._onEnemyInZone);
        }

        this.attackZone.setPosition(this.x, this.y);
        if (this.attackZone.body) {
            this.attackZone.body.x = this.x - this.attackZone.width / 2;
            this.attackZone.body.y = this.y - this.attackZone.height / 2;
        }
    }

    destroy(fromScene) {
        try { this._zoneCollider && this.scene.physics.world.removeCollider(this._zoneCollider); } catch {}
        this.attackZone?.destroy();
        this.weapon?.destroy();
        super.destroy(fromScene);
    }
}
