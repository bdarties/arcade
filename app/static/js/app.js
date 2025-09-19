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
		const cols = 3; // Nombre de colonnes dans la grille
		const rows = Math.ceil(this.gameCells.length / cols);
		
		switch(e.key) {
			case 'ArrowUp':
				e.preventDefault();
				if (this.currentIndex >= cols) {
					this.currentIndex -= cols;
					this.updateFocus();
					this.updateDescription();
				}
				break;
				
			case 'ArrowDown':
				e.preventDefault();
				if (this.currentIndex + cols < this.gameCells.length) {
					this.currentIndex += cols;
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
				this.playCurrentGame();
				break;
		}
	}
	
	updateFocus() {
		// Retirer le focus de toutes les cellules
		this.gameCells.forEach(cell => cell.classList.remove('focused'));
		
		// Ajouter le focus à la cellule actuelle
		if (this.gameCells[this.currentIndex]) {
			this.gameCells[this.currentIndex].classList.add('focused');
		}
	}
	
	updateDescription() {
		const currentCell = this.gameCells[this.currentIndex];
		if (!currentCell) return;
		
		const title = currentCell.dataset.gameTitle;
		const description = currentCell.dataset.gameDescription;
		const authors = currentCell.dataset.gameAuthors;
		const gameId = currentCell.dataset.gameId;
		const videoPath = `/games/${gameId}/demo.mp4`;
		this.gameTitle.textContent = title;
		this.gameDesc.textContent = description;
		this.gameAuthors.textContent = authors ? `Auteurs: ${authors}` : '';
		
		// this.videoPath = videoPath;
		/*
		const videoContainer = document.getElementById('game-demo-video');
            const videoSource = document.getElementById('video-source');
            if (videoContainer && videoSource) {
                videoSource.src = `/games/${gameId}/demo.mp4`;
                videoSource.parentElement.load();
                videoContainer.style.display = 'block';
            }
			*/


	}
	
	playCurrentGame() {
		const currentCell = this.gameCells[this.currentIndex];
		if (currentCell) {
			const gameId = currentCell.dataset.gameId;
			window.location.href = `/games/${gameId}`;
		}
	}
}

// Initialiser la navigation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
	new GamesGridNavigation();
});


