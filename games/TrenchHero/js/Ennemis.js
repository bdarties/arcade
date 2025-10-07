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

    this.vie = 100;
    this.vieMax = 100;
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
      frames: this.anims.generateFrameNumbers("ennemi_run", {
        start: 0,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "ennemi_is_dead",
      frames: this.anims.generateFrameNumbers("ennemi_is_dead", {
        start: 0,
        end: 4,
      }),
      frameRate: 10,
      repeat: 0,
    });
    this.anims.create({
      key: "ennemi_shoot",
      frames: this.anims.generateFrameNumbers("ennemi_shoot", {
        start: 0,
        end: 4,
      }),
      frameRate: 7,
      repeat: 0,
    });
  }

  update() {
    if (this.estMort) return;
    const player = this.scene.player;
    if (!player || !player.active) return;
    this.updateArme(player);
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      player.x,
      player.y
    );
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

  prendreDegats(degats) {
    if (this.estMort) return;

    this.vie -= degats;
    if (this.vie < 0) this.vie = 0;

    // Effet visuel de dégâts
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active && !this.estMort) this.clearTint();
    });

    // Vérifier la mort
    if (this.vie <= 0) {
      this.mourir();
    }
  }

  updateArme(player = null) {
    this.arme.x = this.body.center.x - 5;
    this.arme.y = this.body.center.y + 5;

    if (player && player.body) {
      let angle = Phaser.Math.Angle.Between(
        this.arme.x,
        this.arme.y,
        player.body.center.x,
        player.body.center.y
      );
      this.arme.rotation = angle;
      if (player.body.center.x < this.body.center.x) {
        this.setFlipX(true);
      } else {
        this.setFlipX(false);
      }
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        this.arme.setFlipY(true);
      } else {
        this.arme.setFlipY(false);
      }
    } else {
      this.arme.rotation = 0;
      this.arme.setFlipY(false);
    }
  }

  tirer(player) {
    if (this.estMort) return;
    try {
      this.anims.play("ennemi_shoot", true);

      const vitesseBalleEnnemi = 140;
      let balle = this.scene.physics.add.sprite(this.x, this.y, "img_balle");
      balle.setDepth(2);
      this.scene.groupe_balles_ennemi.add(balle);

      let angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

      this.scene.physics.velocityFromRotation(
        angle,
        vitesseBalleEnnemi,
        balle.body.velocity
      );

      let angleEnDegres = Phaser.Math.RadToDeg(angle);
      if (angleEnDegres > 90 && angleEnDegres < 270) {
        balle.setFlipX(true);
      } else {
        balle.setFlipX(false);
      }

      balle.rotation = angle;
      balle.owner = this;
    } catch (err) {
      console.error(err);
    }
  }

  mourir() {
    if (this.estMort) return;
    this.estMort = true;
    this.setVelocity(0, 0);
    this.setTint(0xff0000);

    // AJOUT : Détruire toutes les balles de cet ennemi
    if (this.scene.groupe_balles_ennemi) {
      this.scene.groupe_balles_ennemi.getChildren().forEach(balle => {
        if (balle.owner === this) {
          balle.destroy();
        }
      });
    }

    this.anims.play("ennemi_is_dead");
    this.once("animationcomplete", () => {
      if (this.arme) this.arme.destroy();
      this.destroy();
    });
  }
}

export class Ennemi2 extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "ennemi2_run_right");
    this.scene = scene;
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.body.setSize(36, 48);
    this.body.setOffset(14, 18);
    this.body.setGravityY(0);
    this.vie = 100;
    this.vieMax = 100;
    this.vitesse = 100;
    this.zoneDetection = 180;
    this.delaiTir = 3000;
    this.dernierTir = 0;
    this.peutTirer = false;
    this.estMort = false;
    this.enTrainDeLancer = false; // AJOUT: Flag pour éviter les animations conflictuelles

    // Animations de course
    this.anims.create({
      key: "ennemi2_run_left",
      frames: this.anims.generateFrameNumbers("ennemi2_run_left", {
        start: 0,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "ennemi2_run_right",
      frames: this.anims.generateFrameNumbers("ennemi2_run_right", {
        start: 0,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Animations de mort
    this.anims.create({
      key: "ennemi2_is_dead_left",
      frames: this.anims.generateFrameNumbers("ennemi2_is_dead_left", {
        start: 0,
        end: 4,
      }),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: "ennemi2_is_dead_right",
      frames: this.anims.generateFrameNumbers("ennemi2_is_dead_right", {
        start: 0,
        end: 4,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Animations de lancer
    this.anims.create({
      key: "ennemi2_throw_left",
      frames: this.anims.generateFrameNumbers("ennemi2_throw_left", {
        start: 0,
        end: 6,
      }),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: "ennemi2_throw_right",
      frames: this.anims.generateFrameNumbers("ennemi2_throw_right", {
        start: 0,
        end: 6,
      }),
      frameRate: 10,
      repeat: 0,
    });
  }

  update() {
    if (this.estMort || this.enTrainDeLancer) return; // CORRECTION: Ne rien faire si en train de lancer

    const player = this.scene.player;
    if (!player || !player.active) return;

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      player.x,
      player.y
    );

    if (distance > this.zoneDetection) {
      // Course vers le joueur
      this.scene.physics.moveToObject(this, player, this.vitesse);
      this.peutTirer = false;

      if (player.x < this.x) {
        this.anims.play("ennemi2_run_left", true);
      } else {
        this.anims.play("ennemi2_run_right", true);
      }
    } else {
      // Arrêt et tir
      this.setVelocity(0, 0);
      this.peutTirer = true;

      if (this.scene.time.now - this.dernierTir > this.delaiTir) {
        this.tirer(player);
        this.dernierTir = this.scene.time.now;
      }
    }
  }

  tirer(player) {
    if (this.estMort || this.enTrainDeLancer) return; // CORRECTION: Éviter de lancer plusieurs fois

    this.enTrainDeLancer = true; // CORRECTION: Bloquer l'update pendant le lancer

    // Animation de lancer
    if (player.x < this.x) {
      this.anims.play("ennemi2_throw_left", true);
    } else {
      this.anims.play("ennemi2_throw_right", true);
    }

    // CORRECTION: Attendre la fin de l'animation avant de débloquer
    this.once("animationcomplete", () => {
      this.enTrainDeLancer = false;
    });

    // Création de la grenade
    let grenade = this.scene.physics.add.sprite(this.x, this.y, "img_bombe");
    grenade.setDepth(2);
    this.scene.groupe_balles_ennemi.add(grenade);

    // Calcul du point cible
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const targetX = player.x;
    const targetY = player.y;

    // Point de contrôle pour la courbe
    const controlX = this.x + dx * 0.5;
    const controlY = this.y + dy * 0.5 - 100;

    // Désactiver la physique normale
    grenade.body.setEnable(false);
    grenade.owner = this;

    // Animation de trajectoire courbe
    this.scene.tweens.add({
      targets: grenade,
      x: targetX,
      y: targetY,
      duration: 1000,
      ease: 'Quad.Out',
      onUpdate: (tween) => {
        const t = tween.progress;
        const curveX = (1 - t) * (1 - t) * this.x + 2 * (1 - t) * t * controlX + t * t * targetX;
        const curveY = (1 - t) * (1 - t) * this.y + 2 * (1 - t) * t * controlY + t * t * targetY;
        grenade.x = curveX;
        grenade.y = curveY;
      },
      onComplete: () => {
        const scene = grenade.scene;
        if (scene && scene.time) {
          scene.time.delayedCall(150, () => {
            if (grenade && grenade.active && scene && scene.add) {
              this.exploserGrenade(grenade);
            } else if (grenade && grenade.destroy) {
              grenade.destroy();
            }
          });
        }
      }
    });
  }

  exploserGrenade(grenade) {
    if (!grenade || !grenade.active) return;

    const scene = grenade.scene;
    if (!scene || !scene.add) {
      if (grenade && grenade.destroy) {
        grenade.destroy();
      }
      return;
    }

    const x = grenade.x;
    const y = grenade.y;

    // Créer une zone rouge d'explosion
    const zoneExplosion = scene.add.graphics();
    zoneExplosion.setDepth(3);
    zoneExplosion.fillStyle(0xff0000, 0.7);
    zoneExplosion.fillEllipse(0, 0, 120, 80);
    zoneExplosion.setPosition(x, y);

    // Animation
    zoneExplosion.alpha = 0;
    scene.tweens.add({
      targets: zoneExplosion,
      alpha: 1,
      duration: 100,
      yoyo: true,
      hold: 200,
      onComplete: () => {
        zoneExplosion.destroy();
      }
    });

    // Infliger les dégâts
    try {
      const player = scene?.player;
      if (player && player.active && !player.estMort) {
        const distance = Phaser.Math.Distance.Between(x, y, player.x, player.y);
        if (distance <= 60) {
          if (typeof player.prendreDegats === "function") {
            player.prendreDegats(20);
          }
        }
      }
    } catch (err) {
      console.error("Erreur lors de l'explosion:", err);
    }

    // Détruire la grenade
    scene.time.delayedCall(400, () => {
      if (grenade && grenade.destroy) {
        grenade.destroy();
      }
    });
  }

  prendreDegats(degats) {
    if (this.estMort) return; // CORRECTION: Vérifier si déjà mort

    this.vie -= degats;
    if (this.vie < 0) this.vie = 0;

    // Effet visuel de dégâts
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active && !this.estMort) this.clearTint();
    });

    // Vérifier la mort
    if (this.vie <= 0) {
      this.mourir();
    }
  }

  mourir() {
    if (this.estMort) return;
    this.estMort = true;
    this.setVelocity(0, 0);
    this.setTint(0xff0000);

    // AJOUT : Détruire toutes les grenades de cet ennemi
    if (this.scene.groupe_balles_ennemi) {
      this.scene.groupe_balles_ennemi.getChildren().forEach(grenade => {
        if (grenade.owner === this) {
          // Arrêter les tweens en cours
          this.scene.tweens.killTweensOf(grenade);
          grenade.destroy();
        }
      });
    }

    if (this.flipX) {
      this.anims.play("ennemi2_is_dead_left");
    } else {
      this.anims.play("ennemi2_is_dead_right");
    }

    this.once("animationcomplete", () => {
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

    this.vie = 25;
    this.vieMax = 25;

    this.vitesse = 250;
    this.player = null; // CORRECTION: On récupèrera le player depuis la scène
    this.estMort = false;
    this.cooldownAttaque = 800;
    this.dernierAttaque = 0;
    this.enTrainDAttaquer = false;
    this.zoneAttaque = 60; // Rayon de la hitbox d'attaque

    this.anims.create({
      key: "ennemi3_run",
      frames: this.anims.generateFrameNumbers("ennemi3_run", {
        start: 0,
        end: 7,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "ennemi3_is_dead",
      frames: this.anims.generateFrameNumbers("ennemi3_is_dead", {
        start: 0,
        end: 4,
      }),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: "ennemi3_attack",
      frames: this.anims.generateFrameNumbers("ennemi3_attack", {
        start: 0,
        end: 6,
      }),
      frameRate: 10,
      repeat: 0,
    });
  }

  prendreDegats(degats) {
    if (this.estMort) return;

    this.vie -= degats;
    if (this.vie < 0) this.vie = 0;

    // Effet visuel de dégâts
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active && !this.estMort) this.clearTint();
    });

    // Vérifier la mort
    if (this.vie <= 0) {
      this.mourir();
    }
  }

  mourir() {
    if (this.estMort) return;
    this.estMort = true;
    this.setVelocity(0, 0);
    this.setTint(0xff0000);
    this.anims.play("ennemi3_is_dead");
    this.once("animationcomplete", () => {
      if (this.arme) this.arme.destroy();
      this.destroy();
    });
  }

  update() {
    if (this.estMort) return;

    // CORRECTION: Récupérer le player depuis la scène
    const player = this.scene.player || this.scene.children.getByName("player");

    if (player && player.active) {
      // Calculer la distance entre l'ennemi et le joueur
      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        player.x,
        player.y
      );

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
    this.once("animationcomplete", () => {
      this.enTrainDAttaquer = false;
    });

    const maintenant = this.scene.time.now;
    if (
      player &&
      player.active &&
      !player.invincible &&
      !player.estMort &&
      maintenant - this.dernierAttaque > this.cooldownAttaque
    ) {
      // Infliger 15 dégâts
      if (typeof player.prendreDegats === "function") {
        player.prendreDegats(15);
      }
      this.dernierAttaque = maintenant;
    }
  }
}

export class Ennemi4 extends Phaser.GameObjects.Container {
  constructor(scene, largeurMap, hauteurMap) {
    super(scene, 0, 0);
    this.scene = scene;
    this.scene.add.existing(this);

    // Récupérer la position du joueur
    const playerX = this.scene.player ? this.scene.player.x : largeurMap / 2;
    const playerY = this.scene.player ? this.scene.player.y : hauteurMap / 2;

    // 50% de chance de commencer à gauche ou à droite
    const fromLeft = Math.random() < 0.5;

    if (fromLeft) {
      this.startX = -50;
      this.endX = largeurMap + 50;
    } else {
      this.startX = largeurMap + 50;
      this.endX = -50;
    }

    // Point de départ Y : décalé par rapport au joueur
    const offsetY = (Math.random() - 0.5) * 100; // 50px de variation
    this.startY = Math.max(50, Math.min(hauteurMap - 50, playerY + offsetY));

    // Point d'arrivée : aussi proche du joueur avec variation
    const offsetEndY = (Math.random() - 0.5) * 200;
    this.endY = Math.max(50, Math.min(hauteurMap - 50, playerY + offsetEndY));

    // Paramètres ajustables
    this.distanceEntreZones = 30;
    this.interval = 200;
    this.tailleInitiale = 2;
    this.tailleMax = 30;
    this.dureeAgrandissement = 1000;
    this.decalageAvion = 100;

    // Sprite qui se déplace
    this.sprite = this.scene.add.sprite(this.startX, this.startY, "ennemi4");
    this.sprite.setDepth(5);
    this.sprite.alpha = 0.5;

    if (fromLeft) {
      this.sprite.setFlipX(true);
    } else {
      this.sprite.setFlipX(false);
    }

    // Déplacer le sprite du début à la fin
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.endX,
      y: this.endY,
      duration: 3000,
      ease: "Linear",
      onComplete: () => {
        this.finirTrajectoire();
      },
    });

    // Liste des zones de danger
    this.zonesRouges = [];

    // Timer qui crée les zones rouges régulièrement
    this.timer = this.scene.time.addEvent({
      delay: this.interval,
      callback: this.spawnZoneRouge,
      callbackScope: this,
      loop: true,
    });

    this.progress = 0;
  }

  // ... Le reste du code reste identique (spawnZoneRouge, declencharExplosion, etc.)
  spawnZoneRouge() {
    // Les cercles apparaissent à la position actuelle du sprite (avec décalage derrière)
    const direction = {
      x: this.endX - this.startX,
      y: this.endY - this.startY,
    };
    const length = Math.sqrt(
      direction.x * direction.x + direction.y * direction.y
    );
    const normalized = {
      x: direction.x / length,
      y: direction.y / length,
    };

    // Position derrière l'avion
    const x = this.sprite.x - normalized.x * this.decalageAvion;
    const y = this.sprite.y - normalized.y * this.decalageAvion;

    // Créer un cercle rouge avec graphics
    const cercle = this.scene.add.graphics();
    cercle.setDepth(4); // En dessous du sprite

    // Dessiner le cercle rouge avec peu d'opacité
    cercle.fillStyle(0xff0000, 0.2); // Rouge avec 20% d'opacité
    cercle.fillEllipse(0, 0, this.tailleInitiale * 2.5, this.tailleInitiale);
    cercle.setPosition(x, y);

    this.zonesRouges.push(cercle);

    // Animation : agrandir le cercle et augmenter l'opacité
    this.scene.tweens.add({
      targets: cercle,
      scaleX: this.tailleMax / this.tailleInitiale,
      scaleY: this.tailleMax / this.tailleInitiale,
      alpha: 1, // Opacité à 100%
      duration: this.dureeAgrandissement,
      ease: "Cubic.Out",
      onComplete: () => {
        // Quand le cercle atteint sa taille max : EXPLOSION !
        this.declencharExplosion(x, y, cercle);
      },
    });
  }

  declencharExplosion(x, y, cercle) {
    // Masquer le cercle rouge
    cercle.setVisible(false);

    // Créer l'animation d'explosion
    const explosion = this.scene.add.sprite(x, y, "explosion");
    explosion.setDepth(6); // Au-dessus de tout

    // Créer l'animation "explosion" si elle n'existe pas

    this.scene.anims.create({
      key: "explosion_anim",
      frames: this.scene.anims.generateFrameNumbers("explosion", { start: 0, end: 10, }),
      frameRate: 11,
      repeat: 0,
    });

    // Jouer l'animation
    explosion.anims.play("explosion_anim", true);

    //DÉGÂTS : Vérifier si le joueur est dans la zone
    this.infligerDegats(x, y);

    // Détruire l'explosion après l'animation
    explosion.on("animationcomplete", () => {
      explosion.destroy();
      cercle.destroy();
    });
  }

  infligerDegats(x, y) {
    // Rayon de dégâts = taille max du cercle
    const rayonDegats = this.tailleMax;
    const degats = 25; // Dégâts infligés

    // Vérifier si le joueur est dans la zone
    if (this.scene.player && !this.scene.player.estMort) {
      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        this.scene.player.x,
        this.scene.player.y
      );

      if (distance <= rayonDegats) {
        // Le joueur est touché !
        if (typeof this.scene.player.prendreDegats === "function") {
          this.scene.player.prendreDegats(degats);
        }
      }
    }
  }

  finirTrajectoire() {
    // Stopper le timer
    if (this.timer) {
      this.timer.remove();
    }

    // Détruire le sprite
    if (this.sprite && this.sprite.destroy) {
      this.sprite.destroy();
    }

    // Détruire toutes les zones rouges après un délai
    this.scene.time.delayedCall(this.dureeAgrandissement + 500, () => {
      this.zonesRouges.forEach((zone) => {
        if (zone && zone.destroy) zone.destroy();
      });
      this.zonesRouges = [];

      // Détruire le container
      this.destroy();
    });
  }
}
