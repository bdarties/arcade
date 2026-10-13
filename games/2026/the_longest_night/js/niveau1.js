const DIRECTIONS_ANIMATIONS = [
  { key: "bas", file: "down" },
  { key: "droite", file: "right" },
  { key: "gauche", file: "left" },
  { key: "haut", file: "up" }
];
const TYPES_ANIMATIONS = [
  { key: "attente", file: "idle", frameCount: 4, frameRate: 5, repeat: -1 },
  { key: "course", file: "run", frameCount: 6, frameRate: 5, repeat: -1 },
  { key: "attaque", file: "attack", frameCount: 7, frameRate: 15, repeat: 0 }
];

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/
var mode_fantome = false;//une variable qui sert a activer un mode_fantome, utilisé pour tester des fonctionalités. Ce mode_fantome permet de traverser les murs pour parcourir le labyrinthe plus rapidement. Les autres colisions reste actives.
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
var mode_deux_joueurs = true; //définit si le mode un joueur ou deux joueur est actif.
var groupe_cle; 
var cle;
var hudJ1;
var hudJ2;
var hudCommun
var groupeBullets;
var groupe_araignee;
var tableau_ennemis; //tableau qui serivira a choisir et répartir alétoirement les ennemis
var groupe_recharges;
var groupe_soin;
var araignee;
var vies;
var cles_restantes
var son_feu;
var nombre_ennemis_apparissant;
var musique_niveau1;
var camJ1;
var camJ1UI;
var camJ2;
var camJ2UI;
var camGlobalUI;
var score_J1_affiche;
var score_J2_affiche;
var balle_restanteJ1_affiche;
var balle_restanteJ2_affiche;
var son_blesse;
var son_areignne_blesse;
var son_cle;
var cles_restantes_affiche;
var temps_restant_affiche
var temps_restant;
var groupe_areignee;
var arreignee;
var camerasFusionnees = true; //sert a former une camera globale une fois les deux proches
var cibleCamera; // point invisible au milieu des deux joueurs
var gagnant //variable qui définira le vainqeur du niveau a la fin du calcul des points
var sortie_ouverte = false;
var gameOver = false;
// définition de la classe "selection"
export default class Niveau_demo extends Phaser.Scene {
  constructor() {
    super({ key: "niveau1" }); // mettre le meme nom que le nom de la classe
  }


  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("Phaser_tuileGood", "./assets/map/tileset_good.png");
    this.load.tilemapTiledJSON("carte1", "./assets/map/niveau_1.json");
    this.load.image("player1", "./assets/player_1/joueur1_image.png");
    this.load.image("player2", "./assets/player_2/joueur2_image.png");

    const joueurs = [
      { dossier: "player_1", id: "J1", suffixe: "" },
      { dossier: "player_2", id: "J2", suffixe: "_2" }
    ];
    joueurs.forEach(({ dossier, id, suffixe }) => {
      TYPES_ANIMATIONS.forEach(({ key, file }) => {
        DIRECTIONS_ANIMATIONS.forEach(({ key: direction, file: directionFichier }) => {
          this.load.spritesheet(
            `anim_${key}_${direction}_${id}`,
            `./assets/${dossier}/${file}_${directionFichier}${suffixe}.png`,
            { frameWidth: 32, frameHeight: 32 }
          );
        });
      });
    });

    this.load.spritesheet("cle_bronze", "./assets/keys/Key_bronze.png", {
      frameWidth: 32,
      frameHeight: 64
    });
    this.load.spritesheet("areignee_ennemie", "./assets/enemies/araignee.png", {
      frameWidth: 48,
      frameHeight:48
    });
    this.load.spritesheet("pv_bar", "./assets/pv_bar.png",{
      frameWidth : 64,
      frameHeight : 16
    });
    this.load.spritesheet("pv_bar2", "./assets/pv_bar_2.png",{
      frameWidth : 64,
      frameHeight : 16
    });
    this.load.image("bullet", "./assets/star.png");
    this.load.image("recharge", "./assets/star_of_dawn.png");
    this.load.image("soin", "./assets/medkit.png")
    this.load.image("sortie1_fermee", "./assets/door.png");
    this.load.image("sortie1_ouverte", "./assets/door1_ouverte.png");
    this.load.audio("coupDeFeu", "./assets/musique_et_sons/shoot.mp3");
    this.load.audio("MusiqueNiveau1", "./assets/musique_et_sons/musique_niveau1.mp3");
    this.load.audio("areignee_blesse", "./assets/musique_et_sons/areigne_blesse.mp3");
    this.load.audio("cle_collecte", "./assets/musique_et_sons/cle_collecte.mp3");
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
      
      //definition des paramètres du jeu
      temps_restant = 80;
      cles_creees = 0;
      nombre_ennemis_apparissant = 4
      sortie_ouverte = false;

    const carteDuNiveau = this.make.tilemap({ key: "carte1" });
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
        this.physics.world.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
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

  /**************************
   * INSTALATION DES ELEMENTS
  ***************************/
  groupeBullets = this.physics.add.group();
  this.porte1 = this.physics.add.staticSprite(600, 414, "sortie1_fermee");
  groupe_cle = this.physics.add.group();
  groupe_recharges = this.physics.add.group();
  groupe_soin = this.physics.add.group();
  //timer du jeu
      this.time.addEvent({
      delay: 1000,
      repeat: temps_restant - 1,
      callback: () => {
        temps_restant -= 1;
        temps_restant_affiche.setText('Temps : ' + temps_restant);
      }
    });

    player = this.physics.add.sprite(player_spawn.x, player_spawn.y, "player1");
    player.peutTirer = true;
    player.balle_max = 10;
    player.balle_restante = player.balle_max;
    player.score = 0;
    player.points_vies = 5;
    player.prochaineDegat = 0;
    player.direction = "down"; //on définit une direction par défaut au lencement du jeu pour éviter qu'on se retrouve sans animation dès le début du jeu.
    // propriétées physique de l'objet player :
    player.setCollideWorldBounds(true);
    calque_mur.setCollisionByProperty({estSolide: true});
    this.physics.add.collider(player, calque_mur);
    //joueur 2
    if (mode_deux_joueurs == true){
      player2 = this.physics.add.sprite(player2_spawn.x, player2_spawn.y, "player2");
      player2.peutTirer = true;
      player2.balle_max = 10;
      player2.balle_restante = player2.balle_max;
      player2.score = 0;
      player2.points_vies = 5;
      player2.prochaineDegat = 0;
      player2.direction = "down";
    //  propriétées physique de l'objet player2 :
    player2.setCollideWorldBounds(true);
    calque_mur.setCollisionByProperty({estSolide: true});
    this.physics.add.collider(player2, calque_mur);
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
        end: 7
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
    //note : la camera J2 aparait quand même même lorsque les
    camJ2 = this.cameras.add(1280/2, 0, 1280/2, 720);
    if (mode_deux_joueurs){
      camJ2.startFollow(player2, true, 0.1, 0.1);
    }
    camJ2.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.widthInPixels);
    camJ2.setZoom(2);
     if (mode_deux_joueurs){
    camJ2UI = this.cameras.add(1280 / 2, 0, 1280 / 2, 720);
    camJ2UI.setScroll(0, 0);
    camJ2UI.ignore(this.children.list);
    }
    camGlobalUI = this.cameras.add(0, 0, 1280, 720);
    camGlobalUI.setScroll(0, 0);
    camGlobalUI.ignore(this.children.list);
    cibleCamera = this.add.zone(player.x, player.y, 1, 1);
    if (mode_deux_joueurs) {
      fct.fusionner_cameras();
    } else {
      camJ1.setViewport(0, 0, 1280, 720); // plein écran, suit uniquement player
      camJ2.setVisible(false);
    }
    /************************************ 
     * ELEMENTS DE L'UI
    ************************************/
    //élements de l'UI du joueur 1
    score_J1_affiche = this.add.text(100, 16, 'Score : ' + player.score, { fontSize: '32px', fill: '#3bd5f0'});
    score_J1_affiche.setOrigin(0.5, 0);
    score_J1_affiche.setScrollFactor(0); //permet de faire en sorte que le texte (ou autre élément chosi) reste fixe sur l'écran.
    balle_restanteJ1_affiche = this.add.text(180,64,'Balle restante : ' + player.balle_restante,{ fontSize: '32px', fill: '#c9a326'})
    balle_restanteJ1_affiche.setOrigin(0.5, 0);
    balle_restanteJ1_affiche.setScrollFactor(0); //permet de faire en sorte que le texte (ou autre élément chosi) reste fixe sur l'écran.
    player.barreVie = this.add.sprite(100, 144, "pv_bar", player.points_vies);
    player.barreVie.setScale(2);
    player.barreVie.setOrigin(0.5, 0);
    player.barreVie.setScrollFactor(0);
    temps_restant_affiche = this.add.text(100, 100, 'Temps : ' + temps_restant, {fontSize: '32px', fill: '#000000'});
    temps_restant_affiche.setScrollFactor(0);
    temps_restant_affiche.setOrigin(0.5, 0);

    //élements de l'UI du joueur 2
    if (mode_deux_joueurs){
      score_J2_affiche = this.add.text(100, 16, 'Score : ' + player2.score, { fontSize: '32px', fill: '#f03b3b' });
      score_J2_affiche.setOrigin(0.5, 0);
      score_J2_affiche.setScrollFactor(0)
      balle_restanteJ2_affiche = this.add.text(180,64,'Balles restante : ' + player2.balle_restante,{ fontSize: '32px', fill: '#571881'})
      balle_restanteJ2_affiche.setOrigin(0.5, 0)
      balle_restanteJ2_affiche.setScrollFactor(0)
      player2.barreVie = this.add.sprite(160, 144, "pv_bar2", player2.points_vies);
      player2.barreVie.setScale(2);
      player2.barreVie.setOrigin(0.5, 0);
      player2.barreVie.setScrollFactor(0);
    }
    //elements UI global
    cles_restantes_affiche = this.add.text(640, 20, 'Clés à récupérer : ' + nombre_cles, { fontSize: '32px', fill: '#cd50ff' });
    cles_restantes_affiche.setOrigin(0.5, 0);
    cles_restantes_affiche.setScrollFactor(0);


    /*************************************
     *  CREATION DES SONS *
     *************************************/
    son_feu = this.sound.add('coupDeFeu');
    this.sound.add("MusiqueNiveau1").play({ loop: true });
    son_areignne_blesse = this.sound.add('areignee_blesse')
    son_cle = this.sound.add('cle_collecte')

    /***********************
     *  CREATION DU CLAVIER ET TOUCHES *
     ************************/
    //touches Joueur 1
      J1Haut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP); //Phaser.Input.Keyboard.KeyCodes.[...] représente la touche a associer (en l'occurence l'une des touche directionelle) par ce on ne peut pas associer une touche de direction a une variable comme les autres touches et qu'on doit donc utiliser cette méthode
      J1Bas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      J1Gauche = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      J1Droite = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      J1Interaction = this.input.keyboard.addKey('I');
      J1boutonFeu = this.input.keyboard.addKey('O');
    //touches Joueur 2
      J2Haut = this.input.keyboard.addKey('Z');
      J2Bas = this.input.keyboard.addKey('S');
      J2Gauche = this.input.keyboard.addKey('Q');
      J2Droite = this.input.keyboard.addKey('D');
      J2Interaction = this.input.keyboard.addKey('R');
      J2boutonFeu = this.input.keyboard.addKey('T');
    /*************************************************
     * AJOUT DES ENNEMIS ET ELEMENTS DU JEU (sauf la porte)                      *
     ************************************************/
    //on rajoute les ennemis dans ce tableau pour qu'ils soient réorganisés plus tard.
    groupe_araignee = this.physics.add.group();
    this.physics.add.collider(groupe_araignee, calque_mur);
    tableau_ennemis = [{
      nom: "groupe_araignee",
      texture: "areignee_ennemie",
      animation: "animation_areignee",
      points_vie: 3,
      degats: 1,
      score : 100
    }];
    //on appelera ensuite apparition_elements pour
    for (let i = 0; i < nombre_ennemis_apparissant + cles_creees ; i++){
      fct.apparition_elements();
    }
    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS(+ ignorance de la caméra) *
     ******************************************************/
    this.physics.add.collider(player, groupe_cle, fct.recuperer_cle, null, this);
    this.physics.add.collider(player,groupe_recharges,fct.recharger,null,this);
    this.physics.add.collider(player,groupe_soin,fct.soigner,null,this);
    if (mode_deux_joueurs) {
      this.physics.add.collider(player,player2);
      this.physics.add.collider(player2, groupe_recharges, fct.recharger, null, this);
      this.physics.add.collider(player2,groupe_soin,fct.soigner,null,this);
      this.physics.add.overlap(player2, groupe_cle, fct.recuperer_cle, null, this);
    }
    player.colliderEnnemis = this.physics.add.collider(player, groupe_araignee, fct.degat_contact_ennemi, null, this);
    if (mode_deux_joueurs) {
      player2.colliderEnnemis = this.physics.add.collider(player2, groupe_araignee, fct.degat_contact_ennemi, null, this);
    }
    this.physics.add.overlap(groupeBullets, groupe_araignee, fct.Elimination_ennemi, null, this);
    //gestion des éléments ignorés par la caméra
    hudJ1 = [score_J1_affiche, balle_restanteJ1_affiche, player.barreVie];
    if (mode_deux_joueurs){
      hudJ2 = [score_J2_affiche, balle_restanteJ2_affiche, player2.barreVie]
    }
    else{
      hudJ2 = []
    }
    hudCommun = [temps_restant_affiche, cles_restantes_affiche];
    camJ1.ignore([...hudJ1, ...hudJ2, ...hudCommun]);
    camJ1UI.ignore(hudJ2);
    if (mode_deux_joueurs) {
      camJ2.ignore([...hudJ1, ...hudJ2, ...hudCommun]);
      camJ2UI.ignore([...hudJ1, temps_restant_affiche]);
    }
      camGlobalUI.ignore([...hudJ1, ...hudJ2]);
    }
  

  update() {
    //gestion indépendante des points de vie (au cas ou on voudrait ajouter une option pour soigner)
    player.barreVie.setFrame(player.points_vies); //défini le numero de frame par rapport au nombre de point de vie restant. Très pratique pour une gestion indépendante.
    if (mode_deux_joueurs) {
      player2.barreVie.setFrame(player2.points_vies);
      fct.gerer_cameras();
    }
    fct.deplacement_areignee.call(this);
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
          fct.tirer.call(this, player);
        }

    if (Phaser.Input.Keyboard.JustDown(J1Interaction) && sortie_ouverte && this.physics.overlap(player, this.porte1)) {
      this.scene.start("Ecran_score", {
        scoreJ1: player.score,
        temps_restant
      });
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
          fct.tirer.call(this, player2);
        }

    if (!mode_deux_joueurs) {
      return;
    }
    deplacerJoueur(player2, {
      gauche: J2Gauche,
      droite: J2Droite,
      haut: J2Haut,
      bas: J2Bas
    }, "J2", false, player);
    if (Phaser.Input.Keyboard.JustDown(J2boutonFeu)) {
      tirer.call(this, player2);
    }
    if (Phaser.Input.Keyboard.JustDown(J2Interaction) &&
        sortie_ouverte && this.physics.overlap(player2, this.porte1)) {
      this.scene.start("Ecran_score", {
        scoreJ1: player2.score,
        temps_restant
      });
    }
  }}
}
