class Joueur1vs1 extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, nom, couleur) {
    super(scene, x, y, 'img_player_idle');

    this.scene = scene;
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(36, 48);
    this.body.setOffset(14, 18);
    this.body.setAllowGravity(false);

    this.nom = nom;
    this.couleur = couleur;
    this.setTint(couleur);
    this.direction = "right";
    this.estMort = false;
    this.invincible = false;

    // Stats
    this.vie = 100;
    this.vieMax = 100;
    this.degatsParBalle = 25;
    this.vitesse = 225;
    this.cooldownTir = 700;
    this.dernierTir = 0;
    this.vitesseBalles = 400;

    // Arme (sprite simple, pas de physique)
    this.arme = scene.add.sprite(x, y, "weapons");
    this.arme.setOrigin(0, 0.5);
    this.arme.setDepth(5);
    this.armeLongueur = 39;

    // Groupe de balles (sera assigné par la scène)
    this.groupe_balles = null;
  }

  move(clavier) {
    if (this.estMort) return false;

    let enMouvement = false;

    // Horizontal
    if (clavier.right.isDown) {
      this.setVelocityX(this.vitesse);
      this.anims.play("anim_run", true);
      this.direction = "right";
      this.setFlipX(false);
      enMouvement = true;
    } else if (clavier.left.isDown) {
      this.setVelocityX(-this.vitesse);
      this.anims.play("anim_run", true);
      this.direction = "left";
      this.setFlipX(true);
      enMouvement = true;
    } else {
      this.setVelocityX(0);
    }

    // Vertical
    if (clavier.up.isDown) {
      this.setVelocityY(-this.vitesse);
      this.anims.play("anim_run", true);
      enMouvement = true;
    } else if (clavier.down.isDown) {
      this.setVelocityY(this.vitesse);
      this.anims.play("anim_run", true);
      enMouvement = true;
    } else {
      this.setVelocityY(0);
    }

    return enMouvement;
  }

  updateArme(adversaire) {
    if (!this.arme) return;

    // Positionner l'arme au centre du joueur
    this.arme.x = this.body.center.x - 5;
    this.arme.y = this.body.center.y + 5;

    if (adversaire && adversaire.body) {
      // Orienter vers l'adversaire
      const angle = Phaser.Math.Angle.Between(
        this.arme.x,
        this.arme.y,
        adversaire.body.center.x,
        adversaire.body.center.y
      );
      this.arme.rotation = angle;

      // Flip du sprite joueur
      if (adversaire.body.center.x < this.body.center.x) {
        this.direction = "left";
        this.setFlipX(true);
      } else {
        this.direction = "right";
        this.setFlipX(false);
      }

      // Flip de l'arme selon l'angle
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        this.arme.setFlipY(true);
      } else {
        this.arme.setFlipY(false);
      }
    } else {
      // Orientation simple selon direction
      if (this.direction === "left") {
        this.arme.rotation = Math.PI;
        this.arme.setFlipY(true);
      } else {
        this.arme.rotation = 0;
        this.arme.setFlipY(false);
      }
    }
  }

  prendreDegats(qte, barreVie) {
    if (this.invincible || this.estMort) return;

    this.vie -= qte;
    if (this.vie < 0) this.vie = 0;

    // Mise à jour de la barre de vie
    if (barreVie) {
      const ratio = this.vie / this.vieMax;
      barreVie.width = 50 * ratio;
    }

    // Flash rouge
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      if (this.active && !this.estMort) this.setTint(this.couleur);
    });

    // Invincibilité temporaire
    this.invincible = true;
    this.scene.time.delayedCall(1000, () => {
      this.invincible = false;
    });

    // Vérifier la mort
    if (this.vie <= 0) {
      this.mourir();
    }
  }

  mourir() {
    if (this.estMort) return;
    this.estMort = true;

    this.setVelocity(0, 0);
    if (this.arme) this.arme.setVisible(false);
    
    this.anims.play("anim_player_dead");
  }
}

// ====================
// SCÈNE PRINCIPALE (seul export)
// ====================
export default class mode1vs1 extends Phaser.Scene {
  constructor() {
    super({ key: "mode1vs1" });

    this.joueur1 = null;
    this.joueur2 = null;
    this.clavier1 = null;
    this.clavier2 = null;

    this.groupe_balles_j1 = null;
    this.groupe_balles_j2 = null;

    this.calque_plateformes = null;
    this.calque_background2 = null;

    this.barreVieJ1 = null;
    this.barreVieJ1Bg = null;
    this.barreVieJ2 = null;
    this.barreVieJ2Bg = null;

    this.gameOver = false;
    this.gagnant = null;
    this.canShoot1 = true;
    this.canShoot2 = true;
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL || "";
    this.load.setBaseURL(baseURL);

    // Sprites joueurs
    this.load.spritesheet("img_player_idle", "./assets/player/player_normal_idle.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_player_run", "./assets/player/player_run.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_player_dead", "./assets/player/player_is_dead.png", { frameWidth: 64, frameHeight: 64 });

    // Tilemap
    this.load.image("Phaser_tuilesdejeu", "./assets/tileset_city.png");
    this.load.image("Phaser_tuilesdejeu2", "./assets/tileset_war.png");
    this.load.tilemapTiledJSON("carte", "./assets/carte.tmj");

    // Armes et projectiles
    this.load.image("img_balle", "./assets/weapons/balle.png");
    this.load.image("weapons", "./assets/weapons/weapons.png");
  }

  create() {
    this.gameOver = false;
    this.gagnant = null;
    this.canShoot1 = true;
    this.canShoot2 = true;
    this.physics.world.gravity.y = 0;

    // --- Tilemap ---
    const carte = this.make.tilemap({ key: "carte" });
    const tileset = carte.addTilesetImage("tileset_city", "Phaser_tuilesdejeu");
    const tileset2 = carte.addTilesetImage("tileset_war", "Phaser_tuilesdejeu2");

    carte.createLayer("calque_background", [tileset, tileset2]);
    this.calque_plateformes = carte.createLayer("calque_plateformes", [tileset, tileset2]);
    this.calque_background2 = carte.createLayer("calque_background2", [tileset, tileset2]);

    this.calque_plateformes.setCollisionByProperty({ estSolide: true });
    this.calque_background2.setCollisionByProperty({ estSolide: true });

    const largeurCarte = carte.widthInPixels;
    const hauteurCarte = carte.heightInPixels;

    // --- Groupes de balles ---
    this.groupe_balles_j1 = this.physics.add.group();
    this.groupe_balles_j2 = this.physics.add.group();

    // --- Création des joueurs ---
    this.joueur1 = new Joueur1vs1(this, 200, 350, "Joueur 1", 0x4a9eff);
    this.joueur1.groupe_balles = this.groupe_balles_j1;

    this.joueur2 = new Joueur1vs1(this, largeurCarte - 200, 350, "Joueur 2", 0xff6b35);
    this.joueur2.groupe_balles = this.groupe_balles_j2;

    // --- Contrôles ---
    this.clavier1 = this.input.keyboard.createCursorKeys();
    this.clavier1.shoot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.clavier2 = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      shoot: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
    };

    // --- Collisions ---
    this.physics.add.collider(this.joueur1, this.calque_plateformes);
    this.physics.add.collider(this.joueur2, this.calque_plateformes);
    this.physics.add.collider(this.joueur1, this.calque_background2);
    this.physics.add.collider(this.joueur2, this.calque_background2);

    this.physics.add.collider(this.groupe_balles_j1, this.calque_plateformes, (b) => b.destroy());
    this.physics.add.collider(this.groupe_balles_j2, this.calque_plateformes, (b) => b.destroy());

    this.physics.add.overlap(this.groupe_balles_j1, this.joueur2, this.balleJ1ToucheJ2, null, this);
    this.physics.add.overlap(this.groupe_balles_j2, this.joueur1, this.balleJ2ToucheJ1, null, this);

    // --- Caméras split-screen ---
const width = this.cameras.main.width;    // Déclarer UNE SEULE FOIS
const height = this.cameras.main.height;

// Créer le séparateur (maintenant width et height existent)
const separator = this.add.rectangle(width / 2, height / 2, 2, height, 0xffffff);
separator.setScrollFactor(0);
separator.setDepth(9999);

console.log("Séparateur créé :", separator);

// Ensuite configurer les caméras
this.cameras.main.setViewport(0, 0, width / 2, height);
this.cameras.main.startFollow(this.joueur1);
this.cameras.main.setBounds(0, 0, largeurCarte, hauteurCarte);
this.cameras.main.setZoom(2);

const camera2 = this.cameras.add(width / 2, 0, width / 2, height);
camera2.startFollow(this.joueur2);
camera2.setBounds(0, 0, largeurCarte, hauteurCarte);
camera2.setZoom(2);

   

    // --- Barres de vie ---
    this.creerBarresDeVie();

    // --- Texte de début ---
    const texteDebut = this.add.text(width / 4, height / 2, "COMBAT !", {
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);

    const texteControles = this.add.text(width / 4, height / 2 + 120, "Appuyez sur A pour tirer", {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);

    this.time.delayedCall(2000, () => {
      texteDebut.destroy();
      texteControles.destroy();
    });

    // --- Animations ---
    this.creerAnimations();
  }

  creerAnimations() {
    if (!this.anims.exists("anim_idle")) {
      this.anims.create({
        key: "anim_idle",
        frames: this.anims.generateFrameNumbers("img_player_idle", { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
    }
    if (!this.anims.exists("anim_run")) {
      this.anims.create({
        key: "anim_run",
        frames: this.anims.generateFrameNumbers("img_player_run", { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!this.anims.exists("anim_player_dead")) {
      this.anims.create({
        key: "anim_player_dead",
        frames: this.anims.generateFrameNumbers("img_player_dead", { start: 0, end: 4 }),
        frameRate: 7,
        repeat: 0
      });
    }
  }

  creerBarresDeVie() {
    // Joueur 1
    this.barreVieJ1Bg = this.add.rectangle(0, 0, 52, 8, 0xffffff).setOrigin(0, 0).setDepth(1000);
    this.barreVieJ1 = this.add.rectangle(0, 0, 50, 6, 0x00ff00).setOrigin(0, 0).setDepth(1001);

    // Joueur 2
    this.barreVieJ2Bg = this.add.rectangle(0, 0, 52, 8, 0xffffff).setOrigin(0, 0).setDepth(1000);
    this.barreVieJ2 = this.add.rectangle(0, 0, 50, 6, 0xff6b35).setOrigin(0, 0).setDepth(1001);
  }

  updateBarresDeViePosition() {
    if (this.joueur1 && this.barreVieJ1) {
      const x1 = this.joueur1.x - 26;
      const y1 = this.joueur1.y - 40;
      this.barreVieJ1Bg.setPosition(x1, y1);
      this.barreVieJ1.setPosition(x1 + 1, y1 + 1);
    }

    if (this.joueur2 && this.barreVieJ2) {
      const x2 = this.joueur2.x - 26;
      const y2 = this.joueur2.y - 40;
      this.barreVieJ2Bg.setPosition(x2, y2);
      this.barreVieJ2.setPosition(x2 + 1, y2 + 1);
    }
  }

  balleJ1ToucheJ2(obj1, obj2) {
    // Identifier qui est la balle et qui est le joueur
    let balle, joueur;
    
    if (obj1.texture && obj1.texture.key === 'img_balle') {
      balle = obj1;
      joueur = obj2;
    } else {
      balle = obj2;
      joueur = obj1;
    }
    
    if (!balle || !balle.active) return;
    if (!joueur || joueur.estMort) return;
    
    balle.destroy();
    
    if (typeof joueur.prendreDegats === 'function') {
      joueur.prendreDegats(this.joueur1.degatsParBalle, this.barreVieJ2);
      
      if (joueur.estMort && !this.gameOver) {
        this.finirCombat("JOUEUR 1");
      }
    }
  }

  balleJ2ToucheJ1(obj1, obj2) {
    // Identifier qui est la balle et qui est le joueur
    let balle, joueur;
    
    if (obj1.texture && obj1.texture.key === 'img_balle') {
      balle = obj1;
      joueur = obj2;
    } else {
      balle = obj2;
      joueur = obj1;
    }
    
    if (!balle || !balle.active) return;
    if (!joueur || joueur.estMort) return;
    
    balle.destroy();
    
    if (typeof joueur.prendreDegats === 'function') {
      joueur.prendreDegats(this.joueur2.degatsParBalle, this.barreVieJ1);
      
      if (joueur.estMort && !this.gameOver) {
        this.finirCombat("JOUEUR 2");
      }
    }
  }

  gererTir(joueur, adversaire, clavier, canShoot) {
    if (!joueur || joueur.estMort || !canShoot || !clavier.shoot) return false;

    if (clavier.shoot.isDown) {
      joueur.updateArme(adversaire);

      const maintenant = this.time.now;
      if (maintenant - joueur.dernierTir < joueur.cooldownTir) return false;

      const angle = joueur.arme.rotation;
      const boutX = joueur.arme.x + Math.cos(angle) * joueur.armeLongueur;
      const boutY = joueur.arme.y + Math.sin(angle) * joueur.armeLongueur;

      const balle = joueur.groupe_balles.create(boutX, boutY, "img_balle");
      balle.body.setAllowGravity(false);
      balle.setVelocity(
        Math.cos(angle) * joueur.vitesseBalles,
        Math.sin(angle) * joueur.vitesseBalles
      );
      balle.rotation = angle;

      this.time.delayedCall(2000, () => {
        if (balle && balle.active) balle.destroy();
      });

      joueur.dernierTir = maintenant;
      return true;
    }
    return false;
  }

  update(time, delta) {
    if (this.gameOver) return;

    this.updateBarresDeViePosition();

    // Joueur 1
    if (this.joueur1 && !this.joueur1.estMort) {
      const moving1 = this.joueur1.move(this.clavier1);
      this.joueur1.updateArme(this.joueur2);

      if (this.gererTir(this.joueur1, this.joueur2, this.clavier1, this.canShoot1)) {
        this.canShoot1 = false;
        this.time.delayedCall(this.joueur1.cooldownTir, () => {
          this.canShoot1 = true;
        });
      }

      if (!moving1) this.joueur1.anims.play("anim_idle", true);
    }

    // Joueur 2
    if (this.joueur2 && !this.joueur2.estMort) {
      const moving2 = this.joueur2.move(this.clavier2);
      this.joueur2.updateArme(this.joueur1);

      if (this.gererTir(this.joueur2, this.joueur1, this.clavier2, this.canShoot2)) {
        this.canShoot2 = false;
        this.time.delayedCall(this.joueur2.cooldownTir, () => {
          this.canShoot2 = true;
        });
      }

      if (!moving2) this.joueur2.anims.play("anim_idle", true);
    }

    // Nettoyer balles hors écran
    this.groupe_balles_j1.getChildren().forEach(b => {
      if (b && b.active && (b.x < 0 || b.x > this.physics.world.bounds.width || 
          b.y < 0 || b.y > this.physics.world.bounds.height)) {
        b.destroy();
      }
    });
    this.groupe_balles_j2.getChildren().forEach(b => {
      if (b && b.active && (b.x < 0 || b.x > this.physics.world.bounds.width || 
          b.y < 0 || b.y > this.physics.world.bounds.height)) {
        b.destroy();
      }
    });
  }

  finirCombat(gagnant) {
    if (this.gameOver) return;
    
    this.gameOver = true;
    this.gagnant = gagnant;
    this.physics.pause();

    // Vérifier que le gagnant existe
    const joueurGagnant = gagnant === "JOUEUR 1" ? this.joueur1 : this.joueur2;
    if (!joueurGagnant) return;

    // Récupérer et détruire la deuxième caméra si elle existe
    const cameras = this.cameras.cameras;
    if (cameras && cameras.length > 1) {
      this.cameras.remove(cameras[1]);
    }

    // Recentrer la caméra principale sur le gagnant
    const mainCamera = this.cameras.main;
    mainCamera.setViewport(0, 0, this.scale.width, this.scale.height);
    mainCamera.startFollow(joueurGagnant);
    mainCamera.setZoom(2);

    // Détruire le séparateur (rectangle blanc de largeur 4)
    this.children.each((child) => {
      if (child && child.type === 'Rectangle' && child.width === 4 && child.depth === 10000) {
        child.destroy();
      }
    });

    const screenCenterX = this.scale.width / 2;
    const screenCenterY = this.scale.height / 2;
    const couleur = gagnant === "JOUEUR 1" ? '#ffffffff' : '#ffffffff';

    // Texte victoire
    this.add.text(screenCenterX, screenCenterY - 100, `${gagnant} GAGNE !`, {
      fontSize: '48px',
      fill: couleur,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 6, fill: true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);

    // Bouton Rejouer
    const boutonRejouer = this.add.image(screenCenterX - 100, screenCenterY + 50, "bouton_rejouer")
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setScale(1)
      .setInteractive();

    // Bouton Quitter
    const boutonQuitter = this.add.image(screenCenterX + 100, screenCenterY + 50, "bouton_quitter")
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setScale(1)
      .setInteractive();

    const boutons = [boutonRejouer, boutonQuitter];
    let indexSelection = 0;

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setScale(1.5);
        } else {
          bouton.setScale(1);
        }
      });
    };

    mettreAJourSelection();

    // Interactions souris
    boutonRejouer.on("pointerover", () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    boutonRejouer.on("pointerdown", () => {
      this.scene.restart();
    });

    boutonQuitter.on("pointerover", () => {
      indexSelection = 1;
      mettreAJourSelection();
    });

    boutonQuitter.on("pointerdown", () => {
      this.scene.start("menu");
    });

    // Clavier
    const toucheGauche = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    const toucheDroite = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    const toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    toucheGauche.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    toucheDroite.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    toucheK.on('down', () => {
      if (indexSelection === 0) {
        this.scene.restart();
      } else if (indexSelection === 1) {
        this.scene.start("menu");
      }
    });
  }
}