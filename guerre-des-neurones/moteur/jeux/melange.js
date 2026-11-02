/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Le grand mélange 🔀
 * ════════════════════════════════════════════════════════════════════
 *
 *  Une question de culture générale, puis un drapeau, puis une recette
 *  mystère, une énigme de logique, un zoom infernal, un piège du
 *  français, un tube du blind test… Chaque question est tirée au hasard
 *  dans un thème différent : impossible de savoir ce qui vient ensuite !
 *
 *  Comment c'est fait : le mélange emprunte des questions aux autres jeux
 *  « à choix multiple ». Il fabrique en coulisses une partie de chacun de
 *  ces jeux (sans rien afficher), y prend une ou deux questions au hasard,
 *  et garde pour chacune le jeu d'origine : c'est ce jeu-là qui sait
 *  comment l'afficher (le drapeau, l'image du zoom, les tuiles de la
 *  balance, l'extrait du blind test…). Rien n'est recopié : un nouveau
 *  jeu à choix multiple ajouté demain pourra entrer dans le mélange en
 *  ajoutant simplement son nom à la liste THEMES.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/melange', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');

  // Les jeux à qui l'on emprunte des questions.
  const THEMES = [
    exiger('../jeux/quiz'), exiger('../jeux/humour'), exiger('../jeux/zoom'), exiger('../jeux/logique'),
    exiger('../jeux/drapeaux'), exiger('../jeux/gastronomie'), exiger('../jeux/blindtest'), exiger('../jeux/calcul'),
    exiger('../jeux/enigmes'), exiger('../jeux/motscroises'), exiger('../jeux/puzzle'), exiger('../jeux/vraifarfelu')
  ];
  const NB_QUESTIONS = 8;

  class Melange extends JeuQCM {
    constructor(ctx) {
      // Un ordre de thèmes au hasard, en reprenant au début s'il faut plus de questions que de thèmes.
      const ordre = [];
      while (ordre.length < NB_QUESTIONS) outils.melanger(THEMES).forEach((T) => { if (ordre.length < NB_QUESTIONS && T !== ordre[ordre.length - 1]) ordre.push(T); });
      const sources = new Map();
      const questions = ordre.map((Theme) => {
        if (!sources.has(Theme)) sources.set(Theme, { jeu: new Theme(ctx), pris: 0 });
        const s = sources.get(Theme);
        const q = s.jeu.questions[s.pris++];
        // On remet la bonne réponse en premier : le moule JeuQCM va remélanger les choix.
        const choix = [q.choix[q.bonne], ...q.choix.filter((c, i) => i !== q.bonne)];
        return Object.assign({}, q, { choix, source: s.jeu, theme: Theme.fiche });
      });
      super(ctx, { questions, dureeMs: 22000, revelationMs: 8000, pointsBase: 350, bonusVitesse: 650 });
      this.sources = Array.from(sources.values()).map((s) => s.jeu);
    }

    /* Chaque question est affichée par son jeu d'origine, avec le thème en étiquette. */
    habiller(vue, q) {
      const v = Object.assign({}, vue, { surtitre: '🔀 ' + q.theme.icone + ' ' + q.theme.nom });
      if (v.extrait) v.extrait = Object.assign({}, v.extrait, { numero: this.questions.indexOf(q) });
      return v;
    }
    vueTablette(q) { return this.habiller(q.source.vueTablette(q), q); }
    vueJoueur(q) { return this.habiller(q.source.vueJoueur(q), q); }
    vueRevelation(q) { return this.habiller(q.source.vueRevelation(q), q); }
    consigneJoueur(q) { return q.source.consigneJoueur(q); }
    explication(q) { return q.source.explication(q); }

    /* Le blind test : un extrait introuvable fait simplement passer à la question suivante. */
    signalTablette(d) {
      if (!d || d.type !== 'extrait-indisponible' || this.phase !== 'question' || d.numero !== this.index) return;
      this.annulerMinuteurs();
      this.phase = 'saut';
      this.attendre(800, () => this.questionSuivante());
    }

    arreter() {
      super.arreter();
      this.sources.forEach((s) => s.arreter());
    }
  }

  Melange.fiche = {
    id: 'melange',
    nom: 'Le grand mélange',
    icone: '🔀',
    resume: 'Chaque question vient d’un thème tiré au sort : quiz, drapeau, recette, énigme, calcul, tube…',
    regle: 'Quiz, drapeaux, recettes mystère, énigmes, zoom, blind test… Chaque question change de thème, au hasard. Restez sur vos gardes !'
  };
  Melange.THEMES = THEMES;

  return Melange;
});
