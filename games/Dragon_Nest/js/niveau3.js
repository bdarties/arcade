import * as fct from "./fonctions.js";

var player;
var clavier;
var toucheAttaque;

export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Map + tileset forêt
    this.load.tilemapTiledJSON("map3", "assets/MAP3.json");
    this.load.image("tileset-foret", "assets/tileset_map-foret.png");

    // Assets joueur et environnement
    this.load.image("img_f", "assets/background_map3.jpg");
    this.load.image("img_plateforme", "assets/platform.png");
    this.load.spritesheet("img_perso", "assets/dude.png", { frameWidth: 64, frameHeight: 74 });
    this.load.spritesheet("img_perso_attaque", "assets/attack.png", { frameWidth: 64, frameHeight: 74 });

    // UI
    this.load.image("coeur", "assets/coeur.png");
    this.load.image("potion", "assets/potion.png");
    this.load.image("portail2", "assets/portail2.png");

    // Ennemis
    fct.preloadGoblin(this);
    fct.preloadChampignon(this);
    fct.preloadSlimes(this);
    fct.preloadDragon(this);
    fct.preloadBossDragon(this);
  }

  create() {
    // --- Décor ---
    this.add.image(0, 0, "img_f").setOrigin(0, 0).setScrollFactor(0);

    const map = this.make.tilemap({ key: "map3" });
    const tileset = map.addTilesetImage("tiilesetForet", "tileset-foret");

    // Layers
    this.platformLayer = map.createLayer("platform_layer", tileset, 0, 0);
    this.deathLayer = map.createLayer("death_layer", tileset, 0, 0);
    this.ladderLayer = map.createLayer("ladder_layer", tileset, 0, 0);
    map.createLayer("decoration_back_layer", tileset, 0, 0);
    map.createLayer("decoration_front_layer", tileset, 0, 0);

    // Collisions
    this.platformLayer.setCollisionByExclusion([-1], true);
    this.deathLayer.setCollisionByExclusion([-1], true);

    // Monde & caméra
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // --- Joueur ---
    player = this.physics.add.sprite(100, 1700, "img_perso");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.setDisplaySize(48, 55);
    player.body.setSize(48, 55);
    this.spawnX = player.x;
    this.spawnY = player.y;
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.lastDirection = "right";

    // --- Animations joueur ---
    this.anims.create({
      key: "anim_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 6 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_face",
      frames: [{ key: "img_perso", frame: 7 }],
      frameRate: 20
    });
    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 8, end: 14 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_attaque",
      frames: this.anims.generateFrameNumbers("img_perso_attaque", { start: 0, end: 4 }),
      frameRate: 10,
      repeat: 0
    });

    // --- Groupes ---
    this.potions = this.physics.add.group();
    this.goblins = this.physics.add.group();
    this.champignons = this.physics.add.group();
    this.slimes = this.physics.add.group();
    this.dragons = this.physics.add.group();
    this.bossDragons = this.physics.add.group();

    // Hitbox attaque
    this.attackHitbox = this.add.rectangle(0, 0, 40, 40, 0xff0000, 0);
    this.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.setImmovable(true);
    this.attackHitbox.active = false;
    this.attackHitbox.body.enable = false;

    // Colliders
    this.physics.add.collider(player, this.platformLayer);
    this.physics.add.collider(player, this.deathLayer, () => this.takeDamage(1));

    // Collisions ennemis ↔ plateformes
    this.physics.add.collider(this.goblins, this.platformLayer);
    this.physics.add.collider(this.champignons, this.platformLayer);
    this.physics.add.collider(this.slimes, this.platformLayer);
    this.physics.add.collider(this.dragons, this.platformLayer);
    this.physics.add.collider(this.bossDragons, this.platformLayer);

    // Input
    clavier = this.input.keyboard.createCursorKeys();
    toucheAttaque = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // UI
    this.playerLives = this.registry.has("playerLives") ? this.registry.get("playerLives") : 3;
    this.registry.set("playerLives", this.playerLives);

    this.playerPotions = this.registry.has("playerPotions") ? this.registry.get("playerPotions") : 4;
    this.registry.set("playerPotions", this.playerPotions);

    this.lifeText = this.add.text(35, 0, "Vies: " + this.playerLives, { fontSize: "28px", fill: "#ff4d4d" });
    this.lifeIcon = this.add.image(0, 15, "coeur").setOrigin(0, 0.5).setDisplaySize(30, 30);
    this.lifeContainer = this.add.container(20, 20, [this.lifeIcon, this.lifeText]).setScrollFactor(0);

    this.potionText = this.add.text(35, 0, "Potions: " + this.playerPotions, { fontSize: "24px", fill: "#4da6ff" });
    this.potionIcon = this.add.image(0, 15, "potion").setOrigin(0, 0.5).setDisplaySize(20, 20);
    this.potionContainer = this.add.container(20, 60, [this.potionIcon, this.potionText]).setScrollFactor(0);

    // Objets depuis Tiled
    const objectsLayer = map.getObjectLayer("object_layer");
    objectsLayer.objects.forEach((obj) => {
      switch (obj.name) {
        case "portal":
          this.portal = fct.createPortal(this, obj.x, obj.y);
          break;
        case "potion":
          this.potions.add(fct.createPotion(this, obj.x, obj.y));
          break;
        case "goblin":
          this.goblins.add(fct.createGoblin(this, obj.x, obj.y - obj.height));
          break;
        case "champignon":
          this.champignons.add(fct.createChampignon(this, obj.x, obj.y - obj.height));
          break;
        case "slime_rouge":
          this.slimes.add(fct.createSlime(this, obj.x, obj.y - obj.height, "slime_rouge"));
          break;
        case "slime_bleu":
          this.slimes.add(fct.createSlime(this, obj.x, obj.y - obj.height, "slime_bleu"));
          break;
        case "dragon":
          this.dragons.add(fct.createDragon(this, obj.x, obj.y - obj.height));
          break;
        case "boss_dragon":
          this.bossDragons.add(fct.createBossDragon(this, obj.x, obj.y - obj.height));
          break;
      }
    });

    // Overlaps attaques
    this.physics.add.overlap(this.attackHitbox, this.goblins, (hitbox, gob) => this.hitEnemy(gob));
    this.physics.add.overlap(this.attackHitbox, this.champignons, (hitbox, c) => this.hitEnemy(c));
    this.physics.add.overlap(this.attackHitbox, this.slimes, (hitbox, s) => this.hitEnemy(s));
    this.physics.add.overlap(this.attackHitbox, this.dragons, (hitbox, d) => this.hitEnemy(d));
    this.physics.add.overlap(this.attackHitbox, this.bossDragons, (hitbox, b) => this.hitEnemy(b));

    // Overlaps potions
    this.physics.add.overlap(player, this.potions, this.collectPotion, null, this);

    // --- Overlaps ennemis ↔ joueur pour infliger des dégâts ---
    this.physics.add.overlap(player, this.goblins, (player, gob) => { this.takeDamage(gob.damage); }, null, this);
    this.physics.add.overlap(player, this.champignons, (player, champi) => { this.takeDamage(champi.damage); }, null, this);
    this.physics.add.overlap(player, this.slimes, (player, slime) => { this.takeDamage(slime.damage); }, null, this);
    this.physics.add.overlap(player, this.dragons, (player, dragon) => { this.takeDamage(dragon.damage); }, null, this);
    this.physics.add.overlap(player, this.bossDragons, (player, boss) => { this.takeDamage(boss.damage); }, null, this);
  }

  collectPotion(player, potion) {
    potion.destroy();
    this.playerPotions += 1;
    this.registry.set("playerPotions", this.playerPotions);
    this.potionText.setText("Potions: " + this.playerPotions);
  }

  takeDamage(damageAmount = 1) {
    if (!this.lastDamageTime) this.lastDamageTime = 0;
    const now = this.time.now;
    if (now - this.lastDamageTime < 1000) return;
    this.lastDamageTime = now;

    player.setTintFill(0xffffff);
    this.time.delayedCall(200, () => player.clearTint());

    if (!this.damageCount) this.damageCount = 0;
    this.damageCount += damageAmount;

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
        this.scene.start("gameover");
      } else {
        this.playerPotions = 4;
        this.registry.set("playerPotions", this.playerPotions);
        this.potionText.setText("Potions: " + this.playerPotions);
        player.setPosition(this.spawnX, this.spawnY);
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

    // Vérifier si le joueur est sur une échelle
    let isOnLadderTile = false;
    if (this.ladderLayer) {
      const tile = this.ladderLayer.getTileAtWorldXY(player.x, player.y, true);
      if (tile && tile.index !== -1) isOnLadderTile = true;
    }

    if (Phaser.Input.Keyboard.JustDown(toucheAttaque) && !isAttacking) {
      player.setVelocityX(0);
      player.setFlipX(this.lastDirection === "right");
      player.anims.play("anim_attaque", true);

      const offsetX = (this.lastDirection === "left") ? -40 : 40;
      this.attackHitbox.setPosition(player.x + offsetX, player.y);
      this.attackHitbox.active = true;
      this.attackHitbox.body.enable = true;

      this.time.delayedCall(200, () => {
        this.attackHitbox.active = false;
        this.attackHitbox.body.enable = false;
      });

      return;
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

      // --- Déplacement normal au sol ---
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

      // --- Saut ---
      if (clavier.up.isDown && player.body.blocked.down) {
        player.setVelocityY(-330);
      }
    }

    // Update ennemis
    this.goblins.getChildren().forEach((g) => fct.updateGoblin(g, player, this));
    this.champignons.getChildren().forEach((c) => fct.updateChampignon(c, player, this));
    this.slimes.getChildren().forEach((s) => fct.updateSlime(s, player, this));
    this.dragons.getChildren().forEach((d) => fct.updateDragon(d, player, this));
    this.bossDragons.getChildren().forEach((b) => {
      let dx = player.x - b.x;
      b.setVelocityX(Math.abs(dx) < 300 ? Math.sign(dx) * 80 : 0);
      b.setFlipX(dx > 0);
    });
  }
}