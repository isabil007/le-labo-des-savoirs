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
 *  sans écran qui répondent au hasard, proposent des mots farfelus,
 *  griffonnent quand vient leur tour de dessiner et cherchent les
 *  7 erreurs (ils trichent un peu : ils comparent les deux images).
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
  const NOMS_ROBOTS = ['Robot Mamie', 'Robot Papy', 'Robot Tonton', 'Robot Léa', 'Robot Hugo', 'Robot Jeanne', 'Robot Malik', 'Robot Inès', 'Robot Louise', 'Robot Arthur', 'Robot Zoé'];

  const destinataires = new Map(); // identifiant de connexion → fonction qui remet le message
  let numero = 0;
  let codeSalle = null;
  let idTablette = null;

  /* Le facteur du moteur. On attend un instant avant de remettre le message, comme sur un vrai réseau. */
  const moteur = new GT.Moteur({
    minJoueurs: 1,
    maxJoueurs: 12,
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

  const BETISES = ['un chat ?', 'une patate', 'la tour Eiffel', 'Tonton Michel', 'un nuage', 'une gaufre', 'un dinosaure', 'mon dentiste', 'une chaussette', 'le Manneken-Pis'];
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
        // Les Fous Rires : le robot pioche un joker pour écrire, puis vote au hasard.
        case 'rire-ecrire':
          plusTard(hasard(4000, 20000), () => robot.ligne.emit('joueur:action', { type: 'ecrit', texte: x.jokers[hasard(0, x.jokers.length - 1)] }));
          break;
        case 'rire-voter':
          plusTard(hasard(2000, 10000), () => robot.ligne.emit('joueur:action', { type: 'vote', option: x.reponses[hasard(0, x.reponses.length - 1)].id }));
          break;
        // Feu vert : le robot tape après un délai au hasard… parfois trop tôt (faux départ !), parfois trop tard.
        case 'reflexe-bouton':
          plusTard(hasard(2500, 7500), () => robot.ligne.emit('joueur:action', { type: 'tape', reflexe: hasard(220, 650) }));
          break;
        // Au tribunal des gages, les robots votent au hasard (un peu plus souvent « réussi », ils sont bons joueurs).
        case 'gage-vote':
          plusTard(hasard(1500, 8000), () => robot.ligne.emit('joueur:action', { type: 'vote', reussi: Math.random() < 0.6 }));
          break;
        case 'dessin-devineur':
          for (let k = 0; k < 3; k++) plusTard(hasard(4000, 50000), () => robot.ligne.emit('joueur:action', { type: 'proposition', texte: BETISES[hasard(0, BETISES.length - 1)] }));
          break;
        case 'dessin-dessinateur': {
          // Il griffonne quelques spirales colorées, point par point.
          const couleurs = ['#E4572E', '#2C6E8F', '#3BA55C', '#9B8CFF'];
          for (let s = 0; s < 4; s++) {
            const id = 'r' + s + Date.now();
            const cx = 0.25 + Math.random() * 0.5, cy = 0.25 + Math.random() * 0.5;
            for (let paquet = 0; paquet < 6; paquet++) {
              plusTard(1500 + s * 2500 + paquet * 120, () => {
                const points = [];
                for (let i = 0; i < 6; i++) {
                  const a = (paquet * 6 + i) / 5;
                  const r = 0.02 + a * 0.012;
                  points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
                }
                robot.ligne.emit('joueur:action', { type: 'trait', id, couleur: couleurs[s], taille: 7, points });
              });
            }
          }
          break;
        }
        case 'erreurs-jeu': {
          // Il compare les deux images pour repérer les objets modifiés… puis vise plus ou moins bien.
          const modifiee = new Map(x.modifiee.map((o) => [o.id, o]));
          const cibles = x.originale.filter((o) => { const m = modifiee.get(o.id); return !m || m.type !== o.type || m.c !== o.c || m.t !== o.t; });
          const deja = new Set((x.trouvees || []).map((t) => t.id));
          const aViser = cibles.filter((o) => !deja.has(o.id));
          let delai = 0;
          aViser.forEach((o) => {
            delai += hasard(3500, 9000);
            plusTard(delai, () => {
              const vise = Math.random() < 0.75;
              robot.ligne.emit('joueur:action', { type: 'touche', x: vise ? o.x + hasard(-6, 6) : hasard(10, 390), y: vise ? o.y + hasard(-6, 6) : hasard(10, 290) });
            });
          });
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
