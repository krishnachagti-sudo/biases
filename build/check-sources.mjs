// Resolve every DOI in the corpus against Crossref and check it points at the
// paper the entry says it does.
//
// This exists because of who writes the entries. Research is delegated, and a
// delegated researcher under pressure to produce a citation will occasionally
// produce one that looks perfect and does not exist: right author, plausible
// title, plausible journal, invented DOI. That failure is invisible to every
// other check in this repository. The build validates shape, the tests validate
// rendering, the style gate validates prose, and all three pass happily on a
// fabricated reference.
//
// So this is the one check that leaves the machine. It is deliberately NOT part
// of `npm test`, which has to run offline and deterministically; it is a
// separate command to run before publishing new entries, and it is slow on
// purpose — Crossref is a free service run for the public good and hammering it
// in parallel is both rude and, as this project has already learned once with
// the pageviews API, a good way to record failures as data.
//
//   npm run sources          check every entry
//   npm run sources -- --new check only entries changed against HEAD
//
// Exit code is non-zero if any DOI fails to resolve or resolves to something
// whose title does not look like the one the entry claims.

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const DIR = 'src/data/biases';
const CACHE_DIR = '.cache';
const CACHE = join(CACHE_DIR, 'crossref.json');
const UA = 'BiasAtlas/0.1 (source verification; github.com/krishnachagti-sudo/biases)';

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};

/** Lowercase, strip punctuation and collapse spaces, so titles can be compared. */
const norm = (s) => String(s || '')
  .toLowerCase()
  .replace(/[‘’“”]/g, "'")
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

/**
 * Do these two titles plausibly name the same paper?
 *
 * Not string equality. Crossref stores "The “false consensus effect”: An
 * egocentric bias…" and an entry's citation carries the same words inside a
 * longer APA reference, so the test is containment of a distinctive prefix,
 * plus a word-overlap fallback for titles that get truncated or subtitled
 * differently between sources.
 */
function titleMatches(claimText, crossrefTitle) {
  const a = norm(claimText);
  const b = norm(crossrefTitle);
  if (!b) return false;
  if (a.includes(b)) return true;
  const head = b.split(' ').slice(0, 6).join(' ');
  if (head.length > 12 && a.includes(head)) return true;
  const bw = new Set(b.split(' ').filter((w) => w.length > 3));
  if (!bw.size) return false;
  let hit = 0;
  for (const w of bw) if (a.includes(w)) hit++;
  return hit / bw.size >= 0.7;
}

/**
 * Ask Crossref, and if it has never heard of the DOI, ask DataCite.
 *
 * Both of those fallbacks are here because the first run of this script
 * reported five failures that were not failures.
 *
 * Crossref registers journal articles. DataCite registers datasets, preprints
 * and repository records, which is where OSF DOIs live — so the FORRT
 * Replication Database, cited by four entries, came back 404 from Crossref
 * while resolving perfectly well at DataCite. A checker that only knows one
 * registry will keep flagging every dataset citation in the corpus.
 *
 * And a 429 is not a verdict. The first run recorded three rate-limited
 * requests as unresolvable DOIs, which is precisely the failure this project
 * already documented in docs/BUILD-ORDER.md after eight parallel workers
 * against the pageviews API wrote a zero for every article they were throttled
 * on. Writing the lesson down did not stop me repeating it one file later, so
 * the retry is now in the code where it cannot be forgotten.
 */
async function resolveDoi(doi) {
  const key = doi.toLowerCase();
  if (cache[key]) return cache[key];

  const get = async (url, headers = {}) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
        if (r.status === 429 || r.status >= 500) {
          await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
          continue;
        }
        return r;
      } catch {
        await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
      }
    }
    return null;
  };

  let out = null;
  const cr = await get(`https://api.crossref.org/works/${encodeURI(doi)}`);
  if (cr && cr.ok) {
    const m = (await cr.json()).message;
    out = {
      ok: true,
      registry: 'crossref',
      title: (m.title || [])[0] || '',
      journal: (m['container-title'] || [])[0] || '',
      year: ((m.issued || {})['date-parts'] || [[]])[0][0] || null,
    };
  } else if (cr && cr.status === 404) {
    const dc = await get(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`);
    if (dc && dc.ok) {
      const a = (await dc.json()).data.attributes;
      out = {
        ok: true,
        registry: 'datacite',
        title: ((a.titles || [])[0] || {}).title || '',
        journal: a.publisher || '',
        year: a.publicationYear || null,
      };
    } else if (dc && dc.status === 404) {
      out = { ok: false, status: 404 };
    }
  }
  // Anything else — exhausted retries, network trouble — is unknown rather than
  // failed, and must not be cached or reported as a bad DOI.
  if (!out) return { ok: false, status: 'unknown', transient: true };
  cache[key] = out;
  return out;
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
let targets = files;
if (process.argv.includes('--new')) {
  const changed = execSync('git status --porcelain -- src/data/biases', { encoding: 'utf8' })
    .split('\n').map((l) => l.slice(3).trim()).filter(Boolean)
    .map((p) => p.split('/').pop());
  targets = files.filter((f) => changed.includes(f));
}

const problems = [];
const transient = [];
let checked = 0;
let noDoi = 0;

for (const f of targets) {
  const entry = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  const refs = [];
  for (const s of entry.sources || []) refs.push({ where: 'sources', doi: s.doi, text: s.text, url: s.url });
  const st = (entry.replication || {}).study;
  if (st) refs.push({ where: 'replication.study', doi: st.doi, text: st.cite, url: st.url });

  for (const r of refs) {
    if (!r.doi) {
      // The schema already requires a url when there is no doi; nothing to
      // resolve, but it is worth counting how much of the corpus rests on
      // links that cannot be machine-checked.
      noDoi++;
      continue;
    }
    checked++;
    const got = await resolveDoi(r.doi);
    if (!got.ok) {
      if (got.transient) { transient.push(`${f} [${r.where}] ${r.doi}`); continue; }
      problems.push(`${f} [${r.where}] DOI does not resolve (${got.status}): ${r.doi}`);
      continue;
    }
    if (!titleMatches(r.text, got.title)) {
      problems.push(`${f} [${r.where}] DOI ${r.doi} resolves to "${got.title}" which does not match the citation text`);
    }
    // A doi.org url must agree with the doi beside it, or one of them is stale.
    if (r.url && /doi\.org\//i.test(r.url)) {
      const inUrl = decodeURIComponent(r.url.replace(/^.*doi\.org\//i, ''));
      if (inUrl.toLowerCase() !== r.doi.toLowerCase()) {
        problems.push(`${f} [${r.where}] url says ${inUrl} but doi field says ${r.doi}`);
      }
    }
  }
  await new Promise((res) => setTimeout(res, 120));
}

mkdirSync(CACHE_DIR, { recursive: true });
writeFileSync(CACHE, JSON.stringify(cache));

// Unresolved-because-the-network-misbehaved is reported loudly and separately.
// Folding it into either "passed" or "failed" is how a throttled request turns
// into a false verdict, in whichever direction happens to be convenient.
if (transient.length) {
  console.error(`WARNING — ${transient.length} DOI${transient.length === 1 ? '' : 's'} could not be checked (network or rate limit). Re-run to settle:`);
  for (const t of transient) console.error(`  • ${t}`);
}

if (problems.length) {
  console.error(`source check FAILED — ${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
  for (const p of problems) console.error(`  • ${p}`);
  process.exit(1);
}
if (transient.length) {
  console.error('source check INCONCLUSIVE — every DOI it could reach was fine, but some could not be reached.');
  process.exit(2);
}
console.log(`source check passed — ${checked} DOIs resolved and matched across ${targets.length} entries (${noDoi} sources carry a url and no doi).`);
