import { createEnemies } from './enemies.js';

export const AVAILABLE_MAPS = ['map_1','map_2','map_3','map_4','map_5','map_7','map_8'];
export const TILE_SIZE = 16;

const BAR_CONFIG = {
  WIDTH: 64,
  MARGIN_LEFT: 8,
  MARGIN_RIGHT: 8,
  get USABLE_WIDTH() { return this.WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT; }
};

const UPGRADE_CONFIG = {
  bronze: [
    { type: 'health', value: 10, icon: 13, text: '+10 Vie Max' },
    { type: 'damage', value: 5, icon: 6, text: '+5 Dégâts' },
    { type: 'speed', value: 5, icon: 2, text: '+5 Vitesse' },
    { type: 'regen', value: 0.5, icon: 16, text: '+0.5/s Régén.' },
    { type: 'attackSpeed', value: 5, icon: 0, text: '+5% Vitesse Attaque' }
  ],
  silver: [
    { type: 'health', value: 20, icon: 13, text: '+20 Vie Max' },
    { type: 'damage', value: 10, icon: 6, text: '+10 Dégâts' },
    { type: 'speed', value: 10, icon: 2, text: '+10 Vitesse' },
    { type: 'regen', value: 1, icon: 16, text: '+1/s Régén.' },
    { type: 'attackSpeed', value: 10, icon: 0, text: '+10% Vitesse Attaque' }
  ],
  gold: [
    { type: 'health', value: 50, icon: 13, text: '+50 Vie Max' },
    { type: 'damage', value: 20, icon: 6, text: '+20 Dégâts' },
    { type: 'speed', value: 20, icon: 2, text: '+20 Vitesse' },
    { type: 'regen', value: 3, icon: 16, text: '+3/s Régén.' },
    { type: 'attackSpeed', value: 20, icon: 0, text: '+20% Vitesse Attaque' }
  ]
};

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const assets = [
      { type: 'spritesheet', key: 'dude', path: 'assets/dude.png', config: { frameWidth: 16, frameHeight: 16 } },
      { type: 'spritesheet', key: 'enemies', path: 'assets/enemies.png', config: { frameWidth: 16, frameHeight: 16 } },
      { type: 'spritesheet', key: 'enemies_1', path: 'assets/enemies_1.png', config: { frameWidth: 16, frameHeight: 16 } },
      { type: 'spritesheet', key: 'weapons_animated', path: 'assets/weapons_animated.png', config: { frameWidth: 48, frameHeight: 48 } },
      { type: 'spritesheet', key: 'barre', path: 'assets/barre.png', config: { frameWidth: 64, frameHeight: 16 } },
      { type: 'spritesheet', key: 'levelup', path: 'assets/levelup.png', config: { frameWidth: 48, frameHeight: 64 } },
      { type: 'spritesheet', key: 'icons_8x8', path: 'assets/icons_8x8.png', config: { frameWidth: 8, frameHeight: 8 } },
      { type: 'image', key: 'grounds', path: 'assets/grounds.png' },
      { type: 'image', key: 'props', path: 'assets/props.png' },
      { type: 'image', key: 'surground', path: 'assets/surground.png' },
      { type: 'image', key: 'walls', path: 'assets/walls.png' },
      { type: 'image', key: 'doors', path: 'assets/doors.png' }
    ];   

    assets.forEach(({ type, key, path, config }) => {
      this.load[type](key, path, config);
    });

    this.load.tilemapTiledJSON('map_spawn', 'assets/map/map_spawn.json');
    AVAILABLE_MAPS.forEach(mapName => {
      this.load.tilemapTiledJSON(mapName, `assets/map/${mapName}.json`);
    });
  }

  create() {
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.playerLevel = data?.playerLevel || 0;
  }

  create() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    this.cameras.main.setBackgroundColor('#000000');

    this.add.text(centerX, centerY - 80, 'GAME OVER', {
      fontSize: '72px',
      fill: '#ff0000',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#4a0000',
      strokeThickness: 8
    }).setOrigin(0.5);

    if (this.playerLevel > 0) {
      this.add.text(centerX, centerY + 10, `Niveau atteint: ${this.playerLevel}`, {
        fontSize: '22px',
        fill: '#d4d29b',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
    }

    this.add.text(centerX, centerY + 70, 'Appuyez sur K pour recommencer', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#8b0000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Utiliser once pour éviter les listeners multiples
    this.keyK = this.input.keyboard.addKey('K');
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.restartGame();
    }
  }

  restartGame() {
    this.scene.stop('GameOverScene');
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }

  shutdown() {
    if (this.keyK) {
      this.input.keyboard.removeKey('K');
      this.keyK = null;
    }
  }
}

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.createHealthBar();
    this.createXPBar();
    
    this.fpsText = this.add.text(10, 80, 'FPS: 60', {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setScrollFactor(0).setDepth(1001);
    
    this.lastHealthPercent = -1;
    this.lastXPPercent = -1;
    this.frameCounter = 0;
  }

  createBar(y, barFrame) {
    const container = this.add.container(10, y)
      .setDepth(1000)
      .setScale(4)
      .setScrollFactor(0);

    const frame = this.add.sprite(0, 0, 'barre', 0).setOrigin(0, 0);
    const bar = this.add.sprite(0, 0, 'barre', barFrame).setOrigin(0, 0);

    container.add([frame, bar]);
    return { container, bar };
  }

  createHealthBar() {
    const { bar } = this.createBar(10, 1);
    this.barLife = bar;
  }

  createXPBar() {
    const { bar } = this.createBar(45, 2);
    this.barXP = bar;
  }

  updateBar(bar, percent) {
    if (!bar) return;
    const visibleWidth = BAR_CONFIG.MARGIN_LEFT + (BAR_CONFIG.USABLE_WIDTH * percent);
    bar.setCrop(0, 0, visibleWidth, bar.height);
  }

  update() {
    if (!this.gameScene) return;

    const healthPercent = Phaser.Math.Clamp(this.gameScene.playerHealth / this.gameScene.maxHealth, 0, 1);
    if (Math.abs(healthPercent - this.lastHealthPercent) > 0.01) {
      this.updateBar(this.barLife, healthPercent);
      this.lastHealthPercent = healthPercent;
    }

    const xpPercent = Phaser.Math.Clamp(this.gameScene.playerXP / this.gameScene.maxXP, 0, 1);
    if (Math.abs(xpPercent - this.lastXPPercent) > 0.01) {
      this.updateBar(this.barXP, xpPercent);
      this.lastXPPercent = xpPercent;
    }
    
    if (++this.frameCounter >= 60) {
      this.fpsText.setText(`FPS: ${Math.floor(this.game.loop.actualFps)}`);
      this.frameCounter = 0;
    }
  }
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.resetGameState();
  }

  resetGameState() {
    Object.assign(this, {
      currentRoomIndex: 0,
      visitedRooms: [],
      currentMap: null,
      isFirstSpawn: true,
      roomsCleared: 0,
      playerHealth: 200,
      maxHealth: 200,
      playerXP: 0,
      maxXP: 100,
      playerSpeed: 90,
      healthRegen: 0.5,
      lastRegenTime: 0,
      doorOutLayer: null,
      tpOutZones: [],
      enemies: [],
      enemyGroup: null,
      projectilePool: null,
      isGameOver: false,
      isDying: false,
      isFalling: false,
      isAttacking: false,
      attackCooldown: 0,
      attackDelay: 750,
      attackRange: 45,
      attackRangeSq: 2025,
      attackDamage: 20,
      particlePool: [],
      enemyUpdateCounter: 0,
      playerLevel: 0,
      playerBody: null,
      swordSprite: null,
      spawnPoint: { x: 100, y: 100 },
      surgroundLayer: null,
      colliders: [],
      groundCheckCounter: 0,
      lastGroundCheckResult: true,
      teleportZones: [],
      levelUpOverlay: null,
      levelUpCards: [],
      selectedCardIndex: 1,
      isLevelingUp: false
    });
  }

  create() {
    this.resetGameState();
    this.cameras.main.setBackgroundColor('#584422');
    this.createAnimations();
    this.loadRoom('map_spawn');
    this.initParticlePool(30);
    
    // Préparer les touches pour level-up (mais ne pas les activer)
    this.keyLeft = this.input.keyboard.addKey('LEFT');
    this.keyRight = this.input.keyboard.addKey('RIGHT');
    this.keyK = this.input.keyboard.addKey('K');
    this.keyEnter = this.input.keyboard.addKey('ENTER');
  }

  initParticlePool(count) {
    for (let i = 0; i < count; i++) {
      const particle = this.add.rectangle(0, 0, 3, 3, 0xffffff);
      particle.setActive(false).setVisible(false).setDepth(100);
      this.particlePool.push(particle);
    }
  }

  getParticle() {
    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      if (!p.active) {
        return p.setActive(true).setVisible(true).setAlpha(1).setScale(1);
      }
    }
    
    const particle = this.particlePool[0];
    this.tweens.killTweensOf(particle);
    return particle.setActive(true).setVisible(true).setAlpha(1).setScale(1);
  }
  
  releaseParticle(particle) {
    if (particle?.active) {
      this.tweens.killTweensOf(particle);
      particle.setActive(false).setVisible(false);
    }
  }

  createAnimations() {
    const animations = [
      { key: 'walk', sheet: 'dude', start: 2, end: 6, frameRate: 12, repeat: -1 },
      { key: 'idle', sheet: 'dude', start: 0, end: 1, frameRate: 5, repeat: -1 },
      { key: 'death', sheet: 'dude', start: 7, end: 8, frameRate: 6, repeat: 0 },
      { key: 'fall', sheet: 'dude', start: 9, end: 15, frameRate: 10, repeat: 0 },
      { key: 'sword_slash', sheet: 'weapons_animated', start: 0, end: 4, frameRate: 30, repeat: 0 }
    ];

    animations.forEach(({ key, sheet, start, end, frameRate, repeat }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(sheet, { start, end }),
          frameRate,
          repeat
        });
      }
    });
  }

  damagePlayer(amount = 10) {
    if (this.isGameOver || this.isDying || this.isFalling || this.isLevelingUp) return;
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    
    this.player.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (this.player?.active) {
        this.player.clearTint();
      }
    });
    
    if (this.playerHealth <= 0) this.playerDeath();
  }

  playerDeath() {
    if (this.isDying) return;
    this.isDying = true;
    
    this.playerBody?.setVelocity(0, 0).setAcceleration(0, 0);
    this.enemies.forEach(e => e.sprite?.body?.setVelocity(0, 0));
    this.swordSprite?.setVisible(false);
    this.player.anims.stop();
    this.player.anims.play('death', true);
    
    this.player.once('animationcomplete', () => {
      this.time.delayedCall(1000, () => {
        this.isGameOver = true;
        this.scene.launch('GameOverScene', { playerLevel: this.playerLevel });
      });
    });
  }

  playerFall() {
    if (this.isFalling || this.isDying || this.isGameOver || this.isLevelingUp) return;
    this.isFalling = true;
    
    this.playerBody?.setVelocity(0, 0).setAcceleration(0, 0);
    this.swordSprite?.setVisible(false);
    this.player.anims.stop();
    this.player.anims.play('fall', true);
    
    this.player.once('animationcomplete', () => {
      const damage = Math.floor(this.maxHealth / 2);
      this.playerHealth = Math.max(0, this.playerHealth - damage);
      
      if (this.playerHealth <= 0) {
        this.isDying = true;
        this.isGameOver = true;
        this.scene.launch('GameOverScene', { playerLevel: this.playerLevel });
        return;
      }
      
      this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
      this.player.setAlpha(0.5);
      this.tweens.add({
        targets: this.player,
        alpha: 1,
        duration: 300,
        ease: 'Power2'
      });
      
      this.isFalling = false;
      this.player.anims.play('idle', true);
    });
  }

  healPlayer(amount) {
    this.playerHealth = Math.min(this.maxHealth, this.playerHealth + amount);
  }

  addXP(amount) {
    this.playerXP += amount;
    while (this.playerXP >= this.maxXP) {
      this.playerXP -= this.maxXP;
      this.levelUp();
    }
  }

  levelUp() {
    if (this.isLevelingUp) return;
    
    this.playerLevel++;
    this.isLevelingUp = true;
    
    // Freeze le joueur et les ennemis
    this.playerBody?.setVelocity(0, 0).setAcceleration(0, 0);
    this.enemies.forEach(e => e.sprite?.body?.setVelocity(0, 0));
    
    this.showLevelUpScreen();
  }

  showLevelUpScreen() {
    const { width, height } = this.cameras.main;
    
    // Overlay semi-transparent
    this.levelUpOverlay = this.add.rectangle(
      this.cameras.main.scrollX,
      this.cameras.main.scrollY,
      width, 
      height, 
      0x000000, 
      0.95
    ).setOrigin(0, 0).setDepth(200).setScrollFactor(0);

    // Titre
    this.add.text(width / 2, 60, 'LEVEL UP!', {
      fontSize: '52px',
      fill: '#9bbc0f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#306230',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

    // Instructions
    this.add.text(width / 2, height - 40, 'Flèches ← → | K ou ENTRÉE', {
      fontSize: '14px',
      fill: '#d4d29b',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0.7).setDepth(201).setScrollFactor(0);

    this.generateUpgradeCards();
    this.selectedCardIndex = 1;
    this.updateCardSelection();
  }

  generateUpgradeCards() {
    const { width, height } = this.cameras.main;
    const cardSpacing = 140;
    const startX = width / 2 - cardSpacing;
    const cardY = height / 2;

    const selectedRarities = Array.from({ length: 3 }, () => {
      const rand = Math.random();
      return rand < 0.70 ? 'bronze' : rand < 0.95 ? 'silver' : 'gold';
    });

    const usedUpgrades = new Set();

    selectedRarities.forEach((rarity, i) => {
      const x = startX + i * cardSpacing;
      const upgrades = UPGRADE_CONFIG[rarity];
      
      const availableUpgrades = upgrades.filter(up => !usedUpgrades.has(up.type));
      const upgrade = availableUpgrades.length > 0 
        ? Phaser.Utils.Array.GetRandom(availableUpgrades)
        : Phaser.Utils.Array.GetRandom(upgrades);
      
      usedUpgrades.add(upgrade.type);
      this.createCard(x, cardY, rarity, upgrade, i);
    });
  }

  createCard(x, y, rarity, upgrade, index) {
    const cardScale = 2;
    const rarityFrame = rarity === 'bronze' ? 0 : rarity === 'silver' ? 1 : 2;
    
    const container = this.add.container(x, y)
      .setDepth(2001)
      .setScrollFactor(0);

    const cardBg = this.add.sprite(0, 0, 'levelup', rarityFrame)
      .setScale(cardScale)
      .setOrigin(0.5, 0.5);
    container.add(cardBg);

    const icon = this.add.sprite(0, -53, 'icons_8x8', upgrade.icon)
      .setScale(cardScale)
      .setOrigin(0.5, 0.5);
    container.add(icon);

    const text = this.add.text(0, 103, upgrade.text, {
      fontSize: '16px',
      fill: '#d4d29b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    container.add(text);

    this.levelUpCards.push({ container, upgrade, index });
  }

  updateCardSelection() {
    this.levelUpCards.forEach((card, i) => {
      const isSelected = i === this.selectedCardIndex;
      card.container.setScale(isSelected ? 1.1 : 1);
    });
  }

  confirmLevelUpSelection() {
    if (!this.isLevelingUp || this.levelUpCards.length === 0) return;
    
    const selectedCard = this.levelUpCards[this.selectedCardIndex];
    this.applyUpgrade(selectedCard.upgrade);
    
    // Nettoyer l'écran de level-up
    this.hideLevelUpScreen();
  }

  applyUpgrade(upgrade) {
    switch(upgrade.type) {
      case 'health':
        this.maxHealth += upgrade.value;
        this.playerHealth += upgrade.value;
        break;
      case 'damage':
        this.attackDamage += upgrade.value;
        break;
      case 'speed':
        this.playerSpeed += upgrade.value;
        break;
      case 'regen':
        this.healthRegen += upgrade.value;
        break;
      case 'attackSpeed':
        this.attackDelay = Math.max(100, this.attackDelay * (1 - upgrade.value / 100));
        break;
    }
  }

  hideLevelUpScreen() {
    // Détruire tous les éléments visuels
    if (this.levelUpOverlay) {
      this.levelUpOverlay.destroy();
      this.levelUpOverlay = null;
    }
    
    this.levelUpCards.forEach(card => {
      if (card.container) {
        card.container.destroy();
      }
    });
    this.levelUpCards = [];
    
    // Remettre le jeu en marche
    this.isLevelingUp = false;
  }

  cleanupRoom() {
    this.tweens.killAll();
    
    for (let i = 0; i < this.colliders.length; i++) {
      const collider = this.colliders[i];
      if (collider && collider.destroy) {
        collider.destroy();
      }
    }
    this.colliders = [];
    
    for (let i = 0; i < this.teleportZones.length; i++) {
      const zone = this.teleportZones[i];
      if (zone && zone.destroy) {
        zone.destroy();
      }
    }
    this.teleportZones = [];
    
    [this.map, this.player, this.sword, this.collisionLayer, this.propsCollisionLayer, this.surgroundLayer]
      .forEach(obj => {
        if (obj) {
          if (obj.body) {
            obj.body.destroy();
          }
          obj.destroy();
        }
      });
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e && e.destroy) {
        e.destroy();
      }
    }
    this.enemies = [];
    
    if (this.enemyGroup) {
      this.enemyGroup.clear(true, true);
      this.enemyGroup = null;
    }
    
    if (this.projectilePool) {
      this.projectilePool.clear();
      this.projectilePool = null;
    }
  }

  loadRoom(mapName) {
    this.cleanupRoom();

    this.currentMap = mapName;
    this.visitedRooms.push(mapName);
    this.map = this.make.tilemap({ key: mapName });

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    const tilesets = {
      grounds: this.map.addTilesetImage('grounds', 'grounds'),
      walls: this.map.addTilesetImage('walls', 'walls'),
      surground: this.map.addTilesetImage('surground', 'surground'),
      props: this.map.addTilesetImage('props', 'props'),
      doors: this.map.addTilesetImage('doors', 'doors')
    };

    const groundsLayer = this.map.createLayer('calque_grounds', tilesets.grounds, 0, 0);
    groundsLayer.setCullPadding(2, 2);

    const wallsLayer = this.map.createLayer('calque_walls', tilesets.walls, 0, 0);
    wallsLayer.setCullPadding(2, 2);

    this.surgroundLayer = this.map.createLayer('calque_surground', tilesets.surground, 0, 0);
    this.surgroundLayer.setCullPadding(2, 2);

    const propsLayer = this.map.createLayer('calque_props', tilesets.props, 0, 0);
    propsLayer.setCullPadding(2, 2);

    if (this.map.getLayer('calque_door_in')) {
      const doorInLayer = this.map.createLayer('calque_door_in', tilesets.doors, 0, 0);
      doorInLayer.setCullPadding(2, 2);
    }

    if (this.map.getLayer('calque_door_out')) {
      this.doorOutLayer = this.map.createLayer('calque_door_out', tilesets.doors, 0, 0);
      this.doorOutLayer.setCullPadding(2, 2);
      this.doorOutLayer.setVisible(true);
    }

    wallsLayer.setCollisionByProperty({ Solide: true });
    propsLayer.setCollisionByProperty({ Solide: true });
    
    this.collisionLayer = wallsLayer;
    this.propsCollisionLayer = propsLayer;

    this.createPlayer();
    this.createEnemiesInRoom();

    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.setupTeleporters();
    
    if (this.isFirstSpawn) {
      this.isFirstSpawn = false;
    }
  }

  loadRandomRoom() {
    this.roomsCleared++;
    const availableMaps = AVAILABLE_MAPS.filter(map => map !== this.currentMap);
    const mapName = availableMaps.length > 0 
      ? Phaser.Utils.Array.GetRandom(availableMaps)
      : Phaser.Utils.Array.GetRandom(AVAILABLE_MAPS);
    this.loadRoom(mapName);
  }

  createPlayer() {
    const spawnObject = this.map.findObject('calque_joueur', obj => obj.name === 'spawn_joueur');
    const { x, y } = spawnObject || { x: 100, y: 100 };
    
    this.spawnPoint = { x, y };

    this.player = this.physics.add.sprite(x, y, 'dude')
      .setCollideWorldBounds(true);
    this.playerBody = this.player.body;
    this.playerBody.setSize(12, 14).setOffset(2, 2);

    this.sword = this.add.sprite(x, y, 'weapons_animated')
      .setVisible(false)
      .setDepth(10)
      .setOrigin(0.5, 0.5);
    this.swordSprite = this.sword;

    const playerCollider = this.physics.add.collider(this.player, [this.collisionLayer, this.propsCollisionLayer]);
    this.colliders.push(playerCollider);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.player.anims.play('idle', true);
  }

  createEnemiesInRoom() {
    const roomsCleared = this.roomsCleared || 0;
    this.enemies = createEnemies(this, roomsCleared);
    this.enemyGroup = this.physics.add.group();
    this.enemies.forEach(e => this.enemyGroup.add(e.sprite));

    const enemyWallCollider = this.physics.add.collider(
      this.enemyGroup, 
      [this.collisionLayer, this.propsCollisionLayer],
      (enemySprite) => enemySprite.enemyRef?.onWallCollision()
    );
    this.colliders.push(enemyWallCollider);

    const enemyPlayerCollider = this.physics.add.overlap(
      this.player, 
      this.enemyGroup,
      (player, enemySprite) => enemySprite.enemyRef?.onPlayerContact(player)
    );
    this.colliders.push(enemyPlayerCollider);
  }

  update(time) {
    if (!this.player || this.isGameOver || this.isDying || this.isFalling) return;

    // Gestion du level-up
    if (this.isLevelingUp) {
      this.updateLevelUpInput();
      return;
    }

    this.updatePlayer();
    
    if (++this.groundCheckCounter >= 5) {
      this.checkGroundSupport();
      this.groundCheckCounter = 0;
    }
    
    this.updateHealthRegen(time);
    
    if (++this.enemyUpdateCounter >= 6) {
      this.updateEnemiesOptimized(time);
      this.enemyUpdateCounter = 0;
    }
    
    if (this.projectilePool) {
      this.projectilePool.updateAll(this.player, this.collisionLayer, this.propsCollisionLayer);
    }
    
    this.updateAutoAttack();
  }

  updateLevelUpInput() {
    // Navigation avec les flèches
    if (Phaser.Input.Keyboard.JustDown(this.keyLeft)) {
      this.selectedCardIndex = Math.max(0, this.selectedCardIndex - 1);
      this.updateCardSelection();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyRight)) {
      this.selectedCardIndex = Math.min(2, this.selectedCardIndex + 1);
      this.updateCardSelection();
    }

    // Confirmation avec K ou ENTER
    if (Phaser.Input.Keyboard.JustDown(this.keyK) || Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
      this.confirmLevelUpSelection();
    }
  }

  updateEnemiesOptimized(time) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.isAlive()) {
        e.destroy();
        this.enemies.splice(i, 1);
        continue;
      }
    }
    
    const cam = this.cameras.main;
    const viewRadius = Math.max(cam.width, cam.height) / cam.zoom + 100;
    const viewRadiusSq = viewRadius * viewRadius;
    const px = this.player.x;
    const py = this.player.y;
    
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      const dx = e.sprite.x - px;
      const dy = e.sprite.y - py;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < viewRadiusSq) {
        e.update(this.player, time);
      } else {
        e.sprite.body?.setVelocity(0, 0);
      }
    }

    const hasAliveEnemies = this.enemies.some(e => e.isAlive());

    if (this.doorOutLayer) {
      this.doorOutLayer.setVisible(hasAliveEnemies);
    }

    this.updateTpOutCollisions();
  }

  checkGroundSupport() {
    if (!this.surgroundLayer) return;
    
    const playerBody = this.player.body;
    const playerWidth = playerBody.width;
    const playerHeight = playerBody.height;
    
    const centerMarginX = playerWidth * 0.60;
    const centerMarginY = playerHeight * 0.50;
    
    const centerLeft = playerBody.left + centerMarginX;
    const centerRight = playerBody.right - centerMarginX;
    const centerTop = playerBody.top + centerMarginY;
    const centerBottom = playerBody.bottom - centerMarginY;
    
    const tileLeftX = Math.floor(centerLeft / TILE_SIZE);
    const tileRightX = Math.floor(centerRight / TILE_SIZE);
    const tileTopY = Math.floor(centerTop / TILE_SIZE);
    const tileBottomY = Math.floor(centerBottom / TILE_SIZE);
    
    let hasSolidSupport = false;
    let hasTiles = false;
    
    for (let tileX = tileLeftX; tileX <= tileRightX && !hasSolidSupport; tileX++) {
      for (let tileY = tileTopY; tileY <= tileBottomY && !hasSolidSupport; tileY++) {
        const tile = this.surgroundLayer.getTileAt(tileX, tileY);
        if (tile && tile.index !== -1) {
          hasTiles = true;
          if (!tile.properties || !tile.properties.fall) {
            hasSolidSupport = true;
          }
        }
      }
    }
    
    if (hasTiles && !hasSolidSupport) {
      this.playerFall();
    }
  }

  updateHealthRegen(time) {
    if (this.healthRegen > 0 && this.playerHealth < this.maxHealth && time - this.lastRegenTime >= 1000) {
      this.healPlayer(this.healthRegen);
      this.lastRegenTime = time;
    }
  }

  updatePlayer() {
    const { left, right, up, down } = this.cursors;
    this.playerBody.setDrag(600).setMaxVelocity(this.playerSpeed);

    const vx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
    const vy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);

    if (vx) this.player.setFlipX(vx < 0);

    if (vx || vy) {
      if (vx && vy) {
        const invLen = 1 / Math.sqrt(vx * vx + vy * vy);
        this.playerBody.setAcceleration(vx * invLen * 500, vy * invLen * 500);
      } else {
        this.playerBody.setAcceleration(vx * 500, vy * 500);
      }
      
      if (this.player.anims.currentAnim?.key !== 'walk') {
        this.player.anims.play('walk', true);
      }
    } else {
      this.playerBody.setAcceleration(0);
      if (this.player.anims.currentAnim?.key !== 'idle') {
        this.player.anims.play('idle', true);
      }
    }
  }

  findClosestEnemy() {
    if (!this.enemies.length) return null;

    let closest = null;
    let minDistSq = this.attackRangeSq;
    const px = this.player.x;
    const py = this.player.y;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      
      const alive = e.isAlive();
      if (!alive) continue;
      
      const dx = e.sprite.x - px;
      const dy = e.sprite.y - py;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = e;
      }
    }

    return closest;
  }

  updateAutoAttack() {
    const now = this.time.now;
    if (this.isAttacking || now < this.attackCooldown) return;

    const target = this.findClosestEnemy();
    if (!target) return;

    this.isAttacking = true;
    this.attackCooldown = now + this.attackDelay;

    const angle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y,
      target.sprite.x, target.sprite.y
    );

    this.swordSprite.setPosition(this.player.x, this.player.y)
      .setVisible(true)
      .setRotation(angle + Math.PI)
      .setFlipY(Math.abs(angle) <= Math.PI / 2)
      .play('sword_slash');

    this.swordSprite.once('animationcomplete', () => {
      this.swordSprite.setVisible(false);
      this.isAttacking = false;

      const px = this.player.x;
      const py = this.player.y;
      
      const attackAngle = angle;
      const coneAngle = Math.PI / 3;
      const attackRangeSq = this.attackRangeSq;

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        
        const alive = e.isAlive();
        if (!alive) continue;
        
        const dx = e.sprite.x - px;
        const dy = e.sprite.y - py;
        const distSq = dx * dx + dy * dy;

        if (distSq > attackRangeSq) continue;

        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(enemyAngle - attackAngle);
        
        if (angleDiff > Math.PI) {
          angleDiff = 2 * Math.PI - angleDiff;
        }

        if (angleDiff <= coneAngle / 2) {
          e.takeDamage(this.attackDamage, px, py);
        }
      }
    });
  }

  setupTeleporters() {
    const allObjects = this.map.getObjectLayer('calque_joueur')?.objects || [];
    const teleporters = allObjects.filter(obj => obj.name && obj.name.startsWith('tp_'));
    
    teleporters.forEach(tp => {
      const zone = this.add.zone(tp.x, tp.y, tp.width, tp.height).setOrigin(0, 0);
      this.physics.world.enable(zone);
      this.teleportZones.push(zone);
      
      const tpCollider = this.physics.add.overlap(this.player, zone, () => {
        const now = this.time.now;
        
        if (this.isGameOver || this.isDying || this.isFalling || now < this.teleportCooldown) {
          return;
        }
        
        const tpNumber = parseInt(tp.name.split('_')[1]);
        
        if (tpNumber % 2 === 1) {
          const targetTpName = `tp_${tpNumber + 1}`;
          const targetTp = allObjects.find(obj => obj.name === targetTpName);
          
          if (targetTp) {
            this.teleportCooldown = now + 500;  
            this.player.setPosition(targetTp.x + targetTp.width / 2, targetTp.y + targetTp.height / 2);
            this.player.setAlpha(0.3);
            this.tweens.add({
              targets: this.player,
              alpha: 1,
              duration: 200,
              ease: 'Power2'
            });
          }
        }
        else {
          const targetTpName = `tp_${tpNumber - 1}`;
          const targetTp = allObjects.find(obj => obj.name === targetTpName);
          
          if (targetTp) {
            this.teleportCooldown = now + 2000;
            
            this.player.setPosition(targetTp.x + targetTp.width / 2, targetTp.y + targetTp.height / 2);
            
            this.player.setAlpha(0.3);
            this.tweens.add({
              targets: this.player,
              alpha: 1,
              duration: 200,
              ease: 'Power2'
            });
          }
        }
      });
      this.colliders.push(tpCollider);
    });
    
    const tpOuts = allObjects.filter(obj => obj.type === 'tp_out');
    tpOuts.forEach(tp => {
      const zone = this.add.zone(tp.x, tp.y, tp.width, tp.height).setOrigin(0, 0);
      this.physics.world.enable(zone);
      this.tpOutZones.push(zone);
      
      zone.tpCollider = this.physics.add.overlap(this.player, zone, () => {
        if (this.isGameOver || this.isDying || this.isFalling) {
          return;
        }
        
        const hasAliveEnemies = this.enemies.some(e => e.isAlive());
        
        if (hasAliveEnemies) {
          return;
        }
        
        this.loadRandomRoom();
      });
      this.colliders.push(zone.tpCollider);
    });
  }

  updateTpOutCollisions() {
    const hasAliveEnemies = this.enemies.some(e => e.isAlive());
    
    this.tpOutZones.forEach(zone => {
      if (zone.tpCollider) {
        zone.tpCollider.active = !hasAliveEnemies;
      }
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.cleanupRoom();
    
    // Nettoyer le level-up screen si actif
    this.hideLevelUpScreen();
    
    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      this.tweens.killTweensOf(p);
      p.destroy();
    }
    this.particlePool = [];
    
    // Nettoyer les touches
    if (this.keyLeft) {
      this.input.keyboard.removeKey('LEFT');
      this.keyLeft = null;
    }
    if (this.keyRight) {
      this.input.keyboard.removeKey('RIGHT');
      this.keyRight = null;
    }
    if (this.keyK) {
      this.input.keyboard.removeKey('K');
      this.keyK = null;
    }
    if (this.keyEnter) {
      this.input.keyboard.removeKey('ENTER');
      this.keyEnter = null;
    }
  }
}