/*
 * ════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN DE LA TABLETTE (le plateau au centre de la table)
 * ════════════════════════════════════════════════════════════════════
 *
 *  La tablette est à la fois le plateau de jeu et le pupitre de
 *  l'animateur. Elle affiche ce que tout le monde regarde ensemble
 *  (la question, le dessin en cours, le classement…) et porte les
 *  quelques boutons qui pilotent la soirée (lancer, passer, terminer).
 *
 *  Le principe est toujours le même : le moteur envoie un message
 *  « ecran » avec un type (par exemple « qcm-question ») et des données.
 *  Ce fichier possède, pour chaque type, une petite fonction de rendu
 *  (rangées dans l'objet RENDUS plus bas) qui construit l'écran
 *  correspondant. Entre deux écrans, de petits messages « evenement »
 *  mettent à jour un détail sans tout reconstruire : un trait de crayon,
 *  une nouvelle proposition, la jauge d'un joueur…
 */
(function () {
  'use strict';
  const { h } = GT;
  const cnx = GT.connexion;

  /* Tout ce que la tablette sait de la partie en cours. */
  const etat = {
    code: null,            // le code de la salle, ex. « BRIK »
    fiches: [],            // la présentation des mini-jeux
    selection: null,       // les jeux cochés par l'animateur
    surprise: true,        // « Partie surprise » (jeux tirés au sort) ou « Je choisis les jeux »
    ordreHasard: true,     // en mode « Je choisis » : les jeux choisis s'enchaînent dans un ordre imprévisible
    salle: null,           // la liste des joueurs et l'étape en cours
    ecran: null,           // l'écran affiché { type, donnees }
    adresse: null,         // l'adresse que les joueurs doivent ouvrir
    aRepondu: new Set(),   // qui a déjà répondu à la question en cours
    traits: [],            // le dessin en cours (Dessine et devine)
    aConfirmer: null,      // le joueur dont on attend la confirmation de retrait
    // Les deux réglages du son, retenus par la tablette d'une soirée à l'autre (oui par défaut).
    sonDecompte: GT.memoire.lire('son-decompte') !== 'non',
    musiqueFond: GT.memoire.lire('musique-fond') !== 'non'
  };

  /*
   * ─── Le son de la soirée ───
   * Le compte à rebours (3… 2… 1…) : le chiffre géant s'affiche sur la
   * tablette ; le son suit le réglage 🔔. La musique de fond suit le
   * réglage 🎵 et s'adapte à l'écran : normale entre les manches, douce
   * pendant que l'on réfléchit, muette quand le jeu a besoin de silence
   * (les extraits du blind test, les battements de cœur de Feu vert !).
   */
  GT.chiffreGeant = true;
  GT.surDecompte = (n, options) => {
    if (etat.sonDecompte) GT.musique.decompte(n, options.depart);
    if (n === 3 && GT.ambiance.enCours()) GT.ambiance.niveau('doux');
  };
  const ECRANS_CALMES = ['qcm-question', 'dessin-tableau', 'erreurs-tableau', 'rire-ecriture', 'rire-vote', 'memoire-montre', 'gages-vote'];
  function reglerAmbiance() {
    const e = etat.ecran || { type: 'salon', donnees: {} };
    const d = e.donnees || {};
    // Blind test : le synthétiseur se met entièrement en veille pour laisser le haut-parleur à l'extrait.
    GT.musique.silence(!!d.extrait && (e.type === 'qcm-question' || e.type === 'qcm-revelation'));
    if (!etat.musiqueFond) return GT.ambiance.arreter();
    GT.ambiance.demarrer();
    // La Grande Finale : la musique accélère et monte ; elle redevient normale au salon et au podium.
    if (e.type === 'intro') GT.ambiance.finale(!!d.finale);
    else if (e.type === 'salon' || e.type === 'podium') GT.ambiance.finale(false);
    if (/^reflexe/.test(e.type) || d.extrait) GT.ambiance.niveau('muet');
    else if (ECRANS_CALMES.includes(e.type)) GT.ambiance.niveau('doux');
    else GT.ambiance.niveau('normal');
  }
  // Les navigateurs exigent un toucher d'écran avant tout son : le premier toucher, où qu'il soit, ouvre le son.
  document.addEventListener('pointerdown', function premierToucher() {
    GT.musique.debloquer();
    reglerAmbiance();
  }, { once: true });
  function boutonsSon() {
    return [
      h('button', { class: 'bouton bouton-petit bouton-discret bouton-son', 'aria-pressed': String(etat.sonDecompte), title: 'Le son du compte à rebours (3, 2, 1…)', onclick: () => {
        etat.sonDecompte = !etat.sonDecompte;
        GT.memoire.ecrire('son-decompte', etat.sonDecompte ? 'oui' : 'non');
        GT.musique.debloquer();
        if (etat.sonDecompte) GT.musique.decompte(1);
        majBandeau();
      } }, etat.sonDecompte ? '🔔 Décompte' : '🔕 Décompte'),
      h('button', { class: 'bouton bouton-petit bouton-discret bouton-son', 'aria-pressed': String(etat.musiqueFond), title: 'La musique de fond', onclick: () => {
        etat.musiqueFond = !etat.musiqueFond;
        GT.memoire.ecrire('musique-fond', etat.musiqueFond ? 'oui' : 'non');
        GT.musique.debloquer();
        reglerAmbiance();
        majBandeau();
      } }, etat.musiqueFond ? '🎵 Musique' : '🔇 Musique')
    ];
  }

  const scene = document.getElementById('scene');
  const bandeau = {
    code: document.getElementById('code-salle'),
    joueurs: document.getElementById('mini-joueurs'),
    commandes: document.getElementById('commandes')
  };

  /* ═══════════ La ligne avec le moteur ═══════════ */

  cnx.on('ouverte', () => {
    document.getElementById('hors-ligne').hidden = true;
    // Une tablette qui se recharge reprend sa salle au lieu d'en ouvrir une nouvelle.
    const code = GT.memoire.lire('code-tablette');
    cnx.emit(code ? 'tablette:reprendre' : 'tablette:creer', { code });
  });
  cnx.on('fermee', () => { document.getElementById('hors-ligne').hidden = false; });

  cnx.on('salle:creee', (d) => {
    etat.code = d.code;
    etat.fiches = d.jeux;
    if (!etat.selection) etat.selection = new Set(d.jeux.map((f) => f.id));
    GT.memoire.ecrire('code-tablette', d.code);
    bandeau.code.textContent = d.code;
  });

  cnx.on('salle:etat', (d) => {
    etat.salle = d;
    majBandeau();
    if (etat.ecran && etat.ecran.type === 'salon') afficher('salon', etat.ecran.donnees);
  });

  cnx.on('ecran', (m) => {
    GT.recalerHorloge(m.horloge);
    afficher(m.type, m.donnees);
  });

  cnx.on('evenement', (ev) => {
    const gestion = EVENEMENTS[ev.type];
    if (gestion) gestion(ev.donnees);
  });

  cnx.on('reaction', envol);
  cnx.on('erreur', (e) => GT.bulle(e.message, 'alerte'));

  /* ═══════════ Le bandeau du haut ═══════════ */

  function majBandeau() {
    const s = etat.salle;
    if (!s) return;
    bandeau.code.textContent = s.code;
    // Les joueurs, triés par score, avec une pastille verte quand ils ont répondu.
    const joueurs = s.joueurs.slice().sort((a, b) => b.score - a.score);
    bandeau.joueurs.replaceChildren(...joueurs.map((j) => h('div', {
      class: 'mini-joueur' + (j.connecte ? '' : ' absent') + (etat.aRepondu.has(j.id) ? ' a-repondu' : ''),
      'data-id': j.id, title: j.connecte ? j.nom : j.nom + ' (déconnecté)'
    }, h('span', { class: 'avatar' }, j.avatar), j.nom, ' ', h('b', {}, j.score))));

    // Les boutons de l'animateur changent selon l'étape ; ceux du son sont toujours là.
    const boutons = boutonsSon();
    if (s.etat === 'intro') boutons.push(h('button', { class: 'bouton bouton-petit', onclick: () => cnx.emit('tablette:passer') }, 'C\'est parti !'));
    if (s.etat === 'jeu') {
      boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('tablette:passer'), title: 'Passer à la suite' }, 'Passer ⏭'));
      boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('tablette:terminer-jeu') }, 'Terminer ce jeu'));
    }
    if (s.etat === 'gages') {
      boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('tablette:passer'), title: 'Passer à la suite' }, 'Passer ⏭'));
      boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('tablette:podium') }, 'Aller au podium'));
    }
    if (s.etat === 'classement' && !etat.enPause) boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('tablette:pause'), title: 'Arrêter l\'enchaînement automatique' }, '⏸ Pause'));
    if (s.etat === 'classement') boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('tablette:podium') }, 'Finir la partie'));
    // Un retardataire ? Le QR code de la salle peut être réaffiché à tout moment de la partie.
    if (s.etat !== 'salon' && !cnx.simulation) boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: ouvrirInvitation, title: 'Afficher le QR code pour rejoindre' }, '📱 QR code'));
    bandeau.commandes.replaceChildren(...boutons);
  }

  function marquerReponse(joueurId) {
    etat.aRepondu.add(joueurId);
    const pastille = bandeau.joueurs.querySelector('[data-id="' + joueurId + '"]');
    if (pastille) pastille.classList.add('a-repondu');
  }

  /* ═══════════ Le changement d'écran ═══════════ */

  function afficher(type, donnees) {
    const rendu = RENDUS[type];
    if (!rendu) return;
    const memeEcran = etat.ecran && etat.ecran.type === type;
    GT.arreterChronos();
    if (type !== 'qcm-question') GT.musique.arreter();
    // L'extrait du blind test continue pendant la révélation, puis s'arrête.
    if (type !== 'qcm-question' && type !== 'qcm-revelation') GT.extraits.arreter();
    if (type === 'qcm-question' || !memeEcran) { etat.aRepondu.clear(); }
    etat.ecran = { type, donnees };
    etat.enPause = false;
    clearInterval(etat.coeur); clearInterval(etat.murmures); // on coupe les battements de cœur de Feu vert !
    scene.replaceChildren(rendu(donnees));
    scene.scrollTop = 0;
    majBandeau();
    if (rendu.apres) rendu.apres(donnees);
    reglerAmbiance();
  }

  /* ═══════════ Les écrans, un par un ═══════════ */

  const RENDUS = {};

  /*
   * L'invitation : un QR code propre à la partie en cours. Il contient
   * l'adresse du jeu suivie du code de la salle (…/joueur.html?code=BRIK) :
   * un nouveau code, donc un nouveau QR code, à chaque partie. Le joueur
   * qui le scanne arrive directement à la bonne table, sans rien taper.
   * Le dessin est fait sur place par js/qrcode.js, même sans Internet.
   */
  function fabriquerQR() {
    const lien = (etat.adresse || location.origin) + '/jouer?code=' + (etat.code || '');
    const qr = h('div', { class: 'qr', 'aria-label': 'QR code pour rejoindre la partie' });
    if (cnx.simulation) qr.replaceChildren(h('p', { style: { padding: '16px', color: '#151933' } }, 'Simulateur : les téléphones sont dans le panneau de droite.'));
    else if (window.qrcode && etat.code) {
      try {
        const code = window.qrcode(0, 'M');
        code.addData(lien);
        code.make();
        qr.innerHTML = code.createSvgTag({ margin: 3 });
      } catch (e) { qr.replaceChildren(h('p', { style: { padding: '16px', color: '#151933' } }, 'Ouvrez l\'adresse ci-dessous sur votre téléphone.')); }
    } else qr.replaceChildren(h('p', { style: { padding: '16px', color: '#151933' } }, 'Ouvrez l\'adresse ci-dessous sur votre téléphone.'));
    return qr;
  }

  function carteInvitation() {
    return h('section', { class: 'invitation' },
      h('h2', {}, 'Rejoignez la table !'),
      h('p', {}, 'Scannez le code avec l\'appareil photo de votre téléphone, ou ouvrez l\'adresse et tapez le code.'),
      fabriquerQR(),
      h('div', { class: 'code-geant', 'aria-label': 'Code de la partie' }, etat.code || '····'),
      cnx.simulation ? null : adresseFacile()
    );
  }

  /*
   * Sans QR code, le joueur tape une adresse courte, sans « http:// » :
   * le nom facile « tablee.local/jouer » quand il est disponible, et
   * toujours l'adresse en chiffres en secours (elle marche partout).
   */
  function adresseFacile() {
    const courte = etat.courte || (etat.adresse || location.origin).replace(/^https?:\/\//, '');
    return h('div', { class: 'adresse-facile' },
      h('span', { class: 'muet' }, 'Sans QR code, tapez dans le navigateur :'),
      etat.nomFacile ? h('strong', { class: 'adresse-nom' }, etat.nomFacile + '/jouer') : null,
      h(etat.nomFacile ? 'span' : 'strong', { class: etat.nomFacile ? 'adresse-secours' : 'adresse-nom' }, (etat.nomFacile ? 'ou ' : '') + courte + '/jouer'));
  }

  /* En cours de partie : la même invitation, en grand par-dessus le jeu. Une touche n'importe où la referme. */
  function ouvrirInvitation() {
    const ancienne = document.getElementById('fenetre-qr');
    if (ancienne) { ancienne.remove(); return; }
    const fenetre = h('div', { id: 'fenetre-qr', class: 'fenetre-qr', role: 'dialog', 'aria-label': 'Rejoindre la partie', onclick: () => fenetre.remove() },
      carteInvitation(),
      h('p', { class: 'muet' }, 'Touchez l\'écran pour revenir au jeu. Le nouveau venu entre dans la partie au prochain tour.'));
    document.body.appendChild(fenetre);
  }

  /* ─── Le salon : on invite les joueurs et on choisit les jeux ─── */
  RENDUS.salon = function () {
    const s = etat.salle || { joueurs: [], minJoueurs: 1, maxJoueurs: 12 };
    const presents = s.joueurs.filter((j) => j.connecte).length;
    const manque = Math.max(0, s.minJoueurs - presents);

    const invitation = carteInvitation();

    // Les joueurs présents, avec la possibilité d'en retirer un (en deux touches, pour éviter les accidents).
    const cartes = s.joueurs.map((j) => h('div', { class: 'carte-joueur' + (j.connecte ? '' : ' absent') },
      h('span', { class: 'avatar' }, j.avatar),
      h('span', { class: 'nom' }, j.nom),
      etat.aConfirmer === j.id
        ? h('button', { class: 'bouton bouton-petit', style: { background: 'var(--corail)', boxShadow: 'none' }, onclick: () => { etat.aConfirmer = null; cnx.emit('tablette:retirer', { joueurId: j.id }); } }, 'Retirer ?')
        : h('button', { class: 'retirer', 'aria-label': 'Retirer ' + j.nom, onclick: () => { etat.aConfirmer = j.id; afficher('salon', {}); setTimeout(() => { if (etat.aConfirmer === j.id) { etat.aConfirmer = null; afficher('salon', {}); } }, 4000); } }, '✕')
    ));
    for (let i = s.joueurs.length; i < s.minJoueurs; i++) cartes.push(h('div', { class: 'carte-joueur place-libre' }, 'Place libre'));

    const jeux = etat.fiches.map((f) => h('button', {
      class: 'carte-jeu', 'aria-pressed': String(etat.selection.has(f.id)),
      onclick: () => { etat.selection.has(f.id) ? etat.selection.delete(f.id) : etat.selection.add(f.id); afficher('salon', {}); }
    }, h('span', { class: 'icone' }, f.icone), h('strong', {}, f.nom), h('span', {}, f.resume),
      // Un jeu qui demande plusieurs joueurs le dit, et sera simplement sauté si l'on n'est pas assez nombreux.
      f.minJoueurs > 1 ? h('span', { class: 'muet', style: { fontSize: '.85rem' } }, '👥 dès ' + f.minJoueurs + ' joueurs' + (presents < f.minJoueurs ? ' : sauté pour l\'instant' : '')) : null));

    // Deux façons de jouer : la partie surprise (recommandée) ou le menu choisi à la main.
    const choixMode = h('div', { class: 'choix-mode', role: 'group', 'aria-label': 'Façon de jouer' },
      h('button', { class: 'mode', 'aria-pressed': String(etat.surprise), onclick: () => { etat.surprise = true; afficher('salon', {}); } },
        h('strong', {}, '🎲 Partie surprise'), h('span', {}, 'Les jeux sont tirés au sort jusqu\'à la ligne d\'arrivée.')),
      h('button', { class: 'mode', 'aria-pressed': String(!etat.surprise), onclick: () => { etat.surprise = false; afficher('salon', {}); } },
        h('strong', {}, '✋ Je choisis'), h('span', {}, 'Vous composez le menu de la soirée.')));
    const explicationSurprise = h('div', { class: 'explication-surprise' },
      h('p', {}, '🏁 Au lancement, le hasard fixe une ', h('b', {}, 'ligne d\'arrivée'), ' (entre 8 000 et 11 000 points). Les mini-jeux s\'enchaînent au hasard ; dès que quelqu\'un franchit la ligne, la manche suivante est la ', h('b', {}, 'Grande Finale ⚡'), ' à points doublés. Puis le podium… et quelques prix pour rire.'),
      h('div', { class: 'icones-jeux', 'aria-hidden': 'true' }, etat.fiches.map((f) => h('span', {}, f.icone))));

    const lancer = h('button', {
      class: 'bouton', disabled: manque > 0 || (!etat.surprise && !etat.selection.size),
      onclick: () => {
        GT.musique.debloquer();      // le toucher d'écran autorise le son pour toute la soirée
        GT.extraits.debloquer();     // … et les extraits du blind test
        GT.garderEcranAllume();
        if (etat.surprise) cnx.emit('tablette:lancer', { mode: 'surprise' });
        else cnx.emit('tablette:lancer', { programme: etat.fiches.map((f) => f.id).filter((id) => etat.selection.has(id)), melanger: etat.ordreHasard });
      }
    }, etat.surprise ? 'Lancer la partie surprise 🎲' : 'Lancer la partie');

    return h('div', { class: 'salon' },
      invitation,
      h('div', { class: 'colonne' },
        h('section', {},
          h('div', { class: 'bloc-titre' }, h('h3', {}, 'À table'), h('span', { class: 'muet' }, s.joueurs.length + ' / ' + s.maxJoueurs + ' joueurs')),
          h('div', { class: 'grille-joueurs' }, cartes)),
        h('section', {},
          h('div', { class: 'bloc-titre' }, h('h3', {}, 'Au menu ce soir'), etat.surprise ? null : h('span', { class: 'muet' }, etat.selection.size + ' jeu' + (etat.selection.size > 1 ? 'x' : '') + ' choisi' + (etat.selection.size > 1 ? 's' : ''))),
          choixMode,
          etat.surprise ? explicationSurprise : h('div', { class: 'grille-jeux' }, jeux),
          etat.surprise ? null : h('button', { class: 'ordre-hasard', 'aria-pressed': String(etat.ordreHasard), onclick: () => { etat.ordreHasard = !etat.ordreHasard; afficher('salon', {}); } },
            etat.ordreHasard ? '🔀 Ordre au hasard : oui' : '➡️ Ordre au hasard : non (dans l\'ordre de la liste)')),
        h('div', { class: 'lancement' }, lancer,
          h('span', { class: 'muet' }, manque > 0 ? 'Encore ' + manque + ' joueur' + (manque > 1 ? 's' : '') + ' pour commencer.' : (!etat.surprise && !etat.selection.size) ? 'Choisissez au moins un jeu.' : 'Tout le monde est là ? C\'est parti !'))
      )
    );
  };

  /* ─── La présentation d'un jeu ─── */
  /*
   * Avant chaque jeu : son nom, sa règle et, pour pimenter, les cibles
   * de la manche (« 🦊 Léa ▸ 🐻 Papy » : Léa doit dépasser Papy). Pour la
   * dernière manche, un grand bandeau annonce la Grande Finale.
   */
  RENDUS.intro = function (d) {
    const poursuites = (d.defis || []).filter((x) => x.type === 'depasser');
    return h('div', { class: 'intro' + (d.finale ? ' intro-finale' : '') },
      d.finale
        ? h('div', { class: 'bandeau-finale' }, '⚡ GRANDE FINALE ⚡', h('small', {}, 'Tous les points comptent double !'))
        : h('span', { class: 'etiquette' }, d.surprise ? '🎲 Manche ' + d.numero + ' · le hasard a choisi…' : 'Jeu ' + d.numero + ' sur ' + d.total),
      h('div', { class: 'icone-geante', 'aria-hidden': 'true' }, d.fiche.icone),
      h('h1', {}, d.fiche.nom),
      d.inattendu ? h('div', { class: 'inattendu' },
        h('strong', {}, d.inattendu.icone + ' Défi inattendu pour ' + d.inattendu.joueur.avatar + ' ' + d.inattendu.joueur.nom + ' !'),
        h('span', {}, d.inattendu.titre + ' ' + d.inattendu.texte)) : null,
      h('p', { class: 'regle' }, d.fiche.regle),
      poursuites.length
        ? h('div', { class: 'cibles' },
          h('span', { class: 'etiquette' }, '🎯 Les cibles de la manche · prime +' + d.prime),
          h('div', { class: 'gagnants', style: { justifyContent: 'center' } }, poursuites.map((x) => h('span', { class: 'gagnant' }, x.avatar + ' ' + x.nom + ' ▸ ' + x.cibleAvatar + ' ' + x.cibleNom))))
        : (d.defis && d.defis.length ? h('p', { class: 'muet' }, '🎯 Chacun a reçu un défi secret sur son téléphone · prime +' + d.prime) : null),
      h('div', { style: { width: 'min(520px, 100%)' } }, GT.chrono(d.finA, d.dureeMs, { grand: true, depart: true }))
    );
  };

  /*
   * ─── Le zoom infernal ───
   * L'image (un pictogramme, ou une photo de la propriétaire) est posée
   * dans un cadre qui coupe ce qui dépasse. On l'agrandit énormément
   * autour d'un point choisi par le moteur, puis on la ramène à sa taille
   * normale au rythme du chronomètre. Le dézoom suit une courbe
   * « exponentielle » : au début on reste longtemps dans le flou, puis
   * tout s'accélère… et la tension monte.
   */
  const cadreZoom = (z, finA, dureeMs, revele) => GT.cadreZoom(z, finA, dureeMs, revele);

  /* ─── Les questions (quiz, zoom infernal, pièges du français) ─── */
  function tuilesReponses(choix, options) {
    options = options || {};
    return h('div', { class: 'reponses' + (options.bonne !== undefined ? ' revelee' : '') + (options.compact ? ' reponses-compactes' : '') }, choix.map((texte, i) =>
      h('div', { class: 'reponse ' + GT.classesChoix[i] + (options.bonne === i ? ' juste' : '') },
        h('span', { class: 'forme', 'aria-hidden': 'true' }, GT.formes[i]),
        h('span', { class: 'texte' }, texte),
        options.repartition ? h('span', { class: 'compte', title: 'Nombre de réponses' }, options.repartition[i]) : null)));
  }

  RENDUS['qcm-question'] = function (d) {
    const compteur = h('span', { id: 'compteur-reponses', class: 'muet' }, d.nbRepondu + ' / ' + d.nbJoueurs + ' ont répondu');
    let platine = null;
    if (d.extrait) {
      // Le blind test : un vinyle qui tourne, un égaliseur, et l'état de l'extrait.
      platine = h('div', { class: 'platine-tubes' },
        h('div', { class: 'vinyle-tubes en-attente', id: 'vinyle', 'aria-hidden': 'true' }),
        h('div', { class: 'egaliseur', 'aria-hidden': 'true' }, h('span'), h('span'), h('span'), h('span'), h('span')),
        h('div', { style: { display: 'grid', gap: '6px' } },
          h('span', { class: 'etat-extrait', id: 'etat-extrait' }, '🔎 Recherche de l\'extrait…'),
          h('button', { class: 'bouton bouton-discret bouton-petit', onclick: () => { GT.extraits.debloquer(); lancerExtrait(d); } }, '🔁 Relancer le son')));
    }
    if (d.zoom) {
      return h('div', { class: 'qcm' },
        h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, '🔎 ' + (d.surtitre || 'Le zoom infernal')), h('span', { class: 'muet' }, 'Image ' + d.numero + ' / ' + d.total)),
        h('div', { class: 'zoom-ligne' },
          cadreZoom(d.zoom, d.finA, d.dureeMs, false),
          h('div', { class: 'colonne' }, h('h2', { class: 'qcm-question' }, d.intitule), tuilesReponses(d.choix, { compact: true }))),
        h('div', { class: 'qcm-pied' }, GT.chrono(d.finA, d.dureeMs, { grand: true }), compteur));
    }
    return h('div', { class: 'qcm' },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, d.surtitre || 'Question'), h('span', { class: 'muet' }, 'Question ' + d.numero + ' / ' + d.total)),
      platine,
      h('h2', { class: 'qcm-question' }, d.intitule),
      d.drapeau ? GT.drapeau(d.drapeau) : null,
      d.puzzle ? GT.puzzle(d.puzzle, d.finA, d.dureeMs) : null,
      // Casse-tête, recette mystère : l'énigme en grandes tuiles (qui peuvent apparaître une à une).
      d.illustration ? GT.illustration(d.illustration, { debut: d.finA - d.dureeMs }) : null,
      tuilesReponses(d.choix),
      h('div', { class: 'qcm-pied' }, GT.chrono(d.finA, d.dureeMs, { grand: true }), compteur)
    );
  };
  RENDUS['qcm-question'].apres = (d) => { if (d.extrait) lancerExtrait(d); };

  /*
   * L'extrait du blind test : la tablette le cherche chez Apple et le joue.
   * S'il est introuvable, elle prévient le moteur, qui passe à la suite.
   */
  function lancerExtrait(d) {
    const etatEl = document.getElementById('etat-extrait');
    GT.extraits.jouer(d.extrait.artiste, d.extrait.titre)
      .then(() => {
        if (etatEl) etatEl.textContent = '🎧 Écoutez bien !';
        const v = document.getElementById('vinyle'); if (v) v.classList.remove('en-attente');
      })
      .catch(() => {
        if (etatEl) etatEl.textContent = '😕 Extrait introuvable… on passe à la suite.';
        cnx.emit('tablette:signal', { type: 'extrait-indisponible', numero: d.extrait.numero });
      });
  }

  /* À la révélation du blind test : la pochette de l'album (fournie par Apple), avec le crédit. */
  function pochette(extrait) {
    const trouve = GT.extraits.deja(extrait.artiste, extrait.titre);
    return h('div', { class: 'platine-tubes' },
      trouve && trouve.pochette ? h('img', { class: 'pochette', src: trouve.pochette, alt: 'Pochette : ' + extrait.titre }) : h('div', { class: 'vinyle-tubes', 'aria-hidden': 'true' }),
      h('div', { style: { display: 'grid', gap: '6px', textAlign: 'left' } },
        h('strong', { style: { fontSize: '1.6rem' } }, extrait.titre),
        h('span', { style: { fontSize: '1.2rem' } }, extrait.artiste),
        h('span', { class: 'credit-apple' }, 'Extrait et pochette : Apple Music', trouve && trouve.lien ? [' · ', h('a', { href: trouve.lien, target: '_blank', rel: 'noopener' }, 'écouter le titre')] : null)));
  }

  /* Un message du jeu en cours (par exemple : pas d'Internet pour le blind test). */
  RENDUS['info-jeu'] = function (d) {
    return h('div', { class: 'intro' }, h('h1', {}, d.titre), d.texte ? h('p', { class: 'regle' }, d.texte) : null);
  };

  RENDUS['qcm-revelation'] = function (d) {
    const ex = d.explication || {};
    if (d.zoom) {
      return h('div', { class: 'qcm' },
        h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, '🔎 ' + (d.surtitre || 'Le zoom infernal')), h('span', { class: 'muet' }, 'Image ' + d.numero + ' / ' + d.total)),
        h('div', { class: 'zoom-ligne' },
          cadreZoom(d.zoom, 0, 0, true),
          h('div', { class: 'colonne' }, h('h2', { class: 'qcm-question' }, ex.titre || 'La réponse'), tuilesReponses(d.choix, { bonne: d.bonne, repartition: d.repartition, compact: true }))),
        h('div', { class: 'gagnants' }, d.gagnants.length
          ? d.gagnants.map((g) => h('span', { class: 'gagnant' }, g.avatar + ' ' + g.nom, h('b', {}, '+' + g.points)))
          : h('span', { class: 'muet' }, 'Personne n\'a trouvé… Ce zoom était vraiment infernal !')));
    }
    return h('div', { class: 'qcm' },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, d.surtitre || 'Réponse'), h('span', { class: 'muet' }, 'Question ' + d.numero + ' / ' + d.total)),
      h('h2', { class: 'qcm-question' }, d.intitule),
      d.drapeau ? GT.drapeau(d.drapeau) : null,
      d.puzzle ? GT.puzzle(d.puzzle, 0, 0) : null,
      d.extrait && d.extrait.revele ? pochette(d.extrait) : null,
      d.illustration ? GT.illustration(d.illustration, { toutVoir: true }) : null,
      tuilesReponses(d.choix, { bonne: d.bonne, repartition: d.repartition }),
      (ex.titre || ex.texte) ? h('div', { class: 'explication' }, ex.titre ? h('strong', {}, ex.titre) : null, ex.texte ? h('p', {}, ex.texte) : null) : null,
      h('div', { class: 'gagnants' }, d.gagnants.length
        ? d.gagnants.map((g) => h('span', { class: 'gagnant' }, g.avatar + ' ' + g.nom, h('b', {}, '+' + g.points)))
        : h('span', { class: 'muet' }, 'Personne n\'a trouvé… La question était coriace !'))
    );
  };

  /* ─── Dessine et devine ─── */
  RENDUS['dessin-tableau'] = function (d) {
    etat.traits = JSON.parse(JSON.stringify(d.traits || []));
    const canvas = h('canvas', { id: 'toile-tablette', 'aria-label': 'Dessin en cours' });
    const fil = h('div', { class: 'fil', id: 'fil' });
    (d.trouveurs || []).forEach((t) => fil.prepend(h('div', { class: 'fil-ligne trouve' }, t.avatar + ' ' + t.nom + ' a trouvé ! +' + t.points)));
    (d.propositions || []).forEach((p) => fil.prepend(h('div', { class: 'fil-ligne' }, p.avatar + ' ' + p.nom + ' : « ' + p.texte + ' »')));
    return h('div', { class: 'atelier' },
      h('div', { class: 'feuille' }, canvas),
      h('div', { class: 'colonne' },
        h('div', {}, h('span', { class: 'etiquette' }, 'Dessin ' + d.tour + ' / ' + d.total)),
        h('h2', { style: { fontSize: '1.8rem' } }, d.auteur.avatar + ' ' + d.auteur.nom + ' dessine…'),
        h('div', { class: 'indice', id: 'indice', 'aria-label': 'Indice' }, d.indice),
        GT.chrono(d.finA, d.dureeMs, { grand: true }),
        h('p', { class: 'muet' }, 'Tapez vos réponses sur votre téléphone.'),
        fil)
    );
  };
  RENDUS['dessin-tableau'].apres = () => {
    const canvas = document.getElementById('toile-tablette');
    GT.toile.ajuster(canvas);
    GT.toile.toutRedessiner(canvas, etat.traits);
  };

  RENDUS['dessin-fin'] = function (d) {
    const canvas = h('canvas', { id: 'toile-tablette', 'aria-label': 'Le dessin terminé' });
    etat.traits = d.traits || [];
    return h('div', { class: 'atelier' },
      h('div', { class: 'feuille' }, canvas),
      h('div', { class: 'colonne' },
        h('span', { class: 'etiquette' }, 'C\'était…'),
        h('h1', { style: { fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', color: 'var(--tournesol)' } }, d.mot),
        d.auteur ? h('p', { class: 'muet' }, 'Un dessin signé ' + d.auteur.avatar + ' ' + d.auteur.nom) : null,
        d.trouveurs.length
          ? h('div', { class: 'gagnants' }, d.trouveurs.map((t) => h('span', { class: 'gagnant' }, t.avatar + ' ' + t.nom, h('b', {}, '+' + t.points))))
          : h('p', {}, 'Personne n\'a trouvé. L\'art moderne a ses mystères.'),
        h('p', { class: 'muet' }, d.dernier ? 'C\'était le dernier dessin !' : 'Prochain dessinateur dans quelques secondes…'))
    );
  };
  RENDUS['dessin-fin'].apres = () => {
    const canvas = document.getElementById('toile-tablette');
    GT.toile.ajuster(canvas);
    GT.toile.toutRedessiner(canvas, etat.traits);
  };

  /* ─── Les 7 erreurs ─── */
  function jaugeCoureur(id, p, nbErreurs) {
    return h('div', { class: 'coureur', 'data-coureur': id },
      h('span', { class: 'avatar' }, p.avatar),
      h('div', {}, h('div', {}, p.nom), h('div', { class: 'jauge' }, h('i', { style: { width: (p.nb / nbErreurs * 100) + '%' } }))),
      h('b', {}, p.nb + '/' + nbErreurs));
  }

  RENDUS['erreurs-tableau'] = function (d) {
    return h('div', { class: 'colonne' },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, '7 erreurs en 1 minute'), h('span', { class: 'muet' }, 'Cherchez sur votre téléphone !')),
      h('div', { class: 'duo' },
        h('div', { class: 'cadre', html: GT.scene.svg(d.originale, { titre: 'Image d\'origine' }) }),
        h('div', { class: 'cadre', html: GT.scene.svg(d.modifiee, { titre: 'Image modifiée' }) })),
      GT.chrono(d.finA, d.dureeMs, { grand: true }),
      h('div', { class: 'course', id: 'course' }, Object.entries(d.progression).map(([id, p]) => jaugeCoureur(id, p, d.nbErreurs)))
    );
  };

  RENDUS['erreurs-fin'] = function (d) {
    const cercles = d.differences.map((x) => ({ x: x.x, y: x.y, r: x.r, classe: 'cercle-trouve' }));
    return h('div', { class: 'colonne' },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, 'La solution'), h('span', { class: 'muet' }, 'Les ' + d.nbErreurs + ' différences sont entourées')),
      h('div', { class: 'duo' },
        h('div', { class: 'cadre', html: GT.scene.svg(d.originale, { cercles }) }),
        h('div', { class: 'cadre', html: GT.scene.svg(d.modifiee, { cercles }) })),
      h('div', { class: 'gagnants' }, d.classement.map((c) => h('span', { class: 'gagnant' }, c.avatar + ' ' + c.nom + ' · ' + c.nb + '/' + d.nbErreurs, h('b', {}, '+' + c.points))))
    );
  };

  /* ─── Le classement entre deux jeux ─── */
  function lignesClassement(classement, avecGain) {
    const max = Math.max(1, ...classement.map((c) => c.score));
    return classement.map((c, i) => h('div', { class: 'ligne-classement', style: { animationDelay: (i * 70) + 'ms' } },
      h('span', { class: 'place' }, GT.rang(i + 1)),
      h('span', { class: 'avatar' }, c.avatar),
      h('div', { style: { minWidth: 0 } }, h('div', { class: 'nom' }, c.nom), h('div', { class: 'barre', style: { width: (c.score / max * 100) + '%' } })),
      h('span', { class: 'total' }, GT.points(c.score), avecGain && c.gain ? h('span', { class: 'gain' }, '+' + c.gain + ' ce jeu') : null)));
  }

  /*
   * La ligne d'arrivée de la partie surprise : une piste où chaque joueur
   * avance vers le drapeau. On voit d'un coup d'œil qui va la franchir.
   */
  function ligneArrivee(d) {
    const objectif = Math.max(1, d.objectif || 1);
    return h('div', { class: 'piste', 'aria-label': 'La course vers la ligne d\'arrivée' },
      d.classement.slice(0, 6).map((c) => h('div', { class: 'couloir' },
        h('span', { class: 'coureur', style: { left: 'calc(' + Math.min(100, c.score / objectif * 100) + '% - 18px)' }, title: c.nom }, c.avatar))),
      h('span', { class: 'drapeau-arrivee', 'aria-hidden': 'true' }, '🏁'));
  }

  RENDUS.classement = function (d) {
    return h('div', { class: 'colonne', style: { maxWidth: '900px', width: '100%', margin: '0 auto' } },
      h('div', { class: 'qcm-tete' }, h('h1', { style: { fontSize: '2.4rem' } }, 'Le classement'), h('span', { class: 'etiquette' }, d.surprise ? 'Après la manche ' + d.numero + ' · ligne d\'arrivée : ' + GT.points(d.objectif) : 'Après le jeu ' + d.numero + ' / ' + d.total)),
      d.surprise ? ligneArrivee(d) : null,
      h('div', { class: 'palmares' }, lignesClassement(d.classement, true)),
      d.resultatInattendu ? h('div', { class: 'inattendu' }, h('strong', {}, d.resultatInattendu.icone + ' ' + d.resultatInattendu.titre), h('span', {}, d.resultatInattendu.texte)) : null,
      (d.commentaires || []).length ? h('div', { class: 'commentateur' }, h('span', { class: 'micro', 'aria-hidden': 'true' }, '🎙️'), h('div', {}, d.commentaires.map((c) => h('p', {}, c)))) : null,
      d.nbDefis
        ? h('div', { class: 'cibles' },
          h('span', { class: 'etiquette' }, '🎯 Défis réussis : ' + (d.defisReussis || []).length + ' / ' + d.nbDefis),
          (d.defisReussis || []).length
            ? h('div', { class: 'gagnants' }, d.defisReussis.map((r) => h('span', { class: 'gagnant' }, r.avatar + ' ' + r.nom, h('b', {}, '+' + r.prime))))
            : h('p', { class: 'muet' }, 'Personne n\'a rempli son défi… La revanche, c\'est maintenant !'))
        : null,
      d.prochainFinale ? h('div', { class: 'bandeau-finale' }, '⚡ Prochaine manche : la GRANDE FINALE', h('small', {}, d.annonceFinale ? d.annonceFinale.texte : 'Points doublés : tout peut encore basculer !')) : null,
      h('div', { class: 'lancement' },
        h('button', { class: 'bouton', onclick: () => cnx.emit('tablette:passer') },
          d.dernier ? (d.tribunal ? 'Le tribunal des gages 🤫' : 'Voir le podium 🏆') : d.prochain ? 'Jeu suivant : ' + d.prochain.icone + ' ' + d.prochain.nom : d.prochainFinale ? 'Tirer au sort la finale 🎲' : 'Tirer au sort la manche suivante 🎲'),
        // L'enchaînement automatique : la suite démarre toute seule à la fin de ce compte à rebours.
        d.autoFinA ? h('div', { class: 'suite-auto', id: 'suite-auto' },
          h('span', { class: 'muet' }, d.dernier ? (d.tribunal ? 'Le tribunal commence dans…' : 'Le podium arrive dans…') : 'La suite démarre toute seule dans…'),
          GT.chrono(d.autoFinA, d.autoMs, { calme: true })) : null)
    );
  };

  /*
   * ─── Les Fous Rires ───
   * 1. L'écriture : la phrase à compléter en très grand, et les avatars
   *    de ceux qui ont déjà écrit (sans dévoiler ce qu'ils ont écrit).
   * 2. Le vote : toutes les réponses, anonymes, en grandes cartes.
   * 3. Le résultat : on retourne les cartes une à une, de la moins votée
   *    à la plus votée, avec le nom de l'auteur. Le meilleur moment !
   */
  RENDUS['rire-ecriture'] = function (d) {
    return h('div', { class: 'rires' },
      h('div', { class: 'qcm-tete', style: { width: '100%' } }, h('span', { class: 'etiquette' }, '🤪 Les Fous Rires · Invente la suite'), h('span', { class: 'muet' }, 'Tour ' + d.tour + ' / ' + d.total)),
      h('h1', { class: 'amorce' }, d.amorce, h('span', { class: 'pointilles', 'aria-hidden': 'true' }, ' …')),
      h('p', { class: 'consigne-vote' }, 'Écrivez la suite la plus drôle sur votre téléphone !'),
      h('div', { style: { width: 'min(620px, 100%)' } }, GT.chrono(d.finA, d.dureeMs, { grand: true })),
      h('div', { class: 'gagnants', id: 'ont-ecrit' }, (d.ontEcrit || []).map((j) => h('span', { class: 'gagnant' }, j.avatar + ' ' + j.nom + ' ✍️'))),
      h('span', { id: 'compteur-ecrits', class: 'muet' }, (d.ontEcrit || []).length + ' / ' + d.nbJoueurs + ' ont écrit'));
  };

  RENDUS['rire-vote'] = function (d) {
    return h('div', { class: 'rires' },
      h('div', { class: 'qcm-tete', style: { width: '100%' } }, h('span', { class: 'etiquette' }, '🗳️ Votez pour la plus drôle !'), h('span', { class: 'muet' }, 'Tour ' + d.tour + ' / ' + d.total)),
      h('h2', { class: 'amorce amorce-petite' }, d.amorce),
      h('div', { class: 'cartes-rire' }, d.reponses.map((r, i) => h('div', { class: 'carte-rire', style: { animationDelay: (i * 120) + 'ms' } }, r.texte))),
      h('div', { style: { width: 'min(620px, 100%)' } }, GT.chrono(d.finA, d.dureeMs, { grand: true })),
      h('span', { id: 'compteur-votes-rire', class: 'muet' }, d.nbVotes + ' / ' + d.nbVotants + ' ont voté · l\'une de ces réponses a été écrite par le jeu 🤖'));
  };

  RENDUS['rire-resultat'] = function (d) {
    // On dévoile de la moins votée à la plus votée : le suspense monte jusqu'à la gagnante.
    const lignes = d.lignes.slice().reverse();
    return h('div', { class: 'rires' },
      h('div', { class: 'qcm-tete', style: { width: '100%' } }, h('span', { class: 'etiquette' }, '😂 Qui a écrit quoi ?'), h('span', { class: 'muet' }, 'Tour ' + d.tour + ' / ' + d.total)),
      h('h2', { class: 'amorce amorce-petite' }, d.amorce),
      d.fouRire ? h('div', { class: 'bandeau-fourire' }, '🤣 FOU RIRE GÉNÉRAL ! +300') : null,
      h('div', { class: 'cartes-rire resultat' }, lignes.map((l, i) => h('div', {
        class: 'carte-rire retournee' + (l.gagnant ? ' gagnante' : '') + (l.maison ? ' maison' : ''),
        style: { animationDelay: (i * 900) + 'ms' }
      },
        h('span', { class: 'texte-rire' }, l.texte),
        h('span', { class: 'auteur-rire' }, l.maison ? '🤖 La maison' : l.auteur ? l.auteur.avatar + ' ' + l.auteur.nom : '❔'),
        h('span', { class: 'votes-carte' }, (l.gagnant ? '👑 ' : '') + l.votes.length + ' vote' + (l.votes.length > 1 ? 's' : '') + (l.points ? ' · +' + l.points : '')),
        l.votes.length ? h('span', { class: 'votants' }, l.votes.map((v) => v.avatar).join(' ')) : null))),
      d.maisonGagne ? h('p', { class: 'texte-finale' }, '🤖 La maison remporte ce tour ! Vous vous êtes fait avoir…') : d.piegesMaison ? h('p', { class: 'muet' }, '🤖 ' + d.piegesMaison + ' vote' + (d.piegesMaison > 1 ? 's' : '') + ' pour la réponse du jeu !') : null,
      h('p', { class: 'muet' }, d.dernier ? 'C\'était le dernier tour !' : 'Tour suivant dans un instant…'));
  };

  /*
   * ─── Le tribunal des gages ───
   * Chaque gage secret est révélé : les autres joueurs votent sur leur
   * téléphone. Puis le verdict, et le classement qui bouge (ou pas).
   */
  RENDUS['gages-vote'] = function (d) {
    return h('div', { class: 'tribunal' },
      h('span', { class: 'etiquette' }, '🤫 Le tribunal des gages · ' + d.numero + ' / ' + d.total),
      h('div', { class: 'accuse' }, h('span', { class: 'avatar-geant', 'aria-hidden': 'true' }, d.accuse.avatar), h('h1', {}, d.accuse.nom)),
      h('p', { class: 'muet' }, 'avait pour gage secret de…'),
      h('blockquote', { class: 'gage-revele' }, d.gage),
      h('p', { class: 'consigne-vote' }, 'A-t-il réussi ? Votez sur vos téléphones ! ', h('b', {}, 'Gage réussi : +' + d.prime + ' points.')),
      h('div', { style: { width: 'min(520px, 100%)' } }, GT.chrono(d.finA, d.dureeMs, { grand: true })),
      h('span', { id: 'compteur-votes', class: 'muet' }, d.nbVotes + ' / ' + d.nbVotants + ' ont voté'));
  };

  RENDUS['gages-verdict'] = function (d) {
    const monte = d.reussi && d.rangApres < d.rangAvant;
    return h('div', { class: 'tribunal' },
      h('span', { class: 'etiquette' }, '🤫 Le verdict · ' + d.numero + ' / ' + d.total),
      h('div', { class: 'accuse' }, h('span', { class: 'avatar-geant', 'aria-hidden': 'true' }, d.accuse ? d.accuse.avatar : '❔'), h('h1', {}, d.accuse ? d.accuse.nom : '')),
      h('div', { class: 'verdict ' + (d.reussi ? 'verdict-oui' : 'verdict-non') },
        d.reussi ? '✅ Gage réussi ! +' + d.prime + ' points' : '❌ Gage raté !',
        h('small', {}, d.oui + ' oui · ' + d.non + ' non' + (!d.reussi && d.oui === d.non && d.oui > 0 ? ' — égalité : le doute ne profite à personne !' : ''))),
      monte ? h('p', { class: 'texte-finale' }, '📈 ' + d.accuse.nom + ' passe de la ' + GT.rang(d.rangAvant) + ' à la ' + GT.rang(d.rangApres) + ' place !') : null,
      h('div', { class: 'palmares', style: { width: 'min(760px, 100%)' } }, lignesClassement(d.classement.slice(0, 5), false)),
      h('p', { class: 'muet' }, d.dernier ? 'Et maintenant… le podium !' : 'Gage suivant dans quelques secondes…'));
  };

  /*
   * ─── Feu vert ! ───
   * L'écran d'attente est fait pour stresser (gentiment) : un grand feu
   * qui bat comme un cœur, un fond qui pulse en rouge sombre, des petites
   * phrases qui changent (« Pas encore… », « Doigts prêts… ») et un son
   * de battement grave. Puis tout passe au VERT d'un coup, avec un bip.
   * Le piège rouge, lui, s'accompagne d'un bourdonnement.
   */
  const MURMURES = ['Attention…', 'Pas encore…', 'Doigts prêts…', 'Concentration…', 'Ne bougez plus…', 'Respirez…', 'Ça arrive…', 'Patience…'];
  RENDUS['reflexe-attente'] = function (d) {
    return h('div', { class: 'reflexe', id: 'reflexe' },
      h('div', { class: 'qcm-tete', style: { width: '100%' } }, h('span', { class: 'etiquette' }, '🚦 Feu vert !'), h('span', { class: 'muet' }, 'Tour ' + d.tour + ' / ' + d.total)),
      h('div', { class: 'feu', id: 'feu', 'aria-hidden': 'true' }),
      h('div', { class: 'consigne-reflexe', id: 'consigne-reflexe', role: 'status' }, 'Attention…'),
      h('p', { class: 'muet', id: 'compteur-tapes' }, 'Tapez sur votre téléphone dès que l\'écran passe au VERT. Pas avant !'));
  };
  RENDUS['reflexe-attente'].apres = () => {
    clearInterval(etat.coeur); clearInterval(etat.murmures);
    const battre = () => { if (GT.musique.pret()) { GT.musique.bip(55, 0.18, 'sine', 0.9); setTimeout(() => GT.musique.bip(48, 0.16, 'sine', 0.6), 180); } };
    battre();
    etat.coeur = setInterval(battre, 900);
    etat.murmures = setInterval(() => {
      const c = document.getElementById('consigne-reflexe');
      const r = document.getElementById('reflexe');
      if (c && r && !r.classList.contains('go') && !r.classList.contains('piege')) c.textContent = MURMURES[Math.floor(Math.random() * MURMURES.length)];
    }, 1100);
  };

  RENDUS['reflexe-resultat'] = function (d) {
    return h('div', { class: 'reflexe reflexe-fin' },
      h('div', { class: 'qcm-tete', style: { width: '100%' } }, h('span', { class: 'etiquette' }, '🚦 Résultats du tour'), h('span', { class: 'muet' }, 'Tour ' + d.tour + ' / ' + d.total)),
      d.classement.length
        ? h('div', { class: 'palmares', style: { width: 'min(760px, 100%)' } }, d.classement.map((c, i) => h('div', { class: 'ligne-classement', style: { animationDelay: (i * 90) + 'ms' } },
          h('span', { class: 'place' }, i === 0 ? '⚡' : GT.rang(i + 1)), h('span', { class: 'avatar' }, c.avatar),
          h('div', {}, h('div', { class: 'nom' }, c.nom)),
          h('span', { class: 'total' }, (c.ms / 1000).toFixed(3).replace('.', ',') + ' s', h('span', { class: 'gain' }, '+' + c.points)))))
        : h('p', { class: 'consigne-reflexe' }, 'Personne n\'a tapé à temps ! 😴'),
      d.faux.length ? h('div', { class: 'gagnants' }, d.faux.map((f) => h('span', { class: 'gagnant faux-depart' }, (f.raison === 'piege' ? '🟥 ' : '🚫 ') + f.avatar + ' ' + f.nom + (f.raison === 'piege' ? ' : piégé !' : ' : faux départ !')))) : null,
      h('p', { class: 'muet' }, d.dernier ? 'C\'était le dernier tour !' : 'Tour suivant dans un instant… Restez concentrés !'));
  };

  /* ─── Mémoire d'éléphant : la grille à mémoriser ─── */
  RENDUS['memoire-montre'] = function (d) {
    return h('div', { class: 'memoire' },
      h('div', { class: 'qcm-tete', style: { width: '100%' } }, h('span', { class: 'etiquette' }, '🐘 Mémoire d\'éléphant'), h('span', { class: 'muet' }, 'Grille ' + d.numero + ' / ' + d.total)),
      h('h1', {}, 'Mémorisez !'),
      GT.illustration(d.illustration),
      h('div', { style: { width: 'min(520px, 100%)' } }, GT.chrono(d.finA, d.dureeMs, { grand: true })),
      h('p', { class: 'muet' }, 'La grille va disparaître… puis viendra la question piège.'));
  };

  /* ─── Le podium final ─── */
  RENDUS.podium = function (d) {
    const [premier, deuxieme, troisieme] = d.classement;
    const marche = (c, place) => c ? h('div', { class: 'marche' }, h('span', { class: 'avatar' }, c.avatar), h('span', { class: 'nom' }, c.nom), h('span', { class: 'muet' }, GT.points(c.score)), h('div', { class: 'socle' }, place)) : h('div', { class: 'marche' });
    return h('div', { class: 'colonne', style: { maxWidth: '900px', width: '100%', margin: '0 auto' } },
      h('h1', { style: { textAlign: 'center', fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', color: 'var(--tournesol)' } }, 'Le podium de la soirée'),
      h('div', { class: 'marches' }, marche(deuxieme, '2'), marche(premier, '1'), marche(troisieme, '3')),
      (d.prix || []).length ? h('div', { class: 'prix' }, d.prix.map((p) => h('div', { class: 'carte-prix' },
        h('span', { class: 'icone-prix', 'aria-hidden': 'true' }, p.icone),
        h('strong', {}, p.titre), h('span', { class: 'gagnant-prix' }, p.avatar + ' ' + p.nom), h('span', { class: 'muet' }, p.texte)))) : null,
      h('div', { class: 'palmares' }, lignesClassement(d.classement.slice(3).map((c) => c), false).map((ligne, i) => { ligne.querySelector('.place').textContent = GT.rang(i + 4); return ligne; })),
      h('div', { class: 'lancement', style: { justifyContent: 'center' } },
        h('button', { class: 'bouton', onclick: () => cnx.emit('tablette:nouvelle') }, 'Nouvelle partie'))
    );
  };

  /* ═══════════ Les petites mises à jour (événements) ═══════════ */

  const EVENEMENTS = {
    // Feu vert ! : le signal, le piège, le retour au calme, les tapes et les faux départs.
    'reflexe-go': () => {
      clearInterval(etat.coeur); clearInterval(etat.murmures);
      const r = document.getElementById('reflexe'); if (r) { r.classList.remove('piege'); r.classList.add('go'); }
      const c = document.getElementById('consigne-reflexe'); if (c) c.textContent = 'TAPEZ !';
      if (GT.musique.pret()) GT.musique.bip(1320, 0.35, 'square', 0.5);
    },
    'reflexe-piege': () => {
      const r = document.getElementById('reflexe'); if (r) r.classList.add('piege');
      const c = document.getElementById('consigne-reflexe'); if (c) c.textContent = 'PIÈGE ! NE TOUCHEZ PAS !';
      if (GT.musique.pret()) GT.musique.bip(110, 0.6, 'sawtooth', 0.45);
    },
    'reflexe-calme': () => {
      const r = document.getElementById('reflexe'); if (r) r.classList.remove('piege');
      const c = document.getElementById('consigne-reflexe'); if (c) c.textContent = 'Ouf… on se reconcentre.';
    },
    'reflexe-tape': (d) => { const c = document.getElementById('compteur-tapes'); if (c) c.textContent = '⚡ ' + d.nb + ' ont tapé !'; },
    'reflexe-faux': (d) => GT.bulle((d.raison === 'piege' ? '🟥 ' : '🚫 ') + d.avatar + ' ' + d.nom + (d.raison === 'piege' ? ' s\'est fait piéger !' : ' : faux départ !'), 'alerte'),
    // L'animateur a mis en pause : plus de compte à rebours, on attend qu'il touche le bouton.
    pause: () => {
      etat.enPause = true;
      const bloc = document.getElementById('suite-auto');
      if (bloc) bloc.replaceChildren(h('span', { class: 'muet' }, '⏸ En pause : touchez le bouton ci-dessus quand vous êtes prêts.'));
      GT.arreterChronos();
      majBandeau();
    },
    'a-ecrit': (d) => {
      const zone = document.getElementById('ont-ecrit'); if (zone) zone.append(h('span', { class: 'gagnant' }, d.avatar + ' ' + d.nom + ' ✍️'));
      const c = document.getElementById('compteur-ecrits'); if (c) c.textContent = d.nb + ' / ' + d.nbJoueurs + ' ont écrit';
    },
    'vote-rire': (d) => { const c = document.getElementById('compteur-votes-rire'); if (c) c.textContent = d.nbVotes + ' / ' + d.nbVotants + ' ont voté · l\'une de ces réponses a été écrite par le jeu 🤖'; },
    'vote-gage': (d) => { const c = document.getElementById('compteur-votes'); if (c) c.textContent = d.nbVotes + ' / ' + d.nbVotants + ' ont voté'; },
    // Un joueur vient de doubler sa cible : toute la table le voit.
    'cible-depassee': (d) => GT.bulle('🎯 ' + d.avatar + ' ' + d.nom + ' double ' + d.cibleAvatar + ' ' + d.cibleNom + ' !', 'succes'),
    'a-repondu': (d) => {
      marquerReponse(d.joueurId);
      const c = document.getElementById('compteur-reponses');
      if (c) c.textContent = d.nbRepondu + ' / ' + d.nbJoueurs + ' ont répondu';
    },
    trait: (d) => {
      const canvas = document.getElementById('toile-tablette');
      let trait = etat.traits.find((t) => t.id === d.id);
      if (!trait) { trait = { id: d.id, couleur: d.couleur, taille: d.taille, points: [] }; etat.traits.push(trait); }
      const depuis = trait.points.length;
      trait.points.push(...d.points);
      if (canvas) GT.toile.tracer(canvas, trait, depuis);
    },
    redessiner: (d) => {
      etat.traits = d.traits || [];
      const canvas = document.getElementById('toile-tablette');
      if (canvas) GT.toile.toutRedessiner(canvas, etat.traits);
    },
    indice: (d) => { const el = document.getElementById('indice'); if (el) el.textContent = d.indice; },
    proposition: (d) => {
      const fil = document.getElementById('fil');
      if (fil) fil.prepend(h('div', { class: 'fil-ligne' }, d.avatar + ' ' + d.nom + ' : « ' + d.texte + ' »'));
    },
    trouve: (d) => {
      const fil = document.getElementById('fil');
      if (fil) fil.prepend(h('div', { class: 'fil-ligne trouve' }, d.avatar + ' ' + d.nom + ' a trouvé ! +' + d.points));
    },
    progression: (d) => {
      const ligne = document.querySelector('[data-coureur="' + d.joueurId + '"]');
      if (!ligne || !etat.ecran) return;
      const total = etat.ecran.donnees.nbErreurs;
      ligne.querySelector('.jauge i').style.width = (d.nb / total * 100) + '%';
      ligne.querySelector('b').textContent = d.nb + '/' + total;
    }
  };

  /* ═══════════ Les réactions qui s'envolent ═══════════ */

  function envol(r) {
    const bulle = h('div', { class: 'envol', style: { left: (8 + Math.random() * 60) + 'vw', bottom: (6 + Math.random() * 20) + 'vh' } },
      h('span', { class: 'gros' }, r.emoji),
      r.texte ? h('span', { class: 'mot-envole' }, '« ' + r.texte + ' »') : null,
      h('span', {}, r.de.avatar + ' ' + r.de.nom + (r.vers ? ' → ' + r.vers.avatar + ' ' + r.vers.nom : ' → tout le monde')));
    if (r.texte) bulle.classList.add('envol-lent'); // un message écrit s'envole plus lentement, pour qu'on ait le temps de le lire
    document.body.appendChild(bulle);
    setTimeout(() => bulle.remove(), r.texte ? 6500 : 3700);
  }

  /* L'adresse à afficher dans l'invitation (demandée une fois au serveur). */
  if (!cnx.simulation) {
    fetch('/api/adresse').then((r) => r.json()).then((d) => {
      etat.adresse = d.adresse;
      etat.nomFacile = d.nomFacile || null;   // ex. « tablee.local »
      etat.courte = d.courte || null;         // ex. « 192.168.1.23 »
      if (etat.ecran && etat.ecran.type === 'salon') afficher('salon', {});
    }).catch(() => {});
  }

  // Si l'écran change de taille (rotation de la tablette), on redessine la toile.
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('toile-tablette');
    if (canvas) { GT.toile.ajuster(canvas); GT.toile.toutRedessiner(canvas, etat.traits); }
  });
})();
