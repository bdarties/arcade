import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';


var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier
var groupe_plateformes;
var boutonFeu;  
var groupeBullets;  
var cibles;  
var son_feu;
var click;
var score=0;
var zone_texte_score;
var mus2;

export default class niveau2 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau2" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  





preload() {


   
  this.load.image("img_classe", "assets/nivdeux.png");
this.load.image("img_plateforme", "assets/platform.png");
this.load.image("bullet", "assets/Stylo.png");  

this.load.image("cible", "assets/tableau.png"); 
this.load.image("exit", "assets/Exit.png");
this.load.audio('coupDeFeu', 'assets/stylos.mp3');
this.load.audio('click', 'assets/click.mp3');  
this.load.audio('mus2', 'assets/musniv.mp3'); 
}

create() {

  mus2 = this.sound.add('mus2'); 
  
    mus2.play();
score=0;
  click = this.sound.add('click'); 

  this.add.image(400, 300, "img_classe");
  this.groupe_plateformes = this.physics.add.staticGroup();
  this.groupe_plateformes.create(200, 584, "img_plateforme");
  this.groupe_plateformes.create(600, 584, "img_plateforme");
  // ajout d'un texte distintcif  du niveau
  this.add.text(300, 100, "Vous êtes dans le niveau 2", {
    fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
    fontSize: "22pt"
  });

  this.porte_retour = this.physics.add.staticSprite(100, 550, "exit");

  this.player = this.physics.add.sprite(100, 450, "img_perso");
  this.player.refreshBody();
  this.player.setBounce(0.2);
  this.player.setCollideWorldBounds(true);
  this.clavier = this.input.keyboard.createCursorKeys();
  this.physics.add.collider(this.player, this.groupe_plateformes);
  this.add.image(400, 300, "img_classe");

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

 this.porte1 = this.physics.add.staticSprite(750, 194, "exit");

  /****************************
   *  CREATION DU PERSONNAGE  *
   ****************************/

  // On créée un nouveeau personnage : player
  player = this.physics.add.sprite(100, 450, "img_perso");

  //  propriétées physiqyes de l'objet player :
  player.setBounce(0.2); // on donne un petit coefficient de rebond
  player.setCollideWorldBounds(true); // le player se cognera contre les bords du monde


  groupe_plateformes.create(600, 450, "img_plateforme");
  groupe_plateformes.create(50, 300, "img_plateforme");
  groupe_plateformes.create(750, 270, "img_plateforme");
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

  

  /*****************************************************
   *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
   ******************************************************/

  //  Collide the player and the groupe_etoiles with the groupe_plateformes
  this.physics.add.collider(player, groupe_plateformes);
  player.direction = 'anim_tourne_droite';  
  player.direction = 'anim_tourne_gauche';  
  clavier = this.input.keyboard.createCursorKeys();

// affectation de la touche A à boutonFeu
boutonFeu = this.input.keyboard.addKey('A'); 

groupeBullets = this.physics.add.group(); 


cibles = this.physics.add.group({
  key: 'cible',
  repeat: 7,
  setXY: { x: 24, y: 0, stepX: 107 }
});  

this.physics.add.collider(cibles, groupe_plateformes);  

this.physics.add.overlap(groupeBullets, cibles, this.hit, null,this);

cibles.children.iterate(function (cibleTrouvee) {
  // définition de points de vie
  cibleTrouvee.pointsVie=Phaser.Math.Between(1, 5);;
  // modification de la position en y
  cibleTrouvee.y = Phaser.Math.Between(10,250);
  // modification du coefficient de rebond
  cibleTrouvee.setBounce(1);
}); 

this.physics.world.on("worldbounds", function(body) {
  // on récupère l'objet surveillé
  var objet = body.gameObject;
  // s'il s'agit d'une balle
  if (groupeBullets.contains(objet)) {
      // on le détruit
      objet.destroy();
  }
});

son_feu = this.sound.add('coupDeFeu');
zone_texte_score=this.add.text(16,16,"score:0",{fontFamily: "Stencil",
      fontSize: "25pt",
      fontWeight: 'bold', // mettre en gras
  color: '#000000' });
 

 
}


tirer(player) {
var coefDir;
if (player.direction == 'anim_tourne_gauche') { coefDir = -1; } else { coefDir = 1 }
// on crée la balle a coté du joueur
var bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');
// parametres physiques de la balle.
bullet.setCollideWorldBounds(true);
bullet.body.onWorldBounds = true;  
bullet.body.allowGravity =false;
bullet.setVelocity(1000 * coefDir, 0); // vitesse en x et en y
}  
/***********************************************************************/
/** FONCTION UPDATE 
/***********************************************************************/



hit (bullet, cible) {
cible.pointsVie--;
if (cible.pointsVie==0) {
  cible.destroy(); 
  score+=10;
  zone_texte_score.setText("Score: "+score);
} 
 bullet.destroy();
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
    
}else {
    player.setVelocityX(0);
    player.anims.play("anim_face");

  }

  if (clavier.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }
 
if ( Phaser.Input.Keyboard.JustDown(boutonFeu)) {
  this.tirer(player);
  son_feu.play();
}  
  if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
    if (this.physics.overlap(player, this.porte1)){
      click.play();
      mus2.stop();
      this.game.config.score+=score;
    this.scene.switch("selection");
    }
   }
  }
 


}
