/*
 * ════════════════════════════════════════════════════════════════════
 *  LES GAGES SECRETS
 * ════════════════════════════════════════════════════════════════════
 *
 *  Au début de chaque partie, chaque joueur reçoit en secret, sur son
 *  téléphone, un petit gage à accomplir pendant la soirée, autour de la
 *  table, sans se faire repérer. À la fin, avant le podium, c'est le
 *  « tribunal des gages » : la tablette révèle chaque gage et les autres
 *  joueurs votent sur leur téléphone. Gage réussi : une grosse prime, de
 *  quoi bousculer le classement au dernier moment !
 *
 *  Pour en ajouter : une phrase courte, faisable assis à table, drôle et
 *  bienveillante, sans rien de gênant ni de dangereux. Il en faut au
 *  moins douze (une par joueur possible).
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/gages', function () {
  'use strict';
  return [
    'Placer le mot « pingouin » dans une conversation, l’air de rien.',
    'Faire dire « fromage » à quelqu’un de la table.',
    'Réussir à faire trinquer toute la table (même avec de l’eau).',
    'Complimenter la coiffure de trois personnes différentes.',
    'Dire « C’était mieux avant » deux fois, le plus naturellement du monde.',
    'Faire rire le joueur qui est en tête du classement.',
    'Fredonner un petit air pendant une partie, sans qu’on te le demande.',
    'Faire un clin d’œil à chaque joueur sans te faire repérer.',
    'Obtenir qu’on te passe un objet (le sel, un verre…) sans le demander directement.',
    'Raconter une anecdote qui commence par « Quand j’étais petit… ».',
    'Applaudir avec enthousiasme au moins trois mauvaises réponses.',
    'Taper dans la main (tope là !) de deux joueurs différents.',
    'Placer le mot « sapristi » au moins une fois dans la soirée.',
    'Poser la main sur ton cœur chaque fois que tu gagnes des points.',
    'Convaincre quelqu’un de changer de place avec toi.',
    'Imiter un cri d’animal au bon moment, sans donner d’explication.',
    'Faire dire « oui » trois fois de suite à la même personne.',
    'Parler avec un accent pendant toute une question.',
    'Commencer une phrase par « Comme disait ma grand-mère… ».',
    'Faire semblant d’avoir trouvé la réponse avant tout le monde, avec un grand « Ah ! ».',
    'Placer le mot « ornithorynque » dans une conversation.',
    'Faire dire « merci » à trois personnes différentes.',
    'Chanter le début d’une chanson et obtenir que quelqu’un continue.',
    'Dire « Mamma mia ! » au moins deux fois dans la soirée.',
    'Faire un compliment sincère à chaque joueur.',
    'Réussir à faire rire quelqu’un sans dire un seul mot.',
    'Lever les bras en criant « Victoire ! » après une bonne réponse.',
    'Parler de la météo trois fois dans la soirée, sans raison.',
    'Obtenir que quelqu’un raconte son meilleur souvenir de vacances.',
    'Faire semblant d’éternuer au moment d’une révélation.',
    'Parler de toi à la troisième personne pendant toute une manche.',
    'Glisser le mot « gaufre » dans trois phrases différentes.',
    'Faire bâiller quelqu’un (en bâillant toi-même, discrètement).',
    'Demander l’heure à deux personnes différentes.',
    'Faire une révérence à la fin d’une manche.',
    'Dire « Saperlipopette ! » au bon moment.',
    'Donner un surnom amusant à un joueur et le faire adopter par la table.',
    'Finir deux fois la phrase de quelqu’un à sa place.',
    'Faire danser quelqu’un sur sa chaise.',
    'Applaudir le dernier de la manche avec beaucoup d’enthousiasme.',
    'Dire « C’est exactement ce que j’allais dire ! » après la réponse de quelqu’un.',
    'Faire un pouce levé à chaque joueur au moins une fois.',
    'Glisser le mot « dinosaure » dans une phrase qui n’a rien à voir.',
    'Rester silencieux pendant toute une manche… sauf pour rire.',
    'Faire dire « au revoir » à quelqu’un alors que personne ne part.'
  ];
});
