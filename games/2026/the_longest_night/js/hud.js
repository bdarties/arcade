// HUD (interface en jeu) de The Longest Night.
// Un seul endroit pour tout le style : couleurs, tailles et positions se règlent ici.

const POLICE = '"Courier New", Courier, monospace';

const FOND = 0x1a1230;
const FOND_ALPHA = 0.93;
const BORD_NEUTRE = 0xf1c489;     // panneaux communs (timer, clés)
const COULEUR_J1 = 0xa4dae4;      // bordures des cadres du joueur 1
const COULEUR_J2 = 0x72089c;      // bordures des cadres du joueur 2 (mode multijoueur)
const TEXTE_J1 = "#fff4dc";       // chiffres / badge du joueur 1
const TEXTE_J2 = "#c58bff";    
const TEXTE_DISCRET = "#fff4dc";  // libellés (BALLES, SCORE, CLÉS)
const TEXTE_CLAIR = "#fff4dc";    // chiffres neutres (timer)
const COULEUR_BALLES = "#fff4dc";
const COULEUR_CLES = "#fff4dc";
const COULEUR_ALERTE = "#ff5a5a";

// --- Tailles (augmentées par rapport à la première version) ---
const LARGEUR = 260;      // panneaux balles / score / vie
const H_VIE = 64;
const H_STAT = 58;
const ECART = 8;
const MARGE = 10;
const L_CENTRE = 220;     // panneaux timer / clés
const TAILLE_ICONE = 40;  // hauteur de toutes les icônes (sablier, balles, score, clés)

// Panneau arrondi : ombre, fond sombre, liseré d'accent à gauche, bordure colorée
function panneau(scene, x, y, largeur, hauteur, accent) {
  const g = scene.add.graphics().setScrollFactor(0);
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(x + 3, y + 3, largeur, hauteur, 10);
  g.fillStyle(FOND, FOND_ALPHA);
  g.fillRoundedRect(x, y, largeur, hauteur, 10);
  g.fillStyle(accent, 1);
  g.fillRoundedRect(x + 1, y + 8, 5, hauteur - 16, 2);
  g.lineStyle(3, accent, 0.9);
  g.strokeRoundedRect(x, y, largeur, hauteur, 10);
  return g;
}

function texte(scene, x, y, contenu, taille, couleur, origine = [0, 0.5]) {
  return scene.add.text(x, y, contenu, {
    fontFamily: POLICE,
    fontSize: taille + "px",
    fontStyle: "bold",
    color: couleur,
    stroke: "#0a0614",
    strokeThickness: 5
  }).setOrigin(origine[0], origine[1]).setScrollFactor(0);
}

// icône à hauteur fixe, quelle que soit la taille d'origine de l'image
function icone(scene, x, y, cle, hauteur) {
  const img = scene.add.image(x, y, cle).setOrigin(0, 0.5).setScrollFactor(0);
  img.setScale(hauteur / img.height);
  return img;
}

function css(hex) {
  return "#" + hex.toString(16).padStart(6, "0");
}

// Les 3 panneaux d'un joueur, placés aux positions demandées : { vie:{x,y}, balles:{x,y}, score:{x,y} }
function panneaux_joueur(scene, joueur, pos, accent, couleurTexte, badge, cleVie) {
  const objets = [];
  const ajouter = (o) => { objets.push(o); return o; };

  // VIE
  ajouter(panneau(scene, pos.vie.x, pos.vie.y, LARGEUR, H_VIE, accent));
  const barreVie = ajouter(scene.add.sprite(pos.vie.x + 18, pos.vie.y + H_VIE / 2, cleVie, joueur.points_vies)
    .setOrigin(0, 0.5).setScale(2.9).setScrollFactor(0));
  if (badge) {
    ajouter(texte(scene, pos.vie.x + LARGEUR - 14, pos.vie.y + H_VIE / 2, badge, 20, couleurTexte, [1, 0.5]));
  }

  // BALLES
  const yb = pos.balles.y + H_STAT / 2;
  ajouter(panneau(scene, pos.balles.x, pos.balles.y, LARGEUR, H_STAT, accent));
  const iconeBalles = ajouter(icone(scene, pos.balles.x + 20, yb, "bullet_icone", TAILLE_ICONE));
  const balles = ajouter(texte(scene, pos.balles.x + 192, yb, String(joueur.balle_restante), 36, COULEUR_BALLES, [1, 0.5]));
  ajouter(texte(scene, pos.balles.x + 196, yb + 5, "/" + joueur.balle_max, 18, TEXTE_DISCRET));

  // SCORE
  const ys = pos.score.y + H_STAT / 2;
  ajouter(panneau(scene, pos.score.x, pos.score.y, LARGEUR, H_STAT, accent));
  const iconeScore = ajouter(icone(scene, pos.score.x + 20, ys, "Score", TAILLE_ICONE));
  const score = ajouter(texte(scene, pos.score.x + LARGEUR - 20, ys, String(joueur.score), 36, couleurTexte, [1, 0.5]));

  return { objets, score, balles, barreVie, iconeScore, iconeBalles };
}

// colonne classique (mode 2 joueurs) : vie, balles, score empilés à partir de (x, MARGE)
function colonne(x) {
  return {
    vie: { x, y: MARGE },
    balles: { x, y: MARGE + H_VIE + ECART },
    score: { x, y: MARGE + H_VIE + ECART + H_STAT + ECART }
  };
}

/**
 * Crée tout le HUD. À appeler dans create(), après la création des caméras.
 *  - 2 joueurs : J1 à gauche et J2 à droite (chacun dans sa moitié d'écran)
 *  - solo      : vie à gauche ; balles et score à droite ; tout est affiché en plein écran
 * Renvoie les éléments utiles au reste du jeu et les listes d'objets à faire ignorer par les caméras.
 */
export function creer_hud(scene, joueur1, joueur2, valeurs) {
  const deux = !!joueur2;
  let j1;
  let j2 = null;
  const objetsSolo = []; // en solo, les panneaux de J1 passent par la caméra plein écran

  if (deux) {
    j1 = panneaux_joueur(scene, joueur1, colonne(MARGE), COULEUR_J1, TEXTE_J1, "J1", "pv_bar");
    j2 = panneaux_joueur(scene, joueur2, colonne(640 - MARGE - LARGEUR), COULEUR_J2, TEXTE_J2, "J2", "pv_bar2");
  } else {
    const xDroite = 1280 - MARGE - LARGEUR;
    j1 = panneaux_joueur(scene, joueur1, {
      vie: { x: MARGE, y: MARGE },
      balles: { x: xDroite, y: MARGE },
      score: { x: xDroite, y: MARGE + H_STAT + ECART }
    }, COULEUR_J1, TEXTE_J1, null, "pv_bar");
    objetsSolo.push(...j1.objets);
    j1.objets = []; // plus rien pour la caméra de gauche
  }

  // éléments communs, au centre de l'écran
  const objets = [];
  const xc = 640 - L_CENTRE / 2;
  objets.push(panneau(scene, xc, MARGE, L_CENTRE, H_VIE, BORD_NEUTRE));
  objets.push(icone(scene, xc + 20, MARGE + H_VIE / 2, "timer_icone", TAILLE_ICONE));
  const temps = texte(scene, xc + L_CENTRE - 20, MARGE + H_VIE / 2, formater_temps(valeurs.temps), 42, TEXTE_CLAIR, [1, 0.5]);
  objets.push(temps);

  const yCles = MARGE + H_VIE + ECART;
  const objetsCles = [];
  objetsCles.push(panneau(scene, xc, yCles, L_CENTRE, H_STAT, BORD_NEUTRE));
  objetsCles.push(icone(scene, xc + 22, yCles + H_STAT / 2, "nombre_cle_icone", TAILLE_ICONE));
  const cles = texte(scene, xc + L_CENTRE - 20, yCles + H_STAT / 2, String(valeurs.cles), 36, COULEUR_CLES, [1, 0.5]);
  objetsCles.push(cles);

  return {
    j1,
    j2,
    commun: { objets: [...objets, ...objetsCles, ...objetsSolo], objetsCles, temps, cles }
  };
}

// 90 -> "1:30"
export function formater_temps(secondes) {
  const s = Math.max(0, secondes);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

// met à jour le timer ; passe en rouge sous 15 secondes
export function maj_timer(texteTimer, secondes) {
  texteTimer.setText(formater_temps(secondes));
  texteTimer.setColor(secondes <= 15 ? COULEUR_ALERTE : TEXTE_CLAIR);
}

export const COULEURS_HUD = { balles: COULEUR_BALLES };