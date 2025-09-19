export default class story extends Phaser.Scene {
    // constructeur de la classe
    constructor() {
        super({
            key: "story" // ici on précise le nom de la classe en tant qu'identifiant
        });
    }
  
    preload() {
        this.load.image("button_skip", "src/assets/passer.png");
        this.load.image("screen_credits", "src/assets/backdebut.png");
        this.load.image("histoire1", "src/assets/texte1.png");
        this.load.image("histoire2", "src/assets/texte2.png");
        this.load.image("histoire3", "src/assets/texte3.png");
        this.load.image("histoire4", "src/assets/texte4.png");
        this.load.image("histoire5", "src/assets/texte5.png");
        this.load.image("suite", "src/assets/fleche_droite.png");
        this.load.audio("click_sound", "src/assets/click.mp3"); 
    }
  
    create() {
        // Créer l'image de fond
        const screen_credits = this.add.image(
            this.game.config.width / 2, 
            this.game.config.height / 2, 
            "screen_credits"
        );
  
        const scaleX = this.game.config.width / screen_credits.width;
        const scaleY = this.game.config.height / screen_credits.height;
        const scale = Math.max(scaleX, scaleY);
        screen_credits.setScale(scale).setScrollFactor(0);
  
        // Ajout du bouton "Skip"
        const button_skip = this.add.image(650, 550, "button_skip").setScale(0.5); // Taille d'origine

        // Ajout des différentes images d'histoire
        const histoires = [
            this.add.image(400, 250, "histoire1").setVisible(true),
            this.add.image(400, 250, "histoire2").setVisible(false),
            this.add.image(400, 250, "histoire3").setVisible(false),
            this.add.image(400, 250, "histoire4").setVisible(false),
            this.add.image(400, 250, "histoire5").setVisible(false)
        ];
        
        let currentStoryIndex = 0; // Indice pour savoir quelle image est affichée

        // Ajout du bouton "Suite"
        const suite = this.add.image(400, 450, "suite").setScale(0.5);
        const clickSound = this.sound.add("click_sound");
        // Stocker les valeurs d'échelle
        const originalScale = 0.5; // Taille de départ
        const hoverScale = 0.55; // Taille lors du survol
  
        // Rendre les boutons interactifs
        button_skip.setInteractive(); 
        suite.setInteractive();
  
        // Gestion du survol de la souris
        button_skip.on("pointerover", () => {
            button_skip.setScale(hoverScale); // Augmente l'échelle lors du survol
            button_skip.setTint(0xC0C0C0); // Ajoute une teinte
            clickSound.play();
        });
        suite.on("pointerover", () => {
            suite.setScale(hoverScale); // Augmente l'échelle lors du survol
            suite.setTint(0xC0C0C0); // Ajoute une teinte
            clickSound.play();
        });

        // Gestion du départ de la souris
        button_skip.on("pointerout", () => {
            button_skip.setScale(originalScale); // Reviens à la taille d'origine
            button_skip.clearTint(); // Enlève la teinte
        });
        suite.on("pointerout", () => {
            suite.setScale(originalScale); // Reviens à la taille d'origine
            suite.clearTint(); // Enlève la teinte
        });
  
        // Gestion du clic sur "Skip" : passer directement à la scène principale
        button_skip.on("pointerup", () => {
            const music = this.sound.get("menu_music");
            if (music) {
                music.stop();  // Arrêter la musique de menu
            }
            clickSound.play();
            this.scene.switch("MainScene"); // Lancer le jeu
        });

        // Gestion du clic sur "Suite" : passer à l'image suivante
        suite.on("pointerup", () => {
            // Cache l'image actuelle
            histoires[currentStoryIndex].setVisible(false);
            
            // Incrémente l'indice de l'histoire
            currentStoryIndex++;
            
            // Si on a atteint la dernière image, on passe à la scène principale
            if (currentStoryIndex >= histoires.length) {
                clickSound.play();
                const music = this.sound.get("menu_music");
            if (music) {
                music.stop();  // Arrêter la musique de menu
            }
                this.scene.switch("MainScene");
            } else {
                // Sinon, affiche l'image suivante
                clickSound.play();
                histoires[currentStoryIndex].setVisible(true);
            }
        });
    }

    update() {
        // Fonction vide, tu peux ajouter du contenu ici si nécessaire
    }
}
