import { Potion } from "./fonctions.js";

export default class Coffre extends Phaser.Scene {
  constructor() {
    super({ key: "Coffre" });
    this.slots = [];
    this.selectedIndex = 0;
    this.slotImages = [];
    this.itemTexts = [];
  }

  preload() {
    this.load.image("slot_empty", "./assets/hud/slot_empty.png");
    this.load.image("slot_selected", "./assets/hud/slot_selected.png");
    this.load.image("slot_left", "./assets/hud/slot_left.png");
    this.load.image("slot_right", "./assets/hud/slot_right.png");
  }

  create() {
    console.log("Création de la scène Coffre");

    this.add.text(400, 50, "Coffre", { fontSize: "32px", fill: "#fff" }).setOrigin(0.5);

    // Génération aléatoire du contenu : entre 0 et 2 potions
    const nbPotions = Phaser.Math.Between(0, 2);
    this.slots = [];
    for (let i = 0; i < nbPotions; i++) {
      this.slots.push(new Potion(1)); // chaque potion heal 1
    }

    this.drawSlots();

    this.cursors = this.input.keyboard.createCursorKeys();

    // fermer coffre et reprendre la scène principale avec K
    this.input.keyboard.on('keydown-K', () => {
      this.closeCoffre();
    });

    // touche I pour transférer l'item vers inventaire
    this.input.keyboard.on("keydown-I", () => {
      const item = this.slots[this.selectedIndex];
      if (item) {
        // Inventory removed: directly apply the item effect to the player if possible
        const lastSceneKey = this.registry.get('lastScene');
        const gameScene = lastSceneKey ? this.scene.get(lastSceneKey) : null;
        if (gameScene && gameScene.pvManager) {
          console.log("Utilisation directe de l'objet depuis le coffre");
          // If it's a Potion, use it
          if (typeof item.use === 'function') {
            item.use(gameScene.pvManager);
          }
          this.slots[this.selectedIndex] = null;
          this.redrawSlots();
        } else {
          console.log("Aucune scène de jeu disponible pour utiliser l'objet");
        }
      }
    });
  }

  closeCoffre() {
    var lastScene = this.registry.get('lastScene');
    if (lastScene) {
      console.log("Fermeture du coffre, retour à:", lastScene);
      this.scene.stop();
      this.scene.bringToTop(lastScene);
      this.scene.bringToTop("hud");
      this.scene.resume(lastScene);
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectSlot(this.selectedIndex - 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectSlot(this.selectedIndex + 1);
    }
  }

  drawSlots() {
    const slotWidth = 48;
    const spacing = 16;
    const startX = 400 - ((slotWidth + spacing) * 9 - spacing) / 2;
    const y = 150;

    for (let i = 0; i < 9; i++) {
      const x = startX + i * (slotWidth + spacing);

      let texture = "slot_empty";
      if (i === this.selectedIndex) texture = "slot_selected";

      this.slotImages[i] = this.add.image(x + slotWidth / 2, y, texture);

      if (this.slots[i]) {
        this.itemTexts[i] = this.add.text(x + slotWidth / 2, y + 20, this.slots[i].toString(), {
          fontSize: "14px",
          fill: "#fff",
        }).setOrigin(0.5);
      } else {
        this.itemTexts[i] = null;
      }
    }
  }

  redrawSlots() {
    // Détruire tous les anciens visuels
    for (let i = 0; i < this.slotImages.length; i++) {
      if (this.slotImages[i]) {
        this.slotImages[i].destroy();
      }
      if (this.itemTexts[i]) {
        this.itemTexts[i].destroy();
      }
    }

    // Recréer tout
    this.slotImages = [];
    this.itemTexts = [];
    this.drawSlots();
  }

  selectSlot(newIndex) {
    const len = 9;
    if (newIndex < 0) newIndex = len - 1;
    if (newIndex >= len) newIndex = 0;
    this.selectedIndex = newIndex;
    this.redrawSlots();
  }

  shutdown() {
    console.log("Nettoyage de la scène Coffre");
    // Nettoyer les tableaux
    this.slots = [];
    this.slotImages = [];
    this.itemTexts = [];
    this.selectedIndex = 0;
  }
}

