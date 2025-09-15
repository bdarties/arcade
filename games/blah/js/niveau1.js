import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';

var groupe_notes;

var clavier;

var groupe_plateformes;

var player;

var score = 0;

var zone_texte_score;

var groupe_bombes;

var gameOver = false;
var click;
var mus1;

function ramasserNote(un_player, une_note) {

  score += 5;

    zone_texte_score.setText("Score: " + score);

    // on désactive le "corps physique" de l'étoile mais aussi sa texture

    // l'étoile existe alors sans exister : elle est invisible et ne peut plus intéragir

    une_note.disableBody(true, true);

     // on regarde le nombre d'étoiles qui sont encore actives (non ramassées)

  if (groupe_notes.countActive(true) === 0) {

    //  on ajoute 10 points au score total, on met à jour l'affichage

   

 

    // si ce nombre est égal à 0 : on va réactiver toutes les étoiles désactivées

    // pour chaque étoile etoile_i du groupe, on réacttive etoile_i avec la méthode enableBody

    // ceci s'ecrit bizarrement : avec un itérateur sur les enfants (children) du groupe (equivalent du for)

    groupe_notes.children.iterate(function iterateur(notes_i) {

      notes_i.enableBody(true, notes_i.x, 0, true, true);

   

 

    });  

    // on ajoute une nouvelle bombe au jeu

    // - on génère une nouvelle valeur x qui sera l'abcisse de la bombe




  var x;

    if (un_player.x < 400) {

      x = Phaser.Math.Between(400, 800);

    } else {

      x = Phaser.Math.Between(0, 400);

    }

 

    var une_bombe = groupe_bombes.create(x, 16, "img_rat");

    une_bombe.setScale(0.2).refreshBody();

    une_bombe.setBounce(1);

    une_bombe.setCollideWorldBounds(true);

    une_bombe.setVelocity(Phaser.Math.Between(-200, 200), 20);

    une_bombe.allowGravity = false;

  }

 

 

}

 

function chocAvecBombe(un_player, une_bombe) {

  this.physics.pause();

  un_player.setTint(0xff0000);

  un_player.anims.play("img_rat");

  gameOver = true;

}

 

export default class niveau1 extends Phaser.Scene {

  // constructeur de la classe

  constructor() {

    super({

      key: "niveau1" //  ici on précise le nom de la classe en tant qu'identifiant

    });

  }

 

preload() {

  // tous les assets du jeu sont placés dans le sous-répertoire assets/
  this.load.audio('click', 'assets/click.mp3');  
  this.load.image("img_class1", "assets/class1.png");

  this.load.image("img_plat1", "assets/plat1.png");

  this.load.image("img_plat2", "assets/plat2.png");

  this.load.image("img_plat3", "assets/plat3.png");

  this.load.image("img_plat4", "assets/plat4.png");

  this.load.image("img_note", "assets/notes.png");

  this.load.image("img_rat", "assets/rattrapages.png");

  this.load.image("game_over", "assets/fondGO.png"); // Chargement d'un fond pour le texte

  this.load.image("pixelgo", "assets/gameovervrai.png");

  this.load.image("porte", "assets/Exit1.png");
  this.load.audio('mus1', 'assets/musniv.mp3'); 

 

}

 

   create() {


    gameOver = false;
    mus1 = this.sound.add('mus1'); 
  
    mus1.play();
    click = this.sound.add('click');

    var IMG = this.add.image(400, 300, "img_class1");

    IMG.setScale(1);

    this.groupe_plateformes = this.physics.add.staticGroup();

    var IMG1 = this.groupe_plateformes.create(150, 584, "img_plat1");

    IMG1.setScale(0.32).refreshBody();

    var IMG2 = this.groupe_plateformes.create(450, 584, "img_plat1");

    IMG2.setScale(0.32).refreshBody();

    var IMG3 = this.groupe_plateformes.create(750, 584, "img_plat1");

    IMG3.setScale(0.32).refreshBody();

    var IMG4 = this.groupe_plateformes.create(600, 500, "img_plat2");

    IMG4.setScale(0.32).refreshBody();

    var IMG5 = this.groupe_plateformes.create(270, 445, "img_plat4");

    IMG5.setScale(0.32).refreshBody();

    var IMG6 = this.groupe_plateformes.create(80, 295, "img_plat3");

    IMG6.setScale(0.32).refreshBody();

    var IMG7 = this.groupe_plateformes.create(300, 180, "img_plat3");

    IMG7.setScale(0.32).refreshBody();

    var IMG8 = this.groupe_plateformes.create(520, 210, "img_plat4");

    IMG8.setScale(0.32).refreshBody();

    var IMG9 = this.groupe_plateformes.create(690, 130, "img_plat2");

    IMG9.setScale(0.32).refreshBody();

    // ajout d'un texte distintcif  du niveau

    //this.add.text(400, 50, "Vous êtes dans le niveau 1", {

     // fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',

      //fontSize: "22pt"

    //});

 

    this.player = this.physics.add.sprite(100, 450, "img_perso");

   // this.player.refreshBody();

    this.player.setBounce(0.2);

    this.player.setCollideWorldBounds(true);

    this.clavier = this.input.keyboard.createCursorKeys();

    this.physics.add.collider(this.player, this.groupe_plateformes);

 

    groupe_notes = this.physics.add.group();

    // on rajoute 10 oints  avec une boucle for :

  // on répartit les ajouts de notes tous les 70 pixels sur l'axe des x

  for (var i = 0; i < 10; i++) {

    var coordX = 70 + 70 * i;

    var IMG10 = groupe_notes.create(coordX, 10, "img_note");

    IMG10.setScale(0.08).refreshBody();

   

 

  }

 

  zone_texte_score = this.add.text(16, 16, 'score: 0', { fontFamily: "Stencil",
  fontSize: "25pt",
  fontWeight: 'bold', // mettre en gras
  color: '#000000'  });
  this.resetScore();

  this.physics.add.collider(groupe_notes, this.groupe_plateformes);

   

  groupe_notes.children.iterate(function iterateur(note_i) {

    // On tire un coefficient aléatoire de rerebond : valeur entre 0.4 et 0.8

    var coef_rebond = Phaser.Math.FloatBetween(0.4, 0.8);

    note_i.setBounceY(coef_rebond); // on attribut le coefficient de rebond à l'étoile etoile_i

  });

  this.physics.add.overlap(this.player, groupe_notes, ramasserNote, null, this);

 

 

  groupe_bombes = this.physics.add.group();

 

 

  this.physics.add.collider(this.player, groupe_bombes, chocAvecBombe, null, this);

 

  this.porte_menu = this.physics.add.staticSprite(700, 72, "porte");

  
  

 

 

  }





 

  resetScore() {
    score = 0;
    zone_texte_score.setText("Score: " + score);
}

  update() {

    if (gameOver) {
      mus1.stop();
      this.scene.start("gameover");

    }

    if (this.clavier.left.isDown) {

      this.player.setVelocityX(-160);

      this.player.anims.play("anim_tourne_gauche", true);

    } else if (this.clavier.right.isDown) {

      this.player.setVelocityX(160);

      this.player.anims.play("anim_tourne_droite", true);

    } else {

      this.player.setVelocityX(0);

      this.player.anims.play("anim_face");

    }

    if (this.clavier.up.isDown && this.player.body.touching.down) {

      this.player.setVelocityY(-330);

    }

if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {

    if (this.physics.overlap(this.player, this.porte_menu)) {
      this.game.config.score+=score;
      mus1.stop();
      click.play();
      this.scene.switch("selection");

    }

  }

 

   

 

 

}

}

 