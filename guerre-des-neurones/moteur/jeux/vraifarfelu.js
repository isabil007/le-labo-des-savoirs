/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Vrai ou Farfelu ? 🤡
 * ════════════════════════════════════════════════════════════════════
 *
 *  Quatre affirmations plus folles les unes que les autres… mais UNE
 *  seule est vraie ! (Oui, les wombats font vraiment des crottes en
 *  forme de cube.) Le thème qui fait rire et qui apprend quelque chose.
 *  Les affirmations sont dans moteur/contenus/enigmes.js (liste FARFELU).
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/vraifarfelu', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const { FARFELU } = exiger('../contenus/enigmes');

  const NB_QUESTIONS = 7;
  const RIRES = ['Incroyable mais vrai !', 'Eh oui, c’est la vérité !', 'Personne n’y croit… et pourtant !', 'Véridique, promis juré !'];

  class VraiFarfelu extends JeuQCM {
    constructor(ctx) {
      const questions = outils.tirerNeuf('farfelu', FARFELU, NB_QUESTIONS, (f) => f[0])
        .map((f) => ({ question: 'Une seule de ces affirmations est VRAIE : laquelle ?', choix: f.slice() }));
      super(ctx, { questions, dureeMs: 22000, revelationMs: 7000, pointsBase: 350, bonusVitesse: 650 });
    }
    vueTablette(q) { return { intitule: q.question, surtitre: '🤡 Vrai ou Farfelu ?' }; }
    consigneJoueur() { return 'Trois sont inventées… laquelle est vraie ?'; }
    explication(q) { return { titre: outils.tirer(RIRES, 1)[0], texte: 'Les trois autres ? Complètement inventées… et farfelues !' }; }
  }

  VraiFarfelu.fiche = {
    id: 'vraifarfelu',
    nom: 'Vrai ou Farfelu ?',
    icone: '🤡',
    resume: 'Quatre affirmations délirantes, une seule est vraie. Les wombats font-ils des crottes carrées ?',
    regle: 'Quatre phrases s’affichent : trois sont inventées de toutes pièces, une seule est vraie (même si elle paraît folle !). Touchez celle que vous croyez vraie.'
  };

  return VraiFarfelu;
});
