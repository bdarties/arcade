export const CATEGORIES = {
  attaque: { nom: "Attaque", couleur: 0xff8a3d },
  heros: { nom: "Héros", couleur: 0x6fd6ff }
};

export const BIENFAITS = {
  force_de_thor: {
    nom: "Force de Thor", categorie: "attaque", niveauMax: 99, valeur: 2,
    texte: "+{v} dégâts pour votre attaque.",
    appliquer: (scene, joueur, v) => { joueur.arme.degats += v; }
  },
  zenith: {
    nom: "Zénith", categorie: "attaque", niveauMax: 5, valeur: 6,
    texte: "+{v} % de chances de coup critique (dégâts x2).",
    appliquer: (scene, joueur, v) => { joueur.stats.critique += v / 100; }
  },
  fureur_des_ases: {
    nom: "Fureur des Ases", categorie: "attaque", niveauMax: 5, valeur: 8,
    texte: "+{v} % de vitesse d'attaque.",
    appliquer: (scene, joueur, v) => { joueur.stats.recharge *= 1 - v / 100; }
  },
  lame_d_helios: {
    nom: "Lame d'Hélios", categorie: "attaque", niveauMax: 5, valeur: 12,
    texte: "+{v} % de portée pour votre attaque.",
    appliquer: (scene, joueur, v) => { joueur.stats.portee += v / 100; }
  },
  tourbillon_de_mjollnir: {
    nom: "Tourbillon de Mjöllnir", categorie: "attaque", requiert: "epee", niveauMax: 3, valeur: 1,
    texte: "Chaque coup d'épée frappe aussi dans {v} autre(s) direction(s).",
    appliquer: (scene, joueur, v) => { joueur.stats.coupsEpee += Math.round(v); }
  },
  canalisation: {
    nom: "Canalisation", categorie: "attaque", requiert: "baton", niveauMax: 4, valeur: 1,
    texte: "Votre bâton lance {v} flamme(s) de plus à chaque sort.",
    appliquer: (scene, joueur, v) => { joueur.arme.nombre += Math.round(v); }
  },

  barque_solaire: {
    nom: "Barque solaire", categorie: "heros", niveauMax: 5, valeur: 8,
    texte: "+{v} % de vitesse de déplacement.",
    appliquer: (scene, joueur, v) => { joueur.stats.vitesse *= 1 + v / 100; }
  },
  ailes_d_isis: {
    nom: "Ailes d'Isis", categorie: "heros", niveauMax: 5, valeur: 20,
    texte: "+{v} PV max.",
    appliquer: (scene, joueur, v) => { joueur.stats.pvMax += v; joueur.pv += v; }
  },
  souffle_de_vie: {
    nom: "Souffle de vie", categorie: "heros", niveauMax: 5, valeur: 0.6,
    texte: "+{v} PV régénérés par seconde.",
    appliquer: (scene, joueur, v) => { joueur.stats.regeneration += v; }
  }
};
