import * as fct from "./fonctions.js";

var player;
var clavier;
var toucheAttaque;

export default class niveau2 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau2" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Map et tileset
    this.load.tilemapTiledJSON("map2", "assets/MAP2.json");
    this.load.image("tileset-image", "assets/tileset_map.png");

    // Environnement
    this.load.image("img_ciel", "assets/fond1.png");

    // Assets joueur
    this.load.image("img_plateforme", "assets/platform.png");
    this.load.spritesheet("img_perso", "assets/dude.png", { frameWidth: 64, frameHeight: 74 });
    this.load.spritesheet("img_perso_attaque", "assets/attack.png", { frameWidth: 64, frameHeight: 74 });

    // UI
    this.load.image("coeur", "assets/coeur.png");
    this.load.image("potion", "assets/potion.png");
    this.load.image("portail2", "assets/portail2.png");

    // Ennemis
    fct.preloadDragon(this);
    fct.preloadSlimes(this);
  }

  create() {
    this.add.image(0, 0, "img_ciel").setOrigin(0, 0).setScrollFactor(0);

    const map = this.make.tilemap({ key: "map2" });
    const tileset = map.addTilesetImage("Tileset SAE301", "tileset-image");

    // Layers
    map.createLayer("decoration_back_layer", tileset, 0, 0);
    this.platformLayer = map.createLayer("platform_layer", tileset, 0, 0);
    map.createLayer("decoration_front_layer", tileset, 0, 0);
    this.deathLayer = map.createLayer("death_layer", tileset, 0, 0);

    // Collisions
    this.platformLayer.setCollisionByExclusion([-1], true);
    this.deathLayer.setCollisionByExclusion([-1], true);

    // Monde et caméra
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Joueur
    player = this.physics.add.sprite(800, 2500, "img_perso");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.setDisplaySize(48, 55);
    player.body.setSize(48, 55);

    // Sauvegarde position initiale
    this.spawnX = player.x;
    this.spawnY = player.y;

    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.lastDirection = "right";

// Animations
    this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 6 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: "anim_face", frames: [{ key: "img_perso", frame: 7 }], frameRate: 20 });
    this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 8, end: 14 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: "anim_attaque", frames: this.anims.generateFrameNumbers("img_perso_attaque", { start: 0, end: 4 }), frameRate: 10, repeat: 0 });

    // Groupes ennemis / objets
    this.enemies = this.physics.add.group();
    this.potions = this.physics.add.group();

    // Hitbox attaque
    this.attackHitbox = this.add.rectangle(0, 0, 40, 40, 0xff0000, 0);
    this.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.setImmovable(true);
    this.attackHitbox.active = false;
    this.attackHitbox.body.enable = false;

    // Colliders
    this.physics.add.collider(player, this.platformLayer);
    this.physics.add.collider(this.enemies, this.platformLayer);
    this.physics.add.collider(player, this.deathLayer, () => this.takeDamage());

    // --- AJOUT POUR DOMMAGES DES ENNEMIS ---
    this.physics.add.overlap(player, this.enemies, (player, enemy) => {
      this.takeDamage();
    });

    // Input
    clavier = this.input.keyboard.createCursorKeys();
    toucheAttaque = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // UI / score
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

    // ------------------------
    // CHARGEMENT OBJECT LAYER
    // ------------------------
    const objectsLayer = map.getObjectLayer("object_layer");
    objectsLayer.objects.forEach((obj) => {
      switch (obj.name) {
        case "potion":
          const potion = this.potions.create(obj.x, obj.y, "potion");
          potion.setOrigin(0.5, 1);
          potion.body.setAllowGravity(false);
          break;

        case "petit_dragon":
          const dragon = fct.createDragon(this, obj.x, obj.y);
          this.enemies.add(dragon);
          break;

        case "slime_rouge":
          const slimeR = fct.createSlime(this, obj.x, obj.y, "slime_rouge");
          this.enemies.add(slimeR);
          break;

        case "slime_bleu":
          const slimeB = fct.createSlime(this, obj.x, obj.y, "slime_bleu");
          this.enemies.add(slimeB);
          break;

        case "dragon":
          const boss = fct.createBossDragon(this, obj.x, obj.y);
          this.enemies.add(boss);
          break;

        case "portal":
          this.portal = this.physics.add.staticSprite(obj.x, obj.y, "portail2");
          this.portal.setOrigin(0.5, 1);
          break;
      }
    });

    // Overlap pour récupérer les potions
    this.physics.add.overlap(player, this.potions, (player, potion) => {
      potion.destroy();
      this.playerPotions += 1;
      this.registry.set("playerPotions", this.playerPotions);
      this.potionText.setText("Potions: " + this.playerPotions);
    });
  }

  // ------------------------
  // FONCTIONS D'UTILITAIRE
  // ------------------------
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

        // Respawn au point de spawn
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

    const knockback = enemy.x < player.x ? -200 : 200;
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

    // Détection portail
    if (this.portal && Phaser.Input.Keyboard.JustDown(clavier.space)) {
      if (this.physics.overlap(player, this.portal)) {
        this.scene.start("niveau3");
      }
    }

    // IA ennemis
    this.enemies.children.each((enemy) => {
      if (!enemy.active) return;
      if (enemy.texture.key === "slime_rouge" || enemy.texture.key === "slime_bleu") {
        fct.updateSlime(enemy, player, this);
      }
      if (enemy.texture.key === "petit_dragon") {
        fct.updateDragon(enemy, player, this);
      }
    });

    // Détection coups portés aux ennemis
    this.physics.overlap(this.attackHitbox, this.enemies, (hitbox, enemy) => {
      if (this.attackHitbox.active) {
        this.hitEnemy(enemy);
      }
    });
  }
}
