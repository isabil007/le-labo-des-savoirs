/*
 * ════════════════════════════════════════════════════════════════════
 *  FABRIQUE — « Jouer seul », en un seul fichier, sans serveur
 * ════════════════════════════════════════════════════════════════════
 *
 *  Ce petit programme assemble la page solo (solo.html), sa feuille de
 *  style, tout le moteur du jeu et js/sans-serveur.js en UN SEUL fichier
 *  HTML : neuromania/programmes/jouer-seul/index.html. Ce fichier marche
 *  partout, sans l'ordinateur : il suffit de l'ouvrir sur le téléphone
 *  (ou de le publier en ligne). À relancer après chaque modification du
 *  jeu :  node fabrique/solo-autonome.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const racine = path.join(__dirname, '..');
const lire = (f) => fs.readFileSync(path.join(racine, f), 'utf8');

// Les fichiers du moteur, dans l'ordre exact du simulateur (chacun après ses dépendances).
const moteur = [...lire('public/simulateur.html').matchAll(/<script src="(moteur\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const ecrans = ['js/sans-serveur.js', 'js/connexion.js', 'js/commun.js', 'js/scene.js', 'js/toile.js', 'js/musique.js', 'js/solo.js', 'js/joueur.js'];

const script = (f) => '<script>/* ' + f + ' */\n' + lire(f.startsWith('moteur/') ? f : 'public/' + f).replace(/<\/script/gi, '<\\/script') + '\n</script>';

let page = lire('public/solo.html');
page = page.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + lire('public/css/style.css') + '\n</style>');
page = page.replace(/\s*<script src="js\/[^"]+"><\/script>/g, '');
page = page.replace('<title>La guerre des neurones · solo</title>', '<title>La guerre des neurones · Jouer seul</title>');
page = page.replace('</body>', [...moteur, ...ecrans].map(script).join('\n') + '\n</body>');

const sortie = path.join(racine, 'neuromania', 'programmes', 'jouer-seul', 'index.html');
fs.mkdirSync(path.dirname(sortie), { recursive: true });
fs.writeFileSync(sortie, page);
console.log('  ✅ « Jouer seul » sans serveur : ' + path.relative(racine, sortie) + ' (' + Math.round(page.length / 1024) + ' Ko)');
