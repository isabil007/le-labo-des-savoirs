/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU 2 — Dessine et devine
 * ════════════════════════════════════════════════════════════════════
 *
 *  À tour de rôle, un joueur reçoit un mot secret sur son téléphone et
 *  le dessine du bout du doigt. Chaque trait apparaît en direct sur la
 *  tablette, au centre de la table. Les autres tapent leurs propositions
 *  sur leur propre téléphone.
 *
 *  Le déroulement d'un tour :
 *   1. Le dessinateur découvre son mot (il peut en changer une fois).
 *   2. Il a 75 secondes. À mi-temps puis aux trois quarts, la tablette
 *      dévoile une lettre en indice, pour aider les plus perplexes.
 *   3. Une proposition juste rapporte de 200 à 600 points selon la
 *      rapidité ; le dessinateur gagne 100 points par personne qui trouve
 *      (un bon dessin profite à son auteur !).
 *   4. Les mauvaises propositions s'affichent sur la tablette : c'est
 *      souvent là que la table éclate de rire.
 *
 *  Pour garder le jeu rythmé, une manche compte au plus 6 dessinateurs.
 *
 *  LE TRAJET D'UN TRAIT DE CRAYON
 *  ──────────────────────────────
 *  Téléphone du dessinateur → serveur → tablette. Les coordonnées sont
 *  envoyées entre 0 et 1 (0,5 = le milieu), et non en pixels : ainsi,
 *  peu importe que le téléphone soit petit et la tablette grande, le
 *  dessin garde les mêmes proportions.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/dessin', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { Jeu } = exiger('../jeux/base');
  const MOTS = exiger('../contenus/dessins');

  const DUREE_MS = 75000;
  const PAUSE_ENTRE_TOURS_MS = 7000;
  const MAX_DESSINATEURS = 6;

  class Dessin extends Jeu {
    demarrer() {
      this.dessinateurs = outils.melanger(this.ctx.joueurs().map((j) => j.id)).slice(0, MAX_DESSINATEURS);
      this.motsUtilises = new Set();
      this.tour = -1;
      this.tourSuivant();
    }

    piocherMot() {
      const disponibles = MOTS.filter((m) => !this.motsUtilises.has(m));
      const mot = outils.tirerNeuf('dessins', disponibles.length ? disponibles : MOTS, 1)[0];
      this.motsUtilises.add(mot);
      return mot;
    }

    /* L'indice : chaque lettre est remplacée par un tiret, sauf les espaces, les tirets et les lettres déjà dévoilées. */
    indice() {
      return Array.from(this.mot).map((c, i) => (/[\s\-']/.test(c) || this.lettresVisibles.has(i)) ? c : '_').join('');
    }

    tourSuivant() {
      this.tour++;
      // On saute les dessinateurs partis entre-temps.
      while (this.tour < this.dessinateurs.length && !this.ctx.joueur(this.dessinateurs[this.tour])) this.tour++;
      if (this.tour >= this.dessinateurs.length) return this.ctx.terminer();

      this.phase = 'dessin';
      this.dessinateurId = this.dessinateurs[this.tour];
      this.mot = this.piocherMot();
      this.dejaChange = false;
      this.lettresVisibles = new Set();
      this.traits = [];        // tous les traits du dessin, pour le rejouer à qui arrive en retard
      this.propositions = [];  // les dernières propositions affichées sur la tablette
      this.trouveurs = [];     // qui a trouvé, dans l'ordre
      this.finA = Date.now() + DUREE_MS;
      this.afficherTour();

      this.attendre(DUREE_MS / 2, () => this.devoilerLettre());
      this.attendre(DUREE_MS * 0.75, () => this.devoilerLettre());
      this.attendre(DUREE_MS + 200, () => this.finDuTour());
    }

    afficherTour() {
      const d = this.ctx.joueur(this.dessinateurId);
      const auteur = { nom: d.nom, avatar: d.avatar };
      // Astuce : on transmet « this.traits » et « this.propositions » eux-mêmes (et non une copie).
      // Si la tablette se reconnecte, le moteur lui renverra cet écran… avec le dessin à jour.
      this.ctx.ecranTablette('dessin-tableau', {
        auteur, indice: this.indice(), finA: this.finA, dureeMs: DUREE_MS,
        tour: this.tour + 1, total: this.dessinateurs.length,
        traits: this.traits, propositions: this.propositions, trouveurs: this.trouveurs
      });
      this.ctx.ecranTousJoueurs((j) => j.id === this.dessinateurId
        ? { type: 'dessin-dessinateur', donnees: { mot: this.mot, finA: this.finA, dureeMs: DUREE_MS, peutChanger: !this.dejaChange, traits: this.traits } }
        : { type: 'dessin-devineur', donnees: { auteur, indice: this.indice(), finA: this.finA, dureeMs: DUREE_MS, traits: this.traits } });
    }

    devoilerLettre() {
      if (this.phase !== 'dessin') return;
      const cachees = Array.from(this.mot).map((c, i) => i).filter((i) => !/[\s\-']/.test(this.mot[i]) && !this.lettresVisibles.has(i));
      if (cachees.length <= 1) return; // on ne donne jamais la dernière lettre
      this.lettresVisibles.add(outils.tirer(cachees, 1)[0]);
      const indice = this.indice();
      this.ctx.evenementTablette('indice', { indice });
      this.ctx.joueurs().forEach((j) => { if (j.id !== this.dessinateurId) this.ctx.evenementJoueur(j.id, 'indice', { indice }); });
    }

    action(joueurId, d) {
      if (!d || this.phase !== 'dessin') return;

      // ─── Ce que peut faire le dessinateur ───
      if (joueurId === this.dessinateurId) {
        if (d.type === 'trait' && Array.isArray(d.points)) {
          // On vérifie et on arrondit chaque point : un message abîmé ne doit pas casser le dessin.
          const points = d.points.slice(0, 200).map((p) => [Math.round(+p[0] * 1000) / 1000, Math.round(+p[1] * 1000) / 1000]).filter((p) => p.every(isFinite));
          let trait = this.traits.find((t) => t.id === d.id);
          if (!trait) {
            trait = { id: String(d.id).slice(0, 20), couleur: /^#[0-9a-f]{6}$/i.test(d.couleur) ? d.couleur : '#1b1f3b', taille: Math.min(40, Math.max(1, +d.taille || 6)), points: [] };
            this.traits.push(trait);
          }
          trait.points.push(...points);
          this.ctx.evenementTablette('trait', { id: trait.id, couleur: trait.couleur, taille: trait.taille, points });
          // Le dessin arrive aussi, en direct, sur le téléphone de ceux qui devinent.
          this.versDevineurs('trait', { id: trait.id, couleur: trait.couleur, taille: trait.taille, points });
        } else if (d.type === 'annuler') {
          this.traits.pop();
          this.ctx.evenementTablette('redessiner', { traits: this.traits });
          this.versDevineurs('redessiner', { traits: this.traits });
        } else if (d.type === 'effacer') {
          this.traits.length = 0;
          this.ctx.evenementTablette('redessiner', { traits: this.traits });
          this.versDevineurs('redessiner', { traits: this.traits });
        } else if (d.type === 'changer' && !this.dejaChange) {
          this.dejaChange = true;
          this.mot = this.piocherMot();
          this.lettresVisibles = new Set();
          this.traits.length = 0;
          this.afficherTour();
        }
        return;
      }

      // ─── Ce que peuvent faire les devineurs ───
      if (d.type !== 'proposition' || this.trouveurs.some((t) => t.id === joueurId)) return;
      const joueur = this.ctx.joueur(joueurId);
      const texte = outils.nettoyer(d.texte, 40);
      if (!texte || !joueur) return;
      const essai = outils.normaliser(texte);
      const cible = outils.normaliser(this.mot);

      if (essai === cible) {
        // Les points dépendent du temps restant : de 600 (tout de suite) à 200 (à la dernière seconde).
        const restant = Math.max(0, this.finA - Date.now());
        const points = this.ctx.ajouterPoints(joueurId, Math.round(200 + 400 * (restant / DUREE_MS)));
        this.ctx.ajouterPoints(this.dessinateurId, 100);
        this.trouveurs.push({ id: joueurId, nom: joueur.nom, avatar: joueur.avatar, points });
        this.ctx.ecranJoueur(joueurId, 'dessin-trouve', { mot: this.mot, points });
        this.ctx.evenementTablette('trouve', { nom: joueur.nom, avatar: joueur.avatar, points, trouveurs: this.trouveurs });
        this.ctx.evenementJoueur(this.dessinateurId, 'trouve', { nom: joueur.nom, avatar: joueur.avatar });
        // Tout le monde a trouvé ? On ne fait pas attendre la table.
        const devineurs = this.ctx.joueurs().filter((j) => j.id !== this.dessinateurId);
        if (this.trouveurs.length >= devineurs.length) this.attendre(1200, () => this.finDuTour());
      } else {
        // « Presque ! » quand on est à une lettre près (et que le mot est assez long pour que ce soit juste).
        if (cible.length >= 4 && outils.distance(essai, cible) <= 1) this.ctx.evenementJoueur(joueurId, 'presque', { texte });
        this.propositions.push({ nom: joueur.nom, avatar: joueur.avatar, texte });
        if (this.propositions.length > 8) this.propositions.shift();
        this.ctx.evenementTablette('proposition', { nom: joueur.nom, avatar: joueur.avatar, texte });
      }
    }

    finDuTour() {
      if (this.phase !== 'dessin') return;
      this.phase = 'pause';
      this.annulerMinuteurs();
      const d = this.ctx.joueur(this.dessinateurId);
      this.ctx.ecranTablette('dessin-fin', {
        mot: this.mot, traits: this.traits, trouveurs: this.trouveurs,
        auteur: d ? { nom: d.nom, avatar: d.avatar } : null,
        dernier: this.tour + 1 >= this.dessinateurs.length
      });
      this.ctx.ecranTousJoueurs((j) => ({ type: 'info', donnees: {
        titre: 'C\'était « ' + this.mot + ' »',
        texte: j.id === this.dessinateurId
          ? (this.trouveurs.length ? this.trouveurs.length + ' personne(s) ont trouvé grâce à toi !' : 'Personne n\'a trouvé… l\'art est parfois incompris.')
          : (this.trouveurs.some((t) => t.id === j.id) ? 'Bien joué !' : 'Ce sera pour le prochain dessin.'),
        score: j.score
      } }));
      this.attendre(PAUSE_ENTRE_TOURS_MS, () => this.tourSuivant());
    }

    /* Un petit message pour tous ceux qui devinent (tout le monde sauf le dessinateur). */
    versDevineurs(type, donnees) {
      this.ctx.joueurs().forEach((j) => { if (j.id !== this.dessinateurId) this.ctx.evenementJoueur(j.id, type, donnees); });
    }

    joueurArrive(joueurId) {
      if (this.phase !== 'dessin') return;
      const d = this.ctx.joueur(this.dessinateurId);
      if (joueurId === this.dessinateurId) {
        this.ctx.ecranJoueur(joueurId, 'dessin-dessinateur', { mot: this.mot, finA: this.finA, dureeMs: DUREE_MS, peutChanger: !this.dejaChange, traits: this.traits });
      } else if (!this.trouveurs.some((t) => t.id === joueurId)) {
        this.ctx.ecranJoueur(joueurId, 'dessin-devineur', { auteur: { nom: d.nom, avatar: d.avatar }, indice: this.indice(), finA: this.finA, dureeMs: DUREE_MS, traits: this.traits });
      }
    }

    /* Si le dessinateur perd la connexion, inutile de faire patienter tout le monde devant une feuille blanche. */
    joueurParti(joueurId) {
      if (joueurId === this.dessinateurId && this.phase === 'dessin') this.attendre(8000, () => {
        const d = this.ctx.joueur(this.dessinateurId);
        if (!d || !d.connecte) this.finDuTour();
      });
    }

    passer() {
      if (this.phase === 'dessin') this.finDuTour();
      else { this.annulerMinuteurs(); this.tourSuivant(); }
    }
  }

  Dessin.fiche = {
    id: 'dessin',
    minJoueurs: 2, // il faut au moins quelqu'un pour deviner le dessin
    nom: 'Dessine et devine',
    icone: '🎨',
    resume: 'Un joueur dessine sur son téléphone, le dessin apparaît sur la tablette, les autres devinent.',
    regle: 'Quand c\'est votre tour, dessinez le mot secret avec le doigt. Sinon, regardez la tablette et tapez vos idées sur votre téléphone. Les fautes d\'orthographe sont pardonnées !'
  };

  return Dessin;
});
