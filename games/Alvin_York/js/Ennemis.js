export class Ennemi1 extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
      super(scene, x, y, "ennemi_run");
      this.scene = scene;
      this.scene.add.existing(this);
      this.scene.physics.add.existing(this);
      this.setCollideWorldBounds(true);
      this.body.setSize(36, 48);
      this.body.setOffset(14, 18);
      this.body.setGravityY(0);
      this.vitesse = 120;
      this.zoneDetection = 220;
      this.delaiTir = 1200;
      this.dernierTir = 0;
      this.peutTirer = false;
      this.target = null;
      this.estMort = false;
      // Ajout de l'arme
      this.arme = scene.add.sprite(this.x, this.y, "german_weapons");
      this.arme.setOrigin(0, 0.5);
      this.arme.setDepth(5);
      this.armeLongueur = 39;
      this.anims.create({
        key: "ennemi_run",
        frames: this.anims.generateFrameNumbers("ennemi_run", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: "ennemi_is_dead",
        frames: this.anims.generateFrameNumbers("ennemi_is_dead", { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0
      });
      this.anims.create({
        key: "ennemi_shoot",
        frames: this.anims.generateFrameNumbers("ennemi_shoot", { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0
      });
}

  update() {
    if (this.estMort) return;
    const player = this.scene.player;
    if (!player || !player.active) return;
    // Mettre à jour l'arme
    this.updateArme(player);
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance > this.zoneDetection) {
      this.scene.physics.moveToObject(this, player, this.vitesse);
      this.peutTirer = false;
      this.anims.play("ennemi_run", true);
    } else {
      this.setVelocity(0, 0);
      this.peutTirer = true;
      this.setFlipX(player.x < this.x);
      if (this.scene.time.now - this.dernierTir > this.delaiTir) {
        this.tirer(player);
        this.dernierTir = this.scene.time.now;
      }
    }
  }

  // Ajout de la méthode updateArme
  updateArme(player = null) {
    // Positionner l'arme un peu en dessous du centre de l'ennemi
    this.arme.x = this.body.center.x -5;
    this.arme.y = this.body.center.y + 5; // +10 pixels vers le bas

    if (player && player.body) {
      // Orienter l'arme vers le joueur
      let angle = Phaser.Math.Angle.Between(
        this.arme.x,
        this.arme.y,
        player.body.center.x,
        player.body.center.y
      );
      this.arme.rotation = angle;
      // Flip selon la direction
      if (player.body.center.x < this.body.center.x) {
        this.setFlipX(true);
      } else {
        this.setFlipX(false);
      }
      // FlipY de l'arme selon l'angle
      if (angle > Math.PI/2 || angle < -Math.PI/2) {
        this.arme.setFlipY(true);
      } else {
        this.arme.setFlipY(false);
      }
    } else {
      // Orientation simple
      this.arme.rotation = 0;
      this.arme.setFlipY(false);
    }
  }

  tirer(player) {
    if (this.estMort) return;
    try {
      if (!this.anims || !this.anims.play) {
        console.warn('Animation system non disponible sur Ennemi1');
        return;
      }
      if (!this.scene.textures.exists('ennemi_shoot')) {
        console.warn('Le spritesheet ennemi_shoot n\'est pas chargé');
      }
      this.anims.play("ennemi_shoot", true);
      // Modifie ici la vitesse de la balle ennemie
      const vitesseBalleEnnemi = 140; // <--- Change cette valeur pour ajuster la vitesse
      if (!this.scene.physics) {
        console.error('Physics system non disponible');
        return;
      }
      let balle = this.scene.physics.add.sprite(this.x, this.y, "img_balle");
      if (!balle) {
        console.error('La balle ennemie n\'a pas pu être créée');
        return;
      }
      balle.setDepth(2);
      if (!this.scene.groupe_balles_ennemi) {
        console.error('Groupe de balles ennemi non défini');
        return;
      }
      this.scene.groupe_balles_ennemi.add(balle);
      if (!player) {
        console.error('Player non défini pour le tir ennemi');
        return;
      }
      this.scene.physics.moveToObject(balle, player, vitesseBalleEnnemi);
      balle.owner = this;
      console.log('Ennemi1 a tiré une balle vers le joueur');
    } catch (err) {
      console.error('Erreur dans Ennemi1.tirer:', err);
    }
  }

  mourir() {
    if (this.estMort) return;
    this.estMort = true;
    this.setVelocity(0, 0);
    this.setTint(0xff0000);
    this.anims.play("ennemi_is_dead");
    this.once('animationcomplete', () => {
      if (this.arme) this.arme.destroy();
      this.destroy();
    });
  }
}

export class Ennemi3 extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "ennemi3_run");
    
    this.scene = scene;
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(36, 48);
    this.body.setOffset(14, 18);

    // CORRECTION: Une seule ligne suffit pour désactiver la gravité
    this.body.setGravityY(0);
    
    this.vitesse = 250;
    this.player = null; // CORRECTION: On récupèrera le player depuis la scène
    this.estMort = false;
    this.cooldownAttaque = 800;
    this.dernierAttaque = 0;
    this.enTrainDAttaquer = false;
    this.zoneAttaque = 60; // Rayon de la hitbox d'attaque

    this.anims.create({
        key: "ennemi3_run", 
        frames: this.anims.generateFrameNumbers("ennemi3_run", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });
  
    this.anims.create({
      key: "ennemi3_is_dead", 
      frames: this.anims.generateFrameNumbers("ennemi3_is_dead", { start: 0, end: 4 }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
        key: "ennemi3_attack", 
        frames: this.anims.generateFrameNumbers("ennemi3_attack", { start: 0, end: 6 }),
        frameRate: 10,
        repeat: 0
    });
  }

  mourir() {
    if (this.estMort) return;
    this.estMort = true;
    this.setVelocity(0, 0);
    this.setTint(0xff0000);
    this.anims.play("ennemi3_is_dead");
    this.once('animationcomplete', () => {
      if (this.arme) this.arme.destroy();
      this.destroy();
    });
  }


  update() {
    if (this.estMort) return;

    // CORRECTION: Récupérer le player depuis la scène
    const player = this.scene.player || this.scene.children.getByName('player');
    
    if (player && player.active) {
      // Calculer la distance entre l'ennemi et le joueur
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      
      // Si le joueur est dans la zone d'attaque ET pas en train d'attaquer
      if (distance <= this.zoneAttaque && !this.enTrainDAttaquer) {
        this.attaquer(player);
      } else if (!this.enTrainDAttaquer) {
        // Suit le joueur seulement si pas en train d'attaquer
        this.anims.play("ennemi3_run", true);
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / distance) * this.vitesse;
        const vy = (dy / distance) * this.vitesse;
        this.setVelocity(vx, vy);

        // Flip selon la direction
        if (dx < 0) {
          this.setFlipX(true);
        } else {
          this.setFlipX(false);
        }
      }
    }
  }

  attaquer(player) {
  if (this.estMort) return;
  this.setVelocity(0, 0);
  this.enTrainDAttaquer = true;
  this.anims.play("ennemi3_attack", true);
  
  // Remettre enTrainDAttaquer à false après l'animation
  this.once('animationcomplete', () => {
    this.enTrainDAttaquer = false;
  });
  
  const maintenant = this.scene.time.now;
  if (
    player &&
    player.active &&
    !player.invincible &&
    maintenant - this.dernierAttaque > this.cooldownAttaque
  ) {
    if (typeof player.prendreDegats === "function") {
      player.prendreDegats(1);
    } else if (player.vie !== undefined) {
      player.vie -= 1;
    }
    player.invincible = true;
    this.scene.time.delayedCall(800, () => {
      if (player && player.active) {
        player.invincible = false;
      }
    });
    this.dernierAttaque = maintenant;
  }
  }
}

// class Ennemi4 extends Phaser.Physics.Arcade.Sprite {
//   constructor(scene, x, y) {
//     super(scene, x, y, "ennemi3_run");

//     this.scene = scene;
//     this.scene.add.existing(this);
//     this.scene.physics.add.existing(this);  



//   }
// }