export default class Dragon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'dragon');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setScale(1.5);
    this.body.setSize(48, 48);
    this.body.setOffset(8, 8);
    
    if (this.anims && scene.anims.exists('dragon_idle')) {
      this.anims.play('dragon_idle', true);
    }
    
    // Statistiques du dragon
    this.pv = 25;
    this.vitesse = 60;
    this.detectionRadius = 300; 
    this.attackRange = 250;
    
    this.lastShootTime = 0;
    this.shootCooldown = 2000;
    
    this.randomMoveTimer = 0;
    this.randomMoveDuration = 2000;
    this.currentVelocityX = 0;
    this.currentVelocityY = 0;
    
    this.type = 'dragon';
    
    this.scene = scene;
  }

  prendreDegats(degats) {
    this.pv -= degats;
    
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
        
    if (this.pv <= 0) {
      this.mourir();
    }
  }

  mourir() {
    const scene = this.scene;
    
    this.destroy();
    
    scene.scene.start("victory");
  }

  tirerProjectile() {
    const now = this.scene.time.now;
    
    if (now - this.lastShootTime < this.shootCooldown) {
      return;
    }
    
    this.lastShootTime = now;
    
    const projectile = this.scene.groupeFlechesEnnemis.create(this.x, this.y, 'fireball');
    projectile.setScale(1.2);
    projectile.origine = 'ennemi';
    projectile.ennemiSource = this;
    projectile.degats = 2;
    
    if (projectile.setPipeline) {
      projectile.setPipeline('Light2D');
    }

    let projectileLight = null;
    if (this.scene.lights && this.scene.lights.addLight) {
      projectileLight = this.scene.lights.addLight(
        projectile.x, 
        projectile.y, 
        50,           // Rayon de la lumière
        0xff4400,     // Couleur rouge/orange (plus intense que le joueur)
        0.7           // Intensité
      );

      // Mettre à jour la position de la lumière avec le projectile
      const updateProjectileLight = () => {
        if (projectileLight && projectile && projectile.active) {
          projectileLight.x = projectile.x;
          projectileLight.y = projectile.y;
        }
      };

      // Ajouter l'updater à une liste
      if (!this.scene._dragonProjectileLights) {
        this.scene._dragonProjectileLights = [];
      }
      this.scene._dragonProjectileLights.push({
        light: projectileLight,
        projectile: projectile,
        updater: updateProjectileLight
      });

      // Attacher l'event update si pas encore fait
      if (!this.scene._dragonProjectileLightsUpdateAttached) {
        this.scene.events.on('update', () => {
          // Vérifier que la scène existe toujours
          if (this.scene && this.scene._dragonProjectileLights) {
            this.scene._dragonProjectileLights.forEach(item => {
              if (item.updater) {
                item.updater();
              }
            });
          }
        });
        this.scene._dragonProjectileLightsUpdateAttached = true;
      }

      // Nettoyer la lumière quand le projectile est détruit
      projectile.once('destroy', () => {
        // Vérifier que la scène existe toujours
        if (!this.scene || !this.scene.lights) {
          return;
        }
        
        if (projectileLight && this.scene.lights.removeLight) {
          this.scene.lights.removeLight(projectileLight);
        }
        // Retirer de la liste
        if (this.scene._dragonProjectileLights) {
          this.scene._dragonProjectileLights = this.scene._dragonProjectileLights.filter(item => {
            return item.projectile && item.projectile.active;
          });
        }
      });
    }
    
    // Calculer la direction vers le joueur
    const player = this.scene.player;
    const deltaX = player.x - this.x;
    const deltaY = player.y - this.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 0) {
      const vitesse = 200;
      projectile.setVelocity(
        (deltaX / distance) * vitesse,
        (deltaY / distance) * vitesse
      );
      
      // Rotation du projectile
      const angle = Math.atan2(deltaY, deltaX);
      projectile.setRotation(angle);
    }
    
    // Animation
    if (projectile.anims) {
      projectile.anims.play('fireball_anim', true);
    }
    
    // Détruire après 2 secondes
    this.scene.time.delayedCall(2000, () => {
      if (projectile && projectile.active) {
        // Vérifier que la scène existe toujours
        if (projectileLight && this.scene && this.scene.lights && this.scene.lights.removeLight) {
          this.scene.lights.removeLight(projectileLight);
        }
        projectile.destroy();
      }
    });
    
  }

  mouvementAleatoire() {
    const now = this.scene.time.now;
    
    // Changer de direction périodiquement
    if (now - this.randomMoveTimer > this.randomMoveDuration) {
      this.randomMoveTimer = now;
      
      // Générer une nouvelle direction aléatoire
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.currentVelocityX = Math.cos(angle) * this.vitesse;
      this.currentVelocityY = Math.sin(angle) * this.vitesse;
      
      // 20% de chance de s'arrêter
      if (Math.random() < 0.2) {
        this.currentVelocityX = 0;
        this.currentVelocityY = 0;
      }
    }
    
    // Appliquer la vélocité
    this.setVelocity(this.currentVelocityX, this.currentVelocityY);
    
    // Flip du sprite selon la direction
    if (this.currentVelocityX < 0) {
      this.flipX = true;
    } else if (this.currentVelocityX > 0) {
      this.flipX = false;
    }
  }

  update() {
    // Vérifier que le dragon est toujours actif
    if (!this.active || !this.scene || !this.scene.player) {
      return;
    }
    
    const player = this.scene.player;
    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    
    // Vérifier si le joueur est détecté
    if (distanceToPlayer <= this.detectionRadius) {
      // Le joueur est détecté
      
      // Tir à distance si dans la portée
      if (distanceToPlayer <= this.attackRange) {
        // 2% de chance par frame de tirer
        if (Math.random() < 0.02) {
          this.tirerProjectile();
        }
        // Se déplacer lentement vers le joueur
        const deltaX = player.x - this.x;
        const deltaY = player.y - this.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 0) {
          this.setVelocity(
            (deltaX / distance) * this.vitesse * 0.7,
            (deltaY / distance) * this.vitesse * 0.7
          );
        }
      }
      // Se rapprocher du joueur
      else {
        const deltaX = player.x - this.x;
        const deltaY = player.y - this.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 0) {
          this.setVelocity(
            (deltaX / distance) * this.vitesse,
            (deltaY / distance) * this.vitesse
          );
        }
      }
      
      // Flip du sprite selon la direction du joueur
      if (player.x < this.x) {
        this.flipX = true;
      } else {
        this.flipX = false;
      }
    } else {
      // Mouvement aléatoire si le joueur n'est pas détecté
      this.mouvementAleatoire();
    }
  }
}
