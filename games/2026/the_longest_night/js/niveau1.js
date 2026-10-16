/***********************************************************************/
/** VARIABLES GLOBALES
/***********************************************************************/
var mode_fantome = false; //permet de traverser les murs pour tester plus vite. Les autres collisions restent actives.
var player; // désigne le sprite du joueur 1
var player2;
var clavier;
var J1Haut, J1Bas, J1Gauche, J1Droite, J1boutonFeu, J1Interaction; //touches du joueur 1
var J2Haut, J2Bas, J2Gauche, J2Droite, J2boutonFeu, J2Interaction; //touches du joueur 2
var player_spawn; //endroit d'apparition du joueur 1
var player2_spawn; //endroit d'apparition du joueur 2
var tableau_spawn; //tableau qui réunit tous les points de spawn (lus dans Tiled)
var nombre_elements;
var nombre_cles; //nombre de clés à chercher dans le niveau
var cles_creees = 0; //combien de clés ont été créées pendant leur placement
var mode_deux_joueurs = true; //false = mode histoire (1 joueur), true = mode compétitif (2 joueurs)
var groupe_cle;
var cle;
var hudJ1; //éléments d'UI du joueur 1
var hudJ2; //éléments d'UI du joueur 2
var hudCommun; //éléments d'UI communs (timer, clés)
var groupeBullets;
var groupe_araignee;
var tableau_ennemis;
var groupe_recharges;
var groupe_soin;
var porte_spawn;
var porte;
var araignee;
var vies;
var cles_restantes;
var son_feu;
var nombre_ennemis_apparaissant;
var nombre_recharges_apparaissant;
var nombre_soins_apparaissant;
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
var timerIcon;
var nombreCleIcon;
var son_blesse;
var son_areignne_blesse;
var son_cle;
var cles_restantes_affiche;
var temps_restant;
var temps_restant_affiche;
var camerasFusionnees = true;
var cibleCamera;
var gagnant;
var sortie_ouverte = false;
var gameOver = false;
var murs; //le calque des murs (sert aux collisions de la faucheuse)
var faucheuse = null; //reste null tant que le timer n'est pas arrivé à 0
var fin_de_partie = false; //passe à true quand tous les joueurs sont morts
var spawns_complets = []; //copie de TOUS les points de spawn (tableau_spawn se vide au fur et à mesure)

/** CORRECTIF : ajoute un son SANS planter si le fichier est introuvable (404, mauvais nom...).
 *  Si le son manque, on renvoie un faux son silencieux et la console affiche lequel manque. */
function ajouter_son(scene, cle_son) {
  if (scene.cache.audio.exists(cle_son)) {
    return scene.sound.add(cle_son);
  }
  console.error("Son manquant (vérifie le nom du fichier dans assets/musique_et_sons/) : " + cle_son);
  return { play() {}, stop() {}, isPlaying: false };
}

// définition de la classe "selection"
export default class niveau1 extends Phaser.Scene {
  constructor(cle = "niveau1") {
    super({ key: cle }); // niveau2 hérite de cette classe et passe sa propre clé
  }

  init(data) {
    this.donnees = data || {}; // scores transmis par le niveau précédent (vide pour le niveau 1)
    mode_deux_joueurs = this.donnees.mode === 2; //mode 1 = histoire, mode 2 = compétitif
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
      spawn_depuis_tiled: true,
      player_spawn: {},
      player2_spawn: {},
      tableau_spawn: [],
      porte_spawn: { x: 600, y: 414 },
      ennemis: [{
        nom: "groupe_araignee",
        texture: "areignee_ennemie",
        animation: "animation_areignee",
        points_vies: 3,
        degats: 1,
        score: 100
      }],
      // LA FAUCHEUSE : apparaît quand le timer arrive à 0 et tue les joueurs. Mettre "faucheuse: null" pour la désactiver.
      faucheuse: {
        marche:  { fichier: "./assets/enemies/faucheuse.png",         largeur: 96, hauteur: 96, images: 4,  pieds: { x: 31, y: 88 } },
        attaque: { fichier: "./assets/enemies/faucheuse_attaque.png", largeur: 96, hauteur: 96, images: 13, pieds: { x: 31, y: 88 } },
        vitesse: 400,
        hitbox: 20,
        distance_min: 230,
        distance_max: 300,
        delai_avant_charge: 1800,
        portee_attaque: 50,
        portee_coup: 70,
        delai_impact: 300,
        duree_attaque: 650,
        pause_apres_attaque: 400
      },
      scene_mort: "Ecran_score",
      niveau_suivant: "niveau2",
      competitif: { //réglages du mode 2 joueurs
        temps: 90,
        cles_simultanees: 3,
        nombre_ennemis: 5,
        delai_reapparition: 4000
      }
    };
  }


  /***********************************************************************/
  /** FONCTION PRELOAD
/***********************************************************************/

  preload() {
    const baseURL = this.sys.game.config.baseURL;

    this.load.setBaseURL(baseURL);

    // CORRECTIF : affiche dans la console le fichier exact qui n'a pas pu être chargé
    this.load.on("loaderror", (fichier) => console.error("Échec de chargement :", fichier.src));

    this.load.image("Phaser_tuileGood", "./assets/map/tileset_good.png");
    const cfg_carte = this.parametres_niveau();
    this.load.tilemapTiledJSON(cfg_carte.carte_cle, cfg_carte.carte_fichier);
    if (cfg_carte.faucheuse) { //images de la faucheuse de CE niveau
      ["marche", "attaque"].forEach((type) => {
        this.load.image("img_faucheuse_" + type + "_" + this.scene.key, cfg_carte.faucheuse[type].fichier);
      });
    }
    this.load.image("img_background", "./assets/arriere_plan.jpg");
    this.load.image("player1", "./assets/player_1/joueur1_image.png");
    this.load.image("player2", "./assets/player_2/joueur2_image.png");
    this.load.image("sortie_fermee", "./assets/door.png");
    this.load.image("Score", "./assets/UI/score_icon.png");
    this.load.image("timer_icone", "./assets/UI/timer_icon.png");
    this.load.image("bullet_icone", "./assets/UI/bullet_icon.png");
    this.load.image("nombre_cle_icone", "./assets/UI/trousseau.png");
    this.load.audio("coupDeFeu", "./assets/musique_et_sons/shoot.mp3");
    this.load.audio("MusiqueNiveau1", "./assets/musique_et_sons/musique_niveau1.mp3");
    this.load.audio("blesse", "./assets/musique_et_sons/blesse.mp3");
    // ⚠ Ces deux fichiers renvoyaient une 404 : le nom ci-dessous doit être IDENTIQUE à celui du dossier
    this.load.audio("areignee_blesse", "./assets/musique_et_sons/areigne_blesse.mp3");
    this.load.audio("cle_collecte", "./assets/musique_et_sons/cle_collecte.mp3");

    /* CHARGEMENT DES ANIMATIONS DES JOUEURS (même chose que l'ancien code, mais en boucle) */
    const types_fichier = { attente: "idle", course: "run", attaque: "attack" };
    const dir_fichier = { bas: "down", droite: "right", gauche: "left", haut: "up" };
    ["J1", "J2"].forEach((joueur) => {
      const dossier = joueur === "J1" ? "player_1" : "player_2";
      const suffixe_fichier = joueur === "J1" ? "" : "_2";
      Object.keys(types_fichier).forEach((type) => {
        Object.keys(dir_fichier).forEach((dir) => {
          this.load.spritesheet(
            "anim_" + type + "_" + dir + "_" + joueur,
            "./assets/" + dossier + "/" + types_fichier[type] + "_" + dir_fichier[dir] + suffixe_fichier + ".png",
            { frameWidth: 32, frameHeight: 32 }
          );
        });
      });
    });

    //autres animations
    this.load.spritesheet("cle_bronze", "./assets/keys/Key_bronze.png", { frameWidth: 32, frameHeight: 64 });
    this.load.spritesheet("cle_argent", "./assets/keys/Key_silver.png", { frameWidth: 32, frameHeight: 64 });
    this.load.spritesheet("cle_or", "./assets/keys/Key_gold.png", { frameWidth: 32, frameHeight: 64 });
    this.load.spritesheet("areignee_ennemie", "./assets/enemies/araignee.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("pv_bar", "./assets/UI/pv_bar.png", { frameWidth: 64, frameHeight: 16 });
    this.load.spritesheet("pv_bar2", "./assets/UI/pv_bar_2.png", { frameWidth: 64, frameHeight: 16 });
    this.load.spritesheet("animation_balle_droite", "./assets/bullets/bullet_right.png", { frameWidth: 48, frameHeight: 16 });
    this.load.spritesheet("animation_balle_gauche", "./assets/bullets/bullet_left.png", { frameWidth: 48, frameHeight: 16 });
    this.load.spritesheet("animation_balle_haut", "./assets/bullets/bullet_up.png", { frameWidth: 16, frameHeight: 48 });
    this.load.spritesheet("animation_balle_bas", "./assets/bullets/bullet_down.png", { frameWidth: 16, frameHeight: 48 });
    this.load.spritesheet("animation_porte_ouverte", "./assets/door_open.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("soin", "./assets/buff/soin.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("recharge", "./assets/buff/recharge.png", { frameWidth: 32, frameHeight: 32 });
  }

  /***********************************************************************/
  /** FONCTION CREATE
/***********************************************************************/

  create() {

    //definition des paramètres du niveau
    const cfg = this.parametres_niveau();
    this.cfg = cfg;
    if (mode_deux_joueurs) { //mode compétitif : on remplace les réglages de l'histoire par ceux du bloc "competitif"
      cfg.temps = cfg.competitif.temps;
      cfg.nombre_cles = cfg.competitif.cles_simultanees;
      cfg.nombre_ennemis = cfg.competitif.nombre_ennemis;
      cfg.faucheuse = null; //pas de faucheuse : à la fin du chrono, le meilleur score gagne
    }
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

    if (!this.cache.tilemap.exists(cfg.carte_cle)) {
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
    const calque_sol = carteDuNiveau.createLayer("calque_sol", tileset);
    const calque_details = carteDuNiveau.createLayer("calque_details", tileset);
    const calque_mur = carteDuNiveau.createLayer("calque_mur", tileset);
    const liste_spawn = carteDuNiveau.getObjectLayer("calque_spawn");
    this.physics.world.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);

    player_spawn = cfg.player_spawn;
    player2_spawn = cfg.player2_spawn;
    tableau_spawn = cfg.tableau_spawn;

    if (liste_spawn) { //un point dont le nom contient "porte" ou "sortie" place la porte de sortie
      const point_porte = liste_spawn.objects.find((point) => /porte|sortie/.test((point.name || "").toLowerCase()));
      if (point_porte) {
        cfg.porte_spawn = { x: point_porte.x, y: point_porte.y };
      }
    }

    if (cfg.spawn_depuis_tiled) { //les coordonnées sont lues dans le calque d'objets "calque_spawn"
      if (!liste_spawn) {
        console.warn("Calque d'objets 'calque_spawn' introuvable dans " + cfg.carte_fichier + ". Calques d'objets trouvés : " + carteDuNiveau.objects.map((o) => o.name).join(", ") + ". Les coordonnées de parametres_niveau() sont utilisées.");
      } else {
        const autres_spawns = [];
        liste_spawn.objects.forEach((point) => {
          const nom = (point.name || "").toLowerCase();
          if (/(joueur|player|j)_?1/.test(nom)) {
            player_spawn = { x: point.x, y: point.y };
          } else if (/(joueur|player|j)_?2/.test(nom)) {
            player2_spawn = { x: point.x, y: point.y };
          } else if (/porte|sortie/.test(nom)) {
            cfg.porte_spawn = { x: point.x, y: point.y };
          } else {
            autres_spawns.push({ x: point.x, y: point.y }); //servent à faire apparaître clés, soins, recharges et ennemis
          }
        });
        if (autres_spawns.length > 0) {
          tableau_spawn = autres_spawns;
        }
        console.log("Spawns lus dans Tiled :", { player_spawn, player2_spawn, porte: cfg.porte_spawn, autres: tableau_spawn.length });
      }
    }

    /**************************
     * INSTALLATION DES ELEMENTS
    ***************************/
    groupeBullets = this.physics.add.group();
    spawns_complets = tableau_spawn.map((p) => ({ x: p.x, y: p.y }));
    porte = mode_deux_joueurs ? null : this.physics.add.staticSprite(cfg.porte_spawn.x, cfg.porte_spawn.y, "sortie_fermee"); //pas de porte en compétitif
    groupe_cle = this.physics.add.group();
    groupe_araignee = this.physics.add.group();
    groupe_recharges = this.physics.add.group();
    groupe_soin = this.physics.add.group();
    //le timer du jeu
    this.time.addEvent({
      delay: 1000,
      repeat: temps_restant - 1,
      callback: () => {
        temps_restant -= 1;
        temps_restant_affiche.setText(String(temps_restant));
        if (temps_restant <= 0 && mode_deux_joueurs) { //compétitif : le temps est écoulé, on compte les points
          terminer_match.call(this, "temps");
        } else if (temps_restant <= 0 && this.cfg.faucheuse) { //le temps est écoulé : la faucheuse arrive
          apparition_faucheuse.call(this);
        }
      }
    });
    if (mode_deux_joueurs) { //compétitif : on remet régulièrement clés, ennemis, soins et recharges sur des points libres
      this.time.addEvent({
        delay: cfg.competitif.delai_reapparition,
        loop: true,
        callback: () => {
          if (fin_de_partie) {
            return;
          }
          tableau_spawn = points_spawn_libres();
          apparition_elements();
        }
      });
    }


    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/
    //joueur 1
    player = this.physics.add.sprite(player_spawn.x, player_spawn.y, "player1");

    player.peutTirer = true;
    player.tirEnCours = false;
    player.enRechargement = false;
    player.balle_max = 10;
    player.balle_restante = player.balle_max;
    player.score = this.donnees.scoreJ1 ?? 0;
    player.points_vies = 5;
    player.prochaineDegat = 0;
    player.direction = "down";
    player.setCollideWorldBounds(true);
    calque_mur.setCollisionByProperty({ estSolide: true });
    murs = calque_mur;
    faucheuse = null; //remise à zéro à chaque (re)lancement du niveau
    fin_de_partie = false;
    if (cfg.faucheuse) {
      preparer_faucheuse.call(this);
    }
    if (!mode_fantome) {
      this.physics.add.collider(player, calque_mur);
    }
    //joueur 2
    if (mode_deux_joueurs == true) {
      player2 = this.physics.add.sprite(player2_spawn.x, player2_spawn.y, "player2");
      player2.peutTirer = true;
      player2.tirEnCours = false;
      player2.enRechargement = false;
      player2.balle_max = 10;
      player2.balle_restante = player2.balle_max;
      player2.score = this.donnees.scoreJ2 ?? 0;
      player2.points_vies = 5;
      player2.prochaineDegat = 0;
      player2.direction = "down";
      player2.setCollideWorldBounds(true);
      this.physics.add.collider(player2, calque_mur);
    }

    /***************************
     *  CREATION DES ANIMATIONS *
     ****************************/
    //animations des joueurs (J1 et J2, en boucle)
    ["J1", "J2"].forEach((joueur) => {
      ["bas", "droite", "gauche", "haut"].forEach((dir) => {
        this.anims.create({
          key: "anim_attente_" + dir + "_" + joueur,
          frames: this.anims.generateFrameNumbers("anim_attente_" + dir + "_" + joueur, { start: 0, end: 3 }),
          frameRate: 5,
          repeat: -1
        });
        this.anims.create({
          key: "anim_course_" + dir + "_" + joueur,
          frames: this.anims.generateFrameNumbers("anim_course_" + dir + "_" + joueur, { start: 0, end: 5 }),
          frameRate: 5,
          repeat: -1
        });
        this.anims.create({
          key: "anim_attaque_" + dir + "_" + joueur,
          frames: this.anims.generateFrameNumbers("anim_attaque_" + dir + "_" + joueur, { start: 0, end: 6 }),
          frameRate: 15,
          repeat: 0
        });
      });
    });

    //autres éléments à animation
    this.anims.create({
      key: "animation_cle_bronze",
      frames: this.anims.generateFrameNumbers("cle_bronze", { start: 0, end: 10 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "animation_cle_argent",
      frames: this.anims.generateFrameNumbers("cle_argent", { start: 0, end: 10 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "animation_cle_or",
      frames: this.anims.generateFrameNumbers("cle_or", { start: 0, end: 10 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "animation_areignee",
      frames: this.anims.generateFrameNumbers("areignee_ennemie", { start: 0, end: 7 }),
      frameRate: 3,
      repeat: -1
    });
    this.anims.create({
      key: "animation_balle_droite",
      frames: this.anims.generateFrameNumbers("animation_balle_droite", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: "animation_balle_gauche",
      frames: this.anims.generateFrameNumbers("animation_balle_gauche", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: "animation_balle_haut",
      frames: this.anims.generateFrameNumbers("animation_balle_haut", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({ // CORRECTIF : cette animation manquait (tirer vers le bas plantait)
      key: "animation_balle_bas",
      frames: this.anims.generateFrameNumbers("animation_balle_bas", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: "animation_porte_ouverte",
      frames: this.anims.generateFrameNumbers("animation_porte_ouverte", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "animation_soin",
      frames: this.anims.generateFrameNumbers("soin", { start: 0, end: 4 }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: "recharge",
      frames: this.anims.generateFrameNumbers("recharge", { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });


    /*****************************************************
     *  GESTION DE LA CAMERA *
     ******************************************************/
    //camera 1
    camJ1 = this.cameras.main;
    camJ1.setViewport(0, 0, 1280 / 2, 720);
    camJ1.startFollow(player, true, 0.1, 0.1);
    camJ1.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
    camJ1.setZoom(2);
    //Les caméras UI n'affichent que les UI des joueurs afin qu'elles ne soient pas affectées par le zoom des caméras normales.
    camJ1UI = this.cameras.add(0, 0, 1280 / 2, 720);
    camJ1UI.setScroll(0, 0);
    camJ1UI.ignore(this.children.list);
    //caméra joueur 2 (existe aussi en mode 1 joueur : avec camJ1 elle forme l'écran complet)
    camJ2 = this.cameras.add(1280 / 2, 0, 1280 / 2, 720);
    if (mode_deux_joueurs) {
      camJ2.startFollow(player2, true, 0.1, 0.1);
    }
    camJ2.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
    camJ2.setZoom(2);
    if (mode_deux_joueurs) {
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
    const panneauScoreJ1 = this.add.rectangle(76, 175, 152, 56, 0x111827, 0.8)
      .setStrokeStyle(2, 0x3bd5f0, 0.7)
      .setScrollFactor(0);
    const panneauBallesJ1 = this.add.rectangle(76, 96, 152, 64, 0x111827, 0.8)
      .setStrokeStyle(2, 0xc9a326, 0.7)
      .setScrollFactor(0);
    const panneauVieJ1 = this.add.rectangle(76, 26, 152, 48, 0x111827, 0.8)
      .setStrokeStyle(2, 0x3bd5f0, 0.7)
      .setScrollFactor(0);
    //éléments de l'UI du joueur 1
    player.iconeScore = this.add.image(30, 145, "Score").setDisplaySize(24, 24);
    player.iconeScore.setScale(2);
    player.iconeScore.setOrigin(0.5, 0);
    player.iconeScore.setScrollFactor(0);
    score_J1_affiche = this.add.text(64, 160, String(player.score), { fontSize: '32px', fill: '#3bd5f0' });
    score_J1_affiche.setScrollFactor(0);
    player.iconeRecharge = this.add.image(32, 74, "bullet_icone").setDisplaySize(24, 24);
    player.iconeRecharge.setScale(1.5);
    player.iconeRecharge.setOrigin(0.5, 0);
    player.iconeRecharge.setScrollFactor(0);
    balle_restanteJ1_affiche = this.add.text(64, 85, String(player.balle_restante), { fontSize: '32px', fill: '#c9a326' });
    balle_restanteJ1_affiche.setScrollFactor(0);
    player.barreVie = this.add.sprite(70, 10, "pv_bar", player.points_vies);
    player.barreVie.setScale(2.2);
    player.barreVie.setOrigin(0.5, 0);
    player.barreVie.setScrollFactor(0);

    //éléments de l'UI du joueur 2
    let panneauxJ2 = [];
    if (mode_deux_joueurs) {
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
      score_J2_affiche.setScrollFactor(0);
      player2.iconeRecharge = this.add.image(512, 74, "bullet_icone").setDisplaySize(24, 24);
      player2.iconeRecharge.setScale(1.5);
      player2.iconeRecharge.setOrigin(0.5, 0);
      player2.iconeRecharge.setScrollFactor(0);
      balle_restanteJ2_affiche = this.add.text(544, 85, String(player2.balle_restante), { fontSize: '32px', fill: '#571881' });
      balle_restanteJ2_affiche.setScrollFactor(0);
      player2.barreVie = this.add.sprite(550, 10, "pv_bar2", player2.points_vies);
      player2.barreVie.setScale(2);
      player2.barreVie.setOrigin(0.5, 0);
      player2.barreVie.setScrollFactor(0);
    }
    //éléments UI globaux
    const panneauTimer = this.add.rectangle(640, 32, 160, 56, 0x111827, 0.8)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setScrollFactor(0);
    const panneauCles = this.add.rectangle(640, 100, 160, 56, 0x111827, 0.8)
      .setStrokeStyle(2, 0xcd50ff, 0.7)
      .setScrollFactor(0);
    timerIcon = this.add.image(600, 32, "timer_icone").setDisplaySize(32, 32);
    timerIcon.setScrollFactor(0);
    temps_restant_affiche = this.add.text(628, 14, String(temps_restant), { fontSize: '32px', fill: '#ffffff' });
    temps_restant_affiche.setScrollFactor(0);
    nombreCleIcon = this.add.image(600, 100, "nombre_cle_icone").setDisplaySize(16, 32);
    nombreCleIcon.setScrollFactor(0);
    nombreCleIcon.setScale(1.2);
    cles_restantes_affiche = this.add.text(628, 82, String(cles_restantes), { fontSize: '32px', fill: '#cd50ff' });
    cles_restantes_affiche.setScrollFactor(0);


    /*************************************
     *  CREATION DES SONS *
     *  (CORRECTIF : ajouter_son ne plante plus si un fichier est manquant)
     *************************************/
    son_feu = ajouter_son(this, 'coupDeFeu');
    musique_niveau1 = ajouter_son(this, 'MusiqueNiveau1');
    musique_niveau1.play({ loop: true });
    son_blesse = ajouter_son(this, 'blesse');
    son_areignne_blesse = ajouter_son(this, 'areignee_blesse');
    son_cle = ajouter_son(this, 'cle_collecte');

    /***********************
     *  CREATION DU CLAVIER ET TOUCHES *
     ************************/
    clavier = this.input.keyboard.createCursorKeys();

    //touches Joueur 1
    J1Haut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
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

    this.physics.add.collider(groupe_araignee, calque_mur);
    tableau_ennemis = cfg.ennemis;
    const nombre_appels_apparition = Math.max(
      nombre_ennemis_apparaissant,
      nombre_cles,
      nombre_recharges_apparaissant,
      nombre_soins_apparaissant
    );
    for (let i = 0; i < nombre_appels_apparition; i++) {
      apparition_elements();
    }
    /*****************************************************
     *  GESTION DES INTERACTIONS ENTRE GROUPES ET ELEMENTS (+ ignorance de la caméra) *
     ******************************************************/
    this.physics.add.collider(player, groupe_cle, recuperer_cle, null, this);
    this.physics.add.overlap(player, groupe_recharges, recharger, null, this);
    this.physics.add.overlap(player, groupe_soin, soigner, null, this);
    if (mode_deux_joueurs) {
      this.physics.add.collider(player, player2);
      this.physics.add.collider(player2, groupe_recharges, recharger, null, this);
      this.physics.add.collider(player2, groupe_soin, soigner, null, this);
      this.physics.add.overlap(player2, groupe_cle, recuperer_cle, null, this);
    }
    player.colliderEnnemis = this.physics.add.collider(player, groupe_araignee, degat_contact_ennemi, null, this);
    if (mode_deux_joueurs) {
      player2.colliderEnnemis = this.physics.add.collider(player2, groupe_araignee, degat_contact_ennemi, null, this);
    }
    this.physics.add.overlap(groupeBullets, groupe_araignee, Elimination_ennemi, null, this);
    //gestion des éléments ignorés par la caméra
    hudJ1 = [
      panneauScoreJ1, panneauBallesJ1, panneauVieJ1,
      score_J1_affiche, player.iconeScore, balle_restanteJ1_affiche, player.iconeRecharge, player.barreVie
    ];
    if (mode_deux_joueurs) {
      hudJ2 = [
        ...panneauxJ2,
        score_J2_affiche, player2.iconeScore, balle_restanteJ2_affiche, player2.iconeRecharge, player2.barreVie
      ];
    }
    else {
      hudJ2 = [];
    }
    hudCommun = [
      panneauTimer, panneauCles,
      temps_restant_affiche, timerIcon, cles_restantes_affiche, nombreCleIcon
    ];
    if (mode_deux_joueurs) { //en compétitif il n'y a pas de "clés restantes" à afficher : seuls les scores comptent
      panneauCles.setVisible(false);
      nombreCleIcon.setVisible(false);
      cles_restantes_affiche.setVisible(false);
    }
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
    player.barreVie.setFrame(player.points_vies);
    if (mode_deux_joueurs) {
      player2.barreVie.setFrame(player2.points_vies);
      gerer_cameras();
    }
    deplacement_areignee.call(this);
    deplacement_faucheuse.call(this);
    //commandes joueur1
    player.setVelocity(0);
    if (J1Gauche.isDown) {
      player.direction = "left";
      player.setVelocityX(-160);
      if (!player.tirEnCours) {
        player.anims.playReverse("anim_course_gauche_J1", true); //playReverse évite les faux raccords entre l'animation de droite et de gauche
      }
    }
    else if (J1Droite.isDown) {
      player.direction = "right";
      player.setVelocityX(160);
      if (!player.tirEnCours) {
        player.anims.play("anim_course_droite_J1", true);
      }
    }
    else if (J1Haut.isDown) {
      player.direction = "up";
      player.setVelocityY(-160);
      if (!player.tirEnCours) {
        player.anims.play("anim_course_haut_J1", true);
      }
    }
    else if (J1Bas.isDown) {
      player.direction = "down";
      player.setVelocityY(160);
      if (!player.tirEnCours) {
        player.anims.play("anim_course_bas_J1", true);
      }
    }
    else {
      player.setVelocityX(0);
      player.setVelocityY(0);
      if (!player.tirEnCours) {
        if (player.direction == "down") {
          player.anims.play("anim_attente_bas_J1", true);
        }
        else if (player.direction == "up") {
          player.anims.play("anim_attente_haut_J1", true);
        }
        else if (player.direction == "left") {
          player.anims.playReverse("anim_attente_gauche_J1", true);
        }
        else if (player.direction == "right") {
          player.anims.play("anim_attente_droite_J1", true);
        }
      }
    }
    if (Phaser.Input.Keyboard.JustDown(J1boutonFeu)) {
      tirer.call(this, player);
    }

    if (Phaser.Input.Keyboard.JustDown(J1Interaction) && sortie_ouverte && this.physics.overlap(player, porte)) {
      aller_niveau_suivant.call(this);
    }
    //commandes joueur2
    if (mode_deux_joueurs) {
      player2.setVelocity(0);
      if (J2Gauche.isDown) {
        player2.direction = "left";
        player2.setVelocityX(-160);
        if (!player2.tirEnCours) { // CORRECTIF : testait player.tirEnCours
          player2.anims.playReverse("anim_course_gauche_J2", true);
        }
      }
      else if (J2Droite.isDown) {
        player2.direction = "right";
        player2.setVelocityX(160);
        if (!player2.tirEnCours) {
          player2.anims.play("anim_course_droite_J2", true);
        }
      }
      else if (J2Haut.isDown) {
        player2.direction = "up";
        player2.setVelocityY(-160);
        if (!player2.tirEnCours) {
          player2.anims.play("anim_course_haut_J2", true);
        }
      }
      else if (J2Bas.isDown) {
        player2.direction = "down";
        player2.setVelocityY(160);
        if (!player2.tirEnCours) {
          player2.anims.play("anim_course_bas_J2", true);
        }
      }
      else {
        player2.setVelocityX(0);
        player2.setVelocityY(0);
        if (!player2.tirEnCours) {
          if (player2.direction == "down") {
            player2.anims.play("anim_attente_bas_J2", true);
          }
          else if (player2.direction == "up") {
            player2.anims.play("anim_attente_haut_J2", true);
          }
          else if (player2.direction == "left") {
            player2.anims.playReverse("anim_attente_gauche_J2", true);
          }
          else if (player2.direction == "right") {
            player2.anims.play("anim_attente_droite_J2", true);
          }
        }
      }
      if (Phaser.Input.Keyboard.JustDown(J2boutonFeu)) {
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

function gerer_cameras() { //gère l'écart entre les joueurs 1 et 2 et décide quand séparer / fusionner les caméras
  const distance = Phaser.Math.Distance.Between(player.x, player.y, player2.x, player2.y);

  // deux seuils différents pour prévenir le clignotement à la limite
  if (camerasFusionnees && distance > 300) {
    separer_cameras();
  } else if (!camerasFusionnees && distance < 250) {
    fusionner_cameras();
  }

  if (camerasFusionnees) {
    cibleCamera.setPosition((player.x + player2.x) / 2, (player.y + player2.y) / 2);
  }
}

function fusionner_cameras() { //on masque la caméra J2 et on agrandit celle de J1, qui suit le point entre les deux joueurs
  camerasFusionnees = true;
  camJ1.setViewport(0, 0, 1280, 720);
  camJ1.startFollow(cibleCamera, true, 0.1, 0.1);
  camJ2.setVisible(false);
}

function separer_cameras() { //on réactive la caméra de droite et on remet celle de gauche à sa taille normale
  camerasFusionnees = false;
  camJ1.setViewport(0, 0, 1280 / 2, 720);
  camJ1.startFollow(player, true, 0.1, 0.1);
  camJ2.setVisible(true);
}

function deplacement_areignee() { //comportement des ennemis (araignée = poursuite, renard = rôdeur)
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



function apparition_elements() { //fait apparaître clés, soins, recharges et ennemis, chacun sur un point de spawn pris au hasard
  if (cles_creees < nombre_cles && groupe_cle.countActive(true) < nombre_cles && tableau_spawn.length > 0) {
    const typeCle = Phaser.Utils.Array.GetRandom([
      { texture: "cle_bronze", animation: "animation_cle_bronze", score: 500 },
      { texture: "cle_argent", animation: "animation_cle_argent", score: 500 },
      { texture: "cle_or", animation: "animation_cle_or", score: 800 }
    ]);
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    cle = groupe_cle.create(position.x, position.y, typeCle.texture);
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
  if (groupe_recharges.countActive(true) < nombre_recharges_apparaissant && tableau_spawn.length > 0) {
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    const recharge = groupe_recharges.create(position.x, position.y, "recharge");
    recharge.anims.play("recharge", true);
    camJ1UI.ignore(recharge);
    camGlobalUI.ignore(recharge);
    if (mode_deux_joueurs) {
      camJ2UI.ignore(recharge);
    }
  }
  if (groupe_araignee.countActive(true) < nombre_ennemis_apparaissant && tableau_spawn.length > 0) {
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
    ennemi.delai_impact = definition.delai_impact || 500;
    ennemi.duree_attaque = definition.duree_attaque || 900;
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
  if (player.points_vies <= 0 || this.time.now < player.prochaineDegat) {
    return;
  }
  player.points_vies = Math.max(0, player.points_vies - ennemi.degats);
  if (player.points_vies <= 0) { //plus de vie : le joueur meurt (en compétitif cela termine le match)
    tuer_joueur.call(this, player);
    return;
  }
  player.prochaineDegat = this.time.now + 1000;
  player.colliderEnnemis.active = false; //on désactive la collision avec l'ennemi pour rendre le joueur invincible un instant
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
      if (this.physics.overlap(player, ennemi)) { //le joueur continue de prendre des dégâts s'il reste sur l'ennemi
        player.prochaineDegat = this.time.now;
        degat_contact_ennemi.call(this, player, ennemi);
      }
    }
  });
}

function recharger(player, recharge) {
  if (player.enRechargement || player.balle_restante == player.balle_max) {
    return;
  }
  recharge.destroy();
  player.enRechargement = true; //empêche de relancer la fonction pendant qu'elle est déjà en cours
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

function tirer(player) {
  if (player.peutTirer == true && player.balle_restante > 0 && player.points_vies > 0) {
    var coefDir;
    let bullet;
    // CORRECTIF : on utilise les animations du bon joueur (J1 ou J2) et plus toujours celles de J1
    const suffixe = player === player2 ? "J2" : "J1";
    player.tirEnCours = true;
    player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      player.tirEnCours = false;
    });
    if (player.direction == 'left' || player.direction == 'up') {
      coefDir = -1;
    }
    else {
      coefDir = 1;
    }
    if (player.direction == 'left') {
      player.anims.play("anim_attaque_gauche_" + suffixe, true);
      bullet = groupeBullets.create(player.x + (25 * coefDir), player.y, 'animation_balle_gauche');
    }
    else if (player.direction == 'right') {
      player.anims.play("anim_attaque_droite_" + suffixe, true);
      bullet = groupeBullets.create(player.x + (25 * coefDir), player.y, 'animation_balle_droite');
    }
    else if (player.direction == 'up') {
      player.anims.play("anim_attaque_haut_" + suffixe, true);
      bullet = groupeBullets.create(player.x, player.y + (25 * coefDir), 'animation_balle_haut');
    }
    else {
      player.anims.play("anim_attaque_bas_" + suffixe, true);
      bullet = groupeBullets.create(player.x, player.y + (25 * coefDir), 'animation_balle_bas');
    }
    bullet.anims.play(bullet.texture.key);
    bullet.tireur = player;
    camJ1UI.ignore(bullet); //les balles sont créées en cours de jeu : on doit les faire ignorer à ce moment-là
    camGlobalUI.ignore(bullet);
    if (mode_deux_joueurs) {
      camJ2UI.ignore(bullet);
    }
    if (player.direction == 'left' || player.direction == 'right') {
      bullet.setVelocity(500 * coefDir, 0);
    }
    else {
      bullet.setVelocity(0, 500 * coefDir);
    }
    son_feu.play();
    player.balle_restante -= 1;
    const balleRestanteText = player === player2 ? balle_restanteJ2_affiche : balle_restanteJ1_affiche;
    balleRestanteText.setText(String(player.balle_restante));
    player.peutTirer = false;

    this.time.delayedCall(800, () => {
      if (!player.enRechargement) { //ne pas réautoriser le tir pendant un rechargement
        player.peutTirer = true;
      }
    });
    //détruit la balle si elle est encore active après 1 seconde
    this.time.delayedCall(1000, () => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
  }
  else if (player.balle_restante === 0) {
    const balleRestanteText = player === player2 ? balle_restanteJ2_affiche : balle_restanteJ1_affiche;
    balleRestanteText.setColor('rgb(192, 69, 69)');
  }
}

function Elimination_ennemi(bullet, ennemi) { //contact balle / ennemi
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
  if (ennemi.points_vies <= 0) {
    ennemi.destroy();
    if (tireur) {
      tireur.score += ennemi.score;
      const scoreText = tireur === player2 ? score_J2_affiche : score_J1_affiche;
      scoreText.setText(String(tireur.score));
    }
  }
}

function recuperer_cle(player, cle) { //contact joueur / clé
  player.score += cle.score;
  const scoreText = player === player2 ? score_J2_affiche : score_J1_affiche;
  scoreText.setText(String(player.score));
  son_cle.play();
  cle.destroy();
  if (mode_deux_joueurs) { //compétitif : la clé ne fait que rapporter des points puis réapparaît ailleurs
    cles_creees -= 1; //libère une place pour que apparition_elements() en recrée une
    return;
  }
  cles_restantes -= 1;
  cles_restantes_affiche.setText(String(cles_restantes));
  if (cles_creees >= nombre_cles && groupe_cle.countActive(true) == 0) {
    porte.anims.play("animation_porte_ouverte");
    sortie_ouverte = true;
  }
}

function soigner(cible, objet) {
  if (cible.points_vies >= 5) {
    return;
  }
  cible.points_vies = Math.min(cible.points_vies + 2, 5);
  objet.destroy();
}

function aller_niveau_suivant() { //arrête la musique puis lance le niveau suivant en lui transmettant les scores
  musique_niveau1.stop();
  this.scene.start(this.cfg.niveau_suivant, {
    scoreJ1: player.score,
    scoreJ2: mode_deux_joueurs ? player2.score : 0,
    temps_restant,
    mode: mode_deux_joueurs ? 2 : 1
  });
}

function comportement_rodeur(ennemi, joueurs) { //se balade au hasard ; attaque sur place si un joueur entre dans son rayon
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
      ennemi.anims.play(ennemi.animation_marche, true);
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
  this.time.delayedCall(ennemi.delai_impact, () => { //le coup touche en plein milieu de l'animation
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

/************************************************************************/
/** LA FAUCHEUSE                                                       **/
/** Quand le timer arrive à 0 : un message s'affiche, elle apparaît    **/
/** (invisible) près du joueur, puis elle fonce dessus et le tue.      **/
/************************************************************************/

function joueurs_vivants() { //liste des joueurs encore en vie
  const joueurs = mode_deux_joueurs ? [player, player2] : [player];
  return joueurs.filter((joueur) => joueur.points_vies > 0);
}

// 1) Prépare les images et les animations de la faucheuse (appelée une fois dans create)
function preparer_faucheuse() {
  const cfg = this.cfg.faucheuse;
  ["marche", "attaque"].forEach((type) => {
    const p = cfg[type];
    const cle = "faucheuse_" + type + "_" + this.scene.key; //ex : "faucheuse_marche_niveau2"
    if (!this.textures.exists(cle)) {
      // on recopie le PNG dans un canvas de la bonne taille puis on déclare chaque case (le PNG de marche du niveau 2 est rogné)
      const image = this.textures.get("img_" + cle).getSourceImage();
      const canvas = document.createElement("canvas");
      canvas.width = p.largeur * p.images;
      canvas.height = p.hauteur;
      canvas.getContext("2d").drawImage(image, 0, 0);
      const texture = this.textures.addCanvas(cle, canvas);
      for (let i = 0; i < p.images; i++) {
        texture.add(i, 0, i * p.largeur, 0, p.largeur, p.hauteur);
      }
    }
    if (!this.anims.exists(cle)) {
      this.anims.create({
        key: cle,
        frames: this.anims.generateFrameNumbers(cle, { start: 0, end: p.images - 1 }),
        frameRate: type === "marche" ? 8 : p.images / (cfg.duree_attaque / 1000), //l'attaque dure exactement duree_attaque
        repeat: type === "marche" ? -1 : 0
      });
    }
  });
}

// cherche un endroit sans mur à une distance comprise entre "min" et "max" du joueur
function place_libre_autour(joueur, min, max) {
  for (let essai = 0; essai < 50; essai++) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(min, max);
    const x = joueur.x + Math.cos(angle) * distance;
    const y = joueur.y + Math.sin(angle) * distance;
    const tuile = murs.getTileAtWorldXY(x, y);
    if (this.physics.world.bounds.contains(x, y) && !(tuile && tuile.collides)) {
      return { x: x, y: y };
    }
  }
  return { x: joueur.x, y: joueur.y }; //rien trouvé : on la met sur le joueur
}

// 2) Appelée quand le timer arrive à 0 : message + apparition de la faucheuse
function apparition_faucheuse() {
  const cfg = this.cfg.faucheuse;
  const vivants = joueurs_vivants();
  if (faucheuse || vivants.length === 0) {
    return;
  }

  // le message, au centre de l'écran (seule camGlobalUI l'affiche, les autres caméras l'ignorent)
  const message = this.add.text(640, 200, "LE TEMPS EST ÉCOULÉ...\nLA FAUCHEUSE ARRIVE !", {
    fontFamily: "Arial, sans-serif",
    fontSize: "40px",
    color: "#ff3b3b",
    align: "center",
    stroke: "#000000",
    strokeThickness: 6
  }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  camJ1.ignore(message);
  camJ2.ignore(message);
  camJ1UI.ignore(message);
  if (mode_deux_joueurs) {
    camJ2UI.ignore(message);
  }
  this.tweens.add({ targets: message, alpha: 0, delay: cfg.delai_avant_charge, duration: 600, onComplete: () => message.destroy() });
  camJ1.shake(600, 0.01);
  camJ2.shake(600, 0.01);

  // la faucheuse apparaît près du premier joueur vivant, mais invisible : on ne la voit pas arriver
  const position = place_libre_autour.call(this, vivants[0], cfg.distance_min, cfg.distance_max);
  faucheuse = this.physics.add.sprite(position.x, position.y, "faucheuse_marche_" + this.scene.key, 0);
  faucheuse.setDepth(50);
  faucheuse.setAlpha(0);
  faucheuse.body.setSize(cfg.hitbox, cfg.hitbox);
  poser_faucheuse.call(this, "marche", false);
  this.physics.add.collider(faucheuse, murs); //elle ne traverse pas les murs
  faucheuse.etat = "attente"; //"attente" -> "chasse" <-> "attaque"
  faucheuse.prochaine_attaque = 0;
  faucheuse.verif_coincee = 0;
  faucheuse.dernier_x = position.x;
  faucheuse.dernier_y = position.y;
  camJ1UI.ignore(faucheuse);
  camGlobalUI.ignore(faucheuse);
  if (mode_deux_joueurs) {
    camJ2UI.ignore(faucheuse);
  }

  const f = faucheuse;
  this.time.delayedCall(cfg.delai_avant_charge, () => { //la charge commence : elle devient visible et fonce
    if (f.active) {
      f.etat = "chasse";
      this.tweens.add({ targets: f, alpha: 1, duration: 200 });
    }
  });
}

// choisit la feuille (marche ou attaque) et le sens. On place l'origine du sprite sur les pieds de la cape
// et la hitbox dessus, sinon le dessin sauterait à chaque changement d'animation.
function poser_faucheuse(type, retournee) {
  const p = this.cfg.faucheuse[type];
  const hitbox = this.cfg.faucheuse.hitbox;
  if (faucheuse.pose !== type || faucheuse.flipX !== retournee) {
    faucheuse.pose = type;
    faucheuse.setFlipX(retournee);
    const pieds_x = retournee ? p.largeur - p.pieds.x : p.pieds.x; //une image retournée est inversée dans sa case : les pieds aussi
    faucheuse.setOrigin(pieds_x / p.largeur, p.pieds.y / p.hauteur);
    faucheuse.body.setOffset(pieds_x - hitbox / 2, p.pieds.y - hitbox);
  }
  faucheuse.anims.play("faucheuse_" + type + "_" + this.scene.key, true);
}

// 3) Appelée à chaque image (dans update) : la faucheuse fonce sur le joueur vivant le plus proche
function deplacement_faucheuse() {
  if (!faucheuse || !faucheuse.active || fin_de_partie) {
    return;
  }
  const cfg = this.cfg.faucheuse;
  const vivants = joueurs_vivants();
  if (faucheuse.etat !== "chasse" || vivants.length === 0) { //en attente ou en pleine attaque : elle ne bouge pas
    faucheuse.setVelocity(0, 0);
    return;
  }

  // le joueur le plus proche
  const moi = faucheuse.body.center;
  let cible = vivants[0];
  let distance = Infinity;
  vivants.forEach((joueur) => {
    const d = Phaser.Math.Distance.Between(moi.x, moi.y, joueur.body.center.x, joueur.body.center.y);
    if (d < distance) {
      distance = d;
      cible = joueur;
    }
  });
  poser_faucheuse.call(this, "marche", cible.body.center.x < moi.x); //elle regarde vers la droite par défaut : on la retourne si la cible est à gauche

  // assez proche : elle attaque
  if (distance <= cfg.portee_attaque && this.time.now >= faucheuse.prochaine_attaque) {
    attaque_faucheuse.call(this);
    return;
  }

  // coincée derrière un mur ? Toutes les 0,8 s on vérifie qu'elle a bougé, sinon elle réapparaît près du joueur
  if (this.time.now >= faucheuse.verif_coincee) {
    const deplacement = Phaser.Math.Distance.Between(faucheuse.x, faucheuse.y, faucheuse.dernier_x, faucheuse.dernier_y);
    if (deplacement < 15 && distance > 80) {
      const position = place_libre_autour.call(this, cible, 100, 180);
      faucheuse.body.reset(position.x, position.y);
    }
    faucheuse.dernier_x = faucheuse.x;
    faucheuse.dernier_y = faucheuse.y;
    faucheuse.verif_coincee = this.time.now + 800;
  }

  // elle fonce droit sur le joueur
  const angle = Phaser.Math.Angle.Between(moi.x, moi.y, cible.body.center.x, cible.body.center.y);
  faucheuse.setVelocity(Math.cos(angle) * cfg.vitesse, Math.sin(angle) * cfg.vitesse);
}

// 4) L'attaque : animation, puis le coup tue tout joueur à portée
function attaque_faucheuse() {
  const cfg = this.cfg.faucheuse;
  const f = faucheuse;
  f.etat = "attaque";
  f.setVelocity(0, 0);
  poser_faucheuse.call(this, "attaque", f.flipX);
  this.time.delayedCall(cfg.delai_impact, () => { //le coup arrive
    if (!f.active) {
      return;
    }
    joueurs_vivants().forEach((joueur) => {
      if (Phaser.Math.Distance.Between(f.body.center.x, f.body.center.y, joueur.body.center.x, joueur.body.center.y) <= cfg.portee_coup) {
        tuer_joueur.call(this, joueur);
      }
    });
  });
  this.time.delayedCall(cfg.duree_attaque, () => { //fin de l'attaque : elle repart à la chasse
    if (f.active) {
      f.etat = "chasse";
      f.prochaine_attaque = this.time.now + cfg.pause_apres_attaque;
    }
  });
}

// Mort d'un joueur : redirection directe vers l'écran de Game Over avec transmission des scores
function tuer_joueur(joueur, raison = "vie_J1") {
  joueur.points_vies = 0;
  joueur.body.enable = false;
  this.tweens.add({ targets: joueur, alpha: 0, duration: 400, onComplete: () => joueur.setVisible(false) });

  if (mode_deux_joueurs) {
    terminer_match.call(this, joueur === player ? "vie_J1" : "vie_J2");
    return;
  }

  if (joueurs_vivants().length === 0) {
    fin_de_partie = true;
    this.time.delayedCall(1500, () => {
      musique_niveau1.stop();
      this.scene.start("Game_over", {
        raison: raison,
        niveau: this.scene.key,
        scoreJ1: player.score,
        deux_joueurs: false
      });
    });
  }
}

// Fin d'un match compétitif (temps écoulé ou mort d'un joueur) -> écran de Game Over avec scores comparés
function terminer_match(raison) {
  if (fin_de_partie) {
    return;
  }
  fin_de_partie = true;
  this.physics.pause();
  
  this.time.delayedCall(1000, () => {
    musique_niveau1.stop();
    this.scene.start("Game_over", {
      raison: raison,
      niveau: this.scene.key,
      scoreJ1: player.score,
      scoreJ2: player2 ? player2.score : 0,
      deux_joueurs: true
    });
  });
}

function points_spawn_libres() { //renvoie les points de spawn ni occupés par un objet/ennemi, ni trop près d'un joueur
  const occupants = [groupe_cle, groupe_recharges, groupe_soin, groupe_araignee]
    .flatMap((groupe) => groupe.getChildren())
    .filter((objet) => objet.active);
  const joueurs = [player, player2];
  return spawns_complets.filter((point) =>
    occupants.every((o) => Phaser.Math.Distance.Between(o.x, o.y, point.x, point.y) > 24) &&
    joueurs.every((j) => Phaser.Math.Distance.Between(j.x, j.y, point.x, point.y) > 120)
  ).map((p) => ({ x: p.x, y: p.y }));
}