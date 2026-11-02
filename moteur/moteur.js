/*
 * ════════════════════════════════════════════════════════════════════
 *  LE LABO DES SAVOIRS — Le moteur de jeu (le « chef d'orchestre »)
 *  (même architecture que La Grande Tablée, adaptée au VIH et aux IST)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Ce fichier est le cœur de l'application. Il ne dessine rien et ne
 *  sait même pas s'il parle à une tablette, à un iPhone ou à un Samsung :
 *  il reçoit des messages (« Léa veut rejoindre la salle BRIK », « la
 *  tablette lance la partie », « Papy a répondu B »…) et il en envoie
 *  (« voici l'écran à afficher », « voici le nouveau classement »…).
 *
 *  Cette indifférence est voulue. Elle permet au même moteur de tourner :
 *    • sur le serveur Node.js, qui le relie aux appareils par une WebSocket
 *      (c'est le fichier serveur.js) ;
 *    • dans le navigateur, pour le simulateur, qui le relie à des écrans
 *      factices posés côte à côte (c'est js/simulateur.js).
 *  Il suffit de lui fournir une fonction « envoyer(connexion, evenement,
 *  donnees) » qui sait acheminer un message vers un appareil.
 *
 *  LES SALLES
 *  ──────────
 *  Une « salle », c'est une table de jeu : une tablette, de 2 à 30
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
 *                   et le corrigé de toutes les questions posées
 *
 *  LE PIMENT
 *  ─────────
 *    • La Cible 🎯 : avant chaque jeu, chaque joueur reçoit un défi
 *      personnel sur son téléphone (défendre sa première place, dépasser
 *      le joueur juste devant, ou finir dans la première moitié de la
 *      manche). Défi réussi : +300 points. Les dépassements sont annoncés
 *      en direct.
 *    • La Grande Finale ⚡ : le dernier jeu compte double, primes de défi
 *      comprises. Tout peut encore basculer.
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

  /*
   * Les quatre familles de jeux, comme les quatre mots du titre.
   * Chaque jeu appartient à une famille ; l'animateur peut composer une
   * séance par famille ou piocher dans chacune. Le dernier jeu choisi
   * devient la Grande Finale.
   */
  // L'ordre suit une séance : on s'échauffe (idées reçues), on comprend, on remonte le temps, on agit.
  const CATEGORIES = [
    { id: 'vihgilance', nom: 'VIH’GILANCE', sous: 'Rester vigilant : idées reçues et chiffres', jeux: ['thermometre', 'vrai-faux', 'chiffres'] },
    { id: 'sexplique', nom: 'SEX’PLIQUE', sous: 'Comprendre : le savoir théorique', jeux: ['vih', 'bacteries', 'hepatites', 'hpv', 'marche', 'ordre'] },
    { id: 'istory', nom: 'IST’ORY', sous: 'Raconter : l\'histoire des IST', jeux: ['histoire', 'frise'] },
    { id: 'sexact', nom: 'SEX’ACT', sous: 'Agir : la pratique professionnelle', jeux: ['risque', 'consultation', 'feu', 'orientation', 'betisier'] },
    { id: 'alea', nom: 'ALÉATOIRE 🎲', sous: 'Toutes les familles mélangées, question après question', jeux: ['tourbillon'] }
  ];
  /* La partie aléatoire : trois manches du Tourbillon, la dernière en Grande Finale. */
  const PARTIE_ALEATOIRE = ['tourbillon', 'tourbillon', 'tourbillon'];
  /* Ceux qui sont cochés à l'ouverture : un ou deux par famille (environ 45 minutes), l'humour en finale. */
  const PAR_DEFAUT = ['thermometre', 'vih', 'marche', 'ordre', 'histoire', 'feu', 'orientation', 'betisier'];
  const JEUX = {};
  [].concat(exiger('./jeux/quiz'), exiger('./jeux/ordre')).forEach((Classe) => { JEUX[Classe.fiche.id] = Classe; });
  const FAMILLE = {};
  CATEGORIES.forEach((c) => c.jeux.forEach((id) => { FAMILLE[id] = c; }));
  /* Le programme suit l'ordre des familles ; l'humour reste toujours en dernier. */
  const ORDRE = [].concat(...CATEGORIES.map((c) => c.jeux)).filter((id) => id !== 'betisier').concat(['betisier']);
  const FICHES = ORDRE.filter((id) => JEUX[id]).map((id) => Object.assign({
    parDefaut: PAR_DEFAUT.includes(id), categorie: FAMILLE[id].id, categorieNom: FAMILLE[id].nom
  }, JEUX[id].fiche));
  const CATS = CATEGORIES.map((c) => ({ id: c.id, nom: c.nom, sous: c.sous }));

  /* La prime d'un défi réussi (doublée pendant la Grande Finale). */
  const PRIME_DEFI = 300;

  /* Les avatars et réactions autorisés (une liste fermée : on n'affiche jamais n'importe quoi). */
  const AVATARS = ['🦊', '🐻', '🐼', '🐸', '🦉', '🐙', '🦁', '🐯', '🐨', '🐵', '🐧', '🦄', '🐢', '🐝', '🦔', '🐳'];
  const REACTIONS = ['👏', '😂', '😮', '❤️', '🔥', '🤔', '😜', '🏆'];

  class Moteur {
    /*
     * options.envoyer(connexionId, evenement, donnees) : obligatoire, c'est le « facteur ».
     * options.minJoueurs / maxJoueurs : 2 et 100 par défaut (version compétition).
     * options.introMs : la durée de l'écran de présentation de chaque jeu.
     */
    constructor(options) {
      this.envoyer = options.envoyer;
      this.minJoueurs = options.minJoueurs || 2;
      this.maxJoueurs = options.maxJoueurs || 100;
      this.introMs = options.introMs || 7000;
      // Mode solo : pas de défis (on joue contre soi-même) et on avance à son rythme, au bouton.
      this.manuel = !!options.manuel;
      this.sansDefis = !!options.sansDefis;
      this.facteurTemps = options.facteurTemps || 1;   // plusieurs joueurs sur un même appareil : plus de temps
      this.sansVitesse = !!options.sansVitesse;        // … et pas de bonus de vitesse
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
          switch (evenement) {
            case 'tablette:lancer': return this.lancerPartie(salle, d.programme, cid);
            case 'tablette:passer': return this.passer(salle);
            case 'tablette:terminer-jeu': return salle.jeu && this.finJeu(salle);
            case 'tablette:podium': return this.podium(salle);
            case 'tablette:nouvelle': return this.nouvellePartie(salle);
            case 'tablette:retirer': return this.retirerJoueur(salle, d.joueurId);
          }
        } else if (cnx.role === 'joueur') {
          switch (evenement) {
            case 'joueur:action':
              if (salle.etat === 'jeu' && salle.jeu) salle.jeu.action(cnx.joueurId, d);
              return;
            case 'joueur:reaction': return this.reaction(salle, cnx.joueurId, d);
          }
        }
      } catch (erreur) {
        // Une erreur dans un jeu ne doit jamais faire tomber toute la soirée.
        console.error('[Le labo des savoirs] Erreur sur « ' + evenement + ' » :', erreur);
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
          clearTimeout(salle.diffusionPrevue);
          this.salles.delete(code);
        }
      });
    }

    /* La salle ouverte le plus récemment (pour le QR code fixe /jouer), de préférence encore au salon. */
    salleRecente() {
      let meilleure = null;
      this.salles.forEach((s) => {
        const rang = (s.etat === 'salon' ? 1e15 : 0) + (s.creeeLe || 0);
        if (!meilleure || rang > meilleure.rang) meilleure = { code: s.code, rang };
      });
      return meilleure ? meilleure.code : null;
    }

    /* ═══════════ La tablette ═══════════ */

    creerSalle(cid) {
      const code = outils.codeSalle((c) => this.salles.has(c));
      const salle = {
        code, tabletteId: cid, joueurs: new Map(), etat: 'salon',
        programme: [], index: -1, jeu: null, dernierEcranTablette: null,
        derniereActivite: Date.now(), creeeLe: Date.now(), minuteurIntro: null,
        finale: false, journal: []
      };
      salle.ctx = this.fabriquerContexte(salle);
      this.salles.set(code, salle);
      this.connexions.set(cid, { role: 'tablette', code });
      this.envoyer(cid, 'salle:creee', { code, jeux: FICHES, categories: CATS, aleatoire: PARTIE_ALEATOIRE, minJoueurs: this.minJoueurs, maxJoueurs: this.maxJoueurs });
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
      this.envoyer(cid, 'salle:creee', { code: salle.code, jeux: FICHES, categories: CATS, aleatoire: PARTIE_ALEATOIRE, minJoueurs: this.minJoueurs, maxJoueurs: this.maxJoueurs, reprise: true });
      this.diffuserEtat(salle);
      if (salle.dernierEcranTablette) this.envoyer(cid, 'ecran', Object.assign({ horloge: Date.now() }, salle.dernierEcranTablette));
    }

    lancerPartie(salle, programme, cid) {
      const presents = this.joueursPresents(salle).length;
      if (presents < this.minJoueurs) {
        return this.envoyer(cid, 'erreur', { message: 'Il faut au moins ' + this.minJoueurs + ' joueurs connectés pour lancer la partie (' + presents + ' pour l\'instant).' });
      }
      const choisis = (Array.isArray(programme) ? programme : []).filter((id) => JEUX[id]);
      salle.programme = choisis.length ? choisis : FICHES.map((f) => f.id);
      salle.index = -1;
      salle.journal = [];
      salle.joueurs.forEach((j) => { j.score = 0; j.erreurs = []; j.defi = null; });
      this.jeuSuivant(salle);
    }

    passer(salle) {
      if (salle.etat === 'intro') this.demarrerJeu(salle);
      else if (salle.etat === 'jeu' && salle.jeu) salle.jeu.passer();
      else if (salle.etat === 'classement') this.jeuSuivant(salle);
    }

    nouvellePartie(salle) {
      this.arreterJeu(salle);
      salle.etat = 'salon';
      salle.index = -1;
      salle.finale = false;
      salle.journal = [];
      salle.joueurs.forEach((j) => { j.score = 0; j.erreurs = []; j.defi = null; });
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
        erreurs: [], defi: null
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
      this.ecranJoueur(salle, j.id, 'info', { titre: 'Bienvenue, ' + j.nom + ' !', texte: 'Une manche est en cours. Regarde la tablette : tu entres dans le jeu au prochain tour.', score: j.score });
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
      if (!de || !REACTIONS.includes(d.emoji) || Date.now() - de.derniereReaction < 1000) return;
      de.derniereReaction = Date.now();
      const vers = d.vers && salle.joueurs.get(d.vers);
      const message = { de: { id: de.id, nom: de.nom, avatar: de.avatar }, vers: vers ? { id: vers.id, nom: vers.nom, avatar: vers.avatar } : null, emoji: d.emoji };
      if (salle.tabletteId) this.envoyer(salle.tabletteId, 'reaction', message);
      if (vers) { if (vers.connecte) this.envoyer(vers.connexionId, 'reaction', message); }
      else salle.joueurs.forEach((x) => { if (x.connecte && x.id !== de.id) this.envoyer(x.connexionId, 'reaction', message); });
    }

    /* ═══════════ L'enchaînement des jeux ═══════════ */

    jeuSuivant(salle) {
      this.arreterJeu(salle);
      salle.index++;
      if (salle.index >= salle.programme.length) return this.podium(salle);
      const fiche = FICHES.find((f) => f.id === salle.programme[salle.index]);
      salle.etat = 'intro';
      salle.finale = salle.programme.length > 1 && salle.index === salle.programme.length - 1;
      this.distribuerDefis(salle);
      const finA = Date.now() + this.introMs;
      const prime = PRIME_DEFI * (salle.finale ? 2 : 1);
      this.ecranTablette(salle, 'intro', { fiche, numero: salle.index + 1, total: salle.programme.length, finA, dureeMs: this.introMs, finale: salle.finale, prime });
      salle.joueurs.forEach((j) => this.ecranJoueur(salle, j.id, 'intro', { fiche, numero: salle.index + 1, total: salle.programme.length, finale: salle.finale, defi: j.defi, prime }));
      this.diffuserEtat(salle);
      if (!this.manuel) salle.minuteurIntro = setTimeout(() => this.demarrerJeu(salle), this.introMs);
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

    arreterJeu(salle) {
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
      const defis = this.evaluerDefis(salle);
      const classement = this.classement(salle);
      const dernier = salle.index + 1 >= salle.programme.length;
      const prochain = dernier ? null : FICHES.find((f) => f.id === salle.programme[salle.index + 1]);
      const prochainFinale = !dernier && salle.programme.length > 1 && salle.index + 1 === salle.programme.length - 1;
      this.ecranTablette(salle, 'classement', { classement, numero: salle.index + 1, total: salle.programme.length, dernier, prochain, prochainFinale, defis: defis.reussis });
      classement.forEach((c, rang) => this.ecranJoueur(salle, c.id, 'classement', {
        rang: rang + 1, score: c.score, gain: c.gain, nbJoueurs: classement.length, defi: defis.parJoueur[c.id] || null, prochainFinale
      }));
      this.diffuserEtat(salle);
    }

    /* ═══════════ La Cible : un défi personnel par joueur et par jeu ═══════════ */

    distribuerDefis(salle) {
      if (this.sansDefis) { salle.joueurs.forEach((j) => { j.defi = null; }); return; }
      const presents = this.joueursPresents(salle);
      const tousAZero = presents.every((j) => j.score === 0);
      const max = Math.max(0, ...presents.map((j) => j.score));
      presents.forEach((j) => {
        if (salle.index === 0 || tousAZero || presents.length < 2) {
          j.defi = { type: 'moitie', texte: 'Finis dans la première moitié de cette manche !' };
          return;
        }
        if (j.score === max) {
          const exAequo = presents.filter((x) => x.score === max).length > 1;
          j.defi = { type: 'couronne', texte: exAequo ? 'Prends seul·e la tête du classement !' : 'Défends ta couronne : reste seul·e en tête !' };
          return;
        }
        // La cible : le joueur juste au-dessus (le plus petit score strictement supérieur au sien).
        const cible = presents.filter((x) => x.score > j.score).sort((a, b) => a.score - b.score)[0];
        j.defi = { type: 'depasser', cibleId: cible.id, texte: 'Dépasse ' + cible.avatar + ' ' + cible.nom + ' : ' + (cible.score - j.score) + ' points d\'écart !', cible: { nom: cible.nom, avatar: cible.avatar } };
      });
      // Un absent n'a pas de défi pour ce jeu.
      salle.joueurs.forEach((j) => { if (!j.connecte) j.defi = null; });
    }

    evaluerDefis(salle) {
      const presents = this.joueursPresents(salle);
      const prime = PRIME_DEFI * (salle.finale ? 2 : 1);
      const parGain = presents.slice().sort((a, b) => (b.score - (b.scoreAvant || 0)) - (a.score - (a.scoreAvant || 0)));
      const moitie = Math.ceil(presents.length / 2);
      const reussis = [];
      const parJoueur = {};
      // On évalue d'abord tous les défis sur les scores du jeu, puis on verse les primes.
      const verdicts = presents.filter((j) => j.defi).map((j) => {
        let ok = false;
        if (j.defi.type === 'moitie') {
          const gain = j.score - (j.scoreAvant || 0);
          ok = gain > 0 && parGain.filter((x) => (x.score - (x.scoreAvant || 0)) > gain).length < moitie;
        } else if (j.defi.type === 'couronne') {
          ok = presents.every((x) => x.id === j.id || x.score < j.score);
        } else if (j.defi.type === 'depasser') {
          const c = salle.joueurs.get(j.defi.cibleId);
          ok = !c || j.score > c.score;
        }
        return { j, ok };
      });
      verdicts.forEach(({ j, ok }) => {
        if (ok) { j.score += prime; reussis.push({ id: j.id, nom: j.nom, avatar: j.avatar, prime }); }
        parJoueur[j.id] = { texte: j.defi.texte, reussi: ok, prime: ok ? prime : 0 };
        j.defi = null;
      });
      return { reussis, parJoueur };
    }

    /* Un dépassement en direct : on prévient celui qui passe devant, celui qui se fait doubler et la tablette. */
    signalerDepassements(salle, j, avant) {
      salle.joueurs.forEach((x) => {
        if (x.id === j.id || !(avant <= x.score && j.score > x.score)) return;
        const visait = j.defi && j.defi.type === 'depasser' && j.defi.cibleId === x.id;
        const couronne = x.defi && x.defi.type === 'couronne';
        if (!visait && !couronne) return;
        const qui = { nom: j.nom, avatar: j.avatar };
        const doublé = { nom: x.nom, avatar: x.avatar };
        if (visait) this.envoyerEvenementJoueur(salle, j, 'depassement', { type: 'cible', autre: doublé });
        this.envoyerEvenementJoueur(salle, x, 'depassement', { type: couronne ? 'couronne' : 'double', autre: qui });
        if (salle.tabletteId) this.envoyer(salle.tabletteId, 'evenement', { type: 'depassement', donnees: { de: qui, vers: doublé } });
      });
    }

    envoyerEvenementJoueur(salle, j, type, donnees) {
      if (j && j.connecte) this.envoyer(j.connexionId, 'evenement', { type, donnees });
    }

    podium(salle) {
      this.arreterJeu(salle);
      salle.etat = 'podium';
      salle.finale = false;
      const classement = this.classement(salle);
      // Le corrigé : toutes les questions posées, des plus ratées aux mieux réussies.
      const corrige = salle.journal.slice().sort((a, b) => (a.reussis / Math.max(1, a.total)) - (b.reussis / Math.max(1, b.total)));
      this.ecranTablette(salle, 'podium', { classement, corrige });
      classement.forEach((c, rang) => {
        const j = salle.joueurs.get(c.id);
        this.ecranJoueur(salle, c.id, 'podium', { rang: rang + 1, score: c.score, nbJoueurs: classement.length, erreurs: (j && j.erreurs) || [], nbQuestions: salle.journal.length });
      });
      this.diffuserEtat(salle);
    }

    /* ═══════════ Le contexte confié aux jeux (voir jeux/base.js) ═══════════ */

    fabriquerContexte(salle) {
      const moteur = this;
      return {
        manuel: moteur.manuel,
        facteurTemps: moteur.facteurTemps,
        sansVitesse: moteur.sansVitesse,
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
        ajouterPoints: (id, points) => {
          const j = salle.joueurs.get(id);
          if (!j) return 0;
          const credit = points * (salle.finale ? 2 : 1);
          const avant = j.score;
          j.score += credit;
          moteur.signalerDepassements(salle, j, avant);
          moteur.diffuserEtat(salle);
          return credit;
        },
        consigner: (fiche) => {
          const jeu = JEUX[salle.programme[salle.index]];
          salle.journal.push(Object.assign({ jeu: jeu ? jeu.fiche.nom : '', icone: jeu ? jeu.fiche.icone : '' }, fiche));
        },
        noterErreur: (id, fiche) => {
          const j = salle.joueurs.get(id);
          if (j) (j.erreurs = j.erreurs || []).push(fiche);
        },
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
    /* L'état (joueurs et scores) part au plus une fois toutes les 150 ms : à 100 joueurs,
       une révélation crédite 100 scores d'un coup, et on n'envoie qu'un seul état à jour. */
    diffuserEtat(salle) {
      if (salle.diffusionPrevue) return;
      salle.diffusionPrevue = setTimeout(() => { salle.diffusionPrevue = null; this.diffuserEtatMaintenant(salle); }, 150);
      if (salle.diffusionPrevue.unref) salle.diffusionPrevue.unref();
    }

    diffuserEtatMaintenant(salle) {
      const etat = {
        code: salle.code, etat: salle.etat, minJoueurs: this.minJoueurs, maxJoueurs: this.maxJoueurs,
        joueurs: Array.from(salle.joueurs.values()).map((j) => ({ id: j.id, nom: j.nom, avatar: j.avatar, score: j.score, connecte: j.connecte })),
        programme: salle.programme, index: salle.index
      };
      if (salle.tabletteId) this.envoyer(salle.tabletteId, 'salle:etat', etat);
      salle.joueurs.forEach((j) => { if (j.connecte) this.envoyer(j.connexionId, 'salle:etat', etat); });
    }
  }

  Moteur.FICHES = FICHES;
  Moteur.CATEGORIES = CATS;
  Moteur.PARTIE_ALEATOIRE = PARTIE_ALEATOIRE;
  Moteur.AVATARS = AVATARS;
  Moteur.REACTIONS = REACTIONS;
  return Moteur;
});
