class MusicManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMusic = null;
        this.currentMusicKey = null;
        this.defaultVolume = 0.5;

        // Définition des musiques par scène
        this.musicMapping = {
            // Musique principale pour les menus
            main: ['accueil', 'credits', 'parametres', 'controles', 'choixmode'],
            // Musiques des niveaux
            level1: ['niveau1'],
            level2: ['niveau2'],
            level3: ['niveau3'],
            // Musique speedrun
            speedrun: ['niveau1_speedrun', 'niveau2_speedrun', 'niveau3_speedrun'],
            // Musique pause
            pause: ['pause']
        };

        // Chemin des fichiers audio
        this.musicFiles = {
            main: 'assets/musique/music_menu.mp3',
            level1: 'assets/musique/music_niveau1.mp3',
            level2: 'assets/musique/music_niveau2.mp3',
            level3: 'assets/musique/music_niveau3.mp3',
            speedrun: 'assets/musique/music_speedrun.mp3',
            pause: 'assets/musique/music_pause.mp3'
        };

        // État pour suivre si on vient du menu pause
        this.comingFromPause = false;
    }

    preloadMusic(scene) {
        // Préchargement de toutes les musiques
        Object.entries(this.musicFiles).forEach(([key, path]) => {
            scene.load.audio(key, path);
        });
    }

    getMusicKeyForScene(sceneName) {
        // Trouver la clé de musique correspondant à la scène
        return Object.entries(this.musicMapping).find(([musicKey, scenes]) => 
            scenes.includes(sceneName))?.[0];
    }

    play(sceneName, fromPause = false) {
        // Si on vient du menu pause et qu'on va vers parametres ou controles
        if (fromPause && (sceneName === 'parametres' || sceneName === 'controles')) {
            // On garde la musique de pause
            return;
        }

        const musicKey = this.getMusicKeyForScene(sceneName);
        
        // Si pas de musique définie pour cette scène, ne rien faire
        if (!musicKey) return;

        // Si c'est la même musique qui joue déjà, ne rien faire
        if (this.currentMusicKey === musicKey && this.currentMusic?.isPlaying) {
            return;
        }

        // Arrêter la musique actuelle si elle existe
        if (this.currentMusic) {
            this.currentMusic.stop();
        }

        // Créer et jouer la nouvelle musique
        this.currentMusic = this.scene.sound.add(musicKey, {
            loop: true,
            volume: this.getVolume()
        });
        this.currentMusicKey = musicKey;
        this.currentMusic.play();
    }

    stop() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
            this.currentMusicKey = null;
        }
    }

    pause() {
        if (this.currentMusic?.isPlaying) {
            this.currentMusic.pause();
        }
    }

    resume() {
        if (this.currentMusic && !this.currentMusic.isPlaying) {
            this.currentMusic.resume();
        }
    }

    getVolume() {
        // Récupérer le volume depuis localStorage ou utiliser la valeur par défaut
        const savedVolume = localStorage.getItem('gameVolume');
        return savedVolume !== null ? parseFloat(savedVolume) : this.defaultVolume;
    }

    setVolume(volume) {
        if (this.currentMusic) {
            this.currentMusic.setVolume(volume);
        }
    }
}

// Export une instance unique pour tout le jeu
export const musicManager = new MusicManager(null);
export default MusicManager;