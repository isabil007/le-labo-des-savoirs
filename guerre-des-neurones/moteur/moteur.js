/*
 * ════════════════════════════════════════════════════════════════════
 *  LA GUERRE DES NEURONES — Le moteur de jeu (le « chef d'orchestre »)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Ce fichier est le cœur de l'application. Il ne dessine rien et ne
 *  sait même pas s'il parle à une tablette, à un iPhone ou à un Samsung :
 *  il reçoit des messages (« Léa veut rejoindre la salle BRIK », « la
 *  tablette lance la partie », « Papy a répondu B »…) et il en envoie
 *  (« voici l'écran à afficher », « voici le nouveau classement »…).
 *
 *  Cette indifférence est voulue. Elle permet au même moteur de tourner :
 *    • sur le serveur Node.js, qui le relie aux appareils par WebSocket
 *      (c'est le fichier serveur.js) ;
 *    • dans le navigateur, pour le simulateur, qui le relie à des écrans
 *      factices posés côte à côte (c'est public/js/simulateur.js).
 *  Il suffit de lui fournir une fonction « envoyer(connexion, evenement,
 *  donnees) » qui sait acheminer un message vers un appareil.
 *
 *  LES SALLES
 *  ──────────
 *  Une « salle », c'est une table de jeu : une tablette, de 2 à 12
 *  joueurs, un programme de mini-jeux et des scores. Chaque salle a un
 *  code de quatre lettres. Plusieurs salles peuvent coexister sur le
 *  même serveur (deux familles, deux classes…) sans jamais se mélanger.
 *
 *  LE DÉROULEMENT D'UNE PARTIE (les « états » d'une salle)
 *  ───────────────────────────────────────────────────────
 *    salon ──► intro ──► jeu ──► classement ──► intro ──► … ──► podium
 *    • salon      : on attend les joueurs, l'animateur choisit les jeux
 *    • intro      : la tablette présente le jeu et sa règle (7 secondes)
 *    • jeu        : le mini-jeu a la main
 *    • classement : les scores après le jeu, en attendant « Jeu suivant »
 *    • podium     : la fin de la partie, avec les trois premiers à l'honneur
 *
 *  LE PIMENT : LA CIBLE 🎯 ET LA GRANDE FINALE ⚡
 *  ─────────────────────────────────────────────
 *  Pour que chaque manche fasse battre le cœur, le moteur fabrique,
 *  juste avant chaque jeu, un défi personnel pour chaque joueur :
 *    • celui qui mène doit « défendre sa couronne » (rester seul en tête) ;
 *    • chacun des autres doit dépasser le joueur placé juste devant lui ;
 *    • à la toute première manche, quand tout le monde est à zéro, il faut
 *      finir dans la moitié haute du classement de la manche.
 *  Un défi réussi rapporte une prime. Pendant le jeu, dès qu'un joueur
 *  passe devant sa cible, son téléphone vibre, et celui qui vient d'être
 *  doublé est prévenu lui aussi : la course-poursuite se vit en direct.
 *  Enfin, la dernière manche est la « Grande Finale » : tous les points,
 *  primes comprises, y comptent double. Rien n'est joué avant le podium.
 *
 *  LA PARTIE SURPRISE 🎲 (le mode proposé par défaut)
 *  ─────────────────────────────────────────────────
 *  Au lieu de choisir les jeux à l'avance, on laisse faire le hasard :
 *    • au lancement, le moteur tire un objectif (entre 8 000 et 11 000
 *      points) : c'est la « ligne d'arrivée » de la soirée ;
 *    • chaque manche est un mini-jeu tiré au sort, jamais deux fois le
 *      même d'affilée, et tous les jeux passent avant qu'un revienne ;
 *    • dès qu'un joueur a franchi la ligne (à partir de la 3e manche),
 *      la manche suivante devient la Grande Finale, à points doublés ;
 *    • si personne n'y arrive, la 6e manche est la finale quoi qu'il
 *      arrive : la soirée garde un rythme raisonnable ;
 *    • entre les manches, un commentateur taquin résume la course, et le
 *      podium final remet quelques prix pour rire (contenus/commentaires.js).
 *
 *  LE DÉFI INATTENDU 🎰
 *  ────────────────────
 *  Avant certaines manches (environ 4 fois sur 10), le sort désigne un
 *  joueur au hasard — jamais le même deux fois de suite — et lui lance
 *  un défi surprise pour la manche qui commence :
 *    • 🎰 Quitte ou double : meilleur score de la manche → ses points de
 *      la manche doublent ; sinon, il en perd la moitié ;
 *    • ⚔️ Duel éclair : contre un autre joueur tiré au sort ; celui qui
 *      marque le plus pendant la manche vole 500 points à l'autre ;
 *    • 🍀 Trèfle à quatre feuilles : tous ses points de la manche comptent
 *      double (même en finale : ×4 !).
 *
 *  L'ENCHAÎNEMENT AUTOMATIQUE
 *  ──────────────────────────
 *  Après chaque classement, la manche suivante démarre toute seule au
 *  bout de 20 secondes (le temps de lire le commentateur). L'animateur
 *  peut aller plus vite avec le bouton, ou mettre en pause.
 *
 *  LES GAGES SECRETS 🤫 ET LE TRIBUNAL
 *  ──────────────────────────────────
 *  Au lancement, chaque joueur reçoit en secret un gage à accomplir
 *  pendant la soirée (contenus/gages.js). Après la dernière manche, avant
 *  le podium, la tablette révèle les gages un à un : les autres joueurs
 *  votent sur leur téléphone (« réussi » ou « raté »). Majorité de
 *  « réussi » : une prime qui peut renverser le classement final.
 *    salle.etat : … ──► classement ──► gages (vote ⇄ verdict) ──► podium
 *
 *  LES MESSAGES ÉCHANGÉS
 *  ─────────────────────
 *  Reçus de la tablette : tablette:creer, tablette:reprendre, tablette:lancer,
 *    tablette:passer, tablette:terminer-jeu, tablette:podium, tablette:nouvelle,
 *    tablette:retirer
 *  Reçus des téléphones : joueur:rejoindre, joueur:action, joueur:reaction
 *  Envoyés : salle:creee, salle:etat, joueur:accepte, ecran, evenement,
 *    reaction, expulse, erreur
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.Moteur = racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'moteur', function (exiger) {
  'use strict';
  const outils = exiger('./outils');
  const COMMENTAIRES = exiger('./contenus/commentaires');
  const GAGES = exiger('./contenus/gages');

  /* Les quatorze mini-jeux, dans l'ordre proposé par défaut. */
  const JEUX = {};
  [exiger('./jeux/quiz'), exiger('./jeux/dessin'), exiger('./jeux/erreurs'), exiger('./jeux/zoom'), exiger('./jeux/humour'), exiger('./jeux/reflexe'), exiger('./jeux/memoire'), exiger('./jeux/logique'), exiger('./jeux/gastronomie'),
    exiger('./jeux/blindtest'), exiger('./jeux/drapeaux'), exiger('./jeux/melange'), exiger('./jeux/fousrires'), exiger('./jeux/calcul'),
    exiger('./jeux/enigmes'), exiger('./jeux/motscroises'), exiger('./jeux/puzzle'), exiger('./jeux/vraifarfelu')]
    .forEach((Classe) => { JEUX[Classe.fiche.id] = Classe; });
  const FICHES = Object.values(JEUX).map((C) => C.fiche);

  /*
   * Les familles de jeux. En partie surprise, deux manches qui se suivent
   * ne sont jamais de la même famille : après un quiz vient un réflexe, une
   * chanson, un dessin ou un fou rire… mais pas un autre questionnaire.
   * Un nouveau jeu sans famille déclarée forme sa propre famille.
   */
  const FAMILLES_CONNUES = {
    quiz: 'questions', humour: 'questions', drapeaux: 'questions', gastronomie: 'questions', melange: 'questions',
    logique: 'cerveau', memoire: 'cerveau', calcul: 'cerveau', enigmes: 'cerveau',
    zoom: 'oeil', erreurs: 'oeil', puzzle: 'oeil',
    motscroises: 'mots',
    reflexe: 'reflexe',
    dessin: 'creation', fousrires: 'rire', vraifarfelu: 'rire',
    blindtest: 'musique'
  };
  /* Un jeu est-il jouable avec ce nombre de joueurs ? (la fiche peut fixer un minimum) */
  const jouable = (id, nb) => nb >= ((JEUX[id].fiche && JEUX[id].fiche.minJoueurs) || 1);

  /* Les jeux d'action qui s'intercalent entre deux séries du « fil des thèmes » (mode solo). */
  const JEUX_ACTION = ['reflexe', 'memoire', 'erreurs'];

  const FAMILLES = {};
  Object.keys(JEUX).forEach((id) => { FAMILLES[id] = FAMILLES_CONNUES[id] || id; });

  /* Les avatars et réactions autorisés (une liste fermée : on n'affiche jamais n'importe quoi). */
  const AVATARS = ['🦊', '🐻', '🐼', '🐸', '🦉', '🐙', '🦁', '🐯', '🐨', '🐵', '🐧', '🦄', '🐢', '🐝', '🦔', '🐳'];
  const REACTIONS = ['👏', '😂', '😮', '❤️', '🔥', '🤔', '😜', '🏆'];

  /* La prime d'un défi réussi, et le multiplicateur de la Grande Finale. */
  const PRIME_DEFI = 300;
  const MULTIPLICATEUR_FINALE = 2;

  /* Les réglages de la partie surprise. */
  const OBJECTIF_MIN = 8000, OBJECTIF_MAX = 11000;   // la ligne d'arrivée est tirée entre ces deux valeurs
  const MANCHES_AVANT_FINALE = 3;                    // la finale ne peut pas arriver avant la 4e manche
  const MANCHES_MAX = 6;                             // au plus tard, la 6e manche est la finale

  /* Le défi inattendu : sa fréquence et l'enjeu du duel. */
  const PROBA_INATTENDU = 0.4;
  const ENJEU_DUEL = 500;
  const TYPES_INATTENDUS = ['quitte', 'duel', 'trefle'];

  /* La prime d'un gage secret validé par la table : de quoi changer le podium. */
  const PRIME_GAGE = 1500;

  class Moteur {
    /*
     * options.envoyer(connexionId, evenement, donnees) : obligatoire, c'est le « facteur ».
     * options.minJoueurs / maxJoueurs : 1 et 12 par défaut (on peut jouer seul, pour s'entraîner ou se défier soi-même).
     * options.introMs : la durée de l'écran de présentation de chaque jeu.
     */
    constructor(options) {
      this.envoyer = options.envoyer;
      this.minJoueurs = options.minJoueurs || 1;
      this.maxJoueurs = options.maxJoueurs || 12;
      this.introMs = options.introMs || 7000;
      this.voteMs = options.voteMs || 20000;          // le temps pour voter au tribunal des gages
      this.verdictMs = options.verdictMs || 7000;     // le temps d'affichage de chaque verdict
      this.classementMs = options.classementMs || 20000; // le classement reste affiché 20 s, puis on enchaîne
      this.probaInattendu = options.probaInattendu !== undefined ? options.probaInattendu : PROBA_INATTENDU;
      this.typeInattendu = options.typeInattendu || null; // pour les tests : imposer un type de défi inattendu
      this.salles = new Map();      // code → salle
      this.connexions = new Map();  // connexionId → { role, code, joueurId }
    }

    /* ═══════════ La porte d'entrée de tous les messages ═══════════ */

    recevoir(cid, evenement, d) {
      d = d || {};
      try {
        switch (evenement) {
          case 'tablette:creer': return this.creerSalle(cid);
          case 'tablette:reprendre': return this.reprendreSalle(cid, d.code);
          case 'joueur:rejoindre': return this.rejoindre(cid, d);
        }
        // Pour tous les autres messages, il faut déjà appartenir à une salle.
        const cnx = this.connexions.get(cid);
        if (!cnx) return;
        const salle = this.salles.get(cnx.code);
        if (!salle) return;
        salle.derniereActivite = Date.now();

        if (cnx.role === 'tablette') {
          // Toute autre commande de la tablette pendant une pause (passer, terminer, podium…) commence par la lever.
          if (salle.figeA && !['tablette:figer', 'tablette:relancer', 'tablette:signal'].includes(evenement)) this.relancer(salle);
          switch (evenement) {
            case 'tablette:lancer': return this.lancerPartie(salle, d, cid);
            case 'tablette:passer': return this.passer(salle);
            case 'tablette:pause': return this.mettreEnPause(salle);
            // La vraie pause ⏸ (mode solo) : tout s'arrête, même en pleine question, puis repart.
            case 'tablette:figer': return this.figer(salle);
            case 'tablette:relancer': return this.relancer(salle);
            // Un message de la tablette pour le jeu en cours (ex. : « extrait introuvable » au blind test).
            case 'tablette:signal': return salle.etat === 'jeu' && salle.jeu && salle.jeu.signalTablette ? salle.jeu.signalTablette(d) : undefined;
            case 'tablette:terminer-jeu': return salle.jeu && this.finJeu(salle);
            case 'tablette:podium': return salle.etat === 'gages' || salle.gagesJuges ? this.podium(salle) : this.finDePartie(salle);
            case 'tablette:nouvelle': return this.nouvellePartie(salle);
            case 'tablette:retirer': return this.retirerJoueur(salle, d.joueurId);
          }
        } else if (cnx.role === 'joueur') {
          switch (evenement) {
            case 'joueur:action':
              if (salle.figeA) return; // en pause, les touches ne comptent pas
              if (salle.etat === 'jeu' && salle.jeu) salle.jeu.action(cnx.joueurId, d);
              else if (salle.etat === 'gages') this.voterGage(salle, cnx.joueurId, d);
              return;
            case 'joueur:reaction': return this.reaction(salle, cnx.joueurId, d);
          }
        }
      } catch (erreur) {
        // Une erreur dans un jeu ne doit jamais faire tomber toute la soirée.
        console.error('[La guerre des neurones] Erreur sur « ' + evenement + ' » :', erreur);
        this.envoyer(cid, 'erreur', { message: 'Petit couac technique. On continue !' });
      }
    }

    /* Un appareil a perdu la connexion (téléphone en veille, Wi-Fi capricieux…). */
    deconnexion(cid) {
      const cnx = this.connexions.get(cid);
      this.connexions.delete(cid);
      if (!cnx) return;
      const salle = this.salles.get(cnx.code);
      if (!salle) return;
      if (cnx.role === 'tablette' && salle.tabletteId === cid) {
        salle.tabletteId = null; // la salle reste ouverte : la tablette pourra la reprendre
      } else if (cnx.role === 'joueur') {
        const j = salle.joueurs.get(cnx.joueurId);
        if (j && j.connexionId === cid) {
          // On garde le joueur et son score : s'il revient, il reprend sa place.
          j.connecte = false;
          if (salle.jeu) salle.jeu.joueurParti(j.id);
          this.diffuserEtat(salle);
        }
      }
    }

    /* Le ménage : on ferme les salles inactives depuis plus de quatre heures. */
    nettoyer() {
      const limite = Date.now() - 4 * 3600 * 1000;
      this.salles.forEach((salle, code) => {
        if (salle.derniereActivite < limite) {
          if (salle.jeu) salle.jeu.arreter();
          clearTimeout(salle.minuteurIntro);
          clearTimeout(salle.minuteurGage);
          clearTimeout(salle.minuteurClassement);
          this.salles.delete(code);
        }
      });
    }

    /* ═══════════ La tablette ═══════════ */

    creerSalle(cid) {
      const code = outils.codeSalle((c) => this.salles.has(c));
      const salle = {
        code, tabletteId: cid, joueurs: new Map(), etat: 'salon',
        programme: [], index: -1, jeu: null, dernierEcranTablette: null,
        derniereActivite: Date.now(), minuteurIntro: null,
        multiplicateur: 1, defis: new Map(), verificationPrevue: false,
        mode: 'choix', objectif: null, finaleIndex: null, sac: []
      };
      salle.ctx = this.fabriquerContexte(salle);
      this.salles.set(code, salle);
      this.connexions.set(cid, { role: 'tablette', code });
      this.envoyer(cid, 'salle:creee', { code, jeux: FICHES, minJoueurs: this.minJoueurs, maxJoueurs: this.maxJoueurs });
      this.ecranTablette(salle, 'salon', { code });
      this.diffuserEtat(salle);
      return code;
    }

    /* La tablette s'est rechargée ou a été rebranchée : elle retrouve sa salle et l'écran en cours. */
    reprendreSalle(cid, code) {
      const salle = this.salles.get(String(code || '').toUpperCase());
      if (!salle) return this.creerSalle(cid);
      if (salle.tabletteId && salle.tabletteId !== cid) this.connexions.delete(salle.tabletteId);
      salle.tabletteId = cid;
      this.connexions.set(cid, { role: 'tablette', code: salle.code });
      this.envoyer(cid, 'salle:creee', { code: salle.code, jeux: FICHES, minJoueurs: this.minJoueurs, maxJoueurs: this.maxJoueurs, reprise: true });
      this.diffuserEtat(salle);
      if (salle.dernierEcranTablette) this.envoyer(cid, 'ecran', Object.assign({ horloge: Date.now() }, salle.dernierEcranTablette));
    }

    /*
     * Le coup d'envoi. Deux façons de jouer :
     *   { mode: 'surprise' }          → les jeux sont tirés au sort jusqu'à l'objectif ;
     *   { programme: ['quiz', …] }    → l'animateur a choisi les jeux et leur ordre.
     */
    lancerPartie(salle, d, cid) {
      d = d || {};
      const presents = this.joueursPresents(salle).length;
      if (presents < this.minJoueurs) {
        return this.envoyer(cid, 'erreur', { message: 'Il faut au moins ' + this.minJoueurs + ' joueurs connectés pour lancer la partie (' + presents + ' pour l\'instant).' });
      }
      salle.index = -1;
      // Le sac n'est PAS vidé : à la revanche, on tire d'abord les jeux pas encore joués ce soir.
      salle.sac = salle.sac || [];
      salle.joueurs.forEach((j) => { j.score = 0; j.scoreAvant = 0; j.defisReussis = 0; j.meilleureManche = 0; j.gage = null; j.gageReussi = false; });
      // Les gages secrets : un par joueur, tous différents tant qu'il en reste.
      salle.gagesDistribues = true;
      salle.gagesJuges = false;
      // Seul à la table, personne ne pourrait remarquer ni juger un gage : on n'en distribue pas.
      if (presents >= 2) salle.joueurs.forEach((j) => { j.gage = this.tirerGage(salle); });
      // Le « fil des thèmes » (mode solo) : chaque question change de thème (le grand mélange),
      // et entre deux séries, un jeu d'action pour changer de rythme.
      salle.filDesThemes = !!d.filDesThemes;
      if (d.mode === 'surprise') {
        salle.mode = 'surprise';
        salle.objectif = this.tirerObjectif();
        salle.programme = [];
        salle.programme.push(this.tirerJeu(salle));
        salle.finaleIndex = null; // décidée en cours de route
      } else {
        salle.mode = 'choix';
        salle.objectif = null;
        let choisis = (Array.isArray(d.programme) ? d.programme : []).filter((id) => JEUX[id] && jouable(id, presents));
        if (!choisis.length) choisis = Object.keys(JEUX).filter((id) => jouable(id, presents));
        // « Ordre au hasard » : les jeux choisis s'enchaînent dans un ordre imprévisible.
        salle.programme = d.melanger ? this.espacerFamilles(choisis) : choisis;
        salle.finaleIndex = salle.programme.length >= 2 ? salle.programme.length - 1 : null;
      }
      this.jeuSuivant(salle);
    }

    /* Un gage que personne d'autre à la table n'a encore (sauf si la banque est épuisée). */
    tirerGage(salle) {
      const pris = new Set(Array.from(salle.joueurs.values()).map((j) => j.gage).filter(Boolean));
      const libres = GAGES.filter((g) => !pris.has(g));
      return outils.tirerNeuf('gages', libres.length ? libres : GAGES, 1)[0];
    }

    /* La ligne d'arrivée de la partie surprise : un chiffre rond, tiré au hasard. */
    tirerObjectif() {
      const pas = 500;
      const crans = Math.floor((OBJECTIF_MAX - OBJECTIF_MIN) / pas) + 1;
      return OBJECTIF_MIN + pas * Math.floor(Math.random() * crans);
    }

    /*
     * Le tirage du prochain jeu, façon « sac de billes » : on mélange tous
     * les jeux dans un sac et on les sort un à un. Ainsi, chaque jeu passe
     * avant qu'un autre revienne, et jamais deux fois de suite le même.
     */
    tirerJeu(salle) {
      const precedent = salle.programme[salle.programme.length - 1];
      if (salle.filDesThemes) {
        if (precedent !== 'melange') return 'melange';
        // Les jeux d'action, à tour de rôle et dans un ordre tiré au sort.
        if (!salle.sacAction || !salle.sacAction.length) salle.sacAction = outils.melanger(JEUX_ACTION.filter((id) => JEUX[id]));
        return salle.sacAction.pop();
      }
      // Seul à la table ? Les jeux qui demandent plusieurs joueurs (dessin, fous rires) sont mis de côté.
      const nb = this.joueursPresents(salle).length;
      const possibles = () => outils.melanger(Object.keys(JEUX).filter((id) => jouable(id, nb)));
      if (salle.sac) salle.sac = salle.sac.filter((id) => jouable(id, nb));
      if (!salle.sac || !salle.sac.length) salle.sac = possibles();
      // On prend la première bille d'une AUTRE famille que le jeu précédent (réflexe, musique, rire, questions…).
      let i = salle.sac.length - 1;
      while (i >= 0 && precedent && FAMILLES[salle.sac[i]] === FAMILLES[precedent]) i--;
      if (i < 0) {
        // Le sac ne contient plus que des jeux de la même famille : on le remplit à neuf (sans jamais
        // reprendre le même jeu), et l'on tire dans le sac neuf.
        salle.sac = possibles();
        return this.tirerJeu(salle);
      }
      return salle.sac.splice(i, 1)[0];
    }

    /*
     * Pour un menu choisi à la main en « ordre au hasard » : on mélange,
     * puis on évite, autant que possible, deux jeux de la même famille
     * côte à côte (on échange avec un jeu plus loin dans la liste).
     */
    espacerFamilles(liste) {
      // Plusieurs essais au hasard : on garde le premier sans voisins de même famille, sinon le meilleur.
      const collees = (l) => l.reduce((n, id, i) => n + (i > 0 && FAMILLES[id] === FAMILLES[l[i - 1]] ? 1 : 0), 0);
      let meilleur = null;
      for (let essai = 0; essai < 40; essai++) {
        const l = outils.melanger(liste);
        for (let i = 1; i < l.length; i++) {
          if (FAMILLES[l[i]] !== FAMILLES[l[i - 1]]) continue;
          const j = l.findIndex((id, k) => k > i && FAMILLES[id] !== FAMILLES[l[i - 1]] && (k + 1 >= l.length || FAMILLES[l[k + 1]] !== FAMILLES[l[i]]));
          if (j > 0) [l[i], l[j]] = [l[j], l[i]];
        }
        if (!meilleur || collees(l) < collees(meilleur)) meilleur = l;
        if (collees(meilleur) === 0) break;
      }
      return meilleur;
    }

    passer(salle) {
      if (salle.etat === 'intro') this.demarrerJeu(salle);
      else if (salle.etat === 'jeu' && salle.jeu) salle.jeu.passer();
      else if (salle.etat === 'classement') this.jeuSuivant(salle);
      else if (salle.etat === 'gages') { if (salle.phaseGage === 'vote') this.jugerGage(salle); else this.gageSuivant(salle); }
    }

    nouvellePartie(salle) {
      this.arreterJeu(salle);
      salle.etat = 'salon';
      salle.index = -1;
      salle.gagesDistribues = false;
      salle.gagesJuges = false;
      salle.joueurs.forEach((j) => { j.gage = null; j.gageReussi = false; });
      salle.multiplicateur = 1;
      salle.defis = new Map();
      salle.joueurs.forEach((j) => { j.score = 0; });
      this.ecranTablette(salle, 'salon', { code: salle.code });
      salle.joueurs.forEach((j) => this.ecranJoueur(salle, j.id, 'salon', {}));
      this.diffuserEtat(salle);
    }

    retirerJoueur(salle, joueurId) {
      const j = salle.joueurs.get(joueurId);
      if (!j) return;
      salle.joueurs.delete(joueurId);
      if (j.connecte) {
        this.envoyer(j.connexionId, 'expulse', { message: 'L\'animateur t\'a retiré de la partie.' });
        this.connexions.delete(j.connexionId);
      }
      if (salle.jeu) salle.jeu.joueurParti(joueurId);
      this.diffuserEtat(salle);
    }

    /* ═══════════ Les téléphones ═══════════ */

    rejoindre(cid, d) {
      const code = String(d.code || '').trim().toUpperCase();
      const salle = this.salles.get(code);
      if (!salle) return this.envoyer(cid, 'erreur', { message: 'Aucune partie avec le code « ' + (code || '…') + ' ». Vérifiez le code affiché sur la tablette.' });
      salle.derniereActivite = Date.now();

      // ─── Cas 1 : un joueur qui revient (même identifiant qu'avant) ───
      let j = d.joueurId && salle.joueurs.get(d.joueurId);
      if (j) {
        if (j.connecte && j.connexionId !== cid) this.connexions.delete(j.connexionId);
        j.connexionId = cid;
        j.connecte = true;
        this.connexions.set(cid, { role: 'joueur', code, joueurId: j.id });
        this.envoyer(cid, 'joueur:accepte', { joueurId: j.id, code, nom: j.nom, avatar: j.avatar });
        this.diffuserEtat(salle);
        this.replacerJoueur(salle, j);
        return;
      }

      // ─── Cas 2 : un nouveau venu ───
      if (salle.joueurs.size >= this.maxJoueurs) {
        return this.envoyer(cid, 'erreur', { message: 'La table est complète : ' + this.maxJoueurs + ' joueurs maximum.' });
      }
      let nom = outils.nettoyer(d.nom, 16);
      if (!nom) return this.envoyer(cid, 'erreur', { message: 'Indique ton prénom ou un surnom pour jouer.' });
      // Deux « Marie » à la même table ? La seconde devient « Marie 2 ».
      const noms = new Set(Array.from(salle.joueurs.values()).map((x) => x.nom.toLowerCase()));
      if (noms.has(nom.toLowerCase())) {
        let n = 2;
        while (noms.has((nom + ' ' + n).toLowerCase())) n++;
        nom = nom + ' ' + n;
      }
      j = {
        id: outils.identifiant('j'), nom,
        avatar: AVATARS.includes(d.avatar) ? d.avatar : AVATARS[salle.joueurs.size % AVATARS.length],
        score: 0, connecte: true, connexionId: cid, dernierEcran: null, derniereReaction: 0,
        // Un retardataire reçoit lui aussi son gage secret.
        gage: salle.gagesDistribues ? this.tirerGage(salle) : null
      };
      salle.joueurs.set(j.id, j);
      this.connexions.set(cid, { role: 'joueur', code, joueurId: j.id });
      this.envoyer(cid, 'joueur:accepte', { joueurId: j.id, code, nom: j.nom, avatar: j.avatar });
      this.diffuserEtat(salle);
      this.replacerJoueur(salle, j);
    }

    /* Montrer au joueur l'écran qui correspond à ce qui se passe à la table. */
    replacerJoueur(salle, j) {
      if (salle.etat === 'salon') return this.ecranJoueur(salle, j.id, 'salon', {});
      if (salle.etat === 'jeu' && salle.jeu) {
        const avant = j.dernierEcran;
        j.dernierEcran = null;
        salle.jeu.joueurArrive(j.id);
        if (j.dernierEcran) return; // le jeu lui a donné un écran : parfait
        j.dernierEcran = avant;
      }
      if (j.dernierEcran) return this.envoyer(j.connexionId, 'ecran', Object.assign({ horloge: Date.now() }, j.dernierEcran));
      this.ecranJoueur(salle, j.id, 'info', { titre: 'Bienvenue à table, ' + j.nom + ' !', texte: 'Une manche est en cours. Regarde la tablette : tu entres dans le jeu au prochain tour.', score: j.score });
    }

    /*
     * Les réactions : un joueur envoie un émoji à un autre joueur (ou à
     * toute la table). C'est le lien direct « de joueur à joueur » : on
     * se félicite, on se taquine, et la tablette affiche tout cela en
     * petites bulles qui s'envolent. Une réaction par seconde au maximum,
     * pour éviter les averses d'émojis.
     */
    reaction(salle, deId, d) {
      const de = salle.joueurs.get(deId);
      // Un petit mot écrit, en plus (ou à la place) de l'émoji : 80 caractères au plus, sur une seule ligne.
      const texte = outils.nettoyer(String(d.texte || '').replace(/\s+/g, ' '), 80);
      const emoji = REACTIONS.includes(d.emoji) ? d.emoji : (texte ? '💬' : null);
      if (!de || !emoji || Date.now() - de.derniereReaction < 1000) return;
      de.derniereReaction = Date.now();
      const vers = d.vers && salle.joueurs.get(d.vers);
      const message = { de: { id: de.id, nom: de.nom, avatar: de.avatar }, vers: vers ? { id: vers.id, nom: vers.nom, avatar: vers.avatar } : null, emoji, texte: texte || null };
      if (salle.tabletteId) this.envoyer(salle.tabletteId, 'reaction', message);
      if (vers) { if (vers.connecte) this.envoyer(vers.connexionId, 'reaction', message); }
      else salle.joueurs.forEach((x) => { if (x.connecte && x.id !== de.id) this.envoyer(x.connexionId, 'reaction', message); });
    }

    /* ═══════════ L'enchaînement des jeux ═══════════ */

    jeuSuivant(salle) {
      this.arreterJeu(salle);
      salle.index++;
      if (salle.index >= salle.programme.length) return this.finDePartie(salle);
      const fiche = JEUX[salle.programme[salle.index]].fiche;
      salle.etat = 'intro';
      // La dernière manche d'une partie qui en compte au moins deux est la Grande Finale.
      const finale = this.estFinale(salle, salle.index);
      salle.multiplicateur = finale ? MULTIPLICATEUR_FINALE : 1;
      salle.defis = this.preparerDefis(salle);
      salle.inattendu = this.tirerInattendu(salle);
      const finA = Date.now() + this.introMs;
      const commun = {
        fiche, numero: salle.index + 1, total: salle.mode === 'surprise' ? null : salle.programme.length,
        surprise: salle.mode === 'surprise', objectif: salle.objectif,
        finale, multiplicateur: salle.multiplicateur, prime: PRIME_DEFI * salle.multiplicateur,
        inattendu: salle.inattendu
      };
      this.ecranTablette(salle, 'intro', Object.assign({}, commun, { finA, dureeMs: this.introMs, defis: Array.from(salle.defis.values()) }));
      salle.joueurs.forEach((j) => this.ecranJoueur(salle, j.id, 'intro', Object.assign({}, commun, {
        defi: salle.defis.get(j.id) || null, gage: j.gage || null, premiereManche: salle.index === 0,
        // « moi » : le défi inattendu me concerne-t-il ? (désigné, ou adversaire du duel)
        inattenduPourMoi: salle.inattendu && (salle.inattendu.joueur.id === j.id || (salle.inattendu.adversaire && salle.inattendu.adversaire.id === j.id)) ? true : false
      })));
      if (salle.inattendu) {
        const ids = [salle.inattendu.joueur.id].concat(salle.inattendu.adversaire ? [salle.inattendu.adversaire.id] : []);
        ids.forEach((id) => salle.ctx.evenementJoueur(id, 'inattendu', salle.inattendu));
      }
      this.diffuserEtat(salle);
      salle.minuteurIntro = setTimeout(() => this.demarrerJeu(salle), this.introMs);
    }

    demarrerJeu(salle) {
      clearTimeout(salle.minuteurIntro);
      if (salle.etat !== 'intro') return;
      const Classe = JEUX[salle.programme[salle.index]];
      salle.etat = 'jeu';
      salle.joueurs.forEach((j) => { j.scoreAvant = j.score; });
      salle.jeu = new Classe(salle.ctx);
      salle.jeu.demarrer();
      this.diffuserEtat(salle);
    }

    estFinale(salle, index) {
      return salle.finaleIndex !== null && salle.finaleIndex !== undefined && index === salle.finaleIndex;
    }

    /*
     * La fabrique des défis. On range les joueurs du meilleur score au
     * moins bon, puis on donne à chacun sa mission :
     *   « depasser » : doubler le joueur le plus proche devant soi ;
     *   « couronne » : rester (ou devenir) seul en tête ;
     *   « manche »   : quand tout le monde est à égalité, finir dans la
     *                  moitié haute des scores de la manche.
     * Le texte du défi est préparé ici, pour que téléphones et tablette
     * affichent exactement la même phrase.
     */
    preparerDefis(salle) {
      const defis = new Map();
      const presents = this.joueursPresents(salle);
      if (presents.length < 2) return defis;
      const tousEgaux = presents.every((j) => j.score === presents[0].score);
      const rangVise = Math.max(1, Math.floor(presents.length / 2));
      presents.forEach((j) => {
        let defi;
        if (tousEgaux) {
          defi = { type: 'manche', rangVise, texte: rangVise === 1 ? 'Fais le meilleur score de cette manche !' : 'Termine dans les ' + rangVise + ' meilleurs de cette manche !' };
        } else {
          // Le plus proche devant moi : le plus petit score qui reste strictement supérieur au mien.
          const devant = presents.filter((x) => x.score > j.score).sort((a, b) => a.score - b.score)[0];
          if (devant) {
            const ecart = devant.score - j.score;
            defi = { type: 'depasser', cibleId: devant.id, cibleNom: devant.nom, cibleAvatar: devant.avatar, ecart, texte: 'Dépasse ' + devant.avatar + ' ' + devant.nom + ' : ' + ecart + ' points d\'écart !' };
          } else {
            const exAequo = presents.some((x) => x.id !== j.id && x.score === j.score);
            defi = { type: 'couronne', texte: exAequo ? 'Prends seul·e la tête de la table !' : 'Défends ta couronne : reste en tête !' };
          }
        }
        defis.set(j.id, Object.assign({ joueurId: j.id, nom: j.nom, avatar: j.avatar, enAvance: false }, defi));
      });
      return defis;
    }

    /*
     * Pendant le jeu, après chaque gain de points, on regarde qui vient
     * de passer devant sa cible (ou de se faire rattraper). On attend un
     * court instant avant de vérifier : quand un quiz distribue les points
     * de toute la table d'un coup, on ne veut annoncer que le résultat
     * final, pas une cascade de dépassements qui s'annulent.
     */
    prevoirVerificationDefis(salle) {
      if (salle.verificationPrevue || salle.etat !== 'jeu') return;
      salle.verificationPrevue = true;
      setTimeout(() => { salle.verificationPrevue = false; if (salle.etat === 'jeu') this.verifierDefis(salle); }, 50);
    }

    verifierDefis(salle) {
      salle.defis.forEach((defi) => {
        if (defi.type !== 'depasser') return;
        const j = salle.joueurs.get(defi.joueurId);
        const cible = salle.joueurs.get(defi.cibleId);
        if (!j || !cible) return;
        const devant = j.score > cible.score;
        if (devant === defi.enAvance) return;
        defi.enAvance = devant;
        const ctx = salle.ctx;
        if (devant) {
          ctx.evenementJoueur(j.id, 'cible-depassee', { cibleNom: cible.nom, cibleAvatar: cible.avatar });
          ctx.evenementJoueur(cible.id, 'depasse-par', { nom: j.nom, avatar: j.avatar });
          ctx.evenementTablette('cible-depassee', { nom: j.nom, avatar: j.avatar, cibleNom: cible.nom, cibleAvatar: cible.avatar });
        } else {
          ctx.evenementJoueur(j.id, 'cible-reprise', { cibleNom: cible.nom, cibleAvatar: cible.avatar });
        }
      });
    }

    /*
     * À la fin de la manche, on juge chaque défi et on verse les primes
     * (doublées en finale). Le résultat part avec le classement.
     */
    jugerDefis(salle) {
      const resultats = new Map();
      const presents = this.joueursPresents(salle);
      const gain = (j) => j.score - (j.scoreAvant || 0);
      const prime = PRIME_DEFI * salle.multiplicateur;
      salle.defis.forEach((defi) => {
        const j = salle.joueurs.get(defi.joueurId);
        if (!j) return;
        let reussi = false;
        if (defi.type === 'depasser') {
          const cible = salle.joueurs.get(defi.cibleId);
          reussi = !!cible && j.score > cible.score;
        } else if (defi.type === 'couronne') {
          reussi = presents.every((x) => x.id === j.id || x.score < j.score);
        } else if (defi.type === 'manche') {
          const devant = presents.filter((x) => gain(x) > gain(j)).length;
          reussi = gain(j) > 0 && devant < defi.rangVise;
        }
        if (reussi) j.defisReussis = (j.defisReussis || 0) + 1;
        resultats.set(j.id, { joueurId: j.id, nom: j.nom, avatar: j.avatar, texte: defi.texte, reussi, prime: reussi ? prime : 0 });
      });
      // Les primes sont versées après le jugement de tous, pour que l'ordre n'avantage personne.
      resultats.forEach((r) => { if (r.reussi) salle.joueurs.get(r.joueurId).score += r.prime; });
      salle.defis = new Map();
      return resultats;
    }

    /* ═══════════ Le tribunal des gages ═══════════ */

    gagesEnAttente(salle) {
      return !salle.gagesJuges && this.joueursPresents(salle).filter((j) => j.gage).length >= 2;
    }

    /* Après la dernière manche : le tribunal des gages s'il y a lieu, sinon directement le podium. */
    finDePartie(salle) {
      this.arreterJeu(salle);
      if (!this.gagesEnAttente(salle)) return this.podium(salle);
      salle.etat = 'gages';
      salle.multiplicateur = 1;
      salle.fileGages = outils.melanger(this.joueursPresents(salle).filter((j) => j.gage).map((j) => j.id));
      salle.indexGage = -1;
      this.gageSuivant(salle);
    }

    /* On révèle le gage suivant ; tous les autres votent. */
    gageSuivant(salle) {
      clearTimeout(salle.minuteurGage);
      salle.indexGage++;
      if (salle.indexGage >= salle.fileGages.length) return this.podium(salle);
      const accuse = salle.joueurs.get(salle.fileGages[salle.indexGage]);
      if (!accuse) return this.gageSuivant(salle);
      salle.phaseGage = 'vote';
      salle.votes = new Map();
      const votants = this.joueursPresents(salle).filter((j) => j.id !== accuse.id);
      const finA = Date.now() + this.voteMs;
      const commun = { accuse: { id: accuse.id, nom: accuse.nom, avatar: accuse.avatar }, gage: accuse.gage, numero: salle.indexGage + 1, total: salle.fileGages.length, finA, dureeMs: this.voteMs, prime: PRIME_GAGE };
      this.ecranTablette(salle, 'gages-vote', Object.assign({}, commun, { nbVotes: 0, nbVotants: votants.length }));
      this.joueursPresents(salle).forEach((j) => this.ecranJoueur(salle, j.id, j.id === accuse.id ? 'gage-accuse' : 'gage-vote', commun));
      this.diffuserEtat(salle);
      salle.minuteurGage = setTimeout(() => this.jugerGage(salle), this.voteMs + 200);
    }

    voterGage(salle, joueurId, d) {
      if (salle.phaseGage !== 'vote' || !d || d.type !== 'vote') return;
      const accuseId = salle.fileGages[salle.indexGage];
      if (joueurId === accuseId || salle.votes.has(joueurId)) return;
      salle.votes.set(joueurId, !!d.reussi);
      this.ecranJoueur(salle, joueurId, 'info', { titre: 'A voté ! 🗳️', texte: 'Le verdict tombe dans un instant… Regarde la tablette.' });
      const votants = this.joueursPresents(salle).filter((j) => j.id !== accuseId).length;
      if (salle.tabletteId) this.envoyer(salle.tabletteId, 'evenement', { type: 'vote-gage', donnees: { nbVotes: salle.votes.size, nbVotants: votants } });
      if (salle.votes.size >= votants) { clearTimeout(salle.minuteurGage); salle.minuteurGage = setTimeout(() => this.jugerGage(salle), 600); }
    }

    /* Le verdict : majorité de « réussi » → la prime, et le classement bouge sous les yeux de tous. */
    jugerGage(salle) {
      if (salle.etat !== 'gages' || salle.phaseGage !== 'vote') return;
      clearTimeout(salle.minuteurGage);
      salle.phaseGage = 'verdict';
      const accuse = salle.joueurs.get(salle.fileGages[salle.indexGage]);
      const votes = Array.from(salle.votes.values());
      const oui = votes.filter(Boolean).length, non = votes.length - oui;
      const reussi = !!accuse && oui > non;
      const rangAvant = accuse ? this.classement(salle).findIndex((c) => c.id === accuse.id) + 1 : 0;
      if (reussi) { accuse.score += PRIME_GAGE; accuse.gageReussi = true; accuse.gageOui = oui; }
      const classement = this.classement(salle);
      const rangApres = accuse ? classement.findIndex((c) => c.id === accuse.id) + 1 : 0;
      const dernier = salle.indexGage + 1 >= salle.fileGages.length;
      this.ecranTablette(salle, 'gages-verdict', {
        accuse: accuse ? { id: accuse.id, nom: accuse.nom, avatar: accuse.avatar } : null, gage: accuse ? accuse.gage : '',
        reussi, oui, non, prime: PRIME_GAGE, classement, rangAvant, rangApres, dernier, numero: salle.indexGage + 1, total: salle.fileGages.length
      });
      this.joueursPresents(salle).forEach((j) => {
        if (accuse && j.id === accuse.id) this.ecranJoueur(salle, j.id, 'info', reussi
          ? { titre: '🎉 Gage validé ! +' + PRIME_GAGE, texte: rangApres < rangAvant ? 'Tu passes ' + (rangApres === 1 ? '1er' : rangApres + 'e') + ' ! Quel agent secret…' : 'La table a reconnu ton talent.', score: j.score }
          : { titre: '😅 Gage refusé…', texte: oui === non && votes.length ? 'Égalité des votes : le doute ne profite à personne !' : 'La table n\'a rien vu… ou fait semblant.', score: j.score });
        else this.ecranJoueur(salle, j.id, 'info', { titre: reussi ? '✅ Gage réussi pour ' + accuse.avatar + ' ' + accuse.nom : '❌ Gage raté pour ' + (accuse ? accuse.avatar + ' ' + accuse.nom : '…'), texte: oui + ' oui · ' + non + ' non', score: j.score });
      });
      this.diffuserEtat(salle);
      salle.minuteurGage = setTimeout(() => this.gageSuivant(salle), this.verdictMs);
    }

    arreterJeu(salle) {
      clearTimeout(salle.minuteurClassement);
      clearTimeout(salle.minuteurGage);
      clearTimeout(salle.minuteurIntro);
      if (salle.jeu) { salle.jeu.arreter(); salle.jeu = null; }
    }

    classement(salle) {
      return Array.from(salle.joueurs.values())
        .map((j) => ({ id: j.id, nom: j.nom, avatar: j.avatar, score: j.score, gain: j.score - (j.scoreAvant || 0), connecte: j.connecte }))
        .sort((a, b) => b.score - a.score);
    }

    finJeu(salle) {
      this.arreterJeu(salle);
      salle.etat = 'classement';
      const defis = this.jugerDefis(salle);
      const resultatInattendu = this.resoudreInattendu(salle);
      const classement = this.classement(salle);
      // On retient la plus belle manche de chacun, pour les prix du podium.
      classement.forEach((c) => { const j = salle.joueurs.get(c.id); if (j && c.gain > (j.meilleureManche || 0)) j.meilleureManche = c.gain; });

      // Partie surprise : faut-il déclencher la Grande Finale ? Puis on tire le jeu suivant.
      let annonceFinale = null;
      if (salle.mode === 'surprise' && salle.index !== salle.finaleIndex) {
        const manchesJouees = salle.index + 1;
        const tete = classement[0];
        if (tete && tete.score >= salle.objectif && manchesJouees >= MANCHES_AVANT_FINALE) {
          annonceFinale = { type: 'objectif', texte: this.remplir(outils.tirer(COMMENTAIRES.finaleObjectif, 1)[0], this.variables(salle, classement)) };
        } else if (manchesJouees >= MANCHES_MAX - 1) {
          annonceFinale = { type: 'limite', texte: this.remplir(outils.tirer(COMMENTAIRES.finaleLimite, 1)[0], this.variables(salle, classement)) };
        }
        if (annonceFinale) salle.finaleIndex = salle.index + 1;
        salle.programme.push(this.tirerJeu(salle));
      }

      const dernier = salle.index + 1 >= salle.programme.length;
      const prochain = dernier ? null : JEUX[salle.programme[salle.index + 1]].fiche;
      const prochainFinale = !dernier && this.estFinale(salle, salle.index + 1);
      const reussis = Array.from(defis.values()).filter((r) => r.reussi);
      const commentaires = this.commenter(salle, classement);
      const surprise = salle.mode === 'surprise';
      this.ecranTablette(salle, 'classement', {
        classement, numero: salle.index + 1, total: surprise ? null : salle.programme.length, dernier, prochain: surprise ? null : prochain,
        prochainFinale, defisReussis: reussis, nbDefis: defis.size,
        surprise, objectif: salle.objectif, annonceFinale, commentaires,
        tribunal: dernier && this.gagesEnAttente(salle),
        resultatInattendu,
        // L'enchaînement automatique : la suite démarre toute seule à cette heure-là.
        autoFinA: Date.now() + this.classementMs, autoMs: this.classementMs
      });
      const top = classement.slice(0, 3).map((c) => ({ nom: c.nom, avatar: c.avatar, score: c.score }));
      classement.forEach((c, rang) => this.ecranJoueur(salle, c.id, 'classement', {
        top, commentaires, prochainNom: prochain && !surprise ? prochain.icone + ' ' + prochain.nom : null,
        rang: rang + 1, score: c.score, gain: c.gain, nbJoueurs: classement.length, defi: defis.get(c.id) || null, prochainFinale,
        objectif: salle.objectif, annonceFinale: annonceFinale ? annonceFinale.texte : null,
        gage: (salle.joueurs.get(c.id) || {}).gage || null,
        resultatInattendu: resultatInattendu && resultatInattendu.concerne.includes(c.id) ? resultatInattendu : null
      }));
      this.diffuserEtat(salle);
      salle.enPause = false;
      salle.minuteurClassement = setTimeout(() => { if (salle.etat === 'classement') this.jeuSuivant(salle); }, this.classementMs);
    }

    /* L'animateur veut souffler : le classement reste affiché jusqu'à ce qu'il touche « suivant ». */
    /*
     * LA VRAIE PAUSE ⏸ : le jeu en cours se fige (voir Jeu.figer), tout
     * comme l'attente de l'intro ou du classement. À la reprise, chaque
     * écran est renvoyé avec son compte à rebours décalé de la durée de
     * la pause : le joueur retrouve exactement le temps qu'il lui restait.
     */
    figer(salle) {
      if (salle.figeA || !['intro', 'jeu', 'classement'].includes(salle.etat)) return;
      salle.figeA = Date.now();
      clearTimeout(salle.minuteurIntro);
      clearTimeout(salle.minuteurClassement);
      if (salle.etat === 'jeu' && salle.jeu && salle.jeu.figer) salle.jeu.figer();
      if (salle.tabletteId) this.envoyer(salle.tabletteId, 'evenement', { type: 'fige', donnees: {} });
      salle.joueurs.forEach((j) => salle.ctx.evenementJoueur(j.id, 'fige', {}));
    }

    relancer(salle) {
      if (!salle.figeA) return;
      const duree = Date.now() - salle.figeA;
      salle.figeA = null;
      if (salle.etat === 'jeu' && salle.jeu && salle.jeu.relancer) salle.jeu.relancer(duree);
      if (salle.etat === 'intro') salle.minuteurIntro = setTimeout(() => this.demarrerJeu(salle), this.introMs);
      if (salle.etat === 'classement' && !salle.enPause) salle.minuteurClassement = setTimeout(() => { if (salle.etat === 'classement') this.jeuSuivant(salle); }, this.classementMs);
      // Les écrans gardés en mémoire : on décale leurs heures de fin, et on les renvoie.
      const decaler = (ecran) => {
        if (!ecran || !ecran.donnees) return;
        ['finA', 'autoFinA', 'debut'].forEach((cle) => { if (typeof ecran.donnees[cle] === 'number') ecran.donnees[cle] += duree; });
      };
      decaler(salle.dernierEcranTablette);
      if (salle.etat === 'intro' && salle.dernierEcranTablette && salle.dernierEcranTablette.donnees) salle.dernierEcranTablette.donnees.finA = Date.now() + this.introMs;
      if (salle.dernierEcranTablette && salle.tabletteId) this.envoyer(salle.tabletteId, 'ecran', Object.assign({ horloge: Date.now() }, salle.dernierEcranTablette));
      salle.joueurs.forEach((j) => {
        decaler(j.dernierEcran);
        if (j.dernierEcran && j.connecte) this.envoyer(j.connexionId, 'ecran', Object.assign({ horloge: Date.now() }, j.dernierEcran));
        salle.ctx.evenementJoueur(j.id, 'reprise', {});
      });
      if (salle.tabletteId) this.envoyer(salle.tabletteId, 'evenement', { type: 'reprise', donnees: {} });
    }

    mettreEnPause(salle) {
      if (salle.etat !== 'classement') return;
      clearTimeout(salle.minuteurClassement);
      salle.enPause = true;
      if (salle.tabletteId) this.envoyer(salle.tabletteId, 'evenement', { type: 'pause', donnees: {} });
    }

    /* ═══════════ Le défi inattendu 🎰 ═══════════ */

    /* Le sort décide s'il y a un défi inattendu, pour qui, et lequel. */
    tirerInattendu(salle) {
      const presents = this.joueursPresents(salle);
      if (presents.length < 2 || Math.random() >= this.probaInattendu) return null;
      // Jamais deux fois de suite le même joueur désigné.
      const candidats = presents.filter((j) => j.id !== salle.dernierDesigne);
      const elu = outils.tirer(candidats.length ? candidats : presents, 1)[0];
      salle.dernierDesigne = elu.id;
      const type = this.typeInattendu || outils.tirer(TYPES_INATTENDUS, 1)[0];
      const qui = (j) => ({ id: j.id, nom: j.nom, avatar: j.avatar });
      const base = { type, joueur: qui(elu), adversaire: null };
      if (type === 'quitte') return Object.assign(base, { icone: '🎰', titre: 'Quitte ou double !', texte: 'Fais le meilleur score de cette manche et tes points de la manche DOUBLENT. Sinon… tu en perds la moitié !' });
      if (type === 'trefle') return Object.assign(base, { icone: '🍀', titre: 'Trèfle à quatre feuilles !', texte: 'La chance te sourit : tous tes points de cette manche comptent double !' });
      const adversaire = outils.tirer(presents.filter((j) => j.id !== elu.id), 1)[0];
      return Object.assign(base, { icone: '⚔️', titre: 'Duel éclair !', adversaire: qui(adversaire), texte: 'Duel contre ' + adversaire.avatar + ' ' + adversaire.nom + ' : celui qui marque le plus pendant cette manche vole ' + ENJEU_DUEL + ' points à l\'autre !' });
    }

    /* À la fin de la manche : on règle les comptes du défi inattendu. */
    resoudreInattendu(salle) {
      const d = salle.inattendu;
      salle.inattendu = null;
      if (!d) return null;
      const j = salle.joueurs.get(d.joueur.id);
      if (!j) return null;
      const gain = (x) => x.score - (x.scoreAvant || 0);
      const nom = (x) => x.avatar + ' ' + x.nom;
      const r = { icone: d.icone, titre: d.titre, concerne: [j.id], reussi: false, texte: '' };
      if (d.type === 'trefle') {
        r.reussi = gain(j) > 0;
        r.texte = r.reussi ? nom(j) + ' a profité du trèfle : +' + gain(j) + ' points sur la manche !' : 'Même avec un trèfle, ' + nom(j) + ' est resté bredouille… La chance, ça se travaille.';
      } else if (d.type === 'quitte') {
        const g = gain(j);
        const meilleur = this.joueursPresents(salle).every((x) => x.id === j.id || gain(x) < g);
        if (meilleur && g > 0) { j.score += g; r.reussi = true; r.texte = 'DOUBLE ! ' + nom(j) + ' a fait la meilleure manche : +' + g + ' points en bonus !'; }
        else { const perte = Math.min(j.score, Math.floor(Math.max(0, g) / 2)); j.score -= perte; r.texte = 'QUITTE… ' + nom(j) + ' n\'a pas fait la meilleure manche' + (perte ? ' et perd ' + perte + ' points.' : ', mais n\'avait rien à perdre !'); }
      } else if (d.type === 'duel') {
        const a = salle.joueurs.get(d.adversaire && d.adversaire.id);
        if (!a) return null;
        r.concerne.push(a.id);
        const gj = gain(j), ga = gain(a);
        if (gj === ga) r.texte = 'Duel nul entre ' + nom(j) + ' et ' + nom(a) + ' ! Chacun garde ses points… et sa dignité.';
        else {
          const vainqueur = gj > ga ? j : a, vaincu = gj > ga ? a : j;
          const butin = Math.min(ENJEU_DUEL, vaincu.score);
          vaincu.score -= butin; vainqueur.score += butin;
          r.reussi = vainqueur.id === j.id;
          r.vainqueurId = vainqueur.id;
          r.texte = nom(vainqueur) + ' remporte le duel et vole ' + butin + ' points à ' + nom(vaincu) + ' !';
        }
      }
      return r;
    }

    /* ═══════════ Le commentateur et les prix (humour garanti) ═══════════ */

    variables(salle, classement) {
      const nom = (c) => (c ? c.avatar + ' ' + c.nom : '');
      const premier = classement[0], deuxieme = classement[1] || classement[0], dernier = classement[classement.length - 1];
      const remonteur = classement.slice().sort((a, b) => b.gain - a.gain)[0];
      const chiffre = (n) => String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return {
        premier: nom(premier), deuxieme: nom(deuxieme), dernier: nom(dernier), remonteur: nom(remonteur),
        ecart: chiffre(premier && deuxieme ? premier.score - deuxieme.score : 0), gain: chiffre(remonteur ? remonteur.gain : 0),
        objectif: chiffre(salle.objectif || 0), reste: chiffre((salle.objectif || 0) - (premier ? premier.score : 0)),
        _premier: premier, _deuxieme: deuxieme, _dernier: dernier, _remonteur: remonteur
      };
    }

    remplir(modele, v) {
      return modele.replace(/\{(\w+)\}/g, (tout, cle) => (v[cle] !== undefined ? v[cle] : tout));
    }

    /*
     * Une ou deux phrases sur la course : d'abord la tête (serrée, large,
     * égalité…), puis selon les cas la ligne d'arrivée qui approche, la
     * plus belle remontée de la manche, ou un mot tendre pour le dernier.
     */
    commenter(salle, classement) {
      if (classement.length < 2) return [];
      const v = this.variables(salle, classement);
      const tirer = (famille) => this.remplir(outils.tirer(COMMENTAIRES[famille], 1)[0], v);
      const ecart = v._premier.score - v._deuxieme.score;
      const phrases = [];
      phrases.push(tirer(ecart === 0 ? 'egalite' : ecart < 600 ? 'serre' : ecart > 3500 ? 'large' : 'tete'));
      const reste = (salle.objectif || 0) - v._premier.score;
      if (salle.mode === 'surprise' && salle.finaleIndex === null && reste > 0 && reste <= 3000) phrases.push(tirer('objectifProche'));
      else if (v._remonteur && v._remonteur.gain > 0 && v._remonteur.id !== v._premier.id && Math.random() < 0.6) phrases.push(tirer('remontee'));
      else if (classement.length >= 3 && v._dernier.id !== v._premier.id) phrases.push(tirer('dernier'));
      return phrases;
    }

    /* Les prix du podium : la plus belle manche, le roi des défis, et un prix tendre pour le dernier. */
    decernerPrix(salle, classement) {
      if (classement.length < 2) return [];
      const joueurs = classement.map((c) => salle.joueurs.get(c.id)).filter(Boolean);
      const qui = (j) => ({ id: j.id, nom: j.nom, avatar: j.avatar });
      const prix = [];
      const feu = joueurs.slice().sort((a, b) => (b.meilleureManche || 0) - (a.meilleureManche || 0))[0];
      if (feu && feu.meilleureManche > 0) prix.push(Object.assign(qui(feu), { icone: '🚀', titre: 'La manche de feu', texte: 'La plus belle manche de la soirée : +' + feu.meilleureManche + ' points.' }));
      const tireur = joueurs.slice().sort((a, b) => (b.defisReussis || 0) - (a.defisReussis || 0))[0];
      if (tireur && tireur.defisReussis > 0) prix.push(Object.assign(qui(tireur), { icone: '🎯', titre: 'Œil de lynx', texte: tireur.defisReussis + ' défi' + (tireur.defisReussis > 1 ? 's' : '') + ' réussi' + (tireur.defisReussis > 1 ? 's' : '') + '. Redoutable.' }));
      const agent = joueurs.filter((j) => j.gageReussi).sort((a, b) => (b.gageOui || 0) - (a.gageOui || 0))[0];
      if (agent) prix.push(Object.assign(qui(agent), { icone: '🤫', titre: 'Agent très secret', texte: 'Gage accompli sous le nez de tout le monde.' }));
      const tortue = joueurs[joueurs.length - 1];
      prix.push(Object.assign(qui(tortue), { icone: '🐢', titre: 'Le prix de la tortue', texte: 'Lentement, mais sûrement… La revanche s\'annonce terrible !' }));
      return prix;
    }

    podium(salle) {
      this.arreterJeu(salle);
      salle.etat = 'podium';
      salle.gagesJuges = true;
      salle.multiplicateur = 1;
      salle.defis = new Map();
      const classement = this.classement(salle);
      const prix = this.decernerPrix(salle, classement);
      this.ecranTablette(salle, 'podium', { classement, prix, objectif: salle.objectif });
      const top = classement.slice(0, 3).map((c) => ({ nom: c.nom, avatar: c.avatar, score: c.score }));
      classement.forEach((c, rang) => this.ecranJoueur(salle, c.id, 'podium', { rang: rang + 1, score: c.score, nbJoueurs: classement.length, prix: prix.filter((x) => x.id === c.id), top, tousLesPrix: prix }));
      this.diffuserEtat(salle);
    }

    /* ═══════════ Le contexte confié aux jeux (voir jeux/base.js) ═══════════ */

    fabriquerContexte(salle) {
      const moteur = this;
      return {
        joueurs: () => moteur.joueursPresents(salle),
        joueur: (id) => salle.joueurs.get(id) || null,
        ecranTablette: (type, donnees) => moteur.ecranTablette(salle, type, donnees),
        ecranJoueur: (id, type, donnees) => moteur.ecranJoueur(salle, id, type, donnees),
        // Deux écritures possibles : (type, donnees) pour tous pareil,
        // ou (joueur → {type, donnees}) pour un écran sur mesure par joueur.
        ecranTousJoueurs: (type, donnees) => moteur.joueursPresents(salle).forEach((j) => {
          if (typeof type === 'function') { const r = type(j); moteur.ecranJoueur(salle, j.id, r.type, r.donnees); }
          else moteur.ecranJoueur(salle, j.id, type, typeof donnees === 'function' ? donnees(j) : donnees);
        }),
        evenementTablette: (type, donnees) => salle.tabletteId && moteur.envoyer(salle.tabletteId, 'evenement', { type, donnees }),
        evenementJoueur: (id, type, donnees) => {
          const j = salle.joueurs.get(id);
          if (j && j.connecte) moteur.envoyer(j.connexionId, 'evenement', { type, donnees });
        },
        // Crédite les points (doublés pendant la Grande Finale) et renvoie
        // le montant réellement crédité, pour que les écrans affichent le bon chiffre.
        ajouterPoints: (id, points) => {
          const j = salle.joueurs.get(id);
          if (!j) return 0;
          // Le trèfle à quatre feuilles double aussi les points de son heureux élu.
          const trefle = salle.inattendu && salle.inattendu.type === 'trefle' && salle.inattendu.joueur.id === id ? 2 : 1;
          let credit = Math.round(points * (salle.multiplicateur || 1) * trefle);
          if (j.score + credit < 0) credit = -j.score; // un score ne descend jamais sous zéro
          j.score += credit;
          moteur.diffuserEtat(salle);
          moteur.prevoirVerificationDefis(salle);
          return credit;
        },
        multiplicateur: () => salle.multiplicateur || 1,
        terminer: () => { if (salle.jeu) moteur.finJeu(salle); }
      };
    }

    /* ═══════════ Les envois ═══════════ */

    joueursPresents(salle) {
      return Array.from(salle.joueurs.values()).filter((j) => j.connecte);
    }

    /*
     * Chaque écran est mémorisé avant d'être envoyé. Ainsi, un appareil
     * qui se reconnecte retrouve exactement ce qu'il affichait. « horloge »
     * permet à l'appareil de corriger un éventuel décalage entre son heure
     * et celle du serveur, pour que les comptes à rebours soient justes.
     */
    ecranTablette(salle, type, donnees) {
      salle.dernierEcranTablette = { type, donnees };
      if (salle.tabletteId) this.envoyer(salle.tabletteId, 'ecran', { type, donnees, horloge: Date.now() });
    }

    ecranJoueur(salle, id, type, donnees) {
      const j = salle.joueurs.get(id);
      if (!j) return;
      j.dernierEcran = { type, donnees };
      if (j.connecte) this.envoyer(j.connexionId, 'ecran', { type, donnees, horloge: Date.now() });
    }

    /* L'état de la salle (joueurs, scores, étape) est envoyé à tout le monde à chaque changement. */
    diffuserEtat(salle) {
      const etat = {
        code: salle.code, etat: salle.etat, minJoueurs: this.minJoueurs, maxJoueurs: this.maxJoueurs,
        joueurs: Array.from(salle.joueurs.values()).map((j) => ({ id: j.id, nom: j.nom, avatar: j.avatar, score: j.score, connecte: j.connecte })),
        programme: salle.programme, index: salle.index, multiplicateur: salle.multiplicateur || 1
      };
      if (salle.tabletteId) this.envoyer(salle.tabletteId, 'salle:etat', etat);
      salle.joueurs.forEach((j) => { if (j.connecte) this.envoyer(j.connexionId, 'salle:etat', etat); });
    }
  }

  Moteur.FICHES = FICHES;
  Moteur.FAMILLES = FAMILLES;
  Moteur.AVATARS = AVATARS;
  Moteur.REACTIONS = REACTIONS;
  Moteur.PRIME_DEFI = PRIME_DEFI;
  Moteur.MULTIPLICATEUR_FINALE = MULTIPLICATEUR_FINALE;
  Moteur.MANCHES_MAX = MANCHES_MAX;
  Moteur.PRIME_GAGE = PRIME_GAGE;
  Moteur.OBJECTIF_MIN = OBJECTIF_MIN;
  Moteur.OBJECTIF_MAX = OBJECTIF_MAX;
  return Moteur;
});
