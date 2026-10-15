// ============================================================================
// VERSUS : les arènes (registre + chargement + construction)
//
// Une arène = 1 carte Tiled (assets/versus/arene_xxx.json) + 1 tileset + 1 ou 2 images de fond.
// POUR AJOUTER UNE ARÈNE : créer sa carte dans Tiled, puis ajouter UNE entrée dans ARENES ci-dessous.
//
// Règles de la carte Tiled (taille conseillée : 40 x 22 tuiles de 32 px = 1280 x 704) :
//   calque de tuiles "decor" : décor derrière les joueurs (aucune collision)
//   calque de tuiles "sol"   : tout ce qui est solide (toute tuile non vide)
//   calque de tuiles "eau"   : (facultatif) dessiné DEVANT les joueurs (eau, brume...)
//   calque d'objets "spawn"  : 2 POINTS nommés  j1  et  j2  (le point = les pieds du joueur)
//                              propriété facultative  regarde_droite (booléen)
// ============================================================================

// ---- tilesets (le "nom" doit être celui du tileset dans la carte Tiled) ------
const TILESETS = {
  jeu: { nom: "tuilesJeu", cle: "versus_tuiles_jeu", fichier: "./assets/tuilesJeu.png" },
  grenier: { nom: "greniertile", cle: "versus_tuiles_grenier", fichier: "./assets/greniertile.png" }
};

// ---- images de fond ----------------------------------------------------------
const FONDS = {
  ciel: { cle: "versus_fond_ciel", fichier: "./assets/sky.png" },
  batiments: { cle: "versus_fond_batiments", fichier: "./assets/batiments.png" },
  grenier: { cle: "versus_fond_grenier", fichier: "./assets/fondgrenier.png" }
};

// ---- LES ARÈNES --------------------------------------------------------------
// fonds        : images empilées dans cet ordre (la 1re est tout derrière)
// traversables : numéros de tuiles (dans le tileset, comme affichés dans Tiled) qui sont des
//                plateformes "à sens unique" : on les traverse par le dessous, on se pose dessus
export const ARENES = [
  {
    id: "toits",
    nom: "TOITS DE PARIS",
    carte: "./assets/versus/arene_toits.json",
    tileset: "jeu",
    fonds: ["ciel"],
    traversables: [4, 5, 6, 8, 9, 26]
  },
  {
    id: "quais",
    nom: "LES QUAIS",
    carte: "./assets/versus/arene_quais.json",
    tileset: "jeu",
    fonds: ["ciel", "batiments"],
    traversables: [4, 5, 6, 8, 9, 26]
  },
  {
    id: "grenier_scene",
    nom: "LE GRENIER - LA SCÈNE",
    carte: "./assets/versus/arene_grenier_scene.json",
    tileset: "grenier",
    fonds: ["grenier"],
    traversables: [30, 31, 32, 40, 41, 42]
  },
  {
    id: "grenier_etageres",
    nom: "LE GRENIER - LES ÉTAGÈRES",
    carte: "./assets/versus/arene_grenier_etageres.json",
    tileset: "grenier",
    fonds: ["grenier"],
    traversables: [30, 31, 32, 40, 41, 42]
  }
];

const cleCarte = (arene) => "versus_carte_" + arene.id;

// ============================================================================
//  CHARGEMENT : à appeler dans preload() de VersusScene
//  (Phaser ignore automatiquement une clé déjà chargée : pas de doublon)
// ============================================================================
export function chargerAssetsArenes(scene) {
  ARENES.forEach((a) => {
    scene.load.tilemapTiledJSON(cleCarte(a), a.carte);
    const ts = TILESETS[a.tileset];
    scene.load.image(ts.cle, ts.fichier);
    a.fonds.forEach((f) => scene.load.image(FONDS[f].cle, FONDS[f].fichier));
  });
}

// ============================================================================
//  CONSTRUCTION : crée l'arène numéro `index` et renvoie
//  { def, solides, spawns: [{x, y, droite}, {x, y, droite}], limiteBas, objets }
//  - solides : le calque de collision (utilisable dans physics.add.collider)
//  - spawns  : positions du CENTRE des sprites (y déjà corrigé), prêtes à l'emploi
//  - objets  : tout ce qu'il faudra détruire quand on quitte l'arène
// ============================================================================
export function construireArene(scene, index) {
  const def = ARENES[index];
  const ts = TILESETS[def.tileset];
  const largeur = scene.cameras.main.width;
  const hauteur = scene.cameras.main.height;
  const objets = [];

  // ---- carte : collée en bas de l'écran (22 lignes = 704 px, le reste est couvert par le fond) ----
  const map = scene.make.tilemap({ key: cleCarte(def) });
  const tileset = map.addTilesetImage(ts.nom, ts.cle);
  const decalageY = hauteur - map.heightInPixels;
  objets.push(map);

  // ---- fonds : chacun agrandi pour couvrir tout l'écran (comme "cover" en CSS), fixes ----
  def.fonds.forEach((f, i) => {
    const img = scene.add.image(largeur / 2, hauteur / 2, FONDS[f].cle).setDepth(-20 + i);
    img.setScale(Math.max(largeur / img.width, hauteur / img.height)).setScrollFactor(0);
    objets.push(img);
  });

  // ---- calques ----
  const decor = map.getLayer("decor") ? map.createLayer("decor", tileset, 0, decalageY) : null;
  if (decor) objets.push(decor.setDepth(-5));

  const solides = map.createLayer("sol", tileset, 0, decalageY).setDepth(-1);
  solides.setCollisionByExclusion([-1, 0]); // toute tuile non vide est solide
  objets.push(solides);

  // plateformes à sens unique : seule la face du dessus bloque
  const gidTraversables = def.traversables.map((id) => id + tileset.firstgid);
  solides.forEachTile((t) => {
    if (gidTraversables.includes(t.index)) t.setCollision(false, false, true, false);
  });

  if (map.getLayer("eau")) objets.push(map.createLayer("eau", tileset, 0, decalageY).setDepth(10)); // devant les joueurs

  // ---- points de départ (objets "j1" et "j2" du calque "spawn") ----
  const calque = map.getObjectLayer("spawn");
  const spawns = ["j1", "j2"].map((nom, i) => {
    const o = calque && calque.objects.find((p) => p.name === nom);
    if (!o) throw new Error(`Arène "${def.id}" : point "${nom}" manquant dans le calque d'objets "spawn"`);
    const prop = o.properties && o.properties.find((p) => p.name === "regarde_droite");
    return {
      x: o.x,
      y: o.y + decalageY - 33, // les pieds sont posés sur le point (sprite de 64 px, centré) + 1 px de marge
      droite: prop ? prop.value : i === 0
    };
  });

  return { def, solides, spawns, limiteBas: hauteur, objets };
}

// détruit tout ce que l'arène a créé (à appeler APRÈS avoir retiré les colliders)
export function detruireArene(arene) {
  arene.objets.forEach((o) => o.destroy());
  arene.objets = [];
}

// ============================================================================
//  ORDRE DES ARÈNES
//  `ordre` est la liste des arènes jouées dans l'ordre des manches (tableau d'index).
//  On l'allonge au besoin : une nouvelle "série" contient chaque arène une fois
//  (mélangée si mode "aleatoire") et ne commence jamais par l'arène qui vient de finir.
// ============================================================================
export function etendreOrdre(ordre, nbManches, mode, nbArenes = ARENES.length, hasard = Math.random) {
  while (ordre.length < nbManches) {
    let serie = [...Array(nbArenes).keys()];
    if (mode === "aleatoire") {
      for (let i = serie.length - 1; i > 0; i--) {
        const j = Math.floor(hasard() * (i + 1));
        [serie[i], serie[j]] = [serie[j], serie[i]];
      }
      const derniere = ordre[ordre.length - 1];
      if (nbArenes > 1 && serie[0] === derniere) serie.push(serie.shift()); // évite deux fois la même de suite
    }
    ordre.push(...serie);
  }
  return ordre;
}
