export default class accueil extends Phaser.Scene {
    constructor() {
        super({
            key: "accueil"
        });
    }

    preload() {
        this.load.image("screen_welcome", "src/assets/backdebut.png");
        this.load.image("button_credits", "src/assets/crédit.png");
        this.load.image("button_controls", "src/assets/control.png");
        this.load.image("button_play", "src/assets/play.png");
        this.load.image('logo', "src/assets/logo.png");
        this.load.audio("click_sound", "src/assets/click.mp3");
        this.load.audio("menu_music", "src/assets/menu.mp3"); // Charge la musique de fond
    }

    create() {
        // Vérifie si la musique existe déjà, si elle n'est pas déjà en cours, on la lance
        if (!this.sound.get("menu_music")) {
            const music = this.sound.add("menu_music", {
                loop: true,  // Boucle la musique en continu
                volume: 0.5  // Volume initial de la musique
            });
            music.play();  // Joue la musique
        }

        // Crée l'image d'accueil et ajuste l'échelle pour qu'elle remplisse l'écran
        const screen_welcome = this.add.image(
            this.game.config.width / 2, 
            this.game.config.height / 2, 
            "screen_welcome"
        );

        const scaleX = this.game.config.width / screen_welcome.width;
        const scaleY = this.game.config.height / screen_welcome.height;
        const scale = Math.max(scaleX, scaleY);

        screen_welcome.setScale(scale).setScrollFactor(0);

        // Ajout des boutons avec une échelle réduite
        const bouton_credits = this.add.image(this.game.config.width / 2, 455, "button_credits").setScale(0.7);
        const bouton_controls = this.add.image(this.game.config.width / 2, 360, "button_controls").setScale(0.7);
        const bouton_play = this.add.image(this.game.config.width / 2, 265, "button_play").setScale(0.7);
        const logo = this.add.image(59, 542, "logo").setScale(0.1);

        // Stocke la taille d'origine
        const originalScale = 0.7;
        const hoverScale = 0.75; // Échelle lors du survol
        const clickSound = this.sound.add("click_sound");

        var arrayButtons = [bouton_credits, bouton_controls, bouton_play];

        arrayButtons.forEach((button) => {
            button.setInteractive();

            // Effet de survol
            button.on("pointerover", () => {
                button.setScale(hoverScale); // Augmente l'échelle lors du survol
                button.setTint(0xC0C0C0);
                clickSound.play();
            });

            // Revenir à la taille originale lorsqu'on sort de la zone du bouton
            button.on("pointerout", () => {
                button.setScale(originalScale); // Reviens à la taille d'origine
                button.clearTint();
            });
        });

        bouton_play.on("pointerup", () => {
            clickSound.play();
            this.scene.start("story");
        });

        bouton_credits.on("pointerup", () => {
            clickSound.play();
            this.scene.switch("credits");
        });

        bouton_controls.on("pointerup", () => {
            clickSound.play();
            this.scene.switch("controls");
        });
    }

    update() {
        // Fonction vide pour le moment
    }
}