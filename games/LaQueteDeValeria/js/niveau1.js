/***********************************************************************/
/** VARIABLES GLOBALES                                                 */
/***********************************************************************/
var player;
var clavier;
var groupe_plateformes;
var playerLives = 5; // 5 vies pour le joueur
var arrows; // Groupe de flèches
var itemsCollected = 0; // Compteur d'items collectés
var timeText; // Texte pour afficher le timer
var timeLeft = 180; // Temps restant en secondes
var son_sword; // 🔊 son de l'épée
var son_jump; // 🔊 son du saut
var isGameOver = false; // État du game over

/***********************************************************************/
/** SCÈNE SELECTION                                                    */
/***********************************************************************/
export default class niveau1 extends Phaser.Scene {
    constructor() {
        super({ key: "niveau1" });
        this.background_music = null;
        this.livesIcons = null;
        this.itemUIIcons = null;
        this.playerAttackHitbox = null;
        this.playerAttackOverlap = null;
        this.totalItemsToCollect = 0;
        // --- PRÉPARATION : Instances de son pour la robustesse ---
        this.looseSound = null;
        this.victorySound = null;
    }

    preload() {
        const baseURL = this.sys.game.config.baseURL;
        this.load.setBaseURL(baseURL);

        // Fond
        this.load.image("sky", "./assets/niveau1/sky.png");
        this.load.image("fond", "./assets/niveau1/fond.png");

        // Tilemap et tilesets
        this.load.tilemapTiledJSON("map_village", "./assets/niveau1/map_village.json");
        this.load.image("village", "./assets/niveau1/village.png");

        // Sprites joueur et animations
        this.load.spritesheet("img_perso", "./assets/niveau1/dude.png", { frameWidth: 43, frameHeight: 53 });
        this.load.spritesheet("img_jump", "./assets/niveau1/dude_jump.png", { frameWidth: 40, frameHeight: 62 });
        this.load.spritesheet("attaque", "./assets/niveau1/attack.png", { frameWidth: 96, frameHeight: 49 });

        // Ennemis
        this.load.spritesheet("ennemi1_walk", "./assets/niveau1/ennemi_1_walk.png", { frameWidth: 31, frameHeight: 48 });
        this.load.spritesheet("ennemi1_attack", "./assets/niveau1/ennemi_1_attack.png", { frameWidth: 79, frameHeight: 53 });
        this.load.spritesheet("ennemi1_dead", "./assets/niveau1/ennemi_1_dead.png", { frameWidth: 59, frameHeight: 45 });

        this.load.spritesheet("ennemi2_walk", "./assets/niveau1/ennemi_2_walk.png", { frameWidth: 40, frameHeight: 49 });
        this.load.spritesheet("ennemi2_attack", "./assets/niveau1/ennemi_2_attack.png", { frameWidth: 46, frameHeight: 50 });
        this.load.spritesheet("ennemi2_dead", "./assets/niveau1/ennemi_2_dead.png", { frameWidth: 54, frameHeight: 45 });

        this.load.spritesheet("ennemi3_walk", "./assets/niveau1/ennemi_3_walk.png", { frameWidth: 40, frameHeight: 69 });
        this.load.spritesheet("ennemi3_attack", "./assets/niveau1/ennemi_3_attack.png", { frameWidth: 91, frameHeight: 46 });
        this.load.spritesheet("ennemi3_dead", "./assets/niveau1/ennemi_3_dead.png", { frameWidth: 68, frameHeight: 66 });

        // Flèche
        this.load.image("fleche", "./assets/niveau1/fleche.png");

        // Potions
        this.load.image("potion_red", "./assets/potion_red.png");
        this.load.image("potion_green", "./assets/potion_green.png");
        this.load.image("potion_purple", "./assets/potion_purple.png");

        // Items
        this.load.image("bread", "./assets/niveau1/bread.png");
        this.load.image("cheese", "./assets/niveau1/cheese.png");
        this.load.image("fish", "./assets/niveau1/fish.png");

        // UI
        this.load.image("heart", "./assets/heart.png");
        this.load.image("game_over", "./assets/game_over.jpg");
        this.load.image("victory", "./assets/victory.jpg");

        // Sons
        this.load.audio('sword', "./assets/sword.mp3");
        this.load.audio('jump', "./assets/jump.mp3");
        this.load.audio('background_music', "./assets/niveau1/music_1.mp3");
        this.load.audio("loose_song", "./assets/loose_song.mp3");
        this.load.audio("win_song", "./assets/win_song.mp3"); // Utilisation de votre nom de fichier
    }

    create() {
        // --- CORRECTION : Réinitialisation des variables importantes au début de la scène ---
        isGameOver = false;
        playerLives = 5;
        itemsCollected = 0;
        timeLeft = 180;
        
        // Ajout des sons
        son_sword = this.sound.add('sword', { volume: 0.3 });
        son_jump = this.sound.add('jump', { volume: 4 });
        
        // Configuration de la musique de fond
        this.background_music = this.sound.add('background_music', { loop: true, volume: 0.5 });
        this.background_music.play();

        // --- CORRECTION : Création des instances de son pour éviter les problèmes de cache ---
        this.looseSound = this.sound.add('loose_song');
        this.victorySound = this.sound.add('win_song');

        // Gestion de la musique au réveil/endormissement de la scène
        this.events.on('wake', () => {
            if (this.background_music && this.background_music.isPaused) {
                this.background_music.resume();
            }
        });
        this.events.on('sleep', () => {
            if (this.background_music && this.background_music.isPlaying) {
                this.background_music.pause();
            }
        });

        // Déblocage du contexte audio
        this.input.once('pointerdown', () => {
            try {
                if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
                    this.sound.context.resume();
                }
            } catch (e) {
                console.warn("Impossible de résumer le contexte audio :", e);
            }
        });

        /*************************************
         * FOND
         *************************************/
        const tileHeight = 32;
        const numTiles = 22;
        const skyHeight = tileHeight * numTiles;
        this.add.image(0, 0, "sky").setOrigin(0, 0).setScrollFactor(0).setDisplaySize(this.scale.width, skyHeight).setDepth(-3);
        this.add.image(0, 0, "fond").setOrigin(0, 0).setScrollFactor(0.5).setDepth(-2);

        /*************************************
         * TILEMAP
         *************************************/
        const map = this.make.tilemap({ key: "map_village" });
        const tilesetVillage = map.addTilesetImage("village", "village");

        const platformLayer = map.createLayer("platform_layer", tilesetVillage, 0, 0);
        platformLayer.setCollisionByExclusion([-1]);
        platformLayer.setDepth(0);
        groupe_plateformes = platformLayer;

        map.createLayer("decoration_back_layer", tilesetVillage, 0, 0).setDepth(-1);
        map.createLayer("decoration2_back_layer", tilesetVillage, 0, 0).setDepth(-1);
        map.createLayer("decoration3_back_layer", tilesetVillage, 0, 0).setDepth(-1);
        map.createLayer("decoration_front_layer", tilesetVillage, 0, 0).setDepth(2);

        const killLayer = map.createLayer("kill_layer", tilesetVillage, 0, 0);
        killLayer.setCollisionByExclusion([-1]).setVisible(false);

        /*************************************
         * WORLD & CAMERA
         *************************************/
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        /*************************************
         * PERSONNAGE
         *************************************/
        player = this.physics.add.sprite(100, 550, "img_perso");
        player.setBounce(0.2).setCollideWorldBounds(true).setDepth(1);
        player.lastDir = "droite";
        player.isAttacking = false;
        player.isInvulnerable = false;
        player.hasProtection = false;
        this.cameras.main.startFollow(player);
        this.spawnX = 100;
        this.spawnY = 450;

        /*************************************
         * ANIMATIONS JOUEUR
         *************************************/
        if (!this.anims.exists("anim_tourne_gauche")) this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
        if (!this.anims.exists("anim_face_droite")) this.anims.create({ key: "anim_face_droite", frames: [{ key: "img_perso", frame: 8 }], frameRate: 20 });
        if (!this.anims.exists("anim_face_gauche")) this.anims.create({ key: "anim_face_gauche", frames: [{ key: "img_perso", frame: 9 }], frameRate: 20 });
        if (!this.anims.exists("anim_tourne_droite")) this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 10, end: 17 }), frameRate: 8, repeat: -1 });
        if (!this.anims.exists("anim_saut_droite")) this.anims.create({ key: "anim_saut_droite", frames: this.anims.generateFrameNumbers("img_jump", { start: 6, end: 9 }), frameRate: 8, repeat: 0 });
        if (!this.anims.exists("anim_saut_gauche")) this.anims.create({ key: "anim_saut_gauche", frames: this.anims.generateFrameNumbers("img_jump", { start: 15, end: 19 }), frameRate: 8, repeat: 0 });
        if (!this.anims.exists("attaque_droite")) this.anims.create({ key: "attaque_droite", frames: this.anims.generateFrameNumbers("attaque", { start: 0, end: 3 }), frameRate: 12, repeat: 0 });
        if (!this.anims.exists("attaque_gauche")) this.anims.create({ key: "attaque_gauche", frames: this.anims.generateFrameNumbers("attaque", { start: 4, end: 7 }), frameRate: 12, repeat: 0 });

        /*************************************
         * ANIMATIONS ENNEMIS
         *************************************/
        this.anims.create({ key: "ennemi1_walk", frames: this.anims.generateFrameNumbers("ennemi1_walk", { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: "ennemi1_attack", frames: this.anims.generateFrameNumbers("ennemi1_attack", { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: "ennemi1_dead", frames: this.anims.generateFrameNumbers("ennemi1_dead", { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
        this.anims.create({ key: "ennemi2_walk", frames: this.anims.generateFrameNumbers("ennemi2_walk", { start: 10, end: 17 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: "ennemi2_attack", frames: this.anims.generateFrameNumbers("ennemi2_attack", { start: 3, end: 5 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: "ennemi2_dead", frames: this.anims.generateFrameNumbers("ennemi2_dead", { start: 4, end: 7 }), frameRate: 8, repeat: 0 });
        this.anims.create({ key: "ennemi3_walk", frames: this.anims.generateFrameNumbers("ennemi3_walk", { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: "ennemi3_attack", frames: this.anims.generateFrameNumbers("ennemi3_attack", { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: "ennemi3_dead", frames: this.anims.generateFrameNumbers("ennemi3_dead", { start: 0, end: 3 }), frameRate: 8, repeat: 0 });

        /*************************************
         * CLAVIER
         *************************************/
        clavier = this.input.keyboard.createCursorKeys();
        this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
        this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

        /*************************************
         * COLLISIONS & OVERLAPS
         *************************************/
        this.physics.add.collider(player, groupe_plateformes);
        this.physics.add.collider(player, killLayer, this.respawnPlayer, null, this);
        
        arrows = this.physics.add.group({ defaultKey: "fleche", maxSize: 20 });
        this.physics.add.collider(arrows, groupe_plateformes, (arrow) => arrow.destroy());
        this.physics.add.overlap(player, arrows, (playerSprite, arrow) => {
            arrow.destroy();
            this.hitPlayer();
        });

        /*************************************
         * OBJETS DE LA MAP (TILED)
         *************************************/
        this.potions = this.physics.add.group();
        this.enemies = this.physics.add.group();
        
        const objLayer = map.getObjectLayer("object_player");
        if (objLayer && objLayer.objects) {
            objLayer.objects.forEach(obj => {
                // Potions
                const propMap = {};
                if (obj.properties && Array.isArray(obj.properties)) {
                    obj.properties.forEach(p => propMap[p.name] = p.value);
                }
                const rawType = (obj.type || propMap.type || obj.name || "").toLowerCase().trim();
                let potionKey = null;
                if (rawType.includes("heart")) potionKey = "potion_red";
                else if (rawType.includes("protection")) potionKey = "potion_green";
                else if (rawType.includes("dead")) potionKey = "potion_purple";
                
                if (potionKey) {
                    let potion = this.potions.create(obj.x, obj.y, potionKey);
                    potion.potionType = rawType;
                    potion.setOrigin(0, 1).setDepth(1);
                    potion.body.setAllowGravity(false).setImmovable(true);
                    potion.body.setSize(potion.width * 0.7, potion.height * 0.6, true);
                }
                
                // Ennemis
                let enemy = null;
                if (obj.name === "enemy_1") enemy = this.enemies.create(obj.x, obj.y, "ennemi1_walk").setData('type', 1);
                else if (obj.name === "enemy_2") enemy = this.enemies.create(obj.x, obj.y, "ennemi2_walk").setData('type', 2);
                else if (obj.name === "enemy_3") enemy = this.enemies.create(obj.x, obj.y, "ennemi3_walk").setData('type', 3);
                
                if (enemy) {
                    const type = enemy.getData('type');
                    enemy.setCollideWorldBounds(true).setVelocityX(-50).setDepth(1);
                    enemy.health = 2;
                    enemy.isAlive = true;
                    enemy.isAttacking = false;
                    enemy.isBeingHit = false;
                    enemy.lastDir = -1;
                    enemy.anims.play(`ennemi${type}_walk`, true);
                    this.physics.add.collider(enemy, groupe_plateformes);
                    
                    if (type === 2) this.setupArcherAttack(enemy);
                }
            });
        } else {
            console.error("Le calque d'objets 'object_player' est manquant ou vide !");
        }
        
        this.physics.add.overlap(player, this.potions, this.collectPotion, null, this);
        this.physics.add.overlap(player, this.enemies, this.enemyHitsPlayer, null, this);

        /*************************************
         * ITEMS À COLLECTER
         *************************************/
        this.fallingItems = this.physics.add.group();
        const itemsConfig = [
            { type: 'bread', x: map.widthInPixels * 0.15, y: 100 },
            { type: 'fish', x: map.widthInPixels * 0.75, y: 100 },
            { type: 'cheese', x: map.widthInPixels * 0.95, y: 100 }
        ];
        this.totalItemsToCollect = itemsConfig.length;
        itemsConfig.forEach(config => {
            const item = this.fallingItems.create(config.x, config.y, config.type);
            item.itemType = config.type;
            item.setCollideWorldBounds(true).setBounce(0.4, 0.2).setDepth(1).setVelocityY(50);
        });
        this.physics.add.collider(this.fallingItems, groupe_plateformes);
        this.physics.add.overlap(player, this.fallingItems, this.collectFallingItem, null, this);

        /*************************************
         * HUD
         *************************************/
        const textStyle = { fontSize: '24px', fill: '#fff', fontFamily: 'Arial', stroke: '#000', strokeThickness: 4 };
        const screenWidth = this.cameras.main.width;
        const screenCenterX = this.cameras.main.centerX;
        const padding = 16;

        // Vies (reste en haut à gauche)
        this.livesIcons = this.add.group();
        this.updateLivesDisplay();

        // Items en haut à droite
        const itemKeys = ['bread', 'fish', 'cheese'];
        let currentX = screenWidth - padding;
        this.itemUIIcons = this.add.group();
        // On positionne les icônes de droite à gauche pour faciliter le placement
        itemKeys.slice().reverse().forEach((itemKey) => {
             this.itemUIIcons.create(currentX, 30, itemKey)
                .setScrollFactor(0).setDepth(100).setOrigin(1, 0.5).setData('itemType', itemKey);
             currentX -= 40; // On décale vers la gauche pour l'icône suivant
        });
        
        // On place le label "Objets:" à gauche du dernier icône placé
        this.add.text(currentX - 5, 30, 'Objets:', { ...textStyle, fontSize: '20px' })
            .setScrollFactor(0).setDepth(100).setOrigin(1, 0.5);

        // Timer en haut au centre
        timeText = this.add.text(screenCenterX, 20, `Temps: ${timeLeft}s`, textStyle)
            .setScrollFactor(0).setDepth(100).setOrigin(0.5, 0); // setOrigin(0.5, 0) pour centrer horizontalement
            
        this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });
    }
    
    setupArcherAttack(enemy) {
        const shoot = () => {
            // Si l'ennemi n'existe plus ou est mort, on arrête la boucle de tir.
            if (!enemy.active || !enemy.isAlive) {
                return;
            }

            // On vérifie qu'il n'est pas déjà en train d'attaquer pour éviter les bugs
            if (!enemy.isAttacking) {
                enemy.isAttacking = true;
                enemy.setVelocityX(0); 
                enemy.anims.play("ennemi2_attack", true);

                // On tire la flèche après un court délai (le temps que l'animation se lance)
                this.time.delayedCall(300, () => {
                    if (!enemy.isAlive) return; // Vérification de sécurité
                    const arrow = arrows.get(enemy.x, enemy.y - 2);
                    if (arrow) {
                        const direction = enemy.flipX ? -1 : 1;
                        arrow.setActive(true).setVisible(true).setScale(1.5).setFlipX(enemy.flipX);
                        this.physics.world.enable(arrow);
                        arrow.body.allowGravity = false;
                        arrow.body.setVelocityX(direction * 200);
                        this.time.delayedCall(2000, () => { if (arrow.active) arrow.destroy(); });
                    }
                });

                // Une fois l'animation d'attaque terminée...
                enemy.once("animationcomplete", (anim) => {
                    if (anim.key === "ennemi2_attack" && enemy.isAlive) {
                        enemy.isAttacking = false;
                        enemy.anims.play("ennemi2_walk", true);
                        enemy.setVelocityX(enemy.lastDir < 0 ? -50 : 50);
                    }
                });
            }
            
            // --- CORRECTION : On planifie le PROCHAIN tir dans un délai aléatoire ---
            const randomDelay = Phaser.Math.Between(1000, 5000);
            this.time.delayedCall(randomDelay, shoot); // Appel récursif pour la boucle
        };

        // On lance la boucle de tir après un premier délai aléatoire pour ne pas que tous les archers tirent en même temps
        const initialRandomDelay = Phaser.Math.Between(2000, 5000);
        this.time.delayedCall(initialRandomDelay, shoot);
    }

    showFeedbackText(message, x, y, color = '#ffffff') {
        const textStyle = {
            fontFamily: 'Arial',
            fontSize: '20px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 4
        };
        let feedbackText = this.add.text(x, y, message, textStyle)
            .setOrigin(0.5)
            .setDepth(101)
            .setAlpha(0);
        this.tweens.add({
            targets: feedbackText,
            alpha: 1,
            y: y - 40,
            duration: 500,
            ease: 'Power2',
            yoyo: true,
            hold: 2000,
            onComplete: () => {
                feedbackText.destroy();
            }
        });
    }

    collectPotion(playerSprite, potion) {
        const type = (potion.potionType || "").toLowerCase();
        const messageX = player.x;
        const messageY = player.y - 50;

        if (type.includes("dead") && (player.isInvulnerable || player.hasProtection)) {
            return;
        }

        potion.destroy();

        if (type.includes("heart")) {
            playerLives++;
            this.updateLivesDisplay();
            this.showFeedbackText('+1 Vie !', messageX, messageY, '#33cc33');
        } else if (type.includes("protection")) {
            player.hasProtection = true;
            player.setTint(0x00ff00);
            this.showFeedbackText('+5s Invincible !', messageX, messageY, '#00ff00');
            this.time.delayedCall(5000, () => {
                player.hasProtection = false;
                player.clearTint();
            });
        } else if (type.includes("dead")) {
            // --- CORRECTION : Logique de mort instantanée ---
            if (playerLives <= 1) {
                playerLives = 0;
                this.updateLivesDisplay();
                this.showFeedbackText('Poison mortel !', messageX, messageY, '#ff4444');
                this.triggerGameOver("Empoisonné !");
            } else {
                this.hitPlayer();
                this.showFeedbackText('-1 Vie !', messageX, messageY, '#ff4444');
            }
        }
    }

    collectFallingItem(playerSprite, item) {
        const itemType = item.itemType;
        item.disableBody(true, true);
        itemsCollected++;

        this.itemUIIcons.getChildren().forEach(icon => {
            if (icon.getData('itemType') === itemType) {
                this.tweens.add({ targets: icon, alpha: 0, scale: 0.5, duration: 300, onComplete: () => icon.destroy() });
            }
        });

        // --- CORRECTION : Condition de victoire robuste ---
        if (itemsCollected >= this.totalItemsToCollect) {
            this.triggerVictory();
        }
    }

    updateLivesDisplay() {
        this.livesIcons.clear(true, true);
        for (let i = 0; i < playerLives; i++) {
            this.livesIcons.create(16 + (i * 40), 30, 'heart')
                .setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);
        }
    }

    hitPlayer() {
        if (player.isInvulnerable || player.hasProtection || isGameOver) return;
        playerLives--;
        this.updateLivesDisplay();
        if (playerLives <= 0) {
            this.triggerGameOver("Plus de vies !");
            return;
        }
        player.isInvulnerable = true;
        player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            if (player.hasProtection) player.setTint(0x00ff00);
            else player.clearTint();
        });
        this.time.delayedCall(1000, () => player.isInvulnerable = false);
    }

    respawnPlayer() {
        if (isGameOver) return;
        if (player.isInvulnerable) {
            player.setPosition(this.spawnX, this.spawnY).setVelocity(0, 0);
            return;
        }

        // --- CORRECTION : Logique de mort instantanée en tombant ---
        if (playerLives <= 1) {
            playerLives = 0;
            this.updateLivesDisplay();
            this.triggerGameOver("Tombé dans le vide !");
            return;
        }

        playerLives--;
        this.updateLivesDisplay();

        player.setPosition(this.spawnX, this.spawnY).setVelocity(0, 0);
        player.isInvulnerable = true;
        player.setTint(0xff0000);
        
        this.time.delayedCall(1000, () => {
            player.isInvulnerable = false;
            if (player.hasProtection) player.setTint(0x00ff00);
            else player.clearTint();
        });
    }

    endScene(imageKey, soundKey, delay = 4000) {
        if (isGameOver) {
            return;
        }
        isGameOver = true;

        if (this.background_music && this.background_music.isPlaying) this.background_music.stop();
        
        // --- CORRECTION : Utilisation des instances de son ---
        if (soundKey === 'loose_song' && this.looseSound) {
            this.looseSound.play({ volume: 0.5 });
        } else if (soundKey === 'win_song' && this.victorySound) {
            this.victorySound.play({ volume: 0.5 });
        }

        this.physics.pause();
        player.anims.stop();
        player.setVisible(false);

        // --- MODIFICATION : Affichage direct sans fondu ---
        this.add.rectangle(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0x000000
        ).setScrollFactor(0).setDepth(999);

        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, imageKey)
            .setScrollFactor(0).setDepth(1000);
        
        this.time.delayedCall(delay, () => {
            this.scene.start("selection");
        });
    }

    triggerVictory() {
        this.endScene('victory', 'win_song');
    }

    triggerGameOver(message) {
        this.endScene('game_over', 'loose_song');
    }

    endPlayerAttack() {
        if (!player.isAttacking) return;
        player.isAttacking = false;
        if (this.playerAttackOverlap) this.playerAttackOverlap.destroy();
        if (this.playerAttackHitbox) this.playerAttackHitbox.destroy();
    }

    playerAttackEnemy(hitbox, enemy) {
        if (!enemy.isAlive || enemy.isBeingHit) return;
        enemy.isBeingHit = true;
        enemy.health--;
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if(enemy.active) enemy.clearTint();
        });
        this.time.delayedCall(300, () => {
            if(enemy.active) enemy.isBeingHit = false;
        });
        if (enemy.health <= 0) {
            enemy.isAlive = false;
            enemy.setVelocityX(0);
            enemy.anims.play(`ennemi${enemy.getData('type')}_dead`, true);
            enemy.once("animationcomplete", () => enemy.destroy());
        }
    }

    enemyHitsPlayer(playerSprite, enemy) {
        const type = enemy.getData('type');
        if (!enemy.isAlive || player.isInvulnerable || player.hasProtection || type === 2 || enemy.isAttacking) return;
        enemy.isAttacking = true;
        enemy.setVelocityX(0);
        enemy.anims.play(`ennemi${type}_attack`, true);
        this.time.delayedCall(300, () => {
            if (enemy.isAlive && enemy.isAttacking && !isGameOver) this.hitPlayer();
        });
        enemy.once("animationcomplete", () => {
            enemy.isAttacking = false;
            if (enemy.isAlive) {
                enemy.setVelocityX(enemy.lastDir < 0 ? -50 : 50);
                enemy.anims.play(`ennemi${type}_walk`, true);
            }
        });
    }

    updateTimer() {
        if (timeLeft > 0 && !isGameOver) {
            timeLeft--;
            timeText.setText(`Temps: ${timeLeft}s`);
            if (timeLeft === 0) {
                this.triggerGameOver("Temps écoulé !");
            }
        }
    }

    update() {
        if (isGameOver) {
            player.setVelocityX(0);
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
            this.scene.switch("selection");
            return;
        }

        // --- GESTION DE L'ATTAQUE ---
        if (Phaser.Input.Keyboard.JustDown(this.keyAttack) && !player.isAttacking) {
            player.isAttacking = true;
            player.setVelocityX(0);
            try { son_sword.play(); } catch (e) { console.warn("Impossible de jouer le son d'épée:", e); }

            const animKey = player.lastDir === "gauche" ? "attaque_gauche" : "attaque_droite";
            player.anims.play(animKey, true);

            const hx = player.x + (player.lastDir === "droite" ? 40 : -40);
            this.playerAttackHitbox = this.add.rectangle(hx, player.y, 48, 40);
            this.physics.add.existing(this.playerAttackHitbox, true);
            this.playerAttackOverlap = this.physics.add.overlap(this.playerAttackHitbox, this.enemies, this.playerAttackEnemy, null, this);
            
            player.once('animationcomplete', (anim) => {
                if (anim.key === animKey) this.endPlayerAttack();
            });
        }

        // --- GESTION DES DÉPLACEMENTS & ANIMATIONS ---
        if (!player.isAttacking) {
            const speed = 160;
            if (clavier.left.isDown) {
                player.setVelocityX(-speed);
                player.lastDir = "gauche";
            } else if (clavier.right.isDown) {
                player.setVelocityX(speed);
                player.lastDir = "droite";
            } else {
                player.setVelocityX(0);
            }

            if (player.body.blocked.down) {
                if (player.body.velocity.x !== 0) {
                    player.anims.play(player.lastDir === 'gauche' ? 'anim_tourne_gauche' : 'anim_tourne_droite', true);
                } else {
                    player.anims.stop();
                    player.setTexture("img_perso", player.lastDir === "gauche" ? 9 : 8);
                }
            } else {
                player.anims.play(player.lastDir === 'gauche' ? 'anim_saut_gauche' : 'anim_saut_droite');
            }
        }

        // --- GESTION DU SAUT ---
        if (Phaser.Input.Keyboard.JustDown(this.keyJump) && player.body.blocked.down) {
            this.endPlayerAttack();
            player.setVelocityY(-230);
            try { son_jump.play(); } catch (e) { console.warn("Impossible de jouer le son de saut:", e); }
        }

        // --- IA DES ENNEMIS ---
        this.enemies.children.iterate(e => {
            if (!e.isAlive || e.isAttacking) return;
            
            if (e.body.blocked.left) {
                e.setVelocityX(50);
                e.lastDir = 1;
            } else if (e.body.blocked.right) {
                e.setVelocityX(-50);
                e.lastDir = -1;
            }

            const nextX = e.body.velocity.x > 0 ? e.x + e.width / 2 + 2 : e.x - e.width / 2 - 2;
            const tile = groupe_plateformes.getTileAtWorldXY(nextX, e.y + e.height / 2 + 1);
            if (!tile) {
                e.setVelocityX(-e.body.velocity.x);
                e.lastDir *= -1;
            }

            e.setFlipX(e.body.velocity.x < 0);
        });
    }
}