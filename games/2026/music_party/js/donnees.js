// Sur la borne, les fonctions officielles sont déjà fournies par la page.
// Sur PC, même interface avec le localStorage, comme dans la notice.
if (typeof window.lireDonneesJSON !== "function" && typeof window.ecrireDonneesJSON !== "function") {
  var morceaux = window.location.pathname.split("/").filter(Boolean);
  if (morceaux.length && morceaux[morceaux.length - 1].includes(".")) morceaux.pop();
  var cle = "arcade_donnees_" + (morceaux.pop() || "music_party_design");

  window.lireDonneesJSON = async function () {
    return JSON.parse(localStorage.getItem(cle));
  };

  window.ecrireDonneesJSON = async function (donnees) {
    localStorage.setItem(cle, JSON.stringify(donnees));
  };
}
