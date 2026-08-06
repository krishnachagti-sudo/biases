# Bias Atlas

An index of cognitive biases: what each one claims, who first claimed it, and
what happened when the experiments behind it were repeated.

The last part is the reason the site exists. Most places you can look a bias up
will tell you what it is; very few will tell you whether the study behind it
survived being run again. A large share of the best-known biases come from
social-psychology experiments run before that field's replication reckoning, and
the record of what held up is published, checkable, and mostly absent from where
people actually look.

**Status: the engine works, the corpus is empty.** Three pages build, both
whole-site checks pass, and no entries are written yet. `docs/BUILD-ORDER.md`
has the 177 biases identified and the order they get written in.

## Running it

```
npm install
npm run build      # → dist/
npm run preflight  # whole-site checks on dist/
npm test
npm run style      # house-style measurement; --strict is the CI gate
npm run serve      # build, then http://localhost:8080/bias-atlas/
```

Node ≥ 22 is required — `npm test` uses a glob argument to `node --test` that
Node 20 treats as a literal path and reports missing.

## Layout

```
build/            the build, and the checks that run against its output
  build.mjs         renders every page into dist/
  preflight.mjs     whole-site checks: canonicals, dead links, sitemap/robots
  lastmod.mjs       content-hash dates, so <lastmod> only moves when a page does
  sitemap.mjs       the sitemap
  indexnow.mjs      submits only the URLs whose hash moved (off by default)
  dedash.mjs        the punctuation pass, with its word-invariant test
  style-check.mjs   house-style measurement and the CI gate
  cards.mjs         the share card, rasterised at build time
src/
  assets/           stylesheet, client JS, self-hosted fonts and icons
  data/biases/      the corpus. Empty.
  templates/        the pages
docs/
  BUILD-ORDER.md    the 177 biases to write, ranked by how often they are looked up
  VOICE.md          the house style
  LAUNCH.md         DNS through to IndexNow, in the order that works
  SEARCH-VISIBILITY.md, -CHECKLIST.md   the SEO/AEO/GEO reference
```

## Where it came from

The engine is forked from [The Law Tome](https://github.com/krishnachagti-sudo/law-tome),
which is why `styles.css`, the deploy pipeline and the visibility apparatus
arrived working. Only the parts that never knew what a *law* was came across.
The reliability tiers, the card renderer, the twenty-six item navigation menu and
every one of the thirty-six page types did not — a fork that keeps those
inherits a finished shape without earning any of it, and it shows.

Two things were fixed rather than copied. `lastmod.mjs` normalised a bare `/`
base by replacing every forward slash in the document, so a build at a domain
root could never agree with one at a project path about whether anything had
changed; `test/lastmod.test.mjs` now pins that. And the publisher graph no
longer names a parent organisation, because whether this site belongs to one has
not been decided and an entity graph is slow to unlearn a claim like that.

## Sources and licences

Entries are written from the published literature, read directly. Nothing is
written from memory, and every factual claim links to something a reader can
open.

Replication figures are quoted from
[FORRT's Replication Database](https://doi.org/10.17605/OSF.IO/9R62X)
(Röseler et al., *Journal of Open Psychology Data*), CC BY 4.0. They are
attributed, never assessed here. An entry with no replication record says so —
silence in the database is not evidence either way.

The corpus is licensed CC BY 4.0.
