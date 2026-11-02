/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Mots croisés ✏️
 * ════════════════════════════════════════════════════════════════════
 *
 *  Une définition, comme dans une grille de mots croisés, et les cases
 *  du mot à trouver : la première lettre est donnée, les autres sont
 *  des « ? ». Les quatre propositions ont toutes la même première lettre
 *  et le même nombre de lettres : seule la définition permet de trouver.
 *  Les définitions sont dans moteur/contenus/enigmes.js (liste MOTS).
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/motscroises', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const { MOTS } = exiger('../contenus/enigmes');

  const NB_MOTS = 8;

  class MotsCroises extends JeuQCM {
    constructor(ctx) {
      const tirage = outils.tirerNeuf('motscroises', MOTS, NB_MOTS, (m) => m[1]);
      const questions = tirage.map(([def, mot, ...leurres]) => ({
        question: def,
        choix: [mot, ...leurres],
        mot,
        illustration: { mot: true, lignes: [[mot[0], ...Array(mot.length - 1).fill('?')]] }
      }));
      super(ctx, { questions, dureeMs: 18000, revelationMs: 5500, pointsBase: 300, bonusVitesse: 700 });
    }
    vueTablette(q) { return { intitule: q.question + ' (' + q.mot.length + ' lettres)', surtitre: '✏️ Mots croisés', illustration: q.illustration }; }
    vueRevelation(q) { return { intitule: q.question, surtitre: '✏️ Mots croisés', illustration: { mot: true, lignes: [q.mot.split('')] } }; }
    consigneJoueur() { return 'Quel mot va dans la grille ?'; }
    explication(q) { return { titre: 'Le mot était : ' + q.mot, texte: '' }; }
  }

  MotsCroises.fiche = {
    id: 'motscroises',
    nom: 'Mots croisés',
    icone: '✏️',
    resume: 'Une définition, des cases, une première lettre : quel mot va dans la grille ?',
    regle: 'Lisez la définition : le mot commence par la lettre affichée et compte autant de lettres que de cases. Les quatre propositions se ressemblent… choisissez la bonne !'
  };

  return MotsCroises;
});
