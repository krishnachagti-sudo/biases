// The front door.
//
// Written by hand and deliberately small. It is the first page of a site whose
// corpus does not exist yet, and the temptation at this stage is to render the
// shape of a finished encyclopedia — a hero counting entries, a grid of cards,
// a footer of browsing axes — around nothing. That page would be a lie told in
// layout rather than in words, and it is the exact failure mode the fork notes
// warn about: inheriting a finished shape without earning any of it.
//
// So this page says what the index will be, states plainly what is not built,
// and links to the two pages that exist. It grows a section when there is
// something true to put in it.

import { head, sprite, header, footer, escapeHtml, BRAND, KICKER, founderNode } from './partials.mjs';
import { hubFaq } from './hub.mjs';
import { LASTMOD_TOKEN } from '../../build/lastmod.mjs';

/**
 * @param {object} o
 * @param {number} o.count entries currently published
 * @param {number} o.mapped candidate biases identified and ranked but not yet written
 */
export function homePage({ base = '/', origin = '', count = 0, mapped = 0 } = {}) {
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

  const section = `<section class="sec">
  <div class="wrap">
    <div class="sec-head">
      <h1>${escapeHtml(BRAND)}</h1>
      <span class="sub">${escapeHtml(KICKER)}</span>
    </div>
    <p class="hub-answer">${answer}</p>
    <p class="sec-lede">Most places you can look up a cognitive bias will tell you what it is. Very few will tell you whether the study behind it survived being run again. That is the gap this index is built around, and it is the reason the entries take longer to write than they would if the job were summarising.</p>

    <h2 class="vd-h">What is here so far</h2>
    <p class="vd-p">${count > 0
      ? `${n(count)} ${count === 1 ? 'entry' : 'entries'}, out of ${n(mapped)} biases identified.`
      : `Nothing yet. ${n(mapped)} biases have been identified and ranked by how often people look them up; the entries themselves are being written. This page will count them as they land.`}</p>

    <p class="vd-full"><a class="btn" href="${base}browse/">See what is published</a></p>

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
