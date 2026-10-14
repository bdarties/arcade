import * as fct from "./fonctions.js";
import * as pierres from "./pierres.js";
import * as ennemis from "./ennemis.js";
import * as biomes from "./biomes.js";

/***********************************************************************/
/** TUTORIEL : un niveau guidé (niveau1.js lancé avec { tuto: true }, un seul joueur)
/** une bulle de consigne suit le joueur ; elle passe à la consigne suivante quand l'action est faite
/** les lettres des boutons sont celles inscrites sur la borne (ETIQUETTES dans fonctions.js)
/***********************************************************************/

const COULEUR_CADRE = 0xec8697; // rose de la palette (comme la bulle de la statue, cf. offrande.js)
const COULEUR_REUSSI = 0x8ce99a;
const LARGEUR_TEXTE = 300; // px
const MARGE = 14; // px autour du texte, dans la bulle
const HAUTEUR_QUEUE = 12; // px : la petite pointe qui montre le joueur
const DECALAGE_BULLE = 40; // px : la pointe est à cette hauteur au-dessus du centre du joueur
const DELAI_REUSSITE = 500; // ms : le cadre reste vert avant la consigne suivante
const DELAI_AVANT_SORTIE = 900; // ms : après la dernière consigne, on laisse le temps de lire
const DISTANCE_A_PARCOURIR = 150; // px (étape 1)
const STAMINA_SPRINT = 90; // la stamina est à 100 au repos : sous cette valeur, le joueur a sprinté
const PV_MINI = 40; // le joueur ne meurt pas dans le tutoriel : il est soigné sous ce seuil

const lettre = (action) => fct.ETIQUETTES[action];

// les consignes, dans l'ordre
// debut : prépare l'étape ; fait : vrai quand l'action est réalisée ; cible : ce que la flèche désigne (ou rien)
const ETAPES = [
  {
    texte: () => "Joystick : déplace-toi",
    debut: (scene, t, j) => { t.distance = 0; },
    fait: (scene, t) => t.distance >= DISTANCE_A_PARCOURIR
  },
  {
    texte: () => "Joystick + bouton " + lettre("sprint") + " : sprint\n(la barre de stamina descend)",
    fait: (scene, t, j) => j.stamina < STAMINA_SPRINT
  },
  {
    texte: () => "Bouton " + lettre("frapper_tirer") + " : frappe le caillou\navec la pioche",
    debut: (scene, t, j) => {
      const place = trouverPlace(scene, j, 90, 170);
      const modele = scene.cailloux.getChildren()[0];
      t.caillou = scene.creerCaillou({ x: place.x, y: place.y, image: biomes.cailloux(biomes.biomeDuNiveau(scene.niveau))[0].cle, coups_restants: modele?.coups_restants ?? 3 });
      t.caillou.tuto = true; // il lâche à coup sûr une pierre (cf. frapper dans niveau1.js)
    },
    fait: (scene, t) => !t.caillou.active,
    cible: (scene, t) => (t.caillou.active ? t.caillou : null)
  },
  {
    texte: () => "Approche-toi de la pierre lunaire\npour la ramasser",
    debut: (scene, t) => { t.pierres_debut = pierres.nombrePierres(scene); },
    fait: (scene, t) => pierres.nombrePierres(scene) > t.pierres_debut,
    cible: (scene, t, j) => pierreLaPlusProche(scene, j)
  },
  {
    texte: () => "Bouton " + lettre("changer_equipement") + " : prends le laser",
    fait: (scene, t, j) => j.equipement === "laser"
  },
  {
    texte: () => "Bouton " + lettre("frapper_tirer") + " : tire au laser",
    fait: (scene) => scene.projectiles.getLength() > 0
  },
  {
    texte: () => "Un ennemi arrive !\nPioche ou laser, élimine-le",
    debut: (scene, t, j) => {
      const place = trouverPlace(scene, j, 220, 320);
      t.ennemi = ennemis.creerEnnemi(scene, "slime", place.x, place.y);
      t.ennemi.alerte = true; // il fonce sur le joueur dès le début
    },
    fait: (scene, t) => !t.ennemi.active,
    cible: (scene, t) => (t.ennemi.active ? t.ennemi : null)
  }
];

// étape de fin, hors de la liste : elle n'a pas d'action à valider
const texteFin = () => "Tutoriel terminé\nBouton " + lettre("frapper_tirer") + " : retour au menu";

// crée la bulle de consigne et la flèche, et lance la première étape
export function creerTutoriel(scene) {
  const profondeur = fct.PROFONDEUR.obscurite + 0.5; // au-dessus du noir, comme l'indication des échelles
  const fond = scene.add.graphics();
  const texte = scene.add.text(0, 0, "", { fontFamily: fct.POLICES.texte, fontSize: "18px", color: "#E8EBF0", align: "center", wordWrap: { width: LARGEUR_TEXTE } }).setOrigin(0.5, 0);
  const compteur = scene.add.text(0, 0, "", { fontFamily: fct.POLICES.texte, fontSize: "14px", color: "#BFC3CC" }).setOrigin(0.5, 0);
  const bulle = scene.add.container(0, 0, [fond, texte, compteur]).setDepth(profondeur);
  const fleche = scene.add.triangle(0, 0, 0, 0, 16, 0, 8, 11, 0xffffff).setDepth(profondeur).setVisible(false);

  scene.tuto_etat = {
    etape: -1, // -1 : pas commencé ; ETAPES.length : consigne de fin
    attente_jusqua: 0, // > maintenant : l'étape est réussie, son cadre est vert
    sortie: false,
    bouton_etait_bas: true, // le bouton qui a validé le menu est peut-être encore enfoncé
    precedent: null,
    distance: 0,
    ui: { fond: fond, texte: texte, compteur: compteur, bulle: bulle, fleche: fleche }
  };
  commencerEtape(scene, 0);
}

// affiche la consigne de l'étape et la prépare
function commencerEtape(scene, numero) {
  const t = scene.tuto_etat;
  const j = scene.joueurs[0];
  t.etape = numero;
  t.attente_jusqua = 0;
  if (numero < ETAPES.length) {
    ETAPES[numero].debut?.(scene, t, j);
    afficher(scene, ETAPES[numero].texte(), (numero + 1) + " / " + (ETAPES.length + 1), COULEUR_CADRE);
  } else {
    afficher(scene, texteFin(), (ETAPES.length + 1) + " / " + (ETAPES.length + 1), COULEUR_REUSSI);
    t.fin_a = scene.time.now;
  }
}

// écrit le texte dans la bulle et redessine son cadre à la bonne taille
function afficher(scene, message, rang, couleur) {
  const { fond, texte, compteur } = scene.tuto_etat.ui;
  texte.setText(message);
  compteur.setText(rang);
  const largeur = Math.max(texte.width, compteur.width) + 2 * MARGE;
  const hauteur = texte.height + compteur.height + 2 * MARGE + 4;
  const bas = -HAUTEUR_QUEUE; // le bas du rectangle ; la pointe touche y = 0
  fond.clear();
  fond.fillStyle(0x111a32, 0.94);
  fond.lineStyle(3, couleur);
  fond.fillRoundedRect(-largeur / 2, bas - hauteur, largeur, hauteur, 14);
  fond.strokeRoundedRect(-largeur / 2, bas - hauteur, largeur, hauteur, 14);
  fond.fillTriangle(-9, bas, 9, bas, 0, 0);
  fond.lineBetween(-9, bas, 0, 0);
  fond.lineBetween(9, bas, 0, 0);
  texte.setPosition(0, bas - hauteur + MARGE);
  compteur.setPosition(0, bas - MARGE - compteur.height);
}

// chaque image (cf. update de niveau1.js) : suit le joueur, valide l'étape, passe à la suivante
export function majTutoriel(scene) {
  const t = scene.tuto_etat;
  const j = scene.joueurs[0];
  const maintenant = scene.time.now;
  const { bulle, fleche } = t.ui;

  // distance parcourue (étape 1)
  if (t.precedent) t.distance += Phaser.Math.Distance.Between(t.precedent.x, t.precedent.y, j.sprite.x, j.sprite.y);
  t.precedent = { x: j.sprite.x, y: j.sprite.y };

  // personne ne meurt dans le tutoriel
  if (j.pv < PV_MINI) scene.soigner(j, 100);

  // la bulle flotte au-dessus du joueur
  bulle.setPosition(j.sprite.x, j.sprite.y - DECALAGE_BULLE + Math.sin(maintenant / 300) * 2);

  // la flèche désigne l'objet de l'étape (caillou, pierre, ennemi)
  const etape = ETAPES[t.etape];
  const cible = etape?.cible?.(scene, t, j);
  if (cible && maintenant >= t.attente_jusqua) {
    fleche.setPosition(cible.x, cible.y - 46 + Math.sin(maintenant / 180) * 3).setVisible(true);
  } else {
    fleche.setVisible(false);
  }

  const bas = j.touches.frapper_tirer.isDown; // le niveau lit déjà JustDown de ce bouton : on suit l'état nous-mêmes
  const vient_d_appuyer = bas && !t.bouton_etait_bas;
  t.bouton_etait_bas = bas;

  // dernière consigne : un appui sur le bouton ramène au menu
  if (t.etape >= ETAPES.length) {
    if (vient_d_appuyer && !t.sortie && maintenant - t.fin_a > DELAI_AVANT_SORTIE) sortir(scene);
    return;
  }

  // cadre vert un instant, puis la consigne suivante
  if (t.attente_jusqua > 0) {
    if (maintenant >= t.attente_jusqua) commencerEtape(scene, t.etape + 1);
    return;
  }

  if (etape.fait(scene, t, j)) {
    // pas de félicitation : seul le cadre passe au vert un instant, puis la consigne suivante arrive
    t.attente_jusqua = maintenant + DELAI_REUSSITE;
    afficher(scene, etape.texte(), (t.etape + 1) + " / " + (ETAPES.length + 1), COULEUR_REUSSI);
  }
}

// fondu puis retour au menu principal
function sortir(scene) {
  scene.tuto_etat.sortie = true;
  /* >>>>> AJOUT SON <<<<< */ scene.sound.play("son_touche_sortant"); // on quitte la page du tutoriel
  scene.fondu();
  scene.cameras.main.once("camerafadeoutcomplete", () => {
    scene.quitterPartie(); // arrête la musique du niveau
    scene.scene.start("menu");
  });
}

// la pierre lunaire (ou n'importe quel objet lâché) la plus proche du joueur
function pierreLaPlusProche(scene, j) {
  let proche = null;
  let distance = Infinity;
  scene.butin.forEach((objet) => {
    const d = Phaser.Math.Distance.Between(objet.x, objet.y, j.sprite.x, j.sprite.y);
    if (d < distance) { distance = d; proche = objet; }
  });
  return proche;
}

// une case de sol libre entre mini et maxi px du joueur : ni mur sur la case ou ses voisines, ni caillou ni cristal tout près
function trouverPlace(scene, j, mini, maxi) {
  const libre = (tx, ty) => scene.calque_sol.hasTileAt(tx, ty) && !scene.calque_murs.hasTileAt(tx, ty);
  const cases = scene.calque_sol.filterTiles((tuile) => {
    const x = tuile.getCenterX();
    const y = tuile.getCenterY();
    const d = Phaser.Math.Distance.Between(x, y, j.sprite.x, j.sprite.y);
    if (d < mini || d > maxi) return false;
    if (![[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => libre(tuile.x + dx, tuile.y + dy))) return false;
    return scene.cailloux.getChildren().every((c) => Phaser.Math.Distance.Between(x, y, c.x, c.y) >= 48) &&
      scene.cristaux.every((c) => Phaser.Math.Distance.Between(x, y, c.x, c.y) >= 64);
  });
  if (cases.length === 0) return { x: j.sprite.x + mini, y: j.sprite.y }; // secours : aucune case convenable
  const tuile = Phaser.Utils.Array.GetRandom(cases);
  return { x: tuile.getCenterX(), y: tuile.getCenterY() };
}
