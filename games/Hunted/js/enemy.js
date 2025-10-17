export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, platformLayer = null) {
    super(scene, x, y, "enemy1_run");

    this.scene = scene;
    this.platformLayer = platformLayer;

    // Ajout à la scène et physique
    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.setScale(1.3);
    this.setCollideWorldBounds(true);
    this.setDepth(10);

    // Propriétés de déplacement
    this.speed = 80;
    this.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    this.changeDirectionTimer = 0;
    this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);

    // Propriétés de tir
    this.detectionRange = 300;
    this.shootCooldown = 2500;
    this.lastShootTime = 0;

    // 🆕 SYSTÈME DE POINTS DE VIE
    this.maxHealth = 3; // 3 PV pour Enemy1
    this.currentHealth = this.maxHealth;
    this.isDead = false;

    // // 🆕 BARRE DE VIE
    // this.createHealthBar();
  }

  // 🆕 CRÉER LA BARRE DE VIE
  createHealthBar() {
    const barWidth = 30;
    const barHeight = 4;
    
    // Fond rouge de la barre
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(0xff0000, 0.8);
    this.healthBarBg.fillRect(0, 0, barWidth, barHeight);
    this.healthBarBg.setDepth(11);
    
    // Barre verte (vie actuelle)
    this.healthBar = this.scene.add.graphics();
    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRect(0, 0, barWidth, barHeight);
    this.healthBar.setDepth(12);
    
    this.updateHealthBarPosition();
  }

  // 🆕 METTRE À JOUR LA POSITION DE LA BARRE
  updateHealthBarPosition() {
    if (this.healthBarBg && this.healthBar) {
      const offsetX = -15; // Centrer la barre
      const offsetY = -25; // Au-dessus de l'ennemi
      
      this.healthBarBg.x = this.x + offsetX;
      this.healthBarBg.y = this.y + offsetY;
      this.healthBar.x = this.x + offsetX;
      this.healthBar.y = this.y + offsetY;
    }
  }

  // 🆕 METTRE À JOUR L'AFFICHAGE DE LA BARRE
  updateHealthBar() {
    if (this.healthBar) {
      this.healthBar.clear();
      this.healthBar.fillStyle(0x00ff00, 1);
      const barWidth = 30;
      const barHeight = 4;
      const healthPercent = this.currentHealth / this.maxHealth;
      this.healthBar.fillRect(0, 0, barWidth * healthPercent, barHeight);
    }
  }

  // 🆕 PRENDRE DES DÉGÂTS
  takeDamage(amount = 1) {
    if (this.isDead) return;

    this.currentHealth -= amount;
    this.updateHealthBar();

    // Effet de clignotement rouge
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    // Vérifier si mort
    if (this.currentHealth <= 0) {
      this.die();
    }
  }

  // MOURIR
  die() {
    this.isDead = true;
    
    // Détruire la barre de vie
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();
    
    // Animation de mort (fade out + chute)
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 50,
      duration: 500,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  getPlayer() {
    return this.scene.player || this.scene.player2 || null;
  }

  update(time) {
    if (this.isDead) return;

    // Mettre à jour la position de la barre de vie
    this.updateHealthBarPosition();

    // Si en train de tirer, on ne bouge pas
    if (this.isShooting) {
      this.setVelocityX(0);
      return;
    }

    // Animer l'ennemi
    this.anims.play("anim_enemy1_run", true);

    // Déplacement
    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction === -1);

    // Inverser si bloqué par un mur
    if (this.body.blocked.right) {
      this.direction = -1;
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }
    if (this.body.blocked.left) {
      this.direction = 1;
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }

    // VÉRIFIER LE VIDE
    if (this.body.blocked.down && this.platformLayer) {
      this.verifierLeVide();
    }

    // Changer de direction aléatoirement
    if (time - this.changeDirectionTimer > this.changeDirectionDelay) {
      this.direction *= -1;
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }

    // Système de tir
    this.tryShootAtPlayer(time);
  }

  verifierLeVide() {
    const distanceRegard = 25;
    const positionX = this.x + (this.direction * distanceRegard);
    const positionY = this.y + 20;
    const tuile = this.platformLayer.getTileAtWorldXY(positionX, positionY);
    
    if (!tuile) {
      this.direction *= -1;
    }
  }

  tryShootAtPlayer(time) {
    if (!this.scene.grp_balles_ennemis) return;
    const player = this.getPlayer();
    if (!player) return;

    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      player.x, player.y
    );

    const playerIsInFront = (this.direction === 1 && player.x > this.x) || 
                            (this.direction === -1 && player.x < this.x);

    if (distance < this.detectionRange && playerIsInFront && time - this.lastShootTime > this.shootCooldown) {
      this.shoot(player);
      this.lastShootTime = time;
    }
  }

  shoot(target) {
    const bullet = this.scene.grp_balles_ennemis.create(this.x, this.y, "bullet3");
    
    if (!bullet) return;

    bullet.setDepth(15);
    bullet.setScale(0.5);
    bullet.body.setAllowGravity(false);

    const bulletSpeed = 300;
    bullet.setVelocityX(bulletSpeed * this.direction);
    bullet.setVelocityY(0);
    bullet.rotation = this.direction === 1 ? 0 : Math.PI;

    this.scene.time.delayedCall(3000, () => {
      if (bullet && bullet.active) {
        bullet.destroy();
      }
    });
  }
}