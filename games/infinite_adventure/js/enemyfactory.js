import Bat from "./bat.js";
import Fly from "./fly.js";
import Slime from "./slime.js";
import Rat from "./rat.js";
import Ghost from "./ghost.js";
import FlyingSkull from "./flyingskull.js";
import Skeleton from "./skeleton.js";
import Goblin from "./goblin.js";
import MiniBossFly from "./minibossfly.js";
import MiniBossRat from "./minibossrat.js";
import MiniBossSlime from "./minibossslime.js";
import MiniBossBat from "./minibossbat.js";
import MiniBossGhost from "./minibossghost.js";
import MiniBossFlyingSkull from "./minibossflyingskull.js";
import MiniBossSkeleton from "./minibossskeleton.js";
import MiniBossGoblin from "./minibossgoblin.js";
import DragonBoss from "./dragonboss.js";

export default class EnemyFactory {
    static create(enemyType, scene, x, y) {
        const enemies = {
            bat: Bat, fly: Fly, slime: Slime, rat: Rat, ghost: Ghost, skull: FlyingSkull, skeleton: Skeleton, goblin: Goblin,
            miniboss_fly: MiniBossFly, miniboss_rat: MiniBossRat, miniboss_slime: MiniBossSlime, miniboss_bat: MiniBossBat,
            miniboss_ghost: MiniBossGhost, miniboss_skull: MiniBossFlyingSkull, miniboss_skeleton: MiniBossSkeleton,
            miniboss_goblin: MiniBossGoblin, dragon_boss: DragonBoss
        };

        const EnemyClass = enemies[enemyType];
        if (!EnemyClass) {
            console.warn(`Enemy type "${enemyType}" not found`);
            return null;
        }
        return new EnemyClass(scene, x, y);
    }

    static preloadAll(scene) {
        [Bat, Fly, Slime, Rat, Ghost, FlyingSkull, Skeleton, Goblin, MiniBossFly, MiniBossRat, MiniBossSlime].forEach(c => c.createAnimations?.(scene));
        DragonBoss.preload(scene);
    }

    static createAllAnimations(scene) {
        [Bat, Fly, Slime, Rat, Ghost, FlyingSkull, Skeleton, Goblin, MiniBossFly, MiniBossRat, MiniBossSlime].forEach(c => c.createAnimations?.(scene));
        DragonBoss.createAnimations(scene);
    }

    static getEnemyGroups(scene) {
        return {
            slimes: scene.physics.add.group(),
            bats: scene.physics.add.group(),
            flies: scene.physics.add.group(),
            rats: scene.physics.add.group(),
            skulls: scene.physics.add.group(),
            skeletons: scene.physics.add.group(),
            ghosts: scene.physics.add.group(),
            goblins: scene.physics.add.group(),
            miniBossGroup: scene.physics.add.group(),
            dragonBossGroup: scene.physics.add.group()
        };
    }

    static spawnRandomMiniBoss(scene, x, y) {
        const types = ['miniboss_fly', 'miniboss_rat', 'miniboss_slime', 'miniboss_bat', 'miniboss_ghost', 'miniboss_skull', 'miniboss_skeleton', 'miniboss_goblin'];
        return this.create(types[Math.floor(Math.random() * types.length)], scene, x, y);
    }

    static spawnDragonBoss(scene, x, y) {
        return this.create('dragon_boss', scene, x, y);
    }
}