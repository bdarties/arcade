export default class MusicManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMusic = null;
        this.musicVolume = 0.5;
        this.dungeonTracks = ["dungeon1", "dungeon2", "dungeon3"];
        this.currentTrackIndex = 0;
    }

    /**
     * Charge toutes les musiques du jeu
     */
    static preloadAll(scene) {
        scene.load.audio("menu_music", "assets/sound/8_bit_dungeon.mp3");
        scene.load.audio("story_music", "assets/sound/dungeon_air.mp3");
        scene.load.audio("dungeon1", "assets/sound/dungeon1.mp3");
        scene.load.audio("dungeon2", "assets/sound/dungeon2.mp3");
        scene.load.audio("dungeon3", "assets/sound/dungeon3.mp3");
    }

    /**
     * Change la musique avec un fade out/in
     */
    play(musicKey, loop = true, fadeInDuration = 500) {
        // Si c'est déjà la musique en cours, ne rien faire
        if (this.currentMusic && this.currentMusic.key === musicKey && this.currentMusic.isPlaying) {
            return;
        }

        // Arrêter la musique précédente avec fade out
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: 300,
                onComplete: () => {
                    this.currentMusic.stop();
                    this.startNewMusic(musicKey, loop, fadeInDuration);
                }
            });
        } else {
            this.startNewMusic(musicKey, loop, fadeInDuration);
        }
    }

    /**
     * Joue une musique de donjon aléatoire
     */
    playRandomDungeon(fadeInDuration = 500) {
        const randomTrack = Phaser.Utils.Array.GetRandom(this.dungeonTracks);
        this.play(randomTrack, true, fadeInDuration);
    }

    /**
     * Joue les musiques de donjon en rotation
     */
    playNextDungeon(fadeInDuration = 500) {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.dungeonTracks.length;
        this.play(this.dungeonTracks[this.currentTrackIndex], false, fadeInDuration);
        
        // Écouter la fin de la musique pour lancer la suivante
        if (this.currentMusic) {
            this.currentMusic.once('complete', () => {
                this.playNextDungeon(fadeInDuration);
            });
        }
    }

    /**
     * Démarre une nouvelle musique
     */
    startNewMusic(musicKey, loop, fadeInDuration) {
        // Vérifier si la musique existe déjà dans le cache
        if (!this.scene.cache.audio.exists(musicKey)) {
            console.warn(`Music ${musicKey} not found in cache`);
            return;
        }

        // Créer et jouer la nouvelle musique
        this.currentMusic = this.scene.sound.add(musicKey, {
            loop: loop,
            volume: 0
        });

        this.currentMusic.play();

        // Fade in
        this.scene.tweens.add({
            targets: this.currentMusic,
            volume: this.musicVolume,
            duration: fadeInDuration
        });
    }

    /**
     * Arrête la musique actuelle
     */
    stop(fadeDuration = 300) {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: fadeDuration,
                onComplete: () => {
                    this.currentMusic.stop();
                    this.currentMusic = null;
                }
            });
        }
    }

    /**
     * Met en pause la musique
     */
    pause() {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    /**
     * Reprend la musique
     */
    resume() {
        if (this.currentMusic && this.currentMusic.isPaused) {
            this.currentMusic.resume();
        }
    }

    /**
     * Change le volume
     */
    setVolume(volume) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.musicVolume);
        }
    }

    /**
     * Nettoie les ressources
     */
    destroy() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }
}