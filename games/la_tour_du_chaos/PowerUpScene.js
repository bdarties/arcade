import PowerUps from './powerups.js';  // Importer les power-ups

export default class PowerUpScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PowerUpScene' });
    }

    init(data) {
        this.player = data.player;  // Référencer le joueur depuis MainScene
        this.usedPowerUps = data.usedPowerUps || [];  // Référencer les power-ups déjà utilisés
    }

    create() {
        // Fond transparent pour indiquer une mise en pause du reste du jeu
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7).setOrigin(0, 0);

        // Filtrer les power-ups disponibles pour exclure ceux déjà utilisés
        const availablePowerUps = PowerUps.filter(powerUp => !this.usedPowerUps.includes(powerUp.name));
    
        // Générer trois cartes aléatoires depuis le tableau filtré
        const choices = Phaser.Utils.Array.Shuffle(availablePowerUps).slice(0, 3);
        const positions = [
            { x: this.cameras.main.width / 4, y: this.cameras.main.height / 2 },
            { x: this.cameras.main.width / 2, y: this.cameras.main.height / 2 },
            { x: 3 * this.cameras.main.width / 4, y: this.cameras.main.height / 2 }
        ];

        // Afficher les trois cartes et permettre la sélection avec un redimensionnement
        choices.forEach((powerUp, index) => {
            const card = this.add.image(positions[index].x, positions[index].y, powerUp.image).setInteractive();
            
            // Redimensionner les cartes pour qu'elles soient plus petites
            card.setScale(0.2);  // Ajuster la valeur selon la taille souhaitée
            
            // Quand le joueur choisit une carte
            card.on('pointerdown', () => {
                if (this.player) {  // Vérifie si this.player est défini
                    powerUp.effect(this.player);  // Appliquer l'effet du power-up
                    this.usedPowerUps.push(powerUp.name);  // Ajouter à la liste des power-ups utilisés
                    this.scene.resume('MainScene', { usedPowerUps: this.usedPowerUps });  // Reprendre la scène principale
                    this.scene.stop();  // Arrêter la scène des power-ups
                } else {
                    console.error("Le joueur n'est pas défini lors de l'application du power-up.");
                }
            });
        });

        // Texte pour indiquer de choisir un power-up
        this.add.text(this.cameras.main.width / 2, 100, "Choisissez un Power-Up", { fontSize: '32px', fill: '#fff' }).setOrigin(0.5, 0.5);
    }
}
