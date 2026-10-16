import * as fct from "./fonctions.js";
import { ARMES, jouerSon } from "./versus/armes.js";

const FICHIER_TUILES = "./assets/tileset_opera.png";
const NOM_TUILESET = "tileset_opera";
const FICHIER_FOND = "./assets/fondopera.png";

// Réglages de déplacement des cordes et de patrouille du boss.
const CORDE_VITESSE = 120;

const BOSS_PV_MAX = 15;
const BOSS_SPAWN_X = 961.0;
const BOSS_SPAWN_Y = 632.0;
const BOSS_VITESSE_PATROUILLE = 70;
const BOSS_LIMITE_GAUCHE = 780;
const BOSS_LIMITE_DROITE = 1140;
const BOSS_PORTEE_ATTAQUE = 220;
const BOSS_DELAI_ATTAQUE = 2500;

// Frame d'impact du joueur et dégâts appliqués au boss.
const FRAME_IMPACT_JOUEUR = { aria_punch_right: 2, aria_punch_left: 6 };
const COUP_PORTEE_JOUEUR = 70;
const COUP_DEGATS_JOUEUR = 1;

// Lance-trompette (repris du mode Versus) : tir toutes les 3 s, 1 PV de dégâts au boss.
const ROQUETTE_DELAI = 3000;
const ROQUETTE_VITESSE = 520;
const ROQUETTE_ECHELLE = 0.5;
const ROQUETTE_DEGATS = 1;
const ARME_PORTEE_RAMASSAGE = 60;

// Scène du boss à l'Opéra, avec cordes, plateformes et accès aux niveaux voisins.
export default class opera extends Phaser.Scene {
  constructor() {
    super({ key: "opera" });
  }

  // Choisit le point d'arrivée en fonction du niveau précédent.
  init(data) {
    this.depuis = data.depuis;
  }

  // Charge la carte, les décors, la foule et les animations du boss.
  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.image("img_tuiles_opera", FICHIER_TUILES);
    this.load.image("img_fond_opera", FICHIER_FOND);
    this.load.tilemapTiledJSON("map_opera", "./assets/opera.json");
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    this.load.image("img_lustre", "./assets/lustre.png");
    this.load.audio("musique_opera", "./assets/musique/music_opera.mp3");
    this.load.spritesheet("foule", "./assets/spritesheet/foule.png", {
      frameWidth: 612,
      frameHeight: 126
    });
    fct.chargerPerso(this);

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

    this.load.spritesheet("femme", "./assets/spritesheet/femme.png", {
      frameWidth: 36,
      frameHeight: 64
    });

    // Lance-trompette : mêmes ressources et mêmes clés que le mode Versus.
    this.load.image("versus_lancetrompette", "./assets/versus/armes/lancetrompette.png");
    this.load.image("versus_lancetrompette_vide", "./assets/versus/armes/lancetrompette_vide.png");
    this.load.image("versus_roquette", "./assets/versus/armes/roquette.png");
    this.load.audio("versus_s_lance_tir", "./assets/versus/sons/lance_tir.mp3");
    this.load.audio("versus_s_explosion", "./assets/versus/sons/explosion.mp3");
  }

  // Construit la salle, configure ses portes et initialise Aria et le boss.
  create() {
    // Les tilesets externes Tiled (.tsx) sont remplacés par une définition intégrée pour Phaser.
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

    this.sound.stopByKey("musique_grenier");
    this.sound.stopByKey("musique_menu");

    if (this.cache.audio.exists("musique_opera")) {
      const musique = this.sound.add("musique_opera", { loop: true, volume: 0.5 });
      musique.play();
      this.events.once("shutdown", () => musique.stop());
    } else {
      console.warn("Musique introuvable : vérifie le chemin ./assets/musique/music_opera.mp3");
    }

    this.anims.create({
      key: "anim_foule",
      frames: this.anims.generateFrameNumbers("foule", { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    });

    const fouleSprite = this.add.sprite(640, 720, "foule");
    fouleSprite.setOrigin(0.5, 0.5);
    fouleSprite.play("anim_foule");
    fouleSprite.setScrollFactor(0);
    fouleSprite.setDepth(9999);
    fouleSprite.setScale(2.4);

    this.add.image(950, 100, "img_lustre").setScale(0.5);

    const map = this.make.tilemap({ key: "map_opera" });
    const tileset = map.addTilesetImage(NOM_TUILESET, "img_tuiles_opera");

    this.cameras.main.setBackgroundColor("#14101c");
    this.add.image(640, 360, "img_fond_opera").setScrollFactor(0).setDepth(-20);

    map.createLayer("decor", tileset, 0, 0).setDepth(-5);
    this.calque_corde = map.createLayer("corde", tileset, 0, 0).setDepth(-3);
    this.calque_sol = map.createLayer("Calque de Tuiles 1", tileset, 0, 0);
    this.calque_sol.setCollisionByExclusion([-1, 0]);

    // Seule la face supérieure des plateformes bloque les joueurs.
    this.calque_sol.forEachTile((t) => {
      if (t.index !== -1 && t.index !== 0) {
        t.setCollision(false, false, true, false);
      }
    });

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.hauteurMap = map.heightInPixels;

    const prop = (o, nom, defaut) => {
      const p = o.properties && o.properties.find((p) => p.name === nom);
      return p ? p.value : defaut;
    };

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

    const entree = map.findObject("spawn", (o) => o.name === "entree");
    if (entree) {
      this.porte_precedent = creerPorte(entree);
    } else {
      console.warn('Point "entree" introuvable dans le calque "spawn" : position par défaut utilisée');
      this.porte_precedent = creerPorte({ x: 1800, y: 352 });
    }

    const sortie = map.findObject("portes", (o) => o.name === "sortie");
    if (sortie) {
      this.porte_suivant = creerPorte(sortie);
    } else {
      console.warn('Point "sortie" introuvable dans le calque "portes"');
      this.porte_suivant = creerPorte({ x: 170, y: 832, properties: [{ name: "sprite", value: "img_porte1" }] });
    }

    this.porteVerrouillee = true;
    if (this.porte_suivant.sprite) {
      this.porte_suivant.sprite.setTint(0x555555);
    }

    const porteDepart = this.depuis === "suivant" ? this.porte_suivant : this.porte_precedent;
    const departX = porteDepart.x;
    const departY = porteDepart.y - 40;

    fct.creerAnimsPerso(this);
    this.player = this.physics.add.sprite(departX, departY, "img_perso");
    this.player.setCollideWorldBounds(true);
    this.clavier = fct.creerClavier(this);

    this.enCorde = false;
    this.physics.add.collider(this.player, this.calque_sol, null, () => !this.enCorde, this);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    fct.initVies(this, false);

    fct.activerCoups(this.player, []);

    this.texte_info = this.add
      .text(640, 60, "", { fontSize: "24px", color: "#ffffff", backgroundColor: "#000000" })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    this.creerAnimationsBoss();
    this.creerBoss();
    this.creerArmeRoquette(map);

    this.anims.create({
      key: "femme_anim", 
      frames: this.anims.generateFrameNumbers("femme", { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1
    }); 
    this.femme = this.physics.add.sprite(450,450, "femme");
  }

  // Prépare les animations de patrouille, d'attente et d'attaque du boss.
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

  // Crée le boss, ses hitboxes et le déclencheur périodique de ses attaques.
  creerBoss() {
    this.boss = this.physics.add.sprite(BOSS_SPAWN_X, BOSS_SPAWN_Y, "gros_mechant_stand_right");
    this.boss.setOrigin(0.5, 1);
    this.boss.setCollideWorldBounds(true);

    this.boss.body.setSize(120, 230);
    this.boss.body.setOffset(58, 22);

    this.boss.pv = BOSS_PV_MAX;
    this.boss.estMort = false;
    this.boss.enAttaque = false;
    this.boss.invincible = false;
    this.boss.direction = 1;

    this.physics.add.collider(this.boss, this.calque_sol);

    this.boss.play("gros_mechant_walk");
    this.boss.setVelocityX(BOSS_VITESSE_PATROUILLE * this.boss.direction);

    // Seule cette hitbox mobile permet de blesser le boss.
    this.hitboxVisage = this.add.zone(this.boss.x, this.boss.y - 165, 80, 95);
    this.physics.add.existing(this.hitboxVisage);
    this.hitboxVisage.body.setAllowGravity(false);
    this.hitboxVisage.body.moves = false;

    this.zoneAttaqueJoueur = this.add.zone(0, 0, COUP_PORTEE_JOUEUR, 64);
    this.physics.add.existing(this.zoneAttaqueJoueur);
    this.zoneAttaqueJoueur.body.setAllowGravity(false);
    this.zoneAttaqueJoueur.body.moves = false;

    this.player.on("animationupdate", (anim, frame) => {
      if (FRAME_IMPACT_JOUEUR[anim.key] !== frame.textureFrame) return;
      if (!this.boss || this.boss.estMort || !this.hitboxVisage) return;

      const b = this.player.body;
      const centreX = this.player.flipX
        ? b.left - COUP_PORTEE_JOUEUR / 2
        : b.right + COUP_PORTEE_JOUEUR / 2;
      const centreY = b.center.y;

      this.zoneAttaqueJoueur.setPosition(centreX, centreY);
      this.zoneAttaqueJoueur.body.updateFromGameObject();

      this.physics.overlap(
        this.hitboxVisage,
        this.zoneAttaqueJoueur,
        this.toucherVisageBoss,
        null,
        this
      );
    });

    this.timerAttaqueBoss = this.time.addEvent({
      delay: BOSS_DELAI_ATTAQUE,
      callback: () => {
        if (!this.boss || this.boss.estMort || this.boss.enAttaque) return;
        this.declencherAttaqueBoss();
      },
      loop: true
    });
  }

  // Oriente le boss vers Aria et active temporairement sa zone de dégâts.
  declencherAttaqueBoss() {
    if (this.boss.estMort || this.boss.enAttaque) return;

    this.boss.enAttaque = true;
    this.boss.setVelocityX(0);

    if (this.player.x < this.boss.x) {
      this.boss.direction = -1;
      this.boss.setFlipX(true);
    } else {
      this.boss.direction = 1;
      this.boss.setFlipX(false);
    }

    this.boss.play("gros_mechant_attack");

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

    this.boss.once("animationcomplete-gros_mechant_attack", () => {
      this.nettoyerHitboxAttaqueBoss();

      if (!this.boss.estMort) {
        this.boss.enAttaque = false;
        this.boss.play("gros_mechant_walk");
        this.boss.setVelocityX(BOSS_VITESSE_PATROUILLE * this.boss.direction);
      }
    });
  }

  // Retire la zone d'attaque et son collider après la fin du coup.
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

  // Applique les dégâts du boss avec la gestion de vie commune aux niveaux.
  infligerDegatsAuJoueur() {
    const plusDeVie = fct.perdreVieJoueur(this, this.player, 1, this.boss);
    if (plusDeVie) {
      fct.mortParChute(this, () => this.scene.restart({ depuis: "precedent" }));
    }
  }

  // Compte un impact sur le point faible (coup de poing d'Aria).
  toucherVisageBoss() {
    this.infligerDegatsBoss(COUP_DEGATS_JOUEUR);
  }

  // Retire des PV au boss et lance sa défaite si nécessaire.
  infligerDegatsBoss(degats) {
    if (this.boss.estMort || this.boss.invincible) return;

    this.boss.pv -= degats;

    if (this.boss.pv <= 0) {
      this.mourirBoss();
      return;
    }

    this.boss.invincible = true;
    this.boss.setTint(0xff0000);
    this.time.delayedCall(250, () => {
      if (this.boss && this.boss.active && !this.boss.estMort) {
        this.boss.clearTint();
        this.boss.invincible = false;
      }
    });
  }

  // Désactive les attaques, fait tomber le boss et déverrouille la sortie.
  mourirBoss() {
    this.boss.estMort = true;
    this.boss.enAttaque = false;

    if (this.timerAttaqueBoss) {
      this.timerAttaqueBoss.remove();
    }
    this.nettoyerHitboxAttaqueBoss();

    if (this.hitboxVisage) {
      this.hitboxVisage.destroy();
      this.hitboxVisage = null;
    }

    this.boss.setVelocityX(0);
    this.boss.play("gros_mechant_stand_right");
    this.boss.setTint(0xff0000);

    this.boss.setCollideWorldBounds(false);
    this.boss.body.checkCollision.none = true;

    this.porteVerrouillee = false;
    if (this.porte_suivant && this.porte_suivant.sprite) {
      this.porte_suivant.sprite.clearTint();
    }
  }

  // Suit la hitbox faciale, gère la patrouille et déclenche les attaques à portée.
  updateBoss() {
    if (!this.boss || !this.boss.active) return;

    if (this.boss.estMort) {
      if (this.boss.y - this.boss.height > this.hauteurMap) {
        this.boss.destroy();
      }
      return;
    }

    if (this.hitboxVisage) {
      const decalageVisageX = this.boss.direction * 15;
      this.hitboxVisage.setPosition(this.boss.x + decalageVisageX, this.boss.y - 165);
      this.hitboxVisage.body.updateFromGameObject();
    }

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

      const distanceX = Math.abs(this.player.x - this.boss.x);
      const distanceY = Math.abs(this.player.y - (this.boss.y - 100));
      if (distanceX < BOSS_PORTEE_ATTAQUE && distanceY < 150) {
        this.declencherAttaqueBoss();
      }
    }
  }

  // Place le lance-trompette à l'emplacement "lance_roquette" du calque "arme" de la carte.
  creerArmeRoquette(map) {
    const def = ARMES.lancetrompette;
    const o = map.findObject("arme", (obj) => obj.name === "lance_roquette") || { x: 191, y: 328 };

    this.aArme = false;
    this.prochainTirRoquette = 0;
    this.armeSprite = null;
    this.roquettes = this.physics.add.group({ allowGravity: false });

    this.armeAuSol = this.add
      .image(o.x, o.y, "versus_lancetrompette")
      .setOrigin(0.5, 1)
      .setScale(def.echelleItem)
      .setDepth(3);
    this.tweens.add({ targets: this.armeAuSol, y: o.y - 6, duration: 700, yoyo: true, repeat: -1 });

    this.indiceArme = this.add
      .text(o.x, o.y - 50, "K : ramasser", { fontSize: "16px", color: "#ffffff", backgroundColor: "#000000" })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setVisible(false);

    this.barreArme = this.add.graphics().setScrollFactor(0).setDepth(100);
  }

  // Indique si Aria est assez près de l'arme posée au sol.
  joueurProcheArme() {
    if (!this.armeAuSol) return false;
    return (
      Phaser.Math.Distance.Between(this.player.x, this.player.y, this.armeAuSol.x, this.armeAuSol.y - 20) <
      ARME_PORTEE_RAMASSAGE
    );
  }

  // Aria prend l'arme : elle apparaît dans sa main et le tir devient possible.
  ramasserArme() {
    const def = ARMES.lancetrompette;
    this.aArme = true;
    this.tweens.killTweensOf(this.armeAuSol);
    this.armeAuSol.destroy();
    this.armeAuSol = null;
    this.indiceArme.setVisible(false);

    this.armeSprite = this.add
      .image(0, 0, "versus_lancetrompette")
      .setScale(def.echelle)
      .setOrigin(def.origine[0], def.origine[1])
      .setDepth(3);

    this.texte_info.setText("Lance-trompette récupéré ! D pour tirer (1 tir toutes les 3 s)").setVisible(true);
    this.time.delayedCall(2500, () => {
      if (this.texte_info) this.texte_info.setVisible(false);
    });
  }

  // Tire une roquette dans la direction d'Aria, si le délai de 3 secondes est écoulé.
  tirerRoquette() {
    const maintenant = this.time.now;
    if (maintenant < this.prochainTirRoquette) return;

    const def = ARMES.lancetrompette;
    const dir = this.player.flipX ? -1 : 1;
    const x = this.player.x + dir * def.bouche[0];
    const y = this.player.y + def.bouche[1];

    const r = this.roquettes
      .create(x, y, "versus_roquette")
      .setScale(ROQUETTE_ECHELLE)
      .setFlipX(dir < 0)
      .setDepth(4);
    r.body.setAllowGravity(false);
    r.body.setVelocity(dir * ROQUETTE_VITESSE, 0);
    r.setData("fumee", 0);

    this.prochainTirRoquette = maintenant + ROQUETTE_DELAI;
    jouerSon(this, "lance_tir");
  }

  // Fait exploser une roquette avec un petit effet visuel et sonore.
  exploserRoquette(r) {
    const { x, y } = r;
    r.destroy();

    const eclair = this.add.circle(x, y, 18, 0xfff2a8, 1).setDepth(20);
    const boule = this.add.circle(x, y, 14, 0xff8a1f, 0.95).setDepth(19);
    this.tweens.add({ targets: eclair, scale: 4, alpha: 0, duration: 220, onComplete: () => eclair.destroy() });
    this.tweens.add({ targets: boule, scale: 7, alpha: 0, duration: 420, ease: "Cubic.easeOut", onComplete: () => boule.destroy() });
    this.cameras.main.shake(150, 0.005);
    jouerSon(this, "explosion");
  }

  // Met à jour l'arme tenue, la barre de recharge, les roquettes en vol et leurs impacts sur le boss.
  mettreAJourArme() {
    const def = ARMES.lancetrompette;
    const maintenant = this.time.now;
    const pret = maintenant >= this.prochainTirRoquette;

    // Arme posée au sol : on affiche l'indice quand Aria est à portée.
    if (!this.aArme && this.indiceArme) {
      this.indiceArme.setVisible(this.joueurProcheArme());
    }

    // Arme tenue : elle suit Aria et devient "vide" pendant la recharge.
    this.barreArme.clear();
    if (this.aArme) {
      const dir = this.player.flipX ? -1 : 1;
      const cle = pret ? "versus_lancetrompette" : "versus_lancetrompette_vide";
      if (this.armeSprite.texture.key !== cle) this.armeSprite.setTexture(cle);
      this.armeSprite
        .setPosition(this.player.x + dir * def.main[0], this.player.y + def.main[1])
        .setFlipX(this.player.flipX);

      // Petite barre de recharge sous la barre de vie.
      const ratio = pret ? 1 : 1 - (this.prochainTirRoquette - maintenant) / ROQUETTE_DELAI;
      this.barreArme.fillStyle(0x140a0a, 0.85).fillRect(24, 76, 240, 12);
      this.barreArme.fillStyle(pret ? 0xe0a83a : 0x777777, 1).fillRect(26, 78, 236 * ratio, 8);
      this.barreArme.lineStyle(2, 0xc9a24b, 1).strokeRect(24, 76, 240, 12);
    }

    // Roquettes en vol : sortie de la carte, fumée et collision avec le boss.
    const limiteDroite = this.physics.world.bounds.width;
    const boss = this.boss;
    const bossTouchable = boss && boss.active && !boss.estMort && boss.body;
    const zoneBoss = bossTouchable
      ? new Phaser.Geom.Rectangle(boss.body.x, boss.body.y, boss.body.width, boss.body.height)
      : null;

    this.roquettes.getChildren().slice().forEach((r) => {
      if (r.x < 0 || r.x > limiteDroite) {
        r.destroy();
        return;
      }

      if (maintenant - r.getData("fumee") > 60) {
        r.setData("fumee", maintenant);
        const dir = r.body.velocity.x >= 0 ? 1 : -1;
        const f = this.add.circle(r.x - dir * 16, r.y, 5, 0xd8d8d8, 0.7).setDepth(3);
        this.tweens.add({ targets: f, scale: 2.4, alpha: 0, duration: 380, onComplete: () => f.destroy() });
      }

      if (zoneBoss) {
        const zoneRoquette = new Phaser.Geom.Rectangle(r.body.x, r.body.y, r.body.width, r.body.height);
        if (Phaser.Geom.Intersects.RectangleToRectangle(zoneRoquette, zoneBoss)) {
          this.exploserRoquette(r);
          this.infligerDegatsBoss(ROQUETTE_DEGATS);
        }
      }
    });
  }

  // Cherche toute la colonne de corde pour déterminer ses limites d'escalade.
  bornesCorde(tuile) {
    let haut = tuile.y;
    let bas = tuile.y;
    while (this.calque_corde.hasTileAt(tuile.x, haut - 1)) haut--;
    while (this.calque_corde.hasTileAt(tuile.x, bas + 1)) bas++;
    return { haut: haut * 32, bas: (bas + 1) * 32 };
  }

  // Rend sa gravité au joueur lorsqu'il se détache d'une corde.
  quitterCorde() {
    this.enCorde = false;
    this.player.body.setAllowGravity(true);
    this.player.anims.resume();
  }

  // Gère l'accrochage, la montée et la sortie des cordes du décor.
  gererCorde() {
    const p = this.player;
    const b = p.body;
    const c = this.clavier;
    const tuileCentre = this.calque_corde.getTileAtWorldXY(b.center.x, b.center.y);

    if (!this.enCorde) {
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

    const tuile = tuileCentre || this.calque_corde.getTileAtWorldXY(b.center.x, b.bottom + 4);
    if (!tuile) {
      this.quitterCorde();
      return;
    }
    const { haut, bas } = this.bornesCorde(tuile);

    if (b.center.y < haut && c.up.isDown) {
      p.y += haut - b.bottom;
      p.setVelocity(0, 0);
      this.quitterCorde();
      return;
    }
    if (b.bottom >= bas && c.down.isDown) {
      p.y += bas - b.bottom;
      p.setVelocity(0, 0);
      this.quitterCorde();
      return;
    }
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

  // Met à jour le boss, les déplacements, les chutes et les transitions.
  update() {
    this.gererCorde();
    this.updateBoss();
    this.mettreAJourArme();

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

    if (this.player.body.bottom >= this.hauteurMap - 1) {
      fct.mortParChute(this, () => this.scene.restart({ depuis: "precedent" }));
    }

    if (fct.justDownInteragir(this.clavier)) {
      if (this.physics.overlap(this.player, this.porte_precedent)) {
        this.scene.start("toit", { depuis: "suivant" });
      } else if (this.physics.overlap(this.player, this.porte_suivant)) {
        if (!this.porteVerrouillee) {
          this.scene.start("egouts", { depuis: "precedent" });
        } else {
          this.texte_info.setText("La porte est verrouillée ! Vainquez le boss !");
          this.texte_info.setVisible(true);
          this.time.delayedCall(2000, () => {
            if (this.texte_info) this.texte_info.setVisible(false);
          });
        }
      } else if (!this.aArme && this.joueurProcheArme()) {
        this.ramasserArme();
      } else if (this.aArme && !this.enCorde) {
        this.tirerRoquette();
      }
    }
  }
}