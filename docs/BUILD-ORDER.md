# Build order

What gets written, in what order, and why. The machine-readable version is
`src/data/candidate-set.json`; this file is the argument behind it.

## What replaced the old list

The first version of this file ranked 177 names taken from Wikipedia's
`Category:Cognitive_biases`. That list was wrong in a way that only shows up
when you look at what is missing from it: **confirmation bias, anchoring,
Dunning–Kruger, the availability heuristic, the halo effect and survivorship
bias were all absent.** Its top row was Pareidolia at 43,737 views a month.
Dunning–Kruger alone gets 122,562. A ranking that omits the six best-known
cognitive biases is not a ranking of cognitive biases.

The cause was the source. `Category:Cognitive_biases` is a maintenance category
that a lot of well-known articles simply do not carry, and it also contains
works, historical events and concepts too broad for an entry. The category was
doing two jobs badly: deciding membership, and implying demand.

## How the candidate set is built now

Two sources, one of them curated by hand upstream:

1. **[List of cognitive biases](https://en.wikipedia.org/wiki/List_of_cognitive_biases)** — the
   article, not the category. Every row there is a named bias with a one-line
   description and at least one citation, grouped under the taxonomy the article
   itself uses: Estimation, Decision, Hypothesis assessment, Causal attribution,
   Recall, Opinion reporting. 206 unique articles. Membership here is treated as
   sufficient for a candidate.
2. **`Category:Cognitive biases` and `Category:Memory biases`** — for names the
   list article misses. 143 further candidates.

`Category:Decision-making`, `Category:Heuristics`, `Category:Behavioral
economics` and `Category:Prejudices` were pulled and then dropped. They
contributed power of attorney, operations research, admissible heuristic,
parallel tempering, cross-entropy method and snob — the first two are unrelated,
the middle three are computer-science heuristics that share a word with the
psychology, and the last is a social attitude rather than a judgement error.
Keeping them would have meant hand-filtering several hundred rows to recover a
handful of real entries.

Redirects were resolved to canonical titles before deduplication, so
`Anchoring (cognitive bias)` and `Anchoring effect` are one candidate and not
two. The redirect names are kept per candidate as `redirects_here`; they are the
alias list a reader is likely to search for.

**349 candidates, 16 excluded by hand, 333 to write.** Each exclusion carries its
reason in the JSON — books (*Thinking, Fast and Slow*), parent concepts
(`Cognitive bias`, `Heuristic`), research malpractices that are not judgement
errors (`Data dredging`, `P-hacking`), and one-off events.

## The second source, and why the set needed one

333 candidates and not one of them is ego depletion, power posing, the bystander
effect, stereotype threat or the peak-end rule. Two of the three entries written
before this file was rewritten are not in it either.

That is not an oversight in the collection; it is what the source indexes. The
List of cognitive biases is a taxonomy of named *biases*, and the famous
replication failures are named *effects* from the experimental literature. They
never appear in a list of biases because nobody files them there, and they are
the entries this site is best at.

So the candidate set carries a `supplement`, assembled from the multi-laboratory
projects rather than from any category listing. It currently holds the sixteen
effects of Many Labs 1 with their original and replication effect sizes, read
off Table 2 of the paper. Many Labs 2 through 5, the Registered Replication
Reports, the Reproducibility Project: Psychology and the Social Sciences
Replication Project have to be added the same way, one table at a time, and the
supplement is incomplete until they are.

Reading those tables by hand is the only method that works here, and it is not
optional caution. The anchoring entry initially printed a weighted effect size
under the unweighted label, and a 95% interval as 99%, because Table 2 puts
original, unweighted and weighted figures in adjacent column pairs and I matched
them in the wrong order. Nothing was invented; a correct number was read off the
wrong column, which is the failure this project has to guard against most and
the one that leaves no trace.

## Demand

Twelve-month mean of monthly Wikipedia pageviews, August 2025 to July 2026,
all-access, user agents only, from the Wikimedia REST pageviews API. It measures
what people already go looking for, which is the only demand signal available
before the site has traffic of its own. It is not a traffic forecast.

## The order

**Written first, ranked by demand second — but the gap between the two is much
smaller than it looked.**

The site leads with what happened when a bias was retested, so an entry with
nothing to say there is missing the thing that makes it worth reading. That was
the reason the old file demoted its own ranking: matching the 177 names against
FORRT's Replication Database produced exactly one usable verdict, and the
strongest entries — ego depletion, facial feedback, power posing — were not on
the list at all.

Both halves of that still stand, and the second one is why the supplement above
exists rather than being fixed by a better bias list: the famous
replication-crisis effects are absent from the list article too. What has
changed is that they are now collected on purpose, from the replication
projects, instead of being noticed one at a time when an entry gets written.
FReD remains an index rather than a source, and a replication verdict is still
read off the paper.

So the working order is:

1. **High demand with a real replication record.** The top of the ranking
   intersected with the multi-lab literature: Many Labs 1–5, the Registered
   Replication Reports, the Reproducibility Project: Psychology, the Social
   Sciences Replication Project. These are the entries that are both looked up
   and worth reading. This is the front of the queue.
2. **High demand, no replication record located.** Written anyway, in ranking
   order, saying plainly that no replication attempt was found. That is a true
   statement about the literature and a more useful one than silence — but it is
   not the reason this site exists, so it follows the first group.
3. **The tail**, in ranking order.

`none-located` is a verdict, not a gap. What it must never become is the
default that gets written because checking was hard: the state means a search
was made and came up empty, and every entry carrying it says where the search
looked.

## Overlap with The Law Tome

66 of these names already have entries on The Law Tome. Two of my own sites
holding self-canonical pages on anchoring is the same duplicate-content problem
the Law Tome already has across two hosts. Unresolved, and it is a decision
about canonical URLs rather than about which prose is better.

## Regenerating the candidate set

The set is a snapshot with a `generated` date, not a live query. Rebuild it when
the ranking has visibly aged: pull the list article's wikitext and the two
categories, resolve redirects, then average twelve months of pageviews per
canonical title. The pageviews API rate-limits hard at any real concurrency —
serial requests with a short delay finish 564 titles in about four minutes,
where eight parallel workers spent the same time collecting 429s and writing
zeros. A zero from a rate limit and a zero from an unread article are
indistinguishable once stored, which is how the first attempt produced a
candidate file where confirmation bias had no readers.
