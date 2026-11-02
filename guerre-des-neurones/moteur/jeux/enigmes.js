/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Les Énigmes 🕵️
 * ════════════════════════════════════════════════════════════════════
 *
 *  Sept énigmes et questions-pièges par partie (« Le père de Marie a
 *  cinq filles… »). On prend son temps pour lire : 25 secondes. Une fois
 *  la réponse révélée, l'explication montre où était le piège.
 *  Les énigmes sont dans moteur/contenus/enigmes.js.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/enigmes', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const { ENIGMES } = exiger('../contenus/enigmes');

  const NB_ENIGMES = 7;

  class Enigmes extends JeuQCM {
    constructor(ctx) {
      const questions = outils.tirerNeuf('enigmes', ENIGMES, NB_ENIGMES);
      super(ctx, { questions, dureeMs: 25000, revelationMs: 8000, pointsBase: 400, bonusVitesse: 600 });
    }
    vueTablette(q) { return { intitule: q.question, surtitre: '🕵️ Les Énigmes' }; }
    consigneJoueur() { return 'Réfléchis bien… il y a sûrement un piège !'; }
    explication(q) { return { titre: 'La réponse : ' + q.choix[q.bonne], texte: q.explication }; }
  }

  Enigmes.fiche = {
    id: 'enigmes',
    nom: 'Les Énigmes',
    icone: '🕵️',
    resume: 'Devinettes de logique et questions-pièges : « Mais bien sûr ! »',
    regle: 'Une énigme s’affiche : lisez-la bien, il y a presque toujours un piège ! Touchez la bonne réponse sur votre téléphone.'
  };

  return Enigmes;
});
