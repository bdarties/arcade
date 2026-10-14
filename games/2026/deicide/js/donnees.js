// donnees.js : la sauvegarde des données du jeu (ici : le panthéon, c'est-à-dire les meilleurs temps).
// Il fournit deux fonctions globales, les mêmes que celles de la borne (voir la notice « Sauvegarder des données dans un jeu d'arcade ») :
//   const donnees = await lireDonneesJSON();   // ce qui a été sauvegardé, ou null s'il n'y a rien
//   await ecrireDonneesJSON(donnees);          // sauvegarde (remplace tout le contenu précédent)
// Sur la borne, les données vont dans la base, sous le nom du dossier du jeu (API : GET et PUT /api/donnees/<nom du dossier>). Si la base est injoignable
// (jeu lancé sur un ordinateur, sans la borne), elles vont dans le localStorage du navigateur (clé : arcade_donnees_<nom du dossier>) : le code du jeu est
// le même dans les deux cas. Ne pas renommer le dossier du jeu après avoir enregistré des données : elles ne seraient plus retrouvées.
// Si la page de la borne a déjà chargé sa propre version de ces fonctions, c'est elle qui est gardée : ce fichier ne fait rien dans ce cas.
if (typeof window.lireDonneesJSON !== "function") {
    // l'identifiant du jeu : posé par la page de la borne (window.GAME_ID), sinon le dernier dossier de l'adresse
    const identifiant = () => window.GAME_ID || location.pathname.split("/").filter((p) => p && !p.includes(".")).pop() || "jeu";
    const adresse = () => "/api/donnees/" + encodeURIComponent(identifiant());
    const cleLocale = () => "arcade_donnees_" + identifiant();

    window.lireDonneesJSON = async function () {
        try {
            const reponse = await fetch(adresse());
            if (reponse.ok) return await reponse.json(); // « null » si le jeu n'a encore rien écrit
        } catch (erreur) { /* base injoignable : on utilise le navigateur */ }
        const texte = localStorage.getItem(cleLocale());
        return texte === null ? null : JSON.parse(texte);
    };

    window.ecrireDonneesJSON = async function (donnees) {
        const texte = JSON.stringify(donnees);
        try {
            const reponse = await fetch(adresse(), { method: "PUT", headers: { "Content-Type": "application/json" }, body: texte });
            if (reponse.ok) return;
        } catch (erreur) { /* base injoignable : on utilise le navigateur */ }
        localStorage.setItem(cleLocale(), texte);
    };
}
