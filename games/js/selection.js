import Player from "./Player.js";
import * as fct from "./fonctions.js";
import { Ennemi3, Ennemi2, Ennemi1, Ennemi4 } from "./Ennemis.js";

let player;
let clavier;
let gameOver = false;
let calque_plateformes;
let calque_background2;
let spriteBarreVieFond;
let spriteBarreVieRemplie;
let boutonRejouer;

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });

    // CONFIGURATION DES VAGUES
    this.configVagues = [
      { totalEnnemis: 1, pauseApres: 5 },
      { totalEnnemis: 3, pauseApres: 5 },
      { totalEnnemis: 12, pauseApres: 5 },
      { totalEnnemis: 15, pauseApres: 5 },
      { totalEnnemis: 20, pauseApres: 0 },
    ];

    // CONFIGURATION ENNEMI4 (Avions) - Par vague
    this.configEnnemi4ParVague = [2, 5, 15, 10, 8];

    // Variables de gestion
    this.vagueActuelle = 0;
    this.maxVagues = this.configVagues.length;
    this.timerPause = 0;
    this.enPause = false;
    this.vagueFinie = false;
    this.toutesVaguesFinis = false;
    this.timerEnnemi4 = null;
    this.tousEnnemisSpawnes = false;

    // Groupes
    this.groupe_soldats = null;
    this.groupe_balles = null;
    this.groupe_balles_ennemi = null;
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Background
    this.load.image("menu_bg", "./assets/background_test.png");

    // Player sprites
    this.load.spritesheet(
      "img_player_idle",
      "./assets/player/player_normal_idle.png",
      { frameWidth: 64, frameHeight: 64 }
    );
    this.load.spritesheet("img_player_run", "./assets/player/player_run.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet(
      "img_player_dead",
      "./assets/player/player_is_dead.png",
      { frameWidth: 64, frameHeight: 64 }
    );

    // Enemies
    this.load.spritesheet("ennemi_run", "./assets/ennemi/ennemi_run.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet(
      "ennemi_is_dead",
      "./assets/ennemi/ennemi_is_dead.png",
      { frameWidth: 64, frameHeight: 64 }
    );
    this.load.spritesheet("ennemi_shoot", "./assets/ennemi/ennemi_shoot.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet(
      "ennemi3_attack",
      "./assets/ennemi3/ennemi3_attack.png",
      { frameWidth: 64, frameHeight: 64 }
    );
    this.load.spritesheet("ennemi3_run", "./assets/ennemi3/ennemi3_run.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet(
      "ennemi3_is_dead",
      "./assets/ennemi3/ennemi3_is_dead.png",
      { frameWidth: 64, frameHeight: 64 }
    );

    this.load.image("ennemi4", "./assets/ennemi4/ennemi4.png", {
      frameWidth: 64,
      frameHeight: 37,
    });
    this.load.spritesheet("explosion", "./assets/ennemi4/explosion.png", {
      frameWidth: 96,
      frameHeight: 96,
    });

    this.load.spritesheet(
      "ennemi2_run_left",
      "./assets/ennemi2/ennemi2_run_left.png",
      { frameWidth: 64, frameHeight: 64 }
    );
    this.load.spritesheet(
      "ennemi2_run_right",
      "./assets/ennemi2/ennemi2_run_right.png",
      { frameWidth: 64, frameHeight: 64 }
    );
    this.load.spritesheet(
      "ennemi2_is_dead_right",
      "./assets/ennemi2/ennemi2_is_dead_right.png",
      { frameWidth: 64, frameHeight: 64 }
    );
    this.load.spritesheet(
      "ennemi2_is_dead_left",
      "./assets/ennemi2/ennemi2_is_dead_left.png",
      { frameWidth: 64, frameHeight: 64 }
    );
    this.load.spritesheet(
      "ennemi2_throw_left",
      "./assets/ennemi2/ennemi2_throw_left.png",
      { frameWidth: 64, frameHeight: 64 }
    );
    this.load.spritesheet(
      "ennemi2_throw_right",
      "./assets/ennemi2/ennemi2_throw_right.png",
      { frameWidth: 64, frameHeight: 64 }
    );
    this.load.image("img_bombe", "./assets/ennemi2/bombe.png");

    // Tilemap
    this.load.image("Phaser_tuilesdejeu", "./assets/tileset_city.png");
    this.load.image("Phaser_tuilesdejeu2", "./assets/tileset_war.png");
    this.load.tilemapTiledJSON("carte", "./assets/carte.tmj");

    // Projectiles and weapons
    this.load.image("img_balle", "./assets/weapons/balle.png");
    this.load.image("weapons", "./assets/weapons/weapons.png");
    this.load.image("german_weapons", "./assets/weapons/german_weapons.png");

    // Health bar
    this.load.image(
      "empty_health_bar",
      "./assets/healthbar/empty_health_bar.png"
    );
    this.load.image(
      "full_health_bar",
      "./assets/healthbar/full_health_bar.png"
    );

    //bouton bonus

    // this.load.image("")

    // Debug 404
    this.load.on("loaderror", (file) => {
      console.error("Fichier manquant:", file.src);
    });
  }

  create() {
    this.physics.world.gravity.y = 0;

    // --- Tilemap ---
    const carteDuNiveau = this.make.tilemap({ key: "carte" });
    const tileset = carteDuNiveau.addTilesetImage(
      "tileset_city",
      "Phaser_tuilesdejeu"
    );
    const tileset2 = carteDuNiveau.addTilesetImage(
      "tileset_war",
      "Phaser_tuilesdejeu2"
    );

    // De l'arrière vers l'avant (ordre d'affichage)
    carteDuNiveau.createLayer("calque_background", [tileset, tileset2]);
    calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", [
      tileset,
      tileset2,
    ]);
    calque_background2 = carteDuNiveau.createLayer("calque_background2", [
      tileset,
      tileset2,
    ]);

    // Collisions
    calque_plateformes.setCollisionBetween(1, 9999);
    calque_background2.setCollisionBetween(1, 9999);

    // --- Groupes ---
    this.groupe_soldats = this.physics.add.group();
    this.groupe_balles = this.physics.add.group();
    this.groupe_balles_ennemi = this.physics.add.group();

    // Stocker les dimensions
    this.largeurCarte = carteDuNiveau.widthInPixels;
    this.hauteurCarte = carteDuNiveau.heightInPixels;

    // --- Player ---
    player = new Player(this, 100, 450);
    this.player = player;
    player.setName("player");

    // --- Camera (AVANT les textes UI) ---
    this.physics.world.setBounds(0, 0, this.largeurCarte, this.hauteurCarte);
    this.cameras.main.setBounds(0, 0, this.largeurCarte, this.hauteurCarte);
    this.cameras.main.setZoom(2);
    this.cameras.main.roundPixels = true;
    this.cameras.main.startFollow(player);
    this.textures.get("carte").setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.cameras.scrollX = Math.round(this.cameras.scrollX);
    this.cameras.scrollY = Math.round(this.cameras.scrollY);

    // --- Collisions ---
    this.physics.add.collider(this.player, calque_plateformes);
    this.physics.add.collider(this.groupe_soldats, calque_plateformes);
    this.physics.add.collider(this.player, calque_background2);
    this.physics.add.collider(this.groupe_soldats, calque_background2);
    this.physics.add.overlap(
      this.player,
      this.groupe_soldats,
      this.collisionJoueurEnnemi,
      null,
      this
    );
    this.physics.add.overlap(
      this.groupe_balles,
      this.groupe_soldats,
      this.chocAvecBalles,
      null,
      this
    );
    this.physics.add.overlap(
      this.groupe_balles_ennemi,
      this.player,
      this.chocAvecBalleEnnemi,
      null,
      this
    );

    // --- Clavier ---
    clavier = this.input.keyboard.createCursorKeys();

    // --- Barre de vie ---
    const largeurBarre = 200;
    const hauteurBarre = 24;
    const barreVieX = 350;
    const barreVieY = 200;

    spriteBarreVieFond = this.add
      .image(barreVieX, barreVieY, "empty_health_bar")
      .setOrigin(0, 0)
      .setDisplaySize(largeurBarre, hauteurBarre)
      .setScrollFactor(0)
      .setDepth(100);

    spriteBarreVieRemplie = this.add
      .image(barreVieX, barreVieY, "full_health_bar")
      .setOrigin(0, 0)
      .setDisplaySize(largeurBarre, hauteurBarre)
      .setScrollFactor(0)
      .setDepth(101);

    // --- UI Textes (APRES le zoom de la camera) ---
    // Utiliser scale.width qui est la largeur réelle du canvas
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    this.texteVague = this.add
      .text(gameWidth / 2, 220, "VAGUE 1/5", {
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#000000",
          blur: 4,
          fill: true,
        },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(9999);

    this.texteTimer = this.add
      .text(gameWidth / 2, 250, "Prépare-toi !", {
        fontSize: "12px",
        color: "#ffdd00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: "#000000",
          blur: 3,
          fill: true,
        },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(9999);

    // Lancer la premiere vague apres 2 secondes
    this.time.delayedCall(2000, () => {
      this.lancerVague();
    });
  }

  lancerVague() {
    this.vagueActuelle++;

    if (this.vagueActuelle > this.maxVagues) {
      this.finirToutesLesVagues();
      return;
    }

    const config = this.configVagues[this.vagueActuelle - 1];
    this.vagueFinie = false;
    this.enPause = false;
    this.tousEnnemisSpawnes = false;

    // UI
    this.texteVague.setText(`VAGUE ${this.vagueActuelle}/${this.maxVagues}`);
    this.texteTimer.setText("EN COURS...").setColor("#ff4444");

    // Spawn des ennemis terrestres
    this.spawnVague(config);

    // Gerer le spawn des Ennemi4 (Avions)
    this.gererSpawnEnnemi4();
  }

  spawnVague(config) {
    const typesEnnemis = [Ennemi2];
    this.tousEnnemisSpawnes = false;

    for (let i = 0; i < config.totalEnnemis; i++) {
      this.time.delayedCall(i * 500, () => {
        if (gameOver || this.toutesVaguesFinis) return;

        let x = Phaser.Math.Between(100, this.largeurCarte - 100);
        const y = 450;

        // Si trop proche du joueur, décaler de 200px
        if (Math.abs(x - player.x) < 200) {
          x = player.x + (x > player.x ? 200 : -200);
        }

        const TypeEnnemi = Phaser.Utils.Array.GetRandom(typesEnnemis);
        const ennemi = new TypeEnnemi(this, x, y);
        this.groupe_soldats.add(ennemi);

        if (i === config.totalEnnemis - 1) {
          this.tousEnnemisSpawnes = true;
          console.log(
            `Tous les ennemis de la vague ${this.vagueActuelle} ont spawne`
          );
        }
      });
    }
  }

  gererSpawnEnnemi4() {
    if (this.timerEnnemi4) {
      this.timerEnnemi4.remove();
      this.timerEnnemi4 = null;
    }

    const intervalVague = this.configEnnemi4ParVague[this.vagueActuelle - 1];

    if (!intervalVague) {
      console.log(`Pas d'avions pour la vague ${this.vagueActuelle}`);
      return;
    }

    console.log(`Avions actives : 1 toutes les ${intervalVague}s`);
    this.timerEnnemi4 = this.time.addEvent({
      delay: intervalVague * 1000,
      callback: () => {
        if (
          !this.enPause &&
          !this.vagueFinie &&
          !this.toutesVaguesFinis &&
          !gameOver
        ) {
          new Ennemi4(this, this.largeurCarte, this.hauteurCarte);
        }
      },
      loop: true,
    });
  }

  verifierFinVague() {
    if (this.vagueActuelle <= 0 || this.vagueFinie || this.enPause) return;
    if (!this.tousEnnemisSpawnes) return;

    const config = this.configVagues[this.vagueActuelle - 1];
    if (!config || !this.groupe_soldats) return;

    const ennemisActifs = this.groupe_soldats
      .getChildren()
      .filter((e) => e.active && !e.estMort && !(e instanceof Ennemi4)).length;

    if (ennemisActifs === 0) {
      console.log("Vague terminee");
      this.vagueFinie = true;

      this.texteVague
        .setText(`VAGUE ${this.vagueActuelle} TERMINÉE !`)
        .setColor("#44ff44");

      if (config.pauseApres > 0) {
        this.enPause = true;
        this.timerPause = config.pauseApres;

        const prochaineVague = this.vagueActuelle + 1;
        this.texteTimer
          .setText(
            `Vague ${prochaineVague} dans ${Math.ceil(this.timerPause)}s`
          )
          .setColor("#44ff44");
      } else {
        this.time.delayedCall(1000, () => {
          this.lancerVague();
        });
      }
    }
  }

  finirToutesLesVagues() {
    this.toutesVaguesFinis = true;

    if (this.timerEnnemi4) {
      this.timerEnnemi4.remove();
      this.timerEnnemi4 = null;
    }

    this.texteVague.setText("VICTOIRE !").setColor("#ffdd00");
    this.texteTimer
      .setText("Toutes les vagues sont terminées !")
      .setColor("#44ff44");

    this.time.delayedCall(2000, () => {
      const gameWidth = this.scale.width;
      const gameHeight = this.scale.height;

      const messageVictoire = this.add
        .text(gameWidth / 2, gameHeight / 2 - 60, "NIVEAU TERMINE !", {
          fontSize: "48px",
          fill: "#ffdd00",
          stroke: "#000",
          strokeThickness: 6,
          fontStyle: "bold",
          shadow: {
            offsetX: 3,
            offsetY: 3,
            color: "#000000",
            blur: 6,
            fill: true,
          },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(200);

      boutonRejouer = this.add
        .text(gameWidth / 2, gameHeight / 2 + 50, "Rejouer", {
          fontSize: "32px",
          fill: "#fff",
          backgroundColor: "#2d5016",
          padding: { x: 20, y: 10 },
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive()
        .setScrollFactor(0)
        .setDepth(200);

      boutonRejouer.on("pointerdown", () => {
        gameOver = false;
        this.vagueActuelle = 0;
        this.scene.restart();
      });

      boutonRejouer.on("pointerover", () => {
        boutonRejouer.setStyle({ backgroundColor: "#3d6e21", fill: "#ffff00" });
      });

      boutonRejouer.on("pointerout", () => {
        boutonRejouer.setStyle({ backgroundColor: "#2d5016", fill: "#ffffff" });
      });
    });
  }

  update(time, delta) {
    if (gameOver || !player || player.estMort) return;

    this.groupe_soldats.getChildren().forEach((ennemi) => {
      if (ennemi && ennemi.update && !ennemi.estMort) {
        ennemi.update();
      }
    });

    this.groupe_balles.getChildren().forEach((balle) => {
      if (
        balle.x < 0 ||
        balle.x > this.physics.world.bounds.width ||
        balle.y < 0 ||
        balle.y > this.physics.world.bounds.height
      ) {
        balle.destroy();
      }
    });

    const enMouvement = player.move(clavier);
    player.updateHitbox();

    let ennemiCible = null;
    try {
      const ennemis = this.groupe_soldats.getChildren();
      ennemiCible = player.ennemiDansHitbox(ennemis);
    } catch (error) {
      console.warn("Erreur lors de la detection d'ennemi:", error);
    }

    player.updateArme(ennemiCible);

    if (ennemiCible && !enMouvement) {
      try {
        player.tirer(ennemiCible);
      } catch (error) {
        console.warn("Erreur lors du tir:", error);
      }
    }

    if (!enMouvement && !gameOver) {
      player.anims.play("anim_idle", true);
      player.setFlipX(player.direction === "left");
    }

    if (this.enPause && this.timerPause > 0) {
      this.timerPause -= delta / 1000;

      if (this.timerPause <= 0) {
        this.enPause = false;
        this.timerPause = 0;
        this.lancerVague();
      } else {
        const tempsRestant = Math.ceil(this.timerPause);
        const prochaineVague = this.vagueActuelle + 1;
        this.texteTimer
          .setText(`Vague ${prochaineVague} dans ${tempsRestant}s`)
          .setColor("#44ff44");
      }
    }

    if (!this.toutesVaguesFinis && !this.enPause) {
      this.verifierFinVague();
    }
  }

  collisionJoueurEnnemi(joueur, ennemi) {
    if (ennemi.estMort || ennemi instanceof Ennemi3) return;

    if (typeof joueur.prendreDegats === "function") {
      joueur.prendreDegats(5);
    }
  }

  chocAvecBalles(balle, soldat) {
    balle.destroy();

    if (typeof soldat.prendreDegats === "function") {
      soldat.prendreDegats(25);
    } else {
      soldat.destroy();
    }
  }

  chocAvecBalleEnnemi(joueur, balle) {
    if (!balle || !balle.active) return;

    balle.destroy();

    if (typeof joueur.prendreDegats === "function") {
      joueur.prendreDegats(10);
    }
  }

  updateBarreVie() {
    if (!player || !spriteBarreVieRemplie) return;

    const largeurMax = 200;
    const ratio = player.vie / player.vieMax;
    const largeurVie = largeurMax * ratio;

    spriteBarreVieRemplie.setDisplaySize(largeurVie, 24);
  }

  gererGameOver() {
    if (gameOver) return;

    gameOver = true;
    this.physics.pause();

    if (this.timerEnnemi4) {
      this.timerEnnemi4.remove();
      this.timerEnnemi4 = null;
    }

    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    // Message Game Over
    const messageGameOver = this.add
      .text(gameWidth / 2, gameHeight / 2 - 60, "GAME OVER", {
        fontSize: "48px",
        fill: "#ff4444",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8,
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: "#000000",
          blur: 6,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200);

    boutonRejouer = this.add
      .text(gameWidth / 2, gameHeight / 2 + 40, "▶ REJOUER", {
        fontSize: "32px",
        fill: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#8b0000",
        padding: { x: 20, y: 10 },
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(200);

    // Effet hover
    boutonRejouer.on("pointerover", () => {
      boutonRejouer.setStyle({ backgroundColor: "#cc0000", fill: "#ffffff" });
    });

    boutonRejouer.on("pointerout", () => {
      boutonRejouer.setStyle({ backgroundColor: "#8b0000", fill: "#ffffff" });
    });

    boutonRejouer.on("pointerdown", () => {
      gameOver = false;
      this.vagueActuelle = 0;
      this.scene.restart();
    });
  }
}
