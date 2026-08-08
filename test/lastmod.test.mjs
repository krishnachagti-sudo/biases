// The content hash behind <lastmod>, and the one property that makes it worth
// having: the same page hashes the same wherever the site is served from.
//
// Without that property the committed manifest is only valid for the base it
// was generated against. A manifest built locally at /biases/ mismatches
// every page in CI at /, CI stamps the whole site with today's date, CI does
// not commit its own manifest — so it mismatches again next deploy, forever.
// The feature looks implemented and does nothing, which is worse than the bug
// it replaces because it also looks fixed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { pageHash, resolve, stamp, LASTMOD_TOKEN } from '../build/lastmod.mjs';

// The same page, rendered for a github.io project path and for a root domain.
const PROJECT = [
  '<link rel="canonical" href="https://x.github.io/biases/about/">',
  '<a href="/biases/browse/">Browse</a>',
  '<a href="https://s.io/share?u=https%3A%2F%2Fx.github.io%2Fbiases%2Fabout%2F">Share</a>',
  '<p>Half of the studies replicated. The other half did not.</p>',
].join('');
const ROOT = [
  '<link rel="canonical" href="https://biases.example.com/about/">',
  '<a href="/browse/">Browse</a>',
  '<a href="https://s.io/share?u=https%3A%2F%2Fbiases.example.com%2Fabout%2F">Share</a>',
  '<p>Half of the studies replicated. The other half did not.</p>',
].join('');
const PROJECT_PREFIXES = ['https://x.github.io/biases/', '/biases/'];
const ROOT_PREFIXES = ['https://biases.example.com/', '/'];

test('the same content hashes the same at a project path and at a domain root', () => {
  // The regression this guards: a bare '/' base was replaced globally, so every
  // forward slash in the document became a placeholder and a root build could
  // never agree with a project-path build about whether anything had changed.
  assert.equal(pageHash(PROJECT, PROJECT_PREFIXES), pageHash(ROOT, ROOT_PREFIXES));
});

test('a bare base does not eat every slash in the document', () => {
  const html = '<p>Read 3/4 of it. See <a href="/about/">about</a>.</p>';
  const hashed = pageHash(html, ['https://e.com/', '/']);
  // Same document with the PROSE slash changed must hash differently, which it
  // cannot if all slashes were flattened to the same placeholder.
  assert.notEqual(hashed, pageHash('<p>Read 1/4 of it. See <a href="/about/">about</a>.</p>', ['https://e.com/', '/']));
});

test('a real content change is still a change', () => {
  const changed = ROOT.replace('Half of the studies', 'None of the studies');
  assert.notEqual(pageHash(ROOT, ROOT_PREFIXES), pageHash(changed, ROOT_PREFIXES));
});

test('an unchanged page keeps its old date; a changed one takes today', () => {
  const pages = { 'about/': ROOT, 'browse/': '<p>new</p>' };
  const first = resolve(pages, null, '2026-01-01', ROOT_PREFIXES);
  assert.deepEqual(first.dates, { 'about/': '2026-01-01', 'browse/': '2026-01-01' });

  const edited = { ...pages, 'browse/': '<p>edited</p>' };
  const second = resolve(edited, first.manifest, '2026-06-01', ROOT_PREFIXES);
  assert.equal(second.dates['about/'], '2026-01-01', 'untouched page was re-dated');
  assert.equal(second.dates['browse/'], '2026-06-01');
  assert.deepEqual(second.changed, ['browse/']);
});

test('a manifest written at one base is still valid at the other', () => {
  const atProject = resolve({ 'about/': PROJECT }, null, '2026-01-01', PROJECT_PREFIXES);
  const atRoot = resolve({ 'about/': ROOT }, atProject.manifest, '2026-06-01', ROOT_PREFIXES);
  assert.equal(atRoot.dates['about/'], '2026-01-01', 'moving the site re-dated an unchanged page');
  assert.deepEqual(atRoot.changed, []);
});

test('a missing manifest means everything is new, not a crash', () => {
  const { dates, changed } = resolve({ 'about/': ROOT }, undefined, '2026-01-01', ROOT_PREFIXES);
  assert.equal(dates['about/'], '2026-01-01');
  assert.deepEqual(changed, ['about/']);
});

test('the date token is filled, and a page without one is untouched', () => {
  assert.equal(stamp(`<time>${LASTMOD_TOKEN}</time>`, '2026-08-06'), '<time>2026-08-06</time>');
  assert.equal(stamp('<p>no token</p>', '2026-08-06'), '<p>no token</p>');
});
