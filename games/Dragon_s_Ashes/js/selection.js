import * as fct from "./fonctions.js";
import Ennemi, { EnnemiTireurSimple, Boss, Chevalier } from "./ennemi.js";

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier
var groupe_plateformes;
var boutonFeu;
var groupeBullets;

// définition de la classe "selection"
export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" }); // mettre le meme nom que le nom de la classe
  }

  /***********************************************************************/
  /** FONCTION PRELOAD 
/***********************************************************************/

  /** La fonction preload est appelée une et une seule fois,
   * lors du chargement de la scene dans le jeu.
   * On y trouve surtout le chargement des assets (images, son ..)
   */
  preload() {
    const baseURL = this.sys.game.config.baseURL;
    
    this.load.setBaseURL(baseURL);

    this.load.audio("musique_jeu", "./assets/musique_jeu.ogg");
    
    // tous les assets du jeu sont placés dans le sous-répertoire src/assets/
    this.load.spritesheet("img_perso", "./assets/dragon_deplacement.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_repos_gauche", "./assets/dragon_pause_gauche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_repos_droite", "./assets/dragon_pause_droite.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_saut_droite", "./assets/dragon_saut_droite.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_saut_gauche", "./assets/dragon_saut_gauche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_tir_droite", "./assets/dragon_tir_droite.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_tir_gauche", "./assets/dragon_tir_gauche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_attaque_droite", "./assets/dragon_attaque_droite.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_attaque_gauche", "./assets/dragon_attaque_gauche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_attaque", "./assets/attaque.png", {
      frameWidth: 64,
      frameHeight: 62
    });
    this.load.spritesheet("img_magicien_droite", "./assets/magicien_droite.png", {
      frameWidth: 65,
      frameHeight: 80
    });
    this.load.spritesheet("img_magicien_gauche", "./assets/magicien_gauche.png", {
      frameWidth: 65,
      frameHeight: 80
    });
    this.load.spritesheet("img_chevalier_droite", "./assets/chevalier_droite.png", {
      frameWidth: 65,
      frameHeight: 80
    });
    this.load.spritesheet("img_chevalier_gauche", "./assets/chevalier_gauche.png", {
      frameWidth: 65,
      frameHeight: 80
    });

    this.load.spritesheet("bullet_gauche", "./assets/balle_gauche.png", {
      frameWidth: 30,
      frameHeight: 30
    });
    this.load.spritesheet("bullet_droite", "./assets/balle_droite.png", {
      frameWidth: 30,
      frameHeight: 30
    });
    this.load.spritesheet("bullet_ennemi_droite", "./assets/balle_droite_ennemi.png", {
      frameWidth: 30,
      frameHeight: 30
    });
    this.load.spritesheet("bullet_ennemi_gauche", "./assets/balle_gauche_ennemi.png", {
      frameWidth: 30,
      frameHeight: 30
    });
    this.load.spritesheet("img_boss", "./assets/boss_deplacement.png", {
      frameWidth: 100,
      frameHeight: 86
    });
    this.load.spritesheet("attaque_boss", "./assets/boss_attaque.png", {
      frameWidth: 108,
      frameHeight: 86
    });

    this.load.spritesheet("boss_attaque", "./assets/attaque_boss.png", {
      frameWidth: 50,
      frameHeight: 70
    });

    this.load.image("coeur", "./assets/heart.png");
    this.load.image("img_chest1", "./assets/chest1.png");
    this.load.image("img_chest2", "./assets/chest2.png");
    this.load.image("img_jumpBonus", "./assets/vol.png");

    // chargement tuiles de jeu
    this.load.image("background01", "./assets/background1.jpg");
    this.load.image("background02", "./assets/background2.jpg");
    this.load.image("background03", "./assets/background3.jpg");
    this.load.image("background04", "./assets/background4.jpg");
    this.load.image("Tuiles_Decors01", "./assets/TilsetdecorV1.png");
    this.load.image("Tuiles_Decors02", "./assets/tilsetdecorv2.png");
    this.load.image("Tuiles_Decors03", "./assets/tilsetdecorv3.png");

// chargement de la carte
this.load.tilemapTiledJSON("carte", "./assets/map.json");  
  }

  /***********************************************************************/
  /** FONCTION CREATE 
/***********************************************************************/

  /* La fonction create est appelée lors du lancement de la scene
   * si on relance la scene, elle sera appelée a nouveau
   * on y trouve toutes les instructions permettant de créer la scene
   * placement des peronnages, des sprites, des platesformes, création des animations
   * ainsi que toutes les instructions permettant de planifier des evenements
   */
  create() {


    this.cameras.main.fadeIn(500, 0, 0, 0);
    /*************************************
     *  CREATION DU MONDE + PLATEFORMES  *
     *************************************/

    
  const carteDuNiveau = this.add.tilemap("carte");

// chargement du jeu de tuiles
const tilesetBackground01 = carteDuNiveau.addTilesetImage("background1", "background01");
const tilesetBackground02 = carteDuNiveau.addTilesetImage("background2", "background02");
const tilesetBackground03 = carteDuNiveau.addTilesetImage("background3", "background03");
const tilesetBackground04 = carteDuNiveau.addTilesetImage("background4", "background04");
const tilesetDecors      = carteDuNiveau.addTilesetImage("Tuiles_Decors01", "Tuiles_Decors01");
const tilesetdecorsv2      = carteDuNiveau.addTilesetImage("Tuiles_Decors02", "Tuiles_Decors02");
const tilesetdecorsv3      = carteDuNiveau.addTilesetImage("Tuiles_Decors03", "Tuiles_Decors03");

const calque_background01 = carteDuNiveau.createLayer(
  "calque_background01", 
  [tilesetBackground01, tilesetBackground02, tilesetBackground03, tilesetBackground04], 
  0, // x
  0  // y
);
const calque_background02 = carteDuNiveau.createLayer("calque_background02", tilesetdecorsv2);
const calque_decors      = carteDuNiveau.createLayer("calque_decors", [tilesetDecors, tilesetdecorsv2, tilesetdecorsv3 ],0,0);
const calque_decorations      = carteDuNiveau.createLayer("calque_decorations", [tilesetdecorsv2, tilesetDecors, tilesetdecorsv3 ],0,0);
    // définition des tuiles de plateformes qui sont solides
    // utilisation de la propriété estSolide
        calque_decors.setCollisionByProperty({ estSolide: true });
        calque_decorations.setCollisionByProperty({ estSolide: true });

// Groupe unique pour tous les ennemis
this.groupeEnnemis = this.physics.add.group();

// --- Ennemis issus de la map JSON ---
const layerEnnemi = carteDuNiveau.getObjectLayer("Ennemi");
if (layerEnnemi) {
    const objetsEnnemis = layerEnnemi.objects;

    objetsEnnemis.forEach(obj => {
        let ennemi;
        const typeEnnemiProp = obj.properties.find(p => p.name === "type");
        const typeEnnemi = typeEnnemiProp ? typeEnnemiProp.value : "";

        switch (typeEnnemi) {
            case "chevalier":
                ennemi = new Chevalier(this, obj.x, obj.y, "img_chevalier_droite");
                break;
            case "magicien":
                ennemi = new EnnemiTireurSimple(this, obj.x, obj.y, "img_magicien_droite");
                break;
            case "roi":
                ennemi = new Boss(this, obj.x, obj.y, "img_boss"); // ou texture spécifique du boss
                break;
        }

        if (ennemi) {
            ennemi.calqueDecors = calque_decors; // passer le calque Tiled
            this.groupeEnnemis.add(ennemi);
        }
    });
} else {
    console.warn("⚠️ Aucun calque 'Ennemi' trouvé dans la carte !");
}

this.groupeBallesEnnemis = this.physics.add.group();

    if (!this.sound.get("musique_jeu")) {
      this.musiqueJeu = this.sound.add("musique_jeu", { loop: true, volume: 0.2 });
      this.musiqueJeu.play();
    }

    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/
    // On créée un nouveeau personnage : player
  player = this.physics.add.sprite(150, 6840, "img_perso");
  this.player = player;
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  player.direction = 'right';

  // PV et vies
  player.vies = 3;   // nombre de vies
  player.hp = 3;     // points de vie actuels
  player.invincible = false; // pour éviter les hits répétés

  // Texte affichage PV et vies
this.txtVies = this.add.text(16, 16, `Vies : ${player.vies}`, {
    fontSize: '20px',
    fill: '#ffffff'
});
this.txtPV = this.add.text(16, 40, `PV : ${player.hp}`, {
    fontSize: '20px',
    fill: '#ff0000'
});

this.peutTirer = false; // le joueur ne peut pas tirer au début


// On fixe les textes à la caméra
this.txtVies.setScrollFactor(0);
this.txtPV.setScrollFactor(0);

this.groupe_plateformes = calque_decors;


    groupeBullets = this.physics.add.group();
    // affectation de la touche A à boutonFeu
    boutonFeu = this.input.keyboard.addKey('O');

    // affectation de la touche I au corps à corps
    this.toucheAttaque = this.input.keyboard.addKey('I');

    // affectation de la touche K à l'interaction
    this.toucheK = this.input.keyboard.addKey('K');

    // instructions pour les objets surveillés en bord de monde
    this.physics.world.on("worldbounds", function(body) {
        // on récupère l'objet surveillé
        var objet = body.gameObject;
        // s'il s'agit d'une balle
        if (groupeBullets.contains(objet)) {
            // on le détruit
            objet.destroy();
        }
    });

    
// Récupérer dimensions écran
let largeur = this.cameras.main.width;
let hauteur = this.cameras.main.height;

// --- Création du popup (70% de l'écran) ---
this.popupFond = this.add.rectangle(
    largeur / 2, 
    hauteur / 2, 
    largeur * 0.7, 
    hauteur * 0.7, 
    0x000000, 
    0.8
).setScrollFactor(0);


this.popupTexte = this.add.text(
    largeur / 2, 
    hauteur / 2, 
    "Vous avez trouvé un écrit de vos ancêtres !\n\nVous pouvez maintenant cracher du feu avec O. \n\nAppuyez sur D pour fermer le coffre.\n", 
    {
        fontSize: "20px",
        fill: "#ffffff",
        align: "center",
        wordWrap: { width: largeur * 0.65 } // texte dans la zone
    }
).setOrigin(0.5).setScrollFactor(0);

// Masqué au départ
this.popupFond.setVisible(false);
this.popupTexte.setVisible(false);

this.popupActif = false;
this.popupFond.setDepth(1000);
this.popupTexte.setDepth(1001); // texte au-dessus du fond

// Bonus de saut infini
this.objetSaut = this.physics.add.staticSprite(500, 6840, "img_jumpBonus");
this.sautsInfinis = false;
// Popup
this.popupFondSaut = this.add.rectangle(
    this.cameras.main.width / 2,
    this.cameras.main.height / 2,
    this.cameras.main.width * 0.7,
    this.cameras.main.height * 0.7,
    0x000000,
    0.8
).setScrollFactor(0).setDepth(1000).setVisible(false);

this.popupTexteSaut = this.add.text(
    this.cameras.main.width / 2,
    this.cameras.main.height / 2,
    "Bienvenue dans la démo de Dragon's Ashes !\n\nPour faciliter votre découverte, vous pouvez maintenant voler en appuyant plusieurs fois sur C. \n\nAppuyez sur D pour fermer la fenêtre.\n",
    {
        fontSize: "20px",
        fill: "#ffffff",
        align: "center",
        wordWrap: { width: this.cameras.main.width * 0.65 }
    }
).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setVisible(false);

this.popupSautActif = false;

// Collision joueur ↔ bonus saut
this.physics.add.overlap(this.player, this.objetSaut, () => {
    if (!this.sautsInfinis) {
        this.sautsInfinis = true;
        this.objetSaut.destroy(); // l’objet disparaît
        this.popupFondSaut.setVisible(true);
        this.popupTexteSaut.setVisible(true);
        this.popupSautActif = true;
    }
});


this.groupeObjets = this.physics.add.group();

// Création de l’objet interactif
this.objetInteractif = this.physics.add.staticSprite(1835, 5833, "img_chest1");
this.objetEtat = 1; // état courant (1 = image1, 2 = image2)

// Créer une zone de détection autour de l’objet
this.hitboxObjet = this.add.zone(this.objetInteractif.x, this.objetInteractif.y, 50, 50);
this.physics.add.existing(this.hitboxObjet);
this.hitboxObjet.body.setAllowGravity(false);
this.hitboxObjet.body.setImmovable(true);

// Collision <-> calque Tiled 
this.physics.add.collider(player, calque_decors);
this.physics.add.collider(player, calque_decorations);
this.physics.add.collider(this.groupeEnnemis, calque_decors);

// Collision joueur <-> objets bonus
this.physics.add.overlap(player, this.groupeObjets, (playerObj, objet) => {
    objet.destroy();
    if (playerObj.hp < 3) {
        playerObj.hp++;
        this.txtPV.setText(`PV : ${playerObj.hp}`);
    }
});


  // Collisions bullets <-> ennemis
  this.physics.add.overlap(groupeBullets, this.groupeEnnemis, (bullet, ennemi) => {
    bullet.destroy();
    ennemi.hit();
  });

  // Collision joueur <-> ennemis
this.physics.add.collider(player, this.groupeEnnemis, (playerObj, ennemi) => {
    if (!playerObj.invincible) {
        // perte d'un point de vie
        playerObj.hp--;
        playerObj.invincible = true;
        playerObj.setTint(0xff0000);

        this.time.delayedCall(1500, () => {
            playerObj.clearTint();
            playerObj.invincible = false;
        });

        // Mise à jour des textes
        this.txtPV.setText(`PV : ${playerObj.hp}`);
        this.txtVies.setText(`Vies : ${playerObj.vies}`);

        // Vérifier si les PV sont épuisés
        if (playerObj.hp <= 0) {
            // perte d'une vie
            playerObj.vies--;
            this.txtVies.setText(`Vies : ${playerObj.vies}`);

            if (playerObj.vies > 0) {
                // nouvelle vie → PV réinitialisés mais pas de repositionnement
                playerObj.hp = 3;
                this.txtPV.setText(`PV : ${playerObj.hp}`);
            } else {
                // plus de vies, écran de défaite
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once("camerafadeoutcomplete", () => {
                    this.musiqueJeu.stop();
                    this.scene.start("defaite");
                });
            }
        }
    }
});

this.physics.add.overlap(player, this.groupeBallesEnnemis, (playerObj, balle) => {
    balle.destroy();
    if (!playerObj.invincible) {
        playerObj.hp--;
        playerObj.invincible = true;
        playerObj.setTint(0xff0000);

        this.time.delayedCall(1000, () => {
            playerObj.clearTint();
            playerObj.invincible = false;
        });

        this.txtPV.setText(`PV : ${playerObj.hp}`);

        if (playerObj.hp <= 0) {
            playerObj.vies--;
            this.txtVies.setText(`Vies : ${playerObj.vies}`);

            if (playerObj.vies > 0) {
                playerObj.hp = 3;
                this.txtPV.setText(`PV : ${playerObj.hp}`);
            } else {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once("camerafadeoutcomplete", () => {
                    this.scene.start("defaite");
                });
            }
        }
    }
});

this.groupeAttaques = this.physics.add.group();

// Collision attaque <-> ennemis
this.physics.add.overlap(this.groupeAttaques, this.groupeEnnemis, (hitbox, ennemi) => {
    if (!ennemi.active) return;

    // Appliquer les dégâts → seulement si pas invincible
    const avaitHP = ennemi.hp;  
    ennemi.hit();

    // Si l'ennemi a vraiment perdu des PV → knockback
    if (ennemi.active && ennemi.hp < avaitHP) {
        const directionX = (player.direction === "right") ? 1 : -1;

        const forceX = 300 * directionX;  // poussée horizontale
        const forceY = -100;              // petit effet vertical

        ennemi.setVelocity(forceX, forceY);

        // Désactiver temporairement le tir si ennemi tireur
        if (ennemi instanceof EnnemiTireurSimple && ennemi.timer) {
            ennemi.timer.paused = true;
            this.time.delayedCall(500, () => {
                if (ennemi.active && ennemi.timer) {
                    ennemi.timer.paused = false;
                }
            });
        }
    }

    // Détruire la hitbox de l’attaque
    hitbox.destroy();
});


    /***************************
     *  CREATION DES ANIMATIONS *
     ****************************/
    // dans cette partie, on crée les animations, à partir des spritesheet
    // chaque animation est une succession de frame à vitesse de défilement défini
    // une animation doit avoir un nom. Quand on voudra la jouer sur un sprite, on utilisera la méthode play()
    // creation de l'animation "anim_tourne_gauche" qui sera jouée sur le player lorsque ce dernier tourne à gauche
    this.anims.create({
      key: "anim_tourne_gauche", // key est le nom de l'animation : doit etre unique poru la scene.
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 0,
        end: 3
      }), // on prend toutes les frames de img perso numerotées de 0 à 3
      frameRate: 10, // vitesse de défilement des frames
      repeat: -1 // nombre de répétitions de l'animation. -1 = infini
    });

// Ajout des anims de repos
    this.anims.create({
        key: "anim_repos_gauche",
        frames: this.anims.generateFrameNumbers("perso_repos_gauche", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: "anim_repos_droite",
        frames: this.anims.generateFrameNumbers("perso_repos_droite", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
    });

    // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 4,
        end: 7
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
        key: "anim_saut_droite",
        frames: this.anims.generateFrameNumbers("perso_saut_droite", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: "anim_saut_gauche",
        frames: this.anims.generateFrameNumbers("perso_saut_gauche", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
    key: "anim_tir_droite",
    frames: this.anims.generateFrameNumbers("perso_tir_droite", { start: 0, end: 4 }),
    frameRate: 10,
    repeat: 0  // répétition unique
});

this.anims.create({
    key: "anim_tir_gauche",
    frames: this.anims.generateFrameNumbers("perso_tir_gauche", { start: 0, end: 4 }),
    frameRate: 10,
    repeat: 0  // répétition unique
});

this.anims.create({
    key: "anim_attaque_droite",
    frames: this.anims.generateFrameNumbers("perso_attaque_droite", { start: 0, end: 3 }),
    frameRate: 20,
    repeat: 0  // répétition unique
});

this.anims.create({
    key: "anim_attaque_gauche",
    frames: this.anims.generateFrameNumbers("perso_attaque_gauche", { start: 0, end: 3 }),
    frameRate: 20,
    repeat: 0  // répétition unique
});

this.anims.create({
    key: "anim_attaque",
    frames: this.anims.generateFrameNumbers("perso_attaque", { start: 0, end: 3 }),
    frameRate: 25,
    repeat: 0  // répétition unique
});

        // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
    this.anims.create({
      key: "magicien_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_magicien_droite", {
      }),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "magicien_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_magicien_gauche", {
      }),
      frameRate: 4,
      repeat: -1
    });
    
    this.anims.create({
      key: "chevalier_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_chevalier_droite", {
      }),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "chevalier_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_chevalier_gauche", {
      }),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "balle_tir_droite",
      frames: this.anims.generateFrameNumbers("bullet_droite", {
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "balle_tir_gauche",
      frames: this.anims.generateFrameNumbers("bullet_gauche", {
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "ennemi_tir_gauche",
      frames: this.anims.generateFrameNumbers("bullet_ennemi_gauche", {
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "ennemi_tir_droite",
      frames: this.anims.generateFrameNumbers("bullet_ennemi_droite", {
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "boss_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_boss", {
        start: 0,
        end: 6
      }),
      frameRate: 7,
      repeat: -1
    });

    this.anims.create({
      key: "boss_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_boss", {
        start: 7,
        end: 13
      }),
      frameRate: 7,
      repeat: -1
    });

    this.anims.create({
      key: "boss_attaque_droite",
      frames: this.anims.generateFrameNumbers("attaque_boss", {
        start: 0,
        end: 3
      }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: "boss_attaque_gauche",
      frames: this.anims.generateFrameNumbers("attaque_boss", {
        start: 4,
        end: 7
      }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: "attaque_boss_droite",
      frames: this.anims.generateFrameNumbers("boss_attaque", {
        start: 0,
        end: 3
      }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: "attaque_boss_gauche",
      frames: this.anims.generateFrameNumbers("boss_attaque", {
        start: 4,
        end: 7
      }),
      frameRate: 10,
      repeat: 0
    });

    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    // ceci permet de creer un clavier et de mapper des touches, connaitre l'état des touches
    clavier = this.input.keyboard.createCursorKeys();
    this.toucheSaut = this.input.keyboard.addKey('P');

    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
     ******************************************************/

    //  Collide the player and the groupe_etoiles with the groupe_plateformes
    this.physics.add.collider(player, calque_decors); 
    this.physics.world.setBounds(0, 0, 3200, 7040);
    //  ajout du champs de la caméra de taille identique à celle du monde
    this.cameras.main.setBounds(0, 0, 3200, 7040);
    // ancrage de la caméra sur le joueur
    this.cameras.main.startFollow(player);  
      
  }

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

update() {
    // --- Gestion touche K pour les popups ---
    if (Phaser.Input.Keyboard.JustDown(this.toucheK)) {
        // Fermer popup coffre actif
        if (this.popupActif) {
            this.popupFond.setVisible(false);
            this.popupTexte.setVisible(false);
            this.popupActif = false;
        }
        // Fermer popup saut actif
        else if (this.popupSautActif) {
            this.popupFondSaut.setVisible(false);
            this.popupTexteSaut.setVisible(false);
            this.popupSautActif = false;
        }
        // Ouvrir coffre si joueur est proche
        else if (this.physics.overlap(this.player, this.hitboxObjet) && this.objetEtat === 1) {
            this.objetInteractif.setTexture("img_chest2");
            this.objetEtat = 2;
            this.popupFond.setVisible(true);
            this.popupTexte.setVisible(true);
            this.popupActif = true;
            this.peutTirer = true;
        }
    }

    // --- Blocage du jeu si un popup est actif ---
    if (this.popupActif || this.popupSautActif) {
        this.player.setVelocity(0, this.player.body.velocity.y);
        const animRepos = this.player.direction === "right" ? "anim_repos_droite" : "anim_repos_gauche";
        this.player.anims.play(animRepos, true);

        // Bloquer ennemis
        this.groupeEnnemis.children.iterate((ennemi) => {
            ennemi.setVelocity(0, ennemi.body.velocity.y);
            if (ennemi instanceof EnnemiTireurSimple && ennemi.timer) {
                ennemi.timer.paused = true;
            }
        });

        return; // on bloque tout le reste tant qu’un popup est ouvert
    } else {
        // Reprise des timers des ennemis
        this.groupeEnnemis.children.iterate((ennemi) => {
            if (ennemi instanceof EnnemiTireurSimple && ennemi.timer) {
                ennemi.timer.paused = false;
            }
        });
    }

    // --- Gestion du mouvement horizontal ---
    if (clavier.left.isDown) {
        player.direction = 'left';
        player.setVelocityX(-160);
    } else if (clavier.right.isDown) {
        player.direction = 'right';
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    // --- Gestion du saut ---
    if (Phaser.Input.Keyboard.JustDown(this.toucheSaut)) {
        if (this.sautsInfinis || this.player.body.blocked.down) {
            this.player.setVelocityY(-250);
        }
    }

    // --- Mise à jour automatique des animations ---
    fct.mettreAJourAnimation(player);

    // --- Tir ---
    if (Phaser.Input.Keyboard.JustDown(boutonFeu)) {
        if (this.peutTirer) {
            fct.tirer(player, groupeBullets);
        }
    }


// --- Attaque corps à corps ---
if (Phaser.Input.Keyboard.JustDown(this.toucheAttaque)) {
    fct.attaquer(player, this.groupeAttaques);

    // Jouer l'animation selon la direction
    const animAttaque = player.direction === "right" ? "anim_attaque_droite" : "anim_attaque_gauche";
    player.anims.play(animAttaque, true);
}

    // --- Mise à jour des ennemis ---
    this.groupeEnnemis.children.iterate((ennemi) => {
        if (!ennemi.active) return;
        ennemi.update();
    });

    // --- Interaction avec objet ---
    if (Phaser.Input.Keyboard.JustDown(this.toucheK)) {
        if (this.physics.overlap(this.player, this.hitboxObjet) && this.objetEtat === 1) {
            this.objetInteractif.setTexture("img_chest2");
            this.objetEtat = 2;
        }
    }

    // --- Mise à jour des hitbox d'attaque ---
    this.groupeAttaques.children.iterate(hitbox => {
        if (hitbox.update) hitbox.update();
    });
}
}
/***********************************************************************/
/** CONFIGURATION GLOBALE DU JEU ET LANCEMENT 
/***********************************************************************/