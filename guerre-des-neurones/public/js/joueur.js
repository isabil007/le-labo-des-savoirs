/*
 * ════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN DU TÉLÉPHONE (une manette dans la poche de chaque joueur)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Le téléphone est volontairement simple : de grosses touches, peu de
 *  texte, et le regard tourné vers la tablette. Il sert à :
 *    • rejoindre la table (code + prénom + avatar) ;
 *    • répondre aux questions (quatre touches de couleur) ;
 *    • dessiner du bout du doigt, ou taper ce que l'on devine ;
 *    • chercher les sept erreurs ;
 *    • envoyer des réactions aux autres joueurs (le bouton 💬).
 *
 *  Comme pour la tablette, chaque type d'écran envoyé par le moteur a
 *  sa fonction de rendu, rangée dans l'objet ECRANS.
 *
 *  Le téléphone retient son identifiant de joueur : s'il se met en
 *  veille ou si la page se recharge, il revient automatiquement à sa
 *  place, avec son score, sans rien retaper.
 */
(function () {
  'use strict';
  const { h } = GT;
  const cnx = GT.connexion;

  const AVATARS = ['🦊', '🐻', '🐼', '🐸', '🦉', '🐙', '🦁', '🐯', '🐨', '🐵', '🐧', '🦄', '🐢', '🐝', '🦔', '🐳'];
  const REACTIONS = ['👏', '😂', '😮', '❤️', '🔥', '🤔', '😜', '🏆'];

  const parametres = new URLSearchParams(location.search);
  const etat = {
    joueurId: GT.memoire.lire('joueur-id'),
    code: (parametres.get('code') || GT.memoire.lire('joueur-code') || '').toUpperCase(),
    nom: GT.memoire.lire('joueur-nom') || '',
    avatar: GT.memoire.lire('joueur-avatar') || AVATARS[Math.floor(Math.random() * AVATARS.length)],
    accepte: false,
    salle: null,
    ecran: null,
    dessin: null,   // l'état de l'atelier de dessin
    erreurs: null   // l'état de la partie de 7 erreurs
  };
  // En mode solo, on ne retourne QUE dans la salle ouverte par ce téléphone (jamais dans une partie en famille).
  if (GT.solo) {
    const codeSolo = GT.memoire.lire('solo-code');
    if (!codeSolo || codeSolo !== etat.code) etat.joueurId = null;
    etat.code = codeSolo || '';
  }
  // Si l'adresse contient le code d'une AUTRE salle, l'ancien identifiant ne vaut plus.
  if (parametres.get('code') && parametres.get('code').toUpperCase() !== GT.memoire.lire('joueur-code')) etat.joueurId = null;

  const ecran = document.getElementById('ecran');
  const entete = document.getElementById('entete');

  /* ═══════════ La ligne avec le moteur ═══════════ */

  cnx.on('ouverte', () => {
    document.getElementById('hors-ligne').hidden = true;
    if (etat.joueurId && etat.code) cnx.emit('joueur:rejoindre', { code: etat.code, joueurId: etat.joueurId });
    else if (!etat.accepte) afficherFormulaire();
  });
  cnx.on('fermee', () => { document.getElementById('hors-ligne').hidden = false; });

  cnx.on('joueur:accepte', (d) => {
    Object.assign(etat, { accepte: true, joueurId: d.joueurId, code: d.code, nom: d.nom, avatar: d.avatar });
    GT.memoire.ecrire('joueur-id', d.joueurId);
    GT.memoire.ecrire('joueur-code', d.code);
    GT.memoire.ecrire('joueur-nom', d.nom);
    GT.memoire.ecrire('joueur-avatar', d.avatar);
    GT.garderEcranAllume();
    majEntete();
  });

  cnx.on('erreur', (e) => {
    if (!etat.accepte) {
      // Une tentative de retour qui échoue (la salle n'existe plus) : on repart du formulaire.
      etat.joueurId = null;
      GT.memoire.effacer('joueur-id');
      afficherFormulaire(e.message);
    } else GT.bulle(e.message, 'alerte');
  });

  cnx.on('expulse', (e) => {
    etat.accepte = false;
    etat.joueurId = null;
    GT.memoire.effacer('joueur-id');
    entete.hidden = true;
    afficherFormulaire(e.message);
  });

  cnx.on('salle:etat', (d) => {
    etat.salle = d;
    majEntete();
    if (etat.ecran && etat.ecran.type === 'salon') afficher('salon', {});
  });

  cnx.on('ecran', (m) => { GT.recalerHorloge(m.horloge); afficher(m.type, m.donnees); });
  cnx.on('evenement', (ev) => { const f = EVENEMENTS[ev.type]; if (f) f(ev.donnees); });

  cnx.on('reaction', (r) => {
    // Un message écrit reste affiché un peu plus longtemps, le temps de le lire.
    GT.bulle(r.de.avatar + ' ' + r.de.nom + (r.vers ? ' → toi' : ' → tout le monde') + ' : ' + r.emoji + (r.texte ? ' « ' + r.texte + ' »' : ''), '', r.texte ? 5000 : 2600);
    if (navigator.vibrate) navigator.vibrate(40);
  });

  /* ═══════════ L'en-tête (qui je suis, mon score, les réactions) ═══════════ */

  function moi() {
    return etat.salle && etat.salle.joueurs.find((j) => j.id === etat.joueurId);
  }

  function majEntete() {
    if (!etat.accepte) return;
    const m = moi();
    entete.hidden = false;
    entete.replaceChildren(
      h('span', { class: 'avatar', 'aria-hidden': 'true' }, etat.avatar),
      h('div', { class: 'qui' }, h('strong', {}, etat.nom), h('span', {}, GT.points(m ? m.score : 0) + ' · salle ' + etat.code)),
      h('button', { class: 'bouton-reagir', 'aria-label': 'Envoyer une réaction', onclick: () => ouvrirReactions(null) }, '💬')
    );
  }

  /*
   * La feuille de réactions : on choisit à qui l'envoyer (tout le monde
   * ou un joueur précis), puis l'émoji. C'est le canal direct entre les
   * joueurs : on félicite Mamie, on taquine le cousin.
   */
  /* Quelques petits mots tout prêts, pour ceux qui n'aiment pas taper sur un téléphone. */
  const MOTS_TOUT_PRETS = ['Bien joué ! 👏', 'Même pas peur 😎', 'Tu vas voir au prochain tour…', 'Chapeau bas 🎩', 'Coup de chance !', 'Je t\'ai à l\'œil 👀'];

  function ouvrirReactions(destinataire) {
    let vers = destinataire;
    let brouillon = '';
    const autres = etat.salle ? etat.salle.joueurs.filter((j) => j.id !== etat.joueurId && j.connecte) : [];
    const voile = h('div', { class: 'voile', onclick: fermer });
    const feuille = h('div', { class: 'feuille-reactions', role: 'dialog', 'aria-label': 'Envoyer une réaction' });
    function fermer() { voile.remove(); feuille.remove(); }
    function dessiner() {
      feuille.replaceChildren(
        h('strong', {}, 'Envoyer une réaction à…'),
        h('div', { class: 'destinataires' },
          h('button', { 'aria-pressed': String(!vers), onclick: () => { vers = null; dessiner(); } }, 'Tout le monde'),
          autres.map((j) => h('button', { 'aria-pressed': String(vers === j.id), onclick: () => { vers = j.id; dessiner(); } }, j.avatar + ' ' + j.nom))),
        h('div', { class: 'emojis' }, REACTIONS.map((e) => h('button', {
          'aria-label': 'Envoyer ' + e,
          onclick: () => { cnx.emit('joueur:reaction', { vers, emoji: e }); fermer(); GT.bulle('Envoyé ' + e, 'succes'); }
        }, e))),
        // Le petit mot écrit : on tape son message (ou on en choisit un tout prêt), puis « Envoyer ».
        h('form', { class: 'petit-mot', onsubmit: (ev) => { ev.preventDefault(); envoyerMot(brouillon); } },
          h('input', {
            type: 'text', maxlength: '80', placeholder: 'Ou écris un petit mot…', value: brouillon, 'aria-label': 'Ton message',
            enterkeyhint: 'send', autocomplete: 'off',
            oninput: (ev) => { brouillon = ev.target.value; }
          }),
          h('button', { class: 'bouton bouton-petit', type: 'submit' }, 'Envoyer')),
        h('div', { class: 'mots-prets' }, MOTS_TOUT_PRETS.map((m) => h('button', { type: 'button', onclick: () => envoyerMot(m) }, m))),
        h('button', { class: 'bouton bouton-discret', onclick: fermer }, 'Fermer'));
    }
    function envoyerMot(texte) {
      texte = String(texte || '').trim();
      if (!texte) return;
      cnx.emit('joueur:reaction', { vers, texte });
      fermer();
      GT.bulle('Message envoyé 💬', 'succes');
    }
    dessiner();
    document.body.append(voile, feuille);
  }

  /* Les 3 dernières secondes : le bord de l'écran pulse en rouge (commun.js) et le téléphone vibre. */
  GT.surDecompte = (n, options) => {
    if (!navigator.vibrate) return;
    if (n > 0) navigator.vibrate(n === 1 ? [90, 60, 90] : 70);
    else if (!options.depart) navigator.vibrate(260);
  };

  /* ═══════════ Le changement d'écran ═══════════ */

  function afficher(type, donnees) {
    const rendu = ECRANS[type];
    if (!rendu) return;
    GT.arreterChronos();
    clearInterval(etat.murmures); // on coupe les petits encouragements de l'écran précédent
    etat.ecran = { type, donnees };
    ecran.replaceChildren(rendu(donnees));
    window.scrollTo(0, 0);
    if (rendu.apres) rendu.apres(donnees);
  }

  /* ═══════════ Le formulaire pour rejoindre ═══════════ */

  function afficherFormulaire(message) {
    etat.ecran = { type: 'formulaire' };
    entete.hidden = true;
    let avatar = etat.avatar;
    const grille = h('div', { class: 'choix-avatars', role: 'group', 'aria-label': 'Choisis ton avatar' });
    const dessinerAvatars = () => grille.replaceChildren(...AVATARS.map((a) => h('button', {
      type: 'button', 'aria-pressed': String(a === avatar), 'aria-label': 'Avatar ' + a,
      onclick: () => { avatar = a; dessinerAvatars(); }
    }, a)));
    dessinerAvatars();

    const formulaire = h('form', { class: 'formulaire', novalidate: true },
      h('h1', {}, 'La guerre des neurones'),
      h('p', { class: 'devise' }, 'Jeu dis, Jeu fais !'),
      h('p', { class: 'muet' }, GT.solo ? '👤 Mode solo : ton téléphone fait tout, pas besoin de tablette.' : 'Rejoins la partie : le code est affiché sur la tablette.'),
      message ? h('p', { class: 'bulle alerte', role: 'alert', style: { animation: 'none' } }, message) : null,
      h('div', { class: 'champ', hidden: !!GT.solo }, h('label', { for: 'code' }, 'Code de la partie'),
        h('input', { id: 'code', name: 'code', maxlength: '4', autocomplete: 'off', autocapitalize: 'characters', inputmode: 'text', value: etat.code, placeholder: 'ABCD', required: true })),
      h('div', { class: 'champ' }, h('label', { for: 'nom' }, 'Ton prénom ou surnom'),
        h('input', { id: 'nom', name: 'nom', maxlength: '16', autocomplete: 'given-name', value: etat.nom, placeholder: 'Mamie Jo, Léa, Tonton…', required: true })),
      h('div', { class: 'champ' }, h('span', { style: { fontWeight: 700 } }, 'Ton avatar'), grille),
      h('button', { class: 'bouton', type: 'submit' }, GT.solo ? 'C\'est parti !' : 'Rejoindre la table')
    );
    formulaire.addEventListener('submit', (ev) => {
      ev.preventDefault();
      // En mode solo, le code est celui de la salle que le téléphone vient d'ouvrir pour lui tout seul.
      const code = GT.solo ? (GT.solo.code || '') : formulaire.code.value.trim().toUpperCase();
      if (GT.solo && !code) return GT.bulle('Un instant, la partie se prépare…', 'alerte');
      const nom = formulaire.nom.value.trim();
      if (code.length !== 4) return GT.bulle('Le code fait 4 lettres.', 'alerte');
      if (!nom) return GT.bulle('Indique ton prénom.', 'alerte');
      etat.code = code;
      etat.nom = nom;
      etat.avatar = avatar;
      cnx.emit('joueur:rejoindre', { code, nom, avatar });
    });
    ecran.replaceChildren(formulaire);
  }

  /* ═══════════ Les écrans de jeu ═══════════ */

  const ECRANS = {};

  ECRANS.salon = function () {
    if (GT.solo) return GT.solo.ecranSalon(etat);
    const autres = etat.salle ? etat.salle.joueurs.filter((j) => j.id !== etat.joueurId) : [];
    return h('div', { class: 'centre' },
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, etat.avatar),
      h('h2', {}, 'Tu es à table, ' + etat.nom + ' !'),
      h('p', { class: 'muet' }, 'Garde un œil sur la tablette : l\'animateur va lancer la partie.'),
      autres.length ? h('p', {}, 'Touche un joueur pour lui envoyer un petit mot :') : null,
      h('div', { class: 'gagnants', style: { justifyContent: 'center' } }, autres.map((j) =>
        h('button', { class: 'gagnant', onclick: () => ouvrirReactions(j.id), style: { opacity: j.connecte ? 1 : 0.5 } }, j.avatar + ' ' + j.nom)))
    );
  };

  /* Avant chaque jeu : la règle, et surtout le défi personnel de la manche. */
  ECRANS.intro = function (d) {
    return h('div', { class: 'centre' },
      d.finale
        ? h('div', { class: 'bandeau-finale' }, '⚡ GRANDE FINALE ⚡', h('small', {}, 'Points doublés !'))
        : h('span', { class: 'etiquette' }, d.surprise ? '🎲 Manche ' + d.numero : 'Jeu ' + d.numero + ' sur ' + d.total),
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, d.fiche.icone),
      h('h2', {}, d.fiche.nom),
      d.defi ? h('div', { class: 'carte-defi' }, h('span', { class: 'etiquette' }, '🎯 Ton défi · prime +' + d.prime), h('strong', {}, d.defi.texte)) : null,
      d.inattendu ? (d.inattenduPourMoi
        ? h('div', { class: 'inattendu' }, h('strong', {}, d.inattendu.icone + ' ' + d.inattendu.titre), h('span', {}, d.inattendu.joueur.id === etat.joueurId ? d.inattendu.texte : 'Tu es dans le duel de ' + d.inattendu.joueur.avatar + ' ' + d.inattendu.joueur.nom + ' ! ' + d.inattendu.texte.replace(/^Duel contre [^:]*: /, '')))
        : h('p', { class: 'muet' }, d.inattendu.icone + ' Défi inattendu pour ' + d.inattendu.joueur.avatar + ' ' + d.inattendu.joueur.nom + ' !')) : null,
      d.gage ? carteGage(d.gage, d.premiereManche) : null,
      h('p', {}, d.fiche.regle));
  };

  /*
   * Le gage secret : caché par défaut (les voisins regardent parfois l'écran !).
   * Une touche pour le lire, une autre pour le cacher.
   */
  function carteGage(gage, nouveau) {
    const texte = h('strong', { hidden: true }, gage);
    const bouton = h('button', { class: 'bouton bouton-petit bouton-discret', onclick: (e) => {
      e.stopPropagation();
      texte.hidden = !texte.hidden;
      bouton.textContent = texte.hidden ? '👀 Voir mon gage (cache l\'écran !)' : '🙈 Cacher mon gage';
    } }, '👀 Voir mon gage (cache l\'écran !)');
    return h('div', { class: 'carte-defi carte-gage' },
      h('span', { class: 'etiquette' }, nouveau ? '🤫 Nouveau : ton gage secret !' : '🤫 Ton gage secret'),
      texte, bouton,
      h('span', { class: 'muet', style: { fontSize: '.9rem' } }, 'À accomplir pendant la soirée sans te faire repérer. Validé par la table à la fin : +1 500 points !'));
  }
  ECRANS.intro.apres = (d) => { if (d.defi && navigator.vibrate) navigator.vibrate(d.finale ? [60, 60, 60, 60, 200] : [40, 60, 40]); };

  ECRANS.info = function (d) {
    return h('div', { class: 'centre' },
      h('h2', {}, d.titre),
      d.texte ? h('p', {}, d.texte) : null,
      d.score !== undefined ? h('p', { class: 'muet' }, 'Ton score : ' + GT.points(d.score)) : null);
  };

  /* ─── Les questions ─── */
  ECRANS['qcm-choix'] = function (d) {
    const touches = h('div', { class: 'touches' }, d.choix.map((texte, i) => h('button', {
      class: 'touche ' + GT.classesChoix[i],
      onclick: (ev) => {
        touches.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        ev.currentTarget.style.outline = '4px solid var(--papier)';
        if (navigator.vibrate) navigator.vibrate(30);
        cnx.emit('joueur:action', { type: 'reponse', choix: i });
      }
    }, h('span', { class: 'forme', 'aria-hidden': 'true' }, GT.formes[i]), h('span', {}, texte))));
    const vue = d.vue || {};
    return h('div', { class: 'ecran', style: { padding: 0 } },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, (vue.zoom ? '🔎 Image ' : 'Question ') + d.numero + ' / ' + d.total), vue.surtitre ? h('span', { class: 'muet' }, vue.surtitre) : null),
      // La question elle-même, sur le téléphone (et l'image du zoom qui se dévoile, en version de poche).
      vue.intitule ? h('h2', { class: 'question-tel' }, vue.intitule) : null,
      vue.zoom ? h('div', { style: { display: 'grid', justifyItems: 'center' } }, GT.cadreZoom(vue.zoom, d.finA, d.dureeMs, false, true)) : null,
      vue.illustration ? GT.illustration(vue.illustration, { debut: d.finA - d.dureeMs, mini: true }) : null,
      vue.drapeau ? GT.drapeau(vue.drapeau, { mini: true }) : null,
      vue.puzzle ? GT.puzzle(vue.puzzle, d.finA, d.dureeMs, { mini: true }) : null,
      vue.ecoute ? h('div', { class: 'egaliseur', style: { justifySelf: 'center', height: '40px' }, 'aria-hidden': 'true' }, h('span'), h('span'), h('span'), h('span'), h('span')) : null,
      GT.chrono(d.finA, d.dureeMs),
      touches);
  };

  /* Les petites phrases qui défilent pendant l'attente : pour garder la tension (et le sourire). */
  const ENCOURAGEMENTS = ['Croise les doigts 🤞', 'Suspense… 😬', 'Les autres réfléchissent encore 🐢', 'Tu as l\'air sûr de toi 😎', 'Respire… 🧘', 'Verdict dans un instant ⏳'];
  function murmurer(element, liste) {
    clearInterval(etat.murmures);
    etat.murmures = setInterval(() => { if (element.isConnected) element.textContent = liste[Math.floor(Math.random() * liste.length)]; }, 1600);
  }

  ECRANS['qcm-attente'] = function (d) {
    const vue = d.vue || {};
    const encouragement = h('p', { class: 'encouragement' }, 'Réponse validée ✅');
    murmurer(encouragement, ENCOURAGEMENTS);
    return h('div', { class: 'centre' },
      vue.intitule ? h('p', { class: 'muet' }, vue.intitule) : null,
      vue.zoom ? GT.cadreZoom(vue.zoom, d.finA, d.dureeMs || 20000, false, true) : null,
      vue.illustration ? GT.illustration(vue.illustration, { debut: d.finA - (d.dureeMs || 20000), mini: true }) : null,
      vue.drapeau ? GT.drapeau(vue.drapeau, { mini: true }) : null,
      vue.puzzle ? GT.puzzle(vue.puzzle, d.finA, d.dureeMs || 20000, { mini: true }) : null,
      h('p', { class: 'muet' }, 'Ta réponse (elle ne peut plus changer) :'),
      h('div', { class: 'touche ' + GT.classesChoix[d.choix], style: { width: '100%' } }, h('span', { class: 'forme' }, GT.formes[d.choix]), h('span', {}, d.texte)),
      encouragement,
      h('div', { style: { width: '100%' } }, GT.chrono(d.finA, d.dureeMs || 20000)));
  };

  ECRANS['qcm-resultat'] = function (d) {
    return h('div', { class: 'centre' },
      h('div', { class: 'verdict ' + (d.juste ? 'verdict-juste' : 'verdict-faux'), 'aria-hidden': 'true' }, d.juste ? '✓' : d.aRepondu ? '✗' : '⏱'),
      h('h2', {}, d.juste ? 'Bravo ! +' + d.points : d.aRepondu ? 'Raté !' : 'Trop tard !'),
      d.juste ? (d.rang ? h('p', {}, d.rang === 1 ? '⚡ Le plus rapide de la table !' : 'Tu es le ' + GT.rang(d.rang) + ' plus rapide.') : null)
        : h('p', {}, 'La bonne réponse : ', h('strong', {}, d.bonneTexte)),
      d.zoom ? GT.cadreZoom(d.zoom, 0, 0, true, true) : null,
      d.illustration ? GT.illustration(d.illustration, { toutVoir: true, mini: true }) : null,
      d.drapeau ? GT.drapeau(d.drapeau, { mini: true }) : null,
      d.puzzle ? GT.puzzle(d.puzzle, 0, 0, { mini: true }) : null,
      // L'explication de la tablette, en version de poche : l'anecdote, la règle, le « c'était… ».
      d.explication && (d.explication.titre || d.explication.texte)
        ? h('div', { class: 'explication-tel' }, d.explication.titre ? h('strong', {}, d.explication.titre) : null, d.explication.texte ? h('p', {}, d.explication.texte) : null)
        : null,
      (d.plusRapides || []).length ? h('div', { class: 'gagnants', style: { justifyContent: 'center' } }, d.plusRapides.map((g) => h('span', { class: 'gagnant' }, g.avatar + ' ' + g.nom, h('b', {}, '+' + g.points)))) : null,
      h('p', { class: 'muet' }, 'Ton score : ' + GT.points(d.score)));
  };

  /* ─── Dessine et devine : le dessinateur ─── */
  const COULEURS = ['#1B1F3B', '#E4572E', '#FFC93C', '#3BA55C', '#2C6E8F', '#9B8CFF', '#8D5A3B', '#FF8FC7'];
  const TAILLES = [4, 9, 18];

  ECRANS['dessin-dessinateur'] = function (d) {
    etat.dessin = { couleur: COULEURS[0], taille: TAILLES[1], gomme: false, traits: JSON.parse(JSON.stringify(d.traits || [])), courant: null, tampon: [], minuteur: null };
    const D = etat.dessin;
    const palette = h('div', { class: 'palette', role: 'toolbar', 'aria-label': 'Couleurs et épaisseurs' });
    const dessinerPalette = () => palette.replaceChildren(
      ...COULEURS.map((c) => h('button', { class: 'pastille', style: { '--p': c }, 'aria-label': 'Couleur', 'aria-pressed': String(!D.gomme && D.couleur === c), onclick: () => { D.couleur = c; D.gomme = false; dessinerPalette(); } })),
      h('button', { class: 'epaisseur', 'aria-label': 'Gomme', 'aria-pressed': String(D.gomme), onclick: () => { D.gomme = true; dessinerPalette(); } }, '🧽'),
      ...TAILLES.map((t) => h('button', { class: 'epaisseur', 'aria-label': 'Épaisseur ' + t, 'aria-pressed': String(D.taille === t), onclick: () => { D.taille = t; dessinerPalette(); } }, h('i', { style: { width: (t / 1.3 + 4) + 'px', height: (t / 1.3 + 4) + 'px' } }))));
    dessinerPalette();

    return h('div', { class: 'ecran', style: { padding: 0 } },
      h('div', { class: 'mot-secret' },
        h('div', {}, h('div', { style: { fontSize: '.85rem', fontWeight: 700 } }, 'À toi de dessiner :'), h('strong', {}, d.mot)),
        d.peutChanger ? h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('joueur:action', { type: 'changer' }) }, 'Changer') : null),
      GT.chrono(d.finA, d.dureeMs),
      h('div', { class: 'toile' }, h('canvas', { id: 'toile-joueur', 'aria-label': 'Zone de dessin' })),
      palette,
      h('div', { class: 'lancement' },
        h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => { D.traits.pop(); GT.toile.toutRedessiner(document.getElementById('toile-joueur'), D.traits); cnx.emit('joueur:action', { type: 'annuler' }); } }, '↶ Annuler'),
        h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => { D.traits = []; GT.toile.effacer(document.getElementById('toile-joueur')); cnx.emit('joueur:action', { type: 'effacer' }); } }, 'Tout effacer')),
      h('p', { class: 'muet' }, 'Pas de lettres ni de chiffres, sinon c\'est de la triche !'));
  };

  /*
   * Le crayon : à chaque mouvement du doigt, on ajoute un point au trait
   * en cours et on le trace aussitôt sur le téléphone. Les points sont
   * envoyés à la tablette par petits paquets, toutes les 50 millisecondes :
   * assez souvent pour que le dessin y apparaisse « en direct », pas trop
   * pour ne pas encombrer le Wi-Fi.
   */
  ECRANS['dessin-dessinateur'].apres = function () {
    const D = etat.dessin;
    const canvas = document.getElementById('toile-joueur');
    GT.toile.ajuster(canvas);
    GT.toile.toutRedessiner(canvas, D.traits);

    const position = (ev) => {
      const r = canvas.getBoundingClientRect();
      return [Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height))];
    };
    const envoyer = () => {
      D.minuteur = null;
      if (!D.courant || !D.tampon.length) return;
      cnx.emit('joueur:action', { type: 'trait', id: D.courant.id, couleur: D.courant.couleur, taille: D.courant.taille, points: D.tampon });
      D.tampon = [];
    };
    canvas.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      canvas.setPointerCapture(ev.pointerId);
      const p = position(ev);
      D.courant = { id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), couleur: D.gomme ? '#FFFFFF' : D.couleur, taille: D.gomme ? 26 : D.taille, points: [p] };
      D.traits.push(D.courant);
      D.tampon = [p];
      GT.toile.tracer(canvas, D.courant, 0);
      envoyer();
    });
    canvas.addEventListener('pointermove', (ev) => {
      if (!D.courant) return;
      const p = position(ev);
      const dernier = D.courant.points[D.courant.points.length - 1];
      if (Math.hypot(p[0] - dernier[0], p[1] - dernier[1]) < 0.004) return; // on ignore les micro-tremblements
      D.courant.points.push(p);
      D.tampon.push(p);
      GT.toile.tracer(canvas, D.courant, D.courant.points.length - 1);
      if (!D.minuteur) D.minuteur = setTimeout(envoyer, 50);
    });
    const finir = () => { clearTimeout(D.minuteur); envoyer(); D.courant = null; };
    canvas.addEventListener('pointerup', finir);
    canvas.addEventListener('pointercancel', finir);
  };

  /* ─── Dessine et devine : les devineurs ─── */
  ECRANS['dessin-devineur'] = function (d) {
    const mesEssais = h('div', { class: 'fil', id: 'mes-essais' });
    const champ = h('input', { id: 'proposition', maxlength: '40', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Ta proposition…', enterkeyhint: 'send' });
    const formulaire = h('form', { class: 'saisie' }, champ, h('button', { class: 'bouton', type: 'submit' }, 'Envoyer'));
    formulaire.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const texte = champ.value.trim();
      if (!texte) return;
      cnx.emit('joueur:action', { type: 'proposition', texte });
      mesEssais.prepend(h('div', { class: 'fil-ligne' }, texte));
      champ.value = '';
      champ.focus();
    });
    // Le dessin arrive en direct sur le téléphone aussi (voir les événements « trait » et « redessiner »).
    etat.traitsDevin = JSON.parse(JSON.stringify(d.traits || []));
    const toile = h('canvas', { id: 'toile-devin', 'aria-label': 'Le dessin en cours' });
    return h('div', { class: 'ecran', style: { padding: 0 } },
      h('p', {}, h('strong', {}, d.auteur.avatar + ' ' + d.auteur.nom), ' dessine… Devine !'),
      h('div', { class: 'feuille feuille-devin' }, toile),
      h('div', { class: 'indice', id: 'indice', 'aria-label': 'Indice' }, d.indice),
      GT.chrono(d.finA, d.dureeMs),
      formulaire,
      h('p', { class: 'muet' }, 'Les fautes d\'orthographe et les accents sont pardonnés.'),
      mesEssais);
  };

  ECRANS['dessin-devineur'].apres = () => {
    const c = document.getElementById('toile-devin');
    if (c) { GT.toile.ajuster(c); GT.toile.toutRedessiner(c, etat.traitsDevin); }
  };

  ECRANS['dessin-trouve'] = function (d) {
    return h('div', { class: 'centre' },
      h('div', { class: 'verdict verdict-juste', 'aria-hidden': 'true' }, '✓'),
      h('h2', {}, 'Trouvé : « ' + d.mot + ' »'),
      h('p', {}, '+' + d.points + ' points'),
      h('p', { class: 'muet' }, 'Chut ! Ne le dis pas aux autres.'));
  };

  /* ─── Les 7 erreurs ─── */
  function dessinerErreurs() {
    const E = etat.erreurs;
    const cercles = E.trouvees.map((x) => ({ x: x.x, y: x.y, r: x.r, classe: 'cercle-trouve' }));
    document.getElementById('image-a').innerHTML = GT.scene.svg(E.originale, { cercles, titre: 'Image d\'origine' });
    document.getElementById('image-b').innerHTML = GT.scene.svg(E.modifiee, { cercles, titre: 'Image modifiée' });
    document.getElementById('compte-erreurs').textContent = E.trouvees.length + ' / ' + E.nbErreurs;
  }

  ECRANS['erreurs-jeu'] = function (d) {
    etat.erreurs = { originale: d.originale, modifiee: d.modifiee, trouvees: d.trouvees.slice(), nbErreurs: d.nbErreurs, fini: d.fini };
    const toucher = (ev) => {
      if (etat.erreurs.fini) return;
      const svg = ev.currentTarget.querySelector('svg');
      if (!svg) return;
      const p = GT.scene.coordonnees(svg, ev);
      cnx.emit('joueur:action', { type: 'touche', x: p.x, y: p.y });
    };
    return h('div', { class: 'ecran', style: { padding: 0 } },
      h('div', { class: 'qcm-tete' }, h('strong', {}, 'Trouve les différences !'), h('span', { class: 'etiquette', id: 'compte-erreurs' }, '0 / ' + d.nbErreurs)),
      GT.chrono(d.finA, d.dureeMs),
      h('div', { class: 'cadre', id: 'image-a', onpointerdown: toucher }),
      h('div', { class: 'cadre', id: 'image-b', onpointerdown: toucher }),
      h('p', { class: 'muet', id: 'aide-erreurs' }, 'Touche une image là où elle diffère de l\'autre.'));
  };
  ECRANS['erreurs-jeu'].apres = () => dessinerErreurs();

  ECRANS['erreurs-solution'] = function (d) {
    const cercles = d.differences.map((x) => ({ x: x.x, y: x.y, r: x.r, classe: d.trouvees.includes(x.id) ? 'cercle-trouve' : 'cercle-manque' }));
    return h('div', { class: 'ecran', style: { padding: 0 } },
      h('h2', {}, d.nb + ' / ' + d.nbErreurs + ' trouvées · +' + d.points),
      h('p', { class: 'muet' }, 'En vert, tes trouvailles. En pointillés rouges, celles qui t\'ont échappé.'),
      h('div', { class: 'cadre', html: GT.scene.svg(d.modifiee, { cercles }) }));
  };

  /* ─── Classement et podium ─── */
  ECRANS.classement = function (d) {
    return h('div', { class: 'centre' },
      h('span', { class: 'etiquette' }, 'Classement'),
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, d.rang === 1 ? '👑' : d.rang <= 3 ? '🔥' : '💪'),
      h('h2', {}, GT.rang(d.rang) + ' sur ' + d.nbJoueurs),
      h('p', {}, GT.points(d.score) + (d.gain ? ' (+' + d.gain + ' sur ce jeu)' : '')),
      (d.top || []).length ? h('ol', { class: 'top-tel' }, d.top.map((t, i) => h('li', {}, ['🥇', '🥈', '🥉'][i] + ' ' + t.avatar + ' ' + t.nom, h('b', {}, GT.points(t.score))))) : null,
      (d.commentaires || []).length ? h('div', { class: 'commentateur commentateur-tel' }, h('span', { class: 'micro', 'aria-hidden': 'true' }, '🎙️'), h('div', {}, d.commentaires.map((c) => h('p', {}, c)))) : null,
      d.prochainNom ? h('p', { class: 'muet' }, 'Prochain jeu : ' + d.prochainNom) : null,
      d.defi
        ? h('div', { class: 'carte-defi' + (d.defi.reussi ? ' defi-reussi' : ' defi-rate') },
          h('span', { class: 'etiquette' }, d.defi.reussi ? '🎯 Défi réussi ! +' + d.defi.prime : '🎯 Défi manqué'),
          h('span', {}, d.defi.texte))
        : null,
      d.objectif && !d.prochainFinale ? h('p', { class: 'muet' }, d.score >= d.objectif ? '🏁 Tu as franchi la ligne d\'arrivée (' + GT.points(d.objectif) + ') !' : '🏁 Ligne d\'arrivée : ' + GT.points(d.objectif) + '. Il t\'en manque ' + GT.points(d.objectif - d.score) + '.') : null,
      d.prochainFinale ? h('p', { class: 'texte-finale' }, d.annonceFinale || '⚡ Prochaine manche : la Grande Finale, points doublés !') : null,
      d.resultatInattendu ? h('div', { class: 'carte-defi ' + ((d.resultatInattendu.vainqueurId ? d.resultatInattendu.vainqueurId === etat.joueurId : d.resultatInattendu.reussi) ? 'defi-reussi' : 'defi-rate') },
        h('span', { class: 'etiquette' }, d.resultatInattendu.icone + ' ' + d.resultatInattendu.titre), h('span', {}, d.resultatInattendu.texte)) : null,
      d.gage ? carteGage(d.gage, false) : null,
      h('button', { class: 'bouton bouton-discret', onclick: () => ouvrirReactions(null) }, '💬 Taquiner les autres'));
  };

  /*
   * ─── Feu vert ! ───
   * Le téléphone devient un énorme bouton. Il chronomètre lui-même le
   * réflexe : de l'instant où IL affiche le vert jusqu'au toucher du doigt.
   * On écoute « pointerdown » (le doigt qui se pose) plutôt que « click »
   * (le doigt qui se lève) : c'est plus rapide et plus juste.
   */
  ECRANS['reflexe-bouton'] = function (d) {
    etat.reflexe = { go: null, envoye: false };
    const bouton = h('button', {
      class: 'gros-bouton-reflexe', id: 'bouton-reflexe', 'aria-label': 'Taper',
      onpointerdown: (ev) => {
        ev.preventDefault();
        if (etat.reflexe.envoye) return;
        etat.reflexe.envoye = true;
        const reflexe = etat.reflexe.go ? Math.round(performance.now() - etat.reflexe.go) : null;
        cnx.emit('joueur:action', { type: 'tape', reflexe });
        bouton.classList.add('tape');
      }
    }, h('span', { id: 'texte-reflexe' }, d.enRetard ? 'Attends le prochain tour…' : 'Attends le vert…'));
    return h('div', { class: 'centre ecran-reflexe' },
      h('span', { class: 'etiquette' }, '🚦 Tour ' + d.tour + ' / ' + d.total),
      bouton,
      h('p', { class: 'encouragement', id: 'murmure-reflexe' }, 'Doigt prêt…'),
      h('p', { class: 'muet' }, 'Tape dès que ça passe au VERT. Sur le ROUGE, surtout pas !'));
  };
  ECRANS['reflexe-bouton'].apres = () => {
    const m = document.getElementById('murmure-reflexe');
    if (m) murmurer(m, ['Pas encore…', 'Doigt prêt… ☝️', 'Concentration…', 'Ne cligne pas des yeux 👀', 'Ça arrive…', 'Respire…']);
  };

  /* ─── Mémoire d'éléphant : la grille arrive aussi sur le téléphone ─── */
  ECRANS['memoire-montre'] = function (d) {
    return h('div', { class: 'centre' },
      h('span', { class: 'etiquette' }, '🐘 Grille ' + d.numero + ' / ' + d.total),
      h('h2', {}, 'Mémorise !'),
      GT.illustration(d.illustration, { mini: true }),
      h('div', { style: { width: '100%' } }, GT.chrono(d.finA, d.dureeMs)),
      h('p', { class: 'muet' }, 'Elle va disparaître… 👀'));
  };

  /* ─── Les Fous Rires : écrire la suite de la phrase ─── */
  ECRANS['rire-ecrire'] = function (d) {
    const champ = h('textarea', { id: 'reponse-rire', maxlength: String(d.longueurMax || 80), rows: '3', placeholder: 'Ta réponse la plus drôle…', autocomplete: 'off', enterkeyhint: 'send', 'aria-label': 'Ta réponse' });
    const compteur = h('span', { class: 'muet', style: { fontSize: '.9rem' } }, '0 / ' + (d.longueurMax || 80));
    champ.addEventListener('input', () => { compteur.textContent = champ.value.length + ' / ' + (d.longueurMax || 80); });
    let j = 0;
    const joker = () => { champ.value = d.jokers[j++ % d.jokers.length]; champ.dispatchEvent(new Event('input')); if (navigator.vibrate) navigator.vibrate(20); };
    const formulaire = h('form', { class: 'saisie-rire' }, champ,
      h('div', { class: 'ligne-rire' }, compteur, h('button', { type: 'button', class: 'bouton bouton-petit bouton-discret', onclick: joker }, '🎲 Joker')),
      h('button', { class: 'bouton', type: 'submit' }, 'Envoyer ma réponse'));
    formulaire.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const texte = champ.value.trim();
      if (!texte) return GT.bulle('Écris quelque chose… ou tente le joker 🎲', 'alerte');
      cnx.emit('joueur:action', { type: 'ecrit', texte });
    });
    return h('div', { class: 'centre' },
      h('span', { class: 'etiquette' }, '🤪 Invente la suite · tour ' + d.tour + ' / ' + d.total),
      h('h2', { class: 'amorce-tel' }, d.amorce),
      formulaire,
      h('div', { style: { width: '100%' } }, GT.chrono(d.finA, d.dureeMs)),
      h('p', { class: 'muet' }, 'Ta réponse sera lue sans ton nom. Fais rire la table !'));
  };

  /* Les Fous Rires : voter pour la réponse la plus drôle (la sienne n'est pas dans la liste). */
  ECRANS['rire-voter'] = function (d) {
    const voter = (id) => { if (navigator.vibrate) navigator.vibrate(30); cnx.emit('joueur:action', { type: 'vote', option: id }); };
    return h('div', { class: 'centre' },
      h('span', { class: 'etiquette' }, '🗳️ Laquelle te fait le plus rire ?'),
      h('p', { class: 'muet' }, d.amorce),
      h('div', { class: 'votes-rire' }, d.reponses.map((r) => h('button', { class: 'bouton-rire', onclick: () => voter(r.id) }, r.texte))),
      h('div', { style: { width: '100%' } }, GT.chrono(d.finA, d.dureeMs)),
      h('p', { class: 'muet' }, 'Ta propre réponse n\'est pas dans la liste. Méfie-toi : l\'une d\'elles a été écrite par le jeu !'));
  };

  ECRANS['rire-attente'] = function (d) {
    return h('div', { class: 'centre' },
      h('h2', {}, d.titre),
      h('blockquote', { class: 'citation-rire' }, d.texte),
      h('p', { class: 'muet' }, d.consigne),
      h('div', { style: { width: '100%' } }, GT.chrono(d.finA, d.dureeMs)));
  };

  ECRANS['rire-resultat'] = function (d) {
    const titre = d.fouRire ? '🤣 Fou rire général !' : d.mesVotes ? '😂 ' + d.mesVotes + ' vote' + (d.mesVotes > 1 ? 's' : '') + ' pour toi !' : d.maReponse ? '😅 Aucun vote cette fois…' : '🤐 Tu n\'as rien écrit !';
    return h('div', { class: 'centre' },
      h('h2', {}, titre),
      d.points ? h('p', {}, h('strong', {}, '+' + d.points + ' points')) : null,
      d.maReponse ? h('blockquote', { class: 'citation-rire' }, d.maReponse) : null,
      d.meilleure && !(d.meilleure.auteur && d.mesVotes && d.meilleure.texte === d.maReponse)
        ? h('div', { class: 'explication-tel' },
          h('strong', {}, d.meilleure.maison ? '🤖 La préférée de la table… c\'était celle du jeu !' : '👑 La préférée : ' + d.meilleure.auteur.avatar + ' ' + d.meilleure.auteur.nom),
          h('p', {}, '« ' + d.meilleure.texte + ' »'))
        : null,
      d.piegeParMaison ? h('p', { class: 'muet' }, '🤖 Tu as voté pour la réponse du jeu. Bien joué, la maison !') : null,
      h('p', { class: 'muet' }, 'Ton score : ' + GT.points(d.score)));
  };

  /* ─── Le tribunal des gages ─── */
  ECRANS['gage-vote'] = function (d) {
    const voter = (reussi) => { if (navigator.vibrate) navigator.vibrate(30); cnx.emit('joueur:action', { type: 'vote', reussi }); };
    return h('div', { class: 'centre' },
      h('span', { class: 'etiquette' }, '🤫 Tribunal des gages'),
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, d.accuse.avatar),
      h('h2', {}, d.accuse.nom + ' devait…'),
      h('p', {}, h('strong', {}, d.gage)),
      h('p', { class: 'muet' }, 'Alors, gage réussi ?'),
      GT.chrono(d.finA, d.dureeMs),
      h('div', { class: 'boutons-vote' },
        h('button', { class: 'bouton vote-oui', onclick: () => voter(true) }, '👍 Réussi'),
        h('button', { class: 'bouton vote-non', onclick: () => voter(false) }, '👎 Raté')));
  };

  ECRANS['gage-accuse'] = function (d) {
    return h('div', { class: 'centre' },
      h('span', { class: 'etiquette' }, '🤫 Tribunal des gages'),
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, '😇'),
      h('h2', {}, 'C\'est ton tour !'),
      h('p', {}, 'Ton gage est révélé à toute la table : ', h('strong', {}, d.gage)),
      h('p', { class: 'muet' }, 'Plaide ta cause avec talent… La table vote ! Gage réussi : +' + d.prime + ' points.'),
      GT.chrono(d.finA, d.dureeMs));
  };

  ECRANS.podium = function (d) {
    const medaille = ['🥇', '🥈', '🥉'][d.rang - 1] || '🎉';
    return h('div', { class: 'centre' },
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true', style: { fontSize: '5.5rem' } }, medaille),
      h('h2', {}, d.rang === 1 ? 'Champion·ne des neurones !' : GT.rang(d.rang) + ' sur ' + d.nbJoueurs),
      h('p', {}, GT.points(d.score)),
      (d.prix || []).map((p) => h('div', { class: 'carte-defi defi-reussi' }, h('span', { class: 'etiquette' }, p.icone + ' ' + p.titre), h('span', {}, p.texte))),
      (d.top || []).length ? h('ol', { class: 'top-tel' }, d.top.map((t, i) => h('li', {}, ['🥇', '🥈', '🥉'][i] + ' ' + t.avatar + ' ' + t.nom, h('b', {}, GT.points(t.score))))) : null,
      (d.tousLesPrix || []).filter((p) => !(d.prix || []).some((x) => x.titre === p.titre)).length
        ? h('div', { class: 'gagnants', style: { justifyContent: 'center' } }, d.tousLesPrix.filter((p) => !(d.prix || []).some((x) => x.titre === p.titre)).map((p) => h('span', { class: 'gagnant' }, p.icone + ' ' + p.titre + ' : ' + p.avatar + ' ' + p.nom)))
        : null,
      h('p', { class: 'muet' }, 'Merci d\'avoir joué ! Une revanche ?'),
      GT.solo ? h('button', { class: 'bouton', onclick: () => GT.solo.rejouer() }, '🔁 Rejouer') : null);
  };

  /* ═══════════ Les petites mises à jour ═══════════ */

  const EVENEMENTS = {
    // Le dessin en direct, pour ceux qui devinent.
    trait: (d) => {
      if (!etat.traitsDevin) return;
      let t = etat.traitsDevin.find((x) => x.id === d.id);
      if (!t) { t = { id: d.id, couleur: d.couleur, taille: d.taille, points: [] }; etat.traitsDevin.push(t); }
      const depuis = t.points.length;
      t.points.push(...d.points);
      const c = document.getElementById('toile-devin');
      if (c) GT.toile.tracer(c, t, depuis);
    },
    redessiner: (d) => {
      etat.traitsDevin = d.traits || [];
      const c = document.getElementById('toile-devin');
      if (c) GT.toile.toutRedessiner(c, etat.traitsDevin);
    },
    'reflexe-go': () => {
      clearInterval(etat.murmures);
      const m = document.getElementById('murmure-reflexe'); if (m) m.textContent = '⚡ MAINTENANT !';
      if (!etat.reflexe) return;
      etat.reflexe.go = performance.now();
      const b = document.getElementById('bouton-reflexe'); if (b) { b.classList.remove('piege'); b.classList.add('go'); }
      const t = document.getElementById('texte-reflexe'); if (t) t.textContent = 'TAPE !';
      if (navigator.vibrate) navigator.vibrate(60);
    },
    'reflexe-piege': () => {
      const b = document.getElementById('bouton-reflexe'); if (b) b.classList.add('piege');
      const t = document.getElementById('texte-reflexe'); if (t) t.textContent = 'NE TOUCHE PAS !';
    },
    'reflexe-calme': () => {
      const b = document.getElementById('bouton-reflexe'); if (b) b.classList.remove('piege');
      const t = document.getElementById('texte-reflexe'); if (t) t.textContent = 'Attends le vert…';
    },
    // Le sort vient de me désigner pour un défi inattendu : ça vibre !
    inattendu: () => { if (navigator.vibrate) navigator.vibrate([80, 60, 80, 60, 240]); },
    // La course-poursuite en direct : on double sa cible, on se fait doubler…
    'cible-depassee': (d) => { GT.bulle('🎯 Cible dépassée ! Tu passes devant ' + d.cibleAvatar + ' ' + d.cibleNom + ' !', 'succes'); if (navigator.vibrate) navigator.vibrate([50, 40, 50, 40, 120]); },
    'cible-reprise': (d) => { GT.bulle('😱 ' + d.cibleAvatar + ' ' + d.cibleNom + ' repasse devant toi ! Accroche-toi !', 'alerte'); if (navigator.vibrate) navigator.vibrate(150); },
    'depasse-par': (d) => { GT.bulle('⚠️ ' + d.avatar + ' ' + d.nom + ' vient de te doubler !', 'alerte'); if (navigator.vibrate) navigator.vibrate([100, 50, 100]); },
    indice: (d) => { const el = document.getElementById('indice'); if (el) el.textContent = d.indice; },
    presque: () => { GT.bulle('Presque ! Tu y es presque 🔥', 'succes'); if (navigator.vibrate) navigator.vibrate([30, 40, 30]); },
    trouve: (d) => GT.bulle(d.avatar + ' ' + d.nom + ' a trouvé ton dessin !', 'succes'),
    trouvee: (d) => {
      if (!etat.erreurs) return;
      etat.erreurs.trouvees.push(d.diff);
      etat.erreurs.fini = d.fini;
      dessinerErreurs();
      if (navigator.vibrate) navigator.vibrate(25);
      if (d.fini) { GT.bulle('Les 7 ! Bravo, quel œil !', 'succes'); const aide = document.getElementById('aide-erreurs'); if (aide) aide.textContent = 'Tout trouvé ! Attends les autres…'; }
    },
    // Une touche à côté : on le signale sous les images (une bulle cacherait le paysage).
    ratee: () => {
      const aide = document.getElementById('aide-erreurs');
      if (aide) { aide.textContent = 'Raté ! −15 points'; aide.classList.add('aide-ratee'); clearTimeout(aide.minuteur); aide.minuteur = setTimeout(() => { aide.textContent = 'Touche une image là où elle diffère de l\'autre.'; aide.classList.remove('aide-ratee'); }, 1400); }
      if (navigator.vibrate) navigator.vibrate(80);
    }
  };

  // Au premier affichage, avant même que la ligne soit ouverte, on montre le formulaire si on n'a pas d'identité.
  if (!etat.joueurId) afficherFormulaire();
  else ecran.replaceChildren(h('div', { class: 'centre' }, h('h2', {}, 'Retour à la table…')));
})();
