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
        arr.push({ name: name || 'Anonyme', ms: Number(ms) || 0 });
        arr.sort((a,b) => a.ms - b.ms);
        // keep top 5
        arr = arr.slice(0,5);
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
