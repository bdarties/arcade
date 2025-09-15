import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';

var player; // désigne le sprite du joueur
var groupe_plateformes; // contient toutes les plateformes
var clavier;
var timer;
var tempsRestant = 40;
var score = 0;
var zone_texte_score;
var click;
var mus3;
var time;
export default class niveau3 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau3" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }




  preload() {
    this.load.audio('click', 'assets/click.mp3');
    this.load.image("img_plateforme2", "assets/platform.png");
    this.load.audio('time', 'assets/time.mp3'); 
    this.load.image("pano", "assets/pano.jpg");
    this.load.audio('mus3', 'assets/musniv.mp3'); 

    this.load.image("Phaser_tuilesdejeu", "assets/route.png");

    // chargement de la carte
    this.load.tilemapTiledJSON("carte", "assets/map2.json");
    this.load.image("exit3", "assets/exit3.png");
  }

  create() {


    mus3 = this.sound.add('mus3'); 
  
    mus3.play();
    time = this.sound.add('time'); 
    time.play({ loop: true })
    // On ajoute une simple image de fond, le ciel, au centre de la zone affichée (400, 300)
    // Par défaut le point d'ancrage d'une image est le centre de cette derniere
    this.add.image(900, 800, "pano");
    click = this.sound.add('click');
    // la création d'un groupes permet de gérer simultanément les éléments d'une meme famille
    //  Le groupe groupe_plateformes contiendra le sol et deux platesformes sur lesquelles sauter
    // notez le mot clé "staticGroup" : le static indique que ces élements sont fixes : pas de gravite,
    // ni de possibilité de les pousser.

    // une fois le groupe créé, on va créer les platesformes , le sol, et les ajouter au groupe groupe_plateformes

    // l'image img_plateforme2 fait 400x32. On en met 2 à coté pour faire le sol
    // la méthode create permet de créer et d'ajouter automatiquement des objets à un groupe
    // on précise 2 parametres : chaque coordonnées et la texture de l'objet, et "voila!"



    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/

    // On créée un nouveeau personnage : player
    player = this.physics.add.sprite(100, 450, "img_perso");

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
    this.anims.create({
      key: "anim_tourne_gauche", // key est le nom de l'animation : doit etre unique poru la scene.
      frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }), // on prend toutes les frames de img perso numerotées de 0 à 3
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
      frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    // ceci permet de creer un clavier et de mapper des touches, connaitre l'état des touches
    clavier = this.input.keyboard.createCursorKeys();

    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
     ******************************************************/

    //  Collide the player and the groupe_etoiles with the groupe_plateformes


    const carteDuNiveau = this.add.tilemap("carte");

    const tileset = carteDuNiveau.addTilesetImage(
      "tuile_de_Jeu",
      "Phaser_tuilesdejeu"
    );
    const calque_plateformes = carteDuNiveau.createLayer(
      "calque_plateformes",
      tileset
    );


    calque_plateformes.setCollisionByProperty({ estSolide: true });
    this.physics.add.collider(player, calque_plateformes);
    //calque_plateformes = this.physics.add.staticGroup();

    this.physics.world.setBounds(0, 0, 3200, 1280);
    //  ajout du champs de la caméra de taille identique à celle du monde
    this.cameras.main.setBounds(0, 0, 3200, 1280);
    // ancrage de la caméra sur le joueur
    this.cameras.main.startFollow(player);
    this.porte3 = this.physics.add.staticSprite(3100, 600, "exit3");

    this.timerText = this.add.text(player.x - 20, player.y - 400, 'CHRONO: 40', {
      fontFamily: "Stencil",
      fontSize: "25pt",
      fontWeight: 'bold', // mettre en gras
      color: '#000000'
    });

    // Démarrez un timer récurrent qui se déclenchera toutes les secondes
    this.timer = this.time.addEvent({
      delay: 1000, // 1000ms = 1 seconde
      callback: this.updateTimer,
      callbackScope: this,
      loop: true

    });
    this.timerText.setScrollFactor(0);
this.resetTimer();
this.resetScore();
  }
  
  resetScore() {
    score = 0;
    
}

  resetTimer() {
    // Réinitialiser le temps restant à la valeur initiale du timer
    tempsRestant = 40;
    // Mettre à jour le texte du timer avec le temps initial
    this.timerText.setText('Temps restant: ' + tempsRestant);
}

updateTimer() {
    // Décrémentez le temps restant
    tempsRestant--;
    // Mettez à jour le texte du timer avec le temps restant
    this.timerText.setText('Temps restant: ' + tempsRestant);

    // Vérifiez si le temps est écoulé
    if (tempsRestant <= 0) {
        // Arrêtez le timer
        this.timer.remove();
        // Appelez la méthode gameOver
        this.gameOver();
    }
}
  gameOver() {
    mus3.stop();
    time.stop();
    // Arrêtez tous les éléments du jeu, affichez un message de game over, etc.
    this.scene.start("gameover");
  }


  update() {
    if (clavier.left.isDown) {
      // enregistrement de la direction : gauche
      player.direction = 'anim_tourne_gauche';
      player.setVelocityX(-160);
      player.anims.play('anim_tourne_gauche', true);

    }
    else if (clavier.right.isDown) {
      // enregistrement de la direction : droite
      player.direction = 'anim_tourne_droite';
      player.setVelocityX(160);
      player.anims.play('anim_tourne_droite', true);

    } else {
      player.setVelocityX(0);
      player.anims.play("anim_face");

    }

    if (clavier.up.isDown && player.body.blocked.down) {
      player.setVelocityY(-300);
    }

    if (Phaser.Input.Keyboard.JustDown(clavier.space)) {
      if (this.physics.overlap(player, this.porte3)) {
        score += 50;
        click.play();
        mus3.stop();
        time.stop();
        this.game.config.score += score;
        this.scene.switch("selection");

      }
    }

  }

}  