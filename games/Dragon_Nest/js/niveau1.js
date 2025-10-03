import * as fct from "./fonctions.js";

var player;
var clavier;
var toucheAttaque;

export default class niveau1 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Map et tileset
    this.load.tilemapTiledJSON("map1", "assets/MAP1.json");
    this.load.image("tileset-image", "assets/tileset_map.png");

    // Assets joueur et environnement
    this.load.image("img_ciel", "assets/fond1.png");
    this.load.image("img_plateforme", "assets/platform.png");
    this.load.spritesheet("img_perso", "assets/dude.png", { frameWidth: 64, frameHeight: 74 });
    this.load.spritesheet("img_perso_attaque", "assets/attack.png", { frameWidth: 64, frameHeight: 74 });

    // Portail unique pour niveau2
    this.load.image("portail2", "assets/portail2.png");

    // Assets ennemis
    fct.preloadDragon(this);
    fct.preloadSlimes(this);

    // Ajout du chargement des œufs et des icônes UI
    this.load.image("oeuf", "assets/oeuf.png");
    this.load.image("coeur", "assets/coeur.png");
    this.load.image("potion", "assets/potion.png");

    // --- MUSIQUE DU NIVEAU ---
    this.load.audio('musiqueMap1', 'assets/MusiqueMAP1-2.mp3');
  }

  create() {
    // --- CHANGER LA MUSIQUE ---
    if (!this.sys.game.globals) {
      this.sys.game.globals = {};
    }

    // Arrêter la musique du menu si elle existe
    if (this.sys.game.globals.musiqueMenu) {
      this.sys.game.globals.musiqueMenu.stop();
    }

    // Jouer la musique du niveau si elle n'est pas déjà lancée
    if (!this.sys.game.globals.musiqueMap1) {
      this.sys.game.globals.musiqueMap1 = this.sound.add('musiqueMap1', { loop: true, volume: 0.5 });
      this.sys.game.globals.musiqueMap1.play();
    }

    // --- Fond ---
    this.add.image(0, 0, "img_ciel").setOrigin(0, 0).setScrollFactor(0);

    const map = this.make.tilemap({ key: "map1" });
    const tileset = map.addTilesetImage("Tileset SAE301", "tileset-image");

    // Layers
    const backLayer = map.createLayer("decoration_back_layer", tileset, 0, 0);
    const platformLayer = map.createLayer("platform_layer", tileset, 0, 0);
    const frontLayer = map.createLayer("decoration_front_layer", tileset, 0, 0);

    // Collisions
    platformLayer.setCollisionByExclusion([-1], true);

    // Monde et caméra
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Création du joueur
    player = this.physics.add.sprite(100, 450, "img_perso");
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(player);

    // Animations
    this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 6 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: "anim_face", frames: [{ key: "img_perso", frame: 7 }], frameRate: 20 });
    this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 8, end: 14 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: "anim_attaque", frames: this.anims.generateFrameNumbers("img_perso_attaque", { start: 0, end: 4 }), frameRate: 10, repeat: 0 });

    // Groupes ennemis / objets
    this.enemies = this.physics.add.group();
    this.eggs = this.physics.add.group();
    this.potions = this.physics.add.group();

    // Créer les œufs dans le niveau
    const eggPositions = [
      { x: 200, y: 300 }, { x: 350, y: 200 }, { x: 500, y: 400 }, 
      { x: 650, y: 250 }, { x: 800, y: 350 }, { x: 300, y: 500 },
      { x: 450, y: 600 }, { x: 600, y: 450 }, { x: 750, y: 550 },
      { x: 900, y: 300 }
    ];

    eggPositions.forEach(pos => {
      const egg = this.eggs.create(pos.x, pos.y, "oeuf");
      egg.setCollideWorldBounds(true);
      egg.body.setAllowGravity(false);
      egg.setScale(0.8);
    });

    // Hitbox attaque
    this.attackHitbox = this.add.rectangle(0, 0, 40, 40, 0xff0000, 0);
    this.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.setImmovable(true);
    this.attackHitbox.active = false;
    this.attackHitbox.body.enable = false;

    // Colliders
    this.physics.add.collider(player, platformLayer);
    this.physics.add.collider(this.eggs, platformLayer);

    // Overlap pour collecter les œufs
    this.physics.add.overlap(player, this.eggs, this.collectEgg, null, this);

    // Input
    clavier = this.input.keyboard.createCursorKeys();
    toucheAttaque = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Initialiser statistiques du joueur
    this.playerLives = this.registry.has("playerLives") ? this.registry.get("playerLives") : 3;
    this.registry.set("playerLives", this.playerLives);

    this.playerPotions = this.registry.has("playerPotions") ? this.registry.get("playerPotions") : 4;
    this.registry.set("playerPotions", this.playerPotions);

    this.eggsCollected = this.registry.has("eggsCollected") ? this.registry.get("eggsCollected") : 0;
    this.registry.set("eggsCollected", this.eggsCollected);

    // UI - Vies
    this.lifeText = this.add.text(35, 0, "Vies: " + this.playerLives, { fontSize: "28px", fill: "#ff4d4d" });
    this.lifeIcon = this.add.image(0, 15, "coeur").setOrigin(0, 0.5).setDisplaySize(30, 30);
    this.lifeContainer = this.add.container(20, 20, [this.lifeIcon, this.lifeText]).setScrollFactor(0);

    // UI - Potions
    this.potionText = this.add.text(35, 0, "Potions: " + this.playerPotions, { fontSize: "24px", fill: "#4da6ff" });
    this.potionIcon = this.add.image(0, 15, "potion").setOrigin(0, 0.5).setDisplaySize(20, 20);
    this.potionContainer = this.add.container(20, 60, [this.potionIcon, this.potionText]).setScrollFactor(0);

    // UI - Œufs
    this.eggsText = this.add.text(35, 0, "Oeufs: " + this.eggsCollected + "/10", { fontSize: "24px", fill: "#ffeb3b" });
    this.eggsIcon = this.add.image(0, 15, "oeuf").setOrigin(0, 0.5).setDisplaySize(20, 20);
    this.eggsContainer = this.add.container(20, 100, [this.eggsIcon, this.eggsText]).setScrollFactor(0);

    // Message d'erreur
    this.errorText = this.add.text(400, 300, "Vous n'avez pas récolté tous les oeufs", {
      fontSize: "24px",
      fill: "#ff0000",
      backgroundColor: "#000000",
      padding: { x: 10, y: 5 }
    });
    this.errorText.setVisible(false);
    this.errorText.setScrollFactor(0);
    this.errorText.setOrigin(0.5, 0.5);

    // Portail vers niveau2
    this.portail2 = this.physics.add.staticSprite(1100, 1850, "portail2");
    this.portail2.setOrigin(0.5, 1);

    // Direction initiale
    this.lastDirection = "right";
  }

  collectEgg(player, egg) {
    egg.disableBody(true, true);
    this.eggsCollected++;
    this.registry.set("eggsCollected", this.eggsCollected);
    this.eggsText.setText("Oeufs: " + this.eggsCollected + "/10");

    this.tweens.add({
      targets: egg,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => egg.destroy()
    });
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
      if (this.playerLives <= 0) this.scene.start("gameover");
      else {
        this.playerPotions = 4;
        this.registry.set("playerPotions", this.playerPotions);
        this.potionText.setText("Potions: " + this.playerPotions);
        player.setPosition(100, 450);
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
    } else {
      if (clavier.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play("anim_tourne_gauche", true);
        this.lastDirection = "left";
      } else if (clavier.right.isDown) {
        player.setVelocityX(160);
        player.anims.play("anim_tourne_droite", true);
        this.lastDirection = "right";
      } else {
        player.setVelocityX(0);
        player.anims.play("anim_face");
      }

      if (clavier.up.isDown && player.body.blocked.down) player.setVelocityY(-330);
    }

    // Portail vers niveau2 avec vérification des œufs
    if (Phaser.Input.Keyboard.JustDown(clavier.space)) {
      if (this.physics.overlap(player, this.portail2)) {
        if (this.eggsCollected >= 10) {
          this.scene.start("bd1");
        } else {
          this.errorText.setVisible(true);
          this.time.delayedCall(2000, () => { this.errorText.setVisible(false); });
        }
      }
    }
  }
}
