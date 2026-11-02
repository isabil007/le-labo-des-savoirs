/*
 * ════════════════════════════════════════════════════════════════════
 *  LE LABO DES SAVOIRS — Le serveur de jeu
 * ════════════════════════════════════════════════════════════════════
 *
 *  Ce petit programme fait trois choses :
 *    1. il sert les pages du jeu (l'écran de la classe et les téléphones) ;
 *    2. il fait tourner le moteur du jeu (moteur/moteur.js) ;
 *    3. il relie chaque appareil au moteur par une « ligne » permanente
 *       (une WebSocket sur l'adresse /ligne).
 *
 *  Aucune installation de paquet n'est nécessaire : seul Node.js
 *  (version 18 ou plus récente) est requis. La WebSocket est écrite ici
 *  à la main, en quelques dizaines de lignes, selon la norme RFC 6455.
 *
 *  LANCER LE JEU
 *  ─────────────
 *    node serveur.js
 *  puis ouvrir sur l'ordinateur relié au projecteur l'adresse affichée
 *  (par exemple http://192.168.1.20:3000). L'écran du jeu affiche un
 *  QR code : les élèves le scannent avec leur téléphone, connecté au
 *  MÊME Wi-Fi que l'ordinateur.
 *
 *  RÉGLAGES (variables d'environnement, toutes facultatives)
 *    PORT=3000                   le port d'écoute
 *    ADRESSE_PUBLIQUE=https://…  l'adresse à mettre dans le QR code quand le
 *                                jeu est hébergé en ligne (Render, un VPS…)
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const Moteur = require('./moteur/moteur');

const PORT = Number(process.env.PORT) || 3000;
const RACINE = __dirname;

/* ═══════════ 1. Les pages ═══════════ */

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};
// Seuls ces dossiers et fichiers sont servis : jamais le serveur lui-même, ni rien d'autre sur l'ordinateur.
const AUTORISES = ['/css/', '/js/', '/moteur/', '/img/'];
const PAGES = { '/': 'tablette.html', '/tablette.html': 'tablette.html', '/joueur.html': 'joueur.html', '/simulateur': 'index.html', '/index.html': 'index.html', '/solo': 'solo.html', '/solo.html': 'solo.html' };

/* L'adresse que les téléphones doivent ouvrir : l'adresse publique si elle est réglée, sinon celle de l'ordinateur sur le Wi-Fi. */
function adresseLocale() {
  const candidates = [];
  Object.values(os.networkInterfaces()).forEach((liste) => (liste || []).forEach((i) => {
    if (i.family === 'IPv4' && !i.internal) candidates.push(i.address);
  }));
  // On préfère les adresses de réseau domestique ou d'école (192.168…, 10…, 172.16-31…).
  candidates.sort((a, b) => score(b) - score(a));
  return candidates[0] || 'localhost';
  function score(ip) { return ip.startsWith('192.168.') ? 3 : ip.startsWith('10.') ? 2 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 1 : 0; }
}
function adressePourTelephones(req) {
  if (process.env.ADRESSE_PUBLIQUE) return process.env.ADRESSE_PUBLIQUE.replace(/\/+$/, '');
  const hote = String(req.headers.host || '');
  // Ouvert depuis l'ordinateur lui-même (localhost) : on donne aux téléphones l'adresse Wi-Fi.
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(hote)) return 'http://' + adresseLocale() + ':' + PORT;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return proto + '://' + hote;
}

const serveur = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const chemin = decodeURIComponent(url.pathname);

  // Le QR code fixe, à imprimer une fois pour toutes : il mène à la partie ouverte le plus récemment.
  if (chemin === '/jouer') {
    const code = moteur.salleRecente();
    res.writeHead(302, { Location: '/joueur.html' + (code ? '?code=' + code : '?aucune=1'), 'Cache-Control': 'no-store' });
    return res.end();
  }
  // Les selfies des joueurs : /photo/CODE/IDENTIFIANT
  const mPhoto = /^\/photo\/([A-Za-z]{4})\/([A-Za-z0-9-]{3,40})$/.exec(chemin);
  if (mPhoto) {
    const image = moteur.photo(mPhoto[1], mPhoto[2]);
    if (!image) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Pas de photo.'); }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
    return res.end(image);
  }
  if (chemin === '/sante') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }

  if (chemin === '/api/adresse') {
    res.writeHead(200, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ adresse: adressePourTelephones(req) }));
  }

  let fichier = PAGES[chemin];
  if (!fichier && AUTORISES.some((p) => chemin.startsWith(p)) && !chemin.includes('..')) fichier = chemin.slice(1);
  if (!fichier) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Page introuvable.'); }

  fs.readFile(path.join(RACINE, fichier), (err, contenu) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Page introuvable.'); }
    // Le simulateur est écrit sans en-tête HTML (pour sa publication sur claude.ai) : on le complète ici.
    if (fichier === 'index.html' || fichier === 'solo.html') contenu = Buffer.concat([Buffer.from('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>'), contenu, Buffer.from('</body></html>')]);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(fichier)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
    res.end(contenu);
  });
});

/* ═══════════ 2. Le moteur ═══════════ */

const lignes = new Map(); // identifiant de connexion → socket
const moteur = new Moteur({
  envoyer: (cid, evenement, donnees) => {
    const s = lignes.get(cid);
    if (s) envoyerTexte(s, JSON.stringify({ e: evenement, d: donnees }));
  }
});
setInterval(() => moteur.nettoyer(), 10 * 60 * 1000).unref();

/* ═══════════ 3. La ligne (WebSocket, RFC 6455) ═══════════ */

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
let numero = 0;

serveur.on('upgrade', (req, socket) => {
  if (new URL(req.url, 'http://x').pathname !== '/ligne' || String(req.headers.upgrade).toLowerCase() !== 'websocket') return socket.destroy();
  const cle = req.headers['sec-websocket-key'];
  if (!cle) return socket.destroy();
  const accepte = crypto.createHash('sha1').update(cle + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accepte + '\r\n\r\n');
  socket.setNoDelay(true);

  const cid = 'c' + (++numero);
  lignes.set(cid, socket);
  let tampon = Buffer.alloc(0);
  let morceaux = []; // pour les messages fragmentés
  let ferme = false;

  const fermer = () => {
    if (ferme) return;
    ferme = true;
    lignes.delete(cid);
    moteur.deconnexion(cid);
    socket.destroy();
  };
  // Un téléphone muet depuis 70 s (il envoie un « ping » toutes les 25 s) est considéré comme parti.
  socket.setTimeout(70000, fermer);
  socket.on('close', fermer);
  socket.on('error', fermer);

  socket.on('data', (donnees) => {
    tampon = Buffer.concat([tampon, donnees]);
    if (tampon.length > 1024 * 1024) return fermer(); // garde-fou : rien de légitime n'est si gros
    for (;;) {
      if (tampon.length < 2) return;
      const fin = (tampon[0] & 0x80) !== 0;
      const code = tampon[0] & 0x0f;
      const masque = (tampon[1] & 0x80) !== 0;
      let longueur = tampon[1] & 0x7f;
      let pos = 2;
      if (longueur === 126) { if (tampon.length < 4) return; longueur = tampon.readUInt16BE(2); pos = 4; }
      else if (longueur === 127) { if (tampon.length < 10) return; longueur = Number(tampon.readBigUInt64BE(2)); pos = 10; }
      if (!masque) return fermer(); // la norme impose aux navigateurs de masquer
      if (tampon.length < pos + 4 + longueur) return;
      const cleMasque = tampon.subarray(pos, pos + 4);
      const charge = Buffer.from(tampon.subarray(pos + 4, pos + 4 + longueur));
      for (let i = 0; i < charge.length; i++) charge[i] ^= cleMasque[i % 4];
      tampon = tampon.subarray(pos + 4 + longueur);

      if (code === 0x8) { envoyerTrame(socket, 0x8, Buffer.alloc(0)); return fermer(); }
      if (code === 0x9) { envoyerTrame(socket, 0xA, charge); continue; } // ping → pong
      if (code === 0xA) continue;
      if (code === 0x1 || code === 0x0) {
        morceaux.push(charge);
        if (!fin) continue;
        const texte = Buffer.concat(morceaux).toString('utf8');
        morceaux = [];
        let message;
        try { message = JSON.parse(texte); } catch (e) { continue; }
        if (message && typeof message.e === 'string' && message.e !== 'ping') moteur.recevoir(cid, message.e, message.d);
      }
    }
  });
});

function envoyerTrame(socket, code, charge) {
  if (socket.destroyed) return;
  let entete;
  if (charge.length < 126) entete = Buffer.from([0x80 | code, charge.length]);
  else if (charge.length < 65536) { entete = Buffer.alloc(4); entete[0] = 0x80 | code; entete[1] = 126; entete.writeUInt16BE(charge.length, 2); }
  else { entete = Buffer.alloc(10); entete[0] = 0x80 | code; entete[1] = 127; entete.writeBigUInt64BE(BigInt(charge.length), 2); }
  socket.write(Buffer.concat([entete, charge]));
}
function envoyerTexte(socket, texte) { envoyerTrame(socket, 0x1, Buffer.from(texte, 'utf8')); }

serveur.listen(PORT, () => {
  const local = 'http://' + adresseLocale() + ':' + PORT;
  console.log('');
  console.log('  Le labo des savoirs est prêt.');
  console.log('');
  console.log('  Sur l\'ordinateur relié au projecteur, ouvrez :  ' + local);
  console.log('  (ou http://localhost:' + PORT + ' sur cet ordinateur)');
  if (process.env.ADRESSE_PUBLIQUE) console.log('  Adresse mise dans le QR code :  ' + process.env.ADRESSE_PUBLIQUE);
  else console.log('  Les téléphones doivent être sur le même Wi-Fi que cet ordinateur.');
  console.log('  Pour essayer seul·e avec des robots :  ' + local + '/simulateur');
  console.log('  Mode solo (révision sur téléphone) :  ' + local + '/solo');
  console.log('');
  console.log('  Pour arrêter : Ctrl + C');
  console.log('');
});
