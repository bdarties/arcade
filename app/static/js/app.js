// Navigation dans la grille de jeux avec les flèches directionnelles
class GamesGridNavigation {
	constructor() {
		this.grid = document.getElementById('games-grid');
		this.gameCells = document.querySelectorAll('.game-cell');
		this.currentIndex = 0;
		this.gameDescription = document.getElementById('game-description');
		this.gameTitle = document.getElementById('game-title');
		this.gameDesc = document.getElementById('game-desc');
		this.gameAuthors = document.getElementById('game-authors');
		this.demoVideo = document.getElementById('game-demo-video');
		// Bouton « Retour à la page d'accueil », selectionne quand currentIndex vaut -1.
		this.returnButton = document.getElementById('return-button');
		if (this.grid && this.gameCells.length > 0) {
			this.init();
		}
	}
	
	init() {
		// Focus sur le premier jeu
		this.updateFocus();
		this.updateDescription();
		
		// Écouter les événements clavier
		document.addEventListener('keydown', (e) => this.handleKeyPress(e));
		
		// Écouter les clics sur les cellules
		this.gameCells.forEach((cell, index) => {
			cell.addEventListener('click', () => {
				this.currentIndex = index;
				this.updateFocus();
				this.updateDescription();
			});
		});
	}
	
	handleKeyPress(e) {
		const cols = 4; // Nombre de colonnes dans la grille
		const rows = Math.ceil(this.gameCells.length / cols);
		
		switch(e.key) {
			case 'ArrowUp':
				e.preventDefault();
				if (this.currentIndex == -1) {
					return;
				}
				if (this.currentIndex >= cols) {
					this.currentIndex -= cols;
					this.updateFocus();
					this.updateDescription();
				}
				else if (this.currentIndex  < cols ) {
					this.currentIndex = -1;
					this.updateFocus();
					this.updateDescription();
				}
				break;
				
			case 'ArrowDown':
				e.preventDefault();
				// Depuis le bouton de retour, on redescend sur la premiere case :
				// sans ce cas, -1 + cols renvoyait sur la deuxieme ligne.
				if (this.currentIndex === -1) {
					this.currentIndex = 0;
					this.updateFocus();
					this.updateDescription();
				}
				else if (this.currentIndex + cols < this.gameCells.length) {
					this.currentIndex += cols;
					this.updateFocus();
					this.updateDescription();
				}
				else if (this.currentIndex  < cols ) {
					this.currentIndex = -1;
					this.updateFocus();
					this.updateDescription();
				}
				break;
				
			case 'ArrowLeft':
				e.preventDefault();
				if (this.currentIndex > 0) {
					this.currentIndex--;
					this.updateFocus();
					this.updateDescription();
				}
				break;
				
			case 'ArrowRight':
				e.preventDefault();
				if (this.currentIndex < this.gameCells.length - 1) {
					this.currentIndex++;
					this.updateFocus();
					this.updateDescription();
				}
				break;
				
			case 'Enter':
			case 'x':
			case 'X':
			case 'N':
			case 'n':

				e.preventDefault();
				if (this.currentIndex == -1) {
					// L'URL vient du bouton lui-meme plutot que d'un '/' en dur.
					window.location.href = this.returnButton ? this.returnButton.href : '/';
					break;
				} else {
				this.playCurrentGame();
				break;
				}
		}
	}
	
	updateFocus() {
		// Le surlignage est retire de toutes les cases avant tout autre traitement :
		// sinon, en remontant vers le bouton de retour, la derniere case selectionnee
		// restait surlignee en plus de lui.
		this.gameCells.forEach((cell, index) => {
			if (index === this.currentIndex) {
				cell.classList.add('focused');
				// Assure que l'élément sélectionné est visible
				cell.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
					inline: 'nearest'
				});
			} else {
				cell.classList.remove('focused');
			}
		});

		if (this.returnButton) {
			this.returnButton.classList.toggle('focused', this.currentIndex === -1);
		}

		if (this.currentIndex == -1) {
			this.gameTitle.textContent = '';
			this.gameDesc.textContent = 'Utilisez les flèches pour naviguer dans la grille et appuyez sur "Start" pour lancer un jeu.';
			this.gameAuthors.textContent = '';

			// this.demoVideo.style.display = 'none';
			return;
		}

		this.updateDescription();
	}
	
	updateDescription() {
		const currentCell = this.gameCells[this.currentIndex];
		if (!currentCell) return;
		
		const title = currentCell.dataset.gameTitle;
		const description = currentCell.dataset.gameDescription;
		const authors = currentCell.dataset.gameAuthors;
		// Les URL viennent du template : les jeux sont ranges par promo
		// (games/<annee>/<jeu>/), que ce script n'a pas a connaitre.
		const videoPath = currentCell.dataset.gameVideo;
		this.gameTitle.textContent = title;
		this.gameDesc.textContent = description;
		this.gameAuthors.textContent = authors ? `Auteurs: ${authors}` : '';

		 this.videoPath = videoPath;

		const videoContainer = document.getElementById('game-demo-video');
            const videoSource = document.getElementById('video-source');
            if (videoContainer && videoSource && videoPath) {
                videoSource.src = videoPath;
                videoSource.parentElement.load();
                videoContainer.style.display = 'block';
            }
			


	}
	
	playCurrentGame() {
		const currentCell = this.gameCells[this.currentIndex];
		if (currentCell && currentCell.dataset.gameUrl) {
			window.location.href = currentCell.dataset.gameUrl;
		}
	}
}

// Initialiser la navigation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
	new GamesGridNavigation();
});


