export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, default_texture, colliderLayer, mobility_model) {
        super(scene, x, y, default_texture);
        this.scene = scene;
        this.colliderLayer = colliderLayer;
        this.mobility_model = mobility_model;
     
        // ajout de l'ennemi à la scène
        this.scene.add.existing(this);
        

        this.setScale(1.5)

       
    }

    init() { 
        this.initPhysics();
        this.initProperties();
        this.initAnimations();

        this.initiateMobility();
        this.body.setImmovable(true);

    }
    initProperties() {
        this.anim_move_right_string = `enemy_move_right_anim`;
        this.anim_stand_right_string = `enemy_stand_right_anim`;

        // unused
        this.anim_shoot_right_string = `anim_enemy_shoot_right`;
        this.anim_jump_right_string = `anim_enemy_jump_right`;
       
        this.coefDirection = 0; // 1 : droite, -1 : gauche
        this.initialSpeed = 90;
        this.jumpForce = 300;
        this.isShooting = false;
        this.isMoving = false;
        this.isJumping = false;
        this.isBerserk = false;
        this.canFall = false;
        this.invincible = false;
        this.alive = true;
        this.jumpAndMoveForward = false;
        this.projectileDuration = 1200;
        // parametres pour la gestion du mouvement aléatoire (seuil sur 100)
        this.randomMovementThreshold = 10; // 10% de chance de changer de direction
        this.randomStopThreshold = 20; // 20% de chance de s'arrêter
        this.minStopDuration = 1000; // Durée minimale d'arrêt en ms
        this.maxStopDuration = 3000; // Durée maximale d'arrêt en ms
    
        // detection du joueur
        

    }

    setLifePointsAndProperties() {
        switch (this.type) {
            case 1:
                this.lifePoints = 2;
                break;
            case 2:
                this.lifePoints = 3;
                this.projectileSpeed = 300;
                break;
            case 3:
                this.lifePoints = 5;
                break;
            case 4:
                this.lifePoints = 5;
                this.body?.setAllowGravity(false);
                break;
            case 5:
                this.lifePoints = 5;
                this.speed = 0;
                this.setTint("0x0000FF");
                break;
            default:
                this.lifePoints = 1;
        }
    }

    initPhysics() {
        this.setCollideWorldBounds(true);       
        this.setBounce(0.1);
    }

    initAnimations() {

        // Placeholder for animation setup if needed
    }

    

    initLookAroundBehavior() {
        this.scene.time.addEvent({
            delay: Phaser.Math.Between(1000, 3000),
            callback: () => (this.flipX = !this.flipX),
            callbackScope: this,
            loop: true,
        });
    }

    randomDirection() {
        this.coefDirection = Math.random() < 0.5 ? -1 : 1;
    }

    changeDirection() {
        this.coefDirection *= -1;
    }

    stopMoving() {
        this.coefDirection = 0;
        this.isMoving = false;
        this.body.setVelocityX(0);
    } 
    
    initiateMobility() {    
        console.log("Mobility model de l'ennemi : "+this.mobility_model);

        switch (this.mobility_model) {
            case 1:
            case 2:
            case 3 :
                this.isMoving = true;
                this.randomDirection();
                break;
            case 4 :
            case 5 :
            case 6 :
            case 7 :
                this.isMoving = true;
                this.randomDirection();
                this.mobilityTimer = this.scene.time.addEvent({
                    delay: 1000, // Toutes les secondes
                    callback: this.handleRandomBehavior,
                    callbackScope: this,
                    loop: true,
                });

                break;
            default :
            this.isMoving = false;

        }
    }

    update() {
        if (!this.alive) return;

        if (this.isMoving) {
            switch (this.mobility_model) {
                case 1:
                    this.update_mobility_model_1();
                    break;
                case 2:
                    this.update_mobility_model_2();
                    break;
                case 3:
                    this.update_mobility_model_3();
                    break;
                case 4:
                    this.update_mobility_model_4();
                    break;
                case 5:
                    this.update_mobility_model_5(); 
                    break;
                case 6:
                    this.update_mobility_model_6();
                    break;
                case 7:
                    this.update_mobility_model_7();
                    break;
                default:
                    console.warn(`Modèle de mobilité inconnu : ${this.mobility_model}`);
            }
        }
        this.playAnimations();
    }

    update_mobility_model_1() {
    if ((this.body.blocked.left || this.body.blocked.right) && this.body.blocked.down) {
        this.stopMoving();
        return;
    }
        this.setVelocityX(this.initialSpeed * this.coefDirection);
    }

    update_mobility_model_2() {

    // si l'ennemi est bloqué à gauche ou à droite, il change de direction
    if (this.body.blocked.left || this.body.blocked.right) {
        this.changeDirection();
    }
        this.setVelocityX(this.initialSpeed * this.coefDirection);
    }
    
    update_mobility_model_3() {
        // Si l'ennemi est bloqué à gauche ou à droite, il change de direction
        if (this.body.blocked.left || this.body.blocked.right) {
            this.changeDirection();
        }

        // Vérifie si l'ennemi est sur le rebord d'une tuile
        const isOnEdge = this.checkIfOnEdge();
        if (isOnEdge) {
            this.changeDirection(); // Change de direction pour éviter de tomber
        }

        // Applique la vitesse en fonction de la direction
        this.setVelocityX(this.initialSpeed * this.coefDirection);
    }

    update_mobility_model_4() {
    // Si l'ennemi est bloqué à gauche ou à droite, il change de direction
    if (this.body.blocked.left || this.body.blocked.right) {
        this.changeDirection();
    }

    // Vérifie si l'ennemi est sur le rebord d'une tuile
    const isOnEdge = this.checkIfOnEdge();
    if (isOnEdge) {
        this.changeDirection(); // Change de direction pour éviter de tomber
    }

    // Applique la vitesse en fonction de la direction
    this.setVelocityX(this.initialSpeed * this.coefDirection);
    }

  update_mobility_model_5() {
    const player = this.scene.player;

    // Vérifie si le joueur est proche et visible
    const isPlayerVisible = this.isPlayerVisible(player);

    if (isPlayerVisible) {
        this.isBerserk = true;
        console.log("player visible!");
    }
    else {
               
        if (this.isBerserk) {
        
        // timer pour désactiver le mode berserk après 3 secondes sans voir le joueur

        this.berserkTimer = this.scene.time.delayedCall(3000, () => {
         

            this.isBerserk = false;
        });
        }
    }
    if (this.isBerserk) {
        // Mode furie : l'ennemi fonce vers le joueur
        this.setTint("0xD000D0"); // Change la couleur pour indiquer le mode furie
        this.speedMultiplier = 1.5; // Augmente la vitesse de 50%
        this.coefDirection = this.x < player.x ? 1 : -1; // Fonce vers le joueur
        this.setVelocityX(this.initialSpeed * this.speedMultiplier * this.coefDirection);
    } else {
        // Retour au comportement normal (modèle 4)
        this.isBerserk = false;
        this.clearTint(); 
        this.speedMultiplier = 1;

        // Si l'ennemi est bloqué à gauche ou à droite, il change de direction
        if (this.body.blocked.left || this.body.blocked.right) {
            this.changeDirection();
        }

        // Vérifie si l'ennemi est sur le rebord d'une tuile
        const isOnEdge = this.checkIfOnEdge();
        if (isOnEdge) {
            this.changeDirection(); // Change de direction pour éviter de tomber
        }

        // Applique la vitesse en fonction de la direction
        this.setVelocityX(this.initialSpeed * this.coefDirection);
    }



}

  update_mobility_model_6() {
    const player = this.scene.player;

    // Vérifie si le joueur est proche et visible
    const isPlayerVisible = this.isPlayerVisible(player);
    if (isPlayerVisible) {
        this.isBerserk = true;
    }
    else {
        if (this.isBerserk) {
        // timer pour désactiver le mode berserk après 3 secondes sans voir le joueur
        this.berserkTimer = this.scene.time.delayedCall(3000, () => {
            this.isBerserk = false;
        });
        }
    }
    if (this.isBerserk) {
         this.mobilityTimer.paused = true;
        // Mode furie : l'ennemi fonce vers le joueur
        this.setTint("0xD000D0"); // Change la couleur pour indiquer le mode furie
        this.speedMultiplier = 1.5; // Augmente la vitesse de 50%
        this.coefDirection = this.x < player.x ? 1 : -1; // Fonce vers le joueur
        this.setVelocityX(this.initialSpeed * this.speedMultiplier * this.coefDirection);
        if (this.body.blocked.left || this.body.blocked.right) {
            if (this.y > player.y ) {
                if (this.jumpAndMoveForward == false) this.jumpAndMoveForward = true;
                this.jumpWithDirection();
            }
        }
    } else {
        // Retour au comportement normal (modèle 4)
        this.isBerserk = false;
        this.clearTint(); 
        this.mobilityTimer.paused = false;
        this.speedMultiplier = 1;

        // Si l'ennemi est bloqué à gauche ou à droite, il change de direction
        if (this.body.blocked.left || this.body.blocked.right) {
            this.changeDirection();
        }
        
        // Vérifie si l'ennemi est sur le rebord d'une tuile
        const isOnEdge = this.checkIfOnEdge();
        if (isOnEdge) {
            this.changeDirection(); // Change de direction pour éviter de tomber
        }

        // Applique la vitesse en fonction de la direction
        this.setVelocityX(this.initialSpeed * this.coefDirection);
    }
}

 update_mobility_model_7() {
    const player = this.scene.player;

     this.checkForIncomingProjectile();

    // Vérifie si le joueur est proche et visible
    const isPlayerVisible = this.isPlayerVisible(player);
    if (isPlayerVisible) {
        this.isBerserk = true;
    }
    else {
        if (this.isBerserk) {
        // timer pour désactiver le mode berserk après 3 secondes sans voir le joueur
        this.berserkTimer = this.scene.time.delayedCall(3000, () => {
            this.isBerserk = false;
        });
        }
    }
    if (this.isBerserk) {
         this.mobilityTimer.paused = true;
        // Mode furie : l'ennemi fonce vers le joueur
        this.setTint("0xD000D0"); // Change la couleur pour indiquer le mode furie
        this.speedMultiplier = 1.5; // Augmente la vitesse de 50%
        this.coefDirection = this.x < player.x ? 1 : -1; // Fonce vers le joueur
        this.setVelocityX(this.initialSpeed * this.speedMultiplier * this.coefDirection);
        if (this.body.blocked.left || this.body.blocked.right) {
            if (this.y > player.y ) {
                if (this.jumpAndMoveForward == false) this.jumpAndMoveForward = true;
                this.jumpWithDirection();
            }
        }
    } else {
        // Retour au comportement normal (modèle 4)
        this.isBerserk = false;
        this.clearTint(); 
        this.mobilityTimer.paused = false;
        this.speedMultiplier = 1;

        // Si l'ennemi est bloqué à gauche ou à droite, il change de direction
        if (this.body.blocked.left || this.body.blocked.right) {
            this.changeDirection();
        }
        
        // Vérifie si l'ennemi est sur le rebord d'une tuile
        const isOnEdge = this.checkIfOnEdge();
        if (isOnEdge) {
            this.changeDirection(); // Change de direction pour éviter de tomber
        }

        // Applique la vitesse en fonction de la direction
        this.setVelocityX(this.initialSpeed * this.coefDirection);
    }
}



    playAnimations() {
        if (!this.isMoving) {
            this.anims.play(this.anim_stand_right_string, true);
        } else {
            if (this.coefDirection === 1) {
                this.flipX = false;
            } else {
                this.flipX = true;
            }
            this.anims.play(this.anim_move_right_string, true);
        }
    }

    fireBullet() {
        if (
            (this.scene.player.x < this.x && this.direction === "left") ||
            (this.scene.player.x > this.x && this.direction === "right")
        ) {
            const projectile = this.scene.physics.add.sprite(this.x, this.y, "bullet");
            this.scene.groupe_projectiles_ennemis.add(projectile);
            projectile.body.allowGravity = false;
            projectile.setVelocityX(this.projectileSpeed);
            projectile.setDepth(200);

            if (this.flipX) {
                projectile.flipX = true;
                projectile.setVelocityX(-this.projectileSpeed);
            }

            this.scene.time.delayedCall(this.projectileDuration, () => projectile.destroy());
            this.timerShoot.delay = Phaser.Math.Between(1000, 3000);
        }
    }

    decreaseHealthPoints() {
        this.lifePoints--;
        if (this.lifePoints === 0) {
            if (this.type === 2) {
                this.timerShoot.remove();
            }
            this.destroy();
        }
    }

    setInvincible() {
        this.invincible = true;
        this.setTint("0x00FF00");

        this.blinkAnimation = this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 150,
            ease: "Linear",
            repeat: -1,
            yoyo: true,
        });

        this.scene.time.delayedCall(1500, () => {
            this.invincible = false;
            this.clearTint();
            this.alpha = 1;
            this.blinkAnimation.stop();
        });
    }

    isInvincible() {
        return this.invincible;
    }

    checkIfOnEdge() {
        // Récupère les coordonnées du bas-gauche et du bas-droite de l'ennemi
        const bottomLeft = this.getBottomLeft();
        const bottomRight = this.getBottomRight();

        // Vérifie si le bloc sous le pied gauche est vide
        const leftTile = this.colliderLayer.getTileAtWorldXY(bottomLeft.x, bottomLeft.y + 10);
        if (!leftTile && this.coefDirection === -1) {
            return true; // L'ennemi risque de tomber à gauche
        }

        // Vérifie si le bloc sous le pied droit est vide
        const rightTile = this.colliderLayer.getTileAtWorldXY(bottomRight.x, bottomRight.y + 10);
        if (!rightTile && this.coefDirection === 1) {
            return true; // L'ennemi risque de tomber à droite
        }

        return false; // L'ennemi est en sécurité
    }

    handleRandomBehavior() {
    // Tirage aléatoire pour stopper ou changer de direction
    const randomValue = Phaser.Math.Between(1, 100);

    if (randomValue <= this.randomMovementThreshold) {
        this.changeDirection(); // Change de direction
    } else if (randomValue <= this.randomStopThreshold) {
        this.stopTemporarily(); // S'arrête temporairement
    }
}

stopTemporarily() {
    // Arrête le mouvement
    console.log("stop temporarily");
    this.stopMoving();

    // pause le timer initial
    if (this.mobilityTimer) {
        this.mobilityTimer.paused = true;
    }

    // Durée aléatoire de l'arrêt
    const stopDuration = Phaser.Math.Between(this.minStopDuration, this.maxStopDuration);

    // Redémarre après la durée aléatoire
    this.scene.time.delayedCall(stopDuration, () => {
        this.randomDirection(); // Choisit une direction aléatoire
        this.isMoving = true;

        // Redémarre le timer initial
         if (this.mobilityTimer) this.mobilityTimer.paused = false; 
    });
}


isPlayerVisible(player) {
    //vérifie si l'ennemi regarde vers le joueur
    if (this.coefDirection === 1 && player.x < this.x) {
        return false; // Regarde à droite, joueur à gauche
    }
    if (this.coefDirection === -1 && player.x > this.x) {
        return false; // Regarde à gauche, joueur à droite
    }
    // Vérifie si le joueur est à la même hauteur (avec une tolérance de 50 pixels)
    const isSameHeight = Math.abs(this.y - player.y) <= 50;

    // Vérifie si le joueur est à une distance horizontale inférieure à 150 pixels
    const isCloseEnough = Math.abs(this.x - player.x) <= 250;

    return isSameHeight && isCloseEnough;
}



jumpWithDirection() {
    if (this.jumpAndMoveForward) {
        this.setVelocityX(this.initialSpeed * this.coefDirection);
        this.setVelocityY(-this.jumpForce);
    }
    // ajout d'un timer pour désactiver jumpAndMoveForward apres 1 seconde
     this.scene.time.delayedCall(1000, () => {
        this.jumpAndMoveForward = false;
    });

}

removeTimers() {
    if (this.timerShoot) {
        this.timerShoot.remove();
        this.timerShoot = null;
    }
    if (this.mobilityTimer) {
        this.mobilityTimer.remove();
        this.mobilityTimer = null;
    }
    if (this.berserkTimer) {
        this.berserkTimer.remove();
        this.berserkTimer = null;
    }
}

checkForIncomingProjectile() {
    const projectiles = this.scene.groupe_projectiles.getChildren(); // Récupère toutes les balles tirées par le joueur

    for (const projectile of projectiles) {
        console.log("projectile toruve");
        // Vérifie si la balle est dans la même direction que l'ennemi
        const isProjectileComing = this.isProjectileComingTowardsEnemy(projectile);
        console.log("isProjectileComing: "+isProjectileComing);
        // Vérifie si la balle est à moins de 300 pixels
        const distanceToProjectile = Phaser.Math.Distance.Between(this.x, this.y, projectile.x, projectile.y);
        if (isProjectileComing && distanceToProjectile <= 300) {
            this.avoidProjectile(); // L'ennemi saute pour éviter la balle
            break; // Une seule balle suffit pour déclencher l'évitement
        }
    }
}

isProjectileComingTowardsEnemy(projectile) {
    // Vérifie si la balle est dans la même direction que l'ennemi
    if (this.coefDirection === 1 && projectile.body.velocity.x < 0 && projectile.x > this.x) {
        return true; // L'ennemi regarde à droite, et la balle vient de la droite
    }
    if (this.coefDirection === -1 && projectile.body.velocity.x > 0 && projectile.x < this.x) {
        return true; // L'ennemi regarde à gauche, et la balle vient de la gauche
    }
    return false;
}


avoidProjectile() {
    if (this.isJumping) return; // Si l'ennemi est déjà en train de sauter, ne rien faire

    console.log("L'ennemi saute pour éviter une balle !");
    this.stopMoving(); // Arrête le déplacement
    this.setVelocityY(-this.jumpForce); // Fait sauter l'ennemi
    this.isJumping = true;

    // Redémarre le déplacement après un court délai
    this.scene.time.delayedCall(1000, () => {
        this.isJumping = false;
        this.isMoving = true;
        this.setVelocityX(this.initialSpeed * this.coefDirection); // Reprend le déplacement
    });
}
}
