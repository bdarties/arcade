
export default class controls extends Phaser.Scene {
    // constructeur de la classe
    constructor() {
        super({
            key: "controls" //  ici on précise le nom de la classe en tant qu'identifiant
        });

    }

    preload() {
      this.load.image("button_back", "src/assets/retour.png");
      this.load.image("screen_controls", "src/assets/backdebut.png");
      this.load.image("button_up", "src/assets/fleche_haut.png");
      this.load.image("button_down", "src/assets/fleche_bas.png");
      this.load.image("button_left", "src/assets/fleche_gauche.png");
      this.load.image("button_right", "src/assets/fleche_droite.png");
      this.load.image("guide", "src/assets/controls2.png");
      this.load.audio("click_sound", "src/assets/click.mp3");
    }

    create(){
        const screen_controls = this.add.image(
        this.game.config.width / 2, 
        this.game.config.height / 2, 
        "screen_controls"
    );

    const scaleX = this.game.config.width / screen_controls.width;
    const scaleY = this.game.config.height / screen_controls.height;
    const scale = Math.max(scaleX, scaleY);
    screen_controls.setScale(scale).setScrollFactor(0);

   // Ajout du bouton "Retour"
   const button_back = this.add.image(400, 480, "button_back").setScale(0.7); // Taille d'origine
   const button_down = this.add.image(400, 150, "button_down").setScale(0.5);
   const button_up = this.add.image(400, 85, "button_up").setScale(0.5);
   const button_left = this.add.image(300, 150, "button_left").setScale(0.5);
   const button_right = this.add.image(500, 150, "button_right").setScale(0.5);
   const guide = this.add.image(400, 300, "guide");
   const clickSound = this.sound.add("click_sound");

   // Stocker les valeurs d'échelle
   const originalScale = 0.7; // Taille de départ
   const hoverScale = 0.75; // Taille lors du survol

   // Rendre le bouton interactif
   button_back.setInteractive();    

   // Gestion du survol de la souris
   button_back.on("pointerover", () => {
       button_back.setScale(hoverScale); // Augmente l'échelle lors du survol
       button_back.setTint(0xC0C0C0); // Ajoute une teinte
       clickSound.play();
   });

   // Gestion du départ de la souris
   button_back.on("pointerout", () => {
       button_back.setScale(originalScale); // Reviens à la taille d'origine
       button_back.clearTint(); // Enlève la teinte
   });

   // Gestion du clic
   button_back.on("pointerup", () => {
    clickSound.play();
    this.scene.switch("accueil"); // Revenir à l'écran d'accueil
   });
}



    udpate() {

    }

}