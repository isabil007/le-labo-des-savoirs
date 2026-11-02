/*
 * ════════════════════════════════════════════════════════════════════
 *  CONTENU — Le supplément (novembre 2026)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Ce fichier élargit les banques existantes (pour moins retomber sur les
 *  mêmes questions d'une partie à l'autre) et ajoute :
 *    • deux nouveaux thèmes : « La prévention combinée » (VIH’GILANCE)
 *      et « Les IST méconnues » (SEX’PLIQUE) ;
 *    • les « anecdotes » : de courtes notes historiques affichées de temps
 *      en temps entre deux questions (« Le saviez-vous ? »).
 *
 *  Mêmes règles que les autres fichiers : la bonne réponse est TOUJOURS
 *  la première des « choix » (le jeu mélange). Uniquement des faits bien
 *  établis ; vérifiez traitements et recommandations dans les sources en
 *  vigueur avant chaque nouvelle année de cours.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '').replace(/^contenus\//, 'contenus/')]; }); }
})(this, 'contenus/supplement', function (exiger) {
  'use strict';
  const Q = exiger('./questions');
  const A = exiger('./activites');
  const H = exiger('./histoire');
  // Dans le navigateur, « ./questions » se lit « contenus/questions ».
  const req = (x, y) => x || exiger(y);
  const QQ = req(Q, 'contenus/questions'), AA = req(A, 'contenus/activites'), HH = req(H, 'contenus/histoire');

  /* ═══════════ Le VIH : virus, dépistage, traitement ═══════════ */
  QQ.vih.push(
    { theme: 'Le virus', question: 'À quelle famille de virus appartient le VIH ?', choix: ['Les rétrovirus', 'Les herpèsvirus', 'Les flavivirus', 'Les adénovirus'], correction: 'Un rétrovirus (genre lentivirus) : il copie son ARN en ADN, puis l\'intègre dans l\'ADN de la cellule.' },
    { theme: 'Le virus', question: 'Quelle enzyme virale copie l\'ARN du VIH en ADN ?', choix: ['La transcriptase inverse', 'L\'intégrase', 'La protéase', 'L\'ADN polymérase humaine'], correction: 'La transcriptase inverse, cible de deux grandes classes d\'antirétroviraux (INTI et INNTI). L\'intégrase et la protéase sont d\'autres cibles.' },
    { theme: 'Le virus', question: 'En plus du CD4, quels corécepteurs le VIH utilise-t-il pour entrer dans la cellule ?', choix: ['CCR5 ou CXCR4', 'CD8', 'HLA-B27', 'ACE2'], correction: 'Une mutation rare de CCR5 (delta 32) empêche l\'entrée du virus : c\'est elle qui a permis la guérison du « patient de Berlin ».' },
    { theme: 'Stades cliniques', question: 'Sous quel seuil de lymphocytes CD4 parle-t-on de SIDA, même sans maladie opportuniste ?', choix: ['200 / mm³', '500 / mm³', '1 000 / mm³', '50 / mm³'], correction: 'Moins de 200 CD4/mm³ définit le stade SIDA (classification CDC). Normale : environ 500 à 1 500/mm³.' },
    { theme: 'Stades cliniques', question: 'Quelle infection pulmonaire opportuniste est classique au stade SIDA ?', choix: ['La pneumocystose', 'La légionellose', 'La grippe saisonnière', 'La coqueluche'], correction: 'Pneumocystis jirovecii : une prophylaxie est proposée quand les CD4 sont bas.' },
    { theme: 'Traitement', question: 'Dans quel délai faut-il débuter un traitement post-exposition (TPE) ?', choix: ['Le plus tôt possible, au plus tard 72 heures', 'Dans les 7 jours', 'Dans le mois', 'Après la sérologie de contrôle'], correction: 'Idéalement dans les premières heures, au plus tard 72 h après l\'exposition. Au-delà, il n\'est plus indiqué.' },
    { theme: 'Traitement', question: 'Combien de temps dure un traitement post-exposition ?', choix: ['28 jours', '3 jours', '6 mois', 'Toute la vie'], correction: 'Quatre semaines de trithérapie, avec un suivi sérologique après la fin du traitement.' },
    { theme: 'Dépistage', question: 'Un test de 4e génération (antigène p24 + anticorps) négatif exclut une infection récente après…', choix: ['6 semaines', '3 jours', '6 mois', '1 an'], correction: 'Il détecte l\'antigène p24 plus tôt que les anticorps : un résultat négatif 6 semaines après l\'exposition est fiable.' },
    { theme: 'Dépistage', question: 'Un autotest VIH (sur une goutte de sang) est fiable pour une exposition datant de plus de…', choix: ['3 mois', '3 jours', '1 semaine', '1 an'], correction: 'Il ne détecte que les anticorps : il faut attendre 3 mois. Un résultat positif doit toujours être confirmé au laboratoire.' },
    { theme: 'Accident d\'exposition', question: 'Piqûre avec une aiguille contenant du sang VIH+ (patient non traité) : quel est le risque de transmission estimé ?', choix: ['Environ 0,3 %', 'Environ 30 %', 'Environ 3 %', 'Environ 0,003 %'], correction: 'Environ 3 pour 1 000. Il est bien plus faible si le patient source a une charge virale indétectable. D\'abord : laver, ne pas faire saigner, puis consulter pour un TPE.' }
  );

  /* ═══════════ Les IST bactériennes ═══════════ */
  QQ.bacteries.push(
    { theme: 'Syphilis', question: 'Traitement de référence d\'une syphilis primaire ou secondaire ?', choix: ['La benzathine-pénicilline G en intramusculaire', 'L\'amoxicilline per os, 7 jours', 'Un antiviral', 'Une crème antibiotique sur le chancre'], correction: 'Une injection IM de benzathine-pénicilline G pour une syphilis précoce. Les schémas varient selon le stade : à vérifier dans les recommandations en vigueur.' },
    { theme: 'Syphilis', question: 'Fièvre, frissons et malaise quelques heures après la première injection de pénicilline pour une syphilis : il s\'agit le plus souvent…', choix: ['D\'une réaction de Jarisch-Herxheimer', 'D\'une allergie grave à la pénicilline', 'D\'un échec du traitement', 'D\'une neurosyphilis'], correction: 'Elle est due à la destruction massive des tréponèmes, survient dans les 24 h et passe en général seule. À annoncer au patient.' },
    { theme: 'Gonorrhée', question: 'Pourquoi la gonorrhée inquiète-t-elle l\'OMS ?', choix: ['Sa résistance croissante aux antibiotiques', 'Elle se transmet par l\'air', 'Son vaccin ne marche plus', 'Elle est devenue virale'], correction: 'Le gonocoque a résisté successivement à plusieurs antibiotiques : d\'où la surveillance des résistances et le dépistage des partenaires.' },
    { theme: 'Chlamydia', question: 'Chlamydia trachomatis est une bactérie…', choix: ['Intracellulaire obligatoire', 'À Gram positif sporulée', 'Spiralée, comme le tréponème', 'Proche du bacille de la tuberculose'], correction: 'Elle vit dans les cellules : on la recherche par PCR, pas en culture classique.' },
    { theme: 'Complications', question: 'La périhépatite qui complique une infection génitale haute à Chlamydia ou gonocoque porte le nom de…', choix: ['Syndrome de Fitz-Hugh-Curtis', 'Syndrome de Guillain-Barré', 'Maladie de Kawasaki', 'Syndrome de Cushing'], correction: 'Douleur de l\'hypocondre droit chez une patiente avec infection génitale haute : y penser.' },
    { theme: 'Complications', question: 'Urétrite, conjonctivite et arthrite quelques semaines après une IST : on évoque une arthrite réactionnelle, classiquement après…', choix: ['Une infection à Chlamydia trachomatis', 'Une infection à HPV', 'Une hépatite A', 'Un herpès génital'], correction: 'L\'arthrite réactionnelle (autrefois « syndrome de Reiter ») suit souvent une chlamydiose.' }
  );

  /* ═══════════ Les hépatites ═══════════ */
  QQ.hepatites.push(
    { theme: 'Sérologie', question: 'Quel marqueur signe une infection en cours par le virus de l\'hépatite B ?', choix: ['L\'antigène HBs', 'Les anticorps anti-HBs seuls', 'Les anticorps anti-HAV', 'Les anticorps anti-VHC'], correction: 'AgHBs positif = infection (aiguë ou chronique s\'il persiste plus de 6 mois).' },
    { theme: 'Sérologie', question: 'Anticorps anti-HBs positifs, anti-HBc négatifs, AgHBs négatif : que conclure ?', choix: ['Une immunité due à la vaccination', 'Une hépatite B chronique', 'Une hépatite B aiguë', 'Un porteur sain contagieux'], correction: 'Seuls les anti-HBs sont présents : la personne est vaccinée et protégée. Après une infection guérie, on trouve aussi des anti-HBc.' },
    { theme: 'Hépatite D', question: 'Le virus de l\'hépatite D (delta) ne peut infecter que les personnes…', choix: ['Déjà infectées par le virus de l\'hépatite B', 'Vaccinées contre l\'hépatite A', 'De moins de 15 ans', 'Atteintes d\'hépatite C'], correction: 'Le VHD a besoin du VHB pour se multiplier : se vacciner contre l\'hépatite B protège aussi de la D.' },
    { theme: 'Mère-enfant', question: 'Mère porteuse de l\'AgHBs : que reçoit le nouveau-né à la naissance ?', choix: ['Le vaccin hépatite B et des immunoglobulines', 'Rien, il est protégé par la mère', 'Une césarienne obligatoire', 'Un traitement antibiotique'], correction: 'La sérovaccination dans les premières heures prévient la grande majorité des transmissions.' },
    { theme: 'Prévention', question: 'En Belgique, le vaccin contre l\'hépatite B est…', choix: ['Intégré au calendrier vaccinal des nourrissons', 'Réservé aux soignants', 'Réservé aux voyageurs', 'Inexistant'], correction: 'Il fait partie du vaccin hexavalent du nourrisson. Le rattrapage est recommandé pour les personnes non protégées.' },
    { theme: 'Prévention', question: 'Pourquoi le vaccin contre l\'hépatite A est-il recommandé aux HSH ?', choix: ['Le virus peut se transmettre lors de pratiques oro-anales', 'Il protège aussi du VIH', 'L\'hépatite A devient souvent chronique', 'Il remplace le préservatif'], correction: 'Des épidémies d\'hépatite A liées aux rapports sexuels ont touché des HSH en Europe : vaccination recommandée.' },
    { theme: 'Traitement', question: 'Sous antiviraux à action directe, quelle part des hépatites C guérit ?', choix: ['Plus de 95 %', 'Environ 50 %', 'Environ 10 %', 'Aucune'], correction: 'Un traitement oral de 8 à 12 semaines guérit la quasi-totalité des patients. Une réinfection reste possible.' },
    { theme: 'Le virus', question: 'Le virus de l\'hépatite C est un virus…', choix: ['À ARN', 'À ADN', 'Rétrovirus, comme le VIH', 'Bactérien'], correction: 'Un virus à ARN de la famille des Flaviviridae, identifié en 1989.' }
  );

  /* ═══════════ Herpès, HPV ═══════════ */
  QQ.ulceres.push(
    { theme: 'HPV', question: 'Quels types de HPV sont le plus souvent impliqués dans le cancer du col de l\'utérus ?', choix: ['HPV 16 et 18', 'HPV 6 et 11', 'HSV-1 et HSV-2', 'HPV 1 et 2'], correction: 'Les HPV 16 et 18 causent environ 70 % des cancers du col. Les 6 et 11 causent les condylomes.' },
    { theme: 'Vaccination', question: 'Contre combien de types de HPV le vaccin Gardasil 9 protège-t-il ?', choix: ['9', '2', '4', 'Tous les types'], correction: 'Neuf types : 6, 11, 16, 18, 31, 33, 45, 52 et 58.' },
    { theme: 'Herpès', question: 'Les antiviraux contre l\'herpès génital (aciclovir, valaciclovir)…', choix: ['Raccourcissent les poussées sans éliminer le virus', 'Guérissent définitivement l\'herpès', 'Sont des antibiotiques', 'Ne servent à rien'], correction: 'Le virus reste latent dans les ganglions nerveux. Un traitement continu peut réduire les récidives et la transmission.' },
    { theme: 'Herpès', question: 'Quand le risque d\'herpès néonatal est-il le plus élevé ?', choix: ['Primo-infection maternelle en fin de grossesse', 'Herpès ancien, sans récidive', 'Herpès labial du père', 'Infection en début de grossesse'], correction: 'En fin de grossesse, la mère n\'a pas encore d\'anticorps à transmettre au bébé : à signaler à l\'équipe obstétricale.' },
    { theme: 'HPV', question: 'Lequel est un traitement des condylomes ?', choix: ['La cryothérapie', 'La pénicilline', 'L\'aciclovir', 'Le vaccin, une fois les lésions présentes'], correction: 'Cryothérapie, crèmes (imiquimod, podophyllotoxine), chirurgie ou laser. Le vaccin prévient, il ne traite pas.' }
  );

  /* ═══════════ En consultation ═══════════ */
  QQ.consultation.push(
    { theme: 'Cas pratique', question: 'Première consultation prénatale : quels dépistages proposer ?', choix: ['VIH, syphilis et hépatite B (entre autres)', 'Aucun, sauf symptômes', 'Seulement le VIH si la patiente le demande', 'Seulement à l\'accouchement'], correction: 'Ils permettent de traiter la mère et d\'éviter la transmission à l\'enfant.' },
    { theme: 'Cas pratique', question: 'Un patient sous PrEP : à quel rythme le suivre ?', choix: ['Tous les 3 mois : test VIH, IST, fonction rénale', 'Une fois par an', 'Jamais, si tout va bien', 'Chaque semaine'], correction: 'Le suivi trimestriel vérifie l\'absence de VIH, dépiste les autres IST et surveille les reins.' },
    { theme: 'Cas pratique', question: 'Un patient avec une syphilis n\'ose pas prévenir ses partenaires. Que proposer ?', choix: ['L\'accompagner, y compris par une notification aux partenaires avec son accord', 'Les prévenir soi-même, sans le lui dire', 'Laisser tomber', 'Refuser de le traiter tant qu\'il n\'a rien dit'], correction: 'On aide la personne à informer, ou on organise une notification anonyme avec son accord : le secret professionnel reste la règle.' },
    { theme: 'Cas pratique', question: 'Rupture de préservatif hier soir avec un partenaire de statut inconnu. Quelle conduite ?', choix: ['Évaluer un TPE (dans les 72 h), proposer une contraception d\'urgence si besoin, prévoir un dépistage', 'Attendre 3 mois et faire un test', 'Rien : un seul rapport ne compte pas', 'Prendre un antibiotique au hasard'], correction: 'L\'urgence, c\'est le TPE et la contraception d\'urgence ; le dépistage se programme ensuite selon les délais de chaque IST.' },
    { theme: 'Cas pratique', question: 'Un adolescent demande un dépistage IST. Quelle posture ?', choix: ['Accueil sans jugement, information claire et respect de la confidentialité', 'Exiger systématiquement la présence des parents', 'Le renvoyer : il est trop jeune', 'Lui faire la morale d\'abord'], correction: 'On évalue sa capacité de discernement, on informe et on protège sa confidentialité, en restant attentif aux situations de vulnérabilité.' },
    { theme: 'Cas pratique', question: 'HSH avec rapports oraux et anaux réceptifs : quels prélèvements pour chlamydia et gonocoque ?', choix: ['PCR sur urines, frottis anal et pharyngé', 'Urines seulement', 'Prise de sang seulement', 'Aucun s\'il n\'a pas de symptôme'], correction: 'Les infections pharyngées et anales sont souvent sans symptôme : on prélève chaque site exposé.' }
  );

  /* ═══════════ Vrai ou faux ? ═══════════ */
  QQ.vraiFaux.push(
    { texte: 'Le VIH ne se transmet pas par les piqûres de moustique.', vrai: true, correction: 'Le virus ne survit pas et ne se multiplie pas dans le moustique.' },
    { texte: 'On peut avoir plusieurs IST en même temps.', vrai: true, correction: 'Les co-infections sont fréquentes : une IST diagnostiquée = dépistage complet.' },
    { texte: 'Une syphilis guérie protège contre une nouvelle infection.', vrai: false, correction: 'Aucune immunité : on peut être réinfecté, d\'où le dépistage des partenaires et le suivi.' },
    { texte: 'La pilule contraceptive protège aussi des IST.', vrai: false, correction: 'Elle prévient la grossesse, pas les IST.' },
    { texte: 'Il existe un vaccin contre l\'hépatite C.', vrai: false, correction: 'Pas de vaccin pour le VHC (il en existe pour A et B), mais un traitement qui guérit.' },
    { texte: 'La gonorrhée peut infecter la gorge.', vrai: true, correction: 'Infection pharyngée souvent silencieuse, transmise lors des rapports oraux.' },
    { texte: 'Les antibiotiques soignent l\'herpès.', vrai: false, correction: 'L\'herpès est un virus : on utilise des antiviraux, qui ne l\'éliminent pas.' },
    { texte: 'Un frottis du col normal exclut toutes les IST.', vrai: false, correction: 'Le frottis dépiste les lésions du col (HPV), pas la chlamydia, le gonocoque, la syphilis ou le VIH.' },
    { texte: 'Le traitement post-exposition doit commencer au plus tard 72 heures après l\'exposition.', vrai: true, correction: 'Le plus tôt possible : son efficacité diminue avec le temps.' },
    { texte: 'Une mère vivant avec le VIH, bien traitée, peut avoir un enfant non infecté.', vrai: true, correction: 'Avec un traitement et une charge virale indétectable, la transmission devient très rare.' }
  );

  /* ═══════════ Risque ou pas ? ═══════════ */
  QQ.risque.push(
    { infection: 'VIH', texte: 'Embrasser sur la bouche', vrai: false, correction: 'La salive ne transmet pas le VIH.' },
    { infection: 'VIH', texte: 'Partager une seringue lors d\'une injection', vrai: true, correction: 'Risque majeur pour le VIH et les hépatites B et C : matériel stérile à usage unique.' },
    { infection: 'VIH', texte: 'Utiliser les mêmes toilettes', vrai: false, correction: 'Aucun risque : le VIH ne se transmet pas par les objets du quotidien.' },
    { infection: 'VIH', texte: 'Partager un verre ou des couverts', vrai: false, correction: 'Aucun risque de VIH.' },
    { infection: 'Hépatite B', texte: 'Rapport sans préservatif avec une personne porteuse de l\'AgHBs, sans être vacciné', vrai: true, correction: 'Le VHB est très contagieux par voie sexuelle : d\'où l\'intérêt du vaccin.' },
    { infection: 'Herpès', texte: 'Rapport oral pendant une poussée de bouton de fièvre', vrai: true, correction: 'HSV-1 peut ainsi provoquer un herpès génital.' },
    { infection: 'Chlamydia', texte: 'Rapport anal sans préservatif', vrai: true, correction: 'Les infections anales à Chlamydia (et à gonocoque) sont fréquentes et souvent silencieuses.' },
    { infection: 'VIH', texte: 'Se faire piquer par un moustique', vrai: false, correction: 'Le moustique ne transmet pas le VIH.' }
  );

  /* ═══════════ Le thermomètre ═══════════ */
  AA.thermometre.push(
    { texte: 'Le VIH se transmet par la salive.', vrai: false, correction: 'Non. Seuls le sang, le sperme, les sécrétions vaginales, le liquide pré-séminal et le lait maternel sont contaminants.' },
    { texte: 'Une IST guérie ne peut pas revenir.', vrai: false, correction: 'Pour les IST bactériennes, aucune immunité : on peut se réinfecter.' },
    { texte: 'Les femmes qui ont des rapports avec des femmes ne peuvent pas attraper d\'IST.', vrai: false, correction: 'HPV, herpès, chlamydia, trichomonas… se transmettent aussi entre femmes.' },
    { texte: 'Un test VIH est fait automatiquement lors d\'une prise de sang de routine.', vrai: false, correction: 'Il doit être proposé et demandé spécifiquement, avec l\'accord de la personne.' },
    { texte: 'Avec un traitement, une personne vivant avec le VIH a une espérance de vie proche de celle de la population générale.', vrai: true, correction: 'Diagnostiqué et traité tôt, le VIH est devenu une maladie chronique.' },
    { texte: 'On peut reconnaître une personne vivant avec le VIH à son apparence.', vrai: false, correction: 'Impossible : seul un test permet de savoir.' },
    { texte: 'On peut attraper une IST lors d\'un rapport oral.', vrai: true, correction: 'Gonorrhée, syphilis, herpès, chlamydia, HPV : la bouche et la gorge sont aussi concernées.' }
  );

  /* ═══════════ Les fausses bonnes idées ═══════════ */
  AA.betisier.push(
    { question: '« Je prends la pilule, donc je suis protégée de tout. »', choix: ['La pilule protège de la grossesse, pas des IST', 'Oui, de tout', 'Seulement le dimanche', 'Si on en prend deux'], chute: 'La pilule ne fait pas parapluie.', correction: 'Contraception et prévention des IST sont deux protections différentes, à combiner.' },
    { question: 'Le lubrifiant idéal avec un préservatif en latex ?', choix: ['Un lubrifiant à base d\'eau ou de silicone', 'L\'huile d\'olive', 'Le beurre', 'La crème pour les mains'], chute: 'Le latex et les corps gras, c\'est la rupture.', correction: 'Les corps gras fragilisent le latex : lubrifiant à base d\'eau ou de silicone.' },
    { question: '« Je n\'ai eu qu\'un seul partenaire, je ne peux pas avoir d\'IST. »', choix: ['Un seul rapport peut suffire', 'Exact, un seul ne compte pas', 'Seulement à partir de dix', 'Sauf s\'il était charmant'], chute: 'Une IST ne compte pas, elle s\'invite.', correction: 'Le risque dépend du statut du partenaire et de la protection, pas du nombre de partenaires.' },
    { question: 'Un ami veut soigner sa chlamydia avec les antibiotiques restants de sa grand-mère.', choix: ['Non : consultation, bon traitement, partenaires traités', 'Bonne idée, c\'est écologique', 'Oui, en doublant la dose', 'Seulement s\'ils sont roses'], chute: 'L\'armoire à pharmacie de mamie n\'est pas un centre IST.', correction: 'L\'automédication expose à l\'échec et aux résistances. Diagnostic, traitement adapté, dépistage des partenaires.' },
    { question: '« Le VIH, ça ne s\'attrape pas au premier rapport. »', choix: ['Faux : une seule exposition peut suffire', 'Vrai, il y a une période d\'essai', 'Seulement au troisième rapport', 'Ça dépend de la lune'], chute: 'Il n\'y a pas de période d\'essai.', correction: 'Chaque exposition comporte un risque. Préservatif, PrEP, TPE, dépistage : les outils existent.' }
  );

  /* ═══════════ IST’ORY : nouveaux faits ═══════════ */
  HH.quiz.push(
    { theme: 'Vers 1920', question: 'Selon une étude génétique publiée en 2014, l\'épidémie de VIH-1 (groupe M) est partie vers 1920 de quelle ville ?', choix: ['Kinshasa (alors Léopoldville)', 'Johannesburg', 'New York', 'Paris'], correction: 'Le chemin de fer, le commerce et la croissance de la ville coloniale ont aidé le virus à se répandre.' },
    { theme: '1959', question: 'Le plus ancien échantillon de sang contenant le VIH que l\'on connaisse date de…', choix: ['1959, à Kinshasa', '1981, à Los Angeles', '1920, à Paris', '1900, à Londres'], correction: 'Analysé des décennies plus tard, il montre que le virus circulait bien avant les premiers cas décrits.' },
    { theme: '1982', question: 'En 1982, le nom « GRID » (déficit immunitaire lié aux homosexuels) est abandonné au profit d\'AIDS (sida). Pourquoi ?', choix: ['La maladie touchait aussi des hémophiles, des usagers de drogues, des femmes, des enfants…', 'On venait de découvrir le virus', 'Le nom était trop long', 'Un vaccin venait d\'être trouvé'], correction: 'Un nom lié à un groupe nourrissait la stigmatisation et faisait croire aux autres qu\'ils n\'étaient pas concernés.' },
    { theme: '1984', question: 'En 1984, quel chercheur américain annonce avoir identifié le virus du sida, ce qui déclenche une longue controverse avec l\'Institut Pasteur ?', choix: ['Robert Gallo', 'Jonas Salk', 'Anthony Fauci', 'Albert Sabin'], correction: 'Un comité international choisit en 1986 un nom commun : VIH (HIV en anglais).' },
    { theme: '1987', question: 'Fondée à New York en 1987, quelle association militante a fait de « Silence = Death » son cri de ralliement ?', choix: ['ACT UP', 'Greenpeace', 'Médecins sans frontières', 'Amnesty International'], correction: 'Ses actions ont accéléré l\'accès aux médicaments et donné une voix aux personnes concernées.' },
    { theme: '1987', question: 'En 1987, quel geste de la princesse Diana marque les esprits ?', choix: ['Elle serre la main d\'un patient atteint du sida, sans gants', 'Elle annonce un vaccin', 'Elle inaugure le premier centre de dépistage', 'Elle crée le ruban rouge'], correction: 'Devant les photographes, ce simple geste a combattu la peur d\'être contaminé par un contact ordinaire.' },
    { theme: '1991', question: 'En novembre 1991, quel champion de basket annonce publiquement sa séropositivité ?', choix: ['Magic Johnson', 'Michael Jordan', 'Kareem Abdul-Jabbar', 'Larry Bird'], correction: 'Toujours en vie aujourd\'hui grâce aux traitements, il est devenu un symbole de la vie avec le VIH.' },
    { theme: '1991', question: 'Le chanteur de Queen meurt en novembre 1991 de complications du sida, au lendemain de l\'annonce publique de sa maladie. Qui est-ce ?', choix: ['Freddie Mercury', 'David Bowie', 'Elton John', 'George Michael'], correction: 'Sa disparition a beaucoup fait pour la sensibilisation du grand public.' },
    { theme: '1994', question: 'En 1994, l\'essai ACTG 076 montre que l\'AZT donné pendant la grossesse et à l\'accouchement…', choix: ['Réduit d\'environ deux tiers la transmission du VIH à l\'enfant', 'Guérit la mère', 'N\'a aucun effet', 'Augmente le risque pour le bébé'], correction: 'Première grande victoire contre la transmission mère-enfant. Aujourd\'hui, sous trithérapie, elle est devenue très rare.' },
    { theme: '2011', question: 'En 2011, l\'essai HPTN 052 montre que traiter tôt le partenaire séropositif réduit la transmission sexuelle d\'environ…', choix: ['96 %', '10 %', '50 %', '0 %'], correction: 'La revue Science l\'a désigné « découverte scientifique de l\'année » : le traitement est aussi une prévention.' },
    { theme: '2019', question: 'En 2019, le « patient de Londres » devient…', choix: ['La deuxième personne considérée comme guérie du VIH, après une greffe de cellules souches', 'Le premier patient sous PrEP', 'Le premier cas européen de VIH', 'Le premier vacciné contre le VIH'], correction: 'Comme pour le patient de Berlin, son donneur portait la mutation CCR5 delta 32. Une greffe très lourde, réservée à des cancers du sang.' },
    { theme: '1838', question: 'En 1838, le médecin Philippe Ricord publie ses travaux et démontre que…', choix: ['La syphilis et la gonorrhée sont deux maladies différentes', 'La syphilis est due à un virus', 'Le mercure guérit la syphilis', 'La gonorrhée vient des moustiques'], correction: 'Jusque-là, beaucoup pensaient qu\'il s\'agissait d\'une seule et même maladie.' },
    { theme: '2006', question: 'En quelle année le premier vaccin contre le HPV est-il autorisé ?', choix: ['2006', '1986', '1996', '2016'], correction: 'Un vaccin contre des cancers : il protège le mieux avant le début de la vie sexuelle.' },
    { theme: '1927', question: 'En 1927, Julius Wagner-Jauregg reçoit le prix Nobel pour avoir traité la neurosyphilis… comment ?', choix: ['En provoquant une forte fièvre avec le paludisme', 'Avec la pénicilline', 'Par la chirurgie du cerveau', 'Avec un vaccin'], correction: 'La fièvre détruisait les tréponèmes, très sensibles à la chaleur. La pénicilline a rendu cette méthode inutile.' }
  );

  /* ═══════════ Nouveau thème : la prévention combinée (VIH’GILANCE) ═══════════ */
  const prevention = [
    { theme: 'PrEP', question: 'La PrEP, c\'est…', choix: ['Un traitement pris avant une exposition pour prévenir le VIH', 'Un vaccin contre le VIH', 'Un traitement d\'urgence après un rapport à risque', 'Une pilule contraceptive'], correction: 'Prophylaxie pré-exposition : des antirétroviraux pris par une personne séronégative. Après une exposition, c\'est le TPE.' },
    { theme: 'PrEP', question: 'Bien prise, quelle est l\'efficacité de la PrEP contre le VIH ?', choix: ['Très élevée (plus de 90 %)', 'Environ 50 %', 'Environ 20 %', 'Nulle'], correction: 'Son efficacité dépend surtout de l\'observance.' },
    { theme: 'PrEP', question: 'Outre la prise quotidienne, comment la PrEP peut-elle se prendre ?', choix: ['« À la demande », autour des rapports (schéma validé chez les hommes)', 'Une fois par an', 'Seulement après le rapport', 'En une injection unique, à vie'], correction: 'Le schéma à la demande : 2 comprimés avant, puis 1 à 24 h et 1 à 48 h. Les schémas sont à adapter à chaque personne.' },
    { theme: 'PrEP', question: 'Avant de commencer une PrEP, quel test est indispensable ?', choix: ['Un test VIH négatif', 'Une radiographie du thorax', 'Un test de grossesse uniquement', 'Aucun'], correction: 'Commencer une PrEP sans savoir qu\'on a le VIH exposerait à des résistances. On vérifie aussi les reins et l\'hépatite B.' },
    { theme: 'Vaccins', question: 'Quels vaccins font partie de la prévention des IST ?', choix: ['HPV, hépatites A et B', 'Syphilis et chlamydia', 'VIH et herpès', 'Gonorrhée et VIH'], correction: 'Il n\'existe ni vaccin contre le VIH, ni contre les IST bactériennes. Le vaccin mpox est proposé à certains publics.' },
    { theme: 'Préservatifs', question: 'Le préservatif interne (dit « féminin »)…', choix: ['Peut être mis en place plusieurs heures avant le rapport', 'Doit être utilisé avec un préservatif externe', 'Est réutilisable', 'Ne protège pas des IST'], correction: 'En polyuréthane ou nitrile, il convient aussi aux personnes allergiques au latex. Jamais en même temps qu\'un préservatif externe.' },
    { theme: 'Stratégie', question: '« Prévention combinée » signifie…', choix: ['Combiner plusieurs outils selon la situation : préservatif, PrEP, TPE, dépistage, traitement, vaccins', 'Prendre deux médicaments à la fois', 'Mettre deux préservatifs', 'Se protéger une fois sur deux'], correction: 'Il n\'y a pas un outil parfait pour tout le monde : on choisit ensemble ce qui convient à chaque personne.' },
    { theme: 'Dépistage', question: 'Pourquoi le dépistage régulier est-il un outil de prévention ?', choix: ['Un diagnostic précoce permet de traiter et de couper la chaîne de transmission', 'Il immunise contre les IST', 'Il remplace le préservatif', 'Il est obligatoire'], correction: 'Beaucoup d\'IST sont silencieuses : sans dépistage, on peut les transmettre sans le savoir.' },
    { theme: 'Traitement', question: 'Pour le VIH, « traitement comme prévention » veut dire…', choix: ['Une charge virale indétectable sous traitement empêche la transmission sexuelle', 'Le traitement protège des autres IST', 'Le traitement remplace le dépistage des partenaires', 'Le traitement est un vaccin'], correction: 'Indétectable = intransmissible (I = I), à condition de poursuivre le traitement et le suivi.' },
    { theme: 'TPE', question: 'Où orienter une personne qui a besoin d\'un TPE, un dimanche soir ?', choix: ['Aux urgences hospitalières', 'Chez son généraliste lundi', 'À la pharmacie, sans ordonnance', 'Nulle part : on attend 3 mois'], correction: 'Le TPE est une urgence (au plus tard 72 h) : les urgences et les centres de référence VIH le délivrent.' }
  ];

  /* ═══════════ Nouveau thème : les IST méconnues (SEX’PLIQUE) ═══════════ */
  const meconnues = [
    { theme: 'Trichomonase', question: 'Trichomonas vaginalis est…', choix: ['Un parasite (protozoaire)', 'Une bactérie', 'Un virus', 'Un champignon'], correction: 'Souvent sans symptôme chez l\'homme ; chez la femme, pertes abondantes, parfois verdâtres et mousseuses, et irritation.' },
    { theme: 'Trichomonase', question: 'Comment traite-t-on une trichomonase ?', choix: ['Par métronidazole, en traitant aussi le ou la partenaire', 'Par pénicilline', 'Par aciclovir', 'Par un antifongique'], correction: 'Le métronidazole est le traitement de référence ; pas d\'alcool pendant le traitement.' },
    { theme: 'Mycoplasma', question: 'Mycoplasma genitalium inquiète surtout à cause de…', choix: ['Sa résistance croissante aux antibiotiques', 'Sa transmission par l\'air', 'Ses lésions très visibles', 'Son vaccin inefficace'], correction: 'Résistances fréquentes aux macrolides : on ne le recherche qu\'en cas de symptômes, et on adapte le traitement.' },
    { theme: 'LGV', question: 'Chez les HSH, la lymphogranulomatose vénérienne se présente souvent comme…', choix: ['Une rectite : douleurs, écoulement, saignements anaux', 'Une éruption des paumes et des plantes', 'Une hépatite', 'Une conjonctivite isolée'], correction: 'Due à Chlamydia trachomatis (sérovars L1 à L3) : à évoquer devant une rectite.' },
    { theme: 'LGV', question: 'Comment traite-t-on une lymphogranulomatose vénérienne ?', choix: ['Doxycycline pendant 3 semaines', 'Une dose unique d\'amoxicilline', 'Un antiviral', 'Aucun traitement n\'existe'], correction: 'Un traitement plus long que pour une chlamydia classique.' },
    { theme: 'Mpox', question: 'Lors de l\'épidémie de 2022, comment le mpox s\'est-il surtout transmis ?', choix: ['Par contacts physiques étroits, notamment sexuels, avec les lésions', 'Par l\'eau', 'Par les moustiques', 'Par l\'air, à distance'], correction: 'Lésions cutanées et muqueuses, fièvre, ganglions : isolement des lésions et dépistage des autres IST.' },
    { theme: 'Mpox', question: 'Existe-t-il un vaccin contre le mpox ?', choix: ['Oui, un vaccin antivariolique de 3e génération', 'Non, aucun', 'Oui, le BCG', 'Oui, le vaccin HPV'], correction: 'Il est proposé aux personnes les plus exposées et après certains contacts à risque.' },
    { theme: 'Phtiriase', question: 'La phtiriase (les « morpions »), c\'est…', choix: ['Des poux du pubis', 'Une bactérie', 'Un virus', 'Un champignon'], correction: 'Démangeaisons du pubis, lentes visibles : traitement local, lavage du linge, partenaires traités.' },
    { theme: 'Gale', question: 'La gale, qui peut se transmettre lors de rapports sexuels, est due à…', choix: ['Un acarien (Sarcoptes scabiei)', 'Un pou', 'Une bactérie', 'Un virus'], correction: 'Démangeaisons surtout la nuit, sillons entre les doigts : on traite la personne et son entourage proche en même temps.' },
    { theme: 'Molluscum', question: 'Chez l\'adulte, le molluscum contagiosum génital est dû à…', choix: ['Un poxvirus', 'Un HPV', 'Le virus de l\'herpès', 'Une bactérie'], correction: 'Petites papules ombiliquées, bénignes, transmises par contact peau à peau.' }
  ];

  /* ═══════════ Les anecdotes : « Le saviez-vous ? » entre deux questions ═══════════ */
  const anecdotes = [
    { annee: 'Vers 1920', texte: 'Le VIH-1 pandémique a commencé sa course à Kinshasa, alors Léopoldville : les trains et la croissance de la ville l\'ont emporté bien au-delà.' },
    { annee: '16e siècle', texte: 'La syphilis change de nom selon le pays : « mal de Naples » en France, « mal français » en Italie… Chacun accuse son voisin.' },
    { annee: 'Avant 1943', texte: 'On soignait la syphilis au mercure, pendant des mois. D\'où le dicton : « Une nuit avec Vénus, une vie avec Mercure. »' },
    { annee: '1917', texte: 'Julius Wagner-Jauregg soigne la neurosyphilis en donnant le paludisme à ses patients : la fièvre tue les tréponèmes. Prix Nobel en 1927.' },
    { annee: '1928', texte: 'De retour de vacances, Alexander Fleming trouve une boîte de culture envahie par une moisissure : la pénicilline. Elle ne soignera la syphilis qu\'en 1943.' },
    { annee: '1981', texte: 'Des sarcomes de Kaposi chez de jeunes hommes à New York alertent les médecins : ce cancer rare touchait d\'habitude des hommes âgés.' },
    { annee: '1985', texte: 'Le dépistage du VIH sur les dons de sang commence : une révolution pour la sécurité des transfusions.' },
    { annee: '1986', texte: 'Le premier vaccin produit par génie génétique est autorisé : c\'est le vaccin contre l\'hépatite B.' },
    { annee: '1987', texte: 'À San Francisco naît le « AIDS Memorial Quilt » : une immense courtepointe de panneaux cousus en mémoire des personnes disparues. Il en compte aujourd\'hui près de 50 000.' },
    { annee: '1987', texte: 'La princesse Diana serre la main d\'un patient atteint du sida, sans gants, devant les photographes : un geste fort contre la peur de la contagion.' },
    { annee: '1996', texte: 'À la conférence de Vancouver, les trithérapies sont présentées : en quelques années, les décès liés au sida chutent fortement là où elles sont accessibles.' },
    { annee: '2011', texte: 'L\'essai HPTN 052 montre que le traitement réduit de 96 % la transmission du VIH : la revue Science en fait la découverte de l\'année.' },
    { annee: '2007-2009', texte: 'Timothy Ray Brown, le « patient de Berlin », guérit du VIH grâce à un donneur porteur d\'une mutation rare qui ferme la porte d\'entrée du virus.' },
    { annee: 'Antiquité', texte: '« Gonorrhée » vient du grec « écoulement de semence » : le médecin Galien croyait voir du sperme s\'écouler.' },
    { annee: 'Étymologie', texte: '« Chlamydia » vient du grec « manteau » : la bactérie se cache à l\'intérieur des cellules.' },
    { annee: 'Étymologie', texte: 'Treponema pallidum signifie « fil tordu pâle » : une bactérie en spirale, qui se colore très mal au microscope.' },
    { annee: 'Milieu du 19e siècle', texte: 'Après l\'invention du caoutchouc vulcanisé par Goodyear (1844), les premiers préservatifs en caoutchouc apparaissent.' },
    { annee: '1959', texte: 'Le plus ancien échantillon de sang contenant le VIH date de 1959, à Kinshasa : le virus circulait bien avant les premiers cas décrits.' },
    { annee: '1838', texte: 'Philippe Ricord démontre que la syphilis et la gonorrhée sont deux maladies différentes. Beaucoup pensaient qu\'il n\'y en avait qu\'une.' },
    { annee: '1988', texte: 'La première Journée mondiale de lutte contre le sida a lieu le 1er décembre 1988 : c\'est la première journée mondiale consacrée à la santé.' },
    { annee: '1991', texte: 'Le ruban rouge est imaginé à New York par le collectif d\'artistes Visual AIDS. Le ruban rose du cancer du sein s\'en est inspiré.' },
    { annee: '2008', texte: 'Harald zur Hausen reçoit le prix Nobel pour avoir montré le rôle des HPV dans le cancer du col : la voie vers le vaccin.' }
  ];

  return { prevention, meconnues, anecdotes };
});
