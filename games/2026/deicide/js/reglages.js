// reglages.js : les réglages du joueur (volume de la musique, volume des bruitages, luminosité), modifiés dans le menu pause (pause.js)
// Ils sont gardés dans le navigateur (localStorage) : ils se retrouvent à la partie suivante. Si le navigateur refuse (mode privé...), ils tiennent juste jusqu'à la fermeture.

const CLE = "deicide_reglages"; // nom sous lequel les réglages sont rangés dans le navigateur
export const VOLUME_MAX = 10; // les volumes vont de 0 à 10 : 10 = le volume prévu à l'origine (on ne peut pas faire plus fort)
export const LUMINOSITE_MAX = 5; // la luminosité va de 1 (sombre) à 5 (clair)
const PAR_DEFAUT = { musique: VOLUME_MAX, effets: VOLUME_MAX, luminosite: 3 }; // luminosité 3 = le gris 0x99 réglé pour le jeu

export const reglages = { ...PAR_DEFAUT }; // l'objet partagé par tout le jeu : sons.js et lumiere.js le lisent à chaque fois
try {
    const sauve = JSON.parse(localStorage.getItem(CLE) || "{}"); // ce qui a été rangé à la dernière partie
    Object.keys(PAR_DEFAUT).forEach((nom) => { if (Number.isInteger(sauve[nom])) reglages[nom] = sauve[nom]; }); // on ne reprend que les réglages valides
    reglages.musique = Math.min(Math.max(reglages.musique, 0), VOLUME_MAX); // et on les remet dans leurs limites au cas où le fichier ait été modifié
    reglages.effets = Math.min(Math.max(reglages.effets, 0), VOLUME_MAX);
    reglages.luminosite = Math.min(Math.max(reglages.luminosite, 1), LUMINOSITE_MAX);
} catch (erreur) { /* pas de localStorage : on garde les valeurs par défaut */ }

export function changerReglage(nom, valeur) { // change un réglage et le range dans le navigateur
    reglages[nom] = valeur;
    try { localStorage.setItem(CLE, JSON.stringify(reglages)); } catch (erreur) { /* pas de localStorage : tant pis, le réglage tient jusqu'à la fermeture */ }
}
