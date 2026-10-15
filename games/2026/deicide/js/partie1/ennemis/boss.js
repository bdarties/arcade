// boss.js : le Dieu de la Lumière, le boss qui garde le sommet du niveau 1 (profil « soldat »).
// Le fichier est un MOTEUR : les réglages de chaque boss sont dans une table de profils (PROFILS) et ses attaques dans une table d'attaques (ATTAQUES).
// La partie 2 du jeu (js/partie2) ajoute dans ces deux tables le boss final et ses attaques, sans modifier ce fichier.
// Son dessin vient de feuilles d'images de 152 x 116 px (assets/images/boss/) : un ange en armure à un seul œil, avec un halo et une lance dorés, de grandes ailes dorées.
//   boss_idle (6 images, il plane : les ailes battent), boss_mort (8, il se dissout), et pour les attaques une préparation « charge » (6 images) puis un lancement « attaque » (4) :
//   les poses de base (lancer de lumière) et une variante par geste : sol, rayon, piqué, nova, invocation (voir GESTES et ANIMATIONS plus bas).
// Il apparaît quand arene.js ferme l'arène (voir faireApparaitreBoss), flotte en haut de la salle et attaque.
//
// 2 PHASES (selon ses PV) : au changement il devient invulnérable un instant, il lâche un PV à ramasser, et il se débloque
// de nouvelles attaques et il va plus vite.
//   phase 1 : orbes, colonne, pluie, lanternes
//   phase 2 : + balayage, nova (et plus d'orbes, 2 colonnes)
//
// LES ATTAQUES : il se prépare (animation « charge », avec une annonce visible), puis l'attaque part (animation « attaque »)
//   - orbes     : une salve d'orbes de lumière en éventail vers le robot
//   - colonne   : des traits clignotants au sol annoncent des rayons qui tombent du ciel (le premier suit le robot un instant)
//   - pluie     : des orbes tombent du haut de l'écran à des endroits annoncés par de petits traits ; une plateforme protège en dessous
//   - lanternes : il invoque des lanternes vivantes (elles font mal, mais un tir les abat et donne un boost)
//   - balayage  : un rayon horizontal frôle le sol de toute l'arène : il faut sauter ou monter sur une plateforme
//   - nova      : des anneaux d'orbes lentes s'écartent de lui, avec des trous entre les orbes
// Les tirs du robot le blessent. À 0 PV, le joueur choisit : arrêter la partie ici (le boss est vaincu), ou entrer dans le panthéon (OUI) : la
// suite du jeu est alors dans js/partie2 (profil.suite).
import { BOSS, ATTAQUES_BOSS, DEGATS } from "../parametres.js"; // PV, phases, points et réglages des attaques du boss
import { VERSION } from "../../version.js"; // le numéro de version du jeu (sert à recharger les images du boss après une mise à jour)
import { jouerSon, jouerSonSurLeTemps, surLeTemps, quantifier, musiqueBoss, viderSons } from "../systemes/sons.js"; // sons du combat : bruitages, musiques, rythme
import * as effets from "../systemes/effets.js"; // flashs, éclats, tremblements
import { gagnerPoints } from "../systemes/points.js"; // points gagnés
import { faireApparaitre as invoquerLanterne } from "./lanterne_vivante.js"; // le boss invoque des lanternes vivantes
import { lacherPV } from "../mecanismes/bonus.js"; // le boss lâche une croix de soin à chaque changement de phase

const LARGEUR_IMAGE = 152; // une image des feuilles
const HAUTEUR_IMAGE = 116; // hauteur d'une image des feuilles du boss, en pixels
const ECHELLE = 3; // le sprite est agrandi x3 : 456 x 348 px à l'écran, avec des pixels francs de 3 px comme le HUD (l'arène fait 1280 px de large)
const LARGEUR_BARRE = 520; // barre de vie du boss, en haut de l'écran

// Un profil par boss. pv, seuils (PV sous lesquels on passe en phase 2 puis 3 ; -1 = cette phase n'existe pas), attaques (par phase),
// pauses (ms entre deux attaques, par phase), echelle (taille du sprite), teinte (couleur du sprite, null = d'origine), nom (sur la barre de vie),
// cause (texte de mort), points (bonus quand il est vaincu).
// Un profil peut aussi avoir (tout est facultatif, la partie 2 s'en sert pour le boss final) : reglages (des valeurs qui remplacent celles de BASE,
// une entrée par phase), dureeEnPlus(nom, boss), apresColonnes(scene, boss, valide), finDeCombat(scene, boss), suite(scene, boss), musique,
// pvPleinsApresMort, pvDePhase(phase) (les PV d'une phase, s'ils ne sont pas profil.pv), pvMinimum(boss) (sous cette valeur le boss ne peut pas
// descendre), choisirAttaque(scene, boss) (sa propre façon de tirer les attaques), apresApparition(scene, boss), etiquettePhase(phase),
// pvDebutPhase(phase) (les PV du boss quand il ENTRE dans cette phase, ou rien : il garde ceux qu'il a).
// pvApresMort(phase) (avec pvPleinsApresMort : les PV de repart dans cette phase, ou rien : tous ses PV).
export const PROFILS = { // les boss du jeu : une fiche par boss
    soldat: { // le boss du niveau 1
        pantheon: true, // à 0 PV, le joueur choisit : arrêter la partie ici ou continuer (OUI : profil.suite, définie par la partie 2) (voir proposerPantheon)
        pv: BOSS.pv, seuils: BOSS.seuilsDePhase, echelle: ECHELLE, teinte: null, nom: "DIEU DE LA LUMIÈRE", cause: "le Dieu de la Lumière", points: BOSS.points, // PV, seuils de phase, taille, nom affiché, cause de mort et points (chiffres dans parametres.js)
        pauses: BOSS.pausesEntreAttaques, // ms de pause entre deux attaques, une valeur par phase
        attaques: [["orbes", "colonne", "pluie", "lanternes"], ["orbes", "colonne", "pluie", "lanternes", "balayage", "nova"]] // les attaques possibles : une liste pour la phase 1, une pour la phase 2
    }
};
let profil = PROFILS.soldat; // le profil du boss en cours (un seul boss à la fois : choisi par faireApparaitreBoss)

// Les réglages du boss, une entrée par phase : combien d'orbes, à quelle vitesse, etc. Un profil peut les remplacer (profil.reglages).
//   charge : multiplicateur du temps d'annonce      orbes / ouverture / vitesse : une salve d'orbes (nombre, angle total en degrés, px/s)
//   salves : salves d'orbes de suite                pluie / pluieVitesse : orbes de la pluie, leur vitesse
//   colonnes : décalages (px) des colonnes fixes de part et d'autre de celle qui suit le robot
//   nova : [orbes par anneau, anneaux, vitesse]     lanternes : lanternes invoquées      periodeMouvement : durée (ms) d'un va-et-vient du boss
const BASE = ATTAQUES_BOSS; // (les chiffres sont dans parametres.js)
export function reglages(boss) { // les réglages de la phase en cours : ceux de BASE, remplacés par ceux du profil
    const base = BASE[Math.min(boss.phase, BASE.length - 1)]; // les réglages de base de la phase en cours
    const propres = profil.reglages && profil.reglages[boss.phase]; // ceux que la fiche du boss remplace éventuellement
    return propres ? { ...base, ...propres } : base; // on mélange : les réglages du boss l'emportent sur ceux de base
}

// les feuilles : clé, nombre d'images, images par seconde, répétition (-1 = en boucle, 0 = une fois)
// Les 4 premières sont celles de toutes les attaques (idle : il plane ; charge/attaque : le lancer de lumière des orbes, de la pluie, de la spirale... ; mort : il se dissout). Les autres sont des variantes (préparation « charge » + lancement « attaque ») propres à un geste : voir GESTES.
const ANIMATIONS = [["boss_idle", 6, 7, -1], ["boss_charge", 6, 12, 0], ["boss_attaque", 4, 16, 0], ["boss_mort", 8, 7, 0], // nom, nombre d'images, vitesse et répétition de chaque animation du boss
    ["boss_charge_sol", 6, 12, 0], ["boss_attaque_sol", 4, 14, 0],      // il lève la lance (elle tremble), puis la plante dans le sol
    ["boss_charge_rayon", 6, 10, 0], ["boss_attaque_rayon", 4, 12, 0],  // son œil grandit et le halo s'élargit, puis le rayon part
    ["boss_charge_pique", 6, 12, 0], ["boss_attaque_pique", 4, 14, 0],  // il s'accroupit, puis la lance part en diagonale
    ["boss_charge_nova", 6, 10, 0], ["boss_attaque_nova", 4, 12, 0],    // ses ailes se referment en boule, puis explosent
    ["boss_charge_invocation", 6, 10, 0], ["boss_attaque_invocation", 4, 10, 0]]; // il lève la lance à deux mains, ailes ouvertes
// quelle variante pour quelle attaque : celles qui n'y sont pas gardent les animations de base
const GESTES = { colonne: "sol", geysers: "sol", damier: "sol", balayage: "rayon", lasers: "rayon", horloge: "rayon", pique: "pique", nova: "nova", lanternes: "invocation" }; // quel geste (animation) accompagne chaque attaque
function animation(attaque, etape) { return "boss_" + etape + (GESTES[attaque] ? "_" + GESTES[attaque] : ""); } // « boss_charge » ou « boss_charge_sol »...
export const ECLATS_OR = [0xffd45c, 300]; // mêmes réglages que les éclats de lanterne vivante (effets.js) : l'émetteur est déjà fabriqué
export const ECLATS_BLANC = [0xffffff, 190]; // couleur et nombre des éclats blancs lors d'un coup

// À augmenter quand les images du boss changent : l'adresse change, donc le navigateur recharge les feuilles au lieu de garder en mémoire les anciennes
// (sinon, après une mise à jour, on peut voir l'ancien dessin du boss pendant des heures).
const REVISION_IMAGES = 2; // numéro à changer pour forcer le navigateur à recharger les images du boss
export function chargerBoss(scene) { // à appeler dans chargerJeu (preload)
    ANIMATIONS.forEach(([cle]) => scene.load.spritesheet(cle, "./assets/images/boss/" + cle + ".png?r=" + REVISION_IMAGES + "-" + VERSION, { frameWidth: LARGEUR_IMAGE, frameHeight: HAUTEUR_IMAGE })); // on charge chaque feuille d'images du boss
}

export function creerAnimations(scene) { // crée une seule fois les 4 animations (exportée : poursuite.js dessine le même boss)
    ANIMATIONS.forEach(([cle, nb, vitesse, repeat]) => { // pour chaque animation du boss
        scene.textures.get(cle).setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
        if (!scene.anims.exists(cle)) scene.anims.create({ key: cle, frames: scene.anims.generateFrameNumbers(cle, { start: 0, end: nb - 1 }), frameRate: vitesse, repeat }); // on la crée une seule fois (pas si elle existe déjà)
    });
}

export function faireApparaitreBoss(scene, x, y, nomProfil = "soldat") { // fait apparaître le boss en (x, y) : le centre de son sprite
    profil = PROFILS[nomProfil]; // les réglages de ce boss
    profil.cle = nomProfil; // son nom, pour retenir la phase atteinte (voir changerDePhase)
    creerAnimations(scene); // on prépare les animations
    musiqueBoss(scene, profil.musique); // la musique metal du combat démarre avec l'apparition du boss
    const boss = scene.physics.add.sprite(x, y, "boss_idle", 0); // un sprite avec un corps physique, pour les tirs du joueur
    boss.profil = profil; // les attaques de la partie 2 retrouvent ainsi son profil
    boss.body.setAllowGravity(false); // il vole : la gravité ne l'affecte pas
    boss.body.setImmovable(true); // le boss ne bouge pas quand on le touche
    boss.body.setSize(38, 70).setOffset(59, 25); // la hitbox est le corps de l'armure (casque, torse, ventre), sans les ailes ni la lance : de y 25 à y 95 dans l'image de 152 x 116, centrée sur l'œil (x 78, y 38)
    boss.setScale(profil.echelle).setDepth(51).setAlpha(0); // taille, ordre d'affichage, et invisible au début
    if (scene.player) scene.player.setDepth(52); // le robot passe DEVANT le boss quand ils se chevauchent (le boss est à 51, au-dessus du voile d'ombre à 50 ; sans ça le robot, à 0, passait derrière)
    // la teinte revient après chaque flash (voir effets.flash) // au-dessus du voile d'ombre (50) : c'est lui la lumière
    if (profil.teinte) { boss.setTint(profil.teinte); boss.teinteBase = profil.teinte; } // si le boss a une teinte, on l'applique
    boss.play("boss_idle"); // il commence en vol immobile
    // reprise après une mort : le combat repart au début de la phase où le robot est mort (voir changerDePhase), pas depuis la phase 1
    const reprise = scene.registry.get("phaseBoss"); // y a-t-il une phase à reprendre après une mort ?
    const phaseDepart = reprise && reprise.profil === nomProfil ? reprise.phase : 0; // la phase où il démarre : celle de la reprise, sinon la première
    // au début d'une phase, le boss a exactement les PV de son seuil (sauf si la reprise donne ses PV : touche de test F10, voir partie2/tests_borne.js)
    boss.pvMax = profil.pvDePhase ? profil.pvDePhase(phaseDepart) : profil.pv; // les PV de la phase de départ (la barre de vie se règle dessus)
    boss.pv = reprise && reprise.pv !== undefined && reprise.profil === nomProfil ? reprise.pv : phaseDepart === 0 ? boss.pvMax : profil.pvPleinsApresMort ? (profil.pvApresMort && profil.pvApresMort(phaseDepart)) ?? boss.pvMax : profil.seuils[phaseDepart - 1]; // pvPleinsApresMort : après une mort il garde la phase atteinte mais repart avec TOUS ses PV
    boss.etat = "apparition"; // apparition -> combat <-> attaque -> transition (changement de phase) ; puis choix, fin (ou ce que fait la partie 2)
    boss.phase = phaseDepart; // 0 ou 1 (2 pour un boss à 3 phases)
    if (reprise && reprise.pv !== undefined) scene.registry.set("phaseBoss", { profil: nomProfil, phase: phaseDepart }); // les PV donnés ne servent qu'une fois : après une mort, le boss reprend au seuil de sa phase
    boss.departY = y; // hauteur autour de laquelle il flotte
    boss.prochaineAttaque = Infinity; // pas d'attaque avant la fin de l'apparition
    boss.derniereAttaque = null; // aucune attaque lancée pour l'instant
    boss.faits = new Set(); // les attaques que le boss a lancées depuis le début de cette phase (voir pvMinimum)
    boss.jeton = 0; // numéro de l'attaque en cours : une attaque interrompue (changement de phase, mort) ne fait plus rien
    boss.enMouvement = false; // vrai quand une attaque déplace elle-même le boss (il ne flotte plus : voir majBoss)
    boss.fige = false; // vrai quand le boss ne doit plus bouger du tout
    boss.intouchable = false; // vrai quand les tirs du robot ne lui font plus rien
    scene.zonesBoss = []; // la liste des rayons de lumière du combat, vide au départ
    Object.values(ATTAQUES).forEach((def) => { if (def.demarrer) def.demarrer(scene, boss); }); // chaque attaque prépare ce dont elle a besoin

    if (scene.textures.exists("halo_doux")) { // une lueur dorée derrière lui (la texture vient d'ennemis_normaux.js)
        const halo = scene.add.image(x, y, "halo_doux"); // l'image de la lueur dorée
        halo.setScale(4.2).setTint(0xfff2c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0).setPipeline("SinglePipeline"); // on l'agrandit, la teinte, la fait briller et la cache au départ
        boss.halo = halo; // on la range dans le boss
        boss.once("destroy", () => halo.destroy()); // elle est détruite avec le boss
    }
    boss.barre = creerBarre(scene); // on crée la barre de vie du boss
    boss.barre.plein.width = LARGEUR_BARRE * boss.pv / boss.pvMax; // la barre est déjà au bon niveau si on reprend en phase 2 ou 3
    scene.tweens.add({ targets: [boss, boss.halo].filter(Boolean), alpha: { value: (cible) => (cible === boss ? 1 : 0.35) }, duration: 1500, onComplete: () => { // le boss apparaît en fondu (la lueur reste plus discrète)
        boss.etat = "combat"; // à la fin du fondu, le combat commence
        boss.prochaineAttaque = scene.time.now + surLeTemps(scene, 1200); // la première attaque arrive peu après, sur une croche
    } }); // fin de l'animation d'apparition
    scene.tweens.add({ targets: elementsBarre(boss), alpha: 1, duration: 800 }); // la barre de vie apparaît aussi en fondu

    scene.physics.add.overlap(scene.tirsJoueur, boss, (a, b) => toucherBoss(scene, boss, a === boss ? b : a)); // un tir du robot touche le boss
    scene.boss = boss; // la scène retient le boss
    if (profil.apresApparition) profil.apresApparition(scene, boss); // (le boss final retrouve ici sa forme finale si le robot est mort contre elle)
    const suivre = (temps) => majBoss(scene, boss, temps); // fonction appelée à chaque image pour faire vivre le boss
    scene.events.on(Phaser.Scenes.Events.UPDATE, suivre); // on la branche sur la mise à jour de la scène
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, suivre)); // et on la débranche quand la scène s'arrête
    return boss; // on renvoie le boss créé
}

// ---------------------------------------------------------------------------------------------
// Barre de vie : un cadre, une barre pleine, deux repères de phase et le nom, fixes en haut au milieu de l'écran
// ---------------------------------------------------------------------------------------------

function creerBarre(scene) { // crée la barre de vie du boss en haut de l'écran
    const y = 26; // hauteur de la barre à l'écran
    const gauche = 640 - LARGEUR_BARRE / 2; // bord gauche de la barre (elle est centrée)
    const fond = scene.add.rectangle(640, y, LARGEUR_BARRE + 8, 22, 0x251d2a).setStrokeStyle(2, 0x5f4f6e).setScrollFactor(0).setDepth(101).setAlpha(0); // le cadre sombre derrière la barre
    const plein = scene.add.rectangle(gauche, y, LARGEUR_BARRE, 12, 0xe7e0e9).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102).setAlpha(0); // la partie pleine de la barre
    // un trait à chaque changement de phase
    const reperes = profil.seuils.filter((seuil) => seuil > 0).map((seuil) => scene.add.rectangle(gauche + LARGEUR_BARRE * seuil / profil.pv, y, 3, 18, 0x251d2a).setScrollFactor(0).setDepth(103).setAlpha(0)); // un petit trait à chaque seuil de changement de phase
    const nom = scene.add.text(640, y + 20, profil.nom, { fontFamily: "monospace", fontSize: "16px", color: "#8a779b", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102).setAlpha(0); // le nom du boss sous la barre
    return { fond, plein, reperes, nom }; // on renvoie les 4 morceaux de la barre
}

export function elementsBarre(boss) { return [boss.barre.fond, boss.barre.plein, boss.barre.nom, ...boss.barre.reperes]; } // la liste de tous les morceaux de la barre (pour les afficher ou les cacher d'un coup)

function majBarre(scene, boss) { // la barre rétrécit en douceur, avec un éclat blanc
    const largeur = LARGEUR_BARRE * Math.max(0, boss.pv) / boss.pvMax; // la largeur de la barre selon les PV restants
    scene.tweens.add({ targets: boss.barre.plein, width: largeur, duration: 160 }); // la barre rétrécit en douceur
    boss.barre.plein.setFillStyle(0xffffff); // un éclair blanc quand le boss est touché
    scene.time.delayedCall(80, () => { if (boss.barre.plein.active) boss.barre.plein.setFillStyle(0xe7e0e9); }); // puis elle reprend sa couleur au bout de 80 ms
}

// ---------------------------------------------------------------------------------------------
// À chaque image
// ---------------------------------------------------------------------------------------------

function majBoss(scene, boss, temps) { // appelée à chaque image : déplace le boss et lance ses attaques
    if (!boss.active) return; // le boss est détruit : rien à faire
    // il flotte doucement de haut en bas et de gauche à droite ; il rejoint sa place en douceur quand une attaque l'a déplacé
    if (!boss.fige && !boss.enMouvement) { // s'il flotte (ni figé, ni déplacé par une attaque)
        const cibleX = scene.areneCentreX + Math.sin(temps / reglages(boss).periodeMouvement) * (160 + 40 * boss.phase); // position visée à l'horizontale : va-et-vient autour du centre de l'arène
        const cibleY = boss.departY + Math.sin(temps / 900) * 14; // position visée à la verticale : petit flottement
        boss.x += (cibleX - boss.x) * 0.15; // il se rapproche de la cible en douceur (en x)
        boss.y += (cibleY - boss.y) * 0.15; // il se rapproche de la cible en douceur (en y)
    }
    if (boss.halo) boss.halo.setPosition(boss.x, boss.y); // la lueur suit le boss
    if (boss.etat === "combat" && scene.time.now >= boss.prochaineAttaque) lancerAttaque(scene, boss, choisirAttaque(scene, boss)); // s'il est prêt et que le délai est écoulé, il lance une attaque choisie au hasard
    majZones(scene); // met à jour les rayons de lumière
    Object.values(ATTAQUES).forEach((def) => { if (def.maj) def.maj(scene, boss); }); // ce que certaines attaques font à chaque image
}

function attaquePossible(scene, boss, nom) { // une attaque peut exiger une situation (def.possible) : la lame qui tourne de l'horloge, par exemple, n'est esquivable que si le robot est au centre
    const def = ATTAQUES[nom]; // la fiche de cette attaque
    return !def || !def.possible || def.possible(scene, boss); // possible si l'attaque n'a pas de condition, ou si la condition est remplie
}
export { attaquePossible }; // on rend la fonction utilisable par la partie 2

function choisirAttaque(scene, boss) { // choisit l'attaque suivante
    if (boss.forcer) return boss.forcer; // TEST : boss.forcer = "balayage" (dans la console) lance toujours cette attaque
    if (profil.choisirAttaque) { const choix = profil.choisirAttaque(scene, boss); if (choix) return choix; } // un boss peut tirer ses attaques à sa façon (partie 2)
    // jamais deux fois la même de suite ; pas de lanternes s'il y en a déjà deux en l'air
    const dejaLa = scene.lanternesVivantes ? scene.lanternesVivantes.countActive() : 0; // nombre de lanternes vivantes déjà en l'air
    const possibles = profil.attaques[boss.phase].filter((nom) => nom !== boss.derniereAttaque && !(nom === "lanternes" && dejaLa >= 2) && attaquePossible(scene, boss, nom)); // les attaques de cette phase, sauf la dernière lancée, sauf lanternes s'il y en a déjà 2, et seulement celles possibles
    return Phaser.Utils.Array.GetRandom(possibles); // on en tire une au hasard
}

// ---------------------------------------------------------------------------------------------
// Les attaques
// ---------------------------------------------------------------------------------------------

function lancerAttaque(scene, boss, nom) { // lance une attaque : annonce, puis exécution, puis pause
    const id = ++boss.jeton; // si le boss change de phase ou meurt, jeton change et les suites de cette attaque sont annulées
    const valide = () => boss.etat === "attaque" && boss.jeton === id; // une attaque reste valable tant que le boss est en attaque et que son numéro n'a pas changé
    boss.etat = "attaque"; // le boss passe en état « attaque »
    boss.derniereAttaque = nom; // on retient laquelle, pour ne pas la répéter
    boss.play(animation(nom, "charge")); // animation de préparation
    const def = ATTAQUES[nom]; // la fiche de l'attaque (durée d'annonce, fonction à lancer...)
    // (durées arrondies à des croches : tout reste en rythme avec la musique)
    const apres = quantifier(def.apres + (profil.dureeEnPlus ? profil.dureeEnPlus(nom, boss) : 0)); // durée de l'effet, arrondie sur le rythme de la musique
    // une annonce plus courte pour un boss plus dur (réglage « charge »). Pas moins de 0,6 s environ : le trait de la colonne suit le robot 0,5 s puis
    // se fige (voir zone) ; si l'annonce durait moins, la colonne tomberait avant de se figer, pile sur le robot, impossible à éviter
    const charge = quantifier(def.charge * reglages(boss).charge); // durée de la préparation, réduite pour un boss plus dur
    const annonce = def.annoncer ? def.annoncer(scene, boss) : {}; // ce qui prévient le joueur pendant la préparation
    scene.time.delayedCall(charge, () => { // après la préparation, on exécute l'attaque
        if (!valide()) { nettoyerAnnonce(nom, annonce); return; } // il est mort ou a changé de phase entre-temps
        const animAttaque = animation(nom, "attaque"); // le nom de l'animation de lancer
        boss.play(animAttaque); // on la joue
        boss.faits.add(nom); // cette attaque est faite (le boss final ne peut pas mourir avant d'avoir tout lancé : voir pvMinimum)
        def.executer(scene, boss, annonce, valide); // on lance l'attaque elle-même
        // il retrouve son calme visuellement quand l'animation se termine (même si l'attaque est déjà finie : sinon il resterait figé sur la dernière pose, la lance levée) ;
        // l'événement n'arrive pas si une autre animation a pris la place (changement de phase, mort, attaque suivante)
        boss.once("animationcomplete-" + animAttaque, () => { if (boss.etat === "attaque" || boss.etat === "combat") boss.play("boss_idle"); }); // à la fin de l'animation, il reprend la pose de repos
        scene.time.delayedCall(apres, () => { // l'effet est fini : la pause avant la prochaine attaque commence
            if (!valide()) return; // si l'attaque a été interrompue, on s'arrête
            boss.etat = "combat"; // le boss redevient disponible
            // la prochaine attaque part sur une croche
            boss.prochaineAttaque = scene.time.now + surLeTemps(scene, quantifier(profil.pauses[boss.phase])); // la prochaine attaque arrivera après la pause de la phase
        });
    });
}

function nettoyerAnnonce(nom, annonce) { // l'attaque est annulée : on enlève ses traits d'avertissement
    (annonce.zones || []).forEach((z) => detruireZone(z)); // on détruit les rayons d'avertissement
    (annonce.reperes || []).forEach((r) => r.destroy()); // on détruit les repères
    if (ATTAQUES[nom].nettoyerAnnonce) ATTAQUES[nom].nettoyerAnnonce(annonce); // (les attaques de la partie 2 ont leurs propres traits)
}

// une attaque : charge (ms de préparation avant le départ) ; apres (ms que dure encore l'effet avant que la pause commence) ;
// annoncer(scene, boss) → ce qui prévient le joueur (facultatif) ; executer(scene, boss, annonce, valide) → l'attaque elle-même ;
// et, facultatifs, pour les attaques qui ont besoin de plus : nettoyerAnnonce(annonce), demarrer(scene, boss), maj(scene, boss), nettoyer(scene, boss).
// La partie 2 y ajoute les attaques du boss final.
export const ATTAQUES = { // la table de toutes les attaques du boss
    orbes: { // orbes : un éventail d'orbes vers le robot
        charge: 520, apres: 0, // durée de préparation (charge) et durée de l'effet (apres), en ms
        executer(scene, boss, annonce, valide) { // ce que fait l'attaque quand elle part
            tirerOrbes(scene, boss); // on tire la première salve
            // des salves supplémentaires juste derrière la première (réglage « salves » : 1 pour ce boss)
            for (let k = 1; k < reglages(boss).salves; k++) scene.time.delayedCall(350 * k, () => { if (valide()) tirerOrbes(scene, boss); }); // s'il y a plusieurs salves, les suivantes partent toutes les 350 ms
        }
    },
    colonne: { // colonne : un rayon tombe du ciel sur le robot
        charge: 900, apres: 500, // durées de préparation et d'effet
        annoncer(scene, boss) { // le 1er trait suit le robot ; les autres sont fixes, de part et d'autre
            const sol = scene.areneSolY; // la hauteur du sol de l'arène
            const joueur = scene.player; // le robot
            const zones = [zone(scene, { x: joueur.x, y: (boss.y + 40 + sol) / 2, w: 64, h: sol - boss.y - 40, trait: { w: 8, h: sol - boss.y - 40 }, suit: true })]; // une zone d'avertissement qui suit le robot
            reglages(boss).colonnes.forEach((d) => { const x = Phaser.Math.Clamp(joueur.x + d, 80, 1200); zones.push(zone(scene, { x, y: (boss.y + 40 + sol) / 2, w: 64, h: sol - boss.y - 40, trait: { w: 8, h: sol - boss.y - 40 } })); }); // et d'autres colonnes fixes décalées (en phase 2)
            return { zones }; // on renvoie les zones préparées
        },
        executer(scene, boss, annonce, valide) { // à l'exécution, chaque colonne devient un vrai rayon
            annonce.zones.forEach((z) => declencher(scene, z)); // on déclenche chaque zone
            if (profil.apresColonnes) profil.apresColonnes(scene, boss, valide); // (le boss final enchaîne un balayage : partie 2)
        }
    },
    pluie: { // pluie : des orbes tombent du plafond
        charge: 720, apres: 1100, // durées de préparation et d'effet
        annoncer(scene, boss) { // de petits traits en haut de l'écran : là où les orbes vont tomber
            const haut = scene.cameras.main.worldView.y + 14; // le haut de l'écran visible
            const nombre = reglages(boss).pluie; // le nombre d'orbes de la pluie
            const largeurCase = 1120 / nombre; // la largeur d'une case : l'écran est coupé en cases, une orbe par case
            const xs = Array.from({ length: nombre }, (_, i) => Math.round(80 + largeurCase * i + Phaser.Math.Between(10, largeurCase - 10))); // la position de chaque orbe, au hasard dans sa case
            const reperes = xs.map((x) => { const r = scene.add.rectangle(x, haut + 20, 6, 40, 0xfff2c0, 0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(51); effets.clignoter(scene, r, { alpha: 0.15, duration: 110 }); return r; }); // un trait clignotant annonce où chaque orbe tombera
            return { xs, reperes, haut }; // on renvoie les positions et les repères
        },
        executer: faireTomberPluie // à l'exécution, les orbes tombent
    },
    lanternes: { charge: 520, apres: 0, executer: (scene, boss, annonce, valide) => invoquerLanternes(scene, boss, valide) }, // lanternes : le boss invoque des lanternes vivantes
    balayage: { // balayage : un grand rayon traverse l'arène
        charge: 900, apres: 600, // durées de préparation et d'effet
        annoncer(scene) { return { zones: [zone(scene, { x: 640, y: scene.areneSolY - 28, w: 1400, h: 56, trait: { w: 1400, h: 6 } })] }; }, // une ligne sur toute la largeur, à hauteur des pieds
        executer(scene, boss, annonce) { annonce.zones.forEach((z) => declencher(scene, z)); } // à l'exécution, on déclenche les zones
    },
    nova: { charge: 560, apres: 900, executer: (scene, boss, annonce, valide) => lancerNova(scene, boss, valide) } // nova : des anneaux d'orbes partent du boss dans toutes les directions
};

// une orbe de lumière : le même halo que l'orbe du mage (ennemis_normaux.js), doré
export function creerOrbe(scene, x, y, vx, vy) { // (exportée : poursuite.js lance les mêmes orbes)
    const orbe = scene.tirsEnnemis.create(x, y, "halo"); // on crée l'orbe dans le groupe des tirs ennemis
    orbe.setScale(0.25); // on la réduit (l'image fait 256 px)
    orbe.body.setCircle(40, 88, 88); // hitbox ronde de 40 px de rayon, centrée dans l'image
    orbe.setTint(0xfff2c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setPipeline("SinglePipeline"); // couleur dorée, qui brille, au-dessus de l'ombre
    orbe.degats = DEGATS.orbeBoss; // les dégâts de cette orbe (lus par niveau_de_base.js)
    orbe.body.setVelocity(vx, vy); // on lui donne sa vitesse
    scene.time.delayedCall(3000, () => { if (orbe.active) orbe.destroy(); }); // elle disparaît au bout de 3 s si elle n'a rien touché : elle a quitté l'écran bien avant, et moins d'orbes en même temps ménage la borne
    return orbe; // on renvoie l'orbe
}

function tirerOrbes(scene, boss) { // une salve en éventail, centrée sur le robot
    const { orbes: nombre, ouverture, vitesse } = reglages(boss); // nombre d'orbes, degrés entre la première et la dernière, vitesse
    const base = Phaser.Math.Angle.Between(boss.x, boss.y + 20, scene.player.x, scene.player.body.center.y); // l'angle du boss vers le robot
    jouerSonSurLeTemps(scene, "orbe"); // bruit de l'attaque
    effets.eclats(scene, boss.x, boss.y + 20, ECLATS_OR[0], 10, ECLATS_OR[1]); // éclats dorés au moment du tir
    for (let i = 0; i < nombre; i++) { // une orbe par angle
        const angle = base + Phaser.Math.DegToRad((i - (nombre - 1) / 2) * (ouverture / (nombre - 1))); // l'angle de cette orbe dans l'éventail
        creerOrbe(scene, boss.x, boss.y + 20, Math.cos(angle) * vitesse, Math.sin(angle) * vitesse); // on crée l'orbe dans cette direction
    }
}

function faireTomberPluie(scene, boss, annonce, valide) { // les orbes tombent aux endroits annoncés, l'une après l'autre
    jouerSonSurLeTemps(scene, "orbe"); // bruit de l'attaque
    annonce.xs.forEach((x, i) => scene.time.delayedCall(i * 70, () => { // chaque orbe tombe 70 ms après la précédente
        if (annonce.reperes[i]) annonce.reperes[i].destroy(); // son repère d'avertissement disparaît
        if (!valide()) return; // si l'attaque est annulée, rien ne tombe
        creerOrbe(scene, x, annonce.haut, 0, reglages(boss).pluieVitesse); // l'orbe tombe tout droit
    }));
}

function invoquerLanternes(scene, boss, valide) { // le boss invoque des lanternes vivantes
    const nombre = reglages(boss).lanternes; // le nombre de lanternes à invoquer
    for (let i = 0; i < nombre; i++) scene.time.delayedCall(i * 250, () => { if (valide()) invoquerLanterne(scene); }); // une lanterne toutes les 250 ms
    effets.eclats(scene, boss.x, boss.y - 30, ECLATS_OR[0], 12, ECLATS_OR[1]); // éclats dorés autour du boss
}

function lancerNova(scene, boss, valide) { // des anneaux d'orbes qui s'écartent : chaque anneau est décalé du précédent, ce qui laisse des trous
    const [nombre, anneaux, vitesseNova] = reglages(boss).nova; // nombre d'orbes par anneau, nombre d'anneaux, vitesse
    for (let a = 0; a < anneaux; a++) scene.time.delayedCall(a * 380, () => { // un anneau toutes les 380 ms
        if (!valide()) return; // si l'attaque est annulée, rien ne part
        jouerSonSurLeTemps(scene, "orbe"); // bruit de l'attaque
        effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 10, ECLATS_OR[1]); // éclats dorés
        const decalage = (a % 2) * (Math.PI / nombre) + a * 0.15; // l'anneau suivant est tourné d'un demi-intervalle
        for (let i = 0; i < nombre; i++) { // une orbe par position de l'anneau
            const angle = decalage + (i / nombre) * Math.PI * 2; // son angle : réparti sur le cercle entier
            creerOrbe(scene, boss.x, boss.y + 10, Math.cos(angle) * vitesseNova, Math.sin(angle) * vitesseNova); // on la crée vers l'extérieur
        }
    });
}

// ---------------------------------------------------------------------------------------------
// Les zones de lumière dangereuses (colonnes, balayage) : d'abord un trait d'avertissement, puis un rayon qui blesse
// ---------------------------------------------------------------------------------------------

export function zone(scene, { x, y, w, h, trait, suit = false, degats = true }) { // crée une zone de danger (trait d'avertissement puis rayon)
    const t = scene.add.rectangle(x, y, trait.w, trait.h, 0xfff2c0, trait.w > 400 && trait.h > 200 ? 0.14 : 0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(51); // le trait lumineux d'avertissement
    const grand = trait.w > 400 && trait.h > 200; // un grand rectangle de lumière doit rester plus discret qu'un trait fin
    // il clignote : le danger est proche
    effets.clignoter(scene, t, { alpha: grand ? { from: 0.05, to: 0.22 } : { from: 0.15, to: 0.6 }, duration: 110 }); // il clignote pour prévenir
    const z = { x, y, w, h, trait: t, suit, degats, etat: "annonce", verrouJusqua: scene.time.now + 500, touche: false, fin: 0, rayon: null }; // la zone : position, taille, état, et si elle a déjà touché
    scene.zonesBoss.push(z); // on l'ajoute à la liste des zones
    return z; // on la renvoie
}

export function declencher(scene, z) { // le rayon tombe
    z.trait.destroy(); // le trait d'avertissement disparaît
    z.etat = "rayon"; // la zone devient un vrai rayon
    z.fin = scene.time.now + 450; // le rayon reste 0,45 s
    z.rayon = scene.add.rectangle(z.x, z.y, z.w, z.h, 0xfff2c0, 0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(51); // le rayon lumineux
    scene.tweens.add({ targets: z.rayon, alpha: 0, scaleY: z.w > 400 && z.h < 200 ? 0.4 : 1, scaleX: z.w > 400 ? (z.h < 200 ? 1 : 0.7) : 0.5, duration: 450, ease: "Quad.In" }); // il s'estompe en 0,45 s
    jouerSonSurLeTemps(scene, "dash"); // bruit du rayon
    effets.eclats(scene, z.x > 0 && z.w < 400 ? z.x : 640, scene.areneSolY, ECLATS_BLANC[0], 16, ECLATS_BLANC[1]); // éclats blancs au sol
    scene.cameras.main.shake(200, 0.006); // l'écran tremble
}

export function detruireZone(z) { // supprime une zone et ses dessins
    if (z.trait) z.trait.destroy(); // on enlève le trait
    if (z.rayon) z.rayon.destroy(); // on enlève le rayon
    z.etat = "finie"; // la zone est terminée
}

function majZones(scene) { // à chaque image
    const joueur = scene.player; // le robot
    const b = joueur.body; // sa hitbox
    scene.zonesBoss = scene.zonesBoss.filter((z) => z.etat !== "finie"); // on retire les zones terminées de la liste
    scene.zonesBoss.forEach((z) => { // pour chaque zone
        if (z.etat === "annonce") { // encore en avertissement :
            if (z.suit && scene.time.now < z.verrouJusqua) { z.x = joueur.x; z.trait.x = z.x; } // il suit le robot pendant 0,6 s, puis se fige
            return; // on ne vérifie rien
        }
        if (scene.time.now >= z.fin) { detruireZone(z); return; } // le rayon a fini : on le supprime
        const dedans = b.center.x + b.halfWidth * 0.6 > z.x - z.w / 2 && b.center.x - b.halfWidth * 0.6 < z.x + z.w / 2 && b.bottom > z.y - z.h / 2 && b.top < z.y + z.h / 2; // vrai si le robot est dans le rayon (un peu de marge sur les côtés)
        if (!z.touche && z.degats && dedans) { // le robot est dans le rayon
            z.touche = true; // un seul coup par rayon
            scene.blesserJoueur(DEGATS.rayonBoss, "Foudroyé par " + profil.cause, true); // (un rayon blesse même un robot en boule)
        }
    });
}

// ---------------------------------------------------------------------------------------------
// Dégâts, changements de phase et fin du combat
// ---------------------------------------------------------------------------------------------

const ETATS_SANS_DEGATS = ["apparition", "transition", "choix", "fin"]; // pendant ces états, les tirs du robot ne lui font rien (boss.intouchable : la partie 2)

function toucherBoss(scene, boss, tir) { // un tir du robot touche le boss
    tir.destroy(); // le tir disparaît
    if (boss.intouchable || ETATS_SANS_DEGATS.includes(boss.etat)) return; // si le boss est intouchable (apparition, transition...), rien
    if (profil.pvMinimum && boss.pv - 1 < profil.pvMinimum(boss)) { effets.flash(boss, 0xffd45c, 60); return; } // il tient bon : le coup ne compte pas (ni PV, ni points)
    boss.pv -= 1; // le boss perd 1 PV
    effets.flash(boss, 0xffffff, 60); // il devient blanc 60 ms
    effets.eclats(scene, tir.x, tir.y, ECLATS_BLANC[0], 6, ECLATS_BLANC[1]); // éclats blancs à l'impact
    jouerSon(scene, "ennemi_touche"); // bruit du coup
    gagnerPoints(scene, BOSS.pointsParTir, boss.x, boss.y - 120); // le joueur gagne des points
    majBarre(scene, boss); // la barre de vie se met à jour
    // à 0 PV : le Dieu du niveau 1 propose le choix du panthéon ; un boss final (partie 2) a sa propre fin de combat
    if (boss.pv <= 0) { if (profil.pantheon) proposerPantheon(scene, boss); else profil.finDeCombat(scene, boss); return; } // à 0 PV : le choix du panthéon, ou la fin du combat
    const phase = boss.pv <= profil.seuils[1] ? 2 : boss.pv <= profil.seuils[0] ? 1 : 0; // la phase correspondant aux PV restants
    if (phase > boss.phase) changerDePhase(scene, boss, phase); // si elle est plus avancée que l'actuelle, on change de phase
}

export function nettoyerCombat(scene, boss) { // efface tout ce que le boss avait lancé
    boss.jeton++; // annule les suites de l'attaque en cours
    boss.enMouvement = false; // le boss ne se déplace plus de lui-même
    scene.tirsEnnemis.clear(true, true); // plus aucune orbe
    scene.zonesBoss.forEach((z) => detruireZone(z)); // on détruit tous les rayons
    scene.zonesBoss = []; // la liste est vide
    Object.values(ATTAQUES).forEach((def) => { if (def.nettoyer) def.nettoyer(scene, boss); }); // et ce que les attaques de la partie 2 avaient posé
}

export function changerDePhase(scene, boss, phase) { // fait passer le boss à la phase suivante
    nettoyerCombat(scene, boss); // on efface ce qu'il avait lancé
    boss.phase = phase; // la nouvelle phase
    boss.faits = new Set(); // on recompte les attaques lancées dans cette phase
    const pvDebut = profil.pvDebutPhase ? profil.pvDebutPhase(phase) : undefined; // les PV de début de phase, s'il y en a
    if (pvDebut !== undefined) { // il se soigne en entrant dans la phase
        boss.pv = pvDebut; // il se soigne
        boss.pvMax = pvDebut; // la barre de vie se règle sur les PV de la nouvelle phase : elle est pleine
        scene.tweens.killTweensOf(boss.barre.plein); // le rétrécissement du dernier coup (majBarre) ramènerait sinon la barre à sa valeur d'avant le soin
        boss.barre.plein.width = LARGEUR_BARRE * boss.pv / boss.pvMax; // la barre se remplit
    }
    scene.registry.set("phaseBoss", { profil: profil.cle, phase }); // si le robot meurt, il reprendra ici
    boss.etat = "transition"; // intouchable un instant
    boss.play("boss_charge"); // animation de charge pendant la transition
    scene.cameras.main.flash(300, 255, 242, 192); // flash doré
    scene.cameras.main.shake(400, 0.009); // l'écran tremble
    effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 28, ECLATS_OR[1]); // éclats dorés
    lacherPV(scene, 640, boss.y + 60); // une croix de soin tombe au milieu de l'arène
    const texte = scene.add.text(640, 120, profil.etiquettePhase ? profil.etiquettePhase(phase) : "PHASE " + (phase + 1), { fontFamily: "monospace", fontSize: "28px", color: "#f5f0f8", stroke: "#000000", strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(104); // le texte « PHASE 2 » à l'écran
    scene.tweens.add({ targets: texte, alpha: 0, y: 100, duration: 1600, delay: 400, onComplete: () => texte.destroy() }); // il monte et s'efface
    scene.time.delayedCall(BOSS.dureeTransition, () => { // à la fin de la transition...
        if (boss.etat !== "transition") return; // ...si rien n'a changé entre-temps...
        boss.play("boss_idle"); // ...le boss reprend sa pose de repos
        boss.etat = "combat"; // ...et le combat reprend
        boss.prochaineAttaque = scene.time.now + surLeTemps(scene, 750); // la prochaine attaque arrive après 0,75 s
    });
}

// Le Soldat est battu : « Si tu veux entrer dans le panthéon, affronte la mort » (scène pantheon.js, posée par-dessus le niveau).
// OUI : la suite du jeu commence (profil.suite, dans js/partie2 : le Dieu s'enrage, la fuite). NON : la partie s'arrête ici et on retourne au menu.
function proposerPantheon(scene, boss) { // le boss est battu : on propose le choix du panthéon
    nettoyerCombat(scene, boss); // on efface ce qu'il avait lancé
    boss.etat = "choix"; // intouchable, plus d'attaque
    scene.cameras.main.flash(300, 255, 242, 192); // flash doré
    scene.time.delayedCall(900, () => { // l'éclair passe, puis le choix
        if (scene.mort || scene.partieFinie) return; // le robot est mort ou la partie est finie entre-temps
        viderSons(scene); // le combat est fini : on coupe les bruitages qui traînent avant le choix et la suite
        scene.scene.launch("pantheon", { origine: scene.scene.key, accepter: () => (profil.suite ? profil.suite(scene, boss) : refuserPantheon(scene, boss)), refuser: () => refuserPantheon(scene, boss) }); // on lance l'écran du choix : OUI continue, NON termine
        scene.scene.pause(); // fige le niveau : le chrono attend la réponse
    });
}

function refuserPantheon(scene, boss) { // NON : la partie s'arrête ici, et on retourne directement au menu (sans crédits ni saisie du nom)
    boss.etat = "fin"; // le boss ne fait plus rien
    boss.body.enable = false; // plus de collision avec lui
    if (scene.lanternesVivantes) scene.lanternesVivantes.clear(true, true); // on enlève les lanternes vivantes restantes
    scene.partieFinie = true; // plus de pause ni de coups reçus pendant la sortie
    scene.registry.set("chronoActif", false); // le chrono s'arrête
    scene.tweens.add({ targets: [boss, boss.halo, ...elementsBarre(boss)], alpha: 0, duration: 1200 }); // le boss s'efface
    scene.cameras.main.fadeOut(900, 0, 0, 0); // l'écran s'assombrit
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => { // quand il est tout noir...
        scene.sound.stopAll(); // ...on coupe la musique...
        scene.scene.start("menu"); // ...et on retourne au menu
    });
}
