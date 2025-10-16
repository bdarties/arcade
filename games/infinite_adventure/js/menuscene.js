// StoryScene.js - Scène d'histoire avec 5 pages
export class StoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoryScene' });
    }

    init() {
        this.currentPage = 1;
        this.totalPages = 5; // Passé de 3 à 5 pages
    }

    preload() {
        // Charger les images d'histoire (maintenant 5 images)
        this.load.image('histoire_1', 'assets/histoire_1.jpg');
        this.load.image('histoire_2', 'assets/histoire_2.jpg');
        this.load.image('histoire_3', 'assets/histoire_3.jpg');
        this.load.image('histoire_4', 'assets/histoire_4.jpg');
        this.load.image('histoire_5', 'assets/histoire_5.jpg');
        
        // Charger le sprite sheet du bouton
        this.load.spritesheet('bouton_d', 'assets/bouton_d.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        
        // Charger la musique de l'histoire
        this.load.audio('story_music', 'assets/sound/fire.mp3');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Démarrer la musique de l'histoire
        this.storyMusic = this.sound.add('story_music', { 
            loop: true, 
            volume: 0.5 
        });
        this.storyMusic.play();

        // Afficher l'image d'histoire actuelle
        this.storyImage = this.add.image(width / 2, height / 2, `histoire_${this.currentPage}`)
            .setOrigin(0.5);
        
        // Ajuster la taille de l'image pour remplir l'écran
        const scaleX = width / this.storyImage.width;
        const scaleY = height / this.storyImage.height;
        const scale = Math.max(scaleX, scaleY);
        this.storyImage.setScale(scale);

        // Créer l'animation du bouton
        this.anims.create({
            key: 'button_pulse',
            frames: this.anims.generateFrameNumbers('bouton_d', { start: 0, end: 2 }),
            frameRate: 6,
            repeat: -1
        });

        // Ajouter le bouton animé en bas à droite
        this.continueButton = this.add.sprite(width - 50, height - 50, 'bouton_d')
            .setScale(3)
            .play('button_pulse');

        // Ajouter un indicateur de page
        this.pageText = this.add.text(width - 50, height - 100, `${this.currentPage}/${this.totalPages}`, {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Gestion des inputs
        this.input.keyboard.on('keydown-K', () => this.nextPage());
        this.input.keyboard.on('keydown-ENTER', () => this.nextPage());
        this.input.keyboard.on('keydown-F', () => this.nextPage());
        this.input.keyboard.on('keydown-SPACE', () => this.nextPage());
        
        // Clic sur l'écran pour continuer
        this.input.on('pointerdown', () => this.nextPage());
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            // Passer à la page suivante
            this.currentPage++;
            this.storyImage.setTexture(`histoire_${this.currentPage}`);
            
            // Réajuster la taille
            const { width, height } = this.cameras.main;
            const scaleX = width / this.storyImage.width;
            const scaleY = height / this.storyImage.height;
            const scale = Math.max(scaleX, scaleY);
            this.storyImage.setScale(scale);
            
            // Mettre à jour l'indicateur de page
            this.pageText.setText(`${this.currentPage}/${this.totalPages}`);
        } else {
            // Fin de l'histoire, arrêter la musique et lancer le jeu
            if (this.storyMusic) {
                this.storyMusic.stop();
            }
            this.scene.start('PreloadScene');
        }
    }

    shutdown() {
        // Arrêter la musique si la scène se ferme
        if (this.storyMusic) {
            this.storyMusic.stop();
        }
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners();
    }
}

// MenuScene.js - Avec bouton animé bouton_d
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    init() {
        this.selectedIndex = 0;
        this.buttons = [];
        this.isCoopMode = this.registry.get('isCoopMode') || false;
    }

    preload() {
        this.load.spritesheet('buttons', 'assets/bouton_1.png', { 
            frameWidth: 301, 
            frameHeight: 95 
        });
        // Charger le bouton animé pour le menu
        this.load.spritesheet('bouton_d', 'assets/bouton_d.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        this.load.image('background', 'assets/background.jpg');
        this.load.audio('menu_music', 'assets/sound/dungeon_1.mp3');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Démarrer la musique du menu
        if (!this.sound.get('menu_music')) {
            this.menuMusic = this.sound.add('menu_music', { 
                loop: true, 
                volume: 0.5 
            });
            this.menuMusic.play();
        }

        this.add.image(width / 2, height / 2, 'background')
            .setOrigin(0.5)
            .setDisplaySize(width, height);

        if (this.textures.exists('title')) {
            this.add.image(width / 2, 200, 'title')
                .setOrigin(0.5)
                .setScale(1.75);
        }

        // Créer l'animation du bouton_d si elle n'existe pas
        if (!this.anims.exists('button_pulse_menu')) {
            this.anims.create({
                key: 'button_pulse_menu',
                frames: this.anims.generateFrameNumbers('bouton_d', { start: 0, end: 2 }),
                frameRate: 6,
                repeat: -1
            });
        }

        // Ajouter le bouton animé en bas à droite du menu
        this.decorButton = this.add.sprite(width - 60, height - 60, 'bouton_d')
            .setScale(3)
            .play('button_pulse_menu')
            .setAlpha(0.7); // Légèrement transparent pour ne pas distraire

        const centerX = width / 2;
        const startY = height / 2 + 60;
        const spacing = 110;

        const buttonConfigs = [
            { 
                sprite: 3, 
                y: startY, 
                action: () => {
                    this.registry.set('isCoopMode', false);
                    // Lancer la scène d'histoire au lieu de PreloadScene
                    this.scene.start('StoryScene');
                }
            },
            { 
                sprite: 0, 
                y: startY + spacing, 
                action: () => {
                    this.registry.set('isCoopMode', true);
                    // Lancer la scène d'histoire au lieu de PreloadScene
                    this.scene.start('StoryScene');
                }
            },
            { 
                sprite: 2, 
                y: startY + spacing * 2, 
                action: null 
            }
        ];

        buttonConfigs.forEach((config, i) => {
            const btn = this.add.sprite(centerX, config.y, 'buttons', config.sprite)
                .setInteractive({ useHandCursor: true })
                .setScale(0.85)
                .setData('action', config.action)
                .setData('index', i);

            btn.on('pointerover', () => this.selectButton(i));
            btn.on('pointerdown', () => {
                const action = btn.getData('action');
                if (action) action();
            });

            this.buttons.push(btn);
        });

        this.selectButton(0);

        // Contrôles Joueur 1 (Flèches + K/Enter)
        this.input.keyboard.on('keydown-UP', () => this.navigate(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.navigate(1));
        this.input.keyboard.on('keydown-K', () => this.activateButton());
        this.input.keyboard.on('keydown-ENTER', () => this.activateButton());

        // Contrôles Joueur 2 (ZQSD + F)
        this.input.keyboard.on('keydown-Z', () => this.navigate(-1));
        this.input.keyboard.on('keydown-S', () => this.navigate(1));
        this.input.keyboard.on('keydown-F', () => this.activateButton());
    }

    navigate(dir) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        this.selectButton(this.selectedIndex);
    }

    selectButton(index) {
        this.buttons.forEach((btn, i) => {
            btn.setScale(i === index ? 0.95 : 0.85);
        });
        this.selectedIndex = index;
    }

    activateButton() {
        const action = this.buttons[this.selectedIndex]?.getData('action');
        if (action) {
            // Arrêter la musique du menu avant de changer de scène
            const menuMusic = this.sound.get('menu_music');
            if (menuMusic) {
                menuMusic.stop();
            }
            action();
        }
    }

    shutdown() {
        // Arrêter la musique si la scène se ferme
        const menuMusic = this.sound.get('menu_music');
        if (menuMusic) {
            menuMusic.stop();
        }
        this.input.keyboard.removeAllListeners();
        this.buttons = [];
    }
}