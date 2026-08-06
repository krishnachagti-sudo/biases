// Task 13 sitemap builder. Pure, no I/O: turns a list of base-relative page
// paths plus an absolute origin into a sitemaps.org 0.9 <urlset> document.
// The build passes `origin + base` as `origin` here (e.g.
// "https://conyso.com/lawtome/"), so each <loc> is the absolute crawlable URL.

// Minimal XML escape for <loc> text. URLs rarely carry `&`, `<`, `>`, `"`, `'`
// but a query/param could, and an unescaped `&` makes the document ill-formed.
function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * Build a sitemaps.org 0.9 sitemap XML string.
 * @param {string[]} paths base-relative page paths (e.g. 'laws/goodharts-law/',
 *   'browse/', '' for the home root). Each becomes an absolute <loc> = origin + path.
 * @param {string} origin absolute prefix already ending in '/' (origin + base).
 * @param {string|Record<string,string>} [lastmod] either one ISO date for every
 *   URL, or — preferred — a map of base-relative path to the date that page
 *   actually last changed, as computed by build/lastmod.mjs.
 *
 *   The single-string form is kept because a caller with genuinely no per-page
 *   information is better served by one date than by none, and the tests use it
 *   to check the element's shape. It is not what the site should ship. Google
 *   uses <lastmod> "if it's consistently and verifiably accurate", so stamping
 *   every URL with the build date does not add a weak signal — it retires the
 *   field. A path absent from the map gets no <lastmod> at all, which is the
 *   honest output when we do not know.
 * @returns {string} well-formed sitemap XML.
 */
export function buildSitemap(paths, origin, lastmod, images = {}) {
  const el = (d) => (d ? `<lastmod>${xmlEscape(d)}</lastmod>` : '');
  const modFor = typeof lastmod === 'string' || !lastmod
    ? () => el(lastmod)
    : (p) => el(lastmod[p]);
  // Image search is a search surface of its own, and the site had 1,026
  // licensed images — 465 portraits and 561 diagrams and manuscript scans,
  // every one of them fetched with its author, licence and source recorded —
  // that no crawler could discover as images. The sitemaps.org image extension
  // is the whole fix: declare, per page, the images that page actually carries.
  //
  // A caption is worth giving because ours is not decoration: it is the credit
  // the licence obliges us to publish, so the same string does two jobs.
  const hasImages = Object.values(images).some((v) => v && v.length);
  const imageXml = (p) => (images[p] || [])
    .map((img) => `\n    <image:image><image:loc>${xmlEscape(img.loc)}</image:loc>`
      + (img.title ? `<image:title>${xmlEscape(img.title)}</image:title>` : '')
      + (img.caption ? `<image:caption>${xmlEscape(img.caption)}</image:caption>` : '')
      + '</image:image>')
    .join('');
  const urls = paths
    .map((p) => {
      const imgs = imageXml(p);
      return `  <url><loc>${xmlEscape(origin + p)}</loc>${modFor(p)}${imgs}${imgs ? '\n  ' : ''}</url>`;
    })
    .join('\n');
  const ns = hasImages
    ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  return `<?xml version="1.0" encoding="UTF-8"?>
${ns}
${urls}
</urlset>
`;
}
