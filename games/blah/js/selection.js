
import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';


/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier
var QKey;
var DKey;
var groupe_plateformes;
var musique_de_fond;
var click;

var score=0;
var zone_texte_score;


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
    // tous les assets du jeu sont placés dans le sous-répertoire assets/
    this.load.image("img_ciel", "assets/stade.jpg");
    this.load.image("img_plateforme", "assets/platform.png");
    this.load.image("quitter", "assets/quitter.png");
    this.load.spritesheet("Jousset", "assets/Jousset.png", {
      frameWidth: 64,
      frameHeight: 96
    });
    this.load.spritesheet("mika", "assets/mika.png", {
      frameWidth: 64,
      frameHeight: 96
    });
    
    this.load.spritesheet("abdellah", "assets/Abdellah.png", {
      frameWidth: 64,
      frameHeight: 96
    });
    this.load.spritesheet("meyer", "assets/meyer.png", {
      frameWidth: 64,
      frameHeight: 96
    });
    this.load.spritesheet("darties", "assets/darties.png", {
      frameWidth: 64,
      frameHeight: 96
    });
    
    this.load.image("img_porte1", "assets/porte1.png");
    this.load.image("img_porte2", "assets/porte2.png");
    this.load.image("img_porte3", "assets/porte3.png");
    this.load.image("img_porte4", "assets/porte4.png");
    this.load.audio('click', 'assets/click.mp3');  
this.load.audio('back', 'assets/background.mp3');
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
    musique_de_fond = this.sound.add('back'); 
  
    musique_de_fond.play();
    musique_de_fond.play({ loop: true })
    click = this.sound.add('click'); 
  
    
    // On ajoute une simple image de fond, le ciel, au centre de la zone affichée (400, 300)
    // Par défaut le point d'ancrage d'une image est le centre de cette derniere
    this.add.image(400, 300, "img_ciel");
    this.add.text(170, 80, "JEUX OLYMPIQUES", {
      fontFamily: "Stencil",
      fontSize: "39pt",
      fontWeight: 'bold', // mettre en gras
  color: '#000000' // couleur noire
    });
    this.add.text(300, 130, "DE L'EPF", {
      fontFamily: "Stencil",
      fontSize: "39pt",
      fontWeight: 'bold', // mettre en gras
  color: '#000000' // couleur noire
    });
    // la création d'un groupes permet de gérer simultanément les éléments d'une meme famille
    //  Le groupe groupe_plateformes contiendra le sol et deux platesformes sur lesquelles sauter
    // notez le mot clé "staticGroup" : le static indique que ces élements sont fixes : pas de gravite,
    // ni de possibilité de les pousser.
    groupe_plateformes = this.physics.add.staticGroup();
    // une fois le groupe créé, on va créer les platesformes , le sol, et les ajouter au groupe groupe_plateformes
   
    // l'image img_plateforme fait 400x32. On en met 2 à coté pour faire le sol
    // la méthode create permet de créer et d'ajouter automatiquement des objets à un groupe
    // on précise 2 parametres : chaque coordonnées et la texture de l'objet, et "voila!"
    groupe_plateformes.create(200, 584, "img_plateforme");
    groupe_plateformes.create(600, 584, "img_plateforme");

    //  on ajoute 3 platesformes flottantes
    groupe_plateformes.create(600, 520, "img_plateforme");
    groupe_plateformes.create(110, 440, "img_plateforme");
    groupe_plateformes.create(700, 370, "img_plateforme");
    groupe_plateformes.create(60, 270, "img_plateforme");
    /****************************
     *  Ajout des portes   *
     ****************************/
    this.porte1 = this.physics.add.staticSprite(670, 455, "img_porte1").setScale(0.7);
    this.porte2 = this.physics.add.staticSprite(90, 375, "img_porte2").setScale(0.7);
    this.porte3 = this.physics.add.staticSprite(710, 305, "img_porte3").setScale(0.7);
    this.porte4 = this.physics.add.staticSprite(50, 205, "img_porte4").setScale(0.7);
    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/

    // On créée un nouveeau personnage : player
    if (this.game.config.skin === 1) {
      player = this.physics.add.sprite(100, 450, "Jousset");
  } else if (this.game.config.skin === 2) {
      player = this.physics.add.sprite(100, 450, "abdellah");
    } else if (this.game.config.skin === 3) {
      player = this.physics.add.sprite(100, 450, "meyer");
    } else if (this.game.config.skin === 4) {
      player = this.physics.add.sprite(100, 450, "darties");
    } else if (this.game.config.skin === 5) {
      player = this.physics.add.sprite(100, 450, "mika");
    }
    //  propriétées physiqyes de l'objet player :
    player.setBounce(0.2); // on donne un petit coefficient de rebond
    player.setCollideWorldBounds(true); // le player se cognera contre les bords du monde

    /***************************
     *  CREATION DES ANIMATIONS *
     ****************************/
    // dans cette partie, on crée les animations, à partir des spritesheet
    // chaque animation est une succession de frame à vitesse de défilement défini
    // une animation doit avoir un nom. Quand on voudra la jouer sur un sprite, on utilisera la méthode play()
    // creation de l'animation "anim_tourne_gauche" qui sera jouée sur le player lorsque ce dernier tourne à gauche
    let spritesheetName = "Jousset"; // Par défaut, utilisez le spritesheet pour la skin 1
if (this.game.config.skin === 2) {
    spritesheetName = "abdellah"; // Utilisez le spritesheet pour la skin 2 si sélectionné
} else if (this.game.config.skin === 3) {
    spritesheetName = "meyer"; // Utilisez le spritesheet pour la skin 3 si sélectionnée
} else if (this.game.config.skin === 4) {
    spritesheetName = "darties"; // Utilisez le spritesheet pour la skin 4 si sélectionnée
} else if (this.game.config.skin === 5) {
  spritesheetName = "mika"; // Utilisez le spritesheet pour la skin 4 si sélectionnée
}
    // Créez les animations en utilisant le spritesheet approprié
    this.anims.create({
        key: "anim_tourne_gauche",
        frames: this.anims.generateFrameNumbers(spritesheetName, {
            start: 0,
            end: 3
        }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: "anim_face",
        frames: [{ key: spritesheetName, frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: "anim_tourne_droite",
        frames: this.anims.generateFrameNumbers(spritesheetName, {
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
  DKey= this.input.keyboard.addKey('D');
    QKey= this.input.keyboard.addKey('Q');
    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
     ******************************************************/

    //  Collide the player and the groupe_etoiles with the groupe_plateformes
    this.physics.add.collider(player, groupe_plateformes);
    
    zone_texte_score=this.add.text(16,16,"score:0",{fontFamily: "Stencil",
    fontSize: "25pt",
    fontWeight: 'bold', // mettre en gras
color: '#000000' });

var quitter = this.add.image(700, 60, "quitter").setDepth(1).setInteractive().setScale(0.4);


quitter.setInteractive();

quitter.on("pointerover", () => {
  quitter.setTint(0x0000ff); // Teinte le bouton en rouge
});
quitter.on("pointerout", () => {
  quitter.clearTint(); // Rétablit la couleur normale du bouton
});
quitter.on("pointerup", () => {
  click.play();
  this.game.config.score=0;
  musique_de_fond.stop();
  this.scene.start("menu"); // Assurez-vous que la scène menu est correctement définie dans votre configuration générale
});


  }

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

  update() {
    if (score!= this.game.config.score){
      score = this.game.config.score;
      if (score >= 400) {
        // Arrête la musique de fond
        musique_de_fond.stop();
        // Affiche la scène gameover2
        this.scene.start("gameover2", { score: score });
    }
      zone_texte_score.setText('score: '+score)
    }
    console.log(this.game.config.score);
    if (clavier.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play("anim_tourne_gauche", true);
    } else if (clavier.right.isDown) {
      player.setVelocityX(160);
      player.anims.play("anim_tourne_droite", true);
    } else {
      player.setVelocityX(0);
      player.anims.play("anim_face");
    }

    if (clavier.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }

    if (Phaser.Input.Keyboard.JustDown(clavier.space) == true) {
      if (this.physics.overlap(player, this.porte1)){
      // musique_de_fond.stop();
      musique_de_fond.stop();
      click.play();
        this.scene.start("niveau1");
    }
      else if (this.physics.overlap(player, this.porte2)){
      //musique_de_fond.stop();
      click.play();
      musique_de_fond.stop();
        this.scene.start("niveau2");
      }
      else if (this.physics.overlap(player, this.porte3)){
      //musique_de_fond.stop();
      click.play();
      musique_de_fond.stop();
        this.scene.start("niveau3");
        
      }
      else if (this.physics.overlap(player, this.porte4)){
        //musique_de_fond.stop();
        click.play();
        musique_de_fond.stop();
          this.scene.start("niveau4");
          
        }
     
      
     
    }
  }
}

/***********************************************************************/
/** CONFIGURATION GLOBALE DU JEU ET LANCEMENT 
/***********************************************************************/
