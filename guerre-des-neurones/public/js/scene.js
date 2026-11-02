/*
 * ════════════════════════════════════════════════════════════════════
 *  LE PEINTRE DE PAYSAGES (pour « Les 7 erreurs »)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Le moteur ne transmet qu'une liste d'objets décrits en mots et en
 *  chiffres : « un arbre, couleur #3BA55C, en x = 120, y = 215, taille
 *  1,1 ». Ce fichier les transforme en image vectorielle (SVG), c'est-à-
 *  dire en formes géométriques que l'écran trace lui-même. Avantage :
 *  l'image reste parfaitement nette sur un petit téléphone comme sur
 *  une grande tablette, et elle ne pèse presque rien à transmettre.
 *
 *  Chaque objet est dessiné autour de son centre (0, 0), puis déplacé
 *  et agrandi d'un seul geste par « translate(x, y) scale(taille) ».
 */
(function () {
  'use strict';
  window.GT = window.GT || {};

  const DESSINS = {
    soleil: (o) => {
      let rayons = '';
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        rayons += '<line x1="' + (Math.cos(a) * 26).toFixed(1) + '" y1="' + (Math.sin(a) * 26).toFixed(1) + '" x2="' + (Math.cos(a) * 35).toFixed(1) + '" y2="' + (Math.sin(a) * 35).toFixed(1) + '" stroke="' + o.c + '" stroke-width="4" stroke-linecap="round"/>';
      }
      return rayons + '<circle r="21" fill="' + o.c + '"/>';
    },
    nuage: (o) => '<g fill="' + o.c + '" stroke="#9AA6C8" stroke-width="1"><circle cx="-15" cy="4" r="12"/><circle cx="0" cy="-5" r="16"/><circle cx="16" cy="4" r="12"/><rect x="-15" y="4" width="31" height="12" stroke="none"/></g>',
    oiseau: (o) => '<path d="M-15 2 Q-8 -9 0 1 Q8 -9 15 2" fill="none" stroke="' + o.c + '" stroke-width="3.5" stroke-linecap="round"/>',
    ballon: (o) => '<path d="M0 12 Q4 20 -1 28" fill="none" stroke="#5B6280" stroke-width="1.5"/><ellipse cx="0" cy="-5" rx="14" ry="17" fill="' + o.c + '"/><ellipse cx="-5" cy="-11" rx="3.5" ry="5" fill="#FFFFFF" opacity=".55"/>',
    cerfvolant: (o) => '<path d="M0 20 Q-8 30 2 36 Q10 42 0 50" fill="none" stroke="#5B6280" stroke-width="1.5"/><polygon points="0,-22 15,0 0,20 -15,0" fill="' + o.c + '" stroke="#2B2F4F" stroke-width="1.5"/><line x1="0" y1="-22" x2="0" y2="20" stroke="#2B2F4F" stroke-width="1"/><line x1="-15" y1="0" x2="15" y2="0" stroke="#2B2F4F" stroke-width="1"/>',
    arbre: (o) => '<rect x="-5" y="8" width="10" height="28" fill="#7A4E2D"/><circle cy="-8" r="23" fill="' + o.c + '"/><circle cx="-8" cy="-14" r="6" fill="#FFFFFF" opacity=".15"/>',
    sapin: (o) => '<rect x="-4" y="18" width="8" height="14" fill="#7A4E2D"/><polygon points="0,-34 -19,2 19,2" fill="' + o.c + '"/><polygon points="0,-18 -24,20 24,20" fill="' + o.c + '"/>',
    maison: (o) => '<rect x="-24" y="-10" width="48" height="38" fill="' + (o.c2 || '#F7E1C6') + '" stroke="#2B2F4F" stroke-width="1.5"/><polygon points="-31,-9 0,-36 31,-9" fill="' + o.c + '" stroke="#2B2F4F" stroke-width="1.5"/><rect x="-7" y="9" width="13" height="19" fill="#6B4226"/><rect x="10" y="-1" width="9" height="9" fill="#BFE4FF" stroke="#2B2F4F" stroke-width="1"/>',
    fleur: (o) => {
      let petales = '';
      for (let i = 0; i < 5; i++) {
        const a = i * 2 * Math.PI / 5 - Math.PI / 2;
        petales += '<circle cx="' + (Math.cos(a) * 7).toFixed(1) + '" cy="' + (Math.sin(a) * 7 - 6).toFixed(1) + '" r="6" fill="' + o.c + '" stroke="#2B2F4F" stroke-width=".6"/>';
      }
      return '<line x1="0" y1="-4" x2="0" y2="18" stroke="#3B8B4A" stroke-width="2.5"/>' + petales + '<circle cy="-6" r="4" fill="#FFC93C"/>';
    },
    champignon: (o) => '<rect x="-6" y="0" width="12" height="15" rx="3" fill="#F3E6D3" stroke="#8D7A62" stroke-width=".8"/><path d="M-17 2 Q-17 -15 0 -15 Q17 -15 17 2 Z" fill="' + o.c + '"/><circle cx="-7" cy="-7" r="2.5" fill="#FFFFFF"/><circle cx="5" cy="-10" r="2" fill="#FFFFFF"/><circle cx="9" cy="-3" r="2.2" fill="#FFFFFF"/>'
  };

  /* Le décor commun : ciel en dégradé, colline, prairie. Identique sur les deux images. */
  function decor(idUnique) {
    return '<defs><linearGradient id="ciel-' + idUnique + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9CD3FF"/><stop offset="1" stop-color="#E4F4FF"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#ciel-' + idUnique + ')"/>' +
      '<path d="M0 190 Q100 160 210 185 T400 175 V300 H0 Z" fill="#9BD67A"/>' +
      '<path d="M0 235 Q120 220 240 238 T400 232 V300 H0 Z" fill="#7CC35E"/>';
  }

  let compteur = 0;

  /*
   * GT.scene.svg(objets, options) renvoie le texte SVG d'un paysage.
   *   options.cercles : [{x, y, r, classe}] des cercles à superposer
   *                     (différences trouvées, ou solution en fin de jeu)
   */
  GT.scene = {
    svg(objets, options) {
      options = options || {};
      const id = 's' + (++compteur);
      let corps = decor(id);
      (objets || []).forEach((o) => {
        const dessin = DESSINS[o.type];
        if (dessin) corps += '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + o.t + ')">' + dessin(o) + '</g>';
      });
      (options.cercles || []).forEach((c) => {
        corps += '<circle class="' + (c.classe || 'cercle-trouve') + '" cx="' + c.x + '" cy="' + c.y + '" r="' + Math.min(c.r, 34) + '" fill="none" stroke-width="4"/>';
      });
      return '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (options.titre || 'Paysage') + '">' + corps + '</svg>';
    },

    /* Convertit la position d'un doigt sur l'image affichée en coordonnées du paysage (0-400, 0-300). */
    coordonnees(svgElement, evenement) {
      const cadre = svgElement.getBoundingClientRect();
      return {
        x: Math.round((evenement.clientX - cadre.left) / cadre.width * 400),
        y: Math.round((evenement.clientY - cadre.top) / cadre.height * 300)
      };
    }
  };
})();
