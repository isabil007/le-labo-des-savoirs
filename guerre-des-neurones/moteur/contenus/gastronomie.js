/*
 * ════════════════════════════════════════════════════════════════════
 *  LES TOQUÉS — les recettes mystère et le quiz gourmand
 * ════════════════════════════════════════════════════════════════════
 *
 *  Deux banques pour le jeu « Les Toqués » (moteur/jeux/gastronomie.js) :
 *
 *  1. RECETTES : les ingrédients apparaissent un à un sur la tablette et
 *     les téléphones ; il faut deviner le plat. Les ingrédients sont des
 *     pictogrammes (émojis), dans l'ordre où on les dévoile : du moins
 *     révélateur au plus évident, pour que les plus rapides prennent un
 *     vrai risque.
 *
 *  2. QUIZ : des questions gourmandes, belges et du monde entier.
 *     Comme dans quiz.js, la bonne réponse est TOUJOURS écrite en premier
 *     (le jeu mélange les choix). Vérifiez les faits avant d'en ajouter.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/gastronomie', function () {
  'use strict';
  const RECETTES = [
    { plat: 'Les spaghettis carbonara', ingredients: ['🧂', '🥓', '🥚', '🧀', '🍝'], anecdote: 'La vraie recette romaine se fait sans crème : les œufs et le fromage suffisent à faire la sauce.' },
    { plat: 'La ratatouille', ingredients: ['🧄', '🧅', '🍅', '🥒', '🍆'], anecdote: 'Une spécialité de Nice. Les puristes cuisent chaque légume séparément avant de les réunir.' },
    { plat: 'Les crêpes', ingredients: ['🧈', '🌾', '🥛', '🥚'], anecdote: 'En France, on en fait traditionnellement à la Chandeleur, le 2 février.' },
    { plat: 'Le guacamole', ingredients: ['🧅', '🌶️', '🍅', '🍋', '🥑'], anecdote: 'Une recette mexicaine : son nom vient de la langue des Aztèques.' },
    { plat: 'La pizza margherita', ingredients: ['🌾', '🌿', '🧀', '🍅'], anecdote: 'Ses couleurs (le rouge de la tomate, le blanc de la mozzarella, le vert du basilic) rappellent le drapeau italien.' },
    { plat: 'Le croque-monsieur', ingredients: ['🧈', '🍖', '🧀', '🍞'], anecdote: 'Il apparaît sur les cartes des cafés parisiens au début du XXe siècle.' },
    { plat: 'Le tiramisu', ingredients: ['🥚', '🍪', '🍫', '🧀', '☕'], anecdote: '« Tiramisù » veut dire « tire-moi vers le haut » en italien. Le fromage, c’est le mascarpone.' },
    { plat: 'La soupe à l’oignon gratinée', ingredients: ['🍞', '🧀', '🧅', '🧅'], anecdote: 'Un grand classique des bistrots parisiens, gratiné au four.' },
    { plat: 'Le hamburger', ingredients: ['🥬', '🍅', '🧀', '🥩', '🍞'], anecdote: 'Son nom fait référence à la ville allemande de Hambourg.' },
    { plat: 'La paella', ingredients: ['🍋', '🍗', '🦐', '🍚'], anecdote: 'Elle doit son nom à la grande poêle dans laquelle on la cuit, la « paella », en valencien.' },
    { plat: 'Les sushis', ingredients: ['🥒', '🐟', '🍚'], anecdote: 'Le riz des sushis est assaisonné de vinaigre de riz : c’est lui le vrai secret.' },
    { plat: 'Le stoemp', ingredients: ['🌭', '🧅', '🥕', '🥔'], anecdote: 'Une purée bruxelloise de pommes de terre et de légumes, souvent servie avec une saucisse.' },
    { plat: 'Les boulets à la liégeoise', ingredients: ['🍟', '🧅', '🍐', '🥩'], anecdote: 'Leur sauce est faite avec du sirop de Liège, à base de poires et de pommes.' },
    { plat: 'La salade niçoise', ingredients: ['🫒', '🐟', '🥚', '🍅', '🥬'], anecdote: 'Une salade de Nice ; le thon et les œufs durs en font un vrai repas.' },
    { plat: 'La fondue savoyarde', ingredients: ['🧄', '🍞', '🧀', '🧀'], anecdote: 'En Savoie, on frotte le caquelon avec une gousse d’ail avant d’y faire fondre les fromages.' },
    { plat: 'La tarte aux pommes', ingredients: ['🧈', '🌾', '🍎'], anecdote: 'Retournée et caramélisée, elle devient la célèbre tarte Tatin.' },
    { plat: 'Le gâteau au chocolat', ingredients: ['🌾', '🧈', '🥚', '🍫'], anecdote: 'Le chocolat est fabriqué à partir des fèves du cacaoyer.' },
    { plat: 'La fondue au chocolat', ingredients: ['🍫', '🥛', '🍓', '🍌'], anecdote: 'Elle a été inventée à New York dans les années 1960 par un restaurateur suisse. On y trempe des fruits.' },
    { plat: 'Le croque-madame', ingredients: ['🍞', '🧀', '🍖', '🥚'], anecdote: 'C’est un croque-monsieur… avec un œuf au plat posé dessus, comme un chapeau.' },
    { plat: 'La quiche lorraine', ingredients: ['🌾', '🧈', '🥚', '🥛', '🥓'], anecdote: 'La recette traditionnelle de Lorraine se fait sans fromage : des œufs, de la crème et des lardons.' },
    { plat: 'La salade de fruits', ingredients: ['🍎', '🍌', '🍊', '🍇', '🍓'], anecdote: 'Un filet de jus de citron empêche les pommes et les bananes de noircir.' },
    { plat: 'Les pancakes', ingredients: ['🌾', '🥛', '🥚', '🧈', '🍯'], anecdote: 'Plus épais que les crêpes, on les empile au petit-déjeuner, en Amérique du Nord, avec du sirop d’érable.' },
    { plat: 'Le gaspacho', ingredients: ['🍅', '🥒', '🧅', '🧄', '🍞'], anecdote: 'Une soupe froide d’Andalousie, parfaite pour les grosses chaleurs. Le pain la rend onctueuse.' },
    { plat: 'Le pot-au-feu', ingredients: ['🥩', '🥕', '🧅', '🥔', '🧂'], anecdote: 'La viande et les légumes cuisent longtemps dans le même bouillon : on boit d’abord la soupe, puis on mange le reste.' },
    { plat: 'Les lasagnes', ingredients: ['🍝', '🍅', '🥩', '🥛', '🧀'], anecdote: 'Des couches de pâtes, de sauce bolognaise et de béchamel, gratinées au four.' },
    { plat: 'La mousse au chocolat', ingredients: ['🍫', '🥚', '🧈', '🍬'], anecdote: 'Le secret : des blancs d’œufs battus en neige, mélangés tout doucement pour ne pas « casser » la mousse.' },
    { plat: 'Le riz au lait', ingredients: ['🍚', '🥛', '🍬'], anecdote: 'Un dessert de grand-mère, souvent parfumé à la vanille ou à la cannelle. En Belgique, on le retrouve dans la tarte au riz !' },
    { plat: 'La tartiflette', ingredients: ['🥔', '🥓', '🧅', '🧀'], anecdote: 'Elle a été inventée dans les années 1980 en Savoie pour faire connaître le reblochon.' },
    { plat: 'Les frites belges', ingredients: ['🥔', '🔪', '🥩', '🧂'], anecdote: 'Le secret belge : deux cuissons, d’abord pour cuire, ensuite pour dorer. Traditionnellement dans de la graisse de bœuf, le « blanc de bœuf ».' },
    { plat: 'L’omelette aux champignons', ingredients: ['🥚', '🍄', '🧈', '🧂'], anecdote: 'On fait revenir les champignons d’abord, sinon ils rendent leur eau dans l’omelette.' }
  ];

  const QUIZ = [
    { question: 'Comment appelle-t-on l’endive en Belgique ?', choix: ['Le chicon', 'Le salsifis', 'Le cardon', 'Le crosne'], anecdote: 'Le chicon (ou witloof) a été cultivé à Bruxelles au XIXe siècle, dans le noir, pour qu’il reste blanc.' },
    { question: 'Dans quoi mijote la carbonade flamande ?', choix: ['De la bière', 'Du lait', 'Du jus d’orange', 'De l’eau salée'], anecdote: 'La bière et le pain d’épices donnent à la carbonade sa sauce brune et douce.' },
    { question: 'Le waterzooi est une spécialité de quelle ville ?', choix: ['Gand', 'Namur', 'Arlon', 'Mons'], anecdote: 'Le waterzooi gantois se fait au poulet ou au poisson, dans un bouillon crémeux aux légumes.' },
    { question: 'Quelle ville belge a donné son nom à une couque très dure ?', choix: ['Dinant', 'Spa', 'Ostende', 'Bastogne'], anecdote: 'La couque de Dinant, au miel et à la farine, est si dure qu’on la casse en petits morceaux.' },
    { question: 'Qu’y a-t-il dans la pâte d’une gaufre de Liège ?', choix: ['Du sucre perlé', 'Du fromage', 'Des raisins secs', 'Du chocolat blanc'], anecdote: 'Les grains de sucre perlé caramélisent à la cuisson : c’est la signature de la gaufre de Liège.' },
    { question: 'Quel fromage belge est célèbre pour son odeur très forte ?', choix: ['Le Herve', 'Le Brie', 'Le Comté', 'La Mozzarella'], anecdote: 'Le fromage de Herve vient du pays de Herve, entre Liège et Aix-la-Chapelle.' },
    { question: 'Qui a inventé la praline en chocolat, à Bruxelles, en 1912 ?', choix: ['Jean Neuhaus', 'Victor Horta', 'Ernest Solvay', 'Adolphe Sax'], anecdote: 'Jean Neuhaus a eu l’idée de remplir une coque de chocolat, dans la boutique familiale de la galerie de la Reine.' },
    { question: 'Avec quoi mange-t-on traditionnellement les moules en Belgique ?', choix: ['Des frites', 'Du riz', 'Des pâtes', 'Du couscous'], anecdote: 'Les moules-frites sont souvent présentées comme le plat national belge.' },
    { question: 'Quel bonbon gantois a la forme d’un petit cône violet ?', choix: ['Le cuberdon', 'Le caramel', 'La guimauve', 'Le berlingot'], anecdote: 'On l’appelle aussi « neuzeke », le petit nez. Il est croquant dehors et coulant dedans.' },
    { question: 'Pour quelle fête les enfants belges reçoivent-ils traditionnellement des spéculoos ?', choix: ['La Saint-Nicolas', 'Pâques', 'La Fête nationale', 'Halloween'], anecdote: 'Le 6 décembre, saint Nicolas apporte spéculoos, mandarines et chocolats.' },
    { question: 'De quel pays vient le tiramisu ?', choix: ['L’Italie', 'L’Espagne', 'La Grèce', 'Le Portugal'], anecdote: 'On le dit originaire de la région de Trévise, en Vénétie.' },
    { question: 'Quel est l’ingrédient principal du houmous ?', choix: ['Les pois chiches', 'Les lentilles', 'Les haricots verts', 'Les petits pois'], anecdote: 'Pois chiches écrasés, crème de sésame, citron et ail : un classique du Proche-Orient.' },
    { question: 'Avec quel fruit sec fait-on le massepain ?', choix: ['L’amande', 'La noisette', 'La noix', 'La pistache'], anecdote: 'Amandes en poudre et sucre : on en fait des petits fruits et des animaux colorés.' },
    { question: 'Quelle épice donne sa couleur jaune au curry ?', choix: ['Le curcuma', 'Le poivre', 'La cannelle', 'Le clou de girofle'], anecdote: 'Le curcuma est une racine, de la même famille que le gingembre.' },
    { question: 'Le safran est tiré de quelle fleur ?', choix: ['Le crocus', 'La rose', 'La tulipe', 'Le tournesol'], anecdote: 'Il faut des milliers de fleurs pour obtenir quelques grammes de safran : c’est l’épice la plus chère du monde.' },
    { question: 'Que contient une sauce béchamel ?', choix: ['Beurre, farine et lait', 'Œufs, huile et moutarde', 'Tomates et basilic', 'Crème et champignons'], anecdote: 'C’est l’une des sauces de base de la cuisine française, celle des lasagnes et des croque-monsieur.' },
    { question: 'Que veut dire « al dente » pour des pâtes ?', choix: ['Encore un peu fermes', 'Très molles', 'Froides', 'Bien salées'], anecdote: '« Al dente » signifie « à la dent » : les pâtes doivent résister un peu sous la dent.' },
    { question: 'De quelle région d’Espagne vient la paella ?', choix: ['Valence', 'Madrid', 'Les Asturies', 'La Galice'], anecdote: 'La paella valencienne traditionnelle se fait au poulet et au lapin, avec des haricots.' },
    { question: 'Comment cuit-on une tarte Tatin ?', choix: ['À l’envers', 'À la vapeur', 'Dans la friture', 'Sans four, au réfrigérateur'], anecdote: 'Les pommes caramélisent au fond du moule, sous la pâte, puis on retourne la tarte.' },
    { question: 'La bouillabaisse est la soupe de poisson de quelle ville ?', choix: ['Marseille', 'Lille', 'Strasbourg', 'Lyon'], anecdote: 'On la servait autrefois avec les poissons que les pêcheurs n’arrivaient pas à vendre.' },
    { question: 'De quel pays vient le kimchi, du chou fermenté et pimenté ?', choix: ['La Corée', 'Le Japon', 'L’Inde', 'Le Mexique'], anecdote: 'En Corée, on prépare le kimchi en famille à l’automne, pour tout l’hiver.' },
    { question: 'Avec quoi prépare-t-on le couscous ?', choix: ['De la semoule de blé', 'Du riz', 'Des pommes de terre', 'Du maïs'], anecdote: 'Un plat du Maghreb, inscrit au patrimoine culturel immatériel de l’UNESCO.' },
    { question: 'Les pastéis de nata sont des petits flans de quel pays ?', choix: ['Le Portugal', 'L’Italie', 'La Suisse', 'La Pologne'], anecdote: 'Les plus célèbres viennent du quartier de Belém, à Lisbonne.' },
    { question: 'Quel ustensile utilise-t-on pour monter des blancs en neige ?', choix: ['Un fouet', 'Une louche', 'Un presse-ail', 'Une écumoire'], anecdote: 'Astuce de grand-mère : une pincée de sel aide les blancs à monter.' },
    { question: 'Quel fromage met-on sur une pizza margherita ?', choix: ['La mozzarella', 'Le gruyère', 'Le camembert', 'Le cheddar'], anecdote: 'Tomate, mozzarella et basilic : les couleurs du drapeau italien, en l’honneur de la reine Marguerite.' },
    { question: 'Que sont les spéculoos ?', choix: ['Des biscuits épicés', 'Des bonbons à la menthe', 'Des petits pains au lait', 'Des gaufres fourrées'], anecdote: 'Cannelle, cassonade… On les offre à la Saint-Nicolas, souvent en forme de personnages.' },
    { question: 'Quel légume est à la base de la vichyssoise ?', choix: ['Le poireau', 'La carotte', 'Le chou-fleur', 'Le potiron'], anecdote: 'Une soupe de poireaux et de pommes de terre à la crème… que l’on sert froide !' },
    { question: 'Combien de temps cuit un œuf à la coque ?', choix: ['Environ 3 minutes', 'Environ 10 minutes', '30 secondes', 'Environ 20 minutes'], anecdote: 'Le blanc est pris, le jaune reste coulant : parfait pour les mouillettes.' },
    { question: 'Quel fruit sec trouve-t-on dans le nougat de Montélimar ?', choix: ['Les amandes', 'Les noix', 'Les raisins secs', 'Les figues'], anecdote: 'Il doit contenir au moins 28 % d’amandes, avec du miel de lavande.' },
    { question: 'D’où vient le chili con carne ?', choix: ['Du Texas', 'Du Chili', 'D’Espagne', 'Du Portugal'], anecdote: 'C’est un plat « tex-mex », né au Texas, près de la frontière mexicaine. Rien à voir avec le pays !' },
    { question: 'Quelle variété de pomme de terre est la reine des frites en Belgique ?', choix: ['La Bintje', 'La Charlotte', 'La Ratte', 'La Vitelotte'], anecdote: 'Créée aux Pays-Bas en 1905, la Bintje porte le prénom d’une élève de son créateur.' },
    { question: 'Le cougnou est une brioche belge de quelle fête ?', choix: ['Noël', 'Pâques', 'Carnaval', 'La Saint-Nicolas'], anecdote: 'Sa forme représenterait l’Enfant Jésus emmailloté. On le décore parfois d’un petit sujet en terre cuite.' },
    { question: 'La tarte au riz est la grande spécialité de quelle ville ?', choix: ['Verviers', 'Ostende', 'Tournai', 'Arlon'], anecdote: 'Une pâte briochée, du riz au lait… et souvent un petit goût de safran.' },
    { question: 'Les lacquemants, gaufres fines au sirop, sont une spécialité de quelle ville ?', choix: ['Liège', 'Bruges', 'Charleroi', 'Namur'], anecdote: 'Impossible d’imaginer la Foire d’octobre de Liège sans leur odeur sucrée.' },
    { question: 'Avec quels fruits fait-on surtout le sirop de Liège ?', choix: ['Des poires et des pommes', 'Des fraises', 'Des oranges', 'Des cerises'], anecdote: 'Les fruits cuisent très longtemps jusqu’à devenir une pâte noire et brillante. Délicieux sur une tartine !' },
    { question: 'À quelle température l’eau bout-elle, au niveau de la mer ?', choix: ['100 °C', '80 °C', '120 °C', '60 °C'], anecdote: 'En haute montagne, elle bout plus tôt : les pâtes y cuisent moins vite !' },
    { question: 'Quel est l’ingrédient principal du tzatziki grec ?', choix: ['Le yaourt', 'La tomate', 'L’huile d’olive', 'La feta'], anecdote: 'Du yaourt, du concombre râpé, de l’ail et un peu d’aneth ou de menthe.' },
    { question: 'Que veut dire cuire « au bain-marie » ?', choix: ['Dans un récipient posé dans de l’eau chaude', 'Dans la mer', 'Au four très chaud', 'À la vapeur d’un fer à repasser'], anecdote: 'Cela chauffe tout doucement : idéal pour faire fondre du chocolat sans le brûler.' },
    { question: 'De quel pays viennent les nachos ?', choix: ['Du Mexique', 'Du Brésil', 'D’Espagne', 'Du Canada'], anecdote: 'Ils auraient été inventés vers 1943 par un certain Ignacio, surnommé « Nacho ».' },
    { question: 'Quelle bière belge est brassée dans une abbaye, sous le contrôle de moines ?', choix: ['La trappiste', 'La pils', 'La lambic', 'La stout'], anecdote: 'Chimay, Orval, Rochefort ou Westmalle… L’argent des ventes sert à faire vivre l’abbaye et des œuvres sociales.' }
  ];

  return { RECETTES, QUIZ };
});
