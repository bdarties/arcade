import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/
var mode_fantome = true;//une variable qui sert a activer un mode_fantome, utilisé pour tester des fonctionalités. Ce mode_fantome permet de traverser les murs pour parcourir le labyrinthe plus rapidement. Les autres colisions restes actives.
var player; // désigne le sprite du joueur
var player2;
var clavier; // pour la gestion du clavier. Semble initulisé mais en fait, si, elle l'est.
var J1Haut, J1Bas, J1Gauche, J1Droite, J1boutonFeu,J1Interaction; //variables des touches du joueur 1
var J2Haut, J2Bas, J2Gauche, J2Droite, J2boutonFeu,J2Interaction; //variables des touches du joueur 2
var player_spawn; //définit l'endroit d'apparition du joueur1
var player2_spawn; //définit l'endroit d'apparition du joueur2
var tableau_spawn //tableau qui sert a reunir tous les points de spawn. Ces points de spawn sont définit dans le fichier Tiled, cependant, ils ne servent que de référence pour inscrire les coordonées manuelllement. Une amélioration de ce systeme serait possible.
var nombre_elements
var nombre_cles; //définit le nombre de clé a chercher dans le niveau
var cles_creees = 0; //une variable qui va servir au code pour savoir combien de clés sont été crées pendant leur placement.
var mode_deux_joueurs = true; //définit si le mode un joueur ou deux joueur est actif. En false, le mode un joueur est actif, en tue, le mode deux joueurs. C'est donc aussi a partir de cette variable qu'on va activer  ou desactiver toute variabless/fonctionalités pour le second joueur (car si on garde les variables mais qu'on retire le second joueur le code va planter par ce qu'il manquera des arguments donc on doit appliquer cette variable comme condition très regulièrement)
var groupe_cle; 
var cle; //c'est sous ce nom que soont définis les clés a partir de groupe_cle lors de sa création.
var hudJ1; //un tableur qui rassemble toutes les variables des éléments d'UI du premier joueur. Voir plus bas.
var hudJ2; //pareil, pour le joueur 2
var hudCommun //même principe, mais avec des variables d'éléments qui servent aux deux joueurs (comme le timer, ou le nombre de clé). Attention : on parle bien de l'AFFICHAGE UI de ses éléments (donc tout ce qui est BarreVie, affichageScore ect...) a ne pas confondre avec les élements interactibles dans le monde.
var groupeBullets; 
var groupe_araignee; //les groupe sont globalement explicatifs.
var tableau_ennemis; //tableau qui serivira a choisir et répartir les ennemis dans les points d'apparitions définis danss tableau_spawn. Voir son utilisation dans apparition_element.
var groupe_recharges; //en cas ou ce ne serait pas clair, c'est ce qui définira les recharges qui serviront a recharger les "balles" des joueurs
var groupe_soin;
var porte;
var araignee;
var vies;
var cles_restantes
var son_feu;
var nombre_ennemis_apparaissant;
var nombre_recharges_apparaissant;
var nombre_soins_apparaissant;
var musique_niveau1;
var camJ1; 
var camJ1UI; //gère tous les éléments de l'UI du joueur 1, ou tous les éléments d'UI de la première motié de gauche.
var camJ2; //Gère la seconde motié droite de la caméra du jeu, ou, en splitscreen, la caméra du joueur 2
var camJ2UI; //gère tous les éléments de l'UI du joueur 2, ou tous les éléments d'UI de la seconde motié de droite.
var camGlobalUI; //gère les éléments d'UI affichés au centre en haut de l'écran, ou tous les éléments d'UI qui concernent les deux joueurs et qui est donc surpéposé par dessus les deux caméras UI.
var score_J1_affiche; //correspond actuellement au nombre dU score affiché pour le joueur 1 (pas l'icone, c'est autre chose). Idem pour la ligne de dessous avec le joueur 2.
var score_J2_affiche;
var balle_restanteJ1_affiche; //correspond actuellement au nombre de balle restante affiché pour le joueur 1. Idem pour la ligne de dessous avec le joueur 2.
var balle_restanteJ2_affiche;
var timerIcon;
var nombreCleIcon;
var son_blesse; //semble inutilisé, mais l'est pour gérer le son lorsque le joueur est bléssé.
var son_areignne_blesse;
var son_cle; //son lorsque la clé est ramassée. La clé elle-même ne produit pas de sons dans le niveau (mais devrais, cela pourrait faire un indicateur sonore pour les retrouver)
var cles_restantes_affiche;
var temps_restant; //variable qui gère combien de seconde s'écoule avant que la partie se finisse. A ne pas confondre avec temps_restant_affiche.
var temps_restant_affiche
var camerasFusionnees = true; //sert a former une camera globale une fois les deux joueurs proches
var cibleCamera; // point invisible au milieu des deux joueurs sur laquelle la camera fusionée se focalise.
var gagnant //variable qui définira le vainqeur du niveau a la fin du calcul des points. Est éfféctivement initulisée pour l'instant.
var sortie_ouverte = false; //définit si toutes les clés ont été trouvées, et donc, si la porte du niveau du jeu est ouverte pour s'échapper.
var gameOver = false; //fonction pouvant etre utilisée pour définir si la partie se termine ou non. N'a pas d'utilité pour l'instant.
// définition de la classe "selection"
export default class niveau1 extends Phaser.Scene {
  constructor(cle = "niveau1") {
    super({ key: cle }); // niveau2 hérite de cette classe et passe sa propre clé
  }

  init(data) {
    this.donnees = data || {}; // scores transmis par le niveau précédent (vide pour le niveau 1)
  }

  /** Tous les réglages qui changent d'un niveau à l'autre sont ici.
   *  niveau2.js redéfinit cette méthode pour changer la carte, les ennemis, etc. */
  parametres_niveau() {
    return {
      carte_cle: "carte1",
      carte_fichier: "./assets/map/niveau_1.json",
      tileset_nom: "tileset_good",
      tileset_image: "Phaser_tuileGood",
      temps: 120,
      nombre_cles: 1,
      nombre_ennemis: 4,
      nombre_recharges: 1,
      nombre_soins: 1,
      player_spawn: {},
      player2_spawn: {},
      tableau_spawn: [],
      porte: { x: 600, y: 414 },
      ennemis: [{
        nom: "groupe_araignee",
        texture: "areignee_ennemie",
        animation: "animation_areignee",
        points_vies: 3,
        degats: 1,
        score: 100
      }],
      niveau_suivant: "niveau2"
    };
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
    const cfg_carte = this.parametres_niveau();
    this.load.tilemapTiledJSON(cfg_carte.carte_cle, cfg_carte.carte_fichier); 
    this.load.image("img_background", "./assets/arriere_plan.jpg");
    this.load.image("player1", "./assets/player_1/joueur1_image.png"); //servira a définir le joueur directement. L'image a en réalité peu d'importance car on verra l'animation d'attente du bas dès le début.
    this.load.image("player2", "./assets/player_2/joueur2_image.png");
    this.load.image("sortie_fermee", "./assets/door.png");
    this.load.image("Score", "./assets/UI/score_icon.png");
    this.load.image("timer_icone", "./assets/UI/timer_icon.png");
    this.load.image("bullet_icone", "./assets/UI/bullet_icon.png");
    this.load.image("nombre_cle_icone", "./assets/UI/trousseau.png");
    this.load.audio("coupDeFeu", "./assets/musique_et_sons/shoot.mp3")
    this.load.audio("MusiqueNiveau1", "./assets/musique_et_sons/musique_niveau1.mp3")
    this.load.audio("blesse","./assets/musique_et_sons/blesse.mp3")
    this.load.audio("areignee_blesse","./assets/musique_et_sons/areigne_blesse.mp3")
    this.load.audio("cle_collecte","./assets/musique_et_sons/cle_collecte.mp3")
    /*CHARGEMENT DES ANIMATIONS */
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
    this.load.spritesheet("cle_argent", "./assets/keys/Key_silver.png", {
      frameWidth: 32,
      frameHeight: 64
    });
    this.load.spritesheet("cle_or", "./assets/keys/Key_gold.png", {
      frameWidth: 32,
      frameHeight: 64
    });
    this.load.spritesheet("areignee_ennemie", "./assets/enemies/araignee.png", {
      frameWidth: 48,
      frameHeight:48
    });
    this.load.spritesheet("pv_bar", "./assets/UI/pv_bar.png",{
      frameWidth : 64,
      frameHeight : 16
    });
    this.load.spritesheet("pv_bar2", "./assets/UI/pv_bar_2.png",{
      frameWidth : 64,
      frameHeight : 16
    });
    this.load.spritesheet("porte_ouverture_animation", "./assets/door_open.png",{
      frameWidth : 48,
      frameHeight : 48
    });
    this.load.spritesheet("animation_balle_droite", "./assets/bullets/bullet_right.png",{
      frameWidth : 48,
      frameHeight : 16
    });
    this.load.spritesheet("animation_balle_gauche", "./assets/bullets/bullet_left.png",{
      frameWidth : 48,
      frameHeight : 16
    });
    this.load.spritesheet("animation_balle_haut", "./assets/bullets/bullet_up.png",{
      frameWidth : 16,
      frameHeight : 48
    });
    this.load.spritesheet("animation_balle_bas", "./assets/bullets/bullet_down.png",{
      frameWidth : 16,
      frameHeight : 48
    });
    this.load.spritesheet("animation_porte_ouverte", "./assets/door_open.png",{
      frameWidth : 48,
      frameHeight : 48
    });
    this.load.spritesheet("soin", "./assets/buff/soin.png",{
      frameWidth : 32,
      frameHeight : 32
    });
    this.load.spritesheet("recharge", "./assets/buff/recharge.png",{
      frameWidth : 32,
      frameHeight : 32
    });
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
      
      //definition des paramètres du premier niveau
      const cfg = this.parametres_niveau();
      this.cfg = cfg;
      temps_restant = cfg.temps;
      nombre_cles = cfg.nombre_cles;
      cles_restantes = nombre_cles;
      cles_creees = 0; //remis à zéro à chaque (re)lancement de niveau
      nombre_ennemis_apparaissant = cfg.nombre_ennemis;
      nombre_recharges_apparaissant = cfg.nombre_recharges;
      nombre_soins_apparaissant = cfg.nombre_soins;
      sortie_ouverte = false;

    /*************************************
     *  CREATION DU MONDE *
     *************************************/


    if (!this.cache.tilemap.exists(cfg.carte_cle)) { //la carte n'a pas été chargée (fichier absent, mauvais chemin, 404...)
      throw new Error("Carte introuvable : " + cfg.carte_fichier + " n'a pas été chargé. Vérifie le chemin et le nom du fichier.");
    }
    const carteDuNiveau = this.make.tilemap({ key: cfg.carte_cle });
    ["calque_sol", "calque_details", "calque_mur"].forEach((nom) => {
      if (!carteDuNiveau.layers.some((calque) => calque.name === nom)) {
        throw new Error("Calque '" + nom + "' absent de " + cfg.carte_fichier + ". Calques trouvés : " + carteDuNiveau.layers.map((c) => c.name).join(", "));
      }
    });
    const tileset = carteDuNiveau.addTilesetImage(
      cfg.tileset_nom,
      cfg.tileset_image
    );
    if (!tileset) {
      throw new Error("Tileset '" + cfg.tileset_nom + "' introuvable dans " + cfg.carte_fichier + ". Tilesets trouvés : " + carteDuNiveau.tilesets.map((t) => t.name).join(", "));
    }
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

  player_spawn = cfg.player_spawn;
  player2_spawn = cfg.player2_spawn;
  tableau_spawn = cfg.tableau_spawn;;

  /*Définition des points d'aparitions.*/
if (liste_spawn) { //ce systeme fonctionne aussi pour le niveau 22
  liste_spawn.objects.forEach((point) => {
    if (point.name == "Spawn_joueur1") {
      player_spawn = {x: point.x, y: point.y};
    } else if (point.name == "Spawn_joueur2") {
      player2_spawn = { x: point.x, y: point.y };
    } else if (point.name == "Spawn_porte") {
      player2_spawn = { x: point.x, y: point.y };
    } else {
      tableau_spawn.push({ x: point.x, y: point.y }); //"push" permet d'ajouter des éléments directement a la fin du tableau.
    }
  });
}
  /**************************
   * INSTALATION DES ELEMENTS
  ***************************/
  groupeBullets = this.physics.add.group();
  porte = this.physics.add.staticSprite(cfg.porte.x, cfg.porte.y, "sortie_fermee");
  groupe_cle = this.physics.add.group();
  groupe_araignee = this.physics.add.group();
  groupe_recharges = this.physics.add.group();
  groupe_soin = this.physics.add.group();
  //le timer du jeu est crée ci-dessous :
      this.time.addEvent({
      delay: 1000,
      repeat: temps_restant - 1,
      callback: () => {
        temps_restant -= 1;
        temps_restant_affiche.setText(String(temps_restant));
      }});
      
    
    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/
    //joueur 1
    player = this.physics.add.sprite(player_spawn.x,player_spawn.y, "player1");

    //valeurs associées au joueur :
    player.peutTirer = true; //on l'associe que une fois car on utilisera cette valeur de la même façon pour les deux joueurs
    player.balle_max= 10;
    player.balle_restante = player.balle_max;
    player.score = this.donnees.scoreJ1 ?? 0;
    player.points_vies = 5;
    player.prochaineDegat = 0;
    player.direction = "down"; //on définit une direction par défaut au lencement du jeu pour éviter qu'on se retrouve sans animation dès le début du jeu.
    // propriétées physique de l'objet player :
    player.setCollideWorldBounds(true);
    calque_mur.setCollisionByProperty({estSolide: true});
    if (!mode_fantome){
      this.physics.add.collider(player, calque_mur);
    }
    //joueur 2
    if (mode_deux_joueurs == true){
      player2 = this.physics.add.sprite(player2_spawn.x, player2_spawn.y, "player2");
      //valeurs associées au joueur :
      player2.peutTirer = true;
      player2.balle_max = 10;
      player2.balle_restante = player2.balle_max;
      player2.score = this.donnees.scoreJ2 ?? 0;
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
      key: "animation_cle_argent",
      frames: this.anims.generateFrameNumbers("cle_argent", {
        start: 0,
        end: 10
      }), 
      frameRate: 10, 
      repeat: -1 
    });
    this.anims.create({
      key: "animation_cle_or",
      frames: this.anims.generateFrameNumbers("cle_or", {
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
    this.anims.create({
      key: "animation_areignee",
      frames: this.anims.generateFrameNumbers("areignee_ennemie", {
        start: 0,
        end: 7
      }), 
      frameRate: 3, 
      repeat: -1 
    });
    this.anims.create({
      key: "animation_balle_droite",
      frames: this.anims.generateFrameNumbers("animation_balle_droite", {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: "animation_balle_gauche",
      frames: this.anims.generateFrameNumbers("animation_balle_gauche", {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: "animation_balle_haut",
      frames: this.anims.generateFrameNumbers("animation_balle_haut", {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: "animation_porte_ouverte",
      frames: this.anims.generateFrameNumbers("animation_porte_ouverte", {
        start: 0,
        end: 3
      }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "animation_soin",
      frames: this.anims.generateFrameNumbers("soin", {
        start: 0,
        end: 4
      }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: "recharge",
      frames: this.anims.generateFrameNumbers("recharge", {
        start: 0,
        end: 3
      }),
      frameRate: 6,
      repeat: -1
    });
    

    /*****************************************************
     *  GESTION DE LA CAMERA *
     ******************************************************/
    //camera 1 
    camJ1 = this.cameras.main; //on initisalise les caméras maintenant pour qu'elle puissent ignorer les éléménts d'UI des deux joueurs plus tard.
    camJ1.setViewport(0, 0, 1280/2, 720);
    camJ1.startFollow(player, true, 0.1, 0.1); 
    camJ1.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels); 
    camJ1.setZoom(2); //Définit un zoom et l'applique a la caméra, tout simplement. Une plus grande valeur définira un zoom plus grand.
    //Les caméras UI ont comme objectif de n'afficher que les UI des deux joueurs afin qu'ils ne soient pas afféctés par le zoom des caméras normales.
    camJ1UI = this.cameras.add(0, 0, 1280 / 2, 720);
    camJ1UI.setScroll(0, 0);
    camJ1UI.ignore(this.children.list); //ici, on indique ce que la camJ1UI ignorera (donc n'affichera pas). Ca peut etre autant des autres éléments d'UI que des éléments du jeu diréctement. this.children.list designe toute les répétitions de cette ligne et surtout la liste avec les huds.
    //cameraJoueur2
    //note : la camera J2 aparait quand même même lorsque le mode deux joueur est désactivé car une fois rassemblé avec camJ2, ils forment les deux moitié de la caméra du joueur seul et des deux joueurs proches.
    camJ2 = this.cameras.add(1280/2, 0, 1280/2, 720);
    if (mode_deux_joueurs){
      camJ2.startFollow(player2, true, 0.1, 0.1);
    }
    camJ2.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
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
      fusionner_cameras();
    } else {
      camJ1.setViewport(0, 0, 1280, 720);
      camJ2.setVisible(false);
    }
    /************************************ 
     * ELEMENTS DE L'UI
    ************************************/
    const panneauScoreJ1 = this.add.rectangle(76, 175, 152, 56, 0x111827, 0.8)  //par "panneau", on designe le rectangle sur lequel se trouve les éléments d'UI correspondant
      .setStrokeStyle(2, 0x3bd5f0, 0.7)
      .setScrollFactor(0);
    const panneauBallesJ1 = this.add.rectangle(76, 96, 152, 64, 0x111827, 0.8)
      .setStrokeStyle(2, 0xc9a326, 0.7)
      .setScrollFactor(0);
    const panneauVieJ1 = this.add.rectangle(76, 26, 152, 48, 0x111827, 0.8)
      .setStrokeStyle(2, 0x3bd5f0, 0.7)
      .setScrollFactor(0);
    //élements de l'UI du joueur 1
    player.iconeScore = this.add.image(30, 145, "Score").setDisplaySize(24, 24);
    player.iconeScore.setScale(2); //permet d'agrandir l'image directement dans le code.
    player.iconeScore.setOrigin(0.5, 0); //setOrigin définit le point d'ancrage a partir duquel l'image peut etre modifié (donc déplacée, redimensionée...) 
    player.iconeScore.setScrollFactor(0); //setScrollFactor fixe l'objet a sa position pour qu'il ne soit pas affécté par le scrolling de la caméra.
    score_J1_affiche = this.add.text(64, 160, String(player.score), { fontSize: '32px', fill: '#3bd5f0'}); //en ajoutant le nombre a coté de l'icone correspondante, on pourra comprendre a quoi correspond ce nombre en jeu. Par exemple, ici il s'agit du nombre qui gère le score du joueur 1).
    score_J1_affiche.setScrollFactor(0); //permet de faire en sorte que le texte (ou autre élément chosi) reste fixe sur l'écran.
    player.iconeRecharge = this.add.image(32, 74, "bullet_icone").setDisplaySize(24, 24); //setDisplaySize définit la taille rendue à l'écran d'un objet en pixels
    player.iconeRecharge.setScale(1.5);
    player.iconeRecharge.setOrigin(0.5, 0);
    player.iconeRecharge.setScrollFactor(0);
    balle_restanteJ1_affiche = this.add.text(64, 85, String(player.balle_restante), { fontSize: '32px', fill: '#c9a326'});
    balle_restanteJ1_affiche.setScrollFactor(0); //permet de faire en sorte que le texte (ou autre élément chosi) reste fixe sur l'écran.
    balle_restanteJ1_affiche.setScrollFactor(0); //permet de faire en sorte que le texte (ou autre élément chosi) reste fixe sur l'écran.
    player.barreVie = this.add.sprite(70, 10, "pv_bar", player.points_vies); //note : cet élément d'UI possède plusieurs frames et est donc un sprite. Par rapport aux autres, on l'importe en tant que sprite.
    player.barreVie.setScale(2.2);
    player.barreVie.setOrigin(0.5, 0);
    player.barreVie.setScrollFactor(0);
    
    
    

    //élements de l'UI du joueur 2
    let panneauxJ2 = [];
    if (mode_deux_joueurs){
      const panneauScoreJ2 = this.add.rectangle(556, 175, 152, 56, 0x111827, 0.8)
        .setStrokeStyle(2, 0xf03b3b, 0.7)
        .setScrollFactor(0);
      const panneauBallesJ2 = this.add.rectangle(556, 96, 152, 64, 0x111827, 0.8)
        .setStrokeStyle(2, 0x571881, 0.7)
        .setScrollFactor(0);
      const panneauVieJ2 = this.add.rectangle(556, 26, 152, 48, 0x111827, 0.8)
        .setStrokeStyle(2, 0xf03b3b, 0.7)
        .setScrollFactor(0);
      panneauxJ2 = [panneauScoreJ2, panneauBallesJ2, panneauVieJ2];
      player2.iconeScore = this.add.image(510, 145, "Score").setDisplaySize(24, 24);
      player2.iconeScore.setScale(2.2);
      player2.iconeScore.setOrigin(0.5, 0);
      player2.iconeScore.setScrollFactor(0);
      score_J2_affiche = this.add.text(544, 160, String(player2.score), { fontSize: '32px', fill: '#f03b3b' });
      score_J2_affiche.setScrollFactor(0)
      player2.iconeRecharge = this.add.image(512, 74, "bullet_icone").setDisplaySize(24, 24);
      player2.iconeRecharge.setScale(1.5);
      player2.iconeRecharge.setOrigin(0.5, 0);
      player2.iconeRecharge.setScrollFactor(0);
      balle_restanteJ2_affiche = this.add.text(544, 85, String(player2.balle_restante), { fontSize: '32px', fill: '#571881'});
      balle_restanteJ2_affiche.setScrollFactor(0);
      player2.barreVie = this.add.sprite(550, 10, "pv_bar2", player2.points_vies);
      player2.barreVie.setScale(2);
      player2.barreVie.setOrigin(0.5, 0);
      player2.barreVie.setScrollFactor(0);
    }
    //elements UI global
    const panneauTimer = this.add.rectangle(640, 32, 160, 56, 0x111827, 0.8)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setScrollFactor(0);
    const panneauCles = this.add.rectangle(640, 100, 160, 56, 0x111827, 0.8)
      .setStrokeStyle(2, 0xcd50ff, 0.7)
      .setScrollFactor(0);
    timerIcon = this.add.image(600, 32, "timer_icone").setDisplaySize(32, 32);
    timerIcon.setScrollFactor(0);
    temps_restant_affiche = this.add.text(628, 14, String(temps_restant), {fontSize: '32px', fill: '#ffffff'});
    temps_restant_affiche.setScrollFactor(0);
    nombreCleIcon = this.add.image(600, 100, "nombre_cle_icone").setDisplaySize(16, 32);
    nombreCleIcon.setScrollFactor(0);
    nombreCleIcon.setScale(1.2);
    cles_restantes_affiche = this.add.text(628, 82, String(cles_restantes), { fontSize: '32px', fill: '#cd50ff' });
    cles_restantes_affiche.setScrollFactor(0);


    /*************************************
     *  CREATION DES SONS *
     *************************************/
    son_feu = this.sound.add('coupDeFeu');
    musique_niveau1 = this.sound.add('MusiqueNiveau1');
    musique_niveau1.play({ loop: true });
    son_blesse = this.sound.add('blesse')
    son_areignne_blesse = this.sound.add('areignee_blesse')
    son_cle = this.sound.add('cle_collecte')

    /***********************
     *  CREATION DU CLAVIER ET TOUCHES *
     ************************/
    clavier = this.input.keyboard.createCursorKeys(); //on importe les touches curseurs, le reste étant installé après cette ligne.

    //touches Joueur 1
      J1Haut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP); //Phaser.Input.Keyboard.addKey.[...] représente la touche a associer (en l'occurence l'une des touche directionelle) par ce on ne peut pas associer une touche de direction a une variable comme les autres touches et qu'on doit donc utiliser cette méthode
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
     * AJOUT DES ENNEMIS                             *
     ************************************************/
    
    groupe_araignee = this.physics.add.group();
    this.physics.add.collider(groupe_araignee, calque_mur);
    tableau_ennemis = cfg.ennemis; //défini dans parametres_niveau()
     const nombre_appels_apparition = Math.max( //on rassemble le nombre d'élément total que l'on shouaiterais ici.
      nombre_ennemis_apparaissant,
      nombre_cles,
      nombre_recharges_apparaissant,
      nombre_soins_apparaissant
    );
    for (let i = 0; i < nombre_appels_apparition; i++){ //on essaie de faire apparaitre tous les éléments en appelant apparaitre_element plusieurs fois, autant de fois qu'il y'a d'éléments a faire apparaitre au total.
      apparition_elements();
    }
    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS(+ ignorance de la caméra) *
     ******************************************************/
    this.physics.add.collider(player, groupe_cle, recuperer_cle, null, this);
    this.physics.add.overlap(player,groupe_recharges,recharger,null,this);
    this.physics.add.overlap(player,groupe_soin,soigner,null,this);
    if (mode_deux_joueurs) {
      this.physics.add.collider(player,player2);
      this.physics.add.collider(player2, groupe_recharges, recharger, null, this);
      this.physics.add.collider(player2,groupe_soin,soigner,null,this);
      this.physics.add.overlap(player2, groupe_cle, recuperer_cle, null, this);
    }
    player.colliderEnnemis = this.physics.add.collider(player, groupe_araignee, degat_contact_ennemi, null, this);
    if (mode_deux_joueurs) {
      player2.colliderEnnemis = this.physics.add.collider(player2, groupe_araignee, degat_contact_ennemi, null, this);
    }
    this.physics.add.overlap(groupeBullets, groupe_araignee, Elimination_ennemi, null, this);
    //gestion des éléments ignorés par la caméra
    hudJ1 = [ //représente tous les éléments du hud (ou de l'UI) de la camJ1. Organisé comme ceci pour plus de clareté.
      panneauScoreJ1, panneauBallesJ1, panneauVieJ1,
      score_J1_affiche, player.iconeScore, balle_restanteJ1_affiche, player.iconeRecharge, player.barreVie
    ];
    if (mode_deux_joueurs){
      hudJ2 = [
        ...panneauxJ2,
        score_J2_affiche, player2.iconeScore, balle_restanteJ2_affiche, player2.iconeRecharge, player2.barreVie
      ];
    }
    else{
      hudJ2 = []
    }
    hudCommun = [
      panneauTimer, panneauCles,
      temps_restant_affiche, timerIcon, cles_restantes_affiche, nombreCleIcon
    ];
    camJ1.ignore([...hudJ1, ...hudJ2, ...hudCommun]);
    camJ1UI.ignore(hudJ2);
    if (mode_deux_joueurs) {
      camJ2.ignore([...hudJ1, ...hudJ2, ...hudCommun]);
      camJ2UI.ignore([...hudJ1, panneauTimer, panneauCles, temps_restant_affiche, timerIcon, cles_restantes_affiche, nombreCleIcon]);
    }
      camGlobalUI.ignore([...hudJ1, ...hudJ2]);
    }
  

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

  update() {
    //gestion indépendante des points de vie (au cas ou on voudrait ajouter une option pour soigner)
    player.barreVie.setFrame(player.points_vies); //défini le numero de frame par rapport au nombre de point de vie restant. Très pratique pour une gestion indépendante.
    if (mode_deux_joueurs) {
      player2.barreVie.setFrame(player2.points_vies);
      gerer_cameras();
    }
    deplacement_areignee.call(this);
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

    if (Phaser.Input.Keyboard.JustDown(J1Interaction) && sortie_ouverte && this.physics.overlap(player, porte)) {
      aller_niveau_suivant.call(this);
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

    if (Phaser.Input.Keyboard.JustDown(J2Interaction) && sortie_ouverte && this.physics.overlap(player2, porte)) {
      aller_niveau_suivant.call(this);
    }
    }
  }
}
/************************************************************************/
/**FONCTIONS DU JEU **/
/************************************************************************/

function gerer_cameras() { //ici on gère plus précisément l'écart entre les joueurs 1 et 2 en mode deux joueurs et on définit quand séparer les deux caméras. Cette fonction sert donc a utiliser les fonctions séprare_cameras et fusionner_cameras
  const distance = Phaser.Math.Distance.Between(player.x, player.y, player2.x, player2.y);

  // deux seuils différents pour prévenir le clignotement a la limite
  if (camerasFusionnees && distance > 300) {
    separer_cameras();
  } else if (!camerasFusionnees && distance < 250) {
    fusionner_cameras();
  }

  if (camerasFusionnees) {
    cibleCamera.setPosition((player.x + player2.x) / 2, (player.y + player2.y) / 2);
  }
}

function fusionner_cameras() { //sert a "fusionner" les deux caméras. On donne l'impression de fusion en "maquant" la camera du joueur 2 (donc on ne l'affiche plus, cachant aussi sa vision), puis en agrandissant le champ de la camera du joueur1 ni plus ni moins. On indique aussi a la camera de suivre le point qui servira de nouveau focus pour pouvoir voir les deux joueurs.
  camerasFusionnees = true;
  camJ1.setViewport(0, 0, 1280, 720);
  camJ1.startFollow(cibleCamera, true, 0.1, 0.1);
  camJ2.setVisible(false);
}

function separer_cameras() { //par rapport a fusionner_camera, on réactive la seconde camera de droite et on redéfinit la première camera a ses proportions normales.
  camerasFusionnees = false;
  camJ1.setViewport(0, 0, 1280 / 2, 720);
  camJ1.startFollow(player, true, 0.1, 0.1);
  camJ2.setVisible(true);
}

function deplacement_areignee() { //définit le comportement de l'areignée, un des ennemis du jeu.
  const joueurs = mode_deux_joueurs ? [player, player2] : [player];
  groupe_araignee.children.iterate((ennemi) => {
    if (!ennemi || !ennemi.active || !ennemi.body) {
      return;
    }
    if (ennemi.comportement === "rodeur") {
      comportement_rodeur.call(this, ennemi, joueurs);
      return;
    }
    let joueur_cible = null;
    let distance_min_areignee = Infinity;
    joueurs.forEach((joueur) => {
      if (!joueur || !joueur.active) {
        return;
      }
      const distance_areignee = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, joueur.x, joueur.y);
      if (distance_areignee < distance_min_areignee) {
        distance_min_areignee = distance_areignee;
        joueur_cible = joueur;
      }
    });

    if (joueur_cible && distance_min_areignee <= 250) {
      this.physics.moveToObject(ennemi, joueur_cible, 70);
    } else {
      ennemi.setVelocity(0, 0);
    }
  });
}



function apparition_elements() { //la fonction la plus complexe. Elle sert a faire apparaitre tous les éléments du jeu sauf les joueurs dans la carte. Pour cela, elle fait apparaitre les éléments individuellements par catégorie dans l'ordre de présentation du code.
  if (cles_creees < nombre_cles && groupe_cle.countActive(true) < nombre_cles && tableau_spawn.length > 0) { //partie des clés. Aussi, a chaque vérfication de chaques parties,
    const typeCle = Phaser.Utils.Array.GetRandom([ //tableau qui contient les trois clés avec leur animations et leur score. Permet de les organiser plus facilement. Ici on en selectionne une clé aléatoire et on la met dans le tableur TypeCle.
      { texture: "cle_bronze", animation: "animation_cle_bronze", score: 500 },
      { texture: "cle_argent", animation: "animation_cle_argent", score: 500 },
      { texture: "cle_or", animation: "animation_cle_or", score: 800 }
    ]);
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn); //la ligne la plus importante. Celle-ci définit une position en prenant au hasard une des coordonées du tableau tableau_spawn.
    cle = groupe_cle.create(position.x, position.y, typeCle.texture); //comment on selectionne les clés aléatoirement, on a deja par défaut une texture, animation et score associé a TypeCle que l'on peut deja sortir du tableur.
    cle.score = typeCle.score;
    cles_creees += 1;
    cle.anims.play(typeCle.animation, true); 
    camJ1UI.ignore(cle);
    camGlobalUI.ignore(cle);
    if (mode_deux_joueurs) {
      camJ2.ignore(cle);
      camJ2UI.ignore(cle);
    }
  }
  if (groupe_soin.countActive(true) < nombre_soins_apparaissant && tableau_spawn.length > 0) {
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    const medkit = groupe_soin.create(position.x, position.y, "soin");
    medkit.anims.play("animation_soin", true);
    camJ1UI.ignore(medkit);
    camGlobalUI.ignore(medkit);
    if (mode_deux_joueurs) {
      camJ2UI.ignore(medkit);
    }
  }
  if (groupe_recharges.countActive(true) < nombre_recharges_apparaissant && tableau_spawn.length > 0) { //partie des recharges
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    const recharge = groupe_recharges.create(position.x, position.y, "recharge");
    recharge.anims.play("recharge", true);
    camJ1UI.ignore(recharge);
    camGlobalUI.ignore(recharge);
    if (mode_deux_joueurs) {
      camJ2UI.ignore(recharge);
    }
  }
  if (groupe_araignee.countActive(true) < nombre_ennemis_apparaissant && tableau_spawn.length > 0) { //partie des ennemis
    const definition = Phaser.Utils.Array.GetRandom(tableau_ennemis);
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    const ennemi = groupe_araignee.create(position.x, position.y, definition.texture);
    ennemi.points_vies = definition.points_vies;
    ennemi.degats = definition.degats;
    ennemi.score = definition.score;
    ennemi.comportement = definition.comportement || "poursuite"; //"poursuite" (araignée) ou "rodeur" (renard)
    ennemi.degats_au_contact = definition.degats_au_contact !== false; //false : ne blesse que par son attaque
    ennemi.animation_marche = definition.animation;
    ennemi.animation_attaque = definition.animation_attaque;
    ennemi.rayon = definition.rayon_detection;
    ennemi.vitesse = definition.vitesse || 45;
    ennemi.delai_impact = definition.delai_impact || 500; //ms après le début de l'attaque avant que le coup touche
    ennemi.duree_attaque = definition.duree_attaque || 900; //ms : durée totale de l'attaque, après quoi il reprend sa balade (indépendant de l'animation)
    ennemi.texture_marche = definition.texture;
    ennemi.etat = "balade";
    ennemi.prochaine_attaque = 0;
    ennemi.prochain_changement = 0;
    ennemi.anims.play(definition.animation, true);
    camJ1UI.ignore(ennemi);
    camGlobalUI.ignore(ennemi);
    if (mode_deux_joueurs) {
      camJ2UI.ignore(ennemi);
    }
  }
}

function degat_contact_ennemi(player, ennemi, attaque = false) {
  if (ennemi.degats_au_contact === false && !attaque) { //le renard ne blesse pas en simple contact, seulement avec son attaque
    return;
  }
  if (player.points_vies <= 0 || this.time.now < player.prochaineDegat) { //si le prochain degat déclenché par l'ennemi  est supérieur aux PV actuels de la cible (donc le joueur), on ne declenche pas la fonctions.
    return;
  }
  player.points_vies = Math.max(0, player.points_vies - ennemi.degats);
  player.prochaineDegat = this.time.now + 1000;
  player.colliderEnnemis.active = false; //on desactive la colision du joueur avec l'ennemi pour le rendre invincible.
  this.tweens.add({ //fait clignoter le joueur pour indiquer qu'il est invincible
    targets: player,
    alpha: 0.2,
    duration: 100,
    yoyo: true,
    repeat: 4,
    onComplete: () => {
      player.setAlpha(1);
      if (!player.active) { 
        return;
      }
      player.colliderEnnemis.active = true;
      if (this.physics.overlap(player, ennemi)) { //permet de faire en sorte que le joueur continue de prendre des dégats même si il est sur l'ennemi et pas en contact.
        player.prochaineDegat = this.time.now;
        degat_contact_ennemi.call(this, player, ennemi);
      }
    }
  });
    }
      function recharger(player,recharge) {
        if (player.enRechargement || player.balle_restante == player.balle_max) {
          return;
        }
        recharge.destroy();
        player.enRechargement = true; //cette valeure permettra de faire en sorte de définir quand le joueur recharge pour pouvoir empecher de réactiver la fonction losrque le joueur est en train de deja l'activer.
        player.peutTirer = false;
        const texteBalles = player === player2 ? balle_restanteJ2_affiche : balle_restanteJ1_affiche;
        texteBalles.setText('!');
        texteBalles.setColor('#f1c489');
        this.tweens.add({
          targets: texteBalles,
          alpha: 0.2,
          duration: 150,
          yoyo: true,
          repeat: 4
        });
        this.time.delayedCall(1500, () => {
          player.balle_restante = player.balle_max;
          player.enRechargement = false;
          player.peutTirer = true;
          texteBalles.setAlpha(1);
          texteBalles.setText(String(player.balle_restante));
        });
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
            if (player.direction == 'left'){
              player.anims.play("anim_attaque_gauche_J1",true);
              bullet = groupeBullets.create(player.x + (25 * coefDir), player.y, 'animation_balle_gauche');
            }
            else{
              player.anims.play("anim_attaque_droite_J1",true);
              bullet = groupeBullets.create(player.x + (25 * coefDir), player.y, 'animation_balle_droite');
            }
          }
          if (player.direction == 'up' || player.direction == 'down'){
            if (player.direction == 'up'){
              player.anims.play("anim_attaque_haut_J1",true);
              bullet = groupeBullets.create(player.x , player.y + (25 * coefDir), 'animation_balle_haut');
            }
            else{
              player.anims.play("anim_attaque_bas_J1",true);
              bullet = groupeBullets.create(player.x , player.y + (25 * coefDir), 'animation_balle_bas');
            }
          }
          bullet.anims.play(bullet.texture.key);
          bullet.tireur = player;
          camJ1UI.ignore(bullet); //on est obligé d'ignorer les balles a ce moment la car elle sont crées qu'a ce moment la.
          camGlobalUI.ignore(bullet);
          if (mode_deux_joueurs) {
            camJ2UI.ignore(bullet);
          }
          if (player.direction == 'left' || player.direction == 'right'){
          bullet.setVelocity(500 * coefDir, 0);
        }
        if (player.direction == 'up' || player.direction == 'down'){
          bullet.setVelocity(0, 500 * coefDir); //on met les coordonées inverse pour que la balle aille en haut ou en bas au lieu de la gauche ou la droite
        }
          son_feu.play();
          player.balle_restante -= 1;
          const balleRestanteText = player === player2 ? balle_restanteJ2_affiche : balle_restanteJ1_affiche;
          balleRestanteText.setText(String(player.balle_restante));
          player.peutTirer = false;

       var timerTirOk = this.time.delayedCall(800,
           function () {
            player.peutTirer = true;
           },
           null,this);
           //partie reservée a détruire le bullet si il est actif plus de 3 secondes.
      this.time.delayedCall((1000), () => { 
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
      function Elimination_ennemi(bullet, ennemi){ //gère le contact entre ennemi et balle et leur elimination
        const tireur = bullet.tireur;
        bullet.destroy();
        ennemi.points_vies -= 1;
        son_areignne_blesse.play();
        ennemi.setTintFill(0xff0000);
        this.time.delayedCall(150, () => {
          if (ennemi.active) {
            ennemi.clearTint();
          }
        });
        if (ennemi.points_vies <= 0){
          ennemi.destroy();
          if (tireur){ //défini simplement qui est le tireur
            tireur.score += ennemi.score;
            const scoreText = tireur === player2 ? score_J2_affiche : score_J1_affiche;
            scoreText.setText(String(tireur.score));
          }
        }
      };
    function recuperer_cle(player, cle){ //définit ce qu'il se passe au contact d'une clé par le joueur. Devrait etre modifié plus tard une fois qu'on a remplacé les clés avec des objets de score pour ne plus inclure le second joueur (puisque lui ne pourra ramasser que des objets qui donne des points dans son propre mode)
        player.score += cle.score; //voir score définit dans le tableau de la fonction apparition_element pour plus de clareté?
        const scoreText = player === player2 ? score_J2_affiche : score_J1_affiche;
        scoreText.setText(String(player.score));
        son_cle.play();
        cles_restantes -= 1;
        cle.destroy();
        cles_restantes_affiche.setText(String(cles_restantes));
        if (cles_creees >= nombre_cles && groupe_cle.countActive(true) == 0){
        porte.anims.play("animation_porte_ouverte");
        sortie_ouverte = true;
        }
      }
      function soigner(cible, objet) {
        if (cible.points_vies >= 5) {
          return;
        }
        else{
          cible.points_vies = Math.min(cible.points_vies + 2, 5);
          objet.destroy();
       }
      }; 

function aller_niveau_suivant() { //arrête la musique puis lance le niveau défini dans parametres_niveau() en lui transmettant les scores
  musique_niveau1.stop();
  this.scene.start(this.cfg.niveau_suivant, {
    scoreJ1: player.score,
    scoreJ2: mode_deux_joueurs ? player2.score : 0,
    temps_restant
  });
}

function comportement_rodeur(ennemi, joueurs) { //se balade au hasard ; attaque sur place si un joueur entre dans son rayon, sans jamais le poursuivre
  if (ennemi.etat === "attaque") {
    ennemi.setVelocity(0, 0);
    return;
  }
  const maintenant = this.time.now;
  let cible = null;
  let distance_min = Infinity;
  joueurs.forEach((joueur) => {
    if (!joueur || !joueur.active || joueur.points_vies <= 0) {
      return;
    }
    const distance = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, joueur.x, joueur.y);
    if (distance < distance_min) {
      distance_min = distance;
      cible = joueur;
    }
  });
  if (cible && distance_min <= ennemi.rayon && maintenant >= ennemi.prochaine_attaque) {
    attaque_rodeur.call(this, ennemi, cible, joueurs);
    return;
  }
  //balade : on change de direction toutes les 1,5 à 3,5 s, ou tout de suite si on est bloqué par un mur
  const bloque = !ennemi.body.blocked.none || !ennemi.body.touching.none;
  if (maintenant >= ennemi.prochain_changement || bloque) {
    ennemi.prochain_changement = maintenant + Phaser.Math.Between(1500, 3500);
    if (Phaser.Math.Between(0, 100) < 30) { //une fois sur trois environ, il s'arrête un moment
      ennemi.setVelocity(0, 0);
      ennemi.anims.play(ennemi.animation_marche, true); //même animation à l'arrêt qu'en marchant
    } else {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      ennemi.setVelocity(Math.cos(angle) * ennemi.vitesse, Math.sin(angle) * ennemi.vitesse);
      ennemi.setFlipX(ennemi.body.velocity.x < 0); //suppose que le sprite regarde vers la droite par défaut
      ennemi.anims.play(ennemi.animation_marche, true);
    }
  }
}

function attaque_rodeur(ennemi, cible, joueurs) {
  ennemi.etat = "attaque";
  ennemi.setVelocity(0, 0);
  ennemi.setFlipX(cible.x < ennemi.x);
  ennemi.anims.play(ennemi.animation_attaque, true);
  if (!this.anims.exists(ennemi.animation_attaque)) {
    console.error("Animation d'attaque introuvable : " + ennemi.animation_attaque);
  }
  this.time.delayedCall(ennemi.duree_attaque, () => { //fin de l'attaque : retour à la balade après un temps de repos
    if (!ennemi.active) {
      return;
    }
    ennemi.etat = "balade";
    ennemi.prochaine_attaque = this.time.now + 1500;
    ennemi.prochain_changement = 0;
  });
  this.time.delayedCall(ennemi.delai_impact, () => { //le coup touche en plein milieu de l'animation : tout joueur encore dans le rayon est blessé
    if (!ennemi.active || ennemi.etat !== "attaque") {
      return;
    }
    joueurs.forEach((joueur) => {
      if (joueur && joueur.active && Phaser.Math.Distance.Between(ennemi.x, ennemi.y, joueur.x, joueur.y) <= ennemi.rayon) {
        degat_contact_ennemi.call(this, joueur, ennemi, true);
      }
    });
  });
}