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
    this.isAnimating = false;
    this.isClosing = false;
  }

  create() {
    const { width, height } = this.cameras.main;
    
    this.cameras.main.setBackgroundColor('#1a1a2e');
    
    // Fond simple opaque (pas de voir le jeu derrière)
    this.add.rectangle(0, 0, width, height, 0x000000, 0.95)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(0);

    // Texte "LEVEL UP!" sans animation complexe
    this.add.text(width / 2, 60, 'LEVEL UP!', {
      fontSize: '52px',
      fill: '#9bbc0f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#306230',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1);

    // Instructions
    this.add.text(width / 2, height - 40, 'Flèches ← → | K ou ENTRÉE', {
      fontSize: '14px',
      fill: '#d4d29b',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1).setAlpha(0.7);

    // Générer les cartes
    this.generateUpgradeCards();

    // Activer les contrôles
    this.time.delayedCall(50, () => {
      if (!this.isClosing) {
        this.setupKeyboardControls();
        this.updateCardSelection();
      }
    });
  }

  setupKeyboardControls() {
    this.input.keyboard.removeAllListeners();

    const handleLeft = () => {
      if (this.isAnimating || this.isClosing) return;
      this.selectedCardIndex = Math.max(0, this.selectedCardIndex - 1);
      this.updateCardSelection();
    };

    const handleRight = () => {
      if (this.isAnimating || this.isClosing) return;
      this.selectedCardIndex = Math.min(2, this.selectedCardIndex + 1);
      this.updateCardSelection();
    };

    const handleConfirm = () => {
      if (this.isAnimating || this.isClosing) return;
      this.confirmSelection();
    };

    this.input.keyboard.on('keydown-LEFT', handleLeft);
    this.input.keyboard.on('keydown-RIGHT', handleRight);
    this.input.keyboard.on('keydown-K', handleConfirm);
    this.input.keyboard.on('keydown-ENTER', handleConfirm);
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
      .setDepth(1);

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
      if (this.isAnimating || this.isClosing) return;
      this.selectedCardIndex = index;
      this.updateCardSelection();
    });

    cardBg.on('pointerdown', () => {
      if (this.isAnimating || this.isClosing) return;
      this.confirmSelection();
    });

    this.cards.push({
      container,
      upgrade,
      index,
      baseY: y
    });
  }

  updateCardSelection() {
    this.cards.forEach((card, i) => {
      const isSelected = i === this.selectedCardIndex;
      card.container.y = card.baseY + (isSelected ? -20 : 0);
      card.container.setScale(isSelected ? 1.05 : 1);
    });
  }

  confirmSelection() {
    if (this.isAnimating || this.isClosing) return;
    
    this.isAnimating = true;
    this.isClosing = true;
    
    const selectedCard = this.cards[this.selectedCardIndex];
    this.selectUpgrade(selectedCard.upgrade);
    
    // Flash rapide
    const flash = this.add.rectangle(0, 0, 1280, 720, 0xffffff, 0.3)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        flash.destroy();
        this.closeScene();
      }
    });
  }

  closeScene() {
    this.input.keyboard.removeAllListeners();
    this.scene.stop('LevelUpScene');
    
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.scene.resume();
    }
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
    this.cards = [];
  }
}