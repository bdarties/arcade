export default class HealthBar {
    constructor(scene, owner, maxHealth) {
        this.scene = scene;
        this.owner = owner;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.width = 40;
        this.height = 6;

        this.bg = scene.add.rectangle(owner.x, owner.y - 20, this.width, this.height, 0x000000).setOrigin(0.5);
        this.bar = scene.add.rectangle(owner.x, owner.y - 20, this.width, this.height, 0xff0000).setOrigin(0.5);
        this.text = scene.add.text(owner.x, owner.y - 32, `${this.currentHealth}/${this.maxHealth}`, { font: "10px Arial", fill: "#ffffff" }).setOrigin(0.5);
    }

    removeHealth(amount) { this.currentHealth = Phaser.Math.Clamp(this.currentHealth - amount, 0, this.maxHealth); this.updateBar(); }
    addHealth(amount) { this.currentHealth = Phaser.Math.Clamp(this.currentHealth + amount, 0, this.maxHealth); this.updateBar(); }

    updateBar() { this.bar.width = this.width * (this.currentHealth / this.maxHealth); this.text.setText(`${this.currentHealth}/${this.maxHealth}`); }

    updatePosition() {
        this.bg.setPosition(this.owner.x, this.owner.y - 20);
        this.bar.setPosition(this.owner.x, this.owner.y - 20);
        this.text.setPosition(this.owner.x, this.owner.y - 32);
    }

    preUpdate() { this.updatePosition(); }
    destroy() { this.bg.destroy(); this.bar.destroy(); this.text.destroy(); }
}