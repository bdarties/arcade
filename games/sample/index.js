import * as Phaser from "https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.esm.js";

const config = {
	type: Phaser.AUTO,
	parent: 'game-container',
	width: 800,
	height: 600,
	backgroundColor: '#1d1d1d',
	scene: {
		preload,
		create,
		update
	}
};

let text;

function preload(){
}

function create(){
	text = this.add.text(400, 300, 'Sample Game', { color: '#ffffff' }).setOrigin(0.5);
}

function update(time){
	text.rotation += 0.01;
}

new Phaser.Game(config);
