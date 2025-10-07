import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES GLOBALES                                                 */
/***********************************************************************/
var player;
var clavier;
var groupe_plateformes;
var playerLives = 5; // 5 vies pour le joueur
var arrows; // Groupe de flèches
var livesText; // Texte pour afficher les vies
var itemsText; // Texte pour afficher les items collectés
var itemsCollected = 0; // Compteur d'items collectés
var timeText; // Texte pour afficher le timer
var timeLeft = 120; // Temps restant en secondes
var son_sword; // 🔊 son de l'épée
var son_jump; // 🔊 son du saut
var background_music; // 🎵 musique de fond
var isGameOver = false; // État du game over

/***********************************************************************/
/** SCÈNE SELECTION                                                    */
/***********************************************************************/
export default class niveau1 extends Phaser.Scene {
    constructor() {
        super({ key: "niveau1" });
    }

    init() {
        // Relancer la musique si la scène est reprise via scene.switch
        try {
            if (background_music && !background_music.isPlaying) {
                background_music.play();
            }
        } catch (e) {
            try { if (background_music) background_music.play(); } catch (__) { }
        }
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

        this.load.image("bread", "./assets/niveau1/bread.png");
        this.load.image("cheese", "./assets/niveau1/cheese.png");
        this.load.image("fish", "./assets/niveau1/fish.png");

        // Image de game over
        this.load.image("game_over", "./assets/game_over.jpg");

        // Sons -- charge mp3 + ogg pour compatibilité navigateurs
        this.load.audio('sword', ['./assets/sword.mp3', './assets/sword.ogg']);
        this.load.audio('jump', ['./assets/jump.mp3']);
        this.load.audio('background_music', ['./assets/niveau1/music_1.mp3']);
    }

    create() {
        fct.doNothing();
        fct.doAlsoNothing();


        // Ajout des sons au gestionnaire de sons (variables globales)
        son_sword = this.sound.add('sword', {
            volume: 0.3  // Réduction du volume à 30%
        });
        son_jump = this.sound.add('jump');
        
        // Configuration et démarrage de la musique de fond
        background_music = this.sound.add('background_music', {
            loop: true,
            volume: 0.5
        });
        background_music.play();

        // Si la scène est reprise via scene.switch, relancer la musique
        this.events.on('wake', () => {
                if (background_music && !background_music.isPlaying) {
                    background_music.play();
                }
        });

        // Si la scène est mise en sleep, couper la musique
        this.events.on('sleep', () => {
            try { if (background_music && background_music.isPlaying) background_music.stop(); } catch (e) {}
        });

        // Débloquer le contexte audio (certaines versions de navigateur mettent le contexte en 'suspended' avant interaction)
        this.input.once('pointerdown', () => {
            try {
                if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
                    this.sound.context.resume();
                    console.log("Audio context resumed par pointerdown");
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

        this.backgroundSky = this.add.image(0, 0, "sky")
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDisplaySize(this.scale.width, skyHeight)
            .setDepth(-3);

        this.backgroundFond = this.add.image(0, 0, "fond")
            .setOrigin(0, 0)
            .setScrollFactor(0.5)
            .setDepth(-2);

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
        killLayer.setCollisionByExclusion([-1]);
        killLayer.setVisible(false);
        killLayer.setDepth(0);

        /*************************************
         * WORLD & CAMERA
         *************************************/
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        /*************************************
         * PERSONNAGE
         *************************************/
        player = this.physics.add.sprite(100, 450, "img_perso");
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);
        player.lastDir = "droite";
        player.isAttacking = false;
        player.isInvulnerable = false;
        player.hasProtection = false; // Protection active ou non
        player.setDepth(1);
        this.cameras.main.startFollow(player);

    // point de spawn du joueur (utilisé pour respawn propre)
    this.spawnX = 100;
    this.spawnY = 450;

        /*************************************
         * ANIMATIONS JOUEUR
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
        this.anims.create({ key: "ennemi1_walk", frames: this.anims.generateFrameNumbers("ennemi1_walk", { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: "ennemi1_attack", frames: this.anims.generateFrameNumbers("ennemi1_attack", { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: "ennemi1_dead", frames: this.anims.generateFrameNumbers("ennemi1_dead", { start: 0, end: 3 }), frameRate: 8, repeat: 0 });

        this.anims.create({ key: "ennemi2_walk", frames: this.anims.generateFrameNumbers("ennemi2_walk", { start: 10, end: 17 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: "ennemi2_attack", frames: this.anims.generateFrameNumbers("ennemi2_attack", { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
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
    // Touche K: revenir au menu selection et couper la musique
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

        /*************************************
         * COLLISIONS PLAYER
         *************************************/
        this.physics.add.collider(player, groupe_plateformes);
        this.physics.add.collider(player, killLayer, () => {
            this.respawnPlayer();
        }, null, this);

        /*************************************
         * FLÈCHES
         *************************************/
        arrows = this.physics.add.group({
            defaultKey: "fleche",
            maxSize: 20
        });
        this.physics.add.collider(arrows, groupe_plateformes, (arrow) => {
            if (arrow && arrow.destroy) arrow.destroy();
        });

        this.physics.add.overlap(player, arrows, (playerSprite, arrow) => {
            if (arrow && arrow.destroy) arrow.destroy();
            this.hitPlayer();
        });

        /*************************************
         * POTIONS (objets collectables) - robustifié pour Tiled
         *************************************/
        this.potions = this.physics.add.group();

        // Cherche le calque d'objets de la map (nom "object_player" ou fallback sur le premier calque d'objets)
        let objLayer = map.getObjectLayer("object_player");
        if (!objLayer) {
            // fallback : essayer map.objects (phaser peut exposer les calques objets ici)
            if (map.objects && map.objects.length) {
                objLayer = map.objects.find(l => l.name === "object_player") || map.objects.find(l => /object/i.test(l.name)) || map.objects[0];
            } else if (map.layers && map.layers.length) {
                // parfois les calques objets sont dans map.layers — on tente une recherche prudente
                objLayer = map.layers.find(l => /object/i.test(l.name)) || null;
            }
        }

        console.log("Object layer trouvé:", objLayer ? objLayer.name || "(objet trouvé)" : null);

        if (objLayer && objLayer.objects && objLayer.objects.length) {
            console.log("Nombre d'objets dans le layer:", objLayer.objects.length);

            objLayer.objects.forEach(obj => {
                // Récupérer les properties (si présentes) dans un objet pour plus de flexibilité
                const propMap = {};
                if (obj.properties && Array.isArray(obj.properties)) {
                    obj.properties.forEach(p => {
                        propMap[p.name] = p.value;
                    });
                }

                // Déterminer le "type" de l'objet (tolérance sur name/type/properties)
                let rawType = (obj.type || propMap.type || propMap.potionType || obj.name || "").toString().toLowerCase().trim();

                // Choix de la key d'image selon le type (tolérances orthographiques)
                let potionKey = null;
                if (rawType.includes("heart") || rawType.includes("hearth") || rawType.includes("vie") || rawType.includes("coeur")) {
                    potionKey = "potion_red";
                } else if (rawType.includes("protection") || rawType.includes("shield") || rawType.includes("protect")) {
                    potionKey = "potion_green";
                } else if (rawType.includes("dead") || rawType.includes("poison") || rawType.includes("deadly")) {
                    potionKey = "potion_purple";
                } else {
                    // Si l'objet n'est pas une potion (par ex. spawn point), on skip
                    return;
                }

                // Calcul de la position : on crée au x,y fournis par Tiled.
                // Tiled place souvent l'anchor en bas pour les objets images — setOrigin(0,1) colle bien.
                const x = obj.x || 0;
                const y = obj.y || 0;

                let potion = this.potions.create(x, y, potionKey);
                potion.potionType = rawType; // stocke le type (en minuscule)
                potion.setOrigin(0, 1); // alignement Tiled bottom-left
                potion.setDepth(1);

                // Physique : ne pas subir la gravité et être immobile
                if (potion.body) {
                    potion.body.setAllowGravity(false);
                    potion.body.setImmovable(true);

                    // Ajuster la hitbox pour éviter collisions gênantes
                    // On réduit la hitbox pour plus de tolérance sur l'overlap.
                    try {
                        potion.body.setSize(Math.max(8, potion.width * 0.7), Math.max(8, potion.height * 0.6));
                        potion.body.setOffset(Math.round((potion.width - potion.body.width) / 2), Math.round((potion.height - potion.body.height)));
                    } catch (e) {
                        // certains builds peuvent avoir des bodies différent — on ignore en cas d'erreur
                    }
                }

                console.log(`✓ Potion créée : type='${rawType}' key='${potionKey}' x:${x} y:${y}`);
            });
        } else {
            console.error("Le calque object_player (ou équivalent) n'a pas été trouvé ou est vide !");
        }

        // Collision joueur avec potions
        this.physics.add.overlap(player, this.potions, this.collectPotion, null, this);

        /*************************************
         * ITEMS À COLLECTER
         *************************************/
        this.fallingItems = this.physics.add.group();
        
        // Position des items répartis sur la map
        const itemsConfig = [
            { type: 'bread', x: map.widthInPixels * 0.15, y: 100 },  // Plus proche du début (15%)
            { type: 'fish', x: map.widthInPixels * 0.75, y: 100 },    // Vers la droite (75%)
            { type: 'cheese', x: map.widthInPixels * 0.95, y: 100 }  // Presque à la fin de la map (95%)
        ];
        
        // Création des items qui tombent
        itemsConfig.forEach(config => {
            const item = this.fallingItems.create(config.x, config.y, config.type);
            item.itemType = config.type;
            item.setCollideWorldBounds(true);
            item.setBounceY(0.4); // Rebond modéré
            item.setBounceX(0.2); // Léger rebond horizontal
            item.setDepth(1);
            // Active la gravité pour qu'ils tombent
            item.body.setAllowGravity(true);
            item.setVelocityY(50); // Vitesse initiale de chute
        });
        
        // Collision des objets tombants avec les plateformes
        this.physics.add.collider(this.fallingItems, groupe_plateformes);
        
        // Collision joueur avec objets tombants
        this.physics.add.overlap(player, this.fallingItems, this.collectFallingItem, null, this);

        /*************************************
         * ENNEMIS (TILED object_player)
         *************************************/
        this.enemies = this.physics.add.group();
        if (objLayer && objLayer.objects && objLayer.objects.length) {
            objLayer.objects.forEach(obj => {
                // On réutilise objLayer : certains objets sont potions, d'autres ennemis (selon leur name)
                let enemy = null;
                if (obj.name === "enemy_1") {
                    enemy = this.enemies.create(obj.x, obj.y, "ennemi1_walk");
                    enemy.type = 1;
                } else if (obj.name === "enemy_2") {
                    enemy = this.enemies.create(obj.x, obj.y, "ennemi2_walk");
                    enemy.type = 2;
                } else if (obj.name === "enemy_3") {
                    enemy = this.enemies.create(obj.x, obj.y, "ennemi3_walk");
                    enemy.type = 3;
                }

                if (enemy) {
                    enemy.setCollideWorldBounds(true);
                    enemy.setVelocityX(-50);
                    enemy.health = 2; // 2 coups pour tuer
                    enemy.isAlive = true;
                    enemy.isAttacking = false;
                    enemy.isBeingHit = false;
                    enemy.setTint(0xffffff); // Couleur normale
                    enemy.setDepth(1);
                    enemy.lastDir = -1;
                    enemy.anims.play(`ennemi${enemy.type}_walk`, true);
                    this.physics.add.collider(enemy, groupe_plateformes);

                    if (enemy.type === 2) {
                        this.time.addEvent({
                            delay: 4000,
                            loop: true,
                            callback: () => {
                                if (!enemy.isAlive) return;
                                enemy.anims.play("ennemi2_attack", true);
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
         * HUD - COMPTEUR DE VIES
         *************************************/
        livesText = this.add.text(16, 16, `Vies: ${playerLives}`, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 4
        });
        livesText.setScrollFactor(0);
        livesText.setDepth(100);

        // Ajout du compteur d'items
        itemsText = this.add.text(16, 50, `Items: ${itemsCollected}`, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 4
        });
        itemsText.setScrollFactor(0);
        itemsText.setDepth(100);

        // Ajout du timer
        timeText = this.add.text(16, 84, `Temps: ${timeLeft}s`, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 4
        });
        timeText.setScrollFactor(0);
        timeText.setDepth(100);

        // Timer qui décrémente toutes les secondes
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    collectPotion(playerSprite, potion) {
        if (!potion) return;

        // Récupération du type (on compare en mode permissif)
        const type = (potion.potionType || "").toString().toLowerCase();

        // Détruire la potion dès le ramassage
        potion.destroy();

        if (type.includes("heart") || type.includes("hearth") || type.includes("vie") || type.includes("coeur")) {
            // Ajoute une vie
            playerLives++;
            console.log("Vie gagnée ! Vies:", playerLives);
            this.updateLivesDisplay();

        } else if (type.includes("protection") || type.includes("protect") || type.includes("shield")) {
            // Active la protection pendant 10 secondes
            player.hasProtection = true;
            player.setTint(0x00ff00); // Teinte verte
            console.log("Protection activée pour 10 secondes !");

            this.time.delayedCall(10000, () => {
                player.hasProtection = false;
                player.clearTint();
                console.log("Protection terminée !");
            });

        } else if (type.includes("dead") || type.includes("poison")) {
            // Fait perdre une vie
            console.log("Potion empoisonnée !");
            this.hitPlayer();
        } else {
            // Type inconnu : log pour debug
            console.log("Potion ramassée (type inconnu) :", type);
        }
    }

    collectFallingItem(playerSprite, item) {
        if (!item) return;

        // Désactiver l'objet (le rendre invisible et non-physique)
        item.disableBody(true, true);

        // Incrémenter et mettre à jour le compteur d'items
        itemsCollected++;
        if (itemsText) {
            itemsText.setText(`Items: ${itemsCollected}`);
        }

        // Déterminer l'effet selon le type d'image
        const itemType = item.itemType;

        if (itemType === 'potion_red') {
            // Potion rouge = +1 vie
            playerLives++;
            console.log("Vie gagnée ! Vies:", playerLives);
            this.updateLivesDisplay();
        } else if (itemType === 'potion_green') {
            // Potion verte = protection temporaire
            player.hasProtection = true;
            player.setTint(0x00ff00);
            console.log("Protection activée pour 10 secondes !");

            this.time.delayedCall(10000, () => {
                player.hasProtection = false;
                player.clearTint();
                console.log("Protection terminée !");
            });
        } else if (itemType === 'potion_purple') {
            // Potion violette = perte d'une vie
            console.log("Objet empoisonné !");
            this.hitPlayer();
        }

        // Vérification de la victoire si tous les items sont collectés
        if (this.fallingItems.countActive(true) === 0) {
            console.log("Tous les items ont été collectés !");
        }
    }

    updateLivesDisplay() {
        if (livesText) {
            livesText.setText(`Vies: ${playerLives}`);
        }
    }

    hitPlayer() {
        if (player.isInvulnerable || player.hasProtection) return;

        playerLives--;
        console.log("Vies restantes :", playerLives);
        this.updateLivesDisplay();

        player.isInvulnerable = true;
        player.setTint(0xff0000);

        this.time.delayedCall(200, () => {
            if (!player.hasProtection) {
                player.clearTint();
            } else {
                player.setTint(0x00ff00); // Remet la teinte verte si protection active
            }
        });

        this.time.delayedCall(1000, () => {
            player.isInvulnerable = false;
        });

        if (playerLives <= 0) {
            console.log("GAME OVER");
            
            // Couper la musique de fond si présente
            try { if (background_music && background_music.isPlaying) background_music.stop(); } catch(e) { console.warn('Erreur en stoppant la musique:', e); }

            // Afficher l'image de game over au centre de l'écran
            const gameOverImage = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'game_over')
                .setScrollFactor(0)
                .setDepth(1000);
            
                // Attendre 2 secondes avant de retourner au menu de sélection
                this.time.delayedCall(2000, () => {
                    this.scene.start("selection");
                    playerLives = 5;
                    itemsCollected = 0;  // Réinitialisation du compteur d'items
                });
        }
    }

    respawnPlayer() {
        // Si le joueur n'existe pas, rien à faire
        if (!player) return;

        // Si déjà invulnérable, on ne déclenche pas un second hit
        if (player.isInvulnerable) {
            // Positionne quand même le joueur au spawn pour éviter qu'il reste dans la zone de kill
            player.setPosition(this.spawnX || 100, this.spawnY || 450);
            player.setVelocity(0, 0);
            return;
        }

        // Enlève une vie
        playerLives = Math.max(0, playerLives - 1);
        this.updateLivesDisplay();

        // Repositionne le joueur au spawn
        player.setPosition(this.spawnX || 100, this.spawnY || 450);
        player.setVelocity(0, 0);

        // Donne une courte invulnérabilité pour éviter dégâts répétés
        player.isInvulnerable = true;
        player.setTint(0xff0000);
        this.time.delayedCall(1000, () => {
            player.isInvulnerable = false;
            if (!player.hasProtection) player.clearTint();
            else player.setTint(0x00ff00);
        });

        // Si les vies sont à 0, déclenche le game over via hitPlayer() qui gère game over global
        if (playerLives <= 0) {
            this.hitPlayer();
        }
    }

    playerAttackEnemy(enemy) {
        if (!enemy || !enemy.isAlive) return;
        if (enemy.isBeingHit) return;

        enemy.isBeingHit = true;
        enemy.health--;
        console.log(`Ennemi ${enemy.type} touché ! Vie restante: ${enemy.health}`);

        // Feedback visuel des dégâts
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy && enemy.clearTint) {
                // Change la couleur selon les PV restants
                if (enemy.health === 1) {
                    enemy.setTint(0xff6666); // Rouge pâle quand blessé
                } else {
                    enemy.clearTint();
                }
            }
        });

        this.time.delayedCall(300, () => {
            if (enemy) enemy.isBeingHit = false;
        });

        if (enemy.health <= 0) {
            enemy.isAlive = false;
            enemy.setVelocityX(0);
            // Vérifie que l'animation existe avant de la jouer
            const animKey = `ennemi${enemy.type}_dead`;
            try {
                if (enemy.anims && enemy.anims.play) {
                    enemy.anims.play(animKey, true);
                    enemy.once("animationcomplete", () => {
                        if (enemy && enemy.destroy) {
                            enemy.destroy();
                        }
                    });
                } else {
                    // Si pas d'animation possible, détruit directement
                    if (enemy && enemy.destroy) {
                        enemy.destroy();
                    }
                }
            } catch (error) {
                console.warn(`Erreur animation mort ennemi ${enemy.type}:`, error);
                if (enemy && enemy.destroy) {
                    enemy.destroy();
                }
            }
        }
    }

    enemyHitsPlayer(playerSprite, enemy) {
        if (!enemy || !enemy.isAlive) return;
        if (player.isInvulnerable || player.hasProtection) return;
        if (enemy.type === 2) return;
        if (enemy.isAttacking) return;

        enemy.isAttacking = true;
        enemy.setVelocityX(0);
        enemy.anims.play(`ennemi${enemy.type}_attack`, true);

        this.time.delayedCall(300, () => {
            if (enemy && enemy.isAlive && enemy.isAttacking) {
                this.hitPlayer();
            }
        });

        enemy.once("animationcomplete", () => {
            enemy.isAttacking = false;
            if (enemy && enemy.isAlive) {
                const speed = enemy.lastDir < 0 ? -50 : 50;
                enemy.setVelocityX(speed);
                enemy.anims.play(`ennemi${enemy.type}_walk`, true);
            }
        });
    }

    updateTimer() {
        if (timeLeft > 0) {
            timeLeft--;
            timeText.setText(`Temps: ${timeLeft}s`);

            if (timeLeft === 0) {
                console.log("Temps écoulé !");
                
                // Couper la musique de fond si présente
                try { if (background_music && background_music.isPlaying) background_music.stop(); } catch(e) { console.warn('Erreur en stoppant la musique:', e); }

                // Afficher l'image de game over au centre de l'écran
                const gameOverImage = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'game_over')
                    .setScrollFactor(0)
                    .setDepth(1000);
                
                // Attendre 2 secondes avant de retourner au menu de sélection
                this.time.delayedCall(2000, () => {
                    this.scene.start("selection");
                    playerLives = 5;
                    itemsCollected = 0;
                    timeLeft = 120;
                });
            }
        }
    }

    update() {

        // Si on appuie sur K, couper la musique et retourner à la scène de sélection
        if (this.keyK && Phaser.Input.Keyboard.JustDown(this.keyK)) {
            try { if (background_music && background_music.isPlaying) background_music.stop(); } catch(e) { console.warn('Erreur en stoppant la musique:', e); }
            this.scene.switch("selection");
            return; // évite d'exécuter le reste de l'update après le switch
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyAttack) && !player.isAttacking) {
            player.isAttacking = true;
            player.setVelocityX(0);

            // 🔊 jouer le son de l'épée si chargé
            try {
                if (son_sword) son_sword.play();
            } catch (e) {
                console.warn("Impossible de jouer le son d'épée:", e);
            }

            const animKey = player.lastDir === "gauche" ? "attaque_gauche" : "attaque_droite";
            player.anims.play(animKey, true);

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

        if (this.keyJump.isDown && player.body.blocked.down) {
            player.setVelocityY(-230);
            player.anims.play(player.lastDir === "gauche" ? "anim_saut_gauche" : "anim_saut_droite", true);
            
            // Jouer le son du saut
            try {
                if (son_jump) son_jump.play();
            } catch (e) {
                console.warn("Impossible de jouer le son de saut:", e);
            }
        }

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

            const nextX = e.body.velocity.x > 0 ? e.x + e.width / 2 + 2 : e.x - e.width / 2 - 2;
            const nextY = e.y + e.height / 2 + 1;
            const tile = groupe_plateformes.getTileAtWorldXY(nextX, nextY);
            if (!tile) {
                e.setVelocityX(-e.body.velocity.x);
                e.lastDir *= -1;
            }

            e.setFlipX(e.body.velocity.x < 0);

            if (!e.anims.isPlaying || !e.anims.currentAnim.key.includes("walk")) {
                e.anims.play(`ennemi${e.type}_walk`, true);
            }
        });
    }
}
