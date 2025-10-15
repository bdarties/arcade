export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey);

        // Propriétés du joueur
        this.coefDirection = 1; // 1 : droite, -1 : gauche
        this.isMoving = false;
        this.isShooting = false;
        this.isJumping = false;
        this.remainingJump = 1;
        this.onLadder = false;
        this.invincible = false;

        this.maxSpeed = 350;
        this.jumpHeight = 460;
        this.maxVelocityX = 250;
        this.maxVelocityY = 500;


        this.displayWidth = 48;
        this.displayHeight = 64;

        // Physique du joueur
        scene.add.existing(this);
        scene.physics.world.enable(this);
        this.setCollideWorldBounds(true);
        this.setMaxVelocity(this.maxVelocityX, this.maxVelocityY);
        this.setDragX(this.maxVelocityX * 4);
        this.setDragY(0);
        this.setBounce(0.2);
        this.setDepth(50);
        this.body.setGravityY(300);

        // Configuration des touches
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.fireKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    }

    // === Gestion des animations ===
    /**
     * Met à jour les animations du joueur en fonction de son état.
     */
    updateAnimations() {
        if (this.isJumping) {
            this.anims.play("player_jump_anim", true);
        } else if (this.isMoving) {
            this.anims.play("player_move_right_anim", true);
        } else {
            this.anims.stop();
            this.anims.play("player_stand_right_anim"); // Texture par défaut si immobile
        }
    }

    // === Gestion des mouvements ===
    /**
     * Met à jour les mouvements du joueur.
     */
    updateMovement() {
        // Mise à jour de la direction
        if (this.cursors.right.isDown) {
            this.coefDirection = 1;
            this.flipX = false;
        } else if (this.cursors.left.isDown) {
            this.coefDirection = -1;
            this.flipX = true;
        }

        if (this.cursors.down.isDown) {
            this.wantsToGoThroughPlatform = true;
        }
        else {
            this.wantsToGoThroughPlatform = false;
        }
        // Gestion des déplacements
        if (this.cursors.left.isDown && this.cursors.right.isDown) {
            this.setAccelerationX(0);
            this.isMoving = false;
        } else if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
            this.setAccelerationX(0);
            this.isMoving = false;
        } else {
            this.isMoving = true;
            this.setAccelerationX(this.coefDirection * this.maxSpeed);
        }

        // Gestion du saut
        if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && this.canJump()) {
            this.body.setVelocityY(-this.jumpHeight);
            this.isJumping = true;
            this.remainingJump--;
        }

        // Vérifie si le joueur est au sol pour réinitialiser le saut
        if (this.body.onFloor()) {
            this.isJumping = false;
            this.remainingJump = 1;
        }
    }

    // === Gestion des tirs ===
    /**
     * Gère l'action de tir (corps à corps ou à distance).
     */
    fire() {
        if (this.fireKey.isDown && !this.isShooting) {
            this.isShooting = true;

            // Création du projectile
            const projectile = this.scene.physics.add.sprite(this.x, this.y, 'bullet');
            this.scene.groupe_projectiles.add(projectile);
            projectile.body.onWorldBounds = true;
            projectile.body.allowGravity = false;
            projectile.setDepth(50);

            // Direction du projectile
            if (this.flipX) {
                projectile.setVelocityX(-500);
                projectile.flipX = true;
            } else {
                projectile.setVelocityX(500);
            }

            // Destruction du projectile après un délai
            this.scene.time.delayedCall(1000, () => projectile.destroy());

            // Cooldown pour éviter les tirs continus
            this.scene.time.delayedCall(300, () => {
                this.isShooting = false;
            });
        }
    }

    // === Gestion des capacités spéciales ===
    /**
     * Vérifie si le joueur peut sauter.
     */
    canJump() {
        return this.remainingJump > 0;
    }

    // === Méthode principale de mise à jour ===
    /**
     * Met à jour l'état du joueur (mouvement, tir, animations, etc.).
     */
    update() {
        this.updateMovement();
        this.fire();
        this.updateAnimations();
    }
}

