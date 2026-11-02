/*
 * ════════════════════════════════════════════════════════════════════
 *  LA GRANDE TABLÉE — Boîte à outils
 * ════════════════════════════════════════════════════════════════════
 *
 *  Ce fichier rassemble de petites fonctions utiles partout : mélanger
 *  un paquet de cartes, tirer des éléments au hasard, comparer deux mots
 *  en pardonnant les accents et les fautes de frappe, fabriquer un code
 *  de salle facile à lire…
 *
 *  Une particularité : ce fichier (comme tous ceux du dossier « moteur »)
 *  fonctionne à DEUX endroits. Sur le serveur (Node.js), pour la vraie
 *  partie avec téléphones ; et directement dans le navigateur, pour le
 *  simulateur où tout tourne sur un seul écran. Les quelques lignes
 *  d'emballage ci-dessous s'occupent de cette double vie : elles
 *  regardent si l'on est dans Node (« module » existe) ou dans un
 *  navigateur (on range alors le module dans l'objet global GT).
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrique(require);
  } else {
    racine.GT = racine.GT || { modules: {} };
    racine.GT.modules = racine.GT.modules || {};
    racine.GT.modules[nom] = fabrique(function (chemin) {
      // Dans le navigateur, « ../contenus/quiz » devient simplement « contenus/quiz ».
      return racine.GT.modules[chemin.replace(/^(\.\.?\/)+/, '')];
    });
  }
})(this, 'outils', function () {
  'use strict';

  /*
   * Mélange de Fisher-Yates : on parcourt le paquet de la fin vers le
   * début et l'on échange chaque carte avec une carte tirée au sort
   * parmi celles qui restent. Chaque ordre a exactement la même chance
   * d'apparaître : c'est le mélange « honnête » des croupiers.
   * On travaille sur une copie pour ne jamais abîmer la liste d'origine.
   */
  function melanger(liste) {
    const copie = liste.slice();
    for (let i = copie.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  }

  /* Tirer « n » éléments différents : on mélange, puis on garde le haut du paquet. */
  function tirer(liste, n) {
    return melanger(liste).slice(0, Math.min(n, liste.length));
  }

  /* Un nombre entier au hasard entre min et max (bornes comprises). */
  function entier(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /*
   * Le code de salle : quatre lettres, comme « BRIK ». On évite les
   * lettres qui se confondent à l'œil ou à l'oreille (I et L, O et Q…),
   * pour que Mamie comme le petit-fils puissent le recopier sans peine.
   */
  const LETTRES_LISIBLES = 'ABCDEFGHJKMNPRSTUVWXYZ';
  function codeSalle(dejaPris) {
    let code;
    do {
      code = '';
      for (let i = 0; i < 4; i++) code += LETTRES_LISIBLES[entier(0, LETTRES_LISIBLES.length - 1)];
    } while (dejaPris && dejaPris(code));
    return code;
  }

  /* Un identifiant unique et discret pour chaque joueur. */
  function identifiant(prefixe) {
    return (prefixe || 'id') + '-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  /*
   * « Normaliser » un mot, c'est le débarrasser de tout ce qui ne compte
   * pas quand on devine : majuscules, accents, articles, tirets, espaces
   * et le « s » du pluriel. Ainsi « Les Licornes ! », « licorne » et
   * « LICORNE » deviennent tous « licorne ».
   */
  function normaliser(texte) {
    return String(texte || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // on retire les accents
      .replace(/^\s*(les|le|la|un|une|des|du)\s+|^\s*l['’]\s*/, '') // on retire l'article du début
      .replace(/[^a-z0-9]/g, '')                        // on ne garde que lettres et chiffres
      .replace(/(s|x)$/, '');                           // on oublie le pluriel
  }

  /*
   * Distance de Levenshtein : le nombre minimal de lettres à ajouter,
   * retirer ou remplacer pour passer d'un mot à l'autre. « girafe » et
   * « giraffe » sont à distance 1 : on pourra dire « Presque ! ».
   */
  function distance(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let precedente = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const ligne = [i];
      for (let j = 1; j <= n; j++) {
        const cout = a[i - 1] === b[j - 1] ? 0 : 1;
        ligne[j] = Math.min(precedente[j] + 1, ligne[j - 1] + 1, precedente[j - 1] + cout);
      }
      precedente = ligne;
    }
    return precedente[n];
  }

  /* On nettoie ce que tapent les joueurs : pas de texte interminable, pas de balises. */
  function nettoyer(texte, longueurMax) {
    return String(texte || '').replace(/[<>]/g, '').trim().slice(0, longueurMax || 40);
  }

  /*
   * La mémoire des questions déjà posées : pour ne pas retomber sur les mêmes
   * questions quand on enchaîne les parties. On note l'heure à laquelle chaque
   * question a été posée, et l'on tire d'abord celles qui n'ont jamais servi
   * (puis les plus anciennes). Sur le serveur, la mémoire vaut pour toutes les
   * salles ; dans le navigateur (mode solo), elle est gardée sur l'appareil.
   */
  const vues = new Map();
  const CLE_MEMOIRE = 'labo:questions-vues';
  const stockage = (function () { try { return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null; } catch (e) { return null; } })();
  try { if (stockage) JSON.parse(stockage.getItem(CLE_MEMOIRE) || '[]').forEach(([k, t]) => vues.set(k, t)); } catch (e) { /* mémoire illisible : on repart de zéro */ }
  function cle(x) {
    if (!x) return '';
    if (x._cle) return x._cle;
    return String(x.question || x.texte || x.consigne || x.situation || x.carte || JSON.stringify(x)).slice(0, 160);
  }
  function tirerFrais(liste, n) {
    return melanger(liste).sort((a, b) => (vues.get(cle(a)) || 0) - (vues.get(cle(b)) || 0)).slice(0, Math.min(n, liste.length));
  }
  function marquerVue(x) {
    vues.set(cle(x), Date.now());
    if (vues.size > 1500) { const plusVieille = [...vues.entries()].sort((a, b) => a[1] - b[1])[0]; vues.delete(plusVieille[0]); }
    try { if (stockage) stockage.setItem(CLE_MEMOIRE, JSON.stringify([...vues.entries()].slice(-800))); } catch (e) { /* tant pis */ }
  }
  function ancienneteVue(x) { return vues.get(cle(x)) || 0; }

  return { melanger, tirer, tirerFrais, marquerVue, ancienneteVue, cle, entier, codeSalle, identifiant, normaliser, distance, nettoyer };
});
