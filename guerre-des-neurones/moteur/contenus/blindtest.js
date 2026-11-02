/*
 * ════════════════════════════════════════════════════════════════════
 *  CONTENU — Blind test « des classiques »
 * ════════════════════════════════════════════════════════════════════
 *
 *  Pourquoi des mélodies écrites note par note plutôt que des chansons ?
 *  Parce que les chansons récentes sont protégées par le droit d'auteur :
 *  les diffuser lors d'une animation publique demande une autorisation.
 *  Ces airs-ci appartiennent tous au domaine public (musique classique,
 *  comptines, chants traditionnels). La tablette les joue elle-même
 *  grâce à un petit synthétiseur : aucun fichier, aucune connexion.
 *
 *  Comment lire une mélodie ?
 *    « E4:1 D#4:.5 R:.5 »
 *     │ │  └── la durée, en temps (1 = une noire, .5 = une croche…)
 *     │ └───── l'octave (4 = l'octave du milieu du piano)
 *     └─────── la note en notation anglaise : C=do, D=ré, E=mi, F=fa,
 *              G=sol, A=la, B=si ; « # » = dièse ; « R » = un silence.
 *  « tempo » est le nombre de temps par minute : plus il est grand,
 *  plus l'air est joué vite.
 *
 *  Vous voulez ajouter VOS musiques (fichiers mp3) ? Placez-les dans
 *  public/musiques/ et ajoutez une fiche avec « fichier » à la place de
 *  « notes », par exemple :
 *    { titre: 'Notre chanson de mariage', auteur: 'Papy & Mamie', annee: 1972,
 *      fichier: 'musiques/mariage.mp3', anecdote: '…' }
 *  Pour une diffusion en public, vérifiez que vous en avez le droit.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/blindtest', function () {
  'use strict';
  return [
    { titre: 'Frère Jacques', auteur: 'Chanson traditionnelle', annee: 1780, tempo: 130,
      notes: 'C4:1 D4:1 E4:1 C4:1 C4:1 D4:1 E4:1 C4:1 E4:1 F4:1 G4:2 E4:1 F4:1 G4:2 G4:.5 A4:.5 G4:.5 F4:.5 E4:1 C4:1 G4:.5 A4:.5 G4:.5 F4:.5 E4:1 C4:1 C4:1 G3:1 C4:2 C4:1 G3:1 C4:2',
      anecdote: 'Ce canon existe dans des dizaines de langues ; en anglais, Jacques devient « Brother John ».' },
    { titre: 'Au clair de la lune', auteur: 'Chanson traditionnelle', annee: 1780, tempo: 110,
      notes: 'C4:1 C4:1 C4:1 D4:1 E4:2 D4:2 C4:1 E4:1 D4:1 D4:1 C4:4',
      anecdote: 'En 1860, Édouard-Léon Scott de Martinville l\'enregistre sur son phonautographe : c\'est l\'un des plus anciens enregistrements de voix humaine.' },
    { titre: 'Ah ! vous dirai-je, maman', auteur: 'Chanson traditionnelle', annee: 1761, tempo: 120,
      notes: 'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
      anecdote: 'Mozart en a tiré douze variations pour piano. Les anglophones la chantent sur « Twinkle, Twinkle, Little Star ».' },
    { titre: 'Ode à la joie', auteur: 'Ludwig van Beethoven', annee: 1824, tempo: 120,
      notes: 'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:.5 D4:2 E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:.5 C4:2',
      anecdote: 'Extraite de la Neuvième symphonie, c\'est aujourd\'hui l\'hymne de l\'Union européenne.' },
    { titre: 'Lettre à Élise', auteur: 'Ludwig van Beethoven', annee: 1810, tempo: 140,
      notes: 'E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1.5 R:.5 C4:.5 E4:.5 A4:.5 B4:1.5 R:.5 E4:.5 G#4:.5 B4:.5 C5:1.5 R:.5 E4:.5 E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:2',
      anecdote: 'Personne ne sait qui était Élise : certains pensent à une erreur de lecture du nom « Thérèse ».' },
    { titre: 'Cinquième symphonie', auteur: 'Ludwig van Beethoven', annee: 1808, tempo: 108,
      notes: 'R:.5 G4:.5 G4:.5 G4:.5 D#4:3 R:.5 F4:.5 F4:.5 F4:.5 D4:4',
      anecdote: 'Pendant la Seconde Guerre mondiale, la BBC utilisait ces quatre notes : elles rappellent le « V » de la victoire en morse (…–).' },
    { titre: 'Joyeux anniversaire', auteur: 'Mildred et Patty Hill', annee: 1893, tempo: 100,
      notes: 'G4:.75 G4:.25 A4:1 G4:1 C5:1 B4:2 G4:.75 G4:.25 A4:1 G4:1 D5:1 C5:2 G4:.75 G4:.25 G5:1 E5:1 C5:1 B4:1 A4:2 F5:.75 F5:.25 E5:1 C5:1 D5:1 C5:2',
      anecdote: 'La mélodie s\'appelait d\'abord « Good Morning to All », une chanson pour accueillir les enfants à l\'école.' },
    { titre: 'Vive le vent (Jingle Bells)', auteur: 'James Lord Pierpont', annee: 1857, tempo: 160,
      notes: 'E4:1 E4:1 E4:2 E4:1 E4:1 E4:2 E4:1 G4:1 C4:1.5 D4:.5 E4:4 F4:1 F4:1 F4:1.5 F4:.5 F4:1 E4:1 E4:1 E4:.5 E4:.5 E4:1 D4:1 D4:1 E4:1 D4:2 G4:2',
      anecdote: 'Elle a d\'abord été écrite pour une fête de Thanksgiving, pas pour Noël.' },
    { titre: 'La Marseillaise', auteur: 'Claude Joseph Rouget de Lisle', annee: 1792, tempo: 100,
      notes: 'D4:.5 D4:.375 D4:.125 G4:1 G4:1 A4:1 A4:1 D5:1.5 B4:.5 G4:.75 G4:.25 B4:.75 G4:.25 E4:1 C5:2 A4:.75 F#4:.25 G4:2',
      anecdote: 'Composée à Strasbourg, elle tient son nom des volontaires marseillais qui la chantaient en montant à Paris.' },
    { titre: 'Dans l\'antre du roi de la montagne', auteur: 'Edvard Grieg', annee: 1875, tempo: 140,
      notes: 'B3:.5 C#4:.5 D4:.5 E4:.5 F#4:.5 D4:.5 F#4:1 F4:.5 C#4:.5 F4:1 E4:.5 C4:.5 E4:1 B3:.5 C#4:.5 D4:.5 E4:.5 F#4:.5 D4:.5 F#4:.5 B4:.5 A4:.5 F#4:.5 D4:.5 F#4:.5 A4:2',
      anecdote: 'Elle accompagne la pièce « Peer Gynt » d\'Ibsen. Grieg lui-même trouvait ce morceau… insupportable !' },
    { titre: 'Une petite musique de nuit', auteur: 'Wolfgang Amadeus Mozart', annee: 1787, tempo: 130,
      notes: 'G4:1 R:.5 D4:.5 G4:1 R:.5 D4:.5 G4:.5 D4:.5 G4:.5 B4:.5 D5:2 C5:1 R:.5 A4:.5 C5:1 R:.5 A4:.5 C5:.5 A4:.5 F#4:.5 A4:.5 D4:2',
      anecdote: 'Mozart l\'a notée dans son catalogue en 1787, mais on ne l\'a publiée qu\'après sa mort.' },
    { titre: 'La Marche turque', auteur: 'Wolfgang Amadeus Mozart', annee: 1783, tempo: 120,
      notes: 'B4:.25 A4:.25 G#4:.25 A4:.25 C5:1 D5:.25 C5:.25 B4:.25 C5:.25 E5:1 F5:.25 E5:.25 D#5:.25 E5:.25 B5:.25 A5:.25 G#5:.25 A5:.25 B5:.25 A5:.25 G#5:.25 A5:.25 C6:2',
      anecdote: 'Mozart imite les fanfares des janissaires ottomans, très à la mode à Vienne à l\'époque.' },
    { titre: 'Douce nuit', auteur: 'Franz Xaver Gruber', annee: 1818, tempo: 90,
      notes: 'G4:1.5 A4:.5 G4:1 E4:3 G4:1.5 A4:.5 G4:1 E4:3 D5:2 D5:1 B4:3 C5:2 C5:1 G4:3',
      anecdote: 'Elle a été jouée pour la première fois à la guitare, l\'orgue de l\'église d\'Oberndorf étant en panne.' },
    { titre: 'Le Printemps (Les Quatre Saisons)', auteur: 'Antonio Vivaldi', annee: 1725, tempo: 110,
      notes: 'E4:.5 G#4:.5 G#4:.5 G#4:.5 F#4:.25 E4:.25 B4:1.5 B4:.25 A4:.25 G#4:.5 G#4:.5 G#4:.5 F#4:.25 E4:.25 B4:1.5',
      anecdote: 'Vivaldi a accompagné chaque saison d\'un petit poème : on y entend les oiseaux, les ruisseaux et même un chien qui aboie.' },
    { titre: 'Guillaume Tell (ouverture)', auteur: 'Gioachino Rossini', annee: 1829, tempo: 150,
      notes: 'E4:.25 E4:.25 E4:.5 E4:.25 E4:.25 E4:.5 E4:.25 E4:.25 A4:.5 B4:.5 C#5:.5 E4:.25 E4:.25 E4:.5 E4:.25 E4:.25 E4:.5 A4:.25 C#5:.25 B4:.5 G#4:.5 E4:1',
      anecdote: 'Ce galop a servi d\'indicatif au « Lone Ranger » à la radio et à la télévision américaines.' },
    { titre: 'Berceuse', auteur: 'Johannes Brahms', annee: 1868, tempo: 100,
      notes: 'E4:.5 E4:.5 G4:2 E4:.5 E4:.5 G4:2 E4:.5 G4:.5 C5:1 B4:1.5 A4:.5 A4:1 G4:1 D4:.5 E4:.5 F4:1 D4:1 D4:.5 E4:.5 F4:2 D4:.5 F4:.5 B4:.5 A4:.5 G4:1 B4:1 C5:2',
      anecdote: 'Brahms l\'a écrite pour la naissance du deuxième enfant d\'une amie chanteuse.' },
    { titre: 'Habanera (Carmen)', auteur: 'Georges Bizet', annee: 1875, tempo: 100,
      notes: 'D5:1.5 C#5:.5 C5:1 C5:1 B4:1.5 A#4:.5 A4:1 A4:1 G#4:1.5 G4:.5 F4:.5 E4:.5 F4:.5 G4:.5 E4:2',
      anecdote: 'Bizet croyait reprendre une chanson populaire ; elle était en fait signée du compositeur Sebastián Iradier.' }
  ];
});
