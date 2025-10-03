// Wrapper pour charger Beat Arcade (SvelteKit) dans le système d'arcade
// Intercepte toutes les requêtes pour réécrire les chemins

const baseURL = window.location.pathname.replace(/\/$/, ''); // /games/Beat_Arcade

// Export d'un objet "game" pour la compatibilité avec la borne d'arcade
// Implémente le nettoyage Babylon.js + SvelteKit
export var game = {
    // Stockage des ressources Babylon pour le cleanup
    _babylonEngines: new Set(),
    _babylonScenes: new Set(),
    _audioContext: null,
    _activeAudios: new Set(),

    // Interface Phaser attendue par la borne (stubs)
    scene: {
        add: () => {},
        start: () => {},
        pause: () => {},
        getScenes: () => []
    },
    registry: {
        set: () => {},
        get: () => null
    },

    // Gestion du son (compatible avec les audios HTML5 et Web Audio API)
    sound: {
        stopAll: () => {
            // Arrêter tous les éléments <audio>
            document.querySelectorAll('audio').forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
            });

            // Arrêter les audios trackés
            game._activeAudios.forEach(audio => {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                } catch(e) {
                    console.warn('Erreur stop audio:', e);
                }
            });
            game._activeAudios.clear();

            // Suspendre l'AudioContext si présent
            if (game._audioContext && game._audioContext.state === 'running') {
                game._audioContext.suspend();
            }
        },
        removeAllListeners: () => {
            document.querySelectorAll('audio').forEach(audio => {
                const clone = audio.cloneNode();
                audio.parentNode?.replaceChild(clone, audio);
            });
        }
    },

    // Méthode principale de nettoyage
    destroy: (removeCanvas = true) => {
        console.log('🧹 Beat Arcade: Nettoyage en cours...');

        try {
            // 1. Arrêter tous les sons
            game.sound.stopAll();

            // 2. Nettoyer les scènes Babylon.js
            game._babylonScenes.forEach(scene => {
                try {
                    if (scene && !scene.isDisposed) {
                        // Disposer les meshes
                        scene.meshes.forEach(mesh => {
                            if (mesh.dispose) mesh.dispose();
                        });

                        // Disposer les matériaux
                        scene.materials.forEach(material => {
                            if (material.dispose) material.dispose();
                        });

                        // Disposer les textures
                        scene.textures.forEach(texture => {
                            if (texture.dispose) texture.dispose();
                        });

                        // Disposer la scène
                        scene.dispose();
                    }
                } catch(e) {
                    console.warn('Erreur nettoyage scene Babylon:', e);
                }
            });
            game._babylonScenes.clear();

            // 3. Nettoyer les engines Babylon.js
            game._babylonEngines.forEach(engine => {
                try {
                    if (engine && !engine.isDisposed) {
                        engine.stopRenderLoop();
                        engine.dispose();
                    }
                } catch(e) {
                    console.warn('Erreur nettoyage engine Babylon:', e);
                }
            });
            game._babylonEngines.clear();

            // 4. Supprimer les canvas si demandé
            if (removeCanvas) {
                document.querySelectorAll('canvas').forEach(canvas => {
                    // Nettoyer les contextes WebGL
                    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                    if (gl) {
                        const loseContext = gl.getExtension('WEBGL_lose_context');
                        if (loseContext) loseContext.loseContext();
                    }

                    canvas.width = 1;
                    canvas.height = 1;
                    canvas.remove();
                });
            }

            // 5. Annuler tous les timers et animations
            let id = setTimeout(() => {}, 0);
            while (id--) clearTimeout(id);

            id = setInterval(() => {}, 99999);
            while (id--) clearInterval(id);

            if (window.cancelAnimationFrame) {
                let rafId = requestAnimationFrame(() => {});
                while (rafId--) cancelAnimationFrame(rafId);
            }

            // 6. Supprimer les event listeners globaux (sauf ceux de la borne)
            const events = ['click', 'mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchend', 'touchmove', 'wheel'];
            events.forEach(event => {
                document.body.removeEventListener(event, () => {}, true);
            });

            console.log('✅ Beat Arcade: Nettoyage terminé');

        } catch(e) {
            console.error('❌ Erreur lors du nettoyage:', e);
        }
    },

    // Méthodes utilitaires pour tracker les ressources Babylon
    registerBabylonEngine: (engine) => {
        game._babylonEngines.add(engine);
    },

    registerBabylonScene: (scene) => {
        game._babylonScenes.add(scene);
    },

    registerAudio: (audio) => {
        game._activeAudios.add(audio);
    }
};

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