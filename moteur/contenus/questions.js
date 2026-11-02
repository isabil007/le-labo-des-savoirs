/*
 * ════════════════════════════════════════════════════════════════════
 *  CONTENU — Les questions du Labo des savoirs (VIH & IST)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Niveau : étudiants infirmiers (spécialisation en santé communautaire),
 *  qui ont déjà plusieurs années de cours. Les questions vont au-delà des
 *  généralités : clinique, étiologie, liquides biologiques, conduites à
 *  tenir, chiffres 2024.
 *
 *  Toutes les questions sont tirées du « Support théorique étudiants —
 *  VIH & IST » du Centre S (données épidémiologiques 2024 : Sciensano,
 *  ONUSIDA/OMS ; recommandations CDC, IUSTI, Jensen et al.).
 *
 *  LES QCM (blocs vih, bacteries, hepatites, ulceres, chiffres, consultation)
 *    • theme      : petite étiquette affichée au-dessus de la question
 *    • question   : l'énoncé affiché sur la tablette
 *    • choix      : les réponses ; la bonne est TOUJOURS la première ici
 *                   (le jeu les mélange avant de jouer)
 *    • correction : la correction affichée à la révélation, puis reprise
 *                   dans le corrigé de fin de partie
 *
 *  LES AFFIRMATIONS (blocs vraiFaux et risque)
 *    • texte      : l'affirmation ou la situation
 *    • vrai       : true / false (pour « risque » : true = il y a un risque)
 *    • correction : l'explication
 *
 *  LES SÉQUENCES (bloc ordre)
 *    • consigne   : ce qu'il faut remettre dans l'ordre
 *    • etapes     : les étapes DANS LE BON ORDRE (le jeu les mélange)
 *    • correction : l'explication
 *
 *  Pour ajouter une question : copiez une fiche, changez le texte, gardez
 *  la bonne réponse en premier. Vérifiez toujours les chiffres et les
 *  traitements dans les recommandations en vigueur.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/questions', function () {
  'use strict';

  /* ═══════════ 1. Le VIH : virus, transmission, évolution, traitement ═══════════ */
  const vih = [
    { theme: 'Le virus', question: 'Quel groupe du VIH-1 est lié aux gorilles d\'Afrique de l\'Ouest ?', choix: ['Le groupe P', 'Le groupe M', 'Le groupe O', 'Le VIH-2'], correction: 'Le VIH vient du virus de l\'immunodéficience simienne. Deux types, VIH-1 et VIH-2 ; le groupe P du VIH-1 est lié aux gorilles d\'Afrique de l\'Ouest.' },
    { theme: 'Le virus', question: 'Dans le cycle de vie du VIH, quelle étape suit l\'entrée dans la cellule CD4 ?', choix: ['La copie de l\'ARN viral en ADN', 'L\'intégration à l\'ADN de la cellule', 'La fabrication de nouveaux virus', 'La maturation'], correction: 'Fixation sur le CD4 → entrée → copie de l\'ARN en ADN → intégration → fabrication de nouveaux virus → libération et maturation.' },
    { theme: 'Le virus', question: 'Surface souillée par du sang VIH+ : que faut-il pour inactiver le virus ?', choix: ['Un désinfectant courant', 'Une stérilisation à l\'autoclave obligatoire', 'Rien : le virus résiste des semaines', 'Une décontamination par UV uniquement'], correction: 'Le VIH a besoin de chaleur, d\'humidité et de cellules humaines. Très fragile à l\'air, il est facilement éliminé par les désinfectants courants.' },
    { theme: 'Le virus', question: 'Pourquoi l\'observance du traitement est-elle si importante ?', choix: ['Le virus mute vite et devient résistant', 'Les effets secondaires disparaissent', 'Le virus quitte ses réservoirs', 'Les CD4 deviennent résistants au virus'], correction: 'Le VIH mute facilement : il devient vite résistant si le traitement est mal suivi.' },
    { theme: 'Liquides biologiques', question: 'Lequel de ces liquides est potentiellement contaminant pour le VIH ?', choix: ['Le liquide céphalo-rachidien', 'Les urines sans sang visible', 'Les expectorations sans sang visible', 'Les résidus gastriques sans sang visible'], correction: 'Contaminants : sang, sperme, sécrétions vaginales, lait maternel, tout liquide contenant du sang (LCR, pleural, amniotique…), tissus. Pas les larmes, sueur, salive, expectorations, résidus gastriques, urines, selles, sauf sang visible.' },
    { theme: 'Transmission', question: 'Lequel de ces facteurs AUGMENTE le risque de transmission sexuelle du VIH ?', choix: ['Une autre IST', 'La circoncision', 'Une charge virale indétectable', 'L\'absence d\'éjaculation'], correction: 'Augmentent le risque : charge virale élevée (primo-infection), lésions génitales, traumatismes, saignements, rapports multiples, autres IST, éjaculation, non-circoncision.' },
    { theme: 'Mère-enfant', question: 'Le passage transplacentaire du VIH est surtout décrit à quel moment de la grossesse ?', choix: ['Au 3e trimestre', 'Au 1er trimestre', 'Au 2e trimestre', 'Dès la conception'], correction: 'Risque in utero via le placenta (3e trimestre), à l\'accouchement et pendant l\'allaitement.' },
    { theme: 'Mère-enfant', question: 'Charge virale maternelle détectable à l\'accouchement : que prévoir pour le nouveau-né ?', choix: ['Traitement et prophylaxie post-exposition', 'Aucune mesure si l\'enfant va bien', 'Un dépistage à 18 ans', 'Un vaccin à la naissance'], correction: 'Traitement pendant la grossesse, charge virale indétectable visée au 3e trimestre et à l\'accouchement, traitement du bébé si charge détectable, prophylaxie post-exposition. L\'allaitement est discuté.' },
    { theme: 'Évolution', question: 'Combien de temps dure la primo-infection, jusqu\'à la séroconversion ?', choix: ['4 à 8 semaines', '3 à 5 jours', '6 mois', '1 an'], correction: 'Primo-infection : 4 à 8 semaines, réplication virale intense et séroconversion.' },
    { theme: 'Évolution', question: 'En primo-infection, quelle combinaison est correcte ?', choix: ['Contagiosité importante, test parfois négatif', 'Contagiosité faible, test toujours positif', 'Contagiosité nulle, test négatif', 'Contagiosité faible, test indéterminé'], correction: 'Réplication intense, contagiosité importante, test négatif ou indéterminé possible : l\'anamnèse est essentielle.' },
    { theme: 'Évolution', question: 'Quelle proportion des primo-infections est symptomatique ?', choix: ['75 %', '10 %', '30 %', '95 %'], correction: '75 % des primo-infections donnent des signes cliniques, mais aspécifiques.' },
    { theme: 'Évolution', question: 'Sans traitement, durée de la phase intermédiaire et du stade SIDA ?', choix: ['Jusqu\'à 12 ans, puis 2 à 3 ans', 'Jusqu\'à 2 ans, puis 12 ans', '6 mois, puis 10 ans', 'Jusqu\'à 30 ans, puis 6 mois'], correction: 'Phase intermédiaire jusqu\'à 12 ans (chronique, souvent asymptomatique au début), puis stade SIDA, 2 à 3 ans sans traitement.' },
    { theme: 'Stades cliniques', question: 'Altération de l\'état général, sueurs, mycoses, problèmes cutanés, sans infection opportuniste : quel stade ?', choix: ['Stade B', 'Stade A', 'Stade C', 'Primo-infection'], correction: 'Stade A : asymptomatique. Stade B : chronique symptomatique. Stade C : SIDA (maladies opportunistes, tumeurs, encéphalites).' },
    { theme: 'Traitement', question: 'Lequel n\'est PAS un objectif du traitement antirétroviral ?', choix: ['Éliminer le virus de ses réservoirs', 'Contrôler la réplication virale', 'Restaurer ou préserver l\'immunité', 'Prévenir la transmission'], correction: 'Objectifs : contrôler la réplication, restaurer/préserver l\'immunité, réduire morbidité et mortalité, améliorer la qualité de vie, prévenir la transmission. Les réservoirs restent inaccessibles.' },
    { theme: 'Traitement', question: 'Une infirmière se pique avec une aiguille souillée. Quelle prophylaxie peut être proposée ?', choix: ['Un traitement post-exposition (TPE)', 'Une PrEP', 'Le vaccin contre le VIH', 'Aucune : on attend la sérologie à 3 mois'], correction: 'TPE : après une exposition, professionnelle ou non. PrEP : avant une exposition. Il n\'existe pas de vaccin contre le VIH.' },
    { theme: 'Traitement', question: 'Lequel de ces sites est un réservoir du VIH cité dans le cours ?', choix: ['Le tractus génital', 'La peau', 'Les poumons', 'Les reins'], correction: 'Réservoirs peu accessibles : cerveau, tractus génital, système digestif. Le virus y reste caché, inaccessible aux médicaments.' },
    { theme: 'Traitement', question: 'Qui doit recevoir un traitement antirétroviral ?', choix: ['Tout patient vivant avec le VIH', 'Seulement si les CD4 sont bas', 'Seulement au stade C', 'Seulement en cas de projet de grossesse'], correction: 'Tout patient doit être traité, comme traitement et comme prévention.' },
    { theme: 'Prévention', question: 'Sous traitement, charge virale indétectable : quel message ?', choix: ['Indétectable = intransmissible', 'Le traitement peut être arrêté', 'Le virus est éradiqué', 'Le préservatif devient inutile contre toutes les IST'], correction: 'Indétectable = intransmissible pour le VIH. Le traitement doit être poursuivi, et le préservatif reste utile contre les autres IST.' }
  ];

  /* ═══════════ 2. Les IST bactériennes : chlamydia, gonorrhée, syphilis ═══════════ */
  const bacteries = [
    { theme: 'Épidémiologie', question: 'En Belgique, quelle IST est la plus fréquente chez les femmes ?', choix: ['La chlamydia', 'La gonorrhée', 'La syphilis', 'Le Mycoplasma genitalium'], correction: 'Femmes (2024, pour 100 000) : chlamydia 210, gonorrhée 55, syphilis 19. Pic de chlamydia entre 15 et 29 ans.' },
    { theme: 'Clinique', question: 'Jusqu\'à quelle proportion la cervicite à Chlamydia est-elle asymptomatique ?', choix: ['90 %', '10 %', '30 %', '50 %'], correction: 'Asymptomatiques : urétrite à Chlamydia 50 %, à gonocoque < 10 % ; cervicite à Chlamydia jusqu\'à 90 %, à gonocoque 50 %.' },
    { theme: 'Clinique', question: 'Quelle urétrite est le plus souvent symptomatique ?', choix: ['L\'urétrite à gonocoque', 'L\'urétrite à Chlamydia', 'L\'urétrite à Mycoplasma', 'Elles le sont toutes autant'], correction: 'L\'urétrite gonococcique est asymptomatique dans moins de 10 % des cas, contre 50 % pour Chlamydia.' },
    { theme: 'Étiologie', question: 'Quelle part des urétrites est gonococcique ?', choix: ['75 %', '20 %', '50 %', '10 %'], correction: 'Gonococcique 75 %. Non gonococcique : C. trachomatis 20-50 %, M. genitalium 10-35 %, Trichomonas 1-20 %, Ureaplasma 5-10 %, HSV 2-3 %, adénovirus 2-4 % (Jensen et al., 2021).' },
    { theme: 'Étiologie', question: 'Quelle part des cervicites reste d\'origine indéterminée ?', choix: ['Environ 50 %', 'Environ 5 %', 'Environ 25 %', 'Environ 90 %'], correction: 'Cervicite : C. trachomatis, N. gonorrhoeae, M. genitalium (10-25 %), Trichomonas, Ureaplasma, HSV ; origine indéterminée dans 50 % des cas.' },
    { theme: 'Clinique', question: 'Lequel de ces signes oriente vers une cervicite ?', choix: ['Saignements lors des rapports', 'Chancre indolore', 'Éruption palmo-plantaire', 'Ictère'], correction: 'Cervicite : écoulement vaginal, dysurie, métrorragies, ménorragies, saignements lors des rapports.' },
    { theme: 'Complications', question: 'Quelle complication est propre à l\'urétrite chez l\'homme ?', choix: ['Orchi-épididymite', 'Grossesse extra-utérine', 'Cirrhose', 'Maladie inflammatoire pelvienne'], correction: 'Urétrite : orchi-épididymite, prostatite, sténose urétrale. Cervicite : MIP, GEU, stérilité. Les deux : transmission du VIH accrue, arthrite réactionnelle, syndrome oculo-urétro-synovial.' },
    { theme: 'Dépistage', question: 'Quel examen permet le diagnostic de gonorrhée sur un écoulement urétral ?', choix: ['L\'examen direct après coloration de Gram', 'La sérologie', 'Le TROD', 'Le sédiment urinaire seul'], correction: 'Gram sur frottis ou écoulement : diagnostic de gonorrhée. Sédiment urinaire chez l\'homme : argument indirect. PCR : examen de référence.' },
    { theme: 'Dépistage', question: 'Sédiment urinaire chez l\'homme : quel seuil est un argument indirect d\'urétrite ?', choix: ['Plus de 10 globules blancs par champ', 'Plus de 2 globules rouges par champ', 'Présence de cristaux', 'Plus de 100 bactéries par champ'], correction: 'Plus de 10 globules blancs par champ : argument indirect. La PCR reste l\'examen de référence.' },
    { theme: 'Dépistage', question: 'PCR urinaire : quel prélèvement ?', choix: ['1er jet, ou 2 h après la dernière miction', 'Milieu de jet, à jeun', 'Urines de 24 heures', 'Urines du matin, milieu de jet'], correction: 'PCR sur frottis vaginal, anal ou pharyngé, ou urines du 1er jet / au moins 2 h après la dernière miction.' },
    { theme: 'Traitement', question: 'Régime recommandé pour une urétrite ou cervicite non documentée ?', choix: ['Ceftriaxone IM + doxycycline 100 mg 2×/j, 7 jours', 'Amoxicilline per os, 5 jours', 'Ceftriaxone IM seule, dose unique', 'Doxycycline seule, 3 jours'], correction: 'Antibiotiques actifs sur le gonocoque ET Chlamydia : ceftriaxone 500 mg IM (CDC) ou 1 g IM (IUSTI) + doxycycline 100 mg 2×/j pendant 7 jours. Toujours vérifier les recommandations en vigueur.' },
    { theme: 'Syphilis', question: 'Treponema pallidum est…', choix: ['Une spirochète', 'Un cocci Gram négatif', 'Un mycoplasme', 'Un virus à ADN'], correction: 'Treponema pallidum, une spirochète. Syphilis décrite dès le 15e siècle ; incubation de 3 semaines à 3 mois.' },
    { theme: 'Syphilis', question: 'Syphilis primaire : délai d\'apparition et durée du chancre ?', choix: ['Souvent 3 semaines ; régresse en 2 à 6 semaines', '48 heures ; persiste des années', '6 mois ; régresse en 3 jours', '1 an ; ne régresse jamais seul'], correction: 'Incubation 10 jours à 3 mois (souvent 3 semaines). Chancre souvent unique, indolore, induré, régresse seul en 2 à 6 semaines. Contagiosité très forte.' },
    { theme: 'Syphilis', question: 'Quand apparaît la syphilis secondaire ?', choix: ['6 semaines à 6 mois après le chancre', '24 h après le chancre', '10 à 30 ans après', 'Uniquement chez l\'immunodéprimé'], correction: 'Dissémination sanguine : éruption (90 %), paumes et plantes, muqueuses, adénopathies, fièvre ; récidives la 1re année sans traitement.' },
    { theme: 'Syphilis', question: 'La syphilis latente est…', choix: ['Non infectante, mais transmissible de la mère à l\'enfant', 'Très contagieuse par voie sexuelle', 'Toujours symptomatique', 'Guérie spontanément'], correction: 'Latente : asymptomatique, non infectante, transmission materno-fœtale possible. Non traitée : 25 % évoluent vers une syphilis tertiaire.' },
    { theme: 'Syphilis', question: 'À quel stade la neurosyphilis peut-elle apparaître ?', choix: ['À tous les stades', 'Uniquement au stade tertiaire', 'Uniquement au stade secondaire', 'Jamais avant 10 ans d\'évolution'], correction: 'La neurosyphilis peut apparaître à tous les stades.' },
    { theme: 'Syphilis', question: 'Pourquoi une sérologie négative ne suffit-elle pas à exclure une syphilis récente ?', choix: ['Elle peut être négative au stade très précoce', 'Elle ne détecte que la syphilis tertiaire', 'Elle est toujours faussement négative chez l\'homme', 'Elle ne se fait que sur le chancre'], correction: 'Diagnostic : examen clinique, sérologie, TROD. La sérologie peut être négative au stade très précoce.' }
  ];

  /* ═══════════ 3. Les hépatites A, B et C ═══════════ */
  const hepatites = [
    { theme: 'Transmission', question: 'Pour l\'hépatite B, quel mode de transmission présente un risque FAIBLE ?', choix: ['La salive', 'Le rapport oral', 'Le tatouage', 'Le partage de seringues'], correction: 'Hépatite B : sexuelle (oral, pénétration), sanguine (seringues, tatouage, piercing) ; salive : risque faible.' },
    { theme: 'Transmission', question: 'Quelle hépatite se transmet par voie oro-fécale et ne devient jamais chronique ?', choix: ['L\'hépatite A', 'L\'hépatite B', 'L\'hépatite C', 'Aucune'], correction: 'Hépatite A : voie oro-fécale, fréquente dans les pays aux mauvaises conditions sanitaires. Elle ne devient jamais chronique.' },
    { theme: 'Prévention', question: 'Contre quelle hépatite n\'existe-t-il PAS de vaccin ?', choix: ['L\'hépatite C', 'L\'hépatite A', 'L\'hépatite B', 'Il y a un vaccin pour les trois'], correction: 'Vaccins contre A et B. Pour C : matériel stérile, éviter le contact avec du sang infecté, préservatifs (rapports anaux).' },
    { theme: 'Chronicité', question: 'Quelle part des hépatites C deviennent chroniques ?', choix: ['60 à 70 %', '10 %', 'Aucune', '1 %'], correction: 'Chronicité : A aucune, B 10 %, C 60 à 70 %.' },
    { theme: 'Chronicité', question: 'Quelle part des hépatites B deviennent chroniques ?', choix: ['10 %', '60 à 70 %', '100 %', 'Aucune'], correction: '90 % des personnes éliminent seules le virus de l\'hépatite B ; 10 % évoluent vers une hépatite chronique.' },
    { theme: 'Transmission', question: 'Partager une brosse à dents ou un rasoir expose surtout à…', choix: ['L\'hépatite C', 'L\'hépatite A', 'La chlamydia', 'Rien du tout'], correction: 'Hépatite C : transmission sanguine (seringues, tatouage, piercing, rasoirs, brosse à dents), sexuelle, mère-enfant, éclaboussures de sang.' },
    { theme: 'Clinique', question: 'Hépatite B aiguë : quelle évolution est la plus fréquente ?', choix: ['Élimination spontanée du virus (90 %)', 'Chronicité dans 60 à 70 % des cas', 'Évolution constante vers la cirrhose', 'Guérison uniquement sous antiviral'], correction: '90 % éliminent seuls le virus de l\'hépatite B. Hépatite chronique (10 %) : antiviral, sans guérison totale ; risques de cirrhose et de cancer.' },
    { theme: 'Complications', question: 'Quelles sont les complications des hépatites chroniques ?', choix: ['Cirrhose et cancer du foie', 'Stérilité', 'Surdité', 'Arthrite réactionnelle'], correction: 'Les formes chroniques peuvent évoluer vers la cirrhose et le cancer.' },
    { theme: 'Traitement', question: 'Comment traite-t-on une hépatite C chronique ?', choix: ['Antiviraux pendant 2 ou 3 mois', 'Antibiotiques pendant 7 jours', 'Aucun traitement n\'existe', 'Un vaccin'], correction: 'Hépatite C chronique : antiviraux pendant 2 ou 3 mois. Hépatite B chronique : antiviral, sans guérison totale. Hépatite A : le virus s\'élimine seul.' },
    { theme: 'Dépistage', question: 'Combien de temps après la contamination peut-on dépister l\'hépatite C ?', choix: ['8 à 12 semaines', '24 heures', '1 an', '3 jours'], correction: 'Prise de sang et TROD. Incubation : 4 à 8 semaines pour B, 8 à 12 semaines pour C.' },
    { theme: 'Dépistage', question: 'D\'après le cours, quelle hépatite se dépiste par prise de sang seule, sans TROD ?', choix: ['L\'hépatite A', 'L\'hépatite B', 'L\'hépatite C', 'Aucune'], correction: 'A : prise de sang. B et C : prise de sang et TROD.' }
  ];

  /* ═══════════ 4. Ulcères génitaux, herpès, HPV et vaccination ═══════════ */
  const ulceres = [
    { theme: 'Ulcère génital', question: 'Devant des ulcérations génitales DOULOUREUSES, on pense d\'abord à…', choix: ['L\'herpès', 'La syphilis primaire', 'La lymphogranulomatose vénérienne', 'Une syphilis secondaire'], correction: 'Herpès en première intention (ulcérations douloureuses). Syphilis : chancre indolore. Penser aussi à la lymphogranulomatose vénérienne.' },
    { theme: 'Ulcère génital', question: 'La lymphogranulomatose vénérienne est due à…', choix: ['Chlamydia trachomatis (sérovars L1 à L3)', 'HSV-2', 'Treponema pallidum', 'Le HPV 6'], correction: 'À évoquer devant un ulcère génital, avec l\'herpès et la syphilis.' },
    { theme: 'Herpès', question: 'Taux de récidive de l\'herpès génital selon le type ?', choix: ['HSV-2 : 60 % ; HSV-1 : 14 %', 'HSV-2 : 14 % ; HSV-1 : 60 %', 'Les deux : 100 %', 'Les deux : moins de 5 %'], correction: 'Ulcères génito-anaux : 80 % HSV-2, 20 % HSV-1. Incubation 6 jours (2 à 20), résolution en 2 à 3 semaines.' },
    { theme: 'Herpès', question: 'Par combien l\'herpès HSV-2 multiplie-t-il le risque d\'acquérir le VIH ?', choix: ['Par 3', 'Par 1,1', 'Par 10', 'Par 100'], correction: 'Les lésions génitales augmentent le risque de transmission du VIH : HSV-2 le multiplie par 3.' },
    { theme: 'Herpès', question: 'Comment diagnostique-t-on l\'herpès génital ?', choix: ['Clinique et PCR sur le liquide d\'une vésicule', 'Une prise de sang, surtout', 'Une radiographie', 'Un frottis de gorge'], correction: 'Diagnostic clinique et PCR sur liquide de vésicule ou sécrétion vaginale. La prise de sang a peu d\'intérêt.' },
    { theme: 'HPV', question: 'Quelle part de la population sexuellement active rencontrera le HPV ?', choix: ['70 à 80 %', '5 %', '20 %', '100 %'], correction: '70 à 80 % des personnes sexuellement actives rencontreront le HPV. Les 15-24 ans sont les plus exposés.' },
    { theme: 'HPV', question: 'Le plus souvent, combien de temps faut-il au corps pour éliminer le HPV ?', choix: ['1 à 2 ans', '1 semaine', '10 ans', 'Il ne l\'élimine jamais'], correction: 'Le virus est souvent éliminé naturellement en 1 à 2 ans, mais des lésions peuvent apparaître des mois ou des années plus tard.' },
    { theme: 'HPV', question: 'Quels types de HPV causent les condylomes (verrues génitales) ?', choix: ['HPV 6 et 11', 'HPV 16 et 18', 'HSV-1 et HSV-2', 'VIH-1 et VIH-2'], correction: 'Condylomes : HPV 6 et 11. Il existe plus de 200 types de HPV.' },
    { theme: 'HPV', question: 'Lequel de ces cancers peut être causé par le HPV ?', choix: ['Le cancer de la gorge', 'Le cancer du foie', 'Le cancer du poumon', 'La leucémie'], correction: 'Cancers liés au HPV : col de l\'utérus, anus, vulve, pénis, gorge. Environ 1 000 nouveaux cas par an en Belgique.' },
    { theme: 'Dépistage', question: 'Quel rythme pour le dépistage du cancer du col ?', choix: ['PAP test tous les 3 ans ou test HPV tous les 5 ans', 'Une fois dans la vie', 'Tous les ans dès 12 ans', 'Seulement en cas de symptômes'], correction: 'Col de l\'utérus : PAP test tous les 3 ans ou test HPV tous les 5 ans. Anus : dépistage ciblé (personnes vivant avec le VIH, immunodéprimées, HSH).' },
    { theme: 'Vaccination', question: 'Quand le vaccin HPV (Gardasil 9) est-il le plus efficace ?', choix: ['Avant le début de l\'activité sexuelle', 'Après 45 ans', 'Pendant une infection HPV', 'Uniquement après un cancer'], correction: 'Le plus efficace avant toute activité sexuelle. Recommandé jusqu\'à 26 ans pour les HSH ; de 27 à 45 ans, au cas par cas.' },
    { theme: 'Vaccination', question: 'En Belgique, pour qui le vaccin HPV est-il remboursé de 12 à 30 ans ?', choix: ['Les filles et les garçons', 'Uniquement les filles', 'Uniquement les garçons', 'Personne'], correction: 'Remboursé de 12 à 30 ans pour filles et garçons, et jusqu\'à 45 ans chez les personnes immunodéprimées, dont celles vivant avec le VIH. Vérifier les conditions en vigueur.' },
    { theme: 'Vaccination', question: 'Entre 27 et 45 ans (hors immunodépression), le vaccin HPV est…', choix: ['Discuté au cas par cas, avec moins de bénéfice', 'Contre-indiqué', 'Obligatoire', 'Remboursé pour tous'], correction: 'Plus efficace avant l\'activité sexuelle ; recommandé jusqu\'à 26 ans chez les HSH ; 27-45 ans au cas par cas.' },
    { theme: 'Protection', question: 'Quel moyen protège lors d\'un cunnilingus ou d\'un anulingus ?', choix: ['Le carré de latex', 'La PrEP', 'Le préservatif externe', 'Le vaccin hépatite B'], correction: 'Carré de latex pour le cunnilingus et l\'anulingus ; préservatif externe et interne : protection partielle contre le HPV.' }
  ];

  /* ═══════════ 5. Le juste chiffre : l'épidémiologie ═══════════ */
  const chiffres = [
    { theme: 'Monde 2024', question: 'Combien de personnes vivent avec le VIH dans le monde ?', choix: ['40,8 millions', '4,1 millions', '120 millions', '400 000'], correction: 'Environ 40,8 millions en 2024 (40,4 millions en 2023). Source : ONUSIDA/OMS, 2025.' },
    { theme: 'Monde 2024', question: 'Combien de nouvelles infections par le VIH dans le monde en 2024 ?', choix: ['1,3 million', '130 000', '13 millions', '31,6 millions'], correction: '1,3 million de nouvelles infections en 2024, soit −40 % depuis 2010.' },
    { theme: 'Monde 2024', question: 'Combien de décès liés au VIH dans le monde en 2024 ?', choix: ['630 000', '63 000', '6,3 millions', '1,3 million'], correction: '630 000 décès en 2024 (650 000 en 2023) : −54 % depuis 2010.' },
    { theme: 'Monde 2024', question: 'Quelle part des personnes vivant avec le VIH vit dans la Région africaine de l\'OMS ?', choix: ['65 %', '25 %', '90 %', '10 %'], correction: '65 %, soit 26,3 millions de personnes. Région des Amériques : 4,2 millions.' },
    { theme: 'Monde 2024', question: 'Combien de personnes sont sous traitement contre le VIH dans le monde ?', choix: ['31,6 millions', '3,1 millions', '40,8 millions', '10 millions'], correction: '31,6 millions de personnes sous traitement en 2024 (30,3 millions en 2023).' },
    { theme: 'Objectifs', question: 'Les objectifs ONUSIDA pour 2030 s\'appellent…', choix: ['95-95-95', '90-90-90', '100-100-100', '80-80-80'], correction: '95 % connaissent leur statut, 95 % d\'entre eux sont traités, 95 % des personnes traitées ont une charge virale supprimée.' },
    { theme: 'Belgique 2024', question: 'Combien de nouveaux diagnostics de VIH en Belgique en 2024 ?', choix: ['662', '66', '6 620', '19 000'], correction: '662 diagnostics (+2 % par rapport à 2023) : 187 femmes et 462 hommes. Source : Sciensano.' },
    { theme: 'Belgique 2024', question: 'En Belgique, quel est le premier mode d\'infection parmi les nouveaux diagnostics de VIH ?', choix: ['Hétérosexuel (50 %)', 'Usage de drogues IV (50 %)', 'Périnatal (50 %)', 'Transfusion (50 %)'], correction: 'Hétérosexuel 50 %, HSH 44 %, usage de drogues IV 3 %, périnatal 1 % (Sciensano, 2024).' },
    { theme: 'Belgique 2024', question: 'Combien de personnes vivant avec le VIH étaient suivies en Belgique en 2024 ?', choix: ['Plus de 19 000', 'Environ 1 900', 'Plus de 190 000', 'Environ 8 500'], correction: 'Plus de 19 000 en 2024, contre environ 8 500 en 2006.' },
    { theme: 'Belgique 2024', question: 'Quelle part des personnes suivies pour le VIH en Belgique est sous traitement ?', choix: ['98,3 %', '50 %', '75 %', '85 %'], correction: '98,3 % en 2024, contre 93,9 % en 2015.' },
    { theme: 'Belgique 2024', question: 'Quelle part des personnes vivant avec le VIH en Belgique est diagnostiquée ?', choix: ['94 %', '64 %', '44 %', '100 %'], correction: '94 % diagnostiquées ; 95 % d\'entre elles traitées ; 98 % des personnes traitées ont une charge virale supprimée.' },
    { theme: 'IST', question: 'Quelle part des cas de syphilis concerne des hommes ?', choix: ['82 %', '50 %', '25 %', '99 %'], correction: 'Syphilis : hommes 82 %, dont HSH et bisexuels 88 %, surtout entre 20 et 59 ans (Sciensano, 2023).' },
    { theme: 'IST', question: 'Quelle part des cas de gonorrhée concerne des hommes ?', choix: ['78 %', '22 %', '50 %', '95 %'], correction: 'Gonorrhée : hommes 78 % ; 15-30 ans chez les femmes, 20-39 ans chez les hommes (Sciensano, 2023).' },
    { theme: 'HPV', question: 'Combien de types de HPV existe-t-il ?', choix: ['Plus de 200', '2', '12', 'Plus de 2 000'], correction: 'Plus de 200 types. Les HPV 6 et 11 causent les condylomes.' }
  ];

  /* ═══════════ 6. En consultation : cas pratiques ═══════════ */
  const consultation = [
    { theme: 'Cas pratique', question: 'Une patiente sans aucun symptôme demande si un dépistage IST est utile.', choix: ['Oui : beaucoup d\'IST sont asymptomatiques', 'Non : sans symptôme, pas d\'IST', 'Seulement si elle a plus de 40 ans', 'Seulement pour le VIH'], correction: 'Beaucoup d\'IST sont asymptomatiques : chlamydia (2 cas sur 3), cervicite à chlamydia jusqu\'à 90 %. On dépiste même sans symptôme.' },
    { theme: 'Cas pratique', question: 'Rapport à risque il y a 3 jours, test VIH négatif. Que dire ?', choix: ['Un test si précoce n\'exclut pas une infection', 'Il est rassuré : pas de VIH', 'Le test est faux, il faut le jeter', 'Il est immunisé'], correction: 'Un test négatif très tôt après l\'exposition n\'exclut pas une infection : en primo-infection, le test peut être négatif ou indéterminé.' },
    { theme: 'Cas pratique', question: 'Rapport non protégé avec une personne séropositive non traitée, il y a quelques heures.', choix: ['Orienter vers un traitement post-exposition (TPE)', 'Attendre 3 mois et faire un test', 'Proposer le vaccin HPV', 'Rien : le risque est nul'], correction: 'Le TPE se prend après une exposition, professionnelle ou non. Plus il commence tôt, mieux c\'est.' },
    { theme: 'Cas pratique', question: 'Un patient a une chlamydia. Que proposer en plus du traitement ?', choix: ['Un dépistage complet des autres IST, VIH compris', 'Rien de plus', 'Une radiographie du thorax', 'Un vaccin contre la chlamydia'], correction: 'Les facteurs de risque sont les mêmes pour toutes les IST : on propose un dépistage complet, VIH compris.' },
    { theme: 'Cas pratique', question: 'Lors d\'une consultation IST, quels vaccins vérifier ?', choix: ['Hépatites A et B (et HPV)', 'Grippe et COVID', 'Tétanos uniquement', 'Rage'], correction: 'Vérifier les vaccinations contre les hépatites A et B, et le HPV selon l\'âge et la situation.' },
    { theme: 'Cas pratique', question: 'Un homme a un ulcère génital unique, indolore et dur. Quel diagnostic évoquer ?', choix: ['Une syphilis primaire', 'Un herpès', 'Une hépatite A', 'Une chlamydia simple'], correction: 'Chancre syphilitique : souvent unique, indolore, induré. Contagiosité très forte. Diagnostic : examen clinique, sérologie, TROD.' },
    { theme: 'Cas pratique', question: 'Un étudiant HSH de 22 ans demande s\'il peut encore se faire vacciner contre le HPV.', choix: ['Oui : recommandé jusqu\'à 26 ans pour les HSH', 'Non : trop tard après 18 ans', 'Seulement s\'il a des verrues', 'Seulement les femmes'], correction: 'Gardasil 9 recommandé jusqu\'à 26 ans pour les HSH ; remboursé de 12 à 30 ans en Belgique.' },
    { theme: 'Cas pratique', question: 'Une femme enceinte vit avec le VIH. Quel est l\'objectif ?', choix: ['Traitement et charge virale indétectable à l\'accouchement', 'Arrêter le traitement pendant la grossesse', 'Interrompre la grossesse', 'Aucun suivi particulier'], correction: 'Traitement pendant la grossesse, charge virale indétectable au 3e trimestre et à l\'accouchement, traitement et prophylaxie pour le bébé si besoin. L\'allaitement est discuté.' },
    { theme: 'Cas pratique', question: 'Une personne vivant avec le VIH : quel dépistage HPV spécifique ?', choix: ['Le dépistage du cancer anal', 'Aucun', 'Une PCR urinaire', 'Une prise de sang HPV'], correction: 'Dépistage anal (toucher rectal, cytologie) pour les personnes vivant avec le VIH, immunodéprimées et HSH. Le test HPV y est peu utile vu la forte prévalence.' },
    { theme: 'Cas pratique', question: 'Votre patient est traité pour une gonorrhée. Et son ou sa partenaire ?', choix: ['L\'informer, le dépister et le traiter', 'Inutile s\'il n\'a pas de symptôme', 'Le traiter sans rien lui dire', 'Attendre qu\'il consulte de lui-même'], correction: 'Toujours dépister et traiter les partenaires, et protéger les rapports pendant 7 jours après le traitement.' },
    { theme: 'Cas pratique', question: 'Pendant le counselling, jusqu\'à quand postposer l\'activité sexuelle ?', choix: ['7 jours après le traitement', 'Le jour même du traitement', '6 mois', 'Ce n\'est pas nécessaire'], correction: 'Counselling : expliquer la transmission, rappeler que les facteurs de risque sont communs, postposer l\'activité sexuelle jusqu\'à 7 jours après le traitement.' }
  ];

  /* ═══════════ 7. Vrai ou faux : les idées reçues ═══════════ */
  const vraiFaux = [
    { texte: 'Un test VIH négatif 3 jours après un rapport à risque exclut l\'infection.', vrai: false, correction: 'En primo-infection, le test peut être négatif ou indéterminé alors que la contagiosité est importante.' },
    { texte: 'Sous traitement, une charge virale indétectable empêche la transmission sexuelle du VIH.', vrai: true, correction: 'Indétectable = intransmissible : le traitement est aussi un outil de prévention.' },
    { texte: 'La syphilis latente est infectante par voie sexuelle.', vrai: false, correction: 'Latente : non infectante, mais la transmission de la mère à l\'enfant reste possible.' },
    { texte: 'La neurosyphilis n\'apparaît qu\'au stade tertiaire.', vrai: false, correction: 'La neurosyphilis peut apparaître à tous les stades.' },
    { texte: 'Le test HPV est l\'outil de choix pour dépister le cancer anal chez les HSH.', vrai: false, correction: 'Dépistage anal : toucher rectal et cytologie. Le test HPV est peu utile vu la forte prévalence.' },
    { texte: 'En cas d\'urétrite très symptomatique, on attend la PCR avant de traiter.', vrai: false, correction: 'Symptômes sévères : on traite sans attendre les résultats, avec une couverture gonocoque + Chlamydia.' },
    { texte: 'Environ la moitié des cervicites restent d\'origine indéterminée.', vrai: true, correction: 'Origine indéterminée dans 50 % des cas (Jensen et al., 2021).' },
    { texte: 'Le liquide amniotique est considéré comme potentiellement contaminant pour le VIH.', vrai: true, correction: 'Tout liquide contenant du sang (LCR, pleural, amniotique…) est considéré comme contenant du VIH.' },
    { texte: 'Une salive contenant du sang visible doit être considérée comme à risque.', vrai: true, correction: 'Salive, larmes, urines… ne transmettent pas le VIH, SAUF s\'ils contiennent du sang visible à l\'œil nu.' },
    { texte: 'L\'hépatite B chronique se guérit totalement sous antiviral.', vrai: false, correction: 'Hépatite B chronique : antiviral, sans guérison totale. 90 % des infections aiguës guérissent seules.' },
    { texte: 'HSV-2 multiplie par 3 le risque d\'acquisition du VIH.', vrai: true, correction: 'Les lésions génitales favorisent la transmission du VIH.' },
    { texte: 'Le préservatif protège à 100 % contre la syphilis.', vrai: false, correction: 'Transmission aussi orale et par contact direct avec les lésions.' },
    { texte: 'L\'herpès peut se transmettre en l\'absence de lésion visible.', vrai: true, correction: 'Très contagieux, il se transmet par contact direct, même sans lésion apparente.' },
    { texte: 'La prise de sang est l\'examen clé pour diagnostiquer un herpès génital.', vrai: false, correction: 'Clinique et PCR sur liquide de vésicule ou sécrétion vaginale. La sérologie a peu d\'intérêt.' },
    { texte: 'Le vaccin HPV est remboursé jusqu\'à 45 ans chez les personnes vivant avec le VIH.', vrai: true, correction: 'Remboursé de 12 à 30 ans (filles et garçons) et jusqu\'à 45 ans chez les personnes immunodéprimées, dont celles vivant avec le VIH. À vérifier selon les conditions en vigueur.' },
    { texte: 'En Belgique, la gonorrhée est plus fréquente chez les femmes que chez les hommes.', vrai: false, correction: 'Hommes : 78 % des cas. En 2024 : 251/100 000 hommes contre 55/100 000 femmes.' },
    { texte: 'Le nombre de diagnostics de VIH en Belgique a baissé en 2024.', vrai: false, correction: '662 diagnostics : +2 %. Hausses chez les hommes belges (+18 %), les HSH belges (+15 %) et les hétérosexuels belges (+33 %).' },
    { texte: 'Les facteurs de risque d\'acquisition sont les mêmes pour toutes les IST, VIH compris.', vrai: true, correction: 'Une IST diagnostiquée = dépistage complet des autres, VIH compris.' },
    { texte: 'Une chlamydia non traitée peut entraîner une grossesse extra-utérine.', vrai: true, correction: 'Complications de la cervicite : MIP, grossesse extra-utérine, stérilité.' },
    { texte: 'L\'hépatite A peut évoluer vers une forme chronique.', vrai: false, correction: 'Aucune chronicité pour l\'hépatite A. B : 10 %. C : 60 à 70 %.' }
  ];

  /* ═══════════ 8. Risque ou pas ? Les situations ═══════════ */
  const risque = [
    { infection: 'VIH', texte: 'Exposition à du liquide céphalo-rachidien lors d\'une ponction lombaire', vrai: true, correction: 'Le LCR, comme tout liquide pouvant contenir du sang (pleural, amniotique…), est considéré comme contaminant.' },
    { infection: 'VIH', texte: 'Projection de liquide pleural sur une plaie ouverte', vrai: true, correction: 'Liquide pleural : potentiellement contaminant. Exposition sur une plaie = accident d\'exposition.' },
    { infection: 'VIH', texte: 'Contact avec des urines sans sang visible', vrai: false, correction: 'Urines et selles ne transmettent pas le VIH, sauf sang visible.' },
    { infection: 'VIH', texte: 'Contact avec des vomissements sans sang visible', vrai: false, correction: 'Les résidus gastriques ne transmettent pas le VIH, sauf sang visible.' },
    { infection: 'VIH', texte: 'Contact avec des expectorations striées de sang', vrai: true, correction: 'Expectorations : pas de risque… sauf si elles contiennent du sang visible.' },
    { infection: 'VIH', texte: 'Projection de salive non sanglante dans l\'œil', vrai: false, correction: 'La salive ne transmet pas le VIH, sauf sang visible.' },
    { infection: 'VIH', texte: 'Accouchement : projection de liquide amniotique sur une muqueuse', vrai: true, correction: 'Le liquide amniotique est considéré comme potentiellement contaminant.' },
    { infection: 'VIH', texte: 'Allaitement par une mère vivant avec le VIH, charge virale détectable', vrai: true, correction: 'Le lait maternel contient du VIH. L\'allaitement est discuté, avec un bon suivi.' },
    { infection: 'VIH', texte: 'Rapport sans préservatif avec un partenaire traité, indétectable depuis longtemps', vrai: false, correction: 'Indétectable = intransmissible pour le VIH. Le risque des autres IST, lui, demeure.' },
    { infection: 'VIH', texte: 'Rapport vaginal sans préservatif avec une personne en primo-infection', vrai: true, correction: 'Charge virale très élevée en primo-infection : contagiosité importante.' },
    { infection: 'VIH', texte: 'Contact de sueur pendant un soin d\'hygiène', vrai: false, correction: 'La sueur ne transmet pas le VIH.' },
    { infection: 'Hépatite C', texte: 'Partage de paille pour sniffer', vrai: true, correction: 'Matériel stérile pour tatouages, piercing, injections et sniff : hépatites B et C.' },
    { infection: 'Hépatite C', texte: 'Éclaboussure de sang sur une plaie ouverte', vrai: true, correction: 'Hépatite C : transmission sanguine, y compris par éclaboussures sur muqueuse ou plaie ouverte.' },
    { infection: 'Hépatite C', texte: 'Partage d\'une brosse à dents', vrai: true, correction: 'Rasoirs et brosses à dents peuvent transmettre l\'hépatite C.' },
    { infection: 'HPV', texte: 'Caresses sexuelles sans pénétration', vrai: true, correction: 'Le HPV se transmet aussi par contact cutané : frottements, caresses.' },
    { infection: 'Syphilis', texte: 'Fellation non protégée', vrai: true, correction: 'La syphilis se transmet aussi par voie orale et par contact avec les lésions.' }
  ];

  /* ═══════════ 9. Dans l'ordre ! Les séquences ═══════════ */
  const ordre = [
    { consigne: 'Le cycle de vie du VIH, de la première à la dernière étape', etapes: ['Fixation sur la cellule CD4', 'Entrée dans la cellule', 'Copie de l\'ARN viral en ADN', 'Intégration à l\'ADN de la cellule', 'Fabrication de nouveaux virus', 'Libération et maturation'], correction: 'Le virus a besoin des cellules CD4 pour se multiplier, et il les détruit progressivement.' },
    { consigne: 'L\'histoire naturelle du VIH, sans traitement', etapes: ['Contamination', 'Primo-infection (4 à 8 semaines)', 'Phase intermédiaire (jusqu\'à 12 ans)', 'Stade SIDA (2 à 3 ans)'], correction: 'Charge virale très élevée en primo-infection, puis baisse progressive des CD4 jusqu\'au SIDA.' },
    { consigne: 'Les stades de la syphilis, du plus précoce au plus tardif', etapes: ['Primaire : le chancre', 'Secondaire : l\'éruption', 'Latente : sans symptôme', 'Tertiaire : atteintes nerveuses et cardiaques'], correction: 'Précoce (< 1 an) : primaire, secondaire, latente précoce. Tardive (> 1 an) : latente tardive, tertiaire. La neurosyphilis peut survenir à tous les stades.' },
    { consigne: 'Les stades cliniques du VIH, de A à C', etapes: ['Pas de signe clinique', 'Problèmes cutanés, sueurs, mycoses', 'Maladies opportunistes, tumeurs'], correction: 'Stade A : asymptomatique. Stade B : symptomatique. Stade C : SIDA.' },
    { consigne: 'Les objectifs 95-95-95, dans l\'ordre de la cascade', etapes: ['Connaître son statut', 'Être sous traitement', 'Avoir une charge virale supprimée'], correction: 'Chaque étape se calcule sur la précédente. Belgique 2024 : 94 %, 95 %, 98 %.' },
    { consigne: 'Après le diagnostic d\'une IST : les gestes pour le partenaire', etapes: ['Informer le ou les partenaires', 'Rapports protégés pendant 7 jours après le traitement', 'Tester les autres IST'], correction: 'Conseil et dépistage du partenaire, plus dépistage des autres IST.' },
    { consigne: 'Chez les hommes en Belgique (2024), de l\'IST la plus fréquente à la moins fréquente', etapes: ['Gonorrhée', 'Chlamydia', 'Syphilis'], correction: 'Pour 100 000 hommes : gonorrhée 251, chlamydia 188, syphilis 135.' },
    { consigne: 'Chez les femmes en Belgique (2024), de l\'IST la plus fréquente à la moins fréquente', etapes: ['Chlamydia', 'Gonorrhée', 'Syphilis'], correction: 'Pour 100 000 femmes : chlamydia 210, gonorrhée 55, syphilis 19.' },
    { consigne: 'Les hépatites, du plus fort au plus faible risque de chronicité', etapes: ['Hépatite C (60 à 70 %)', 'Hépatite B (10 %)', 'Hépatite A (aucune)'], correction: 'L\'hépatite C devient chronique dans 60 à 70 % des cas ; on la traite par antiviraux pendant 2 ou 3 mois.' },
    { consigne: 'Le VIH dans le monde en 2024, du plus grand au plus petit nombre', etapes: ['Personnes vivant avec le VIH (40,8 M)', 'Personnes sous traitement (31,6 M)', 'Nouvelles infections (1,3 M)', 'Décès (630 000)'], correction: 'Depuis 2010 : −40 % de nouvelles infections et −54 % de décès (ONUSIDA/OMS, 2025).' },
    { consigne: 'De l\'incubation la plus courte à la plus longue', etapes: ['Herpès génital (environ 6 jours)', 'Hépatite B (4 à 8 semaines)', 'Hépatite C (8 à 12 semaines)'], correction: 'Herpès : 2 à 20 jours, 6 en moyenne. Hépatite B : 4 à 8 semaines. Hépatite C : 8 à 12 semaines.' }
  ];

  return { vih, bacteries, hepatites, ulceres, chiffres, consultation, vraiFaux, risque, ordre };
});
