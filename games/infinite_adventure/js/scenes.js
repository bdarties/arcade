import { createEnemies } from './enemies.js';
import { LevelUpScene } from './levelup.js';

export const AVAILABLE_MAPS = ['map_1','map_2','map_3','map_4','map_5','map_6','map_7','map_8','map_9','map_10','map_11','map_12'];
export const MINIBOSS_MAP = ['map_17', 'map_18']; 
export const TILE_SIZE = 16;

const BAR_CONFIG = {
  WIDTH: 64,
  MARGIN_LEFT: 8,
  MARGIN_RIGHT: 8,
  get USABLE_WIDTH() { return this.WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT; }
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
  MINIBOSS_MAP.forEach(mapName => {
    this.load.tilemapTiledJSON(mapName, `assets/map/${mapName}.json`);
  });
}

  create() {
    if (!this.scene.get('LevelUpScene')) {
      this.scene.add('LevelUpScene', LevelUpScene, false);
    }
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
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

    const gameScene = this.scene.get('GameScene');
    if (gameScene?.playerLevel) {
      this.add.text(centerX, centerY + 10, `Niveau atteint: ${gameScene.playerLevel}`, {
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

    this.input.keyboard.once('keydown-K', () => {
      if (gameScene) {
        gameScene.physics.resume();
        gameScene.anims.resumeAll();
      }
      
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }

  shutdown() {
    this.input.keyboard.removeAllListeners();
  }
}

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    
    this.player1HUD = [];
    this.player2HUD = [];
    
    this.createHealthBar(10, 10, 1, false);
    this.createXPBar(10, 45, 2, false);
    
    if (this.gameScene?.isCoopMode) {
      const rightX = this.cameras.main.width - 274;
      this.createHealthBar(rightX, 10, 1, true);
      this.createXPBar(rightX, 45, 2, true);
    }
    
    this.fpsText = this.add.text(10, 80, 'FPS: 60', {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setScrollFactor(0).setDepth(1001);
    
    this.lastHealthPercent = -1;
    this.lastXPPercent = -1;
    this.lastHealth2Percent = -1;
    this.lastXP2Percent = -1;
    this.frameCounter = 0;
  }

  createHealthBar(x, y, barFrame, isPlayer2 = false) {
    const { bar, container } = this.createBar(x, y, barFrame);
    if (isPlayer2) {
      this.barLife2 = bar;
      this.player2HUD.push(container);
    } else {
      this.barLife = bar;
      this.player1HUD.push(container);
    }
  }

  createXPBar(x, y, barFrame, isPlayer2 = false) {
    const { bar, container } = this.createBar(x, y, barFrame);
    if (isPlayer2) {
      this.barXP2 = bar;
      this.player2HUD.push(container);
    } else {
      this.barXP = bar;
      this.player1HUD.push(container);
    }
  }

  createBar(x, y, barFrame) {
    const container = this.add.container(x, y)
      .setDepth(1000)
      .setScale(4)
      .setScrollFactor(0);

    const frame = this.add.sprite(0, 0, 'barre', 0).setOrigin(0, 0);
    const bar = this.add.sprite(0, 0, 'barre', barFrame).setOrigin(0, 0);

    container.add([frame, bar]);
    return { container, bar };
  }

  updateBar(bar, percent) {
    if (!bar) return;
    const visibleWidth = BAR_CONFIG.MARGIN_LEFT + (BAR_CONFIG.USABLE_WIDTH * percent);
    bar.setCrop(0, 0, visibleWidth, bar.height);
  }

  update() {
    if (!this.gameScene) return;

    const p1Alive = this.gameScene.player && !this.gameScene.isDying && this.gameScene.playerHealth > 0;
    const p2Alive = this.gameScene.isCoopMode && this.gameScene.player2 && !this.gameScene.isPlayer2Dying && this.gameScene.player2Health > 0;

    if (p1Alive) {
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
    } else {
      this.player1HUD.forEach(obj => obj.setVisible(false));
    }

    if (this.gameScene.isCoopMode) {
      if (p2Alive) {
        const health2Percent = Phaser.Math.Clamp(this.gameScene.player2Health / this.gameScene.maxHealth, 0, 1);
        if (Math.abs(health2Percent - this.lastHealth2Percent) > 0.01) {
          this.updateBar(this.barLife2, health2Percent);
          this.lastHealth2Percent = health2Percent;
        }

        const xp2Percent = Phaser.Math.Clamp(this.gameScene.player2XP / this.gameScene.maxXP, 0, 1);
        if (Math.abs(xp2Percent - this.lastXP2Percent) > 0.01) {
          this.updateBar(this.barXP2, xp2Percent);
          this.lastXP2Percent = xp2Percent;
        }
      } else {
        this.player2HUD.forEach(obj => obj.setVisible(false));
      }
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
      playerHealth: 250,
      maxHealth: 250,
      playerXP: 0,
      maxXP: 100,
      playerSpeed: 90,
      healthRegen: 1,
      lastRegenTime: 0,
      player2Health: 250,
      player2XP: 0,
      player2Speed: 90,
      lastRegen2Time: 0,
      doorOutLayer: null,
      tpOutZones: [],
      enemies: [],
      enemyGroup: null,
      projectilePool: null,
      isGameOver: false,
      isDying: false,
      isFalling: false,
      isPlayer2Dying: false,
      isPlayer2Falling: false,
      isAttacking: false,
      attackCooldown: 0,
      attackDelay: 750,
      attackRange: 45,
      attackRangeSq: 1850,
      attackDamage: 20,
      particlePool: [],
      enemyUpdateCounter: 0,
      playerLevel: 0,
      player2Level: 0,
      playerBody: null,
      swordSprite: null,
      player2: null,
      player2Body: null,
      sword2Sprite: null,
      isPlayer2Attacking: false,
      attackCooldown2: 0,
      player2Keys: null,
      cameraFollowTarget: null,
      spawnPoint: { x: 100, y: 100 },
      surgroundLayer: null,
      colliders: [],
      groundCheckCounter: 0,
      lastGroundCheckResult: true,
      teleportZones: [],
      teleportCooldown: 0,
      teleport2Cooldown: 0,
      lastDamageTime: 0,
      lastPlayer2DamageTime: 0
    });
  }

  create() {
    this.isCoopMode = this.registry.get('isCoopMode') || false;
    this.resetGameState();
    this.cameras.main.setBackgroundColor('#584422');
    this.createAnimations();
    this.loadRoom('map_spawn');
    this.initParticlePool(30);
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

  damagePlayer(amount = 10, playerIndex = 1) {
  if (this.isGameOver) return;
  
  const now = this.time.now;
  const damageThrottleTime = 300;
  
  const isPlayer2 = playerIndex === 2;
  
  if (isPlayer2) {
    if (this.isPlayer2Dying || this.isPlayer2Falling) return;
    
    if (now - this.lastPlayer2DamageTime < damageThrottleTime) return;
    
    this.lastPlayer2DamageTime = now;
    this.player2Health = Math.max(0, this.player2Health - amount);
    
    this.player2.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (this.player2?.active) {
        this.player2.clearTint();
        this.player2.setTint(0x00ff00);
      }
    });
    
    if (this.player2Health <= 0) this.playerDeath(true);
  } else {
    if (this.isDying || this.isFalling) return;
    
    if (now - this.lastDamageTime < damageThrottleTime) return;
    
    this.lastDamageTime = now;
    this.playerHealth = Math.max(0, this.playerHealth - amount);
    
    this.player.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (this.player?.active) {
        this.player.clearTint();
      }
    });
    
    if (this.playerHealth <= 0) this.playerDeath(false);
  }
}

  playerDeath(isPlayer2 = false) {
    if (isPlayer2) {
      if (this.isPlayer2Dying) return;
      this.isPlayer2Dying = true;
      
      this.player2Body?.setVelocity(0, 0).setAcceleration(0, 0);
      this.sword2Sprite?.setVisible(false);
      this.player2.anims.stop();
      this.player2.anims.play('death', true);
      
      this.player2.once('animationcomplete', () => {
        this.player2.setVisible(false);
        this.player2.body.enable = false;
        
        if (this.isDying || !this.player || this.playerHealth <= 0) {
          this.checkGameOver();
        }
      });
    } else {
      if (this.isDying) return;
      this.isDying = true;
      
      this.playerBody?.setVelocity(0, 0).setAcceleration(0, 0);
      this.swordSprite?.setVisible(false);
      this.player.anims.stop();
      this.player.anims.play('death', true);
      
      this.player.once('animationcomplete', () => {
        this.player.setVisible(false);
        this.player.body.enable = false;
        
        if (!this.isCoopMode || this.isPlayer2Dying || !this.player2 || this.player2Health <= 0) {
          this.checkGameOver();
        }
      });
    }
  }

  checkGameOver() {
    if (this.isGameOver) return;
    
    const p1Dead = this.isDying || !this.player || this.playerHealth <= 0;
    const p2Dead = !this.isCoopMode || this.isPlayer2Dying || !this.player2 || this.player2Health <= 0;
    
    if (p1Dead && p2Dead) {
      this.time.delayedCall(1000, () => {
        this.isGameOver = true;
        this.tweens.killAll();
        this.physics.pause();
        this.anims.pauseAll();
        this.scene.pause('GameScene');
        this.scene.launch('GameOverScene');
      });
    }
  }

  playerFall(isPlayer2 = false) {
    if (this.isGameOver) return;
    if (isPlayer2) {
      if (this.isPlayer2Falling || this.isPlayer2Dying) return;
      this.isPlayer2Falling = true;
      
      this.player2Body?.setVelocity(0, 0).setAcceleration(0, 0);
      this.sword2Sprite?.setVisible(false);
      this.player2.anims.stop();
      this.player2.anims.play('fall', true);
      
      this.player2.once('animationcomplete', () => {
        const damage = Math.floor(this.maxHealth / 2);
        this.player2Health = Math.max(0, this.player2Health - damage);
        
        if (this.player2Health <= 0) {
          this.playerDeath(true);
          return;
        }
        
        this.player2.setPosition(this.spawnPoint.x + 5, this.spawnPoint.y);
        this.player2.setAlpha(0.5);
        this.tweens.add({
          targets: this.player2,
          alpha: 1,
          duration: 300,
          ease: 'Power2'
        });
        
        this.isPlayer2Falling = false;
        this.player2.anims.play('idle', true);
      });
    } else {
      if (this.isFalling || this.isDying) return;
      this.isFalling = true;
      
      this.playerBody?.setVelocity(0, 0).setAcceleration(0, 0);
      this.swordSprite?.setVisible(false);
      this.player.anims.stop();
      this.player.anims.play('fall', true);
      
      this.player.once('animationcomplete', () => {
        const damage = Math.floor(this.maxHealth / 2);
        this.playerHealth = Math.max(0, this.playerHealth - damage);
        
        if (this.playerHealth <= 0) {
          this.playerDeath(false);
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
  }

  healPlayer(amount, isPlayer2 = false) {
    if (isPlayer2) {
      this.player2Health = Math.min(this.maxHealth, this.player2Health + amount);
    } else {
      this.playerHealth = Math.min(this.maxHealth, this.playerHealth + amount);
    }
  }

  addXP(amount, isPlayer2 = false) {
    if (isPlayer2) {
      this.player2XP += amount;
      while (this.player2XP >= this.maxXP) {
        this.player2XP -= this.maxXP;
        this.levelUp(true);
      }
    } else {
      this.playerXP += amount;
      while (this.playerXP >= this.maxXP) {
        this.playerXP -= this.maxXP;
        this.levelUp(false);
      }
    }
  }

  levelUp(isPlayer2 = false) {
    if (isPlayer2) {
      this.player2Level++;
    } else {
      this.playerLevel++;
    }
    
    this.tweens.killAll();
    this.physics.pause();

    this.player?.anims?.pause();
    this.player2?.anims?.pause();
    this.enemies.forEach(e => e.sprite?.anims?.pause());

    const overlay = this.add.rectangle(
      this.cameras.main.scrollX + this.cameras.main.width / 2,
      this.cameras.main.scrollY + this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0
    ).setScrollFactor(0).setDepth(200);
    
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.scene.pause('GameScene');
        
        if (!this.scene.get('LevelUpScene')) {
          this.scene.add('LevelUpScene', LevelUpScene, true);
        } else {
          this.scene.launch('LevelUpScene');
        }
        
        this.time.delayedCall(100, () => {
          this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => overlay.destroy()
          });
        });
      }
    });
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
    
    [this.map, this.player, this.player2, this.sword, this.sword2, this.collisionLayer, this.propsCollisionLayer, this.surgroundLayer]
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
    
    this.lastDamageTime = 0;
    this.lastPlayer2DamageTime = 0;

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
    this.createPlayer2();
    this.createEnemiesInRoom();

    if (this.isCoopMode && this.player2) {
      if (!this.cameraFollowTarget) {
        this.cameraFollowTarget = this.add.rectangle(0, 0, 1, 1, 0x000000, 0);
      }
      this.cameras.main.startFollow(this.cameraFollowTarget, true, 0.08, 0.08);
    } else {
      this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    }

    this.cameras.main.setZoom(3);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.setupTeleporters();
    
    if (this.isFirstSpawn) {
      this.isFirstSpawn = false;
    }
  }

  loadRandomRoom() {
  this.roomsCleared++;
  
  if (this.roomsCleared % 3 === 0) {
    const minibossMap = Phaser.Utils.Array.GetRandom(MINIBOSS_MAP);
    this.loadRoom(minibossMap);
    return;
  }
  
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

  createPlayer2() {
    if (!this.isCoopMode) return;
    if (this.isPlayer2Dying || this.player2Health <= 0) return;
    
    const { x, y } = this.spawnPoint;
    
    this.player2 = this.physics.add.sprite(x + 5, y, 'dude')
      .setCollideWorldBounds(true)
      .setTint(0x00ff00);
    
    this.player2Body = this.player2.body;
    this.player2Body.setSize(12, 14).setOffset(2, 2);
    
    this.sword2 = this.add.sprite(x, y, 'weapons_animated')
      .setVisible(false)
      .setDepth(10)
      .setTint(0x00ff00);
    this.sword2Sprite = this.sword2;
    
    const collider = this.physics.add.collider(this.player2, [this.collisionLayer, this.propsCollisionLayer]);
    this.colliders.push(collider);
    
    if (!this.player2Keys) {
      this.player2Keys = this.input.keyboard.addKeys('Z,Q,S,D');
    }
    
    this.player2.anims.play('idle', true);
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
      (player, enemySprite) => {
        if (enemySprite.enemyRef && player === this.player) {
          this.damagePlayer(5, false);
        }
      }
    );
    this.colliders.push(enemyPlayerCollider);

    if (this.isCoopMode && this.player2) {
      const enemyPlayer2Collider = this.physics.add.overlap(
        this.player2, 
        this.enemyGroup,
        (player, enemySprite) => {
          if (enemySprite.enemyRef && player === this.player2) {
            this.damagePlayer(5, true);
          }
        }
      );
      this.colliders.push(enemyPlayer2Collider);
    }
  }

  update(time) {
    if (this.isGameOver) return;
    
    const p1Alive = this.player && !this.isDying && !this.isFalling;
    const p2Alive = this.isCoopMode && this.player2 && !this.isPlayer2Dying && !this.isPlayer2Falling;

    if (!p1Alive && !p2Alive) return;

    if (p1Alive) {
      this.updatePlayer();
    }
    
    if (p2Alive) {
      this.updatePlayer2();
    }
    
    this.updateCameraTarget();
    
    if (++this.groundCheckCounter >= 5) {
      if (p1Alive) this.checkGroundSupport(false);
      if (p2Alive) this.checkGroundSupport(true);
      this.groundCheckCounter = 0;
    }
    
    this.updateHealthRegen(time);
    
    if (++this.enemyUpdateCounter >= 6) {
      this.updateEnemiesOptimized(time);
      this.enemyUpdateCounter = 0;
    }
    
    if (this.projectilePool) {
      const p2 = this.isCoopMode ? this.player2 : null;
      this.projectilePool.updateAll(this.player, p2, this.collisionLayer, this.propsCollisionLayer);
    }
    
    if (p1Alive) {
      this.updateAutoAttack();
    }
    
    if (p2Alive) {
      this.updatePlayer2AutoAttack();
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
    
    const p1Alive = this.player && !this.isDying && this.playerHealth > 0;
    const p2Alive = this.isCoopMode && this.player2 && !this.isPlayer2Dying && this.player2Health > 0;
    
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      
      // MODIFICATION : Cibler le joueur le plus proche
      let targetPlayer = null;
      
      if (p1Alive && p2Alive) {
        const dx1 = e.sprite.x - this.player.x;
        const dy1 = e.sprite.y - this.player.y;
        const dist1Sq = dx1 * dx1 + dy1 * dy1;
        
        const dx2 = e.sprite.x - this.player2.x;
        const dy2 = e.sprite.y - this.player2.y;
        const dist2Sq = dx2 * dx2 + dy2 * dy2;
        
        targetPlayer = dist1Sq < dist2Sq ? this.player : this.player2;
      } else if (p1Alive) {
        targetPlayer = this.player;
      } else if (p2Alive) {
        targetPlayer = this.player2;
      }
      
      if (!targetPlayer) continue;
      
      const dx = e.sprite.x - targetPlayer.x;
      const dy = e.sprite.y - targetPlayer.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < viewRadiusSq) {
        e.update(targetPlayer, time);
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

  checkGroundSupport(isPlayer2 = false) {
    if (!this.surgroundLayer) return;
    
    const playerBody = isPlayer2 ? this.player2?.body : this.player?.body;
    if (!playerBody) return;
    
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
      this.playerFall(isPlayer2);
    }
  }

  updateHealthRegen(time) {
    if (this.healthRegen > 0) {
      if (!this.isDying && !this.isFalling && this.playerHealth > 0 && this.playerHealth < this.maxHealth && time - this.lastRegenTime >= 1000) {
        this.healPlayer(this.healthRegen, false);
        this.lastRegenTime = time;
      }
      
      if (this.isCoopMode && this.player2 && !this.isPlayer2Dying && !this.isPlayer2Falling && this.player2Health > 0 && this.player2Health < this.maxHealth && time - this.lastRegen2Time >= 1000) {
        this.healPlayer(this.healthRegen, true);
        this.lastRegen2Time = time;
      }
    }
  }

  updateCameraTarget() {
    if (!this.isCoopMode || !this.player2 || !this.cameraFollowTarget) {
      return;
    }
    
    const p1Alive = this.player && !this.isDying && this.playerHealth > 0;
    const p2Alive = this.player2 && !this.isPlayer2Dying && this.player2Health > 0;
    
    if (p1Alive && !p2Alive) {
      this.cameras.main.stopFollow();
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      const currentZoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Linear(currentZoom, 3, 0.05);
      this.cameras.main.setZoom(newZoom);
      return;
    }
    
    if (!p1Alive && p2Alive) {
      this.cameras.main.stopFollow();
      this.cameras.main.startFollow(this.player2, true, 0.08, 0.08);
      const currentZoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Linear(currentZoom, 3, 0.05);
      this.cameras.main.setZoom(newZoom);
      return;
    }
    
    if (!p1Alive && !p2Alive) {
      return;
    }
    
    const midX = (this.player.x + this.player2.x) / 2;
    const midY = (this.player.y + this.player2.y) / 2;
    
    this.cameraFollowTarget.setPosition(midX, midY);
    
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.player2.x, this.player2.y);
    const baseZoom = 3;
    const minZoom = 1.5;
    const maxDistance = 400;
    
    const targetZoom = Math.max(minZoom, baseZoom - (distance / maxDistance) * (baseZoom - minZoom));
    
    const currentZoom = this.cameras.main.zoom;
    const newZoom = Phaser.Math.Linear(currentZoom, targetZoom, 0.05);
    this.cameras.main.setZoom(newZoom);
  }

  updatePlayer() {
    if (!this.player || this.isDying || this.isFalling) return;
    
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

  updatePlayer2() {
    if (!this.isCoopMode || !this.player2 || !this.player2Keys || this.isPlayer2Dying || this.isPlayer2Falling) return;
    
    const keys = this.player2Keys;
    
    this.player2Body.setDrag(600).setMaxVelocity(this.player2Speed);
    
    const vx = (keys.D.isDown ? 1 : 0) - (keys.Q.isDown ? 1 : 0);
    const vy = (keys.S.isDown ? 1 : 0) - (keys.Z.isDown ? 1 : 0);
    
    if (vx) this.player2.setFlipX(vx < 0);
    
    if (vx || vy) {
      if (vx && vy) {
        const invLen = 1 / Math.sqrt(vx * vx + vy * vy);
        this.player2Body.setAcceleration(vx * invLen * 500, vy * invLen * 500);
      } else {
        this.player2Body.setAcceleration(vx * 500, vy * 500);
      }
      
      if (this.player2.anims.currentAnim?.key !== 'walk') {
        this.player2.anims.play('walk', true);
      }
    } else {
      this.player2Body.setAcceleration(0);
      if (this.player2.anims.currentAnim?.key !== 'idle') {
        this.player2.anims.play('idle', true);
      }
    }
  }

  findClosestEnemy(isPlayer2 = false) {
    if (!this.enemies.length) return null;

    let closest = null;
    let minDistSq = this.attackRangeSq;
    const px = isPlayer2 ? this.player2.x : this.player.x;
    const py = isPlayer2 ? this.player2.y : this.player.y;

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
  if (!this.player || this.isDying || this.isFalling) return;
  
  const now = this.time.now;
  if (this.isAttacking || now < this.attackCooldown) return;

  const target = this.findClosestEnemy(false);
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

  // MODIFICATION : Infliger les dégâts immédiatement
  const px = this.player.x;
  const py = this.player.y;
  const attackAngle = angle;
  const coneAngle = Math.PI / 1.5; // Angle plus large
  const attackRangeSq = this.attackRangeSq;

  for (let i = 0; i < this.enemies.length; i++) {
    const e = this.enemies[i];
    
    if (!e.isAlive()) continue;
    
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
      e.takeDamage(this.attackDamage, px, py, false);
    }
  }

  this.swordSprite.once('animationcomplete', () => {
    this.swordSprite.setVisible(false);
    this.isAttacking = false;
  });
}

  updatePlayer2AutoAttack() {
    if (!this.isCoopMode || !this.player2 || this.isPlayer2Dying || this.isPlayer2Falling) return;
    
    const now = this.time.now;
    if (this.isPlayer2Attacking || now < this.attackCooldown2) return;

    const target = this.findClosestEnemy(true);
    if (!target) return;

    this.isPlayer2Attacking = true;
    this.attackCooldown2 = now + this.attackDelay;

    const angle = Phaser.Math.Angle.Between(
      this.player2.x, this.player2.y,
      target.sprite.x, target.sprite.y
    );

    this.sword2Sprite.setPosition(this.player2.x, this.player2.y)
      .setVisible(true)
      .setRotation(angle + Math.PI)
      .setFlipY(Math.abs(angle) <= Math.PI / 2)
      .play('sword_slash');

    // MODIFICATION : Infliger les dégâts immédiatement
    const px = this.player2.x;
    const py = this.player2.y;
    const attackAngle = angle;
    const coneAngle = Math.PI / 1.5; // Angle plus large
    const attackRangeSq = this.attackRangeSq;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      
      if (!e.isAlive()) continue;
      
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
        e.takeDamage(this.attackDamage, px, py, true);
      }
    }

    this.sword2Sprite.once('animationcomplete', () => {
      this.sword2Sprite.setVisible(false);
      this.isPlayer2Attacking = false;
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
        this.handleTeleport(tp, allObjects, false);
      });
      this.colliders.push(tpCollider);

      if (this.isCoopMode && this.player2) {
        const tp2Collider = this.physics.add.overlap(this.player2, zone, () => {
          this.handleTeleport(tp, allObjects, true);
        });
        this.colliders.push(tp2Collider);
      }
    });
    
    const tpOuts = allObjects.filter(obj => obj.type === 'tp_out');
    tpOuts.forEach(tp => {
      const zone = this.add.zone(tp.x, tp.y, tp.width, tp.height).setOrigin(0, 0);
      this.physics.world.enable(zone);
      this.tpOutZones.push(zone);
      
      zone.tpCollider = this.physics.add.overlap(this.player, zone, () => {
        this.handleRoomExit();
      });
      this.colliders.push(zone.tpCollider);

      if (this.isCoopMode && this.player2) {
        zone.tp2Collider = this.physics.add.overlap(this.player2, zone, () => {
          this.handleRoomExit();
        });
        this.colliders.push(zone.tp2Collider);
      }
    });
  }

  handleTeleport(tp, allObjects, isPlayer2) {
    const now = this.time.now;
    const cooldownKey = isPlayer2 ? 'teleport2Cooldown' : 'teleportCooldown';
    
    if (this.isGameOver || now < this[cooldownKey]) return;
    
    const player = isPlayer2 ? this.player2 : this.player;
    if (!player) return;
    
    if (isPlayer2 && (this.isPlayer2Dying || this.isPlayer2Falling)) return;
    if (!isPlayer2 && (this.isDying || this.isFalling)) return;
    
    const tpNumber = parseInt(tp.name.split('_')[1]);
    
    if (tpNumber % 2 === 1) {
      const targetTpName = `tp_${tpNumber + 1}`;
      const targetTp = allObjects.find(obj => obj.name === targetTpName);
      
      if (targetTp) {
        this[cooldownKey] = now + 500;
        player.setPosition(targetTp.x + targetTp.width / 2, targetTp.y + targetTp.height / 2);
        player.setAlpha(0.3);
        this.tweens.add({
          targets: player,
          alpha: isPlayer2 ? 1 : 1,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            if (isPlayer2 && player.tintTopLeft === 0x00ff00) {
              player.setTint(0x00ff00);
            }
          }
        });
      }
    } else {
      const targetTpName = `tp_${tpNumber - 1}`;
      const targetTp = allObjects.find(obj => obj.name === targetTpName);
      
      if (targetTp) {
        this[cooldownKey] = now + 2000;
        player.setPosition(targetTp.x + targetTp.width / 2, targetTp.y + targetTp.height / 2);
        player.setAlpha(0.3);
        this.tweens.add({
          targets: player,
          alpha: 1,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            if (isPlayer2 && player.tintTopLeft === 0x00ff00) {
              player.setTint(0x00ff00);
            }
          }
        });
      }
    }
  }

  handleRoomExit() {
    if (this.isGameOver) return;
    
    const hasAliveEnemies = this.enemies.some(e => e.isAlive());
    if (hasAliveEnemies) return;
    
    this.loadRandomRoom();
  }

  updateTpOutCollisions() {
    const hasAliveEnemies = this.enemies.some(e => e.isAlive());
    
    this.tpOutZones.forEach(zone => {
      if (zone.tpCollider) {
        zone.tpCollider.active = !hasAliveEnemies;
      }
      if (zone.tp2Collider) {
        zone.tp2Collider.active = !hasAliveEnemies;
      }
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.cleanupRoom();
    
    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      this.tweens.killTweensOf(p);
      p.destroy();
    }
    this.particlePool = [];
    
    if (this.cameraFollowTarget) {
      this.cameraFollowTarget.destroy();
      this.cameraFollowTarget = null;
    }
  }
}