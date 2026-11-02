# CLAUDE.md — La guerre des neurones (« Jeu dis, Jeu fais ! ») & « Autour de la table »

Ce fichier est lu automatiquement par Claude Code au début de chaque session. Il résume le projet, ses commandes et ses règles, pour ne pas avoir à tout réexpliquer.

## Qui travaille sur ce projet

La propriétaire du projet n'est pas développeuse de métier. Elle apprend en avançant.
- Réponds et commente **en français**, avec des mots simples ; explique brièvement ce que tu fais et pourquoi.
- Avant une modification importante (nouvelle dépendance, changement d'architecture, suppression de fichiers), décris le plan en quelques lignes et demande son accord.
- Après chaque modification, lance `npm test` et dis clairement si tout est en ordre. Le test ne vérifie que le moteur et les contenus : **toute modification visuelle** (tablette, téléphones, site) doit aussi être vérifiée dans le simulateur (`/simulateur.html`).
- **Sauvegarde avec git** : après chaque étape qui fonctionne (tests au vert), propose un enregistrement (`git add -A` puis `git commit -m "…"` avec un message en français qui dit ce qui a changé). Si le dossier n'est pas encore un dépôt git, propose d'abord `git init` et un premier enregistrement. Explique à la propriétaire comment revenir en arrière si besoin.
- En fin de séance, mets à jour la section « Où on en est » ci-dessous.

## Où on en est

*À tenir à jour à chaque séance de travail.*

- **Fait** : les mini-jeux d'origine, le simulateur avec robots, le site « Autour de la table », le test automatique.
- **Fait (novembre 2026)** : le « piment ». Avant chaque manche, chaque joueur reçoit un **défi 🎯** sur son téléphone (le premier défend sa couronne, les autres doivent dépasser le joueur juste devant eux, ou finir dans le haut de la manche quand tout le monde est à égalité), avec une prime de 300 points. Les dépassements sont annoncés en direct (vibration + bulle). La dernière manche est la **Grande Finale ⚡** : tous les points y comptent double. Le chrono bat dans les 5 dernières secondes.
- **Fait (novembre 2026)** : QR code de la salle généré sur place (`public/js/qrcode.js`), un nouveau à chaque partie ; bouton « 📱 QR code » sur la tablette pour les retardataires ; fichiers `.bat` à double-cliquer pour installer et lancer le jeu.
- **Fait (novembre 2026)** : on peut jouer **dès 2 joueurs** (minimum par défaut passé de 4 à 2), puis **dès 1 joueur** (voir plus bas).
- **Fait (novembre 2026)** : la **partie surprise 🎲** (mode par défaut) : jeux tirés au sort « en sac » (jamais deux fois de suite), ligne d'arrivée tirée entre 8 000 et 11 000 points, finale déclenchée quand le premier la franchit (au plus tôt après 3 manches, au plus tard à la 6e) ; **commentateur** taquin et **prix** au podium (`moteur/contenus/commentaires.js`) ; **gages secrets 🤫** distribués au lancement et jugés par vote au **tribunal des gages** avant le podium (+1 500 points, `moteur/contenus/gages.js`).
- **Fait (novembre 2026)** : adresses faciles : le serveur essaie le **port 80** (sinon 3000), répond au nom **tablee.local** (`nom-local.js`, mDNS fait maison) et aux chemins courts **/jouer** et **/tablette**. Le QR code garde l'adresse en chiffres (la plus sûre). `OUVRIR=tablette` ouvre la page au démarrage (utilisé par les .bat).
- **Fait (novembre 2026)** : le **blind test est remplacé par le zoom infernal 🔎** (`moteur/jeux/zoom.js`) : l'image se dézoome au rythme du chrono (courbe exponentielle, point de départ tiré au hasard), une seule réponse par joueur, 200 à 1 000 points selon la rapidité.
- **Fait (novembre 2026)** : **enchaînement automatique** (classement → manche suivante après `classementMs` = 20 s, bouton « ⏸ Pause » → `tablette:pause`) ; **défi inattendu 🎰** (`tirerInattendu` / `resoudreInattendu` : quitte ou double, duel éclair, trèfle ; ~40 % des manches, jamais le même joueur deux fois de suite ; `probaInattendu` et `typeInattendu` réglables pour les tests) ; **petits mots écrits** dans les réactions (champ `texte`, 80 caractères, nettoyé côté moteur, toujours affiché en `textContent`).
- **Fait (novembre 2026)** : **Feu vert ! 🚦** (`moteur/jeux/reflexe.js`), jeu de réflexe en 7 tours : attente imprévisible (cœur qui bat, sons graves), parfois un piège rouge, puis flash vert. Le téléphone mesure lui-même le réflexe (`performance.now`, `pointerdown`) et le moteur le borne (≥ 90 ms, ≤ temps écoulé + 60 ms) ; barème 500/350/250/150, faux départ −100. `Reflexe.reglagesTest` raccourcit les temps pour les tests.
- **Fait (novembre 2026)** : **tout le contenu arrive aussi sur les téléphones** (question, image du zoom, dessin en direct, explication, plus rapides, top 3, commentateur, podium) ; option **« 🔀 Ordre au hasard »** en mode « Je choisis » (`melanger: true`).
- **Fait (novembre 2026)** : trois jeux **générés par le moteur** : **Mémoire d'éléphant 🐘** (`jeux/memoire.js`, phase `memoire-montre` avant chaque question, grille 6 → 9 → 12), **Casse-tête 🧩** (`jeux/logique.js` : suites, motifs, balances, intrus), **Les Toqués 👨‍🍳** (`jeux/gastronomie.js` + `contenus/gastronomie.js` : recette mystère à ingrédients progressifs + quiz gourmand). Rendu commun `GT.illustration` (commun.js) ; `vueRevelation(q)` dans JeuQCM pour montrer autre chose à la réponse. Le test génère 2 400 grilles/énigmes et vérifie chaque réponse.
- **Fait (novembre 2026)** : **Blind test des tubes 🎵** (80 tubes 1960 → 2023, extraits Apple joués à la volée), **Drapeaux du monde 🚩** (55 drapeaux dessinés en SVG par `GT.drapeau`, sosies trompeurs par couleurs communes), **Le grand mélange 🔀** (`jeux/melange.js` : emprunte des questions aux autres jeux QCM et les fait afficher par leur jeu d'origine ; ajouter un thème = ajouter son nom à `THEMES`). Bug corrigé : `tablette:pause` n'était pas accepté par le serveur ; un test vérifie désormais que `MESSAGES_ACCEPTES` couvre tous les messages du moteur, et que `simulateur.html` charge chaque module après ses dépendances.
- **Fait (novembre 2026)** : **nouveau nom** « La guerre des neurones — Jeu dis, Jeu fais ! » partout (pages, site, .bat, présentation) ; **Les Fous Rires 🤪** (`jeux/fousrires.js` + `contenus/fousrires.js`) : 6 tours alternant devinette absurde (une mini-partie `JeuQCM` d'une question, à qui l'on prête un `ctx` dont `terminer` relance le tour suivant) et « invente la suite » (écriture 60 s avec bouton 🎲 Joker → vote anonyme 30 s, jamais pour soi, + la réponse de « la maison » → résultat : 250/vote, +300 si unanime). Écrans `rire-*` sur tablette et téléphones ; textes des joueurs nettoyés et toujours affichés en `textContent`.
- **Fait (novembre 2026)** : **alternance des familles de jeux** (`FAMILLES` dans moteur.js : questions, cerveau, œil, réflexe, création, rire, musique) : en partie surprise, `tirerJeu` ne sort jamais deux jeux de la même famille d'affilée ; en « Je choisis » + ordre au hasard, `espacerFamilles` fait de même autant que possible. Le sac de tirage est gardé d'une partie à l'autre dans la même salle : la revanche commence par les jeux pas encore joués.
- **Fait (novembre 2026)** : **compte à rebours des 3 dernières secondes** (`GT.annoncerDecompte` dans commun.js, déclenché par `GT.chrono` sauf option `calme`) : bord rouge qui pulse partout, chiffre géant sur la tablette (`GT.chiffreGeant`), bips 3-2-1 + buzzer (`GT.musique.decompte`, arpège joyeux pour le départ d'un jeu : option `depart`), vibrations sur les téléphones. **Musique de fond** générée en direct (`GT.ambiance` dans musique.js : décompte avec grosse caisse + tic-tac qui accélère + explosion ; volumes normal / doux pendant la réflexion / muet pendant blind test et Feu vert !). Boutons 🔔 Décompte et 🎵 Musique toujours présents dans le bandeau de la tablette, choix retenus (`son-decompte`, `musique-fond`).
- **Fait (novembre 2026)** : **on joue dès 1 joueur** (`minJoueurs` = 1 par défaut, moteur et serveur) : en solo, pas de gage, et les jeux dont la fiche demande `minJoueurs: 2` (dessin, fous rires) sont écartés du tirage et du menu « Je choisis » (fonction `jouable`). **Nouvelle musique** (`GT.ambiance`) : une chanson originale structurée (intro 4 mesures → refrain 8 → couplet 8 → refrain+ 8 → pont 4, en boucle), mélodie écrite en MIDI dans `REFRAIN`, accords la m / fa / do / sol, monte d'un ton à chaque tour, `GT.ambiance.finale(true)` accélère (134 bpm) et monte de 2 tons pendant la Grande Finale (déclenché par l'écran `intro` de la finale).
- **Fait (novembre 2026)** : **mode solo à un seul QR code** (optionnel) : `public/solo.html` (adresse courte `/solo`) = la page joueur + `js/solo.js`, chargé AVANT joueur.js. solo.js ouvre une 2e WebSocket qui joue le rôle de « tablette invisible » (`tablette:creer`/`reprendre` avec le code gardé dans `solo-code`, `tablette:lancer` surprise, `tablette:nouvelle` pour Rejouer), suit les écrans de la tablette pour la musique (`GT.ambiance`), le son du décompte et les extraits du blind test sur le haut-parleur du téléphone. joueur.js s'adapte si `GT.solo` existe (pas de champ code, écran d'accueil solo `GT.solo.ecranSalon`, bouton Rejouer au podium). Les affiches QR ont désormais 3 codes : tablette, joueurs, solo.
- **Fait (novembre 2026)** : **la vraie pause ⏸** (bouton rond en mode solo, pause automatique quand on quitte l'écran du téléphone) : `tablette:figer` / `tablette:relancer` → `moteur.figer/relancer` ; `Jeu.figer()` arrête tous les réveils (`minuteurs` est maintenant une Map minuteur → { tache, echeance }) et `Jeu.relancer()` les reprogramme avec le temps restant en décalant toute propriété horodatée du jeu (> 1e12) ; le moteur décale `finA`/`autoFinA`/`debut` des écrans mémorisés et les renvoie. Pendant la pause, `joueur:action` est ignoré ; toute autre commande de la tablette lève la pause.
- **Fait (novembre 2026)** : en solo, **bouton ⏭ Suivant** (au-dessus de ⏸, envoie `tablette:passer` : révèle la réponse, puis question suivante ; anti double-toucher 700 ms) et **« fil des thèmes »** (`tablette:lancer` avec `filDesThemes: true`) : `tirerJeu` alterne une série « grand mélange » (chaque question d'un thème différent) et un jeu d'action tiré de `JEUX_ACTION` (reflexe, memoire, erreurs), à tour de rôle.
- **Fait (novembre 2026)** : **quatre nouveaux thèmes** (tous des `JeuQCM`, tous dans le grand mélange, contenus dans `contenus/enigmes.js`) : **Les Énigmes 🕵️** (`jeux/enigmes.js`, famille « cerveau », 30 énigmes avec `explication`) ; **Mots croisés ✏️** (`jeux/motscroises.js`, famille « mots », MOTS = [définition, mot, 3 leurres de même longueur et même initiale, en capitales sans accents — vérifié par le test], cases affichées par `GT.illustration` avec `ill.mot` → classe `.ill-mot`, une seule ligne) ; **Le Puzzle 🖼️** (`jeux/puzzle.js`, famille « oeil », images de la banque du zoom, `vue.puzzle = {image|photo, ordre, tours, rythme, fini}` dessiné par `GT.puzzle` dans commun.js : 9 pièces qui glissent en place pendant 70 % du temps ; `JeuQCM.reveler` transmet `puzzle` au téléphone) ; **Vrai ou Farfelu ? 🤡** (`jeux/vraifarfelu.js`, famille « rire », FARFELU = [vraie, 3 inventées], 22 faits vrais). Mémoire anti-répétition : catégories 'enigmes', 'motscroises', 'puzzle', 'farfelu'.
- **Fait (novembre 2026)** : **blind test muet en solo corrigé** : sur téléphone (surtout iPhone), le synthétiseur Web Audio empêchait l'extrait d'Apple de se faire entendre. `GT.musique.silence(true)` met le contexte audio en veille (`suspend`) pendant les écrans `qcm-question`/`qcm-revelation` qui portent un `extrait`, puis le réveille (tablette et solo) ; `navigator.audioSession.type = 'playback'` quand c'est possible ; en solo, si le téléphone refuse de jouer sans toucher (`NotAllowedError`), un bouton « 🔊 Touche ici pour écouter » apparaît au lieu de sauter la question. **Calcul mental 🧮** (`jeux/calcul.js`, famille « cerveau », dans le grand mélange) : 8 calculs générés (addition, table, double/moitié, soustraction, division, pourcentage, priorités, monnaie), leurres = erreurs typiques, champ `verif` recalculé par le test (2 400 calculs).
- **Fait (novembre 2026)** : **Neuro'Mania**, la page d'accueil de tous les programmes (à la racine `/` ; « Autour de la table » passe à `/autour-de-la-table`). `neuromania/index.html` lit `neuromania/catalogue.json` (thèmes → programmes → liens ; adresses `/…` ou `https://` seulement) via `/api/catalogue` puis reste à l'écoute de `/api/catalogue/flux` (Server-Sent Events) : le serveur surveille le fichier (`fs.watch`) et pousse chaque changement à toutes les pages ouvertes, qui se redessinent sans rafraîchir (bulle « ✨ Nouveau », carte mise en avant) ; un catalogue mal écrit est ignoré (on garde la dernière version correcte). Les programmes statiques se rangent dans `neuromania/programmes/<id>/index.html` (servis à `/programmes/<id>/`). Le test vérifie le catalogue.
- **À faire ensuite** : tester une vraie soirée sur tablette + iPhone + Samsung ; choisir un hébergeur ; enrichir les questions ; ajouter d'autres jeux au site.
- **Idées en attente** : (à compléter par la propriétaire)

## Le projet en bref

- **La guerre des neurones — Jeu dis, Jeu fais !** (anciennement « La Grande Tablée » ; le dossier et quelques noms internes gardent `la-grande-tablee` / `GT`) : jeu intergénérationnel pour 1 à 12 joueurs. Une tablette sert de plateau, chaque joueur utilise son téléphone (iPhone ou Android) dans le navigateur, sans rien installer.
- Dix-huit mini-jeux : quiz, dessine et devine, 7 erreurs en 1 minute, zoom infernal, pièges du français, Feu vert ! (réflexe), Mémoire d'éléphant, Casse-tête (logique), Les Toqués (gastronomie), Blind test des tubes, Drapeaux du monde, Le grand mélange, Les Fous Rires, Calcul mental, Les Énigmes, Mots croisés, Le Puzzle, Vrai ou Farfelu ?.
- **Autour de la table** (`public/index.html`) : le site « ludothèque » qui présente les jeux et doit pouvoir en accueillir d'autres.

## Commandes

| Commande | Effet |
|---|---|
| `npm install` | installe la seule dépendance (`ws`) |
| `npm start` | lance le serveur (port 80, ou 3000 si le 80 est pris) et affiche les adresses à taper |
| `set MIN_JOUEURS=1` puis `npm start` | permet de tester avec un seul téléphone |
| `npm test` | joue une partie complète automatiquement et vérifie les contenus |

Ces commandes se tapent dans **l'invite de commandes Windows (`cmd`)**, ouverte depuis le dossier du projet (taper `cmd` dans la barre d'adresse de l'Explorateur). Toutes les explications, ici comme dans le LISEZ-MOI, utilisent cette syntaxe : ne pas mélanger avec celle de PowerShell (`$env:…`) ni celle de Mac/Linux (`NOM=valeur npm start`).

Le simulateur (`/simulateur.html`) fait tourner tout le jeu dans le navigateur, avec des robots : pratique pour vérifier une modification visuellement.

## Architecture

```
serveur.js            Serveur HTTP (Node natif) + WebSocket (ws) sur /ligne. Ne contient AUCUNE règle de jeu.
nom-local.js          Répond au nom « tablee.local » sur le Wi-Fi (mDNS), sans dépendance.
moteur/moteur.js      Chef d'orchestre : salles (code 4 lettres), joueurs, scores, enchaînement des jeux,
                      défis 🎯 (preparerDefis, verifierDefis, jugerDefis), Grande Finale ⚡ (finaleIndex, multiplicateur),
                      partie surprise 🎲 (tirerObjectif, tirerJeu), commentateur et prix (commenter, decernerPrix),
                      gages secrets 🤫 (tirerGage, finDePartie, gageSuivant, voterGage, jugerGage).
                      États d'une salle : salon → intro → jeu → classement → … → gages → podium.
moteur/jeux/base.js   Classes Jeu et JeuQCM (quiz, zoom et humour héritent de JeuQCM).
moteur/jeux/*.js      Un fichier par mini-jeu, chacun avec une « fiche » statique (id, nom, icône, règle).
moteur/contenus/*.js  Les banques de questions, mots et mélodies.
public/               Ce que voient les appareils (tablette.html, joueur.html, simulateur.html, index.html).
public/solo.html + js/solo.js  Le mode solo : un seul téléphone fait tablette ET manette (adresse …/solo).
public/js/extraits.js  Les extraits du blind test : recherche iTunes (JSONP) et lecture depuis Apple (tablette seulement).
public/js/            connexion.js (WebSocket ou postMessage en simulateur), commun.js, scene.js (paysages SVG),
                      toile.js (dessin), musique.js (synthé Web Audio), tablette.js, joueur.js, simulateur.js,
                      qrcode.js (générateur de QR code fait maison : fonctionne sans Internet, ne pas remplacer par un CDN).
*.bat                 INSTALLER, LANCER-LE-JEU, ESSAYER-AVEC-DES-ROBOTS : à double-cliquer sous Windows, sans taper de commande.
tests/partie-complete.js  Test de bout en bout du moteur, sans dépendance.
```

Principes à respecter :
- **Le moteur est indifférent au transport.** Il reçoit `recevoir(connexionId, evenement, donnees)` et envoie via la fonction `envoyer` qu'on lui fournit. Il tourne à la fois dans Node et dans le navigateur (simulateur).
- **Chaque fichier du dossier `moteur/` porte un emballage UMD** en tête : `module.exports` dans Node, `window.GT.modules[nom]` dans le navigateur. Les `exiger('../chemin')` doivent, une fois débarrassés des `./` et `../`, correspondre exactement au nom d'enregistrement (`'contenus/quiz'`, `'jeux/base'`, `'outils'`…). Un nouveau fichier du moteur doit aussi être ajouté, dans le bon ordre, à la liste des `<script>` de `public/simulateur.html`.
- **Les jeux ne parlent qu'au contexte `ctx`** (voir l'en-tête de `moteur/jeux/base.js`) : `ecranTablette`, `ecranJoueur`, `evenementTablette`, `ajouterPoints`, `terminer`…
- **Les points passent toujours par `ctx.ajouterPoints`**, qui applique le multiplicateur de la Grande Finale et **renvoie le montant réellement crédité** : c'est ce montant-là qu'un jeu doit afficher (`const points = this.ctx.ajouterPoints(id, bareme)`). Un nouveau jeu n'a rien d'autre à faire pour profiter des défis et de la finale.
- **Le serveur fait autorité** : scores, vérification des réponses et des touches se calculent côté moteur, jamais côté téléphone.
- **Les écrans** sont des fonctions de rendu par type (`RENDUS` dans tablette.js, `ECRANS` dans joueur.js) ; les mises à jour légères passent par des « événements ».

## Conventions

- **Commentaires en français, en prose claire** (« syntaxe littéraire ») : chaque fichier commence par un bloc qui explique son rôle, chaque fonction importante par une phrase qui dit ce qu'elle fait et pourquoi. Garde ce style dans tout nouveau code.
- **Noms de variables et de fonctions en français** (`joueur`, `afficherTour`, `ajouterPoints`).
- **Contenus** : dans `quiz.js` et `humour.js`, la bonne réponse est **toujours écrite en premier** ; le jeu mélange les choix. Vérifie l'exactitude des faits avant d'ajouter une question.
- **Jeunesse / sagesse** : chaque question du quiz porte un champ `public` : `'jeunes'` (question « jeunesse », sur la culture des enfants et ados), `'aînés'` (question « sagesse », sur ce que les grands-parents connaissent mieux) ou `'tous'`. Chaque partie tire 2 questions jeunesse, 2 sagesse et 4 pour tous : c'est le cœur de l'esprit intergénérationnel. Toute nouvelle question doit recevoir le bon `public`, et il faut garder assez de questions dans chaque catégorie (au moins le double de ce qui est tiré).
- **Zoom infernal** (`moteur/contenus/zoom.js`) : des pictogrammes (émojis, dessinés par l'appareil) ou des photos **que la propriétaire a le droit de diffuser**, rangées dans `public/zoom/`. Jamais d'image trouvée sur Internet. Chaque famille compte au moins 4 images (les intrus sont pris dans la même famille).
- **Blind test des tubes** (`contenus/tubes.js`) : la liste ne contient QUE titre, artiste et année. La tablette cherche l'extrait officiel de 30 s chez Apple (API de recherche iTunes, en JSONP : `public/js/extraits.js`) et le joue depuis Apple : ne jamais télécharger, copier ni embarquer de fichier audio, jamais de paroles. Usage familial et privé. Les téléphones ne reçoivent pas le titre joué (`vueJoueur`). Extrait introuvable → `tablette:signal` `extrait-indisponible` → question sautée ; 3 échecs d'affilée → le jeu passe la main. L'ancien `contenus/blindtest.js` (mélodies) n'est plus utilisé. `public/js/musique.js` sert aux bruitages de Feu vert ! (`GT.musique.bip`), au compte à rebours et à la musique de fond (`GT.ambiance`, composée en direct : ne jamais y mettre de morceau existant).
- **Public intergénérationnel** : humour bienveillant, rien de gênant pour des enfants ; grands caractères, contrastes forts, réponses repérables par la couleur ET par la forme (▲ ◆ ● ■).
- **Compatibilité** : pages web standard, testées sur Safari iOS et Chrome Android. Pas de framework ni d'étape de compilation ; garder le projet léger.
- **Sécurité** : tout texte saisi par un joueur est inséré avec `textContent` (fonction `GT.h`), jamais en HTML.

## Recettes fréquentes

**Ajouter des questions** : copier une fiche dans `moteur/contenus/quiz.js` ou `humour.js`, bonne réponse en premier, puis `npm test`.

**Ajouter un mini-jeu à La guerre des neurones** :
1. Créer `moteur/jeux/mon-jeu.js` (hériter de `Jeu` ou `JeuQCM`, définir une `fiche` statique).
2. L'ajouter à la liste des jeux en haut de `moteur/moteur.js`.
3. Ajouter ses écrans dans `public/js/tablette.js` (RENDUS) et `public/js/joueur.js` (ECRANS).
4. Ajouter le `<script>` dans `public/simulateur.html` et, si besoin, apprendre aux robots de `public/js/simulateur.js` à y jouer.
5. Compléter `tests/partie-complete.js`.

**Ajouter un autre jeu au site « Autour de la table »** : ranger ses fichiers dans `public/jeux/<nom>/` et ajouter sa fiche à la liste `CATALOGUE` de `public/index.html`. Le site crée tout seul la carte, la page `#nom` et la page plein écran `#jouer-nom`.

## Mettre en ligne

Le serveur lit `PORT` et `ADRESSE_PUBLIQUE` (adresse publique utilisée dans le QR code). Tout hébergeur qui accepte Node.js et les WebSockets convient : commande d'installation `npm install`, de démarrage `npm start`.

**Hébergeur choisi : Render (gratuit), en cours d'installation (novembre 2026).** Guide pas à pas pour la propriétaire : `PUBLIER-EN-LIGNE.md`. `render.yaml` (Blueprint : Node 20, plan free, `npm install` / `npm start`, contrôle de santé `/api/catalogue`). Le site s'endort après 15 min sans visite (≈ 1 min au réveil). Le serveur déduit l'adresse publique (https) de l'en-tête Host + `x-forwarded-proto` : pas besoin d'`ADRESSE_PUBLIQUE`. Une fois le choix fait, noter ici :
- le nom de l'hébergeur et l'adresse du jeu en ligne ;
- le dépôt GitHub relié (le cas échéant) ;
- les variables réglées (`ADRESSE_PUBLIQUE`, éventuellement `MIN_JOUEURS`) ;
- comment publier une nouvelle version (par exemple : « un `git push` suffit, l'hébergeur redéploie tout seul »).
