/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — La mémoire d'éléphant 🐘
 * ════════════════════════════════════════════════════════════════════
 *
 *  Une grille d'objets s'affiche quelques secondes sur la tablette ET sur
 *  chaque téléphone : « Mémorisez ! ». Puis elle disparaît, et vient la
 *  question piège :
 *    • « Lequel n'était PAS sur la table ? »
 *    • « Lequel ÉTAIT sur la table ? »
 *    • « Qu'y avait-il en haut à gauche ? » (ou au centre, en bas à droite…)
 *    • « Combien de 🍎 y avait-il ? »
 *  Au fil des tours, la grille grandit (6, puis 9, puis 12 objets) et le
 *  temps pour la regarder raccourcit. Rien n'est écrit à l'avance : le
 *  moteur fabrique chaque grille et chaque question au hasard, et la
 *  bonne réponse est juste par construction. On peut y jouer mille fois.
 *
 *  Toute la mécanique des réponses (chronomètre, points selon la
 *  rapidité, révélation) vient du moule JeuQCM ; ce fichier ajoute
 *  seulement la phase « Mémorisez ! » avant chaque question.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/memoire', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');

  /* Les objets que l'on pose sur la table : faciles à reconnaître et à nommer. */
  const OBJETS = [
    ['🍎', 'Une pomme'], ['🎈', 'Un ballon'], ['🐱', 'Un chat'], ['🚗', 'Une voiture'], ['⭐', 'Une étoile'],
    ['🌂', 'Un parapluie'], ['🎸', 'Une guitare'], ['🐟', 'Un poisson'], ['🍕', 'Une pizza'], ['🔑', 'Une clé'],
    ['🌻', 'Un tournesol'], ['⚽', 'Un ballon de foot'], ['🎩', 'Un chapeau'], ['📚', 'Des livres'], ['🦆', 'Un canard'],
    ['🍌', 'Une banane'], ['🚲', 'Un vélo'], ['⏰', 'Un réveil'], ['🧦', 'Une chaussette'], ['🥕', 'Une carotte'],
    ['🐌', 'Un escargot'], ['🎁', 'Un cadeau'], ['🍦', 'Une glace'], ['🦋', 'Un papillon'], ['☕', 'Une tasse'], ['🐸', 'Une grenouille']
  ];
  const NB_TOURS = 7;
  // Pour chaque tour : la taille de la grille et le temps pour la regarder.
  const NIVEAUX = [
    { colonnes: 3, lignes: 2, ms: 7000 }, { colonnes: 3, lignes: 2, ms: 6000 },
    { colonnes: 3, lignes: 3, ms: 7000 }, { colonnes: 3, lignes: 3, ms: 6000 }, { colonnes: 3, lignes: 3, ms: 5500 },
    { colonnes: 4, lignes: 3, ms: 7000 }, { colonnes: 4, lignes: 3, ms: 6500 }
  ];
  const libelle = (o) => o[0] + ' ' + o[1];

  /* Les noms des cases, pour les questions « où était… ? ». */
  function nomsDesCases(colonnes, lignes) {
    const noms = {};
    noms[0] = 'en haut à gauche';
    noms[colonnes - 1] = 'en haut à droite';
    noms[(lignes - 1) * colonnes] = 'en bas à gauche';
    noms[lignes * colonnes - 1] = 'en bas à droite';
    if (colonnes % 2 === 1 && lignes % 2 === 1) noms[Math.floor(lignes / 2) * colonnes + Math.floor(colonnes / 2)] = 'au centre';
    return noms;
  }

  /* Fabrique une manche complète : la grille à retenir et la question qui va avec. */
  function fabriquerManche(niveau, type) {
    const n = niveau.colonnes * niveau.lignes;
    let cases, question, bonne, intrus;
    if (type === 'compter') {
      // Un objet est répété 2 à 4 fois, les autres cases sont toutes différentes.
      const [cible, ...autres] = outils.melanger(OBJETS);
      const fois = 2 + Math.floor(Math.random() * 3);
      cases = outils.melanger([...Array(fois).fill(cible), ...autres.slice(0, n - fois)]);
      question = 'Combien de ' + cible[0] + ' y avait-il ?';
      bonne = String(fois);
      intrus = outils.melanger([fois - 1, fois + 1, fois + 2, fois - 2].filter((x) => x >= 1 && x !== fois)).slice(0, 3).map(String);
    } else {
      const tirage = outils.melanger(OBJETS);
      cases = tirage.slice(0, n);
      const absents = tirage.slice(n);
      if (type === 'absent') {
        const a = absents[0];
        question = 'Lequel n’était PAS sur la table ?';
        bonne = libelle(a);
        intrus = outils.tirer(cases, 3).map(libelle);
      } else if (type === 'present') {
        const p = outils.tirer(cases, 1)[0];
        question = 'Lequel ÉTAIT sur la table ?';
        bonne = libelle(p);
        intrus = absents.slice(0, 3).map(libelle);
      } else {
        const noms = nomsDesCases(niveau.colonnes, niveau.lignes);
        const position = Number(outils.tirer(Object.keys(noms), 1)[0]);
        question = 'Qu’y avait-il ' + noms[position] + ' ?';
        bonne = libelle(cases[position]);
        intrus = outils.tirer(cases.filter((c, i) => i !== position), 3).map(libelle);
      }
    }
    // La grille, ligne par ligne, pour l'affichage.
    const grille = [];
    for (let l = 0; l < niveau.lignes; l++) grille.push(cases.slice(l * niveau.colonnes, (l + 1) * niveau.colonnes).map((o) => o[0]));
    return { question, choix: [bonne, ...intrus], illustration: { lignes: grille, colonnes: niveau.colonnes }, memoMs: niveau.ms };
  }

  class Memoire extends JeuQCM {
    constructor(ctx) {
      // Un mélange de types de questions, jamais deux fois le même d'affilée si possible.
      const types = [];
      const sac = () => outils.melanger(['absent', 'present', 'position', 'compter']);
      while (types.length < NB_TOURS) sac().forEach((t) => { if (types.length < NB_TOURS && t !== types[types.length - 1]) types.push(t); });
      const questions = NIVEAUX.slice(0, NB_TOURS).map((niv, i) => fabriquerManche(niv, types[i]));
      super(ctx, { questions, dureeMs: 15000, revelationMs: 6500, pointsBase: 300, bonusVitesse: 700 });
      this.dejaMontre = -1;
    }

    /*
     * Avant chaque question : la phase « Mémorisez ! ». La grille s'affiche
     * partout pendant quelques secondes, puis la question (sans la grille).
     */
    questionSuivante() {
      const prochaine = this.index + 1;
      if (prochaine >= this.questions.length || this.dejaMontre === prochaine) return super.questionSuivante();
      this.dejaMontre = prochaine;
      this.phase = 'memorisation';
      const q = this.questions[prochaine];
      const finA = Date.now() + q.memoMs;
      const donnees = { illustration: q.illustration, finA, dureeMs: q.memoMs, numero: prochaine + 1, total: this.questions.length };
      this.ctx.ecranTablette('memoire-montre', donnees);
      this.ctx.ecranTousJoueurs('memoire-montre', donnees);
      this.attendre(q.memoMs, () => super.questionSuivante());
    }

    vueTablette(q) { return { intitule: q.question, surtitre: '🐘 Mémoire d’éléphant' }; }
    // À la révélation, on remontre la grille : chacun voit ce qu'il a oublié !
    vueRevelation(q) { return Object.assign(this.vueTablette(q), { illustration: q.illustration }); }
    consigneJoueur() { return 'Fais appel à ta mémoire !'; }
    explication() { return { titre: 'Voici ce qu’il fallait retenir :', texte: '' }; }
  }

  Memoire.fiche = {
    id: 'memoire',
    nom: 'Mémoire d’éléphant',
    icone: '🐘',
    resume: 'Une grille d’objets à mémoriser en quelques secondes… puis la question piège.',
    regle: 'Regardez bien la grille : elle va disparaître ! Ensuite, répondez à la question sur votre téléphone. La grille grandit à chaque tour.'
  };
  Memoire.fabriquerManche = fabriquerManche; // pour les tests
  Memoire.NIVEAUX = NIVEAUX;

  return Memoire;
});
