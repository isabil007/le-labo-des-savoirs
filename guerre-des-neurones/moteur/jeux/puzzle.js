/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Le Puzzle 🖼️
 * ════════════════════════════════════════════════════════════════════
 *
 *  Une image découpée en neuf pièces, toutes mélangées et retournées.
 *  Puis, pièce après pièce, le puzzle se remet en place tout seul :
 *  qui reconnaîtra l'image le premier ? Plus on répond tôt, plus on
 *  gagne. Les images viennent de la banque du Zoom infernal
 *  (moteur/contenus/zoom.js) ; l'animation est dessinée par GT.puzzle
 *  (public/js/commun.js), calée sur le chronomètre.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/puzzle', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const BANQUE = exiger('../contenus/zoom');

  const NB_IMAGES = 7;

  /* Un mélange des 9 cases où aucune pièce ne reste à sa place. */
  function desordre() {
    let ordre;
    do ordre = outils.melanger([0, 1, 2, 3, 4, 5, 6, 7, 8]); while (ordre.some((x, i) => x === i));
    return ordre;
  }

  function fabriquerPuzzle(im) {
    return {
      image: im.image || null, photo: im.photo || null,
      ordre: desordre(),                                            // la pièce i démarre dans la case ordre[i]
      tours: Array.from({ length: 9 }, () => outils.tirer([90, 180, 270, -90], 1)[0]),
      rythme: outils.melanger([0, 1, 2, 3, 4, 5, 6, 7, 8])          // l'ordre dans lequel les pièces se remettent en place
    };
  }

  class Puzzle extends JeuQCM {
    constructor(ctx) {
      const choisies = outils.tirerNeuf('puzzle', BANQUE, NB_IMAGES);
      const questions = choisies.map((im) => {
        const cousins = BANQUE.filter((x) => x.famille === im.famille && x.sujet !== im.sujet);
        const autres = BANQUE.filter((x) => x.famille !== im.famille);
        const leurres = outils.tirer(cousins.length >= 3 ? cousins : cousins.concat(autres), 3).map((x) => x.sujet);
        return { question: 'Quelle image se cache dans ce puzzle ?', sujet: im.sujet, choix: [im.sujet, ...leurres], puzzle: fabriquerPuzzle(im) };
      });
      super(ctx, { questions, dureeMs: 20000, revelationMs: 5500, pointsBase: 200, bonusVitesse: 800 });
    }
    vueTablette(q) { return { intitule: q.question, surtitre: '🖼️ Le Puzzle', puzzle: q.puzzle }; }
    vueRevelation(q) { return { intitule: q.question, surtitre: '🖼️ Le Puzzle', puzzle: Object.assign({}, q.puzzle, { fini: true }) }; }
    consigneJoueur() { return 'Le puzzle se reconstruit… réponds dès que tu reconnais !'; }
    explication(q) { return { titre: 'C’était… ' + q.sujet.toLowerCase() + ' !', texte: '' }; }
  }

  Puzzle.fiche = {
    id: 'puzzle',
    nom: 'Le Puzzle',
    icone: '🖼️',
    resume: 'Neuf pièces mélangées qui se remettent en place : reconnaîtrez-vous l’image avant la fin ?',
    regle: 'Une image découpée en morceaux se reconstruit petit à petit. Touchez la bonne réponse dès que vous la reconnaissez : plus vous êtes rapide, plus vous gagnez !'
  };
  Puzzle.desordre = desordre; // pour les tests

  return Puzzle;
});
