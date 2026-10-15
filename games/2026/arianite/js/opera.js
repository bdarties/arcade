import * as fct from "./fonctions.js";

/***********************************************************************/
/** RÉGLAGES (à adapter si besoin)
/***********************************************************************/

const FICHIER_TUILES = "./assets/tileset_opera.png";
const NOM_TUILESET = "tileset_opera";
const FICHIER_FOND = "./assets/fondopera.png";

// corde / échelle (même principe que dans exterieur.js)
const CORDE_VITESSE = 120; // vitesse de montée / descente (px/s)

// Constantes du Boss
const BOSS_PV_MAX = 15;
const BOSS_SPAWN_X = 961.0;
const BOSS_SPAWN_Y = 632.0;
const BOSS_VITESSE_PATROUILLE = 70;
const BOSS_LIMITE_GAUCHE = 780;  // Bord gauche de la plateforme centrale
const BOSS_LIMITE_DROITE = 1140; // Bord droit de la plateforme centrale
const BOSS_PORTEE_ATTAQUE = 220; // Distance à laquelle le boss déclenche un coup de poing
const BOSS_DELAI_ATTAQUE = 2500; // Temps minimum (ms) entre deux attaques

// Constantes calquées sur fonctions.js pour les coups de poing d'Aria
const FRAME_IMPACT_JOUEUR = { aria_punch_right: 2, aria_punch_left: 6 };
const COUP_PORTEE_JOUEUR = 70;
const COUP_DEGATS_JOUEUR = 1;

export default class opera extends Phaser.Scene {
  constructor() {
    super({ key: "opera" });
  }

  // reçoit { depuis: "precedent" } quand on arrive du grenier,
  //        { depuis: "suivant" } quand on revient des égouts
  init(data) {
    this.depuis = data.depuis;
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.image("img_tuiles_opera", FICHIER_TUILES);
    this.load.image("img_fond_opera", FICHIER_FOND);
    this.load.tilemapTiledJSON("map_opera", "./assets/opera.json");
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    fct.chargerPerso(this);

    /*************************************
     * 1. CHARGEMENT DES ASSETS DU BOSS  *
     *************************************/
    this.load.spritesheet("gros_mechant_attack", "./assets/spritesheet/gros_mechant_attack.png", {
      frameWidth: 236,
      frameHeight: 252
    });
    this.load.spritesheet("gros_mechant_stand_right", "./assets/spritesheet/gros_mechant_stand_right.png", {
      frameWidth: 236,
      frameHeight: 252
    });
    this.load.spritesheet("gros_mechant_walk", "./assets/spritesheet/gros_mechant_walk.png", {
      frameWidth: 236,
      frameHeight: 252
    });
  }

  create() {
    /*************************************
     *  MAP TILED                        *
     *************************************/
    // Phaser ne sait pas lire les tilesets externes (.tsx) : on les remplace par une définition intégrée
    const donnees = this.cache.tilemap.get("map_opera").data;
    donnees.tilesets = donnees.tilesets.map((ts) =>
      ts.source
        ? {
            firstgid: ts.firstgid,
            name: NOM_TUILESET,
            image: FICHIER_TUILES,
            imagewidth: 224,
            imageheight: 160,
            tilewidth: 32,
            tileheight: 32,
            columns: 7,
            tilecount: 35,
            margin: 0,
            spacing: 0
          }
        : ts
    );

    const map = this.make.tilemap({ key: "map_opera" });
    const tileset = map.addTilesetImage(NOM_TUILESET, "img_tuiles_opera");

    this.cameras.main.setBackgroundColor("#14101c");
    this.add.image(640, 360, "img_fond_opera").setScrollFactor(0).setDepth(-20);

    map.createLayer("decor", tileset, 0, 0).setDepth(-5);
    this.calque_corde = map.createLayer("corde", tileset, 0, 0).setDepth(-3);
    this.calque_sol = map.createLayer("Calque de Tuiles 1", tileset, 0, 0);
    this.calque_sol.setCollisionByExclusion([-1, 0]);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.hauteurMap = map.heightInPixels;

    /*************************************
     *  PORTES (zones + sprites)         *
     *************************************/
    const prop = (o, nom, defaut) => {
      const p = o.properties && o.properties.find((p) => p.name === nom);
      return p ? p.value : defaut;
    };

    // Crée une zone d'interaction et stocke la référence du sprite dans `zone.sprite`
    const creerPorte = (o) => {
      const zone = this.add.zone(o.x, o.y - 48, 48, 96);
      this.physics.add.existing(zone, true);
      const cle = prop(o, "sprite", null);
      if (cle && this.textures.exists(cle)) {
        zone.sprite = this.add
          .image(o.x, o.y, cle)
          .setOrigin(0.5, 1)
          .setScale(prop(o, "echelle", 3))
          .setDepth(-1);
      }
      return zone;
    };

    // porte d'arrivée (retour vers le grenier) : objet "entree" du calque "spawn"
    const entree = map.findObject("spawn", (o) => o.name === "entree");
    if (entree) {
      this.porte_precedent = creerPorte(entree);
    } else {
      console.warn('Point "entree" introuvable dans le calque "spawn" : position par défaut utilisée');
      this.porte_precedent = creerPorte({ x: 1800, y: 352 });
    }

    // porte de sortie (vers les égouts) : objet "sortie" du calque "portes"
    const sortie = map.findObject("portes", (o) => o.name === "sortie");
    if (sortie) {
      this.porte_suivant = creerPorte(sortie);
    } else {
      console.warn('Point "sortie" introuvable dans le calque "portes"');
      this.porte_suivant = creerPorte({ x: 170, y: 832, properties: [{ name: "sprite", value: "img_porte1" }] });
    }

    /*************************************
     * 6. VERROUILLAGE INITIAL PORTE     *
     *************************************/
    this.porteVerrouillee = true;
    if (this.porte_suivant.sprite) {
      this.porte_suivant.sprite.setTint(0x555555); // Grise la porte tant que le boss est en vie
    }

    /*************************************
     *  JOUEUR                           *
     *************************************/
    const porteDepart = this.depuis === "suivant" ? this.porte_suivant : this.porte_precedent;
    const departX = porteDepart.x;
    const departY = porteDepart.y - 40;

    fct.creerAnimsPerso(this);
    this.player = this.physics.add.sprite(departX, departY, "img_perso");
    this.player.setCollideWorldBounds(true);
    this.clavier = fct.creerClavier(this);

    // pendant qu'on est sur la corde, le sol ne bloque plus (la corde traverse les plateformes)
    this.enCorde = false;
    this.physics.add.collider(this.player, this.calque_sol, null, () => !this.enCorde, this);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    fct.initVies(this, false); // on garde les vies du niveau précédent

    // Active l'effet visuel de l'arc blanc lors des coups de poing d'Aria (via fonctions.js)
    fct.activerCoups(this.player, []);

    this.texte_info = this.add
      .text(640, 60, "", { fontSize: "24px", color: "#ffffff", backgroundColor: "#000000" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    /*************************************
     *  INITIALISATION DU BOSS           *
     *************************************/
    this.creerAnimationsBoss();
    this.creerBoss();
  }

  /***********************************************************************/
  /** LOGIQUE DU BOSS (Création, Attaque, Dégâts, Mort, Update)
  /***********************************************************************/

  creerAnimationsBoss() {
    if (!this.anims.exists("gros_mechant_stand_right")) {
      this.anims.create({
        key: "gros_mechant_stand_right",
        frames: this.anims.generateFrameNumbers("gros_mechant_stand_right", { start: 0, end: 1 }),
        frameRate: 4,
        repeat: -1
      });
    }

    if (!this.anims.exists("gros_mechant_walk")) {
      this.anims.create({
        key: "gros_mechant_walk",
        frames: this.anims.generateFrameNumbers("gros_mechant_walk", { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!this.anims.exists("gros_mechant_attack")) {
      this.anims.create({
        key: "gros_mechant_attack",
        frames: this.anims.generateFrameNumbers("gros_mechant_attack", { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0
      });
    }
  }

  creerBoss() {
    // 2. Positionnement et Physique du Boss sur la plateforme (961.0 / 632.0)
    this.boss = this.physics.add.sprite(BOSS_SPAWN_X, BOSS_SPAWN_Y, "gros_mechant_stand_right");
    this.boss.setOrigin(0.5, 1);
    this.boss.setCollideWorldBounds(true);

    // Corps physique principal du boss pour reposer sur la plateforme
    this.boss.body.setSize(120, 230);
    this.boss.body.setOffset(58, 22);

    // Statistiques et états du boss
    this.boss.pv = BOSS_PV_MAX; // 15 PV
    this.boss.estMort = false;
    this.boss.enAttaque = false;
    this.boss.invincible = false;
    this.boss.direction = 1; // 1 = droite, -1 = gauche

    // Collision entre le boss et le calque de plateforme
    this.physics.add.collider(this.boss, this.calque_sol);

    // Animation et déplacement de patrouille par défaut
    this.boss.play("gros_mechant_walk");
    this.boss.setVelocityX(BOSS_VITESSE_PATROUILLE * this.boss.direction);

    // 3. Hitbox du Visage (Point faible) : Zone physique attachée sur la tête du boss
    this.hitboxVisage = this.add.zone(this.boss.x, this.boss.y - 165, 80, 95);
    this.physics.add.existing(this.hitboxVisage);
    this.hitboxVisage.body.setAllowGravity(false);
    this.hitboxVisage.body.moves = false;

    // Zone physique représentant le coup de poing d'Aria (portée de 70px comme dans fonctions.js)
    this.zoneAttaqueJoueur = this.add.zone(0, 0, COUP_PORTEE_JOUEUR, 64);
    this.physics.add.existing(this.zoneAttaqueJoueur);
    this.zoneAttaqueJoueur.body.setAllowGravity(false);
    this.zoneAttaqueJoueur.body.moves = false;

    // Écoute les frames d'impact d'Aria (aria_punch_right: 2, aria_punch_left: 6) définies dans fonctions.js
    this.player.on("animationupdate", (anim, frame) => {
      if (FRAME_IMPACT_JOUEUR[anim.key] !== frame.textureFrame) return;
      if (!this.boss || this.boss.estMort || !this.hitboxVisage) return;

      // Positionne la zone de coup devant Aria selon son orientation (flipX)
      const b = this.player.body;
      const centreX = this.player.flipX
        ? b.left - COUP_PORTEE_JOUEUR / 2
        : b.right + COUP_PORTEE_JOUEUR / 2;
      const centreY = b.center.y;

      this.zoneAttaqueJoueur.setPosition(centreX, centreY);
      this.zoneAttaqueJoueur.body.updateFromGameObject();

      // Vérifie uniquement la collision entre le coup d'Aria et le visage du boss
      this.physics.overlap(
        this.hitboxVisage,
        this.zoneAttaqueJoueur,
        this.toucherVisageBoss,
        null,
        this
      );
    });

    // 4. Timer d'attaque périodique du Boss
    this.timerAttaqueBoss = this.time.addEvent({
      delay: BOSS_DELAI_ATTAQUE,
      callback: () => {
        if (!this.boss || this.boss.estMort || this.boss.enAttaque) return;
        this.declencherAttaqueBoss();
      },
      loop: true
    });
  }

  declencherAttaqueBoss() {
    if (this.boss.estMort || this.boss.enAttaque) return;

    this.boss.enAttaque = true;
    this.boss.setVelocityX(0);

    // S'oriente vers Aria avant de frapper
    if (this.player.x < this.boss.x) {
      this.boss.direction = -1;
      this.boss.setFlipX(true);
    } else {
      this.boss.direction = 1;
      this.boss.setFlipX(false);
    }

    this.boss.play("gros_mechant_attack");

    // 4. Génère une large hitbox devant le boss qui s'éclaire en rouge (alpha 0.5)
    const decalageX = this.boss.direction * 130;
    const zoneX = this.boss.x + decalageX;
    const zoneY = this.boss.y - 125;

    this.hitboxAttaqueBoss = this.add.rectangle(zoneX, zoneY, 150, 180, 0xff0000, 0.5);
    this.physics.add.existing(this.hitboxAttaqueBoss);
    this.hitboxAttaqueBoss.body.setAllowGravity(false);
    this.hitboxAttaqueBoss.body.moves = false;

    this.overlapAttaqueJoueur = this.physics.add.overlap(
      this.player,
      this.hitboxAttaqueBoss,
      () => {
        if (!this.boss.estMort) {
          this.infligerDegatsAuJoueur();
        }
      },
      null,
      this
    );

    // La zone rouge disparaît à la fin de l'animation `gros_mechant_attack`
    this.boss.once("animationcomplete-gros_mechant_attack", () => {
      this.nettoyerHitboxAttaqueBoss();

      if (!this.boss.estMort) {
        this.boss.enAttaque = false;
        this.boss.play("gros_mechant_walk");
        this.boss.setVelocityX(BOSS_VITESSE_PATROUILLE * this.boss.direction);
      }
    });
  }

  nettoyerHitboxAttaqueBoss() {
    if (this.overlapAttaqueJoueur) {
      this.physics.world.removeCollider(this.overlapAttaqueJoueur);
      this.overlapAttaqueJoueur = null;
    }
    if (this.hitboxAttaqueBoss) {
      this.hitboxAttaqueBoss.destroy();
      this.hitboxAttaqueBoss = null;
    }
  }

  infligerDegatsAuJoueur() {
    // Utilise `perdreVieJoueur` de fonctions.js (gère l'invincibilité, la barre de vie et le recul)
    const plusDeVie = fct.perdreVieJoueur(this, this.player, 1, this.boss);
    if (plusDeVie) {
      fct.mortParChute(this, () => this.scene.restart({ depuis: "precedent" }));
    }
  }

  toucherVisageBoss() {
    if (this.boss.estMort || this.boss.invincible) return;

    this.boss.pv -= COUP_DEGATS_JOUEUR;

    // 5. Si les PV tombent à 0, lance la séquence de mort
    if (this.boss.pv <= 0) {
      this.mourirBoss();
      return;
    }

    // Clignotement rouge et courte invincibilité (250ms) quand le visage est touché
    this.boss.invincible = true;
    this.boss.setTint(0xff0000);
    this.time.delayedCall(250, () => {
      if (this.boss && this.boss.active && !this.boss.estMort) {
        this.boss.clearTint();
        this.boss.invincible = false;
      }
    });
  }

  mourirBoss() {
    this.boss.estMort = true;
    this.boss.enAttaque = false;

    // 5. Désactive ses attaques et ses collisions avec le joueur
    if (this.timerAttaqueBoss) {
      this.timerAttaqueBoss.remove();
    }
    this.nettoyerHitboxAttaqueBoss();

    if (this.hitboxVisage) {
      this.hitboxVisage.destroy();
      this.hitboxVisage = null;
    }

    // Joue l'animation `gros_mechant_stand_right` et applique un filtre rouge
    this.boss.setVelocityX(0);
    this.boss.play("gros_mechant_stand_right");
    this.boss.setTint(0xff0000);

    // Désactive sa collision avec le sol pour qu'il tombe sous la map avec la gravité
    this.boss.setCollideWorldBounds(false);
    this.boss.body.checkCollision.none = true;

    // 6. Retire le tint et déverrouille la porte
    this.porteVerrouillee = false;
    if (this.porte_suivant && this.porte_suivant.sprite) {
      this.porte_suivant.sprite.clearTint();
    }
  }

  updateBoss() {
    if (!this.boss || !this.boss.active) return;

    // 5. Détruit l'objet boss quand il sort de l'écran par le bas
    if (this.boss.estMort) {
      if (this.boss.y - this.boss.height > this.hauteurMap) {
        this.boss.destroy();
      }
      return;
    }

    // Maintient la hitbox du visage positionnée sur la tête du boss
    if (this.hitboxVisage) {
      const decalageVisageX = this.boss.direction * 15;
      this.hitboxVisage.setPosition(this.boss.x + decalageVisageX, this.boss.y - 165);
      this.hitboxVisage.body.updateFromGameObject();
    }

    // Patrouille sur la plateforme (961, 632) et attaque si Aria est à portée
    if (!this.boss.enAttaque) {
      if (this.boss.x <= BOSS_LIMITE_GAUCHE) {
        this.boss.direction = 1;
        this.boss.setFlipX(false);
      } else if (this.boss.x >= BOSS_LIMITE_DROITE) {
        this.boss.direction = -1;
        this.boss.setFlipX(true);
      }

      this.boss.setVelocityX(BOSS_VITESSE_PATROUILLE * this.boss.direction);
      if (this.boss.anims.currentAnim?.key !== "gros_mechant_walk") {
        this.boss.play("gros_mechant_walk", true);
      }

      // Attaque si le joueur est à portée
      const distanceX = Math.abs(this.player.x - this.boss.x);
      const distanceY = Math.abs(this.player.y - (this.boss.y - 100));
      if (distanceX < BOSS_PORTEE_ATTAQUE && distanceY < 150) {
        this.declencherAttaqueBoss();
      }
    }
  }

  /***********************************************************************/
  /** CORDE
  /***********************************************************************/

  // renvoie le haut et le bas (en pixels) de la corde à laquelle appartient la tuile donnée
  bornesCorde(tuile) {
    let haut = tuile.y;
    let bas = tuile.y;
    while (this.calque_corde.hasTileAt(tuile.x, haut - 1)) haut--;
    while (this.calque_corde.hasTileAt(tuile.x, bas + 1)) bas++;
    return { haut: haut * 32, bas: (bas + 1) * 32 };
  }

  quitterCorde() {
    this.enCorde = false;
    this.player.body.setAllowGravity(true);
    this.player.anims.resume();
  }

  gererCorde() {
    const p = this.player;
    const b = p.body;
    const c = this.clavier;
    const tuileCentre = this.calque_corde.getTileAtWorldXY(b.center.x, b.center.y);

    if (!this.enCorde) {
      // on s'accroche : Haut sur une corde, ou Bas quand on se tient sur le sommet d'une corde
      let tuile = null;
      if (c.up.isDown && tuileCentre) {
        tuile = tuileCentre;
      } else if (c.down.isDown) {
        const tuilePieds = this.calque_corde.getTileAtWorldXY(b.center.x, b.bottom + 4);
        if (tuilePieds) tuile = tuilePieds;
        else if (tuileCentre && b.bottom < this.bornesCorde(tuileCentre).bas - 2) tuile = tuileCentre;
      }
      if (!tuile) return;

      this.enCorde = true;
      b.setAllowGravity(false);
      p.x = tuile.pixelX + tuile.width / 2; // centré sur la corde
    }

    // sur la corde
    const tuile = tuileCentre || this.calque_corde.getTileAtWorldXY(b.center.x, b.bottom + 4);
    if (!tuile) {
      this.quitterCorde();
      return;
    }
    const { haut, bas } = this.bornesCorde(tuile);

    // sommet atteint : on se pose sur la plateforme
    if (b.center.y < haut && c.up.isDown) {
      p.y += haut - b.bottom;
      p.setVelocity(0, 0);
      this.quitterCorde();
      return;
    }
    // bas atteint : on se pose sur le sol
    if (b.bottom >= bas && c.down.isDown) {
      p.y += bas - b.bottom;
      p.setVelocity(0, 0);
      this.quitterCorde();
      return;
    }
    // gauche / droite : on lâche la corde (sauf si on est encore dans une plateforme)
    if (c.left.isDown || c.right.isDown) {
      const dansSol =
        this.calque_sol.hasTileAtWorldXY(b.center.x, b.center.y) ||
        this.calque_sol.hasTileAtWorldXY(b.center.x, b.bottom - 4) ||
        this.calque_sol.hasTileAtWorldXY(b.center.x, b.top + 4);
      if (!dansSol) {
        this.quitterCorde();
        return;
      }
    }

    p.setVelocityX(0);
    const bouge = c.up.isDown || c.down.isDown;
    p.setVelocityY(c.up.isDown ? -CORDE_VITESSE : c.down.isDown ? CORDE_VITESSE : 0);

    const descend = c.down.isDown && !c.up.isDown;
    const mauvaisSens = p.anims.inReverse !== descend;
    if (p.anims.currentAnim?.key !== "aria_up" || (bouge && mauvaisSens)) {
      if (descend) p.anims.playReverse("aria_up");
      else p.anims.play("aria_up");
    }
    if (bouge) p.anims.resume();
    else p.anims.pause();
  }

  /***********************************************************************/
  /** UPDATE
  /***********************************************************************/

  update() {
    this.gererCorde();
    this.updateBoss();

    if (!this.enCorde) {
      const auSol = this.player.body.touching.down || this.player.body.blocked.down;
      fct.deplacerPerso(this.player, this.clavier, auSol);

      // Permet aussi à Aria d'attaquer en plein saut pour toucher le visage du boss
      if (!auSol && !this.player.enCoup && fct.justDownAttaquer(this.clavier)) {
        this.player.enCoup = true;
        this.player.anims.play(Math.random() < 0.5 ? "aria_punch_right" : "aria_punch_left");
      }

      if ((this.clavier.up.isDown || this.clavier.jump.isDown) && auSol) {
        this.player.setVelocityY(-330);
      }
    }

    // chute dans le vide (bas de la map) : mort
    if (this.player.body.bottom >= this.hauteurMap - 1) {
      fct.mortParChute(this, () => this.scene.restart({ depuis: "precedent" }));
    }

    if (fct.justDownInteragir(this.clavier)) {
      if (this.physics.overlap(this.player, this.porte_precedent)) {
        this.scene.start("toit", { depuis: "suivant" });
      } else if (this.physics.overlap(this.player, this.porte_suivant)) {
        // 6. Empêche l'ouverture tant que la porte est verrouillée
        if (!this.porteVerrouillee) {
          this.scene.start("egouts", { depuis: "precedent" });
        } else {
          this.texte_info.setText("La porte est verrouillée ! Vainquez le boss !");
          this.texte_info.setVisible(true);
          this.time.delayedCall(2000, () => {
            if (this.texte_info) this.texte_info.setVisible(false);
          });
        }
      }
    }
  }
}