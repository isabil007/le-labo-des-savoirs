/*
 * ════════════════════════════════════════════════════════════════════
 *  MINI-JEU 4 — Le zoom infernal
 * ════════════════════════════════════════════════════════════════════
 *
 *  La tablette montre une image énormément agrandie : on ne voit qu'une
 *  tache de couleur, un bout de texture… Puis l'image se dézoome
 *  doucement, seconde après seconde. Chaque joueur touche sur son
 *  téléphone la réponse qu'il croit bonne, UNE seule fois : sa réponse
 *  est alors validée et ne peut plus changer.
 *
 *  Plus on répond tôt (donc plus l'image est encore zoomée), plus on
 *  gagne : 200 points pour une bonne réponse à la dernière seconde,
 *  jusqu'à 1 000 points pour un éclair de génie au tout début. Une
 *  mauvaise réponse ne rapporte rien. Dès que tout le monde a répondu,
 *  l'image se dévoile entièrement et l'on passe à la suivante.
 *
 *  Le moteur choisit au hasard le point de l'image sur lequel on zoome,
 *  pour que la même image ne se ressemble jamais d'une partie à l'autre.
 *  Le dézoom lui-même est dessiné par la tablette (public/js/tablette.js),
 *  calé sur le chronomètre.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/zoom', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const BANQUE = exiger('../contenus/zoom');

  const NB_IMAGES = 7;
  const ZOOM_DEPART = 14;   // l'image commence agrandie 14 fois

  class Zoom extends JeuQCM {
    constructor(ctx) {
      // Une image par famille autant que possible, pour varier les plaisirs.
      // D'abord les images jamais vues (mémoire anti-répétition), puis les autres.
      const neuves = outils.melanger(outils.nonVus('zoom', BANQUE, NB_IMAGES));
      const tirage = neuves.concat(outils.melanger(BANQUE.filter((x) => !neuves.includes(x))));
      const choisies = [];
      const familles = new Set();
      tirage.forEach((im) => { if (choisies.length < NB_IMAGES && !familles.has(im.famille)) { choisies.push(im); familles.add(im.famille); } });
      tirage.forEach((im) => { if (choisies.length < NB_IMAGES && !choisies.includes(im)) choisies.push(im); });
      outils.marquerVus('zoom', choisies);

      // Chaque image devient une question : la bonne réponse et trois intrus de la même famille.
      const questions = choisies.map((im) => {
        const cousins = BANQUE.filter((x) => x.famille === im.famille && x.sujet !== im.sujet);
        const autres = BANQUE.filter((x) => x.famille !== im.famille);
        const leurres = outils.tirer(cousins.length >= 3 ? cousins : cousins.concat(autres), 3).map((x) => x.sujet);
        return Object.assign({}, im, {
          question: 'Qu’est-ce qui se cache sous le zoom ?',
          choix: [im.sujet, ...leurres],
          // Le point visé : pas tout à fait au centre, pour corser l'affaire.
          origineX: Math.round(25 + Math.random() * 50),
          origineY: Math.round(25 + Math.random() * 50)
        });
      });
      // La vitesse compte beaucoup : 200 points garantis, jusqu'à 800 de bonus.
      super(ctx, { questions, dureeMs: 20000, revelationMs: 6000, pointsBase: 200, bonusVitesse: 800 });
    }

    vueTablette(q) {
      return {
        intitule: 'Qu’est-ce qui se cache sous le zoom ?',
        surtitre: 'Le zoom infernal',
        zoom: { image: q.image || null, photo: q.photo || null, origineX: q.origineX, origineY: q.origineY, depart: ZOOM_DEPART }
      };
    }
    consigneJoueur() { return 'Regarde la tablette… une seule réponse, alors vise juste !'; }
    explication(q) { return { titre: 'C’était… ' + q.sujet.toLowerCase() + ' !', texte: '' }; }
  }

  Zoom.fiche = {
    id: 'zoom',
    nom: 'Le zoom infernal',
    icone: '🔎',
    resume: 'Une image très agrandie qui se dévoile peu à peu : qui la reconnaîtra en premier ?',
    regle: 'L\'image commence très zoomée puis se dézoome. Touchez la bonne réponse sur votre téléphone : une seule réponse par image, et plus vous êtes rapide, plus vous gagnez !'
  };

  return Zoom;
});
