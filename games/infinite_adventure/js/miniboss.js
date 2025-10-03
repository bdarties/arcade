import Enemy from "./enemy.js";
import Chest from "./chest.js";
import XPOrb from "./xporb.js";

export default class MiniBoss extends Enemy {
    constructor(scene, x, y, texture, config = {}) {
        // Configuration par défaut pour les miniboss
        const defaultConfig = {
            scale: 3,
            barWidth: 80,
            barHeight: 8,
            barOffsetY: -40,
            points: 200,
            knockbackForce: 300
        };

        super(scene, x, y, texture, { ...defaultConfig, ...config });
        
        this.setScale(this.barWidth / 32 * 0.8); // Ajustement d'échelle basé sur la barre de vie
        
        // Propriétés spécifiques aux miniboss
        this.isCharging = false;
        this.isDashing = false;
        this.lastDash = 0;
        this.dashCooldown = config.dashCooldown || 5000;
        this.dashSpeed = config.dashSpeed || 600;
    }

    // Les miniboss donnent plus d'XP et spawnent un coffre
    die() {
        if (this.scene.orbs) {
            const xpValue = Math.ceil(this.points / 40); // Calcul automatique de l'XP
            this.scene.orbs.add(new XPOrb(this.scene, this.x, this.y, xpValue));
        }
        if (this.scene.addScore) {
            this.scene.addScore(this.points);
        }
        
        // Spawn d'un coffre pour les miniboss
        new Chest(this.scene, this.x, this.y);
        
        this.scene.events.emit("enemyDied");
        this.destroy();
    }

    // Méthode de dash générique pour les miniboss
    startDash() {
        if (!this.target || this.isDashing) return;

        this.isDashing = true;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.body.setVelocity(Math.cos(angle) * this.dashSpeed, Math.sin(angle) * this.dashSpeed);

        this.scene.time.delayedCall(600, () => {
            this.isDashing = false;
        });
    }

    // Méthode de charge avec effet visuel
    startCharge(duration = 2000) {
        if (this.isCharging || this.isDashing) return;
        
        this.isCharging = true;
        this.flashTween = this.scene.tweens.add({ 
            targets: this, 
            alpha: { from: 1, to: 0.3 }, 
            duration: 200, 
            yoyo: true, 
            repeat: -1 
        });

        this.scene.time.delayedCall(duration, () => {
            if (!this.active) return;
            this.flashTween.stop();
            this.setAlpha(1);
            this.isCharging = false;
            this.startDash();
        });
    }

    // Mise à jour de la position des barres de vie pour les miniboss
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        // Les barres de vie utilisent déjà barOffsetY via la classe Enemy
    }
}