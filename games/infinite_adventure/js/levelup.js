const UPGRADE_CONFIG = {
  bronze: [
    { type: 'health', value: 10, icon: 13, text: '+10 Vie Max' },
    { type: 'damage', value: 5, icon: 6, text: '+5 Dégâts' },
    { type: 'speed', value: 5, icon: 2, text: '+5 Vitesse' },
    { type: 'regen', value: 0.5, icon: 16, text: '+0.5/s Régén.' },
    { type: 'attackSpeed', value: 5, icon: 0, text: '+5% Vitesse Attaque' }
  ],
  silver: [
    { type: 'health', value: 20, icon: 13, text: '+20 Vie Max' },
    { type: 'damage', value: 10, icon: 6, text: '+10 Dégâts' },
    { type: 'speed', value: 10, icon: 2, text: '+10 Vitesse' },
    { type: 'regen', value: 1, icon: 16, text: '+1/s Régén.' },
    { type: 'attackSpeed', value: 10, icon: 0, text: '+10% Vitesse Attaque' }
  ],
  gold: [
    { type: 'health', value: 50, icon: 13, text: '+50 Vie Max' },
    { type: 'damage', value: 20, icon: 6, text: '+20 Dégâts' },
    { type: 'speed', value: 20, icon: 2, text: '+20 Vitesse' },
    { type: 'regen', value: 3, icon: 16, text: '+3/s Régén.' },
    { type: 'attackSpeed', value: 20, icon: 0, text: '+20% Vitesse Attaque' }
  ]
};

export class LevelUpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelUpScene' });
  }

  init() {
    this.selectedCardIndex = 1;
    this.cards = [];
    this.elementsUI = [];
  }

  create() {
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    // Overlay
    const overlay = this.add.rectangle(
      gameWidth / 2, gameHeight / 2,
      gameWidth, gameHeight,
      0x000000, 0.70
    ).setScrollFactor(0).setDepth(150);
    this.elementsUI.push(overlay);

    // Titre
    const titre = this.add.text(
      gameWidth / 2, 60,
      'LEVEL UP!',
      {
        fontSize: '52px',
        fill: '#9bbc0f',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#306230',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(151);
    this.elementsUI.push(titre);

    this.generateUpgradeCards();

    this.input.keyboard.on('keydown-LEFT', () => {
      this.selectedCardIndex = Math.max(0, this.selectedCardIndex - 1);
      this.updateCardSelection();
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      this.selectedCardIndex = Math.min(2, this.selectedCardIndex + 1);
      this.updateCardSelection();
    });

    this.input.keyboard.on('keydown-K', () => this.confirmSelection());
    this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());

    this.updateCardSelection();
  }

  generateUpgradeCards() {
    const { width, height } = this.cameras.main;
    const cardSpacing = 260;
    const startX = width / 2 - cardSpacing;
    const cardY = height / 2;

    const selectedRarities = Array.from({ length: 3 }, () => {
      const rand = Math.random();
      return rand < 0.70 ? 'bronze' : rand < 0.95 ? 'silver' : 'gold';
    });

    const usedUpgrades = new Set();

    selectedRarities.forEach((rarity, i) => {
      const x = startX + i * cardSpacing;
      const upgrades = UPGRADE_CONFIG[rarity];
      
      const availableUpgrades = upgrades.filter(up => !usedUpgrades.has(up.type));
      const upgrade = availableUpgrades.length > 0 
        ? Phaser.Utils.Array.GetRandom(availableUpgrades)
        : Phaser.Utils.Array.GetRandom(upgrades);
      
      usedUpgrades.add(upgrade.type);
      this.createCard(x, cardY, rarity, upgrade, i);
    });
  }

  createCard(x, y, rarity, upgrade, index) {
    const cardScale = 6.5;
    const rarityFrame = rarity === 'bronze' ? 0 : rarity === 'silver' ? 1 : 2;
    
    const container = this.add.container(x, y)
      .setScrollFactor(0)
      .setDepth(151);

    const cardBg = this.add.sprite(0, 0, 'levelup', rarityFrame)
      .setScale(cardScale)
      .setOrigin(0.5, 0.5);
    container.add(cardBg);

    const icon = this.add.sprite(0, -53, 'icons_8x8', upgrade.icon)
      .setScale(cardScale)
      .setOrigin(0.5, 0.5);
    container.add(icon);

    const text = this.add.text(0, 103, upgrade.text, {
      fontSize: '16px',
      fill: '#d4d29b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    container.add(text);

    cardBg.setInteractive({ useHandCursor: true });
    
    cardBg.on('pointerover', () => {
      this.selectedCardIndex = index;
      this.updateCardSelection();
    });

    cardBg.on('pointerdown', () => this.confirmSelection());

    this.cards.push({ container, upgrade, index });
    this.elementsUI.push(container);
  }

  updateCardSelection() {
    this.cards.forEach((card, i) => {
      const isSelected = i === this.selectedCardIndex;
      card.container.setScale(isSelected ? 1.1 : 1);
    });
  }

  confirmSelection() {
  const selectedCard = this.cards[this.selectedCardIndex];
  if (!selectedCard) return;

  this.selectUpgrade(selectedCard.upgrade);
  
  // Nettoyer TOUS les éléments UI
  this.elementsUI.forEach(el => {
    if (el && el.destroy) {
      el.destroy();
    }
  });
  this.elementsUI = [];
  this.cards = [];
  
  // AJOUT: Réactiver la physique et les animations
  const gameScene = this.scene.get('GameScene');
  if (gameScene) {
    gameScene.physics.resume();
    gameScene.anims.resumeAll();
    gameScene.scene.resume();
  }
  
  this.scene.stop('LevelUpScene');
}

  selectUpgrade(upgrade) {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene) return;
    
    switch(upgrade.type) {
      case 'health':
        gameScene.maxHealth += upgrade.value;
        gameScene.playerHealth += upgrade.value;
        break;
      case 'damage':
        gameScene.attackDamage += upgrade.value;
        break;
      case 'speed':
        gameScene.playerSpeed += upgrade.value;
        break;
      case 'regen':
        gameScene.healthRegen += upgrade.value;
        break;
      case 'attackSpeed':
        gameScene.attackDelay = Math.max(100, gameScene.attackDelay * (1 - upgrade.value / 100));
        break;
    }
  }

  shutdown() {
    this.input.keyboard.removeAllListeners();
    this.elementsUI.forEach(el => {
      if (el && el.destroy) {
        el.destroy();
      }
    });
    this.elementsUI = [];
    this.cards = [];
  }
}