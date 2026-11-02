/*
 * ════════════════════════════════════════════════════════════════════
 *  OUTILS D'AFFICHAGE (communs à la tablette et aux téléphones)
 * ════════════════════════════════════════════════════════════════════
 *
 *  • GT.h(...)           fabrique des éléments de page sans jamais
 *                        interpréter le texte comme du code : un joueur
 *                        qui s'appellerait « <script> » restera un prénom
 *                        bizarre, pas une faille de sécurité.
 *  • GT.maintenant()     l'heure « du serveur », corrigée du décalage de
 *                        l'horloge de l'appareil. Indispensable pour que
 *                        tous les comptes à rebours tombent à zéro ensemble.
 *  • GT.chrono(...)      une barre de temps qui se vide en douceur.
 *  • GT.memoire          un petit carnet sur l'appareil (le dernier prénom,
 *                        l'identifiant de joueur…), qui ne plante jamais,
 *                        même si le navigateur interdit la mémoire locale.
 *  • GT.formes / couleurs : les quatre réponses ont chacune une couleur
 *                        ET une forme (▲ ◆ ● ■), pour les personnes qui
 *                        distinguent mal certaines couleurs.
 */
(function () {
  'use strict';
  window.GT = window.GT || {};

  /*
   * La palette : « Centre S » par défaut, ou « nuit » (la palette d'origine)
   * avec ?palette=nuit dans l'adresse. Le choix est retenu sur l'appareil ;
   * ?palette=centre-s revient à la palette par défaut. Dans le simulateur,
   * les écrans suivent l'adresse de la page qui les contient.
   */
  (function choisirPalette() {
    let demande = null;
    try { demande = new URLSearchParams(location.search).get('palette'); } catch (e) { /* rien */ }
    if (!demande) { try { demande = new URLSearchParams(window.parent.location.search).get('palette'); } catch (e) { /* cadre d'une autre origine */ } }
    try {
      if (demande) localStorage.setItem('depistage:palette', demande);
      else demande = localStorage.getItem('depistage:palette');
    } catch (e) { /* mémoire locale indisponible : tant pis */ }
    // « labo » par défaut ; « centre-s » (claire) et « nuit » (d'origine) restent disponibles.
    document.documentElement.dataset.palette = (demande === 'nuit' || demande === 'centre-s') ? demande : 'labo';
  })();

  GT.h = function (balise, attributs, ...enfants) {
    const el = document.createElement(balise);
    Object.entries(attributs || {}).forEach(([cle, valeur]) => {
      if (valeur === null || valeur === undefined || valeur === false) return;
      if (cle === 'class') el.className = valeur;
      else if (cle === 'style' && typeof valeur === 'object') Object.assign(el.style, valeur);
      else if (cle.startsWith('on') && typeof valeur === 'function') el.addEventListener(cle.slice(2), valeur);
      else if (cle === 'html') el.innerHTML = valeur; // réservé aux dessins SVG que NOUS fabriquons
      else el.setAttribute(cle, valeur === true ? '' : valeur);
    });
    enfants.flat(Infinity).forEach((e) => {
      if (e === null || e === undefined || e === false) return;
      el.appendChild(e instanceof Node ? e : document.createTextNode(String(e)));
    });
    return el;
  };

  /* L'horloge : à chaque écran reçu, on note l'écart entre l'heure du serveur et la nôtre. */
  let decalage = 0;
  GT.recalerHorloge = (horlogeServeur) => { if (horlogeServeur) decalage = horlogeServeur - Date.now(); };
  GT.maintenant = () => Date.now() + decalage;

  /*
   * Le chronomètre : une barre qui se vide et un nombre de secondes.
   * Tous les chronos actifs sont arrêtés quand l'écran change (GT.arreterChronos),
   * pour ne pas laisser tourner des animations invisibles qui videraient la batterie.
   */
  const chronos = new Set();

  /*
   * Le décompte des 3 dernières secondes : un seul grand chiffre au centre
   * de l'écran, partagé par tous les chronos de la page. Il ne bloque pas
   * les doigts (pointer-events: none), et un petit « tic » de vibration
   * l'accompagne sur les téléphones qui le permettent.
   */
  let zoneDecompte = null;
  let chiffreAffiche = 0;
  function decompte(chiffre) {
    if (chiffre === chiffreAffiche) return;
    chiffreAffiche = chiffre;
    if (!chiffre) { if (zoneDecompte) zoneDecompte.replaceChildren(); return; }
    if (!zoneDecompte) { zoneDecompte = GT.h('div', { class: 'decompte', 'aria-hidden': 'true' }); document.body.appendChild(zoneDecompte); }
    zoneDecompte.replaceChildren(GT.h('span', {}, String(chiffre)));
    if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) { /* rien */ } }
  }

  GT.chrono = function (finA, dureeMs, options) {
    options = options || {};
    const barre = GT.h('div', { class: 'chrono-remplissage' });
    const secondes = GT.h('span', { class: 'chrono-secondes' });
    const bloc = GT.h('div', { class: 'chrono' + (options.grand ? ' chrono-grand' : '') , role: 'timer' }, GT.h('div', { class: 'chrono-piste' }, barre), secondes);
    let actif = true;
    const stop = () => { actif = false; chronos.delete(stop); decompte(0); };
    chronos.add(stop);
    (function boucle() {
      if (!actif) return;
      const reste = Math.max(0, finA - GT.maintenant());
      const part = dureeMs ? reste / dureeMs : 0;
      barre.style.transform = 'scaleX(' + part.toFixed(4) + ')';
      bloc.classList.toggle('chrono-urgent', reste < 5000 && reste > 0);
      secondes.textContent = Math.ceil(reste / 1000) + ' s';
      // 3, 2, 1… sauf si le chrono demande le silence (options.decompte === false).
      if (options.decompte !== false) decompte(reste > 0 && reste <= 3000 ? Math.ceil(reste / 1000) : 0);
      if (reste > 0) requestAnimationFrame(boucle);
      else { decompte(0); if (options.fini) options.fini(); }
    })();
    return bloc;
  };
  GT.arreterChronos = () => { Array.from(chronos).forEach((stop) => stop()); };

  /* Le carnet local. En simulateur, chaque cadre doit avoir le sien : on garde tout en mémoire vive. */
  const vive = {};
  GT.memoire = {
    lire(cle) {
      if (GT.connexion && GT.connexion.simulation) return vive[cle] || null;
      try { return localStorage.getItem('depistage:' + cle); } catch (e) { return vive[cle] || null; }
    },
    ecrire(cle, valeur) {
      vive[cle] = valeur;
      if (GT.connexion && GT.connexion.simulation) return;
      try { localStorage.setItem('depistage:' + cle, valeur); } catch (e) { /* tant pis, la mémoire vive suffit */ }
    },
    effacer(cle) {
      delete vive[cle];
      try { localStorage.removeItem('depistage:' + cle); } catch (e) { /* rien */ }
    }
  };

  /*
   * Les jeux rangés par famille. Chaque famille a son titre, sa phrase et
   * une touche « Tout » / « Aucun ». « carte » fabrique la carte d'un jeu ;
   * « changer » est appelé après chaque modification de la sélection.
   */
  GT.familles = function (categories, fiches, selection, carte, changer) {
    const groupes = categories.length ? categories : [{ id: 'tous', nom: 'Les jeux', sous: '' }];
    return GT.h('div', { class: 'familles' }, groupes.map((c) => {
      const siens = fiches.filter((f) => !categories.length || f.categorie === c.id);
      if (!siens.length) return null;
      const tous = siens.every((f) => selection.has(f.id));
      return GT.h('section', { class: 'famille cat-' + c.id },
        GT.h('div', { class: 'famille-tete' },
          GT.h('div', {}, GT.h('h4', {}, c.nom), c.sous ? GT.h('span', { class: 'muet' }, c.sous) : null),
          GT.h('button', { class: 'bouton bouton-petit bouton-discret', type: 'button', onclick: () => { siens.forEach((f) => (tous ? selection.delete(f.id) : selection.add(f.id))); changer(); } }, tous ? 'Aucun' : 'Tout')),
        GT.h('div', { class: 'grille-jeux' }, siens.map(carte)));
    }));
  };

  /*
   * Les confettis de la victoire : une centaine de petits rectangles aux
   * couleurs de la charte, qui tombent pendant quelques secondes puis
   * disparaissent. Rien ne se passe si la personne a demandé à son
   * appareil de réduire les animations.
   */
  GT.confettis = function () {
    try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { /* rien */ }
    const couleurs = ['#8383F7', '#FF5D5D', '#FF8E4F', '#83ACF7', '#E8A9CC', '#F1EDE5'];
    const zone = GT.h('div', { class: 'confettis', 'aria-hidden': 'true' });
    for (let i = 0; i < 110; i++) {
      zone.appendChild(GT.h('i', { style: {
        left: (Math.random() * 100) + 'vw', background: couleurs[i % couleurs.length],
        animationDelay: (Math.random() * 1.2) + 's', animationDuration: (2.6 + Math.random() * 2) + 's',
        transform: 'rotate(' + Math.round(Math.random() * 360) + 'deg)', width: (6 + Math.random() * 6) + 'px', height: (10 + Math.random() * 8) + 'px'
      } }));
    }
    document.body.appendChild(zone);
    setTimeout(() => zone.remove(), 6000);
  };

  GT.formes = ['▲', '◆', '●', '■'];
  GT.classesChoix = ['choix-a', 'choix-b', 'choix-c', 'choix-d'];

  /* Un petit message qui apparaît puis disparaît tout seul. */
  GT.bulle = function (texte, type) {
    let zone = document.getElementById('bulles');
    if (!zone) { zone = GT.h('div', { id: 'bulles', 'aria-live': 'polite' }); document.body.appendChild(zone); }
    const b = GT.h('div', { class: 'bulle ' + (type || '') }, texte);
    zone.appendChild(b);
    setTimeout(() => b.classList.add('bulle-part'), 2600);
    setTimeout(() => b.remove(), 3200);
  };

  /* Les places au classement : 1er, 2e, 3e… */
  GT.rang = (n) => (n === 1 ? '1er' : n + 'e');
  GT.points = (n) => new Intl.NumberFormat('fr-BE').format(n) + ' pts';

  /* Empêche l'écran de s'éteindre pendant la partie, quand l'appareil le permet. */
  GT.garderEcranAllume = async function () {
    try { if ('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch (e) { /* refusé : pas grave */ }
  };
})();
