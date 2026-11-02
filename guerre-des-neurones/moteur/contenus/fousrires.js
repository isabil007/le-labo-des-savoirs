/*
 * ════════════════════════════════════════════════════════════════════
 *  CONTENU — « Les Fous Rires » 🤪
 * ════════════════════════════════════════════════════════════════════
 *
 *  Trois réserves, pour trois façons de rire :
 *
 *  1. AMORCES : le début d'une phrase absurde (« Le pire cadeau à offrir
 *     à Mamie : … »). Chaque joueur invente la suite sur son téléphone,
 *     puis la table vote pour la plus drôle. Le champ « maison » est la
 *     réponse glissée par le jeu parmi celles des joueurs : si la table
 *     vote pour elle, personne ne marque ces points… et la maison rit.
 *
 *  2. DEVINETTES : devinettes absurdes et « combles », à choix multiple.
 *     La bonne réponse est écrite EN PREMIER (le jeu mélange), les autres
 *     sont des fausses pistes tout aussi loufoques. « explication » donne
 *     le jeu de mots, pour les plus jeunes (et pour Papy, qui fait
 *     semblant d'avoir compris).
 *
 *  3. JOKERS : des bouts de phrase prêts à l'emploi. Le bouton « 🎲 Joker »
 *     du téléphone en propose un au hasard à qui sèche : pratique pour
 *     les petits qui écrivent lentement, et souvent hilarant hors contexte.
 *
 *  Règle d'or : humour bienveillant, rien de gênant à une table où se
 *  côtoient enfants et grands-parents, et personne de réel n'est visé.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/fousrires', function () {
  'use strict';

  const AMORCES = [
    { amorce: 'Le pire cadeau à offrir à Mamie pour son anniversaire :', maison: 'Un abonnement à « Trottinette Magazine »' },
    { amorce: 'Ce que pense vraiment le chat quand il nous fixe sans bouger :', maison: 'Je compte vos défauts. Il m\'en manque encore trois.' },
    { amorce: 'Le nom du parfum que lancerait Tonton :', maison: 'Eau de barbecue n° 5' },
    { amorce: 'La pire excuse pour arriver en retard au repas de famille :', maison: 'Mon GPS voulait d\'abord passer chez sa cousine.' },
    { amorce: 'Le titre du livre que Papy pourrait écrire :', maison: 'Moi, à ton âge… (tome 14)' },
    { amorce: 'Le nouveau parfum de glace que personne n\'a demandé :', maison: 'Chou de Bruxelles caramel' },
    { amorce: 'Ce que dit le GPS quand il en a vraiment marre :', maison: 'Débrouillez-vous, moi je rentre.' },
    { amorce: 'La pire phrase à dire au premier repas chez ses beaux-parents :', maison: 'J\'ai apporté mon propre ketchup, au cas où.' },
    { amorce: 'Le slogan d\'une école qui apprend aux poules à voler :', maison: 'Ici, on ne plaisante pas avec les ailes.' },
    { amorce: 'Un nouveau métier qui existera en 2050 :', maison: 'Psychologue pour robots aspirateurs' },
    { amorce: 'Ce que pense le frigo quand on l\'ouvre pour la douzième fois :', maison: 'Il n\'y a toujours rien de nouveau, je te jure.' },
    { amorce: 'Le nom d\'un super-héros complètement inutile :', maison: 'Capitaine Chaussette, qui retrouve la deuxième… parfois.' },
    { amorce: 'La règle secrète de la famille que personne n\'ose dire tout haut :', maison: 'Le dernier morceau de gâteau revient à celui qui fait la vaisselle.' },
    { amorce: 'Ce que les poissons rouges se racontent toute la journée :', maison: 'Tiens, un château ! … Tiens, un château !' },
    { amorce: 'Le pire nom pour un restaurant :', maison: 'Chez Mal Cuit' },
    { amorce: 'La chanson qu\'il ne faut surtout pas passer à un mariage :', maison: '« Tu ronfles, mon amour » (version de 40 minutes)' },
    { amorce: 'Ce qu\'on trouve tout au fond de la hotte du Père Noël :', maison: 'La liste des enfants sages… et celle des gourmands.' },
    { amorce: 'La pire invention de tous les temps :', maison: 'Le parapluie en papier mâché' },
    { amorce: 'Ce que fait vraiment le chien quand on n\'est pas à la maison :', maison: 'Il regarde des émissions de cuisine et prend des notes.' },
    { amorce: 'La pire chose à crier dans une bibliothèque :', maison: 'QUI A LU LA FIN SANS MOI ?' },
    { amorce: 'Le nom de la future voiture qui roule à la soupe :', maison: 'La Potage 3000' },
    { amorce: 'Le message qu\'un extraterrestre laisserait sur notre répondeur :', maison: 'Bonjour, c\'est pour la vidange de la soucoupe.' },
    { amorce: 'La huitième merveille du monde, selon un enfant de six ans :', maison: 'Un toboggan géant… avec des frites en bas.' },
    { amorce: 'La pire application de téléphone :', maison: 'Une appli qui compte combien de fois tu dis « euh ».' },
    { amorce: 'Le sport olympique qu\'il faudrait inventer d\'urgence :', maison: 'Le lancer de chaussettes sales dans le panier à linge' },
    { amorce: 'Ce que dit la plante verte quand on oublie de l\'arroser :', maison: 'Je vais finir en tisane, c\'est ça ?' },
    { amorce: 'Le titre du prochain film catastrophe :', maison: 'Panne de Wi-Fi : le retour' },
    { amorce: 'La phrase qu\'on ne veut JAMAIS entendre chez le coiffeur :', maison: 'Oups.' },
    { amorce: 'La spécialité de la famille dans cent ans :', maison: 'La gaufre en pilule, goût dimanche midi' },
    { amorce: 'Le super-pouvoir le plus nul du monde :', maison: 'Parler aux pigeons, mais seulement de la météo' },
    { amorce: 'Ce que les vaches pensent vraiment des humains :', maison: 'Ils boivent notre lait et ne disent même pas merci.' },
    { amorce: 'Le mot de passe que toute la famille devinerait :', maison: 'motdepasse123, comme d\'habitude' },
    { amorce: 'Le nom de la Belgique si elle était un dessert :', maison: 'La Gaufrelande' },
    { amorce: 'Ce qu\'on dit au dentiste, la bouche pleine de coton :', maison: 'Gnnnn gnn gnnnnnn ?' },
    { amorce: 'Ce qui arrive vraiment aux chaussettes dans la machine à laver :', maison: 'Elles s\'enfuient fonder une colonie à la mer.' },
    { amorce: 'Le prénom du futur robot de la maison :', maison: 'Jean-Michel 2.0' },
    { amorce: 'Ce qu\'on trouve tout au fond d\'un cartable :', maison: 'Une tartine de l\'an dernier et un mot à faire signer.' },
    { amorce: 'La vraie raison pour laquelle les dinosaures ont disparu :', maison: 'Ils n\'ont jamais retrouvé la télécommande.' },
    { amorce: 'Le pire endroit pour passer ses vacances :', maison: 'Un camping au milieu d\'un rond-point' },
    { amorce: 'Ce que Mamie cache vraiment dans son sac à main :', maison: 'Un mouchoir, trois bonbons et un plan pour dominer le monde.' },
    { amorce: 'Le premier mot que prononcerait un bébé pingouin :', maison: 'Brrr.' },
    { amorce: 'La pire chose à dire juste après avoir goûté le plat du chef :', maison: 'C\'est… original. C\'est censé croustiller ?' },
    { amorce: 'Ce que les escargots se disent quand il pleut :', maison: 'Enfin un temps à sortir !' },
    { amorce: 'Le nom d’une boisson énergisante pour grands-parents :', maison: 'Mamie Boost, goût camomille turbo' },
    { amorce: 'La pire phrase à entendre au début d’un long voyage en voiture :', maison: '« On n’a pas oublié le chat ? »' },
    { amorce: 'Le slogan d’une marque de chaussettes qui ne se perdent jamais :', maison: 'Toujours par deux, même dans la machine.' },
    { amorce: 'Ce que dit le sapin de Noël le 7 janvier :', maison: 'Je peux enlever ces guirlandes, maintenant ?' },
    { amorce: 'Le talent caché le plus inutile de Papy :', maison: 'Il imite parfaitement le bruit du lave-vaisselle.' },
    { amorce: 'La nouvelle matière enseignée à l’école en 2080 :', maison: 'Parler poliment à son grille-pain' },
    { amorce: 'Ce qu’un hamster écrit dans son journal intime :', maison: 'Jour 412 : j’ai encore couru. Je ne suis allé nulle part.' },
    { amorce: 'Le titre d’un film d’horreur pour les légumes :', maison: 'Le retour de l’éplucheur' },
    { amorce: 'Ce que pense le poisson rouge quand on tapote sur son bocal :', maison: 'Toc toc, qui est là ? … Oh, j’ai oublié.' },
    { amorce: 'La pire invention pour le petit-déjeuner :', maison: 'Des céréales qui crient quand on verse le lait' },
    { amorce: 'Le nom d’un parfum pour chien :', maison: 'Eau de flaque n° 9' },
    { amorce: 'Ce qu’on trouve dans le frigo d’un vampire végétarien :', maison: 'Du jus de betterave. Beaucoup de jus de betterave.' },
    { amorce: 'La pire excuse pour ne pas faire ses devoirs :', maison: 'Mon stylo est parti en vacances sans prévenir.' },
    { amorce: 'Ce que la Lune pense de nous la nuit :', maison: 'Éteignez un peu vos écrans, je ne vois plus les étoiles !' },
    { amorce: 'La spécialité d’un restaurant pour extraterrestres :', maison: 'Le croque-martien' },
    { amorce: 'Le pire prénom pour un dragon :', maison: 'Bisounours' },
    { amorce: 'Le pire moment pour avoir le hoquet :', maison: 'En pleine minute de silence' },
    { amorce: 'Ce que crie le perroquet de Mamie quand on arrive :', maison: '« Essuie tes pieds ! Essuie tes pieds ! »' },
    { amorce: 'La nouvelle règle du Monopoly inventée par Tonton :', maison: 'Celui qui a le plus de billets fait la vaisselle.' },
    { amorce: 'Le pire nom pour un salon de coiffure :', maison: 'Un Poil Trop Court' },
    { amorce: 'Ce que dit un dinosaure en voyant une poule :', maison: '« Qu’est-ce qui t’est arrivé, cousine ? »' },
    { amorce: 'Le pire jouet à offrir à un enfant de cinq ans :', maison: 'Un tambour avec un bouton « encore plus fort »' },
    { amorce: 'Ce que les fourmis pensent d’un pique-nique :', maison: 'Le meilleur buffet à volonté de l’année !' },
    { amorce: 'La phrase qu’un chat dirait s’il pouvait parler une seule fois :', maison: '« Ta place sur le canapé ? C’est la mienne. »' }
  ];

  const DEVINETTES = [
    { categorie: 'Devinette absurde', question: 'Qu\'est-ce qui est jaune et qui attend ?', choix: ['Jonathan', 'Un citron patient', 'Un poussin à l\'arrêt de bus', 'Une banane dans une file'], explication: '« Jaune attend »… Jonathan ! À répéter à voix haute pour bien l\'entendre.' },
    { categorie: 'Devinette absurde', question: 'Qu\'est-ce qui est vert et qui monte et qui descend ?', choix: ['Un petit pois dans un ascenseur', 'Une grenouille sur un trampoline', 'Un cornichon en montgolfière', 'Un brocoli au yoyo'], explication: 'La grande classique des cours de récré, depuis des générations.' },
    { categorie: 'Devinette absurde', question: 'Pourquoi les poissons vivent-ils dans l\'eau salée ?', choix: ['Parce que le poivre les fait éternuer', 'Pour avoir meilleur goût', 'Parce que l\'eau sucrée colle', 'Pour faire comme les frites'], explication: 'Imaginez un requin qui éternue…' },
    { categorie: 'Devinette absurde', question: 'Pourquoi les plongeurs plongent-ils toujours en arrière ?', choix: ['Parce que sinon, ils tombent dans le bateau', 'Pour ne pas voir les requins', 'Pour garder leurs palmes au sec', 'Par politesse envers les poissons'], explication: 'Logique implacable : devant eux, il y a… le bateau.' },
    { categorie: 'Devinette absurde', question: 'Que dit un oignon quand il se cogne ?', choix: ['Aïe !', 'Ouille !', 'Ça pique les yeux !', 'Échalote, alors !'], explication: '« Aïe »… comme l\'ail, son cousin de potager.' },
    { categorie: 'Devinette absurde', question: 'Quel est le fruit préféré des professeurs d\'histoire ?', choix: ['La datte', 'La pomme d\'Adam', 'La poire Belle-Hélène', 'Le pruneau d\'Agen'], explication: 'Les dattes… comme les dates à apprendre par cœur !' },
    { categorie: 'Devinette absurde', question: 'Qu\'est-ce qui est petit, carré et jaune ?', choix: ['Un petit carré jaune', 'Un morceau de fromage', 'Un post-it timide', 'Un dé au soleil'], explication: 'Parfois, la réponse la plus simple est la plus absurde.' },
    { categorie: 'Devinette absurde', question: 'Pourquoi les éléphants n\'utilisent-ils pas d\'ordinateur ?', choix: ['Ils ont peur de la souris', 'Leurs doigts sont trop gros', 'Ils oublient le mot de passe', 'Le Wi-Fi ne passe pas dans la savane'], explication: 'Une souris d\'ordinateur… et un éléphant qui a peur des souris !' },
    { categorie: 'Devinette absurde', question: 'Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ?', choix: ['Un chat-peint de Noël', 'Un Père Noël à poils', 'Une boule de Noël', 'Un chat-mallow'], explication: '« Chat-peint »… comme un sapin !' },
    { categorie: 'Devinette absurde', question: 'Quel est le sport préféré des insectes ?', choix: ['Le cricket', 'Le tennis de table de nuit', 'Le saut à la puce', 'Le vol libre'], explication: '« Cricket » veut dire « grillon » en anglais.' },
    { categorie: 'Devinette absurde', question: 'Que dit une imprimante quand elle tombe dans l\'eau ?', choix: ['J\'ai papier !', 'Au secours, j\'ai plus d\'encre !', 'Je bourre !', 'Glouglou en couleur !'], explication: '« J\'ai papier »… « J\'ai pas pied » !' },
    { categorie: 'Devinette absurde', question: 'Pourquoi les vaches ferment-elles les yeux pendant la traite ?', choix: ['Pour faire du lait concentré', 'Pour ne pas voir les mains froides', 'Pour rêver de prairies', 'Par timidité'], explication: 'Les yeux fermés, elle se concentre… lait concentré !' },
    { categorie: 'Devinette absurde', question: 'Que dit le zéro au huit ?', choix: ['Tiens, tu as mis une ceinture !', 'Tu as pris du poids !', 'Arrête de tourner en rond !', 'On fait la paire ?'], explication: 'Dessinez un zéro, serrez-lui la taille : voilà un 8.' },
    { categorie: 'Devinette absurde', question: 'Qu\'est-ce qu\'un yaourt dans la forêt ?', choix: ['Un yaourt nature', 'Un yaourt perdu', 'Un champignon laitier', 'Un pique-nique raté'], explication: 'Au milieu des arbres, il est forcément… nature !' },
    { categorie: 'Devinette absurde', question: 'Comment appelle-t-on un boomerang qui ne revient pas ?', choix: ['Un bâton', 'Un boomerang timide', 'Un aller simple', 'Un kangourou déçu'], explication: 'Sans retour, ce n\'est plus qu\'un bout de bois.' },
    { categorie: 'Devinette absurde', question: 'Pourquoi le livre de maths est-il toujours triste ?', choix: ['Parce qu\'il a trop de problèmes', 'Parce que personne ne le lit', 'Parce qu\'il est divisé', 'Parce qu\'il a perdu sa calculette'], explication: 'Des problèmes à chaque page, le pauvre…' },
    { categorie: 'Devinette absurde', question: 'Que fait une fraise sur un cheval ?', choix: ['Tagada, tagada !', 'De la confiture à cheval', 'Du rodéo sucré', 'Elle cherche la chantilly'], explication: '« Tagada » : le bruit du galop… et une fraise célèbre.' },
    { categorie: 'Devinette absurde', question: 'Pourquoi le hibou est-il l\'oiseau le plus heureux ?', choix: ['Parce que sa femme est chouette', 'Parce qu\'il dort toute la journée', 'Parce qu\'il voit dans le noir', 'Parce qu\'il fait « hou-hou » de joie'], explication: 'Une chouette, c\'est aussi quelqu\'un de… chouette !' },
    { categorie: 'Devinette absurde', question: 'Qu\'est-ce qui a des dents mais ne mord jamais ?', choix: ['Un peigne', 'Un dentier dans un verre', 'Un crocodile au régime', 'Une fermeture éclair fâchée'], explication: 'Des dents bien alignées… et parfaitement inoffensives.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un électricien ?', choix: ['Ne pas être au courant', 'Avoir peur du noir', 'Faire des étincelles en cuisine', 'Rater son train électrique'], explication: 'Le courant électrique… et « être au courant » des nouvelles !' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un jardinier ?', choix: ['Raconter des salades', 'Avoir la main verte… de peinture', 'Perdre ses graines au loto', 'Tondre la moquette'], explication: '« Raconter des salades », c\'est dire des bêtises.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un boulanger ?', choix: ['Être dans le pétrin', 'Avoir un pain sur la planche', 'Ne pas avoir de croûte', 'Rouler sa baguette'], explication: 'Le pétrin, c\'est le bac où l\'on pétrit la pâte… et les ennuis !' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un dentiste ?', choix: ['Avoir une dent contre quelqu\'un', 'Manger des bonbons en cachette', 'Ne pas avoir de fauteuil', 'Sourire tout le temps'], explication: '« Avoir une dent contre quelqu\'un » : lui en vouloir.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un astronaute ?', choix: ['Être dans la lune', 'Avoir le mal de terre', 'Perdre son casque', 'Rater la fusée de 8 h 12'], explication: '« Être dans la lune » : rêvasser, ne pas écouter.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un pâtissier ?', choix: ['Rouler quelqu\'un dans la farine', 'Avoir le cœur sur la main', 'Être tarte', 'Tomber dans les pommes'], explication: '« Rouler quelqu\'un dans la farine » : le tromper.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour une couturière ?', choix: ['Perdre le fil', 'Avoir une aiguille dans le pied', 'Coudre des boutons de fièvre', 'Se faire tailler un costard'], explication: '« Perdre le fil » de la conversation : ne plus savoir ce qu\'on disait.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour une souris ?', choix: ['Avoir un chat dans la gorge', 'Manger du fromage allégé', 'Avoir peur des éléphants', 'Habiter un ordinateur'], explication: 'Un « chat dans la gorge », c\'est être enroué. Pour une souris, quelle angoisse !' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un chauve ?', choix: ['Avoir un cheveu sur la langue', 'Acheter un peigne', 'Se faire des cheveux blancs', 'Avoir la tête dans les nuages'], explication: '« Avoir un cheveu sur la langue » : zozoter.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un serrurier ?', choix: ['Être mis à la porte', 'Perdre ses clés', 'Avoir la clé des champs', 'Être fermé d\'esprit'], explication: 'Lui qui ouvre toutes les portes… on le met dehors !' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un géographe ?', choix: ['Perdre le nord', 'Avoir la tête à l\'ouest', 'Rater son atlas', 'Prendre la mer pour un lac'], explication: '« Perdre le nord » : perdre la tête, ne plus savoir où on en est.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un maçon ?', choix: ['Être au pied du mur', 'Avoir une brique dans le ventre', 'Bâtir des châteaux en Espagne', 'Monter sur ses grands chevaux'], explication: '« Être au pied du mur » : ne plus pouvoir reculer.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un cuisinier ?', choix: ['Mettre les pieds dans le plat', 'Avoir un coup de fourchette', 'Faire chou blanc', 'Raconter des bobards'], explication: '« Mettre les pieds dans le plat » : dire tout haut ce qu\'il fallait taire.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un horloger ?', choix: ['Ne jamais avoir le temps', 'Avoir un coucou chez lui', 'Être remonté', 'Arriver pile à l\'heure'], explication: 'Il fabrique des montres… et court toujours après le temps !' },
    { categorie: 'Devinette absurde', question: 'Pourquoi les girafes ont-elles un si long cou ?', choix: ['Parce que leurs pieds sentent mauvais', 'Pour manger les nuages', 'Pour voir la télé des voisins', 'Parce qu’elles sont curieuses'], explication: 'Plus la tête est loin des pieds, mieux on respire !' },
    { categorie: 'Devinette absurde', question: 'Pourquoi les canards sont-ils toujours à l’heure ?', choix: ['Parce qu’ils sont dans l’étang', 'Parce qu’ils ont une montre', 'Parce qu’ils se lèvent tôt', 'Parce qu’ils nagent vite'], explication: 'Dans l’étang… « dans le temps » !' },
    { categorie: 'Devinette absurde', question: 'Que dit une maman tomate à son petit qui traîne derrière ?', choix: ['Ketchup !', 'Dépêche-toi, ma pomme !', 'Ne fais pas ta salade !', 'Tu vas finir en sauce !'], explication: '« Ketchup » se prononce comme « catch up » : « rattrape-nous » en anglais.' },
    { categorie: 'Devinette absurde', question: 'Comment appelle-t-on un chat qui tourne autour de la Terre ?', choix: ['Un chat-tellite', 'Un astro-chat', 'Un chat-lune', 'Une comète à moustaches'], explication: 'Chat-tellite… satellite !' },
    { categorie: 'Devinette absurde', question: 'Pourquoi les poissons détestent-ils les ordinateurs ?', choix: ['Parce qu’ils ont peur du Net', 'Parce que l’écran est mouillé', 'Parce que la souris les mange', 'Parce qu’ils n’ont pas de doigts'], explication: 'Le Net… comme le filet des pêcheurs (« net » en anglais) !' },
    { categorie: 'Devinette', question: 'Qu’est-ce qui a un cou mais pas de tête ?', choix: ['Une bouteille', 'Une girafe timide', 'Une écharpe', 'Un pull'], explication: 'Le goulot d’une bouteille s’appelle aussi son col, ou son cou.' },
    { categorie: 'Devinette', question: 'Qu’est-ce qui est plein de trous mais retient l’eau ?', choix: ['Une éponge', 'Une passoire', 'Un filet', 'Un gruyère'], explication: 'Ses mille petits trous gardent l’eau prisonnière… jusqu’à ce qu’on la presse.' },
    { categorie: 'Devinette', question: 'Plus j’ai de gardiens, moins je suis gardé. Qui suis-je ?', choix: ['Un secret', 'Un trésor', 'Un château', 'Un but de football'], explication: 'Un secret partagé avec beaucoup de monde n’est plus vraiment un secret…' },
    { categorie: 'Devinette', question: 'Qu’est-ce qui t’appartient, mais que les autres utilisent plus que toi ?', choix: ['Ton prénom', 'Ton vélo', 'Ta brosse à dents', 'Ton téléphone'], explication: 'On le dit rarement soi-même : ce sont les autres qui t’appellent !' },
    { categorie: 'Devinette', question: 'Qu’est-ce qui monte et qui descend sans jamais bouger ?', choix: ['Un escalier', 'Un yoyo paresseux', 'Un ascenseur en panne', 'Une montagne russe'], explication: 'Lui ne bouge pas : c’est nous qui le montons et le descendons.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un pianiste ?', choix: ['Perdre ses clés', 'Avoir des fausses notes au bulletin', 'Jouer au piano de cuisine', 'Avoir des doigts de fée'], explication: 'Les clés… comme la clé de sol et la clé de fa des partitions !' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un cordonnier ?', choix: ['Être mal chaussé', 'Perdre le fil', 'Avoir les pieds sur terre', 'Casser ses lacets'], explication: 'Le proverbe le dit : « Les cordonniers sont toujours les plus mal chaussés. »' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un photographe ?', choix: ['Être dans le flou', 'Avoir un trou de mémoire', 'Perdre la boule', 'Être tiré à quatre épingles'], explication: '« Être dans le flou » : ne pas y voir clair dans une situation.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un peintre ?', choix: ['En voir de toutes les couleurs', 'Avoir le blues', 'Faire grise mine', 'Broyer du noir'], explication: '« En voir de toutes les couleurs » : subir toutes sortes de mésaventures.' },
    { categorie: 'Le comble', question: 'Quel est le comble pour un professeur de géométrie ?', choix: ['Tourner en rond', 'Avoir l’esprit carré', 'Perdre la face', 'Prendre la tangente'], explication: '« Tourner en rond » : ne plus avancer… comme un compas !' }
  ];

  const JOKERS = [
    'Un hamster en tutu', 'Tonton en maillot de bain', 'Une raclette à minuit', 'Le Wi-Fi de Mamie',
    'Une moule qui fait du yoga', 'Un frigo amoureux', 'Trois pigeons déguisés en touristes', 'Une chaussette philosophe',
    'Le voisin, encore lui', 'Une soupe aux cailloux', 'Un dinosaure végétarien', 'Une gaufre sans sucre (quelle horreur)',
    'Un parapluie qui a peur de la pluie', 'Une licorne qui fait la file à la poste', 'Le chat, qui a tout vu', 'Une sieste de trois jours',
    'Un escargot en trottinette', 'Le doudou de Papy', 'Une crêpe volante', 'Des frites, évidemment',
    'Un concours de ronflements', 'Une poule qui fait du karaoké', 'Le dentier de la reine des abeilles', 'Une tartine qui tombe du bon côté',
    'Un pingouin en tongs', 'La télécommande, perdue depuis 1998', 'Un ours qui fait du tricot', 'Une moustache télécommandée'
  ];

  return { AMORCES, DEVINETTES, JOKERS };
});
