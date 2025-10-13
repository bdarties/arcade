export default class hud extends Phaser.Scene {
  constructor() {
    super({ key: 'hud', active: true });
  }

  preload() {
    this.load.image('heart_empty', './assets/hud/health/heart_empty.png');
    this.load.image('heart_1q', './assets/hud/health/heart_1q.png');
    this.load.image('heart_3q', './assets/hud/health/heart_3q.png');
    this.load.image('heart_half', './assets/hud/health/heart_half.png');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Création de l'effet de vignette (assombrissement des bords comme Minecraft)
    this.createVignette();

    // Use an available texture as initial (heart_full does not exist)
    this.heart = this.add.image(width / 2, height - 50, 'heart_3q')
      .setScrollFactor(0)
      .setScale(0.5)
      .setDepth(1000);

    this.healthText = this.add.text(width / 2, height - 50, '9', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);

    // Affichage du niveau en haut à gauche
    this.levelText = this.add.text(16, 16, '', {
      fontSize: '24px',
      color: '#ffff00',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4
    })
      .setScrollFactor(0)
      .setDepth(1000);

    // Barre d'XP en haut au centre
    this.xpBarBg = this.add.graphics();
    this.xpBarBg.fillStyle(0x000000, 0.7);
    this.xpBarBg.fillRect(width / 2 - 100, 16, 200, 20);
    this.xpBarBg.setScrollFactor(0);
    this.xpBarBg.setDepth(1000);

    this.xpBar = this.add.graphics();
    this.xpBar.setScrollFactor(0);
    this.xpBar.setDepth(1001);

    this.xpText = this.add.text(width / 2, 26, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 3
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);
  }

  createVignette() {
    const { width, height } = this.cameras.main;
    
    // Créer une texture de vignette avec un canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Créer un dégradé radial du centre vers les bords
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.sqrt(centerX * centerX + centerY * centerY);
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.3,  // Point de départ (30% du rayon)
      centerX, centerY, radius * 1.2   // Point final (120% du rayon)
    );
    
    // Transparent au centre, noir sur les bords
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Créer une texture à partir du canvas
    this.textures.addCanvas('vignette', canvas);
    
    // Ajouter l'image de vignette
    this.vignette = this.add.image(width / 2, height / 2, 'vignette')
      .setScrollFactor(0)
      .setDepth(999)
      .setOrigin(0.5);
  }

  update() {
    var health = this.registry.get('playerHealth') || 9;
    var maxHealth = this.registry.get('playerMaxHealth') || 9;

    // Sélection de la texture en fonction des PV (logique corrigée)
    let texture = 'heart_empty';
    
    // Calculer le pourcentage de vie
    const healthPercent = health / maxHealth;
    
    if (healthPercent >= 0.875) {       // 7.875/9 ou plus = coeur plein
      texture = 'heart_3q';
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

    // Mise à jour du niveau et de l'XP
    const level = this.registry.get('playerLevel') || 1;
    const xp = this.registry.get('playerXP') || 0;
    const enemiesKilled = this.registry.get('enemiesKilled') || 0;
    const xpForNext = 3; // Correspond à enemiesPerLevel

    // Masquer le texte de niveau (on l'affiche dans la barre maintenant)
    this.levelText.setText('');
    
    // Barre d'XP
    this.xpBar.clear();
    const barWidth = 200;
    const barHeight = 20;
    const xpPercent = xp / xpForNext;
    const fillWidth = barWidth * xpPercent;
    
    // Remplissage de la barre
    this.xpBar.fillStyle(0x00ff00, 1);
    this.xpBar.fillRect(this.cameras.main.width / 2 - 100, 16, fillWidth, barHeight);
    
    // Bordure de la barre
    this.xpBar.lineStyle(2, 0xffffff, 1);
    this.xpBar.strokeRect(this.cameras.main.width / 2 - 100, 16, barWidth, barHeight);
    
    this.xpText.setText(`Level ${level}`);
  }
}
