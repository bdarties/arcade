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

        this.scene.time.delayedCall(1500, () => {
            this.clearTint();
            this.invincible = false;
        });

        if (this.hp <= 0) {
            if (Phaser.Math.Between(1, 100) <= 20) {
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
        const delay = Phaser.Math.Between(3000, 6000);
        this.timer = this.scene.time.delayedCall(delay, () => {
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
        super.hit();
    }
}

export class Boss extends Ennemi {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        this.hp = 20;
        this.maxHp = 20;
        this.force = 2;
        this.isAttacking = false;
        this.cibleDetectee = false; // 🔥 flag de détection

        // Ajuste la taille de la hitbox (width, height)
        this.body.setSize(70, 80);

        // Ajuste l’offset de la hitbox (décalage x, y)
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
    }

    drawHealthBar() {
        this.barreVie.clear();
        this.barreVie.fillStyle(0x555555);
        this.barreVie.fillRect(this.x - 40, this.y - 40, 80, 10);
        this.barreVie.fillStyle(0xff0000);
        this.barreVie.fillRect(this.x - 40, this.y - 40, (this.hp / this.maxHp) * 80, 10);
    }

    startAttacking() {
        if (!this.active) return;
        const delay = Phaser.Math.Between(1000, 5000);
        this.timerAttaque = this.scene.time.delayedCall(delay, () => {
            if (!this.invincible) { // ⛔ empêche l’attaque si invincible
                this.meleeAttack();
            }
            this.startAttacking();
        });
    }

meleeAttack() {
    if (!this.active || this.isAttacking || this.invincible) return;
    this.isAttacking = true;

    // --- Joue l’animation d’attaque du boss ---
    const animBoss = this.direction === "right" ? "boss_attaque_droite" : "boss_attaque_gauche";
    this.anims.play(animBoss, true);

    // --- Crée la hitbox d’attaque AVEC animation ---
    const largeurHitbox = 50;
    const hauteurHitbox = this.body.height;
    const decalageX = this.direction === "right"
        ? this.body.width / 2 + largeurHitbox / 2
        : -this.body.width / 2 - largeurHitbox / 2;

    // Utilisation d’un SPRITE au lieu d’une zone
    const hitbox = this.scene.physics.add.sprite(this.x + decalageX, this.y, "boss_attaque");
    hitbox.setSize(largeurHitbox, hauteurHitbox);
    hitbox.setOffset(0, 0);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);

    // --- Animation de la hitbox ---
    const animHitbox = this.direction === "right" ? "attaque_boss_droite" : "attaque_boss_gauche";
    hitbox.anims.play(animHitbox, true);

    // --- Détection collision avec le joueur ---
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

    // --- Hitbox suit le boss tant que l’attaque dure ---
    hitbox.update = () => {
        const decalX = this.direction === "right"
            ? this.body.width / 2 + largeurHitbox / 2
            : -this.body.width / 2 - largeurHitbox / 2;
        hitbox.setPosition(this.x + decalX, this.y);
    };

    // --- On détruit la hitbox quand l’animation est finie ---
    hitbox.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        hitbox.destroy();
        this.isAttacking = false;
    });
}



update() {
    if (!this.active) return;

    const player = this.scene.player;

    if (this.isAttacking) {
        this.setVelocityX(0);
        return; // si attaque en cours, pas de mouvement
    }

    if (this.cibleDetectee) {
        // 🔥 Le joueur est dans la zone → le boss le suit activement
        const distanceX = player.x - this.x;

        this.direction = distanceX > 0 ? "right" : "left";
        this.setVelocityX(this.direction === "right" ? this.speed : -this.speed);

        if (this.direction === "right") {
            this.anims.play("boss_tourne_droite", true);
        } else {
            this.anims.play("boss_tourne_gauche", true);
        }

    } else {
        // ❄️ Joueur hors zone → patrouille classique
        super.update();
        if (this.direction === "right") {
            this.anims.play("boss_tourne_droite", true);
        } else {
            this.anims.play("boss_tourne_gauche", true);
        }
    }

    // MAJ du texte et barre de vie
    this.nomBoss.setPosition(this.x, this.y - 60);
    this.drawHealthBar();
}


    hit() {
        if (this.invincible || !this.active) return;

        this.hp--;
        this.invincible = true;
        this.setTint(0xff0000);

        this.scene.time.delayedCall(1500, () => {
            this.clearTint();
            this.invincible = false;
        });

        if (this.hp <= 0) {
            // 🔥 Supprimer nom et barre de vie
            this.nomBoss.destroy();
            this.barreVie.destroy();

            if (this.timer) this.timer.remove(false);
            if (this.timerAttaque) this.timerAttaque.remove(false);

            this.setActive(false);
            this.setVisible(false);
            this.scene.cameras.main.fadeOut(1500, 0, 0, 0);
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