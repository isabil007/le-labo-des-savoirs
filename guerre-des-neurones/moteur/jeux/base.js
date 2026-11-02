/*
 * ════════════════════════════════════════════════════════════════════
 *  LES FONDATIONS COMMUNES À TOUS LES MINI-JEUX
 * ════════════════════════════════════════════════════════════════════
 *
 *  Chaque mini-jeu est une « classe », c'est-à-dire un moule à partir
 *  duquel le moteur fabrique une partie neuve à chaque lancement. Ce
 *  fichier définit deux moules de base dont les vrais jeux héritent :
 *
 *  1. Jeu : le strict minimum. Il sait gérer ses minuteurs (et surtout
 *     les arrêter proprement quand on quitte le jeu, sinon un minuteur
 *     oublié pourrait afficher une question au milieu du jeu suivant !).
 *
 *  2. JeuQCM : le moule des jeux « question à choix multiple ». Le quiz,
 *     le zoom infernal et les pièges du français fonctionnent tous de la
 *     même façon : la tablette pose une question, chaque téléphone
 *     affiche les réponses en grosses touches de couleur, on compte les
 *     points (plus on répond vite, plus on gagne), puis on révèle la
 *     bonne réponse avec une anecdote. Écrire cette mécanique une seule
 *     fois évite de la recopier trois fois… et d'y glisser trois fois
 *     les mêmes erreurs.
 *
 *  LE « CONTEXTE » (ctx) que le moteur confie à chaque jeu
 *  ───────────────────────────────────────────────────────
 *  Un jeu ne parle jamais directement aux appareils : il passe par ce
 *  contexte, une sorte de régisseur de plateau.
 *    ctx.joueurs()                    → la liste des joueurs présents
 *    ctx.joueur(id)                   → un joueur précis
 *    ctx.ecranTablette(type, donnees) → change ce qu'affiche la tablette
 *    ctx.ecranJoueur(id, type, d)     → change l'écran d'un téléphone
 *    ctx.ecranTousJoueurs(type, d)    → change l'écran de tous les téléphones
 *                                       (d peut être une fonction joueur → données,
 *                                        pour personnaliser chaque écran)
 *    ctx.evenementTablette(type, d)   → petite mise à jour sans changer d'écran
 *    ctx.evenementJoueur(id, type, d) → idem pour un téléphone
 *    ctx.ajouterPoints(id, points)    → crédite des points au score général et renvoie
 *                                       le montant réellement crédité (doublé en finale)
 *    ctx.multiplicateur()             → 2 pendant la Grande Finale, 1 sinon
 *    ctx.terminer()                   → « j'ai fini », le moteur affiche le classement
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/base', function (exiger) {
  'use strict';
  const outils = exiger('../outils');

  class Jeu {
    constructor(ctx) {
      this.ctx = ctx;
      this.minuteurs = new Map(); // tous les réveils programmés par ce jeu : minuteur → { tache, echeance }
      this.figeA = null;          // l'heure à laquelle le jeu a été mis en pause (null s'il tourne)
      this.actif = true;          // passe à « faux » dès que le jeu est arrêté
    }

    /*
     * « Dans tant de millisecondes, fais ceci. » On garde une trace de
     * chaque réveil pour pouvoir tous les annuler d'un coup. Et si le jeu
     * a été arrêté entre-temps, la tâche n'est tout simplement pas faite.
     */
    attendre(ms, tache) {
      const minuteur = setTimeout(() => {
        this.minuteurs.delete(minuteur);
        if (this.actif) tache();
      }, ms);
      this.minuteurs.set(minuteur, { tache, echeance: Date.now() + ms });
      return minuteur;
    }

    annulerMinuteurs() {
      this.minuteurs.forEach((v, minuteur) => clearTimeout(minuteur));
      this.minuteurs.clear();
    }

    /*
     * LA PAUSE ⏸ — « figer » arrête tous les réveils en notant combien de
     * temps il leur restait. « relancer » les reprogramme avec ce temps
     * restant, et décale d'autant toutes les heures que le jeu a notées
     * (fin de la question, départ du feu vert…) : pour le jeu, c'est comme
     * si le temps s'était arrêté. Marche pour tous les jeux sans qu'ils
     * aient rien à faire, y compris un jeu qui en contient un autre.
     */
    figer() {
      if (this.figeA) return;
      this.figeA = Date.now();
      this.enAttente = Array.from(this.minuteurs.entries()).map(([minuteur, v]) => { clearTimeout(minuteur); return { tache: v.tache, reste: Math.max(0, v.echeance - this.figeA) }; });
      this.minuteurs.clear();
      if (this.sousJeu && this.sousJeu.figer) this.sousJeu.figer();
    }

    relancer(duree) {
      if (!this.figeA) return 0;
      // La durée de la pause peut être imposée par le moteur, pour que le jeu et les écrans soient décalés d'autant.
      if (typeof duree !== 'number') duree = Date.now() - this.figeA;
      this.figeA = null;
      // Toute heure notée par le jeu (un grand nombre de millisecondes) est décalée de la durée de la pause.
      Object.keys(this).forEach((cle) => { if (typeof this[cle] === 'number' && this[cle] > 1e12) this[cle] += duree; });
      (this.enAttente || []).forEach((r) => this.attendre(r.reste, r.tache));
      this.enAttente = null;
      if (this.sousJeu && this.sousJeu.relancer) this.sousJeu.relancer(duree);
      return duree;
    }

    /* Le moteur appelle « arreter » quand on quitte le jeu, quelle qu'en soit la raison. */
    arreter() {
      this.actif = false;
      this.annulerMinuteurs();
    }

    /* Ce que chaque jeu redéfinit à sa façon : */
    demarrer() {}               // le coup d'envoi
    action(/* joueurId, donnees */) {} // un joueur a touché quelque chose sur son téléphone
    joueurArrive(/* joueurId */) {}    // un joueur arrive (ou revient) en cours de jeu
    joueurParti(/* joueurId */) {}     // un téléphone s'est déconnecté
    passer() { this.ctx.terminer(); }  // l'animateur appuie sur « Passer » sur la tablette
  }

  /* ──────────────────────────────────────────────────────────────── */

  class JeuQCM extends Jeu {
    /*
     * Les réglages possibles :
     *   questions      : la liste des questions, déjà préparées par le jeu
     *   dureeMs        : le temps pour répondre
     *   revelationMs   : le temps pendant lequel la réponse reste affichée
     *   pointsBase     : ce que rapporte une bonne réponse, même à la dernière seconde
     *   bonusVitesse   : le bonus maximal pour une réponse instantanée
     */
    constructor(ctx, reglages) {
      super(ctx);
      this.reglages = Object.assign({ dureeMs: 20000, revelationMs: 9000, pointsBase: 500, bonusVitesse: 500 }, reglages);
      // On mélange l'ordre des réponses de chaque question en retenant où est partie la bonne.
      this.questions = (reglages.questions || []).map((q) => {
        const ordre = outils.melanger(q.choix.map((texte, i) => ({ texte, bonne: i === 0 })));
        return Object.assign({}, q, { choix: ordre.map((c) => c.texte), bonne: ordre.findIndex((c) => c.bonne) });
      });
      this.index = -1;
      this.phase = 'attente';
    }

    demarrer() { this.questionSuivante(); }

    questionSuivante() {
      this.index++;
      if (this.index >= this.questions.length) return this.ctx.terminer();
      const q = this.questions[this.index];
      this.phase = 'question';
      this.reponses = new Map(); // joueurId → { choix, restantMs }
      this.debut = Date.now();
      this.finA = this.debut + this.reglages.dureeMs;
      const commun = { numero: this.index + 1, total: this.questions.length, finA: this.finA, dureeMs: this.reglages.dureeMs };

      // La tablette affiche la question en grand, avec les réponses et le compte à rebours.
      this.ctx.ecranTablette('qcm-question', Object.assign({}, commun, this.vueTablette(q), {
        choix: q.choix, nbRepondu: 0, nbJoueurs: this.ctx.joueurs().length
      }));
      // Les téléphones affichent seulement les touches de couleur : on regarde la tablette, pas son écran.
      // Le téléphone reçoit aussi la question (et l'image du zoom) : on peut jouer sans quitter son écran des yeux.
      this.ctx.ecranTousJoueurs('qcm-choix', Object.assign({}, commun, { choix: q.choix, consigne: this.consigneJoueur(q), vue: this.vueJoueur(q) }));
      this.attendre(this.reglages.dureeMs + 300, () => this.reveler());
    }

    action(joueurId, d) {
      if (!d || d.type !== 'reponse' || this.phase !== 'question') return;
      if (this.reponses.has(joueurId)) return; // une seule réponse par question, pas de repentir !
      const q = this.questions[this.index];
      const choix = Number(d.choix);
      if (!(choix >= 0 && choix < q.choix.length)) return;
      this.reponses.set(joueurId, { choix, restantMs: Math.max(0, this.finA - Date.now()) });
      this.ctx.ecranJoueur(joueurId, 'qcm-attente', { choix, texte: q.choix[choix], finA: this.finA, dureeMs: this.reglages.dureeMs, vue: this.vueJoueur(q) });
      this.ctx.evenementTablette('a-repondu', { joueurId, nbRepondu: this.reponses.size, nbJoueurs: this.ctx.joueurs().length });
      // Si tout le monde a répondu, inutile de faire patienter la tablée.
      if (this.reponses.size >= this.ctx.joueurs().length) this.attendre(600, () => this.reveler());
    }

    reveler() {
      if (this.phase !== 'question') return;
      this.phase = 'revelation';
      this.annulerMinuteurs();
      const q = this.questions[this.index];
      const repartition = q.choix.map(() => 0);
      const gagnants = [];
      const resultats = [];

      this.ctx.joueurs().forEach((j) => {
        const r = this.reponses.get(j.id);
        if (r) repartition[r.choix]++;
        const juste = r && r.choix === q.bonne;
        // Le calcul des points : une base fixe, plus un bonus proportionnel au temps qui restait.
        const bareme = juste ? Math.round(this.reglages.pointsBase + this.reglages.bonusVitesse * (r.restantMs / this.reglages.dureeMs)) : 0;
        // ajouterPoints renvoie ce qui a vraiment été crédité (le double en Grande Finale).
        const points = bareme ? this.ctx.ajouterPoints(j.id, bareme) : 0;
        if (points) {
          gagnants.push({ id: j.id, nom: j.nom, avatar: j.avatar, points });
        }
        resultats.push({ j, juste: !!juste, aRepondu: !!r, points });
      });

      gagnants.sort((a, b) => b.points - a.points);
      // Chaque téléphone reçoit son verdict, l'explication (l'anecdote, la règle de français…)
      // et le trio des plus rapides : tout le contenu de la tablette, en version de poche.
      const explication = this.explication(q);
      const vue = this.vueRevelation(q);
      resultats.forEach(({ j, juste, aRepondu, points }) => {
        const rang = gagnants.findIndex((g) => g.id === j.id);
        this.ctx.ecranJoueur(j.id, 'qcm-resultat', {
          juste, aRepondu, points, bonne: q.bonne, bonneTexte: q.choix[q.bonne], score: j.score,
          intitule: vue.intitule, zoom: vue.zoom || null, illustration: vue.illustration || null, drapeau: vue.drapeau || null, puzzle: vue.puzzle || null, explication, rang: rang >= 0 ? rang + 1 : null,
          plusRapides: gagnants.slice(0, 3).map((g) => ({ nom: g.nom, avatar: g.avatar, points: g.points })),
          numero: this.index + 1, total: this.questions.length
        });
      });
      this.ctx.ecranTablette('qcm-revelation', Object.assign({}, this.vueRevelation(q), {
        numero: this.index + 1, total: this.questions.length,
        choix: q.choix, bonne: q.bonne, repartition, gagnants,
        explication: this.explication(q)
      }));
      this.attendre(this.reglages.revelationMs, () => this.questionSuivante());
    }

    /* Un joueur qui arrive en pleine question peut encore tenter sa chance. */
    joueurArrive(joueurId) {
      if (this.phase !== 'question' || this.reponses.has(joueurId)) return;
      const q = this.questions[this.index];
      this.ctx.ecranJoueur(joueurId, 'qcm-choix', {
        numero: this.index + 1, total: this.questions.length, finA: this.finA, dureeMs: this.reglages.dureeMs,
        choix: q.choix, consigne: this.consigneJoueur(q), vue: this.vueJoueur(q)
      });
    }

    /* « Passer » : pendant la question on révèle tout de suite ; pendant la révélation, on enchaîne. */
    passer() {
      if (this.phase === 'question') this.reveler();
      else { this.annulerMinuteurs(); this.questionSuivante(); }
    }

    /* À personnaliser par chaque jeu : */
    vueTablette(q) { return { intitule: q.question }; }
    // Ce que voient les téléphones pendant la question (par défaut, la même chose que la tablette).
    vueJoueur(q) { return this.vueTablette(q); }
    // Ce que l'on montre au moment de la réponse (par défaut, la même chose que pendant la question).
    vueRevelation(q) { return this.vueTablette(q); }
    consigneJoueur() { return 'Choisis ta réponse'; }
    explication(q) { return { titre: 'Le saviez-vous ?', texte: q.anecdote || '' }; }
  }

  return { Jeu, JeuQCM };
});
