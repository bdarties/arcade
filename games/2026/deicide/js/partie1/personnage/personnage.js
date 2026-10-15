import { jouerSon } from "../systemes/sons.js"; // permet de jouer les bruitages
import { traineeDash } from "../systemes/effets.js"; // copies fantômes derrière le robot pendant le dash
import { ROBOT, DASH, TIR, LANTERNES_VIVANTES } from "../parametres.js"; // tous les chiffres de réglage (vitesse, saut, gravité, tir...)
import { creerTextureBalle, creerTextureDash as creerTextureDashDessin } from "../systemes/dessins_en_code.js"; // la balle et la bande du dash (dessinées en code)

// personnage.js : le robot du joueur ("Bot Wheel") : marche, saut, saut de mur, dash, tir et visée automatique.
// Ses chiffres (vitesse, saut, gravité, tir, dash) sont dans parametres.js.
//
// Les images du Bot Wheel sont des bandes verticales : chaque frame fait 117 x 26 pixels
// et les frames sont empilées les unes sous les autres (assets/spritesheet/player/bot_wheel/).
// Le robot n'occupe qu'un petit morceau de la frame (le reste sert aux effets : poussière, tir, gaz).
// Du coup l'ancrage du sprite et la hitbox sont réglés à la main (voir ANIMATIONS) :
// c'est ce qui permet de retourner le robot à gauche sans qu'il "saute" de côté.
//
// Utilisation :
//   preload() de "niveau1"          : chargerPersonnage(this)
//   create()  de "niveau1"          : creerAnimationsPersonnage(this)  (une seule fois, les animations sont globales)
//   create()  de chaque niveau      : this.player = creerPersonnage(this, x, y)
//   update()  de chaque niveau      : majPersonnage(this.player, this.clavier)
//   pour une animation ponctuelle   : jouerAction(this.player, "degats")
//
// Touches gérées par majPersonnage : flèches (déplacement et visée), I (saut), K (tir), L (dash).
// Ce sont les boutons de la borne (gpio2keys.py) : I = bouton 1, K = bouton 4, L = bouton 5, O = bouton 2.
// Saut de mur : en l'air contre un mur, en poussant vers lui, le robot glisse lentement ;
// un nouvel appui sur le bouton de saut (I) le fait rebondir dans l'autre sens.
// Tir en 8 directions : la balle part dans le sens des flèches tenues au moment où on appuie sur le bouton de tir (K)
// (haut, haut en diagonale, droit devant) ; vers le bas, seulement en l'air (voir animationDeTir).
// La visée automatique (voir chercherCible) redresse la balle vers l'ennemi ou la lanterne allumée la plus proche, et le robot
// prend la pose qui correspond à cette direction (droit devant, diagonale ou tout droit, en haut ou en bas : voir animationVersCible).
// Tir vers le bas : le tir fait reculer le robot vers le haut, une seule fois par saut (voir reculer).
// Les balles sont rangées dans scene.tirsJoueur (le groupe est créé au premier tir s'il n'existe pas)
// et s'arrêtent sur scene.groupe_plateformes quand la scène en a un.

const DOSSIER = "./assets/spritesheet/player/bot_wheel/"; // le dossier où sont rangées les images du robot
const PREFIXE = "botwheel_"; // évite les conflits avec les autres textures / animations du jeu
const LARGEUR = 117; // taille d'une frame dans les bandes
const HAUTEUR = 26; // hauteur d'une image normale, en pixels
const PIED_Y = 25; // ligne du sol dans la frame : le bas du robot est toujours collé au pixel 25
const CENTRE_X = 23; // colonne du centre du torse dans la frame (quand le robot regarde à droite)
const ECHELLE = 2; // le robot est petit : on l'agrandit x2 (pixel art)
const FPS = 10; // le fichier aseprite donne 100 ms par image pour toutes les animations
const DELAI_RAFALE = 70; // ms entre deux balles d'une rafale (chaque niveau de boost ajoute une balle à chaque tir)
// vitesse verticale (px/s) à partir de laquelle on considère que le robot saute ou tombe (le petit rebond à l'atterrissage reste en dessous)
const SEUIL_SAUT = 150; // vitesse verticale au-dessus de laquelle on considère que le robot saute ou tombe
const DUREE_VERROU = 220; // ms pendant lesquelles on ne peut pas diriger le robot après un saut de mur (sinon il se recolle au mur)
const MARGE_BALLE = 6; // px : la moitié de la largeur de la balle, pour vérifier qu'elle passe sans accrocher un coin de mur
const DELAI_MUR = 120; // ms pendant lesquelles on peut encore sauter après avoir quitté le mur (le jeu pardonne un appui un peu tardif)
// Le dash est assemblé à partir de deux bandes (voir creerTextureDash) : dans le dessin d'origine le robot
// regarde à gauche avec la fumée DEVANT lui. On retourne le robot sur place et on garde la fumée derrière.
const TORSE_DASH = 105.5; // colonne du centre du torse dans les bandes du dash d'origine
const DECALAGE_DASH = 6; // on décale le tout de 6 px vers la gauche : le robot retourné a besoin de place à droite
const IMAGES_DASH = 7; // le dash est une animation de 7 images
const ANGLE_AUTO = 80; // écart max (en degrés) avec l'horizontale : presque tout ce qui est à gauche ou à droite du robot, même très haut ou très bas
const DUREE_REGARD_TIR = 250; // ms pendant lesquelles le robot reste tourné vers l'ennemi visé, même si on tient l'autre flèche
const BOUCHE = { x: 40, y: 10 }; // où naît la balle dans la frame de tir : le centre de la boule de flash du canon
// Les visées vers le haut et le bas (bande "shoot_aim.png") ont été fabriquées à partir de "shoot_without_fx.png" et
// "shoot_fx.png" : le fusil et les poings sont tournés de 45° ou 90° autour du poing avant, la flamme les suit, le haut
// du torse est refait. Leurs frames sont plus hautes (117 x 58) car la flamme dépasse du dessin d'origine :
// 16 lignes ajoutées au-dessus du robot et 16 en dessous.
const HAUTEUR_VISEE = 58; // hauteur des images de visée (haut/bas), plus hautes que les autres
const MARGE_HAUT_VISEE = 16; // lignes ajoutées au-dessus du robot dans ces images
const DIAGONALE = Math.SQRT1_2; // cos 45° : une balle en diagonale va aussi vite que les autres
const RECUL_BAS = 420; // vitesse vers le haut (px/s) donnée par un tir droit vers le bas : environ 90 px de haut, la moitié d'un saut (ROBOT.saut)
const RECUL_BAS_DIAG = 300; // la même chose pour un tir en diagonale vers le bas, plus faible

// Petite balle d'énergie (elle n'est pas dans les spritesheets) : 8 x 6 pixels aux couleurs du robot.

// Hitboxes (en pixels de la frame, avant agrandissement). Elles sont centrées sur le torse
// et un peu plus étroites que le dessin (torse = 11 px, hitbox = 10 px) pour rester tolérantes.
const CORPS_DEBOUT = { y: 4, w: 10, h: 21 }; // la hitbox du robot debout (y = décalage, w = largeur, h = hauteur)
const CORPS_REPOS = { y: 8, w: 10, h: 17 }; // le robot "endormi" est plus petit que le robot réveillé
const CORPS_MORT = { y: 14, w: 10, h: 11 }; // robot à terre

// Une entrée par animation.
//   fichier / images : la bande à charger et les frames à jouer
//   bande            : nom d'une autre animation dont on réutilise la bande (au lieu de charger un fichier)
//   repeat           : -1 = en boucle, 0 = une seule fois
//   corps            : hitbox (voir plus haut)
//   dessinDroite     : sens dans lequel le robot est dessiné (true par défaut, false = dessiné vers la gauche)
//   centre           : colonne du centre du torse dans la frame, pour ce dessin
//   fps              : vitesse de l'animation (FPS par défaut)
//   bloquant         : les touches sont ignorées pendant l'animation
//   elan             : vitesse horizontale donnée au début d'une animation bloquante (0 sinon)
//   sansGravite      : le robot ne tombe pas pendant l'animation (dash)
//   figee            : reste sur la dernière image à la fin (mort)
//   debut            : fonction appelée quand l'animation démarre (le tir fait partir la balle)
//   hauteur          : hauteur d'une frame de la bande (HAUTEUR par défaut)
//   haut             : lignes ajoutées au-dessus du dessin d'origine dans la frame (0 par défaut)
//   visee            : direction de la balle quand le robot regarde à droite, { x, y } (droit devant par défaut)
//   bouche           : où naît la balle dans la frame (BOUCHE par défaut)
//   recul            : vitesse vers le haut (px/s) que le tir donne au robot (aucun par défaut)
const VISEE = { hauteur: HAUTEUR_VISEE, haut: MARGE_HAUT_VISEE, repeat: 0, corps: CORPS_DEBOUT, debut: tirer }; // réglages communs aux 4 poses de tir vers le haut ou le bas
const ANIMATIONS = { // le catalogue des animations du robot : un nom, son fichier, ses images et sa hitbox
    repos: { fichier: "static_idle.png", images: [0], repeat: -1, corps: CORPS_REPOS }, // immobile
    marche: { fichier: "move_with_fx.png", images: serie(8), repeat: -1, corps: CORPS_DEBOUT }, // il marche, en boucle
    // pas d'anim de saut dans la feuille : on fige une image de la marche, sans la poussière
    saut: { fichier: "move_without_fx.png", images: [3], repeat: -1, corps: CORPS_DEBOUT }, // il saute (une seule image)
    // PAS d'animation de mur dans les feuilles : en attendant, la roue qui tourne (bande "saut") joue en accéléré. Pour une vraie pose,
    // remplacer bande par fichier et images.
    mur: { bande: "saut", images: serie(8), repeat: -1, fps: 20, corps: CORPS_DEBOUT }, // il glisse contre un mur
    reveil: { fichier: "wake.png", images: serie(5), repeat: 0, corps: CORPS_DEBOUT, bloquant: true }, // il se réveille (bloque les touches pendant l'animation)
    charge: { fichier: "charge.png", images: serie(4), repeat: 0, corps: CORPS_DEBOUT }, // il se charge
    tir: { fichier: "shoot_with_fx.png", images: serie(4), repeat: 0, corps: CORPS_DEBOUT, debut: tirer }, // il tire droit devant (lance tirer() au début)
    // les 4 autres visées partagent une seule bande, "shoot_aim.png" (4 images par visée, retournées pour viser à gauche)
    // bouche = où se trouve le centre de la flamme dans la frame (calculé comme BOUCHE, en suivant la rotation du canon)
    tir_haut_diag: { ...VISEE, fichier: "shoot_aim.png", images: [0, 1, 2, 3], visee: { x: DIAGONALE, y: -DIAGONALE }, bouche: { x: 38, y: 14 } }, // tir en diagonale vers le haut
    tir_haut: { ...VISEE, bande: "tir_haut_diag", images: [4, 5, 6, 7], visee: { x: 0, y: -1 }, bouche: { x: 27, y: 10 } }, // tir tout droit vers le haut
    tir_bas_diag: { ...VISEE, bande: "tir_haut_diag", images: [8, 9, 10, 11], visee: { x: DIAGONALE, y: DIAGONALE }, bouche: { x: 40, y: 42 }, recul: RECUL_BAS_DIAG }, // tir en diagonale vers le bas (avec un petit recul)
    tir_bas: { ...VISEE, bande: "tir_haut_diag", images: [12, 13, 14, 15], visee: { x: 0, y: 1 }, bouche: { x: 29, y: 48 }, recul: RECUL_BAS }, // tir tout droit vers le bas (avec un recul)
    // pas de bande à charger : la texture est assemblée par creerTextureDash ; à 20 fps il dure 350 ms, soit environ 175 px
    dash: { fichier: null, images: serie(IMAGES_DASH), repeat: 0, fps: 20, corps: CORPS_DEBOUT, centre: TORSE_DASH - DECALAGE_DASH, bloquant: true, elan: DASH.vitesse, sansGravite: true }, // le dash : le robot fonce, sans gravité, et ne peut pas être dirigé
    degats: { fichier: "damaged.png", images: serie(2), repeat: 0, corps: CORPS_DEBOUT }, // il est touché
    mort: { fichier: "death.png", images: serie(6), repeat: 0, corps: CORPS_MORT, bloquant: true, figee: true } // il meurt et reste à terre (animation figée sur la dernière image)
};

function serie(n) { // fabrique la liste d'images [0, 1, ..., n-1]
    return Array.from({ length: n }, (_, i) => i); // [0, 1, 2, ..., n-1]
}

// à appeler dans preload() : charge toutes les bandes du Bot Wheel
export function chargerPersonnage(scene) { // charge toutes les images du robot (appelée dans preload)
    const bande = (cle, fichier, hauteur = HAUTEUR) => scene.load.spritesheet(PREFIXE + cle, DOSSIER + fichier, { frameWidth: LARGEUR, frameHeight: hauteur }); // petite fonction qui charge une bande d'images sous le nom de l'animation
    for (const [nom, anim] of Object.entries(ANIMATIONS)) { // on parcourt toutes les animations du catalogue
        if (anim.fichier) bande(nom, anim.fichier, anim.hauteur); // si l'animation a son propre fichier, on le charge
    }
    bande("dash_robot", "gas_dash_with_fx.png"); // le robot (sa dernière image est sans fumée)
    bande("dash_fumee", "gas_dash_fx.png"); // la fumée seule
}

// à appeler dans create() de la première scène : crée les animations à partir des bandes (et les textures de la balle et du dash)
export function creerAnimationsPersonnage(scene) { // crée les animations Phaser à partir du catalogue (appelée une fois)
    creerTextureDash(scene); // fabrique d'abord la texture du dash
    for (const [nom, anim] of Object.entries(ANIMATIONS)) { // pour chaque animation du catalogue
        const cle = PREFIXE + nom; // son nom unique dans Phaser (avec le préfixe botwheel_)
        const cleBande = PREFIXE + (anim.bande ?? nom); // certaines animations réutilisent la bande d'une autre
        scene.textures.get(cleBande).setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
        if (scene.anims.exists(cle)) continue; // déjà créée (relance de la scène)
        scene.anims.create({ // on crée l'animation Phaser
            key: cle, // son nom
            frames: scene.anims.generateFrameNumbers(cleBande, { frames: anim.images }), // les images à jouer, prises dans la bande
            frameRate: anim.fps ?? FPS, // sa vitesse en images par seconde
            repeat: anim.repeat // en boucle (-1) ou une seule fois (0)
        });
    }
    creerTextureBalle(scene, PREFIXE + "balle"); // fabrique aussi l'image de la balle
}

// Assemble la bande du dash (voir creerTextureDash dans dessins_en_code.js) avec les chiffres propres au robot
function creerTextureDash(scene) { // assemble la bande d'images du dash (le robot + sa fumée)
    const cle = PREFIXE + "dash"; // le nom de la texture du dash
    if (scene.textures.exists(cle)) return; // déjà créée
    creerTextureDashDessin(scene, { // on demande au dessin de la fabriquer
        cle, robot: scene.textures.get(PREFIXE + "dash_robot").getSourceImage(), fumee: scene.textures.get(PREFIXE + "dash_fumee").getSourceImage(), // le nom et les deux images à assembler
        largeur: LARGEUR, hauteur: HAUTEUR, images: IMAGES_DASH, decalage: DECALAGE_DASH, torse: TORSE_DASH // les tailles et réglages de l'assemblage
    });
}

// crée le joueur en (x, y). y correspond aux pieds du robot.
// options (pour le mode 1 contre 1, voir versus.js) : touches = { saut, tir, dash } (noms de touches, celles du joueur 1 par
// défaut), teinte = couleur du robot
export function creerPersonnage(scene, x, y, options = {}) { // crée le robot à la position x, y (appelée par chaque niveau)
    const joueur = scene.physics.add.sprite(x, y, PREFIXE + "repos"); // un sprite avec de la physique, à l'image « repos »
    if (options.teinte) { joueur.setTint(options.teinte); joueur.teinteBase = options.teinte; } // (effets.flash rend cette teinte après chaque flash)
    joueur.setScale(ECHELLE); // on l'agrandit x2 (pixel art)
    joueur.setBounce(0.2); // un petit rebond quand il retombe
    joueur.setCollideWorldBounds(true); // il ne sort pas de la carte
    joueur.body.maxVelocity.y = 900; // vitesse de chute maximale : 900 px/s
    joueur.regardeGauche = false; // sens dans lequel regarde le robot
    joueur.action = null; // nom de l'action en cours (voir jouerAction), null sinon
    joueur.enSaut = false; // vrai entre le décollage (ou le début d'une chute) et le retour au sol
    joueur.surMur = false; // vrai quand le robot glisse contre un mur
    joueur.sensMur = 0; // dernier mur touché en l'air : -1 = à gauche, 1 = à droite
    joueur.instantMur = -1e9; // et quand on l'a touché
    joueur.verrouJusqua = 0; // instant jusqu'auquel les flèches gauche/droite sont ignorées (après un saut de mur)
    // I = saut, K = tir, L = dash ; false : on ne bloque pas les raccourcis du navigateur
    joueur.touches = scene.input.keyboard.addKeys(options.touches ?? { saut: "I", tir: "K", dash: "L" }, false); // les touches de saut, tir et dash
    joueur.prochainTir = 0; // instant à partir duquel on peut retirer
    joueur.prochainDash = 0; // instant à partir duquel on peut redasher
    joueur.instantSol = -1e9; // dernier instant où il était au sol (pour le saut « coyote »)
    joueur.reculDispo = true; // le recul d'un tir vers le bas ne marche qu'une fois par saut : il revient au sol ou contre un mur
    // une action non figée est terminée quand son animation est finie : on rend la main aux animations automatiques
    joueur.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => { // quand une animation se termine...
        if (joueur.action && animation.key === PREFIXE + joueur.action && !ANIMATIONS[joueur.action].figee) { // ...si c'était l'action en cours et qu'elle n'est pas figée...
            joueur.action = null; // ...l'action est finie
            joueur.body.setAllowGravity(true); // fin du dash
        }
    });
    jouer(joueur, "repos", false); // il commence immobile
    return joueur; // on renvoie le robot créé
}

// à appeler dans update() : déplacements, saut et choix de l'animation. Chaque étape a sa fonction (plus bas), dans cet ordre :
export function majPersonnage(joueur, clavier) { // appelée à chaque image : fait vivre le robot
    const etat = lireEtat(joueur, clavier); // ce dont les étapes suivantes ont besoin : au sol ? libre de ses mouvements ? flèches tenues ?
    appliquerGravite(joueur, etat); // réglage de la gravité (montée / chute)
    marcherEtSauter(joueur, etat); // marche et saut
    glisserEtSauterDuMur(joueur, etat); // glissade et saut de mur
    dasherOuTirer(joueur, clavier, etat); // dash et tir
    choisirAnimation(joueur, etat); // choix de l'animation à afficher
}

// L'état du robot à cette image, calculé une seule fois et passé aux étapes de majPersonnage.
function lireEtat(joueur, clavier) { // rassemble en un seul objet l'état du robot à cet instant
    const action = joueur.action ? ANIMATIONS[joueur.action] : null; // l'action en cours (dash, réveil...) ou rien
    const maintenant = joueur.scene.time.now; // l'heure actuelle du jeu
    const libre = !(action && action.bloquant); // pas de contrôle pendant le réveil, le dash, la mort
    return { // on renvoie l'état :
        maintenant, // l'heure
        auSol: joueur.body.blocked.down || joueur.body.touching.down, // vrai si le robot a les pieds sur le sol
        libre, // vrai si le joueur peut le diriger
        verrou: maintenant < joueur.verrouJusqua, // juste après un saut de mur, on ne dirige plus le robot
        gauche: libre && clavier.left.isDown, // vrai si on tient la flèche gauche
        droite: libre && clavier.right.isDown // vrai si on tient la flèche droite
    };
}

// La gravité change selon que le robot monte ou tombe (il monte vite et s'arrête net), et on retient s'il est au sol ou en l'air.
function appliquerGravite(joueur, etat) { // règle la gravité du robot selon qu'il monte ou qu'il tombe
    if (joueur.body.velocity.y > 0) { // permet de savoir si le personnage est en train de tomber
        joueur.body.setGravityY(ROBOT.graviteChute); // quand il tombe (la gravité totale = celle du monde + celle-ci)
    } else { // sinon, il monte
        joueur.body.setGravityY(ROBOT.graviteMontee); // quand il monte : il monte vite et s'arrête net
    }
    if (etat.auSol) joueur.instantSol = etat.maintenant; // le dernier instant où le robot avait les pieds sur un sol
    if (etat.auSol) joueur.enSaut = false; // au sol : il n'est plus en saut
    else if (Math.abs(joueur.body.velocity.y) > SEUIL_SAUT) joueur.enSaut = true; // en l'air et assez rapide : il est en saut
}

// Marcher à gauche ou à droite, et sauter depuis le sol (ou juste après avoir quitté le bord d'une plateforme : saut « coyote »).
function marcherEtSauter(joueur, etat) { // gère la marche et le saut depuis le sol
    if (!etat.libre) return; // pas de contrôle pendant le dash, le réveil ou la mort
    const { maintenant, auSol, verrou, gauche, droite } = etat; // on récupère les valeurs utiles de l'état
    // vitesse de marche, un peu plus grande quand le robot est boosté
    const vitesse = ROBOT.vitesse * (1 + LANTERNES_VIVANTES.bonusVitesseParNiveau * (joueur.boostNiveau ?? 0)); // vitesse de marche, augmentée par le boost
    if (verrou) { // juste après un saut de mur : on ignore les flèches
        // on laisse la vitesse du saut de mur telle quelle
    } else if (gauche) { // flèche gauche : le robot va à gauche
        joueur.setVelocityX(-vitesse); // vitesse vers la gauche
        if (maintenant >= (joueur.regardJusqua ?? 0)) joueur.regardeGauche = true; // pendant un tir visé, le robot reste tourné vers l'ennemi
    } else if (droite) { // flèche droite : le robot va à droite
        joueur.setVelocityX(vitesse); // vitesse vers la droite
        if (maintenant >= (joueur.regardJusqua ?? 0)) joueur.regardeGauche = false; // pendant un tir visé, le robot reste tourné vers l'ennemi
    } else { // aucune flèche : il s'arrête
        joueur.setVelocityX(0); // vitesse horizontale nulle
    }
    // au sol, ou il vient juste de quitter le bord d'une plateforme (saut « coyote »)
    const peutSauter = auSol || maintenant - joueur.instantSol < ROBOT.delaiCoyote; // on peut sauter au sol, ou juste après avoir quitté un bord (saut « coyote »)
    if (joueur.touches.saut.isDown && peutSauter) { // le saut est sur le bouton I ; la flèche du haut sert seulement à viser
        joueur.instantSol = -1e9; // un décollage = un saut : sans ça, on resauterait à chaque image pendant le délai
        joueur.setVelocityY(-ROBOT.saut); // on monte à la vitesse du saut
        jouerSon(joueur.scene, "saut"); // bruit du réacteur au décollage
    }
}

// Glisse et saut de mur. Le robot touche un mur (bord du monde ou côté d'une plateforme) quand Phaser
// signale un contact à gauche ou à droite : il faut donc pousser vers le mur pour rester collé.
function glisserEtSauterDuMur(joueur, etat) { // gère la glissade contre un mur et le saut de mur
    const { maintenant, auSol, libre, verrou, gauche, droite } = etat; // on récupère les valeurs utiles de l'état
    const veutSaut = Phaser.Input.Keyboard.JustDown(joueur.touches.saut); // appui neuf : garder le bouton enfoncé ne rechaîne pas les sauts de mur
    const bords = joueur.scene.physics.world.bounds; // identifie si le joueur se trouve contre un bord de la map
    const auBordGauche = joueur.body.left <= bords.left + 1; // si le joueur est à 1 pixel du bord de la map il est considéré comme collé au bord
    const auBordDroit = joueur.body.right >= bords.right - 1; // si le joueur est à 1 pixel du bord de la map il est considéré comme collé au bord
    // en contact avec un mur qui n'est pas le bord de la map : on peut s'y accrocher
    const contactGauche = (joueur.body.blocked.left || joueur.body.touching.left) && !auBordGauche; // touche un mur à gauche (pas le bord de la carte)
    const contactDroite = (joueur.body.blocked.right || joueur.body.touching.right) && !auBordDroit; // touche un mur à droite (pas le bord de la carte)
    if (!auSol && (contactGauche || contactDroite)) { // en l'air contre un mur : on retient lequel
        joueur.sensMur = contactDroite ? 1 : -1; // 1 = mur à droite, -1 = mur à gauche
        joueur.instantMur = maintenant; // et à quel moment on l'a touché
    }
    const pousse = gauche ? -1 : droite ? 1 : 0; // sens dans lequel le joueur pousse
    const contreLeMur = (pousse === -1 && contactGauche) || (pousse === 1 && contactDroite); // vrai s'il pousse vers le mur qu'il touche
    joueur.surMur = libre && !verrou && !auSol && contreLeMur; // il glisse s'il est libre, en l'air et pousse contre le mur
    if (joueur.surMur) { // s'il glisse contre le mur...
        joueur.regardeGauche = pousse === 1; // le robot tourne le dos au mur : le canon et le saut partent vers l'extérieur
        if (joueur.body.velocity.y > ROBOT.vitesseGlisse) joueur.setVelocityY(ROBOT.vitesseGlisse); // ...sa chute est limitée à la vitesse de glissade
    }
    if (libre && veutSaut && !auSol && maintenant - joueur.instantMur < DELAI_MUR) { // appui neuf sur saut, en l'air, juste après un contact avec un mur : saut de mur
        joueur.setVelocityY(-ROBOT.saut); // il monte
        joueur.setVelocityX(-joueur.sensMur * ROBOT.vitesseSautMur); // et part dans le sens opposé au mur
        jouerSon(joueur.scene, "saut"); // même bruit pour le saut de mur
        joueur.regardeGauche = joueur.sensMur === 1; // il regarde dans le sens où il part
        joueur.verrouJusqua = maintenant + DUREE_VERROU; // on bloque les flèches un court instant pour qu'il ne se recolle pas au mur
        joueur.instantMur = -1e9; // un contact = un saut
        joueur.enSaut = true; // il est en saut
        joueur.surMur = false; // il ne glisse plus
    }
    if (auSol || joueur.surMur) joueur.reculDispo = true; // le recul est de nouveau possible
}

// Le dash (bouton L) et le tir (bouton K). Un seul des deux par image : le dash est prioritaire.
function dasherOuTirer(joueur, clavier, etat) { // gère le dash et le tir (un seul par image)
    const { maintenant, auSol, libre } = etat; // on récupère les valeurs utiles de l'état
    // lus à chaque image, même quand ils sont inutilisables, pour ne pas garder un appui "en attente"
    const veutDash = Phaser.Input.Keyboard.JustDown(joueur.touches.dash); // vrai si on vient d'appuyer sur dash
    const veutTir = Phaser.Input.Keyboard.JustDown(joueur.touches.tir); // vrai si on vient d'appuyer sur tir
    if (libre && veutDash && maintenant >= joueur.prochainDash) { // dash demandé, libre, et délai écoulé
        joueur.prochainDash = maintenant + DASH.delai; // on note quand on pourra redasher
        jouerAction(joueur, "dash"); // on lance l'animation du dash
        jouerSon(joueur.scene, "dash"); // bruit du dash
        traineeDash(joueur); // laisse une traînée de fantômes rouges
    } else if (libre && veutTir && maintenant >= joueur.prochainTir) { // sinon, tir demandé, libre, et délai écoulé
        joueur.prochainTir = maintenant + TIR.delai; // on note quand on pourra retirer
        const cible = choisirCibleTir(joueur); // la visée auto choisit la cible AVANT l'animation : le robot pointe son canon vers elle
        joueur.cibleTir = cible; // tirer() reprendra cette cible au lieu d'en chercher une autre
        joueur.cibleTirPrete = true; // le tir peut reprendre cette cible
        jouerAction(joueur, cible ? animationVersCible(joueur, cible) : animationDeTir(clavier, auSol)); // on lance l'animation de tir vers la cible, ou selon les flèches tenues
    }
}

// L'animation de fond : sur un mur, en saut, en marche ou au repos (sauf si une action ponctuelle est en cours).
function choisirAnimation(joueur, etat) { // choisit l'animation à afficher à chaque image
    if (!joueur.action) { // si aucune action n'est en cours...
        jouer(joueur, joueur.surMur ? "mur" : joueur.enSaut ? "saut" : etat.gauche || etat.droite ? "marche" : "repos", true); // ...on joue glissade, saut, marche ou repos selon la situation
    } else { // sinon une action est en cours :
        orienter(joueur); // on garde le robot tourné dans le bon sens
    }
}

// Choisit la visée d'après les flèches tenues quand on appuie sur le bouton de tir (K). Le côté (gauche ou droite) vient du sens
// dans lequel regarde le robot : il tourne déjà vers la flèche tenue, et au mur il tourne le dos au mur.
//   rien, ou seulement gauche / droite : "tir"      haut : "tir_haut"      haut + côté : "tir_haut_diag"
//   bas (en l'air) : "tir_bas"                      bas + côté : "tir_bas_diag"
// Au sol, la flèche du bas est ignorée : une balle qui part vers le sol s'écraserait aussitôt dessus.
function animationDeTir(clavier, auSol) { // choisit la pose de tir selon les flèches tenues
    const haut = clavier.up.isDown; // flèche haut tenue
    const bas = clavier.down.isDown && !auSol; // flèche bas tenue (seulement en l'air)
    const cote = clavier.left.isDown || clavier.right.isDown; // une flèche gauche ou droite tenue
    if (haut === bas) return "tir"; // aucune flèche verticale, ou haut et bas ensemble qui s'annulent
    if (haut) return cote ? "tir_haut_diag" : "tir_haut"; // vers le haut : en diagonale si une flèche de côté est tenue
    return cote ? "tir_bas_diag" : "tir_bas"; // vers le bas : en diagonale si une flèche de côté est tenue
}

// Quand la visée auto a trouvé une cible, c'est elle qui décide de la pose, pas les flèches : la balle part vers l'ennemi, alors
// le robot pointe son canon vers lui. Les 5 poses sont des angles de 0°, 45° et 90° (en haut ou en bas) : on prend la plus proche
// de l'angle réel entre le robot et la cible (moins de 22,5° : droit devant ; de 22,5° à 67,5° : diagonale ; au-delà : tout droit).
// Ici le bas est permis même au sol : un ennemi sur une plateforme plus basse se vise comme un autre.
function animationVersCible(joueur, cible) { // choisit la pose de tir qui pointe vers la cible
    const dx = Math.abs(cible.body.center.x - joueur.body.center.x); // écart horizontal (le robot est déjà tourné vers la cible)
    const dy = cible.body.center.y - joueur.body.center.y; // écart vertical : négatif = la cible est au-dessus
    const angle = Phaser.Math.RadToDeg(Math.atan2(Math.abs(dy), dx)); // 0° = à la même hauteur, 90° = pile au-dessus ou en dessous
    if (angle < 22.5) return "tir"; // cible presque à l'horizontale : tir droit
    const haut = dy < 0; // la cible est au-dessus du robot
    if (angle < 67.5) return haut ? "tir_haut_diag" : "tir_bas_diag"; // cible en diagonale : pose diagonale
    return haut ? "tir_haut" : "tir_bas"; // cible presque verticale : tir vers le haut ou le bas
}

// où en est la recharge du dash : 0 = vient d'être utilisé, 1 = prêt (sert à la jauge du HUD)
export function rechargeDash(joueur) { // renvoie la jauge de dash (de 0 vide à 1 pleine) pour le HUD
    return Phaser.Math.Clamp(1 - (joueur.prochainDash - joueur.scene.time.now) / DASH.delai, 0, 1); // la part de délai écoulée, entre 0 et 1
}

// joue une animation ponctuelle : "reveil", "charge", "tir" (ou tir_haut, tir_haut_diag, tir_bas, tir_bas_diag), "dash", "degats" ou "mort"
// les animations "bloquantes" (reveil, dash, mort) coupent les touches jusqu'à leur fin
// (K et L appellent ça avec un tir et "dash", mais on peut aussi l'appeler depuis les niveaux)
export function jouerAction(joueur, nom) { // lance une action ponctuelle (dash, dégâts, mort...) sur le robot
    if (joueur.action === "mort") return; // une fois mort, plus rien ne bouge
    const anim = ANIMATIONS[nom]; // les infos de cette action dans le catalogue
    joueur.action = nom; // on note l'action en cours
    joueur.body.setAllowGravity(!anim.sansGravite); // le dash ne subit pas la gravité
    if (anim.sansGravite) joueur.setVelocityY(0); // pas de chute pendant le dash
    if (anim.bloquant) { // si l'action bloque les touches...
        joueur.setVelocityX(anim.elan ? (joueur.regardeGauche ? -anim.elan : anim.elan) : 0); // ...il avance à la vitesse d'élan, dans le sens où il regarde
    }
    jouer(joueur, nom, false); // on joue l'animation depuis le début
    if (anim.debut) anim.debut(joueur); // et on lance sa fonction de départ (le tir par exemple)
}
// vrai si aucun mur ne se trouve sur la ligne droite entre (x1, y1) et (x2, y2) : la balle ne traverse pas les murs, donc la visée auto non plus
function ligneDegagee(scene, x1, y1, x2, y2) { // vrai si aucun mur ne cache la ligne entre deux points
    const calque = scene.groupe_plateformes; // le calque Gameplay de la map Tiled
    if (!calque) return true; // pas de calque de collisions : rien ne cache la cible
    const longueur = Math.hypot(x2 - x1, y2 - y1) || 1; // longueur de la ligne
    const nx = -(y2 - y1) / longueur; // un vecteur perpendiculaire à la ligne : la balle a une largeur (environ 12 px), pas seulement un point,
    const ny = (x2 - x1) / longueur; // donc on teste aussi deux lignes parallèles, de chaque côté, sinon elle accroche le coin d'un bloc
    const pas = Math.ceil(longueur / 12); // un point tous les 12 px environ (les tuiles font 32 px : aucune ne peut être sautée)
    for (let i = 1; i < pas; i++) { // on parcourt la ligne du robot vers l'objet (sans les deux bouts)
        const px = x1 + (x2 - x1) * i / pas; // x du point testé sur la ligne
        const py = y1 + (y2 - y1) * i / pas; // y du point testé sur la ligne
        for (const decalage of [0, -MARGE_BALLE, MARGE_BALLE]) { // on teste la ligne centrale et deux lignes de chaque côté (largeur de la balle)
            const tuile = calque.getTileAtWorldXY(px + nx * decalage, py + ny * decalage); // la tuile sous ce point
            if (tuile && tuile.collides) return false; // une tuile solide : le mur bloque la vue
        }
    }
    return true; // aucun mur trouvé : la ligne est dégagée
}
// Les points du corps d'une cible qu'on peut viser : le centre d'abord, puis le haut, le bas et les côtés. Un mage perché sur un bloc peut être caché
// en son centre par le coin du bloc mais atteignable plus haut : la balle touche l'ennemi dès qu'elle atteint n'importe quelle partie de son corps.
function pointsVisables(cible) { // liste les 5 points d'un ennemi qu'on essaie de viser (centre, haut, bas, gauche, droite)
    const c = cible.body; // la hitbox de l'ennemi
    return [{ x: c.center.x, y: c.center.y }, { x: c.center.x, y: c.top + 6 }, { x: c.center.x, y: c.bottom - 6 }, { x: c.left + 4, y: c.center.y }, { x: c.right - 4, y: c.center.y }]; // les 5 points à tester
}
// le premier point de la cible qu'on voit en ligne droite depuis (x, y), ou null si un mur cache toute la cible
function pointDegage(scene, x, y, cible) { // cherche un point de la cible qu'on peut voir depuis x, y
    return pointsVisables(cible).find((point) => ligneDegagee(scene, x, y, point.x, point.y)) ?? null; // le premier point sans mur devant, ou rien
}
// vrai si la case sous ce point est un mur
function dansUnMur(scene, x, y) { // vrai si ce point est à l'intérieur d'un mur
    const calque = scene.groupe_plateformes; // le calque des plateformes
    if (!calque) return false; // pas de calque : pas de mur
    const tuile = calque.getTileAtWorldXY(x, y); // la tuile à ce point
    return Boolean(tuile && tuile.collides); // vrai si cette tuile est solide
}
// cherche la cible la plus proche à gauche ou à droite du robot : un ennemi ou une lanterne encore allumée. Renvoie null s'il n'y en a pas.
function chercherCible(joueur, x, y) { // cherche la meilleure cible de la visée automatique : la plus proche et visible
    const scene = joueur.scene; // la scène où se trouve le robot
    let cible = null; // la meilleure cible trouvée pour l'instant (aucune au départ)
    let meilleureDistance = TIR.porteeVisee; // on ne garde que ce qui est plus proche que la portée
    const essayer = (objet) => { // regarde si cet objet (ennemi ou lanterne) est une bonne cible
        if (!scene.cameras.main.worldView.contains(objet.x, objet.y)) return; // hors de l'écran : on ne vise pas ce qu'on ne voit pas
        const dx = Math.abs(objet.body.center.x - x); // écart horizontal, que l'objet soit à gauche ou à droite (le robot se retourne vers lui)
        const dy = objet.body.center.y - y; // écart vertical entre le robot et l'objet
        const angle = Phaser.Math.RadToDeg(Math.atan2(Math.abs(dy), dx)); // angle entre la ligne droite du tir et l'objet, en degrés
        if (angle > ANGLE_AUTO) return; // trop haut ou trop bas : on l'ignore
        if (!pointDegage(scene, x, y, objet)) return; // un mur cache tout l'objet : on ne le vise pas à travers
        const distance = Math.hypot(dx, dy); // distance réelle entre le robot et l'objet
        if (distance < meilleureDistance) { // il est plus proche que le meilleur trouvé jusqu'ici
            cible = objet; // il devient la cible
            meilleureDistance = distance; // et sa distance devient celle à battre
        }
    };
    // en 1 contre 1, l'autre robot est la cible (voir versus.js)
    if (joueur.adversaire && joueur.adversaire.active && !joueur.adversaire.mortVersus) essayer(joueur.adversaire); // en 1 contre 1, l'autre robot est une cible
    // les ennemis (sauf ceux qui sont en train de mourir)
    if (scene.ennemis) scene.ennemis.getChildren().forEach(ennemi => { if (ennemi.etat !== "mort") essayer(ennemi); }); // les ennemis vivants sont des cibles
    // les lanternes qui ne sont pas encore éteintes
    if (scene.lanternes) scene.lanternes.getChildren().forEach(lanterne => { if (!lanterne.eteinte) essayer(lanterne); }); // les lanternes encore allumées sont des cibles
    // les lanternes vivantes (voir lanterne_vivante.js)
    if (scene.lanternesVivantes) scene.lanternesVivantes.getChildren().forEach(lanterne => { if (lanterne.active) essayer(lanterne); }); // les lanternes vivantes sont des cibles
    // le boss (voir boss.js)
    if (scene.boss && scene.boss.active && (scene.boss.etat === "combat" || scene.boss.etat === "attaque")) essayer(scene.boss); // le boss est une cible pendant le combat
    return cible; // renvoie la cible trouvée, ou null si aucune ne convient
}
// choisit la cible de la visée auto au moment où on appuie sur tir : l'ennemi ou la lanterne la plus proche, des deux côtés du robot.
// Le robot se tourne tout de suite vers elle. Renvoie null s'il n'y en a pas (ou si elle est du côté du mur sur lequel le robot glisse).
function choisirCibleTir(joueur) { // choisit la cible au moment où on appuie sur tir
    const scene = joueur.scene; // la scène où se trouve le robot
    // cherche un ennemi à viser automatiquement, des deux côtés du robot
    let cible = chercherCible(joueur, joueur.body.center.x, joueur.body.center.y); // la meilleure cible autour du robot
    const cibleAGauche = cible && cible.body.center.x < joueur.body.center.x; // vrai si l'ennemi trouvé est à gauche du robot
    // contre un mur, un ennemi derrière est côté mur : on tirerait dans le mur, donc pas de visée auto
    if (cible && joueur.surMur && cibleAGauche !== joueur.regardeGauche) cible = null; // collé à un mur, on ne vise pas ce qui est derrière lui
    if (cible && !joueur.surMur) { // un ennemi est à portée et le robot n'est pas collé à un mur
        joueur.regardeGauche = cibleAGauche; // le robot se tourne vers l'ennemi
        joueur.regardJusqua = scene.time.now + DUREE_REGARD_TIR; // et reste tourné vers lui le temps du tir
    }
    return cible; // on renvoie la cible choisie (ou rien)
}
// fait partir une balle du canon : vers la cible de la visée auto, sinon dans la direction de la pose de tir en cours
function tirer(joueur) { // appelée au début de l'animation de tir : lance les balles
    const scene = joueur.scene; // la scène du robot
    const anim = ANIMATIONS[joueur.nomAnim]; // l'animation de tir qui vient de démarrer
    let cible; // la cible de ce tir
    if (joueur.cibleTirPrete) { // majPersonnage a déjà choisi la cible (et la pose qui va avec) : on la reprend
        cible = joueur.cibleTir; // on reprend la cible déjà choisie
        joueur.cibleTirPrete = false; // elle est utilisée une seule fois
    } else { // tir lancé par un niveau avec jouerAction : on cherche la cible ici
        cible = choisirCibleTir(joueur); // sinon on en cherche une
        if (cible) orienter(joueur); // retourne l'image tout de suite, avant de calculer la position du canon
    }
    joueur.cibleTir = null; // on efface la cible gardée
    lancerBalle(joueur, anim, cible); // la première balle part tout de suite
    if (anim.recul) reculer(joueur, anim.recul); // s'il y a un recul (tir vers le bas), on l'applique
    // Boosté (voir boost.js), le robot tire en rafale : chaque niveau de boost ajoute une balle, 70 ms après la précédente
    for (let i = 1; i <= (joueur.boostNiveau ?? 0); i++) { // une balle de plus par niveau de boost
        scene.time.delayedCall(i * DELAI_RAFALE, () => { if (joueur.active && joueur.action !== "mort") lancerBalle(joueur, anim, cible); }); // elle part un peu plus tard que la précédente, si le robot est toujours en vie
    }
}

// crée une balle au bout du canon (à l'endroit où il est à cet instant) : vers la cible si elle est encore là, sinon dans la direction de la pose
function lancerBalle(joueur, anim, cible) { // crée une balle au bout du canon
    const scene = joueur.scene; // la scène du robot
    const sens = joueur.regardeGauche ? -1 : 1; // sens du tir, calculé après le demi-tour éventuel
    const visee = anim.visee ?? { x: 1, y: 0 }; // x est inversé quand le robot regarde à gauche
    const bouche = anim.bouche ?? BOUCHE; // l'endroit où naît la balle dans l'image
    // le niveau 2 crée déjà ce groupe ; les autres scènes l'auront au premier tir
    if (!joueur.tirs && (!scene.tirsJoueur || !scene.tirsJoueur.scene)) { // si le groupe de balles n'existe pas encore...
        scene.tirsJoueur = scene.physics.add.group({ allowGravity: false }); // ...on le crée (sans gravité)
    }
    const tirs = joueur.tirs ?? scene.tirsJoueur; // en 1 contre 1 chaque robot a son groupe de balles (joueur.tirs) : on sait qui a tiré
    if (scene.groupe_plateformes && !tirs.collisionPlateformes) { // une seule fois par groupe : les balles disparaissent contre les plateformes
        tirs.collisionPlateformes = scene.physics.add.collider(tirs, scene.groupe_plateformes, (balle) => balle.destroy()); // les balles disparaissent contre les murs
    }
    let x = joueur.x + sens * (bouche.x - CENTRE_X) * ECHELLE; // même repère que l'ancrage du sprite : x = torse, y = pieds
    let y = joueur.y + (bouche.y - PIED_Y - (anim.haut ?? 0)) * ECHELLE; // la hauteur de départ de la balle (y)
    // le canon dépasse dans un mur (robot collé à un bloc) : la balle partirait déjà dans le mur et disparaîtrait, on la fait partir du
    // centre du robot
    if (dansUnMur(scene, x, y)) { x = joueur.body.center.x; y = joueur.body.center.y; } // si le canon est dans un mur, la balle part du centre du robot
    const balle = tirs.create(x, y, PREFIXE + "balle"); // on crée la balle
    jouerSon(scene, "tir"); // bruit du tir
    balle.setScale(ECHELLE); // on l'agrandit comme le robot
    balle.body.setAllowGravity(false); // la gravité ne l'affecte pas
    // (pour une balle de la rafale : la cible a pu mourir entre-temps)
    const cibleEncoreLa = cible && cible.active && cible.body && cible.etat !== "mort"; // vrai si la cible est toujours là
    if (cibleEncoreLa) { // un ennemi est à portée
        const point = pointDegage(scene, x, y, cible) ?? cible.body.center; // le point de l'ennemi qu'on voit depuis le canon (le centre si possible)
        const angle = Phaser.Math.Angle.Between(x, y, point.x, point.y); // angle entre le canon et ce point
        scene.physics.velocityFromRotation(angle, TIR.vitesseBalle, balle.body.velocity); // envoie la balle dans cette direction, à la vitesse normale
    } else { // aucun ennemi à portée
        balle.setVelocity(sens * visee.x * TIR.vitesseBalle, visee.y * TIR.vitesseBalle); // tir normal, dans la direction de la visée
    }
    scene.time.delayedCall(TIR.dureeBalle, () => balle.destroy()); // la balle disparaît après sa durée de vie
}

// Pousse le robot vers le haut quand il tire vers le bas. Une seule fois par saut : sans cette limite, on pourrait
// monter sans fin en tirant vers le bas toutes les 300 ms (et le niveau 1 est une montée de 6400 px).
// Un recul ne ralentit jamais une montée déjà plus rapide (un saut à 600 px/s n'est pas freiné par un recul à 420).
function reculer(joueur, vitesse) { // le recul du robot quand il tire vers le bas
    if (!joueur.reculDispo) return; // pas de recul si déjà utilisé pendant ce saut
    // au sol (un ennemi plus bas, visé automatiquement) : pas de recul, ce serait un saut gratuit
    if (joueur.body.blocked.down || joueur.body.touching.down) return; // pas de recul au sol
    joueur.reculDispo = false; // on note que le recul est utilisé
    joueur.setVelocityY(Math.min(joueur.body.velocity.y, -vitesse)); // il monte (au moins à la vitesse du recul)
}

// lance l'animation "nom" puis règle ancrage et hitbox pour cette animation
function jouer(joueur, nom, continuer) { // joue une animation du robot
    joueur.anims.play(PREFIXE + nom, continuer); // continuer = true : ne relance pas l'animation si elle tourne déjà
    joueur.nomAnim = nom; // on retient son nom
    orienter(joueur); // et on met le robot dans le bon sens
}

// Retourne le sprite dans le bon sens et cale l'ancrage + la hitbox sur le torse du robot.
// Phaser retourne l'image à l'intérieur de la frame (autour de son milieu), donc le torse
// change de colonne quand on retourne : on recalcule la colonne du torse dans ce cas.
function orienter(joueur) { // retourne le sprite et cale la hitbox
    const anim = ANIMATIONS[joueur.nomAnim]; // l'animation en cours
    const dessinDroite = anim.dessinDroite !== false; // vrai si le dessin d'origine regarde à droite
    const miroir = joueur.regardeGauche === dessinDroite; // retourné si le sens voulu est l'inverse du sens dessiné
    const etat = joueur.nomAnim + miroir; // un code qui change si l'animation ou le sens changent
    if (joueur.etatOrientation === etat) return; // rien n'a changé depuis la dernière image
    joueur.etatOrientation = etat; // on retient ce code pour la prochaine image

    const centre = miroir ? LARGEUR - (anim.centre ?? CENTRE_X) : (anim.centre ?? CENTRE_X); // colonne du torse à l'écran
    const corps = anim.corps; // la hitbox de cette animation
    const marge = anim.haut ?? 0; // lignes ajoutées au-dessus du robot dans cette animation : tout descend d'autant
    joueur.setFlipX(miroir); // on retourne l'image si besoin
    joueur.setOrigin(centre / LARGEUR, (PIED_Y + marge) / (anim.hauteur ?? HAUTEUR)); // x,y du sprite = milieu du torse, pieds
    joueur.body.setSize(corps.w, corps.h, false); // on règle la taille de la hitbox
    joueur.body.setOffset(centre - corps.w / 2, corps.y + marge); // et sa position sur le torse
}
