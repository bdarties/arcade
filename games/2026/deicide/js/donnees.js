// Stockage JSON libre par jeu.
//   await lireDonneesJSON()      -> la valeur stockée (null si rien)
//   await ecrireDonneesJSON(obj) -> true si écrit (base ou localStorage)
// Sur la borne, les données vont dans la base, sous le nom du répertoire du jeu.
// Si la base est injoignable (jeu développé en local), localStorage prend le relais.
// Hors borne : copier ce fichier dans le jeu (ex. js/donnees.js) et, tout en haut de index.js :
//   import "./js/donnees.js";
// Sur la borne ce même import est sans effet : la première version chargée l'emporte,
// il n'y a donc aucun conflit avec la copie globale de /static/js/donnees.js.
(function () {
  if (window.lireDonneesJSON && window.ecrireDonneesJSON) return;

  function gameId() {
    if (window.GAME_ID) return window.GAME_ID;
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length && parts[parts.length - 1].includes(".")) parts.pop();
    return parts.length ? decodeURIComponent(parts[parts.length - 1]) : "jeu";
  }

  const cleLocale = () => "arcade_donnees_" + gameId();
  const urlApi = () => "/api/donnees/" + encodeURIComponent(gameId());

  window.lireDonneesJSON = async function () {
    try {
      const response = await fetch(urlApi());
      if (!response.ok) throw new Error("HTTP " + response.status);
      return await response.json();
    } catch (error) {
      console.warn("Base indisponible, lecture dans localStorage :", error.message);
      try {
        const brut = localStorage.getItem(cleLocale());
        return brut === null ? null : JSON.parse(brut);
      } catch (e) {
        return null;
      }
    }
  };

  window.ecrireDonneesJSON = async function (donnees) {
    const corps = JSON.stringify(donnees);
    try {
      const response = await fetch(urlApi(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: corps,
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      return true;
    } catch (error) {
      console.warn("Base indisponible, écriture dans localStorage :", error.message);
      try {
        localStorage.setItem(cleLocale(), corps);
        return true;
      } catch (e) {
        console.error("Écriture impossible :", e);
        return false;
      }
    }
  };
})();
