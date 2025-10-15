export default class hud extends Phaser.Scene {
  constructor() {
    super({ key: 'hud', active: true });
  }

  preload() {
    this.load.image('heart_empty', './assets/hud/health/heart_empty.png');
    this.load.image('heart_1q', './assets/hud/health/heart_1q.png');
    this.load.image('heart_3q', './assets/hud/health/heart_3q.png');
    this.load.image('heart_half', './assets/hud/health/heart_half.png');
    this.load.image('potion_icon', './assets/items/potion.png');
  }

  create() {
    const { width, height } = this.cameras.main;

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

    // Affichage des potions en bas à gauche
    this.potionIcon = this.add.image(50, height - 50, 'potion_icon')
      .setScrollFactor(0)
      .setScale(1)
      .setDepth(1000)
      .setTint(0xff00ff); // Teinte magenta pour différencier des coeurs

    this.potionText = this.add.text(80, height - 50, '0', {
      fontSize: '28px',
      color: '#ff00ff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'left',
    })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(1000);
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

    // Mise à jour du nombre de potions
    // Import dynamique pour accéder à nbPotions
    import('./fonctions.js').then(fct => {
      const potions = fct.getNbPotions();
      this.potionText.setText(`${potions}`);
    });
  }
}
