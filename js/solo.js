/*
 * ════════════════════════════════════════════════════════════════════
 *  LE MODE SOLO ET LE MODE DUEL : jouer sur un seul téléphone
 * ════════════════════════════════════════════════════════════════════
 *
 *  Pas de serveur, pas d'écran de classe : le moteur du jeu tourne dans
 *  le téléphone lui-même. Cette page joue à la fois le rôle de l'écran
 *  de la classe (elle reçoit la question, la correction, le classement)
 *  et celui des téléphones (elle reçoit les touches de réponse), puis
 *  assemble le tout sur un seul écran.
 *
 *  DEUX FAÇONS DE JOUER
 *  • Seul·e : on révise à son rythme.
 *  • À plusieurs (2 à 4), sur le même appareil : chacun répond à son tour
 *    à la même question (« Passe le téléphone à Hugo »), sans voir la
 *    réponse des autres. Plus de temps, pas de bonus de vitesse : celui
 *    qui répond en premier n'est pas avantagé. À la fin, un vainqueur.
 *
 *  Dans les deux cas : pas de défis, et l'on passe à la suite au bouton,
 *  quand tout le monde a lu la correction.
 */
(function () {
  'use strict';
  const { h } = GT;

  const AVATARS = GT.Moteur.AVATARS;
  const ecran = document.getElementById('ecran');
  const entete = document.getElementById('entete');

  let moteur = null;
  let code = null;
  const vue = {};                  // 'T' : le dernier écran « classe » ; 'J0', 'J1'… : le dernier écran de chaque joueur
  let rendu = null;                // un rendu en attente (on regroupe les messages)
  let mode = 'seul';               // 'seul' ou 'plusieurs'
  let joueurs = [];                // [{ cid, nom, avatar, score }]
  let noms = ['', ''];             // les prénoms saisis à l'accueil
  let pret = null;                 // « Je suis prêt·e » : le joueur et la question pour lesquels on a déjà cliqué
  let selection = null;
  const avatarSeul = AVATARS[Math.floor(Math.random() * AVATARS.length)];

  const plusieurs = () => joueurs.length > 1;

  /* ═══════════ Le moteur, branché sur cette page ═══════════ */

  function demarrer(programme) {
    // Les joueurs : un seul en solo ; deux à quatre, chacun son avatar, à plusieurs.
    const melange = AVATARS.slice().sort(() => Math.random() - 0.5);
    const liste = mode === 'seul' ? [noms[0] || 'Moi'] : noms.map((n, i) => n.trim() || 'Joueur ' + (i + 1));
    joueurs = liste.map((n, i) => ({ cid: 'J' + i, nom: n.slice(0, 16), avatar: mode === 'seul' ? avatarSeul : melange[i], score: 0 }));
    Object.keys(vue).forEach((k) => delete vue[k]);
    pret = null;

    moteur = new GT.Moteur({
      minJoueurs: 1, maxJoueurs: 4, manuel: true, sansDefis: true,
      facteurTemps: plusieurs() ? joueurs.length * 1.5 : 1, sansVitesse: plusieurs(),
      envoyer: (cid, evenement, d) => {
        if (evenement === 'salle:creee') code = d.code;
        if (evenement === 'salle:etat') {
          // Les joueurs arrivent dans le même ordre qu'ils ont rejoint (le moteur peut renommer « Léa » en « Léa 2 »).
          joueurs.forEach((j, i) => { const x = d.joueurs[i]; if (x) { j.score = x.score; j.nom = x.nom; } });
          majEntete();
        }
        if (evenement === 'ecran') {
          GT.recalerHorloge(d.horloge);
          vue[cid] = { type: d.type, d: d.donnees };
          clearTimeout(rendu);
          rendu = setTimeout(afficher, 0);
        }
      }
    });
    moteur.recevoir('T', 'tablette:creer', {});
    joueurs.forEach((j) => moteur.recevoir(j.cid, 'joueur:rejoindre', { code, nom: j.nom, avatar: j.avatar }));
    GT.garderEcranAllume();
    majEntete();
    setTimeout(() => moteur.recevoir('T', 'tablette:lancer', { programme }), 0);
  }

  // Une action d'un joueur, ou de « l'animateur » (soi-même), envoyée juste après le rendu en cours.
  const agir = (cid, donnees) => setTimeout(() => moteur && moteur.recevoir(cid, 'joueur:action', donnees), 0);
  const suivant = () => setTimeout(() => moteur && moteur.recevoir('T', 'tablette:passer', {}), 0);

  function majEntete() {
    if (!moteur) return;
    entete.hidden = false;
    const scores = plusieurs()
      ? h('div', { class: 'qui scores-duel' }, joueurs.map((j) => h('span', { class: 'score-duel' }, j.avatar + ' ' + GT.points(j.score))))
      : h('div', { class: 'qui' }, h('strong', {}, joueurs[0].nom + ' · révision'), h('span', {}, GT.points(joueurs[0].score)));
    entete.replaceChildren(
      plusieurs() ? h('span', { class: 'avatar', 'aria-hidden': 'true' }, '⚔️') : h('span', { class: 'avatar', 'aria-hidden': 'true' }, joueurs[0].avatar),
      scores,
      h('button', { class: 'bouton bouton-petit bouton-discret', type: 'button', onclick: quitter }, 'Quitter'));
  }

  function quitter() {
    GT.arreterChronos();
    if (moteur) { const s = moteur.salles.get(code); if (s && s.jeu) s.jeu.arreter(); }
    moteur = null;
    accueil();
  }

  /* ═══════════ L'accueil : seul·e ou à plusieurs, et le choix des jeux ═══════════ */

  function accueil() {
    GT.arreterChronos();
    entete.hidden = true;
    const fiches = GT.Moteur.FICHES;
    if (!selection) selection = new Set(fiches.filter((f) => f.parDefaut).map((f) => f.id));

    const zoneMode = h('div', { class: 'choix-mode', role: 'group', 'aria-label': 'Façon de jouer' });
    const zoneNoms = h('div', { class: 'champ' });
    const grille = h('div');
    const lancer = h('button', { class: 'bouton', type: 'button' }, 'Commencer');
    const aleatoire = h('button', { class: 'bouton bouton-alea', type: 'button' }, '🎲 Partie aléatoire');
    const info = h('p', { class: 'muet' });

    function dessinerMode() {
      zoneMode.replaceChildren(
        h('button', { type: 'button', 'aria-pressed': String(mode === 'seul'), onclick: () => { mode = 'seul'; dessinerMode(); } }, h('strong', {}, '🧑 Seul·e'), h('span', {}, 'Réviser à mon rythme')),
        h('button', { type: 'button', 'aria-pressed': String(mode === 'plusieurs'), onclick: () => { mode = 'plusieurs'; if (noms.length < 2) noms.push(''); dessinerMode(); } }, h('strong', {}, '⚔️ À plusieurs'), h('span', {}, '2 à 4, chacun son tour')));
      if (mode === 'seul') {
        zoneNoms.replaceChildren(h('label', { for: 'nom0' }, 'Ton prénom'),
          h('input', { id: 'nom0', maxlength: '16', autocomplete: 'given-name', value: noms[0] || '', placeholder: 'Prénom ou surnom (facultatif)', oninput: (e) => { noms[0] = e.target.value; } }));
      } else {
        zoneNoms.replaceChildren(h('span', { style: { fontWeight: 700 } }, 'Les joueurs'),
          ...noms.map((n, i) => h('div', { class: 'ligne-joueur' },
            h('input', { id: 'nom' + i, maxlength: '16', value: n, placeholder: 'Joueur ' + (i + 1), 'aria-label': 'Prénom du joueur ' + (i + 1), oninput: (e) => { noms[i] = e.target.value; } }),
            noms.length > 2 ? h('button', { type: 'button', class: 'retirer-joueur', 'aria-label': 'Retirer le joueur ' + (i + 1), onclick: () => { noms.splice(i, 1); dessinerMode(); } }, '✕') : null)),
          noms.length < 4 ? h('button', { type: 'button', class: 'bouton bouton-petit bouton-discret', onclick: () => { noms.push(''); dessinerMode(); } }, '+ Un joueur') : null,
          h('p', { class: 'muet' }, 'Chacun répond à la même question, à son tour, en se passant le téléphone. Pas de bonus de vitesse.'));
      }
    }
    function dessinerJeux() {
      grille.replaceChildren(GT.familles(GT.Moteur.CATEGORIES, fiches, selection, (f) => h('button', {
        type: 'button', class: 'carte-jeu cat-' + f.categorie, 'aria-pressed': String(selection.has(f.id)),
        onclick: () => { selection.has(f.id) ? selection.delete(f.id) : selection.add(f.id); dessinerJeux(); }
      }, h('span', { class: 'icone', 'aria-hidden': 'true' }, f.icone), h('strong', {}, f.nom), h('span', {}, f.resume)), dessinerJeux));
      lancer.disabled = !selection.size;
      info.textContent = selection.size ? selection.size + ' jeu' + (selection.size > 1 ? 'x' : '') + ' · le dernier compte double ⚡' : 'Choisis au moins un jeu, ou lance une partie aléatoire.';
    }
    lancer.addEventListener('click', () => demarrer(fiches.map((f) => f.id).filter((id) => selection.has(id))));
    aleatoire.addEventListener('click', () => demarrer(GT.Moteur.PARTIE_ALEATOIRE));
    dessinerMode();
    dessinerJeux();

    ecran.replaceChildren(h('div', { class: 'formulaire' },
      h('img', { class: 'logo logo-grand', src: 'img/centre-s.png', alt: 'Centre S' }),
      h('div', { class: 'nom-jeu' },
        h('span', { class: 'sur-nom' }, 'SEX’ACT · SEX’PLIQUE · IST’ORY & VIH’GILANCE'),
        h('h1', {}, 'Le labo des savoirs'),
        h('span', { class: 'accroche' }, 'VIH & IST · Le jeu où la connaissance fait la différence !')),
      zoneMode,
      zoneNoms,
      h('div', { class: 'carte-alea' },
        h('strong', {}, '🎲 Partie aléatoire'),
        h('span', { class: 'muet' }, 'Toutes les familles mélangées, question après question. 3 manches, la dernière compte double.'),
        aleatoire),
      h('div', { class: 'champ' }, h('span', { style: { fontWeight: 700 } }, 'Ou compose ta partie'), grille),
      h('div', { class: 'lancement' }, lancer, info),
      h('p', { class: 'muet' }, 'Centre S · support théorique et support d\'activités VIH & IST. Rien n\'est enregistré : tout reste sur ce téléphone.')));
    window.scrollTo(0, 0);
  }

  /* ═══════════ Le jeu : on assemble l'écran « classe » et l'écran du joueur dont c'est le tour ═══════════ */

  function afficher() {
    const T = vue.T;
    if (!T || !moteur) return;
    const f = ECRANS[T.type];
    if (!f) return;
    const contenu = f(T.d);
    if (!contenu) return;
    GT.arreterChronos();
    ecran.replaceChildren(contenu);
    window.scrollTo(0, 0);
  }

  const bouton = (texte, action, discret) => h('button', { class: 'bouton' + (discret ? ' bouton-discret' : ''), type: 'button', onclick: (ev) => { ev.currentTarget.disabled = true; action(); } }, texte);
  const tete = (gauche, droite) => h('div', { class: 'qcm-tete' }, h('span', { class: 'etiquette' }, gauche), droite ? h('span', { class: 'muet' }, droite) : null);
  const ecranDe = (j) => vue[j.cid] || { type: null, d: {} };

  /*
   * À plusieurs, avant chaque réponse : « À toi, Hugo ! ». Les autres
   * détournent les yeux, Hugo touche « Je suis prêt·e », puis répond.
   */
  function tourDe(typeAttendu, cle, finA, dureeMs, rendreChoix) {
    const enAttente = joueurs.filter((j) => ecranDe(j).type === typeAttendu);
    if (!enAttente.length) return h('div', { class: 'centre' }, h('p', { class: 'muet' }, plusieurs() ? 'Toutes les réponses sont enregistrées…' : 'Réponse enregistrée…'));
    const j = enAttente[0];
    if (plusieurs() && pret !== j.cid + cle) {
      return h('div', { class: 'centre tour' },
        h('span', { class: 'etiquette' }, 'Chacun son tour'),
        h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, j.avatar),
        h('h2', {}, 'À toi, ' + j.nom + ' !'),
        h('p', { class: 'muet' }, 'Passe-lui le téléphone. Les autres, on ne regarde pas 🙈'),
        h('div', { style: { width: '100%' } }, GT.chrono(finA, dureeMs, { decompte: false })),
        bouton('Je suis prêt·e', () => { pret = j.cid + cle; afficher(); }));
    }
    return rendreChoix(j);
  }

  /* Le récapitulatif « qui a trouvé » à plusieurs, sous la révélation. */
  function resultatsDuel(typeResultat, ligne) {
    return h('div', { class: 'resultats-duel' }, joueurs.map((j) => {
      const r = ecranDe(j).type === typeResultat ? ecranDe(j).d : null;
      return h('div', { class: 'resultat-duel' + (r && (r.juste || r.parfait) ? ' gagne' : '') }, h('span', { class: 'avatar' }, j.avatar), h('span', { class: 'nom' }, j.nom), h('span', { class: 'issue' }, r ? ligne(r) : '…'));
    }));
  }

  const ECRANS = {
    intro: (d) => h('div', { class: 'centre' },
      d.finale ? h('div', { class: 'bandeau-finale' }, '⚡ Grande Finale · points ×2') : h('span', { class: 'etiquette' }, (d.fiche.id === 'tourbillon' ? 'Manche ' : 'Jeu ') + d.numero + ' sur ' + d.total),
      d.fiche.categorieNom ? h('span', { class: 'famille-pastille cat-' + d.fiche.categorie }, d.fiche.categorieNom) : null,
      h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, d.fiche.icone),
      h('h2', {}, d.fiche.nom),
      h('p', {}, d.fiche.regle.replace(/sur la tablette|à l'écran/g, 'ci-dessous').replace(/ sur votre téléphone/g, '')),
      bouton('C\'est parti !', suivant)),

    'qcm-question': (d) => tourDe('qcm-choix', '#q' + d.numero + d.intitule.length, d.finA, d.dureeMs, (j) => {
      const touches = h('div', { class: 'touches' }, d.choix.map((texte, i) => h('button', {
        class: 'touche ' + GT.classesChoix[i], type: 'button',
        onclick: () => { touches.querySelectorAll('button').forEach((b) => { b.disabled = true; }); if (navigator.vibrate) navigator.vibrate(20); agir(j.cid, { type: 'reponse', choix: i }); }
      }, h('span', { class: 'forme', 'aria-hidden': 'true' }, GT.formes[i]), h('span', {}, texte))));
      return h('div', { class: 'ecran', style: { padding: 0 } },
        tete(d.surtitre || 'Question', 'Question ' + d.numero + ' / ' + d.total),
        plusieurs() ? h('p', { class: 'qui-joue' }, j.avatar + ' ' + j.nom + ' répond') : null,
        h('h2', { class: 'question-solo' }, d.intitule),
        GT.chrono(d.finA, d.dureeMs),
        touches);
    }),

    'qcm-revelation': (d) => {
      const ex = d.explication || {};
      const dernier = d.numero >= d.total;
      if (plusieurs()) {
        return h('div', { class: 'ecran', style: { padding: 0 } },
          tete(d.surtitre || 'Réponse', 'Question ' + d.numero + ' / ' + d.total),
          h('p', { class: 'question-rappel' }, d.intitule),
          h('p', {}, 'La bonne réponse : ', h('strong', {}, d.choix[d.bonne])),
          resultatsDuel('qcm-resultat', (r) => r.juste ? '✓ +' + r.points : r.neutre ? '? +' + r.points : r.aRepondu ? '✗' : '⏱'),
          (ex.titre || ex.texte) ? h('div', { class: 'explication' }, ex.titre ? h('strong', {}, ex.titre) : null, ex.texte ? h('p', {}, ex.texte) : null) : null,
          bouton(dernier ? 'Voir les scores →' : 'Question suivante →', suivant));
      }
      const J = ecranDe(joueurs[0]);
      if (J.type !== 'qcm-resultat') return null;
      const r = J.d;
      return h('div', { class: 'ecran', style: { padding: 0 } },
        tete(d.surtitre || 'Réponse', 'Question ' + d.numero + ' / ' + d.total),
        h('div', { class: 'verdict-ligne' },
          h('span', { class: 'verdict ' + (r.juste ? 'verdict-juste' : r.neutre ? 'verdict-neutre' : 'verdict-faux'), 'aria-hidden': 'true' }, r.juste ? '✓' : r.neutre ? '?' : r.aRepondu ? '✗' : '⏱'),
          h('h2', {}, r.juste ? 'Bravo ! +' + r.points : r.neutre ? 'Honnête !' + (r.points ? ' +' + r.points : '') : r.aRepondu ? 'Raté !' : 'Trop tard !')),
        h('p', { class: 'question-rappel' }, d.intitule),
        h('p', {}, 'La bonne réponse : ', h('strong', {}, d.choix[d.bonne])),
        (ex.titre || ex.texte) ? h('div', { class: 'explication' }, ex.titre ? h('strong', {}, ex.titre) : null, ex.texte ? h('p', {}, ex.texte) : null) : null,
        bouton(dernier ? 'Voir mon score →' : 'Question suivante →', suivant));
    },

    'ordre-question': (d) => tourDe('ordre-choix', '#o' + d.numero + d.consigne.length, d.finA, d.dureeMs, (j) => {
      const choisis = [];
      const ligne = h('ol', { class: 'ordre-choisi', 'aria-live': 'polite' });
      const recommencer = h('button', { class: 'bouton bouton-petit bouton-discret', type: 'button', hidden: true, onclick: () => { afficher(); } }, '↺ Recommencer');
      const boutons = d.etapes.map((e, i) => h('button', {
        class: 'touche-etape', type: 'button',
        onclick: (ev) => {
          if (choisis.includes(i)) return;
          choisis.push(i);
          ev.currentTarget.disabled = true;
          ev.currentTarget.prepend(h('span', { class: 'rang' }, String(choisis.length)));
          ligne.replaceChildren(...choisis.map((k) => h('li', {}, d.etapes[k].lettre)));
          recommencer.hidden = false;
          if (choisis.length === d.etapes.length) agir(j.cid, { type: 'ordre', ordre: choisis.slice() });
        }
      }, h('span', { class: 'lettre' }, e.lettre), h('span', {}, e.texte)));
      return h('div', { class: 'ecran', style: { padding: 0 } },
        tete(d.titre || 'Dans l\'ordre !', 'Séquence ' + d.numero + ' / ' + d.total),
        plusieurs() ? h('p', { class: 'qui-joue' }, j.avatar + ' ' + j.nom + ' répond') : null,
        h('h2', { class: 'question-solo' }, d.consigne),
        h('p', { class: 'muet' }, 'Touche les étapes de la première à la dernière.'),
        GT.chrono(d.finA, d.dureeMs),
        h('div', { class: 'touches' }, boutons),
        h('div', { class: 'lancement' }, ligne, recommencer));
    }),

    'ordre-revelation': (d) => {
      const dernier = d.numero >= d.total;
      const corps = [
        h('p', { class: 'question-rappel' }, d.consigne),
        h('ol', { class: 'etapes etapes-solution' }, d.solution.map((t, i) => h('li', { class: 'etape' }, h('span', { class: 'lettre' }, String(i + 1)), h('span', {}, t)))),
        h('div', { class: 'explication' }, h('strong', {}, 'La correction'), h('p', {}, d.correction))
      ];
      if (plusieurs()) {
        return h('div', { class: 'ecran', style: { padding: 0 } },
          tete('Le bon ordre', 'Séquence ' + d.numero + ' / ' + d.total),
          resultatsDuel('ordre-resultat', (r) => r.parfait ? '✓ +' + r.points : r.aRepondu ? r.bienPlaces + '/' + r.n + (r.points ? ' · +' + r.points : '') : '⏱'),
          ...corps,
          bouton(dernier ? 'Voir les scores →' : 'Séquence suivante →', suivant));
      }
      const J = ecranDe(joueurs[0]);
      if (J.type !== 'ordre-resultat') return null;
      const r = J.d;
      return h('div', { class: 'ecran', style: { padding: 0 } },
        tete('Le bon ordre', 'Séquence ' + d.numero + ' / ' + d.total),
        h('div', { class: 'verdict-ligne' },
          h('span', { class: 'verdict ' + (r.parfait ? 'verdict-juste' : 'verdict-faux'), 'aria-hidden': 'true' }, r.parfait ? '✓' : r.aRepondu ? r.bienPlaces + '/' + r.n : '⏱'),
          h('h2', {}, r.parfait ? 'Sans faute ! +' + r.points : r.aRepondu ? r.bienPlaces + ' bien placée' + (r.bienPlaces > 1 ? 's' : '') + (r.points ? ' · +' + r.points : '') : 'Trop tard !')),
        ...corps,
        bouton(dernier ? 'Voir mon score →' : 'Séquence suivante →', suivant));
    },

    classement: (d) => h('div', { class: 'centre' },
      h('span', { class: 'etiquette' }, 'Jeu ' + d.numero + ' / ' + d.total + ' terminé'),
      plusieurs()
        ? h('div', { class: 'resultats-duel', style: { width: '100%' } }, d.classement.map((c, i) => h('div', { class: 'resultat-duel' + (i === 0 ? ' gagne' : '') },
            h('span', { class: 'avatar' }, c.avatar), h('span', { class: 'nom' }, GT.rang(i + 1) + ' · ' + c.nom), h('span', { class: 'issue' }, GT.points(c.score) + (c.gain ? ' (+' + c.gain + ')' : '')))))
        : h('div', { class: 'centre' },
            h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, '📈'),
            h('h2', {}, GT.points(d.classement[0] ? d.classement[0].score : 0)),
            d.classement[0] && d.classement[0].gain ? h('p', {}, '+' + d.classement[0].gain + ' sur ce jeu') : null),
      d.prochainFinale ? h('div', { class: 'bandeau-finale' }, '⚡ Prochain jeu : la Grande Finale ×2') : null,
      bouton(d.dernier ? (plusieurs() ? 'Et le vainqueur est… 🏆' : 'Voir mon bilan 🏁') : 'Jeu suivant : ' + d.prochain.icone + ' ' + d.prochain.nom, suivant)),

    podium: (d) => {
      const carnet = (j, titre) => {
        const p = ecranDe(j).type === 'podium' ? ecranDe(j).d : { erreurs: [], nbQuestions: 0 };
        const erreurs = p.erreurs || [];
        return h('details', { class: 'carnet-joueur', open: !plusieurs() },
          h('summary', {}, titre || (j.avatar + ' ' + j.nom + ' · ' + (p.nbQuestions - erreurs.length) + ' / ' + p.nbQuestions + ' bonnes réponses')),
          h('div', { class: 'corrige' }, erreurs.length ? erreurs.map((e) => h('details', { class: 'ligne-corrige' },
            h('summary', {}, h('span', { class: 'q' }, e.question)),
            h('div', { class: 'reponse-corrige' },
              e.taReponse ? h('p', { class: 'ta-reponse' }, '✗ Réponse donnée : ' + e.taReponse) : h('p', { class: 'ta-reponse' }, '⏱ Pas de réponse'),
              h('strong', {}, '✓ ' + e.bonne),
              e.correction ? h('p', {}, e.correction) : null))) : h('p', { class: 'muet' }, 'Aucune erreur : bravo !')));
      };

      if (plusieurs()) {
        const [premier] = d.classement;
        const exAequo = d.classement.filter((c) => c.score === premier.score).length > 1;
        return h('div', { class: 'ecran', style: { padding: 0 } },
          h('div', { class: 'centre victoire' },
            h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, exAequo ? '🤝' : '🏆'),
            h('span', { class: 'etiquette' }, exAequo ? 'Égalité !' : 'Victoire !'),
            h('h2', {}, exAequo ? 'Ex aequo en tête !' : premier.avatar + ' ' + premier.nom + ' remporte la partie !'),
            h('p', {}, GT.points(premier.score))),
          h('div', { class: 'resultats-duel' }, d.classement.map((c, i) => h('div', { class: 'resultat-duel' + (i === 0 ? ' gagne' : '') },
            h('span', { class: 'avatar' }, ['🥇', '🥈', '🥉'][d.classement.filter((x) => x.score > c.score).length] || '🎉'), h('span', { class: 'nom' }, c.avatar + ' ' + c.nom), h('span', { class: 'issue' }, GT.points(c.score))))),
          h('h3', { class: 'titre-carnet' }, '📝 Les corrections de chacun'),
          ...joueurs.map((j) => carnet(j)),
          h('div', { class: 'lancement' }, bouton('Revanche !', quitter)));
      }
      const j = joueurs[0];
      const p = ecranDe(j).type === 'podium' ? ecranDe(j).d : { erreurs: [], nbQuestions: 0, score: 0 };
      const bonnes = (p.nbQuestions || 0) - (p.erreurs || []).length;
      const taux = p.nbQuestions ? Math.round(bonnes / p.nbQuestions * 100) : 0;
      return h('div', { class: 'ecran', style: { padding: 0 } },
        h('div', { class: 'centre', style: { margin: '8px 0' } },
          h('div', { class: 'gros-emoji', 'aria-hidden': 'true' }, taux >= 80 ? '🏆' : taux >= 50 ? '💪' : '📚'),
          h('h2', {}, bonnes + ' / ' + (p.nbQuestions || 0) + ' bonnes réponses'),
          h('p', {}, GT.points(p.score || 0) + ' · ' + taux + ' %'),
          h('p', { class: 'muet' }, taux >= 80 ? 'Excellent : le cours est bien acquis.' : taux >= 50 ? 'Bonne base : relis tes corrections.' : 'Tes corrections ci-dessous sont le meilleur point de départ.')),
        carnet(j, (p.erreurs || []).length ? '📝 Tes corrections (' + p.erreurs.length + ')' : '📝 Tes corrections'),
        h('div', { class: 'lancement' }, bouton('Rejouer', quitter)));
    }
  };

  // Les confettis : pour le vainqueur à plusieurs, ou pour un très bon score en solo.
  ECRANS.podium.apres = () => {
    if (plusieurs()) return GT.confettis();
    const p = ecranDe(joueurs[0]).d || {};
    if (p.nbQuestions && (p.nbQuestions - (p.erreurs || []).length) / p.nbQuestions >= 0.8) GT.confettis();
  };
  const afficherBase = afficher;
  afficher = function () {
    afficherBase();
    if (vue.T && vue.T.type === 'podium' && ECRANS.podium.apres && !afficher.fete) { afficher.fete = true; ECRANS.podium.apres(); }
    if (!vue.T || vue.T.type !== 'podium') afficher.fete = false;
  };

  accueil();
})();
