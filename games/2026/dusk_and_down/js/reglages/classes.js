export const CLASSES = {
  chevalier: {
    nom: "Chevalier",
    description: "Frappe au corps à corps en arc de cercle. Robuste.",
    texture: "chevalier",
    regardeAGauche: true,
    origineY: 0.94,
    hauteurTete: 45,
    rayonCorps: 10,
    pvMax: 110,
    vitesse: 150,
    armure: 1,
    regeneration: 0,
    rayonCollecte: 80,
    armeDeBase: "epee",
    notes: { vie: 4, portee: 2, vitesse: 3 }
  },
  mage: {
    nom: "Mage",
    description: "Lance des flammes sur l'ombre la plus proche. Fragile.",
    texture: "mage",
    regardeAGauche: true,
    origineY: 0.65,
    hauteurTete: 44,
    rayonCorps: 10,
    pvMax: 80,
    vitesse: 155,
    armure: 0,
    regeneration: 0,
    rayonCollecte: 95,
    armeDeBase: "baton",
    notes: { vie: 2, portee: 5, vitesse: 3 }
  }
};
