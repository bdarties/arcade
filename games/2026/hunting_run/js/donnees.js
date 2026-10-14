/*
  Copie de secours de donnees.js pour tester le jeu sur ordinateur.
  Sur la borne, la page charge sa propre version : ce fichier est alors ignoré.
  lireDonneesJSON() -> renvoie les données sauvegardées (null si rien)
  ecrireDonneesJSON(data) -> sauvegarde (remplace tout)
  En local : stocké dans le localStorage, clé  arcade_donnees_<nom du dossier du jeu>
*/

(function () {
  if (typeof window.lireDonneesJSON === "function" && typeof window.ecrireDonneesJSON === "function") return;

  // nom du dossier du jeu = dernier "dossier" de l'adresse (ex. /hunting_run/index.html -> hunting_run)
  const morceaux = decodeURIComponent(location.pathname).split("/").filter((m) => m && !m.includes("."));
  const cle = "arcade_donnees_" + (morceaux.pop() || "jeu");

  window.lireDonneesJSON = async function () {
    try {
      const texte = localStorage.getItem(cle);
      return texte === null ? null : JSON.parse(texte);
    } catch (e) {
      return null;
    }
  };

  window.ecrireDonneesJSON = async function (donnees) {
    localStorage.setItem(cle, JSON.stringify(donnees));
  };
})();
