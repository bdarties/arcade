// Wrapper pour charger Beat Arcade (SvelteKit) dans le système d'arcade
// Intercepte toutes les requêtes pour réécrire les chemins

const baseURL = window.location.pathname.replace(/\/$/, ''); // /games/Beat_Arcade

// Intercepter les fetch pour réécrire les URLs
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('/games/') && !url.startsWith('/static/') && !url.startsWith('/api/')) {
        url = baseURL + url;
    }
    return originalFetch(url, options);
};

// Intercepter aussi les créations d'Audio pour les fichiers audio
const OriginalAudio = window.Audio;
window.Audio = function(src) {
    if (typeof src === 'string' && src.startsWith('/') && !src.startsWith('/games/') && !src.startsWith('/static/')) {
        src = baseURL + src;
    }
    return new OriginalAudio(src);
};

// Intercepter HTMLMediaElement.src (parent de HTMLAudioElement)
const mediaDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
if (mediaDescriptor) {
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
        set(value) {
            if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('/games/') && !value.startsWith('/static/')) {
                value = baseURL + value;
            }
            mediaDescriptor.set.call(this, value);
        },
        get() {
            return mediaDescriptor.get.call(this);
        }
    });
}

// Récupérer le contenu de index.html
fetch(`${baseURL}/index.html`)
    .then(response => response.text())
    .then(html => {
        // Réécrire tous les chemins absolus pour qu'ils soient relatifs au jeu
        html = html.replace(/href="\/_app\//g, `href="${baseURL}/_app/`);
        html = html.replace(/src="\/_app\//g, `src="${baseURL}/_app/`);
        html = html.replace(/import\("\/_app\//g, `import("${baseURL}/_app/`);
        html = html.replace(/from "\/_app\//g, `from "${baseURL}/_app/`);
        html = html.replace(/"\/audio\//g, `"${baseURL}/audio/`);
        html = html.replace(/"\/images\//g, `"${baseURL}/images/`);
        html = html.replace(/"\/models\//g, `"${baseURL}/models/`);
        html = html.replace(/"\/textures\//g, `"${baseURL}/textures/`);

        // Remplacer le contenu du body par le HTML chargé
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Remplacer le contenu du document actuel
        document.body.innerHTML = doc.body.innerHTML;

        // Exécuter les scripts inline en réécrivant les chemins dans le code
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent && !script.src) {
                let scriptContent = script.textContent;
                // Réécrire les chemins dans le code JavaScript inline
                scriptContent = scriptContent.replace(/"\/_app\//g, `"${baseURL}/_app/`);
                scriptContent = scriptContent.replace(/'\/_app\//g, `'${baseURL}/_app/`);
                scriptContent = scriptContent.replace(/base:\s*""/g, `base: "${baseURL}"`);

                const newScript = document.createElement('script');
                newScript.textContent = scriptContent;
                document.body.appendChild(newScript);
            }
        });
    })
    .catch(error => {
        console.error('Erreur lors du chargement de Beat Arcade:', error);
        document.body.innerHTML = `
            <div style="color: white; text-align: center; padding: 50px;">
                <h1>Erreur de chargement</h1>
                <p>Impossible de charger Beat Arcade</p>
                <button onclick="window.location.href='/games/'" style="padding: 10px 20px; margin-top: 20px;">Retour</button>
            </div>
        `;
    });