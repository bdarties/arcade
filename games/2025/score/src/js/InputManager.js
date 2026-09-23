export default class InputManager extends Phaser.Scene {
    constructor() {
        super({ key: "input_manager", active: true }); // Toujours active
    }

    create() {
        // Écouteur pour la touche T (pause/reprise)
        this.input.keyboard.on('keydown-O', () => {
            const mainScene = this.scene.get("main_scene");
            if (mainScene.scene.isPaused()) {
                mainScene.scene.resume();
                mainScene.showResumeMessage(); // Affiche le message de reprise
                console.log("La scène principale est reprise.");
            } else {
                mainScene.scene.pause();
                mainScene.showPauseMessage(); // Affiche le message de pause
                console.log("La scène principale est mise en pause.");
            }
        });

    // Ajout des écouteurs pour les touches P et M
        this.input.keyboard.on('keydown-P', () => {
            const mainScene = this.scene.get("main_scene");
            mainScene.global_mobility_model++;
            console.log(`global_mobility_model incrémenté : ${mainScene.global_mobility_model}`);
            mainScene.scene.restart(); // Redémarre la scène
    });

    this.input.keyboard.on('keydown-M', () => {
        const mainScene = this.scene.get("main_scene");
        mainScene.global_mobility_model = Math.max(1, mainScene.global_mobility_model - 1); // Empêche d'aller en dessous de 1
        console.log(`global_mobility_model décrémenté : ${mainScene.global_mobility_model}`);
        mainScene.scene.restart(); // Redémarre la scène
    });

        // Écouteur pour la touche R (redémarrage)
        this.input.keyboard.on('keydown-I', () => {
            const mainScene = this.scene.get("main_scene");
            console.log("La scène principale est redémarrée.");
            mainScene.restart = true;
            mainScene.scene.restart();
        });
    }
}