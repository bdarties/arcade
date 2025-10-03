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
    }

    setPlayer(player) { 
        this.player = player; 
    }

    generateChoices(forceRarity = null) {
        return Phaser.Utils.Array.Shuffle(this.stats)
            .slice(0, 3)
            .map(s => ({
                stat: s,
                rarity: forceRarity ? this.rarities[forceRarity] : this.randomRarity()
            }));
    }

    applyUpgrade(stat, multiplier) {
        if (!this.player) return;
        switch (stat) {
            case "hp": 
                this.player.maxHealth = Math.round(this.player.maxHealth * multiplier);
                this.player.health = Math.round(this.player.health * multiplier);
                break;
            case "speed": 
                this.player.speed *= multiplier; 
                break;
            case "attackSpeed": 
                this.player.attackDelay /= multiplier; 
                break;
            case "regen": 
                this.player.regen *= multiplier; 
                break;
            case "damage": 
                this.player.damage *= multiplier; 
                break;
        }
    }

    show(forceRarity = null) {
        if (this.isOpen || !this.player) return;
        this.isOpen = true;

        // Pause la scène de jeu
        const gameScene = this.scene.scene.get("GameScene");
        if (gameScene) {
            gameScene.scene.pause();
        }

        const choices = this.generateChoices(forceRarity);
        this.scene.events.emit("showUpgradeUI", choices);

        // Nettoyer l'ancien listener s'il existe
        this.scene.events.off("levelUpClosed", this.onLevelUpClosed, this);
        
        // Écouter la fermeture du level-up pour reprendre le jeu
        this.onLevelUpClosed = () => {
            this.close();
        };
        this.scene.events.once("levelUpClosed", this.onLevelUpClosed, this);
    }

    close() {
        this.elements.forEach(e => e?.destroy());
        this.elements = [];
        this.container = null;
        this.isOpen = false;

        // Reprend la scène de jeu
        const gameScene = this.scene.scene.get("GameScene");
        if (gameScene && gameScene.scene.isPaused()) {
            gameScene.scene.resume();
        }
    }

    randomRarity() {
        const roll = Math.random();
        if (roll < 0.6) return this.rarities.bronze;
        if (roll < 0.9) return this.rarities.silver;
        return this.rarities.gold;
    }
}