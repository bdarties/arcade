// Écran d'accueil : fond + bouton Play, puis passage à l'écran de choix du mode (scène "menu")
export default class accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("accueil_fond", "./assets/ui/accueil.png");
    this.load.image("play_hover", "./assets/ui/play-hover.png");
    this.load.audio("musique_demo", ["./assets/audio/demo.mp3"]);
  }

  create() {
    this.cameras.main.fadeIn(300);
    this.demarre = false;

    // musique : le navigateur la lance au premier clic / appui sur une touche
    if (this.cache.audio.exists("musique_demo") && !this.sound.get("musique_demo")) {
      this.sound.add("musique_demo", { loop: true, volume: 0.5 }).play();
    }

    const L = this.scale.width;
    const H = this.scale.height;
    this.add.image(L / 2, H / 2, "accueil_fond");

    // position du bouton Play
    const PLAY = { x: 639, y: 555, w: 262, h: 70 };

    this.playHover = this.add
      .image(PLAY.x, PLAY.y, "play_hover")
      .setDisplaySize(PLAY.w, PLAY.h);

    // souris / écran tactile ( JUSTE POUR TESTER, POUR LA BORNE ON L ENLEVERA )
    const zone = this.add.zone(PLAY.x, PLAY.y, PLAY.w, PLAY.h).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => this.lancer());

    this.add
      .text(L / 2, H - 40, "Bouton A : jouer", { fontSize: "22px", color: "#cccccc" })
      .setOrigin(0.5)
      .setShadow(2, 2, "#000000", 4);

    // clavier / borne
    const K = Phaser.Input.Keyboard.KeyCodes;
    const valider = [K.ENTER, K.SPACE, K.I, K.R];
    this.input.keyboard.on("keydown", (e) => {
      if (valider.includes(e.keyCode)) this.lancer();
    });
  }

  lancer() {
    if (this.demarre) return;
    this.demarre = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
  }
}
