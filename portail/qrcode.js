/*
 * ════════════════════════════════════════════════════════════════════
 *  LE FABRICANT DE QR CODES (fait maison, sans Internet)
 * ════════════════════════════════════════════════════════════════════
 *
 *  À chaque nouvelle partie, la tablette affiche un QR code qui mène
 *  directement à la salle (l'adresse du jeu suivie du code à quatre
 *  lettres). Auparavant, le programme qui dessine ce QR code était
 *  téléchargé depuis Internet : sans connexion, ou si ce téléchargement
 *  échouait, les joueurs ne voyaient qu'une adresse à recopier.
 *  Ce fichier fabrique le QR code sur place, sans rien télécharger.
 *
 *  Comment ça marche, en quelques mots :
 *    1. le texte (l'adresse) est transformé en une suite d'octets ;
 *    2. on choisit la plus petite « version » (taille) de QR code qui
 *       peut le contenir, avec un niveau de correction « M » : le code
 *       reste lisible même si environ 15 % de l'image est abîmée ;
 *    3. on calcule les octets de correction d'erreurs (Reed-Solomon) ;
 *    4. on dessine les repères (les trois grands carrés des coins, les
 *       lignes pointillées, les petits carrés d'alignement), puis les
 *       données en zigzag ;
 *    5. on essaie les huit « masques » possibles et on garde celui qui
 *       donne l'image la plus facile à lire pour un appareil photo.
 *
 *  Pour rester compatible avec l'ancien programme, il s'utilise de la
 *  même façon :  const qr = qrcode(0, 'M'); qr.addData(texte); qr.make();
 *  puis qr.createSvgTag({ margin: 2 }) donne l'image à afficher.
 *  (Algorithme d'après la norme ISO/IEC 18004.)
 */
(function (racine) {
  'use strict';

  /* Les tables de la norme : octets de correction par bloc, et nombre de blocs (versions 1 à 40). */
  const CORRECTION_PAR_BLOC = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  };
  const NOMBRE_DE_BLOCS = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  };
  const BITS_DE_FORMAT = { L: 1, M: 0, Q: 3, H: 2 };

  const bit = (x, i) => ((x >>> i) & 1) !== 0;

  /* Combien de cases d'une version donnée servent aux données (tout sauf les repères). */
  function casesDeDonnees(ver) {
    let n = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const nbAlign = Math.floor(ver / 7) + 2;
      n -= (25 * nbAlign - 10) * nbAlign - 55;
      if (ver >= 7) n -= 36;
    }
    return n;
  }
  const octetsDeDonnees = (ver, niv) => Math.floor(casesDeDonnees(ver) / 8) - CORRECTION_PAR_BLOC[niv][ver] * NOMBRE_DE_BLOCS[niv][ver];

  /* ─── L'arithmétique de Reed-Solomon (dans le corps à 256 éléments) ─── */
  function multiplier(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function diviseur(degre) {
    const r = new Array(degre).fill(0);
    r[degre - 1] = 1;
    let racineRS = 1;
    for (let i = 0; i < degre; i++) {
      for (let j = 0; j < r.length; j++) {
        r[j] = multiplier(r[j], racineRS);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      racineRS = multiplier(racineRS, 0x02);
    }
    return r;
  }
  function reste(donnees, div) {
    const r = div.map(() => 0);
    donnees.forEach((o) => {
      const facteur = o ^ r.shift();
      r.push(0);
      div.forEach((coef, i) => { r[i] ^= multiplier(coef, facteur); });
    });
    return r;
  }

  /* Le texte devient des octets (UTF-8, pour que les accents passent). */
  function enOctets(texte) {
    return Array.from(unescape(encodeURIComponent(String(texte))), (c) => c.charCodeAt(0));
  }

  function fabriquer(texte, niv) {
    const octets = enOctets(texte);

    // 1. La plus petite version qui contient le message (mode « octets »).
    let ver = 1, bitsUtiles;
    for (;; ver++) {
      if (ver > 40) throw new Error('Texte trop long pour un QR code');
      const bitsCompteur = ver <= 9 ? 8 : 16;
      bitsUtiles = 4 + bitsCompteur + octets.length * 8;
      if (bitsUtiles <= octetsDeDonnees(ver, niv) * 8) break;
    }

    // 2. La suite de bits : mode, longueur, données, fin, bourrage.
    const bits = [];
    const ajouter = (valeur, longueur) => { for (let i = longueur - 1; i >= 0; i--) bits.push((valeur >>> i) & 1); };
    ajouter(0x4, 4);
    ajouter(octets.length, ver <= 9 ? 8 : 16);
    octets.forEach((o) => ajouter(o, 8));
    const capacite = octetsDeDonnees(ver, niv) * 8;
    ajouter(0, Math.min(4, capacite - bits.length));
    ajouter(0, (8 - bits.length % 8) % 8);
    for (let p = 0xEC; bits.length < capacite; p ^= 0xEC ^ 0x11) ajouter(p, 8);
    const donnees = [];
    for (let i = 0; i < bits.length; i += 8) donnees.push(parseInt(bits.slice(i, i + 8).join(''), 2));

    // 3. La correction d'erreurs, bloc par bloc, puis l'entrelacement.
    const nbBlocs = NOMBRE_DE_BLOCS[niv][ver];
    const corrParBloc = CORRECTION_PAR_BLOC[niv][ver];
    const totalOctets = Math.floor(casesDeDonnees(ver) / 8);
    const nbCourts = nbBlocs - totalOctets % nbBlocs;
    const longueurCourte = Math.floor(totalOctets / nbBlocs);
    const div = diviseur(corrParBloc);
    const blocs = [];
    for (let i = 0, k = 0; i < nbBlocs; i++) {
      const dat = donnees.slice(k, k + longueurCourte - corrParBloc + (i < nbCourts ? 0 : 1));
      k += dat.length;
      const corr = reste(dat, div);
      if (i < nbCourts) dat.push(0);
      blocs.push(dat.concat(corr));
    }
    const finaux = [];
    for (let i = 0; i < blocs[0].length; i++) {
      blocs.forEach((b, j) => { if (i !== longueurCourte - corrParBloc || j >= nbCourts) finaux.push(b[i]); });
    }

    // 4. Le dessin.
    const taille = ver * 4 + 17;
    const cases = Array.from({ length: taille }, () => new Array(taille).fill(false));
    const reserve = Array.from({ length: taille }, () => new Array(taille).fill(false));
    const poser = (x, y, noir) => { cases[y][x] = noir; reserve[y][x] = true; };

    for (let i = 0; i < taille; i++) { poser(6, i, i % 2 === 0); poser(i, 6, i % 2 === 0); }
    [[3, 3], [taille - 4, 3], [3, taille - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && x < taille && y >= 0 && y < taille) poser(x, y, d !== 2 && d !== 4);
      }
    });
    const positions = [];
    if (ver > 1) {
      const nbAlign = Math.floor(ver / 7) + 2;
      const pas = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (nbAlign * 2 - 2)) * 2;
      positions.push(6);
      for (let p = taille - 7; positions.length < nbAlign; p -= pas) positions.splice(1, 0, p);
    }
    positions.forEach((ax, i) => positions.forEach((ay, j) => {
      const dernier = positions.length - 1;
      if ((i === 0 && j === 0) || (i === 0 && j === dernier) || (i === dernier && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) poser(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));

    const dessinerFormat = (masque) => {
      const d = (BITS_DE_FORMAT[niv] << 3) | masque;
      let r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      for (let i = 0; i <= 5; i++) poser(8, i, bit(b, i));
      poser(8, 7, bit(b, 6)); poser(8, 8, bit(b, 7)); poser(7, 8, bit(b, 8));
      for (let i = 9; i < 15; i++) poser(14 - i, 8, bit(b, i));
      for (let i = 0; i < 8; i++) poser(taille - 1 - i, 8, bit(b, i));
      for (let i = 8; i < 15; i++) poser(8, taille - 15 + i, bit(b, i));
      poser(8, taille - 8, true);
    };
    dessinerFormat(0);
    if (ver >= 7) {
      let r = ver;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const b = (ver << 12) | r;
      for (let i = 0; i < 18; i++) {
        const a = taille - 11 + i % 3, c = Math.floor(i / 3);
        poser(a, c, bit(b, i)); poser(c, a, bit(b, i));
      }
    }

    // Les données, en zigzag de deux colonnes, de bas en haut puis de haut en bas.
    let n = 0;
    for (let droite = taille - 1; droite >= 1; droite -= 2) {
      if (droite === 6) droite = 5;
      for (let v = 0; v < taille; v++) for (let j = 0; j < 2; j++) {
        const x = droite - j;
        const montant = ((droite + 1) & 2) === 0;
        const y = montant ? taille - 1 - v : v;
        if (!reserve[y][x] && n < finaux.length * 8) { cases[y][x] = bit(finaux[n >>> 3], 7 - (n & 7)); n++; }
      }
    }

    // 5. Les huit masques : on garde celui qui donne l'image la plus lisible.
    const MASQUES = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
      (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0
    ];
    const appliquer = (m) => {
      for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++) if (!reserve[y][x] && MASQUES[m](x, y)) cases[y][x] = !cases[y][x];
    };
    let meilleur = 0, meilleurScore = Infinity;
    for (let m = 0; m < 8; m++) {
      appliquer(m); dessinerFormat(m);
      const s = penalite(cases, taille);
      if (s < meilleurScore) { meilleurScore = s; meilleur = m; }
      appliquer(m); // le masque s'annule en l'appliquant une seconde fois
    }
    appliquer(meilleur); dessinerFormat(meilleur);
    return cases;
  }

  /* La « pénalité » d'une image : longues lignes d'une même couleur, gros pavés, faux repères, déséquilibre noir/blanc. */
  function penalite(c, t) {
    let score = 0;
    const lignes = (lire) => {
      for (let a = 0; a < t; a++) {
        let suite = 1;
        for (let b = 1; b <= t; b++) {
          if (b < t && lire(a, b) === lire(a, b - 1)) suite++;
          else { if (suite >= 5) score += 3 + (suite - 5); suite = 1; }
        }
        // Les motifs qui imitent un grand carré de coin (1:1:3:1:1 bordé de blanc).
        for (let b = 0; b + 11 <= t; b++) {
          const motif = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
          const ok1 = motif.every((v, k) => lire(a, b + k) === !!v);
          const ok2 = motif.every((v, k) => lire(a, b + 10 - k) === !!v);
          if (ok1 || ok2) score += 40;
        }
      }
    };
    lignes((y, x) => c[y][x]);
    lignes((x, y) => c[y][x]);
    let noirs = 0;
    for (let y = 0; y < t; y++) for (let x = 0; x < t; x++) {
      if (c[y][x]) noirs++;
      if (x < t - 1 && y < t - 1 && c[y][x] === c[y][x + 1] && c[y][x] === c[y + 1][x] && c[y][x] === c[y + 1][x + 1]) score += 3;
    }
    score += Math.floor(Math.abs(noirs * 20 - t * t * 10) / (t * t)) * 10;
    return score;
  }

  /* L'objet rendu, avec la même façon de s'en servir que l'ancien programme. */
  function qrcode(_version, niveau) {
    const niv = BITS_DE_FORMAT[niveau] !== undefined ? niveau : 'M';
    let texte = '', cases = null;
    return {
      addData: (t) => { texte += t; },
      make: () => { cases = fabriquer(texte, niv); },
      getModuleCount: () => cases.length,
      isDark: (ligne, colonne) => cases[ligne][colonne],
      // Une image SVG qui s'adapte à la taille de son cadre (le blanc autour, la « marge », est indispensable).
      createSvgTag: (options) => {
        const marge = options && options.margin !== undefined ? options.margin : 4;
        const t = cases.length, total = t + marge * 2;
        let chemin = '';
        for (let y = 0; y < t; y++) for (let x = 0; x < t; x++) if (cases[y][x]) chemin += 'M' + (x + marge) + ' ' + (y + marge) + 'h1v1h-1z';
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
          '<rect width="' + total + '" height="' + total + '" fill="#ffffff"/><path d="' + chemin + '" fill="#000000"/></svg>';
      }
    };
  }

  if (typeof module === 'object' && module.exports) module.exports = qrcode;
  else racine.qrcode = qrcode;
})(this);
