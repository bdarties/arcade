import MusicManager from "./musicmanager.js";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    preload() {
        this.load.image("bouton_start", "assets/bouton_start.png");
        this.load.image("bouton_coop", "assets/bouton_coop.png");
        this.load.image("bouton_option", "assets/bouton_option.png");
        this.load.image("background_menu", "assets/background.jpg");
        this.load.image("title", "assets/title.png");
        
        // Charger toutes les musiques du jeu
        MusicManager.preloadAll(this);
    }

    create() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Initialiser le gestionnaire de musique
        if (!this.game.musicManager) {
            this.game.musicManager = new MusicManager(this);
        } else {
            this.game.musicManager.scene = this;
        }
        
        // Jouer la musique du menu
        this.game.musicManager.play("menu_music");

        this.add.image(this.scale.width/2, this.scale.height/2, "background_menu")
            .setOrigin(0.5)
            .setDisplaySize(this.scale.width, this.scale.height);

        // Ajout du titre
        this.add.image(cx, cy - 210, "title")
            .setOrigin(0.5)
            .setScale(0.8);

        // Création des boutons
        const btnStart = this.add.image(cx, cy - 60, "bouton_start")
            .setOrigin(0.5).setScale(0.68).setInteractive({ useHandCursor: true });
        btnStart.on("pointerdown", () => {
            this.launchSolo();
        });

        const btnCoop = this.add.image(cx, cy + 40, "bouton_coop")
            .setOrigin(0.5).setScale(0.75).setInteractive({ useHandCursor: true });
        btnCoop.on("pointerdown", () => {
            this.launchCoop();
        });

        const btnOptions = this.add.image(cx, cy + 140, "bouton_option")
            .setOrigin(0.5).setScale(0.72).setInteractive({ useHandCursor: true });
        btnOptions.on("pointerdown", () => {
            this.launchOptions();
        });

        // Effets de survol
        [btnStart, btnCoop, btnOptions].forEach(b => {
            b.on("pointerover", () => b.setScale(b.scale * 1.05));
            b.on("pointerout",  () => b.setScale(b.scale / 1.05));
        });

        // Configuration de la navigation au clavier
        this.setupKeyboardNavigation();
        
        // Tableau des boutons pour la navigation
        this.buttons = [btnStart, btnCoop, btnOptions];
        this.currentButtonIndex = 0;
        
        // Mise en surbrillance du bouton sélectionné
        this.highlightSelectedButton();
    }

    setupKeyboardNavigation() {
        // Configuration des touches
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        
        // Événements pour la navigation
        this.input.keyboard.on('keydown-UP', () => {
            this.navigate(-1);
        });
        
        this.input.keyboard.on('keydown-DOWN', () => {
            this.navigate(1);
        });
        
        this.input.keyboard.on('keydown-Z', () => {
            this.navigate(-1);
        });
        
        this.input.keyboard.on('keydown-S', () => {
            this.navigate(1);
        });
        
        this.input.keyboard.on('keydown-K', () => {
            this.selectCurrentButton();
        });
        
        this.input.keyboard.on('keydown-F', () => {
            this.selectCurrentButton();
        });
        
        this.input.keyboard.on('keydown-ENTER', () => {
            this.selectCurrentButton();
        });
    }

    navigate(direction) {
        // Navigation dans le menu
        this.currentButtonIndex += direction;
        
        // Gestion des limites
        if (this.currentButtonIndex < 0) {
            this.currentButtonIndex = this.buttons.length - 1;
        } else if (this.currentButtonIndex >= this.buttons.length) {
            this.currentButtonIndex = 0;
        }
        
        // Mise à jour de la surbrillance
        this.highlightSelectedButton();
    }

    highlightSelectedButton() {
        // Réinitialiser tous les boutons
        this.buttons.forEach((button, index) => {
            if (index === this.currentButtonIndex) {
                // Bouton sélectionné
                button.setTint(0xffff00); // Jaune
                button.setScale(this.getBaseScale(button) * 1.1); // Légèrement agrandi
            } else {
                // Bouton non sélectionné
                button.clearTint();
                // Retour à l'échelle normale
                const baseScale = this.getBaseScale(button);
                button.setScale(baseScale);
            }
        });
    }

    getBaseScale(button) {
        // Détermine l'échelle de base selon le bouton
        if (button.texture.key === "bouton_start") return 0.68;
        if (button.texture.key === "bouton_coop") return 0.75;
        if (button.texture.key === "bouton_option") return 0.72;
        return 1;
    }

    selectCurrentButton() {
        const selectedButton = this.buttons[this.currentButtonIndex];
        
        // Effet visuel de sélection
        selectedButton.setTint(0xffffff);
        this.tweens.add({
            targets: selectedButton,
            scale: this.getBaseScale(selectedButton) * 0.9,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                // Exécuter l'action du bouton
                this.executeButtonAction(selectedButton);
            }
        });
    }

    executeButtonAction(button) {
        switch (button.texture.key) {
            case "bouton_start":
                this.launchSolo();
                break;
            case "bouton_coop":
                this.launchCoop();
                break;
            case "bouton_option":
                this.launchOptions();
                break;
        }
    }

    launchSolo() {
        this.scene.start("StoryScene", { 
            gameMode: 'solo'
        });
    }

    launchCoop() {
        this.scene.start("StoryScene", { 
            gameMode: 'coop'
        });
    }

    launchOptions() {
        this.scene.start("OptionsScene", { from: "MenuScene" });
    }

    update() {
        // Navigation alternative avec les flèches (méthode classique)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.navigate(-1);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.navigate(1);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.navigate(-1);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
            this.navigate(1);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
            this.selectCurrentButton();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
            this.selectCurrentButton();
        }
    }
}