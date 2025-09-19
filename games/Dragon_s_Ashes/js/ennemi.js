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
        // On récupère le calque des plateformes Tiled
        this.calqueDecors = scene.calque_decors;

        this.invincible = false; // pour les dégâts
    }

    update() {
        if (!this.active) return;

        // Mouvement horizontal
        this.setVelocityX(this.direction === "left" ? -this.speed : this.speed);

        // Vérification du sol devant l'ennemi
        let offsetX = this.direction === "left" ? -20 : 20;
        let xCheck = this.x + offsetX;
        let yCheck = this.y + 30;

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
    }

    startShooting() {
        if (!this.active) return;
        const delay = Phaser.Math.Between(1000, 3000);
        this.timer = this.scene.time.delayedCall(delay, () => {
            this.shoot();
            this.startShooting();
        });
    }

    shoot() {
        if (!this.active) return;
        const balle = this.balles.create(this.x, this.y, "bullet");
        balle.body.allowGravity = false;
        const vitesse = this.direction === "left" ? -200 : 200;
        balle.setVelocityX(vitesse);
        balle.setCollideWorldBounds(false);
        balle.body.onWorldBounds = false;
        balle.body.checkWorldBounds = false;

        this.scene.time.delayedCall(3000, () => {
            if (balle.active) balle.destroy();
        });
    }

    update() {
        super.update();
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

        this.nomBoss = this.scene.add.text(this.x, this.y - 60, "Roi du royaume", {
            fontSize: "20px",
            fill: "#ff0000",
            fontStyle: "bold"
        }).setOrigin(0.5);

        this.barreVie = this.scene.add.graphics();
        this.drawHealthBar();

        // 🔥 Zone de détection physique
        this.zoneDetection = scene.add.zone(this.x, this.y).setSize(500, 300);
        scene.physics.add.existing(this.zoneDetection);
        this.zoneDetection.body.setAllowGravity(false);
        this.zoneDetection.body.setImmovable(true);

        // Détection du joueur
        scene.physics.add.overlap(this.zoneDetection, scene.player, () => {
            this.cibleDetectee = true;
        });

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
            this.meleeAttack();
            this.startAttacking();
        });
    }

    meleeAttack() {
        if (!this.active || this.isAttacking) return;
        this.isAttacking = true;

        const largeurHitbox = 50;
        const hauteurHitbox = this.body.height;
        const decalageX = this.direction === "right"
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
            const decalX = this.direction === "right"
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

        // Zone suit toujours le boss
        this.zoneDetection.setPosition(this.x, this.y);

        if (this.cibleDetectee) {
            // Déplacement vers le joueur
            const distanceX = player.x - this.x;

            if (Math.abs(distanceX) > 60) { 
                this.direction = distanceX > 0 ? "right" : "left";
                this.setVelocityX(this.direction === "right" ? this.speed : -this.speed);

                if (this.direction === "right") this.anims.play("anim_tourne_droite", true);
                else this.anims.play("anim_tourne_gauche", true);

            } else { 
                this.setVelocityX(0);
                this.direction = distanceX > 0 ? "right" : "left";
                this.anims.play("anim_face", true);

                if (!this.isAttacking) this.meleeAttack();
            }
        } else {
            // Joueur hors zone → patrouille classique
            super.update(); 
        }

        // MAJ texte et barre de vie
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
            this.destroy();
        }
    }
}

