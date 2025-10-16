export default class victoire extends Phaser.Scene {
  constructor() {
    super({ key: "victoire" });
  }

  preload() {
    this.load.image("screen_victoire", "assets/screen_victoire.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
  }

  create(data) {
    // Affichage de l'écran de victoire en plein écran
    this.add.image(640, 360, "screen_victoire")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(1280, 720);

      // Vérifier si on est en mode speedrun
      const isSpeedrun = data && data.mode === 'speedrun';

    // En mode histoire, on enchaine automatiquement sur la vidéo suivante
    // Si on vient d'un niveau speedrun, on retourne à la sélection
      // Si on vient d'un niveau speedrun, on affiche le temps passé (data.elapsedMs attendu)
      if (data && data.fromSpeedrun) {
        const elapsedMs = data.elapsedMs || 0;
        const formatTime = (ms) => {
          const total = Math.max(0, Math.floor(ms));
          const minutes = Math.floor(total / 60000);
          const seconds = Math.floor((total % 60000) / 1000);
          const millis = total % 1000;
          return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(millis).padStart(3, '0');
        };
        // Afficher le temps au centre, en grand
        const timeText = this.add.text(640, 300, formatTime(elapsedMs), { fontFamily: 'Cinzel Decorative, serif', fontSize: '48px', color: '#ffffff' })
          .setOrigin(0.5)
          .setDepth(300);

        // Bouton Retour vers la sélection (mode speedrun)
        const boutonRetour = this.add.image(640, 420, "retour_menu")
          .setInteractive()
          .setOrigin(0.5)
          .setScale(0.9);
        boutonRetour.on('pointerdown', () => {
          this.scene.start('selection', { mode: 'speedrun' });
        });

        // Permettre également d'appuyer sur M pour retourner
        this.toucheMenu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        this._fromSpeedrun = true;
        return;
      }
    
    // Sinon, on suit la logique du mode histoire
    if (!isSpeedrun && data && data.fromLevel) {
      if (data.fromLevel === 3) {
        // Après niveau 3, on lance la vidéo 2 puis niveau 2
        this.time.delayedCall(1000, () => this.scene.start('introvideo2'));
      } else if (data.fromLevel === 2) {
        // Après niveau 2, on lance la vidéo 3 puis niveau 1
        this.time.delayedCall(1000, () => this.scene.start('introvideo3'));
      } else if (data.fromLevel === 1) {
        // Après niveau 1, on lance la vidéo finale puis retour à l'accueil
        this.time.delayedCall(1000, () => this.scene.start('introvideo4'));
      }
    } else {
      // Mode speedrun ou non spécifié : afficher le bouton retour
      const boutonRetour = this.add.image(100, 60, "retour_menu")
        .setInteractive()
        .setOrigin(0.5);

      boutonRetour.on('pointerdown', () => {
        this.scene.start('accueil');
      });

      // Configuration des touches clavier pour retour menu
      this.toucheMenu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
      this._fromSpeedrun = false;
    }
  }

  update() {
    // Retour au menu avec la touche M
    if (this.toucheMenu && Phaser.Input.Keyboard.JustDown(this.toucheMenu)) {
      if (this._fromSpeedrun) this.scene.start('selection', { mode: 'speedrun' });
      else this.scene.start('accueil');
    }
  }
}