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
    // Réinitialiser toutes les variables à chaque démarrage
    this.selectedCardIndex = 1;
    this.cards = [];
    this.isConfirming = false;
    this.keyboardListeners = [];
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Assombrir le jeu en arrière-plan
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.cameras && gameScene.cameras.main) {
      this.tweens.add({
        targets: gameScene.cameras.main,
        alpha: 0.4,
        duration: 300,
        ease: 'Power2'
      });
    }
    
    // Fond avec fade in
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0);
    
    this.tweens.add({
      targets: bg,
      alpha: 0.7,
      duration: 300,
      ease: 'Power2'
    });

    // Étoiles animées
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const star = this.add.circle(x, y, 1, 0xffffff, 0)
        .setScrollFactor(0);

      // Apparition progressive
      this.tweens.add({
        targets: star,
        alpha: 0.6,
        duration: 500,
        delay: i * 50,
        ease: 'Power2'
      });

      // Scintillement
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(1000, 2000),
        yoyo: true,
        repeat: -1,
        delay: 500 + i * 50
      });
    }

    // Particules lumineuses autour du texte
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const radius = 150;
      const px = width / 2 + Math.cos(angle) * radius;
      const py = 60 + Math.sin(angle) * radius;
      
      const particle = this.add.circle(px, py, 2, 0x9bbc0f, 0)
        .setScrollFactor(0);
      
      this.tweens.add({
        targets: particle,
        alpha: 0.8,
        scale: 1.5,
        duration: 800,
        delay: i * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Texte "LEVEL UP!" avec animation
    const levelUpText = this.add.text(width / 2, -50, 'LEVEL UP!', {
      fontSize: '52px',
      fill: '#9bbc0f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#306230',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    // Animation d'entrée du texte
    this.tweens.add({
      targets: levelUpText,
      y: 60,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Pulse du texte
    this.tweens.add({
      targets: levelUpText,
      scale: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 500
    });

    // Instructions de contrôle
    const controlText = this.add.text(width / 2, height - 40, 'Flèches ← → pour naviguer | K ou ENTRÉE pour valider', {
      fontSize: '14px',
      fill: '#d4d29b',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    this.tweens.add({
      targets: controlText,
      alpha: 0.7,
      duration: 400,
      delay: 600
    });

    // Générer les cartes
    this.generateUpgradeCards();

    // Setup des contrôles clavier
    this.setupKeyboardControls();
  }

  setupKeyboardControls() {
    // Créer des fonctions de callback pour pouvoir les supprimer proprement
    const onLeft = () => {
      if (this.isConfirming) return;
      this.selectedCardIndex = Math.max(0, this.selectedCardIndex - 1);
      this.updateCardSelection();
    };

    const onRight = () => {
      if (this.isConfirming) return;
      this.selectedCardIndex = Math.min(2, this.selectedCardIndex + 1);
      this.updateCardSelection();
    };

    const onConfirm = () => {
      if (this.isConfirming) return;
      this.confirmSelection();
    };

    // Ajouter les listeners
    this.input.keyboard.on('keydown-LEFT', onLeft);
    this.input.keyboard.on('keydown-RIGHT', onRight);
    this.input.keyboard.on('keydown-K', onConfirm);
    this.input.keyboard.on('keydown-ENTER', onConfirm);

    // Sauvegarder les listeners pour nettoyage
    this.keyboardListeners = [
      { event: 'keydown-LEFT', callback: onLeft },
      { event: 'keydown-RIGHT', callback: onRight },
      { event: 'keydown-K', callback: onConfirm },
      { event: 'keydown-ENTER', callback: onConfirm }
    ];
  }

  generateUpgradeCards() {
    const { width, height } = this.cameras.main;
    const cardSpacing = 260;
    const startX = width / 2 - cardSpacing;
    const cardY = height / 2;

    // Raretés (70% bronze, 25% argent, 5% or)
    const selectedRarities = Array.from({ length: 3 }, () => {
      const rand = Math.random();
      return rand < 0.70 ? 'bronze' : rand < 0.95 ? 'silver' : 'gold';
    });

    // Créer 3 cartes
    selectedRarities.forEach((rarity, i) => {
      const x = startX + i * cardSpacing;
      const upgrades = UPGRADE_CONFIG[rarity];
      const upgrade = Phaser.Utils.Array.GetRandom(upgrades);
      
      this.createCard(x, cardY, rarity, upgrade, i);
    });

    // Sélectionner la carte du milieu par défaut
    this.time.delayedCall(600, () => {
      this.updateCardSelection();
    });
  }

  createCard(x, y, rarity, upgrade, index) {
    const cardScale = 6.5;
    
    const container = this.add.container(x, y + 100)
      .setScrollFactor(0)
      .setAlpha(0);

    const rarityFrame = rarity === 'bronze' ? 0 : rarity === 'silver' ? 1 : 2;
    const cardBg = this.add.sprite(0, 0, 'levelup', rarityFrame).setScale(cardScale);
    container.add(cardBg);

    // Lueur de rareté
    const glowColor = rarity === 'bronze' ? 0xcd7f32 : 
                      rarity === 'silver' ? 0xc0c0c0 : 0xffd700;
    const glow = this.add.circle(0, 0, 80, glowColor, 0.2)
      .setScale(0);
    container.add(glow);
    container.sendToBack(glow);

    const icon = this.add.sprite(0, -53, 'icons_8x8', upgrade.icon).setScale(cardScale);
    container.add(icon);

    const text = this.add.text(0, 103, upgrade.text, {
      fontSize: '16px',
      fill: '#d4d29b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    container.add(text);

    // Animation d'entrée
    this.tweens.add({
      targets: container,
      y: y,
      alpha: 1,
      duration: 400,
      delay: index * 150,
      ease: 'Back.easeOut'
    });

    // Animation de la lueur
    this.tweens.add({
      targets: glow,
      scale: 1.3,
      alpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: index * 150
    });

    // Rendre interactive
    cardBg.setInteractive({ useHandCursor: true });
    
    cardBg.on('pointerover', () => {
      if (this.isConfirming) return;
      this.selectedCardIndex = index;
      this.updateCardSelection();
    });

    cardBg.on('pointerdown', () => {
      if (this.isConfirming) return;
      this.confirmSelection();
    });

    // Stocker la carte
    this.cards.push({
      container,
      glow,
      upgrade,
      index,
      baseY: y
    });
  }

  updateCardSelection() {
    this.cards.forEach((card, i) => {
      const isSelected = i === this.selectedCardIndex;
      
      // Animation de position et échelle
      this.tweens.add({
        targets: card.container,
        y: card.baseY + (isSelected ? -20 : 0),
        scale: isSelected ? 1.05 : 1,
        duration: 200,
        ease: 'Power2'
      });

      // Animation de la lueur
      this.tweens.add({
        targets: card.glow,
        alpha: isSelected ? 0.5 : 0.2,
        scale: isSelected ? 1.5 : 1.3,
        duration: 200,
        ease: 'Power2'
      });
    });

    // Son de navigation (optionnel, si vous avez un son)
    // this.sound.play('select', { volume: 0.3 });
  }

  confirmSelection() {
    if (this.isConfirming) return;
    this.isConfirming = true;

    const selectedCard = this.cards[this.selectedCardIndex];
    
    // Animation de sélection
    this.tweens.add({
      targets: selectedCard.container,
      scale: 1.2,
      duration: 150,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        // Flash blanc
        const flash = this.add.rectangle(
          0, 0, 
          this.cameras.main.width, 
          this.cameras.main.height, 
          0xffffff, 0
        ).setOrigin(0, 0).setScrollFactor(0);

        this.tweens.add({
          targets: flash,
          alpha: 0.6,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            flash.destroy();
            
            // Appliquer l'upgrade
            this.selectUpgrade(selectedCard.upgrade);
            
            // Faire disparaître toutes les cartes
            this.cards.forEach(card => {
              this.tweens.add({
                targets: card.container,
                alpha: 0,
                y: card.container.y - 50,
                duration: 300,
                ease: 'Power2'
              });
            });

            // Fermer la scène et restaurer la luminosité
            this.time.delayedCall(300, () => {
              const gameScene = this.scene.get('GameScene');
              
              // Restaurer la luminosité du jeu
              if (gameScene && gameScene.cameras && gameScene.cameras.main) {
                this.tweens.add({
                  targets: gameScene.cameras.main,
                  alpha: 1,
                  duration: 300,
                  ease: 'Power2',
                  onComplete: () => {
                    // Reprendre le jeu après la restauration complète
                    this.cleanupAndClose(gameScene);
                  }
                });
              } else {
                // Fallback si pas de caméra
                this.cleanupAndClose(gameScene);
              }
            });
          }
        });
      }
    });

    // Son de confirmation (optionnel)
    // this.sound.play('confirm', { volume: 0.5 });
  }

  cleanupAndClose(gameScene) {
    // Nettoyer les listeners clavier
    this.keyboardListeners.forEach(listener => {
      this.input.keyboard.off(listener.event, listener.callback);
    });
    this.keyboardListeners = [];

    // Arrêter et reprendre
    this.scene.stop('LevelUpScene');
    if (gameScene) gameScene.scene.resume();
  }

  selectUpgrade(upgrade) {
    const gameScene = this.scene.get('GameScene');
    
    // Appliquer l'upgrade
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
        gameScene.attackDelay *= (1 - upgrade.value / 100);
        break;
    }
  }

  shutdown() {
    // Nettoyage supplémentaire lors de l'arrêt de la scène
    if (this.keyboardListeners) {
      this.keyboardListeners.forEach(listener => {
        this.input.keyboard.off(listener.event, listener.callback);
      });
      this.keyboardListeners = [];
    }
  }
}