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
  GT.chrono = function (finA, dureeMs, options) {
    options = options || {};
    const barre = GT.h('div', { class: 'chrono-remplissage' });
    const secondes = GT.h('span', { class: 'chrono-secondes' });
    const bloc = GT.h('div', { class: 'chrono' + (options.grand ? ' chrono-grand' : '') , role: 'timer' }, GT.h('div', { class: 'chrono-piste' }, barre), secondes);
    let actif = true;
    // Le compte à rebours final (3… 2… 1…) : seulement pour les vrais chronos de jeu (pas les attentes « calmes »),
    // et seulement pour les secondes qui passent sous nos yeux (pas celles déjà écoulées à l'affichage).
    const avecDecompte = !options.calme && dureeMs >= 4000;
    let derniereSeconde = Math.ceil(Math.max(0, finA - GT.maintenant()) / 1000);
    const stop = () => { actif = false; chronos.delete(stop); };
    chronos.add(stop);
    (function boucle() {
      if (!actif) return;
      const reste = Math.max(0, finA - GT.maintenant());
      const part = dureeMs ? reste / dureeMs : 0;
      barre.style.transform = 'scaleX(' + part.toFixed(4) + ')';
      bloc.classList.toggle('chrono-urgent', reste < 5000 && reste > 0);
      const s = Math.ceil(reste / 1000);
      secondes.textContent = s + ' s';
      if (avecDecompte && s < derniereSeconde && s <= 3) GT.annoncerDecompte(s, options);
      derniereSeconde = s;
      if (reste > 0) requestAnimationFrame(boucle);
      else if (options.fini) options.fini();
    })();
    return bloc;
  };

  /*
   * Le compte à rebours stressant des 3 dernières secondes.
   * À l'écran : le bord qui pulse en rouge et, sur la tablette, un chiffre
   * géant qui surgit (3, 2, 1…). Le son et les vibrations sont confiés à
   * la page (GT.surDecompte), qui sait si l'animateur veut du son ou non.
   */
  GT.chiffreGeant = false; // la tablette l'active ; sur un téléphone, il cacherait les réponses
  GT.surDecompte = null;
  let minuteurDecompte = null;
  GT.annoncerDecompte = function (n, options) {
    options = options || {};
    document.body.classList.toggle('compte-final', n > 0);
    clearTimeout(minuteurDecompte);
    if (GT.chiffreGeant) {
      let geant = document.getElementById('decompte-geant');
      if (!geant) { geant = GT.h('div', { id: 'decompte-geant', 'aria-hidden': 'true' }); document.body.appendChild(geant); }
      geant.textContent = n > 0 ? String(n) : (options.depart ? 'C\'est parti !' : 'Temps écoulé !');
      geant.className = 'pop' + (n === 0 ? ' fin' : '') + (options.depart ? ' depart' : '');
      void geant.offsetWidth; // relance l'animation
      geant.classList.add('visible');
    }
    if (n === 0) minuteurDecompte = setTimeout(GT.effacerDecompte, 900);
    if (typeof GT.surDecompte === 'function') { try { GT.surDecompte(n, options); } catch (e) { /* un son raté ne doit rien casser */ } }
  };
  GT.effacerDecompte = function () {
    clearTimeout(minuteurDecompte);
    document.body.classList.remove('compte-final');
    const geant = document.getElementById('decompte-geant');
    if (geant) geant.className = '';
  };
  GT.arreterChronos = () => { Array.from(chronos).forEach((stop) => stop()); GT.effacerDecompte(); };

  /* Le carnet local. En simulateur, chaque cadre doit avoir le sien : on garde tout en mémoire vive. */
  const vive = {};
  GT.memoire = {
    lire(cle) {
      if (GT.connexion && GT.connexion.simulation) return vive[cle] || null;
      try { return localStorage.getItem('tablee:' + cle); } catch (e) { return vive[cle] || null; }
    },
    ecrire(cle, valeur) {
      vive[cle] = valeur;
      if (GT.connexion && GT.connexion.simulation) return;
      try { localStorage.setItem('tablee:' + cle, valeur); } catch (e) { /* tant pis, la mémoire vive suffit */ }
    },
    effacer(cle) {
      delete vive[cle];
      try { localStorage.removeItem('tablee:' + cle); } catch (e) { /* rien */ }
    }
  };

  GT.formes = ['▲', '◆', '●', '■'];
  GT.classesChoix = ['choix-a', 'choix-b', 'choix-c', 'choix-d'];

  /* Un petit message qui apparaît puis disparaît tout seul. */
  GT.bulle = function (texte, type, dureeMs) {
    let zone = document.getElementById('bulles');
    if (!zone) { zone = GT.h('div', { id: 'bulles', 'aria-live': 'polite' }); document.body.appendChild(zone); }
    const b = GT.h('div', { class: 'bulle ' + (type || '') }, texte);
    zone.appendChild(b);
    const duree = dureeMs || 2600;
    setTimeout(() => b.classList.add('bulle-part'), duree);
    setTimeout(() => b.remove(), duree + 600);
  };

  /*
   * Le cadre du zoom infernal, partagé par la tablette et les téléphones.
   * L'image est agrandie autour d'un point, puis ramenée à sa taille au
   * rythme du chronomètre (courbe exponentielle : longtemps flou, puis
   * tout s'accélère). « mini » donne la version de poche du téléphone.
   */
  GT.cadreZoom = function (z, finA, dureeMs, revele, mini) {
    const contenu = z.photo
      ? GT.h('img', { src: z.photo, alt: '', draggable: 'false' })
      : GT.h('span', { class: 'zoom-emoji', 'aria-hidden': 'true' }, z.image || '❔');
    const toile = GT.h('div', { class: 'zoom-contenu', style: { transformOrigin: z.origineX + '% ' + z.origineY + '%' } }, contenu);
    const cadre = GT.h('div', { class: 'zoom-cadre' + (revele ? ' zoom-revele' : '') + (mini ? ' zoom-cadre-mini' : ''), role: 'img', 'aria-label': revele ? 'L\'image entière' : 'Une image très agrandie qui se dévoile peu à peu' }, toile);
    if (revele) { toile.style.transform = 'scale(1)'; return cadre; }
    const depart = z.depart || 14;
    toile.style.transform = 'scale(' + depart + ')';
    (function boucle() {
      if (!toile.isConnected && cadre.dataset.pose) return; // l'écran a changé : on arrête
      cadre.dataset.pose = '1';
      const reste = Math.max(0, finA - GT.maintenant());
      const avancee = dureeMs ? 1 - reste / dureeMs : 1;
      toile.style.transform = 'scale(' + Math.pow(depart, 1 - avancee).toFixed(4) + ')';
      if (reste > 0) requestAnimationFrame(boucle);
    })();
    return cadre;
  };

  /*
   * L'illustration d'une question : une ou plusieurs lignes de grandes
   * tuiles (des émojis, des nombres, des « + » et des « = »…). Elle sert
   * à la mémoire (la grille à retenir), au casse-tête (la suite, la
   * balance) et aux Toqués (les ingrédients de la recette mystère).
   *   ill.lignes       : [[tuile, tuile…], …] — une tuile est un texte
   *   ill.colonnes     : affiche les tuiles en grille de N colonnes (mémoire)
   *   ill.apparitionMs : les tuiles apparaissent une à une, à ce rythme,
   *                      à partir de l'instant « options.debut » (recette mystère)
   */
  GT.illustration = function (ill, options) {
    options = options || {};
    const tuiles = [];
    const classeTuile = (t) => 'ill-tuile' + (/^[+=×−÷-]$/.test(t) ? ' ill-op' : '') + (t === '?' ? ' ill-mystere' : '') + (/^\d+$/.test(t) ? ' ill-nombre' : '');
    const lignes = (ill.lignes || []).map((ligne) => GT.h('div', { class: 'ill-ligne', style: ill.colonnes ? { gridTemplateColumns: 'repeat(' + ill.colonnes + ', 1fr)' } : null },
      ligne.map((t) => { const el = GT.h('span', { class: classeTuile(String(t)) }, String(t)); tuiles.push(el); return el; })));
    const bloc = GT.h('div', { class: 'illustration' + (ill.colonnes ? ' ill-grille' : '') + (ill.mot ? ' ill-mot' : '') + (options.mini ? ' ill-mini' : ''), 'aria-hidden': 'true' }, lignes);
    // L'apparition une à une : chaque tuile attend son tour, calé sur l'horloge commune.
    if (ill.apparitionMs && options.debut && !options.toutVoir) {
      tuiles.forEach((el, i) => {
        const delai = options.debut + i * ill.apparitionMs - GT.maintenant();
        if (delai > 0) { el.classList.add('ill-cache'); setTimeout(() => el.classList.remove('ill-cache'), delai); }
      });
    }
    return bloc;
  };

  /*
   * Un drapeau, dessiné en SVG à partir de sa description (voir
   * moteur/contenus/drapeaux.js) : rectangles, disques, cercles,
   * polygones et bandes en biais. Net à toutes les tailles.
   */
  GT.drapeau = function (d, options) {
    options = options || {};
    const NS = 'http://www.w3.org/2000/svg';
    const el = (nom, attributs) => { const e = document.createElementNS(NS, nom); Object.entries(attributs).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
    const svg = el('svg', { viewBox: '0 0 ' + d.l + ' ' + d.h, class: 'drapeau' + (options.mini ? ' drapeau-mini' : ''), role: 'img', 'aria-label': 'Un drapeau' });
    (d.formes || []).forEach((f) => {
      if (f.r) svg.appendChild(el('rect', { x: f.r[0], y: f.r[1], width: f.r[2], height: f.r[3], fill: f.c }));
      else if (f.o && f.trait) svg.appendChild(el('circle', { cx: f.o[0], cy: f.o[1], r: f.o[2], fill: 'none', stroke: f.c, 'stroke-width': f.trait }));
      else if (f.o) svg.appendChild(el('circle', { cx: f.o[0], cy: f.o[1], r: f.o[2], fill: f.c }));
      else if (f.p) svg.appendChild(el('polygon', { points: f.p.map((pt) => pt.join(',')).join(' '), fill: f.c }));
      else if (f.l) svg.appendChild(el('line', { x1: f.l[0], y1: f.l[1], x2: f.l[2], y2: f.l[3], stroke: f.c, 'stroke-width': f.e || 10 }));
    });
    return GT.h('div', { class: 'cadre-drapeau' + (options.mini ? ' cadre-drapeau-mini' : '') }, svg);
  };

  /*
   * Le puzzle 🖼️ : l'image (un émoji ou une photo) découpée en 3 × 3
   * pièces. Au départ, chaque pièce est dans la mauvaise case et tournée ;
   * puis, une à une (dans l'ordre p.rythme), elles glissent à leur place
   * pendant les 70 premiers pourcents du temps, calées sur l'horloge commune.
   *   p.ordre[i] : la case de départ de la pièce i     p.tours[i] : sa rotation
   *   finA, dureeMs : la fin et la durée de la question (0, 0 = puzzle terminé)
   */
  GT.puzzle = function (p, finA, dureeMs, options) {
    options = options || {};
    const fini = p.fini || !dureeMs;
    const debut = finA - dureeMs;
    const pieces = [];
    for (let i = 0; i < 9; i++) {
      const col = i % 3, lig = Math.floor(i / 3);
      const image = p.photo
        ? GT.h('img', { src: p.photo, alt: '', draggable: 'false', class: 'puzzle-image' })
        : GT.h('span', { class: 'puzzle-image puzzle-emoji' }, p.image || '❔');
      image.style.left = (-col * 100) + '%';
      image.style.top = (-lig * 100) + '%';
      const piece = GT.h('div', { class: 'puzzle-piece' }, image);
      piece.style.left = (col * 100 / 3) + '%';
      piece.style.top = (lig * 100 / 3) + '%';
      const placer = () => { piece.style.transform = 'none'; piece.classList.add('puzzle-en-place'); };
      const depart = p.ordre[i];
      const dx = ((depart % 3) - col) * 100, dy = (Math.floor(depart / 3) - lig) * 100;
      const instant = debut + dureeMs * 0.7 * (p.rythme.indexOf(i) + 1) / 9;
      const delai = instant - GT.maintenant();
      if (fini || delai <= 0) placer();
      else {
        piece.style.transform = 'translate(' + dx + '%, ' + dy + '%) rotate(' + p.tours[i] + 'deg)';
        setTimeout(placer, delai);
      }
      pieces.push(piece);
    }
    return GT.h('div', { class: 'puzzle-cadre' + (options.mini ? ' puzzle-mini' : '') + (fini ? ' puzzle-fini' : ''), role: 'img', 'aria-label': fini ? 'Le puzzle terminé' : 'Un puzzle qui se reconstruit' }, pieces);
  };

  /* Les places au classement : 1er, 2e, 3e… */
  GT.rang = (n) => (n === 1 ? '1er' : n + 'e');
  GT.points = (n) => new Intl.NumberFormat('fr-BE').format(n) + ' pts';

  /* Empêche l'écran de s'éteindre pendant la partie, quand l'appareil le permet. */
  GT.garderEcranAllume = async function () {
    try { if ('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch (e) { /* refusé : pas grave */ }
  };
})();
