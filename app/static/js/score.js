export async function get_tab_score(gameId) {
    try {
        console.log("Récupération des scores pour le jeu ID :", gameId);
        const response = await fetch(`/api/scores/${gameId}`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        const scores = await response.json();
        console.log("Scores récupérés :", scores);
        return scores; // Retourne les scores sous forme de tableau JSON
    } catch (error) {
        console.error("Erreur lors de la récupération des scores :", error);
        return [];
    }
}

export async function ajoute_score(gameId, nomJoueur, score) {
    try {
        console.log("Ajout d'un score :", { gameId, nomJoueur, score });
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                gameId: gameId,
                playerName: nomJoueur,
                score: score
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const result = await response.json();
        console.log("Résultat de l'ajout :", result);
        return result; // Retourne le résultat de l'ajout
    } catch (error) {
        console.error("Erreur lors de l'ajout du score :", error);
        return { success: false, error: error.message };
    }
}