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
      "GAME OVER\nAppuyez sur K pour recommencer", {
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
      "GAME OVER\nAppuyez sur K pour recommencer", {
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
    this.input.keyboard.off("keydown-K");
    this.input.keyboard.on("keydown-K", () => {
      this.scene.restart();
    });
  }

  preload() {
    this.load.image("fond_gauche", "./assets/sky1.jpg");
    this.load.image("fond_droit", "./assets/sky2.jpg");
    this.load.image("plateform", "./assets/platform.png");
    this.load.image("plateform2", "./assets/platform2.png");
    this.load.image("plateform3", "./assets/platform3.png");

    // Ajout des plateformes cassantes
    this.load.image("plateformp", "./assets/platformp.png");
    this.load.image("plateform4", "./assets/platform4.png");

    this.load.spritesheet("img_perso1", "./assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });

    this.load.spritesheet("img_perso2", "./assets/dude2.png", {
      frameWidth: 32,
      frameHeight: 48
    });

    // ⚡ POWERUPS ⚡
    this.load.spritesheet("powerups", "./assets/powerups.png", {
      frameWidth: 384,
      frameHeight: 1024
    });
  }

  create() {
    this.physics.world.setBounds(0, -Infinity, 1280, Infinity);

    // ✨ CRÉATION DES FONDS SÉPARÉS POUR CHAQUE JOUEUR ✨
    // Fond gauche pour le joueur 1 (positionné dans la zone gauche)
    this.fondGauche = this.add.image(320, 360, "fond_gauche").setScrollFactor(0);
    this.fondGauche.setOrigin(0.5, 0.5);
    this.fondGauche.setDepth(-1); // Placer en arrière-plan

    // Fond droit pour le joueur 2 (positionné dans la zone droite à x=960)
    this.fondDroit = this.add.image(960, 360, "fond_droit").setScrollFactor(0);
    this.fondDroit.setOrigin(0.5, 0.5);
    this.fondDroit.setDepth(-1); // Placer en arrière-plan

    this.skinsPlateformes = ["plateform", "plateform2", "plateform3", "plateformp", "plateform4"];

    this.groupe_plateformes_J1 = this.physics.add.staticGroup();
    this.groupe_plateformes_J2 = this.physics.add.staticGroup();

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

    // ⚡ PROPRIÉTÉS POWERUPS JOUEUR 1 ⚡
    this.player1.superJump = false;
    this.player1.superSpeed = false;
    this.player1.doubleJump = false;
    this.player1.canDoubleJump = false;
    this.player1.magnetism = false;
    this.player1.activePowerUp = null;

    this.player2 = this.physics.add.sprite(960, 600, "img_perso2");
    this.player2.setCollideWorldBounds(true);
    this.player2.body.setGravityY(1200);

    // ⚡ PROPRIÉTÉS POWERUPS JOUEUR 2 ⚡
    this.player2.superJump = false;
    this.player2.superSpeed = false;
    this.player2.doubleJump = false;
    this.player2.canDoubleJump = false;
    this.player2.magnetism = false;
    this.player2.activePowerUp = null;

    this.physics.add.collider(this.player1, this.groupe_plateformes_J1, null, this.verifCollision, this);
    this.physics.add.collider(this.player2, this.groupe_plateformes_J2, null, this.verifCollision, this);

    // ⚡ GROUPES POWERUPS SÉPARÉS ⚡
    this.powerUps_J1 = this.physics.add.group();
    this.powerUps_J1.setDepth(10);
    this.physics.add.collider(this.powerUps_J1, this.groupe_plateformes_J1);
    this.physics.add.overlap(this.player1, this.powerUps_J1, this.recupPowerUp, null, this);

    this.powerUps_J2 = this.physics.add.group();
    this.powerUps_J2.setDepth(10);
    this.physics.add.collider(this.powerUps_J2, this.groupe_plateformes_J2);
    this.physics.add.overlap(this.player2, this.powerUps_J2, this.recupPowerUp, null, this);

    // Spawn initial de powerups
    this.spawnPowerUp(200, 500, "J1");
    this.spawnPowerUp(450, 400, "J1");
    this.spawnPowerUp(800, 500, "J2");
    this.spawnPowerUp(1100, 400, "J2");

    // ✨ ANIMATIONS SÉPARÉES POUR CHAQUE JOUEUR ✨
    
    // Animations pour le joueur 1 (img_perso1)
    this.anims.create({
      key: "anim_tourne_gauche_J1",
      frames: this.anims.generateFrameNumbers("img_perso1", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_tourne_droite_J1",
      frames: this.anims.generateFrameNumbers("img_perso1", { start: 6, end: 9 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_face_J1",
      frames: [{ key: "img_perso1", frame: 4 }],
      frameRate: 20
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
      frames: [{ key: "img_perso2", frame: 4 }],
      frameRate: 20
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
    this.eau = this.add.rectangle(640, 1500, 1280, 200, 0x3399ff).setOrigin(0.5, 1);
    this.physics.add.existing(this.eau, true);
    this.eauActive = false;
    this.startTime = this.time.now;

    this.physics.add.collider(this.player1, this.eau, () => {
      if (this.eauActive) this.gameOver(this.player1);
    });
    this.physics.add.collider(this.player2, this.eau, () => {
      if (this.eauActive) this.gameOver(this.player2);
    });

    this.gameOverActive = false;
  }

  // ⚡ MAGNÉTISME POWERUP ⚡
  handleMagnetism() {
    if (this.player1.magnetism) {
      this.powerUps_J1.getChildren().forEach(powerup => {
        const distance = Phaser.Math.Distance.Between(this.player1.x, this.player1.y, powerup.x, powerup.y);
        if (distance < 150) {
          const angle = Phaser.Math.Angle.Between(powerup.x, powerup.y, this.player1.x, this.player1.y);
          const speed = Math.max(100, 300 - distance);
          powerup.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
      });
    }

    if (this.player2.magnetism) {
      this.powerUps_J2.getChildren().forEach(powerup => {
        const distance = Phaser.Math.Distance.Between(this.player2.x, this.player2.y, powerup.x, powerup.y);
        if (distance < 150) {
          const angle = Phaser.Math.Angle.Between(powerup.x, powerup.y, this.player2.x, this.player2.y);
          const speed = Math.max(100, 300 - distance);
          powerup.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
      });
    }
  }

  verifCollision(player, platform) {
    return player.body.velocity.y >= 0;
  }

  // ⚡ POWERUPS SYSTEM ⚡
  spawnPowerUp(x, y, joueur) {
    const types = ["jump", "speed", "doublejump", "magnetism", "lowgravity"];
    const type = Phaser.Utils.Array.GetRandom(types);

    const frameMap = {
      jump: 0,
      speed: 1,
      doublejump: 3,
      magnetism: 4,
      lowgravity: 5
    };

    const frame = frameMap[type] ?? 0;
    const groupe = (joueur === "J1") ? this.powerUps_J1 : this.powerUps_J2;
    const power = groupe.create(x, y, "powerups", frame);

    power.setScale(0.1);
    power.setBounce(0.2);

    if (power.body) {
      power.body.allowGravity = false;
      power.body.setSize(38, 102);
    }

    power.setCollideWorldBounds(true);
    power.powerType = type;
    power.setDepth(10);

    console.log(`Power-up ${type} créé pour ${joueur} à (${x}, ${y})`);
  }

  recupPowerUp(joueur, power) {
    const type = power.powerType;

    // Vérifie si le joueur a déjà un powerup actif du même type
    if (joueur.activePowerUp === type) {
      console.log(`${joueur.texture.key} a déjà le powerup ${type} actif`);
      return;
    }

    // Si le joueur a un autre powerup actif, on le remplace
    if (joueur.activePowerUp && joueur.activePowerUp !== type) {
      this.resetPowerUp(joueur);
    }

    if (power && power.destroy) power.destroy();
    console.log("⚡ Power-up récupéré :", type);

    // Marque le joueur comme ayant un powerup actif
    joueur.activePowerUp = type;

    switch (type) {
      case "jump":
        joueur.superJump = true;
        break;
      case "speed":
        joueur.superSpeed = true;
        break;
      case "doublejump":
        joueur.doubleJump = true;
        joueur.canDoubleJump = true;
        break;
      case "magnetism":
        joueur.magnetism = true;
        break;
      case "lowgravity":
        joueur.body.setGravityY(400); // Gravité réduite fixe
        break;
    }

    // Stock le timer pour pouvoir l'annuler plus tard
    joueur.powerUpTimer = this.time.delayedCall(this.getPowerUpDuration(type), () => {
      this.resetPowerUp(joueur);
    });
  }

  // ⚡ FONCTION POUR RESET UN POWERUP ⚡
  resetPowerUp(joueur) {
    const type = joueur.activePowerUp;
    
    if (!type) return;

    // Annule le timer existant
    if (joueur.powerUpTimer) {
      joueur.powerUpTimer.destroy();
      joueur.powerUpTimer = null;
    }

    // Reset les propriétés selon le type
    switch (type) {
      case "jump":
        joueur.superJump = false;
        break;
      case "speed":
        joueur.superSpeed = false;
        break;
      case "doublejump":
        joueur.doubleJump = false;
        joueur.canDoubleJump = false;
        break;
      case "magnetism":
        joueur.magnetism = false;
        break;
      case "lowgravity":
        joueur.body.setGravityY(1200); // Remet la gravité normale
        break;
    }

    joueur.activePowerUp = null;
    console.log(`Power-up ${type} expiré pour ${joueur.texture.key}`);
  }

  // ⚡ DURÉES DES POWERUPS ⚡
  getPowerUpDuration(type) {
    const durations = {
      jump: 8000,
      speed: 7000,
      doublejump: 10000,
      magnetism: 6000,
      lowgravity: 9000
    };
    return durations[type] || 5000;
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

      let pf = groupe.create(x, y, skin).setScale(0.5);
      pf.setOrigin(0.5, 0.5);
      pf.displayWidth = 64;
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

      let pf = groupe.create(x, y, skin).setScale(0.5);
      pf.setOrigin(0.5, 0.5);
      pf.displayWidth = 64;
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
  }

  update(time, delta) {
    if (this.gameOverActive) return;

    // Contraintes de mouvement des joueurs dans leurs zones respectives
    if (this.player1.x < 0) this.player1.x = 0;
    if (this.player1.x > 615) this.player1.x = 615;
    if (this.player2.x < 666) this.player2.x = 666;
    if (this.player2.x > 1280) this.player2.x = 1280;

    // ✨ CONTRÔLES JOUEUR 1 AVEC SES ANIMATIONS ✨
    if (this.clavier1.right.isDown) {
      this.player1.setVelocityX(this.player1.superSpeed ? 400 : 250);
      this.player1.anims.play("anim_tourne_droite_J1", true);
    } else if (this.clavier1.left.isDown) {
      this.player1.setVelocityX(this.player1.superSpeed ? -400 : -250);
      this.player1.anims.play("anim_tourne_gauche_J1", true);
    } else {
      this.player1.setVelocityX(0);
      this.player1.anims.play("anim_face_J1");
    }

    // Saut amélioré pour joueur 1
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.jump) || (this.clavier1.space && Phaser.Input.Keyboard.JustDown(this.clavier1.space))) {
      if (this.player1.body.touching.down) {
        this.player1.setVelocityY(this.player1.superJump ? -2000 : -1100);
        if (this.player1.doubleJump) this.player1.canDoubleJump = true;
      } else if (this.player1.doubleJump && this.player1.canDoubleJump) {
        this.player1.setVelocityY(-1100);
        this.player1.canDoubleJump = false;
      }
    }

    // ✨ CONTRÔLES JOUEUR 2 AVEC SES ANIMATIONS ✨
    if (this.clavier2.right.isDown) {
      this.player2.setVelocityX(this.player2.superSpeed ? 400 : 250);
      this.player2.anims.play("anim_tourne_droite_J2", true);
    } else if (this.clavier2.left.isDown) {
      this.player2.setVelocityX(this.player2.superSpeed ? -400 : -250);
      this.player2.anims.play("anim_tourne_gauche_J2", true);
    } else {
      this.player2.setVelocityX(0);
      this.player2.anims.play("anim_face_J2");
    }

    // Saut amélioré pour joueur 2
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.jump)) {
      if (this.player2.body.touching.down) {
        this.player2.setVelocityY(this.player2.superJump ? -2000 : -1100);
        if (this.player2.doubleJump) this.player2.canDoubleJump = true;
      } else if (this.player2.doubleJump && this.player2.canDoubleJump) {
        this.player2.setVelocityY(-1100);
        this.player2.canDoubleJump = false;
      }
    }

    // ⚡ EFFET MAGNÉTISME ⚡
    this.handleMagnetism();

    // 🔹 Spawn dynamique de powerups
    if (Math.random() < 0.001) { // 0.1% de chance par frame
      if (Math.random() < 0.5) {
        this.spawnPowerUp(Phaser.Math.Between(64, 576), this.player1.y - 200, "J1");
      } else {
        this.spawnPowerUp(Phaser.Math.Between(704, 1216), this.player2.y - 200, "J2");
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