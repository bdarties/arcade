import { get_tab_score, ajoute_score } from '/static/js/score2.js';

export default class Menu extends Phaser.Scene {
    constructor() {
        super({ key: "menu" });
    }

    preload() {
        // Charger les ressources nécessaires si besoin
    }

    create() {
        // Titre du projet
        this.add.text(this.scale.width / 2, 100, "Mobility Model", {
            font: "32px Arial",
            fill: "#ffffff",
        }).setOrigin(0.5);

        // Description du projet
        this.add.text(this.scale.width / 2, 150, 
            "Ce projet présente différents modèles de mobilité \nque l'on peut envisager pour rendre des ennemis \"intelligents\".", 
            {
                font: "16px Arial",
                fill: "#ffffff",
                align: "center",
            }
        ).setOrigin(0.5);

        // Commandes
        this.add.text(this.scale.width / 2, 250, 
            "Commandes :\n" +
            "(6) : Passer au modèle de mobilité suivant\n" +
            "(3) : Passer au modèle de mobilité précédent\n" +
            "(4) : Recommencer la scène\n" +
            "(5) : Lancer ou mettre en pause la scène", 
            {
                font: "16px Arial",
                fill: "#ffffff",
                align: "center",
            }
        ).setOrigin(0.5);

        // Bouton central pour commencer
        const startText = this.add.text(this.scale.width / 2, 400, "Appuyez sur F pour Commencer", {
            font: "20px Arial",
            fill: "#ff0000",
        }).setOrigin(0.5);

        // Écouteur pour la touche F
        this.input.keyboard.on("keydown-F", () => {
            this.scene.start("main_scene"); // Passe à la scène principale
        });

    console.log(this.game.config.idGame)
    var tab = get_tab_score(this.game.config.idGame);
    console.log("tableau des scores :", tab);

    const randomName = `Player${Math.floor(Math.random() * 1000)}`; // Nom aléatoire
    const randomScore = Math.floor(Math.random() * 10000); // Score aléatoire
    ajoute_score(this.game.config.idGame, randomName, randomScore);
    // Exemple d'utilisation

}
}

