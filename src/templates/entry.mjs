// /bias/{slug}/ — one bias, one page.
//
// The layout is The Law Tome's entry page, because styles.css came from there
// and every rule in it is keyed to these class names. Reproducing the classes
// gets the design; what had to be decided here is what goes in each slot, since
// a bias is not a law and the slots were cut for laws.
//
// Two departures from the original, both deliberate:
//
//   The fact strip carries the replication scale — sites, participants — where
//   the original carried namesake and kind. Those are the numbers that make an
//   entry here worth more than a definition, so they go in the row a reader
//   scans before deciding to read.
//
//   "Does it replicate?" is the second block rather than buried near the end.
//   The original put origin high and evidence low, which suits an index about
//   where ideas came from. This one is about whether they held.
//
// Every string except the connective tissue comes from the entry file. No
// paraphrase and no hedge written for this page: restating an entry in the
// template's own words is how a page like this becomes filler.

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

/**
 * Badge colour per verdict, reusing the reliability-tier classes the stylesheet
 * already defines: green for held, red for failed, amber for mixed, grey for a
 * search that came up empty. The names are inherited and now mean something
 * else, which is the price of not forking 2,547 lines of CSS to rename four
 * classes.
 */
export const REPLICATION_CLASS = {
  replicated: 'b-emp',
  failed: 'b-con',
  mixed: 'b-heu',
  'none-located': 'b-folk',
};

const num = (x) => Number(x).toLocaleString('en-US');

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
  // A raw mean difference reads as a quantity, not an equation: "0.03 scale
  // points", never "md = 0.03". The unit is required by the schema so this
  // branch always has something to say.
  const headline = e.esType === 'md'
    ? `${dp2(e.es)} ${escapeHtml(e.unit)}`
    : `${escapeHtml(e.esType)} = ${dp2(e.es)}`;
  return `${headline}${ci}`;
}

/** The statement, with its accent phrase marked if the entry names one. */
function accented(entry) {
  const s = escapeHtml(entry.statement);
  const a = entry.statementAccent ? escapeHtml(entry.statementAccent) : '';
  if (!a || !s.includes(a)) return s;
  return s.replace(a, `<span class="accent">${a}</span>`);
}

/** The `.dash` row of `.stat` tiles under the pull quote. */
function factStrip(entry, { base }) {
  const r = entry.replication;
  const s = r.study || {};
  const field = CATEGORIES[entry.category] || entry.category;
  const stats = [
    ['Verdict', replicationLabel(r.state), '#sec-does-it-replicate'],
    ['First published', String(entry.origin.year), null],
    ['Field', field, null],
    s.sites ? ['Replication sites', num(s.sites), '#sec-does-it-replicate'] : null,
    s.n ? ['Participants', num(s.n), '#sec-does-it-replicate'] : null,
    ['Sources', num((entry.sources || []).length), '#sec-sources'],
    ['Last checked', entry.checkedOn, null],
  ].filter(Boolean);
  return `  <div class="wrap-wide">
    <div class="dash" data-reveal>
${stats.map(([k, v, href]) => (href
    ? `      <a class="stat stat--link" href="${href}"><span class="s-k">${escapeHtml(k)}</span><span class="s-v">${escapeHtml(v)}</span></a>`
    : `      <div class="stat"><span class="s-k">${escapeHtml(k)}</span><span class="s-v">${escapeHtml(v)}</span></div>`)).join('\n')}
    </div>
  </div>
`;
}

/**
 * The replication block, as a `.block` in the body flow with the two effect
 * sizes rendered as a `.dash` of their own.
 *
 * The `none-located` branch is not a degraded version of the others. It states
 * that a search was made and found nothing, which is a weaker claim than "this
 * does not replicate" — and printing the weaker claim plainly is the difference
 * between an index that can be trusted about the cases where it knows something
 * and one that cannot.
 */
function replicationBlock(r, { base }) {
  const label = replicationLabel(r.state);
  const cls = REPLICATION_CLASS[r.state] || 'b-heu';
  const badge = `<span class="badge ${cls}">${escapeHtml(label)}</span>`;

  if (r.state === 'none-located') {
    return `        <p class="lead">${badge} ${escapeHtml(r.headline)}</p>
        <p>No replication attempt was found for this effect. That is not evidence that it fails: the search came up empty, and an absence in the literature says nothing either way. <a href="${base}about/">How this index searches</a>.</p>
`;
  }

  const s = r.study || {};
  const orig = esLine(r.original);
  const rep = esLine(r.replicated);
  const numbers = (orig || rep)
    ? `        <div class="dash dash--pair">
${orig ? `          <div class="stat"><span class="s-k">In the original study</span><span class="s-v">${orig}</span></div>\n` : ''}${rep ? `          <div class="stat"><span class="s-k">Pooled across the replication${r.replicated && r.replicated.weighting ? `, ${escapeHtml(r.replicated.weighting)}` : ''}</span><span class="s-v">${rep}</span></div>\n` : ''}        </div>
`
    : '';
  const cite = s.url || (s.doi ? `https://doi.org/${s.doi}` : '');

  return `        <p class="lead">${badge} ${escapeHtml(r.headline)}</p>
${numbers}${r.detail ? `        <p>${escapeHtml(r.detail)}</p>\n` : ''}        <p class="src-note">Read off ${cite ? `<a href="${escapeHtml(cite)}" rel="nofollow noopener">${escapeHtml(s.cite)}</a>` : escapeHtml(s.cite)}${r.indexedBy ? `. Located via ${escapeHtml(r.indexedBy)}, which points at the study; the numbers above are the study's own` : ''}.</p>
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
  const sources = Array.isArray(entry.sources) ? entry.sources : [];

  // The body, as blocks. One list drives both the table of contents and the
  // sections, so a heading cannot exist without a link to it or the reverse.
  const blocks = [
    ['What it claims', `What does ${entry.name} mean?`,
      `        <p class="lead">${escapeHtml(entry.meaning)}</p>\n`],
    ['Does it replicate?', `Has ${entry.name} been retested?`, replicationBlock(r, { base })],
    ['The experiments', 'What the studies actually did',
      `        <p>${escapeHtml(entry.evidence)}</p>\n`],
    ['Origin', 'Where it came from',
      `        <p><b>${escapeHtml(String(entry.origin.year))}</b>, ${escapeHtml(entry.origin.who)}, in ${escapeHtml(entry.origin.where)}.${entry.origin.note ? ` ${escapeHtml(entry.origin.note)}` : ''}</p>\n`],
    ['Where it runs out', 'The limits of the claim',
      `        <p>${escapeHtml(entry.limits)}</p>\n`],
    ['Commonly misread as', 'What people get wrong about it',
      `        <p>${escapeHtml(entry.misreadings)}</p>\n`],
    ['Sources', 'Everything this page rests on',
      `        <ol class="src-list">
${sources.map((s) => {
    const href = s.url || (s.doi ? `https://doi.org/${s.doi}` : '');
    return `          <li>${href ? `<a href="${escapeHtml(href)}" rel="nofollow noopener">${escapeHtml(s.text)}</a>` : escapeHtml(s.text)}${s.type ? ` <span class="vd-st">${escapeHtml(s.type)}</span>` : ''}</li>`;
  }).join('\n')}
        </ol>
        <p class="src-note">Every claim on this page was held against these sources on ${escapeHtml(entry.checkedOn)}. Nothing here is written from memory.</p>\n`],
  ].map(([label, h2, body]) => ({ id: `sec-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, label, h2, body }));

  // ONE question, and deliberately only one. An earlier draft asked three, and
  // two of them were headings further up the same page with the same paragraph
  // underneath — a FAQPage that is a copy of the body is the shape that gets
  // FAQ markup ignored, and the shape that makes a page read as generated.
  const faq = hubFaq([
    {
      q: `Is ${entry.name} real?`,
      a: `${escapeHtml(r.headline)} ${r.state === 'none-located'
        ? 'No replication attempt has been located, which is a statement about the literature rather than about the effect.'
        : 'The effect sizes from the original study and from the replication are printed side by side above, so the comparison is visible rather than asserted.'}`,
    },
  ], { heading: `About ${entry.name}` });

  const description = `${entry.statement} ${r.headline}`;

  const section = `<section class="entry">
  <div class="wrap">
    <nav class="crumb" aria-label="Breadcrumb"><a href="${base}">Home</a><span class="sep">/</span><a href="${base}browse/">Browse</a><span class="sep">/</span>${escapeHtml(entry.name)}</nav>
    <div class="entry-meta" style="margin-top:18px">
      <span>№ ${String(entry.no).padStart(3, '0')}</span><span class="dot"></span>
      <a class="badge ${REPLICATION_CLASS[r.state] || 'b-heu'}" href="#sec-does-it-replicate">${escapeHtml(replicationLabel(r.state))}</a><span class="dot"></span>
      <span class="cat">${escapeHtml(String(field).toLowerCase())}</span><span class="dot"></span>
      <span>first published ${escapeHtml(String(entry.origin.year))}</span>
    </div>
    <h1 class="law-title">${escapeHtml(entry.name)}</h1>
${aliases.length ? `    <div class="aka">also known as — ${aliases.map((a) => escapeHtml(a)).join(' · ')}</div>\n` : ''}    <blockquote class="entry-stmt">${accented(entry)}</blockquote>
  </div>
</section>
${factStrip(entry, { base })}  <div class="wrap-wide">
    <div class="entry-layout">
      <nav class="toc" aria-label="On this page">
${blocks.map((b) => `        <a href="#${b.id}">${escapeHtml(b.label)}</a>`).join('\n')}
      </nav>
      <div class="lawmain">
${blocks.map((b) => `        <div class="block" id="${b.id}" data-reveal>
        <div class="lbl">${escapeHtml(b.label)}</div>
        <h2 class="block-h">${escapeHtml(b.h2)}</h2>
${b.body}        </div>`).join('\n')}

        <div class="sk-share">
${shareRow({ url: `${origin}${base}${path}`, title: entry.name, text: entry.statement, label: 'Share this entry' })}        </div>

${faq.html}      </div>
    </div>
  </div>
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
