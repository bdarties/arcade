const temps = (...hauteurs) => hauteurs.map((h) => [h, 1]);
const SILENCE = [null, 1];

export const NIVEAUX = [
  {
    // niveau 1 : lent, peu de touches
    titre: "Ode à la joie",
    auteur: "Beethoven",
    tempo: 85,
    touches: [72, 74, 76, 77, 79, 81],
    notes: [
      ...temps(76, 76, 77, 79, 79, 77, 76, 74, 72, 72, 74, 76, 76, 74, 74),
      SILENCE,
      ...temps(76, 76, 77, 79, 79, 77, 76, 74, 72, 72, 74, 76, 74, 72, 72),
      SILENCE
    ]
  },
  {
    // niveau 2 : tempo moyen, les notes se répètent plus souvent
    titre: "Guillaume Tell",
    auteur: "Rossini",
    tempo: 100,
    touches: [67, 71, 72, 74, 76, 79],
    notes: [
      ...temps(67, 67, 67, 67, 67, 67, 67, 67, 72, 74, 76),
      SILENCE,
      ...temps(67, 67, 67, 67, 67, 72, 76, 74, 71, 67),
      SILENCE,
      ...temps(67, 67, 67, 67, 67, 67, 67, 67, 72, 74, 76),
      SILENCE,
      ...temps(72, 76, 79, 76, 74, 72),
      SILENCE
    ]
  },
  {
    // niveau 3 : rapide, le plus dur à suivre
    titre: "French Cancan",
    auteur: "Offenbach",
    tempo: 115,
    touches: [72, 74, 76, 77, 79, 81],
    notes: [
      ...temps(72, 74, 77, 76, 74, 79, 79, 79, 81, 76, 77, 74, 74, 74, 77, 76, 74, 72, 79, 74, 76, 72),
      SILENCE
    ]
  }
];
