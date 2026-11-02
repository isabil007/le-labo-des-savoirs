/*
 * ════════════════════════════════════════════════════════════════════
 *  LES EXTRAITS DU BLIND TEST (tablette uniquement)
 * ════════════════════════════════════════════════════════════════════
 *
 *  Le jeu ne contient aucune musique. Pour chaque chanson, la tablette
 *  demande à Apple (le service de recherche gratuit d'iTunes) l'extrait
 *  officiel de 30 secondes, puis le joue directement depuis les serveurs
 *  d'Apple. Rien n'est téléchargé ni enregistré.
 *
 *  La demande se fait par « JSONP » : on ajoute à la page un petit script
 *  dont l'adresse contient la recherche, et Apple répond en appelant une
 *  fonction de notre choix. C'est la méthode que propose Apple pour être
 *  interrogé directement depuis une page web.
 *
 *  Parmi les résultats, on garde celui dont l'artiste correspond vraiment
 *  (pour ne pas tomber sur une reprise par un inconnu), et qui a bien un
 *  extrait. Les réponses sont mémorisées : une chanson cherchée une fois
 *  n'est pas cherchée deux fois.
 *
 *  Les navigateurs (surtout sur iPad) n'acceptent de jouer un son qu'après
 *  un toucher d'écran : GT.extraits.debloquer() est appelé quand l'animateur
 *  touche « Lancer la partie », et on réutilise ensuite toujours le même
 *  lecteur.
 */
(function () {
  'use strict';
  window.GT = window.GT || {};

  let lecteur = null;
  let compteur = 0;
  const memoire = new Map(); // « artiste|titre » → { extrait, pochette, lien }

  const normaliser = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  /* Le mot le plus long d'un nom, sans « the » : « The Beatles » → « beatles ». */
  const motCle = (t) => normaliser(t).replace(/^the /, '').split(' ').sort((a, b) => b.length - a.length)[0] || '';

  /* Demande à Apple, en JSONP, les résultats d'une recherche. */
  function demanderApple(recherche) {
    return new Promise((resoudre, refuser) => {
      const nom = 'GT_itunes_' + (++compteur);
      const script = document.createElement('script');
      const fin = (erreur, donnees) => {
        clearTimeout(minuteur);
        delete window[nom];
        script.remove();
        erreur ? refuser(erreur) : resoudre(donnees);
      };
      const minuteur = setTimeout(() => fin(new Error('Apple ne répond pas')), 7000);
      window[nom] = (donnees) => fin(null, donnees);
      script.onerror = () => fin(new Error('Recherche impossible (Internet ?)'));
      script.src = 'https://itunes.apple.com/search?media=music&entity=song&limit=15&country=BE&term=' + encodeURIComponent(recherche) + '&callback=' + nom;
      document.head.appendChild(script);
    });
  }

  GT.extraits = {
    debloquer() {
      if (!lecteur) { lecteur = new Audio(); lecteur.preload = 'auto'; }
      // Un « son » vide d'un instant, pendant le toucher : le lecteur est ensuite autorisé pour la soirée.
      lecteur.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
      lecteur.play().then(() => lecteur.pause()).catch(() => {});
    },

    /* Trouve l'extrait d'une chanson ; renvoie { extrait, pochette, lien }. */
    async chercher(artiste, titre) {
      const cle = artiste + '|' + titre;
      if (memoire.has(cle)) return memoire.get(cle);
      const reponse = await demanderApple(artiste + ' ' + titre);
      const cleArtiste = motCle(artiste);
      const debutTitre = normaliser(titre).slice(0, 8);
      const candidats = (reponse.results || [])
        .filter((r) => r.previewUrl && normaliser(r.artistName).includes(cleArtiste))
        .map((r) => ({ r, note: normaliser(r.trackName).includes(debutTitre) ? 2 : 0 }))
        .sort((a, b) => b.note - a.note);
      if (!candidats.length) throw new Error('Extrait introuvable');
      const r = candidats[0].r;
      const trouve = { extrait: r.previewUrl, pochette: (r.artworkUrl100 || '').replace('100x100', '600x600'), lien: r.trackViewUrl || null };
      memoire.set(cle, trouve);
      return trouve;
    },

    /* Cherche puis joue l'extrait, en douceur (le son monte en une seconde). */
    async jouer(artiste, titre) {
      this.arreter();
      const trouve = await this.chercher(artiste, titre);
      if (!lecteur) lecteur = new Audio();
      lecteur.src = trouve.extrait;
      lecteur.volume = 0.2;
      await lecteur.play();
      let v = 0.2;
      const montee = setInterval(() => { v = Math.min(1, v + 0.1); if (lecteur) lecteur.volume = v; if (v >= 1) clearInterval(montee); }, 100);
      return trouve;
    },

    deja(artiste, titre) { return memoire.get(artiste + '|' + titre) || null; },

    arreter() { if (lecteur && !lecteur.paused) lecteur.pause(); }
  };
})();
