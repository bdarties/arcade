export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
        this.selectedIndex = 0; // index du bouton sélectionné
        this.menuButtons = [];
    }

    preload() {
        this.load.image("bouton_start", "assets/bouton_start.png");
        this.load.image("bouton_option", "assets/bouton_option.png");
        this.load.image("background_menu", "assets/background.png");
    }

    create(data = {}) {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Fond
        this.add.image(cx, cy, "background_menu")
            .setOrigin(0.5)
            .setDisplaySize(this.scale.width, this.scale.height);

        // Boutons
        const btnStart = this.add.image(cx, cy - 100, "bouton_start")
            .setOrigin(0.5).setScale(0.3).setInteractive({ useHandCursor: true });
        const btnOptions = this.add.image(cx, cy, "bouton_option")
            .setOrigin(0.5).setScale(0.318).setInteractive({ useHandCursor: true });

        this.menuButtons = [btnStart, btnOptions];

        // Actions des boutons
        btnStart.on("pointerdown", () => this.startGame(data.controls));
        btnOptions.on("pointerdown", () => this.openOptions());

        // Hover souris
        this.menuButtons.forEach((b, i) => {
            b.on("pointerover", () => {
                this.selectedIndex = i;
                this._updateSelection();
            });
            b.on("pointerout", () => this._updateSelection());
        });

        // Clavier
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            select: Phaser.Input.Keyboard.KeyCodes.K
        });

        this._updateSelection();
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
            this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex - 1, 0, this.menuButtons.length);
            this._updateSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
            this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + 1, 0, this.menuButtons.length);
            this._updateSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.select)) {
            this._activateSelected();
        }
    }

    _updateSelection() {
        // Mise à l’échelle pour montrer la sélection
        this.menuButtons.forEach((b, i) => {
            if (i === this.selectedIndex) b.setScale(b.texture.key === "bouton_start" ? 0.33 : 0.334);
            else b.setScale(b.texture.key === "bouton_start" ? 0.3 : 0.318);
        });
    }

    _activateSelected() {
        const btn = this.menuButtons[this.selectedIndex];
        if (btn.texture.key === "bouton_start") this.startGame();
        if (btn.texture.key === "bouton_option") this.openOptions();
    }

    startGame(controls) {
        this.scene.start("GameScene", { controls });
    }

    openOptions() {
        this.scene.start("OptionsScene", { from: "MenuScene" });
    }
}
