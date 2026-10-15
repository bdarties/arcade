import * as fct from "./fonctions.js";

let player;
let clavier;
let calque_sol;

const PARALLAXE_CIEL = 0.05;
const RELEVER = 40;
const PLUIE_VENT = -100; // vitesse horizontale des gouttes (négatif = vers la gauche)
const PLUIE_INTENSITE = 6;
const CORDE_VITESSE = 120;

// Dimensions, rythme et frames de la hitbox du crocodile.
const CROCO_DELAI = 5000;
const CROCO_ECHELLE = 0.45;
const CROCO_HITBOX_L = 100;
const CROCO_HITBOX_H = 600;
const CROCO_FRAME_DEBUT_DEGATS = 2;
const CROCO_FRAME_FIN_DEGATS = 6;
const CROCO_DEGATS = 1;

// Facteurs de parallaxe et apparences des plans de bâtiments.
const COUCHES_BATIMENTS = [
  { facteur: 0.15, echelle: 0.45, pieds: 700, teinte: 0x7a809e, decalage: 900 },
  { facteur: 0.45, echelle: 0.65, pieds: 720, teinte: 0xffffff, decalage: 0 }
];

export default class exterieur extends Phaser.Scene {
  constructor() {
    super({ key: "exterieur" });
  }

  // Mémorise la porte d'origine lors d'un retour depuis un autre niveau.
  init(data) {
    this.depuis = data.depuis;
  }

  // Charge les ressources du décor, des personnages et des dangers.
  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);
    this.load.image("img_ciel", "./assets/sky.png");
    this.load.image("img_batiments", "./assets/batiments.png");
    this.load.image("img_tuiles", "./assets/tuilesJeu.png");
    this.load.tilemapTiledJSON("map_exterieur", "./assets/map_exterieure.json");
    fct.chargerPerso(this);
    this.load.image("img_porte1", "./assets/door1.png");
    this.load.image("img_porte2", "./assets/door2.png");
    this.load.image("img_porte3", "./assets/door3.png");
    this.load.image("img_opera", "./assets/opera.png");
    this.load.audio("son_pluie", "./assets/musique/fond_paris_pluie.mp3");
    this.load.spritesheet("portier", "./assets/spritesheet/portier.png", {
      frameWidth: 36,
      frameHeight: 64
    });

    this.load.spritesheet("croco", "./assets/spritesheet/croco.png", {
      frameWidth: 270,
      frameHeight: 720
    });
  }

  // Construit le niveau extérieur, ses interactions, ses ennemis et la pluie.
  create() {
    const echelle = (720 + RELEVER) / 1536;
    this.echelle_fond = echelle;

    const map = this.make.tilemap({ key: "map_exterieur" });
    const tileset = map.addTilesetImage("tuilesJeu", "img_tuiles");
    map.createLayer("deco_bg", tileset, 0, 0).setDepth(-6);
    map.createLayer("deco", tileset, 0, 0).setDepth(-5);
    this.calque_corde = map.createLayer("corde", tileset, 0, 0).setDepth(-3);
    this.enCorde = false;
    calque_sol = map.createLayer("Calque de Tuiles 1", tileset, 0, 0);
    calque_sol.setCollisionByExclusion([-1, 0]);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.physics.add
      .staticImage(3600, 1000, "img_opera")
      .setOrigin(0.5, 1)
      .setScale(2.8)
      .setDepth(-4)
      .refreshBody();

    this.fond_ciel = this.add
      .tileSprite(0, -RELEVER, 1280, 720 + RELEVER, "img_ciel")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setTileScale(echelle, echelle)
      .setDepth(-30);

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

    this.portes = [];
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
          .setAlpha(prop("opacite", 1))
          .setDepth(-1)
          .refreshBody();
        this.portes.push({
          sprite,
          destination: prop("destination", null),
          depuis: prop("depuis", "precedent"),
          verrouillee: prop("verrouillee", false),
          message: prop("message", "Cette porte est verrouillée")
        });
      });
    }

    this.texte_verrou = this.add
      .text(640, 60, "", {
        fontFamily: 'Press Start 2P',
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000"
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    const spawn_depart = map.findObject("spawn", (o) => o.name === "depart");

    let pos = spawn_depart;
    if (this.depuis === "suivant") {
      const porteRetour = this.portes.find((p) => p.destination === "toit");
      if (porteRetour) pos = { x: porteRetour.sprite.x, y: porteRetour.sprite.y - 40 };
    }
    if (!pos) pos = { x: 100, y: 450 };
    player = this.physics.add.sprite(pos.x, pos.y, "img_perso");

    player.setCollideWorldBounds(true);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    fct.creerAnimsPerso(this);
    fct.initVies(this, this.depuis === undefined);

    if (!this.anims.exists("portier_anim")) {
      this.anims.create({
        key: "portier_anim",
        frames: this.anims.generateFrameNumbers("portier", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }

    const calque_pnj = map.getObjectLayer("pnj");
    if (!calque_pnj) {
      console.warn('Calque d\'objets "pnj" introuvable dans la map Tiled');
    } else {
      calque_pnj.objects.forEach((o) => {
        const prop = (nom, defaut) => {
          const p = o.properties && o.properties.find((p) => p.name === nom);
          return p ? p.value : defaut;
        };
        const pnj = this.add
          .sprite(o.x, o.y, "portier", 0)
          .setOrigin(0.5, 1)
          .setScale(prop("echelle", 1.3))
          .setFlipX(prop("flip", false))
          .setDepth(-2);
        pnj.anims.msPerFrame = 1000 / prop("vitesse", 6);
        pnj.play("portier_anim");
      });
    }

    if (!this.anims.exists("croco_jump")) {
      this.anims.create({
        key: "croco_jump",
        frames: this.anims.generateFrameNumbers("croco", { start: 1, end: 7 }),
        frameRate: 4,
        repeat: 0
      });
    }

    clavier = fct.creerClavier(this);

    this.physics.add.collider(player, calque_sol);

    this.groupe_crocos = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    const calque_crocos = map.getObjectLayer("crocos");
    if (!calque_crocos) {
      console.warn('Calque d\'objets "crocos" introuvable dans la map Tiled');
    } else {
      calque_crocos.objects.forEach((o) => this.creerCroco(o));
    }

    this.physics.add.overlap(player, this.groupe_crocos, this.toucheCroco, null, this);

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
      });
    }

    if (!this.textures.exists("img_goutte")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xaec6e8, 1);
      g.fillRect(0, 0, 2, 16);
      g.generateTexture("img_goutte", 2, 16);
      g.destroy();
    }

    this.add
      .particles(0, 0, "img_goutte", {
        emitZone: {
          type: "random",
          source: new Phaser.Geom.Rectangle(0, -30, 1280 - PLUIE_VENT * 1.2, 10)
        },
        speedY: { min: 700, max: 1000 },
        speedX: PLUIE_VENT,
        rotate: Math.atan(-PLUIE_VENT / 850) * (180 / Math.PI),
        lifespan: 1200,
        alpha: { min: 0.2, max: 0.5 },
        frequency: PLUIE_INTENSITE,
        advance: 1200
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.sound.stopByKey("musique_menu");

    if (this.cache.audio.exists("son_pluie")) {
      let musique = this.sound.get("son_pluie");
      if (!musique) {
        musique = this.sound.add("son_pluie", { loop: true, volume: 0.5 });
        musique.play();
      }
    } else {
      console.warn("Musique introuvable : vérifie le chemin ./assets/musique/fond_paris_pluie.mp3");
    }
  }

  // Crée un crocodile animé dont la hitbox n'est active que sur ses frames d'attaque.
  creerCroco(o) {
    const c = this.groupe_crocos.create(o.x, o.y, "croco", 0);
    c.setOrigin(0.5, 1);
    c.setScale(CROCO_ECHELLE);
    c.setDepth(1);

    c.body.setSize(CROCO_HITBOX_L, CROCO_HITBOX_H);
    c.body.setOffset((270 - CROCO_HITBOX_L) / 2, 720 - CROCO_HITBOX_H);
    c.body.enable = false;
    c.a_touche = false;

    c.on("animationupdate", (anim, frame) => {
      const f = frame.textureFrame;
      c.body.enable = f >= CROCO_FRAME_DEBUT_DEGATS && f <= CROCO_FRAME_FIN_DEGATS;
    });

    c.on("animationcomplete", () => {
      c.setFrame(0);
      c.body.enable = false;
      c.a_touche = false;
    });

    let delai = CROCO_DELAI;
    if (o.properties) {
      const p = o.properties.find((p) => p.name === "delay");
      if (p) delai = p.value;
    }

    let decalage = Phaser.Math.Between(500, delai);
    if (o.properties) {
      const d = o.properties.find((p) => p.name === "decalage");
      if (d) decalage = d.value;
    }

    this.time.addEvent({
      delay: delai,
      startAt: delai - decalage,
      loop: true,
      callback: () => {
        if (!c.anims.isPlaying) c.play("croco_jump");
      }
    });
  }

  // Évite plusieurs dégâts pendant une même attaque de crocodile.
  toucheCroco(joueur, croco) {
    if (!croco.body.enable || croco.a_touche) return;
    croco.a_touche = true;
    this.perdreVie(CROCO_DEGATS, croco);
  }

  // Applique les dégâts partagés et redémarre si le joueur n'a plus de vie.
  perdreVie(degats, source) {
    if (fct.perdreVieJoueur(this, player, degats, source)) {
      this.scene.restart({});
    }
  }

  // Affiche le message d'une porte verrouillée ou lance sa scène de destination.
  ouvrirPorte(porte) {
    if (porte.verrouillee || !porte.destination) {
      this.texte_verrou.setText(porte.message).setVisible(true);
      if (this.timerVerrou) this.timerVerrou.remove();
      this.timerVerrou = this.time.delayedCall(1500, () => this.texte_verrou.setVisible(false));
      return;
    }

    this.scene.start(porte.destination, { depuis: porte.depuis });
  }

  // Met à jour la parallaxe, l'escalade, les déplacements et les interactions.
  update() {
    if (player.body.bottom >= this.physics.world.bounds.bottom - 32 - 1) {
      fct.mortParChute(this, () => this.scene.restart({}));
    }

    const scrollX = this.cameras.main.scrollX;
    this.fond_ciel.tilePositionX = (scrollX * PARALLAXE_CIEL) / this.echelle_fond;
    this.couches.forEach((c) => {
      c.sprite.tilePositionX = (scrollX * c.facteur) / c.echelle + c.decalage;
    });

    // Le calque des cordes sert aussi de déclencheur pour s'y accrocher.
    const surCorde =
      this.calque_corde.getTileAtWorldXY(player.body.center.x, player.body.center.y) !== null;

    if (!surCorde || clavier.left.isDown || clavier.right.isDown) {
      if (this.enCorde) {
        this.enCorde = false;
        player.body.setAllowGravity(true);
        player.anims.resume();
      }
    } else {
      this.enCorde = true;
    }

    if (this.enCorde) {
      player.body.setAllowGravity(false);
      player.setVelocityX(0);
      const bouge = clavier.up.isDown || clavier.down.isDown;
      player.setVelocityY(clavier.up.isDown ? -CORDE_VITESSE : clavier.down.isDown ? CORDE_VITESSE : 0);

      const descend = clavier.down.isDown && !clavier.up.isDown;

      const mauvaisSens = player.anims.inReverse !== descend;
      if (player.anims.currentAnim?.key !== "aria_up" || (bouge && mauvaisSens)) {
        if (descend) player.anims.playReverse("aria_up");
        else player.anims.play("aria_up");
      }

      if (bouge) player.anims.resume();
      else player.anims.pause();
    } else {
      const auSol = player.body.touching.down || player.body.blocked.down || this.surEscalier;
      fct.deplacerPerso(player, clavier, auSol);
    }

    this.surEscalier = false;
    this.escaliers.forEach((e) => {
      if (this.enCorde) return;
      const droite = e.sens !== "gauche";
      const xRef = droite ? player.body.right : player.body.left;
      if (xRef < e.x || xRef > e.x + e.w) return;

      const avance = droite ? xRef - e.x : e.x + e.w - xRef;
      const yLigne = e.y + e.h - avance * (e.h / e.w);
      const pieds = player.body.bottom;

      if (pieds >= yLigne - 8 && pieds <= e.y + e.h + 32 && player.body.velocity.y > -100) {
        player.y += yLigne - 1 - pieds;
        player.setVelocityY(0);
        this.surEscalier = true;
      }
    });

    if (
      (clavier.up.isDown || clavier.jump.isDown) &&
      !this.enCorde &&
      (player.body.touching.down || player.body.blocked.down || this.surEscalier)
    ) {
      player.setVelocityY(-330);
    }

    if (fct.justDownInteragir(clavier)) {
      const porte = this.portes.find((p) => this.physics.overlap(player, p.sprite));
      if (porte) this.ouvrirPorte(porte);
    }
  }
}