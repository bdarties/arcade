export default class niveau3 extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3" });
  }

  joueurMort() {
    this.gameOverActive = true;
    this.physics.pause();

    // Création de deux textes Game Over, un pour chaque caméra
    // Texte pour la caméra gauche
    const gameOverText1 = this.add.text(320, 360, 
      "GAME OVER\nAppuyez sur B pour recommencer", {
        fontSize: "32px",
        fill: "#ff0000",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center"
      }).setOrigin(0.5);
    gameOverText1.setScrollFactor(0);
    this.camera2.ignore(gameOverText1); // Caméra droite ignore ce texte

    // Texte pour la caméra droite
    const gameOverText2 = this.add.text(320, 360, 
      "GAME OVER\nAppuyez sur B pour recommencer", {
        fontSize: "32px",
        fill: "#ff0000",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center"
      }).setOrigin(0.5);
    gameOverText2.setScrollFactor(0);
    this.camera1.ignore(gameOverText2); // Caméra gauche ignore ce texte

    // Nettoyage des anciens listeners et ajout du nouveau
    this.input.keyboard.off("keydown-O");
    this.input.keyboard.on("keydown-O", () => {
      this.scene.restart();
    });
  }

  preload() {
    this.load.image("fond_gauche", "./assets/grotte2.jpg");
    this.load.image("fond_droit", "./assets/grotte1.jpg");
    this.load.image("plateform", "./assets/tuyaugrotte.png");
    this.load.image("plateform2", "./assets/rouegrotte.png");
    this.load.image("plateform3", "./assets/chainegrotte.png");
    this.load.image("plateformea", "./assets/champi.png");
    this.load.image("gaz", "./assets/gaz.png");

    // Ajout des plateformes cassantes
    this.load.image("plateform4", "./assets/platformp.png");

    this.load.spritesheet("img_perso1", "./assets/viktors.png", {
      frameWidth: 42,
      frameHeight: 64
    });

    this.load.spritesheet("img_perso2", "./assets/dartix1s.png", {
      frameWidth: 32,
      frameHeight: 64
    });


  }

  create() {
    this.physics.world.setBounds(0, -Infinity, 1280, Infinity);

    //bouton retour
    this.toucheValidation = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    // ✨ CRÉATION DES FONDS SÉPARÉS POUR CHAQUE JOUEUR ✨
    // Fond gauche pour le joueur 1 (positionné dans la zone gauche)
    this.fondGauche = this.add.image(320, 360, "fond_gauche").setScrollFactor(0);
    this.fondGauche.setOrigin(0.5, 0.5);
    this.fondGauche.setDepth(-1); // Placer en arrière-plan

    // Fond droit pour le joueur 2 (positionné dans la zone droite à x=960)
    this.fondDroit = this.add.image(960, 360, "fond_droit").setScrollFactor(0);
    this.fondDroit.setOrigin(0.5, 0.5);
    this.fondDroit.setDepth(-1); // Placer en arrière-plan

    this.skinsPlateformes = ["plateform", "plateform2", "plateform3", "plateform4", "plateformea"];

    this.groupe_plateformes_J1 = this.physics.add.staticGroup();
    this.groupe_plateformes_J2 = this.physics.add.staticGroup();
    this.groupe_plateformes_rebond = this.physics.add.staticGroup();

    this.derniereY_J1 = 600;
    this.derniereY_J2 = 600;

    // Map pour timers des plateformes cassantes
    this.plateformesTimers = new Map();

    // Sol initial J1
    for (let x = 0; x <= 640; x += 64) {
      let pf = this.groupe_plateformes_J1.create(x - 32, 700, "plateform").setScale(0.5);
      pf.setOrigin(0.5, 0.5);
      pf.displayWidth = 64;
      pf.refreshBody();
    }

    // Sol initial J2
    for (let x = 640; x <= 1280; x += 64) {
      let pf = this.groupe_plateformes_J2.create(x - 32, 700, "plateform").setScale(0.5);
      pf.setOrigin(0.5, 0.5);
      pf.displayWidth = 64;
      pf.refreshBody();
    }

    this.genererInitiales(this.groupe_plateformes_J1, "J1");
    this.genererInitiales(this.groupe_plateformes_J2, "J2");

    // Joueurs
    this.player1 = this.physics.add.sprite(320, 600, "img_perso1");
    this.player1.setCollideWorldBounds(true);
    this.player1.body.setGravityY(1200);

  

    this.player2 = this.physics.add.sprite(960, 600, "img_perso2");
    this.player2.setCollideWorldBounds(true);
    this.player2.body.setGravityY(1200);

 
    this.physics.add.collider(this.player1, this.groupe_plateformes_J1, null, this.verifCollision, this);
    this.physics.add.collider(this.player2, this.groupe_plateformes_J2, null, this.verifCollision, this);

    
    // Animations pour le joueur 1 (img_perso1)
    this.anims.create({
      key: "anim_tourne_gauche_J1", // key est le nom de l'animation : doit etre unique poru la scene.
      frames: this.anims.generateFrameNumbers("img_perso1", {
        start: 8,
        end: 13
      }), // on prend toutes les frames de img perso numerotées de 0 à 3
      frameRate: 10, // vitesse de défilement des frames
      repeat: -1 // nombre de répétitions de l'animation. -1 = infini
    });

    // creation de l'animation "anim_tourne_face" qui sera jouée sur le player lorsque ce dernier n'avance pas.
    this.anims.create({
      key: "anim_face_J1",
      frames: this.anims.generateFrameNumbers("img_perso1", {
        start: 6,
        end: 7
      }), // on prend toutes les frames de img perso numerotées de 0 à 3
      frameRate: 5, // vitesse de défilement des frames
      repeat: -1 // nombre de répétitions de l'animation. -1 = infini
    });

    // creation de l'animation "anim_tourne_droite" qui sera jouée sur le player lorsque ce dernier tourne à droite
    this.anims.create({
      key: "anim_tourne_droite_J1",
      frames: this.anims.generateFrameNumbers("img_perso1", {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: -1
    });


// Animation de saut gauche
this.anims.create({
  key: "saut_gauche_J1",
  frames: [{ key: "img_perso1", frame: 15 }], // choisis une frame adaptée
  frameRate: 1
});

// Animation de saut face
this.anims.create({
  key: "saut_face_J1",
  frames: [{ key: "img_perso1", frame: 16 }], // frame statique de face
  frameRate: 1
});

// Animation de saut droite
this.anims.create({
  key: "saut_droite_J1",
  frames: [{ key: "img_perso1", frame: 14 }], // choisis une frame adaptée
  frameRate: 1
});

    // Animations pour le joueur 2 (img_perso2)
    this.anims.create({
      key: "anim_tourne_gauche_J2",
      frames: this.anims.generateFrameNumbers("img_perso2", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_tourne_droite_J2",
      frames: this.anims.generateFrameNumbers("img_perso2", { start: 6, end: 9 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_face_J2",
      frames: this.anims.generateFrameNumbers("img_perso2", { start: 4, end: 5 }),
      frameRate: 5,
      repeat: -1
    });
    
    
// Animation de saut gauche
this.anims.create({
  key: "saut_gauche_J2",
  frames: [{ key: "img_perso2", frame: 10 }], // choisis une frame adaptée
  frameRate: 1
});

// Animation de saut face
this.anims.create({
  key: "saut_face_J2",
  frames: [{ key: "img_perso2", frame: 11 }], // frame statique de face
  frameRate: 1
});

// Animation de saut droite
this.anims.create({
  key: "saut_droite_J2",
  frames: [{ key: "img_perso2", frame: 12 }], // choisis une frame adaptée
  frameRate: 1
});







    // Claviers
    this.clavier1 = this.input.keyboard.createCursorKeys();
    this.clavier1.jump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I); // saut P1 = I

    this.clavier2 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.Z
    });
    this.clavier2.jump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R); // saut P2 = R

    // ✨ CONFIGURATION DES CAMÉRAS AVEC FONDS SÉPARÉS ✨
    // Caméra principale désactivée
    this.cameras.main.setVisible(false);

    // Caméra gauche (Joueur 1)
    this.camera1 = this.cameras.add(0, 0, 640, 720);
    this.camera1.startFollow(this.player1, true);
    this.camera1.setBounds(0, -Infinity, 640, Infinity);
    // La caméra gauche ignore le fond droit
    this.camera1.ignore(this.fondDroit);

    // Caméra droite (Joueur 2)
    this.camera2 = this.cameras.add(640, 0, 640, 720);
    this.camera2.startFollow(this.player2, true);
    this.camera2.setBounds(640, -Infinity, 640, Infinity);
    // La caméra droite ignore le fond gauche
    this.camera2.ignore(this.fondGauche);
    
    // SOLUTION: Créer un fond spécifique pour la caméra droite à la bonne position relative
    // On le place en arrière-plan avec une profondeur négative
    this.fondDroiteCam = this.add.image(320, 360, "fond_droit").setScrollFactor(0);
    this.fondDroiteCam.setOrigin(0.5, 0.5);
    this.fondDroiteCam.setDepth(-1); // IMPORTANT: Placer en arrière-plan
    // Ce fond ne sera visible que par la caméra droite
    this.camera1.ignore(this.fondDroiteCam);
    // Et on cache l'ancien fond droit de la caméra droite
    this.camera2.ignore(this.fondDroit);

    // Eau
    this.eau = this.add.image(640, 1420, "gaz").setOrigin(0.5, 1);
    this.eau.setAlpha(0.7);
    this.physics.add.existing(this.eau, true);
    this.eauActive = false;
    this.startTime = this.time.now;

    this.physics.add.collider(this.player1, this.eau, () => {
      if (this.eauActive) this.gameOver(this.player1);
    });
    this.physics.add.collider(this.player2, this.eau, () => {
      if (this.eauActive) this.gameOver(this.player2);
    });


// --- Initialisation des scores ---
  this.scoreJ1 = 0;
  this.scoreJ2 = 0;
  this.hauteurMaxJ1 = this.player1.y;
  this.hauteurMaxJ2 = this.player2.y;

  /// --- HUD pour Joueur 1 ---
this.hudJ1 = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);
this.scoreTextJ1 = this.add.text(20, 20, "Score J1 : 0", {
  fontSize: "24px",
  fill: "#ffffff",
  fontFamily: "Arial",
  stroke: "#000000",
  strokeThickness: 4
});
this.hudJ1.add(this.scoreTextJ1);
this.camera2.ignore(this.hudJ1); // visible seulement par cam 1

// --- HUD pour Joueur 2 ---
this.hudJ2 = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);
this.scoreTextJ2 = this.add.text(20, 20, "Score J2 : 0", {
  fontSize: "24px",
  fill: "#ffffff",
  fontFamily: "Arial",
  stroke: "#000000",
  strokeThickness: 4
});
this.hudJ2.add(this.scoreTextJ2);
this.camera1.ignore(this.hudJ2); // visible seulement par cam 2



    this.gameOverActive = false;




  }

  verifCollision(player, platform) {
    return player.body.velocity.y >= 0;
  }



  genererInitiales(groupe, joueur) {
    let derniereY = (joueur === "J1") ? this.derniereY_J1 : this.derniereY_J2;
    let largeurPlateforme = 64;
    let marge = largeurPlateforme;

    let xMin = (joueur === "J1") ? marge : 640 + marge;
    let xMax = (joueur === "J1") ? 640 - marge : 1280 - marge;

    for (let i = 0; i < 10; i++) {
        let x = Phaser.Math.Between(xMin, xMax);
        let y = derniereY - Phaser.Math.Between(100, 150);
        let skin = Phaser.Utils.Array.GetRandom(this.skinsPlateformes);

        // --- SOLUTION : réduire la probabilité des plateformes rebondissantes ---
        if (skin === "plateformea" && Math.random() < 0.7) {
            skin = Phaser.Utils.Array.GetRandom(this.skinsPlateformes.filter(s => s !== "plateformea"));
        }

        let pf;
        if (skin === "plateformea") {
            pf = this.groupe_plateformes_rebond.create(x, y, skin).setScale(0.5);
        } else {
            pf = groupe.create(x, y, skin).setScale(0.5);
        }
        pf.setOrigin(0.5, 0.5);
        pf.refreshBody();

        derniereY = y;
    }

    if (joueur === "J1") this.derniereY_J1 = derniereY;
    else this.derniereY_J2 = derniereY;
}

genererProcedural(joueur) {
    let groupe = (joueur === "J1") ? this.groupe_plateformes_J1 : this.groupe_plateformes_J2;
    let derniereY = (joueur === "J1") ? this.derniereY_J1 : this.derniereY_J2;
    let player = (joueur === "J1") ? this.player1 : this.player2;

    let largeurPlateforme = 64;
    let marge = largeurPlateforme;

    let xMin = (joueur === "J1") ? marge : 640 + marge;
    let xMax = (joueur === "J1") ? 640 - marge : 1280 - marge;

    let limiteY = player.y - 200;
    while (derniereY > limiteY) {
        let x = Phaser.Math.Between(xMin, xMax);
        let y = derniereY - Phaser.Math.Between(100, 150);
        let skin = Phaser.Utils.Array.GetRandom(this.skinsPlateformes);

        // --- SOLUTION : réduire la probabilité des plateformes rebondissantes ---
        if (skin === "plateformea" && Math.random() < 0.7) {
            skin = Phaser.Utils.Array.GetRandom(this.skinsPlateformes.filter(s => s !== "plateformea"));
        }

        let pf;
        if (skin === "plateformea") {
            pf = this.groupe_plateformes_rebond.create(x, y, skin).setScale(0.5);
        } else {
            pf = groupe.create(x, y, skin).setScale(0.5);
        }
        pf.setOrigin(0.5, 0.5);
        pf.refreshBody();

        derniereY = y;
    }

    if (joueur === "J1") this.derniereY_J1 = derniereY;
    else this.derniereY_J2 = derniereY;
}


  // 🔹 Gestion des plateformes cassantes
  updatePlateformesTimers(delta) {
    [...this.groupe_plateformes_J1.getChildren(), ...this.groupe_plateformes_J2.getChildren()].forEach(plat => {
      if (plat.texture.key === "plateformp" || plat.texture.key === "plateform4") {
        const playerTouchedPlat =
          (this.player1.body.touching.down && Phaser.Math.Distance.Between(this.player1.x, this.player1.y, plat.x, plat.y) < 50) ||
          (this.player2.body.touching.down && Phaser.Math.Distance.Between(this.player2.x, this.player2.y, plat.x, plat.y) < 50);

        if (playerTouchedPlat && !this.plateformesTimers.has(plat)) {
          this.plateformesTimers.set(plat, 0);
          this.tweens.add({ targets: plat, x: plat.x + 5, duration: 100, yoyo: true, repeat: -1 });
        }

        if (this.plateformesTimers.has(plat)) {
          let t = this.plateformesTimers.get(plat) + delta;
          this.plateformesTimers.set(plat, t);

          if (t >= 500) {
            this.tweens.killTweensOf(plat);
            plat.destroy();
            this.plateformesTimers.delete(plat);
          }
        }
      }
    });
  }

  // 🔹 Nettoyage des plateformes trop basses
  nettoyerPlateformes() {
    this.groupe_plateformes_J1.getChildren().forEach(p => {
      if (p.y > this.player1.y + 800) p.destroy();
    });
    this.groupe_plateformes_J2.getChildren().forEach(p => {
      if (p.y > this.player2.y + 800) p.destroy();
    });
    this.groupe_plateformes_rebond.getChildren().forEach(p => {
      // On peut se baser sur le joueur le plus bas, ou créer deux check séparés si nécessaire
      if (p.y > Math.max(this.player1.y, this.player2.y) + 800) p.destroy();
    });
  }

  update(time, delta) {
    if (this.gameOverActive) return;

    if (this.toucheValidation.isDown) {
      this.scene.pause(); // met en pause la scène courante
        this.scene.launch("pause", { scenePrecedente: this.scene.key }); // <-- on passe le nom du niveau
          }
    // Contraintes de mouvement des joueurs dans leurs zones respectives
    if (this.player1.x < 0) this.player1.x = 0;
    if (this.player1.x > 615) this.player1.x = 615;
    if (this.player2.x < 666) this.player2.x = 666;
    if (this.player2.x > 1280) this.player2.x = 1280;

    // ✨ CONTRÔLES JOUEUR 1 AVEC SES ANIMATIONS ✨
    if (this.clavier1.right.isDown) {
      this.player1.setVelocityX(250);
    
      if (this.player1.body.touching.down) {
        this.player1.anims.play("anim_tourne_droite_J1", true);
      } else {
        this.player1.anims.play("saut_droite_J1", true);
      }
    
    } else if (this.clavier1.left.isDown) {
      this.player1.setVelocityX(-250);
    
      if (this.player1.body.touching.down) {
        this.player1.anims.play("anim_tourne_gauche_J1", true);
      } else {
        this.player1.anims.play("saut_gauche_J1", true);
      }
    
    } else {
      this.player1.setVelocityX(0);
    
      if (this.player1.body.touching.down) {
        this.player1.anims.play("anim_face_J1", true);
      } else {
        this.player1.anims.play("saut_face_J1", true);
      }
    }

    // Saut amélioré pour joueur 1
    if (
      Phaser.Input.Keyboard.JustDown(this.clavier1.jump) ||
      (this.clavier1.space && Phaser.Input.Keyboard.JustDown(this.clavier1.space))
    ) {
      if (this.player1.body.touching.down) {
        this.player1.setVelocityY(-1100); // ajuste ici la puissance du saut
      }
    }

    // ✨ CONTRÔLES JOUEUR 2 AVEC SES ANIMATIONS ✨
    if (this.clavier2.right.isDown) {
      this.player2.setVelocityX(250);
    
      if (this.player2.body.touching.down) {
        this.player2.anims.play("anim_tourne_droite_J2", true);
      } else {
        this.player2.anims.play("saut_droite_J2", true);
      }
    
    } else if (this.clavier2.left.isDown) {
      this.player2.setVelocityX(-250);
    
      if (this.player2.body.touching.down) {
        this.player2.anims.play("anim_tourne_gauche_J2", true);
      } else {
        this.player2.anims.play("saut_gauche_J2", true);
      }
    
    } else {
      this.player2.setVelocityX(0);
    
      if (this.player2.body.touching.down) {
        this.player2.anims.play("anim_face_J2", true);
      } else {
        this.player2.anims.play("saut_face_J2", true);
      }
    }
  
   
    // Saut amélioré pour joueur 2
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.jump)) {
      if (this.player2.body.touching.down) {
        // saut unique
        this.player2.setVelocityY(-1100); // ajuste ici la puissance du saut
      }
    }

 
    // Génération procédurale des plateformes
    this.genererProcedural("J1");
    this.genererProcedural("J2");

    // 🔹 Appel gestion plateformes cassantes
    this.updatePlateformesTimers(delta);

    // 🔹 Nettoyage des vieilles plateformes
    this.nettoyerPlateformes();

    // Activation de l'eau montante après 10 secondes
    if (!this.eauActive && this.time.now - this.startTime > 10000) {
      this.eauActive = true;
    }
    if (this.eauActive) {
      this.eau.y -= 0.05 * delta;
      if (this.eau.body) this.eau.body.updateFromGameObject();
    }
    if (this.player1.y < this.hauteurMaxJ1) this.hauteurMaxJ1 = this.player1.y;
  if (this.player2.y < this.hauteurMaxJ2) this.hauteurMaxJ2 = this.player2.y;

  // Conversion hauteur → score (plus on monte, plus le score est haut)
  this.scoreJ1 = Math.floor((600 - this.hauteurMaxJ1) / 10);
  this.scoreJ2 = Math.floor((600 - this.hauteurMaxJ2) / 10);

  // Mise à jour de l’affichage
  this.scoreTextJ1.setText("Score J1 : " + this.scoreJ1);
  this.scoreTextJ2.setText("Score J2 : " + this.scoreJ2);

  [this.player1, this.player2].forEach(player => {
    this.physics.world.overlap(player, this.groupe_plateformes_rebond, (player, plat) => {
      if (player.body.velocity.y > 0) {
        player.setVelocityY(-1850);
        this.tweens.add({
          targets: plat,
          scaleX: plat.scaleX * 1.3,
          scaleY: plat.scaleY * 1.3,
          duration: 150,
          yoyo: true,
          ease: "Sine.easeInOut"
        });
      }
    });
  });
  


  }

  gameOver(player) {
    if (this.gameOverActive) return;
    this.joueurMort();
    player.setTint(0xff0000);
    // Utiliser l'animation appropriée selon le joueur
    if (player === this.player1) {
      player.anims.play("anim_face_J1");
    } else {
      player.anims.play("anim_face_J2");
    }
    console.log("💀 GAME OVER : noyé !");
  }



  
}