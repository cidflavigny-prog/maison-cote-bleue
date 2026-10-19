// Rend un visuel du studio en PNG, sans écran, pour les routines.
// Usage : node rendu.mjs <studio.html> <post.json> <meteo.json ou -> <sortie.png> [dossier-photos]
// Carrousel : écrit <sortie>-1.png, <sortie>-2.png… (une image par slide).
// Photos : un post dont photoId vaut « abc » prend le fichier abc.jpg / abc.png du dossier-photos.
// Sort en erreur si les polices Fredoka / Nunito ne se chargent pas (visuel non conforme).
import fs from 'fs';
import path from 'path';

const [html, postFile, meteoFile, out, photoDir] = process.argv.slice(2);
if (!out) { console.error('Usage : node rendu.mjs <studio.html> <post.json> <meteo.json|-> <sortie.png> [dossier-photos]'); process.exit(2); }

let pw;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs']) {
  try { pw = await import(p); break; } catch {}
}
if (!pw) { console.error('Playwright introuvable'); process.exit(1); }
const { chromium } = pw;

const post = JSON.parse(fs.readFileSync(postFile, 'utf8'));
const meteo = meteoFile && meteoFile !== '-' ? JSON.parse(fs.readFileSync(meteoFile, 'utf8')) : null;
const page0 = '<!doctype html><html><head><meta charset=utf-8></head><body>' + fs.readFileSync(html, 'utf8') + '</body></html>';

const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined })
  .catch(() => chromium.launch());
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
p.on('pageerror', e => console.error('Erreur page :', e.message));
await p.route('https://studio.local/**', route => {
  const u = new URL(route.request().url());
  if (u.pathname.startsWith('/_blob/') && photoDir) {
    const id = u.pathname.slice(7);
    const f = fs.readdirSync(photoDir).find(n => n.startsWith(id + '.'));
    if (f) return route.fulfill({ path: path.join(photoDir, f) });
  }
  if (u.pathname === '/') return route.fulfill({ contentType: 'text/html', body: page0 });
  return route.fulfill({ status: 404, body: '' });
});
await p.goto('https://studio.local/', { waitUntil: 'networkidle' });
const fonts = await p.evaluate(async () => {
  const f = ['600 100px Fredoka', '500 100px Fredoka', '800 40px Nunito', '700 40px Nunito', '600 40px Nunito', '400 40px Nunito'];
  await Promise.all(f.map(x => document.fonts.load(x)));
  return f.every(x => document.fonts.check(x));
});
if (!fonts) { console.error('Polices non chargées (fonts.googleapis.com / fonts.gstatic.com)'); await b.close(); process.exit(1); }

const n = await p.evaluate(P => window.MCBSlides(P), post);
const files = [];
for (let i = 0; i < n; i++) {
  // Premier rendu : lance le chargement des photos ; le second les dessine.
  await p.evaluate(([P, M, s]) => window.MCBRendu(P, M, s), [post, meteo, i]);
  await p.waitForTimeout(400);
  const url = await p.evaluate(([P, M, s]) => window.MCBRendu(P, M, s), [post, meteo, i]);
  const f = n > 1 ? out.replace(/\.png$/, '') + '-' + (i + 1) + '.png' : out;
  fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
  files.push(f);
}
await b.close();
console.log(files.join('\n'));
