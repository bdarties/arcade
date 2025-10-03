export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "elf");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 120;
        this.facing = "right";
        this.attackDelay = 1200;
        this.attackRange = 37;
        this.lastAttack = 0;

        this.weapon = scene.add.sprite(this.x, this.y, "weapons").setOrigin(0.5).setVisible(false);
        scene.physics.add.existing(this.weapon);
        if (this.weapon.body) this.weapon.body.enable = false;

        // Suppression de la zone d'attaque automatique
        this.attackZone = null;
        this._zoneCollider = null;

        this.level = 1;
        this.xp = 0;
        this.xpToNext = 5;
        this.damage = 50;
        this.maxHealth = 300;
        this.health = this.maxHealth;
        this.regen = 1;
        this._regenTimer = 0;

        this.isDashing = false;
        this.dashSpeed = 400;
        this.dashDuration = 200;
        this.dashCooldown = 1000;
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
            { key: "walk_left", start: 21, end: 24, rate: 10 },
            { key: "dash_right", start: 28, end: 30, rate: 20 },
            { key: "dash_left", start: 31, end: 33, rate: 20 }
        ];
        anims.forEach(a => {
            if (!scene.anims.exists(a.key)) {
                scene.anims.create({
                    key: a.key,
                    frames: scene.anims.generateFrameNumbers("elf", { start: a.start, end: a.end }),
                    frameRate: a.rate,
                    repeat: 0
                });
            }
        });
    }

    // Nouvelle méthode pour trouver l'ennemi le plus proche
    findClosestEnemy() {
        if (!this.scene?.enemies || this.scene.enemies.getLength() === 0) {
            return null;
        }

        let closestEnemy = null;
        let closestDistance = this.attackRange;

        this.scene.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (distance <= closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
        });

        return closestEnemy;
    }

    // Méthode d'attaque manuelle
    manualAttack() {
        const time = this.scene.time.now;
        if (time > this.lastAttack + this.attackDelay) {
            const closestEnemy = this.findClosestEnemy();
            if (closestEnemy) {
                this.attack(closestEnemy);
                this.lastAttack = time;
                return true; // Attaque réussie
            }
        }
        return false; // Aucun ennemi à portée ou en cooldown
    }

    attack(target) {
        this.weapon.setVisible(true);
        if (this.weapon.body) this.weapon.body.enable = true;
        this.scene.sound.play('sword_swing');

        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const reach = Math.min(Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y), this.attackRange);
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

        let vx = 0, vy = 0;
        switch (this.facing) {
            case "right": vx = this.dashSpeed; break;
            case "left": vx = -this.dashSpeed; break;
            case "up": vy = -this.dashSpeed; break;
            case "down": vy = this.dashSpeed; break;
        }

        this.body.setVelocity(vx, vy);
        this.body.checkCollision.none = false;

        // Animation de dash
        const animKey = (this.facing === "right") ? "dash_right" : (this.facing === "left" ? "dash_left" : null);
        if (animKey) this.play(animKey, true);

        // Ghost effect
        const ghostInterval = 40;
        const ghostCount = Math.floor(this.dashDuration / ghostInterval);
        let created = 0;

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

                created++;
            }
        });

        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.body.setVelocity(0, 0);
            ghostTimer.remove();
        });
    }

    update(controls) {
        const delta = this.scene.game.loop.delta;
        if (!this.isDashing) {
            let vx = 0, vy = 0;
            if (controls.left.isDown) vx = -this.speed;
            else if (controls.right.isDown) vx = this.speed;
            if (controls.up.isDown) vy = -this.speed;
            else if (controls.down.isDown) vy = this.speed;

            this.body.setVelocity(vx, vy);

            if (vx || vy) {
                this.facing = Math.abs(vx) >= Math.abs(vy) ? (vx >= 0 ? "right" : "left") : (vy >= 0 ? "down" : "up");
                const animKey = vx ? (this.facing === "right" ? "walk_right" : "walk_left") : (vy ? "walk_right" : "");
                if (animKey) this.anims.play(animKey, true);
            } else {
                this.anims.play(this.facing === "right" || this.facing === "down" ? "idle_right" : "idle_left", true);
            }

            if (controls.dash?.isDown) this.dash();
            
            // Attaque manuelle (par exemple avec la barre d'espace)
            if (controls.attack?.isDown) {
                this.manualAttack();
            }
        }

        this._regenTimer += delta;
        if (this._regenTimer >= 1000) { this.health = Math.min(this.maxHealth, this.health + this.regen); this._regenTimer = 0; }

        // Suppression de la logique de zone d'attaque automatique
    }

    destroy(fromScene) {
        try { this._zoneCollider && this.scene.physics.world.removeCollider(this._zoneCollider); } catch {}
        this.attackZone?.destroy();
        this.weapon?.destroy();
        super.destroy(fromScene);
    }
}