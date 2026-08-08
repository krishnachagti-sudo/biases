// The front door.
//
// The first draft was written for an empty corpus, and the argument for keeping
// it small was sound: rendering the shape of a finished encyclopedia around
// nothing is a lie told in layout, and inheriting that shape is the failure the
// fork notes warn about.
//
// It then stayed small after the corpus stopped being empty, which is the
// opposite mistake and a worse one. A visitor arriving at a site with three
// finished entries was shown a count, a button, and none of the entries. The
// caution that was honest on day one had become a page that hid its own
// contents.
//
// So the rule is not "stay small". It is that every section states something
// true about what exists — including, once anything does, the thing itself.

import { head, sprite, header, footer, escapeHtml, BRAND, KICKER, founderNode } from './partials.mjs';
import { hubFaq } from './hub.mjs';
import { entryPath, replicationLabel } from './entry.mjs';
import { LASTMOD_TOKEN } from '../../build/lastmod.mjs';

const REP_CLASS = { replicated: 'b-emp', failed: 'b-con', mixed: 'b-heu', 'none-located': 'b-folk' };

/**
 * @param {object} o
 * @param {object[]} o.entries the published corpus, newest work first
 * @param {number} o.mapped candidate biases identified and ranked but not yet written
 */
export function homePage({ base = '/', origin = '', entries = [], mapped = 0 } = {}) {
  const count = entries.length;
  const n = (x) => Number(x).toLocaleString('en-US');

  // The one sentence an answer engine can lift whole. It has to be true on the
  // day the corpus is empty and true on the day it is finished, which rules out
  // every phrasing that leads with a number we do not have yet.
  const answer = count > 0
    ? `${escapeHtml(BRAND)} is an index of ${n(count)} cognitive biases, each with what the claim is, who first made it, and what happened when the experiments behind it were repeated.`
    : `${escapeHtml(BRAND)} is an index of cognitive biases — what each claim is, who first made it, and what happened when the experiments behind it were repeated. It is being written now: ${n(mapped)} biases have been identified and ranked, and none of the entries are published yet.`;

  const faq = hubFaq([
    {
      q: 'What counts as a cognitive bias here?',
      a: 'A named, documented pattern in how people judge or remember, described in the research literature. Not every heading in Wikipedia’s bias category qualifies — the category contains works, historical events and concepts too broad to be one entry — so membership is a judgement made per entry and recorded, not a filter applied in bulk.',
    },
    {
      q: 'Why does replication get its own field?',
      a: 'Because for a large part of this subject it is the answer to the question readers actually have. Many of the best-known biases come from social-psychology experiments run before the discipline’s replication reckoning, and whether those experiments held up is published, checkable and mostly absent from the places people look these ideas up. Where a replication record exists it is quoted from <a href="https://doi.org/10.17605/OSF.IO/9R62X" rel="nofollow noopener">FORRT’s Replication Database</a> and attributed. Where none exists, the entry says so rather than implying one.',
    },
    {
      q: 'How is any of this verified?',
      a: `Every fact on an entry — a date, a name, a claim about what a paper found — is checked against a source that can be fetched and read, and the source is linked. Nothing is written from memory. Where the record is genuinely unclear, the entry says the record is unclear. <a href="${base}about/">The method, in full</a>.`,
    },
  ], { heading: 'About this index' });

  // The entries themselves, on the front page.
  //
  // This section used to be one sentence — "3 entries, out of 177 biases
  // identified" — and a button. It was written when the corpus was empty and
  // never revisited when it stopped being empty, so the front door of a site
  // with three finished entries showed a reader none of them and asked them to
  // click to find out whether anything existed. Correctly described as nothing
  // being there.
  //
  // What a visitor wants first is the thing the site is for: the name, the
  // claim, and the verdict. So that is what is here, in full, for as long as
  // the corpus is small enough to print whole. When it outgrows the page this
  // becomes a selection, and the rule for what gets selected will need its own
  // argument.
  const list = count > 0
    ? `    <div class="vd-cmp home-entries">
${entries.map((e) => `      <a class="vd-c" href="${base}${entryPath(e)}">
        <span class="vd-cn">${escapeHtml(e.name)}</span>
        <span class="vd-cl"><span class="badge ${REP_CLASS[e.replication.state] || 'b-heu'}">${escapeHtml(replicationLabel(e.replication.state))}</span> ${escapeHtml(e.replication.headline)}</span>
      </a>`).join('\n')}
    </div>
`
    : '';

  const section = `<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <h1>${escapeHtml(BRAND)}</h1>
      <span class="sub">${escapeHtml(KICKER)}</span>
    </div>
    <p class="hub-answer">${answer}</p>
    <p class="sec-lede">Most places you can look up a cognitive bias will tell you what it is. Very few will tell you whether the study behind it survived being run again. That is the gap this index is built around, and it is the reason the entries take longer to write than they would if the job were summarising.</p>

    <h2 class="vd-h">${count > 0 ? 'Published so far' : 'What is here so far'}</h2>
${count > 0 ? '' : `    <p class="vd-p">Nothing yet. ${n(mapped)} biases have been identified and ranked by how often people look them up; the entries themselves are being written. This page will count them as they land.</p>\n`}${list}
    <p class="vd-full"><a class="btn" href="${base}browse/">${count > 0 ? `Browse all ${n(count)}` : 'See what is published'}</a></p>

${faq.html}  </div>
</section>
`;

  const description = count > 0
    ? `An index of ${n(count)} cognitive biases: what each one claims, who first claimed it, and what happened when the experiments behind it were repeated.`
    : 'An index of cognitive biases: what each one claims, who first claimed it, and what happened when the experiments behind it were repeated. Being written now.';

  return (
    head({
      title: `${BRAND} — Cognitive Biases, and What Replicated`,
      description,
      base,
      origin,
      path: '',
      jsonld: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${origin}${base}#website`,
          name: BRAND,
          url: `${origin}${base}`,
          description,
          inLanguage: 'en',
          license: 'https://creativecommons.org/licenses/by/4.0/',
          creator: founderNode(origin, base),
          dateModified: LASTMOD_TOKEN,
        },
        ...(faq.jsonld ? [faq.jsonld] : []),
      ],
    })
    + sprite()
    + header({ base, count: count > 0 ? count : null })
    + section
    + footer({ base })
  );
}
