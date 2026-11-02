/*
 * ════════════════════════════════════════════════════════════════════
 *  LES MINI-JEUX À QUESTIONS (tous bâtis sur le moule JeuQCM)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Chaque mini-jeu tire quelques questions dans un bloc du support
 *  théorique (moteur/contenus/questions.js) et règle son rythme : temps
 *  pour répondre, temps de lecture de la correction, points.
 *
 *  La correction s'affiche sur la tablette après chaque question, et
 *  le téléphone de ceux qui se sont trompés la reprend aussi. Tout est
 *  noté pour le corrigé de fin de partie.
 *
 *  Pour créer un nouveau jeu : copiez un bloc « fabriquer({...}) »,
 *  changez la fiche et le bloc de questions, puis ajoutez son « id »
 *  dans la liste ORDRE de moteur.js.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique(require);
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(function (c) { return racine.GT.modules[c.replace(/^(\.\.?\/)+/, '')]; }); }
})(this, 'jeux/quiz', function (exiger) {
  'use strict';
  const outils = exiger('../outils');
  const { JeuQCM } = exiger('../jeux/base');
  const Q = exiger('../contenus/questions');
  const A = exiger('../contenus/activites');
  const H = exiger('../contenus/histoire');
  const S = exiger('../contenus/supplement'); // élargit les banques ci-dessus et ajoute deux thèmes

  /* Un jeu « QCM classique » : un bloc, un nombre de questions, une fiche. */
  function fabriquer(reglages) {
    class JeuTheme extends JeuQCM {
      constructor(ctx) {
        const banque = typeof reglages.banque === 'function' ? reglages.banque() : reglages.banque;
        super(ctx, Object.assign({}, reglages.rythme, { questions: outils.tirerFrais(banque, reglages.nombre) }));
      }
      vueTablette(q) { return { intitule: q.question, surtitre: q.theme }; }
      explication(q) { return { titre: q.chute || reglages.titreCorrection || 'La correction', texte: q.correction }; }
      consigneJoueur() { return reglages.consigne || 'Choisis ta réponse'; }
    }
    JeuTheme.fiche = reglages.fiche;
    return JeuTheme;
  }

  /* Un jeu dont les fiches fabriquent elles-mêmes leurs réponses (ordre fixe, q.bonne déjà placé). */
  function fabriquerFixe(reglages) {
    class JeuFixe extends JeuQCM {
      constructor(ctx) {
        super(ctx, Object.assign({}, reglages.rythme, { questions: outils.tirerFrais(reglages.banque, reglages.nombre).map((a) => Object.assign(reglages.preparer(a), { _cle: outils.cle(a) })), fixe: true }));
      }
      vueTablette(q) { return { intitule: q.question, surtitre: q.theme }; }
      consigneJoueur() { return reglages.consigne; }
      explication(q) { return { titre: q.titre || 'La correction', texte: q.correction }; }
      intituleCorrige(q) { return q.theme + ' — ' + q.question; }
    }
    JeuFixe.fiche = reglages.fiche;
    return JeuFixe;
  }

  const FEUX = ['🔴 Rouge · j\'oriente vite', '🟠 Orange · j\'approfondis', '🟢 Vert · je conseille'];

  /* Un jeu à réponses fixes : Vrai / Faux, Risque / Pas de risque. */
  function fabriquerBinaire(reglages) {
    class JeuBinaire extends JeuQCM {
      constructor(ctx) {
        const questions = outils.tirerFrais(reglages.banque, reglages.nombre).map((a) => ({
          _cle: outils.cle(a), question: a.texte, theme: a.infection, choix: reglages.etiquettes.slice(), bonne: a.vrai ? 0 : 1, correction: a.correction
        }));
        super(ctx, Object.assign({}, reglages.rythme, { questions, fixe: true }));
      }
      vueTablette(q) { return { intitule: q.question, surtitre: reglages.surtitre(q) }; }
      consigneJoueur() { return reglages.consigne; }
      explication(q) { return { titre: q.choix[q.bonne] + ' !', texte: q.correction }; }
      intituleCorrige(q) { return reglages.surtitre(q) + ' — ' + q.question; }
    }
    JeuBinaire.fiche = reglages.fiche;
    return JeuBinaire;
  }

  const normal = { dureeMs: 20000, revelationMs: 10000 };
  const long = { dureeMs: 25000, revelationMs: 12000, pointsBase: 600, bonusVitesse: 400 };
  const eclair = { dureeMs: 12000, revelationMs: 8000, pointsBase: 400, bonusVitesse: 400 };

  const jeux = [
    fabriquerFixe({
      banque: A.thermometre, nombre: 8, rythme: { dureeMs: 15000, revelationMs: 10000, pointsBase: 500, bonusVitesse: 300, pointsNeutre: 100 },
      consigne: 'Vrai, faux… ou je ne sais pas ?',
      preparer: (a) => ({ theme: 'Le thermomètre', question: a.texte, choix: ['Vrai', 'Je ne sais pas', 'Faux'], bonne: a.vrai ? 0 : 2, neutre: 1, titre: (a.vrai ? 'Vrai' : 'Faux') + ' !', correction: a.correction }),
      fiche: { id: 'thermometre', nom: 'Le thermomètre', icone: '🌡️', resume: 'Les idées reçues : vrai, faux, ou « je ne sais pas » (c\'est permis).', regle: 'Une affirmation : Vrai, Faux ou Je ne sais pas. Répondre « Je ne sais pas » rapporte 100 points : mieux vaut l\'honnêteté qu\'un coup de chance. L\'écran montre comment la classe s\'est répartie.' }
    }),
    fabriquer({
      banque: Q.vih, nombre: 8, rythme: normal,
      fiche: { id: 'vih', nom: 'Le VIH de A à Z', icone: '🔬', resume: 'Le virus, la transmission, l\'évolution, le traitement.', regle: 'Lisez la question sur la tablette et touchez la bonne couleur sur votre téléphone. Plus vous êtes rapide, plus vous gagnez de points.' }
    }),
    fabriquerBinaire({
      banque: Q.vraiFaux, nombre: 8, rythme: eclair, etiquettes: ['Vrai', 'Faux'],
      surtitre: () => 'Vrai ou faux ?', consigne: 'Vrai ou faux ?',
      fiche: { id: 'vrai-faux', nom: 'Vrai ou faux ?', icone: '✅', resume: 'Les idées reçues passées au crible, en version éclair.', regle: 'Une affirmation, deux touches, 12 secondes. Méfiez-vous des idées reçues !' }
    }),
    fabriquer({
      banque: Q.bacteries, nombre: 7, rythme: normal,
      fiche: { id: 'bacteries', nom: 'Les IST bactériennes', icone: '🦠', resume: 'Chlamydia, gonorrhée, urétrite, cervicite, syphilis.', regle: 'Clinique, dépistage, traitement : touchez la bonne réponse le plus vite possible.' }
    }),
    fabriquerBinaire({
      banque: Q.risque, nombre: 8, rythme: eclair, etiquettes: ['Risque', 'Pas de risque'],
      surtitre: (q) => ({ 'VIH': 'Risque de VIH ?', 'HPV': 'Risque de HPV ?', 'Syphilis': 'Risque de syphilis ?', 'Hépatite A': 'Risque d\'hépatite A ?', 'Hépatite C': 'Risque d\'hépatite C ?' })[q.theme] || 'Y a-t-il un risque ?', consigne: 'Y a-t-il un risque ?',
      fiche: { id: 'risque', nom: 'Risque ou pas ?', icone: '🚦', resume: 'Une situation de la vie courante : y a-t-il un risque de transmission ?', regle: 'La tablette décrit une situation. Risque ou pas de risque ? Vous avez 12 secondes.' }
    }),
    fabriquer({
      banque: Q.hepatites, nombre: 6, rythme: normal,
      fiche: { id: 'hepatites', nom: 'Les hépatites A, B, C', icone: '🧪', resume: 'Trois virus, trois transmissions, trois évolutions.', regle: 'Transmission, chronicité, prévention : ne confondez pas les lettres !' }
    }),
    fabriquer({
      banque: Q.ulceres, nombre: 7, rythme: normal,
      fiche: { id: 'hpv', nom: 'Herpès, HPV et vaccins', icone: '💉', resume: 'Ulcères génitaux, papillomavirus, dépistage et vaccination.', regle: 'Lisez la question sur la tablette et répondez sur votre téléphone.' }
    }),
    fabriquer({
      banque: Q.chiffres, nombre: 6, rythme: normal,
      fiche: { id: 'chiffres', nom: 'Le juste chiffre', icone: '📊', resume: 'L\'épidémie dans le monde et en Belgique, en chiffres 2024.', regle: 'Des millions, des milliers, des pourcentages : trouvez le bon ordre de grandeur !' }
    }),
    fabriquer({
      banque: Q.consultation, nombre: 6, rythme: long,
      fiche: { id: 'consultation', nom: 'En consultation', icone: '🩺', resume: 'Des cas pratiques : counselling, dépistage, partenaires.', regle: 'Un patient, une situation. Que faites-vous ? Un peu plus de temps pour lire : 25 secondes.' }
    }),
    fabriquer({
      banque: () => [].concat(Q.vih, Q.bacteries, Q.hepatites, Q.ulceres, Q.chiffres, Q.consultation), nombre: 8, rythme: normal,
      fiche: { id: 'melange', nom: 'Le grand mélange', icone: '🔀', resume: 'Toutes les parties du cours, au hasard.', regle: 'VIH, IST, hépatites, chiffres, consultation : tout peut tomber !' }
    }),
    fabriquerFixe({
      banque: A.feu, nombre: 6, rythme: { dureeMs: 25000, revelationMs: 12000, pointsBase: 600, bonusVitesse: 400 },
      consigne: 'Quel carton lèves-tu ?',
      preparer: (a) => ({ theme: 'Feu vert, orange, rouge', question: a.texte, choix: FEUX.slice(), bonne: 2 - a.feu, titre: FEUX[2 - a.feu], correction: a.correction }),
      fiche: { id: 'feu', nom: 'Feu vert, orange, rouge', icone: '🚥', resume: 'Une situation : je conseille, j\'approfondis ou j\'oriente vite ?', regle: 'Lisez la situation. Vert : je conseille. Orange : j\'approfondis. Rouge : j\'oriente vite. Ensuite, la correction donne la première action.' }
    }),
    fabriquerFixe({
      banque: A.marche, nombre: 8, rythme: { dureeMs: 15000, revelationMs: 9000, pointsBase: 500, bonusVitesse: 400 },
      consigne: 'À quelle IST appartient cette carte ?',
      preparer: (a) => {
        const autres = outils.melanger(A.LES_IST.filter((x) => x !== a.ist)).slice(0, a.ist === 'piege' ? 3 : 2);
        const ist = outils.melanger(a.ist === 'piege' ? autres : [a.ist].concat(autres));
        const choix = ist.concat(['🃏 Carte piège']);
        return { theme: 'Le marché des IST', question: '« ' + a.carte + ' »', choix, bonne: a.ist === 'piege' ? 3 : choix.indexOf(a.ist), titre: a.ist === 'piege' ? 'Carte piège !' : a.ist, correction: a.correction };
      },
      fiche: { id: 'marche', nom: 'Le marché des IST', icone: '🃏', resume: 'Une carte, une IST… et des cartes pièges, fausses ou trop générales.', regle: 'Une carte apparaît : transmission, signe, dépistage, prévention… À quelle IST la rattacher ? Attention aux cartes pièges !' }
    }),
    fabriquer({
      banque: A.orientation, nombre: 6, rythme: { dureeMs: 20000, revelationMs: 10000 },
      consigne: 'Vers qui orienter ?',
      fiche: { id: 'orientation', nom: 'Vers qui orienter ?', icone: '🧭', resume: 'Une situation, une ressource liégeoise : CPVS, Centre S, CHU, planning…', regle: 'Une situation à l\'écran : vers quelle ressource orientez-vous la personne ?' }
    }),
    fabriquer({
      banque: A.betisier, nombre: 6, rythme: { dureeMs: 20000, revelationMs: 11000, pointsBase: 600, bonusVitesse: 400 },
      consigne: 'Une seule réponse est sérieuse…',
      fiche: { id: 'betisier', nom: 'Les fausses bonnes idées', icone: '🤪', resume: 'Pour finir en riant : des réponses absurdes, une seule sérieuse.', regle: 'Trois réponses absurdes, une seule sérieuse. Riez, puis trouvez la bonne !' }
    }),
    fabriquer({
      banque: S.prevention, nombre: 6, rythme: normal,
      fiche: { id: 'prevention', nom: 'La prévention combinée', icone: '🛡️', resume: 'PrEP, TPE, préservatifs, vaccins, dépistage : la boîte à outils.', regle: 'Une question sur les outils de prévention : lequel, quand, pour qui ?' }
    }),
    fabriquer({
      banque: S.meconnues, nombre: 6, rythme: normal,
      fiche: { id: 'meconnues', nom: 'Les IST méconnues', icone: '🔎', resume: 'Trichomonas, Mycoplasma, LGV, mpox, gale… celles dont on parle moins.', regle: 'Les IST plus rares ou oubliées : reconnaître, traiter, orienter.' }
    }),
    fabriquer({
      banque: H.quiz, nombre: 7, rythme: { dureeMs: 20000, revelationMs: 11000 }, titreCorrection: 'Le saviez-vous ?',
      consigne: 'Le saviez-vous ?',
      fiche: { id: 'histoire', nom: 'Le saviez-vous ?', icone: '📜', resume: 'Cinq siècles d\'IST : de Naples en 1495 à I = I, des faits qui marquent.', regle: 'Une date, un fait historique : trouvez la bonne réponse. La suite de l\'histoire s\'affiche avec la correction.' }
    })
  ];

  /*
   * LE TOURBILLON — le mode aléatoire.
   * Il demande à chaque jeu à questions de préparer quelques questions
   * (avec leurs réponses, leur étiquette et leur correction), puis en tire
   * six, toutes de jeux différents : une question du thermomètre, puis une
   * date d'IST’ORY, puis une carte du marché… question après question.
   */
  class Tourbillon extends JeuQCM {
    constructor(ctx) {
      const reserve = [];
      jeux.forEach((C) => {
        if (C.fiche.id === 'melange') return;
        const modele = new C({ joueurs: () => [] });
        modele.questions.forEach((q) => reserve.push(Object.assign({}, q, {
          _fiche: C.fiche, _vue: modele.vueTablette(q), _ex: modele.explication(q),
          _corr: modele.intituleCorrige(q), _cons: modele.consigneJoueur(q)
        })));
      });
      // Six questions, six jeux différents.
      const vus = new Set();
      // Les questions jamais posées d'abord (puis les plus anciennes), une par jeu.
      const fraiches = outils.melanger(reserve).sort((a, b) => outils.ancienneteVue(a) - outils.ancienneteVue(b));
      const choisies = fraiches.filter((q) => (vus.has(q._fiche.id) ? false : vus.add(q._fiche.id))).slice(0, 6);
      super(ctx, { questions: choisies, fixe: true, dureeMs: 22000, revelationMs: 11000, pointsBase: 500, bonusVitesse: 500, pointsNeutre: 100 });
    }
    vueTablette(q) { return { intitule: q._vue.intitule, surtitre: q._fiche.icone + ' ' + q._fiche.nom }; }
    consigneJoueur(q) { return q._cons; }
    explication(q) { return q._ex; }
    intituleCorrige(q) { return q._fiche.nom + ' — ' + q._corr; }
  }
  Tourbillon.fiche = {
    id: 'tourbillon', nom: 'Le tourbillon', icone: '🎲',
    resume: 'Toutes les familles mélangées : chaque question vient d\'un jeu différent.',
    regle: 'Une question du thermomètre, puis une date d\'IST’ORY, puis une carte du marché… Chaque question change de jeu : restez attentifs à l\'étiquette !'
  };

  return jeux.concat([Tourbillon]);
});
