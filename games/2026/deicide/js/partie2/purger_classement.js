// PARTIE 2 : nous ne souhaitons pas soumettre cette partie du code à l'évaluation. Nous ne présentons que la partie 1 (js/partie1/).
// La partie 2 est uniquement présente pour améliorer la rejouabilité du jeu sur la borne (un jeu plus difficile et plus de contenu), suite à la demande
// de Nicolas Maurin. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// purger_classement.js : retire du classement de la borne (le panthéon) les lignes de test faites avec certains noms.
// Le panthéon n'est pas dans le dépôt : il est rangé dans la base de la borne (ou dans le navigateur hors borne). Ce fichier le nettoie donc quand le jeu se charge :
// la première fois que cette version tourne sur la borne, les lignes concernées disparaissent. Les fois suivantes, il n'y a plus rien à retirer.
// Pour ne pas retirer plus tard un vrai joueur qui aurait choisi le même nom, on ne retire que les lignes enregistrées jusqu'à DATE_LIMITE (la date de la fusion).

const NOMS_A_RETIRER = ["MOQUET", "MA", "OWEN", "DEVELD"]; // les noms des lignes à retirer (le panthéon écrit les noms en majuscules)
const DATE_LIMITE = "2026-10-15"; // les lignes enregistrées après cette date ne sont jamais retirées (format année-mois-jour, comme dans le panthéon)

export async function purgerClassement() { // à appeler une fois au chargement du jeu
    if (typeof lireDonneesJSON !== "function" || typeof ecrireDonneesJSON !== "function") return; // la sauvegarde (js/donnees.js) n'est pas chargée : rien à faire
    try {
        const donnees = await lireDonneesJSON(); // le panthéon actuel : l'ancien format est une liste de lignes { nom, net, brut, morts, coups, date }, le nouveau { chrono: [...], nohit: [...] }
        const listes = Array.isArray(donnees) ? { chrono: donnees } : donnees; // l'ancien format est le classement chrono
        if (!listes || typeof listes !== "object") return; // pas de panthéon encore (ou illisible) : rien à retirer
        const aRetirer = (ligne) => ligne && NOMS_A_RETIRER.includes(String(ligne.nom).trim().toUpperCase()) && String(ligne.date ?? "") <= DATE_LIMITE; // vrai si cette ligne porte un des noms et date d'avant la limite
        let retirees = 0; // le nombre de lignes retirées, dans les deux classements
        const nettoyees = {}; // les listes nettoyées
        for (const nom of Object.keys(listes)) { // pour chaque classement (chrono, nohit)
            if (!Array.isArray(listes[nom])) { nettoyees[nom] = listes[nom]; continue; } // pas une liste : on n'y touche pas
            nettoyees[nom] = listes[nom].filter((ligne) => !aRetirer(ligne)); // toutes les autres lignes
            retirees += listes[nom].length - nettoyees[nom].length; // on compte ce qui a été retiré
        }
        if (retirees === 0) return; // aucune ligne à retirer : on n'écrit rien
        await ecrireDonneesJSON(Array.isArray(donnees) ? nettoyees.chrono : nettoyees); // on réécrit le panthéon sans les lignes retirées (dans son format d'origine)
        console.log("Classement nettoyé : " + retirees + " ligne(s) retirée(s)"); // une trace dans la console
    } catch (erreur) {
        console.warn("Nettoyage du classement impossible :", erreur); // on ne bloque jamais le jeu pour ça
    }
}
