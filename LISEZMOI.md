# SEX’ACT · SEX’PLIQUE · IST’ORY & VIH’GILANCE
# Le labo des savoirs — mode d'emploi

*VIH & IST · Le jeu où la connaissance fait la différence !*

Un jeu sur le VIH et les IST pour étudiants infirmiers (Centre S).
Un écran pour la classe (ordinateur relié au projecteur, ou tablette), un téléphone par élève.
Les élèves scannent le QR code affiché à l'écran : rien à installer sur leur téléphone.

## Ce qu'il faut

- Un ordinateur avec **Node.js** (gratuit, version 18 ou plus récente : https://nodejs.org, bouton « LTS »).
- Une connexion Internet sur cet ordinateur, pour afficher le QR code et les polices.
  Sans Internet, le jeu fonctionne quand même : l'écran affiche l'adresse et le code de la partie en grand.

Aucune autre installation n'est nécessaire.

## Solution 1 : en classe, sur votre ordinateur

1. Décompressez le dossier `le-labo-des-savoirs` sur l'ordinateur.
2. Ouvrez un terminal dans ce dossier :
   - Windows : dans l'Explorateur, ouvrez le dossier, tapez `cmd` dans la barre d'adresse, puis Entrée.
   - Mac : clic droit sur le dossier › « Nouveau terminal au dossier ».
3. Tapez `node serveur.js`, puis Entrée. Le terminal affiche une adresse, par exemple `http://192.168.1.20:3000`.
4. Ouvrez cette adresse dans le navigateur, et projetez-la. Le QR code et le code de la partie apparaissent.
5. Les élèves scannent le QR code avec l'appareil photo de leur téléphone.
6. Quand tout le monde est là, choisissez les jeux et touchez « Lancer la partie ».

Pour arrêter le jeu : Ctrl + C dans le terminal.

**Important : le réseau.** Les téléphones doivent être sur **le même Wi-Fi** que l'ordinateur.
Beaucoup de Wi-Fi « invités » d'écoles et d'hôpitaux empêchent les appareils de se parler entre eux.
Si les téléphones n'arrivent pas à se connecter :
- activez le **partage de connexion** de votre téléphone, connectez-y l'ordinateur et demandez aux élèves de s'y connecter aussi (pratique pour un petit groupe) ;
- ou utilisez la solution 2.

## Solution 2 (conseillée) : en ligne, un QR code fixe qui marche partout

Le jeu tourne sur Internet, à une adresse fixe en https. Tous les téléphones (iPhone, Android…) le rejoignent en 4G ou sur n'importe quel Wi-Fi, quel que soit l'endroit. Rien à installer sur les téléphones.

Mise en ligne (une seule fois, environ 15 minutes, gratuit) :

1. Créez un compte gratuit sur https://github.com, puis un dépôt **privé** nommé `le-labo-des-savoirs`.
   Sur la page du dépôt : « uploading an existing file », glissez TOUT le contenu de ce dossier (dossiers compris), puis « Commit changes ».
2. Créez un compte gratuit sur https://render.com en choisissant « Sign in with GitHub ».
3. Sur Render : « New › Blueprint », choisissez le dépôt `le-labo-des-savoirs`, puis « Apply ».
   Render lit le fichier `render.yaml` : rien d'autre à régler.
4. Quelques minutes plus tard, Render affiche l'adresse du jeu, du type `https://le-labo-des-savoirs.onrender.com`.

Les adresses à retenir (remplacez par la vôtre) :

- `https://…onrender.com` : l'écran de la classe (à ouvrir sur l'ordinateur projeté).
- `https://…onrender.com/jouer` : **le QR code fixe à imprimer une fois pour toutes**. Il mène toujours à la partie ouverte le plus récemment.
- `https://…onrender.com/solo` : seul·e ou à plusieurs sur un téléphone.

Avant le cours : sur l'offre gratuite, le service s'endort après 15 minutes sans visite. Ouvrez l'écran de la classe 1 à 2 minutes avant : il se réveille, puis reste éveillé pendant toute la partie.

Sécurité : aucune application à installer, connexion chiffrée (https, cadenas), aucun module extérieur côté serveur, seuls les fichiers du jeu sont servis. Le jeu ne demande qu'un prénom, gardé en mémoire et effacé au plus tard 4 heures après la partie.

## Le Wi-Fi du jeu (facultatif)

Si les étudiants doivent d'abord rejoindre un réseau (partage de connexion, réseau invités…), l'écran de la classe peut afficher **deux QR codes** : ① le Wi-Fi, ② le jeu.
Dans le salon, ouvrez « Afficher aussi le QR code du Wi-Fi », cochez « Afficher le Wi-Fi » et tapez le nom du réseau et son mot de passe (au moins 8 caractères pour un partage de connexion). L'ordinateur s'en souvient pour la fois suivante ; changez simplement le mot de passe après chaque séance.
Votre ordinateur doit être connecté à ce même réseau.

## Pendant la partie

- **17 mini-jeux** tirés du support théorique et du support d'activités, rangés en **4 familles** (cochez-les famille par famille, ou « Tout / Aucun ») :
  - **VIH’GILANCE** : le thermomètre, vrai ou faux, le juste chiffre ;
  - **SEX’PLIQUE** : le VIH de A à Z, IST bactériennes, hépatites, herpès/HPV, le marché des IST, dans l'ordre ;
  - **IST’ORY** : le saviez-vous ? (faits historiques de 1495 à 2012) et la frise du temps ;
  - **SEX’ACT** : risque ou pas, en consultation, feu tricolore, vers qui orienter, fausses bonnes idées (toujours en dernier).
- **🎲 Partie aléatoire** : un bouton dans le salon lance 3 manches « Tourbillon » où les thèmes se mélangent question après question (la dernière manche compte double).
- **La Cible 🎯** : avant chaque jeu, chaque élève reçoit un défi personnel sur son téléphone (+300 points s'il est réussi).
- **La Grande Finale ⚡** : le dernier jeu compte double.
- Après chaque question, la **correction** s'affiche à l'écran.
- À la fin : **le corrigé** de toutes les questions, des plus ratées aux mieux réussies (en rouge : celles réussies par moins de la moitié du groupe). Chaque élève garde **son carnet de corrections** sur son téléphone.
- De 2 à 30 joueurs. Un téléphone en veille retrouve sa place et son score.

## Mode solo (réviser seul·e sur son téléphone)

Ouvrez `/solo` (par exemple `http://localhost:3000/solo`, ou l'adresse en ligne + `/solo`).
Pas de défis : on avance au bouton après chaque correction, et le bilan donne le carnet d'erreurs.

**À plusieurs sur un seul téléphone (2 à 4)** : choisissez « À plusieurs » et entrez les prénoms. Chacun répond à son tour (« À toi, Amina ! »), sans voir les réponses des autres, puis la correction s'affiche. Le temps est allongé et il n'y a pas de bonus de vitesse, pour que ce soit équitable. À la fin : podium, vainqueur, confettis, un carnet de corrections par joueur et un bouton « Revanche ! ».
La partie aléatoire est aussi disponible en solo et à plusieurs.
Le mode solo est aussi publié sur claude.ai ; pour que les étudiants l'ouvrent avec le QR code, partagez-le en **lien public** (menu Partager).

## Essayer seul·e avec des robots

Ouvrez `http://localhost:3000/simulateur` : l'écran de la classe et un téléphone côte à côte, avec des robots.

## Les couleurs

Le jeu est aux couleurs de la charte du Centre S (pervenche #8383F7, rose, rouge, orange, bleu, crème).
La palette d'origine, « nuit », est conservée : ajoutez `?palette=nuit` à l'adresse pour la retrouver
(et `?palette=centre-s` pour revenir). Le choix est retenu sur l'appareil.

## Modifier les questions

Toutes les questions sont dans `moteur/contenus/questions.js`.
La bonne réponse est toujours écrite en premier (le jeu mélange les réponses tout seul).
Vérifiez les chiffres et les traitements dans les recommandations en vigueur.

Les jeux tirés du support d'activités sont dans `moteur/contenus/activites.js`.
**À valider avant le premier cours :** les couleurs attendues de « Feu vert, orange, rouge » (champ `feu`)
et les ressources attendues de « Vers qui orienter ? » (la bonne réponse est la première des `choix`).
