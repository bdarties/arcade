import Player from './Player.js';
import * as fct from "./fonctions.js";
import { Ennemi3, Ennemi2, Ennemi1, Ennemi4 } from './Ennemis.js';

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });

    // Variables d'instance
    this.player = null;
    this.clavier = null;
    this.gameOver = false;
    this.calque_plateformes = null;
    this.calque_background2 = null;
    this.calque_barriere = null;
    this.spriteBarreVieFond = null;
    this.spriteBarreVieRemplie = null;
    this.boutonRejouer = null;

    // CONFIGURATION DES VAGUES
    this.configVagues = [
      { totalEnnemis: 3, pauseApres: 5 },
      { totalEnnemis: 6, pauseApres: 5 },
      { totalEnnemis: 10, pauseApres: 5 },
      { totalEnnemis: 14, pauseApres: 5 },
      { totalEnnemis: 16, pauseApres: 0 }
    ];

    // CONFIGURATION ENNEMI4 (Avions)
    this.configEnnemi4ParVague = [15, 10, , 7, 4];

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

    // DÉFINITION DES BONUS AVEC RARETÉS
    this.catalogueBonus = {
      portee: {
        nom: "Distance de tir",
        rarete: {
          basique: {
            nom: "+10% Portée",
            couleur: "#ffffff",
            poids: 70,
            effet: (player) => {
              player.rayonHitbox = Math.floor(player.rayonHitbox * 1.10);
            }
          },
          intermediaire: {
            nom: "+25% Portée",
            couleur: "#4a9eff",
            poids: 25,
            effet: (player) => {
              player.rayonHitbox = Math.floor(player.rayonHitbox * 1.25);
            }
          },
          expert: {
            nom: "+50% Portée",
            couleur: "#ff6b35",
            poids: 5,
            effet: (player) => {
              player.rayonHitbox = Math.floor(player.rayonHitbox * 1.50);
            }
          }
        }
      },
      vie_max: {
        nom: "Vie Max",
        rarete: {
          basique: {
            nom: "+15% PV Max",
            couleur: "#ffffff",
            poids: 50,
            effet: (player) => {
              const augmentation = Math.floor(player.statsDeBase.vieMax * 0.15);
              player.vieMax += augmentation;
              player.vie = Math.min(player.vie + augmentation, player.vieMax);
            }
          },
          intermediaire: {
            nom: "+30% PV Max",
            couleur: "#4a9eff",
            poids: 30,
            effet: (player) => {
              const augmentation = Math.floor(player.statsDeBase.vieMax * 0.30);
              player.vieMax += augmentation;
              player.vie = Math.min(player.vie + augmentation, player.vieMax);
            }
          },
          expert: {
            nom: "+60% PV Max",
            couleur: "#ff6b35",
            poids: 10,
            effet: (player) => {
              const augmentation = Math.floor(player.statsDeBase.vieMax * 0.60);
              player.vieMax += augmentation;
              player.vie = Math.min(player.vie + augmentation, player.vieMax);
            }
          }
        }
      },
      soins: {
        nom: "Soins",
        rarete: {
          basique: {
            nom: "+20% Soins",
            couleur: "#ffffff",
            poids: 50,
            effet: (player) => {
              const soins = Math.floor(player.vieMax * 0.20);
              player.vie = Math.min(player.vie + soins, player.vieMax);
            }
          },
          intermediaire: {
            nom: "+40% Soins",
            couleur: "#4a9eff",
            poids: 30,
            effet: (player) => {
              const soins = Math.floor(player.vieMax * 0.40);
              player.vie = Math.min(player.vie + soins, player.vieMax);
            }
          },
          expert: {
            nom: "+80% Soins",
            couleur: "#ff6b35",
            poids: 10,
            effet: (player) => {
              const soins = Math.floor(player.vieMax * 0.80);
              player.vie = Math.min(player.vie + soins, player.vieMax);
            }
          }
        }
      },
      cadence: {
        nom: "Cadence",
        rarete: {
          basique: {
            nom: "+10% Cadence",
            couleur: "#ffffff",
            poids: 50,
            effet: (player) => {
              player.cooldownTir = Math.floor(player.cooldownTir * 0.95);
            }
          },
          intermediaire: {
            nom: "+25% Cadence",
            couleur: "#4a9eff",
            poids: 30,
            effet: (player) => {
              player.cooldownTir = Math.floor(player.cooldownTir * 0.90);
            }
          },
          expert: {
            nom: "+50% Cadence",
            couleur: "#ff6b35",
            poids: 10,
            effet: (player) => {
              player.cooldownTir = Math.floor(player.cooldownTir * 0.85);
            }
          }
        }
      },
      degats: {
        nom: "Dégâts",
        rarete: {
          basique: {
            nom: "+15% Dégâts",
            couleur: "#ffffff",
            poids: 50,
            effet: (player) => {
              player.degatsParBalle = Math.floor(player.degatsParBalle * 1.15);
            }
          },
          intermediaire: {
            nom: "+35% Dégâts",
            couleur: "#4a9eff",
            poids: 30,
            effet: (player) => {
              player.degatsParBalle = Math.floor(player.degatsParBalle * 1.35);
            }
          },
          expert: {
            nom: "+70% Dégâts",
            couleur: "#ff6b35",
            poids: 10,
            effet: (player) => {
              player.degatsParBalle = Math.floor(player.degatsParBalle * 1.70);
            }
          }
        }
      },
      vitesse: {
        nom: "Vitesse Projectiles",
        rarete: {
          basique: {
            nom: "+20% Vitesse balles",
            couleur: "#ffffff",
            poids: 50,
            effet: (player) => {
              player.vitesseDeplacementBase = Math.floor(player.vitesseDeplacementBase * 1.20);
            }
          },
          intermediaire: {
            nom: "+40% Vitesse balles",
            couleur: "#4a9eff",
            poids: 30,
            effet: (player) => {
              player.vitesseDeplacementBase = Math.floor(player.vitesseDeplacementBase * 1.40);
            }
          },
          expert: {
            nom: "+80% Vitesse balles",
            couleur: "#ff6b35",
            poids: 10,
            effet: (player) => {
              player.vitesseDeplacementBase = Math.floor(player.vitesseDeplacementBase * 1.80);
            }
          }
        }
      },
      armure: {
        nom: "Armure",
        rarete: {
          basique: {
            nom: "+1 Hit Absorbé",
            couleur: "#ffffff",
            poids: 50,
            effet: (player) => {
              if (!player.hitsAbsorbes) player.hitsAbsorbes = 0;
              player.hitsAbsorbes += 1;
            }
          },
          intermediaire: {
            nom: "+2 Hits Absorbés",
            couleur: "#4a9eff",
            poids: 30,
            effet: (player) => {
              if (!player.hitsAbsorbes) player.hitsAbsorbes = 0;
              player.hitsAbsorbes += 2;
            }
          },
          expert: {
            nom: "+4 Hits Absorbés",
            couleur: "#ff6b35",
            poids: 10,
            effet: (player) => {
              if (!player.hitsAbsorbes) player.hitsAbsorbes = 0;
              player.hitsAbsorbes += 4;
            }
          }
        }
      }
    };
  }

  init(data) {
    if (data && data.restart) {
      this.vagueActuelle = 0;
      this.toutesVaguesFinis = false;
      this.vagueFinie = false;
      this.enPause = false;
      this.tousEnnemisSpawnes = false;
    }
    this.statsJoueur = data.statsJoueur || null;
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Player sprites
    this.load.spritesheet("img_player_idle", "./assets/player/player_normal_idle.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_player_run", "./assets/player/player_run.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_player_dead", "./assets/player/player_is_dead.png", { frameWidth: 64, frameHeight: 64 });

    // Enemies
    this.load.spritesheet("ennemi_run", "./assets/ennemi/ennemi_run.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi_is_dead", "./assets/ennemi/ennemi_is_dead.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi_shoot", "./assets/ennemi/ennemi_shoot.png", { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet("ennemi3_attack", "./assets/ennemi3/ennemi3_attack.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi3_run", "./assets/ennemi3/ennemi3_run.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi3_is_dead", "./assets/ennemi3/ennemi3_is_dead.png", { frameWidth: 64, frameHeight: 64 });

    this.load.image("ennemi4", "./assets/ennemi4/ennemi4.png");
    this.load.spritesheet("explosion", "./assets/ennemi4/explosion.png", { frameWidth: 62, frameHeight: 64 });

    this.load.spritesheet("ennemi2_run_left", "./assets/ennemi2/ennemi2_run_left.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi2_run_right", "./assets/ennemi2/ennemi2_run_right.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi2_is_dead_right", "./assets/ennemi2/ennemi2_is_dead_right.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi2_is_dead_left", "./assets/ennemi2/ennemi2_is_dead_left.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi2_throw_left", "./assets/ennemi2/ennemi2_throw_left.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("ennemi2_throw_right", "./assets/ennemi2/ennemi2_throw_right.png", { frameWidth: 64, frameHeight: 64 });
    this.load.image("img_bombe", "./assets/ennemi2/bombe.png");

    // Bonus
    this.load.image("Distance_tir_B", "./assets/bonus/Distance_tir_B.png");
    this.load.image("Distance_tir_I", "./assets/bonus/Distance_tir_I.png");
    this.load.image("Distance_tir_E", "./assets/bonus/Distance_tir_E.png");
    this.load.image("Vie_en_plus_B", "./assets/bonus/Vie_en_plus_B.png");
    this.load.image("Vie_en_plus_I", "./assets/bonus/Vie_en_plus_I.png");
    this.load.image("Vie_en_plus_E", "./assets/bonus/Vie_en_plus_E.png");
    this.load.image("Soins_vie_B", "./assets/bonus/Soins_vie_B.png");
    this.load.image("Soins_vie_I", "./assets/bonus/Soins_vie_I.png");
    this.load.image("Soins_vie_E", "./assets/bonus/Soins_vie_E.png");
    this.load.image("cadence_tir_B", "./assets/bonus/cadence_tir_B.png");
    this.load.image("cadence_tir_I", "./assets/bonus/cadence_tir_I.png");
    this.load.image("cadence_tir_E", "./assets/bonus/cadence_tir_E.png");
    this.load.image("degats_B", "./assets/bonus/degats_B.png");
    this.load.image("degats_I", "./assets/bonus/degats_I.png");
    this.load.image("degats_E", "./assets/bonus/degats_E.png");
    this.load.image("vitesse_balle_B", "./assets/bonus/vitesse_balle_B.png");
    this.load.image("vitesse_balle_I", "./assets/bonus/vitesse_balle_I.png");
    this.load.image("vitesse_balle_E", "./assets/bonus/vitesse_balle_E.png");
    this.load.image("armure_B", "./assets/bonus/armure_B.png");
    this.load.image("armure_I", "./assets/bonus/armure_I.png");
    this.load.image("armure_E", "./assets/bonus/armure_E.png");

    // Tilemap
    this.load.image("Phaser_tuilesdejeu", "./assets/tileset_city.png");
    this.load.image("Phaser_tuilesdejeu2", "./assets/tileset_war.png");
    this.load.tilemapTiledJSON("carte", "./assets/carte.tmj");

    // Projectiles and weapons
    this.load.image("img_balle", "./assets/weapons/balle.png");
    this.load.image("weapons", "./assets/weapons/weapons.png");
    this.load.image("german_weapons", "./assets/weapons/german_weapons.png");

    // Health bar
    this.load.image("empty_health_bar", "./assets/healthbar/empty_health_bar.png");
    this.load.image("health", "./assets/healthbar/health.png");
    this.load.image("no_health", "./assets/healthbar/no_health.png");

    // Debug 404
    this.load.on('loaderror', (file) => {
      console.error('Fichier manquant:', file.src);
    });
  }

  create() {
    this.physics.world.gravity.y = 0;

    // Tilemap
    const carteDuNiveau = this.make.tilemap({ key: "carte" });
    const tileset = carteDuNiveau.addTilesetImage("tileset_city", "Phaser_tuilesdejeu");
    const tileset2 = carteDuNiveau.addTilesetImage("tileset_war", "Phaser_tuilesdejeu2");

    carteDuNiveau.createLayer("calque_background", [tileset, tileset2]);
    this.calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", [tileset, tileset2]);
    this.calque_background2 = carteDuNiveau.createLayer("calque_background2", [tileset, tileset2]);
    this.calque_barriere = carteDuNiveau.createLayer("calque_barriere", [tileset, tileset2]);

    this.calque_plateformes.setCollisionByProperty({ estSolide: true });
    this.calque_background2.setCollisionByProperty({ estSolide: true });
    this.calque_barriere.setCollisionByProperty({ estSolide: true });

    // Groupes
    this.groupe_soldats = this.physics.add.group();
    this.groupe_balles = this.physics.add.group();
    this.groupe_balles_ennemi = this.physics.add.group();

    this.largeurCarte = carteDuNiveau.widthInPixels;
    this.hauteurCarte = carteDuNiveau.heightInPixels;

    // Player
    this.player = new Player(this, 80, 350);
    this.player.setName("player");

    if (this.player && this.player.reinitialiserStats) {
      this.player.reinitialiserStats();
    }

    // Triggers
    const triggerLayer = carteDuNiveau.getObjectLayer("calque_trigger");
    if (triggerLayer && triggerLayer.objects.length > 0) {
      triggerLayer.objects.forEach(obj => {
        const trigger = this.add.zone(obj.x, obj.y, obj.width, obj.height);
        this.physics.world.enable(trigger);
        trigger.body.setAllowGravity(false);
        trigger.body.moves = false;
        this.physics.add.overlap(this.player, trigger, () => {
          this.changerNiveau();
        }, null, this);
      });
    }

    // Camera
    this.physics.world.setBounds(0, 0, this.largeurCarte, this.hauteurCarte);
    this.cameras.main.setBounds(0, 0, this.largeurCarte, this.hauteurCarte);
    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.roundPixels = true;

    // Collisions
    this.physics.add.collider(this.player, this.calque_plateformes);
    this.physics.add.collider(this.groupe_soldats, this.calque_plateformes);
    this.physics.add.collider(this.player, this.calque_background2);
    this.physics.add.collider(this.groupe_soldats, this.calque_background2);
    this.physics.add.collider(this.player, this.calque_barriere);
    this.physics.add.collider(this.groupe_soldats, this.calque_barriere);
    this.physics.add.overlap(this.player, this.groupe_soldats, this.collisionJoueurEnnemi, null, this);
    this.physics.add.overlap(this.groupe_balles, this.groupe_soldats, this.chocAvecBalles, null, this);
    this.physics.add.overlap(this.player, this.groupe_balles_ennemi, this.chocAvecBalleEnnemi, null, this);

    // Clavier
    this.clavier = this.input.keyboard.createCursorKeys();

    // Barre de vie
    const largeurBarre = 180;
    const hauteurBarre = 24;
    const barreVieX = 330;
    const barreVieY = 500;

    this.add.image(barreVieX, barreVieY, "no_health")
      .setOrigin(0, 0)
      .setDisplaySize(largeurBarre, hauteurBarre)
      .setScrollFactor(0)
      .setDepth(100);

    this.spriteBarreVieFond = this.add.image(barreVieX, barreVieY, "empty_health_bar")
      .setOrigin(0, 0)
      .setDisplaySize(largeurBarre, hauteurBarre)
      .setScrollFactor(0)
      .setDepth(101);

    this.spriteBarreVieRemplie = this.add.image(barreVieX, barreVieY, "health")
      .setOrigin(0, 0)
      .setDisplaySize(largeurBarre, hauteurBarre)
      .setScrollFactor(0)
      .setDepth(102);

    // UI Textes
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    this.texteVague = this.add.text(
      gameWidth / 2, 180,
      "VAGUE 1/5",
      {
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
      }
    )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(9999);

    this.texteTimer = this.add.text(
      gameWidth / 2, 200,
      "Prépare-toi !",
      {
        fontSize: "12px",
        color: "#ff4444",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true }
      }
    )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(9999);

    this.time.delayedCall(2000, () => {
      this.lancerVague();
    });
  }

  changerNiveau() {
    const statsJoueur = {
      vie: this.player.vie,
      vieMax: this.player.vieMax,
      degatsParBalle: this.player.degatsParBalle,
      cooldownTir: this.player.cooldownTir,
      vitesseDeplacementBase: this.player.vitesseDeplacementBase,
      armure: this.player.armure,
      rayonHitbox: this.player.rayonHitbox
    };
    this.scene.start('niveau2', { statsJoueur });
  }

  tirerRarete(categorieBonus) {
    const raretes = categorieBonus.rarete;
    const tableauRaretes = Object.keys(raretes);
    let poidsTotal = 0;
    tableauRaretes.forEach(rarete => {
      poidsTotal += raretes[rarete].poids;
    });
    let random = Math.random() * poidsTotal;
    for (let rarete of tableauRaretes) {
      random -= raretes[rarete].poids;
      if (random <= 0) {
        return rarete;
      }
    }
    return tableauRaretes[0];
  }

  generer3BonusDifferents() {
    const typesBonus = Object.keys(this.catalogueBonus);
    const bonusChoisis = [];
    const combinaisonsUtilisees = new Set();

    while (bonusChoisis.length < 3) {
      const typeBonus = Phaser.Utils.Array.GetRandom(typesBonus);
      const categorieBonus = this.catalogueBonus[typeBonus];
      const rarete = this.tirerRarete(categorieBonus);
      const cleCombinaison = `${typeBonus}_${rarete}`;

      if (!combinaisonsUtilisees.has(cleCombinaison)) {
        combinaisonsUtilisees.add(cleCombinaison);
        const bonusInfo = categorieBonus.rarete[rarete];
        bonusChoisis.push({
          type: typeBonus,
          rarete: rarete,
          nom: bonusInfo.nom,
          couleur: bonusInfo.couleur,
          effet: bonusInfo.effet
        });
      }
    }
    return bonusChoisis;
  }

  proposerBonus(callback) {
    this.physics.pause();
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    const overlay = this.add.rectangle(
      gameWidth / 2, gameHeight / 2,
      gameWidth, gameHeight,
      0x000000, 0.7
    )
      .setScrollFactor(0)
      .setDepth(150);

    const titre = this.add.text(
      gameWidth / 2, gameHeight / 2 - 120,
      'CHOISIS UN BONUS',
      {
        fontSize: '28px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(151);

    const bonusChoisis = this.generer3BonusDifferents();
    const elementsUI = [overlay, titre];
    const imagesBonus = [];
    let indexSelection = 0;

    bonusChoisis.forEach((bonus, index) => {
      const suffixeRarete = bonus.rarete === 'basique' ? 'B' :
        bonus.rarete === 'intermediaire' ? 'I' : 'E';

      const nomsImages = {
        'vie_max': 'Vie_en_plus',
        'soins': 'Soins_vie',
        'degats': 'degats',
        'cadence': 'cadence_tir',
        'vitesse': 'vitesse_balle',
        'armure': 'armure',
        'portee': 'Distance_tir'
      };

      const nomImage = `${nomsImages[bonus.type]}_${suffixeRarete}`;
      const espacement = 130;
      const xPos = gameWidth / 2 - espacement + index * espacement;
      const yPos = gameHeight / 2;

      const imageBonus = this.add.image(xPos, yPos, nomImage)
        .setOrigin(0.5)
        .setScale(1.0)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0)
        .setDepth(151);

      const texteBonus = this.add.text(
        xPos, yPos + 60,
        bonus.nom,
        {
          fontSize: '12px',
          fill: bonus.couleur,
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center'
        }
      )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(151);

      imagesBonus.push({ image: imageBonus, bonus: bonus });

      imageBonus.on('pointerover', () => {
        indexSelection = index;
        mettreAJourSelection();
      });

      imageBonus.on('pointerdown', () => {
        appliquerBonus();
      });

      elementsUI.push(imageBonus, texteBonus);
    });

    const mettreAJourSelection = () => {
      imagesBonus.forEach((item, index) => {
        if (index === indexSelection) {
          item.image.setTint(0xffffb9);
          item.image.setScale(1.15);
        } else {
          item.image.clearTint();
          item.image.setScale(1.0);
        }
      });
    };

    const appliquerBonus = () => {
      const bonusSelectionne = imagesBonus[indexSelection].bonus;
      bonusSelectionne.effet(this.player);
      if (this.updateBarreVie) {
        this.updateBarreVie();
      }

      // Nettoyer les listeners clavier
      if (toucheGauche) toucheGauche.off('down');
      if (toucheDroite) toucheDroite.off('down');
      if (toucheK) toucheK.off('down');

      elementsUI.forEach(el => el.destroy());
      this.physics.resume();
      callback();
    };

    mettreAJourSelection();

    // Gestion clavier
    const toucheGauche = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    const toucheDroite = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    const toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    toucheGauche.on('down', () => {
      indexSelection = (indexSelection - 1 + imagesBonus.length) % imagesBonus.length;
      mettreAJourSelection();
    });

    toucheDroite.on('down', () => {
      indexSelection = (indexSelection + 1) % imagesBonus.length;
      mettreAJourSelection();
    });

    toucheK.on('down', () => {
      appliquerBonus();
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
    this.texteVague.setText(`VAGUE ${this.vagueActuelle}/${this.maxVagues}`);
    this.texteTimer.setText("EN COURS...").setColor("#ff4444");
    this.spawnVague(config);
    this.gererSpawnEnnemi4();
  }

  spawnVague(config) {
    const typesEnnemis = [Ennemi1, Ennemi2, Ennemi3];
    this.tousEnnemisSpawnes = false;

    for (let i = 0; i < config.totalEnnemis; i++) {
      this.time.delayedCall(i * 500, () => {
        const trouverPositionValide = () => {
          let tentatives = 0;
          const maxTentatives = 50;
          while (tentatives < maxTentatives) {
            const x = Phaser.Math.Between(100, this.largeurCarte - 100);
            const y = 450;
            if (Math.abs(x - this.player.x) < 200) {
              tentatives++;
              continue;
            }
            const spriteWidth = 36;
            const spriteHeight = 48;
            const left = x - spriteWidth / 2;
            const right = x + spriteWidth / 2;
            const top = y - spriteHeight / 2;
            const bottom = y + spriteHeight / 2;

            const tileLeft = Math.floor(left / 32);
            const tileRight = Math.floor(right / 32);
            const tileTop = Math.floor(top / 32);
            const tileBottom = Math.floor(bottom / 32);

            let positionValide = true;
            for (let tileY = tileTop; tileY <= tileBottom; tileY++) {
              for (let tileX = tileLeft; tileX <= tileRight; tileX++) {
                const tuilePlateforme = this.calque_plateformes.getTileAt(tileX, tileY);
                const tuileBackground2 = this.calque_background2.getTileAt(tileX, tileY);
                const tuileBarriere = this.calque_barriere.getTileAt(tileX, tileY);

                if (tuilePlateforme || tuileBackground2 || tuileBarriere) {
                  positionValide = false;
                  break;
                }
              }
              if (!positionValide) break;
            }

            if (positionValide) {
              return { x, y };
            }
            tentatives++;
          }
          return { x: Phaser.Math.Between(100, this.largeurCarte - 100), y: 450 };
        };

        const position = trouverPositionValide();
        const TypeEnnemi = Phaser.Utils.Array.GetRandom(typesEnnemis);
        const ennemi = new TypeEnnemi(this, position.x, position.y);
        this.groupe_soldats.add(ennemi);

        if (i === config.totalEnnemis - 1) {
          this.tousEnnemisSpawnes = true;
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
    if (!intervalVague) return;

    this.timerEnnemi4 = this.time.addEvent({
      delay: intervalVague * 1000,
      callback: () => {
        if (!this.enPause && !this.vagueFinie && !this.toutesVaguesFinis && !this.gameOver) {
          new Ennemi4(this, this.largeurCarte, this.hauteurCarte);
        }
      },
      loop: true
    });
  }

  verifierFinVague() {
    if (this.vagueActuelle <= 0 || this.vagueFinie || this.enPause) return;
    if (!this.tousEnnemisSpawnes) return;

    const config = this.configVagues[this.vagueActuelle - 1];
    if (!config || !this.groupe_soldats) return;

    const ennemisActifs = this.groupe_soldats.getChildren().filter(e =>
      e.active && !e.estMort && !(e instanceof Ennemi4)
    ).length;

    if (ennemisActifs === 0) {
      this.vagueFinie = true;
      this.texteVague.setText(`VAGUE ${this.vagueActuelle} TERMINÉE !`).setColor("#ffffff");

      this.proposerBonus(() => {
        if (config.pauseApres > 0) {
          this.enPause = true;
          this.timerPause = config.pauseApres;
          const prochaineVague = this.vagueActuelle + 1;
          this.texteTimer.setText(`Vague ${prochaineVague} dans ${Math.ceil(this.timerPause)}s`).setColor("#ffffff");
        } else {
          this.time.delayedCall(1000, () => {
            this.lancerVague();
          });
        }
      });
    }
  }

  finirToutesLesVagues() {
    this.toutesVaguesFinis = true;

    if (this.timerEnnemi4) {
      this.timerEnnemi4.remove();
      this.timerEnnemi4 = null;
    }

    if (this.calque_barriere) {
      this.calque_barriere.setVisible(false);
      this.calque_barriere.forEachTile(tile => {
        if (tile) {
          tile.properties.estSolide = false;
          tile.setCollision(false);
        }
      });
    }

    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    const messageVictoire = this.add.text(
      gameWidth / 2, gameHeight / 2,
      'NIVEAU 1 TERMINÉ',
      {
        fontSize: '48px',
        fill: '#ffdd00',
        stroke: '#000',
        strokeThickness: 6,
        fontStyle: 'bold',
        shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 6, fill: true }
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200);

    this.time.delayedCall(3000, () => {
      messageVictoire.destroy();
    });

    this.texteVague.setVisible(false);
    this.texteTimer.setVisible(false);
  }

  update(time, delta) {
    if (this.gameOver || !this.player) {
      return;
    }

    // --- Gestion du joueur ---
    if (!this.player.estMort) {
      // Déplacements et tirs uniquement si vivant
      const enMouvement = this.player.move(this.clavier);
      this.player.updateHitbox();

      let ennemiCible = null;
      try {
        const ennemis = this.groupe_soldats.getChildren();
        ennemiCible = this.player.ennemiDansHitbox(ennemis);
      } catch (error) { }

      this.player.updateArme(ennemiCible);

      if (ennemiCible && !enMouvement) {
        try {
          this.player.tirer(ennemiCible);
        } catch (error) { }
      }

      if (!enMouvement && !this.gameOver) {
        this.player.anims.play("anim_idle", true);
        this.player.setFlipX(this.player.direction === "left");
      }
    }
    // --- Fin gestion joueur ---

    // Mise à jour des ennemis
    this.groupe_soldats.getChildren().forEach(ennemi => {
      if (ennemi && ennemi.update && !ennemi.estMort) {
        ennemi.update();
      }
    });

    // Nettoyer les balles hors écran
    this.groupe_balles.getChildren().forEach(balle => {
      if (
        balle.x < 0 || balle.x > this.physics.world.bounds.width ||
        balle.y < 0 || balle.y > this.physics.world.bounds.height
      ) {
        balle.destroy();
      }
    });

    // Gestion du timer entre les vagues
    if (this.enPause && this.timerPause > 0) {
      this.timerPause -= delta / 1000;

      if (this.timerPause <= 0) {
        this.enPause = false;
        this.timerPause = 0;
        this.lancerVague();
      } else {
        const tempsRestant = Math.ceil(this.timerPause);
        const prochaineVague = this.vagueActuelle + 1;
        this.texteTimer.setText(
          `Vague ${prochaineVague} dans ${tempsRestant}s`
        ).setColor("#ff4444");
      }
    }

    if (!this.toutesVaguesFinis && !this.enPause) {
      this.verifierFinVague();
    }
  }


  collisionJoueurEnnemi(joueur, ennemi) {
    if (ennemi.estMort || ennemi instanceof Ennemi3) return;

    // Vérifier si assez de temps s'est écoulé depuis le dernier dégât de collision
    const maintenant = this.time.now;
    if (!this.dernierDegatsCollision) this.dernierDegatsCollision = 0;

    // Cooldown de 1000ms entre chaque dégât de collision
    if (maintenant - this.dernierDegatsCollision > 1000) {
      if (typeof joueur.prendreDegats === 'function') {
        joueur.prendreDegats(5);
        this.dernierDegatsCollision = maintenant;
      }
    }
  }

  chocAvecBalles(balle, soldat) {
    balle.destroy();
    if (typeof soldat.prendreDegats === 'function') {
      soldat.prendreDegats(this.player.degatsParBalle);
    } else {
      soldat.destroy();
    }
  }

  chocAvecBalleEnnemi(joueur, balle) {
    if (!balle || !balle.active) return;
    balle.destroy();
    if (typeof joueur.prendreDegats === 'function') {
      joueur.prendreDegats(10);
    }
  }

  updateBarreVie() {
    if (!this.player || !this.spriteBarreVieRemplie) return;

    const largeurMax = 170;
    const ratio = Math.max(0, Math.min(1, this.player.vie / this.player.vieMax));
    const largeurVie = largeurMax * ratio;

    const textureWidth = this.spriteBarreVieRemplie.texture.getSourceImage().width;
    const textureHeight = this.spriteBarreVieRemplie.texture.getSourceImage().height;
    const cropWidth = textureWidth * ratio;

    this.spriteBarreVieRemplie.setCrop(0, 0, cropWidth, textureHeight);
    this.spriteBarreVieRemplie.setDisplaySize(largeurVie, 24);
  }

  gererGameOver() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.physics.pause();

    if (this.timerEnnemi4) {
      this.timerEnnemi4.remove();
      this.timerEnnemi4 = null;
    }

    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    this.texteVague.setVisible(false);
    this.texteTimer.setVisible(false);

    const messageGameOver = this.add.text(
      gameWidth / 2, gameHeight / 2 - 80,
      'GAME OVER',
      {
        fontSize: '48px',
        fill: '#ff4444',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8,
        shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 6, fill: true }
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200);

    const boutonRejouer = this.add.image(
      gameWidth / 2, gameHeight / 2 + 20,
      'bouton_rejouer'
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(200);

    const boutonMenu = this.add.image(
      gameWidth / 2, gameHeight / 2 + 80,
      'bouton_quitter'
    )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(200);

    const boutons = [boutonRejouer, boutonMenu];
    let indexSelection = 0;

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setTint(0xffffb9);
          bouton.setScale(1.1);
        } else {
          bouton.clearTint();
          bouton.setScale(1);
        }
      });
    };

    mettreAJourSelection();

    boutonRejouer.on('pointerover', () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    boutonRejouer.on('pointerdown', () => {
      this.gameOver = false;
      this.vagueActuelle = 0;
      if (this.player && this.player.reinitialiserStats) {
        this.player.reinitialiserStats();
      }
      this.scene.restart();
    });

    boutonMenu.on('pointerover', () => {
      indexSelection = 1;
      mettreAJourSelection();
    });

    boutonMenu.on('pointerdown', () => {
      this.gameOver = false;
      this.scene.start('menu');
    });

    this.toucheHaut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.toucheBas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.toucheHaut.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheBas.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheK.on('down', () => {
      if (indexSelection === 0) {
        this.gameOver = false;
        this.vagueActuelle = 0;
        if (this.player && this.player.reinitialiserStats) {
          this.player.reinitialiserStats();
        }
        this.scene.restart();
      } else {
        this.gameOver = false;
        this.scene.start('menu');
      }
    });
  }
}