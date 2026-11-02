/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Les Toqués 👨‍🍳 (la gastronomie)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Huit plats au menu, en alternance :
 *
 *   • LA RECETTE MYSTÈRE : les ingrédients apparaissent un à un, toutes
 *     les deux secondes et demie, sur la tablette et les téléphones…
 *     🧂 … 🥓 … 🥚 … 🧀 … 🍝 : « Les spaghettis carbonara ! »
 *     Qui ose répondre dès le deuxième ingrédient gagne gros ; qui attend
 *     le dernier joue la sécurité. Les mauvaises réponses proposées sont
 *     des plats qui partagent des ingrédients avec le bon : le piège est
 *     réel.
 *
 *   • LE QUIZ GOURMAND : des questions de cuisine, belges et du monde.
 *
 *  Les banques sont dans moteur/contenus/gastronomie.js.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/gastronomie', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const { RECETTES, QUIZ } = exiger('../contenus/gastronomie');

  const APPARITION_MS = 2500;

  /* Les plats qui ressemblent le plus au bon (le plus d'ingrédients en commun) font les meilleurs pièges. */
  function platsVoisins(recette) {
    const communs = (r) => r.ingredients.filter((i) => recette.ingredients.includes(i)).length;
    const autres = outils.melanger(RECETTES.filter((r) => r.plat !== recette.plat));
    autres.sort((a, b) => communs(b) - communs(a));
    return autres.slice(0, 3).map((r) => r.plat);
  }

  class Gastronomie extends JeuQCM {
    constructor(ctx) {
      const recettes = outils.tirerNeuf('recettes', RECETTES, 4).map((r) => ({
        type: 'recette', question: 'Quelle est cette recette mystère ?',
        choix: [r.plat, ...platsVoisins(r)], illustration: { lignes: [r.ingredients], apparitionMs: APPARITION_MS }, anecdote: r.anecdote
      }));
      const quiz = outils.tirerNeuf('gastronomie', QUIZ, 4).map((q) => Object.assign({ type: 'quiz' }, q));
      // Une recette, une question, une recette, une question… pour varier le rythme.
      const questions = [];
      recettes.forEach((r, i) => { questions.push(r); questions.push(quiz[i]); });
      super(ctx, { questions, dureeMs: 20000, revelationMs: 8000, pointsBase: 300, bonusVitesse: 700 });
    }
    vueTablette(q) {
      return q.type === 'recette'
        ? { intitule: q.question, surtitre: '👨‍🍳 La recette mystère', illustration: q.illustration }
        : { intitule: q.question, surtitre: '👨‍🍳 Le quiz gourmand' };
    }
    // À la révélation, tous les ingrédients sont visibles d'un coup.
    vueRevelation(q) {
      const v = this.vueTablette(q);
      if (v.illustration) v.illustration = { lignes: v.illustration.lignes };
      return v;
    }
    consigneJoueur(q) { return q.type === 'recette' ? 'Les ingrédients arrivent… ose répondre tôt !' : 'À vos fourneaux !'; }
    explication(q) { return { titre: q.type === 'recette' ? 'C’était… ' + q.choix[q.bonne].toLowerCase() + ' !' : 'Le saviez-vous ?', texte: q.anecdote || '' }; }
  }

  Gastronomie.fiche = {
    id: 'gastronomie',
    nom: 'Les Toqués',
    icone: '👨‍🍳',
    resume: 'Recettes mystère et quiz gourmand : de la gaufre de Liège aux sushis.',
    regle: 'Recette mystère : les ingrédients apparaissent un à un, devinez le plat le plus tôt possible ! Entre deux recettes, une question gourmande.'
  };

  return Gastronomie;
});
