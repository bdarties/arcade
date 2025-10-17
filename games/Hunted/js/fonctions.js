/***********************************************************************/
/** CONSTANTES
/***********************************************************************/
export const TEMPS_INITIAL = 400;
export const COEURS_INITIAL = 5;
export const VIES_INITIAL = 3;

/***********************************************************************/
/** VARIABLES PARTAGÉES ENTRE SCÈNES
/***********************************************************************/
export let coeurs = COEURS_INITIAL;
export let tempsRestant = TEMPS_INITIAL;
export let objets = 0;
export let vies = VIES_INITIAL;
export let gardesTues = 0;
export let hudFond ;
export let gameOverActif = false;
export let ticketVictoire = null; // Référence au ticket pour la victoire

/***********************************************************************/
/** VARIABLES HUD
/***********************************************************************/
let texteTemps;
let texteObjets;
let texteGardes;
let texteVies;
let hudPerso;
let coeursImages = [];
let timerEvent;

/***********************************************************************/
/** RESET DU JEU (appelé uniquement après game over/win + rejouer)
/***********************************************************************/
export function resetGame() {
  coeurs = COEURS_INITIAL;
  tempsRestant = TEMPS_INITIAL;
  objets = 0;
  vies = VIES_INITIAL;
  gardesTues = 0;
  gameOverActif = false;
  
  // Nettoyer le HUD existant
  cleanupHUD();
}

/***********************************************************************/
/** PRELOAD COMMUN
/***********************************************************************/
export function preloadCommun(scene) {
  scene.load.image("Phaser_tuilesdejeu", "./assets/tuilesJeu.png");
  scene.load.image("Phaser_tuilesdejeu2", "./assets/tuilesJeu2.png");
  scene.load.image("Phaser_tuilesdejeu3", "./assets/tuilesJeu3.png");
  scene.load.image("Phaser_tuilesdejeu4", "./assets/tuilesJeu4.png");
  scene.load.image("Phaser_tuilesdejeu5", "./assets/tuilesJeu5.png");
  scene.load.image("coeur", "./assets/coeur.png");
  scene.load.image("flag", "./assets/flag.png");
  scene.load.image("btn_rejouer", "./assets/btn_rejouer.png");
  scene.load.image("btn_menu", "assets/btn_menu.png");
  scene.load.image("dude_face", "./assets/dude_face.png");
  scene.load.audio("item_collected", "./assets/item-collected.mp3");
}

/***********************************************************************/
/** INITIALISER LE CLAVIER
/***********************************************************************/
export let clavier;
export function initClavier(scene) {
  clavier = scene.input.keyboard.createCursorKeys();
  return clavier;
}

/***********************************************************************/
/** INITIALISER LE HUD (selection.js et niveau1.js)
/***********************************************************************/
export function initHUD_Objets(scene) {
  if (timerEvent) timerEvent.remove();

  // Cœurs
  coeursImages = [];
  for (let i = 0; i < coeurs; i++) {
    let coeur = scene.add.image(16 + i * 40, 16, "coeur")
      .setOrigin(0, 0)
      .setScale(0.45)
      .setScrollFactor(0)
      .setDepth(2);
    coeursImages.push(coeur);
  }

  // Textes
  texteTemps = scene.add.text(320, 16, "Temps : " + tempsRestant + "s", {
    fontSize: "22px",
    fill: "#fff"
  }).setScrollFactor(0).setDepth(2);

  texteObjets = scene.add.text(640, 16, "Objets : " + objets + "/7", {
    fontSize: "22px",
    fill: "#fff"
  }).setScrollFactor(0).setDepth(2);

  texteVies = scene.add.text(960, 16, " " + vies + "/3", {
    fontSize: "22px",
    fill: "#fff"
  }).setScrollFactor(0).setDepth(2);

  hudPerso = scene.add.image(935, 10, "dude_face")
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(2);

  // Timer
  timerEvent = scene.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      if (tempsRestant > 0) {
        tempsRestant--;
        if (texteTemps && texteTemps.scene) {
          texteTemps.setText("Temps : " + tempsRestant + "s");
        }
      } else if (!gameOverActif) {
        gameOverActif = true;
        scene.scene.launch("gameover");
      }
    }
  });
}

/***********************************************************************/
/** INITIALISER LE HUD (niveau2.js et niveau3.js)
/***********************************************************************/
export function initHUD_Gardes(scene) {
  if (timerEvent) timerEvent.remove();

  // Cœurs
  coeursImages = [];
  for (let i = 0; i < coeurs; i++) {
    let coeur = scene.add.image(16 + i * 40, 16, "coeur")
      .setOrigin(0, 0)
      .setScale(0.45)
      .setScrollFactor(0)
      .setDepth(2);
    coeursImages.push(coeur);
  }

  // Textes
  texteTemps = scene.add.text(320, 16, "Temps : " + tempsRestant + "s", {
    fontSize: "22px",
    fill: "#fff"
  }).setScrollFactor(0).setDepth(2);

  texteVies = scene.add.text(960, 16, " " + vies + "/3", {
    fontSize: "22px",
    fill: "#fff"
  }).setScrollFactor(0).setDepth(2);

  hudPerso = scene.add.image(935, 10, "dude_face")
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(2);

  // Timer
  timerEvent = scene.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      if (tempsRestant > 0) {
        tempsRestant--;
        if (texteTemps && texteTemps.scene) {
          texteTemps.setText("Temps : " + tempsRestant + "s");
        }
      } else if (!gameOverActif) {
        gameOverActif = true;
        scene.scene.launch("gameover");
      }
    }
  });
}

/***********************************************************************/
/** METTRE À JOUR LES OBJETS COLLECTÉS
/***********************************************************************/
export function updateObjets(nouveauNombre) {
  objets = nouveauNombre;
  if (texteObjets && texteObjets.scene) {
    texteObjets.setText(" Objets : " + objets + "/7");
  }
}

/***********************************************************************/
/** AJOUTER UN OBJET (appelé lors de la collecte)
/***********************************************************************/
export function ajouterObjet() {
  objets++;
  if (texteObjets && texteObjets.scene) {
    texteObjets.setText(" Objets : " + objets + "/7");
  }
}

/***********************************************************************/
/** METTRE À JOUR LES GARDES TUÉS
/***********************************************************************/
export function updateGardes(nouveauNombre) {
  gardesTues = nouveauNombre;
  if (texteGardes && texteGardes.scene) {
    texteGardes.setText(" Gardes tués : " + gardesTues);
  }
}

/***********************************************************************/
/** CRÉER UN ITEM
/***********************************************************************/
export function creerItem(scene, x, y, itemType, itemId) {
  const item = scene.physics.add.sprite(x, y, itemType);
  item.body.allowGravity = false;
  item.body.moves = false;
  item.setDepth(1);
  item.itemId = itemId;
  item.itemType = itemType;
  
  const positionInitiale = y;
  
  scene.tweens.add({
    targets: item,
    y: positionInitiale - 5,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
  
  return item;
}

/***********************************************************************/
/** RAMASSER UN ITEM
/***********************************************************************/
export function ramasserItem(scene, item) {
  if (!item.active) return;
  
  const itemId = item.itemId || "un objet";
  
  scene.sound.play("item_collected", { volume: 0.5 });
  
  item.destroy();
  
  ajouterObjet();
  
  afficherMessage(scene, `Vous avez ramassé ${itemId} !`);
}

/***********************************************************************/
/** AFFICHER UN MESSAGE TEMPORAIRE
/***********************************************************************/
export function afficherMessage(scene, message) {
  const fond = scene.add.rectangle(
    scene.cameras.main.centerX,
    scene.cameras.main.centerY,
    400,
    100,
    0x000000,
    0.6
  ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

  const texte = scene.add.text(
    scene.cameras.main.centerX,
    scene.cameras.main.centerY,
    message,
    {
      fontSize: "20px",
      color: "#ffffff",
      fontFamily: "Arial",
      align: "center",
    }
  ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

  scene.tweens.add({
    targets: [fond, texte],
    alpha: { from: 0, to: 1 },
    duration: 300,
    yoyo: true,
    hold: 1500,
    onComplete: () => {
      fond.destroy();
      texte.destroy();
    }
  });
}


/***********************************************************************/
/** PERDRE UN CŒUR
/***********************************************************************/
export function perdreCoeur(scene) {
  if (coeurs > 0) {
    coeurs--;
    if (coeursImages[coeurs]) {
      coeursImages[coeurs].destroy();
    }
    
    if (coeurs <= 0) {
      vies--;
      if (texteVies && texteVies.scene) {
        texteVies.setText(" " + vies + "/3");
      }

      if (vies <= 0) {
        if (!gameOverActif) {
          gameOverActif = true;
          scene.scene.launch("gameover");
        }
      } else {
        // Le joueur perd une vie mais il lui en reste
        coeurs = COEURS_INITIAL;
        objets = 0; // Réinitialiser les objets collectés
        
        // Recharger la scène actuelle
        scene.time.delayedCall(500, () => {
          scene.scene.restart();
        });
      }
    }
  }

  const player = scene.player || scene.player2;
  if (player) {
    player.setTint(0xff0000);
    scene.time.delayedCall(100, () => player.clearTint());
    scene.time.delayedCall(200, () => player.setTint(0xff0000));
    scene.time.delayedCall(300, () => player.clearTint());
    scene.time.delayedCall(400, () => player.setTint(0xff0000));
    scene.time.delayedCall(500, () => player.clearTint());
  }
}

/***********************************************************************/
/** CRÉER LE TICKET DE VICTOIRE (niveau3 uniquement)
/***********************************************************************/
export function creerTicketVictoire(scene, x, y) {
  if (ticketVictoire && ticketVictoire.active) {
    ticketVictoire.destroy();
  }

  ticketVictoire = scene.physics.add.sprite(x, y, "flag");
  ticketVictoire.body.allowGravity = false;
  ticketVictoire.body.moves = false;
  ticketVictoire.setDepth(10);
  ticketVictoire.setScale(2);
  ticketVictoire.setTint(0xFFD700);
  
  const positionInitiale = y;
  scene.tweens.add({
    targets: ticketVictoire,
    y: positionInitiale - 15,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  return ticketVictoire;
}

/***********************************************************************/
/** VÉRIFIER LA COLLECTE DU TICKET DE VICTOIRE
/***********************************************************************/
export function verifierTicketVictoire(scene, player) {
  if (!ticketVictoire || !ticketVictoire.active) return;

  const distance = Phaser.Math.Distance.Between(
    player.x, player.y,
    ticketVictoire.x, ticketVictoire.y
  );

  if (distance < 40) {
    ramasserTicketVictoire(scene);
  }
}

/***********************************************************************/
/** RAMASSER LE TICKET DE VICTOIRE
/***********************************************************************/
export function ramasserTicketVictoire(scene) {
  if (!ticketVictoire || !ticketVictoire.active) return;

  scene.sound.play("item_collected", { volume: 0.7 });

  ticketVictoire.destroy();
  ticketVictoire = null;

  // afficherMessage(scene, "Ticket de victoire !");

  scene.time.delayedCall(400, () => {
    scene.scene.launch("win");
  });
}

/***********************************************************************/
/** NETTOYER LE TICKET
/***********************************************************************/
export function cleanupTicket() {
  if (ticketVictoire && ticketVictoire.active) {
    ticketVictoire.destroy();
  }
  ticketVictoire = null;
}

/***********************************************************************/
/** NETTOYER LE HUD (à appeler au shutdown de la scène)
/***********************************************************************/
export function cleanupHUD() {
  if (timerEvent) {
    timerEvent.remove();
    timerEvent = null;
  }
  
  coeursImages.forEach(coeur => {
    if (coeur && coeur.scene) {
      coeur.destroy();
    }
  });
  coeursImages = [];
  if (hudFond && hudFond.scene) hudFond.destroy();
  if (texteTemps && texteTemps.scene) texteTemps.destroy();
  if (texteObjets && texteObjets.scene) texteObjets.destroy();
  if (texteGardes && texteGardes.scene) texteGardes.destroy();
  if (texteVies && texteVies.scene) texteVies.destroy();
  if (hudPerso && hudPerso.scene) hudPerso.destroy();
  
  cleanupTicket();
  
  texteTemps = null;
  texteObjets = null;
  texteGardes = null;
  texteVies = null;
  hudPerso = null;
}