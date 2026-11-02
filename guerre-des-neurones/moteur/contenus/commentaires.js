/*
 * ════════════════════════════════════════════════════════════════════
 *  LE COMMENTATEUR DE LA TABLÉE (les phrases qui font sourire)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Entre deux manches, la tablette affiche le classement… et un petit
 *  commentaire, comme à la radio un soir de match. Le moteur choisit la
 *  famille de phrases selon la situation (course serrée, échappée, belle
 *  remontée…) puis en tire une au hasard, pour ne pas radoter.
 *
 *  Les mots entre accolades sont remplacés au moment de l'affichage :
 *    {premier}   le joueur en tête (avec son avatar)
 *    {deuxieme}  son poursuivant le plus proche
 *    {dernier}   celui qui ferme la marche
 *    {ecart}     les points entre le premier et le deuxième
 *    {remonteur} le joueur qui a le plus marqué pendant la manche
 *    {gain}      les points qu'il a marqués
 *    {objectif}  l'objectif de la partie surprise
 *    {reste}     ce qu'il manque au premier pour l'atteindre
 *
 *  Pour en ajouter : copier une ligne, garder un humour bienveillant
 *  (on taquine, on ne vexe jamais), rien de gênant pour les enfants.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/commentaires', function () {
  'use strict';
  return {
    // Égalité parfaite en tête.
    egalite: [
      '{premier} et {deuxieme} sont à égalité parfaite. On sort la calculette de grand-père pour vérifier ?',
      'Égalité en tête ! {premier} et {deuxieme} se regardent en chiens de faïence.'
    ],
    // Moins de 600 points d'écart.
    serre: [
      'Seulement {ecart} points entre {premier} et {deuxieme}. On retient son souffle… mais pas trop longtemps.',
      '{premier} et {deuxieme} se tiennent dans un mouchoir de poche. Un vrai mouchoir en tissu, comme chez mamie.',
      'Ça chauffe en tête ! {deuxieme} est à {ecart} points de {premier}. Le dessert n\'est pas encore servi.'
    ],
    // Un écart « normal ».
    tete: [
      '{premier} mène la danse. Les autres, il est encore temps de réviser… discrètement.',
      '{premier} est en tête. Quelqu\'un a vérifié qu\'il n\'y avait pas d\'antisèche sous la nappe ?',
      '{premier} prend les commandes avec {ecart} points d\'avance. {deuxieme} affûte ses crayons.'
    ],
    // Plus de 3 500 points d'écart.
    large: [
      '{premier} file comme un TGV ! Les autres, n\'oubliez pas : en finale, les points comptent double…',
      '{premier} a {ecart} points d\'avance. Rien n\'est joué : même le lièvre a perdu contre la tortue.',
      'Belle échappée de {premier}. Le peloton se réorganise autour du plateau de fromages.'
    ],
    // Le joueur qui a le plus marqué pendant la manche (s'il n'est pas déjà premier).
    remontee: [
      '{remonteur} a fait la manche de la soirée : +{gain} points. C\'est le café qui fait effet ?',
      'Quelle remontée de {remonteur} ! +{gain} points d\'un coup. Les autres sont prévenus.',
      '{remonteur} se réveille avec +{gain} points. Attention, ça sent la revanche.'
    ],
    // Celui qui ferme la marche, toujours avec tendresse.
    dernier: [
      '{dernier} ferme la marche avec élégance. Rappelons que la tortue a gagné contre le lièvre.',
      '{dernier} est dernier pour l\'instant… c\'est une stratégie, paraît-il.',
      '{dernier} garde ses forces pour la fin. Très malin. Ou très fatigué.'
    ],
    // Quand le premier approche de l'objectif de la partie surprise.
    objectifProche: [
      'Plus que {reste} points pour que {premier} franchisse la ligne d\'arrivée des {objectif} points !',
      '{premier} voit déjà la ligne d\'arrivée : il lui manque {reste} points. Qui va lui barrer la route ?'
    ],
    // L'annonce de la Grande Finale quand quelqu'un atteint l'objectif.
    finaleObjectif: [
      '🚨 {premier} franchit la ligne des {objectif} points ! La prochaine manche est la Grande Finale : points doublés, tout peut encore basculer !',
      '🚨 Ligne d\'arrivée franchie par {premier} ! Dernière chance pour tout le monde : Grande Finale, points doublés !'
    ],
    // L'annonce de la Grande Finale quand la partie a assez duré.
    finaleLimite: [
      '⏰ L\'heure tourne ! La prochaine manche sera la Grande Finale, avec les points doublés. {premier} n\'a pas encore gagné…',
      '⏰ Dernière ligne droite : place à la Grande Finale ! Points doublés, nerfs d\'acier exigés.'
    ]
  };
});
