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
        let dx = player.x - goblin.x;
        goblin.setVelocityX(Math.sign(dx) * goblin.speed * 1.5);
        goblin.setFlipX(dx > 0);
    } else {
        goblin.setVelocityX(goblin.speed * goblin.goblinDirection);
        if (goblin.body.blocked.left) goblin.goblinDirection = 1;
        if (goblin.body.blocked.right) goblin.goblinDirection = -1;
        if (goblin.x > goblin.goblinStartX + 120) goblin.goblinDirection = -1;
        if (goblin.x < goblin.goblinStartX - 120) goblin.goblinDirection = 1;
        goblin.setFlipX(goblin.goblinDirection < 0);
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

// ------------------ BOSS DRAGON ------------------
export function preloadBossDragon(scene) {
    scene.load.spritesheet("boss_dragon", "assets/dragon.png", { frameWidth: 152, frameHeight: 128 });
}

export function createBossDragon(scene, x, y) {
    let boss = scene.physics.add.sprite(x, y, "boss_dragon");
    boss.setOrigin(0.5, 1);
    boss.setCollideWorldBounds(true);
    boss.setBounce(0.2);
    boss.setDisplaySize(128, 128);
    boss.body.setSize(128, 128);
    boss.health = 10;
    boss.damage = 3; // points de dégâts infligés
    return boss;
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
