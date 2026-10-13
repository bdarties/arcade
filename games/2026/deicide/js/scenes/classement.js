// classement.js : l'écran de fin de partie, dans le style du HUD (plaques d'armure, chiffres à deux tons, palette lavande et or)
// Déroulé : le titre tombe, le résultat s'affiche ligne par ligne (temps, points, bonus), puis le temps FINAL se décompte jusqu'au
// temps net. Ensuite, si le temps entre dans le top 10 de la borne, le joueur saisit 3 lettres au joystick : sa ligne se glisse à
// sa place dans le classement et suit les lettres en direct. Sinon il voit le classement. Le score est envoyé à l'API de la borne.
//
// Utilisation : this.scene.start("classement", { tempsBrutMs, points, tempsNetMs }) à la fin de la partie.
//   tempsBrutMs : le chrono tel qu'il s'est arrêté (millisecondes)
//   points      : le score de la partie (chaque point retire du temps, voir tempsNet dans points.js)
//   tempsNetMs  : le temps qui sert au classement (plus petit = meilleur)
//
// L'API de la borne classe du plus GRAND score au plus petit (voir app/db.py). Pour classer du plus RAPIDE au plus lent,
// on envoie donc "SCORE_BASE - temps net" : plus le temps est court, plus ce nombre est grand. On refait le calcul à l'envers
// pour afficher.
import { jouerSon } from "../systemes/sons.js";
import { creerTextureHalo } from "../mecanismes/lumiere.js"; // le halo doux, pour la lueur du fond

const SCORE_BASE = 10000000; // 10 millions de ms = presque 3 h : aucun temps réel ne peut le dépasser
const TEMPS_MAX_MS = 99 * 60000 + 59990; // l'affichage s'arrête à 99:59.99 (sinon le texte changerait de longueur)

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NB_LETTRES = 3; // le nom fait 3 lettres, comme sur une vraie borne
const TOUCHES_VALIDER = ["KeyI", "Enter", "Space"]; // I = le bouton de saut de la borne
const DELAI_AVANT_VALIDER = 900; // ms : le joueur tient encore ses boutons de jeu, on ignore les appuis au début

// les couleurs du HUD (voir PAL dans personnage/hud.js) et de la lanterne (or)
const PAL = { K: "#211924", a: "#251d2a", b: "#2f2535", c: "#372b3e", d: "#3f3249", m: "#5f4f6e", n: "#8a779b", L: "#ac98b6", W: "#e7e0e9", G: "#f5f0f8" };
export const OR = 0xffd45c;
const OR_SOMBRE = 0xc99a2e;
const ROSE = 0xf4b6c2; // le rose pâle du projet : la ligne du joueur
export const CLAIR = 0xf5f0f8;
export const LAVANDE = 0xac98b6;
export const GRIS_VIOLET = 0x8a779b;

function formaterTemps(ms) { // 83450 -> "01:23.45" (minutes:secondes.centièmes)
    const total = Math.floor(Math.min(Math.max(0, ms), TEMPS_MAX_MS) / 10); // en centièmes de seconde
    const deux = (n) => String(n).padStart(2, "0");
    return deux(Math.floor(total / 6000)) + ":" + deux(Math.floor(total / 100) % 60) + "." + deux(total % 100);
}
function tempsVersScore(tempsNetMs) { return SCORE_BASE - Math.round(tempsNetMs); } // ce qu'on envoie à l'API (entier)
function scoreVersTemps(score) { return SCORE_BASE - score; } // ce qu'on affiche

// le module de score de la borne n'existe que quand le jeu tourne dans la borne : on le charge au moment d'en avoir besoin,
// et s'il manque (jeu ouvert à part, pendant les tests) on continue sans classement au lieu de planter
async function chargerApi() {
    try { return await import("/static/js/score.js"); } catch (erreur) { console.warn("API de score indisponible :", erreur); return null; }
}

// ---------------------------------------------------------------------------------------------
// La police : des lettres de 5 x 7 pixels, haut clair et bas lavande sur une ombre, comme les chiffres du HUD
// ---------------------------------------------------------------------------------------------

const GLYPHES = {
    A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"], B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
    C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."], D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"], F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."], H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"], J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
    K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"], L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"], N: ["#...#", "##..#", "#.#.#", "#.#.#", "#..##", "#...#", "#...#"],
    O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."], P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"], R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."], T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."], V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"], X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
    Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."], Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
    0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."], 1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"], 3: [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
    4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."], 5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
    6: ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."], 7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
    8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."], 9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
    ":": [".....", "..#..", "..#..", ".....", "..#..", "..#..", "....."], ".": [".....", ".....", ".....", ".....", ".....", "..#..", "..#.."],
    "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."], "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
    "^": ["..#..", ".###.", "#####", ".....", ".....", ".....", "....."], "~": [".....", ".....", ".....", "#####", ".###.", "..#..", "....."]
};
const LARGEUR_CASE = 6; // une lettre fait 5 colonnes + 1 d'espace ; l'ombre prend la colonne et la ligne de plus

export function creerPolice(scene) { // dessine une seule fois toutes les lettres dans une image, avec une « image » par caractère
    if (scene.textures.exists("police_fin")) return;
    const noms = Object.keys(GLYPHES);
    const texture = scene.textures.createCanvas("police_fin", noms.length * LARGEUR_CASE, 8);
    const ctx = texture.getContext();
    noms.forEach((nom, i) => {
        const ox = i * LARGEUR_CASE;
        const cases = [];
        GLYPHES[nom].forEach((ligne, y) => [...ligne].forEach((c, x) => { if (c === "#") cases.push([x, y]); }));
        ctx.fillStyle = PAL.K; cases.forEach(([x, y]) => ctx.fillRect(ox + x + 1, y + 1, 1, 1)); // l'ombre portée
        cases.forEach(([x, y]) => { ctx.fillStyle = y <= 3 ? PAL.W : PAL.L; ctx.fillRect(ox + x, y, 1, 1); }); // clair en haut, lavande en bas
        texture.add(nom, 0, ox, 0, LARGEUR_CASE, 8);
    });
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
}

// écrit un texte (un groupe d'images, une par caractère). ancre : "centre", "gauche" ou "droite" par rapport à x. Les espaces sont vides.
export function ecrire(scene, x, y, texte, echelle, { ancre = "centre", teinte = 0xffffff, profondeur = 10 } = {}) {
    const largeur = texte.length * LARGEUR_CASE * echelle;
    const x0 = ancre === "gauche" ? x : ancre === "droite" ? x - largeur : x - largeur / 2;
    const groupe = scene.add.container(0, 0).setDepth(profondeur);
    groupe.lettres = [...texte].map((c, i) => {
        if (!GLYPHES[c]) return null; // espace ou caractère inconnu
        const image = scene.add.image(x0 + i * LARGEUR_CASE * echelle, y, "police_fin", c).setOrigin(0, 0.5).setScale(echelle).setTint(teinte);
        groupe.add(image);
        return image;
    });
    return groupe;
}

function changerTexte(groupe, texte) { // remplace les caractères d'un texte de même longueur (le décompte du temps)
    groupe.lettres.forEach((image, i) => { if (image && GLYPHES[texte[i]]) image.setFrame(texte[i]); });
}

// ---------------------------------------------------------------------------------------------
// Les plaques : la même construction que celles du HUD (contour sombre, filet clair en haut, ombre en bas, rivets, coins coupés)
// ---------------------------------------------------------------------------------------------

export function plaque(scene, w, h, creux = true) { // renvoie la clé de la texture ; w et h sont en pixels du dessin (agrandis à l'écran)
    const cle = "plaque_fin_" + w + "x" + h + (creux ? "c" : "");
    if (scene.textures.exists(cle)) return cle;
    const texture = scene.textures.createCanvas(cle, w, h);
    const ctx = texture.getContext();
    const px = (x, y, k) => { ctx.fillStyle = PAL[k]; ctx.fillRect(x, y, 1, 1); };
    const dedans = (x, y) => x >= 0 && x < w && y >= 0 && y < h && !((x < 2 || x >= w - 2) && (y < 2 || y >= h - 2)); // coins coupés
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!dedans(x, y)) continue;
        const bord = !dedans(x - 1, y) || !dedans(x + 1, y) || !dedans(x, y - 1) || !dedans(x, y + 1);
        px(x, y, bord ? "K" : "c");
    }
    for (let x = 3; x <= w - 4; x++) px(x, 1, "n"); // filet lumineux en haut
    for (let x = 2; x <= w - 3; x++) px(x, h - 2, "b"); // ombre en bas
    [[3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4]].forEach(([x, y]) => px(x, y, "L")); // les 4 rivets
    if (creux) { // un creux sombre où s'inscrit le texte : ombre en haut à gauche, bord clair en bas à droite
        for (let y = 6; y < h - 6; y++) for (let x = 6; x < w - 6; x++) {
            const hautGauche = y === 6 || x === 6;
            const basDroite = y === h - 7 || x === w - 7;
            px(x, y, hautGauche ? "K" : basDroite ? "d" : "a");
        }
    }
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return cle;
}

// ---------------------------------------------------------------------------------------------

export default class classement extends Phaser.Scene {
    constructor() { super({ key: "classement" }); }

    init(donnees) { // reçoit les données passées par scene.start
        this.tempsBrutMs = donnees.tempsBrutMs ?? 0;
        this.points = donnees.points ?? 0;
        this.tempsNetMs = donnees.tempsNetMs ?? this.tempsBrutMs;
    }

    create() {
        this.cameras.main.setBackgroundColor("#0e0e11");
        this.cameras.main.fadeIn(500, 0, 0, 0);
        creerPolice(this);
        this.etape = "intro"; // intro -> saisie (nouveau record) ou classement -> (envoi) -> classement
        this.pret = false; // les validations ne comptent qu'après un court délai
        this.sequenceFinie = false;
        this.apiPrete = false;
        this.nom = Array(NB_LETTRES).fill("A");
        this.curseur = 0;
        this.api = null;
        this.tableau = [];
        this.nomJoueur = null;
        this.clignote = [];

        this.decor();
        this.construirePanneaux();
        this.lancerSequence();
        this.input.keyboard.on("keydown", (evenement) => this.touche(evenement.code));
        this.charger();
    }

    // ---- le décor : une lueur, des colonnes, de la poussière qui monte (comme le menu) ----

    decor() {
        creerTextureHalo(this);
        const lueur = this.add.image(640, 150, "halo").setScale(9).setTint(GRIS_VIOLET).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.25).setDepth(0).setPipeline("SinglePipeline");
        this.tweens.add({ targets: lueur, alpha: 0.4, scale: 10, duration: 2600, yoyo: true, repeat: -1, ease: "Sine.InOut" });
        [60, 1220].forEach((x) => { // deux colonnes sur les bords, comme dans l'arène
            this.add.rectangle(x, 360, 56, 720, 0x15121a).setDepth(0);
            this.add.rectangle(x - 20, 360, 4, 720, 0x1d1824).setDepth(0);
        });
        if (!this.textures.exists("menu_poussiere")) {
            const carre = this.make.graphics({ add: false });
            carre.fillStyle(0xffffff); carre.fillRect(0, 0, 4, 4); carre.generateTexture("menu_poussiere", 4, 4); carre.destroy();
        }
        this.add.particles(0, 0, "menu_poussiere", {
            x: { min: 0, max: 1280 }, y: { min: 420, max: 720 }, speedY: { min: -26, max: -10 }, speedX: { min: -6, max: 6 },
            lifespan: 7000, frequency: 500, quantity: 1, alpha: { start: 0.3, end: 0 }, tint: 0xe7e0e9
        }).setDepth(0);
    }

    // ---- les deux plaques et leurs textes (créés tout de suite, cachés, puis révélés par la séquence) ----

    construirePanneaux() {
        const E = 3; // une plaque est dessinée en pixels de 3 x 3 à l'écran
        const poser = (x, y, w, h) => this.add.image(x, y, plaque(this, w, h)).setOrigin(0, 0).setScale(E).setDepth(1).setAlpha(0);
        this.plaqueGauche = poser(80, 168, 180, 156); // 540 x 468 px
        this.plaqueDroite = poser(660, 168, 180, 156);

        // titre
        this.titre = ecrire(this, 640, 62, "VICTOIRE", 9, { teinte: CLAIR, profondeur: 5 });
        this.titre.y = -140; // le conteneur est décalé hors de l'écran : l'animation le ramène à 0, et le texte arrive à sa vraie place (y = 62)
        this.sousTitre = ecrire(this, 640, 124, "DIEU DE LA LUMIERE VAINCU", 3, { teinte: GRIS_VIOLET, profondeur: 5 }).setAlpha(0);

        // panneau de gauche : le résultat
        const gauche = 112, droite = 590;
        const ligne = (y, nom, valeur, teinte) => ({ nom: ecrire(this, gauche, y, nom, 3, { ancre: "gauche", teinte: LAVANDE }), valeur: ecrire(this, droite, y, valeur, 3, { ancre: "droite", teinte }) });
        this.lignes = [
            ligne(212, "TEMPS", formaterTemps(this.tempsBrutMs), CLAIR),
            ligne(256, "POINTS", String(Math.min(this.points, 999999)).padStart(6, "0"), CLAIR),
            ligne(300, "BONUS", "-" + formaterTemps(this.tempsBrutMs - this.tempsNetMs), OR)
        ];
        this.lignes.forEach((l) => { l.nom.setAlpha(0); l.valeur.setAlpha(0); });
        this.separateur = this.add.rectangle(350, 336, 456, 3, 0x5f4f6e).setDepth(10).setAlpha(0);
        this.libelleFinal = ecrire(this, 350, 372, "TEMPS FINAL", 3, { teinte: GRIS_VIOLET }).setAlpha(0);
        this.tempsFinal = ecrire(this, 350, 434, formaterTemps(this.tempsBrutMs), 6, { teinte: CLAIR }).setAlpha(0);
        this.zoneNom = this.add.container(0, 0).setDepth(10); // la saisie du nom ou le message sous le temps final

        // panneau de droite : le classement
        this.entete = ecrire(this, 930, 206, "CLASSEMENT", 4, { teinte: CLAIR }).setAlpha(0);
        this.traitEntete = this.add.rectangle(930, 236, 456, 3, 0x5f4f6e).setDepth(10).setAlpha(0);
        this.groupeTableau = this.add.container(0, 0).setDepth(10);
        this.pied = ecrire(this, 640, 676, "", 2, { teinte: GRIS_VIOLET }); // l'aide des touches, en bas
    }

    // ---- la séquence d'ouverture ----

    lancerSequence() {
        const apres = (delai, action) => this.time.delayedCall(delai, action);
        const montrer = (cibles, duree = 280) => this.tweens.add({ targets: cibles, alpha: 1, duration: duree });
        apres(300, () => { // le titre tombe, rebondit, puis « glitche » un instant
            this.tweens.add({ targets: this.titre, y: 0, duration: 520, ease: "Bounce.Out" });
            this.tweens.add({ targets: this.titre, alpha: { from: 1, to: 0.35 }, duration: 60, yoyo: true, repeat: 3, delay: 800 });
            jouerSon(this, "porte");
        });
        apres(850, () => { montrer(this.sousTitre); montrer([this.plaqueGauche, this.plaqueDroite], 350); });
        apres(1250, () => { montrer([this.lignes[0].nom, this.lignes[0].valeur]); montrer([this.entete, this.traitEntete]); this.afficherTableau(); });
        apres(1550, () => montrer([this.lignes[1].nom, this.lignes[1].valeur]));
        apres(1850, () => { montrer([this.lignes[2].nom, this.lignes[2].valeur]); jouerSon(this, "ennemi_touche"); });
        apres(2250, () => montrer([this.separateur, this.libelleFinal, this.tempsFinal]));
        apres(2700, () => { // le temps FINAL se décompte jusqu'au temps net : les points « mangent » le temps
            const etat = { v: this.tempsBrutMs };
            this.tweens.add({
                targets: etat, v: this.tempsNetMs, duration: 1200, ease: "Cubic.Out",
                onUpdate: () => changerTexte(this.tempsFinal, formaterTemps(etat.v)),
                onComplete: () => {
                    changerTexte(this.tempsFinal, formaterTemps(this.tempsNetMs));
                    this.tempsFinal.lettres.forEach((l) => l && l.setTint(OR)); // il devient doré : c'est le résultat
                    this.tweens.add({ targets: this.tempsFinal, scale: 1.12, duration: 110, yoyo: true });
                    jouerSon(this, "lanterne");
                    this.sequenceFinie = true;
                    this.decider();
                }
            });
        });
    }

    // ---- l'API : le top 10 actuel ----

    async charger() {
        this.api = await chargerApi();
        if (this.api) this.tableau = await this.api.get_tab_score(this.sys.game.config.idGame);
        this.apiPrete = true;
        this.decider(); // si la séquence n'est pas finie, elle appellera decider() à sa fin
    }

    decider() { // la séquence est finie et le classement chargé : saisie du nom ou simple affichage
        if (!this.sequenceFinie || !this.apiPrete || this.etape !== "intro") return;
        const score = tempsVersScore(this.tempsNetMs);
        const dernier = this.tableau[this.tableau.length - 1];
        const nouveauRecord = Boolean(this.api) && (this.tableau.length < 10 || score > dernier.score); // à égalité on ne passe pas devant
        this.pret = false;
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; });
        if (nouveauRecord) this.ouvrirSaisie();
        else this.ouvrirClassement(this.api ? "PAS DANS LE TOP 10" : "CLASSEMENT INDISPONIBLE");
    }

    // ---- la saisie du nom : trois cases, la case choisie en or avec une flèche au-dessus et en dessous ----

    ouvrirSaisie() {
        this.etape = "saisie";
        this.zoneNom.removeAll(true);
        const banniere = ecrire(this, 350, 492, "NOUVEAU RECORD", 4, { teinte: OR });
        this.tweens.add({ targets: banniere, alpha: 0.45, duration: 480, yoyo: true, repeat: -1 });
        this.zoneNom.add(banniere);
        this.cases = [];
        for (let i = 0; i < NB_LETTRES; i++) {
            const x = 350 + (i - 1) * 78;
            const fond = this.add.image(x, 568, plaque(this, 22, 24, false)).setScale(3);
            const lettre = ecrire(this, x - 14, 568, "A", 6, { ancre: "gauche" });
            const haut = ecrire(this, x - 9, 522, "^", 3, { ancre: "gauche", teinte: OR });
            const bas = ecrire(this, x - 9, 614, "~", 3, { ancre: "gauche", teinte: OR });
            this.cases.push({ fond, lettre, haut, bas });
            this.zoneNom.add([fond, lettre, haut, bas]);
        }
        this.pied.destroy();
        this.pied = ecrire(this, 640, 696, "HAUT BAS  LETTRE    GAUCHE DROITE  CASE    I  VALIDER", 2, { teinte: GRIS_VIOLET });
        this.afficherNom();
        this.afficherTableau();
    }

    afficherNom() {
        this.cases.forEach((c, i) => {
            const choisie = i === this.curseur;
            c.fond.setTint(choisie ? OR : 0xffffff);
            changerTexte(c.lettre, this.nom[i]);
            c.lettre.lettres[0].setTint(choisie ? OR : LAVANDE);
            c.haut.setVisible(choisie); c.bas.setVisible(choisie);
        });
    }

    ouvrirClassement(message, couleur = GRIS_VIOLET) { // le classement seul, sous le temps final
        this.etape = "classement";
        this.zoneNom.removeAll(true);
        this.zoneNom.add(ecrire(this, 350, 540, message, 3, { teinte: couleur }));
        this.pied.destroy();
        this.pied = ecrire(this, 640, 696, "I  REJOUER", 3, { teinte: CLAIR });
        this.tweens.add({ targets: this.pied, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });
        this.afficherTableau();
    }

    // ---- les touches ----

    touche(code) {
        const valider = TOUCHES_VALIDER.includes(code);
        if (this.etape === "saisie") {
            if (code === "ArrowUp" || code === "ArrowDown") {
                const decalage = code === "ArrowUp" ? 1 : -1;
                const index = (LETTRES.indexOf(this.nom[this.curseur]) + decalage + LETTRES.length) % LETTRES.length; // % : on boucle de Z à A
                this.nom[this.curseur] = LETTRES[index];
            } else if (code === "ArrowLeft") {
                this.curseur = Math.max(0, this.curseur - 1);
            } else if (code === "ArrowRight") {
                this.curseur = Math.min(NB_LETTRES - 1, this.curseur + 1);
            } else if (valider && this.pret) {
                this.envoyer();
                return;
            }
            this.afficherNom();
            this.afficherTableau(); // la ligne du joueur suit les lettres
        } else if (this.etape === "classement" && valider && this.pret) {
            jouerSon(this, "porte");
            this.scene.start("menu"); // retour à l'accueil, pour la partie suivante
        }
    }

    async envoyer() {
        this.etape = "envoi"; // bloque les appuis pendant l'envoi
        const nom = this.nom.join("");
        jouerSon(this, "porte");
        const resultat = await this.api.ajoute_score(this.sys.game.config.idGame, nom, tempsVersScore(this.tempsNetMs));
        this.tableau = await this.api.get_tab_score(this.sys.game.config.idGame); // le tableau à jour, avec le nouveau temps
        this.nomJoueur = resultat.success ? nom : null; // pour surligner sa ligne
        this.pret = false;
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; });
        this.ouvrirClassement(resultat.success ? "ENREGISTRE" : "ERREUR D'ENVOI", resultat.success ? OR : 0xff6b6b);
    }

    // ---- le classement : 10 lignes, la ligne du joueur en rose ----

    lignesTableau() { // les 10 lignes à afficher : le top 10 de la borne, avec la ligne du joueur glissée à sa place pendant la saisie
        const net = Math.round(this.tempsNetMs);
        const reel = this.tableau.map((l) => ({ nom: String(l.player), temps: scoreVersTemps(l.score) }));
        if (this.etape === "saisie") {
            const i = reel.findIndex((l) => l.temps > net); // à égalité, le joueur passe derrière
            reel.splice(i === -1 ? reel.length : i, 0, { nom: this.nom.join(""), temps: net, moi: true });
        } else if (this.nomJoueur) {
            const moi = reel.find((l) => l.nom === this.nomJoueur && l.temps === net);
            if (moi) moi.moi = true;
        }
        return reel.slice(0, 10);
    }

    afficherTableau() {
        this.groupeTableau.removeAll(true);
        this.clignote.forEach((t) => t.stop());
        this.clignote = [];
        const lignes = this.lignesTableau();
        const couleurRang = [OR, 0xe7e0e9, OR_SOMBRE];
        for (let i = 0; i < 10; i++) {
            const y = 268 + i * 36;
            const l = lignes[i];
            const teinte = l ? (l.moi ? ROSE : i < 3 ? couleurRang[i] : LAVANDE) : 0x5f4f6e;
            const elements = [];
            if (l && l.moi) elements.push(this.add.rectangle(930, y, 480, 32, 0x372b3e, 0.9)); // un fond derrière la ligne du joueur
            elements.push(ecrire(this, 700, y, String(i + 1).padStart(2, "0"), 3, { ancre: "gauche", teinte }));
            elements.push(ecrire(this, 790, y, l ? l.nom.padEnd(NB_LETTRES, " ") : "---", 3, { ancre: "gauche", teinte }));
            elements.push(ecrire(this, 1168, y, l ? formaterTemps(l.temps) : "--:--.--", 3, { ancre: "droite", teinte }));
            this.groupeTableau.add(elements);
            if (l && l.moi) this.clignote.push(this.tweens.add({ targets: elements, alpha: 0.55, duration: 380, yoyo: true, repeat: -1 }));
        }
    }
}
