import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';

class PlatformerGame extends Phaser.Scene {
    constructor() {
        super({ key: 'PlatformerGame' });
        this.player = null;
        this.platforms = null;
        this.cursors = null;
        this.score = 0;
        this.scoreText = null;
    }

    preload() {
        // Créer des sprites colorés avec des formes géométriques
        this.createColoredSprite('player', 32, 32, 0x4A90E2); // Bleu pour le joueur
        this.createColoredSprite('platform', 400, 32, 0x7ED321); // Vert pour les plateformes
    }
    
    createColoredSprite(key, width, height, color) {
        // Créer une texture colorée
        const graphics = this.add.graphics();
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    create() {
        // Fond dégradé ciel
        this.add.rectangle(400, 300, 800, 600, 0x87CEEB);
        
        // Ajouter des nuages décoratifs
        this.add.circle(150, 100, 30, 0xFFFFFF, 0.8);
        this.add.circle(180, 100, 25, 0xFFFFFF, 0.8);
        this.add.circle(650, 80, 35, 0xFFFFFF, 0.8);
        this.add.circle(680, 80, 30, 0xFFFFFF, 0.8);
        
        // Créer les plateformes
        this.platforms = this.physics.add.staticGroup();
        
        // Plateforme principale au sol
        const ground = this.platforms.create(400, 568, 'platform').setScale(2, 1).refreshBody();
        
        // Plateformes flottantes de différentes tailles
        this.platforms.create(600, 400, 'platform').setScale(1.2, 1).refreshBody();
        this.platforms.create(50, 250, 'platform').setScale(1.0, 1).refreshBody();
        this.platforms.create(750, 220, 'platform').setScale(1.3, 1).refreshBody();
        this.platforms.create(300, 150, 'platform').setScale(1.1, 1).refreshBody();
        this.platforms.create(500, 100, 'platform').setScale(0.8, 1).refreshBody();
        
        // Créer le joueur
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        
        // Propriétés physiques du joueur
        this.player.body.setSize(28, 28);
        this.player.body.setOffset(2, 2);
        
        // Collision entre joueur et plateformes
        this.physics.add.collider(this.player, this.platforms);
        
        // Contrôles
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Texte du score avec style
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '28px',
            fill: '#2C3E50',
            fontFamily: 'Arial',
            stroke: '#FFFFFF',
            strokeThickness: 2
        });
        
        // Instructions avec style
        this.add.text(16, 50, 'Flèches: Déplacement | Espace: Saut', {
            fontSize: '14px',
            fill: '#34495E',
            fontFamily: 'Arial'
        });
        
        // Titre du jeu
        this.add.text(400, 50, 'PLATFORMER', {
            fontSize: '36px',
            fill: '#2C3E50',
            fontFamily: 'Arial',
            stroke: '#FFFFFF',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    update() {
        // Mouvement horizontal avec friction
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.setFlipX(true); // Orientation du personnage
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.setFlipX(false);
        } else {
            // Friction naturelle
            this.player.setVelocityX(this.player.body.velocity.x * 0.8);
        }
        
        // Saut avec double saut possible
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
        
        // Empêcher le joueur de sortir de l'écran horizontalement
        if (this.player.x < 16) {
            this.player.x = 16;
        } else if (this.player.x > 784) {
            this.player.x = 784;
        }
        
        // Augmenter le score en fonction du temps et de la position
        this.score += 1;
        const timeScore = Math.floor(this.score / 60);
        const heightBonus = Math.max(0, Math.floor((600 - this.player.y) / 10));
        this.scoreText.setText(`Score: ${timeScore + heightBonus}`);
        
        // Game Over si le joueur tombe trop bas
        if (this.player.y > 650) {
            this.scene.restart();
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: PlatformerGame
};

const game = new Phaser.Game(config);
