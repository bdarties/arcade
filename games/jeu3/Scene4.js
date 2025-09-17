// Scene4.js
import Player from './player.js';
import Enemy from './enemy.js';
import PlayerConfig from './playconfig.js'; // Importer PlayerConfig

export default class SecondScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Scene4' });
        this.redRectangle = null; // Pour stocker le rectangle rouge
        this.enemiesSpawned = 0; // Compteur d'ennemis générés
        this.enemyManager = null; // Pour gérer les ennemis
        this.xpBar = null; // Pour la barre d'expérience
        this.tempsEcoule = 0; // Temps écoulé en secondes
        this.spawnMob2Allowed = false; // Indique si les mob2 peuvent apparaître
        this.cooldownAttaqueDurée = 1000; // Durée du cooldown d'attaque en ms (ajustez selon vos besoins)
        this.damageCoefficient = 2; // Coefficient pour les dégâts dans cette map
        this.healthCoefficient = 2; // Coefficient pour les points de vie dans cette map
        this.dragonSpawned = false;
    }

    preload() {
        // Charger les assets
        this.load.spritesheet("img_dragon", "src/assets/dragon.png", {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.load.image("img_background4", "src/assets/map4.png");
        this.load.image("img_etoile", "src/assets/diamant.png");
        this.load.image("bomb", "src/assets/boule.png");
        this.load.image('porte', 'src/assets/porte1.png');
        this.load.spritesheet("img_perso", "src/assets/Mob1.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet("sprite_joueur", "src/assets/Spritepp1.png", {
            frameWidth: 40,
            frameHeight: 64,
        });

        this.load.spritesheet("img_mob2", "src/assets/Mob2.png", {
            frameWidth: 32,
            frameHeight: 64,
        });

        this.load.spritesheet("img_mob3", "src/assets/mob3.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
    }

    create() {
        // Définir les limites du monde
        this.physics.world.setBounds(-10000, -10000, 20000, 20000);
        

        // Ajouter le fond
        this.background = this.add.tileSprite(0, 0, 20000, 20000, "img_background4").setOrigin(0, 0);
        this.background.setScrollFactor(0);

        // Initialiser le joueur
        const playerInitialX = 0;
        const playerInitialY = 0;
        this.player = new Player(this, playerInitialX, playerInitialY);
        this.player.player.setCollideWorldBounds(true);

        // Créer les ennemis via Enemy.js
        this.enemyManager = new Enemy(this, this.damageCoefficient, this.healthCoefficient);

        // Gérer les collisions avec les ennemis et les projectiles
        this.physics.add.overlap(this.player.player, this.enemyManager.groupe_ennemis, this.collisionEnnemi, null, this);
        this.physics.add.overlap(this.player.player, this.enemyManager.groupe_projectiles, this.collisionProjectile, null, this);
        this.physics.add.overlap(this.player.bulletGroup, this.enemyManager.groupe_ennemis, this.collisionEnemyBullet, null, this);

        // Configurer la caméra
        this.cameras.main.startFollow(this.player.player, true);
        this.cameras.main.setBounds(-10000, -10000, 20000, 20000);

        // Ajouter les éléments d'interface utilisateur
        this.timerText = this.add.text(16, 16, 'Temps: 0s', { fontSize: '32px', fill: '#fff' }).setScrollFactor(0);
        this.xpText = this.add.text(16, 48, 'XP: ' + PlayerConfig.xp, { fontSize: '32px', fill: '#fff' }).setScrollFactor(0);
        this.levelText = this.add.text(16, 80, 'Niveau: ' + PlayerConfig.level, { fontSize: '32px', fill: '#fff' }).setScrollFactor(0);

        // Initialiser la barre d'expérience
        this.xpBar = this.add.graphics();
        this.xpBar.setScrollFactor(0);
        this.xpBar.setPosition(16, 112);
        this.updateBarreXP();

        // Créer les étoiles
        this.stars = this.physics.add.group();
        this.spawnStarNearPlayer(); // Cette ligne peut être conservée si vous souhaitez avoir une étoile initiale près du joueur

        // Gérer la collecte des étoiles
        this.physics.add.overlap(this.player.player, this.stars, this.collectStar, null, this);

        // Timer pour permettre l'apparition des mob2 après 1m30
        this.time.addEvent({
            delay: 10000, // 1m30 en millisecondes
            callback: () => {
                this.spawnMob2Allowed = true;
                console.log("Les ennemis Mob2 peuvent maintenant apparaître.");
            },
            callbackScope: this,
            loop: false,
        });

        // Timer pour spawn les ennemis toutes les 2 secondes
        this.time.addEvent({
            delay: 2000, // 2 secondes
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true,
        });

        // Ajouter un texte indiquant la carte actuelle (modification ici)
        this.add.text(300, 50, 'Vous êtes dans la carte 4', { fontSize: '32px', fill: '#fff' }).setScrollFactor(0);
    }

    update(time, delta) {
        // Mettre à jour le joueur et les ennemis
        this.player.update(time, delta);
        this.enemyManager.update();

        // Mettre à jour la position du fond en fonction de la caméra
        this.background.tilePositionX = this.cameras.main.scrollX * 1;
        this.background.tilePositionY = this.cameras.main.scrollY * 1;

        // Mettre à jour le temps écoulé
        this.tempsEcoule += delta / 1000; // Convertir delta en secondes

        // Mettre à jour l'affichage du temps avec format minutes + secondes
        this.timerText.setText('Temps: ' + this.formatTime(this.tempsEcoule));

        // Mettre à jour les autres textes
        this.xpText.setText('XP: ' + PlayerConfig.xp);
        this.levelText.setText('Niveau: ' + PlayerConfig.level);

        if (this.tempsEcoule >= 10 && !this.redRectangle) {
            this.createRedRectangle();
        }

        // Mettre à jour la barre d'expérience
        this.updateBarreXP();
    }

    // Les autres méthodes (spawnStarNearPlayer, updateBarreXP, etc.) restent inchangées
/**
     * Formate le temps écoulé en minutes et secondes.
     * @param {number} seconds - Temps écoulé en secondes.
     * @returns {string} - Temps formaté (e.g., "1m 15s").
     */
formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    } else {
        return `${remainingSeconds}s`;
    }
}

/**
 * Gère l'apparition des ennemis en fonction du temps écoulé.
 * - Pendant les premières 1m30, seuls les mob1 (img_perso) apparaissent.
 * - Après 1m30, les mob1 et mob2 (img_mob2) peuvent apparaître aléatoirement.
 */
spawnEnemy() {
    const camera = this.cameras.main;
    const spawnX = Phaser.Math.Between(camera.scrollX, camera.scrollX + camera.width);
    const spawnY = Phaser.Math.Between(camera.scrollY, camera.scrollY + camera.height);
    const distanceToPlayer = Phaser.Math.Distance.Between(spawnX, spawnY, this.player.player.x, this.player.player.y);
    const minDistance = 100;

    if (distanceToPlayer > minDistance) {
        if (this.spawnMob2Allowed) {
            // Après 1m30, apparition du dragon si pas encore apparu
            if (!this.dragonSpawned) {
                this.enemyManager.creerEnnemi(spawnX, spawnY, 'dragon');
                this.dragonSpawned = true; // Assurer que le dragon ne spawn qu'une seule fois
                console.log("Le dragon est apparu !");
            } else {
                // Continuer de faire apparaître les ennemis mob1, mob2, et mob3 après 1m30
                const random = Math.random();
                if (random < 0.33) {
                    this.enemyManager.creerEnnemi(spawnX, spawnY, 'mob1');
                } else if (random < 0.66) {
                    this.enemyManager.creerEnnemi(spawnX, spawnY, 'mob2');
                } else {
                    this.enemyManager.creerEnnemi(spawnX, spawnY, 'mob3');
                }
            }
        } else {
            // Avant 1m30, seulement mob1, mob2, et mob3 apparaissent
            const random = Math.random();
            if (random < 0.33) {
                this.enemyManager.creerEnnemi(spawnX, spawnY, 'mob1');
            } else if (random < 0.66) {
                this.enemyManager.creerEnnemi(spawnX, spawnY, 'mob2');
            } else {
                this.enemyManager.creerEnnemi(spawnX, spawnY, 'mob3');
            }
        }
        this.enemiesSpawned++;
    }
}

/**
 * Crée une étoile près du joueur à une position aléatoire autour de lui.
 */
spawnStarNearPlayer() {
    const camera = this.cameras.main;
    const offsetX = Phaser.Math.Between(-camera.width / 2, camera.width / 2);
    const offsetY = Phaser.Math.Between(-camera.height / 2, camera.height / 2);

    const starX = this.player.player.x + offsetX;
    const starY = this.player.player.y + offsetY;

    const star = this.stars.create(starX, starY, 'img_etoile');
    star.setCollideWorldBounds(true);
}

/**
 * Gère la collecte des étoiles par le joueur.
 * @param {Phaser.GameObjects.GameObject} player - Le joueur.
 * @param {Phaser.GameObjects.GameObject} star - L'étoile collectée.
 */
collectStar(player, star) {
    star.disableBody(true, true);
    PlayerConfig.xp += 20; // Ajoute 20 XP pour chaque étoile

    this.updateBarreXP();
    // Suppression de la réapparition automatique de l'étoile
    // this.spawnStarNearPlayer(); // Cette ligne a été supprimée
}

/**
 * Met à jour la barre d'expérience.
 */
updateBarreXP() {
    this.xpBar.clear();
    const barreWidth = 200;
    const barreHeight = 20;
    const barreRemplie = (PlayerConfig.xp / PlayerConfig.xpMax) * barreWidth;

    // Barre verte (XP actuelle)
    this.xpBar.fillStyle(0x00ff00, 1);
    this.xpBar.fillRect(0, 0, barreRemplie, barreHeight);

    // Barre grise (XP restante)
    this.xpBar.fillStyle(0x888888, 1);
    this.xpBar.fillRect(barreRemplie, 0, barreWidth - barreRemplie, barreHeight);

    // Vérifie si l'XP a atteint le maximum
    if (PlayerConfig.xp >= PlayerConfig.xpMax) {
        this.levelUp();
    }
}

/**
 * Gère le passage au niveau supérieur.
 */
levelUp() {
    PlayerConfig.level++;
    PlayerConfig.xp = PlayerConfig.xp - PlayerConfig.xpMax; // Réinitialiser l'XP mais conserver l'excédent
    PlayerConfig.xpMax += 100; // Augmenter la barre d'XP pour le niveau suivant

    console.log(`Niveau supérieur! Nouveau niveau: ${PlayerConfig.level}, nouvelle barre d'XP: ${PlayerConfig.xpMax}`);
}

/**
 * Gère la collision entre le joueur et un ennemi.
 * @param {Phaser.GameObjects.GameObject} player - Le joueur.
 * @param {Phaser.GameObjects.GameObject} ennemi - L'ennemi.
 */
collisionEnnemi(player, ennemi) {
    if (ennemi.tint !== 0xff0000 && ennemi.cooldownAttaque <= 0) {
        this.player.loseLife(ennemi.damage); // Utiliser les dégâts de l'ennemi
        ennemi.cooldownAttaque = this.cooldownAttaqueDurée; // Réinitialiser le cooldown d'attaque

        // Réinitialiser le cooldown après la durée spécifiée
        this.time.delayedCall(this.cooldownAttaqueDurée, () => {
            ennemi.cooldownAttaque = 0;
        });

        if (this.player.lives <= 0) {
            this.gameOver();
        }
    }
}

/**
 * Gère la collision entre le joueur et un projectile ennemi.
 * @param {Phaser.GameObjects.GameObject} player - Le joueur.
 * @param {Phaser.GameObjects.GameObject} projectile - Le projectile.
 */
collisionProjectile(player, projectile) {
    this.player.loseLife(10); // Dégâts fixes ou ajustables
    projectile.destroy();
    if (this.player.lives <= 0) {
        this.gameOver();
    }
}

/**
 * Gère la collision entre une balle du joueur et un ennemi.
 * @param {Phaser.GameObjects.GameObject} projectile - La balle du joueur.
 * @param {Phaser.GameObjects.GameObject} enemy - L'ennemi touché.
 */
collisionEnemyBullet(projectile, enemy) {
    projectile.destroy();
    this.enemyManager.recevoirDegats(projectile.damage, enemy); // Utiliser les dégâts du projectile

    if (enemy.health <= 0) {
        this.spawnStarNearEnemy(enemy.x, enemy.y); // Faire tomber une étoile
    }
}

/**
 * Crée un rectangle rouge à une position aléatoire sur la carte.
 */
createRedRectangle() {
    const camera = this.cameras.main;
    const screenWidth = camera.width;
    const screenHeight = camera.height;

    const randomX = camera.scrollX + Phaser.Math.Between(50, screenWidth - 50);
    const randomY = camera.scrollY + Phaser.Math.Between(50, screenHeight - 50);

    // Crée un sprite avec l'image de la porte
    this.redRectangle = this.physics.add.sprite(randomX, randomY, 'porte');
    this.redRectangle.setScale(0.5); // Ajuste l'échelle si la porte est trop grande
    this.redRectangle.setImmovable(true);
    this.redRectangle.body.setAllowGravity(false);
    this.redRectangle.setDepth(2);

    // Gérer la collision avec la porte
    this.physics.add.overlap(this.player.player, this.redRectangle, this.changerNiveau, null, this);
   
    this.createRedRectangle();
}

/**
 * Change de niveau en passant à la scène suivante.
 */
changerNiveau() {
    this.scene.start('Scene5');
}
createRedRectangle() {
    const camera = this.cameras.main;
    const screenWidth = camera.width;
    const screenHeight = camera.height;

    const randomX = camera.scrollX + Phaser.Math.Between(50, screenWidth - 50);
    const randomY = camera.scrollY + Phaser.Math.Between(50, screenHeight - 50);

    // Crée un sprite avec l'image de la porte
    this.redRectangle = this.physics.add.sprite(randomX, randomY, 'porte');
    this.redRectangle.setScale(0.5);
    this.redRectangle.setImmovable(true);
    this.redRectangle.body.setAllowGravity(false);
    this.redRectangle.setDepth(2);

    // Gérer la collision avec la porte pour changer de niveau
    this.physics.add.overlap(this.player.player, this.redRectangle, this.changerNiveau, null, this);
}
/**
 * Gère la fin du jeu lorsque le joueur n'a plus de vies.
 */
gameOver() {
    this.player.player.setTint(0xff0000);
    this.player.player.anims.play("turn"); // Assurez-vous que l'animation "turn" est définie pour le joueur
    this.physics.pause();
    console.log("lose");
}


/**
 * Crée une étoile près d'un ennemi à une position donnée.
 * @param {number} x - La position X de l'ennemi.
 * @param {number} y - La position Y de l'ennemi.
 */
spawnStarNearEnemy(x, y) {
    const star = this.stars.create(x, y, 'img_etoile'); // Utilisez le sprite d'étoile
    star.setCollideWorldBounds(true); // Assurez-vous qu'elle ne sort pas des limites
    star.body.setAllowGravity(false); // Désactiver la gravité pour l'étoile
    star.body.setImmovable(true); // Rendre l'étoile immobile
}
}
