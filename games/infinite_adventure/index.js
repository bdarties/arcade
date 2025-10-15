import { PreloadScene, GameScene, UIScene, GameOverScene } from './js/scenes.js';
import { MenuScene } from './js/menuscene.js';

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
    this.luckyNumbers = [42];
  }
  
  preload() {
    this.load.spritesheet('barre', 'assets/barre.png', { frameWidth: 64, frameHeight: 16 });
    this.load.image('title', 'assets/title.png');
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Fond simple sans dégradé
    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0, 0);
    
    // Titre optimisé
    this.add.image(width / 2, height / 2 - 80, 'title')
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
    
    const luckyNumber = this.luckyNumbers[Math.floor(Math.random() * this.luckyNumbers.length)];
    
    // Chargement optimisé
    let progress = 0;
    const totalSteps = 100;
    
    this.time.addEvent({
      delay: 30,
      repeat: totalSteps,
      callback: () => {
        progress += 1;
        const percent = progress / totalSteps;
        const visibleWidth = 8 + (48 * percent);
        progressBar.setCrop(0, 0, visibleWidth, 16);
        
        const displayPercent = Math.floor(percent * 100) > 99 ? luckyNumber : Math.floor(percent * 100);
        loadingText.setText(`Chargement... ${displayPercent}%`);
        
        if (progress >= totalSteps) {
          this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
          });
        }
      }
    });
  }
}

const config = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  antialias: false,
  roundPixels: true,
  batchSize: 1024, 
  
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: 'game-container',
    expandParent: true
  },
  
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
      fps: 60,
      timeScale: 1,
      overlapBias: 4,
      maxEntities: 256 
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
  
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    transparent: false,
    clearBeforeRender: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: true,
    powerPreference: 'low-power',
    maxLights: 1 
  },
  
  plugins: {
    global: []
  }
};

export const game = new Phaser.Game(config);