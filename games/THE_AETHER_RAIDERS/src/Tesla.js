// Tesla.js
export default class Tesla extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, player) {
        super(scene, x, y, 'tesla'); // 'tesla' = key du spritesheet
        this.scene = scene;
        this.player = player;

        // Ajouter à la scène
        scene.add.existing(this);
        scene.physics.add.existing(this); // pour avoir un body

        this.body.setImmovable(true);
        this.body.setSize(160, 128); // taille de la hitbox
        this.setOrigin(0.5, 0.5);

        // Animation neutre / éteint
        this.anims.create({
            key: 'tesla_idle',
            frames: this.anims.generateFrameNumbers('tesla', { start: 0, end: 4 }),
            frameRate: 5,
            repeat: -1
        });
        this.anims.create({
            key: 'tesla_off',
            frames: [{ key: 'tesla', frame: 5 }],
            frameRate: 1,
            repeat: 0
        });

        this.play('tesla_idle');

        this.lastShotTime = 0;
        this.shootCooldown = 1000; // 1s entre chaque tir

        // Collider avec le joueur pour tirer
        scene.physics.add.overlap(this, player, this.tryShoot, null, this);
    }

    tryShoot(tesla, player) {
        const time = this.scene.time.now;
        if (time - this.lastShotTime < this.shootCooldown) return;

        this.lastShotTime = time;

        // Calcul de l'angle vers le joueur
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        // Distance pour ajuster la taille du bolt
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Créer le bolt
        const bolt = this.scene.add.image(this.x, this.y, 'bullet_tesla');
        bolt.setOrigin(0, 0.5);
        bolt.rotation = angle;

        // Ajuster la longueur (optionnel selon ton sprite)
        bolt.displayWidth = distance;
        bolt.displayHeight = 8;

        // Détruire le bolt après un court instant
        this.scene.time.delayedCall(150, () => bolt.destroy());

        // Infliger 10 points de dégâts via perdreVie()
        if (player.perdreVie) {
            for (let i = 0; i < 10; i++) player.perdreVie();
        }

        // Flash / effet visuel
        this.setTint(0x00ffff);
        this.scene.time.delayedCall(100, () => this.clearTint());
    }

    turnOff() {
        this.play('tesla_off');
    }
}
