// The pictures a link unfurls as, and the rasteriser that makes them.
//
// A shared link with no picture is a link nobody clicks, and every page on this
// site carries a share row. The cards are rendered at build time rather than by
// a service, so they work offline, cost nothing per impression, and cannot
// disagree with the page they represent — the text on the card is read from the
// same values the page is.

import { Resvg } from '@resvg/resvg-js';
import { escapeHtml, BRAND } from '../src/templates/partials.mjs';

const BG = '#14161c'; // charcoal-ink field
const INK = '#f0ece2'; // off-white text
const GOLD = '#e0a43f'; // warm amber accent

export const CARD_W = 1200;
export const CARD_H = 630;

/**
 * Render an SVG string to a PNG Buffer.
 *
 * The TTF paths are CWD-relative, so the build must run from the repository
 * root. `loadSystemFonts: false` is deliberate: with it on, a missing font file
 * falls back to whatever serif the machine happens to have, CI and a laptop
 * silently produce different cards, and nothing fails. Off, a missing font is a
 * crash — which is the outcome you want for an asset nobody looks at until it
 * is already on someone else's timeline.
 *
 * @param {string} svg
 * @returns {Buffer} PNG bytes
 */
export function renderPng(svg) {
  return new Resvg(svg, {
    font: {
      fontFiles: ['src/assets/fonts/Fraunces.ttf', 'src/assets/fonts/SpaceMono.ttf'],
      defaultFontFamily: 'Fraunces',
      loadSystemFonts: false,
    },
  })
    .render()
    .asPng();
}

/** The fallback card, for any page that has no picture of its own. */
export function siteCardSvg({ origin = '', base = '/', count = 0 } = {}) {
  const displayUrl = escapeHtml(`${origin}${base}`.replace(/^https?:\/\//, '').replace(/\/+$/, ''));
  const n = Number(count);
  // The card states the size of the index, so it must not state a size the
  // index does not have. Before there is a corpus it says what the site is
  // instead of claiming a number — a card reading "0 biases" is worse than a
  // card that does not count.
  const headline = n > 0
    ? [`${escapeHtml(n.toLocaleString('en-US'))} cognitive biases,`, 'and what replicated']
    : ['Every named', 'cognitive bias'];
  const mark = `
    <g transform="translate(830,150) scale(4.6)" opacity="0.07" fill="none" stroke="${GOLD}">
      <circle cx="50" cy="50" r="47.2" stroke-width="1.4"/>
      <circle cx="50" cy="50" r="39.5" stroke-width="0.6" stroke-dasharray="0.4 3" stroke-linecap="round"/>
      <g stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">
        <circle cx="50" cy="50" r="22"/>
        <path d="M50,28 C41,36 41,64 50,72"/>
        <path d="M50,28 C61,36 63,64 56,72"/>
      </g>
      <g stroke-width="0.8" stroke-linecap="round">
        <path d="M29.5,42 C39,39.5 61,39.5 70.5,42"/>
        <path d="M28,50.5 C38,48 62,48 72,50.5"/>
        <path d="M29.5,59 C39,56.5 61,56.5 70.5,59"/>
      </g>
    </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <rect width="${CARD_W}" height="${CARD_H}" fill="${BG}"/>
  <rect x="24" y="24" width="${CARD_W - 48}" height="${CARD_H - 48}" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.5"/>
  ${mark}
  <text x="90" y="96" font-family="Space Mono" font-size="26" letter-spacing="6" fill="${GOLD}">${escapeHtml(BRAND.toUpperCase())}</text>
  <text x="90" y="240" font-family="Fraunces" font-size="76" fill="${INK}">${headline[0]}</text>
  <text x="90" y="326" font-family="Fraunces" font-size="76" fill="${INK}">${headline[1]}</text>
  <text x="90" y="404" font-family="Fraunces" font-size="40" fill="${INK}" opacity="0.72">What each one claims, who claimed it,</text>
  <text x="90" y="456" font-family="Fraunces" font-size="40" fill="${INK}" opacity="0.72">and what happened when it was retested.</text>
  <text x="90" y="${CARD_H - 50}" font-family="Space Mono" font-size="22" fill="${GOLD}">${displayUrl}</text>
</svg>`;
}
