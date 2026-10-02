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
<<<<<<< HEAD
}
=======
}


/***********************************************************************/
/** VIES DU JOUEUR + BARRE DE VIE (partagées par tous les niveaux)
/***********************************************************************/

const VIES_MAX = 5; // vies au départ
const INVINCIBILITE = 1000; // ms d'invincibilité après un coup reçu

// à appeler dans create() de chaque niveau, APRÈS la création du joueur.
// nouvellePartie = true : on remet les vies au maximum (1er niveau). Sinon on garde les vies du niveau précédent.
export function initVies(scene, nouvellePartie = false) {
  if (nouvellePartie || scene.registry.get("vies") === undefined) scene.registry.set("vies", VIES_MAX);
  scene.barreVie = scene.add.graphics().setScrollFactor(0).setDepth(100); // fixe à l'écran, devant tout
  dessinerBarreVie(scene);
}

export function getVies(scene) {
  return scene.registry.get("vies");
}

// dessine la barre : cadre doré, segments rouges (un par vie), segments éteints pour les vies perdues
function dessinerBarreVie(scene) {
  const g = scene.barreVie;
  if (!g) return;
  const vies = getVies(scene);

  // ---- réglages du look (couleurs en hexadécimal) ----
  const COULEUR_FOND = 0x140a0a;
  const COULEUR_CADRE = 0xc9a24b; // or
  const COULEUR_VIE = 0xa3121c; // rouge opéra
  const COULEUR_REFLET = 0xe0434c;
  const COULEUR_VIDE = 0x3a1f1f;
  const x = 24, y = 22; // position à l'écran
  const segL = 46, segH = 22, ecart = 6, marge = 8; // taille des segments

  const L = VIES_MAX * segL + (VIES_MAX - 1) * ecart + marge * 2;
  const H = segH + marge * 2;
  g.clear();
  g.fillStyle(COULEUR_FOND, 0.85).fillRoundedRect(x, y, L, H, 8);
  g.lineStyle(3, COULEUR_CADRE, 1).strokeRoundedRect(x, y, L, H, 8);
  for (let i = 0; i < VIES_MAX; i++) {
    const sx = x + marge + i * (segL + ecart);
    const sy = y + marge;
    if (i < vies) {
      g.fillStyle(COULEUR_VIE, 1).fillRoundedRect(sx, sy, segL, segH, 4);
      g.fillStyle(COULEUR_REFLET, 0.6).fillRoundedRect(sx + 3, sy + 3, segL - 6, 6, 3);
    } else {
      g.fillStyle(COULEUR_VIDE, 1).fillRoundedRect(sx, sy, segL, segH, 4);
    }
  }
}

// le joueur subit des dégâts (invincibilité, rouge, recul). Renvoie true s'il n'a plus de vie :
// le niveau décide alors quoi faire (relancer la scène, écran de défaite...). Les vies sont remises au max.
export function perdreVieJoueur(scene, joueur, degats, source) {
  if (joueur.invincible) return false;
  joueur.invincible = true;

  const vies = Math.max(0, getVies(scene) - degats);
  scene.registry.set("vies", vies);
  dessinerBarreVie(scene);

  joueur.setTint(0xff0000);
  joueur.setVelocityY(-200);
  joueur.x += joueur.x < source.x ? -20 : 20;

  if (vies <= 0) {
    scene.registry.set("vies", VIES_MAX);
    return true;
  }
  scene.time.delayedCall(INVINCIBILITE, () => {
    joueur.invincible = false;
    joueur.clearTint();
  });
  return false;
}


/***********************************************************************/
/** COUPS DE POING : DÉGÂTS SUR LES ENNEMIS
/***********************************************************************/

// image de l'animation où le coup "touche" (numéro de frame de la planche aria_spritesheet_fight)
const FRAME_IMPACT = { aria_punch_right: 2, aria_punch_left: 6 };
const COUP_PORTEE = 70; // distance devant Aria où le coup touche (px)
const COUP_DEGATS = 1; // dégâts d'un coup
const AFFICHER_PORTEE = true; // true = un arc blanc montre la portée du coup (false = invisible)

// à appeler dans create() de chaque niveau avec le tableau des ennemis du niveau.
// Chaque ennemi doit avoir une propriété "pv". Quand pv tombe à 0, il est retiré du tableau et disparaît.
export function activerCoups(joueur, ennemis, degats = COUP_DEGATS) {
  joueur.on("animationupdate", (anim, frame) => {
    if (FRAME_IMPACT[anim.key] !== frame.textureFrame) return; // pas la frame d'impact

    // zone du coup : devant Aria, selon le côté où elle regarde
    const b = joueur.body;
    const x = joueur.flipX ? b.left - COUP_PORTEE : b.right;
    const zone = new Phaser.Geom.Rectangle(x, b.top, COUP_PORTEE, b.height);
    if (AFFICHER_PORTEE) afficherArcCoup(joueur);

    [...ennemis].forEach((e) => {
      if (!e.active || !e.body) return;
      const corps = new Phaser.Geom.Rectangle(e.body.x, e.body.y, e.body.width, e.body.height);
      if (Phaser.Geom.Intersects.RectangleToRectangle(zone, corps)) toucherEnnemi(e, degats, joueur, ennemis);
    });
  });
}

function toucherEnnemi(ennemi, degats, joueur, ennemis) {
  const scene = ennemi.scene;
  ennemi.pv -= degats;

  if (ennemi.pv <= 0) {
    // mort : plus de collision, fondu rouge puis suppression
    ennemis.splice(ennemis.indexOf(ennemi), 1);
    ennemi.body.enable = false;
    ennemi.anims.stop();
    ennemi.setTint(0xff0000);
    scene.tweens.add({ targets: ennemi, alpha: 0, duration: 300, onComplete: () => ennemi.destroy() });
    return;
  }

  // touché mais vivant : clignote en rouge et recule un peu
  ennemi.setTint(0xff0000);
  ennemi.x += joueur.x < ennemi.x ? 15 : -15;
  scene.time.delayedCall(150, () => ennemi.active && ennemi.clearTint());
}

// petit arc blanc devant Aria qui s'efface vite : sa taille correspond à la portée du coup
function afficherArcCoup(joueur) {
  const b = joueur.body;
  const rayon = COUP_PORTEE + b.width / 2;
  const ouverture = Phaser.Math.DegToRad(55); // largeur de l'arc
  const debut = joueur.flipX ? Math.PI - ouverture : -ouverture;
  const fin = joueur.flipX ? Math.PI + ouverture : ouverture;

  const arc = joueur.scene.add.graphics().setDepth(5);
  arc.lineStyle(6, 0xffffff, 0.8);
  arc.beginPath();
  arc.arc(b.center.x, b.center.y, rayon, debut, fin);
  arc.strokePath();
  joueur.scene.tweens.add({ targets: arc, alpha: 0, duration: 180, onComplete: () => arc.destroy() });
}
>>>>>>> Arianite
