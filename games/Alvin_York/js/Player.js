export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'img_player_idle');

    this.scene = scene;
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(36, 48);
    this.body.setOffset(14, 18);

    this.setBounce(0);           // Pas de rebond
    this.setFriction(1, 1);      // Friction maximale (si Arcade supporte)
    this.body.setAllowGravity(false);
    // CORRECTION: Désactiver la gravité pour éviter les micro-mouvements
    this.body.setGravityY(0);

    this.direction = "right";
    this.dernierTir = 0;
    this.cooldownTir = 500;

    // Arme
    this.arme = scene.add.sprite(this.x, this.y, "weapons");
    this.arme.setOrigin(0, 0.5);
    this.arme.setDepth(5);
    this.armeLongueur = 39;

    // Hitbox de tir - CORRECTION: utiliser un sprite au lieu d'une image physics
    this.hitbox = scene.add.graphics();
    this.hitbox.setDepth(10);
    this.rayonHitbox = 150;

    // Animations
    this.anims.create({
      key: "anim_run",
      frames: this.anims.generateFrameNumbers("img_player_run", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_idle",
      frames: this.anims.generateFrameNumbers("img_player_idle", { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "anim_player_dead",
      frames: this.anims.generateFrameNumbers("img_player_dead", { start: 0, end: 4 }),
      frameRate: 7,
      repeat: 0
    });
  }

  move(clavier) {
    let enMouvement = false;

    // Déplacements
    if (clavier.right.isDown) {
      this.setVelocityX(225);
      this.anims.play("anim_run", true);
      this.direction = "right";
      this.setFlipX(false);
      enMouvement = true;
    } else if (clavier.left.isDown) {
      this.setVelocityX(-225);
      this.anims.play("anim_run", true);
      this.direction = "left";
      this.setFlipX(true);
      enMouvement = true;
    } else {
      this.setVelocityX(0);
    }

    if (clavier.up.isDown) {
      this.setVelocityY(-225);
      enMouvement = true;
    } else if (clavier.down.isDown) {
      this.setVelocityY(225);
      enMouvement = true;
    } else {
      this.setVelocityY(0);
    }

    return enMouvement;
  }

  updateArme(ennemiCible = null) {
    // Positionner l'arme un peu en dessous du centre du joueur
    this.arme.x = this.body.center.x -5;
    this.arme.y = this.body.center.y + 5; // +10 pixels vers le bas

    if (ennemiCible && ennemiCible.body) {
      // CORRECTION: Orienter l'arme vers l'ennemi
      let angle = Phaser.Math.Angle.Between(
        this.arme.x, 
        this.arme.y, 
        ennemiCible.body.center.x, 
        ennemiCible.body.center.y
      );
      this.arme.rotation = angle;
      
      // Déterminer la direction du joueur selon la position de l'ennemi
      if (ennemiCible.body.center.x < this.body.center.x) {
        this.direction = "left";
        this.setFlipX(true);
      } else {
        this.direction = "right";
        this.setFlipX(false);
      }

      // Ajuster le flip de l'arme en fonction de l'angle
      if (angle > Math.PI/2 || angle < -Math.PI/2) {
        this.arme.setFlipY(true);
      } else {
        this.arme.setFlipY(false);
      }
    } else {
      // Orientation simple basée sur la direction du joueur
      if (this.direction === "left") {
        this.arme.rotation = Math.PI;
        this.arme.setFlipY(true);
      } else {
        this.arme.rotation = 0;
        this.arme.setFlipY(false);
      }
    }
  }

  updateHitbox() {
    // CORRECTION: Dessiner la hitbox comme un cercle graphique
    this.hitbox.clear();
    // this.hitbox.lineStyle(2, 0xff0000, 0.5);
    // this.hitbox.strokeCircle(this.body.center.x, this.body.center.y, this.rayonHitbox);
  }

  tirer(ennemi) {
    // CORRECTION: Permettre le tir même en mouvement
    if (!ennemi || !ennemi.body) return;

    const maintenant = this.scene.time.now;
    if (maintenant - this.dernierTir < this.cooldownTir) return;

    let vitesse = 600;
    let boutCanonX = this.arme.x + Math.cos(this.arme.rotation) * this.armeLongueur;
    let boutCanonY = this.arme.y + Math.sin(this.arme.rotation) * this.armeLongueur;

    let balle = this.scene.groupe_balles.create(boutCanonX, boutCanonY, "img_balle");
    balle.setCollideWorldBounds(true);
    balle.body.allowGravity = false;

    let angle = Phaser.Math.Angle.Between(
      this.arme.x, 
      this.arme.y, 
      ennemi.body.center.x, 
      ennemi.body.center.y
    );
    balle.setVelocity(Math.cos(angle) * vitesse, Math.sin(angle) * vitesse);

    this.scene.time.delayedCall(1000, () => {
      if (balle && balle.active) balle.destroy();
    });

    this.dernierTir = maintenant;
  }

  // CORRECTION: Méthode pour vérifier si un ennemi est dans la hitbox
  ennemiDansHitbox(ennemis) {
    if (!ennemis || ennemis.length === 0) return null;
    
    for (let ennemi of ennemis) {
      if (!ennemi || !ennemi.active || !ennemi.body) continue;
      
      let distance = Phaser.Math.Distance.Between(
        this.body.center.x, 
        this.body.center.y, 
        ennemi.body.center.x, 
        ennemi.body.center.y
      );
      
      if (distance <= this.rayonHitbox) {
        return ennemi;
      }
    }
    return null;
  }

  mourir() {
    this.setActive(false);
    this.setVisible(false);
    this.arme.setVisible(false);
    this.hitbox.clear();

    // Optionnel : animation de mort si tu en as une
    this.anims.play("anim_player_dead");

    // Affiche "Game Over" à l'écran
    this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      "GAME OVER",
      { fontSize: "64px", color: "#ff0000" }
    ).setOrigin(0.5);

    // Optionnel : arrêter la physique ou relancer la scène
    this.scene.physics.pause();
    this.scene.time.delayedCall(2000, () => { this.scene.scene.restart(); });
  }

  prendreDegats(qte = 1) {
    if (this.invincible) return;
    if (this.vie === undefined) this.vie = 3; // Valeur par défaut si non initialisée
    this.vie -= qte;

    // Optionnel : effet visuel d'invincibilité
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      this.clearTint();
    });

    // Optionnel : vérifier la mort du joueur
    if (this.vie <= 0) {
      this.vie = 0;
      this.mourir();
  
    }
  }
}