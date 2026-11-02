/*
 * ════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN DU TÉLÉPHONE (une manette dans la poche de chaque joueur)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Le téléphone est volontairement simple : de grosses touches, peu de
 *  texte, et le regard tourné vers la tablette. Il sert à :
 *    • rejoindre la table (code + prénom + avatar) ;
 *    • répondre aux questions (quatre touches de couleur) ;
 *    • remettre des étapes dans l'ordre ;
 *    • voir son défi (la Cible), ses corrections et son carnet d'erreurs ;
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
    ecran: null
  };
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
    GT.bulle(r.de.avatar + ' ' + r.de.nom + (r.vers ? ' → toi' : ' → tout le monde') + ' : ' + r.emoji);
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
      h('button', { class: 'bouton-reagir', 'aria-label': 'Envoyer une réaction', onclick: () => ouvrirReactions(null) }, '💬'),
      scoresEnDirect()
    );
  }

  /* Le classement en direct : les points de chacun, mis à jour à chaque bonne réponse. */
  const scoresVus = new Map();
  function scoresEnDirect() {
    const joueurs = (etat.salle ? etat.salle.joueurs : []).filter((j) => j.connecte || j.score > 0);
    if (joueurs.length < 2) return null;
    const tous = joueurs.slice().sort((a, b) => b.score - a.score);
    // Grande partie : le top 5, puis soi-même et ses deux voisins directs.
    let tries = tous;
    if (tous.length > 8) {
      const ici = tous.findIndex((j) => j.id === etat.joueurId);
      const garder = new Set([0, 1, 2, 3, 4, ici - 1, ici, ici + 1]);
      tries = tous.filter((j, i) => garder.has(i));
    }
    const bande = h('ol', { class: 'score-direct', 'aria-label': 'Classement en direct' }, tries.map((j) => {
      const avant = scoresVus.get(j.id);
      const gain = avant !== undefined && j.score > avant ? j.score - avant : 0;
      scoresVus.set(j.id, j.score);
      const rang = tous.filter((x) => x.score > j.score).length + 1;
      return h('li', { class: 'score-chip' + (j.id === etat.joueurId ? ' moi' : '') + (gain ? ' monte' : '') + (j.connecte ? '' : ' absent') },
        h('span', { class: 'score-rang' }, rang === 1 ? '👑' : String(rang)),
        h('span', { 'aria-hidden': 'true' }, j.avatar),
        h('span', { class: 'score-nom' }, j.id === etat.joueurId ? 'Toi' : j.nom),
        h('strong', {}, GT.points(j.score).replace(/\s*pts?$/, '')),
        gain ? h('span', { class: 'score-gain' }, '+' + gain) : null);
    }));
    // On garde sa propre pastille visible quand la bande défile.
    requestAnimationFrame(() => { const m = bande.querySelector('.moi'); if (m && m.scrollIntoView) m.scrollIntoView({ inline: 'nearest', block: 'nearest' }); });
    return bande;
  }

  /*
   * La feuille de réactions : on choisit à qui l'envoyer (tout le monde
   * ou un joueur précis), puis l'émoji. C'est le canal direct entre les
   * joueurs : on félicite Mamie, on taquine le cousin.
   */
  function ouvrirReactions(destinataire) {
    let vers = destinataire;
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
        h('button', { class: 'bouton bouton-discret', onclick: fermer }, 'Fermer'));
    }
    dessiner();
    document.body.append(voile, feuille);
  }

  /* ═══════════ Le changement d'écran ═══════════ */

  function afficher(type, donnees) {
    const rendu = ECRANS[type];
    if (!rendu) return;
    GT.arreterChronos();
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
      h('div', { class: 'nom-jeu' },
        h('span', { class: 'sur-nom' }, 'SEX’ACT · SEX’PLIQUE · IST’ORY & VIH’GILANCE'),
        h('h1', {}, 'Le labo des savoirs'),
        h('span', { class: 'accroche' }, 'VIH & IST · Le jeu où la connaissance fait la différence !')),
      h('p', { class: 'muet' }, 'Rejoins la partie : le code est affiché sur l\'écran de la classe.'),
      message ? h('p', { class: 'bulle alerte', role: 'alert', style: { animation: 'none' } }, message) : null,
      h('div', { class: 'champ' }, h('label', { for: 'code' }, 'Code de la partie'),
        h('input', { id: 'code', name: 'code', maxlength: '4', autocomplete: 'off', autocapitalize: 'characters', inputmode: 'text', value: etat.code, placeholder: 'ABCD', required: true })),
      h('div', { class: 'champ' }, h('label', { for: 'nom' }, 'Ton prénom ou surnom'),
        h('input', { id: 'nom', name: 'nom', maxlength: '16', autocomplete: 'given-name', value: etat.nom, placeholder: 'Prénom ou surnom', required: true })),
      h('div', { class: 'champ' }, h('span', { style: { fontWeight: 700 } }, 'Ton avatar'), grille),
      h('button', { class: 'bouton', type: 'submit' }, 'Rejoindre la partie')
    );
    formulaire.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const code = formulaire.code.value.trim().toUpperCase();
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
    const autres = etat.salle ? etat.salle.joueurs.filter((j) => j.id !== etat.joueurId) : [];
    return h('div', { class: 'centre' },
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, etat.avatar),
      h('h2', {}, 'Tu es dans la partie, ' + etat.nom + ' !'),
      h('p', { class: 'muet' }, 'Garde un œil sur la tablette : la formatrice va lancer la partie.'),
      autres.length ? h('p', {}, 'Touche un joueur pour lui envoyer un petit mot :') : null,
      h('div', { class: 'gagnants', style: { justifyContent: 'center' } }, autres.map((j) =>
        h('button', { class: 'gagnant', onclick: () => ouvrirReactions(j.id), style: { opacity: j.connecte ? 1 : 0.5 } }, j.avatar + ' ' + j.nom)))
    );
  };

  ECRANS.intro = function (d) {
    return h('div', { class: 'centre' },
      d.finale ? h('div', { class: 'bandeau-finale' }, '⚡ Grande Finale · points ×2') : h('span', { class: 'etiquette' }, 'Jeu ' + d.numero + ' sur ' + d.total),
      d.fiche.categorieNom ? h('span', { class: 'famille-pastille cat-' + d.fiche.categorie }, d.fiche.categorieNom) : null,
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, d.fiche.icone),
      h('h2', {}, d.fiche.nom),
      h('p', {}, d.fiche.regle),
      d.defi ? h('div', { class: 'carte-defi' },
        h('span', { class: 'etiquette-defi' }, 'Ton défi · prime +' + d.prime),
        h('strong', {}, d.defi.texte)) : null);
  };

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
    return h('div', { class: 'ecran', style: { padding: 0 } },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, 'Question ' + d.numero + ' / ' + d.total), h('span', { class: 'muet' }, d.consigne)),
      GT.chrono(d.finA, d.dureeMs),
      // L'énoncé est aussi sur le téléphone : on peut jouer à distance, sans voir l'écran de la classe.
      d.intitule ? h('p', { class: 'enonce-tel' }, d.intitule) : null,
      touches);
  };

  ECRANS['qcm-attente'] = function (d) {
    return h('div', { class: 'centre' },
      h('p', { class: 'muet' }, 'Réponse enregistrée'),
      h('div', { class: 'touche ' + GT.classesChoix[d.choix], style: { width: '100%' } }, h('span', { class: 'forme' }, GT.formes[d.choix]), h('span', {}, d.texte)),
      h('p', {}, 'Les yeux sur la tablette…'),
      h('div', { style: { width: '100%' } }, GT.chrono(d.finA, d.dureeMs || 20000)));
  };

  ECRANS['qcm-resultat'] = function (d) {
    return h('div', { class: 'centre' },
      h('div', { class: 'verdict ' + (d.juste ? 'verdict-juste' : d.neutre ? 'verdict-neutre' : 'verdict-faux'), 'aria-hidden': 'true' }, d.juste ? '✓' : d.neutre ? '?' : d.aRepondu ? '✗' : '⏱'),
      h('h2', {}, d.juste ? 'Bravo ! +' + d.points : d.neutre ? 'Honnête !' + (d.points ? ' +' + d.points : '') : d.aRepondu ? 'Raté !' : 'Trop tard !'),
      d.juste ? null : h('p', {}, 'La bonne réponse : ', h('strong', {}, d.bonneTexte)),
      (!d.juste && d.correction) ? h('p', { class: 'correction-tel' }, d.correction) : null,
      h('p', { class: 'muet' }, 'Ton score : ' + GT.points(d.score)));
  };

  /* ─── Dans l'ordre ! ─── */
  ECRANS['ordre-choix'] = function (d) {
    const choisis = [];
    const ligne = h('ol', { class: 'ordre-choisi', 'aria-live': 'polite' });
    const boutons = d.etapes.map((e, i) => h('button', {
      class: 'touche-etape',
      onclick: (ev) => {
        if (choisis.includes(i)) return;
        choisis.push(i);
        ev.currentTarget.disabled = true;
        ev.currentTarget.prepend(h('span', { class: 'rang' }, String(choisis.length)));
        if (navigator.vibrate) navigator.vibrate(20);
        dessiner();
        if (choisis.length === d.etapes.length) cnx.emit('joueur:action', { type: 'ordre', ordre: choisis.slice() });
      }
    }, h('span', { class: 'lettre' }, e.lettre), h('span', {}, e.texte)));
    const recommencer = h('button', { class: 'bouton bouton-petit bouton-discret', onclick: () => afficher('ordre-choix', d) }, '↺ Recommencer');
    function dessiner() {
      ligne.replaceChildren(...choisis.map((i) => h('li', {}, d.etapes[i].lettre)));
      recommencer.hidden = !choisis.length;
    }
    dessiner();
    return h('div', { class: 'ecran', style: { padding: 0 } },
      h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, 'Séquence ' + d.numero + ' / ' + d.total), h('span', { class: 'muet' }, 'De la 1re à la dernière')),
      GT.chrono(d.finA, d.dureeMs),
      h('p', { class: 'consigne-ordre' }, d.consigne),
      h('div', { class: 'touches' }, boutons),
      h('div', { class: 'lancement' }, ligne, recommencer));
  };

  ECRANS['ordre-attente'] = function (d) {
    return h('div', { class: 'centre' },
      h('p', { class: 'muet' }, 'Ton ordre est enregistré'),
      h('ol', { class: 'liste-ordre' }, d.ordre.map((t) => h('li', {}, t))),
      h('p', {}, 'Les yeux sur la tablette…'),
      h('div', { style: { width: '100%' } }, GT.chrono(d.finA, d.dureeMs)));
  };

  ECRANS['ordre-resultat'] = function (d) {
    return h('div', { class: 'centre' },
      h('div', { class: 'verdict ' + (d.parfait ? 'verdict-juste' : 'verdict-faux'), 'aria-hidden': 'true' }, d.parfait ? '✓' : d.aRepondu ? d.bienPlaces + '/' + d.n : '⏱'),
      h('h2', {}, d.parfait ? 'Sans faute ! +' + d.points : d.aRepondu ? d.bienPlaces + ' étape' + (d.bienPlaces > 1 ? 's' : '') + ' bien placée' + (d.bienPlaces > 1 ? 's' : '') + (d.points ? ' · +' + d.points : '') : 'Trop tard !'),
      d.parfait ? null : h('ol', { class: 'liste-ordre' }, d.solution.map((t) => h('li', {}, t))),
      (!d.parfait && d.correction) ? h('p', { class: 'correction-tel' }, d.correction) : null,
      h('p', { class: 'muet' }, 'Ton score : ' + GT.points(d.score)));
  };

  /* ─── Classement et podium ─── */
  ECRANS.classement = function (d) {
    return h('div', { class: 'centre' },
      h('span', { class: 'etiquette' }, 'Classement'),
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, d.rang === 1 ? '👑' : d.rang <= 3 ? '🔥' : '💪'),
      h('h2', {}, GT.rang(d.rang) + ' sur ' + d.nbJoueurs),
      h('p', {}, GT.points(d.score) + (d.gain ? ' (+' + d.gain + ' sur ce jeu)' : '')),
      d.defi ? h('div', { class: 'carte-defi' + (d.defi.reussi ? ' defi-reussi' : ' defi-rate') },
        h('span', { class: 'etiquette-defi' }, d.defi.reussi ? '🎯 Défi réussi · +' + d.defi.prime : 'Défi manqué'),
        h('span', {}, d.defi.texte)) : null,
      d.prochainFinale ? h('div', { class: 'bandeau-finale' }, '⚡ Prochain jeu : la Grande Finale ×2') : null,
      h('button', { class: 'bouton bouton-discret', onclick: () => ouvrirReactions(null) }, '💬 Taquiner les autres'));
  };

  /*
   * Le podium et le carnet de corrections : chaque joueur repart avec la
   * liste des questions qu'il a ratées, la bonne réponse et l'explication.
   */
  ECRANS.podium = function (d) {
    const medaille = ['🥇', '🥈', '🥉'][d.rang - 1] || '🎉';
    const erreurs = d.erreurs || [];
    return h('div', { class: 'ecran', style: { padding: 0 } },
      h('div', { class: 'centre', style: { margin: '8px 0' } },
        h('div', { class: 'gros-emoji', 'aria-hidden': 'true', style: { fontSize: '4.5rem' } }, medaille),
        h('h2', {}, d.rang === 1 ? 'Première place !' : GT.rang(d.rang) + ' sur ' + d.nbJoueurs),
        h('p', {}, GT.points(d.score) + (d.nbQuestions ? ' · ' + (d.nbQuestions - erreurs.length) + ' / ' + d.nbQuestions + ' bonnes réponses' : ''))),
      h('h3', { class: 'titre-carnet' }, erreurs.length ? '📝 Tes corrections (' + erreurs.length + ')' : '📝 Aucune erreur : bravo !'),
      h('div', { class: 'corrige' }, erreurs.map((e) => h('details', { class: 'ligne-corrige' },
        h('summary', {}, h('span', { class: 'q' }, e.question)),
        h('div', { class: 'reponse-corrige' },
          e.taReponse ? h('p', { class: 'ta-reponse' }, '✗ Ta réponse : ' + e.taReponse) : h('p', { class: 'ta-reponse' }, '⏱ Pas de réponse'),
          h('strong', {}, '✓ ' + e.bonne),
          e.correction ? h('p', {}, e.correction) : null)))));
  };

  ECRANS.podium.apres = (d) => { if (d.rang === 1) GT.confettis(); };

  /* ═══════════ Les petites mises à jour ═══════════ */

  const EVENEMENTS = {
    // La Cible : on passe devant sa cible, ou quelqu'un nous double.
    depassement: (d) => {
      const a = d.autre.avatar + ' ' + d.autre.nom;
      if (d.type === 'cible') { GT.bulle('🎯 Cible dépassée ! Tu passes devant ' + a + ' !', 'succes'); if (navigator.vibrate) navigator.vibrate([40, 50, 40]); }
      else { GT.bulle('⚠️ ' + a + (d.type === 'couronne' ? ' te prend la tête !' : ' vient de te doubler !'), 'alerte'); if (navigator.vibrate) navigator.vibrate(120); }
    }
  };

  // Au premier affichage, avant même que la ligne soit ouverte, on montre le formulaire si on n'a pas d'identité.
  if (!etat.joueurId) afficherFormulaire();
  else ecran.replaceChildren(h('div', { class: 'centre' }, h('h2', {}, 'Retour à la table…')));
})();
