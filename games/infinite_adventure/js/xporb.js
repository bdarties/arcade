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

        // On récupère les joueurs actifs
        const players = [];
        if (this.scene?.player) players.push(this.scene.player);
        if (this.scene?.player2) players.push(this.scene.player2);

        if (!players.length) return;

        // Trouver le joueur le plus proche
        let closest = null;
        let closestDist = Infinity;
        for (const p of players) {
            if (!p.active) continue;
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < closestDist) {
                closest = p;
                closestDist = dist;
            }
        }

        if (!closest) return;

        // Attiré par le joueur le plus proche
        if (closestDist < 100) {
            const force = Phaser.Math.Clamp(200 / closestDist, 50, 300);
            this.body.setVelocity(
                (closest.x - this.x) / closestDist * force,
                (closest.y - this.y) / closestDist * force
            );
        } else {
            this.idleTime += delta * 0.005;
            this.body.setVelocity(
                Math.cos(this.idleTime) * 15,
                Math.sin(this.idleTime) * 15
            );
        }
    }
}

