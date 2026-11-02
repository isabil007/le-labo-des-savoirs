/*
 * ════════════════════════════════════════════════════════════════════
 *  LA PORTE — un code d'accès, qu'on active ou non
 * ════════════════════════════════════════════════════════════════════
 *
 *  Chaque jeu en ligne peut devenir PRIVÉ : il faut alors taper un code
 *  d'accès avant d'entrer. Deux réglages, dans les variables
 *  d'environnement du service (sur Render : « Environment ») :
 *
 *    ACCES_PRIVE = oui   → le jeu demande le code (non → ouvert à tous)
 *    CODE_ACCES  = …     → le code à taper (majuscules et minuscules confondues)
 *
 *  Une fois le bon code tapé, le navigateur s'en souvient 30 jours
 *  (un « cookie » signé) : on ne le retape pas à chaque partie. Changer
 *  le code met tout le monde dehors. Un lien peut aussi contenir le code
 *  (…?acces=LECODE) : pratique pour un QR code imprimé et distribué.
 *
 *  Le verrou protège tout : les pages, les fichiers ET la ligne en direct
 *  (WebSocket), pour qu'on ne puisse pas le contourner. Restent ouvertes
 *  seulement les adresses de santé (pour l'hébergeur) et /api/acces, qui
 *  dit seulement si le jeu est privé (pour le cadenas de Neuro'Mania).
 *  Après 10 essais ratés en 10 minutes, une adresse doit patienter.
 *  Aucune dépendance : seulement les modules livrés avec Node.
 */
'use strict';
const crypto = require('crypto');

const OUVERTES = new Set(['/sante', '/api/catalogue', '/api/acces']);
const NOM_COOKIE = 'neuromania_acces';
const DUREE = 30 * 24 * 3600; // 30 jours, en secondes

function reglages() {
  const code = String(process.env.CODE_ACCES || '').trim();
  const prive = /^(oui|yes|true|1|on|vrai)$/i.test(String(process.env.ACCES_PRIVE || '').trim()) && code.length > 0;
  return { prive, code };
}
const empreinte = (texte) => crypto.createHash('sha256').update('neuromania|' + texte).digest();
const jeton = (code) => crypto.createHmac('sha256', empreinte(code.toUpperCase())).update('entree-autorisee').digest('hex');
function egal(a, b) {
  const x = empreinte(String(a)), y = empreinte(String(b));
  return crypto.timingSafeEqual(x, y);
}
function lireCookie(req) {
  const m = new RegExp('(?:^|;\\s*)' + NOM_COOKIE + '=([a-f0-9]{64})').exec(String(req.headers.cookie || ''));
  return m ? m[1] : null;
}

/* Ce visiteur a-t-il le droit d'entrer ? (toujours oui quand le jeu est ouvert) */
function autorise(req) {
  const { prive, code } = reglages();
  if (!prive) return true;
  const c = lireCookie(req);
  return !!c && egal(c, jeton(code));
}

/* Les essais ratés, par adresse : au-delà de 10 en 10 minutes, on fait patienter. */
const essais = new Map();
function ip(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(); }
function bloque(req) {
  const e = essais.get(ip(req));
  if (!e) return false;
  if (Date.now() - e.depuis > 10 * 60 * 1000) { essais.delete(ip(req)); return false; }
  return e.n >= 10;
}
function rate(req) {
  const cle = ip(req), e = essais.get(cle);
  if (!e || Date.now() - e.depuis > 10 * 60 * 1000) essais.set(cle, { n: 1, depuis: Date.now() });
  else e.n++;
}
setInterval(() => { const t = Date.now(); essais.forEach((e, k) => { if (t - e.depuis > 10 * 60 * 1000) essais.delete(k); }); }, 60 * 1000).unref();

function poserCookie(req, res, code, suite) {
  const secure = String(req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  res.writeHead(303, {
    'Set-Cookie': NOM_COOKIE + '=' + jeton(code) + '; Max-Age=' + DUREE + '; Path=/; HttpOnly; SameSite=Lax' + secure,
    Location: suite, 'Cache-Control': 'no-store'
  });
  res.end();
}
const suiteSure = (s) => (typeof s === 'string' && /^\/(?![\/\\])[^\s]*$/.test(s) ? s : '/');
const echapper = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* La page « porte fermée », où l'on tape le code. */
function pagePorte(res, nomJeu, suite, message, statut) {
  res.writeHead(statut || 401, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
  res.end(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${echapper(nomJeu)} · accès privé</title><meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lilita+One&display=swap">
<style>
:root{--nuit:#120F2E;--nuit-2:#1C1844;--trait:#3B3580;--papier:#F5F3FF;--brume:#B3ADDF;--rose:#FF5FA2;--tournesol:#FFC93C;--cyan:#3DE0F0;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--nuit);color:var(--papier);font:18px/1.5 "Atkinson Hyperlegible","Segoe UI",system-ui,sans-serif;padding:24px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px))}
main{width:min(440px,100%);min-width:0;display:grid;gap:18px;padding:32px 26px;border-radius:26px;background:var(--nuit-2);border:1px solid var(--trait);text-align:center}
.cadenas{font-size:3.2rem;line-height:1}h1{margin:0;font:400 clamp(1.8rem,7vw,2.4rem)/1.05 "Lilita One","Arial Rounded MT Bold",system-ui,sans-serif;text-wrap:balance}
p{margin:0;color:var(--brume)}form{display:grid;gap:12px;min-width:0}input,button{width:100%;min-width:0}
input{min-height:56px;padding:12px 16px;border-radius:16px;border:2px solid var(--trait);background:var(--nuit);color:var(--papier);font:700 1.4rem "Atkinson Hyperlegible",system-ui,sans-serif;text-align:center;letter-spacing:.12em;text-transform:uppercase}
input:focus{outline:none;border-color:var(--cyan)}button{min-height:56px;border:0;border-radius:16px;background:var(--tournesol);color:var(--nuit);font:400 1.3rem "Lilita One",system-ui,sans-serif;cursor:pointer}
.erreur{color:#FF8A8A;font-weight:700}a{color:var(--brume)}
</style></head><body><main>
<div class="cadenas" aria-hidden="true">🔒</div>
<h1>${echapper(nomJeu)}</h1>
<p>Ce jeu est privé. Tapez le code d'accès que l'on vous a donné.</p>
${message ? `<p class="erreur" role="alert">${echapper(message)}</p>` : ''}
<form method="post" action="/entree">
<input type="hidden" name="suite" value="${echapper(suite)}">
<label for="code" class="sr" style="position:absolute;left:-9999px">Code d'accès</label>
<input id="code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" required autofocus placeholder="CODE" maxlength="40">
<button type="submit">Entrer</button>
</form>
<p><small>Une fois entré, ce téléphone s'en souvient pendant 30 jours.</small></p>
${process.env.PORTAIL ? `<p><a href="${echapper(String(process.env.PORTAIL).split('#')[0])}">← Retour à Neuro'Mania</a></p>` : ''}
</main></body></html>`);
}

/*
 * À appeler au tout début de chaque requête web. Renvoie true si la
 * porte s'est occupée de la réponse (page du code, entrée, refus) :
 * le serveur du jeu n'a alors plus rien à faire.
 */
function filtrer(req, res, nomJeu) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/acces') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ prive: reglages().prive }));
    return true;
  }
  const { prive, code } = reglages();
  if (!prive || OUVERTES.has(url.pathname)) return false;

  // Le formulaire de la porte.
  if (url.pathname === '/entree' && req.method === 'POST') {
    let corps = '';
    req.on('data', (b) => { corps += b; if (corps.length > 2000) req.destroy(); });
    req.on('end', () => {
      const champs = new URLSearchParams(corps);
      const suite = suiteSure(champs.get('suite'));
      if (bloque(req)) return pagePorte(res, nomJeu, suite, 'Trop d\'essais. Patientez une dizaine de minutes.', 429);
      if (egal(String(champs.get('code') || '').trim().toUpperCase(), code.toUpperCase())) return poserCookie(req, res, code, suite);
      rate(req);
      setTimeout(() => pagePorte(res, nomJeu, suite, 'Ce code n\'est pas le bon. Vérifiez et réessayez.'), 600);
    });
    return true;
  }
  // Un lien qui contient déjà le code (…?acces=LECODE) : on entre directement, puis on retire le code de l'adresse.
  if (url.searchParams.has('acces')) {
    const propose = String(url.searchParams.get('acces') || '').trim().toUpperCase();
    url.searchParams.delete('acces');
    const suite = suiteSure(url.pathname + (url.searchParams.toString() ? '?' + url.searchParams : ''));
    if (!bloque(req) && egal(propose, code.toUpperCase())) { poserCookie(req, res, code, suite); return true; }
    rate(req);
  }
  if (autorise(req)) return false;

  // Pas encore entré : une page affiche la porte, un fichier est simplement refusé.
  const estPage = req.method === 'GET' && !/\.(js|css|png|jpe?g|svg|ico|json|mp3|webmanifest)$/i.test(url.pathname);
  if (estPage) pagePorte(res, nomJeu, suiteSure(url.pathname + url.search));
  else { res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end('Accès privé.'); }
  return true;
}

module.exports = { filtrer, autorise, reglages };
