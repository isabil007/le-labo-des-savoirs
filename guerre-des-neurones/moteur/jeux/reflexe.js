/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU 6 — Feu vert ! (le jeu de réflexe)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Chaque téléphone devient un gros bouton. La tablette bat comme un
 *  cœur : « Attention… ». Puis, à un moment imprévisible, TOUT passe au
 *  VERT : il faut taper sur son téléphone le plus vite possible.
 *
 *    • Le plus rapide gagne 500 points, le deuxième 350, le troisième
 *      250, les suivants 150 (s'ils tapent avant la fin du temps).
 *    • Taper AVANT le vert, c'est un FAUX DÉPART : −100 points, et l'on
 *      est éliminé de ce tour.
 *    • De temps en temps, l'écran passe au ROUGE : c'est un PIÈGE !
 *      Celui qui tape sur le rouge fait aussi un faux départ.
 *
 *  Une question d'équité : selon le Wi-Fi, un téléphone reçoit le signal
 *  quelques centièmes de seconde plus tôt ou plus tard qu'un autre. Pour
 *  ne désavantager personne, chaque téléphone chronomètre lui-même le
 *  temps entre l'instant où IL a affiché le vert et le toucher du doigt.
 *  Le moteur vérifie ce temps (il ne peut pas dépasser le temps réel
 *  écoulé, ni être plus court qu'un réflexe humain possible).
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/reflexe', function (exiger) {
  'use strict';
  const { Jeu } = exiger('../jeux/base');

  const NB_TOURS = 7;
  const ATTENTE_MIN = 2000, ATTENTE_MAX = 5500;   // l'attente avant le signal, tirée au hasard
  const PIEGE_MS = 1300;                          // la durée du faux signal rouge
  const FENETRE_MS = 2500;                        // le temps pour taper une fois le vert affiché
  const RESULTAT_MS = 3800;                       // le temps d'affichage des résultats d'un tour
  const REFLEXE_MIN = 90;                         // en dessous de 90 ms, ce n'est pas un réflexe, c'est de l'anticipation !
  const PENALITE = 100;
  const BAREME = [500, 350, 250];
  const POINTS_SUIVANTS = 150;
  const CHANCE_PIEGE = 0.3;

  const hasard = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  class Reflexe extends Jeu {
    constructor(ctx, options) {
      super(ctx);
      // Les réglages de temps peuvent être raccourcis pour les tests automatiques.
      this.t = Object.assign({ attenteMin: ATTENTE_MIN, attenteMax: ATTENTE_MAX, piegeMs: PIEGE_MS, fenetreMs: FENETRE_MS, resultatMs: RESULTAT_MS }, options || Reflexe.reglagesTest || {});
      this.tour = 0;
      this.phase = 'pause';
    }

    demarrer() { this.tourSuivant(); }

    tourSuivant() {
      this.tour++;
      if (this.tour > NB_TOURS) return this.ctx.terminer();
      this.phase = 'attente';
      this.temps = new Map();      // joueurId → réflexe en millisecondes
      this.faux = new Map();       // joueurId → 'avant' | 'piege'
      this.piegeFait = false;
      const commun = { tour: this.tour, total: NB_TOURS };
      this.ctx.ecranTablette('reflexe-attente', commun);
      this.ctx.ecranTousJoueurs('reflexe-bouton', commun);
      this.programmerSignal();
    }

    /* L'attente imprévisible… avec parfois un piège rouge au milieu. */
    programmerSignal() {
      const attente = hasard(this.t.attenteMin, this.t.attenteMax);
      const piege = !this.piegeFait && this.tour > 1 && Math.random() < CHANCE_PIEGE;
      if (piege) {
        this.attendre(Math.round(attente * 0.6), () => this.lancerPiege());
      } else {
        this.attendre(attente, () => this.lancerSignal());
      }
    }

    lancerPiege() {
      this.phase = 'piege';
      this.piegeFait = true;
      this.ctx.evenementTablette('reflexe-piege', {});
      this.ctx.joueurs().forEach((j) => this.ctx.evenementJoueur(j.id, 'reflexe-piege', {}));
      this.attendre(this.t.piegeMs, () => {
        if (this.phase !== 'piege') return;
        this.phase = 'attente';
        this.ctx.evenementTablette('reflexe-calme', {});
        this.ctx.joueurs().forEach((j) => this.ctx.evenementJoueur(j.id, 'reflexe-calme', {}));
        this.attendre(hasard(Math.round(this.t.attenteMin / 2), this.t.attenteMax), () => this.lancerSignal());
      });
    }

    lancerSignal() {
      this.phase = 'go';
      this.depart = Date.now();
      this.ctx.evenementTablette('reflexe-go', {});
      this.ctx.joueurs().forEach((j) => this.ctx.evenementJoueur(j.id, 'reflexe-go', {}));
      this.attendre(this.t.fenetreMs, () => this.finDuTour());
    }

    action(joueurId, d) {
      if (!d || d.type !== 'tape') return;
      if (this.temps.has(joueurId) || this.faux.has(joueurId)) return; // une seule tape par tour
      if (this.phase === 'attente' || this.phase === 'piege') return this.fauxDepart(joueurId, this.phase === 'piege' ? 'piege' : 'avant');
      if (this.phase !== 'go') return;
      const ecoule = Date.now() - this.depart;
      let reflexe = Number(d.reflexe);
      if (!(reflexe >= 0)) reflexe = ecoule;
      reflexe = Math.min(reflexe, ecoule + 60); // jamais plus rapide que le temps réellement écoulé (avec une petite marge réseau)
      if (reflexe < REFLEXE_MIN) return this.fauxDepart(joueurId, 'anticipation');
      this.temps.set(joueurId, Math.round(reflexe));
      this.ctx.ecranJoueur(joueurId, 'info', { titre: '⚡ ' + (reflexe / 1000).toFixed(3).replace('.', ',') + ' s', texte: 'Touché ! Résultat dans un instant…' });
      this.ctx.evenementTablette('reflexe-tape', { nb: this.temps.size });
      // Tout le monde a tapé (ou s'est fait éliminer) : inutile d'attendre la fin du temps.
      const restants = this.ctx.joueurs().filter((j) => !this.temps.has(j.id) && !this.faux.has(j.id));
      if (!restants.length) { this.annulerMinuteurs(); this.attendre(300, () => this.finDuTour()); }
    }

    fauxDepart(joueurId, raison) {
      const j = this.ctx.joueur(joueurId);
      if (!j) return;
      this.faux.set(joueurId, raison);
      const perte = Math.min(PENALITE, Math.max(0, j.score));
      if (perte) this.ctx.ajouterPoints(joueurId, -perte);
      const titre = raison === 'piege' ? '🟥 Piégé !' : '🚫 Faux départ !';
      const texte = raison === 'piege' ? 'Tu as tapé sur le rouge… −' + perte + ' points.' : raison === 'anticipation' ? 'Trop rapide pour être honnête ! −' + perte + ' points.' : 'Il fallait attendre le vert ! −' + perte + ' points.';
      this.ctx.ecranJoueur(joueurId, 'info', { titre, texte });
      this.ctx.evenementTablette('reflexe-faux', { nom: j.nom, avatar: j.avatar, raison });
    }

    finDuTour() {
      if (this.phase === 'resultat') return;
      this.phase = 'resultat';
      this.annulerMinuteurs();
      const classement = Array.from(this.temps.entries()).sort((a, b) => a[1] - b[1]).map(([id, ms], rang) => {
        const j = this.ctx.joueur(id);
        const points = this.ctx.ajouterPoints(id, rang < BAREME.length ? BAREME[rang] : POINTS_SUIVANTS);
        return { id, nom: j ? j.nom : '?', avatar: j ? j.avatar : '❔', ms, points };
      });
      const faux = Array.from(this.faux.entries()).map(([id, raison]) => { const j = this.ctx.joueur(id); return { nom: j ? j.nom : '?', avatar: j ? j.avatar : '❔', raison }; });
      this.ctx.ecranTablette('reflexe-resultat', { tour: this.tour, total: NB_TOURS, classement, faux, dernier: this.tour >= NB_TOURS });
      this.ctx.joueurs().forEach((j) => {
        const rang = classement.findIndex((c) => c.id === j.id);
        if (rang >= 0) this.ctx.ecranJoueur(j.id, 'info', { titre: (rang === 0 ? '🥇 Le plus rapide ! ' : GT_RANG(rang + 1) + ' · ') + '+' + classement[rang].points, texte: 'Ton réflexe : ' + (classement[rang].ms / 1000).toFixed(3).replace('.', ',') + ' s', score: j.score });
        else if (!this.faux.has(j.id)) this.ctx.ecranJoueur(j.id, 'info', { titre: '😴 Trop tard !', texte: 'Le vert est passé sans toi… Reste concentré !', score: j.score });
      });
      this.attendre(this.t.resultatMs, () => this.tourSuivant());
    }

    /* Un joueur qui arrive en cours de route attend le tour suivant devant son bouton. */
    joueurArrive(joueurId) {
      this.ctx.ecranJoueur(joueurId, 'reflexe-bouton', { tour: this.tour, total: NB_TOURS, enRetard: this.phase !== 'attente' });
    }

    /* « Passer » : on termine le tour en cours tout de suite. */
    passer() {
      if (this.phase === 'resultat') { this.annulerMinuteurs(); this.tourSuivant(); }
      else this.finDuTour();
    }
  }

  const GT_RANG = (n) => (n === 1 ? '1er' : n + 'e');

  Reflexe.fiche = {
    id: 'reflexe',
    nom: 'Feu vert !',
    icone: '🚦',
    resume: 'Un jeu de réflexe qui fait battre le cœur : attendez le vert… et tapez !',
    regle: 'Gardez le doigt prêt au-dessus du téléphone. Dès que l\'écran passe au VERT, tapez le plus vite possible ! Taper trop tôt ou sur le ROUGE, c\'est un faux départ : −100 points.'
  };

  return Reflexe;
});
