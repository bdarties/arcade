import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';

class BouncerGame extends Phaser.Scene {
    constructor() {
        super({ key: 'BouncerGame' });
        this.ball = null;
        this.score = 0;
        this.scoreText = null;
        this.bounces = 0;
    }

    preload() {
        // Créer une balle colorée
        this.createColoredSprite('ball', 40, 40, 0xFF6B6B);
    }
    
    createColoredSprite(key, width, height, color) {
        const graphics = this.add.graphics();
        graphics.fillStyle(color);
        graphics.fillCircle(width/2, height/2, width/2);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    create() {
        // Fond dégradé
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
        
        // Créer la balle
        this.ball = this.physics.add.sprite(400, 300, 'ball');
        this.ball.setVelocity(200, 300);
        this.ball.setBounce(0.8, 0.8);
        this.ball.setCollideWorldBounds(true);
        
        // Ajouter des particules lors des rebonds
        this.ball.body.onWorldBounds = true;
        this.ball.body.world.on('worldbounds', (event) => {
            if (event.body === this.ball.body) {
                this.bounces++;
                this.createBounceEffect(this.ball.x, this.ball.y);
            }
        });
        
        // Score
        this.scoreText = this.add.text(16, 16, 'Rebonds: 0', {
            fontSize: '32px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        });
        
        // Titre
        this.add.text(400, 50, 'BOUNCER', {
            fontSize: '48px',
            fill: '#FF6B6B',
            fontFamily: 'Arial',
            stroke: '#FFFFFF',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Instructions
        this.add.text(400, 550, 'Cliquez pour changer la direction!', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Interaction clic
        this.input.on('pointerdown', (pointer) => {
            const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, pointer.x, pointer.y);
            const force = 400;
            this.ball.setVelocity(
                Math.cos(angle) * force,
                Math.sin(angle) * force
            );
        });
    }
    
    createBounceEffect(x, y) {
        // Créer des particules de rebond
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 3, 0xFF6B6B);
            const angle = (i / 8) * Math.PI * 2;
            const speed = 100;
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    update() {
        // Mettre à jour le score
        this.scoreText.setText(`Rebonds: ${this.bounces}`);
        
        // Ajouter de la friction légère
        this.ball.setVelocity(
            this.ball.body.velocity.x * 0.999,
            this.ball.body.velocity.y * 0.999
        );
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
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: BouncerGame
};

const game = new Phaser.Game(config);

