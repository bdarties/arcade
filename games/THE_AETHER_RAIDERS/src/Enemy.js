export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = "img_enemy", damage = 1, target, health, xpValue, goldValue) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.body.allowGravity = false;

    this.damage = damage;
    this.health = health;
    this.xpValue = xpValue;
    this.goldValue = goldValue;
    this.myScene = scene;

    this.projectiles = scene.physics.add.group();
    this.scene = scene;
    this.target = target; // le joueur

    this.detectionRadius = 200; // rayon fixe pour tous les ennemis
    this.isChasing = false;

    // collisions projectiles ↔ plateformes
    scene.physics.add.collider(this.projectiles, scene.groupe_plateformes, proj => proj.destroy());

    // collisions projectiles ↔ joueur
    if (this.target) {
      scene.physics.add.overlap(
        this.projectiles,
        this.target,
        (a, b) => {
          const isAProj = a?.getData && a.getData('enemyProjectile') === true;
          const isBProj = b?.getData && b.getData('enemyProjectile') === true;
          const projectile = isAProj ? a : (isBProj ? b : null);

          if (projectile && projectile.destroy) projectile.destroy();

          if (this.scene && this.scene.invulnerable) return;

          if (this.scene && this.scene.perdreVie) this.scene.perdreVie(this.damage);
        },
        undefined,
        this
      );
    }
  }

  // --- Patrol aléatoire ---
  startPatrol(minX, maxX, speed = 60) {
    this.patrol = {
      minX,
      maxX,
      speed,
      dir: Math.random() < 0.5 ? -1 : 1,
    };

    this.patrolEvent = this.scene.time.addEvent({
      delay: Phaser.Math.Between(900, 1800),
      loop: true,
      callback: () => {
        if (!this.active) return;
        const choice = Phaser.Math.Between(0, 2);
        if (choice === 0) {
          this.setVelocityX(0);
        } else if (choice === 1) {
          this.setVelocityX(this.patrol.dir * this.patrol.speed);
        } else {
          this.patrol.dir *= -1;
          this.setVelocityX(this.patrol.dir * this.patrol.speed);
        }
        this.patrolEvent.delay = Phaser.Math.Between(900, 1800);
      }
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    // --- Patrol ---
    if (this.patrol) {
      if (this.x <= this.patrol.minX) {
        this.x = this.patrol.minX;
        this.patrol.dir = 1;
        this.setVelocityX(this.patrol.speed);
      } else if (this.x >= this.patrol.maxX) {
        this.x = this.patrol.maxX;
        this.patrol.dir = -1;
        this.setVelocityX(-this.patrol.speed);
      }
    }

    // --- Détection du joueur ---
    if (this.target && this.target.active) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
      this.isChasing = dist <= this.detectionRadius;
    }
  }

  destroy(fromScene) {
    if (this.patrolEvent) {
      this.patrolEvent.remove(false);
      this.patrolEvent = undefined;
    }
    super.destroy(fromScene);
  }

  // --- Gestion des dégâts et récompenses ---
  takeDamage(amount = 1, killer = null) {
    if (this.scene.invulnerable) return;
    
    this.health -= amount;

    // texte "-amount"
    const dmgText = this.scene.add.text(this.x, this.y - 20, `-${amount}`, {
        fontSize: "18px",
        fill: "#ff0000",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
        targets: dmgText,
        y: dmgText.y - 30,
        alpha: 0,
        duration: 600,
        ease: "Power1",
        onComplete: () => dmgText.destroy()
    });

    if (this.health <= 0) {
        this.onDeath(killer);
    }
}


  onDeath(killer = null) {
    if (!this.active) return;

    // --- XP ---
    const xpGain = this.xpValue || 10;
    if (this.scene.gainXP) {
        this.scene.gainXP(xpGain);  // TOUJOURS
        const xpText = this.scene.add.text(this.x, this.y - 20, `+${xpGain}XP`, {
            fontSize: "12px",
            fill: "#00ff00",
            fontFamily: "Arial"
        }).setOrigin(0.5).setDepth(10);

        this.scene.tweens.add({
            targets: xpText,
            alpha: 0,
            y: xpText.y - 30,
            duration: 800,
            onComplete: () => xpText.destroy()
        });
    }
    if (this.scene.gainMana) {
        this.scene.gainMana(5);}

    // --- Drop gold ---
    this.dropGold();  // TOUJOURS

    // Détruire l'ennemi
    this.destroy();
}


  dropGold() {
    const gold = this.scene.physics.add.sprite(this.x, this.y, "img_gold");
    gold.setScale(0.1);
    gold.setCollideWorldBounds(true);

    gold.body.setSize(300, 300);
    gold.body.setOffset(0, 0);

    this.scene.physics.add.collider(gold, this.scene.platformLayer);

    this.myScene.physics.add.overlap(gold, this.myScene.player, () => {
    if (!gold.active) return;

    gold.destroy();

    this.myScene.events.emit("goldPickup", this.goldValue);
});


}






  attack() {
    // À compléter selon type d'ennemi
  }
}
