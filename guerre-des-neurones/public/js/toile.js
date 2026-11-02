/*
 * ════════════════════════════════════════════════════════════════════
 *  LA TOILE DE DESSIN (commune à la tablette et au téléphone)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Un « trait » est une suite de points, chacun noté entre 0 et 1 :
 *  (0, 0) est le coin en haut à gauche, (1, 1) le coin en bas à droite.
 *  Pour le tracer, on multiplie simplement par la taille réelle de la
 *  toile. L'épaisseur suit la même logique : elle est exprimée pour une
 *  toile de référence de 400 points de large, puis agrandie ou réduite.
 *  Résultat : un dessin fait sur un petit téléphone s'affiche à
 *  l'identique, proportions comprises, sur la grande tablette.
 *
 *  Un détail qui compte : les écrans modernes ont plus de pixels réels
 *  que de « points » CSS (on parle de densité, ou devicePixelRatio).
 *  On dimensionne la toile en pixels réels pour que le trait reste net.
 */
(function () {
  'use strict';
  window.GT = window.GT || {};

  GT.toile = {
    /* Prépare une toile carrée à la taille de son conteneur ; renvoie sa largeur en points. */
    ajuster(canvas) {
      const cote = canvas.parentElement.clientWidth || 300;
      const densite = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(cote * densite);
      canvas.height = Math.round(cote * densite);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(densite, 0, 0, densite, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      return cote;
    },

    effacer(canvas) {
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    },

    /* Trace un trait entier, ou seulement ses points à partir de l'indice « depuis ». */
    tracer(canvas, trait, depuis) {
      const ctx = canvas.getContext('2d');
      const cote = canvas.width / (canvas.getContext('2d').getTransform().a || 1);
      const pts = trait.points;
      if (!pts.length) return;
      ctx.strokeStyle = trait.couleur;
      ctx.fillStyle = trait.couleur;
      ctx.lineWidth = trait.taille * cote / 400;
      const debut = Math.max(0, (depuis || 0) - 1);
      if (pts.length === 1 || (pts.length - debut) === 1) {
        // Un simple point (un « tap ») : on dessine un petit disque.
        const p = pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(p[0] * cote, p[1] * cote, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(pts[debut][0] * cote, pts[debut][1] * cote);
      for (let i = debut + 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * cote, pts[i][1] * cote);
      ctx.stroke();
    },

    toutRedessiner(canvas, traits) {
      GT.toile.effacer(canvas);
      (traits || []).forEach((t) => GT.toile.tracer(canvas, t, 0));
    }
  };
})();
