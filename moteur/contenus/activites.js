/*
 * ════════════════════════════════════════════════════════════════════
 *  CONTENU — Les jeux tirés du support d'activités
 *  (« IST & VIH : du risque à la prévention », Centre S)
 * ════════════════════════════════════════════════════════════════════
 *
 *  thermometre : les idées reçues (Vrai / Je ne sais pas / Faux).
 *  feu         : Feu vert, orange, rouge (je conseille / j'approfondis /
 *                j'oriente vite). Les couleurs attendues sont à VALIDER
 *                par la formatrice : changez « feu » si besoin.
 *  marche      : Le marché des IST : une carte, à quelle IST ?
 *                « IST: 'piege' » = carte piège (fausse ou trop générale).
 *  orientation : Vers qui orienter ? (ressources liégeoises). Les
 *                réponses attendues sont à VALIDER : la bonne réponse
 *                est la première des « choix ».
 *  betisier    : Les fausses bonnes idées (humour, pour finir). La bonne
 *                réponse est la première ; « chute » fait sourire,
 *                « correction » remet les choses au clair.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/activites', function () {
  'use strict';

  /* ═══════════ Le thermomètre des idées reçues ═══════════ */
  const thermometre = [
    { texte: 'On peut avoir une IST sans aucun symptôme.', vrai: true, correction: 'Beaucoup d\'IST sont asymptomatiques : la chlamydia dans 2 cas sur 3, la cervicite à Chlamydia jusqu\'à 90 %.' },
    { texte: 'Le préservatif protège contre toutes les IST.', vrai: false, correction: 'Il réduit le risque de nombreuses IST, mais pas à 100 % : syphilis, herpès et HPV se transmettent aussi par contact cutané ou muqueux.' },
    { texte: 'La PrEP protège contre toutes les IST.', vrai: false, correction: 'La PrEP prévient l\'infection par le VIH. Elle ne protège pas des autres IST.' },
    { texte: 'Une personne sous traitement efficace, avec une charge virale indétectable, ne transmet pas le VIH par voie sexuelle.', vrai: true, correction: 'Indétectable = intransmissible (I = I). Le traitement et le suivi doivent être poursuivis.' },
    { texte: 'Le VIH et le sida, c\'est la même chose.', vrai: false, correction: 'Séropositif : infecté par le virus, immunité possiblement satisfaisante. SIDA : stade avancé, avec infections opportunistes et cancers.' },
    { texte: 'Sans symptôme, un dépistage n\'a pas d\'intérêt.', vrai: false, correction: 'C\'est justement sans symptôme que le dépistage est utile : beaucoup d\'IST passent inaperçues.' },
    { texte: 'Compter les partenaires est la meilleure façon d\'évaluer le risque.', vrai: false, correction: 'Le risque dépend des pratiques, des sites exposés, de la protection et des circonstances, pas d\'un simple nombre.' },
    { texte: 'Une exposition récente au VIH peut nécessiter une prise en charge urgente.', vrai: true, correction: 'Un traitement post-exposition (TPE) se débute le plus tôt possible : la date de l\'exposition change la prise en charge.' },
    { texte: 'Sous PrEP, plus besoin de dépistage des IST.', vrai: false, correction: 'La PrEP s\'accompagne d\'un suivi et de dépistages réguliers du VIH et des autres IST.' },
    { texte: 'L\'orientation sexuelle suffit à déterminer le risque d\'IST.', vrai: false, correction: 'On s\'intéresse aux pratiques, pas à l\'identité : ce sont les pratiques qui guident la stratégie de dépistage.' },
    { texte: 'Une personne vivant avec le VIH peut avoir une vie affective et sexuelle.', vrai: true, correction: 'Avec un traitement efficace, la vie affective, sexuelle et les projets de couple ou de grossesse sont possibles.' },
    { texte: 'Le VIH est aujourd\'hui forcément synonyme de sida.', vrai: false, correction: 'Grâce au traitement, le VIH est une maladie chronique : la plupart des personnes traitées n\'évoluent pas vers le sida.' },
    { texte: 'Si je prends la PrEP, je n\'ai plus besoin de préservatif ni de dépistage.', vrai: false, correction: 'La PrEP ne protège que du VIH : le préservatif et le dépistage restent utiles contre les autres IST.' }
  ];

  /* ═══════════ Feu vert, orange, rouge ═══════════
   *  feu : 0 = VERT (je conseille), 1 = ORANGE (j'approfondis), 2 = ROUGE (j'oriente vite) */
  const feu = [
    { texte: 'Rapport non protégé il y a 12 heures avec un partenaire dont le statut VIH est inconnu.', feu: 2, correction: 'Une exposition récente peut justifier un traitement post-exposition, à débuter le plus tôt possible. Première action : orienter sans attendre (urgences ou centre de référence VIH).' },
    { texte: 'Écoulement urétral et brûlures urinaires.', feu: 1, correction: 'On explore les pratiques, la date et les partenaires, puis on oriente vers une consultation pour PCR et traitement (gonocoque + Chlamydia). Symptômes sévères : traiter sans attendre les résultats.' },
    { texte: 'Personne vivant avec le VIH, sous traitement efficace, charge virale indétectable, inquiète d\'avoir contaminé son partenaire.', feu: 0, correction: 'Indétectable = intransmissible : on rassure, on explique, on vérifie la compréhension et le suivi.' },
    { texte: 'Personne sans symptôme qui souhaite un dépistage après plusieurs nouveaux partenaires.', feu: 1, correction: 'On recherche les expositions et les pratiques pour choisir les sites de dépistage (sang, urine, génital, pharyngé, rectal).' },
    { texte: 'Agression sexuelle récente.', feu: 2, correction: 'Prise en charge spécialisée et rapide : CPVS (traitement post-exposition, constats, accompagnement psychologique).' },
    { texte: 'Personne sous PrEP qui pense être protégée contre toutes les IST.', feu: 0, correction: 'On informe : la PrEP ne protège que du VIH. Préservatif et dépistage régulier des IST restent utiles.' },
    { texte: '« J\'ai eu un rapport il y a 36 heures avec quelqu\'un dont je ne connais pas le statut VIH. »', feu: 2, correction: 'Le temps compte : un TPE est encore possible. On oriente immédiatement.' },
    { texte: 'Homme sous PrEP, plusieurs rapports sans préservatif ces dernières semaines.', feu: 1, correction: 'On explore les pratiques et les sites exposés pour un dépistage complet des IST (pharyngé, rectal, urinaire, sang).' },
    { texte: 'Thomas, 28 ans, sans symptôme : son partenaire vient d\'être diagnostiqué avec une IST.', feu: 1, correction: 'Pas de symptôme ne veut pas dire pas d\'IST : on explore, on dépiste et on traite le partenaire selon l\'IST en cause.' }
  ];

  /* ═══════════ Le marché des IST ═══════════ */
  const marche = [
    { carte: 'Chancre souvent unique, indolore et induré', ist: 'Syphilis', correction: 'Le chancre de la syphilis primaire régresse seul en 2 à 6 semaines, mais la contagiosité est très forte.' },
    { carte: 'Éruption sur les paumes et les plantes des pieds', ist: 'Syphilis', correction: 'Syphilis secondaire, 6 semaines à 6 mois après le chancre.' },
    { carte: 'Ulcérations génitales douloureuses qui récidivent', ist: 'Herpès génital', correction: 'Récidives : 60 % pour HSV-2, 14 % pour HSV-1.' },
    { carte: 'Diagnostic par PCR sur le liquide d\'une vésicule', ist: 'Herpès génital', correction: 'La prise de sang a peu d\'intérêt pour l\'herpès.' },
    { carte: 'Condylomes (types 6 et 11)', ist: 'HPV', correction: 'Plus de 200 types de HPV ; les types 6 et 11 donnent les condylomes.' },
    { carte: 'Prévenu par le Gardasil 9', ist: 'HPV', correction: 'Vaccin le plus efficace avant le début de l\'activité sexuelle ; remboursé de 12 à 30 ans.' },
    { carte: 'Cancers du col, de l\'anus et de la gorge', ist: 'HPV', correction: 'Environ 1 000 nouveaux cas de cancers liés au HPV par an en Belgique.' },
    { carte: 'Asymptomatique dans 2 cas sur 3, pic entre 15 et 29 ans', ist: 'Chlamydia', correction: 'L\'IST la plus fréquente en Belgique, surtout chez les femmes.' },
    { carte: 'Cervicite asymptomatique jusqu\'à 90 %', ist: 'Chlamydia', correction: 'Contre 50 % pour la cervicite à gonocoque. Non traitée : MIP, grossesse extra-utérine, stérilité.' },
    { carte: 'Diagnostic sur écoulement urétral par coloration de Gram', ist: 'Gonorrhée', correction: 'Le Gram permet le diagnostic de gonorrhée ; la PCR reste l\'examen de référence.' },
    { carte: 'L\'IST la plus fréquente chez les hommes en Belgique (2024)', ist: 'Gonorrhée', correction: '251 diagnostics pour 100 000 hommes en 2024.' },
    { carte: 'Chronique dans 60 à 70 % des cas, aucun vaccin', ist: 'Hépatites B et C', correction: 'C\'est l\'hépatite C : antiviraux pendant 2 ou 3 mois si elle est chronique.' },
    { carte: 'Vaccin disponible ; devient chronique dans 10 % des cas', ist: 'Hépatites B et C', correction: 'C\'est l\'hépatite B : 90 % éliminent le virus seuls ; forme chronique : antiviral, sans guérison totale.' },
    { carte: 'Cible les cellules CD4', ist: 'VIH', correction: 'Le virus les utilise pour se multiplier et les détruit progressivement.' },
    { carte: 'Indétectable = intransmissible', ist: 'VIH', correction: 'Sous traitement efficace, une charge virale indétectable empêche la transmission sexuelle.' },
    { carte: 'Toujours symptomatique', ist: 'piege', correction: 'Carte piège : la plupart des IST peuvent être asymptomatiques.' },
    { carte: 'Le vaccin traite une infection déjà présente', ist: 'piege', correction: 'Carte piège : un vaccin prévient, il ne traite pas une infection en cours.' },
    { carte: 'Se soigne avec des antibiotiques (toutes les IST)', ist: 'piege', correction: 'Carte piège : les antibiotiques soignent les IST bactériennes, pas le VIH, l\'herpès, le HPV ni les hépatites virales.' },
    { carte: 'Le préservatif protège à 100 %', ist: 'piege', correction: 'Carte piège : il réduit fortement le risque, mais ne protège pas totalement de la syphilis, de l\'herpès ou du HPV.' },
    { carte: 'Se transmet par la sueur', ist: 'piege', correction: 'Carte piège : aucune de ces infections ne se transmet par la sueur.' }
  ];
  const LES_IST = ['VIH', 'Syphilis', 'Gonorrhée', 'Chlamydia', 'HPV', 'Herpès génital', 'Hépatites B et C'];

  /* ═══════════ Vers qui orienter ? (à valider par la formatrice) ═══════════ */
  const orientation = [
    { question: 'Agression sexuelle récente.', choix: ['Le CPVS (Centre de Prise en charge des Violences Sexuelles)', 'Le planning familial', 'Le médecin généraliste, dans la semaine', 'Le Centre S, pour un dépistage dans 3 mois'], correction: 'Prise en charge spécialisée et rapide : soins, traitement post-exposition, constats, accompagnement psychologique.' },
    { question: 'Exposition récente potentiellement à risque au VIH.', choix: ['Les urgences ou un service spécialisé, sans attendre', 'Le planning familial, la semaine prochaine', 'Un dépistage dans 3 mois seulement', 'Le CPVS, dans tous les cas'], correction: 'Le temps compte : un traitement post-exposition se débute le plus tôt possible.' },
    { question: 'Contraception et santé sexuelle.', choix: ['Le planning familial', 'Le CPVS', 'Les urgences', 'Le Centre de Référence VIH du CHU'], correction: 'Le planning familial accompagne la contraception et la santé sexuelle et affective.' },
    { question: 'Personne vivant avec le VIH : suivi et accompagnement.', choix: ['Le Centre de Référence VIH du CHU de Liège', 'Le CPVS', 'Le planning familial', 'Les urgences'], correction: 'Le centre de référence assure le suivi médical spécialisé et l\'accompagnement.' },
    { question: 'Prescription et suivi de la PrEP.', choix: ['Le Centre de Référence VIH du CHU de Liège', 'Le CPVS', 'Les urgences', 'Le pharmacien, sans ordonnance'], correction: 'La PrEP demande une prescription et un suivi régulier (VIH, IST, fonction rénale).' },
    { question: 'Demande de dépistage VIH et IST, sans symptôme.', choix: ['Le Centre S', 'Le CPVS', 'Les urgences', 'Aucune : sans symptôme, inutile'], correction: 'Le Centre S propose information, dépistage et orientation.' },
    { question: 'Symptômes évocateurs d\'une IST (écoulement, brûlures).', choix: ['Le médecin généraliste ou le Centre S, rapidement', 'Le CPVS', 'Attendre que ça passe', 'Le planning familial, uniquement pour la contraception'], correction: 'Consultation rapide pour dépistage et traitement ; dépistage et traitement des partenaires.' }
  ];

  /* ═══════════ Les fausses bonnes idées (humour) ═══════════ */
  const betisier = [
    { question: '« Pas besoin de préservatif, on se connaît depuis samedi. » À partir de quand une relation protège-t-elle des IST ?', choix: ['Jamais : seuls protection et dépistage comptent', 'Après trois semaines', 'Après le premier resto', 'Après avoir rencontré les parents'], chute: 'L\'amour rend aveugle, pas immunisé.', correction: 'La durée d\'une relation ne protège de rien. Dépistage des deux partenaires et protection, oui.' },
    { question: 'Mettre deux préservatifs l\'un sur l\'autre, c\'est…', choix: ['Moins sûr : le frottement les fait craquer', 'Deux fois plus sûr', 'Le niveau expert', 'Recommandé par l\'OMS'], chute: 'En prévention, 1 + 1 = 0.', correction: 'Un seul préservatif, bien utilisé, avec du lubrifiant adapté.' },
    { question: 'Combien de fois peut-on réutiliser un préservatif ?', choix: ['Zéro : usage unique', 'Trois fois, s\'il est bien rincé', 'Jusqu\'à ce qu\'il craque', 'Une fois par partenaire'], chute: 'Le seul objet qu\'on ne recycle pas.', correction: 'Un préservatif neuf pour chaque rapport, et pour chaque pénétration différente.' },
    { question: '« Je n\'ai pas d\'IST : je me lave très bien. » Que répondre ?', choix: ['L\'hygiène n\'empêche pas la transmission', 'Il faut frotter plus fort', 'Seulement avec du savon de Marseille', 'Seulement après 22 h'], chute: 'Propre sur soi ne veut pas dire dépisté.', correction: 'Les IST se transmettent par les muqueuses et les liquides biologiques : seul le dépistage renseigne.' },
    { question: 'Un patient demande s\'il peut prêter sa PrEP à son cousin.', choix: ['Non : prescription et suivi individuels', 'Oui, c\'est de famille', 'Seulement le week-end', 'Si le cousin est sympa'], chute: 'La PrEP se prescrit, elle ne se prête pas.', correction: 'Chaque personne a besoin d\'un bilan, d\'une prescription et d\'un suivi (VIH, IST, reins).' },
    { question: '« J\'ai fait un test il y a deux ans, je suis tranquille à vie. »', choix: ['Un test ne vaut que pour les expositions passées', 'Oui, c\'est valable 10 ans', 'Oui, s\'il était négatif deux fois', 'Seulement en année bissextile'], chute: 'Un test, c\'est une photo, pas un abonnement.', correction: 'Un nouveau dépistage s\'envisage après chaque nouvelle exposition.' },
    { question: 'Un patient a lu qu\'on soigne le VIH avec du citron. Votre première réaction ?', choix: ['Explorer sans juger, puis rectifier avec tact', 'Conseiller l\'orange, plus douce', 'Éclater de rire', 'Lui prescrire une limonade'], chute: 'Le citron, c\'est pour le thé.', correction: 'Posture non jugeante : on écoute la croyance, puis on explique le traitement antirétroviral.' },
    { question: '« Le VIH ? Ça ne touche que les autres. » En Belgique (2024), la moitié des nouveaux diagnostics concerne…', choix: ['Des personnes hétérosexuelles', 'Les autres', 'Les extraterrestres', 'Personne'], chute: 'Les autres, c\'est souvent nous.', correction: 'Mode d\'infection : hétérosexuel 50 %, HSH 44 % (Sciensano, 2024).' },
    { question: 'Quelle est la meilleure question pour ouvrir un entretien ?', choix: ['« Pouvez-vous me raconter ce qui s\'est passé ? »', '« Vous avez fait des bêtises ? »', '« Combien de partenaires, à la louche ? »', '« Vous n\'auriez pas pu faire attention ? »'], chute: 'On n\'est pas au tribunal.', correction: 'Questions ouvertes, écoute active, sans jugement : on s\'intéresse aux pratiques, pas à l\'identité.' },
    { question: 'Le préservatif oublié dans le portefeuille depuis 2019…', choix: ['Direction la poubelle : périmé et abîmé', 'Porte-bonheur, on le garde', 'Toujours bon, c\'est du caoutchouc', 'À offrir en cadeau'], chute: 'Le portefeuille, c\'est chaud, ça frotte : le latex n\'aime pas.', correction: 'Vérifier la date de péremption et conserver au frais, à l\'abri des frottements.' }
  ];

  return { thermometre, feu, marche, LES_IST, orientation, betisier };
});
