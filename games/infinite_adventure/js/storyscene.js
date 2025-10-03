export default class StoryScene extends Phaser.Scene {
    constructor() {
        super("StoryScene");
    }

    init() {
        // Réinitialiser les variables à chaque lancement de la scène
        this.currentImageIndex = 0;
        this.images = ["histoire1", "histoire2", "histoire3", "controls"];
        this.currentImage = null;
        this.skipButton = null;
        this.storyMusic = null;
    }

    preload() {
        // Charger les images d'histoire et de contrôles
        this.load.image("histoire1", "assets/histoire1.jpg");
        this.load.image("histoire2", "assets/histoire2.jpg");
        this.load.image("histoire3", "assets/histoire3.jpg");
        this.load.image("controls", "assets/controls.jpg");
        
        // Charger le bouton skip
        this.load.image("bouton_k", "assets/bouton_k.png");
        
        // Charger la musique de l'histoire (sans bruits de vent)
        this.load.audio("story_music", "assets/sound/8_bit_dungeon.mp3");
    }

    create(data) {
        // Stocker le mode de jeu pour le passer à la scène suivante
        this.gameMode = data.gameMode || 'solo';
        
        // Arrêter la musique du menu si elle joue
        if (this.game.musicManager && this.game.musicManager.currentMusic) {
            this.game.musicManager.stop(500);
        }
        
        // Démarrer la musique de l'histoire
        this.storyMusic = this.sound.add("story_music", {
            loop: true,
            volume: this.getVolume()
        });
        this.storyMusic.play();
        
        // Afficher la première image
        this.showCurrentImage();
        
        // Créer le bouton skip en bas à droite
        this.createSkipButton();
        
        // Configurer les contrôles clavier
        this.setupKeyboardControls();
    }

    getVolume() {
        try {
            return parseFloat(localStorage.getItem("gameVolume")) || 0.5;
        } catch {
            return 0.5;
        }
    }

    showCurrentImage() {
        // Supprimer l'image précédente si elle existe
        if (this.currentImage) {
            this.currentImage.destroy();
        }
        
        // Afficher l'image courante
        const imageKey = this.images[this.currentImageIndex];
        this.currentImage = this.add.image(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            imageKey
        );
        
        // Ajuster la taille de l'image pour qu'elle remplisse l'écran
        const scaleX = this.cameras.main.width / this.currentImage.width;
        const scaleY = this.cameras.main.height / this.currentImage.height;
        const scale = Math.max(scaleX, scaleY);
        this.currentImage.setScale(scale).setScrollFactor(0).setDepth(0);
    }

    createSkipButton() {
        // Supprimer le bouton précédent s'il existe
        if (this.skipButton) {
            this.skipButton.destroy();
        }
        
        // Créer le bouton skip en bas à droite avec scale x2
        this.skipButton = this.add.image(
            this.cameras.main.width - 60,
            this.cameras.main.height - 60,
            "bouton_k"
        )
        .setScale(2)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0)
        .setDepth(10);
        
        // Effet hover
        this.skipButton.on("pointerover", () => {
            this.skipButton.setScale(2.1);
        });
        
        this.skipButton.on("pointerout", () => {
            this.skipButton.setScale(2);
        });
        
        // Gérer le clic sur le bouton
        this.skipButton.on("pointerdown", () => {
            this.nextImageOrStartGame();
        });
    }

    setupKeyboardControls() {
        // Permettre de skip avec la touche K
        this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        
        // Permettre de skip avec ESPACE ou ENTER
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    nextImageOrStartGame() {
        this.currentImageIndex++;
        
        if (this.currentImageIndex < this.images.length) {
            // Afficher l'image suivante
            this.showCurrentImage();
        } else {
            // Démarrer le jeu
            this.startGame();
        }
    }

    startGame() {
        // Arrêter immédiatement la musique de l'histoire
        if (this.storyMusic) {
            this.storyMusic.stop();
            this.storyMusic.destroy();
            this.storyMusic = null;
        }
        
        // Arrêter aussi la musique du manager global si elle existe
        if (this.game.musicManager && this.game.musicManager.currentMusic) {
            this.game.musicManager.currentMusic.stop();
            this.game.musicManager.currentMusic = null;
        }
        
        this.scene.start("GameScene", { 
            gameMode: this.gameMode
        });
    }
    
    shutdown() {
        // Nettoyer la musique au cas où la scène se ferme autrement
        if (this.storyMusic) {
            this.storyMusic.stop();
            this.storyMusic.destroy();
            this.storyMusic = null;
        }
        
        // Nettoyer les éléments visuels
        if (this.currentImage) {
            this.currentImage.destroy();
            this.currentImage = null;
        }
        
        if (this.skipButton) {
            this.skipButton.destroy();
            this.skipButton = null;
        }
    }

    update() {
        // Vérifier si une touche de skip est pressée
        if (Phaser.Input.Keyboard.JustDown(this.keyK) || 
            Phaser.Input.Keyboard.JustDown(this.keySpace) || 
            Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
            this.nextImageOrStartGame();
        }
    }
}