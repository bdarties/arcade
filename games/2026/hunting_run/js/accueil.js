import { lireScores } from "./scores.js";
import { SCORES } from "./maps.js";

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

    // souris / écran tactile ( JUSTE POUR TESTER, POUR LE PC )
    const zone = this.add.zone(PLAY.x, PLAY.y, PLAY.w, PLAY.h).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", () => this.lancer());

    // classement : lu dans la sauvegarde (asynchrone), affiché dès que c'est prêt
    lireScores().then((liste) => {
      if (this.scene.isActive()) this.afficherClassement(liste);
    });

    this.add
      .text(L / 2, H - 40, "Bouton B : jouer", { fontSize: "22px", color: "#cccccc" })
      .setOrigin(0.5)
      .setShadow(2, 2, "#000000", 4);

    // clavier / borne
    const K = Phaser.Input.Keyboard.KeyCodes;
    const valider = [K.ENTER, K.SPACE, K.O, K.G];
    this.input.keyboard.on("keydown", (e) => {
      if (valider.includes(e.keyCode)) this.lancer();
    });
  }

  // panneau du classement à droite de l'écran (top SCORES.nbMax)
  afficherClassement(liste) {
    const cx = 1110;
    const haut = 190;
    const pas = 30;
    const police = { fontFamily: "Georgia, serif", fontSize: "21px" };
    const objets = [
      this.add.rectangle(cx, haut + 20 + (SCORES.nbMax * pas) / 2, 290, SCORES.nbMax * pas + 70, 0x0d0610, 0.78).setStrokeStyle(3, 0x8a1c1c),
      this.add.text(cx, haut, "CLASSEMENT", { ...police, fontSize: "26px", fontStyle: "bold", color: "#c9a24a" }).setOrigin(0.5)
    ];
    for (let i = 0; i < SCORES.nbMax; i++) {
      const e = liste[i];
      const y = haut + 40 + i * pas;
      const couleur = i === 0 ? "#ffd24a" : e ? "#ffffff" : "#777777";
      objets.push(
        this.add.text(cx - 125, y, String(i + 1).padStart(2, " ") + ".", { ...police, color: couleur }),
        this.add.text(cx - 85, y, e ? e.nom : "---", { ...police, color: couleur }),
        this.add.text(cx + 125, y, e ? String(e.score) : "-", { ...police, color: couleur }).setOrigin(1, 0)
      );
    }
    objets.forEach((o) => o.setAlpha(0));
    this.tweens.add({ targets: objets, alpha: 1, duration: 400 });
  }

  lancer() {
    if (this.demarre) return;
    this.demarre = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu"));
  }
}
