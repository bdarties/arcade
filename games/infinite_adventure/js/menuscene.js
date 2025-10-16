export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    init() {
        this.selectedIndex = 0;
        this.buttons = [];
        // Récupérer le mode coop depuis le registry (par défaut: false)
        this.isCoopMode = this.registry.get('isCoopMode') || false;
    }

    preload() {
        this.load.spritesheet('buttons', 'assets/bouton_1.png', { 
            frameWidth: 301, 
            frameHeight: 95 
        });
        this.load.image('background', 'assets/background.jpg');
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.image(width / 2, height / 2, 'background')
            .setOrigin(0.5)
            .setDisplaySize(width, height);

        if (this.textures.exists('title')) {
            this.add.image(width / 2, 200, 'title')
                .setOrigin(0.5)
                .setScale(1.75);
        }

        const centerX = width / 2;
        const startY = height / 2 + 60;
        const spacing = 110;

        const buttonConfigs = [
            { 
                sprite: 3, 
                y: startY, 
                action: () => {
                    this.registry.set('isCoopMode', false);
                    this.scene.start('PreloadScene');
                }
            },
            { 
                sprite: 0, 
                y: startY + spacing, 
                action: () => {
                    this.registry.set('isCoopMode', true);
                    this.scene.start('PreloadScene');
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
        if (action) action();
    }

    shutdown() {
        this.input.keyboard.removeAllListeners();
        this.buttons = [];
    }
}