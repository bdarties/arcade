import { BORNE, creerTouches, uneTouchePressee } from "./outils.js";

export default class histoire extends Phaser.Scene {
  constructor() {
    super({ key: 'histoire' });
  }

  preload() {
    // Préchargement des images d'illustration
    this.load.image('illustration_un', 'src/bg/illustration_un.png');
    this.load.image('illustration_deux', 'src/bg/illustration_deux.png');
    this.load.image('illustration_lettre', 'src/bg/illustration_lettre.png');
    this.load.image('illustration_lettre_brise', 'src/bg/illustration_lettre_brise.png');
  }

  create() {
    // 1. Définition des étapes : texte + clé d'image associée (ou null)
    this.dialogues = [
      {
        texte: "Le Maestro est un chef d'orchestre avec une renommée mondiale. Les places pour ses spectacles grandioses sont extrêmement convoitées.",
        imageKey: 'illustration_un'
      },
      {
        texte: "Et il semblerait que vous aussi, grâce à une invitation mystérieuse, avez obtenu la chance de faire partie de ces spectateurs privilégiés...",
        imageKey: 'illustration_lettre'
      },
      {
        texte: "En arrivant à l'Opéra, vous vous rendez compte que personne d'autre que vous n'est présent sur place. A l'exception de...",
        imageKey: 'illustration_lettre_brise'
      },
      {
        texte: " « D'une pierre, deux coups : je suis le Maestro ! Et à présent, vous allez faire partie de ma troupe de marionettes. » ",
        imageKey: 'illustration_deux'
      },
      {
        texte: " « Si vous réussissez à exceller dans les jeux que je vous ai préparés, Je vous laisserai à nouveau votre liberté. » ",
        imageKey: 'illustration_deux'
      }
    ];

    this.indexDialogue = 0;
    this.estEnTrainDEcrire = false; // Empêche le saut de texte pendant l'animation
    this.timerEcriture = null;
    this.texteComplet = '';         // Le texte de l'étape, déjà découpé en lignes (voir afficherEtapeActuelle)
    this.choixFait = false;         // Phase 1 (choix du mode) pas encore terminée

    // 2. Image d'illustration (cachée tant que les dialogues n'ont pas commencé)
    this.cadreImage = this.add.image(640, 380, '').setVisible(false);

    // 3. Zone de texte.
    this.texteAffiche = this.add.text(140, 520, '', {
      fontSize: '28px',
      fill: '#ffffff',
      align: 'left',
      wordWrap: { width: 1000 }
    }).setOrigin(0, 0);

    // Indicatif tout en bas : caché tant que le joueur n'a pas choisi son mode
    this.texteIndication = this.add.text(640, 670, "Appuie sur un bouton ou clique pour continuer...", {
      fontSize: '18px',
      fill: '#888888'
    }).setOrigin(0.5).setVisible(false);

    // 4. Phase 1 : on affiche le choix du mode (les dialogues attendent)
    this.afficherChoixMode();

    // 5. Clic souris (gardé par sécurité si tu testes sur PC)
    this.input.on('pointerdown', () => this.avancerHistoire());

    // Touches
    this.touchesValider = creerTouches(this, [...BORNE.j1.boutons, ...BORNE.j2.boutons, "SPACE"]);
    this.touchesGauche  = creerTouches(this, [BORNE.j1.gauche, BORNE.j2.gauche]);
    this.touchesDroite  = creerTouches(this, [BORNE.j1.droite, BORNE.j2.droite]);

    // MODIF: Touches "Bas" des joysticks pour skip l'histoire
    this.touchesSkip = creerTouches(this, [BORNE.j1.bas, BORNE.j2.bas]); 

    // MODIF: Création du texte d'aide "Passer" (caché par défaut, non interactif)
    this.texteSkip = this.add.text(1150, 40, "Joystick ▼ : Passer", {
      fontSize: '20px',
      fill: '#aaaaaa',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setVisible(false);
  }


  // ==============================
  // UPDATE (environ 60 fois par seconde) : lecture des touches
  // ==============================

  update() {
    // On lit TOUJOURS les groupes de touches (pour consommer les appuis)
    const gauche  = uneTouchePressee(this.touchesGauche);
    const droite  = uneTouchePressee(this.touchesDroite);
    const valider = uneTouchePressee(this.touchesValider);
    const skip    = uneTouchePressee(this.touchesSkip); // MODIF: lecture du skip

    // Phase 1 : choix du mode
    if (!this.choixFait) {
      if (gauche) { this.selection = 1; this.majSelection(); }
      if (droite) { this.selection = 2; this.majSelection(); }
      if (valider) this.choisirMode(this.selection);
      return; // le même appui ne fait pas aussi avancer le dialogue
    }

    // MODIF: Phase 2 - Si joystick vers le bas, on zappe tout
    if (skip) {
      this.scene.start('clicker');
      return;
    }

    // Phase 2 : dialogues classiques avec les boutons
    if (valider) this.avancerHistoire();
  }

  // ==============================
  // PHASE 1 : CHOIX DU MODE (MODIFIÉE : UX/UI)
  // ==============================

  afficherChoixMode() {
    this.elementsChoix = []; // pour pouvoir tout détruire ensuite
    this.selection = 1;      // 1 = Solo, 2 = Duo : le bouton actuellement "pointé"

    const question = this.add.text(640, 220, "Combien de joueurs ?", {
      fontSize: '44px',
      fill: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, stroke: true, fill: true } // Ajout d'une ombre pour plus de lisibilité
    }).setOrigin(0.5);

    this.boutonsChoix = [
      this.creerBoutonChoix(440, 380, "1 (Solo)", 1),
      this.creerBoutonChoix(840, 380, "2 (1v1)", 2)
    ];

    const aide = this.add.text(640, 520, "Joystick ◀ ▶ pour choisir, un bouton pour valider", {
      fontSize: '20px',
      fill: '#aaaaaa',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    this.elementsChoix.push(question, aide, ...this.boutonsChoix);
    this.majSelection();
  }

  // Amélioration UX : animation fluide (Tween) et retour visuel enrichi
  majSelection() {
    this.boutonsChoix.forEach((bouton, i) => {
      const estSelectionne = (i + 1 === this.selection);
      const scaleCible = estSelectionne ? 1.15 : 1;

      // Animation de mise à l'échelle (plus doux qu'un changement immédiat)
      this.tweens.add({
        targets: bouton,
        scaleX: scaleCible,
        scaleY: scaleCible,
        duration: 150,
        ease: 'Power2'
      });

      // Changement d'apparence selon la sélection
      if (estSelectionne) {
        bouton.fond.setFillStyle(0xE8C482); // Or plus clair
        bouton.fond.setStrokeStyle(5, 0xffffff); // Bordure blanche bien visible (5px)
        bouton.texte.setShadow(0, 0, '#ffffff', 2, false, true); // Effet de lueur sur le texte
      } else {
        bouton.fond.setFillStyle(0xD6AD65); // Or de base
        bouton.fond.setStrokeStyle(3, 0xaaaaaa); // Bordure grisée/plus fine (3px)
        bouton.texte.setShadow(0, 0, '#000000', 0, false, false); // Pas de lueur
      }
    });
  }

  creerBoutonChoix(x, y, label, nombre) {
    // Remplacement du texte simple par un conteneur (Fond + Texte)
    const conteneur = this.add.container(x, y);

    const largeur = 260;
    const hauteur = 80;

    // Création du rectangle de fond avec la bordure (StrokeStyle)
    const fond = this.add.rectangle(0, 0, largeur, hauteur, 0xD6AD65)
      .setStrokeStyle(3, 0xaaaaaa); // Bordure par défaut

    // Création du texte
    const texte = this.add.text(0, 0, label, {
      fontSize: '36px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Ajout des éléments au conteneur
    conteneur.add([fond, texte]);

    // On rend le conteneur interactif à la place du texte
    conteneur.setSize(largeur, hauteur);
    conteneur.setInteractive();

    // Survoler à la souris change la sélection
    conteneur.on('pointerover', () => { 
      this.selection = nombre; 
      this.majSelection(); 
    });
    conteneur.on('pointerup', () => this.choisirMode(nombre));

    // On attache le fond et le texte au conteneur pour pouvoir les modifier dans majSelection()
    conteneur.fond = fond;
    conteneur.texte = texte;

    return conteneur;
  }

  choisirMode(nombre) {
      // Stockage global : toutes les scènes pourront lire cette valeur
      this.registry.set("joueurs", nombre);
  
      // On retire le menu de choix (détruire le conteneur détruit aussi le fond et le texte)
      this.elementsChoix.forEach(element => element.destroy());
      this.choixFait = true;
  
      // Rappel du mode en haut de l'écran
      this.add.text(640, 40, nombre === 1 ? "Mode : Solo" : "Mode : 1v1", {
        fontSize: '26px',
        fill: '#c8a20d'
      }).setOrigin(0.5);
  
      this.texteIndication.setVisible(true);
      
      // MODIF: On affiche l'indication pour Skip pendant les dialogues
      this.texteSkip.setVisible(true); 
  
      // Phase 2 : les dialogues démarrent
      this.afficherEtapeActuelle();
  }

  // ==============================
  // PHASE 2 : DIALOGUES (inchangée)
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

    // --- DÉCOUPAGE EN LIGNES AVANT D'ÉCRIRE ---
    // getWrappedText() demande à Phaser de découper le texte COMPLET en lignes
    // (selon la largeur wordWrap), puis on recolle les lignes avec des retours à la ligne.
    // Ainsi chaque mot est déjà à sa place dès la première lettre : plus aucun mot
    // ne saute à la ligne pendant la frappe. (trim() enlève l'espace au début du texte)
    this.texteComplet = this.texteAffiche.getWrappedText(etape.texte.trim()).join('\n');

    // --- EFFET MACHINE À ÉCRIRE (LETTRE PAR LETTRE) ---
    this.texteAffiche.setText(''); // Reset du texte
    this.estEnTrainDEcrire = true;

    if (this.timerEcriture) {
      this.timerEcriture.remove(); // Annule le timer précédent si existant
    }

    let indexLettre = 0;
    const texteComplet = this.texteComplet;

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

    // Si le joueur clique pendant que le texte s'écrit : affiche tout immédiatement
    if (this.estEnTrainDEcrire) {
      this.timerEcriture.remove();
      this.texteAffiche.setText(this.texteComplet);
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