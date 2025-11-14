import { musicManager } from './MusicManager.js';

export default class IntroVideo4 extends Phaser.Scene {
    constructor() {
        super({ key: 'introvideo4' });
    }

    preload() {
        this.load.video('video4', 'assets/video/video4.mp4', 'loadeddata', true, false);
        this.load.image('skip_icon', 'assets/bouton_a.png');
    }

    create() {
        // Arrêter la musique pendant la vidéo
        if (musicManager.currentMusic) {
            musicManager.stop();
        }

        // Créer la vidéo et la centrer
        const video = this.add.video(this.game.config.width / 2, this.game.config.height / 2, 'video4');
        // Activer le son
        video.setMute(false);
        
        // Démarrer la vidéo
        video.play();

        // Quand la vidéo est finie, retourner à l'accueil
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

        const skipText = this.add.text(xRight - 150, yBottom - 20, 'passer la vidéo', {
            font: '24px Arial',
            fill: '#ffffff',
            align: 'right'
        }).setOrigin(1, 1);
        skipText.setAlpha(0.85);

        const gaugeBg = this.add.rectangle(xRight - gaugeWidth / 2, yBottom - 22, gaugeWidth, gaugeHeight, 0x000000)
            .setOrigin(0.5, 1)
            .setStrokeStyle(1, 0xffffff)
            .setAlpha(0.9);

        const gaugeFill = this.add.rectangle(gaugeBg.x - gaugeWidth / 2, gaugeBg.y - gaugeHeight / 2, gaugeWidth, gaugeHeight, 0xffffff)
            .setOrigin(0, 0.5);
        gaugeFill.scaleX = 0;

        skipText.setVisible(false);
        gaugeBg.setVisible(false);
        gaugeFill.setVisible(false);

        this._holdTimer = null;
        this._gaugeTween = null;

        const startHold = () => {
            if (this._holdTimer) return;
            skipText.setVisible(true);
            gaugeBg.setVisible(true);
            gaugeFill.setVisible(true);

            this._gaugeTween = this.tweens.add({
                targets: gaugeFill,
                scaleX: 1,
                duration: 1000,
                ease: 'Linear'
            });

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

            gaugeFill.scaleX = 0;
            skipText.setVisible(false);
            gaugeBg.setVisible(false);
            gaugeFill.setVisible(false);
        };

        const keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        keyI.on('down', startHold);
        keyI.on('up', cancelHold);

        function cleanupAndStart() {
            try {
                keyI.off('down', startHold);
                keyI.off('up', cancelHold);
            } catch (e) {}

            if (this._holdTimer && !this._holdTimer.hasDispatched) this._holdTimer.remove(false);
            if (this._gaugeTween) this._gaugeTween.stop();

            skipText.destroy();
            gaugeBg.destroy();
            gaugeFill.destroy();

            try { video.destroy(); } catch (e) {}

            this.scene.start('credits');
        }
    }
}