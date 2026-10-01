// fonctions partagées par tous les niveaux : le personnage (Aria) est géré ici, une seule fois

// ====== RÉGLAGES : vitesse de chaque animation (images par seconde) ======
// plus le chiffre est grand, plus l'animation est rapide
const VITESSE_ANIMS = {
  stand: 2, // immobile
  walk: 14, // marche
  up: 8, // grimpe
  jump: 20, // saut
  punch: 10 // coups de poing
};

// touche pour donner un coup de poing (une lettre du clavier)
const TOUCHE_COUP = "F";

// vitesse de déplacement de la marche (pixels par seconde)
const VITESSE_MARCHE = 250;

// à appeler dans preload() de chaque niveau
export function chargerPerso(scene) {
  scene.load.setBaseURL(scene.sys.game.config.baseURL);
  scene.load.spritesheet("img_perso", "./assets/spritesheet/aria_spritesheet.png", {
    frameWidth: 36,
    frameHeight: 64
  });
  scene.load.spritesheet("img_perso_fight", "./assets/spritesheet/aria_spritesheet_fight.png", {
    frameWidth: 36,
    frameHeight: 64
  });
}

// à appeler dans create() de chaque niveau (ne recrée pas une animation qui existe déjà)
export function creerAnimsPerso(scene) {
  const anims = [
    { key: "aria_stand", start: 0, end: 1, frameRate: VITESSE_ANIMS.stand, repeat: -1 },
    { key: "aria_walk", start: 2, end: 9, frameRate: VITESSE_ANIMS.walk, repeat: -1 },
    { key: "aria_up", start: 10, end: 17, frameRate: VITESSE_ANIMS.up, repeat: -1 },
    { key: "aria_jump", start: 18, end: 23, frameRate: VITESSE_ANIMS.jump, repeat: 0 },
    { key: "aria_punch_right", texture: "img_perso_fight", start: 0, end: 4, frameRate: VITESSE_ANIMS.punch, repeat: 0 },
    { key: "aria_punch_left", texture: "img_perso_fight", start: 5, end: 7, frameRate: VITESSE_ANIMS.punch, repeat: 0 }
  ];
  anims.forEach((a) => {
    if (scene.anims.exists(a.key)) return;
    scene.anims.create({
      key: a.key,
      frames: scene.anims.generateFrameNumbers(a.texture || "img_perso", { start: a.start, end: a.end }),
      frameRate: a.frameRate,
      repeat: a.repeat
    });
  });
}

// à appeler dans update() : déplacement gauche/droite + choix de l'animation
export function deplacerPerso(joueur, clavier, auSol, vitesse = VITESSE_MARCHE) {
  // première fois : on crée la touche de coup et on repère la fin des animations de coup
  if (!joueur.toucheCoup) {
    joueur.toucheCoup = joueur.scene.input.keyboard.addKey(TOUCHE_COUP);
    joueur.enCoup = false;
    joueur.on("animationcomplete", (anim) => {
      if (anim.key.startsWith("aria_punch")) joueur.enCoup = false;
    });
  }

  // sécurité : si l'animation de coup a été interrompue, on libère le joueur
  if (joueur.enCoup && !joueur.anims.currentAnim?.key.startsWith("aria_punch")) joueur.enCoup = false;

  // pendant un coup de poing, Aria reste sur place
  if (joueur.enCoup) {
    joueur.setVelocityX(0);
    return;
  }

  // nouveau coup de poing (au sol seulement) : droite ou gauche au hasard
  if (auSol && Phaser.Input.Keyboard.JustDown(joueur.toucheCoup)) {
    joueur.enCoup = true;
    joueur.setVelocityX(0);
    joueur.anims.play(Math.random() < 0.5 ? "aria_punch_right" : "aria_punch_left");
    return;
  }

  if (clavier.left.isDown) {
    joueur.setVelocityX(-vitesse);
    joueur.setFlipX(true);
  } else if (clavier.right.isDown) {
    joueur.setVelocityX(vitesse);
    joueur.setFlipX(false);
  } else {
    joueur.setVelocityX(0);
  }

  if (!auSol) {
    // saut : l'animation se joue une seule fois, puis reste sur la dernière image jusqu'à l'atterrissage
    if (joueur.anims.currentAnim?.key !== "aria_jump") joueur.anims.play("aria_jump");
  }
  else if (clavier.left.isDown || clavier.right.isDown) joueur.anims.play("aria_walk", true);
  else joueur.anims.play("aria_stand", true);
}