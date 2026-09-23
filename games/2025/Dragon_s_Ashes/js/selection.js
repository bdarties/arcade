import * as fct from "./fonctions.js";
import Ennemi, { EnnemiTireurSimple, Boss, Chevalier } from "./ennemi.js";

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier
var groupe_plateformes;
var boutonFeu;
var groupeBullets;

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

    this.load.audio("musique_jeu", "./assets/musique_jeu.ogg");
    this.load.audio("son_course", "./assets/course.ogg");
    this.load.audio("son_vol", "./assets/vol.ogg");
    this.load.audio("son_attaque", "./assets/attaque.ogg");
    this.load.audio("son_tir", "./assets/tir.ogg");
    this.load.audio("son_coffre", "./assets/coffre.ogg");
    this.load.audio("son_hit1", "./assets/hit1.ogg");
    this.load.audio("son_hit2", "./assets/hit2.ogg");
    this.load.audio("son_hit3", "./assets/hit3.ogg");
    this.load.audio("son_tir_ennemi", "./assets/tir_ennemi.ogg");
    this.load.audio("son_vie", "./assets/vie.ogg");
    this.load.audio("son_attaque_boss", "./assets/attaque_boss.ogg");
    this.load.audio("musique_boss", "./assets/musique_boss.ogg");
    
    // tous les assets du jeu sont placés dans le sous-répertoire src/assets/
    this.load.spritesheet("img_perso", "./assets/dragon_deplacement.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_repos_gauche", "./assets/dragon_pause_gauche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_repos_droite", "./assets/dragon_pause_droite.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_saut_droite", "./assets/dragon_saut_droite.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_saut_gauche", "./assets/dragon_saut_gauche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_tir_droite", "./assets/dragon_tir_droite.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_tir_gauche", "./assets/dragon_tir_gauche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_attaque_droite", "./assets/dragon_attaque_droite.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_attaque_gauche", "./assets/dragon_attaque_gauche.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("perso_attaque", "./assets/attaque.png", {
      frameWidth: 64,
      frameHeight: 62
    });
    this.load.spritesheet("img_magicien_droite", "./assets/magicien_droite.png", {
      frameWidth: 65,
      frameHeight: 80
    });
    this.load.spritesheet("img_magicien_gauche", "./assets/magicien_gauche.png", {
      frameWidth: 65,
      frameHeight: 80
    });
    this.load.spritesheet("img_chevalier_droite", "./assets/chevalier_droite.png", {
      frameWidth: 65,
      frameHeight: 80
    });
    this.load.spritesheet("img_chevalier_gauche", "./assets/chevalier_gauche.png", {
      frameWidth: 65,
      frameHeight: 80
    });

    this.load.spritesheet("bullet_gauche", "./assets/balle_gauche.png", {
      frameWidth: 30,
      frameHeight: 30
    });
    this.load.spritesheet("bullet_droite", "./assets/balle_droite.png", {
      frameWidth: 30,
      frameHeight: 30
    });
    this.load.spritesheet("bullet_ennemi_droite", "./assets/balle_droite_ennemi.png", {
      frameWidth: 30,
      frameHeight: 30
    });
    this.load.spritesheet("bullet_ennemi_gauche", "./assets/balle_gauche_ennemi.png", {
      frameWidth: 30,
      frameHeight: 30
    });
    this.load.spritesheet("img_boss", "./assets/boss_deplacement.png", {
      frameWidth: 150,
      frameHeight: 129
    });
    this.load.spritesheet("attaque_boss", "./assets/boss_attaque.png", {
      frameWidth: 158,
      frameHeight: 126
    });

    this.load.spritesheet("boss_attaque", "./assets/attaque_boss.png", {
      frameWidth: 50,
      frameHeight: 70
    });
    this.load.spritesheet("spikes", "./assets/pique.png", {
            frameWidth: 32,
            frameHeight: 32
        });
    this.load.spritesheet("anim_eau", "./assets/animeau1.png", {
            frameWidth: 96,
            frameHeight: 96
        });
    this.load.spritesheet("anim_lave", "./assets/animlave1.png", {
            frameWidth: 96,
            frameHeight: 96
        });
    this.load.image("coeur", "./assets/heart.png");
    this.load.image("img_chest1", "./assets/chest1.png");
    this.load.image("img_chest2", "./assets/chest2.png");
    this.load.image("img_jumpBonus", "./assets/vol.png");
    this.load.image("img_coeurplein", "./assets/coeurplein.png");
    this.load.image("img_coeurvide", "./assets/coeurvide.png");
    this.load.image("img_viecomplete", "./assets/viecomplete.png");
    this.load.image("img_vievide", "./assets/vievide.png");
    this.load.image("img_zone_boss", "./assets/zone_boss.png");
    this.load.image("img_panneau", "./assets/panneau_coffre.png");
    this.load.image("img_pause", "./assets/bouton_pause.png");
    this.load.image("img_commandePause", "./assets/commande_pause.png");

    // chargement tuiles de jeu
    this.load.image("background01", "./assets/background1.jpg");
    this.load.image("background02", "./assets/background2.jpg");
    this.load.image("background03", "./assets/background3.jpg");
    this.load.image("background04", "./assets/background4.jpg");
    this.load.image("background05", "./assets/background_5.jpg");
    this.load.image("Tuiles_Decors01", "./assets/TilsetdecorV1.png");
    this.load.image("Tuiles_Decors02", "./assets/tilsetdecorv2.png");
    this.load.image("Tuiles_Decors03", "./assets/tilsetdecorv3.png");
   
    this.load.image("anim_lave", "./assets/animLave.png");

// chargement de la carte
this.load.tilemapTiledJSON("carte", "./assets/map.json");  
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


    this.cameras.main.fadeIn(500, 0, 0, 0);
    /*************************************
     *  CREATION DU MONDE + PLATEFORMES  *
     *************************************/

    
  const carteDuNiveau = this.add.tilemap("carte");

// chargement du jeu de tuiles
const tilesetBackground01 = carteDuNiveau.addTilesetImage("background1", "background01");
const tilesetBackground02 = carteDuNiveau.addTilesetImage("background2", "background02");
const tilesetBackground03 = carteDuNiveau.addTilesetImage("background3", "background03");
const tilesetBackground04 = carteDuNiveau.addTilesetImage("background4", "background04");
const tilesetBackground05 = carteDuNiveau.addTilesetImage("background5", "background05");
const anim_lave    = carteDuNiveau.addTilesetImage("animLave", "anim_lave");
const anim_eau   = carteDuNiveau.addTilesetImage("animEau2", "anim_eau");
const tilesetDecors      = carteDuNiveau.addTilesetImage("Tuiles_Decors01", "Tuiles_Decors01");
const tilesetdecorsv2      = carteDuNiveau.addTilesetImage("Tuiles_Decors02", "Tuiles_Decors02");
const tilesetdecorsv3      = carteDuNiveau.addTilesetImage("Tuiles_Decors03", "Tuiles_Decors03");
const anim_pique     = carteDuNiveau.addTilesetImage("anim_pique", "anim_pique");
const calque_background01 = carteDuNiveau.createLayer(
  "calque_background01", 
  [tilesetBackground01, tilesetBackground02, tilesetBackground03, tilesetBackground04, tilesetBackground05], 
  0, // x
  0  // y
);
const calque_background02 = carteDuNiveau.createLayer("calque_background02", tilesetdecorsv2);
const calque_decors      = carteDuNiveau.createLayer("calque_decors", [tilesetDecors, tilesetdecorsv2, tilesetdecorsv3, anim_pique, anim_lave, anim_eau ],0,0);
const calque_decorations      = carteDuNiveau.createLayer("calque_decorations", [tilesetdecorsv2, tilesetDecors, tilesetdecorsv3, anim_pique, anim_lave, anim_eau ],0,0);



// Groupe unique pour tous les ennemis
this.groupeEnnemis = this.physics.add.group();

// --- Ennemis issus de la map JSON ---
const layerEnnemi = carteDuNiveau.getObjectLayer("Ennemi");
if (layerEnnemi) {
    const objetsEnnemis = layerEnnemi.objects;

    objetsEnnemis.forEach(obj => {
        let ennemi;
        const typeEnnemiProp = obj.properties.find(p => p.name === "type");
        const typeEnnemi = typeEnnemiProp ? typeEnnemiProp.value : "";

        switch (typeEnnemi) {
            case "chevalier":
                ennemi = new Chevalier(this, obj.x, obj.y, "img_chevalier_droite");
                break;
            case "magicien":
                ennemi = new EnnemiTireurSimple(this, obj.x, obj.y, "img_magicien_droite");
                break;
            case "roi":
                ennemi = new Boss(this, obj.x, obj.y, "img_boss"); // ou texture spécifique du boss
                break;
        }

        if (ennemi) {
            ennemi.calqueDecors = calque_decors; // passer le calque Tiled
            this.groupeEnnemis.add(ennemi);
        }
    });
} else {
    console.warn("⚠️ Aucun calque 'Ennemi' trouvé dans la carte !");
}

this.groupeBallesEnnemis = this.physics.add.group();


// --- Musique de fond ---
this.sound.stopAll(); // <-- essentiel

this.musiqueJeu = this.sound.add("musique_jeu", { loop: true, volume: 0.1 });
this.musiqueJeu.play();

    this.sonCourse = this.sound.add("son_course", { loop: true, volume: 0.3 });
    this.sonVol = this.sound.add("son_vol", { loop: true, volume: 0.5 });
    this.sonAttaque = this.sound.add("son_attaque", { volume: 0.4 });
    this.sonTir = this.sound.add("son_tir", { volume: 0.3 });
    this.sonCoffre = this.sound.add("son_coffre", { volume: 0.3 });
    this.sonHit1 = this.sound.add("son_hit1", { volume: 0.5 });
    this.sonHit2 = this.sound.add("son_hit2", { volume: 0.3 });
    this.sonHit3 = this.sound.add("son_hit3", { volume: 0.3 });
    this.sonTirEnnemi = this.sound.add("son_tir_ennemi", { volume: 0.2 });
    this.sonVie = this.sound.add("son_vie", { volume: 0.3 });
    this.sonAttaqueBoss = this.sound.add("son_attaque_boss", { volume: 0.3 });
    this.sonMusiqueBoss = this.sound.add("musique_boss", { loop: true, volume: 0.1 });

    // Sauvegarde des volumes initiaux
this.volumesInitiaux = {
    musiqueJeu: this.musiqueJeu.volume,
    sonCourse: this.sonCourse.volume,
    sonVol: this.sonVol.volume,
    sonAttaque: this.sonAttaque.volume,
    sonTir: this.sonTir.volume,
    sonCoffre: this.sonCoffre.volume,
    sonHit1: this.sonHit1.volume,
    sonHit2: this.sonHit2.volume,
    sonHit3: this.sonHit3.volume,
    sonTirEnnemi: this.sonTirEnnemi.volume,
    sonVie: this.sonVie.volume,
    sonAttaqueBoss: this.sonAttaqueBoss.volume,
    sonMusiqueBoss: this.sonMusiqueBoss.volume
};

    


    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/
    // On créée un nouveeau personnage : player
  player = this.physics.add.sprite(150, 8120, "img_perso");
  this.player = player;
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);
  player.setDepth(1); 
  player.direction = 'right';
  player.sonCourse = this.sonCourse;
  player.sonVol = this.sonVol;
  player.sonAttaque = this.sonAttaque;
  player.sonTir = this.sonTir;

  // PV et vies
  player.vies = 3;   // nombre de vies
  player.hp = 3;     // points de vie actuels
  player.invincible = false; // pour éviter les hits répétés

  // PV (points de vie)
this.groupPV = this.add.group();
for (let i = 0; i < 3; i++) {
    const coeur = this.add.image(25 + i * 70, 100, "img_coeurplein").setScrollFactor(0).setOrigin(0, 0);
    this.groupPV.add(coeur);
}

// Vies
this.groupVies = this.add.group();
for (let i = 0; i < 3; i++) {
    const vie = this.add.image(25 + i * 70, 16, "img_viecomplete").setScrollFactor(0).setOrigin(0, 0);
    this.groupVies.add(vie);
}

this.peutTirer = false; // le joueur ne peut pas tirer au début

this.add.image(1200, 16, "img_pause").setScrollFactor(0).setOrigin(0, 0);

this.groupe_plateformes = calque_decors;


// Zone de déclenchement du boss
this.zoneBoss = this.add.zone(2900, 1600, 300, 300); // x, y, largeur, hauteur
this.physics.add.existing(this.zoneBoss);
this.zoneBoss.body.setAllowGravity(false);
this.zoneBoss.body.setImmovable(true);

// Détection du joueur
this.physics.add.overlap(this.player, this.zoneBoss, () => {
    fct.activerZoneBoss(this);
});


    groupeBullets = this.physics.add.group();
    // affectation de la touche A à boutonFeu
    boutonFeu = this.input.keyboard.addKey('O');

    // affectation de la touche I au corps à corps
    this.toucheAttaque = this.input.keyboard.addKey('I');

    // affectation de la touche K à l'interaction
    this.toucheK = this.input.keyboard.addKey('K');

    // instructions pour les objets surveillés en bord de monde
    this.physics.world.on("worldbounds", function(body) {
        // on récupère l'objet surveillé
        var objet = body.gameObject;
        // s'il s'agit d'une balle
        if (groupeBullets.contains(objet)) {
            // on le détruit
            objet.destroy();
        }
    });

    
// Récupérer dimensions écran
let largeur = this.cameras.main.width;
let hauteur = this.cameras.main.height;

// --- Création du popup (70% de l'écran) ---
this.popupFond = this.add.rectangle(
    largeur / 2, 
    hauteur / 2, 
    largeur * 0.7, 
    hauteur * 0.7, 
    0x000000, 
    0.8
).setScrollFactor(0);


this.popupTexte = this.add.text(
    largeur / 2, 
    hauteur / 2, 
    "Vous avez trouvé un écrit de vos ancêtres !\n\n\nVous pouvez maintenant cracher du feu avec B. \n\n\n\n\n\nAppuyez sur D pour fermer le coffre.\n", 
    {
        fontFamily: "Typewriter",
        fontSize: "30px",
        fill: "#ffffff",
        align: "center",
        wordWrap: { width: largeur * 0.65 } // texte dans la zone
    }
).setOrigin(0.5).setScrollFactor(0);

// Masqué au départ
this.popupFond.setVisible(false);
this.popupTexte.setVisible(false);

this.popupActif = false;
this.popupFond.setDepth(1000);
this.popupTexte.setDepth(1001); // texte au-dessus du fond

// Bonus de saut infini
this.objetSaut = this.physics.add.staticSprite(2800, 3000, "img_jumpBonus");
this.sautsInfinis = false;
// --- Barre d'endurance pour le vol ---
this.enduranceMax = 100;
this.endurance = this.enduranceMax;
this.nbSautsVol = 0;
this.peutVoler = true;

// Création graphique
this.barreFond = this.add.rectangle(0, 0, 150, 15, 0x555555).setOrigin(0.5).setVisible(false);
this.barreEndurance = this.add.rectangle(0, 0, 148, 13, 0x00ff00).setOrigin(0.5).setVisible(false);
this.barreFond.setScrollFactor(0);
this.barreEndurance.setScrollFactor(0);
this.barreFond.setDepth(100);
this.barreEndurance.setDepth(101);
this.barreFond.alpha = 0;
this.barreEndurance.alpha = 0;
this.barreVisible = false;

// Popup
this.popupFondSaut = this.add.rectangle(
    this.cameras.main.width / 2,
    this.cameras.main.height / 2,
    this.cameras.main.width * 0.7,
    this.cameras.main.height * 0.7,
    0x000000,
    0.8
).setScrollFactor(0).setDepth(1000).setVisible(false);

this.popupTexteSaut = this.add.text(
    this.cameras.main.width / 2,
    this.cameras.main.height / 2,
    "Vos aventures vous ont endurcis, vous êtes maintenant prêt pour votre vengeance !\n\n\nVous pouvez maintenant voler en appuyant plusieurs fois sur C, mais gare à votre endurance. \n\n\n\n\n\nAppuyez sur D pour fermer la fenetre.\n",
    {
        fontFamily: "Typewriter",
        fontSize: "30px",
        fill: "#ffffff",
        align: "center",
        wordWrap: { width: this.cameras.main.width * 0.65 }
    }
).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setVisible(false);

this.popupSautActif = false;

// Collision joueur ↔ bonus saut
this.physics.add.overlap(this.player, this.objetSaut, () => {
    if (!this.sautsInfinis) {
        this.sautsInfinis = true;
        this.objetSaut.destroy(); // l’objet disparaît
        this.popupFondSaut.setVisible(true);
        this.popupTexteSaut.setVisible(true);
        this.popupSautActif = true;
        this.barreFond.setVisible(true);
        this.barreEndurance.setVisible(true);
    }
});


this.groupeObjets = this.physics.add.group();

this.imgPanneau = this.add.image(2205, 7017, "img_panneau");

// --- Création d'une zone autour du panneau ---
this.zonePanneau = this.add.zone(2205, 7017, 150, 100); // position et taille
this.physics.add.existing(this.zonePanneau);
this.zonePanneau.body.setAllowGravity(false);
this.zonePanneau.body.setImmovable(true);

// --- Création du texte ---
this.textePanneau = this.add.text(
    2205, 6940, // position du texte au-dessus du panneau
    "Appuyez sur D pour interagir", 
    {
        fontFamily: "Typewriter",
        fontSize: "26px",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: { x: 10, y: 5 }
    }
).setOrigin(0.5).setDepth(0.5).setVisible(false);

// --- Détection entrée/sortie du joueur ---
this.playerDansZonePanneau = false;

this.physics.add.overlap(this.player, this.zonePanneau, () => {
    if (!this.playerDansZonePanneau) {
        this.playerDansZonePanneau = true;
        this.textePanneau.setVisible(true);
    }
});


// Création de l’objet interactif
this.objetInteractif = this.physics.add.staticSprite(2275, 7018, "img_chest1");
this.objetInteractif.setDepth(0.5);
this.objetEtat = 1; // état courant (1 = image1, 2 = image2)

// Créer une zone de détection autour de l’objet
this.hitboxObjet = this.add.zone(this.objetInteractif.x, this.objetInteractif.y, 50, 50);
this.physics.add.existing(this.hitboxObjet);
this.hitboxObjet.body.setAllowGravity(false);
this.hitboxObjet.body.setImmovable(true);

// Collision <-> calque Tiled 
//this.physics.add.collider(player, calque_decors);
this.physics.add.collider(player, calque_decorations);
this.physics.add.collider(this.groupeEnnemis, calque_decors);

// Collision joueur <-> objets bonus
this.physics.add.overlap(player, this.groupeObjets, (playerObj, objet) => {
    this.sonVie.play();
    objet.destroy();
    if (playerObj.hp < 3) {
        playerObj.hp++;
        fct.updatePV.call(this); // ← mise à jour graphique via fonctions.js
    }
});


  // Collisions bullets <-> ennemis
  this.physics.add.overlap(groupeBullets, this.groupeEnnemis, (bullet, ennemi) => {
    bullet.destroy();
    ennemi.hit();
  });

  // Collision balles ↔ calque_decors : les balles disparaissent au contact du décor
this.physics.add.collider(groupeBullets, calque_decors, (bullet, tile) => {
    bullet.destroy();
});

this.physics.add.collider(this.groupeBallesEnnemis, calque_decors, (bullet, tile) => {
    bullet.destroy();
});

  // Collision joueur <-> ennemis
this.physics.add.collider(player, this.groupeEnnemis, (playerObj, ennemi) => {
    if (!playerObj.invincible) {
    this.sonHit1.play();
    playerObj.hp--;
    playerObj.invincible = true;
    playerObj.setTint(0xff0000);

    this.time.delayedCall(1000, () => {
        playerObj.clearTint();
        playerObj.invincible = false;
    });

    // Mise à jour affichage PV/Vies
    fct.updatePV.call(this);

    if (playerObj.hp <= 0) {
        playerObj.vies--;
        fct.updateVies.call(this);

        if (playerObj.vies > 0) {
            playerObj.hp = 3;
            fct.updatePV.call(this);
        } else {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.musiqueJeu.stop();
                this.scene.start("defaite");
            });
        }
    }
}
});

this.physics.add.overlap(player, this.groupeBallesEnnemis, (playerObj, balle) => {
    balle.destroy();
    if (!playerObj.invincible) {
        this.sonHit1.play();
        playerObj.hp--;
        playerObj.invincible = true;
        playerObj.setTint(0xff0000);

        this.time.delayedCall(1000, () => {
            playerObj.clearTint();
            playerObj.invincible = false;
        });

        fct.updatePV.call(this);

        if (playerObj.hp <= 0) {
            playerObj.vies--;
            fct.updateVies.call(this);

            if (playerObj.vies > 0) {
                playerObj.hp = 3;
                fct.updatePV.call(this);
            } else {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once("camerafadeoutcomplete", () => {
                    this.scene.start("defaite");
                });
            }
        }
    }
});

this.groupeAttaques = this.physics.add.group();

// Collision attaque <-> ennemis
this.physics.add.overlap(this.groupeAttaques, this.groupeEnnemis, (hitbox, ennemi) => {
    if (!ennemi.active) return;

    // Appliquer les dégâts → seulement si pas invincible
    const avaitHP = ennemi.hp;  
    ennemi.hit();

    // Si l'ennemi a vraiment perdu des PV → knockback
    if (ennemi.active && ennemi.hp < avaitHP) {
        const directionX = (player.direction === "right") ? 1 : -1;

        const forceX = 300 * directionX;  // poussée horizontale
        const forceY = -100;              // petit effet vertical

        ennemi.setVelocity(forceX, forceY);

        // Désactiver temporairement le tir si ennemi tireur
        if (ennemi instanceof EnnemiTireurSimple && ennemi.timer) {
            ennemi.timer.paused = true;
            this.time.delayedCall(500, () => {
                if (ennemi.active && ennemi.timer) {
                    ennemi.timer.paused = false;
                }
            });
        }
    }

    // Détruire la hitbox de l’attaque
    hitbox.destroy();
});

// Pause
this.menuPauseActif = false;
this.touchePause = this.input.keyboard.addKey('M');

// Fond sombre pour le menu pause
this.fondPause = this.add.rectangle(
    this.cameras.main.width / 2,
    this.cameras.main.height / 2,
    this.cameras.main.width * 1,
    this.cameras.main.height * 1,
    0x000000,
    0.9
)
.setScrollFactor(0)
.setDepth(1000)
.setVisible(false);

// Texte menu pause
this.textePause = this.add.text(
    this.cameras.main.width / 2,
    this.cameras.main.height / 3,
    "PAUSE\n\nAppuyez sur F pour reprendre",
    {
        fontFamily: "Typewriter",
        fontSize: "32px",
        color: "#ffffff",
        align: "center"
    }
)
.setOrigin(0.5)
.setScrollFactor(0)
.setDepth(1001)
.setVisible(false);

// Image commandes pause
this.imgCommandePause = this.add.image(
    this.cameras.main.width / 2,   // centre horizontal
    this.cameras.main.height / 2 + 100, // un peu en dessous du texte
    "img_commandePause"
)
.setOrigin(0.5)
.setScrollFactor(0)
.setDepth(1001)
.setVisible(false); // masquée au départ

   // définition des tuiles de plateformes qui sont solides
    // utilisation de la propriété estSolide
        calque_decors.setCollisionByProperty({ estSolide: true });
        calque_decorations.setCollisionByProperty({ estSolide: true });
    /***************************
     *  CREATION DES ANIMATIONS *
     ****************************/
    // dans cette partie, on crée les animations, à partir des spritesheet
    // chaque animation est une succession de frame à vitesse de défilement défini
    // une animation doit avoir un nom. Quand on voudra la jouer sur un sprite, on utilisera la méthode play()
    // creation de l'animation "anim_tourne_gauche" qui sera jouée sur le player lorsque ce dernier tourne à gauche
    this.anims.create({
      key: "anim_tourne_gauche", // key est le nom de l'animation : doit etre unique poru la scene.
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 0,
        end: 3
      }), // on prend toutes les frames de img perso numerotées de 0 à 3
      frameRate: 10, // vitesse de défilement des frames
      repeat: -1 // nombre de répétitions de l'animation. -1 = infini
    });

// Ajout des anims de repos
    this.anims.create({
        key: "anim_repos_gauche",
        frames: this.anims.generateFrameNumbers("perso_repos_gauche", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: "anim_repos_droite",
        frames: this.anims.generateFrameNumbers("perso_repos_droite", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
    });

    // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", {
        start: 4,
        end: 7
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
        key: "anim_saut_droite",
        frames: this.anims.generateFrameNumbers("perso_saut_droite", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
        key: "anim_saut_gauche",
        frames: this.anims.generateFrameNumbers("perso_saut_gauche", { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
    });

    this.anims.create({
    key: "anim_tir_droite",
    frames: this.anims.generateFrameNumbers("perso_tir_droite", { start: 0, end: 4 }),
    frameRate: 10,
    repeat: 0  // répétition unique
});

this.anims.create({
    key: "anim_tir_gauche",
    frames: this.anims.generateFrameNumbers("perso_tir_gauche", { start: 0, end: 4 }),
    frameRate: 10,
    repeat: 0  // répétition unique
});

this.anims.create({
    key: "anim_attaque_droite",
    frames: this.anims.generateFrameNumbers("perso_attaque_droite", { start: 0, end: 3 }),
    frameRate: 20,
    repeat: 0  // répétition unique
});

this.anims.create({
    key: "anim_attaque_gauche",
    frames: this.anims.generateFrameNumbers("perso_attaque_gauche", { start: 0, end: 3 }),
    frameRate: 20,
    repeat: 0  // répétition unique
});

this.anims.create({
    key: "anim_attaque",
    frames: this.anims.generateFrameNumbers("perso_attaque", { start: 0, end: 3 }),
    frameRate: 25,
    repeat: 0  // répétition unique
});

        // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
    this.anims.create({
      key: "magicien_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_magicien_droite", {
      }),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "magicien_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_magicien_gauche", {
      }),
      frameRate: 4,
      repeat: -1
    });
    
    this.anims.create({
      key: "chevalier_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_chevalier_droite", {
      }),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "chevalier_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_chevalier_gauche", {
      }),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: "balle_tir_droite",
      frames: this.anims.generateFrameNumbers("bullet_droite", {
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "balle_tir_gauche",
      frames: this.anims.generateFrameNumbers("bullet_gauche", {
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "ennemi_tir_gauche",
      frames: this.anims.generateFrameNumbers("bullet_ennemi_gauche", {
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "ennemi_tir_droite",
      frames: this.anims.generateFrameNumbers("bullet_ennemi_droite", {
      }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "boss_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_boss", {
        start: 0,
        end: 6
      }),
      frameRate: 7,
      repeat: -1
    });

    this.anims.create({
      key: "boss_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_boss", {
        start: 7,
        end: 13
      }),
      frameRate: 7,
      repeat: -1
    });

    this.anims.create({
      key: "boss_attaque_droite",
      frames: this.anims.generateFrameNumbers("attaque_boss", {
        start: 0,
        end: 3
      }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: "boss_attaque_gauche",
      frames: this.anims.generateFrameNumbers("attaque_boss", {
        start: 4,
        end: 7
      }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: "attaque_boss_droite",
      frames: this.anims.generateFrameNumbers("boss_attaque", {
        start: 0,
        end: 3
      }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: "attaque_boss_gauche",
      frames: this.anims.generateFrameNumbers("boss_attaque", {
        start: 4,
        end: 7
      }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
    key: "spikesAnim",
    frames: this.anims.generateFrameNumbers("spikes", { start: 0, end: 10
     }),
    frameRate: 6,
    repeat: -1
});

    this.anims.create({
    key: "anim_eauMortelle",
    frames: this.anims.generateFrameNumbers("anim_eau", { start: 0, end: 6 }),
    frameRate: 6,
    repeat: -1
});
    this.anims.create({
    key: "anim_laveMortelle",
    frames: this.anims.generateFrameNumbers("anim_lave", { start: 0, end: 9 }),
    frameRate: 6,
    repeat: -1
});

this.createAnimatedSpikes(calque_decors);
this.createAnimatedWater(calque_decorations);
this.createAnimatedLava(calque_decorations);

 
  


    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    // ceci permet de creer un clavier et de mapper des touches, connaitre l'état des touches
    clavier = this.input.keyboard.createCursorKeys();
    this.toucheSaut = this.input.keyboard.addKey('P');

    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
     ******************************************************/

    //  Collide the player and the groupe_etoiles with the groupe_plateformes
    this.physics.add.collider(player, calque_decors); 
    this.physics.world.setBounds(0, 0, 3200, 8320);
    //  ajout du champs de la caméra de taille identique à celle du monde
    this.cameras.main.setBounds(0, 0, 3200, 8320);
    // ancrage de la caméra sur le joueur
    this.cameras.main.startFollow(player); 

  
}
createAnimatedWater(layer) {
    // Groupe statique pour l'eau mortelle
    this.eauGroup = this.physics.add.staticGroup();

    layer.forEachTile(tile => {
        if (tile.properties.eaumortel === true) {
            const eau = this.eauGroup.create(tile.getCenterX(), tile.getCenterY(), "anim_eau");
            eau.play("anim_eauMortelle");
            eau.setOrigin(0.5, 0.5);
            eau.body.width = tile.width;
            eau.body.height = tile.height;
            // 🟦 Ajoute ceci : rendre le corps solide
            eau.refreshBody(); // met à jour la hitbox du sprite
            // Désactive la collision de la tuile originale
            tile.setCollision(false, false, false, false);
        }
    });

    // Collision mortelle entre le joueur et l'eau
    this.physics.add.collider(this.player, this.eauGroup, this.hitByWater, null, this);
}
hitByWater(player, eau) {
    if (player.invincible) return;

    this.sonHit1.play();
        player.hp--;
        player.invincible = true;
        player.setTint(0xff0000);
        player.setVelocityY(-280);
        this.time.delayedCall(1000, () => {
            player.clearTint();
            player.invincible = false;
        });

        fct.updatePV.call(this);

        if (player.hp <= 0) {
            player.vies--;
            fct.updateVies.call(this);

            if (player.vies > 0) {
                player.hp = 3;
                fct.updatePV.call(this);
            } else {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once("camerafadeoutcomplete", () => {
                    this.scene.start("defaite");
                });
            }
        }
}
createAnimatedLava(layer) {
    // Groupe statique pour la lave mortelle
    this.lavaGroup = this.physics.add.staticGroup();

    layer.forEachTile(tile => {
        if (tile.properties.lavemortel === true) { // propriété Tiled : lavemortel = true
            const lava = this.lavaGroup.create(tile.getCenterX(), tile.getCenterY(), "anim_lave");
            lava.play("anim_laveMortelle");
            lava.setOrigin(0.5, 0.5);
            lava.body.width = tile.width;
            lava.body.height = tile.height;
            lava.refreshBody(); // rendre le corps solide
            tile.setCollision(false, false, false, false);
        }
    });

    // Collision physique + dégâts
    this.physics.add.collider(this.player, this.lavaGroup, this.hitByLava, null, this);
}
hitByLava(player, lava) {
    if (player.invincible) return;

   this.sonHit1.play();
        player.hp--;
        player.invincible = true;
        player.setTint(0xff0000);
        player.setVelocityY(-280);
        this.time.delayedCall(1000, () => {
            player.clearTint();
            player.invincible = false;
        });

        fct.updatePV.call(this);

        if (player.hp <= 0) {
            player.vies--;
            fct.updateVies.call(this);

            if (player.vies > 0) {
                player.hp = 3;
                fct.updatePV.call(this);
            } else {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once("camerafadeoutcomplete", () => {
                    this.scene.start("defaite");
                });
        }
    }
}
createAnimatedSpikes(layer) {
    // Groupe statique pour les piques
    this.spikeGroup = this.physics.add.staticGroup();

    // Parcourt toutes les tuiles du calque décor
    layer.forEachTile(tile => {
        // Si la tuile a la propriété "spikes" dans Tiled
        if (tile.properties.spikes === true) {
            // Crée un sprite animé à sa position
            const spike = this.spikeGroup.create(tile.getCenterX(), tile.getCenterY(), "spikes");
            spike.play("spikesAnim");
            spike.setOrigin(0.5, 0.5);
            spike.body.width = tile.width;
            spike.body.height = tile.height;
        }
    });

    // Supprime la collision de ces tuiles dans le layer (pour éviter double collision)
    layer.forEachTile(tile => {
        if (tile.properties.spikes === true) {
            tile.setCollision(false, false, false, false);
        }
    });

    // Collision mortelle entre le joueur et les piques
    this.physics.add.collider(this.player, this.spikeGroup, this.hitBySpike, null, this);
}
hitBySpike(player, spike) {
    if (player.invincible) return;

   this.sonHit1.play();
        player.hp--;
        player.invincible = true;
        player.setTint(0xff0000);
        player.setVelocityY(-280);
    
    
        this.time.delayedCall(1000, () => {
            player.clearTint();
            player.invincible = false;
        });

        fct.updatePV.call(this);

        if (player.hp <= 0) {
            player.vies--;
            fct.updateVies.call(this);

            if (player.vies > 0) {
                player.hp = 3;
                fct.updatePV.call(this);
            } else {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once("camerafadeoutcomplete", () => {
                    this.scene.start("defaite");
                });
            }
        }
}

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

update() {
    // --- Gestion touche K pour les popups ---
    if (Phaser.Input.Keyboard.JustDown(this.toucheK)) {
        // Fermer popup coffre actif
        if (this.popupActif) {
            this.popupFond.setVisible(false);
            this.popupTexte.setVisible(false);
            this.popupActif = false;
        }
        // Fermer popup saut actif
        else if (this.popupSautActif) {
            this.popupFondSaut.setVisible(false);
            this.popupTexteSaut.setVisible(false);
            this.popupSautActif = false;
        }
        // Ouvrir coffre si joueur est proche
        else if (this.physics.overlap(this.player, this.hitboxObjet) && this.objetEtat === 1) {
            this.sonCoffre.play();
            this.objetInteractif.setTexture("img_chest2");
            this.objetEtat = 2;
            this.popupFond.setVisible(true);
            this.popupTexte.setVisible(true);
            this.popupActif = true;
            this.peutTirer = true;
        }
    }

    // --- Blocage du jeu si un popup est actif ---
    if (this.popupActif || this.popupSautActif) {
        this.player.setVelocity(0, this.player.body.velocity.y);
        const animRepos = this.player.direction === "right" ? "anim_repos_droite" : "anim_repos_gauche";
        this.player.anims.play(animRepos, true);

        // Bloquer ennemis
        this.groupeEnnemis.children.iterate((ennemi) => {
            ennemi.setVelocity(0, ennemi.body.velocity.y);
            if (ennemi instanceof EnnemiTireurSimple && ennemi.timer) {
                ennemi.timer.paused = true;
            }
        });

        return; // on bloque tout le reste tant qu’un popup est ouvert
    } else {
        // Reprise des timers des ennemis
        this.groupeEnnemis.children.iterate((ennemi) => {
            if (ennemi instanceof EnnemiTireurSimple && ennemi.timer) {
                ennemi.timer.paused = false;
            }
        });
    }

    // --- Gestion du mouvement horizontal ---
    if (clavier.left.isDown) {
        player.direction = 'left';
        player.setVelocityX(-160);
    } else if (clavier.right.isDown) {
        player.direction = 'right';
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

if (Phaser.Input.Keyboard.JustDown(this.toucheSaut)) {
    // Si le joueur a le bonus de vol
    if (this.sautsInfinis) {
        // Saut normal toujours possible au sol
        if (this.player.body.blocked.down) {
            this.player.setVelocityY(-250);
        }
        // Vol (multi-sauts) uniquement si endurance dispo
        else if (this.peutVoler && this.endurance > 0) {
            this.player.setVelocityY(-250);
            this.nbSautsVol++;

            // Consommation d’endurance
            this.endurance = this.enduranceMax * (1 - this.nbSautsVol / 5);
            if (this.endurance <= 0) {
                this.endurance = 0;
                this.peutVoler = false; // 🔴 plus de vol possible
            }

            // Bloquer après 5 vols consécutifs
            if (this.nbSautsVol >= 5) {
                this.peutVoler = false;
            }
        }
    }
    // Si pas encore le bonus → saut normal classique
    else if (this.player.body.blocked.down) {
        this.player.setVelocityY(-250);
    }
}


// --- Recharge de l'endurance ---
if (this.sautsInfinis) {
    if (!this.player.body.blocked.down) {
        // en l’air, ne recharge pas
    } else {
        // recharge seulement au sol
        if (this.endurance < this.enduranceMax) {
            this.endurance += 0.5; // vitesse de recharge
           if (this.endurance >= this.enduranceMax) {
              this.endurance = this.enduranceMax;
              this.peutVoler = true;   // 🟢 vol à nouveau autorisé
              this.nbSautsVol = 0;
            }
        }
    }

    // --- Mise à jour visuelle et affichage conditionnel de la barre ---
// --- Mise à jour visuelle et affichage conditionnel avec fondu ---
const ratio = this.endurance / this.enduranceMax;
this.barreEndurance.width = 145 * ratio;

// Couleur selon niveau d'endurance
if (ratio > 0.5) {
    this.barreEndurance.fillColor = 0x00ff00;
} else if (ratio > 0.25) {
    this.barreEndurance.fillColor = 0xffff00;
} else {
    this.barreEndurance.fillColor = 0xff0000;
}

// Position au-dessus du joueur
this.barreFond.setPosition(125, 190);
this.barreEndurance.setPosition(125, 190);

// --- Gestion de l'affichage fluide ---
if (this.endurance < this.enduranceMax) {
    // Afficher avec fondu si pas encore visible
    if (!this.barreVisible) {
        this.barreVisible = true;
        this.barreFond.setVisible(true);
        this.barreEndurance.setVisible(true);
        this.tweens.add({
            targets: [this.barreFond, this.barreEndurance],
            alpha: 1,
            duration: 300, // durée du fondu en ms
            ease: 'Sine.easeOut'
        });
    }
} 
else {
    // Disparaître avec fondu si visible et pleine
    if (this.barreVisible) {
        this.barreVisible = false;
        this.tweens.add({
            targets: [this.barreFond, this.barreEndurance],
            alpha: 0,
            duration: 300,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.barreFond.setVisible(false);
                this.barreEndurance.setVisible(false);
            }
        });
    }
}
}

    // --- Mise à jour automatique des animations ---
    fct.mettreAJourAnimation(player);

    // --- Tir ---
    if (Phaser.Input.Keyboard.JustDown(boutonFeu)) {
        if (this.peutTirer) {
            fct.tirer(player, groupeBullets);
        }
    }


// --- Attaque corps à corps ---
if (Phaser.Input.Keyboard.JustDown(this.toucheAttaque)) {
    fct.attaquer(player, this.groupeAttaques);

    // Jouer l'animation selon la direction
    const animAttaque = player.direction === "right" ? "anim_attaque_droite" : "anim_attaque_gauche";
    player.anims.play(animAttaque, true);
}

this.groupeEnnemis.children.iterate((ennemi) => {
    if (!ennemi.active) return;

    const dx = Math.abs(ennemi.x - this.player.x);
    const dy = Math.abs(ennemi.y - this.player.y);

    // 🔸 Même zone d’activation pour tous les ennemis (y compris le boss)
    const dansZone = dx <= 1500 && dy <= 1000;

    if (dansZone) {
        // ✅ Réactivation du corps et de la visibilité
        if (!ennemi.body.enable) ennemi.body.enable = true;
        ennemi.setVisible(true);

        // ✅ Update normal
        if (ennemi.update) ennemi.update();

// ✅ Si ennemi a un timer de tir ou d’attaque → reprise
if (
    (ennemi instanceof EnnemiTireurSimple && ennemi.timer) ||
    (ennemi instanceof Boss && ennemi.timerAttaque)
) {
    if (ennemi.timer) ennemi.timer.paused = false;
    if (ennemi.timerAttaque) ennemi.timerAttaque.paused = false;
}

        // ✅ Si c’est un boss → réaffiche nom et barre de vie
        if (ennemi instanceof Boss) {
            ennemi.nomBoss.setVisible(true);
            ennemi.barreVie.setVisible(true);
        }

    } else {
        // ❌ Désactivation complète hors zone
        ennemi.setVelocity(0, 0);
        if (ennemi.body.enable) ennemi.body.enable = false;
        ennemi.setVisible(false);

        // ❌ Si c’est un boss → cache nom, barre, et met en pause attaque
        if (ennemi instanceof Boss) {
            ennemi.nomBoss.setVisible(false);
            ennemi.barreVie.setVisible(false);
            if (ennemi.timerAttaque) ennemi.timerAttaque.paused = true;
        }

        // ❌ Si c’est un tireur → pause du timer de tir
        if (ennemi instanceof EnnemiTireurSimple && ennemi.timer) {
            ennemi.timer.paused = true;
        }
    }
});

    // --- Interaction avec objet ---
    if (Phaser.Input.Keyboard.JustDown(this.toucheK)) {
        if (this.physics.overlap(this.player, this.hitboxObjet) && this.objetEtat === 1) {
            this.objetInteractif.setTexture("img_chest2");
            this.objetEtat = 2;
        }
    }

    // --- Mise à jour des hitbox d'attaque ---
    this.groupeAttaques.children.iterate(hitbox => {
        if (hitbox.update) hitbox.update();
    });

    // --- Vérifie si le joueur quitte la zone du panneau ---
if (this.playerDansZonePanneau) {
    const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.zonePanneau.x, this.zonePanneau.y
    );

    if (dist > 100) { // si le joueur s'éloigne trop
        this.playerDansZonePanneau = false;
        this.textePanneau.setVisible(false);
    }
}
// --- Gestion du menu pause ---
if (Phaser.Input.Keyboard.JustDown(this.touchePause)) {
    this.menuPauseActif = !this.menuPauseActif;

    // --- 🆕 Sauvegarde des volumes initiaux au premier déclenchement ---
    if (!(this.volumesInitiaux instanceof Map)) {
        this.volumesInitiaux = new Map();
        this.sound.sounds.forEach(s => this.volumesInitiaux.set(s, s.volume));

        // Sons spécifiques du joueur
        if (player.sonCourse) this.volumesInitiaux.set(player.sonCourse, player.sonCourse.volume);
        if (player.sonVol) this.volumesInitiaux.set(player.sonVol, player.sonVol.volume);
        if (player.sonAttaque) this.volumesInitiaux.set(player.sonAttaque, player.sonAttaque.volume);
        if (player.sonTir) this.volumesInitiaux.set(player.sonTir, player.sonTir.volume);
    }

    // Affichage du menu
    this.fondPause.setVisible(this.menuPauseActif);
    this.textePause.setVisible(this.menuPauseActif);
    this.imgCommandePause.setVisible(this.menuPauseActif);

    if (this.menuPauseActif) {
        // ❌ Pause du monde et de tous les objets physiques
        this.physics.world.pause();

        // ❌ Mettre le volume des sons à 0
        this.sound.sounds.forEach(s => s.setVolume(0));

        // ❌ Sons spécifiques du joueur
        if (player.sonCourse) player.sonCourse.setVolume(0);
        if (player.sonVol) player.sonVol.setVolume(0);
        if (player.sonAttaque) player.sonAttaque.setVolume(0);
        if (player.sonTir) player.sonTir.setVolume(0);

    } else {
        // ▶ Reprise du monde
        this.physics.world.resume();

        // ▶ Restaurer le volume des sons d’après les valeurs sauvegardées
        if (this.volumesInitiaux instanceof Map) {
            this.sound.sounds.forEach(s => {
                const vol = this.volumesInitiaux.get(s);
                if (vol !== undefined) s.setVolume(vol);
            });

            // ▶ Sons spécifiques du joueur
            [player.sonCourse, player.sonVol, player.sonAttaque, player.sonTir].forEach(son => {
                if (son && this.volumesInitiaux.has(son)) {
                    son.setVolume(this.volumesInitiaux.get(son));
                }
            });
        }
    }
}

// --- Bloquer le joueur si pause active ---
if (this.menuPauseActif) {
    player.setVelocity(0, 0);  // Empêche le mouvement
    return;
}


}
}
/***********************************************************************/
/** CONFIGURATION GLOBALE DU JEU ET LANCEMENT 
/***********************************************************************/