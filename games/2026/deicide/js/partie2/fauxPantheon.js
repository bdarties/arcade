// fauxPantheon.js : le FAUX écran de victoire du dernier combat. C'est l'écran du panthéon (partie1/scenes/classement.js) tel quel, avec son animation de victoire :
// on y croit vraiment (fanfare, confettis, le temps final qui se décompte). Puis le silence, un battement de cœur... et un ÉNORME COUP D'ÉPÉE tranche l'écran en deux.
// Les deux moitiés de l'écran s'écartent dans la lumière, et derrière, le boss revient en arrière-plan sous sa forme finale.
// Il est posé par-dessus le niveau 3, qui est en pause : quand l'écran est tranché, le niveau reprend (voir finDeCombat.js : retour).
// Les sons sont synthétisés (synth.js) ; l'entaille est une courbe de Bézier dessinée en lame effilée, avec un halo, une onde de choc et des étincelles.
import classement, { ecrire, plaque, OR } from "../partie1/scenes/classement.js"; // (ecrire : la police pixel du jeu ; plaque : la plaque d'armure du HUD)
import { rattraperHorloge } from "../partie1/scenes/pause.js";
import { jouerSon, volumeEffets } from "../partie1/systemes/sons.js";
import { fanfare, battements, montee, coupDEpee, impact, verre, cri, annonce } from "./synth.js";

const LARGEUR = 1280, HAUTEUR = 720;
const TEINTE_FINALE = 0x9a7cff; // le violet de la forme finale (voir formeFinale.js)
const ECHELLE_DEBUT = 3.8, ECHELLE_FINALE = 4.8; // la taille du boss avant et après
const COULEURS = [0xffd45c, 0xffffff, 0xf4b6c2, 0xfff2c0]; // les confettis : or, blanc, rose pâle

// La courbe de l'entaille : une courbe de Bézier qui monte du bas gauche vers le haut droit, hors de l'écran des deux côtés.
const COURBE = { p0: { x: -180, y: 700 }, p1: { x: 540, y: 230 }, p2: { x: 1460, y: 150 } };
const POINTS = 90;
function pointDeLaCourbe(t) {
    const u = 1 - t;
    return { x: u * u * COURBE.p0.x + 2 * u * t * COURBE.p1.x + t * t * COURBE.p2.x, y: u * u * COURBE.p0.y + 2 * u * t * COURBE.p1.y + t * t * COURBE.p2.y };
}
const LIGNE = Array.from({ length: POINTS + 1 }, (_, i) => pointDeLaCourbe(i / POINTS));

// Dessine la lame : une bande effilée le long de la courbe, du début jusqu'au point `jusqua`. Fine à l'arrière, large à la pointe, effilée aux deux bouts.
function dessinerLame(graphique, jusqua, largeurMax, couleur, alpha) {
    if (jusqua < 2) return;
    const gauche = [], droite = [];
    for (let i = 0; i <= jusqua; i++) {
        const avant = LIGNE[Math.max(0, i - 1)], apres = LIGNE[Math.min(POINTS, i + 1)];
        const dx = apres.x - avant.x, dy = apres.y - avant.y, longueur = Math.hypot(dx, dy) || 1;
        const nx = -dy / longueur, ny = dx / longueur; // la perpendiculaire à la courbe
        const enveloppe = Math.pow(Math.sin(Math.PI * i / POINTS), 0.6); // effilée aux deux extrémités de la courbe
        const traine = Math.pow(i / jusqua, 0.9); // et plus fine derrière la pointe que devant
        const demi = largeurMax * enveloppe * traine / 2;
        gauche.push({ x: LIGNE[i].x + nx * demi, y: LIGNE[i].y + ny * demi });
        droite.push({ x: LIGNE[i].x - nx * demi, y: LIGNE[i].y - ny * demi });
    }
    graphique.fillStyle(couleur, alpha).beginPath().moveTo(gauche[0].x, gauche[0].y);
    gauche.forEach((p) => graphique.lineTo(p.x, p.y));
    for (let i = droite.length - 1; i >= 0; i--) graphique.lineTo(droite[i].x, droite[i].y);
    graphique.closePath().fillPath();
}

export default class fauxPantheon extends classement {
    constructor() { super("fauxPantheon"); }

    init(donnees) {
        super.init(donnees);
        this.origine = donnees.origine; // la clé du niveau figé derrière (niveau3)
        this.retour = donnees.retour; // appelée quand l'écran est tranché
    }

    create() {
        this.debutFaux = this.game.loop.time; // l'instant où le niveau s'est figé
        super.create(); // l'écran du panthéon et sa séquence de victoire, comme pour une vraie victoire
    }

    // La séquence de victoire est finie : on fête la victoire un long moment pour que le joueur y croie, puis la tension monte.
    decider() {
        if (!this.sequenceFinie || !this.apiPrete || this.etape !== "intro") return;
        this.etape = "faux"; // plus aucune touche ne fait rien
        this.victoire();
        this.time.delayedCall(4600, () => this.tension());
    }

    // ---- 1. LA VICTOIRE : une fanfare, une pluie de confettis dorés, un éclat de lumière ----
    victoire() {
        fanfare(this);
        this.cameras.main.flash(350, 255, 235, 170);
        const confettis = this.add.particles(0, -10, "pixel", {
            x: { min: 0, max: LARGEUR }, speedY: { min: 120, max: 300 }, speedX: { min: -90, max: 90 }, rotate: { min: 0, max: 360 },
            scale: { min: 1.6, max: 3.2 }, lifespan: 4200, frequency: 22, quantity: 2, gravityY: 50, tint: COULEURS, emitting: true
        }).setDepth(50);
        confettis.emitParticleAt(640, 300, 60); // une première gerbe, tout de suite
        this.time.delayedCall(3200, () => confettis.stop()); // ils s'arrêtent avant la tension
    }

    // ---- 2. LA TENSION : le silence, des battements de cœur, l'écran qui s'assombrit et se rapproche, un son qui monte ----
    tension() {
        this.sound.stopAll(); // la musique du niveau s'arrête net
        battements(this);
        this.time.delayedCall(950, () => battements(this));
        montee(this, 1600);
        this.time.delayedCall(520, () => { cri(this, 1.05); this.cameras.main.shake(1060, 0.007); }); // le CRI du monstre, qui finit juste avant le coup ; l'écran tremble sous sa voix
        const voile = this.add.rectangle(LARGEUR / 2, HAUTEUR / 2, LARGEUR, HAUTEUR, 0x000000, 0).setDepth(80);
        this.tweens.add({ targets: voile, fillAlpha: 0.5, duration: 1500, ease: "Quad.In" });
        this.cameras.main.zoomTo(1.06, 1500, "Quad.easeIn"); // l'écran se rapproche lentement
        this.time.delayedCall(1620, () => this.coup(voile));
    }

    // ---- 3. LE COUP D'ÉPÉE : la lame traverse l'écran en un clin d'œil, puis l'impact ----
    coup(voile) {
        coupDEpee(this);
        const lame = this.add.graphics().setDepth(100);
        const etat = { p: 0 };
        this.tweens.add({ targets: etat, p: 1, duration: 140, ease: "Quad.In",
            onUpdate: () => {
                lame.clear();
                const jusqua = Math.floor(POINTS * etat.p);
                [[150, 0xffd45c, 0.20], [90, 0xffffff, 0.35], [46, 0xffffff, 0.7], [18, 0xffffff, 1]].forEach(([largeur, couleur, alpha]) => dessinerLame(lame, jusqua, largeur, couleur, alpha)); // halo doré, puis des couches de plus en plus claires
            },
            onComplete: () => this.impactCoup(lame, voile)
        });
    }

    // L'impact : tout se passe en même temps, et c'est ÉNORME. Un flash blanc, un coup de zoom, un tremblement violent, une onde de choc, une gerbe d'étincelles, le boum du coup
    // et les craquements du verre : l'écran SE FISSURE à partir de la lame (les fissures restent sur l'écran, et dans les deux moitiés quand il se brise). Un temps d'arrêt, puis il est tranché.
    impactCoup(lame, voile) {
        impact(this);
        verre(this);
        const camera = this.cameras.main;
        camera.flash(340, 255, 255, 255);
        camera.shake(1300, 0.07); // un tremblement très violent
        camera.zoomTo(1.24, 50, "Quad.easeOut"); // le coup de zoom de l'impact...
        this.time.delayedCall(110, () => camera.zoomTo(1.0, 330, "Quad.easeOut")); // ...qui revient en rebondissant
        const centre = LIGNE[Math.floor(POINTS * 0.5)];
        // l'onde de choc : deux anneaux qui grandissent et s'amincissent
        [0, 90].forEach((retard, i) => {
            const onde = this.add.graphics().setDepth(102).setBlendMode(Phaser.BlendModes.ADD);
            const anneau = { rayon: 20, epaisseur: 30 - i * 8, alpha: 1 };
            this.tweens.add({ targets: anneau, rayon: 900, epaisseur: 2, alpha: 0, duration: 760, delay: retard, ease: "Cubic.Out",
                onUpdate: () => { onde.clear().lineStyle(anneau.epaisseur * 1.8, 0xffd45c, anneau.alpha * 0.35).strokeCircle(centre.x, centre.y, anneau.rayon).lineStyle(anneau.epaisseur, 0xffffff, anneau.alpha).strokeCircle(centre.x, centre.y, anneau.rayon); },
                onComplete: () => onde.destroy() });
        });
        const etincelles = this.add.particles(0, 0, "pixel", {
            speed: { min: 250, max: 1100 }, angle: { min: 0, max: 360 }, gravityY: 800, lifespan: { min: 350, max: 1200 }, scale: { start: 3.4, end: 0 },
            alpha: { start: 1, end: 0 }, tint: [0xfff2c0, 0xffd45c, 0xffffff], blendMode: "ADD", emitting: false
        }).setDepth(103);
        for (let i = 4; i < POINTS - 4; i += 2) etincelles.emitParticleAt(LIGNE[i].x, LIGNE[i].y, 4);
        this.fissurer(lame);
        this.time.delayedCall(560, () => this.trancher(lame, voile, etincelles)); // les fissures se propagent sous le tremblement, puis l'écran est tranché
    }

    // Le réseau de fissures : de chaque point de la lame partent des fêlures brisées, qui s'étendent en 0,3 s. Elles sont dessinées sur l'écran (donc dans la photo qui sera coupée).
    fissurer(lame) {
        const graphique = this.add.graphics().setDepth(101);
        const fissures = [];
        const branche = (x, y, angle, longueur, generation) => { // une fêlure : une ligne brisée qui peut se diviser
            const points = [{ x, y }];
            let a = angle;
            for (let reste = longueur; reste > 0;) {
                const pas = Phaser.Math.Between(26, 70);
                a += Phaser.Math.FloatBetween(-0.55, 0.55);
                const dernier = points[points.length - 1];
                points.push({ x: dernier.x + Math.cos(a) * pas, y: dernier.y + Math.sin(a) * pas });
                reste -= pas;
                if (generation < 2 && Math.random() < 0.22) branche(points[points.length - 1].x, points[points.length - 1].y, a + Phaser.Math.FloatBetween(-1.1, 1.1), reste * 0.8, generation + 1);
            }
            if (points.length >= 2) fissures.push({ points, epaisseur: Math.max(1.5, 5 - generation * 1.8) }); // (une branche trop courte n'a pas de segment)
        };
        for (let i = 6; i < POINTS - 6; i += 4) { // de nombreux points d'impact le long de la lame, des fêlures des deux côtés
            const p = LIGNE[i], dx = LIGNE[i + 1].x - LIGNE[i - 1].x, dy = LIGNE[i + 1].y - LIGNE[i - 1].y, normale = Math.atan2(dy, dx) + Math.PI / 2;
            branche(p.x, p.y, normale + Phaser.Math.FloatBetween(-0.6, 0.6), Phaser.Math.Between(200, 520), 0);
            branche(p.x, p.y, normale + Math.PI + Phaser.Math.FloatBetween(-0.6, 0.6), Phaser.Math.Between(200, 520), 0);
        }
        const etat = { avancee: 0 };
        this.tweens.add({ targets: etat, avancee: 1, duration: 320, ease: "Cubic.Out",
            onUpdate: () => {
                graphique.clear();
                fissures.forEach(({ points, epaisseur }) => {
                    const jusqua = Math.max(2, Math.floor(points.length * etat.avancee));
                    [[epaisseur + 6, 0x000000, 0.55], [epaisseur + 2, 0xffd45c, 0.5], [epaisseur, 0xffffff, 1]].forEach(([largeur, couleur, alpha]) => { // un contour sombre, un reflet doré, un trait blanc
                        graphique.lineStyle(largeur, couleur, alpha).beginPath().moveTo(points[0].x, points[0].y);
                        for (let k = 1; k < jusqua; k++) graphique.lineTo(points[k].x, points[k].y);
                        graphique.strokePath();
                    });
                });
            } });
    }

    // ---- 4. L'ÉCRAN EST TRANCHÉ : une photo de l'écran est coupée le long de la courbe, et les deux moitiés s'écartent dans la lumière ----
    trancher(lame, voile, etincelles) {
        const camera = this.cameras.main;
        camera.resetFX(); // plus de tremblement ni de flash : la photo doit être nette
        camera.setZoom(1);
        this.game.renderer.snapshot((image) => {
            if (!image || !image.width) { this.revelerBoss(); return; } // pas de photo possible : on passe directement à la suite
            const milieu = Math.floor(POINTS / 2);
            const dx = LIGNE[milieu + 1].x - LIGNE[milieu - 1].x, dy = LIGNE[milieu + 1].y - LIGNE[milieu - 1].y, longueur = Math.hypot(dx, dy);
            const normale = { x: dy / longueur, y: -dx / longueur }; // perpendiculaire à la coupure, vers le haut de l'écran
            const moitie = (cle, cote) => { // une image de l'écran entier, dont seule la moitié du côté `cote` (1 = haut, -1 = bas) est dessinée
                if (this.textures.exists(cle)) this.textures.remove(cle);
                const toile = this.textures.createCanvas(cle, LARGEUR, HAUTEUR);
                const ctx = toile.getContext();
                ctx.beginPath();
                ctx.moveTo(LIGNE[0].x, LIGNE[0].y);
                LIGNE.forEach((p) => ctx.lineTo(p.x, p.y)); // la coupure : la courbe de la lame
                ctx.lineTo(LIGNE[POINTS].x + normale.x * cote * 3000, LIGNE[POINTS].y + normale.y * cote * 3000); // puis on ferme du côté voulu
                ctx.lineTo(LIGNE[0].x + normale.x * cote * 3000, LIGNE[0].y + normale.y * cote * 3000);
                ctx.closePath(); ctx.clip();
                ctx.drawImage(image, 0, 0, LARGEUR, HAUTEUR);
                toile.refresh();
                return this.add.image(LARGEUR / 2, HAUTEUR / 2, cle).setDepth(110);
            };
            const haut = moitie("faux_moitie_haut", 1), bas = moitie("faux_moitie_bas", -1);
            // tout le reste de l'écran est caché (les moitiés le montrent à l'identique), le niveau 3 devient visible derrière
            this.children.list.forEach((objet) => { if (objet !== haut && objet !== bas) objet.setVisible(false); });
            camera.setBackgroundColor("rgba(0,0,0,0)");
            camera.shake(1500, 0.022); // le tremblement continue pendant que l'écran s'ouvre
            verre(this); // l'écran éclate : une nouvelle rafale de verre brisé
            jouerSon(this, "ennemi_mort");
            // la lumière qui sort de la coupure, derrière les moitiés : une bande qui s'élargit en s'éteignant
            const lumiere = this.add.graphics().setDepth(105).setBlendMode(Phaser.BlendModes.ADD);
            const e = { largeur: 40, alpha: 1 };
            this.tweens.add({ targets: e, largeur: 520, alpha: 0, duration: 1700, ease: "Quad.Out",
                onUpdate: () => { lumiere.clear(); dessinerLame(lumiere, POINTS, e.largeur * 1.6, 0xffd45c, e.alpha * 0.4); dessinerLame(lumiere, POINTS, e.largeur, 0xffffff, e.alpha * 0.7); dessinerLame(lumiere, POINTS, e.largeur * 0.35, 0xffffff, e.alpha); },
                onComplete: () => lumiere.destroy() });
            // les étincelles et des éclats qui sortent de la coupure
            const eclats = this.add.particles(0, 0, "pixel", { speed: { min: 120, max: 600 }, angle: { min: 0, max: 360 }, gravityY: 300, lifespan: { min: 600, max: 1500 }, scale: { start: 3, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xfff2c0, 0xffd45c, 0xffffff, 0xb89cff], blendMode: "ADD", emitting: false }).setDepth(106);
            for (let i = 6; i < POINTS - 6; i += 3) eclats.emitParticleAt(LIGNE[i].x, LIGNE[i].y, 4);
            // les deux moitiés s'écartent perpendiculairement à la coupure, en tournant un peu, et sortent de l'écran
            [[haut, 1], [bas, -1]].forEach(([m, cote]) => this.tweens.add({
                targets: m, x: m.x + normale.x * cote * 1200, y: m.y + normale.y * cote * 1200, angle: cote * 6,
                duration: 1500, delay: 60, ease: "Cubic.In", onComplete: () => m.destroy()
            }));
            this.revelerBoss();
        });
    }

    // ---- 5. LE BOSS REVIENT : derrière l'écran ouvert, il surgit dans le fond, grossit et passe au violet (sa forme finale). Puis le niveau reprend. ----
    revelerBoss() {
        const niveau = this.scene.get(this.origine);
        const camera = niveau.cameras.main;
        const boss = niveau.boss;
        const x = boss.x - camera.scrollX, y = boss.y - camera.scrollY; // sa place à l'écran (la caméra du niveau 3 est fixe)
        const halo = this.add.circle(x, y, 90, 0xb89cff, 0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(88).setAlpha(0);
        const spectre = this.add.sprite(x, y + 40, "boss_idle", 0).setScale(ECHELLE_DEBUT * 0.5).setAlpha(0).setDepth(90).setTint(0xff6a5a);
        spectre.play("boss_idle");
        this.tweens.add({ targets: spectre, alpha: 0.95, y, duration: 900, delay: 500 });
        this.tweens.add({ targets: spectre, scale: ECHELLE_FINALE, duration: 2300, delay: 500, ease: "Cubic.Out" });
        this.tweens.add({ targets: halo, alpha: 1, scale: 9, duration: 2300, delay: 500, ease: "Cubic.Out" });
        // LE CRI : un cri de monstre (assets/sons/cri_boss, un seul cri d'un enregistrement qui en contenait deux) qui éclate quand le boss est là : il part 0,35 s avant le changement
        // de forme pour que son pic tombe sur le flash et le tremblement.
        this.time.delayedCall(1350, () => { if (this.cache.audio.exists("cri_boss")) this.sound.play("cri_boss", { volume: Math.min(1, volumeEffets()) }); });
        this.time.delayedCall(1700, () => { // à mi-chemin : il change de forme
            spectre.setTint(TEINTE_FINALE);
            halo.setFillStyle(0xd9c8ff, 0.5);
            this.cameras.main.flash(380, 200, 170, 255);
            this.cameras.main.shake(700, 0.02);
            jouerSon(this, "joueur_mort");
        });
        this.time.delayedCall(1750, () => this.banniere(Math.min(625, y + 345))); // le nom du boss claque en dessous de lui, au moment où il change de forme
        this.time.delayedCall(4500, () => this.terminer());
    }

    // ---- LA BANNIÈRE : le nom du boss, comme à la présentation d'un combattant dans Smash Bros, mais dans la DA du jeu : la plaque d'armure du HUD (coins coupés, rivets, creux sombre), des filets
    // et des losanges dorés, le nom dans la police pixel à deux tons. Elle arrive en glissant, les lettres claquent une à une, un éclat balaie l'intérieur de la plaque, puis elle repart. ----
    banniere(yCentre) {
        const E = 4, LP = 272, HP = 46; // la plaque est dessinée en 272 x 46 pixels, agrandis x4 : 1088 x 184 à l'écran
        const L = LP * E, H = HP * E;
        const interieur = { l: L - 2 * 6 * E, h: H - 2 * 6 * E }; // le creux sombre où s'inscrit le texte (6 pixels de bord, voir plaque() dans classement.js)
        const groupe = this.add.container(-1600, yCentre).setDepth(120);
        groupe.add(this.add.rectangle(10, 14, L, H, 0x000000, 0.55)); // l'ombre portée
        groupe.add(this.add.image(0, 0, plaque(this, LP, HP, true)).setScale(E));
        groupe.add(this.add.rectangle(0, 0, interieur.l - 20, interieur.h - 20).setStrokeStyle(2, OR, 0.5)); // un cadre doré fin dans le creux
        const losange = (x, y, t, alpha = 1) => groupe.add(this.add.rectangle(x, y, t, t, OR, alpha).setAngle(45));
        [-1, 1].forEach((cote) => { // des losanges dorés aux deux bouts, comme les ornements de l'écran de fin
            const x = cote * (interieur.l / 2 - 52);
            losange(x, 0, 30); losange(x + cote * 38, 0, 16, 0.8); losange(x + cote * 66, 0, 8, 0.6);
            groupe.add(this.add.rectangle(x - cote * 40, 0, 4, interieur.h - 50, OR, 0.7)); // une barre dorée verticale à l'intérieur de chaque losange
        });
        groupe.add(this.add.rectangle(0, 20, 640, 3, OR, 0.85)); // le filet doré entre le nom et le sous-titre...
        losange(0, 20, 14);
        const eclat = this.add.rectangle(-interieur.l / 2 + 40, 0, 90, interieur.h - 16, 0xffffff, 0.45).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0); // l'éclat qui balaie l'intérieur de la plaque (invisible avant et après son passage)
        groupe.add(eclat);
        const nom = ecrire(this, 0, -26, "DIEU DE LA LUMIERE", 7, { teinte: 0xffffff }); // (la teinte blanche laisse les deux tons de la police : clair en haut, lavande en bas)
        const sous = ecrire(this, 0, 52, "FORME FINALE", 4, { teinte: OR });
        groupe.add([nom, sous]);
        nom.lettres.concat(sous.lettres).forEach((lettre) => { if (lettre) lettre.setAlpha(0); }); // les lettres apparaissent une à une
        // 1) elle arrive en glissant, avec un petit dépassement
        this.tweens.add({ targets: groupe, x: 640, duration: 330, ease: "Back.Out",
            onComplete: () => {
                // 2) l'impact de l'arrivée : un flash, un tremblement, des étincelles, l'annonce sonore
                annonce(this);
                this.cameras.main.flash(180, 255, 255, 255);
                this.cameras.main.shake(420, 0.016);
                const etincelles = this.add.particles(0, 0, "pixel", { speed: { min: 200, max: 760 }, angle: { min: 0, max: 360 }, gravityY: 500, lifespan: { min: 300, max: 900 }, scale: { start: 3, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xffd45c, 0xb89cff], blendMode: "ADD", emitting: false }).setDepth(121);
                [-L / 2, L / 2].forEach((dx) => etincelles.emitParticleAt(640 + dx, yCentre, 36));
                // 3) les lettres claquent une à une (chacune grossit puis se pose), l'éclat traverse la plaque
                [[nom, 7], [sous, 4]].forEach(([texte, echelle], r) => texte.lettres.forEach((lettre, i) => {
                    if (!lettre) return;
                    lettre.setScale(echelle * 2.2);
                    this.tweens.add({ targets: lettre, alpha: 1, scale: echelle, duration: 170, delay: 80 + i * 32 + r * 250, ease: "Back.Out" });
                }));
                this.tweens.add({ targets: eclat, x: interieur.l / 2 - 40, duration: 650, delay: 150, ease: "Cubic.InOut" });
                this.tweens.add({ targets: eclat, alpha: 0.45, duration: 120, delay: 150, onComplete: () => this.tweens.add({ targets: eclat, alpha: 0, duration: 220, delay: 300 }) });
                this.tweens.add({ targets: groupe, scale: 1.02, duration: 600, yoyo: true, repeat: 2, ease: "Sine.InOut" }); // elle respire pendant qu'elle est affichée
            }
        });
        // 4) elle repart par la droite, avant que le niveau reprenne
        this.time.delayedCall(2750, () => this.tweens.add({ targets: groupe, x: 2000, duration: 280, ease: "Cubic.In", onComplete: () => groupe.destroy() }));
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
