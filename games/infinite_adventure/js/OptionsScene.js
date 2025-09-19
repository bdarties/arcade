export default class OptionsScene extends Phaser.Scene {
    constructor() {
        super("OptionsScene");
        this.selectedIndex = 0; // index de sélection pour navigation clavier
        this.menuButtons = [];
    }

    preload() {
        this.load.image("background_options", "assets/options.png");
        this.load.image("bouton_retour", "assets/bouton_retour.png");
        this.load.image("bouton_exit", "assets/bouton_exit.png");
        this.load.image("bouton_start", "assets/bouton_start.png");
        this.load.image("bouton_reset", "assets/bouton_reset.png");
    }

    create(data = {}) {
        this.from = data.from || "MenuScene";

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Fond
        this.add.image(cx, cy, "background_options")
            .setOrigin(0.5)
            .setDisplaySize(this.scale.width, this.scale.height);

        const centerX = cx;
        this.add.text(centerX, 80, "Options — Changer les touches", { fontSize: "28px", fill: "#fff", fontFamily: 'Silkscreen' })
            .setOrigin(0.5);

        // Chargement des touches
        this.controls = this._loadControls() || data.controls || { up: "Z", down: "S", left: "Q", right: "D" };
        this.waiting = null;

        // Affichage des touches
        const keys = ["up", "down", "left", "right"];
        let y = 180;
        this.keyTexts = {};

        keys.forEach(key => {
            const label = key === "up" ? "Haut" : key === "down" ? "Bas" : key === "left" ? "Gauche" : "Droite";
            this.keyTexts[key] = this.add.text(centerX, y, `${label} : ${this._displayName(this.controls[key])}`, { fontSize: "22px", fill: "#fff", fontFamily: 'Silkscreen' })
                .setOrigin(0.5).setInteractive();
            this.keyTexts[key].on("pointerdown", () => this._waitForKey(key, this.keyTexts[key]));
            y += 44;
        });

        this.infoText = this.add.text(centerX, y, "Clique sur une ligne puis appuie sur une touche", { fontSize: "16px", fill: "#ccc", fontFamily: 'Silkscreen' })
            .setOrigin(0.5);

        // Boutons
        const btnStart = this._createMenuButton(cx + 150, cy + 300, "bouton_start", () => this.startGame());
        const btnExit = this._createMenuButton(cx - 150, cy + 300, "bouton_exit", () => this.returnMenu());
        const btnReset = this._createMenuButton(cx, cy, "bouton_reset", () => this.resetControls());

        this.menuButtons = [btnStart, btnExit, btnReset];

        // Navigation clavier
        this.keysNav = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            select: Phaser.Input.Keyboard.KeyCodes.K
        });

        this._updateSelection();
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keysNav.up)) {
            this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex - 1, 0, this.menuButtons.length);
            this._updateSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keysNav.down)) {
            this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + 1, 0, this.menuButtons.length);
            this._updateSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keysNav.select)) {
            this._activateSelected();
        }
    }

    _createMenuButton(x, y, texture, callback) {
        const btn = this.add.image(x, y, texture)
            .setOrigin(0.5)
            .setScale(0.25)
            .setInteractive({ useHandCursor: true });
        btn.on("pointerdown", callback);
        btn.on("pointerover", () => {
            const idx = this.menuButtons.indexOf(btn);
            if (idx >= 0) this.selectedIndex = idx;
            this._updateSelection();
        });
        btn.on("pointerout", () => this._updateSelection());
        return btn;
    }

    _updateSelection() {
        this.menuButtons.forEach((b, i) => {
            b.setScale(i === this.selectedIndex ? 0.27 : 0.25);
        });
    }

    _activateSelected() {
        const btn = this.menuButtons[this.selectedIndex];
        btn.emit("pointerdown");
    }

    startGame() {
        this._saveControls();
        this.scene.start("GameScene", { controls: this.controls });
    }

    returnMenu() {
        this._saveControls();
        this.scene.start("MenuScene", { controls: this.controls });
    }

    resetControls() {
        this.controls = { up: "Z", down: "S", left: "Q", right: "D" };
        this._refreshTexts();
        this._saveControls();
    }

    _displayName(code) {
        const map = { UP: "↑", DOWN: "↓", LEFT: "←", RIGHT: "→", SPACE: "SPACE" };
        return map[code] || code || "";
    }

    _waitForKey(dir, textObj) {
        if (this.waiting) return;
        this.waiting = { dir, textObj };
        textObj.setText(`${dir.toUpperCase()} : ...`);
        this.infoText.setText("Appuie sur une touche pour assigner (Échap pour annuler)");

        this.input.keyboard.once("keydown", e => {
            if (e.key === "Escape") {
                this.waiting = null;
                this._refreshTexts();
                this.infoText.setText("Assignation annulée");
                this.time.delayedCall(800, () => this.infoText.setText("Clique sur une ligne puis appuie sur une touche"));
                return;
            }

            this.controls[dir] = this._getKeyNameFromEvent(e);
            this.waiting = null;
            this._refreshTexts();
            this._saveControls();
            this.infoText.setText(`Assigned ${dir.toUpperCase()} → ${this._displayName(this.controls[dir])}`);
            this.time.delayedCall(900, () => this.infoText.setText("Clique sur une ligne puis appuie sur une touche"));
        });
    }

    _refreshTexts() {
        Object.entries(this.keyTexts).forEach(([key, txt]) => {
            const label = key === "up" ? "Haut" : key === "down" ? "Bas" : key === "left" ? "Gauche" : "Droite";
            txt.setText(`${label} : ${this._displayName(this.controls[key])}`);
        });
    }

    _getKeyNameFromEvent(e) {
        if (!e) return "";
        if (e.key && e.key.length === 1) return e.key.toUpperCase();
        if (e.key && e.key.startsWith("Arrow")) return e.key.slice(5).toUpperCase();
        if (e.code) {
            if (e.code.startsWith("Key")) return e.code.slice(3).toUpperCase();
            if (e.code.startsWith("Digit")) return e.code.slice(5);
            return e.code.toUpperCase();
        }
        return (e.key || "").toUpperCase();
    }

    _saveControls() {
        try { localStorage.setItem("controls", JSON.stringify(this.controls)); } catch {}
    }

    _loadControls() {
        try { return JSON.parse(localStorage.getItem("controls")) || null; } catch { return null; }
    }
}
