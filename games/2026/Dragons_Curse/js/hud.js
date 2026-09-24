export default class hud extends Phaser.Scene {
  constructor() {
    super({ key: 'hud', active: true });
    this.nbPotions = 0; // Cache local pour éviter les imports répétés
  }

  preload() {
    this.load.spritesheet('coeurs', './assets/hud/healths.png', { 
      frameWidth: 20.88, 
      frameHeight: 20 
    });
    this.load.spritesheet('xp_bar', './assets/hud/barrexp.png', { 
      frameWidth: 58.89, 
      frameHeight: 13 
    });
    this.load.image('potion_icon', './assets/items/potion.png');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Cœur (centré en bas)
    this.heart = this.add.sprite(width / 2, height - 50, 'coeurs', 0)
      .setScrollFactor(0)
      .setScale(3) // Plus grand pour mieux voir
      .setDepth(1000);

    // Texte de vie centré sur le cœur
    this.healthText = this.add.text(width / 2, height - 50, '5', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(1001);

    // Barre d'XP en bas à gauche
    this.xpBar = this.add.sprite(100, height - 30, 'xp_bar', 0)
      .setScrollFactor(0)
      .setScale(3)
      .setDepth(1000);

    // Texte du niveau au-dessus de la barre d'XP
    this.levelText = this.add.text(100, height - 55, 'Level 1', {
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

    // Import initial des potions
    this.updatePotionCount();
  }

  update() {
    const health = this.registry.get('playerHealth') || 5;
    const maxHealth = this.registry.get('playerMaxHealth') || 5;

    // Calculer la frame du cœur (9 frames : 0=vide, 8=plein)
    // Le cœur se vide proportionnellement au % de vie
    const healthPercent = health / maxHealth;
    let frame;

    if (health <= 0) {
      frame = 0; // Complètement vide
    } else if (healthPercent > 0.875) {
      frame = 8; // Presque plein à plein (87.5%-100%)
    } else if (healthPercent > 0.75) {
      frame = 7; // 75%-87.5%
    } else if (healthPercent > 0.625) {
      frame = 6; // 62.5%-75%
    } else if (healthPercent > 0.5) {
      frame = 5; // 50%-62.5%
    } else if (healthPercent > 0.375) {
      frame = 4; // 37.5%-50%
    } else if (healthPercent > 0.25) {
      frame = 3; // 25%-37.5%
    } else if (healthPercent > 0.125) {
      frame = 2; // 12.5%-25%
    } else {
      frame = 1; // 0%-12.5% (presque vide)
    }

    this.heart.setFrame(frame);
    this.healthText.setText(`${health}`);

    // Mise à jour du niveau et de l'XP
    const level = this.registry.get('playerLevel') || 1;
    const xp = this.registry.get('playerXP') || 0;
    const xpForNext = 3;

    // Frame de la barre d'XP (0-9)
    const xpPercent = xp / xpForNext;
    let xpFrame = Math.floor(xpPercent * 10);
    if (xpFrame > 9) xpFrame = 9;

    this.xpBar.setFrame(xpFrame);
    this.levelText.setText(`Level ${level}`);

    // Mise à jour des potions (moins fréquente)
    if (this.time.now % 500 < 16) { // Toutes les ~500ms
      this.updatePotionCount();
    }
  }

  updatePotionCount() {
    import('./fonctions.js').then(fct => {
      this.nbPotions = fct.getNbPotions();
      this.potionText.setText(`${this.nbPotions}`);
    }).catch(() => {
      // Fallback si l'import échoue
      this.potionText.setText(`${this.nbPotions}`);
    });
  }
}