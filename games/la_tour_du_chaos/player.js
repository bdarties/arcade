export default class Player {
    constructor(scene) {
        this.scene = scene;
        this.player = scene.physics.add.sprite(400, 300, 'sprite_joueur'); // Centrer le joueur
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);

        // Initialiser la vie, les dégâts des projectiles et le multiplicateur de vélocité
        this.vies = 100; // Initialiser la vie du joueur
        this.projectileDamage = 50; // Dégâts de base pour chaque projectile
        this.damageMultiplier = 1;
        this.velocityMultiplier = 1; // Multiplier de vitesse pour les déplacements

        // Initialiser l'XP et le niveau
        this.xp = 0; // XP du joueur
        this.xpMax = 100; // XP nécessaire pour le prochain niveau
        this.level = 1; // Niveau initial
        this.xpBoost = 1; // Multiplicateur pour l'XP

        // Créer la barre d'expérience
        this.xpBar = this.createXpBar();

        // Initialiser le groupe de projectiles
        this.bulletGroup = this.scene.physics.add.group();

        // Garder la dernière direction (pour savoir si on va à gauche ou à droite)
        this.lastDirection = 'right';

        // Créer une barre de vie
        this.lifeBar = this.createLifeBar();

        // Créer les animations pour le joueur
        scene.anims.create({
            key: 'right',
            frames: scene.anims.generateFrameNumbers('sprite_joueur', { start: 5, end: 9 }), // Animation de droite
            frameRate: 10,
            repeat: -1,
        });

        scene.anims.create({
            key: 'turn',
            frames: [{ key: 'sprite_joueur', frame: 4 }], // Idle
            frameRate: 20,
        });

        // Gestion des touches de déplacement
        this.clavier = scene.input.keyboard.createCursorKeys();
        this.shootDelay = 500; // Délai entre les tirs
        this.lastShotTime = 0; // Temps du dernier tir

        // Gestion de l'orbe (bouclier)
        this.orbeActive = false;  // Pour savoir si l'orbe est activé
        this.orbe = null;         // Référence de l'orbe

        // Animation de l'orbe
        scene.anims.create({
            key: 'spin_orbe',
            frames: scene.anims.generateFrameNumbers('orbe', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        // Touche pour activer/désactiver l'orbe
        this.keyH = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H); // Ajoute la touche H
    }

    // Créer la barre de vie
    createLifeBar() {
        const lifeBar = this.scene.add.graphics();
        lifeBar.fillStyle(0x00ff00, 1); // Couleur verte
        lifeBar.fillRect(this.player.x - 25, this.player.y - 30, 50, 10); // Position initiale de la barre de vie
        return lifeBar;
    }

    // Mise à jour de la barre de vie en fonction des HP restants
    updateLifeBar() {
        this.lifeBar.clear();
        this.lifeBar.fillStyle(0x00ff00, 1);
        this.lifeBar.fillRect(this.player.x - 25, this.player.y - 30, (this.vies / 100) * 50, 10);
    }

    // Créer la barre d'XP
    createXpBar() {
        const xpBar = this.scene.add.graphics();
        xpBar.fillStyle(0x00ff00, 1);
        xpBar.setScrollFactor(0);
        xpBar.setPosition(16, 112);
        return xpBar;
    }

    // Mise à jour de la barre d'XP
    updateXpBar() {
        this.xpBar.clear();
        const barreWidth = 200;
        const barreHeight = 20;
        const barreRemplie = (this.xp / this.xpMax) * barreWidth;

        // Barre verte (XP actuelle)
        this.xpBar.fillStyle(0x00ff00, 1);
        this.xpBar.fillRect(0, 0, barreRemplie, barreHeight);

        // Barre grise (XP restante)
        this.xpBar.fillStyle(0x888888, 1);
        this.xpBar.fillRect(barreRemplie, 0, barreWidth - barreRemplie, barreHeight);
    }

    // Ajouter de l'XP
    addXp(amount) {
        this.xp += amount * this.xpBoost; // Appliquer le boost d'XP
        this.updateXpBar();

        if (this.xp >= this.xpMax) {
            this.levelUp();
        }
    }

    // Monter de niveau
    levelUp() {
        this.level++;
        this.xp = this.xp - this.xpMax; // Réinitialiser l'XP mais conserver l'excédent
        this.xpMax += 100; // Augmenter la barre d'XP pour le niveau suivant
        console.log(`Niveau supérieur! Niveau actuel: ${this.level}, XP Max: ${this.xpMax}`);

        // Mettre en pause la scène principale et lancer PowerUpScene
        this.scene.launch('PowerUpScene', {
            player: this,
            usedPowerUps: this.scene.usedPowerUps
        });
        this.scene.pause();
    }

    // Réduire la vie du joueur
    loseLife(amount) {
        this.vies -= amount;
        this.updateLifeBar(); // Mettre à jour la barre de vie
        console.log(`Vie restante: ${this.vies}`);
        if (this.vies <= 0) {
            this.scene.gameOver();
        }
    }

    // Appliquer le multiplicateur de vélocité à la vitesse de base
    applyVelocity(speed) {
        return speed * this.velocityMultiplier; // Applique le multiplicateur de vitesse
    }

    // Crée et tire un projectile
    spawnProjectile(targetX, targetY) {
        const projectile = this.bulletGroup.create(this.player.x, this.player.y, "bomb");
        projectile.setActive(true);
        projectile.setVisible(true);

        const direction = new Phaser.Math.Vector2(targetX - this.player.x, targetY - this.player.y).normalize();
        const speed = 300;

        projectile.setVelocity(direction.x * speed, direction.y * speed);
        projectile.damage = this.projectileDamage * this.damageMultiplier;

        // Détruire le projectile après un certain temps ou s'il sort de l'écran
        this.scene.time.delayedCall(2000, () => {
            projectile.destroy();
        });
    }

    // Méthode pour tirer sur l'ennemi le plus proche
    shootAtClosestEnemy() {
        const enemies = this.scene.enemyManager.groupe_ennemis.getChildren();
        const playerX = this.player.x;
        const playerY = this.player.y;

        let closestEnemy = null;
        let minDistance = Number.MAX_VALUE;

        // Chercher l'ennemi le plus proche
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const distance = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        }

        // Si un ennemi est trouvé et qu'il est à portée, tirer dessus
        if (closestEnemy && minDistance <= 300) {
            const now = this.scene.time.now;
            if (now - this.lastShotTime > this.shootDelay) {
                this.spawnProjectile(closestEnemy.x, closestEnemy.y);
                this.lastShotTime = now;
            }
        }
    }

    // Activation de l'orbe
    activateOrbe() {
        this.orbeActive = true;
        this.orbe = this.scene.physics.add.sprite(this.player.x, this.player.y, 'orbe');
        this.orbe.play('spin_orbe');
        this.orbe.setDepth(1);
        this.orbe.setCircle(16);
        this.scene.physics.add.overlap(this.orbe, this.scene.enemyManager.groupe_ennemis, this.hitEnemyWithOrbe, null, this);
    }

    // Désactivation de l'orbe
    disableOrbe() {
        if (this.orbe) {
            this.orbe.destroy();
        }
        this.orbeActive = false;
    }

    // Mise à jour de la position de l'orbe
    updateOrbePosition() {
        if (this.orbe) {
            const angle = this.scene.time.now / 1000; // Angle basé sur le temps
            const radius = 100; // Distance entre l'orbe et le joueur
            this.orbe.x = this.player.x + Math.cos(angle) * radius;
            this.orbe.y = this.player.y + Math.sin(angle) * radius;
        }
    }

    // Gérer les dégâts infligés par l'orbe
    hitEnemyWithOrbe(orbe, enemy) {
        this.scene.enemyManager.recevoirDegats(50, enemy); // Inflige 50 points de dégâts à l'ennemi
    }

    // Mise à jour du joueur
    update() {
        const baseSpeed = 250; // Vitesse de base du joueur
        const speed = this.applyVelocity(baseSpeed); // Applique le multiplicateur de vitesse

        const cursors = this.clavier;

        // Réinitialiser la vitesse
        this.player.setVelocity(0);

        // Déplacement horizontal
        if (cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.flipX = true; // Inverser l'image vers la gauche
            this.player.anims.play('right', true); // Utiliser l'animation de droite
            this.lastDirection = 'left'; // Sauvegarder la dernière direction
        } else if (cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.flipX = false; // Revenir à la normale pour la droite
            this.player.anims.play('right', true);
            this.lastDirection = 'right';
        } else if (cursors.up.isDown) {
            this.player.setVelocityY(-speed); // Déplacer vers le haut
            this.player.anims.play('right', true);
            this.player.flipX = (this.lastDirection === 'left'); // Garder le flip selon la dernière direction
        } else if (cursors.down.isDown) {
            this.player.setVelocityY(speed);
            this.player.anims.play('right', true);
            this.player.flipX = (this.lastDirection === 'left');
        } else {
            // Quand le joueur est immobile, utiliser la dernière frame d'animation
            this.player.anims.play('turn');
            this.player.setFrame(7);
        }

        // Gestion de l'activation de l'orbe
        if (Phaser.Input.Keyboard.JustDown(this.keyH)) {
            if (this.orbeActive) {
                this.disableOrbe();
            } else {
                this.activateOrbe();
            }
        }

        // Mise à jour de la position de l'orbe si activée
        if (this.orbeActive) {
            this.updateOrbePosition();
        }

        // Tirer automatiquement sur l'ennemi le plus proche si à portée
        this.shootAtClosestEnemy();

        // Mettre à jour la barre de vie en fonction de la position du joueur
        this.updateLifeBar();

        // Mettre à jour la barre d'XP
        this.updateXpBar();
    }
}
