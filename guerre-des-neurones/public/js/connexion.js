/*
 * ════════════════════════════════════════════════════════════════════
 *  LA LIGNE AVEC LE SERVEUR (commune à la tablette et aux téléphones)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Ce petit module ouvre la « ligne » permanente entre l'appareil et le
 *  moteur du jeu, et la maintient en vie. Il offre deux gestes simples :
 *    GT.connexion.emit('joueur:action', {...})   → envoyer un message
 *    GT.connexion.on('ecran', fonction)          → réagir à un message reçu
 *  plus deux signaux internes : « ouverte » (la ligne vient de s'ouvrir
 *  ou de se rétablir) et « fermee » (elle vient de tomber).
 *
 *  DEUX MODES DE FONCTIONNEMENT
 *  ────────────────────────────
 *  • En vrai (serveur Node.js) : une WebSocket vers /ligne. Si le
 *    téléphone se met en veille ou si le Wi-Fi hoquette, on retente
 *    automatiquement, de plus en plus patiemment (1 s, 2 s, … 6 s).
 *    Dès que la ligne revient, la page renvoie d'elle-même « je suis
 *    Léa, de la salle BRIK », et le moteur la remet à sa place.
 *  • Dans le simulateur : la page est affichée dans un cadre, et la
 *    « ligne » est un simple tuyau vers le moteur qui tourne dans la
 *    page parente. Aucun réseau n'est utilisé.
 */
(function () {
  'use strict';
  window.GT = window.GT || {};

  const ecouteurs = {};
  function declencher(evenement, donnees) {
    (ecouteurs[evenement] || []).forEach((f) => {
      try { f(donnees); } catch (e) { console.error('[connexion] ' + evenement, e); }
    });
  }

  const connexion = {
    simulation: false,
    ouverte: false,
    on(evenement, fonction) { (ecouteurs[evenement] = ecouteurs[evenement] || []).push(fonction); },
    emit() {}
  };
  window.GT.connexion = connexion;

  /*
   * ─── Mode simulateur : le moteur vit dans la page parente ───
   * La page est alors ouverte avec « ?sim » dans son adresse, dans un cadre.
   * On parle au moteur par « postMessage », la boîte aux lettres officielle
   * entre une page et les cadres qu'elle contient.
   */
  if (window.parent !== window && new URLSearchParams(location.search).has('sim')) {
    connexion.simulation = true;
    const canal = 'gt-' + Math.random().toString(36).slice(2);
    window.addEventListener('message', (ev) => {
      const m = ev.data;
      if (ev.source !== window.parent || !m || m.canal !== canal) return;
      if (m.gt === 'ouverte') { connexion.ouverte = true; declencher('ouverte'); }
      else if (m.gt === 'msg') declencher(m.e, m.d);
    });
    connexion.emit = (evenement, donnees) => window.parent.postMessage({ gt: 'emit', canal, e: evenement, d: donnees }, '*');
    window.addEventListener('pagehide', () => window.parent.postMessage({ gt: 'fermer', canal }, '*'));
    window.parent.postMessage({ gt: 'connecter', canal }, '*');
    return;
  }

  /* ─── Mode réel : une WebSocket vers le serveur ─── */
  let ws = null;
  let attente = 1000;
  let minuteurReconnexion = null;
  let minuteurPing = null;

  function ouvrir() {
    clearTimeout(minuteurReconnexion);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    const adresse = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ligne';
    ws = new WebSocket(adresse);

    ws.onopen = () => {
      attente = 1000;
      connexion.ouverte = true;
      declencher('ouverte');
      // Un petit « tu es là ? » toutes les 25 secondes empêche certaines box de couper la ligne.
      clearInterval(minuteurPing);
      minuteurPing = setInterval(() => connexion.emit('ping'), 25000);
    };
    ws.onmessage = (m) => {
      let message;
      try { message = JSON.parse(m.data); } catch (e) { return; }
      if (message && message.e) declencher(message.e, message.d);
    };
    ws.onclose = () => {
      clearInterval(minuteurPing);
      if (connexion.ouverte) { connexion.ouverte = false; declencher('fermee'); }
      minuteurReconnexion = setTimeout(ouvrir, attente);
      attente = Math.min(6000, attente * 1.6);
    };
    ws.onerror = () => { try { ws.close(); } catch (e) { /* rien à faire */ } };
  }

  connexion.emit = (evenement, donnees) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ e: evenement, d: donnees }));
  };

  // Quand on rallume l'écran du téléphone, on vérifie aussitôt la ligne au lieu d'attendre.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!ws || ws.readyState !== WebSocket.OPEN)) { attente = 1000; ouvrir(); }
  });

  ouvrir();
})();
