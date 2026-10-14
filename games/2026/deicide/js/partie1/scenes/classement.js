// classement.js : l'écran de fin de partie, dans le style du HUD (plaques d'armure, chiffres à deux tons, palette lavande et or)
// Déroulé : le titre tombe, le résultat s'affiche ligne par ligne (temps, points, bonus), puis le temps FINAL se décompte jusqu'au
// temps net. Ensuite, si le temps entre dans le top 10 de la borne, le joueur saisit 3 lettres au joystick : sa ligne se glisse à
// sa place dans le classement et suit les lettres en direct. Sinon il voit le classement. Le panthéon est sauvegardé avec lireDonneesJSON et
// ecrireDonneesJSON (voir js/donnees.js) : dans la base de la borne, ou dans le navigateur quand le jeu tourne sur un ordinateur.
//
// Utilisation : this.scene.start("classement", { tempsBrutMs, points, tempsNetMs }) à la fin de la partie.
//   tempsBrutMs : le chrono tel qu'il s'est arrêté (millisecondes)
//   points      : le score de la partie (chaque point retire du temps, voir tempsNet dans points.js)
//   tempsNetMs  : le temps qui sert au classement (plus petit = meilleur)
//
import { jouerSon } from "../systemes/sons.js";
import { creerTextureHalo, creerTexturePixel, creerPolice, plaque, GLYPHES, LARGEUR_CASE } from "../systemes/dessins.js"; // les dessins faits en code (halo, particules, police pixel, plaques)

const TEMPS_MAX_MS = 99 * 60000 + 59990; // l'affichage s'arrête à 99:59.99 (sinon le texte changerait de longueur)

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ "; // les 27 caractères qui défilent : l'alphabet et une case vide (le dernier)
const COL_NET = 996, COL_BRUT = 1104, COL_MORTS = 1172; // la fin (côté droit) de chaque colonne du tableau
const NB_LETTRES = 6; // le nom fait 6 caractères au plus : on peut n'en remplir que quelques-uns, les autres restent vides
const TOUCHES_VALIDER = ["KeyI", "Enter", "Space"]; // I = le bouton de saut de la borne
const DELAI_AVANT_VALIDER = 900; // ms : le joueur tient encore ses boutons de jeu, on ignore les appuis au début

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
// Le panthéon est une simple LISTE, sauvegardée d'un bloc : un objet par partie enregistrée.
//   { nom: "ABC", net: temps net (ms), brut: temps total (ms), morts: nombre de morts, date: "2026-10-13" }
// Elle est triée du temps net le plus COURT au plus long ; à égalité, le temps total le plus court, puis le moins de morts. Elle ne garde que les 10 meilleurs.
const MAX_LIGNES = 10;
const MORTS_MAX = 99;
const arrondi = (ms) => Math.round(ms / 10) * 10; // les temps sont gardés au centième de seconde, comme à l'affichage
function comparer(a, b) {
    return a.net - b.net || a.brut - b.brut || a.morts - b.morts;
}
const valide = (l) => l && typeof l.nom === "string" && Number.isFinite(l.net) && Number.isFinite(l.brut) && Number.isFinite(l.morts); // (on ignore une ligne abîmée)

// Lit le panthéon sauvegardé : la liste triée (vide s'il n'y a rien encore), ou null si le stockage est impossible à lire. ecrireDonneesJSON remplace TOUT :
// pour ajouter une ligne, on lit, on ajoute, puis on réécrit (voir envoyer).
async function lirePantheon() {
    if (typeof lireDonneesJSON !== "function") return null; // js/donnees.js n'est pas chargé
    try {
        const liste = await lireDonneesJSON();
        return Array.isArray(liste) ? liste.filter(valide).sort(comparer).slice(0, MAX_LIGNES) : [];
    } catch (erreur) {
        console.warn("Panthéon illisible :", erreur);
        return null;
    }
}

// ---------------------------------------------------------------------------------------------
// Écrire avec la police pixel (la police elle-même est dessinée en code : voir creerPolice dans systemes/dessins.js)
// ---------------------------------------------------------------------------------------------

// écrit un texte (un groupe d'images, une par caractère). ancre : "centre", "gauche" ou "droite" par rapport à x. Les espaces sont vides.
export function ecrire(scene, x, y, texte, echelle, { ancre = "centre", teinte = 0xffffff, profondeur = 10, police = "police_fin" } = {}) {
    const largeur = texte.length * LARGEUR_CASE * echelle;
    const x0 = ancre === "gauche" ? x : ancre === "droite" ? x - largeur : x - largeur / 2;
    const groupe = scene.add.container(0, 0).setDepth(profondeur);
    groupe.lettres = [...texte].map((c, i) => {
        if (!GLYPHES[c]) return null; // espace ou caractère inconnu
        const image = scene.add.image(x0 + i * LARGEUR_CASE * echelle, y, police, c).setOrigin(0, 0.5).setScale(echelle).setTint(teinte);
        groupe.add(image);
        return image;
    });
    return groupe;
}

function changerTexte(groupe, texte) { // remplace les caractères d'un texte de même longueur (le décompte du temps)
    groupe.lettres.forEach((image, i) => { if (image && GLYPHES[texte[i]]) image.setFrame(texte[i]); });
}

// ---------------------------------------------------------------------------------------------

export default class classement extends Phaser.Scene {
    constructor(cle = "classement") { super({ key: cle }); } // (la partie 2 en fait un faux écran de victoire : voir partie2/faux_pantheon.js)

    init(donnees) { // reçoit les données passées par scene.start
        this.tempsBrutMs = donnees.tempsBrutMs ?? 0;
        this.points = donnees.points ?? 0;
        this.tempsNetMs = donnees.tempsNetMs ?? this.tempsBrutMs;
        this.morts = donnees.morts ?? 0;
    }

    create() {
        this.cameras.main.setBackgroundColor("#0e0e11");
        this.cameras.main.fadeIn(500, 0, 0, 0);
        creerPolice(this);
        this.etape = "intro"; // intro -> choix (nouveau record) -> saisie -> (envoi) -> classement ; ou intro -> classement
        this.enregistrer = 0; // le choix « enregistrer mon score » : 0 = OUI, 1 = NON
        this.pret = false; // les validations ne comptent qu'après un court délai
        this.sequenceFinie = false;
        this.donneesPretes = false;
        this.nom = ["A", ...Array(NB_LETTRES - 1).fill(" ")]; // la première case commence à A, les autres sont vides
        this.curseur = 0;
        this.pantheonDispo = false; // vrai si le panthéon a pu être lu (donc écrit)
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
        creerTexturePixel(this, "menu_poussiere");
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
            ligne(202, "TEMPS TOTAL", formaterTemps(this.tempsBrutMs), CLAIR), // le temps réel de la partie, sans rien retirer
            ligne(238, "MORTS", String(Math.min(this.morts, MORTS_MAX)).padStart(2, "0"), CLAIR),
            ligne(274, "POINTS", String(Math.min(this.points, 999999)).padStart(6, "0"), CLAIR),
            ligne(310, "BONUS", "-" + formaterTemps(this.tempsBrutMs - this.tempsNetMs), OR)
        ];
        this.lignes.forEach((l) => { l.nom.setAlpha(0); l.valeur.setAlpha(0); });
        this.separateur = this.add.rectangle(350, 340, 456, 3, 0x5f4f6e).setDepth(10).setAlpha(0);
        this.libelleFinal = ecrire(this, 350, 372, "TEMPS NET", 3, { teinte: GRIS_VIOLET }).setAlpha(0);
        this.tempsFinal = ecrire(this, 350, 432, formaterTemps(this.tempsBrutMs), 6, { teinte: CLAIR }).setAlpha(0);
        this.zoneNom = this.add.container(0, 0).setDepth(10); // la saisie du nom ou le message sous le temps final

        // panneau de droite : le classement
        this.entete = ecrire(this, 930, 200, "PANTHEON", 4, { teinte: CLAIR }).setAlpha(0);
        this.traitEntete = this.add.rectangle(930, 228, 456, 3, 0x5f4f6e).setDepth(10).setAlpha(0);
        // les titres des colonnes : le temps net (celui qui classe), le temps total et le nombre de morts
        this.titresColonnes = [ecrire(this, COL_NET, 246, "NET", 2, { ancre: "droite", teinte: GRIS_VIOLET }), ecrire(this, COL_BRUT, 246, "TOTAL", 2, { ancre: "droite", teinte: GRIS_VIOLET }),
            ecrire(this, COL_MORTS, 246, "MORTS", 2, { ancre: "droite", teinte: GRIS_VIOLET })];
        this.titresColonnes.forEach((t) => t.setAlpha(0));
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
        apres(1250, () => { montrer([this.lignes[0].nom, this.lignes[0].valeur]); montrer([this.entete, this.traitEntete, ...this.titresColonnes]); this.afficherTableau(); });
        apres(1500, () => montrer([this.lignes[1].nom, this.lignes[1].valeur]));
        apres(1750, () => montrer([this.lignes[2].nom, this.lignes[2].valeur]));
        apres(2000, () => { montrer([this.lignes[3].nom, this.lignes[3].valeur]); jouerSon(this, "ennemi_touche"); });
        apres(2400, () => montrer([this.separateur, this.libelleFinal, this.tempsFinal]));
        apres(2850, () => { // le temps FINAL se décompte jusqu'au temps net : les points « mangent » le temps
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

    monResultat() { // les chiffres de cette partie, tels qu'ils seront rangés dans le panthéon (sans le nom)
        return { net: arrondi(this.tempsNetMs), brut: arrondi(this.tempsBrutMs), morts: Math.min(MORTS_MAX, this.morts) };
    }

    async charger() {
        const liste = await lirePantheon();
        this.pantheonDispo = liste !== null;
        this.tableau = liste || [];
        this.donneesPretes = true;
        this.decider(); // si la séquence n'est pas finie, elle appellera decider() à sa fin
    }

    decider() { // la séquence est finie et le classement chargé : saisie du nom ou simple affichage
        if (!this.sequenceFinie || !this.donneesPretes || this.etape !== "intro") return;
        const mien = this.monResultat();
        const pire = this.tableau[this.tableau.length - 1]; // le dernier du panthéon : le temps le plus long
        const nouveauRecord = this.pantheonDispo && (this.tableau.length < MAX_LIGNES || comparer(mien, pire) < 0); // à égalité on ne passe pas devant
        this.pret = false;
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; });
        if (nouveauRecord) this.ouvrirChoix();
        else this.ouvrirClassement(this.pantheonDispo ? "PAS DANS LE TOP 10" : "PANTHEON INDISPONIBLE");
    }

    // ---- le choix d'enregistrer son score ou non : deux petits boutons OUI / NON sous la bannière « nouveau record » ----

    ouvrirChoix() {
        this.etape = "choix";
        this.zoneNom.removeAll(true);
        const banniere = ecrire(this, 350, 482, "NOUVEAU RECORD", 4, { teinte: OR });
        this.tweens.add({ targets: banniere, alpha: 0.45, duration: 480, yoyo: true, repeat: -1 });
        this.zoneNom.add([banniere, ecrire(this, 350, 524, "ENREGISTRER TON SCORE", 3, { teinte: CLAIR })]);
        this.boutonsChoix = ["OUI", "NON"].map((nom, i) => {
            const x = 350 + (i === 0 ? -80 : 80);
            const fond = this.add.image(x, 590, plaque(this, 32, 16, false)).setScale(3);
            const mot = ecrire(this, x, 590, nom, 5);
            this.zoneNom.add([fond, mot]);
            return { fond, mot };
        });
        this.pied.destroy();
        this.pied = ecrire(this, 640, 696, "GAUCHE DROITE  CHOISIR    I  VALIDER", 2, { teinte: GRIS_VIOLET });
        this.afficherChoix();
    }

    afficherChoix() { // le choix en cours en or, l'autre éteint
        this.boutonsChoix.forEach((b, i) => {
            const choisi = i === this.enregistrer;
            b.fond.setTint(choisi ? OR : 0xffffff).setAlpha(choisi ? 1 : 0.55);
            b.mot.lettres.forEach((l) => l && l.setTint(choisi ? OR : GRIS_VIOLET));
        });
    }

    validerChoix() {
        jouerSon(this, "porte");
        this.pret = false; // la même touche ne doit pas valider aussi la saisie du nom
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; });
        if (this.enregistrer === 0) this.ouvrirSaisie();
        else this.ouvrirClassement("SCORE NON ENREGISTRE"); // le joueur ne veut pas apparaître dans le panthéon
    }

    // ---- la saisie du nom : six cases, la case choisie en or avec une flèche au-dessus et en dessous ----

    ouvrirSaisie() {
        this.etape = "saisie";
        this.zoneNom.removeAll(true);
        const banniere = ecrire(this, 350, 492, "NOUVEAU RECORD", 4, { teinte: OR });
        this.tweens.add({ targets: banniere, alpha: 0.45, duration: 480, yoyo: true, repeat: -1 });
        this.zoneNom.add(banniere);
        this.cases = [];
        for (let i = 0; i < NB_LETTRES; i++) {
            const x = 350 + (i - (NB_LETTRES - 1) / 2) * 78; // les cases sont centrées sous le résultat
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
            const vide = this.nom[i] === " "; // une case vide n'affiche aucune lettre
            c.lettre.setVisible(!vide);
            if (!vide) changerTexte(c.lettre, this.nom[i]);
            c.lettre.lettres[0].setTint(choisie ? OR : LAVANDE);
            c.haut.setVisible(choisie); c.bas.setVisible(choisie);
        });
    }

    ouvrirClassement(message, couleur = GRIS_VIOLET) { // le classement seul, sous le temps final
        this.etape = "classement";
        this.zoneNom.removeAll(true);
        this.zoneNom.add(ecrire(this, 350, 540, message, 3, { teinte: couleur }));
        this.pied.destroy();
        this.pied = ecrire(this, 640, 696, "I  RETOUR A L'ACCUEIL", 3, { teinte: CLAIR });
        this.tweens.add({ targets: this.pied, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });
        this.afficherTableau();
    }

    // ---- les touches ----

    touche(code) {
        const valider = TOUCHES_VALIDER.includes(code);
        if (this.etape === "choix") {
            if (code === "ArrowLeft" || code === "ArrowRight") { this.enregistrer = code === "ArrowLeft" ? 0 : 1; this.afficherChoix(); }
            else if (valider && this.pret) this.validerChoix();
        } else if (this.etape === "saisie") {
            if (code === "ArrowUp" || code === "ArrowDown") {
                const decalage = code === "ArrowUp" ? 1 : -1;
                const index = (LETTRES.indexOf(this.nom[this.curseur]) + decalage + LETTRES.length) % LETTRES.length; // % : on boucle de Z à A
                this.nom[this.curseur] = LETTRES[index];
            } else if (code === "ArrowLeft") {
                this.curseur = Math.max(0, this.curseur - 1);
            } else if (code === "ArrowRight") {
                this.curseur = Math.min(NB_LETTRES - 1, this.curseur + 1);
            } else if (valider && this.pret) {
                if (this.nom.join("").trim() === "") return; // au moins un caractère : un nom entièrement vide n'est pas accepté
                this.envoyer();
                return;
            }
            this.afficherNom();
            this.afficherTableau(); // la ligne du joueur suit les lettres
        } else if (this.etape === "classement" && valider && this.pret) {
            jouerSon(this, "porte");
            this.sound.stopAll();
            this.scene.start("menu"); // la fin du jeu : le panthéon est la dernière chose vue (les crédits sont passés avant), retour à l'accueil pour la partie suivante
        }
    }

    async envoyer() {
        this.etape = "envoi"; // bloque les appuis pendant l'envoi
        const nom = this.nom.join("").trimEnd(); // les cases vides à la fin ne sont pas gardées : « AB    » devient « AB »
        jouerSon(this, "porte");
        let reussi = true;
        try {
            const liste = await lirePantheon(); // on relit juste avant d'écrire : ecrireDonneesJSON remplace tout le contenu précédent
            if (liste === null) throw new Error("panthéon illisible");
            liste.push({ nom, ...this.monResultat(), date: new Date().toISOString().slice(0, 10) });
            this.tableau = liste.sort(comparer).slice(0, MAX_LIGNES);
            await ecrireDonneesJSON(this.tableau);
        } catch (erreur) {
            console.warn("Enregistrement impossible :", erreur);
            reussi = false;
        }
        this.nomJoueur = reussi ? nom : null; // pour surligner sa ligne
        this.pret = false;
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; });
        this.ouvrirClassement(reussi ? "ENREGISTRE" : "ERREUR D'ENVOI", reussi ? OR : 0xff6b6b);
    }

    // ---- le classement : 10 lignes, la ligne du joueur en rose ----

    lignesTableau() { // les 10 lignes à afficher : le top 10 de la borne, avec la ligne du joueur glissée à sa place pendant la saisie
        const mien = this.monResultat(); // mes chiffres, arrondis comme dans le panthéon
        const reel = this.tableau.map((l) => ({ ...l })); // le panthéon est déjà trié : le temps le plus court en premier (on en fait une copie : on y glisse la ligne du joueur)
        if (this.etape === "saisie") {
            const i = reel.findIndex((l) => comparer(mien, l) < 0); // à égalité parfaite, le joueur passe derrière
            reel.splice(i === -1 ? reel.length : i, 0, { nom: this.nom.join(""), ...mien, moi: true });
        } else if (this.nomJoueur) {
            const moi = reel.find((l) => l.nom === this.nomJoueur && l.net === mien.net && l.brut === mien.brut && l.morts === mien.morts);
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
            const y = 276 + i * 34;
            const l = lignes[i];
            const teinte = l ? (l.moi ? ROSE : i < 3 ? couleurRang[i] : LAVANDE) : 0x5f4f6e;
            const elements = [];
            if (l && l.moi) elements.push(this.add.rectangle(925, y, 500, 32, 0x372b3e, 0.9)); // un fond derrière la ligne du joueur
            const secondaire = l && l.moi ? ROSE : 0x8a779b; // le temps total et les morts sont plus discrets que le temps net
            elements.push(ecrire(this, 680, y, String(i + 1).padStart(2, "0"), 3, { ancre: "gauche", teinte }));
            elements.push(ecrire(this, 724, y, l ? l.nom.padEnd(NB_LETTRES, " ") : "---", 3, { ancre: "gauche", teinte }));
            elements.push(ecrire(this, COL_NET, y, l ? formaterTemps(l.net) : "--:--.--", 3, { ancre: "droite", teinte }));
            elements.push(ecrire(this, COL_BRUT, y, l ? formaterTemps(l.brut) : "--:--.--", 2, { ancre: "droite", teinte: l ? secondaire : teinte }));
            elements.push(ecrire(this, COL_MORTS, y, l ? String(l.morts).padStart(2, "0") : "--", 2, { ancre: "droite", teinte: l ? secondaire : teinte }));
            this.groupeTableau.add(elements);
            if (l && l.moi) this.clignote.push(this.tweens.add({ targets: elements, alpha: 0.55, duration: 380, yoyo: true, repeat: -1 }));
        }
    }
}
