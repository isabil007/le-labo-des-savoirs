# Mettre Neuro'Mania en ligne (sans l'ordinateur)

Une fois en ligne, Neuro'Mania a sa propre adresse internet, par exemple
**https://neuromania.onrender.com**. Elle marche partout : à la maison,
chez les grands-parents, en 4G… sans allumer l'ordinateur ni partager le Wi-Fi.

- **https://neuromania.onrender.com/** : la page d'accueil, avec tous les thèmes ;
- **…/tablette**, **…/jouer**, **…/solo** : La guerre des neurones, comme avant ;
- **…/autour-de-la-table** : la présentation du jeu.

Le service est **gratuit**. Une seule contrepartie : après 15 minutes sans
visite, le site « s'endort ». La première personne qui l'ouvre ensuite
attend **environ une minute**, puis tout va vite. Astuce : ouvrez la page
d'accueil un peu avant de jouer.

## Ce qu'il faut : deux comptes gratuits

1. **GitHub** (github.com) : le « coffre » où sont rangés les fichiers du site.
2. **Render** (render.com) : l'ordinateur en ligne qui fait tourner le site.

C'est vous qui créez ces comptes (avec votre adresse e-mail et un mot de
passe que vous choisissez). Claude ne crée jamais de compte à votre place.

## Les étapes

**1. Créer le coffre sur GitHub**
- Créez votre compte sur github.com.
- Cliquez sur **« + »** en haut à droite, puis **« New repository »**.
- Nom : `neuromania`. Laissez le reste tel quel. Cliquez **« Create repository »**.
- Dites à Claude : « mon dépôt GitHub s'appelle *votre-nom*/neuromania ».
  Claude y range alors tous les fichiers pour vous.

**2. Brancher Render**
- Sur render.com, cliquez **« Get Started »** et choisissez **« GitHub »** pour vous inscrire
  (Render vous demande la permission de lire votre coffre : acceptez).
- Cliquez **« New + »**, puis **« Blueprint »**, et choisissez le dépôt `neuromania`.
  Render lit le fichier `render.yaml` et règle tout seul : Node, gratuit, démarrage.
- Cliquez **« Apply »** et patientez 2 à 3 minutes. L'adresse du site s'affiche en haut
  (quelque chose comme `https://neuromania-xxxx.onrender.com`).

C'est tout ! Ouvrez cette adresse sur la tablette : la page Neuro'Mania apparaît.

## Ajouter un thème ou un programme plus tard

Demandez simplement à Claude : « ajoute le thème *Cuisine* avec mon programme *X* ».
Claude modifie `neuromania/catalogue.json` (et range le programme dans
`neuromania/programmes/`), puis le publie. Render remet le site à jour tout seul,
et **les pages déjà ouvertes affichent la nouveauté sans qu'on les rafraîchisse**
(une bulle « ✨ Nouveau sur Neuro'Mania » apparaît).

## Et sur l'ordinateur ?

Rien ne change : LANCER-LE-JEU fonctionne comme avant, sur le Wi-Fi de la maison.
L'adresse de l'ordinateur ouvre maintenant la page Neuro'Mania ; le jeu reste
à …/tablette, …/jouer et …/solo (les affiches QR codes restent valables).
