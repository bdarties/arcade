// ------------------ DRAGON (petit) ------------------
export function preloadDragon(scene) {
    // Chargement du spritesheet du petit dragon
    scene.load.spritesheet("petit_dragon", "assets/petit_dragon.png", {
        frameWidth: 42,
        frameHeight: 33
    });
}

export function createDragon(scene, x, y) {
    // Animation de marche / vol
    if (!scene.anims.exists("dragon_walk")) {
        scene.anims.create({
            key: "dragon_walk",
            frames: scene.anims.generateFrameNumbers("petit_dragon", { start: 0, end: 12 }),
            frameRate: 8,
            repeat: -1
        });
    }

    // Création du sprite
    const dragon = scene.physics.add.sprite(x, y, "petit_dragon");
    dragon.setOrigin(0.5, 1);
    dragon.setCollideWorldBounds(true);
    dragon.body.allowGravity = false;

    // Propriétés personnalisées
    dragon.startX = x;
    dragon.direction = 1; // 1 = droite, -1 = gauche
    dragon.patrolRange = 100; // distance max de patrouille
    dragon.speed = 60; // vitesse de patrouille
    dragon.chaseSpeed = 120; // vitesse en poursuite
    dragon.health = 2;
    dragon.damage = 2;

    dragon.play("dragon_walk");

    return dragon;
}

export function updateDragon(dragon, player, scene) {
    if (!dragon || !dragon.body) return;

    const distance = Phaser.Math.Distance.Between(player.x, player.y, dragon.x, dragon.y);
    const isChasing = distance < 200;

    if (isChasing) {
        // --- Poursuite du joueur ---
        const dx = player.x - dragon.x;
        const dy = player.y - dragon.y;
        const angle = Math.atan2(dy, dx);

        dragon.setVelocityX(Math.cos(angle) * dragon.chaseSpeed);
        dragon.setVelocityY(Math.sin(angle) * dragon.chaseSpeed * 0.4); // léger mouvement vertical

        // Orientation automatique
        if (dragon.body.velocity.x > 5) dragon.setFlipX(true);
        else if (dragon.body.velocity.x < -5) dragon.setFlipX(false);

    } else {
        // --- Patrouille automatique ---
        dragon.setVelocityX(dragon.speed * dragon.direction);
        dragon.setVelocityY(Math.sin(scene.time.now / 500) * 15); // petit effet de vol ondulé

        // Changement de direction aux extrémités
        if (dragon.x > dragon.startX + dragon.patrolRange) {
            dragon.direction = -1;
            dragon.setFlipX(false);
        } else if (dragon.x < dragon.startX - dragon.patrolRange) {
            dragon.direction = 1;
            dragon.setFlipX(true);
        }
    }
}

// ------------------ SLIMES ------------------
export function preloadSlimes(scene) {
    scene.load.spritesheet("slime_rouge", "assets/slime_rouge.png", { frameWidth: 36, frameHeight: 26 });
    scene.load.spritesheet("slime_bleu", "assets/slime_bleu.png", { frameWidth: 36, frameHeight: 26 });
}

export function createSlime(scene, x, y, type = "slime_rouge") {
    if (!scene.anims.exists(type + "_walk")) {
        scene.anims.create({
            key: type + "_walk",
            frames: scene.anims.generateFrameNumbers(type, { start: 0, end: 15 }),
            frameRate: 6,
            repeat: -1
        });
    }
    let slime = scene.physics.add.sprite(x, y, type);
    slime.setOrigin(0.5, 1);
    slime.setCollideWorldBounds(true);
    slime.body.setBounce(0.2, 0);
    slime.body.allowGravity = true;
    slime.setScale(0.7);
    slime.slimeStartX = x;
    slime.slimeDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    slime.speed = 40;
    slime.health = 2;
    slime.damage = 1; // points de dégâts infligés
    slime.play(type + "_walk");
    return slime;
}

export function updateSlime(slime, player, scene) {
    if (!slime || !slime.body) return;
    let distance = Phaser.Math.Distance.Between(player.x, player.y, slime.x, slime.y);
    if (distance < 50) {
        let dx = player.x - slime.x;
        slime.setVelocityX(Math.sign(dx) * slime.speed);
        slime.setFlipX(dx > 0);
    } else {
        slime.setVelocityX(slime.speed * slime.slimeDirection);
        if (slime.body.blocked.left) slime.slimeDirection = 1;
        if (slime.body.blocked.right) slime.slimeDirection = -1;
        if (slime.x > slime.slimeStartX + 100) slime.slimeDirection = -1;
        if (slime.x < slime.slimeStartX - 100) slime.slimeDirection = 1;
        slime.setFlipX(slime.slimeDirection < 0);
    }
    const walkAnim = slime.texture.key + "_walk";
    if (scene.anims.exists(walkAnim) && (!slime.anims.isPlaying || slime.anims.currentAnim.key !== walkAnim)) {
        slime.play(walkAnim, true);
    }
}

// ------------------ GOBLIN ------------------
export function preloadGoblin(scene) {
    scene.load.spritesheet("goblin", "assets/goblin.png", { frameWidth: 38, frameHeight: 38 });
}

export function createGoblin(scene, x, y) {
    if (!scene.anims.exists("goblin_walk")) {
        scene.anims.create({
            key: "goblin_walk",
            frames: scene.anims.generateFrameNumbers("goblin", { start: 7, end: 13 }),
            frameRate: 8,
            repeat: -1
        });
    }
    let goblin = scene.physics.add.sprite(x, y, "goblin");
    goblin.setOrigin(0.5, 1);
    goblin.setCollideWorldBounds(true);
    goblin.body.allowGravity = true;
    goblin.goblinStartX = x;
    goblin.goblinDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    goblin.speed = 60;
    goblin.health = 3;
    goblin.damage = 1; // points de dégâts infligés
    goblin.play("goblin_walk");
    return goblin;
}

export function updateGoblin(goblin, player, scene) {
    if (!goblin || !goblin.body) return;
    let distance = Phaser.Math.Distance.Between(player.x, player.y, goblin.x, goblin.y);
    if (distance < 150) {
        // Mode poursuite : orientation inversée et vitesse augmentée
        let dx = player.x - goblin.x;
        goblin.setVelocityX(Math.sign(dx) * goblin.speed * 2); // 2x plus rapide
        goblin.setFlipX(dx < 0); // Flip à gauche quand poursuit vers la gauche
    } else {
        // Mode patrouille : orientation normale (comme avant)
        goblin.setVelocityX(goblin.speed * goblin.goblinDirection);
        if (goblin.body.blocked.left) goblin.goblinDirection = 1;
        if (goblin.body.blocked.right) goblin.goblinDirection = -1;
        if (goblin.x > goblin.goblinStartX + 120) goblin.goblinDirection = -1;
        if (goblin.x < goblin.goblinStartX - 120) goblin.goblinDirection = 1;
        goblin.setFlipX(goblin.goblinDirection < 0); // Orientation normale en patrouille
    }
    if (!goblin.anims.isPlaying || goblin.anims.currentAnim.key !== "goblin_walk")
        goblin.play("goblin_walk", true);
}


// ------------------ CHAMPIGNON ------------------
export function preloadChampignon(scene) {
    scene.load.spritesheet("champignon", "assets/champignon.png", { frameWidth: 23, frameHeight: 37 });
}

export function createChampignon(scene, x, y) {
    if (!scene.anims.exists("champignon_walk")) {
        scene.anims.create({
            key: "champignon_walk",
            frames: scene.anims.generateFrameNumbers("champignon", { start: 4, end: 7 }),
            frameRate: 6,
            repeat: -1
        });
    }
    let champi = scene.physics.add.sprite(x, y, "champignon");
    champi.setOrigin(0.5, 1);
    champi.setCollideWorldBounds(true);
    champi.body.allowGravity = true;
    champi.champiStartX = x;
    champi.champiDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    champi.speed = 30;
    champi.health = 2;
    champi.damage = 1; // points de dégâts infligés
    champi.play("champignon_walk");
    return champi;
}

export function updateChampignon(champi, player, scene) {
    if (!champi || !champi.body) return;
    champi.setVelocityX(champi.speed * champi.champiDirection);
    if (champi.body.blocked.left) champi.champiDirection = 1;
    if (champi.body.blocked.right) champi.champiDirection = -1;
    if (champi.x > champi.champiStartX + 80) champi.champiDirection = -1;
    if (champi.x < champi.champiStartX - 80) champi.champiDirection = 1;
    champi.setFlipX(champi.champiDirection < 0);
    if (!champi.anims.isPlaying || champi.anims.currentAnim.key !== "champignon_walk")
        champi.play("champignon_walk", true);
}

// ------------------ BOSS DRAGON (VERSION POURSUITE PERMANENTE) ------------------
// ------------------ BOSS DRAGON (VERSION POURSUITE PERMANENTE EN HAUTEUR) ------------------
export function preloadBossDragon(scene) {
    scene.load.spritesheet("boss_dragon", "assets/dragon.png", { 
        frameWidth: 144, 
        frameHeight: 128 
    });
}

export function createBossDragon(scene, x, y) {
    // Créer l'animation si elle n'existe pas
    if (!scene.anims.exists("anim_boss_dragon")) {
        scene.anims.create({
            key: "anim_boss_dragon",
            frames: scene.anims.generateFrameNumbers("boss_dragon", { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
    }

    let boss = scene.physics.add.sprite(x, y, "boss_dragon");
    boss.setOrigin(0.5, 0.5);
    boss.setCollideWorldBounds(false); // Pas de collision avec les bords pour voler librement
    boss.body.allowGravity = false; // Pas de gravité pour voler
    boss.setDisplaySize(300, 300); // Taille d'affichage du sprite
    boss.body.setSize(90, 40); // Taille de la hitbox pour les collisions
    
    // IMPORTANT : Marquer le boss comme "volant" pour éviter les collisions avec les tuiles
    boss.isBoss = true; // Tag pour identifier le boss
    boss.setDepth(100); // S'assure qu'il s'affiche au-dessus des autres éléments
    
    // Propriétés personnalisées
    boss.startX = x;
    boss.startY = y;
    boss.chaseSpeed = 190; // Vitesse de poursuite
    boss.health = 10000000000000000000;
    boss.damage = 4;
    
    // ✨ NOUVELLE PROPRIÉTÉ : Hauteur minimale de vol au-dessus du sol
    boss.minFlyHeight = 150; // Le boss restera au minimum à 150px au-dessus du sol
    boss.targetFlyHeight = 180; // Hauteur idéale de vol
    
    // IMPORTANT : Lancer l'animation
    boss.play("anim_boss_dragon");
    
    return boss;
}

// Fonction pour mettre à jour le comportement du boss dragon
// Le boss poursuit le joueur pour l'attaquer, en évitant les tuiles grâce à son vol
export function updateBossDragon(boss, player, scene) {
    if (!boss || !boss.body) return;
    
    // --- CALCUL DE LA POSITION ET DISTANCE ---
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distance = Phaser.Math.Distance.Between(player.x, player.y, boss.x, boss.y);
    
    // --- DÉTECTION D'OBSTACLES DEVANT LE BOSS ---
    let hasObstacleAhead = false;
    if (scene.layers.platform_layer) {
        // Vérifier plusieurs points devant le boss pour détecter les tuiles
        const checkDistance = 60; // Distance de détection
        const direction = dx > 0 ? 1 : -1;
        
        for (let i = 1; i <= 3; i++) {
            const checkX = boss.x + (direction * checkDistance * i / 3);
            const checkY = boss.y;
            const tile = scene.layers.platform_layer.getTileAtWorldXY(checkX, checkY, true);
            
            if (tile && tile.index !== -1) {
                hasObstacleAhead = true;
                break;
            }
        }
    }
    
    // --- CALCUL DE LA HAUTEUR CIBLE ---
    let targetY;
    
    if (hasObstacleAhead) {
        // 🚀 OBSTACLE DÉTECTÉ : Voler haut pour le contourner
        targetY = player.y - boss.targetFlyHeight - 50; // Monte encore plus haut
    } else if (distance < 100) {
        // 🔥 TRÈS PROCHE : Descendre pour attaquer directement
        targetY = player.y - 30; // Descend presque au niveau du joueur
    } else if (distance < 250) {
        // ⚔️ PORTÉE D'ATTAQUE : Descendre progressivement
        targetY = player.y - 80; // Hauteur d'attaque
    } else {
        // 👁️ POURSUITE : Hauteur de vol normale
        targetY = player.y - boss.targetFlyHeight;
    }
    
    // Vérifier qu'on ne descend pas trop bas (sol)
    const groundLevel = scene.physics.world.bounds.height - 100;
    if (targetY > groundLevel - boss.minFlyHeight) {
        targetY = groundLevel - boss.minFlyHeight;
    }
    
    // --- VITESSE ADAPTATIVE ---
    let currentSpeed = boss.chaseSpeed;
    
    if (hasObstacleAhead) {
        // Ralentir légèrement pour monter
        currentSpeed = boss.chaseSpeed * 0.8;
    } else if (distance > 400) {
        // Très loin : accélérer
        currentSpeed = boss.chaseSpeed * 1.3;
    } else if (distance < 100) {
        // Très proche : attaque rapide
        currentSpeed = boss.chaseSpeed * 0.9;
    } else {
        // Distance normale : vitesse standard
        currentSpeed = boss.chaseSpeed;
    }
    
    // --- CALCUL DE L'ANGLE ET DU MOUVEMENT ---
    const adjustedDy = targetY - boss.y;
    const angle = Math.atan2(adjustedDy, dx);
    
    // Mouvement horizontal vers le joueur
    boss.setVelocityX(Math.cos(angle) * currentSpeed);
    
    // Mouvement vertical pour atteindre la hauteur cible
    let verticalSpeed = Math.sin(angle) * currentSpeed;
    
    // Priorité à la montée si obstacle détecté
    if (hasObstacleAhead && boss.y > targetY) {
        verticalSpeed = -currentSpeed * 0.7; // Force à monter
    }
    
    // Limiter la vitesse verticale
    verticalSpeed = Phaser.Math.Clamp(verticalSpeed, -currentSpeed * 0.7, currentSpeed * 0.7);
    
    boss.setVelocityY(verticalSpeed);
    
    // --- EFFET DE VOL LÉGER ---
    if (!hasObstacleAhead && distance > 100) {
        const wavyOffset = Math.sin(scene.time.now / 500) * 3;
        boss.setVelocityY(boss.body.velocity.y + wavyOffset);
    }
    
    // --- ORIENTATION AUTOMATIQUE ---
    if (boss.body.velocity.x > 5) {
        boss.setFlipX(true);
    } else if (boss.body.velocity.x < -5) {
        boss.setFlipX(false);
    }
    
    // --- ANIMATION ---
    if (!boss.anims.isPlaying || boss.anims.currentAnim.key !== "anim_boss_dragon") {
        boss.play("anim_boss_dragon", true);
    }
}

// ------------------ DRAGON2 (Boss Final - utilise le même sprite que boss_dragon) ------------------

export function createDragon2(scene, x, y) {
    // Créer l'animation si elle n'existe pas
    if (!scene.anims.exists("anim_dragon2")) {
        scene.anims.create({
            key: "anim_dragon2",
            frames: scene.anims.generateFrameNumbers("boss_dragon", { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
    }

    let dragon = scene.physics.add.sprite(x, y, "boss_dragon");
    dragon.setOrigin(0.5, 0.5);
    dragon.setCollideWorldBounds(false);
    dragon.body.allowGravity = false;
    dragon.setDisplaySize(300, 300);
    dragon.body.setSize(90, 40);
    
    dragon.isDragon2 = true;
    dragon.setDepth(100);
    
    // === PROPRIÉTÉS DU BOSS FINAL ===
    dragon.startX = x;
    dragon.startY = y;
    
    // Statistiques de combat
    dragon.health = 50; // 🔥 50 PV pour un long combat
    dragon.damage = 3;  // 🔥 Inflige 3 potions de dégâts
    
    // Vitesses
    dragon.patrolSpeed = 100;  // Vitesse de patrouille
    dragon.chaseSpeed = 180;   // Vitesse de poursuite
    
    // Comportement de patrouille
    dragon.patrolRange = 400;      // 🔄 Distance de patrouille (aller-retour de 400px)
    dragon.patrolDirection = 1;    // 1 = droite, -1 = gauche
    
    // Champ de vision
    dragon.visionRange = 500;      // 👁️ Détecte le joueur à 500px maximum
    dragon.stopChaseDistance = 700; // Arrête la poursuite si le joueur s'éloigne trop
    
    // État du dragon
    dragon.isChasing = false;      // Est-il en train de poursuivre ?
    
    // Propriétés de vol
    dragon.minFlyHeight = 150;
    dragon.targetFlyHeight = 180;
    dragon.patrolFlyHeight = 200;  // Hauteur de vol en patrouille
    
    dragon.play("anim_dragon2");
    
    return dragon;
}

export function updateDragon2(dragon, player, scene) {
    if (!dragon || !dragon.body) return;
    
    // --- CALCUL DE LA DISTANCE AVEC LE JOUEUR ---
    const distance = Phaser.Math.Distance.Between(player.x, player.y, dragon.x, dragon.y);
    const dx = player.x - dragon.x;
    const dy = player.y - dragon.y;
    
    // --- DÉTERMINER LE MODE (PATROUILLE ou POURSUITE) ---
    
    // 🎯 Activer la poursuite si le joueur entre dans le champ de vision
    if (distance < dragon.visionRange && !dragon.isChasing) {
        dragon.isChasing = true;
    }
    
    // 🚶 Retourner en patrouille si le joueur s'éloigne trop
    if (distance > dragon.stopChaseDistance && dragon.isChasing) {
        dragon.isChasing = false;
    }
    
    // --- DÉTECTION D'OBSTACLES ---
    let hasObstacleAhead = false;
    if (scene.layers.platform_layer) {
        const checkDistance = 60;
        const direction = dragon.isChasing ? (dx > 0 ? 1 : -1) : dragon.patrolDirection;
        
        for (let i = 1; i <= 3; i++) {
            const checkX = dragon.x + (direction * checkDistance * i / 3);
            const checkY = dragon.y;
            const tile = scene.layers.platform_layer.getTileAtWorldXY(checkX, checkY, true);
            
            if (tile && tile.index !== -1) {
                hasObstacleAhead = true;
                break;
            }
        }
    }
    
    // ============================================
    // MODE POURSUITE 🔥
    // ============================================
    if (dragon.isChasing) {
        // --- CALCUL DE LA HAUTEUR CIBLE ---
        let targetY;
        
        if (hasObstacleAhead) {
            targetY = player.y - dragon.targetFlyHeight - 50;
        } else if (distance < 100) {
            targetY = player.y - 30; // Descend pour attaquer
        } else if (distance < 250) {
            targetY = player.y - 80;
        } else {
            targetY = player.y - dragon.targetFlyHeight;
        }
        
        // Vérifier qu'on ne descend pas trop bas
        const groundLevel = scene.physics.world.bounds.height - 100;
        if (targetY > groundLevel - dragon.minFlyHeight) {
            targetY = groundLevel - dragon.minFlyHeight;
        }
        
        // --- VITESSE ADAPTATIVE ---
        let currentSpeed = dragon.chaseSpeed;
        
        if (hasObstacleAhead) {
            currentSpeed = dragon.chaseSpeed * 0.8;
        } else if (distance > 400) {
            currentSpeed = dragon.chaseSpeed * 1.2;
        } else if (distance < 100) {
            currentSpeed = dragon.chaseSpeed * 0.9;
        }
        
        // --- MOUVEMENT VERS LE JOUEUR ---
        const adjustedDy = targetY - dragon.y;
        const angle = Math.atan2(adjustedDy, dx);
        
        dragon.setVelocityX(Math.cos(angle) * currentSpeed);
        
        let verticalSpeed = Math.sin(angle) * currentSpeed;
        
        if (hasObstacleAhead && dragon.y > targetY) {
            verticalSpeed = -currentSpeed * 0.7;
        }
        
        verticalSpeed = Phaser.Math.Clamp(verticalSpeed, -currentSpeed * 0.7, currentSpeed * 0.7);
        dragon.setVelocityY(verticalSpeed);
        
        // Effet de vol léger
        if (!hasObstacleAhead && distance > 100) {
            const wavyOffset = Math.sin(scene.time.now / 500) * 3;
            dragon.setVelocityY(dragon.body.velocity.y + wavyOffset);
        }
        
        // Orientation
        if (dragon.body.velocity.x > 5) {
            dragon.setFlipX(true);
        } else if (dragon.body.velocity.x < -5) {
            dragon.setFlipX(false);
        }
    } 
    // ============================================
    // MODE PATROUILLE 🚶
    // ============================================
    else {
        // --- MOUVEMENT HORIZONTAL (aller-retour) ---
        dragon.setVelocityX(dragon.patrolSpeed * dragon.patrolDirection);
        
        // Changer de direction aux extrémités de la patrouille
        if (dragon.x > dragon.startX + dragon.patrolRange) {
            dragon.patrolDirection = -1;
            dragon.setFlipX(false);
        } else if (dragon.x < dragon.startX - dragon.patrolRange) {
            dragon.patrolDirection = 1;
            dragon.setFlipX(true);
        }
        
        // Changer de direction si obstacle devant
        if (hasObstacleAhead) {
            dragon.patrolDirection *= -1;
        }
        
        // --- MOUVEMENT VERTICAL (maintenir hauteur de patrouille) ---
        const targetPatrolY = dragon.startY - dragon.patrolFlyHeight;
        const distanceToTargetY = targetPatrolY - dragon.y;
        
        // Monter ou descendre doucement pour atteindre la hauteur cible
        if (Math.abs(distanceToTargetY) > 10) {
            const verticalSpeed = Phaser.Math.Clamp(distanceToTargetY * 2, -60, 60);
            dragon.setVelocityY(verticalSpeed);
        } else {
            // Effet de vol ondulé quand à la bonne hauteur
            const wavyOffset = Math.sin(scene.time.now / 600) * 20;
            dragon.setVelocityY(wavyOffset);
        }
        
        // Orientation automatique en patrouille
        if (dragon.patrolDirection > 0) {
            dragon.setFlipX(true);
        } else {
            dragon.setFlipX(false);
        }
    }
    
    // --- ANIMATION ---
    if (!dragon.anims.isPlaying || dragon.anims.currentAnim.key !== "anim_dragon2") {
        dragon.play("anim_dragon2", true);
    }
}

    // ------------------ POTION ------------------
    export function createPotion(scene, x, y) {
        let potion = scene.physics.add.sprite(x, y, "potion");
        potion.setOrigin(0.5, 1);
        potion.body.setAllowGravity(false);
        return potion;
}

// ------------------ PORTAIL ------------------
export function createPortal(scene, x, y) {
    let portal = scene.physics.add.staticSprite(x, y, "portail2");
    portal.setOrigin(0.5, 1);
    return portal;
}
