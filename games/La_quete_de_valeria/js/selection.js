import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES GLOBALES                                                 */
/***********************************************************************/
var player;
var clavier;
var groupe_plateformes;

/***********************************************************************/
/** SCÈNE SELECTION                                                    */
/***********************************************************************/
export default class selection extends Phaser.Scene {
    constructor() {
        super({ key: "selection" });
    }

    preload() {
        const baseURL = this.sys.game.config.baseURL;
        this.load.setBaseURL(baseURL);

        // Fond
        this.load.image("sky", "./assets/sky.png");
        this.load.image("fond", "./assets/fond.png");

        // Tilemap et tilesets
        this.load.tilemapTiledJSON("map_village", "./src/map_village.json");
        this.load.image("village", "./src/village.png");

        // Sprites joueur et animations
        this.load.spritesheet("img_perso", "./assets/dude.png", { frameWidth: 43, frameHeight: 53 });
        this.load.spritesheet("img_jump", "./assets/jump.png", { frameWidth: 40, frameHeight: 62 });

        // Sprite attaque unique
        this.load.spritesheet("attaque", "./assets/attack.png", { frameWidth: 96, frameHeight: 49 });

        // Portes
        this.load.image("img_porte1", "./assets/door1.png");
        this.load.image("img_porte2", "./assets/door2.png");
        this.load.image("img_porte3", "./assets/door3.png");
    }

    create() {
        fct.doNothing();
        fct.doAlsoNothing();

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
        player.setDepth(1);

        this.cameras.main.startFollow(player);

        /*************************************
         * ANIMATIONS BASE
         *************************************/
        this.anims.create({ key: "anim_tourne_gauche", frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
        this.anims.create({ key: "anim_face_droite", frames: [{ key: "img_perso", frame: 8 }], frameRate: 20 });
        this.anims.create({ key: "anim_face_gauche", frames: [{ key: "img_perso", frame: 9 }], frameRate: 20 });
        this.anims.create({ key: "anim_tourne_droite", frames: this.anims.generateFrameNumbers("img_perso", { start: 10, end: 17 }), frameRate: 5, repeat: -1 });
        this.anims.create({ key: "anim_saut_droite", frames: this.anims.generateFrameNumbers("img_jump", { start: 6, end: 9 }), frameRate: 5, repeat: 0 });
        this.anims.create({ key: "anim_saut_gauche", frames: this.anims.generateFrameNumbers("img_jump", { start: 15, end: 19 }), frameRate: 5, repeat: 0 });

        /*************************************
         * ANIMATION ATTAQUE UNIQUE
         *************************************/
        this.anims.create({
            key: "attaque_anim",
            frames: this.anims.generateFrameNumbers("attaque", { start: 0, end: 3 }),
            frameRate: 10,
            repeat: 0
        });

        /*************************************
         * CLAVIER
         *************************************/
        clavier = this.input.keyboard.createCursorKeys();
        this.keyAttack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        /*************************************
         * COLLISIONS
         *************************************/
        this.physics.add.collider(player, groupe_plateformes);
        this.physics.add.collider(player, killLayer, () => {
            console.log("Le joueur est mort !");
            player.setPosition(100, 450);
        }, null, this);

        /*************************************
         * EVENT FIN D'ANIMATION
         *************************************/
        player.on("animationcomplete", (anim) => {
            if (anim.key === "attaque_anim") {
                player.isAttacking = false;
                // Utilisation de setTexture pour éviter le freeze
                if (player.lastDir === "gauche") {
                    player.setTexture("img_perso", 9);  // frame gauche
                } else {
                    player.setTexture("img_perso", 8);  // frame droite
                }
            }
        });
    }

    update() {
        if (player.isAttacking) {
            player.setVelocityX(0);
            return;
        }

        /*************************************
         * DÉPLACEMENT
         *************************************/
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
                if (player.lastDir === "gauche") player.setTexture("img_perso", 9);
                else player.setTexture("img_perso", 8);
            }
        }

        /*************************************
         * SAUT
         *************************************/
        if (clavier.up.isDown && player.body.blocked.down) {
            player.setVelocityY(-235);
            if (player.lastDir === "gauche") player.anims.play("anim_saut_gauche", true);
            else player.anims.play("anim_saut_droite", true);
        }

        /*************************************
         * ATTAQUE UNIQUE (P)
         *************************************/
        if (Phaser.Input.Keyboard.JustDown(this.keyAttack) && !player.isAttacking) {
            player.isAttacking = true;
            player.anims.play("attaque_anim", true);
        }

        /*************************************
         * PORTES
         *************************************/
        if (Phaser.Input.Keyboard.JustDown(clavier.space)) {
            if (this.physics.overlap(player, this.porte1)) this.scene.switch("niveau1");
            if (this.physics.overlap(player, this.porte2)) this.scene.switch("niveau2");
            if (this.physics.overlap(player, this.porte3)) this.scene.switch("niveau3");
        }
    }
}