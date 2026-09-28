import { PreloadScene, GameScene, UIScene, GameOverScene } from './js/scenes.js';
import { MenuScene, StoryScene, CreditsScene } from './js/menuscene.js';

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
    this.luckyNumbers = [42];
  }
  
  preload() {
    // Uniquement les petits assets nécessaires à l'écran de chargement
    // lui-même : ils arrivent quasi instantanément, donc create() peut
    // afficher le titre et la barre tout de suite. Le fichier plus lourd
    // (la musique) est chargé ensuite, dans create(), pour que la barre
    // puisse suivre sa vraie progression au lieu d'une animation minutée.
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

    const updateBar = (percent) => {
      const visibleWidth = 8 + (48 * percent);
      progressBar.setCrop(0, 0, visibleWidth, 16);
      const displayPercent = percent >= 1 ? luckyNumber : Math.floor(percent * 100);
      loadingText.setText(`Chargement... ${displayPercent}%`);
    };
    updateBar(0);

    const finish = () => {
      updateBar(1);
      this.time.delayedCall(400, () => {
        // Musique de fond, en boucle pour toute la durée du jeu. Si le
        // navigateur bloque l'autoplay, Phaser la démarrera dès la
        // première touche/pointeur pressé (déblocage automatique).
        this.sound.play('theme', { loop: true, volume: 0.5 });
        this.scene.start('MenuScene');
      });
    };

    // Le fichier lourd (la musique) est récupéré à la main via fetch(), en
    // lisant le flux par morceaux, pour que la barre suive le vrai nombre
    // d'octets reçus. this.load.on('progress') ne suffit pas ici : pour un
    // seul gros fichier, Phaser ne rapporte que 0% puis 100% (progression
    // comptée par fichier, pas par octet), ce qui donnait une barre figée
    // qui sautait d'un coup à la fin.
    const FALLBACK_SIZE = 2.5 * 1024 * 1024; // estimation si Content-Length est absent
    fetch('assets/theme_tetris.mp3')
      .then((response) => {
        const total = Number(response.headers.get('Content-Length')) || FALLBACK_SIZE;
        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        const pump = () => reader.read().then(({ done, value }) => {
          if (done) {
            const bytes = new Uint8Array(received);
            let offset = 0;
            for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
            return bytes.buffer;
          }
          chunks.push(value);
          received += value.length;
          updateBar(Math.min(received / total, 0.99));
          return pump();
        });

        return pump();
      })
      .then((arrayBuffer) => this.sound.context.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        this.cache.audio.add('theme', audioBuffer);
        finish();
      })
      .catch((err) => {
        console.error('Musique non chargée :', err);
        finish();
      });
  }
}

const config = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  antialias: false,
  roundPixels: true,
  
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
      overlapBias: 4
    }
  },
  
  scene: [BootScene, StoryScene, MenuScene, PreloadScene, GameScene, UIScene, GameOverScene, CreditsScene],
  pixelArt: true,
  
  fps: {
    target: 60,
  },
  
  banner: false,
  
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    transparent: false,
    clearBeforeRender: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  }
};

export const game = new Phaser.Game(config);