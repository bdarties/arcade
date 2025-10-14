export default class Ennemi extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0);

        this.speed = 50;
        this.direction = "left";
        this.hp = 4;
        this.invincible = false;

        this.scene = scene;
        this.calqueDecors = scene.calque_decors;
    }

    update() {
        if (!this.active) return;

        // Mouvement horizontal
        this.setVelocityX(this.direction === "left" ? -this.speed : this.speed);

        // 🔥 Vérifie si l’ennemi touche un mur
        if (this.body.blocked.left) {
        this.direction = "right";
        } else if (this.body.blocked.right) {
        this.direction = "left";
        }

        // Vérifie si sol devant
        let offsetX = this.direction === "left" ? -30 : 30;
        let xCheck = this.x + offsetX;
        let yCheck = this.y + this.height / 2 + 5;

        let tile = this.calqueDecors.getTileAtWorldXY(xCheck, yCheck);
        let solEnDessous = tile && tile.properties.estSolide;

        if (!solEnDessous) {
            this.direction = this.direction === "left" ? "right" : "left";
        }
    }

    hit() {
        if (this.invincible || !this.active) return;

        this.hp--;
        this.invincible = true;
        this.setTint(0xff0000);

        this.scene.time.delayedCall(1000, () => {
            this.clearTint();
            this.invincible = false;
        });

        if (this.hp <= 0) {
            if (Phaser.Math.Between(1, 100) <= 30) {
                const coeur = this.scene.groupeObjets.create(this.x, this.y, "coeur");
                coeur.setBounce(0.3);
                coeur.setCollideWorldBounds(true);
                this.scene.physics.add.collider(coeur, this.scene.groupe_plateformes);
            }

            if (this.timer) this.timer.remove(false);

            this.setActive(false);
            this.setVisible(false);
            this.destroy();
        }
    }
}


export class EnnemiTireurSimple extends Ennemi {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.balles = scene.physics.add.group();
        this.startShooting();

         // Ajuste la taille de la hitbox (width, height)
        this.body.setSize(40, 70);

        // Ajuste l’offset de la hitbox (décalage x, y)
        this.body.setOffset(10, 10);
    }

    startShooting() {
        if (!this.active) return;
        const delay = Phaser.Math.Between(3000, 5000);
        this.timer = this.scene.time.delayedCall(delay, () => {
            this.scene.sonTirEnnemi.play();
            this.shoot();
            this.startShooting();
        });
    }

shoot() {
    // ⛔ Si l’ennemi est inactif OU invincible → il ne tire pas
    if (!this.active || this.invincible) return;

    const bulletKey = this.direction === "left" ? "bullet_ennemi_gauche" : "bullet_ennemi_droite";

    // Création dans le groupe global
    const balle = this.scene.groupeBallesEnnemis.create(this.x, this.y, bulletKey);

    balle.body.allowGravity = false;

    const vitesse = this.direction === "left" ? -200 : 200;
    balle.setVelocityX(vitesse);

    balle.anims.play(this.direction === "left" ? "ennemi_tir_gauche" : "ennemi_tir_droite", true);

    this.scene.time.delayedCall(3000, () => {
        if (balle.active) balle.destroy();
    });
}


    update() {
        super.update();

        if (this.direction === "right") {
            this.anims.play("magicien_tourne_droite", true);
        } else if (this.direction === "left") {
            this.anims.play("magicien_tourne_gauche", true);
        }
    }

    hit() {
    if (this.invincible || !this.active) return;

    // --- Joue le son sonHit3 ---
    if (this.scene.sonHit3) this.scene.sonHit3.play();

    super.hit(); // on garde le comportement de base
}

}

export class Boss extends Ennemi {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.hp = 20;
        this.maxHp = 20;
        this.force = 2;
        this.isAttacking = false;
        this.cibleDetectee = false;
        this.phase = 1; // 🔥 Phase actuelle

        this.body.setSize(70, 80);
        this.body.setOffset(10, 10);

        this.nomBoss = this.scene.add.text(this.x, this.y - 60, "Empereur Jaed", {
            fontSize: "20px",
            fill: "#ff0000",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.barreVie = this.scene.add.graphics();
        this.drawHealthBar();

        this.speed = 100;
        this.startAttacking();
        this.startShootingLoop(); // 🔥 prépare la logique de tir
    }

    drawHealthBar() {
        this.barreVie.clear();
        this.barreVie.fillStyle(0x555555);
        this.barreVie.fillRect(this.x - 40, this.y - 40, 80, 10);
        this.barreVie.fillStyle(0xff0000);
        this.barreVie.fillRect(this.x - 40, this.y - 40, (this.hp / this.maxHp) * 80, 10);
    }

    updatePhase() {
    const oldPhase = this.phase;

    if (this.hp > 15) {
        this.phase = 1; // Patrouille classique
        if (!this.invincible) this.clearTint();
        this.speed = 100;
    } else if (this.hp > 8) {
        this.phase = 2; // Tireur + rapide
        if (!this.invincible) this.clearTint();
        this.speed = 120; // +20%
    } else {
        this.phase = 3; // Rage lente
        if (!this.invincible) this.clearTint(); // ❌ plus de teinte rouge permanente
        this.speed = 50; // -50%
    }

    if (this.phase !== oldPhase && this.scene.sonPhaseChange) {
        this.scene.sonPhaseChange.play();
    }
}


    startAttacking() {
        if (!this.active) return;
        const delay = Phaser.Math.Between(1000, 4000);
        this.timerAttaque = this.scene.time.delayedCall(delay, () => {
            if (!this.invincible && this.phase !== 2) { 
                this.meleeAttack();
            }
            this.startAttacking();
        });
    }

    // 🔫 Tir automatique (phase 2)
    startShootingLoop() {
        if (!this.active) return;
        const delay = Phaser.Math.Between(2000, 4000);
        this.timerShoot = this.scene.time.delayedCall(delay, () => {
            if (this.phase === 2 && !this.invincible && this.active) {
                this.shootProjectile();
            }
            this.startShootingLoop();
        });
    }

    shootProjectile() {
        if (!this.active || this.invincible) return;

        const bulletKey = this.direction === "left" ? "bullet_ennemi_gauche" : "bullet_ennemi_droite";
        const balle = this.scene.groupeBallesEnnemis.create(this.x, this.y, bulletKey);

        balle.body.allowGravity = false;
        const vitesse = this.direction === "left" ? -250 : 250;
        balle.setVelocityX(vitesse);

        balle.anims.play(this.direction === "left" ? "ennemi_tir_gauche" : "ennemi_tir_droite", true);

        // 🔊 Joue le même son que les tireurs simples
        if (this.scene.sonTirEnnemi) this.scene.sonTirEnnemi.play();

        this.scene.time.delayedCall(3000, () => {
            if (balle.active) balle.destroy();
        });
    }

    meleeAttack() {
        if (!this.active || this.isAttacking || this.invincible) return;
        this.isAttacking = true;

        if (this.scene.sonAttaqueBoss) this.scene.sonAttaqueBoss.play();
        const animBoss = this.direction === "right" ? "boss_attaque_droite" : "boss_attaque_gauche";
        this.anims.play(animBoss, true);

        const largeurHitbox = 50;
        const hauteurHitbox = this.body.height;
        const decalageX = this.direction === "right"
            ? this.body.width / 2 + largeurHitbox / 2
            : -this.body.width / 2 - largeurHitbox / 2;

        const hitbox = this.scene.physics.add.sprite(this.x + decalageX, this.y, "boss_attaque");
        hitbox.setSize(largeurHitbox, hauteurHitbox);
        hitbox.setOffset(0, 0);
        hitbox.body.setAllowGravity(false);
        hitbox.body.setImmovable(true);

        const animHitbox = this.direction === "right" ? "attaque_boss_droite" : "attaque_boss_gauche";
        hitbox.anims.play(animHitbox, true);

        this.scene.physics.add.overlap(hitbox, this.scene.player, (hitboxObj, playerObj) => {
            if (!playerObj.invincible) {
                playerObj.hp--;
                playerObj.invincible = true;
                playerObj.setTint(0xff0000);

                this.scene.time.delayedCall(1000, () => {
                    playerObj.clearTint();
                    playerObj.invincible = false;
                });

                this.scene.txtPV.setText(`PV : ${playerObj.hp}`);
                if (playerObj.hp <= 0) {
                    playerObj.vies--;
                    this.scene.txtVies.setText(`Vies : ${playerObj.vies}`);
                    if (playerObj.vies > 0) {
                        playerObj.hp = 3;
                        this.scene.txtPV.setText(`PV : ${playerObj.hp}`);
                    } else {
                        this.scene.scene.restart();
                    }
                }
            }
        });

        hitbox.update = () => {
            const decalX = this.direction === "right"
                ? this.body.width / 2 + largeurHitbox / 2
                : -this.body.width / 2 - largeurHitbox / 2;
            hitbox.setPosition(this.x + decalX, this.y);
        };

        hitbox.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            hitbox.destroy();
            this.isAttacking = false;
        });
    }

    update() {
        if (!this.active) return;

        const player = this.scene.player;
        this.updatePhase();

        if (this.isAttacking) {
            this.setVelocityX(0);
            return;
        }

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        this.cibleDetectee = distance < 300;

        if (this.phase === 1) {
            if (this.cibleDetectee) {
                const distanceX = player.x - this.x;
                this.direction = distanceX > 0 ? "right" : "left";
                this.setVelocityX(this.direction === "right" ? this.speed : -this.speed);
            } else {
                super.update();
            }
        } else if (this.phase === 2 || this.phase === 3) {
            const distanceX = player.x - this.x;
            this.direction = distanceX > 0 ? "right" : "left";
            this.setVelocityX(this.direction === "right" ? this.speed : -this.speed);
        }

        if (this.direction === "right") {
            this.anims.play("boss_tourne_droite", true);
        } else {
            this.anims.play("boss_tourne_gauche", true);
        }

        this.nomBoss.setPosition(this.x, this.y - 60);
        this.drawHealthBar();
    }

    hit() {
        if (this.invincible || !this.active) return;

        // 💥 Son de coup reçu
        if (this.scene.sonHit2) this.scene.sonHit2.play();

        // 💢 Flash rouge + invincibilité 1s
        this.hp--;
        this.invincible = true;
        this.setTint(0xff0000);

        this.scene.time.delayedCall(1000, () => {
            this.clearTint(); // toujours nettoyage complet
            this.invincible = false;
        });

        if (this.hp <= 0) {
            this.nomBoss.destroy();
            this.barreVie.destroy();

            if (this.timer) this.timer.remove(false);
            if (this.timerAttaque) this.timerAttaque.remove(false);
            if (this.timerShoot) this.timerShoot.remove(false);

            this.setActive(false);
            this.setVisible(false);
            this.scene.cameras.main.fadeOut(1500, 0, 0, 0);

            let musique = this.scene.sound.get("musique_jeu");
            if (musique && musique.isPlaying) musique.stop();

            this.scene.time.delayedCall(1500, () => {
                this.scene.scene.start("victoire");
            });
        }
    }
}



export class Chevalier extends Ennemi {
    constructor(scene, x, y, texture = "chevalier") {
        super(scene, x, y, texture);
         // Ajuste la taille de la hitbox (width, height)
        this.body.setSize(40, 70);

        // Ajuste l’offset de la hitbox (décalage x, y)
        this.body.setOffset(10, 10);
    }

    hit() {
    if (this.invincible || !this.active) return;

    // --- Joue le son sonHit2 ---
    if (this.scene.sonHit2) this.scene.sonHit2.play();

    this.hp--;
    this.invincible = true;
    this.setTint(0xff0000);

    this.scene.time.delayedCall(1000, () => {
        this.clearTint();
        this.invincible = false;
    });

    if (this.hp <= 0) {
        if (Phaser.Math.Between(1, 100) <= 30) {
            const coeur = this.scene.groupeObjets.create(this.x, this.y, "coeur");
            coeur.setBounce(0.3);
            coeur.setCollideWorldBounds(true);
            this.scene.physics.add.collider(coeur, this.scene.groupe_plateformes);
        }

        if (this.timer) this.timer.remove(false);

        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }
}


    update() {
        super.update(); // patrouille de la classe parent



        // Animations spécifiques au chevalier
        if (this.direction === "right") {
            this.anims.play("chevalier_tourne_droite", true);
        } else if (this.direction === "left") {
            this.anims.play("chevalier_tourne_gauche", true);
        }
    }
}