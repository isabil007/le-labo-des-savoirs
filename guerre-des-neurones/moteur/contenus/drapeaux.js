/*
 * ════════════════════════════════════════════════════════════════════
 *  LES DRAPEAUX DU MONDE (dessinés par le jeu)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Chaque drapeau est décrit par une liste de formes simples, sur une
 *  feuille de 300 × 200 (le format 3:2 le plus courant) :
 *    { r: [x, y, largeur, hauteur], c: couleur }        un rectangle
 *    { o: [x, y, rayon], c: couleur }                  un disque
 *    { o: [x, y, rayon], c: couleur, trait: épaisseur } un cercle (le contour seul)
 *    { p: [[x, y], …], c: couleur }                    un polygone
 *    { l: [x1, y1, x2, y2], c: couleur, e: épaisseur }  une bande en biais
 *  Le dessin est fait par la tablette et les téléphones (GT.drapeau dans
 *  public/js/commun.js). On ne passe pas par les émojis de drapeaux :
 *  sous Windows, ils s'affichent en lettres (« BE »)… ce qui donnerait
 *  la réponse !
 *
 *  Les drapeaux à armoiries très détaillées sont simplifiés ou écartés :
 *  le jeu garde ceux que l'on peut reconnaître à leurs formes et couleurs.
 *  « teintes » sert à choisir des mauvaises réponses qui se ressemblent
 *  (le Tchad parmi la Roumanie… le piège est voulu).
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/drapeaux', function () {
  'use strict';
  const L = 300, H = 200;

  /* Les petites fabriques de formes, pour ne pas tout écrire à la main. */
  const verticales = (couleurs, poids) => {
    poids = poids || couleurs.map(() => 1);
    const total = poids.reduce((a, b) => a + b, 0);
    let x = 0;
    return couleurs.map((c, i) => { const l = L * poids[i] / total; const f = { r: [x, 0, l + 0.5, H], c }; x += l; return f; });
  };
  const horizontales = (couleurs, poids) => {
    poids = poids || couleurs.map(() => 1);
    const total = poids.reduce((a, b) => a + b, 0);
    let y = 0;
    return couleurs.map((c, i) => { const h = H * poids[i] / total; const f = { r: [0, y, L, h + 0.5], c }; y += h; return f; });
  };
  /* La croix scandinave, décalée vers le mât (avec un liseré facultatif). */
  const nordique = (fond, croix, liseré) => {
    const formes = [{ r: [0, 0, L, H], c: fond }];
    if (liseré) formes.push({ r: [75, 0, 50, H], c: liseré }, { r: [0, 75, L, 50], c: liseré });
    formes.push({ r: [85, 0, 30, H], c: croix }, { r: [0, 85, L, 30], c: croix });
    return formes;
  };
  /* Une étoile à cinq branches, pointe vers le haut. */
  const etoile = (cx, cy, R, c) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rayon = i % 2 === 0 ? R : R * 0.382;
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      pts.push([Math.round((cx + rayon * Math.cos(angle)) * 10) / 10, Math.round((cy + rayon * Math.sin(angle)) * 10) / 10]);
    }
    return { p: pts, c };
  };

  const D = [
    // ─── Les plus connus (ils ouvrent la partie) ───
    { pays: 'Belgique', celebre: true, teintes: 'noir jaune rouge', formes: verticales(['#000000', '#FDDA24', '#EF3340']), anecdote: 'Ses couleurs viennent des armoiries du duché de Brabant.' },
    { pays: 'France', celebre: true, teintes: 'bleu blanc rouge', formes: verticales(['#002395', '#FFFFFF', '#ED2939']) },
    { pays: 'Italie', celebre: true, teintes: 'vert blanc rouge', formes: verticales(['#009246', '#FFFFFF', '#CE2B37']) },
    { pays: 'Allemagne', celebre: true, teintes: 'noir rouge jaune', formes: horizontales(['#000000', '#DD0000', '#FFCE00']) },
    { pays: 'Pays-Bas', celebre: true, teintes: 'rouge blanc bleu', formes: horizontales(['#AE1C28', '#FFFFFF', '#21468B']), anecdote: 'Il ressemble beaucoup à celui du Luxembourg, dont le bleu est plus clair.' },
    { pays: 'Japon', celebre: true, teintes: 'blanc rouge', formes: [{ r: [0, 0, L, H], c: '#FFFFFF' }, { o: [150, 100, 60], c: '#BC002D' }], anecdote: 'Les Japonais l’appellent Hinomaru, le « cercle du soleil ».' },
    { pays: 'Suisse', celebre: true, teintes: 'rouge blanc', carre: true, formes: [{ r: [0, 0, 200, 200], c: '#DA291C' }, { r: [81, 38, 38, 124], c: '#FFFFFF' }, { r: [38, 81, 124, 38], c: '#FFFFFF' }], anecdote: 'L’un des deux seuls drapeaux nationaux carrés, avec celui du Vatican.' },
    { pays: 'Royaume-Uni', celebre: true, teintes: 'bleu blanc rouge', formes: [{ r: [0, 0, L, H], c: '#012169' }, { l: [0, 0, L, H], c: '#FFFFFF', e: 40 }, { l: [L, 0, 0, H], c: '#FFFFFF', e: 40 }, { l: [0, 0, L, H], c: '#C8102E', e: 13 }, { l: [L, 0, 0, H], c: '#C8102E', e: 13 }, { r: [125, 0, 50, H], c: '#FFFFFF' }, { r: [0, 75, L, 50], c: '#FFFFFF' }, { r: [135, 0, 30, H], c: '#C8102E' }, { r: [0, 85, L, 30], c: '#C8102E' }], anecdote: 'L’« Union Jack » superpose les croix de l’Angleterre, de l’Écosse et de l’Irlande.' },
    { pays: 'États-Unis', celebre: true, teintes: 'rouge blanc bleu', formes: (() => {
      const f = [{ r: [0, 0, L, H], c: '#FFFFFF' }];
      for (let i = 0; i < 13; i += 2) f.push({ r: [0, i * H / 13, L, H / 13 + 0.3], c: '#B22234' });
      f.push({ r: [0, 0, 120, 7 * H / 13], c: '#3C3B6E' });
      for (let ligne = 0; ligne < 5; ligne++) for (let col = 0; col < 6; col++) f.push({ o: [12 + col * 19, 12 + ligne * 21, 4], c: '#FFFFFF' });
      return f;
    })(), anecdote: '50 étoiles pour les 50 États, et 13 bandes pour les 13 colonies d’origine (le dessin du jeu est simplifié).' },
    { pays: 'Espagne', celebre: true, teintes: 'rouge jaune', formes: horizontales(['#AA151B', '#F1BF00', '#AA151B'], [1, 2, 1]), anecdote: 'Le vrai drapeau porte aussi les armoiries du royaume, sur la bande jaune.' },
    { pays: 'Brésil', celebre: true, teintes: 'vert jaune bleu', formes: [{ r: [0, 0, L, H], c: '#009C3B' }, { p: [[150, 22], [278, 100], [150, 178], [22, 100]], c: '#FFDF00' }, { o: [150, 100, 50], c: '#002776' }], anecdote: 'Son disque bleu montre le ciel étoilé de Rio de Janeiro le 15 novembre 1889.' },
    { pays: 'Canada', celebre: true, teintes: 'rouge blanc', formes: [...verticales(['#D80621', '#FFFFFF', '#D80621'], [1, 2, 1]), { p: [[150, 45], [162, 70], [180, 64], [173, 95], [195, 90], [188, 108], [200, 113], [168, 135], [154, 133], [154, 162], [146, 162], [146, 133], [132, 135], [100, 113], [112, 108], [105, 90], [127, 95], [120, 64], [138, 70]], c: '#D80621' }], anecdote: 'La feuille d’érable est devenue l’emblème du pays en 1965.' },
    { pays: 'Grèce', celebre: true, teintes: 'bleu blanc', formes: (() => {
      const f = [{ r: [0, 0, L, H], c: '#FFFFFF' }];
      for (let i = 0; i < 9; i += 2) f.push({ r: [0, i * H / 9, L, H / 9 + 0.3], c: '#0D5EAF' });
      f.push({ r: [0, 0, 111, 111], c: '#0D5EAF' }, { r: [44.4, 0, 22.2, 111], c: '#FFFFFF' }, { r: [0, 44.4, 111, 22.2], c: '#FFFFFF' });
      return f;
    })(), anecdote: 'Ses neuf bandes rappelleraient les neuf syllabes de la devise grecque « La liberté ou la mort ».' },
    { pays: 'Chine', celebre: true, teintes: 'rouge jaune', formes: [{ r: [0, 0, L, H], c: '#EE1C25' }, etoile(50, 50, 30, '#FFFF00'), etoile(100, 20, 10, '#FFFF00'), etoile(120, 40, 10, '#FFFF00'), etoile(120, 70, 10, '#FFFF00'), etoile(100, 90, 10, '#FFFF00')] },
    // ─── Les tricolores verticaux (gare aux sosies !) ───
    { pays: 'Irlande', teintes: 'vert blanc orange', formes: verticales(['#169B62', '#FFFFFF', '#FF883E']), anecdote: 'Ne pas confondre avec la Côte d’Ivoire : les mêmes couleurs, dans l’autre sens !' },
    { pays: 'Côte d’Ivoire', teintes: 'orange blanc vert', formes: verticales(['#F77F00', '#FFFFFF', '#009E60']), anecdote: 'Ne pas confondre avec l’Irlande : les mêmes couleurs, dans l’autre sens !' },
    { pays: 'Roumanie', teintes: 'bleu jaune rouge', formes: verticales(['#002B7F', '#FCD116', '#CE1126']), anecdote: 'Il est presque identique à celui du Tchad : seul le bleu change très légèrement.' },
    { pays: 'Tchad', teintes: 'bleu jaune rouge', formes: verticales(['#002664', '#FECB00', '#C60C30']), anecdote: 'Il est presque identique à celui de la Roumanie : seul le bleu change très légèrement.' },
    { pays: 'Mali', teintes: 'vert jaune rouge', formes: verticales(['#14B53A', '#FCD116', '#CE1126']) },
    { pays: 'Sénégal', teintes: 'vert jaune rouge', formes: [...verticales(['#00853F', '#FDEF42', '#E31B23']), etoile(150, 100, 28, '#00853F')], anecdote: 'Comme le Mali… mais avec une étoile verte au centre.' },
    { pays: 'Guinée', teintes: 'rouge jaune vert', formes: verticales(['#CE1126', '#FCD116', '#009460']) },
    { pays: 'Cameroun', teintes: 'vert rouge jaune', formes: [...verticales(['#007A5E', '#CE1126', '#FCD116']), etoile(150, 100, 26, '#FCD116')] },
    { pays: 'Nigeria', teintes: 'vert blanc', formes: verticales(['#008751', '#FFFFFF', '#008751']) },
    { pays: 'Pérou', teintes: 'rouge blanc', formes: verticales(['#D91023', '#FFFFFF', '#D91023']) },
    // ─── Les tricolores horizontaux ───
    { pays: 'Luxembourg', teintes: 'rouge blanc bleu', formes: horizontales(['#ED2939', '#FFFFFF', '#00A1DE']), anecdote: 'Il ressemble beaucoup à celui des Pays-Bas, mais son bleu est plus clair.' },
    { pays: 'Russie', teintes: 'blanc bleu rouge', formes: horizontales(['#FFFFFF', '#0039A6', '#D52B1E']) },
    { pays: 'Autriche', teintes: 'rouge blanc', formes: horizontales(['#ED2939', '#FFFFFF', '#ED2939']) },
    { pays: 'Hongrie', teintes: 'rouge blanc vert', formes: horizontales(['#CD2A3E', '#FFFFFF', '#436F4D']) },
    { pays: 'Bulgarie', teintes: 'blanc vert rouge', formes: horizontales(['#FFFFFF', '#00966E', '#D62612']) },
    { pays: 'Lituanie', teintes: 'jaune vert rouge', formes: horizontales(['#FDB913', '#006A44', '#C1272D']) },
    { pays: 'Estonie', teintes: 'bleu noir blanc', formes: horizontales(['#0072CE', '#000000', '#FFFFFF']) },
    { pays: 'Pologne', teintes: 'blanc rouge', formes: horizontales(['#FFFFFF', '#DC143C']) },
    { pays: 'Ukraine', teintes: 'bleu jaune', formes: horizontales(['#0057B7', '#FFD700']), anecdote: 'Le bleu du ciel au-dessus du jaune des champs de blé.' },
    { pays: 'Indonésie', teintes: 'rouge blanc', formes: horizontales(['#FF0000', '#FFFFFF']), anecdote: 'Presque identique à celui de Monaco : seules les proportions changent.' },
    { pays: 'Colombie', teintes: 'jaune bleu rouge', formes: horizontales(['#FCD116', '#003893', '#CE1126'], [2, 1, 1]) },
    { pays: 'Arménie', teintes: 'rouge bleu orange', formes: horizontales(['#D90012', '#0033A0', '#F2A800']) },
    { pays: 'Gabon', teintes: 'vert jaune bleu', formes: horizontales(['#009E60', '#FCD116', '#3A75C4']) },
    { pays: 'Sierra Leone', teintes: 'vert blanc bleu', formes: horizontales(['#1EB53A', '#FFFFFF', '#0072C6']) },
    { pays: 'Thaïlande', teintes: 'rouge blanc bleu', formes: horizontales(['#A51931', '#F4F5F8', '#2D2A4A', '#F4F5F8', '#A51931'], [1, 1, 2, 1, 1]) },
    { pays: 'Inde', teintes: 'orange blanc vert bleu', formes: [...horizontales(['#FF9933', '#FFFFFF', '#138808']), { o: [150, 100, 26], c: '#000080', trait: 4 }] },
    { pays: 'Argentine', teintes: 'bleu blanc jaune', formes: [...horizontales(['#74ACDF', '#FFFFFF', '#74ACDF']), { o: [150, 100, 20], c: '#F6B40E' }] },
    { pays: 'Ghana', teintes: 'rouge jaune vert noir', formes: [...horizontales(['#CE1126', '#FCD116', '#006B3F']), etoile(150, 100, 28, '#000000')] },
    { pays: 'Laos', teintes: 'rouge bleu blanc', formes: [...horizontales(['#CE1126', '#002868', '#CE1126'], [1, 2, 1]), { o: [150, 100, 40], c: '#FFFFFF' }] },
    // ─── Les croix scandinaves ───
    { pays: 'Danemark', teintes: 'rouge blanc', formes: nordique('#C8102E', '#FFFFFF'), anecdote: 'Le « Dannebrog » est souvent cité comme le plus ancien drapeau national encore utilisé.' },
    { pays: 'Suède', teintes: 'bleu jaune', formes: nordique('#006AA7', '#FECC02') },
    { pays: 'Norvège', teintes: 'rouge bleu blanc', formes: nordique('#BA0C2F', '#00205B', '#FFFFFF') },
    { pays: 'Finlande', teintes: 'blanc bleu', formes: nordique('#FFFFFF', '#002F6C') },
    { pays: 'Islande', teintes: 'bleu rouge blanc', formes: nordique('#02529C', '#DC1E35', '#FFFFFF') },
    // ─── Et quelques formes bien à eux ───
    { pays: 'Bangladesh', teintes: 'vert rouge', formes: [{ r: [0, 0, L, H], c: '#006A4E' }, { o: [135, 100, 60], c: '#F42A41' }], anecdote: 'Le disque rouge est un peu décalé vers le mât : quand le drapeau flotte, il paraît centré.' },
    { pays: 'Tchéquie', teintes: 'blanc rouge bleu', formes: [...horizontales(['#FFFFFF', '#D7141A']), { p: [[0, 0], [150, 100], [0, 200]], c: '#11457E' }] },
    { pays: 'Bénin', teintes: 'vert jaune rouge', formes: [{ r: [0, 0, 120, H], c: '#008751' }, { r: [120, 0, 180, 100], c: '#FCD116' }, { r: [120, 100, 180, 100], c: '#E8112D' }] },
    { pays: 'Madagascar', teintes: 'blanc rouge vert', formes: [{ r: [0, 0, 100, H], c: '#FFFFFF' }, { r: [100, 0, 200, 100], c: '#FC3D32' }, { r: [100, 100, 200, 100], c: '#007E3A' }] },
    { pays: 'Jamaïque', teintes: 'vert jaune noir', formes: [{ r: [0, 0, L, H], c: '#000000' }, { p: [[0, 0], [L, 0], [150, 100]], c: '#009B3A' }, { p: [[0, H], [L, H], [150, 100]], c: '#009B3A' }, { l: [0, 0, L, H], c: '#FED100', e: 28 }, { l: [L, 0, 0, H], c: '#FED100', e: 28 }] },
    { pays: 'Turquie', teintes: 'rouge blanc', formes: [{ r: [0, 0, L, H], c: '#E30A17' }, { o: [115, 100, 50], c: '#FFFFFF' }, { o: [127, 100, 40], c: '#E30A17' }, etoile(185, 100, 24, '#FFFFFF')] },
    { pays: 'Vietnam', teintes: 'rouge jaune', formes: [{ r: [0, 0, L, H], c: '#DA251D' }, etoile(150, 104, 62, '#FFFF00')] }
  ];
  D.forEach((d) => { d.l = d.carre ? 200 : L; d.h = H; });
  return D;
});
