// parametres.js : TOUS les chiffres qui règlent le jeu, au même endroit. Pour changer la difficulté ou la sensation de jeu, on modifie ici et rien d'autre.
// Les autres fichiers ne contiennent plus ces chiffres : ils lisent ce fichier (import { ROBOT } from "../parametres.js").
// Unités : px = pixels, px/s = pixels par seconde, ms = millisecondes (1000 ms = 1 s).

// ---------- LE MONDE ----------
export const MONDE = {
    gravite: 300, // la gravité de base (px/s²) : plus c'est grand, plus tout tombe vite. Le robot y ajoute la sienne (voir ROBOT.graviteMontee / graviteChute)
    imagesParSeconde: 30 // la cadence du jeu. Si la borne est trop lente, mettre 40
};

// ---------- LE ROBOT ----------
export const ROBOT = {
    pvDepart: 5, // points de vie au début d'un niveau (la barre de vie a 5 cellules)
    vitesse: 260, // vitesse de marche (px/s)
    saut: 600, // vitesse de décollage (px/s) : plus c'est grand, plus il saute haut
    graviteMontee: 700, // gravité ajoutée quand il monte (total = MONDE.gravite + ça) : grand = il monte vite et s'arrête net
    graviteChute: 1100, // gravité ajoutée quand il tombe : grand = il retombe vite
    vitesseGlisse: 90, // vitesse de chute maximale quand il glisse contre un mur (px/s)
    vitesseSautMur: 220, // vitesse horizontale donnée par un saut de mur (px/s)
    delaiCoyote: 150, // ms pendant lesquelles on peut encore sauter après avoir quitté le bord d'une plateforme
    invincibleApresCoup: 1000, // ms d'invincibilité après un coup reçu
    invincibleAuDebut: 2500 // ms d'invincibilité quand le niveau (re)commence
};

export const DASH = {
    delai: 600, // ms minimum entre deux dashs
    vitesse: 500 // vitesse du dash (px/s)
};

export const TIR = {
    delai: 300, // ms minimum entre deux tirs
    vitesseBalle: 700, // px/s
    dureeBalle: 1500, // ms avant que la balle disparaisse si elle ne touche rien
    porteeVisee: 700 // distance (px) à laquelle la visée automatique cherche un ennemi
};

// ---------- LES DÉGÂTS REÇUS PAR LE ROBOT (en points de vie ; le robot en a ROBOT.pvDepart) ----------
export const DEGATS = {
    fleche: 1, // une flèche de l'archer
    orbeMage: 1, // une orbe du mage
    coupOrc: 1, // un coup de faux de l'orc
    lanterneVivante: 1, // le choc d'une lanterne vivante
    orbeBoss: 1, // une orbe de lumière du boss
    rayonBoss: 1, // un rayon du boss (colonne, balayage...)
    lumiere: 1 // la brûlure de la lumière
};

// ---------- LES ENNEMIS ----------
export const ENNEMIS = {
    archer: { pv: 2, points: 100, delaiTir: 1800, vitesseFleche: 450 }, // delaiTir : ms entre deux flèches
    mage: { pv: 3, points: 200, delaiTir: 2500, vitesseOrbe: 220 }, // vitesseOrbe en px/s
    orc: { pv: 4, points: 400, vitesse: 90, porteeCoup: 90 }, // porteeCoup : distance (px) à partir de laquelle il frappe
    chanceDePV: 0.3 // chance (0 à 1) qu'un ennemi tué laisse un PV à ramasser
};

// Les lanternes vivantes : elles foncent sur le robot. Les abattre donne un boost (plus de vitesse, rafale).
export const LANTERNES_VIVANTES = {
    delaiApparition: 15000, // ms entre deux lanternes
    maximum: 3, // pas plus de 3 en même temps
    dureeDeVie: 40000, // ms avant qu'une lanterne non abattue s'éteigne
    dureeBoost: 8000, // ms de boost après la dernière lanterne abattue
    bonusVitesseParNiveau: 0.1 // +10 % de vitesse de marche par niveau de boost (3 niveaux au maximum)
};

// La lumière brûle le robot s'il reste dedans.
export const LUMIERE = {
    delaiPremiereBrulure: 3000, // ms avant le premier dégât quand il entre dans la lumière
    delaiBrulureSuivante: 2000 // ms entre les dégâts suivants s'il y reste
};

// ---------- LE BOSS (le Dieu de la Lumière) ----------
export const BOSS = {
    pv: 80,
    seuilsDePhase: [50, -1], // la phase 2 commence quand il lui reste 50 PV (le -1 ferme la liste)
    points: 1000, // bonus gagné à sa mort
    pointsParTir: 10, // points gagnés à chaque tir qui le touche
    pausesEntreAttaques: [2000, 1500], // ms entre deux attaques, pour la phase 1 puis la phase 2 (plus petit = plus dur)
    dureeTransition: 2000 // ms d'invulnérabilité à chaque changement de phase
};

// Les réglages des attaques du boss, une ligne par phase (phase 1 puis phase 2).
//   charge : multiplicateur du temps d'annonce         orbes / ouverture / vitesse : une salve d'orbes (nombre, angle total en degrés, px/s)
//   salves : salves d'orbes de suite                   pluie / pluieVitesse : nombre d'orbes de la pluie et leur vitesse
//   colonnes : décalages (px) des colonnes de lumière fixes   nova : [orbes par anneau, anneaux, vitesse]
//   lanternes : lanternes invoquées                    periodeMouvement : durée (ms) d'un va-et-vient du boss
export const ATTAQUES_BOSS = [
    { charge: 1, orbes: 3, ouverture: 36, vitesse: 290, salves: 1, pluie: 6, pluieVitesse: 390, colonnes: [], nova: [12, 2, 230], lanternes: 2, periodeMouvement: 1450 },
    { charge: 1, orbes: 5, ouverture: 60, vitesse: 325, salves: 1, pluie: 8, pluieVitesse: 390, colonnes: [260], nova: [14, 2, 230], lanternes: 2, periodeMouvement: 1450 }
];

// ---------- LE MENU D'ACCUEIL ----------
// Le glitch du titre : de temps en temps, 2 ou 3 bandes de l'image du titre sont décalées sur le côté pendant un instant (voir menu.js).
export const GLITCH_TITRE = {
    premierApresMs: 1500, // délai avant le premier glitch
    pauseMinMs: 2200, // temps minimum entre deux glitchs
    pauseMaxMs: 5200, // temps maximum entre deux glitchs
    dureeMs: 110, // durée d'un glitch
    bandesMin: 2, // nombre minimum de bandes décalées
    bandesMax: 3, // nombre maximum de bandes décalées
    hauteurMin: 6, // épaisseur minimum d'une bande (px)
    hauteurMax: 24, // épaisseur maximum d'une bande (px)
    decalageMin: 6, // décalage minimum d'une bande vers la gauche ou la droite (px)
    decalageMax: 16 // décalage maximum (px)
};

// ---------- LE SCORE ----------
export const SCORE = {
    msRetireesParPoint: 10 // le classement est au TEMPS NET : chaque point retire 10 ms (100 points = 1 seconde)
};
