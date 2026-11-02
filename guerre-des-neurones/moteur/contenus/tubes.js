/*
 * ════════════════════════════════════════════════════════════════════
 *  LES TUBES DU BLIND TEST (de 1960 à aujourd'hui)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Cette liste ne contient AUCUNE musique : seulement le titre, l'artiste
 *  et l'année de sortie (des informations, pas des œuvres). Au moment de
 *  jouer, la tablette demande à Apple (le service gratuit de recherche
 *  d'iTunes) l'extrait officiel de 30 secondes de la chanson, et le joue
 *  directement depuis les serveurs d'Apple : rien n'est téléchargé ni
 *  copié dans le jeu. Il faut donc que la tablette ait accès à Internet.
 *
 *  Les extraits d'Apple sont faits pour faire découvrir la musique : le
 *  jeu est prévu pour jouer en famille, à la maison, pas pour une
 *  diffusion publique ou commerciale.
 *
 *  Pour ajouter un tube : une ligne { titre, artiste, annee }. Écrivez le
 *  titre et l'artiste comme sur iTunes, pour que la recherche le trouve.
 *  Jamais de paroles dans les questions.
 */
(function (racine, nom, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else { racine.GT = racine.GT || { modules: {} }; racine.GT.modules = racine.GT.modules || {}; racine.GT.modules[nom] = fabrique(); }
})(this, 'contenus/tubes', function () {
  'use strict';
  return [
    // Les années 60
    { titre: 'Hey Jude', artiste: 'The Beatles', annee: 1968 },
    { titre: '(I Can’t Get No) Satisfaction', artiste: 'The Rolling Stones', annee: 1965 },
    { titre: 'Poupée de cire, poupée de son', artiste: 'France Gall', annee: 1965 },
    { titre: 'Que je t’aime', artiste: 'Johnny Hallyday', annee: 1969 },
    { titre: 'Tous les garçons et les filles', artiste: 'Françoise Hardy', annee: 1962 },
    { titre: 'Respect', artiste: 'Aretha Franklin', annee: 1967 },
    { titre: 'Can’t Help Falling in Love', artiste: 'Elvis Presley', annee: 1961 },
    { titre: 'Good Vibrations', artiste: 'The Beach Boys', annee: 1966 },
    { titre: 'What a Wonderful World', artiste: 'Louis Armstrong', annee: 1967 },
    { titre: 'Les Champs-Élysées', artiste: 'Joe Dassin', annee: 1969 },
    { titre: 'Tombe la neige', artiste: 'Salvatore Adamo', annee: 1963 },
    { titre: 'These Boots Are Made for Walkin’', artiste: 'Nancy Sinatra', annee: 1966 },
    // Les années 70
    { titre: 'Dancing Queen', artiste: 'ABBA', annee: 1976 },
    { titre: 'Bohemian Rhapsody', artiste: 'Queen', annee: 1975 },
    { titre: 'Stayin’ Alive', artiste: 'Bee Gees', annee: 1977 },
    { titre: 'I Will Survive', artiste: 'Gloria Gaynor', annee: 1978 },
    { titre: 'Alexandrie Alexandra', artiste: 'Claude François', annee: 1978 },
    { titre: 'Ça plane pour moi', artiste: 'Plastic Bertrand', annee: 1977 },
    { titre: 'Y.M.C.A.', artiste: 'Village People', annee: 1978 },
    { titre: 'Superstition', artiste: 'Stevie Wonder', annee: 1972 },
    { titre: 'Your Song', artiste: 'Elton John', annee: 1970 },
    { titre: 'L’été indien', artiste: 'Joe Dassin', annee: 1975 },
    { titre: 'Rasputin', artiste: 'Boney M.', annee: 1978 },
    { titre: 'On ira tous au paradis', artiste: 'Michel Polnareff', annee: 1972 },
    { titre: 'Hotel California', artiste: 'Eagles', annee: 1976 },
    // Les années 80
    { titre: 'Billie Jean', artiste: 'Michael Jackson', annee: 1983 },
    { titre: 'Like a Virgin', artiste: 'Madonna', annee: 1984 },
    { titre: 'Take On Me', artiste: 'a-ha', annee: 1985 },
    { titre: 'Another One Bites the Dust', artiste: 'Queen', annee: 1980 },
    { titre: 'L’Aziza', artiste: 'Daniel Balavoine', annee: 1985 },
    { titre: 'Voyage, voyage', artiste: 'Desireless', annee: 1986 },
    { titre: 'L’aventurier', artiste: 'Indochine', annee: 1982 },
    { titre: 'Girls Just Want to Have Fun', artiste: 'Cyndi Lauper', annee: 1983 },
    { titre: 'I Wanna Dance with Somebody (Who Loves Me)', artiste: 'Whitney Houston', annee: 1987 },
    { titre: 'Les lacs du Connemara', artiste: 'Michel Sardou', annee: 1981 },
    { titre: 'The Final Countdown', artiste: 'Europe', annee: 1986 },
    { titre: 'Quand la musique est bonne', artiste: 'Jean-Jacques Goldman', annee: 1982 },
    { titre: 'Livin’ on a Prayer', artiste: 'Bon Jovi', annee: 1986 },
    // Les années 90
    { titre: 'Smells Like Teen Spirit', artiste: 'Nirvana', annee: 1991 },
    { titre: 'My Heart Will Go On', artiste: 'Céline Dion', annee: 1997 },
    { titre: 'Wannabe', artiste: 'Spice Girls', annee: 1996 },
    { titre: '...Baby One More Time', artiste: 'Britney Spears', annee: 1998 },
    { titre: 'I Want It That Way', artiste: 'Backstreet Boys', annee: 1999 },
    { titre: 'Livin’ la Vida Loca', artiste: 'Ricky Martin', annee: 1999 },
    { titre: 'No Limit', artiste: '2 Unlimited', annee: 1993 },
    { titre: 'Mambo No. 5', artiste: 'Lou Bega', annee: 1999 },
    { titre: 'Pour que tu m’aimes encore', artiste: 'Céline Dion', annee: 1995 },
    { titre: 'Save Tonight', artiste: 'Eagle-Eye Cherry', annee: 1997 },
    { titre: 'I Will Always Love You', artiste: 'Whitney Houston', annee: 1992 },
    { titre: 'Wonderwall', artiste: 'Oasis', annee: 1995 },
    // Les années 2000
    { titre: 'Hips Don’t Lie', artiste: 'Shakira', annee: 2006 },
    { titre: 'Crazy in Love', artiste: 'Beyoncé', annee: 2003 },
    { titre: 'Rehab', artiste: 'Amy Winehouse', annee: 2006 },
    { titre: 'I Gotta Feeling', artiste: 'The Black Eyed Peas', annee: 2009 },
    { titre: 'Poker Face', artiste: 'Lady Gaga', annee: 2008 },
    { titre: 'Viva la Vida', artiste: 'Coldplay', annee: 2008 },
    { titre: 'Hey Ya!', artiste: 'OutKast', annee: 2003 },
    { titre: 'Can’t Get You Out of My Head', artiste: 'Kylie Minogue', annee: 2001 },
    { titre: 'Désenchantée', artiste: 'Kate Ryan', annee: 2002 },
    { titre: 'One More Time', artiste: 'Daft Punk', annee: 2000 },
    { titre: 'Moi... Lolita', artiste: 'Alizée', annee: 2000 },
    { titre: 'Alors on danse', artiste: 'Stromae', annee: 2009 },
    // Les années 2010 et 2020
    { titre: 'Papaoutai', artiste: 'Stromae', annee: 2013 },
    { titre: 'Happy', artiste: 'Pharrell Williams', annee: 2013 },
    { titre: 'Rolling in the Deep', artiste: 'Adele', annee: 2010 },
    { titre: 'Shape of You', artiste: 'Ed Sheeran', annee: 2017 },
    { titre: 'Despacito', artiste: 'Luis Fonsi', annee: 2017 },
    { titre: 'Uptown Funk', artiste: 'Mark Ronson', annee: 2014 },
    { titre: 'Balance ton quoi', artiste: 'Angèle', annee: 2019 },
    { titre: 'Dernière danse', artiste: 'Indila', annee: 2013 },
    { titre: 'Je veux', artiste: 'Zaz', annee: 2010 },
    { titre: 'Get Lucky', artiste: 'Daft Punk', annee: 2013 },
    { titre: 'Levitating', artiste: 'Dua Lipa', annee: 2020 },
    { titre: 'Blinding Lights', artiste: 'The Weeknd', annee: 2019 },
    { titre: 'As It Was', artiste: 'Harry Styles', annee: 2022 },
    { titre: 'Flowers', artiste: 'Miley Cyrus', annee: 2023 },
    { titre: 'Djadja', artiste: 'Aya Nakamura', annee: 2018 },
    { titre: 'Somebody That I Used to Know', artiste: 'Gotye', annee: 2011 },
    { titre: 'Are You With Me', artiste: 'Lost Frequencies', annee: 2014 },
    { titre: 'Bruxelles je t’aime', artiste: 'Angèle', annee: 2021 },
    { titre: 'Stand by Me', artiste: 'Ben E. King', annee: 1961 },
    { titre: 'My Girl', artiste: 'The Temptations', annee: 1964 },
    { titre: 'La Bohème', artiste: 'Charles Aznavour', annee: 1965 },
    { titre: 'Aline', artiste: 'Christophe', annee: 1965 },
    { titre: 'Twist and Shout', artiste: 'The Beatles', annee: 1963 },
    { titre: 'I Got You Babe', artiste: 'Sonny & Cher', annee: 1965 },
    { titre: 'The House of the Rising Sun', artiste: 'The Animals', annee: 1964 },
    { titre: 'Le plat pays', artiste: 'Jacques Brel', annee: 1962 },
    { titre: 'California Dreamin’', artiste: 'The Mamas & the Papas', annee: 1965 },
    { titre: 'Il est cinq heures, Paris s’éveille', artiste: 'Jacques Dutronc', annee: 1968 },
    { titre: 'Le Sud', artiste: 'Nino Ferrer', annee: 1975 },
    { titre: 'Mamy Blue', artiste: 'Nicoletta', annee: 1971 },
    { titre: 'Waterloo', artiste: 'ABBA', annee: 1974 },
    { titre: 'Mamma Mia', artiste: 'ABBA', annee: 1975 },
    { titre: 'Le lundi au soleil', artiste: 'Claude François', annee: 1972 },
    { titre: 'Don’t Stop Me Now', artiste: 'Queen', annee: 1979 },
    { titre: 'September', artiste: 'Earth, Wind & Fire', annee: 1978 },
    { titre: 'Sugar Baby Love', artiste: 'The Rubettes', annee: 1974 },
    { titre: 'Daddy Cool', artiste: 'Boney M.', annee: 1976 },
    { titre: 'Thriller', artiste: 'Michael Jackson', annee: 1983 },
    { titre: 'Ella, elle l’a', artiste: 'France Gall', annee: 1987 },
    { titre: 'Je te donne', artiste: 'Jean-Jacques Goldman & Michael Jones', annee: 1985 },
    { titre: 'Sweet Dreams (Are Made of This)', artiste: 'Eurythmics', annee: 1983 },
    { titre: 'Wake Me Up Before You Go-Go', artiste: 'Wham!', annee: 1984 },
    { titre: 'Les démons de minuit', artiste: 'Images', annee: 1986 },
    { titre: 'Toute première fois', artiste: 'Jeanne Mas', annee: 1984 },
    { titre: 'Pump Up the Jam', artiste: 'Technotronic', annee: 1989 },
    { titre: 'Mon fils ma bataille', artiste: 'Daniel Balavoine', annee: 1980 },
    { titre: 'Zombie', artiste: 'The Cranberries', annee: 1994 },
    { titre: 'Barbie Girl', artiste: 'Aqua', annee: 1997 },
    { titre: 'Belle', artiste: 'Garou, Daniel Lavoie & Patrick Fiori', annee: 1998 },
    { titre: 'What Is Love', artiste: 'Haddaway', annee: 1993 },
    { titre: 'Torn', artiste: 'Natalie Imbruglia', annee: 1997 },
    { titre: 'Aïcha', artiste: 'Khaled', annee: 1996 },
    { titre: 'Umbrella', artiste: 'Rihanna', annee: 2007 },
    { titre: 'Seven Nation Army', artiste: 'The White Stripes', annee: 2003 },
    { titre: 'Mr. Brightside', artiste: 'The Killers', annee: 2004 },
    { titre: 'Sous le vent', artiste: 'Garou & Céline Dion', annee: 2001 },
    { titre: 'Femme Like U', artiste: 'K-Maro', annee: 2004 },
    { titre: 'Bad Romance', artiste: 'Lady Gaga', annee: 2009 },
    { titre: 'Crazy', artiste: 'Gnarls Barkley', annee: 2006 },
    { titre: 'Waka Waka (This Time for Africa)', artiste: 'Shakira', annee: 2010 },
    { titre: 'Let It Go', artiste: 'Idina Menzel', annee: 2013 },
    { titre: 'Tous les mêmes', artiste: 'Stromae', annee: 2013 },
    { titre: 'Formidable', artiste: 'Stromae', annee: 2013 },
    { titre: 'Tout oublier', artiste: 'Angèle', annee: 2018 },
    { titre: 'bad guy', artiste: 'Billie Eilish', annee: 2019 },
    { titre: 'Shake It Off', artiste: 'Taylor Swift', annee: 2014 },
    { titre: 'Dance Monkey', artiste: 'Tones and I', annee: 2019 },
    { titre: 'Calm Down', artiste: 'Rema', annee: 2022 },
    { titre: 'Tattoo', artiste: 'Loreen', annee: 2023 },
    { titre: 'Santé', artiste: 'Stromae', annee: 2021 },
    { titre: 'Reality', artiste: 'Lost Frequencies', annee: 2015 }
  ];
});
