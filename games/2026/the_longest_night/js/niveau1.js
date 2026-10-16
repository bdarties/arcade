import {creer_hud, maj_timer, COULEURS_HUD } from "./hud.js";
import {
  ajouter_son,
  gerer_cameras,
  fusionner_cameras,
  deplacement_areignee,
  apparition_elements,
  degat_contact_ennemi,
  recharger,
  tirer,
  Elimination_ennemi,
  recuperer_cle,
  soigner,
  aller_niveau_suivant,
  preparer_faucheuse,
  apparition_faucheuse,
  deplacement_faucheuse,
  terminer_match,
  points_spawn_libres,
  detruire
} from "./fonctions.js";
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
var son_joueur_blesse;
var son_areignne_blesse;
var son_soin;
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

const niveauState = {
  get player() { return player; }, set player(value) { player = value; },
  get player2() { return player2; }, set player2(value) { player2 = value; },
  get mode_deux_joueurs() { return mode_deux_joueurs; }, set mode_deux_joueurs(value) { mode_deux_joueurs = value; },
  get camerasFusionnees() { return camerasFusionnees; }, set camerasFusionnees(value) { camerasFusionnees = value; },
  get camGlobalUI() { return camGlobalUI; }, set camGlobalUI(value) { camGlobalUI = value; },
  get camJ1() { return camJ1; }, set camJ1(value) { camJ1 = value; },
  get camJ1UI() { return camJ1UI; }, set camJ1UI(value) { camJ1UI = value; },
  get camJ2() { return camJ2; }, set camJ2(value) { camJ2 = value; },
  get camJ2UI() { return camJ2UI; }, set camJ2UI(value) { camJ2UI = value; },
  get cibleCamera() { return cibleCamera; }, set cibleCamera(value) { cibleCamera = value; },
  get cle() { return cle; }, set cle(value) { cle = value; },
  get cles_creees() { return cles_creees; }, set cles_creees(value) { cles_creees = value; },
  get cles_restantes() { return cles_restantes; }, set cles_restantes(value) { cles_restantes = value; },
  get cles_restantes_affiche() { return cles_restantes_affiche; }, set cles_restantes_affiche(value) { cles_restantes_affiche = value; },
  get fin_de_partie() { return fin_de_partie; }, set fin_de_partie(value) { fin_de_partie = value; },
  get faucheuse() { return faucheuse; }, set faucheuse(value) { faucheuse = value; },
  get groupe_araignee() { return groupe_araignee; }, set groupe_araignee(value) { groupe_araignee = value; },
  get groupeBullets() { return groupeBullets; }, set groupeBullets(value) { groupeBullets = value; },
  get groupe_cle() { return groupe_cle; }, set groupe_cle(value) { groupe_cle = value; },
  get groupe_recharges() { return groupe_recharges; }, set groupe_recharges(value) { groupe_recharges = value; },
  get groupe_soin() { return groupe_soin; }, set groupe_soin(value) { groupe_soin = value; },
  get murs() { return murs; }, set murs(value) { murs = value; },
  get musique_niveau1() { return musique_niveau1; }, set musique_niveau1(value) { musique_niveau1 = value; },
  get nombre_cles() { return nombre_cles; }, set nombre_cles(value) { nombre_cles = value; },
  get nombre_ennemis_apparaissant() { return nombre_ennemis_apparaissant; }, set nombre_ennemis_apparaissant(value) { nombre_ennemis_apparaissant = value; },
  get nombre_recharges_apparaissant() { return nombre_recharges_apparaissant; }, set nombre_recharges_apparaissant(value) { nombre_recharges_apparaissant = value; },
  get nombre_soins_apparaissant() { return nombre_soins_apparaissant; }, set nombre_soins_apparaissant(value) { nombre_soins_apparaissant = value; },
  get porte() { return porte; }, set porte(value) { porte = value; },
  get score_J1_affiche() { return score_J1_affiche; }, set score_J1_affiche(value) { score_J1_affiche = value; },
  get score_J2_affiche() { return score_J2_affiche; }, set score_J2_affiche(value) { score_J2_affiche = value; },
  get son_areignne_blesse() { return son_areignne_blesse; }, set son_areignne_blesse(value) { son_areignne_blesse = value; },
  get son_cle() { return son_cle; }, set son_cle(value) { son_cle = value; },
  get son_feu() { return son_feu; }, set son_feu(value) { son_feu = value; },
  get son_joueur_blesse() { return son_joueur_blesse; }, set son_joueur_blesse(value) { son_joueur_blesse = value; },
  get son_soin() { return son_soin; }, set son_soin(value) { son_soin = value; },
  get sortie_ouverte() { return sortie_ouverte; }, set sortie_ouverte(value) { sortie_ouverte = value; },
  get spawns_complets() { return spawns_complets; }, set spawns_complets(value) { spawns_complets = value; },
  get tableau_ennemis() { return tableau_ennemis; }, set tableau_ennemis(value) { tableau_ennemis = value; },
  get tableau_spawn() { return tableau_spawn; }, set tableau_spawn(value) { tableau_spawn = value; },
  get temps_restant() { return temps_restant; }, set temps_restant(value) { temps_restant = value; },
  get balle_restanteJ1_affiche() { return balle_restanteJ1_affiche; }, set balle_restanteJ1_affiche(value) { balle_restanteJ1_affiche = value; },
  get balle_restanteJ2_affiche() { return balle_restanteJ2_affiche; }, set balle_restanteJ2_affiche(value) { balle_restanteJ2_affiche = value; },
};

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
      temps: 90,
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
    //chargement des assets images :
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
    // chargement des audios
    this.load.audio("coupDeFeu", "./assets/musique_et_sons/shoot.mp3");
    this.load.audio("MusiqueNiveau1", "./assets/musique_et_sons/musique_niveau1.mp3");
    this.load.audio("blesse", "./assets/musique_et_sons/blesse.mp3");
    this.load.audio("areignee_blesse", "./assets/musique_et_sons/areignee_blesse.mp3");
    this.load.audio("cle_collecte", "./assets/musique_et_sons/cle_collecte.wav");
    this.load.audio("areignee_morte", "./assets/musique_et_sons/areignee_morte.mp3");
    this.load.audio("Grognement_renard", "./assets/musique_et_sons/Grognement_renard.wav");
    this.load.audio("moniteur_coeur", "./assets/musique_et_sons/moniteur_coeur.wav");
    this.load.audio("Musique_Game_Over", "./assets/musique_et_sons/Musique_Game_Over.mp3");
    this.load.audio("Musique_menu", "./assets/musique_et_sons/Musique_menu.mp3");
    this.load.audio("musique_niveau2", "./assets/musique_et_sons/musique_niveau2.mp3");
    this.load.audio("Musique_Victoire", "./assets/musique_et_sons/Musique_Victoire.mp3");
    this.load.audio("Porte_ouverte", "./assets/musique_et_sons/Porte_ouverte.wav");
    this.load.audio("recharge_magique", "./assets/musique_et_sons/recharge_magique.wav");
    this.load.audio("renard_blesse", "./assets/musique_et_sons/renard_blesse.wav");
    this.load.audio("renard_mort", "./assets/musique_et_sons/renard_mort.wav");
    this.load.audio("soin_bandage", "./assets/musique_et_sons/soin_bandage.wav");

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
    this.gameState = niveauState;
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
    this.gameState.calque_mur = calque_mur;
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
        maj_timer(temps_restant_affiche, temps_restant);
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
          const elementsActifs = [groupe_cle, groupe_recharges, groupe_soin, groupe_araignee]
            .some((groupe) => groupe.countActive(true) > 0);
          if (elementsActifs) {
            return;
          }

          tableau_spawn = points_spawn_libres.call(this);
          for (let i = 0; i < nombre_appels_apparition; i++) {
            apparition_elements.call(this);
          }
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
      fusionner_cameras.call(this);
    } else {
      camJ1.setViewport(0, 0, 1280, 720);
      camJ2.setVisible(false);
    }
    /************************************
     * ELEMENTS DE L'UI
    ************************************/

    const hud = creer_hud(this, player, mode_deux_joueurs ? player2 : null, { temps: temps_restant, cles: cles_restantes });
    score_J1_affiche = hud.j1.score;
    balle_restanteJ1_affiche = hud.j1.balles;
    player.barreVie = hud.j1.barreVie;
    if (mode_deux_joueurs) {
      score_J2_affiche = hud.j2.score;
      balle_restanteJ2_affiche = hud.j2.balles;
      player2.barreVie = hud.j2.barreVie;
    }
    temps_restant_affiche = hud.commun.temps;
    cles_restantes_affiche = hud.commun.cles;

    /*************************************
     *  CREATION DES SONS *
     *************************************/
    son_feu = ajouter_son(this, 'coupDeFeu');
    musique_niveau1 = ajouter_son(this, 'MusiqueNiveau1');
    musique_niveau1.play({ loop: true });
    son_joueur_blesse = ajouter_son(this, 'blesse');
    son_areignne_blesse = ajouter_son(this, 'areignee_blesse');
    son_cle = ajouter_son(this, 'cle_collecte');

    son_soin = ajouter_son(this,'soin_bandage')


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
      apparition_elements.call(this);
    }
    /*****************************************************
     *  GESTION DES INTERACTIONS ENTRE GROUPES ET ELEMENTS (+ ignorance de la caméra) *
     ******************************************************/
 this.gameState.murs = calque_mur; // la faucheuse en a besoin pour ne pas traverser les murs
    this.physics.add.collider(player, groupe_cle, recuperer_cle, null, this);
    this.physics.add.overlap(player, groupe_recharges, recharger, null, this);
    this.physics.add.overlap(player, groupe_soin, soigner, null, this);
    player.colliderEnnemis = this.physics.add.collider(player, groupe_araignee, degat_contact_ennemi, null, this);
    if (mode_deux_joueurs) {
      this.physics.add.collider(player, player2);
      this.physics.add.overlap(player2, groupe_recharges, recharger, null, this);
      this.physics.add.overlap(player2, groupe_soin, soigner, null, this);
      this.physics.add.overlap(player2, groupe_cle, recuperer_cle, null, this);
      player2.colliderEnnemis = this.physics.add.collider(player2, groupe_araignee, degat_contact_ennemi, null, this);
    }
    this.physics.add.overlap(groupeBullets, groupe_araignee, Elimination_ennemi, null, this);

    //gestion des éléments ignorés par la caméra
    hudJ1 = hud.j1.objets;
    hudJ2 = hud.j2 ? hud.j2.objets : [];
    hudCommun = hud.commun.objets;
    if (mode_deux_joueurs) { //en compétitif il n'y a pas de "clés restantes" : seuls les scores comptent
      hud.commun.objetsCles.forEach((o) => o.setVisible(false));
    }
    camJ1.ignore([...hudJ1, ...hudJ2, ...hudCommun]);
    camJ1UI.ignore([...hudJ2, ...hudCommun]);
    if (mode_deux_joueurs) {
      camJ2.ignore([...hudJ1, ...hudJ2, ...hudCommun]);
      camJ2UI.ignore([...hudJ1, ...hudCommun]);
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
      gerer_cameras.call(this);
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
