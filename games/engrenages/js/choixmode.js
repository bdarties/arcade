import { musicManager } from './MusicManager.js';

export default class ChoixMode extends Phaser.Scene {
    constructor() {
        super({ key: 'choixmode' });
    }

    preload() {
        musicManager.preloadMusic(this);
        
        // Charger le fond et les boutons
        this.load.image("background_niveau3", "assets/background_niveau3.jpg"); // Utiliser un fond steampunk existant
        this.load.image("button", "assets/button.png");
        this.load.image("screen_background", "assets/screen_background.jpg");
        // Précharger les images des aperçus de mode
        this.load.image('modehistoire', 'assets/modehistoire.jpg');
        this.load.image('modespeedrun', 'assets/modespeedrun.jpg');
        // Petite décoration (engrenage) pour le coin du cadre
        this.load.image('gear_deco', 'assets/engrenages_sprite.png');
    }

    create() {
        this.cameras.main.fadeIn(200, 0, 0, 0);

        this.navSound = this.sound.add("navig_bouton", { volume: 0.5 });
        this.clicSound = this.sound.add("clic_bouton", { volume: 0.5 });

        // Initialiser et jouer la musique
        musicManager.scene = this;
        musicManager.play('choixmode');

        // Ajouter le fond steampunk
        this.add.image(this.game.config.width / 2, this.game.config.height / 2, "screen_background")
            .setScale(1)
            .setTint(0x886644); // Teinte sépia pour renforcer l'aspect steampunk

        // Titre stylisé
        const titleStyle = {
            fontFamily: 'Cinzel Decorative',
            fontSize: '12px',
            color: '#d9c8adff',
            //stroke: '#2c1810',
            //strokeThickness: 6,
            //shadow: { blur: 4, color: '#000000', fill: true }
        };
        //this.add.text(this.game.config.width / 2, 150, 'Choisissez votre mode', titleStyle)
        //    .setOrigin(0.5);

        // Position des boutons
        const buttonY1 = 250;
        const buttonY2 = 450;
        const buttonX = this.game.config.width / 4.5;

    // --- Cadre aperçu à droite (taille exacte des images 1248x832) ---
    const boxWidth = 550;
    const boxHeight = 366;
        const boxX = this.game.config.width * 0.75; // centre du cadre
        const boxY = this.game.config.height / 2;

        // Créer un graphic pour le cadre steampunk
        const frame = this.add.graphics();
        const outerColor = 0x3b2b22; // brun foncé
        const borderColor = 0xb38b5a; // doré / cuivre
        const radius = 12;

        // Dessiner l'arrière-plan du cadre (ombre)
        frame.fillStyle(0x221911, 1);
        frame.fillRoundedRect(boxX - boxWidth / 2 + 6, boxY - boxHeight / 2 + 6, boxWidth, boxHeight, radius);

        // Dessiner le cadre principal
        frame.fillStyle(outerColor, 1);
        frame.fillRoundedRect(boxX - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, radius);

        // Bordure
        frame.lineStyle(6, borderColor, 1);
        frame.strokeRoundedRect(boxX - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, radius);

        // Zone interne (pour le masque)
        const innerPadding = 12;
        const maskShape = this.add.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(
            boxX - boxWidth / 2 + innerPadding,
            boxY - boxHeight / 2 + innerPadding,
            boxWidth - innerPadding * 2,
            boxHeight - innerPadding * 2,
            radius - 4
        );

        // Image d'aperçu (par défaut histoire)
        this.previewImage = this.add.image(boxX, boxY, 'modehistoire')
            // Afficher à la taille native demandée pour ne pas déformer
            .setDisplaySize(boxWidth - innerPadding * 2, boxHeight - innerPadding * 2)
            .setDepth(1);

        // Overlay noir pour le fondu au noir lors du changement d'image
        this.previewOverlay = this.add.rectangle(
            boxX,
            boxY,
            boxWidth - innerPadding * 2,
            boxHeight - innerPadding * 2,
            0x000000
        ).setAlpha(0).setDepth(2);

        // Appliquer le masque pour que l'image reste dans le cadre
        const mask = maskShape.createGeometryMask();
        this.previewImage.setMask(mask);
    this.previewOverlay.setMask(mask);

        // Décoration : petite vignette engrenage en bas à droite du cadre
        const deco = this.add.image(
            boxX + boxWidth / 2 - 60,
            boxY + boxHeight / 2 - 60,
            'gear_deco'
        ).setScale(0.08).setTint(0xb38b5a).setAlpha(0.9).setDepth(3);


        // Style du texte des boutons
        const buttonStyle = {
            fontFamily: 'Cinzel Decorative',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#f3d4a5ff'
        };

        // Texte des boutons
        this.boutonHistoire = this.add.text(buttonX, buttonY1, 'Mode Histoire', buttonStyle)
            .setOrigin(0.5);
        this.boutonSpeedrun = this.add.text(buttonX, buttonY2, 'Mode Speedrun', buttonStyle)
            .setOrigin(0.5);

        // Descriptions steampunk
        const descStyle = {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '20px',
            color: '#d4a157',
            align: 'center',
            wordWrap: { width: 500 }
        };

        this.histoireDesc = this.add.text(buttonX + 65, buttonY1 + 60,
            "Plongez dans une aventure narrative où\nchaque rouage conte son histoire", descStyle)
            .setOrigin(0.5)
            .setAlpha(0);

        this.speedrunDesc = this.add.text(buttonX + 65, buttonY2 + 60,
            "Choisissez un niveau et défiez le temps\ntel un maître horloger chevronné", descStyle)
            .setOrigin(0.5)
            .setAlpha(0);

        // Configuration des contrôles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

        // Index du bouton sélectionné (0 = histoire, 1 = speedrun)
        this.selectedIndex = 0; // Histoire est présélectionné par défaut
        
        // Configurer l'interactivité des boutons
        this.boutonHistoire.setInteractive();
        this.boutonSpeedrun.setInteractive();
        
        // Définir la méthode pour mettre à jour la sélection visuelle
        this.updateSelection = () => {
            // Réinitialiser l'apparence de tous les boutons
            this.boutonHistoire.setScale(1.2).setAlpha(1);
            this.boutonSpeedrun.setScale(1.2).setAlpha(1);
            this.histoireDesc.setAlpha(0);
            this.speedrunDesc.setAlpha(0);

            // Mettre en évidence le bouton sélectionné et réduire l'opacité de l'autre
            if (this.selectedIndex === 0) {
                this.boutonHistoire.setScale(1.4);
                this.histoireDesc.setAlpha(1);
                this.boutonSpeedrun.setAlpha(0.7);
                // Mettre à jour l'aperçu à droite pour le mode histoire (fondu au noir)
                if (this.previewImage) {
                    this.changePreview('modehistoire');
                }
            } else {
                this.boutonSpeedrun.setScale(1.4);
                this.speedrunDesc.setAlpha(1);
                this.boutonHistoire.setAlpha(0.7);
                // Mettre à jour l'aperçu à droite pour le mode speedrun (fondu au noir)
                if (this.previewImage) {
                    this.changePreview('modespeedrun');
                }
            }
        };

        // Fonction utilitaire pour changer l'image d'aperçu avec fondu au noir
        this.changePreview = (key) => {
            if (!this.previewImage || !this.previewOverlay) return;
            if (this.previewImage.texture.key === key) return; // déjà l'image demandée

            // Fondu vers noir
            this.tweens.killTweensOf(this.previewOverlay);
            this.tweens.add({
                targets: this.previewOverlay,
                alpha: 1,
                duration: 250,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    // Changer la texture quand l'écran est noir
                    this.previewImage.setTexture(key);
                    // Petit délai pour s'assurer du changement visuel
                    this.time.delayedCall(50, () => {
                        // Révéler progressivement
                        this.tweens.add({
                            targets: this.previewOverlay,
                            alpha: 0,
                            duration: 300,
                            ease: 'Quad.easeOut'
                        });
                    });
                }
            });
        };

      
            
        // Appliquer la sélection initiale
        this.updateSelection();

// Fonctionnalité clavier M pour retour
    this.input.keyboard.once("keydown-M", () => {
      if (this.fromPause) {
        this.scene.stop(); // Arrête la scène des contrôles
        this.scene.wake('pause'); // Réactive la scène pause
      } else {
        this.scene.start("accueil");
      }
    });

    }

    update() {
        // Gérer la navigation avec les flèches
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.selectedIndex > 0) {
            this.selectedIndex--;
            this.updateSelection();
            this.navSound.play();
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) && this.selectedIndex < 1) {
            this.selectedIndex++;
            this.updateSelection();
            this.navSound.play();
        }

        // Gérer la sélection avec la touche I
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            if (this.selectedIndex === 0) {
                this.clicSound.play();
                  // Fade out avant de changer de scène
                this.cameras.main.fadeOut(500, 0, 0, 0); // 500ms, couleur noire
                this.cameras.main.shake(200, 0.01);

                // Attendre la fin du fade avant de changer de scène
                this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('introvideo1');
                });
                // Mode histoire : commence par la video1 puis niveau1
                
            } else {
                this.clicSound.play();
                this.cameras.main.fadeOut(500, 0, 0, 0);
                // Mode speedrun : va directement à la sélection des niveaux
                this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('selection', { mode: 'speedrun' });
                });
            }
        }
    }

}