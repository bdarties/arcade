import * as fct from "./fonctions.js";
import * as bonus from "./bonus.js";
import * as cristaux from "./cristaux.js";

/***********************************************************************/
/** LUMIERE : le jeu est dans le noir, la torche et quelques objets éclairent
/**
/** Le principe tient en 3 étapes, refaites à chaque image :
/**   1. une grande image noire couvre tout l'écran (scene.obscurite)
/**   2. on dessine en blanc, sur un "calque de gomme" (scene.forme_lumiere), tout ce qui éclaire :
/**      des cercles autour des sources de lumière et le cône de la torche
/**   3. on gomme (erase) ce calque dans le noir : là où on a dessiné, le jeu redevient visible
/***********************************************************************/

// true : lumières de Phaser (Light2D) ; false : l'ancien système décrit ci-dessus (noir gommé)
// avec Light2D, il n'y a plus de noir posé sur l'écran : ce sont les objets qui sont sombres, sauf là où une lumière les touche
// Light2D ne sait faire que des lumières rondes : le cône de la torche est une petite chaîne de lumières devant le joueur,
// qui s'arrête au premier mur ; les lasers, tirs, cristaux, potions et éclats ont chacun leur lumière (cf. majLumieres)
// Phaser n'affiche que les lumières les plus proches de la caméra (maxLights dans index.js) : les autres sont ignorées
const LIGHT2D = true;
const AMBIANT = 0x090b18; // luminosité de ce qu'aucune lumière n'atteint (0x000000 : noir complet)
const RAYON_JOUEUR = 95; // px : rayon du halo autour d'un joueur
const INTENSITE_JOUEUR = 0.5; // 1 : la couleur normale de l'image au centre ; plus : plus clair
const COULEUR_JOUEUR = 0xffe8cc; // blanc chaud

// torche : NB_LUMIERES_TORCHE lumières réparties devant le joueur, de plus en plus larges et faibles en s'éloignant
const NB_LUMIERES_TORCHE = 2; // 2 joueurs x (1 halo + 2 torche) = 6 : la limite maxLights de index.js
const COULEUR_TORCHE = 0xffc88a; // orangé : la torche se détache du bleu nuit de l'ambiance
const RAYON_TORCHE_PROCHE = 45; // px : rayon d'une lumière collée au joueur...
const RAYON_TORCHE_PAR_PX = 0.5; // ... plus ce nombre de px de rayon par px de distance (le cône s'évase)
const INTENSITE_TORCHE_PROCHE = 1;
const INTENSITE_TORCHE_LOIN = 0.5; // intensité de la lumière tout au bout du cône
const DISTANCE_MIN_TORCHE = 24; // px : face à un mur collé, les lumières restent un peu devant le joueur

// lumières des objets qui brillent : rayon (px), couleur, intensité
const LUMIERE_LASER = { rayon: 70, intensite: 1, couleurs: { bleu: 0x6fb8ff, rouge: 0xff6f6f } };
const LUMIERE_TIR_ENNEMI = { rayon: 60, intensite: 0.9, couleur: 0x7cff7c };
const LUMIERE_CRISTAL = { rayon: 110, intensite: 0.9, couleur: 0xffc060 };
const LUMIERE_POTION = { rayon: 60, intensite: 0.8, couleur: 0xffe9b0 };
const LUMIERE_ECLAT = { couleur: 0xffd9a0, rayon_par_px: 1.5 }; // rayon = celui du halo de l'ancien système x 1,5

const PORTEE_TORCHE = 260; // px : longueur du cône de lumière
const ANGLE_TORCHE = 60; // degrés : ouverture du cône
const NB_RAYONS = 15; // rayons lancés dans le cône pour savoir où s'arrêtent les murs
const PAS_RAYON = 8; // px : un rayon avance de 8 px à la fois jusqu'à toucher un mur
const COUCHES_CONE = [1, 0.75, 0.5, 0.25]; // le cône est dessiné 4 fois, de plus en plus court : plus on est près, plus c'est éclairé
const OPACITE_COUCHE = 0.3;

// un halo = des cercles concentriques [rayon en px, opacité] : la lumière est plus forte au centre
const HALO_JOUEUR = [[28, 0.2], [14, 1]]; // le dernier cercle (opacité 1) rend le joueur toujours visible
const HALO_LASER = [[44, 0.2], [28, 0.3], [14, 0.6]];
const HALO_ECLAT = [[56, 0.2], [32, 0.4], [16, 0.8]]; // lueur quand un laser touche un mur
const DUREE_ECLAT = 150; // ms
const HALO_TIR_ENNEMI = [[34, 0.2], [18, 0.5], [9, 0.85]];

// Light2D : active les lumières de Phaser, éclaire les joueurs et crée le halo de chacun (dans la salle safe : pas d'obscurité du tout)
// un objet n'est éclairé que s'il a le pipeline "Light2D" : sinon il reste à pleine luminosité
function creerLight2D(scene) {
  scene.obscurite = null;
  if (scene.etat.safe) return;
  scene.lights.enable().setAmbientColor(AMBIANT);
  scene.joueurs.forEach((j) => {
    j.sprite.setPipeline("Light2D");
    j.lumiere = scene.lights.addLight(j.sprite.x, j.sprite.y, RAYON_JOUEUR, COULEUR_JOUEUR, INTENSITE_JOUEUR);
    j.lumieres_torche = Array.from({ length: NB_LUMIERES_TORCHE }, () => scene.lights.addLight(j.sprite.x, j.sprite.y, RAYON_TORCHE_PROCHE, COULEUR_TORCHE, 0));
  });
  scene.lumieres_objets = new Map(); // objet qui brille -> sa lumière (cf. suivre)
  scene.lumieres_vues = new Set(); // objets vus à cette image : les lumières des autres sont retirées
}

// une lumière par objet qui brille : créée à son apparition, déplacée avec lui, retirée dès qu'il disparait
function suivre(scene, objet, x, y, rayon, couleur, intensite) {
  let lumiere = scene.lumieres_objets.get(objet);
  if (!lumiere) {
    lumiere = scene.lights.addLight(x, y, rayon, couleur, intensite);
    scene.lumieres_objets.set(objet, lumiere);
  }
  lumiere.setPosition(x, y).setRadius(rayon).setIntensity(intensite);
  scene.lumieres_vues.add(objet);
}

// distance jusqu'au premier mur dans la direction du regard (au plus la portée de la torche)
function distanceMur(scene, joueur, portee) {
  const x = joueur.sprite.body.center.x;
  const y = joueur.sprite.body.center.y;
  let distance = 0;
  while (distance < portee && !scene.calque_murs.hasTileAtWorldXY(x + joueur.regard.x * distance, y + joueur.regard.y * distance)) {
    distance += PAS_RAYON;
  }
  return Math.max(distance, DISTANCE_MIN_TORCHE);
}

// la torche : les lumières se placent devant le joueur et s'arrêtent avant le mur ; éteinte, elles sont invisibles
function majTorche(scene, joueur) {
  const portee = porteeTorche(joueur);
  const distance = distanceMur(scene, joueur, portee);
  const centre = joueur.sprite.body.center;
  joueur.lumieres_torche.forEach((lumiere, k) => {
    const allumee = joueur.torche_allumee;
    lumiere.visible = allumee;
    if (!allumee) return;
    const d = distance * (k + 1) / NB_LUMIERES_TORCHE; // d = distance de cette lumière au joueur
    const rayon = (RAYON_TORCHE_PROCHE + d * RAYON_TORCHE_PAR_PX) * (0.5 + 0.5 * distance / portee); // moins large près d'un mur
    const intensite = INTENSITE_TORCHE_PROCHE + (INTENSITE_TORCHE_LOIN - INTENSITE_TORCHE_PROCHE) * (d / portee);
    lumiere.setPosition(centre.x + joueur.regard.x * d, centre.y + joueur.regard.y * d).setRadius(rayon).setIntensity(intensite);
  });
}

// à chaque image avec Light2D : les lumières suivent leurs objets
function majLight2D(scene) {
  scene.joueurs.forEach((j) => {
    j.lumiere.setPosition(j.sprite.x, j.sprite.y);
    majTorche(scene, j);
  });
  scene.butin.forEach((objet) => {
    if (objet.definition.lumiere) suivre(scene, objet, objet.x, objet.y, LUMIERE_POTION.rayon, LUMIERE_POTION.couleur, LUMIERE_POTION.intensite);
    else if (!objet.eclaire) {
      objet.setPipeline("Light2D"); // les objets qui ne brillent pas sont éclairés comme la carte
      objet.eclaire = true;
    }
  });
  scene.projectiles.getChildren().forEach((laser) => {
    if (!laser.active) return;
    const couleur = LUMIERE_LASER.couleurs[laser.texture.key.endsWith("rouge") ? "rouge" : "bleu"];
    suivre(scene, laser, laser.x, laser.y, LUMIERE_LASER.rayon, couleur, LUMIERE_LASER.intensite);
  });
  scene.tirs_ennemis.getChildren().forEach((tir) => {
    if (tir.active) suivre(scene, tir, tir.x, tir.y, LUMIERE_TIR_ENNEMI.rayon, LUMIERE_TIR_ENNEMI.couleur, LUMIERE_TIR_ENNEMI.intensite);
  });
  scene.cristaux.forEach((cristal) => {
    if (cristal.active) suivre(scene, cristal, cristal.x, cristal.y, LUMIERE_CRISTAL.rayon, LUMIERE_CRISTAL.couleur, LUMIERE_CRISTAL.intensite);
  });

  // les éclats d'impact : ils faiblissent jusqu'à disparaître
  scene.eclats = scene.eclats.filter((eclat) => scene.time.now < eclat.fin);
  scene.eclats.forEach((eclat) => {
    const restant = (eclat.fin - scene.time.now) / (eclat.duree ?? DUREE_ECLAT); // 1 puis 0
    const echelle = eclat.expansion ? 0.6 + 0.4 * (1 - restant) : 1;
    const rayon = (eclat.halo ?? HALO_ECLAT)[0][0] * LUMIERE_ECLAT.rayon_par_px * echelle;
    suivre(scene, eclat, eclat.x, eclat.y, rayon, LUMIERE_ECLAT.couleur, restant);
  });

  // on retire les lumières des objets qui ont disparu
  for (const [objet, lumiere] of scene.lumieres_objets) {
    if (scene.lumieres_vues.has(objet)) continue;
    scene.lights.removeLight(lumiere);
    scene.lumieres_objets.delete(objet);
  }
  scene.lumieres_vues.clear();
}

// les calques de la carte sont éclairés comme le reste (sans effet si l'ancien système est utilisé)
export function eclairerCalques(scene, calques) {
  if (!LIGHT2D || scene.etat.safe) return;
  calques.forEach((calque) => calque.setPipeline("Light2D"));
}

// les ennemis, les cailloux, le trou et l'échelle sont éclairés comme la carte : on ne les voit que près d'une lumière
// les objets qui brillent eux-mêmes (cristaux, lasers, tirs d'aliens, potions) n'ont pas le pipeline : ils restent visibles dans le noir
export function eclairerObjets(scene) {
  if (!LIGHT2D || scene.etat.safe) return;
  const objets = [...scene.ennemis.getChildren(), ...scene.cailloux.getChildren(), scene.trou, scene.echelle_montee];
  objets.forEach((objet) => objet?.setPipeline("Light2D"));
}

// crée le noir qui couvre l'écran et le calque de gomme (dans la salle safe : pas d'obscurité du tout)
export function creerObscurite(scene) {
  if (LIGHT2D) {
    creerLight2D(scene);
    return;
  }
  scene.obscurite = scene.etat.safe ? null : scene.add.renderTexture(0, 0, scene.scale.width, scene.scale.height)
    .setOrigin(0, 0)
    .setScrollFactor(0) // il reste collé à l'écran quand la caméra bouge
    .setDepth(fct.PROFONDEUR.obscurite); // au-dessus du jeu, sous l'affichage (HUD)
  scene.forme_lumiere = scene.make.graphics({}, false); // jamais affiché : sert seulement de gomme
}

// un laser touche un mur : une petite lueur de 150 ms
export function ajouterEclat(scene, x, y) {
  if (scene.etat.safe) return; // rien à éclairer dans la salle safe
  scene.eclats.push({ x: x, y: y, fin: scene.time.now + DUREE_ECLAT });
}

// dessine un halo sur le calque de gomme (les coordonnées du monde sont converties en coordonnées d'écran)
function halo(scene, x, y, rayons, opacite = 1, echelle = 1) {
  const camera = scene.cameras.main;
  rayons.forEach(([rayon, force]) => {
    scene.forme_lumiere.fillStyle(0xffffff, force * opacite);
    scene.forme_lumiere.fillCircle(x - camera.scrollX, y - camera.scrollY, rayon * echelle);
  });
}

// longueur du cône du joueur (la potion de vision l'allonge)
function porteeTorche(joueur) {
  return PORTEE_TORCHE * (joueur.effets.vision > 0 ? bonus.PORTEE_VISION : 1);
}

// le cône est un polygone : le joueur, puis un point au bout de chaque rayon
// un rayon part du joueur dans une direction et avance par petits pas, jusqu'à la portée maximale ou jusqu'à un mur
function pointsDuCone(scene, joueur) {
  const x = joueur.sprite.body.center.x;
  const y = joueur.sprite.body.center.y;
  const portee = porteeTorche(joueur);
  const demi_angle = Phaser.Math.DegToRad(ANGLE_TORCHE / 2);
  const points = [{ x: x, y: y }];

  for (let i = 0; i < NB_RAYONS; i++) {
    // de -demi_angle à +demi_angle autour de la direction du regard
    const angle = joueur.regard.angle() - demi_angle + (i / (NB_RAYONS - 1)) * 2 * demi_angle;
    let distance = 0;
    while (distance < portee && !scene.calque_murs.hasTileAtWorldXY(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance)) {
      distance += PAS_RAYON;
    }
    points.push({ x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance });
  }
  return points;
}

// dessine le cône 4 fois, du plus long au plus court : le centre s'éclaire 4 fois, le bout une seule
function dessinerCone(scene, joueur) {
  const camera = scene.cameras.main;
  const points = pointsDuCone(scene, joueur);
  const origine = points[0];
  COUCHES_CONE.forEach((echelle) => {
    // on rapproche chaque point de l'origine pour raccourcir le cône
    const reduits = points.map((p) => new Phaser.Math.Vector2(
      origine.x + (p.x - origine.x) * echelle - camera.scrollX,
      origine.y + (p.y - origine.y) * echelle - camera.scrollY
    ));
    scene.forme_lumiere.fillStyle(0xffffff, OPACITE_COUCHE);
    scene.forme_lumiere.fillPoints(reduits, true);
  });
}

// le point (x, y) est-il dans le cône du joueur ? (assez près, et dans l'angle du regard)
function dansLeCone(joueur, x, y) {
  const centre = joueur.sprite.body.center;
  const distance = Phaser.Math.Distance.Between(centre.x, centre.y, x, y);
  const ecart = Phaser.Math.Angle.Wrap(Math.atan2(y - centre.y, x - centre.x) - joueur.regard.angle());
  return distance <= porteeTorche(joueur) && Math.abs(ecart) <= Phaser.Math.DegToRad(ANGLE_TORCHE / 2);
}

// à appeler à chaque image : redessine toute la lumière
export function majLumieres(scene) {
  if (scene.etat.safe) return; // salle safe : pas d'obscurité, donc rien à éclairer
  if (LIGHT2D) {
    majLight2D(scene);
    return;
  }
  scene.forme_lumiere.clear();

  // le joueur : un petit halo autour de lui, et le cône de sa torche si elle est allumée
  scene.joueurs.forEach((j) => {
    halo(scene, j.sprite.x, j.sprite.y, HALO_JOUEUR);
    if (j.torche_allumee) dessinerCone(scene, j);
  });

  // un laser éclaire autour de lui, sauf quand la torche d'un joueur l'éclaire déjà
  scene.projectiles.getChildren().forEach((laser) => {
    const deja_eclaire = scene.joueurs.some((j) => j.torche_allumee && dansLeCone(j, laser.x, laser.y));
    if (!deja_eclaire) halo(scene, laser.x, laser.y, HALO_LASER);
  });

  // les éclats d'impact : ils faiblissent jusqu'à disparaître
  scene.eclats = scene.eclats.filter((eclat) => scene.time.now < eclat.fin);
  scene.eclats.forEach((eclat) => {
    const restant = (eclat.fin - scene.time.now) / (eclat.duree ?? DUREE_ECLAT); // 1 puis 0
    const echelle = eclat.expansion ? 0.6 + 0.4 * (1 - restant) : 1; // certains s'élargissent en s'éteignant (cf. pierres.js)
    halo(scene, eclat.x, eclat.y, eclat.halo ?? HALO_ECLAT, restant, echelle);
  });

  // les objets qui brillent : potions au sol, tirs des aliens, cristaux
  scene.butin.forEach((objet) => {
    if (objet.definition.lumiere) halo(scene, objet.x, objet.y, bonus.HALO_POTION);
  });
  scene.tirs_ennemis.getChildren().forEach((tir) => halo(scene, tir.x, tir.y, HALO_TIR_ENNEMI));
  scene.cristaux.forEach((cristal) => halo(scene, cristal.x, cristal.y, cristaux.HALO_CRISTAL));

  // étapes 1 et 3 : tout noir, puis on gomme tout ce qui a été dessiné
  scene.obscurite.fill(0x000000);
  scene.obscurite.erase(scene.forme_lumiere);
}
