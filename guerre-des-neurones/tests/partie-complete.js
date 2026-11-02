/*
 * ════════════════════════════════════════════════════════════════════
 *  TEST AUTOMATIQUE : une partie complète, sans aucun appareil
 * ════════════════════════════════════════════════════════════════════
 *
 *  Ce test joue une soirée entière en accéléré : il crée une salle,
 *  fait entrer cinq joueurs (dont deux « Léa », pour vérifier qu'elles
 *  sont bien distinguées), puis enchaîne les cinq mini-jeux en simulant
 *  des réponses. À chaque étape, il vérifie que le moteur réagit comme
 *  prévu. Une seconde petite partie vérifie ensuite le « piment » :
 *  les défis 🎯 et la Grande Finale ⚡ à points doublés. Lancez-le après avoir modifié une question ou une règle :
 *      npm test
 *  S'il affiche « Tout est en ordre », vous pouvez servir la partie.
 */
'use strict';
const assert = require('assert');
const Moteur = require('../moteur/moteur');
const outils = require('../moteur/outils');

const boites = {}; // pour chaque appareil, la liste des messages reçus
const moteur = new Moteur({ introMs: 30, probaInattendu: 0, voteMs: 2000, verdictMs: 500, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
const dernier = (cid, e) => (boites[cid] || []).filter((m) => m.e === e).pop();
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const etape = (texte) => console.log('  ✓ ' + texte);

(async () => {
  console.log('\nLa guerre des neurones — test d\'une partie complète\n');

  // Les petits outils
  assert.strictEqual(outils.normaliser('Les Licornes !'), 'licorne');
  assert.strictEqual(outils.normaliser("l'Atomium"), 'atomium');
  assert.strictEqual(outils.distance('girafe', 'giraffe'), 1);
  etape('la comparaison des mots pardonne articles, accents et pluriels');

  // La salle et les joueurs
  const code = moteur.creerSalle('TABLETTE');
  assert.match(code, /^[A-Z]{4}$/);
  ['Mamie', 'Léa', 'Papy', 'Tom', 'Léa'].forEach((nom, i) => moteur.recevoir('T' + i, 'joueur:rejoindre', { code, nom, avatar: '🦊' }));
  const noms = dernier('TABLETTE', 'salle:etat').d.joueurs.map((j) => j.nom);
  assert.deepStrictEqual(noms, ['Mamie', 'Léa', 'Papy', 'Tom', 'Léa 2']);
  etape('cinq joueurs à table, les deux Léa sont distinguées');

  moteur.recevoir('X', 'joueur:rejoindre', { code: 'ZZZZ', nom: 'Intrus' });
  assert.ok(dernier('X', 'erreur'));
  etape('un mauvais code est refusé avec un message clair');

  // Le quiz
  moteur.recevoir('TABLETTE', 'tablette:lancer', { programme: ['quiz', 'dessin', 'erreurs', 'zoom', 'humour'] });
  assert.strictEqual(dernier('TABLETTE', 'ecran').d.type, 'intro');
  // Première manche : tout le monde est à zéro, chacun doit finir dans le haut de la manche.
  assert.strictEqual(dernier('T3', 'ecran').d.donnees.defi.type, 'manche');
  const gagesDistribues = Array.from(moteur.salles.get(code).joueurs.values()).map((j) => j.gage);
  assert.ok(dernier('T3', 'ecran').d.donnees.gage && new Set(gagesDistribues).size === 5);
  etape('gages secrets : chaque joueur reçoit un gage différent sur son téléphone');
  assert.strictEqual(dernier('TABLETTE', 'ecran').d.donnees.finale, false);
  etape('défis : à zéro partout, chacun reçoit un défi de manche');
  await pause(60);
  let ecran = dernier('TABLETTE', 'ecran').d;
  assert.strictEqual(ecran.type, 'qcm-question');
  const salle = moteur.salles.get(code);
  const bonne = salle.jeu.questions[0].bonne;
  for (let i = 0; i < 5; i++) moteur.recevoir('T' + i, 'joueur:action', { type: 'reponse', choix: i === 0 ? bonne : (bonne + 1) % 4 });
  await pause(700);
  ecran = dernier('TABLETTE', 'ecran').d;
  assert.strictEqual(ecran.type, 'qcm-revelation');
  assert.strictEqual(ecran.donnees.gagnants.length, 1);
  assert.ok(ecran.donnees.gagnants[0].points >= 500 && ecran.donnees.gagnants[0].points <= 1000);
  etape('quiz : la bonne réponse rapporte entre 500 et 1000 points');
  const choixTel = boites['T1'].filter((m) => m.e === 'ecran' && m.d.type === 'qcm-choix')[0].d.donnees;
  assert.ok(choixTel.vue && choixTel.vue.intitule, 'la question arrive sur le téléphone');
  const resTel = dernier('T0', 'ecran').d.donnees;
  assert.ok(resTel.juste && resTel.intitule && resTel.explication && resTel.rang === 1 && resTel.plusRapides.length === 1, 'le verdict, l\'explication et le classement de la question arrivent sur le téléphone');
  etape('téléphones : la question, le verdict, l\'explication et les plus rapides s\'affichent aussi sur chaque téléphone');
  moteur.recevoir('TABLETTE', 'tablette:terminer-jeu');
  assert.strictEqual(dernier('TABLETTE', 'ecran').d.type, 'classement');
  etape('le classement s\'affiche après le jeu');
  // Mamie (seule à avoir marqué) a réussi son défi de manche et touché la prime.
  const resultatMamie = dernier('T0', 'ecran').d.donnees.defi;
  assert.ok(resultatMamie.reussi && resultatMamie.prime === Moteur.PRIME_DEFI);
  assert.strictEqual(dernier('TABLETTE', 'ecran').d.donnees.nbDefis, 5);
  etape('défis : la prime de ' + Moteur.PRIME_DEFI + ' points est versée à qui réussit');

  // Dessine et devine
  moteur.recevoir('TABLETTE', 'tablette:passer');
  // Deuxième manche : Mamie mène et défend sa couronne, les autres la prennent pour cible.
  const idMamie = dernier('T0', 'joueur:accepte').d.joueurId;
  assert.strictEqual(dernier('T0', 'ecran').d.donnees.defi.type, 'couronne');
  assert.strictEqual(dernier('T2', 'ecran').d.donnees.defi.type, 'depasser');
  assert.strictEqual(dernier('T2', 'ecran').d.donnees.defi.cibleId, idMamie);
  etape('défis : le premier défend sa couronne, les autres visent celui qui est devant');
  await pause(60);
  const dessin = salle.jeu;
  const dessinateur = Array.from(moteur.connexions).find(([, c]) => c.joueurId === dessin.dessinateurId)[0];
  const devineur = Array.from(moteur.connexions).find(([, c]) => c.role === 'joueur' && c.joueurId !== dessin.dessinateurId)[0];
  moteur.recevoir(dessinateur, 'joueur:action', { type: 'trait', id: 'a', couleur: '#ff0000', taille: 6, points: [[0.1, 0.1], [0.5, 0.5]] });
  assert.strictEqual(dernier('TABLETTE', 'evenement').d.type, 'trait');
  assert.strictEqual(dernier(devineur, 'evenement').d.type, 'trait', 'le dessin arrive aussi sur le téléphone de ceux qui devinent');
  moteur.recevoir(devineur, 'joueur:action', { type: 'proposition', texte: 'Les ' + dessin.mot.toUpperCase() + (/s$/i.test(dessin.mot) ? '' : 's') });
  assert.strictEqual(dessin.trouveurs.length, 1);
  etape('dessin : le trait arrive sur la tablette, le mot est reconnu (« ' + dessin.mot + ' »)');
  moteur.recevoir('TABLETTE', 'tablette:terminer-jeu');
  moteur.recevoir('TABLETTE', 'tablette:passer');
  await pause(60);

  // Les 7 erreurs
  const erreurs = salle.jeu;
  assert.strictEqual(erreurs.differences.length, 7);
  erreurs.differences.forEach((d) => moteur.recevoir('T0', 'joueur:action', { type: 'touche', x: d.x + 2, y: d.y - 2 }));
  moteur.recevoir('T1', 'joueur:action', { type: 'touche', x: -100, y: -100 });
  assert.ok(erreurs.fiches[salle.joueurs.get(dernier('T0', 'joueur:accepte').d.joueurId).id].finiA);
  etape('7 erreurs : un joueur trouve les sept différences');
  moteur.recevoir('TABLETTE', 'tablette:passer');
  const fin = dernier('TABLETTE', 'ecran').d;
  assert.strictEqual(fin.type, 'erreurs-fin');
  assert.ok(fin.donnees.classement[0].points >= 900);
  etape('7 erreurs : le bonus de rapidité est bien compté');
  moteur.recevoir('TABLETTE', 'tablette:terminer-jeu');
  moteur.recevoir('TABLETTE', 'tablette:passer');
  await pause(60);

  // Le zoom infernal et les pièges du français
  const vueZoom = dernier('TABLETTE', 'ecran').d;
  assert.strictEqual(vueZoom.type, 'qcm-question');
  assert.ok(vueZoom.donnees.zoom && (vueZoom.donnees.zoom.image || vueZoom.donnees.zoom.photo) && vueZoom.donnees.zoom.depart > 1);
  // Une seule réponse par joueur : la deuxième est ignorée ; la bonne rapporte d'autant plus qu'elle est rapide.
  const jeuZoom = salle.jeu;
  const bonneZoom = jeuZoom.questions[0].bonne;
  const idMamieZoom = dernier('T0', 'joueur:accepte').d.joueurId;
  const avantZoom = salle.joueurs.get(idMamieZoom).score;
  moteur.recevoir('T0', 'joueur:action', { type: 'reponse', choix: bonneZoom });
  moteur.recevoir('T0', 'joueur:action', { type: 'reponse', choix: (bonneZoom + 1) % 4 });
  assert.strictEqual(jeuZoom.reponses.get(idMamieZoom).choix, bonneZoom, 'la première réponse validée ne change plus');
  moteur.recevoir('TABLETTE', 'tablette:passer');
  const gainZoom = salle.joueurs.get(idMamieZoom).score - avantZoom;
  assert.ok(gainZoom >= 900 && gainZoom <= 1000, 'réponse immédiate : presque 1 000 points (' + gainZoom + ')');
  assert.ok(dernier('TABLETTE', 'ecran').d.donnees.zoom, 'l\'image entière est révélée');
  etape('zoom infernal : l\'image se dévoile, une seule réponse par joueur, la rapidité paie (+' + gainZoom + ')');
  moteur.recevoir('TABLETTE', 'tablette:terminer-jeu');
  moteur.recevoir('TABLETTE', 'tablette:passer');
  await pause(60);
  assert.strictEqual(dernier('TABLETTE', 'ecran').d.type, 'qcm-question');
  etape('pièges du français : la première question est posée');
  moteur.recevoir('TABLETTE', 'tablette:terminer-jeu');
  assert.ok(dernier('TABLETTE', 'ecran').d.donnees.tribunal, 'le classement annonce le tribunal des gages');
  moteur.recevoir('TABLETTE', 'tablette:passer');

  // Le tribunal des gages : chaque gage est révélé, les autres votent.
  let vu = 0, gageValide = null;
  while (dernier('TABLETTE', 'ecran').d.type === 'gages-vote' && vu < 10) {
    vu++;
    const v = dernier('TABLETTE', 'ecran').d.donnees;
    assert.ok(v.gage && v.accuse);
    // Pour le premier gage, toute la table vote « réussi » ; pour les autres, « raté ».
    const accuseId = v.accuse.id;
    const scoreAvantGage = salle.joueurs.get(accuseId).score;
    Array.from(moteur.connexions).filter(([, c]) => c.role === 'joueur' && c.code === code && c.joueurId !== accuseId)
      .forEach(([cid]) => moteur.recevoir(cid, 'joueur:action', { type: 'vote', reussi: vu === 1 }));
    await pause(700);
    const verdict = dernier('TABLETTE', 'ecran').d;
    assert.strictEqual(verdict.type, 'gages-verdict');
    assert.strictEqual(verdict.donnees.reussi, vu === 1);
    if (vu === 1) { gageValide = salle.joueurs.get(accuseId).score - scoreAvantGage; }
    await pause(500);
  }
  assert.strictEqual(vu, 5, 'un gage par joueur');
  assert.strictEqual(gageValide, Moteur.PRIME_GAGE);
  etape('tribunal des gages : 5 gages révélés, le gage validé rapporte ' + Moteur.PRIME_GAGE + ' points');
  assert.strictEqual(dernier('TABLETTE', 'ecran').d.type, 'podium');
  assert.ok(dernier('TABLETTE', 'ecran').d.donnees.prix.some((x) => x.icone === '🤫'));
  etape('le podium clôture la partie, avec le prix de l\'agent secret');

  // Le piment : une petite partie de deux manches, dont la seconde est la Grande Finale.
  const code2 = moteur.creerSalle('TAB2');
  ['Anna', 'Bob', 'Chloé', 'Dédé'].forEach((nom, i) => moteur.recevoir('F' + i, 'joueur:rejoindre', { code: code2, nom }));
  const salle2 = moteur.salles.get(code2);
  moteur.recevoir('TAB2', 'tablette:lancer', { programme: ['quiz', 'humour'] });
  await pause(60);
  // Au quiz, seule Anna répond juste : elle mène.
  moteur.recevoir('F0', 'joueur:action', { type: 'reponse', choix: salle2.jeu.questions[0].bonne });
  moteur.recevoir('TAB2', 'tablette:passer');
  moteur.recevoir('TAB2', 'tablette:terminer-jeu');
  assert.ok(dernier('TAB2', 'ecran').d.donnees.prochainFinale);
  moteur.recevoir('TAB2', 'tablette:passer');
  const introFinale = dernier('TAB2', 'ecran').d;
  assert.ok(introFinale.type === 'intro' && introFinale.donnees.finale && introFinale.donnees.multiplicateur === 2);
  assert.strictEqual(dernier('F1', 'ecran').d.donnees.defi.type, 'depasser');
  etape('finale : la dernière manche est annoncée comme Grande Finale');
  await pause(60);
  // En finale, Bob répond juste tout de suite : ses points comptent double et il double Anna.
  moteur.recevoir('F1', 'joueur:action', { type: 'reponse', choix: salle2.jeu.questions[0].bonne });
  moteur.recevoir('TAB2', 'tablette:passer');
  const revelation = dernier('TAB2', 'ecran').d;
  assert.strictEqual(revelation.type, 'qcm-revelation');
  assert.ok(revelation.donnees.gagnants[0].points >= 1000 && revelation.donnees.gagnants[0].points <= 2000);
  etape('finale : une bonne réponse rapporte double (entre 1 000 et 2 000 points)');
  await pause(120);
  assert.strictEqual(dernier('F1', 'evenement').d.type, 'cible-depassee');
  assert.strictEqual(dernier('F0', 'evenement').d.type, 'depasse-par');
  etape('finale : Bob double Anna en direct, les deux téléphones sont prévenus');
  moteur.recevoir('TAB2', 'tablette:terminer-jeu');
  const defiBob = dernier('F1', 'ecran').d.donnees.defi;
  assert.ok(defiBob.reussi && defiBob.prime === Moteur.PRIME_DEFI * 2);
  assert.ok(!dernier('F0', 'ecran').d.donnees.defi.reussi);
  etape('finale : la prime de défi est doublée elle aussi');

  // À deux, on peut déjà jouer (réglage par défaut).
  const moteur3 = new Moteur({ introMs: 30, probaInattendu: 0, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
  const code3 = moteur3.creerSalle('TAB3');
  ['Mamie', 'Tom'].forEach((nom, i) => moteur3.recevoir('D' + i, 'joueur:rejoindre', { code: code3, nom }));
  moteur3.recevoir('TAB3', 'tablette:lancer', { programme: ['dessin', 'quiz'] });
  assert.strictEqual(dernier('TAB3', 'ecran').d.type, 'intro');
  await pause(60);
  assert.ok(moteur3.salles.get(code3).jeu, 'le dessin démarre à deux');
  moteur3.recevoir('TAB3', 'tablette:terminer-jeu');
  moteur3.recevoir('TAB3', 'tablette:passer');
  await pause(60);
  assert.strictEqual(dernier('TAB3', 'ecran').d.type, 'qcm-question');
  moteur3.recevoir('TAB3', 'tablette:podium');
  etape('à deux joueurs, la partie se lance et les jeux s\'enchaînent');
  // « Je choisis » avec l'ordre au hasard : les jeux choisis sont tous là, dans un ordre mélangé.
  const ordres = new Set();
  for (let k = 0; k < 12; k++) {
    const mo = new Moteur({ introMs: 5000, probaInattendu: 0, envoyer: () => {} });
    const co = mo.creerSalle('TO');
    ['A', 'B'].forEach((nom, i) => mo.recevoir('O' + i, 'joueur:rejoindre', { code: co, nom }));
    mo.recevoir('TO', 'tablette:lancer', { programme: ['quiz', 'dessin', 'erreurs', 'zoom', 'humour', 'reflexe'], melanger: true });
    const prog = mo.salles.get(co).programme;
    assert.strictEqual(prog.slice().sort().join(), ['dessin', 'erreurs', 'humour', 'quiz', 'reflexe', 'zoom'].join());
    ordres.add(prog.join());
    mo.arreterJeu(mo.salles.get(co));
  }
  assert.ok(ordres.size > 1, 'l\'ordre change d\'une partie à l\'autre');
  etape('je choisis + ordre au hasard : les jeux choisis s\'enchaînent dans un ordre imprévisible');

  // La partie surprise : jeux tirés au sort, ligne d'arrivée, Grande Finale et prix.
  const moteur4 = new Moteur({ introMs: 30, probaInattendu: 0, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
  const code4 = moteur4.creerSalle('TAB4');
  ['Mamie', 'Tom', 'Zoé'].forEach((nom, i) => moteur4.recevoir('S' + i, 'joueur:rejoindre', { code: code4, nom }));
  const salle4 = moteur4.salles.get(code4);
  moteur4.recevoir('TAB4', 'tablette:lancer', { mode: 'surprise' });
  const intro4 = dernier('TAB4', 'ecran').d.donnees;
  assert.ok(intro4.surprise && intro4.objectif >= Moteur.OBJECTIF_MIN && intro4.objectif <= Moteur.OBJECTIF_MAX);
  etape('surprise : une ligne d\'arrivée est tirée (' + intro4.objectif + ' points)');
  // Trois manches sans atteindre l'objectif, puis Mamie franchit la ligne pendant la troisième.
  for (let m = 1; m <= 3; m++) {
    await pause(60);
    if (m === 3) Array.from(salle4.joueurs.values())[0].score = salle4.objectif + 500;
    moteur4.recevoir('TAB4', 'tablette:terminer-jeu');
    const cl = dernier('TAB4', 'ecran').d.donnees;
    assert.ok(cl.commentaires.length >= 1, 'le commentateur parle');
    if (m < 3) { assert.ok(!cl.prochainFinale); moteur4.recevoir('TAB4', 'tablette:passer'); }
  }
  const apres3 = dernier('TAB4', 'ecran').d.donnees;
  assert.ok(apres3.prochainFinale && apres3.annonceFinale.type === 'objectif');
  for (let i = 1; i < salle4.programme.length; i++) assert.notStrictEqual(salle4.programme[i], salle4.programme[i - 1], 'jamais deux fois le même jeu de suite');
  etape('surprise : jeux tirés au sort sans doublon d\'affilée (' + salle4.programme.join(', ') + ')');
  etape('surprise : la ligne franchie déclenche la Grande Finale (« ' + apres3.annonceFinale.texte.slice(0, 40) + '… »)');
  moteur4.recevoir('TAB4', 'tablette:passer');
  assert.ok(dernier('TAB4', 'ecran').d.donnees.finale);
  await pause(60);
  moteur4.recevoir('TAB4', 'tablette:terminer-jeu');
  assert.ok(dernier('TAB4', 'ecran').d.donnees.dernier);
  moteur4.recevoir('TAB4', 'tablette:passer');
  assert.strictEqual(dernier('TAB4', 'ecran').d.type, 'gages-vote');
  moteur4.recevoir('TAB4', 'tablette:podium'); // l'animateur peut sauter le tribunal
  const podium4 = dernier('TAB4', 'ecran').d;
  assert.strictEqual(podium4.type, 'podium');
  assert.ok(podium4.donnees.prix.some((x) => x.icone === '🐢'));
  etape('surprise : après la finale, le podium et ses prix (' + podium4.donnees.prix.map((x) => x.titre).join(', ') + ')');

  // Sans personne à la ligne d'arrivée, la finale arrive quand même à la 6e manche.
  const code5 = moteur4.creerSalle('TAB5');
  ['Anna', 'Bob'].forEach((nom, i) => moteur4.recevoir('U' + i, 'joueur:rejoindre', { code: code5, nom }));
  moteur4.recevoir('TAB5', 'tablette:lancer', { mode: 'surprise' });
  let manches = 0;
  while (dernier('TAB5', 'ecran').d.type !== 'podium' && manches < 10) {
    await pause(60); manches++;
    moteur4.recevoir('TAB5', 'tablette:terminer-jeu');
    moteur4.recevoir('TAB5', 'tablette:passer');
    if (dernier('TAB5', 'ecran').d.type === 'gages-vote') moteur4.recevoir('TAB5', 'tablette:podium');
  }
  assert.strictEqual(manches, Moteur.MANCHES_MAX);
  etape('surprise : sans vainqueur, la partie s\'arrête après ' + manches + ' manches, finale comprise');

  // Feu vert ! (le jeu de réflexe), avec des attentes raccourcies pour le test.
  const Reflexe = require('../moteur/jeux/reflexe');
  Reflexe.reglagesTest = { attenteMin: 120, attenteMax: 200, piegeMs: 80, fenetreMs: 1200, resultatMs: 60 };
  const boiteR = (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) });
  const mr = new Moteur({ introMs: 30, probaInattendu: 0, envoyer: boiteR });
  const cr = mr.creerSalle('TR');
  ['Anna', 'Bob', 'Chloé'].forEach((nom, i) => mr.recevoir('R' + i, 'joueur:rejoindre', { code: cr, nom }));
  const sr = mr.salles.get(cr);
  mr.recevoir('TR', 'tablette:lancer', { programme: ['reflexe'] });
  await pause(60);
  const jr = sr.jeu;
  assert.strictEqual(dernier('TR', 'ecran').d.type, 'reflexe-attente');
  assert.strictEqual(dernier('R0', 'ecran').d.type, 'reflexe-bouton');
  const idR = (i) => dernier('R' + i, 'joueur:accepte').d.joueurId;
  sr.joueurs.get(idR(0)).score = 500;
  // Anna tape avant le vert : faux départ.
  mr.recevoir('R0', 'joueur:action', { type: 'tape', reflexe: null });
  assert.strictEqual(sr.joueurs.get(idR(0)).score, 400, 'faux départ : −100 points');
  // On attend le vert (en passant le piège éventuel)…
  for (let k = 0; k < 40 && jr.phase !== 'go'; k++) await pause(20);
  assert.strictEqual(jr.phase, 'go', 'le signal vert finit par arriver');
  await pause(380); // assez longtemps pour que les réflexes annoncés (205 et 310 ms) soient plausibles
  mr.recevoir('R2', 'joueur:action', { type: 'tape', reflexe: 310 });
  mr.recevoir('R1', 'joueur:action', { type: 'tape', reflexe: 205 });
  await pause(400);
  const resR = dernier('TR', 'ecran').d;
  assert.strictEqual(resR.type === 'reflexe-resultat' || resR.type === 'reflexe-attente', true);
  const tourUn = boites['TR'].filter((m) => m.e === 'ecran' && m.d.type === 'reflexe-resultat')[0].d.donnees;
  assert.deepStrictEqual(tourUn.classement.map((c) => c.nom), ['Bob', 'Chloé'], 'le plus rapide est premier');
  assert.deepStrictEqual(tourUn.classement.map((c) => c.points), [500, 350]);
  assert.strictEqual(tourUn.faux[0].nom, 'Anna');
  etape('feu vert : le plus rapide gagne 500, le deuxième 350, le faux départ coûte 100 points');
  // Taper sur le piège rouge est aussi un faux départ.
  jr.annulerMinuteurs(); jr.tour = 1; jr.tourSuivant(); jr.annulerMinuteurs(); jr.lancerPiege();
  const avantPiege = sr.joueurs.get(idR(1)).score;
  mr.recevoir('R1', 'joueur:action', { type: 'tape', reflexe: 250 });
  assert.strictEqual(sr.joueurs.get(idR(1)).score, avantPiege - 100);
  assert.strictEqual(jr.faux.get(idR(1)), 'piege');
  etape('feu vert : taper sur le piège rouge coûte aussi 100 points');
  mr.recevoir('TR', 'tablette:podium'); mr.recevoir('TR', 'tablette:podium');
  delete Reflexe.reglagesTest;

  // Les jeux fabriqués par le moteur : on en génère des centaines et on vérifie chaque réponse.
  const Memoire = require('../moteur/jeux/memoire');
  const Logique = require('../moteur/jeux/logique');
  const unique = (q) => assert.strictEqual(new Set(q.choix).size, q.choix.length, 'Choix en double : ' + JSON.stringify(q.choix));
  for (let k = 0; k < 300; k++) {
    for (const type of ['absent', 'present', 'position', 'compter']) {
      const niv = Memoire.NIVEAUX[k % Memoire.NIVEAUX.length];
      const q = Memoire.fabriquerManche(niv, type);
      unique(q); assert.strictEqual(q.choix.length, 4);
      const cases = q.illustration.lignes.flat();
      assert.strictEqual(cases.length, niv.colonnes * niv.lignes);
      const emoji = (txt) => txt.split(' ')[0];
      if (type === 'absent') { assert.ok(!cases.includes(emoji(q.choix[0]))); q.choix.slice(1).forEach((c) => assert.ok(cases.includes(emoji(c)))); }
      if (type === 'present') { assert.ok(cases.includes(emoji(q.choix[0]))); q.choix.slice(1).forEach((c) => assert.ok(!cases.includes(emoji(c)))); }
      if (type === 'compter') { const cible = q.question.match(/Combien de (.+?) y avait/)[1]; assert.strictEqual(String(cases.filter((c) => c === cible).length), q.choix[0]); }
      if (type === 'position') { const pos = { 'en haut à gauche': 0, 'en haut à droite': niv.colonnes - 1, 'en bas à gauche': (niv.lignes - 1) * niv.colonnes, 'en bas à droite': cases.length - 1, 'au centre': Math.floor(cases.length / 2) }; const nomPos = Object.keys(pos).find((n) => q.question.includes(n)); assert.strictEqual(cases[pos[nomPos]], emoji(q.choix[0])); }
    }
    for (const famille of ['suite', 'motif', 'balance', 'intrus']) {
      const q = Logique.fabriquer[famille](k % 7);
      unique(q); assert.strictEqual(q.choix.length, 4, famille + ' : 4 choix');
      if (famille === 'balance') {
        // On résout la balance nous-mêmes, ligne par ligne, et on compare à la réponse annoncée.
        const val = {};
        q.illustration.lignes.slice(0, -1).forEach((l) => {
          const total = Number(l[l.length - 1]);
          const termes = l.slice(0, -2).filter((t) => t !== '+');
          const inconnus = termes.filter((t) => val[t] === undefined);
          const connus = termes.filter((t) => val[t] !== undefined).reduce((s2, t) => s2 + val[t], 0);
          val[inconnus[0]] = (total - connus) / inconnus.length;
        });
        assert.strictEqual(String(val[q.illustration.lignes[q.illustration.lignes.length - 1][0]]), q.choix[0], 'balance mal résolue');
      }
      if (famille === 'intrus') { const ligne = q.illustration.lignes[0]; assert.ok(ligne.includes(q.choix[0])); }
    }
  }
  etape('mémoire et casse-tête : 2 400 grilles et énigmes générées, toutes justes');
  // Une partie avec les trois nouveaux jeux : la grille à mémoriser arrive aussi sur les téléphones.
  const mn = new Moteur({ introMs: 30, probaInattendu: 0, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
  const cn = mn.creerSalle('TN');
  ['Anna', 'Bob'].forEach((nom, i) => mn.recevoir('N' + i, 'joueur:rejoindre', { code: cn, nom }));
  mn.recevoir('TN', 'tablette:lancer', { programme: ['memoire', 'logique', 'gastronomie'] });
  await pause(60);
  assert.strictEqual(dernier('TN', 'ecran').d.type, 'memoire-montre');
  assert.strictEqual(dernier('N0', 'ecran').d.type, 'memoire-montre');
  mn.recevoir('TN', 'tablette:passer'); // on saute la mémorisation
  assert.strictEqual(dernier('TN', 'ecran').d.type, 'qcm-question');
  assert.ok(!dernier('N0', 'ecran').d.donnees.vue.illustration, 'pendant la question, la grille est cachée');
  mn.recevoir('TN', 'tablette:passer');
  assert.ok(dernier('TN', 'ecran').d.donnees.illustration, 'à la révélation, la grille réapparaît');
  etape('mémoire d\'éléphant : la grille s\'affiche partout, disparaît pendant la question, revient à la réponse');
  mn.recevoir('TN', 'tablette:terminer-jeu'); mn.recevoir('TN', 'tablette:passer'); await pause(60);
  assert.ok(dernier('N1', 'ecran').d.donnees.vue.illustration, 'l\'énigme du casse-tête arrive sur le téléphone');
  etape('casse-tête : l\'énigme s\'affiche sur la tablette et les téléphones');
  mn.recevoir('TN', 'tablette:terminer-jeu'); mn.recevoir('TN', 'tablette:passer'); await pause(60);
  const vg = dernier('TN', 'ecran').d.donnees;
  assert.ok(vg.illustration && vg.illustration.apparitionMs, 'la recette mystère dévoile ses ingrédients un à un');
  etape('les Toqués : la recette mystère dévoile ses ingrédients un à un');
  mn.recevoir('TN', 'tablette:podium'); mn.recevoir('TN', 'tablette:podium');
  const gastro = require('../moteur/contenus/gastronomie');
  gastro.QUIZ.forEach(unique);
  assert.strictEqual(new Set(gastro.RECETTES.map((r) => r.plat)).size, gastro.RECETTES.length);
  gastro.RECETTES.forEach((r) => assert.ok(r.ingredients.length >= 3 && r.anecdote));
  etape(gastro.RECETTES.length + ' recettes mystère et ' + gastro.QUIZ.length + ' questions gourmandes bien formées');

  // Le blind test des tubes : la liste, le tirage, et ce que voient les téléphones.
  const tubes = require('../moteur/contenus/tubes');
  assert.strictEqual(new Set(tubes.map((t) => t.artiste + '|' + t.titre)).size, tubes.length, 'Un tube est en double');
  tubes.forEach((t) => assert.ok(t.titre && t.artiste && t.annee >= 1960 && t.annee <= 2026, 'Tube mal formé : ' + JSON.stringify(t)));
  const BlindTest = require('../moteur/jeux/blindtest');
  const decs = new Set(BlindTest.tirerTubes().map((t) => Math.floor(t.annee / 10)));
  assert.ok(decs.size >= 6, 'le tirage traverse les époques');
  const mb = new Moteur({ introMs: 30, probaInattendu: 0, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
  const cb = mb.creerSalle('TB');
  ['Anna', 'Bob'].forEach((nom, i) => mb.recevoir('B' + i, 'joueur:rejoindre', { code: cb, nom }));
  mb.recevoir('TB', 'tablette:lancer', { programme: ['blindtest', 'drapeaux'] });
  await pause(60);
  const vueB = dernier('TB', 'ecran').d.donnees;
  assert.ok(vueB.extrait && vueB.extrait.artiste && vueB.extrait.titre, 'la tablette reçoit la chanson à chercher');
  const vueTelB = dernier('B0', 'ecran').d.donnees.vue;
  assert.ok(!vueTelB.extrait, 'le téléphone ne reçoit pas la chanson jouée (pas de triche)');
  etape('blind test : ' + tubes.length + ' tubes de 1960 à aujourd\'hui, la tablette seule sait quelle chanson est jouée');
  // Extrait introuvable : la question est sautée ; trois fois d'affilée, le jeu s'arrête de lui-même.
  const sb = mb.salles.get(cb);
  for (let k = 0; k < 3; k++) {
    mb.recevoir('TB', 'tablette:signal', { type: 'extrait-indisponible', numero: sb.jeu.index });
    await pause(900);
  }
  assert.strictEqual(dernier('TB', 'ecran').d.type, 'info-jeu', 'sans Internet, la tablette le dit clairement');
  etape('blind test : un extrait introuvable est sauté, et sans Internet le jeu passe la main');
  mb.recevoir('TB', 'tablette:terminer-jeu'); mb.recevoir('TB', 'tablette:passer'); await pause(60);
  const vueD = dernier('B1', 'ecran').d.donnees.vue;
  assert.ok(vueD.drapeau && vueD.drapeau.formes.length, 'le drapeau arrive sur le téléphone');
  mb.recevoir('TB', 'tablette:podium'); mb.recevoir('TB', 'tablette:podium');
  const drapeaux = require('../moteur/contenus/drapeaux');
  const Drapeaux = require('../moteur/jeux/drapeaux');
  assert.strictEqual(new Set(drapeaux.map((d) => d.pays)).size, drapeaux.length);
  drapeaux.forEach((d) => { assert.ok(d.formes.length && d.teintes, d.pays); const so = Drapeaux.sosies(d); assert.strictEqual(new Set(so).size, 3); assert.ok(!so.includes(d.pays)); });
  etape('drapeaux : ' + drapeaux.length + ' drapeaux dessinés, chacun avec trois sosies trompeurs');
  // Le grand mélange : huit questions de thèmes différents, qui s'affichent et se corrigent toutes.
  const mm = new Moteur({ introMs: 30, probaInattendu: 0, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
  const cm = mm.creerSalle('TM');
  ['Anna', 'Bob'].forEach((nom, i) => mm.recevoir('M' + i, 'joueur:rejoindre', { code: cm, nom }));
  mm.recevoir('TM', 'tablette:lancer', { programme: ['melange'] });
  await pause(60);
  const jm = mm.salles.get(cm).jeu;
  const themes = jm.questions.map((q) => q.theme.id);
  assert.ok(new Set(themes).size >= 5, 'au moins cinq thèmes différents');
  for (let i = 1; i < themes.length; i++) assert.notStrictEqual(themes[i], themes[i - 1], 'deux fois le même thème d\'affilée');
  for (let i = 0; i < jm.questions.length; i++) {
    const vq = dernier('TM', 'ecran').d;
    assert.strictEqual(vq.type, 'qcm-question');
    assert.ok(vq.donnees.surtitre.startsWith('🔀'));
    const bonneM = jm.questions[jm.index].bonne;
    mm.recevoir('M0', 'joueur:action', { type: 'reponse', choix: bonneM });
    mm.recevoir('TM', 'tablette:passer');
    assert.ok(dernier('M0', 'ecran').d.donnees.juste, 'la bonne réponse est reconnue (thème ' + themes[i] + ')');
    mm.recevoir('TM', 'tablette:passer');
  }
  etape('grand mélange : ' + themes.join(' → '));
  mm.recevoir('TM', 'tablette:podium'); mm.recevoir('TM', 'tablette:podium');

  // L'alternance : en partie surprise, deux manches qui se suivent ne sont jamais de la même famille.
  {
    const mt = new Moteur({ envoyer: () => {} });
    const fam = Moteur.FAMILLES;
    const sal = { programme: [], joueurs: new Map([['a', { connecte: true }], ['b', { connecte: true }], ['c', { connecte: true }]]) };
    for (let k = 0; k < 400; k++) sal.programme.push(mt.tirerJeu(sal));
    for (let k = 1; k < sal.programme.length; k++) assert.notStrictEqual(fam[sal.programme[k]], fam[sal.programme[k - 1]], 'deux jeux de la même famille d\'affilée : ' + sal.programme[k - 1] + ' puis ' + sal.programme[k]);
    assert.strictEqual(new Set(sal.programme).size, Moteur.FICHES.length, 'tous les jeux finissent par sortir');
    const debut = sal.programme.slice(0, 13);
    assert.ok(new Set(debut).size >= 11, 'sur 13 manches, presque aucun jeu ne revient');
    const menu = mt.espacerFamilles(['quiz', 'humour', 'reflexe', 'blindtest', 'fousrires', 'drapeaux']);
    let collees = 0; for (let k = 1; k < menu.length; k++) if (fam[menu[k]] === fam[menu[k - 1]]) collees++;
    assert.ok(collees <= 1 && menu.length === 6);
    etape('alternance : jamais deux jeux de la même famille d\'affilée (ex. ' + sal.programme.slice(0, 6).join(' → ') + ')');
  }

  // En solo : on peut lancer seul, sans gage, et ni le dessin ni les fous rires ne sortent du chapeau.
  {
    const ms = new Moteur({ introMs: 20, classementMs: 40, probaInattendu: 1, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
    const cs = ms.creerSalle('TS');
    ms.recevoir('S0', 'joueur:rejoindre', { code: cs, nom: 'Solo' });
    ms.recevoir('TS', 'tablette:lancer', { mode: 'surprise' });
    const ss = ms.salles.get(cs);
    assert.ok(['intro', 'jeu'].includes(ss.etat), 'une partie se lance avec un seul joueur');
    assert.ok(!Array.from(ss.joueurs.values())[0].gage, 'pas de gage quand on joue seul');
    const tirages = [];
    for (let k = 0; k < 60; k++) tirages.push(ms.tirerJeu(ss));
    assert.ok(!tirages.includes('dessin') && !tirages.includes('fousrires'), 'les jeux à plusieurs sont mis de côté en solo');
    // Une manche entière en solo, jusqu'au classement, sans erreur.
    for (let k = 0; k < 40 && ss.etat !== 'classement'; k++) { ms.recevoir('TS', 'tablette:passer'); await pause(5); }
    assert.strictEqual(ss.etat, 'classement', 'la manche solo va jusqu\'au classement');
    ms.recevoir('TS', 'tablette:lancer', { programme: ['dessin', 'quiz'] });
    assert.deepStrictEqual(ss.programme, ['quiz'], 'en « Je choisis », le dessin est sauté si l\'on est seul');
    ms.recevoir('TS', 'tablette:podium'); ms.recevoir('TS', 'tablette:podium');
    etape('solo : on joue dès 1 joueur (pas de gage, pas de dessin ni de fous rires, tout le reste fonctionne)');
  }

  // Le fil des thèmes (mode solo) : une série « grand mélange », puis un jeu d'action, et ainsi de suite.
  {
    const mf2 = new Moteur({ envoyer: () => {} });
    const sf2 = { programme: [], filDesThemes: true, joueurs: new Map([['a', { connecte: true }]]) };
    for (let k = 0; k < 12; k++) sf2.programme.push(mf2.tirerJeu(sf2));
    sf2.programme.forEach((id, k) => assert.ok(k % 2 === 0 ? id === 'melange' : ['reflexe', 'memoire', 'erreurs'].includes(id), 'ordre inattendu : ' + sf2.programme.join(', ')));
    assert.strictEqual(new Set(sf2.programme.filter((id, k) => k % 2)).size, 3, 'les trois jeux d\'action passent à tour de rôle');
    etape('fil des thèmes (solo) : ' + sf2.programme.slice(0, 6).join(' → '));
  }

  // La mémoire anti-répétition : on revoit une question seulement après avoir vu toutes les autres.
  {
    const QUIZ = require('../moteur/contenus/quiz');
    const tous = QUIZ.filter((q) => q.public === 'tous');
    outils.memoire.oublier();
    const vues = [];
    for (let k = 0; k < Math.floor(tous.length / 4); k++) vues.push(...outils.tirerNeuf('quiz-tous', tous, 4).map((q) => q.question));
    assert.strictEqual(new Set(vues).size, vues.length, 'aucune question ne revient avant que toutes soient passées');
    const sauvegarde = JSON.parse(JSON.stringify(outils.memoire.exporter()));
    outils.memoire.oublier(); outils.memoire.importer(sauvegarde);
    const suivante = outils.tirerNeuf('quiz-tous', tous, 1)[0].question;
    assert.ok(!vues.includes(suivante) || vues.length >= tous.length - 1, 'la mémoire survit à un enregistrement');
    outils.memoire.oublier();
    const total = ['quiz', 'humour', 'tubes', 'dessins', 'gages', 'zoom'].map((n) => require('../moteur/contenus/' + n).length);
    const g = require('../moteur/contenus/gastronomie'), fr = require('../moteur/contenus/fousrires');
    etape('répertoire : ' + total[0] + ' questions de quiz, ' + total[1] + ' pièges, ' + g.RECETTES.length + ' recettes, ' + g.QUIZ.length + ' questions gourmandes, ' + total[2] + ' tubes, ' + total[3] + ' mots à dessiner, ' + total[4] + ' gages, ' + total[5] + ' images, ' + fr.AMORCES.length + ' phrases à compléter, ' + fr.DEVINETTES.length + ' devinettes — sans répétition avant d\'avoir tout vu');
  }

  // Calcul mental : 3 000 calculs fabriqués, chacun refait de son côté par le test.
  {
    const Calcul = require('../moteur/jeux/calcul');
    let n = 0;
    for (let k = 0; k < 300; k++) Object.entries(Calcul.FABRIQUES).forEach(([genre, f]) => {
      const q = f(k % 3);
      const attendu = Function('return (' + q.verif + ')')();
      assert.strictEqual(q.valeur, attendu, genre + ' : ' + q.verif);
      assert.strictEqual(q.choix.length, 4, genre + ' : quatre réponses');
      assert.strictEqual(new Set(q.choix).size, 4, genre + ' : réponses toutes différentes ' + q.choix.join(' / '));
      if (!q.enCentimes) assert.strictEqual(q.choix[0], String(attendu), genre + ' : la bonne réponse en premier');
      n++;
    });
    const mc = new Moteur({ introMs: 20, probaInattendu: 0, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
    const cc = mc.creerSalle('TC');
    mc.recevoir('C0', 'joueur:rejoindre', { code: cc, nom: 'Solo' });
    mc.recevoir('TC', 'tablette:lancer', { programme: ['calcul'] });
    await pause(60);
    const sc = mc.salles.get(cc);
    mc.recevoir('C0', 'joueur:action', { type: 'reponse', choix: sc.jeu.questions[0].bonne });
    mc.recevoir('TC', 'tablette:passer');
    assert.ok(dernier('C0', 'ecran').d.donnees.juste, 'le bon calcul rapporte des points');
    assert.ok(require('../moteur/jeux/melange').THEMES.some((T) => T.fiche.id === 'calcul'), 'le calcul fait partie du grand mélange');
    mc.recevoir('TC', 'tablette:podium');
    etape('calcul mental : ' + n + ' calculs fabriqués et vérifiés, il entre dans le grand mélange');
  }

  // Les quatre nouveaux thèmes : contenus bien formés, puis une question jouée de chacun.
  {
    const EN = require('../moteur/contenus/enigmes');
    assert.ok(EN.ENIGMES.length >= 25 && EN.MOTS.length >= 40 && EN.FARFELU.length >= 20);
    EN.ENIGMES.forEach((q) => { assert.strictEqual(q.choix.length, 4, q.question); assert.strictEqual(new Set(q.choix).size, 4, q.question); assert.ok(q.explication, q.question); });
    const motsVus = new Set();
    EN.MOTS.forEach(([def, mot, ...leurres]) => {
      assert.ok(def && /^[A-Z]+$/.test(mot), mot);
      assert.ok(!motsVus.has(mot), 'mot en double : ' + mot); motsVus.add(mot);
      assert.strictEqual(leurres.length, 3, mot);
      assert.strictEqual(new Set([mot, ...leurres]).size, 4, mot);
      leurres.forEach((l) => { assert.ok(/^[A-Z]+$/.test(l), l); assert.strictEqual(l.length, mot.length, mot + ' / ' + l); assert.strictEqual(l[0], mot[0], mot + ' / ' + l); });
    });
    EN.FARFELU.forEach((f) => { assert.strictEqual(f.length, 4, f[0]); assert.strictEqual(new Set(f).size, 4, f[0]); });
    const Puzzle = require('../moteur/jeux/puzzle');
    for (let i = 0; i < 200; i++) { const o = Puzzle.desordre(); assert.ok(o.every((x, k) => x !== k) && new Set(o).size === 9); }
    const THEMES = require('../moteur/jeux/melange').THEMES.map((T) => T.fiche.id);
    for (const id of ['enigmes', 'motscroises', 'puzzle', 'vraifarfelu']) {
      assert.ok(THEMES.includes(id), id + ' fait partie du grand mélange');
      const mn = new Moteur({ introMs: 20, probaInattendu: 0, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
      const cn = mn.creerSalle('TN' + id);
      mn.recevoir('N' + id, 'joueur:rejoindre', { code: cn, nom: 'Solo' });
      mn.recevoir('TN' + id, 'tablette:lancer', { programme: [id] });
      await pause(60);
      const sn = mn.salles.get(cn);
      assert.strictEqual(sn.etat, 'jeu', id);
      const q = sn.jeu.questions[sn.jeu.index];
      assert.strictEqual(new Set(q.choix).size, 4, id);
      const ecran = dernier('N' + id, 'ecran').d;
      assert.strictEqual(ecran.type, 'qcm-choix', id);
      if (id === 'puzzle') assert.ok(ecran.donnees.vue.puzzle && ecran.donnees.vue.puzzle.ordre.length === 9, 'le téléphone reçoit le puzzle');
      if (id === 'motscroises') assert.strictEqual(ecran.donnees.vue.illustration.lignes[0].length, q.mot.length, 'une case par lettre');
      mn.recevoir('N' + id, 'joueur:action', { type: 'reponse', choix: q.bonne });
      await pause(700);
      const res = dernier('N' + id, 'ecran').d;
      assert.strictEqual(res.type, 'qcm-resultat', id);
      assert.ok(res.donnees.juste && res.donnees.points > 0, id + ' : la bonne réponse rapporte des points');
      if (id === 'puzzle') assert.ok(res.donnees.puzzle && res.donnees.puzzle.fini, 'le puzzle terminé est montré au résultat');
      mn.recevoir('TN' + id, 'tablette:podium');
    }
    etape('énigmes (' + EN.ENIGMES.length + '), mots croisés (' + EN.MOTS.length + '), puzzle et Vrai ou Farfelu (' + EN.FARFELU.length + ') : bien formés, jouables et dans le grand mélange');
  }

  // La vraie pause ⏸ : en pleine question, le temps s'arrête… puis repart avec le temps qu'il restait.
  {
    const mp = new Moteur({ introMs: 20, probaInattendu: 0, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
    const cp = mp.creerSalle('TP');
    mp.recevoir('P0', 'joueur:rejoindre', { code: cp, nom: 'Solo' });
    mp.recevoir('TP', 'tablette:lancer', { programme: ['quiz'] });
    await pause(60);
    const sp = mp.salles.get(cp);
    assert.strictEqual(sp.etat, 'jeu');
    const finAvant = sp.jeu.finA;
    const indexAvant = sp.jeu.index;
    mp.recevoir('TP', 'tablette:figer');
    assert.ok(dernier('P0', 'evenement').d.type === 'fige', 'le téléphone apprend que tout est en pause');
    mp.recevoir('P0', 'joueur:action', { type: 'reponse', choix: 0 });
    assert.strictEqual(sp.jeu.reponses.size, 0, 'en pause, une touche ne compte pas');
    await pause(400);
    mp.recevoir('TP', 'tablette:relancer');
    assert.ok(sp.jeu.finA - finAvant >= 380, 'la fin de la question est repoussée de la durée de la pause');
    assert.strictEqual(sp.jeu.index, indexAvant, 'on reprend sur la même question');
    const ecranRepris = dernier('P0', 'ecran').d;
    assert.strictEqual(ecranRepris.type, 'qcm-choix');
    assert.strictEqual(ecranRepris.donnees.finA, sp.jeu.finA, 'le téléphone reçoit le nouveau compte à rebours');
    assert.strictEqual(sp.jeu.minuteurs.size, 1, 'le réveil de fin de question est reprogrammé');
    mp.recevoir('TP', 'tablette:figer'); mp.recevoir('TP', 'tablette:podium'); mp.recevoir('TP', 'tablette:podium');
    assert.ok(!sp.figeA, 'quitter pendant une pause lève la pause');
    etape('pause ⏸ : en pleine question tout s\'arrête, puis repart avec le temps qu\'il restait');
  }

  // Les Fous Rires : contenus bien formés, puis un tour de chaque sorte joué de bout en bout.
  const FR = require('../moteur/contenus/fousrires');
  assert.ok(FR.AMORCES.length >= 30 && FR.DEVINETTES.length >= 25 && FR.JOKERS.length >= 20);
  FR.AMORCES.forEach((a) => assert.ok(a.amorce && a.maison && a.maison.length <= 80, a.amorce));
  FR.DEVINETTES.forEach((q) => { assert.strictEqual(q.choix.length, 4, q.question); assert.strictEqual(new Set(q.choix).size, 4, q.question); assert.ok(q.explication, q.question); });
  FR.JOKERS.forEach((j) => assert.ok(j.length <= 80));
  const mf = new Moteur({ introMs: 30, probaInattendu: 0, envoyer: (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) }) });
  const cf = mf.creerSalle('TF');
  ['Anna', 'Bob', 'Chloé'].forEach((nom, i) => mf.recevoir('F' + i, 'joueur:rejoindre', { code: cf, nom }));
  mf.recevoir('TF', 'tablette:lancer', { programme: ['fousrires'] });
  await pause(60);
  const sf = mf.salles.get(cf);
  const idF = (i) => Array.from(sf.joueurs.values())[i].id;
  // Tour 1 : la devinette absurde (le moule JeuQCM).
  assert.strictEqual(dernier('TF', 'ecran').d.type, 'qcm-question');
  const bonneF = sf.jeu.sousJeu.questions[0].bonne;
  mf.recevoir('F0', 'joueur:action', { type: 'reponse', choix: bonneF });
  mf.recevoir('TF', 'tablette:passer');
  assert.ok(dernier('F0', 'ecran').d.donnees.juste && sf.joueurs.get(idF(0)).score > 0, 'la devinette rapporte des points');
  mf.recevoir('TF', 'tablette:passer');
  // Tour 2 : chacun écrit, et le vote s'ouvre tout seul quand tout le monde a écrit.
  assert.strictEqual(dernier('TF', 'ecran').d.type, 'rire-ecriture');
  assert.strictEqual(dernier('F1', 'ecran').d.type, 'rire-ecrire');
  assert.ok(dernier('F1', 'ecran').d.donnees.jokers.length >= 3, 'des jokers pour ceux qui sèchent');
  mf.recevoir('F0', 'joueur:action', { type: 'ecrit', texte: '<b>Une poule</b> en roller' });
  mf.recevoir('F1', 'joueur:action', { type: 'ecrit', texte: 'Un hamster ministre' });
  mf.recevoir('F2', 'joueur:action', { type: 'ecrit', texte: 'Tonton, évidemment' });
  await pause(1000);
  const vueVote = dernier('TF', 'ecran').d;
  assert.strictEqual(vueVote.type, 'rire-vote');
  assert.strictEqual(vueVote.donnees.reponses.length, 4, 'trois réponses + celle de la maison');
  assert.ok(vueVote.donnees.reponses.every((r) => !('auteurId' in r) && !r.auteur), 'les réponses sont anonymes');
  assert.ok(vueVote.donnees.reponses.every((r) => !/[<>]/.test(r.texte)), 'les chevrons sont retirés');
  const optionsF0 = dernier('F0', 'ecran').d.donnees.reponses;
  assert.strictEqual(optionsF0.length, 3, 'on ne peut pas voter pour soi');
  const options = sf.jeu.options;
  const deBob = options.find((o) => o.auteurId === idF(1));
  const deAnna = options.find((o) => o.auteurId === idF(0));
  mf.recevoir('F0', 'joueur:action', { type: 'vote', option: deAnna.id }); // refusé : c'est la sienne
  assert.ok(!sf.jeu.votes.has(idF(0)), 'voter pour soi est refusé');
  const avantBob = sf.joueurs.get(idF(1)).score;
  mf.recevoir('F0', 'joueur:action', { type: 'vote', option: deBob.id });
  mf.recevoir('F2', 'joueur:action', { type: 'vote', option: deBob.id });
  mf.recevoir('F1', 'joueur:action', { type: 'vote', option: deAnna.id });
  await pause(800);
  const res = dernier('TF', 'ecran').d;
  assert.strictEqual(res.type, 'rire-resultat');
  assert.strictEqual(res.donnees.lignes[0].auteur.nom, 'Bob', 'la réponse la plus votée est en tête, avec son auteur');
  assert.strictEqual(sf.joueurs.get(idF(1)).score - avantBob, 500, '250 points par vote');
  assert.ok(res.donnees.lignes.some((l) => l.maison), 'la réponse de la maison est révélée');
  assert.strictEqual(dernier('F1', 'ecran').d.donnees.mesVotes, 2);
  etape('fous rires : écriture, vote anonyme (pas pour soi), 250 points par vote, la maison démasquée');
  // Tour 4 (après une devinette) : tout le monde vote pour la même réponse → fou rire général.
  mf.recevoir('TF', 'tablette:passer'); // → devinette
  mf.recevoir('TF', 'tablette:passer'); mf.recevoir('TF', 'tablette:passer'); // devinette révélée puis terminée
  assert.strictEqual(dernier('TF', 'ecran').d.type, 'rire-ecriture');
  mf.recevoir('F0', 'joueur:action', { type: 'ecrit', texte: 'Un pingouin en tongs' });
  mf.recevoir('TF', 'tablette:passer'); // on n'attend pas les autres
  const deAnna2 = sf.jeu.options.find((o) => o.auteurId === idF(0));
  assert.strictEqual(sf.jeu.options.length, 2, 'une seule réponse écrite + la maison');
  const avantAnna = sf.joueurs.get(idF(0)).score;
  mf.recevoir('F1', 'joueur:action', { type: 'vote', option: deAnna2.id });
  mf.recevoir('F2', 'joueur:action', { type: 'vote', option: deAnna2.id });
  mf.recevoir('TF', 'tablette:passer');
  assert.ok(dernier('TF', 'ecran').d.donnees.fouRire, 'fou rire général annoncé');
  assert.strictEqual(sf.joueurs.get(idF(0)).score - avantAnna, 2 * 250 + 300);
  etape('fous rires : unanimité = « fou rire général » (+300), et on peut avancer sans attendre les retardataires');
  for (let k = 0; k < 6; k++) mf.recevoir('TF', 'tablette:passer');
  assert.strictEqual(sf.etat, 'classement', 'après six tours, le jeu passe la main');
  mf.recevoir('TF', 'tablette:podium'); mf.recevoir('TF', 'tablette:podium');

  // Garde-fous : le serveur accepte bien tous les messages que le moteur sait traiter…
  const fs = require('fs'), path = require('path');
  const srcMoteur = fs.readFileSync(path.join(__dirname, '..', 'moteur', 'moteur.js'), 'utf8');
  const srcServeur = fs.readFileSync(path.join(__dirname, '..', 'serveur.js'), 'utf8');
  const traites = new Set((srcMoteur.match(/case '((?:tablette|joueur):[a-z-]+)'/g) || []).map((m) => m.slice(6, -1)));
  const acceptes = new Set((srcServeur.match(/MESSAGES_ACCEPTES = new Set\(\[([\s\S]*?)\]\)/)[1].match(/'[^']+'/g) || []).map((m) => m.slice(1, -1)));
  traites.forEach((m) => assert.ok(acceptes.has(m), 'Le serveur refuse le message « ' + m + ' » que le moteur sait traiter'));
  // … et le simulateur charge chaque fichier du moteur APRÈS ceux dont il a besoin.
  const srcSimu = fs.readFileSync(path.join(__dirname, '..', 'public', 'simulateur.html'), 'utf8');
  const charges = new Set();
  (srcSimu.match(/src="moteur\/[^"]+"/g) || []).forEach((m) => {
    const fichier = m.slice(5, -1);
    const code = fs.readFileSync(path.join(__dirname, '..', fichier), 'utf8');
    (code.match(/exiger\('([^']+)'\)/g) || []).forEach((e) => {
      const besoin = e.slice(8, -2).replace(/^(\.\.?\/)+/, '');
      assert.ok(charges.has(besoin), fichier + ' a besoin de « ' + besoin + ' », qui doit être chargé avant lui dans simulateur.html');
    });
    charges.add(code.match(/\}\)\(this, '([^']+)'/)[1]);
  });
  ['jeux/blindtest', 'jeux/drapeaux', 'jeux/melange', 'jeux/fousrires', 'jeux/calcul', 'jeux/memoire', 'jeux/logique', 'jeux/gastronomie', 'jeux/reflexe'].forEach((n) => assert.ok(charges.has(n), n + ' manque au simulateur'));
  etape('garde-fous : le serveur accepte tous les messages du moteur, le simulateur charge tout dans le bon ordre');

  // Le défi inattendu et l'enchaînement automatique.
  const boite = (cid, e, d) => (boites[cid] = boites[cid] || []).push({ e, d: JSON.parse(JSON.stringify(d)) });
  for (const type of ['trefle', 'quitte', 'duel']) {
    const m = new Moteur({ introMs: 30, classementMs: 150, probaInattendu: 1, typeInattendu: type, envoyer: boite });
    const c = m.creerSalle('TI-' + type);
    ['Anna', 'Bob', 'Chloé'].forEach((nom, i) => m.recevoir('I' + type + i, 'joueur:rejoindre', { code: c, nom }));
    const sl = m.salles.get(c);
    m.recevoir('TI-' + type, 'tablette:lancer', { programme: ['quiz', 'humour'] });
    const inat = dernier('TI-' + type, 'ecran').d.donnees.inattendu;
    assert.ok(inat && inat.type === type && inat.joueur, 'un défi inattendu est annoncé');
    assert.strictEqual(dernier('I' + type + '0', 'ecran').d.donnees.inattendu.type, type);
    await pause(60);
    const elu = sl.joueurs.get(inat.joueur.id);
    if (type === 'trefle') {
      // Les points de l'élu comptent double.
      const credit = sl.ctx.ajouterPoints(elu.id, 400);
      assert.strictEqual(credit, 800);
    } else if (type === 'quitte') {
      sl.ctx.ajouterPoints(elu.id, 1000); // il fait la meilleure manche
    } else {
      const adv = sl.joueurs.get(inat.adversaire.id);
      sl.ctx.ajouterPoints(adv.id, 1000); sl.ctx.ajouterPoints(elu.id, 300); // l'adversaire gagne le duel
    }
    const scores = () => Object.fromEntries(Array.from(sl.joueurs.values()).map((j) => [j.id, j.score]));
    const avant = scores();
    m.recevoir('TI-' + type, 'tablette:terminer-jeu');
    const res = dernier('TI-' + type, 'ecran').d.donnees.resultatInattendu;
    assert.ok(res && res.texte, 'le résultat du défi inattendu est annoncé');
    const apres = scores();
    if (type === 'quitte') assert.ok(apres[elu.id] - avant[elu.id] >= 1000 - 1, 'quitte ou double : les points de la manche doublent');
    if (type === 'duel') { assert.strictEqual(res.vainqueurId, inat.adversaire.id, 'le plus fort de la manche gagne le duel'); assert.ok(apres[elu.id] <= avant[elu.id], 'le perdant du duel se fait voler des points'); }
    etape('défi inattendu « ' + inat.titre + ' » : ' + res.texte);
    // Le classement enchaîne tout seul sur la manche suivante.
    await pause(250);
    assert.strictEqual(dernier('TI-' + type, 'ecran').d.type === 'intro' || sl.etat === 'jeu', true, 'la manche suivante démarre toute seule');
    m.recevoir('TI-' + type, 'tablette:podium'); m.recevoir('TI-' + type, 'tablette:podium');
  }
  etape('après le classement, la manche suivante démarre toute seule');
  // La pause arrête l'enchaînement automatique.
  const mp = new Moteur({ introMs: 30, classementMs: 100, probaInattendu: 0, envoyer: boite });
  const cp = mp.creerSalle('TP');
  ['Anna', 'Bob'].forEach((nom, i) => mp.recevoir('P' + i, 'joueur:rejoindre', { code: cp, nom }));
  mp.recevoir('TP', 'tablette:lancer', { programme: ['quiz', 'humour'] });
  await pause(60);
  mp.recevoir('TP', 'tablette:terminer-jeu');
  mp.recevoir('TP', 'tablette:pause');
  await pause(250);
  assert.strictEqual(mp.salles.get(cp).etat, 'classement');
  mp.recevoir('TP', 'tablette:podium'); mp.recevoir('TP', 'tablette:podium');
  etape('le bouton pause garde le classement affiché');

  // Reconnexion
  const id = dernier('T2', 'joueur:accepte').d.joueurId;
  const scoreAvant = salle.joueurs.get(id).score;
  moteur.deconnexion('T2');
  moteur.recevoir('T2bis', 'joueur:rejoindre', { code, joueurId: id });
  assert.strictEqual(salle.joueurs.get(id).score, scoreAvant);
  assert.strictEqual(dernier('T2bis', 'ecran').d.type, 'podium');
  etape('un téléphone qui se reconnecte retrouve sa place et son score');

  // Les contenus
  const quiz = require('../moteur/contenus/quiz');
  const humour = require('../moteur/contenus/humour');
  const images = require('../moteur/contenus/zoom');
  [...quiz, ...humour].forEach((q) => assert.ok(q.choix.length >= 3 && new Set(q.choix).size === q.choix.length, 'Choix en double : ' + q.question));
  const parFamille = {};
  images.forEach((im) => {
    assert.ok(im.sujet && im.famille && (im.image || im.photo), 'Image incomplète : ' + JSON.stringify(im));
    if (im.photo) assert.ok(require('fs').existsSync(require('path').join(__dirname, '..', 'public', im.photo)), 'Photo introuvable : public/' + im.photo);
    parFamille[im.famille] = (parFamille[im.famille] || 0) + 1;
  });
  Object.entries(parFamille).forEach(([f, n]) => assert.ok(n >= 4, 'La famille « ' + f + ' » doit avoir au moins 4 images'));
  assert.strictEqual(new Set(images.map((im) => im.sujet)).size, images.length, 'Deux images ont le même sujet');
  etape(quiz.length + ' questions de quiz, ' + humour.length + ' pièges et ' + images.length + ' images du zoom bien formés');

  // Neuro'Mania : le catalogue est lisible, chaque thème et chaque programme a un nom, et les liens restent sûrs.
  {
    const fsN = require('fs'), pathN = require('path');
    const cat = JSON.parse(fsN.readFileSync(pathN.join(__dirname, '..', 'neuromania', 'catalogue.json'), 'utf8'));
    assert.ok(Array.isArray(cat.themes) && cat.themes.length, 'au moins un thème');
    const ids = new Set();
    let n = 0;
    cat.themes.forEach((t) => {
      assert.ok(t.id && t.nom && !ids.has(t.id), 'thème mal formé ou en double : ' + t.id); ids.add(t.id);
      (t.programmes || []).forEach((p) => {
        n++;
        assert.ok(p.id && p.nom, 'programme sans nom dans ' + t.nom);
        (p.liens || []).forEach((l) => {
          assert.ok(/^\/(?!\/)/.test(l.adresse) || /^https:\/\//.test(l.adresse), 'lien refusé : ' + l.adresse);
          const m = /^\/programmes\/([^/]+)/.exec(l.adresse);
          if (m) assert.ok(fsN.existsSync(pathN.join(__dirname, '..', 'neuromania', 'programmes', m[1], 'index.html')), 'programme introuvable : ' + l.adresse);
        });
      });
    });
    etape('Neuro\'Mania : ' + cat.themes.length + ' thème(s), ' + n + ' programme(s), catalogue bien formé');
  }

  console.log('\nTout est en ordre. Bonne soirée !\n');
  process.exit(0);
})().catch((e) => { console.error('\n✗ Échec :', e.message, '\n'); process.exit(1); });
