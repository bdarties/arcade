export default class Inventory extends Phaser.Scene {
  constructor() {
    super({ key: "Inventory" });
    this.slots = new Array(9).fill(null);
    this.selectedIndex = 0;
    this.slotImages = [];
    this.itemTexts = [];
  }

  preload() {
    this.load.image("slot_empty", "./assets/hud/slot_empty.png");
    this.load.image("slot_left", "./assets/hud/slot_left.png");
    this.load.image("slot_right", "./assets/hud/slot_right.png");
    this.load.image("slot_selected", "./assets/hud/slot_selected.png");
  }

  create() {
    this.registry.set('inventaireCree', true);
    console.log("creation inventory (fonction create)")

    this.titleText = this.add.text(400, 50, "Inventaire", { 
      fontSize: "32px", 
      fill: "#fff" 
    }).setOrigin(0.5);
    
    this.helpText = this.add.text(400, 100, "Appuie sur U pour utiliser l'objet sélectionné", { 
      fontSize: "18px", 
      fill: "#aaa" 
    }).setOrigin(0.5);

    this.drawInventory();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyU = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  }

  update() {
    // Navigation dans l'inventaire
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectSlot(this.selectedIndex - 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectSlot(this.selectedIndex + 1);
    }

    // Utiliser l'objet sélectionné avec U
    if (Phaser.Input.Keyboard.JustDown(this.keyU)) {
      this.useSelectedItem();
    }

    // Fermer l'inventaire avec P
    if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
      this.closeInventory();
    }
  }

  closeInventory() {
    var lastScene = this.registry.get('lastScene');
    if (lastScene) {
      console.log("Fermeture inventaire vers:", lastScene);
      this.scene.bringToTop(lastScene);
      this.scene.bringToTop("hud");
      this.scene.resume(lastScene);
      this.scene.pause();
    }
  }

  useSelectedItem() {
    const item = this.slots[this.selectedIndex];
    
    if (!item) {
      console.log("Aucun objet à utiliser");
      return;
    }

    // Récupérer la scène d'origine
    const lastScene = this.registry.get('lastScene');
    const gameScene = this.scene.get(lastScene);
    
    if (!gameScene || !gameScene.pvManager) {
      console.log("Impossible de trouver le PvManager");
      return;
    }

    // Parser l'item (format: "Potion (+X PV)")
    if (item.startsWith("Potion")) {
      const match = item.match(/\+(\d+)/);
      if (match) {
        const healAmount = parseInt(match[1]);
        const currentHealth = gameScene.pvManager.getHealth();
        const maxHealth = gameScene.pvManager.getMaxHealth();
        
        if (currentHealth >= maxHealth) {
          console.log("PV déjà au maximum !");
          const fullHealthText = this.add.text(400, 300, "PV déjà pleins !", {
            fontSize: "24px",
            fill: "#ff0000"
          }).setOrigin(0.5).setDepth(1000);
          
          this.time.delayedCall(1000, () => {
            fullHealthText.destroy();
          });
          return;
        }
        
        // Utiliser la potion
        gameScene.pvManager.heal(healAmount);
        console.log(`Potion utilisée ! +${healAmount} PV`);
        
        // Afficher feedback visuel
        const healText = this.add.text(400, 300, `+${healAmount} PV !`, {
          fontSize: "32px",
          fill: "#00ff00"
        }).setOrigin(0.5).setDepth(1000);
        
        this.tweens.add({
          targets: healText,
          y: healText.y - 50,
          alpha: 0,
          duration: 1000,
          onComplete: () => {
            healText.destroy();
          }
        });
        
        // Retirer la potion de l'inventaire
        this.removeItem(this.selectedIndex);
      }
    }
  }

  selectSlot(newIndex) {
    const len = this.slots.length;
    if (newIndex < 0) newIndex = len - 1;
    if (newIndex >= len) newIndex = 0;
    this.selectedIndex = newIndex;
    this.redrawInventory();
  }

  addItem(item) {
    const index = this.slots.findIndex(slot => slot === null);
    if (index !== -1) {
      this.slots[index] = item;
      this.redrawInventory();
      return true;
    }
    return false;
  }

  removeItem(index) {
    if (this.slots[index]) {
      this.slots[index] = null;
      this.redrawInventory();
    }
  }

  drawInventory() {
    const slotWidth = 48;
    const slotHeight = 48;
    const spacing = 16;
    const startX = 400 - ((slotWidth + spacing) * this.slots.length - spacing) / 2;
    const y = 150;

    for (let i = 0; i < this.slots.length; i++) {
      const x = startX + i * (slotWidth + spacing);

      let texture = "slot_empty";

      if (i === this.selectedIndex) {
        texture = "slot_selected";
      } else if (i === this.selectedIndex - 1) {
        texture = "slot_left";
      } else if (i === this.selectedIndex + 1) {
        texture = "slot_right";
      }

      if (this.slotImages[i]) {
        this.slotImages[i].setTexture(texture);
      } else {
        this.slotImages[i] = this.add.image(x + slotWidth / 2, y + slotHeight / 2, texture);
      }

      if (this.slots[i]) {
        if (this.itemTexts[i]) {
          this.itemTexts[i].setText(this.slots[i]);
        } else {
          this.itemTexts[i] = this.add.text(x + slotWidth / 2, y + slotHeight / 2, this.slots[i], {
            fontSize: "14px",
            fill: "#fff"
          }).setOrigin(0.5);
        }
      } else {
        if (this.itemTexts[i]) {
          this.itemTexts[i].destroy();
          this.itemTexts[i] = null;
        }
      }
    }
  }

  redrawInventory() {
    const len = this.slots.length;
    for (let i = 0; i < len; i++) {
      let texture = "slot_empty";

      if (i === this.selectedIndex) {
        texture = "slot_selected";
      } else if (i === this.selectedIndex - 1 || (i === 0 && this.selectedIndex === len -1)) {
        texture = "slot_left";
      } else if (i === this.selectedIndex + 1 || (i === len -1 && this.selectedIndex === 0)) {
        texture = "slot_right";
      }

      if (this.slotImages[i]) {
        this.slotImages[i].setTexture(texture);
      }

      // Mettre à jour le texte de l'item
      if (this.slots[i]) {
        if (this.itemTexts[i]) {
          this.itemTexts[i].setText(this.slots[i]);
        } else {
          const slotWidth = 48;
          const spacing = 16;
          const startX = 400 - ((slotWidth + spacing) * this.slots.length - spacing) / 2;
          const y = 150;
          const x = startX + i * (slotWidth + spacing);
          
          this.itemTexts[i] = this.add.text(x + slotWidth / 2, y + slotWidth / 2, this.slots[i], {
            fontSize: "14px",
            fill: "#fff"
          }).setOrigin(0.5);
        }
      } else {
        if (this.itemTexts[i]) {
          this.itemTexts[i].destroy();
          this.itemTexts[i] = null;
        }
      }
    }
  }
}
