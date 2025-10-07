import * as fct from "./fonctions.js";

export default class BaseLevel extends Phaser.Scene {
  constructor(key, mapKey) {
    super({ key });
    this.mapKey = mapKey;
    this.portals = []; // [{x, y, nextScene}]
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Maps
    this.load.tilemapTiledJSON(this.mapKey, `assets/${this.mapKey}.json`);
    this.load.image("tileset-image", "assets/tileset_map.png");

    // Images
    this.load.image("img_ciel", "assets/fond1.png");
    this.load.image("oeuf", "assets/oeuf.png");
    this.load.image("potion", "assets/potion.png");
    this.load.image("coeur", "assets/coeur.png");
    this.load.image("img_porte", "assets/portail.png");

    // Joueur
    this.load.spritesheet("img_perso", "assets/dude.png", {
      frameWidth: 64,
      frameHeight: 74,
    });
    this.load.spritesheet("img_perso_attaque", "assets/attack.png", {
      frameWidth: 64,
      frameHeight: 74,
    });

    // Ennemis
    fct.preloadDragon(this);
    fct.preloadSlimes(this);
  }

  create() {
    // Fond
    this.add.image(0, 0, "img_ciel").setOrigin(0, 0).setScrollFactor(0);

    // Map
    const map = this.make.tilemap({ key: this.mapKey });
    const tileset = map.addTilesetImage("Tileset SAE301", "tileset-image");

    const platformLayer = map.createLayer("platform_layer", tileset);
    const deathLayer = map.createLayer("death_layer", tileset);
    platformLayer.setCollisionByExclusion([-1], true);
    deathLayer.setCollisionByExclusion([-1], true);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Joueur
    this.player = this.physics.add.sprite(100, 480, "img_perso");
    this.player.setBounce(0.2).setCollideWorldBounds(true);
    this.player.setDisplaySize(48, 55);
    this.player.body.setSize(48, 55);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.lastDirection = "right";

    // Animations
    this.createPlayerAnims();

    // Groupes
    this.enemies = this.physics.add.group();
    this.eggs = this.physics.add.group();
    this.potions = this.physics.add.group();

    // Hitbox attaque
    this.attackHitbox = this.createAttackHitbox();

    // Charger objets Tiled
    this.loadTiledObjects(map);

    // Colliders
    this.physics.add.collider(this.player, platformLayer);
    this.physics.add.collider(this.enemies, platformLayer);
    this.physics.add.collider(this.eggs, platformLayer);
    this.physics.add.collider(this.potions, platformLayer);

    // Dégâts si chute
    this.physics.add.collider(this.player, deathLayer, () => this.takeDamage());

    // Overlaps
    this.physics.add.overlap(
      this.attackHitbox,
      this.enemies,
      (_, enemy) => this.hitEnemy(enemy)
    );
    this.physics.add.overlap(this.player, this.enemies, (p, enemy) => {
      this.takeDamage();
      p.setVelocityX(p.x < enemy.x ? -200 : 200);
    });
    this.physics.add.overlap(this.player, this.eggs, this.collectEgg, null, this);
    this.physics.add.overlap(
      this.player,
      this.potions,
      this.collectPotion,
      null,
      this
    );

    // Input
    this.clavier = this.input.keyboard.createCursorKeys();
    this.toucheAttaque = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.I
    );

    // UI
    this.initUI();

    // Autres layers (optionnels)
    this.layers = {};
    ["platform_layer", "death_layer", "decoration_back_layer", "ladder_layer"].forEach(
      (layerName) => {
        this.layers[layerName] = map.createLayer(layerName, tileset);
      }
    );

    // Portails spécifiques à ce niveau
    this.createPortals();
  }

  // --- ANIMATIONS ---
  createPlayerAnims() {
    this.anims.create({
      key: "anim_tourne",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "anim_attaque",
      frames: this.anims.generateFrameNumbers("img_perso_attaque", {
        start: 0,
        end: 4,
      }),
      frameRate: 10,
      repeat: 0,
    });
  }

  // --- HITBOX ATTAQUE ---
  createAttackHitbox() {
    const hitbox = this.physics.add
      .sprite(this.player.x, this.player.y, null)
      .setOrigin(0.5, 0.5);
    hitbox.body.setSize(40, 20);
    hitbox.body.allowGravity = false;
    hitbox.setVisible(false);
    hitbox.active = false;
    hitbox.body.enable = false;
    return hitbox;
  }

  // --- OBJETS TILED ---
  loadTiledObjects(map) {
    const objectLayer = map.getObjectLayer("objects_layer");
    if (!objectLayer) return;

    objectLayer.objects.forEach((obj) => {
      if (obj.name === "slime") fct.createSlime(this, obj.x, obj.y);
      if (obj.name === "dragon") fct.createDragon(this, obj.x, obj.y);
      if (obj.name === "oeuf") this.createItem(this.eggs, obj, "oeuf", 30, 0.3);
      if (obj.name === "potion")
        this.createItem(this.potions, obj, "potion", 30, 0);
    });
  }

  createItem(group, obj, key, size, bounce = 0) {
    const item = group.create(obj.x, obj.y, key);
    item.setDisplaySize(size, size).setOrigin(0, 1).setBounce(bounce);
    return item;
  }

  // --- UI ---
  initUI() {
    this.hp = 3;
    this.maxHp = 3;
    this.score = 0;

    this.ui_hearts = this.add.group();
    for (let i = 0; i < this.maxHp; i++) {
      const heart = this.add.image(50 + i * 40, 50, "coeur").setScrollFactor(0);
      this.ui_hearts.add(heart);
    }

    this.scoreText = this.add
      .text(16, 100, "Score: 0", {
        fontSize: "32px",
        fill: "#fff",
      })
      .setScrollFactor(0);
  }

  // --- COLLECTIBLES ---
  collectEgg(_, egg) {
    egg.destroy();
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);
  }

  collectPotion(_, potion) {
    potion.destroy();
    if (this.hp < this.maxHp) {
      this.hp++;
      this.updateHearts();
    }
  }

  // --- VIE / DÉGÂTS ---
  takeDamage() {
    this.hp--;
    this.updateHearts();
    if (this.hp <= 0) {
      this.scene.restart();
    }
  }

  updateHearts() {
    this.ui_hearts.getChildren().forEach((heart, i) => {
      heart.setVisible(i < this.hp);
    });
  }

  // --- COMBAT ---
  hitEnemy(enemy) {
    enemy.destroy();
    this.score += 20;
    this.scoreText.setText("Score: " + this.score);
  }

  // --- PORTAILS ---
  createPortals() {
    this.portals.forEach((p) => {
      p.sprite = this.physics.add
        .staticSprite(p.x, p.y, "img_porte")
        .setOrigin(0.5, 1);
    });
  }

  checkPortals() {
    this.portals.forEach((p) => {
      if (
        Phaser.Input.Keyboard.JustDown(this.clavier.space) &&
        this.physics.overlap(this.player, p.sprite)
      ) {
        this.scene.switch(p.nextScene);
      }
    });
  }

  // --- UPDATE ---
  update() {
    const isAttacking =
      this.player.anims.currentAnim?.key === "anim_attaque" &&
      this.player.anims.isPlaying;

    // Attaque
    if (Phaser.Input.Keyboard.JustDown(this.toucheAttaque) && !isAttacking) {
      this.player
        .setVelocityX(0)
        .setFlipX(this.lastDirection === "right")
        .anims.play("anim_attaque", true);

      this.attackHitbox.setPosition(
        this.player.x + (this.lastDirection === "right" ? 40 : -40),
        this.player.y
      );
      this.attackHitbox.active = this.attackHitbox.body.enable = true;
      this.time.delayedCall(
        200,
        () => (this.attackHitbox.active = this.attackHitbox.body.enable = false)
      );
      return;
    }

    // Déplacement
    this.handleMovement(isAttacking);

    // IA ennemis
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.texture.key === "petit_dragon")
        fct.updateDragon(enemy, this.player, this);
      else fct.updateSlime(enemy, this.player, this);
    });

    // Vérifier portails
    this.checkPortals();
  }

  handleMovement(isAttacking) {
    if (isAttacking) {
      this.player.setVelocityX(0);
      return;
    }
    if (this.clavier.left.isDown) this.movePlayer(-160, "anim_tourne", "left");
    else if (this.clavier.right.isDown)
      this.movePlayer(160, "anim_tourne", "right");
    else this.movePlayer(0, null, this.lastDirection);

    if (this.clavier.up.isDown && this.player.body.onFloor())
      this.player.setVelocityY(-330);
  }

  movePlayer(velocityX, anim, dir) {
    this.player.setVelocityX(velocityX);
    if (anim) {
      this.player.anims.play(anim, true);
      this.player.setFlipX(dir === "left");
      this.lastDirection = dir;
    } else this.player.anims.stop();
  }
}
