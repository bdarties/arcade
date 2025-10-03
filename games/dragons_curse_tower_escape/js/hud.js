export default class hud extends Phaser.Scene {
  constructor() {
    super({ key: 'hud', active: true });
  }

  preload() {
    this.load.image('heart_full', '../assets/hud/health/heart_full.png');
    this.load.image('heart_empty', '../assets/hud/health/heart_empty.png');
    this.load.image('heart_1q', '../assets/hud/health/heart_1q.png');
    this.load.image('heart_3q', '../assets/hud/health/heart_3q.png');
    this.load.image('heart_half', '../assets/hud/health/heart_half.png');
  }

  create() {
    const { width, height } = this.cameras.main;

    this.heart = this.add.image(width / 2, height - 50, 'heart_full')
      .setScrollFactor(0)
      .setScale(0.5);

    this.healthText = this.add.text(width / 2, height - 50, '0', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    })
      .setOrigin(0.5)
      .setScrollFactor(0);
  }

  update() {
    var health = this.registry.get('playerHealth') || 5;

    // Sélection de la texture en fonction des PV
    let texture = 'heart_empty';
    if (health >= 5) {
      texture = 'heart_empty';
    } else if (health === 4) {
      texture = 'heart_3q';
    } else if (health === 3) {
      texture = 'heart_half';
    } else if (health === 2) {
      texture = 'heart_1q';
    } else if (health === 1) {
      texture = 'heart_empty';
    }

    this.heart.setTexture(texture);
    this.healthText.setText(health);
  }
}
