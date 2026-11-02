/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Calcul mental 🧮
 * ════════════════════════════════════════════════════════════════════
 *
 *  Huit calculs, fabriqués par le jeu à chaque partie (ils ne reviennent
 *  donc jamais à l'identique), du plus doux au plus corsé :
 *
 *    • additions et soustractions (avec ou sans retenue) ;
 *    • tables de multiplication ;
 *    • doubles et moitiés ;
 *    • divisions qui tombent juste ;
 *    • le piège des priorités : 3 + 4 × 2 = 11, et non 14 !
 *    • pourcentages simples (10 %, 25 %, 50 % de…) ;
 *    • la monnaie : 3 croissants à 1,20 €, ça fait combien ?
 *
 *  Le calcul s'affiche en grandes tuiles (comme au Casse-tête), sur la
 *  tablette et les téléphones. Les mauvaises réponses ne sont pas tirées
 *  au hasard : ce sont les erreurs que l'on fait vraiment (une retenue
 *  oubliée, les priorités ignorées, les chiffres inversés, ± 10…).
 *
 *  Chaque question garde aussi son calcul « en clair » (champ `verif`),
 *  que le test automatique refait de son côté pour vérifier que la bonne
 *  réponse est vraiment la bonne.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/calcul', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');

  const hasard = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const euros = (centimes) => (centimes / 100).toFixed(2).replace('.', ',') + ' €';

  /* Trois leurres plausibles, tous différents entre eux et de la bonne réponse (nombres entiers positifs). */
  function leurres(bonne, idees) {
    const pris = new Set([bonne]);
    const liste = [];
    const inverse = Number(String(bonne).split('').reverse().join(''));
    [...idees, bonne + 10, bonne - 10, bonne + 1, bonne - 1, inverse, bonne + 2, bonne - 2, bonne + 20]
      .forEach((x) => { if (liste.length < 3 && Number.isInteger(x) && x >= 0 && !pris.has(x)) { pris.add(x); liste.push(x); } });
    return liste;
  }

  /* Une question « calcul en tuiles » : l'opération s'affiche, la réponse est un nombre. */
  function enTuiles(tuiles, bonne, idees, verif, explication) {
    return {
      question: 'Combien font… ?',
      choix: [String(bonne), ...leurres(bonne, idees).map(String)],
      illustration: { lignes: [tuiles.concat(['=', '?']).map(String)] },
      verif, valeur: bonne, explication
    };
  }

  const FABRIQUES = {
    addition(niveau) {
      const a = niveau < 2 ? hasard(12, 49) : hasard(38, 89);
      const b = niveau < 2 ? hasard(11, 39) : hasard(27, 79);
      const somme = a + b;
      // L'erreur classique : la retenue oubliée.
      const sansRetenue = Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10 + ((a % 10 + b % 10) % 10);
      return enTuiles([a, '+', b], somme, [sansRetenue], a + '+' + b, a + ' + ' + b + ' = ' + somme + '.');
    },
    soustraction(niveau) {
      const a = niveau < 2 ? hasard(40, 99) : hasard(102, 199);
      const b = hasard(13, Math.min(89, a - 5));
      const diff = a - b;
      // L'erreur classique : soustraire le petit chiffre du grand dans chaque colonne.
      const colonnes = Number(String(a).padStart(3, '0').split('').map((c, i) => Math.abs(Number(c) - Number(String(b).padStart(3, '0')[i]))).join(''));
      return enTuiles([a, '−', b], diff, [colonnes], a + '-' + b, a + ' − ' + b + ' = ' + diff + '.');
    },
    table() {
      const a = hasard(3, 9), b = hasard(4, 9);
      const p = a * b;
      return enTuiles([a, '×', b], p, [a * (b + 1), (a - 1) * b, a + b], a + '*' + b, a + ' fois ' + b + ', c\'est ' + p + '.');
    },
    double() {
      if (Math.random() < 0.5) {
        const n = hasard(13, 49);
        return enTuiles(['2', '×', n], 2 * n, [2 * n - 10, 2 * n + 10], '2*' + n, 'Le double de ' + n + ' : ' + n + ' + ' + n + ' = ' + 2 * n + '.');
      }
      const n = 2 * hasard(16, 49);
      return enTuiles([n, '÷', '2'], n / 2, [n / 2 + 5, n / 2 - 5, n - 2], n + '/2', 'La moitié de ' + n + ' : ' + n / 2 + '.');
    },
    division() {
      const b = hasard(3, 9), q = hasard(4, 12);
      const a = b * q;
      return enTuiles([a, '÷', b], q, [q + 1, q - 1, b], a + '/' + b, a + ' ÷ ' + b + ' = ' + q + ', car ' + b + ' × ' + q + ' = ' + a + '.');
    },
    priorites() {
      const a = hasard(2, 9), b = hasard(2, 6), c = hasard(2, 6);
      const juste = a + b * c;
      const piege = (a + b) * c;   // l'erreur de ceux qui calculent dans l'ordre
      return enTuiles([a, '+', b, '×', c], juste, [piege], a + '+' + b + '*' + c,
        'Attention aux priorités : la multiplication passe d\'abord. ' + b + ' × ' + c + ' = ' + b * c + ', puis + ' + a + ' = ' + juste + '.');
    },
    pourcentage() {
      const genre = outils.tirer([10, 25, 50], 1)[0];
      const n = genre === 10 ? 10 * hasard(3, 25) : genre === 25 ? 4 * hasard(5, 30) : 2 * hasard(11, 60);
      const r = n * genre / 100;
      return {
        question: 'Combien font ' + genre + ' % de ' + n + ' ?',
        choix: [String(r), ...leurres(r, [r * 2, n - r, genre === 25 ? n / 2 : n / 4].filter(Number.isInteger)).map(String)],
        verif: n + '*' + genre + '/100', valeur: r,
        explication: genre === 10 ? '10 %, c\'est diviser par 10 : ' + r + '.' : genre === 25 ? '25 %, c\'est le quart : ' + n + ' ÷ 4 = ' + r + '.' : '50 %, c\'est la moitié : ' + r + '.'
      };
    },
    monnaie() {
      const articles = [['croissants', 90, 140], ['baguettes', 110, 160], ['glaces', 180, 300], ['cartes postales', 70, 150], ['pommes', 40, 80]];
      const [nomArticle, min, max] = outils.tirer(articles, 1)[0];
      const prix = 10 * hasard(min / 10, max / 10);        // en centimes, ronds à 10 centimes
      const n = hasard(3, 5);
      const total = prix * n;
      const faux = [total + prix, total - prix, total + 100, total - 10].filter((x, i, t) => x > 0 && x !== total && t.indexOf(x) === i).slice(0, 3);
      return {
        question: n + ' ' + nomArticle + ' à ' + euros(prix) + ' pièce : combien faut-il payer ?',
        choix: [euros(total), ...faux.map(euros)],
        verif: n + '*' + prix, valeur: total, enCentimes: true,
        explication: n + ' × ' + euros(prix) + ' = ' + euros(total) + '.'
      };
    }
  };

  /* Le programme d'une partie : on commence en douceur, on finit par les pièges. */
  function programme() {
    const debut = outils.melanger(['addition', 'table', 'double']);
    const milieu = outils.melanger(['soustraction', 'division', 'pourcentage']);
    const fin = outils.melanger(['priorites', 'monnaie']);
    return [...debut, ...milieu, ...fin];
  }

  class Calcul extends JeuQCM {
    constructor(ctx) {
      const questions = programme().map((genre, i) => Object.assign({ genre }, FABRIQUES[genre](i < 3 ? 1 : 2)));
      super(ctx, { questions, dureeMs: 15000, revelationMs: 6000, pointsBase: 300, bonusVitesse: 700 });
    }
    vueTablette(q) { return { intitule: q.question, surtitre: '🧮 Calcul mental', illustration: q.illustration || null }; }
    consigneJoueur() { return 'Calcule de tête… vite !'; }
    explication(q) { return { titre: 'La réponse : ' + q.choix[q.bonne], texte: q.explication }; }
  }

  Calcul.fiche = {
    id: 'calcul',
    nom: 'Calcul mental',
    icone: '🧮',
    resume: 'Additions, tables, pourcentages, monnaie… et le piège des priorités !',
    regle: 'Un calcul s\'affiche : touchez le bon résultat sur votre téléphone, sans papier ni calculette. Attention aux pièges : la multiplication passe avant l\'addition !'
  };
  Calcul.FABRIQUES = FABRIQUES; // pour les tests

  return Calcul;
});
