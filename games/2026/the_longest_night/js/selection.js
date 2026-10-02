import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

var player; // désigne le sprite du joueur
var player2;
var clavier; // pour la gestion du clavier
var J1Haut, J1Bas, J1Gauche, J1Droite, J1boutonFeu,J1Interaction; //variables des touches du joueur 1
var J2Haut, J2Bas, J2Gauche, J2Droite, J2boutonFeu,J2Interaction; //variables des touches du joueur 2
var player_spawn; //définit l'endroit d'apparition du joueur1
var player2_spawn; //définit l'endroit d'apparition du joueur2
var tableau_spawn
var nombre_cles = 1;
var cles_creees = 0;
var cles_recuperees = 0;
var mode_deux_joueurs = true; //définit si on joue a deux joueurs. Si cette option est false, il n'y aura qu'un seul joueur.
var groupe_cle; 
var cle;
var groupeBullets;
var groupe_araignee;
var tableau_ennemis; //tableau qui serivira a choisir et répartir alétoirement les ennemis
var araignee;
var points_vies;
var vies;
var cles_restantes
var son_feu;
var nombre_ennemis_apparissant;
var musique_niveau1;
var camJ1;
var camJ1UI;
var camJ2;
var camJ2UI;
var scoreText;
var score_J1_affiche;
var score_J2_affiche;
var balle_restanteJ1_affiche;
var balle_restanteJ2_affiche;
var points_viesJ1_affiche;
var points_viesJ2_affiche;
var cles_restantesJ1_affiche;
var cles_restantesJ2_affiche;
var temps_restant_affiche
var temps_restant;
var groupe_areignee;
var arreignee
var gagnant //variable qui définira le vainqeur du niveau a la fin du calcul des points
var sortie_ouverte = false;
var gameOver = false;
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
    this.load.image("Phaser_tuileGood", "./assets/map/tileset_good.png");
    this.load.image("Phaser_tuileBad", "./assets/map/tileset_bad.png");
    this.load.tilemapTiledJSON("carte1", "./assets/map/niveau_1.json"); 
    this.load.image("img_background", "./assets/arriere_plan.jpg");
    this.load.image("player1", "./assets/player_1/joueur1_image.png"); //servira a définir le joueur directement. L'image a en réalité peu d'importance car on verra l'animation d'attente du bas dès le début.
    this.load.image("player2", "./assets/player_2/joueur2_image.png");
    this.load.spritesheet("anim_attente_bas_J1", "./assets/player_1/idle_down.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attente_droite_J1", "./assets/player_1/idle_right.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attente_gauche_J1", "./assets/player_1/idle_left.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attente_haut_J1", "./assets/player_1/idle_up.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_course_bas_J1", "./assets/player_1/run_down.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_course_droite_J1", "./assets/player_1/run_right.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_course_gauche_J1", "./assets/player_1/run_left.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_course_haut_J1", "./assets/player_1/run_up.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attaque_bas_J1", "./assets/player_1/attack_down.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attaque_droite_J1", "./assets/player_1/attack_right.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attaque_gauche_J1", "./assets/player_1/attack_left.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attaque_haut_J1", "./assets/player_1/attack_up.png", {
      frameWidth: 32,
      frameHeight: 32
    });
     this.load.spritesheet("anim_attente_bas_J2", "./assets/player_2/idle_down_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attente_droite_J2", "./assets/player_2/idle_right_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attente_gauche_J2", "./assets/player_2/idle_left_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attente_haut_J2", "./assets/player_2/idle_up_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_course_bas_J2", "./assets/player_2/run_down_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_course_droite_J2", "./assets/player_2/run_right_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_course_gauche_J2", "./assets/player_2/run_left_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_course_haut_J2", "./assets/player_2/run_up_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
     this.load.spritesheet("anim_attaque_bas_J2", "./assets/player_2/attack_down_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attaque_droite_J2", "./assets/player_2/attack_right_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attaque_gauche_J2", "./assets/player_2/attack_left_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("anim_attaque_haut_J2", "./assets/player_2/attack_up_2.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    //instalations d'autres animations
    this.load.spritesheet("cle_bronze", "./assets/keys/Key_bronze.png", {
      frameWidth: 32,
      frameHeight: 64
    });
    this.load.spritesheet("areignee_ennemie", "./assets/enemies/areignee.png", {
      frameWidth: 40,
      frameHeight: 32
    });
    this.load.image("bullet", "./assets/star.png");
    this.load.image("sortie1_fermee", "./assets/door.png");
    this.load.image("sortie1_ouverte", "./assets/door1_ouverte.png")
    this.load.image("sortie2", "./assets/door2.png");
    this.load.image("sortie3", "./assets/door3.png");
    this.load.audio("coupDeFeu", "./assets/musique_et_sons/shoot.mp3")
    this.load.audio("MusiqueNiveau1","./assets/musique_et_sons/musique_niveau1.mp3")
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
      //definition du timer
      temps_restant = 10;
      cles_creees = 0;
      cles_recuperees = 0;
      nombre_ennemis_apparissant = 4
      sortie_ouverte = false;

    /*************************************
     *  CREATION DU MONDE *
     *************************************/


    const carteDuNiveau = this.make.tilemap({ key:"carte1"});
    const tileset = carteDuNiveau.addTilesetImage(
      "tileset_good",
      "Phaser_tuileGood"
    );
        const calque_sol = carteDuNiveau.createLayer(
          "calque_sol",
          tileset
        );
        const calque_details = carteDuNiveau.createLayer(
          "calque_details",
          tileset
        );
        const calque_mur = carteDuNiveau.createLayer(
          "calque_mur",
          tileset
        );
        const liste_spawn = carteDuNiveau.getObjectLayer("calque_spawn"); //ce calque d'objet servira plus tard pour faire un systeme de coordonées plus pratique. En attendant, les coordonnées seront inscrite manuellement en fonction des coordonées des points de la map tiled.
/* DEFINITON DES COORDONNES
      liste_spawn.objects.forEach(point => {
      if (point.name == "Spawn_joueur1") {
        player_spawn = {point.x, point.y}
      }
      if (point.name == "Spawn_joueur2") {
        player_spawn = {point.x, point.y}
    }
    if (point.name == "Autre_spawn") {
        player_spawn = {point.x, point.y}
    }
  }); 
  */
  player_spawn = {x:93.3333,y:672.0} 
  player2_spawn = {x:243.333, y:673.333};8
  tableau_spawn = [{x:72.0,y:1008.0},{x:272.0,y:1196.0},{x:548.0,y:304.0},{x:1512.0,y:40.0},{x:1688.0,y:1140.0},{x:1900.0,y:192.0},{x:2604.0,y:700.0}];

  //**INSTALATION*/
  groupeBullets = this.physics.add.group();
  this.porte1 = this.physics.add.staticSprite(600, 414, "sortie1_fermee");
  groupe_cle = this.physics.add.group();
  groupe_araignee = this.physics.add.group();
  //timer du jeu
      this.time.addEvent({
      delay: 1000,
      repeat: temps_restant - 1,
      callback: () => {
        temps_restant -= 1;
        temps_restant_affiche.setText('Temps : ' + temps_restant);
      }});
      
    
    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/
    //joueur 1
    player = this.physics.add.sprite(player_spawn.x,player_spawn.y, "player1");

    //valeurs associées au joueur :
    player.peutTirer = true; //on l'associe que une fois car on utilisera cette valeur de la même façon pour les deux joueurs
    player.balle_restante = 10;
    player.score = 0;
    player.points_vies = 5;
    player.direction = "down"; //on définit une direction par défaut au lencement du jeu pour éviter qu'on se retrouve sans animation dès le début du jeu.
    // propriétées physique de l'objet player :
    calque_mur.setCollisionByProperty({estSolide: true});
    this.physics.add.collider(player, calque_mur);
    this.physics.add.collider(groupe_araignee, calque_mur);
    this.physics.add.collider(groupeBullets, calque_mur, (bullet) => bullet.destroy());
    

    //joueur 2
    if (mode_deux_joueurs == true){
      player2 = this.physics.add.sprite(player2_spawn.x, player2_spawn.y, "player2");
      //valeurs associées au joueur :
      player2.peutTirer = true;
      player2.balle_restante = 10;
      player2.score = 0;
      player2.points_vies = 5;
      player2.direction = "down";
    //  propriétées physique de l'objet player2 :
    player2.setCollideWorldBounds(true); // le player se cognera contre les bords du monde
    calque_mur.setCollisionByProperty({estSolide: true});
    this.physics.add.collider(player2, calque_mur);
    this.physics.add.collider(player2, groupe_cle, recuperer_cle, null, this);
  }
    /***************************
     *  CREATION DES ANIMATIONS *
     ****************************/
    //animations du joueur 1
    this.anims.create({
      key: "anim_attente_bas_J1",
      frames: this.anims.generateFrameNumbers("anim_attente_bas_J1", {
        start: 0,
        end: 3
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_attente_droite_J1",
      frames: this.anims.generateFrameNumbers("anim_attente_droite_J1", {
        start: 0,
        end: 3
      }),
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_attente_gauche_J1",
      frames: this.anims.generateFrameNumbers("anim_attente_gauche_J1", {
        start: 0,
        end: 3
      }),
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_attente_haut_J1",
      frames: this.anims.generateFrameNumbers("anim_attente_haut_J1", {
        start: 0,
        end: 3
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_course_bas_J1",
      frames: this.anims.generateFrameNumbers("anim_course_bas_J1", {
        start: 0,
        end: 5
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_course_gauche_J1",
      frames: this.anims.generateFrameNumbers("anim_course_gauche_J1", {
        start: 0,
        end: 5
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_course_droite_J1",
      frames: this.anims.generateFrameNumbers("anim_course_droite_J1", {
        start: 0,
        end: 5
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_course_haut_J1",
      frames: this.anims.generateFrameNumbers("anim_course_haut_J1", {
        start: 0,
        end: 5
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_attaque_droite_J1",
      frames: this.anims.generateFrameNumbers("anim_attaque_droite_J1", {
        start: 0,
        end: 6
      }), 
      frameRate: 15, 
      repeat: 0 
    });
    this.anims.create({
      key: "anim_attaque_gauche_J1",
      frames: this.anims.generateFrameNumbers("anim_attaque_gauche_J1", {
        start: 0,
        end: 6
      }), 
      frameRate: 15, 
      repeat: 0 
    });
    this.anims.create({
      key: "anim_attaque_bas_J1",
      frames: this.anims.generateFrameNumbers("anim_attaque_bas_J1", {
        start: 0,
        end: 6
      }), 
      frameRate: 15, 
      repeat: 0 
    });
    this.anims.create({
      key: "anim_attaque_haut_J1",
      frames: this.anims.generateFrameNumbers("anim_attaque_haut_J1", {
        start: 0,
        end: 6
      }), 
      frameRate: 15, 
      repeat: 0 
    });
    
    //animations du joueur 2
    this.anims.create({
      key: "anim_attente_bas_J2",
      frames: this.anims.generateFrameNumbers("anim_attente_bas_J2", {
        start: 0,
        end: 3
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_attente_droite_J2",
      frames: this.anims.generateFrameNumbers("anim_attente_droite_J2", {
        start: 0,
        end: 3
      }),
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_attente_gauche_J2",
      frames: this.anims.generateFrameNumbers("anim_attente_gauche_J2", {
        start: 0,
        end: 3
      }),
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_attente_haut_J2",
      frames: this.anims.generateFrameNumbers("anim_attente_haut_J2", {
        start: 0,
        end: 3
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_course_bas_J2",
      frames: this.anims.generateFrameNumbers("anim_course_bas_J2", {
        start: 0,
        end: 5
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_course_gauche_J2",
      frames: this.anims.generateFrameNumbers("anim_course_gauche_J2", {
        start: 0,
        end: 5
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_course_droite_J2",
      frames: this.anims.generateFrameNumbers("anim_course_droite_J2", {
        start: 0,
        end: 5
      }), 
      frameRate: 5, 
      repeat: -1 
    });
    this.anims.create({
      key: "anim_course_haut_J2",
      frames: this.anims.generateFrameNumbers("anim_course_haut_J2", {
        start: 0,
        end: 5
      }),
      frameRate: 5,
      repeat: -1
    });
    this.anims.create({
      key: "anim_attaque_droite_J2",
      frames: this.anims.generateFrameNumbers("anim_attaque_droite_J2", {
        start: 0,
        end: 6
      }), 
      frameRate: 15, 
      repeat: 0 
    });
    this.anims.create({
      key: "anim_attaque_gauche_J2",
      frames: this.anims.generateFrameNumbers("anim_attaque_gauche_J2", {
        start: 0,
        end: 6
      }), 
      frameRate: 15, 
      repeat: 0 
    });
    this.anims.create({
      key: "anim_attaque_bas_J2",
      frames: this.anims.generateFrameNumbers("anim_attaque_bas_J2", {
        start: 0,
        end: 6
      }), 
      frameRate: 15, 
      repeat: 0 
    });
    this.anims.create({
      key: "anim_attaque_haut_J2",
      frames: this.anims.generateFrameNumbers("anim_attaque_haut_J2", {
        start: 0,
        end: 6
      }), 
      frameRate: 15, 
      repeat: 0 
    });
    //autres éléments a animation
    this.anims.create({
      key: "animation_cle_bronze",
      frames: this.anims.generateFrameNumbers("cle_bronze", {
        start: 0,
        end: 10
      }), 
      frameRate: 10, 
      repeat: -1 
    });
    this.anims.create({
      key: "animation_areignee",
      frames: this.anims.generateFrameNumbers("areignee_ennemie", {
        start: 0,
        end: 4
      }), 
      frameRate: 3, 
      repeat: -1 
    });
    

    /*****************************************************
     *  GESTION DE LA CAMERA *
     ******************************************************/
    //camera 1 
    camJ1 = this.cameras.main; //on initisalise les caméras maintenant pour qu'elle puissent ignorer les éléménts d'UI des deux joueurs plus tard.
    camJ1.setViewport(0, 0, 1280/2, 720);
    camJ1.startFollow(player, true, 0.1, 0.1);
    camJ1.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.widthInPixels);
    camJ1.setZoom(2);
    //Les caméras UI ont comme objectif de n'afficher que les UI des deux joueurs afin qu'ils ne soient pas afféctés par le zoom des caméras normales.
    camJ1UI = this.cameras.add(0, 0, 1280 / 2, 720);
    camJ1UI.setScroll(0, 0);
    camJ1UI.ignore(this.children.list);
    //cameraJoueur2
     if (mode_deux_joueurs){
    camJ2 = this.cameras.add(1280/2, 0, 1280/2, 720);
    camJ2.startFollow(player2, true, 0.1, 0.1);
    camJ2.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.widthInPixels);
    camJ2.setZoom(2);
    camJ2UI = this.cameras.add(1280 / 2, 0, 1280 / 2, 720);
    camJ2UI.setScroll(0, 0);
    camJ2UI.ignore(this.children.list);
    }

    /************************************ 
     * ELEMENTS DE L'UI
    ************************************/
    //élements de l'UI du joueur 1
    score_J1_affiche = this.add.text(100, 16, 'Score : ' + player.score, { fontSize: '32px', fill: '#FFFFFF'});
    score_J1_affiche.setOrigin(0.5, 0);
    score_J1_affiche.setScrollFactor(0); //permet de faire en sorte que le texte (ou autre élément chosi) reste fixe sur l'écran.
    balle_restanteJ1_affiche = this.add.text(180,64,'Balle restante : ' + player.balle_restante,{ fontSize: '32px', fill: '#f1c489'})
    balle_restanteJ1_affiche.setOrigin(0.5, 0);
    balle_restanteJ1_affiche.setScrollFactor(0); //permet de faire en sorte que le texte (ou autre élément chosi) reste fixe sur l'écran.
    points_viesJ1_affiche = this.add.text(160, 144, 'Points de vie : ' + player.points_vies, { fontSize: '32px', fill: '#FFFFFF' });
    points_viesJ1_affiche.setOrigin(0.5, 0);
    points_viesJ1_affiche.setScrollFactor(0);;
    cles_restantesJ1_affiche = this.add.text(200, 200, 'Clés à récupérer : ' + nombre_cles, { fontSize: '32px', fill: '#f1c489' });
    cles_restantesJ1_affiche.setOrigin(0.5, 0);
    cles_restantesJ1_affiche.setScrollFactor(0);
    temps_restant_affiche = this.add.text(100, 100, 'Temps : ' + temps_restant, {fontSize: '32px', fill: '#2bff4e'});
    temps_restant_affiche.setScrollFactor(0);
    temps_restant_affiche.setOrigin(0.5, 0);

    //élements de l'UI du joueur 2
    score_J2_affiche = this.add.text(100, 16, 'Score : ' + player2.score, { fontSize: '32px', fill: '#fff' });
    score_J2_affiche.setOrigin(0.5, 0);
    score_J2_affiche.setScrollFactor(0)
    balle_restanteJ2_affiche = this.add.text(180,64,'Balle restante : ' + player2.balle_restante,{ fontSize: '32px', fill: '#f1c489'})
    balle_restanteJ2_affiche.setOrigin(0.5, 0)
    balle_restanteJ2_affiche.setScrollFactor(0)
    points_viesJ2_affiche = this.add.text(160, 144, 'Points de vie : ' + player2.points_vies, { fontSize: '32px', fill: '#FFFFFF' });
    points_viesJ2_affiche.setScrollFactor(0);
    points_viesJ2_affiche.setOrigin(0.5,0)
    cles_restantesJ2_affiche = this.add.text(200, 200, 'Clés à récupérer : ' + nombre_cles, { fontSize: '32px', fill: '#f1c489' });
    cles_restantesJ2_affiche.setOrigin(0.5, 0);
    cles_restantesJ2_affiche.setScrollFactor(0);



    /*************************************
     *  CREATION DES SONS *
     *************************************/
    son_feu = this.sound.add('coupDeFeu');
    musique_niveau1 = this.sound.add('MusiqueNiveau1');
    musique_niveau1.play({ loop: true });

    /***********************
     *  CREATION DU CLAVIER ET TOUCHES *
     ************************/
    clavier = this.input.keyboard.createCursorKeys();

    //touches Joueur 1
      J1Haut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP); //Phaser.Input.Keyboard.KeyCodes.[...] représente la touche a associer (en l'occurence l'une des touche directionelle) par ce on ne peut pas associer une touche de direction a une variable comme les autres touches et qu'on doit donc utiliser cette méthode
      J1Bas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      J1Gauche = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      J1Droite = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      J1Interaction = this.input.keyboard.addKey('I');
      J1boutonFeu = this.input.keyboard.addKey('O');
    //touches Joueur 2
      J2Haut = this.input.keyboard.addKey('Z');
      J2Bas = this.input.keyboard.addKey('L');
      J2Gauche = this.input.keyboard.addKey('K');
      J2Droite = this.input.keyboard.addKey('M');
      J2Interaction = this.input.keyboard.addKey('R');
      J2boutonFeu = this.input.keyboard.addKey('T');
    /*************************************************
     * AJOUT DES ENNEMIS ET ELEMENTS DU JEU (sauf la porte)                      *
     ************************************************/
    //on rajoute les ennemis dans ce tableau pour qu'ils soient réorganisés plus tard.
    tableau_ennemis = [{
      texture: "areignee_ennemie",
      animation: "animation_areignee",
      points_vie: 3
    }];
    //on appelera ensuite apparition_elements pour
    for (let i = 0; i < nombre_ennemis_apparissant + cles_creees ; i++){
      apparition_elements();
    }
    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS(+ ignorance de la caméra) *
     ******************************************************/
    this.physics.add.collider(player, groupe_cle, recuperer_cle, null, this);
    this.physics.add.overlap(groupeBullets, groupe_araignee, Elimination_ennemi, null, this);
    //gestion des éléments ignorés par la caméra
    camJ1.ignore([score_J1_affiche, balle_restanteJ1_affiche, points_viesJ1_affiche, cles_restantesJ1_affiche, temps_restant_affiche, score_J2_affiche, balle_restanteJ2_affiche, points_viesJ2_affiche, cles_restantesJ2_affiche]);
    camJ1UI.ignore([score_J2_affiche, balle_restanteJ2_affiche, points_viesJ2_affiche, cles_restantesJ2_affiche]);
    camJ2.ignore([score_J2_affiche, balle_restanteJ2_affiche, points_viesJ2_affiche, cles_restantesJ2_affiche, temps_restant_affiche, score_J1_affiche, balle_restanteJ1_affiche, points_viesJ1_affiche, cles_restantesJ1_affiche]);
    camJ2UI.ignore([score_J1_affiche, balle_restanteJ1_affiche, points_viesJ1_affiche, cles_restantesJ1_affiche, ...groupe_cle.getChildren()]);
    if (mode_deux_joueurs) {
      camJ2.ignore([score_J1_affiche, balle_restanteJ1_affiche, points_viesJ1_affiche, cles_restantesJ1_affiche, temps_restant_affiche, balle_restanteJ2_affiche, ...groupe_cle.getChildren()]);
      camJ2UI.ignore([score_J1_affiche, balle_restanteJ1_affiche, points_viesJ1_affiche, cles_restantesJ1_affiche, temps_restant_affiche, ...groupe_cle.getChildren()]);
    }
    
    
  
  }
  

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

  update() {
    //commandes joueur1
    player.setVelocity(0);
    if (J1Gauche.isDown){
          player.direction = "left";
          player.setVelocityX(-160);
          if (!player.tirEnCours){
            player.anims.playReverse("anim_course_gauche_J1", true); //playReverse permettra de jouer l'animation de la fin jusqu'au début, permettant ainsi d'éviter les faux raccord entre l'animation de droite et de gauche.
        }}
        else if (J1Droite.isDown) {
          player.direction = "right";
          player.setVelocityX(160);
          if (!player.tirEnCours){
            player.anims.play("anim_course_droite_J1", true);
        }}
        else if (J1Haut.isDown) {
          player.direction = "up";
          player.setVelocityY(-160);
          if (!player.tirEnCours){
          player.anims.play("anim_course_haut_J1", true);
        }}
        else if (J1Bas.isDown) {
          player.direction = "down";
          player.setVelocityY(160);
          if (!player.tirEnCours){
          player.anims.play("anim_course_bas_J1", true);
        }}
        else{
          player.setVelocityX(0);
          player.setVelocityY(0)
          if (player.direction == "down"){
            if (!player.tirEnCours){
            player.anims.play("anim_attente_bas_J1",true);
        }}
          else if (player.direction == "up"){
            if (!player.tirEnCours){
            player.anims.play("anim_attente_haut_J1",true);
        }}
          else if (player.direction == "left"){
            if (!player.tirEnCours){
            player.anims.playReverse("anim_attente_gauche_J1",true);
        }}
          else if (player.direction == "right"){
            if (!player.tirEnCours){
            player.anims.play("anim_attente_droite_J1",true);
        }}
      }
        if (Phaser.Input.Keyboard.JustDown(J1boutonFeu)){
          tirer.call(this, player);
        }

    if (Phaser.Input.Keyboard.JustDown(J1Interaction) && sortie_ouverte && this.physics.overlap(player, this.porte1)) {
      this.scene.switch("niveau1");
    }
  //commandes joueur2
  if (mode_deux_joueurs){
        if (J2Gauche.isDown) {
          player2.direction = "left";
          player2.setVelocityX(-160);
            if (!player.tirEnCours){
          player2.anims.playReverse("anim_course_gauche_J2", true); //playReverse permettra de jouer l'animation de la fin jusqu'au début, permettant ainsi d'éviter les faux raccord entre l'animation de droite et de gauche.
        }}
        else if (J2Droite.isDown) {
          player2.direction = "right";
          player2.setVelocityX(160);
          if (!player.tirEnCours){
            player2.anims.play("anim_course_droite_J2", true);
          }}
        else if (J2Haut.isDown) {
          player2.direction = "up";
          player2.setVelocityY(-160);
          if (!player.tirEnCours){
          player2.anims.play("anim_course_haut_J2", true);
        }}
        else if (J2Bas.isDown) {
          player2.direction = "down";
          player2.setVelocityY(160);
          if (!player.tirEnCours){
          player2.anims.play("anim_course_bas_J2", true);
        }}
        else{
          player2.setVelocityX(0);
          player2.setVelocityY(0)
          if (player2.direction == "down"){
            if (!player.tirEnCours){
            player2.anims.play("anim_attente_bas_J2",true);
        }}
          else if (player2.direction == "up"){
            if (!player.tirEnCours){
            player2.anims.play("anim_attente_haut_J2",true);
        }}
          else if (player2.direction == "left"){
            if (!player.tirEnCours){
            player2.anims.playReverse("anim_attente_gauche_J2",true);
        }}
          else if (player2.direction == "right"){
            if (!player.tirEnCours){
            player2.anims.play("anim_attente_droite_J2",true);
        }}
      }
        if (Phaser.Input.Keyboard.JustDown(J2boutonFeu)){
          tirer.call(this, player2);
        }

    if (Phaser.Input.Keyboard.JustDown(J2Interaction) && sortie_ouverte && this.physics.overlap(player2, this.porte1)) {
      this.scene.switch("niveau1");
    }
    }
  }
}


/************************************************************************/
/**FONCTIONS DU JEU **/
/************************************************************************/

function apparition_elements() {
  if (groupe_araignee.countActive(true) + groupe_cle.countActive(true) < tableau_spawn.length) { //on empeche de accidentellement avoir plus de d'éléments que de spawn disponible
    const definition = Phaser.Utils.Array.GetRandom(tableau_ennemis);
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn); //cela permet de recuperer la valeur ET de la supprimer du tableau en même temps, évitant ainsi les spawns répétés. Sinon on aurait utilisé Phaser.Utils.Array.GetRandom si on voulait juste le récupérer. Cette méthode, combinée au fait qu'on compte la longeur du tableau ACTUELLE a chaque vérification a l'inconvénient de limiter l'apparition des éléments. Cependant, c'est un choix d'équilibrage justifiable par le fait qu'on a des munitions limitées.
    const ennemi = groupe_araignee.create(position.x, position.y, definition.texture);
    ennemi.points_vie = definition.points_vie;
    ennemi.anims.play(definition.animation, true);
    camJ1UI.ignore(ennemi);
    if (mode_deux_joueurs) {
      camJ2UI.ignore(ennemi);
    }
  }
  if (cles_creees < nombre_cles && groupe_cle.countActive(true) < nombre_cles) {
    const position = Phaser.Utils.Array.GetRandom(tableau_spawn);
    cle = groupe_cle.create(position.x, position.y, "cle_bronze");
    cles_creees += 1;
    cle.anims.play("animation_cle_bronze", true);
    camJ1UI.ignore(cle);
    if (mode_deux_joueurs) {
      camJ2.ignore(cle);
      camJ2UI.ignore(cle);
    }
  }
}

      function tirer(player){
        if (player.peutTirer == true && player.balle_restante >0 ) {
        var coefDir; 
        let bullet;
        player.tirEnCours = true;
              player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              player.tirEnCours = false;
            });
        if (player.direction == 'left' || player.direction == 'up'){
            {coefDir = -1} }
          else{
            {coefDir = 1}
        }
        if (player.direction == 'left' || player.direction == 'right'){
            bullet = groupeBullets.create(player.x + (25 * coefDir), player.y, 'bullet');
            bullet.tireur = player;
            if (player.direction == 'left'){
              player.anims.play("anim_attaque_gauche_J1",true);
            }
            else{
              player.anims.play("anim_attaque_droite_J1",true); 
            }
          }
          if (player.direction == 'up' || player.direction == 'down'){
            bullet = groupeBullets.create(player.x , player.y + (25 * coefDir), 'bullet');  //balle crée dans la direction haut bas donc on inverse les coordonnées x et y.
            if (player.direction == 'up'){
              player.anims.play("anim_attaque_haut_J1",true);
            }
            else{
              player.anims.play("anim_attaque_bas_J1",true); 
            }
          }
          camJ1UI.ignore(bullet); //on est obligé d'ignorer les balles a ce moment la car elle sont crées qu'a ce moment la.
          if (mode_deux_joueurs) {
            camJ2UI.ignore(bullet);
          }
          if (player.direction == 'left' || player.direction == 'right'){
          bullet.setVelocity(500 * coefDir, 0);
        }
        if (player.direction == 'up' || player.direction == 'down'){
          bullet.setVelocity(0, 500 * coefDir); //on met les coordonées inverse pour que la balle aille en haut ou en bas au lieu de la gauche ou la droite
        }
          bullet.setAngularVelocity(180); //permet de faire en sorte que l'objet tournee en continue
          son_feu.play();
          player.balle_restante -= 1;
          const balleRestanteText = player === player2 ? balle_restanteJ2_affiche : balle_restanteJ1_affiche;
          balleRestanteText.setText('Balle restante: ' + player.balle_restante);
          player.peutTirer = false;
       var timerTirOk = this.time.delayedCall(800,
           function () {
            player.peutTirer = true;
           },
           null,this);
           //partie reservée a détruire le bullet si il est actif plus de 3 secondes.
      this.time.delayedCall((3000), () => { 
          if (bullet.active) { 
            bullet.destroy();
          }
          
        })
      }
      else if (player.balle_restante === 0) {
        const balleRestanteText = player === player2 ? balle_restanteJ2_affiche : balle_restanteJ1_affiche;
        balleRestanteText.setColor('rgb(192, 69, 69)');
      }
          
      }
      function Elimination_ennemi(bullet, ennemi){
        const tireur = bullet.tireur;
        bullet.destroy();
        ennemi.points_vie -= 1;
        if (ennemi.points_vie <= 0){
          ennemi.destroy();
          if (tireur){ //défini simplement qui est le tireur
            tireur.score += 100;
            const scoreText = tireur === player2 ? score_J2_affiche : score_J1_affiche;
            scoreText.setText('Score: ' + tireur.score);
          }
        }
      }

      function partie_terminée(){
        if (gameOver = true){
          return;
        }
      }
    function recuperer_cle(player, cle){
      player.cles_recuperees += 1;
      cles_restantes -= 1;
      cle.destroy();
      if (cles_restantes>0){
        cles_restantesJ1_affiche.setText('Clés à récupérer : ' + cles_restantes);
        cles_restantesJ2_affiche.setText('Clés à récupérer : ' + cles_restantes);
      }
      else{
        cles_restantesJ1_affiche.setText('Plus de clé ! Dirigez vous vers la sortie !');
        cles_restantesJ2_affiche.setText('Plus de clé ! Dirigez vous vers la sortie !')
      }
      if (cles_creees >= nombre_cles && groupe_cle.countActive(true) === 0){
        this.porte1.setTexture("sortie1_ouverte");
        sortie_ouverte = true;
  } //la suite de cette fonction sera utile pour plus tard pour spawn des ennemis si besoin
}; 

