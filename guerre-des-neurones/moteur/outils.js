/*
 * ════════════════════════════════════════════════════════════════════
 *  LA GUERRE DES NEURONES — Boîte à outils
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
   * LA MÉMOIRE ANTI-RÉPÉTITION. « tirerNeuf » tire comme « tirer », mais
   * en se souvenant de ce qui est déjà sorti, catégorie par catégorie
   * (« quiz-jeunes », « drapeaux », « gages »…). Il pioche d'abord dans
   * ce qui n'a JAMAIS été posé ; quand toute la réserve y est passée, il
   * entame un nouveau tour (sans reprendre ce qu'il vient de choisir).
   * Résultat : on ne revoit une question qu'après avoir vu toutes les
   * autres de sa catégorie. Le serveur enregistre cette mémoire dans un
   * fichier (souvenirs.json) pour qu'elle tienne d'une soirée à l'autre.
   */
  const souvenirs = new Map(); // catégorie → ensemble des éléments déjà sortis
  const cleParDefaut = (x) => (typeof x === 'string' ? x
    : x.question || x.sujet || x.plat || x.amorce || x.pays || (x.titre ? x.titre + ' — ' + x.artiste : JSON.stringify(x)));
  function tirerNeuf(categorie, liste, n, cle) {
    cle = cle || cleParDefaut;
    let vus = souvenirs.get(categorie);
    if (!vus) souvenirs.set(categorie, (vus = new Set()));
    let choisis = tirer(liste.filter((x) => !vus.has(cle(x))), n);
    if (choisis.length < n) {
      vus.clear(); // un tour complet est terminé : on recommence, sans reprendre ce qu'on vient de tirer
      const deja = new Set(choisis.map(cle));
      choisis = choisis.concat(tirer(liste.filter((x) => !deja.has(cle(x))), n - choisis.length));
    }
    choisis.forEach((x) => vus.add(cle(x)));
    memoireModifiee = true;
    return choisis;
  }
  let memoireModifiee = false;
  /* Pour les jeux qui choisissent eux-mêmes : la liste de ce qui n'est jamais sorti (au moins « minimum » éléments)… */
  function nonVus(categorie, liste, minimum, cle) {
    cle = cle || cleParDefaut;
    let vus = souvenirs.get(categorie);
    if (!vus) souvenirs.set(categorie, (vus = new Set()));
    let frais = liste.filter((x) => !vus.has(cle(x)));
    if (frais.length < (minimum || 1)) { vus.clear(); frais = liste.slice(); }
    return frais;
  }
  /* … puis on note ce qui a vraiment été joué. */
  function marquerVus(categorie, elements, cle) {
    cle = cle || cleParDefaut;
    let vus = souvenirs.get(categorie);
    if (!vus) souvenirs.set(categorie, (vus = new Set()));
    elements.forEach((x) => vus.add(cle(x)));
    memoireModifiee = true;
  }
  /* Pour l'enregistrement sur disque (serveur.js). */
  const memoire = {
    exporter() { memoireModifiee = false; const o = {}; souvenirs.forEach((v, k) => { o[k] = Array.from(v); }); return o; },
    importer(o) { Object.entries(o || {}).forEach(([k, v]) => { if (Array.isArray(v)) souvenirs.set(k, new Set(v)); }); },
    modifiee() { return memoireModifiee; },
    oublier() { souvenirs.clear(); }
  };

  return { melanger, tirer, tirerNeuf, nonVus, marquerVus, memoire, entier, codeSalle, identifiant, normaliser, distance, nettoyer };
});
