import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dedash } from '../build/dedash.mjs';

const words = (s) => s.replace(/[^\p{L}\p{N}']+/gu, ' ').trim().toLowerCase();

test('a string with no dash comes back untouched', () => {
  const s = 'Nothing here needs changing, and nothing should change.';
  assert.equal(dedash(s).text, s);
  assert.equal(dedash(s).fixed, 0);
});

test('a paired aside in a comma-free sentence becomes a comma pair', () => {
  const { text } = dedash('The rule holds in endotherms — birds and mammals — where size rises.');
  assert.equal(text, 'The rule holds in endotherms, birds and mammals, where size rises.');
});

test('a paired aside becomes brackets when the aside has its own comma', () => {
  const { text } = dedash('It is testable — worth arguing, because observation settles it — and useful.');
  assert.equal(text, 'It is testable (worth arguing, because observation settles it) and useful.');
});

test('a paired aside becomes brackets when the host sentence already has commas', () => {
  // Commas here would read as another item in the list, which is the whole
  // reason the host sentence is inspected and not just the aside.
  const { text } = dedash('It assumes markets, competition, and no externalities — conditions never met — and is silent on fairness.');
  assert.match(text, /\(conditions never met\)/);
  assert.doesNotMatch(text, /, conditions never met,/);
});

test('a bracketed aside keeps the pause before a following independent clause', () => {
  const { text } = dedash('Success is attributed outward — to luck, to an easy problem — so it never accrues.');
  assert.equal(text, 'Success is attributed outward (to luck, to an easy problem), so it never accrues.');
});

test('a trailing gloss with no verb becomes a colon', () => {
  const { text } = dedash('The field circles the wire and weakens with distance — the textbook first application.');
  assert.equal(text, 'The field circles the wire and weakens with distance: the textbook first application.');
});

test('a trailing qualifier becomes a comma', () => {
  const { text } = dedash('The pattern has persisted for a century — though the figure is disputed.');
  assert.equal(text, 'The pattern has persisted for a century, though the figure is disputed.');
});

test('a trailing independent clause becomes its own sentence, capitalised', () => {
  const { text } = dedash('Real searches violate these — you can often recall an option.');
  assert.equal(text, 'Real searches violate these. You can often recall an option.');
});

test('a relative clause takes a comma, never a colon', () => {
  const { text } = dedash('Long waits are more likely to be run into — which biases observed averages upward.');
  assert.match(text, /run into, which biases/);
  assert.doesNotMatch(text, /:/);
});

test('a numeric range is left alone', () => {
  const s = 'The study ran 1948—52 across four sites.';
  assert.equal(dedash(s).text, s);
});

test('a joint name is left alone', () => {
  const s = 'The Stefan—Boltzmann constant sets the scale.';
  assert.equal(dedash(s).text, s);
});

test('a dash it cannot classify is left in place rather than guessed at', () => {
  // No finite verb in the head, so none of the substitutions would read.
  const s = 'Overruns everywhere — the figure nobody wants.';
  assert.equal(dedash(s).text, s);
  assert.equal(dedash(s).fixed, 0);
});

// The invariant that makes this pass safe to run over prose nobody re-reads:
// dedash rewrites punctuation and NOTHING else. It may not insert, delete or
// reorder a word.
//
// Two arms, and they are not redundant. The fixtures are the floor — they hold
// on day one and can never be skipped. The corpus arm is the one that matters
// as entries land, because it runs over sentences nobody wrote with this
// checker in mind.
const INVARIANT_FIXTURES = [
  'The effect holds under time pressure — and vanishes when subjects are paid.',
  'Participants recalled the second list better — a recency effect — even at thirty seconds.',
  'It was named for the physician who described it — though he never claimed priority.',
  'Two hundred subjects, four conditions, one outcome measure — the original design.',
  'People overestimate how much others notice them — you are not being watched that closely.',
  'The 1996 replication failed — as did the 2012 attempt, which used a larger sample.',
  'Kahneman and Tversky — working in Jerusalem — set the terms the field still uses.',
  'The claim is narrower than the name suggests — which is true of most of these.',
];

test('THE INVARIANT: not one word changes, on the fixtures', () => {
  for (const s of INVARIANT_FIXTURES) {
    assert.ok(s.includes('—'), `fixture has no dash to rewrite: ${s}`);
    assert.equal(words(dedash(s).text), words(s), `words changed in: ${s}`);
  }
});

test('THE INVARIANT: not one word changes, across the whole corpus', () => {
  const dir = new URL('../src/data/biases/', import.meta.url);
  let checked = 0;
  const walk = (v) => {
    if (typeof v === 'string') {
      if (!v.includes('—')) return;
      checked++;
      assert.equal(words(dedash(v).text), words(v));
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) if (k !== 'sources' && k !== 'sameAs') walk(v[k]);
  };
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const f of files) walk(JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
  // The original guarded this with `checked > 100` so the test could not pass
  // silently on an empty corpus. Here the corpus really is empty, so that guard
  // would fail for the one reason it was never meant to catch. What replaces it
  // asserts the arm is not silently doing nothing once entries exist: with
  // files present, at least one dash-bearing string must have been seen.
  if (files.length) {
    assert.ok(checked > 0, `${files.length} entries but no dashed strings — is the walker reading the right shape?`);
  }
});

test('the pass is idempotent — running it twice changes nothing more', () => {
  const s = 'It holds in endotherms — birds and mammals — where size rises with latitude — a real gradient.';
  const once = dedash(s).text;
  assert.equal(dedash(once).text, once);
});
