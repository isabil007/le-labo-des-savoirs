/*
 * ════════════════════════════════════════════════════════════════════
 *  LES IMAGES DU ZOOM INFERNAL
 * ════════════════════════════════════════════════════════════════════
 *
 *  Chaque image commence énormément agrandie sur la tablette, puis se
 *  dézoome peu à peu : il faut reconnaître le sujet le plus vite possible.
 *
 *  Deux sortes d'images, sans aucun souci de droits d'auteur :
 *
 *   • « image » : un pictogramme (émoji). Il est dessiné par la tablette
 *     elle-même, avec ses propres caractères : rien n'est copié ni
 *     téléchargé.
 *
 *   • « photo » : VOS photos. Déposez le fichier dans le dossier
 *     public/zoom/ (par exemple public/zoom/tour-eiffel.jpg) et ajoutez
 *     une ligne :  { sujet: 'La tour Eiffel', photo: 'zoom/tour-eiffel.jpg', famille: 'lieux' }
 *     N'utilisez que des photos que vous avez prises vous-même ou que
 *     vous avez le droit de diffuser.
 *
 *  La « famille » sert à choisir les mauvaises réponses : on propose des
 *  sujets de la même famille (une fraise parmi d'autres fruits), sinon ce
 *  serait trop facile. Chaque famille doit compter au moins 4 sujets.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/zoom', function () {
  'use strict';
  return [
    // Les fruits
    { sujet: 'Une fraise', image: '🍓', famille: 'fruits' },
    { sujet: 'Un ananas', image: '🍍', famille: 'fruits' },
    { sujet: 'Une pastèque', image: '🍉', famille: 'fruits' },
    { sujet: 'Un citron', image: '🍋', famille: 'fruits' },
    { sujet: 'Des cerises', image: '🍒', famille: 'fruits' },
    { sujet: 'Un kiwi', image: '🥝', famille: 'fruits' },
    { sujet: 'Une banane', image: '🍌', famille: 'fruits' },
    { sujet: 'Du raisin', image: '🍇', famille: 'fruits' },
    // Les animaux
    { sujet: 'Une girafe', image: '🦒', famille: 'animaux' },
    { sujet: 'Un éléphant', image: '🐘', famille: 'animaux' },
    { sujet: 'Un zèbre', image: '🦓', famille: 'animaux' },
    { sujet: 'Une tortue', image: '🐢', famille: 'animaux' },
    { sujet: 'Un hérisson', image: '🦔', famille: 'animaux' },
    { sujet: 'Une pieuvre', image: '🐙', famille: 'animaux' },
    { sujet: 'Un flamant rose', image: '🦩', famille: 'animaux' },
    { sujet: 'Une abeille', image: '🐝', famille: 'animaux' },
    // Les objets de la maison
    { sujet: 'Un réveil', image: '⏰', famille: 'objets' },
    { sujet: 'Un parapluie', image: '☂️', famille: 'objets' },
    { sujet: 'Une guitare', image: '🎸', famille: 'objets' },
    { sujet: 'Une clé', image: '🔑', famille: 'objets' },
    { sujet: 'Une ampoule', image: '💡', famille: 'objets' },
    { sujet: 'Un aimant', image: '🧲', famille: 'objets' },
    { sujet: 'Un ballon de baudruche', image: '🎈', famille: 'objets' },
    { sujet: 'Une bougie', image: '🕯️', famille: 'objets' },
    // Les bonnes choses (avec une touche belge)
    { sujet: 'Une pizza', image: '🍕', famille: 'gourmandises' },
    { sujet: 'Un croissant', image: '🥐', famille: 'gourmandises' },
    { sujet: 'Une gaufre', image: '🧇', famille: 'gourmandises' },
    { sujet: 'Des frites', image: '🍟', famille: 'gourmandises' },
    { sujet: 'Du fromage', image: '🧀', famille: 'gourmandises' },
    { sujet: 'Un beignet', image: '🍩', famille: 'gourmandises' },
    { sujet: 'Un bretzel', image: '🥨', famille: 'gourmandises' },
    { sujet: 'Une glace', image: '🍦', famille: 'gourmandises' },
    // La nature
    { sujet: 'Un tournesol', image: '🌻', famille: 'nature' },
    { sujet: 'Un champignon', image: '🍄', famille: 'nature' },
    { sujet: 'Un cactus', image: '🌵', famille: 'nature' },
    { sujet: 'Un arc-en-ciel', image: '🌈', famille: 'nature' },
    { sujet: 'Un flocon de neige', image: '❄️', famille: 'nature' },
    { sujet: 'Un volcan', image: '🌋', famille: 'nature' },
    { sujet: 'Une feuille d’érable', image: '🍁', famille: 'nature' },
    { sujet: 'Un sapin', image: '🌲', famille: 'nature' },
    // Les véhicules
    { sujet: 'Un vélo', image: '🚲', famille: 'vehicules' },
    { sujet: 'Une locomotive', image: '🚂', famille: 'vehicules' },
    { sujet: 'Un hélicoptère', image: '🚁', famille: 'vehicules' },
    { sujet: 'Un voilier', image: '⛵', famille: 'vehicules' },
    { sujet: 'Une fusée', image: '🚀', famille: 'vehicules' },
    { sujet: 'Une trottinette', image: '🛴', famille: 'vehicules' },
    { sujet: 'Un tracteur', image: '🚜', famille: 'vehicules' },
    { sujet: 'Un camion de pompiers', image: '🚒', famille: 'vehicules' },
    { sujet: 'Un ballon de football', image: '⚽', famille: 'sports' },
    { sujet: 'Un ballon de basket', image: '🏀', famille: 'sports' },
    { sujet: 'Une balle de tennis', image: '🎾', famille: 'sports' },
    { sujet: 'Un ballon de football américain', image: '🏈', famille: 'sports' },
    { sujet: 'Une raquette de ping-pong', image: '🏓', famille: 'sports' },
    { sujet: 'Un gant de boxe', image: '🥊', famille: 'sports' },
    { sujet: 'Un piano', image: '🎹', famille: 'musique' },
    { sujet: 'Un tambour', image: '🥁', famille: 'musique' },
    { sujet: 'Une trompette', image: '🎺', famille: 'musique' },
    { sujet: 'Un violon', image: '🎻', famille: 'musique' },
    { sujet: 'Un saxophone', image: '🎷', famille: 'musique' },
    { sujet: 'Un canapé', image: '🛋️', famille: 'maison' },
    { sujet: 'Une baignoire', image: '🛁', famille: 'maison' },
    { sujet: 'Une porte', image: '🚪', famille: 'maison' },
    { sujet: 'Un lit', image: '🛏️', famille: 'maison' },
    { sujet: 'Un ours en peluche', image: '🧸', famille: 'maison' },
    { sujet: 'Une baleine', image: '🐳', famille: 'mer' },
    { sujet: 'Un dauphin', image: '🐬', famille: 'mer' },
    { sujet: 'Un crabe', image: '🦀', famille: 'mer' },
    { sujet: 'Un poisson tropical', image: '🐠', famille: 'mer' },
    { sujet: 'Un requin', image: '🦈', famille: 'mer' },
    { sujet: 'Un coquillage', image: '🐚', famille: 'mer' }
  ];
});
