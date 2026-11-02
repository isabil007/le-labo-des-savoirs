/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Les Fous Rires 🤪
 * ════════════════════════════════════════════════════════════════════
 *
 *  Le jeu où l'on gagne en faisant rire les autres. Six tours, en
 *  alternance :
 *
 *  ✍️  « INVENTE LA SUITE » (3 tours) : la tablette affiche le début
 *     d'une phrase absurde (« Le pire cadeau à offrir à Mamie : … »).
 *     Chacun écrit la suite la plus drôle sur son téléphone (un bouton
 *     « 🎲 Joker » dépanne ceux qui sèchent). Puis toutes les réponses
 *     s'affichent SANS le nom de leur auteur, et chacun vote pour sa
 *     préférée (on ne peut pas voter pour soi). Enfin, on découvre qui
 *     a écrit quoi : c'est là que la table éclate de rire.
 *       • 250 points par vote reçu ;
 *       • « Fou rire général 🤣 » : +300 si TOUS les votes vont à la
 *         même réponse (au moins deux votants) ;
 *       • le jeu glisse aussi SA réponse, « la maison », parmi celles des
 *         joueurs. Les votes qu'elle attire ne rapportent rien à personne.
 *         Avec elle, même à deux joueurs, il y a un vrai choix à faire.
 *
 *  🤔  « DEVINETTE ABSURDE » (3 tours) : une devinette ou un « comble »
 *     à choix multiple (« Qu'est-ce qui est jaune et qui attend ? »).
 *     Ces tours empruntent tout simplement le moule JeuQCM : une petite
 *     partie d'une seule question, dont la fin relance le tour suivant.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/fousrires', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { Jeu, JeuQCM } = exiger('../jeux/base');
  const { AMORCES, DEVINETTES, JOKERS } = exiger('../contenus/fousrires');

  const REGLAGES = {
    ecritureMs: 60000,   // le temps pour écrire sa réponse
    voteMs: 30000,       // le temps pour voter
    resultatMs: 11000,   // le temps pour rire en découvrant les auteurs
    parVote: 250,
    fouRire: 300,
    longueurMax: 80
  };
  // L'ordre des tours : devinette, invention, devinette, invention…
  const DEROULE = ['devinette', 'invente', 'devinette', 'invente', 'devinette', 'invente'];

  /* Une devinette = une mini-partie de JeuQCM avec une seule question. */
  class UneDevinette extends JeuQCM {
    constructor(ctx, q, numero, total) {
      super(ctx, { questions: [q], dureeMs: 20000, revelationMs: 8500, pointsBase: 300, bonusVitesse: 400 });
      this.numero = numero;
      this.total = total;
    }
    vueTablette(q) { return { intitule: q.question, surtitre: '🤪 ' + q.categorie + ' · tour ' + this.numero + ' / ' + this.total }; }
    consigneJoueur() { return 'La réponse la plus absurde…'; }
    explication(q) { return { titre: 'Elle était bonne, celle-là !', texte: q.explication }; }
  }

  class FousRires extends Jeu {
    constructor(ctx, reglages) {
      super(ctx);
      this.reglages = Object.assign({}, REGLAGES, reglages || FousRires.reglagesTest || {});
      this.amorces = outils.tirerNeuf('amorces', AMORCES, DEROULE.filter((t) => t === 'invente').length);
      this.devinettes = outils.tirerNeuf('devinettes', DEVINETTES, DEROULE.filter((t) => t === 'devinette').length);
      this.tour = -1;
      this.phase = 'attente';
      this.sousJeu = null;
    }

    demarrer() { this.tourSuivant(); }

    tourSuivant() {
      if (this.sousJeu) { this.sousJeu.arreter(); this.sousJeu = null; }
      this.annulerMinuteurs();
      this.tour++;
      if (this.tour >= DEROULE.length) return this.ctx.terminer();
      if (DEROULE[this.tour] === 'devinette') this.lancerDevinette();
      else this.lancerInvention();
    }

    /* ─── La devinette : on prête au moule JeuQCM un contexte dont « terminer » relance notre tour suivant. ─── */
    lancerDevinette() {
      this.phase = 'devinette';
      const q = this.devinettes.shift();
      const ctx = Object.assign({}, this.ctx, { terminer: () => { if (this.actif && this.sousJeu === jeu) this.tourSuivant(); } });
      const jeu = new UneDevinette(ctx, q, this.tour + 1, DEROULE.length);
      this.sousJeu = jeu;
      jeu.demarrer();
    }

    /* ─── « Invente la suite » : l'écriture ─── */
    lancerInvention() {
      this.phase = 'ecriture';
      this.amorce = this.amorces.shift();
      this.ecrits = new Map(); // joueurId → texte
      this.finA = Date.now() + this.reglages.ecritureMs;
      this.ctx.ecranTablette('rire-ecriture', this.vueEcriture());
      this.ctx.ecranTousJoueurs((j) => ({ type: 'rire-ecrire', donnees: this.donneesEcrire(j.id) }));
      this.attendre(this.reglages.ecritureMs + 300, () => this.ouvrirVote());
    }

    vueEcriture() {
      return {
        amorce: this.amorce.amorce, finA: this.finA, dureeMs: this.reglages.ecritureMs,
        tour: this.tour + 1, total: DEROULE.length,
        ontEcrit: Array.from(this.ecrits.keys()).map((id) => this.ctx.joueur(id)).filter(Boolean).map((j) => ({ nom: j.nom, avatar: j.avatar })),
        nbJoueurs: this.ctx.joueurs().length
      };
    }

    donneesEcrire(joueurId) {
      return {
        amorce: this.amorce.amorce, finA: this.finA, dureeMs: this.reglages.ecritureMs,
        tour: this.tour + 1, total: DEROULE.length, longueurMax: this.reglages.longueurMax,
        // Chaque téléphone reçoit sa propre poignée de jokers, pour que deux voisins ne tirent pas les mêmes.
        jokers: outils.tirer(JOKERS, 6),
        dejaEcrit: this.ecrits.get(joueurId) || null
      };
    }

    /* ─── Le vote : les réponses, anonymes et mélangées, plus celle de la maison ─── */
    ouvrirVote() {
      if (this.phase !== 'ecriture') return;
      this.annulerMinuteurs();
      this.phase = 'vote';
      const liste = Array.from(this.ecrits.entries()).map(([auteurId, texte]) => ({ auteurId, texte }));
      liste.push({ auteurId: null, texte: this.amorce.maison });
      this.options = outils.melanger(liste).map((o, i) => Object.assign({ id: 'r' + (i + 1), votes: [] }, o));
      this.votes = new Map(); // votantId → id de l'option choisie
      this.finA = Date.now() + this.reglages.voteMs;
      this.ctx.ecranTablette('rire-vote', {
        amorce: this.amorce.amorce, finA: this.finA, dureeMs: this.reglages.voteMs,
        tour: this.tour + 1, total: DEROULE.length,
        reponses: this.options.map((o) => ({ id: o.id, texte: o.texte })),
        nbVotes: 0, nbVotants: this.votants().length
      });
      this.ctx.ecranTousJoueurs((j) => ({ type: 'rire-voter', donnees: this.donneesVoter(j.id) }));
      this.attendre(this.reglages.voteMs + 300, () => this.resultat());
    }

    /* On ne vote jamais pour sa propre réponse : chaque téléphone reçoit la liste sans la sienne. */
    donneesVoter(joueurId) {
      return {
        amorce: this.amorce.amorce, finA: this.finA, dureeMs: this.reglages.voteMs,
        reponses: this.options.filter((o) => o.auteurId !== joueurId).map((o) => ({ id: o.id, texte: o.texte })),
        aVote: this.votes.get(joueurId) || null
      };
    }

    votants() { return this.ctx.joueurs(); }

    /* ─── Le résultat : qui a écrit quoi, et combien de votes ─── */
    resultat() {
      if (this.phase !== 'vote') return;
      this.annulerMinuteurs();
      this.phase = 'resultat';
      this.votes.forEach((optionId, votantId) => {
        const o = this.options.find((x) => x.id === optionId);
        const v = this.ctx.joueur(votantId);
        if (o && v) o.votes.push({ nom: v.nom, avatar: v.avatar });
      });
      const nbVotes = this.votes.size;
      const tri = this.options.slice().sort((a, b) => b.votes.length - a.votes.length);
      const meilleur = tri[0];
      // Le fou rire général : tout le monde (au moins deux personnes) a voté pour la même réponse d'un joueur.
      const fouRire = nbVotes >= 2 && meilleur.auteurId && meilleur.votes.length === nbVotes;
      const maison = this.options.find((o) => !o.auteurId);

      const lignes = tri.map((o) => {
        const auteur = o.auteurId ? this.ctx.joueur(o.auteurId) : null;
        let points = 0;
        if (auteur) {
          const bareme = o.votes.length * this.reglages.parVote + (fouRire && o === meilleur ? this.reglages.fouRire : 0);
          if (bareme) points = this.ctx.ajouterPoints(auteur.id, bareme);
        }
        o.points = points;
        return {
          texte: o.texte, votes: o.votes, points, maison: !o.auteurId,
          auteur: auteur ? { nom: auteur.nom, avatar: auteur.avatar } : null,
          gagnant: o === meilleur && o.votes.length > 0
        };
      });

      this.ctx.ecranTablette('rire-resultat', {
        amorce: this.amorce.amorce, tour: this.tour + 1, total: DEROULE.length,
        lignes, fouRire: !!fouRire, maisonGagne: meilleur === maison && maison.votes.length > 0,
        piegesMaison: maison.votes.length, dernier: this.tour + 1 >= DEROULE.length
      });
      this.ctx.ecranTousJoueurs((j) => {
        const mienne = this.options.find((o) => o.auteurId === j.id);
        return { type: 'rire-resultat', donnees: {
          amorce: this.amorce.amorce,
          maReponse: mienne ? mienne.texte : null,
          mesVotes: mienne ? mienne.votes.length : 0,
          points: mienne ? mienne.points : 0,
          fouRire: !!(fouRire && mienne === meilleur),
          meilleure: meilleur.votes.length ? { texte: meilleur.texte, auteur: lignes[0].auteur, maison: !meilleur.auteurId } : null,
          piegeParMaison: this.votes.get(j.id) === maison.id,
          score: j.score
        } };
      });
      this.attendre(this.reglages.resultatMs, () => this.tourSuivant());
    }

    /* ─── Ce que les téléphones envoient ─── */
    action(joueurId, d) {
      if (this.phase === 'devinette' && this.sousJeu) return this.sousJeu.action(joueurId, d);
      if (!d) return;

      if (this.phase === 'ecriture' && d.type === 'ecrit') {
        const texte = outils.nettoyer(d.texte, this.reglages.longueurMax);
        if (!texte || this.ecrits.has(joueurId)) return;
        this.ecrits.set(joueurId, texte);
        this.ctx.ecranJoueur(joueurId, 'rire-attente', { titre: 'C\'est envoyé ! ✍️', texte, finA: this.finA, dureeMs: this.reglages.ecritureMs, consigne: 'Personne ne saura que c\'est toi… jusqu\'au vote !' });
        const j = this.ctx.joueur(joueurId);
        this.ctx.evenementTablette('a-ecrit', { nom: j.nom, avatar: j.avatar, nb: this.ecrits.size, nbJoueurs: this.ctx.joueurs().length });
        if (this.ecrits.size >= this.ctx.joueurs().length) this.attendre(900, () => this.ouvrirVote());
        return;
      }

      if (this.phase === 'vote' && d.type === 'vote') {
        if (this.votes.has(joueurId)) return; // un seul vote, pas de repentir
        const o = this.options.find((x) => x.id === d.option);
        if (!o || o.auteurId === joueurId) return;
        this.votes.set(joueurId, o.id);
        this.ctx.ecranJoueur(joueurId, 'rire-attente', { titre: 'A voté ! 🗳️', texte: o.texte, finA: this.finA, dureeMs: this.reglages.voteMs, consigne: 'Suspense… Qui a bien pu écrire ça ?' });
        this.ctx.evenementTablette('vote-rire', { nbVotes: this.votes.size, nbVotants: this.votants().length });
        if (this.votes.size >= this.votants().length) this.attendre(700, () => this.resultat());
      }
    }

    /* Un retardataire retrouve l'écran du moment. */
    joueurArrive(joueurId) {
      if (this.phase === 'devinette' && this.sousJeu) return this.sousJeu.joueurArrive(joueurId);
      if (this.phase === 'ecriture' && !this.ecrits.has(joueurId)) this.ctx.ecranJoueur(joueurId, 'rire-ecrire', this.donneesEcrire(joueurId));
      else if (this.phase === 'vote' && !this.votes.has(joueurId)) this.ctx.ecranJoueur(joueurId, 'rire-voter', this.donneesVoter(joueurId));
    }

    /* « Passer » : on avance d'une étape (écriture → vote → résultat → tour suivant). */
    passer() {
      if (this.phase === 'devinette' && this.sousJeu) return this.sousJeu.passer();
      if (this.phase === 'ecriture') this.ouvrirVote();
      else if (this.phase === 'vote') this.resultat();
      else this.tourSuivant();
    }

    arreter() {
      super.arreter();
      if (this.sousJeu) this.sousJeu.arreter();
    }
  }

  FousRires.fiche = {
    id: 'fousrires',
    minJoueurs: 2, // on vote pour la réponse des AUTRES : il faut être au moins deux
    nom: 'Les Fous Rires',
    icone: '🤪',
    resume: 'Inventez la suite la plus drôle, votez pour la meilleure, et devinettes absurdes !',
    regle: 'Complétez la phrase absurde sur votre téléphone, puis votez pour la réponse qui vous fait le plus rire (pas la vôtre !). 250 points par vote. Attention : le jeu glisse aussi sa propre réponse… Entre deux, des devinettes absurdes.'
  };
  FousRires.DEROULE = DEROULE;

  return FousRires;
});
