import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';

class SnakeGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SnakeGame' });
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.scoreText = null;
        this.gameOver = false;
        this.gridSize = 20;
        this.gameWidth = 800;
        this.gameHeight = 600;
    }

    preload() {
        // Créer les sprites colorés
        this.createColoredSprite('snakeHead', this.gridSize, this.gridSize, 0x4CAF50);
        this.createColoredSprite('snakeBody', this.gridSize, this.gridSize, 0x8BC34A);
        this.createColoredSprite('food', this.gridSize, this.gridSize, 0xFF5722);
    }
    
    createColoredSprite(key, width, height, color) {
        const graphics = this.add.graphics();
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    create() {
        // Fond
        this.add.rectangle(400, 300, 800, 600, 0x2E7D32);
        
        // Créer le serpent initial
        this.snake = [];
        for (let i = 0; i < 3; i++) {
            const segment = this.add.sprite(100 - i * this.gridSize, 300, 'snakeBody');
            this.snake.push(segment);
        }
        this.snake[0].setTexture('snakeHead');
        
        // Créer la nourriture
        this.spawnFood();
        
        // Contrôles
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Score
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        });
        
        // Titre
        this.add.text(400, 50, 'SNAKE', {
            fontSize: '48px',
            fill: '#4CAF50',
            fontFamily: 'Arial',
            stroke: '#FFFFFF',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Instructions
        this.add.text(400, 550, 'Flèches: Direction | Espace: Recommencer', {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Timer pour le mouvement
        this.time.addEvent({
            delay: 150,
            callback: this.moveSnake,
            callbackScope: this,
            loop: true
        });
    }
    
    spawnFood() {
        if (this.food) {
            this.food.destroy();
        }
        
        let foodX, foodY;
        let validPosition = false;
        
        while (!validPosition) {
            foodX = Phaser.Math.Between(0, (this.gameWidth / this.gridSize) - 1) * this.gridSize + this.gridSize / 2;
            foodY = Phaser.Math.Between(0, (this.gameHeight / this.gridSize) - 1) * this.gridSize + this.gridSize / 2;
            
            validPosition = true;
            for (let segment of this.snake) {
                if (segment.x === foodX && segment.y === foodY) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        this.food = this.add.sprite(foodX, foodY, 'food');
    }
    
    moveSnake() {
        if (this.gameOver) return;
        
        this.direction = this.nextDirection;
        
        const head = this.snake[0];
        let newX = head.x;
        let newY = head.y;
        
        switch (this.direction) {
            case 'up':
                newY -= this.gridSize;
                break;
            case 'down':
                newY += this.gridSize;
                break;
            case 'left':
                newX -= this.gridSize;
                break;
            case 'right':
                newX += this.gridSize;
                break;
        }
        
        // Vérifier les collisions avec les murs
        if (newX < this.gridSize / 2 || newX >= this.gameWidth - this.gridSize / 2 ||
            newY < this.gridSize / 2 || newY >= this.gameHeight - this.gridSize / 2) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }
        
        // Vérifier les collisions avec le serpent
        for (let segment of this.snake) {
            if (segment.x === newX && segment.y === newY) {
                this.gameOver = true;
                this.showGameOver();
                return;
            }
        }
        
        // Vérifier si on mange la nourriture
        if (newX === this.food.x && newY === this.food.y) {
            this.score += 10;
            this.scoreText.setText(`Score: ${this.score}`);
            this.spawnFood();
            
            // Ajouter un nouveau segment
            const newSegment = this.add.sprite(head.x, head.y, 'snakeBody');
            this.snake.push(newSegment);
        } else {
            // Déplacer le serpent
            const tail = this.snake.pop();
            tail.x = newX;
            tail.y = newY;
            this.snake.unshift(tail);
        }
        
        // Mettre à jour la texture de la tête
        this.snake[0].setTexture('snakeHead');
        this.snake[0].setRotation(this.getHeadRotation());
    }
    
    getHeadRotation() {
        switch (this.direction) {
            case 'up': return -Math.PI / 2;
            case 'down': return Math.PI / 2;
            case 'left': return Math.PI;
            case 'right': return 0;
            default: return 0;
        }
    }
    
    showGameOver() {
        this.add.text(400, 300, 'GAME OVER', {
            fontSize: '64px',
            fill: '#FF5722',
            fontFamily: 'Arial',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.add.text(400, 350, `Score final: ${this.score}`, {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(400, 400, 'Appuyez sur ESPACE pour recommencer', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    update() {
        if (this.gameOver) {
            if (this.cursors.space.isDown) {
                this.scene.restart();
            }
            return;
        }
        
        // Gestion des contrôles
        if (this.cursors.up.isDown && this.direction !== 'down') {
            this.nextDirection = 'up';
        } else if (this.cursors.down.isDown && this.direction !== 'up') {
            this.nextDirection = 'down';
        } else if (this.cursors.left.isDown && this.direction !== 'right') {
            this.nextDirection = 'left';
        } else if (this.cursors.right.isDown && this.direction !== 'left') {
            this.nextDirection = 'right';
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: SnakeGame
};

const game = new Phaser.Game(config);
