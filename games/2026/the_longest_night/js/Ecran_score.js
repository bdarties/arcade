export default class Ecran_score extends Phaser.Scene {
  constructor() {
    super({
      key: "Ecran_score"
    });
  }

  init(data) {
    this.resultats = data || {};
  }

  create() {
    const { scoreJ1 } = this.resultats;
    const valeurOuIndisponible = valeur => valeur ?? "Non renseigné";

    this.cameras.main.setBackgroundColor("#101820");
    this.add.text(640, 190, "Bilan de la partie", {
      fontFamily: "Arial, sans-serif",
      fontSize: "42px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5);

    this.add.text(
      640,
      340,
      `Score : ${valeurOuIndisponible(scoreJ1)}`,
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        color: "#ffffff",
        align: "center"
      }
    ).setOrigin(0.5);
  }
}

