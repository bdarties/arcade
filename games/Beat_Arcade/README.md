# Organisation des Assets - Beat Borner

## Structure des dossiers

### `/static/` - Assets publics (accessibles via URL)
Tous les fichiers dans ce dossier sont servis directement par le serveur et accessibles via des URLs absolues.

```
static/
├── images/          # Images générales
│   ├── logo.png
│   ├── backgrounds/
│   └── ui/
├── audio/           # Fichiers audio
│   ├── music/
│   ├── sfx/
│   └── samples/
├── icons/           # Icônes et favicons
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── manifest-icons/
├── textures/        # Textures pour Babylon.js
│   ├── materials/
│   ├── skybox/
│   └── particles/
└── models/          # Modèles 3D
    ├── notes/
    ├── sabers/
    └── environments/
```

## Comment utiliser les assets

### Dans les composants Svelte
```svelte
<!-- Images -->
<img src="/images/logo.png" alt="Beat Borner Logo" />

<!-- Audio -->
<audio src="/audio/music/song.mp3" controls />
```

### Dans le code JavaScript (Babylon.js)
```javascript
// Charger une texture
const texture = new BABYLON.Texture("/textures/note.jpg", scene);

// Charger un modèle 3D
BABYLON.SceneLoader.ImportMesh("", "/models/", "saber.babylon", scene);

// Audio
const music = new BABYLON.Sound("Music", "/audio/music/track.mp3", scene);
```

### Dans le CSS
```css
.background {
  background-image: url('/images/backgrounds/main-bg.jpg');
}
```

## Types de fichiers recommandés

### Images
- **PNG** : Logos, icônes, images avec transparence
- **JPG** : Photos, backgrounds
- **WebP** : Format moderne, plus léger
- **SVG** : Icônes vectorielles

### Audio
- **MP3** : Musiques (bon compromis qualité/taille)
- **OGG** : Alternative libre au MP3
- **WAV** : Effets sonores courts (haute qualité)

### Modèles 3D
- **GLTF/GLB** : Format standard moderne
- **Babylon** : Format natif Babylon.js
- **OBJ** : Format simple pour géométries

### Textures
- **JPG** : Textures opaques
- **PNG** : Textures avec transparence
- **DDS** : Format optimisé pour GPU
