const TILESETS = {
  jeu: { nom: "tuilesJeu", cle: "versus_tuiles_jeu", fichier: "./assets/tuilesJeu.png" },
  grenier: { nom: "greniertile", cle: "versus_tuiles_grenier", fichier: "./assets/greniertile.png" }
};

const FONDS = {
  ciel: { cle: "versus_fond_ciel", fichier: "./assets/sky.png" },
  batiments: { cle: "versus_fond_batiments", fichier: "./assets/batiments.png" },
  grenier: { cle: "versus_fond_grenier", fichier: "./assets/fondgrenier.png" }
};

// Chaque entrée relie une carte Tiled à son tileset, ses fonds et ses plateformes traversables.
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

// Charge les cartes, tilesets et fonds de chaque arène déclarée.
export function chargerAssetsArenes(scene) {
  ARENES.forEach((a) => {
    scene.load.tilemapTiledJSON(cleCarte(a), a.carte);
    const ts = TILESETS[a.tileset];
    scene.load.image(ts.cle, ts.fichier);
    a.fonds.forEach((f) => scene.load.image(FONDS[f].cle, FONDS[f].fichier));
  });
}

// Construit une arène et renvoie ses plateformes, apparences et points de départ.
export function construireArene(scene, index) {
  const def = ARENES[index];
  const ts = TILESETS[def.tileset];
  const largeur = scene.cameras.main.width;
  const hauteur = scene.cameras.main.height;
  const objets = [];

  const map = scene.make.tilemap({ key: cleCarte(def) });
  const tileset = map.addTilesetImage(ts.nom, ts.cle);
  const decalageY = hauteur - map.heightInPixels;
  objets.push(map);

  def.fonds.forEach((f, i) => {
    const img = scene.add.image(largeur / 2, hauteur / 2, FONDS[f].cle).setDepth(-20 + i);
    img.setScale(Math.max(largeur / img.width, hauteur / img.height)).setScrollFactor(0);
    objets.push(img);
  });

  const decor = map.getLayer("decor") ? map.createLayer("decor", tileset, 0, decalageY) : null;
  if (decor) objets.push(decor.setDepth(-5));

  const solides = map.createLayer("sol", tileset, 0, decalageY).setDepth(-1);
  solides.setCollisionByExclusion([-1, 0]);
  objets.push(solides);

  // Ces tuiles laissent passer les joueurs par-dessous et les retiennent par-dessus.
  const gidTraversables = def.traversables.map((id) => id + tileset.firstgid);
  solides.forEachTile((t) => {
    if (gidTraversables.includes(t.index)) t.setCollision(false, false, true, false);
  });

  if (map.getLayer("eau")) objets.push(map.createLayer("eau", tileset, 0, decalageY).setDepth(10));

  const calque = map.getObjectLayer("spawn");
  // Chaque arène fournit deux points de spawn nommés j1 et j2, positionnés au niveau des pieds.
  const spawns = ["j1", "j2"].map((nom, i) => {
    const o = calque && calque.objects.find((p) => p.name === nom);
    if (!o) throw new Error(`Arène "${def.id}" : point "${nom}" manquant dans le calque d'objets "spawn"`);
    const prop = o.properties && o.properties.find((p) => p.name === "regarde_droite");
    return {
      x: o.x,
      y: o.y + decalageY - 33,
      droite: prop ? prop.value : i === 0
    };
  });

  return { def, solides, spawns, limiteBas: hauteur, objets };
}

// Détruit les objets graphiques de l'arène avant de charger la suivante.
export function detruireArene(arene) {
  arene.objets.forEach((o) => o.destroy());
  arene.objets = [];
}

// Étend le calendrier des manches sans répéter une arène au début d'une série.
export function etendreOrdre(ordre, nbManches, mode, nbArenes = ARENES.length, hasard = Math.random) {
  while (ordre.length < nbManches) {
    let serie = [...Array(nbArenes).keys()];
    if (mode === "aleatoire") {
      for (let i = serie.length - 1; i > 0; i--) {
        const j = Math.floor(hasard() * (i + 1));
        [serie[i], serie[j]] = [serie[j], serie[i]];
      }
      const derniere = ordre[ordre.length - 1];
      if (nbArenes > 1 && serie[0] === derniere) serie.push(serie.shift());
    }
    ordre.push(...serie);
  }
  return ordre;
}
