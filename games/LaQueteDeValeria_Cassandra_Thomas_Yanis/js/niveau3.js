import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES GLOBALES                                                 */
/***********************************************************************/
var player;
var clavier;
var groupe_plateformes;
var playerLives = 5; // 5 vies pour le joueur
var arrows; // Groupe de flèches
var ladderLayer;
var killLayer;
var wasJumpPressed = false; // Pour le son du saut
var potions; // Groupe de potions

/***********************************************************************/
/** SCÈNE SELECTION                                                    */
/***********************************************************************/
export default class niveau3 extends Phaser.Scene {
    constructor() {
        super({ key: "niveau3" });
    }

    preload() {
        const baseURL = this.sys.game.config.baseURL;
        this.load.setBaseURL(baseURL);

        // Fond
        this.load.image("sky", "./assets/niveau3/sky.png");
        this.load.image("fond", "./assets/niveau3/fond.png");

        // Tilemap et tilesets
        this.load.tilemapTiledJSON("map_village", "./assets/niveau3/map_village.json");
        this.load.image("village", "./assets/niveau3/village.png");

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

        // Flèche
        this.load.image("fleche", "./assets/niveau3/fleche.png");

         // Potions
        this.load.image("potion_red", "./assets/potion_red.png");
        this.load.image("potion_green", "./assets/potion_green.png");
        this.load.image("potion_purple", "./assets/potion_purple.png");

        // Musique de fond
        this.load.audio("music", "./assets/niveau3/music.mp3");

        // Sons du joueur
        this.load.audio("jump", "./assets/jump.mp3");
        this.load.audio("sword", "./assets/sword.mp3");
    }

    create() {
        fct.doNothing();
        fct.doAlsoNothing();

        // Musique de fond en boucle avec volume réduit
        this.music = this.sound.add("music", { loop: true, volume: 0.15 });
        this.music.play();

        // Préparation des sons du joueur
        this.sonJump = this.sound.add("jump", { volume: 0.3 });
        this.sonSword = this.sound.add("sword");

        /*************************************
         * FOND
         *************************************/
        const tileHeight = 32;
        const numTiles = 22;
        const skyHeight = tileHeight * numTiles;

        this.backgroundSky = this.add.image(0, 0, "sky")
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDisplaySize(this.scale.width, skyHeight)
            .setDepth(-3);

        /*************************************
         * TILEMAP & LAYERS
         *************************************/
        const map = this.make.tilemap({ key: "map_village" });
        const tilesetVillage = map.addTilesetImage("donjon_tuiles", "village");

        // Ordre d'affichage des layers
        const layerOrder = [
            "background_layer",
            "decoration_back_layer",
            "decoration2_back_layer",
            "decoration3_back_layer",
            "ladder_layer",
            "platform_layer",
            "kill_layer",
            "decoration_front_layer"
        ];

        let platformLayer = null;

        // Création et affichage des layers dans l'ordre
        layerOrder.forEach(layerName => {
            if (map.layers.some(l => l.name === layerName)) {
                const layer = map.createLayer(layerName, tilesetVillage, 0, 0);

                // Profondeur selon le type
                if (layerName === "background_layer") layer.setDepth(-2);
                else if (layerName === "decoration_back_layer" || layerName === "decoration2_back_layer" || layerName === "decoration3_back_layer") layer.setDepth(-1);
                else if (layerName === "platform_layer") {
                    layer.setDepth(0);
                    layer.setCollisionByExclusion([-1]);
                    platformLayer = layer;
                    groupe_plateformes = platformLayer;
                }
                else if (layerName === "ladder_layer") {
                    layer.setDepth(1);
                    ladderLayer = layer;
                }
                else if (layerName === "kill_layer") {
                    layer.setDepth(0);
                    layer.setVisible(true);
                    killLayer = layer;
                }
                else if (layerName === "decoration_front_layer") layer.setDepth(2);
                else layer.setDepth(0);
            }
        });

        /*************************************
         * WORLD & CAMERA
         *************************************/
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        /*************************************
         * POSITION DE DÉPART DU JOUEUR
         *************************************/
        let startX = 100, startY = 450;
        let objLayer = null;
        if (typeof map.getObjectLayer === "function") {
            objLayer = map.getObjectLayer("object_player");
        }
        if (objLayer && objLayer.objects) {
            const startObj = objLayer.objects.find(obj => obj.name === "start");
            if (startObj) {
                startX = startObj.x;
                startY = startObj.y - (startObj.height || 0) / 2;
            }
        }

        this.startX = startX;
        this.startY = startY;

        /*************************************
         * PERSONNAGE
         *************************************/
        player = this.physics.add.sprite(startX, startY, "img_perso");
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);
        player.lastDir = "droite";
        player.isAttacking = false;
        player.isInvulnerable = false;
        player.setDepth(1);
        this.cameras.main.startFollow(player);

        /*************************************
         * POTIONS (POWERUPS)
         *************************************/
        potions = this.physics.add.group();

        // Recherche robuste du calque d'objets "object_player"
        let objPotionLayer = null;
        if (typeof map.getObjectLayer === "function") {
            objPotionLayer = map.getObjectLayer("object_player");
        }
        if (!objPotionLayer && map.objects && Array.isArray(map.objects)) {
            objPotionLayer = map.objects.find(l => l.name === "object_player");
        }
        console.log("object_player layer:", objPotionLayer);

        // Fonction utilitaire pour lire les propriétés personnalisées Tiled
        function getProp(obj, prop) {
            if (!obj.properties) return undefined;
            const found = obj.properties.find(p => p.name === prop);
            return found ? found.value : undefined;
        }

        if (objPotionLayer && objPotionLayer.objects) {
            console.log("Objets du layer object_player :", objPotionLayer.objects); // <-- LOG AJOUTÉ ICI
            objPotionLayer.objects.forEach(obj => {
                let key = null;

                // Récupération des propriétés
                const name = (obj.name || "").toLowerCase();
                const type = (obj.type || "").toLowerCase();
                const item_type = (getProp(obj, "item_type") || "").toLowerCase();

                // Potion rouge (coeur)
                if (
                    type === "hearth" ||
                    (name === "item" && type === "hearth")
                ) {
                    key = "potion_red";
                }
                // Potion verte (protection)
                else if (
                    (name === "powerup" && type === "protection") ||
                    item_type === "protection_item"
                ) {
                    key = "potion_green";
                }
                // Potion violette (dead)
                else if (
                    (name === "powerup" && type === "dead") ||
                    item_type === "dead_item"
                ) {
                    key = "potion_purple";
                }

                if (key) {
                    const potion = potions.create(obj.x, obj.y - 32, key);
                    potion.potionType = key;
                    potion.setOrigin(0, 0);
                    potion.body.allowGravity = false;
                    potion.body.immovable = true;
                    potion.setDepth(10);
                }
            });
        }
        this.physics.add.overlap(player, potions, this.collectPotion, null, this);

        /*************************************
         * COLLISIONS PLAYER
         *************************************/
        if (platformLayer) {
            this.physics.add.collider(player, platformLayer);
        }

        /*************************************
         * FLÈCHES
         *************************************/
        arrows = this.physics.add.group({
            defaultKey: "fleche",
            maxSize: 20
        });
        this.physics.add.collider(arrows, platformLayer, (arrow) => {
            arrow.destroy();
        });

        this.physics.add.overlap(player, arrows, (playerSprite, arrow) => {
            if (!player.isInvulnerable) {
                arrow.destroy();
                this.hitPlayer();
            }
        });

        /*************************************
         * ENNEMIS (TILED object_player)
         *************************************/
        this.bossBars = {}; // Pour stocker la barre de vie du boss

        const objLayerEnemies = objPotionLayer;
        this.enemies = this.physics.add.group();
        if (objLayerEnemies && objLayerEnemies.objects) {
            objLayerEnemies.objects.forEach(obj => {
                let enemy = null;
                if (obj.name === "enemy_8") {
                    enemy = this.enemies.create(obj.x, obj.y, "ennemi8_walk");
                    enemy.type = 8;
                    enemy.setScale(1);
                    enemy.maxHealth = 3;
                    enemy.health = 3;
                } else if (obj.name === "enemy_9") {
                    enemy = this.enemies.create(obj.x, obj.y, "ennemi9_walk");
                    enemy.type = 9;
                    enemy.setScale(1);
                    enemy.maxHealth = 3;
                    enemy.health = 3;
                } else if (obj.name === "enemy_7") {
                    enemy = this.enemies.create(obj.x, obj.y, "ennemi7_walk");
                    enemy.type = 7;
                    enemy.setScale(1);
                    enemy.maxHealth = 3;
                    enemy.health = 3;
                } else if (obj.name === "enemy_10") {
                    enemy = this.enemies.create(obj.x, obj.y, "ennemi10_walk");
                    enemy.type = 10;
                    enemy.setScale(1.8); // Taille augmentée
                    enemy.maxHealth = 20;
                    enemy.health = 20;

                    // Barre de vie au-dessus du boss
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
                    enemy.anims.play(
                        enemy.type === 8 ? "ennemi8_walk" :
                        enemy.type === 9 ? "ennemi9_walk" :
                        enemy.type === 10 ? "ennemi10_walk" :
                        "ennemi7_walk", true
                    );
                    this.physics.add.collider(enemy, platformLayer);

                    // Tir automatique pour ennemi_9 toutes les 4 secondes
                    if (enemy.type === 9) {
                        this.time.addEvent({
                            delay: 4000,
                            loop: true,
                            callback: () => {
                                if (!enemy.isAlive) return;
                                enemy.anims.play("ennemi9_attack", true);
                                this.time.delayedCall(300, () => {
                                    const dx = enemy.body.velocity.x;
                                    const arrow = arrows.get(enemy.x, enemy.y + 10);
                                    if (arrow) {
                                        arrow.setActive(true);
                                        arrow.setVisible(true);
                                        this.physics.world.enable(arrow);
                                        arrow.body.allowGravity = false;
                                        arrow.body.setVelocityX(dx < 0 ? -200 : 200);
                                        arrow.setFlipX(dx < 0);
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }

        this.physics.add.overlap(player, this.enemies, this.enemyHitsPlayer, null, this);

        /*************************************
         * ANIMATIONS JOUEUR & ENNEMIS
         *************************************/
        if (!this.anims.exists("anim_tourne_gauche")) {
            this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
        }
        if (!this.anims.exists("anim_face_droite")) {
            this.anims.create({ key: "anim_face_droite", frames: [{ key: "img_perso", frame: 8 }], frameRate: 20 });
        }
        if (!this.anims.exists("anim_face_gauche")) {
            this.anims.create({ key: "anim_face_gauche", frames: [{ key: "img_perso", frame: 9 }], frameRate: 20 });
        }
        if (!this.anims.exists("anim_tourne_droite")) {
            this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 10, end: 17 }), frameRate: 8, repeat: -1 });
        }
        if (!this.anims.exists("anim_saut_droite")) {
            this.anims.create({ key: "anim_saut_droite", frames: this.anims.generateFrameNumbers("img_jump", { start: 6, end: 9 }), frameRate: 8, repeat: 0 });
        }
        if (!this.anims.exists("anim_saut_gauche")) {
            this.anims.create({ key: "anim_saut_gauche", frames: this.anims.generateFrameNumbers("img_jump", { start: 15, end: 19 }), frameRate: 8, repeat: 0 });
        }

        if (!this.anims.exists("attaque_droite")) {
            this.anims.create({
                key: "attaque_droite",
                frames: this.anims.generateFrameNumbers("attaque", { start: 0, end: 3 }),
                frameRate: 12,
                repeat: 0
            });
        }
        if (!this.anims.exists("attaque_gauche")) {
            this.anims.create({
                key: "attaque_gauche",
                frames: this.anims.generateFrameNumbers("attaque", { start: 4, end: 7 }),
                frameRate: 12,
                repeat: 0
            });
        }

        /*************************************
         * ANIMATIONS ENNEMIS
         *************************************/
        this.anims.create({ key: "ennemi8_walk", frames: this.anims.generateFrameNumbers("ennemi8_walk", { start: 8, end: 15 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: "ennemi8_attack", frames: this.anims.generateFrameNumbers("ennemi8_attack", { start: 6, end: 11 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: "ennemi8_dead", frames: this.anims.generateFrameNumbers("ennemi8_dead", { start: 3, end: 5 }), frameRate: 8, repeat: 0 });

        this.anims.create({ key: "ennemi9_walk", frames: this.anims.generateFrameNumbers("ennemi9_walk", { start: 7, end: 13 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: "ennemi9_attack", frames: this.anims.generateFrameNumbers("ennemi9_attack", { start: 8, end: 15 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: "ennemi9_dead", frames: this.anims.generateFrameNumbers("ennemi9_dead", { start: 5, end: 9 }), frameRate: 8, repeat: 0 });

        this.anims.create({ key: "ennemi7_walk", frames: this.anims.generateFrameNumbers("ennemi7_walk", { start: 9, end: 17 }), frameRate: 8, repeat: 8, repeat: -1 });
        this.anims.create({ key: "ennemi7_attack", frames: this.anims.generateFrameNumbers("ennemi7_attack", { start: 6, end: 11 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: "ennemi7_dead", frames: this.anims.generateFrameNumbers("ennemi7_dead", { start: 0, end: 1 }), frameRate: 8, repeat: 0 });

        this.anims.create({ key: "ennemi10_walk", frames: this.anims.generateFrameNumbers("ennemi10_walk", { start: 12, end: 23 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: "ennemi10_attack", frames: this.anims.generateFrameNumbers("ennemi10_attack", { start: 10, end: 19 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: "ennemi10_dead", frames: this.anims.generateFrameNumbers("ennemi10_dead", { start: 3, end: 5 }), frameRate: 8, repeat: 0 });

        /*************************************
         * CLAVIER
         *************************************/
        clavier = this.input.keyboard.createCursorKeys();
        this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    }

    collectPotion(player, potion) {
        if (!potion) return;
        const type = potion.potionType || "";
        potion.destroy();

        if (type === "potion_red") {
            playerLives++;
        } else if (type === "potion_green") {
            player.isInvulnerable = true;
            player.setTint(0x00ff00);
            this.time.delayedCall(10000, () => {
                player.isInvulnerable = false;
                player.clearTint();
            });
        } else if (type === "potion_purple") {
            if (!player.isInvulnerable) {
                this.hitPlayer();
            }
        }
    }

    hitPlayer() {
        if (player.isInvulnerable) return;

        playerLives--;
        console.log("Vies restantes :", playerLives);

        player.isInvulnerable = true;
        player.setTint(0xff0000);
        player.setVelocity(0, 0);

        this.time.delayedCall(200, () => {
            player.clearTint();
        });

        this.time.delayedCall(1000, () => {
            player.isInvulnerable = false;
        });

        if (playerLives <= 0) {
            console.log("GAME OVER");
            this.scene.restart();
            playerLives = 5;
        }
    }

    respawnPlayer() {
        if (player.isInvulnerable) return;

        player.isInvulnerable = true;
        playerLives--;
        console.log("Vies restantes :", playerLives);

        player.setTint(0xff0000);
        player.x = this.startX;
        player.y = this.startY;
        player.setVelocity(0, 0);

        this.time.delayedCall(1000, () => {
            player.isInvulnerable = false;
            player.clearTint();
        });

        if (playerLives <= 0) {
            console.log("GAME OVER");
            this.scene.restart();
            playerLives = 5;
        }
    }

    playerAttackEnemy(enemy) {
        if (!enemy || !enemy.isAlive) return;
        if (enemy.isBeingHit) return;

        enemy.isBeingHit = true;

        enemy.health--;
        console.log(`Ennemi ${enemy.type} touché ! Vie restante: ${enemy.health}`);

        // Mise à jour de la barre de vie si boss
        if (enemy.type === 10 && this.bossBars[enemy.id]) {
            this.bossBars[enemy.id].fg.width = 96 * Math.max(0, enemy.health) / enemy.maxHealth;
        }

        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy && enemy.clearTint) enemy.clearTint();
        });

        this.time.delayedCall(300, () => {
            if (enemy) enemy.isBeingHit = false;
        });

        if (enemy.health <= 0) {
            enemy.isAlive = false;
            enemy.setVelocityX(0);
            enemy.anims.play(
                enemy.type === 8 ? "ennemi8_dead" :
                enemy.type === 9 ? "ennemi9_dead" :
                enemy.type === 10 ? "ennemi10_dead" :
                "ennemi7_dead", true
            );
            enemy.once("animationcomplete", () => {
                if (enemy && enemy.destroy) enemy.destroy();
                // Détruit la barre de vie du boss
                if (enemy.type === 10 && this.bossBars[enemy.id]) {
                    this.bossBars[enemy.id].bg.destroy();
                    this.bossBars[enemy.id].fg.destroy();
                }
            });
        }
    }

    enemyHitsPlayer(playerSprite, enemy) {
        if (!enemy || !enemy.isAlive) return;
        if (player.isInvulnerable) return;
        if (enemy.type === 9) return;
        if (enemy.isAttacking) return;

        if (!player.body.touching.down && !player.body.blocked.down) return;

        enemy.isAttacking = true;
        enemy.setVelocityX(0);
        enemy.anims.play(
            enemy.type === 8 ? "ennemi8_attack" :
            enemy.type === 9 ? "ennemi9_attack" :
            enemy.type === 10 ? "ennemi10_attack" :
            "ennemi7_attack", true
        );

        this.time.delayedCall(300, () => {
            if (enemy && enemy.isAlive && enemy.isAttacking && !player.isInvulnerable) {
                this.hitPlayer();
            }
        });

        enemy.once("animationcomplete", () => {
            enemy.isAttacking = false;
            if (enemy && enemy.isAlive) {
                const speed = enemy.lastDir < 0 ? -50 : 50;
                enemy.setVelocityX(speed);
                enemy.anims.play(
                    enemy.type === 8 ? "ennemi8_walk" :
                    enemy.type === 9 ? "ennemi9_walk" :
                    enemy.type === 10 ? "ennemi10_walk" :
                    "ennemi7_walk", true
                );
            }
        });
    }

    update() {
        // Joueur attaque
        if (Phaser.Input.Keyboard.JustDown(this.keyAttack) && !player.isAttacking) {
            player.isAttacking = true;
            player.setVelocityX(0);

            const animKey = player.lastDir === "gauche" ? "attaque_gauche" : "attaque_droite";
            player.anims.play(animKey, true);

            this.sonSword.play();

            const hx = player.x + (player.lastDir === "droite" ? 40 : -40);
            const hy = player.y;
            const hitbox = this.add.rectangle(hx, hy, 48, 40, 0xff0000, 0);
            this.physics.add.existing(hitbox);
            hitbox.body.allowGravity = false;
            hitbox.body.setImmovable(true);

            const hitOverlap = this.physics.add.overlap(hitbox, this.enemies, (hb, enemy) => {
                this.playerAttackEnemy(enemy);
            });

            player.once('animationcomplete', (anim) => {
                if (anim.key === animKey) {
                    player.isAttacking = false;
                    if (hitOverlap && hitOverlap.destroy) hitOverlap.destroy();
                    if (hitbox && hitbox.destroy) hitbox.destroy();
                }
            });
        }

        let speed = player.isAttacking ? 0 : 160;

        if (clavier.left.isDown) {
            player.setVelocityX(-speed);
            if (player.body.blocked.down && !player.isAttacking) player.anims.play("anim_tourne_gauche", true);
            player.lastDir = "gauche";
        } else if (clavier.right.isDown) {
            player.setVelocityX(speed);
            if (player.body.blocked.down && !player.isAttacking) player.anims.play("anim_tourne_droite", true);
            player.lastDir = "droite";
        } else {
            player.setVelocityX(0);
            if (player.body.blocked.down && !player.isAttacking) {
                player.setTexture("img_perso", player.lastDir === "gauche" ? 9 : 8);
            }
        }

        // Joueur saute (son joué une seule fois au déclenchement)
        if (clavier.up.isDown && player.body.blocked.down && !wasJumpPressed) {
            player.setVelocityY(-230);
            player.anims.play(player.lastDir === "gauche" ? "anim_saut_gauche" : "anim_saut_droite", true);
            this.sonJump.stop();
            this.sonJump.play();
            wasJumpPressed = true;
        }
        if (!clavier.up.isDown) {
            wasJumpPressed = false;
        }

        // Gestion de l'échelle (ladder_layer) avec marge de détection
        let onLadder = false;
        if (ladderLayer) {
            const margin = 10;
            const tile = ladderLayer.getTileAtWorldXY(player.x, player.y + margin)
                      || ladderLayer.getTileAtWorldXY(player.x, player.y - margin)
                      || ladderLayer.getTileAtWorldXY(player.x, player.y);
            if (tile) {
                onLadder = true;
                player.body.allowGravity = false;
                player.setVelocityY(0);

                if (clavier.up.isDown) {
                    player.setVelocityY(-100);
                } else if (clavier.down.isDown) {
                    player.setVelocityY(100);
                }
            }
        }
        if (!onLadder) {
            player.body.allowGravity = true;
        }

        // Détection du kill_layer : respawn au point de départ si le joueur touche une tuile kill
        if (killLayer) {
            // On vérifie sous les pieds, au centre, à gauche et à droite
            const px = player.x;
            const py = player.y + player.height / 2;
            const left = px - player.width / 4;
            const right = px + player.width / 4;
            if (
                killLayer.hasTileAtWorldXY(px, py) ||
                killLayer.hasTileAtWorldXY(left, py) ||
                killLayer.hasTileAtWorldXY(right, py)
            ) {
                this.respawnPlayer();
            }
        }

        // Mise à jour de la barre de vie du boss (ennemi 10)
        Object.values(this.bossBars).forEach(bar => {
            const boss = bar.boss;
            if (!boss.active) {
                bar.bg.destroy();
                bar.fg.destroy();
                return;
            }
            // Positionne la barre au-dessus du boss
            bar.bg.x = boss.x;
            bar.bg.y = boss.y - boss.height * boss.scaleY;
            bar.fg.x = boss.x;
            bar.fg.y = boss.y - boss.height * boss.scaleY;
            // Met à jour la largeur de la barre rouge selon la vie
            bar.fg.width = 96 * Math.max(0, boss.health) / boss.maxHealth;
        });

        // Comportement ennemis
        this.enemies.children.iterate(e => {
            if (!e || !e.isAlive) return;
            if (e.isAttacking) return;

            if (e.body.blocked.left) {
                e.setVelocityX(50);
                e.lastDir = 1;
            } else if (e.body.blocked.right) {
                e.setVelocityX(-50);
                e.lastDir = -1;
            }

            // Correction pour la détection du sol selon la taille de l'ennemi
            const scaleX = e.scaleX || 1;
            const scaleY = e.scaleY || 1;
            const nextX = e.body.velocity.x > 0 ? e.x + (e.width * scaleX) / 2 + 2 : e.x - (e.width * scaleX) / 2 - 2;
            const nextY = e.y + (e.height * scaleY) / 2 + 1;
            const tile = groupe_plateformes.getTileAtWorldXY(nextX, nextY);
            if (!tile) {
                e.setVelocityX(-e.body.velocity.x);
                e.lastDir *= -1;
            }

            e.setFlipX(e.body.velocity.x < 0);

            if (!e.anims.isPlaying || !e.anims.currentAnim.key.includes("walk")) {
                e.anims.play(
                    e.type === 8 ? "ennemi8_walk" :
                    e.type === 9 ? "ennemi9_walk" :
                    e.type === 10 ? "ennemi10_walk" :
                    "ennemi7_walk", true
                );
            }
        });
    }
}