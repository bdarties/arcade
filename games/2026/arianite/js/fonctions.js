// Cadences des animations d'Aria, exprimées en images par seconde.
const VITESSE_ANIMS = {
  stand: 2,
  walk: 14,
  up: 8,
  jump: 20,
  punch: 10
};

const VITESSE_MARCHE = 250;

// Construit une interface clavier uniforme pour les niveaux narratifs.
export function creerClavier(scene) {
  const k = scene.input.keyboard.addKeys({
    upJ1: Phaser.Input.Keyboard.KeyCodes.UP,
    downJ1: Phaser.Input.Keyboard.KeyCodes.DOWN,
    leftJ1: Phaser.Input.Keyboard.KeyCodes.LEFT,
    rightJ1: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    jumpJ1: Phaser.Input.Keyboard.KeyCodes.I,
    attackJ1: Phaser.Input.Keyboard.KeyCodes.O,
    interactJ1: Phaser.Input.Keyboard.KeyCodes.K,
    space: Phaser.Input.Keyboard.KeyCodes.SPACE
  });

  return {
    _keys: k,
    left: { get isDown() { return k.leftJ1.isDown} },
    right: { get isDown() { return k.rightJ1.isDown} },
    up: { get isDown() { return k.upJ1.isDown} },
    down: { get isDown() { return k.downJ1.isDown} },
    jump: { get isDown() { return k.jumpJ1.isDown} },
    attack: { get isDown() { return k.attackJ1.isDown} },
    space: k.space
  };
}

// Détecte un nouvel appui sur la touche d'interaction (ou Espace).
export function justDownInteragir(clavier) {
  if (!clavier || !clavier._keys) return false;
  const k = clavier._keys;
  return (
    Phaser.Input.Keyboard.JustDown(k.interactJ1) ||
    Phaser.Input.Keyboard.JustDown(k.space)
  );
}

// Détecte un nouvel appui sur la touche d'attaque.
export function justDownAttaquer(clavier) {
  if (!clavier || !clavier._keys) return false;
  const k = clavier._keys;
  return (
    Phaser.Input.Keyboard.JustDown(k.attackJ1)
  );
}

// Charge les spritesheets d'Aria partagés par les scènes du jeu.
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

// Crée une seule fois les animations standard utilisées par Aria.
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

// Applique déplacement, saut et animation à un joueur du mode narratif.
export function deplacerPerso(joueur, clavier, auSol, vitesse = VITESSE_MARCHE) {
  // Un seul écouteur est installé par sprite, même si cette fonction tourne à chaque image.
  if (!joueur.initCoupListener) {
    joueur.initCoupListener = true;
    joueur.enCoup = false;
    joueur.on("animationcomplete", (anim) => {
      if (anim.key.startsWith("aria_punch")) joueur.enCoup = false;
    });
  }

  if (joueur.enCoup && !joueur.anims.currentAnim?.key.startsWith("aria_punch")) joueur.enCoup = false;

  if (joueur.enCoup) {
    joueur.setVelocityX(0);
    return;
  }

  if (auSol && justDownAttaquer(clavier)) {
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
    if (joueur.anims.currentAnim?.key !== "aria_jump") joueur.anims.play("aria_jump");
  }
  else if (clavier.left.isDown || clavier.right.isDown) joueur.anims.play("aria_walk", true);
  else joueur.anims.play("aria_stand", true);
}

// Valeurs communes à la barre de vie et à l'invulnérabilité après un impact.
const VIES_MAX = 5;
const INVINCIBILITE = 1000;

// Initialise le nombre de vies et l'interface qui l'affiche.
export function initVies(scene, nouvellePartie = false) {
  if (nouvellePartie || scene.registry.get("vies") === undefined) scene.registry.set("vies", VIES_MAX);
  scene.barreVie = scene.add.graphics().setScrollFactor(0).setDepth(100);
  dessinerBarreVie(scene);
}

// Lit le nombre de vies partagé entre les scènes via le registre Phaser.
export function getVies(scene) {
  return scene.registry.get("vies");
}

// Dessine les segments actifs et perdus de la barre de vie.
function dessinerBarreVie(scene) {
  const g = scene.barreVie;
  if (!g) return;
  const vies = getVies(scene);

  const COULEUR_FOND = 0x140a0a;
  const COULEUR_CADRE = 0xc9a24b;
  const COULEUR_VIE = 0xa3121c;
  const COULEUR_REFLET = 0xe0434c;
  const COULEUR_VIDE = 0x3a1f1f;
  const x = 24, y = 22;
  const segL = 46, segH = 22, ecart = 6, marge = 8;

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

// Retire des vies, applique le recul et signale si le joueur est éliminé.
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


// Frame de chaque animation où les dégâts de mêlée sont appliqués.
const FRAME_IMPACT = { aria_punch_right: 2, aria_punch_left: 6 };
const COUP_PORTEE = 70;
const COUP_DEGATS = 1;
const AFFICHER_PORTEE = true;

// Vérifie la cible à la frame d'impact de chaque coup animé.
export function activerCoups(joueur, ennemis, degats = COUP_DEGATS) {
  joueur.on("animationupdate", (anim, frame) => {
    if (FRAME_IMPACT[anim.key] !== frame.textureFrame) return;

    // La collision est testée uniquement pendant la frame où le coup touche.
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

// Applique les dégâts et l'effet visuel approprié à l'ennemi touché.
function toucherEnnemi(ennemi, degats, joueur, ennemis) {
  const scene = ennemi.scene;
  ennemi.pv -= degats;

  if (ennemi.pv <= 0) {
    ennemis.splice(ennemis.indexOf(ennemi), 1);
    ennemi.body.enable = false;
    ennemi.anims.stop();
    ennemi.setTint(0xff0000);
    scene.tweens.add({ targets: ennemi, alpha: 0, duration: 300, onComplete: () => ennemi.destroy() });
    return;
  }

  ennemi.setTint(0xff0000);
  ennemi.x += joueur.x < ennemi.x ? 15 : -15;
  scene.time.delayedCall(150, () => ennemi.active && ennemi.clearTint());
}

// Dessine brièvement l'arc qui visualise la portée d'un coup.
function afficherArcCoup(joueur) {
  const b = joueur.body;
  const rayon = COUP_PORTEE + b.width / 2;
  const ouverture = Phaser.Math.DegToRad(55);
  const debut = joueur.flipX ? Math.PI - ouverture : -ouverture;
  const fin = joueur.flipX ? Math.PI + ouverture : ouverture;

  const arc = joueur.scene.add.graphics().setDepth(5);
  arc.lineStyle(6, 0xffffff, 0.8);
  arc.beginPath();
  arc.arc(b.center.x, b.center.y, rayon, debut, fin);
  arc.strokePath();
  joueur.scene.tweens.add({ targets: arc, alpha: 0, duration: 180, onComplete: () => arc.destroy() });
}

// Lance une seule séquence de mort, réinitialise les vies et relance après le fondu.
export function mortParChute(scene, relancer) {
  if (scene.enMort) return;
  scene.enMort = true;
  scene.events.once("shutdown", () => (scene.enMort = false));
  scene.registry.set("vies", VIES_MAX);
  scene.cameras.main.once("camerafadeoutcomplete", relancer);
  scene.cameras.main.fadeOut(500, 0, 0, 0);
}
