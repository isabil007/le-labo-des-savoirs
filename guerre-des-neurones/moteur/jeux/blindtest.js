/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU — Le blind test des tubes 🎵 (de 1960 à aujourd'hui)
 * ════════════════════════════════════════════════════════════════════
 *
 *  La tablette joue l'extrait officiel de 30 secondes d'un tube (fourni
 *  par Apple, voir contenus/tubes.js) ; sur les téléphones, quatre
 *  propositions. Une fois sur deux, il faut trouver le TITRE ; l'autre
 *  fois, l'ARTISTE. Les mauvaises réponses viennent de la même décennie,
 *  pour que l'oreille compte plus que la culture générale.
 *
 *  Le tirage parcourt les époques : un peu de sixties pour les
 *  grands-parents, du disco, des années 80, et les tubes d'aujourd'hui
 *  pour les petits-enfants. Chaque génération a son moment de gloire.
 *
 *  Si la tablette ne trouve pas l'extrait (pas d'Internet, chanson
 *  introuvable…), elle prévient le moteur (« extrait-indisponible ») :
 *  la question est sautée sans pénaliser personne. Après trois échecs
 *  d'affilée, le jeu s'arrête de lui-même plutôt que de tourner à vide.
 *
 *  Pour éviter qu'un petit malin lise la réponse dans les données reçues
 *  par son téléphone, seule la TABLETTE sait quelle chanson est jouée.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/blindtest', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const TUBES = exiger('../contenus/tubes');

  const NB_EXTRAITS = 8;
  const decennie = (t) => Math.floor(t.annee / 10) * 10;
  const nomDecennie = (d) => (d >= 2000 ? 'années ' + d : 'années ' + String(d).slice(2));

  /* Huit tubes, en passant par toutes les époques (une décennie après l'autre, au hasard). */
  function tirerTubes() {
    const parDecennie = {};
    // Les tubes jamais joués passent devant (mémoire anti-répétition).
    const neufs = outils.melanger(outils.nonVus('tubes', TUBES, NB_EXTRAITS));
    neufs.concat(outils.melanger(TUBES.filter((t) => !neufs.includes(t)))).forEach((t) => { (parDecennie[decennie(t)] = parDecennie[decennie(t)] || []).push(t); });
    const decennies = outils.melanger(Object.keys(parDecennie));
    const choisis = [];
    for (let tour = 0; choisis.length < NB_EXTRAITS && tour < 10; tour++) {
      decennies.forEach((d) => { const t = parDecennie[d][tour]; if (t && choisis.length < NB_EXTRAITS) choisis.push(t); });
    }
    outils.marquerVus('tubes', choisis);
    return outils.melanger(choisis);
  }

  /* Trois mauvaises réponses de la même époque (ou voisine), toutes différentes de la bonne. */
  function leurres(tube, champ) {
    const bonne = tube[champ];
    const proches = outils.melanger(TUBES.filter((t) => t[champ] !== bonne))
      .sort((a, b) => Math.abs(a.annee - tube.annee) - Math.abs(b.annee - tube.annee));
    const pris = new Set([bonne]);
    const res = [];
    proches.forEach((t) => { if (res.length < 3 && !pris.has(t[champ])) { pris.add(t[champ]); res.push(t[champ]); } });
    return res;
  }

  class BlindTest extends JeuQCM {
    constructor(ctx) {
      const questions = tirerTubes().map((t, i) => {
        const champ = i % 2 === 0 ? 'titre' : 'artiste';
        return Object.assign({}, t, {
          champ,
          question: champ === 'titre' ? 'Quel est ce titre ?' : 'Qui chante ce tube ?',
          choix: [t[champ], ...leurres(t, champ)]
        });
      });
      super(ctx, { questions, dureeMs: 25000, revelationMs: 9000, pointsBase: 300, bonusVitesse: 700 });
      this.echecsDeSuite = 0;
    }

    /* Une question arrivée jusqu'à la réponse : l'extrait a donc bien été trouvé. */
    reveler() {
      if (this.phase === 'question') this.echecsDeSuite = 0;
      super.reveler();
    }

    vueTablette(q) {
      return {
        intitule: q.question,
        surtitre: '🎵 Blind test · ' + nomDecennie(decennie(q)),
        // La tablette cherche et joue l'extrait. Elle renvoie le numéro de la question en cas d'échec.
        extrait: { artiste: q.artiste, titre: q.titre, numero: this.questions.indexOf(q) }
      };
    }
    // Les téléphones ne reçoivent ni le titre ni l'artiste joués (pas de triche possible).
    vueJoueur(q) { return { intitule: q.question, surtitre: '🎵 Écoute la tablette !', ecoute: true }; }
    vueRevelation(q) { return { intitule: q.question, surtitre: '🎵 Blind test · ' + nomDecennie(decennie(q)), extrait: { artiste: q.artiste, titre: q.titre, revele: true } }; }
    consigneJoueur() { return 'Tends l’oreille vers la tablette…'; }
    explication(q) { return { titre: q.titre + ' — ' + q.artiste + ' (' + q.annee + ')', texte: 'Extrait fourni par Apple Music.' }; }

    /* Le signal de la tablette : l'extrait de cette question est introuvable. On passe, sans pénalité. */
    signalTablette(d) {
      if (!d || d.type !== 'extrait-indisponible' || this.phase !== 'question' || d.numero !== this.index) return;
      this.echecsDeSuite++;
      this.annulerMinuteurs();
      this.phase = 'saut';
      if (this.echecsDeSuite >= 3) {
        // Trois échecs d'affilée : probablement pas d'Internet sur la tablette.
        this.ctx.ecranTablette('info-jeu', { titre: '📡 Pas d’extrait disponible', texte: 'La tablette n’arrive pas à joindre Apple Music (Internet est-il connecté ?). On passe au jeu suivant !' });
        return this.attendre(4000, () => this.ctx.terminer());
      }
      this.attendre(800, () => this.questionSuivante());
    }
  }

  BlindTest.fiche = {
    id: 'blindtest',
    nom: 'Blind test des tubes',
    icone: '🎵',
    resume: 'Les tubes de 1960 à aujourd’hui : des Beatles à Stromae, qui reconnaîtra la chanson ?',
    regle: 'La tablette joue un extrait : trouvez le titre ou l’artiste sur votre téléphone. Plus vous êtes rapide, plus vous gagnez ! (La tablette doit être connectée à Internet.)'
  };
  BlindTest.tirerTubes = tirerTubes; // pour les tests

  return BlindTest;
});
