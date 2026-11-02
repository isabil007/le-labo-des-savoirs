/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU 3 — Les 7 erreurs en 1 minute
 * ════════════════════════════════════════════════════════════════════
 *
 *  Le jeu des différences, version course contre la montre. Chaque
 *  téléphone affiche deux paysages presque identiques ; il faut toucher
 *  les sept différences en moins d'une minute. Tout le monde joue en
 *  même temps, chacun sur son écran, et la tablette montre la course
 *  en direct (« Papy : 5/7, Léa : 6/7… »).
 *
 *  D'où viennent les images ? Elles ne sont pas dessinées à l'avance :
 *  le jeu les COMPOSE à chaque partie. Il place au hasard un soleil,
 *  des nuages, des arbres, une maison, des fleurs… puis fabrique une
 *  copie dans laquelle il glisse sept modifications : un objet qui
 *  change de couleur, un autre qui disparaît, un troisième qui grossit,
 *  un sapin qui remplace un arbre… On ne joue donc jamais deux fois la
 *  même image, et personne ne peut apprendre les réponses par cœur.
 *
 *  Le jeu ne transmet aux téléphones qu'une description (« un arbre
 *  vert, ici, de cette taille ») ; c'est le fichier public/js/scene.js
 *  qui la transforme en dessin. La vérification des touches se fait sur
 *  le serveur : il connaît l'emplacement exact de chaque différence.
 *
 *  Le barème : 100 points par différence trouvée, 15 points de moins par
 *  touche à côté (pour décourager ceux qui tapotent partout au hasard),
 *  et un bonus si l'on trouve les sept : 200 points + 5 par seconde restante.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/erreurs', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { Jeu } = exiger('../jeux/base');

  const DUREE_MS = 60000;
  const NB_ERREURS = 7;
  const LARGEUR = 400, HAUTEUR = 300;

  /*
   * Le catalogue des objets : où ils peuvent se placer (zone en y),
   * leur encombrement (rayon) et les couleurs qu'ils peuvent prendre.
   * « famille » regroupe les objets interchangeables pour la
   * modification « remplacé par un autre objet ».
   */
  const CATALOGUE = {
    soleil:      { y: [30, 70],   rayon: 34, couleurs: ['#FFC93C', '#FF9F1C'], famille: null },
    nuage:       { y: [30, 130],  rayon: 30, couleurs: ['#FFFFFF', '#D9DEEF', '#FFD6E8'], famille: 'ciel' },
    oiseau:      { y: [40, 150],  rayon: 18, couleurs: ['#2B2F4F', '#E4572E', '#3D5A80'], famille: 'ciel' },
    ballon:      { y: [50, 150],  rayon: 24, couleurs: ['#FF6B5B', '#9B8CFF', '#3DD6B5', '#FFC93C'], famille: 'ciel' },
    cerfvolant:  { y: [40, 140],  rayon: 24, couleurs: ['#FF6B5B', '#9B8CFF', '#3DD6B5', '#FFC93C'], famille: 'ciel' },
    arbre:       { y: [200, 230], rayon: 34, couleurs: ['#3BA55C', '#2E7D4F', '#A3C93A', '#E9A23B'], famille: 'grand' },
    sapin:       { y: [200, 230], rayon: 34, couleurs: ['#1F7A4D', '#2E8B57', '#4A9C6D'], famille: 'grand' },
    maison:      { y: [205, 230], rayon: 36, couleurs: ['#C0392B', '#5D4E8C', '#2C6E8F'], famille: null, mur: ['#F7E1C6', '#FFE3A3', '#F4C7C3'] },
    fleur:       { y: [250, 280], rayon: 18, couleurs: ['#FF6B5B', '#9B8CFF', '#FF8FC7', '#FFFFFF'], famille: 'petit' },
    champignon:  { y: [250, 280], rayon: 20, couleurs: ['#E4572E', '#8D5A3B', '#9B8CFF'], famille: 'petit' }
  };

  /* La recette d'un paysage : combien d'objets de chaque sorte. */
  const RECETTE = { soleil: 1, nuage: 2, oiseau: 2, ballon: 1, cerfvolant: 1, arbre: 2, sapin: 1, maison: 1, fleur: 3, champignon: 2 };

  function autreCouleur(type, actuelle) {
    return outils.tirer(CATALOGUE[type].couleurs.filter((c) => c !== actuelle), 1)[0];
  }

  /*
   * Placer les objets sans qu'ils se chevauchent : on tire une position
   * au hasard, et si elle est trop proche d'un objet déjà posé, on
   * recommence (jusqu'à 300 essais, puis on renonce à cet objet).
   */
  function composerPaysage() {
    const objets = [];
    let numero = 0;
    Object.entries(RECETTE).forEach(([type, combien]) => {
      for (let k = 0; k < combien; k++) {
        const fiche = CATALOGUE[type];
        for (let essai = 0; essai < 300; essai++) {
          const t = Math.round((0.85 + Math.random() * 0.3) * 100) / 100;
          const x = outils.entier(36, LARGEUR - 36);
          const y = outils.entier(fiche.y[0], fiche.y[1]);
          const r = fiche.rayon * t;
          const libre = objets.every((o) => Math.hypot(o.x - x, o.y - y) > r + CATALOGUE[o.type].rayon * o.t - 4);
          if (libre) {
            const objet = { id: 'o' + (numero++), type, x, y, t, c: outils.tirer(fiche.couleurs, 1)[0] };
            if (fiche.mur) objet.c2 = outils.tirer(fiche.mur, 1)[0];
            objets.push(objet);
            break;
          }
        }
      }
    });
    return objets;
  }

  /* Choisir sept objets et leur faire subir chacun une petite métamorphose. */
  function glisserErreurs(originale) {
    const modifiee = originale.map((o) => Object.assign({}, o));
    const differences = [];
    outils.tirer(modifiee, NB_ERREURS).forEach((o) => {
      const fiche = CATALOGUE[o.type];
      const possibles = ['couleur', 'disparu', 'taille'];
      if (fiche.famille) possibles.push('remplace', 'remplace'); // deux fois : un peu plus probable, c'est la plus amusante
      const modif = outils.tirer(possibles, 1)[0];
      const rayon = Math.max(26, fiche.rayon * o.t + 10); // une zone de touche généreuse, pour les gros doigts
      differences.push({ id: o.id, x: o.x, y: o.y, r: rayon, modif });

      if (modif === 'couleur') o.c = autreCouleur(o.type, o.c);
      else if (modif === 'disparu') o.cache = true;
      else if (modif === 'taille') o.t = o.t > 1 ? Math.round(o.t * 0.6 * 100) / 100 : Math.round(o.t * 1.45 * 100) / 100;
      else if (modif === 'remplace') {
        const cousins = Object.keys(CATALOGUE).filter((k) => k !== o.type && CATALOGUE[k].famille === fiche.famille);
        o.type = outils.tirer(cousins, 1)[0];
        o.c = outils.tirer(CATALOGUE[o.type].couleurs, 1)[0];
      }
    });
    return { modifiee: modifiee.filter((o) => !o.cache), differences };
  }

  class Erreurs extends Jeu {
    demarrer() {
      this.originale = composerPaysage();
      const { modifiee, differences } = glisserErreurs(this.originale);
      this.modifiee = modifiee;
      this.differences = differences;
      this.finA = Date.now() + DUREE_MS;
      this.phase = 'jeu';
      // Pour chaque joueur : la liste des différences trouvées, ses touches ratées, et quand il a fini.
      this.fiches = {};
      this.progression = {}; // ce que montre la tablette (transmis « vivant », voir dessin.js)
      this.ctx.joueurs().forEach((j) => this.inscrire(j));

      this.ctx.ecranTablette('erreurs-tableau', {
        originale: this.originale, modifiee: this.modifiee, finA: this.finA, dureeMs: DUREE_MS,
        nbErreurs: NB_ERREURS, progression: this.progression
      });
      this.ctx.joueurs().forEach((j) => this.envoyerEcran(j.id));
      this.attendre(DUREE_MS + 300, () => this.fin());
    }

    inscrire(j) {
      if (this.fiches[j.id]) return;
      this.fiches[j.id] = { trouvees: [], rates: 0, finiA: null };
      this.progression[j.id] = { nom: j.nom, avatar: j.avatar, nb: 0 };
    }

    envoyerEcran(joueurId) {
      const f = this.fiches[joueurId];
      this.ctx.ecranJoueur(joueurId, 'erreurs-jeu', {
        originale: this.originale, modifiee: this.modifiee, finA: this.finA, dureeMs: DUREE_MS,
        nbErreurs: NB_ERREURS,
        trouvees: f.trouvees.map((id) => this.differences.find((d) => d.id === id)),
        fini: !!f.finiA
      });
    }

    action(joueurId, d) {
      if (!d || d.type !== 'touche' || this.phase !== 'jeu') return;
      const f = this.fiches[joueurId];
      if (!f || f.finiA) return;
      const x = +d.x, y = +d.y;
      if (!isFinite(x) || !isFinite(y)) return;

      // Quelle différence non encore trouvée est la plus proche de la touche ?
      const touchee = this.differences
        .filter((diff) => !f.trouvees.includes(diff.id))
        .find((diff) => Math.hypot(diff.x - x, diff.y - y) <= diff.r);

      if (touchee) {
        f.trouvees.push(touchee.id);
        this.progression[joueurId].nb = f.trouvees.length;
        if (f.trouvees.length >= NB_ERREURS) f.finiA = Date.now();
        this.ctx.evenementJoueur(joueurId, 'trouvee', { diff: touchee, nb: f.trouvees.length, fini: !!f.finiA });
        this.ctx.evenementTablette('progression', { joueurId, nb: f.trouvees.length });
        // Si tout le monde a fini, on n'attend pas la fin du chrono.
        if (Object.values(this.fiches).every((x) => x.finiA)) this.attendre(1500, () => this.fin());
      } else {
        f.rates++;
        this.ctx.evenementJoueur(joueurId, 'ratee', { x, y });
      }
    }

    fin() {
      if (this.phase !== 'jeu') return;
      this.phase = 'fin';
      this.annulerMinuteurs();
      const classement = [];
      Object.entries(this.fiches).forEach(([id, f]) => {
        const joueur = this.ctx.joueur(id);
        if (!joueur) return;
        let points = Math.max(0, f.trouvees.length * 100 - f.rates * 15);
        if (f.finiA) points += 200 + 5 * Math.round(Math.max(0, this.finA - f.finiA) / 1000);
        points = this.ctx.ajouterPoints(id, points);
        classement.push({ nom: joueur.nom, avatar: joueur.avatar, nb: f.trouvees.length, rates: f.rates, points });
        this.ctx.ecranJoueur(id, 'erreurs-solution', {
          originale: this.originale, modifiee: this.modifiee, differences: this.differences,
          trouvees: f.trouvees, points, nb: f.trouvees.length, nbErreurs: NB_ERREURS
        });
      });
      classement.sort((a, b) => b.points - a.points);
      this.ctx.ecranTablette('erreurs-fin', {
        originale: this.originale, modifiee: this.modifiee, differences: this.differences, classement, nbErreurs: NB_ERREURS
      });
      this.attendre(12000, () => this.ctx.terminer());
    }

    joueurArrive(joueurId) {
      const j = this.ctx.joueur(joueurId);
      if (this.phase !== 'jeu' || !j) return;
      this.inscrire(j);
      this.envoyerEcran(joueurId);
    }

    passer() {
      if (this.phase === 'jeu') this.fin();
      else this.ctx.terminer();
    }
  }

  Erreurs.fiche = {
    id: 'erreurs',
    nom: 'Les 7 erreurs en 1 minute',
    icone: '🔍',
    resume: 'Deux paysages presque identiques sur chaque téléphone : une minute pour trouver les sept différences.',
    regle: 'Touchez les différences sur l\'une ou l\'autre image. Attention : chaque touche à côté fait perdre quelques points !'
  };

  // On expose aussi les outils de composition, utiles aux tests et au simulateur.
  Erreurs.composerPaysage = composerPaysage;
  Erreurs.glisserErreurs = glisserErreurs;
  return Erreurs;
});
