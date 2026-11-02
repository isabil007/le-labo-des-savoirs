/*
 * ════════════════════════════════════════════════════════════════════
 *  LE JEU SANS SERVEUR — tout tourne dans le téléphone
 * ════════════════════════════════════════════════════════════════════
 *
 *  D'habitude, le téléphone parle au moteur du jeu, installé sur
 *  l'ordinateur, par une « WebSocket ». Ici, il n'y a pas d'ordinateur :
 *  le moteur (le même, mot pour mot) tourne dans la page elle-même.
 *
 *  Pour ne rien changer au reste du jeu, ce fichier remplace la WebSocket
 *  du navigateur par une « fausse ligne » qui, au lieu de partir sur le
 *  réseau, remet directement les messages au moteur de la page, et
 *  inversement. connexion.js, solo.js et joueur.js n'y voient que du feu.
 *
 *  Il doit être chargé APRÈS les fichiers du moteur et AVANT connexion.js.
 *  Le blind test n'est pas proposé ici : il a besoin d'Internet pour
 *  aller chercher les extraits chez Apple.
 *  La mémoire anti-répétition est gardée dans le téléphone (localStorage).
 */
(function () {
  'use strict';
  const M = window.GT.modules;
  const outils = M.outils;

  // Pas de blind test sans le réseau : on le retire du grand mélange.
  const themes = M['jeux/melange'].THEMES;
  for (let i = themes.length - 1; i >= 0; i--) if (themes[i].fiche.id === 'blindtest') themes.splice(i, 1);

  // La mémoire de ce qui a déjà été posé, d'une partie à l'autre.
  const CLE = 'gdn-souvenirs';
  try { const s = localStorage.getItem(CLE); if (s) outils.memoire.importer(JSON.parse(s)); } catch (e) { /* première fois */ }
  setInterval(() => {
    if (!outils.memoire.modifiee()) return;
    try { localStorage.setItem(CLE, JSON.stringify(outils.memoire.exporter())); } catch (e) { /* tant pis */ }
  }, 5000);

  const lignes = new Map(); // identifiant → fausse ligne
  let compteur = 0;

  const moteur = new M.moteur({
    minJoueurs: 1,
    envoyer(id, e, d) {
      const ligne = lignes.get(id);
      // Une copie, comme si le message avait voyagé sur le réseau, remise juste après.
      if (ligne) { const data = JSON.stringify({ e, d }); setTimeout(() => ligne.recevoir(data), 0); }
    }
  });

  class FausseLigne {
    constructor() {
      this.id = 'l' + (++compteur);
      this.readyState = FausseLigne.CONNECTING;
      this.onopen = this.onmessage = this.onclose = this.onerror = null;
      lignes.set(this.id, this);
      setTimeout(() => {
        this.readyState = FausseLigne.OPEN;
        if (this.onopen) this.onopen({});
      }, 0);
    }
    send(brut) {
      if (this.readyState !== FausseLigne.OPEN) return;
      let m;
      try { m = JSON.parse(brut); } catch (e) { return; }
      if (!m || !m.e) return;
      if (m.e === 'ping') return this.recevoir(JSON.stringify({ e: 'pong', d: {} }));
      moteur.recevoir(this.id, m.e, m.d);
    }
    recevoir(data) { if (this.readyState === FausseLigne.OPEN && this.onmessage) this.onmessage({ data }); }
    close() {
      if (this.readyState === FausseLigne.CLOSED) return;
      this.readyState = FausseLigne.CLOSED;
      lignes.delete(this.id);
      moteur.deconnexion(this.id);
    }
  }
  FausseLigne.CONNECTING = 0; FausseLigne.OPEN = 1; FausseLigne.CLOSING = 2; FausseLigne.CLOSED = 3;

  window.WebSocket = FausseLigne;
  window.GT.sansServeur = true;
})();
