import LevelUpSystem from "./levelupsystem.js";

export default class UiScene extends Phaser.Scene {
    constructor() {
        super("UiScene");
    }

    init(data) {
        this.gameMode = data.gameMode || 'solo';
    }

    preload() {
        this.load.image("hud_levelup_big", "assets/hud_levelup_big.png");
        this.load.image("hud_levelup_little", "assets/hud_levelup_little.png");
    }

    create() {
        this.levelUpSystem = new LevelUpSystem(this, null);
        const m = 20, bw = 220, bh = 20;
        this._barMaxWidth = bw - 6;

        this.hpBg = this.createBar(m, m, bw, bh + 6, 0x000000);
        this.hpBar = this.createBar(m + 3, m + 3, bw - 6, bh, 0xff0000, 1001);
        this.hpText = this.add.text(m + 6, m - 12, "J1 - HP", { fontFamily: "Silkscreen", fontSize: "14px", color: "#ffffff" }).setDepth(1002);

        this.hpBgP2 = this.createBar(this.scale.width - m - bw, m, bw, bh + 6, 0x000000);
        this.hpBarP2 = this.createBar(this.scale.width - m - bw + 3, m + 3, bw - 6, bh, 0x00ff00, 1001);
        this.hpTextP2 = this.add.text(this.scale.width - m - bw + 6, m - 12, "J2 - HP", { fontFamily: "Silkscreen", fontSize: "14px", color: "#ffffff" }).setDepth(1002);

        const xpY = m + bh + 22;
        this.xpBg = this.createBar(m, xpY, bw, 12, 0x000000);
        this.xpBar = this.createBar(m + 3, xpY + 3, bw - 6, 6, 0x3399ff, 1001);
        this.xpText = this.add.text(m + 6, xpY - 12, "J1 - XP", { fontFamily: "Silkscreen", fontSize: "12px", color: "#ffffff" }).setDepth(1002);

        this.xpBgP2 = this.createBar(this.scale.width - m - bw, xpY, bw, 12, 0x000000);
        this.xpBarP2 = this.createBar(this.scale.width - m - bw + 3, xpY + 3, bw - 6, 6, 0x33ff99, 1001);
        this.xpTextP2 = this.add.text(this.scale.width - m - bw + 6, xpY - 12, "J2 - XP", { fontFamily: "Silkscreen", fontSize: "12px", color: "#ffffff" }).setDepth(1002);

        const dashY = xpY + 28;
        this.dashBg = this.createBar(m, dashY, bw, bh, 0x000000);
        this.dashBar = this.createBar(m + 3, dashY + 3, bw - 6, bh - 6, 0xffff00, 1001);
        this.dashText = this.add.text(m + 6, dashY - 12, "J1 - Dash", { fontFamily: "Silkscreen", fontSize: "12px", color: "#ffffff" }).setDepth(1002);

        this.dashBgP2 = this.createBar(this.scale.width - m - bw, dashY, bw, bh, 0x000000);
        this.dashBarP2 = this.createBar(this.scale.width - m - bw + 3, dashY + 3, bw - 6, bh - 6, 0xffaa00, 1001);
        this.dashTextP2 = this.add.text(this.scale.width - m - bw + 6, dashY - 12, "J2 - Dash", { fontFamily: "Silkscreen", fontSize: "12px", color: "#ffffff" }).setDepth(1002);

        this._dashBarMaxWidth = bw - 6;

        this.timerText = this.add.text(this.cameras.main.centerX, 18, "00:00", { fontFamily: "Silkscreen", fontSize: "24px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(1002);

        this.waveText = this.add.text(this.cameras.main.centerX, 48, "", { fontFamily: "Silkscreen", fontSize: "18px", color: "#ffdd55", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(1002);

        if (this.gameMode === 'coop') {
            this.scoreText = this.add.text(this.cameras.main.centerX, 80, "Score: 0", { fontFamily: "Silkscreen", fontSize: "20px", color: "#ffff66", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(1002);
        } else {
            this.scoreText = this.add.text(this.cameras.main.width - 16, 18, "Score: 0", { fontFamily: "Silkscreen", fontSize: "20px", color: "#ffff66", fontStyle: "bold" }).setOrigin(1, 0).setDepth(1002);
        }
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
            ["xpChangedP2", () => {}],
            ["showLevelUp", () => this.showLevelUp()],
            ["playerCreated", (p) => this.levelUpSystem.setPlayer(p)],
            ["gameOver", () => this.showGameOver()],
            ["waveWarning", (w, d) => { this.waveText?.setText(`Vague ${w}`); this.showWaveWarning(w, d); }],
            ["showGoldUpgrade", (choices, onPicked) => this.showGoldUpgrade(choices, onPicked)]
        ];

        bindEvents.forEach(([event, callback]) => gs?.events.on(event, callback));

        this.events.on("showUpgradeUI", (choices) => this.showUpgradeChoices(choices));

        if (this.gameMode !== 'coop') this.setP2UIVisible(false);

        gs?.events.emit("uiReady");

        this.events.on("shutdown", () => {
            bindEvents.forEach(([event, callback]) => gs?.events.off(event, callback));
        });
    }

    createBar(x, y, width, height, color, depth = 1000) {
        return this.add.rectangle(x, y, width, height, color).setOrigin(0, 0).setDepth(depth);
    }

    setP2UIVisible(visible) {
        [this.hpBgP2, this.hpBarP2, this.hpTextP2, this.xpBgP2, this.xpBarP2, this.xpTextP2, this.dashBgP2, this.dashBarP2, this.dashTextP2]
            .forEach(el => el?.setVisible(visible));
    }

    showLevelUp() {
        if (!this.levelUpSystem) return;
        this.levelUpSystem.show();
    }

    showUpgradeChoices(choices) {
        const sw = this.scale.width, sh = this.scale.height;
        const uiElements = [];

        const bg = this.add.rectangle(sw / 2, sh / 2, sw, sh, 0x000000, 0.5).setDepth(5000);
        uiElements.push(bg);

        const panelW = Math.min(640, sw - 80), panelH = 260;
        const panel = this.add.image(sw / 2, sh / 2, "hud_levelup_big").setDepth(5001).setDisplaySize(panelW, panelH);
        uiElements.push(panel);

        const title = this.add.text(sw / 2, sh / 2 - panelH / 2 + 28, "Choisis une amélioration", { fontFamily: "Silkscreen", fontSize: "20px", color: "#ffffff", align: "center" }).setOrigin(0.5).setDepth(5002);
        uiElements.push(title);

        const startX = sw / 2 - panelW / 2 + 40, colW = (panelW - 80) / 3;
        const optionButtons = [];
        let selectedIndex = 0;

        const selectOption = (index) => {
            this.levelUpSystem.applyUpgrade(choices[index].stat.key, choices[index].rarity.multiplier);
            if (this._upgradeKeyListener) {
                this.input.keyboard.off("keydown", this._upgradeKeyListener);
                this._upgradeKeyListener = null;
            }
            uiElements.forEach(e => e.destroy());
            const gs = this.scene.get("GameScene");
            gs?.scene.resume();
            this.events.emit("levelUpClosed");
            this.levelUpSystem.isOpen = false;
        };

        const updateSelection = (newIndex) => {
            optionButtons[selectedIndex]?.clearTint();
            selectedIndex = (newIndex + choices.length) % choices.length;
            optionButtons[selectedIndex]?.setTint(0xffff00);
        };

        choices.forEach((choice, i) => {
            const x = startX + i * colW + colW / 2, y = sh / 2;

            const optBg = this.add.image(x, y, "hud_levelup_little").setDepth(5002).setDisplaySize(colW - 20, 140).setInteractive({ useHandCursor: true });
            uiElements.push(optBg);
            optionButtons.push(optBg);

            const rarityRect = this.add.rectangle(x - (colW / 2 - 30), y - 52, 40, 24, Phaser.Display.Color.ValueToColor(choice.rarity.color).color).setOrigin(0.5).setDepth(5003);
            uiElements.push(rarityRect);

            const rarityText = this.add.text(rarityRect.x, rarityRect.y, choice.rarity.name, { fontFamily: "Silkscreen", fontSize: "12px", color: "#000" }).setOrigin(0.5).setDepth(5004);
            uiElements.push(rarityText);

            const statTitle = this.add.text(x, y - 6, choice.stat.name, { fontFamily: "Silkscreen", fontSize: "18px", color: "#ffffff" }).setOrigin(0.5).setDepth(5003);
            uiElements.push(statTitle);

            const percent = Math.round((choice.rarity.multiplier - 1) * 100);
            const valueText = choice.stat.key === "attackSpeed" ? `- ${percent}% délai d'attaque` :
                            choice.stat.key === "regen" ? `+ ${percent}% regen /s` : `+ ${percent}%`;

            const statVal = this.add.text(x, y + 20, valueText, { fontFamily: "Silkscreen", fontSize: "16px", color: choice.rarity.color }).setOrigin(0.5).setDepth(5003);
            uiElements.push(statVal);

            optBg.on("pointerdown", () => selectOption(i));
            optBg.on("pointerover", () => updateSelection(i));
            optBg.on("pointerout", () => optBg.clearTint());
        });

        updateSelection(0);

        if (this._upgradeKeyListener) {
            this.input.keyboard.off("keydown", this._upgradeKeyListener);
        }
        
        this._upgradeKeyListener = (event) => {
            const key = event.key.toLowerCase();
            
            if (key === "arrowleft" || key === "q") {
                updateSelection(selectedIndex - 1);
            } else if (key === "arrowright" || key === "d") {
                updateSelection(selectedIndex + 1);
            } else if (key === "k" || key === "f" || key === "enter") {
                selectOption(selectedIndex);
            }
        };
        
        this.input.keyboard.on("keydown", this._upgradeKeyListener);

        const cancel = this.add.text(sw / 2, sh / 2 + panelH / 2 - 28, "Continuer sans choisir", { fontFamily: "Silkscreen", fontSize: "14px", color: "#aaaaaa" }).setOrigin(0.5).setDepth(5002).setInteractive({ useHandCursor: true });

        cancel.on("pointerdown", () => {
            if (this._upgradeKeyListener) {
                this.input.keyboard.off("keydown", this._upgradeKeyListener);
                this._upgradeKeyListener = null;
            }
            uiElements.forEach(e => e.destroy());
            const gs = this.scene.get("GameScene");
            gs?.scene.resume();
            this.events.emit("levelUpClosed");
            this.levelUpSystem.isOpen = false;
        });

        uiElements.push(cancel);
    }

    showGoldUpgrade(choices, onPicked) {
        const centerX = this.cameras.main.centerX, centerY = this.cameras.main.centerY;
        const uiElements = [];
        let selectedIndex = 0;

        const bg = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.6).setOrigin(0.5).setDepth(5000).setScrollFactor(0);
        uiElements.push(bg);

        const title = this.add.text(centerX, centerY - 100, "✨ Amélioration Gold ✨", { fontFamily: "Silkscreen", fontSize: "28px", color: "#FFD700", fontStyle: "bold" }).setOrigin(0.5).setDepth(5001).setScrollFactor(0);
        uiElements.push(title);

        const selectOption = (index) => {
            if (this._goldUpgradeKeyListener) {
                this.input.keyboard.off("keydown", this._goldUpgradeKeyListener);
                this._goldUpgradeKeyListener = null;
            }
            uiElements.forEach(e => e.destroy());
            onPicked?.(choices[index]);
            this.events.emit("levelUpClosed");
        };

        const updateSelection = (newIndex) => {
            buttons[selectedIndex]?.setStyle({ backgroundColor: "#333333" });
            selectedIndex = (newIndex + choices.length) % choices.length;
            buttons[selectedIndex]?.setStyle({ backgroundColor: "#FFD700" });
        };

        const buttons = choices.map((choice, i) => {
            const btn = this.add.text(centerX, centerY + i * 50, choice, { 
                fontFamily: "Silkscreen", 
                fontSize: "22px", 
                color: "#ffffff", 
                backgroundColor: "#333333", 
                padding: { x: 12, y: 6 } 
            }).setOrigin(0.5).setDepth(5001).setScrollFactor(0).setInteractive({ useHandCursor: true });

            btn.on("pointerdown", () => selectOption(i));
            btn.on("pointerover", () => updateSelection(i));
            btn.on("pointerout", () => {
                if (i !== selectedIndex) {
                    btn.setStyle({ backgroundColor: "#333333" });
                }
            });

            uiElements.push(btn);
            return btn;
        });

        updateSelection(0);

        if (this._goldUpgradeKeyListener) {
            this.input.keyboard.off("keydown", this._goldUpgradeKeyListener);
        }
        
        this._goldUpgradeKeyListener = (event) => {
            const key = event.key.toLowerCase();
            
            if (key === "arrowup" || key === "z") {
                updateSelection(selectedIndex - 1);
            } else if (key === "arrowdown" || key === "s") {
                updateSelection(selectedIndex + 1);
            } else if (key === "k" || key === "f" || key === "enter") {
                selectOption(selectedIndex);
            }
        };
        
        this.input.keyboard.on("keydown", this._goldUpgradeKeyListener);
    }

    showWaveWarning(waveNumber, delayMs = 3000) {
        if (this._waveWarningActive) return;
        this._waveWarningActive = true;

        const centerX = this.cameras.main.centerX, centerY = this.cameras.main.centerY;

        const overlay = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.35).setOrigin(0.5).setDepth(4000).setScrollFactor(0);

        const title = this.add.text(centerX, centerY - 40, `⚔️ VAGUE ${waveNumber} ⚔️`, { fontFamily: "Silkscreen", fontSize: "48px", fontStyle: "bold", color: "#ff4444", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5).setDepth(4001).setScrollFactor(0);

        const seconds = Math.max(1, Math.ceil(delayMs / 1000));
        const countdown = this.add.text(centerX, centerY + 30, `${seconds}`, { fontFamily: "Silkscreen", fontSize: "40px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5).setDepth(4001).setScrollFactor(0);

        this._waveWarningElements = [overlay, title, countdown];

        this.tweens.add({ targets: title, scale: { from: 0.6, to: 1 }, alpha: { from: 0, to: 1 }, duration: 400, ease: "Back.easeOut" });

        let counter = seconds;
        this.time.addEvent({
            delay: 1000,
            repeat: counter - 1,
            callback: () => {
                this.tweens.add({ targets: countdown, scale: { from: 0.7, to: 1.1 }, duration: 220, yoyo: true });
                counter--;
                if (counter >= 1) {
                    countdown.setText(`${counter}`);
                } else {
                    countdown.setText("");
                    this._clearWaveWarning();
                }
            }
        });
    }

    _clearWaveWarning() {
        this._waveWarningElements.forEach(e => e?.destroy());
        this._waveWarningElements = [];
        this._waveWarningActive = false;
    }

    showGameOver() {
        const cx = this.cameras.main.centerX, cy = this.cameras.main.centerY;
        this.clearGameOver();

        this.gameOverBg = this.add.rectangle(cx, cy, 320, 240, 0x000000, 0.85).setOrigin(0.5).setDepth(3000);

        this.gameOverText = this.add.text(cx, cy - 80, "GAME OVER", { fontFamily: "Silkscreen", fontSize: "36px", fontStyle: "bold", color: "#ff5555" }).setOrigin(0.5).setDepth(3001);

        this.finalScoreText = this.add.text(cx, cy - 30, `Score: ${this._lastScore}`, { fontFamily: "Silkscreen", fontSize: "22px", color: "#ffff66" }).setOrigin(0.5).setDepth(3001);

        this.replayText = this.add.text(cx, cy + 30, "Rejouer", { fontFamily: "Silkscreen", fontSize: "24px", color: "#00ff00", backgroundColor: "#333333", padding: { x: 12, y: 6 } }).setOrigin(0.5).setDepth(3001).setInteractive({ useHandCursor: true });

        this.menuText = this.add.text(cx, cy + 80, "Retour au menu", { fontFamily: "Silkscreen", fontSize: "24px", color: "#ffffff", backgroundColor: "#333333", padding: { x: 12, y: 6 } }).setOrigin(0.5).setDepth(3001).setInteractive({ useHandCursor: true });

        this._gameOverButtons = [this.replayText, this.menuText];
        this._gameOverSelectedIndex = 0;

        const updateGameOverSelection = (newIndex) => {
            this._gameOverButtons[this._gameOverSelectedIndex]?.setStyle({ backgroundColor: "#333333" });
            this._gameOverSelectedIndex = (newIndex + this._gameOverButtons.length) % this._gameOverButtons.length;
            this._gameOverButtons[this._gameOverSelectedIndex]?.setStyle({ backgroundColor: "#FFD700" });
        };

        const selectGameOverOption = (index) => {
            if (this._gameOverKeyListener) {
                this.input.keyboard.off("keydown", this._gameOverKeyListener);
                this._gameOverKeyListener = null;
            }
            this.clearGameOver();
            
            if (index === 0) {
                const gs = this.scene.get("GameScene");
                gs ? gs.scene.restart() : this.scene.launch("GameScene");
            } else {
                this.scene.stop("GameScene");
                this.scene.stop("UiScene");
                this.scene.start("MenuScene");
            }
        };

        this.replayText.on("pointerdown", () => selectGameOverOption(0));
        this.replayText.on("pointerover", () => updateGameOverSelection(0));
        this.replayText.on("pointerout", () => {
            if (this._gameOverSelectedIndex !== 0) {
                this.replayText.setStyle({ backgroundColor: "#333333" });
            }
        });

        this.menuText.on("pointerdown", () => selectGameOverOption(1));
        this.menuText.on("pointerover", () => updateGameOverSelection(1));
        this.menuText.on("pointerout", () => {
            if (this._gameOverSelectedIndex !== 1) {
                this.menuText.setStyle({ backgroundColor: "#333333" });
            }
        });

        updateGameOverSelection(0);

        if (this._gameOverKeyListener) {
            this.input.keyboard.off("keydown", this._gameOverKeyListener);
        }
        
        this._gameOverKeyListener = (event) => {
            const key = event.key.toLowerCase();
            
            if (key === "arrowup" || key === "z") {
                updateGameOverSelection(this._gameOverSelectedIndex - 1);
            } else if (key === "arrowdown" || key === "s") {
                updateGameOverSelection(this._gameOverSelectedIndex + 1);
            } else if (key === "k" || key === "f" || key === "enter") {
                selectGameOverOption(this._gameOverSelectedIndex);
            }
        };
        
        this.input.keyboard.on("keydown", this._gameOverKeyListener);
    }

    clearGameOver() {
        [this.gameOverBg, this.gameOverText, this.finalScoreText, this.replayText].forEach(e => e?.destroy());
        this.gameOverBg = this.gameOverText = this.finalScoreText = this.replayText = null;
    }

    update() {
        const gs = this.scene.get("GameScene");
        if (!gs) return;

        const player = gs.player;
        if (player) {
            const hp = player.health ?? player.hp ?? 0;
            const maxHp = player.maxHealth ?? player.maxHp ?? 100;
            const hpRatio = Phaser.Math.Clamp(hp / Math.max(1, maxHp), 0, 1);
            this.hpBar.width = Math.round(this._barMaxWidth * hpRatio);
            this.hpText.setText(`J1 - HP ${Math.round(hp)}/${Math.round(maxHp)}`);

            const xp = player.xp ?? player.XP ?? 0;
            const xpTo = player.xpToNext ?? player.maxXp ?? 5;
            const xpRatio = Phaser.Math.Clamp(xp / Math.max(1, xpTo), 0, 1);
            this.xpBar.width = Math.round(this._barMaxWidth * xpRatio);
            this.xpText.setText(`J1 - XP ${xp}/${xpTo}`);

            const now = this.time.now;
            let dashRatio = 1;
            if (player.lastDash + player.dashCooldown > now) {
                dashRatio = (now - player.lastDash) / player.dashCooldown;
            }
            dashRatio = Phaser.Math.Clamp(dashRatio, 0, 1);
            this.dashBar.width = Math.round(this._dashBarMaxWidth * dashRatio);
        }

        if (gs.gameMode === 'coop' && gs.player2) {
            const player2 = gs.player2;
            const hp2 = player2.health ?? player2.hp ?? 0;
            const maxHp2 = player2.maxHealth ?? player2.maxHp ?? 100;
            const hpRatio2 = Phaser.Math.Clamp(hp2 / Math.max(1, maxHp2), 0, 1);
            this.hpBarP2.width = Math.round(this._barMaxWidth * hpRatio2);
            this.hpTextP2.setText(`J2 - HP ${Math.round(hp2)}/${Math.round(maxHp2)}`);

            const xp2 = player2.xp ?? player2.XP ?? 0;
            const xpTo2 = player2.xpToNext ?? player2.maxXp ?? 5;
            const xpRatio2 = Phaser.Math.Clamp(xp2 / Math.max(1, xpTo2), 0, 1);
            this.xpBarP2.width = Math.round(this._barMaxWidth * xpRatio2);
            this.xpTextP2.setText(`J2 - XP ${xp2}/${xpTo2}`);

            const now2 = this.time.now;
            let dashRatio2 = 1;
            if (player2.lastDash + player2.dashCooldown > now2) {
                dashRatio2 = (now2 - player2.lastDash) / player2.dashCooldown;
            }
            dashRatio2 = Phaser.Math.Clamp(dashRatio2, 0, 1);
            this.dashBarP2.width = Math.round(this._dashBarMaxWidth * dashRatio2);
        }
    }
}