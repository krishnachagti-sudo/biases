// The pages that are not entries and not the front door: /browse/, /about/, and
// the 404. Small enough to share a file until one of them needs more.

import { head, sprite, header, footer, escapeHtml, shareRow, BRAND, founderNode } from './partials.mjs';
import { hubHead, hubNav, hubFaq, hubJsonLd } from './hub.mjs';

const n = (x) => Number(x).toLocaleString('en-US');

/**
 * /browse/ — the index of entries.
 *
 * Rendered even when there is nothing to list. An empty browse page that says
 * so is a better answer to a reader who clicked "browse" than a 404, and it is
 * the page that will grow first.
 */
export function browsePage({ base = '/', origin = '', entries = [], mapped = 0 } = {}) {
  const count = entries.length;
  const answer = count > 0
    ? `${n(count)} cognitive biases are published in this index, listed here alphabetically.`
    : `No entries are published yet. ${n(mapped)} biases have been identified and ranked for this index; this page lists them as they are written.`;

  const list = count > 0
    ? `    <ul class="coll-laws">
${entries.map((e) => `      <li><a href="${base}bias/${escapeHtml(e.slug)}/">${escapeHtml(e.name)}</a></li>`).join('\n')}
    </ul>
`
    : `    <p class="vd-p">The build order is by how often each bias is looked up, so the entries that arrive first are the ones people are already searching for. Nothing is listed here before it is written and sourced.</p>
`;

  const faq = hubFaq([
    {
      q: 'Why is the list empty?',
      a: `Because writing an entry takes longer than listing one. Each carries a claim, its origin, its limits and — where a replication record exists — what happened when the experiments were repeated, all traced to sources that can be fetched and read. Listing the ${n(mapped)} names before the entries exist would make this page look full and be worth nothing.`,
    },
  ], { heading: 'About this list' });

  const description = count > 0
    ? `Every cognitive bias published in ${BRAND}, listed alphabetically.`
    : `The index of cognitive biases in ${BRAND}. Being written now; entries are listed here as they are published.`;

  const section = `<section class="sec">
  <div class="wrap">
${hubHead({
    title: 'Browse',
    sub: count > 0 ? `${n(count)} published` : 'nothing published yet',
    answer,
    base,
    crumbs: [],
  })}${list}
${faq.html}${hubNav('browse/', { base })}  </div>
</section>
`;

  return (
    head({
      title: `Browse Every Cognitive Bias | ${BRAND}`,
      description,
      base,
      origin,
      path: 'browse/',
      jsonld: [
        ...hubJsonLd({
          name: 'Browse',
          description,
          path: 'browse/',
          origin,
          base,
          crumbs: [],
          items: entries.map((e) => ({ name: e.name, href: `bias/${e.slug}/` })),
        }),
        ...(faq.jsonld ? [faq.jsonld] : []),
      ],
    })
    + sprite() + header({ base, active: 'browse', count: count > 0 ? count : null }) + section + footer({ base })
  );
}

/**
 * /about/ — the method, and the identity claims that hang off it.
 *
 * This page carries the Person node every other page points at, so it is the
 * one page that must exist before any structured data on the site is coherent.
 */
export function aboutPage({ base = '/', origin = '', mapped = 0 } = {}) {
  const answer = `${escapeHtml(BRAND)} is written and maintained by one person, Krishna Chagti. Every factual claim in an entry is checked against a source that can be fetched and read, and that source is linked from the entry.`;

  const faq = hubFaq([
    {
      q: 'Where do the entries come from?',
      a: 'From the published literature, read directly. Not from memory, not from summarising an encyclopedia article, and not from translating one. Where a claim cannot be traced to something a reader can open, it does not go in the entry — and where the historical record is genuinely disputed, the entry says it is disputed rather than picking a side quietly.',
    },
    {
      q: 'Where do the replication figures come from?',
      a: 'From <a href="https://doi.org/10.17605/OSF.IO/9R62X" rel="nofollow noopener">FORRT’s Replication Database</a>, a crowdsourced academic record of replication attempts, licensed CC BY 4.0. They are quoted and attributed, never assessed here. An entry with no replication record says so; silence in the database is not evidence either way, and presenting it as a verdict would be the worst thing this index could do with someone else’s data.',
    },
    {
      q: 'How do I report an error?',
      a: 'Open an issue on <a href="https://github.com/krishnachagti-sudo/bias-atlas" rel="nofollow noopener">the repository</a>. Corrections that turn out to be right are made and the entry says what changed.',
    },
    {
      q: 'Can I reuse this?',
      a: 'The corpus is licensed <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a> — reuse it, with attribution. Quoted replication data carries FORRT’s own CC BY 4.0 terms and its attribution travels with it.',
    },
  ], { heading: 'Questions about the method' });

  const description = `How ${BRAND} is written: what counts as a source, where the replication figures come from, and how to report an error.`;

  const section = `<section class="sec">
  <div class="wrap">
${hubHead({
    title: 'About',
    answer,
    lede: `The index is being written now. ${n(mapped)} biases have been identified and ranked by how often people look them up, which is the build order; the entries are written one at a time against their sources.`,
    base,
    crumbs: [],
  })}
    <h2 class="vd-h">What an entry has to contain before it is published</h2>
    <p class="vd-p">A statement of the claim in one sentence. Who made it, when, and in what publication. What the evidence actually was, as opposed to what the claim has come to mean. Where the idea runs out. What people get wrong about it. And, where a record exists, what happened when the underlying experiments were repeated.</p>

    <h2 class="vd-h">What it must not contain</h2>
    <p class="vd-p">A date, a name or a finding that has not been checked against a source in front of the writer. A biography written from memory. A confident sentence standing in for an unclear record. These are the failure modes of writing at volume about a subject with a long history, and the reason each is named here is that naming it is what makes it checkable later.</p>

    <div class="sk-share">
${shareRow({ url: `${origin}${base}about/`, title: `About ${BRAND}`, text: 'How this index is written and sourced.', label: 'Share this page' })}    </div>

${faq.html}${hubNav('about/', { base })}  </div>
</section>
`;

  return (
    head({
      title: `About & Method | ${BRAND}`,
      description,
      base,
      origin,
      path: 'about/',
      jsonld: [
        ...hubJsonLd({ name: 'About', description, path: 'about/', origin, base, crumbs: [] }),
        founderNode(origin, base),
        ...(faq.jsonld ? [faq.jsonld] : []),
      ],
    })
    + sprite() + header({ base, active: 'about' }) + section + footer({ base })
  );
}

/**
 * 404.
 *
 * Served under whatever URL was missed, so it declares no canonical of its own
 * and is marked noindex — preflight enforces both, because a 404 that claims a
 * canonical is a 404 competing with real pages in the index.
 */
export function notFoundPage({ base = '/', origin = '' } = {}) {
  const section = `<section class="sec">
  <div class="wrap">
    <div class="sec-head"><h1>Not here</h1></div>
    <p class="hub-answer">That page does not exist. It may never have, or it may have been renamed — either way, nothing on this site links to it.</p>
    <p class="vd-full"><a class="btn" href="${base}browse/">Browse the index</a></p>
  </div>
</section>
`;
  return (
    head({
      title: `Page Not Found | ${BRAND}`,
      description: 'That page does not exist on this site.',
      base,
      origin,
      robots: 'noindex, follow',
    })
    + sprite() + header({ base }) + section + footer({ base })
  );
}
