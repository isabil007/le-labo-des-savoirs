/*
 * ════════════════════════════════════════════════════════════════════
 *  LE SELFIE RIGOLO (facultatif)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Le joueur prend une photo de son visage (caméra frontale du téléphone),
 *  et le téléphone la déforme au hasard pour la rendre comique : gros yeux,
 *  tête d'œuf, nez énorme, tourbillon, visage écrasé, miroir… parfois avec
 *  un accessoire. Tout se passe SUR LE TÉLÉPHONE : seule la petite image
 *  finale (128 × 128 pixels) part au jeu, et elle disparaît avec la partie.
 *
 *  GT.selfie.prendre()            → ouvre l'appareil photo, renvoie une promesse
 *  GT.selfie.rigolo(image)        → une version déformée au hasard (data URL JPEG)
 */
(function () {
  'use strict';
  const T = 256; // taille de travail

  /* Ouvrir la caméra frontale (ou la galerie sur ordinateur) et charger l'image. */
  function prendre() {
    return new Promise((resoudre, rejeter) => {
      const champ = document.createElement('input');
      champ.type = 'file';
      champ.accept = 'image/*';
      champ.setAttribute('capture', 'user');
      champ.style.display = 'none';
      champ.addEventListener('change', () => {
        const fichier = champ.files && champ.files[0];
        champ.remove();
        if (!fichier) return rejeter(new Error('aucune photo'));
        const url = URL.createObjectURL(fichier);
        const img = new Image();
        img.onload = () => { resoudre(recadrer(img)); URL.revokeObjectURL(url); };
        img.onerror = () => { rejeter(new Error('image illisible')); URL.revokeObjectURL(url); };
        img.src = url;
      });
      document.body.appendChild(champ);
      champ.click();
    });
  }

  /* Un carré centré, légèrement resserré sur le haut (là où se trouve le visage d'un selfie). */
  function recadrer(img) {
    const c = document.createElement('canvas'); c.width = c.height = T;
    const g = c.getContext('2d');
    const cote = Math.min(img.naturalWidth, img.naturalHeight) * 0.92;
    const sx = (img.naturalWidth - cote) / 2;
    const sy = Math.max(0, (img.naturalHeight - cote) / 2 - img.naturalHeight * 0.04);
    g.drawImage(img, sx, sy, cote, cote, 0, 0, T, T);
    return g.getImageData(0, 0, T, T);
  }

  /* Déformer : pour chaque pixel d'arrivée, on va chercher le pixel de départ (lissage bilinéaire). */
  function deformer(src, transformation) {
    const out = new ImageData(T, T);
    const s = src.data, o = out.data;
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        let [u, v] = transformation(x / T, y / T);
        u = Math.min(Math.max(u * T, 0), T - 1.001); v = Math.min(Math.max(v * T, 0), T - 1.001);
        const x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0;
        const i00 = (y0 * T + x0) * 4, i10 = i00 + 4, i01 = i00 + T * 4, i11 = i01 + 4;
        const k = (y * T + x) * 4;
        for (let c = 0; c < 3; c++) {
          o[k + c] = (s[i00 + c] * (1 - fx) + s[i10 + c] * fx) * (1 - fy) + (s[i01 + c] * (1 - fx) + s[i11 + c] * fx) * fy;
        }
        o[k + 3] = 255;
      }
    }
    return out;
  }

  /* Une loupe (force > 0) ou un rétrécissement (force < 0) autour d'un point. */
  function loupe(cx, cy, rayon, force) {
    return (u, v) => {
      const dx = u - cx, dy = v - cy, d = Math.hypot(dx, dy);
      if (d >= rayon) return [u, v];
      const r = d / rayon;
      const k = force > 0 ? Math.pow(r, force) : Math.pow(r, 1 / (1 - force));
      return [cx + dx * (k / Math.max(r, 1e-6)) * (d ? 1 : 0), cy + dy * (k / Math.max(r, 1e-6)) * (d ? 1 : 0)];
    };
  }
  const enchainer = (...fs) => (u, v) => fs.reduceRight((p, f) => f(p[0], p[1]), [u, v]);

  const EFFETS = [
    { nom: 'Gros yeux', f: () => enchainer(loupe(0.37, 0.43, 0.17, 1.9), loupe(0.63, 0.43, 0.17, 1.9)) },
    { nom: 'Nez XXL', f: () => loupe(0.5, 0.55, 0.26, 2.2) },
    { nom: 'Mini visage', f: () => loupe(0.5, 0.5, 0.42, -1.4) },
    { nom: 'Tête d\'œuf', f: () => (u, v) => [0.5 + (u - 0.5) * (1 + 0.35 * Math.pow(1 - v, 2)), v < 0.5 ? 0.5 - Math.pow((0.5 - v) / 0.5, 1.35) * 0.5 : v] },
    { nom: 'Écrasé', f: () => (u, v) => [0.5 + (u - 0.5) * 0.62, v] },
    { nom: 'Étiré', f: () => (u, v) => [u, 0.5 + (v - 0.5) * 0.66] },
    { nom: 'Tourbillon', f: () => { const sens = Math.random() < 0.5 ? -1 : 1; return (u, v) => { const dx = u - 0.5, dy = v - 0.5, d = Math.hypot(dx, dy); const a = sens * 2.6 * Math.max(0, 0.48 - d); const c = Math.cos(a), s = Math.sin(a); return [0.5 + dx * c - dy * s, 0.5 + dx * s + dy * c]; }; } },
    { nom: 'Miroir', f: () => (u, v) => [u < 0.5 ? u : 1 - u, v] },
    { nom: 'Grosse bouche', f: () => loupe(0.5, 0.7, 0.22, 2) },
    { nom: 'Vagues', f: () => (u, v) => [u + 0.035 * Math.sin(v * 18), v + 0.02 * Math.sin(u * 14)] }
  ];
  const ACCESSOIRES = [
    { e: '🕶️', x: 0.5, y: 0.43, taille: 0.62 },
    { e: '🎩', x: 0.5, y: 0.06, taille: 0.5 },
    { e: '👑', x: 0.5, y: 0.07, taille: 0.42 },
    { e: '🥸', x: 0.5, y: 0.5, taille: 0.52 },
    { e: '🔴', x: 0.5, y: 0.57, taille: 0.14 },
    { e: '🎉', x: 0.82, y: 0.14, taille: 0.3 },
    { e: '🌈', x: 0.5, y: 0.1, taille: 0.45 }
  ];
  let dernier = -1;

  /* Une version rigolote au hasard : un effet (jamais deux fois le même d'affilée), parfois un accessoire. */
  function rigolo(image) {
    let n;
    do { n = Math.floor(Math.random() * EFFETS.length); } while (n === dernier && EFFETS.length > 1);
    dernier = n;
    const deforme = deformer(image, EFFETS[n].f());
    const c = document.createElement('canvas'); c.width = c.height = T;
    const g = c.getContext('2d');
    g.putImageData(deforme, 0, 0);
    // Un peu plus de couleurs, pour l'effet « bande dessinée ».
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = ['#8383F7', '#FF8E4F', '#E8A9CC', '#83ACF7'][Math.floor(Math.random() * 4)];
    g.globalAlpha = 0.35; g.fillRect(0, 0, T, T);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (Math.random() < 0.55) {
      const a = ACCESSOIRES[Math.floor(Math.random() * ACCESSOIRES.length)];
      g.font = Math.round(a.taille * T) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(a.e, a.x * T, a.y * T + a.taille * T * 0.1);
    }
    // L'image finale : 128 × 128, JPEG léger.
    const f = document.createElement('canvas'); f.width = f.height = 128;
    f.getContext('2d').drawImage(c, 0, 0, 128, 128);
    return { url: f.toDataURL('image/jpeg', 0.72), effet: EFFETS[n].nom };
  }

  window.GT = window.GT || {};
  window.GT.selfie = { prendre, rigolo, recadrer };
})();
