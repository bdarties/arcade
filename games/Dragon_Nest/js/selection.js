import * as fct from "./fonctions.js";

var player;
var clavier;
var toucheAttaque;

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // MAP1 pour la scène de sélection
    this.load.tilemapTiledJSON("map1", "assets/MAP1.json");
    this.load.image("tileset-image", "assets/tileset_map.png");

    // Assets visuels
    this.load.image("img_ciel", "assets/fond1.png");
    this.load.image("oeuf", "assets/oeuf.png");
    this.load.image("potion", "assets/potion.png");
    this.load.image("coeur", "assets/coeur.png");

    // Sprite du joueur
    this.load.spritesheet("img_perso", "assets/dude.png", { frameWidth: 64, frameHeight: 74 });
    this.load.spritesheet("img_perso_attaque", "assets/attack.png", { frameWidth: 64, frameHeight: 74 });

    // Portail unique vers niveau2
    this.load.image("img_porte2", "assets/portail2.png");

    // Préchargement ennemis
    fct.preloadDragon(this);
    fct.preloadSlimes(this);
  }

  create() {
    // Fond
    this.add.image(0, 0, "img_ciel").setOrigin(0, 0).setScrollFactor(0);

    // Map et tileset
    const map = this.make.tilemap({ key: "map1" });
    const tileset = map.addTilesetImage("Tileset SAE301", "tileset-image");

    const platformLayer = map.createLayer("platform_layer", tileset, 0, 0);
    const deathLayer = map.createLayer("death_layer", tileset, 0, 0);

    platformLayer.setCollisionByExclusion([-1], true);
    deathLayer.setCollisionByExclusion([-1], true);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Joueur
    player = this.physics.add.sprite(100, 480, "img_perso");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.setDisplaySize(48, 55);
    player.body.setSize(48, 55);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.lastDirection = "right";

    // Animations joueur
    this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 6 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: "anim_face", frames: [{ key: "img_perso", frame: 7 }], frameRate: 20 });
    this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 8, end: 14 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: "anim_attaque", frames: this.anims.generateFrameNumbers("img_perso_attaque", { start: 0, end: 4 }), frameRate: 10, repeat: 0 });

    // GROUPES
    this.enemies = this.physics.add.group();
    this.eggs = this.physics.add.group();
    this.potions = this.physics.add.group();

    // Hitbox attaque
    this.attackHitbox = this.add.rectangle(0, 0, 40, 40, 0xff0000, 0);
    this.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.setImmovable(true);
    this.attackHitbox.active = false;
    this.attackHitbox.body.enable = false;

    // Charger les objets depuis Tiled
    const objectLayer = map.getObjectLayer("object_layer");
    if (objectLayer && objectLayer.objects) {
      objectLayer.objects.forEach(obj => {
        switch (obj.name) {
          case "slime_rouge": {
            let slime = fct.createSlime(this, obj.x, obj.y, "slime_rouge");
            this.enemies.add(slime);
            break;
          }
          case "slime_bleu": {
            let slime = fct.createSlime(this, obj.x, obj.y, "slime_bleu");
            this.enemies.add(slime);
            break;
          }
          case "petit_dragon": {
            let dragon = fct.createDragon(this, obj.x, obj.y);
            this.enemies.add(dragon);
            break;
          }
          case "oeuf": {
            let egg = this.eggs.create(obj.x, obj.y, "oeuf");
            egg.setOrigin(0.5, 1);
            egg.setDisplaySize(20, 20);
            egg.setBounce(0.5);
            egg.setCollideWorldBounds(true);
            break;
          }
          case "potion": {
            let potion = this.potions.create(obj.x, obj.y, "potion");
            potion.setOrigin(0.5, 1);
            potion.setDisplaySize(20, 20);
            potion.setCollideWorldBounds(true);
            break;
          }
          case "target": {
            this.target = { x: obj.x, y: obj.y };
            break;
          }
        }
      });
    }

    // Colliders
    this.physics.add.collider(player, platformLayer);
    this.physics.add.collider(this.enemies, platformLayer);
    this.physics.add.collider(this.eggs, platformLayer);
    this.physics.add.collider(this.potions, platformLayer);
    this.physics.add.collider(player, deathLayer, () => this.takeDamage());

    // Overlaps
    this.physics.add.overlap(this.attackHitbox, this.enemies, (hitbox, enemy) => this.hitEnemy(enemy));
    this.physics.add.overlap(player, this.enemies, (p, enemy) => {
      this.takeDamage();
      const knockback = (p.x < enemy.x) ? -200 : 200;
      p.setVelocityX(knockback);
    });
    this.physics.add.overlap(player, this.eggs, this.collectEgg, null, this);
    this.physics.add.overlap(player, this.potions, this.collectPotion, null, this);

    // Input
    clavier = this.input.keyboard.createCursorKeys();
    toucheAttaque = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.touchePortail = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Initialiser les statistiques du joueur
    this.playerLives = this.registry.has("playerLives") ? this.registry.get("playerLives") : 3;
    this.registry.set("playerLives", this.playerLives);

    this.playerPotions = this.registry.has("playerPotions") ? this.registry.get("playerPotions") : 4;
    this.registry.set("playerPotions", this.playerPotions);

    // UI / score - Utiliser le registre pour les œufs
    this.eggsCollected = this.registry.has("eggsCollected") ? this.registry.get("eggsCollected") : 0;
    this.totalEggs = this.eggs.getChildren().length || 0;
    
    // UI conteneurs
    this.lifeText = this.add.text(35, 0, "Vies: " + this.playerLives, { fontSize: "28px", fill: "#ff4d4d" });
    this.lifeIcon = this.add.image(-5, 15, "coeur").setOrigin(0, 0.5).setDisplaySize(30, 30);
    this.lifeContainer = this.add.container(20, 20, [this.lifeIcon, this.lifeText]).setScrollFactor(0);

    this.potionText = this.add.text(35, 0, "Potions: " + this.playerPotions, { fontSize: "24px", fill: "#4da6ff" });
    this.potionIcon = this.add.image(0, 15, "potion").setOrigin(0, 0.5).setDisplaySize(20, 20);
    this.potionContainer = this.add.container(20, 60, [this.potionIcon, this.potionText]).setScrollFactor(0);

    // UI - Œufs (affichage du total cumulé)
    this.eggsText = this.add.text(35, 0, "Oeufs: " + this.eggsCollected + "/10", { 
      fontSize: "24px", 
      fill: "#ffeb3b" 
    });
    this.eggsIcon = this.add.image(0, 15, "oeuf").setOrigin(0, 0.5).setDisplaySize(20, 20);
    this.eggsContainer = this.add.container(20, 100, [this.eggsIcon, this.eggsText]).setScrollFactor(0);

    // Message d'erreur (caché au début)
    this.errorText = this.add.text(400, 300, "Vous n'avez pas récolté tous les oeufs (10 requis)", {
      fontSize: "24px",
      fill: "#ff0000",
      backgroundColor: "#000000",
      padding: { x: 10, y: 5 }
    });
    this.errorText.setVisible(false);
    this.errorText.setScrollFactor(0);
    this.errorText.setOrigin(0.5, 0.5);

    // Portail unique vers niveau2
    this.porte2 = this.physics.add.staticSprite(1100, 1910, "img_porte2");
    this.porte2.setOrigin(0.5, 1);

    // Indicateur visuel pour le portail (change en fonction des œufs collectés)
    this.portalIndicator = this.add.text(this.porte2.x, this.porte2.y - 50, 
      this.eggsCollected + "/10 œufs", 
      { 
        fontSize: "16px", 
        fill: this.eggsCollected >= 10 ? "#00ff00" : "#ff0000",
        backgroundColor: "#000000",
        padding: { x: 5, y: 2 }
      }
    );
    this.portalIndicator.setOrigin(0.5, 0.5);

    // Charger tous les calques "tilelayer"
    const tileLayerNames = ["platform_layer", "death_layer", "decoration_back_layer", "ladder_layer"];
    this.layers = {};
    tileLayerNames.forEach(layerName => {
      this.layers[layerName] = map.createLayer(layerName, tileset, 0, 0);
    });
  }

  collectEgg(player, egg) {
    egg.disableBody(true, true);
    
    // Mettre à jour le compteur d'œufs dans le registre
    this.eggsCollected++;
    this.registry.set("eggsCollected", this.eggsCollected);
    this.eggsText.setText("Oeufs: " + this.eggsCollected + "/10");
    
    // Mettre à jour l'indicateur du portail
    this.portalIndicator.setText(this.eggsCollected + "/10 œufs");
    this.portalIndicator.setFill(this.eggsCollected >= 10 ? "#00ff00" : "#ff0000");

    // Effet visuel de collection
    this.tweens.add({
      targets: egg,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        egg.destroy();
      }
    });
  }

  collectPotion(player, potion) {
    potion.disableBody(true, true);
    this.playerPotions += 1;
    this.registry.set("playerPotions", this.playerPotions);
    this.potionText.setText("Potions: " + this.playerPotions);
  }

  takeDamage() {
    if (!this.lastDamageTime) this.lastDamageTime = 0;
    const now = this.time.now;
    if (now - this.lastDamageTime < 1000) return;
    this.lastDamageTime = now;

    player.setTintFill(0xffffff);
    this.time.delayedCall(200, () => player.clearTint());

    if (!this.damageCount) this.damageCount = 0;
    this.damageCount += 1;

    if (this.playerPotions > 0) {
        this.playerPotions -= 1;
        this.registry.set("playerPotions", this.playerPotions);
        this.potionText.setText("Potions: " + this.playerPotions);
        if (this.damageCount < 4) return;
    }

    if (this.damageCount >= 4) {
        this.playerLives -= 1;
        this.registry.set("playerLives", this.playerLives);
        this.lifeText.setText("Vies: " + this.playerLives);
        this.damageCount = 0;
        
        if (this.playerLives <= 0) {
            // RÉINITIALISATION DES ŒUFS AVANT LE GAME OVER
            this.registry.set("eggsCollected", 0);
            this.scene.start("gameover");
        } else {
            // 🟢 Ne pas réinitialiser les œufs ici
            this.playerPotions = 4;
            this.registry.set("playerPotions", this.playerPotions);
            this.potionText.setText("Potions: " + this.playerPotions);
            player.setPosition(100, 480);
            player.setVelocity(0, 0);
        }
    }
}

  hitEnemy(enemy) {
    if (!enemy.active) return;

    enemy.health -= 1;
    enemy.setTintFill(0xff0000);
    this.time.delayedCall(200, () => enemy.clearTint());

    const knockback = (enemy.x < player.x) ? -200 : 200;
    enemy.setVelocityX(knockback);

    if (enemy.health <= 0) {
      enemy.destroy();
    }
  }

  update() {
    const isAttacking = player.anims.currentAnim && player.anims.currentAnim.key === "anim_attaque" && player.anims.isPlaying;

    if (Phaser.Input.Keyboard.JustDown(toucheAttaque) && !isAttacking) {
      player.setVelocityX(0);
      player.setFlipX(this.lastDirection === "right");
      player.anims.play("anim_attaque", true);

      const offsetX = (this.lastDirection === "right") ? 40 : -40;
      this.attackHitbox.setPosition(player.x + offsetX, player.y);
      this.attackHitbox.active = true;
      this.attackHitbox.body.enable = true;

      this.time.delayedCall(200, () => {
        this.attackHitbox.active = false;
        this.attackHitbox.body.enable = false;
      });

      return;
    }

    const ladderLayer = this.layers["ladder_layer"];
    let isOnLadderTile = false;
    if (ladderLayer) {
      const tile = ladderLayer.getTileAtWorldXY(player.x, player.y, true);
      if (tile && tile.index !== -1) isOnLadderTile = true;
    }

    if (isOnLadderTile) {
      player.body.setAllowGravity(false);

      // Déplacement vertical
      if (clavier.up.isDown) {
        player.setVelocityY(-100);
      } else if (clavier.down.isDown) {
        player.setVelocityY(100);
      } else {
        player.setVelocityY(0);
      }

      // Déplacement horizontal sur l'échelle
      if (clavier.left.isDown) {
        player.setVelocityX(-100);
        player.anims.play("anim_tourne_gauche", true);
        this.lastDirection = "left";
        player.setFlipX(false);
      } else if (clavier.right.isDown) {
        player.setVelocityX(100);
        player.anims.play("anim_tourne_droite", true);
        this.lastDirection = "right";
        player.setFlipX(false);
      } else {
        player.setVelocityX(0);
        player.anims.play("anim_face", true);
        player.setFlipX(this.lastDirection === "left");
      }

    } else if (!isAttacking) {
      player.body.setAllowGravity(true);

      // Déplacement normal au sol
      if (clavier.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play("anim_tourne_gauche", true);
        this.lastDirection = "left";
        player.setFlipX(false);
      } else if (clavier.right.isDown) {
        player.setVelocityX(160);
        player.anims.play("anim_tourne_droite", true);
        this.lastDirection = "right";
        player.setFlipX(false);
      } else {
        player.setVelocityX(0);
        player.anims.play("anim_face", true);
        player.setFlipX(this.lastDirection === "left");
      }

      // Saut
      if (clavier.up.isDown && player.body.blocked.down) {
        player.setVelocityY(-330);
      }
    }

    this.enemies.getChildren().forEach(enemy => {
      if (enemy.texture && enemy.texture.key === "petit_dragon") {
        fct.updateDragon(enemy, player, this);
      } else {
        fct.updateSlime(enemy, player, this);
      }
    });

    // Mettre à jour la position de l'indicateur du portail par rapport à la caméra
    this.portalIndicator.setPosition(
      this.cameras.main.scrollX + this.porte2.x,
      this.cameras.main.scrollY + this.porte2.y - 50
    );

    // Transition vers niveau2 avec vérification des œufs
    if (Phaser.Input.Keyboard.JustDown(this.touchePortail)) {
      if (this.physics.overlap(player, this.porte2)) {
        if (this.eggsCollected >= 10) {
          this.scene.start("bd1");
        } else {
          // Afficher le message d'erreur
          this.errorText.setVisible(true);
          
          // Masquer le message après 2 secondes
          this.time.delayedCall(2000, () => {
            this.errorText.setVisible(false);
          });
        }
      }
    }
  }
}