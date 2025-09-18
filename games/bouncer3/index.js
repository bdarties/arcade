import * as Phaser from "https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.esm.js";

const config = {
	type: Phaser.AUTO,
	parent: 'game-container',
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: '#0a0a0a',
	physics: { default: 'arcade', arcade: { gravity: { y: 200 }, debug: false } },
	scene: { preload, create, update }
};

let logo;

function preload(){
	this.load.setBaseURL('https://labs.phaser.io');
	this.load.image('logo', 'assets/sprites/phaser3-logo.png');
}

function create(){
	logo = this.physics.add.image(config.width/2, 100, 'logo');
	logo.setVelocity(200, 300);
	logo.setBounce(1, 1);
	logo.setCollideWorldBounds(true);
	this.scale.scaleMode = Phaser.Scale.RESIZE;
}

function update(){
}

window.addEventListener('resize', () => {
	const game = window.__phaserGameInstance;
	if (game) {
		game.scale.resize(window.innerWidth, window.innerHeight);
	}
});

const game = new Phaser.Game(config);
window.__phaserGameInstance = game;

