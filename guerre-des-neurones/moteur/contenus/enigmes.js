/*
 * ════════════════════════════════════════════════════════════════════
 *  CONTENU — Énigmes 🕵️, Mots croisés ✏️ et Vrai ou Farfelu ? 🤡
 * ════════════════════════════════════════════════════════════════════
 *
 *  ENIGMES : des énigmes de logique et des questions-pièges, celles qui
 *  font dire « Mais bien sûr ! » une fois la réponse connue. Comme
 *  partout, la bonne réponse est écrite EN PREMIER (le jeu mélange).
 *
 *  MOTS : des définitions façon mots croisés. Le jeu montre la première
 *  lettre et le nombre de cases ; les trois leurres ont la même première
 *  lettre et la même longueur (le test le vérifie) : seule la définition
 *  permet de trouver. Les mots s'écrivent en capitales, sans accents,
 *  comme dans une vraie grille.
 *
 *  FARFELU : une seule affirmation est vraie, les trois autres sont
 *  inventées (et absurdes). Les vraies sont étonnantes mais exactes :
 *  vérifiez toujours un fait avant d'en ajouter un.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/enigmes', function () {
  'use strict';

  const ENIGMES = [
    { question: 'Le père de Marie a cinq filles : Lala, Lélé, Lili, Lolo… Comment s’appelle la cinquième ?', choix: ['Marie', 'Lulu', 'Lyly', 'Lala'], explication: 'C’est écrit dès le début : c’est le père de MARIE !' },
    { question: 'Qu’est-ce qui est le plus lourd : un kilo de plumes ou un kilo de plomb ?', choix: ['Les deux pèsent pareil', 'Le plomb', 'Les plumes', 'Ça dépend du vent'], explication: 'Un kilo, c’est un kilo. Les plumes prennent juste beaucoup plus de place.' },
    { question: 'Un fermier a 17 moutons. Tous s’échappent sauf 9. Combien lui en reste-t-il ?', choix: ['9', '8', '17', '0'], explication: '« Tous sauf 9 » : il en reste donc 9.' },
    { question: 'Combien de mois de l’année ont 28 jours ?', choix: ['Tous les douze', 'Un seul', 'Deux', 'Quatre'], explication: 'Tous les mois ont AU MOINS 28 jours… février s’arrête là, les autres continuent.' },
    { question: 'Dans une course, tu doubles le deuxième. À quelle place es-tu ?', choix: ['Deuxième', 'Premier', 'Troisième', 'Dernier'], explication: 'Tu prends SA place : la deuxième. Le premier est toujours devant !' },
    { question: 'Combien d’animaux de chaque espèce Moïse a-t-il emmenés dans son arche ?', choix: ['Aucun, c’était Noé', 'Deux', 'Un', 'Sept'], explication: 'Dans le récit, c’est Noé qui construit l’arche, pas Moïse. Le cerveau corrige tout seul… et se fait piéger.' },
    { question: 'Je commence la nuit et je termine le matin. Qui suis-je ?', choix: ['La lettre N', 'Un rêve', 'Le hibou', 'Le pyjama'], explication: 'Nuit commence par N, matin finit par N !' },
    { question: 'Une grenouille est au fond d’un puits de 10 mètres. Le jour, elle monte de 3 mètres ; la nuit, elle glisse de 2 mètres. Quel jour sort-elle ?', choix: ['Le 8e jour', 'Le 10e jour', 'Le 5e jour', 'Le 9e jour'], explication: 'Au soir du 7e jour, elle est à 7 m. Le 8e jour, elle grimpe de 3 m : elle atteint 10 m et sort, sans glisser !' },
    { question: 'Un nénuphar double de taille chaque jour. Il couvre tout l’étang en 30 jours. Quel jour en couvrait-il la moitié ?', choix: ['Le 29e jour', 'Le 15e jour', 'Le 20e jour', 'Le 28e jour'], explication: 'Comme il double chaque jour, la veille du 30e, il en couvrait la moitié.' },
    { question: 'Dans une course, tu doubles le dernier. À quelle place es-tu ?', choix: ['C’est impossible', 'Avant-dernier', 'Dernier', 'Premier'], explication: 'Pour doubler le dernier, il faudrait être derrière lui… donc être dernier soi-même !' },
    { question: 'Qu’est-ce qui a des aiguilles mais ne pique jamais ?', choix: ['Une horloge', 'Un sapin', 'Un hérisson', 'Un cactus'], explication: 'Les aiguilles d’une horloge tournent… sans jamais piquer.' },
    { question: 'Il y a trois pommes sur la table. Tu en prends deux. Combien en as-tu ?', choix: ['2', '1', '3', '0'], explication: 'Tu en as pris deux : tu as donc deux pommes. Il en reste une sur la table.' },
    { question: 'Un homme montre un portrait : « Je n’ai ni frère ni sœur, mais le père de cet homme est le fils de mon père. » Qui est sur le portrait ?', choix: ['Son fils', 'Lui-même', 'Son père', 'Son neveu'], explication: 'Le fils de mon père, sans frère, c’est moi. Donc le père de l’homme du portrait, c’est moi : c’est mon fils.' },
    { question: 'Qu’est-ce qui se mouille en séchant ?', choix: ['Une serviette', 'Une éponge', 'Le linge', 'Un parapluie'], explication: 'Plus elle vous sèche, plus elle est mouillée !' },
    { question: 'Plus on lui en enlève, plus il devient grand. Qu’est-ce que c’est ?', choix: ['Un trou', 'Un gâteau', 'Un ballon', 'Un tas de sable'], explication: 'Chaque pelletée enlevée agrandit le trou.' },
    { question: 'Je suis toujours devant toi, mais tu ne peux jamais me voir. Qui suis-je ?', choix: ['L’avenir', 'Ton nez', 'L’horizon', 'Le vent'], explication: 'L’avenir est toujours devant nous… et personne ne le voit.' },
    { question: 'Qu’est-ce qui court sans avoir de jambes ?', choix: ['Une rivière', 'Un serpent', 'Une rumeur de chat', 'Un nuage'], explication: 'On dit qu’une rivière « court » vers la mer. (Une rumeur aussi, d’ailleurs !)' },
    { question: 'Qu’est-ce qu’il faut casser avant de pouvoir s’en servir ?', choix: ['Un œuf', 'Une noix de coco', 'Un verre', 'Une tirelire'], explication: 'Pour une omelette, on n’a pas le choix !' },
    { question: 'Un bus part avec 12 passagers. 5 descendent et 3 montent au premier arrêt ; 4 descendent au second. Combien de passagers reste-t-il ?', choix: ['6', '7', '8', '4'], explication: '12 − 5 + 3 = 10, puis 10 − 4 = 6.' },
    { question: 'Deux pères et deux fils vont à la pêche. Chacun attrape un poisson, et ils rapportent trois poissons. Comment est-ce possible ?', choix: ['Ils ne sont que trois', 'Un poisson s’est échappé', 'L’un d’eux a triché', 'Ils ont mangé le quatrième'], explication: 'Un grand-père, son fils et son petit-fils : deux pères, deux fils… et trois pêcheurs.' },
    { question: 'De quelle couleur est le cheval blanc d’Henri IV ?', choix: ['Blanc', 'Noir', 'Gris', 'Marron'], explication: 'La réponse est dans la question… depuis des générations !' },
    { question: 'Combien de fois peut-on retirer 5 de 25 ?', choix: ['Une seule fois', 'Cinq fois', 'Quatre fois', 'Autant qu’on veut'], explication: 'La première fois, on retire 5 de 25. Ensuite, on retire 5 de… 20 !' },
    { question: 'Un coq pond un œuf tout en haut d’un toit pointu. De quel côté tombe l’œuf ?', choix: ['Un coq ne pond pas', 'À gauche', 'À droite', 'Il reste en haut'], explication: 'Ce sont les poules qui pondent. Le coq, lui, chante.' },
    { question: 'J’ai des villes mais pas de maisons, des forêts mais pas d’arbres, de l’eau mais pas de poissons. Qui suis-je ?', choix: ['Une carte', 'Un rêve', 'Un tableau', 'Un livre de cuisine'], explication: 'Sur une carte, tout est dessiné… mais rien n’est vraiment là.' },
    { question: 'Trois chats attrapent trois souris en trois minutes. Combien de temps faut-il à cent chats pour attraper cent souris ?', choix: ['3 minutes', '100 minutes', '33 minutes', '300 minutes'], explication: 'Chaque chat attrape sa souris en trois minutes. Cent chats en même temps : toujours trois minutes.' },
    { question: 'Paul a quatre sœurs. Chacune de ses sœurs a un frère. Combien d’enfants y a-t-il dans la famille ?', choix: ['5', '8', '9', '6'], explication: 'Le frère de chaque sœur, c’est Paul ! Quatre sœurs + Paul = 5.' },
    { question: 'Qu’est-ce qui monte, monte… et ne redescend jamais ?', choix: ['Ton âge', 'Une fusée', 'La fumée', 'Un ballon'], explication: 'Chaque anniversaire le fait grimper. Jamais l’inverse !' },
    { question: 'Combien de bonbons peux-tu manger le ventre vide ?', choix: ['Un seul', 'Aucun', 'Dix', 'Autant que tu veux'], explication: 'Après le premier, ton ventre n’est plus vide !' },
    { question: 'Tu entres dans une pièce noire avec une seule allumette. Il y a une bougie, une lampe à huile et du bois dans la cheminée. Qu’allumes-tu en premier ?', choix: ['L’allumette', 'La bougie', 'La lampe', 'La cheminée'], explication: 'Sans allumette allumée, rien d’autre ne s’allume !' },
    { question: 'Un escargot grimpe un mur de 5 mètres : 2 mètres le jour, il glisse de 1 mètre la nuit. Quel jour arrive-t-il en haut ?', choix: ['Le 4e jour', 'Le 5e jour', 'Le 3e jour', 'Le 6e jour'], explication: 'Au soir du 3e jour, il est à 3 m. Le 4e jour, il grimpe de 2 m : 5 m, il est en haut !' }
  ];

  // [définition, mot, leurre, leurre, leurre] — même première lettre, même longueur.
  const MOTS = [
    ['Il ronronne sur le canapé', 'CHAT', 'CHAR', 'CHOU', 'CHUT'],
    ['Fruit jaune et courbé', 'BANANE', 'BALLON', 'BATEAU', 'BALCON'],
    ['En Belgique, on les mange avec de la mayonnaise', 'FRITES', 'FRANGE', 'FRUITS', 'FRIGOS'],
    ['La saison la plus chaude', 'ETE', 'EAU', 'ELU', 'EST'],
    ['Elle brille dans le ciel la nuit', 'LUNE', 'LUGE', 'LUXE', 'LUTH'],
    ['La capitale de la Belgique', 'BRUXELLES', 'BOURGEOIS', 'BRILLANTE', 'BUCOLIQUE'],
    ['Grand animal gris à trompe', 'ELEPHANT', 'ESCARGOT', 'EVENTAIL', 'ECUREUIL'],
    ['On y dort la nuit', 'LIT', 'LAC', 'LOI', 'LUI'],
    ['Le contraire de froid', 'CHAUD', 'CHAUX', 'CHAMP', 'CHANT'],
    ['Instrument à six cordes', 'GUITARE', 'GALERIE', 'GLACIER', 'GRENIER'],
    ['Il a des plumes et il vole', 'OISEAU', 'OIGNON', 'ORANGE', 'OURSIN'],
    ['La boisson chaude du matin', 'CAFE', 'CAGE', 'CAPE', 'CAKE'],
    ['On le gonfle pour un anniversaire', 'BALLON', 'BOUTON', 'BILLET', 'BALCON'],
    ['Couleur du ciel par beau temps', 'BLEU', 'BAIE', 'BEAU', 'BOUE'],
    ['Petite bête rouge à points noirs', 'COCCINELLE', 'COLLECTION', 'CONFITURES', 'CROISSANTS'],
    ['On l’ouvre au-dessus de sa tête quand il pleut', 'PARAPLUIE', 'PARCHEMIN', 'PATINOIRE', 'PARESSEUX'],
    ['Le roi des animaux', 'LION', 'LIEN', 'LIRE', 'LIEU'],
    ['Pâtisserie belge quadrillée', 'GAUFRE', 'GARAGE', 'GALETS', 'GAMINS'],
    ['On s’en sert pour écrire au tableau', 'CRAIE', 'CRABE', 'CREME', 'CROIX'],
    ['Elle tombe en flocons l’hiver', 'NEIGE', 'NUAGE', 'NAPPE', 'NICHE'],
    ['Il sonne le matin pour nous réveiller', 'REVEIL', 'RENARD', 'RADEAU', 'RAISIN'],
    ['Ville belge célèbre pour son Doudou', 'MONS', 'MOTS', 'MURS', 'MAIN'],
    ['Le petit du chat', 'CHATON', 'CHAPON', 'CHARME', 'CHEMIN'],
    ['Elle pond des œufs au poulailler', 'POULE', 'POIRE', 'PIANO', 'PELLE'],
    ['On s’y baigne en été, au bord de la mer', 'PLAGE', 'PLACE', 'PLUME', 'PRUNE'],
    ['La planète sur laquelle nous vivons', 'TERRE', 'TABLE', 'TIGRE', 'TRAIN'],
    ['Elle éclaire la pièce le soir', 'LAMPE', 'LANCE', 'LARME', 'LIVRE'],
    ['Le jour qui suit lundi', 'MARDI', 'MERCI', 'MAGIE', 'MOTOS'],
    ['Ce qu’on fête le 25 décembre', 'NOEL', 'NOIX', 'NUIT', 'NORD'],
    ['Le petit de la vache', 'VEAU', 'VELO', 'VASE', 'VOIX'],
    ['Il bat dans la poitrine', 'COEUR', 'CORPS', 'COLLE', 'CLOUS'],
    ['Sport qui se joue avec un ballon rond et deux buts', 'FOOTBALL', 'FAUTEUIL', 'FLAMANTS', 'FROMAGES'],
    ['Plante piquante du désert', 'CACTUS', 'CASTOR', 'CANARD', 'CAMION'],
    ['Lunette géante pour observer les étoiles', 'TELESCOPE', 'TELEPHONE', 'TOBOGGANS', 'TOURNESOL'],
    ['Bonbon gantois en forme de cône', 'CUBERDON', 'CHAUDRON', 'COUSSINS', 'CHAPEAUX'],
    ['Le plus grand océan du monde', 'PACIFIQUE', 'PAPILLONS', 'PERROQUET', 'PANTOUFLE'],
    ['Les abeilles le fabriquent', 'MIEL', 'MULE', 'MOTO', 'MAIS'],
    ['On s’en sert pour découper le papier', 'CISEAUX', 'CITRONS', 'CAROTTE', 'COPAINS'],
    ['Il guide les bateaux la nuit, sur la côte', 'PHARE', 'PHOTO', 'PARIS', 'POMME'],
    ['La moitié de cent', 'CINQUANTE', 'CHOCOLATS', 'CAMPAGNES', 'CROISSANT'],
    ['Personne qui écrit des livres', 'AUTEUR', 'AVOCAT', 'ANANAS', 'ANNEAU'],
    ['Bague que l’on échange en se mariant', 'ALLIANCE', 'ARROSOIR', 'ASPERGES', 'AMBIANCE'],
    ['Il sert à ouvrir une porte', 'CLE', 'CRI', 'COU', 'CRU'],
    ['On y range ses vêtements', 'ARMOIRE', 'AMANDES', 'ATELIER', 'ABRICOT'],
    ['Animal du désert à une ou deux bosses', 'CHAMEAU', 'CHAPEAU', 'CHATEAU', 'CORBEAU']
  ];

  const FARFELU = [
    ['Les loutres de mer se tiennent par la patte pour dormir, sans dériver.', 'Les girafes chantent pour s’endormir.', 'Les pingouins font du toboggan pour aller au travail.', 'Les vaches ne dorment que le dimanche.'],
    ['Les wombats font des crottes en forme de cube.', 'Les lapins font des crottes en forme d’étoile.', 'Les chevaux font des crottes à pois.', 'Les escargots font des crottes en spirale fluorescente.'],
    ['Sur Vénus, une journée dure plus longtemps qu’une année.', 'Sur Mars, il pleut du jus d’orange.', 'Sur la Lune, les cailloux flottent.', 'Sur Jupiter, il neige des confettis.'],
    ['Les bananes sont très légèrement radioactives.', 'Les bananes poussent sous la terre, comme les patates.', 'Les bananes deviennent bleues dans le noir.', 'Les bananes sont des cousines du concombre.'],
    ['Un pot de miel bien fermé peut se conserver des milliers d’années.', 'Le miel est fabriqué par les papillons en hiver.', 'Le miel devient salé si on le met au frigo.', 'Le miel a été inventé au Moyen Âge.'],
    ['Les koalas ont des empreintes digitales très proches des nôtres.', 'Les koalas parlent avec les arbres.', 'Les koalas dorment la tête en bas, comme les chauves-souris.', 'Les koalas sont des cousins des pandas.'],
    ['La tour Eiffel grandit d’une quinzaine de centimètres en été.', 'La tour Eiffel a été peinte en rose à sa construction.', 'La tour Eiffel tourne d’un degré chaque année.', 'La tour Eiffel devait être construite à Bruxelles.'],
    ['Les dauphins dorment avec une moitié du cerveau éveillée.', 'Les dauphins dorment debout, sur la queue.', 'Les dauphins ronflent très fort.', 'Les dauphins dorment une semaine par an.'],
    ['Les chats ne sentent pas le goût sucré.', 'Les chats voient en noir et blanc et en 3D seulement le jeudi.', 'Les chats ronronnent en anglais.', 'Les chats ont neuf vies, c’est prouvé.'],
    ['Un gros nuage blanc peut peser plusieurs centaines de tonnes.', 'Un nuage pèse à peu près le poids d’une plume.', 'Les nuages sont faits de coton.', 'Un nuage ne peut pas traverser une frontière.'],
    ['Les abeilles dansent pour indiquer où trouver des fleurs.', 'Les abeilles se tutoient entre elles.', 'Les abeilles dorment dans des hamacs.', 'Les abeilles fabriquent de la confiture l’été.'],
    ['Pour un botaniste, la banane est une baie, mais pas la fraise.', 'Pour un botaniste, la carotte est un fruit.', 'Pour un botaniste, la pomme est un champignon.', 'Pour un botaniste, la tomate est un caillou.'],
    ['Les hippopotames ne savent pas vraiment nager : ils marchent au fond de l’eau.', 'Les hippopotames transpirent du chocolat.', 'Les hippopotames peuvent voler sur de courtes distances.', 'Les hippopotames dorment dans les arbres.'],
    ['Le Manneken-Pis possède plus de mille costumes.', 'Le Manneken-Pis a été volé par des pingouins.', 'Le Manneken-Pis change de place chaque nuit.', 'Le Manneken-Pis mesure 12 mètres de haut.'],
    ['Les escargots ont des milliers de minuscules dents.', 'Les escargots peuvent courir à 50 km/h.', 'Les escargots changent de coquille tous les mois.', 'Les escargots aboient quand ils ont peur.'],
    ['Une girafe a autant de vertèbres dans le cou qu’un humain : sept.', 'Une girafe a cent vertèbres dans le cou.', 'Le cou de la girafe est gonflable.', 'Les girafes ont un deuxième cou de secours.'],
    ['Les papillons goûtent la nourriture avec leurs pattes.', 'Les papillons goûtent avec leurs ailes.', 'Les papillons ne mangent que du fromage.', 'Les papillons ont des dents en or.'],
    ['Les étoiles de mer n’ont pas de cerveau.', 'Les étoiles de mer brillent la nuit comme de vraies étoiles.', 'Les étoiles de mer ont cinq cerveaux.', 'Les étoiles de mer font des vœux.'],
    ['Les crocodiles ne peuvent pas tirer la langue.', 'Les crocodiles pleurent quand ils écoutent de la musique.', 'Les crocodiles adorent les carottes.', 'Les crocodiles changent de couleur selon leur humeur.'],
    ['Les flamants roses sont roses à cause de ce qu’ils mangent.', 'Les flamants roses naissent tout roses, avec des plumes à paillettes.', 'Les flamants roses deviennent bleus s’ils ont froid.', 'Les flamants roses tiennent sur une patte car l’autre dort.'],
    ['Les chauves-souris sont les seuls mammifères capables de vraiment voler.', 'Les chauves-souris sont des oiseaux sans plumes.', 'Les chauves-souris sont aveugles et sourdes.', 'Les chauves-souris ont peur du noir.'],
    ['Le cœur d’une crevette se trouve dans sa tête.', 'Le cœur d’une crevette est dans sa queue.', 'Les crevettes ont un cœur en forme de crevette.', 'Les crevettes n’ont pas de sang.']
  ];

  return { ENIGMES, MOTS, FARFELU };
});
