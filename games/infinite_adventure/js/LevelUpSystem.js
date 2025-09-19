export default class LevelUpSystem {
    constructor(uiScene, player = null) {
        this.scene = uiScene;
        this.player = player;
        this.isOpen = false;
        this.container = null;
        this.elements = [];
        this.stats = [
            { key: "hp", name: "Vie Max" },
            { key: "speed", name: "Vitesse" },
            { key: "attackSpeed", name: "Vitesse d'attaque" },
            { key: "regen", name: "Régénération /s" },
            { key: "damage", name: "Dégâts" },
        ];
        this.rarities = {
            bronze: { name: "Bronze", multiplier: 1.05, color: "#cd7f32" },
            silver: { name: "Argent", multiplier: 1.10, color: "#c0c0c0" },
            gold:   { name: "Or",     multiplier: 1.20, color: "#ffd700" },
        };

        // Gestion du clavier pour choisir avec flèches + K
        this.keys = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            validate: Phaser.Input.Keyboard.KeyCodes.K
        });
        this.selectedIndex = 0;
        this.choiceBoxes = [];
    }

    setPlayer(player) { this.player = player; }
    show(forceRarity = null) { this.showChoices(forceRarity); }

    showChoices(forceRarity = null) {
        if (this.isOpen || !this.player) return;
        this.isOpen = true;
        try { this.scene.scene.pause("GameScene"); } catch {}

        const sw = this.scene.scale.width;
        const sh = this.scene.scale.height;
        const bg = this.scene.add.rectangle(sw/2, sh/2, sw, sh, 0x000000, 0.5).setDepth(5000);
        this.elements.push(bg);

        const panelW = Math.min(640, sw - 80);
        const panelH = 260;
        const panel = this.scene.add.rectangle(sw/2, sh/2, panelW, panelH, 0x111111, 0.95)
            .setStrokeStyle(4, 0x222222).setDepth(5001);
        this.elements.push(panel);

        const title = this.scene.add.text(sw/2, sh/2 - panelH/2 + 28, "Choisis une amélioration", {
            font: "20px Arial", fill: "#ffffff", align: "center"
        }).setOrigin(0.5).setDepth(5002);
        this.elements.push(title);

        const choices = Phaser.Utils.Array.Shuffle(this.stats).slice(0, 3).map(s => ({
            stat: s,
            rarity: forceRarity ? this.rarities[forceRarity] : this.randomRarity()
        }));

        const startX = sw/2 - panelW/2 + 40;
        const colW = (panelW - 80) / 3;

        this.choiceBoxes = [];

        choices.forEach((choice, i) => {
            const x = startX + i * colW + colW/2;
            const y = sh/2;
            const optBg = this.scene.add.rectangle(x, y, colW - 20, 140, 0x222222)
                .setOrigin(0.5).setDepth(5002);
            this.elements.push(optBg);

            const rarityRect = this.scene.add.rectangle(x - (colW/2 - 30), y - 52, 40, 24, Phaser.Display.Color.ValueToColor(choice.rarity.color).color)
                .setOrigin(0.5).setDepth(5003);
            this.elements.push(rarityRect);

            const rarityText = this.scene.add.text(rarityRect.x, rarityRect.y, choice.rarity.name, { font: "12px Arial", fill: "#000" })
                .setOrigin(0.5).setDepth(5004);
            this.elements.push(rarityText);

            const statTitle = this.scene.add.text(x, y - 6, choice.stat.name, { font: "18px Arial", fill: "#ffffff" })
                .setOrigin(0.5).setDepth(5003);
            this.elements.push(statTitle);

            const percent = Math.round((choice.rarity.multiplier - 1) * 100);
            const valueText = choice.stat.key === "attackSpeed" ? `- ${percent}% délai d'attaque` :
                              choice.stat.key === "regen" ? `+ ${percent}% regen /s` : `+ ${percent}%`;
            const statVal = this.scene.add.text(x, y + 20, valueText, { font: "16px Arial", fill: choice.rarity.color })
                .setOrigin(0.5).setDepth(5003);
            this.elements.push(statVal);

            this.choiceBoxes.push({ bg: optBg, statKey: choice.stat.key, multiplier: choice.rarity.multiplier });
        });

        this.refreshSelection();

        // Mettre à jour chaque frame
        this.scene.events.on("update", this.update, this);
    }

    update() {
        if (!this.isOpen) return;

        if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
            this.selectedIndex = (this.selectedIndex + this.choiceBoxes.length - 1) % this.choiceBoxes.length;
            this.refreshSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
            this.selectedIndex = (this.selectedIndex + 1) % this.choiceBoxes.length;
            this.refreshSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.validate)) {
            const choice = this.choiceBoxes[this.selectedIndex];
            this.applyUpgrade(choice.statKey, choice.multiplier);
            this.close();
        }
    }

    refreshSelection() {
        this.choiceBoxes.forEach((box, i) => {
            box.bg.setFillStyle(i === this.selectedIndex ? 0x4444aa : 0x222222);
        });
    }

    applyUpgrade(stat, multiplier) {
        if (!this.player) return;
        switch (stat) {
            case "hp": this.player.maxHealth = this.player.health = Math.round(this.player.maxHealth * multiplier); break;
            case "speed": this.player.speed *= multiplier; break;
            case "attackSpeed": this.player.attackDelay /= multiplier; break;
            case "regen": this.player.regen *= multiplier; break;
            case "damage": this.player.damage *= multiplier; break;
        }
    }

    close() {
        this.elements.forEach(e => e?.destroy());
        this.elements = [];
        this.choiceBoxes = [];
        this.container = null;
        this.isOpen = false;
        try { this.scene.scene.resume("GameScene"); } catch {}
        try { this.scene.events.emit("levelUpClosed"); } catch {}
        this.scene.events.off("update", this.update, this);
    }

    randomRarity() {
        const roll = Math.random();
        if (roll < 0.6) return this.rarities.bronze;
        if (roll < 0.9) return this.rarities.silver;
        return this.rarities.gold;
    }
}
