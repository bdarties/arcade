import { BORNE, creerTouches, uneTouchePressee } from "./outils.js";

export default class histoire extends Phaser.Scene {
  constructor() {
    super({ key: 'histoire' });
  }

  preload() {
    // Préchargement des images d'illustration
    this.load.image('illustration_un', 'src/bg/illustration_un.png');
    this.load.image('illustration_deux', 'src/bg/illustration_deux.png');
  }

  create() {
    // 1. Définition des étapes : texte + clé d'image associée (ou null)
    this.dialogues = [
      {
        texte: "Le Maestro est un chef d'orchestre avec une renommée MONDIALE. Les places pour ses spectacles granduoses sont extrêmement convoitées.",
        imageKey: 'illustration_un'
      },
      {
        texte: "Et il semblerait que VOUS aussi, grâce à eu invitation mystérieuse, avez gagné la chance de faire partie de ces spectateurs privilégiés...",
        imageKey: null // Aucune image pour ce texte
      },
      {
        texte: "En arrivant à l'Opéra, vous vous rendez compte que personne d'autre que vous n'est présent sur place. A l'exception de...",
        imageKey: null // Aucune image pour ce texte
      },
      {
        texte: " « Une pierre, deux coup : je suis le Maestro ! Et à présent, vous allez faire partie de ma troupe de marionettes. » ",
        imageKey: 'illustration_deux'
      },
      {
        texte: " « Cependant, si vous réussissez à exceller dans les jeux que je vous ai concocté, Je vous laisserai à nouveau votre liberté. » ",
        imageKey: 'illustration_deux'
      }
    ];

    this.indexDialogue = 0;
    this.estEnTrainDEcrire = false; // Empêche le saut de texte pendant l'animation
    this.timerEcriture = null;
    this.choixFait = false;         // Phase 1 (choix du mode) pas encore terminée

    // 2. Image d'illustration (cachée tant que les dialogues n'ont pas commencé)
    this.cadreImage = this.add.image(640, 380, '').setVisible(false);

    // 3. Zone de texte (centrée au milieu-bas : x=640, y=520)
    this.texteAffiche = this.add.text(640, 520, '', {
      fontSize: '28px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 1000 } // Élargi à 1000px pour l'écran de 1280px
    }).setOrigin(0.5, 0);

    // Indicatif tout en bas : caché tant que le joueur n'a pas choisi son mode
    this.texteIndication = this.add.text(640, 670, "Appuie sur un bouton ou clique pour continuer...", {
      fontSize: '18px',
      fill: '#888888'
    }).setOrigin(0.5).setVisible(false);

    // 4. Phase 1 : on affiche le choix du mode (les dialogues attendent)
    this.afficherChoixMode();

    // 5. Clic souris
    this.input.on('pointerdown', () => this.avancerHistoire());

    // Touches (l'ancien écouteur "keydown-SPACE" est SUPPRIMÉ : sinon ESPACE
    // ferait avancer l'histoire deux fois, via l'écouteur et via update())
    this.touchesValider = creerTouches(this, [...BORNE.j1.boutons, ...BORNE.j2.boutons, "SPACE"]);
    this.touchesGauche  = creerTouches(this, [BORNE.j1.gauche, BORNE.j2.gauche]);
    this.touchesDroite  = creerTouches(this, [BORNE.j1.droite, BORNE.j2.droite]);
  }

  // ==============================
  // UPDATE (environ 60 fois par seconde) : lecture des touches
  // ==============================

  update() {
    // On lit TOUJOURS les trois groupes de touches (pour consommer les appuis)
    const gauche  = uneTouchePressee(this.touchesGauche);
    const droite  = uneTouchePressee(this.touchesDroite);
    const valider = uneTouchePressee(this.touchesValider);

    // Phase 1 : choix du mode
    if (!this.choixFait) {
      if (gauche) { this.selection = 1; this.majSelection(); }
      if (droite) { this.selection = 2; this.majSelection(); }
      if (valider) this.choisirMode(this.selection);
      return; // le même appui ne fait pas aussi avancer le dialogue
    }

    // Phase 2 : dialogues
    if (valider) this.avancerHistoire();
  }

  // ==============================
  // PHASE 1 : CHOIX DU MODE
  // ==============================

  afficherChoixMode() {
    this.elementsChoix = []; // pour pouvoir tout détruire ensuite
    this.selection = 1;      // 1 = Solo, 2 = Duo : le bouton actuellement "pointé"

    const question = this.add.text(640, 220, "Combien de joueurs ?", {
      fontSize: '40px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.boutonsChoix = [
      this.creerBoutonChoix(440, 380, "1 (Solo)", 1),
      this.creerBoutonChoix(840, 380, "2 (1v1)", 2)
    ];

    const aide = this.add.text(640, 520, "Joystick ◀ ▶ pour choisir, un bouton pour valider", {
      fontSize: '20px',
      fill: '#888888'
    }).setOrigin(0.5);

    this.elementsChoix.push(question, aide, ...this.boutonsChoix);
    this.majSelection();
  }

  // Le bouton sélectionné est un peu plus gros
  majSelection() {
    this.boutonsChoix.forEach((bouton, i) => {
      bouton.setScale(i + 1 === this.selection ? 1.1 : 1);
    });
  }

  creerBoutonChoix(x, y, label, nombre) {
    const bouton = this.add.text(x, y, label, {
      fontSize: '36px',
      fill: '#ffffff',
      backgroundColor: '#D6AD65',
      padding: { x: 30, y: 20 }
    }).setOrigin(0.5).setInteractive();

    // Survoler à la souris change la sélection, comme le joystick
    bouton.on('pointerover', () => { this.selection = nombre; this.majSelection(); });
    bouton.on('pointerup', () => this.choisirMode(nombre));

    return bouton;
  }

  choisirMode(nombre) {
    // Stockage global : toutes les scènes pourront lire cette valeur
    this.registry.set("joueurs", nombre);

    // On retire le menu de choix
    this.elementsChoix.forEach(element => element.destroy());
    this.choixFait = true;

    // Rappel du mode en haut de l'écran
    this.add.text(640, 40, nombre === 1 ? "Mode : Solo" : "Mode : 1v1", {
      fontSize: '24px',
      fill: '#c8a20d'
    }).setOrigin(0.5);

    this.texteIndication.setVisible(true);

    // Phase 2 : les dialogues démarrent
    this.afficherEtapeActuelle();
  }

  // ==============================
  // PHASE 2 : DIALOGUES
  // ==============================

  afficherEtapeActuelle() {
    const etape = this.dialogues[this.indexDialogue];

    // --- GESTION DE L'IMAGE ---
    if (etape.imageKey) {
      this.cadreImage.setTexture(etape.imageKey);
      this.cadreImage.setVisible(true);
    } else {
      this.cadreImage.setVisible(false);
    }

    // --- EFFET MACHINE À ÉCRIRE (LETTRE PAR LETTRE) ---
    this.texteAffiche.setText(''); // Reset du texte
    this.estEnTrainDEcrire = true;

    if (this.timerEcriture) {
      this.timerEcriture.remove(); // Annule le timer précédent si existant
    }

    let indexLettre = 0;
    const texteComplet = etape.texte;

    // Timer déclenché toutes les 30 millisecondes par lettre
    this.timerEcriture = this.time.addEvent({
      delay: 30,
      repeat: texteComplet.length - 1,
      callback: () => {
        this.texteAffiche.text += texteComplet[indexLettre];
        indexLettre++;

        // Fin de l'écriture
        if (indexLettre === texteComplet.length) {
          this.estEnTrainDEcrire = false;
        }
      }
    });
  }

  avancerHistoire() {
    // On ignore clics et Espace tant que le mode n'est pas choisi
    if (!this.choixFait) return;

    const etapeActuelle = this.dialogues[this.indexDialogue];

    // Si le joueur clique pendant que le texte s'écrit : affiche tout immédiatement
    if (this.estEnTrainDEcrire) {
      this.timerEcriture.remove();
      this.texteAffiche.setText(etapeActuelle.texte);
      this.estEnTrainDEcrire = false;
      return;
    }

    // Passage à l'élément suivant
    this.indexDialogue++;

    if (this.indexDialogue < this.dialogues.length) {
      this.afficherEtapeActuelle();
    } else {
      // Fin des dialogues -> transition vers la scène 'clicker'
      this.scene.start('clicker');
    }
  }
}