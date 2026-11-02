/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU 1 — Le quiz de culture générale
 * ════════════════════════════════════════════════════════════════════
 *
 *  Huit questions, vingt secondes chacune. Le tirage est équilibré :
 *  deux questions « pour les jeunes », deux « pour les aînés », quatre
 *  pour tout le monde. Personne ne reste sur le banc de touche, et
 *  chaque génération aura l'occasion de briller… ou d'être surprise.
 *
 *  Toute la mécanique (affichage, chronomètre, points) vient du moule
 *  JeuQCM : ce fichier ne fait que choisir les questions et décrire
 *  ce que la tablette doit montrer.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/quiz', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const BANQUE = exiger('../contenus/quiz');

  class Quiz extends JeuQCM {
    constructor(ctx) {
      const parPublic = (p) => BANQUE.filter((q) => q.public === p);
      const selection = outils.melanger([
        ...outils.tirerNeuf('quiz-jeunes', parPublic('jeunes'), 2),
        ...outils.tirerNeuf('quiz-aines', parPublic('aînés'), 2),
        ...outils.tirerNeuf('quiz-tous', parPublic('tous'), 4)
      ]);
      super(ctx, { questions: selection, dureeMs: 20000, revelationMs: 9000 });
    }
    vueTablette(q) {
      const etiquette = q.public === 'jeunes' ? 'Question jeunesse' : q.public === 'aînés' ? 'Question sagesse' : q.theme;
      return { intitule: q.question, surtitre: etiquette };
    }
  }

  /* La « fiche d'identité » du jeu, affichée sur la tablette au moment du choix. */
  Quiz.fiche = {
    id: 'quiz',
    nom: 'Le grand quiz',
    icone: '🧠',
    resume: 'Culture générale, une touche belge, des questions pour chaque génération.',
    regle: 'Lisez la question sur la tablette et touchez la bonne couleur sur votre téléphone. Plus vous êtes rapide, plus vous gagnez de points.'
  };

  return Quiz;
});
