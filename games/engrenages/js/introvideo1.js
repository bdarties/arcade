import { musicManager } from './MusicManager.js';

export default class IntroVideo1 extends Phaser.Scene {
    constructor() {
        super({ key: 'introvideo1' });
    }

    preload() {
        this.load.video('video1', 'assets/video/video1.MP4', 'loadeddata', true, false); // true pour noControls, false pour crossOrigin
        this.load.image('skip_icon', 'assets/bouton_a.png');
    }


    create() {
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        // Arrêter la musique pendant la vidéo
        if (musicManager.currentMusic) {
            musicManager.stop();
        }

        // Créer la vidéo et la centrer
        const video = this.add.video(this.game.config.width / 2, this.game.config.height / 2, 'video1');
        // Activer le son
        video.setMute(false);
        
        // Démarrer la vidéo
        video.play();

        // Quand la vidéo est finie, lancer le niveau 1
        video.on('complete', () => {
            cleanupAndStart.call(this);
        });

        // --- Support pour passer la vidéo en maintenant la touche I pendant 1 seconde ---
        const margin = 20;
        const gaugeWidth = 120;
        const gaugeHeight = 20;
        const xRight = this.game.config.width - margin;
        const yBottom = this.game.config.height - margin;

        //skip icon
        const skipIcon = this.add.image(xRight - 20, yBottom - 70, 'skip_icon').setOrigin(1, 1).setScale(0.5);

        // Texte petit en bas à droite
        const skipText = this.add.text(xRight - 150, yBottom - 20, 'passer la vidéo', {
            font: '24px Arial',
            fill: '#ffffff',
            align: 'right'
        }).setOrigin(1, 1);
        skipText.setAlpha(0.85);

        // Contour de la jauge
        const gaugeBg = this.add.rectangle(xRight - gaugeWidth / 2, yBottom - 22, gaugeWidth, gaugeHeight, 0x000000)
            .setOrigin(0.5, 1)
            .setStrokeStyle(1, 0xffffff)
            .setAlpha(0.9);

        // Remplissage (évoluera en scaleX)
        const gaugeFill = this.add.rectangle(gaugeBg.x - gaugeWidth / 2, gaugeBg.y - gaugeHeight / 2, gaugeWidth, gaugeHeight, 0xffffff)
            .setOrigin(0, 0.5);
        gaugeFill.scaleX = 0; // invisible au départ

        // Masquer par défaut (montrer seulement quand on appuie)
        skipText.setVisible(false);
        gaugeBg.setVisible(false);
        gaugeFill.setVisible(false);

        // Variables d'état
        this._holdTimer = null;
        this._gaugeTween = null;

        const startHold = () => {
            if (this._holdTimer) return; // déjà en cours
            skipText.setVisible(true);
            gaugeBg.setVisible(true);
            gaugeFill.setVisible(true);

            // Tween pour remplir la jauge en 1s
            this._gaugeTween = this.tweens.add({
                targets: gaugeFill,
                scaleX: 1,
                duration: 1000,
                ease: 'Linear'
            });

            // Timer qui déclenche le skip après 1s
            this._holdTimer = this.time.delayedCall(1000, () => {
                cleanupAndStart.call(this);
            }, [], this);
        };

        const cancelHold = () => {
            if (this._holdTimer && !this._holdTimer.hasDispatched) {
                this._holdTimer.remove(false);
            }
            this._holdTimer = null;

            if (this._gaugeTween) {
                this._gaugeTween.stop();
                this._gaugeTween = null;
            }

            // réinitialiser la jauge visuelle
            gaugeFill.scaleX = 0;
            skipText.setVisible(false);
            gaugeBg.setVisible(false);
            gaugeFill.setVisible(false);
        };

        // Écouteurs clavier pour I (hold)
        const keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        keyI.on('down', startHold);
        keyI.on('up', cancelHold);

        // Fonction utilitaire de nettoyage et de transition
        function cleanupAndStart() {
            // retirer listeners clavier liés
            try {
                keyI.off('down', startHold);
                keyI.off('up', cancelHold);
            } catch (e) {}

            // s'assurer de stopper le timer/tween
            if (this._holdTimer && !this._holdTimer.hasDispatched) this._holdTimer.remove(false);
            if (this._gaugeTween) this._gaugeTween.stop();

            // détruire les éléments UI
            skipText.destroy();
            gaugeBg.destroy();
            gaugeFill.destroy();

            try { video.destroy(); } catch (e) {}

            // Lancer la scène suivante
            this.scene.start('niveau1');
        }
    }
}