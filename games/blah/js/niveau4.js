import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';


var click;
var score4=0;
var zone_texte_score;
var mus4;
var time;
export default class niveau4 extends Phaser.Scene {
    constructor() {
        super({ key: "niveau4" });
        this.selectedCards = [];
        this.score4 = 0; // Initialisation du score à 0
    }

    preload() {
        // Chargement des assets
        this.load.audio("click", 'assets/click.mp3');
        this.load.image("fond", "assets/athle.jpg");
        this.load.image("exits", "assets/exit3.png");
        this.load.image("back", "assets/backs.png");
        this.load.image("joker", "assets/joker.png");
        this.load.image("roi", "assets/roi.png");
        this.load.image("reine", "assets/reine.png");
        this.load.image("valet", "assets/valet.png");
        this.load.image("dix", "assets/dix.png");
        this.load.image("trois", "assets/trois.png");
        this.load.image("deux", "assets/deux.png");
        this.load.image("un", "assets/un.png");
        this.load.audio('mus4', 'assets/musniv.mp3'); 
          
        // Autres chargements d'images
    }

    

    create() {

        mus4 = this.sound.add('mus4'); 
  
    mus4.play();
    
    
        // Afficher le fond
        this.add.image(400, 300, "fond").setScale(0.94);

        // Créer la porte exit
        const porteExit = this.add.image(620, 400, "exits").setInteractive().setScale(1.8);

        // Gestionnaire d'événements pour le clic sur la porte exit
        porteExit.on('pointerup', () => {
            click = this.sound.add('click'); 
     mus4.stop();
     this.game.config.score += this.score4;
        // Ajouter le score du niveau au score global du jeu
        
        
        // Passer à la scène "selection"
        this.scene.switch("selection");

        });

        // Initialisation des cartes et autres éléments du jeu
        this.initializeCards();
        this.displayScore(); // Appeler la fonction pour afficher le score
        zone_texte_score = this.add.text(534, 180, "score:0", { fontFamily: "Stencil", fontSize: "40pt", fontWeight: 'bold', color: '#000000' });
        this.resetScore();
    }

   // onExitClick() {
        // Fonction appelée lorsque la porte exit est cliquée
        // Arrêtez les sons, réinitialisez les valeurs, etc., si nécessaire

      //  this.sound.play('click');

    // Passer à la scène "selection" avec le score en tant que donnée
    //this.scene.switch("selection", { score: this.score });
         
    //}

    resetScore() {
        // Réinitialiser le score à zéro
        this.score4 = 0;
        zone_texte_score.setText("Score: " + this.score4);
    }
    
    initializeCards() {
        // Initialisation de la grille et des cartes
        const gridSize = { rows: 4, cols: 4 };
        const cardSpacing = 60;
        const cards = [];
        const cardWidth = 45;
        const cardHeight = 70;
    
        const cardTypes = ['roi', 'reine', 'valet', 'dix', 'trois', 'deux', 'un', 'joker'];
        const cardPairs = cardTypes.concat(cardTypes); // Répéter chaque type de carte deux fois
    
        Phaser.Utils.Array.Shuffle(cardPairs); // Mélanger les cartes
    
        for (let i = 0; i < gridSize.rows; i++) {
            for (let j = 0; j < gridSize.cols; j++) {
                const card = this.add.sprite(
                    j * (cardSpacing + cardWidth) + cardWidth / 2 + 100,
                    i * (cardSpacing + cardHeight) + cardHeight / 2 + 80,
                    'back'
                );
                card.setScale(0.5);
                card.setInteractive();
                card.frontImage = cardPairs.pop(); // Prendre la prochaine carte du tableau mélangé
                cards.push(card);
            }
        }
    
        // Ajouter un événement de clic pour chaque carte
        cards.forEach(card => {
            card.on('pointerup', () => {
                this.flipCard(card);
            });
        });
    }

    flipCard(card) {
        // Vérifier si la carte est déjà retournée ou si deux cartes sont déjà retournées
        if (card.isFlipped || this.selectedCards.length === 2) {
            return;
        }

        // Afficher l'image de la carte
        card.setTexture(card.frontImage);
        card.isFlipped = true;

        // Ajouter la carte à la liste des cartes sélectionnées
        this.selectedCards.push(card);

        // Vérifier si deux cartes ont été sélectionnées
        if (this.selectedCards.length === 2) {
            this.checkForMatch();
        }
    }

    checkForMatch() {
        const [card1, card2] = this.selectedCards;

        // Vérifier si les cartes sélectionnées correspondent
        if (card1.frontImage === card2.frontImage) {
            // Si les cartes correspondent, les laisser face visible
            this.selectedCards = [];
            this.score4 += 10;
            zone_texte_score.setText("Score: " + this.score4); // Incrémenter le score de 10 points
        } else {
            // Si les cartes ne correspondent pas, les retourner après un court délai
            this.time.delayedCall(1000, () => {
                card1.setTexture('back');
                card1.isFlipped = false;
                card2.setTexture('back');
                card2.isFlipped = false;
                this.selectedCards = [];
            });
        }
    }

    displayScore() {
        // Afficher le score à l'écran
        if (!this.scoreText) {
           //this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#0000ff' }); // Bleu
        } else {
            this.scoreText.setText('Score: ' + this.score4);
          this.scoreText.setColor('#0000ff'); // Changer la couleur en bleu
        }
    }
    
    
}
