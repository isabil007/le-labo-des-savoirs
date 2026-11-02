/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU 5 — Les pièges du français
 * ════════════════════════════════════════════════════════════════════
 *
 *  Sept pièges tirés au hasard : conjugaisons improbables, homonymes
 *  farceurs, fautes que tout le monde commet. On laisse un peu plus de
 *  temps pour lire (25 secondes) et pour rire de la chute (11 secondes),
 *  car la révélation est ici le meilleur moment du jeu : c'est là que
 *  l'on découvre que « vous vous tûtes » est parfaitement correct.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/humour', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const BANQUE = exiger('../contenus/humour');

  class Humour extends JeuQCM {
    constructor(ctx) {
      super(ctx, { questions: outils.tirerNeuf('humour', BANQUE, 7), dureeMs: 25000, revelationMs: 11000, pointsBase: 600, bonusVitesse: 400 });
    }
    vueTablette(q) { return { intitule: q.question, surtitre: q.categorie }; }
    consigneJoueur() { return 'Quelle est la bonne réponse ?'; }
    explication(q) { return { titre: q.chute, texte: q.explication }; }
  }

  Humour.fiche = {
    id: 'humour',
    nom: 'Les pièges du français',
    icone: '🎭',
    resume: 'Conjugaisons qui font sourire, homonymes farceurs et fautes de tous les jours.',
    regle: 'Trouvez la forme correcte. Méfiez-vous : la réponse qui sonne le plus bizarre est souvent la bonne !'
  };

  return Humour;
});
