/*
 * ════════════════════════════════════════════════════════════════════
 *  LE PETIT SYNTHÉTISEUR DE LA TABLETTE (bruitages, compte à rebours, musique de fond)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Ce module lit les partitions écrites dans moteur/contenus/blindtest.js
 *  (« E4:1 D#4:.5 … ») et les joue avec la « Web Audio API », un vrai
 *  petit studio de musique intégré à tous les navigateurs récents.
 *
 *  Pour chaque note, on crée un oscillateur (le son brut, ici une onde
 *  « triangle », douce et un peu rétro, comme une boîte à musique
 *  électronique) et un réglage de volume qui monte vite puis retombe :
 *  c'est ce qui donne à chaque note son attaque et sa résonance.
 *
 *  ATTENTION, règle des navigateurs : aucun son ne peut sortir tant que
 *  personne n'a touché l'écran. On « débloque » donc le son au moment
 *  où l'animateur appuie sur « Lancer la partie ».
 */
(function () {
  'use strict';
  window.GT = window.GT || {};

  let contexte = null;
  let sortie = null;
  let enCours = [];      // les notes programmées, pour pouvoir tout couper
  let lecteur = null;    // le lecteur audio pour les fichiers mp3 personnels
  let enSilence = false; // vrai pendant le blind test (voir silence())

  const DEMI_TONS = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

  /* La fréquence d'une note : le la (A4) vibre à 440 Hz, et chaque demi-ton multiplie par la racine 12e de 2. */
  function frequence(note) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(note);
    if (!m) return null;
    let n = DEMI_TONS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
    return 440 * Math.pow(2, n / 12);
  }

  function preparer() {
    if (contexte) return contexte;
    const Classe = window.AudioContext || window.webkitAudioContext;
    if (!Classe) return null;
    contexte = new Classe();
    // Sur iPhone récent : notre son se comporte comme un lecteur de musique (et ne coupe pas les extraits).
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ancien appareil */ }
    sortie = contexte.createGain();
    sortie.gain.value = 0.32;
    sortie.connect(contexte.destination);
    return contexte;
  }

  /* Un souffle de bruit blanc, préparé une fois : la matière des cymbales, des claquements et des explosions. */
  let bruitBlanc = null;
  function souffle() {
    if (bruitBlanc) return bruitBlanc;
    const c = contexte;
    bruitBlanc = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const donnees = bruitBlanc.getChannelData(0);
    for (let i = 0; i < donnees.length; i++) donnees[i] = Math.random() * 2 - 1;
    return bruitBlanc;
  }

  /* Un coup de bruit filtré (cymbale, claquement…), à l'instant « t », vers la sortie « vers ». */
  function bruit(t, duree, filtreType, frequenceHz, volume, vers) {
    const c = contexte;
    const src = c.createBufferSource();
    src.buffer = souffle();
    const f = c.createBiquadFilter();
    f.type = filtreType;
    f.frequency.value = frequenceHz;
    const g = c.createGain();
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    src.connect(f).connect(g).connect(vers || sortie);
    src.start(t);
    src.stop(t + duree + 0.02);
  }

  /* Un coup de grosse caisse : une note grave dont la hauteur plonge en un éclair. */
  function grosseCaisse(t, volume, vers, depuisHz) {
    const c = contexte;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(depuisHz || 150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g).connect(vers || sortie);
    o.start(t);
    o.stop(t + 0.35);
  }

  /* Une note brève programmée à l'instant « t » (pour les effets réglés au centième de seconde). */
  function tonalite(t, frequenceHz, duree, forme, volume, versHz) {
    const c = contexte;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = forme;
    o.frequency.setValueAtTime(frequenceHz, t);
    if (versHz) o.frequency.exponentialRampToValueAtTime(versHz, t + duree);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g).connect(sortie);
    o.start(t);
    o.stop(t + duree + 0.03);
  }

  GT.musique = {
    /* À appeler pendant un toucher d'écran : le navigateur autorise alors le son pour toute la soirée. */
    debloquer() {
      const c = preparer();
      const ensuite = () => { if (GT.ambiance) GT.ambiance.reprendre(); };
      if (enSilence) return; // pendant le blind test, on laisse le synthétiseur en veille
      if (c && c.state === 'suspended') c.resume().then(ensuite, () => {}); else setTimeout(ensuite, 0);
      // Un son silencieux d'un instant : iOS exige qu'un son soit réellement « joué » pour ouvrir le robinet.
      if (c) { const o = c.createOscillator(); const g = c.createGain(); g.gain.value = 0; o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.01); }
    },

    pret() { return !!contexte && contexte.state === 'running' && !enSilence; },

    /*
     * Le silence complet pendant le blind test. Sur iPhone et iPad, notre
     * synthétiseur et l'extrait d'Apple se disputent le haut-parleur :
     * tant que le synthétiseur tourne, l'extrait peut rester muet. On met
     * donc le synthétiseur entièrement en veille pendant les questions du
     * blind test, et on le réveille juste après.
     */
    silence(oui) {
      if (!contexte || enSilence === !!oui) return;
      enSilence = !!oui;
      if (enSilence) { if (GT.ambiance) GT.ambiance.suspendre(); contexte.suspend().catch(() => {}); }
      else contexte.resume().then(() => { if (GT.ambiance) GT.ambiance.reprendre(); }, () => {});
    },

    /* Jouer une mélodie (deux fois de suite, avec une pause entre les deux). */
    jouer(melodie) {
      this.arreter();
      if (!melodie) return;
      if (melodie.fichier) {
        lecteur = new Audio(melodie.fichier);
        lecteur.play().catch(() => {});
        return;
      }
      const c = preparer();
      if (!c || !melodie.notes) return;
      if (c.state === 'suspended') c.resume();
      const tempsParBattement = 60 / (melodie.tempo || 110);
      let t = c.currentTime + 0.15;
      for (let tour = 0; tour < 2; tour++) {
        melodie.notes.trim().split(/\s+/).forEach((jeton) => {
          const [note, duree] = jeton.split(':');
          const longueur = Number(duree) * tempsParBattement;
          const f = frequence(note);
          if (f) {
            const osc = c.createOscillator();
            const enveloppe = c.createGain();
            osc.type = 'triangle';
            osc.frequency.value = f;
            // L'enveloppe : attaque en 15 ms, puis une décroissance qui laisse la note respirer.
            enveloppe.gain.setValueAtTime(0.0001, t);
            enveloppe.gain.exponentialRampToValueAtTime(1, t + 0.015);
            enveloppe.gain.exponentialRampToValueAtTime(0.35, t + Math.min(0.2, longueur * 0.5));
            enveloppe.gain.exponentialRampToValueAtTime(0.0001, t + longueur * 0.95);
            osc.connect(enveloppe).connect(sortie);
            osc.start(t);
            osc.stop(t + longueur);
            enCours.push(osc);
          }
          t += longueur;
        });
        t += 1.2; // une respiration avant la reprise
      }
    },

    /*
     * Un simple « bip » pour les effets sonores (le jeu Feu vert !) :
     * une fréquence, une durée en secondes, une forme d'onde et un volume.
     */
    bip(frequenceHz, dureeS, forme, volume) {
      const c = preparer();
      if (!c) return;
      if (c.state === 'suspended') c.resume();
      const t = c.currentTime + 0.01;
      const osc = c.createOscillator();
      const enveloppe = c.createGain();
      osc.type = forme || 'sine';
      osc.frequency.value = frequenceHz;
      enveloppe.gain.setValueAtTime(0.0001, t);
      enveloppe.gain.exponentialRampToValueAtTime(volume || 0.8, t + 0.01);
      enveloppe.gain.exponentialRampToValueAtTime(0.0001, t + dureeS);
      osc.connect(enveloppe).connect(sortie);
      osc.start(t);
      osc.stop(t + dureeS + 0.02);
    },

    arreter() {
      enCours.forEach((o) => { try { o.stop(); } catch (e) { /* déjà fini */ } });
      enCours = [];
      if (lecteur) { lecteur.pause(); lecteur = null; }
    },

    /*
     * Le compte à rebours des 3 dernières secondes, façon plateau télé :
     *  • chaque seconde frappe un grand coup de grosse caisse et un « bip »
     *    qui glisse vers l'aigu (de plus en plus haut : 3, 2, 1) ;
     *  • entre deux secondes, un tic-tac qui ACCÉLÈRE (2 tics à 3, 4 tics
     *    à 2, 8 tics à 1) : le cœur s'emballe avec lui ;
     *  • à zéro, une explosion grave suivie du buzzer.
     * Pour le départ d'un jeu (« depart »), le zéro devient une fanfare.
     */
    decompte(n, depart) {
      if (!this.pret()) return;
      const c = contexte;
      const t = c.currentTime + 0.01;
      if (n > 0) {
        const hauteur = { 3: 660, 2: 880, 1: 1175 }[n] || 660;
        grosseCaisse(t, 1, sortie, 170);
        bruit(t, 0.09, 'highpass', 5000, 0.35);
        tonalite(t, hauteur, 0.2, 'square', 0.22, hauteur * 1.5);
        tonalite(t, hauteur / 2, 0.25, 'sawtooth', 0.12, hauteur * 0.75);
        const tics = { 3: 2, 2: 4, 1: 8 }[n] || 2;
        for (let k = 1; k < tics; k++) {
          const tk = t + k / tics;
          tonalite(tk, 1800 + k * 120 + (3 - n) * 300, 0.035, 'square', 0.13);
          bruit(tk, 0.04, 'highpass', 7000, 0.18);
          if (n === 1 && k % 2 === 0) grosseCaisse(tk, 0.5, sortie, 120);
        }
      } else if (depart) {
        // La fanfare du départ : un accord qui grimpe, une grosse caisse, et c'est parti !
        grosseCaisse(t, 1, sortie, 180);
        bruit(t, 0.5, 'highpass', 6000, 0.25);
        [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => {
          tonalite(t + k * 0.08, f, 0.32, 'square', 0.14);
          tonalite(t + k * 0.08, f / 2, 0.32, 'sawtooth', 0.08);
        });
        tonalite(t + 0.34, 1046.5, 0.6, 'triangle', 0.3);
        tonalite(t + 0.34, 1318.5, 0.6, 'triangle', 0.22);
      } else {
        // Temps écoulé : l'explosion, puis le buzzer qui grince.
        grosseCaisse(t, 1, sortie, 90);
        bruit(t, 0.7, 'lowpass', 900, 0.6);
        tonalite(t + 0.02, 185, 0.75, 'sawtooth', 0.26);
        tonalite(t + 0.02, 196, 0.75, 'sawtooth', 0.22);
        tonalite(t + 0.02, 92, 0.75, 'square', 0.16);
      }
    }
  };

  /*
   * ════════════════════════════════════════════════════════════════════
   *  LA MUSIQUE DE LA GUERRE DES NEURONES (composée pour le jeu)
   * ════════════════════════════════════════════════════════════════════
   *
   *  Une vraie chanson de jeu, avec sa mélodie à elle (originale : aucun
   *  morceau existant n'est copié), que la tablette joue en direct.
   *  Elle est construite comme un tube, en parties qui s'enchaînent :
   *
   *    INTRO (4 mesures)    la batterie et la basse s'installent, le son
   *                         s'ouvre peu à peu ;
   *    REFRAIN (8)          la mélodie principale, celle qu'on fredonne :
   *                         « ta-ta ta-TAM… ta-ta ta-TAAM » ;
   *    COUPLET (8)          des arpèges qui cavalent, claquements de mains ;
   *    REFRAIN+ (8)         la mélodie une octave plus haut, avec une
   *                         deuxième voix en dessous : ça décolle ;
   *    PONT (4)             la batterie se tait, une montée de souffle,
   *                         un roulement qui accélère… et tout repart.
   *
   *  À chaque tour complet, la chanson MONTE D'UN TON (comme les fins de
   *  chansons qui s'envolent), pour que la soirée ne tourne jamais en rond.
   *  Pendant la Grande Finale, elle accélère et monte encore.
   *
   *  Les accords : la mineur, fa, do, sol (le quatuor des tubes pop).
   *  Les notes sont écrites en numéros « MIDI » (60 = do du milieu du
   *  piano, +1 = un demi-ton plus haut) : transposer, c'est ajouter.
   *
   *  Le « chef d'orchestre » regarde un peu en avance (0,4 s) et programme
   *  les notes à l'avance : la musique reste régulière même si la tablette
   *  est occupée. Trois volumes : normal, doux (pendant que l'on réfléchit)
   *  et muet (blind test, Feu vert !).
   */
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const PROGRESSION = [            // basse, puis l'accord (en MIDI)
    { basse: 45, accord: [57, 60, 64] },   // la mineur
    { basse: 41, accord: [57, 60, 65] },   // fa
    { basse: 48, accord: [55, 60, 64] },   // do
    { basse: 43, accord: [55, 59, 62] }    // sol
  ];
  // Le refrain : 8 mesures de 8 croches (null = silence ; la note dure jusqu'à la suivante).
  const REFRAIN = [
    [76, null, 76, 79, null, 81, null, 79],
    [77, null, 76, null, 72, null, 74, null],
    [76, null, 76, 79, null, 84, null, 83],
    [81, null, 79, null, 74, null, null, null],
    [76, null, 76, 79, null, 81, null, 79],
    [77, null, 81, null, 84, null, 81, null],
    [79, null, 76, null, 79, null, 84, null],
    [83, null, 86, null, 83, null, 81, 79]
  ];
  const PLAN = [                   // les parties de la chanson, en mesures
    { nom: 'refrain', mesures: 8 },
    { nom: 'couplet', mesures: 8 },
    { nom: 'refrain+', mesures: 8 },
    { nom: 'pont', mesures: 4 }
  ];
  const TOUR = PLAN.reduce((n, p) => n + p.mesures, 0);   // 28 mesures
  const INTRO = 4;
  const VOLUMES = { normal: 1.0, doux: 0.38, muet: 0 };

  let gainAmbiance = null;         // le volume général de la musique
  let filtre = null;               // l'adoucisseur commun (basse, nappes)
  let busMelodie = null;           // la mélodie, avec son écho
  let joue = false;
  let veutJouer = false;
  let niveauVoulu = 'normal';
  let enFinale = false;
  let prochainTemps = 0;
  let pas = 0;                     // le numéro de croche depuis le début
  let horloge = null;

  const tempo = () => (enFinale ? 134 : 122);
  const croche = () => 30 / tempo();

  function noteDouce(f, debut, duree, forme, volume, attaque, vers) {
    const c = contexte;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = forme;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, debut);
    g.gain.exponentialRampToValueAtTime(volume, debut + (attaque || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
    o.connect(g).connect(vers || filtre);
    o.start(debut);
    o.stop(debut + duree + 0.05);
  }

  /* Une note de la mélodie : deux ondes légèrement désaccordées, pour un son large et brillant. */
  function noteMelodie(midi, t, duree, volume) {
    const f = hz(midi);
    noteDouce(f, t, duree, 'square', volume * 0.5, 0.006, busMelodie);
    noteDouce(f * 1.004, t, duree, 'sawtooth', volume * 0.35, 0.006, busMelodie);
    noteDouce(f * 2, t, Math.min(duree, 0.12), 'sine', volume * 0.25, 0.003, busMelodie); // le petit « tic » d'attaque
  }

  /* La montée du pont : un souffle dont le filtre grimpe pendant « duree » secondes. */
  function montee(t, duree) {
    const c = contexte;
    const src = c.createBufferSource();
    src.buffer = souffle();
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 3;
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(9000, t + duree);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + duree * 0.95);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree + 0.05);
    src.connect(f).connect(g).connect(gainAmbiance);
    src.start(t);
    src.stop(t + duree + 0.1);
  }

  /* Où en est-on dans la chanson ? (partie, mesure dans la partie, transposition) */
  function ouSommesNous(mesure) {
    if (mesure < INTRO) return { nom: 'intro', m: mesure, ton: 0 };
    const k = mesure - INTRO;
    const tour = Math.floor(k / TOUR);
    let r = k % TOUR;
    let partie = PLAN[0];
    for (const p of PLAN) { if (r < p.mesures) { partie = p; break; } r -= p.mesures; }
    // Un ton de plus à chaque tour (0, +1, +2, +3, puis on repart), et +2 en Grande Finale.
    return { nom: partie.nom, m: r, ton: (tour % 4) + (enFinale ? 2 : 0), derniere: r === partie.mesures - 1 };
  }

  /* Programme une croche de musique à l'instant « t ». */
  function jouerCroche(t) {
    const mesure = Math.floor(pas / 8);
    const pos = pas % 8;
    const ici = ouSommesNous(mesure);
    const ton = ici.ton;
    const grille = PROGRESSION[ici.m % 4];
    const dc = croche();
    const fort = ici.nom === 'refrain+' || enFinale;

    // ── La batterie ──
    if (ici.nom !== 'pont') {
      if (pos % 2 === 0) grosseCaisse(t, ici.nom === 'intro' ? 0.35 : 0.5, gainAmbiance);                 // les 4 temps : le cœur qui bat
      if (ici.nom !== 'intro' && (pos === 2 || pos === 6)) bruit(t, 0.14, 'bandpass', 1500, fort ? 0.3 : 0.24, gainAmbiance); // claquements sur 2 et 4
      if (pos % 2 === 1) bruit(t, 0.09, 'highpass', 7000, 0.1, gainAmbiance);                              // charleston ouvert, à contretemps
      if (ici.nom === 'couplet' || fort) bruit(t + dc / 2, 0.025, 'highpass', 9000, 0.05, gainAmbiance);   // doubles croches : ça galope
      if (ici.derniere && pos >= 6) bruit(t + dc / 2, 0.07, 'bandpass', 2400, 0.2, gainAmbiance);          // petit roulement de fin de partie
    } else {
      // Le pont : plus de grosse caisse… une montée de souffle, puis un roulement qui accélère.
      if (ici.m === 0 && pos === 0) montee(t, dc * 8 * 4);
      if (ici.m === 3) { const n = pos < 4 ? 1 : 2; for (let k = 0; k < n; k++) bruit(t + (k * dc) / n, 0.06, 'bandpass', 1800 + pos * 200, 0.12 + pos * 0.025, gainAmbiance); }
    }

    // ── La basse : croches qui pompent, l'octave sur les contretemps ──
    if (ici.nom !== 'pont' || ici.m >= 2) {
      const b = hz(grille.basse + ton) * (pos % 2 === 1 ? 2 : 1);
      noteDouce(b, t, dc * 0.85, 'triangle', ici.nom === 'intro' ? 0.28 : 0.36, 0.004);
      noteDouce(b, t, dc * 0.6, 'sawtooth', 0.05, 0.004);
    }

    // ── Les accords : une nappe au début de la mesure, et des « stabs » à contretemps ──
    if (pos === 0) grille.accord.forEach((n) => noteDouce(hz(n + ton), t, dc * 8, 'triangle', ici.nom === 'pont' ? 0.07 : 0.035, 0.12));
    if (ici.nom !== 'intro' && ici.nom !== 'pont' && (pos === 3 || pos === 7)) grille.accord.forEach((n) => noteDouce(hz(n + 12 + ton), t, dc * 0.5, 'sawtooth', 0.018, 0.004));

    // ── La mélodie ──
    if (ici.nom === 'refrain' || ici.nom === 'refrain+') {
      const ligne = REFRAIN[ici.m];
      const note = ligne[pos];
      if (note !== null) {
        let fin = pos + 1;
        while (fin < 8 && ligne[fin] === null) fin++;
        const duree = (fin - pos) * dc * 0.92;
        if (ici.nom === 'refrain') noteMelodie(note + ton, t, duree, 0.16);
        else {
          noteMelodie(note + 12 + ton, t, duree, 0.12);           // une octave plus haut…
          noteMelodie(note - 4 + ton, t, duree, 0.07);            // … avec une deuxième voix en dessous
        }
      }
    } else if (ici.nom === 'couplet') {
      // Des arpèges qui montent et descendent dans l'accord, et un rappel du refrain toutes les 4 mesures.
      if (ici.m % 4 === 3) {
        const note = REFRAIN[0][pos];
        if (note !== null) noteMelodie(note + ton, t, dc * 1.8, 0.13);
      } else {
        const motif = [0, 1, 2, 3, 2, 1, 2, 3];
        const tons = grille.accord.concat([grille.accord[0] + 12]);
        noteMelodie(tons[motif[pos]] + 12 + ton, t, dc * 0.7, 0.09);
      }
    } else if (ici.nom === 'pont' && pos === 0 && ici.m < 3) {
      noteMelodie(REFRAIN[3][0] + ton, t, dc * 6, 0.07);           // une note tenue, en suspens
    }
    pas++;
  }

  function chefDOrchestre() {
    if (!joue || !contexte) return;
    while (prochainTemps < contexte.currentTime + 0.4) {
      jouerCroche(prochainTemps);
      prochainTemps += croche();
    }
  }

  function appliquerVolume() {
    if (!gainAmbiance) return;
    const t = contexte.currentTime;
    gainAmbiance.gain.cancelScheduledValues(t);
    gainAmbiance.gain.setTargetAtTime(VOLUMES[niveauVoulu] || 0, t, 0.6);
  }

  GT.ambiance = {
    /* Mettre la musique en route (elle attend sagement que le son soit débloqué). */
    demarrer() {
      veutJouer = true;
      const c = preparer();
      if (enSilence) return;           // blind test en cours : on reprendra après
      if (!c || c.state !== 'running' || joue) { if (joue) appliquerVolume(); return; }
      if (!gainAmbiance) {
        gainAmbiance = c.createGain();
        gainAmbiance.gain.value = 0;
        gainAmbiance.connect(sortie);
        filtre = c.createBiquadFilter();
        filtre.type = 'lowpass';
        filtre.frequency.value = 3600;
        filtre.connect(gainAmbiance);
        // La mélodie a son propre chemin : un filtre, puis un écho à la croche pointée qui lui donne de l'ampleur.
        busMelodie = c.createBiquadFilter();
        busMelodie.type = 'lowpass';
        busMelodie.frequency.value = 5200;
        const echo = c.createDelay(1);
        echo.delayTime.value = croche() * 1.5;
        const retour = c.createGain(); retour.gain.value = 0.28;
        const mixEcho = c.createGain(); mixEcho.gain.value = 0.3;
        busMelodie.connect(gainAmbiance);
        busMelodie.connect(echo); echo.connect(retour).connect(echo); echo.connect(mixEcho).connect(gainAmbiance);
      }
      joue = true;
      pas = 0;                       // chaque démarrage repart de l'intro
      prochainTemps = c.currentTime + 0.1;
      horloge = setInterval(chefDOrchestre, 100);
      appliquerVolume();
    },
    arreter() {
      veutJouer = false;
      if (!joue) return;
      joue = false;
      clearInterval(horloge);
      if (gainAmbiance) gainAmbiance.gain.setTargetAtTime(0, contexte.currentTime, 0.3);
    },
    /* « normal », « doux » ou « muet ». */
    niveau(n) {
      niveauVoulu = n;
      if (joue) appliquerVolume();
    },
    /* La Grande Finale : la musique accélère et monte de deux tons. */
    finale(oui) { enFinale = !!oui; },
    /* La mise en veille du blind test : on arrête de programmer des notes, sans oublier qu'on voulait jouer. */
    suspendre() {
      if (!joue) return;
      joue = false;
      clearInterval(horloge);
    },
    /* Appelé juste après le déblocage du son (ou le réveil) : si l'on attendait pour jouer, on joue. */
    reprendre() { if (veutJouer && !joue) this.demarrer(); },
    enCours() { return joue; }
  };
})();
