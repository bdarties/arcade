const fakeScores = [
    { player: "Alice", score: 1500 },
    { player: "Bob", score: 1200 },
    { player: "Charlie", score: 1000 },
    { player: "Dave", score: 900 },
    { player: "Eve", score: 800 },
    { player: "Frank", score: 700 },
    { player: "Grace", score: 600 },
    { player: "Hank", score: 500 },
    { player: "Ivy", score: 400 },
    { player: "Jack", score: 300 },
];

export async function get_tab_score(gameId) {
    console.log("Simulation : récupération des scores pour le jeu ID :", gameId);

    // Simule un délai pour imiter une requête réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("Scores simulés récupérés :", fakeScores);
    return fakeScores; // Retourne les scores simulés
}

export async function ajoute_score(gameId, nomJoueur, score) {
    console.log("Simulation : ajout d'un score :", { gameId, nomJoueur, score });

    // Simule un délai pour imiter une requête réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    // Ajoute le score au tableau simulé
    fakeScores.push({ player: nomJoueur, score: score });

    // Trie les scores par ordre décroissant et garde les 10 meilleurs
    fakeScores.sort((a, b) => b.score - a.score);
    if (fakeScores.length > 10) {
        fakeScores.pop();
    }

    console.log("Scores simulés après ajout :", fakeScores);
    return { success: true, message: "Score ajouté avec succès" }; // Retourne un résultat simulé
}