import { PreloadScene, GameScene, UIScene, GameOverScene } from './js/scenes.js';
import { MenuScene } from './js/menuscene.js';

// Scène de chargement minimaliste pour Pi3
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }
  
  preload() {
    this.load.spritesheet('barre', 'assets/barre.png', { frameWidth: 64, frameHeight: 16 });
    this.load.image('title', 'assets/title.png');
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Fond simple sans dégradé
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0, 0);
    
    // Titre sans animations complexes
    const title = this.add.image(width / 2, height / 2 - 80, 'title')
      .setOrigin(0.5)
      .setScale(2);
    
    // Barres de chargement
    const barScale = 5;
    const barY = height / 2 + 50;
    
    this.add.sprite(width / 2, barY, 'barre', 0)
      .setOrigin(0.5)
      .setScale(barScale);
    
    const progressBar = this.add.sprite(width / 2, barY, 'barre', 2)
      .setOrigin(0.5)
      .setScale(barScale)
      .setCrop(0, 0, 0, 16);
    
    const loadingText = this.add.text(width / 2, barY + 60, 'Chargement... 0%', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Chargement simplifié
    let progress = 0;
    this.time.addEvent({
      delay: 30,
      repeat: 100,
      callback: () => {
        progress += 1;
        const percent = progress / 100;
        const visibleWidth = 8 + (48 * percent);
        progressBar.setCrop(0, 0, visibleWidth, 16);
        loadingText.setText(`Chargement... ${Math.floor(percent * 100)}%`);
        
        if (progress >= 100) {
          this.time.delayedCall(200, () => {
            // Aller au menu au lieu de PreloadScene
            this.scene.start('MenuScene');
          });
        }
      }
    });
  }
}

var config = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  
  // Désactiver l'antialiasing (inutile pour pixel art)
  antialias: false,
  roundPixels: true,
  
  // Réduire la taille des batches
  batchSize: 2048,
  
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
      fps: 60,
      // Optimisation physique
      timeScale: 1,
      overlapBias: 4
    }
  },
  
  scene: [BootScene, MenuScene, PreloadScene, GameScene, UIScene, GameOverScene],
  pixelArt: true,
  
  fps: {
    target: 60,
    forceSetTimeOut: true,
    smoothStep: false
  },
  
  banner: false,
  
  // Optimisation mémoire
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    transparent: false,
    clearBeforeRender: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'low-power' 
  }
};

export var game = new Phaser.Game(config);