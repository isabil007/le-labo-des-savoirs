/*
 * ════════════════════════════════════════════════════════════════════
 *  LE MODE SOLO : un seul téléphone, un seul QR code
 * ════════════════════════════════════════════════════════════════════
 *
 *  D'habitude, deux appareils se partagent le travail : la tablette (qui
 *  ouvre la salle, lance la partie, joue la musique et les extraits du
 *  blind test) et le téléphone (la manette). En mode solo, le téléphone
 *  fait les deux. Ce fichier ouvre, en coulisses, une DEUXIÈME ligne vers
 *  le serveur, qui se présente comme une tablette invisible :
 *
 *    1. elle ouvre une salle rien que pour ce téléphone (ou reprend la
 *       sienne si l'écran s'était mis en veille) ;
 *    2. le téléphone rejoint cette salle tout seul, sans code à taper ;
 *    3. le bouton « Lancer ma partie » demande une partie surprise « au fil
 *       des thèmes » : chaque question change de thème (le grand mélange),
 *       avec un jeu d'action (Feu vert, mémoire, 7 erreurs) entre deux séries ;
 *       pendant la partie, ⏸ met en pause et ⏭ passe à la suite ;
 *    4. pendant la partie, elle joue la musique, le son du compte à
 *       rebours et les extraits du blind test, sur le haut-parleur du
 *       téléphone ;
 *    5. au podium, « Rejouer » relance une partie.
 *
 *  Le reste du téléphone (joueur.js) ne change pas : il reçoit les mêmes
 *  écrans qu'en famille. Ce mode est une OPTION : la page normale des
 *  joueurs (/jouer) et la tablette fonctionnent exactement comme avant.
 *
 *  Ce fichier doit être chargé AVANT joueur.js (qui regarde si GT.solo
 *  existe pour adapter son formulaire), après commun.js et musique.js.
 */
(function () {
  'use strict';
  const { h } = GT;

  const reglages = {
    musique: GT.memoire.lire('solo-musique') !== 'non',
    son: GT.memoire.lire('solo-son') !== 'non'
  };

  /* ─── La ligne « tablette invisible » ─── */
  let ws = null;
  let attente = 1000;
  function envoyer(e, d) { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ e, d })); }

  function ouvrir() {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ligne');
    ws.onopen = () => {
      attente = 1000;
      // Une salle déjà ouverte pour ce téléphone ? On la reprend (l'écran s'était peut-être mis en veille).
      const code = GT.memoire.lire('solo-code');
      envoyer(code ? 'tablette:reprendre' : 'tablette:creer', { code });
    };
    ws.onmessage = (m) => {
      let message;
      try { message = JSON.parse(m.data); } catch (e) { return; }
      if (!message) return;
      if (message.e === 'salle:creee') {
        GT.solo.code = message.d.code;
        GT.memoire.ecrire('solo-code', message.d.code);
      } else if (message.e === 'ecran') suivreEcran(message.d.type, message.d.donnees || {});
    };
    ws.onclose = () => { setTimeout(ouvrir, attente); attente = Math.min(6000, attente * 1.6); };
    ws.onerror = () => { try { ws.close(); } catch (e) { /* rien */ } };
  }
  setInterval(() => envoyer('ping'), 25000);

  /*
   * Ce que la « tablette » est censée afficher nous dit quoi faire du son :
   * l'extrait du blind test, et le volume de la musique (normale entre les
   * manches, douce pendant les questions, muette pendant le blind test et
   * Feu vert !, plus rapide pendant la Grande Finale).
   */
  const ECRANS_CALMES = ['qcm-question', 'erreurs-tableau', 'memoire-montre'];
  let dernier = { type: 'salon', donnees: {} };
  function suivreEcran(type, d) {
    dernier = { type, donnees: d };
    majBoutonPause();
    if (type === 'qcm-question' && d.extrait && GT.extraits) {
      cacherBoutonEcoute();
      GT.extraits.jouer(d.extrait.artiste, d.extrait.titre).catch((e) => {
        // Le téléphone a trouvé l'extrait mais refuse de le jouer sans un toucher : on propose un gros bouton.
        if (e && e.name === 'NotAllowedError') return montrerBoutonEcoute(d.extrait);
        envoyer('tablette:signal', { type: 'extrait-indisponible', numero: d.extrait.numero });
      });
    } else if (type !== 'qcm-question' && type !== 'qcm-revelation' && GT.extraits) { GT.extraits.arreter(); cacherBoutonEcoute(); }
    reglerAmbiance();
  }
  function reglerAmbiance() {
    if (!GT.ambiance) return;
    // Blind test : le synthétiseur se met entièrement en veille pour laisser le haut-parleur à l'extrait.
    if (GT.musique) GT.musique.silence(!figee && !!dernier.donnees.extrait && (dernier.type === 'qcm-question' || dernier.type === 'qcm-revelation'));
    if (figee) return GT.ambiance.niveau('muet');
    if (!reglages.musique) return GT.ambiance.arreter();
    const { type, donnees } = dernier;
    GT.ambiance.demarrer();
    if (type === 'intro') GT.ambiance.finale(!!donnees.finale);
    else if (type === 'salon' || type === 'podium') GT.ambiance.finale(false);
    if (/^reflexe/.test(type) || donnees.extrait) GT.ambiance.niveau('muet');
    else if (ECRANS_CALMES.includes(type)) GT.ambiance.niveau('doux');
    else GT.ambiance.niveau('normal');
  }

  /* Le filet de sécurité du blind test : « 🔊 Touche ici pour écouter ». */
  let boutonEcoute = null;
  function montrerBoutonEcoute(extrait) {
    cacherBoutonEcoute();
    boutonEcoute = h('button', { class: 'bouton bouton-ecoute-solo', onclick: () => {
      GT.extraits.jouer(extrait.artiste, extrait.titre).then(cacherBoutonEcoute, () => envoyer('tablette:signal', { type: 'extrait-indisponible', numero: extrait.numero }));
    } }, '🔊 Touche ici pour écouter');
    document.body.appendChild(boutonEcoute);
  }
  function cacherBoutonEcoute() { if (boutonEcoute) { boutonEcoute.remove(); boutonEcoute = null; } }

  /* Le compte à rebours : joueur.js fait vibrer le téléphone ; on ajoute le son, si on le veut. */
  function brancherDecompte() {
    const vibrer = GT.surDecompte;
    GT.surDecompte = (n, options) => {
      if (vibrer) vibrer(n, options);
      if (reglages.son && GT.musique && GT.musique.pret()) GT.musique.decompte(n, options.depart);
      if (n === 3 && GT.ambiance && GT.ambiance.enCours()) GT.ambiance.niveau('doux');
    };
  }

  /* Le premier toucher d'écran autorise le son (règle des navigateurs). */
  function debloquerSon() {
    if (GT.musique) GT.musique.debloquer();
    if (GT.extraits) GT.extraits.debloquer();
    reglerAmbiance();
  }
  document.addEventListener('pointerdown', debloquerSon, { once: true });

  /*
   * ─── LA PAUSE ⏸ ───
   * Un bouton rond, en bas à droite, pendant toute la partie. En pause,
   * le moteur fige le jeu (le chrono s'arrête, les touches ne comptent
   * plus), la musique se tait, et un grand panneau propose de reprendre
   * ou de terminer la partie. Si l'on quitte l'écran du téléphone (appel,
   * message, écran verrouillé…), la pause se met toute seule.
   */
  let figee = false;
  const pausePossible = () => !['salon', 'podium'].includes(dernier.type) && !/^gages/.test(dernier.type);
  const boutonPause = h('button', { class: 'bouton-pause-solo', 'aria-label': 'Mettre en pause', hidden: true, onclick: () => mettreEnPause() }, '⏸');
  // ⏭ Suivant : révèle la réponse tout de suite, ou passe à la question (ou au jeu) suivante.
  let dernierSaut = 0;
  const boutonSuivant = h('button', { class: 'bouton-pause-solo bouton-suivant-solo', 'aria-label': 'Passer à la suite', hidden: true, onclick: () => {
    if (Date.now() - dernierSaut < 700) return;   // un double toucher ne doit pas sauter deux étapes
    dernierSaut = Date.now();
    if (navigator.vibrate) navigator.vibrate(20);
    envoyer('tablette:passer');
  } }, '⏭');
  const panneau = h('div', { class: 'panneau-pause', role: 'dialog', 'aria-label': 'Pause', hidden: true },
    h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, '⏸'),
    h('h2', {}, 'Pause'),
    h('p', {}, 'Le temps est arrêté : prends ton temps !'),
    h('button', { class: 'bouton', onclick: () => reprendre() }, '▶️ Reprendre'),
    h('button', { class: 'bouton bouton-discret', onclick: () => { reprendre(); envoyer('tablette:podium'); } }, '🏁 Terminer la partie'));
  function majBoutonPause() { boutonPause.hidden = figee || !pausePossible(); boutonSuivant.hidden = boutonPause.hidden; }
  function mettreEnPause() {
    if (figee || !pausePossible()) return;
    figee = true;
    envoyer('tablette:figer');
    if (GT.extraits) GT.extraits.arreter();
    reglerAmbiance();
    GT.arreterChronos();               // le compte à rebours s'arrête aussi à l'écran
    panneau.hidden = false;
    majBoutonPause();
  }
  function reprendre() {
    if (!figee) return;
    figee = false;
    panneau.hidden = true;
    envoyer('tablette:relancer');      // le moteur renvoie l'écran du moment, avec le temps qu'il restait
    majBoutonPause();
  }
  window.addEventListener('DOMContentLoaded', () => document.body.append(boutonSuivant, boutonPause, panneau));
  document.addEventListener('visibilitychange', () => { if (document.hidden) mettreEnPause(); });

  GT.solo = {
    code: null,

    /* L'écran d'accueil du mode solo : les réglages du son, et le grand bouton. */
    ecranSalon(etat) {
      // Un interrupteur : il change d'aspect tout seul quand on le touche.
      const bascule = (cle, memoire, oui, non) => {
        const bouton = h('button', {
          class: 'bouton bouton-petit bouton-discret bouton-son', 'aria-pressed': String(reglages[cle]),
          onclick: () => {
            reglages[cle] = !reglages[cle];
            GT.memoire.ecrire(memoire, reglages[cle] ? 'oui' : 'non');
            bouton.textContent = reglages[cle] ? oui : non;
            bouton.setAttribute('aria-pressed', String(reglages[cle]));
            debloquerSon();
          }
        }, reglages[cle] ? oui : non);
        return bouton;
      };
      const boutons = h('div', { class: 'gagnants', style: { justifyContent: 'center' } },
        bascule('musique', 'solo-musique', '🎵 Musique', '🔇 Musique'),
        bascule('son', 'solo-son', '🔔 Décompte', '🔕 Décompte'));
      return h('div', { class: 'centre' },
        h('span', { class: 'etiquette' }, '👤 Mode solo'),
        h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, etat.avatar),
        h('h2', {}, 'Prêt·e, ' + etat.nom + ' ?'),
        h('p', {}, 'Une partie rien que pour toi : chaque question change de thème (quiz, drapeau, recette, tube…), avec un jeu d\'action entre deux séries. Bats ton propre record !'),
        h('button', { class: 'bouton', onclick: () => GT.solo.lancer() }, '🎲 Lancer ma partie'),
        h('p', { class: 'muet', style: { fontSize: '.9rem' } }, 'Pendant la partie : ⏸ pour faire une pause, ⏭ pour passer à la suite.'),
        boutons,
        h('p', { class: 'muet', style: { fontSize: '.9rem' } }, 'Monte le son pour la musique et le blind test. Dessine et devine et Les Fous Rires se jouent à plusieurs : ils sont mis de côté en solo.'));
    },

    lancer() {
      debloquerSon();
      if (GT.garderEcranAllume) GT.garderEcranAllume();
      // Le « fil des thèmes » : chaque question change de thème, avec un jeu d'action entre deux séries.
      envoyer('tablette:lancer', { mode: 'surprise', filDesThemes: true });
    },

    rejouer() {
      debloquerSon();
      envoyer('tablette:nouvelle');
    }
  };

  ouvrir();
  // joueur.js définit GT.surDecompte en se chargeant : on s'y branche juste après.
  window.addEventListener('DOMContentLoaded', brancherDecompte);
})();
