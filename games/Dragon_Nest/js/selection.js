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

    this.load.tilemapTiledJSON("map1", "assets/MAP1.json");
    this.load.image("tileset-image", "assets/tileset_map.png");

    this.load.image("img_ciel", "assets/fond1.png");
    this.load.image("img_porte1", "assets/door1.png");
    this.load.image("img_porte2", "assets/door2.png");
    this.load.image("img_porte3", "assets/door3.png");
    this.load.image("oeuf", "assets/oeuf.png");
    this.load.image("potion", "assets/potion.png");

    this.load.spritesheet("img_perso", "assets/dude.png", { frameWidth: 64, frameHeight: 74 });
    this.load.spritesheet("img_perso_attaque", "assets/attack.png", { frameWidth: 64, frameHeight: 74 });

    // précharge les sprites d'ennemis (si les images manquent, fonctions.js générera un placeholder)
    fct.preloadDragon(this);
    fct.preloadSlimes(this);
  }

  create() {
    this.add.image(0, 0, "img_ciel").setOrigin(0, 0).setScrollFactor(0);

    const map = this.make.tilemap({ key: "map1" });
    const tileset = map.addTilesetImage("Tileset SAE301", "tileset-image");

    const platformLayer = map.createLayer("platform_layer", tileset, 0, 0);
    const deathLayer = map.createLayer("death_layer", tileset, 0, 0);

    platformLayer.setCollisionByExclusion([-1], true);
    deathLayer.setCollisionByExclusion([-1], true);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // PLAYER
    player = this.physics.add.sprite(100, 450, "img_perso");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.setDisplaySize(48, 55);
    player.body.setSize(48, 55);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.lastDirection = "right";

    this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 6 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: "anim_face", frames: [{ key: "img_perso", frame: 7 }], frameRate: 20 });
    this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 8, end: 14 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: "anim_attaque", frames: this.anims.generateFrameNumbers("img_perso_attaque", { start: 0, end: 4 }), frameRate: 10, repeat: 0 });

    // GROUPES
    this.enemies = this.physics.add.group();
    this.eggs = this.physics.add.group();
    this.potions = this.physics.add.group();

    // Hitbox d'attaque (créée maintenant, utilisée ensuite)
    this.attackHitbox = this.add.rectangle(0, 0, 40, 40, 0xff0000, 0);
    this.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.setImmovable(true);
    this.attackHitbox.active = false;
    this.attackHitbox.body.enable = false;

    // Charger les objets depuis Tiled (object_layer)
    const objectLayer = map.getObjectLayer("object_layer");
    if (objectLayer && objectLayer.objects) {
      objectLayer.objects.forEach(obj => {
        // NOTE: on utilise obj.x, obj.y et on attend que les fonctions créent les sprites
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
          case "portal": {
            this.portal = this.physics.add.sprite(obj.x, obj.y, "img_porte1").setOrigin(0.5, 1);
            this.portal.body.setAllowGravity(false);
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
    toucheAttaque = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);

    // UI / score
    this.eggCount = 0;
    this.totalEggs = this.eggs.getChildren().length || 0;
    this.scoreText = this.add.text(this.sys.game.config.width - 20, 20, "Œufs: 0/" + this.totalEggs, { fontSize: "28px", fill: "#fff" }).setOrigin(1, 0).setScrollFactor(0);

    this.playerLives = this.registry.has("playerLives") ? this.registry.get("playerLives") : 3;
    this.registry.set("playerLives", this.playerLives);

    this.playerPotions = this.registry.has("playerPotions") ? this.registry.get("playerPotions") : 4;
    this.registry.set("playerPotions", this.playerPotions);

    this.lifeText = this.add.text(20, 20, "Vies: " + this.playerLives, { fontSize: "28px", fill: "#ff4d4d" }).setScrollFactor(0);
    this.potionText = this.add.text(20, 60, "Potions: " + this.playerPotions, { fontSize: "24px", fill: "#4da6ff" }).setScrollFactor(0);

    // Charger tous les calques de type "tilelayer" de la map
    const tileLayerNames = [
      "platform_layer",
      "death_layer",
      "decoration_back_layer",
      "ladder_layer"
      // Ajoute ici d'autres noms de calques si besoin
    ];

    this.layers = {};
    tileLayerNames.forEach(layerName => {
      this.layers[layerName] = map.createLayer(layerName, tileset, 0, 0);
    });
  }

  collectEgg(player, egg) {
    egg.disableBody(true, true);
    this.eggCount += 1;
    this.scoreText.setText("Œufs: " + this.eggCount + "/" + this.totalEggs);
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

      return;
    }

    // Détection de la tuile d'échelle sous le joueur
    const ladderLayer = this.layers["ladder_layer"];
    let isOnLadderTile = false;
    if (ladderLayer) {
      const tile = ladderLayer.getTileAtWorldXY(player.x, player.y, true);
      if (tile && tile.index !== -1) {
        isOnLadderTile = true;
      }
    }

    if (isOnLadderTile) {
      player.body.setAllowGravity(false);
      if (clavier.up.isDown) player.setVelocityY(-100);
      else if (clavier.down.isDown) player.setVelocityY(100);
      else player.setVelocityY(0);
    } else if (!isAttacking) {
      player.body.setAllowGravity(true);
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
        player.setFlipX(this.lastDirection === "right");
      }

      if (clavier.up.isDown && player.body.blocked.down) player.setVelocityY(-330);
    }

    // update IA ennemis
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.texture && enemy.texture.key === "petit_dragon") {
        fct.updateDragon(enemy, player, this);
      } else {
        fct.updateSlime(enemy, player, this);
      }
    });
  }
}
