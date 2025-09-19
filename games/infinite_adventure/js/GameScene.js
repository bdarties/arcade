import Player from "./Player.js";
import Slime from "./Slime.js";
import WaveManager from "./WaveManager.js";
import Bat from "./Bat.js";
import MiniBossSlime from "./MiniBossSlime.js";
import Fly from "./Fly.js";
import Rat from "./Rat.js";
import Chest from "./Chest.js";
import FlyingSkull from "./FlyingSkull.js";
import Skeleton from "./Skeleton.js";
import Ghost from "./Ghost.js";
import Goblin from "./Goblin.js"; 
import MiniBossFly from "./MiniBossFly.js";
import MiniBossRat from "./MiniBossRat.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        [Player, Slime, Bat, Fly, Rat, FlyingSkull, Skeleton, Ghost, Goblin].forEach(cls => cls.preload(this));
        this.load.spritesheet("weapons", "assets/weapons_animated.png", { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet("icons", "assets/icons_8x8.png", { frameWidth: 8, frameHeight: 8 });
        this.load.spritesheet("chest", "assets/animated_props.png", { frameWidth: 16, frameHeight: 16 });
    }

    create(data = {}) {
        this.cameras.main.setBackgroundColor("#222");

        // Génération d'orbes pour XP
        const g = this.add.graphics();
        g.fillStyle(0x66ccff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture("xp_orb", 8, 8);
        g.destroy();
        this.orbs = this.physics.add.group();

        // Création du player
        this.player = new Player(this, 400, 300);
        Player.createAnimations(this);
        this.player.lastHitTime = 0;
        this.player.hitCooldown = 500;

        // Contrôles par défaut : flèches pour déplacement, K pour dash
        this.controls = data.controls || { up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT", dash: "K" };
        const toKeyCode = key => {
            switch (key.toUpperCase()) {
                case "UP": return Phaser.Input.Keyboard.KeyCodes.UP;
                case "DOWN": return Phaser.Input.Keyboard.KeyCodes.DOWN;
                case "LEFT": return Phaser.Input.Keyboard.KeyCodes.LEFT;
                case "RIGHT": return Phaser.Input.Keyboard.KeyCodes.RIGHT;
                case "K": return Phaser.Input.Keyboard.KeyCodes.K;
                default:
                    if (key.length === 1) return key.toUpperCase().charCodeAt(0);
                    return Phaser.Input.Keyboard.KeyCodes.Z;
            }
        };

        this.keys = this.input.keyboard.addKeys({
            up: toKeyCode(this.controls.up),
            down: toKeyCode(this.controls.down),
            left: toKeyCode(this.controls.left),
            right: toKeyCode(this.controls.right),
            dash: toKeyCode(this.controls.dash)
        });

        // Lancement de l'UI
        this.events.once("uiReady", () => this.startNextWave());
        if (!this.scene.isActive("UiScene")) this.scene.launch("UiScene");
        else this.time.delayedCall(50, () => { if (!this._firstWaveStarted) this.startNextWave(); });

        this.cameras.main.startFollow(this.player).setZoom(2);

        // Création des animations des ennemis
        [Slime, Bat, Fly, Rat, FlyingSkull, Skeleton, Ghost, Goblin].forEach(cls => cls.createAnimations(this));

        // Groupes d'ennemis
        this.slimes = this.add.group();
        this.bats = this.add.group();
        this.flies = this.add.group();
        this.rats = this.add.group();
        this.skulls = this.add.group();
        this.skeletons = this.add.group();
        this.ghosts = this.add.group();
        this.goblins = this.add.group(); 
        this.miniBossGroup = this.add.group();
        this.enemies = this.add.group();

        // Animations globales
        if (!this.anims.exists("sword_attack"))
            this.anims.create({ key: "sword_attack", frames: this.anims.generateFrameNumbers("weapons", { start: 0, end: 4 }), frameRate: 24, repeat: 0 });
        if (!this.anims.exists("chest_open"))
            this.anims.create({ key: "chest_open", frames: this.anims.generateFrameNumbers("chest", { start: 4, end: 6 }), frameRate: 6, repeat: 0 });

        // Overlaps
        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            const now = this.time.now;
            const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
            if (enemy.knockback) enemy.knockback(150, angle, 200);
            if (now >= player.lastHitTime + player.hitCooldown) {
                player.lastHitTime = now;
                player.health -= enemy.contactDamage || 10;
                if (player.setTint) { player.setTint(0xff9999); this.time.delayedCall(80, () => player.clearTint()); }
                if (player.health <= 0) this.gameOver();
            }
        });

        this.physics.add.overlap(this.player, this.orbs, (player, orb) => {
            if (!orb || !orb.value) return;
            player.gainXP(orb.value);
            if (orb.destroy) orb.destroy();
            this.events.emit("xpChanged", player.xp, player.xpToNext);
        });

        // Initialisation des vagues
        this.timeElapsed = 0;
        this.waveManager = new WaveManager(this);
        this.isStartingWave = false;
        this.gameEnded = false;
        this._firstWaveStarted = false;
        this.score = 0;
        this.events.emit("updateScore", this.score);
    }

    update(time, delta) {
        if (this.gameEnded) return;
        if (this.player?.active) this.player.update(this.keys);

        [...this.rats.getChildren()].forEach(r => r.update());
        [...this.slimes.getChildren()].forEach(s => s.update());
        [...this.bats.getChildren()].forEach(b => b.update(this.player));
        [...this.flies.getChildren()].forEach(f => f.update());
        [...this.skulls.getChildren()].forEach(s => s.update(this.player));
        [...this.skeletons.getChildren()].forEach(s => s.update(this.player));
        [...this.ghosts.getChildren()].forEach(g => g.update(time, this.player));
        [...this.goblins.getChildren()].forEach(g => g.preUpdate(time, delta)); 
        [...this.miniBossGroup.getChildren()].forEach(b => b.update(time, this.player));

        this.timeElapsed += delta;
        const totalSeconds = Math.floor(this.timeElapsed / 1000);
        const timeString = `${String(Math.floor(totalSeconds / 60)).padStart(2,"0")}:${String(totalSeconds % 60).padStart(2,"0")}`;
        this.events.emit("updateTimer", timeString);

        if (this.waveManager.canStartNextWave(this.timeElapsed, this.enemies.countActive(true), this.isStartingWave))
            this.startNextWave();
    }

    startNextWave() {
        if (this.gameEnded || this.isStartingWave) return;
        this.isStartingWave = true;

        const waveData = this.waveManager.startNextWave(this.timeElapsed);
        this._firstWaveStarted = true;
        const delay = waveData.spawnDelay || 3000;

        this.time.delayedCall(delay, () => {
            const spawnEnemy = (cls, count, group, dmg = 10) => {
                for (let i = 0; i < count; i++) {
                    const x = this.player.x + Phaser.Math.Between(-200, 200);
                    const y = this.player.y + Phaser.Math.Between(-200, 200);
                    const e = new cls(this, x, y);

                    if (e.speed !== undefined) e.speed *= waveData.enemySpeedMult;
                    e.contactDamage = dmg;

                    group.add(e);
                    this.enemies.add(e);
                }
            };

            spawnEnemy(Slime, waveData.slimeCount || 0, this.slimes);
            spawnEnemy(Fly, waveData.flyCount || 0, this.flies);
            spawnEnemy(Rat, waveData.ratCount || 0, this.rats);
            spawnEnemy(Bat, waveData.batCount || 0, this.bats, 15);
            spawnEnemy(Ghost, waveData.ghostCount || 0, this.ghosts, 10);
            spawnEnemy(FlyingSkull, waveData.skullCount || 0, this.skulls, 5);
            spawnEnemy(Skeleton, waveData.skeletonCount || 0, this.skeletons, 15);
            spawnEnemy(Goblin, waveData.goblinCount || 0, this.goblins, 20);

            if (waveData.spawnMiniboss) {
                const x = this.player.x + Phaser.Math.Between(-300, 300);
                const y = this.player.y + Phaser.Math.Between(-300, 300);
                const minibossMapping = { slime: MiniBossSlime, fly: MiniBossFly, rat: MiniBossRat };
                const possibleMinibosses = [];
                if (waveData.slimeCount > 0) possibleMinibosses.push(minibossMapping.slime);
                if (waveData.flyCount > 0) possibleMinibosses.push(minibossMapping.fly);
                if (waveData.ratCount > 0) possibleMinibosses.push(minibossMapping.rat);
                if (possibleMinibosses.length > 0) {
                    const MiniBossClass = Phaser.Utils.Array.GetRandom(possibleMinibosses);
                    const miniboss = new MiniBossClass(this, x, y);
                    miniboss.contactDamage = 20;
                    miniboss.on("destroy", () => this.spawnChest(miniboss.x, miniboss.y));
                    this.miniBossGroup.add(miniboss);
                    this.enemies.add(miniboss);
                }
            }

            this.events.emit("updateWave", waveData.wave);
            this.time.delayedCall(50, () => this.isStartingWave = false);
        });
    }

    spawnChest(x, y) {
        new Chest(this, x, y);
    }

    showGoldUpgrade(onPicked) {
        const uiScene = this.scene.get("UiScene");
        if (!uiScene?.levelUpSystem) return;
        const lus = uiScene.levelUpSystem;
        lus.setPlayer(this.player);
        const baseRandom = lus.randomRarity;
        lus.randomRarity = () => lus.rarities.gold;
        lus.show();
        this.time.delayedCall(100, () => lus.randomRarity = baseRandom);
        if (onPicked) {
            const oldClose = lus.close.bind(lus);
            lus.close = () => { oldClose(); onPicked(); };
        }
    }

    addScore(points) {
        this.score = (this.score || 0) + (points || 0);
        this.events.emit("updateScore", this.score);
    }

    gameOver() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.enemies.getChildren().forEach(e => { e.healthBar?.destroy(); e.healthBarBg?.destroy(); e.destroy(); });
        this.enemies.clear(true, true);
        if (this.player) this.player.setActive(false).setVisible(false);
        this.scene.get("UiScene")?.showGameOver?.();
        this.events.emit("gameOver");
    }
}
