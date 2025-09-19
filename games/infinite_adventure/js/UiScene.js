import LevelUpSystem from "./LevelUpSystem.js";

export default class UiScene extends Phaser.Scene {
    constructor() {
        super("UiScene");
    }

    create() {
        this.levelUpSystem = new LevelUpSystem(this, null);

        const margin = 20;
        const barWidth = 220;
        const barHeight = 20;
        this._barMaxWidth = barWidth - 6;

        const createBar = (x, y, width, height, color, depth = 1000) =>
            this.add.rectangle(x, y, width, height, color).setOrigin(0, 0).setDepth(depth);

        // HP
        this.hpBg = createBar(margin, margin, barWidth, barHeight + 6, 0x000000);
        this.hpBar = createBar(margin + 3, margin + 3, barWidth - 6, barHeight, 0xff0000, 1001);
        this.hpText = this.add.text(margin + 6, margin - 12, "HP", { font: "14px Arial", fill: "#fff" }).setDepth(1002);

        // XP
        const xpY = margin + barHeight + 22;
        this.xpBg = createBar(margin, xpY, barWidth, 12, 0x000000);
        this.xpBar = createBar(margin + 3, xpY + 3, barWidth - 6, 6, 0x3399ff, 1001);
        this.xpText = this.add.text(margin + 6, xpY - 12, "XP", { font: "12px Arial", fill: "#fff" }).setDepth(1002);

        // Dash
        const dashY = xpY + 28; 
        this.dashBg = createBar(margin, dashY, barWidth, barHeight, 0x000000);
        this.dashBar = createBar(margin + 3, dashY + 3, barWidth - 6, barHeight - 6, 0xffff00);
        this.dashText = this.add.text(margin + 6, dashY - 12, "Dash", { font: "12px Arial", fill: "#fff" });
        this._dashBarMaxWidth = barWidth - 6;

        // Timer et score fixes
        this.timerText = this.add.text(640, 18, "00:00", { fontSize: "24px", fill: "#fff", fontStyle: "bold" }).setOrigin(0.5, 0);
        this.waveText = this.add.text(640, 48, "", { fontSize: "18px", fill: "#ffdd55", fontStyle: "bold" }).setOrigin(0.5, 0);
        this.scoreText = this.add.text(1280 - 16, 18, "Score: 0", { fontSize: "20px", fill: "#ffff66", fontStyle: "bold" }).setOrigin(1, 0);
        this._lastScore = 0;

        this._waveWarningActive = false;
        this._waveWarningElements = [];

        const gs = this.scene.get("GameScene");
        if (gs?.player) this.levelUpSystem.setPlayer(gs.player);

        const bindEvents = [
            ["updateTimer", (t) => this.timerText?.setText(t)],
            ["updateWave", (w) => this.waveText?.setText(`Vague ${w}`)],
            ["updateScore", (s) => { this._lastScore = s; this.scoreText?.setText(`Score: ${s}`); }],
            ["xpChanged", () => {}],
            ["showLevelUp", () => this.showLevelUp()],
            ["playerCreated", (p) => this.levelUpSystem.setPlayer(p)],
            ["gameOver", () => this.showGameOver()],
            ["waveWarning", (w, d) => { this.waveText?.setText(`Vague ${w}`); this.showWaveWarning(w, d); }],
            ["showGoldUpgrade", (choices, onPicked) => this.showGoldUpgrade(choices, onPicked)]
        ];

        bindEvents.forEach(([event, callback]) => gs?.events.on(event, callback));

        gs?.events.emit("uiReady");

        this.events.on("shutdown", () => {
            bindEvents.forEach(([event, callback]) => gs?.events.off(event, callback));
        });
    }

    showLevelUp() {
        if (!this.levelUpSystem) return;
        if (typeof this.levelUpSystem.showChoices === "function") this.levelUpSystem.showChoices();
        else if (typeof this.levelUpSystem.show === "function") this.levelUpSystem.show();
    }

    showGoldUpgrade(choices, onPicked) {
        const cx = 1280 / 2;
        const cy = 720 / 2;

        const bg = this.add.rectangle(cx, cy, 1280, 720, 0x000000, 0.6).setOrigin(0.5).setDepth(5000);
        const title = this.add.text(cx, cy - 100, "✨ Amélioration Gold ✨", { fontSize: "28px", fill: "#FFD700", fontStyle: "bold" }).setOrigin(0.5).setDepth(5001);

        const buttons = choices.map((choice, i) => {
            const btn = this.add.text(cx, cy + i * 50, choice, { fontSize: "22px", fill: "#fff", backgroundColor: "#333", padding: { x: 12, y: 6 } }).setOrigin(0.5).setDepth(5001).setInteractive();
            btn.on("pointerdown", () => {
                [bg, title, ...buttons].forEach(e => e.destroy());
                onPicked?.(choice);
                this.events.emit("levelUpClosed");
            });
            return btn;
        });
    }

    showWaveWarning(waveNumber, delayMs = 3000) {
        if (this._waveWarningActive) return;
        this._waveWarningActive = true;

        const cx = 1280 / 2;
        const cy = 720 / 2;

        const overlay = this.add.rectangle(cx, cy, 1280, 720, 0x000000, 0.35).setOrigin(0.5).setDepth(4000);
        const title = this.add.text(cx, cy - 40, `⚔️ VAGUE ${waveNumber} ⚔️`, { fontSize: "48px", fontStyle: "bold", color: "#ff4444", stroke: "#000", strokeThickness: 6 }).setOrigin(0.5).setDepth(4001);
        const seconds = Math.max(1, Math.ceil(delayMs / 1000));
        const countdown = this.add.text(cx, cy + 30, `${seconds}`, { fontSize: "40px", fontStyle: "bold", color: "#fff", stroke: "#000", strokeThickness: 6 }).setOrigin(0.5).setDepth(4001);

        this._waveWarningElements = [overlay, title, countdown];

        this.tweens.add({ targets: title, scale: { from: 0.6, to: 1 }, alpha: { from: 0, to: 1 }, duration: 400, ease: "Back.easeOut" });

        let counter = seconds;
        this.time.addEvent({
            delay: 1000,
            repeat: counter - 1,
            callback: () => {
                this.tweens.add({ targets: countdown, scale: { from: 0.7, to: 1.1 }, duration: 220, yoyo: true });
                counter--;
                if (counter >= 1) countdown.setText(`${counter}`);
                else { countdown.setText(""); this._clearWaveWarning(); }
            }
        });
    }

    _clearWaveWarning() {
        this._waveWarningElements.forEach(e => e?.destroy());
        this._waveWarningElements = [];
        this._waveWarningActive = false;
    }

    showGameOver() {
        const cx = 1280 / 2, cy = 720 / 2;
        this.clearGameOver();
        this.gameOverBg = this.add.rectangle(cx, cy, 320, 200, 0x000000, 0.85).setOrigin(0.5).setDepth(3000);
        this.gameOverText = this.add.text(cx, cy - 60, "GAME OVER", { font: "36px Arial", fill: "#ff5555", fontStyle: "bold" }).setOrigin(0.5).setDepth(3001);
        this.finalScoreText = this.add.text(cx, cy - 10, `Score: ${this._lastScore}`, { font: "22px Arial", fill: "#ffff66" }).setOrigin(0.5).setDepth(3001);
        this.replayText = this.add.text(cx, cy + 50, "Rejouer", { font: "24px Arial", fill: "#0f0" }).setOrigin(0.5).setDepth(3001).setInteractive();

        this.replayText.on("pointerdown", () => {
            this.clearGameOver();
            const gs = this.scene.get("GameScene");
            gs ? gs.scene.restart() : this.scene.launch("GameScene");
        });
    }

    clearGameOver() {
        [this.gameOverBg, this.gameOverText, this.finalScoreText, this.replayText].forEach(e => e?.destroy());
        this.gameOverBg = this.gameOverText = this.finalScoreText = this.replayText = null;
    }

    update() {
        const player = this.scene.get("GameScene")?.player;
        if (!player) return;

        const hp = player.health ?? player.hp ?? 0;
        const maxHp = player.maxHealth ?? player.maxHp ?? 100;
        const hpRatio = Phaser.Math.Clamp(hp / Math.max(1, maxHp), 0, 1);
        this.hpBar.width = Math.round(this._barMaxWidth * hpRatio);
        this.hpText.setText(`HP ${Math.round(hp)}/${Math.round(maxHp)}`);

        const xp = player.xp ?? player.XP ?? 0;
        const xpTo = player.xpToNext ?? player.maxXp ?? 5;
        const xpRatio = Phaser.Math.Clamp(xp / Math.max(1, xpTo), 0, 1);
        this.xpBar.width = Math.round(this._barMaxWidth * xpRatio);
        this.xpText.setText(`XP ${xp}/${xpTo}`);

        const now = this.time.now;
        let dashRatio = 1;
        if (player.lastDash + player.dashCooldown > now) {
            dashRatio = (now - player.lastDash) / player.dashCooldown;
        }
        dashRatio = Phaser.Math.Clamp(dashRatio, 0, 1);
        this.dashBar.width = Math.round(this._dashBarMaxWidth * dashRatio);
    }
}
