export default class OptionsScene extends Phaser.Scene {
    constructor() {
        super("OptionsScene");
    }

    preload() {
        this.load.image("background_options", "assets/options.jpg");
        this.load.image("bouton_exit", "assets/bouton_exit.png");
        this.load.image("bouton_start", "assets/bouton_start.png");
        this.load.image("bouton_reset", "assets/bouton_reset.png");
        this.load.image("tablette", "assets/tablette.png");
    }

    create(data = {}) {
        this.from = data.from || "MenuScene";
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.add.image(cx, cy, "background_options")
            .setOrigin(0.5)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.add.image(cx, cy, "tablette").setOrigin(0.5).setScale(2.15);

        this.add.text(cx, 220, "Options", { 
            fontSize: "36px", 
            color: "#ffffff", 
            fontFamily: 'Silkscreen' 
        }).setOrigin(0.5);

        this.volume = this.loadData("gameVolume") !== null ? this.loadData("gameVolume") : 0.5;

        this.add.text(cx, 300, "Volume Audio", { 
            fontSize: "24px", 
            color: "#ffffff", 
            fontFamily: 'Silkscreen' 
        }).setOrigin(0.5);

        const sliderY = 350;
        const sliderW = 320;
        const sliderH = 12;

        this.sliderBg = this.add.rectangle(cx, sliderY, sliderW, sliderH, 0x444444).setOrigin(0.5);
        this.sliderFill = this.add.rectangle(
            cx - sliderW / 2, 
            sliderY, 
            sliderW * this.volume, 
            sliderH, 
            0x00ff00
        ).setOrigin(0, 0.5);

        this.sliderHandle = this.add.circle(
            cx - sliderW / 2 + sliderW * this.volume, 
            sliderY, 
            14, 
            0xffffff
        ).setInteractive({ useHandCursor: true, draggable: true });

        this.volumeText = this.add.text(cx, sliderY + 45, `${Math.round(this.volume * 100)}%`, {
            fontSize: "22px",
            color: "#cccccc",
            fontFamily: 'Silkscreen'
        }).setOrigin(0.5);

        this.sliderData = { x: cx, width: sliderW };

        this.input.on('drag', (pointer, obj, dragX) => {
            if (obj !== this.sliderHandle) return;
            const minX = cx - sliderW / 2;
            const maxX = cx + sliderW / 2;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
            this.sliderHandle.x = clampedX;
            this.volume = (clampedX - minX) / sliderW;
            this.sliderFill.width = sliderW * this.volume;
            this.volumeText.setText(`${Math.round(this.volume * 100)}%`);
            this.sound.volume = this.volume;
            this.saveData("gameVolume", this.volume);
        });

        const startY = 480;
        const buttonSpacing = 90;

        this.btnReset = this.add.image(cx, startY, "bouton_reset")
            .setOrigin(0.5)
            .setScale(0.45)
            .setInteractive({ useHandCursor: true });

        this.btnReset.on("pointerdown", () => {
            this.resetVolume();
        });

        this.btnStart = this.add.image(cx, startY + buttonSpacing, "bouton_start")
            .setOrigin(0.5)
            .setScale(0.45)
            .setInteractive({ useHandCursor: true });

        this.btnStart.on("pointerdown", () => {
            this.startGame(data);
        });

        this.btnExit = this.add.image(cx, startY + buttonSpacing * 2, "bouton_exit")
            .setOrigin(0.5)
            .setScale(0.45)
            .setInteractive({ useHandCursor: true });

        this.btnExit.on("pointerdown", () => {
            this.exitToMenu(data);
        });

        [this.btnReset, this.btnStart, this.btnExit].forEach(b => {
            b.on("pointerover", () => {
                b.setScale(0.47);
            });
            b.on("pointerout", () => {
                const idx = this.buttons.indexOf(b);
                if (idx !== this.currentButtonIndex) {
                    b.setScale(0.45);
                }
            });
        });

        this.buttons = [this.btnReset, this.btnStart, this.btnExit];
        this.currentButtonIndex = 0;
        this.isAdjustingSlider = false;

        this.setupKeyboardNavigation();
        this.highlightSelectedButton();
    }

    setupKeyboardNavigation() {
        this.input.keyboard.on('keydown', (event) => {
            const key = event.key.toLowerCase();

            if (this.isAdjustingSlider) {
                if (key === 'arrowleft' || key === 'q') {
                    this.adjustSlider(-0.05);
                } else if (key === 'arrowright' || key === 'd') {
                    this.adjustSlider(0.05);
                } else if (key === 'k' || key === 'f' || key === 'enter') {
                    this.isAdjustingSlider = false;
                    this.sliderHandle.setFillStyle(0xffffff);
                }
                return;
            }

            if (key === 'arrowup' || key === 'z') {
                this.navigate(-1);
            } else if (key === 'arrowdown' || key === 's') {
                this.navigate(1);
            } else if (key === 'k' || key === 'f' || key === 'enter') {
                this.selectCurrentButton();
            } else if (key === 'arrowleft' || key === 'q') {
                this.isAdjustingSlider = true;
                this.sliderHandle.setFillStyle(0xff0000);
            } else if (key === 'arrowright' || key === 'd') {
                this.isAdjustingSlider = true;
                this.sliderHandle.setFillStyle(0xff0000);
            }
        });
    }

    navigate(direction) {
        this.currentButtonIndex += direction;

        if (this.currentButtonIndex < 0) {
            this.currentButtonIndex = this.buttons.length - 1;
        } else if (this.currentButtonIndex >= this.buttons.length) {
            this.currentButtonIndex = 0;
        }

        this.highlightSelectedButton();
    }

    highlightSelectedButton() {
        this.buttons.forEach((button, index) => {
            if (index === this.currentButtonIndex) {
                button.setTint(0xffff00);
                button.setScale(0.47);
            } else {
                button.clearTint();
                button.setScale(0.45);
            }
        });
    }

    adjustSlider(delta) {
        this.volume = Phaser.Math.Clamp(this.volume + delta, 0, 1);

        const cx = this.sliderData.x;
        const sliderW = this.sliderData.width;
        const minX = cx - sliderW / 2;

        this.sliderHandle.x = minX + sliderW * this.volume;
        this.sliderFill.width = sliderW * this.volume;
        this.volumeText.setText(`${Math.round(this.volume * 100)}%`);

        this.sound.volume = this.volume;
        this.saveData("gameVolume", this.volume);
    }

    selectCurrentButton() {
        const selectedButton = this.buttons[this.currentButtonIndex];

        selectedButton.setTint(0xffffff);
        this.tweens.add({
            targets: selectedButton,
            scale: 0.43,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                if (selectedButton === this.btnReset) {
                    this.resetVolume();
                } else if (selectedButton === this.btnStart) {
                    this.startGame();
                } else if (selectedButton === this.btnExit) {
                    this.exitToMenu();
                }
            }
        });
    }

    resetVolume() {
        this.volume = 0.5;
        const cx = this.sliderData.x;
        const sliderW = this.sliderData.width;
        this.updateSlider(sliderW, cx);
        this.saveData("gameVolume", this.volume);
        this.sound.volume = this.volume;
    }

    startGame() {
        this.scene.start("StoryScene", { gameMode: 'solo' });
    }

    exitToMenu() {
        this.scene.start("MenuScene");
    }

    updateSlider(sliderW, cx) {
        this.sliderHandle.x = cx - sliderW / 2 + sliderW * this.volume;
        this.sliderFill.width = sliderW * this.volume;
        this.volumeText.setText(`${Math.round(this.volume * 100)}%`);
    }

    saveData(key, val) {
        try { 
            localStorage.setItem(key, JSON.stringify(val)); 
        } catch {}
    }

    loadData(key) {
        try { 
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch { 
            return null; 
        }
    }
}