/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Casse-tête 🧩 (le jeu de logique)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Quatre familles d'énigmes, toutes FABRIQUÉES par le moteur au moment
 *  de jouer (aucune liste à apprendre par cœur, aucune énigme deux fois
 *  pareille) :
 *
 *   • La suite logique : 3, 7, 11, 15, ?  —  2, 6, 18, 54, ?  —  1, 4, 9, 16, ?
 *   • Le motif à compléter : 🔴 🔵 🔴 🔵 🔴 ?  —  ⭐ ⭐ 🌙 ⭐ ⭐ ?
 *   • La balance (des équations en images) :
 *         🍎 + 🍎 = 10
 *         🍎 + 🍌 = 8
 *         🍌 = ?
 *   • L'intrus : 🐶 🐱 🐰 🚗 — lequel n'est pas comme les autres ?
 *
 *  Chaque énigme est construite à partir de sa solution : la bonne réponse
 *  est donc toujours juste, et les mauvaises réponses sont choisies pour
 *  être vraisemblables (le résultat d'une règle voisine, un voisin du bon
 *  nombre…). La difficulté monte doucement au fil des 7 énigmes.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/logique', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');

  const NB_ENIGMES = 7;
  const hasard = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  /* Trois intrus numériques plausibles et tous différents de la bonne réponse. */
  function leurresNombres(bonne, idees) {
    const pris = new Set([bonne]);
    const leurres = [];
    [...idees, bonne + 1, bonne - 1, bonne + 2, bonne - 2, bonne + 10, bonne * 2]
      .forEach((x) => { if (leurres.length < 3 && Number.isInteger(x) && x >= 0 && !pris.has(x)) { pris.add(x); leurres.push(x); } });
    return leurres.map(String);
  }

  /* ─── 1. La suite logique ─── */
  function suite(difficulte) {
    const regles = [
      () => { const d = hasard(2, 9), a = hasard(1, 12); return { termes: [0, 1, 2, 3, 4].map((i) => a + i * d), suivant: a + 5 * d, voisins: [a + 5 * d + 1, a + 4 * d + d - 1, a + 6 * d], explication: 'On ajoute ' + d + ' à chaque fois.' }; },
      () => { const d = hasard(2, 7), a = hasard(40, 70); return { termes: [0, 1, 2, 3, 4].map((i) => a - i * d), suivant: a - 5 * d, voisins: [a - 5 * d - 1, a - 6 * d, a - 4 * d], explication: 'On retire ' + d + ' à chaque fois.' }; },
      () => { const r = hasard(2, 3), a = hasard(1, 3); return { termes: [0, 1, 2, 3].map((i) => a * Math.pow(r, i)), suivant: a * Math.pow(r, 4), voisins: [a * Math.pow(r, 3) + a * Math.pow(r, 2), a * Math.pow(r, 3) * (r + 1)], explication: 'On multiplie par ' + r + ' à chaque fois.' }; },
      () => { const a = hasard(1, 3); return { termes: [0, 1, 2, 3, 4].map((i) => (a + i) * (a + i)), suivant: (a + 5) * (a + 5), voisins: [(a + 5) * (a + 5) - 1, (a + 4) * (a + 4) + 2 * (a + 4)], explication: 'Ce sont les carrés : ' + a + '×' + a + ', ' + (a + 1) + '×' + (a + 1) + '…' }; },
      () => { const a = hasard(1, 4), b = hasard(1, 5); const t = [a, b]; while (t.length < 6) t.push(t[t.length - 1] + t[t.length - 2]); return { termes: t.slice(0, 5), suivant: t[5], voisins: [t[4] + t[2], t[4] * 2], explication: 'Chaque nombre est la somme des deux précédents.' }; },
      () => { const a = hasard(1, 10); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + i); return { termes: t.slice(0, 5), suivant: t[5], voisins: [t[4] + 4, t[4] + 6], explication: 'On ajoute 1, puis 2, puis 3, puis 4… (l’écart grandit de 1).' }; },
      () => { const p = hasard(3, 6), m = hasard(1, p - 1), a = hasard(1, 10); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + (i % 2 ? p : -m)); return { termes: t.slice(0, 5), suivant: t[5], voisins: [t[4] - m, t[4] + p - m + 1], explication: 'On ajoute ' + p + ', puis on retire ' + m + ', et ainsi de suite.' }; }
    ];
    // Les règles simples d'abord, les plus retorses ensuite.
    const choisie = difficulte < 2 ? regles[hasard(0, 1)] : difficulte < 4 ? regles[hasard(0, 3)] : regles[hasard(2, 6)];
    const s = choisie();
    return {
      question: 'Quel nombre vient ensuite ?',
      choix: [String(s.suivant), ...leurresNombres(s.suivant, s.voisins)],
      illustration: { lignes: [[...s.termes.map(String), '?']] },
      explication: s.explication
    };
  }

  /* ─── 2. Le motif à compléter ─── */
  const SYMBOLES = ['🔴', '🔵', '🟡', '🟢', '⭐', '🌙', '❤️', '🍀', '🔺', '🟪'];
  function motif(difficulte) {
    const gabarits = difficulte < 3 ? ['AB', 'AAB', 'ABC'] : ['AABB', 'ABAC', 'ABCB', 'AABC', 'ABBC'];
    const gabarit = outils.tirer(gabarits, 1)[0];
    const lettres = Array.from(new Set(gabarit));
    const symboles = outils.tirer(SYMBOLES, lettres.length + 1);
    const carte = {};
    lettres.forEach((l, i) => { carte[l] = symboles[i]; });
    const longueur = Math.max(7, gabarit.length * 2 + 1);
    const sequence = Array.from({ length: longueur + 1 }, (_, i) => carte[gabarit[i % gabarit.length]]);
    const bonne = sequence[longueur];
    const autres = [...new Set(lettres.map((l) => carte[l]).concat(symboles[lettres.length]).filter((x) => x !== bonne))];
    const leurres = outils.melanger(autres).concat(outils.tirer(SYMBOLES.filter((x) => x !== bonne && !autres.includes(x)), 3)).slice(0, 3);
    return {
      question: 'Quel symbole complète la suite ?',
      choix: [bonne, ...leurres],
      illustration: { lignes: [[...sequence.slice(0, longueur), '?']] },
      explication: 'Le motif « ' + gabarit.split('').map((l) => carte[l]).join(' ') + ' » se répète.'
    };
  }

  /* ─── 3. La balance (des équations en images) ─── */
  const FRUITS = ['🍎', '🍌', '🍐', '🍓', '🍊', '🍇', '🥝', '🍒'];
  function balance(difficulte) {
    const [x, y, z] = outils.tirer(FRUITS, 3);
    const a = hasard(2, 9);
    let b = hasard(1, 9); while (b === a) b = hasard(1, 9);
    if (difficulte < 3) {
      // Deux lignes : x + x = 2a ; x + y = a + b ; y = ?
      return {
        question: 'Combien vaut ' + y + ' ?',
        choix: [String(b), ...leurresNombres(b, [a, a + b, 2 * a - b])],
        illustration: { lignes: [[x, '+', x, '=', String(2 * a)], [x, '+', y, '=', String(a + b)], [y, '=', '?']] },
        explication: x + ' vaut ' + a + ' (car ' + a + ' + ' + a + ' = ' + 2 * a + '), donc ' + y + ' vaut ' + (a + b) + ' − ' + a + ' = ' + b + '.'
      };
    }
    // Trois lignes : x+x+x = 3a ; x + y = a+b ; y + z = b+c ; z = ?
    let c = hasard(1, 9); while (c === a || c === b) c = hasard(1, 9);
    return {
      question: 'Combien vaut ' + z + ' ?',
      choix: [String(c), ...leurresNombres(c, [b, a, b + c])],
      illustration: { lignes: [[x, '+', x, '+', x, '=', String(3 * a)], [x, '+', y, '=', String(a + b)], [y, '+', z, '=', String(b + c)], [z, '=', '?']] },
      explication: x + ' = ' + a + ', donc ' + y + ' = ' + b + ', donc ' + z + ' = ' + (b + c) + ' − ' + b + ' = ' + c + '.'
    };
  }

  /* ─── 4. L'intrus ─── */
  const FAMILLES = {
    'des animaux': ['🐶', '🐱', '🐰', '🐻', '🦊', '🐷', '🐮', '🐵'],
    'des fruits': ['🍎', '🍌', '🍐', '🍓', '🍊', '🍇', '🍒', '🍍'],
    'des véhicules': ['🚗', '🚲', '🚌', '✈️', '🚂', '🚁', '⛵', '🛵'],
    'des instruments de musique': ['🎸', '🎹', '🥁', '🎺', '🎻', '🎷'],
    'la météo': ['☀️', '🌧️', '❄️', '⛈️', '🌈', '🌪️', '🌤️'],
    'des sports': ['⚽', '🏀', '🎾', '🏐', '🏈', '🏓', '🥊'],
    'des légumes': ['🥕', '🥦', '🌽', '🥔', '🍆', '🥒', '🧅']
  };
  function intrus() {
    const [famille, autre] = outils.tirer(Object.keys(FAMILLES), 2);
    const membres = outils.tirer(FAMILLES[famille], 4);
    const lIntrus = outils.tirer(FAMILLES[autre], 1)[0];
    const ligne = outils.melanger([...membres, lIntrus]);
    return {
      question: 'Lequel est l’intrus ?',
      choix: [lIntrus, ...outils.tirer(membres, 3)],
      illustration: { lignes: [ligne] },
      explication: 'Tous les autres sont ' + famille + '.'
    };
  }

  class Logique extends JeuQCM {
    constructor(ctx) {
      // Un programme varié : chaque famille d'énigmes revient, dans un ordre surprenant.
      const familles = outils.melanger(['suite', 'motif', 'balance', 'intrus', 'suite', 'balance', 'motif']).slice(0, NB_ENIGMES);
      const questions = familles.map((f, i) => (f === 'suite' ? suite(i) : f === 'motif' ? motif(i) : f === 'balance' ? balance(i) : intrus()));
      super(ctx, { questions, dureeMs: 25000, revelationMs: 8000, pointsBase: 300, bonusVitesse: 700 });
    }
    vueTablette(q) { return { intitule: q.question, surtitre: '🧩 Casse-tête', illustration: q.illustration }; }
    consigneJoueur() { return 'Réfléchis… mais pas trop longtemps !'; }
    explication(q) { return { titre: 'La solution : ' + q.choix[q.bonne], texte: q.explication }; }
  }

  Logique.fiche = {
    id: 'logique',
    nom: 'Casse-tête',
    icone: '🧩',
    resume: 'Suites de nombres, motifs, balances et intrus : des énigmes toujours nouvelles.',
    regle: 'Trouvez la logique cachée : le nombre qui suit, le symbole qui manque, la valeur d’un fruit, ou l’intrus. Plus vous êtes rapide, plus vous gagnez !'
  };
  Logique.fabriquer = { suite, motif, balance, intrus }; // pour les tests

  return Logique;
});
