import { createEnemies } from './enemies.js';
import { LevelUpScene } from './levelup.js';

export const AVAILABLE_MAPS = ['map_1', 'map_2', 'map_3', 'map_4', 'map_5', 'map_6', 'map_7', 'map_8'];
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
      { type: 'image', key: 'walls', path: 'assets/walls.png' }
    ];   

    assets.forEach(({ type, key, path, config }) => {
      this.load[type](key, path, config);
    });

    // Charger la map de spawn
    this.load.tilemapTiledJSON('map_spawn', 'assets/map/map_spawn.json');
    
    // Charger les autres maps
    AVAILABLE_MAPS.forEach(mapName => {
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

    // Assombrir le jeu en arrière-plan
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.cameras && gameScene.cameras.main) {
      this.tweens.add({
        targets: gameScene.cameras.main,
        alpha: 0.3,
        duration: 800,
        ease: 'Power2'
      });
    }

    // Fond noir avec vignette rouge
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0);
    
    this.tweens.add({
      targets: bg,
      alpha: 0.85,
      duration: 800,
      ease: 'Power2'
    });

    const vignette = this.add.rectangle(0, 0, width, height, 0x8b0000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    
    this.tweens.add({
      targets: vignette,
      alpha: 0.3,
      duration: 1000,
      ease: 'Sine.easeIn'
    });

    this.showGameOver(centerX, centerY);
  }

  showGameOver(centerX, centerY) {
    // Texte "GAME OVER" simplifié (pas de shake)
    const gameOverText = this.add.text(centerX, centerY - 80, 'GAME OVER', {
      fontSize: '72px',
      fill: '#ff0000',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#4a0000',
      strokeThickness: 8
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0).setScale(1.2);

    this.tweens.add({
      targets: gameOverText,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Statistiques
    const gameScene = this.scene.get('GameScene');
    if (gameScene?.playerLevel) {
      const statsText = this.add.text(centerX, centerY + 10, `Niveau atteint: ${gameScene.playerLevel}`, {
        fontSize: '22px',
        fill: '#d4d29b',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

      this.tweens.add({
        targets: statsText,
        alpha: 1,
        duration: 300,
        delay: 400
      });
    }

    // Texte restart
    const restartText = this.add.text(centerX, centerY + 70, 'Appuyez sur K pour recommencer', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#8b0000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    this.tweens.add({
      targets: restartText,
      alpha: 1,
      duration: 300,
      delay: 600
    });

    // Pulse du restart (simplifié)
    this.tweens.add({
      targets: restartText,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      delay: 900
    });

    // Contrôle K
    this.input.keyboard.once('keydown-K', () => {
      // Pas de flash, transition directe
      if (gameScene && gameScene.cameras && gameScene.cameras.main) {
        gameScene.cameras.main.alpha = 1;
      }
      
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('PreloadScene');
    });
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
      playerHealth: 200,
      maxHealth: 200,
      playerXP: 0,
      maxXP: 100,
      playerSpeed: 90,
      healthRegen: 0.5,
      lastRegenTime: 0,
      enemies: [],
      enemyGroup: null,
      projectilePool: null,
      isGameOver: false,
      isDying: false,
      isFalling: false,
      isAttacking: false,
      attackCooldown: 0,
      attackDelay: 750,
      attackRange: 70,
      attackRangeSq: 1600,
      attackDamage: 20,
      particlePool: [],
      enemyUpdateCounter: 0,
      playerLevel: 0,
      playerBody: null,
      swordSprite: null,
      spawnPoint: { x: 100, y: 100 },
      surgroundLayer: null
    });
  }

  create() {
    this.resetGameState();
    this.cameras.main.setBackgroundColor('#584422');
    this.createAnimations();
    this.loadRoom('map_spawn');
    this.initParticlePool(15);
  }

  initParticlePool(count) {
    for (let i = 0; i < count; i++) {
      const particle = this.add.rectangle(0, 0, 3, 3, 0xffffff);
      particle.setActive(false).setVisible(false);
      this.particlePool.push(particle);
    }
  }

  getParticle() {
    let particle = this.particlePool.find(p => !p.active);
    if (!particle) {
      particle = this.add.rectangle(0, 0, 3, 3, 0xffffff);
      this.particlePool.push(particle);
    }
    return particle.setActive(true).setVisible(true).setAlpha(1).setScale(1);
  }
  
  releaseParticle(particle) {
    if (particle?.active) {
      particle.setActive(false).setVisible(false);
      this.tweens.killTweensOf(particle);
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
    if (this.isGameOver || this.isDying || this.isFalling) return;
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
        this.scene.launch('GameOverScene');
      });
    });
  }

  playerFall() {
    if (this.isFalling || this.isDying || this.isGameOver) return;
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
        this.scene.launch('GameOverScene');
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
    this.playerLevel++;
    this.scene.pause();
    
    if (!this.scene.get('LevelUpScene')) {
      this.scene.add('LevelUpScene', LevelUpScene, true);
    } else {
      this.scene.launch('LevelUpScene');
    }
  }

  cleanupRoom() {
    [this.map, this.player, this.sword, this.collisionLayer, this.propsCollisionLayer, this.surgroundLayer]
      .forEach(obj => obj?.destroy());
    
    this.enemyGroup?.clear(true, true);
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    
    if (this.projectilePool) {
      this.projectilePool.clear();
    }
  }

  loadRoom(mapName) {
    this.cleanupRoom();

    this.currentMap = mapName;
    this.visitedRooms.push(mapName);
    this.map = this.make.tilemap({ key: mapName });

    const tilesets = {
      grounds: this.map.addTilesetImage('grounds', 'grounds'),
      walls: this.map.addTilesetImage('walls', 'walls'),
      surground: this.map.addTilesetImage('surground', 'surground'),
      props: this.map.addTilesetImage('props', 'props')
    };

    this.map.createLayer('calque_grounds', tilesets.grounds, 0, 0);
    const wallsLayer = this.map.createLayer('calque_walls', tilesets.walls, 0, 0);
    this.surgroundLayer = this.map.createLayer('calque_surground', tilesets.surground, 0, 0);
    const propsLayer = this.map.createLayer('calque_props', tilesets.props, 0, 0);

    wallsLayer.setCollisionByProperty({ Solide: true });
    propsLayer.setCollisionByProperty({ Solide: true });
    
    this.collisionLayer = wallsLayer;
    this.propsCollisionLayer = propsLayer;

    this.createPlayer();
    this.createEnemiesInRoom();

    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    this.setupTeleporters();
    
    // Marquer que le premier spawn est terminé
    if (this.isFirstSpawn) {
      this.isFirstSpawn = false;
    }
  }

  loadRandomRoom() {
    // Filtrer les maps disponibles pour exclure la map actuelle
    const availableMaps = AVAILABLE_MAPS.filter(map => map !== this.currentMap);
    
    // Si toutes les maps sont déjà utilisées (cas impossible avec 2+ maps), prendre une au hasard
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

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.physics.add.collider(this.player, [this.collisionLayer, this.propsCollisionLayer]);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.player.anims.play('idle', true);
  }

  createEnemiesInRoom() {
    this.enemies = createEnemies(this, 4);
    this.enemyGroup = this.physics.add.group();
    this.enemies.forEach(e => this.enemyGroup.add(e.sprite));

    this.physics.add.collider(
      this.enemyGroup, 
      [this.collisionLayer, this.propsCollisionLayer],
      (enemySprite) => enemySprite.enemyRef?.onWallCollision()
    );

    this.physics.add.overlap(
      this.player, 
      this.enemyGroup,
      (player, enemySprite) => enemySprite.enemyRef?.onPlayerContact(player)
    );
  }

  setupTeleporters() {
    const teleporters = this.map.filterObjects('calque_joueur', obj => obj.type === 'tp_out');
    
    teleporters.forEach(tp => {
      const zone = this.add.zone(tp.x, tp.y, tp.width, tp.height).setOrigin(0, 0);
      this.physics.world.enable(zone);
      this.physics.add.overlap(this.player, zone, () => {
        if (!this.isGameOver && !this.isDying && !this.isFalling) {
          this.loadRandomRoom();
        }
      });
    });
  }

  update(time) {
    if (!this.player || this.isGameOver || this.isDying || this.isFalling) return;

    this.updatePlayer();
    this.checkGroundSupport();
    this.updateHealthRegen(time);
    
    if (++this.enemyUpdateCounter >= 3) {
      this.updateEnemies(time);
      this.enemyUpdateCounter = 0;
    }
    
    if (this.projectilePool) {
      this.projectilePool.updateAll(this.player, this.collisionLayer, this.propsCollisionLayer);
    }
    
    this.updateAutoAttack();
  }

  checkGroundSupport() {
  if (!this.surgroundLayer) return;
  
  const playerBody = this.player.body;
  const playerWidth = playerBody.width;
  const playerHeight = playerBody.height;
  
  // Zone centrale de 40% du corps en largeur et hauteur (30% de marge de chaque côté)
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
  
  // Vérifier toutes les tuiles dans la zone centrale 2D
  for (let tileX = tileLeftX; tileX <= tileRightX; tileX++) {
    for (let tileY = tileTopY; tileY <= tileBottomY; tileY++) {
      const tile = this.surgroundLayer.getTileAt(tileX, tileY);
      if (tile && tile.index !== -1) {
        hasTiles = true;
        if (!tile.properties || !tile.properties.fall) {
          hasSolidSupport = true;
          break;
        }
      }
    }
    if (hasSolidSupport) break;
  }
  
  // Le joueur tombe uniquement si des tuiles existent ET toute la zone centrale est sur des tuiles fall
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
      const invLen = 1 / Math.sqrt(vx * vx + vy * vy);
      this.playerBody.setAcceleration(vx * invLen * 500, vy * invLen * 500);
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

  updateEnemies(time) {
    this.enemies = this.enemies.filter(e => e.isAlive());
    
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      e.update(this.player, time);
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
      
      if (!e.isAlive()) continue;
      
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
      const rangeSq = this.attackRangeSq;

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        
        if (!e.isAlive()) continue;
        
        const dx = e.sprite.x - px;
        const dy = e.sprite.y - py;

        if (dx * dx + dy * dy <= rangeSq) {
          e.takeDamage(this.attackDamage, px, py);
        }
      }
    });
  }
}