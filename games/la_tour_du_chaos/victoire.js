export default class victoire extends Phaser.Scene {
    // constructeur de la classe
    constructor() {
        super({
            key: "victoire" // ici on précise le nom de la classe en tant qu'identifiant
        });
    }

    preload() {
        this.load.image("screen_lose", "src/assets/game_over.png");
        this.load.image("button_back", "src/assets/retour.png");
        this.load.audio("click_sound", "src/assets/click.mp3");
        this.load.audio("lose_music", "src/assets/go.mp3");
        this.load.audio("menu_music", "src/assets/menu.mp3");
    }

    create() {
        const music = this.sound.add("lose_music", {
            loop: true,  // Boucle la musique en continu
            volume: 0.5  // Volume initial de la musique
        });
        music.play();
        //Musique à lancer pour la fin
        const zik = this.sound.add("menu_music", {
            loop: true,  // Boucle la musique en continu
            volume: 0.5
        });

        const screen_welcome = this.add.image(
            this.game.config.width / 2, 
            this.game.config.height / 2, 
            "screen_lose"
        );

        // Ajuste la taille de l'image de fond
        screen_welcome.setDisplaySize(this.game.config.width, this.game.config.height);

        // Créer le bouton de retour
        const button_back = this.add.image(200, 500, "button_back").setScale(0.5);; // Ajuste la position selon tes besoins
        const clickSound = this.sound.add("click_sound");
        const originalScale = 0.5; // Taille de départ
        const hoverScale = 0.55; // Taille lors du survol
        
        button_back.setInteractive();
        
        // Ajouter des événements sur le bouton
        button_back.on("pointerover", () => {
            button_back.setScale(hoverScale);
            button_back.setTint(0xC0C0C0);
            clickSound.play();
        });
        
        button_back.on("pointerout", () => {
            button_back.setScale(originalScale);
            button_back.clearTint();
        });

        button_back.on("pointerup", () => {
            clickSound.play();
            music.stop();
            zik.play();
            this.scene.start("accueil");
        });
    }

    update() {
        // Pas de logique nécessaire ici pour l'instant
    }
}