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

    this.healthText = this.add.text(width / 2, height - 50, '9', {
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
    var health = this.registry.get('playerHealth') || 9;
    var maxHealth = this.registry.get('playerMaxHealth') || 9;

    // Sélection de la texture en fonction des PV (logique corrigée)
    let texture = 'heart_empty';
    
    // Calculer le pourcentage de vie
    const healthPercent = health / maxHealth;
    
    if (healthPercent >= 0.875) {       // 7.875/9 ou plus = coeur plein
      texture = 'heart_full';
    } else if (healthPercent >= 0.625) { // 5.625/9 = 3/4
      texture = 'heart_3q';
    } else if (healthPercent >= 0.375) { // 3.375/9 = 1/2
      texture = 'heart_half';
    } else if (healthPercent >= 0.125) { // 1.125/9 = 1/4
      texture = 'heart_1q';
    } else {                             // Presque vide
      texture = 'heart_empty';
    }

    this.heart.setTexture(texture);
    this.healthText.setText(health);
  }
}