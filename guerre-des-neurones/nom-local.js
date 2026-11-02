/*
 * ════════════════════════════════════════════════════════════════════
 *  UN NOM FACILE POUR LE JEU : « tablee.local »
 * ════════════════════════════════════════════════════════════════════
 *
 *  Sur le Wi-Fi de la maison, l'ordinateur qui fait tourner le jeu a une
 *  adresse en chiffres (par exemple 192.168.1.23), pas très facile à
 *  retenir. Ce petit fichier lui donne en plus un NOM : « tablee.local ».
 *
 *  Comment ? Les appareils récents (iPhone, iPad, Mac, Windows, et de
 *  nombreux Android) savent demander à voix haute sur le Wi-Fi : « Qui
 *  s'appelle tablee.local ? ». C'est le protocole « mDNS » (celui des
 *  imprimantes et des enceintes connectées). Ce fichier écoute ces
 *  questions et répond : « C'est moi, voici mon adresse ».
 *
 *  Si quelque chose empêche cette réponse (un autre programme, un réseau
 *  qui bloque ce type de message, un vieux téléphone…), rien n'est cassé :
 *  le QR code et l'adresse en chiffres continuent de fonctionner.
 *
 *  Aucun outil extérieur : seulement le module « dgram » de Node.js.
 */
'use strict';

const dgram = require('dgram');

const GROUPE = '224.0.0.251';
const PORT_MDNS = 5353;

/* Transforme « tablee.local » en suite d'étiquettes, comme l'exige le protocole. */
function encoderNom(nom) {
  const morceaux = nom.split('.').map((m) => { const b = Buffer.from(m, 'utf8'); return Buffer.concat([Buffer.from([b.length]), b]); });
  return Buffer.concat([...morceaux, Buffer.from([0])]);
}

/* Lit un nom dans un message reçu (avec les « raccourcis » que le protocole autorise). */
function lireNom(message, position) {
  const etiquettes = [];
  let pos = position, suite = -1, sauts = 0;
  while (pos < message.length) {
    const longueur = message[pos];
    if (longueur === 0) { pos++; break; }
    if ((longueur & 0xC0) === 0xC0) {
      if (suite < 0) suite = pos + 2;
      pos = ((longueur & 0x3F) << 8) | message[pos + 1];
      if (++sauts > 20) return null;
      continue;
    }
    etiquettes.push(message.toString('utf8', pos + 1, pos + 1 + longueur));
    pos += 1 + longueur;
  }
  return { nom: etiquettes.join('.').toLowerCase(), fin: suite >= 0 ? suite : pos };
}

/* Fabrique la réponse « tablee.local = 192.168.x.x ». */
function reponse(nom, adresseIp, identifiant, question) {
  const entete = Buffer.alloc(12);
  entete.writeUInt16BE(identifiant || 0, 0);
  entete.writeUInt16BE(0x8400, 2);              // c'est une réponse, et elle fait autorité
  entete.writeUInt16BE(question ? 1 : 0, 4);    // nombre de questions recopiées
  entete.writeUInt16BE(1, 6);                   // une réponse
  const enregistrement = Buffer.alloc(10);
  enregistrement.writeUInt16BE(1, 0);           // type A : une adresse IPv4
  enregistrement.writeUInt16BE(question ? 0x0001 : 0x8001, 2); // classe Internet (+ « remplace l'ancienne valeur »)
  enregistrement.writeUInt32BE(120, 4);         // valable deux minutes
  enregistrement.writeUInt16BE(4, 8);
  const ip = Buffer.from(adresseIp.split('.').map(Number));
  return Buffer.concat([entete, question || Buffer.alloc(0), encoderNom(nom), enregistrement, ip]);
}

/*
 * Démarre la réponse au nom. `adresse()` donne l'adresse IP actuelle de
 * l'ordinateur (elle peut changer si le Wi-Fi change). Renvoie une
 * promesse : vrai si le nom est bien annoncé, faux sinon.
 */
function annoncerNom(nom, adresse, options) {
  options = options || {};
  const port = options.port || PORT_MDNS;
  nom = nom.toLowerCase();
  return new Promise((resoudre) => {
    let socket;
    try { socket = dgram.createSocket({ type: 'udp4', reuseAddr: true }); } catch (e) { return resoudre(false); }
    let fini = false;
    const terminer = (ok) => { if (!fini) { fini = true; resoudre(ok); } };
    socket.on('error', () => { try { socket.close(); } catch (e) { /* déjà fermé */ } terminer(false); });

    socket.on('message', (message, expediteur) => {
      try {
        if (message.length < 12 || (message.readUInt16BE(2) & 0x8000)) return; // on ignore les réponses des autres
        const nbQuestions = message.readUInt16BE(4);
        let pos = 12;
        for (let i = 0; i < nbQuestions; i++) {
          const lu = lireNom(message, pos);
          if (!lu) return;
          const type = message.readUInt16BE(lu.fin), classe = message.readUInt16BE(lu.fin + 2);
          pos = lu.fin + 4;
          if (lu.nom !== nom || (type !== 1 && type !== 255)) continue;
          const ip = adresse();
          if (!ip) return;
          const ancienStyle = expediteur.port !== port; // une simple question « à l'ancienne » : on répond directement
          if (ancienStyle || (classe & 0x8000)) {
            const question = ancienStyle ? Buffer.concat([encoderNom(nom), message.slice(lu.fin, lu.fin + 4)]) : null;
            const r = reponse(nom, ip, ancienStyle ? message.readUInt16BE(0) : 0, question);
            socket.send(r, expediteur.port, expediteur.address);
          } else {
            socket.send(reponse(nom, ip), port, GROUPE);
          }
          return;
        }
      } catch (e) { /* un message mal formé est simplement ignoré */ }
    });

    socket.bind(port, () => {
      try {
        socket.setMulticastTTL(255);
        socket.setMulticastLoopback(true);
        const ip = adresse();
        try { socket.addMembership(GROUPE, ip || undefined); } catch (e) { socket.addMembership(GROUPE); }
        if (ip) { try { socket.setMulticastInterface(ip); } catch (e) { /* pas grave */ } }
        // On se présente deux fois au réseau, comme le veut l'usage.
        const presenter = () => { const a = adresse(); if (a) socket.send(reponse(nom, a), port, GROUPE, () => {}); };
        presenter();
        setTimeout(presenter, 1000);
        terminer(true);
      } catch (e) { terminer(false); }
    });
  });
}

module.exports = { annoncerNom };
