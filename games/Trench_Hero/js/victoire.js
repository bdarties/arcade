export default class victoire extends Phaser.Scene {
    constructor() {
        super({ key: 'victoire' });
    }

    preload() {
      
    }

    create() {
        // Ajouter l'image de fond qui couvre TOUT l'écran
        let bg = this.add.image(0, 0, 'fondVictoire').setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Le texte complet à afficher
        const messageComplet = "J'ai avancé seul.\n\nUn à un, j'ai fait taire les mitrailleuses ennemies. Et au bout du combat… 132 prisonniers.\n\nIls disent que c'est un exploit. Moi, je dis que c'était mon devoir.\n\nJe suis Alvin C. York. Un homme ordinaire, dans une guerre extraordinaire.";
        
        // Créer le fond noir 
        this.fondTexte = this.add.rectangle(
            this.cameras.main.centerX,
            150,
            1050,
            300,
            0x000000,
            0.6
        ).setOrigin(0.5, 0);

        // --- POSITION DU TEXTE DANS LE FOND ---
        const xTexte = this.fondTexte.x - this.fondTexte.width / 2 + 30;
        const yTexte = this.fondTexte.y + 20;

        // --- CRÉATION DU TEXTE VIDE ---
        this.texteAffiche = this.add.text(xTexte, yTexte, '', {
            fontSize: "24px",
            color: "#f7e5b3",
            fontStyle: "bold",
            align: "left",
            wordWrap: { width: this.fondTexte.width - 60 }
        }).setOrigin(0, 0); 

        // Créer le bouton (invisible au début)
        this.bouton = this.add.image(this.cameras.main.centerX, this.cameras.main.height - 100, 'boutonFin')
            .setInteractive()
            .setAlpha(0)
            .on('pointerdown', () => {
                if (this.sonEcriture) this.sonEcriture.stop();
                // Retour au menu principal
                this.scene.start('menu');
            })
            .on('pointerover', () => {
                this.bouton.setScale(1.1);
            })
            .on('pointerout', () => {
                this.bouton.setScale(1);
            });

        // Vérifier si le son existe et le jouer
        this.sonEcriture = null;
        if (this.cache.audio.exists('ecrire')) {
            this.sonEcriture = this.sound.add('ecrire', { 
                volume: 0.3,
                loop: true 
            });
            this.sonEcriture.play();
        }

            // Jouer musique victoire en boucle (volume 0.5)
            if (this.cache.audio.exists('victoire')) {
                this._musiqueVictoire = this.sound.add('victoire', { loop: true, volume: 1 });
                this._musiqueVictoire.play();
                this.events.on('shutdown', () => {
                    if (this._musiqueVictoire) {
                        if (this._musiqueVictoire.isPlaying) this._musiqueVictoire.stop();
                        if (this._musiqueVictoire.destroy) this._musiqueVictoire.destroy();
                        this._musiqueVictoire = null;
                    }
                });
            }

        // Index de la lettre actuelle
        let index = 0;
        let texteTermine = false;

        // Timer pour afficher lettre par lettre
        this.timerTexte = this.time.addEvent({
            delay: 80,
            callback: () => {
                this.texteAffiche.text += messageComplet[index];
                index++;
                
                if (index >= messageComplet.length) {
                    texteTermine = true;
                    if (this.sonEcriture) this.sonEcriture.stop();
                    
                    this.tweens.add({
                        targets: this.bouton,
                        alpha: 1,
                        duration: 500,
                        ease: 'Power2'
                    });
                }
            },
            repeat: messageComplet.length - 1
        });

        // Touche K : affiche tout le texte OU retourne au menu
        this.input.keyboard.on('keydown-K', () => {
            if (!texteTermine) {
                this.timerTexte.remove();
                this.texteAffiche.text = messageComplet;
                if (this.sonEcriture) this.sonEcriture.stop();
                texteTermine = true;
                
                this.tweens.add({
                    targets: this.bouton,
                    alpha: 1,
                    duration: 500,
                    ease: 'Power2'
                });
            } else {
                // Retour au menu principal
                if (this.sonEcriture) this.sonEcriture.stop();
                this.scene.start('menu');
            }
        });
    }
}