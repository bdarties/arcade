import * as fct from "./fonctions.js";
import Inventory from "./inventory.js";

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier
var groupe_plateformes;

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
    this.load.image("niv2_bg", "./assets/bg_2.png");
    this.load.image("niv3_bg", "./assets/bg_3.png");
    this.load.image("img_plateforme", "./assets/platform.png");
    this.load.spritesheet("img_perso", "./assets/dude.png", {
      frameWidth: 256,
      frameHeight: 256
    });
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
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
      fct.doNothing();
      fct.doAlsoNothing();

    /*************************************
     *  CREATION DU MONDE + PLATEFORMES  *
     *************************************/

    // On ajoute une simple image de fond, le ciel, au centre de la zone affichée (400, 300)
    // Par défaut le point d'ancrage d'une image est le centre de cette derniere
    this.add.image(640, 365, "img_ciel");

    // la création d'un groupes permet de gérer simultanément les éléments d'une meme famille
    //  Le groupe groupe_plateformes contiendra le sol et deux platesformes sur lesquelles sauter
    // notez le mot clé "staticGroup" : le static indique que ces élements sont fixes : pas de gravite,
    // ni de possibilité de les pousser.
    groupe_plateformes = this.physics.add.staticGroup();
    // une fois le groupe créé, on va créer les platesformes , le sol, et les ajouter au groupe groupe_plateformes


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

    //  propriétées physiqyes de l'objet player :
    player.setCollideWorldBounds(true); // le player se cognera contre les bords du monde

    // Saut simulé (axe Z)
    player.z = 0;
    player.vz = 0;

    // Ombre sous le joueur
    player.shadow = this.add.ellipse(player.x, player.y + 20, 32, 12, 0x000000, 0.3);
    player.shadow.setDepth(-1);

    /***************************
     *  CREATION DES ANIMATIONS *
     ****************************/
    // dans cette partie, on crée les animations, à partir des spritesheet
    // chaque animation est une succession de frame à vitesse de défilement défini
    // une animation doit avoir un nom. Quand on voudra la jouer sur un sprite, on utilisera la méthode play()
    // creation de l'animation "anim_tourne_gauche" qui sera jouée sur le player lorsque ce dernier tourne à gauche
    // this.anims.create({
    //   key: "anim_tourne_gauche", // key est le nom de l'animation : doit etre unique poru la scene.
    //   frames: this.anims.generateFrameNumbers("img_perso", {
    //     start: 0,
    //     end: 3
    //   }), // on prend toutes les frames de img perso numerotées de 0 à 3
    //   frameRate: 10, // vitesse de défilement des frames
    //   repeat: -1 // nombre de répétitions de l'animation. -1 = infini
    // });

    // // creation de l'animation "anim_tourne_face" qui sera jouée sur le player lorsque ce dernier n'avance pas.
    // this.anims.create({
    //   key: "anim_face",
    //   frames: [{ key: "img_perso", frame: 4 }],
    //   frameRate: 20
    // });

    // // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
    // this.anims.create({
    //   key: "anim_tourne_droite",
    //   frames: this.anims.generateFrameNumbers("img_perso", {
    //     start: 5,
    //     end: 8
    //   }),
    //   frameRate: 10,
    //   repeat: -1
    // });

    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    // ceci permet de creer un clavier et de mapper des touches, connaitre l'état des touches
    clavier = this.input.keyboard.createCursorKeys();
    // Ajout de la touche O
    clavier.O = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);

    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
     ******************************************************/

    //  Collide the player and the groupe_etoiles with the groupe_plateformes
    this.physics.add.collider(player, groupe_plateformes);

      //==========================================
  // Gestion de l'inventaire
  //==========================================
      this.input.keyboard.on("keydown-I", () => {
      if (this.scene.isPaused("selection")) {
        // si le jeu est déjà en pause → on ferme l'inventaire
        this.scene.stop("Inventory");
        this.scene.resume("selection");
      } else {
        // sinon on ouvre l'inventaire
        this.scene.launch("Inventory");
        this.scene.pause("selection");
      }
    });

    //==========================================
    // clé
    //==========================================
    this.keyItem = this.physics.add.sprite(300, 500, "img_key");
    this.keyItem.setInteractive();
    this.keyItem.setData("type", "clé"); // Ou autre propriété utile

    // Rendu physique statique s’il ne doit pas bouger
    this.keyItem.body.setAllowGravity(false);
    this.keyItem.body.setImmovable(true);

    // Optionnel : overlap pour détection proximité joueur
    this.physics.add.overlap(player, this.keyItem, () => {
      // Affiche un texte ou icône "Appuyez sur E pour ramasser"
    }, null, this);
  }

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

  update() {
    // Jumps
    if (Phaser.Input.Keyboard.JustDown(clavier.space) && player.z === 0) {
      player.vz = 8;
    }
    player.z += player.vz;
    if (player.z > 0) {
      player.vz -= 0.5;
    } else {
      player.z = 0;
      player.vz = 0;
    }
    player.setScale(1 + player.z * 0.01);
    

    // Mouvements
    if (clavier.left.isDown) {
      player.setVelocityX(-90);
      player.anims.play("anim_tourne_gauche", true);
    } else if (clavier.right.isDown) {
      player.setVelocityX(90);
      player.anims.play("anim_tourne_droite", true);
    } else {
      player.setVelocityX(0);
      player.anims.play("anim_face");
    }

    if (clavier.down.isDown) {
      player.setVelocityY(90);
    } else if (clavier.up.isDown) {
      player.setVelocityY(-90);
    } else {
      player.setVelocityY(0);
    }
if (Phaser.Input.Keyboard.JustDown(clavier.O)) {
  if (this.physics.overlap(player, this.keyItem)) {
    const inventoryScene = this.scene.get("Inventory");
    if (inventoryScene.addItem(this.keyItem.getData("type"))) {
      this.keyItem.destroy();
      console.log("Objet ramassé et ajouté à l’inventaire");
    } else {
      console.log("Inventaire plein !");
    }
  }

  // Toujours ta gestion portes
  if (this.physics.overlap(player, this.porte1))
    this.scene.switch("niveau1");
  if (this.physics.overlap(player, this.porte2))
    this.scene.switch("niveau2");
  if (this.physics.overlap(player, this.porte3))
    this.scene.switch("niveau3");
}
}
}

/***********************************************************************/
/** CONFIGURATION GLOBALE DU JEU ET LANCEMENT 
/***********************************************************************/
