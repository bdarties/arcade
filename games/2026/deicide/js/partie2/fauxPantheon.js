// fauxPantheon.js : le FAUX écran de victoire du dernier combat. C'est l'écran du panthéon (partie1/scenes/classement.js) tel quel, avec son animation de victoire, sauf
// qu'au lieu de proposer d'enregistrer le score, il se FISSURE : l'écran se brise en morceaux qui tombent, et derrière, le boss revient en arrière-plan sous sa forme finale.
// Il est posé par-dessus le niveau 3, qui est en pause : quand l'écran est brisé, le niveau reprend (voir finDeCombat.js : retour).
import classement from "../partie1/scenes/classement.js";
import { rattraperHorloge } from "../partie1/scenes/pause.js";
import { jouerSon } from "../partie1/systemes/sons.js";

const LARGEUR = 1280, HAUTEUR = 720;
const POINT_IMPACT = { x: 760, y: 290 }; // d'où part la fissure : le milieu du tableau des scores
const TEINTE_FINALE = 0x9a7cff; // le violet de la forme finale (voir formeFinale.js)
const ECHELLE_DEBUT = 3.8, ECHELLE_FINALE = 4.8; // la taille du boss avant et après

export default class fauxPantheon extends classement {
    constructor() { super("fauxPantheon"); }

    init(donnees) {
        super.init(donnees);
        this.origine = donnees.origine; // la clé du niveau figé derrière (niveau3)
        this.retour = donnees.retour; // appelée quand l'écran est brisé
    }

    create() {
        this.debutFaux = this.game.loop.time; // l'instant où le niveau s'est figé
        super.create(); // l'écran du panthéon et sa séquence de victoire, comme pour une vraie victoire
    }

    // La séquence de victoire est finie : au lieu de la saisie du nom, après un moment pour croire que c'est fini, la fissure.
    decider() {
        if (!this.sequenceFinie || !this.apiPrete || this.etape !== "intro") return;
        this.etape = "faux"; // plus aucune touche ne fait rien
        this.time.delayedCall(2200, () => this.fissurer());
    }

    // Des fissures qui partent du point d'impact et grandissent en secouant l'écran.
    fissurer() {
        jouerSon(this, "joueur_mort");
        this.cameras.main.shake(1500, 0.004);
        const graphique = this.add.graphics().setDepth(100);
        const branches = Array.from({ length: 9 }, () => { // chaque branche : une ligne brisée qui s'éloigne du point d'impact
            let angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const points = [{ x: POINT_IMPACT.x, y: POINT_IMPACT.y }];
            for (let longueur = 0; longueur < 1500; longueur += Phaser.Math.Between(40, 90)) {
                angle += Phaser.Math.FloatBetween(-0.45, 0.45);
                const dernier = points[points.length - 1];
                const pas = Phaser.Math.Between(40, 90);
                points.push({ x: dernier.x + Math.cos(angle) * pas, y: dernier.y + Math.sin(angle) * pas });
            }
            return points;
        });
        const etat = { avancee: 0 };
        this.tweens.add({ targets: etat, avancee: 1, duration: 1500, ease: "Quad.In",
            onUpdate: () => {
                graphique.clear();
                branches.forEach((points) => {
                    const jusqua = Math.floor(points.length * etat.avancee);
                    if (jusqua < 2) return;
                    graphique.lineStyle(12, 0xffd45c, 0.22).beginPath().moveTo(points[0].x, points[0].y); // un halo doré autour de la fissure
                    for (let i = 1; i < jusqua; i++) graphique.lineTo(points[i].x, points[i].y);
                    graphique.strokePath();
                    graphique.lineStyle(4, 0xffffff, 0.95).beginPath().moveTo(points[0].x, points[0].y); // la fissure elle-même
                    for (let i = 1; i < jusqua; i++) graphique.lineTo(points[i].x, points[i].y);
                    graphique.strokePath();
                });
            },
            onComplete: () => { this.cameras.main.flash(250, 255, 255, 255); this.time.delayedCall(120, () => this.briser()); }
        });
    }

    // L'écran éclate : une photo de l'écran est découpée en morceaux irréguliers qui tombent, le niveau est visible derrière.
    briser() {
        this.game.renderer.snapshot((image) => {
            if (!image || !image.width) { this.revelerBoss(); return; } // pas de photo possible : on passe directement à la suite
            const cle = "faux_capture";
            if (this.textures.exists(cle)) this.textures.remove(cle);
            const texture = this.textures.addImage(cle, image);
            const echelle = image.width / LARGEUR; // la photo peut être plus grande que l'écran du jeu
            const coupesX = [0, ...Array.from({ length: 7 }, () => Phaser.Math.Between(60, LARGEUR - 60)).sort((a, b) => a - b), LARGEUR];
            const morceaux = [];
            const coupeY = 300 + Phaser.Math.Between(-60, 60); // une coupe horizontale : deux rangées de morceaux
            [[0, coupeY], [coupeY, HAUTEUR]].forEach(([yMin, yMax], rangee) => {
                for (let i = 0; i < coupesX.length - 1; i++) {
                    const x0 = coupesX[i], x1 = coupesX[i + 1];
                    if (x1 - x0 < 8) continue;
                    const nom = rangee + "_" + i;
                    texture.add(nom, 0, x0 * echelle, yMin * echelle, (x1 - x0) * echelle, (yMax - yMin) * echelle);
                    const morceau = this.add.image(x0 + (x1 - x0) / 2, yMin + (yMax - yMin) / 2, cle, nom).setDepth(110).setScale(1 / echelle);
                    morceaux.push(morceau);
                }
            });
            // tout le reste de l'écran est caché (les morceaux le montrent à l'identique), le niveau 3 devient visible derrière
            this.children.list.forEach((objet) => { if (!morceaux.includes(objet)) objet.setVisible(false); });
            this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
            jouerSon(this, "lanterne");
            jouerSon(this, "ennemi_mort");
            morceaux.forEach((morceau) => this.tweens.add({
                targets: morceau, y: morceau.y + Phaser.Math.Between(800, 1100), x: morceau.x + Phaser.Math.Between(-90, 90), angle: Phaser.Math.Between(-35, 35),
                duration: Phaser.Math.Between(900, 1400), delay: Phaser.Math.Between(0, 450), ease: "Quad.In", onComplete: () => morceau.destroy()
            }));
            this.revelerBoss();
        });
    }

    // Derrière l'écran brisé, le boss revient : il apparaît dans le fond, grossit et passe au violet (sa forme finale). Puis le niveau reprend.
    revelerBoss() {
        const niveau = this.scene.get(this.origine);
        const camera = niveau.cameras.main;
        const boss = niveau.boss;
        const x = boss.x - camera.scrollX, y = boss.y - camera.scrollY; // sa place à l'écran (la caméra du niveau 3 est fixe)
        const spectre = this.add.sprite(x, y, "boss_idle", 0).setScale(ECHELLE_DEBUT * 0.7).setAlpha(0).setDepth(90).setTint(0xff6a5a);
        spectre.play("boss_idle");
        this.tweens.add({ targets: spectre, alpha: 0.9, duration: 700, delay: 500 });
        this.tweens.add({ targets: spectre, scale: ECHELLE_FINALE, duration: 1900, delay: 500, ease: "Cubic.Out" });
        this.time.delayedCall(1300, () => { // à mi-chemin : il change de forme
            spectre.setTint(TEINTE_FINALE);
            this.cameras.main.flash(300, 190, 160, 255);
            this.cameras.main.shake(500, 0.01);
            jouerSon(this, "joueur_mort");
        });
        this.time.delayedCall(2800, () => this.terminer());
    }

    terminer() { // le niveau 3 reprend, comme à la fermeture du menu pause (voir pause.js)
        const niveau = this.scene.get(this.origine);
        rattraperHorloge(niveau, this.game.loop.time - this.debutFaux); // le niveau ne doit pas « sentir » le temps passé ici
        niveau.input.keyboard.resetKeys();
        this.scene.resume(this.origine);
        const retour = this.retour;
        this.scene.stop(); // ferme le faux écran
        retour();
    }
}
