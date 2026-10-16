// Petits outils d'interface partagés par toutes les scènes : styles de texte,
// panneau de présentation avant le jeu, médaillon avec la tete du perso,
// textes qui s'envolent, réactions des persos à la fin...

import { jouerSon, arreterMusique } from "./sons.js";

export const POLICE = "Jersey15";
const ENCRE = "#1b1030";
export const OR = "#ffd23f";

// Le même MP3 et les quatre chiffres avant chacun des mini-jeux.
export function compteRebours(scene, suite) {
  arreterMusique(scene);
  var duree = scene.cache.audio.get("timer").duration * 1000;
  jouerSon(scene, "timer");
  for (var k = 0; k < 4; k++) {
    let chiffre = 4 - k;
    scene.time.delayedCall(k * duree / 4, () => annonce(scene, String(chiffre), OR, duree / 8, 300));
  }
  scene.time.delayedCall(duree, suite);
}

// gros texte avec un contour sombre
export function style(taille, couleur, contour) {
  return {
    fontFamily: POLICE,
    fontSize: taille + "px",
    color: couleur || "#ffffff",
    stroke: ENCRE,
    strokeThickness: contour === undefined ? 1 : Math.min(contour, 2),
    align: "center"
  };
}

// texte courant (règles, descriptions)
export function styleTexte(taille, couleur) {
  return {
    fontFamily: POLICE,
    fontSize: taille + "px",
    fontStyle: "normal",
    color: couleur || "#ffffff",
    align: "center",
    lineSpacing: 6
  };
}

// image de fond + voile sombre par-dessus pour que le texte ressorte
export function fondAssombri(scene, cle, opacite) {
  scene.add.image(0, 0, cle).setOrigin(0);
  scene.add.rectangle(0, 0, 1280, 720, 0x0b0618, opacite).setOrigin(0);
}

// rappel des commandes en bas de l'écran
export function aideBas(scene, actions, y = 682) {
  var elements = [];
  actions.forEach((action, i) => {
    var x = (i - (actions.length - 1) / 2) * 220;
    if (action[0] == "horizontal" || action[0] == "vertical") {
      // flèches ◄ ► (horizontal) ou ▲ ▼ (vertical : les mêmes flèches, tournées d'un quart de tour)
      ["gauche", "droite"].forEach((sens, k) => {
        var fleche = scene.add.image(x - 70 + k * 26, 0, "img_fleche_" + sens);
        fleche.scaleX = 24 / fleche.width;
        fleche.scaleY = fleche.scaleX;
        if (action[0] == "vertical") fleche.angle = 90;
        elements.push(fleche);
      });
    } else {
      var bouton = scene.add.image(x - 58, 0, "ui_bouton");
      bouton.scaleX = 34 / bouton.width;
      bouton.scaleY = 34 / bouton.height;
      elements.push(bouton, scene.add.text(x - 58, 0, action[0].toUpperCase(), style(26, ENCRE, 0)).setOrigin(0.5));
    }
    elements.push(scene.add.text(x - 28, 0, action[1], style(28, "#fff1dc")).setOrigin(0, 0.5));
  });
  return scene.add.container(640, y, elements).setDepth(60);
}

export function creerBandeau(scene, x, y, texte, largeur) {
  var fond = scene.add.image(0, 0, "ui_bandeau");
  fond.scaleX = largeur / fond.width;
  fond.scaleY = 100 / fond.height;
  // La partie rouge est au-dessus du centre du PNG, entre les plis dorés.
  var label = scene.add.text(0, -8, texte, { ...styleTexte(22, "#fff1dc"), wordWrap: { width: largeur * 0.7 } }).setOrigin(0.5);
  return scene.add.container(x, y, [fond, label]);
}

// ---------------------------------------------------------------------------
// Panneau "descriptif + bouton lancer le jeu" affiché avant chaque partie
// ---------------------------------------------------------------------------
export function panneauPresentation(scene, titre, lignes, avecBouton = true) {
  var fond = scene.add.image(0, 0, "ui_regles");
  fond.scaleX = 960 / fond.width;
  fond.scaleY = 520 / fond.height;
  var elements = [fond, scene.add.text(0, -158, titre, style(54, "#7b2830", 0)).setOrigin(0.5)];
  lignes.forEach((ligne, i) => {
    var y = -100 + i * 58;
    var numero = scene.add.image(-380, y, "ui_bouton");
    numero.scaleX = 34 / numero.width;
    numero.scaleY = 34 / numero.height;
    elements.push(numero, scene.add.text(-380, y, String(i + 1), style(24, ENCRE, 0)).setOrigin(0.5));
    elements.push(scene.add.text(-345, y, ligne, { ...styleTexte(28, "#46282c"), align: "left", wordWrap: { width: 690 } }).setOrigin(0, 0.5));
  });
  if (avecBouton) {
    elements.push(creerBandeau(scene, 0, 176, "Jouer", 360));
    var bouton = scene.add.image(-95, 176, "ui_bouton");
    bouton.scaleX = 34 / bouton.width;
    bouton.scaleY = 34 / bouton.height;
    elements.push(bouton, scene.add.text(-95, 176, "A", style(26, ENCRE, 0)).setOrigin(0.5));
  } else {
    elements.push(scene.add.text(0, 176, "Prépare-toi", styleTexte(28, "#7b2830")).setOrigin(0.5));
  }
  return scene.add.container(640, 350, elements).setDepth(80);
}

export function fermerPanneau(scene, panneau, suite) {
  panneau.destroy();
  suite();
}

// ---------------------------------------------------------------------------
// HUD : la tete du perso dans un médaillon, avec le score juste à coté
// ---------------------------------------------------------------------------
export function creerMedaillon(scene, x, y, perso, etiquette) {
  var ombre = scene.add.circle(3, 4, 38, 0x000000, 0.35);
  var cercle = scene.add.circle(0, 0, 38, perso.teinte).setStrokeStyle(4, 0xffffff);
  var tete = scene.add.image(0, 0, perso.tete);
  var tag = scene.add
    .text(0, 42, etiquette, {
      fontFamily: POLICE,
      fontSize: "13px",
      color: "#ffffff",
      backgroundColor: ENCRE,
      padding: { x: 6, y: 2 }
    })
    .setOrigin(0.5);
  return scene.add.container(x, y, [ombre, cercle, tete, tag]).setDepth(30);
}

// les vies (ou les chances) : de petites notes dorées
export function creerVies(scene, x, y, nombre) {
  var vies = [];
  for (var i = 0; i < nombre; i++) {
    vies.push(scene.add.image(x + i * 26, y, "img_vie").setDepth(30));
  }
  return vies;
}

// une vie se casse : la note devient grise et tremble
export function casserVie(scene, image) {
  if (!image) return;
  image.setTint(0x5a5070);
  scene.tweens.add({ targets: image, angle: 25, scale: 1.4, duration: 120, yoyo: true });
  var croix = scene.add.text(image.x, image.y, "✖", style(20, "#ff4d5e", 3)).setOrigin(0.5).setDepth(31);
  scene.tweens.add({ targets: croix, scale: 1.3, duration: 150, yoyo: true });
}

// petit texte qui monte et disparait (+100, PARFAIT...)
export function texteFlottant(scene, x, y, texte, couleur, taille) {
  var t = scene.add
    .text(x, y, texte, style(taille || 26, couleur))
    .setOrigin(0.5)
    .setDepth(45);
  scene.tweens.add({
    targets: t,
    y: y - 55,
    alpha: 0,
    duration: 850,
    ease: "Quad.easeOut",
    onComplete: () => t.destroy()
  });
  return t;
}

// grosse annonce au milieu de l'écran (Prêts ?, ALLEGRO !...)
export function annonce(scene, texte, couleur, duree, y) {
  var t = scene.add
    .text(640, y || 330, texte, style(64, couleur || OR, 10))
    .setOrigin(0.5)
    .setDepth(70)
    .setScale(0);
  scene.tweens.add({ targets: t, scale: 1, duration: 250, ease: "Back.easeOut" });
  scene.tweens.add({
    targets: t,
    alpha: 0,
    delay: duree || 900,
    duration: 250,
    onComplete: () => t.destroy()
  });
  return t;
}




// ---------------------------------------------------------------------------
// Fin de partie (le plus GRAND score gagne dans ces mini-jeux)
// ---------------------------------------------------------------------------
// Règle commune :
//  - en solo, la partie s'arrete quand le joueur est éliminé ;
//  - en duo, elle s'arrete quand les 2 sont éliminés, ou dès qu'il n'en reste
//    qu'un et qu'il a déjà plus de points que l'autre (le gagnant est connu).
export function partieTerminee(joueurs) {
  var enJeu = joueurs.filter((j) => !j.elimine);
  if (enJeu.length == 0) return true;
  if (joueurs.length == 2 && enJeu.length == 1) {
    var autre = joueurs.find((j) => j.elimine);
    return enJeu[0].score > autre.score;
  }
  return false;
}
