// enemy.js
export default class Enemy {
    constructor(scene, damageCoefficient = 1, healthCoefficient = 1) {
        this.scene = scene;
        this.damageCoefficient = damageCoefficient; // Coefficient pour ajuster les dégâts
        this.healthCoefficient = healthCoefficient; // Coefficient pour ajuster les points de vie
        this.groupe_ennemis = scene.physics.add.group(); // Groupe pour gérer les ennemis
        this.groupe_projectiles = scene.physics.add.group(); // Groupe pour gérer les projectiles
        this.vitesseProjectiles = 300; // Vitesse des projectiles
        this.vitesseEtoiles = 100; // Vitesse de déplacement des ennemis

        // Animations pour img_perso (mob1)
        this.scene.anims.create({
            key: 'righ',
            frames: this.scene.anims.generateFrameNumbers('img_perso', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'left',
            frames: this.scene.anims.generateFrameNumbers('img_perso', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1,
            yoyo: true
        });

        this.scene.anims.create({
            key: 'stop',
            frames: [{ key: 'img_perso', frame: 8 }],
            frameRate: 20,
        });

        // Animations pour img_mob2
        this.scene.anims.create({
            key: 'mob2_righ',
            frames: this.scene.anims.generateFrameNumbers('img_mob2', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'mob2_left',
            frames: this.scene.anims.generateFrameNumbers('img_mob2', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1,
            yoyo: true,
        });

        this.scene.anims.create({
            key: 'mob2_stop',
            frames: [{ key: 'img_mob2', frame: 8 }],
            frameRate: 20,
        });

        // Animations pour img_mob3
        this.scene.anims.create({
            key: 'mob3_righ',
            frames: this.scene.anims.generateFrameNumbers('img_mob3', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'mob3_left',
            frames: this.scene.anims.generateFrameNumbers('img_mob3', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1,
            yoyo: true,
        });

        this.scene.anims.create({
            key: 'mob3_stop',
            frames: [{ key: 'img_mob3', frame: 8 }],
            frameRate: 20,
        });

            // Animations pour le dragon
        this.scene.anims.create({
            key: 'dragon_righ',
            frames: this.scene.anims.generateFrameNumbers('img_dragon', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.scene.anims.create({
            key: 'dragon_left',
            frames: this.scene.anims.generateFrameNumbers('img_dragon', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1,
            yoyo: true,
        });

        this.scene.anims.create({
            key: 'dragon_stop',
            frames: [{ key: 'img_dragon', frame: 8 }],
            frameRate: 20,
        });

        // Animations pour le démon (mob6)
        this.scene.anims.create({
            key: 'demon_righ',
            frames: this.scene.anims.generateFrameNumbers('img_demon', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.scene.anims.create({
            key: 'demon_left',
            frames: this.scene.anims.generateFrameNumbers('img_demon', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1,
            yoyo: true
        });
        
        this.scene.anims.create({
            key: 'demon_stop',
            frames: [{ key: 'img_demon', frame: 8 }],
            frameRate: 20,
        });

    }
    
    /**
     * Crée un ennemi à une position spécifique avec un type donné.
     * @param {number} spawnX - La position X où l'ennemi doit apparaître.
     * @param {number} spawnY - La position Y où l'ennemi doit apparaître.
     * @param {string} type - Le type d'ennemi à créer ('mob1', 'mob2', 'mob3').
     */
    creerEnnemi(spawnX, spawnY, type) {
        let ennemi;

        switch(type) {
            case 'mob1':
                ennemi = this.groupe_ennemis.create(spawnX, spawnY, 'img_perso');
                ennemi.health = 20 * this.healthCoefficient; // Points de vie ajustés
                ennemi.damage = 5 * this.damageCoefficient; // Dégâts ajustés
                ennemi.shouldFollowPlayer = true;
                ennemi.cooldownAttaque = 0;

                ennemi.setCollideWorldBounds(true);
                ennemi.setBounce(1);

                // Méthode pour tirer des projectiles
                ennemi.tirer = () => {
                    const projectile = this.groupe_projectiles.create(ennemi.x, ennemi.y, "boule");
                    this.tirerProjectile(projectile, ennemi);
                };

                // Timer pour les tirs
                ennemi.tir = this.scene.time.addEvent({
                    delay: 1900,
                    callback: ennemi.tirer,
                    callbackScope: ennemi,
                    loop: true,
                });

                // Nettoyage lors de la destruction de l'ennemi
                ennemi.on('destroy', () => {
                    if (ennemi.tir) {
                        this.scene.time.removeEvent(ennemi.tir);
                    }
                });

                break;

            case 'mob2':
                ennemi = this.groupe_ennemis.create(spawnX, spawnY, 'img_mob2');
                ennemi.health = 80 * this.healthCoefficient; // Points de vie ajustés
                ennemi.damage = 10 * this.damageCoefficient; // Dégâts ajustés
                ennemi.shouldFollowPlayer = true;
                ennemi.cooldownAttaque = 0;

                ennemi.setCollideWorldBounds(true);
                ennemi.setBounce(1);
                break;

            case 'mob3':
                ennemi = this.groupe_ennemis.create(spawnX, spawnY, 'img_mob3');
                ennemi.health = 80 * this.healthCoefficient; // Points de vie ajustés
                ennemi.damage = 15 * this.damageCoefficient; // Dégâts ajustés
                ennemi.shouldFollowPlayer = true;
                ennemi.cooldownAttaque = 0;

                ennemi.setCollideWorldBounds(true);
                ennemi.setBounce(1);
                break;

                
                case 'mob4':
                    ennemi = this.groupe_ennemis.create(spawnX, spawnY, 'img_mob4');
        ennemi.health = 60 * this.healthCoefficient;
        ennemi.damage = 12 * this.damageCoefficient;
        ennemi.shouldFollowPlayer = false;
        ennemi.cooldownAttaque = 0;

        ennemi.setCollideWorldBounds(true);
        ennemi.setBounce(1);
    

                // Méthode pour tirer des projectiles
                ennemi.tirer = () => {
                    const projectile = this.groupe_projectiles.create(ennemi.x, ennemi.y, "boule");
                    this.tirerProjectile(projectile, ennemi);
                };

                // Timer pour les tirs
                ennemi.tir = this.scene.time.addEvent({
                    delay: 1800,
                    callback: ennemi.tirer,
                    callbackScope: ennemi,
                    loop: true,
                });

                // Nettoyage lors de la destruction de l'ennemi
                ennemi.on('destroy', () => {
                    if (ennemi.tir) {
                        this.scene.time.removeEvent(ennemi.tir);
                    }
                });

                break;

                    case 'dragon':
                ennemi = this.groupe_ennemis.create(spawnX, spawnY, 'img_dragon');
                ennemi.health = 200 * this.healthCoefficient; // Points de vie augmentés
                ennemi.damage = 20 * this.damageCoefficient; // Dégâts ajustés
                ennemi.shouldFollowPlayer = true;
                ennemi.cooldownAttaque = 0;

                ennemi.setCollideWorldBounds(true);
                ennemi.setBounce(1);
                 break;

                 case 'mob6':
                    ennemi = this.groupe_ennemis.create(spawnX, spawnY, 'img_demon');
                    ennemi.health = 180 * this.healthCoefficient; // Points de vie ajustés
                    ennemi.damage = 25 * this.damageCoefficient; // Dégâts ajustés
                    ennemi.shouldFollowPlayer = true;
                    ennemi.cooldownAttaque = 0;
                
                    ennemi.setCollideWorldBounds(true);
                    ennemi.setBounce(1);
                    break;


            default:
                console.warn(`Type d'ennemi inconnu: ${type}`);
                return;
        }

        ennemi.setDepth(1);
    }

    /**
     * Tire un projectile en direction du joueur.
     * @param {Phaser.Physics.Arcade.Sprite} projectile - Le projectile à tirer.
     * @param {Phaser.Physics.Arcade.Sprite} ennemi - L'ennemi qui tire le projectile.
     */
    tirerProjectile(projectile, ennemi) {
        if (this.scene.player && this.scene.player.player) {
            const angle = Phaser.Math.Angle.Between(ennemi.x, ennemi.y, this.scene.player.player.x, this.scene.player.player.y);
            this.scene.physics.velocityFromRotation(angle, this.vitesseProjectiles, projectile.body.velocity);
            projectile.setDepth(2);
        } else {
            projectile.destroy();
        }
    }

    /**
     * Gère les dégâts reçus par un ennemi.
     * @param {number} damage - Les dégâts à infliger.
     * @param {Phaser.Physics.Arcade.Sprite} ennemi - L'ennemi qui reçoit les dégâts.
     */
    recevoirDegats(damage, ennemi) {
        ennemi.health -= damage;
        if (ennemi.health <= 0) {
            if (ennemi.tir) {
                this.scene.time.removeEvent(ennemi.tir);
            }
            ennemi.destroy();
        }
    }

    /**
     * Met à jour le comportement des ennemis et des projectiles.
     */
    update() {
        // Mettre à jour la position des ennemis
        this.groupe_ennemis.children.iterate((ennemi) => {
            if (ennemi && ennemi.shouldFollowPlayer) {
                if (this.scene.player && this.scene.player.player) {
                    const playerX = this.scene.player.player.x;
                    const playerY = this.scene.player.player.y;
                    const angle = Phaser.Math.Angle.Between(ennemi.x, ennemi.y, playerX, playerY);
    
                    const velocityX = Math.cos(angle) * this.vitesseEtoiles;
                    const velocityY = Math.sin(angle) * this.vitesseEtoiles;
    
                    ennemi.setVelocity(velocityX, velocityY);
    
                    ennemi.flipX = velocityX > 0;
    
                    // Jouer la bonne animation en fonction de la direction
                    if (velocityX > 0) {
                        if (ennemi.texture.key === 'img_demon') {
                            ennemi.play('demon_righ', true);
                        } else if (ennemi.texture.key === 'img_dragon') {
                            ennemi.play('dragon_left', true); // Dragon est inversé ici
                        } else if (ennemi.texture.key === 'img_mob2') {
                            ennemi.play('mob2_righ', true);
                        } else if (ennemi.texture.key === 'img_mob3') {
                            ennemi.play('mob3_righ', true);
                        } else {
                            ennemi.play('righ', true);
                        }
                    } else if (velocityX < 0) {
                        if (ennemi.texture.key === 'img_demon') {
                            ennemi.play('demon_left', true);
                        } else if (ennemi.texture.key === 'img_dragon') {
                            ennemi.play('dragon_righ', true); // Dragon est inversé ici
                        } else if (ennemi.texture.key === 'img_mob2') {
                            ennemi.play('mob2_left', true);
                        } else if (ennemi.texture.key === 'img_mob3') {
                            ennemi.play('mob3_left', true);
                        } else {
                            ennemi.play('left', true);
                        }
                    } else {
                        if (ennemi.texture.key === 'img_demon') {
                            ennemi.play('demon_stop', true);
                        } else if (ennemi.texture.key === 'img_dragon') {
                            ennemi.play('dragon_stop', true);
                        } else if (ennemi.texture.key === 'img_mob2') {
                            ennemi.play('mob2_stop', true);
                        } else if (ennemi.texture.key === 'img_mob3') {
                            ennemi.play('mob3_stop', true);
                        } else {
                            ennemi.play('stop', true);
                        }
                    }
                    
                }
            }
        });
    
        // Mettre à jour les projectiles
        this.groupe_projectiles.children.iterate((projectile) => {
            if (projectile && !this.scene.cameras.main.worldView.contains(projectile.x, projectile.y)) {
                projectile.destroy();
            }
        });
    }

}