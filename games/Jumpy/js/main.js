import niveau3 from "./niveau3.js";

// Config joueur 1
const config1 = {
  type: Phaser.AUTO,
  width: 640,
  height: 720,
  parent: "game1",
  physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
  scene: new niveau3({ playerId: 1 })
};

// Config joueur 2
const config2 = {
  type: Phaser.AUTO,
  width: 640,
  height: 720,
  parent: "game2",
  physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
  scene: new niveau3({ playerId: 2 })
};

new Phaser.Game(config1);
new Phaser.Game(config2);
