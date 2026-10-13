// BRUITAGES générés par code (WebAudio) : aucun fichier audio à ajouter.
// Pour utiliser tes propres sons plus tard : charge-les dans jeu.js (this.load.audio) et
// remplace le contenu de la fonction voulue ci-dessous par  scene.sound.play("ton_son").

// Sons qui viennent de VRAIS FICHIERS (dans assets/sons/). nom du son -> fichier + volume.
// Pour changer un son : remplace le fichier, ou change le nom / le volume ici.
const FICHIERS = {
  saut:   { cle: "snd_saut",    fichier: "./assets/sons/jump.wav",    vol: 0.6 },
  degats: { cle: "snd_hurt",    fichier: "./assets/sons/hurt.mp3",    vol: 0.9 },
  potion: { cle: "snd_success", fichier: "./assets/sons/success.mp3", vol: 0.7 }
};

// à appeler dans le preload() d'une scène (après setBaseURL) : charge les fichiers audio une seule fois
export function chargerSons(scene) {
  Object.values(FICHIERS).forEach((f) => {
    if (!scene.cache.audio.exists(f.cle)) scene.load.audio(f.cle, [f.fichier]);
  });
}

let bruitBlanc = null; // tampon de bruit réutilisé

function contexte(scene) {
  const snd = scene.sound;
  if (!snd || snd.noAudio || !snd.context) return null;
  const ctx = snd.context;
  if (ctx.state === "suspended") ctx.resume();
  if (ctx.state !== "running") return null; // pas encore débloqué par un appui : on reste muet
  return ctx;
}

// un "bip" dont la fréquence glisse de f0 à f1
function ton(scene, { type = "square", f0 = 440, f1 = f0, duree = 0.15, vol = 0.12, delai = 0 }) {
  const ctx = contexte(scene);
  if (!ctx) return;
  const t = ctx.currentTime + delai;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + duree);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duree + 0.02);
}

// un "pschitt" de bruit filtré
function bruit(scene, { duree = 0.1, vol = 0.15, filtre = 1500, delai = 0 }) {
  const ctx = contexte(scene);
  if (!ctx) return;
  if (!bruitBlanc || bruitBlanc.context !== ctx) {
    bruitBlanc = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = bruitBlanc.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    bruitBlanc.context = ctx;
  }
  const t = ctx.currentTime + delai;
  const src = ctx.createBufferSource();
  src.buffer = bruitBlanc;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filtre;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  src.connect(f).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + duree + 0.02);
}

export const SONS = {
  // coup de poing : souffle + gros "boum" grave (bien plus fort qu'avant)
  coup(s)        { bruit(s, { duree: 0.12, vol: 0.55, filtre: 3000 }); ton(s, { type: "triangle", f0: 260, f1: 60, duree: 0.16, vol: 0.45 }); ton(s, { type: "sine", f0: 120, f1: 40, duree: 0.2, vol: 0.5 }); },
  tir(s)         { ton(s, { type: "square", f0: 900, f1: 220, duree: 0.16, vol: 0.09 }); },
  // coup qui touche : claque sèche
  impact(s)      { bruit(s, { duree: 0.12, vol: 0.5, filtre: 4000 }); ton(s, { type: "square", f0: 180, f1: 50, duree: 0.12, vol: 0.3 }); },
  tirEnnemi(s)   { ton(s, { type: "sawtooth", f0: 320, f1: 110, duree: 0.22, vol: 0.09 }); },
  degats(s)      { ton(s, { type: "sawtooth", f0: 260, f1: 60, duree: 0.3, vol: 0.16 }); bruit(s, { duree: 0.15, vol: 0.14, filtre: 900 }); },
  mortEnnemi(s)  { bruit(s, { duree: 0.25, vol: 0.2, filtre: 1800 }); ton(s, { type: "square", f0: 400, f1: 50, duree: 0.3, vol: 0.1 }); },
  mortJoueur(s)  { ton(s, { type: "sawtooth", f0: 300, f1: 30, duree: 0.8, vol: 0.2 }); bruit(s, { duree: 0.5, vol: 0.2, filtre: 700 }); },
  // mort dans un trou (ancien son des piques)
  pique(s)       { bruit(s, { duree: 0.2, vol: 0.2, filtre: 4000 }); ton(s, { type: "sawtooth", f0: 700, f1: 80, duree: 0.45, vol: 0.14 }); },
  alerte(s)      { ton(s, { type: "square", f0: 500, f1: 500, duree: 0.06, vol: 0.06 }); },
  // boire une potion : glou glou
  boire(s)       { [0, 0.11, 0.22].forEach((d, i) => ton(s, { type: "sine", f0: 300 + i * 120, f1: 520 + i * 160, duree: 0.1, vol: 0.14, delai: d })); },
  pouvoir(s)     { [440, 554, 659, 880].forEach((f, i) => ton(s, { type: "triangle", f0: f, f1: f * 1.02, duree: 0.18, vol: 0.12, delai: i * 0.09 })); },
  soin(s)        { [520, 660, 780].forEach((f, i) => ton(s, { type: "sine", f0: f, f1: f, duree: 0.2, vol: 0.12, delai: i * 0.1 })); },
  parler(s)      { ton(s, { type: "square", f0: 180 + Math.random() * 60, f1: 150, duree: 0.05, vol: 0.04 }); },
  page(s)        { ton(s, { type: "sine", f0: 700, f1: 900, duree: 0.07, vol: 0.07 }); },

  // --- interface ---
  clic(s)        { ton(s, { type: "square", f0: 900, f1: 600, duree: 0.04, vol: 0.07 }); },
  valider(s)     { ton(s, { type: "square", f0: 500, f1: 500, duree: 0.06, vol: 0.07 }); ton(s, { type: "square", f0: 800, f1: 800, duree: 0.09, vol: 0.07, delai: 0.07 }); },
  retour(s)      { ton(s, { type: "square", f0: 600, f1: 380, duree: 0.08, vol: 0.07 }); },

  // --- portes ---
  // porte qui s'ouvre : clac de la poignée, long grincement des gonds, puis la porte cogne en butée
  porte(s) {
    bruit(s, { duree: 0.05, vol: 0.4, filtre: 2500 });                                            // clac de la poignée
    ton(s, { type: "sawtooth", f0: 110, f1: 420, duree: 0.7, vol: 0.18, delai: 0.08 });          // grincement qui monte
    ton(s, { type: "square",   f0: 150, f1: 360, duree: 0.65, vol: 0.07, delai: 0.1 });
    bruit(s, { duree: 0.65, vol: 0.2, filtre: 900, delai: 0.08 });                                // frottement du bois
    ton(s, { type: "sine",     f0: 90,  f1: 35,  duree: 0.25, vol: 0.5, delai: 0.74 });          // "toum" de la porte en butée
    bruit(s, { duree: 0.12, vol: 0.4, filtre: 600, delai: 0.74 });
  },
  // porte fermée : clac-clac du verrou
  verrou(s)      { ton(s, { type: "square", f0: 200, f1: 120, duree: 0.05, vol: 0.12 }); ton(s, { type: "square", f0: 170, f1: 100, duree: 0.06, vol: 0.12, delai: 0.09 }); bruit(s, { duree: 0.04, vol: 0.12, filtre: 3000 }); },

  // --- objets / énigmes ---
  // clé ramassée : petit tintement métallique
  cle(s)         { [1568, 2093, 2637, 3136].forEach((f, i) => ton(s, { type: "triangle", f0: f, f1: f, duree: 0.25, vol: 0.08, delai: i * 0.07 })); },
  // bonne réponse : accord montant
  bonneReponse(s){ [523, 659, 784, 1047].forEach((f, i) => ton(s, { type: "triangle", f0: f, f1: f, duree: 0.22, vol: 0.11, delai: i * 0.08 })); },
  // chasse d'eau
  chasse(s)      { bruit(s, { duree: 1.4, vol: 0.16, filtre: 2200 }); ton(s, { type: "sine", f0: 120, f1: 60, duree: 1.2, vol: 0.1 }); },

  // --- fin de partie ---
  victoire(s)    { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => ton(s, { type: "square", f0: f, f1: f, duree: 0.2, vol: 0.09, delai: i * 0.14 })); },
  gameOver(s)    { [392, 349, 311, 262].forEach((f, i) => ton(s, { type: "sawtooth", f0: f, f1: f * 0.97, duree: 0.4, vol: 0.1, delai: i * 0.3 })); },

  // laser : son continu, renvoie un objet avec .stop()
  laserOn(scene) {
    const ctx = contexte(scene);
    if (!ctx) return { stop() {} };
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 170;
    lfo.frequency.value = 38;
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain).connect(osc.frequency);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.1, t + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    lfo.start(t);
    return {
      stop() {
        const n = ctx.currentTime;
        gain.gain.cancelScheduledValues(n);
        gain.gain.setValueAtTime(gain.gain.value || 0.1, n);
        gain.gain.exponentialRampToValueAtTime(0.0001, n + 0.12);
        osc.stop(n + 0.15);
        lfo.stop(n + 0.15);
      }
    };
  }
};

// joue un son sans jamais faire planter le jeu
export function jouer(scene, nom) {
  try {
    const f = FICHIERS[nom];
    if (f) {
      // son qui vient d'un fichier
      if (scene.cache.audio.exists(f.cle)) scene.sound.play(f.cle, { volume: f.vol });
      return;
    }
    SONS[nom](scene);
  } catch (e) {
    /* pas de son, tant pis */
  }
}
