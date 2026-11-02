/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Dans l'ordre !
 * ════════════════════════════════════════════════════════════════════
 *
 *  La tablette affiche des étapes mélangées (le cycle de vie du VIH, les
 *  stades de la syphilis, la cascade 95-95-95…). Chaque joueur les
 *  touche sur son téléphone dans le bon ordre.
 *
 *  Les points :
 *    • 400 points répartis selon le nombre d'étapes bien placées ;
 *    • si tout est juste : 200 points de plus, et jusqu'à 400 points
 *      de bonus de vitesse.
 *  On gagne donc quelque chose même avec un ordre presque juste.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/ordre', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { Jeu } = exiger('../jeux/base');
  const Q = exiger('../contenus/questions');
  const H = exiger('../contenus/histoire');

  const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];

  /* Un moule, deux jeux : la même mécanique sert aux séquences du cours et aux frises historiques. */
  function fabriquer(reglages) {
  class Ordre extends Jeu {
    constructor(ctx) {
      super(ctx);
      this.dureeMs = 40000 * ((ctx && ctx.facteurTemps) || 1);
      this.vitesse = !(ctx && ctx.sansVitesse);
      this.revelationMs = 12000;
      // Chaque séquence : les étapes mélangées, et pour chacune son rang dans le bon ordre.
      this.sequences = outils.tirerFrais(reglages.banque, 4).map((s) => {
        let melange;
        do { melange = outils.melanger(s.etapes.map((texte, rang) => ({ texte, rang }))); }
        while (melange.every((e, i) => e.rang === i)); // jamais déjà dans l'ordre !
        return { consigne: s.consigne, correction: s.correction, solution: s.etapes, etapes: melange };
      });
      this.index = -1;
      this.phase = 'attente';
    }

    demarrer() { this.suivante(); }

    commun() {
      const s = this.sequences[this.index];
      return {
        numero: this.index + 1, total: this.sequences.length, consigne: s.consigne, titre: reglages.titre,
        etapes: s.etapes.map((e, i) => ({ lettre: LETTRES[i], texte: e.texte })),
        finA: this.finA, dureeMs: this.dureeMs
      };
    }

    suivante() {
      this.index++;
      if (this.index >= this.sequences.length) return this.ctx.terminer();
      outils.marquerVue({ consigne: this.sequences[this.index].consigne });
      this.phase = 'question';
      this.reponses = new Map(); // joueurId → { ordre, restantMs }
      this.finA = Date.now() + this.dureeMs;
      this.ctx.ecranTablette('ordre-question', Object.assign(this.commun(), { nbRepondu: 0, nbJoueurs: this.ctx.joueurs().length }));
      this.ctx.ecranTousJoueurs('ordre-choix', this.commun());
      this.attendre(this.dureeMs + 300, () => this.reveler());
    }

    action(joueurId, d) {
      if (!d || d.type !== 'ordre' || this.phase !== 'question' || this.reponses.has(joueurId)) return;
      const n = this.sequences[this.index].etapes.length;
      const ordre = Array.isArray(d.ordre) ? d.ordre.map(Number) : [];
      // On vérifie que c'est bien une permutation complète (chaque étape une fois).
      if (ordre.length !== n || new Set(ordre).size !== n || ordre.some((x) => !(x >= 0 && x < n))) return;
      this.reponses.set(joueurId, { ordre, restantMs: Math.max(0, this.finA - Date.now()) });
      const s = this.sequences[this.index];
      this.ctx.ecranJoueur(joueurId, 'ordre-attente', { ordre: ordre.map((i) => s.etapes[i].texte), finA: this.finA, dureeMs: this.dureeMs });
      this.ctx.evenementTablette('a-repondu', { joueurId, nbRepondu: this.reponses.size, nbJoueurs: this.ctx.joueurs().length });
      if (this.reponses.size >= this.ctx.joueurs().length) this.attendre(600, () => this.reveler());
    }

    reveler() {
      if (this.phase !== 'question') return;
      this.phase = 'revelation';
      this.annulerMinuteurs();
      const s = this.sequences[this.index];
      const n = s.etapes.length;
      const gagnants = [];
      let parfaits = 0;

      this.ctx.joueurs().forEach((j) => {
        const r = this.reponses.get(j.id);
        // Bien placée : l'étape touchée en position p est bien la p-ième de la solution.
        const bienPlaces = r ? r.ordre.filter((iEtape, p) => s.etapes[iEtape].rang === p).length : 0;
        const parfait = bienPlaces === n;
        if (parfait) parfaits++;
        let points = r ? Math.round(400 * bienPlaces / n + (parfait ? 200 + (this.vitesse ? 400 * r.restantMs / this.dureeMs : 0) : 0)) : 0;
        if (points) {
          points = this.ctx.ajouterPoints(j.id, points);
          gagnants.push({ id: j.id, nom: j.nom, avatar: j.avatar, points, parfait });
        }
        if (!parfait) this.ctx.noterErreur(j.id, { question: 'Dans l\'ordre : ' + s.consigne, bonne: s.solution.join(' → '), taReponse: r ? r.ordre.map((i) => s.etapes[i].texte).join(' → ') : null, correction: s.correction });
        this.ctx.ecranJoueur(j.id, 'ordre-resultat', {
          aRepondu: !!r, parfait, bienPlaces, n, points, score: j.score,
          monOrdre: r ? r.ordre.map((i) => ({ texte: s.etapes[i].texte, juste: s.etapes[i].rang === r.ordre.indexOf(i) })) : [],
          solution: s.solution, correction: s.correction
        });
      });

      this.ctx.consigner({ question: 'Dans l\'ordre : ' + s.consigne, bonne: s.solution.join(' → '), correction: s.correction, reussis: parfaits, total: this.ctx.joueurs().length });
      gagnants.sort((a, b) => b.points - a.points);
      this.ctx.ecranTablette('ordre-revelation', {
        numero: this.index + 1, total: this.sequences.length, consigne: s.consigne, titre: reglages.titre,
        solution: s.solution, correction: s.correction, gagnants, parfaits
      });
      if (!this.ctx.manuel) this.attendre(this.revelationMs, () => this.suivante());
    }

    joueurArrive(joueurId) {
      if (this.phase === 'question' && !this.reponses.has(joueurId)) this.ctx.ecranJoueur(joueurId, 'ordre-choix', this.commun());
    }

    passer() {
      if (this.phase === 'question') this.reveler();
      else { this.annulerMinuteurs(); this.suivante(); }
    }
  }

  Ordre.fiche = reglages.fiche;
  return Ordre;
  }

  return [
    fabriquer({
      banque: Q.ordre, titre: 'Dans l\'ordre !',
      fiche: { id: 'ordre', nom: 'Dans l\'ordre !', icone: '🧩', resume: 'Cycle du VIH, stades de la syphilis, cascade 95-95-95 : remettez les étapes en ordre.', regle: 'Les étapes sont mélangées. Touchez-les sur votre téléphone, de la première à la dernière. Chaque étape bien placée rapporte des points.' }
    }),
    fabriquer({
      banque: H.frises, titre: 'La frise du temps',
      fiche: { id: 'frise', nom: 'La frise du temps', icone: '⏳', resume: 'De la syphilis de 1495 à I = I : remettez l\'histoire dans l\'ordre.', regle: 'Des événements de l\'histoire des IST, sans leurs dates. Touchez-les du plus ancien au plus récent : les dates arrivent avec la correction.' }
    })
  ];
});
