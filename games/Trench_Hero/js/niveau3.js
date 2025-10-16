import Player from './Player.js';
import * as fct from "./fonctions.js";
import { Ennemi3, Ennemi2, Ennemi1, Ennemi4, Ennemi5 } from './Ennemis.js';

export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });

    this.player = null;
    this.clavier = null;
    this.gameOver = false;
    this.calque_plateformes2 = null;
    this.calque_plateformes = null;
    this.calque_background2 = null;
    this.spriteBarreVieFond = null;
    this.spriteBarreVieRemplie = null;
    this.boss = null;
    this.timerSpawnEnnemi = null;
    this.niveauTermine = false;

    this.groupe_soldats = null;
    this.groupe_balles = null;
    this.groupe_balles_ennemi = null;
    this.groupe_items = null;

    this.timerAvion = null;

    // BONUS
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
              player.vitesseBalles = Math.floor(player.vitesseBalles * 1.20);
            }
          },
          intermediaire: {
            nom: "+40% Vitesse balles",
            couleur: "#4a9eff",
            poids: 30,
            effet: (player) => {
              player.vitesseBalles = Math.floor(player.vitesseBalles * 1.40);
            }
          },
          expert: {
            nom: "+80% Vitesse balles",
            couleur: "#ff6b35",
            poids: 10,
            effet: (player) => {
              player.vitesseBalles = Math.floor(player.vitesseBalles * 1.80);
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
    this.statsJoueur = data.statsJoueur || null;
  }

  preload() {
    this.load.tilemapTiledJSON("carte3", "./assets/carte3.tmj");
  }

  create() {
    this.boss = null;
    this.timerSpawnEnnemi = null;
    this.niveauTermine = false;
    this.gameOver = false;
    this.physics.world.gravity.y = 0;

    // --- Tilemap ---
    const carteDuNiveau = this.make.tilemap({ key: "carte3" });
    const tileset = carteDuNiveau.addTilesetImage("tileset_city", "Phaser_tuilesdejeu");
    const tileset2 = carteDuNiveau.addTilesetImage("tileset_war", "Phaser_tuilesdejeu2");

    carteDuNiveau.createLayer("calque_background", [tileset, tileset2]);
    this.calque_plateformes2 = carteDuNiveau.createLayer("calque_plateformes2", [tileset, tileset2]);
    this.calque_plateformes = carteDuNiveau.createLayer("calque_plateformes", [tileset, tileset2]);
    this.calque_background2 = carteDuNiveau.createLayer("calque_background2", [tileset, tileset2]);

    this.calque_plateformes2.setCollisionByProperty({ estSolide: true });
    this.calque_plateformes.setCollisionByProperty({ estSolide: true });
    this.calque_background2.setCollisionByProperty({ estSolide: true });

    // --- Groupes ---
    this.groupe_soldats = this.physics.add.group();
    this.groupe_balles = this.physics.add.group();
    this.groupe_balles_ennemi = this.physics.add.group();
    this.groupe_items = this.physics.add.group();

    this.largeurCarte = carteDuNiveau.widthInPixels;
    this.hauteurCarte = carteDuNiveau.heightInPixels;

    this.player = new Player(this, 600, 900); //600 900 896 192
    this.player.setName("player");

    // Restaurer les stats du joueur
    if (this.statsJoueur) {
      this.player.vie = this.statsJoueur.vie;
      this.player.vieMax = this.statsJoueur.vieMax;
      this.player.degatsParBalle = this.statsJoueur.degatsParBalle;
      this.player.cooldownTir = this.statsJoueur.cooldownTir;
      this.player.vitesseDeplacementBase = this.statsJoueur.vitesseDeplacementBase;
      this.player.hitsAbsorbes = this.statsJoueur.hitsAbsorbes || 0;
      this.player.rayonHitbox = this.statsJoueur.rayonHitbox;
      this.player.vitesseBalles = this.statsJoueur.vitesseBalles || 400;
    }

    // --- Camera ---
    this.physics.world.setBounds(0, 0, this.largeurCarte, this.hauteurCarte);
    this.cameras.main.setBounds(0, 0, this.largeurCarte, this.hauteurCarte);
    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.roundPixels = true;

    // --- Collisions ---
    this.physics.add.collider(this.player, this.calque_plateformes);
    this.physics.add.collider(this.groupe_soldats, this.calque_plateformes);
    this.physics.add.collider(this.player, this.calque_background2);
    this.physics.add.collider(this.groupe_soldats, this.calque_background2);
    this.physics.add.collider(this.player, this.calque_plateformes2);
    this.physics.add.collider(this.groupe_soldats, this.calque_plateformes2);
    this.physics.add.overlap(this.player, this.groupe_soldats, this.collisionJoueurEnnemi, null, this);
    this.physics.add.overlap(this.groupe_balles, this.groupe_soldats, this.chocAvecBalles, null, this);
    this.physics.add.overlap(this.groupe_balles_ennemi, this.player, this.chocAvecBalleEnnemi, null, this);
    this.physics.add.overlap(this.player, this.groupe_items, this.joueurPrenItem, null, this);
    this.physics.add.collider(this.groupe_soldats, this.groupe_soldats);

    // --- Clavier ---
    this.clavier = this.input.keyboard.createCursorKeys();

    // --- Barre de vie ---
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

    // --- UI Textes ---
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    this.texteVague = this.add.text(
      gameWidth / 2, 180,
      "NIVEAU 3 - BOSS",
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
      "Le boss arrive...",
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

    this.sound.play('cloches');

    this.time.delayedCall(5000, () => {
      this.lancerBoss();
    });
  }

  demarrerSpawnAvions() {
    if (this.timerAvion) {
      this.timerAvion.remove();
    }

    this.timerAvion = this.time.addEvent({
      delay: 8000, // Un avion toutes les 8 secondes
      callback: () => {
        if (!this.niveauTermine && !this.gameOver && this.boss && !this.boss.estMort) {
          new Ennemi4(this, this.largeurCarte, this.hauteurCarte);
        }
      },
      loop: true
    });
  }

  lancerBoss() {
    const xBoss = 832;
    const yBoss = 192;
    this.boss = new Ennemi5(this, xBoss, yBoss);
    this.groupe_soldats.add(this.boss);

    this.sound.play('chaine_tank');

    this.boss.anims.play("ennemi5_move", true);
    this.tweens.add({
      targets: this.boss,
      x: 832,
      y: 544,
      duration: 5000,
      ease: 'Power1',
      onComplete: () => {
        this.boss.enPosition = true;
        // Une fois le boss en position, démarrer la musique en boucle
        if (!this.sound.get('musique_lvl3')) {
          this.musiqueNiveau = this.sound.add('musique_lvl3', {
            loop: true,
            volume: 0.5
          });
          this.musiqueNiveau.play();
        }

        this.texteTimer.setText("Le boss est là !");
        this.demarrerSpawnEnnemiAutourBoss();
        this.demarrerSpawnAvions();
      }
    });
  }

  demarrerSpawnEnnemiAutourBoss() {
    if (this.timerSpawnEnnemi) {
      this.timerSpawnEnnemi.remove();
    }

    this.spawnEnnemiAutourBoss();
  }

  spawnEnnemiAutourBoss() {
    if (!this.boss || this.boss.estMort || this.niveauTermine) return;

    let delai = 5000;
    if (this.boss.vie <= 1500 && this.boss.vie > 1000) delai = 50000;
    else if (this.boss.vie <= 1000 && this.boss.vie > 500) delai = 50000;
    else if (this.boss.vie <= 500) delai = 50000;

    if (this.timerSpawnEnnemi) {
      this.timerSpawnEnnemi.remove();
    }

    this.timerSpawnEnnemi = this.time.addEvent({
      delay: delai,
      callback: () => {
        if (this.boss && !this.boss.estMort && !this.niveauTermine) {
          this.creerEnnemiAutourBoss();
          this.spawnEnnemiAutourBoss();
        }
      }
    });
  }

  creerEnnemiAutourBoss() {
    if (!this.boss || this.boss.estMort) return;

    const angle = Math.random() * Math.PI * 2;
    const rayon = 150 + Math.random() * 100;
    const x = this.boss.x + Math.cos(angle) * rayon;
    const y = this.boss.y + Math.sin(angle) * rayon;

    const typesEnnemis = [Ennemi1, Ennemi2, Ennemi3];
    const TypeEnnemi = Phaser.Utils.Array.GetRandom(typesEnnemis);
    const ennemi = new TypeEnnemi(this, x, y);
    this.groupe_soldats.add(ennemi);
  }

  joueurPrenItem(joueur, item) {
    if (!item || !item.active) return;

    const type = item.getData("type");
    let soins = 0;

    if (type === "pansement") {
      soins = 10;
    } else if (type === "bandage") {
      soins = 20;
    } else if (type === "trousse") {
      soins = 50;
    }

    if (soins > 0) {
      joueur.vie += soins;
      if (joueur.vie > joueur.vieMax) joueur.vie = joueur.vieMax;

      if (this.updateBarreVie) {
        this.updateBarreVie();
      }

      joueur.setTint(0x00ff00);
      this.time.delayedCall(300, () => {
        if (joueur.active) joueur.clearTint();
      });
    }

    item.destroy();
  }

  finirNiveau() {
    if (this.timerSpawnEnnemi) {
      this.timerSpawnEnnemi.remove();
      this.timerSpawnEnnemi = null;
    }
    if (this.timerAvion) { // Ajouter ces lignes
      this.timerAvion.remove();
      this.timerAvion = null;
    }

    this.physics.pause();

    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    const messageVictoire = this.add.text(
      gameWidth / 2, gameHeight / 2,
      'BOSS VAINCU !',
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

    this.texteVague.setVisible(false);
    this.texteTimer.setVisible(false);

    if (this.musiqueNiveau) {
        this.musiqueNiveau.stop();
        this.musiqueNiveau = null;
    }

    this.time.delayedCall(3000, () => {
      messageVictoire.destroy();
      this.scene.start('victoire');
    });
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
    this.player.invincible = true;

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

      this.player.invincible = false;

      if (toucheGauche) toucheGauche.off('down');
      if (toucheDroite) toucheDroite.off('down');
      if (toucheK) toucheK.off('down');

      elementsUI.forEach(el => el.destroy());
      this.physics.resume();
      callback();
    };

    mettreAJourSelection();

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

  update(time, delta) {
    if (this.gameOver || !this.player || this.player.estMort) return;

    if (this.boss && this.boss.estMort && !this.niveauTermine) {
      this.niveauTermine = true;
      this.finirNiveau();
      return;
    }

    this.groupe_soldats.getChildren().forEach(ennemi => {
      if (ennemi && ennemi.update && !ennemi.estMort) {
        ennemi.update();
      }
    });

    this.groupe_balles.getChildren().forEach(balle => {
      if (balle.x < 0 || balle.x > this.physics.world.bounds.width ||
        balle.y < 0 || balle.y > this.physics.world.bounds.height) {
        balle.destroy();
      }
    });

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

    this.updateBarreVie();
  }

  collisionJoueurEnnemi(joueur, ennemi) {
    if (ennemi.estMort || ennemi instanceof Ennemi3) return;

    if (typeof joueur.prendreDegats === 'function') {
      joueur.prendreDegats(5);
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

    if (this.musiqueNiveau) {
        this.musiqueNiveau.stop();
        this.musiqueNiveau = null;
    }

    // Jouer son défaite
    if (this.sound && this.sound.play) {
      this.sound.play('defaite', { volume: 1.0 });
    }

    this.gameOver = true;
    this.physics.pause();

    if (this.timerSpawnEnnemi) {
      this.timerSpawnEnnemi.remove();
      this.timerSpawnEnnemi = null;
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
      this.scene.stop('niveau3');
      this.scene.start('selection', { restart: true });
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
        this.scene.stop('niveau3');
        this.scene.start('selection', { restart: true });
      } else {
        this.scene.start('menu');
      }
    });
  }
}