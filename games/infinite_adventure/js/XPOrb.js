export default class XPOrb extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, value = 1) {
        super(scene, x, y, "xp_orb");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.value = value;
        this.setCollideWorldBounds(true);

        this.setScale(value > 1 ? 1.5 : 1);
        this.setTint(value > 1 ? 0xffd700 : 0x3399ff);

        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(40, 80);
        this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        scene.time.delayedCall(15000, () => this.destroy());
        this.idleTime = 0;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        const player = this.scene?.player;
        if (!player) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 100) {
            const force = Phaser.Math.Clamp(200 / dist, 50, 300);
            this.body.setVelocity((dx / dist) * force, (dy / dist) * force);
        } else {
            this.idleTime += delta * 0.005;
            this.body.setVelocity(
                Math.cos(this.idleTime) * 15,
                Math.sin(this.idleTime) * 15
            );
        }
    }
}