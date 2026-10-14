export const FONT = "Arial, sans-serif";
export const ACTION_KEYS = ["x", "k", "f", "enter", " "];

export function titre(scene, texte) {
  scene.add.text(640, 70, texte, { fontFamily: FONT, fontSize: "44px", color: "#ffffff" }).setOrigin(0.5);
}

// Les données sont une liste [{prenom, nom, score}, ...] stockée en un seul JSON
export async function lireListe() {
  const donnees = await window.lireDonneesJSON();
  return Array.isArray(donnees) ? donnees : [];
}

export async function ajouterEntree(entree) {
  const liste = await lireListe();
  liste.push(entree);
  return window.ecrireDonneesJSON(liste);
}
