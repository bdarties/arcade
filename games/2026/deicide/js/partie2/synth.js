// synth.js : les sons de la FAUSSE FIN du dernier boss (faux_pantheon.js), fabriqués par synthèse avec l'API audio du navigateur : aucun fichier audio.
// Fanfare de victoire, battements de cœur, montée de tension, souffle de la lame, tintement du métal, impact et grondement.
// Ils suivent le réglage « bruitages » du menu pause. Si le navigateur n'a pas d'audio Web, ils se taisent sans rien casser.
import { volumeEffets } from "../partie1/systemes/sons.js";

const NOTES = { do4: 261.63, mi4: 329.63, sol4: 392, do5: 523.25, mi5: 659.25, sol5: 783.99, do6: 1046.5, mi6: 1318.5 };

function contexte(scene) { const c = scene.sound && scene.sound.context; return c && c.state !== "closed" ? c : null; }

function sortie(c, volume) { // un gain réglé sur le volume des bruitages du jeu, branché sur les haut-parleurs
    const gain = c.createGain();
    gain.gain.value = volume * volumeEffets();
    gain.connect(c.destination);
    return gain;
}

const tampons = new WeakMap();
function bruitBlanc(c) { // 2 s de bruit blanc, fabriquées une seule fois par contexte audio
    if (!tampons.has(c)) {
        const tampon = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
        const donnees = tampon.getChannelData(0);
        for (let i = 0; i < donnees.length; i++) donnees[i] = Math.random() * 2 - 1;
        tampons.set(c, tampon);
    }
    return tampons.get(c);
}

// une note : un oscillateur avec une attaque rapide et une extinction progressive
function note(c, destination, type, frequence, debut, duree, volume = 1, detune = 0) {
    const oscillateur = c.createOscillator();
    const enveloppe = c.createGain();
    oscillateur.type = type;
    oscillateur.frequency.value = frequence;
    oscillateur.detune.value = detune;
    enveloppe.gain.setValueAtTime(0.0001, debut);
    enveloppe.gain.exponentialRampToValueAtTime(volume, debut + 0.02);
    enveloppe.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
    oscillateur.connect(enveloppe).connect(destination);
    oscillateur.start(debut);
    oscillateur.stop(debut + duree + 0.05);
}

// du bruit passé dans un filtre, avec une enveloppe de volume
function souffle(c, destination, type, depart, fin, debut, duree, volume) {
    const source = c.createBufferSource();
    source.buffer = bruitBlanc(c);
    source.loop = true;
    const filtre = c.createBiquadFilter();
    filtre.type = type;
    filtre.frequency.setValueAtTime(depart, debut);
    filtre.frequency.exponentialRampToValueAtTime(fin, debut + duree);
    const enveloppe = c.createGain();
    enveloppe.gain.setValueAtTime(0.0001, debut);
    enveloppe.gain.exponentialRampToValueAtTime(volume, debut + Math.min(0.03, duree / 3));
    enveloppe.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
    source.connect(filtre).connect(enveloppe).connect(destination);
    source.start(debut);
    source.stop(debut + duree + 0.05);
}

export function fanfare(scene) { // la victoire : une montée de cuivres en do majeur, puis l'accord tenu et des clochettes
    const c = contexte(scene); if (!c) return;
    const sortieFanfare = sortie(c, 0.34), t = c.currentTime + 0.02;
    [["do5", 0], ["mi5", 0.13], ["sol5", 0.26], ["do6", 0.39]].forEach(([nom, delai]) => {
        note(c, sortieFanfare, "sawtooth", NOTES[nom], t + delai, 0.34, 0.5);
        note(c, sortieFanfare, "square", NOTES[nom], t + delai, 0.34, 0.14, 7);
    });
    ["do4", "mi4", "sol4", "do5", "mi5", "sol5"].forEach((nom, i) => { // l'accord final, tenu
        note(c, sortieFanfare, "sawtooth", NOTES[nom], t + 0.55, 1.6, 0.34, i % 2 ? 6 : -6);
        note(c, sortieFanfare, "triangle", NOTES[nom], t + 0.55, 1.6, 0.4);
    });
    [["do6", 0.6], ["mi6", 0.78], ["do6", 0.96], ["sol5", 1.14]].forEach(([nom, delai]) => note(c, sortieFanfare, "sine", NOTES[nom] * 2, t + delai, 1.1, 0.16)); // des clochettes
}

export function battements(scene) { // deux battements de cœur, graves
    const c = contexte(scene); if (!c) return;
    const sortieCoeur = sortie(c, 1), t = c.currentTime + 0.02;
    [0, 0.34].forEach((delai, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(70, t + delai); o.frequency.exponentialRampToValueAtTime(34, t + delai + 0.22);
        g.gain.setValueAtTime(0.0001, t + delai); g.gain.exponentialRampToValueAtTime(i ? 0.8 : 1, t + delai + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + delai + 0.3);
        o.connect(g).connect(sortieCoeur); o.start(t + delai); o.stop(t + delai + 0.35);
    });
}

export function montee(scene, duree) { // la tension qui monte avant le coup : un son qui grimpe, avec un souffle
    const c = contexte(scene); if (!c) return;
    const sortieMontee = sortie(c, 0.5), t = c.currentTime + 0.02;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = "sawtooth"; f.type = "lowpass";
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(520, t + duree);
    f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(2400, t + duree);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t + duree * 0.95); g.gain.exponentialRampToValueAtTime(0.0001, t + duree + 0.03);
    o.connect(f).connect(g).connect(sortieMontee); o.start(t); o.stop(t + duree + 0.1);
    souffle(c, sortieMontee, "bandpass", 300, 3500, t, duree, 0.5);
}

export function coupDEpee(scene) { // LE coup : le souffle de la lame qui fend l'air, puis le tintement du métal
    const c = contexte(scene); if (!c) return;
    const sortieEpee = sortie(c, 1), t = c.currentTime + 0.01;
    souffle(c, sortieEpee, "bandpass", 500, 7000, t, 0.16, 1.0); // le souffle : un bruit qui monte très vite
    souffle(c, sortieEpee, "highpass", 2500, 6000, t + 0.02, 0.2, 0.4);
    [3100, 4700, 6200, 7900, 9300].forEach((f, i) => note(c, sortieEpee, "sine", f * (1 + i * 0.002), t + 0.12, 1.5 - i * 0.18, 0.13)); // le tintement du métal
}

// Une sortie FORTE : un compresseur qui écrase les pics, pour qu'une addition de sons très puissants sonne énorme sans saturer les haut-parleurs.
// `seuil` : à partir de quel niveau (dB) le compresseur écrase ; `final` : un gain APRÈS le compresseur (le compresseur rend le niveau peu sensible au volume d'entrée).
function sortieForte(c, volume, final = 1, seuil = -14) {
    const compresseur = c.createDynamicsCompressor();
    compresseur.threshold.value = seuil; compresseur.knee.value = 8; compresseur.ratio.value = 7; compresseur.attack.value = 0.002; compresseur.release.value = 0.25;
    const gain = c.createGain();
    gain.gain.value = volume * volumeEffets();
    const sortieFinale = c.createGain();
    sortieFinale.gain.value = final;
    gain.connect(compresseur).connect(sortieFinale).connect(c.destination);
    return gain;
}

function courbeSaturation(c) { // une courbe qui écrase les pics : elle ajoute des harmoniques et donne du mordant au boum grave
    const n = 1024, courbe = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; courbe[i] = Math.tanh(x * 3.2); }
    return courbe;
}

export function impact(scene) { // l'IMPACT : un boum très grave et saturé, un coup sec, un claquement, un fracas métallique, un long grondement
    const c = contexte(scene); if (!c) return;
    const sortieImpact = sortieForte(c, 1.35, 0.9), t = c.currentTime + 0.005; // (mesuré hors ligne : pic sous 0 dBFS, 19 dB plus fort que la fanfare sur les 300 premières ms)
    const boum = c.createOscillator(), gainBoum = c.createGain(), saturation = c.createWaveShaper();
    boum.type = "sine"; saturation.curve = courbeSaturation(c); saturation.oversample = "2x";
    boum.frequency.setValueAtTime(130, t); boum.frequency.exponentialRampToValueAtTime(26, t + 1.1);
    gainBoum.gain.setValueAtTime(0.0001, t); gainBoum.gain.exponentialRampToValueAtTime(1.8, t + 0.008); gainBoum.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    boum.connect(saturation).connect(gainBoum).connect(sortieImpact); boum.start(t); boum.stop(t + 1.4);
    const coup = c.createOscillator(), gainCoup = c.createGain(); // le « thud » : le corps du coup, plus haut que le boum
    coup.type = "triangle"; coup.frequency.setValueAtTime(220, t); coup.frequency.exponentialRampToValueAtTime(48, t + 0.22);
    gainCoup.gain.setValueAtTime(0.0001, t); gainCoup.gain.exponentialRampToValueAtTime(1.5, t + 0.006); gainCoup.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    coup.connect(gainCoup).connect(sortieImpact); coup.start(t); coup.stop(t + 0.4);
    souffle(c, sortieImpact, "highpass", 500, 5000, t, 0.16, 2.2); // le claquement sec
    souffle(c, sortieImpact, "bandpass", 2600, 350, t + 0.01, 0.7, 1.4); // le fracas métallique
    souffle(c, sortieImpact, "lowpass", 340, 36, t, 3.2, 1.6); // le grondement qui s'éteint
    souffle(c, sortieImpact, "bandpass", 900, 120, t + 0.02, 1.0, 1.1); // le souffle de l'onde de choc
}

export function verre(scene) { // des craquements de verre : une rafale de petits claquements aigus répartis sur une demi-seconde
    const c = contexte(scene); if (!c) return;
    const sortieVerre = sortieForte(c, 1.1), t = c.currentTime + 0.02;
    for (let i = 0; i < 34; i++) {
        const debut = t + Math.pow(Math.random(), 1.6) * 0.65; // plus serrés au début
        const f = 2500 + Math.random() * 6500;
        souffle(c, sortieVerre, "bandpass", f, f * 0.6, debut, 0.03 + Math.random() * 0.05, 0.6 + Math.random() * 0.9);
    }
    souffle(c, sortieVerre, "highpass", 1800, 7000, t, 0.25, 1.0); // et l'éclat de la fêlure principale
}

// Le CRI du boss, juste avant le coup d'épée : un grognement très grave qui monte en hurlement. Une voix (deux dents-de-scie désaccordées + une note une octave plus bas)
// dont la hauteur grimpe, un trémolo rapide (le grondement), trois filtres « formants » qui glissent (la bouche qui s'ouvre), de la distorsion, et du souffle (la rage).
export function cri(scene, duree = 1.05) {
    const c = contexte(scene); if (!c) return;
    const sortieCri = sortieForte(c, 0.75, 0.38, -2), t = c.currentTime + 0.02, fin = t + duree;
    const glisser = (parametre, a, b, d) => { parametre.setValueAtTime(a, t); parametre.exponentialRampToValueAtTime(b, t + duree * 0.55); parametre.exponentialRampToValueAtTime(d, fin); };
    const voix = c.createGain(); // l'entrée de la voix : les trois oscillateurs s'y additionnent
    [["sawtooth", 0, 1, [66, 92, 330]], ["sawtooth", 17, 0.8, [66, 92, 330]], ["square", 0, 0.5, [33, 46, 165]]].forEach(([type, detune, volume, [f0, f1, f2]]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.detune.value = detune; g.gain.value = volume;
        glisser(o.frequency, f0, f1, f2);
        o.connect(g).connect(voix); o.start(t); o.stop(fin + 0.05);
    });
    const tremolo = c.createGain(); tremolo.gain.value = 0.62; // le grondement : le volume vibre 30 fois par seconde
    const lfo = c.createOscillator(), profondeur = c.createGain(); lfo.frequency.value = 30; profondeur.gain.value = 0.38;
    lfo.connect(profondeur).connect(tremolo.gain); lfo.start(t); lfo.stop(fin + 0.05);
    const gorge = c.createGain(); // la sortie des formants
    [[350, 850, 1], [900, 1500, 0.8], [2200, 2900, 0.5]].forEach(([debut, fin2, volume]) => { // la bouche s'ouvre : chaque formant glisse vers l'aigu
        const filtre = c.createBiquadFilter(), g = c.createGain();
        filtre.type = "bandpass"; filtre.Q.value = 7; g.gain.value = volume;
        filtre.frequency.setValueAtTime(debut, t); filtre.frequency.exponentialRampToValueAtTime(fin2, fin);
        voix.connect(filtre).connect(g).connect(gorge);
    });
    voix.connect(tremolo); // un peu de voix brute aussi, pour le grave
    const brute = c.createGain(); brute.gain.value = 0.55; tremolo.connect(brute).connect(gorge);
    const distorsion = c.createWaveShaper(); distorsion.curve = courbeSaturation(c); distorsion.oversample = "2x";
    const enveloppe = c.createGain(); // l'intensité : un grognement qui s'installe, puis le hurlement, et une coupure nette juste avant le coup
    enveloppe.gain.setValueAtTime(0.0001, t);
    enveloppe.gain.exponentialRampToValueAtTime(0.5, t + duree * 0.18);
    enveloppe.gain.exponentialRampToValueAtTime(0.85, t + duree * 0.78);
    enveloppe.gain.exponentialRampToValueAtTime(1.5, t + duree * 0.96);
    enveloppe.gain.linearRampToValueAtTime(0, fin + 0.02);
    gorge.connect(distorsion).connect(enveloppe).connect(sortieCri);
    souffle(c, sortieCri, "bandpass", 1500, 4200, t + duree * 0.25, duree * 0.75, 0.6); // le souffle rauque qui monte avec le hurlement
}

export function annonce(scene) { // l'annonce du nom du boss : un accord de cuivres sec, un coup grave et un éclat métallique
    const c = contexte(scene); if (!c) return;
    const sortieAnnonce = sortieForte(c, 1.0, 0.6, -10), t = c.currentTime + 0.01;
    [110, 165, 220, 330].forEach((f, i) => note(c, sortieAnnonce, "sawtooth", f, t, 0.55, 0.7, i % 2 ? 8 : -8));
    [440, 660, 880].forEach((f) => note(c, sortieAnnonce, "square", f, t, 0.3, 0.2));
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(sortieAnnonce); o.start(t); o.stop(t + 0.55);
    souffle(c, sortieAnnonce, "highpass", 1500, 6000, t, 0.14, 0.9);
    [4200, 6300].forEach((f) => note(c, sortieAnnonce, "sine", f, t + 0.02, 0.8, 0.1));
}
