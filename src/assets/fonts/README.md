# Vendored fonts — provenance & licensing

All three families are licensed under the **SIL Open Font License 1.1**. The full,
unmodified upstream license text for each accompanies the binaries in this directory,
as the OFL requires when redistributing. **The `OFL-*.txt` files must be copied into
`dist/` by the build** — the license has to travel with the binaries.

| File | Family | Coverage | License | Upstream source |
|---|---|---|---|---|
| `Fraunces-latin.woff2` | Fraunces (variable, wght 100–900) | latin | `OFL-Fraunces.txt` | `fonts.gstatic.com` (Fraunces v38), via the Google Fonts CSS2 API |
| `Fraunces-latin-ext.woff2` | Fraunces (variable, wght 100–900) | latin-ext | `OFL-Fraunces.txt` | `fonts.gstatic.com` (Fraunces v38), via the Google Fonts CSS2 API |
| `Inter-latin.woff2` | Inter (variable, wght 100–900) | latin | `OFL-Inter.txt` | `fonts.gstatic.com` (Inter v20), via the Google Fonts CSS2 API |
| `Inter-latin-ext.woff2` | Inter (variable, wght 100–900) | latin-ext | `OFL-Inter.txt` | `fonts.gstatic.com` (Inter v20), via the Google Fonts CSS2 API |
| `SpaceMono-Regular-latin.woff2` | Space Mono 400 (static) | latin | `OFL-SpaceMono.txt` | `fonts.gstatic.com` (Space Mono v17), via the Google Fonts CSS2 API |
| `SpaceMono-Regular-latin-ext.woff2` | Space Mono 400 (static) | latin-ext | `OFL-SpaceMono.txt` | `fonts.gstatic.com` (Space Mono v17), via the Google Fonts CSS2 API |
| `SpaceMono-Bold-latin.woff2` | Space Mono 700 (static) | latin | `OFL-SpaceMono.txt` | `fonts.gstatic.com` (Space Mono v17), via the Google Fonts CSS2 API |
| `SpaceMono-Bold-latin-ext.woff2` | Space Mono 700 (static) | latin-ext | `OFL-SpaceMono.txt` | `fonts.gstatic.com` (Space Mono v17), via the Google Fonts CSS2 API |
| `Fraunces.ttf` | Fraunces 72pt Regular (static) | full upstream charset | `OFL-Fraunces.txt` | [googlefonts/fraunces](https://github.com/googlefonts/fraunces) `fonts/static/ttf/Fraunces72pt-Regular.ttf` |
| `SpaceMono.ttf` | Space Mono Regular (static) | full upstream charset | `OFL-SpaceMono.txt` | [googlefonts/spacemono](https://github.com/googlefonts/spacemono) `fonts/ttf/SpaceMono-Regular.ttf` |

The woff2 files are **byte-identical to what the Google Fonts CDN served the design
prototype** — they were fetched from the exact `fonts.gstatic.com` URLs named in the
CSS2 API response, not rebuilt. Nothing about the rendering changed when we
un-CDN'd them.

License texts retrieved from:

- Fraunces — <https://github.com/googlefonts/fraunces/blob/master/OFL.txt>
- Inter — <https://github.com/rsms/inter/blob/master/LICENSE.txt> (Inter ships OFL as `LICENSE.txt`; there is no `OFL.txt`)
- Space Mono — <https://github.com/googlefonts/spacemono/blob/main/OFL.txt>

## Character coverage — read this before adding a law

This is a directory of **eponymous** laws, so non-ASCII letters show up in the one
place they are most visible: people's names. Coverage is **latin + latin-ext**, which
spans the realistic canon:

- latin (`U+0000–00FF` …) — Gödel, Poincaré, Gauß, Ampère, Curaçao
- latin-ext (`U+0100–02BA` …) — Erdős (`ő`), Łukasiewicz (`Ł`), Žižek (`ž`), Țiriac (`ț`), Şahin (`Ş`)

Each family declares both files with Google's own `unicode-range`, so latin-ext costs
nothing until a page actually contains one of those characters.

**Deliberately NOT vendored: vietnamese, greek, cyrillic.** The CDN used to fetch
these on demand; we don't ship them. A name like `Đặng` would render `ặ` (U+1EB7,
vietnamese) in a fallback font. No law in the canon needs it today — but this is a
known boundary, not an oversight. If the corpus ever gains such an entry, vendor the
matching subset from the CSS2 API and add an `@font-face` rule with its `unicode-range`.

To re-derive or extend the set, request the families from the CSS2 API with a modern
browser User-Agent (Google serves woff2 + per-subset `unicode-range` only to modern
UAs) and take the `src:` URLs from the response:

```
https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500&family=Space+Mono:wght@400;700&display=swap
```

Verify any change with the shipped bytes, not by eye:

```
python3 -c "from fontTools.ttLib import TTFont; \
  cm=TTFont('Fraunces-latin-ext.woff2').getBestCmap(); \
  print([c for c in 'őłšžđğűșțĐ' if ord(c) not in cm] or 'all present')"
```

## Why the weight axis is declared `100 900`

Fraunces and Inter are **variable** fonts. `styles.css` declares each as a single
`@font-face` per subset with `font-weight:100 900`. Do not split them back into
per-weight rules pinned to 400/500/600: the CDN did that only because it was
answering a request for those specific instances. Pinning makes the browser
**synthesise** any weight it wasn't given — e.g. `.example b` (Inter) would match the
500 face and fake a 700, instead of instantiating the font's real 700.

Space Mono genuinely has no variable axis, so its 400 and 700 stay separate faces.

## Why both `.woff2` and `.ttf`

The **woff2** files are what the site's `@font-face` rules load — smallest over the wire.

The two **uncompressed TTFs** (`Fraunces.ttf`, `SpaceMono.ttf`) exist solely for
quote-card PNG rendering via `@resvg/resvg-js`, which **cannot decode woff2**. Point
resvg at a woff2 and it does not error — it silently falls back to a missing default
font. These two exact filenames are load-bearing; a test asserts they exist.

`Fraunces.ttf` is deliberately the **static 72pt Regular instance**, not the variable
font: resvg performs no variable-font instantiation, so the variable Fraunces would
render at its default instance — which for this font is `wght 900 / opsz 9`, i.e. a
black, small-optical-size face where display Regular was intended.

## Icons

Tabler Icons (MIT) lives in `../icons/`. It is **subset** to only the 7 glyphs the site
uses — see the header of `../icons/tabler.css` for the pinned source package and the
regeneration command. Its MIT notice rides in that CSS header.
