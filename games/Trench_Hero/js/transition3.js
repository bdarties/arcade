export default class transition3 extends Phaser.Scene {
    constructor() {
        super({ key: 'transition3' });
    }

    init(data) {
        this.statsJoueur = data.statsJoueur || null;
    }

    preload() {
        
    }

    create() {
        // Ajouter l'image de fond qui couvre TOUT l'écran
        let bg = this.add.image(0, 0, 'fondTransition3').setOrigin(0, 0);
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Le texte complet à afficher
        const messageComplet = "Après la forêt, j’atteins les ruines d’un village Châtel-Chéhéry.\n\nIl ne reste plus grand monde autour de moi.\n\nLes Allemands se cachent dans les maisons détruites. \n\nJe respire un grand coup.\n\nUne dernière bataille… et peut-être la fin.";
        
         // Créer le fond noir 
        
        this.fondTexte = this.add.rectangle(
            this.cameras.main.centerX, // centre horizontal
            150,                        // position verticale
            1050,                       // largeur
            300,                        // hauteur
            0x000000,                   // couleur noire
            0.6                         // opacité
        ).setOrigin(0.5, 0); // centré horizontalement

        // --- POSITION DU TEXTE DANS LE FOND ---
        const xTexte = this.fondTexte.x - this.fondTexte.width / 2 + 30; // marge gauche
        const yTexte = this.fondTexte.y + 20; // marge en haut

        // --- CRÉATION DU TEXTE VIDE ---
        this.texteAffiche = this.add.text(xTexte, yTexte, '', {
            fontSize: "24px",
            color: "#f7e5b3",
            fontStyle: "bold",
            align: "left",
            wordWrap: { width: this.fondTexte.width - 60 } // marges gauche/droite
        }).setOrigin(0, 0); 

        // Créer le bouton (invisible au début)
        this.bouton = this.add.image(this.cameras.main.centerX, this.cameras.main.height - 100, 'boutonSuivant')
            .setInteractive()
            .setAlpha(0)
            .on('pointerdown', () => {
                if (this.sonEcriture) this.sonEcriture.stop();
                this.scene.start('niveau3', { statsJoueur: this.statsJoueur });
            })
            .on('pointerover', () => {
                this.bouton.setScale(1.1);
            })
            .on('pointerout', () => {
                this.bouton.setScale(1);
            });

        // Jouer le son en boucle
        this.sonEcriture = this.sound.add('ecrire', { 
            volume: 0.3,
            loop: true 
        });
        this.sonEcriture.play();

        // Index de la lettre actuelle
        let index = 0;
        let texteTermine = false;

        // Timer pour afficher lettre par lettre
        this.timerTexte = this.time.addEvent({
            delay: 80,
            callback: () => {
                // Ajouter la lettre suivante
                this.texteAffiche.text += messageComplet[index];
                index++;
                
                // Quand le texte est terminé
                if (index >= messageComplet.length) {
                    texteTermine = true;
                    // Arrêter le son
                    this.sonEcriture.stop();
                    
                    // Faire apparaître le bouton avec une animation
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

        // Touche K : affiche tout le texte OU active le bouton
        this.input.keyboard.on('keydown-K', () => {
            if (!texteTermine) {
                // Si le texte n'est pas fini : l'afficher en entier
                this.timerTexte.remove();
                this.texteAffiche.text = messageComplet;
                this.sonEcriture.stop();
                texteTermine = true;
                
                // Faire apparaître le bouton
                this.tweens.add({
                    targets: this.bouton,
                    alpha: 1,
                    duration: 500,
                    ease: 'Power2'
                });
            } else {
                // Si le texte est fini : K active le bouton (passe à la scène suivante)
                this.sonEcriture.stop();
                this.scene.start('niveau3', { statsJoueur: this.statsJoueur });
            }
        });
    }
}