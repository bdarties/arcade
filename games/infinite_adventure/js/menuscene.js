// Scène de menu principal
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedIndex = 0;
        this.buttons = [];
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

        // Fond
        this.add.image(width / 2, height / 2, 'background')
            .setOrigin(0.5)
            .setDisplaySize(width, height);

        // Titre avec animation
        if (this.textures.exists('title')) {
            const title = this.add.image(width / 2, 200, 'title')
                .setOrigin(0.5)
                .setScale(1.75);

            this.tweens.add({
                targets: title,
                y: 208,
                duration: 2000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }

        // Configuration des boutons
        const centerX = width / 2;
        const startY = height / 2 + 60;
        const spacing = 110;

        const buttonConfigs = [
            { sprite: 3, y: startY, action: () => this.scene.start('PreloadScene') },
            { sprite: 0, y: startY + spacing, action: null },
            { sprite: 2, y: startY + spacing * 2, action: null }
        ];

        // Créer les boutons
        buttonConfigs.forEach((config, i) => {
            const btn = this.add.sprite(centerX, config.y, 'buttons', config.sprite)
                .setInteractive({ useHandCursor: true })
                .setScale(0.85)
                .setData('action', config.action)
                .setData('index', i)
                .setData('baseScale', 0.85); // FIX 1: Stocker l'échelle de base

            this.setupButtonEvents(btn);
            this.buttons.push(btn);
        });

        // Sélection initiale
        this.selectButton(0);

        // Navigation clavier
        const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        const downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        const kKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER); // FIX 2: Ajouter Enter

        upKey.on('down', () => this.navigate(-1));
        downKey.on('down', () => this.navigate(1));
        kKey.on('down', () => this.activateButton());
        enterKey.on('down', () => this.activateButton()); // FIX 2: Enter aussi
    }

    setupButtonEvents(btn) {
        btn.on('pointerover', () => {
            const index = btn.getData('index');
            this.selectButton(index);
        });

        btn.on('pointerdown', () => {
            this.tweens.killTweensOf(btn);
            btn.setScale(0.8);
        });

        btn.on('pointerup', () => {
            this.tweens.killTweensOf(btn);
            btn.setScale(0.95);
            
            const action = btn.getData('action');
            if (action) {
                // FIX 3: Petit délai pour voir l'animation
                this.time.delayedCall(100, () => action());
            }
        });

        btn.on('pointerout', () => {
            const index = btn.getData('index');
            const baseScale = btn.getData('baseScale');
            
            // FIX 4: Ne réinitialiser que si ce n'est pas le bouton sélectionné
            if (index !== this.selectedIndex) {
                this.tweens.killTweensOf(btn);
                btn.setScale(baseScale);
            }
        });
    }

    navigate(dir) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        this.selectButton(this.selectedIndex);
    }

    selectButton(index) {
        // FIX 5: Vérifier que l'index est valide
        if (index < 0 || index >= this.buttons.length) return;

        // Désélectionner tous les boutons
        this.buttons.forEach((btn, i) => {
            if (i !== index) {
                this.tweens.killTweensOf(btn);
                const baseScale = btn.getData('baseScale') || 0.85;
                btn.setScale(baseScale);
            }
        });

        // Sélectionner le nouveau
        this.selectedIndex = index;
        const selectedBtn = this.buttons[index];
        
        this.tweens.killTweensOf(selectedBtn); // FIX 6: Tuer les tweens existants avant d'en créer un nouveau
        this.tweens.add({
            targets: selectedBtn,
            scale: 0.95,
            duration: 150,
            ease: 'Back.easeOut'
        });
    }

    activateButton() {
        const btn = this.buttons[this.selectedIndex];
        if (!btn) return; // FIX 7: Vérifier que le bouton existe
        
        const action = btn.getData('action');
        if (action) {
            // Animation de clic
            this.tweens.killTweensOf(btn);
            btn.setScale(0.8);
            
            this.time.delayedCall(100, () => {
                btn.setScale(0.95);
                action();
            });
        }
    }

    // FIX 8: Cleanup pour éviter les fuites mémoire
    shutdown() {
        this.buttons = [];
        this.selectedIndex = 0;
    }
}