export function doNothing() {
    // cette fonction ne fait rien.
    // c'est juste un exemple pour voir comment mettre une fonction
    // dans un fichier et l'utiliser dans les autres
}


export function doAlsoNothing() {
    // cette fonction ne fait rien non plus.
 }

// Save a speedrun score (keeps top 5 by ms ascending). key should be like 'speedrun_scores_level1'
export function saveSpeedrunScore(key, name, ms) {
    try {
        const raw = localStorage.getItem(key);
        let arr = [];
        if (raw) {
            try { arr = JSON.parse(raw); } catch (e) { arr = []; }
        }
        if (!Array.isArray(arr)) arr = [];
        
        // Convertir ms en nombre
        const newTime = Number(ms) || 0;
        
        // Si on a déjà 5 scores et que le nouveau temps est plus lent que le 5ème, on ne l'enregistre pas
        if (arr.length >= 5) {
            const worstTime = arr[arr.length - 1].ms;
            if (newTime >= worstTime) {
                return false; // Le temps n'est pas assez bon pour entrer dans le top 5
            }
        }
        
        // Trouver le plus grand numéro d'anonyme existant
        let maxNum = 0;
        arr.forEach(score => {
            if (score.name.startsWith('Anonyme')) {
                const num = parseInt(score.name.substring(7));
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        });
        
        // Créer le nouveau nom avec le numéro suivant
        const newName = `Anonyme${maxNum + 1}`;
        
        // Ajouter le nouveau score
        arr.push({ name: newName, ms: newTime });
        
        // Trier par temps croissant
        arr.sort((a,b) => a.ms - b.ms);
        
        // Garder uniquement les 5 meilleurs
        arr = arr.slice(0,5);
        
        // Sauvegarder
        localStorage.setItem(key, JSON.stringify(arr));
        return true;
    } catch (e) { return false; }
}

export function loadTopSpeedrunScores(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr.slice(0,5);
    } catch (e) { return []; }
}
