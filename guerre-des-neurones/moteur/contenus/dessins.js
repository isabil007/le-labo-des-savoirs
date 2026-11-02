/*
 * ════════════════════════════════════════════════════════════════════
 *  CONTENU — Mots à dessiner (« Dessine et devine »)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Une liste de mots que l'on peut dessiner en une minute, avec une
 *  touche belge et quelques clins d'œil aux générations (le dentier,
 *  le selfie, la cabine téléphonique…). Le jeu en tire un au hasard
 *  pour chaque dessinateur ; celui-ci peut en changer une fois.
 *
 *  Ajoutez simplement vos mots entre guillemets, séparés par des virgules.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/dessins', function () {
  'use strict';
  return [
    'chat', 'vélo', 'parapluie', 'gaufre', 'frites', 'château', 'pirate', 'fusée', 'licorne', 'dinosaure',
    'guitare', 'sapin', 'bonhomme de neige', 'escargot', 'arc-en-ciel', 'pizza', 'moustache', 'girafe', 'phare', 'sirène',
    'robot', 'volcan', 'tortue', 'train', 'hélicoptère', 'cactus', 'papillon', 'couronne', 'montgolfière', 'pingouin',
    'abeille', 'ananas', 'éléphant', 'tente', 'fantôme', 'sorcière', 'kangourou', 'avion', 'lunettes', 'dentier',
    'selfie', 'trottinette', 'chaussette', 'igloo', 'araignée', 'baleine', 'citrouille', 'Atomium', 'Manneken-Pis', 'cabine téléphonique',
    'tricot', 'brosse à dents', 'parachute', 'boussole', 'cerf-volant', 'ours polaire', 'hamburger', 'sous-marin', 'moulin à vent', 'chaussure',
    'pomme', 'banane', 'carotte', 'bateau', 'voiture', 'maison', 'soleil', 'lune', 'étoile', 'nuage', 'arbre', 'fleur', 'poisson', 'oiseau', 'lapin', 'cochon', 'vache', 'cheval', 'serpent', 'crocodile', 'grenouille', 'coccinelle', 'champignon', 'gâteau d’anniversaire', 'bougie', 'cadeau', 'ballon', 'clé', 'horloge', 'télévision', 'ordinateur', 'téléphone', 'appareil photo', 'piano', 'tambour', 'trompette', 'raquette', 'plage', 'île', 'pont', 'tour Eiffel', 'pyramide', 'château de sable', 'ancre', 'sablier', 'loupe', 'marteau', 'balai', 'échelle', 'toboggan', 'balançoire', 'chapeau', 'écharpe', 'cravate', 'sac à dos', 'canapé', 'baignoire', 'dragon', 'extraterrestre', 'astronaute'
  ];
});
