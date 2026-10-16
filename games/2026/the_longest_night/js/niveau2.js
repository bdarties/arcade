import {
  ajouter_son,
  gerer_cameras,
  fusionner_cameras,
  deplacement_areignee,
  apparition_elements,
  degat_contact_ennemi,
  recharger,
  tirer,
  Elimination_ennemi,
  recuperer_cle,
  soigner,
  aller_niveau_suivant,
  preparer_faucheuse,
  apparition_faucheuse,
  deplacement_faucheuse,
  terminer_match,
  points_spawn_libres,
  detruire
} from "./fonctions.js";
import niveau1 from "./niveau1.js";

const niveauState = {
  get player() { return player; }, set player(value) { player = value; },
  get player2() { return player2; }, set player2(value) { player2 = value; },
  get mode_deux_joueurs() { return mode_deux_joueurs; }, set mode_deux_joueurs(value) { mode_deux_joueurs = value; },
  get camerasFusionnees() { return camerasFusionnees; }, set camerasFusionnees(value) { camerasFusionnees = value; },
  get camGlobalUI() { return camGlobalUI; }, set camGlobalUI(value) { camGlobalUI = value; },
  get camJ1() { return camJ1; }, set camJ1(value) { camJ1 = value; },
  get camJ1UI() { return camJ1UI; }, set camJ1UI(value) { camJ1UI = value; },
  get camJ2() { return camJ2; }, set camJ2(value) { camJ2 = value; },
  get camJ2UI() { return camJ2UI; }, set camJ2UI(value) { camJ2UI = value; },
  get cibleCamera() { return cibleCamera; }, set cibleCamera(value) { cibleCamera = value; },
  get cle() { return cle; }, set cle(value) { cle = value; },
  get cles_creees() { return cles_creees; }, set cles_creees(value) { cles_creees = value; },
  get cles_restantes() { return cles_restantes; }, set cles_restantes(value) { cles_restantes = value; },
  get cles_restantes_affiche() { return cles_restantes_affiche; }, set cles_restantes_affiche(value) { cles_restantes_affiche = value; },
  get fin_de_partie() { return fin_de_partie; }, set fin_de_partie(value) { fin_de_partie = value; },
  get faucheuse() { return faucheuse; }, set faucheuse(value) { faucheuse = value; },
  get groupe_ennemis() { return groupe_ennemis; }, set groupe_ennemis(value) { groupe_ennemis = value; },
  get groupeBullets() { return groupeBullets; }, set groupeBullets(value) { groupeBullets = value; },
  get groupe_cle() { return groupe_cle; }, set groupe_cle(value) { groupe_cle = value; },
  get groupe_recharges() { return groupe_recharges; }, set groupe_recharges(value) { groupe_recharges = value; },
  get groupe_soin() { return groupe_soin; }, set groupe_soin(value) { groupe_soin = value; },
  get murs() { return murs; }, set murs(value) { murs = value; },
  get nombre_cles() { return nombre_cles; }, set nombre_cles(value) { nombre_cles = value; },
  get nombre_ennemis_apparaissant() { return nombre_ennemis_apparaissant; }, set nombre_ennemis_apparaissant(value) { nombre_ennemis_apparaissant = value; },
  get nombre_recharges_apparaissant() { return nombre_recharges_apparaissant; }, set nombre_recharges_apparaissant(value) { nombre_recharges_apparaissant = value; },
  get nombre_soins_apparaissant() { return nombre_soins_apparaissant; }, set nombre_soins_apparaissant(value) { nombre_soins_apparaissant = value; },
  get porte() { return porte; }, set porte(value) { porte = value; },
  get score_J1_affiche() { return score_J1_affiche; }, set score_J1_affiche(value) { score_J1_affiche = value; },
  get score_J2_affiche() { return score_J2_affiche; }, set score_J2_affiche(value) { score_J2_affiche = value; },
  get son_areignne_blesse() { return son_areignne_blesse; }, set son_areignne_blesse(value) { son_areignne_blesse = value; },
  get son_cle() { return son_cle; }, set son_cle(value) { son_cle = value; },
  get son_feu() { return son_feu; }, set son_feu(value) { son_feu = value; },
  get son_joueur_blesse() { return son_joueur_blesse; }, set son_joueur_blesse(value) { son_joueur_blesse = value; },
  get son_soin() { return son_soin; }, set son_soin(value) { son_soin = value; },
  get sortie_ouverte() { return sortie_ouverte; }, set sortie_ouverte(value) { sortie_ouverte = value; },
  get spawns_complets() { return spawns_complets; }, set spawns_complets(value) { spawns_complets = value; },
  get tableau_ennemis() { return tableau_ennemis; }, set tableau_ennemis(value) { tableau_ennemis = value; },
  get tableau_spawn() { return tableau_spawn; }, set tableau_spawn(value) { tableau_spawn = value; },
  get temps_restant() { return temps_restant; }, set temps_restant(value) { temps_restant = value; },
  get balle_restanteJ1_affiche() { return balle_restanteJ1_affiche; }, set balle_restanteJ1_affiche(value) { balle_restanteJ1_affiche = value; },
  get balle_restanteJ2_affiche() { return balle_restanteJ2_affiche; }, set balle_restanteJ2_affiche(value) { balle_restanteJ2_affiche = value; }
};

// niveau2 réutilise tout le code de niveau1 (joueurs, caméras, HUD, clés, tirs...)
// et ne redéfinit que ce qui change : la carte, les ennemis et les points d'apparition.
export default class niveau2 extends niveau1 {
  constructor() {
    super("niveau2");
  }

  parametres_niveau() {
    const cfg = super.parametres_niveau(); // on part des réglages du niveau 1...
    return {
      ...cfg, // ...et on remplace seulement ce qui est différent
      temps: 180,
      nombre_cles: 3,
      nombre_ennemis:  5,
      nombre_recharges: 2,
      nombre_soins: 2,
      carte_cle: "carte2",
      carte_fichier: "./assets/map/niveau_2.json",
      tileset_nom: "tileset_reverse",       // nom du tileset DANS Tiled (à vérifier dans niveau_2.json, champ "name" de "tilesets")
      tileset_image: "Phaser_tuileReverse", // clé de l'image chargée dans preload() ci-dessous

      // les spawns sont lus dans le calque d'objets "calque_spawn" de la carte Tiled (voir la console pour vérifier)
      spawn_depuis_tiled: true,
      player_spawn: cfg.player_spawn,
      player2_spawn: cfg.player2_spawn,
      tableau_spawn: cfg.tableau_spawn,
      porte_spawn: cfg.porte_spawn, //remplacé par le point "porte" du calque_spawn s'il existe

      ennemis: [{
        nom: "renard",
        texture: "renard",
        animation: "animation_renard_marche",
        animation_attaque: "animation_renard_attaque",
        son_blesse: "son_renard_blesse",
        son_mort: "renard_mort",
        comportement: "rodeur",   // se balade, n'attaque que si un joueur est dans son rayon
        rayon_detection: 70,      // en pixels : distance à partir de laquelle il attaque (et portée de son coup)
        vitesse: 45,              // vitesse de balade
        delai_impact: 500,        // ms entre le début de l'attaque et le moment où le coup touche
        duree_attaque: 850,       // ms : durée totale de l'attaque (10 images à 12 img/s = ~830 ms)
        degats_au_contact: false, // le simple contact ne blesse pas, seule l'attaque blesse
        points_vies: 3,
        degats: 1,
        score: 150
      }],

      // la faucheuse du niveau 2 : mêmes réglages que le niveau 1 (vitesse, portée...), seules les images changent
      faucheuse: {
        ...cfg.faucheuse,
        marche:  { fichier: "./assets/enemies/faucheuse_map2.png",         largeur: 96, hauteur: 80, images: 4,  pieds: { x: 16, y: 73 } }, // PNG de 353 px : la dernière case est rognée, c'est géré
        attaque: { fichier: "./assets/enemies/faucheuse_attaque_map2.png", largeur: 96, hauteur: 96, images: 13, pieds: { x: 31, y: 89 } }
      },
      niveau_suivant: "Ecran_score"
    };
  }

  preload() {
    super.preload(); // charge tout ce que charge le niveau 1 (la carte 2 grâce à parametres_niveau)
    this.load.image("Phaser_tuileReverse", "./assets/map/tileset_reverse.png");
    this.load.spritesheet("renard", "./assets/enemies/renard.png", {
      frameWidth: 48,
      frameHeight: 70
    });
    this.load.spritesheet("renard_attaque", "./assets/enemies/renard_attaque.png", {
      frameWidth: 100,
      frameHeight: 70
    });
  }

  create() {
    if (!this.anims.exists("animation_renard_marche")) {
      this.anims.create({
        key: "animation_renard_marche",
        frames: this.anims.generateFrameNumbers("renard", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }
    if (!this.anims.exists("animation_renard_attaque")) {
      this.anims.create({
        key: "animation_renard_attaque",
        frames: this.anims.generateFrameNumbers("renard_attaque", { start: 0, end: 9 }),
        frameRate: 12,
        repeat: 0
      });
    }
    super.create();
  }
}