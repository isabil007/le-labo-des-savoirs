/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Drapeaux du monde 🚩
 * ════════════════════════════════════════════════════════════════════
 *
 *  Un drapeau s'affiche en grand sur la tablette et sur les téléphones :
 *  à quel pays appartient-il ? Huit drapeaux par partie, des plus connus
 *  (la Belgique, le Japon…) aux plus trompeurs (le Tchad ou la Roumanie ?
 *  le Mali ou le Sénégal ?). Les mauvaises réponses sont choisies parmi
 *  les drapeaux qui partagent le plus de couleurs avec le bon : pas de
 *  réponse évidente par élimination.
 *
 *  Les drapeaux sont dessinés par le jeu lui-même (contenus/drapeaux.js).
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/drapeaux', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const DRAPEAUX = exiger('../contenus/drapeaux');

  const NB_DRAPEAUX = 8;

  /* Les sosies : les drapeaux qui partagent le plus de couleurs avec celui-ci. */
  function sosies(d) {
    const mes = d.teintes.split(' ');
    const communs = (x) => x.teintes.split(' ').filter((t) => mes.includes(t)).length;
    return outils.melanger(DRAPEAUX.filter((x) => x.pays !== d.pays))
      .sort((a, b) => communs(b) - communs(a))
      .slice(0, 3).map((x) => x.pays);
  }

  class Drapeaux extends JeuQCM {
    constructor(ctx) {
      // Trois drapeaux célèbres pour se mettre en jambes, puis cinq plus coriaces.
      const celebres = outils.tirerNeuf('drapeaux-celebres', DRAPEAUX.filter((d) => d.celebre), 3);
      const autres = outils.tirerNeuf('drapeaux', DRAPEAUX.filter((d) => !d.celebre), NB_DRAPEAUX - celebres.length);
      const questions = [...celebres, ...autres].map((d) => ({
        question: 'À quel pays appartient ce drapeau ?',
        choix: [d.pays, ...sosies(d)],
        drapeau: { l: d.l, h: d.h, formes: d.formes },
        anecdote: d.anecdote || ''
      }));
      super(ctx, { questions, dureeMs: 15000, revelationMs: 6500, pointsBase: 300, bonusVitesse: 700 });
    }
    vueTablette(q) { return { intitule: q.question, surtitre: '🚩 Drapeaux du monde', drapeau: q.drapeau }; }
    consigneJoueur() { return 'Quel pays ?'; }
    explication(q) { return { titre: 'C’est le drapeau : ' + q.choix[q.bonne], texte: q.anecdote }; }
  }

  Drapeaux.fiche = {
    id: 'drapeaux',
    nom: 'Drapeaux du monde',
    icone: '🚩',
    resume: 'À quel pays appartient ce drapeau ? Gare aux sosies : Tchad ou Roumanie ?',
    regle: 'Un drapeau s’affiche : touchez le bon pays sur votre téléphone. Attention, les mauvaises réponses se ressemblent beaucoup !'
  };
  Drapeaux.sosies = sosies; // pour les tests

  return Drapeaux;
});
