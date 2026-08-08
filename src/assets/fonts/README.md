# Vendored fonts — provenance & licensing

Both families are licensed under the **SIL Open Font License 1.1**. The full,
unmodified upstream license text for each accompanies the binaries in this directory,
as the OFL requires when redistributing. **The `OFL-*.txt` files must be copied into
`dist/` by the build** — the license has to travel with the binaries.

| File | Family | Coverage | License | Upstream source |
|---|---|---|---|---|
| `SourceSerif4-normal-latin.woff2` | Source Serif 4 (variable, wght 200–900) | latin | `OFL-SourceSerif4.txt` | `fonts.gstatic.com`, via the Google Fonts CSS2 API |
| `SourceSerif4-normal-latin-ext.woff2` | Source Serif 4 (variable, wght 200–900) | latin-ext | `OFL-SourceSerif4.txt` | `fonts.gstatic.com`, via the Google Fonts CSS2 API |
| `SourceSerif4-italic-latin.woff2` | Source Serif 4 italic (variable, wght 200–900) | latin | `OFL-SourceSerif4.txt` | `fonts.gstatic.com`, via the Google Fonts CSS2 API |
| `SourceSerif4-italic-latin-ext.woff2` | Source Serif 4 italic (variable, wght 200–900) | latin-ext | `OFL-SourceSerif4.txt` | `fonts.gstatic.com`, via the Google Fonts CSS2 API |
| `IBMPlexMono-Regular-latin.woff2` | IBM Plex Mono 400 (static) | latin | `OFL-IBMPlexMono.txt` | `fonts.gstatic.com`, via the Google Fonts CSS2 API |
| `IBMPlexMono-Regular-latin-ext.woff2` | IBM Plex Mono 400 (static) | latin-ext | `OFL-IBMPlexMono.txt` | `fonts.gstatic.com`, via the Google Fonts CSS2 API |
| `IBMPlexMono-SemiBold-latin.woff2` | IBM Plex Mono 600 (static) | latin | `OFL-IBMPlexMono.txt` | `fonts.gstatic.com`, via the Google Fonts CSS2 API |
| `IBMPlexMono-SemiBold-latin-ext.woff2` | IBM Plex Mono 600 (static) | latin-ext | `OFL-IBMPlexMono.txt` | `fonts.gstatic.com`, via the Google Fonts CSS2 API |
| `SourceSerif4.ttf` | Source Serif 4 Regular (static) | full upstream charset | `OFL-SourceSerif4.txt` | [adobe-fonts/source-serif](https://github.com/adobe-fonts/source-serif) `TTF/SourceSerif4-Regular.ttf` |
| `IBMPlexMono.ttf` | IBM Plex Mono Regular (static) | full upstream charset | `OFL-IBMPlexMono.txt` | [IBM/plex](https://github.com/IBM/plex) `packages/plex-mono/fonts/complete/ttf/IBMPlexMono-Regular.ttf` |

The woff2 files are byte-identical to what the Google Fonts CDN serves — they were
fetched from the exact `fonts.gstatic.com` URLs named in the CSS2 API response, not
rebuilt.

License texts retrieved from:

- Source Serif 4 — <https://github.com/adobe-fonts/source-serif/blob/release/LICENSE.md>
- IBM Plex Mono — <https://github.com/IBM/plex/blob/master/LICENSE.txt>

## Why these two, and not the engine's Newsreader + Space Mono

The site's layout is forked from The Law Tome and the typefaces are the loudest
thing that made the two read as one property. Source Serif 4 is a journal text
serif — sturdier, less literary, no newspaper flourish — and IBM Plex Mono is a
technical label face rather than Space Mono's retro one. Do not "restore" the old
pair; see the header of `../styles.css` for the full list of deliberate
differences.

## Character coverage — read this before adding an entry

Coverage is **latin + latin-ext**, which spans the names entries actually cite:

- latin (`U+0000–00FF` …) — Kahneman, Tversky, Löwenstein, Curaçao
- latin-ext (`U+0100–02BA` …) — Białek (`ł`), Erdős (`ő`), Žižek (`ž`), Șerban (`Ș`)

Each family declares both files with Google's own `unicode-range`, so latin-ext costs
nothing until a page actually contains one of those characters.

**Deliberately NOT vendored: vietnamese, greek, cyrillic.** A name like `Đặng` would
render `ặ` (U+1EB7, vietnamese) in a fallback font. No entry needs it today — this is
a known boundary, not an oversight. If the corpus ever gains such an entry, vendor the
matching subset from the CSS2 API and add an `@font-face` rule with its `unicode-range`.

To re-derive or extend the set, request the families from the CSS2 API with a modern
browser User-Agent (Google serves woff2 + per-subset `unicode-range` only to modern
UAs) and take the `src:` URLs from the response:

```
https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=IBM+Plex+Mono:wght@400;600&display=swap
```

Verify any change with the shipped bytes, not by eye:

```
python3 -c "from fontTools.ttLib import TTFont; \
  cm=TTFont('SourceSerif4-normal-latin-ext.woff2').getBestCmap(); \
  print([c for c in 'őłšžđğűșț' if ord(c) not in cm] or 'all present')"
```

## Why the weight axis is declared `200 900`

Source Serif 4 is a **variable** font. `styles.css` declares it as a single
`@font-face` per style per subset with `font-weight:200 900`. Do not split it back
into per-weight rules pinned to 400/600: the CDN does that only because it is
answering a request for those specific instances. Pinning makes the browser
**synthesise** any weight it was not given, instead of instantiating the font's real
one.

IBM Plex Mono genuinely has no variable axis, so its 400 and 600 stay separate faces.

## Why both `.woff2` and `.ttf`

The **woff2** files are what the site's `@font-face` rules load — smallest over the wire.

The two **uncompressed TTFs** (`SourceSerif4.ttf`, `IBMPlexMono.ttf`) exist solely for
share-card PNG rendering via `@resvg/resvg-js`, which **cannot decode woff2**. Point
resvg at a woff2 and it does not error — it silently falls back to a missing default
font. `build/cards.mjs` names these two exact paths.

`SourceSerif4.ttf` is the **static Regular instance**, not the variable font: resvg
performs no variable-font instantiation, so a variable file would render at its
default instance rather than the weight intended.

## Icons

Tabler Icons (MIT) lives in `../icons/`. It is **subset** to only the glyphs the site
uses — see the header of `../icons/tabler.css` for the pinned source package and the
regeneration command. Its MIT notice rides in that CSS header.
