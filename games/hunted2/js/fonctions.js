export function doNothing() {
  // cette fonction ne fait rien.
  // c'est juste un exemple pour voir comment mettre une fonction
  // dans un fichier et l'utiliser dans les autres
}

/***********************************************************************/
/** VARIABLES PARTAGÉES ENTRE SCÈNES
/***********************************************************************/
export let player;
export let clavier;
export let coeurs = 5;
export let tempsRestant = 60; //penser a changer la valeur de la ligne 185 si on change ce timer
export let objets = 0;
export let vies = 3;

export let texteTemps;
export let texteObjets;
export let texteVies;
export let hudPerso;
export let coeursImages = [];

// 🔹 FLAG GAME OVER
export let gameOverActif = false;

/***********************************************************************/
/** PRELOAD COMMUN
/***********************************************************************/
export function preloadCommun(scene) {
  scene.load.spritesheet("img_perso", "./assets/dude.png", {
    frameWidth: 32,
    frameHeight: 40
  });

  scene.load.image("Phaser_tuilesdejeu", "./assets/tuilesJeu.png");
  scene.load.image("coeur", "./assets/coeur.png");
  scene.load.image("dude_face", "./assets/dude_face.png");
  scene.load.image("dude_face_stop", "./assets/dude_face_stop.png");
}


/***********************************************************************/
/** CRÉER LE JOUEUR
/***********************************************************************/
export function creerPlayer(scene, x, y) {
  player = scene.physics.add.sprite(x, y, "img_perso");
  player.setCollideWorldBounds(true);
  player.setBounce(0.2);
  return player;
}

/***********************************************************************/
/** CRÉER LES ANIMATIONS DU JOUEUR
/***********************************************************************/
export function creerAnimations(scene) {
  scene.anims.create({
    key: "anim_marche",
    frames: scene.anims.generateFrameNumbers("img_perso", { start: 0, end: 4 }),
    frameRate: 10,
    repeat: -1
  });

  scene.anims.create({
    key: "anim_idle",
    frames: [{ key: "img_perso", frame: 0 }],
    frameRate: 20
  });
}

/***********************************************************************/
/** INITIALISER LE HUD
/***********************************************************************/
export function initHUD(scene) {
  coeursImages = [];
  for (let i = 0; i < coeurs; i++) {
    let coeur = scene.add.image(16 + i * 40, 16, "coeur")
      .setOrigin(0, 0)
      .setScale(0.45)
      .setScrollFactor(0);
    coeursImages.push(coeur);
  }

  texteTemps = scene.add.text(320, 16, "Temps : " + tempsRestant + "s", {
    fontSize: "22px",
    fill: "#fff"
  }).setScrollFactor(0);

  texteObjets = scene.add.text(640, 16, " Objets : " + objets + "/5", {
    fontSize: "22px",
    fill: "#fff"
  }).setScrollFactor(0);

  texteVies = scene.add.text(960, 16, " " + vies + "/3", {
    fontSize: "22px",
    fill: "#fff"
  }).setScrollFactor(0);

  hudPerso = scene.add.image(935, 10, "dude_face")
    .setOrigin(0, 0)
    .setScrollFactor(0);

  let gameOverAffiche = false;

  scene.time.addEvent({
    delay: 1000,
    callback: () => {
      if (tempsRestant > 0) {
        tempsRestant--;
        texteTemps.setText("Temps : " + tempsRestant + "s");
      } else if (!gameOverAffiche) {
        gameOverAffiche = true;
        // 🔹 ACTIVER LE FLAG GAME OVER
        gameOverActif = true;

        // Bloquer le joueur
        player.setVelocity(0, 0);
        player.body.moves = false;

        // 🔹 STOP l’animation et mettre l’image statique
        player.anims.stop();
        player.setTexture("dude_face_stop");

        // Fond Game Over
        let fondGameOver = scene.add.graphics();
        fondGameOver.fillStyle(0x000000, 0.5);
        fondGameOver.fillRoundedRect(
          scene.scale.width / 2 - 250,
          scene.scale.height / 2 - 60,
          500,
          180,
          25
        );
        fondGameOver.setScrollFactor(0);

        // Texte Temps écoulé !
        let texteGameOver = scene.add.text(
          scene.scale.width / 2,
          scene.scale.height / 2,
          "Temps écoulé !",
          { fontSize: "48px", fontStyle: "bold", fill: "#fff" }
        ).setOrigin(0.5).setScrollFactor(0);

        // Bouton Recommencer
        let boutonWidth = 260;
        let boutonHeight = 60;
        let boutonX = scene.scale.width / 2;
        let boutonY = scene.scale.height / 2 + 80;

        let boutonBg = scene.add.graphics();
        boutonBg.fillStyle(0x000000, 1);
        boutonBg.fillRoundedRect(boutonX - boutonWidth / 2, boutonY - boutonHeight / 2, boutonWidth, boutonHeight, 15);
        boutonBg.setScrollFactor(0);

        let boutonText = scene.add.text(boutonX, boutonY, "Recommencer", {
          fontSize: "32px",
          fontStyle: "bold",
          fill: "rgba(255, 255, 255, 1)"
        }).setOrigin(0.5).setScrollFactor(0);

        let boutonZone = scene.add.zone(boutonX, boutonY, boutonWidth, boutonHeight)
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        boutonZone.setScrollFactor(0);

        boutonZone.on('pointerover', () => {
          boutonBg.clear();
          boutonBg.fillStyle(0x333333, 1);
          boutonBg.fillRoundedRect(boutonX - boutonWidth / 2, boutonY - boutonHeight / 2, boutonWidth, boutonHeight, 15);
        });
        boutonZone.on('pointerout', () => {
          boutonBg.clear();
          boutonBg.fillStyle(0x000000, 1);
          boutonBg.fillRoundedRect(boutonX - boutonWidth / 2, boutonY - boutonHeight / 2, boutonWidth, boutonHeight, 15);
        });

    // Clic sur le bouton
boutonZone.on('pointerdown', () => {
  // Réinitialiser les variables
  tempsRestant = 60; //penser a changer la veleur si on change le timer de depart
  coeurs = 5;
  objets = 0;
  vies = 3;

          fondGameOver.destroy();
          texteGameOver.destroy();
          boutonBg.destroy();
          boutonText.destroy();
          boutonZone.destroy();

          // 🔹 RESET FLAG GAME OVER
          gameOverActif = false;
          gameOverAffiche = false;

          scene.scene.start("selection");
        });
      }
    },
    loop: true
  });
}

/***********************************************************************/
/** INITIALISER LE CLAVIER
/***********************************************************************/
export function initClavier(scene) {
  clavier = scene.input.keyboard.createCursorKeys();
  return clavier;
}

/***********************************************************************/
/** MISE À JOUR DU JOUEUR (dans update)
/***********************************************************************/
export function updatePlayer(scene, background) {
  // 🔹 SI GAME OVER, NE RIEN FAIRE
  if (gameOverActif) return;

  const vitesseX = player.body.velocity.x;
  const onGround = player.body.blocked.down;

  // 🔹 Update du fond seulement si le joueur bouge
  if (background && vitesseX !== 0) {
    background.tilePositionX += vitesseX * 0.005;
  }

  if (clavier.left.isDown) {
    player.setVelocityX(-160);
    player.setFlipX(false);
    player.anims.play("anim_marche", true);
  } else if (clavier.right.isDown) {
    player.setVelocityX(160);
    player.setFlipX(true);
    player.anims.play("anim_marche", true);
  } else {
    player.setVelocityX(0);
    player.anims.stop();
    player.setTexture("dude_face_stop");
  }

  if (clavier.up.isDown && onGround) {
    player.setVelocityY(-330);
  }
}

/***********************************************************************/
/** PERDRE UN COEUR
/***********************************************************************/
export function perdreUnCoeur() {
  if (coeurs > 0) {
    coeurs--;
    coeursImages[coeurs].setVisible(false);
  }
}