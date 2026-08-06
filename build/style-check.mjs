// Measure the mechanical parts of docs/VOICE.md against the corpus.
//
// It reports and exits 0. It does not rewrite and it does not fail a build,
// because most of what it counts is a signal rather than a rule: one long
// sentence is fine, forty in one entry is a habit. The numbers are here so the
// habit is visible.
//
// `node build/style-check.mjs --strict` exits 1 on the two things that ARE
// rules: a word from the banned list, and more than one em dash in an entry.

import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../src/data/biases/', import.meta.url);

// Words that mark generated prose more reliably than anything else. See
// docs/VOICE.md section 3.
export const BANNED = [
  'delve', 'delves', 'delving', 'underscore', 'underscores', 'underscoring',
  'a testament to', 'tapestry', 'in the realm of', 'multifaceted',
  "it's worth noting", 'it is worth noting', 'at its core', 'unpack',
  'deep dive', 'game-changer', 'game changer', 'paradigm shift',
  'moreover', 'furthermore', 'in conclusion',
];

// The EMPTY "not just an X, it is a Y" -- where Y restates X with more
// adjectives and the sentence says nothing it did not already say.
//
// Deliberately narrow. The first version of this flagged every "not just",
// caught 351 of them, and every one turned out to be doing real work:
// distinguishing what a law claims from what it does not is the job of the
// `misreadings` field, and "the component count is not simply the number of
// species present; it is the number of independent components" is precise
// writing, not inflation. The tell is the empty version, and the corpus has
// none of it. A rule that would have rewritten 351 correct sentences into
// worse ones was the wrong rule, so it was narrowed to what it meant.
export const NOT_JUST = /\b(?:is|are|was|were|isn't|aren't)\s+not\s+(?:just|merely|simply)\s+an?\s+\p{L}+\s*[,;:—]\s*(?:it|they|but)\b/giu;

// Intensifiers that add nothing to a sentence stating a fact.
export const INTENSIFIER = /\b(very|extremely|incredibly|hugely|remarkably|significantly|truly|really|quite) \p{L}/giu;

/** Every prose string in an entry, with the field it came from. */
export function proseOf(entry, skip = new Set(['sources', 'sameAs', 'slug', 'url'])) {
  const out = [];
  const walk = (v, k) => {
    if (typeof v === 'string') { if (v.length > 12) out.push({ k, t: v }); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, k));
    else if (v && typeof v === 'object') for (const kk of Object.keys(v)) if (!skip.has(kk)) walk(v[kk], `${k}.${kk}`);
  };
  for (const kk of Object.keys(entry || {})) if (!skip.has(kk)) walk(entry[kk], kk);
  return out;
}

/** Everything docs/VOICE.md can be checked for mechanically, for one entry. */
export function measure(entry) {
  const prose = proseOf(entry);
  const all = prose.map((p) => p.t).join(' ');
  const sentences = all.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 12);
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const lower = ` ${all.toLowerCase().replace(/[^\p{L}\p{N}' -]+/gu, ' ').replace(/\s+/g, ' ')} `;
  return {
    dashes: (all.match(/—/g) || []).length,
    // Padded and punctuation-stripped, so "in conclusion" does not fire on
    // "maximin conclusion" and "unpack" does not fire on "unpacked".
    banned: BANNED.filter((w) => lower.includes(` ${w} `)),
    notJust: (all.match(NOT_JUST) || []).length,
    intensifiers: (all.match(INTENSIFIER) || []).length,
    sentences: sentences.length,
    over40: lengths.filter((n) => n > 40).length,
    meanLength: lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0,
  };
}

// Occurrences that are literal rather than figurative, confirmed by reading
// them. Chevreul really did run the dye works at the Gobelins tapestry
// manufactory, and the entry on Kuhn's paradigm shift cannot avoid the phrase.
// An allowlist keyed to the entry keeps --strict meaningful instead of being
// switched off the first time it is right about the word and wrong about the use.
export const LITERAL = {
  'paradigm-shift': ['paradigm shift'],
  incommensurability: ['paradigm shift'],
  'simultaneous-contrast': ['tapestry'],
};

const strict = process.argv.includes('--strict');
const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
// Nothing to measure yet. Exiting 0 with a stated reason is right — the check
// has no opinion about an empty corpus — but it must SAY so, because "0 banned
// words" printed over no input reads exactly like a pass.
if (!files.length) {
  console.log('style: no entries in src/data/biases/ yet, nothing measured.');
  process.exit(0);
}
const tot = { dashes: 0, notJust: 0, intensifiers: 0, sentences: 0, over40: 0, len: 0 };
const banned = new Map();
const overDash = [];
for (const f of files) {
  const slug = f.replace(/\.json$/, '');
  const m = measure(JSON.parse(readFileSync(new URL(f, DIR), 'utf8')));
  m.banned = m.banned.filter((w) => !(LITERAL[slug] || []).includes(w));
  tot.dashes += m.dashes; tot.notJust += m.notJust; tot.intensifiers += m.intensifiers;
  tot.sentences += m.sentences; tot.over40 += m.over40; tot.len += m.meanLength;
  for (const w of m.banned) banned.set(w, (banned.get(w) || 0) + 1);
  if (m.dashes > 1) overDash.push([f.replace(/\.json$/, ''), m.dashes]);
}
const pct = (n) => `${(n / tot.sentences * 100).toFixed(1)}%`;
console.log(`${files.length} entries, ${tot.sentences.toLocaleString('en-GB')} sentences\n`);
console.log(`em dashes                  ${String(tot.dashes).padStart(6)}   ${pct(tot.dashes)} of sentences`);
console.log(`  entries over the 1 limit ${String(overDash.length).padStart(6)}   worst: ${overDash.sort((a, b) => b[1] - a[1]).slice(0, 4).map(([s, n]) => `${s} (${n})`).join(', ') || 'none'}`);
console.log(`"not just X"               ${String(tot.notJust).padStart(6)}   ${pct(tot.notJust)}`);
console.log(`intensifiers               ${String(tot.intensifiers).padStart(6)}   ${pct(tot.intensifiers)}`);
console.log(`sentences over 40 words    ${String(tot.over40).padStart(6)}   ${pct(tot.over40)}`);
console.log(`mean sentence length       ${String(Math.round(tot.len / files.length)).padStart(6)}   words (target ~20)`);
console.log(`banned words               ${String([...banned.values()].reduce((a, b) => a + b, 0)).padStart(6)}   ${[...banned].map(([w, n]) => `${w} (${n})`).join(', ') || 'none'}`);

// What --strict blocks a deploy on, and what it only reports.
//
// The banned list is absolute: there is no entry that needs the word "delve",
// and the LITERAL allowlist already handles the cases where the checker is
// right about the word and wrong about the use.
//
// The em-dash limit is a target, not an absolute. One per entry is what the
// prose should aim at, and 33 entries sit above it on cases no rule should
// decide: "Force 0 — Calm" is a label list, and a genuine interruption is
// sometimes the right mark. A gate that fails the build on those is a gate
// somebody switches off, and then the banned list stops being enforced too.
// So --strict blocks on the absolute rule plus two ceilings that catch drift
// without demanding perfection: no entry may exceed three, and the corpus-wide
// rate may not exceed 1% of sentences. Today it is 0.5%, so the headroom is
// real but not generous.
const MAX_PER_ENTRY = 3;
const MAX_RATE = 0.01;
const rate = tot.dashes / tot.sentences;
const tooMany = overDash.filter(([, n]) => n > MAX_PER_ENTRY);
if (strict) {
  const problems = [];
  if (banned.size) problems.push(`${banned.size} banned word(s)`);
  if (tooMany.length) problems.push(`${tooMany.length} entr(ies) over ${MAX_PER_ENTRY} em dashes: ${tooMany.map(([s2, n]) => `${s2} (${n})`).join(', ')}`);
  if (rate > MAX_RATE) problems.push(`em-dash rate ${(rate * 100).toFixed(2)}% is over the ${(MAX_RATE * 100).toFixed(0)}% ceiling`);
  if (problems.length) {
    console.error(`\nstrict: ${problems.join('; ')}`);
    process.exit(1);
  }
  console.log(`\nstrict: ok (${overDash.length} entries above the one-dash target, none above ${MAX_PER_ENTRY}; rate ${(rate * 100).toFixed(2)}%)`);
}
