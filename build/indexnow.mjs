// IndexNow: tell Bing (and therefore ChatGPT Search and Copilot) what changed.
//
// Google does not participate — it evaluated the protocol from 2021 and
// declined — so this does nothing for Google, and the sitemap plus Search
// Console remain the only route there. What it does reach is Bing, Yandex,
// Naver, Seznam and Yep, and Bing's index is what backs ChatGPT Search and
// Microsoft Copilot and part of Perplexity. For a site whose whole strategy is
// being cited rather than clicked, that is the fastest published-to-retrievable
// path available, and it costs one HTTP POST.
//
// Ownership is proven by serving a file named after the key at the site root,
// containing the key. The key is therefore PUBLIC by design — it is not a
// secret, it is a nonce that only proves whoever submits URLs can also write to
// the site. Committing it is correct; treating it as a credential is not.
//
// This module is pure except for the one function that does the POST, so the
// payload construction can be tested without touching the network.

/** The proof-of-ownership file: `<key>.txt` at the site root, containing the key. */
export function keyFile(key) {
  return { name: `${key}.txt`, body: `${key}\n` };
}

/**
 * IndexNow requires a hex key of 8-128 characters. Validated rather than
 * assumed, because a malformed key fails the submission with a 422 that is easy
 * to misread as "the endpoint is down".
 */
export function validKey(key) {
  return typeof key === 'string' && /^[a-f0-9]{8,128}$/i.test(key);
}

/**
 * The URLs that actually changed, from the lastmod manifest.
 *
 * Submitting everything on every deploy is how a site gets its submissions
 * throttled or ignored — the protocol exists to say "this changed", and a
 * feed that always says "all of it" carries no information. The manifest built
 * for the sitemap already knows the answer, so this is free.
 *
 * @param {{pages?:Record<string,{date:string}>}} manifest src/data/lastmod.json
 * @param {string} today ISO date
 * @param {string} baseUrl absolute prefix ending in '/'
 */
export function changedUrls(manifest, today, baseUrl) {
  const pages = (manifest && manifest.pages) || {};
  return Object.keys(pages)
    .filter((p) => pages[p] && pages[p].date === today)
    .sort()
    .map((p) => baseUrl + p);
}

/**
 * The submission body.
 *
 * `host` must match the host of every URL in the list or the whole batch is
 * rejected, so it is derived from baseUrl rather than passed in separately —
 * one source of truth beats two that can disagree.
 */
export function payload(baseUrl, key, urls) {
  const { host, origin } = new URL(baseUrl);
  return {
    host,
    key,
    keyLocation: `${origin}/${key}.txt`,
    urlList: urls,
  };
}

/** IndexNow caps a single submission at 10,000 URLs. */
export const MAX_URLS = 10000;

export function batches(urls, size = MAX_URLS) {
  const out = [];
  for (let i = 0; i < urls.length; i += size) out.push(urls.slice(i, i + size));
  return out;
}

export const ENDPOINT = 'https://api.indexnow.org/IndexNow';

/**
 * Submit. The only impure function here.
 *
 * Never throws: a failed ping is not a failed deploy. The site is already live
 * and the sitemap still exists; the worst case of a silent failure is that Bing
 * finds the change on its own schedule, which is what happens today anyway.
 */
export async function submit(baseUrl, key, urls, fetchImpl = fetch) {
  if (!validKey(key)) return { ok: false, reason: 'invalid key' };
  if (!urls.length) return { ok: true, reason: 'nothing changed', sent: 0 };
  const results = [];
  for (const batch of batches(urls)) {
    try {
      const res = await fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload(baseUrl, key, batch)),
      });
      results.push({ status: res.status, n: batch.length });
    } catch (e) {
      results.push({ status: 0, n: batch.length, error: String(e && e.message) });
    }
  }
  return { ok: results.every((r) => r.status >= 200 && r.status < 300), sent: urls.length, results };
}

const main = async () => {
  const { readFile } = await import('node:fs/promises');
  const { manifestFile } = await import('./lastmod.mjs');
  const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1];

  const cfg = JSON.parse(await readFile('site.config.json', 'utf8'));
  const key = arg('key') || cfg.indexNowKey;
  const baseUrl = arg('base-url') || `${arg('origin') || cfg.origin}${arg('base') || cfg.base}`;
  const today = arg('date') || new Date().toISOString().slice(0, 10);

  let manifest = {};
  try { manifest = JSON.parse(await readFile(manifestFile, 'utf8')); } catch { /* nothing to send */ }
  const urls = changedUrls(manifest, today, baseUrl);

  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({ count: urls.length, sample: urls.slice(0, 10) }, null, 2));
    return;
  }
  const r = await submit(baseUrl, key, urls);
  console.log(`IndexNow: ${JSON.stringify(r)}`);
  // Deliberately exit 0 even on failure. See submit().
};

if (import.meta.url === `file://${process.argv[1]}`) main();
