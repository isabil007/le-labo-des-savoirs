/*
 * ════════════════════════════════════════════════════════════════════
 *  CONTENU — IST’ORY : l'histoire des IST et du VIH
 * ════════════════════════════════════════════════════════════════════
 *
 *  quiz   : « Le saviez-vous ? ». La bonne réponse est la première des
 *           « choix » (le jeu mélange). « correction » raconte la suite.
 *  frises : « La frise du temps ». Les étapes sont écrites DANS L'ORDRE
 *           CHRONOLOGIQUE et SANS DATE (sinon ce serait trop facile) ;
 *           les dates sont données dans la correction.
 *
 *  Uniquement des faits historiques bien établis. Pour en ajouter un,
 *  vérifiez la date dans une source fiable.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/histoire', function () {
  'use strict';

  const quiz = [
    /* ─── La syphilis, « grande imitatrice » depuis cinq siècles ─── */
    { theme: '1495', question: 'En 1495, la syphilis éclate dans l\'armée du roi Charles VIII. Pendant quel siège ?', choix: ['Le siège de Naples', 'Le siège de Paris', 'Le siège de Bruges', 'Le siège de Vienne'], correction: 'Les Français l\'appellent alors le « mal napolitain », les Italiens le « mal français » : chacun accuse son voisin.' },
    { theme: '1530', question: 'D\'où vient le nom « syphilis » ?', choix: ['D\'un poème de Fracastor dont le héros, le berger Syphilus, est puni par les dieux', 'Du nom du médecin qui l\'a décrite', 'D\'un mot grec signifiant « amour caché »', 'D\'une île grecque'], correction: 'En 1530, le médecin italien Girolamo Fracastoro publie un poème en latin : son berger Syphilus donne son nom à la maladie.' },
    { theme: '1879', question: 'En 1879, un médecin allemand identifie la bactérie de la gonorrhée. Elle porte son nom :', choix: ['Neisser : Neisseria gonorrhoeae', 'Koch : Kochia gonorrhoeae', 'Pasteur : Pasteurella gonorrhoeae', 'Ehrlich : Ehrlichia gonorrhoeae'], correction: 'Albert Neisser a 24 ans quand il décrit le gonocoque.' },
    { theme: '1905', question: 'En 1905, Schaudinn et Hoffmann observent au microscope l\'agent de la syphilis. Lequel ?', choix: ['Treponema pallidum, une spirochète', 'Un virus', 'Un parasite intestinal', 'Le gonocoque'], correction: 'Pallidum veut dire « pâle » : la bactérie se colore très mal, d\'où la difficulté à la voir.' },
    { theme: '1910', question: 'En 1910, Paul Ehrlich lance le Salvarsan contre la syphilis. Comment surnomme-t-on ce premier médicament « ciblé » ?', choix: ['La « balle magique »', 'La « pilule du bonheur »', 'Le « remède de cheval »', 'L\'« élixir de Vienne »'], correction: 'Le Salvarsan était le composé n° 606 testé par son équipe. Avant lui, on traitait la syphilis au mercure, avec de lourds effets toxiques.' },
    { theme: '1943', question: 'Alexander Fleming découvre la pénicilline en 1928. Quand soigne-t-on pour la première fois la syphilis avec elle ?', choix: ['En 1943', 'En 1929', 'En 1965', 'En 1981'], correction: 'En 1943, John Mahoney guérit ses premiers patients. La pénicilline reste aujourd\'hui le traitement de référence de la syphilis.' },
    { theme: '1932-1972', question: 'L\'étude de Tuskegee, aux États-Unis, a suivi des hommes noirs atteints de syphilis…', choix: ['Sans les soigner, même après l\'arrivée de la pénicilline', 'En leur donnant un vaccin expérimental', 'En les soignant gratuitement dès 1932', 'En testant le préservatif'], correction: 'Le scandale, révélé en 1972, a profondément marqué l\'éthique de la recherche : consentement éclairé et protection des participants.' },

    /* ─── Le VIH, de 1981 à I = I ─── */
    { theme: '1981', question: 'Le 5 juin 1981, un bulletin des autorités sanitaires américaines (CDC) décrit…', choix: ['Cinq cas d\'une pneumonie rare chez de jeunes hommes à Los Angeles', 'La découverte du virus du sida', 'Le premier test de dépistage', 'Le premier traitement'], correction: 'Cette date est considérée comme le début officiel de l\'épidémie. Le mot « sida » n\'existe pas encore.' },
    { theme: '1983', question: 'En 1983, qui isole pour la première fois le virus responsable du sida ?', choix: ['Une équipe de l\'Institut Pasteur, à Paris', 'Une équipe d\'Oxford', 'L\'OMS, à Genève', 'Un hôpital de Kinshasa'], correction: 'Françoise Barré-Sinoussi et Luc Montagnier reçoivent pour cette découverte le prix Nobel de médecine en 2008.' },
    { theme: '1985', question: 'En quelle année le premier test de dépistage du VIH est-il commercialisé ?', choix: ['1985', '1981', '1995', '2001'], correction: 'Quatre ans seulement après les premiers cas décrits. Il permet aussi de sécuriser les dons de sang.' },
    { theme: '1987', question: 'Quel est le premier médicament contre le VIH, autorisé en 1987 ?', choix: ['L\'AZT (zidovudine)', 'La pénicilline', 'La PrEP', 'Le Salvarsan'], correction: 'Utilisé seul, l\'AZT ne suffisait pas : le virus devenait vite résistant. La réponse viendra des associations de médicaments.' },
    { theme: '1996', question: 'Que présente la conférence internationale de Vancouver, en 1996 ?', choix: ['L\'efficacité des trithérapies', 'Le premier vaccin contre le VIH', 'La guérison du VIH', 'La PrEP'], correction: 'En associant plusieurs antirétroviraux, la mortalité chute de façon spectaculaire : le VIH devient peu à peu une maladie chronique.' },
    { theme: '1988', question: 'Depuis 1988, que se passe-t-il chaque 1er décembre ?', choix: ['La Journée mondiale de lutte contre le sida', 'La Journée du préservatif', 'La Journée du dépistage des hépatites', 'La fête de la santé sexuelle'], correction: 'C\'est la première journée mondiale consacrée à une question de santé, lancée par l\'OMS.' },
    { theme: '1991', question: 'Le ruban rouge, symbole de la lutte contre le sida, est né…', choix: ['En 1991, à New York', 'En 1981, à Paris', 'En 2001, à Genève', 'En 1969, à San Francisco'], correction: 'Il a été imaginé par un collectif d\'artistes, Visual AIDS. Le ruban rose contre le cancer du sein s\'en est ensuite inspiré.' },
    { theme: '1995', question: 'Quel Belge a dirigé ONUSIDA dès sa création, en 1995 ?', choix: ['Peter Piot', 'Christian de Duve', 'Ilya Prigogine', 'Paul Janssen'], correction: 'Peter Piot avait aussi participé, en 1976, à la découverte du virus Ebola.' },
    { theme: '2008', question: 'En 2008, la « déclaration suisse » affirme…', choix: ['Qu\'une personne sous traitement efficace ne transmet pas le VIH par voie sexuelle', 'Que le VIH se guérit', 'Que le préservatif est inutile', 'Qu\'un vaccin est disponible'], correction: 'D\'abord contestée, l\'idée est confirmée ensuite par de grandes études et devient en 2016 le message I = I (indétectable = intransmissible).' },
    { theme: '2007-2009', question: 'Pourquoi le « patient de Berlin », Timothy Ray Brown, est-il célèbre ?', choix: ['Première personne guérie du VIH, après une greffe de moelle pour une leucémie', 'Premier patient traité par l\'AZT', 'Premier patient sous PrEP', 'Premier cas de VIH décrit en Europe'], correction: 'Son donneur portait une mutation qui empêche le virus d\'entrer dans les cellules. Une greffe très lourde : ce n\'est pas un traitement possible pour tous.' },
    { theme: '2012', question: 'Quelle stratégie de prévention les États-Unis autorisent-ils en 2012 ?', choix: ['La PrEP', 'Le vaccin VIH', 'Le préservatif interne', 'Le dépistage à domicile'], correction: 'En Belgique, la PrEP est remboursée depuis 2017.' },

    /* ─── Hépatites, HPV, herpès, préservatif ─── */
    { theme: '1989', question: 'En quelle année le virus de l\'hépatite C est-il identifié ?', choix: ['1989', '1965', '1945', '2005'], correction: 'Ses découvreurs reçoivent le prix Nobel de médecine en 2020. Aujourd\'hui, des antiviraux de 2 à 3 mois guérissent la plupart des hépatites C.' },
    { theme: 'Années 1980', question: 'Pourquoi le vaccin contre l\'hépatite B est-il surnommé le premier vaccin « anticancer » ?', choix: ['Il prévient une infection qui peut causer un cancer du foie', 'Il soigne le cancer du foie', 'Il prévient le cancer du col', 'Il a été découvert par un cancérologue'], correction: 'Le même raisonnement vaut pour le vaccin HPV, qui prévient des cancers du col, de l\'anus et de la gorge.' },
    { theme: '2008', question: 'En 2008, Harald zur Hausen reçoit le prix Nobel. Pour quelle découverte ?', choix: ['Le rôle des HPV dans le cancer du col de l\'utérus', 'Le virus de l\'hépatite C', 'Le traitement de la syphilis', 'Le premier antirétroviral'], correction: 'Il partage ce Nobel avec Françoise Barré-Sinoussi et Luc Montagnier, découvreurs du VIH.' },
    { theme: 'Antiquité', question: 'Le mot « herpès » vient du grec « herpein ». Qui signifie…', choix: ['Ramper', 'Brûler', 'Se cacher', 'Revenir'], correction: 'Les lésions semblent « ramper » sur la peau. Déjà Hippocrate employait le mot.' },
    { theme: 'Vers 1640', question: 'Les plus anciens préservatifs retrouvés en Europe (château de Dudley, Angleterre) étaient faits…', choix: ['D\'intestin animal', 'De caoutchouc', 'De lin huilé', 'De papier'], correction: 'Ils étaient réutilisés… Aujourd\'hui : un préservatif neuf à chaque rapport.' },
    { theme: 'Années 1920', question: 'Dans les années 1920, quelle matière transforme le préservatif ?', choix: ['Le latex', 'Le nylon', 'Le silicone', 'Le plastique'], correction: 'Après le caoutchouc du 19e siècle, le latex rend le préservatif plus fin, plus solide, et fabricable en série.' }
  ];

  const frises = [
    { consigne: 'La syphilis à travers les siècles, du plus ancien au plus récent', etapes: ['Épidémie dans l\'armée de Charles VIII, à Naples', 'Fracastor donne son nom à la maladie', 'Découverte de Treponema pallidum', 'Le Salvarsan, la « balle magique »', 'Premiers patients guéris par la pénicilline'], correction: '1495 · 1530 · 1905 · 1910 · 1943.' },
    { consigne: 'Les grandes dates du VIH, de la plus ancienne à la plus récente', etapes: ['Premiers cas décrits à Los Angeles', 'Le virus est isolé à l\'Institut Pasteur', 'Premier test de dépistage', 'Premier médicament : l\'AZT', 'Les trithérapies changent tout'], correction: '1981 · 1983 · 1985 · 1987 · 1996.' },
    { consigne: 'De la solidarité à I = I, du plus ancien au plus récent', etapes: ['Première Journée mondiale de lutte contre le sida', 'Naissance du ruban rouge', 'La « déclaration suisse »', 'La PrEP est autorisée aux États-Unis', 'Lancement du message I = I'], correction: '1988 · 1991 · 2008 · 2012 · 2016.' },
    { consigne: 'Les microbes des IST découverts, du plus ancien au plus récent', etapes: ['Le gonocoque', 'Le tréponème de la syphilis', 'Le virus du sida', 'Le virus de l\'hépatite C'], correction: '1879 (Neisser) · 1905 (Schaudinn et Hoffmann) · 1983 (Institut Pasteur) · 1989.' },
    { consigne: 'Le préservatif à travers le temps, du plus ancien au plus récent', etapes: ['En intestin animal', 'En caoutchouc', 'En latex', 'Le préservatif interne'], correction: 'Vers 1640 (château de Dudley) · 19e siècle · années 1920 · années 1990.' },
    { consigne: 'Les prix Nobel de médecine liés aux IST, du plus ancien au plus récent', etapes: ['Le virus de l\'hépatite B (Blumberg)', 'Le VIH et le rôle des HPV dans le cancer du col', 'Le virus de l\'hépatite C'], correction: '1976 · 2008 · 2020.' }
  ];

  return { quiz, frises };
});
