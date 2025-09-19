export default class Chest extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "chest", 4);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(2);
        this.setDepth(5);
        this.opened = false;

        if (this.body) this.body.setImmovable(true).setAllowGravity(false);

        this._overlap = scene.physics.add.overlap(scene.player, this, () => this.open());
    }

    static preload(scene) {
        scene.load.spritesheet("chest", "assets/animated_props.png", {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists("chest_open")) {
            scene.anims.create({
                key: "chest_open",
                frames: scene.anims.generateFrameNumbers("chest", { start: 4, end: 6 }),
                frameRate: 6,
                repeat: 0
            });
        }
    }

    open() {
        if (this.opened) return;
        this.opened = true;
    
        if (this._overlap) {
            this.scene.physics.world.removeCollider(this._overlap);
            this._overlap = null;
        }
    
        if (this.body) this.body.enable = false;
    
        this.play("chest_open");
    
        const uiScene = this.scene.scene.get("UiScene");
        if (uiScene?.levelUpSystem) {
            uiScene.levelUpSystem.setPlayer(this.scene.player);
            uiScene.levelUpSystem.show("gold"); 
        }
    
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0,
            duration: 800,
            ease: "Cubic.easeIn",
            onComplete: () => {
                this.destroy();
            }
        });
    }
    
}