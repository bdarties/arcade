/***********************************************************************/
/** VARIABLES GLOBALES */
/***********************************************************************/
var player;
var clavier;
var groupe_plateformes;
var playerLives = 5; // 5 vies pour le joueur
var playerLifeBars = 2; // 3 barres de vie au départ
var arrows; // Groupe de flèches
var ladderLayer;
var killLayer;
var wasJumpPressed = false; // Pour le son du saut
var potions; // Groupe de potions

/***********************************************************************/
/** SCÈNE NIVEAU 3 */
/***********************************************************************/
export default class niveau3 extends Phaser.Scene {
constructor() {
    super({ key: "niveau3" });
    this.playerAttackHitbox = null;
    this.playerAttackOverlap = null;
}

preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Fond
    this.load.image("sky_2", "./assets/niveau3/sky_2.png");

    // Tilemap et tilesets
    this.load.tilemapTiledJSON("map_dungeon", "./assets/niveau3/map_dungeon.json");
    this.load.image("dungeon", "./assets/niveau3/dungeon.png");

    // Sprites joueur et animations
    this.load.spritesheet("img_perso", "./assets/niveau3/dude.png", { frameWidth: 43, frameHeight: 53 });
    this.load.spritesheet("img_jump", "./assets/niveau3/dude_jump.png", { frameWidth: 40, frameHeight: 62 });
    this.load.spritesheet("attaque", "./assets/niveau3/attack.png", { frameWidth: 96, frameHeight: 49 });

    // Ennemis
    this.load.spritesheet("ennemi8_walk", "./assets/niveau3/ennemi_8_walk.png", { frameWidth: 41, frameHeight: 70 });
    this.load.spritesheet("ennemi8_attack", "./assets/niveau3/ennemi_8_attack.png", { frameWidth: 126, frameHeight: 70 });
    this.load.spritesheet("ennemi8_dead", "./assets/niveau3/ennemi_8_dead.png", { frameWidth: 60, frameHeight: 56 });

    this.load.spritesheet("ennemi9_walk", "./assets/niveau3/ennemi_9_walk.png", { frameWidth: 53, frameHeight: 25 });
    this.load.spritesheet("ennemi9_attack", "./assets/niveau3/ennemi_9_attack.png", { frameWidth: 44, frameHeight: 54 });
    this.load.spritesheet("ennemi9_dead", "./assets/niveau3/ennemi_9_dead.png", { frameWidth: 26, frameHeight: 30 });

    this.load.spritesheet("ennemi7_walk", "./assets/niveau3/ennemi_7_walk.png", { frameWidth: 70, frameHeight: 57 });
    this.load.spritesheet("ennemi7_attack", "./assets/niveau3/ennemi_7_attack.png", { frameWidth: 128, frameHeight: 58 });
    this.load.spritesheet("ennemi7_dead", "./assets/niveau3/ennemi_7_dead.png", { frameWidth: 48, frameHeight: 51 });

    this.load.spritesheet("ennemi10_walk", "./assets/niveau3/ennemi_10_walk.png", { frameWidth: 228, frameHeight: 84 });
    this.load.spritesheet("ennemi10_attack", "./assets/niveau3/ennemi_10_attack.png", { frameWidth: 256, frameHeight: 89 });
    this.load.spritesheet("ennemi10_dead", "./assets/niveau3/ennemi_10_dead.png", { frameWidth: 216, frameHeight: 80 });
    
    // CORRECTION : Utilisation des bonnes dimensions pour le spritesheet.
    this.load.spritesheet("ennemi10_stand", "./assets/niveau3/ennemi_10_stand.png", { frameWidth: 212, frameHeight: 89 });

    // Flèche
    this.load.image("fireball", "./assets/niveau3/fireball.png");

    // Potions
    this.load.image("potion_red", "./assets/potion_red.png");
    this.load.image("potion_green", "./assets/potion_green.png");
    this.load.image("potion_purple", "./assets/potion_purple.png");

    // Musique de fond
    this.load.audio("music", "./assets/niveau3/music.mp3");

    // Sons du joueur
    this.load.audio("jump", "./assets/jump.mp3");
    this.load.audio("sword", "./assets/sword.mp3");

    // Ajout du cœur
    this.load.image("heart", "./assets/heart.png");

    // Ajout de l'image de game over
    this.load.image("game_over", "./assets/game_over.jpg");

    this.load.image("bravo", "./assets/bravo.jpg");
    this.load.audio("victory", "./assets/niveau3/victory.mp3");

    this.load.audio("breathing", "./assets/niveau3/breathing.mp3");
    this.load.audio("death", "./assets/niveau3/death.mp3");
    this.load.audio("loose_song", "./assets/loose_song.mp3");
}

create() {
    this.music = this.sound.add("music", { loop: true, volume: 0.15 });
    this.music.play();

    this.events.on('wake', () => {
        if (this.music) {
            this.music.play();
        }
    });

    this.sonJump = this.sound.add("jump", { volume: 4 });
    this.sonSword = this.sound.add("sword", { volume: 0.3 });
    this.sonBreathing = this.sound.add("breathing", { volume: 0.5 });

    const tileHeight = 32;
    const numTiles = 22;
    const skyHeight = tileHeight * numTiles;

    this.backgroundSky = this.add.image(0, 0, "sky_2")
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDisplaySize(this.scale.width, this.scale.height)
        .setDepth(-3);

    const map = this.make.tilemap({ key: "map_dungeon" });
    const tilesetDungeon = map.addTilesetImage("donjon_tuiles", "dungeon");

    const layerOrder = [
        "background_layer", "decoration_back_layer", "decoration2_back_layer",
        "decoration3_back_layer", "ladder_layer", "platform_layer",
        "kill_layer", "decoration_front_layer"
    ];

    let platformLayer = null;

    layerOrder.forEach(layerName => {
        if (map.layers.some(l => l.name === layerName)) {
            const layer = map.createLayer(layerName, tilesetDungeon, 0, 0);

            if (layerName === "background_layer") layer.setDepth(-3);
            else if (layerName === "decoration_back_layer" || layerName === "decoration2_back_layer") layer.setDepth(-2);
            else if (layerName === "kill_layer") {
                layer.setDepth(-1);
                layer.setVisible(true);
                killLayer = layer;
            } else if (layerName === "decoration3_back_layer") layer.setDepth(0);
            else if (layerName === "platform_layer") {
                layer.setDepth(0);
                layer.setCollisionByExclusion([-1]);
                platformLayer = layer;
                groupe_plateformes = platformLayer;
            } else if (layerName === "ladder_layer") {
                layer.setDepth(1);
                ladderLayer = layer;
            } else if (layerName === "decoration_front_layer") layer.setDepth(2);
            else layer.setDepth(0);
        }
    });

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    let startX = 100,
        startY = 450;
    let objLayer = map.getObjectLayer("object_player");
    if (objLayer && objLayer.objects) {
        const startObj = objLayer.objects.find(obj => obj.name === "start");
        if (startObj) {
            startX = startObj.x;
            startY = startObj.y - (startObj.height || 0) / 2;
        }
    }
    this.startX = startX;
    this.startY = startY;

    player = this.physics.add.sprite(startX, startY, "img_perso");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.lastDir = "droite";
    player.isAttacking = false;
    player.isInvulnerable = false;
    player.setDepth(1);
    this.cameras.main.startFollow(player);

    this.player = player;
    this.player.isOnLadder = false;
    this.player.isClimbingUp = false; 
    this.cursors = this.input.keyboard.createCursorKeys();

    potions = this.physics.add.group();
    let objPotionLayer = map.getObjectLayer("object_player");
    if (objPotionLayer && objPotionLayer.objects) {
        objPotionLayer.objects.forEach(obj => {
            let key = null;
            const name = (obj.name || "").toLowerCase();
            const type = (obj.type || "").toLowerCase();
            const item_type = (obj.properties?.find(p => p.name === "item_type")?.value || "").toLowerCase();

            if ((name === "heart" || type === "heart") || (name === "item" && type === "hearth")) {
                key = "potion_red";
            } 
            else if (name === "powerup") {
                if (type === "protection" || item_type === "protection_item") key = "potion_green";
                else if (type === "dead" || item_type === "dead_item") key = "potion_purple";
            }

            if (key) {
                const potion = potions.create(obj.x, obj.y - 32, key);
                potion.potionType = key;
                potion.setOrigin(0, 0);
                potion.body.allowGravity = false;
                potion.body.immovable = true;
                potion.setDepth(50);
            }
        });
    }
    this.physics.add.overlap(player, potions, this.collectPotion, null, this);

    if (platformLayer) {
        this.physics.add.collider(player, platformLayer, null, () => {
            return !player.isClimbingUp;
        }, this);
    }

    arrows = this.physics.add.group({ defaultKey: "fireball", maxSize: 20 });
    this.physics.add.collider(arrows, platformLayer, arrow => arrow.destroy());
    this.physics.add.overlap(player, arrows, (playerSprite, arrow) => {
        if (!player.isInvulnerable) {
            arrow.destroy();
            this.hitPlayer();
        }
    });

    this.bossBars = {};
    const objLayerEnemies = objPotionLayer;
    this.enemies = this.physics.add.group();
    if (objLayerEnemies && objLayerEnemies.objects) {
        objLayerEnemies.objects.forEach(obj => {
            let enemy = null;
            if (obj.name === "enemy_8") {
                enemy = this.enemies.create(obj.x, obj.y, "ennemi8_walk");
                enemy.type = 8;
                enemy.maxHealth = 3;
                enemy.health = 3;
            } else if (obj.name === "enemy_9") {
                enemy = this.enemies.create(obj.x, obj.y, "ennemi9_walk");
                enemy.type = 9;
                enemy.maxHealth = 3;
                enemy.health = 3;
            } else if (obj.name === "enemy_7") {
                enemy = this.enemies.create(obj.x, obj.y, "ennemi7_walk");
                enemy.type = 7;
                enemy.maxHealth = 3;
                enemy.health = 3;
            } else if (obj.name === "enemy_10") {
                enemy = this.enemies.create(obj.x, obj.y, "ennemi10_walk");
                enemy.type = 10;
                enemy.setScale(1.8);
                enemy.maxHealth = 15;
                enemy.health = 15;
                enemy.canAttack = true; // Ajout de la variable pour le cooldown

                const barBg = this.add.rectangle(enemy.x, enemy.y - enemy.height * enemy.scaleY, 100, 12, 0x222222).setDepth(10);
                const barFg = this.add.rectangle(enemy.x, enemy.y - enemy.height * enemy.scaleY, 96, 8, 0xff0000).setDepth(11);
                this.bossBars[enemy.id] = { bg: barBg, fg: barFg, boss: enemy };
            }

            if (enemy) {
                enemy.setCollideWorldBounds(true);
                enemy.setVelocityX(-50);
                enemy.isAlive = true;
                enemy.setDepth(1);
                enemy.lastDir = -1;
                enemy.anims.play(`ennemi${enemy.type}_walk`, true);
                this.physics.add.collider(enemy, platformLayer);
                
                if (enemy.type === 10) {
                    enemy.on('animationcomplete', this.bossAnimationComplete, this);
                }

                if (enemy.type === 9) {
                    this.time.addEvent({
                        delay: 4000,
                        loop: true,
                        callback: () => {
                            if (!enemy.isAlive) return;
                            enemy.anims.play("ennemi9_attack", true);
                            this.time.delayedCall(300, () => {
                                const arrow = arrows.get(enemy.x, enemy.y + 10);
                                if (arrow) {
                                    arrow.setActive(true).setVisible(true);
                                    this.physics.world.enable(arrow);
                                    arrow.body.allowGravity = false;
                                    arrow.body.setVelocityX(enemy.body.velocity.x < 0 ? -200 : 200);
                                    arrow.setFlipX(enemy.body.velocity.x < 0).setScale(1.5);
                                    this.time.delayedCall(2000, () => arrow.active && arrow.destroy());
                                }
                            });
                        }
                    });
                }
            }
        });
    }
    this.physics.add.overlap(player, this.enemies, this.enemyHitsPlayer, null, this);

    this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "anim_face_droite", frames: [{ key: "img_perso", frame: 8 }], frameRate: 20 });
    this.anims.create({ key: "anim_face_gauche", frames: [{ key: "img_perso", frame: 9 }], frameRate: 20 });
    this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 10, end: 17 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "anim_saut_droite", frames: this.anims.generateFrameNumbers("img_jump", { start: 6, end: 9 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: "anim_saut_gauche", frames: this.anims.generateFrameNumbers("img_jump", { start: 15, end: 19 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: "attaque_droite", frames: this.anims.generateFrameNumbers("attaque", { start: 0, end: 3 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: "attaque_gauche", frames: this.anims.generateFrameNumbers("attaque", { start: 4, end: 7 }), frameRate: 12, repeat: 0 });

    this.anims.create({ key: "ennemi8_walk", frames: this.anims.generateFrameNumbers("ennemi8_walk", { start: 8, end: 15 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "ennemi8_attack", frames: this.anims.generateFrameNumbers("ennemi8_attack", { start: 6, end: 11 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: "ennemi8_dead", frames: this.anims.generateFrameNumbers("ennemi8_dead", { start: 3, end: 5 }), frameRate: 8, repeat: 0 });

    this.anims.create({ key: "ennemi9_walk", frames: this.anims.generateFrameNumbers("ennemi9_walk", { start: 7, end: 13 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "ennemi9_attack", frames: this.anims.generateFrameNumbers("ennemi9_attack", { start: 8, end: 15 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: "ennemi9_dead", frames: this.anims.generateFrameNumbers("ennemi9_dead", { start: 5, end: 9 }), frameRate: 8, repeat: 0 });

    this.anims.create({ key: "ennemi7_walk", frames: this.anims.generateFrameNumbers("ennemi7_walk", { start: 9, end: 17 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "ennemi7_attack", frames: this.anims.generateFrameNumbers("ennemi7_attack", { start: 6, end: 11 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: "ennemi7_dead", frames: this.anims.generateFrameNumbers("ennemi7_dead", { start: 0, end: 1 }), frameRate: 8, repeat: 0 });

    this.anims.create({ key: "ennemi10_walk", frames: this.anims.generateFrameNumbers("ennemi10_walk", { start: 12, end: 23 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: "ennemi10_attack", frames: this.anims.generateFrameNumbers("ennemi10_attack", { start: 10, end: 19 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: "ennemi10_dead", frames: this.anims.generateFrameNumbers("ennemi10_dead", { start: 3, end: 5 }), frameRate: 8, repeat: 0 });
    
    this.anims.create({ key: "ennemi10_stand", frames: this.anims.generateFrameNumbers("ennemi10_stand", { start: 0, end: 6 }), frameRate: 8, repeat: -1 });

    clavier = this.input.keyboard.createCursorKeys();
    this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.heartsGroup = this.add.group();
    this.lifeBarGroup = this.add.group();
    this.updateHeartsDisplay();
}


bossAnimationComplete(animation, frame, boss) {
    if (!boss.isAlive || !boss.active) {
        return;
    }

    if (animation.key === 'ennemi10_attack') {
        boss.isAttacking = false;

        // Vérification plus robuste pour voir si l'animation 'stand' est valide
        const standAnim = this.anims.get('ennemi10_stand');
        if (standAnim && standAnim.frames.length > 0) {
            boss.anims.play('ennemi10_stand', true);
        } else {
            console.warn('Animation "ennemi10_stand" non trouvée ou invalide. Remplacement par "ennemi10_walk".');
            boss.anims.play('ennemi10_walk', true);
            boss.setVelocityX(boss.flipX ? 50 : -50);
        }

        // Ajout d'un temps de recharge avant la prochaine attaque
        this.time.delayedCall(1500, () => {
            if (boss.active) {
                boss.canAttack = true;
            }
        });
    }
}


updateHeartsDisplay() {
    this.heartsGroup.clear(true, true);
    for (let i = 0; i < playerLives; i++) {
        const heart = this.add.image(30 + i * 40, 30, "heart").setScrollFactor(0).setDepth(100).setScale(0.7);
        this.heartsGroup.add(heart);
    }
    this.lifeBarGroup.clear(true, true);
    if (playerLifeBars > 0) {
        const heartIcon = this.add.image(30, 75, "heart").setScrollFactor(0).setDepth(100).setScale(0.7);
        this.lifeBarGroup.add(heartIcon);
        const lifeText = this.add.text(60, 65, "x " + playerLifeBars, { font: "24px Arial", fill: "#fff", stroke: "#000", strokeThickness: 3 }).setScrollFactor(0).setDepth(100);
        this.lifeBarGroup.add(lifeText);
    }
}

collectPotion(player, potion) {
    if (!potion) return;
    const type = potion.potionType || "";
    potion.destroy();

    if (type === "potion_red") {
        playerLives++;
        this.updateHeartsDisplay();
    } else if (type === "potion_green") {
        player.isInvulnerable = true;
        player.setTint(0x00ff00);

        const boxWidth = 350;
        const boxHeight = 50;
        const boxX = this.cameras.main.centerX - (boxWidth / 2);
        const boxY = 60;

        const messageBox = this.add.graphics();
        messageBox.fillStyle(0x111111, 0.8);
        messageBox.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 16);
        messageBox.lineStyle(2, 0x00ff00, 1);
        messageBox.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 16);
        messageBox.setScrollFactor(0).setDepth(1000);

        let remainingTime = 7;

        const messageText = this.add.text(
            this.cameras.main.centerX,
            boxY + (boxHeight / 2),
            `Invincible pendant ${remainingTime} secondes !`,
            { font: "20px Arial", fill: "#00ff00", align: "center" }
        );
        messageText.setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        const timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                remainingTime--;
                if (messageText.active) {
                    messageText.setText(`Invincible pendant ${remainingTime} secondes !`);
                }

                if (remainingTime <= 0) {
                    timerEvent.remove();
                    player.isInvulnerable = false;
                    player.clearTint();
                    if (messageBox.active) messageBox.destroy();
                    if (messageText.active) messageText.destroy();
                }
            },
            loop: true
        });
        
    } else if (type === "potion_purple") {
        if (!player.isInvulnerable) this.hitPlayer();
    }
}

triggerGameOver() {
    this.physics.pause();
    player.anims.stop();
    player.setTint(0xff0000);

    if (this.music) {
        this.music.stop();
    }


    this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "game_over")
        .setScrollFactor(0)
        .setDepth(9999)
        .setOrigin(0.5)
        .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    this.time.delayedCall(5000, () => {
        playerLives = 5;
        playerLifeBars = 2;
        this.scene.start("selection");
    });
}

hitPlayer() {
    if (player.isInvulnerable) return;

    playerLives--;

    if (playerLives <= 0) {
        if (playerLifeBars > 0) {
            playerLifeBars--;
            playerLives = 5;
            player.setPosition(this.startX, this.startY).setVelocity(0, 0);
        } else {
            this.updateHeartsDisplay(); 
            this.triggerGameOver();
            return;
        }
    }

    this.updateHeartsDisplay();

    player.isInvulnerable = true;
    player.setTint(0xff0000);
    this.time.delayedCall(200, () => player.clearTint());
    this.time.delayedCall(1000, () => player.isInvulnerable = false);
}

respawnPlayer() {
    if (player.isInvulnerable) return;

    playerLives--;

    if (playerLives <= 0) {
        if (playerLifeBars > 0) {
            playerLifeBars--;
            playerLives = 5;
        } else {
            this.updateHeartsDisplay();
            this.triggerGameOver();
            return;
        }
    }

    this.updateHeartsDisplay();

    player.setPosition(this.startX, this.startY).setVelocity(0, 0);

    player.isInvulnerable = true;
    player.setTint(0xff0000);
    this.time.delayedCall(1000, () => {
        player.isInvulnerable = false;
        player.clearTint();
    });
}


endPlayerAttack() {
    if (!player.isAttacking) return;
    player.isAttacking = false;
    if (this.playerAttackOverlap) this.playerAttackOverlap.destroy();
    if (this.playerAttackHitbox) this.playerAttackHitbox.destroy();
    this.playerAttackOverlap = null;
    this.playerAttackHitbox = null;
}

playerAttackEnemy(enemy) {
    if (!enemy || !enemy.isAlive || enemy.isBeingHit) return;
    enemy.isBeingHit = true;
    enemy.health--;

    if (enemy.type === 10 && this.bossBars[enemy.id]) {
        this.bossBars[enemy.id].fg.width = 96 * Math.max(0, enemy.health) / enemy.maxHealth;
    }

    enemy.setTint(0xff0000);
    this.time.delayedCall(100, () => enemy.active && enemy.clearTint());
    this.time.delayedCall(300, () => enemy.isBeingHit = false);

    if (enemy.health <= 0) {
        enemy.isAlive = false;
        enemy.setVelocityX(0);

        if (enemy.type === 10) this.sound.play("death", { volume: 0.7 });

        if ([10, 8, 7].includes(enemy.type)) {
            enemy.body.allowGravity = false;
            enemy.body.setVelocity(0, 0);
            enemy.body.immovable = true;
            if (enemy.type === 8) enemy.y += 3;
            if (enemy.type === 7) enemy.y += 1;
            enemy.body.y = enemy.y - enemy.displayHeight / 2;
        }

        enemy.anims.play(`ennemi${enemy.type}_dead`, true);
        enemy.once("animationcomplete", () => {
            if (enemy.type === 10 && this.bossBars[enemy.id]) {
                this.bossBars[enemy.id].bg.destroy();
                this.bossBars[enemy.id].fg.destroy();
                this.time.delayedCall(3000, () => {
                    this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
                        if (progress === 1) {
                            if (this.music) {
                                this.music.stop();
                            }
                            this.add.image(camera.centerX, camera.centerY, "bravo").setScrollFactor(0).setDepth(9999).setOrigin(0.5).setDisplaySize(camera.width, camera.height);
                            
                            this.victoryMusic = this.sound.add("victory", { volume: 0.5 });
                            this.victoryMusic.play();

                            camera.fadeIn(1000, 0, 0, 0);
                            this.time.delayedCall(5000, () => {
                                if (this.victoryMusic) this.victoryMusic.stop();
                                this.scene.start("selection");
                            });
                        }
                    });
                });
            } else {
                if (enemy) enemy.destroy();
            }
        });
    }
}

enemyHitsPlayer(playerSprite, enemy) {
    if (!enemy || !enemy.isAlive || player.isInvulnerable || [9, 10].includes(enemy.type) || enemy.isAttacking || !player.body.blocked.down) return;

    enemy.isAttacking = true;
    enemy.setVelocityX(0);
    enemy.anims.play(`ennemi${enemy.type}_attack`, true);

    this.time.delayedCall(300, () => {
        if (enemy && enemy.isAlive && enemy.isAttacking && !player.isInvulnerable) {
            this.hitPlayer();
        }
    });

    enemy.once("animationcomplete", () => {
        enemy.isAttacking = false;
        if (enemy && enemy.isAlive) {
            enemy.setVelocityX(enemy.lastDir < 0 ? -50 : 50);
            enemy.anims.play(`ennemi${enemy.type}_walk`, true);
        }
    });
}

update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyAttack) && !player.isAttacking) {
        player.isAttacking = true;
        player.setVelocity(0, 0);

        const animKey = player.lastDir === "gauche" ? "attaque_gauche" : "attaque_droite";
        player.anims.play(animKey, true);
        this.sonSword.play();

        const hx = player.x + (player.lastDir === "droite" ? 40 : -40);
        this.playerAttackHitbox = this.add.rectangle(hx, player.y, 48, 40, 0xff0000, 0);
        this.physics.add.existing(this.playerAttackHitbox, true);

        this.playerAttackOverlap = this.physics.add.overlap(this.playerAttackHitbox, this.enemies, (hb, enemy) => {
            this.playerAttackEnemy(enemy);
        });

        player.once('animationcomplete', (anim) => {
            if (anim.key === animKey) {
                this.endPlayerAttack();
            }
        });
    }

    if (!player.isAttacking) {
        let onLadderTile = ladderLayer.getTileAtWorldXY(player.x, player.y);
        player.isOnLadder = !!onLadderTile;

        player.isClimbingUp = player.isOnLadder && this.cursors.up.isDown;

        if (player.isOnLadder) {
            player.body.allowGravity = false;

            if (clavier.left.isDown) {
                player.setVelocityX(-160);
                player.anims.play("anim_tourne_gauche", true);
                player.lastDir = "gauche";
            } else if (clavier.right.isDown) {
                player.setVelocityX(160);
                player.anims.play("anim_tourne_droite", true);
                player.lastDir = "droite";
            } else {
                player.setVelocityX(0);
            }

            if (clavier.up.isDown) {
                player.setVelocityY(-100);
            } else if (clavier.down.isDown) {
                player.setVelocityY(100);
            } else {
                player.setVelocityY(0);
            }

            if (player.body.velocity.x === 0 && player.body.velocity.y === 0) {
                player.anims.play(player.lastDir === "gauche" ? "anim_face_gauche" : "anim_face_droite", true);
            }

        } else {
            player.body.allowGravity = true;

            if (clavier.left.isDown) {
                player.setVelocityX(-160);
                if (player.body.blocked.down) player.anims.play("anim_tourne_gauche", true);
                player.lastDir = "gauche";
            } else if (clavier.right.isDown) {
                player.setVelocityX(160);
                if (player.body.blocked.down) player.anims.play("anim_tourne_droite", true);
                player.lastDir = "droite";
            } else {
                player.setVelocityX(0);
                if (player.body.blocked.down) {
                    player.anims.play(player.lastDir === "gauche" ? "anim_face_gauche" : "anim_face_droite", true);
                }
            }

            if (this.keyJump.isDown && player.body.blocked.down && !wasJumpPressed) {
                player.setVelocityY(-230);
                player.anims.play(player.lastDir === "gauche" ? "anim_saut_gauche" : "anim_saut_droite", true);
                this.sonJump.play();
                wasJumpPressed = true;
            }
            if (!this.keyJump.isDown) {
                wasJumpPressed = false;
            }
        }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
        if (this.music) this.music.stop();
        this.scene.switch("selection");
        return;
    }

    if (killLayer) {
        if (killLayer.hasTileAtWorldXY(player.x, player.y + player.height / 2)) {
            this.respawnPlayer();
        }
    }

    Object.values(this.bossBars).forEach(bar => {
        const boss = bar.boss;
        if (!boss.active) {
            bar.bg.destroy();
            bar.fg.destroy();
            return;
        }
        bar.bg.setPosition(boss.x, boss.y - boss.height * boss.scaleY);
        bar.fg.setPosition(boss.x, boss.y - boss.height * boss.scaleY);
        bar.fg.width = 96 * Math.max(0, boss.health) / boss.maxHealth;
    });

    this.enemies.children.iterate(e => {
        if (!e || !e.body || !e.isAlive) return;

        if (e.type === 10) {
            if (e.isAttacking) {
                return; 
            }

            const detectionRangeX = 350;
            const detectionRangeY = 100;

            // On vérifie si le boss peut attaquer et si le joueur est à portée
            if (e.canAttack && Math.abs(player.x - e.x) < detectionRangeX && Math.abs(player.y - e.y) < detectionRangeY) {
                e.isAttacking = true;
                e.canAttack = false; // Le boss ne peut plus attaquer immédiatement
                e.setVelocityX(0);
                e.setFlipX(player.x < e.x);

                e.anims.play("ennemi10_attack", true);
                this.sonBreathing.play();

                this.time.delayedCall(600, () => {
                    if (!e.isAlive || !player || player.isInvulnerable) return;
                    const isPlayerOnLeft = player.x < e.x;
                    if (Math.abs(player.x - e.x) < 200 && isPlayerOnLeft === e.flipX) {
                        this.hitPlayer();
                    }
                });
                return;
            }
        }
        
        if (e.isAttacking) return;

        if (e.body.blocked.left) {
            e.setVelocityX(50);
            e.lastDir = 1;
        } else if (e.body.blocked.right) {
            e.setVelocityX(-50);
            e.lastDir = -1;
        }

        const nextX = e.body.velocity.x > 0 ? e.x + (e.width * e.scaleX) / 2 + 2 : e.x - (e.width * e.scaleX) / 2 - 2;
        const tile = groupe_plateformes.getTileAtWorldXY(nextX, e.y + (e.height * e.scaleY) / 2 + 1);
        if (!tile) {
            e.setVelocityX(-e.body.velocity.x);
            e.lastDir *= -1;
        }

        e.setFlipX(e.body.velocity.x < 0);
        const walkAnimKey = `ennemi${e.type}_walk`;
        if (e.anims.currentAnim?.key !== walkAnimKey) {
             e.anims.play(walkAnimKey, true);
        }
    });
}

}
