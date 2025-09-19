// Fonctions utilitaires et création d'ennemis

// ------------------ DRAGON ------------------
export function preloadDragon(scene) {
    scene.load.spritesheet("petit_dragon", "assets/petit_dragon.png", {
        frameWidth: 42,
        frameHeight: 33,
    });
}

export function createDragon(scene, x, y) {
    if (!scene.anims.exists("dragon_walk")) {
        scene.anims.create({
            key: "dragon_walk",
            frames: scene.anims.generateFrameNumbers("petit_dragon", { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });
    }

    let dragon = scene.physics.add.sprite(x, y, "petit_dragon");
    dragon.setOrigin(0.5, 1);
    dragon.setCollideWorldBounds(true);
    dragon.body.allowGravity = false;
    dragon.dragonStartX = x;
    dragon.dragonDirection = 1;
    dragon.setFlipX(true);
    dragon.health = 2;

    dragon.play("dragon_walk");

    return dragon;
}

export function updateDragon(dragon, player, scene) {
    if (!dragon || !dragon.body) return;

    let distance = Phaser.Math.Distance.Between(player.x, player.y, dragon.x, dragon.y);
    let speed = 100;

    if (distance < 200) {
        let dx = player.x - dragon.x;
        let dy = player.y - dragon.y;
        let angle = Math.atan2(dy, dx);
        dragon.setVelocityX(Math.cos(angle) * speed);
        dragon.setVelocityY(Math.sin(angle) * speed);
        dragon.setFlipX(dragon.body.velocity.x > 0);
    } else {
        dragon.setVelocityX(50 * dragon.dragonDirection);
        dragon.setVelocityY(Math.sin(scene.time.now / 500) * 20);
        if (dragon.x > dragon.dragonStartX + 100) {
            dragon.dragonDirection = -1;
            dragon.setFlipX(false);
        } else if (dragon.x < dragon.dragonStartX - 100) {
            dragon.dragonDirection = 1;
            dragon.setFlipX(true);
        }
    }
}

// ------------------ SLIMES ------------------
export function preloadSlimes(scene) {
    // correction : chaque slime fait 48x26 px, pas 32x32
    scene.load.spritesheet("slime_rouge", "assets/slime_rouge.png", {
        frameWidth: 48,
        frameHeight: 26,
    });
    scene.load.spritesheet("slime_bleu", "assets/slime_bleu.png", {
        frameWidth: 48,
        frameHeight: 26,
    });
}

export function createSlime(scene, x, y, type = "slime_rouge") {
    // fallback si sprite manquant
    if (!scene.textures.exists(type)) {
        const g = scene.add.graphics();
        const color = (type === "slime_rouge") ? 0xff4444 : 0x4499ff;
        g.fillStyle(color, 1);
        g.fillRoundedRect(0, 0, 32, 24, 6);
        g.generateTexture(type, 32, 24);
        g.destroy();
    }

    // créer l'animation si nécessaire
    if (!scene.anims.exists(type + "_walk")) {
        const textureFrames = scene.textures.get(type).getFrameNames().filter(f => !isNaN(f));
        const frameCount = textureFrames.length;

        if (frameCount > 1) {
            scene.anims.create({
                key: type + "_walk",
                frames: scene.anims.generateFrameNumbers(type, { start: 0, end: frameCount - 1 }),
                frameRate: 6,
                repeat: -1,
            });
        }
    }

    // création du sprite
    let slime = scene.physics.add.sprite(x, y, type);
    slime.setOrigin(0.5, 1);
    slime.setCollideWorldBounds(true);
    slime.body.setBounce(0.2, 0);
    slime.body.allowGravity = true;

    // vitesse et direction pour IA
    slime._dir = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    slime._speed = 40;
    slime.health = 2;

    // animation initiale
    if (scene.anims.exists(type + "_walk")) slime.play(type + "_walk");

    // rebond vertical léger pour donner vie
    slime._bounceOffset = 0;

    return slime;
}

export function updateSlime(slime, player, scene) {
    if (!slime || !slime.body) return;

    // changer de direction si collision latérale
    if (slime.body.blocked.left) slime._dir = 1;
    if (slime.body.blocked.right) slime._dir = -1;

    // appliquer vitesse si au sol
    if (slime.body.blocked.down) {
        slime.setVelocityX(slime._speed * slime._dir);
        slime.setFlipX(slime._dir < 0);

        // relancer animation si besoin
        const walkAnim = slime.texture.key + "_walk";
        if (scene.anims.exists(walkAnim) && (!slime.anims.isPlaying || slime.anims.currentAnim.key !== walkAnim)) {
            slime.play(walkAnim, true);
        }

        // petit rebond vertical
        slime._bounceOffset += 0.05;
        slime.y += Math.sin(slime._bounceOffset) * 0.5;
    }
}
