export default class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.wave = 0;
        this.spawnDelay = 2000;
        this.speedIncreasePerWave = 0.02;

        this.unlocks = {
            slime: 1,
            fly: 1,
            rat: 6,
            bat: 9,
            ghost: 12,
            skull: 16,
            skeleton: 21,
            goblin: 26,
            dragon: 30
        };

        // Types de miniboss disponibles
        this.minibossTypes = [
            'GiantSlime',
            'BatSwarm', 
            'RatKing',
            'GhostKnight',
            'SkullLord',
            'SkeletonKing'
        ];
    }

    startNextWave(timeElapsed) {
        this.wave++;

        const enemySpeedMult = 1 + (this.wave - 1) * this.speedIncreasePerWave;

        let slimeCount = 0,
            flyCount = 0,
            ratCount = 0,
            batCount = 0,
            ghostCount = 0,
            skullCount = 0,
            skeletonCount = 0,
            goblinCount = 0;

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
            ratCount =
                this.wave === this.unlocks.rat
                    ? Phaser.Math.Between(1, 3)
                    : Phaser.Math.Between(1, 3 + Math.floor(this.wave / 10));
        }

        if (this.wave >= this.unlocks.bat) {
            batCount =
                this.wave === this.unlocks.bat
                    ? Phaser.Math.Between(1, 3)
                    : Phaser.Math.Between(1, 3 + Math.floor(this.wave / 10));
        }

        if (this.wave >= this.unlocks.ghost) {
            ghostCount =
                this.wave === this.unlocks.ghost
                    ? Phaser.Math.Between(1, 2)
                    : Phaser.Math.Between(1, 2 + Math.floor(this.wave / 12));
        }

        if (this.wave >= this.unlocks.skull) {
            skullCount =
                this.wave === this.unlocks.skull
                    ? Phaser.Math.Between(1, 3)
                    : Phaser.Math.Between(1, 3 + Math.floor(this.wave / 12));
        }

        if (this.wave >= this.unlocks.skeleton) {
            skeletonCount =
                this.wave === this.unlocks.skeleton
                    ? 1
                    : Phaser.Math.Between(1, 1 + Math.floor(this.wave / 15));
        }

        if (this.wave >= this.unlocks.goblin) {
            goblinCount =
                this.wave === this.unlocks.goblin
                    ? 1
                    : Phaser.Math.Between(1, 1 + Math.floor(this.wave / 20));
        }

        // Miniboss toutes les 4 vagues, mais pas les vagues de boss dragon
        const spawnMiniboss = this.wave % 4 === 0 && this.wave < this.unlocks.dragon;
        const spawnDragonBoss = this.wave % 30 === 0 && this.wave >= this.unlocks.dragon;

        // Déterminer quels types de miniboss sont disponibles selon la vague
        const availableMinibossTypes = [];
        if (this.wave >= 4) availableMinibossTypes.push('GiantSlime');
        if (this.wave >= 8) availableMinibossTypes.push('BatSwarm');
        if (this.wave >= 12) availableMinibossTypes.push('RatKing');
        if (this.wave >= 16) availableMinibossTypes.push('GhostKnight');
        if (this.wave >= 20) availableMinibossTypes.push('SkullLord');
        if (this.wave >= 24) availableMinibossTypes.push('SkeletonKing');

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
            spawnDragonBoss,
            availableMinibossTypes, // AJOUT IMPORTANT
            spawnDelay: this.spawnDelay
        };

        this.scene.events.emit("waveWarning", this.wave, this.spawnDelay);
        return waveData;
    }
}