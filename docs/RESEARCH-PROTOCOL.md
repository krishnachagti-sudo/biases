# How an entry gets researched

Entries are researched by delegated agents working one bias each, in parallel.
This file is the brief they are given and the reasoning behind it. It exists
because the protocol is the only thing standing between this site and a corpus
of confident nonsense, and a protocol that lives in one person's head is not a
protocol.

## The rule

**Never write a fact you have not read in a source you fetched during the task.**

No dates, names, effect sizes, confidence intervals, sample sizes, journal
names, page numbers or DOIs from memory. If something cannot be verified, leave
it out, or say on the page that it could not be verified.

A researcher under pressure to produce a citation will occasionally produce one
that looks perfect and does not exist: right author, plausible title, plausible
journal, invented DOI. That is the failure this whole apparatus is built
against, and an incomplete entry is enormously preferable to it.

## The three secondary rules

**An index is not a source.** Wikipedia, FORRT's replication database, blog
posts and bias dictionaries are for *finding* papers. What a paper *found* is
read off that paper, or off its abstract at the publisher, PubMed or Crossref.

**A number you can only reach at one remove is labelled as such.** Several
entries quote figures from a paywalled meta-analysis via a later paper's
description of it. That is allowed, and the page says so in as many words, and
the figure does not go into the structured effect-size fields. The difference
between quoting a source and quoting someone quoting a source matters, and a
reader can only see it if the page draws it.

**A number you computed is not a number you read.** One entry briefly carried a
confidence interval reconstructed from reported means, standard deviations and
sample size, labelled approximate. It was removed. The arithmetic was right and
the figure appears in no source, which is the only test that matters here.

## What the agent is given

- The bias, the entry number, and the target filename.
- `docs/ENTRY-SCHEMA.md` for the fields and `docs/VOICE.md` for the prose.
- Two existing entries as exemplars, chosen to match the situation. For a
  contested effect, `dunning-kruger-effect.json`. For an entry that has to
  record what it could not obtain, `halo-effect.json`. For a famous story whose
  retellings turn out to be wrong, `curse-of-knowledge.json`.
- Specific leads: the papers to chase by name, and the traps to expect. Naming
  the likely confusions in advance is what keeps an agent from writing about
  the wrong thing, for example by treating the retrospective gambler's fallacy
  as a replication of the ordinary one.
- Instructions to assign whichever `state` the evidence supports, with an
  explicit reminder that `mixed` exists for genuine disagreement and
  `none-located` means a search was made and came up empty.

## What the agent must not do

Touch git. Agents leave the working tree dirty and report; the review, the
commit and the commit message happen here. An agent that commits its own work
has removed the only step where somebody else looks at it.

## The gates

Every entry passes four before it is committed:

| gate | what it catches |
|---|---|
| `npm run build` | schema violations, missing required fields, bad slugs |
| `npm run style` | em dashes, banned constructions, sentence length |
| `npm test` | rendering and template regressions |
| `npm run sources` | DOIs that do not resolve, or resolve to something else |

The last one is the one that matters for delegated work, and it is the reason
delegation is safe enough to do at all. See the header of
`build/check-sources.mjs` for what it does and for the two bugs its own first
run had.

## What the report is for

The agent's report is not a summary of the entry. The entry says what was found;
the report says **what could not be found and was therefore left out**. That
half never appears in the file and is the only way to know whether an absence is
a considered omission or an oversight.

Reports have surfaced, among other things: an effect size available only in a
search-engine snippet; a coefficient whose own paper's table and discussion
disagree; a condition mean rendered illegibly by OCR; a Bayesian credible
interval that would have been silently coerced into a frequentist field; and two
papers behind paywalls that were named on the page rather than quietly dropped.

## Two citation errors this protocol has already caught

Both are repeated widely, including by sources that should know better.

**Zeigarnik's 1927 paper.** The DOI attached to it across the literature,
`10.1007/BF02409755`, resolves to a record titled *Untersuchungen zur
Handlungs- und Affektpsychologie* with Kurt Lewin as sole author. It is the
volume's framing article, not hers. The entry cites a fetchable copy of the
English translation and states the discrepancy rather than passing a Lewin DOI
off as Zeigarnik's.

**The tappers-and-listeners study.** Never peer reviewed; it is a chapter of a
1990 Stanford doctoral dissertation. The dissertation contradicts itself on its
central count, giving two of 150 in the abstract, three of 150 in the
discussion, and three of 120 in the results and the table. Only the last is
consistent with its own design and with the 2.5% everyone quotes. The title
usually attached to it is also not its title.

Neither was found by doubting the story. Both were found by opening the
document.
