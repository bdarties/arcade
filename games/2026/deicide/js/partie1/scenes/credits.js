// credits.js : l'écran de crédits, à la fin du jeu : après la victoire, AVANT le panthéon (classement.js : saisie du nom et tableau), qui est la dernière chose vue avant le retour à l'accueil.
// Le titre apparaît au centre avec ses lettres qui scintillent, puis les crédits défilent vers le haut (le nom des créateurs, les graphismes, les musiques, les bruitages, le moteur),
// et le défilé se termine sur « FIN ». Le décor est celui de l'écran du panthéon : une lueur violette qui respire, des colonnes sur les bords, de la poussière qui monte.
// N'importe quel bouton (après 1,5 s) saute les crédits ; sinon la fin du défilé mène toute seule au panthéon.
import { creerPolice, ecrire, OR, CLAIR, LAVANDE, GRIS_VIOLET } from "./classement.js"; // la police pixel et les couleurs du jeu
import { creerTextureHalo } from "../mecanismes/lumiere.js"; // le halo doux, pour la lueur du fond
import { jouerSon, musiqueDeScene } from "../systemes/sons.js";

const VOLUME_MUSIQUE_CREDITS = 1; // le volume de base de la musique des crédits : le maximum (0,38 puis 0,6 avant, trop faible face à la musique des boss : 0,42 et 0,18) ; 0,3 pour celle du niveau ; le réglage « musique » du menu pause s'y applique
const TOUCHES_SORTIR = ["KeyI", "Enter", "Space", "KeyO", "KeyK", "KeyL"];
const DELAI_AVANT_SORTIR = 1500; // ms : le joueur tient encore le bouton qui l'a amené ici
const VITESSE = 75; // px par seconde
const PAUSE_TITRE = 4200; // ms pendant lesquelles le titre reste seul au centre avant que ça défile
const PRET_A_DEFILER = 1600; // ms pendant lesquelles le défilement accélère doucement

// Ce qui défile : des sections { titre, lignes }. Pas d'accents : la police pixel n'en a pas (comme l'écran du panthéon).
const SECTIONS = [
    { titre: "UN JEU DE", lignes: ["THOMAS SIEGEL-BOISSIERE", "PAUL POUYADOUX", "MATHYS RIBES"], echelle: 5 },
    { titre: "SAE BORNE D'ARCADE", lignes: ["THEME : OMBRE ET LUMIERE"], echelle: 4 },
    { titre: "GRAPHISMES", lignes: ["ROBOT : PACK BOT WHEEL", "DECOR : DAWN OF THE GODS", "ENNEMIS : HUNTRESS 2, BRINGER OF DEATH, WIZARD"], echelle: 3 },
    { titre: "MUSIQUES", lignes: ["DARK SHRINE LOOP : QUBODUP ET YD", "BOSS BATTLE #8 ET #9 (METAL), ENDING SCENE : NENE"], echelle: 3 },
    { titre: "BRUITAGES", lignes: ["KENNEY, RUBBERDUCK, JAGGEDSTONE", "CRI DU BOSS : YODGUARD"], echelle: 3 },
    { titre: "MOTEUR", lignes: ["PHASER 3.60"], echelle: 4 },
    { titre: "REMERCIEMENTS", lignes: ["NERIMEN : POUR LES NOMBREUSES PULL REQUESTS ACCEPTEES", "MOMO : POUR LE BETA TEST"], echelle: 3 }
];

export default class credits extends Phaser.Scene {
    constructor() { super({ key: "credits" }); }

    init(donnees) { // le résultat de la partie, à transmettre au panthéon (classement.js) qui vient APRÈS les crédits ; sans résultat (test), retour à l'accueil
        this.resultat = donnees && donnees.tempsBrutMs !== undefined ? donnees : null;
    }

    // La musique des crédits n'est PAS chargée avec le reste du jeu : décodée elle pèse 19 Mo en mémoire, et le Raspberry Pi de la borne en a peu. Elle se charge ici, à l'arrivée sur les crédits.
    preload() {
        this.load.setBaseURL(this.sys.game.config.baseURL); // (chaque scène a son propre chargeur : voir chargerJeu dans chargement.js)
        this.load.audio("musique_credits", ["./assets/sons/musique_credits.ogg", "./assets/sons/musique_credits.mp3"]);
    }

    create() {
        this.cameras.main.setBackgroundColor("#0e0e11");
        this.cameras.main.fadeIn(900, 0, 0, 0);
        creerPolice(this);
        this.libererMemoire(); // les musiques des boss ne servent plus : on libère leur place avant la musique des crédits
        musiqueDeScene(this, "musique_credits", VOLUME_MUSIQUE_CREDITS, false); // « Ending Scene V3 » de nene (CC0), 54 s, elle ne se répète pas : elle finit en fondu avec les crédits
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { // en quittant les crédits : la musique est libérée aussi (elle se rechargera à la prochaine fin)
            const son = this.sound.get("musique_credits");
            if (son) { son.stop(); son.destroy(); }
            this.cache.audio.remove("musique_credits");
        });
        this.sortie = false;
        this.phase = "titre"; // titre -> defile -> fin
        this.debut = this.time.now;
        this.decor();
        this.construire();
        this.bords();
        this.input.keyboard.on("keydown", (evenement) => { if (!evenement.repeat && TOUCHES_SORTIR.includes(evenement.code) && this.time.now - this.debut > DELAI_AVANT_SORTIR) this.sortir(); });
        this.time.delayedCall(700, () => this.entree());
    }

    // Détruit les musiques des boss (et le cri) et les retire du cache : leurs ~42 Mo de son décodé sont rendus. Elles se rechargent toutes seules à la prochaine partie (niveau.js, partie2/musique.js).
    libererMemoire() {
        ["musique_boss_intro", "musique_boss_boucle", "musique_boss2_intro", "musique_boss2_boucle", "cri_boss"].forEach((cle) => {
            this.sound.getAll(cle).forEach((son) => { son.stop(); son.destroy(); });
            if (this.cache.audio.exists(cle)) this.cache.audio.remove(cle);
        });
    }

    // ---- le décor : une lueur qui respire, des colonnes sur les bords, de la poussière qui monte ----
    decor() {
        creerTextureHalo(this);
        if (!this.textures.exists("pixel")) { // un carré blanc de 4 px pour la poussière et les étincelles (le jeu le fabrique au 1er niveau, mais cette scène peut arriver directement)
            const carre = this.make.graphics({ add: false });
            carre.fillStyle(0xffffff); carre.fillRect(0, 0, 4, 4); carre.generateTexture("pixel", 4, 4); carre.destroy();
        }
        const lueur = this.add.image(640, 150, "halo").setScale(9).setTint(GRIS_VIOLET).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.22).setDepth(0).setPipeline("SinglePipeline"); // la même lueur que l'écran du panthéon
        this.tweens.add({ targets: lueur, alpha: 0.4, scale: 10, duration: 2600, yoyo: true, repeat: -1, ease: "Sine.InOut" });
        [60, 1220].forEach((x) => { this.add.rectangle(x, 360, 56, 720, 0x15121a).setDepth(0); this.add.rectangle(x - 20, 360, 4, 720, 0x1d1824).setDepth(0); });
        this.add.particles(0, 0, "pixel", { x: { min: 0, max: 1280 }, y: { min: 420, max: 740 }, speedY: { min: -34, max: -12 }, speedX: { min: -8, max: 8 }, lifespan: 8000, frequency: 260, quantity: 1,
            alpha: { start: 0.35, end: 0 }, scale: { min: 0.6, max: 1.6 }, tint: [0xe7e0e9, 0xffd45c, 0xb89cff] }).setDepth(1);
    }

    // ---- le contenu : un seul conteneur, qui monte ----
    construire() {
        this.defile = this.add.container(0, 0).setDepth(10);
        let y = 0;
        // le titre
        this.titre = ecrire(this, 640, y, "DEICIDE", 17, { teinte: 0xffffff });
        this.defile.add(this.titre);
        this.titre.lettres.forEach((lettre) => { if (lettre) lettre.setAlpha(0); }); // elles apparaissent une à une (voir entree)
        y += 100;
        this.sousTitre = ecrire(this, 640, y, "OMBRE ET LUMIERE", 5, { teinte: LAVANDE });
        this.sousTitre.setAlpha(0);
        this.defile.add(this.sousTitre);
        y += 78;
        this.ornements = [this.filet(y)]; // un filet doré avec un losange au milieu
        this.defile.add(this.ornements);
        y += 60;
        this.yTitre = 0; // où se trouve le titre dans le conteneur (le défilé le fait monter)
        // les sections
        SECTIONS.forEach((section) => {
            y += 150;
            const entete = ecrire(this, 640, y, section.titre, 3, { teinte: OR });
            this.defile.add(entete);
            const largeur = section.titre.length * 6 * 3;
            [-1, 1].forEach((cote) => this.defile.add(this.losange(640 + cote * (largeur / 2 + 30), y, 8, OR))); // un petit losange de chaque côté du titre de la section
            y += 52;
            section.lignes.forEach((ligne) => {
                this.defile.add(ecrire(this, 640, y, ligne, section.echelle, { teinte: CLAIR }));
                y += section.echelle * 7 + 26;
            });
        });
        // la fin
        y += 170;
        this.defile.add(this.filet(y));
        y += 130;
        this.fin = this.add.container(640, y); // un conteneur centré sur « FIN » : il grossit autour de son milieu
        this.fin.add(ecrire(this, 0, 0, "FIN", 14, { teinte: OR }));
        this.defile.add(this.fin);
        y += 120;
        this.defile.add(ecrire(this, 640, y, "MERCI D'AVOIR JOUE", 5, { teinte: CLAIR }));
        this.yFin = y - 120; // l'ordonnée de « FIN » : le défilé s'arrête quand elle arrive au milieu de l'écran
        this.defile.y = 330 - this.yTitre; // le titre est au centre au départ
    }

    filet(y) { // une ligne dorée avec un losange au milieu
        const g = this.add.container(0, 0);
        g.add(this.add.rectangle(640 - 190, y, 340, 3, OR, 0.9));
        g.add(this.add.rectangle(640 + 190, y, 340, 3, OR, 0.9));
        g.add(this.losange(640, y, 13, OR));
        return g;
    }

    losange(x, y, taille, couleur) { return this.add.rectangle(x, y, taille, taille, couleur).setAngle(45); }

    // un fondu vers le noir en haut et en bas de l'écran : le texte apparaît et disparaît en douceur
    bords() {
        for (let i = 0; i < 24; i++) {
            const alpha = 1 - i / 24;
            this.add.rectangle(640, 5 * i + 2.5, 1280, 5, 0x0e0e11, alpha).setDepth(30);
            this.add.rectangle(640, 720 - 5 * i - 2.5, 1280, 5, 0x0e0e11, alpha).setDepth(30);
        }
    }

    // ---- 1. l'entrée du titre : les lettres claquent une à une, un éclat de lumière, des étincelles ----
    entree() {
        jouerSon(this, "porte");
        this.titre.lettres.forEach((lettre, i) => {
            if (!lettre) return;
            lettre.setScale(17 * 2.6);
            this.tweens.add({ targets: lettre, alpha: 1, scale: 17, duration: 260, delay: i * 120, ease: "Back.Out", onStart: () => { if (i % 2 === 0) this.cameras.main.shake(120, 0.004); } });
        });
        this.tweens.add({ targets: this.sousTitre, alpha: 1, duration: 900, delay: 1100 });
        this.time.delayedCall(1100, () => { // l'éclat final de la dernière lettre
            this.cameras.main.flash(260, 255, 240, 200);
            const etincelles = this.add.particles(0, 0, "pixel", { speed: { min: 150, max: 650 }, angle: { min: 0, max: 360 }, gravityY: 250, lifespan: { min: 500, max: 1500 }, scale: { start: 3.4, end: 0 }, alpha: { start: 1, end: 0 },
                tint: [0xfff2c0, 0xffd45c, 0xffffff, 0xb89cff], blendMode: "ADD", emitting: false }).setDepth(11);
            for (let x = 320; x <= 960; x += 40) etincelles.emitParticleAt(x, 330, 4);
        });
        this.time.delayedCall(PAUSE_TITRE, () => { this.phase = "defile"; this.debutDefile = this.time.now; });
    }

    // ---- 2. à chaque image : le scintillement du titre, le défilé, l'arrivée sur « FIN » ----
    update(temps, delta) {
        // le titre scintille : une vague de lumière qui traverse ses lettres, de l'or au blanc
        const t = this.time.now / 1000;
        this.titre.lettres.forEach((lettre, i) => {
            if (!lettre) return;
            const onde = 0.5 + 0.5 * Math.sin(t * 2.4 - i * 0.7);
            const teinte = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0xffd45c), Phaser.Display.Color.ValueToColor(0xffffff), 100, Math.round(onde * 100));
            lettre.setTint(Phaser.Display.Color.GetColor(teinte.r, teinte.g, teinte.b));
        });
        if (this.phase !== "defile") return;
        const montee = Math.min(1, (this.time.now - this.debutDefile) / PRET_A_DEFILER); // le défilé accélère doucement
        this.defile.y -= VITESSE * montee * delta / 1000;
        if (this.yFin + this.defile.y <= 330) { // « FIN » est au milieu de l'écran : on s'arrête
            this.defile.y = 330 - this.yFin;
            this.phase = "fin";
            this.arrivee();
        }
    }

    // ---- 3. « FIN » : un éclat, puis l'invitation à appuyer sur un bouton, qui clignote. Au bout de 7 s, retour tout seul. ----
    arrivee() {
        jouerSon(this, "lanterne");
        this.cameras.main.flash(220, 255, 235, 170);
        this.tweens.add({ targets: this.fin, scale: 1.1, duration: 700, yoyo: true, repeat: -1, ease: "Sine.InOut" });
        const invite = ecrire(this, 640, 640, this.resultat ? "I  CONTINUER" : "I  RETOUR A L'ACCUEIL", 3, { teinte: GRIS_VIOLET });
        invite.setDepth(40);
        this.tweens.add({ targets: invite, alpha: 0.3, duration: 650, yoyo: true, repeat: -1 });
        this.time.delayedCall(10000, () => this.sortir()); // la fin de la musique (le calme) accompagne « FIN » : 10 s avant le retour automatique
    }

    sortir() {
        if (this.sortie) return;
        this.sortie = true;
        const musique = this.sound.get("musique_credits"); // la musique s'éteint en fondu avec l'écran
        if (musique) this.tweens.add({ targets: musique, volume: 0, duration: 650, onComplete: () => musique.stop() });
        this.cameras.main.fadeOut(700, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => { if (this.resultat) this.scene.start("classement", this.resultat); else this.scene.start("menu"); }); // le panthéon (c'est la dernière chose vue) ; sans résultat : l'accueil
    }
}
