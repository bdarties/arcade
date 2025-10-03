import Player from "./player.js";
import Player2 from "./player2.js";
import Slime from "./slime.js";
import Bat from "./bat.js";
import Fly from "./fly.js";
import Rat from "./rat.js";
import FlyingSkull from "./flyingskull.js";
import Skeleton from "./skeleton.js";
import Ghost from "./ghost.js";
import Goblin from "./goblin.js";
import WaveManager from "./wavemanager.js";
import MapGenerator from "./mapgenerator.js";
import EnemyFactory from "./enemyfactory.js";
import Chest from "./chest.js";
import MusicManager from "./musicmanager.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
        this.isWaveActive = false;
        this.currentWaveRoom = null;
        this.enemiesAlive = 0;
        this.gameMode = 'solo';
    }

    preload() {
        [Player, Player2, Slime, Bat, Fly, Rat, FlyingSkull, Skeleton, Ghost, Goblin].forEach(cls => cls.preload?.(this));
        [
            ["weapons", "assets/weapons_animated.png", 32, 32],
            ["icons", "assets/icons_8x8.png", 8, 8],
            ["chest", "assets/animated_props.png", 16, 16],
            ["walls", "assets/walls_1.png", 16, 16],
            ["door_frames", "assets/doors_1.png", 16, 16],
            ["doors", "assets/door.png", 16, 16],
            ["lever", "assets/lever.png", 16, 16]
        ].forEach(([key, path, w, h]) => this.load.spritesheet(key, path, { frameWidth: w, frameHeight: h }));
        this.load.audio('sword_swing', 'assets/sound/son_attaque.mp3');
        this.load.audio('sword_hit', 'assets/sound/son_attaque_touche.mp3');
        
        // Chargement des musiques
        MusicManager.preloadAll(this);
    }

    create(data = {}) {
        this.gameMode = data.gameMode || 'solo';
        this.cameras.main.setBackgroundColor("#222");
        
        const volume = this.getVolume();
        this.sound.volume = volume;
        
        // Initialisation du gestionnaire de musique
        this.musicManager = new MusicManager(this);
        this.musicManager.setVolume(volume);
        
        // Lancer la musique de donjon en rotation
        this.musicManager.playNextDungeon(1000);
        
        const g = this.add.graphics();
        g.fillStyle(0x66ccff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture("xp_orb", 8, 8);
        g.destroy();
        this.orbs = this.physics.add.group();

        this.tileSize = 16;
        this.margin = 500;

        this.mapGen = new MapGenerator(this, this.tileSize, this.margin);
        const mapData = this.mapGen.generate(20);
        ["rooms","wallGroup","doorsVis","doorsHit","blockDoorsVis","blockDoorsHit"].forEach(key => this[key] = mapData[key]);

        this.wallGroup.getChildren().forEach(w => w.setDepth(1));
        this.doorsVis.getChildren().forEach(d => d.setDepth(2));
        this.blockDoorsVis.getChildren().forEach(d => d.setDepth(3));

        const bounds = this.calculateWorldBounds();
        this.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
        this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);

        this.player = new Player(this, this.rooms[0].centerX - 20, this.rooms[0].centerY);
        Player.createAnimations(this);
        if (!this.anims.exists("sword_attack")) {
            this.anims.create({
                key: "sword_attack",
                frames: this.anims.generateFrameNumbers("weapons", { start: 0, end: 4 }),
                frameRate: 24,
                repeat: 0
            });
        }
        this.player.lastHitTime = 0;
        this.player.hitCooldown = 500;
        this.player.setDepth(10);

        if (this.gameMode === 'coop') {
            this.player2 = new Player2(this, this.rooms[0].centerX + 20, this.rooms[0].centerY);
            Player2.createAnimations(this);
            this.player2.lastHitTime = 0;
            this.player2.hitCooldown = 500;
            this.player2.setDepth(10);
            this.setupCoopCamera();
        } else {
            this.cameras.main.startFollow(this.player).setZoom(3);
        }

        this.setupControls(data.controls);

        this.game.events.on('focus', () => {
            this.input.keyboard.resetKeys();
        });
        
        this.game.events.on('blur', () => {
            this.input.keyboard.resetKeys();
        });
        
        if (!this.scene.isActive("UiScene")) this.scene.launch("UiScene", { gameMode: this.gameMode });

        [Slime, Bat, Fly, Rat, FlyingSkull, Skeleton, Ghost, Goblin].forEach(cls => cls.createAnimations?.(this));

        this.enemyGroups = ["slimes","bats","flies","rats","skulls","skeletons","ghosts","goblins","miniBossGroup", "dragonBossGroup"];
        this.enemyGroups.forEach(g => this[g] = this.physics.add.group());
        this.enemies = this.physics.add.group();

        this.events.on("enemySpawned", () => this.enemiesAlive++);
        this.events.on("enemyDied", () => { this.enemiesAlive--; this.checkWaveCompletion(); });

        this.setupCollisions();

        this.timeElapsed = 0;
        this.waveManager = new WaveManager(this);
        this.isStartingWave = false;
        this.gameEnded = false;
        this._firstWaveStarted = false;
        this.score = 0;
        this.events.emit("updateScore", this.score);

        this.currentRoom = this.rooms[0];
        this.currentRoom.waveStarted = true;

        if (this.gameMode === 'coop') {
            this.distanceThreshold = 50;
            this.maxZoom = 0.4;
            this.minZoom = 2.3;
        }

        Chest.createAnimations(this);
        
        // Gestion du nettoyage de la musique lors de la fermeture de la scène
        this.events.once('shutdown', () => {
            this.musicManager?.destroy();
        });
    }

    getVolume() {
        try {
            return parseFloat(localStorage.getItem("gameVolume")) || 0.5;
        } catch {
            return 0.5;
        }
    }

    calculateWorldBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.rooms.forEach(r => {
            minX = Math.min(minX, r.x);
            minY = Math.min(minY, r.y);
            maxX = Math.max(maxX, r.x + r.cols * this.tileSize);
            maxY = Math.max(maxY, r.y + r.rows * this.tileSize);
        });
        const pad = 128;
        return { x: minX - pad, y: minY - pad, width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2 };
    }

    setupControls(controls) {
        if (this.gameMode === 'coop') {
            this.keysP1 = {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
                dash: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
                attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
                interact: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
            };
            
            this.keysP2 = {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
                dash: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
                attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G),
                interact: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H)
            };
        } else {
            this.keys = {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
                dash: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
                attack: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
                interact: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
            };
        }
    }

    setupCollisions() {
        const players = [this.player, this.player2].filter(p => p);
        const targets = [this.wallGroup, this.blockDoorsHit];
        
        players.forEach(p => {
            targets.forEach(t => this.physics.add.collider(p, t));
            this.physics.add.overlap(p, this.doorsHit, this.onDoorHit, null, this);
            this.physics.add.overlap(p, this.enemies, this.handlePlayerEnemyCollision, null, this);
            this.physics.add.overlap(p, this.orbs, this.collectOrb, null, this);
        });

        this.enemyGroups.forEach(g => targets.forEach(t => this.physics.add.collider(this[g], t)));
    }

    setupCoopCamera() {
        this.midpoint = this.add.container((this.player.x + this.player2.x) / 2, (this.player.y + this.player2.y) / 2);
        this.midpoint.setSize(1, 1);
        this.physics.world.enable(this.midpoint);
        this.midpoint.body.setAllowGravity(false);
        this.cameras.main.startFollow(this.midpoint, true, 0.1, 0.1).setZoom(2.6);
    }

    updateCoopCamera() {
        if (this.gameMode !== 'coop' || !this.player2) return;
        this.midpoint.x = (this.player.x + this.player2.x) / 2;
        this.midpoint.y = (this.player.y + this.player2.y) / 2;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.player2.x, this.player2.y);
        let zoom = this.minZoom;
        if (dist > this.distanceThreshold) {
            zoom = Phaser.Math.Clamp(this.minZoom - (dist - this.distanceThreshold) / 500, this.maxZoom, this.minZoom);
        }
        this.cameras.main.zoom = Phaser.Math.Linear(this.cameras.main.zoom, zoom, 0.1);
    }

    spawnInRoom(room) {
        return {
            x: Phaser.Math.Between(room.x + this.tileSize, room.x + room.cols * this.tileSize - this.tileSize),
            y: Phaser.Math.Between(room.y + this.tileSize, room.y + room.rows * this.tileSize - this.tileSize)
        };
    }

    handlePlayerEnemyCollision(player, enemy) {
        const now = this.time.now;
        enemy.knockback?.(150, Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y), 200);

        if (now >= player.lastHitTime + player.hitCooldown) {
            player.lastHitTime = now;
            player.health -= enemy.contactDamage || 10;
            if (player.setTint) {
                player.setTint(0xff9999);
                this.time.delayedCall(80, () => player.setTint(player.baseTint || 0xffffff));
            }
            if (player.health <= 0) this.handlePlayerDeath(player, player === this.player2);
        }
    }

    collectOrb(player, orb) {
        if (!orb?.value) return;
        player.gainXP(orb.value);
        orb.destroy?.();
        const evt = player === this.player ? "xpChanged" : "xpChangedP2";
        this.events.emit(evt, player.xp, player.xpToNext);
    }

    checkWaveCompletion() {
        if (this.isWaveActive && this.enemiesAlive <= 0) {
            this.isWaveActive = false;
            this.currentRoom && this.mapGen.openRoomDoors(this.currentRoom.index);
            this.currentWaveRoom = null;
            this.events.emit("waveCompleted");
        }
    }

    update(time, delta) {
        if (this.gameEnded) return;
        
        if (this.gameMode === 'coop') {
            this.player?.update(this.keysP1);
            this.player2?.update(this.keysP2);
            this.updateCoopCamera();
        } else {
            this.player?.update(this.keys);
        }

        [...this.rats.getChildren(), ...this.slimes.getChildren(), ...this.bats.getChildren(), 
         ...this.flies.getChildren(), ...this.skulls.getChildren(), ...this.skeletons.getChildren(), 
         ...this.ghosts.getChildren(), ...this.goblins.getChildren(), ...this.miniBossGroup.getChildren()]
        .forEach(e => {
            if (e.moveToTarget) e.target = this.getClosestPlayer(e);
            e.update?.(time, this.player) || e.preUpdate?.(time, delta);
        });

        this.timeElapsed += delta;
        const sec = Math.floor(this.timeElapsed / 1000);
        this.events.emit("updateTimer", `${String(Math.floor(sec / 60)).padStart(2,"0")}:${String(sec % 60).padStart(2,"0")}`);

        if ((this.gameMode === 'coop' && this.player.health <= 0 && this.player2.health <= 0) || 
            (this.gameMode !== 'coop' && this.player.health <= 0)) {
            this.gameOver();
        }

        if (this.gameMode === 'coop') {
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.interact)) {
                this.mapGen.checkLeverInteraction(this.player, true, false);
            }
            if (this.player2 && Phaser.Input.Keyboard.JustDown(this.keysP2.interact)) {
                this.mapGen.checkLeverInteraction(this.player2, true, true);
            }
        } else {
            if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
                this.mapGen.checkLeverInteraction(this.player, true, false);
            }
        }
    }

    getClosestPlayer(enemy) {
        if (this.gameMode !== 'coop' || !this.player2 || this.player2.health <= 0) return this.player;
        if (this.player.health <= 0) return this.player2;
        const d1 = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const d2 = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player2.x, this.player2.y);
        return d1 < d2 ? this.player : this.player2;
    }

    startNextWave(room) {
        if (room.isPuzzleRoom || this.gameEnded || this.isStartingWave || this.isWaveActive) return;

        this.isStartingWave = this.isWaveActive = true;
        this.currentWaveRoom = room;
        this.mapGen.closeRoomDoors(room.index);

        const w = this.waveManager.startNextWave(this.timeElapsed);
        this._firstWaveStarted = true;

        this.time.delayedCall(w.spawnDelay || 2000, () => {
            if (w.wave >= 30 && w.wave % 30 === 0) {
                this.spawnDragonBoss(room);
                return;
            }

            const spawn = (cls, cnt, grp, dmg = 10) => {
                for (let i = 0; i < cnt; i++) {
                    const {x, y} = this.spawnInRoom(room);
                    const e = new cls(this, x, y);
                    if (e.speed !== undefined) e.speed *= w.enemySpeedMult;
                    e.contactDamage = dmg;
                    e.setDepth(4);
                    grp.add(e);
                    this.enemies.add(e);
                    this.events.emit("enemySpawned");
                }
            };

            this.enemiesAlive = 0;
            [
                [Slime, w.slimeCount, this.slimes, 10],
                [Fly, w.flyCount, this.flies, 10],
                [Rat, w.ratCount, this.rats, 10],
                [Bat, w.batCount, this.bats, 15],
                [Ghost, w.ghostCount, this.ghosts, 10],
                [FlyingSkull, w.skullCount, this.skulls, 5],
                [Skeleton, w.skeletonCount, this.skeletons, 15],
                [Goblin, w.goblinCount, this.goblins, 20]
            ].forEach(([cls, cnt, grp, dmg]) => spawn(cls, cnt || 0, grp, dmg));

            if (w.spawnMiniboss && w.availableMinibossTypes && w.availableMinibossTypes.length > 0) {
                const {x, y} = this.spawnInRoom(room);
                const mb = EnemyFactory.spawnRandomMiniBoss(this, x, y, w.availableMinibossTypes);
                if (mb) {
                    mb.contactDamage = 20;
                    mb.setDepth(4);
                    mb.once("destroy", () => this.events.emit("enemyDied"));
                    this.miniBossGroup.add(mb);
                    this.enemies.add(mb);
                    this.events.emit("enemySpawned");
                    this.events.emit("minibossWarning", `Miniboss ${mb.constructor.name} appeared!`);
                }
            }

            this.events.emit("updateWave", w.wave);
            this.time.delayedCall(50, () => this.isStartingWave = false);
        });
    }

    spawnDragonBoss(room) {
        this.events.emit("bossWarning", "DRAGON BOSS INCOMING!");
        
        this.cameras.main.shake(1000, 0.02);
        this.cameras.main.flash(1000, 255, 0, 0, 0.3);
        
        this.time.delayedCall(2000, () => {
            const dragon = EnemyFactory.spawnDragonBoss(this, room.centerX, room.centerY - 100);
            
            if (dragon) {
                dragon.setDepth(15);
                dragon.once("destroy", () => {
                    this.events.emit("enemyDied");
                    this.events.emit("bossDefeated", "Dragon Boss");
                    this.addScore(1000);
                });
                
                this.dragonBossGroup.add(dragon);
                this.enemies.add(dragon);
                this.enemiesAlive = 1;
                
                this.events.emit("updateWave", `BOSS WAVE - DRAGON`);
            }
            
            this.isStartingWave = false;
        });
    }
    
    addScore(pts) { 
        this.score = (this.score || 0) + (pts || 0); 
        this.events.emit("updateScore", this.score); 
    }

    gameOver() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.isWaveActive = false;
        this.currentWaveRoom = null;
        
        // Arrêter la musique avec un fade out
        this.musicManager?.stop(1000);
        
        this.enemies.getChildren().forEach(e => { 
            e.healthBar?.destroy(); 
            e.healthBarBg?.destroy(); 
            e.destroy?.(); 
        });
        this.enemies.clear(true, true);
        this.player?.setActive(false).setVisible(false);
        if (this.player2) this.player2?.setActive(false).setVisible(false);
        this.scene.get("UiScene")?.showGameOver?.();
        this.events.emit("gameOver");
    }

    onDoorHit(player, hit) {
        if (this.time.now < (this.lastTeleport || 0) + 500 || this.isWaveActive) return;
        this.lastTeleport = this.time.now;
        const tRoom = this.rooms[hit.roomIndex];
        const pos = this.calculateSpawnPosition(tRoom, hit.direction);
        
        this.player.setPosition(pos.x, pos.y);
        if (this.player2) {
            const off = [30, 0, 30, 0];
            const isX = hit.direction % 2 === 0;
            this.player2.setPosition(
                pos.x + (isX ? off[hit.direction] : 0),
                pos.y + (isX ? 0 : off[hit.direction])
            );
        }
        
        this.currentRoom = tRoom;
        if (!tRoom.waveStarted && this.enemies.countActive(true) === 0) {
            tRoom.waveStarted = true;
            if (!tRoom.isPuzzleRoom) this.startNextWave(tRoom);
        }
    }

    calculateSpawnPosition(room, dir) {
        const s = this.tileSize;
        const off = 3.2 * s;
        const pos = [
            { x: room.centerX, y: room.y + room.rows * s - off },
            { x: room.x + off, y: room.centerY },
            { x: room.centerX, y: room.y + off },
            { x: room.x + room.cols * s - off, y: room.centerY }
        ];
        return pos[dir] || { x: room.centerX, y: room.centerY };
    }

    handlePlayerDeath(player, isP2 = false) {
        player.setActive(false).setVisible(false);
        player.healthBar?.destroy();
        player.healthBarBg?.destroy();
        this.events.emit(isP2 ? "updateHealthP2" : "updateHealth", 0, 100);

        if (this.gameMode === 'coop') {
            if (!this.player.active && (!this.player2 || !this.player2.active)) {
                this.gameOver();
            } else {
                this.cameras.main.startFollow(this.player.active ? this.player : this.player2);
            }
        } else {
            this.gameOver();
        }
    }

    spawnChest(x, y) {
        new Chest(this, x, y);
    }
}