import * as fct from "./fonctions.js";
import Ennemi, { EnnemiTireurSimple, Boss } from "./ennemi.js";

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
    
    // tous les assets du jeu sont placés dans le sous-répertoire src/assets/
    this.load.image("img_ciel", "./assets/sky.png");
    this.load.image("img_plateforme", "./assets/platform.png");
    this.load.spritesheet("img_perso", "./assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    this.load.image("bullet", "./assets/balle.png");  
    this.load.image("coeur", "./assets/heart.png");
    this.load.image("img_chest1", "./assets/chest1.png");
    this.load.image("img_chest2", "./assets/chest2.png");
    this.load.image("img_jumpBonus", "./assets/vol.png");

    // chargement tuiles de jeu
    this.load.image("Fond", "./assets/tuilesJeu.png");

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

    /*************************************
     *  CREATION DU MONDE + PLATEFORMES  *
     *************************************/

    
  const carteDuNiveau = this.add.tilemap("carte");

// chargement du jeu de tuiles
        const tileset = carteDuNiveau.addTilesetImage(
          "tuiles_de_jeu",
          "Fond"
        ); 
        const calque_background = carteDuNiveau.createLayer(
          "calque_background",
          tileset
        );

    // On ajoute une simple image de fond, le ciel, au centre de la zone affichée (400, 300)
    // Par défaut le point d'ancrage d'une image est le centre de cette derniere
    

    // la création d'un groupes permet de gérer simultanément les éléments d'une meme famille
    //  Le groupe groupe_plateformes contiendra le sol et deux platesformes sur lesquelles sauter
    // notez le mot clé "staticGroup" : le static indique que ces élements sont fixes : pas de gravite,
    // ni de possibilité de les pousser.
    groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_plateformes = groupe_plateformes;
    // une fois le groupe créé, on va créer les platesformes , le sol, et les ajouter au groupe groupe_plateformes

    // l'image img_plateforme fait 400x32. On en met 2 à coté pour faire le sol
    // la méthode create permet de créer et d'ajouter automatiquement des objets à un groupe
    // on précise 2 parametres : chaque coordonnées et la texture de l'objet, et "voila!"
    groupe_plateformes.create(200, 584, "img_plateforme");
    groupe_plateformes.create(600, 584, "img_plateforme");

    //  on ajoute 3 platesformes flottantes
    groupe_plateformes.create(600, 450, "img_plateforme");
    groupe_plateformes.create(50, 300, "img_plateforme");
    groupe_plateformes.create(750, 270, "img_plateforme");


    /****************************
     *  Ajout des portes   *
     ****************************/
    this.porte1 = this.physics.add.staticSprite(600, 414, "img_porte1");
    this.porte2 = this.physics.add.staticSprite(50, 264, "img_porte2");
    this.porte3 = this.physics.add.staticSprite(750, 234, "img_porte3");



    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/
    // On créée un nouveeau personnage : player
  player = this.physics.add.sprite(100, 450, "img_perso");
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
    "Salut mon vier", 
    {
        fontSize: "22px",
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
this.objetSaut = this.physics.add.staticSprite(600, 500, "img_jumpBonus");
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
    "Vous pouvez maintenant sauter indéfiniment !",
    {
        fontSize: "22px",
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

 // Groupe d'ennemis
 this.groupeEnnemis = this.physics.add.group();

// Ennemi simple
let ennemi1 = new Ennemi(this, 600, 420, "img_perso");
this.groupeEnnemis.add(ennemi1);

// Ennemi tireur
this.ennemiTireur = new EnnemiTireurSimple(this, 400, 420, "img_perso");
this.groupeEnnemis.add(this.ennemiTireur);

this.boss = new Boss(this, 700, 420, "img_perso");
this.groupeEnnemis.add(this.boss);

this.groupeObjets = this.physics.add.group();

// Création de l’objet interactif
this.objetInteractif = this.physics.add.staticSprite(400, 500, "img_chest1");
this.objetEtat = 1; // état courant (1 = image1, 2 = image2)

// Créer une zone de détection autour de l’objet
this.hitboxObjet = this.add.zone(this.objetInteractif.x, this.objetInteractif.y, 50, 50);
this.physics.add.existing(this.hitboxObjet);
this.hitboxObjet.body.setAllowGravity(false);
this.hitboxObjet.body.setImmovable(true);



// Collision joueur <-> objets bonus
this.physics.add.overlap(player, this.groupeObjets, (playerObj, objet) => {
    objet.destroy();
    if (playerObj.hp < 3) {
        playerObj.hp++;
        this.txtPV.setText(`PV : ${playerObj.hp}`);
    }
});

  // Collisions ennemis <-> plateformes
  this.physics.add.collider(this.groupeEnnemis, groupe_plateformes);

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

        this.time.delayedCall(1000, () => {
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
                // plus de vies, recommencer le jeu
                this.scene.restart();
            }
        }
    }
});

this.physics.add.overlap(player, this.ennemiTireur.balles, (playerObj, balle) => {
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
                // nouvelle vie → PV réinitialisés
                playerObj.hp = 3;
                this.txtPV.setText(`PV : ${playerObj.hp}`);
            } else {
                this.scene.restart();
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

    // creation de l'animation "anim_tourne_face" qui sera jouée sur le player lorsque ce dernier n'avance pas.
    this.anims.create({
      key: "anim_face",
      frames: [{ key: "img_perso", frame: 4 }],
      frameRate: 20
    });

    // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 5,
        end: 8
      }),
      frameRate: 10,
      repeat: -1
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
    this.physics.add.collider(player, groupe_plateformes);
    this.physics.world.setBounds(0, 0, 1280, 3648);
    //  ajout du champs de la caméra de taille identique à celle du monde
    this.cameras.main.setBounds(0, 0, 1280, 3648);
    // ancrage de la caméra sur le joueur
    this.cameras.main.startFollow(player);  
      
  }

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

update() {

    // --- Gestion touche K pour les popups ---
    if (Phaser.Input.Keyboard.JustDown(this.toucheK)) {
        // Si popup coffre actif → fermer
        if (this.popupActif) {
            this.popupFond.setVisible(false);
            this.popupTexte.setVisible(false);
            this.popupActif = false;
        }
        // Si popup saut actif → fermer
        else if (this.popupSautActif) {
            this.popupFondSaut.setVisible(false);
            this.popupTexteSaut.setVisible(false);
            this.popupSautActif = false;
        }
        // Sinon, si joueur interagit avec coffre encore fermé
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
        this.player.anims.play("anim_face", true);

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

    // --- Gestion du saut avec la touche P ---
    if (Phaser.Input.Keyboard.JustDown(this.toucheSaut)) {
        if (this.sautsInfinis || this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    if (this.toucheSaut.isDown && this.player.body.touching.down) {
        this.player.setVelocityY(-330);
    }

    // ---- CONTROLES NORMAUX GAUCHE/DROITE ----
    if (clavier.left.isDown) {
        player.direction = 'left';
        player.setVelocityX(-160);
        player.anims.play("anim_tourne_gauche", true);
    } else if (clavier.right.isDown) {
        player.direction = 'right';
        player.setVelocityX(160);
        player.anims.play("anim_tourne_droite", true);
    } else {
        player.setVelocityX(0);
        player.anims.play("anim_face");
    }

    // --- Gestion des portes ---
    if (Phaser.Input.Keyboard.JustDown(clavier.space)) {
        if (this.physics.overlap(player, this.porte1))
            this.scene.switch("niveau1");
        if (this.physics.overlap(player, this.porte2))
            this.scene.switch("niveau2");
        if (this.physics.overlap(player, this.porte3))
            this.scene.switch("niveau3");
    }

    // --- Tir ---
    if (Phaser.Input.Keyboard.JustDown(boutonFeu)) {
        if (this.peutTirer) {
            fct.tirer(player, groupeBullets);
        } else {
            fct.doNothing();
        }
    }

    // --- Attaque corps à corps ---
    if (Phaser.Input.Keyboard.JustDown(this.toucheAttaque)) {
        fct.attaquer(player, this.groupeAttaques);
    }

    // --- Mise à jour des ennemis ---
    this.groupeEnnemis.children.iterate((ennemi) => {
        if (!ennemi.active) return;
        ennemi.update(); 
    });

    // --- Interaction avec objet ---
    if (Phaser.Input.Keyboard.JustDown(this.toucheK)) {
        if (this.physics.overlap(this.player, this.hitboxObjet)) {
            if (this.objetEtat === 1) {
                this.objetInteractif.setTexture("img_chest2");
                this.objetEtat = 2;
            }
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