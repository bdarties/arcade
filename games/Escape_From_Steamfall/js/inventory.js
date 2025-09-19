// inventory.js
export default class Inventory extends Phaser.Scene {
    constructor() {
        super({ key: "Inventory" });
        this.slots = new Array(9).fill(null);
    }

    preload() {}

    create() {
        // Titre
        this.add.text(400, 50, "Inventaire", { fontSize: "32px", fill: "#fff" }).setOrigin(0.5);

        // Affiche les slots
        this.drawInventory();

        // Fermer avec I
        this.input.keyboard.on("keydown-I", () => {
            this.scene.stop("Inventory");
            if (this.scene.isPaused("selection")) {
                this.scene.resume("selection");
            } else if (this.scene.isPaused("niveau3")) {
                this.scene.resume("niveau3");
            } else if (this.scene.isPaused("niveau2")) {
                this.scene.resume("niveau2");
            } else if (this.scene.isPaused("niveau1")) {
                this.scene.resume("niveau1");
            }
        });
    }

    // --- Méthodes de gestion ---
    addItem(item) {
        const index = this.slots.findIndex(slot => slot === null);
        if (index !== -1) {
            this.slots[index] = item;
            return true;
        }
        return false; // inventaire plein
    }

    removeItem(index) {
        if (this.slots[index]) {
            this.slots[index] = null;
        }
    }

    getItems() {
        return this.slots;
    }

    // --- Affichage ---
    drawInventory() {
        const slotWidth = 48;
        const slotHeight = 48;
        const spacing = 16;
        const startX = 400 - ((slotWidth + spacing) * 9 - spacing) / 2;
        const y = 150;

        for (let i = 0; i < 9; i++) {
            const x = startX + i * (slotWidth + spacing);
            // Rectangle du slot (fond blanc, bord noir)
            const rect = this.add.rectangle(x, y, slotWidth, slotHeight, 0xffffff)
                .setOrigin(0, 0)
                .setStrokeStyle(2, 0x222222);

            // Si un item est présent, affiche son nom (remplace par une icône au besoin)
            if (this.slots[i]) {
                this.add.text(
                    x + slotWidth / 2,
                    y + slotHeight / 2,
                    this.slots[i],
                    { fontSize: "18px", fill: "#222" }
                ).setOrigin(0.5);
            }
        }
    }
}
