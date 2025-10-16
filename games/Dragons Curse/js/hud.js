export default class hud extends Phaser.Scene {
  constructor() {
    super({ key: 'hud', active: true });
  }

  preload() {
    this.load.spritesheet('coeurs', 'assets/hud/healths.png', { frameWidth: 20, frameHeight: 20 });
    this.load.spritesheet('xp_bar', 'assets/hud/barrexp.png', { frameWidth: 58.89, frameHeight: 13 });
    this.load.image('potion_icon', 'assets/items/potion.png');
  }

  create() {
    const { width, height } = this.cameras.main;

    this.heart = this.add.image(width / 2, height - 50, 'coeurs', 0)
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
      .setOrigin(0.5, 0.5)
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

    // Barre d'XP en bas à gauche (spritesheet)
    this.xpBar = this.add.image(100, height - 30, 'xp_bar', 0)
      .setScrollFactor(0)
      .setScale(3)
      .setDepth(1000);

    this.xpText = this.add.text(100, height - 55, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 3
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);

    // Icône de potion en bas à droite
    this.potionIcon = this.add.image(width - 80, height - 50, 'potion_icon')
      .setScrollFactor(0)
      .setScale(1)
      .setDepth(1000)
      .setTint(0xff00ff);

    this.potionText = this.add.text(width - 50, height - 50, '0', {
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
    var health = this.registry.get('playerHealth') || 5;
    var maxHealth = this.registry.get('playerMaxHealth') || 5;

    let frame = 8;
    
    // Calculer le pourcentage de vie
    const healthPercent = health / maxHealth;
    
    if (healthPercent >= 0.875) {       // 7.875/9 ou plus = coeur plein
      frame = 0;
    } else if (healthPercent >= 0.625) { // 5.625/9 = 3/4
      frame = 1;
    } else if (healthPercent >= 0.375) { // 3.375/9 = 1/2
      frame = 2;
    } else if (healthPercent >= 0.125) { // 1.125/9 = 1/4
      frame = 3;
    } else {                             // Presque vide
      frame = 4;
    }

    this.heart.setFrame(frame);
    this.healthText.setText(health);

    // Mise à jour du niveau et de l'XP
    const level = this.registry.get('playerLevel') || 1;
    const xp = this.registry.get('playerXP') || 0;
    const enemiesKilled = this.registry.get('enemiesKilled') || 0;
    const xpForNext = 3;
    
    // Calculer la frame de la barre d'XP (0-9 frames pour 10 états)
    const xpPercent = xp / xpForNext;
    let xpFrame = Math.floor(xpPercent * 10); // 0 à 10
    if (xpFrame > 9) xpFrame = 9; // Limiter à la frame 9 (barre pleine)
    
    this.xpBar.setFrame(xpFrame);
    
    this.xpText.setText(`Level ${level}`);

    // Mise à jour du nombre de potions
    // Import dynamique pour accéder à nbPotions
    import('./fonctions.js').then(fct => {
      const potions = fct.getNbPotions();
      this.potionText.setText(`${potions}`);
    });
  }
}