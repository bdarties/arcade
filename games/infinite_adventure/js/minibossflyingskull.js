import MiniBoss from "./miniboss.js";

export default class MiniBossFlyingSkull extends MiniBoss {
    constructor(scene, x, y) {
        super(scene, x, y, "flying_skull", {
            speed: 60,
            hp: 1200,
            points: 500,
            contactDamage: 20,
            barWidth: 120,
            barHeight: 10,
            barOffsetY: -60
        });

        this.setScale(2);
        this.facing = "right";

        this.fireCooldown = 1400; // Tir plus fréquent
        this.lastFire = 0;

        this.bulletHellCooldown = 6500; // Bullet hell plus fréquent
        this.lastBulletHell = 0;

        // AJOUT : Créer la texture fireball si elle n'existe pas
        if (!scene.textures.exists("fireball")) {
            const g = scene.add.graphics();
            g.fillStyle(0xff4400, 1);
            g.fillCircle(12, 12, 12); // Plus gros projectile
            g.generateTexture("fireball", 24, 24);
            g.destroy();
        }
    }

    shootFireBall() {
        if (!this.scene || !this.target || !this.active) return;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.spawnProjectile(angle, 120, 10);
    }

    spawnProjectile(angle, speed, damage) {
        if (!this.scene || !this.active) return;

        // Créer le projectile avec la texture "fireball"
        const fire = this.scene.physics.add.sprite(this.x, this.y, "fireball");
        
        // IMPORTANT : Vérifier que le body existe
        if (!fire.body) {
            console.error("Body not created for fireball");
            fire.destroy();
            return;
        }
        
        fire.setScale(0.9); // Projectiles plus gros
        
        // Utiliser setSize au lieu de setCircle (plus stable)
        fire.body.setSize(18, 18); // Plus grosse hitbox
        fire.body.setOffset(3, 3);
        fire.body.setCollideWorldBounds(true);
        fire.body.onWorldBounds = true;
        fire.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        fire.damage = damage;
        fire.setDepth(1);
        fire.isDestroyed = false; // AJOUT : flag pour éviter les doubles destructions

        // Collision avec le joueur
        const collider = this.scene.physics.add.overlap(fire, this.target, (f, player) => {
            // AMÉLIORATION : vérifications plus robustes
            if (!f || !f.active || f.isDestroyed) return;
            if (!player || !player.active) return;
            if (!this.scene || !this.scene.time) return;

            const now = this.scene.time.now;
            if (!player.lastHitTime) player.lastHitTime = 0;
            if (!player.hitCooldown) player.hitCooldown = 600;

            if (now >= player.lastHitTime + player.hitCooldown) {
                player.lastHitTime = now;
                player.health -= f.damage || 5;

                if (player.setTint) {
                    player.setTint(0xff9999);
                    if (this.scene && this.scene.time) {
                        this.scene.time.addEvent({ 
                            delay: 80, 
                            callback: () => {
                                if (player && player.clearTint) player.clearTint();
                            }
                        });
                    }
                }

                if (player.health <= 0 && this.scene && this.scene.gameOver) {
                    this.scene.gameOver();
                }
            }

            // Marquer comme détruit et détruire
            f.isDestroyed = true;
            if (collider) collider.destroy(); // AJOUT : détruire le collider
            if (f.body) f.body.enable = false; // AJOUT : désactiver le body
            f.destroy();
        });

        // Auto-destruction (2 sec)
        this.scene.time.addEvent({
            delay: 2000,
            callback: () => { 
                if (fire && fire.active && !fire.isDestroyed) {
                    fire.isDestroyed = true;
                    if (collider) collider.destroy();
                    if (fire.body) fire.body.enable = false;
                    fire.destroy();
                }
            }
        });
    }

    bulletHell() {
        if (!this.active || !this.scene) return;

        const numProjectiles = 16;
        const speed = 150;
        const damage = 15;

        for (let i = 0; i < numProjectiles; i++) {
            const angle = (Math.PI * 2 / numProjectiles) * i;
            this.spawnProjectile(angle, speed, damage);
        }

        if (this.scene && this.scene.tweens) {
            this.scene.tweens.add({
                targets: this,
                scaleX: this.scaleX * 1.2,
                scaleY: this.scaleY * 1.2,
                duration: 150,
                yoyo: true
            });
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.target || !this.active || !this.scene) return;

        if (this.isKnockedBack) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        // CORRECTION : mise à jour de facing
        this.facing = dx < 0 ? "left" : "right";
        this.setFlipX(dx < 0);

        if (time > this.lastBulletHell + this.bulletHellCooldown) {
            this.bulletHell();
            this.lastBulletHell = time;
        }
        else if (dist > 60 && time > this.lastFire + this.fireCooldown) {
            this.shootFireBall();
            this.lastFire = time;
        }

        // IA AMÉLIORÉE : éviter les coins et rester mobile
        if (dist > 250) {
            // Trop loin, se rapprocher
            this.scene.physics.moveTo(this, this.target.x, this.target.y, this.speed);
        } else if (dist < 120) {
            // Trop proche, reculer en diagonale pour éviter les coins
            const angle = Math.atan2(dy, dx) + Math.PI;
            const offsetAngle = Math.sin(time * 0.002) * 0.5; // Légère variation
            this.body.setVelocity(
                Math.cos(angle + offsetAngle) * this.speed, 
                Math.sin(angle + offsetAngle) * this.speed
            );
        } else {
            // Distance idéale : orbiter autour du joueur
            const orbitAngle = Math.atan2(dy, dx) + Math.PI / 2;
            const orbitSpeed = this.speed * 0.6;
            this.body.setVelocity(
                Math.cos(orbitAngle) * orbitSpeed,
                Math.sin(orbitAngle) * orbitSpeed
            );
        }

        // CORRECTION : vérifier que l'animation existe avant de la jouer
        const animKey = `flying_skull_${this.facing}`;
        if (this.anims && this.scene.anims.exists(animKey)) {
            this.anims.play(animKey, true);
        }
    }

    static preload(scene) {
        scene.load.spritesheet("flying_skull", "assets/flying_skull.png", { frameWidth: 16, frameHeight: 16 });
        // AJOUT : charger le sprite fireball si tu en as un
        // scene.load.image("fireball", "assets/fireball.png");
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("flying_skull_right")) {
            scene.anims.create({
                key: "flying_skull_right",
                frames: scene.anims.generateFrameNumbers("flying_skull", { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!scene.anims.exists("flying_skull_left")) {
            scene.anims.create({
                key: "flying_skull_left",
                frames: scene.anims.generateFrameNumbers("flying_skull", { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
        }
    }
}