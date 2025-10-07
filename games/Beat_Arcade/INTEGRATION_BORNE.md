# 🎮 Intégration Beat Arcade avec la Borne d'Arcade

## 📋 Contexte

Beat Arcade utilise **SvelteKit + Babylon.js**, pas Phaser comme les autres jeux de la borne. L'objet `game` exporté dans `index.js` implémente l'interface Phaser attendue par la borne tout en gérant le nettoyage spécifique à Babylon.js.

## 🔌 Comment utiliser dans ton code Svelte

### 1. Enregistrer ton Engine Babylon

Quand tu crées ton engine Babylon.js dans un composant Svelte :

```javascript
// Dans ton composant Svelte (+page.svelte ou autre)
import { onMount, onDestroy } from 'svelte';
import * as BABYLON from '@babylonjs/core';

onMount(() => {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // ✨ IMPORTANT: Enregistrer auprès de la borne
    if (window.game) {
        window.game.registerBabylonEngine(engine);
        window.game.registerBabylonScene(scene);
    }

    // Ton code Babylon habituel...
    engine.runRenderLoop(() => {
        scene.render();
    });

    // Cleanup local au composant
    return () => {
        scene.dispose();
        engine.dispose();
    };
});
```

### 2. Enregistrer les Audio

Si tu utilises des éléments `<audio>` ou Web Audio API :

```javascript
// Pour un élément <audio>
const audio = new Audio('/audio/music.mp3');
if (window.game) {
    window.game.registerAudio(audio);
}
audio.play();

// Pour AudioContext
const audioContext = new AudioContext();
if (window.game) {
    window.game._audioContext = audioContext;
}
```

### 3. Auto-détection (Optionnel)

Pour tracker automatiquement les audios créés :

```javascript
// À ajouter dans ton code d'initialisation
const OriginalAudio = window.Audio;
window.Audio = function(src) {
    const audio = new OriginalAudio(src);
    if (window.game) {
        window.game.registerAudio(audio);
    }
    return audio;
};
```

## 🧹 Ce qui est nettoyé automatiquement

Quand le joueur quitte ton jeu (touche W ou fermeture), la borne appelle `game.destroy()` qui :

1. ✅ Arrête tous les sons (HTML5 Audio + AudioContext)
2. ✅ Dispose toutes les scènes Babylon (meshes, materials, textures)
3. ✅ Dispose tous les engines Babylon (stopRenderLoop + dispose)
4. ✅ Nettoie les contextes WebGL (lose_context)
5. ✅ Supprime les canvas du DOM
6. ✅ Clear tous les timers (setTimeout, setInterval, requestAnimationFrame)
7. ✅ Supprime les event listeners globaux

## 🎯 Bonnes pratiques

### ✅ À FAIRE
- Toujours enregistrer tes engines/scenes Babylon avec `registerBabylonEngine()` / `registerBabylonScene()`
- Enregistrer les audios importants avec `registerAudio()`
- Garder ton propre cleanup dans `onDestroy()` pour le développement local

### ❌ À ÉVITER
- Ne pas supposer que les ressources seront toujours disponibles après `destroy()`
- Ne pas stocker de références globales sans les nettoyer
- Ne pas créer de timers infinis sans les tracker

## 🔍 Debug

Pour vérifier que le système fonctionne :

```javascript
// Dans la console du navigateur
console.log(window.game);
console.log('Engines:', window.game._babylonEngines.size);
console.log('Scenes:', window.game._babylonScenes.size);
console.log('Audios:', window.game._activeAudios.size);

// Tester le nettoyage manuellement
window.game.destroy(false); // false = garder les canvas pour debug
```

## 📝 Notes techniques

- **Compatibilité Phaser** : Les méthodes `scene.*` et `registry.*` sont des stubs (ne font rien) car ton jeu n'utilise pas Phaser
- **Nettoyage profond** : Le système nettoie même les ressources non enregistrées (canvas, timers globaux)
- **Sécurité** : Les try/catch empêchent un crash de bloquer tout le nettoyage
- **Performance** : Le nettoyage est fait en une seule passe pour éviter les fuites mémoire

## 🚀 Prochaines étapes

Si tu veux améliorer le système :
- Ajouter un système de pause/resume pour la touche W
- Tracker les requêtes fetch en cours pour les annuler
- Implémenter un système de sauvegarde avant quitter
