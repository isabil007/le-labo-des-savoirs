/*
 * ════════════════════════════════════════════════════════════════════
 *  LE SIMULATEUR : toute la table sur un seul écran
 * ════════════════════════════════════════════════════════════════════
 *
 *  Pour essayer le jeu sans réunir douze personnes, le simulateur fait
 *  tourner le moteur directement dans le navigateur et affiche, côte à
 *  côte, la tablette et un ou plusieurs téléphones (chacun dans son
 *  propre cadre, comme s'il s'agissait d'appareils séparés).
 *
 *  Pour compléter la table, on peut ajouter des ROBOTS : de faux joueurs
 *  sans écran qui répondent au hasard (ils n'ont pas révisé !) et
 *  remettent les étapes dans un ordre plus ou moins juste.
 *
 *  LE « BUS »
 *  ──────────
 *  Côté moteur, rien ne change : il reçoit et envoie des messages avec
 *  un identifiant de connexion. Ici, le « facteur » remet ces messages :
 *    • aux cadres (tablette, téléphones) par postMessage ;
 *    • aux robots par un simple appel de fonction.
 */
(function () {
  'use strict';
  const { h } = GT;

  const AVATARS = GT.Moteur.AVATARS;
  const NOMS_ROBOTS = ['Robot Amina', 'Robot Hugo', 'Robot Jeanne', 'Robot Malik', 'Robot Inès', 'Robot Louise', 'Robot Arthur', 'Robot Zoé', 'Robot Yanis', 'Robot Chloé', 'Robot Sacha'];

  const destinataires = new Map(); // identifiant de connexion → fonction qui remet le message
  let numero = 0;
  let codeSalle = null;
  let idTablette = null;

  /* Le facteur du moteur. On attend un instant avant de remettre le message, comme sur un vrai réseau. */
  const moteur = new GT.Moteur({
    minJoueurs: 2,
    maxJoueurs: 30,
    envoyer: (cid, evenement, donnees) => {
      const remettre = destinataires.get(cid);
      if (!remettre) return;
      // Une copie indépendante : comme sur le réseau, l'appareil reçoit une « photo » des données.
      const copie = donnees === undefined ? undefined : JSON.parse(JSON.stringify(donnees));
      if (evenement === 'salle:creee' && cid === idTablette) quandSalleCreee(copie.code);
      setTimeout(() => remettre(evenement, copie), 15);
    }
  });

  function connecterLocal(remettre) {
    const id = 'sim' + (++numero);
    destinataires.set(id, remettre);
    return {
      id,
      emit: (evenement, donnees) => setTimeout(() => moteur.recevoir(id, evenement, donnees === undefined ? {} : JSON.parse(JSON.stringify(donnees))), 15),
      fermer: () => { destinataires.delete(id); moteur.deconnexion(id); }
    };
  }

  /* Les cadres (tablette et téléphones) frappent à la porte par postMessage. */
  const canaux = new Map(); // canal → connexion
  window.addEventListener('message', (ev) => {
    const m = ev.data;
    if (!m || !m.gt || !m.canal) return;
    const source = ev.source;
    if (m.gt === 'connecter') {
      const ancienne = canaux.get(m.canal);
      if (ancienne) ancienne.fermer();
      const cnx = connecterLocal((e, d) => source.postMessage({ gt: 'msg', canal: m.canal, e, d }, '*'));
      cnx.estTablette = source === document.getElementById('cadre-tablette').contentWindow;
      if (cnx.estTablette) idTablette = cnx.id;
      canaux.set(m.canal, cnx);
      source.postMessage({ gt: 'ouverte', canal: m.canal }, '*');
    } else if (m.gt === 'emit') {
      const cnx = canaux.get(m.canal);
      if (cnx) cnx.emit(m.e, m.d);
    } else if (m.gt === 'fermer') {
      const cnx = canaux.get(m.canal);
      if (cnx) { cnx.fermer(); canaux.delete(m.canal); }
    }
  });

  /* ═══════════ Les téléphones « humains » (des cadres que l'on manipule soi-même) ═══════════ */

  const telephones = [];
  let telephoneActif = 0;
  const zoneTelephones = document.getElementById('telephones');
  const onglets = document.getElementById('onglets');

  function ajouterTelephone() {
    if (telephones.length >= 3) return;
    const cadre = h('iframe', { title: 'Téléphone ' + (telephones.length + 1), src: 'joueur.html?sim=1' + (codeSalle ? '&code=' + codeSalle : ''), class: 'appareil-ecran' });
    telephones.push(cadre);
    zoneTelephones.appendChild(cadre);
    telephoneActif = telephones.length - 1;
    majOnglets();
  }

  function majOnglets() {
    telephones.forEach((c, i) => { c.hidden = i !== telephoneActif; });
    onglets.replaceChildren(
      ...telephones.map((c, i) => h('button', { class: 'onglet', 'aria-pressed': String(i === telephoneActif), onclick: () => { telephoneActif = i; majOnglets(); ajusterEchelles(); } }, '📱 Téléphone ' + (i + 1))),
      telephones.length < 3 ? h('button', { class: 'onglet onglet-ajout', onclick: () => { ajouterTelephone(); ajusterEchelles(); } }, '+ Téléphone') : null
    );
  }

  /* ═══════════ Les robots ═══════════ */

  const robots = [];
  const listeRobots = document.getElementById('robots');

  const hasard = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  function ajouterRobot() {
    if (!codeSalle || robots.length >= 11) return;
    const nom = NOMS_ROBOTS[robots.length % NOMS_ROBOTS.length];
    const avatar = AVATARS[(robots.length * 5 + 3) % AVATARS.length];
    let generation = 0; // change à chaque nouvel écran : les tâches d'un écran périmé sont abandonnées
    const robot = { nom, avatar };

    const plusTard = (ms, tache) => { const g = generation; setTimeout(() => { if (g === generation) tache(); }, ms); };

    robot.ligne = connecterLocal((evenement, d) => {
      if (evenement !== 'ecran') return;
      generation++;
      const x = d.donnees;
      switch (d.type) {
        case 'qcm-choix':
          // Il répond au hasard, après un temps de réflexion variable.
          plusTard(hasard(2000, 12000), () => robot.ligne.emit('joueur:action', { type: 'reponse', choix: hasard(0, x.choix.length - 1) }));
          break;
        case 'ordre-choix': {
          // Il remet les étapes dans un ordre au hasard : il n'a pas révisé.
          const ordre = Array.from({ length: x.etapes.length }, (_, k) => k).sort(() => Math.random() - 0.5);
          plusTard(hasard(5000, 30000), () => robot.ligne.emit('joueur:action', { type: 'ordre', ordre }));
          break;
        }
        case 'classement':
          if (Math.random() < 0.4) plusTard(hasard(1000, 4000), () => robot.ligne.emit('joueur:reaction', { vers: null, emoji: ['👏', '😂', '🔥', '😜'][hasard(0, 3)] }));
          break;
      }
    });
    robot.ligne.emit('joueur:rejoindre', { code: codeSalle, nom, avatar });
    robots.push(robot);
    majRobots();
  }

  function retirerRobot(robot) {
    robot.ligne.fermer();
    robots.splice(robots.indexOf(robot), 1);
    majRobots();
  }

  function majRobots() {
    listeRobots.replaceChildren(...robots.map((r) => h('span', { class: 'robot' }, r.avatar + ' ' + r.nom,
      h('button', { 'aria-label': 'Retirer ' + r.nom, onclick: () => retirerRobot(r) }, '✕'))));
    document.getElementById('ajouter-robot').disabled = !codeSalle || robots.length >= 11;
    document.getElementById('completer').disabled = !codeSalle;
  }

  document.getElementById('ajouter-robot').addEventListener('click', ajouterRobot);
  // « Compléter la table » : on ajoute des robots jusqu'à atteindre 4 joueurs en tout.
  document.getElementById('completer').addEventListener('click', () => {
    const salle = moteur.salles.get(codeSalle);
    const presents = salle ? Array.from(salle.joueurs.values()).filter((j) => j.connecte).length : 0;
    for (let i = presents; i < 4; i++) ajouterRobot();
  });

  /* Quand la tablette a ouvert sa salle, on connaît le code : les téléphones peuvent arriver. */
  function quandSalleCreee(code) {
    if (codeSalle === code) return;
    codeSalle = code;
    document.getElementById('code-sim').textContent = code;
    if (!telephones.length) ajouterTelephone();
    majRobots();
  }

  /* ═══════════ La mise à l'échelle des appareils ═══════════ */

  /*
   * La tablette est dessinée à sa taille réelle (1024 × 768 points) puis
   * réduite pour tenir dans la page ; idem pour le téléphone (390 × 780).
   * On voit ainsi exactement ce que verrait un vrai appareil.
   */
  function ajuster(conteneur, largeur, hauteur, hauteurMax) {
    const dispo = conteneur.parentElement.clientWidth - 22; // 22 = le cadre sombre autour de l'écran
    const echelle = Math.min(1, dispo / largeur, hauteurMax ? hauteurMax / hauteur : 1);
    conteneur.style.width = largeur + 'px';
    conteneur.style.height = hauteur + 'px';
    conteneur.style.transform = 'scale(' + echelle + ')';
    conteneur.parentElement.style.height = (hauteur * echelle + 22) + 'px';
  }
  function ajusterEchelles() {
    const hauteurFenetre = window.innerHeight - 40;
    ajuster(document.getElementById('appareil-tablette'), 1024, 768, Math.max(360, hauteurFenetre));
    ajuster(document.getElementById('appareil-telephone'), 390, 780, Math.max(420, hauteurFenetre - 150));
  }
  window.addEventListener('resize', ajusterEchelles);
  if (window.ResizeObserver) new ResizeObserver(ajusterEchelles).observe(document.querySelector('.sim'));
  ajusterEchelles();
  majOnglets();
  majRobots();
})();
