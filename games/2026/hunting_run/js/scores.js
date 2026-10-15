import { SCORES, ETATS_PARTIE, JOUEUR } from "./maps.js";

// lit le classement sauvegardé (tableau d'objets { nom, score }, du meilleur au moins bon)
export async function lireScores() {
  try {
    const liste = await lireDonneesJSON(); // fonction du prof
    return Array.isArray(liste) ? liste.filter((x) => x && typeof x.score === "number").sort((a, b) => b.score - a.score) : [];
  } catch (e) {
    return [];
  }
}

// ajoute un score : on LIT, on MODIFIE, puis on RÉÉCRIT. Renvoie le classement et le rang du nouveau score.
export async function ajouterScore(nom, score) {
  let liste = await lireScores();
  const entree = { nom: nom, score: score };
  liste.push(entree);
  liste.sort((a, b) => b.score - a.score);
  liste = liste.slice(0, SCORES.nbMax);
  try {
    await ecrireDonneesJSON(liste);
  } catch (e) {
    /*sauvegarde impossible : tant pis, on affiche quand même le classement*/
  }
  return { liste, rang: liste.indexOf(entree) };
}

// scores de la partie en cours : [{ joueur: 0 (solo) | 1 | 2, score }] (un par joueur en duo)
export function scoresDeLaPartie(registry) {
  const nb = registry.get("nbJoueurs") || 1;
  return Array.from({ length: nb }, (_, i) => ({ joueur: nb > 1 ? i + 1 : 0, score: registry.get("score_" + (i + 1)) || 0 }));
}

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// data = { scores : [{ joueur, score }], suite : "accueil" | "rejouer" }
// en duo, chaque joueur dont le score entre dans le classement saisit ses initiales à son tour
export default class scores extends Phaser.Scene {
  constructor() {
    super({ key: "scores" });
  }

  init(data) {
    this.tous = (data && data.scores) || [];
    this.file = this.tous.filter((x) => x.score > 0); // scores à enregistrer, l'un après l'autre
    this.suite = (data && data.suite) || "accueil";
  }

  create() {
    this.cameras.main.fadeIn(300);
    this.parti = false;
    this.pret = false;
    this.chargee = false; // devient vrai quand le classement est lu
    this.sauve = false;

    const L = this.scale.width;
    const H = this.scale.height;
    this.add.rectangle(L / 2, H / 2, L, H, 0x0d0610, 1);
    this.add.rectangle(L / 2, H / 2, L - 80, H - 60, 0x140a12, 1).setStrokeStyle(4, 0x8a1c1c);
    this.add.text(L / 2, 70, "MEILLEURS SCORES", { fontFamily: "Georgia, serif", fontSize: "48px", fontStyle: "bold", color: "#c9a24a" }).setOrigin(0.5);
    const txt = this.tous.map((x) => (x.joueur ? "J" + x.joueur + " : " : "Ton score : ") + x.score).join("        ");
    this.add.text(L / 2, 120, txt, { fontFamily: "Georgia, serif", fontSize: "28px", color: "#ffffff" }).setOrigin(0.5);

    this.zoneTable = this.add.container(0, 0);
    this.aide = this.add.text(L / 2, H - 45, "Chargement...", { fontSize: "18px", color: "#cccccc" }).setOrigin(0.5);

    // clavier / borne : joueur 1 (flèches, O, I) + joueur 2 (ZQSD, G, R) + Entrée / Espace
    const K = Phaser.Input.Keyboard.KeyCodes;
    const clavier = this.input.keyboard;
    this.k = clavier.addKeys({
      haut: K.UP, bas: K.DOWN, gauche: K.LEFT, droite: K.RIGHT,
      haut2: K.Z, bas2: K.S, gauche2: K.Q, droite2: K.D,
      a1: K.O, a2: K.G, b1: K.I, b2: K.R, entree: K.ENTER, espace: K.SPACE
    });
    this.souris = () => this.valider();
    this.input.on("pointerdown", this.souris);

    this.saisie = null;
    this.charger();
  }

  // lecture asynchrone du classement (await), puis saisie des initiales de chaque score qui entre dedans
  async charger() {
    this.liste = await lireScores();
    if (!this.scene.isActive()) return; // on a quitté l'écran entre-temps
    this.dessinerTable(this.liste, -1);
    this.chargee = true;
    this.suivant();
  }

  // passe au score suivant qui entre dans le classement ; s'il n'y en a plus, on attend le bouton pour continuer
  suivant() {
    const l = this.liste;
    while (this.file.length) {
      const x = this.file.shift();
      if (l.length < SCORES.nbMax || x.score > l[l.length - 1].score) {
        this.courant = x;
        this.saisie = { lettres: [0, 0, 0], pos: 0 };
        this.dessinerSaisie();
        this.time.delayedCall(700, () => (this.pret = true));
        return;
      }
    }
    this.aide.setText(this.sauve ? "Score sauvegardé !     Bouton B : continuer" : "Bouton B : continuer");
    this.time.delayedCall(700, () => (this.pret = true));
  }

  dessinerTable(liste, surligne) {
    this.zoneTable.removeAll(true);
    const L = this.scale.width;
    const police = { fontFamily: "Georgia, serif", fontSize: "28px" };
    for (let i = 0; i < SCORES.nbMax; i++) {
      const y = 190 + i * 40;
      const e = liste[i];
      const couleur = i === surligne ? "#ffd24a" : "#ffffff";
      this.zoneTable.add(this.add.text(L / 2 - 250, y, String(i + 1).padStart(2, " ") + ".", { ...police, color: couleur }));
      this.zoneTable.add(this.add.text(L / 2 - 170, y, e ? e.nom : "---", { ...police, color: couleur }));
      this.zoneTable.add(this.add.text(L / 2 + 250, y, e ? String(e.score) : "-", { ...police, color: couleur }).setOrigin(1, 0));
    }
  }

  // saisie des 3 initiales : affichée à la place de la table jusqu'à la validation
  dessinerSaisie() {
    const L = this.scale.width;
    const H = this.scale.height;
    if (this.objSaisie) this.objSaisie.forEach((o) => o.destroy());
    this.objSaisie = [];
    const { lettres, pos } = this.saisie;
    this.objSaisie.push(this.add.rectangle(L / 2, H / 2 + 30, 640, 300, 0x000000, 0.92).setStrokeStyle(3, 0xc9a24a).setDepth(10));
    this.objSaisie.push(this.add.text(L / 2, H / 2 - 80, (this.courant.joueur ? "JOUEUR " + this.courant.joueur + " : NOUVEAU RECORD !" : "NOUVEAU RECORD !  Entre tes initiales"), { fontFamily: "Georgia, serif", fontSize: "28px", color: "#ffd24a" }).setOrigin(0.5).setDepth(11));
    lettres.forEach((l, i) => {
      const x = L / 2 + (i - 1) * 110;
      this.objSaisie.push(this.add.text(x, H / 2 + 20, LETTRES[l], { fontFamily: "Georgia, serif", fontSize: "100px", fontStyle: "bold", color: i === pos ? "#ffd24a" : "#ffffff" }).setOrigin(0.5).setDepth(11));
      if (i === pos) {
        this.objSaisie.push(this.add.text(x, H / 2 - 40, "▲", { fontSize: "26px", color: "#ffd24a" }).setOrigin(0.5).setDepth(11));
        this.objSaisie.push(this.add.text(x, H / 2 + 85, "▼", { fontSize: "26px", color: "#ffd24a" }).setOrigin(0.5).setDepth(11));
      }
    });
    this.aide.setText("Haut / bas : lettre     Gauche / droite : changer     Bouton B : valider");
    this.aide.setDepth(12);
  }

  valider() {
    if (!this.pret || this.parti) return;
    if (this.saisie) {
      this.avancerSaisie();
      return;
    }
    this.quitter();
  }

  async avancerSaisie() {
    const s = this.saisie;
    if (s.pos < 2) {
      s.pos++;
      this.dessinerSaisie();
      return;
    }
    // enregistrement (asynchrone) : on bloque les touches le temps de la sauvegarde
    this.pret = false;
    this.aide.setText("Sauvegarde...");
    const nom = s.lettres.map((l) => LETTRES[l]).join("");
    this.saisie = null;
    this.objSaisie.forEach((o) => o.destroy());
    this.objSaisie = [];
    const { liste, rang } = await ajouterScore(nom, this.courant.score);
    if (!this.scene.isActive()) return;
    this.liste = liste;
    this.sauve = true;
    this.dessinerTable(liste, rang);
    this.aide.setText("Score sauvegardé !");
    this.time.delayedCall(900, () => this.suivant()); // laisse voir le rang, puis joueur suivant (ou fin)
  }

  quitter() {
    this.parti = true;
    this.input.off("pointerdown", this.souris);
    // nouvelle partie : tout est remis à zéro (timer, clé, énigmes, score, vies)
    ETATS_PARTIE.forEach((k) => this.registry.remove(k));
    this.registry.set("pv_1", JOUEUR.pvMax);
    this.registry.set("pv_2", JOUEUR.pvMax);
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (this.suite === "rejouer") this.scene.start("jeu", { map: "map1" });
      else this.scene.start("accueil");
    });
  }

  update() {
    if (!this.chargee) return; // le classement n'est pas encore lu
    const J = Phaser.Input.Keyboard.JustDown;
    const k = this.k;
    const valide = J(k.a1) || J(k.a2) || J(k.entree) || J(k.espace);
    if (this.saisie) {
      const s = this.saisie;
      let change = false;
      if (J(k.haut) || J(k.haut2)) { s.lettres[s.pos] = (s.lettres[s.pos] + 1) % LETTRES.length; change = true; }
      if (J(k.bas) || J(k.bas2)) { s.lettres[s.pos] = (s.lettres[s.pos] + LETTRES.length - 1) % LETTRES.length; change = true; }
      if (J(k.droite) || J(k.droite2)) { s.pos = Math.min(2, s.pos + 1); change = true; }
      if (J(k.gauche) || J(k.gauche2) || J(k.b1) || J(k.b2)) { s.pos = Math.max(0, s.pos - 1); change = true; }
      if (change) {
        this.dessinerSaisie();
      }
    }
    if (valide) this.valider();
  }
}
