// /bias/{slug}/ — one bias, one page.
//
// The order of the page is an argument about what a reader wants, and it is not
// the order an encyclopedia usually uses. The claim comes first, then what
// happened when it was tested, and only then where it came from. Origin is
// interesting; whether the thing is true is the question people arrive with, and
// burying it under a paragraph of history is how a reference page ends up being
// skimmed rather than read.
//
// Every string below except the connective tissue comes from the entry file. No
// paraphrase, no second opinion, no hedge written for this page — restating an
// entry in the template's own words is how a page like this becomes filler.

import {
  head, sprite, header, footer, escapeHtml, shareRow, BRAND, founderRef,
} from './partials.mjs';
import { hubFaq, hubJsonLd } from './hub.mjs';
import { CATEGORIES } from '../../build/corpus.mjs';
import { LASTMOD_TOKEN } from '../../build/lastmod.mjs';

export const entryPath = (entry) => `bias/${entry.slug}/`;

/** The one-line answer to "did it hold up", used on the page and in listings. */
export function replicationLabel(state) {
  return {
    replicated: 'Replicated',
    failed: 'Failed to replicate',
    mixed: 'Mixed',
    'none-located': 'No replication located',
  }[state] || 'Unknown';
}

const REPLICATION_CLASS = {
  replicated: 'b-emp',
  failed: 'b-con',
  mixed: 'b-heu',
  'none-located': 'b-folk',
};

// Two decimal places, always. Effect sizes are conventionally reported to two,
// and JavaScript prints 0.5 for a bound the paper writes as 0.50 — which reads
// as a different precision from the 0.23 next to it and makes the pair look
// carelessly transcribed rather than quoted.
const dp2 = (n) => Number(n).toFixed(2);

/**
 * `d = 0.31 (99% CI 0.22 to 0.39)`, or '' when there is no number to print.
 *
 * The interval's level comes from the entry, never from this function. It was
 * briefly hardcoded — 95% for the original, 99% for the replication, which is
 * what the first entry's paper happened to report — and the second entry then
 * printed a 95% interval from its own source labelled 99%. Restating someone
 * else's number at the wrong confidence level is a quiet way to be wrong about
 * a quoted figure, so the level is data now and the schema requires it.
 */
function esLine(e) {
  if (!e || typeof e.es !== 'number') return '';
  const ci = Array.isArray(e.ci) ? ` (${e.ciLevel || 95}% CI ${dp2(e.ci[0])} to ${dp2(e.ci[1])})` : '';
  return `${escapeHtml(e.esType)} = ${dp2(e.es)}${ci}`;
}

/**
 * The replication block: the reason this site exists, so it gets the strongest
 * position on the page and its own visual weight.
 *
 * The `none-located` branch is not a degraded version of the others. It states
 * that a search was made and found nothing, which is a different and weaker
 * claim than "this does not replicate" — and printing the weaker claim plainly
 * is the whole difference between an index that can be trusted about the cases
 * where it knows something and one that cannot.
 */
function replicationBlock(r, { base }) {
  const label = replicationLabel(r.state);
  const cls = REPLICATION_CLASS[r.state] || 'b-heu';

  if (r.state === 'none-located') {
    return `    <div class="vd-rep">
      <h2 class="vd-h">Does it replicate?</h2>
      <p class="vd-badge"><span class="badge ${cls}">${escapeHtml(label)}</span></p>
      <p class="vd-p">${escapeHtml(r.headline)}</p>
      <p class="vd-repcite">No replication attempt was found for this effect. That is not evidence that it fails — it means the search came up empty, and an absence in the literature says nothing either way. <a href="${base}about/">How this index searches</a>.</p>
    </div>

`;
  }

  const s = r.study || {};
  const scale = [
    s.sites ? `${Number(s.sites).toLocaleString('en-US')} sites` : '',
    s.n ? `${Number(s.n).toLocaleString('en-US')} participants` : '',
  ].filter(Boolean).join(', ');

  // Both effect sizes, side by side, because the comparison IS the finding.
  // Printing only the replication's number leaves a reader unable to tell a
  // shrunken effect from one that grew.
  const orig = esLine(r.original);
  const rep = esLine(r.replicated);
  const numbers = (orig || rep)
    ? `      <div class="vd-cmp">
${orig ? `        <div class="vd-c"><span class="vd-cn">${orig}</span><span class="vd-cl">in the original study</span></div>\n` : ''}${rep ? `        <div class="vd-c"><span class="vd-cn">${rep}</span><span class="vd-cl">pooled across the replication${r.replicated && r.replicated.weighting ? `, ${escapeHtml(r.replicated.weighting)}` : ''}</span></div>\n` : ''}      </div>
`
    : '';

  const cite = s.url || (s.doi ? `https://doi.org/${s.doi}` : '');

  return `    <div class="vd-rep">
      <h2 class="vd-h">Does it replicate?</h2>
      <p class="vd-badge"><span class="badge ${cls}">${escapeHtml(label)}</span>${scale ? ` <span class="vd-bn">${escapeHtml(scale)}</span>` : ''}</p>
      <p class="vd-p"><b>${escapeHtml(r.headline)}</b></p>
${numbers}${r.detail ? `      <p class="vd-p">${escapeHtml(r.detail)}</p>\n` : ''}      <p class="vd-repcite">Read off ${cite ? `<a href="${escapeHtml(cite)}" rel="nofollow noopener">${escapeHtml(s.cite)}</a>` : escapeHtml(s.cite)}${r.indexedBy ? `. Located via ${escapeHtml(r.indexedBy)}, which points at the study; the numbers above are the study's own` : ''}.</p>
    </div>

`;
}

/**
 * @param {object} entry a validated row from build/corpus.mjs
 */
export function entryPage(entry, { base = '/', origin = '', count = 0 } = {}) {
  const path = entryPath(entry);
  const r = entry.replication;
  const field = CATEGORIES[entry.category] || entry.category;

  const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
  const aliasLine = aliases.length
    ? `    <p class="sec-lede">Also called ${aliases.map((a) => `<b>${escapeHtml(a)}</b>`).join(', ')}.</p>\n`
    : '';

  const sources = Array.isArray(entry.sources) ? entry.sources : [];
  const sourceList = `    <h2 class="vd-h">Sources</h2>
    <ol class="vd-src">
${sources.map((s) => {
    const href = s.url || (s.doi ? `https://doi.org/${s.doi}` : '');
    return `      <li>${href ? `<a href="${escapeHtml(href)}" rel="nofollow noopener">${escapeHtml(s.text)}</a>` : escapeHtml(s.text)}${s.type ? ` <span class="vd-st">${escapeHtml(s.type)}</span>` : ''}</li>`;
  }).join('\n')}
    </ol>
    <p class="vd-repcite">Every claim on this page was held against these sources on ${escapeHtml(entry.checkedOn)}. Nothing here is written from memory.</p>

`;

  // ONE question, and deliberately only one.
  //
  // The first draft asked three, and two of them ("Where does it run out?",
  // "What do people get wrong about it?") were headings further up the same
  // page with the same paragraph underneath. A reader met each answer twice and
  // a crawler met a FAQPage that was a copy of the body — which is the shape
  // that gets FAQ markup ignored, and the shape that makes a page read as
  // generated. The question left is the one nobody has answered above, and the
  // one people actually type.
  const faq = hubFaq([
    {
      q: `Is ${entry.name} real?`,
      a: `${escapeHtml(r.headline)} ${r.state === 'none-located'
        ? 'No replication attempt has been located, which is a statement about the literature rather than about the effect.'
        : 'The effect sizes from the original study and from the replication are printed side by side above, so the comparison is visible rather than asserted.'}`,
    },
  ], { heading: `About ${entry.name}` });

  const description = `${entry.statement} ${r.headline}`;

  const section = `<section class="sec">
  <div class="wrap">
    <nav class="crumb" aria-label="Breadcrumb"><a href="${base}">Home</a><span class="sep">/</span><a href="${base}browse/">Browse</a><span class="sep">/</span>${escapeHtml(entry.name)}</nav>
    <div class="sec-head">
      <h1>${escapeHtml(entry.name)}</h1>
      <span class="sub">${escapeHtml(String(field).toLowerCase())}</span>
    </div>
    <p class="hub-answer">${escapeHtml(entry.statement)}</p>
${aliasLine}
${replicationBlock(r, { base })}    <h2 class="vd-h">What the claim actually says</h2>
    <p class="vd-p">${escapeHtml(entry.meaning)}</p>

    <h2 class="vd-h">What the experiments did</h2>
    <p class="vd-p">${escapeHtml(entry.evidence)}</p>

    <h2 class="vd-h">Where it came from</h2>
    <p class="vd-p"><b>${escapeHtml(String(entry.origin.year))}</b>, ${escapeHtml(entry.origin.who)}, in ${escapeHtml(entry.origin.where)}.${entry.origin.note ? ` ${escapeHtml(entry.origin.note)}` : ''}</p>

    <h2 class="vd-h">Where it runs out</h2>
    <p class="vd-p">${escapeHtml(entry.limits)}</p>

    <h2 class="vd-h">What people get wrong about it</h2>
    <p class="vd-p">${escapeHtml(entry.misreadings)}</p>

${sourceList}    <div class="sk-share">
${shareRow({ url: `${origin}${base}${path}`, title: entry.name, text: entry.statement, label: 'Share this entry' })}    </div>

${faq.html}  </div>
</section>
`;

  return (
    head({
      title: `${entry.name} — What It Claims, and Whether It Replicated`,
      description,
      base,
      origin,
      path,
      og: { type: 'article' },
      modified: LASTMOD_TOKEN,
      jsonld: [
        ...hubJsonLd({
          name: entry.name,
          description,
          path,
          origin,
          base,
          crumbs: [['browse/', 'Browse']],
        }),
        {
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          '@id': `${origin}${base}${path}#term`,
          name: entry.name,
          alternateName: aliases,
          description: entry.statement,
          inDefinedTermSet: { '@type': 'DefinedTermSet', name: BRAND, url: `${origin}${base}` },
          // The citations are the point of the markup, not decoration: they are
          // how a machine reading this page can check it against the same
          // documents a person would.
          citation: sources.map((s) => ({
            '@type': 'CreativeWork',
            name: s.text,
            ...(s.doi ? { identifier: `https://doi.org/${s.doi}` } : {}),
            ...(s.url ? { url: s.url } : {}),
          })),
          dateModified: LASTMOD_TOKEN,
          creator: founderRef(origin, base),
        },
        ...(faq.jsonld ? [faq.jsonld] : []),
      ],
    })
    + sprite() + header({ base, active: 'browse', count: count > 0 ? count : null }) + section + footer({ base })
  );
}
