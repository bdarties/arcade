export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "enemy_1_run");

    this.scene = scene;

    // Ajout à la scène et physique
    scene.add.existing(this);
    scene.physics.world.enable(this);


this.setCollideWorldBounds(true);
    this.setDepth(10);

    // Propriétés de déplacement
    this.speed = 80;
    this.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1; // Direction aléatoire au départ
    this.changeDirectionTimer = 0;
    this.changeDirectionDelay = Phaser.Math.Between(2000, 5000); // Change de direction toutes les 2-5 secondes

       // Propriétés de tir
    this.detectionRange = 300; // Distance de détection du joueur
    this.shootCooldown = 1500; // Temps entre chaque tir (en ms)
    this.lastShootTime = 0;
  }

  update(time) {
    // Animer l'ennemi
    this.anims.play("anim_enemy_1_run", true);

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

    // VÉRIFIER LE VIDE (seulement si au sol et qu'on a le calque)
    if (this.body.blocked.down && this.platformLayer) {
      this.verifierLeVide();
    }

    // Changer de direction aléatoirement
    if (time - this.changeDirectionTimer > this.changeDirectionDelay) {
      this.direction *= -1; // Inverser la direction
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }

    // Système de tir
    this.tryShootAtPlayer(time);
  }

   // Vérifier s'il y a du vide devant
  verifierLeVide() {
    // 1. Calculer où regarder devant l'ennemi
    const distanceRegard = 25; // On regarde à 25 pixels devant
    const positionX = this.x + (this.direction * distanceRegard);
    const positionY = this.y + 20; // Un peu en dessous du centre

    // 2. Vérifier s'il y a une tuile à cette position
    const tuile = this.platformLayer.getTileAtWorldXY(positionX, positionY);
    
    // 3. Si pas de tuile = vide détecté !
    if (!tuile) {
      this.direction *= -1; // Faire demi-tour
    }
  }

  tryShootAtPlayer(time) {
    // 1. Vérifier si le groupe de balles existe
    if (!this.scene.grp_balles_ennemis) return;

    // 2. Vérifier si le joueur existe
    const player = this.scene.player;
    if (!player) return;

    // 3. Calculer la distance avec le joueur
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      player.x, player.y
    );

    // 4. Si le joueur est à portée ET que le cooldown est écoulé
    if (distance < this.detectionRange && time - this.lastShootTime > this.shootCooldown) {
      this.shoot(player);
      this.lastShootTime = time;
    }
}

shoot(target) {
    // Créer une balle
    const bullet = this.scene.grp_balles_ennemis.create(this.x, this.y, "bullet2");
    
    if (!bullet) return;

    bullet.setDepth(15);
    bullet.setScale(0.5);
    bullet.body.setAllowGravity(false); // Désactiver la gravité pour la balle

    // Tirer en ligne droite dans la direction où regarde l'ennemi
    const bulletSpeed = 400;
    
    // Si l'ennemi va vers la gauche (direction = -1), la balle va à gauche
    // Si l'ennemi va vers la droite (direction = 1), la balle va à droite
    bullet.setVelocityX(bulletSpeed * this.direction);
    bullet.setVelocityY(0); // Pas de mouvement vertical

    // Rotation de la balle : 0° pour droite, 180° pour gauche
    bullet.rotation = this.direction === 1 ? 0 : Math.PI;

    // Détruire la balle après 3 secondes
    this.scene.time.delayedCall(3000, () => {
      if (bullet && bullet.active) {
        bullet.destroy();
      }
    });
  }
}