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

        this.scene = scene;
        this.groupe_plateformes = scene.groupe_plateformes;

        this.invincible = false; // pour les dégâts
    }

    update() {
        if (!this.active) return;

        // mouvement latéral
        if (this.direction === "left") this.setVelocityX(-this.speed);
        else this.setVelocityX(this.speed);

        // Détection du vide devant l’ennemi
        let offsetX = (this.direction === "left") ? -20 : 20;
        let xCheck = this.x + offsetX;
        let yCheck = this.y + 30;

        let solEnDessous = false;
        this.groupe_plateformes.children.iterate((plateforme) => {
            if (!plateforme) return;
            let bounds = plateforme.getBounds();
            if (Phaser.Geom.Rectangle.Contains(bounds, xCheck, yCheck)) solEnDessous = true;
        });

        if (!solEnDessous) this.direction = (this.direction === "left") ? "right" : "left";
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
        // Chance de 20 % de lâcher un cœur
        if (Phaser.Math.Between(1, 100) <= 20) {
            const coeur = this.scene.groupeObjets.create(this.x, this.y, "coeur");
            coeur.setBounce(0.3);
            coeur.setCollideWorldBounds(true);
            this.scene.physics.add.collider(coeur, this.scene.groupe_plateformes);
        }

        // Stop le timer de tir si c'est un EnnemiTireurSimple
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

        // Groupe de projectiles de l'ennemi
        this.balles = scene.physics.add.group();

        // Démarrage du tir aléatoire
        this.startShooting();
    }

    startShooting() {
        if (!this.active) return; // ne pas démarrer si l'ennemi n'est plus actif

        const delay = Phaser.Math.Between(1000, 3000);
        this.timer = this.scene.time.delayedCall(delay, () => {
            this.shoot();
            this.startShooting(); // relance un nouveau timer
        });
    }

    shoot() {
        if (!this.active) return;

        // Création de la balle
        const balle = this.balles.create(this.x, this.y, "bullet");
        balle.body.allowGravity = false;

        // Déterminer la vitesse selon la direction de l'ennemi
        const vitesse = (this.direction === "left") ? -200 : 200;
        balle.setVelocityX(vitesse);

        // Ne pas utiliser onWorldBounds pour éviter le freeze
        balle.setCollideWorldBounds(false);
        balle.body.onWorldBounds = false;
        balle.body.checkWorldBounds = false;

        // Destruction automatique après 3 secondes
        this.scene.time.delayedCall(3000, () => {
            if (balle.active) balle.destroy();
        });
    }

    update() {
        super.update(); // mouvement latéral normal
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
        // Chance de 20 % de lâcher un cœur
        if (Phaser.Math.Between(1, 100) <= 20) {
            const coeur = this.scene.groupeObjets.create(this.x, this.y, "coeur");
            coeur.setBounce(0.3);
            coeur.setCollideWorldBounds(true);
            this.scene.physics.add.collider(coeur, this.scene.groupe_plateformes);
        }

        // Stop le timer de tir si c'est un EnnemiTireurSimple
        if (this.timer) this.timer.remove(false);

        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }
}
}

export class Boss extends Ennemi {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        this.hp = 20; // PV max
        this.maxHp = 20;
        this.force = 2; // dégâts infligés au joueur
        this.isAttacking = false;

        // Nom du boss
        this.nomBoss = this.scene.add.text(this.x, this.y - 60, "Roi du royaume", {
            fontSize: "20px",
            fill: "#ff0000",
            fontStyle: "bold"
        }).setOrigin(0.5);

        // Barre de vie
        this.barreVie = this.scene.add.graphics();
        this.drawHealthBar();

        // Zone de détection encore plus large
        this.zoneDetection = { xMin: 100, xMax: 1100, yMin: 100, yMax: 700 };

        // Augmentation de la vitesse
        this.speed = 100;

        this.startAttacking();
    }

    drawHealthBar() {
        this.barreVie.clear();
        this.barreVie.fillStyle(0x555555);
        this.barreVie.fillRect(this.x - 40, this.y - 40, 80, 10);
        this.barreVie.fillStyle(0xff0000);
        const largeurPV = (this.hp / this.maxHp) * 80;
        this.barreVie.fillRect(this.x - 40, this.y - 40, largeurPV, 10);
    }

    startAttacking() {
        if (!this.active) return;
        const delay = Phaser.Math.Between(1000, 5000);
        this.timerAttaque = this.scene.time.delayedCall(delay, () => {
            this.meleeAttack();
            this.startAttacking();
        });
    }

    meleeAttack() {
        if (!this.active || this.isAttacking) return;
        this.isAttacking = true;

        const largeurHitbox = 50;
        const hauteurHitbox = this.body.height;
        const decalageX = (this.direction === "right")
            ? this.body.width / 2 + largeurHitbox / 2
            : -this.body.width / 2 - largeurHitbox / 2;

        const hitbox = this.scene.add.zone(this.x + decalageX, this.y, largeurHitbox, hauteurHitbox);
        this.scene.physics.add.existing(hitbox);
        hitbox.body.setAllowGravity(false);
        hitbox.body.setImmovable(true);

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
            const decalX = (this.direction === "right")
                ? this.body.width / 2 + largeurHitbox / 2
                : -this.body.width / 2 - largeurHitbox / 2;
            hitbox.setPosition(this.x + decalX, this.y);
        };

        this.scene.time.delayedCall(500, () => {
            hitbox.destroy();
            this.isAttacking = false;
        });
    }

    update() {
        if (!this.active) return;

        const player = this.scene.player;
        const zone = this.zoneDetection;

        // Poursuite directe et rapide dans la zone
        if (player.x >= zone.xMin && player.x <= zone.xMax &&
            player.y >= zone.yMin && player.y <= zone.yMax) {

            if (Math.abs(player.x - this.x) > 60) {
                this.direction = player.x > this.x ? "right" : "left";
                this.setVelocityX(this.direction === "right" ? this.speed : -this.speed);

                if (this.direction === "right") this.anims.play("anim_tourne_droite", true);
                else this.anims.play("anim_tourne_gauche", true);

            } else {
                // Proche → s'arrête et attaque
                this.setVelocityX(0);
                this.direction = player.x > this.x ? "right" : "left";
                this.anims.play("anim_face", true);

                if (!this.isAttacking) this.meleeAttack();
            }
        } else {
            super.update(); // patrouille classique si hors zone
        }

        this.nomBoss.setPosition(this.x, this.y - 60);
        this.drawHealthBar();
    }

    hit() {
        super.hit();
        if (this.active) {
            this.drawHealthBar();
        } else {
            this.barreVie.destroy();
            this.nomBoss.destroy();
        }
    }
}
