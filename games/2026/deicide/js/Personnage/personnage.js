// Personnage principal : le robot "Bot Wheel"
//
// Les images du Bot Wheel sont des bandes verticales : chaque frame fait 117 x 26 pixels
// et les frames sont empilées les unes sous les autres (assets/Spritesheet/Player/Bot Wheel/).
// Le robot n'occupe qu'un petit morceau de la frame (le reste sert aux effets : poussière, tir, gaz).
// Du coup l'ancrage du sprite et la hitbox sont réglés à la main (voir ANIMATIONS) :
// c'est ce qui permet de retourner le robot à gauche sans qu'il "saute" de côté.
//
// Utilisation :
//   preload() de "selection"        : chargerPersonnage(this)
//   create()  de "selection"        : creerAnimationsPersonnage(this)  (une seule fois, les animations sont globales)
//   create()  de chaque niveau      : this.player = creerPersonnage(this, x, y)
//   update()  de chaque niveau      : majPersonnage(this.player, this.clavier)
//   pour une animation ponctuelle   : jouerAction(this.player, "degats")
//
// Touches gérées par majPersonnage : flèches (déplacement, saut), F (tir), MAJ (dash).
// Saut de mur : en l'air contre un mur, en poussant vers lui, le robot glisse lentement ;
// un nouvel appui sur la flèche du haut le fait rebondir dans l'autre sens.
// Tir en 8 directions : la balle part dans le sens des flèches tenues au moment où on appuie sur F
// (haut, haut en diagonale, droit devant) ; vers le bas, seulement en l'air (voir animationDeTir).
// Les balles sont rangées dans scene.tirsJoueur (le groupe est créé au premier tir s'il n'existe pas)
// et s'arrêtent sur scene.groupe_plateformes quand la scène en a un.

const DOSSIER = "./assets/Spritesheet/Player/Bot Wheel/";
const PREFIXE = "botwheel_"; // évite les conflits avec les autres textures / animations du jeu
const LARGEUR = 117; // taille d'une frame dans les bandes
const HAUTEUR = 26;
const PIED_Y = 25; // ligne du sol dans la frame : le bas du robot est toujours collé au pixel 25
const CENTRE_X = 23; // colonne du centre du torse dans la frame (quand le robot regarde à droite)
const ECHELLE = 2; // le robot est petit : on l'agrandit x2 (pixel art)
const FPS = 10; // le fichier aseprite donne 100 ms par image pour toutes les animations
const VITESSE = 300; // mêmes valeurs que le "dude" d'origine
const SAUT = 600; // vitesse de décollage : avec 1000 de gravité à la montée, il monte d'environ 180 px comme avant, mais en 0,6 s au lieu de 1,1 s
const SEUIL_SAUT = 150; // vitesse verticale (px/s) à partir de laquelle on considère que le robot saute ou tombe (le petit rebond à l'atterrissage reste en dessous)
const VITESSE_GLISSE = 90; // vitesse de chute maximale (px/s) quand le robot glisse contre un mur
const VITESSE_SAUT_MUR = 220; // vitesse horizontale donnée par un saut de mur, dans le sens opposé au mur
const DUREE_VERROU = 220; // ms pendant lesquelles on ne peut pas diriger le robot après un saut de mur (sinon il se recolle au mur)
const DELAI_MUR = 120; // ms pendant lesquelles on peut encore sauter après avoir quitté le mur (le jeu pardonne un appui un peu tardif)
const DELAI_TIR = 300; // ms minimum entre deux tirs
const DELAI_DASH = 600; // ms minimum entre deux dashs
// Le dash est assemblé à partir de deux bandes (voir creerTextureDash) : dans le dessin d'origine le robot
// regarde à gauche avec la fumée DEVANT lui. On retourne le robot sur place et on garde la fumée derrière.
const TORSE_DASH = 105.5; // colonne du centre du torse dans les bandes du dash d'origine
const DECALAGE_DASH = 6; // on décale le tout de 6 px vers la gauche : le robot retourné a besoin de place à droite
const IMAGES_DASH = 7;
const VITESSE_BALLE = 700; // px/s
const DUREE_BALLE = 1500; // ms avant que la balle disparaisse si elle ne touche rien
const BOUCHE = { x: 40, y: 10 }; // où naît la balle dans la frame de tir : le centre de la boule de flash du canon
// Les visées vers le haut et le bas (bande "shoot aim.png") ont été fabriquées à partir de "shoot without FX.png" et
// "shoot FX.png" : le fusil et les poings sont tournés de 45° ou 90° autour du poing avant, la flamme les suit, le haut
// du torse est refait. Leurs frames sont plus hautes (117 x 58) car la flamme dépasse du dessin d'origine :
// 16 lignes ajoutées au-dessus du robot et 16 en dessous.
const HAUTEUR_VISEE = 58;
const MARGE_HAUT_VISEE = 16;
const DIAGONALE = Math.SQRT1_2; // cos 45° : une balle en diagonale va aussi vite que les autres

// Petite balle d'énergie (elle n'est pas dans les spritesheets) : 8 x 6 pixels aux couleurs du robot.
const BALLE = ["..cccc..", ".cwwwwc.", "cwwwwwwc", "cwwwwwwc", ".cwwwwc.", "..cccc.."];
const COULEURS_BALLE = { c: "#ac98b6", w: "#e7e0e9" };

// Hitboxes (en pixels de la frame, avant agrandissement). Elles sont centrées sur le torse
// et un peu plus étroites que le dessin (torse = 11 px, hitbox = 10 px) pour rester tolérantes.
const CORPS_DEBOUT = { y: 4, w: 10, h: 21 };
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
const VISEE = { hauteur: HAUTEUR_VISEE, haut: MARGE_HAUT_VISEE, repeat: 0, corps: CORPS_DEBOUT, debut: tirer };
const ANIMATIONS = {
    repos: { fichier: "static idle.png", images: [0], repeat: -1, corps: CORPS_REPOS },
    marche: { fichier: "move with FX.png", images: serie(8), repeat: -1, corps: CORPS_DEBOUT },
    saut: { fichier: "move without FX.png", images: [3], repeat: -1, corps: CORPS_DEBOUT }, // pas d'anim de saut dans la feuille : on fige une image de la marche, sans la poussière
    mur: { bande: "saut", images: serie(8), repeat: -1, fps: 20, corps: CORPS_DEBOUT }, // PAS d'animation de mur dans les feuilles : en attendant, la roue qui tourne (bande "saut") joue en accéléré. Pour une vraie pose, remplacer bande par fichier et images.
    reveil: { fichier: "wake.png", images: serie(5), repeat: 0, corps: CORPS_DEBOUT, bloquant: true },
    charge: { fichier: "charge.png", images: serie(4), repeat: 0, corps: CORPS_DEBOUT },
    tir: { fichier: "shoot with FX.png", images: serie(4), repeat: 0, corps: CORPS_DEBOUT, debut: tirer },
    // les 4 autres visées partagent une seule bande, "shoot aim.png" (4 images par visée, retournées pour viser à gauche)
    // bouche = où se trouve le centre de la flamme dans la frame (calculé comme BOUCHE, en suivant la rotation du canon)
    tir_haut_diag: { ...VISEE, fichier: "shoot aim.png", images: [0, 1, 2, 3], visee: { x: DIAGONALE, y: -DIAGONALE }, bouche: { x: 38, y: 14 } },
    tir_haut: { ...VISEE, bande: "tir_haut_diag", images: [4, 5, 6, 7], visee: { x: 0, y: -1 }, bouche: { x: 27, y: 10 } },
    tir_bas_diag: { ...VISEE, bande: "tir_haut_diag", images: [8, 9, 10, 11], visee: { x: DIAGONALE, y: DIAGONALE }, bouche: { x: 40, y: 42 } },
    tir_bas: { ...VISEE, bande: "tir_haut_diag", images: [12, 13, 14, 15], visee: { x: 0, y: 1 }, bouche: { x: 29, y: 48 } },
    dash: { fichier: null, images: serie(IMAGES_DASH), repeat: 0, fps: 20, corps: CORPS_DEBOUT, centre: TORSE_DASH - DECALAGE_DASH, bloquant: true, elan: 500, sansGravite: true }, // pas de bande à charger : la texture est assemblée par creerTextureDash ; à 20 fps il dure 350 ms, soit environ 175 px
    degats: { fichier: "damaged.png", images: serie(2), repeat: 0, corps: CORPS_DEBOUT },
    mort: { fichier: "death.png", images: serie(6), repeat: 0, corps: CORPS_MORT, bloquant: true, figee: true }
};

function serie(n) {
    return Array.from({ length: n }, (_, i) => i); // [0, 1, 2, ..., n-1]
}

// à appeler dans preload() : charge toutes les bandes du Bot Wheel
export function chargerPersonnage(scene) {
    const bande = (cle, fichier, hauteur = HAUTEUR) => scene.load.spritesheet(PREFIXE + cle, DOSSIER + fichier, { frameWidth: LARGEUR, frameHeight: hauteur });
    for (const [nom, anim] of Object.entries(ANIMATIONS)) {
        if (anim.fichier) bande(nom, anim.fichier, anim.hauteur);
    }
    bande("dash_robot", "GAS dash with FX.png"); // le robot (sa dernière image est sans fumée)
    bande("dash_fumee", "GAS dash FX.png"); // la fumée seule
}

// à appeler dans create() de la première scène : crée les animations à partir des bandes (et les textures de la balle et du dash)
export function creerAnimationsPersonnage(scene) {
    creerTextureDash(scene);
    for (const [nom, anim] of Object.entries(ANIMATIONS)) {
        const cle = PREFIXE + nom;
        const cleBande = PREFIXE + (anim.bande ?? nom); // certaines animations réutilisent la bande d'une autre
        scene.textures.get(cleBande).setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
        if (scene.anims.exists(cle)) continue; // déjà créée (relance de la scène)
        scene.anims.create({
            key: cle,
            frames: scene.anims.generateFrameNumbers(cleBande, { frames: anim.images }),
            frameRate: anim.fps ?? FPS,
            repeat: anim.repeat
        });
    }
    creerTextureBalle(scene);
}

// Assemble la bande du dash : pour chaque image, la fumée d'origine (à gauche du robot) puis le robot
// retourné sur place pour qu'il regarde à droite. Le robot est la dernière image de la bande "with FX",
// la seule sans fumée. Il n'apparaît qu'à partir de la 2e image : la 1re n'est que de la fumée.
function creerTextureDash(scene) {
    const cle = PREFIXE + "dash";
    if (scene.textures.exists(cle)) return; // déjà créée
    const robot = scene.textures.get(PREFIXE + "dash_robot").getSourceImage();
    const fumee = scene.textures.get(PREFIXE + "dash_fumee").getSourceImage();
    const texture = scene.textures.createCanvas(cle, LARGEUR, HAUTEUR * IMAGES_DASH);
    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false; // on copie des pixels, sans les mélanger
    for (let i = 0; i < IMAGES_DASH; i++) {
        const y = i * HAUTEUR;
        ctx.drawImage(fumee, 0, y, LARGEUR, HAUTEUR, -DECALAGE_DASH, y, LARGEUR, HAUTEUR);
        if (i > 0) {
            ctx.save();
            ctx.setTransform(-1, 0, 0, 1, 2 * TORSE_DASH - DECALAGE_DASH, y); // miroir autour du centre du torse
            ctx.drawImage(robot, 0, (IMAGES_DASH - 1) * HAUTEUR, LARGEUR, HAUTEUR, 0, 0, LARGEUR, HAUTEUR);
            ctx.restore();
        }
        texture.add(i, 0, 0, y, LARGEUR, HAUTEUR); // image numéro i, comme pour les autres bandes
    }
    texture.refresh();
}

// dessine la balle pixel par pixel dans une texture
function creerTextureBalle(scene) {
    if (scene.textures.exists(PREFIXE + "balle")) return; // déjà créée
    const texture = scene.textures.createCanvas(PREFIXE + "balle", 8, 6);
    const ctx = texture.getContext();
    BALLE.forEach((ligne, y) => {
        [...ligne].forEach((lettre, x) => {
            if (lettre === ".") return; // transparent
            ctx.fillStyle = COULEURS_BALLE[lettre];
            ctx.fillRect(x, y, 1, 1);
        });
    });
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

// crée le joueur en (x, y). y correspond aux pieds du robot.
export function creerPersonnage(scene, x, y) {
    const joueur = scene.physics.add.sprite(x, y, PREFIXE + "repos");
    joueur.setScale(ECHELLE);
    joueur.setBounce(0.2);
    joueur.setCollideWorldBounds(true);
    joueur.body.maxVelocity.y = 900;
    joueur.regardeGauche = false; // sens dans lequel regarde le robot
    joueur.action = null; // nom de l'action en cours (voir jouerAction), null sinon
    joueur.enSaut = false; // vrai entre le décollage (ou le début d'une chute) et le retour au sol
    joueur.surMur = false; // vrai quand le robot glisse contre un mur
    joueur.sensMur = 0; // dernier mur touché en l'air : -1 = à gauche, 1 = à droite
    joueur.instantMur = -1e9; // et quand on l'a touché
    joueur.verrouJusqua = 0; // instant jusqu'auquel les flèches gauche/droite sont ignorées (après un saut de mur)
    joueur.touches = scene.input.keyboard.addKeys({ tir: "F", dash: "SHIFT" }, false); // false : on ne bloque pas les raccourcis du navigateur (Ctrl+F...)
    joueur.prochainTir = 0; // instant à partir duquel on peut retirer
    joueur.prochainDash = 0; // instant à partir duquel on peut redasher
    // une action non figée est terminée quand son animation est finie : on rend la main aux animations automatiques
    joueur.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation) => {
        if (joueur.action && animation.key === PREFIXE + joueur.action && !ANIMATIONS[joueur.action].figee) {
            joueur.action = null;
            joueur.body.setAllowGravity(true); // fin du dash
        }
    });
    jouer(joueur, "repos", false);
    return joueur;
}

// à appeler dans update() : déplacements, saut et choix de l'animation
export function majPersonnage(joueur, clavier) {
    const action = joueur.action ? ANIMATIONS[joueur.action] : null;
    const maintenant = joueur.scene.time.now;
    const auSol = joueur.body.blocked.down || joueur.body.touching.down;
    if (joueur.body.velocity.y > 0) { // permet de savoir si le personnage est en train de tomber
        joueur.body.setGravityY(1100); // quand il tombe : 300 + 1100 = 1400
    } else {
        joueur.body.setGravityY(700); // quand il monte : 300 + 700 = 1000, il monte vite et s'arrête net
    }
    if (auSol) joueur.enSaut = false;
    else if (Math.abs(joueur.body.velocity.y) > SEUIL_SAUT) joueur.enSaut = true;

    const libre = !(action && action.bloquant); // pas de contrôle pendant le réveil, le dash, la mort
    const verrou = maintenant < joueur.verrouJusqua; // juste après un saut de mur, on ne dirige plus le robot
    const gauche = libre && clavier.left.isDown;
    const droite = libre && clavier.right.isDown;
    if (libre) {
        if (verrou) {
            // on laisse la vitesse du saut de mur telle quelle
        } else if (gauche) {
            joueur.setVelocityX(-VITESSE);
            joueur.regardeGauche = true;
        } else if (droite) {
            joueur.setVelocityX(VITESSE);
            joueur.regardeGauche = false;
        } else {
            joueur.setVelocityX(0);
        }
        if (clavier.up.isDown && auSol) joueur.setVelocityY(-SAUT);
    }

    // Glisse et saut de mur. Le robot touche un mur (bord du monde ou côté d'une plateforme) quand Phaser
    // signale un contact à gauche ou à droite : il faut donc pousser vers le mur pour rester collé.
    const veutSaut = Phaser.Input.Keyboard.JustDown(clavier.up); // appui neuf : garder la flèche enfoncée ne rechaîne pas les sauts
    const bords = joueur.scene.physics.world.bounds; // identifie si le joueur se trouve contre un bord de la map
    const auBordGauche = joueur.body.left <= bords.left + 1; // si le joueur est à 1 pixel du bord de la map il est considéré comme collé au bord
    const auBordDroit = joueur.body.right >= bords.right - 1; // si le joueur est à 1 pixel du bord de la map il est considéré comme collé au bord
    const contactGauche = (joueur.body.blocked.left || joueur.body.touching.left) && !auBordGauche; // si le joueur est en contact avec un mur et qu'il n'est pas collé au bord de la map
    // alors il peut sauter
    const contactDroite = (joueur.body.blocked.right || joueur.body.touching.right) && !auBordDroit;// si le joueur est en contact avec un mur et qu'il n'est pas collé au bord de la map
    // alors il peut sauter
    if (!auSol && (contactGauche || contactDroite)) {
        joueur.sensMur = contactDroite ? 1 : -1;
        joueur.instantMur = maintenant;
    }
    const pousse = gauche ? -1 : droite ? 1 : 0; // sens dans lequel le joueur pousse
    const contreLeMur = (pousse === -1 && contactGauche) || (pousse === 1 && contactDroite);
    joueur.surMur = libre && !verrou && !auSol && contreLeMur;
    if (joueur.surMur) {
        joueur.regardeGauche = pousse === 1; // le robot tourne le dos au mur : le canon et le saut partent vers l'extérieur
        if (joueur.body.velocity.y > VITESSE_GLISSE) joueur.setVelocityY(VITESSE_GLISSE);
    }
    if (libre && veutSaut && !auSol && maintenant - joueur.instantMur < DELAI_MUR) {
        joueur.setVelocityY(-SAUT);
        joueur.setVelocityX(-joueur.sensMur * VITESSE_SAUT_MUR);
        joueur.regardeGauche = joueur.sensMur === 1; // il regarde dans le sens où il part
        joueur.verrouJusqua = maintenant + DUREE_VERROU;
        joueur.instantMur = -1e9; // un contact = un saut
        joueur.enSaut = true;
        joueur.surMur = false;
    }

    // lus à chaque image, même quand ils sont inutilisables, pour ne pas garder un appui "en attente"
    const veutDash = Phaser.Input.Keyboard.JustDown(joueur.touches.dash);
    const veutTir = Phaser.Input.Keyboard.JustDown(joueur.touches.tir);
    if (libre && veutDash && maintenant >= joueur.prochainDash) {
        joueur.prochainDash = maintenant + DELAI_DASH;
        jouerAction(joueur, "dash");
    } else if (libre && veutTir && maintenant >= joueur.prochainTir) {
        joueur.prochainTir = maintenant + DELAI_TIR;
        jouerAction(joueur, animationDeTir(clavier, auSol));
    }

    if (!joueur.action) {
        jouer(joueur, joueur.surMur ? "mur" : joueur.enSaut ? "saut" : gauche || droite ? "marche" : "repos", true);
    } else {
        orienter(joueur);
    }
}

// Choisit la visée d'après les flèches tenues quand on appuie sur F. Le côté (gauche ou droite) vient du sens
// dans lequel regarde le robot : il tourne déjà vers la flèche tenue, et au mur il tourne le dos au mur.
//   rien, ou seulement gauche / droite : "tir"      haut : "tir_haut"      haut + côté : "tir_haut_diag"
//   bas (en l'air) : "tir_bas"                      bas + côté : "tir_bas_diag"
// Au sol, la flèche du bas est ignorée : une balle qui part vers le sol s'écraserait aussitôt dessus.
function animationDeTir(clavier, auSol) {
    const haut = clavier.up.isDown;
    const bas = clavier.down.isDown && !auSol;
    const cote = clavier.left.isDown || clavier.right.isDown;
    if (haut === bas) return "tir"; // aucune flèche verticale, ou haut et bas ensemble qui s'annulent
    if (haut) return cote ? "tir_haut_diag" : "tir_haut";
    return cote ? "tir_bas_diag" : "tir_bas";
}

// où en est la recharge du dash : 0 = vient d'être utilisé, 1 = prêt (sert à la jauge du HUD)
export function rechargeDash(joueur) {
    return Phaser.Math.Clamp(1 - (joueur.prochainDash - joueur.scene.time.now) / DELAI_DASH, 0, 1);
}

// joue une animation ponctuelle : "reveil", "charge", "tir" (ou tir_haut, tir_haut_diag, tir_bas, tir_bas_diag), "dash", "degats" ou "mort"
// les animations "bloquantes" (reveil, dash, mort) coupent les touches jusqu'à leur fin
// (F et MAJ appellent ça avec un tir et "dash", mais on peut aussi l'appeler depuis les niveaux)
export function jouerAction(joueur, nom) {
    if (joueur.action === "mort") return; // une fois mort, plus rien ne bouge
    const anim = ANIMATIONS[nom];
    joueur.action = nom;
    joueur.body.setAllowGravity(!anim.sansGravite);
    if (anim.sansGravite) joueur.setVelocityY(0);
    if (anim.bloquant) {
        joueur.setVelocityX(anim.elan ? (joueur.regardeGauche ? -anim.elan : anim.elan) : 0);
    }
    jouer(joueur, nom, false);
    if (anim.debut) anim.debut(joueur);
}

// fait partir une balle du canon, dans le sens où regarde le robot et dans la direction de la visée en cours
function tirer(joueur) {
    const scene = joueur.scene;
    const anim = ANIMATIONS[joueur.nomAnim]; // l'animation de tir qui vient de démarrer
    const sens = joueur.regardeGauche ? -1 : 1;
    const visee = anim.visee ?? { x: 1, y: 0 }; // x est inversé quand le robot regarde à gauche
    const bouche = anim.bouche ?? BOUCHE;
    if (!scene.tirsJoueur || !scene.tirsJoueur.scene) { // le niveau 2 crée déjà ce groupe ; les autres scènes l'auront au premier tir
        scene.tirsJoueur = scene.physics.add.group({ allowGravity: false });
    }
    const tirs = scene.tirsJoueur;
    if (scene.groupe_plateformes && !tirs.collisionPlateformes) { // une seule fois par groupe : les balles disparaissent contre les plateformes
        tirs.collisionPlateformes = scene.physics.add.collider(tirs, scene.groupe_plateformes, (balle) => balle.destroy());
    }
    const x = joueur.x + sens * (bouche.x - CENTRE_X) * ECHELLE; // même repère que l'ancrage du sprite : x = torse, y = pieds
    const y = joueur.y + (bouche.y - PIED_Y - (anim.haut ?? 0)) * ECHELLE;
    const balle = tirs.create(x, y, PREFIXE + "balle");
    balle.setScale(ECHELLE);
    balle.body.setAllowGravity(false);
    balle.setVelocity(sens * visee.x * VITESSE_BALLE, visee.y * VITESSE_BALLE);
    joueur.scene.time.delayedCall(DUREE_BALLE, () => balle.destroy());
}

// lance l'animation "nom" puis règle ancrage et hitbox pour cette animation
function jouer(joueur, nom, continuer) {
    joueur.anims.play(PREFIXE + nom, continuer); // continuer = true : ne relance pas l'animation si elle tourne déjà
    joueur.nomAnim = nom;
    orienter(joueur);
}

// Retourne le sprite dans le bon sens et cale l'ancrage + la hitbox sur le torse du robot.
// Phaser retourne l'image à l'intérieur de la frame (autour de son milieu), donc le torse
// change de colonne quand on retourne : on recalcule la colonne du torse dans ce cas.
function orienter(joueur) {
    const anim = ANIMATIONS[joueur.nomAnim];
    const dessinDroite = anim.dessinDroite !== false;
    const miroir = joueur.regardeGauche === dessinDroite; // retourné si le sens voulu est l'inverse du sens dessiné
    const etat = joueur.nomAnim + miroir;
    if (joueur.etatOrientation === etat) return; // rien n'a changé depuis la dernière image
    joueur.etatOrientation = etat;

    const centre = miroir ? LARGEUR - (anim.centre ?? CENTRE_X) : (anim.centre ?? CENTRE_X); // colonne du torse à l'écran
    const corps = anim.corps;
    const marge = anim.haut ?? 0; // lignes ajoutées au-dessus du robot dans cette animation : tout descend d'autant
    joueur.setFlipX(miroir);
    joueur.setOrigin(centre / LARGEUR, (PIED_Y + marge) / (anim.hauteur ?? HAUTEUR)); // x,y du sprite = milieu du torse, pieds
    joueur.body.setSize(corps.w, corps.h, false);
    joueur.body.setOffset(centre - corps.w / 2, corps.y + marge);
}
