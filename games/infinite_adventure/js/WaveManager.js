export default class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.wave = 0;
        this.spawnDelay = 2000;
        this.nextWaveAllowedAt = 0;
        this.speedIncreasePerWave = 0.02;

        this.unlocks = {
            slime: 1,
            fly: 1,
            rat: 8,
            bat: 12,
            ghost: 17,
            skull: 22,
            skeleton: 26,
            goblin: 31
        };
    }

    canStartNextWave(now, alive, isStartingWave) {
        if (isStartingWave) return false;
        if (alive === 0) return true;
        if (now >= this.nextWaveAllowedAt) return true;
        return false;
    }

    startNextWave(timeElapsed) {
        this.wave++;
        this.nextWaveAllowedAt = timeElapsed + 30000;

        const enemySpeedMult = 1 + (this.wave - 1) * this.speedIncreasePerWave;

        let slimeCount = 0, flyCount = 0, ratCount = 0, batCount = 0;
        let ghostCount = 0, skullCount = 0, skeletonCount = 0, goblinCount = 0;

        if (this.wave >= this.unlocks.slime) {
            slimeCount = Phaser.Math.Between(
                2 + Math.floor(this.wave / 6),
                4 + Math.floor(this.wave / 4)
            );
        }

        if (this.wave >= this.unlocks.fly) {
            flyCount = Phaser.Math.Between(
                2 + Math.floor(this.wave / 6),
                4 + Math.floor(this.wave / 4)
            );
        }

        if (this.wave >= this.unlocks.rat) {
            if (this.wave === this.unlocks.rat) {
                ratCount = Phaser.Math.Between(1, 3);
            } else {
                ratCount = Phaser.Math.Between(1, 3 + Math.floor(this.wave / 10));
            }
        }

        if (this.wave >= this.unlocks.bat) {
            if (this.wave === this.unlocks.bat) {
                batCount = Phaser.Math.Between(1, 3);
            } else {
                batCount = Phaser.Math.Between(1, 3 + Math.floor(this.wave / 10));
            }
        }

        if (this.wave >= this.unlocks.ghost) {
            if (this.wave === this.unlocks.ghost) {
                ghostCount = Phaser.Math.Between(1, 2);
            } else {
                ghostCount = Phaser.Math.Between(1, 2 + Math.floor(this.wave / 12));
            }
        }

        if (this.wave >= this.unlocks.skull) {
            if (this.wave === this.unlocks.skull) {
                skullCount = Phaser.Math.Between(1, 3);
            } else {
                skullCount = Phaser.Math.Between(1, 3 + Math.floor(this.wave / 12));
            }
        }

        if (this.wave >= this.unlocks.skeleton) {
            if (this.wave === this.unlocks.skeleton) {
                skeletonCount = 1;
            } else {
                skeletonCount = Phaser.Math.Between(1, 1 + Math.floor(this.wave / 15));
            }
        }

        if (this.wave >= this.unlocks.goblin) {
            if (this.wave === this.unlocks.goblin) {
                goblinCount = 1;
            } else {
                goblinCount = Phaser.Math.Between(1, 1 + Math.floor(this.wave / 20));
            }
        }

        const spawnMiniboss = this.wave % 5 === 0;

        const waveData = {
            wave: this.wave,
            enemySpeedMult,
            slimeCount,
            flyCount,
            ratCount,
            batCount,
            ghostCount,
            skullCount,
            skeletonCount,
            goblinCount,
            spawnMiniboss,
            spawnDelay: this.spawnDelay
        };

        this.scene.events.emit("waveWarning", this.wave, this.spawnDelay);
        return waveData;
    }
}