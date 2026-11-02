/*
 * ════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN DE LA TABLETTE (le plateau au centre de la table)
 * ════════════════════════════════════════════════════════════════════
 *
 *  La tablette est à la fois le plateau de jeu et le pupitre de
 *  l'animateur. Elle affiche ce que tout le monde regarde ensemble
 *  (la question, les étapes à remettre en ordre, le classement, le
 *  corrigé…) et porte les quelques boutons qui pilotent la partie.
 *
 *  Le principe est toujours le même : le moteur envoie un message
 *  « ecran » avec un type (par exemple « qcm-question ») et des données.
 *  Ce fichier possède, pour chaque type, une petite fonction de rendu
 *  (rangées dans l'objet RENDUS plus bas) qui construit l'écran
 *  correspondant. Entre deux écrans, de petits messages « evenement »
 *  mettent à jour un détail sans tout reconstruire : qui a répondu, un
 *  dépassement en direct…
 */
(function () {
  'use strict';
  const { h } = GT;
  const cnx = GT.connexion;

  /* Tout ce que la tablette sait de la partie en cours. */
  const etat = {
    code: null,            // le code de la salle, ex. « BRIK »
    fiches: [],            // la présentation des mini-jeux
    categories: [],        // les quatre familles (SEX’PLIQUE, VIH’GILANCE…)
    aleatoire: [],         // le programme de la partie aléatoire
    selection: null,       // les jeux cochés par l'animateur
    salle: null,           // la liste des joueurs et l'étape en cours
    ecran: null,           // l'écran affiché { type, donnees }
    adresse: null,         // l'adresse que les joueurs doivent ouvrir
    aRepondu: new Set(),   // qui a déjà répondu à la question en cours
    aConfirmer: null,      // le joueur dont on attend la confirmation de retrait
    podium: null           // les données du podium, pour revenir du corrigé
  };

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
    etat.categories = d.categories || [];
    etat.aleatoire = d.aleatoire || [];
    if (!etat.selection) etat.selection = new Set(d.jeux.filter((f) => f.parDefaut).map((f) => f.id));
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

    // Les boutons de l'animateur changent selon l'étape.
    const boutons = [];
    if (s.etat === 'intro') boutons.push(h('button', { class: 'bouton bouton-petit', onclick: () => cnx.emit('tablette:passer') }, 'C\'est parti !'));
    if (s.etat === 'jeu') {
      boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('tablette:passer'), title: 'Passer à la suite' }, 'Passer ⏭'));
      boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('tablette:terminer-jeu') }, 'Terminer ce jeu'));
    }
    if (s.etat === 'classement') boutons.push(h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => cnx.emit('tablette:podium') }, 'Finir la partie'));
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
    if (type === 'qcm-question' || type === 'ordre-question' || !memeEcran) { etat.aRepondu.clear(); }
    etat.ecran = { type, donnees };
    scene.replaceChildren(rendu(donnees));
    scene.scrollTop = 0;
    majBandeau();
    if (rendu.apres) rendu.apres(donnees);
  }

  /* Le Wi-Fi du jeu, mémorisé sur cet ordinateur (ou donné dans l'adresse : ?wifi=nom&mdp=motdepasse). */
  const CLE_WIFI = 'labo:wifi';
  function lireWifi() {
    let w = { actif: false, nom: 'zaza cession partage', mdp: '' };
    try { Object.assign(w, JSON.parse(localStorage.getItem(CLE_WIFI) || '{}')); } catch (e) {}
    const p = new URLSearchParams(location.search);
    if (p.get('wifi')) { w.nom = p.get('wifi'); w.mdp = p.get('mdp') || ''; w.actif = true; }
    return w;
  }
  function ecrireWifi(w) { try { localStorage.setItem(CLE_WIFI, JSON.stringify(w)); } catch (e) {} }

  /* ═══════════ Les écrans, un par un ═══════════ */

  const RENDUS = {};

  /* ─── Le salon : on invite les joueurs et on choisit les jeux ─── */
  RENDUS.salon = function () {
    const s = etat.salle || { joueurs: [], minJoueurs: 4, maxJoueurs: 12 };
    const presents = s.joueurs.filter((j) => j.connecte).length;
    const manque = Math.max(0, s.minJoueurs - presents);

    // L'invitation : QR code, code de salle et adresse.
    const lien = (etat.adresse || location.origin) + '/joueur.html?code=' + (etat.code || '');
    const qr = h('div', { class: 'qr', 'aria-label': 'QR code pour rejoindre la partie' });
    if (cnx.simulation) qr.replaceChildren(h('p', { style: { padding: '16px', color: '#1B2250' } }, 'Simulateur : les téléphones sont dans le panneau de droite.'));
    else if (window.qrcode) {
      const code = window.qrcode(0, 'M');
      code.addData(lien);
      code.make();
      qr.innerHTML = code.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    } else qr.replaceChildren(h('p', { style: { padding: '16px', color: '#1B2250' } }, 'Ouvrez l\'adresse ci-dessous sur votre téléphone.'));

    // Le Wi-Fi du jeu (facultatif) : un premier QR code pour se connecter au réseau, avant celui du jeu.
    const wifi = lireWifi();
    const dessinerQR = (texte, niveau) => {
      const boite = h('div', { class: 'qr' });
      if (!window.qrcode) return boite;
      const c = window.qrcode(0, niveau || 'M');
      c.addData(unescape(encodeURIComponent(texte))); c.make();
      boite.innerHTML = c.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
      return boite;
    };
    const esc = (t) => t.replace(/([\\;,:"])/g, '\\$1');
    const avecWifi = !cnx.simulation && wifi.actif && wifi.nom;
    const etapeWifi = avecWifi ? h('div', { class: 'etape-qr' },
      h('span', { class: 'etape-num' }, '1'),
      h('strong', {}, 'Le Wi-Fi'),
      dessinerQR('WIFI:T:WPA;S:' + esc(wifi.nom) + ';P:' + esc(wifi.mdp) + ';;', 'Q'),
      h('p', { class: 'wifi-infos' }, h('span', {}, 'Réseau : ', h('b', {}, wifi.nom)), h('span', {}, 'Mot de passe : ', h('b', {}, wifi.mdp || '—')))
    ) : null;
    const champ = (id, libelle, valeur) => h('label', { for: id }, libelle,
      h('input', { id, value: valeur, autocomplete: 'off', onchange: (e) => { const w = lireWifi(); w[id === 'wifi-nom' ? 'nom' : 'mdp'] = e.target.value.trim(); ecrireWifi(w); afficher('salon', {}); } }));
    const reglagesWifi = cnx.simulation ? null : h('details', { class: 'reglages-wifi', open: etat.wifiOuvert || null, ontoggle: (e) => { etat.wifiOuvert = e.target.open; } },
      h('summary', {}, avecWifi ? 'Wi-Fi affiché · modifier' : 'Afficher aussi le QR code du Wi-Fi'),
      h('label', { class: 'case' }, h('input', { type: 'checkbox', checked: wifi.actif || null, onchange: (e) => { const w = lireWifi(); w.actif = e.target.checked; ecrireWifi(w); afficher('salon', {}); } }), ' Afficher le Wi-Fi'),
      champ('wifi-nom', 'Nom du réseau', wifi.nom),
      champ('wifi-mdp', 'Mot de passe', wifi.mdp),
      wifi.actif && wifi.mdp && wifi.mdp.length < 8 ? h('p', { class: 'wifi-alerte' }, 'Attention : un partage de connexion demande au moins 8 caractères.') : null,
      h('p', { class: 'muet' }, 'Mettez exactement le même nom et le même mot de passe que sur votre téléphone ou votre box. Votre ordinateur doit être connecté à ce réseau.')
    );
    const qrs = avecWifi
      ? h('div', { class: 'deux-qr' }, etapeWifi, h('div', { class: 'etape-qr' }, h('span', { class: 'etape-num' }, '2'), h('strong', {}, 'Le jeu'), qr))
      : qr;

    const invitation = h('section', { class: 'invitation' },
      h('div', { class: 'nom-jeu nom-jeu-centre' },
        h('span', { class: 'sur-nom' }, 'SEX’ACT · SEX’PLIQUE · IST’ORY & VIH’GILANCE'),
        h('span', { class: 'titre-jeu' }, 'Le labo des savoirs'),
        h('span', { class: 'accroche' }, 'VIH & IST · Le jeu où la connaissance fait la différence !')),
      h('h2', {}, 'Rejoignez la partie !'),
      h('p', {}, avecWifi
        ? 'Scannez d\'abord le code ① pour rejoindre le Wi-Fi, puis le code ② pour entrer dans le jeu.'
        : 'Scannez le code avec l\'appareil photo de votre téléphone, ou ouvrez l\'adresse et tapez le code.'),
      qrs,
      h('div', { class: 'code-geant', 'aria-label': 'Code de la partie' }, etat.code || '····'),
      cnx.simulation ? null : h('p', { class: 'adresse' }, (etat.adresse || location.origin) + '/joueur.html'),
      reglagesWifi
    );

    // Les joueurs présents, avec la possibilité d'en retirer un (en deux touches, pour éviter les accidents).
    const cartes = s.joueurs.map((j) => h('div', { class: 'carte-joueur' + (j.connecte ? '' : ' absent') },
      h('span', { class: 'avatar' }, j.avatar),
      h('span', { class: 'nom' }, j.nom),
      etat.aConfirmer === j.id
        ? h('button', { class: 'bouton bouton-petit', style: { background: 'var(--corail)', boxShadow: 'none' }, onclick: () => { etat.aConfirmer = null; cnx.emit('tablette:retirer', { joueurId: j.id }); } }, 'Retirer ?')
        : h('button', { class: 'retirer', 'aria-label': 'Retirer ' + j.nom, onclick: () => { etat.aConfirmer = j.id; afficher('salon', {}); setTimeout(() => { if (etat.aConfirmer === j.id) { etat.aConfirmer = null; afficher('salon', {}); } }, 4000); } }, '✕')
    ));
    for (let i = s.joueurs.length; i < s.minJoueurs; i++) cartes.push(h('div', { class: 'carte-joueur place-libre' }, 'Place libre'));

    // Les jeux, rangés par famille ; une touche par famille pour tout cocher ou tout décocher.
    const carte = (f) => h('button', {
      class: 'carte-jeu cat-' + f.categorie, 'aria-pressed': String(etat.selection.has(f.id)),
      onclick: () => { etat.selection.has(f.id) ? etat.selection.delete(f.id) : etat.selection.add(f.id); afficher('salon', {}); }
    }, h('span', { class: 'icone' }, f.icone), h('strong', {}, f.nom), h('span', {}, f.resume));
    const jeux = GT.familles(etat.categories, etat.fiches, etat.selection, carte, () => afficher('salon', {}));

    const lancer = h('button', {
      class: 'bouton', disabled: manque > 0 || !etat.selection.size,
      onclick: () => {
        GT.garderEcranAllume();
        cnx.emit('tablette:lancer', { programme: etat.fiches.map((f) => f.id).filter((id) => etat.selection.has(id)) });
      }
    }, 'Lancer la partie');
    // La partie aléatoire : toutes les familles mélangées, question après question, en trois manches.
    const aleatoire = h('button', {
      class: 'bouton bouton-alea', disabled: manque > 0,
      onclick: () => { GT.garderEcranAllume(); cnx.emit('tablette:lancer', { programme: etat.aleatoire }); }
    }, '🎲 Partie aléatoire');

    return h('div', { class: 'salon' },
      invitation,
      h('div', { class: 'colonne' },
        h('section', {},
          h('div', { class: 'bloc-titre' }, h('h3', {}, 'Les joueurs'), h('span', { class: 'muet' }, s.joueurs.length + ' / ' + s.maxJoueurs + ' joueurs')),
          h('div', { class: 'grille-joueurs' }, cartes)),
        h('section', {},
          h('div', { class: 'bloc-titre' }, h('h3', {}, 'Au programme'), h('span', { class: 'muet' }, etat.selection.size + ' jeu' + (etat.selection.size > 1 ? 'x' : '') + ' choisi' + (etat.selection.size > 1 ? 's' : ''))),
          jeux),
        h('div', { class: 'lancement' }, lancer, etat.aleatoire.length ? aleatoire : null,
          h('span', { class: 'muet' }, manque > 0 ? 'Encore ' + manque + ' joueur' + (manque > 1 ? 's' : '') + ' pour commencer.' : !etat.selection.size ? 'Choisissez au moins un jeu.' : 'Partie choisie : le dernier jeu compte double. Partie aléatoire : 3 manches de 6 questions, toutes familles mélangées.'))
      )
    );
  };

  /* ─── La présentation d'un jeu ─── */
  RENDUS.intro = function (d) {
    return h('div', { class: 'intro' + (d.finale ? ' intro-finale' : '') },
      d.finale ? h('div', { class: 'bandeau-finale' }, '⚡ La Grande Finale ⚡ Tous les points comptent double') : h('span', { class: 'etiquette' }, (d.fiche.id === 'tourbillon' ? 'Manche ' : 'Jeu ') + d.numero + ' sur ' + d.total),
      d.fiche.categorieNom ? h('span', { class: 'famille-pastille cat-' + d.fiche.categorie }, d.fiche.categorieNom) : null,
      h('div', { class: 'icone-geante', 'aria-hidden': 'true' }, d.fiche.icone),
      h('h1', {}, d.fiche.nom),
      h('p', { class: 'regle' }, d.fiche.regle),
      h('p', { class: 'annonce-defi' }, '🎯 Chacun a reçu son défi sur son téléphone · prime +' + d.prime),
      h('div', { style: { width: 'min(520px, 100%)' } }, GT.chrono(d.finA, d.dureeMs, { grand: true }))
    );
  };

  /* ─── Les questions (tous les jeux à choix multiple) ─── */
  function tuilesReponses(choix, options) {
    options = options || {};
    return h('div', { class: 'reponses' + (options.bonne !== undefined ? ' revelee' : '') }, choix.map((texte, i) =>
      h('div', { class: 'reponse ' + GT.classesChoix[i] + (options.bonne === i ? ' juste' : '') },
        h('span', { class: 'forme', 'aria-hidden': 'true' }, GT.formes[i]),
        h('span', { class: 'texte' }, texte),
        options.repartition ? h('span', { class: 'compte', title: 'Nombre de réponses' }, options.repartition[i]) : null)));
  }

  RENDUS['qcm-question'] = function (d) {
    const compteur = h('span', { id: 'compteur-reponses', class: 'muet' }, d.nbRepondu + ' / ' + d.nbJoueurs + ' ont répondu');
    return h('div', { class: 'qcm' },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, d.surtitre || 'Question'), h('span', { class: 'muet' }, 'Question ' + d.numero + ' / ' + d.total)),
      h('h2', { class: 'qcm-question' }, d.intitule),
      tuilesReponses(d.choix),
      h('div', { class: 'qcm-pied' }, GT.chrono(d.finA, d.dureeMs, { grand: true }), compteur)
    );
  };

  RENDUS['qcm-revelation'] = function (d) {
    const ex = d.explication || {};
    return h('div', { class: 'qcm' },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, d.surtitre || 'Réponse'), h('span', { class: 'muet' }, 'Question ' + d.numero + ' / ' + d.total)),
      h('h2', { class: 'qcm-question' }, d.intitule),
      tuilesReponses(d.choix, { bonne: d.bonne, repartition: d.repartition }),
      (ex.titre || ex.texte) ? h('div', { class: 'explication' }, ex.titre ? h('strong', {}, ex.titre) : null, ex.texte ? h('p', {}, ex.texte) : null) : null,
      h('div', { class: 'gagnants' }, d.gagnants.length
        ? d.gagnants.map((g) => h('span', { class: 'gagnant' }, g.avatar + ' ' + g.nom, h('b', {}, '+' + g.points)))
        : h('span', { class: 'muet' }, 'Personne n\'a trouvé… La question était coriace !'))
    );
  };

  /* ─── Dans l'ordre ! ─── */
  RENDUS['ordre-question'] = function (d) {
    const compteur = h('span', { id: 'compteur-reponses', class: 'muet' }, d.nbRepondu + ' / ' + d.nbJoueurs + ' ont répondu');
    return h('div', { class: 'qcm' },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, d.titre || 'Dans l\'ordre !'), h('span', { class: 'muet' }, 'Séquence ' + d.numero + ' / ' + d.total)),
      h('h2', { class: 'qcm-question' }, d.consigne),
      h('div', { class: 'etapes' }, d.etapes.map((e) => h('div', { class: 'etape' }, h('span', { class: 'lettre' }, e.lettre), h('span', {}, e.texte)))),
      h('div', { class: 'qcm-pied' }, GT.chrono(d.finA, d.dureeMs, { grand: true }), compteur)
    );
  };

  RENDUS['ordre-revelation'] = function (d) {
    return h('div', { class: 'qcm' },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, 'Le bon ordre'), h('span', { class: 'muet' }, d.parfaits + ' sans faute · séquence ' + d.numero + ' / ' + d.total)),
      h('h2', { class: 'qcm-question' }, d.consigne),
      h('ol', { class: 'etapes etapes-solution' }, d.solution.map((t, i) => h('li', { class: 'etape', style: { animationDelay: (i * 120) + 'ms' } }, h('span', { class: 'lettre' }, String(i + 1)), h('span', {}, t)))),
      h('div', { class: 'explication' }, h('strong', {}, 'La correction'), h('p', {}, d.correction)),
      h('div', { class: 'gagnants' }, d.gagnants.length
        ? d.gagnants.map((g) => h('span', { class: 'gagnant' }, (g.parfait ? '⭐ ' : '') + g.avatar + ' ' + g.nom, h('b', {}, '+' + g.points)))
        : h('span', { class: 'muet' }, 'Personne n\'a marqué de points sur cette séquence.'))
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

  RENDUS.classement = function (d) {
    const defis = d.defis || [];
    return h('div', { class: 'colonne', style: { maxWidth: '900px', width: '100%', margin: '0 auto' } },
      h('div', { class: 'qcm-tete' }, h('h1', { style: { fontSize: '2.4rem' } }, 'Le classement'), h('span', { class: 'etiquette' }, 'Après le jeu ' + d.numero + ' / ' + d.total)),
      h('div', { class: 'defis-reussis' }, h('strong', {}, '🎯 Défis réussis'), defis.length
        ? defis.map((x) => h('span', { class: 'gagnant' }, x.avatar + ' ' + x.nom, h('b', {}, '+' + x.prime)))
        : h('span', { class: 'muet' }, 'Aucun défi réussi cette fois-ci.')),
      h('div', { class: 'palmares' }, lignesClassement(d.classement.slice(0, 10), true)),
      d.classement.length > 10 ? h('p', { class: 'muet', style: { textAlign: 'center' } }, '… et ' + (d.classement.length - 10) + ' autres joueurs : chacun voit son rang sur son téléphone.') : null,
      d.prochainFinale ? h('div', { class: 'bandeau-finale' }, '⚡ Prochain jeu : la Grande Finale, tout compte double. Tout peut encore basculer !') : null,
      h('div', { class: 'lancement' },
        h('button', { class: 'bouton', onclick: () => cnx.emit('tablette:passer') }, d.dernier ? 'Voir le podium 🏆' : (d.prochainFinale ? 'La Grande Finale : ' : 'Jeu suivant : ') + d.prochain.icone + ' ' + d.prochain.nom))
    );
  };

  /* ─── Le podium final ─── */
  RENDUS.podium = function (d) {
    etat.podium = d;
    const [premier, deuxieme, troisieme] = d.classement;
    const marche = (c, place) => c ? h('div', { class: 'marche' }, h('span', { class: 'avatar' }, c.avatar), h('span', { class: 'nom' }, c.nom), h('span', { class: 'muet' }, GT.points(c.score)), h('div', { class: 'socle' }, place)) : h('div', { class: 'marche' });
    return h('div', { class: 'colonne', style: { maxWidth: '900px', width: '100%', margin: '0 auto' } },
      h('span', { class: 'etiquette', style: { justifySelf: 'center' } }, premier && deuxieme && premier.score === deuxieme.score ? 'Égalité en tête !' : 'Victoire !'),
      h('h1', { style: { textAlign: 'center', fontSize: 'clamp(2.2rem, 4.6vw, 3.4rem)', color: 'var(--accent-fort)' } }, premier ? (premier.avatar + ' ' + premier.nom + (deuxieme && premier.score === deuxieme.score ? ' et ' + deuxieme.avatar + ' ' + deuxieme.nom + ', ex aequo !' : ' remporte la partie !')) : 'Le podium'),
      h('div', { class: 'marches' }, marche(deuxieme, '2'), marche(premier, '1'), marche(troisieme, '3')),
      h('div', { class: 'palmares' }, lignesClassement(d.classement.slice(3, 12), false).map((ligne, i) => { ligne.querySelector('.place').textContent = GT.rang(i + 4); return ligne; })),
      h('div', { class: 'lancement', style: { justifyContent: 'center' } },
        (d.corrige && d.corrige.length) ? h('button', { class: 'bouton', onclick: () => afficher('corrige', d) }, '📝 Le corrigé de la partie') : null,
        h('button', { class: 'bouton bouton-discret', onclick: () => cnx.emit('tablette:nouvelle') }, 'Nouvelle partie'))
    );
  };

  RENDUS.podium.apres = () => GT.confettis();

  /*
   * ─── Le corrigé : toutes les questions posées pendant la partie ───
   * Rangées des plus ratées aux mieux réussies : c'est par là que la
   * reprise en classe commence. Écran local à la tablette (le moteur
   * n'en sait rien) : on revient au podium d'une touche.
   */
  RENDUS.corrige = function (d) {
    const lignes = (d.corrige || []).map((q) => {
      const taux = q.total ? Math.round(q.reussis / q.total * 100) : 0;
      return h('details', { class: 'ligne-corrige' + (taux < 50 ? ' a-revoir' : '') },
        h('summary', {},
          h('span', { class: 'taux', title: 'Taux de réussite' }, taux + ' %'),
          h('span', { class: 'q' }, h('small', {}, q.icone + ' ' + q.jeu), q.question)),
        h('div', { class: 'reponse-corrige' }, h('strong', {}, '✓ ' + q.bonne), q.correction ? h('p', {}, q.correction) : null));
    });
    const aRevoir = (d.corrige || []).filter((q) => q.total && q.reussis / q.total < 0.5).length;
    return h('div', { class: 'colonne', style: { maxWidth: '1000px', width: '100%', margin: '0 auto' } },
      h('div', { class: 'qcm-tete' },
        h('h1', { style: { fontSize: '2.2rem' } }, 'Le corrigé'),
        h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => afficher('podium', etat.podium) }, '← Retour au podium')),
      h('p', { class: 'muet' }, (d.corrige || []).length + ' questions posées, des plus ratées aux mieux réussies · ' + aRevoir + ' à revoir en priorité (réussies par moins de la moitié du groupe, en rouge). Touchez une question pour voir la correction.'),
      h('div', { class: 'corrige' }, lignes));
  };

  /* ═══════════ Les petites mises à jour (événements) ═══════════ */

  const EVENEMENTS = {
    'a-repondu': (d) => {
      marquerReponse(d.joueurId);
      const c = document.getElementById('compteur-reponses');
      if (c) c.textContent = d.nbRepondu + ' / ' + d.nbJoueurs + ' ont répondu';
    },
    // La Cible : un dépassement en direct, annoncé à toute la table.
    depassement: (d) => GT.bulle('🎯 ' + d.de.avatar + ' ' + d.de.nom + ' passe devant ' + d.vers.avatar + ' ' + d.vers.nom + ' !', 'succes')
  };

  /* ═══════════ Les réactions qui s'envolent ═══════════ */

  function envol(r) {
    const bulle = h('div', { class: 'envol', style: { left: (8 + Math.random() * 60) + 'vw', bottom: (6 + Math.random() * 20) + 'vh' } },
      h('span', { class: 'gros' }, r.emoji),
      h('span', {}, r.de.avatar + ' ' + r.de.nom + (r.vers ? ' → ' + r.vers.avatar + ' ' + r.vers.nom : ' → tout le monde')));
    document.body.appendChild(bulle);
    setTimeout(() => bulle.remove(), 3700);
  }

  /* L'adresse à afficher dans l'invitation (demandée une fois au serveur). */
  if (!cnx.simulation) {
    fetch('/api/adresse').then((r) => r.json()).then((d) => {
      etat.adresse = d.adresse;
      if (etat.ecran && etat.ecran.type === 'salon') afficher('salon', {});
    }).catch(() => {});
  }

})();
