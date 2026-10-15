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
// Depuis le menu (bouton CLASSEMENT) : this.scene.start("classement", { consultation: true }) montre seulement le panthéon, sans animation
// et sans saisie : un appui sur I (ou Entrée, Espace) ramène à l'accueil.
//
import { jouerSon } from "../systemes/sons.js"; // les bruitages
import { creerTextureHalo, creerTexturePixel, creerPolice, plaque, GLYPHES, LARGEUR_CASE } from "../systemes/dessins_en_code.js"; // les dessins faits en code (halo, particules, police pixel, plaques)

const TEMPS_MAX_MS = 99 * 60000 + 59990; // l'affichage s'arrête à 99:59.99 (sinon le texte changerait de longueur)

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ "; // les 27 caractères qui défilent : l'alphabet et une case vide (le dernier)
const COL_NET = 984, COL_BRUT = 1086, COL_MORTS = 1140, COL_COUPS = 1186; // la fin (côté droit) de chaque colonne du tableau
const NB_LETTRES = 6; // le nom fait 6 caractères au plus : on peut n'en remplir que quelques-uns, les autres restent vides
const TOUCHES_VALIDER = ["KeyI", "Enter", "Space"]; // I = le bouton de saut de la borne
const DELAI_AVANT_VALIDER = 900; // ms : le joueur tient encore ses boutons de jeu, on ignore les appuis au début

export const OR = 0xffd45c; // la couleur or
const OR_SOMBRE = 0xc99a2e; // un or plus foncé
const ROSE = 0xf4b6c2; // le rose pâle du projet : la ligne du joueur
export const CLAIR = 0xf5f0f8; // la couleur claire du texte
export const LAVANDE = 0xac98b6; // la couleur lavande
export const GRIS_VIOLET = 0x8a779b; // la couleur gris-violet

function formaterTemps(ms) { // 83450 -> "01:23.45" (minutes:secondes.centièmes)
    const total = Math.floor(Math.min(Math.max(0, ms), TEMPS_MAX_MS) / 10); // en centièmes de seconde
    const deux = (n) => String(n).padStart(2, "0"); // écrit un nombre sur deux chiffres
    return deux(Math.floor(total / 6000)) + ":" + deux(Math.floor(total / 100) % 60) + "." + deux(total % 100); // on assemble minutes, secondes et centièmes
}
// Le panthéon est une simple LISTE, sauvegardée d'un bloc : un objet par partie enregistrée.
//   { nom: "ABC", net: temps net (ms), brut: temps total (ms), morts: nombre de morts, coups: coups reçus, date: "2026-10-13" }
// Elle est triée du temps net le plus COURT au plus long ; à égalité, le temps total le plus court, puis le moins de morts. Elle ne garde que les 10 meilleurs.
const MAX_LIGNES = 10; // le panthéon garde 10 lignes
const MORTS_MAX = 99; // nombre de morts maximum affiché
const COUPS_MAX = 99; // (deux chiffres à l'écran)
const arrondi = (ms) => Math.round(ms / 10) * 10; // les temps sont gardés au centième de seconde, comme à l'affichage
function comparer(a, b) { // compare deux parties : temps net, puis temps total, puis nombre de morts
    return a.net - b.net || a.brut - b.brut || a.morts - b.morts; // le plus petit gagne : on renvoie un nombre négatif si a est meilleur
}
// Une seule ligne par nom : on ajoute la ligne du joueur à la liste, on trie, et on ne garde que le MEILLEUR temps de chaque nom (à égalité parfaite, l'ancienne ligne reste).
// Renvoie la nouvelle liste (10 lignes au plus) et « gardee » : vrai si la ligne du joueur y est (son temps bat l'ancien du même nom, ou le nom est nouveau).
function fusionner(liste, ligne) { // ajoute une ligne au panthéon sans doublon de nom
    const triee = [...liste, ligne].sort(comparer); // on ajoute la ligne et on trie
    const vus = new Set(); // les noms déjà vus
    const sansDoublon = triee.filter((l) => !vus.has(l.nom) && vus.add(l.nom)); // trié : la première ligne d'un nom est sa meilleure
    return { liste: sansDoublon.slice(0, MAX_LIGNES), gardee: sansDoublon.slice(0, MAX_LIGNES).includes(ligne) }; // on renvoie les 10 meilleures lignes et si celle du joueur en fait partie
}
const valide = (l) => l && typeof l.nom === "string" && Number.isFinite(l.net) && Number.isFinite(l.brut) && Number.isFinite(l.morts); // (on ignore une ligne abîmée)

// Lit le panthéon sauvegardé : la liste triée (vide s'il n'y a rien encore), ou null si le stockage est impossible à lire. ecrireDonneesJSON remplace TOUT :
// pour ajouter une ligne, on lit, on ajoute, puis on réécrit (voir envoyer).
async function lirePantheon() { // lit le panthéon sauvegardé
    if (typeof lireDonneesJSON !== "function") return null; // js/donnees.js n'est pas chargé
    try { // on essaie de lire
        const liste = await lireDonneesJSON(); // on lit la liste sauvegardée
        return Array.isArray(liste) ? liste.filter(valide).sort(comparer).slice(0, MAX_LIGNES) : []; // on garde les lignes valides, triées, limitées à 10
    } catch (erreur) { // si la lecture échoue...
        console.warn("Panthéon illisible :", erreur); // ...on le signale dans la console...
        return null; // ...et on renvoie null
    }
}

// ---------------------------------------------------------------------------------------------
// Écrire avec la police pixel (la police elle-même est dessinée en code : voir creerPolice dans systemes/dessins_en_code.js)
// ---------------------------------------------------------------------------------------------

// écrit un texte (un groupe d'images, une par caractère). ancre : "centre", "gauche" ou "droite" par rapport à x. Les espaces sont vides.
export function ecrire(scene, x, y, texte, echelle, { ancre = "centre", teinte = 0xffffff, profondeur = 10, police = "police_fin" } = {}) { // écrit un texte avec la police pixel (une image par lettre)
    const largeur = texte.length * LARGEUR_CASE * echelle; // largeur totale du texte
    const x0 = ancre === "gauche" ? x : ancre === "droite" ? x - largeur : x - largeur / 2; // x de départ selon l'ancrage (gauche, droite ou centre)
    const groupe = scene.add.container(0, 0).setDepth(profondeur); // le groupe qui contient les lettres
    groupe.lettres = [...texte].map((c, i) => { // on crée une image par lettre
        if (!GLYPHES[c]) return null; // espace ou caractère inconnu
        const image = scene.add.image(x0 + i * LARGEUR_CASE * echelle, y, police, c).setOrigin(0, 0.5).setScale(echelle).setTint(teinte); // la lettre à sa place, agrandie et teintée
        groupe.add(image); // on la range dans le groupe
        return image; // on la renvoie
    });
    return groupe; // on renvoie le groupe de lettres
}

function changerTexte(groupe, texte) { // remplace les caractères d'un texte de même longueur (le décompte du temps)
    groupe.lettres.forEach((image, i) => { if (image && GLYPHES[texte[i]]) image.setFrame(texte[i]); }); // pour chaque lettre, on change l'image affichée
}

// ---------------------------------------------------------------------------------------------

export default class classement extends Phaser.Scene { // la scène de l'écran de fin et du panthéon
    constructor(cle = "classement") { super({ key: cle }); } // (la partie 2 en fait un faux écran de victoire : voir partie2/faux_pantheon.js)

    init(donnees) { // reçoit les données passées par scene.start
        this.tempsBrutMs = donnees.tempsBrutMs ?? 0; // le temps brut
        this.points = donnees.points ?? 0; // les points
        this.tempsNetMs = donnees.tempsNetMs ?? this.tempsBrutMs; // le temps net
        this.morts = donnees.morts ?? 0; // le nombre de morts
        this.coups = donnees.coups ?? 0; // les coups reçus pendant la partie : chaque fois que le robot perd un PV
        this.consultation = donnees.consultation ?? false; // vrai quand on vient du bouton CLASSEMENT du menu : on regarde le panthéon, c'est tout
    }

    create() { // construit l'écran
        this.cameras.main.setBackgroundColor("#0e0e11"); // fond sombre
        if (!this.consultation) this.cameras.main.fadeIn(500, 0, 0, 0); // fondu d'entrée, sauf en consultation
        creerPolice(this); // on prépare la police pixel
        this.etape = "intro"; // intro -> choix (nouveau record) -> saisie -> (envoi) -> classement ; ou intro -> classement
        this.enregistrer = 0; // le choix « enregistrer mon score » : 0 = OUI, 1 = NON
        this.pret = false; // les validations ne comptent qu'après un court délai
        this.sequenceFinie = false; // l'animation d'ouverture n'est pas finie
        this.donneesPretes = false; // le panthéon n'est pas encore chargé
        this.nom = ["A", ...Array(NB_LETTRES - 1).fill(" ")]; // la première case commence à A, les autres sont vides
        this.curseur = 0; // la case en cours de saisie
        this.pantheonDispo = false; // vrai si le panthéon a pu être lu (donc écrit)
        this.tableau = []; // la liste du panthéon
        this.nomJoueur = null; // le nom choisi par le joueur
        this.clignote = []; // les clignotements du tableau

        this.decor(); // le décor
        this.construirePanneaux(); // les plaques et les textes
        if (this.consultation) this.montrerPantheon(); else this.lancerSequence(); // consultation : le panthéon seul ; sinon l'animation d'ouverture
        this.input.keyboard.on("keydown", (evenement) => this.touche(evenement.code)); // chaque touche appuyée est traitée
        this.charger(); // on charge le panthéon
    }

    // ---- le décor : une lueur, des colonnes, de la poussière qui monte (comme le menu) ----

    decor() { // dessine le décor
        creerTextureHalo(this); // on fabrique l'image du halo
        const lueur = this.add.image(640, 150, "halo").setScale(9).setTint(GRIS_VIOLET).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.25).setDepth(0).setPipeline("SinglePipeline"); // une grande lueur en haut
        this.tweens.add({ targets: lueur, alpha: 0.4, scale: 10, duration: 2600, yoyo: true, repeat: -1, ease: "Sine.InOut" }); // elle pulse doucement
        [60, 1220].forEach((x) => { // deux colonnes sur les bords, comme dans l'arène
            this.add.rectangle(x, 360, 56, 720, 0x15121a).setDepth(0); // la colonne
            this.add.rectangle(x - 20, 360, 4, 720, 0x1d1824).setDepth(0); // son bord clair
        });
        creerTexturePixel(this, "menu_poussiere"); // on fabrique le grain de poussière
        this.add.particles(0, 0, "menu_poussiere", { // le générateur de poussière
            x: { min: 0, max: 1280 }, y: { min: 420, max: 720 }, speedY: { min: -26, max: -10 }, speedX: { min: -6, max: 6 }, // elle naît dans la moitié basse et monte
            lifespan: 7000, frequency: 500, quantity: 1, alpha: { start: 0.3, end: 0 }, tint: 0xe7e0e9 // durée de vie, rythme et transparence
        }).setDepth(0); // la poussière passe sous les plaques
    }

    // ---- les deux plaques et leurs textes (créés tout de suite, cachés, puis révélés par la séquence) ----

    construirePanneaux() { // crée les deux plaques et leurs textes (cachés)
        const E = 3; // une plaque est dessinée en pixels de 3 x 3 à l'écran
        const poser = (x, y, w, h) => this.add.image(x, y, plaque(this, w, h)).setOrigin(0, 0).setScale(E).setDepth(1).setAlpha(0); // fonction qui pose une plaque
        this.plaqueGauche = poser(80, 168, 180, 156); // 540 x 468 px
        this.plaqueDroite = poser(660, 168, 180, 156); // la plaque de droite : le classement

        // titre
        this.titre = ecrire(this, 640, 62, "VICTOIRE", 9, { teinte: CLAIR, profondeur: 5 }); // le titre « VICTOIRE »
        this.titre.y = -140; // le conteneur est décalé hors de l'écran : l'animation le ramène à 0, et le texte arrive à sa vraie place (y = 62)
        this.sousTitre = ecrire(this, 640, 124, "DIEU DE LA LUMIERE VAINCU", 3, { teinte: GRIS_VIOLET, profondeur: 5 }).setAlpha(0); // le sous-titre, invisible au départ

        // panneau de gauche : le résultat
        const gauche = 112, droite = 590; // x du texte et de la valeur dans le panneau de gauche
        const ligne = (y, nom, valeur, teinte) => ({ nom: ecrire(this, gauche, y, nom, 3, { ancre: "gauche", teinte: LAVANDE }), valeur: ecrire(this, droite, y, valeur, 3, { ancre: "droite", teinte }) }); // fonction qui crée une ligne : un nom et une valeur
        this.lignes = [ // les 4 lignes du résultat
            ligne(202, "TEMPS TOTAL", formaterTemps(this.tempsBrutMs), CLAIR), // le temps réel de la partie, sans rien retirer
            ligne(238, "MORTS", String(Math.min(this.morts, MORTS_MAX)).padStart(2, "0"), CLAIR), // le nombre de morts
            ligne(274, "POINTS", String(Math.min(this.points, 999999)).padStart(6, "0"), CLAIR), // les points
            ligne(310, "BONUS", "-" + formaterTemps(this.tempsBrutMs - this.tempsNetMs), OR) // le bonus de temps retiré par les points
        ];
        this.lignes.forEach((l) => { l.nom.setAlpha(0); l.valeur.setAlpha(0); }); // on cache les 4 lignes
        this.separateur = this.add.rectangle(350, 340, 456, 3, 0x5f4f6e).setDepth(10).setAlpha(0); // un trait de séparation
        this.libelleFinal = ecrire(this, 350, 372, "TEMPS NET", 3, { teinte: GRIS_VIOLET }).setAlpha(0); // le mot « TEMPS NET »
        this.tempsFinal = ecrire(this, 350, 432, formaterTemps(this.tempsBrutMs), 6, { teinte: CLAIR }).setAlpha(0); // le temps net, qui va se décompter
        this.zoneNom = this.add.container(0, 0).setDepth(10); // la saisie du nom ou le message sous le temps final

        // panneau de droite : le classement
        this.entete = ecrire(this, 930, 200, "PANTHEON", 4, { teinte: CLAIR }).setAlpha(0); // l'en-tête « PANTHEON »
        this.traitEntete = this.add.rectangle(930, 228, 456, 3, 0x5f4f6e).setDepth(10).setAlpha(0); // un trait sous l'en-tête
        // les titres des colonnes : le temps net (celui qui classe), le temps total et le nombre de morts
        this.titresColonnes = [ecrire(this, COL_NET, 246, "NET", 2, { ancre: "droite", teinte: GRIS_VIOLET }), ecrire(this, COL_BRUT, 246, "TOTAL", 2, { ancre: "droite", teinte: GRIS_VIOLET }), // les titres des colonnes
            ecrire(this, COL_MORTS, 246, "MORT", 2, { ancre: "droite", teinte: GRIS_VIOLET }), ecrire(this, COL_COUPS, 246, "HIT", 2, { ancre: "droite", teinte: GRIS_VIOLET })]; // titres des colonnes « MORT » et « HIT » (coups reçus)
        this.titresColonnes.forEach((t) => t.setAlpha(0)); // on les cache
        this.groupeTableau = this.add.container(0, 0).setDepth(10); // le groupe du tableau
        this.pied = ecrire(this, 640, 676, "", 2, { teinte: GRIS_VIOLET }); // l'aide des touches, en bas
    }

    // ---- la consultation : le panthéon seul, tout de suite, au centre de l'écran ----

    montrerPantheon() { // affiche le panthéon seul, sans animation
        changerTexte(this.titre, "PANTHEON"); // « VICTOIRE » a le même nombre de lettres
        this.titre.y = 0; // à sa place, sans la chute
        const decalage = -290; // le panneau de droite se place au centre (son centre passe de 930 à 640)
        this.entete.destroy(); // on remplace l'en-tête
        this.entete = ecrire(this, 930, 200, "MEILLEURS TEMPS", 4, { teinte: CLAIR }); // le nouvel en-tête « MEILLEURS TEMPS »
        const droite = [this.plaqueDroite, this.entete, this.traitEntete, ...this.titresColonnes, this.groupeTableau]; // tout ce qui est à droite
        droite.forEach((objet) => { objet.x += decalage; objet.setAlpha(1); }); // le tableau (un conteneur) est décalé d'un bloc
        this.titre.setAlpha(1); // le titre est visible
        this.etape = "classement"; // l'étape où I ramène à l'accueil (voir touche)
        this.ouvrirClassement(null); // pas de message : celui de la fin de partie n'a pas de sens ici
        this.time.delayedCall(300, () => { this.pret = true; }); // l'appui qui a ouvert l'écran ne doit pas le refermer
    }

    // ---- la séquence d'ouverture ----

    lancerSequence() { // lance l'animation d'ouverture
        const apres = (delai, action) => this.time.delayedCall(delai, action); // fonction qui lance une action après un délai
        const montrer = (cibles, duree = 280) => this.tweens.add({ targets: cibles, alpha: 1, duration: duree }); // fonction qui fait apparaître des objets en fondu
        apres(300, () => { // le titre tombe, rebondit, puis « glitche » un instant
            this.tweens.add({ targets: this.titre, y: 0, duration: 520, ease: "Bounce.Out" }); // il tombe et rebondit
            this.tweens.add({ targets: this.titre, alpha: { from: 1, to: 0.35 }, duration: 60, yoyo: true, repeat: 3, delay: 800 }); // puis il clignote un instant
            jouerSon(this, "porte"); // bruit de porte
        });
        apres(850, () => { montrer(this.sousTitre); montrer([this.plaqueGauche, this.plaqueDroite], 350); }); // à 0,85 s : le sous-titre et les plaques
        apres(1250, () => { montrer([this.lignes[0].nom, this.lignes[0].valeur]); montrer([this.entete, this.traitEntete, ...this.titresColonnes]); this.afficherTableau(); }); // à 1,25 s : première ligne et en-tête du tableau
        apres(1500, () => montrer([this.lignes[1].nom, this.lignes[1].valeur])); // à 1,5 s : les morts
        apres(1750, () => montrer([this.lignes[2].nom, this.lignes[2].valeur])); // à 1,75 s : les points
        apres(2000, () => { montrer([this.lignes[3].nom, this.lignes[3].valeur]); jouerSon(this, "ennemi_touche"); }); // à 2 s : le bonus, avec un bruit
        apres(2400, () => montrer([this.separateur, this.libelleFinal, this.tempsFinal])); // à 2,4 s : le temps net
        apres(2850, () => { // le temps FINAL se décompte jusqu'au temps net : les points « mangent » le temps
            const etat = { v: this.tempsBrutMs }; // la valeur qui diminue
            this.tweens.add({ // on la fait baisser jusqu'au temps net
                targets: etat, v: this.tempsNetMs, duration: 1200, ease: "Cubic.Out", // vers le temps net, en 1,2 s
                onUpdate: () => changerTexte(this.tempsFinal, formaterTemps(etat.v)), // à chaque image, on met le texte à jour
                onComplete: () => { // à la fin :
                    changerTexte(this.tempsFinal, formaterTemps(this.tempsNetMs)); // on affiche le temps net exact
                    this.tempsFinal.lettres.forEach((l) => l && l.setTint(OR)); // il devient doré : c'est le résultat
                    this.tweens.add({ targets: this.tempsFinal, scale: 1.12, duration: 110, yoyo: true }); // il grossit un instant
                    jouerSon(this, "lanterne"); // bruit de fin
                    this.sequenceFinie = true; // l'animation est finie
                    this.decider(); // on décide de la suite
                }
            });
        });
    }

    // ---- l'API : le top 10 actuel ----

    monResultat() { // les chiffres de cette partie, tels qu'ils seront rangés dans le panthéon (sans le nom)
        return { net: arrondi(this.tempsNetMs), brut: arrondi(this.tempsBrutMs), morts: Math.min(MORTS_MAX, this.morts), coups: Math.min(COUPS_MAX, this.coups) }; // temps net et brut arrondis, morts et coups limités
    }

    async charger() { // charge le panthéon
        const liste = await lirePantheon(); // on lit la liste sauvegardée
        this.pantheonDispo = liste !== null; // vrai si la lecture a réussi
        this.tableau = liste || []; // le tableau : la liste lue, ou vide
        this.donneesPretes = true; // les données sont prêtes
        if (this.consultation) this.afficherTableau(); // pas de séquence à attendre : le tableau est montré dès qu'il est lu
        this.decider(); // si la séquence n'est pas finie, elle appellera decider() à sa fin
    }

    decider() { // la séquence est finie et le classement chargé : saisie du nom ou simple affichage
        if (!this.sequenceFinie || !this.donneesPretes || this.etape !== "intro") return; // si l'animation ou le chargement n'est pas fini, on attend
        const mien = this.monResultat(); // le résultat de la partie
        const pire = this.tableau[this.tableau.length - 1]; // le dernier du panthéon : le temps le plus long
        const nouveauRecord = this.pantheonDispo && (this.tableau.length < MAX_LIGNES || comparer(mien, pire) < 0); // à égalité on ne passe pas devant
        this.pret = false; // les validations sont bloquées un instant
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; }); // puis elles sont autorisées
        if (nouveauRecord) this.ouvrirChoix(); // nouveau record : on propose d'enregistrer
        else this.ouvrirClassement(this.pantheonDispo ? "PAS DANS LE TOP 10" : "PANTHEON INDISPONIBLE"); // sinon on affiche le classement avec un message
    }

    // ---- le choix d'enregistrer son score ou non : deux petits boutons OUI / NON sous la bannière « nouveau record » ----

    ouvrirChoix() { // propose d'enregistrer le score (OUI / NON)
        this.etape = "choix"; // l'étape « choix »
        this.zoneNom.removeAll(true); // on vide la zone
        const banniere = ecrire(this, 350, 482, "NOUVEAU RECORD", 4, { teinte: OR }); // le texte « NOUVEAU RECORD »
        this.tweens.add({ targets: banniere, alpha: 0.45, duration: 480, yoyo: true, repeat: -1 }); // il clignote
        this.zoneNom.add([banniere, ecrire(this, 350, 524, "ENREGISTRER TON SCORE", 3, { teinte: CLAIR })]); // on l'ajoute avec la question
        this.boutonsChoix = ["OUI", "NON"].map((nom, i) => { // les deux boutons OUI et NON
            const x = 350 + (i === 0 ? -80 : 80); // x du bouton
            const fond = this.add.image(x, 590, plaque(this, 32, 16, false)).setScale(3); // la plaque du bouton
            const mot = ecrire(this, x, 590, nom, 5); // le mot du bouton
            this.zoneNom.add([fond, mot]); // on les ajoute à la zone
            return { fond, mot }; // on renvoie les deux morceaux
        });
        this.pied.destroy(); // on remplace l'aide des touches
        this.pied = ecrire(this, 640, 696, "GAUCHE DROITE  CHOISIR    A  VALIDER", 2, { teinte: GRIS_VIOLET }); // la nouvelle aide
        this.afficherChoix(); // on affiche le choix
    }

    afficherChoix() { // le choix en cours en or, l'autre éteint
        this.boutonsChoix.forEach((b, i) => { // pour chaque bouton
            const choisi = i === this.enregistrer; // vrai si c'est le bouton choisi
            b.fond.setTint(choisi ? OR : 0xffffff).setAlpha(choisi ? 1 : 0.55); // le bouton choisi est doré, l'autre est atténué
            b.mot.lettres.forEach((l) => l && l.setTint(choisi ? OR : GRIS_VIOLET)); // le mot choisi est doré, l'autre gris
        });
    }

    validerChoix() { // valide le choix OUI / NON
        jouerSon(this, "porte"); // bruit de porte
        this.pret = false; // la même touche ne doit pas valider aussi la saisie du nom
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; }); // puis elles sont autorisées
        if (this.enregistrer === 0) this.ouvrirSaisie(); // OUI : on passe à la saisie du nom
        else this.ouvrirClassement("SCORE NON ENREGISTRE"); // le joueur ne veut pas apparaître dans le panthéon
    }

    // ---- la saisie du nom : six cases, la case choisie en or avec une flèche au-dessus et en dessous ----

    ouvrirSaisie() { // affiche la saisie du nom
        this.etape = "saisie"; // l'étape « saisie »
        this.zoneNom.removeAll(true); // on vide la zone
        const banniere = ecrire(this, 350, 492, "NOUVEAU RECORD", 4, { teinte: OR }); // le texte « NOUVEAU RECORD »
        this.tweens.add({ targets: banniere, alpha: 0.45, duration: 480, yoyo: true, repeat: -1 }); // il clignote
        this.zoneNom.add(banniere); // on l'ajoute à la zone
        this.cases = []; // la liste des cases de lettres
        for (let i = 0; i < NB_LETTRES; i++) { // une case par lettre du nom
            const x = 350 + (i - (NB_LETTRES - 1) / 2) * 78; // les cases sont centrées sous le résultat
            const fond = this.add.image(x, 568, plaque(this, 22, 24, false)).setScale(3); // le fond de la case
            const lettre = ecrire(this, x - 14, 568, "A", 6, { ancre: "gauche" }); // la lettre, au départ A
            const haut = ecrire(this, x - 9, 522, "^", 3, { ancre: "gauche", teinte: OR }); // une flèche en haut (visible sur la case choisie)
            const bas = ecrire(this, x - 9, 614, "~", 3, { ancre: "gauche", teinte: OR }); // une flèche en bas
            this.cases.push({ fond, lettre, haut, bas }); // on retient les morceaux de la case
            this.zoneNom.add([fond, lettre, haut, bas]); // on les ajoute à la zone
        }
        this.pied.destroy(); // on remplace l'aide des touches
        this.pied = ecrire(this, 640, 696, "HAUT BAS  LETTRE    GAUCHE DROITE  CASE    A  VALIDER", 2, { teinte: GRIS_VIOLET }); // la nouvelle aide
        this.afficherNom(); // on affiche le nom
        this.afficherTableau(); // on affiche le tableau avec la ligne du joueur
    }

    afficherNom() { // met à jour les cases de lettres
        this.cases.forEach((c, i) => { // pour chaque case
            const choisie = i === this.curseur; // vrai si c'est la case en cours
            c.fond.setTint(choisie ? OR : 0xffffff); // la case choisie est dorée
            const vide = this.nom[i] === " "; // une case vide n'affiche aucune lettre
            c.lettre.setVisible(!vide); // une case vide n'affiche pas de lettre
            if (!vide) changerTexte(c.lettre, this.nom[i]); // sinon on affiche sa lettre
            c.lettre.lettres[0].setTint(choisie ? OR : LAVANDE); // la lettre choisie est dorée, les autres lavande
            c.haut.setVisible(choisie); c.bas.setVisible(choisie); // les flèches ne sont visibles que sur la case choisie
        });
    }

    ouvrirClassement(message, couleur = GRIS_VIOLET) { // le classement seul, sous le temps final
        this.etape = "classement"; // l'étape « classement »
        this.zoneNom.removeAll(true); // on vide la zone
        if (message) this.zoneNom.add(ecrire(this, 350, 540, message, 3, { teinte: couleur })); // un message éventuel sous le temps
        this.pied.destroy(); // on remplace l'aide des touches
        this.pied = ecrire(this, 640, 696, "A  RETOUR A L'ACCUEIL", 3, { teinte: CLAIR }); // « A RETOUR A L'ACCUEIL »
        this.tweens.add({ targets: this.pied, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 }); // l'aide clignote
        this.afficherTableau(); // on affiche le tableau
    }

    // ---- les touches ----

    touche(code) { // traite une touche appuyée selon l'étape
        const valider = TOUCHES_VALIDER.includes(code); // vrai si c'est une touche de validation
        if (this.etape === "choix") { // étape du choix OUI / NON :
            if (code === "ArrowLeft" || code === "ArrowRight") { this.enregistrer = code === "ArrowLeft" ? 0 : 1; this.afficherChoix(); } // gauche = OUI, droite = NON
            else if (valider && this.pret) this.validerChoix(); // valider confirme le choix
        } else if (this.etape === "saisie") { // étape de la saisie du nom :
            if (code === "ArrowUp" || code === "ArrowDown") { // haut ou bas : change la lettre
                const decalage = code === "ArrowUp" ? 1 : -1; // haut = lettre suivante, bas = précédente
                const index = (LETTRES.indexOf(this.nom[this.curseur]) + decalage + LETTRES.length) % LETTRES.length; // % : on boucle de Z à A
                this.nom[this.curseur] = LETTRES[index]; // la case reçoit la nouvelle lettre
            } else if (code === "ArrowLeft") { // gauche : case précédente
                this.curseur = Math.max(0, this.curseur - 1); // sans dépasser la première
            } else if (code === "ArrowRight") { // droite : case suivante
                this.curseur = Math.min(NB_LETTRES - 1, this.curseur + 1); // sans dépasser la dernière
            } else if (valider && this.pret) { // valider : on enregistre le nom
                if (this.nom.join("").trim() === "") return; // au moins un caractère : un nom entièrement vide n'est pas accepté
                this.envoyer(); // on envoie le score
                return; // on s'arrête là
            }
            this.afficherNom(); // on met les cases à jour
            this.afficherTableau(); // la ligne du joueur suit les lettres
        } else if (this.etape === "classement" && valider && this.pret) { // étape du classement : valider ramène à l'accueil
            jouerSon(this, "porte"); // bruit de porte
            this.sound.stopAll(); // on coupe la musique
            this.scene.start("menu"); // la fin du jeu : le panthéon est la dernière chose vue (les crédits sont passés avant), retour à l'accueil pour la partie suivante
        }
    }

    async envoyer() { // enregistre le score dans le panthéon
        this.etape = "envoi"; // bloque les appuis pendant l'envoi
        const nom = this.nom.join("").trimEnd(); // les cases vides à la fin ne sont pas gardées : « AB    » devient « AB »
        jouerSon(this, "porte"); // bruit de porte
        let reussi = true; // vrai tant qu'aucune erreur n'a eu lieu
        try { // on essaie d'enregistrer
            const liste = await lirePantheon(); // on relit juste avant d'écrire : ecrireDonneesJSON remplace tout le contenu précédent
            if (liste === null) throw new Error("panthéon illisible"); // s'il est illisible, on s'arrête
            const ligne = { nom, ...this.monResultat(), date: new Date().toISOString().slice(0, 10) }; // la ligne du joueur : nom, résultats et date
            const { liste: nouvelle, gardee } = fusionner(liste, ligne); // un nom déjà présent : on garde le meilleur des deux temps
            this.tableau = nouvelle; // le tableau devient la nouvelle liste
            this.ligneGardee = gardee; // on retient si la ligne a été gardée
            if ((await ecrireDonneesJSON(this.tableau)) === false) throw new Error("écriture impossible"); // la version de la borne renvoie false (sans erreur) quand elle ne peut pas écrire
        } catch (erreur) { // en cas d'erreur...
            console.warn("Enregistrement impossible :", erreur); // ...on le signale dans la console...
            reussi = false; // ...et on retient l'échec
        }
        this.nomJoueur = reussi ? nom : null; // pour surligner sa ligne (même si c'est l'ancienne ligne du même nom qui est restée)
        this.pret = false; // les validations sont bloquées un instant
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; }); // puis elles sont autorisées
        const message = !reussi ? "ERREUR D'ENVOI" : this.ligneGardee ? "ENREGISTRE" : "TON MEILLEUR TEMPS EST DEJA ENREGISTRE"; // (même nom, temps moins bon : la ligne de l'ancien temps reste)
        this.ouvrirClassement(message, reussi ? OR : 0xff6b6b); // on ouvre le classement avec ce message
    }

    // ---- le classement : 10 lignes, la ligne du joueur en rose ----

    lignesTableau() { // les 10 lignes à afficher : le top 10 de la borne, avec la ligne du joueur glissée à sa place pendant la saisie
        const mien = this.monResultat(); // mes chiffres, arrondis comme dans le panthéon
        const reel = this.tableau.map((l) => ({ ...l })); // le panthéon est déjà trié : le temps le plus court en premier (on en fait une copie : on y glisse la ligne du joueur)
        if (this.etape === "saisie") { // pendant la saisie :
            const nom = this.nom.join("").trimEnd(); // le nom en cours de saisie
            const ligne = { nom, ...mien, moi: true }; // la ligne provisoire du joueur
            const { liste, gardee } = fusionner(reel, ligne); // même règle que l'enregistrement : un nom déjà présent garde son meilleur temps
            if (!gardee) { const ancienne = liste.find((l) => l.nom === nom); if (ancienne) ancienne.moi = true; } // son ancien temps est meilleur : c'est lui qu'on surligne
            return liste; // on renvoie la liste
        } else if (this.nomJoueur) { // après l'enregistrement :
            const moi = reel.find((l) => l.nom === this.nomJoueur); // on cherche la ligne du joueur
            if (moi) moi.moi = true; // on la marque
        }
        return reel.slice(0, 10); // on renvoie les 10 premières lignes
    }

    afficherTableau() { // dessine les 10 lignes du tableau
        this.groupeTableau.removeAll(true); // on vide le tableau précédent avant de le redessiner
        this.clignote.forEach((t) => t.stop()); // on arrête les clignotements de l'ancien tableau
        this.clignote = []; // la liste des clignotements repart vide
        const lignes = this.lignesTableau(); // les lignes à afficher : le panthéon, plus la ligne du joueur s'il y entre
        const couleurRang = [OR, 0xe7e0e9, OR_SOMBRE]; // les couleurs des rangs 1, 2 et 3 : or, blanc, or sombre
        for (let i = 0; i < 10; i++) { // on dessine toujours 10 lignes, même vides
            const y = 276 + i * 34; // hauteur de cette ligne : 34 px de plus à chaque rang
            const l = lignes[i]; // la ligne du panthéon à ce rang (rien s'il est vide)
            const teinte = l ? (l.moi ? ROSE : i < 3 ? couleurRang[i] : LAVANDE) : 0x5f4f6e; // couleur : rose pour le joueur, couleur du rang pour le top 3, lavande ensuite, gris si vide
            const elements = []; // les éléments de cette ligne, pour les faire clignoter ensemble
            if (l && l.moi) elements.push(this.add.rectangle(933, y, 516, 32, 0x372b3e, 0.9)); // un fond derrière la ligne du joueur
            const secondaire = l && l.moi ? ROSE : 0x8a779b; // le temps total et les morts sont plus discrets que le temps net
            elements.push(ecrire(this, 680, y, String(i + 1).padStart(2, "0"), 3, { ancre: "gauche", teinte })); // le rang (01, 02...) sur deux chiffres
            elements.push(ecrire(this, 724, y, l ? l.nom.padEnd(NB_LETTRES, " ") : "---", 3, { ancre: "gauche", teinte })); // le nom sur 6 caractères, ou --- si la ligne est vide
            elements.push(ecrire(this, COL_NET, y, l ? formaterTemps(l.net) : "--:--.--", 3, { ancre: "droite", teinte })); // le temps net (celui du classement)
            elements.push(ecrire(this, COL_BRUT, y, l ? formaterTemps(l.brut) : "--:--.--", 2, { ancre: "droite", teinte: l ? secondaire : teinte })); // le temps brut (le chrono sans les points retirés)
            elements.push(ecrire(this, COL_MORTS, y, l ? String(l.morts).padStart(2, "0") : "--", 2, { ancre: "droite", teinte: l ? secondaire : teinte })); // le nombre de morts sur deux chiffres
            elements.push(ecrire(this, COL_COUPS, y, l && Number.isFinite(l.coups) ? String(l.coups).padStart(2, "0") : "--", 2, { ancre: "droite", teinte: l ? secondaire : teinte })); // « -- » pour une ligne enregistrée avant ce compteur
            this.groupeTableau.add(elements); // on range la ligne dans le groupe du tableau
            if (l && l.moi) this.clignote.push(this.tweens.add({ targets: elements, alpha: 0.55, duration: 380, yoyo: true, repeat: -1 })); // la ligne du joueur clignote sans fin pour la repérer
        }
    }
}
