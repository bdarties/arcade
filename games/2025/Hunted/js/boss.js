import * as fct from "./fonctions.js";

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, platformLayer = null) {
    super(scene, x, y, "boss_walk");

    this.scene = scene;
    this.platformLayer = platformLayer;

    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.setScale(2.1);
    this.setCollideWorldBounds(true);
    this.setDepth(10);
    
    this.body.setAllowGravity(true);

    this.speed = 120;
    this.chargeSpeed = 250;
    this.direction = 1;

    this.detectionRange = 500;
    this.isPlayerDetected = false;
    this.isActive = false;

    this.currentState = "idle";
    this.stateTimer = 0;
    this.stateDuration = 0;

    this.shootRange = 400;
    this.shootCooldown = 3000;
    this.lastShootTime = 0;

    this.meleeRange = 80;
    this.meleeCooldown = 3000;
    this.lastMeleeTime = 0;
    this.isAttacking = false;
    this.attackDuration = 600;

    this.chargeRange = 300;
    this.chargeDuration = 1500;
    this.chargeWarningTime = 800;

    // États pour les dégâts de contact
    this.isDealingMeleeDamage = false;
    this.isDealingChargeDamage = false;
    this.lastDamageTime = 0;
    this.damageCooldown = 3000; // Cooldown entre chaque dégât

    this.maxHealth = 35;
    this.currentHealth = this.maxHealth;
    this.isDead = false;
    this.isInvulnerable = false;

    this.createHealthBar();
    this.createAnimations();
  }

  createHealthBar() {
    const barWidth = 70;
    const barHeight = 6;
    
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(0xff0000, 0.8);
    this.healthBarBg.fillRect(0, 0, barWidth, barHeight);
    this.healthBarBg.setDepth(11);
    
    this.healthBar = this.scene.add.graphics();
    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRect(0, 0, barWidth, barHeight);
    this.healthBar.setDepth(12);
    
    this.updateHealthBarPosition();
  }

  updateHealthBarPosition() {
    if (this.healthBarBg && this.healthBar) {
      const offsetX = -35;
      const offsetY = -60;
      
      this.healthBarBg.x = this.x + offsetX;
      this.healthBarBg.y = this.y + offsetY;
      this.healthBar.x = this.x + offsetX;
      this.healthBar.y = this.y + offsetY;
    }
  }

  updateHealthBar() {
    if (this.healthBar) {
      this.healthBar.clear();
      this.healthBar.fillStyle(0x00ff00, 1);
      const barWidth = 70;
      const barHeight = 6;
      const healthPercent = this.currentHealth / this.maxHealth;
      this.healthBar.fillRect(0, 0, barWidth * healthPercent, barHeight);
    }
  }

  takeDamage(amount = 1) {
    if (this.isDead || this.isInvulnerable) return;

    this.isInvulnerable = true;
    this.scene.time.delayedCall(200, () => {
      this.isInvulnerable = false;
    });

    this.currentHealth -= amount;
    this.updateHealthBar();

    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    if (this.currentHealth <= 0) {
      this.die();
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    
    this.setVelocityX(0);
    this.setVelocityY(0);
    
    this.body.enable = false;
    
    // Désactiver les dégâts
    this.isDealingMeleeDamage = false;
    this.isDealingChargeDamage = false;
    
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();
    
    this.anims.play("anim_boss_death", true);

    this.once('animationcomplete', () => {
      this.anims.stop();
      
      fct.creerTicketVictoire(this.scene, this.x, this.y - 80);
    });
  }

  getPlayer() {
    return this.scene.player || this.scene.player2 || null;
  }

  createAnimations() {
    if (!this.scene.anims.exists("anim_boss_walk")) {
      this.scene.anims.create({
        key: "anim_boss_walk",
        frames: this.scene.anims.generateFrameNumbers("boss_walk", { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.scene.anims.exists("anim_boss_jump")) {
      this.scene.anims.create({
        key: "anim_boss_jump",
        frames: this.scene.anims.generateFrameNumbers("boss_jump", { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!this.scene.anims.exists("anim_boss_attack")) {
      this.scene.anims.create({
        key: "anim_boss_attack",
        frames: this.scene.anims.generateFrameNumbers("boss_attack", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }

    if (!this.scene.anims.exists("anim_boss_attack2")) {
      this.scene.anims.create({
        key: "anim_boss_attack2",
        frames: this.scene.anims.generateFrameNumbers("boss_attack2", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }

    if (!this.scene.anims.exists("anim_boss_attack3")) {
      this.scene.anims.create({
        key: "anim_boss_attack3",
        frames: this.scene.anims.generateFrameNumbers("boss_attack3", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }

    if (!this.scene.anims.exists("anim_boss_death")) {
      this.scene.anims.create({
        key: "anim_boss_death",
        frames: this.scene.anims.generateFrameNumbers("boss_death", { start: 0, end: 5 }),
        frameRate: 8,
        repeat: 0
      });
    }
  }

  update(time) {
    if (this.isDead) return;

    this.updateHealthBarPosition();

    const player = this.scene.player || this.scene.player2;
    if (!player) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.x, this.y,
      player.x, player.y
    );

    // Vérifier les dégâts de contact avec le joueur
    if ((this.isDealingMeleeDamage || this.isDealingChargeDamage) && time - this.lastDamageTime > this.damageCooldown) {
      if (distanceToPlayer < 80) { // Distance de contact
        this.lastDamageTime = time;
        fct.perdreCoeur(this.scene);
      }
    }

    if (!this.isActive && distanceToPlayer < this.detectionRange) {
      this.isActive = true;
      this.isPlayerDetected = true;
      console.log("BOSS ACTIVÉ ! Combat commence !");
    }

    if (!this.isActive) {
      this.anims.play("anim_boss_walk", true);
      return;
    }

    this.facePlayer(player);

    switch (this.currentState) {
      case "idle":
        this.handleIdle(time, distanceToPlayer, player);
        break;
      case "walking":
        this.handleWalking(time, distanceToPlayer, player);
        break;
      case "waiting":
        this.handleWaiting(time, distanceToPlayer, player);
        break;
      case "charging":
        this.handleCharging(time, distanceToPlayer, player);
        break;
      case "retreating":
        this.handleRetreating(time, distanceToPlayer, player);
        break;
      case "shooting":
        this.handleShooting(time);
        break;
      case "melee":
        this.handleMelee(time);
        break;
    }
  }

  changeState(newState, duration = 0) {
    this.currentState = newState;
    this.stateTimer = this.scene.time.now;
    this.stateDuration = duration;
  }

  facePlayer(player) {
    if (player.x > this.x) {
      this.direction = 1;
      this.setFlipX(false);
    } else {
      this.direction = -1;
      this.setFlipX(true);
    }
  }

  handleIdle(time, distance, player) {
    this.setVelocityX(0);
    this.anims.play("anim_boss_walk", true);
    
    // Désactiver les dégâts en idle
    this.isDealingMeleeDamage = false;
    this.isDealingChargeDamage = false;

    if (time - this.stateTimer > 500) {
      const rand = Phaser.Math.Between(0, 100);
      
      if (distance < this.meleeRange && time - this.lastMeleeTime > this.meleeCooldown) {
        this.changeState("melee");
      } else if (distance < this.chargeRange && distance > this.meleeRange && rand < 30) {
        this.changeState("waiting", this.chargeWarningTime);
      } else if (distance < this.shootRange && time - this.lastShootTime > this.shootCooldown && rand < 40) {
        this.changeState("shooting");
      } else if (distance < 150 && rand < 25) {
        this.changeState("retreating", Phaser.Math.Between(800, 1500));
      } else {
        this.changeState("walking", Phaser.Math.Between(1000, 2000));
      }
    }
  }

  handleWalking(time, distance, player) {
    this.anims.play("anim_boss_walk", true);
    this.setVelocityX(this.speed * this.direction);
    
    this.isDealingMeleeDamage = false;
    this.isDealingChargeDamage = false;

    if (time - this.stateTimer > this.stateDuration) {
      this.changeState("idle");
    } else if (distance < this.meleeRange) {
      this.changeState("idle");
    }
  }

  handleWaiting(time, distance, player) {
    this.setVelocityX(0);
    this.anims.play("anim_boss_walk", true);
    
    this.isDealingMeleeDamage = false;
    this.isDealingChargeDamage = false;

    if (time - this.stateTimer > this.stateDuration) {
      this.changeState("charging", this.chargeDuration);
    }
  }

  handleCharging(time, distance, player) {
    this.anims.play("anim_boss_jump", true);
    this.setVelocityX(this.chargeSpeed * this.direction);
    
    // ACTIVER LES DÉGÂTS PENDANT LA CHARGE
    this.isDealingChargeDamage = true;
    this.isDealingMeleeDamage = false;

    if (time - this.stateTimer > this.stateDuration) {
      this.isDealingChargeDamage = false;
      this.changeState("idle");
    }
  }

  handleRetreating(time, distance, player) {
    this.anims.play("anim_boss_walk", true);
    this.setVelocityX(-this.speed * this.direction);
    
    this.isDealingMeleeDamage = false;
    this.isDealingChargeDamage = false;

    if (time - this.stateTimer > this.stateDuration || distance > this.shootRange) {
      this.changeState("idle");
    }
  }

  handleShooting(time) {
    this.setVelocityX(0);
    
    this.isDealingMeleeDamage = false;
    this.isDealingChargeDamage = false;
    
    if (!this.isAttacking) {
      this.isAttacking = true;
      this.anims.play("anim_boss_attack", true);
      this.shoot();
      this.lastShootTime = time;

      this.scene.time.delayedCall(600, () => {
        this.isAttacking = false;
        this.changeState("idle");
      });
    }
  }

  handleMelee(time) {
    this.setVelocityX(0);

    if (!this.isAttacking) {
      this.isAttacking = true;
      this.lastMeleeTime = time;
      
      // ACTIVER LES DÉGÂTS PENDANT L'ATTAQUE MÊLÉE
      this.isDealingMeleeDamage = true;
      this.isDealingChargeDamage = false;

      const attackAnim = Phaser.Math.Between(0, 1) === 0 ? "anim_boss_attack2" : "anim_boss_attack3";
      this.anims.play(attackAnim, true);

      this.scene.time.delayedCall(this.attackDuration, () => {
        this.isAttacking = false;
        this.isDealingMeleeDamage = false;
        this.changeState("idle");
      });
    }
  }

  shoot() {
    const player = this.scene.player || this.scene.player2;
    if (!player) return;

    let bullet;
    if (this.scene.grp_balles_ennemis) {
      bullet = this.scene.grp_balles_ennemis.create(this.x, this.y+30, "bullet3");
    } else {
      this.scene.grp_balles_ennemis = this.scene.physics.add.group();
      bullet = this.scene.grp_balles_ennemis.create(this.x, this.y, "bullet3");
    }

    if (!bullet) return;

    bullet.setDepth(15);
    bullet.setScale(1.4);
    bullet.body.setAllowGravity(false);

    const bulletSpeed = 350;
    bullet.setVelocityX(bulletSpeed * this.direction);
    bullet.setVelocityY(0);
    bullet.rotation = this.direction === 1 ? 0 : Math.PI;

    this.scene.time.delayedCall(3000, () => {
      if (bullet && bullet.active) {
        bullet.destroy();
      }
    });
  }

  destroy() {
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBar) this.healthBar.destroy();
    
    super.destroy();
  }
}