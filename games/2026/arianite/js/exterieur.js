import * as fct from "./fonctions.js";

/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

var player; // désigne le sprite du joueur
var clavier; // pour la gestion du clavier
var calque_sol; // calque de tuiles solides (map Tiled)

// parallaxe : 0 = le fond ne bouge pas, 1 = il bouge comme le décor.
// plus le fond est loin, plus le chiffre est petit
const PARALLAXE_CIEL = 0.05;

// hauteur dont on remonte tous les fonds (px) : 0 = collés au bas de l'écran
const RELEVER = 40;

// pluie
const PLUIE_VENT = -100; // vitesse horizontale des gouttes (négatif = vers la gauche)
const PLUIE_INTENSITE = 6; // ms entre deux gouttes : plus petit = plus de pluie

// corde (fonctionne comme une échelle)
const CORDE_VITESSE = 120; // vitesse de montée / descente (px/s)

// crocodile
const CROCO_DELAI = 5000; // ms entre deux sauts (peut être surchargé dans Tiled par la propriété "delay")
const CROCO_ECHELLE = 0.45; // 720px * 0.45 = 324px de haut
const CROCO_HITBOX_L = 100; // largeur de la hitbox (en pixels du spritesheet)
const CROCO_HITBOX_H = 600; // hauteur de la hitbox
const CROCO_FRAME_DEBUT_DEGATS = 2; // la hitbox est active de la frame 2...
const CROCO_FRAME_FIN_DEGATS = 6; // ...à la frame 6
const CROCO_DEGATS = 1; // vies perdues par le joueur
const VIES_JOUEUR = 3; // vies au départ (à brancher sur ton config.txt si besoin)
const INVINCIBILITE = 1000; // ms d'invincibilité après un coup

// spritesheets de portes (optionnel). Clé -> fichier + taille d'UNE frame.
// La clé s'utilise ensuite dans la propriété Tiled "sprite" du point de la porte.
// Frame 0 = porte fermée ; s'il y a d'autres frames, elles jouent quand on ouvre la porte.
// Les images simples door1/2/3.png sont déjà chargées (clés img_porte1, img_porte2, img_porte3).
const SPRITESHEETS_PORTES = {
  // img_porte_bois: { fichier: "./assets/spritesheet/porte_bois.png", largeur: 60, hauteur: 80 }
};
const PORTE_VITESSE_ANIM = 10; // images par seconde de l'ouverture

// couches de bâtiments, de la plus lointaine à la plus proche (on peut en ajouter/retirer)
//  facteur  : vitesse de parallaxe (plus proche = plus grand)
//  echelle  : taille des bâtiments (1 = taille de l'image, 2752x1536)
//  pieds    : hauteur (y à l'écran) où les bâtiments touchent le sol
//  teinte   : couleur multipliée sur l'image (0xffffff = aucune) pour assombrir le lointain
//  decalage : décalage horizontal en px de texture, pour que les couches ne soient pas alignées
const COUCHES_BATIMENTS = [
  { facteur: 0.15, echelle: 0.45, pieds: 700, teinte: 0x7a809e, decalage: 900 },
  { facteur: 0.45, echelle: 0.65, pieds: 720, teinte: 0xffffff, decalage: 0 }
];

// définition de la classe "exterieur" (Niveau 1)
export default class exterieur extends Phaser.Scene {
  constructor() {
    super({ key: "exterieur" }); // mettre le meme nom que le nom de la classe
  }

  // reçoit { depuis: "suivant" } quand on revient du toit
  init(data) {
    this.depuis = data.depuis;
  }

  /***********************************************************************/
  /** FONCTION PRELOAD 
/***********************************************************************/

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    
    this.load.setBaseURL(baseURL);
    
    // tous les assets du jeu sont placés dans le sous-répertoire src/assets/
    this.load.image("img_ciel", "./assets/sky.png");
    this.load.image("img_batiments", "./assets/batiments.png");
    this.load.image("img_plateforme", "./assets/platform.png");
    // map Tiled : image du tileset + fichier json
    this.load.image("img_tuiles", "./assets/tuilesJeu.png");
    this.load.tilemapTiledJSON("map_exterieur", "./assets/map_exterieure.json");
    fct.chargerPerso(this);
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    this.load.image("img_opera", "./assets/opera.png");
    Object.entries(SPRITESHEETS_PORTES).forEach(([cle, d]) => {
      this.load.spritesheet(cle, d.fichier, { frameWidth: d.largeur, frameHeight: d.hauteur });
    });

    // crocodile : 8 frames de 270x720 (frame 0 = vide, frames 1 à 7 = le saut)
    this.load.spritesheet("croco", "./assets/spritesheet/croco.png", {
      frameWidth: 270,
      frameHeight: 720
    });
  }

  /***********************************************************************/
  /** FONCTION CREATE 
/***********************************************************************/

  create() {

    // vies du joueur (remises à zéro à chaque (re)lancement de la scène)
    this.vies = VIES_JOUEUR;
    this.invincible = false;

    /*************************************
     *  CREATION DU MONDE + PLATEFORMES  *
     *************************************/

    const echelle = (720 + RELEVER) / 1536;
    this.echelle_fond = echelle;

    // la map Tiled
    const map = this.make.tilemap({ key: "map_exterieur" });
    // 1er param = nom du tileset dans Tiled ("tuilesJeu"), 2e = clé de l'image chargée
    const tileset = map.addTilesetImage("tuilesJeu", "img_tuiles");
    map.createLayer("deco_bg", tileset, 0, 0).setDepth(-6); // tout au fond
    map.createLayer("deco", tileset, 0, 0).setDepth(-5); // derrière le joueur
    // calque "corde" : les tuiles non vides servent d'échelle (pas de collision)
    this.calque_corde = map.createLayer("corde", tileset, 0, 0).setDepth(-3);
    this.enCorde = false; // vrai quand le joueur est accroché à la corde
    calque_sol = map.createLayer("Calque de Tuiles 1", tileset, 0, 0);
    // toutes les tuiles non vides sont solides
    calque_sol.setCollisionByExclusion([-1, 0]);

    // taille du monde = taille de la map
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // l'opéra : image solide (le joueur se cogne dessus)
    this.opera = this.physics.add
      .staticImage(3600, 1000, "img_opera")
      .setOrigin(0.5, 1)
      .setScale(2.8)
      .setDepth(-4)
      .refreshBody(); // recalcule la hitbox après le changement d'origine et d'échelle

    // fonds en parallaxe
    this.fond_ciel = this.add
      .tileSprite(0, -RELEVER, 1280, 720 + RELEVER, "img_ciel")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setTileScale(echelle, echelle)
      .setDepth(-30); // ordre des calques : ciel (-30) < bâtiments (-10) < jeu (0)

    this.couches = COUCHES_BATIMENTS.map((c) => {
      const sprite = this.add
        .tileSprite(0, c.pieds - RELEVER - 1404 * c.echelle, 1280, 1536 * c.echelle, "img_batiments")
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setTileScale(c.echelle, c.echelle)
        .setTint(c.teinte)
        .setDepth(-10);
      return { sprite, ...c };
    });

    /****************************
     *  PORTES (calque Tiled)   *
     ****************************/
    // Chaque POINT du calque d'objets "portes" est une porte : un sprite est posé à cet endroit
    // (le point = le bas au milieu de la porte, comme pour les crocos). Propriétés Tiled :
    //   sprite      (string) : clé de l'image / du spritesheet (défaut : img_porte1)
    //   echelle     (float)  : taille du sprite (défaut : 3)
    //   opacite     (float)  : transparence du sprite, 0.5 = 50 % (défaut : 1)
    //   destination (string) : nom de la scène où la porte mène (ex : "toit")
    //   depuis      (string) : donnée envoyée à cette scène (ex : "precedent")
    //   verrouillee (bool)   : si cochée, la porte ne s'ouvre pas
    //   message     (string) : texte affiché si elle est verrouillée
    this.portes = [];
    this.porteEnCours = false;
    const calque_portes = map.getObjectLayer("portes");
    if (!calque_portes) {
      console.warn('Calque d\'objets "portes" introuvable dans la map Tiled');
    } else {
      calque_portes.objects.forEach((o) => {
        const prop = (nom, defaut) => {
          const p = o.properties && o.properties.find((p) => p.name === nom);
          return p ? p.value : defaut;
        };
        let cle = prop("sprite", "img_porte1");
        if (!this.textures.exists(cle)) {
          console.warn('Porte : le sprite "' + cle + '" n\'existe pas, img_porte1 utilisé à la place');
          cle = "img_porte1";
        }
        const sprite = this.physics.add
          .staticSprite(o.x, o.y, cle, 0)
          .setOrigin(0.5, 1)
          .setScale(prop("echelle", 3))
          .setAlpha(prop("opacite", 1)) // 1 = opaque, 0.5 = 50 %, 0 = invisible
          .setDepth(-1) // derrière le joueur
          .refreshBody(); // recalcule la hitbox après l'échelle et l'origine
        this.portes.push({
          sprite,
          cle,
          destination: prop("destination", null),
          depuis: prop("depuis", "precedent"),
          verrouillee: prop("verrouillee", false),
          message: prop("message", "Cette porte est verrouillée")
        });
      });
    }

    // message affiché quand on essaie d'ouvrir une porte verrouillée
    this.texte_verrou = this.add
      .text(640, 60, "", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000"
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    this.input.on("pointerdown", (p) => console.log(Math.round(p.worldX), Math.round(p.worldY)));

    /****************************
     *  CREATION DU PERSONNAGE  *
     ****************************/

    // point de départ défini dans Tiled (calque d'objets "spawn")
    const spawn_depart = map.findObject("spawn", (o) => o.name === "depart");

    // si on revient du toit, le joueur ressort par la porte qui mène au toit
    let pos = spawn_depart;
    if (this.depuis === "suivant") {
      const porteRetour = this.portes.find((p) => p.destination === "toit");
      if (porteRetour) pos = { x: porteRetour.sprite.x, y: porteRetour.sprite.y - 40 }; // il tombe sur le sol
    }
    if (!pos) pos = { x: 100, y: 450 }; // secours si aucun point n'est trouvé
    player = this.physics.add.sprite(pos.x, pos.y, "img_perso");

    player.setBounce(0.2); // on donne un petit coefficient de rebond
    player.setCollideWorldBounds(true); // le player se cognera contre les bords du monde

    // la caméra suit le joueur (lerp = douceur du suivi)
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    /***************************
     *  CREATION DES ANIMATIONS *
     ****************************/
    fct.creerAnimsPerso(this);

    // animation du saut du crocodile (frames 1 à 7, la frame 0 est vide)
    if (!this.anims.exists("croco_jump")) {
      this.anims.create({
        key: "croco_jump",
        frames: this.anims.generateFrameNumbers("croco", { start: 1, end: 7 }),
        frameRate: 4, // 8 = rapide, 4 = deux fois plus lent, 3 = encore plus lent
        repeat: 0
      });
    }

    /***********************
     *  CREATION DU CLAVIER *
     ************************/
    clavier = this.input.keyboard.createCursorKeys();

    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS *
     ******************************************************/

    // le joueur est bloqué par le calque de sol
    this.physics.add.collider(player, calque_sol);
    // le joueur est bloqué par l'opéra
    //this.physics.add.collider(player, this.opera);

    /*****************
     *  CROCODILES   *
     *****************/
    this.groupe_crocos = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // un croco par objet "Point" du calque d'objets "crocos" (Tiled)
    const calque_crocos = map.getObjectLayer("crocos");
    if (!calque_crocos) {
      console.warn('Calque d\'objets "crocos" introuvable dans la map Tiled');
    } else {
      calque_crocos.objects.forEach((o) => this.creerCroco(o));
    }

    // le joueur touche un croco qui saute = dégâts
    this.physics.add.overlap(player, this.groupe_crocos, this.toucheCroco, null, this);

    /*****************
     *  ESCALIERS    *
     *****************/
    // propriété optionnelle "sens" : "droite" (défaut, l'escalier monte vers la droite) ou "gauche"
    this.escaliers = [];
    this.surEscalier = false;
    const calque_escaliers = map.getObjectLayer("escaliers");
    if (!calque_escaliers) {
      console.warn('Calque d\'objets "escaliers" introuvable dans la map Tiled');
    } else {
      calque_escaliers.objects.forEach((o) => {
        const p = o.properties && o.properties.find((p) => p.name === "sens");
        this.escaliers.push({
          x: o.x,
          y: o.y,
          w: o.width,
          h: o.height,
          sens: p ? p.value : "droite"
        });
        // pour voir les zones pendant les tests, décommente la ligne suivante :
        // this.add.rectangle(o.x + o.width / 2, o.y + o.height / 2, o.width, o.height, 0xff0000, 0.3).setDepth(20);
      });
    }

    /*****************
     *  PLUIE        *
     *****************/
    if (!this.textures.exists("img_goutte")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xaec6e8, 1);
      g.fillRect(0, 0, 2, 16);
      g.generateTexture("img_goutte", 2, 16);
      g.destroy();
    }

    this.pluie = this.add
      .particles(0, 0, "img_goutte", {
        emitZone: {
          type: "random",
          source: new Phaser.Geom.Rectangle(0, -30, 1280 - PLUIE_VENT * 1.2, 10)
        },
        speedY: { min: 700, max: 1000 },
        speedX: PLUIE_VENT,
        rotate: Math.atan(-PLUIE_VENT / 850) * (180 / Math.PI), // penche la goutte selon le vent
        lifespan: 1200,
        alpha: { min: 0.2, max: 0.5 },
        frequency: PLUIE_INTENSITE,
        advance: 1200 // la pluie tombe déjà au lancement de la scène
      })
      .setScrollFactor(0)
      .setDepth(10); // devant le joueur et les décors
  }

  /***********************************************************************/
  /** FONCTIONS DU CROCODILE
/***********************************************************************/

  // crée un croco à la position d'un objet Tiled (le bas du sprite = le point)
  creerCroco(o) {
    const c = this.groupe_crocos.create(o.x, o.y, "croco", 0);
    c.setOrigin(0.5, 1);
    c.setScale(CROCO_ECHELLE);
    c.setDepth(1);

    // hitbox centrée en bas du sprite (valeurs en pixels du spritesheet, avant l'échelle)
    c.body.setSize(CROCO_HITBOX_L, CROCO_HITBOX_H);
    c.body.setOffset((270 - CROCO_HITBOX_L) / 2, 720 - CROCO_HITBOX_H);
    c.body.enable = false; // inoffensif tant qu'il est caché
    c.a_touche = false; // pour ne toucher qu'une fois par saut

    // hitbox active seulement pendant le saut
    c.on("animationupdate", (anim, frame) => {
      const f = frame.textureFrame;
      c.body.enable = f >= CROCO_FRAME_DEBUT_DEGATS && f <= CROCO_FRAME_FIN_DEGATS;
    });

    // fin du saut : il retourne se cacher
    c.on("animationcomplete", () => {
      c.setFrame(0);
      c.body.enable = false;
      c.a_touche = false;
    });

    // délai : propriété Tiled "delay" si elle existe, sinon CROCO_DELAI
    let delai = CROCO_DELAI;
    if (o.properties) {
      const p = o.properties.find((p) => p.name === "delay");
      if (p) delai = p.value;
    }

    // décalage avant le 1er saut : propriété Tiled "decalage" (en ms) sinon aléatoire
    let decalage = Phaser.Math.Between(500, delai);
    if (o.properties) {
      const d = o.properties.find((p) => p.name === "decalage");
      if (d) decalage = d.value;
    }

    // un saut toutes les X secondes, le premier après "decalage" ms
    this.time.addEvent({
      delay: delai,
      startAt: delai - decalage,
      loop: true,
      callback: () => {
        if (!c.anims.isPlaying) c.play("croco_jump");
      }
    });
  }

  // appelée quand le joueur chevauche un croco
  toucheCroco(joueur, croco) {
    if (!croco.body.enable || croco.a_touche) return; // pas actif ou déjà touché
    croco.a_touche = true;
    this.perdreVie(CROCO_DEGATS, croco);
  }

  // enlève des vies au joueur, avec invincibilité et recul
  perdreVie(degats, source) {
    if (this.invincible) return;
    this.invincible = true;
    this.vies -= degats;

    // feedback : rouge + petit saut de recul à l'opposé du croco
    player.setTint(0xff0000);
    player.setVelocityY(-200);
    player.x += player.x < source.x ? -20 : 20;

    if (this.vies <= 0) {
      this.scene.restart(); // plus de vies : on relance la scène (à remplacer par ton écran de défaite)
      return;
    }

    this.time.delayedCall(INVINCIBILITE, () => {
      this.invincible = false;
      player.clearTint();
    });
  }

  /***********************************************************************/
  /** PORTES
/***********************************************************************/

  // verrouillée : affiche le message ; sinon : (animation d'ouverture) puis changement de scène
  ouvrirPorte(porte) {
    if (this.porteEnCours) return;
    if (porte.verrouillee || !porte.destination) {
      this.texte_verrou.setText(porte.message).setVisible(true);
      if (this.timerVerrou) this.timerVerrou.remove();
      this.timerVerrou = this.time.delayedCall(1500, () => this.texte_verrou.setVisible(false));
      return;
    }

    const partir = () => this.scene.start(porte.destination, { depuis: porte.depuis });

    // spritesheet avec plusieurs frames : on joue l'ouverture avant de partir
    const nbFrames = this.textures.get(porte.cle).frameTotal - 1; // -1 : frame interne "__BASE"
    if (nbFrames > 1) {
      this.porteEnCours = true;
      const anim = "ouvrir_" + porte.cle;
      if (!this.anims.exists(anim)) {
        this.anims.create({
          key: anim,
          frames: this.anims.generateFrameNumbers(porte.cle, { start: 0, end: nbFrames - 1 }),
          frameRate: PORTE_VITESSE_ANIM,
          repeat: 0
        });
      }
      porte.sprite.play(anim);
      porte.sprite.once("animationcomplete", partir);
    } else {
      partir();
    }
  }

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

  update() {
    // parallaxe : la texture défile moins vite que la caméra
    const scrollX = this.cameras.main.scrollX;
    this.fond_ciel.tilePositionX = (scrollX * PARALLAXE_CIEL) / this.echelle_fond;
    this.couches.forEach((c) => {
      c.sprite.tilePositionX = (scrollX * c.facteur) / c.echelle + c.decalage;
    });

    // corde : dès qu'on est sur une tuile du calque "corde", on s'accroche
    const surCorde =
      this.calque_corde.getTileAtWorldXY(player.body.center.x, player.body.center.y) !== null;

    if (!surCorde || clavier.left.isDown || clavier.right.isDown) {
      // hors de la corde, ou gauche/droite : on lâche
      if (this.enCorde) {
        this.enCorde = false;
        player.body.setAllowGravity(true);
        player.anims.resume();
      }
    } else {
      this.enCorde = true; // sur la corde : accroché automatiquement
    }

    if (this.enCorde) {
      player.body.setAllowGravity(false);
      player.setVelocityX(0);
      const bouge = clavier.up.isDown || clavier.down.isDown;
      player.setVelocityY(clavier.up.isDown ? -CORDE_VITESSE : clavier.down.isDown ? CORDE_VITESSE : 0);

      // il descend seulement si on appuie sur bas (et pas sur haut)
      const descend = clavier.down.isDown && !clavier.up.isDown;

      // on (re)lance l'animation si ce n'est pas aria_up,
      // ou si le sens de l'animation ne correspond plus au sens du mouvement
      const mauvaisSens = player.anims.inReverse !== descend;
      if (player.anims.currentAnim?.key !== "aria_up" || (bouge && mauvaisSens)) {
        if (descend) player.anims.playReverse("aria_up"); // à l'envers
        else player.anims.play("aria_up"); // dans le bon sens
      }

      if (bouge) player.anims.resume(); // il bouge : l'animation repart
      else player.anims.pause(); // il ne bouge pas : l'animation s'arrête
    } else {
      const auSol = player.body.touching.down || player.body.blocked.down || this.surEscalier;
      fct.deplacerPerso(player, clavier, auSol);
    }

    // escaliers : en x, la hauteur des pieds suit la pente de la zone
    this.surEscalier = false;
    this.escaliers.forEach((e) => {
      if (this.enCorde) return; // pas d'escalier pendant qu'on grimpe
      const droite = e.sens !== "gauche";
      // on prend le bord avant du joueur (celui qui monte en premier)
      const xRef = droite ? player.body.right : player.body.left;
      if (xRef < e.x || xRef > e.x + e.w) return; // pas dans la zone

      const avance = droite ? xRef - e.x : e.x + e.w - xRef; // distance parcourue sur l'escalier
      const yLigne = e.y + e.h - avance * (e.h / e.w); // hauteur du sol à cet endroit
      const pieds = player.body.bottom;

      // si les pieds sont sur ou sous la pente (et qu'on ne monte pas en sautant) : on colle à la pente
      // (32 = marge sous le bas de la zone, pour pardonner un rectangle Tiled un peu trop bas)
      // (-100 : le rebond du joueur (setBounce) donne une petite vitesse négative au sol, ce n'est pas un saut)
      if (pieds >= yLigne - 8 && pieds <= e.y + e.h + 32 && player.body.velocity.y > -100) {
        player.y += yLigne - 1 - pieds;
        player.setVelocityY(0);
        this.surEscalier = true;
      }
    });

    // saut (désactivé pendant la grimpe : haut = monter sur la corde)
    if (
      clavier.up.isDown &&
      !this.enCorde &&
      (player.body.touching.down || player.body.blocked.down || this.surEscalier)
    ) {
      player.setVelocityY(-330);
    }

    // espace : ouvre la porte devant laquelle on se trouve
    if (Phaser.Input.Keyboard.JustDown(clavier.space)) {
      const porte = this.portes.find((p) => this.physics.overlap(player, p.sprite));
      if (porte) this.ouvrirPorte(porte);
    }
  }
}

/***********************************************************************/
/** CONFIGURATION GLOBALE DU JEU ET LANCEMENT 
/***********************************************************************/