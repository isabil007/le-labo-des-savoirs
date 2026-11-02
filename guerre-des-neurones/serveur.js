/*
 * ════════════════════════════════════════════════════════════════════
 *  LA GUERRE DES NEURONES — Le serveur
 * ════════════════════════════════════════════════════════════════════
 *
 *  Le serveur est le standard téléphonique de la soirée. Il fait trois
 *  choses, et seulement trois :
 *
 *   1. Il SERT LES PAGES : quand un téléphone ouvre l'adresse du jeu,
 *      c'est lui qui envoie les fichiers du dossier « public » (écrans,
 *      styles, scripts). Ce sont de simples pages web : elles marchent à
 *      l'identique sur iPhone (Safari), sur Samsung (Chrome ou Samsung
 *      Internet) et sur n'importe quelle tablette. Rien à installer,
 *      aucun passage par l'App Store ou le Play Store.
 *
 *   2. Il TIENT LES LIGNES OUVERTES : chaque appareil garde avec lui une
 *      connexion permanente, appelée « WebSocket ». Les messages filent
 *      alors instantanément dans les deux sens, sans recharger les pages.
 *
 *   3. Il PASSE LES MESSAGES AU MOTEUR (moteur/moteur.js), qui décide de
 *      tout le reste. Le serveur, lui, ne connaît aucune règle de jeu.
 *
 *  En prime, il donne au jeu un nom facile, « tablee.local » (voir
 *  nom-local.js), et des adresses courtes : …/jouer et …/tablette.
 *  Il essaie d'abord le port 80 (l'adresse n'a alors pas besoin de
 *  « :3000 » au bout) ; si ce port est déjà pris, il prend le 3000.
 *
 *  Il n'utilise qu'un seul outil extérieur, « ws », pour les WebSockets.
 *  Tout le reste est fourni par Node.js lui-même.
 *
 *  POUR LE LANCER (voir aussi LISEZ-MOI.md)
 *    npm install     (une seule fois)
 *    npm start       (à chaque soirée)
 */
'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');
const Moteur = require('./moteur/moteur');
const { annoncerNom } = require('./nom-local');

// Le port : celui qu'on impose avec PORT=…, sinon 80 (adresse plus courte), et 3000 si le 80 est déjà pris.
let PORT = Number(process.env.PORT) || 80;
const NOM_LOCAL = (process.env.NOM_LOCAL || 'tablee.local').toLowerCase();
let nomActif = false; // devient vrai si « tablee.local » est bien annoncé sur le Wi-Fi
const suffixePort = () => (PORT === 80 ? '' : ':' + PORT);
// On peut jouer dès 1 joueur ; pour exiger plus de monde : MIN_JOUEURS=2 npm start
const MIN_JOUEURS = Number(process.env.MIN_JOUEURS) || 1;
const MAX_JOUEURS = Number(process.env.MAX_JOUEURS) || 12;

/* ═══════════ 1. Servir les pages ═══════════ */

// Le « type » de chaque fichier, pour que le navigateur sache s'il reçoit une page, un style, un script…
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

// Deux dossiers sont visibles depuis l'extérieur : « public » (les écrans) et « moteur »
// (pour que le simulateur puisse faire tourner le moteur dans le navigateur).
const DOSSIERS = { '/moteur/': path.join(__dirname, 'moteur'), '/programmes/': path.join(__dirname, 'neuromania', 'programmes'), '/': path.join(__dirname, 'public') };

/* ═══════════ Neuro'Mania : la page d'accueil de tous les programmes ═══════════ */

/*
 * La liste des thèmes et des programmes est écrite dans
 * neuromania/catalogue.json. Le serveur la relit dès que le fichier
 * change et la pousse aussitôt à toutes les pages d'accueil ouvertes
 * (« flux » d'événements envoyés par le serveur) : personne n'a besoin
 * de rafraîchir. Si le fichier contient une faute de frappe, on garde
 * la dernière version correcte et on le signale dans la fenêtre noire.
 */
const FICHIER_CATALOGUE = path.join(__dirname, 'neuromania', 'catalogue.json');
let catalogueTexte = '{"themes":[]}';
const abonnesCatalogue = new Set(); // les pages d'accueil ouvertes, à prévenir
function lireCatalogue() {
  try {
    const texte = JSON.stringify(JSON.parse(fs.readFileSync(FICHIER_CATALOGUE, 'utf8')));
    if (texte === catalogueTexte) return;
    catalogueTexte = texte;
    abonnesCatalogue.forEach((rep) => rep.write('event: catalogue\ndata: ' + catalogueTexte + '\n\n'));
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('  ⚠️  Le catalogue de Neuro\'Mania contient une erreur (' + e.message + ') : on garde la version précédente.');
  }
}
lireCatalogue();
let attenteCatalogue = null;
try {
  fs.watch(path.dirname(FICHIER_CATALOGUE), (type, nom) => {
    if (nom && nom !== 'catalogue.json') return;
    clearTimeout(attenteCatalogue);
    attenteCatalogue = setTimeout(lireCatalogue, 250); // un éditeur écrit parfois en plusieurs fois
  });
} catch (e) { setInterval(lireCatalogue, 10000).unref(); }
// Un petit signe de vie toutes les 25 secondes : sinon, les hébergeurs coupent les lignes trop silencieuses.
setInterval(() => abonnesCatalogue.forEach((rep) => rep.write(': battement\n\n')), 25000).unref();

/*
 * L'adresse à laquelle les téléphones peuvent joindre le jeu. Sur un
 * ordinateur relié à la box, c'est l'adresse locale (192.168.x.x).
 * Si le jeu est hébergé en ligne, on peut l'imposer avec la variable
 * ADRESSE_PUBLIQUE (par exemple https://ma-tablee.onrender.com).
 */
function adresseDuJeu(requete) {
  if (process.env.ADRESSE_PUBLIQUE) return process.env.ADRESSE_PUBLIQUE.replace(/\/$/, '');
  const hote = requete && requete.headers.host;
  // Le QR code utilise toujours l'adresse en chiffres sur le Wi-Fi : c'est la plus sûre pour tous les téléphones.
  if (hote && !/^(localhost|127\.|\[::1\])/.test(hote) && !/\.local(:\d+)?$/i.test(hote)) {
    const protocole = requete.headers['x-forwarded-proto'] || 'http';
    return protocole + '://' + hote;
  }
  const locales = adressesLocales();
  return 'http://' + (locales.length ? locales[0].adresse : 'localhost') + suffixePort();
}

/* L'adresse en chiffres de l'ordinateur sur le Wi-Fi (sans « http:// »), pour le nom facile. */
function ipLocale() {
  const locales = adressesLocales();
  return locales.length ? locales[0].adresse : null;
}

/*
 * Les adresses de cet ordinateur sur le réseau local, la plus probable en
 * premier. Un ordinateur Windows a souvent plusieurs « cartes réseau » :
 * le vrai Wi-Fi, mais aussi des cartes virtuelles (WSL, Hyper-V, VirtualBox,
 * VPN…) que les téléphones ne peuvent pas joindre. Si le QR code pointait
 * vers l'une d'elles, les joueurs ne pourraient jamais se connecter. On
 * écarte donc les cartes virtuelles et on préfère le Wi-Fi et les adresses
 * de box (192.168.x.x), et par-dessus tout le point d'accès de Windows
 * (192.168.137.1), quand c'est l'ordinateur qui crée le Wi-Fi.
 */
function adressesLocales() {
  const virtuelle = /vethernet|virtual|vmware|vbox|hyper-v|wsl|docker|loopback|bluetooth|tailscale|zerotier|hamachi|vpn|pseudo/i;
  const liste = [];
  Object.entries(os.networkInterfaces()).forEach(([nom, cartes]) => (cartes || []).forEach((c) => {
    const ipv4 = c.family === 'IPv4' || c.family === 4;
    if (!ipv4 || c.internal || /^169\.254\./.test(c.address)) return;
    let note = 0;
    if (virtuelle.test(nom)) note -= 100;
    if (/wi-?fi|wlan|wireless|sans fil/i.test(nom)) note += 20;
    else if (/ethernet|^eth|^en/i.test(nom)) note += 10;
    // Le point d'accès sans fil de Windows (l'ordinateur crée lui-même le Wi-Fi) : toujours 192.168.137.1.
    // Les appareils connectés à ce Wi-Fi ne peuvent joindre l'ordinateur que par cette adresse-là : priorité absolue.
    if (/^192\.168\.137\./.test(c.address)) note += 200;
    if (/^192\.168\./.test(c.address)) note += 30;
    else if (/^10\./.test(c.address)) note += 15;
    else if (/^172\.(1[6-9]|2\d|3[01])\./.test(c.address)) note += 5;
    liste.push({ nom, adresse: c.address, note });
  }));
  return liste.sort((x, y) => y.note - x.note);
}

const serveurHttp = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');

  // La tablette demande l'adresse à afficher pour inviter les joueurs.
  if (url.pathname === '/api/adresse') {
    res.writeHead(200, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
    const adresse = adresseDuJeu(req);
    return res.end(JSON.stringify({
      adresse,
      // Ce que l'on peut taper à la main sur un téléphone, sans « http:// » : le nom facile, et l'adresse courte en chiffres.
      nomFacile: !process.env.ADRESSE_PUBLIQUE && nomActif ? NOM_LOCAL + suffixePort() : null,
      courte: adresse.replace(/^https?:\/\//, '')
    }));
  }

  // Neuro'Mania : la liste des programmes (une fois, ou « en direct »).
  if (url.pathname === '/api/catalogue') {
    res.writeHead(200, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
    return res.end(catalogueTexte);
  }
  if (url.pathname === '/api/catalogue/flux') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 4000\nevent: catalogue\ndata: ' + catalogueTexte + '\n\n');
    abonnesCatalogue.add(res);
    req.on('close', () => abonnesCatalogue.delete(res));
    return;
  }
  // En ligne, la racine renvoie vers la porte d'entrée commune (PORTAIL = son adresse), au chapitre de ce jeu.
  if (url.pathname === '/' && /^https:\/\/[a-z0-9.-]+(\/[^\s]*)?$/i.test(process.env.PORTAIL || '')) {
    res.writeHead(302, { Location: process.env.PORTAIL, 'Cache-Control': 'no-store' });
    return res.end();
  }
  // La page d'accueil de Neuro'Mania (à la racine du site).
  if (url.pathname === '/' || url.pathname.replace(/\/$/, '') === '/neuromania') {
    return fs.readFile(path.join(__dirname, 'neuromania', 'index.html'), (err, contenu) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-cache' });
      res.end(contenu);
    });
  }

  // Les adresses courtes, faciles à taper : …/jouer pour les téléphones, …/tablette pour la tablette, …/solo pour jouer seul.
  const RACCOURCIS = { '/autour-de-la-table': '/index.html', '/solo': '/solo.html', '/jouer': '/joueur.html', '/joueur': '/joueur.html', '/tablette': '/tablette.html', '/simulateur': '/simulateur.html' };
  if (RACCOURCIS[url.pathname.replace(/\/$/, '')]) url.pathname = RACCOURCIS[url.pathname.replace(/\/$/, '')];

  // On cherche le fichier demandé, en refusant tout chemin qui tenterait de sortir des dossiers autorisés.
  const prefixe = ['/moteur/', '/programmes/'].find((p) => url.pathname.startsWith(p)) || '/';
  const racine = DOSSIERS[prefixe];
  let relatif = decodeURIComponent(url.pathname.slice(prefixe.length));
  if (!relatif || relatif.endsWith('/')) relatif += 'index.html';
  const fichier = path.join(racine, relatif);
  if (!fichier.startsWith(racine)) { res.writeHead(403); return res.end(); }

  fs.readFile(fichier, (err, contenu) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Page introuvable'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(fichier).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(contenu);
  });
});

/* ═══════════ 2. Les lignes ouvertes (WebSockets) ═══════════ */

const wss = new WebSocketServer({ server: serveurHttp, path: '/ligne', maxPayload: 64 * 1024 });
// Le serveur WebSocket répète les erreurs du serveur web (par exemple « port déjà occupé »).
// Sans cette oreille, Node s'arrêtait net au lieu d'essayer le port suivant : c'est ecouter() qui s'en charge.
wss.on('error', () => {});
const lignes = new Map(); // identifiant de connexion → WebSocket
let compteur = 0;

/* Le « facteur » confié au moteur : il retrouve l'appareil et lui remet le message. */
function envoyer(connexionId, evenement, donnees) {
  const ws = lignes.get(connexionId);
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify({ e: evenement, d: donnees }));
}

/* La liste des messages acceptés venant des appareils : tout autre message est ignoré. */
const MESSAGES_ACCEPTES = new Set([
  'tablette:creer', 'tablette:reprendre', 'tablette:lancer', 'tablette:passer', 'tablette:terminer-jeu',
  'tablette:podium', 'tablette:nouvelle', 'tablette:retirer', 'tablette:pause', 'tablette:signal', 'tablette:figer', 'tablette:relancer',
  'joueur:rejoindre', 'joueur:action', 'joueur:reaction'
]);

/* ═══════════ 3. Le moteur ═══════════ */

/*
 * La mémoire anti-répétition (voir outils.tirerNeuf) est gardée dans le
 * fichier souvenirs.json, à côté du jeu : d'une soirée à l'autre, le jeu
 * se souvient des questions déjà posées et propose d'abord les autres.
 * Pour tout oublier, il suffit de supprimer ce fichier.
 */
const outils = require('./moteur/outils');
const FICHIER_SOUVENIRS = path.join(__dirname, 'souvenirs.json');
try { outils.memoire.importer(JSON.parse(fs.readFileSync(FICHIER_SOUVENIRS, 'utf8'))); } catch (e) { /* pas encore de souvenirs */ }
function enregistrerSouvenirs() {
  if (!outils.memoire.modifiee()) return;
  try { fs.writeFileSync(FICHIER_SOUVENIRS, JSON.stringify(outils.memoire.exporter())); } catch (e) { /* tant pis, on réessaiera */ }
}
setInterval(enregistrerSouvenirs, 15000);
process.on('SIGINT', () => { enregistrerSouvenirs(); process.exit(0); });
process.on('SIGTERM', () => { enregistrerSouvenirs(); process.exit(0); });

const moteur = new Moteur({ minJoueurs: MIN_JOUEURS, maxJoueurs: MAX_JOUEURS, envoyer });

wss.on('connection', (ws) => {
  const id = 'c' + (++compteur);
  lignes.set(id, ws);
  ws.enVie = true;
  ws.on('pong', () => { ws.enVie = true; });

  ws.on('message', (brut) => {
    let message;
    try { message = JSON.parse(brut); } catch (e) { return; } // un message illisible est simplement ignoré
    if (message && message.e === 'ping') return envoyer(id, 'pong', {});
    if (message && MESSAGES_ACCEPTES.has(message.e)) moteur.recevoir(id, message.e, message.d);
  });

  ws.on('close', () => {
    lignes.delete(id);
    moteur.deconnexion(id);
  });
});

/*
 * Toutes les 20 secondes, on vérifie que chaque appareil répond encore.
 * Un téléphone dont l'écran s'est éteint ne prévient pas toujours qu'il
 * part : sans ce contrôle, on le croirait présent indéfiniment.
 */
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.enVie) return ws.terminate();
    ws.enVie = false;
    ws.ping();
  });
}, 20000);

// Toutes les dix minutes, on ferme les salles abandonnées.
setInterval(() => moteur.nettoyer(), 10 * 60 * 1000);

/*
 * Le démarrage : on essaie le port 80 (adresse courte), puis le 3000 si
 * le 80 est déjà occupé ou interdit. Ensuite on annonce le nom facile,
 * on affiche les adresses et, si on nous le demande (OUVRIR=…), on ouvre
 * la page dans le navigateur de l'ordinateur.
 */
/* Le port occupé l'est-il par notre propre jeu ? On le lui demande poliment (réponse attendue en 1,5 s). */
function dejaOuvert(port) {
  return new Promise((resoudre) => {
    const requete = http.get({ host: '127.0.0.1', port, path: '/api/adresse', timeout: 1500 }, (rep) => {
      let corps = '';
      rep.on('data', (m) => { corps += m; });
      rep.on('end', () => { try { resoudre(!!JSON.parse(corps).adresse); } catch (e) { resoudre(false); } });
    });
    requete.on('timeout', () => { requete.destroy(); resoudre(false); });
    requete.on('error', () => resoudre(false));
  });
}

function ecouter(ports) {
  PORT = ports.shift();
  const echec = (e) => {
    // Le port est déjà pris ? C'est souvent… le jeu lui-même, resté ouvert dans une autre fenêtre.
    if (e.code === 'EADDRINUSE') return dejaOuvert(PORT).then((estLeJeu) => {
      if (estLeJeu) {
        console.log('\n  ✅  Le jeu tourne DÉJÀ dans une autre fenêtre (ou en arrière-plan).');
        console.log('  Il n\'y a rien à relancer : sur la tablette, ouvrez  ' + ipLocale() + suffixePort() + '/tablette');
        console.log('  Pour le redémarrer quand même : fermez l\'autre fenêtre noire, puis relancez LANCER-LE-JEU.\n');
        return process.exit(0);
      }
      if (ports.length) return ecouter(ports);
      echecFinal(e);
    });
    if (e.code === 'EACCES' && ports.length) return ecouter(ports);
    echecFinal(e);
  };
  const echecFinal = (e) => {
    console.error('\n  Impossible de démarrer le jeu sur le port ' + PORT + ' (' + e.code + ').');
    console.error('  Un autre programme l\'utilise peut-être : fermez l\'autre fenêtre du jeu, puis relancez.\n');
    process.exit(1);
  };
  serveurHttp.once('error', echec);
  serveurHttp.listen(PORT, () => {
    serveurHttp.removeListener('error', echec);
    const delai = setTimeout(demarre, 1500); // on n'attend pas le nom plus d'une seconde et demie
    annoncerNom(NOM_LOCAL, ipLocale).then((ok) => { nomActif = ok; clearTimeout(delai); demarre(); });
  });
}
ecouter(process.env.PORT ? [PORT] : [80, 3000]);

let dejaDemarre = false;
function demarre() {
  if (dejaDemarre) return;
  dejaDemarre = true;
  const adresse = adresseDuJeu();
  const courte = adresse.replace(/^https?:\/\//, '');
  console.log('');
  console.log('  🧠  La guerre des neurones peut commencer ! Jeu dis, Jeu fais !');
  console.log('');
  if (nomActif && !process.env.ADRESSE_PUBLIQUE) {
    console.log('  Sur la TABLETTE, tapez :    ' + NOM_LOCAL + suffixePort() + '/tablette');
    console.log('                    ou :     ' + courte + '/tablette');
  } else {
    console.log('  Sur la TABLETTE, tapez :    ' + courte + '/tablette');
  }
  console.log('  Les JOUEURS scannent le QR code affiché sur la tablette');
  console.log('  (ou tapent ' + (nomActif && !process.env.ADRESSE_PUBLIQUE ? NOM_LOCAL + suffixePort() + '/jouer  ou  ' : '') + courte + '/jouer).');
  console.log('  Pour jouer SEUL, avec un seul téléphone (sans tablette) :  ' + courte + '/solo');
  console.log('  Pour tout tester sur un seul écran : ' + courte + '/simulateur');
  console.log('  La page d\'accueil Neuro\'Mania (tous les programmes) : ' + courte + '/');
  console.log('');
  if (process.env.OUVRIR && process.platform === 'win32') {
    const page = String(process.env.OUVRIR).replace(/[^a-z.\/]/gi, '');
    require('child_process').exec('start "" "http://localhost' + suffixePort() + '/' + page + '"');
  }
  const autres = adressesLocales().slice(1);
  if (!process.env.ADRESSE_PUBLIQUE && autres.length) {
    console.log('  Si les téléphones n\'arrivent pas à se connecter, essayez sur la tablette :');
    autres.forEach((a) => console.log('     ' + a.adresse + suffixePort() + '/tablette   (' + a.nom + ')'));
    console.log('');
  }
  console.log('  Tous les appareils doivent être sur le même Wi-Fi que cet ordinateur.');
  console.log('  Pour arrêter : fermez cette fenêtre (ou Ctrl + C).');
  console.log('');
}

module.exports = { serveurHttp, moteur };
