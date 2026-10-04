// Capture the real CHUV research page: screenshots, element crops, three real interactions, logo, fonts.
// node films/chuv-research/capture.mjs  -> assets/ + assets/capture.json (boxes in CSS px of each shot)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const A = join(HERE, 'assets');
const ORIGIN = 'https://www.chuv.ch';
const PAGE = ORIGIN + '/fr/recherche-et-innovation/la-recherche-au-chuv';
for (const d of ['shots', 'ui', 'brand', 'fonts', 'photos']) mkdirSync(join(A, d), { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const manifest = { source: PAGE, capturedAt: new Date().toISOString(), shots: {}, ui: {}, actions: {} };
const box = async (loc) => { const b = await loc.boundingBox(); return b && [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 10) / 10); };
const settle = (p, ms = 900) => p.waitForTimeout(ms); // capture only: lets the site's own transitions finish

async function open(kind) {
  const ctx = kind === 'mobile'
    ? await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'fr-CH' })
    : await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'fr-CH' });
  const p = await ctx.newPage();
  await p.goto(PAGE, { waitUntil: 'networkidle', timeout: 90000 });
  await settle(p);
  return p;
}

// Element crop with its box in page coordinates (CSS px) so the film can put it back where it lives.
async function crop(p, name, loc) {
  loc = loc.first();
  await loc.scrollIntoViewIfNeeded(); await settle(p, 400);
  const scroll = await p.evaluate(() => window.scrollY);
  const b = await box(loc);
  await loc.screenshot({ path: join(A, 'ui', `${name}.png`) });
  manifest.ui[name] = { file: `ui/${name}.png`, box: [b[0], b[1] + scroll, b[2], b[3]] };
}

// ---------------- mobile (9:16 primary) ----------------
{
  const p = await open('mobile');
  await p.screenshot({ path: join(A, 'shots', 'mobile-top.png') });
  manifest.shots['mobile-top'] = { file: 'shots/mobile-top.png', viewport: [390, 844], dpr: 3 };

  // Count the key figures up before the full-page shot, so they read 800 / 600, not 0.
  const figures = p.locator('ul.key-figures');
  await figures.scrollIntoViewIfNeeded(); await settle(p, 4000);
  await p.evaluate(() => window.scrollTo(0, 0)); await settle(p);
  await p.screenshot({ path: join(A, 'shots', 'mobile-full.png'), fullPage: true });
  manifest.shots['mobile-full'] = { file: 'shots/mobile-full.png', viewport: [390, 844], dpr: 3, height: await p.evaluate(() => document.documentElement.scrollHeight) };

  await crop(p, 'm-header', p.locator('header').first());
  await crop(p, 'm-logo', p.locator('a.navbar-brand').first());
  await crop(p, 'm-burger', p.locator('button.burger-navbar-toggler'));
  await crop(p, 'm-urgences', p.locator('a.btn-emergency'));
  await crop(p, 'm-h1', p.locator('h1').first());
  await crop(p, 'm-intro', p.locator('p', { hasText: 'La recherche fait partie des trois missions' }).first());
  await crop(p, 'm-figure-800', p.locator('li.key-figure').nth(0));
  await crop(p, 'm-figure-600', p.locator('li.key-figure').nth(1));
  await crop(p, 'm-figures-h2', p.locator('h2', { hasText: 'Projets de recherche' }));
  await crop(p, 'm-soutiens-h2', p.locator('h2', { hasText: 'Soutiens à la recherche' }));
  await crop(p, 'm-actualites-h2', p.locator('h2', { hasText: 'Actualités' }));
  manifest.figures = await p.$$eval('li.key-figure', (li) => li.map((l) => ({ value: +l.querySelector('.key-value').dataset.to, label: l.querySelector('.suffix').innerText.trim() })));

  // Action 1: open the menu (tap the cyan burger).
  await p.evaluate(() => window.scrollTo(0, 0)); await settle(p);
  const burger = p.locator('button.burger-navbar-toggler');
  manifest.actions.menu = { before: 'shots/m-menu-before.png', target: await box(burger) };
  await p.screenshot({ path: join(A, manifest.actions.menu.before) });
  await burger.tap(); await settle(p, 1200);
  manifest.actions.menu.after = 'shots/m-menu-after.png';
  await p.screenshot({ path: join(A, manifest.actions.menu.after) });
  manifest.actions.menu.label = await p.evaluate(() => [...document.querySelectorAll('nav a, nav button')].filter((e) => e.getBoundingClientRect().height > 0).map((e) => e.innerText.trim()).filter(Boolean).slice(0, 14));
  const close = p.getByRole('button', { name: /fermer/i }).first();
  if (await close.count()) { await close.tap(); await settle(p); } else await p.goto(PAGE, { waitUntil: 'networkidle' });

  await p.context().close();
}

// ---------------- desktop (16:9 / 1:1 support) ----------------
{
  const p = await open('desktop');
  await p.screenshot({ path: join(A, 'shots', 'desktop-top.png') });
  manifest.shots['desktop-top'] = { file: 'shots/desktop-top.png', viewport: [1440, 900], dpr: 2 };
  await p.locator('ul.key-figures').scrollIntoViewIfNeeded(); await settle(p, 4000);
  await p.evaluate(() => window.scrollTo(0, 0)); await settle(p);
  await p.screenshot({ path: join(A, 'shots', 'desktop-full.png'), fullPage: true });
  manifest.shots['desktop-full'] = { file: 'shots/desktop-full.png', viewport: [1440, 900], dpr: 2 };
  await crop(p, 'd-nav-main', p.locator('a', { hasText: 'Recherche et innovation' }).first());
  await crop(p, 'd-figures', p.locator('ul.key-figures'));
  await crop(p, 'd-soutiens-cards', p.locator('ul.list-of-links', { hasText: 'Essais cliniques' }));

  // Real mouse actions: before, hover (the site's own hover state), after. Boxes are viewport CSS px.
  async function act(name, loc, { scrollTo, wait = 1300, nav = false } = {}) {
    loc = loc.first();
    if (scrollTo) { await scrollTo.first().scrollIntoViewIfNeeded(); await p.mouse.wheel(0, -160); await settle(p); }
    else { await p.evaluate(() => window.scrollTo(0, 0)); await settle(p); }
    await p.mouse.move(720, 450); await settle(p, 300);
    const a = (manifest.actions[name] = { target: await box(loc) });
    a.before = `shots/d-${name}-before.png`; await p.screenshot({ path: join(A, a.before) });
    await loc.hover(); await settle(p, 500);
    a.hover = `shots/d-${name}-hover.png`; await p.screenshot({ path: join(A, a.hover) });
    if (nav) await Promise.all([p.waitForLoadState('networkidle'), loc.click()]); else await loc.click();
    await settle(p, wait);
    a.after = `shots/d-${name}-after.png`; await p.screenshot({ path: join(A, a.after) });
    a.url = p.url();
    return a;
  }
  const menu = await act('menu', p.locator('header button.parent', { hasText: 'Recherche et innovation' }));
  menu.items = await p.evaluate(() => [...document.querySelectorAll('header a')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.y > 150; }).map((e) => e.innerText.trim()).filter(Boolean));
  await p.goto(PAGE, { waitUntil: 'networkidle' }); await settle(p);
  const news = await act('news', p.locator(':is(a,button)', { hasText: 'Actualités suivantes' }), { scrollTo: p.locator('h2', { hasText: 'Actualités' }) });
  const trialsItem = p.locator('ul.list-of-links li', { hasText: 'Essais cliniques' });
  await crop(p, 'd-card-trials', trialsItem);
  await act('trials', trialsItem.locator('a', { hasText: 'Essais cliniques' }), { scrollTo: p.locator('ul.list-of-links', { hasText: 'Essais cliniques' }), nav: true });
  await p.screenshot({ path: join(A, 'shots', 'd-trials-page-full.png'), fullPage: true });
  await p.goto(PAGE, { waitUntil: 'networkidle' }); await settle(p);

  // Brand files and photos, straight from the page's own references.
  const refs = await p.evaluate(() => ({
    imgs: [...document.querySelectorAll('img')].map((i) => i.currentSrc || i.src).filter(Boolean),
    fonts: performance.getEntriesByType('resource').map((r) => r.name).filter((u) => /\.woff2?(\?|$)/.test(u)),
  }));
  manifest.downloads = [];
  const save = async (url, dir) => {
    const r = await p.request.get(url); if (!r.ok()) return;
    const name = decodeURIComponent(url.split('/').pop().split('?')[0]);
    writeFileSync(join(A, dir, name), await r.body());
    manifest.downloads.push({ url, file: `${dir}/${name}` });
  };
  for (const u of new Set(refs.imgs)) await save(u, /\.svg/.test(u) ? 'brand' : 'photos');
  for (const u of new Set(refs.fonts)) await save(u, 'fonts');
  manifest.fontFaces = await p.evaluate(() => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).filter((r) => r instanceof CSSFontFaceRule).map((r) => r.cssText));
  manifest.colors = await p.evaluate(() => {
    const g = (sel, prop) => { const e = document.querySelector(sel); return e ? getComputedStyle(e)[prop] : null; };
    return {
      heroBackground: g('header', 'backgroundColor') || g('.frame-background-primary', 'backgroundColor'),
      activeNav: g('a.active, .nav-link.active, a[aria-current]', 'backgroundColor'),
      text: g('h2', 'color'),
      figuresBand: g('.frame-background-accent-light', 'backgroundColor'),
      button: g('a.btn-primary, .btn-primary', 'backgroundColor'),
      tags: g('.btn-tag, a[class*=tag]', 'backgroundColor'),
      footer: g('footer', 'backgroundColor'),
    };
  });
  await p.context().close();
}

writeFileSync(join(A, 'capture.json'), JSON.stringify(manifest, null, 1));
await browser.close();
console.log(JSON.stringify({ figures: manifest.figures, actions: manifest.actions, colors: manifest.colors, downloads: manifest.downloads.map((d) => d.file) }, null, 1));
